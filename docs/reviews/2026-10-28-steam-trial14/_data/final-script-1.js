
/* ============================================================
   APP 客户端：模拟数据与共用渲染件
   ============================================================ */
/* 全部为模拟数据，不代表生产配置（评审说明中已声明） */
/* ways：该商品配置支持的「发货方式」集合（取自商品／规格真实配置，PRD 4.4）。
   只有一种时面板不提供切换，只有展示；type 为默认发货方式，也决定列表卡片的类型标签。
   sys 为硬件配置，取自供应商资料，缺资料时区块整体隐藏（不生成占位内容）。
   详情页的介绍正文只有一个「游戏介绍」区块，取自后台商品编辑里运营填写的文本（CHG-0071）；
   原先各商品自带的供应商简介（brief）已不再单独展示，字段一并移除。 */
const GOODS = [
  { id:'P1001', nm:'孤刃：影逝二度', en:'Lone Blade', price:128.00, type:'CODE', ways:['CODE','GIFT'], ver:'标准版', ver2:'年度版', dl:'口令码自动发码', lang:'简体中文 / 英语',
    sys:{ os:'Windows 10 64 位', cpu:'Intel Core i5-8400 / AMD Ryzen 5 2600', ram:'8 GB', gpu:'NVIDIA GeForce GTX 1060 6 GB', disk:'50 GB 可用空间' } },
  { id:'P1002', nm:'暗影回廊', en:'Shadow Corridor', price:258.00, type:'CODE', ways:['CODE','GIFT'], ver:'标准版', ver2:'豪华版', dl:'口令码自动发码', lang:'简体中文 / 英语',
    sys:{ os:'Windows 10 64 位', cpu:'Intel Core i5-7400 / AMD Ryzen 3 2200G', ram:'8 GB', gpu:'NVIDIA GeForce GTX 1050 Ti', disk:'40 GB 可用空间' } },
  { id:'P1003', nm:'星海远征', en:'Star Voyage', price:199.00, type:'CODE', ways:['CODE','GIFT'], ver:'标准版', ver2:'完整版', dl:'口令码自动发码', lang:'简体中文 / 英语 / 日语',
    sys:{ os:'Windows 10 64 位', cpu:'Intel Core i5-9400 / AMD Ryzen 5 3600', ram:'12 GB', gpu:'NVIDIA GeForce GTX 1660', disk:'60 GB 可用空间' } },
  { id:'P1004', nm:'球场传奇 27', en:'Court Legend 27', price:198.17, type:'CODE', ways:['CODE'], ver:'标准版', ver2:'豪华版', dl:'口令码自动发码', lang:'简体中文 / 英语',
    sys:{ os:'Windows 10 64 位', cpu:'Intel Core i5-6600K / AMD Ryzen 5 1600', ram:'8 GB', gpu:'NVIDIA GeForce GTX 1050 Ti', disk:'45 GB 可用空间' } },
  { id:'P1005', nm:'铁血战线', en:'Iron Front', price:269.00, type:'CODE', ways:['CODE','GIFT'], ver:'标准版', ver2:'金库版', dl:'口令码自动发码', lang:'简体中文 / 英语',
    sys:{ os:'Windows 10 64 位', cpu:'Intel Core i5-10400 / AMD Ryzen 5 3600', ram:'12 GB', gpu:'NVIDIA GeForce GTX 1660 Super', disk:'80 GB 可用空间' } },
  { id:'P1006', nm:'龙之誓言 II', en:'Dragon Oath II', price:224.00, type:'CODE', ways:['CODE'], ver:'标准版', ver2:null, dl:'口令码自动发码', lang:'简体中文 / 英语',
    sys:{ os:'Windows 10 64 位', cpu:'Intel Core i5-8400 / AMD Ryzen 5 2600X', ram:'16 GB', gpu:'NVIDIA GeForce GTX 1070', disk:'70 GB 可用空间' } },
  { id:'P1007', nm:'街霸传说 6', en:'Fighter Legend 6', price:72.00, type:'CODE', ways:['CODE','GIFT'], ver:'标准版', ver2:null, dl:'口令码自动发码', lang:'简体中文 / 英语',
    sys:{ os:'Windows 10 64 位', cpu:'Intel Core i5-7500 / AMD Ryzen 3 1200', ram:'8 GB', gpu:'NVIDIA GeForce GTX 1060', disk:'60 GB 可用空间' } },
  { id:'P1008', nm:'铁骑与战团', en:'Rider & Warband', price:24.50, type:'GIFT', ways:['CODE','GIFT'], ver:'标准版', ver2:'合集（本体+2款DLC）', dl:'好友赠送（人工交付）', lang:'简体中文 / 英语',
    sys:{ os:'Windows 10 64 位', cpu:'Intel Core i5-7300HQ / AMD Ryzen 5 2500U', ram:'8 GB', gpu:'NVIDIA GeForce GTX 1050', disk:'35 GB 可用空间' } }
];
/* 地区限制按发货方式派生：CDK 口令码仅支持 Steam 国区账号激活；好友赠送按好友账号所在区，全区可赠送。
   原先每个商品各存一份 region 文本，加入「发货方式可选」后会出现「版本提示说国区、商品却写全区」的矛盾。 */
const CDK_REGION = '仅支持 Steam 国区账号激活';
const GIFT_REGION = 'Steam 全区可赠送';
const regionOf = (gd, w) => ((w || gd.type) === 'GIFT' ? GIFT_REGION : CDK_REGION);
const WAY_TEXT = { CODE:'CDK（口令码）', GIFT:'好友赠送' };
const wayText = w => WAY_TEXT[w] || WAY_TEXT.CODE;
/* 手机号展示统一脱敏；绑定成功后仅保存脱敏值，不保存完整号码。 */
function maskPhone(v) {
  var d = String(v || '').replace(/\D/g, '');
  return d.length === 11 ? d.slice(0, 3) + '****' + d.slice(-4) : '';
}
/* 商品支持的发货方式集合；未配置时回退为单一默认方式（不臆造可选能力） */
/* 后台配置与前端展示的连接点（CHG-0069）。商品的可选发货方式、可激活地区、顶图素材与
   商品介绍都以后台 ADM_GOODS 的配置为准，前端不另存一份——否则后台改了前端不跟着变。
   取不到后台数据时回退到前端自带字段，保证单页预览也能跑。 */
const admGoods = id => {
  try { return (typeof ADM_GOODS !== 'undefined' ? ADM_GOODS : []).filter(x => x.id === id)[0] || null; }
  catch (e) { return null; }
};
/* 后台的交付类型是中文字面量，前端的发货方式是 CODE／GIFT 两个枚举，这里做一次映射 */
const goodsWays = gd => {
  var a = admGoods(gd.id);
  if (!a || !a.ways || !a.ways.length) return gd.ways || [gd.type];
  var ws = [];
  if (a.ways.indexOf('口令码') >= 0) ws.push('CODE');
  if (a.ways.indexOf('好友赠送') >= 0) ws.push('GIFT');
  return ws.length ? ws : [gd.type];
};
const goodsRegions = gd => { var a = admGoods(gd.id); return (a && a.regions) ? a.regions : []; };
const goodsMedia = gd => { var a = admGoods(gd.id); return (a && a.media) ? a.media : []; };
const goodsIntro = gd => { var a = admGoods(gd.id); return (a && a.intro) ? a.intro : ''; };
const goodsNotice = gd => { var a = admGoods(gd.id); return (a && a.notice) ? a.notice : ''; };
const goodsSys = gd => { var a = admGoods(gd.id); return (a && a.sys) ? a.sys : null; };
/* 下单前的可售校验（CHG-0092）：后台商品状态/供应商在架状态/库存快照。
   库存字段只是快照，不是预留；真实以供应商 extractcode 返回为准。 */
