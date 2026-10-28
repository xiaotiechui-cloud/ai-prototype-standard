
var AGREE_SEL = null;   // 协议富文本最近一次选区（CHG-0089）
/* ============================================================
   页面注册表（与 01_页面与状态说明.md 第2节、第6.2节同源）
   ============================================================ */
const PAGES = [
  /* ---------- APP ---------- */
  { id: 'APP-HOME-01', end: 'APP', name: '商城首页', render: rHome, note: '免登录浏览：首页banner、排序、双列商品卡片。',
    states: [['RESULTS', '默认（有商品）'], ['LOADING', '加载中'], ['EMPTY', '无配置'], ['ERROR', '加载失败'], ['NOTICE', '叠加首次进入实名提醒']] },
  { id: 'APP-NOTICE-01', end: 'APP', name: '首次进入实名提醒', render: rNotice, note: '弹层页面：按实名状态展示主按钮与两种关闭方式。',
    states: [['UNVERIFIED', '未实名（前往认证）'], ['VERIFIED', '已实名（知道了）'], ['MINOR', '已实名未成年'], ['UNKNOWN', '未登录/状态未知（待评审）']] },
  { id: 'APP-SEARCH-01', end: 'APP', name: '搜索默认页', render: rSearchHome, note: '搜索输入、搜索发现、热门商品；联想为候选能力未启用。',
    states: [['DEFAULT', '默认'], ['EDITING', '输入中'], ['EMPTY', '内容为空'], ['ERROR', '加载失败']] },
  { id: 'APP-SEARCH-02', end: 'APP', name: '搜索结果页', render: rSearchResult, note: '结果、排序、继续加载、无结果与失败恢复。',
    states: [['RESULTS', '有结果'], ['LOADING', '查询中'], ['EMPTY', '无结果'], ['ERROR', '请求失败'], ['END', '已到末页']] },
  { id: 'APP-PRODUCT-01', end: 'APP', name: '商品详情', render: rProduct, note: '图片/视频轮播—名称价格—游戏介绍—硬件配置—商品须知—底部购买。（CHG-0072 起不再有 Steam 限制与交付说明两块）',
    states: [['DEFAULT', '可售'], ['PARTIAL', '资料部分缺失'], ['UNAVAILABLE', '已下架/售罄'], ['PENDING_ORDER', '订单处理中'], ['EXPANDED', '介绍展开'], ['ERROR', '加载失败'], ['PANEL', '叠加购买面板']] },
  { id: 'APP-PANEL-01', end: 'APP', name: '购买面板', render: rProduct, note: '底部面板：选择版本（含 CDK 说明入口）、发货方式、好友链接（赠送时）、支付方式、协议、购买按钮。',
    states: [['PANEL', '面板打开'], ['PANEL_AGREE', '叠加购买须知弹窗'], ['CDK_HELP', '叠加 CDK 购买说明弹层']] },
  { id: 'APP-AUTH-01', end: 'APP', name: '实名说明弹层', render: rAuth, note: '购买校验发现未实名时展示；暂不认证 / 去认证。', states: [['SHOWN', '弹层展示']] },
  { id: 'APP-AGREEMENT-01', end: 'APP', name: '购买协议查看', render: rAgreement, note: '协议正文、版本与生效日期；仅查看与返回。',
    states: [['DEFAULT', '正文'], ['ERROR', '加载失败'], ['STALE', '版本已更新']] },
  { id: 'APP-PHONE-01', end: 'APP', name: '绑定手机号', render: rPhone, note: '商城账号主动绑定手机号：短信验证码校验；购买流程与「我的」均可进入。',
    states: [['DEFAULT', '填写手机号'], ['CODE_SENT', '验证码已发送'], ['ERROR', '校验失败'], ['BOUND', '已绑定']] },
  { id: 'APP-LOGIN-01', end: 'APP', name: '手机号登录/注册', render: rLogin, note: '独立手机号账号：60 秒短信频率、隐私政策勾选、无图形验证码；平台账号与手机号账号不合并。',
    states: [['DEFAULT', '输入手机号'], ['CODE_SENT', '验证码已发送'], ['ERROR', '校验失败']] },
  { id: 'APP-REALNAME-01', end: 'APP', name: '实名认证', render: rRealname, note: '独立手机号账号首次购买前完成实名；原型模拟核验，不调用真实服务商。',
    states: [['FORM', '填写信息'], ['SUBMITTING', '核验中'], ['FAILED', '核验失败'], ['MINOR', '未成年结果']] },
  { id: 'APP-REALNAME-02', end: 'APP', name: '实名认证结果', render: rRealnameResult, note: '仅展示认证结果：成年人/未成年人；左上角返回来源页。',
    states: [['SUCCESS', '成年人'], ['MINOR', '未成年人']] },
  { id: 'APP-PRIVACY-01', end: 'APP', name: '隐私政策', render: rPrivacy, note: '登录与实名前需勾选；正式文本由法务提供，原型为占位。',
    states: [['DEFAULT', '正文']] },
  { id: 'APP-CHECKOUT-01', end: 'APP', name: '确认订单', render: rCheckout, note: '未支付返回与继续支付共用；30 分钟内有效，不展示倒计时；下单价格锁定。',
    states: [['DEFAULT', '待支付'], ['SHOWN', '订单有效期'], ['READONLY', '已付款只读'], ['EXPIRED', '订单已关闭'], ['SUBMITTING', '提交中'], ['ERROR', '读取失败']] },
  { id: 'APP-PAYRET-01', end: 'APP', name: '支付返回确认', render: rPayret, note: '双选项均触发接口查询，不修改订单状态。',
    states: [['SHOWN', '询问弹窗'], ['QUERYING', '查询中'], ['TIMEOUT', '查询无结论']] },
  { id: 'APP-RESULT-01', end: 'APP', name: '支付与交付结果页', render: rResult, note: '支付与交付状态分别展示；含支付确认中、支付失败、订单关闭、晚到款。',
    states: [['DELIVERED', '口令码已交付'], ['ISSUING', '发码中'], ['EXCEPTION', '交付异常'], ['PAY_CONFIRMING', '支付确认中'], ['PAY_FAILED', '支付失败/取消'], ['ORDER_CLOSED', '订单已关闭'], ['LATE_PAY', '晚到款处理中'], ['GIFT_PENDING', '赠送待处理'], ['GIFT_PROCESSING', '赠送处理中'], ['GIFT_DONE', '赠送已完成'], ['GIFT_EXCEPTION', '赠送异常'], ['ERROR', '读取失败']] },
  { id: 'APP-ORDER-01', end: 'APP', name: '我的订单', render: rOrder, note: '仅当前商城身份订单；状态页签、空态、登录失效。',
    states: [['RESULTS', '有订单'], ['LOADING', '加载中'], ['EMPTY', '无订单'], ['ERROR', '请求失败'], ['SESSION_EXPIRED', '登录失效']] },
  { id: 'APP-ORDER-02', end: 'APP', name: '订单详情', render: rOrderDetail, note: '支付/交付/售后分列，口令码与赠送结果。',
    states: [['DEFAULT', '已交付'], ['CODE_ISSUING', '发码中'], ['CODE_EXCEPTION', '交付异常'], ['REPLACED', '已补发'], ['GIFT', '赠送待处理'], ['ERROR', '读取失败']] },
  { id: 'APP-MINE-01', end: 'APP', name: '我的', render: rMine, note: '账号、资格状态（脱敏）、订单与客服入口。',
    states: [['LOGGED_IN', '已登录'], ['GUEST', '未登录'], ['UNKNOWN', '状态未知']] },
  { id: 'APP-SERVICE-01', end: 'APP', name: '企业微信客服', render: rService, note: '客服入口、订单号复制与无法唤起时的备用提示。',
    states: [['WITH_ORDER', '带订单号'], ['NO_ORDER', '不带订单号'], ['FALLBACK', '无法唤起']] },
  { id: 'APP-CONTAINER-01', end: 'APP', name: '容器异常提示', render: rContainer, note: '设计建议，待评审（PRD 2.3）。', states: [['EXTERNAL', '外部容器']] },

  /* ---------- WEB ---------- */
  { id: 'WEB-HOME-01', end: 'WEB', name: '首页（PC 多列）', render: rWebHome, note: '宽屏多列，规则与移动端一致。布局为设计建议。',
    states: [['RESULTS', '默认'], ['EMPTY', '无配置'], ['ERROR', '加载失败']] },
  { id: 'WEB-SEARCH-01', end: 'WEB', name: '搜索与结果', render: rWebSearch, note: '默认态与结果态同页切换，含分页。',
    states: [['DEFAULT', '默认态'], ['RESULTS', '有结果'], ['EMPTY', '无结果'], ['ERROR', '请求失败']] },
  { id: 'WEB-PRODUCT-01', end: 'WEB', name: '商品详情（PC 分栏）', render: rWebProduct, note: '左资料右购买卡，弹层承接购买面板。',
    states: [['DEFAULT', '可售'], ['EXPANDED', '介绍展开'], ['UNAVAILABLE', '已下架'], ['PENDING_ORDER', '订单处理中']] },
  { id: 'WEB-CHECKOUT-01', end: 'WEB', name: '确认订单（PC 分栏）', render: rWebCheckout, note: '明细与结算分栏；PC 收银台/扫码说明；30 分钟关闭。',
    states: [['DEFAULT', '待支付'], ['QR_WAIT', '收银台·待扫码'], ['QR_CONFIRMING', '收银台·支付确认中'], ['QR_SUCCESS', '收银台·支付成功'], ['EXPIRED', '订单已关闭'], ['SUBMITTING', '提交中'], ['ERROR', '读取失败']] },
  { id: 'WEB-PAYRET-01', end: 'WEB', name: '支付返回确认（居中弹窗）', render: rWebPayret, note: '同 APP 双选项查询逻辑。',
    states: [['SHOWN', '询问弹窗'], ['QUERYING', '查询中']] },
  { id: 'WEB-RESULT-01', end: 'WEB', name: '支付与交付结果页（PC）', render: rWebResult, note: '同 APP 内容与规则；含支付确认中、失败、关闭、晚到款。',
    states: [['DELIVERED', '已交付'], ['ISSUING', '发码中'], ['EXCEPTION', '交付异常'], ['PAY_CONFIRMING', '支付确认中'], ['PAY_FAILED', '支付失败/取消'], ['ORDER_CLOSED', '订单已关闭'], ['LATE_PAY', '晚到款处理中'], ['GIFT_PENDING', '赠送待处理'], ['ERROR', '读取失败']] },
  { id: 'WEB-ORDER-01', end: 'WEB', name: '我的订单（PC）', render: rWebOrder, note: '桌面列表与详情抽屉。',
    states: [['RESULTS', '有订单'], ['EMPTY', '无匹配'], ['ERROR', '请求失败'], ['SESSION_EXPIRED', '登录失效'], ['DRAWER', '详情抽屉']] },
  { id: 'WEB-MINE-01', end: 'WEB', name: '我的（PC）', render: rWebMine, note: '账号与资格状态、订单与客服入口。',
    states: [['LOGGED_IN', '已登录'], ['GUEST', '未登录'], ['UNKNOWN', '状态未知']] },
  { id: 'WEB-LOGIN-01', end: 'WEB', name: '手机号登录/注册（PC）', render: rWebLogin, note: '独立手机号账号 PC 端：60 秒短信、隐私政策勾选、平台账号不合并。',
    states: [['DEFAULT', '输入手机号'], ['CODE_SENT', '验证码已发送'], ['ERROR', '校验失败']] },
  { id: 'WEB-PHONE-01', end: 'WEB', name: '绑定手机号（PC）', render: rWebPhone, note: 'PC 端商城账号主动绑定手机号；购买流程与「我的」均可进入。',
    states: [['DEFAULT', '填写手机号'], ['CODE_SENT', '验证码已发送'], ['ERROR', '校验失败'], ['BOUND', '已绑定']] },
  { id: 'WEB-REALNAME-01', end: 'WEB', name: '实名认证（PC）', render: rWebRealname, note: '独立手机号账号首次购买前实名；原型模拟核验。',
    states: [['FORM', '填写信息'], ['SUBMITTING', '核验中'], ['FAILED', '核验失败'], ['MINOR', '未成年结果']] },
  { id: 'WEB-REALNAME-02', end: 'WEB', name: '实名认证结果（PC）', render: rWebRealnameResult, note: '仅展示认证结果：成年人/未成年人；左上角返回来源页。',
    states: [['SUCCESS', '成年人'], ['MINOR', '未成年人']] },

  /* ---------- ADM ---------- */
  { id: 'ADM-LOGIN-01', end: 'ADM', name: '后台登录', render: renderAdmin, note: '账号密码登录，失败就地反馈。', states: [['DEFAULT', '默认'], ['ERROR', '登录失败']] },
  { id: 'ADM-HOME-01', end: 'ADM', name: '首页配置管理', render: renderAdmin, note: 'ADM-01', states: [['RESULTS', '有记录'], ['EMPTY', '无数据（异常）'], ['ERROR', '读取失败'], ['DRAWER', '编辑抽屉']] },
  { id: 'ADM-GOODS-01', end: 'ADM', name: '商品管理', render: renderAdmin, note: 'ADM-02', states: [['RESULTS', '有记录'], ['EMPTY', '无匹配'], ['ERROR', '查询失败'], ['DRAWER', '编辑抽屉']] },
  { id: 'ADM-STOCK-01', end: 'ADM', name: '可售库存', render: renderAdmin, note: 'ADM-04', states: [['RESULTS', '有记录'], ['EMPTY', '无匹配'], ['DRAWER', '同步记录']] },
  { id: 'ADM-SEARCH-01', end: 'ADM', name: '搜索推荐配置', render: renderAdmin, note: 'ADM-14：搜索发现关键词与搜索热门商品两个页签，可新增、删除、启用/停用；热门商品可拖拽排序。', states: [['RESULTS', '有记录'], ['EMPTY', '无匹配'], ['DRAWER', '新增/编辑弹窗']] },
  { id: 'ADM-ORDER-01', end: 'ADM', name: '订单管理', render: renderAdmin, note: 'ADM-05　支付状态与交付状态分列；含批量与导出', states: [['RESULTS', '有记录'], ['EMPTY', '无匹配'], ['ERROR', '查询失败'], ['LOADING', '查询中'], ['NO_PERM', '无权限'], ['DRAWER', '详情抽屉']] },
  { id: 'ADM-GIFT-01', end: 'ADM', name: '好友赠送', render: renderAdmin, note: 'ADM-06　已支付的赠送订单：用户、操作人/时间，手动推进交付状态。', states: [['RESULTS', '好友赠送订单列表'], ['EMPTY', '无匹配'], ['DRAWER', '赠送订单详情']] },
  { id: 'ADM-CODE-01', end: 'ADM', name: '口令码交付', render: renderAdmin, note: 'ADM-07　单列表；含用户、操作人/时间与人工补发记录', states: [['RESULTS', '有记录'], ['EMPTY', '无匹配'], ['NO_PERM', '无查码权限'], ['DRAWER', '人工补发抽屉']] },
  { id: 'ADM-NOTIFY-01', end: 'ADM', name: '通知记录', render: renderAdmin, note: 'ADM-16　含授权重试', states: [['RESULTS', '有记录'], ['EMPTY', '无匹配'], ['DRAWER', '通知详情']] },
  { id: 'ADM-REFUND-01', end: 'ADM', name: '特殊退款', render: renderAdmin, note: 'ADM-08　含交付联动冲突', states: [['RESULTS', '有记录'], ['EMPTY', '无匹配'], ['DRAWER', '审核抽屉']] },
  { id: 'ADM-PAYCHK-01', end: 'ADM', name: '支付核查', render: renderAdmin, note: 'ADM-15　不可人工改已支付；侧栏入口已移除，页库保留供对照（CHG-0087）', states: [['RESULTS', '有记录'], ['EMPTY', '无匹配'], ['DRAWER', '核查记录']] },
  { id: 'ADM-AGREE-01', end: 'ADM', name: '协议管理', render: renderAdmin, note: 'ADM-13', states: [['RESULTS', '有记录'], ['EMPTY', '无匹配'], ['DRAWER', '版本编辑']] },
  { id: 'ADM-SERVICE-01', end: 'ADM', name: '客服配置', render: renderAdmin, note: 'ADM-09', states: [['DEFAULT', '表单']] },
  { id: 'ADM-RBAC-01', end: 'ADM', name: '权限管理', render: renderAdmin, note: 'ADM-10', states: [['RESULTS', '账号列表'], ['EMPTY', '无匹配'], ['DRAWER', '授权配置']] },
  { id: 'ADM-AUDIT-01', end: 'ADM', name: '操作记录', render: renderAdmin, note: 'ADM-11', states: [['RESULTS', '有记录'], ['EMPTY', '无匹配'], ['DRAWER', '记录详情']] },
  { id: 'ADM-STAT-01', end: 'ADM', name: '基础统计', render: renderAdmin, note: 'ADM-12　口径分别定义', states: [['RESULTS', '有记录'], ['EMPTY', '无匹配']] }
];
const ENDS = [['ALL', '全部端'], ['APP', 'APP 移动客户端'], ['WEB', 'WEB PC 客户端'], ['ADM', 'ADM 运营后台']];
const pageById = id => PAGES.find(p => p.id === id);
const compDoc = id => (window.COMP_DOCS && window.COMP_DOCS[id]) || null;

/* ============================================================
   渲染
   ============================================================ */
function currentPage() { return pageById(RV.pageId) || PAGES[0]; }
function go(pageId, stateCode, goodsId) {
  var p = pageById(pageId);
  if (!p) return;
  if (goodsId && goodsId !== RV.goodsId) RV.mediaIdx = 0;   // 换商品时轮播回到第一项
  if (goodsId) RV.goodsId = goodsId;
  /* 记录来源页：PC 详情页的「返回」按 03 的登记要「返回来源页面」（首页/搜索/订单…），
     没有来源时退化为首页。只在真正换了页面时更新，避免同页重绘把来源冲掉。 */
  if (RV.pageId && RV.pageId !== p.id) RV.from = { pageId: RV.pageId, state: RV.state };
  RV.session.cdkHelp = false;
  RV.session.guideOpen = false;
  RV.session.authPrompt = false;
  if (p.end !== RV.end && RV.end !== 'ALL') RV.end = p.end;
  RV.pageId = p.id;
  RV.state = stateCode || (p.states[0] && p.states[0][0]) || 'DEFAULT';
  RV.selectedComponent = null;
  clearTransientState(p.id);
  renderAll();
}
/* 状态预设是评审工具，不应把 NO_PERM / ERROR / LOADING 等瞬态永久写进后台运行时；
   切换页面或切换状态预设时清除，避免“切走再回来仍是错误态”。 */
function clearTransientState(pageId) {
  var rt = ADM_RT[pageId];
  if (!rt) return;
  rt.noperm = false; rt.error = false; rt.loading = false; rt.msg = ''; rt.msgKind = '';
  rt.exportState = 'IDLE';
}
function setEnd(end) {
  RV.end = end;
  var list = PAGES.filter(p => end === 'ALL' || p.end === end);
  if (!list.length) { RV.pageId = null; }
  else if (!list.some(p => p.id === RV.pageId)) { RV.pageId = list[0].id; }
  var p = currentPage();
  RV.state = p ? (p.states[0] && p.states[0][0]) : null;
  RV.selectedComponent = null;
  renderAll();
}
function setState(code) {
  RV.state = code;
  /* 状态预设「详情抽屉」此前只改 RV.state，没有任何渲染读它，预设等于空转（本轮修） */
  RV.drawerOpen = (code === 'DRAWER');
  if (!RV.drawerOpen) RV.drawerOrder = null;
  RV.session.panelOpen = (code === 'PANEL' || code === 'PANEL_AGREE' || code === 'CDK_HELP');
  RV.session.panelPrompt = (code === 'PANEL_AGREE');
  RV.session.cdkHelp = (code === 'CDK_HELP');
  clearTransientState(RV.pageId);
  renderAll();
}
/* 弹窗打开时锁住背后页面的滚动（CHG-0067）。
   弹层是 fixed 定位，滚轮会穿透到底下的列表；这里从画布往上找可滚动的祖先逐个锁住，
   关闭后按原值还原。找不到时由 html.adm-scroll-locked 的 overflow:hidden 兜底。
   正文区自身仍可滚（.adm-dlg .db 独立滚动，且 overscroll-behavior: contain 防链式滚动）。 */
var ADM_LOCKED_HOSTS = [];
function admSyncScrollLock() {
  var open = document.querySelector('.adm-mask.on') !== null;
  if (!open) {
    if (!ADM_LOCKED_HOSTS.length) { document.documentElement.classList.remove('adm-scroll-locked'); return; }
    ADM_LOCKED_HOSTS.forEach(function (h) { h.style.overflowY = h.getAttribute('data-adm-ov') || ''; });
    ADM_LOCKED_HOSTS = [];
    document.documentElement.classList.remove('adm-scroll-locked');
    return;
  }
  document.documentElement.classList.add('adm-scroll-locked');
  if (ADM_LOCKED_HOSTS.length) return;
  var el = document.getElementById('canvas');
  while (el && el !== document.documentElement) {
    var p = el.parentElement;
    if (!p) break;
    var ov = '';
    try { ov = window.getComputedStyle(p).overflowY || ''; } catch (e) { ov = ''; }
    if ((ov === 'auto' || ov === 'scroll') && p.scrollHeight > p.clientHeight + 1) {
      p.setAttribute('data-adm-ov', p.style.overflowY || '');
      p.style.overflowY = 'hidden';
      ADM_LOCKED_HOSTS.push(p);
    }
    el = p;
  }
}

