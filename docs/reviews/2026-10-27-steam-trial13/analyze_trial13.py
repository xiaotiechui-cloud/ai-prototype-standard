from pathlib import Path
import re,json,hashlib,collections
REPO=Path(r'D:\资料备份\产品蒸馏房\ai-prototype-standard'); TRIAL=Path(r'D:\模型汇总\GitHub维护测试\试跑13.0'); FINAL=Path(r'D:\模型汇总\CDK商城\Steam商城原型交付_V1.5'); OUT=REPO/'docs/reviews/2026-10-27-steam-trial13'; DATA=OUT/'_data'; DATA.mkdir(parents=True,exist_ok=True)
def read(p):return p.read_text(encoding='utf-8-sig')
def sha(b):return hashlib.sha256(b).hexdigest()
def norm(s):return s.replace('\r\n','\n').replace('\r','\n').rstrip()
def line_at(s,i):return s.count('\n',0,i)+1
def extract(s,pat):
 m=re.search(pat,s)
 return json.JSONDecoder().raw_decode(s[m.end():])[0] if m else None
def summarize_doc(s):
 return {'chars':len(s),'lines':len(s.splitlines()),'replacement_chars':s.count('\ufffd'),'headings':[{'level':len(m.group(1)),'text':m.group(2).strip(),'line':line_at(s,m.start())} for m in re.finditer(r'(?m)^(#{1,6})\s+(.+)$',s)],'metadata':{k:[{'line':i+1,'text':l[:220]} for i,l in enumerate(s.splitlines()) if k in l][:2] for k in ['规则基线','规范 commit','uiProfile','文档状态','适用PRD版本及来源章节','文档版本 / 交付批次']}}
def files(root):
 a=[]
 for p in sorted(root.rglob('*')):
  if p.is_file():
   b=p.read_bytes(); d={'path':p.relative_to(root).as_posix(),'bytes':len(b),'sha256':sha(b)}
   if p.suffix.lower() in ('.md','.json','.html'):
    try:
     s=b.decode('utf-8-sig');d.update(lines=len(s.splitlines()),replacement_chars=s.count('\ufffd'))
    except UnicodeDecodeError:d['utf8']=False
   a.append(d)
 return a
def extract_final_pages(s):
 m=re.search(r'const\s+PAGES\s*=\s*\[',s)
 if not m:return []
 start=m.end(); e=re.search(r'\]\s*;\s*const\s+ENDS\b',s[start:])
 if not e:return []
 region=s[start:start+e.start()]; blocks=[]; depth=0; q=None; esc=False; lc=False;bc=False;bt=False;st=None;i=0
 while i<len(region):
  c=region[i]; n=region[i+1] if i+1<len(region) else ''
  if lc:
   if c=='\n':lc=False
  elif bc:
   if c=='*' and n=='/':bc=False;i+=1
  elif q:
   if esc:esc=False
   elif c=='\\':esc=True
   elif c==q:q=None
  elif bt:
   if esc:esc=False
   elif c=='\\':esc=True
   elif c=='`':bt=False
  elif c=='/' and n=='/':lc=True;i+=1
  elif c=='/' and n=='*':bc=True;i+=1
  elif c in "'\"":q=c
  elif c=='`':bt=True
  elif c=='{':
   if depth==0:st=i
   depth+=1
  elif c=='}':
   depth-=1
   if depth==0 and st is not None:blocks.append((st,region[st:i+1]));st=None
  i+=1
 out=[]
 for off,b in blocks:
  mid=re.search(r"\bid\s*:\s*'([^']+)'",b); en=re.search(r"\bend\s*:\s*'([^']+)'",b); nm=re.search(r"\bname\s*:\s*'([^']*)'",b)
  if mid:
   states=[]; sm=re.search(r'\bstates\s*:\s*\[',b)
   if sm:
    tail=b[sm.end():]; dep=1;q=None;esc=False;arr_start=0;top=[];j=0
    while j<len(tail) and dep:
     c=tail[j]
     if q:
      if esc:esc=False
      elif c=='\\':esc=True
      elif c==q:q=None
     elif c in "'\"":q=c
     elif c=='[':
      if dep==1:arr_start=j+1
      dep+=1
     elif c==']':
      dep-=1
      if dep==1:top.append(tail[arr_start:j])
     j+=1
    for el in top:
     z=re.match(r"\s*'([^']+)'",el)
     if z:states.append(z.group(1))
   out.append({'id':mid.group(1),'end':en.group(1) if en else None,'name':nm.group(1) if nm else None,'state_ids':states,'line':line_at(s,m.end()+off)})
 return out

def embedded(root,docs):
 a=[]
 for d in docs:
  name=d.get('file',''); extp=root/name; ext=read(extp) if extp.is_file() else None; em=d.get('md','')
  a.append({'file':name,'external_exists':ext is not None,'embedded_chars':len(em),'external_chars':len(ext) if ext is not None else None,'normalized_match':norm(em)==norm(ext) if ext is not None else None,'embedded_sha256':sha(norm(em).encode()),'external_sha256':sha(norm(ext).encode()) if ext is not None else None})
 return a