const goodsStock = (gd, spec) => {
  var a = admGoods(gd.id);
  if (!a) return null;
  if (a.supplyMode === 'API采购') return typeof a.supInventory === 'number' ? a.supInventory : null;
  var key = spec || gd.ver;
  if (a.skuStock && a.skuStock[key] != null) return a.skuStock[key];
  return typeof a.stock === 'number' ? a.stock : null;
};
const goodsSupplierOnSale = gd => {
  var a = admGoods(gd.id);
  if (!a) return true;
  if (a.supOnSale === false) return false;
  return a.status !== '已下架' && a.status !== '售罄';
};
const goodsDelisted = gd => {
  var a = admGoods(gd.id);
  return !!(a && (a.status === '已下架' || a.supOnSale === false));
};
/* 余额强校验 + 库存分层校验（CHG-0099）：
   - 口令码 API 采购：采购余额低于本单供货价×(1+安全垫) → 不创建可支付订单；
   - 缓存为 0 且同步新鲜 → 售罄；缓存过期/同步失败/未知 → 允许下单但提示以付款后结果为准；
   - 好友赠送不依赖供应商钱包/库存，不因此停售。 */
const goodsSupplyMeta = gd => {
  var a = admGoods(gd.id);
  if (!a) return null;
  if (a.supplyMode !== 'API采购') return { mode: 'OWN' };
  var known = typeof a.supInventory === 'number';
  var fresh = a.supSyncStatus === '成功' && a.supInventoryFresh !== false;
  return {
    mode: 'API', known: known, fresh: fresh, inventory: a.supInventory,
    walletEnough: (typeof admSupplyWalletEnough === 'function') ? admSupplyWalletEnough(a) : true,
    supplierPrice: a.supplierPrice
  };
};
const goodsStockNote = (gd, way) => {
  if ((way || gd.type) === 'GIFT') return '';
  var m = goodsSupplyMeta(gd);
  if (!m || m.mode !== 'API') return '';
  if (!m.known || !m.fresh) {
    return '供应商库存缓存已过期或同步失败，当前可下单；最终以付款后供应商结果为准，失败自动退款或补货。';
  }
  return '';
};
const goodsBlockReason = (gd, way, spec) => {
  if (goodsDelisted(gd)) return '已下架，不可购买';
  if ((way || gd.type) === 'GIFT') return '';   // 好友赠送走人工，不依赖供应商钱包/库存
  var m = goodsSupplyMeta(gd);
  if (m && m.mode === 'API') {
    if (!m.walletEnough) return '补货中，暂不可购买';
    if (m.known && m.fresh && m.inventory <= 0) return '已售罄';
    return '';
  }
  var st = goodsStock(gd, spec);
  return st === null ? '' : (st > 0 ? '' : '已售罄');
};
const goodsPurchasable = (gd, way, spec) => !goodsBlockReason(gd, way, spec);
/* 多发货方式商品：只要还有任一种发货方式可售，商品页就允许进入购买面板。
   CHG-0100：口令码售罄但好友赠送可用时，底部按钮不再整体禁用；面板内按所选方式分别提示。 */
const goodsAltWay = (gd, spec) => {
  if (goodsDelisted(gd)) return '';
  var cur = wayOf(gd);
  var ws = waysOf(gd);
  for (var i = 0; i < ws.length; i++) {
    if (ws[i] !== cur && !goodsBlockReason(gd, ws[i], spec)) return ws[i];
  }
  return '';
};
const goodsAnyWayPurchasable = (gd, spec) => {
  if (goodsDelisted(gd)) return false;
  var ws = waysOf(gd);
  for (var i = 0; i < ws.length; i++) {
    if (!goodsBlockReason(gd, ws[i], spec)) return true;
  }
  return false;
};
/* 可激活地区：后台配置的多地区，按配置顺序展示；未配置时如实说明而不臆造范围 */
const regionText = gd => { var rs = goodsRegions(gd); return rs.length ? rs.join('、') : '未配置可激活地区'; };
const waysOf = gd => goodsWays(gd);
const wayOf = gd => { var ws = waysOf(gd); return ws.indexOf(RV.session.way) >= 0 ? RV.session.way : gd.type; };
const MOCK_ORDER = {
  no:'SO2026101500012345',
  goodsId:'P1001', spec:'标准版', type:'CODE', qty:1,
  amount:128.00, payChannel:'WECHAT', platform:'平台A', nickname:'玩家_小七',
  createdAt:'2026-10-15 09:04:21', payStatus:'PAY::PENDING', codeStatus:'CODE::NOT_STARTED',
  giftStatus:'GIFT::PENDING', friendLink:'', afterStatus:'AFTER::NONE',
  code:'', expireAt:null, noticeTask:'NOTIFY::PENDING'
};
const MOCK_GIFT_ORDER = {
  no:'SO2026101500012399', goodsId:'P1003', spec:'标准版', type:'GIFT', qty:1,
  amount:199.00, payChannel:'ALIPAY', platform:'平台A', nickname:'玩家_小七',
  createdAt:'2026-10-15 09:12:03', payStatus:'PAY::PAID', codeStatus:'CODE::NOT_STARTED',
  giftStatus:'GIFT::PENDING', friendLink:'https://s.team/p/abcd-efgh', afterStatus:'AFTER::NONE',
  code:'', expireAt:null, noticeTask:'NOTIFY::PENDING'
};
const MOCK_CODE = 'S7K2D-9FQ4M-XB31T';
/* 人工补发写回（CHG-0081）：后台提交结果写入同一份映射，前台订单详情读取补录口令码。 */
var CODE_SYNC = window.CODE_SYNC || (window.CODE_SYNC = {});
function latestCode(no, fallback) { return CODE_SYNC[no] || fallback; }
/* 人工补发后交付状态同步（CHG-0084）：前台订单列表与详情读取。 */
var DELIVERY_SYNC = window.DELIVERY_SYNC || (window.DELIVERY_SYNC = {});
function deliverySynced(no) { return DELIVERY_SYNC[no] === 'CODE::DELIVERED'; }
/* 搜索推荐（CHG-0075）：直接读后台「搜索推荐配置」（ADM-SEARCH-01）的启用项。
   - 顺序＝后台配置顺序（热门商品由运营拖拽调整），不再「换一批」；
   - 前台展示位有限，按顺序取前 N 条，**后台多配的部分不显示**——
     后台可以多配，但不会撑破前台布局。 */
const SEARCH_KW_LIMIT = 6;     // 搜索发现可显示的关键词数
const SEARCH_HOT_LIMIT = 6;    // 搜索热门商品可显示的条数
function searchKwList() {
  return ADM_SEARCH_KW.filter(function (x) { return x.on === '启用'; })
    .slice(0, SEARCH_KW_LIMIT)
    .map(function (x) { return x.w; });
}
function searchHotList() {
  var out = [];
  ADM_SEARCH_GOODS.filter(function (x) { return x.on === '启用'; }).forEach(function (x) {
    if (out.length >= SEARCH_HOT_LIMIT) return;              // 超出展示位的不取
    var gd = ADM_GOODS.filter(function (g) { return g.id === x.gid; })[0];
    /* 商品下架/售罄后不再推荐：前台按在售过滤，后台仍保留该条配置（CHG-0077） */
    if (gd && gd.status === '在售') out.push({ id: gd.id, nm: gd.nm });
  });
  return out;
}
/* 搜索历史按 PRD V1.5 移出首期：不做历史、联想、拼音、换一批（SEARCH-05、2.3）。 */
/* 首页广告位（模拟数据，结构与 API-HOME-001 的 banners[] 一致）。
   targetType 为站内目标：GOODS＝商品详情、SEARCH＝搜索结果（03 登记的 target_type 枚举）。
   第 3 条的 target 指向不存在的商品，用于演示「目标已失效」分支
   （03 第4节 NO_TARGET：行内提示、不跳空白页）。全部为模拟数据。 */
const BANNERS = [
  { id:'B20261', title:'夏季特惠 · 全场口令码直降', targetType:'GOODS',  target:'P1001' },
  { id:'B20262', title:'新作上架 · 星海远征',       targetType:'SEARCH', target:'星海远征' },
  { id:'B20263', title:'限时活动 · 已结束',         targetType:'GOODS',  target:'P1099' }
];
const g = id => GOODS.find(x => x.id === id) || GOODS[0];
const isGift = gd => gd.type === 'GIFT';
const typeText = gd => isGift(gd) ? '好友赠送' : '口令码';