/* 兜底：滚轮落在遮罩/头部/底部时不让背后列表跟着滚；落在可滚动区且还能滚就放行。
   判定依据是「事件目标向上、直到当前遮罩为止的第一个可滚动祖先，能不能朝这个方向滚」——
   不写死某个 class：嵌套子层的滚动容器各不相同（地区选择器是 .gd-regions，
   它的 .db 自身不可滚），写死 .db 会把子层列表的滚动一起拦掉（CHG-0073）。 */
document.addEventListener('wheel', function (e) {
  var mask = e.target && e.target.closest ? e.target.closest('.adm-mask.on') : null;
  if (!mask) return;
  var el = e.target;
  var up = e.deltaY < 0;
  while (el && el.nodeType === 1) {
    if (el.scrollHeight > el.clientHeight + 1) {
      var ov = '';
      try { ov = window.getComputedStyle(el).overflowY || ''; } catch (err) { ov = ''; }
      if (ov === 'auto' || ov === 'scroll' || ov === 'overlay') {
        var canUp = el.scrollTop > 0;
        var canDown = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
        if ((up && canUp) || (!up && canDown)) return;      // 还能滚：放行给浏览器
      }
    }
    if (el === mask) break;                                  // 只在本层遮罩内找，不越界
    el = el.parentElement;
  }
  e.preventDefault();
}, { passive: false });

function renderAll() {
  var p = currentPage();
  if (!p) {
    $('#canvas').className = '';
    $('#canvas').innerHTML = '<div class="empty" style="margin:20px"><span class="t">该端暂无页面</span>请选择其他端。</div>';
    $('#canvasTitle').textContent = '该端暂无页面';
    $('#canvasNote').textContent = '';
    $('#compPicker').innerHTML = ''; $('#compDoc').innerHTML = '';
    return;
  }
  var layout = $('#adminHost > div');
  /* 桌面端（PC 客户端与运营后台）都使用宽评审外壳并把完整说明移到画布下方，
     让画布获得接近目标平台的宽度（标准 7.2“桌面Web/后台使用可容纳表格、筛选和分页的桌面画布，
     不能硬塞进手机框”；7.5“桌面Web按目标平台适配”）。移动客户端仍按 7.2 的 1 : 1.1 双栏。 */
  var isDesktop = (p.end === 'ADM' || p.end === 'WEB');
  layout.className = isDesktop ? 'admin-shell-layout' : 'rv-layout';
  var sh = $('#reviewShell');
  if (sh) sh.className = isDesktop ? 'shell admin-mode' : 'shell';
  var host = $('#canvas');
  /* 后台侧栏收起态记在画布上，格线宽度由 .admin-canvas.sb-collapsed 控制（CHG-0054） */
  host.className = (p.end === 'ADM')
    ? ('admin-canvas' + (RV.admCollapsed ? ' sb-collapsed' : ''))
    : 'admin-canvas-wrap';
  var sim = RV.sim;
  /* 反馈条位于说明区（见 02-shell.html），不放进业务画布，避免改变业务元素的坐标与尺寸 */
  host.innerHTML = p.render(p, RV.state, sim);
  admApplyMenuFilter();          // 重渲染后把菜单搜索词重新应用上（CHG-0054）
  collectReviewNotes(host, p);
  $('#canvasTitle').textContent = p.name + '（' + p.id + '）' + (p.note ? '　—　' + p.note : '');
  $('#canvasNote').textContent = '当前状态：' + stateName(p, RV.state);
  syncDeskWidth(host);
  var panel = $('#canvasWrap').closest('.panel');
  if (panel) panel.querySelector('.panel-h').firstElementChild.textContent = p.name + ' · ' + p.id;
  renderStateSummary(p);
  refreshStateSelect(p);
  renderPicker(p);
  renderDoc(p);
  syncSimControls();
  applySel();
  startBannerTimer();
  admSyncScrollLock();           // 弹窗打开时锁住背后列表的滚动（CHG-0067）
  $$('.phone-body,.desk-body,.admin-content').forEach(function (el) {
    el.addEventListener('scroll', function () { /* 滚动位置由浏览器保持，重绘时不重置业务画布 */ }, { passive: true });
  });
}
/* 桌面画布宽度实测回填：评审外壳宽度受窗口影响，硬编码数字会与实际渲染不符。
   除以 CSS zoom，保证在缩放查看（documentElement.style.zoom）时仍显示真实布局宽度。
   写入位置是评审区（panel-h 与浏览器框）之外的内容不会因此变化——panel-h 属于评审外壳，
   不进入业务画布，符合标准 7.4.1“评审注释位于业务画布之外”。 */
function measuredCanvasW(host) {
  if (!host) return 0;
  /* WEB 画布外层是 .admin-canvas-wrap（内含 .desk 浏览器框），ADM 画布自身即 .admin-canvas */
  var el = host.matches('.desk,.admin-canvas') ? host
    : (host.querySelector('.desk') || host.querySelector('.admin-canvas'));
  if (!el) return 0;
  var z = parseFloat(document.documentElement.style.zoom) || 1;
  return Math.round(el.getBoundingClientRect().width / z);
}
function syncDeskWidth(host) {
  if (!host) return;
  var w = measuredCanvasW(host);
  if (!w) return;
  var lab = host.querySelector('[data-deskw]');
  if (lab) lab.textContent = '画布宽度 ' + w + 'px';
  RV.canvasW = w;
  var note = $('#canvasNote');
  if (note) {
    var p = currentPage();
    note.textContent = '当前状态：' + stateName(p, RV.state) + '　·　桌面画布 ' + w + 'px';
  }
}
function stateName(p, code) {
  var s = (p.states || []).find(x => x[0] === code);
  return s ? s[1] : (code || '—');
}
/* 状态预设下拉随页面同步；当前页不适用的状态不出现在列表中 */
function refreshStateSelect(p) {
  var sel = $('#fState');
  if (!sel) return;
  var list = (p.states || [['DEFAULT', '默认']]);
  if (!list.some(function (s) { return s[0] === RV.state; })) RV.state = list[0][0];
  sel.innerHTML = list.map(function (s) {
    return '<option value="' + attr(s[0]) + '">' + esc(s[1]) + '（' + esc(s[0]) + '）</option>';
  }).join('');
  sel.value = RV.state;
}
/* ============================================================
   评审注释与业务内容分离（标准 7.4.1 / 7.4.2）
   画布内只保留用户会看到的业务内容；页面编号、PRD/规则引用、设计理由、
   模拟与"静态预览"标记、研发注释等属于评审工具，统一收集到画布外的
   "页面说明与评审注释"区，画布内不再展示。
   ============================================================ */
const REVIEW_WORDS = /竞品|模拟数据|模拟环境|模拟结果|静态预览|评审|画布外|本版拟采用|已提交条件|待确认|待评审|不得|不默认|不复制|不属于|另行定义|口径/;
/* 含 PRD/规则引用或研发注释的行内文字（用于判定 .xsmall.muted / .small.muted 是否为评审注释） */
const REVIEW_RE = /(TBD-\d|DEC-[A-Z]|EX-[A-Z]|API-|FL-[A-Z]|SM-[A-Z]|SEQ-|TC-[A-Z]|PAT-|AC-\d|REQ-|竞品|模拟数据|静态预览|评审|画布外|本版拟采用|已提交条件|研发注释|标准\s*\d|（[A-Z]{2,}[-\d)）]|（\d+\.\d+）|点击.查询.或按|页签即时|计数与列表|指标取值|仅一页时禁用)/;
function stripRefs(t) {
  return String(t)
    .replace(/[（(]\s*(?:[A-Z]{2,}[A-Z0-9—-]*(?:\s*[~～\-]\s*\d+)?|\d+(?:\.\d+)?|标准\s*[\d.、～\-]*|PRD\s*[\d.]*|TBD-\d+|DEC-[A-Z-]*\d*|AC-\d+|SEQ-[A-Z-]*\d*)\s*[）)]/g, '')
    .replace(/\s*[，,。；;]?\s*(?:详见|参见)\s*(?:第?\s*[\d.]+(?:\s*[、～-]\s*[\d.]+)*\s*节?|0\d_[^\s，。；]+)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s、，。；;：:]+|[\s、，。；;：:]+$/g, '')
    .trim();
}
function collectReviewNotes(host, page) {
  var notes = [], seen = {};
  function push(txt, owner) {
    var t = String(txt || '').replace(/\s+/g, ' ').trim();
    if (!t || seen[t]) return;
    seen[t] = 1; notes.push({ t: t, o: owner || page.id });
  }
  /* 1) 显式标记为评审注释的节点（页面说明、页面级设计注释等） */
  $$('.rv-annot', host).forEach(function (el) {
    push(el.textContent, el.getAttribute('data-annot-owner') || page.id);
    el.parentNode.removeChild(el);
  });
  /* 2) 画布内的说明文字：
        - `.hint` 在本原型中一律是设计/规则说明 → 移出画布（业务提示请加 .keep-note）
        - `.xsmall.muted` / `.small.muted` 多为业务状态文字 → 仅当含规则引用或评审用语时才移出
        保留在画布中的文字仍会去掉 PRD/编号引用，避免把评审引用当业务文案。 */
  $$('.hint, .xsmall.muted, .small.muted', host).forEach(function (el) {
    var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!t || el.classList.contains('keep-note')) return;
    var isHint = el.classList.contains('hint');
    if (!isHint && !REVIEW_RE.test(t)) return;
    var comp = el.closest('[data-component]');
    push(t, comp ? comp.getAttribute('data-component') : page.id);
    if (el.parentNode) el.parentNode.removeChild(el);
  });
  /* 3) 其余保留文字统一去掉引用（例如"付款前可修改…（CHECKOUT-02）"→"付款前可修改…"）；
        仅对纯文本节点处理，避免覆盖含子元素的节点。 */
  $$('.keep-note, .xsmall.muted, .small.muted', host).forEach(function (el) {
    if (el.children.length) return;
    var raw = (el.textContent || '').trim();
    var cleaned = stripRefs(raw);
    if (cleaned && cleaned !== raw) el.textContent = cleaned;
  });
  renderNotes(notes, page);
}
/* 评审注释不再单独占一个汇总板块（评审反馈）：按归属分发到正在阅读的位置——
   组件自带的注释随该组件的十节说明一起展示（renderDoc），
   页面级注释并入「当前状态 / 数据来源 / 下一步」（renderStateSummary）。
   两处都在业务画布之外，仍满足标准 7.4.1。 */
function renderNotes(notes, page) {
  RV.notes = { page: page, all: notes || [] };
}
function notesOf(ownerId) {
  return ((RV.notes && RV.notes.all) || []).filter(function (n) { return n.o === ownerId; });
}
function notesHtml(items, withOwner) {
  if (!items.length) return '';
  return '<div class="note-list">' + items.map(function (n) {
    return '<div class="note-item">' + (withOwner ? '<span class="own">' + esc(n.o) + '</span>' : '') + esc(n.t) + '</div>';
  }).join('') + '</div>';
}
function renderStateSummary(p) {
  var el = $('#stateSummary');
  var pageNotes = notesOf(p.id);
  var simText = { ok: '正常（模拟成功）', fail: '请求失败', timeout: '超时 / 无结论', empty: '空数据' }[RV.sim];
  var srcMap = {
    APP: '模拟数据：客户端按 API-* 建议契约返回本地模拟数据；不发起真实请求。',
    WEB: '模拟数据：桌面客户端与 APP 共用同一套模拟数据与规则。',
    ADM: '模拟数据：后台列表数据为脱敏模拟行，筛选项覆盖各状态，允许部分组合故意无结果以验证空态。'
  };
  el.innerHTML =
    '<div class="kv"><span class="k">页面</span><span class="v">' + esc(p.name) + '（' + esc(p.id) + '）</span></div>' +
    '<div class="kv"><span class="k">状态</span><span class="v">' + esc(RV.state) + ' · ' + esc(stateName(p, RV.state)) + '</span></div>' +
    '<div class="kv"><span class="k">模拟结果</span><span class="v">' + esc(simText) + '</span></div>' +
    '<div class="kv"><span class="k">数据来源</span><span class="v">' + esc(srcMap[p.end]) + '</span></div>' +
    '<div class="kv"><span class="k">下一步</span><span class="v">' + esc(nextHint(p)) + '</span></div>' +
    (pageNotes.length
      ? '<div class="note-hd">本页评审注释（画布外，' + pageNotes.length + ' 条）</div>' + notesHtml(pageNotes, false)
      : '') +
    '<div class="hint">页面状态与业务对象状态分开：页面 LOADING 不等于 PAY::CONFIRMING；已付款不等于已交付。业务状态机见 04。</div>';
}
function nextHint(p) {
  var tips = {
    'APP-HOME-01': '点击商品卡片进入详情；点击"我的订单"查看订单；首次进入可叠加实名提醒。',
    'APP-NOTICE-01': '切换状态预设查看"知道了 / 前往认证 / 待评审"三种表现；点击遮罩或右上角关闭。',
    'APP-SEARCH-01': '输入关键词点击搜索，或点击搜索发现关键词。',
    'APP-SEARCH-02': '切换排序查看列表变化；点击"继续加载"查看末页与失败恢复。',
    'APP-PRODUCT-01': '点击"立即购买"打开购买面板；状态预设"订单处理中"查看 PRODUCT-08。',
    'APP-PANEL-01': '切换规格/支付方式，勾选或不勾选协议后点击购买，观察校验链。',
    'APP-CHECKOUT-01': '点击"继续支付"；未勾选协议会先进入购买须知。',
    'APP-PAYRET-01': '点击"未支付 / 已支付"，两者都会触发查询并按服务端结果去向。',
    'APP-RESULT-01': '切换状态查看发码中、交付异常、赠送四态、支付确认中、支付失败、订单关闭与晚到款。',
    'APP-LOGIN-01': '输入手机号 → 获取验证码（60 秒）→ 勾选隐私政策 → 登录/注册；也可走平台账号登录。',
    'APP-REALNAME-01': '点击「填入演示资料」→ 勾选授权 → 提交，查看实名成功结果。',
    'APP-REALNAME-02': '切换状态查看成年人、未成年人两种认证结果；左上角返回来源页。',
    'APP-PRIVACY-01': '登录与实名前需勾选的隐私政策占位文本。',
    'WEB-LOGIN-01': 'PC 端独立手机号登录/注册；未注册手机号验证通过后自动建号。',
    'WEB-REALNAME-01': 'PC 端实名认证；点击「填入演示资料」后提交。',
    'WEB-REALNAME-02': '切换状态查看成年人、未成年人两种认证结果；左上角返回来源页。',
    'APP-ORDER-01': '切换状态页签查看真实过滤与空态。',
    'ADM-ORDER-01': '输入条件后点击"查询"或按 Enter；切换页签、翻页、勾选行、点行打开详情抽屉。',
    'ADM-GIFT-01': '点用户名查看用户信息；点"查看"打开详情并用右上角"确认"推进状态。',
    'ADM-CODE-01': '点行打开人工补发，填写原因与补录口令码后提交；提交结果会写回订单，可到前台订单详情查看补录口令码。'
  };
  return tips[p.id] || '按画布中的真实控件操作；状态预设用于直接查看指定状态（静态预览）。';
}
function renderPicker(p) {
  var comps = [];
  var re = /data-component="([^"]+)"/g;
  var html = $('#canvas').innerHTML;
  var m;
  while ((m = re.exec(html)) !== null) { if (comps.indexOf(m[1]) < 0) comps.push(m[1]); }
  window.CUR_COMPS = comps;
  $('#compCount').textContent = comps.length + ' 个组件实例';
  var sel = $('#compPicker');
  if (!sel) return;
  /* 下拉框形式：每个选项为「名称（完整编号）」，默认收起，不再把全部组件铺开成列表 */
  sel.innerHTML = '<option value="">— 请选择组件 —</option>' + comps.map(function (id) {
    var d = compDoc(id);
    var label = (d && d.name) ? d.name : guessCompName(id);
    return '<option value="' + attr(id) + '">' + esc(label) + '（' + esc(id) + '）</option>';
  }).join('');
  sel.value = (RV.selectedComponent && comps.indexOf(RV.selectedComponent) >= 0) ? RV.selectedComponent : '';
}
function guessCompName(id) {
  var tail = id.split('-C').pop();
  return '组件 C' + tail;
}
function renderDoc(p) {
  if (!RV.selectedComponent) {
    $('#compDocTitle').textContent = '所选组件完整说明（十节）';
    $('#compDoc').innerHTML = '<div class="hint">请在左侧组件选择器中选择一个组件，或开启"显示所选组件描边"以在画布中定位。' +
      '组件十节说明与 <b>03_组件级文档</b> 同源；此处不提供摘要替代。组件自带的评审注释随本说明一并展示，不再单独汇总。</div>';
    return;
  }
  var id = RV.selectedComponent;
  var shown = (window.CUR_COMPS || []).indexOf(id) >= 0;
  var d = compDoc(id);
  var myNotes = notesOf(id);
  $('#compDocTitle').textContent = '所选组件完整说明：' + id;
  if (!d) {
    $('#compDoc').innerHTML = '<div class="empty"><span class="t">未在 03 中找到该组件的十节说明</span>' +
      '请检查 03_组件级文档.md 是否已包含 <b>' + esc(id) + '</b> 的完整小节；本原型不会用摘要替代正式说明。</div>';
    return;
  }
  var html = (shown ? '' : '<div class="banner" style="margin-bottom:8px">该组件在当前状态下未展示。组件定义仍然保留，可切换状态后查看描边定位。</div>') +
    '<div class="kv"><span class="k">组件</span><span class="v">' + esc(d.name || id) + '</span></div>' +
    '<div class="kv"><span class="k">编号</span><span class="v">' + esc(id) + '</span></div>' +
    '<div class="hint" style="margin-bottom:8px">来源：03_组件级文档（十节完整正文，与独立 MD 同源）</div>' +
    (myNotes.length
      ? '<div class="doc-sec note-fold"><div class="h">本页评审注释（画布外，' + myNotes.length + ' 条）</div>' +
        '<div class="doc-body">' + notesHtml(myNotes, false) + '</div></div>'
      : '');
  (d.sections || []).forEach(function (s) {
    html += '<div class="doc-sec"><div class="h">' + esc(s.n) + '. ' + esc(s.title) + '</div>' +
      '<div class="doc-body">' + (s.md ? renderMd(s.md) : '<span class="muted">（该节未填写）</span>') + '</div></div>';
  });
  if ((d.sections || []).length < 10) {
    html += '<div class="banner" style="border-color:#8a641e">本节仅解析到 ' + (d.sections || []).length + ' 节；缺失小节已在 08 未验证范围中记录。</div>';
  }
  $('#compDoc').innerHTML = html;
}
function applySel() {
  $$('#canvas [data-component]').forEach(function (el) {
    el.classList.toggle('rv-sel', RV.outline && el.getAttribute('data-component') === RV.selectedComponent);
  });
}
function pickComp(id) {
  RV.selectedComponent = id || null;
  var sel = $('#compPicker');
  if (sel && sel.value !== (id || '')) sel.value = id || '';
  applySel();
  renderDoc(currentPage());
}
/* 工作区内的操作结果浮层（CHG-0061）。与 flash() 并行使用：
   flash 在评审外壳的说明列，admToast 在画布上方，后者才是评审者会看到的那一个。 */
function admToast(msg, kind) {
  var rt = admRT(RV.pageId);
  rt.toast = msg; rt.toastKind = kind || '';
  clearTimeout(window.__admToastT);
  window.__admToastT = setTimeout(function () {
    var r2 = admRT(RV.pageId);
    r2.toast = null; r2.toastKind = '';
    renderAll();
  }, 3200);
}

function flash(msg, kind) {
  var el = $('#flash');
  if (!el) { return; }
  el.textContent = msg;
  el.className = 'rv-flash on' + (kind === 'err' ? ' err' : '');
  clearTimeout(window.__flashT);
  window.__flashT = setTimeout(function () { el.className = 'rv-flash'; }, 2600);
}

/* ============================================================
   业务交互分发
   ============================================================ */
/* 后台侧边菜单的过滤（CHG-0054）。渲染后与输入时各调一次，规则只此一处：
   搜索态按 data-key 命中过滤、分组标题隐藏、无命中的分组整块收起、全无命中给空态；
   非搜索态回到每个分组自己的展开/收起状态（data-open）。 */
function admApplyMenuFilter() {
  var sb = document.querySelector('.admin-sidebar');
  if (!sb) return;
  var inp = sb.querySelector('#admMenuQ');
  var q = ((inp ? inp.value : RV.admMenuQ) || '').trim().toLowerCase();
  var searching = q.length > 0;
  var shownTotal = 0;
  sb.querySelectorAll('.sb-groupbody').forEach(function (body) {
    var shown = 0;
    body.querySelectorAll('.sb-item').forEach(function (it) {
      var hit = !searching || (it.getAttribute('data-key') || '').indexOf(q) >= 0;
      it.hidden = !hit;
      if (hit) shown++;
    });
    shownTotal += shown;
    body.hidden = searching ? (shown === 0) : (body.getAttribute('data-open') === '0');
  });
  sb.querySelectorAll('.sb-group').forEach(function (g) { g.hidden = searching; });
  var empty = sb.querySelector('.sb-empty');
  if (empty) empty.hidden = !(searching && shownTotal === 0);
}

