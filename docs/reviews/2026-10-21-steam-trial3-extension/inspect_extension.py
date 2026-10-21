"""Bounded, read-only source review; never print complete HTML/script/documents."""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re
import subprocess

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PREVIOUS = ROOT / 'docs/reviews/2026-10-21-steam-trial3/01_结构清单.json'


def sources():
    inventory = json.loads(PREVIOUS.read_text(encoding='utf-8-sig'))
    out = {}
    for version in ('trial', 'final'):
        entry = inventory[version]
        path = pathlib.Path(entry['path'])
        raw = path.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        if digest != entry['sha256']:
            raise SystemExit(f'{version}: changed source; previous inventory cannot be reused')
        text = raw.decode('utf-8-sig')
        out[version] = {'path': str(path), 'sha256': digest, 'text': text,
                        'lines': text.splitlines(), 'previous': entry}
    return out


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def index(src):
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    files = sorted((ROOT / 'standards').rglob('*.md')) + [ROOT / 'standard-manifest.json']
    result = {'repository_commit': head, 'method': 'static-source-review',
              'previous_inventory': str(PREVIOUS.relative_to(ROOT)),
              'completed_topics_excluded': ['scrollbars', 'simulator-layout', 'drag-handle',
                                            'empty-menu-group', 'desktop-shell-layout',
                                            'overlay-geometry', 'generic-gray-ui'],
              'browser_verification': 'not_run',
              'standard_hashes': {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in files},
              'sources': {}}
    for version, item in src.items():
        text = item['text']
        functions = [{'name': m[1], 'line': text.count('\n', 0, m.start()) + 1}
                     for m in re.finditer(r'(?m)^\s*(?:async\s+)?function\s+([\w$]+)\s*\(', text)]
        result['sources'][version] = {'path': item['path'], 'sha256': item['sha256'],
                                      'functions': functions}
    write_json(HERE / '01_补充审查基线与入口.json', result)
    print(json.dumps({'commit': head, 'source_hashes_unchanged': True,
                      'functions': {v: len(s['functions']) for v, s in result['sources'].items()}}, ensure_ascii=False))


def search(src, version, pattern, start, end, limit):
    item = src[version]
    rx = re.compile(pattern, re.I)
    found = []
    for n, line in enumerate(item['lines'], 1):
        if n < start or (end and n > end):
            continue
        if rx.search(line):
            # A long embedded document is not runtime evidence. Do not print its body.
            if len(line) > 4000:
                found.append({'line': n, 'evidence': '[embedded/long line omitted]', 'characters': len(line)})
                continue
            found.append({'line': n, 'evidence': line.strip()[:230]})
    print(json.dumps({'version': version, 'matches': len(found), 'shown': found[:limit]}, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['index', 'search'])
    parser.add_argument('--version', choices=['trial', 'final'])
    parser.add_argument('--pattern', default='')
    parser.add_argument('--start', type=int, default=1)
    parser.add_argument('--end', type=int, default=0)
    parser.add_argument('--limit', type=int, default=22)
    args = parser.parse_args()
    src = sources()
    if args.mode == 'index':
        index(src)
    else:
        search(src, args.version, args.pattern, args.start, args.end, args.limit)


if __name__ == '__main__':
    main()
