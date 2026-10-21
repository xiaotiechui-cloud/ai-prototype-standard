"""Check approved text and maintenance integrity, without prototype execution."""
import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
REVISION = 'draft-20261021-trial3-detail'
BASE = json.loads((HERE / '01_补充审查基线与入口.json').read_text(encoding='utf-8'))
REPORT = HERE / '13_规则落实核对.json'
OWNERS = {
    'K01': ('standards/deliverables-business.md', '24.5'),
    'K02': ('standards/core.md', '3.4'),
    'K03': ('standards/runtime-and-build.md', '13.5'),
    'K04': ('standards/profiles/admin.md', '12.11'),
    'K05': ('standards/runtime-and-build.md', '13.3'),
    'K06': ('standards/profiles/admin.md', '12.13'),
    'K07': ('standards/quality-and-evidence.md', '29.13'),
    'K08': ('standards/runtime-and-build.md', '13.6'),
}


def git_text(relative):
    return subprocess.check_output(['git', 'show', 'HEAD:' + relative], cwd=ROOT).decode('utf-8-sig')


def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    errors = []
    if not REPORT.exists():
        REPORT.write_text('{}\n', encoding='utf-8')
    proposal = (HERE / '07_规则提炼与归口方案_待审.md').read_text(encoding='utf-8')
    groups = dict(re.findall(r'^## (K\d{2}) [^\n]+\n([\s\S]*?)(?=^## |\Z)', proposal, re.M))
    clauses = {}
    for kid, (relative, section) in OWNERS.items():
        text = (ROOT / relative).read_text(encoding='utf-8-sig')
        block = re.search(r'^### ' + re.escape(section) + r' [^\n]*\n([\s\S]*?)(?=^### |\Z)', text, re.M)
        quote = re.search(r'^> (.+)$', groups.get(kid, ''), re.M)
        match = bool(block and quote and quote[1] in block[1])
        clauses[kid] = {'authority':relative,'section':section,'approved_paragraph_present':match}
        if not match:
            errors.append('Approved paragraph missing from authority: ' + kid)
    manifest = json.loads((ROOT / 'standard-manifest.json').read_text(encoding='utf-8-sig'))
    original_manifest = json.loads(git_text('standard-manifest.json'))
    routing_unchanged = {k:v for k,v in manifest.items() if k != 'content_revision'} == {k:v for k,v in original_manifest.items() if k != 'content_revision'}
    if not routing_unchanged or manifest['content_revision'] != REVISION:
        errors.append('Unexpected manifest revision or routing change')
    for name in ('README.md', 'AI-START.md', '12_确认与落实.md'):
        target = (HERE if name.startswith('12_') else ROOT) / name
        if '`' + REVISION + '`' not in target.read_text(encoding='utf-8'):
            errors.append('Revision not synchronized: ' + name)
    current_hashes = {}
    changed_modules = []
    markers_unchanged = {}
    for relative, old_hash in BASE['standard_hashes'].items():
        p = ROOT / relative
        key = p.relative_to(ROOT).as_posix()
        current_hashes[key] = digest(p)
        if key.startswith('standards/'):
            if current_hashes[key] != old_hash:
                changed_modules.append(key)
            old = git_text(key)
            new = p.read_text(encoding='utf-8-sig')
            rx = r'<!-- (?:SOURCE-SECTION|RULE-ID): [^>]+-->|<a id="[^"]+"></a>'
            markers_unchanged[key] = re.findall(rx, old) == re.findall(rx, new)
    if set(changed_modules) != {v[0] for v in OWNERS.values()}:
        errors.append('Unexpected activity module change set')
    if not all(markers_unchanged.values()):
        errors.append('Chapter/anchor/rule markers changed')
    source_hashes = {v:{'sha256':digest(Path(item['path'])), 'unchanged':digest(Path(item['path'])) == item['sha256']}
                     for v,item in BASE['sources'].items()}
    if not all(v['unchanged'] for v in source_hashes.values()):
        errors.append('Prototype input changed')
    matrix_counts = {}
    for name, prefix, expected in [('actions-and-results.md','ACT',15),('context-and-layers.md','CTX',12),('selftest.md','SELF',12)]:
        text = (ROOT / 'docs/acceptance' / name).read_text(encoding='utf-8')
        ids = re.findall(r'^\| ' + prefix + r'-(\d+) \|', text, re.M)
        matrix_counts[prefix] = len(ids)
        if [int(i) for i in ids] != list(range(1, expected + 1)):
            errors.append('Invalid matrix IDs: ' + name)
    matrix = (HERE / '08_补充验收矩阵.md').read_text(encoding='utf-8')
    unverified = len(re.findall(r'^\| RV-.*\| 未验证 \|$', matrix, re.M))
    if unverified != 32:
        errors.append('Browser verification statuses changed')
    changed_paths = subprocess.check_output(['git','diff','--name-only','-z'],cwd=ROOT).decode('utf-8').split('\0')
    candidates = {ROOT / p for p in changed_paths if p} | set(HERE.glob('*'))
    for p in candidates:
        if p.is_file() and p.suffix in ('.md','.json','.py','.js'):
            for n,line in enumerate(p.read_text(encoding='utf-8-sig').splitlines(),1):
                if line != line.rstrip():
                    errors.append('Trailing whitespace: ' + str(p.relative_to(ROOT)) + ':' + str(n))
    commands = []
    for cmd in ([sys.executable,'tools/maintain.py','verify'],['git','diff','--check']):
        proc = subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
        commands.append({'command':' '.join(cmd),'exit_code':proc.returncode,'stdout':proc.stdout[-5000:],'stderr':proc.stderr[-2000:]})
        if proc.returncode:
            errors.append('Failed command: ' + ' '.join(cmd))
    head = subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    report = {'checked_at':datetime.datetime.now().astimezone().isoformat(),
              'approval':{'user_reply':'已审核','scope':'K01-K08 reviewed text and stated exceptions'},
              'repository_head':head,'working_tree_contains_uncommitted_changes':True,
              'content_revision':REVISION,'approved_clauses':clauses,
              'changed_activity_modules':changed_modules,'current_module_and_manifest_sha256':current_hashes,
              'manifest_except_content_revision_unchanged':routing_unchanged,
              'chapter_anchor_and_rule_markers_unchanged':markers_unchanged,
              'input_html':source_hashes,'method_matrix_row_counts':matrix_counts,
              'browser_parent_scenarios':32,'browser_executed':0,'browser_unverified':unverified,
              'commands':commands,'errors':errors,
              'scope':'approved-text-placement-and-maintenance-integrity; no browser or PRD generation run'}
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'approved_groups':len(clauses),'paragraphs_found':sum(v['approved_paragraph_present'] for v in clauses.values()),
                      'changed_modules':changed_modules,'routing_unchanged':routing_unchanged,
                      'markers_unchanged':all(markers_unchanged.values()),'browser_executed':0,
                      'commands':[{'command':c['command'],'exit_code':c['exit_code']} for c in commands],
                      'errors':errors},ensure_ascii=False,indent=2))
    return bool(errors)


if __name__ == '__main__':
    sys.exit(main())