/* 首页配置管理：素材拖拽排序（CHG-0056）。拖的是草稿里的顺序，保存时才写回。 */
function admHomeRefreshPicker() {
  var box = document.querySelector('#hmMask .db');
  if (!box) return;
  var rt = admRT(RV.pageId);
  var q = (rt.pickQ || '').trim().toLowerCase();
  var list = ADM_GOODS.filter(function (gd) {
    return !q || (gd.nm + ' ' + gd.id).toLowerCase().indexOf(q) >= 0;
  });
  var rows = list.length
    ? list.map(function (gd) {
        return '<button class="hm-grow" type="button" data-act="adm-hm-pick-ok" data-goods="' + attr(gd.id) + '"' +
          ' aria-selected="' + (rt.pickSel === gd.id ? 'true' : 'false') + '">' +
          '<span class="nm">' + esc(gd.nm) + '（' + esc(gd.id) + '）</span>' +
          '<span class="pr">¥' + admGoodsPrice(gd).toFixed(2) + ' 起</span></button>';
      }).join('')
    : '<div class="hm-empty">没有匹配「' + esc(rt.pickQ) + '」的商品。可试试商品名称或商品ID。</div>';
  var host = box.querySelector('div:last-child');
  if (host) host.innerHTML = rows;
  var cnt = box.parentNode.querySelector('.df .xsmall');
  if (cnt) cnt.textContent = '共 ' + list.length + ' 个商品　模拟数据';
}
function bindAdmHomeDnD() {
  var dragId = null, dragList = null;
  /* 可拖拽的行有两种：首页banner 的素材行（.hm-item）与热门商品表格行（tr[data-drag-list]） */
  function rowOf(e) {
    if (!e.target.closest || RV.pageId !== 'ADM-HOME-01') return null;
    return e.target.closest('[data-drag-item]');
  }
  document.addEventListener('dragstart', function (e) {
    var it = rowOf(e);
    if (!it) return;
    dragId = it.getAttribute('data-drag-item');
    dragList = it.getAttribute('data-drag-list') || 'banner';
    it.classList.add('dragging');
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (err) {} }
  });
  document.addEventListener('dragover', function (e) {
    var it = rowOf(e);
    if (!it || !dragId) return;
    if ((it.getAttribute('data-drag-list') || 'banner') !== dragList) return;   // 不允许跨列表拖
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.over').forEach(function (x) { if (x !== it) x.classList.remove('over'); });
    it.classList.add('over');
  });
  document.addEventListener('drop', function (e) {
    var it = rowOf(e);
    if (!it || !dragId) return;
    if ((it.getAttribute('data-drag-list') || 'banner') !== dragList) { dragId = null; return; }
    e.preventDefault();
    var rt = admRT(RV.pageId), d = rt.hmDraft;
    if (!d) return;
    var toId = it.getAttribute('data-drag-item');
    var arr = dragList === 'hot' ? d.hot : d.items;
    var keyOf = dragList === 'hot'
      ? function (x) { return x; }
      : function (x) { return x.id; };
    var from = arr.map(keyOf).indexOf(dragId);
    var to = arr.map(keyOf).indexOf(toId);
    if (from >= 0 && to >= 0 && from !== to) {
      var moved = arr.splice(from, 1)[0];
      arr.splice(to, 0, moved);   // 顺序已在界面上直接体现，不再另写一行状态文字
    }
    dragId = null; dragList = null;
    document.querySelectorAll('.over').forEach(function (x) { x.classList.remove('over'); });
    renderAll();
  });
  document.addEventListener('dragend', function () {
    dragId = null; dragList = null;
    document.querySelectorAll('.dragging,.over').forEach(function (x) {
      x.classList.remove('dragging'); x.classList.remove('over');
    });
  });
}
/* 商品编辑的素材列表拖拽排序（CHG-0069）。与首页 banner 素材同一套交互：
   行首手柄按住拖动，落点行上缘显示定位条；顺序即前端商品详情页顶图的展示顺序。 */
/* 地区选择子层的就地刷新（CHG-0069）：只换清单与计数，不动搜索框，
   否则每敲一个字整块重渲染都会丢焦点（与 admHomeRefreshPicker 同一套做法）。 */
function admRegionRefresh() {
  var host = document.querySelector('#regMask .gd-regions');
  if (!host) return;
  var rt = admRT(RV.pageId);
  var q = (rt.regQ || '').trim().toLowerCase();
  var sel = rt.regDraft || [];
  var list = ADM_REGIONS.filter(function (x) { return !q || x.toLowerCase().indexOf(q) >= 0; });
  host.innerHTML = list.length
    ? list.map(function (x) {
        return '<label class="gd-region-row"><input type="checkbox" data-act="adm-gd-region-toggle" data-region="' + attr(x) + '"' +
          (sel.indexOf(x) >= 0 ? ' checked' : '') + '><span>' + esc(x) + '</span></label>';
      }).join('')
    : '<div class="hm-empty">没有匹配「' + esc(rt.regQ) + '」的地区。可试试地区中文名。</div>';
  var cnt = document.getElementById('regSelCount');
  if (cnt) cnt.textContent = sel.length;
  var df = document.querySelector('#regMask .df .xsmall');
  if (df) df.textContent = '共 ' + list.length + ' 个地区　选择后点右上角「确定」';
  var ok = document.querySelector('#regMask [data-act="adm-gd-region-ok"]');
  if (ok) ok.disabled = !sel.length;
}

function bindAdmGoodsDnD() {
  var dragId = null;
  function rowOf(e) {
    if (!e.target.closest || RV.pageId !== 'ADM-GOODS-01') return null;
    return e.target.closest('[data-gd-item]');
  }
  document.addEventListener('dragstart', function (e) {
    var it = rowOf(e);
    if (!it) return;
    dragId = it.getAttribute('data-gd-item');
    it.classList.add('dragging');
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (err) {} }
  });
  document.addEventListener('dragover', function (e) {
    var it = rowOf(e);
    if (!it || !dragId) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.gd-med.over').forEach(function (x) { if (x !== it) x.classList.remove('over'); });
    it.classList.add('over');
  });
  document.addEventListener('drop', function (e) {
    var it = rowOf(e);
    if (!it || !dragId) return;
    e.preventDefault();
    var rt = admRT(RV.pageId), d = rt.gdDraft;
    if (!d) return;
    var to = Number(it.getAttribute('data-gd-idx'));
    var from = -1;
    for (var k = 0; k < d.media.length; k++) if (d.media[k].id === dragId) { from = k; break; }
    dragId = null;
    it.classList.remove('over');
    if (from < 0 || to < 0 || from === to) { renderAll(); return; }
    var mv = d.media.splice(from, 1)[0];
    d.media.splice(to, 0, mv);
    renderAll();
  });
  document.addEventListener('dragend', function () {
    dragId = null;
    document.querySelectorAll('.gd-med.dragging,.gd-med.over').forEach(function (x) {
      x.classList.remove('dragging'); x.classList.remove('over');
    });
  });
}

/* 搜索推荐配置的拖拽排序（CHG-0075／0076）：数组顺序即前台展示顺序，拖完直接改数组。
   两个页签都支持——数据源按当前页签取；其他页面不拦截。 */
function bindAdmSearchDnD() {
  var dragId = null;
  function srList() {
    return admRT('ADM-SEARCH-01').tab === '搜索热门商品' ? ADM_SEARCH_GOODS : ADM_SEARCH_KW;
  }
  function rowOf(e) {
    if (!e.target.closest || RV.pageId !== 'ADM-SEARCH-01') return null;
    return e.target.closest('[data-sr-item]');
  }
  document.addEventListener('dragstart', function (e) {
    var it = rowOf(e);
    if (!it) return;
    dragId = it.getAttribute('data-sr-item');
    it.classList.add('dragging');
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (err) {} }
  });
  document.addEventListener('dragover', function (e) {
    var it = rowOf(e);
    if (!it || !dragId) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('tr.over').forEach(function (x) { if (x !== it) x.classList.remove('over'); });
    it.classList.add('over');
  });
  document.addEventListener('drop', function (e) {
    var it = rowOf(e);
    if (!it || !dragId) return;
    e.preventDefault();
    var list = srList();
    var ids = list.map(function (x) { return x.id; });
    var from = ids.indexOf(dragId), to = ids.indexOf(it.getAttribute('data-sr-item'));
    dragId = null;
    it.classList.remove('over');
    if (from < 0 || to < 0 || from === to) { renderAll(); return; }
    var mv = list.splice(from, 1)[0];
    list.splice(to, 0, mv);
    var rt = admRT('ADM-SEARCH-01');
    var nm = mv.w || (ADM_GOODS.filter(function (g) { return g.id === mv.gid; })[0] || {}).nm || mv.id;
    rt.msg = '已调整「' + nm + '」的顺序：第 ' + (from + 1) + ' 位 → 第 ' + (to + 1) + ' 位。前台按新顺序展示。';
    rt.msgKind = 'ok';
    renderAll();
  });
  document.addEventListener('dragend', function () {
    dragId = null;
    document.querySelectorAll('tr.dragging,tr.over').forEach(function (x) {
      x.classList.remove('dragging'); x.classList.remove('over');
    });
  });
}


/* 商品选择子层的搜索：只替换列表区，不整块重渲染——否则每敲一个字输入框都会重建、丢焦点 */
function admSrRefreshPicker() {
  var box = document.querySelector('#srPickMask .db');
  if (!box) return;
  var rt = admRT(RV.pageId);
  var q = (rt.srPickQ || '').trim().toLowerCase();
  var list = ADM_GOODS.filter(function (gd) {
    if (gd.status !== '在售') return false;
    return !q || (gd.nm + ' ' + gd.id).toLowerCase().indexOf(q) >= 0;
  });
  var host = box.querySelector('div:last-child');
  if (host) host.innerHTML = admSrPickerRows(rt, list);
  var cnt = document.querySelector('#srPickMask .gd-count');
  if (cnt) cnt.textContent = '共 ' + list.length + ' 个在售商品';
}

/* 打开二次确认层：把触发元素的动作与参数原样存下来，确认后照原样派发。 */
function admOpenConfirm(el) {
  var rt = admRT(RV.pageId), attrs = {};
  for (var i = 0; i < el.attributes.length; i++) {
    var a = el.attributes[i];
    if (a.name.indexOf('data-') === 0) attrs[a.name] = a.value;
  }
  rt.confirm = {
    act: el.getAttribute('data-act'),
    attrs: attrs,
    title: el.getAttribute('data-confirm-title') || '确认执行该操作？',
    body: el.getAttribute('data-confirm'),
    obj: el.getAttribute('data-confirm-obj') || '',
    ok: el.getAttribute('data-confirm-ok') || '确认删除',
    /* 说明与语气可传参：草稿类删除（素材/规格/热门商品）用默认的草稿语境与危险色，
       上架/下架这类立即生效的动作传自己的说明与普通色主按钮（CHG-0070）。 */
    note: el.getAttribute('data-confirm-note') || '此操作在原型中即时作用于当前草稿；保存配置后才对线上生效。',
    tone: el.getAttribute('data-confirm-tone') || 'danger'
  };
  rt.confirmFrom = el;
  renderAll();
  var ok = document.querySelector('#admConfirm .danger'); if (ok) ok.focus();
}
/* 确认层里的「确认」：把暂存的动作原样派发出去（用一个只读属性的替身元素）。 */
function admConfirmOk() {
  var rt = admRT(RV.pageId), cf = rt.confirm;
  if (!cf) return;
  rt.confirm = null;
  var proxy = { getAttribute: function (k) { return cf.attrs[k] === undefined ? null : cf.attrs[k]; },
                attributes: [], tagName: 'BUTTON', closest: function () { return null; },
                hasAttribute: function (k) { return cf.attrs[k] !== undefined; } };
  handleAct(cf.act, proxy, null);
  renderAll();
}
function admConfirmCancel() {
  var rt = admRT(RV.pageId);
  rt.confirm = null;
  renderAll();
  if (rt.confirmFrom && rt.confirmFrom.focus) { try { rt.confirmFrom.focus(); } catch (e) {} }
  rt.confirmFrom = null;
}

function bindActs() {
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    if (t.closest('#readerMask')) return;
    /* 破坏性操作的二次确认（CHG-0060）：带 data-confirm 的按钮不直接执行，
       先把动作连同全部 data-* 参数暂存起来弹确认层，点「确认」时才真正执行。 */
    if (t.getAttribute('data-confirm') && !/^adm-confirm-/.test(act)) {
      e.preventDefault();
      admOpenConfirm(t);
      return;
    }
    /* 复选框/单选框必须交给浏览器默认行为（否则勾选被 preventDefault 取消），
       状态由下面的 change 监听统一更新：协议勾选、后台行选择与全选都走这条路径。 */
    if (t.tagName === 'INPUT' && (t.type === 'checkbox' || t.type === 'radio')) return;
    e.preventDefault();
    handleAct(act, t, e);
  });
  /* 菜单搜索：输入即时过滤，不调 renderAll()——整页重渲染会重建输入框，
     焦点与光标位置都会丢。过滤规则只有 admApplyMenuFilter() 一处。 */
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || el.id !== 'admMenuQ') return;
    RV.admMenuQ = el.value;
    admApplyMenuFilter();
  });
  /* ---- 首页配置管理：草稿字段的即时更新（CHG-0056）----
     这里不调 renderAll()：整页重渲染会重建输入框，焦点与光标位置都会丢。
     值只写进 rt.hmDraft，点「保存配置」时才提交。 */
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    var d = admRT(RV.pageId).hmDraft;
    if (!d) return;
    if (el.getAttribute('data-hm-int')) {
      /* 只留数字；清空或填 0 先原样留着，保存时按 1 秒兜底 */
      var v = String(el.value).replace(/[^0-9]/g, '');
      if (v !== el.value) el.value = v;
      d.interval = v === '' ? '' : parseInt(v, 10);
      return;
    }
    if (el.getAttribute('data-hm-pickq')) {
      admRT(RV.pageId).pickQ = el.value;
      admHomeRefreshPicker();
      return;
    }
    if (el.getAttribute('data-hm-size')) { d.size = el.value; return; }
    if (el.getAttribute('data-hm-scope')) { d.scope = el.value; return; }
  });
