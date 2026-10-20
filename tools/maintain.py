"""Local-only standard checks, reproducible exports and task-specific reading packs."""
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'standard-manifest.json'
MARKER = re.compile(r'^<!-- SOURCE-SECTION: ([A-Za-z0-9_-]+) -->\n<a id="s-\1"></a>\n', re.M)
RULE_MARKER = re.compile(r'<!-- RULE-ID: ([A-Z0-9-]+) -->')


def read(path):
    return path.read_text(encoding='utf-8-sig').replace('\r\n', '\n')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def split_original(text):
    """Only split level-two headings outside Markdown code fences."""
    starts, offset, fence = [], 0, None
    for line in text.splitlines(keepends=True):
        f = re.match(r'^ {0,3}(`{3,}|~{3,})(.*)$', line.rstrip('\n'))
        if f:
            token, tail = f.groups()
            if fence is None:
                fence = (token[0], len(token))
            elif token[0] == fence[0] and len(token) >= fence[1] and not tail.strip():
                fence = None
        elif fence is None:
            h = re.match(r'^## (?:(\d+)\. |附录 ([A-I])：)', line)
            if h:
                starts.append((h.group(1) or h.group(2), offset))
        offset += len(line)
    if not starts:
        raise ValueError('No source sections found')
    sections = {'front': text[:starts[0][1]]}
    order = ['front']
    for i, (key, start) in enumerate(starts):
        if key in sections:
            raise ValueError(f'Duplicate original section: {key}')
        end = starts[i + 1][1] if i + 1 < len(starts) else len(text)
        sections[key] = text[start:end]
        order.append(key)
    return sections, order


def load():
    return json.loads(read(MANIFEST))


def extract(module):
    body = read(ROOT / module['path'])
    matches = list(MARKER.finditer(body))
    sections = {}
    for i, m in enumerate(matches):
        if m[1] in sections:
            raise ValueError(f"Duplicate marker: {module['path']}:{m[1]}")
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        sections[m[1]] = body[m.end():end]
    return sections


def collect(manifest):
    result = {}
    for module in manifest['modules']:
        parts = extract(module)
        if list(parts) != module['sections']:
            raise ValueError(f"Section list/order mismatch: {module['path']}")
        for key, body in parts.items():
            if key != 'front':
                heading = rf'^## {key}\. ' if key.isdigit() else rf'^## 附录 {key}：'
                if not re.match(heading, body):
                    raise ValueError(f'Missing or changed chapter heading: {key}')
            if key in result:
                raise ValueError(f'Duplicate authority for section {key}')
            result[key] = body
    if set(result) != set(manifest['section_order']):
        raise ValueError('Missing or unexpected source sections')
    return result


def markdown_targets(text):
    """Check repository navigation links, excluding code-fenced examples."""
    outside, fence = [], None
    for line in text.splitlines():
        f = re.match(r'^ {0,3}(`{3,}|~{3,})(.*)$', line)
        if f:
            token, tail = f.groups()
            if fence is None:
                fence = (token[0], len(token))
            elif token[0] == fence[0] and len(token) >= fence[1] and not tail.strip():
                fence = None
        elif fence is None:
            outside.append(line)
    return re.findall(r'\]\(([^\s)]+)\)', '\n'.join(outside))


def verify(manifest, baseline=False):
    archive = ROOT / manifest['baseline']['path']
    if sha(archive.read_bytes()) != manifest['baseline']['sha256']:
        raise ValueError('Archived baseline bytes changed')
    sections = collect(manifest)
    if baseline:
        original, order = split_original(read(archive))
        if order != manifest['section_order'] or sections != original:
            raise ValueError('Split content differs from original V3.0 baseline')
    modules = {m['id']: m for m in manifest['modules']}
    for module in modules.values():
        for dep in module['requires']:
            if dep not in modules:
                raise ValueError(f'Unknown dependency: {dep}')
    for stage in manifest['stages']:
        for profile in manifest['profiles']:
            select(manifest, stage, [profile])
        select(manifest, stage, list(manifest['profiles']))
    rule_index = read(ROOT / 'docs' / 'RULE-INDEX.md')
    indexed_rules = re.findall(r'^\| `(STD-[A-Z0-9-]+)` \|.*?\]\(\.\./(standards/[^)#]+)#', rule_index, re.M)
    if not indexed_rules or len({rule for rule, _ in indexed_rules}) != len(indexed_rules):
        raise ValueError('Rule index IDs are missing or duplicated')
    normative = [ROOT / m['path'] for m in manifest['modules'] if m['role'] == 'normative']
    all_rule_markers = {}
    for path in normative:
        for rule in RULE_MARKER.findall(read(path)):
            all_rule_markers.setdefault(rule, []).append(path)
    if set(all_rule_markers) != {rule for rule, _ in indexed_rules}:
        raise ValueError('Rule index and normative RULE-ID markers differ')
    for rule, relpath in indexed_rules:
        locations = all_rule_markers[rule]
        if len(locations) != 1 or locations[0] != ROOT / relpath:
            raise ValueError(f'Rule authority mismatch: {rule}')
    # Only maintained navigation/templates are checked; inherited chapter prose may
    # contain product output paths which do not exist inside this standard repo.
    docs = [*ROOT.glob('*.md'), *(ROOT / 'templates').glob('*.md'), *(ROOT / 'docs').glob('*.md')]
    docs += [ROOT / m['path'] for m in manifest['modules']]
    checked = 0
    for path in docs:
        for target in markdown_targets(read(path)):
            if re.match(r'^[A-Za-z][A-Za-z0-9+.-]*:', target):
                continue
            dest, _, fragment = target.partition('#')
            resolved = path.parent / dest if dest else path
            if not resolved.is_file():
                raise ValueError(f'Broken link in {path.name}: {target}')
            if fragment and fragment.startswith('s-') and f'id="{fragment}"' not in read(resolved):
                raise ValueError(f'Broken section anchor: {target}')
            checked += 1
    templates = list((ROOT / 'templates').glob('[0-9][0-9]_*.md'))
    if len(templates) != 9 or {p.name[:2] for p in templates} != {'00', '01', '03', '04', '05', '06', '07', '08', '09'}:
        raise ValueError('Expected exactly nine MD starter templates; 02 is HTML')
    print(f'PASS: archive SHA-256; {len(sections)} source sections; {len(modules)} modules; {len(indexed_rules)} stable rule IDs; dependency routes; {checked} links; 9 starter templates')
    if baseline:
        print('PASS: every migrated section matches V3.0 text exactly (line endings normalized)')


