"""Bounded source evidence; rejects giant embedded data lines."""
import argparse,re
from audit_trial5 import TRIAL,FINAL
p=argparse.ArgumentParser();p.add_argument('ranges',nargs='*');p.add_argument('--final',action='store_true');p.add_argument('--find');p.add_argument('--limit',type=int,default=240)
a=p.parse_args();ls=(FINAL if a.final else TRIAL).read_text('utf-8-sig').splitlines();out=[]
if a.find:
 for i,s in enumerate(ls,1):
  if len(s)<12000 and re.search(a.find,s):out.append((i,s))
else:
 for span in a.ranges:
  lo,_,hi=span.partition(':')
  out.extend((i,ls[i-1]) for i in range(int(lo),int(hi or lo)+1))
for i,s in out[:a.limit]:
 print(f'{i}: '+(s if len(s)<=1400 else s[:1400]+f'... [line length={len(s)}; truncated]'))
print(f'[matched lines {len(out)}; displayed {min(len(out),a.limit)}]')
