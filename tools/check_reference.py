"""Static and pure-model checks for the opt-in review kit; not browser validation."""
import hashlib
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'reference' / 'implementations' / 'review-kit'


class Inspect(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.external = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        # SVG namespaces are identifiers, not resource dependencies.
        for key in ('src', 'href', 'xlink:href'):
            if attrs.get(key) and not attrs[key].startswith(('#', 'data:')):
                self.external.append((tag, key, attrs[key]))


def main():
    html = (KIT / 'review-kit.html').read_text(encoding='utf-8')
    parser = Inspect()
    parser.feed(html)
    if len(parser.ids) != len(set(parser.ids)):
        raise ValueError('Duplicate static HTML/SVG ID')
    if parser.external or re.search(r'@import|url\(\s*[\'\"]?(?!#|data:)', html, re.I):
        raise ValueError(f'Unexpected external dependency: {parser.external}')
    scripts = re.findall(r'<script(?:\s[^>]*)?>([\s\S]*?)</script>', html)
    for script in scripts:
        subprocess.run(['node', '--check'], input=script, text=True, encoding='utf-8', check=True)
    if '<!-- EXAMPLE-SVG -->' in html or "/* EXAMPLE-SOURCE */ ''" in html:
        raise ValueError('Diagram has not been built into sample')
    svg = (KIT / 'diagram.svg').read_text(encoding='utf-8')
    if svg not in html:
        raise ValueError('Embedded SVG differs from generated asset')
    source = (KIT / 'diagram.puml').read_text(encoding='utf-8')
    match = re.search(r'const DIAGRAM_SOURCE=(.*);\nrenderRows', html)
    if not match or json.loads(match[1]) != source:
        raise ValueError('Embedded diagram source differs')
    pure = re.search(r'/\* MODEL-START[^*]*\*/([\s\S]*?)/\* MODEL-END \*/', html)[1]
    checks = r'''
const assert=require('node:assert/strict');
const m=createModel(), initial=m.snapshot();
assert.equal(m.read('missing'), null, 'missing ID must not pick another row');
const copy=m.read('r2');copy.name='uncommitted';
assert.deepEqual(m.snapshot(),initial,'draft must not mutate source');
assert.equal(m.save('missing',copy,'bad',false).ok,false);
assert.equal(m.save('r2',{...copy,name:' '},'blank',false).ok,false);
assert.equal(m.save('r2',copy,'fail',true).ok,false);
assert.deepEqual(m.snapshot(),initial,'invalid/failed saves must not partially write');
assert.equal(m.save('r2',copy,'valid',false).ok,true);
assert.deepEqual(m.read('r1'),initial.rows[0],'same-name first record must not change');
assert.equal(m.read('r2').name,'uncommitted');
assert.equal(m.save('r2',{...copy,name:'duplicate'},'valid',false).ok,false);
assert.equal(m.snapshot().version,1);
assert.equal(m.snapshot().executions,1,'replay must execute once');
assert.deepEqual(createModel().snapshot(),initial,'new session must restore fixture');
console.log('PASS: missing ID; isolated draft; invalid/failed no-write; stable target; exactly-once replay; reset fixture');
'''
    result = subprocess.run(['node'], input=pure + checks, text=True, encoding='utf-8', check=True, capture_output=True)
    print(result.stdout.strip())
    print(f'PASS: {len(scripts)} script syntax; unique static IDs; no static resource dependency; SVG/source sync')
    print('UNVERIFIED: browser layout, scrolling, focus, layer exits, clicks, visible SVG scaling, offline execution')
    print('sample_sha256=' + hashlib.sha256((KIT / 'review-kit.html').read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
