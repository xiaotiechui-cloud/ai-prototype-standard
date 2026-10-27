"""Bounded, read-only review of cached evidence; not a browser acceptance runner."""
from pathlib import Path
import collections, hashlib, json, re, xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
CACHE = HERE / '_data'
REPO = HERE.parents[2]
INV = json.loads((HERE/'01_输入与结构清单.json').read_text('utf-8'))
TRIAL = Path(INV['inputs'][0]['path']).parent

def save(name, value):
    (CACHE/name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def loc(file, term):
    path = CACHE/file
    rows = path.read_text('utf-8').splitlines()
    return [{'file': '_data/'+file, 'line': i+1, 'excerpt': s[:240]}
            for i,s in enumerate(rows) if term in s]

sources = {
    'variant': ('trial-script-1.js', "const buyCard = C('WEB-DETAIL-01-C04'"),
    'variant_wrapper': ('trial-script-1.js', 'function C('),
    'variant_style': ('trial.css', '.web-buy-card{'),
    'host': ('trial.css', '.web .overlay{'),
    'host_height': ('trial.css', '.web .overlay .sheet{'),
    'buy_background': ('trial-script-1.js', "webBackdrop('商品详情上下文'"),
    'buy_close': ('trial-script-1.js', "reg('close-buy'"),
    'navigation': ('trial-script-1.js', 'function navigate('),
    'back': ('trial-script-1.js', 'function back('),
    'numeric_sort': ('trial-script-1.js', '<label>排序</label>'),
    'up_sort': ('trial-script-1.js', 'data-act="adm-hot-up"'),
    'home_draft': ('trial-script-1.js', "reg('adm-home-draft'"),
    'home_preview': ('trial-script-1.js', "reg('adm-home-preview'"),
    'home_publish': ('trial-script-1.js', "reg('adm-do-home-publish'"),
    'instance_owner': ('trial-script-1.js', "right: serviceBtn('APP-HOME-01-C07')"),
    'canvas_replacement': ('trial-script-1.js', 'canvas.innerHTML = html'),
    'review_selector': ('trial-script-1.js', "$('#compSel')?.addEventListener"),
    'review_outline': ('trial-script-1.js', "$('#outlineBtn')?.addEventListener"),
    'quick_contract': ('03_组件级文档.md', '快捷导航四列'),
    'sort_contract': ('03_组件级文档.md', '排序使用拖拽手柄'),
    'quick_override': ('09_待确认事项与设计决策.md', '| 首页快捷导航 |'),
    'profile_contract': ('01_页面与状态说明.md', 'WEB-DETAIL-01-C04'),
}
save('evidence-locators.json', {k:loc(*v) for k,v in sources.items()})

# Analyse only the explicit-state syntax actually used by these supplied diagrams.
# This is not a general PlantUML parser or a replacement for its renderer.
graphs=[]
for f in sorted(CACHE.glob('*.puml')):
    src=f.read_text('utf-8')
    root=ET.fromstring(f.with_suffix('.svg').read_bytes())
    texts=[''.join(t.itertext()) for t in root.iter() if t.tag.rsplit('}',1)[-1]=='text']
    decl=[{'id':m[2], 'label':m[1], 'line':src.count('\n',0,m.start())+1}
          for m in re.finditer(r'^state\s+"([^"]*)"\s+as\s+(\w+)', src, re.M)]
    edges=re.findall(r'^\s*([\w*\[\]]+)\s*-->\s*([\w*\[\]]+)',src,re.M)
    connected={x for edge in edges for x in edge}
    isolated=[n for n in decl if n['id'] not in connected]
    missing=[n for n in decl if n['label'] not in texts]
    graphs.append({'id':f.stem,'source_file':'_data/'+f.name,
                   'svg_file':'_data/'+f.with_suffix('.svg').name,
                   'explicit_states':len(decl),'edges_in_supported_syntax':len(edges),
                   'isolated_explicit_states':isolated,
                   'declared_state_labels_not_found_in_svg':missing,
                   'svg_text_count':len(texts),
                   'repeated_svg_text':{k:v for k,v in collections.Counter(texts).items() if v>1},
                   'decision_glyph_labels':[n for n in decl if n['label'].startswith('◇')],
                   'svg_has_node_identity_attributes':any('data-entity' in x.attrib or 'data-node-id' in x.attrib for x in root.iter()),
                   'geometry_status':'Browser text bbox / transforms / clipping not measured'})
save('diagram-node-review.json',graphs)

# Check whether delivered sidecars and in-HTML docs share normalized text.
html_path=TRIAL/'02_低保真交互原型.html'
html=html_path.read_text('utf-8-sig')
start=re.search(r'window\.__INJECT__\s*=\s*',html).end()
inj,_=json.JSONDecoder().raw_decode(html[start:])
docs=[]
for d in inj['DOCS']:
    external=(TRIAL/d['file']).read_text('utf-8-sig')
    norm=lambda s:s.replace('\r\n','\n').rstrip()+'\n'
    docs.append({'file':d['file'],'same_normalized_text':norm(external)==norm(d['md']),
                 'external_normalized_sha256':hashlib.sha256(norm(external).encode()).hexdigest(),
                 'embedded_normalized_sha256':hashlib.sha256(norm(d['md']).encode()).hexdigest()})
block=list(re.finditer(r'<script\b[^>]*>([\s\S]*?)</script>',html,re.I))[1]
style=re.search(r'<style\b[^>]*>([\s\S]*?)</style>',html,re.I)
bindings={'html_sha256':hashlib.sha256(html_path.read_bytes()).hexdigest(),
          'html_bytes':html_path.stat().st_size,'normalized_document_parity':docs,
          'script_sidecar_line_1_html_line':html.count('\n',0,block.start(1))+1,
          'css_sidecar_line_1_html_line':html.count('\n',0,style.start(1))+1,
          'current_inventory_unchanged':all(hashlib.sha256(Path(x['path']).read_bytes()).hexdigest()==x['sha256'] for x in INV['inputs']),
          'final_unchanged':hashlib.sha256(Path(INV['final']['path']).read_bytes()).hexdigest()==INV['final']['sha256']}
save('input-bindings.json',bindings)
print(json.dumps({'graphs':len(graphs),'graphs_with_isolated_explicit_state':[g['id'] for g in graphs if g['isolated_explicit_states']],
                  'missing_declared_state_labels':sum(len(g['declared_state_labels_not_found_in_svg']) for g in graphs),
                  'document_parity':sum(d['same_normalized_text'] for d in docs),
                  'unchanged_inputs':bindings['current_inventory_unchanged'],
                  'final_unchanged':bindings['final_unchanged']},ensure_ascii=False))