/* ---- 协议富文本与权限表单（CHG-0089）---- */
  document.addEventListener('selectionchange', function () {
    var ed = document.getElementById('agreeEditor');
    if (!ed) return;
    var sel = window.getSelection();
    if (sel && sel.rangeCount && ed.contains(sel.anchorNode)) {
      AGREE_SEL = sel.getRangeAt(0).cloneRange();
    }
  });
  document.addEventListener('mousedown', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.agree-toolbar button') : null;
    if (btn) e.preventDefault();
  });
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    if (el.getAttribute('data-agree-editor')) {
      var rta = admRT(RV.pageId);
      if (!rta.agreeDraft) rta.agreeDraft = { body: '' };
      rta.agreeDraft.body = el.innerHTML; rta.agreeErr = '';
      return;
    }
    if (el.getAttribute('data-rbac-name') || el.getAttribute('data-rbac-desc')) {
      var rtr = admRT('ADM-RBAC-01');
      if (!rtr.rbacDraft) rtr.rbacDraft = { nm: '', desc: '', menus: [] };
      if (el.getAttribute('data-rbac-name')) rtr.rbacDraft.nm = el.value;
      if (el.getAttribute('data-rbac-desc')) rtr.rbacDraft.desc = el.value;
      rtr.rbacErr = '';
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    if (el.getAttribute('data-agree-font') || el.getAttribute('data-agree-size')) {
      var ed2 = document.getElementById('agreeEditor');
      var val = el.value;
      if (!ed2 || !val) return;
      if (AGREE_SEL) { var sel2 = window.getSelection(); sel2.removeAllRanges(); sel2.addRange(AGREE_SEL); }
      ed2.focus();
      try { document.execCommand(el.getAttribute('data-agree-font') ? 'fontName' : 'fontSize', false, val); } catch (e2) {}
      var rta2 = admRT(RV.pageId);
      if (rta2.agreeDraft) rta2.agreeDraft.body = ed2.innerHTML;
      return;
    }
    if (el.getAttribute('data-rbac-menu')) {
      var rtm = admRT('ADM-RBAC-01');
      if (!rtm.rbacDraft) rtm.rbacDraft = { nm: '', desc: '', menus: [] };
      if (!rtm.rbacDraft.menus) rtm.rbacDraft.menus = [];
      var mid = el.getAttribute('data-rbac-menu');
      var idx = rtm.rbacDraft.menus.indexOf(mid);
      if (el.checked && idx < 0) rtm.rbacDraft.menus.push(mid);
      if (!el.checked && idx >= 0) rtm.rbacDraft.menus.splice(idx, 1);
      rtm.rbacErr = '';
      return;
    }
    if (el.getAttribute('data-rbac-role')) {
      var rmc = admRT('ADM-RBAC-01');
      if (!rmc.rbacDraft) rmc.rbacDraft = {};
      rmc.rbacDraft.role = el.value; rmc.rbacErr = '';
    }
  });
  /* ---- 通知模板：名称/标题/正文与状态（CHG-0088）---- */
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    if (!el.getAttribute('data-tpl-name') && !el.getAttribute('data-tpl-title') && !el.getAttribute('data-tpl-body')) return;
    var rtn = admRT('ADM-NOTIFY-01');
    if (!rtn.tplDraft) rtn.tplDraft = {};
    if (el.getAttribute('data-tpl-name')) { rtn.tplDraft.name = el.value; return; }
    if (el.getAttribute('data-tpl-title')) { rtn.tplDraft.title = el.value; return; }
    if (el.getAttribute('data-tpl-body')) { rtn.tplDraft.body = el.value; return; }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute || !el.getAttribute('data-tpl-status')) return;
    var rtn2 = admRT('ADM-NOTIFY-01');
    if (!rtn2.tplDraft) rtn2.tplDraft = {};
    rtn2.tplDraft.status = el.value;
  });
  /* ---- 订单管理：退款原因输入（CHG-0086）---- */
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute || !el.getAttribute('data-refund-reason')) return;
    var rtd = admRT(RV.pageId);
    if (!rtd.refundDraft) rtd.refundDraft = { reason: '' };
    rtd.refundDraft.reason = el.value; rtd.refundErr = '';
  });
  /* ---- 口令码交付：人工补发表单（CHG-0081）---- */
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    if (RV.pageId !== 'ADM-CODE-01') return;
    var rtd = admRT(RV.pageId);
    if (!rtd.codeDraft) rtd.codeDraft = { reason: '', code: '' };
    if (el.getAttribute('data-code-reason')) { rtd.codeDraft.reason = el.value; return; }
    if (el.getAttribute('data-code-value')) { rtd.codeDraft.code = el.value; return; }
  });
  /* ---- 独立手机号登录与实名：输入只写会话，不落盘（CHG-0096） ---- */
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    if (el.getAttribute('data-login-phone')) { RV.session.loginPhone = el.value; RV.loginErr = ''; return; }
    if (el.getAttribute('data-login-code')) { RV.session.loginCode = el.value; RV.loginErr = ''; return; }
    if (el.getAttribute('data-bind-phone')) { RV.session.bindPhone = el.value; RV.session.bindErr = ''; return; }
    if (el.getAttribute('data-bind-code')) { RV.session.bindCode = el.value; RV.session.bindErr = ''; return; }
    if (el.getAttribute('data-real-name')) { RV.session.realName = el.value; RV.realErr = ''; return; }
    if (el.getAttribute('data-real-id')) { RV.session.realId = el.value; RV.realErr = ''; return; }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    if (el.getAttribute('data-login-agree')) { RV.session.privacyOk = !!el.checked; RV.loginErr = ''; return; }
    if (el.getAttribute('data-bind-agree')) { RV.session.bindAgree = !!el.checked; RV.session.bindErr = ''; return; }
    if (el.getAttribute('data-real-agree')) { RV.session.realAgree = !!el.checked; RV.realErr = ''; return; }
  });
  /* ---- 可售库存：手工调整数量与原因（CHG-0096）---- */
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute || RV.pageId !== 'ADM-STOCK-01') return;
    var rts = admRT(RV.pageId);
    if (!rts.stockDraft) rts.stockDraft = { deltas: {}, reason: '' };
    var sku = el.getAttribute('data-stock-sku');
    if (sku !== null) {
      var v = String(el.value).replace(/[^0-9+\-]/g, '').replace(/(?!^)[+\-]/g, '');
      if (v !== el.value) el.value = v;
      rts.stockDraft.deltas[sku] = v;
      return;
    }
    if (el.getAttribute('data-stock-reason')) rts.stockDraft.reason = el.value;
  });
  /* ---- 搜索推荐配置：商品选择器的搜索（CHG-0077）---- */
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    if (!el.getAttribute('data-sr-pickq')) return;
    var rt = admRT(RV.pageId);
    rt.srPickQ = el.value;
    admSrRefreshPicker();
  });
  /* ---- 搜索推荐配置：关键词输入（CHG-0075）----
     只写进 rt.srDraft，不重渲染——每敲一个字重建输入框会丢焦点。 */
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    if (!el.getAttribute('data-sr-kw')) return;
    var srd = admRT(RV.pageId).srDraft;
    if (srd) srd.w = el.value;
  });
  /* ---- 商品编辑：草稿字段的即时更新（CHG-0069）----
     与首页配置同一套做法：只写进 rt.gdDraft，点「保存」时才提交；重渲染会丢焦点与光标，
     所以这里不调 renderAll()。 */
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    var rt3 = admRT(RV.pageId);
    if (el.getAttribute('data-gd-regq')) { rt3.regQ = el.value; admRegionRefresh(); return; }
    var g = rt3.gdDraft;
    if (!g) return;
    if (el.getAttribute('data-gd-nm')) { g.nm = el.value; return; }
    if (el.getAttribute('data-gd-intro')) { g.intro = el.value; return; }
    if (el.getAttribute('data-gd-notice')) { g.notice = el.value; return; }
    /* 搜索关键词只存进 rt，不重渲染——否则每敲一个字输入框都会重建、丢焦点 */
    if (el.getAttribute('data-gd-sys-q')) { rt3.sysQ = el.value; return; }
    var sfl = el.getAttribute('data-gd-sys-f');
    if (sfl) { g.sys.min[sfl] = el.value; return; }
    var sn = el.getAttribute('data-gd-spec-nm');
    if (sn !== null) { var i1 = Number(sn); if (g.specs[i1]) g.specs[i1].nm = el.value; return; }
    var sp = el.getAttribute('data-gd-spec-pr');
    if (sp !== null) {
      var i2 = Number(sp);
      /* 价格只留数字与一个小数点；非法字符直接抹掉，避免把脏值写进草稿 */
      var v = String(el.value).replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
      if (v !== el.value) el.value = v;
      if (g.specs[i2]) g.specs[i2].price = v;
      return;
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    var rtc = admRT(RV.pageId);
    if (el.getAttribute('data-gd-mode') && RV.pageId === 'ADM-GOODS-01') {
      if (rtc.gdDraft) rtc.gdDraft.supplyMode = el.value;
      return;
    }
    /* 交付类型：固定两项，可多选可取消；全部取消时不落库，由保存校验拦下 */
    var wv = el.getAttribute('data-way');
    if (wv && el.getAttribute('data-act') === 'adm-gd-way' && rtc.gdDraft) {
      var wi = rtc.gdDraft.ways.indexOf(wv);
      if (el.checked && wi < 0) rtc.gdDraft.ways.push(wv);
      if (!el.checked && wi >= 0) rtc.gdDraft.ways.splice(wi, 1);
      /* 固定两项的顺序，避免勾选先后影响展示与写回 */
      rtc.gdDraft.ways = ADM_WAYS.filter(function (x) { return rtc.gdDraft.ways.indexOf(x) >= 0; });
      renderAll(); return;
    }
    /* 地区选择子层里的勾选 */
    var rv = el.getAttribute('data-region');
    if (rv && el.getAttribute('data-act') === 'adm-gd-region-toggle') {
      if (!rtc.regDraft) rtc.regDraft = [];
      var qi = rtc.regDraft.indexOf(rv);
      if (el.checked && qi < 0) rtc.regDraft.push(rv);
      if (!el.checked && qi >= 0) rtc.regDraft.splice(qi, 1);
      renderAll(); return;
    }
    /* 素材上传：图片与视频都收；只记文件名与类型，不落盘、不上传（原型约束） */
    if (el.getAttribute('data-gd-file') && rtc.gdDraft && el.files && el.files.length) {
      RV.gdSeq = RV.gdSeq || 100;
      Array.prototype.forEach.call(el.files, function (f) {
        var isVideo = /^video\//.test(f.type);
        var isImage = /^image\//.test(f.type);
        if (!isVideo && !isImage) return;                   // 其它类型直接忽略，不写入草稿
        var item = { id: 'MD-' + (++RV.gdSeq), t: isVideo ? 'video' : 'image', n: f.name, u: '' };
        rtc.gdDraft.media.push(item);
        rtc.gdPrev = item.id;                               // 上传后立刻预览最新一张
        /* 图片就地读出预览（CHG-0074）：仅内存，不落盘、不上传、不写入商品资料。
           视频不读内容，避免把大文件整块塞进内存。 */
        if (isImage && window.FileReader) {
          var fr = new FileReader();
          fr.onload = function () { item.u = this.result; renderAll(); };
          fr.readAsDataURL(f);
        }
      });
      renderAll(); return;
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    var rt2 = admRT(RV.pageId);
    if (el.getAttribute('data-hm-sort') && rt2.hmDraft) { rt2.hmDraft.sortBy = el.value; return; }
    /* 图片上传：选中本地文件后就地预览（仅内存，不写入交付物） */
    var fid = el.getAttribute('data-hm-file');
    if (fid && el.files && el.files[0]) {
      var f = el.files[0];
      if (!/^image\//.test(f.type)) {
        rt2.hmMsg = '请选择图片文件（jpg／png／webp）。'; rt2.hmMsgKind = 'err'; renderAll(); return;
      }
      var fr = new FileReader();
      fr.onload = function () {
        var it = rt2.hmDraft.items.filter(function (x) { return x.id === fid; })[0];
        if (it) it.img = fr.result;
        rt2.hmMsg = '已选择图片「' + f.name + '」（' + Math.round(f.size / 1024) + ' KB）。保存配置后生效。';
        rt2.hmMsgKind = '';
        renderAll();
      };
      fr.readAsDataURL(f);
      return;
    }
  });

  document.addEventListener('change', function (e) {
    /* 后台筛选：输入/选择先只更新草稿，点击“查询”或按 Enter 才提交（标准 7.6.3 第1条） */
    var ft = e.target.closest('[data-flt]');
    if (ft) {
      var rtf = admRT(RV.pageId);
      rtf.draft[ft.getAttribute('data-flt')] = ft.value;
      return;
    }
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    if (act === 'agr') { RV.session.agreementOk = t.checked; if (RV.state === 'PANEL_AGREE') RV.session.panelPrompt = false; flash(t.checked ? '已勾选《购买协议》（本次交易上下文）' : '已取消勾选协议'); return; }
    if (act === 'adm-sel') {
      var rt = admRT(RV.pageId), rid = t.getAttribute('data-row');
      var i = rt.sel.indexOf(rid);
      if (t.checked && i < 0) rt.sel.push(rid);
      if (!t.checked && i >= 0) rt.sel.splice(i, 1);
      rt.msg = '已选择 ' + rt.sel.length + ' 条记录（仅当前页范围）'; renderAll(); return;
    }
    if (act === 'adm-selall') {
      var rt2 = admRT(RV.pageId);
      var cfg = ADM_CFG[RV.pageId];
      var rows = admFiltered(cfg, rt2).slice((rt2.page - 1) * rt2.size, rt2.page * rt2.size);
      rt2.sel = t.checked ? rows.map(function (r) { return r.id || r.no || r.nid; }) : [];
      rt2.msg = t.checked ? '已全选当前页 ' + rt2.sel.length + ' 条' : '已清除当前页选择';
      renderAll(); return;
    }
    if (act === 'adm-size') {
      var rt3 = admRT(RV.pageId); rt3.size = Number(t.value); rt3.page = 1; rt3.sel = [];
      rt3.msg = '每页条数已改为 ' + rt3.size + '，已回到第 1 页'; renderAll(); return;
    }
    if (t.hasAttribute('data-flt')) {
      var rt4 = admRT(RV.pageId);
      rt4.draft[t.getAttribute('data-flt')] = t.value;
      return; /* 草稿，不立即查询 */
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var t = e.target;
    if (t && t.hasAttribute && t.hasAttribute('data-flt')) {
      e.preventDefault();
      var rt = admRT(RV.pageId);
      rt.draft[t.getAttribute('data-flt')] = t.value;
      admCommit(RV.pageId);
      return;
    }
    if (t && t.id === 'admUser') { e.preventDefault(); handleAct('adm-login', t, e); return; }
    if (t && t.id === 'admPwd') { e.preventDefault(); handleAct('adm-login', t, e); return; }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    /* 二次确认层优先于其它 Esc 行为：先关它，避免一次 Esc 连关两层 */
    var adc = document.getElementById('admConfirm');
    if (adc) { admConfirmCancel(); return; }
    if ($('#dgmMask') && $('#dgmMask').classList.contains('on')) { closeDiagram(); return; }
    if (RV.readerOpen) { closeReader(); return; }
    if (RV.session.panelOpen) { RV.session.panelOpen = false; RV.session.panelPrompt = false; renderAll(); return; }
    if (/^ADM/.test(RV.pageId || '')) { var rt = admRT(RV.pageId); if (rt.drawer !== null) { rt.drawer = null; renderAll(); } }
  });
}
function admCommit(pageId) {
  var rt = admRT(pageId), cfg = ADM_CFG[pageId];
  var all = (cfg.filters || []).concat(cfg.advanced || []);
  all.forEach(function (f) {
    if (rt.draft[f.k] !== undefined) { rt.committed[f.k] = String(rt.draft[f.k]).trim(); rt.draft[f.k] = undefined; }
    if (rt.draft[f.k + '_from'] !== undefined) { rt.committed[f.k + '_from'] = String(rt.draft[f.k + '_from']).trim(); rt.draft[f.k + '_from'] = undefined; }
    if (rt.draft[f.k + '_to'] !== undefined) { rt.committed[f.k + '_to'] = String(rt.draft[f.k + '_to']).trim(); rt.draft[f.k + '_to'] = undefined; }
  });
  var ver = admQuery(pageId);
  rt.loading = true; rt.error = false; rt.page = 1; rt.sel = []; rt.drawer = null; rt.msg = '正在查询…'; rt.msgKind = '';
  renderAll();
  setTimeout(function () {
    if (admIsStale(pageId, ver)) return;  /* 旧回调作废 */
    rt.loading = false;
    if (RV.sim === 'fail') { rt.error = true; rt.msg = '查询失败：服务暂不可用（模拟）。已保留条件。'; rt.msgKind = 'err'; }
    else if (RV.sim === 'timeout') { rt.msg = '查询超时，未获得结果（模拟）。'; rt.msgKind = 'err'; }
    else {
      var rows = admFiltered(cfg, rt);
      rt.msg = '查询完成：' + rows.length + ' 条匹配记录（模拟数据）。';
      rt.msgKind = rows.length ? 'ok' : '';
    }
    renderAll();
  }, 420);
}
/* 同一业务步骤在各端都有自己的页面编号。购买链路里原先把落地页写死成 APP-*，
   PC 上从商品详情走到任一步（未实名、未绑手机、创建订单后）都会整条跳进移动端画布。
   统一从这张表取，新增端时只补一行（CHG-0050）。 */
var STEP_PAGE = {
  APP: { SEARCH: 'APP-SEARCH-01', PRODUCT: 'APP-PRODUCT-01', CHECKOUT: 'APP-CHECKOUT-01',
         PAYRET: 'APP-PAYRET-01', RESULT: 'APP-RESULT-01' },
  WEB: { SEARCH: 'WEB-SEARCH-01', PRODUCT: 'WEB-PRODUCT-01', CHECKOUT: 'WEB-CHECKOUT-01',
         PAYRET: 'WEB-PAYRET-01', RESULT: 'WEB-RESULT-01' }
};
function isWebEnd() { var p = currentPage(); return !!(p && p.end === 'WEB'); }
function stepPage(key) { return (isWebEnd() ? STEP_PAGE.WEB : STEP_PAGE.APP)[key]; }

