"""Verify review consistency and protected baselines, not browser acceptance."""
from pathlib import Path
from collections import Counter
import hashlib,json,re,subprocess
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2]
def read(n): return json.loads((OUT/n).read_text('utf-8'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
base=read('05_当前基线.json');checks=[]
if read_manifest := json.loads((ROOT/'standard-manifest.json').read_text('utf-8')):
    if read_manifest['content_revision'] != base['content_revision']:
        raise SystemExit('Historical analysis baseline changed: use verify_implementation.py; do not overwrite 21.')
for group in ['modules','archive']:
    for p,h in base[group].items(): assert sha(ROOT/p)==h,(group,p)
assert sha(ROOT/'standard-manifest.json')==base['manifest_sha256']
checks.append('active modules, manifest, archive unchanged')
for key,item in base['inputs'].items(): assert sha(Path(item['path']))==item['sha256'],key
checks.append('current trial and final input hashes unchanged')
same=read('07_当前同源核对.json')
for d in same['documents']:
    assert sha(Path(d['file']))==d['external_sha256'],d['file']
    assert d['normalized_equal']
checks.append('nine current MD files unchanged and normalized same-source')
provided=read('09_随附证据归属核对.json')
for f in provided['files']:assert sha(Path(f['path']))==f['sha256'],f['path']
checks.append('provided evidence files unchanged since review inventory')
text=Path(base['inputs']['trial']['path']).read_text('utf-8-sig');ls=text.splitlines()
findings=read('10_差异与规则映射.json')['findings']
assert len(findings)==40 and len({x['id'] for x in findings})==40
assert Counter(x['classification'] for x in findings)=={'执行错误':32,'正向差异':5,'实现歧义':1,'合理替代':1,'证据缺口':1}
for x in findings:
    for e in x['trial_evidence']:
        actual=ls[e['line']-1].strip()
        if e['excerpt'].startswith('DATA metadata'):assert actual.startswith('window.DATA=')
        else:assert actual[:210]==e['excerpt'],x['id']
checks.append('40 unique findings, classifications, and current source line excerpts agree')
probes=read('08_局部函数观察.json');assert probes['sha256']==base['inputs']['trial']['sha256']
assert len(probes['records'])==33
assert Counter(str(x['contract_met']) for x in probes['records'])=={'True':7,'False':24,'None':2}
assert all(x['parsed'] for x in probes['syntax']) and len(probes['syntax'])==6
for x in probes['records']:
    line=ls[x['source']['line']-1]
    assert x['entry'] in line,x['id']
checks.append('33 original-function observations remain bound to current source; 6 syntax-only parses')
coverage=read('16_职责覆盖.json');assert len(coverage['domains'])==24
assert not coverage['unmapped_trial'] and not coverage['unmapped_final']
assert len(set(p for d in coverage['domains'] for p in d['trial_pages']))==51
assert len(set(p for d in coverage['domains'] for p in d['final_pages']))==41
matrix=(OUT/'17_回归验收矩阵.md').read_text('utf-8');assert len(re.findall(r'^\| R4-[A-E]\d\d \|',matrix,re.M))==40
checks.append('24 semantic domains map T51/F41; 40 pending browser parent scenarios')
seal=read('20_最终版外部文档哈希复核.json')
for f in seal['documents']:assert sha(Path(f['path']))==f['sha256']
assert seal['equal']==1
checks.append('final external MD hashes rechecked; one of nine matches embedded body')
# Compare the self-reported generating metadata with current review baseline;
# do not fabricate independent authentication of the original PRD/generation.
supplied=Path(base['inputs']['trial']['path']).parent/'_checks/验证证据_2026-10-21.md'
body=supplied.read_text('utf-8-sig');reported=[]
for i,l in enumerate(body.splitlines(),1):
    m=re.search(r'\|\s*(standards/[^|\s]+)\s*\|\s*`([a-f0-9]{64})`',l)
    if m:reported.append({'path':m[1],'reported_sha256':m[2],'matches_current':sha(ROOT/m[1])==m[2],'evidence_line':i})
assert reported
result={'status':'review-consistency-pass','checks':checks,'current_input_sha256':base['inputs']['trial']['sha256'],
 'provided_generation_metadata':{'evidence_path':str(supplied),'commit_as_reported':re.search(r'规范 commit \| `([a-f0-9]{40})`',body).group(1),
 'prd_sha256_as_reported':re.search(r'PRD SHA-256 \| `([a-f0-9]{64})`',body).group(1),
 'module_hashes_as_reported':reported,'note':'Self-reported metadata is available and compared; original PRD/generating workspace not independently verified. This is not current HEAD backfilled as generation.'},
 'not_verified':['real browser operation on current artifact by this review','complete state/entry/layout acceptance','real payment/supplier/platform/production permissions'],
 'git_actions':'No commit/push/tag/release performed by this review'}
(OUT/'21_一致性与保护检查.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({'status':result['status'],'checks':len(checks),'reported_modules':len(reported),'reported_modules_matching_current':sum(x['matches_current'] for x in reported)},ensure_ascii=False))
