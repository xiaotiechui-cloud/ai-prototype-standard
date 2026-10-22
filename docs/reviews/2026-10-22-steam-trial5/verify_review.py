"""Integrity and internal consistency only; never claims browser validation."""
import json,re,subprocess
from pathlib import Path
from collections import Counter
from audit_trial5 import ROOT,OUT,TRIAL,FINAL,sha,save

def read(n): return json.loads((OUT/n).read_text('utf-8'))
b=read('01_基线.json')
assert all(sha(Path(x['path']))==x['sha256'] for x in b['inputs'].values())
assert sha(ROOT/'standard-manifest.json')==b['manifest_sha256']
assert all(sha(ROOT/p)==h for p,h in b['modules'].items())
assert all(sha(ROOT/p)==h for p,h in b['archive'].items())
docs=read('03_交付同源核对.json')['documents']
assert len(docs)==9 and all(x['normalized_equal'] and sha(Path(x['file']))==x['external_sha256'] for x in docs)
supplied=read('04_随附证据清单.json')['files']
assert all(sha(Path(x['path']))==x['sha256'] for x in supplied)
final_ext=read('07_最终版外部证据复核.json')
assert final_ext['all_nine_verified']
assert all(sha(Path(x['path']))==x['sha256']==x['historical_sha256'] for x in final_ext['records'])
obs=read('08_局部函数观察.json')
assert obs['sha256']==b['inputs']['trial']['sha256']
assert len(obs['syntax'])==6 and all(x['parsed'] for x in obs['syntax'])
vm={x['id'] for x in obs['records']}
assert len(vm)==len(obs['records'])==41
counts=Counter(str(x['contract_met']) for x in obs['records'])
assert counts=={'True':9,'False':29,'None':3}
findings=read('10_差异与规则映射.json')['findings']
ids={f['id'] for f in findings}
assert len(ids)==len(findings)==38
assert {v for f in findings for v in f['probes']}==vm
for f in findings:
    assert f['browser_retested'] is False and f['solution'] and f['acceptance']
    for e in f['trial_evidence']:
        p=Path(e['path']); assert p.is_file()
        # Count only; never emit source.
        assert 1<=e['line']<=sum(1 for _ in p.open(encoding='utf-8-sig'))
coverage=read('16_职责覆盖.json')
assert coverage['trial_pages_covered']==53 and coverage['final_pages_covered']==41
reg=read('17_回归验收矩阵.json')
assert reg['browser_executed']==0
assert {s['id'] for s in reg['scenarios']}=={'R5-'+i for i in ids}
assert all(s['status']=='未执行' and s['evidence'] is None for s in reg['scenarios'])
provider=read('06_提供方证据归属.json')
assert len(provider['module_claims'])==13 and all(x['matches_review'] for x in provider['module_claims'])
assert provider['artifact_sha_matches'] and provider['provider_browser_result']['reexecuted'] is False
assert sha(Path(provider['provider_browser_result']['script']))==provider['provider_browser_result']['script_sha256']
case=read('19_黄金案例候选.json')
assert case['status']=='candidate-unverified' and case['promotion_record'] is None
assert case['prd']['sha256'] is None and len(case['differences'])==38
# No invented stable rule IDs in new report text.
rule_text=(ROOT/'docs/RULE-INDEX.md').read_text('utf-8')
known=set(re.findall(r'STD-[A-Z]+-\d+',rule_text))
for p in OUT.glob('*.md'):
    assert set(re.findall(r'STD-[A-Z]+-\d+',p.read_text('utf-8')))<=known,p.name
changed=subprocess.check_output(['git','diff','--name-only'],cwd=ROOT,text=True).splitlines()
assert set(changed)<={'README.md','CHANGELOG.md','docs/REVIEW.md'},changed
save('20_专项核对.json',{'result':'passed','checks':['输入HTML SHA不变','9份试跑外部MD及24份提供方附件不变','最终版9份外部MD与历史SHA匹配','manifest/活动模块/archive不变','38项差异、41局部观察和38待执行父场景引用一致','13提供方模块摘要匹配','候选档案不晋级','报告稳定规则ID存在','已跟踪变更仅导航和记录'],
 'probe_counts':dict(counts),'browser_executed':0,'review_head':b['head'],
 'note':'本专项检查只核保护与内部一致性；结构检查和git diff检查另见21记录。',
 'report_hashes':{p.name:sha(p) for p in OUT.iterdir() if p.is_file() and p.name not in ['20_专项核对.json','21_验证记录.md']}})
print('Review integrity: PASS; findings=38; local observations=41 (9/29/3); browser=0; inputs and standards unchanged.')