function handleAct(act, t, e) {
  var p = currentPage();
  /* adm- 前缀是后台「筛选/表格/批量操作」的保留命名空间，一律转交 handleAdm，
     不会走到下面的 switch。侧边菜单自己的动作因此用 sb- 前缀（CHG-0054）。 */
  var admActs = act.indexOf('adm-') === 0;
  if (admActs) { handleAdm(act, t); return; }
  switch (act) {
    case 'go': {
      var to = t.getAttribute('data-to'), dno = t.getAttribute('data-order');
      /* 订单详情：点哪笔看哪笔；从其他入口进入时回落到演示订单（CHG-0081） */
      if (dno) RV.session.detailOrder = dno;
      else if (to === 'APP-ORDER-02') RV.session.detailOrder = '';
      go(to, t.getAttribute('data-state'), t.getAttribute('data-goods')); return;
    }
    case 'back': {
      var backMap = { 'APP-PRODUCT-01': 'APP-HOME-01', 'APP-SEARCH-01': 'APP-HOME-01', 'APP-SEARCH-02': 'APP-SEARCH-01', 'APP-AGREEMENT-01': 'APP-PANEL-01', 'APP-ORDER-01': 'APP-MINE-01', 'APP-ORDER-02': 'APP-ORDER-01', 'APP-SERVICE-01': 'APP-HOME-01', 'APP-PAYRET-01': 'APP-CHECKOUT-01', 'APP-LOGIN-01': 'APP-MINE-01', 'APP-REALNAME-01': 'APP-MINE-01', 'APP-REALNAME-02': 'APP-REALNAME-01', 'APP-PRIVACY-01': 'APP-MINE-01', 'WEB-LOGIN-01': 'WEB-MINE-01', 'WEB-REALNAME-01': 'WEB-MINE-01', 'WEB-REALNAME-02': 'WEB-REALNAME-01', 'WEB-PRODUCT-01': 'WEB-HOME-01', 'WEB-CHECKOUT-01': 'WEB-ORDER-01' };
      var target = backMap[p.id] || 'APP-HOME-01';
      /* PC 详情页按「返回来源页面」处理：回到进入详情前的那个页面（首页/搜索/订单…）；
         直接打开详情时没有来源，退化为首页。移动端的返回是固定层级，保持原样。 */
      /* 只接受同端的来源页：用评审的页面选择器跨端跳转时 RV.from 会指向另一端，
         直接采用会把 PC 的返回跳进移动端画布。 */
      var src = RV.from && RV.from.pageId ? pageById(RV.from.pageId) : null;
      if (p.id === 'WEB-PRODUCT-01' && src && src.end === p.end && src.id !== p.id) target = src.id;
      /* 实名结果页按「返回来源页面」处理：从「我的」进入回「我的」，从实名页进入回实名页。 */
      if ((p.id === 'APP-REALNAME-02' || p.id === 'WEB-REALNAME-02') && src && src.end === p.end && src.id !== p.id) target = src.id;
      /* 返回搜索默认页时清掉当前关键词：输入框不留上次搜过的词（评审反馈）。
         结果页自己的输入框不受影响——它读的是本页快照，返回后才清。 */
      if (target === 'APP-SEARCH-01' || target === 'WEB-SEARCH-01') RV.kw = '';
      go(target); return;
    }
    case 'sort': {
      RV.sort = t.getAttribute('data-sort');
      flash('排序已切换为「' + RV.sort + '」；结果列表已按该条件重新排列');
      renderAll(); return;
    }
    case 'search': {
      /* 取「与按钮同处一个容器」的输入框。此前按固定 id（kw1/kw2/kw3）取值，
         顶栏搜索框不在其中，会误取页面上另一个输入框的内容。 */
      var scope = (t.closest && t.closest('form, .card, [data-component]')) || document;
      var inp = scope.querySelector('input');
      var v = ((inp && inp.value) || '').trim();
      if (!v) { flash('请输入商品名称后再搜索', 'err'); return; }
      RV.kw = v;
      go(t.getAttribute('data-from') === 'w1' ? 'WEB-SEARCH-01' : 'APP-SEARCH-02', 'RESULTS');
      return;
    }
    case 'word': { RV.kw = t.getAttribute('data-word'); go(p.end === 'WEB' ? 'WEB-SEARCH-01' : 'APP-SEARCH-02', 'RESULTS'); return; }
    /* 首页广告位点击：站内跳转（GOODS → 商品详情、SEARCH → 搜索结果）。
       目标失效时不进空白页，就地提示（03 第4节 NO_TARGET）。 */
    case 'banner': {
      var bid = t.getAttribute('data-banner');
      var bn = (BANNERS || []).filter(function (x) { return x.id === bid; })[0];
      if (!bn) return;
      var web = (p.end === 'WEB');
      if (bn.targetType === 'SEARCH') { RV.kw = bn.target; go(web ? 'WEB-SEARCH-01' : 'APP-SEARCH-02', 'RESULTS'); return; }
      var exists = (GOODS || []).some(function (gd) { return gd.id === bn.target; });
      if (!exists) { flash('该内容已下线，请浏览其他内容', 'err'); return; }
      go(web ? 'WEB-PRODUCT-01' : 'APP-PRODUCT-01', 'DEFAULT', bn.target);
      return;
    }
    case 'banner-step': {
      var total = (BANNERS || []).length || 1;
      var step = Number(t.getAttribute('data-step')) || 1;
      RV.banner = ((((RV.banner | 0) + step) % total) + total) % total;
      renderAll(); return;
    }
    case 'banner-dot': { RV.banner = Number(t.getAttribute('data-idx')) || 0; renderAll(); return; }
    /* 搜索历史按 PRD V1.5 移出首期，相关动作分支已删除。 */
    case 'loadmore': flash('继续加载：请求下一页；已到末页时显示"没有更多内容"'); return;
    case 'retry': flash('已重新发起请求（模拟）'); renderAll(); return;
    case 'goSearch': { RV.kw = ''; go(stepPage('SEARCH')); return; }
    case 'toggle-intro': { RV.state = (RV.state === 'EXPANDED') ? 'DEFAULT' : 'EXPANDED'; renderAll(); return; }
    /* 购买面板：APP 是手机画布内的底部半屏面板（状态 PANEL，进状态预设）；
       WEB 是 PC 画布内的居中弹层（01 登记为 WEB-PRODUCT-01::PANEL_OPEN，入口是按钮、不进预设）。
       所以这里按端决定是否写状态：WEB 写 PANEL 会被 refreshStateSelect 判为不适用并回退，
       表现就是「点了立即购买什么也没发生」。 */
    case 'open-panel': {
      RV.session.panelOpen = true; RV.session.panelPrompt = false; RV.session.cdkHelp = false;
      if (p.states && p.states.some(function (s) { return s[0] === 'PANEL'; })) RV.state = 'PANEL';
      renderAll(); return;
    }
    case 'close-panel': {
      RV.session.panelOpen = false; RV.session.panelPrompt = false; RV.session.cdkHelp = false;
      if (RV.state === 'PANEL' || RV.state === 'PANEL_AGREE' || RV.state === 'CDK_HELP') RV.state = 'DEFAULT';
      renderAll(); return;
    }
    case 'close-modal': {
      RV.session.panelOpen = false; RV.session.panelPrompt = false; RV.session.cdkHelp = false;
      if (RV.drawerOpen) { RV.drawerOpen = false; RV.drawerOrder = null; }
      if (RV.state === 'PANEL_AGREE' || RV.state === 'PANEL') RV.state = 'DEFAULT';
      renderAll(); return;
    }
    case 'spec': {
      RV.session.spec = t.getAttribute('data-spec');
      flash('规格已切换为「' + RV.session.spec + '」，价格与适用限制同步更新');
      renderAll(); return;
    }
    case 'pay': { RV.session.pay = t.getAttribute('data-pay'); flash('支付方式已选择（仅微信与支付宝）'); renderAll(); return; }
    /* 商品详情媒体轮播：图片与视频在同一轮播内切换 */
    case 'media-go': { RV.mediaIdx = Number(t.getAttribute('data-idx')) || 0; renderAll(); return; }
    case 'media-prev': { RV.mediaIdx = Math.max(0, (RV.mediaIdx || 0) - 1); renderAll(); return; }
    case 'media-next': {
      var n = mediaItems(g(RV.goodsId || 'P1001')).length;
      RV.mediaIdx = Math.min(n - 1, (RV.mediaIdx || 0) + 1); renderAll(); return;
    }
    /* 发货方式：选项来自该商品配置，切换后同步交付说明与必填资料 */
    case 'way': {
      var w = t.getAttribute('data-way');
      var gd2 = g(RV.goodsId || 'P1001');
      if (waysOf(gd2).indexOf(w) < 0) { flash('该商品未配置此发货方式', 'err'); return; }
      RV.session.way = w;
      RV.session.linkErr = '';
      flash('发货方式已改为「' + wayText(w) + '」' + (w === 'GIFT' ? '，需填写 Steam 好友链接' : ''));
      renderAll();
      return;
    }
    case 'cdk-help': { RV.session.cdkHelp = true; renderAll(); return; }
    case 'close-help': { RV.session.cdkHelp = false; renderAll(); return; }
    case 'resume-pay': {
      /* 订单列表「继续支付」：FL-CHECKOUT-001 登记的恢复入口，按原订单号读取待支付订单 */
      var rno = t.getAttribute('data-order') || '';
      RV.session.resumeOrder = rno;
      RV.session.order = { no: rno };   // APP 结算页从 RV.session.order 读取订单号
      flash('已按订单号 ' + rno + ' 恢复待支付订单，继续支付前重新校验资格与商品（PENDING-05）');
      go(p.end === 'WEB' ? 'WEB-CHECKOUT-01' : 'APP-CHECKOUT-01');
      return;
    }
    case 'agr': return;
    case 'use-guide': { RV.session.guideOpen = true; renderAll(); return; }
    case 'guide-close': { RV.session.guideOpen = false; renderAll(); return; }
    case 'buy': { doBuy(); return; }
    case 'prompt-cancel': { RV.session.panelPrompt = false; RV.state = 'PANEL'; flash('已取消：不创建可支付订单、不唤起支付'); renderAll(); return; }
    case 'prompt-agree': {
      RV.session.agreementOk = true; RV.session.panelPrompt = false; RV.state = 'PANEL';
      flash('已同意协议（记录版本与时间）。继续核验手机号，不能跳过。');
      renderAll();
      setTimeout(function () { doVerifyAfterAgreement(); }, 500);
      return;
    }
    case 'auth-cancel': { go(stepPage('PRODUCT'), 'DEFAULT'); flash('已暂不认证：停止购买、保留现场，可继续浏览'); return; }
    case 'auth-go': {
      RV.session.authPrompt = false;
      go(isWebEnd() ? 'WEB-REALNAME-01' : 'APP-REALNAME-01', 'FORM');
      return;
    }
    case 'auth-manual': {
      RV.session.authPrompt = false;
      go(isWebEnd() ? 'WEB-REALNAME-01' : 'APP-REALNAME-01', 'FORM');
      return;
    }
    case 'auth-cancel-web': {
      RV.session.authPrompt = false;
      RV.session.panelOpen = true;
      renderAll();
      flash('已暂不认证：停止购买并保留现场，可继续浏览');
      return;
    }
    case 'bind-send': {
      var bp = String(RV.session.bindPhone || '').replace(/\D/g, '');
      if (!/^1\d{10}$/.test(bp)) {
        RV.session.bindErr = '请输入正确的 11 位手机号后再获取验证码。';
        RV.state = 'ERROR'; renderAll(); return;
      }
      RV.session.bindErr = '';
      RV.session.bindSmsSent = true;
      RV.session.bindSmsPhone = maskPhone(bp);
      RV.state = 'CODE_SENT';
      renderAll();
      flash('验证码已发送（模拟）；60 秒内不可重复发送');
      return;
    }
    case 'bind-submit': {
      var s2 = RV.session;
      var bp2 = String(s2.bindPhone || '').replace(/\D/g, '');
      var bc2 = String(s2.bindCode || '').replace(/\D/g, '');
      if (!/^1\d{10}$/.test(bp2)) { s2.bindErr = '请输入正确的 11 位手机号。'; RV.state = 'ERROR'; renderAll(); return; }
      if (!s2.bindSmsSent) { s2.bindErr = '请先获取短信验证码。'; RV.state = 'ERROR'; renderAll(); return; }
      if (!/^\d{6}$/.test(bc2)) { s2.bindErr = '请输入 6 位短信验证码。'; RV.state = 'ERROR'; renderAll(); return; }
      if (!s2.bindAgree) { s2.bindErr = '请先阅读并勾选《隐私政策》。'; RV.state = 'ERROR'; renderAll(); return; }
      s2.bindErr = '';
      s2.phone = 'bound';
      s2.phoneMasked = maskPhone(bp2);
      s2.bindSmsSent = false;
      s2.bindSmsPhone = '';
      s2.bindPhone = '';
      s2.bindCode = '';
      s2.bindAgree = false;
      s2.bindChange = false;
      syncSimControls();
      if (s2.bindFrom === 'BUY') {
        s2.bindFrom = '';
        go(stepPage('PRODUCT'), 'PANEL');
        flash('手机号绑定成功，已返回原购买面板');
      } else {
        s2.bindFrom = '';
        go(isWebEnd() ? 'WEB-MINE-01' : 'APP-MINE-01', 'LOGGED_IN');
        flash('手机号已绑定商城账号');
      }
      return;
    }
    case 'bind-change': {
      RV.session.bindChange = true;
      RV.session.bindErr = '';
      RV.session.bindSmsSent = false;
      RV.session.bindSmsPhone = '';
      RV.session.bindPhone = '';
      RV.session.bindCode = '';
      RV.session.bindAgree = false;
      RV.state = 'DEFAULT';
      renderAll();
      flash('请输入新手机号并完成短信验证');
      return;
    }
    case 'mine-phone': {
      RV.session.bindFrom = 'MINE';
      RV.session.bindChange = (RV.session.phone === 'bound');
      RV.session.bindErr = '';
      RV.session.bindSmsSent = false;
      RV.session.bindSmsPhone = '';
      RV.session.bindPhone = '';
      RV.session.bindCode = '';
      RV.session.bindAgree = false;
      go(isWebEnd() ? 'WEB-PHONE-01' : 'APP-PHONE-01', RV.session.phone === 'bound' ? 'BOUND' : 'DEFAULT');
      return;
    }
    case 'close-notice': { RV.session.noticeClosed = true; RV.state = 'RESULTS'; RV.session.realname = 'verified'; renderAll(); return; }
    case 'notice-auth': {
      var nr = RV.session.realname;
      if (nr === 'verified' || nr === 'minor') { go('APP-REALNAME-02', nr === 'minor' ? 'MINOR' : 'SUCCESS'); return; }
      go('APP-REALNAME-01', 'FORM');
      return;
    }
    case 'copy': {
      var txt = t.getAttribute('data-copy') || '';
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).catch(function () {});
        flash('已复制：' + (txt.length > 24 ? txt.slice(0, 12) + '…' : txt));
      } catch (err) { flash('复制失败：请长按选择文本后手动复制', 'err'); }
      return;
    }
    case 'login': { go(isWebEnd() ? 'WEB-LOGIN-01' : 'APP-LOGIN-01', 'DEFAULT'); return; }
    case 'login-later': {
      RV.session.pendingBuy = false;
      go(isWebEnd() ? 'WEB-HOME-01' : 'APP-HOME-01', 'RESULTS');
      flash('已暂不登录；登录后可继续购买');
      return;
    }
    case 'sms-send': {
      var lp = String(RV.session.loginPhone || '').replace(/\D/g, '');
      if (!/^1\d{10}$/.test(lp)) { RV.loginErr = '请输入正确的 11 位手机号后再获取验证码。'; RV.state = 'ERROR'; renderAll(); return; }
      RV.session.smsSent = true;
      RV.session.smsPhone = lp.slice(0, 3) + '****' + lp.slice(-4);
      RV.loginErr = '';
      RV.state = 'CODE_SENT';
      flash('验证码已发送（模拟）；60 秒内不可重复发送');
      renderAll(); return;
    }
    case 'phone-login': {
      var lp2 = String(RV.session.loginPhone || '').replace(/\D/g, '');
      var lc = String(RV.session.loginCode || '').replace(/\D/g, '');
      if (!/^1\d{10}$/.test(lp2)) { RV.loginErr = '请输入正确的 11 位手机号。'; RV.state = 'ERROR'; renderAll(); return; }
      if (!RV.session.smsSent) { RV.loginErr = '请先获取短信验证码。'; RV.state = 'ERROR'; renderAll(); return; }
      if (!/^\d{6}$/.test(lc)) { RV.loginErr = '请输入 6 位短信验证码。'; RV.state = 'ERROR'; renderAll(); return; }
      if (!RV.session.privacyOk) { RV.loginErr = '请先阅读并勾选《隐私政策》与《用户协议》。'; RV.state = 'ERROR'; renderAll(); return; }
      RV.loginErr = '';
      RV.session.independent = true;
      RV.session.loggedIn = true;
      RV.session.realname = 'none';
      RV.session.phone = 'bound';
      RV.session.phoneMasked = maskPhone(lp2);
      RV.session.smsPhone = lp2.slice(0, 3) + '****' + lp2.slice(-4);
      syncSimControls();
      go(RV.pageId === 'WEB-LOGIN-01' ? 'WEB-REALNAME-01' : 'APP-REALNAME-01', 'FORM');
      flash(RV.session.pendingBuy ? '手机号验证通过：请完成实名认证后继续购买' : '手机号验证通过：已登录商城手机号账号，请完成实名认证');
      return;
    }
    case 'platform-login': {
      RV.session.independent = false;
      RV.session.loggedIn = true;
      RV.session.realname = 'verified';
      /* 平台不提供手机号：平台账号登录后手机号仍为未绑定，需用户主动绑定商城账号。 */
      RV.session.phone = 'unbound';
      RV.session.phoneMasked = '';
      RV.loginErr = '';
      syncSimControls();
      if (RV.session.pendingBuy) {
        flash('已通过所属平台账号登录（模拟），继续原购买流程');
        resumePendingBuy();
      } else {
        go('APP-MINE-01', 'LOGGED_IN');
        flash('已通过所属平台账号登录（模拟）；平台账号与手机号账号不合并');
      }
      return;
    }
    case 'real-demo': {
      RV.session.realDemo = true;
      RV.session.realName = '演示用户';
      RV.session.realId = '000000000000000000';
      renderAll(); return;
    }
    case 'real-submit': {
      var rn = String(RV.session.realName || '').replace(/^\s+|\s+$/g, '');
      var rid = String(RV.session.realId || '').replace(/\s/g, '');
      if (!rn) { RV.realErr = '请输入姓名（可使用演示资料）。'; RV.state = 'FAILED'; renderAll(); return; }
      if (!/^\d{17}[\dXx]$/.test(rid)) { RV.realErr = '请输入 18 位身份证号（可使用演示资料）。'; RV.state = 'FAILED'; renderAll(); return; }
      if (!RV.session.realAgree) { RV.realErr = '请先勾选《实名认证授权与隐私政策》。'; RV.state = 'FAILED'; renderAll(); return; }
      RV.realErr = '';
      RV.session.realDemo = false;
      RV.session.realName = '';
      RV.session.realId = '';
      RV.session.realname = 'verified';
      if (RV.session.pendingBuy) {
        flash('实名认证成功（模拟），继续原购买流程');
        resumePendingBuy();
      } else {
        go(RV.pageId === 'WEB-REALNAME-01' ? 'WEB-REALNAME-02' : 'APP-REALNAME-02', 'SUCCESS');
        flash('实名认证成功（模拟，未调用真实服务商）；可开始购买');
      }
      return;
    }
    case 'otab': { RV.orderTab = t.getAttribute('data-tab'); renderAll(); return; }
    case 'mine-order': {
      /* 「我的」页的订单入口：按被点击的状态直接落到订单列表的对应页签。
         此前固定跳 APP-ORDER-01，PC 上点会跳进移动端画布（CHG-0048 一并修）。 */
      RV.orderTab = t.getAttribute('data-tab') || '全部';
      go(p.end === 'WEB' ? 'WEB-ORDER-01' : 'APP-ORDER-01', undefined);
      flash('已按所选状态进入我的订单（页签：' + RV.orderTab + '）');
      return;
    }
    case 'mine-platform': {
      var rvReal = RV.session.realname;
      if (rvReal === 'verified' || rvReal === 'minor') {
        go(isWebEnd() ? 'WEB-REALNAME-02' : 'APP-REALNAME-02', rvReal === 'minor' ? 'MINOR' : 'SUCCESS');
      } else {
        go(isWebEnd() ? 'WEB-REALNAME-01' : 'APP-REALNAME-01', 'FORM');
      }
      return;
    }
    case 'pay-query': {
      flash('已向服务端查询支付结果（模拟）：结果未明确前保持「支付确认中」，请勿重复付款');
      go('APP-PAYRET-01', 'TIMEOUT');
      return;
    }
    case 'pay-continue': {
      if (!RV.session.agreementOk) { RV.session.panelPrompt = true; RV.state = 'PANEL'; flash('未勾选《购买协议》，已弹出购买须知', 'err'); renderAll(); return; }
      /* PC 走收银台扫码弹窗（CHG-0048）：按所选支付方式出码 → 扫码 → 渠道确认 → 弹窗内提示成功。
         此前两端共用同一段跳转，PC 上点「继续支付」会直接跳到移动端画布。 */
      if (p.end === 'WEB') {
        RV.state = 'QR_WAIT'; renderAll();
        flash('已打开收银台：请使用「' + payChannelName(RV.session.pay) + '」扫码付款');
        return;
      }
      RV.state = 'SUBMITTING'; renderAll();
      var p2 = currentPage();
      setTimeout(function () {
        if (RV.sim === 'timeout' || RV.sim === 'fail') { go('APP-PAYRET-01', 'TIMEOUT'); }
        else { RV.session.orderPaid = true; RV.state = 'DEFAULT'; go('APP-RESULT-01', 'DELIVERED'); }
      }, 600);
      return;
    }
    /* 收银台扫码弹窗三态与渠道切换 */
    /* PC 我的订单：点行打开详情抽屉。行上一直标着 data-act="open-drawer"，
       但从来没有对应的处置函数——点了没反应，口令码也看不到（本轮修）。 */
    case 'open-drawer': {
      if (RV.pageId !== 'WEB-ORDER-01') return;
      RV.drawerOpen = true; RV.drawerOrder = t.getAttribute('data-order') || null;
      renderAll(); return;
    }
    case 'close-drawer': { RV.drawerOpen = false; RV.drawerOrder = null; renderAll(); return; }
    /* 后台侧边菜单（CHG-0054）：收起为窄条、分组的展开与收起。
       用 sb- 前缀：adm- 会被 handleAct 开头转交给 handleAdm。 */
    case 'sb-collapse': {
      RV.admCollapsed = !RV.admCollapsed;
      renderAll();
      flash(RV.admCollapsed ? '侧边栏已收起为窄条，鼠标悬停菜单项可看名称' : '侧边栏已展开');
      return;
    }
    case 'sb-group': {
      var gname = t.getAttribute('data-g');
      var gi = RV.admClosedGroups.indexOf(gname);
      if (gi < 0) { RV.admClosedGroups.push(gname); } else { RV.admClosedGroups.splice(gi, 1); }
      renderAll();
      return;
    }
    case 'pay-qr-scanned': { RV.state = 'QR_CONFIRMING'; renderAll(); flash('已模拟用户扫码付款，等待渠道确认支付结果'); return; }
    case 'pay-qr-confirm': {
      RV.state = 'QR_SUCCESS'; RV.session.orderPaid = true; renderAll();
      flash('支付成功：订单已计入「我的订单」，可在那里复制口令码');
      return;
    }
    case 'pay-qr-cancel': { RV.state = 'DEFAULT'; renderAll(); flash('已取消支付，订单仍为待支付'); return; }
    case 'pay-qr-close': { RV.state = 'DEFAULT'; renderAll(); flash('已关闭收银台弹窗'); return; }
    case 'pay-choose': { go(stepPage('PAYRET'), 'QUERYING'); setTimeout(function () { resolvePayQuery(t.getAttribute('data-choose')); }, 700); return; }
    case 'pay-query-again': case 'pay-query-again-here': { flash('已重新向服务端查询支付结果（模拟）'); return; }
    case 'open-wework': { if (RV.sim === 'fail') { RV.state = 'FALLBACK'; renderAll(); flash('无法唤起企业微信，已展示备用提示', 'err'); } else { flash('已唤起企业微信（模拟）。实际可用性需在两个 App 与 PC 容器分别验证。'); } return; }
    case 'noop': { flash('该入口为说明性占位，具体形式待联调/评审确认'); return; }
    default: return;
  }
}
/* 模拟所属平台实名流程：返回后重新核验并继续原购买（PRD AUTH-08、AUTH-10、5.1）
   返回结果由"模拟身份 → 实名与成年"决定，便于评审分段验证各分支。 */
