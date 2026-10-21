"""Bounded source/embedded document inspection; no input mutation."""
import sys, json, re
from audit_trial4 import TRIAL, FINAL
target=sys.argv[1]; mode=sys.argv[2]; query=sys.argv[3]
p=TRIAL.with_name('02_低保真交互原型.html') if target=='T' else FINAL
s=p.read_text('utf-8-sig'); ls=s.splitlines()
if mode=='lines':
    a,b=map(int,query.split(':')); assert b-a<=95
    for i in range(a,b+1):print(f'{i}: {ls[i-1][:1200]}')
elif mode=='find':
    hits=[(i,l) for i,l in enumerate(ls,1) if re.search(query,l)]
    print('matches',len(hits))
    for i,l in hits[:35]:print(f'{i}: {l[:650]}')
elif mode=='doc':
    data=json.JSONDecoder().raw_decode(s.split('window.DATA=',1)[1])[0]
    d=next(d for d in data['docs'] if d['file'].startswith(query.split(':')[0]))
    pattern=query.split(':',1)[1]
    hits=[(i,l) for i,l in enumerate(d['md'].splitlines(),1) if re.search(pattern,l)]
    print(d['file'],'matches',len(hits))
    for i,l in hits[:25]:print(f'{i}: {l[:750]}')
