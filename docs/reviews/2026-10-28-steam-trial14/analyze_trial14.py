"""Read-only input audit; persist compact inventories and local source sidecars."""
from pathlib import Path
import collections, hashlib, json, re, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
DATA = ROOT / '_data'
DATA.mkdir(exist_ok=True)
TRIAL = Path(r'D:\模型汇总\GitHub维护测试\试跑14.0\Steam商城首期原型交付_V1.0')
FINAL = Path(r'D:\模型汇总\CDK商城\Steam商城原型交付_V1.5')
REPO = ROOT.parents[2]
sha = lambda b: hashlib.sha256(b).hexdigest()
read = lambda p: p.read_text(encoding='utf-8-sig')

def save(name, obj):
    (DATA / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def extract(s, key):
    m = re.search(r'window\.'+re.escape(key)+r'\s*=\s*', s)
    if m:
        obj, length = json.JSONDecoder().raw_decode(s[m.end():])
        return obj

def inventory(folder):
    out=[]
    for p in sorted(folder.rglob('*')):
        if not p.is_file(): continue
        b=p.read_bytes()
        d={'path':str(p),'relative':p.relative_to(folder).as_posix(),'bytes':len(b),'sha256':sha(b)}
        try:
            s=b.decode('utf-8-sig')
            d.update(encoding='utf-8',lines=len(s.splitlines()),replacement_chars=s.count('\ufffd'))
        except UnicodeDecodeError:
            d['encoding']='not-utf-8'
        out.append(d)
    return out

def md_index(folder):
    out={}
    for p in sorted(folder.glob('*.md')):
        s=read(p)
        out[p.name]={'lines':len(s.splitlines()),'headings':[{'line':i+1,'title':l} for i,l in enumerate(s.splitlines()) if re.match(r'^#{1,6} ',l)],'ids':{pat:len(set(re.findall(pat,s))) for pat in [r'TC-[A-Z0-9-]+',r'CHK-\d+',r'DEC-\d+',r'AC-\d+']}}
    return out

def same_docs(folder,docs):
    out=[]
    for d in docs:
        p=folder/d['file']; norm=lambda s:s.replace('\r\n','\n').replace('\r','\n').rstrip()
        a=norm(d['md']);b=norm(read(p))
        out.append({'file':d['file'],'normalized_match':a==b,'embedded_sha256':sha(a.encode()),'external_sha256':sha(b.encode())})
    return out

def sources(s,label):
    mapping=[]
    for tag in ['style','script']:
        for n,m in enumerate(re.finditer(r'<'+tag+r'\b[^>]*>([\s\S]*?)</'+tag+'>',s,re.I)):
            # Embedded JSON globals stay in memory; only source without documents is persisted.
            if tag=='script' and (re.search(r'window\.(?:__DOCS__|DOCS)\s*=',m.group(1)) or len(m.group(1))>500000): continue
            suffix='css' if tag=='style' else 'js'
            name=f'{label}-{tag}-{n}.{suffix}'
            (DATA/name).write_text(m.group(1),encoding='utf-8')
            mapping.append({'file':name,'html_start_line':s.count('\n',0,m.start(1))+1,'line_offset':s.count('\n',0,m.start(1))})
    return mapping

ts=read(TRIAL/'02_低保真交互原型.html')
pages=extract(ts,'__PAGES__');comps=extract(ts,'__COMP_DOCS__');diags=extract(ts,'__DIAGRAMS__');docs=extract(ts,'__DOCS__')
save('trial-pages.json',pages)
save('trial-components-index.json',[{'id':k,'name':v['name'],'def':v['def'],'sections':list(v['sections']) if isinstance(v['sections'],dict) else len(v['sections'])} for k,v in comps.items()])
save('trial-doc-index.json',md_index(TRIAL))
save('trial-files.json',inventory(TRIAL))
save('final-files.json',inventory(FINAL))
save('final-doc-index.json',md_index(FINAL))
prior=json.loads(read(ROOT.parent/'2026-10-27-steam-trial13/_data/inventory.json'))
final_sha=sha((FINAL/'02_低保真交互原型.html').read_bytes())
assert prior['html']['final']['sha256']==final_sha, 'Final HTML changed: old inventory cannot be reused'
save('final-model-reused.json',prior['final_model'])
# Strip only embedded document bodies before local source extraction.
fs=read(FINAL/'02_低保真交互原型.html')
source_map={'trial':sources(ts,'trial'),'final':sources(fs,'final')}
save('source-map.json',source_map)
diag_index=[]
for d in diags:
    row={k:v for k,v in d.items() if k not in ['puml','svg']}
    try:
        x=ET.fromstring(d['svg'])
        texts=[e for e in x.iter() if e.tag.split('}')[-1]=='text']
        row.update(svg_xml=True,svg_texts=len(texts),empty_texts=sum(not ''.join(e.itertext()).strip() for e in texts))
    except Exception as e: row.update(svg_xml=False,error=str(e))
    diag_index.append(row)
save('trial-diagrams-index.json',diag_index)
checks={}
for p in sorted((TRIAL/'_checks').glob('*.json')):
    b=p.read_bytes()
    try: o=json.loads(b.decode('utf-8-sig'));enc='utf-8'
    except UnicodeDecodeError: o=json.loads(b.decode('gb18030'));enc='gb18030'
    checks[p.name]={'encoding':enc,'data':o}
save('producer-checks.json',checks)
profile={}
for p in REPO.joinpath('reference').rglob('*.json'):
    if 'profile' in p.name:
        profile[str(p.relative_to(REPO))]={'sha256':sha(p.read_bytes())}
save('profile-files.json',profile)
summary={'trial':{'folder':str(TRIAL),'html_sha256':sha(ts.encode()),'meta':extract(ts,'__META__'),'pages':len(pages),'states':sum(len(p['states']) for p in pages),'instances':len(comps),'definitions_referenced':len(set(c['def'] for c in comps.values())),'diagrams':len(diags),'docs':len(docs),'ends':dict(collections.Counter(p['end'] for p in pages)),'embedded_docs':same_docs(TRIAL,docs)},'final':{'folder':str(FINAL),'html_sha256':final_sha,'reused_inventory':'../2026-10-27-steam-trial13/_data/inventory.json','pages':prior['final_model']['page_count'],'states':prior['final_model']['state_count'],'diagrams':prior['final_model']['diagram_count'],'component_definitions':prior['final_model']['component_doc_count']},'source_map':source_map,'browser':'file:// denied by browser URL security policy; no independent browser testing or workaround','evidence':'Source, external documents, producer scripts/results; producer results are not independent retest.'}
summary['trial']['normalized_text_sha256'] = summary['trial']['html_sha256']
summary['trial']['html_sha256'] = sha((TRIAL/'02_低保真交互原型.html').read_bytes())
summary['hash_note'] = 'html_sha256 hashes original bytes; normalized_text_sha256 hashes UTF-8 text after BOM removal and universal-newline normalization; do not mix the two.'
save('summary.json',summary)
print(json.dumps({k: {kk:vv for kk,vv in v.items() if kk not in ['meta','embedded_docs']} if isinstance(v,dict) else v for k,v in summary.items() if k!='source_map'},ensure_ascii=False))
