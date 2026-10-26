"""Bounded component evidence. Source and cached sidecars are read only."""
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CACHE = Path('D:/资料备份/杂乱无章/output/steam-prototype-review-20261020')
SOURCE = Path('D:/模型汇总/CDK商城/Steam商城原型交付_V1.0/02_低保真交互原型-最终版本.html')
baseline = json.loads((ROOT / '01_结构与尺寸证据.json').read_text(encoding='utf-8'))
raw = SOURCE.read_bytes()
assert hashlib.sha256(raw).hexdigest() == baseline['sha256'], 'Source changed; review baseline first'
html = raw.decode('utf-8-sig').replace('\r\n', '\n')
blocks = list(re.finditer(r'<script\b[^>]*>(.*?)</script\s*>', html, re.S | re.I))
assert len(blocks) == 12
functions = []
function_names = set('navBar tabBar modalMask modalHead stateBlock mediaCarousel renderPanel rAuth rAgreement deskShell webNav payQrModal admHomePicker admRegionPicker admGoodsEditor admSrPicker admOrderRefundDrawer admNotifyTplOverlay admAgreeViewer admAgreeEditor admConfirmBox admToastBox admField admFilters admTabs admTable admPager admBatchBar admDrawer go admSyncScrollLock admOpenConfirm admConfirmOk admConfirmCancel bindActs bindAdmHomeDnD bindAdmGoodsDnD bindAdmSearchDnD doBuy resolvePayQuery admModalValidate stopBannerTimer startBannerTimer openDiagram closeDiagram openDoc closeReader downloadDoc'.split())
for index, block in enumerate(blocks[:9]):
    cached = (CACHE / f'final-script-{index}.js').read_text(encoding='utf-8-sig').replace('\r\n', '\n')
    assert cached == block[1], f'Stale script sidecar {index}'
    for match in re.finditer(r'function\s+([\w$]+)\s*\(', cached):
        if match[1] in function_names:
            functions.append({'function': match[1], 'script': index,
                              'source_line': html.count('\n', 0, block.start(1) + match.start()) + 1,
                              'sidecar_line': cached.count('\n', 0, match.start()) + 1,
                              'evidence_level': 'static function locator; behavior unverified'})

docs = json.loads((CACHE / 'final-COMP_DOCS.json').read_text(encoding='utf-8-sig'))
families = [
    ('layers', r'弹窗|弹层|面板|抽屉|收银台|阅读|协议正文|资格|绑定提示'),
    ('navigation', r'导航|菜单|标题栏|账号栏|标签栏'),
    ('forms-and-choice', r'输入|勾选|选项|方式选择|规格|筛选|排序栏|权限|授权|表单'),
    ('feedback-and-state', r'状态|加载|失败|失效|反馈|倒计时|提醒|提示'),
    ('data-and-actions', r'列表|表格|卡|分页|批量|导出|复制|提交|按钮|动作|操作|入口'),
    ('media-and-content', r'图片|媒体|轮播|图文|说明|文案|内容|公告|富文本'),
]
selected = set('COM-CLIENT-C01 COM-CLIENT-C05 COM-CLIENT-C09 COM-CLIENT-C13 COM-CLIENT-C14 ADM-COMMON-C03 ADM-COMMON-C05 ADM-COMMON-C06 ADM-COMMON-C07 ADM-COMMON-C08 ADM-COMMON-C09 APP-NOTICE-01-C01 APP-PANEL-01-C01 APP-PANEL-01-C03 APP-PANEL-01-C06 APP-AGREEMENT-01-C02 WEB-CHECKOUT-01-C07 ADM-GOODS-01-C02 ADM-NOTIFY-01-C04 ADM-RBAC-01-C02 ADM-AGREE-01-C02 ADM-AUDIT-01-C02'.split())
rows = []
for key, value in docs.items():
    memberships = [family for family, pattern in families if re.search(pattern, value['name'])]
    row = {'id': key, 'name': value['name'], 'families_by_name_only': memberships or ['project-composition'],
           'section_count': len(value['sections']), 'doc_locator': f'final-COMP_DOCS.json -> {key}',
           'review': 'metadata only; name grouping is not semantic verification'}
    if key in selected:
        row['review'] = 'selected contract excerpts inspected; not full semantic or runtime acceptance'
        row['short_contract_evidence'] = [
            {'section': section['n'], 'title': section['title'], 'excerpt': section['md'][:240],
             'evidence_level': 'embedded document intent; not observed outcome'}
            for section in value['sections'] if section['n'] in (3, 4, 5, 6, 9)
        ]
    rows.append(row)

css = (CACHE / 'final-style-0.css').read_text(encoding='utf-8-sig')
style_start = re.search(r'<style\b[^>]*>', html, re.I).end()
assert html[style_start:html.index('</style>', style_start)] == css.replace('\r\n', '\n')
clean = re.sub(r'/\*.*?\*/', lambda m: ''.join('\n' if c == '\n' else ' ' for c in m[0]), css, flags=re.S)
rules = []
for match in re.finditer(r'([^{}]+)\{([^{}]*)\}', clean):
    selector = ' '.join(match[1].split())
    if re.search(r'\.(?:modal|adm-mask|adm-dlg|adm-toast|btn|inp|lbl|kv|opt|tabbar|carousel|empty|choice|tag|toast|timeline|notice|reader|dgm)', selector):
        start = match.start(1) + len(match[1]) - len(match[1].lstrip())
        rules.append({'selector': selector, 'source_line': html.count('\n', 0, style_start) + css.count('\n', 0, start) + 1,
                      'declarations': dict((k.strip(), v.strip()) for k, v in re.findall(r'([\w-]+)\s*:\s*([^;]+)', match[2])),
                      'evidence_level': 'static declaration; cascade and geometry unverified'})

result = {'source': str(SOURCE), 'sha256': baseline['sha256'], 'cached_executable_scripts_verified': 9,
          'doc_count': len(rows), 'selected_doc_contracts': sum('short_contract_evidence' in r for r in rows),
          'family_memberships_nonexclusive': dict(Counter(f for r in rows for f in r['families_by_name_only'])),
          'components': rows, 'function_locators': functions, 'component_style_rules': rules,
          'limits': ['No full HTML, script, or embedded document copied here.',
                     'Metadata classification is not full coverage or acceptance.',
                     'Short excerpts record source intent, including contradictions; do not automatically promote to standards.',
                     'Browser file access was rejected; no alternative access attempted.']}
(ROOT / '05_组件与弹层证据.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'documents': result['doc_count'], 'selected_contracts': result['selected_doc_contracts'],
                  'functions': len(functions), 'style_occurrences': len(rules), 'scripts_cache_verified': 9}))