def select(manifest, stage, profiles):
    modules = {m['id']: m for m in manifest['modules']}
    wanted = set(manifest['always']) | set(manifest['stages'][stage])
    for profile in profiles:
        wanted.update(manifest['profiles'][profile])
    visiting, done = set(), set()

    def visit(key):
        if key in visiting:
            raise ValueError(f'Circular dependency: {key}')
        if key in done:
            return
        if key not in modules:
            raise ValueError(f'Unknown module: {key}')
        visiting.add(key)
        for dep in modules[key]['requires']:
            visit(dep)
        visiting.remove(key)
        done.add(key)

    for key in sorted(wanted):
        visit(key)
    if any(modules[key]['role'] != 'normative' for key in done):
        raise ValueError('A reading pack may not silently import examples/history')
    return [m for m in manifest['modules'] if m['id'] in done]


def snapshot_sha():
    import subprocess
    try:
        return subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    except (FileNotFoundError, subprocess.CalledProcessError):
        return 'unavailable'


def write_export(path, content):
    if path.exists():
        raise ValueError(f'Export already exists; choose a new --name: {path.name}')
    path.parent.mkdir(exist_ok=True)
    path.write_text(content, encoding='utf-8', newline='\n')
    print(f'CREATED: exports/{path.name}')


def export(manifest, args):
    verify(manifest)
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{0,79}', args.name):
        raise ValueError('Use a simple export name (letters, numbers, dot, underscore, dash)')
    if args.command == 'bundle':
        parts = collect(manifest)
        content = ('# 规范合订导出（由模块生成，请勿直接维护）\n\n'
                   f"规则基线：{manifest['rule_version']}；结构修订：{manifest['layout_revision']}。\n\n"
                   'front / 第32章 / H、I 是历史入口或参考示例，不参与当前加载路由；原有章号保留。\n\n')
        content += ''.join(parts[key] for key in manifest['section_order'])
    else:
        chosen = select(manifest, args.stage, args.profiles)
        hashes = [{'path': m['path'], 'sha256': sha((ROOT / m['path']).read_bytes())} for m in chosen]
        evidence = {'rule_version': manifest['rule_version'], 'layout_revision': manifest['layout_revision'],
                    'stage': args.stage, 'profiles': args.profiles, 'head_commit': snapshot_sha(), 'files': hashes}
        content = ('# AI 当前阶段规范包\n\n'
                   f"规则基线：{manifest['rule_version']}；维护结构：{manifest['layout_revision']}（用户已确认、未发布）。\n\n"
                   f"阶段：{args.stage}；端：{', '.join(args.profiles)}。\n\n"
                   '这是当前阶段输入，不能据此把完整交付范围缩减为部分文件。完整任务仍需后续阶段规则和验收。\n'
                   '只在真正读取文件后报告已加载；跨章引用需要时补读对应模块。示例业务不构成 PRD。\n\n'
                   '## 加载快照\n\n```json\n' + json.dumps(evidence, ensure_ascii=False, indent=2) + '\n```\n\n')
        for m in chosen:
            content += f"\n<!-- MODULE: {m['id']} | {m['path']} -->\n" + read(ROOT / m['path'])
        original_bytes = (ROOT / manifest['baseline']['path']).stat().st_size
        print(f'PACK: {len(chosen)} modules; {len(content.encode("utf-8"))} UTF-8 bytes vs baseline {original_bytes} bytes (not a token estimate)')
    write_export(ROOT / 'exports' / (args.name + '.md'), content)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    check = sub.add_parser('verify')
    check.add_argument('--baseline', action='store_true', help='Initial migration only: require exact V3.0 section text')
    bundle = sub.add_parser('bundle')
    bundle.add_argument('--name', required=True)
    pack = sub.add_parser('pack')
    pack.add_argument('--stage', required=True, choices=['model', 'prototype', 'docs', 'verify', 'change', 'full'])
    pack.add_argument('--profiles', nargs='+', required=True, choices=['client', 'web', 'admin'])
    pack.add_argument('--name', required=True)
    args = parser.parse_args()
    manifest = load()
    if args.command == 'verify':
        verify(manifest, args.baseline)
    else:
        export(manifest, args)


if __name__ == '__main__':
    main()
