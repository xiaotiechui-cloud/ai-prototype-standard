"""Read saved review snapshots only; emit bounded evidence and SVG structure checks."""
from pathlib import Path
import collections
import hashlib
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
SNAP = Path(r'C:\Users\xiaot\AppData\Local\Temp\trial13-review-20261027')
OUT = ROOT / '_data'

def read(p):
    return p.read_text(encoding='utf-8-sig')

def dump(name, obj):
    (OUT / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

data = json.loads(read(SNAP / 'trial-parts/DATA.json'))
patterns = {
    'phone': r'^\.phone\{', 'screen': r'^\.screen\{',
    'field_input': r'^\.field input', 'radio_css': r'^\.radio-line',
    'app_tabs': r'function appTabs', 'app_home': r'function appHome',
    'app_order_list': r'function appOrderList', 'web_order_list': r'function webOrderList',
    'search_key': r'function onKey', 'action_dispatch': r'function onClick',
    'home_config': r'function renderHomeConfig', 'search_config': r'function renderSearchConfig',
    'save_home': r"act==='save-home'|function saveHomeDraft", 'save_search': r'function saveSearch',
    'save_service': r'function saveService', 'save_wallet': r'function saveWallet',
    'save_role': r'function saveRole', 'quick_nav': r'quickNav|搜索商品.*我的订单',
    'buy_radio': r'type="radio"', 'search_inputs': r'id="(?:wsearchInput|searchInput)"',
    'esc': r"e.key==='Escape'", 'search_submit': r"act==='(?:wsearch-submit|search-submit)'",
    'tab_go': r'function go\(', 'modal_host': r'class="modal-mask',
    'admin_system': r'权限管理.*操作记录', 'drag': r'dragstart|draggable|pointerdown|mousedown',
    'final_drag': r'function bindAdm(?:Home|Goods|Search)DnD',
    'final_radio': r'\.ver-radio',
}
evidence = []
for side in ('trial', 'final'):
    html = next((SNAP / side).glob('*.html'))
    for n, line in enumerate(read(html).splitlines(), 1):
        if len(line) > 8000:
            continue
        for key, pat in patterns.items():
            if re.search(pat, line):
                evidence.append({'side': side, 'file': html.name, 'line': n,
                                 'key': key, 'excerpt': line.strip()[:500]})
dump('source-evidence.json', evidence)

prd = next(d for d in data['docs'] if 'PRD' in d.get('file', ''))
selected = []
for n, line in enumerate(prd['md'].splitlines(), 1):
    if any(p in line for p in ('ORDER-01', 'HOME-01', 'SEARCH-04', 'ADM-01', '不新增', '头像', '搜索历史', '换一批', '视频')):
        selected.append({'line': n, 'excerpt': line[:650]})
dump('prd-evidence.json', {'file': prd['file'], 'source': 'window.DATA.docs; embedded logical line numbers',
                          'sha256_utf8': hashlib.sha256(prd['md'].encode()).hexdigest(), 'items': selected})

svg_results = []
for d in data['diagrams']:
    result = {'id': d['id'], 'type': d.get('type'), 'checks_are': 'XML structure only; not visual or business validation'}
    try:
        root = ET.fromstring(d.get('svg', ''))
        nodes = list(root.iter())
        counts = collections.Counter(e.attrib['id'] for e in nodes if 'id' in e.attrib)
        texts = [e for e in nodes if e.tag.split('}')[-1] == 'text']
        result.update(xml_parse=True, viewBox=root.attrib.get('viewBox'), width=root.attrib.get('width'),
                      height=root.attrib.get('height'), text_count=len(texts),
                      empty_text_count=sum(not ''.join(e.itertext()).strip() for e in texts),
                      duplicate_ids=[k for k, v in counts.items() if v > 1])
    except Exception as exc:
        result.update(xml_parse=False, error=str(exc))
    svg_results.append(result)
dump('svg-structure-check.json', svg_results)

checks = json.loads(read(SNAP / 'trial/_checks/diagram-check.json'))
typed = [{'id': r.get('id'), 'ok_type': type(r.get('ok')).__name__, 'ok': r.get('ok'),
          'detail': r.get('detail')} for r in checks['results'] if type(r.get('ok')) is not bool]
dump('check-schema-audit.json', {'claimed_total': checks.get('total'), 'claimed_pass': checks.get('pass'),
    'strict_true': sum(r.get('ok') is True for r in checks['results']),
    'strict_false': sum(r.get('ok') is False for r in checks['results']),
    'invalid_count': len(typed), 'invalid_items': typed,
    'meaning': 'Invalid result schema; not a claim that the diagram itself failed.'})

inv = json.loads(read(OUT / 'inventory.json'))
aligned = {'basis': 'Manual semantic responsibility mapping; different PRDs, no numeric quality score.',
 'trial_pages': inv['trial_model']['pages'], 'final_pages': inv['final_model']['pages'],
 'responsibilities': [
  {'group': 'browse/search/detail/purchase', 'trial': 'APP + WEB', 'final': 'A/B + PC', 'assessment': 'common responsibility, align states before comparing'},
  {'group': 'profile/order/service', 'trial': 'APP/WEB order list; no profile view', 'final': 'My view + order branches', 'assessment': 'trial PRD ORDER-01 nickname/avatar missing; not a mandatory universal My page'},
  {'group': 'home/search configuration', 'trial': 'text and checkbox forms', 'final': 'lists with drag handles', 'assessment': 'compare required configuration semantics, not identical forms'},
  {'group': 'search history/random recommendations/video', 'trial': 'explicit exclusions', 'final': 'present', 'assessment': 'PRD or later project decision; do not copy automatically'},
  {'group': 'telemetry', 'trial': '0 front-end events', 'final': '52 events', 'assessment': 'scope difference; not a defect by count'}]}
dump('scope-alignment.json', aligned)
print(json.dumps({'evidence_items': len(evidence), 'prd_quotes': len(selected), 'svg_count': len(svg_results),
 'svg_xml_failed': sum(not x['xml_parse'] for x in svg_results),
 'empty_text_total': sum(x.get('empty_text_count', 0) for x in svg_results),
 'invalid_check_results': len(typed)}, ensure_ascii=True))
