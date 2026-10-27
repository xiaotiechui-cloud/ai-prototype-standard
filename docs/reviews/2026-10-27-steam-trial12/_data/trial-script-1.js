/* ============ 核心工具、数据与会话 ============ */
const INJ = window.__INJECT__ || {};
const PROFILE = INJ.PROFILE;
const PAGES = INJ.PAGES;
const INSTANCES = INJ.INSTANCES;
const INSTANCE_BY_ID = Object.fromEntries(INSTANCES.map(i => [i.id, i]));
const COMP_DOCS = INJ.COMP_DOCS || {};
const DIAGRAMS = INJ.DIAGRAMS || [];
const DOCS = INJ.DOCS || [];
const COUNTS = INJ.COUNTS || {};
const ENDS = INJ.ENDS || [];
const PAGE_BY_ID = Object.fromEntries(PAGES.map(p => [p.id, p]));

const RV = {
  end: 'APP', pageId: 'APP-HOME-01', state: 'DEFAULT', sim: 'ok',
  selectedComponent: null, outline: false, from: null,
  readerOpen: false, readerDoc: null, readerHist: [], readerScroll: 0,
  diagramOpen: false, diagramId: null, diagramZoom: 'fit'
};
const SESSION = {
  platform: 'A',
  loggedIn: true,
  realName: 'verified',          // verified / unverified / minor / unknown
  phoneBound: true,
  agreementAccepted: false,
  agreementVersion: 'V1.6',
  substantiveChange: false,
  noticeShown: false,
  user: { name: '测试玩家', id: 'U-1001', maskedPhone: '138****8000' },
  search: { draft: '', query: '', sort: 'recommend' },
  buy: { productId: null, skuId: 'std', deliveryType: 'CODE', friendLink: '', payMethod: 'WECHAT', agreement: false },
  currentOrderId: null,
  orderTab: 'all',
  admin: { role: '管理员', account: 'admin01', loggedIn: true, collapsed: false },
  conditions: { stock: 'auto', balance: 'auto', order: 'auto' },
  orderScenarioProductId: 'P-1001',
  friendLinkTouched: false,
  codeShown: false,
  phoneDraft: '', smsCode: '', privacyAccepted: false
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (cents) => '¥' + (Number(cents || 0) / 100).toFixed(2);
const nowText = () => '2026-10-27 10:20';
const pad = n => String(n).padStart(2, '0');

const ICONS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
  service: '<path d="M4 13a8 8 0 0116 0v3a2 2 0 01-2 2h-2v-5h4"/><path d="M4 13v3a2 2 0 002 2h2v-5H4"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',
  orders: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  copy: '<rect x="8" y="8" width="10" height="12"/><path d="M6 16H4V4h10v2"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 9v5M12 17v1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
  gift: '<rect x="4" y="9" width="16" height="11"/><path d="M2 9h20v4H2zM12 9v11M8 9c-2 0-3-1-3-3s3-3 5 1c1 2 2 2 2 2M16 9c2 0 3-1 3-3s-3-3-5 1c-1 2-2 2-2 2"/>',
  code: '<rect x="3" y="5" width="18" height="14"/><path d="M7 9h4v6H7zM14 9h3M14 12h3M14 15h2"/>',
  refund: '<path d="M4 10a8 8 0 111 5"/><path d="M4 4v6h6"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  up: '<path d="M6 14l6-6 6 6"/>',
  down: '<path d="M6 10l6 6 6-6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>'
};
const ico = (name, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;

function C(id, inner, variant = '', tag = 'div', cls = '') {
  const inst = INSTANCE_BY_ID[id];
  if (!inst) {
    console.error('UNREGISTERED COMPONENT', id);
    return `<${tag} class="cmp ${cls}" data-registry-error="${esc(id)}">组件未登记：${esc(id)}</${tag}>`;
  }
  return `<${tag} class="cmp ${cls}" data-component="${id}" data-mode="${esc(inst.mode)}" data-variant="${esc(variant || inst.variant)}" data-state="${esc(RV.state)}" data-region="${esc(inst.region)}" data-ui-profile="${esc(PROFILE.uiProfileId)}" data-ui-profile-hash="${esc(PROFILE.uiProfileHash)}">${inner}</${tag}>`;
}

function writeClipboard(text, okMsg) {
  const done = () => showToast(okMsg || '已复制');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove();
    if (ok) done(); else showToast('复制失败，请手动选择文本', 'err');
  } catch (e) { showToast('复制失败，请手动选择文本', 'err'); }
}

