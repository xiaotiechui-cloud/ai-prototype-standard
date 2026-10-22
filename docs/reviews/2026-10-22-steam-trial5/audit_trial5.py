"""Read-only inventories; never print embedded source or documents."""
from pathlib import Path
from collections import Counter
import hashlib,json,re,subprocess
OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[2]
TRIAL=Path(r'D:\模型汇总\GitHub维护测试\试跑5.0\项目原型交付_V1.1\02_低保真交互原型-试跑5.0.html')
FINAL=Path(r'D:\模型汇总\CDK商城\Steam商城原型交付_V1.0\02_低保真交互原型-最终版本.html')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def save(n,v): (OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n','utf-8')
def norm(s): return s.lstrip('\ufeff').replace('\r\n','\n').replace('\r','\n')
def data(): return json.JSONDecoder().raw_decode(TRIAL.read_text('utf-8-sig').split('window.DATA=',1)[1])[0]
def main():
 s=TRIAL.read_text('utf-8-sig'); d=data(); manifest=json.loads((ROOT/'standard-manifest.json').read_text('utf-8'))
 prior=json.loads((ROOT/'docs/reviews/2026-10-21-steam-trial4/06_当前结构清单.json').read_text('utf-8'))['final_reused']
 assert sha(FINAL)==prior['sha256'],'Final changed; prior inventory cannot be reused'
 inputs={k:{'path':str(p),'sha256':sha(p),'bytes':p.stat().st_size,'lines':sum(1 for _ in p.open(encoding='utf-8-sig'))} for k,p in [('trial',TRIAL),('final',FINAL)]}
 save('01_基线.json',{'date':'2026-10-22','head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'content_revision':manifest['content_revision'],'manifest_sha256':sha(ROOT/'standard-manifest.json'),'modules':{m['path']:sha(ROOT/m['path']) for m in manifest['modules']},'archive':{str(p.relative_to(ROOT)):sha(p) for p in (ROOT/'archive').rglob('*') if p.is_file()},'inputs':inputs,'generation_baseline':'Extract supplied self-reported provenance separately; review HEAD is not generation baseline.','scope':'comparison and concrete proposed rules only; no prototype, active-standard, commit, push or release changes','capabilities':{'static':'available','isolated_node_fixtures':'planned','browser':'not executed'}})
 pages=d['pages']; instances=[c for p in pages for c in p.get('components',[])]
 trial={'path':str(TRIAL),'sha256':sha(TRIAL),'counts_declared':d['counts'],'counts_observed':{'pages':len(pages),'states':sum(len(p['states']) for p in pages),'instances':len(instances),'definitions_referenced':len({c['def'] for c in instances}),'instance_docs':len(d['instanceDocs']),'diagrams':len(d['diagrams']),'documents':len(d['docs'])},'pages_by_end':dict(Counter(p['end'] for p in pages)),'pages':pages,'instance_documents':[{k:v for k,v in c.items() if k!='sections'}|{'sections':[(x['n'],x['title']) for x in c.get('sections',[])]} for c in d['instanceDocs'].values()],'diagrams':[{k:v for k,v in g.items() if k not in ['source','svg']} for g in d['diagrams']],'actions':dict(Counter(re.findall(r'data-act=["\']([\w-]+)',s))),'functions':[{'name':m[1],'line':s.count('\n',0,m.start())+1} for m in re.finditer(r'function\s+([\w$]+)\s*\(',s)],'script_ranges':[{'start':s.count('\n',0,m.start())+1,'end':s.count('\n',0,m.end())+1} for m in re.finditer(r'<script\b[^>]*>.*?</script>',s,re.S)]}
 save('02_结构清单.json',{'trial':trial,'final_reused':prior,'reuse_note':'Final hash verified against saved inventory; no inherited browser verdict.'})
 ds=[]
 for i,item in enumerate(d['docs']):
  p=TRIAL.parent/item['file']; ext=p.read_text('utf-8-sig') if p.exists() else None
  ds.append({'file':str(p),'external_sha256':sha(p) if p.exists() else None,'embedded_json_pointer':f'/docs/{i}/md','embedded_sha256':hashlib.sha256(item['md'].encode()).hexdigest(),'normalized_equal':ext is not None and norm(ext)==norm(item['md']),'normalization':'BOM removal and CRLF/CR to LF only','embedded_lines':len(item['md'].splitlines()),'external_lines':len(ext.splitlines()) if ext is not None else None})
 save('03_交付同源核对.json',{'documents':ds,'input':inputs['trial']})
 files=[{'path':str(p),'sha256':sha(p),'bytes':p.stat().st_size} for p in (TRIAL.parent/'_checks').rglob('*') if p.is_file()]
 save('04_随附证据清单.json',{'files':files,'identity':'supplied by artifact provider; not executed or endorsed by this review'})
 save('05_代码索引.json',{'functions':trial['functions'],'lines':[{'line':i,'length':len(l),'head':l[:120]} for i,l in enumerate(s.splitlines(),1) if len(l)<10000 and (l.startswith('  "') or l.startswith('const ') or l.startswith('let '))]})
 print(json.dumps({'counts':trial['counts_observed'],'ends':trial['pages_by_end'],'docs_equal':sum(x['normalized_equal'] for x in ds),'supplied_files':len(files),'sha256':inputs['trial']['sha256'],'lines':inputs['trial']['lines'],'top_keys':list(d),'page_titles':[(p['id'],p.get('name',p.get('title'))) for p in pages]},ensure_ascii=False))
if __name__=='__main__': main()
