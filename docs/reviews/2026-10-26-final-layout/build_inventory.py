"""Read-only, bounded source inventory. Never prints embedded HTML or documents."""
import hashlib
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = Path('D:/模型汇总/CDK商城/Steam商城原型交付_V1.0/02_低保真交互原型-最终版本.html')
SIDECAR = Path('D:/资料备份/杂乱无章/output/steam-prototype-review-20261020/final-style-0.css')
SELECTORS = [':root', '.shell', '.rv-layout', '.panel', '.phone', '.phone .notch',
             '.phone-body .card', '.desk-body', '.desk-container', '.page-head',
             '.sec-head', '.admin-canvas', '.admin-content', '.admin-filter-grid',
             '.admin-filter-grid .fld', '.admin-canvas .mini,.mini', '.adm-dlg',
             '.adm-dlg.confirm', '.adm-dlg.form', '.adm-dlg .dt .acts', '.card',
             '.row', '.col', '.btn', '.inp', '.lbl', '.hint', '.grid2', '.grid-auto',
             '.split2', '.split2.pay', '.modal', '.modal.center', '.desk .modal.dlg',
             '.reader', '.reader-doc', '.md-p', '.md-tbl-wrap', '.goods-card .nm']

class Inventory(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.tags = Counter()
        self.style_blocks = []
        self.current_style = None
        self.script_count = 0
        self.ids = []

    def handle_starttag(self, tag, attrs):
        self.tags[tag] += 1
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append({'id': attrs['id'], 'line': self.getpos()[0]})
        if tag == 'style':
            self.current_style = {'line': self.getpos()[0], 'text': ''}
        if tag == 'script':
            self.script_count += 1

    def handle_endtag(self, tag):
        if tag == 'style' and self.current_style is not None:
            self.style_blocks.append(self.current_style)
            self.current_style = None

    def handle_data(self, data):
        if self.current_style is not None:
            self.current_style['text'] += data

raw = SOURCE.read_bytes()
parser = Inventory()
parser.feed(raw.decode('utf-8-sig'))
css = SIDECAR.read_text(encoding='utf-8-sig')
assert len(parser.style_blocks) == 1, 'Additional styles require a new extraction review'
assert parser.style_blocks[0]['text'].replace('\r\n', '\n') == css.replace('\r\n', '\n'), 'Cached CSS is stale'

# This source uses flat declaration bodies inside container/media groups. This
# bounded locator preserves duplicate selectors; it is not a CSS cascade engine.
clean = re.sub(r'/\*.*?\*/', lambda m: ''.join('\n' if c == '\n' else ' ' for c in m[0]), css, flags=re.S)
rows = []
all_values = Counter()
for match in re.finditer(r'([^{}]+)\{([^{}]*)\}', clean):
    selector = ' '.join(match[1].split())
    declarations = dict((k.strip(), v.strip()) for k, v in re.findall(r'([\w-]+)\s*:\s*([^;]+)', match[2]))
    for key, value in declarations.items():
        if key in ('gap', 'padding', 'font-size', 'border-radius', 'min-height'):
            all_values[(key, value)] += 1
    if selector in SELECTORS or selector.startswith('.admin-canvas table.admin-table'):
        start = match.start(1) + len(match[1]) - len(match[1].lstrip())
        line = css.count('\n', 0, start) + parser.style_blocks[0]['line']
        rows.append({'selector': selector, 'source_line': line, 'declarations': declarations,
                     'status': 'static declaration; order retained; computed style unverified'})

old = json.loads((SIDECAR.parent / 'final-inventory.json').read_text(encoding='utf-8-sig'))
assert old['sha256'] == hashlib.sha256(raw).hexdigest()
result = {
    'source': str(SOURCE), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(),
    'cached_css_matches_source': True, 'style_blocks': len(parser.style_blocks),
    'script_blocks': parser.script_count, 'static_tag_counts': dict(parser.tags),
    'static_ids_only': parser.ids, 'embedded_counts_reused': {k: old[k] for k in ('COMP_DOCS', 'DIAGRAMS', 'DOCS')},
    'limitations': ['Static tags omit dynamically rendered pages.', 'Selectors may be overridden by inline styles or scripts.',
                    'Declaration locations are not computed styles.', 'Browser local-file access was rejected; no workaround attempted.'],
    'selected_rules_in_source_order': rows,
    'frequent_declarations': [{'property': k, 'value': v, 'occurrences': n} for (k, v), n in all_values.most_common(45)]
}
(ROOT / '01_结构与尺寸证据.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'bytes': len(raw), 'style_blocks': len(parser.style_blocks), 'script_blocks': parser.script_count,
                  'selected_rule_occurrences': len(rows), 'cache_verified': True,
                  'locations': [{'selector': r['selector'], 'line': r['source_line']} for r in rows]}, ensure_ascii=False))