function showToast(msg, kind = 'ok') {
  $$('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast ' + (kind === 'err' ? 'err' : 'ok');
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

let pendingConfirm = null;
function openConfirm({ title, body, obj, ok = '确认', cancel = '取消', note = '', tone = 'normal', act, args }) {
  pendingConfirm = { act, args };
  const host = $('#modalHost');
  host.innerHTML = `<div class="dialog confirm" role="dialog" aria-modal="true" aria-labelledby="cfTitle">
    <div class="dialog-head"><h3 id="cfTitle">${esc(title)}</h3><button class="icon-btn" data-act="close-modal" aria-label="关闭">${ico('close')}</button></div>
    <div class="dialog-body"><p>${esc(body)}</p>${obj ? `<p class="small muted">对象：${esc(obj)}</p>` : ''}${note ? `<div class="notice ${tone === 'danger' ? 'err' : ''}">${esc(note)}</div>` : ''}</div>
    <div class="dialog-foot"><button class="btn" data-act="close-modal">${esc(cancel)}</button><button class="btn ${tone === 'danger' ? 'danger' : 'primary'}" data-act="confirm-ok">${esc(ok)}</button></div>
  </div>`;
  host.classList.add('open');
  setTimeout(() => host.querySelector('[data-act="confirm-ok"]')?.focus(), 20);
}
function closeModal() {
  const host = $('#modalHost');
  host.classList.remove('open');
  host.innerHTML = '';
  pendingConfirm = null;
}
function confirmOk() {
  const p = pendingConfirm;
  closeModal();
  if (p && typeof ACTIONS[p.act] === 'function') ACTIONS[p.act](...(p.args || []));
}

const ACTIONS = {};
function reg(name, fn) { ACTIONS[name] = fn; }

/* ================= 模拟数据 ================= */
const DATA = {};
DATA.products = [
  { id: 'P-1001', name: '赛博朋克 2077：往日之影', en: 'Cyberpunk 2077: Phantom Liberty', price: 25800, cost: 21000, lowest: 24000, delivery: 'CODE', sale: 'ON', stock: 12, stockState: 'FRESH', media: 3, cover: 'CP', desc: '在夜之城展开新的谍战故事。购买后通过供应商自动取码，口令码在支付成功并保存后展示。', limits: 'Steam 国区账号激活；不支持 7 天无理由退货；具体可激活地区以供应商结果为准。', notice: '虚拟商品一经履约原则上不退款；如遇发码异常，请联系企业微信客服并提供订单号。' },
  { id: 'P-1002', name: '艾尔登法环', en: 'ELDEN RING', price: 29800, cost: 25000, lowest: 28000, delivery: 'CODE', sale: 'SOLD_OUT', stock: 0, stockState: 'FRESH', media: 2, cover: 'ER', desc: '开放世界动作角色扮演游戏。当前供应商库存缓存为 0 且同步新鲜，前台显示售罄。', limits: 'Steam 国区账号激活；不支持 7 天无理由退货。', notice: '库存以供应商缓存为准；补货后恢复购买。' },
  { id: 'P-1003', name: '博德之门 3', en: "Baldur's Gate 3", price: 26800, cost: 22000, lowest: 25000, delivery: 'CODE', sale: 'ON', stock: null, stockState: 'STALE', media: 2, cover: 'BG', desc: '基于龙与地下城规则的回合制角色扮演游戏。库存缓存已过期，允许下单但以付款后供应商结果为准。', limits: 'Steam 国区账号激活；不支持 7 天无理由退货。', notice: '库存信息暂未确认；付款后以供应商结果为准，失败自动退款/补货。' },
  { id: 'P-1004', name: '荒野大镖客 2', en: 'Red Dead Redemption 2', price: 19800, cost: 16000, lowest: 18000, delivery: 'GIFT', sale: 'ON', stock: null, stockState: 'NA', media: 1, cover: 'RD', desc: '西部题材开放世界游戏。好友赠送由运营在每天 8:00～18:00 人工交付。', limits: '需要 Steam 好友链接；付款后不可修改；具体链接类型以供应商确认为准。', notice: '好友赠送按自然日累计 2 小时承诺；节假日由运营排班保障。' },
  { id: 'P-1005', name: '双人成行', en: 'It Takes Two', price: 12800, cost: 10000, lowest: 12000, delivery: 'GIFT', sale: 'ON', stock: null, stockState: 'NA', media: 1, cover: 'IT', desc: '双人合作冒险游戏。好友赠送人工交付，付款后锁定好友链接。', limits: '需要 Steam 好友链接；付款后不可修改。', notice: '每天 8:00～18:00 交付，按自然日累计 2 小时。' },
  { id: 'P-1006', name: '组合商品：经典合集', en: 'Classic Bundle', price: 39800, cost: 33000, lowest: 38000, delivery: 'CODE', sale: 'UNAVAILABLE', stock: 8, stockState: 'FRESH', media: 1, cover: 'CB', desc: '供应商组合商品，首期不上架、不自动发码。', limits: '组合商品首期不售。', notice: '组合商品需人工白名单确认；首期不上架。' },
  { id: 'P-1007', name: '未发布测试商品', en: 'Draft Product', price: 9900, cost: 8000, lowest: 9000, delivery: 'CODE', sale: 'DRAFT', stock: 5, stockState: 'FRESH', media: 1, cover: 'DR', desc: '尚未选品发布的候选商品。', limits: '未发布。', notice: '未发布商品不进入前台。' }
];
DATA.products[0].skus = [{ id: 'std', name: '标准版', price: 25800 }, { id: 'deluxe', name: '豪华版', price: 31800 }];
DATA.products[3].skus = [{ id: 'std', name: '标准版', price: 19800 }];
DATA.productById = id => DATA.products.find(p => p.id === id);

DATA.orders = [
  { id: 'SO202610270001', productId: 'P-1001', title: '赛博朋克 2077：往日之影', spec: '标准版', amount: 25800, pay: 'PAID', delivery: 'ISSUING', refund: 'NONE', display: '已支付·发码中', tab: 'paid', time: '2026-10-27 09:12', platform: 'A', user: 'U-1001', deliveryType: 'CODE', friendLink: '' },
  { id: 'SO202610270002', productId: 'P-1001', title: '赛博朋克 2077：往日之影', spec: '标准版', amount: 25800, pay: 'PAID', delivery: 'DELIVERED', refund: 'NONE', display: '已交付', tab: 'delivered', time: '2026-10-27 08:40', platform: 'A', user: 'U-1001', deliveryType: 'CODE', friendLink: '', code: 'VG-7K2M-9QPL-2026' },
  { id: 'SO202610270003', productId: 'P-1004', title: '荒野大镖客 2', spec: '标准版', amount: 19800, pay: 'PAID', delivery: 'GIFT_PROCESSING', refund: 'NONE', display: '已支付·赠送处理中', tab: 'paid', time: '2026-10-27 08:05', platform: 'B', user: 'U-1001', deliveryType: 'GIFT', friendLink: 'https://s.team/p/abcd-efgh' },
  { id: 'SO202610270004', productId: 'P-1003', title: '博德之门 3', spec: '标准版', amount: 26800, pay: 'CONFIRMING', delivery: 'NOT_STARTED', refund: 'NONE', display: '支付确认中', tab: 'confirming', time: '2026-10-26 21:30', platform: 'A', user: 'U-1001', deliveryType: 'CODE', friendLink: '' },
  { id: 'SO202610270005', productId: 'P-1001', title: '赛博朋克 2077：往日之影', spec: '标准版', amount: 25800, pay: 'UNPAID', delivery: 'NOT_STARTED', refund: 'NONE', display: '待支付', tab: 'unpaid', time: '2026-10-27 10:00', platform: 'A', user: 'U-1001', deliveryType: 'CODE', friendLink: '', expiresAt: '2026-10-27 10:30' },
  { id: 'SO202610270006', productId: 'P-1002', title: '艾尔登法环', spec: '标准版', amount: 29800, pay: 'CLOSED', delivery: 'NOT_STARTED', refund: 'NONE', display: '已关闭', tab: 'closed', time: '2026-10-26 18:00', platform: 'C', user: 'U-1001', deliveryType: 'CODE', friendLink: '' },
  { id: 'SO202610270007', productId: 'P-1005', title: '双人成行', spec: '标准版', amount: 12800, pay: 'PAID', delivery: 'DELIVERED', refund: 'FAILED', display: '退款失败', tab: 'refund', time: '2026-10-25 14:20', platform: 'B', user: 'U-1001', deliveryType: 'GIFT', friendLink: 'https://s.team/p/zzzz-yyyy', refundReason: '渠道退回失败：银行卡状态异常' },
  { id: 'SO202610270008', productId: 'P-1003', title: '博德之门 3', spec: '标准版', amount: 26800, pay: 'PAID', delivery: 'NOT_STARTED', refund: 'REFUNDING', display: '退款中', tab: 'refund', time: '2026-10-25 11:05', platform: 'A', user: 'U-1001', deliveryType: 'CODE', friendLink: '' },
  { id: 'SO202610270009', productId: 'P-1001', title: '赛博朋克 2077：往日之影', spec: '标准版', amount: 25800, pay: 'PAID', delivery: 'DELIVERED', refund: 'REFUNDED', display: '已退款', tab: 'refund', time: '2026-10-24 16:40', platform: 'A', user: 'U-1001', deliveryType: 'CODE', friendLink: '' },
  { id: 'SO202610270010', productId: 'P-1003', title: '博德之门 3', spec: '标准版', amount: 26800, pay: 'PAID', delivery: 'EXCEPTION', refund: 'NONE', display: '交付异常', tab: 'exception', time: '2026-10-24 10:12', platform: 'C', user: 'U-1001', deliveryType: 'CODE', friendLink: '', error: '供应商 pu005 出库失败，24 小时内重试' },
  { id: 'SO202610270011', productId: 'P-1004', title: '荒野大镖客 2', spec: '标准版', amount: 19800, pay: 'PAID', delivery: 'GIFT_PENDING', refund: 'NONE', display: '已支付·赠送待处理', tab: 'paid', time: '2026-10-27 09:50', platform: 'A', user: 'U-1001', deliveryType: 'GIFT', friendLink: 'https://s.team/p/abcd-1234' },
  { id: 'SO202610270012', productId: 'P-1001', title: '赛博朋克 2077：往日之影', spec: '标准版', amount: 25800, pay: 'UNPAID', delivery: 'NOT_STARTED', refund: 'NONE', display: '待支付', tab: 'unpaid', time: '2026-10-27 10:05', platform: 'A', user: 'U-1001', deliveryType: 'CODE', friendLink: '', note: '晚到款场景：同商品新未支付单' },
  { id: 'SO202610270013', productId: 'P-1001', title: '赛博朋克 2077：往日之影', spec: '标准版', amount: 25800, pay: 'PAID', delivery: 'DELIVERED', refund: 'NONE', display: '已交付', tab: 'delivered', time: '2026-10-27 10:06', platform: 'A', user: 'U-1001', deliveryType: 'CODE', friendLink: '', code: 'VG-8N3X-1ABC-2026', note: '晚到款场景：同商品新已支付单' }
];
DATA.orderById = id => DATA.orders.find(o => o.id === id);

DATA.candidates = [
  { gid: 1001, name: '赛博朋克 2077：往日之影', en: 'Cyberpunk 2077: Phantom Liberty', cost: 21000, lowest: 24000, retail: 25800, status: 'PUBLISHED', selected: true, content: '完整', combo: false, synced: '2026-10-27 09:55', platform: 'steam', supplier: 'XX发行' },
  { gid: 1002, name: '艾尔登法环', en: 'ELDEN RING', cost: 25000, lowest: 28000, retail: 29800, status: 'PUBLISHED', selected: true, content: '完整', combo: false, synced: '2026-10-27 09:55', platform: 'steam', supplier: 'XX发行' },
  { gid: 1003, name: '博德之门 3', en: "Baldur's Gate 3", cost: 22000, lowest: 25000, retail: 24000, status: 'PRICE_INVALID', selected: true, content: '完整', combo: false, synced: '2026-10-27 09:55', platform: 'steam', supplier: 'YY发行' },
  { gid: 1004, name: '荒野大镖客 2', en: 'Red Dead Redemption 2', cost: 16000, lowest: 18000, retail: 19800, status: 'PUBLISHED', selected: true, content: '完整', combo: false, synced: '2026-10-27 09:55', platform: 'steam', supplier: 'ZZ发行' },
  { gid: 1005, name: '双人成行', en: 'It Takes Two', cost: 10000, lowest: 12000, retail: 12800, status: 'PUBLISHED', selected: true, content: '完整', combo: false, synced: '2026-10-27 09:55', platform: 'steam', supplier: 'ZZ发行' },
  { gid: 1006, name: '组合商品：经典合集', en: 'Classic Bundle', cost: 33000, lowest: 38000, retail: 39800, status: 'COMBO', selected: false, content: '草稿', combo: true, synced: '2026-10-27 09:55', platform: 'steam', supplier: 'XX发行' },
  { gid: 1007, name: '未发布测试商品', en: 'Draft Product', cost: 8000, lowest: 9000, retail: 9900, status: 'DRAFT', selected: false, content: '缺购买须知', combo: false, synced: '2026-10-27 09:55', platform: 'steam', supplier: 'YY发行' }
];

DATA.stockRows = DATA.candidates.map(c => ({ gid: c.gid, name: c.name, stock: c.gid === 1002 ? 0 : c.gid === 1003 ? null : 12, freshness: c.gid === 1002 ? 'FRESH' : c.gid === 1003 ? 'STALE' : 'FRESH', synced: c.synced, sale: c.status === 'PUBLISHED' ? '可售' : '停售', supplier: c.supplier }));

DATA.gifts = [
  { id: 'GIFT-20261027-01', orderId: 'SO202610270003', product: '荒野大镖客 2', link: 'https://s.team/p/abcd-efgh', payTime: '2026-10-27 08:05', status: '处理中', operator: '运营小周', count: 1 },
  { id: 'GIFT-20261027-02', orderId: 'SO202610270011', product: '荒野大镖客 2', link: 'https://s.team/p/abcd-1234', payTime: '2026-10-27 09:50', status: '待处理', operator: '—', count: 1 },
  { id: 'GIFT-20261026-03', orderId: 'SO202610270007', product: '双人成行', link: 'https://s.team/p/zzzz-yyyy', payTime: '2026-10-25 14:20', status: '处理异常', operator: '运营小周', count: 1 }
];
DATA.deliveries = [
  { id: 'D-1001', orderId: 'SO202610270001', gid: 1001, requestId: 'SO202610270001', buyOrderId: 'ws20261027091200001', state: '发码中', retry: 1, deadline: '2026-10-28 09:12', error: '—', code: '—' },
  { id: 'D-1002', orderId: 'SO202610270002', gid: 1001, requestId: 'SO202610270002', buyOrderId: 'ws20261027084000002', state: '已交付', retry: 0, deadline: '—', error: '—', code: 'VG-7K2M-9QPL-2026' },
  { id: 'D-1003', orderId: 'SO202610270010', gid: 1003, requestId: 'SO202610270010', buyOrderId: '—', state: '交付异常', retry: 2, deadline: '2026-10-25 10:12', error: 'pu005 出库失败', code: '—' },
  { id: 'D-1004', orderId: 'SO202610270004', gid: 1003, requestId: 'SO202610270004', buyOrderId: '—', state: '未启动', retry: 0, deadline: '—', error: '支付确认中', code: '—' }
];
DATA.refunds = [
  { id: 'R-1001', orderId: 'SO202610270007', type: '系统异常', amount: 12800, state: '失败', reason: '渠道退回失败：银行卡状态异常', operator: '财务小林', time: '2026-10-26 15:20', retry: 2 },
  { id: 'R-1002', orderId: 'SO202610270008', type: '用户特殊', amount: 26800, state: '退款中', reason: '用户申请，运营审核通过', operator: '财务小林', time: '2026-10-26 10:00', retry: 0 },
  { id: 'R-1003', orderId: 'SO202610270009', type: '系统异常', amount: 25800, state: '成功', reason: '晚到款无法履约', operator: '系统', time: '2026-10-24 17:10', retry: 0 }
];
DATA.notifications = [
  { id: 'N-1001', orderId: 'SO202610270002', event: '口令码已到账', platform: 'A', state: '平台已受理', retry: 0, last: '2026-10-27 08:41', template: 'T-CODE-01', error: '—' },
  { id: 'N-1002', orderId: 'SO202610270001', event: '口令码已到账', platform: 'A', state: '发送失败', retry: 1, last: '2026-10-27 09:12', template: 'T-CODE-01', error: '平台超时' },
  { id: 'N-1003', orderId: 'SO202610270009', event: '退款已发起', platform: 'A', state: '平台已受理', retry: 0, last: '2026-10-24 16:41', template: 'T-REFUND-01', error: '—' },
  { id: 'N-1004', orderId: 'SO202610270009', event: '退款已到账', platform: 'A', state: '待发送', retry: 0, last: '2026-10-24 17:11', template: 'T-REFUND-02', error: '—' }
];
DATA.paychecks = [
  { id: 'PC-1001', orderId: 'SO202610270004', channel: '支付宝', amount: 26800, first: '2026-10-26 21:31', last: '2026-10-27 10:12', state: '待核查', evidence: '—' },
  { id: 'PC-1002', orderId: 'SO202610270006', channel: '微信', amount: 29800, first: '2026-10-26 18:01', last: '2026-10-26 19:30', state: '核查中', evidence: '渠道查询：处理中' }
];
DATA.audits = [
  { id: 'AUD-1001', actor: '运营小周', action: '商品发布', target: 'P-1001 赛博朋克 2077：往日之影', time: '2026-10-27 09:58', before: '待审核', after: '已发布', reason: '内容完整、价格合规' },
  { id: 'AUD-1002', actor: '财务小林', action: '退款执行', target: 'R-1001 / SO202610270007', time: '2026-10-26 15:20', before: '退款中', after: '失败', reason: '渠道退回失败' },
  { id: 'AUD-1003', actor: '管理员', action: '权限变更', target: '角色：运营', time: '2026-10-26 11:00', before: '退款执行=不可', after: '退款执行=不可', reason: '复核权限基线' },
  { id: 'AUD-1004', actor: '运营小周', action: '首页发布', target: 'home-20261027-01', time: '2026-10-27 09:30', before: 'home-20261026-03', after: 'home-20261027-01', reason: '更新广告与推荐' }
];
DATA.wallet = { total: 128000, available: 86000, frozen: 42000, threshold: 100000, queriedAt: '2026-10-27 09:55', state: 'LOW' };
DATA.keywords = ['赛博朋克', '艾尔登法环', '博德之门 3', '荒野大镖客 2', '双人成行'];
DATA.hotProducts = ['P-1001', 'P-1004', 'P-1005'];
DATA.accounts = [
  { id: 'U-ADM-01', name: '管理员', role: '管理员', scope: '全量', state: '启用' },
  { id: 'U-ADM-02', name: '运营小周', role: '运营', scope: '商品/订单/赠送', state: '启用' },
  { id: 'U-ADM-03', name: '客服小陈', role: '客服', scope: '订单查询', state: '启用' },
  { id: 'U-ADM-04', name: '财务小林', role: '财务', scope: '退款/对账', state: '启用' }
];
DATA.roles = [
  { id: 'ROLE-ADMIN', name: '管理员', desc: '全部权限；可配置账号与权限', singleRefund: true },
  { id: 'ROLE-OPS', name: '运营', desc: '选品、商品、赠送、补发；敏感动作需授权', singleRefund: false },
  { id: 'ROLE-CS', name: '客服', desc: '订单查询、售后沟通；查码/导出需授权', singleRefund: false },
  { id: 'ROLE-FIN', name: '财务', desc: '退款审核/执行、支付核查、导出；需授权', singleRefund: false }
];

function displayState(order) { return order.display; }

function productActionState(p) {
  if (!p || p.sale !== 'ON') return 'DISABLED';
  if ((SESSION.conditions.order === 'unpaid' || SESSION.conditions.order === 'confirming') && SESSION.orderScenarioProductId === p.id) return 'PENDING';
  if (p.delivery === 'CODE' && SESSION.conditions.stock === 'zero') return 'SOLD_OUT';
  if (SESSION.conditions.stock !== 'unknown' && p.stockState === 'FRESH' && p.stock === 0) return 'SOLD_OUT';
  if (p.delivery === 'CODE' && (SESSION.conditions.balance === 'low' || SESSION.conditions.balance === 'unknown')) return 'BALANCE_LOW';
  return 'BUY';
}

function currentSku(p) {
  if (!p) return { id: 'std', name: '标准版', price: 0 };
  const skus = p.skus || [{ id: 'std', name: '标准版', price: p.price }];
  return skus.find(s => s.id === SESSION.buy.skuId) || skus[0];
}
function currentPrice(p) { return currentSku(p).price; }
function currentOrder() { return DATA.orderById(SESSION.currentOrderId) || DATA.orderById('SO202610270005'); }
function orderActions(o) {
  if (!o) return [];
  if (o.pay === 'UNPAID') return ['继续支付', '查看']; 
  if (o.pay === 'CONFIRMING') return ['重新查询', '查看'];
  return ['查看'];
}


/* ================= 客户端渲染 ================= */
const R = {};

function navigate(pageId, state) {
  const p = PAGE_BY_ID[pageId];
  if (!p) return;
  RV.from = RV.pageId;
  RV.pageId = pageId;
  RV.state = state || p.states[0][0];
  RV.selectedComponent = null;
  renderAll();
  const body = $('.app-body') || $('.web-container') || $('.adm-body');
  if (body) body.scrollTop = 0;
  $('.rv-canvas')?.scrollTo({ top: 0 });
}
function go(pageId, state) { navigate(pageId, state); }
function back() {
  const target = RV.from;
  const fallback = RV.end === 'ADM' ? 'ADM-ORDER-01' : RV.end === 'WEB' ? 'WEB-HOME-01' : 'APP-HOME-01';
  navigate(target && PAGE_BY_ID[target] && PAGE_BY_ID[target].end === RV.end ? target : fallback);
}

function appTop({ id, title, sub = '', backBtn = true, right = '' }) {
  return C(id, `<button class="back-btn" data-act="back" aria-label="返回" ${backBtn ? '' : 'style="visibility:hidden"'}>‹</button>
    <div class="t">${esc(title)}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</div>${right}`, 'mobile-default', 'div', 'app-top');
}
function serviceBtn(id) {
  return C(id, `<button class="icon-btn" data-act="open-service" aria-label="联系客服">${ico('service')}</button>`, 'mobile-icon');
}
function appTabbar(active, id) {
  return C(id, `<button data-act="tab" data-arg="APP-HOME-01" ${active === 'home' ? 'aria-current="page"' : ''}>${ico('home')}<span>首页</span></button>
    <button data-act="tab" data-arg="APP-ORDER-01" ${active === 'orders' ? 'aria-current="page"' : ''}>${ico('orders')}<span>我的订单</span></button>
    <button data-act="tab" data-arg="APP-PROFILE-01" ${active === 'profile' ? 'aria-current="page"' : ''}>${ico('user')}<span>我的</span></button>`, 'mobile-three', 'nav', 'app-tabbar');
}
function webTop(active) {
  const logged = SESSION.loggedIn;
  return C(RV.pageId + '-C01', `<div class="web-brand">${ico('code')} Steam商城</div>
    <nav class="web-nav" aria-label="主导航">
      <button data-act="tab" data-arg="WEB-HOME-01" ${active === 'home' ? 'aria-current="page"' : ''}>商城</button>
      <button data-act="tab" data-arg="WEB-SEARCH-01" ${active === 'search' ? 'aria-current="page"' : ''}>搜索商品</button>
      <button data-act="tab" data-arg="WEB-ORDER-01" ${active === 'orders' ? 'aria-current="page"' : ''}>我的订单</button>
    </nav>
    <div class="web-user"><span>${logged ? esc(SESSION.user.name) : '未登录'}</span>${logged ? '' : `<button class="rv-btn" data-act="sim-login">登录</button>`}<button class="icon-btn" data-act="open-service" aria-label="联系客服">${ico('service')}</button></div>`, 'desktop-default', 'div', 'web-top');
}

function productCard(p, cardId, listId, variant = 'mobile-card') {
  const price = p.skus ? p.skus[0].price : p.price;
  const tag = p.delivery === 'CODE' ? '口令码' : '好友赠送';
  return C(cardId, `<button class="product-card" data-act="open-product" data-arg="${p.id}" aria-label="${esc(p.name)}">
    <div class="media">${esc(p.cover)} 占位</div>
    <div class="name">${esc(p.name)}</div>
    <div class="meta"><span class="price">${money(price)}</span><span class="tag">${tag}</span></div>
  </button>`, variant);
}
function productGrid(list, listId, cardId, listName, desktop = false) {
  return `<div class="product-grid ${desktop ? 'desktop' : ''}" data-list="${listName}">${list.map(p => productCard(p, cardId, listName, desktop ? 'desktop-card' : 'mobile-card')).join('')}</div>`;
}
function statePanel(code, msg = '', action = '') {
  const map = {
    LOADING: ['正在加载…', '请稍候，页面结构保持不变。'],
    EMPTY: ['暂无内容', msg || '当前没有可展示的数据。'],
    ERROR: ['加载失败', msg || '请检查网络后重试。'],
    TIMEOUT: ['结果确认中', msg || '暂未取得可信结果，请重新查询。'],
    OFFLINE: ['当前处于离线状态', msg || '恢复网络后可重试；已加载内容仍可阅读。'],
    END: ['已经到底了', '没有更多内容。'],
    SESSION_EXPIRED: ['登录已失效', '请重新登录后继续。'],
    NO_PERM: ['无权访问', msg || '当前角色无权查看该内容。']
  };
  const [t, d] = map[code] || ['暂无内容', msg || '请稍后重试。'];
  return `<div class="empty"><b>${t}</b><span>${esc(d)}</span>${action ? `<div class="mt12">${action}</div>` : (code === 'ERROR' || code === 'TIMEOUT' ? '<div class="mt12"><button class="btn sm" data-act="retry-page">重试</button></div>' : '')}</div>`;
}
function orderStatusTag(o) {
  const cls = o.refund === 'FAILED' ? 'err' : (o.pay === 'UNPAID' ? 'warn' : '');
  return `<span class="tag ${cls}">${esc(o.display)}</span>`;
}
function orderCard(o, cardId, variant = 'mobile-cards') {
  return `<div class="order-card" data-order-id="${o.id}">
    <div class="top"><span>${o.id}</span><span>${esc(o.time)}</span></div>
    <div class="mid"><div class="thumb-sm">${esc(o.title.slice(0, 1))}</div><div class="info"><b>${esc(o.title)}</b><span class="small muted">${esc(o.spec)} · 数量 1 · ${o.deliveryType === 'CODE' ? '口令码' : '好友赠送'}</span><div class="mt8">${orderStatusTag(o)}</div></div><div class="price">${money(o.amount)}</div></div>
    <div class="bottom"><span class="small muted">${o.platform} 平台</span><span class="row">${orderActions(o).map(a => `<button class="btn sm ${a === '继续支付' ? 'primary' : ''}" data-act="order-action" data-arg="${o.id}|${a}">${a}</button>`).join('')}</span></div>
  </div>`;
}
function noticeKindForPage() {
  if (RV.pageId === 'APP-AUTH-01' || RV.pageId === 'WEB-AUTH-01') {
    if (RV.state === 'SHOWN_KNOWN') return 'known';
    if (RV.state === 'SHOWN_UNVERIFIED') return 'unverified';
    if (RV.state === 'HIDDEN_UNKNOWN') return '';
    return '';
  }
  if (!SESSION.loggedIn || SESSION.realName === 'unknown' || SESSION.noticeShown) return '';
  return SESSION.realName === 'verified' ? 'known' : 'unverified';
}
function authNoticeOverlay(kind, instanceId = 'APP-AUTH-01-C01') {
  const known = kind === 'known';
  const title = known ? '实名认证已完成' : '购买前需完成实名认证';
  const body = known ? '您已通过实名认证，可正常购买商品。已实名未成年用户仍会在购买时被拦截。' : '购买前需完成实名认证与成年核验；您也可以先浏览商品，购买时再完成校验。';
  const btn = known ? `<button class="btn primary block" data-act="close-notice">知道了</button>` : `<button class="btn primary block" data-act="go-realname">前往认证</button>`;
  return C(instanceId, `<div class="overlay center" data-mask-act="close-notice"><div class="sheet" data-stop="1" role="dialog" aria-modal="true" aria-labelledby="authTitle">
    <div class="sheet-head"><h3 id="authTitle">实名提醒</h3><button class="icon-btn" data-act="close-notice" aria-label="关闭">${ico('close')}</button></div>
    <div class="sheet-body"><div class="empty" style="border:0;background:transparent;padding:8px 0"><b>${title}</b><span>${body}</span></div>${btn}<div class="tiny muted mt8">关闭提醒不改变实名、成年、协议或手机号状态，不代表通过购买校验。</div></div>
  </div></div>`, 'mobile-center');
}

/* ---------- 移动端页面 ---------- */
function renderAppHome() {
  const p = PAGE_BY_ID['APP-HOME-01'];
  const state = RV.state;
  const contentState = ['LOADING', 'EMPTY', 'ERROR', 'OFFLINE'].includes(state);
  const body = contentState
    ? C('APP-HOME-01-C09', statePanel(state), 'inline')
    : `${C('APP-HOME-01-C01', `<div class="banner">首页广告位（运营配置）</div><div class="quick">
        <button data-act="tab" data-arg="APP-ORDER-01">${ico('orders')}<span>我的订单</span></button>
        <button data-act="open-service">${ico('service')}<span>联系客服</span></button>
        <button data-act="open-search">${ico('search')}<span>搜索商品</span></button>
        <button data-act="scroll-products">${ico('code')}<span>全部商品</span></button>
      </div><div class="row between"><h3 style="font-size:15px;font-weight:500;margin:0">推荐商品</h3><span class="small muted">已发布 · 共 ${DATA.products.filter(x => x.sale !== 'DRAFT' && x.sale !== 'UNAVAILABLE').length} 件</span></div>`, 'mobile-home')}
      ${C('APP-HOME-01-C06', productGrid(DATA.products.filter(x => ['P-1001', 'P-1002', 'P-1003', 'P-1004', 'P-1005'].includes(x.id)), 'APP-HOME-01-C06', 'APP-HOME-01-C15', 'home'), 'mobile-grid')}`;
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">
    ${appTop({ id: 'APP-HOME-01-C08', title: 'Steam商城', sub: '官方服务 · 自动发码 · 人工赠送', backBtn: false, right: serviceBtn('APP-HOME-01-C07') })}
    <div class="app-body" id="appBody">${body}</div>
    ${appTabbar('home', 'APP-HOME-01-C14')}
    ${(RV.pageId === 'APP-HOME-01' && noticeKindForPage()) ? authNoticeOverlay(noticeKindForPage(), 'APP-HOME-01-C16') : ''}
  </div></div></div>`;
}

function appBackdrop(title, sub, bodyText) {
  return `<div class="app-top"><div class="t">${esc(title)}<span class="sub">${esc(sub)}</span></div></div><div class="app-body"><div class="empty"><b>页面背景</b><span>${esc(bodyText)}</span></div></div>`;
}
function renderAppAuth() {
  const kind = noticeKindForPage();
  const html = `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">${appBackdrop('Steam商城', '首次进入', '首页浏览上下文；弹层页只评审提醒本身，不复制背景业务操作。')}${kind ? authNoticeOverlay(kind, 'APP-AUTH-01-C01') : ''}</div></div></div>`;
  return html;
}

function searchTop(pageId) {
  return appTop({ id: pageId + '-C08', title: '搜索商品', sub: '', right: serviceBtn('APP-HOME-01-C07') })
    .replace('</div>', `</div>`);
}
function searchBar(pageId, value) {
  return `<div class="row">${C(pageId + '-C01', `<input class="input" id="searchInput" data-field="searchDraft" value="${esc(value)}" placeholder="输入商品名称搜索" aria-label="搜索商品" style="width:100%">`, 'mobile-search', 'div', 'search-input')}${C(pageId + '-C02', `<button class="btn primary" data-act="search-submit" style="min-height:44px;white-space:nowrap">搜索</button>`, 'mobile-inline', 'div', 'search-action')}</div>
    <div class="tiny muted mt8">按商品中英文名称模糊匹配；首期不做联想、拼音与历史。</div>`;
}
function webSearchBar(pageId, value) {
  return `<div class="row">${C(pageId + '-C02', `<input class="input" id="searchInput" data-field="searchDraft" value="${esc(value)}" placeholder="输入商品名称搜索" aria-label="搜索商品" style="width:100%">`, 'desktop-search', 'div', 'search-input')}${C(pageId + '-C03', `<button class="btn primary" data-act="search-submit" style="min-height:40px;white-space:nowrap">搜索</button>`, 'desktop-inline', 'div', 'search-action')}</div>`;
}

function renderAppSearch() {
  const state = RV.state;
  let body = searchBar('APP-SEARCH-01', SESSION.search.draft);
  if (state === 'EMPTY') body += C('APP-SEARCH-01-C09', statePanel('EMPTY', '搜索发现与热门商品暂未配置。'), 'inline');
  else if (state === 'ERROR') body += C('APP-SEARCH-01-C09', statePanel('ERROR'), 'inline');
  else {
    body += C('APP-SEARCH-01-C03', `<div class="card"><h3>搜索发现</h3><div class="row">${DATA.keywords.map(k => `<button class="btn sm" data-act="search-keyword" data-arg="${esc(k)}">${esc(k)}</button>`).join('')}</div></div>
      <div class="card"><h3>热门商品</h3><ul class="list-reset">${DATA.hotProducts.map((id, i) => { const p = DATA.productById(id); return `<li><button class="hit" data-act="open-product" data-arg="${p.id}"><span class="tag">${i + 1}</span><span>${esc(p.name)}</span><span class="muted small" style="margin-left:auto">${money(p.price)}</span></button></li>`; }).join('')}</ul></div>`, 'mobile-default');
  }
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">
    ${searchTop('APP-SEARCH-01')}
    <div class="app-body">${body}</div>
  </div></div></div>`;
}

function searchResults(pageId, desktop = false) {
  const q = SESSION.search.query || SESSION.search.draft;
  let list = DATA.products.filter(p => ['P-1001', 'P-1002', 'P-1003', 'P-1004', 'P-1005'].includes(p.id));
  if (q) list = list.filter(p => (p.name + p.en).toLowerCase().includes(q.toLowerCase()));
  if (SESSION.search.sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
  if (SESSION.search.sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
  if (SESSION.search.sort === 'latest') list = [...list].reverse();
  const state = RV.state;
  let body = searchBar(pageId, q) + C(pageId + '-C05', `<div class="pill-tabs" role="tablist">${[['recommend', '推荐'], ['price_asc', '价格升序'], ['price_desc', '价格降序'], ['latest', '最新上架']].map(([k, l]) => `<button role="tab" aria-selected="${SESSION.search.sort === k}" data-act="set-sort" data-arg="${k}">${l}</button>`).join('')}</div>`, 'mobile-scroll');
  if (state === 'LOADING') body += C(pageId + '-C09', statePanel('LOADING'), 'inline');
  else if (state === 'ERROR') body += C(pageId + '-C09', statePanel('ERROR'), 'inline');
  else if (state === 'EMPTY') body += C(pageId + '-C09', statePanel('EMPTY', `没有找到与“${q}”相关的商品，试试其他关键词。`), 'inline');
  else if (state === 'END') body += C(pageId + '-C09', statePanel('END'), 'inline');
  else body += C(pageId + '-C06', `<div class="row between mb8"><span class="small muted">“${esc(q)}” · ${list.length} 个结果</span><span class="tiny muted">当前排序：${({ recommend: '推荐', price_asc: '价格升序', price_desc: '价格降序', latest: '最新上架' })[SESSION.search.sort]}</span></div>${productGrid(list, pageId + '-C06', pageId + '-C15', 'search_results', desktop)}`, desktop ? 'desktop-grid' : 'mobile-grid');
  return body;
}
function renderAppSearchResults() {
  const body = searchResults('APP-SEARCH-02');
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">${searchTop('APP-SEARCH-02')}<div class="app-body">${body}</div></div></div></div>`;
}

function productStatusText(p) {
  const a = productActionState(p);
  if (a === 'PENDING') return { label: '订单处理中', button: '订单处理中', cls: 'warn', hint: '当前账号该商品存在有效未支付/支付确认中订单，点击查询恢复。' };
  if (a === 'SOLD_OUT') return { label: '已售罄', button: '已售罄', cls: 'err', hint: '库存缓存新鲜且为 0，暂不可购买。' };
  if (a === 'DISABLED') return { label: '暂不可购买', button: '暂不可购买', cls: 'err', hint: p.sale === 'DRAFT' ? '商品尚未发布。' : '商品已下架或为组合商品，停止新购。' };
  if (a === 'BALANCE_LOW') return { label: '补货中', button: '补货中', cls: 'warn', hint: '供应商可用余额不足或查询失败，暂不可购买口令码商品。' };
  return { label: '可售', button: '立即购买', cls: '', hint: '' };
}
function renderDetailBody(pageId, desktop = false) {
  const p = DATA.productById(SESSION.buy.productId || 'P-1001');
  const st = productStatusText(p);
  const action = productActionState(p);
  const expanded = RV.state === 'EXPANDED';
  const sku = currentSku(p);
  const price = currentPrice(p);
  const media = `<div class="hero">${esc(p.cover)} 主图占位</div><div class="thumb-row">${Array.from({ length: p.media }, (_, i) => `<button class="thumb" data-act="media" data-arg="${i}" aria-pressed="${i === 0}">图 ${i + 1}</button>`).join('')}</div>`;
  const info = `<div class="row between"><span class="tag">${p.delivery === 'CODE' ? '口令码自动发码' : '好友赠送人工交付'}</span><span class="tag ${st.cls}">${st.label}</span></div>
    <h2 style="font-size:18px;margin:6px 0 2px">${esc(p.name)}</h2><div class="small muted">${esc(p.en)}</div>
    <div class="price lg mt8">${money(price)}</div>
    <div class="small muted">${p.skus && p.skus.length > 1 ? `已选：${esc(sku.name)} · ` : ''}数量固定 1 · 价格按订单快照保价</div>
    ${p.delivery === 'GIFT' ? `<div class="notice">每天 8:00～18:00（含周末和节假日）人工交付；从付款成功起按自然日累计 2 小时。</div>` : ''}
    ${p.stockState === 'STALE' ? `<div class="notice warn">库存信息暂未确认；付款后以供应商结果为准，失败自动退款/补货。</div>` : ''}
    ${action === 'BALANCE_LOW' ? `<div class="notice err">供应商可用余额不足或查询失败；口令码商品暂不可购买。</div>` : ''}
    ${action === 'PENDING' ? `<div class="notice">您有一笔订单正在处理中，点击底部按钮查询恢复。</div>` : ''}
    ${p.sale === 'ON' && p.delivery === 'CODE' && SESSION.conditions.order === 'paid' ? `<div class="notice">您有一笔订单正在交付，点击查看；已支付不阻止复购。</div>` : ''}
    <div class="info-block"><h4>版本与规格</h4><div class="seg">${(p.skus || [{ id: 'std', name: '标准版', price: p.price }]).map(s => `<button data-act="select-sku" data-arg="${s.id}" aria-pressed="${s.id === sku.id}">${esc(s.name)} · ${money(s.price)}</button>`).join('')}</div></div>
    <div class="info-block"><h4>适用限制</h4><p>${esc(p.limits)}</p></div>
    <div class="info-block"><h4>商品介绍</h4><p>${esc(expanded ? p.desc : p.desc.slice(0, 54) + '…')}</p><button class="expand-btn" data-act="toggle-expand">${expanded ? '收起' : '展开全文'}</button></div>
    <div class="info-block"><h4>购买须知</h4><p>${esc(p.notice)}</p></div>`;
  const buyBar = C(pageId + '-C04', `<div class="row"><button class="icon-btn" data-act="open-service" aria-label="客服">${ico('service')}</button><button class="btn primary block" data-act="${action === 'PENDING' ? 'resume-order' : action === 'BUY' ? 'open-buy' : 'disabled-reason'}" ${['BUY', 'PENDING'].includes(action) ? '' : 'disabled'}>${st.button}${action === 'BUY' ? ' ' + money(price) : ''}</button></div>`, 'mobile-sticky');
  return { p, st, action, media, info, buyBar };
}
function renderAppDetail() {
  const { p, st, action, media, info, buyBar } = renderDetailBody('APP-DETAIL-01', false);
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">
    ${appTop({ id: 'APP-DETAIL-01-C08', title: '商品详情', sub: '', backBtn: true, right: serviceBtn('APP-DETAIL-01-C03') })}
    <div class="app-body">
      ${C('APP-DETAIL-01-C01', media, 'mobile-4x3')}
      ${C('APP-DETAIL-01-C02', info, 'mobile-stack')}
      ${st.hint ? `<div class="tiny muted">${esc(st.hint)}</div>` : ''}
    </div>
    ${buyBar}
  </div></div></div>`;
}

function buyPanel(pageId, desktop = false) {
  const p = DATA.productById(SESSION.buy.productId || 'P-1001');
  const sku = currentSku(p);
  const price = currentPrice(p);
  const delivery = SESSION.buy.deliveryType;
  const state = RV.state;
  const msgMap = {
    LOGIN_REQUIRED: '请先登录后购买。登录成功后将继续原购买流程。',
    REALNAME_REQUIRED: '购买前需完成实名认证与成年核验。',
    MINOR_BLOCKED: '暂不可购买，您可以继续浏览；已实名未成年用户会被拦截。',
    PHONE_REQUIRED: '请先绑定手机号后再购买。',
    BALANCE_LOW: '补货中，暂不可购买：供应商可用余额不足或查询失败。',
    STOCK_UNKNOWN: '库存信息暂未确认；付款后以供应商结果为准，失败自动退款/补货。',
    VALIDATION_ERROR: '还有购买条件未满足，请按提示完成。'
  };
  const msg = msgMap[state] ? `<div class="notice ${['MINOR_BLOCKED', 'BALANCE_LOW'].includes(state) ? 'err' : 'warn'}">${msgMap[state]}</div>` : '';
  const body = `<div class="row between"><div><div class="small muted">数量固定 1</div><div class="price">${money(price)}</div></div><span class="tag">${delivery === 'CODE' ? '口令码' : '好友赠送'}</span></div>
    ${msg}
    <div class="field"><label>版本规格</label><div class="seg">${(p.skus || [{ id: 'std', name: '标准版', price: p.price }]).map(s => `<button data-act="select-sku" data-arg="${s.id}" aria-pressed="${s.id === sku.id}">${esc(s.name)} · ${money(s.price)}</button>`).join('')}</div></div>
    <div class="field"><label>交付方式</label><div class="seg">${[['CODE', '口令码自动发码'], ['GIFT', '好友赠送人工交付']].filter(([k]) => k === p.delivery || p.delivery === 'GIFT').map(([k, l]) => `<button data-act="select-delivery" data-arg="${k}" aria-pressed="${delivery === k}">${l}</button>`).join('')}</div><div class="hint">${p.delivery === 'GIFT' ? '好友赠送每天 8:00～18:00 人工交付。' : '仅支持当前商品配置的交付方式。'}</div></div>
    ${delivery === 'GIFT' ? `<div class="field"><label>Steam 好友链接（必填）</label><input class="input ${SESSION.friendLinkTouched && !SESSION.buy.friendLink ? 'invalid' : ''}" data-field="friendLink" value="${esc(SESSION.buy.friendLink)}" placeholder="https://s.team/p/..."><div class="hint">付款后不可修改；格式以供应商确认为准。</div>${SESSION.friendLinkTouched && !SESSION.buy.friendLink ? '<div class="err">请填写好友链接</div>' : ''}</div>` : ''}
    <div class="field"><label>支付方式</label><div class="seg">${[['WECHAT', '微信支付'], ['ALIPAY', '支付宝']].map(([k, l]) => `<button data-act="select-pay" data-arg="${k}" aria-pressed="${SESSION.buy.payMethod === k}">${l}</button>`).join('')}</div><div class="hint">仅支持微信/支付宝，使用商城统一经营主体收款。</div></div>
    <label class="check"><input type="checkbox" data-field="agreement" ${SESSION.buy.agreement ? 'checked' : ''}><span>我已阅读并同意 <button class="expand-btn" data-act="open-agreement" style="min-height:auto;display:inline">《购买协议》</button>（未默认勾选）</span></label>
    <div class="tiny muted mt8">点击“购买并支付”将依次校验登录、实名成年、协议、手机号、商品、库存、余额与订单并存。</div>`;
  const foot = `<button class="btn primary block" data-act="buy-submit" ${['MINOR_BLOCKED', 'BALANCE_LOW'].includes(state) ? 'disabled' : ''}>购买并支付 ${money(price)}</button>`;
  const panel = C(pageId + '-C01', `<div class="overlay ${desktop ? 'center' : ''}" data-mask-act="close-buy"><div class="sheet" data-stop="1" role="dialog" aria-modal="true" aria-labelledby="buyTitle">
    <div class="sheet-head"><h3 id="buyTitle">核对购买内容</h3><button class="icon-btn" data-act="close-buy" aria-label="关闭">${ico('close')}</button></div>
    <div class="sheet-body">${C(pageId + '-C02', `<div class="order-card" style="border:0;padding:0"><div class="mid"><div class="thumb-sm">${esc(p.cover)}</div><div class="info"><b>${esc(p.name)}</b><span class="small muted">${esc(sku.name)} · ${p.delivery === 'CODE' ? '口令码' : '好友赠送'}</span></div><div class="price">${money(price)}</div></div></div>`, 'compact')}${body}</div>
    <div class="sheet-foot">${foot}</div>
  </div></div>`, desktop ? 'desktop-center' : 'mobile-bottom');
  const notice = state === 'NOTICE' ? C(pageId + '-C03', `<div class="overlay center" data-mask-act="close-notice-buy"><div class="sheet modal" data-stop="1" role="dialog" aria-modal="true"><div class="sheet-head"><h3>购买须知</h3><button class="icon-btn" data-act="close-notice-buy" aria-label="关闭">${ico('close')}</button></div><div class="sheet-body"><p>为保障您的权益，请阅读并同意以下协议：</p><p><button class="expand-btn" data-act="open-agreement">《购买协议》</button></p><div class="row"><button class="btn" data-act="close-notice-buy">取消</button><button class="btn primary" data-act="agree-continue">同意并继续</button></div></div></div></div>`, 'mobile-center') : '';
  return panel + notice;
}
function renderAppBuy() {
  const html = `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">${appBackdrop('商品详情', '购买面板', '详情页购买上下文；背景仅作占位，真实流程从详情页打开面板。')}${buyPanel('APP-BUY-01', false)}</div></div></div>`;
  return html;
}

function agreementBody(pageId) {
  const substantive = RV.state === 'SUBSTANTIVE' || SESSION.substantiveChange;
  return `${substantive ? `<div class="notice err">协议有实质性变更，旧未支付订单继续支付前需重新确认；确认后记录新版本与确认时间。</div>` : ''}
    <div class="card"><h3>Steam商城购买协议</h3><div class="small muted">版本 ${esc(SESSION.agreementVersion)} · 生效时间 2026-10-22 · 主体：商城经营公司</div>
    <div class="divider"></div>
    <p>1. 本商城销售 Steam 口令码与好友赠送服务；口令码由供应商提供，好友赠送由运营人工完成。</p>
    <p>2. 虚拟商品一经履约原则上不退款；系统可判定的无争议异常按闭集自动原路退款；用户特殊退款需经企业微信客服协商与运营审核。</p>
    <p>3. 口令码交付以供应商返回并保存为准；好友赠送每天 8:00～18:00（含周末和节假日）交付，按自然日累计 2 小时。</p>
    <p>4. 支付确认中不代表失败；请勿重复支付。晚到款按已支付事实优先处理，无法履约或重复支付时原路退款。</p>
    <p>5. 您同意本协议的行为将与订单号、版本和确认时间一并记录；协议更新按普通更新/实质性变更分别处理。</p>
    <p class="small muted">以上为原型模拟文本，正式文本由业务/法务提供并评审（TBD-12）。</p></div>
    ${substantive ? `<button class="btn primary block" data-act="confirm-agreement">我已阅读并同意最新版本</button>` : ''}`;
}
function renderAppAgreement() {
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">
    ${appTop({ id: 'APP-AGREEMENT-01-C01', title: '购买协议', backBtn: true })}
    <div class="app-body">${C('APP-AGREEMENT-01-C02', agreementBody('APP-AGREEMENT-01'), 'long-text')}${RV.state === 'ERROR' ? C('APP-AGREEMENT-01-C03', statePanel('ERROR'), 'inline') : ''}</div>
  </div></div></div>`;
}

function realnameOverlay(pageId, desktop = false) {
  const state = RV.state;
  const msg = state === 'UNAVAILABLE' ? '平台实名服务暂不可用，请稍后重试；您仍可继续浏览。' : state === 'FAILED' ? '实名结果暂无法确认，请重试或稍后再试。' : state === 'SUCCESS' ? '实名认证已完成，返回后继续购买。' : '购买前需完成实名认证与成年核验。商城不自建独立实名体系，将调起所属平台能力。';
  return C(pageId + '-C01', `<div class="overlay center" data-mask-act="close-realname"><div class="sheet modal" data-stop="1" role="dialog" aria-modal="true">
    <div class="sheet-head"><h3>实名认证</h3><button class="icon-btn" data-act="close-realname" aria-label="关闭">${ico('close')}</button></div>
    <div class="sheet-body"><p>${msg}</p><div class="notice">平台返回后商城会重新获取可信实名与成年结果；不以返回参数或前端标记直接放行。</div>
    <div class="row"><button class="btn" data-act="close-realname">暂不认证</button><button class="btn primary" data-act="realname-${state === 'LAUNCHING' ? 'launching' : 'go'}">去认证</button></div></div>
  </div></div>`, desktop ? 'desktop-center' : 'mobile-center');
}
function renderAppRealname() {
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">${appBackdrop('实名认证', '平台承接', '购买校验中的实名承接上下文；背景仅作占位。')}${realnameOverlay('APP-REALNAME-01', false)}</div></div></div>`;
}

function phoneForm(pageId) {
  return `<div class="card"><h3>绑定手机号</h3><p class="small muted">平台无绑定能力或返回未绑定时，可使用手机号＋短信验证码完成交易绑定。验证码仅用于交易验证，不发送营销或交付通知。</p>
    <div class="field"><label>手机号</label><input class="input" data-field="phone" inputmode="numeric" maxlength="11" placeholder="请输入 11 位手机号" value="${esc(SESSION.phoneDraft || '')}">${RV.state === 'VALIDATION_ERROR' ? '<div class="err">请输入正确的 11 位手机号</div>' : ''}</div>
    <div class="field"><label>短信验证码</label><div class="row"><input class="input" data-field="smsCode" inputmode="numeric" maxlength="6" placeholder="6 位验证码" style="flex:1"><button class="btn" data-act="send-code" style="min-width:120px">获取验证码</button></div><div class="hint">演示验证码：123456；实际有效期/频控待服务商确认。</div></div>
    <label class="check"><input type="checkbox" data-field="privacy" ${SESSION.privacyAccepted ? 'checked' : ''}><span>我已阅读并同意《隐私政策》，同意将手机号用于购买条件核验与交易联系。</span></label>
    <div class="mt12"><button class="btn primary block" data-act="bind-phone">绑定并返回</button></div>
    <div class="tiny muted mt8">拒绝绑定可继续浏览，但不能完成购买。</div></div>`;
}
function renderAppPhone() {
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">
    ${appTop({ id: 'APP-PHONE-01-C01', title: '手机号绑定', sub: '', backBtn: true })}
    <div class="app-body">${C('APP-PHONE-01-C02', phoneForm('APP-PHONE-01'), 'mobile-form')}${RV.state === 'SUCCESS' ? `<div class="notice">手机号绑定成功，返回购买现场。</div>` : ''}${RV.state === 'ERROR' ? C('APP-PHONE-01-C03', statePanel('ERROR', '绑定失败或结果未知，不唤起支付。'), 'inline') : ''}</div>
  </div></div></div>`;
}

function checkoutBody(pageId, desktop = false) {
  const o = currentOrder();
  const expired = RV.state === 'EXPIRED';
  const reconfirm = RV.state === 'RECONFIRM';
  return `${C(pageId + '-C02', `<div class="card"><div class="row between"><h3 style="margin:0">确认订单</h3><span class="tag">${o.id}</span></div>
    <div class="order-card" style="border:0;padding:0;margin:8px 0"><div class="mid"><div class="thumb-sm">${esc(o.title.slice(0, 1))}</div><div class="info"><b>${esc(o.title)}</b><span class="small muted">${esc(o.spec)} · 数量 1 · ${o.deliveryType === 'CODE' ? '口令码' : '好友赠送'}</span><span class="small muted">${o.deliveryType === 'GIFT' ? '好友链接：' + esc(o.friendLink || '未填写') : '发货方式：口令码'}</span></div><div class="price">${money(o.amount)}</div></div></div>
    <div class="divider"></div><dl class="kv"><dt>订单号</dt><dd>${o.id}</dd><dt>下单时间</dt><dd>${esc(o.time)}</dd><dt>支付方式</dt><dd>${SESSION.buy.payMethod === 'WECHAT' ? '微信支付' : '支付宝'}</dd><dt>协议版本</dt><dd>${esc(SESSION.agreementVersion)}${SESSION.agreementAccepted ? '（已确认）' : '（待确认）'}</dd><dt>到期时间</dt><dd>${esc(o.expiresAt || '—')}（仅可信时间展示）</dd></dl>
    ${expired ? '<div class="notice err">订单已关闭：到期查询明确未支付。可重新购买。</div>' : ''}
    ${reconfirm ? '<div class="notice err">协议有实质性变更，继续支付前需重新确认。</div>' : ''}
  </div>`, 'mobile-checkout')}
  ${C(pageId + '-C03', `<div class="notice">${expired ? '订单已关闭，无法继续支付。' : reconfirm ? '请先确认最新购买协议。' : '继续支付前将重新校验商品可售性、资格与协议版本。'}</div>
    <button class="btn primary block" data-act="${expired ? 'rebuy' : 'checkout-pay'}" ${reconfirm ? 'disabled' : ''}>${expired ? '重新购买' : '继续支付 ' + money(o.amount)}</button>
    ${reconfirm ? '<button class="btn block mt8" data-act="open-agreement-substantive">去确认协议</button>' : ''}`, 'mobile-sticky')}`;
}
function renderAppCheckout() {
  const body = checkoutBody('APP-CHECKOUT-01');
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">
    ${appTop({ id: 'APP-CHECKOUT-01-C01', title: '确认订单', backBtn: true })}
    <div class="app-body">${body}${RV.state === 'ERROR' ? C('APP-CHECKOUT-01-C04', statePanel('ERROR'), 'inline') : ''}</div>
  </div></div></div>`;
}

function payretDialog(pageId) {
  const state = RV.state;
  const querying = state === 'QUERYING';
  const timeout = state === 'TIMEOUT';
  const title = timeout ? '支付结果确认中' : '您是否已经完成了支付？';
  const body = timeout ? '<p>暂未取得可信支付结果。请勿重复支付；可重新查询或联系客服。</p>' : '<p>请选择您的实际支付情况。两个选项都会向服务端查询，最终以服务端结果为准。</p>';
  return C(pageId + '-C01', `<div class="overlay center" data-mask-act="close-payret"><div class="sheet modal" data-stop="1" role="dialog" aria-modal="true">
    <div class="sheet-head"><h3>${title}</h3><button class="icon-btn" data-act="close-payret" aria-label="关闭">${ico('close')}</button></div>
    <div class="sheet-body">${body}${querying ? '<div class="notice">正在查询支付结果…</div>' : ''}
      <div class="row"><button class="btn" data-act="pay-query" data-arg="unpaid" ${querying ? 'disabled' : ''}>未支付</button><button class="btn primary" data-act="pay-query" data-arg="paid" ${querying ? 'disabled' : ''}>已支付</button></div>
      ${timeout ? '<div class="mt12"><button class="btn block" data-act="pay-requery">重新查询</button><button class="btn block mt8" data-act="open-service">联系客服</button></div>' : ''}
    </div>
  </div></div>`, 'mobile-center');
}
function renderAppPayret() {
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">${appBackdrop('确认订单', '支付返回', '支付返回确认上下文；背景仅作占位，订单数据不重复渲染。')}${payretDialog('APP-PAYRET-01')}</div></div></div>`;
}

function resultState() {
  const o = currentOrder();
  const map = {
    CODE_ISSUING: ['发码中', '支付已确认，正在获取口令码，请稍候。'],
    CODE_DELIVERED: ['口令码已交付', '口令码已保存，可在本人订单中查看与复制。'],
    GIFT_PENDING: ['已付款，等待人工交付', '好友赠送每天 8:00～18:00 交付；付款后好友链接不可修改。'],
    DELIVERY_EXCEPTION: ['交付异常', '交付遇到问题，请联系客服并提供订单号。'],
    REFUNDING: ['退款中', '退款单处理中，请稍后查询；不会继续交付。'],
    REFUNDED: ['已退款', '退款成功以资金结果为准；商品可售时可重新购买。'],
    REFUND_FAILED: ['退款失败', '渠道退回失败，请联系客服处理；不显示继续支付。'],
    CONFIRMING: ['支付确认中', '尚未取得可信支付结果，请勿重复支付。'],
    ERROR: ['结果加载失败', '请重试或联系客服。']
  };
  return map[RV.state] || map.CODE_DELIVERED;
}
function resultBody(pageId, desktop = false) {
  const o = currentOrder();
  const [title, desc] = resultState();
  const delivered = RV.state === 'CODE_DELIVERED';
  const gift = o.deliveryType === 'GIFT' || ['GIFT_PENDING'].includes(RV.state);
  const refund = ['REFUNDING', 'REFUNDED', 'REFUND_FAILED'].includes(RV.state);
  return `${C(pageId + '-C02', `<div class="card"><div class="row between"><h3 style="margin:0">${title}</h3><span class="tag">${o.id}</span></div><p class="small muted">${desc}</p>
    <div class="divider"></div><dl class="kv"><dt>商品</dt><dd>${esc(o.title)} · ${esc(o.spec)}</dd><dt>实付金额</dt><dd>${money(o.amount)}</dd><dt>支付状态</dt><dd>${o.pay === 'PAID' ? '已支付' : o.pay === 'CONFIRMING' ? '确认中' : '待支付'}</dd><dt>交付状态</dt><dd>${o.delivery === 'DELIVERED' ? '已交付' : o.delivery === 'EXCEPTION' ? '交付异常' : o.delivery === 'GIFT_PROCESSING' ? '赠送处理中' : o.delivery === 'GIFT_PENDING' ? '赠送待处理' : o.delivery === 'ISSUING' ? '发码中' : '未启动'}</dd></dl>
    ${delivered ? `<div class="mt12"><div class="small muted">口令码</div><div class="code-box">${esc(o.code || 'VG-7K2M-9QPL-2026')}</div><div class="row mt8"><button class="btn" data-act="copy-code" data-arg="${o.id}">${ico('copy')} 复制口令码</button><button class="btn" data-act="open-order" data-arg="${o.id}">查看订单</button></div><div class="tiny muted mt8">口令码按权限展示；不在普通日志或通知正文输出完整内容。</div></div>` : ''}
    ${gift ? `<div class="notice">好友赠送：每天 8:00～18:00（含周末和节假日）人工交付；付款后好友链接已锁定。当前进度：${o.delivery === 'GIFT_PROCESSING' ? '处理中' : '待处理'}。</div>` : ''}
    ${refund ? `<div class="notice ${RV.state === 'REFUND_FAILED' ? 'err' : ''}">退款状态：${RV.state === 'REFUND_FAILED' ? '退款失败' : RV.state === 'REFUNDED' ? '已退款' : '退款中'}。${o.refundReason ? '原因：' + esc(o.refundReason) : ''}</div>` : ''}
    ${RV.state === 'CONFIRMING' ? '<div class="notice err">支付确认中，不因 30 分钟自动关闭；只有渠道证据可以改变支付状态。</div>' : ''}
    <div class="row mt12"><button class="btn primary" data-act="open-order" data-arg="${o.id}">查看订单</button><button class="btn" data-act="open-service">联系客服</button></div>
  </div>`, desktop ? 'desktop-result' : 'mobile-result')}
  ${C(pageId + '-C03', `<button class="btn block" data-act="open-service">${ico('service')} 企业微信客服</button>`, desktop ? 'desktop-inline' : 'mobile-inline')}`;
}
function renderAppResult() {
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">
    ${appTop({ id: 'APP-RESULT-01-C01', title: '支付与交付结果', backBtn: true })}
    <div class="app-body">${resultBody('APP-RESULT-01')}${RV.state === 'ERROR' ? C('APP-RESULT-01-C04', statePanel('ERROR'), 'inline') : ''}</div>
  </div></div></div>`;
}

function renderAppOrders() {
  const tabs = [['all', '全部'], ['unpaid', '待支付'], ['confirming', '确认中'], ['paid', '已支付'], ['delivered', '已完成'], ['refund', '退款'], ['exception', '交付异常']];
  const filtered = SESSION.orderTab === 'all' ? DATA.orders : DATA.orders.filter(o => o.tab === SESSION.orderTab);
  let body = C('APP-ORDER-01-C02', `<div class="pill-tabs" role="tablist">${tabs.map(([k, l]) => { const n = k === 'all' ? DATA.orders.length : DATA.orders.filter(o => o.tab === k).length; return `<button role="tab" aria-selected="${SESSION.orderTab === k}" data-act="order-tab" data-arg="${k}">${l}<span class="tiny muted"> ${n}</span></button>`; }).join('')}</div>`, 'mobile-scroll');
  if (RV.state === 'SESSION_EXPIRED') body += C('APP-ORDER-01-C06', `<div class="empty"><b>登录已失效</b><span>请重新登录后查看订单；旧账号数据已清除。</span><div class="mt12"><button class="btn primary" data-act="sim-login">重新登录</button></div></div>`, 'mobile');
  else if (RV.state === 'LOADING') body += C('APP-ORDER-01-C04', statePanel('LOADING'), 'inline');
  else if (RV.state === 'ERROR') body += C('APP-ORDER-01-C04', statePanel('ERROR', '订单加载失败，请重试。'), 'inline');
  else if (!filtered.length) body += C('APP-ORDER-01-C04', statePanel('EMPTY', '当前页签暂无订单。'), 'inline');
  else body += C('APP-ORDER-01-C03', filtered.map(o => orderCard(o, 'APP-ORDER-01-C03', 'mobile-cards')).join(''), 'mobile-cards');
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">
    ${appTop({ id: 'APP-ORDER-01-C01', title: '我的订单', sub: '仅展示当前账号订单', backBtn: false })}
    <div class="app-body">${body}</div>
    ${appTabbar('orders', 'APP-ORDER-01-C05')}
  </div></div></div>`;
}

function orderDetailBody(pageId, desktop = false) {
  const o = currentOrder();
  const showCode = o.delivery === 'DELIVERED' && o.deliveryType === 'CODE';
  return `${C(pageId + '-C02', `<div class="card"><div class="row between"><h3 style="margin:0">订单 ${o.id}</h3>${orderStatusTag(o)}</div>
    <div class="divider"></div><dl class="kv"><dt>商品</dt><dd>${esc(o.title)} · ${esc(o.spec)}</dd><dt>数量</dt><dd>1</dd><dt>金额</dt><dd>${money(o.amount)}</dd><dt>来源平台</dt><dd>${o.platform}</dd><dt>下单时间</dt><dd>${esc(o.time)}</dd><dt>支付状态</dt><dd>${o.pay === 'PAID' ? '已支付' : o.pay === 'CONFIRMING' ? '确认中' : o.pay === 'UNPAID' ? '待支付' : '已关闭'}</dd><dt>交付状态</dt><dd>${o.delivery === 'DELIVERED' ? '已交付' : o.delivery === 'EXCEPTION' ? '交付异常' : o.delivery === 'GIFT_PROCESSING' ? '赠送处理中' : o.delivery === 'GIFT_PENDING' ? '赠送待处理' : o.delivery === 'ISSUING' ? '发码中' : '未启动'}</dd><dt>交付方式</dt><dd>${o.deliveryType === 'CODE' ? '口令码' : '好友赠送'}</dd><dt>协议版本</dt><dd>${esc(SESSION.agreementVersion)}</dd>${o.deliveryType === 'GIFT' ? `<dt>好友链接</dt><dd>${esc(o.friendLink)}</dd>` : ''}${o.refund !== 'NONE' ? `<dt>退款状态</dt><dd>${o.refund === 'FAILED' ? '退款失败' : o.refund === 'REFUNDED' ? '已退款' : '退款中'}${o.refundReason ? '：' + esc(o.refundReason) : ''}</dd>` : ''}</dl>
    ${showCode ? `<div class="mt12"><div class="small muted">口令码</div><div class="code-box">${esc(o.code || 'VG-7K2M-9QPL-2026')}</div><div class="row mt8"><button class="btn" data-act="copy-code" data-arg="${o.id}">${ico('copy')} 复制</button><button class="btn" data-act="open-result" data-arg="${o.id}">查看交付结果</button></div></div>` : ''}
    ${o.pay === 'UNPAID' ? `<div class="mt12"><button class="btn primary block" data-act="resume-order">继续支付 ${money(o.amount)}</button></div>` : ''}
    ${o.pay === 'CONFIRMING' ? '<div class="notice err mt12">支付确认中，请勿重复支付；可重新查询或联系客服。</div><button class="btn block mt8" data-act="requery-order">重新查询</button>' : ''}
    ${o.delivery === 'EXCEPTION' ? '<div class="notice err mt12">交付异常：' + esc(o.error || '请联系客服') + '</div>' : ''}
  </div>`, desktop ? 'desktop-detail' : 'mobile-detail')}
  ${C(pageId + '-C03', `<div class="card"><h3>处理记录</h3><ul class="timeline"><li><div class="time">${esc(o.time)}</div>订单创建，保存商品/价格/协议快照</li><li><div class="time">${o.pay === 'PAID' ? '支付成功后' : '待支付'}</div>${o.pay === 'PAID' ? '服务端确认支付；交付任务已启动' : '等待用户继续支付'}</li>${o.delivery === 'DELIVERED' ? '<li><div class="time">交付时间</div>口令码已保存，可查看</li>' : ''}${o.refund !== 'NONE' ? `<li><div class="time">退款</div>${o.refund === 'FAILED' ? '退款失败：渠道退回失败' : o.refund === 'REFUNDED' ? '退款成功' : '退款处理中'}</li>` : ''}</ul></div>`, 'compact')}
  ${C(pageId + '-C04', `<button class="btn block" data-act="open-service">${ico('service')} 企业微信客服</button>`, 'mobile-inline')}`;
}
function renderAppOrderDetail() {
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">
    ${appTop({ id: 'APP-ORDER-02-C01', title: '订单详情', backBtn: true })}
    <div class="app-body">${orderDetailBody('APP-ORDER-02')}${RV.state === 'ERROR' ? C('APP-ORDER-02-C05', statePanel('ERROR'), 'inline') : ''}</div>
  </div></div></div>`;
}

function profileBody(pageId) {
  const guest = RV.state === 'GUEST' || !SESSION.loggedIn;
  const unknown = RV.state === 'UNKNOWN' || SESSION.realName === 'unknown';
  return `${C(pageId + '-C02', `<div class="card"><div class="row"><div style="width:56px;height:56px;border-radius:50%;background:#e3e3e3;display:flex;align-items:center;justify-content:center">${ico('user')}</div><div><b>${guest ? '未登录' : esc(SESSION.user.name)}</b><div class="small muted">${guest ? '登录后查看订单与资格状态' : '来源平台：' + SESSION.platform + ' · 用户 ID ' + esc(SESSION.user.id)}</div></div></div>
    ${guest ? '<div class="mt12"><button class="btn primary block" data-act="sim-login">登录</button></div>' : ''}
    <div class="divider"></div><dl class="kv"><dt>实名状态</dt><dd>${unknown ? '待确认' : SESSION.realName === 'verified' ? '已实名成年' : SESSION.realName === 'minor' ? '已实名未成年' : '未实名'}</dd><dt>手机号</dt><dd>${SESSION.phoneBound ? esc(SESSION.user.maskedPhone) : '未绑定'}</dd><dt>订单入口</dt><dd><button class="expand-btn" data-act="tab" data-arg="APP-ORDER-01">查看我的订单</button></dd><dt>客服</dt><dd><button class="expand-btn" data-act="open-service">企业微信客服</button></dd></dl></div>`, 'mobile-profile')}
  ${C(pageId + '-C03', `<button class="btn block" data-act="open-service">${ico('service')} 联系客服</button>`, 'mobile-inline')}`;
}
function renderAppProfile() {
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">
    ${appTop({ id: 'APP-PROFILE-01-C01', title: '我的', backBtn: false })}
    <div class="app-body">${profileBody('APP-PROFILE-01')}</div>
    ${appTabbar('profile', 'APP-PROFILE-01-C04')}
  </div></div></div>`;
}

function serviceBody(pageId) {
  const o = currentOrder();
  const withOrder = RV.state !== 'NO_ORDER';
  return `${C(pageId + '-C02', `<div class="card"><h3>企业微信客服</h3><p class="small muted">售后统一通过企业微信沟通；联系时请提供订单编号。首期不提供自助退款、换码或补发申请表单。</p>
    <div class="qr" style="width:140px;height:140px">客服二维码占位</div>
    <dl class="kv"><dt>客服账号</dt><dd>Steam商城客服</dd><dt>服务说明</dt><dd>订单异常、退款失败、口令码问题、好友赠送进度</dd><dt>服务时间</dt><dd>待运营确认（TBD-09）</dd></dl>
    ${withOrder ? `<div class="mt12"><div class="small muted">当前订单号</div><div class="code-box" id="serviceOrder">${o.id}</div><div class="row mt8"><button class="btn" data-act="copy-order" data-arg="${o.id}">${ico('copy')} 复制订单号</button><button class="btn primary" data-act="add-service">添加客服</button></div></div>` : '<div class="notice mt12">未携带订单；如需处理订单问题，请先从订单页进入客服。</div>'}
    ${RV.state === 'FALLBACK' ? '<div class="notice err mt12">无法直接唤起企业微信。请在微信中搜索企业微信“Steam商城客服”，或保存二维码后扫码添加。</div>' : ''}
  </div>`, 'mobile-card')}`;
}
function renderAppService() {
  return `<div class="phone-wrap"><div class="phone"><div class="earpiece"></div><div class="screen">
    ${appTop({ id: 'APP-SERVICE-01-C01', title: '企业微信客服', backBtn: true })}
    <div class="app-body">${serviceBody('APP-SERVICE-01')}</div>
  </div></div></div>`;
}

/* ---------- PC 页面 ---------- */
function webShell(pageId, body, active, overlay = '') {
  return `<div class="web">${webTop(active)}<div class="web-container">${body}</div>${overlay}</div>`;
}
function renderWebHome() {
  const state = RV.state;
  const content = ['LOADING', 'EMPTY', 'ERROR'].includes(state)
    ? C('WEB-HOME-01-C04', statePanel(state), 'inline')
    : `${C('WEB-HOME-01-C02', `<div class="web-hero">首页广告位（运营配置，三端共用）</div><div class="row between"><h2 style="font-size:20px;font-weight:500;margin:0 0 10px">推荐商品</h2><span class="small muted">只展示商城已发布商品</span></div>`, 'desktop-home')}
      ${C('WEB-HOME-01-C03', `<div class="product-grid desktop">${DATA.products.filter(x => ['P-1001', 'P-1002', 'P-1003', 'P-1004', 'P-1005'].includes(x.id)).map(p => productCard(p, 'WEB-HOME-01-C15', 'home', 'desktop-card')).join('')}</div>`, 'desktop-grid')}`;
  return webShell('WEB-HOME-01', content, 'home');
}
function webBackdrop(title, sub, text) {
  return `<div class="row mb12"><span class="small muted">${esc(sub)}</span></div><div class="empty"><b>${esc(title)}</b><span>${esc(text)}</span></div>`;
}
function renderWebAuth() {
  const kind = noticeKindForPage();
  const body = webBackdrop('首页浏览上下文', '首次提醒（弹层）', '弹层页只评审提醒本身，背景业务操作不复制。');
  return `<div class="web"><div class="web-container">${body}</div>${kind ? authNoticeOverlay(kind, 'WEB-AUTH-01-C01') : ''}</div>`;
}

function renderWebSearch() {
  let body = `${webSearchBar('WEB-SEARCH-01', SESSION.search.draft)}
    ${C('WEB-SEARCH-01-C04', `<div class="row" style="align-items:flex-start;gap:24px"><div class="card" style="flex:1"><h3>搜索发现</h3><div class="row">${DATA.keywords.map(k => `<button class="btn sm" data-act="search-keyword" data-arg="${esc(k)}">${esc(k)}</button>`).join('')}</div></div><div class="card" style="flex:1"><h3>热门商品</h3><ul class="list-reset">${DATA.hotProducts.map((id, i) => { const p = DATA.productById(id); return `<li><button class="hit" data-act="open-product" data-arg="${p.id}"><span class="tag">${i + 1}</span><span>${esc(p.name)}</span><span class="muted small" style="margin-left:auto">${money(p.price)}</span></button></li>`; }).join('')}</ul></div></div>`, 'desktop-two-col')}`;
  if (RV.state === 'ERROR') body += C('WEB-SEARCH-01-C05', statePanel('ERROR'), 'inline');
  return webShell('WEB-SEARCH-01', body, 'search');
}
function renderWebSearchResults() {
  const q = SESSION.search.query || SESSION.search.draft;
  let list = DATA.products.filter(p => ['P-1001', 'P-1002', 'P-1003', 'P-1004', 'P-1005'].includes(p.id));
  if (q) list = list.filter(p => (p.name + p.en).toLowerCase().includes(q.toLowerCase()));
  if (SESSION.search.sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
  if (SESSION.search.sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
  let body = `${webSearchBar('WEB-SEARCH-02', q)}
    ${C('WEB-SEARCH-02-C04', `<div class="row"><span class="small muted">“${esc(q)}” · ${list.length} 个结果</span><span class="row" style="margin-left:auto">${[['recommend', '推荐'], ['price_asc', '价格升序'], ['price_desc', '价格降序'], ['latest', '最新上架']].map(([k, l]) => `<button class="btn sm" data-act="set-sort" data-arg="${k}" aria-pressed="${SESSION.search.sort === k}" style="${SESSION.search.sort === k ? 'border:2px solid #333' : ''}">${l}</button>`).join('')}</span></div>`, 'desktop-row')}`;
  if (RV.state === 'EMPTY') body += C('WEB-SEARCH-02-C06', statePanel('EMPTY', '没有找到相关商品。'), 'inline');
  else if (RV.state === 'ERROR') body += C('WEB-SEARCH-02-C06', statePanel('ERROR'), 'inline');
  else body += C('WEB-SEARCH-02-C05', `<div class="product-grid desktop">${list.map(p => productCard(p, 'WEB-SEARCH-02-C15', 'search_results', 'desktop-card')).join('')}</div>`, 'desktop-grid');
  return webShell('WEB-SEARCH-02', body, 'search');
}
function renderWebDetail() {
  const { p, st, action, media, info, buyBar } = renderDetailBody('WEB-DETAIL-01', true);
  const buyCard = C('WEB-DETAIL-01-C04', `<div class="small muted">当前商品</div><h3 style="margin:4px 0">${esc(p.name)}</h3><div class="price lg mt8">${money(currentPrice(p))}</div><div class="small muted">数量固定 1 · 价格按订单快照保价</div><div class="mt12"><button class="btn primary block" data-act="${action === 'PENDING' ? 'resume-order' : action === 'BUY' ? 'open-buy' : 'disabled-reason'}" ${['BUY', 'PENDING'].includes(action) ? '' : 'disabled'}>${st.button}${action === 'BUY' ? ' ' + money(currentPrice(p)) : ''}</button></div>${action === 'PENDING' ? '<div class="notice mt8">存在未支付/确认中订单，点击查询恢复。</div>' : ''}${action === 'BUY' && SESSION.conditions.order === 'paid' ? '<div class="notice mt8">您有一笔订单正在交付，点击查看；已支付不阻止复购。</div>' : ''}`, 'desktop-sticky');
  const body = `<div class="row between mb12"><button class="btn sm" data-act="back">‹ 返回</button><span class="small muted">商品详情</span></div><div class="web-detail"><div>${C('WEB-DETAIL-01-C02', media, 'desktop-hero')}${C('WEB-DETAIL-01-C03', info, 'desktop-stack')}${C('WEB-DETAIL-01-C05', `<button class="btn block" data-act="open-service">${ico('service')} 联系客服</button>`, 'desktop-inline')}</div><div>${buyCard}</div></div>`;
  return webShell('WEB-DETAIL-01', body, 'home');
}
function renderWebBuy() {
  const body = webBackdrop('商品详情上下文', '购买面板（弹层）', '背景仅作占位；真实购买从详情页购买卡打开。');
  return `<div class="web"><div class="web-container">${body}</div>${buyPanel('WEB-BUY-01', true)}</div>`;
}

function renderWebAgreement() {
  const body = `<div class="row mb12"><button class="btn sm" data-act="back">‹ 返回</button></div>${C('WEB-AGREEMENT-01-C02', `<div style="max-width:900px;margin:0 auto">${agreementBody('WEB-AGREEMENT-01')}</div>`, 'desktop-reading')}${RV.state === 'ERROR' ? C('WEB-AGREEMENT-01-C03', statePanel('ERROR'), 'inline') : ''}`;
  return webShell('WEB-AGREEMENT-01', body, 'home');
}
function renderWebRealname() {
  const body = webBackdrop('购买校验上下文', '平台实名承接（弹层）', '背景仅作占位。');
  return `<div class="web"><div class="web-container">${body}</div>${realnameOverlay('WEB-REALNAME-01', true)}</div>`;
}

function renderWebPhone() {
  const body = `<div class="row mb12"><button class="btn sm" data-act="back">‹ 返回</button></div>${C('WEB-PHONE-01-C02', `<div style="max-width:640px;margin:0 auto">${phoneForm('WEB-PHONE-01')}</div>`, 'desktop-form')}${RV.state === 'ERROR' ? C('WEB-PHONE-01-C03', statePanel('ERROR'), 'inline') : ''}`;
  return webShell('WEB-PHONE-01', body, 'home');
}
function renderWebCheckout() {
  const o = currentOrder();
  const body = `<div class="row mb12"><button class="btn sm" data-act="back">‹ 返回</button><span class="small muted">确认订单</span></div><div class="web-checkout"><div>${C('WEB-CHECKOUT-01-C02', `<div class="card"><h3>订单明细</h3><div class="order-card" style="border:0;padding:0"><div class="mid"><div class="thumb-sm">${esc(o.title.slice(0, 1))}</div><div class="info"><b>${esc(o.title)}</b><span class="small muted">${esc(o.spec)} · 数量 1 · ${o.deliveryType === 'CODE' ? '口令码' : '好友赠送'}</span><span class="small muted">${o.deliveryType === 'GIFT' ? '好友链接：' + esc(o.friendLink || '未填写') : '发货方式：口令码'}</span></div><div class="price">${money(o.amount)}</div></div></div><div class="divider"></div><dl class="kv"><dt>订单号</dt><dd>${o.id}</dd><dt>下单时间</dt><dd>${esc(o.time)}</dd><dt>支付方式</dt><dd>${SESSION.buy.payMethod === 'WECHAT' ? '微信支付' : '支付宝'}</dd><dt>协议版本</dt><dd>${esc(SESSION.agreementVersion)}${SESSION.agreementAccepted ? '（已确认）' : '（待确认）'}</dd><dt>到期时间</dt><dd>${esc(o.expiresAt || '—')}</dd></dl>${RV.state === 'EXPIRED' ? '<div class="notice err">订单已关闭：到期查询明确未支付。</div>' : ''}${RV.state === 'RECONFIRM' ? '<div class="notice err">协议有实质性变更，继续支付前需重新确认。</div>' : ''}</div>`, 'desktop-checkout')}</div><div>${C('WEB-CHECKOUT-01-C03', `<div class="small muted">应付金额</div><div class="price lg mt8">${money(o.amount)}</div><div class="small muted">共 1 件 · 无优惠券/积分抵扣</div><div class="mt12"><button class="btn primary block" data-act="${RV.state === 'EXPIRED' ? 'rebuy' : 'checkout-pay'}" ${RV.state === 'RECONFIRM' ? 'disabled' : ''}>${RV.state === 'EXPIRED' ? '重新购买' : '继续支付'}</button>${RV.state === 'RECONFIRM' ? '<button class="btn block mt8" data-act="open-agreement-substantive">去确认协议</button>' : ''}</div><div class="tiny muted mt8">继续支付前重新校验可售性；支付结果以服务端查询为准。</div>`, 'desktop-summary')}    ${RV.state === 'ERROR' ? C('WEB-CHECKOUT-01-C04', statePanel('ERROR'), 'inline') : ''}</div></div>`;
  return webShell('WEB-CHECKOUT-01', body, 'home');
}
function renderWebPayscan() {
  const o = currentOrder();
  const state = RV.state;
  const title = state === 'PAID' ? '支付成功' : state === 'CONFIRMING' ? '确认中' : state === 'TIMEOUT' ? '支付结果确认中' : '扫码支付';
  const body = `<div class="overlay center" data-mask-act="close-payscan"><div class="sheet modal" data-stop="1" role="dialog" aria-modal="true" style="max-width:460px"><div class="sheet-head"><h3>${title}</h3><button class="icon-btn" data-act="close-payscan" aria-label="关闭">${ico('close')}</button></div><div class="sheet-body" style="text-align:center"><div class="small muted">订单 ${o.id}</div><div class="price lg mt8">${money(o.amount)}</div><div class="qr">${state === 'PAID' ? '支付成功' : state === 'CONFIRMING' ? '已扫码，确认中' : '二维码占位'}</div><p class="small muted">${state === 'PAID' ? '支付成功，可关闭查看结果。' : state === 'CONFIRMING' ? '已扫码，正在确认支付结果，请勿重复支付。' : state === 'TIMEOUT' ? '暂未取得可信结果，可重新查询。' : '请使用微信/支付宝扫码支付。渠道已在上一页选定，本层不重复选择。'}</p><div class="row" style="justify-content:center">${state === 'WAITING' ? `<button class="btn primary" data-act="sim-scan">模拟已扫码</button>` : state === 'CONFIRMING' ? `<button class="btn" data-act="sim-scan-ok">模拟支付成功</button><button class="btn" data-act="pay-requery">重新查询</button>` : state === 'PAID' ? `<button class="btn primary" data-act="open-result" data-arg="${o.id}">查看结果</button>` : `<button class="btn" data-act="pay-requery">重新查询</button><button class="btn" data-act="open-service">联系客服</button>`}</div><div class="tiny muted mt12">关闭弹窗不改变订单状态。</div></div></div></div>`;
  return `<div class="web"><div class="web-container"><div class="small muted">收银台</div></div>${C('WEB-PAYSCAN-01-C01', body, 'desktop-qr')}</div>`;
}
function renderWebPayret() {
  const body = webBackdrop('确认订单上下文', '支付返回确认（弹层）', '背景仅作占位；订单事实由查询结果决定。');
  return `<div class="web"><div class="web-container">${body}</div>${payretDialog('WEB-PAYRET-01')}</div>`;
}

function renderWebResult() {
  const body = `<div class="row mb12"><button class="btn sm" data-act="back">‹ 返回</button></div>${resultBody('WEB-RESULT-01', true)}${RV.state === 'ERROR' ? C('WEB-RESULT-01-C04', statePanel('ERROR'), 'inline') : ''}`;
  return webShell('WEB-RESULT-01', body, 'home');
}
function renderWebOrders() {
  const tabs = [['all', '全部'], ['unpaid', '待支付'], ['confirming', '确认中'], ['paid', '已支付'], ['delivered', '已完成'], ['refund', '退款'], ['exception', '交付异常']];
  const filtered = SESSION.orderTab === 'all' ? DATA.orders : DATA.orders.filter(o => o.tab === SESSION.orderTab);
  const body = `<div class="row between mb12"><h2 style="font-size:20px;font-weight:500;margin:0">我的订单</h2><span class="small muted">共 ${filtered.length} 条</span></div>${C('WEB-ORDER-01-C02', `<div class="adm-tabs" role="tablist">${tabs.map(([k, l]) => { const n = k === 'all' ? DATA.orders.length : DATA.orders.filter(o => o.tab === k).length; return `<button role="tab" aria-selected="${SESSION.orderTab === k}" data-act="order-tab" data-arg="${k}">${l}<span class="count">${n}</span></button>`; }).join('')}</div>`, 'desktop-row')}${RV.state === 'SESSION_EXPIRED' ? C('WEB-ORDER-01-C05', `<div class="empty"><b>登录已失效</b><span>请重新登录后查看订单。</span><div class="mt12"><button class="btn primary" data-act="sim-login">重新登录</button></div></div>`, 'desktop') : RV.state === 'ERROR' ? C('WEB-ORDER-01-C04', statePanel('ERROR'), 'inline') : `<div class="adm-table-wrap">${C('WEB-ORDER-01-C03', `<table class="adm-table"><thead><tr><th style="width:170px">订单号</th><th>商品</th><th style="width:100px" class="num">金额</th><th style="width:150px">下单时间</th><th style="width:150px">状态</th><th style="width:150px">操作</th></tr></thead><tbody>${filtered.map(o => `<tr><td>${o.id}</td><td>${esc(o.title)}<div class="tiny muted">${esc(o.spec)} · ${o.deliveryType === 'CODE' ? '口令码' : '好友赠送'}</div></td><td class="num">${money(o.amount)}</td><td>${esc(o.time)}</td><td>${orderStatusTag(o)}</td><td><div class="op">${orderActions(o).map(a => `<button data-act="order-action" data-arg="${o.id}|${a}">${a}</button>`).join('')}</div></td></tr>`).join('')}</tbody></table>`, 'desktop-orders')}</div>`}`;
  return webShell('WEB-ORDER-01', body, 'orders');
}
function renderWebOrderDetail() {
  const body = `<div class="row mb12"><button class="btn sm" data-act="back">‹ 返回</button></div>${orderDetailBody('WEB-ORDER-02', true)}`;
  return webShell('WEB-ORDER-02', body, 'orders');
}
function renderWebProfile() {
  const body = `<div class="row mb12"><h2 style="font-size:20px;font-weight:500;margin:0">我的</h2></div>${profileBody('WEB-PROFILE-01')}`;
  return webShell('WEB-PROFILE-01', body, 'home');
}
function renderWebService() {
  const body = `<div class="row mb12"><button class="btn sm" data-act="back">‹ 返回</button></div>${serviceBody('WEB-SERVICE-01')}`;
  return webShell('WEB-SERVICE-01', body, 'home');
}

Object.assign(R, {
  'APP-HOME-01': renderAppHome, 'APP-AUTH-01': renderAppAuth, 'APP-SEARCH-01': renderAppSearch, 'APP-SEARCH-02': renderAppSearchResults,
  'APP-DETAIL-01': renderAppDetail, 'APP-BUY-01': renderAppBuy, 'APP-AGREEMENT-01': renderAppAgreement, 'APP-REALNAME-01': renderAppRealname,
  'APP-PHONE-01': renderAppPhone, 'APP-CHECKOUT-01': renderAppCheckout, 'APP-PAYRET-01': renderAppPayret, 'APP-RESULT-01': renderAppResult,
  'APP-ORDER-01': renderAppOrders, 'APP-ORDER-02': renderAppOrderDetail, 'APP-PROFILE-01': renderAppProfile, 'APP-SERVICE-01': renderAppService,
  'WEB-HOME-01': renderWebHome, 'WEB-AUTH-01': renderWebAuth, 'WEB-SEARCH-01': renderWebSearch, 'WEB-SEARCH-02': renderWebSearchResults,
  'WEB-DETAIL-01': renderWebDetail, 'WEB-BUY-01': renderWebBuy, 'WEB-AGREEMENT-01': renderWebAgreement, 'WEB-REALNAME-01': renderWebRealname,
  'WEB-PHONE-01': renderWebPhone, 'WEB-CHECKOUT-01': renderWebCheckout, 'WEB-PAYSCAN-01': renderWebPayscan, 'WEB-PAYRET-01': renderWebPayret,
  'WEB-RESULT-01': renderWebResult, 'WEB-ORDER-01': renderWebOrders, 'WEB-ORDER-02': renderWebOrderDetail, 'WEB-PROFILE-01': renderWebProfile,
  'WEB-SERVICE-01': renderWebService
});

/* ---------- 客户端动作 ---------- */
function findProductFromBuy() { return DATA.productById(SESSION.buy.productId || 'P-1001'); }
function createOrderFromBuy() {
  const p = findProductFromBuy();
  const sku = currentSku(p);
  const seq = String(DATA.orders.length + 1).padStart(3, '0');
  const id = 'SO20261027' + seq;
  const order = { id, productId: p.id, title: p.name, spec: sku.name, amount: sku.price, pay: 'UNPAID', delivery: 'NOT_STARTED', refund: 'NONE', display: '待支付', tab: 'unpaid', time: nowText(), platform: SESSION.platform, user: SESSION.user.id, deliveryType: SESSION.buy.deliveryType, friendLink: SESSION.buy.friendLink, expiresAt: '2026-10-27 10:50' };
  DATA.orders.unshift(order);
  SESSION.currentOrderId = id;
  return order;
}
reg('tab', (page) => navigate(page));
reg('back', () => back());
reg('open-product', (id) => { SESSION.buy.productId = id; SESSION.buy.skuId = 'std'; SESSION.buy.deliveryType = DATA.productById(id).delivery; SESSION.buy.friendLink = ''; SESSION.buy.agreement = SESSION.agreementAccepted; SESSION.friendLinkTouched = false; navigate(RV.end === 'WEB' ? 'WEB-DETAIL-01' : 'APP-DETAIL-01'); });
reg('open-search', () => navigate(RV.end === 'WEB' ? 'WEB-SEARCH-01' : 'APP-SEARCH-01'));
reg('search-submit', () => {
  const k = (SESSION.search.draft || '').trim();
  if (!k) { showToast('请输入商品名称后再搜索', 'err'); return; }
  SESSION.search.query = k;
  navigate(RV.end === 'WEB' ? 'WEB-SEARCH-02' : 'APP-SEARCH-02');
});
reg('search-keyword', (k) => { SESSION.search.draft = k; SESSION.search.query = k; navigate(RV.end === 'WEB' ? 'WEB-SEARCH-02' : 'APP-SEARCH-02'); });
reg('set-sort', (k) => { SESSION.search.sort = k; renderAll(); });
reg('select-sku', (id) => { SESSION.buy.skuId = id; renderAll(); });
reg('select-delivery', (k) => { SESSION.buy.deliveryType = k; renderAll(); });
reg('select-pay', (k) => { SESSION.buy.payMethod = k; renderAll(); });
reg('toggle-expand', () => { RV.state = RV.state === 'EXPANDED' ? 'DEFAULT' : 'EXPANDED'; renderAll(); });
reg('open-buy', () => { if (!SESSION.buy.productId) SESSION.buy.productId = 'P-1001'; navigate(RV.end === 'WEB' ? 'WEB-BUY-01' : 'APP-BUY-01', 'DEFAULT'); });
reg('close-buy', () => { navigate(RV.end === 'WEB' ? 'WEB-DETAIL-01' : 'APP-DETAIL-01'); });
reg('open-agreement', () => navigate(RV.end === 'WEB' ? 'WEB-AGREEMENT-01' : 'APP-AGREEMENT-01'));
reg('open-agreement-substantive', () => navigate(RV.end === 'WEB' ? 'WEB-AGREEMENT-01' : 'APP-AGREEMENT-01', 'SUBSTANTIVE'));
reg('confirm-agreement', () => { SESSION.agreementAccepted = true; SESSION.substantiveChange = false; showToast('已确认最新协议版本'); navigate(RV.end === 'WEB' ? 'WEB-CHECKOUT-01' : 'APP-CHECKOUT-01'); });
reg('agree-continue', () => { SESSION.buy.agreement = true; SESSION.agreementAccepted = true; RV.state = 'DEFAULT'; renderAll(); });
reg('close-notice-buy', () => { RV.state = 'DEFAULT'; renderAll(); });
reg('buy-submit', () => {
  const p = findProductFromBuy();
  if (!SESSION.loggedIn) { RV.state = 'LOGIN_REQUIRED'; return renderAll(); }
  if (SESSION.realName === 'unverified' || SESSION.realName === 'unknown') { RV.state = 'REALNAME_REQUIRED'; return renderAll(); }
  if (SESSION.realName === 'minor') { RV.state = 'MINOR_BLOCKED'; return renderAll(); }
  if (!SESSION.buy.agreement && !SESSION.agreementAccepted) { RV.state = 'NOTICE'; return renderAll(); }
  SESSION.agreementAccepted = true;
  if (!SESSION.phoneBound) { RV.state = 'PHONE_REQUIRED'; return renderAll(); }
  if (p.delivery === 'GIFT' && !SESSION.buy.friendLink.trim()) { SESSION.friendLinkTouched = true; RV.state = 'VALIDATION_ERROR'; return renderAll(); }
  if (productActionState(p) === 'PENDING') { RV.state = 'DEFAULT'; return navigate(RV.end === 'WEB' ? 'WEB-PAYRET-01' : 'APP-PAYRET-01', 'ASK'); }
  if (p.sale !== 'ON') { showToast('商品当前不可购买', 'err'); return; }
  if (p.delivery === 'CODE' && ['low', 'unknown'].includes(SESSION.conditions.balance)) { RV.state = 'BALANCE_LOW'; return renderAll(); }
  const o = createOrderFromBuy();
  navigate(RV.end === 'WEB' ? 'WEB-CHECKOUT-01' : 'APP-CHECKOUT-01', SESSION.substantiveChange ? 'RECONFIRM' : 'DEFAULT');
  showToast('订单已创建：' + o.id);
});
reg('go-realname', () => navigate(RV.end === 'WEB' ? 'WEB-REALNAME-01' : 'APP-REALNAME-01', 'SHOWN'));
reg('close-notice', () => { SESSION.noticeShown = true; if (RV.pageId.includes('AUTH')) navigate(RV.end === 'WEB' ? 'WEB-HOME-01' : 'APP-HOME-01'); else renderAll(); });
reg('realname-go', () => { RV.state = 'LAUNCHING'; renderAll(); setTimeout(() => { SESSION.realName = 'verified'; RV.state = 'SUCCESS'; showToast('实名认证已完成'); renderAll(); }, 350); });
reg('realname-launching', () => { showToast('正在调起平台实名能力…'); });
reg('close-realname', () => { if (SESSION.loggedIn && SESSION.realName === 'verified') navigate(RV.end === 'WEB' ? 'WEB-CHECKOUT-01' : 'APP-CHECKOUT-01'); else navigate(RV.end === 'WEB' ? 'WEB-DETAIL-01' : 'APP-DETAIL-01'); });
reg('send-code', () => { if (!/^1\d{10}$/.test((SESSION.phoneDraft || '').replace(/\s/g, ''))) { showToast('请输入 11 位手机号', 'err'); return; } showToast('验证码已发送（演示：123456）'); });
reg('bind-phone', () => {
  const phone = (SESSION.phoneDraft || '').replace(/\s/g, '');
  if (!/^1\d{10}$/.test(phone)) { RV.state = 'VALIDATION_ERROR'; return renderAll(); }
  if ((SESSION.smsCode || '') !== '123456') { RV.state = 'ERROR'; return renderAll(); }
  if (!SESSION.privacyAccepted) { showToast('请先阅读并同意隐私政策', 'err'); return; }
  SESSION.phoneBound = true; SESSION.user.maskedPhone = phone.slice(0, 3) + '****' + phone.slice(-4); RV.state = 'SUCCESS';
  showToast('手机号绑定成功');
  setTimeout(() => navigate(RV.end === 'WEB' ? 'WEB-CHECKOUT-01' : 'APP-CHECKOUT-01'), 300);
});
reg('checkout-pay', () => {
  const o = currentOrder();
  if (RV.state === 'EXPIRED') { showToast('订单已关闭', 'err'); return; }
  if (RV.state === 'RECONFIRM') { showToast('请先确认最新协议', 'err'); return; }
  if (RV.end === 'WEB') navigate('WEB-PAYSCAN-01', 'WAITING');
  else navigate('APP-PAYRET-01', 'ASK');
});
reg('pay-query', (choice) => {
  RV.state = 'QUERYING'; renderAll();
  setTimeout(() => {
    const o = currentOrder();
    if (RV.sim === 'timeout' || o.pay === 'CONFIRMING') { RV.state = 'TIMEOUT'; return renderAll(); }
    if (RV.sim === 'fail') { RV.state = 'TIMEOUT'; return renderAll(); }
    if (choice === 'paid') { o.pay = 'PAID'; o.display = o.deliveryType === 'GIFT' ? '已支付·赠送待处理' : '已支付·发码中'; o.delivery = o.deliveryType === 'GIFT' ? 'GIFT_PENDING' : 'ISSUING'; o.code = o.code || 'VG-7K2M-9QPL-2026'; navigate(RV.end === 'WEB' ? 'WEB-RESULT-01' : 'APP-RESULT-01', o.deliveryType === 'GIFT' ? 'GIFT_PENDING' : 'CODE_ISSUING'); }
    else { navigate(RV.end === 'WEB' ? 'WEB-CHECKOUT-01' : 'APP-CHECKOUT-01', 'DEFAULT'); }
  }, 450);
});
reg('pay-requery', () => { RV.state = 'QUERYING'; renderAll(); setTimeout(() => { RV.state = RV.sim === 'ok' ? 'TIMEOUT' : 'TIMEOUT'; renderAll(); }, 400); });
reg('sim-scan', () => { RV.state = 'CONFIRMING'; renderAll(); });
reg('sim-scan-ok', () => { RV.state = 'PAID'; const o = currentOrder(); o.pay = 'PAID'; o.display = '已支付·发码中'; o.delivery = 'ISSUING'; renderAll(); });
reg('close-payscan', () => navigate('WEB-CHECKOUT-01'));
reg('close-payret', () => navigate(RV.end === 'WEB' ? 'WEB-CHECKOUT-01' : 'APP-CHECKOUT-01'));
reg('copy-code', (id) => { const o = DATA.orderById(id) || currentOrder(); writeClipboard(o.code || 'VG-7K2M-9QPL-2026', '口令码已复制'); });
reg('copy-order', (id) => writeClipboard(id || currentOrder().id, '订单号已复制'));
reg('open-order', (id) => { SESSION.currentOrderId = id || SESSION.currentOrderId; navigate(RV.end === 'WEB' ? 'WEB-ORDER-02' : 'APP-ORDER-02'); });
reg('open-result', (id) => { SESSION.currentOrderId = id || SESSION.currentOrderId; navigate(RV.end === 'WEB' ? 'WEB-RESULT-01' : 'APP-RESULT-01'); });
reg('order-tab', (k) => { SESSION.orderTab = k; renderAll(); });
reg('order-action', (arg) => { const [id, action] = String(arg).split('|'); SESSION.currentOrderId = id; const o = DATA.orderById(id); if (action === '查看') navigate(RV.end === 'WEB' ? 'WEB-ORDER-02' : 'APP-ORDER-02'); else if (action === '继续支付') navigate(RV.end === 'WEB' ? 'WEB-CHECKOUT-01' : 'APP-CHECKOUT-01'); else if (action === '重新查询') navigate(RV.end === 'WEB' ? 'WEB-PAYRET-01' : 'APP-PAYRET-01', 'TIMEOUT'); });
reg('resume-order', () => {
  const state = productActionState(findProductFromBuy());
  if (state === 'PENDING') { SESSION.currentOrderId = 'SO202610270005'; navigate(RV.end === 'WEB' ? 'WEB-PAYRET-01' : 'APP-PAYRET-01', 'ASK'); }
});
reg('requery-order', () => navigate(RV.end === 'WEB' ? 'WEB-PAYRET-01' : 'APP-PAYRET-01', 'TIMEOUT'));
reg('open-service', () => { const target = RV.end === 'WEB' ? 'WEB-SERVICE-01' : 'APP-SERVICE-01'; navigate(target, 'WITH_ORDER'); });
reg('add-service', () => { RV.state = 'FALLBACK'; renderAll(); });
reg('sim-login', () => { SESSION.loggedIn = true; SESSION.realName = 'verified'; SESSION.phoneBound = true; showToast('已模拟登录'); renderAll(); });
reg('disabled-reason', () => { const p = findProductFromBuy(); const st = productStatusText(p); showToast(st.hint || '当前不可购买', 'err'); });
reg('retry-page', () => { RV.sim = 'ok'; renderAll(); });
reg('rebuy', () => navigate(RV.end === 'WEB' ? 'WEB-DETAIL-01' : 'APP-DETAIL-01'));
reg('scroll-products', () => { const el = $('#appBody'); if (el) el.scrollTop = 220; });
reg('media', (i) => { showToast('已切换至图 ' + (Number(i) + 1)); });
reg('open-service', () => navigate(RV.end === 'WEB' ? 'WEB-SERVICE-01' : 'APP-SERVICE-01', 'WITH_ORDER'));


/* ================= 后台引擎 ================= */
const ADM_RT = {};
function rt(pageId) {
  if (!ADM_RT[pageId]) ADM_RT[pageId] = { draft: {}, committed: {}, tab: 'all', page: 1, size: 8, sel: new Set(), drawer: null, mode: 'view', msg: '' };
  return ADM_RT[pageId];
}
const ROLE_MENU = {
  '管理员': ['ADM-HOME-01', 'ADM-PRODUCT-01', 'ADM-SUPPLIER-01', 'ADM-STOCK-01', 'ADM-ORDER-01', 'ADM-GIFT-01', 'ADM-CODE-01', 'ADM-REFUND-01', 'ADM-SERVICE-01', 'ADM-SEARCH-01', 'ADM-AGREEMENT-01', 'ADM-PAYCHECK-01', 'ADM-NOTIFY-01', 'ADM-WALLET-01', 'ADM-RBAC-01', 'ADM-AUDIT-01'],
  '运营': ['ADM-HOME-01', 'ADM-PRODUCT-01', 'ADM-SUPPLIER-01', 'ADM-STOCK-01', 'ADM-ORDER-01', 'ADM-GIFT-01', 'ADM-CODE-01', 'ADM-REFUND-01', 'ADM-SERVICE-01', 'ADM-SEARCH-01', 'ADM-AGREEMENT-01', 'ADM-PAYCHECK-01', 'ADM-NOTIFY-01', 'ADM-WALLET-01', 'ADM-AUDIT-01'],
  '客服': ['ADM-ORDER-01', 'ADM-NOTIFY-01', 'ADM-AUDIT-01'],
  '财务': ['ADM-ORDER-01', 'ADM-REFUND-01', 'ADM-PAYCHECK-01', 'ADM-WALLET-01', 'ADM-AUDIT-01']
};
const ADMIN_MENU = [
  { group: '内容运营', items: [['ADM-HOME-01', '首页管理'], ['ADM-PRODUCT-01', '选品与商品'], ['ADM-SUPPLIER-01', '供应商管理'], ['ADM-STOCK-01', '库存查看']] },
  { group: '交易履约', items: [['ADM-ORDER-01', '订单管理'], ['ADM-GIFT-01', '好友赠送'], ['ADM-CODE-01', '口令码交付'], ['ADM-REFUND-01', '退款管理']] },
  { group: '服务与配置', items: [['ADM-SERVICE-01', '客服配置'], ['ADM-SEARCH-01', '搜索推荐'], ['ADM-AGREEMENT-01', '协议管理']] },
  { group: '风险与权限', items: [['ADM-PAYCHECK-01', '支付核查'], ['ADM-NOTIFY-01', '通知记录'], ['ADM-WALLET-01', '钱包余额'], ['ADM-RBAC-01', '权限管理'], ['ADM-AUDIT-01', '操作记录']] }
];
function roleCan(pageId) {
  if (pageId === 'ADM-LOGIN-01') return true;
  return (ROLE_MENU[SESSION.admin.role] || []).includes(pageId);
}

const ADMIN_CFG = {
  'ADM-PRODUCT-01': {
    title: '选品与商品管理', rows: () => DATA.candidates, stateComp: 'C09', sub: '供应商目录只作候选；已选品、内容完整、价格合规并发布后才进入前台。',
    filters: [{ k: 'name', label: '商品名称', type: 'text' }, { k: 'gid', label: '供应商 gid', type: 'text' }, { k: 'status', label: '状态', type: 'select', options: [['', '全部'], ['DRAFT', '待完善'], ['PRICE_INVALID', '价格不合规'], ['PUBLISHED', '已发布'], ['COMBO', '组合商品']] }],
    tabs: [['all', '全部'], ['DRAFT', '待完善'], ['PRICE_INVALID', '价格不合规'], ['PUBLISHED', '已发布'], ['COMBO', '组合商品']],
    tabField: r => r.status,
    rowKey: r => String(r.gid),
    columns: [
      { k: 'name', t: '商品', w: '26%', fmt: r => `<b>${esc(r.name)}</b><div class="tiny muted">${esc(r.en)}</div>` },
      { k: 'gid', t: 'gid', w: '8%' },
      { k: 'cost', t: '供货价', w: '10%', num: true, fmt: r => money(r.cost) },
      { k: 'lowest', t: '最低零售价', w: '11%', num: true, fmt: r => r.lowest ? money(r.lowest) : '不限制' },
      { k: 'retail', t: '零售价', w: '10%', num: true, fmt: r => money(r.retail) },
      { k: 'status', t: '状态', w: '18%', fmt: r => adminStatusTag(r.status) }
    ],
    actions: r => [['编辑', 'edit'], r.status === 'PUBLISHED' ? ['下架', 'offline'] : ['发布', 'publish']],
    drawerTitle: r => `商品 ${r.gid} · ${r.name}`,
    drawerComp: 'C07',
    metricsComp: null,
    exportComp: 'C08'
  },
  'ADM-STOCK-01': {
    title: '库存查看', rows: () => DATA.stockRows, stateComp: 'C07', sub: '只查看供应商缓存与新鲜度；不维护自有库存。',
    filters: [{ k: 'name', label: '商品名称', type: 'text' }, { k: 'freshness', label: '新鲜度', type: 'select', options: [['', '全部'], ['FRESH', '新鲜'], ['STALE', '过期'], ['UNKNOWN', '未知']] }],
    tabs: [['all', '全部'], ['FRESH', '新鲜'], ['STALE', '过期'], ['UNKNOWN', '未知']],
    tabField: r => r.freshness,
    rowKey: r => String(r.gid),
    metrics: () => [
      ['商品总数', String(DATA.candidates.length), '件', '供应商候选目录'],
      ['缓存新鲜', String(DATA.candidates.filter(x => x.freshness === 'FRESH').length), '件', '新鲜度阈值内'],
      ['过期/未知', String(DATA.candidates.filter(x => x.freshness !== 'FRESH').length), '件', '允许下单但提示风险'],
      ['新鲜售罄', String(DATA.candidates.filter(x => x.freshness === 'FRESH' && x.stock === 0).length), '件', '前台显示售罄']
    ],
    columns: [
      { k: 'name', t: '商品', w: '30%', fmt: r => `<b>${esc(r.name)}</b><div class="tiny muted">gid ${r.gid}</div>` },
      { k: 'stock', t: '缓存库存', w: '12%', num: true, fmt: r => r.stock == null ? '未知' : r.stock },
      { k: 'freshness', t: '新鲜度', w: '14%', fmt: r => ({ FRESH: '新鲜', STALE: '过期', UNKNOWN: '未知' })[r.freshness] },
      { k: 'synced', t: '同步时间', w: '18%' },
      { k: 'sale', t: '前台状态', w: '14%', fmt: r => r.stock === 0 && r.freshness === 'FRESH' ? '售罄' : r.freshness === 'FRESH' ? '可售' : '风险提示' },
      { k: 'supplier', t: '供应商', w: '12%' }
    ],
    actions: r => [['同步', 'sync']],
    drawerComp: null, metricsComp: 'C04'
  },
  'ADM-ORDER-01': {
    title: '订单管理', rows: () => DATA.orders, stateComp: 'C09', sub: '查询订单、查看支付/交付/退款明细；导出按权限并留痕。',
    filters: [{ k: 'orderId', label: '订单号', type: 'text' }, { k: 'platform', label: '来源平台', type: 'select', options: [['', '全部'], ['A', 'A'], ['B', 'B'], ['C', 'C']] }, { k: 'display', label: '状态', type: 'select', options: [['', '全部'], ['待支付', '待支付'], ['支付确认中', '支付确认中'], ['已支付·发码中', '已支付·发码中'], ['已交付', '已交付'], ['退款失败', '退款失败']] }],
    tabs: [['all', '全部'], ['unpaid', '待支付'], ['confirming', '确认中'], ['paid', '已支付'], ['delivered', '已完成'], ['refund', '退款'], ['exception', '交付异常']],
    tabField: r => r.tab,
    rowKey: r => r.id,
    columns: [
      { k: 'id', t: '订单号', w: '17%', fmt: r => `<b>${r.id}</b><div class="tiny muted">${esc(r.time)}</div>` },
      { k: 'platform', t: '平台', w: '7%' },
      { k: 'title', t: '商品', w: '26%', fmt: r => `${esc(r.title)}<div class="tiny muted">${esc(r.spec)} · ${r.deliveryType === 'CODE' ? '口令码' : '好友赠送'}</div>` },
      { k: 'amount', t: '金额', w: '10%', num: true, fmt: r => money(r.amount) },
      { k: 'display', t: '组合状态', w: '20%', fmt: r => orderStatusTag(r) }
    ],
    actions: r => [['查看', 'view'], ...(r.pay === 'CONFIRMING' ? [['转支付核查', 'paycheck']] : [])],
    drawerTitle: r => `订单 ${r.id}`,
    drawerComp: 'C07', exportComp: 'C08'
  },
  'ADM-GIFT-01': {
    title: '好友赠送', rows: () => DATA.gifts, stateComp: 'C09', sub: '导出不等于完成；运营核实好友收到游戏后才可标记完成。',
    filters: [{ k: 'orderId', label: '订单号', type: 'text' }, { k: 'status', label: '状态', type: 'select', options: [['', '全部'], ['待处理', '待处理'], ['处理中', '处理中'], ['处理异常', '处理异常']] }],
    tabs: [['all', '全部'], ['待处理', '待处理'], ['处理中', '处理中'], ['处理异常', '处理异常']],
    tabField: r => r.status,
    rowKey: r => r.id,
    batch: true,
    columns: [
      { k: 'id', t: '批次号', w: '18%' },
      { k: 'orderId', t: '订单号', w: '17%' },
      { k: 'product', t: '商品', w: '20%' },
      { k: 'link', t: '好友链接', w: '18%', fmt: r => `<span class="tiny">${esc(r.link)}</span>` },
      { k: 'payTime', t: '付款时间', w: '14%' },
      { k: 'status', t: '状态', w: '12%' }
    ],
    actions: r => [['处理', 'process'], ['导出', 'export']],
    drawerTitle: r => `赠送批次 ${r.id}`,
    drawerComp: 'C08', batchComp: 'C07'
  },
  'ADM-CODE-01': {
    title: '口令码交付', rows: () => DATA.deliveries, stateComp: 'C08', sub: '失败不扣款；24 小时内同 orderid 重试；pu006 只查结果。',
    filters: [{ k: 'orderId', label: '订单号', type: 'text' }, { k: 'state', label: '交付状态', type: 'select', options: [['', '全部'], ['发码中', '发码中'], ['已交付', '已交付'], ['交付异常', '交付异常'], ['未启动', '未启动']] }],
    tabs: [['all', '全部'], ['发码中', '发码中'], ['交付异常', '交付异常'], ['已交付', '已交付']],
    tabField: r => r.state,
    rowKey: r => r.id,
    columns: [
      { k: 'orderId', t: '订单号', w: '17%' },
      { k: 'gid', t: 'gid', w: '8%' },
      { k: 'requestId', t: '请求 orderid', w: '18%' },
      { k: 'state', t: '状态', w: '14%' },
      { k: 'retry', t: '重试', w: '7%', num: true },
      { k: 'deadline', t: '24h 截止', w: '14%' }
    ],
    actions: r => [['处理', 'process'], ...(r.state === '交付异常' ? [['重试', 'retry']] : [])],
    drawerTitle: r => `交付记录 ${r.id}`,
    drawerComp: 'C07'
  },
  'ADM-REFUND-01': {
    title: '退款管理', rows: () => DATA.refunds, stateComp: 'C08', sub: '系统异常闭集自动退款；用户特殊退款人工审核；成功以资金结果为准。',
    filters: [{ k: 'orderId', label: '订单号', type: 'text' }, { k: 'state', label: '退款状态', type: 'select', options: [['', '全部'], ['失败', '失败'], ['退款中', '退款中'], ['成功', '成功']] }],
    tabs: [['all', '全部'], ['失败', '失败'], ['退款中', '退款中'], ['成功', '成功']],
    tabField: r => r.state,
    rowKey: r => r.id,
    columns: [
      { k: 'id', t: '退款单', w: '13%' },
      { k: 'orderId', t: '订单号', w: '18%' },
      { k: 'type', t: '类型', w: '10%' },
      { k: 'amount', t: '金额', w: '10%', num: true, fmt: r => money(r.amount) },
      { k: 'state', t: '状态', w: '9%' },
      { k: 'reason', t: '原因', w: '28%' }
    ],
    actions: r => [['处理', 'process'], ...(r.state === '失败' ? [['重试', 'retry']] : [])],
    drawerTitle: r => `退款 ${r.id}`,
    drawerComp: 'C07'
  },
  'ADM-PAYCHECK-01': {
    title: '支付核查', rows: () => DATA.paychecks, stateComp: 'C08', sub: '只有渠道查询结果或可信支付凭证可以改变支付状态。',
    filters: [{ k: 'orderId', label: '订单号', type: 'text' }, { k: 'state', label: '核查状态', type: 'select', options: [['', '全部'], ['待核查', '待核查'], ['核查中', '核查中']] }],
    tabs: [['all', '全部'], ['待核查', '待核查'], ['核查中', '核查中']],
    tabField: r => r.state,
    rowKey: r => r.id,
    columns: [
      { k: 'orderId', t: '订单号', w: '18%' },
      { k: 'channel', t: '渠道', w: '8%' },
      { k: 'amount', t: '金额', w: '10%', num: true, fmt: r => money(r.amount) },
      { k: 'first', t: '首次确认中', w: '20%' },
      { k: 'state', t: '状态', w: '12%' },
      { k: 'evidence', t: '证据', w: '15%' }
    ],
    actions: r => [['核查', 'check']],
    drawerTitle: r => `支付核查 ${r.id}`,
    drawerComp: 'C07'
  },
  'ADM-NOTIFY-01': {
    title: '通知记录', rows: () => DATA.notifications, stateComp: 'C08', sub: '发码/退款站内信任务；失败可授权重试并留痕。',
    filters: [{ k: 'orderId', label: '订单号', type: 'text' }, { k: 'state', label: '状态', type: 'select', options: [['', '全部'], ['发送失败', '发送失败'], ['平台已受理', '平台已受理'], ['待发送', '待发送']] }],
    tabs: [['all', '全部'], ['发送失败', '发送失败'], ['平台已受理', '平台已受理'], ['待发送', '待发送']],
    tabField: r => r.state,
    rowKey: r => r.id,
    columns: [
      { k: 'id', t: '任务', w: '10%' },
      { k: 'orderId', t: '订单号', w: '18%' },
      { k: 'event', t: '事件', w: '14%' },
      { k: 'platform', t: '平台', w: '7%' },
      { k: 'state', t: '状态', w: '16%' },
      { k: 'last', t: '最后处理', w: '20%' }
    ],
    actions: r => [['查看', 'view'], ...(r.state === '发送失败' ? [['重试', 'retry']] : [])],
    drawerTitle: r => `通知任务 ${r.id}`,
    drawerComp: 'C07'
  },
  'ADM-AUDIT-01': {
    title: '操作记录', rows: () => DATA.audits, stateComp: 'C07', sub: '敏感操作前后结果、人员、时间与原因；只读。',
    filters: [{ k: 'target', label: '对象/订单', type: 'text' }, { k: 'actor', label: '操作人', type: 'text' }],
    tabs: [['all', '全部']], tabField: () => 'all', rowKey: r => r.id,
    columns: [
      { k: 'time', t: '时间', w: '16%' },
      { k: 'actor', t: '操作人', w: '12%' },
      { k: 'action', t: '动作', w: '14%' },
      { k: 'target', t: '对象', w: '26%' },
      { k: 'before', t: '变更前', w: '14%' },
      { k: 'after', t: '变更后', w: '14%' }
    ],
    actions: r => [['查看', 'view']], drawerTitle: r => `操作记录 ${r.id}`, drawerComp: 'C06'
  },
  'ADM-RBAC-01': {
    title: '权限管理', rows: () => rt('ADM-RBAC-01').tab === 'roles' ? DATA.roles.map(r => ({ id: r.id, name: r.name, role: '角色', scope: r.desc, state: r.singleRefund ? '单人退款已授权' : '默认关闭' })) : DATA.accounts, stateComp: 'C06', sub: '“需授权”默认关闭；角色可合并；单人退款必须专项授权并留痕。',
    filters: [], tabs: [['accounts', '账号'], ['roles', '角色']], tabField: () => 'accounts', rowKey: r => r.id,
    columns: [
      { k: 'name', t: '名称', w: '22%', fmt: r => `<b>${esc(r.name)}</b>` },
      { k: 'role', t: '角色', w: '18%' },
      { k: 'scope', t: '数据范围/说明', w: '40%' },
      { k: 'state', t: '状态', w: '12%', fmt: r => r.state || '—' }
    ],
    actions: r => [['配置权限', 'perm']], drawerTitle: r => `权限配置 · ${r.name}`, drawerComp: 'C05'
  }
};

function adminStatusTag(s) {
  const map = { PUBLISHED: '已发布', DRAFT: '待完善', PRICE_INVALID: '价格不合规', COMBO: '组合商品' };
  const cls = s === 'PRICE_INVALID' ? 'err' : s === 'PUBLISHED' ? 'ok' : '';
  return `<span class="tag ${cls}">${map[s] || esc(s)}</span>`;
}

function adminMenu(pageId) {
  const visible = ROLE_MENU[SESSION.admin.role] || [];
  return C(pageId + '-C01', `<div class="adm-brand">${ico('code')}<span>商城后台</span><button class="fold" data-act="adm-fold" aria-label="收起菜单">${ico('menu')}</button></div>
    <div class="adm-search"><input placeholder="搜索菜单" data-adm-menu-search aria-label="搜索菜单"></div>
    <div class="adm-menu-list">${ADMIN_MENU.map(g => {
      const items = g.items.filter(([id]) => visible.includes(id));
      if (!items.length) return '';
      return `<div class="adm-group">${g.group}</div>${items.map(([id, name]) => `<button class="adm-item" data-act="adm-nav" data-arg="${id}" ${pageId === id ? 'aria-current="page"' : ''}>${ico('code')}<span>${name}</span>${id === 'ADM-REFUND-01' && DATA.refunds.some(r => r.state === '失败') ? '<span class="badge">1</span>' : ''}</button>`).join('')}`;
    }).join('')}</div>`, 'admin', 'div', 'adm-menu');
}
function adminTop() {
  return C(RV.pageId + '-C02', `<span>运营后台</span><span class="role"><span>${esc(SESSION.admin.account)} · ${esc(SESSION.admin.role)}</span><button class="rv-btn" data-act="adm-logout">退出</button></span>`, 'admin', 'div', 'adm-top');
}
function adminShell(pageId, body) {
  return `<div class="adm ${SESSION.admin.collapsed ? 'collapsed' : ''}">${adminMenu(pageId)}<div class="adm-work">${adminTop()}<div class="adm-body">${body}</div>${adminDrawer(pageId)}</div></div>`;
}
function adminTitle(title, sub, ops = '') {
  return `<div class="adm-title"><div><h2>${esc(title)}</h2><div class="sub">${esc(sub)}</div></div><div class="ops">${ops}</div></div>`;
}
function adminMetrics(defs, compId) {
  if (!defs) return '';
  return C(compId, `<div class="adm-metrics">${defs.map(([l, n, u, s]) => `<div class="metric"><div class="l">${esc(l)}</div><div class="n">${esc(n)} <span class="tiny muted">${esc(u)}</span></div><div class="s">${esc(s)}</div></div>`).join('')}</div>`, 'admin');
}
function adminFilters(pageId, cfg) {
  const c = rt(pageId);
  return C(pageId + '-C03', `<div class="adm-filters" role="search">${(cfg.filters || []).map(f => `<div class="f"><label for="f-${pageId}-${f.k}">${esc(f.label)}</label>${f.type === 'select' ? `<select id="f-${pageId}-${f.k}" data-adm-field="${f.k}">${f.options.map(([v, l]) => `<option value="${esc(v)}" ${c.draft[f.k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>` : `<input id="f-${pageId}-${f.k}" data-adm-field="${f.k}" value="${esc(c.draft[f.k] || '')}" placeholder="输入${esc(f.label)}">`}</div>`).join('')}<div class="f btns"><button class="rv-btn primary" data-act="adm-query">查询</button><button class="rv-btn" data-act="adm-reset">重置</button><button class="rv-btn" data-act="adm-refresh">刷新</button>${cfg.exportComp ? C(pageId + '-' + cfg.exportComp, `<button class="rv-btn" data-act="adm-export">导出</button>`, 'admin') : ''}</div></div>`, 'admin');
}
function adminTabs(pageId, cfg, rows) {
  if (!cfg.tabs) return '';
  const counts = {};
  cfg.tabs.forEach(([k]) => counts[k] = k === 'all' ? rows.length : rows.filter(r => cfg.tabField(r) === k).length);
  return C(pageId + '-C04', `<div class="adm-tabs" role="tablist">${cfg.tabs.map(([k, l]) => `<button role="tab" aria-selected="${rt(pageId).tab === k}" data-act="adm-tab" data-arg="${k}">${l}<span class="count">${counts[k]}</span></button>`).join('')}</div>`, 'admin');
}
function adminFilterRows(pageId, cfg) {
  const c = rt(pageId);
  let rows = cfg.rows ? cfg.rows() : [];
  for (const [k, v] of Object.entries(c.committed)) {
    if (!v) continue;
    rows = rows.filter(r => String((r[k] != null ? r[k] : (k === 'orderId' ? r.id : '')) == null ? '' : (r[k] != null ? r[k] : (k === 'orderId' ? r.id : ''))).toLowerCase().includes(String(v).toLowerCase()));
  }
  return rows;
}
function adminPageRows(pageId, cfg) {
  let rows = adminFilterRows(pageId, cfg);
  if (cfg.tabField && rt(pageId).tab !== 'all') rows = rows.filter(r => cfg.tabField(r) === rt(pageId).tab);
  return rows;
}
function adminTable(pageId, cfg, rows) {
  const c = rt(pageId);
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / c.size));
  if (c.page > pages) c.page = pages;
  const start = (c.page - 1) * c.size;
  const pageRows = rows.slice(start, start + c.size);
  if (!pageRows.length) return C(pageId + '-' + (cfg.stateComp || 'C09'), statePanel('EMPTY', '当前筛选条件下没有记录。'), 'admin');
  const head = `<thead><tr>${cfg.batch ? '<th style="width:36px"><input type="checkbox" data-act="adm-selall" aria-label="全选当前页"></th>' : ''}${cfg.columns.map(col => `<th class="${col.num ? 'num' : ''}" style="${col.w ? 'width:' + col.w : ''}">${esc(col.t)}</th>`).join('')}<th style="width:${cfg.actions ? '150px' : '0'}">操作</th></tr></thead>`;
  const body = pageRows.map(r => {
    const id = cfg.rowKey(r);
    const checked = c.sel.has(id);
    return `<tr data-rowid="${esc(id)}">${cfg.batch ? `<td><input type="checkbox" data-act="adm-sel" data-arg="${esc(id)}" ${checked ? 'checked' : ''} aria-label="选择 ${esc(id)}"></td>` : ''}${cfg.columns.map(col => `<td class="${col.num ? 'num' : ''}">${col.fmt ? col.fmt(r) : (r[col.k] == null || r[col.k] === '' ? '—' : esc(r[col.k]))}</td>`).join('')}<td><div class="op">${(cfg.actions ? cfg.actions(r) : []).map(([n, a]) => `<button data-act="adm-row" data-arg="${esc(id)}|${a}">${esc(n)}</button>`).join('')}</div></td></tr>`;
  }).join('');
  const table = `<div class="adm-table-wrap">${C(pageId + '-C05', `<table class="adm-table">${head}<tbody>${body}</tbody></table>`, 'admin')}</div>`;
  const pager = C(pageId + '-' + (cfg.pagerComp || 'C06'), `<div class="adm-pager"><span>共 ${total} 条 · 第 ${c.page}/${pages} 页</span><select data-adm-size aria-label="每页条数">${[8, 10, 20].map(n => `<option ${c.size === n ? 'selected' : ''}>${n}</option>`).join('')}</select><span>条/页</span><button data-act="adm-page" data-arg="${c.page - 1}" ${c.page <= 1 ? 'disabled' : ''}>上一页</button><span class="cur">${c.page}</span><button data-act="adm-page" data-arg="${c.page + 1}" ${c.page >= pages ? 'disabled' : ''}>下一页</button></div>`, 'admin');
  return table + pager;
}
function adminBatchBar(pageId, cfg, rows) {
  if (!cfg.batch) return '';
  const c = rt(pageId);
  return C(pageId + '-' + (cfg.batchComp || 'C07'), `<div class="adm-batch ${c.sel.size ? 'show' : ''}"><span>已选 ${c.sel.size} 项（当前页）</span><button class="rv-btn" data-act="adm-clear-sel">清除选择</button><button class="rv-btn" data-act="adm-batch-export">批量导出</button><button class="rv-btn" data-act="adm-batch-process">批量开始处理</button></div>`, 'admin');
}
function adminList(pageId, cfg) {
  if (RV.state === 'NO_PERM' || !roleCan(pageId)) return adminShell(pageId, adminTitle(cfg.title, cfg.sub) + C(pageId + '-' + (cfg.stateComp || 'C09'), statePanel('NO_PERM', '当前角色无权访问该模块。'), 'admin'));
  if (RV.sim === 'fail' || RV.state === 'ERROR') return adminShell(pageId, adminTitle(cfg.title, cfg.sub) + adminFilters(pageId, cfg) + C(pageId + '-' + (cfg.stateComp || 'C09'), statePanel('ERROR'), 'admin'));
  if (RV.sim === 'timeout' || RV.state === 'TIMEOUT') return adminShell(pageId, adminTitle(cfg.title, cfg.sub) + adminFilters(pageId, cfg) + C(pageId + '-' + (cfg.stateComp || 'C09'), statePanel('TIMEOUT'), 'admin'));
  if (RV.state === 'LOADING') return adminShell(pageId, adminTitle(cfg.title, cfg.sub) + adminFilters(pageId, cfg) + C(pageId + '-' + (cfg.stateComp || 'C09'), statePanel('LOADING'), 'admin'));
  const all = adminFilterRows(pageId, cfg);
  const rows = adminPageRows(pageId, cfg);
  const body = adminTitle(cfg.title, cfg.sub, '') + (cfg.metrics ? adminMetrics(cfg.metrics(), pageId + '-' + cfg.metricsComp) : '') + adminFilters(pageId, cfg) + adminTabs(pageId, cfg, all) + adminBatchBar(pageId, cfg, all) + ((RV.sim === 'empty' || RV.state === 'EMPTY' || !rows.length) ? C(pageId + '-' + (cfg.stateComp || 'C09'), statePanel('EMPTY', '当前筛选条件下没有记录。'), 'admin') : adminTable(pageId, cfg, rows));
  return adminShell(pageId, body);
}

function adminDrawer(pageId) {
  const cfg = ADMIN_CFG[pageId];
  const c = rt(pageId);
  if (!cfg || !c.drawer || !cfg.drawerComp) return '';
  const row = (cfg.rows ? cfg.rows() : []).find(r => cfg.rowKey(r) === c.drawer);
  if (!row) return '';
  const html = drawerContent(pageId, cfg, row, c.mode);
  return C(pageId + '-' + cfg.drawerComp, `<div class="adm-modal" data-adm-modal><div class="overlay" data-mask-act="adm-close-drawer" style="position:absolute;inset:0;align-items:center;padding:16px"><div class="sheet" data-stop="1" style="max-width:920px;max-height:84%;border-radius:0" role="dialog" aria-modal="true"><div class="sheet-head"><h3>${esc(cfg.drawerTitle(row))}<span class="sub tiny muted" style="display:block;font-weight:400">记录 ID：${esc(cfg.rowKey(row))} · ${c.mode === 'edit' ? '编辑' : '查看'}</span></h3><div class="row"><button class="btn sm primary" data-act="adm-drawer-save">保存</button><button class="icon-btn" data-act="adm-close-drawer" aria-label="关闭">${ico('close')}</button></div></div><div class="sheet-body">${html}</div></div></div></div>`, 'admin-detail');
}
function drawerContent(pageId, cfg, row, mode) {
  if (pageId === 'ADM-ORDER-01') {
    return `<div class="card"><h3>成交快照</h3><dl class="kv"><dt>订单号</dt><dd>${row.id}</dd><dt>商品</dt><dd>${esc(row.title)} · ${esc(row.spec)}</dd><dt>金额</dt><dd>${money(row.amount)}</dd><dt>来源平台</dt><dd>${row.platform}</dd><dt>下单时间</dt><dd>${esc(row.time)}</dd><dt>协议版本</dt><dd>${esc(SESSION.agreementVersion)}</dd><dt>交付方式</dt><dd>${row.deliveryType === 'CODE' ? '口令码' : '好友赠送'}</dd></dl></div>
      <div class="card"><h3>支付 / 交付 / 退款</h3><dl class="kv"><dt>支付状态</dt><dd>${row.pay}</dd><dt>交付状态</dt><dd>${row.delivery}</dd><dt>退款状态</dt><dd>${row.refund}</dd>${row.refundReason ? `<dt>退款原因</dt><dd>${esc(row.refundReason)}</dd>` : ''}${row.error ? `<dt>交付异常</dt><dd>${esc(row.error)}</dd>` : ''}</dl></div>
      <div class="card"><h3>通知记录</h3><p class="small muted">发码/退款站内信任务与请求标识见通知记录模块；本弹窗不重复展示完整口令码。</p></div>
      <div class="row"><button class="btn" data-act="adm-order-copy" data-arg="${row.id}">复制订单号</button>${row.pay === 'CONFIRMING' ? `<button class="btn primary" data-act="adm-to-paycheck" data-arg="${row.id}">转支付核查</button>` : ''}<button class="btn" data-act="adm-view-code" data-arg="${row.id}">查看口令码（需权限）</button></div>`;
  }
  if (pageId === 'ADM-PRODUCT-01') {
    return `<div class="card"><h3>供应商与内容</h3><div class="field"><label>供应商 gid</label><input class="input" value="${row.gid}" readonly></div><div class="field"><label>商品名称</label><input class="input" data-adm-edit="name" value="${esc(row.name)}"></div><div class="field"><label>英文名</label><input class="input" data-adm-edit="en" value="${esc(row.en)}"></div><div class="field"><label>内容完整度</label><input class="input" value="${esc(row.content)}" readonly></div><div class="field"><label>组合商品白名单</label><div class="check"><input type="checkbox" ${row.combo ? 'checked' : ''} disabled><span>${row.combo ? '组合商品，首期不上架' : '非组合商品，可上架'}</span></div></div></div>
      <div class="card"><h3>定价</h3><div class="field"><label>供货价（分）</label><input class="input" value="${row.cost}" readonly></div><div class="field"><label>最低零售价（分）</label><input class="input" value="${row.lowest}" readonly></div><div class="field"><label>零售价（分）</label><input class="input" data-adm-edit="retail" value="${row.retail}">${row.retail < Math.max(row.cost, row.lowest) ? '<div class="err">零售价低于 max(供货价, 最低零售价)，不能发布。</div>' : ''}</div><div class="small muted">零售价必须 ≥ max(供货价, 最低零售价)；lowestPrice=0 显示“不限制”。</div></div>
      <div class="row"><button class="btn primary" data-act="adm-product-publish" data-arg="${row.gid}">发布</button>${row.status === 'PUBLISHED' ? `<button class="btn" data-act="adm-product-offline" data-arg="${row.gid}">下架</button>` : ''}<button class="btn" data-act="adm-product-review" data-arg="${row.gid}">提交审核</button></div>`;
  }
  if (pageId === 'ADM-GIFT-01') {
    return `<div class="card"><h3>批次信息</h3><dl class="kv"><dt>批次号</dt><dd>${row.id}</dd><dt>订单号</dt><dd>${row.orderId}</dd><dt>商品</dt><dd>${esc(row.product)}</dd><dt>好友链接</dt><dd>${esc(row.link)}</dd><dt>付款时间</dt><dd>${esc(row.payTime)}</dd><dt>状态</dt><dd>${row.status}</dd><dt>处理人</dt><dd>${esc(row.operator)}</dd></dl></div>
      <div class="card"><h3>处理动作</h3><p class="small muted">导出只生成批次，不自动完成。运营核实好友收到游戏后，填写完成依据并标记完成。</p><div class="field"><label>完成确认依据（完成时必填）</label><textarea class="input" data-adm-edit="evidence" rows="3" placeholder="例如：已在 Steam 确认好友收到游戏，时间..."></textarea></div><div class="row"><button class="btn" data-act="adm-gift-export" data-arg="${row.id}">导出批次</button><button class="btn primary" data-act="adm-gift-complete" data-arg="${row.id}">标记完成</button><button class="btn" data-act="adm-gift-exception" data-arg="${row.id}">记录异常</button></div></div>`;
  }
  if (pageId === 'ADM-CODE-01') {
    return `<div class="card"><h3>请求 / 返回</h3><dl class="kv"><dt>请求 orderid</dt><dd>${row.requestId}</dd><dt>供应商采购单</dt><dd>${row.buyOrderId}</dd><dt>gid</dt><dd>${row.gid}</dd><dt>状态</dt><dd>${row.state}</dd><dt>重试次数</dt><dd>${row.retry}</dd><dt>24h 截止</dt><dd>${row.deadline}</dd><dt>错误码</dt><dd>${esc(row.error)}</dd><dt>口令码</dt><dd>********（按权限查看）</dd></dl></div>
      <div class="card"><h3>处理</h3><div class="notice">pu006 只允许查询结果；超过 24 小时不得重复请求；补发/换码需填写原因并关联原记录。</div><div class="field"><label>处理原因（补发/换码必填）</label><textarea class="input" data-adm-edit="reason" rows="2"></textarea></div><div class="row"><button class="btn primary" data-act="adm-code-retry" data-arg="${row.id}">复用原 orderid 重试</button><button class="btn" data-act="adm-code-reissue" data-arg="${row.id}">补发/换码</button><button class="btn" data-act="adm-code-refund" data-arg="${row.id}">转退款</button></div></div>`;
  }
  if (pageId === 'ADM-REFUND-01') {
    return `<div class="card"><h3>退款单</h3><dl class="kv"><dt>退款单</dt><dd>${row.id}</dd><dt>订单号</dt><dd>${row.orderId}</dd><dt>类型</dt><dd>${row.type}</dd><dt>金额</dt><dd>${money(row.amount)}</dd><dt>状态</dt><dd>${row.state}</dd><dt>原因</dt><dd>${esc(row.reason)}</dd><dt>操作人</dt><dd>${esc(row.operator)}</dd><dt>重试</dt><dd>${row.retry}</dd></dl></div>
      <div class="card"><h3>审核 / 执行</h3><p class="small muted">成功以资金结果为准；失败可重试但复用原退款任务标识；单人退款需专项权限并留痕。</p><div class="row"><button class="btn" data-act="adm-refund-approve" data-arg="${row.id}">审核通过</button><button class="btn primary" data-act="adm-refund-execute" data-arg="${row.id}">执行退款</button>${row.state === '失败' ? `<button class="btn" data-act="adm-refund-retry" data-arg="${row.id}">重试</button>` : ''}</div></div>`;
  }
  if (pageId === 'ADM-PAYCHECK-01') {
    return `<div class="card"><h3>支付核查</h3><dl class="kv"><dt>订单号</dt><dd>${row.orderId}</dd><dt>渠道</dt><dd>${row.channel}</dd><dt>金额</dt><dd>${money(row.amount)}</dd><dt>首次确认中</dt><dd>${row.first}</dd><dt>最后查询</dt><dd>${row.last}</dd><dt>核查状态</dt><dd>${row.state}</dd></dl><div class="field"><label>渠道证据（确认已支付/未支付必填）</label><textarea class="input" data-adm-edit="evidence" rows="3" placeholder="渠道查询结果、支付流水号或可信支付凭证摘要"></textarea></div><div class="row"><button class="btn primary" data-act="adm-check-paid" data-arg="${row.id}">确认已支付</button><button class="btn" data-act="adm-check-unpaid" data-arg="${row.id}">确认未支付并关闭</button><button class="btn" data-act="adm-check-unknown" data-arg="${row.id}">仍无法确认</button></div><div class="tiny muted mt8">用户口述、客服备注、前端返回参数不能作为支付事实。</div></div>`;
  }
  if (pageId === 'ADM-NOTIFY-01') {
    return `<div class="card"><h3>通知任务</h3><dl class="kv"><dt>任务</dt><dd>${row.id}</dd><dt>订单号</dt><dd>${row.orderId}</dd><dt>事件</dt><dd>${esc(row.event)}</dd><dt>平台</dt><dd>${row.platform}</dd><dt>状态</dt><dd>${row.state}</dd><dt>模板版本</dt><dd>${row.template}</dd><dt>重试次数</dt><dd>${row.retry}</dd><dt>失败原因</dt><dd>${esc(row.error)}</dd></dl></div><div class="row"><button class="btn primary" data-act="adm-notify-retry" data-arg="${row.id}">授权重试</button></div><div class="tiny muted mt8">已退款或交付内容已替换时不发送过时成功文案。</div>`;
  }
  if (pageId === 'ADM-AUDIT-01') {
    return `<div class="card"><h3>操作记录</h3><dl class="kv"><dt>记录 ID</dt><dd>${row.id}</dd><dt>操作人</dt><dd>${esc(row.actor)}</dd><dt>动作</dt><dd>${esc(row.action)}</dd><dt>对象</dt><dd>${esc(row.target)}</dd><dt>时间</dt><dd>${esc(row.time)}</dd><dt>原因</dt><dd>${esc(row.reason)}</dd><dt>变更前</dt><dd>${esc(row.before)}</dd><dt>变更后</dt><dd>${esc(row.after)}</dd></dl></div><div class="notice">操作记录只读，不提供编辑或删除。</div>`;
  }
  if (pageId === 'ADM-RBAC-01') {
    const role = DATA.roles.find(x => x.name === row.role) || DATA.roles.find(x => x.name === row.name) || DATA.roles[0];
    const perms = [['首页编辑', 1], ['首页发布', 0], ['商品编辑/发布', 0], ['退款审核', 0], ['退款执行', 0], ['单人退款', 0], ['查码', 0], ['导出', 0], ['支付核查', 0], ['权限配置', 0]];
    return `<div class="card"><h3>角色权限矩阵 · ${esc(role.name)}</h3><p class="small muted">“需授权”默认关闭；角色合并不会自动获得退款执行或单人退款。</p><table class="adm-table"><thead><tr><th>动作</th><th style="width:120px">允许</th><th>说明</th></tr></thead><tbody>${perms.map(([n, v]) => `<tr><td>${n}</td><td><input type="checkbox" ${v ? 'checked' : ''} data-adm-perm="${n}"></td><td class="tiny muted">${n === '单人退款' ? '必须专项授权并留痕' : '按人员职责单独授权'}</td></tr>`).join('')}</tbody></table><div class="mt12"><button class="btn primary" data-act="adm-rbac-save" data-arg="${esc(role.name)}">保存权限</button></div></div>`;
  }
  return '<div class="empty">暂无详情。</div>';
}

/* ---------- 配置页 ---------- */
function adminHomePage() {
  const form = C('ADM-HOME-01-C03', `<div class="card"><h3>广告位</h3>${[['首页顶部广告', 'home://product/P-1001', '启用'], ['赠送服务说明', 'home://service', '启用']].map(([t, target, st], i) => `<div class="adm-filters" style="margin-bottom:8px"><div class="f" style="min-width:220px"><label>标题 ${i + 1}</label><input value="${t}"></div><div class="f" style="min-width:220px"><label>跳转目标</label><input value="${target}"></div><div class="f"><label>排序</label><input value="${i + 1}" style="width:80px"></div><div class="f"><label>状态</label><select><option>启用</option><option>停用</option></select></div></div>`).join('')}<div class="small muted">草稿保存不生效；发布后对 A/B/C 三端同时生效。</div></div>
    <div class="card"><h3>快捷导航与推荐</h3><div class="field"><label>快捷导航</label><input class="input" value="我的订单 / 联系客服 / 搜索商品 / 全部商品" readonly></div><div class="field"><label>推荐商品（只能从已发布商品选择）</label><input class="input" value="P-1001 赛博朋克 2077：往日之影；P-1004 荒野大镖客 2；P-1005 双人成行" readonly></div><div class="small muted">不提供钱包、领券、购物车、积分等本期未建设入口。</div></div>
    <div class="row"><button class="btn" data-act="adm-home-draft">保存草稿</button><button class="btn" data-act="adm-home-preview">预览</button><button class="btn primary" data-act="adm-home-publish">发布</button></div>`, 'admin-config');
  const state = RV.state === 'NO_PERM' ? statePanel('NO_PERM') : RV.sim === 'fail' || RV.state === 'ERROR' ? statePanel('ERROR') : '';
  return adminShell('ADM-HOME-01', adminTitle('首页管理', '同一套广告、导航和推荐配置覆盖三入口；草稿→预览→发布。') + form + C('ADM-HOME-01-C04', state, 'admin'));
}
function adminSupplierPage() {
  const form = C('ADM-SUPPLIER-01-C03', `<div class="card"><h3>供应商凭据</h3><div class="field"><label>供应商平台</label><input class="input" value="Higame 直销商平台" readonly></div><div class="field"><label>APPID</label><input class="input" value="1003" readonly></div><div class="field"><label>APPKEY / accesstoken</label><input class="input" value="********（仅管理员可见）" readonly></div><div class="small muted">所有供应商接口必须由商城服务端调用；H5 不得暴露密钥或签名逻辑。</div></div>
    <div class="card"><h3>商品 gid 映射</h3><table class="adm-table"><thead><tr><th>商城商品</th><th>供应商 gid</th><th>状态</th><th>操作</th></tr></thead><tbody>${DATA.candidates.filter(x => x.status !== 'COMBO').map(x => `<tr><td>${esc(x.name)}</td><td>${x.gid}</td><td>${x.selected ? '已选品' : '未选品'}</td><td><button data-act="adm-supplier-map" data-arg="${x.gid}">查看映射</button></td></tr>`).join('')}</tbody></table></div>
    <div class="card"><h3>组合商品白名单</h3><div class="check"><input type="checkbox" checked disabled><span>gid 1006 组合商品：未确认，首期不上架</span></div><div class="small muted">ProductList/ProductInfo 不返回 gclassType，首期人工白名单；供应商字段增强 TBD-34。</div></div>
    <div class="row"><button class="btn primary" data-act="adm-supplier-save">保存配置</button><button class="btn" data-act="adm-supplier-test">测试连接</button></div>`, 'admin-config');
  return adminShell('ADM-SUPPLIER-01', adminTitle('供应商管理', '维护供应商平台、APPID、gid 映射与组合商品白名单；敏感配置按权限管理。') + form + C('ADM-SUPPLIER-01-C04', RV.state === 'NO_PERM' ? statePanel('NO_PERM') : '', 'admin'));
}
function adminServicePage() {
  const form = C('ADM-SERVICE-01-C03', `<div class="card"><h3>客服配置</h3><div class="field"><label>企业微信链接/账号</label><input class="input" value="Steam商城客服（企业微信）"></div><div class="field"><label>引导文案</label><textarea class="input" rows="3">请提供订单编号，客服将协助核查支付、交付与退款问题。</textarea></div><div class="field"><label>服务时间（未确认留空）</label><input class="input" value="" placeholder="待运营确认（TBD-09）"></div><div class="field"><label>备用二维码说明</label><input class="input" value="无法唤起时，请在微信中搜索企业微信“Steam商城客服”。"></div><div class="small muted">保存即生效并留痕；不承诺未确认的服务时间。</div></div><div class="row"><button class="btn primary" data-act="adm-service-save">保存</button></div>`, 'admin-config');
  return adminShell('ADM-SERVICE-01', adminTitle('客服配置', '统一维护企业微信联系方式、引导文案与已确认服务时间；保存即生效。') + form + C('ADM-SERVICE-01-C04', RV.state === 'NO_PERM' ? statePanel('NO_PERM') : '', 'admin'));
}
function adminAgreementPage() {
  const form = C('ADM-AGREEMENT-01-C03', `<div class="card"><h3>协议正文与版本</h3><dl class="kv"><dt>当前版本</dt><dd>V1.6（生效 2026-10-22）</dd><dt>发布人</dt><dd>管理员</dd><dt>变更类型</dt><dd>普通更新</dd></dl><div class="field"><label>协议正文</label><textarea class="input" rows="8">1. 本商城销售 Steam 口令码与好友赠送服务。
2. 虚拟商品一经履约原则上不退款；系统异常按闭集自动原路退款。
3. 好友赠送每天 8:00～18:00 交付，按自然日累计 2 小时。
4. 支付确认中不代表失败；晚到款按已支付事实优先处理。</textarea></div><label class="check"><input type="checkbox" data-adm-field="substantive"><span>标记为实质性变更（旧未支付单继续支付前需重新确认）</span></label><div class="notice warn">发布后版本号自动生成；普通更新不得误标为实质性变更。实质性变更判定标准由业务/法务确认（TBD-12）。</div><div class="row"><button class="btn" data-act="adm-agreement-preview">预览</button><button class="btn primary" data-act="adm-agreement-publish">发布</button></div></div>`, 'admin-editor');
  return adminShell('ADM-AGREEMENT-01', adminTitle('协议管理', '编辑协议、标记实质性变更、预览并发布；发布即生成版本记录。') + form + C('ADM-AGREEMENT-01-C04', RV.state === 'NO_PERM' ? statePanel('NO_PERM') : '', 'admin'));
}
function adminSearchPage() {
  const form = C('ADM-SEARCH-01-C03', `<div class="card"><h3>搜索发现关键词</h3><div class="row">${DATA.keywords.map((k, i) => `<span class="tag">${esc(k)} <button data-act="adm-keyword-del" data-arg="${i}" style="border:0;background:transparent" aria-label="删除">×</button></span>`).join('')}</div><div class="field mt12"><label>新增关键词</label><input class="input" data-adm-field="newKeyword" placeholder="输入关键词后点击添加"><div class="row mt8"><button class="btn" data-act="adm-keyword-add">添加</button></div></div><div class="small muted">关键词点击执行搜索；空内容前台隐藏。</div></div>
    <div class="card"><h3>热门商品</h3><table class="adm-table"><thead><tr><th>商品</th><th>排序</th><th>状态</th><th>操作</th></tr></thead><tbody>${DATA.hotProducts.map((id, i) => { const p = DATA.productById(id); return `<tr><td>${esc(p.name)}</td><td>${i + 1}</td><td>启用</td><td><button data-act="adm-hot-up" data-arg="${i}">上移</button><button data-act="adm-hot-del" data-arg="${i}">移除</button></td></tr>`; }).join('')}</tbody></table><div class="small muted">热门商品只能从已发布商品选择；不建设实时热榜。</div></div>
    <div class="row"><button class="btn primary" data-act="adm-search-save">保存并生效</button></div>`, 'admin-config');
  return adminShell('ADM-SEARCH-01', adminTitle('搜索推荐', '配置搜索发现关键词与热门商品及排序；保存即生效。') + form + C('ADM-SEARCH-01-C04', RV.state === 'NO_PERM' ? statePanel('NO_PERM') : '', 'admin'));
}
function adminWalletPage() {
  const metrics = adminMetrics([['总额', (DATA.wallet.total / 100).toFixed(2), '元', '供应商钱包快照'], ['可用', (DATA.wallet.available / 100).toFixed(2), '元', '低于阈值将预警'], ['冻结', (DATA.wallet.frozen / 100).toFixed(2), '元', '只读快照'], ['阈值', (DATA.wallet.threshold / 100).toFixed(2), '元', '运营设置']], 'ADM-WALLET-01-C03');
  const form = C('ADM-WALLET-01-C04', `<div class="card"><h3>阈值与充值记录</h3>${DATA.wallet.available < DATA.wallet.threshold ? '<div class="notice err">可用余额低于阈值，请及时在供应商后台充值；口令码商品新订单将停止。</div>' : ''}<div class="field"><label>预警阈值（元）</label><input class="input" data-adm-field="threshold" value="${(DATA.wallet.threshold / 100).toFixed(2)}"><div class="hint">阈值/安全垫由运营确认（TBD-25/TBD-32）。</div></div><div class="field"><label>最近查询</label><input class="input" value="${esc(DATA.wallet.queriedAt)}" readonly></div><div class="row"><button class="btn primary" data-act="adm-wallet-save">保存阈值</button><button class="btn" data-act="adm-wallet-query">重新查询</button><button class="btn" data-act="adm-wallet-recharge">记录充值提示</button></div><div class="small muted mt8">充值在供应商后台完成；商城不建设充值支付。</div></div>
    <div class="card"><h3>充值/异常记录</h3><table class="adm-table"><thead><tr><th>时间</th><th>类型</th><th>金额</th><th>操作人</th><th>结果</th></tr></thead><tbody><tr><td>2026-10-26 16:00</td><td>充值提示</td><td>50,000.00 元</td><td>运营小周</td><td>已记录（供应商后台完成）</td></tr><tr><td>2026-10-27 09:55</td><td>余额预警</td><td>—</td><td>系统</td><td>可用 86,000.00 元，低于阈值</td></tr></tbody></table></div>`, 'admin-config');
  return adminShell('ADM-WALLET-01', adminTitle('钱包余额', '查看供应商钱包总额/可用/冻结，设置预警阈值并记录充值提示；不建设充值支付。') + metrics + form + C('ADM-WALLET-01-C05', RV.state === 'NO_PERM' ? statePanel('NO_PERM') : '', 'admin'));
}
function adminLoginPage() {
  const body = C('ADM-LOGIN-01-C01', `<div class="card" style="max-width:400px;margin:40px auto"><h2 style="font-size:20px;font-weight:500;margin:0 0 4px">运营后台登录</h2><p class="small muted">账号密码登录；连续失败 3 次锁定。</p><div class="field"><label>账号</label><input class="input" data-adm-field="account" value="admin01"></div><div class="field"><label>密码</label><input class="input" type="password" data-adm-field="password" value="demo123"></div>${RV.state === 'ERROR' ? '<div class="errorbox"><b>账号或密码不正确</b><span>请重新输入；连续失败将锁定。</span></div>' : ''}${RV.state === 'LOCKED' ? '<div class="errorbox"><b>尝试次数过多</b><span>请稍后再试。</span></div>' : ''}<button class="btn primary block mt12" data-act="adm-login" ${RV.state === 'LOCKED' ? 'disabled' : ''}>登录</button><div class="tiny muted mt8">管理员 / 运营 / 客服 / 财务角色由权限模块分配。</div></div>`, 'admin-login');
  return `<div class="adm"><div class="adm-work"><div class="adm-body">${body}</div></div></div>`;
}

/* ---------- 后台动作 ---------- */
reg('adm-nav', (pageId) => { RV.pageId = pageId; const p = PAGE_BY_ID[pageId]; RV.state = p ? p.states[0][0] : 'DEFAULT'; RV.sim = 'ok'; renderAll(); });
reg('adm-fold', () => { SESSION.admin.collapsed = !SESSION.admin.collapsed; renderAll(); });
reg('adm-logout', () => { SESSION.admin.loggedIn = false; navigate('ADM-LOGIN-01', 'DEFAULT'); });
reg('adm-login', () => {
  const acct = (SESSION.admin.accountDraft || 'admin01');
  if (RV.state === 'LOCKED') return;
  SESSION.admin.loggedIn = true; SESSION.admin.role = '管理员'; showToast('登录成功'); navigate('ADM-ORDER-01', 'RESULTS');
});
reg('adm-query', () => { const c = rt(RV.pageId); c.committed = { ...c.draft }; c.page = 1; RV.sim = 'ok'; RV.state = 'RESULTS'; renderAll(); });
reg('adm-reset', () => { const c = rt(RV.pageId); c.draft = {}; c.committed = {}; c.page = 1; c.tab = 'all'; c.sel.clear(); RV.sim = 'ok'; RV.state = 'RESULTS'; renderAll(); });
reg('adm-refresh', () => { RV.sim = 'ok'; renderAll(); });
reg('adm-tab', (k) => { const c = rt(RV.pageId); c.tab = k; c.page = 1; c.sel.clear(); renderAll(); });
reg('adm-page', (n) => { const c = rt(RV.pageId); const pages = Math.max(1, Math.ceil(adminPageRows(RV.pageId, ADMIN_CFG[RV.pageId]).length / c.size)); c.page = Math.min(pages, Math.max(1, Number(n))); renderAll(); });
reg('adm-sel', (id) => { const c = rt(RV.pageId); c.sel.has(id) ? c.sel.delete(id) : c.sel.add(id); renderAll(); });
reg('adm-selall', () => {
  const c = rt(RV.pageId); const cfg = ADMIN_CFG[RV.pageId]; const rows = adminPageRows(RV.pageId, cfg);
  const start = (c.page - 1) * c.size; const pageRows = rows.slice(start, start + c.size);
  const all = pageRows.every(r => c.sel.has(cfg.rowKey(r)));
  pageRows.forEach(r => all ? c.sel.delete(cfg.rowKey(r)) : c.sel.add(cfg.rowKey(r)));
  renderAll();
});
reg('adm-clear-sel', () => { rt(RV.pageId).sel.clear(); renderAll(); });
reg('adm-export', () => {
  openConfirm({ title: '导出当前筛选结果？', body: '将按当前筛选与权限生成文件；默认不含完整手机号、实名信息与完整口令码。', obj: '订单/批次导出', ok: '导出', note: '导出操作会记录导出人、时间、筛选条件、字段范围与行数。', act: 'adm-do-export', args: [] });
});
reg('adm-do-export', () => {
  const cfg = ADMIN_CFG[RV.pageId]; const rows = adminPageRows(RV.pageId, cfg);
  const header = cfg.columns.map(c => c.t).join(',');
  const lines = rows.map(r => cfg.columns.map(c => String(r[c.k] == null ? '' : r[c.k]).replace(/,/g, '，')).join(','));
  const blob = new Blob(['﻿' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = RV.pageId + '_export.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast(`导出已生成，共 ${rows.length} 行`);
});
reg('adm-batch-export', () => { const c = rt(RV.pageId); showToast(`已选择 ${c.sel.size} 项；导出任务已生成（当前页范围）`); });
reg('adm-batch-process', () => { const c = rt(RV.pageId); if (!c.sel.size) return showToast('请先选择批次', 'err'); showToast(`已开始处理 ${c.sel.size} 个批次；导出不代表完成`); });
reg('adm-row', (arg) => {
  const [id, action] = String(arg).split('|'); const cfg = ADMIN_CFG[RV.pageId];
  if (RV.pageId === 'ADM-PRODUCT-01' && action === 'publish') return ACTIONS['adm-product-publish'](id);
  if (RV.pageId === 'ADM-PRODUCT-01' && action === 'offline') return ACTIONS['adm-product-offline'](id);
  if (RV.pageId === 'ADM-STOCK-01' && action === 'sync') return showToast('库存同步已发起（模拟）；失败保留上次数据');
  if (RV.pageId === 'ADM-GIFT-01' && action === 'export') return showToast('批次已导出；导出不代表完成');
  if (RV.pageId === 'ADM-CODE-01' && action === 'retry') return openConfirm({ title: '复用原 orderid 重试取码？', body: '将使用同一请求订单号重试；pu006 或超过 24 小时不得重试。', obj: id, ok: '重试', note: '供应商调用会留痕；失败不扣款。', act: 'adm-do-code-retry', args: [id] });
  if (RV.pageId === 'ADM-REFUND-01' && action === 'retry') return openConfirm({ title: '重试退款？', body: '将复用原退款任务标识；不得重复退款。', obj: id, ok: '重试', note: '成功以资金结果为准。', tone: 'danger', act: 'adm-do-refund-retry', args: [id] });
  if (RV.pageId === 'ADM-NOTIFY-01' && action === 'retry') return openConfirm({ title: '授权重试通知？', body: '将向同一收件账号重新发送该事件；已退款或内容替换时不发送旧文案。', obj: id, ok: '重试', act: 'adm-do-notify-retry', args: [id] });
  if (RV.pageId === 'ADM-ORDER-01' && action === 'paycheck') { navigate('ADM-PAYCHECK-01', 'RESULTS'); return; }
  // open drawer
  const c = rt(RV.pageId); c.drawer = id; c.mode = action === 'edit' || action === 'process' || action === 'check' || action === 'perm' ? 'edit' : 'view'; renderAll();
});
reg('adm-close-drawer', () => { rt(RV.pageId).drawer = null; renderAll(); });
reg('adm-drawer-save', () => {
  const page = RV.pageId; const c = rt(page);
  if (page === 'ADM-PRODUCT-01') {
    const row = DATA.candidates.find(x => String(x.gid) === c.drawer);
    if (!row) return;
    const retail = Number($('[data-adm-edit="retail"]')?.value || row.retail);
    if (retail < Math.max(row.cost, row.lowest)) { showToast('零售价低于底价，不能保存/发布', 'err'); return; }
    row.retail = retail; const name = $('[data-adm-edit="name"]')?.value; if (name) row.name = name;
    showToast('商品草稿已保存'); rt(page).drawer = null; renderAll(); return;
  }
  showToast('已保存');
  rt(page).drawer = null; renderAll();
});
reg('adm-order-copy', (id) => writeClipboard(id, '订单号已复制'));
reg('adm-to-paycheck', (id) => { navToPaycheck(id); });
reg('adm-view-code', () => { if (SESSION.admin.role === '客服' || SESSION.admin.role === '运营') { showToast('当前角色无查码权限（需授权）', 'err'); } else { showToast('已记录查码审计；原型不展示完整口令码'); } });
reg('adm-product-publish', (gid) => {
  const row = DATA.candidates.find(x => String(x.gid) === String(gid));
  if (!row) return;
  if (row.retail < Math.max(row.cost, row.lowest)) return showToast('零售价低于底价，不能发布', 'err');
  if (row.combo) return showToast('组合商品首期不上架', 'err');
  openConfirm({ title: '发布该商品？', body: '发布后商品进入首页、搜索和详情；价格与内容将按当前草稿生效。', obj: `${gid} ${row.name}`, ok: '发布', note: '发布记录会写入操作审计；历史订单快照不变。', act: 'adm-do-product-publish', args: [gid] });
});
reg('adm-do-product-publish', (gid) => { const row = DATA.candidates.find(x => String(x.gid) === String(gid)); if (row) { row.status = 'PUBLISHED'; row.selected = true; } showToast('商品已发布'); rt(RV.pageId).drawer = null; renderAll(); });
reg('adm-product-offline', (gid) => openConfirm({ title: '下架该商品？', body: '下架后停止新购；历史订单仍可查看与按规则重试。', obj: gid, ok: '下架', tone: 'danger', act: 'adm-do-product-offline', args: [gid] }));
reg('adm-do-product-offline', (gid) => { const row = DATA.candidates.find(x => String(x.gid) === String(gid)); if (row) row.status = 'DRAFT'; showToast('商品已下架'); rt(RV.pageId).drawer = null; renderAll(); });
reg('adm-product-review', () => showToast('已提交审核（模拟）'));
reg('adm-gift-export', (id) => { showToast(`批次 ${id} 已导出；导出不代表完成`); });
reg('adm-gift-complete', (id) => {
  const evidence = $('[data-adm-edit="evidence"]')?.value?.trim();
  if (!evidence) return showToast('请填写完成确认依据', 'err');
  const row = DATA.gifts.find(x => x.id === id); if (row) row.status = '已完成';
  showToast('批次已标记完成'); rt(RV.pageId).drawer = null; renderAll();
});
reg('adm-gift-exception', (id) => { const row = DATA.gifts.find(x => x.id === id); if (row) row.status = '处理异常'; showToast('已记录异常并转客服'); rt(RV.pageId).drawer = null; renderAll(); });
reg('adm-do-code-retry', (id) => { const row = DATA.deliveries.find(x => x.id === id); if (row) { row.retry++; row.state = '发码中'; } showToast('已复用原 orderid 重试'); renderAll(); });
reg('adm-code-retry', (id) => {
  const row = DATA.deliveries.find(x => x.id === id);
  if (!row) return;
  if (row.error.includes('pu006')) return showToast('pu006 只能查询结果，不能重复请求', 'err');
  if (row.deadline !== '—' && row.deadline < '2026-10-27 10:20') return showToast('已超过 24 小时重试窗口，请转退款/客服', 'err');
  openConfirm({ title: '复用原 orderid 重试？', body: '将使用同一请求订单号向供应商重试；失败不扣款。', obj: id, ok: '重试', act: 'adm-do-code-retry', args: [id] });
});
reg('adm-code-reissue', (id) => { const reason = $('[data-adm-edit="reason"]')?.value?.trim(); if (!reason) return showToast('补发/换码需填写原因', 'err'); showToast('已记录补发/换码并关联原订单'); rt(RV.pageId).drawer = null; renderAll(); });
reg('adm-code-refund', (id) => openConfirm({ title: '转为退款处理？', body: '将生成退款任务；已支付订单不再重复取码。', obj: id, ok: '转退款', tone: 'danger', act: 'adm-do-code-refund', args: [id] }));
reg('adm-do-code-refund', () => { showToast('已生成退款任务'); rt(RV.pageId).drawer = null; renderAll(); });
reg('adm-refund-approve', (id) => { const row = DATA.refunds.find(x => x.id === id); if (row) row.state = '退款中'; showToast('审核通过，进入执行'); renderAll(); });
reg('adm-refund-execute', (id) => {
  if (SESSION.admin.role === '客服') return showToast('当前角色无退款执行权限', 'err');
  openConfirm({ title: '执行退款？', body: '将按原支付渠道退款；成功以资金结果为准。', obj: id, ok: '执行退款', tone: 'danger', note: '单人退款需专项权限并留痕。', act: 'adm-do-refund-execute', args: [id] });
});
reg('adm-do-refund-execute', (id) => { const row = DATA.refunds.find(x => x.id === id); if (row) row.state = RV.sim === 'fail' ? '失败' : '成功'; showToast(RV.sim === 'fail' ? '退款失败：渠道退回失败' : '退款成功，已记录资金结果'); rt(RV.pageId).drawer = null; renderAll(); });
reg('adm-refund-retry', (id) => openConfirm({ title: '重试退款？', body: '复用原退款任务标识，避免重复退款。', obj: id, ok: '重试', tone: 'danger', act: 'adm-do-refund-retry', args: [id] }));
reg('adm-do-refund-retry', (id) => { const row = DATA.refunds.find(x => x.id === id); if (row) row.state = '退款中'; showToast('退款已重新提交'); renderAll(); });
reg('adm-check-paid', (id) => doPaycheck(id, 'PAID'));
reg('adm-check-unpaid', (id) => doPaycheck(id, 'UNPAID'));
reg('adm-check-unknown', (id) => { showToast('仍无法确认，保留支付确认中并升级'); rt(RV.pageId).drawer = null; renderAll(); });
function doPaycheck(id, result) {
  const evidence = $('[data-adm-edit="evidence"]')?.value?.trim();
  if (!evidence) return showToast('请先填写渠道证据，不能仅凭备注定性', 'err');
  const row = DATA.paychecks.find(x => x.id === id); if (row) { row.state = '已定性'; row.evidence = evidence; }
  const order = DATA.orders.find(x => x.id === (row ? row.orderId : ''));
  if (order) { if (result === 'PAID') { order.pay = 'PAID'; order.display = '已支付·发码中'; order.delivery = 'ISSUING'; } else { order.pay = 'CLOSED'; order.display = '已关闭'; } }
  showToast(result === 'PAID' ? '已按渠道证据确认支付，启动交付' : '已确认未支付并关闭订单'); rt(RV.pageId).drawer = null; renderAll();
}
function navToPaycheck(orderId) { navigate('ADM-PAYCHECK-01', 'RESULTS'); }
reg('adm-notify-retry', (id) => {
  const row = DATA.notifications.find(x => x.id === id);
  if (!row) return;
  const order = DATA.orders.find(x => x.id === row.orderId);
  if (order && order.refund === 'REFUNDED') return showToast('订单已退款，不能发送旧成功文案', 'err');
  openConfirm({ title: '授权重试通知？', body: '将向同一收件账号重新发送该事件。', obj: id, ok: '重试', act: 'adm-do-notify-retry', args: [id] });
});
reg('adm-do-notify-retry', (id) => { const row = DATA.notifications.find(x => x.id === id); if (row) { row.state = '平台已受理'; row.retry++; } showToast('通知任务已重新提交'); rt(RV.pageId).drawer = null; renderAll(); });
reg('adm-home-draft', () => showToast('草稿已保存，尚未生效'));
reg('adm-home-preview', () => showToast('预览已打开（模拟）：三端共用同一配置'));
reg('adm-home-publish', () => openConfirm({ title: '发布首页配置？', body: '发布后将对 A/B/C 三端同时生效。', obj: 'home-20261027-02', ok: '发布', note: '发布记录保留版本、发布人、时间与内容摘要。', act: 'adm-do-home-publish', args: [] }));
reg('adm-do-home-publish', () => { showToast('首页配置已发布，三端同时生效'); });
reg('adm-supplier-save', () => { if (SESSION.admin.role !== '管理员') return showToast('仅管理员可修改供应商凭据', 'err'); showToast('供应商配置已保存'); });
reg('adm-supplier-test', () => showToast('连接校验失败：签名示例不一致（模拟）', 'err'));
reg('adm-supplier-map', (gid) => showToast('gid ' + gid + ' 映射已打开（模拟）'));
reg('adm-service-save', () => showToast('客服配置已保存并生效'));
reg('adm-agreement-preview', () => showToast('协议预览已打开（模拟）'));
reg('adm-agreement-publish', () => {
  const substantive = !!$('[data-adm-field="substantive"]')?.checked;
  openConfirm({ title: '发布新协议版本？', body: '发布后新订单使用最新版本；实质性变更将影响旧未支付单继续支付。', obj: substantive ? '实质性变更' : '普通更新', ok: '发布', note: substantive ? '旧未支付单继续支付前必须重新确认并记录新版本。' : '旧未支付单在有效期内沿用创建时版本。', tone: substantive ? 'danger' : 'normal', act: 'adm-do-agreement-publish', args: [substantive] });
});
reg('adm-do-agreement-publish', (substantive) => { SESSION.agreementVersion = 'V1.7'; SESSION.substantiveChange = !!substantive; showToast('协议 V1.7 已发布并生效'); });
reg('adm-search-save', () => showToast('搜索推荐已保存并生效'));
reg('adm-keyword-add', () => { const v = $('[data-adm-field="newKeyword"]')?.value?.trim(); if (!v) return showToast('请输入关键词', 'err'); if (DATA.keywords.includes(v)) return showToast('该关键词已存在', 'err'); DATA.keywords.push(v); showToast('关键词已添加'); renderAll(); });
reg('adm-keyword-del', (i) => { DATA.keywords.splice(Number(i), 1); renderAll(); });
reg('adm-hot-up', (i) => { const n = Number(i); if (n > 0) { [DATA.hotProducts[n - 1], DATA.hotProducts[n]] = [DATA.hotProducts[n], DATA.hotProducts[n - 1]]; renderAll(); } });
reg('adm-hot-del', (i) => { DATA.hotProducts.splice(Number(i), 1); renderAll(); });
reg('adm-wallet-save', () => { const v = Number($('[data-adm-field="threshold"]')?.value || 0); if (!(v > 0)) return showToast('阈值必须大于 0', 'err'); DATA.wallet.threshold = Math.round(v * 100); showToast('阈值已保存并生效'); renderAll(); });
reg('adm-wallet-query', () => showToast(RV.sim === 'fail' ? '余额查询失败，暂按不可用处理' : '余额已刷新（模拟）'));
reg('adm-wallet-recharge', () => showToast('已记录充值提示；实际充值在供应商后台完成'));
reg('adm-rbac-save', (role) => { showToast(`角色 ${role} 权限已保存（模拟）；新会话生效`); rt(RV.pageId).drawer = null; renderAll(); });

Object.assign(R, {
  'ADM-LOGIN-01': adminLoginPage,
  'ADM-HOME-01': adminHomePage,
  'ADM-PRODUCT-01': () => adminList('ADM-PRODUCT-01', ADMIN_CFG['ADM-PRODUCT-01']),
  'ADM-SUPPLIER-01': adminSupplierPage,
  'ADM-STOCK-01': () => adminList('ADM-STOCK-01', ADMIN_CFG['ADM-STOCK-01']),
  'ADM-ORDER-01': () => adminList('ADM-ORDER-01', ADMIN_CFG['ADM-ORDER-01']),
  'ADM-GIFT-01': () => adminList('ADM-GIFT-01', ADMIN_CFG['ADM-GIFT-01']),
  'ADM-CODE-01': () => adminList('ADM-CODE-01', ADMIN_CFG['ADM-CODE-01']),
  'ADM-REFUND-01': () => adminList('ADM-REFUND-01', ADMIN_CFG['ADM-REFUND-01']),
  'ADM-SERVICE-01': adminServicePage,
  'ADM-RBAC-01': () => adminList('ADM-RBAC-01', ADMIN_CFG['ADM-RBAC-01']),
  'ADM-AUDIT-01': () => adminList('ADM-AUDIT-01', ADMIN_CFG['ADM-AUDIT-01']),
  'ADM-AGREEMENT-01': adminAgreementPage,
  'ADM-SEARCH-01': adminSearchPage,
  'ADM-PAYCHECK-01': () => adminList('ADM-PAYCHECK-01', ADMIN_CFG['ADM-PAYCHECK-01']),
  'ADM-NOTIFY-01': () => adminList('ADM-NOTIFY-01', ADMIN_CFG['ADM-NOTIFY-01']),
  'ADM-WALLET-01': adminWalletPage
});


/* ================= 评审外壳、文档阅读器、图示与初始化 ================= */
const STATE_LABEL = (page, code) => (page.states.find(s => s[0] === code) || [code, code])[1];
const SIM_LABEL = { ok: '正常', fail: '失败', timeout: '超时/未知', empty: '空数据' };

function mdInline(s) {
  let h = esc(s);
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text, url) => {
    if (/^https?:/i.test(url)) return `<a href="${esc(url)}" target="_blank" rel="noopener">${text}</a>`;
    return `<span class="link" data-doc-link="${esc(url)}">${text}</span>`;
  });
  return h;
}
function extractToc(md) {
  const out = [];
  let inCode = false;
  for (const line of String(md).split(/\r?\n/)) {
    if (/^```/.test(line)) { inCode = !inCode; continue; }
    if (inCode) continue;
    const m = line.match(/^(#{1,4})\s+(.+)/);
    if (m) out.push({ level: m[1].length, text: m[2].trim(), id: 'h-' + out.length });
  }
  return out;
}
function mdToHtml(md) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0, hCount = 0, pendingDiagram = null, para = [];
  const flush = () => { if (para.length) { out.push(`<p>${mdInline(para.join(' '))}</p>`); para = []; } };
  while (i < lines.length) {
    let line = lines[i];
    if (/^<!--\s*DIAGRAM:([\w-]+)\s*-->/.test(line)) { pendingDiagram = line.match(/DIAGRAM:([\w-]+)/)[1]; i++; continue; }
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      flush();
      const lang = fence[1]; let buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      if (lang === 'plantuml' && pendingDiagram) {
        const d = DIAGRAMS.find(x => x.id === pendingDiagram);
        out.push(d ? `<div class="doc-diagram" data-diagram="${d.id}">${d.svg}</div>` : `<div class="empty">该图未内嵌 SVG，请查看图源（${esc(pendingDiagram)}）</div>`);
        pendingDiagram = null;
      } else {
        out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
      }
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.+)/);
    if (h) { flush(); out.push(`<h${h[1].length} id="h-${hCount++}">${mdInline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      flush();
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = rows.map(r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
      const head = cells[0]; const body = cells.slice(2);
      out.push(`<table><thead><tr>${head.map(c => `<th>${mdInline(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${mdInline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    if (/^\s*([-*])\s+/.test(line)) {
      flush(); const items = [];
      while (i < lines.length && /^\s*([-*])\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++; }
      out.push(`<ul>${items.map(x => `<li>${mdInline(x)}</li>`).join('')}</ul>`); continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      flush(); const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++; }
      out.push(`<ol>${items.map(x => `<li>${mdInline(x)}</li>`).join('')}</ol>`); continue;
    }
    if (/^>\s?/.test(line)) {
      flush(); const items = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { items.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote>${mdInline(items.join(' '))}</blockquote>`); continue;
    }
    if (/^\s*---+\s*$/.test(line)) { flush(); out.push('<hr>'); i++; continue; }
    if (/^\s*$/.test(line)) { flush(); i++; continue; }
    para.push(line.trim()); i++;
  }
  flush();
  return out.join('\n');
}

function renderAll() {
  if (!PAGE_BY_ID[RV.pageId] || PAGE_BY_ID[RV.pageId].end !== RV.end) {
    const first = PAGES.find(p => p.end === RV.end) || PAGES[0];
    RV.end = first.end; RV.pageId = first.id; RV.state = first.states[0][0]; RV.selectedComponent = null;
  }
  const page = PAGE_BY_ID[RV.pageId];
  if (!page.states.some(s => s[0] === RV.state)) RV.state = page.states[0][0];
  // controls
  const endSel = $('#endSel');
  if (endSel) endSel.value = RV.end;
  const pageSel = $('#pageSel');
  if (pageSel) {
    pageSel.innerHTML = PAGES.filter(p => p.end === RV.end).map(p => `<option value="${p.id}" ${p.id === RV.pageId ? 'selected' : ''}>${p.id} ${p.name}</option>`).join('');
  }
  const stateSel = $('#stateSel');
  if (stateSel) stateSel.innerHTML = page.states.map(s => `<option value="${s[0]}" ${s[0] === RV.state ? 'selected' : ''}>${s[0]} ${s[1]}</option>`).join('');
  const simSel = $('#simSel'); if (simSel) simSel.value = RV.sim;
  // business controls
  const map = {
    bizLogin: SESSION.loggedIn ? 'yes' : 'no',
    bizReal: SESSION.realName,
    bizPhone: SESSION.phoneBound ? 'yes' : 'no',
    bizAgreement: SESSION.substantiveChange ? 'substantive' : SESSION.agreementAccepted ? 'yes' : 'no',
    bizStock: SESSION.conditions.stock,
    bizBalance: SESSION.conditions.balance,
    bizOrder: SESSION.conditions.order,
    bizPlatform: SESSION.platform,
    bizRole: SESSION.admin.role
  };
  for (const [id, v] of Object.entries(map)) { const el = $('#' + id); if (el) el.value = v; }
  // canvas
  const main = $('.rv-main'); if (main) main.className = 'rv-main' + (RV.end === 'APP' ? '' : ' wide');
  const canvas = $('#canvas');
  const renderer = R[RV.pageId];
  let html = '';
  try { html = renderer ? renderer() : `<div class="errorbox"><b>页面渲染器缺失</b><span>${esc(RV.pageId)}</span></div>`; }
  catch (e) { console.error(e); html = `<div class="errorbox"><b>页面渲染异常</b><span>${esc(e.message)}</span></div>`; }
  canvas.className = 'rv-canvas ' + (RV.end === 'ADM' ? 'admin' : RV.end === 'WEB' ? 'web' : 'mobile');
  canvas.innerHTML = html;
  // selected component outline
  if (RV.outline && RV.selectedComponent) {
    const el = canvas.querySelector(`[data-component="${CSS.escape(RV.selectedComponent)}"]`);
    if (el) el.style.outline = '2px dashed #525252';
  }
  // status block
  const dataSource = RV.end === 'ADM' ? '本地内存模拟数据；无后台业务埋点' : '本地模拟数据；未接入真实平台/支付/供应商';
  const next = RV.state.includes('ERROR') ? '检查失败原因，重试或切换模拟结果' : RV.state === 'DEFAULT' || RV.state === 'RESULTS' ? '执行页面主操作；可切换组件查看十节说明' : '按状态预设观察界面；真实主链请从对应页面操作进入';
  const status = $('#statusBlock');
  if (status) status.innerHTML = `<span><b>页面</b> ${esc(page.name)}（${esc(page.id)}）</span><span><b>状态</b> ${esc(RV.state)} ${esc(STATE_LABEL(page, RV.state))}</span><span><b>模拟</b> ${esc(SIM_LABEL[RV.sim] || RV.sim)}</span><span><b>数据来源</b> ${esc(dataSource)}</span><span><b>下一步</b> ${esc(next)}</span>${page.note ? `<span><b>说明</b> ${esc(page.note)}</span>` : ''}`;
  // component selector
  const insts = INSTANCES.filter(x => x.page === RV.pageId);
  if (!RV.selectedComponent || !insts.some(x => x.id === RV.selectedComponent)) RV.selectedComponent = insts[0] ? insts[0].id : null;
  const sel = $('#compSel');
  if (sel) sel.innerHTML = insts.map(x => `<option value="${x.id}" ${x.id === RV.selectedComponent ? 'selected' : ''}>${x.name}（${x.id}）</option>`).join('');
  renderComponentDoc();
  // footer lists
  renderFooter();
}

function renderComponentDoc() {
  const box = $('#compDoc');
  if (!box) return;
  const inst = INSTANCE_BY_ID[RV.selectedComponent];
  if (!inst) { box.innerHTML = '<div class="empty">当前页面没有已登记组件。</div>'; return; }
  const doc = COMP_DOCS[inst.def];
  if (!doc) { box.innerHTML = `<div class="errorbox"><b>组件说明缺失</b><span>${esc(inst.def)} 未在 03 中找到十节。</span></div>`; return; }
  const page = PAGE_BY_ID[inst.page];
  const sections = (doc.sections || []).map(s => `<h3>${s.n}. ${esc(s.title)}</h3>${mdToHtml(s.md)}`).join('');
  box.innerHTML = `<h2 style="font-size:16px;margin:0 0 4px">${esc(inst.name)}</h2>
    <p class="small muted" style="margin:0 0 8px">实例 ${esc(inst.id)} · 页面 ${esc(page ? page.name : inst.page)} · 区域 ${esc(inst.region)} · 变体 ${esc(inst.variant)}</p>
    <div class="notice">共享定义：${esc(inst.def)} · 模式 ${esc(inst.mode)} · uiProfile ${esc(PROFILE.uiProfileId)} / ${esc(PROFILE.uiProfileHash.slice(0, 12))}…</div>
    <div class="doc">${sections}</div>`;
}

function renderFooter() {
  const dg = $('#diagramEntries');
  if (dg && !dg.dataset.ready) {
    const groups = [['FL', '业务流程'], ['SM', '状态机'], ['SEQ', '时序']];
    dg.innerHTML = groups.map(([pre, label]) => DIAGRAMS.filter(d => d.id.startsWith(pre)).map(d => `<button class="rv-entry" data-act="open-diagram" data-arg="${d.id}"><span class="tag">${label}</span>${esc(d.id)} ${esc(d.title)}</button>`).join('')).join('');
    dg.dataset.ready = '1';
  }
  const de = $('#docEntries');
  if (de && !de.dataset.ready) {
    de.innerHTML = DOCS.map(d => `<div class="doc-entry"><button class="rv-entry doc-open" data-act="open-reader" data-arg="${d.file}"><span class="tag">MD</span>${esc(d.file.replace('.md', ''))}</button><button class="rv-btn doc-dl" data-act="download-doc" data-arg="${d.file}">下载</button></div>`).join('');
    de.dataset.ready = '1';
  }
}

/* ---------- 阅读器 ---------- */
function openReader(file) {
  RV.readerOpen = true;
  if (RV.readerDoc && RV.readerDoc !== file) RV.readerHist.push(RV.readerDoc);
  RV.readerDoc = file || (DOCS[0] && DOCS[0].file);
  renderReader();
  $('#reader').classList.add('open');
  setTimeout(() => $('#reader').querySelector('[data-act="reader-close"]')?.focus(), 20);
}
function closeReader() { RV.readerOpen = false; $('#reader').classList.remove('open'); }
function renderReader() {
  const doc = DOCS.find(d => d.file === RV.readerDoc) || DOCS[0];
  if (!doc) { $('#reader').innerHTML = '<div class="reader-box"><div class="empty">未内嵌文档</div></div>'; return; }
  const toc = extractToc(doc.md);
  $('#reader').innerHTML = `<div class="reader-box" role="dialog" aria-modal="true" aria-label="完整交付文件阅读器">
    <div class="reader-head"><h3>${esc(doc.title)} <span class="tiny muted">${esc(doc.file)} · ${esc(doc.ver || '')} / ${esc(doc.batch || '')}</span></h3>
      <button class="rv-btn" data-act="reader-back" ${RV.readerHist.length ? '' : 'disabled'}>返回上一文档</button>
      <button class="rv-btn" data-act="reader-download">下载 MD</button>
      <button class="icon-btn" data-act="reader-close" aria-label="关闭">${ico('close')}</button></div>
    <div class="reader-main"><div class="reader-side">${DOCS.map(d => `<button data-act="reader-doc" data-arg="${d.file}" aria-current="${d.file === doc.file}">${esc(d.file.replace('.md', ''))}<br><span class="tiny muted">${esc(d.title)}</span></button>`).join('')}</div>
      <div class="reader-content"><div class="reader-toc"><b>目录</b>${toc.map(t => `<button data-act="reader-scroll" data-arg="${t.id}" style="padding-left:${(t.level - 1) * 10}px">${esc(t.text)}</button>`).join('')}</div><div class="doc" id="readerDocBody">${mdToHtml(doc.md)}</div></div></div></div>`;
}
function downloadDoc(file) {
  const doc = DOCS.find(d => d.file === (file || RV.readerDoc));
  if (!doc) return;
  const blob = new Blob([doc.md], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = doc.file; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- 图示 ---------- */
function openDiagram(id) {
  RV.diagramOpen = true; RV.diagramId = id; RV.diagramZoom = 'fit';
  renderDiagram(); $('#diagramViewer').classList.add('open');
  setTimeout(() => $('#diagramViewer').querySelector('[data-act="dv-close"]')?.focus(), 20);
}
function closeDiagram() { RV.diagramOpen = false; $('#diagramViewer').classList.remove('open'); }
function renderDiagram() {
  const d = DIAGRAMS.find(x => x.id === RV.diagramId) || DIAGRAMS[0];
  if (!d) { $('#diagramViewer').innerHTML = '<div class="dv-box"><div class="empty">暂无图示</div></div>'; return; }
  $('#diagramViewer').innerHTML = `<div class="dv-box" role="dialog" aria-modal="true" aria-label="图示查看">
    <div class="dv-head"><h3>${esc(d.id)} ${esc(d.title)}</h3><button class="rv-btn" data-act="dv-zoom" data-arg="fit" aria-pressed="${RV.diagramZoom === 'fit'}">适应宽度</button><button class="rv-btn" data-act="dv-zoom" data-arg="100">100%</button><button class="rv-btn" data-act="dv-zoom" data-arg="200">200%</button><button class="rv-btn" data-act="dv-source">图源</button><button class="icon-btn" data-act="dv-close" aria-label="关闭">${ico('close')}</button></div>
    <div class="dv-body" id="dvBody">${d.svg}</div>
    <div class="dv-src hidden" id="dvSrc"><pre>${esc(d.src)}</pre></div></div>`;
  applyDiagramZoom();
}
function applyDiagramZoom() {
  const body = $('#dvBody'); if (!body) return;
  const svg = body.querySelector('svg'); if (!svg) return;
  if (RV.diagramZoom === 'fit') { svg.style.width = '100%'; svg.style.height = 'auto'; }
  else { const w = Number(RV.diagramZoom); svg.style.width = (svg.viewBox?.baseVal?.width ? svg.viewBox.baseVal.width * w / 100 : 800 * w / 100) + 'px'; svg.style.height = 'auto'; }
}

/* ---------- 事件 ---------- */
function bindShell() {
  $('#endSel')?.addEventListener('change', e => {
    RV.end = e.target.value; const first = PAGES.find(p => p.end === RV.end); RV.pageId = first.id; RV.state = first.states[0][0]; RV.selectedComponent = null; renderAll();
  });
  $('#pageSel')?.addEventListener('change', e => { RV.pageId = e.target.value; const p = PAGE_BY_ID[RV.pageId]; RV.state = p.states[0][0]; RV.selectedComponent = null; renderAll(); });
  $('#stateSel')?.addEventListener('change', e => { RV.state = e.target.value; renderAll(); });
  $('#simSel')?.addEventListener('change', e => { RV.sim = e.target.value; renderAll(); });
  $('#compSel')?.addEventListener('change', e => { RV.selectedComponent = e.target.value; renderAll(); });
  $('#outlineBtn')?.addEventListener('click', () => { RV.outline = !RV.outline; $('#outlineBtn').setAttribute('aria-pressed', String(RV.outline)); renderAll(); });
  $('#resetBtn')?.addEventListener('click', () => location.reload());
  const biz = {
    bizLogin: v => { SESSION.loggedIn = v === 'yes'; },
    bizReal: v => { SESSION.realName = v; },
    bizPhone: v => { SESSION.phoneBound = v === 'yes'; },
    bizAgreement: v => { SESSION.agreementAccepted = v !== 'no'; SESSION.substantiveChange = v === 'substantive'; SESSION.buy.agreement = v !== 'no'; },
    bizStock: v => { SESSION.conditions.stock = v; },
    bizBalance: v => { SESSION.conditions.balance = v; },
    bizOrder: v => { SESSION.conditions.order = v; },
    bizPlatform: v => { SESSION.platform = v; },
    bizRole: v => { SESSION.admin.role = v; }
  };
  for (const [id, fn] of Object.entries(biz)) $('#' + id)?.addEventListener('change', e => { fn(e.target.value); renderAll(); });

  document.addEventListener('click', (e) => {
    const comp = e.target.closest('[data-component]');
    if (RV.outline && comp && !e.target.closest('[data-act]')) {
      e.preventDefault(); RV.selectedComponent = comp.getAttribute('data-component'); renderAll(); return;
    }
    const actEl = e.target.closest('[data-act]');
    if (actEl) {
      const act = actEl.getAttribute('data-act');
      const arg = actEl.getAttribute('data-arg');
      if (act === 'confirm-ok') { e.preventDefault(); confirmOk(); return; }
      if (act === 'close-modal') { e.preventDefault(); closeModal(); return; }
      if (ACTIONS[act]) {
        e.preventDefault();
        try { ACTIONS[act](arg); } catch (err) { console.error(err); showToast('动作执行失败：' + err.message, 'err'); }
        return;
      }
      // reader/diagram actions
      if (act === 'open-reader') return openReader(arg);
      if (act === 'reader-close') return closeReader();
      if (act === 'reader-doc') return openReader(arg);
      if (act === 'reader-back') { const prev = RV.readerHist.pop(); if (prev) { RV.readerDoc = prev; renderReader(); } return; }
      if (act === 'download-doc') return downloadDoc(arg);
      if (act === 'reader-download') return downloadDoc();
      if (act === 'reader-scroll') { const el = $('#' + arg); if (el) el.scrollIntoView({ block: 'start' }); return; }
      if (act === 'open-diagram') return openDiagram(arg);
      if (act === 'dv-close') return closeDiagram();
      if (act === 'dv-zoom') { RV.diagramZoom = arg; renderDiagram(); return; }
      if (act === 'dv-source') { $('#dvSrc')?.classList.toggle('hidden'); return; }
      return;
    }
    // mask close
    const mask = e.target.closest('[data-mask-act]');
    if (mask && e.target === mask) {
      const act = mask.getAttribute('data-mask-act');
      if (act === 'close-buy') return ACTIONS['close-buy']();
      if (act === 'close-notice') return ACTIONS['close-notice']();
      if (act === 'close-notice-buy') return ACTIONS['close-notice-buy']();
      if (act === 'close-realname') return ACTIONS['close-realname']();
      if (act === 'close-payret') return ACTIONS['close-payret']();
      if (act === 'close-payscan') return ACTIONS['close-payscan']();
      if (act === 'adm-close-drawer') return ACTIONS['adm-close-drawer']();
    }
    // doc links
    const link = e.target.closest('[data-doc-link]');
    if (link) { const f = link.getAttribute('data-doc-link').split('#')[0]; if (DOCS.some(d => d.file === f || d.file.startsWith(f.replace(/^\.\//, '')))) openReader(DOCS.find(d => d.file === f || d.file.startsWith(f.replace(/^\.\//, ''))).file); }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-field]')) {
      const k = t.getAttribute('data-field');
      if (k === 'searchDraft') SESSION.search.draft = t.value;
      else if (k === 'friendLink') SESSION.buy.friendLink = t.value;
      else if (k === 'phone') SESSION.phoneDraft = t.value;
      else if (k === 'smsCode') SESSION.smsCode = t.value;
      else if (k === 'agreement') SESSION.buy.agreement = t.checked;
      else if (k === 'privacy') SESSION.privacyAccepted = t.checked;
    }
    if (t.matches('[data-adm-field]')) {
      const c = rt(RV.pageId); c.draft[t.getAttribute('data-adm-field')] = t.type === 'checkbox' ? t.checked : t.value;
      if (t.getAttribute('data-adm-field') === 'account') SESSION.admin.accountDraft = t.value;
    }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-field="agreement"]')) SESSION.buy.agreement = t.checked;
    if (t.matches('[data-field="privacy"]')) SESSION.privacyAccepted = t.checked;
    if (t.matches('[data-adm-size]')) { const c = rt(RV.pageId); c.size = Number(t.value); c.page = 1; renderAll(); }
    if (t.matches('[data-adm-field]')) { const c = rt(RV.pageId); c.draft[t.getAttribute('data-adm-field')] = t.type === 'checkbox' ? t.checked : t.value; }
    if (t.matches('[data-adm-menu-search]')) {
      const q = t.value.trim();
      $$('.adm-item').forEach(b => { b.style.display = !q || b.textContent.includes(q) ? '' : 'none'; });
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (RV.readerOpen) { closeReader(); return; }
      if (RV.diagramOpen) { closeDiagram(); return; }
      if ($('#modalHost').classList.contains('open')) { closeModal(); return; }
    }
    if (e.key === 'Enter' && e.target.id === 'searchInput') { e.preventDefault(); ACTIONS['search-submit'](); }
  });
}

function init() {
  bindShell();
  renderAll();
}
document.addEventListener('DOMContentLoaded', init);