/* 组件包装：只写 data-component，描边由 CSS outline + ::after 实现，不新增占位元素 */
function C(id, inner, tag, cls, style) {
  tag = tag || 'div';
  /* id 为空时不写 data-component：组件描边与组件选择器都按该属性定位，
     空值会在画布上留下无意义的定位点。用于「同一块内容换个宿主渲染、
     由外层统一标注组件编号」的场景（如 WEB 的购买面板整块算 WEB-PRODUCT-01-C08）。 */
  return '<' + tag + (cls ? ' class="' + cls + '"' : '') + (id ? ' data-component="' + attr(id) + '"' : '') +
    (style ? ' style="' + style + '"' : '') + '>' + inner + '</' + tag + '>';
}
/* noBack=true 用于一级页面（商城首页、我的）：一级页面由底部标签栏切换，不设返回 */
function navBar(cid, title, sub, right, noBack) {
  return C(cid,
    (noBack ? '' : '<button class="ico-btn" type="button" data-act="back" aria-label="返回">‹</button>') +
    '<div class="grow col" style="gap:0">' +
      '<span class="ttl">' + esc(title) + '</span>' +
      (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') +
    '</div>' + (right || ''), 'div', 'bar');
}
/* 实名结果展示（APP/PC 共用）：按确认稿只保留完成态盾牌、完成文案与成年/未成年状态。 */
function authResultInner(st) {
  var minor = st === 'MINOR';
  return '<div class="auth-result">' +
    '<svg class="shield" viewBox="0 0 64 64" aria-hidden="true">' +
      '<path d="M32 4.5 55 13v17.6c0 13.8-9.8 24.2-23 29.4-13.2-5.2-23-15.6-23-29.4V13L32 4.5z" fill="#eaf3ee" stroke="#356b4d" stroke-width="2.2"/>' +
      '<path d="m20.5 31.8 7.8 7.8L44 22.8" fill="none" stroke="#356b4d" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>' +
    '<div class="title">您已完成实名认证</div>' +
    '<div class="status">当前认证状态：<b class="' + (minor ? 'minor' : '') + '">' + (minor ? '未成年人' : '成年人') + '</b></div>' +
  '</div>';
}
function thumb(gd, h) {
  return '<div class="blk" style="height:' + (h || 84) + 'px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#6b7280">［商品图］' + esc(gd.nm) + '</div>';
}
function goodsCard(cid, gd) {
  return C(cid,
    thumb(gd) +
    '<div class="body">' +
      '<span class="tag ' + (isGift(gd) ? '' : 'on') + '">' + typeText(gd) + '</span>' +
      (function () {
        var br = goodsBlockReason(gd, gd.type, gd.ver);
        if (br) {
          var alt = goodsAltWay(gd, gd.ver);
          if (alt) return '<span class="tag warn">' + wayText(gd.type) + '售罄 · 可赠礼</span>';
          return '<span class="tag err">' + (br.indexOf('补货') === 0 ? '补货中' : br.replace('，不可购买', '')) + '</span>';
        }
        if (goodsStockNote(gd, gd.type)) return '<span class="tag warn">库存待确认</span>';
        return '';
      })() +
      '<span class="nm">' + esc(gd.nm) + '－' + esc(gd.ver) + '</span>' +
      '<span class="price"><span class="cur">¥</span>' + gd.price.toFixed(2) + '</span>' +
    '</div>', 'div', 'goods-card');
}
/* 首页广告位（共享渲染件）：APP 与 WEB 结构与行为一致，只是尺寸不同。
   整图即可点击热区（data-act=banner）+ 左右箭头 + 指示点。
   单图不渲染箭头与指示点（PAT-CAROUSEL-01）；指示点可见条很小（16×8），
   但按钮热区按移动端 44×44 取（与问号帮助入口同一手法）。 */
function adBanner(cid, opts) {
  opts = opts || {};
  var list = BANNERS;
  var n = list.length;
  if (!n) return '';
  var i = (((RV.banner | 0) % n) + n) % n;
  var bd = list[i];
  var multi = n > 1;
  var hit = '<button class="ad-hit" type="button" data-act="banner" data-banner="' + attr(bd.id) +
    '" aria-label="广告：' + esc(bd.title) + '，点击查看">' +
    '<span class="ad-img">［广告图 ' + (i + 1) + '/' + n + '］' + esc(bd.title) + '</span></button>';
  var arrows = multi
    ? '<button class="ad-arrow prev" type="button" data-act="banner-step" data-step="-1" aria-label="上一张广告">\u2039</button>' +
      '<button class="ad-arrow next" type="button" data-act="banner-step" data-step="1" aria-label="下一张广告">\u203a</button>'
    : '';
  var dots = multi
    ? '<div class="ad-dots" role="group" aria-label="广告切换">' + list.map(function (x, k) {
        return '<button type="button" data-act="banner-dot" data-idx="' + k + '" aria-pressed="' + (k === i ? 'true' : 'false') +
          '" aria-label="第 ' + (k + 1) + ' 张：' + esc(x.title) + '"></button>';
      }).join('') + '</div>'
    : '';
  return C(cid, '<div class="ad' + (opts.tall ? ' ad-tall' : '') + '" data-banner-rotator="1">' +
    hit + arrows + dots + '</div>', 'div', opts.bare ? '' : 'card');
}
function sortBar(cid, active, list, bare) {
  list = list || ['推荐', '价格↑', '价格↓', '最新'];
  /* bare=true：不带卡片外壳，供 PC「区块标题行」内嵌使用（标题左、排序右） */
  return C(cid, '<div class="row wrap sortbar">' + list.map(function (s) {
    return '<button class="tag' + (s === active ? ' on' : '') + '" type="button" data-act="sort" data-sort="' + attr(s) +
      '" style="padding:8px 10px;margin:0">' + esc(s) + '</button>';
  }).join('') + '</div>', 'div', bare ? '' : 'card flat');
}
function stateBlock(cid, kind, title, desc, actionLabel, actionKey) {
  var icon = kind === 'loading' ? '［加载中…］' : (kind === 'error' ? '［加载失败］' : '［无内容］');
  return C(cid,
    '<div class="empty"><span class="t">' + icon + ' ' + esc(title) + '</span>' + esc(desc) +
    (actionLabel ? '<div style="margin-top:8px"><button class="btn sm" type="button" data-act="' + attr(actionKey || 'retry') + '">' + esc(actionLabel) + '</button></div>' : '') +
    '</div>', 'div', '');
}
/* tab：底部标签栏 HTML（仅两个一级页面传入）。标签栏是 .phone 的固定底部区，
   不随 .phone-body 滚动，覆盖层（弹窗遮罩）仍盖在它之上。 */
function useGuideModal() {
  if (!RV.session.guideOpen) return '';
  return '<div class="modal-mask center" data-guide="1" style="position:absolute;inset:0;z-index:20">' +
    '<div class="modal" style="max-width:420px">' +
    '<button class="x" type="button" data-act="guide-close" aria-label="关闭">✕</button>' +
    '<div class="center strong" style="margin-bottom:6px">CDK 使用指引</div>' +
    '<div class="small" style="line-height:1.8">1. 打开 Steam 客户端并登录<br>2. 点击「添加游戏」→「在 Steam 上激活产品」<br>3. 输入订单中的口令码并完成激活</div>' +
    '<div class="hint" style="margin-top:8px">视频/图文指引由运营后续提供；当前为原型占位内容。</div>' +
    '<button class="btn primary wide" type="button" data-act="guide-close" style="margin-top:10px">知道了</button>' +
    '</div></div>';
}
function phoneShell(inner, overlay, tab) {
  return '<div class="phone' + (tab ? ' has-tab' : '') + '"><div class="notch"></div>' +
    '<div class="phone-body">' + inner + '</div>' + (tab || '') + (overlay || '') + useGuideModal() + '</div>';
}
/* 底部标签栏（共享定义 COM-CLIENT-C14）：移动端「商城 / 我的」两个一级页面之间切换。
   只在商城首页与「我的」页出现；二级页面不显示，用返回键回上级（移动端主流做法）。 */
function tabBar(cid, active) {
  var items = [['APP-HOME-01', '商城'], ['APP-MINE-01', '我的']];
  return C(cid, items.map(function (it) {
    return '<button type="button" data-act="go" data-to="' + it[0] + '"' +
      (it[0] === active ? ' aria-current="page"' : '') + '>' +
      '<span class="tb-ico" aria-hidden="true"></span>' + it[1] + '</button>';
  }).join(''), 'div', 'tabbar');
}
function modalMask(cid, cls, inner) {
  return C(cid, '<div class="modal ' + (cls || '') + '">' + inner + '</div>', 'div', 'modal-mask');
}
function modalHead(title, showX) {
  return (showX === false ? '' : '<button class="x" type="button" data-act="close-modal" aria-label="关闭">✕</button>') +
    '<div class="center" style="font-size:16px;font-weight:500;margin:4px 0 8px">' + esc(title) + '</div>';
}
function stepChain(now) {
  var steps = ['登录', '实名成年', '购买协议', '手机号', '创建订单'];
  return '<div class="steps">' + steps.map(function (s, i) {
    return '<span class="step' + (i < now ? ' done' : (i === now ? ' now' : '')) + '">' + (i + 1) + ' ' + s + '</span>';
  }).join('') + '</div>';
}

/* ============================================================
   APP-HOME-01 商城首页
   ============================================================ */
function rHome(page, st, sim) {
  var c = 'APP-HOME-01-C';
  /* 首页属于「商城」这一一级页面，只保留商城自己的入口（搜索）。
     「我的订单 / 我的 / 客服」属于「我的」一级页面，统一收到 APP-MINE-01，
     首页不再出现个人功能入口——此前客服同时出现在顶部与快捷导航里，是三处重复。 */
  var head = navBar(c + '01', 'Steam商城', '官方商城',
    C(c + '02', '<button class="ico-btn" type="button" data-act="go" data-to="APP-SEARCH-01" aria-label="搜索">搜索</button>', 'div', '', 'margin-left:auto'), true);
  var ad = adBanner(c + '04', {});
  var sort = sortBar(c + '06', RV.sort || '推荐');
  var listHtml, feed;
  if (st === 'LOADING') {
    listHtml = '<div class="grid2">' + [1, 2, 3, 4].map(function () {
      return '<div class="goods-card"><div class="card" style="margin:0;border:0;padding:8px"><div class="sk h20" style="margin-bottom:6px"></div><div class="sk" style="width:70%"></div></div></div>';
    }).join('') + '</div>';
    feed = stateBlock(c + '08', 'loading', '正在加载首页内容', '已加载 0/8 个商品');
  } else if (st === 'EMPTY' || sim === 'empty') {
    listHtml = '';
    feed = stateBlock(c + '08', 'empty', '当前没有可展示的商品', '运营尚未发布首页配置或商品均已下架。可稍后重试。', '重新加载', 'retry');
  } else if (st === 'ERROR' || sim === 'fail') {
    listHtml = '';
    feed = stateBlock(c + '08', 'error', '首页加载失败', '网络异常或服务暂不可用。分类与排序条件已保留。', '重新加载', 'retry');
  } else {
    var arr = GOODS.slice();
    var srt = RV.sort || '推荐';
    if (srt === '价格↑') arr.sort(function (a, b) { return a.price - b.price; });
    if (srt === '价格↓') arr.sort(function (a, b) { return b.price - a.price; });
    if (srt === '最新') arr = GOODS.slice().reverse();
    listHtml = C(c + '07', '<div class="grid2">' + arr.map(function (gd) {
      return '<div data-act="go" data-to="APP-PRODUCT-01" data-goods="' + attr(gd.id) + '" role="button" tabindex="0" data-goods-wrap="1">' + goodsCard(c + '07', gd) + '</div>';
    }).join('') + '</div>', 'div', '');
    feed = C(c + '08', '<div class="center small muted" style="padding:8px 0">已展示 ' + arr.length + ' 个商品 · 排序：' + esc(srt) + '</div>', 'div', '');
  }
  var notice = RV.session.noticeClosed ? '' : '';
  return phoneShell(
    head + ad + sort + listHtml + feed,
    st === 'NOTICE' ? renderNoticeOverlay() : notice,
    tabBar(c + '09', 'APP-HOME-01')
  );
}

/* 首次进入实名提醒弹层（AUTH-06～08、V1.4 修正） */
function renderNoticeOverlay() {
  var s = RV.session.realname;
  var c = 'APP-NOTICE-01-C';
  var body, btn;
  if (s === 'verified') {
    body = '您已完成实名认证，可直接浏览与购买商品。';
    btn = '<button class="btn primary wide" type="button" data-act="close-notice">知道了</button>';
  } else if (s === 'minor') {
    body = '您已完成实名认证。根据相关规定，您当前<b>可以浏览，暂不可购买</b>。';
    btn = '<button class="btn primary wide" type="button" data-act="close-notice">知道了</button>';
  } else if (s === 'none') {
    body = '购买前需完成实名认证，您也可以先浏览商品。若所属平台无法提供实名信息，可填写姓名与身份证号，由商城调用国家认证接口完成核验。';
    btn = '<button class="btn primary wide" type="button" data-act="notice-auth">前往认证</button>';
  } else {
    body = '暂时无法获取当前账号的实名认证状态，您可以先浏览商品；也可以填写姓名与身份证号完成认证后再购买。';
    btn = '<button class="btn primary wide" type="button" data-act="notice-auth">填写信息认证</button>';
  }
  return modalMask('APP-NOTICE-01-C01', 'center',
    C(c + '04', '<button class="x" type="button" data-act="close-notice" aria-label="关闭提醒">✕</button>', 'div', '') +
    '<div class="center" style="font-size:16px;font-weight:500;margin:6px 0 8px">实名认证提醒</div>' +
    C(c + '02', '<div class="small" style="line-height:1.7">' + body + '</div>' +
      '<div class="hint">本提醒不发放任何奖励，不影响浏览（AUTH-06）</div>', 'div', '') +
    '<div style="margin-top:12px">' + C(c + '03', btn, 'div', '') + '</div>' +
    '<div class="hint center" style="margin-top:6px">点击右上角关闭按钮或弹窗以外的遮罩区域，均关闭提醒并停留当前页面（AUTH-07）</div>'
  );
}

/* ============================================================
   APP-NOTICE-01 首次进入实名提醒（独立页面态）
   ============================================================ */
function rNotice(page, st) {
  RV.session.realname = st === 'UNVERIFIED' ? 'none' : (st === 'VERIFIED' ? 'verified' : (st === 'MINOR' ? 'minor' : 'unknown'));
  return phoneShell(
    navBar('APP-HOME-01-C01', 'Steam商城', '官方商城',
      '<button class="ico-btn" type="button" data-act="go" data-to="APP-SEARCH-01">搜索</button>') +
    '<div class="hint" style="padding:8px 0">首页先正常加载，实名提醒作为覆盖层展示；状态查询失败不阻断浏览（AUTH-08）。</div>' +
    '<div class="card"><div class="sk h20" style="margin-bottom:6px"></div><div class="sk" style="width:60%"></div></div>' +
    '<div class="card"><div class="sk h20"></div></div>',
    renderNoticeOverlay());
}

/* ============================================================
   APP-SEARCH-01 搜索默认页
   ============================================================ */
function rSearchHome(page, st, sim) {
  var c = 'APP-SEARCH-01-C';
  var box = C(c + '01',
    '<div class="row" style="gap:6px">' +
      '<button class="ico-btn" type="button" data-act="back" aria-label="返回">‹</button>' +
      /* 搜索默认页的输入框恒为空：从搜索结果页返回时不回填上次的关键词（评审反馈）。
         要复搜直接用下方的搜索发现词；结果页自己的输入框仍显示当前关键词。 */
      '<input class="inp" id="kw1" style="flex:1" placeholder="输入商品名称搜索" value="" aria-label="搜索关键词">' +
      '<button class="ico-btn" type="button" data-act="search" data-from="s1">搜索</button>' +
    '</div>' +
    '<div class="hint">支持输入、清空与提交关键词；搜索历史、联想、拼音、换一批均不做（SEARCH-05、2.3）。</div>',
    'div', 'card flat');
  var body;
  if (st === 'ERROR' || sim === 'fail') {
    body = C(c + '02', stateBlock('', 'error', '搜索发现加载失败', '推荐关键词与热门商品暂不可用，不影响直接输入关键词搜索。', '重试', 'retry'), 'div', '') +
      C(c + '03', stateBlock('', 'error', '热门商品加载失败', '可先通过关键词搜索。', '重试', 'retry'), 'div', '');
  } else if (st === 'EMPTY' || sim === 'empty') {
    body = C(c + '02', stateBlock('', 'empty', '暂无搜索发现内容', '后台未配置推荐关键词时整块隐藏，不展示空占位（SEARCH-04）。'), 'div', '') +
      C(c + '03', stateBlock('', 'empty', '暂无热门商品', '内容为空时隐藏，不强制建立实时热榜（SEARCH-04、ADM-14）。'), 'div', '');
  } else {
    var kws = searchKwList(), hots = searchHotList();
    /* 后台未配置（或全部停用）时整块隐藏，不展示空占位（SEARCH-04） */
    body = (kws.length ? C(c + '02',
      '<div class="row" style="margin-bottom:6px"><span class="strong">搜索发现</span></div>' +
      '<div class="grid2">' + kws.map(function (w) {
        return '<button class="tag" type="button" data-act="word" data-word="' + attr(w) + '" style="padding:8px 10px;margin:0;text-align:left">' + esc(w) + '</button>';
      }).join('') + '</div>' +
      '<div class="hint">关键词由后台「搜索推荐配置」维护，按配置顺序展示前 ' + SEARCH_KW_LIMIT + ' 个；点击执行搜索（SEARCH-04、ADM-14）。</div>', 'div', 'card') : '') +
      (hots.length ? C(c + '03',
      '<div class="strong" style="margin-bottom:6px">搜索热门商品</div>' +
      hots.map(function (x, k) {
        return '<div class="row" style="padding:6px 0;border-top:' + (k ? '1px solid #e3e6ea' : '0') + '" data-act="go" data-to="APP-PRODUCT-01" data-goods="' + attr(x.id) + '" role="button" tabindex="0">' +
          '<span class="tag" style="width:22px;text-align:center;margin:0">' + (k + 1) + '</span>' +
          '<span class="small brk">' + esc(x.nm) + '</span></div>';
      }).join('') +
      '<div class="hint">商品与顺序由后台「搜索推荐配置」维护，按配置顺序展示前 ' + SEARCH_HOT_LIMIT + ' 个；点击进入详情（SEARCH-04）。</div>', 'div', 'card') : '');
  }
  var suggest = C(c + '04',
    '<div class="strong small" style="margin-bottom:4px">联想建议（首期未启用）</div>' + stateBlock('', 'empty', '该能力未纳入首期', '关键词联想与拼音检索仍只登记为候选能力，是否首期纳入另定（SEARCH-05、TBD-15），当前不展示建议列表。'),
    'div', 'card');
  return phoneShell(box + body + suggest);
}

/* ============================================================
   APP-SEARCH-02 搜索结果页
   ============================================================ */
function rSearchResult(page, st, sim) {
  var c = 'APP-SEARCH-02-C';
  var kw = RV.kw || '孤刃';
  var box = C(c + '01',
    '<div class="row" style="gap:6px">' +
      '<button class="ico-btn" type="button" data-act="back" aria-label="返回">‹</button>' +
      '<input class="inp" id="kw2" style="flex:1" value="' + attr(kw) + '" aria-label="搜索关键词">' +
      '<button class="ico-btn" type="button" data-act="search" data-from="s2">搜索</button>' +
    '</div>', 'div', 'card flat');
  var result, pager;
  var hits = GOODS.filter(function (x) { return x.nm.indexOf(kw) >= 0; });
  if (st === 'LOADING') {
    result = '<div class="card"><div class="sk h20" style="margin-bottom:6px"></div><div class="sk" style="width:50%"></div></div><div class="card"><div class="sk h20"></div></div>';
    pager = stateBlock('', 'loading', '正在查询', '已发起 1 次请求，加载中不再重复提交');
  } else if (st === 'EMPTY' || sim === 'empty') {
    result = '';
    pager = C(c + '04', stateBlock('', 'empty', '未找到匹配内容', '关键词“' + kw + '”没有匹配商品，请修改关键词后重新搜索。已保留关键词。', '清空并返回搜索', 'goSearch'), 'div', '');
  } else if (st === 'ERROR' || sim === 'fail') {
    result = '';
    pager = C(c + '04', stateBlock('', 'error', '请求失败', '已保留关键词，可重试。', '重试', 'retry'), 'div', '');
  } else if (st === 'END') {
    result = '<div class="card"><div class="small">已加载全部 ' + (hits.length || 1) + ' 条结果</div></div>';
    pager = C(c + '04', '<div class="center small muted" style="padding:8px 0">— 已到末页，没有更多内容 —</div>', 'div', '');
  } else {
    /* 结果页不再提供排序入口（评审反馈）：按搜索结果自身的默认相关度顺序展示，
       不再按首页排序条件重排，也不再向 API-SEARCH-003 传 sort。 */
    var arr = hits.length ? hits : GOODS.slice(0, 3);
    result = C(c + '03', '<div class="grid2">' + arr.map(function (gd) {
      return '<div data-act="go" data-to="APP-PRODUCT-01" data-goods="' + attr(gd.id) + '" role="button" tabindex="0">' + goodsCard('', gd) + '</div>';
    }).join('') + '</div>', 'div', '');
    pager = C(c + '04',
      '<div class="center small muted" style="padding:4px 0">共 ' + arr.length + ' 条 · 已加载 ' + arr.length + ' 条</div>' +
      '<button class="btn sm wide" type="button" data-act="loadmore">继续加载</button>', 'div', '');
  }
  return phoneShell(
    box +
    '<div class="hint" style="padding:4px 0">结果顺序由搜索服务按相关度返回，结果页不提供排序与筛选入口（SEARCH-03）</div>' +
    result + pager);
}

/* ============================================================
   APP-PRODUCT-01 商品详情
   ============================================================ */
/* 商品详情媒体轮播：同一轮播内混合图片与视频（PRODUCT-06 原排除视频，本轮按用户要求纳入）。
   缩略图行同时充当前进指示器；视频项以 ▶ 标识，正式实现由供应商提供的视频地址承载。 */
/* 详情页顶图（CHG-0069）：条目与顺序都取后台「商品图片/视频」列表，
   运营拖拽后的顺序就是这里的展示顺序。未配置素材时只给一条中立占位并如实说明，
   不虚构多张图。 */
function mediaItems(gd) {
  var list = goodsMedia(gd);
  if (!list.length) return [{ kind: 'IMAGE', idx: 1, label: '［运营未上传素材］' + gd.nm }];
  var img = 0, vid = 0;
  return list.map(function (m) {
    if (m.t === 'video') { vid++; return { kind: 'VIDEO', idx: vid, label: '［视频］' + m.n }; }
    img++;
    return { kind: 'IMAGE', idx: img, label: '［图 ' + img + '］' + m.n };
  });
}
function mediaCarousel(cid, gd, partial) {
  var list = partial ? mediaItems(gd).slice(0, 2) : mediaItems(gd);
  var cur = Math.min(Math.max(RV.mediaIdx || 0, 0), list.length - 1);
  var m = list[cur];
  return C(cid,
    '<div class="carousel">' +
      '<div class="carousel-stage">' +
        '<span class="media-label">' +
          (m.kind === 'VIDEO' ? '<span class="play" aria-hidden="true">▶</span>' : '') +
          esc(m.label) + '</span>' +
        '<span class="cindex">' + (cur + 1) + ' / ' + (partial ? '-' : list.length) + '</span>' +
      '</div>' +
      (list.length > 1
        ? '<button class="cbtn prev" type="button" data-act="media-prev" aria-label="上一张">‹</button>' +
          '<button class="cbtn next" type="button" data-act="media-next" aria-label="下一张">›</button>'
        : '') +
    '</div>' +
    (partial
      ? '<div class="hint">部分资料缺失时只展示运营能够提供的真实资料，不生成占位标签与占位媒体（4.3）</div>'
      : '<div class="thumbrow" role="group" aria-label="媒体缩略图">' + list.map(function (it, k) {
          return '<button class="thumbblk" type="button" data-act="media-go" data-idx="' + k +
            '" aria-pressed="' + (k === cur ? 'true' : 'false') + '" aria-label="第 ' + (k + 1) + ' 项' +
            (it.kind === 'VIDEO' ? '（视频）' : '') + '">' + (it.kind === 'VIDEO' ? '▶视频' : '图' + it.idx) + '</button>';
        }).join('') + '</div>' +
      '<div class="hint">图片与视频在同一轮播内切换；视频为供应商提供的实机演示，加载失败时降级为静态图</div>'), 'div', 'card');
}
function rProduct(page, st, sim) {
  var c = 'APP-PRODUCT-01-C';
  var gd = g(RV.goodsId || 'P1001');
  var offShelf = st === 'UNAVAILABLE';
  var delisted = goodsDelisted(gd);
  var spec = RV.session.spec || gd.ver;
  var stockNote = goodsStockNote(gd, wayOf(gd));
  var blockReason = goodsBlockReason(gd, wayOf(gd), spec);
  var altWay = goodsAltWay(gd, spec);
  var anyBuy = goodsAnyWayPurchasable(gd, spec);
  var unavailable = !anyBuy;
  var pending = st === 'PENDING_ORDER';
  var partial = st === 'PARTIAL';
  var head = navBar(c + '01', '商品详情', gd.nm,
    '<button class="ico-btn" type="button" data-act="go" data-to="APP-SEARCH-01">搜索</button>' +
    '<button class="ico-btn" type="button" data-act="go" data-to="APP-SERVICE-01">客服</button>');
  var media = mediaCarousel(c + '02', gd, partial);
  var namePrice = C(c + '03',
    '<div class="strong" style="font-size:15px">' + esc(gd.nm) + '</div>' +
    '<div class="small muted">' + esc(gd.en) + '</div>' +
    '<div class="row" style="margin-top:4px"><span class="price" style="font-size:18px"><span class="cur">¥</span>' + gd.price.toFixed(2) + '</span>' +
      '<span class="tag" style="margin-left:6px">' + typeText(gd) + '</span>' +
      ((offShelf || delisted) ? '<span class="tag err">已下架</span>' : '') + '</div>' +
    '<div class="hint">价格为本商城实际销售价，不使用券后价、折扣或历史最低标识（HOME-02）</div>', 'div', 'card');
  /* 游戏介绍（APP-PRODUCT-01-C09）：正文取自后台商品编辑里运营填写的「游戏介绍」，
     为空时整块隐藏、不生成占位内容。详情页只有这一个介绍正文区块——
     原先的「游戏简介」（供应商资料）已并入本块，不再单独展示。 */
  var brief = goodsIntro(gd) ? C(c + '09',
    '<div class="sect-t">游戏介绍</div>' +
    '<div class="small" style="line-height:1.75">' + esc(goodsIntro(gd)) + '</div>', 'div', 'card') : '';
  /* 硬件配置（APP-PRODUCT-01-C10）：读取后台商品编辑里「硬件配置」的内容——
     最低配置来自运营填写的五项，推荐配置来自按游戏名称查到的 Steam 官方配置（模拟）。
     两档都缺时整块隐藏，不生成占位。 */
  var sys = goodsSys(gd);
  var sysRows = function (obj) {
    return [['操作系统', obj.os], ['处理器', obj.cpu], ['内存', obj.ram], ['显卡', obj.gpu], ['存储空间', obj.disk]]
      .filter(function (r) { return r[1]; })
      .map(function (r) {
        return '<tr><td style="padding:4px 0;color:#6b7280;width:70px;vertical-align:top">' + esc(r[0]) + '</td>' +
          '<td style="padding:4px 0">' + esc(r[1]) + '</td></tr>';
      }).join('');
  };
  var hasMin = sys && sys.min && (sys.min.os || sys.min.cpu || sys.min.ram || sys.min.gpu || sys.min.disk);
  var hasRec = sys && sys.rec && (sys.rec.os || sys.rec.cpu || sys.rec.ram || sys.rec.gpu || sys.rec.disk);
  var sysreq = (hasMin || hasRec) ? C(c + '10',
    '<div class="sect-t">硬件配置</div>' +
    (hasMin ? '<div class="small strong" style="margin-top:4px">最低配置</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px">' + sysRows(sys.min) + '</table>' : '') +
    (hasRec ? '<div class="small strong" style="margin-top:8px">推荐配置</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px">' + sysRows(sys.rec) + '</table>' : '') +
    '<div class="xsmall muted" style="margin-top:6px">' + (sys.from === 'steam'
      ? '推荐配置取自 Steam 官方商店；最低配置由运营维护'
      : '以上配置由运营维护') + '</div>', 'div', 'card') : '';
  var ws = waysOf(gd);
  /* 商品须知（APP-PRODUCT-01-C06）：正文读取后台商品编辑里运营填写的「商品须知」，
     为空时整块隐藏。长文本保留展开/收起（APP-PRODUCT-01::EXPANDED），
     折叠态取正文前 60 字作为摘要。 */
  var noticeText = goodsNotice(gd);
  var intro = noticeText ? C(c + '06',
    '<div class="row"><span class="strong">商品须知</span>' +
      '<button class="btn sm" type="button" data-act="toggle-intro" style="margin-left:auto">' + (st === 'EXPANDED' ? '收起' : '展开全部') + '</button></div>' +
    '<div class="small" style="margin-top:6px">' + (st === 'EXPANDED'
      ? esc(noticeText)
      : esc(noticeText.slice(0, 60)) + (noticeText.length > 60 ? '……' : '')) + '</div>' +
    '<div class="hint">退换与客服说明以本区块为准；社区、评分、在线人数、价格趋势、愿望单不纳入首期（PRODUCT-06）</div>', 'div', 'card') : '';
  var bar;
  if (offShelf || delisted || !anyBuy) {
    bar = C(c + '07', '<button class="btn wide" type="button" disabled>' + (offShelf || delisted ? '已下架，不可购买' : (blockReason || '暂不可购买')) + '</button>' +
      '<div class="hint center">已有关联订单仍保留查看入口（PRODUCT-09）</div>', 'div', 'bottom-bar');
  } else if (pending) {
    bar = C(c + '07',
      '<button class="btn primary wide" type="button" data-act="go" data-to="APP-CHECKOUT-01">订单处理中</button>' +
      '<div class="hint center">您有一笔订单待确认，点击查看（不代表赠送已开始履约，PRODUCT-08、4.4）</div>', 'div', 'bottom-bar');
  } else {
    var switchNotice = (blockReason && altWay)
      ? '<div class="banner" style="margin-top:6px"><span class="grow">当前发货方式「' + esc(wayText(wayOf(gd))) + '」' +
        (blockReason.indexOf('补货') === 0 ? '补货中' : '已售罄') +
        '，可在面板切换「' + esc(wayText(altWay)) + '」后购买。</span></div>'
      : '<div class="hint center">打开面板仍属于浏览，不强制登录（4.4）</div>';
    bar = C(c + '07', '<div class="row" style="gap:8px">' +
      '<button class="btn" type="button" data-act="use-guide" style="flex:none">使用指引</button>' +
      '<button class="btn primary grow" type="button" data-act="open-panel">立即购买</button></div>' +
      switchNotice, 'div', 'bottom-bar');
  }
  var notice = pending ? C(c + '08',
    '<div class="banner"><span class="grow">您有一笔订单待确认，点击查看</span>' +
    '<button class="btn sm" type="button" data-act="go" data-to="APP-CHECKOUT-01">查看</button></div>', 'div', '') : '';
  if (st === 'ERROR' || sim === 'fail') {
    return phoneShell(head + stateBlock('', 'error', '商品详情加载失败', '商品可能已下架或网络异常。可返回列表或重试。', '重试', 'retry'));
  }
  return phoneShell(head + media + namePrice + brief + sysreq + intro + notice +
    (stockNote ? '<div class="banner" style="margin-top:8px"><span class="grow">' + esc(stockNote) + '</span></div>' : '') + bar,
    (st === 'PANEL' || st === 'PANEL_AGREE' || st === 'CDK_HELP' || RV.session.panelOpen) ? renderPanel('APP-PANEL-01-C', 'sheet') : '');
}

/* ============================================================
   APP-PANEL-01 购买面板
   ============================================================ */
/* 购买面板内容。同一块内容有两个宿主：
   APP  —— 手机画布内的底部半屏面板，内部各区块各自带组件编号（APP-PANEL-01-C02…C09）；
   WEB  —— PC 画布的居中弹层（WEB-PRODUCT-01-C08，登记形态为「居中弹层」），
           按 01 的注册表整块只算一个组件，因此内部区块不单独标注编号（prefix 传空）。
   两侧共用同一份字段、校验与文案，避免同一规则出现两套实现。 */
function renderPanel(prefix, mode, outerId) {
  var c = prefix || '';
  var centered = mode === 'center';
  /* 组件编号前缀为空时（WEB 侧整块只算一个组件）必须返回空串：
     写成 '' + '02' 会得到 '02'，在画布上生成一批不存在的组件定位点。 */
  var cid = function (n) { return c ? c + n : ''; };
  var gd = g(RV.goodsId || 'P1001');
  var spec = RV.session.spec || gd.ver;
  var price = spec === gd.ver ? gd.price : (gd.type === 'GIFT' ? gd.price + 60 : gd.price + 40);
  var prompt = RV.session.panelPrompt || RV.state === 'PANEL_AGREE';
  var help = !!RV.session.cdkHelp;
  var ws = waysOf(gd);
  var way = wayOf(gd);
  var blockReason = goodsBlockReason(gd, way, spec);
  var altWay = goodsAltWay(gd, spec);
  var vers = [gd.ver, gd.ver2].filter(Boolean);
  var wayTag = function (w) {
    return '<span class="tag' + (w === way ? ' on' : '') + '"' +
      (ws.length > 1 ? ' data-act="way" data-way="' + w + '" role="button" tabindex="0"' : '') +
      ' style="padding:8px 12px;margin:0">' + esc(wayText(w)) + '</span>';
  };
  var inner =
    '<div class="row"><span class="strong">核对购买内容</span>' +
      '<button class="x" type="button" data-act="close-panel" aria-label="关闭购买面板">✕</button></div>' +
    C(cid('02'),
      '<div class="row" style="gap:8px;align-items:flex-start">' + thumb(gd, 56).replace('height:56px', 'height:56px;width:80px;flex:none') +
      '<div class="grow col" style="gap:2px"><span class="small">' + esc(gd.nm) + '－' + esc(spec) + '</span>' +
      '<span class="price"><span class="cur">¥</span>' + price.toFixed(2) + '</span>' +
      '<span class="xsmall muted">实付金额以服务端计算结果为准</span></div></div>', 'div', 'card flat') +
    /* 选择版本：每个版本右侧统一附「仅支持 Steam 国区账号激活」小字与问号入口，
       点击问号打开 CDK 商品购买说明（C11），不改变已选版本。 */
    C(cid('03'),
      '<div class="sect-t">选择版本</div>' +
      '<div class="ver-list" role="radiogroup" aria-label="选择版本">' + vers.map(function (v) {
        var vs = v === gd.ver ? gd.price : (gd.type === 'GIFT' ? gd.price + 60 : gd.price + 40);
        return '<div class="ver-row" role="button" tabindex="0" data-act="spec" data-spec="' + attr(v) + '"' +
          ' aria-pressed="' + (v === spec ? 'true' : 'false') + '">' +
          '<span class="ver-radio" aria-hidden="true"></span>' +
          '<span class="ver-name">' + esc(v) + '</span>' +
          '<span class="ver-price">¥' + vs.toFixed(2) + '</span>' +
          '<span class="ver-note">仅支持 Steam 国区账号激活' +
            '<button class="q" type="button" data-act="cdk-help" aria-label="查看 CDK 商品购买说明"><span class="q-ico" aria-hidden="true">?</span></button></span>' +
          '</div>';
      }).join('') + '</div>' +
      '<div class="hint">切换版本后价格与适用限制同步更新；点右侧问号查看 CDK 商品购买说明</div>', 'div', 'card flat') +
    /* 发货方式：选项来自该商品配置；只有一种配置时不提供切换，仅展示 */
    C(cid('05'),
      '<div class="sect-t">发货方式</div>' +
      '<div class="row wrap" style="gap:8px">' + ws.map(wayTag).join('') + '</div>' +
      '<div class="way-note">' + (ws.length > 1
        ? '本商品支持 CDK 与好友赠送两种发货方式，可任选其一；切换后交付说明与必填资料同步更新。'
        : '本商品配置只支持一种发货方式，不可切换（交付方式取自商品／规格真实配置，4.4）。') + '</div>' +
      '<div class="kv" style="margin-top:6px"><span class="k">可激活地区</span><span class="v">' + esc(regionText(gd)) + '</span></div>' +
      '<div class="kv"><span class="k">适用限制</span><span class="v">' + esc(regionOf(gd, way)) + '；版本 ' + esc(spec) + '；语言 ' + esc(gd.lang) + '</span></div>' +
      '<div class="hint">CDK 与好友赠送为不同交付能力，不混作同一种（4.4）</div>', 'div', 'card flat') +
    (way === 'GIFT' ? C(cid('06'),
      '<div class="sect-t">Steam 好友链接 <span class="tag err">必填</span></div>' +
      '<input class="inp' + (RV.session.linkErr ? ' err' : '') + '" id="flink" placeholder="请输入 Steam 好友链接" value="' + attr(RV.session.link || '') + '" aria-label="Steam好友链接">' +
      (RV.session.linkErr ? '<div class="err-txt">' + esc(RV.session.linkErr) + '</div>' : '<div class="hint">选择好友赠送后为必填；付款前可修改，<b>付款后不可修改</b>，请仔细核对（CHECKOUT-02）</div>'), 'div', 'card flat') : '') +
    C(cid('07'),
      '<div class="sect-t">选择支付方式</div><div class="row wrap" style="gap:8px">' +
      [['WECHAT', '微信支付'], ['ALIPAY', '支付宝']].map(function (p) {
        return '<button class="tag' + ((RV.session.pay || 'WECHAT') === p[0] ? ' on' : '') + '" type="button" data-act="pay" data-pay="' + p[0] + '" style="padding:8px 12px;margin:0">' + p[1] + '</button>';
      }).join('') + '</div>' +
      '<div class="hint">仅支持微信与支付宝，由商城统一经营主体收款（PAY-01）；不提供余额、抖音支付与优惠抵扣</div>', 'div', 'card flat') +
    C(cid('08'),
      '<label class="row check-row" style="gap:8px">' +
      '<input type="checkbox" id="agr" ' + (RV.session.agreementOk ? 'checked' : '') + ' data-act="agr" style="min-height:auto;width:18px;height:18px;flex:none;margin-top:3px">' +
      '<span class="small">我已阅读并同意《购买协议》</span></label>' +
      '<div class="hint">默认不勾选；协议主体为商城经营公司，内容包含商品适用范围、交付方式、时效、退款原则及客服方式（AGREEMENT-01）</div>', 'div', 'card flat') +
    C(cid('09'),
      (goodsStockNote(gd, way) ? '<div class="banner" style="margin-bottom:8px"><span class="grow">' + esc(goodsStockNote(gd, way)) + '</span></div>' : '') +
      (blockReason && altWay ? '<div class="banner" style="margin-bottom:8px"><span class="grow">当前发货方式「' + esc(wayText(way)) + '」' +
        (blockReason.indexOf('补货') === 0 ? '补货中' : '已售罄') + '；请选择「' + esc(wayText(altWay)) + '」后继续购买。</span></div>' : '') +
      (RV.session.panelMsg ? '<div class="banner" style="border-color:#a33b3b;color:#a33b3b">' + esc(RV.session.panelMsg) + '</div>' : '') +
      '<button class="btn primary wide" type="button" data-act="buy"' + (RV.session.busy || blockReason ? ' disabled' : '') + '>' +
      (RV.session.busy ? '校验中…' : (blockReason ? (blockReason.indexOf('补货') === 0 ? '补货中' : '已售罄') : '购买并支付 ¥' + price.toFixed(2))) + '</button>' +
      '<div class="hint center">点击后按 登录 → 实名成年 → 购买协议 → 手机号绑定 → 商品校验 依次核验（5.1）</div>', 'div', 'card flat');
  /* 购买须知作为面板之上的独立弹层：自带遮罩、居中显示，不覆盖不遮挡面板内容的滚动 */
  var promptHtml = prompt
    ? '<div class="modal-mask" data-component="' + c + '10" style="position:absolute;inset:0;z-index:9;' +
      'background:rgba(32,36,42,.35);border-radius:16px 16px 0 0;padding:12px">' +
      '<div class="modal center" style="max-height:84%">' +
      '<div class="center strong" style="margin-bottom:6px">购买须知</div>' +
      '<div class="small">为了更好地保障您的合法权益，请您阅读并同意以下协议《购买协议》。</div>' +
      '<div class="row" style="gap:8px;margin-top:12px">' +
      '<button class="btn grow" type="button" data-act="prompt-cancel">取消</button>' +
      '<button class="btn primary grow" type="button" data-act="prompt-agree">同意并继续</button></div>' +
      '<div class="hint center">"同意并继续"仍需核验手机号，不能绕过到达支付（AGREEMENT-02）</div>' +
      '</div></div>'
    : '';
  /* CDK 商品购买说明弹层（由「选择版本」右侧问号打开）：说明在使用前需要知道的事项，
     只做解释、不改变任何选择状态；关闭后回到面板原位置。 */
  var helpHtml = help
    ? '<div class="modal-mask" data-component="' + c + '11" style="position:absolute;inset:0;z-index:10;' +
      'background:rgba(32,36,42,.35);border-radius:16px 16px 0 0;padding:12px">' +
      '<div class="modal center" style="max-height:86%">' +
      '<div class="row"><span class="strong grow">CDK 商品购买说明</span>' +
      '<button class="x" type="button" data-act="close-help" aria-label="关闭说明" style="position:static">✕</button></div>' +
      '<div class="small" style="line-height:1.8;text-align:left;margin-top:8px">' +
        '<b>一、CDK 是什么</b><br>CDK（口令码）是一串可在 Steam 激活的兑换码。商城在服务端确认付款成功后自动向供应商取码，取码成功后展示在订单详情与支付结果页，可随时查看与复制。<br>' +
        '<b>二、激活地区</b><br>本商品的口令码<b>仅支持 Steam 国区账号激活</b>。使用非国区账号激活会失败，且激活失败的码不支持退换，请先确认账号所属地区。<br>' +
        '<b>三、如何激活</b><br>Steam 客户端 → 添加游戏 → 在 Steam 上激活产品 → 输入口令码 → 激活完成后游戏进入库中。网页版 Steam 同样可激活。<br>' +
        '<b>四、保管与转发</b><br>口令码可随时在订单中查看。请勿转发给他人，本商品不记名、不挂失；被他人先行激活的码不在补发范围内。<br>' +
        '<b>五、异常处理</b><br>出现无法激活、提示已被使用、与本商品版本不符等情况时，请通过企业微信客服并提供订单编号，由客服核查后处理。' +
      '</div>' +
      '<div class="row" style="margin-top:12px"><button class="btn primary wide" type="button" data-act="close-help">我知道了</button></div>' +
      '<div class="hint center">说明不改变已选版本与发货方式，关闭后回到购买面板</div>' +
      '</div></div>'
    : '';
  /* 组件编号落点：APP 的底部面板由 C01 代表整块（含遮罩），编号照旧标在遮罩上；
     WEB 的居中弹层整块算一个组件，编号改标在弹层本体上——遮罩铺满整个 PC 画布，
     标在遮罩上描边会框住整屏而不是弹层，评审定位不到面板。 */
  if (centered) {
    return '<div class="modal-mask center">' +
      C(outerId, inner + promptHtml + helpHtml, 'div', 'modal dlg') + '</div>';
  }
  return C(cid('01'), '<div class="modal">' + inner + promptHtml + helpHtml + '</div>', 'div', 'modal-mask bottom');
}

/* ============================================================
   APP-AUTH-01 实名说明弹层
   ============================================================ */
function rAuth(page, st) {
  return phoneShell(
    navBar('APP-PRODUCT-01-C01', '商品详情', '实名认证说明弹层演示页', '') +
    '<div class="card"><div class="sk h20" style="margin-bottom:6px"></div><div class="sk" style="width:60%"></div></div>',
    modalMask('APP-AUTH-01-C01', 'center',
      modalHead('实名认证') +
      C('APP-AUTH-01-C02',
        '<div class="small" style="line-height:1.75">购买前需要完成实名认证。若所属平台已返回可信实名结果（已成年/未成年），商城直接使用；若平台无法提供或您尚未认证，可填写<b>姓名与身份证号</b>，由商城调用国家认证接口完成核验。</div>' +
        '<div class="hint">认证服务由国家认证接口提供，销售 CDK 公司后续提供；原型不调用真实接口、不保存完整姓名与证件号。</div>', 'div', '') +
      '<div class="row" style="gap:10px;margin-top:12px">' +
        C('APP-AUTH-01-C03', '<button class="btn grow" type="button" data-act="auth-cancel">暂不认证</button>', 'div', 'grow') +
        C('APP-AUTH-01-C04', '<button class="btn primary grow" type="button" data-act="auth-go">前往认证</button>', 'div', 'grow') +
      '</div>' +
      '<div class="hint center">取消认证将停止本次购买，保留已填写的现场，您仍可继续浏览（3.3、AUTH-10）</div>'));
}

/* ============================================================
   APP-AGREEMENT-01 购买协议查看
   ============================================================ */
function rAgreement(page, st, sim) {
  var body;
  if (st === 'ERROR' || sim === 'fail') {
    body = stateBlock('', 'error', '协议加载失败', '暂时无法获取协议正文，购买流程未继续。可重试。', '重试', 'retry');
  } else {
    body = C('APP-AGREEMENT-01-C02',
      '<div class="kv"><span class="k">协议版本</span><span class="v">V1.0（模拟数据）</span></div>' +
      '<div class="kv"><span class="k">生效日期</span><span class="v">2026-10-15（模拟数据）</span></div>' +
      '<div class="kv"><span class="k">协议主体</span><span class="v">商城经营公司</span></div>' +
      '<hr class="hr">' +
      '<div class="small" style="line-height:1.8">' +
      '<b>一、商品适用范围</b><br>本协议适用于本商城销售的 Steam 平台数字商品，交付方式包括口令码自动发码与 Steam 好友赠送人工交付，以商品页实际标注为准。<br><br>' +
      '<b>二、交付方式与时效</b><br>口令码商品在服务端确认付款成功后自动取码，取得后可在订单中查看与复制；好友赠送由运营在工作日 8:00～18:00（中国标准时间）人工完成，工作时间内下单预计 2～6 小时完成，非工作时段顺延至下一工作时段。<br><br>' +
      '<b>三、退款原则</b><br>虚拟商品一经售出原则上不可退款；如遇口令码无法激活、交付异常等情况，请联系企业微信客服并提供订单编号，由商城核查后处理。<br><br>' +
      '<b>四、客服方式</b><br>售中与售后统一通过企业微信客服沟通；服务时间以商城公布为准。<br><br>' +
      '<span class="muted">（正式文本由业务提供并评审，本处为原型占位内容，ADM-13／TBD-12）</span></div>', 'div', 'card');
  }
  var ver = st === 'STALE';
  return phoneShell(
    navBar('APP-AGREEMENT-01-C01', '购买协议', ver ? '协议版本已更新' : '') +
    (ver ? '<div class="banner"><span class="grow">协议版本已更新，继续支付前需重新确认。</span></div>' : '') +
    body +
    C('APP-AGREEMENT-01-C03',
      '<button class="btn wide" type="button" data-act="back">返回并保留原购买内容</button>' +
      '<div class="hint center">本页仅用于查看与返回，不代替勾选与同意操作（AGREEMENT-01）</div>', 'div', 'bottom-bar'));
}
