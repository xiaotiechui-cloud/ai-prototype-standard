"""Check review counts, references and unchanged baselines; record actual checks."""
import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
baseline = json.loads((HERE / '01_补充审查基线与入口.json').read_text(encoding='utf-8'))
errors = []
counts = {}
ids = []
record_path = HERE / '11_核对记录.json'
# Make the generated record's navigation target available to both link checks.
if not record_path.exists():
    record_path.write_text('{}\n', encoding='utf-8')
for prefix in ('03_', '04_', '05_', '06_'):
    p = next(HERE.glob(prefix + '*.md'))
    found = re.findall(r'^## ([ABCD]\d{2}) ', p.read_text(encoding='utf-8'), re.M)
    counts[p.name] = len(found)
    ids += found
if list(counts.values()) != [10, 8, 7, 7] or len(set(ids)) != 32:
    errors.append('Observation count/identity mismatch')
proposal = (HERE / '07_规则提炼与归口方案_待审.md').read_text(encoding='utf-8')
ks = re.findall(r'^## (K\d{2}) ', proposal, re.M)
if ks != ['K%02d' % n for n in range(1, 9)]:
    errors.append('Candidate count mismatch')
matrix = (HERE / '08_补充验收矩阵.md').read_text(encoding='utf-8')
rvs = re.findall(r'^\| RV-([ABCD]\d{2}) \|', matrix, re.M)
if rvs != ids:
    errors.append('Matrix does not map all observations in order')
if len(re.findall(r'^\| RV-.*\| 未验证 \|$', matrix, re.M)) != 32:
    errors.append('Browser matrix must remain unverified')
for p in HERE.glob('*.md'):
    content = p.read_text(encoding='utf-8')
    missing_k = set(re.findall(r'\bK\d{2}\b', content)) - set(ks)
    if missing_k:
        errors.append(str(missing_k))
    for target in re.findall(r'\]\(([^)]+)\)', content):
        if '://' in target or target.startswith('#'):
            continue
        target = target.split('#')[0]
        if target and not (p.parent / target).exists():
            errors.append('Missing link: ' + p.name + ' -> ' + target)
unchanged = {}
for relative, expected in baseline['standard_hashes'].items():
    unchanged[relative] = hashlib.sha256((ROOT / relative).read_bytes()).hexdigest() == expected
    if not unchanged[relative]:
        errors.append('Active baseline changed: ' + relative)
sources = {}
for version, item in baseline['sources'].items():
    sources[version] = hashlib.sha256(Path(item['path']).read_bytes()).hexdigest() == item['sha256']
    if not sources[version]:
        errors.append('Input changed: ' + version)
probes = json.loads((HERE / '02_局部函数复核.json').read_text(encoding='utf-8'))
harness_errors = [r['id'] for r in probes['results'] if r.get('harness_error')]
if len(probes['results']) != 17 or harness_errors:
    errors.append('Probe runner/count mismatch')
commands = []
for cmd in ([sys.executable, 'tools/maintain.py', 'verify'], ['git', 'diff', '--check']):
    completed = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace')
    commands.append({'command': ' '.join(cmd), 'exit_code': completed.returncode,
                     'stdout': completed.stdout[-5000:], 'stderr': completed.stderr[-1500:]})
    if completed.returncode:
        errors.append('Command failed: ' + ' '.join(cmd))
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
if head != baseline['repository_commit']:
    errors.append('HEAD changed during review')
result = {'checked_at': datetime.datetime.now().astimezone().isoformat(),
          'repository_head': head, 'observation_counts': counts, 'candidate_groups': len(ks),
          'browser_parent_scenarios': len(rvs), 'browser_executed': 0,
          'isolated_probes': len(probes['results']), 'harness_errors': harness_errors,
          'active_modules_and_manifest_unchanged': unchanged, 'input_html_unchanged': sources,
          'commands': commands, 'review_consistency_errors': errors,
          'scope': 'review-consistency-and-repository-maintenance-only; no browser or business acceptance'}
record_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'observations':sum(counts.values()),'candidates':len(ks),'browser_executed':0,
                  'input_unchanged': sources,'active_files_unchanged':all(unchanged.values()),
                  'commands':[{'command': c['command'], 'exit_code':c['exit_code']} for c in commands],
                  'errors':errors}, ensure_ascii=False, indent=2))
sys.exit(bool(errors))