function doPlatformAuth() {
  var s = RV.session;
  if (s.independent) { go('APP-REALNAME-01', 'FORM'); return; }
  if (s.authBusy) return;
  s.authBusy = true;
  flash('已唤起所属平台实名流程（模拟），正在等待平台返回可信结果…');
  renderAll();
  setTimeout(function () {
    s.authBusy = false;
    var sel = $('#simReal');
    var back = sel ? sel.value : 'verified';
    /* 处于"未获取/未实名"时，认证动作本身按成功（成年）返回 */
    if (back === 'none') back = 'verified';
    s.realname = back;
    syncSimControls();
    if (back === 'minor') {
      s.panelMsg = '根据实名认证结果，您当前为未成年人，暂不可购买商品。';
      go(stepPage('PRODUCT'), 'PANEL');
      flash('平台返回：已实名但未成年。已停止本次购买并保留现场。', 'err');
      return;
    }
    if (back === 'unknown') {
      s.panelMsg = '暂时无法核验您的实名信息，请稍后重试。';
      go(stepPage('PRODUCT'), 'PANEL');
      flash('平台未返回可信实名结果（模拟失败）。已停止本次购买。', 'err');
      return;
    }
    s.panelMsg = '';
    s.panelOpen = true;
    go(stepPage('PRODUCT'), 'PANEL');
    flash('平台返回：已实名且成年（模拟）。已返回商城重新核验，继续原购买流程。');
    setTimeout(doBuy, 260);
  }, 650);
}
/* 模拟身份控件的双向同步：评审工具，不进业务画布、不产生业务事件 */
function syncSimControls() {
  var s = RV.session;
  var L = $('#simLogin'), R = $('#simReal'), P = $('#simPhone'), H = $('#simHint');
  if (!L) return;
  var rv = (s.realname === 'verified' || s.realname === 'minor' || s.realname === 'unknown') ? s.realname : 'none';
  var pv = (s.phone === 'bound' || s.phone === 'unknown') ? s.phone : 'unbound';
  L.value = s.loggedIn ? '1' : '0';
  R.value = rv;
  P.value = pv;
  if (H) {
    H.textContent = '当前：' + (s.loggedIn ? '已登录' : '未登录') + ' · ' +
      ({ verified: '已实名成年', minor: '已实名未成年', unknown: '核验失败/未知', none: '未获取/未实名' })[rv] + ' · ' +
      ({ bound: '手机号已绑定', unknown: '手机号状态未知', unbound: '手机号未绑定' })[pv];
  }
}
function resumePendingBuy() {
  var end = RV.session.pendingBuyEnd || 'APP';
  var gid = RV.session.pendingBuyGoods || RV.goodsId;
  RV.session.pendingBuy = false;
  if (end === 'WEB') {
    RV.session.panelOpen = true;
    go('WEB-PRODUCT-01', 'DEFAULT', gid);
  } else {
    go('APP-PRODUCT-01', 'PANEL', gid);
  }
  setTimeout(doBuy, 120);
}
function doBuy() {
  /* 校验优先级：实名认证及成年资格 > 购买协议同意 > 手机号绑定验证（PRD 5.1） */
  var s = RV.session;
  if (!s.loggedIn) {
    s.pendingBuy = true;
    s.pendingBuyEnd = RV.end;
    s.pendingBuyGoods = RV.goodsId;
    go('APP-LOGIN-01', 'DEFAULT');
    flash('购买前需登录：可使用商城手机号账号或所属平台账号登录');
    return;
  }
  if (s.realname === 'none' || s.realname === 'unknown') {
    /* 平台渠道能提供可信实名结果时，状态应为 verified/minor；none/unknown 表示
       未认证或平台无法提供，按评审口径引导用户填写姓名与证件号完成认证。 */
    s.authPromptReason = s.realname;
    if (isWebEnd()) {
      s.authPrompt = true;
      s.panelOpen = true;
      renderAll();
      flash('核验结果：未实名或平台无法提供实名信息 → 弹窗提示前往认证。', 'err');
      return;
    }
    go('APP-AUTH-01', 'SHOWN');
    flash('核验结果：未实名或平台无法提供实名信息 → 弹窗提示前往认证。', 'err');
    return;
  }
  if (s.realname === 'minor') {
    s.panelMsg = '根据实名认证结果，您当前为未成年人，暂不可购买商品。';
    renderAll();
    flash('核验结果：已实名但未成年 → 不可交易，不继续协议或手机号步骤。', 'err');
    return;
  }
  s.panelMsg = '';
  if (!s.agreementOk) {
    s.panelPrompt = true; RV.state = 'PANEL_AGREE'; renderAll();
    flash('已实名成年但未同意协议 → 先提示《购买须知》。', 'err');
    return;
  }
  doVerifyAfterAgreement();
}
function doVerifyAfterAgreement() {
  var s = RV.session;
  if (s.phone === 'unbound') {
    s.bindFrom = 'BUY'; s.bindChange = false; s.bindErr = '';
    s.bindSmsSent = false; s.bindSmsPhone = ''; s.bindPhone = ''; s.bindCode = ''; s.bindAgree = false;
    go(isWebEnd() ? 'WEB-PHONE-01' : 'APP-PHONE-01', 'DEFAULT');
    flash('协议已通过 → 再核验手机号：未绑定，进入商城账号绑定页', 'err');
    return;
  }
  if (s.phone === 'unknown') { flash('手机号状态未知：不唤起支付，需重试或核查', 'err'); return; }
  /* 商品可售校验（CHG-0092）：我方在架但供应商已下架、或库存快照为 0 时，不允许下单。
     库存为快照，真实结果仍以供应商发货接口为准；好友赠送不校验库存。 */
  var buyGoods = g(RV.goodsId || 'P1001');
  var buyBlock = goodsBlockReason(buyGoods, wayOf(buyGoods), RV.session.spec || buyGoods.ver);
  if (buyBlock) {
    s.panelMsg = buyBlock + (buyBlock.indexOf('补货') === 0 ? '；采购账户余额不足，运营正在补货。' : '。');
    s.panelOpen = true; renderAll();
    flash(buyBlock, 'err');
    return;
  }
  s.busy = true; RV.state = 'PANEL'; renderAll();
  setTimeout(function () {
    s.busy = false; s.pendingOrder = MOCK_ORDER.no;
    /* 新建订单：清掉"从订单列表继续支付"带入的旧订单号，避免结算页沿用上一个订单；
       同时写入本次商品/交付方式快照，确保确认订单页的库存提示对应实际购买商品（CHG-0099）。 */
    s.resumeOrder = '';
    s.order = {
      no: MOCK_ORDER.no,
      goodsId: buyGoods.id,
      type: wayOf(buyGoods),
      spec: s.spec || buyGoods.ver,
      amount: buyGoods.price
    };
    renderAll();
    flash('全部条件通过：已创建订单（模拟）并唤起微信 / 支付宝支付。');
    /* PC：订单创建后直接进 PC 确认订单页并打开收银台扫码弹窗（评审要求"点击购买按钮后弹窗出码"）。
       移动端仍按"离开商城完成支付后返回"处理：询问是否已完成支付，按服务端查询结果继续（PRD 5.3、PAY-07）。 */
    if (isWebEnd()) {
      go('WEB-CHECKOUT-01', 'QR_WAIT');
      flash('全部条件通过：已创建订单（模拟），收银台已打开，请扫码付款。');
      return;
    }
    setTimeout(function () {
      if (RV.sim === 'timeout' || RV.sim === 'fail') {
        go('APP-PAYRET-01', 'TIMEOUT');
        flash('支付返回：查询仍未取得结论 → 保持"支付结果确认中"，可重新查询或联系客服。');
      } else {
        go('APP-PAYRET-01', 'SHOWN');
        flash('支付返回：无可用结论 → 询问"是否已完成支付"。两个选项都会触发服务端查询。');
      }
    }, 650);
  }, 450);
}
function resolvePayQuery(choose) {
  /* 用户的选择只用于表达其操作情况，不修改订单状态；去向由服务端查询结果决定（PRD PAY-08、PAY-09）。
     本原型用顶部"模拟结果"代表服务端返回：正常＝已支付、空数据＝明确未支付、超时/失败＝仍无结论。 */
  var choiceText = choose === 'Y' ? '已支付' : '未支付';
  if (RV.sim === 'timeout' || RV.sim === 'fail') {
    go(stepPage('PAYRET'), isWebEnd() ? 'SHOWN' : 'TIMEOUT');
    flash('您选择了「' + choiceText + '」，服务端查询仍无结论 → 保持"支付结果确认中"。');
    return;
  }
  if (RV.sim === 'empty') {
    go(stepPage('CHECKOUT'), 'DEFAULT');
    flash('您选择了「' + choiceText + '」，服务端查询结果为「明确未支付且订单有效」→ 进入确认订单页继续支付同一订单。');
    return;
  }
  RV.session.orderPaid = true;
  go(stepPage('RESULT'), 'DELIVERED');
  flash('您选择了「' + choiceText + '」，服务端查询结果为「已支付」→ 进入交付结果页。以服务端结果为准，不按用户自述判定。');
}
function handleAdm(act, t) {
  var id = RV.pageId, rt = admRT(id), cfg = ADM_CFG[id];
  if (!cfg) return;
  switch (act) {
    /* 破坏性操作的二次确认（CHG-0060）。这两个动作以 adm- 开头，
       必须留在 handleAdm 内——handleAct 会把所有 adm- 前缀的动作整体转交到这里，
       放到主 switch 里就永远走不到。 */
    case 'adm-confirm-ok': { admConfirmOk(); return; }
    case 'adm-confirm-cancel': { admConfirmCancel(); return; }
    case 'adm-query': admCommit(id); return;
    case 'adm-adv': rt.advOpen = !rt.advOpen; rt.msg = rt.advOpen ? '高级筛选已展开：填写值会保留，收起不清除条件' : '高级筛选已收起：已提交条件仍然生效'; renderAll(); return;
    case 'adm-tab': {
      rt.tab = t.getAttribute('data-tab'); rt.page = 1; rt.sel = []; rt.drawer = null;
      var extra = cfg.tabs && cfg.tabs.indexOf('全部') < 0 ? '（该页签作为数据源切换，不使用状态过滤）' : '';
      rt.msg = '已切换到「' + rt.tab + '」' + extra + '，其他条件保留'; rt.msgKind = '';
      admQuery(id); renderAll(); return;
    }
    case 'adm-page': {
      var pg = Number(t.getAttribute('data-page'));
      var total = admFiltered(cfg, rt).length;
      var pages = Math.max(1, Math.ceil(total / rt.size));
      if (pg < 1 || pg > pages) return;
      rt.page = pg; rt.sel = []; rt.drawer = null;
      rt.msg = '已翻到第 ' + pg + ' 页'; renderAll(); return;
    }
    case 'adm-reset': {
      admResetRT(id);
      var rt2 = admRT(id);
      rt2.msg = '已重置：清空普通/高级条件、错误、选中记录与页码，恢复默认页签与数据范围；旧查询回调已作废。'; rt2.msgKind = '';
      admQuery(id); renderAll(); return;
    }
    case 'adm-refresh': {
      var rt3 = admRT(id); var ver = admQuery(id);
      rt3.msg = '刷新：保留当前已提交查询上下文重新请求…';
      renderAll();
      setTimeout(function () {
        if (admIsStale(id, ver)) return;
        rt3.msg = '刷新完成：' + admFiltered(cfg, rt3).length + ' 条（模拟数据）'; rt3.msgKind = 'ok'; renderAll();
      }, 400);
      return;
    }
    case 'adm-selclear': { rt.sel = []; rt.msg = '已清除选择'; renderAll(); return; }
    case 'adm-open': {
      if (!cfg.drawer) return;
      rt.drawer = true; rt.drawerId = t.getAttribute('data-rowid'); rt.msg = '';
      renderAll(); return;
    }
    case 'adm-close-drawer': {
      rt.hmDraft = null; rt.hmMsg = ''; rt.hmMsgKind = ''; rt.pickOpen = false; rt.pickFor = null; rt.pickMode = null;
      rt.gdDraft = null; rt.regOpen = false; rt.regDraft = null; rt.regQ = '';   // 商品编辑草稿与地区子层（CHG-0069）
      rt.gdPrev = '';                                                          // 素材预览选中项（CHG-0074）
      rt.sysQ = null; rt.sysHit = null; rt.sysSearched = false;                 // 硬件配置的搜索态（CHG-0072）
      rt.srDraft = null;                                                       // 搜索推荐配置草稿（CHG-0075）
      rt.srPickOpen = false; rt.srPickQ = ''; rt.srPickSel = '';               // 商品选择子层（CHG-0077）
      rt.userOpen = false; rt.userOrderNo = '';                                // 用户信息弹窗（CHG-0078）
      rt.codeDraft = null; rt.codeViewMode = false;                            // 人工补发草稿与只读态（CHG-0081／0092）
      rt.refundMode = false; rt.refundDraft = null; rt.refundErr = '';          // 订单退款（CHG-0086）
      rt.agreeEditMode = false; rt.agreeDraft = null; rt.agreeErr = '';          // 协议编辑（CHG-0089）
      rt.rbacNewRole = false; rt.rbacDraft = null; rt.rbacErr = '';             // 权限配置（CHG-0089）
      rt.drawer = null; rt.drawerId = null; renderAll(); return; }
    /* ---- 首页配置管理（CHG-0056）：素材增删、拖拽排序、图片上传、商品选择、轮播间隔 ---- */
    case 'adm-hm-add': {
      var d0 = rt.hmDraft;
      if (!d0) return;
      if (d0.items.length >= ADM_BANNER_MAX) { rt.hmMsg = '最多配置 ' + ADM_BANNER_MAX + ' 个广告，需先删除已有广告。'; rt.hmMsgKind = 'err'; renderAll(); return; }
      d0.items.push({ id: 'BI-' + (++RV.hmSeq), img: '', goodsId: '' });
      renderAll(); return;
    }
    case 'adm-hm-del': {
      var d1 = rt.hmDraft, delId = t.getAttribute('data-item');
      var k1 = d1.items.map(function (x) { return x.id; }).indexOf(delId);
      if (k1 < 0) return;
      d1.items.splice(k1, 1);
      renderAll(); return;
    }
    case 'adm-hm-pick': {
      rt.pickFor = t.getAttribute('data-item');
      rt.pickMode = 'banner';
      rt.pickQ = ''; rt.pickSel = '';
      var cur = rt.hmDraft.items.filter(function (x) { return x.id === rt.pickFor; })[0];
      if (cur && cur.goodsId) rt.pickSel = cur.goodsId;
      rt.pickOpen = true; renderAll();
      var qi = document.getElementById('hmPickQ'); if (qi) qi.focus();
      return;
    }
    case 'adm-hm-pick-ok': { rt.pickSel = t.getAttribute('data-goods'); renderAll(); return; }
    case 'adm-hm-pick-cancel': { rt.pickOpen = false; rt.pickFor = null; rt.pickQ = ''; rt.pickSel = ''; renderAll(); return; }
    case 'adm-hm-pick-confirm': {
      if (!rt.pickSel) return;
      var d5 = rt.hmDraft;
      if (rt.pickMode === 'hot') {
        if (d5.hot.indexOf(rt.pickSel) < 0) d5.hot.push(rt.pickSel);
      } else {
        var it = d5.items.filter(function (x) { return x.id === rt.pickFor; })[0];
        if (it) it.goodsId = rt.pickSel;
      }
      rt.pickOpen = false; rt.pickFor = null; rt.pickMode = null; rt.pickQ = ''; rt.pickSel = '';
      rt.hmMsgKind = '';
      renderAll(); return;
    }
    /* ---- 首页商品列表的热门商品（CHG-0058）---- */
    case 'adm-hm-hot-add': {
      rt.pickFor = null; rt.pickMode = 'hot';
      rt.pickQ = ''; rt.pickSel = '';
      rt.pickOpen = true; renderAll();
      var qi2 = document.getElementById('hmPickQ'); if (qi2) qi2.focus();
      return;
    }
    case 'adm-hm-hot-del': {
      var gid2 = t.getAttribute('data-goods'), d3 = rt.hmDraft;
      var k3 = d3.hot.indexOf(gid2);
      if (k3 < 0) return;
      d3.hot.splice(k3, 1);
      renderAll(); return;
    }
    case 'adm-hm-save': {
      var d2 = rt.hmDraft, row = ADM_HOME_BLOCKS.filter(function (x) { return x.id === rt.drawerId; })[0];
      if (!row) {
        rt.hmMsg = '记录已不存在，请刷新后重试。'; rt.hmMsgKind = 'err';
        flash('保存失败：记录已不存在，请刷新后重试', 'err'); renderAll(); return;
      }
      if (row.type === 'banner') {
        /* 轮播间隔：不允许为空或 0；填入 0 或清空按 1 秒兜底（评审 CHG-0056） */
        var iv = parseInt(String(d2.interval).replace(/[^0-9]/g, ''), 10);
        if (!iv || iv <= 0) iv = 1;      // 为空或 0 按 1 秒兜底
        d2.interval = iv;                // 无论是否兜底都归一为整数，避免把字符串写回配置
        for (var k2 = 0; k2 < d2.items.length; k2++) {
          if (!d2.items[k2].img || !d2.items[k2].goodsId) {
            rt.hmMsg = '每条广告都需同时具备图片与商品：第 ' + (k2 + 1) + ' 条尚未配置完整。';
            rt.hmMsgKind = 'err';
            admToast('配置保存失败！', 'err');          // 统一文案
            flash('配置保存失败：第 ' + (k2 + 1) + ' 条广告尚未配置完整', 'err');
            renderAll(); return;          // 留在抽屉内，就地标红
          }
        }
      }
      row.items = d2.items ? d2.items.map(function (x) { return Object.assign({}, x); }) : row.items;
      if (row.type === 'banner') row.interval = d2.interval;
      row.scope = d2.scope;
      if (d2.hot) row.hot = d2.hot.slice();
      row.opBy = ADM_ROLE.name;
      row.opAt = (RV.hmNow || '2026-10-16 14:30');
      rt.hmMsg = ''; rt.hmMsgKind = '';

      /* 保存成功：关闭抽屉，并把结果挂到工作区顶部的提示条（rt.msg），
         不能只写在抽屉底部——抽屉本身可能已经滚出视口，等于没有反馈（评审 CHG-0057）。 */
      var done = '配置已保存成功！';   // 统一文案（CHG-0062）
      rt.drawer = null; rt.drawerId = null;
      rt.hmDraft = null; rt.hmMsg = ''; rt.hmMsgKind = '';
      rt.pickOpen = false; rt.pickFor = null; rt.pickMode = null; rt.pickQuery = ''; rt.pickSel = '';
      rt.msg = done; rt.msgKind = 'ok';
      admToast(done);            // 工作区内看得见的那一个
      flash(done);               // 评审外壳说明列里的那一个
      renderAll(); return;
    }

    /* 入口按钮（编辑/查看）：打开独立弹窗（CHG-0066）。 */
    case 'adm-rowact': {
      var rn = t.getAttribute('data-rn'), rid = t.getAttribute('data-row');
      rt.drawer = true; rt.drawerId = rid;
      /* 协议管理：点行「查看」时回到只读态；编辑按钮单独进入编辑态（CHG-0089） */
      if (RV.pageId === 'ADM-AGREE-01') {
        rt.agreeEditMode = false; rt.agreeDraft = null; rt.agreeErr = '';
      }
      /* 权限管理：按行准备角色菜单草稿或账号角色草稿（CHG-0089） */
      if (RV.pageId === 'ADM-RBAC-01') {
        rt.rbacNewRole = false; rt.rbacErr = '';
        var roleRow = ADM_ROLES.filter(function (x) { return x.id === rid; })[0];
        if (roleRow) rt.rbacDraft = { nm: roleRow.nm, desc: roleRow.desc || '', menus: roleRow.menus.slice() };
        else {
          var accRow = ADM_ACCOUNTS.filter(function (x) { return x.id === rid; })[0];
          rt.rbacDraft = { role: accRow ? accRow.role : (ADM_ROLES[0] && ADM_ROLES[0].nm) };
        }
      }
      /* 订单管理：点「退款」打开退款表单；点「查看」回到详情（CHG-0086） */
      if (RV.pageId === 'ADM-ORDER-01') {
        rt.refundMode = (rn === '退款');
        rt.refundDraft = { reason: '' };
        rt.refundErr = '';
      }
      /* 口令码交付：未处理订单进入编辑态；已处理订单只读查看（CHG-0092） */
      if (RV.pageId === 'ADM-CODE-01') {
        rt.codeViewMode = (rn === '查看');
        rt.codeDraft = rt.codeViewMode ? null : { reason: '', code: '' };
      }
      /* 可售库存：自有库存可进入调整态；API 采购只读同步记录（CHG-0096） */
      if (RV.pageId === 'ADM-STOCK-01') {
        rt.stockEdit = (rn === '调整库存');
        rt.stockDraft = { id: rid, deltas: {}, reason: '' };
        rt.stockCodeSku = '';
      }
      /* 首页配置管理：按所点记录深拷贝一份编辑草稿，只有「保存配置」才写回 */
      if (RV.pageId === 'ADM-HOME-01') {
        var hr = ADM_HOME_BLOCKS.filter(function (x) { return x.id === rid; })[0];
        if (hr && typeof admHomeDraft === 'function') rt.hmDraft = admHomeDraft(hr);
        rt.hmMsg = ''; rt.hmMsgKind = '';
      }
      /* 搜索推荐配置：把该行拷成编辑草稿，只有「保存」才写回（CHG-0075） */
      if (RV.pageId === 'ADM-SEARCH-01') {
        var sl0 = rt.tab === '搜索热门商品' ? ADM_SEARCH_GOODS : ADM_SEARCH_KW;
        var sr0 = sl0.filter(function (x) { return x.id === rid; })[0];
        if (sr0) rt.srDraft = { id: sr0.id, w: sr0.w || '', gid: sr0.gid || '', on: sr0.on };
      }
      rt.msg = '已打开「' + rn + '」弹窗，记录ID：' + rid;
      rt.msgKind = '';
      renderAll(); return;
    }
    /* 订单管理：点用户名称打开用户信息弹窗（CHG-0078） */
    case 'adm-order-user': {
      rt.userOrderNo = t.getAttribute('data-row');
      rt.userOpen = true;
      renderAll(); return;
    }
    case 'adm-order-user-close': {
      rt.userOpen = false; rt.userOrderNo = '';
      renderAll(); return;
    }
    /* 热门商品：点开商品选择子层（CHG-0077） */
    case 'adm-sr-pick-open': {
      if (!rt.srDraft) return;
      rt.srPickOpen = true;
      rt.srPickQ = '';
      rt.srPickSel = rt.srDraft.gid || '';
      renderAll();
      var spi = document.getElementById('srPickQ'); if (spi) spi.focus();
      return;
    }
    case 'adm-sr-pick-sel': {
      rt.srPickSel = t.getAttribute('data-goods');
      /* 选中只切高亮，不重渲染整页——否则列表会重建、滚动位置丢失 */
      document.querySelectorAll('#srPickMask .hm-grow').forEach(function (x) {
        x.setAttribute('aria-selected', x.getAttribute('data-goods') === rt.srPickSel ? 'true' : 'false');
      });
      var okb = document.querySelector('#srPickMask [data-act="adm-sr-pick-ok"]');
      if (okb) okb.disabled = false;
      return;
    }
    case 'adm-sr-pick-ok': {
      if (!rt.srDraft || !rt.srPickSel) return;
      rt.srDraft.gid = rt.srPickSel;
      rt.srPickOpen = false; rt.srPickQ = ''; rt.srPickSel = '';
      renderAll(); return;
    }
    case 'adm-sr-pick-cancel': {
      rt.srPickOpen = false; rt.srPickQ = ''; rt.srPickSel = '';
      renderAll(); return;
    }
    /* 搜索推荐配置：新增关键词 / 添加商品（CHG-0075） */
    case 'adm-sr-add': {
      var isG0 = rt.tab === '搜索热门商品';
      rt.srDraft = { id: '__new__', w: '', gid: '', on: '启用' };
      rt.drawer = true; rt.drawerId = '__new__';
      rt.msg = '已打开「' + (isG0 ? '添加商品' : '新增关键词') + '」弹窗';
      rt.msgKind = '';
      renderAll(); return;
    }
      /* 协议管理：编辑、发布、富文本格式（CHG-0089）。 */
    case 'adm-agree-edit': {
      var curAg = ADM_AGREE_ROWS.filter(function (x) { return x.stat === '生效中'; })[0] || ADM_AGREE_ROWS[0];
      rt.agreeEditMode = true; rt.agreeErr = '';
      rt.agreeDraft = { body: curAg ? curAg.body : '' };
      rt.drawer = true; rt.drawerId = '__newver__';
      renderAll(); return;
    }
    case 'adm-agree-publish': {
      var ed = document.getElementById('agreeEditor');
      var html = ed ? ed.innerHTML : ((rt.agreeDraft && rt.agreeDraft.body) || '');
      var text = String(html).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, '');
      if (!text) { rt.agreeErr = '协议正文不能为空。'; renderAll(); return; }
      var body = sanitizeAgreeHtml(html);
      var now = '2026-10-16 15:40';
      ADM_AGREE_ROWS.forEach(function (x) { if (x.stat === '生效中') x.stat = '已停用'; });
      var newest = ADM_AGREE_ROWS[0];
      var newVer = bumpAgreeVersion(newest ? newest.ver : 'V1.0');
      ADM_AGREE_ROWS.unshift({ id: 'AG-' + newVer, ver: newVer, title: '购买协议', pub: now, stat: '生效中',
        orders: 0, mode: '后台发布', note: '后台发布新版本', op: ADM_ROLE.name, body: body });
      rt.agreeEditMode = false; rt.agreeDraft = null; rt.agreeErr = '';
      rt.drawer = null; rt.drawerId = null;
      rt.msg = '协议已发布并生效（模拟）：' + newVer + '，生效时间 ' + now + '。';
      rt.msgKind = 'ok';
      admToast('协议已发布并生效！'); flash('协议已发布并生效（模拟）');
      renderAll(); return;
    }
    case 'adm-agree-fmt': {
      var cmd = t.getAttribute('data-cmd');
      var edFmt = document.getElementById('agreeEditor');
      if (!edFmt) return;
      if (AGREE_SEL) { var selF = window.getSelection(); selF.removeAllRanges(); selF.addRange(AGREE_SEL); }
      edFmt.focus();
      try { document.execCommand(cmd, false, null); } catch (e) {}
      if (rt.agreeDraft) rt.agreeDraft.body = edFmt.innerHTML;
      return;
    }
    /* 权限管理：新增角色、保存角色/菜单权限/账号角色（CHG-0089）。 */
    case 'adm-rbac-add-role': {
      rt.rbacNewRole = true; rt.rbacErr = '';
      rt.rbacDraft = { nm: '', desc: '', menus: [] };
      rt.drawer = true; rt.drawerId = '__newrole__';
      renderAll(); return;
    }
    case 'adm-rbac-save': {
      var d = rt.rbacDraft || {};
      var isRole = rt.rbacNewRole || ADM_ROLES.some(function (x) { return x.id === rt.drawerId; });
      if (isRole) {
        var nm = String(d.nm || '').replace(/^\s+|\s+$/g, '');
        if (!nm) { rt.rbacErr = '角色名称不能为空。'; renderAll(); return; }
        if (!(d.menus && d.menus.length)) { rt.rbacErr = '请至少选择一个菜单权限。'; renderAll(); return; }
        var existing = ADM_ROLES.filter(function (x) { return x.id === rt.drawerId; })[0];
        if (existing) {
          existing.nm = nm; existing.desc = String(d.desc || '').replace(/^\s+|\s+$/g, '');
          existing.menus = d.menus.slice(); existing.updatedAt = '2026-10-16 15:40'; existing.op = ADM_ROLE.name;
        } else {
          ADM_ROLES.push({ id: 'ROLE-' + String(ADM_ROLES.length + 1).padStart(2, '0'), nm: nm,
            desc: String(d.desc || '').replace(/^\s+|\s+$/g, ''), acc: 0, menus: d.menus.slice(),
            updatedAt: '2026-10-16 15:40', op: ADM_ROLE.name });
        }
        rt.msg = existing ? '角色权限已保存（模拟）。' : '角色已新增（模拟）。';
      } else {
        var acc = ADM_ACCOUNTS.filter(function (x) { return x.id === rt.drawerId; })[0];
        if (!acc) { rt.rbacErr = '该账号已不存在。'; renderAll(); return; }
        acc.role = d.role || acc.role;
        rt.msg = '账号角色已更新（模拟）。';
      }
      rt.rbacNewRole = false; rt.rbacDraft = null; rt.rbacErr = '';
      rt.drawer = null; rt.drawerId = null;
      rt.msgKind = 'ok';
      admToast(isRole ? '权限已保存！' : '角色已保存！'); flash('权限配置已保存（模拟）');
      renderAll(); return;
    }
    /* 可售库存：展开/收起 SKU 脱敏码池（CHG-0096） */
    case 'adm-stock-codes': {
      var skuC = t.getAttribute('data-sku');
      rt.stockCodeSku = rt.stockCodeSku === skuC ? '' : skuC;
      renderAll(); return;
    }
    /* 钉钉通知记录（CHG-0096） */
    case 'adm-ding-open': {
      rt.dingOpen = true; renderAll(); return;
    }
    case 'adm-ding-close': {
      rt.dingOpen = false; renderAll(); return;
    }
    case 'adm-ding-order': {
      var dno = t.getAttribute('data-order');
      var ort = admRT('ADM-ORDER-01');
      ort.committed = ort.committed || {};
      ort.committed.no = dno || '';
      ort.tab = '全部';
      rt.dingOpen = false;
      go('ADM-ORDER-01', 'RESULTS');
      flash('已跳转订单管理并按订单号筛选：' + (dno || '—'));
      return;
    }
    /* 通知模板管理（CHG-0088）。 */
    case 'adm-tpl-open': {
      rt.tplOpen = true; rt.tplEditId = null; rt.tplDraft = null; rt.tplErr = ''; rt.tplMsg = '';
      renderAll(); return;
    }
    case 'adm-tpl-close': {
      rt.tplOpen = false; rt.tplEditId = null; rt.tplDraft = null; rt.tplErr = ''; rt.tplMsg = '';
      renderAll(); return;
    }
    case 'adm-tpl-edit': {
      var tid = t.getAttribute('data-id');
      var tpl = ADM_NOTIFY_TPLS.filter(function (x) { return x.id === tid; })[0];
      if (!tpl) { rt.msg = '该模板已不存在，请刷新后重试。'; rt.msgKind = 'err'; renderAll(); return; }
      rt.tplOpen = true; rt.tplEditId = tid;
      rt.tplDraft = { name: tpl.name, title: tpl.title, body: tpl.body, status: tpl.status };
      rt.tplErr = ''; rt.tplMsg = '';
      renderAll(); return;
    }
    case 'adm-tpl-back': {
      rt.tplEditId = null; rt.tplDraft = null; rt.tplErr = ''; renderAll(); return;
    }
    case 'adm-tpl-preview': { renderAll(); return; }
    case 'adm-tpl-save': {
      var tp = ADM_NOTIFY_TPLS.filter(function (x) { return x.id === rt.tplEditId; })[0];
      var td = rt.tplDraft || {};
      if (!tp) { rt.tplErr = '该模板已不存在，请刷新后重试。'; renderAll(); return; }
      var tn = String(td.name || '').replace(/^\s+|\s+$/g, '');
      var tt = String(td.title || '').replace(/^\s+|\s+$/g, '');
      var tb = String(td.body || '').replace(/^\s+|\s+$/g, '');
      if (!tn || !tt || !tb) { rt.tplErr = '模板名称、标题与正文均不能为空。'; renderAll(); return; }
      if (/\{\{\s*code\s*\}\}/.test(tb)) {
        rt.tplErr = '正文不能使用 {{code}} 变量；请使用 {{code_masked}}，不要发送完整口令码（CODE-08）。';
        renderAll(); return;
      }
      var vn = parseInt(String(tp.ver).replace(/[^0-9]/g, ''), 10) || 1;
      tp.name = tn; tp.title = tt; tp.body = tb; tp.status = td.status || '启用';
      tp.ver = 'V' + (vn + 1);
      tp.updatedAt = '2026-10-16 15:40'; tp.op = ADM_ROLE.name;
      rt.tplEditId = null; rt.tplDraft = null; rt.tplErr = '';
      rt.tplMsg = '模板「' + tn + '」已保存并生成 ' + tp.ver + '；历史通知保留原版本快照。';
      admToast('模板已保存！'); flash('通知模板已保存（模拟）');
      renderAll(); return;
    }
    /* 订单退款：先校验原因，再弹二次确认；确认后才写退款（CHG-0086）。 */
    case 'adm-refund-submit': {
      var rr = ADM_ORDERS.filter(function (x) { return x.no === rt.drawerId; })[0];
      if (!rr) { rt.msg = '该订单已不存在，请刷新后重试。'; rt.msgKind = 'err'; renderAll(); return; }
      if (rr.state !== '待发货' && rr.state !== '已完成') {
        rt.refundErr = '只有待发货/已完成的订单可以退款。'; renderAll(); return;
      }
      var reason = String((rt.refundDraft && rt.refundDraft.reason) || '').replace(/^\s+|\s+$/g, '');
      if (!reason) { rt.refundErr = '请填写退款原因后再提交。'; renderAll(); return; }
      rt.refundErr = '';
      rt.confirm = {
        act: 'adm-refund-confirm', attrs: {},
        title: '确认对该订单退款？',
        body: '订单 ' + rr.no + '，退款金额 ' + CNY(rr.amount) + '；退款原因：' + reason + '。',
        obj: '用户：' + rr.buyer + '　商品：' + rr.goods,
        ok: '确认退款',
        note: '退款为敏感操作，提交后进入退款处理；不得仅改订单状态而未确认资金退回（8.3）。原型为模拟。',
        tone: 'danger'
      };
      renderAll(); return;
    }
    case 'adm-refund-confirm': {
      var ro = ADM_ORDERS.filter(function (x) { return x.no === rt.drawerId; })[0];
      var rreason = String((rt.refundDraft && rt.refundDraft.reason) || '').replace(/^\s+|\s+$/g, '');
      if (!ro || !rreason) { rt.msg = '退款提交失败：订单或原因缺失。'; rt.msgKind = 'err'; renderAll(); return; }
      ro.refundStatus = '退款中';
      ro.state = '待发货';   // 退款中不改主状态（CHG-0096）
      ro.refundReason = rreason;
      ro.refundOp = ADM_ROLE.name;
      ro.refundAt = '2026-10-16 15:40';
      ro.refundAmount = ro.amount;
      rt.refundMode = false; rt.refundDraft = null; rt.refundErr = '';
      rt.drawer = null; rt.drawerId = null;
      rt.msg = '退款已提交（模拟）：订单 ' + ro.no + '，金额 ' + CNY(ro.amount) + '；退款中订单仍为「待发货」，资金结果以渠道回执为准。';
      rt.msgKind = 'ok';
      admToast('退款已提交！'); flash('退款已提交（模拟）');
      renderAll(); return;
    }
    /* 直行动作：就地执行并回执，不打开弹窗（CHG-0066）。 */
    case 'adm-rowdo': {
      var dn = t.getAttribute('data-rn'), did = t.getAttribute('data-row');
      /* 订单管理：确认退款完成（CHG-0096）。资金结果应以渠道回执为准，原型只做状态演示。 */
      if (RV.pageId === 'ADM-ORDER-01' && dn === '退款完成') {
        var rord = ADM_ORDERS.filter(function (x) { return x.no === did; })[0];
        if (!rord) { rt.msg = '该订单已不存在，请刷新后重试。'; rt.msgKind = 'err'; admToast('操作失败！', 'err'); renderAll(); return; }
        rord.refundStatus = '成功';
        rord.state = '已退款';
        rord.refundDoneAt = '2026-10-22 10:10';
        rt.msg = '订单 ' + did + ' 退款已完成（模拟）：订单转为「已退款」，前台不再展示有效口令码。';
        rt.msgKind = 'ok';
        admToast('退款完成！'); flash('退款完成（模拟）'); renderAll(); return;
      }
      /* 口令码交付 → 订单管理：带订单号筛选，退款仍在订单管理执行（CHG-0096）。 */
      if (RV.pageId === 'ADM-CODE-01' && dn === '订单管理') {
        var ort2 = admRT('ADM-ORDER-01');
        ort2.committed = ort2.committed || {};
        ort2.committed.no = did;
        ort2.tab = '全部';
        go('ADM-ORDER-01', 'RESULTS');
        flash('已跳转订单管理并按订单号筛选：' + did);
        return;
      }
      /* 好友赠送：状态由运营手动推进（CHG-0079）。写回的是 ADM_ORDERS 的对象本身，
         因此订单管理的「交付」列会同步变化，不需要另存一份状态。 */
      if (RV.pageId === 'ADM-GIFT-01') {
        var giftRec = ADM_GIFT_ROWS.filter(function (x) { return x.no === did; })[0];
        if (!giftRec) {
          rt.msg = '该订单已不在赠送队列中，请刷新后重试。'; rt.msgKind = 'err';
          admToast('操作失败！', 'err'); renderAll(); return;
        }
        if (/开始处理/.test(dn)) {
          giftRec.gift = '处理中';
          giftRec.giftOp = ADM_ROLE.name; giftRec.giftOpAt = '2026-10-16 15:40';   // 原型固定时间
          rt.msg = '订单 ' + did + ' 已标记为「处理中」。订单管理的「交付」仍为「未交付」（处理中不等于已交付）。';
          rt.msgKind = 'ok';
          admToast('已开始处理！'); flash('已开始处理！'); renderAll(); return;
        }
        if (/标记完成/.test(dn)) {
          giftRec.gift = '已完成';
          giftRec.giftOp = ADM_ROLE.name; giftRec.giftOpAt = '2026-10-16 15:40';
          /* 赠送人工确认完成即交付完成；已支付+已交付转为已完成 */
          giftRec.deliver = '已交付';
          if (giftRec.pay === '已支付') giftRec.state = '已完成';
          rt.msg = '订单 ' + did + ' 已标记为「已完成」。订单管理的「交付」同步更新为「已交付」，订单转为「已完成」。';
          rt.msgKind = 'ok';
          admToast('已完成！'); flash('已完成！'); renderAll(); return;
        }
      }
      /* 搜索推荐配置的启用/停用与删除（CHG-0075）：直接作用于当前页签的数据源。
         启停可逆、不二次确认；删除已由确认层拦过一次。 */
      if (RV.pageId === 'ADM-SEARCH-01') {
        var srList = rt.tab === '搜索热门商品' ? ADM_SEARCH_GOODS : ADM_SEARCH_KW;
        var srRec = srList.filter(function (x) { return x.id === did; })[0];
        if (!srRec) {
          rt.msg = '该配置已不存在，请刷新列表后重试。'; rt.msgKind = 'err';
          admToast('操作失败！', 'err'); flash('操作失败：该配置已不存在', 'err'); renderAll(); return;
        }
        var srName = srRec.w || (ADM_GOODS.filter(function (g) { return g.id === srRec.gid; })[0] || {}).nm || srRec.id;
        if (/删除/.test(dn)) {
          var srIdx = srList.indexOf(srRec);
          if (srIdx >= 0) srList.splice(srIdx, 1);
          rt.msg = '已删除「' + srName + '」。前台不再展示该条配置。'; rt.msgKind = 'ok';
          admToast('删除成功！'); flash('删除成功！'); renderAll(); return;
        }
        if (/启用|停用/.test(dn)) {
          var willOn = srRec.on !== '启用';
          srRec.on = willOn ? '启用' : '停用';
          rt.msg = (willOn ? '已启用「' : '已停用「') + srName + '」。' +
            (willOn ? '前台将展示该条配置（在展示位范围内）。' : '前台不再展示该条配置。');
          rt.msgKind = 'ok';
          admToast(willOn ? '已启用！' : '已停用！'); renderAll(); return;
        }
      }
      if (/上架|下架/.test(dn)) {
        /* 上架/下架真正改商品状态（CHG-0070）：确认层已拦过一次，这里只做写入与回执 */
        var gd9 = ADM_GOODS.filter(function (x) { return x.id === did; })[0];
        if (!gd9) { rt.msg = '该商品已不存在，请刷新列表后重试。'; rt.msgKind = 'err'; admToast('操作失败！', 'err'); flash('操作失败：该商品已不存在', 'err'); renderAll(); return; }
        var up = gd9.status !== '在售';
        gd9.status = up ? '在售' : '已下架';
        var done = up ? '上架成功！' : '下架成功！';
        rt.msg = done + '「' + gd9.nm + '」当前状态：' + gd9.status + '。'
          + (up ? '上架后前端商城可浏览与购买。' : '下架不影响已有关联订单的查看与查收（9.2）。');
        rt.msgKind = 'ok';
        admToast(done);      // 工作区内看得见的那个（CHG-0070）
        flash(done);         // 评审外壳说明列里的那个
        renderAll(); return;
      }
      if (/同步/.test(dn)) { rt.msg = '已发起一次同步（模拟）。调用超时或返回不明时先查询或人工核对，不无限重试。记录ID：' + did; rt.msgKind = ''; admToast('已发起同步！'); }
      else if (/开始处理/.test(dn)) { rt.msg = '已标记为处理中（模拟）。记录ID：' + did; rt.msgKind = 'ok'; admToast('已标记为处理中！'); }
      else if (/重试/.test(dn)) { rt.msg = '已发起一次重试（模拟）。失败原因保留，仍失败可再次重试或转人工核查。记录ID：' + did; rt.msgKind = 'ok'; admToast('已发起重试！'); }
      else { rt.msg = '已执行「' + dn + '」（模拟）。记录ID：' + did; rt.msgKind = 'ok'; admToast('已执行「' + dn + '」！'); }
      renderAll(); return;
    }
    /* ---- 商品编辑（CHG-0069）：规格增删、地区选择子层、素材删除 ---- */
    case 'adm-gd-spec-add': {
      var gd1 = rt.gdDraft; if (!gd1) return;
      gd1.specs.push({ nm: '', price: '' });
      renderAll(); return;
    }
    case 'adm-gd-spec-del': {
      var gd2 = rt.gdDraft; if (!gd2) return;
      if (gd2.specs.length <= 1) return;                    // 至少保留一条
      var si = Number(t.getAttribute('data-idx'));
      if (!(si >= 0 && si < gd2.specs.length)) return;
      gd2.specs.splice(si, 1);
      renderAll(); return;
    }
    case 'adm-gd-region-open': {
      var gd3 = rt.gdDraft; if (!gd3) return;
      rt.regDraft = gd3.regions.slice(); rt.regQ = ''; rt.regOpen = true;
      renderAll(); return;
    }
    case 'adm-gd-region-del': {
      var gd4 = rt.gdDraft, rx = t.getAttribute('data-region');
      if (!gd4) return;
      var ri = gd4.regions.indexOf(rx);
      if (ri >= 0) gd4.regions.splice(ri, 1);
      renderAll(); return;
    }
    case 'adm-gd-region-ok': {
      var gd5 = rt.gdDraft;
      if (!gd5 || !rt.regDraft || !rt.regDraft.length) return;
      /* 保持 Steam 地区表的原始顺序，避免每次打开顺序都变 */
      gd5.regions = ADM_REGIONS.filter(function (x) { return rt.regDraft.indexOf(x) >= 0; });
      rt.regOpen = false; rt.regDraft = null; rt.regQ = '';
      renderAll(); return;
    }
    case 'adm-gd-region-cancel': {
      rt.regOpen = false; rt.regDraft = null; rt.regQ = '';
      renderAll(); return;
    }
    /* 素材预览切换（CHG-0074）：按素材 id 记住当前预览项，
        id 失效（被删/被换）时由渲染函数回落到第一张。 */
    case 'adm-gd-prev': {
      var pv = t.getAttribute('data-item');
      if (pv) rt.gdPrev = pv;
      renderAll(); return;
    }
    case 'adm-gd-media-del': {
      var gd6 = rt.gdDraft; if (!gd6) return;
      var mi = Number(t.getAttribute('data-idx'));
      if (!(mi >= 0 && mi < gd6.media.length)) return;
      /* 删掉的正好是当前预览项时，把选中清掉，由渲染函数回落到第一张（CHG-0074） */
      if (gd6.media[mi].id === rt.gdPrev) rt.gdPrev = '';
      gd6.media.splice(mi, 1);
      renderAll(); return;
    }
    /* ---- 供应商价格手动更新（CHG-0098） ---- */
    case 'adm-gd-price-sync': {
      var gdp = ADM_GOODS.filter(function (x) { return x.id === rt.drawerId; })[0];
      if (!gdp) { rt.gdPriceMsg = '商品已不存在，请刷新后重试。'; renderAll(); return; }
      var base = admGoodsPrice(gdp);
      gdp.steamPrice = Math.round(base * 1.18 * 100) / 100;
      gdp.steamLowPrice = Math.round(base * 0.95 * 100) / 100;
      gdp.lowestPrice = Math.round(base * 0.90 * 100) / 100;
      gdp.supplierPrice = Math.round(base * 0.72 * 100) / 100;
      gdp.priceSyncAt = '2026-10-22 14:05';
      rt.gdPriceMsg = '已获取最新供应商价格（模拟），同步时间 2026-10-22 14:05；仅供定价参考。';
      admToast('已获取最新价格（模拟）');
      renderAll(); return;
    }
    /* ---- 硬件配置（CHG-0072）：按游戏名搜索 Steam 配置 → 采用推荐配置 ---- */
    case 'adm-gd-sys-search': {
      var gs = rt.gdDraft; if (!gs) return;
      var sq = String(rt.sysQ == null ? gs.nm : rt.sysQ).trim();
      rt.sysQ = sq; rt.sysSearched = true;
      /* 内置表按名称匹配；空关键词不返回任何结果，也不编造配置 */
      rt.sysHit = sq
        ? (ADM_STEAM_SYS.filter(function (x) { return x.nm.toLowerCase().indexOf(sq.toLowerCase()) >= 0; })[0] || null)
        : null;
      renderAll(); return;
    }
    case 'adm-gd-sys-apply': {
      var ga = rt.gdDraft; if (!ga || !rt.sysHit) return;
      ga.sys.min = Object.assign({}, rt.sysHit.rec);
      ga.sys.rec = Object.assign({}, rt.sysHit.rec);
      ga.sys.from = 'steam';
      ga.sys.at = RV.gdNow || '2026-10-16 15:40';   // 原型固定时间，不取真实时钟
      admToast('已采用 Steam 推荐配置！');
      renderAll(); return;
    }
    case 'adm-export': case 'adm-batch': {
      var n = t.getAttribute('data-bn') || '导出当前结果';
      var scope = rt.sel.length ? ('已选 ' + rt.sel.length + ' 条') : ('当前已提交条件全部 ' + admFiltered(cfg, rt).length + ' 条');
      rt.exportState = 'DONE';
      rt.msg = n + '：范围＝' + scope + '；已生成模拟文件并记录批次与操作人。' + (cfg.exportNote || '') + '导出操作不自动代表赠送完成（GIFT-03）。';
      rt.msgKind = 'ok';
      renderAll(); return;
    }
    case 'adm-save': case 'adm-publish': case 'adm-sync': case 'adm-resend-submit': case 'adm-done-submit':
    case 'adm-start': case 'adm-except': case 'adm-refund-approve': case 'adm-refund-reject':
    case 'adm-requery': case 'adm-retry': case 'adm-note': { admAction(act, rt, t); return; }
    case 'adm-goto': { go(t.getAttribute('data-goto')); return; }
    case 'adm-logout': { go('ADM-LOGIN-01'); return; }
    case 'adm-login': {
      var u = ($('#admUser') || {}).value || '', pw = ($('#admPwd') || {}).value || '';
      RV.admUser = u; RV.admPwd = pw;
      if (!u.trim() || !pw.trim()) { RV.admLoginErr = '请输入账号与密码'; renderAll(); return; }
      if (RV.sim === 'fail') { RV.admLoginErr = '账号或密码不正确（模拟）。连续失败锁定策略待技术确认。'; renderAll(); return; }
      RV.admLoginErr = ''; RV.admBusy = true; renderAll();
      setTimeout(function () { RV.admBusy = false; go('ADM-HOME-01'); flash('登录成功（模拟），已进入首页配置管理'); }, 500);
      return;
    }
    case 'adm-noperm-toggle': { var r = admRT(id); r.noperm = false; r.msg = '已切换为有权限角色（演示）。服务端仍会按角色重新校验。'; renderAll(); return; }
    default: return;
  }
}
/* 弹窗提交前的非空校验：正文里标了 data-adm-req="字段名" 的输入必须非空（CHG-0068）。
   校验失败时就地标红并留在弹窗内，不静默通过。取不到弹窗（非弹窗场景）时不拦截。 */
