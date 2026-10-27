"""Read-only input analysis. Persist compact inventories; never print source bundles."""
from pathlib import Path
import collections, hashlib, json, re

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
TRIAL = Path(r'D:\模型汇总\GitHub维护测试\试跑12.0\Steam商城首期原型交付_V1.6.0')
FINAL = Path(r'D:\模型汇总\CDK商城\Steam商城原型交付_V1.0\02_低保真交互原型-最终版本.html')
CACHE = HERE / '_data'
CACHE.mkdir(exist_ok=True)
def save(name, data):
    (HERE / name).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p): return p.read_text(encoding='utf-8-sig')
def line(s, at): return s.count('\n',0,at)+1

source = read(TRIAL/'02_低保真交互原型.html')
m = re.search(r'window\.__INJECT__\s*=\s*', source)
inj, _ = json.JSONDecoder().raw_decode(source[m.end():])
for i,m in enumerate(re.finditer(r'<script\b[^>]*>([\s\S]*?)</script>', source,re.I)):
    if not re.match(r'\s*window\.__INJECT__\s*=', m.group(1)):
        (CACHE/f'trial-script-{i}.js').write_text(m.group(1),encoding='utf-8')
css = '\n'.join(re.findall(r'<style\b[^>]*>([\s\S]*?)</style>',source,re.I))
(CACHE/'trial.css').write_text(css,encoding='utf-8')
for doc in inj['DOCS']:
    (CACHE/doc['file']).write_text(doc['md'], encoding='utf-8')
old = json.loads(read(REPO/'docs/reviews/2026-10-20-steam-trial2/evidence.json'))['final']
assert sha(FINAL)==old['sha256'], 'Final input changed; do not reuse inventory'
file_inventory=[]
for p in sorted(TRIAL.rglob('*')):
    if p.is_file():
        item={'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p)}
        if p.suffix in ['.md','.json','.html']:
            t=read(p);item.update(utf8=True,replacement_character_count=t.count('\ufffd'),lines=len(t.splitlines()))
        file_inventory.append(item)
pages=inj['PAGES']; inst=inj['INSTANCES']
save('01_输入与结构清单.json',{
    'method':'Static source and producer evidence; no independent browser run',
    'inputs':file_inventory,'final':old,'trial':{
        'pages':pages,'instances':inst,
        'definitions':[{'id':k,'name':v['name'],'sections':[s.get('title') for s in v['sections']]} for k,v in inj['COMP_DOCS'].items()],
        'diagrams':[{k:v for k,v in d.items() if k not in ['src','svg']}|{'source_chars':len(d['src']),'svg_chars':len(d['svg'])} for d in inj['DIAGRAMS']],
        'project':inj['PROJECT'],'profile':inj['PROFILE'],
        'counts':{'pages':len(pages),'states':sum(len(p['states']) for p in pages),'instances':len(inst),'definitions':len(inj['COMP_DOCS']),'diagrams':len(inj['DIAGRAMS'])}},
    'baseline_inventory_source':'../2026-10-20-steam-trial2/evidence.json#/final',
    'caution':'Final 35 registered diagrams; other historic counts may include additional source fences. IDs are not semantic equivalence.'})
rules=[]
for m in re.finditer(r'([^{}]+)\{([^{}]*)\}',css):
    rules.append({'selector':m.group(1).strip(),'declarations':m.group(2).strip(),'css_line':line(css,m.start())})
save('_data/trial-css-rules.json',rules)
for d in inj['DIAGRAMS']:
    (CACHE/(d['id']+'.puml')).write_text(d['src'],encoding='utf-8')
    (CACHE/(d['id']+'.svg')).write_text(d['svg'],encoding='utf-8')
checks={}
for p in sorted((TRIAL/'_checks').glob('*.json')):
    checks[p.name]=json.loads(read(p))
save('_data/producer-checks.json',checks)
print(json.dumps({'input_files':len(file_inventory),'final_hash_verified':True,'trial_counts':{'pages':len(pages),'states':sum(len(p['states']) for p in pages),'instances':len(inst),'definitions':len(inj['COMP_DOCS']),'diagrams':len(inj['DIAGRAMS'])},'cached_css_rules':len(rules),'output':str(HERE)},ensure_ascii=False))