def metric(s):
 return {'chars':len(s),'lines':len(s.splitlines()),'inline_scripts':len(re.findall(r'<script\b(?![^>]*\bsrc=)',s,re.I)),'external_scripts':re.findall(r'<script\b[^>]*\bsrc=["\']([^"\']+)',s,re.I),'external_css':re.findall(r'<link\b[^>]*\bhref=["\']([^"\']+)',s,re.I),'data_component_counts':dict(collections.Counter(re.findall(r'data-component=["\']([^"\']+)',s))),'data_variant_counts':dict(collections.Counter(re.findall(r'data-variant=["\']([^"\']+)',s))),'fetch_mentions':len(re.findall(r'\bfetch\s*\(',s)),'xhr_mentions':len(re.findall(r'XMLHttpRequest',s)),'window_open_mentions':len(re.findall(r'window\.open\s*\(',s)),'static_ids':len(set(re.findall(r'\bid=["\']([^"\']+)',s,re.I)))}

th=TRIAL/'02_低保真交互原型.html'; fh=FINAL/'02_低保真交互原型.html'; ts=read(th);fs=read(fh); td=extract(ts,r'window\.DATA\s*=\s*');fc=extract(fs,r'window\.COMP_DOCS\s*=\s*') or {}; fd=extract(fs,r'window\.DIAGRAMS\s*=\s*') or [];fdocs=extract(fs,r'window\.DOCS\s*=\s*') or []
tdocs=td.get('docs',[]); tp=td.get('pages',[]); tcomps=td.get('components',[]); tdiags=td.get('diagrams',[]);fp=extract_final_pages(fs)
def docstats(root):
 return {p.name:summarize_doc(read(p)) for p in sorted(root.glob('*.md'))}
def diagram_summary(ds,key):
 return [{'id':d.get('id'),'title':d.get('title'),'type':d.get('type'),'lines':len((d.get(key,'') or '').splitlines()),'chars':len(d.get(key,'') or ''),'svg_chars':len(d.get('svg','') or '')} for d in ds]
checks={}
for p in sorted((TRIAL/'_checks').glob('*.json')):
 try:
  o=json.loads(read(p));checks[p.name]={'keys':sorted(o.keys()),'scalars':{k:v for k,v in o.items() if isinstance(v,(str,int,float,bool))},'nested_counts':{k:len(v) for k,v in o.items() if isinstance(v,(list,dict))}}
 except Exception as e:checks[p.name]={'error':str(e)}
summary={'method':'Read-only static analysis of caller-provided folders. Producer _checks and screenshots are reported as producer evidence, not independent verification. No full HTML/CSS/JS or embedded document body is stored.','input_files':{'trial':files(TRIAL),'final':files(FINAL)},'html':{'trial':{'path':str(th),'bytes':th.stat().st_size,'sha256':sha(th.read_bytes()),**metric(ts)},'final':{'path':str(fh),'bytes':fh.stat().st_size,'sha256':sha(fh.read_bytes()),**metric(fs)}},'trial_model':{'project':td.get('project'),'profile':td.get('profile'),'ends':td.get('ends'),'page_count':len(tp),'state_count':sum(len(p.get('states',[])) for p in tp),'pages':[{'id':p.get('id'),'end':p.get('end'),'name':p.get('name'),'purpose':p.get('purpose'),'entry':p.get('entry'),'exit':p.get('exit'),'overlay':p.get('overlay'),'reqs':p.get('reqs'),'states':p.get('states'),'components':p.get('components')} for p in tp],'component_definition_count':len(tcomps),'components':[{'id':c.get('id'),'name':c.get('name'),'ends':c.get('ends'),'modes':c.get('modes'),'variants':c.get('variants')} for c in tcomps],'diagram_count':len(tdiags),'diagrams':diagram_summary(tdiags,'puml'),'embedded_docs':embedded(TRIAL,tdocs)},'final_model':{'pages':fp,'page_count':len(fp),'state_count':sum(len(p['state_ids']) for p in fp),'component_doc_count':len(fc),'component_doc_ids':sorted(fc.keys()),'diagram_count':len(fd),'diagrams':diagram_summary(fd,'src'),'embedded_docs':embedded(FINAL,fdocs)},'trial_external_docs':docstats(TRIAL),'final_external_docs':docstats(FINAL),'producer_checks':checks}
(DATA/'inventory.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'inventory':str(DATA/'inventory.json'),'trial_files':len(summary['input_files']['trial']),'final_files':len(summary['input_files']['final']),'trial_html_bytes':th.stat().st_size,'final_html_bytes':fh.stat().st_size,'trial_pages':len(tp),'trial_states':summary['trial_model']['state_count'],'trial_compdefs':len(tcomps),'trial_diagrams':len(tdiags),'final_pages_parsed':len(fp),'final_state_ids_parsed':summary['final_model']['state_count'],'final_compdocs':len(fc),'final_diagrams':len(fd),'embedded_docs_trial':len(tdocs),'embedded_docs_final':len(fdocs)},ensure_ascii=False))
