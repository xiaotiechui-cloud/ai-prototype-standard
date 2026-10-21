"""Read-only bounded inventory. Run from any directory; no prototype execution."""
from pathlib import Path
from collections import Counter
import hashlib, json, re, subprocess, sys

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
TRIAL = Path(r'D:\模型汇总\GitHub维护测试\试跑4.0\项目原型交付_V1.0\02_低保真交互原型-试跑4.0.html')
CURRENT = '--initial' not in sys.argv
if CURRENT: TRIAL=TRIAL.with_name('02_低保真交互原型.html')
FINAL = Path(r'D:\模型汇总\CDK商城\Steam商城原型交付_V1.0\02_低保真交互原型-最终版本.html')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def write(name, obj):
    if CURRENT: name={'01_基线.json':'05_当前基线.json','02_结构清单.json':'06_当前结构清单.json','03_交付同源核对.json':'07_当前同源核对.json'}[name]
    (OUT/name).write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n', 'utf-8')
def norm(s): return s.lstrip('\ufeff').replace('\r\n','\n').replace('\r','\n')
def main():
    s=TRIAL.read_text('utf-8-sig'); lines=s.splitlines()
    data=json.JSONDecoder().raw_decode(s.split('window.DATA=',1)[1])[0]
    prior=json.loads((ROOT/'docs/reviews/2026-10-21-steam-trial3/01_结构清单.json').read_text('utf-8'))['final']
    assert sha(FINAL)==prior['sha256'], 'Final changed; do not reuse inventory'
    manifest=json.loads((ROOT/'standard-manifest.json').read_text('utf-8'))
    baseline={'date':'2026-10-21','head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
      'content_revision':manifest['content_revision'],'generation_rule_commit':None,
      'generation_note':'Generating commit, PRD hash and 13 module hashes are self-reported in supplied _checks evidence; see 21 consistency record. Original generating workspace/PRD not independently verified; review HEAD is not backfilled as generation baseline.' if CURRENT else 'Historical generating baseline not established at initial inventory; review baseline is not generation baseline.',
      'manifest_sha256':sha(ROOT/'standard-manifest.json'),
      'modules':{m['path']:sha(ROOT/m['path']) for m in manifest['modules']},
      'archive':{str(p.relative_to(ROOT)):sha(p) for p in (ROOT/'archive').rglob('*') if p.is_file()},
      'inputs':{'trial':{'path':str(TRIAL),'sha256':sha(TRIAL),'bytes':TRIAL.stat().st_size,'lines':len(lines)},
                'final':{k:prior[k] for k in ['path','sha256','bytes','lines']}},
      'capabilities':{'static':'available','node_vm':'planned; isolated fixtures, not browser evidence','browser':'not yet executed'},
      'scope':'compare and prepare review documents; no prototype edits or active-rule semantic changes'}
    write('01_基线.json',baseline)
    pages=data['pages']; instances=[c for p in pages for c in p.get('components',[])]
    inventory={'trial':{'path':str(TRIAL),'sha256':sha(TRIAL),'counts_declared':data['counts'],
      'counts_observed':{'pages':len(pages),'states':sum(len(p['states']) for p in pages),'instances':len(instances),
        'definitions_referenced':len({c['def'] for c in instances}),'instance_docs':len(data['instanceDocs']),
        'diagrams':len(data['diagrams']),'documents':len(data['docs'])},
      'pages_by_end':dict(Counter(p['end'] for p in pages)), 'pages':pages,
      'instance_documents':[{k:v for k,v in c.items() if k!='sections'}|{'sections':[(x['n'],x['title']) for x in c.get('sections',[])]} for c in data['instanceDocs'].values()],
      'diagrams':[{k:v for k,v in d.items() if k not in ['source','svg']} for d in data['diagrams']],
      'actions':dict(Counter(re.findall(r'data-act=["\']([\w-]+)',s))),
      'functions':[{'name':m.group(1),'line':s.count('\n',0,m.start())+1} for m in re.finditer(r'function\s+([\w$]+)\s*\(',s)],
      'script_ranges':[{'start':s.count('\n',0,m.start())+1,'end':s.count('\n',0,m.end())+1} for m in re.finditer(r'<script\b[^>]*>.*?</script>',s,re.S)]},
      'final_reused':prior,'limits':['Counts are inventory only; IDs require semantic mapping. No browser pass inherited.']}
    write('02_结构清单.json',inventory)
    docs=[]; data_line=next(i for i,l in enumerate(lines,1) if l.startswith('window.DATA='))
    for d in data['docs']:
        p=TRIAL.parent/d['file']; inner=d['md']; ext=p.read_text('utf-8-sig') if p.exists() else None
        a=norm(inner);b=norm(ext) if ext is not None else None
        al=a.splitlines();bl=b.splitlines() if b is not None else []
        first=next((i+1 for i in range(max(len(al),len(bl))) if (al[i] if i<len(al) else None)!=(bl[i] if i<len(bl) else None)),None)
        docs.append({'file':str(p),'embedded_json_pointer':'/docs/'+str(data['docs'].index(d))+'/md','html_line':data_line,
          'external_sha256':sha(p) if p.exists() else None,'embedded_utf8_sha256':hashlib.sha256(inner.encode()).hexdigest(),
          'normalization':'strip BOM; CRLF/CR -> LF; no other whitespace changes','normalized_equal':a==b,'first_difference_line':first,
          'embedded_lines':len(al),'external_lines':len(bl)})
    other=TRIAL.parent/'02_低保真交互原型.html'
    alt={'path':str(other),'sha256':sha(other),'bytes':other.stat().st_size,'selected':CURRENT}
    otherlines=other.read_text('utf-8-sig').splitlines()
    alt['different_line_numbers']=[i+1 for i in range(max(len(lines),len(otherlines))) if (lines[i] if i<len(lines) else None)!=(otherlines[i] if i<len(otherlines) else None)]
    write('03_交付同源核对.json',{'documents':docs,'alternate_html':alt,'authoritative_input':'user-confirmed current file' if CURRENT else 'user-named trial4.0 HTML','embedded_document_count':len(docs)})
    # Search helper can read instance/document bodies without printing complete embedded lines.
    print(json.dumps({'counts':inventory['trial']['counts_observed'],'ends':inventory['trial']['pages_by_end'],
      'docs_equal':sum(d['normalized_equal'] for d in docs),'alternate_different_line_count':len(alt['different_line_numbers'])},ensure_ascii=False))
if __name__=='__main__': main()