function admModalValidate() {
  var m = document.getElementById('admModal');
  if (!m || !m.querySelectorAll) return null;
  var bad = null;
  Array.prototype.forEach.call(m.querySelectorAll('[data-adm-req]'), function (el) {
    var v = (el.value == null ? '' : String(el.value)).trim();
    if (!v) { bad = bad || el.getAttribute('data-adm-req'); }
  });
  return bad;
}

/* 弹窗内的动作（CHG-0068）。
   提交类（保存、发布、提交处理结果、完成确认、退款审核）成功后**关闭弹窗回到列表**；
   就地动作（立即同步、发起查询、授权重试、记录备注／异常）留在弹窗内。
   无论哪一类，反馈都走画布内的浮层提示——原来的 rt.msg 渲染在列表顶部，
   弹窗打开时被遮罩盖住，等于没有反馈。 */
function admAction(act, rt, t) {
  var map = {
    'adm-save':           ['已保存草稿（模拟）。草稿不直接影响线上，需发布后生效。', 'ok', '配置已保存成功！', '配置保存失败！'],
    'adm-publish':        ['已发布并生效（模拟）。三个入口共用同一套配置，不开发分平台装修能力（2.2）。', 'ok', '已发布并生效！', '发布失败！'],
    'adm-resend-submit':  ['已提交人工补发（模拟）。记录含原因、补录口令码、操作人与时间；前台展示补录后的交付内容。系统已校验关联订单与重复提交，并与自动任务协调避免重复交付。', 'ok', '人工补发已提交！', '提交失败！'],
    'adm-done-submit':    ['已完成确认（模拟）。仅运营核实好友收到后方可标记完成；导出不等于完成。', 'ok', '已完成确认！', '提交失败！'],
    'adm-refund-approve': ['已提交审核通过并执行退款（模拟）。资金结果以渠道回执确认；不得仅改状态而未确认资金退回（8.3）。', 'ok', '审核已通过，退款执行中！', '提交失败！'],
    'adm-refund-reject':  ['已拒绝退款（模拟），需填写拒绝原因并留痕', '', '已拒绝退款！', '提交失败！'],
    'adm-sync':           ['已发起同步（模拟）。库存与可售状态以供应商返回为准，异常保留上次有效值。', '', '已发起同步！', '同步失败！'],
    'adm-requery':        ['已发起一次服务端查询（模拟）。结果未明确时保持"支付结果确认中"，不判未付、不发码。', '', '已发起服务端查询！', '查询失败！'],
    'adm-retry':          ['已提交授权重试（模拟）。重试前已校验当前订单与交付记录；已退款或交付内容已被替换时不发送过时成功文案。', 'ok', '已提交授权重试！', '重试失败！'],
    'adm-note':           ['已记录核查说明（模拟），并保留操作人、时间与原因。', '', '已记录核查说明！', '记录失败！'],
    'adm-except':         ['已记录异常（模拟），需补充异常说明以便后续追溯', '', '已记录异常！', '记录失败！']
  };
  /* 提交类：成功后关闭弹窗回列表 */
  var COMMIT = ['adm-save', 'adm-publish', 'adm-resend-submit', 'adm-done-submit',
                'adm-refund-approve', 'adm-refund-reject'];
  var m = map[act] || ['已执行（模拟）', '', '已完成（模拟）！', '执行失败！'];
  if (RV.pageId === 'ADM-STOCK-01' && act === 'adm-save') {
    m = ['库存调整已保存（模拟）：已写入库存台账，前台可售数量同步更新。', 'ok', '库存调整已保存！', '库存调整失败！'];
  }
  var commit = COMMIT.indexOf(act) >= 0;

  var cfg = ADM_CFG[RV.pageId] || {};

  /* 提交前把关：先查标了 data-adm-req 的必填项，再交给页面自己的 commitDraft 做业务校验
     （商品编辑的多规格／交付类型／地区校验就挂在 commitDraft 上）。任一不过都留在弹窗内。 */
  if (commit) {
    var bad = null;
    var missing = admModalValidate();
    if (missing) bad = '保存失败：' + missing + '不能为空。';
    else if (typeof cfg.commitDraft === 'function') bad = cfg.commitDraft(rt) || null;
    if (bad) {
      rt.msg = bad; rt.msgKind = 'err';
      admToast(m[3], 'err');
      flash(bad, 'err');
      renderAll(); return;                 // 留在弹窗内，草稿保留
    }
  }
  rt.msg = m[0]; rt.msgKind = m[1];
  if (commit && typeof cfg.afterCommit === 'function') cfg.afterCommit(rt);
  if (commit) {
    rt.drawer = null; rt.drawerId = null;
    rt.hmDraft = null; rt.hmMsg = ''; rt.hmMsgKind = '';
    rt.pickOpen = false; rt.pickFor = null; rt.pickMode = null; rt.pickQuery = ''; rt.pickSel = '';
    admToast(m[2]);                        // 工作区内看得见的那一个
    flash(m[2]);                           // 评审外壳说明列里的那一个
  } else {
    admToast(m[2]);
  }
  renderAll();
}

