"""Static and pure-function checks for IK-01; browser evidence is separate."""
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'reference/implementations/input-kit'


class Elements(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids = []; self.labels = []; self.dependencies = []

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        if 'id' in attr:
            self.ids.append(attr['id'])
        if tag == 'label' and 'for' in attr:
            self.labels.append(attr['for'])
        if 'src' in attr or (tag == 'link' and 'href' in attr):
            self.dependencies.append(attr)


def check_css_isolation(html):
    """Small fixture lint, NOT a general CSS parser or a cascade proof."""
    css = re.search(r'<style>(.*?)</style>', html, re.S).group(1)
    for selector, body in re.findall(r'([^{}]+)\{([^{}]+)\}', css):
        if not re.search(r'(?:^|;)\s*(?:width|height|min-height|padding|margin|flex)\s*:', body):
            continue
        for part in selector.split(','):
            if re.search(r'\binput\b', part) and not re.search(r'input\[type=["\'](?:text|email|radio|checkbox)["\']\]', part):
                raise ValueError(f'Unscoped input geometry in fixture: {part.strip()}')


def main():
    html = (KIT / 'input-kit.html').read_text(encoding='utf-8')
    profile = json.loads((KIT / 'profile.json').read_text(encoding='utf-8'))
    baseline = json.loads((KIT / 'baseline.json').read_text(encoding='utf-8'))
    manifest = json.loads((ROOT / 'standard-manifest.json').read_text(encoding='utf-8'))
    assert baseline['standard']['content_revision'] == manifest['content_revision'], 'stale baseline revision'
    for item in baseline['files'] + baseline['standard']['modules']:
        assert hashlib.sha256((ROOT / item['path']).read_bytes()).hexdigest() == item['sha256'], f'baseline drift: {item["path"]}'
    parser = Elements(); parser.feed(html)
    assert len(parser.ids) == len(set(parser.ids)), 'duplicate static ID'
    assert set(parser.labels) <= set(parser.ids), 'broken label target'
    assert not parser.dependencies, 'static external dependency'
    assert not re.search(r'@import|url\(|\bfetch\s*\(|XMLHttpRequest', html), 'network/static resource dependency'
    assert f'data-profile="{profile["id"]}"' in html
    assert f'data-profile-revision="{profile["revision"]}"' in html
    for token, value in profile['tokens'].items():
        assert f'{token}:{value}' in html, f'missing token {token}'
    for component in profile['components']:
        assert f'data-component="{component["id"]}"' in html
        assert f'data-pattern="{component["pattern"]}"' in html
        assert f'data-variant="{component["variant"]}"' in html
    check_css_isolation(html)
    # Verify that the fixture lint itself rejects the reported regression shape.
    try:
        check_css_isolation(html.replace('</style>', 'input{width:100%;padding:8px}</style>'))
    except ValueError:
        pass
    else:
        raise AssertionError('lint accepted generic input geometry')
    scripts = re.findall(r'<script>(.*?)</script>', html, re.S)
    with tempfile.TemporaryDirectory(prefix='input-kit-check-') as temp:
        for i, script in enumerate(scripts):
            path = Path(temp) / f'script-{i}.js'; path.write_text(script, encoding='utf-8')
            subprocess.run(['node', '--check', str(path)], check=True, capture_output=True, text=True)
        pure = re.search(r'// PURE-MODEL-BEGIN(.*?)// PURE-MODEL-END', html, re.S).group(1)
        assertions = '''
const assert = require('node:assert/strict');
assert.deepEqual(validateInput({name:' ',consent:false}), {name:true,consent:true});
assert.deepEqual(validateInput({name:'中文',consent:true}), {name:false,consent:false});
assert.deepEqual(validateInput({name:'名称',consent:'true'}), {name:false,consent:true});
assert.deepEqual(validateInput({name:'',consent:true}), {name:true,consent:false});
const original={name:'  长名称  ',consent:true};
validateInput(original); assert.equal(original.name,'  长名称  ');
'''
        path = Path(temp) / 'pure-test.js'; path.write_text(pure + assertions, encoding='utf-8')
        subprocess.run(['node', str(path)], check=True, capture_output=True, text=True)
    print('PASS: script syntax; static IDs/labels/dependencies; profile bindings; scoped geometry lint and pollution counterexample; pure validation/no mutation')
    print('UNVERIFIED: computed geometry, clicks/keyboard/labels, focus, long text, offline browser execution, project integration')
    print('sample_sha256=' + hashlib.sha256((KIT / 'input-kit.html').read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
