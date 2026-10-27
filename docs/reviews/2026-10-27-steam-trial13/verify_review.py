"""Verify saved report references and input identity; not prototype acceptance."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess
import sys

root = Path(__file__).resolve().parent
repo = root.parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--reports-only', action='store_true', help='Use saved input identity, do not reread completed project files')
args = parser.parse_args()
manifest = json.loads((root / '_data/snapshot-manifest.json').read_text(encoding='utf-8-sig'))
refresh = json.loads((root / '_data/refresh-manifest.json').read_text(encoding='utf-8-sig'))
overrides = {x['path']: x for x in refresh['files']}
changed = []
count = 0
for side in (() if args.reports_only else ('trial', 'final')):
    source = Path(manifest[side]['source'])
    for item in manifest[side]['files']:
        item = overrides.get(item['path'], item) if side == 'trial' else item
        p = source / item['path']
        count += 1
        if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest() != item['sha256']:
            changed.append({'side': side, 'file': item['path']})
missing = []
reports = sorted(root.glob('[0-9][0-9]_*.md'))
for p in reports:
    for target in re.findall(r'\]\(([^)]+)\)', p.read_text(encoding='utf-8-sig')):
        if '://' not in target and not (root / target.split('#')[0]).exists():
            missing.append({'file': p.name, 'target': target})
repo_check = subprocess.run([sys.executable, '-X', 'utf8', 'tools/maintain.py', 'verify'], cwd=repo, text=True, encoding='utf-8', capture_output=True)
diff_check = subprocess.run(['git', 'diff', '--check'], cwd=repo, text=True, encoding='utf-8', capture_output=True)
result = {'meaning': 'Review package integrity only; not browser or business acceptance',
          'report_count': len(reports), 'input_files_rehashed': count,
          'changed_inputs_since_snapshot': changed, 'missing_relative_links': missing,
          'comparison_basis': 'initial snapshot plus documented 15-file refresh overlay',
          'input_identity_rechecked': not args.reports_only,
          'saved_input_identity': '_data/review-verification-pre-approval.json' if args.reports_only else None,
          'active_standards_edited': True, 'prototype_edited': False,
          'independent_browser_executed': False,
          'repository_verify': {'exit_code': repo_check.returncode, 'stdout': repo_check.stdout, 'stderr': repo_check.stderr},
          'git_diff_check': {'exit_code': diff_check.returncode, 'stdout': diff_check.stdout, 'stderr': diff_check.stderr},
          'status_observed': subprocess.check_output(['git', 'status', '--short', '--branch'], cwd=repo, text=True, encoding='utf-8'),
          'commit_push_performed': False}
(root / '_data/review-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=True))
expected_reports = {f'{i:02}' for i in range(9)}
raise SystemExit(1 if changed or missing or {p.name[:2] for p in reports} != expected_reports or len(reports) != 9 or repo_check.returncode or diff_check.returncode else 0)