/* ============================================================
   流程与图示 / 文档阅读器 / 初始化
   ============================================================ */
/* 图示区默认只列标题，点击后在弹层内查看离线 SVG，不在页面底部平铺全部图示 */
function diagKind(id) {
  var p = String(id || '').split('-')[0].toUpperCase();
  return (p === 'FL' || p === 'SM' || p === 'SEQ') ? p : 'DGM';
}
/* 广告位自动轮播（03 登记：多图时本地计时切换；页面不可见、悬停或聚焦时暂停）。
   计时器全局唯一——每次重绘先清掉旧的，避免画布被替换后仍留着定时任务。
   单图配置不启动（单图不显示指示器与箭头）。 */
var BANNER_TIMER = null;
function stopBannerTimer() { if (BANNER_TIMER) { clearInterval(BANNER_TIMER); BANNER_TIMER = null; } }
function startBannerTimer() {
  stopBannerTimer();
  var host = $('#canvas [data-banner-rotator]');
  if (!host || (BANNERS || []).length < 2) return;
  BANNER_TIMER = setInterval(function () {
    if (document.hidden || !document.querySelector('#canvas [data-banner-rotator]')) { stopBannerTimer(); return; }
    RV.banner = (((RV.banner | 0) + 1) % BANNERS.length);
    renderAll();
  }, 4000);
  host.addEventListener('mouseenter', stopBannerTimer);
  host.addEventListener('mouseleave', startBannerTimer);
  host.addEventListener('focusin', stopBannerTimer);
  host.addEventListener('focusout', startBannerTimer);
}
function bootDiagrams() {
  var host = $('#diagramBody');
  var list = (window.DIAGRAMS || []);
  if (!list.length) {
    host.innerHTML = '<div class="dgm-empty">［暂无图示］04 与 05 中的 PlantUML 图源会在构建时渲染为 SVG 并内嵌到此。</div>';
    $('#diagramSummary').textContent = '0 张';
    return;
  }
  var kinds = { FL: '流程', SM: '状态机', SEQ: '时序' };
  var counts = { FL: 0, SM: 0, SEQ: 0, DGM: 0 };
  list.forEach(function (d) { counts[diagKind(d.id)]++; });
  host.innerHTML = '<div class="dgm-list">' + list.map(function (d, i) {
    var k = diagKind(d.id);
    return '<button class="dgm-item" type="button" data-act="dgm-open" data-dgm="' + i + '">' +
      '<span class="tag">' + esc(kinds[k] || '图示') + '</span>' +
      '<span class="grow">' + esc(d.title) + '</span>' +
      '<span class="xsmall muted">' + esc(d.from) + '</span></button>';
  }).join('') + '</div>';
  $('#diagramSummary').textContent = '共 ' + list.length + ' 张（流程 ' + counts.FL + ' · 状态机 ' + counts.SM +
    ' · 时序 ' + counts.SEQ + '），点击标题在弹层内查看，PlantUML 图源可折叠';
  $('#diagramArea').style.display = '';
}
/* 图示缩放：宽图（如 FL-PAY-001）按弹层宽度缩放后字号会小到读不了，
   因此提供缩放档位；「适应宽度」仍是默认，超过 2 倍宽度的图自动改用 100% 并允许横向滚动。 */
function applyDgmZoom() {
  var box = $('#dgmBody'); if (!box) return;
  var fig = box.querySelector('.puml-fig'); if (!fig) return;
  var svg = fig.querySelector('svg'); if (!svg) return;
  var w = Number(fig.getAttribute('data-w')) || svg.getBoundingClientRect().width || 800;
  var avail = box.clientWidth - 28;
  var z = $('#dgmZoom') ? $('#dgmZoom').value : 'fit';
  var scale = z === 'fit' ? Math.min(1, avail / w) : Number(z) || 1;
  if (z === 'fit' && scale < 0.55) scale = 1;   /* 缩得太狠就按原始大小显示，改为横向滚动 */
  svg.style.width = Math.round(w * scale) + 'px';
  svg.style.height = 'auto';
  svg.style.maxWidth = 'none';
  fig.setAttribute('data-zoom', String(scale.toFixed(2)));
}
function openDiagram(i) {
  var d = (window.DIAGRAMS || [])[i];
  if (!d) return;
  $('#dgmTitle').textContent = d.title;
  $('#dgmMeta').textContent = '编号：' + d.id + '　来源：' + d.from + ' 文档　PlantUML 离线渲染（构建期出图，运行时不联网）';
  $('#dgmBody').innerHTML = renderDiagram(d.src);
  $('#dgmSrcPre').textContent = d.src;
  $('#dgmSrcBox').style.display = 'none';
  $('#dgmSrcBox').open = false;
  $('#dgmZoom').value = 'fit';
  $('#dgmBody').scrollTop = 0;
  $('#dgmBody').scrollLeft = 0;
  $('#dgmMask').classList.add('on');
  applyDgmZoom();
  $('#dgmClose').focus();
}
function closeDiagram() {
  $('#dgmMask').classList.remove('on');
}
function bootReader() {
  var docs = window.DOCS || [];
  $('#readerEntryList').innerHTML = docs.map(function (d, i) {
    return '<button class="btn sm" type="button" data-act="open-doc" data-doc="' + i + '">' + esc(d.file) + '</button>';
  }).join('');
  $('#readerEntryNote').textContent = docs.length
    ? ('共 ' + docs.length + ' 份 MD 全文已内嵌，可离线阅读与下载；无网络、无本地服务依赖。')
    : '［未内嵌文档］请在构建时把 9 份主 MD 注入本原型。';
  $('#readerList').innerHTML = docs.map(function (d, i) {
    return '<button type="button" data-act="reader-doc" data-doc="' + i + '" aria-pressed="false">' + esc(d.file) + '</button>';
  }).join('');
  $('#readerSelect').innerHTML = '<option value="">— 选择文档 —</option>' + docs.map(function (d, i) {
    return '<option value="' + i + '">' + esc(d.file) + '</option>';
  }).join('');
  $('#readerSelect').addEventListener('change', function () { if (this.value !== '') openDoc(Number(this.value)); });
}
function openDoc(i) {
  var docs = window.DOCS || [];
  var d = docs[i];
  if (!d) return;
  if (RV.readerOpen && RV.readerDoc !== null) {
    RV.readerScroll[RV.readerDoc] = $('#readerDoc').scrollTop;
    RV.readerHist.push(RV.readerDoc);
    if (RV.readerHist.length > 30) RV.readerHist.shift();
  }
  RV.readerOpen = true; RV.readerDoc = i;
  $('#readerMask').classList.add('on');
  $('#readerTitle').textContent = d.file;
  $('#readerMeta').textContent = '交付批次：' + (d.batch || '—') + '　文档版本：' + (d.ver || '—') + '　字符数：' + (d.md || '').length;
  $('#readerDoc').innerHTML = renderMd(d.md);
  buildToc();
  $$('#readerList button').forEach(function (b) { b.setAttribute('aria-pressed', Number(b.getAttribute('data-doc')) === i ? 'true' : 'false'); });
  $('#readerSelect').value = String(i);
  setTimeout(function () {
    $('#readerDoc').scrollTop = RV.readerScroll[i] || 0;
    $('#readerDoc').focus();
  }, 0);
}
function buildToc() {
  /* 章节目录改为正文顶部的标签条（两栏阅读区，不设第三栏）。
     用索引定位：同一页面内可能有多个渲染区，避免依赖全局唯一的 id。 */
  var secs = $$('#readerDoc [data-sec]').filter(function (el) { return /md-h[1-3]/.test(el.className); });
  window.__READER_SECS = secs;
  $('#readerToc').innerHTML = '<span class="toc-h">章节目录（共 ' + secs.length + ' 项，点击定位）</span>' +
    (secs.length ? secs.map(function (el, idx) {
      var lv = Number(('' + el.className).match(/md-h(\d)/)[1]);
      return '<a href="#' + el.id + '" data-act="toc" data-idx="' + idx + '"' +
        (lv > 1 ? ' style="font-weight:' + (lv === 2 ? '500' : '400') + '"' : '') + '>' + esc(el.textContent) + '</a>';
    }).join('') : '<span class="hint">该文档未解析到标题层级。</span>');
  $('#readerToc').onclick = function (e) {
    var a = e.target.closest('[data-act="toc"]');
    if (!a) return;
    e.preventDefault();
    var el = (window.__READER_SECS || [])[Number(a.getAttribute('data-idx'))];
    if (!el) { flash('章节不存在或文档已切换', 'err'); return; }
    var scroller = $('#readerDoc');
    var top = Math.max(0, el.offsetTop - scroller.offsetTop - 8);
    /* 只滚动阅读区自身。长文档跨度可达数万像素，CSS 的 scroll-behavior:smooth
       会让这类跳转缓慢爬行，因此此处显式使用 instant 立即定位。 */
    try { scroller.scrollTo({ top: top, behavior: 'instant' }); }
    catch (err) {
      var prev = scroller.style.scrollBehavior;
      scroller.style.scrollBehavior = 'auto';
      scroller.scrollTop = top;
      scroller.style.scrollBehavior = prev;
    }
  };
}
function closeReader() {
  RV.readerOpen = false;
  $('#readerMask').classList.remove('on');
  var entry = $('#readerEntry');
  if (entry) { var b = entry.querySelector('button'); if (b) b.focus(); }
}
function downloadDoc(i) {
  var d = (window.DOCS || [])[i];
  if (!d) return;
  var blob = new Blob([d.md], { type: 'text/markdown;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = d.file;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
}
function boot() {
  /* 端 */
  $('#fEnd').innerHTML = ENDS.map(function (e) { return '<option value="' + e[0] + '">' + e[1] + '</option>'; }).join('');
  $('#fEnd').value = 'ALL';
  $('#fEnd').addEventListener('change', function () { setEnd(this.value); refreshPageSelect(); });
  /* 页面 */
  function refreshPageSelect() {
    var list = PAGES.filter(function (p) { return RV.end === 'ALL' || p.end === RV.end; });
    $('#fPage').innerHTML = list.map(function (p) { return '<option value="' + p.id + '">' + p.name + '（' + p.id + '）</option>'; }).join('');
    $('#fPage').value = RV.pageId || '';
  }
  window.refreshPageSelect = refreshPageSelect;
  $('#fPage').addEventListener('change', function () { go(this.value); });
  /* 状态 */
  $('#fState').addEventListener('change', function () { setState(this.value); });
  /* 组件选择器（下拉框）：选中即展示该组件的十节说明与其本页评审注释 */
  $('#compPicker').addEventListener('change', function () { pickComp(this.value); });
  /* 模拟结果 */
  $('#fSim').addEventListener('change', function () { RV.sim = this.value; renderAll(); });
  $('#btnReset').addEventListener('click', function () {
    resetSession(); RV.kw = ''; RV.sort = '推荐'; RV.orderTab = '全部'; RV.goodsId = null; RV.banner = 0;
    RV.sim = 'ok'; $('#fSim').value = 'ok'; RV.drawerOpen = false;
    Object.keys(ADM_RT).forEach(function (k) { admResetRT(k); });
    RV.admUser = ''; RV.admPwd = ''; RV.admLoginErr = ''; RV.admBusy = false;
    RV.end = 'ALL'; $('#fEnd').value = 'ALL';
    RV.pageId = 'APP-HOME-01'; RV.state = 'RESULTS'; RV.selectedComponent = null; RV.outline = false;
    $('#btnOutline').setAttribute('aria-pressed', 'false'); document.body.classList.remove('outline-on');
    refreshPageSelect(); renderAll();
    flash('已重置：清除本轮模拟输入、错误、处理中状态与授权选择，回到明确初始态');
  });
  $('#btnOutline').addEventListener('click', function () {
    RV.outline = !RV.outline;
    this.setAttribute('aria-pressed', RV.outline ? 'true' : 'false');
    document.body.classList.toggle('outline-on', RV.outline);
    applySel();
    flash(RV.outline ? '已开启辅助描边：仅描边当前所选组件，不改变布局与业务操作' : '已关闭辅助描边（保留当前选择与说明）');
  });
  $('#btnDiagrams').addEventListener('click', function () {
    var el = $('#diagramArea');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#btnReader').addEventListener('click', function () {
    var el = $('#readerEntry');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act="open-doc"]');
    if (t) { openDoc(Number(t.getAttribute('data-doc'))); return; }
    var r = e.target.closest('[data-act="reader-doc"]');
    if (r) { openDoc(Number(r.getAttribute('data-doc'))); return; }
  });
  $('#readerClose').addEventListener('click', closeReader);
  $('#readerDownload').addEventListener('click', function () { downloadDoc(RV.readerDoc); });
  $('#readerBack').addEventListener('click', function () {
    if (!RV.readerHist.length) { flash('没有上一份文档', 'err'); return; }
    var prev = RV.readerHist.pop();
    RV.readerOpen = false; RV.readerDoc = null;
    openDoc(prev);
  });
  $('#readerMask').addEventListener('click', function (e) { if (e.target === this) closeReader(); });
  /* 模拟身份控件（评审工具）：直接设定交易前置条件，便于分段评审 */
  [['simLogin', 'loggedIn'], ['simReal', 'realname'], ['simPhone', 'phone']].forEach(function (pair) {
    var el = $('#' + pair[0]);
    if (!el) return;
    el.addEventListener('change', function () {
      var s = RV.session;
      if (pair[1] === 'loggedIn') s.loggedIn = (el.value === '1');
      else if (pair[1] === 'realname') s.realname = el.value;
      else s.phone = el.value;
      s.panelMsg = '';
      syncSimControls();
      renderAll();
      flash('模拟身份已更新（评审工具，不产生业务事件）：' + ($('#simHint') ? $('#simHint').textContent : ''));
    });
  });
  var simOk = $('#btnSimOk');
  if (simOk) simOk.addEventListener('click', function () {
    var s = RV.session;
    s.loggedIn = true; s.realname = 'verified'; s.phone = 'bound';
    s.panelMsg = ''; s.panelPrompt = false;
    syncSimControls(); renderAll();
    flash('已设为可购买状态：已登录 + 已实名成年 + 手机号已绑定。可继续走完购买与支付流程。');
  });
  syncSimControls();
  /* 图示弹层 */
  $('#dgmClose').addEventListener('click', closeDiagram);
  $('#dgmSrc').addEventListener('click', function () {
    var b = $('#dgmSrcBox');
    var on = b.style.display === 'none';
    b.style.display = on ? 'block' : 'none';
    b.open = on;
  });
  $('#dgmMask').addEventListener('click', function (e) { if (e.target === this) closeDiagram(); });
  $('#dgmZoom').addEventListener('change', applyDgmZoom);
  window.addEventListener('resize', function () {
    if ($('#dgmMask').classList.contains('on')) applyDgmZoom();
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act="dgm-open"]');
    if (t) { e.preventDefault(); openDiagram(Number(t.getAttribute('data-dgm'))); }
  });
  /* 键盘可达：Enter/Space 触发卡片类角色按钮；搜索框内 Enter 等价于点击同容器的搜索按钮 */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target;
    if (t && t.tagName === 'INPUT') {
      /* 只处理 Enter：空格在输入框里必须照常输入空格 */
      if (e.key !== 'Enter') return;
      var sc = (t.closest && t.closest('form, .card, [data-component]')) || document;
      var btn = sc.querySelector('[data-act="search"]');
      if (btn) { e.preventDefault(); handleAct('search', btn, e); }
      return;
    }
    if (t && t.getAttribute && t.getAttribute('role') === 'button' && t.hasAttribute('data-act')) {
      e.preventDefault(); handleAct(t.getAttribute('data-act'), t, e);
    }
  });
  /* 窗口尺寸变化时只回填实测宽度，不重绘画布（重绘会丢失滚动位置与临时草稿） */
  var rsTimer = null;
  window.addEventListener('resize', function () {
    if (rsTimer) clearTimeout(rsTimer);
    rsTimer = setTimeout(function () { syncDeskWidth($('#canvas')); }, 120);
  }, { passive: true });
  bindActs();
  bindAdmHomeDnD();
  bindAdmGoodsDnD();
  bindAdmSearchDnD();
  bootDiagrams();
  bootReader();
  RV.pageId = 'APP-HOME-01'; RV.state = 'RESULTS';
  refreshPageSelect();
  renderAll();
}
document.addEventListener('DOMContentLoaded', boot);
