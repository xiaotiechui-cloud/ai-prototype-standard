
/* ============================================================
   WEB 桌面 Web 客户端（平台C 内嵌浏览器）
   与 APP 共用同一套业务规则、配置与校验；仅布局形态不同。
   布局方案标注为"设计建议，待设计评审（TBD-03）"。
   ============================================================ */
function deskShell(inner, opts) {
  opts = opts || {};
  return '<div class="desk' + (opts.narrow ? ' desk-narrow' : '') + '">' +
    '<div class="desk-bar"><span class="blk" style="width:8px;height:8px;border-radius:50%"></span>' +
    '<span class="blk" style="width:8px;height:8px;border-radius:50%"></span>' +
    '<span class="blk" style="width:8px;height:8px;border-radius:50%"></span>' +
    '<span style="margin-left:8px">平台C · 修改器内嵌浏览器　' + esc(opts.url || 'steam-mall.example/…') + '</span>' +
    '<span style="margin-left:auto" data-deskw>画布宽度 —</span></div>' +
    '<div class="desk-body' + (opts.scroll ? '' : '') + '">' + inner + '</div>' +
    (opts.overlay || '') + (typeof useGuideModal === 'function' ? useGuideModal() : '') + '</div>';
}
/* PC 顶部导航条：左「商城标识 + 内容导航」，右「用户区」，两段用竖线分隔。
   一级页面只有「商城」与「我的」两个（与移动端一致），顶栏的职责是表达这两个一级入口并保持入口唯一：
   ① 左「商城」（WEB-HOME-01）与「搜索商品」（WEB-SEARCH-01 默认态）——「搜索商品」是商城内的检索工具，
      不是独立的一级页面；此前「搜索」既是导航项、右上角又有一个「搜索商品」按钮，同一功能出现两个控件。
   ② 右「我的」（WEB-MINE-01）。「我的订单 / 我的 / 客服」在顶栏移除后统一收进「我的」页，
      不再在顶栏与「我的」页各出现一次。
   ③ 顶栏不设搜索输入框（按评审意见移除）：关键词输入统一在搜索页内完成。
   标识（Logo）可点击回商城首页；当前页用 aria-current 标记，不再与选中态标签混用。 */
function webNav(cid, active, opts) {
  /* 一级页面只有「商城」与「我的」两个（与移动端一致）：商城 = WEB-HOME-01，我的 = WEB-MINE-01。
     「搜索商品」是商城内的检索工具，不是独立的一级页面；「我的订单 / 客服」收进「我的」页。
     二级页面的返回入口不放这里，而是跟业务标题同行（见 webPageFrame）——
     顶栏是站点级导航，各页保持一致；返回是「本页回到来源页」，贴在标题左侧更符合 PC 习惯。 */
  var navItems = [['WEB-HOME-01', '商城'], ['WEB-SEARCH-01', '搜索商品']];
  var userItems = [['WEB-MINE-01', '我的']];
  var inner =
    '<div class="topbar">' +
      '<button class="topbar-logo" type="button" data-act="go" data-to="WEB-HOME-01">Steam商城</button>' +
      '<nav class="topbar-nav" aria-label="主导航">' +
        navItems.map(function (it) {
          return '<button type="button" data-act="go" data-to="' + it[0] + '"' +
            (it[0] === active ? ' aria-current="page"' : '') + '>' + it[1] + '</button>';
        }).join('') +
      '</nav>' +
      '<div class="topbar-user">' +
        '<span class="sep" aria-hidden="true"></span>' +
        userItems.map(function (it) {
          return '<button type="button" data-act="go" data-to="' + it[0] + '"' +
            (it[0] === active ? ' aria-current="page"' : '') + '>' + it[1] + '</button>';
        }).join('') +
      '</div>' +
    '</div>';
  return cid ? C(cid, inner, 'div', 'card flat') : '<div class="card flat">' + inner + '</div>';
}
function navWebPlaceholder() { return webNav(null, ''); }
function webGoodsGrid(cid, arr, cols) {
  return C(cid, '<div class="grid-auto">' + arr.map(function (gd) {
    return '<div data-act="go" data-to="WEB-PRODUCT-01" data-goods="' + attr(gd.id) + '" data-goods-wrap="1" role="button" tabindex="0">' + goodsCard('', gd) + '</div>';
  }).join('') + '</div>', 'div', '');
}
/* 页面骨架：顶栏在最上方（全局导航必须先出现），业务标题与状态行紧随其后。
   此前标题行渲染在顶栏之前，且直接复用了评审用的页面名（如「商城首页（PC 多列）」「（居中弹窗）」），
   既不符合桌面 Web 结构，也把评审描述画进了业务画布——评审信息统一留在画布外的评审区。 */
/* backId：传入组件编号时，在业务标题左侧渲染「‹ 返回」并把它标为该组件的组成部分。
   PC 二级页面的返回入口按 03 的 WEB-PRODUCT-01-C01「返回来源页面」登记，
   与站点级顶栏分开：顶栏各页一致，返回只出现在需要它的页面。 */
function webPageFrame(title, hint, nav, content, backId) {
  return (nav || '') +
    '<div class="page-head">' +
    (backId ? C(backId, '‹ 返回', 'button', 'page-back', '') .replace('<button', '<button type="button" data-act="back" aria-label="返回上一页"') : '') +
    '<span class="t">' + esc(title) + '</span>' +
    (hint ? '<span class="n">' + esc(hint) + '</span>' : '') + '</div>' + content +
    '<div class="hint" style="margin-top:10px">［设计建议，待设计评审（TBD-03）］桌面布局采用多列 / 分栏与自适应宽度，业务规则与移动端完全一致。</div>';
}

/* ---------- WEB-HOME-01 ---------- */
function rWebHome(page, st, sim) {
  var c = 'WEB-HOME-01-C';
  var nav = webNav(c + '01', 'WEB-HOME-01');
  if (st === 'ERROR' || sim === 'fail') {
    return deskShell(webPageFrame('商城首页', '内容加载失败', nav, stateBlock('', 'error', '首页加载失败', '网络异常或服务暂不可用，排序与筛选条件已保留。', '重新加载', 'retry')));
  }
  if (st === 'EMPTY' || sim === 'empty') {
    return deskShell(webPageFrame('商城首页', '暂无可展示商品', nav, stateBlock('', 'empty', '当前没有可展示的商品', '运营尚未发布首页配置或商品均已下架。', '重新加载', 'retry')));
  }
  /* WEB 首页广告位（WEB-HOME-01-C02）：与 APP 同一份数据与行为，尺寸走 .desk 下的 .ad-img */
  var ad = adBanner(c + '02', { tall: true });
  var arr = GOODS.slice(0, 8);
  if ((RV.sort || '') === '价格↑') arr.sort(function (a, b) { return a.price - b.price; });
  if ((RV.sort || '') === '价格↓') arr.sort(function (a, b) { return b.price - a.price; });
  /* 排序与它作用的商品列表同属一个内容块：标题左、排序右。
     此前排序单独占一行夹在广告位与网格之间，与列表脱离，也不符合桌面 Web「区块标题 + 排序」的惯例。
     C05「快捷入口区」本次删除：其中"我的订单 / 我的 / 客服"与顶栏用户区完全重复，
     "确认订单（未支付恢复）」不是首页该有的常驻入口（FL-CHECKOUT-001 登记的入口是订单列表继续支付，
     见 WEB-ORDER-01 操作列），保留只会造成同一功能两处入口、且位置夹在广告与排序之间。 */
  var secHead =
    '<div class="sec-head"><span class="t">全部商品</span><span class="n">共 ' + arr.length + ' 个</span>' +
    '<div class="sort">' + sortBar(c + '03', RV.sort || '推荐', null, true) + '</div></div>';
  var grid = webGoodsGrid(c + '04', arr, 4);
  return deskShell(webPageFrame('商城首页', '排序：' + (RV.sort || '推荐'), nav, ad + secHead + grid), { url: 'steam-mall.example/home' });
}

/* ---------- WEB-SEARCH-01 ---------- */
function rWebSearch(page, st, sim) {
  var c = 'WEB-SEARCH-01-C';
  var kw = RV.kw || '';
  /* 搜索默认态（还没搜过 / 从结果页返回）输入框为空，不回填上次的关键词（评审反馈）；
     结果态仍显示当前关键词，便于就地改词重搜。 */
  var entry = (!kw || st === 'DEFAULT');
  var box = C(c + '01',
    '<div class="row" style="gap:8px">' +
    '<input class="inp" id="kw3" style="max-width:420px" placeholder="输入商品名称搜索" value="' + attr(entry ? '' : kw) + '" aria-label="搜索关键词">' +
    '<button class="btn sm" type="button" data-act="search" data-from="w1">搜索</button>' +
    '<span class="xsmall muted">Enter 等价于点击搜索按钮</span></div>', 'div', 'card flat');
  if (entry) {
    var wkws = searchKwList(), whots = searchHotList();
    var disc = wkws.length ? C(c + '02',
      '<div class="row"><span class="strong">搜索发现</span></div>' +
      '<div class="grid-auto" style="margin-top:8px">' + wkws.map(function (w) {
        return '<button class="tag" type="button" data-act="word" data-word="' + attr(w) + '" style="min-height:36px;margin:0;text-align:left">' + esc(w) + '</button>';
      }).join('') + '</div><div class="hint">关键词由后台「搜索推荐配置」维护，按配置顺序展示前 ' + SEARCH_KW_LIMIT + ' 个（SEARCH-04、ADM-14）。</div>', 'div', 'card') : '';
    var hot = whots.length ? C(c + '03',
      '<div class="strong">搜索热门商品</div>' +
      whots.map(function (x, k) {
        return '<div class="row" style="padding:5px 0;border-top:' + (k ? '1px solid #e3e6ea' : '0') + '" data-act="go" data-to="WEB-PRODUCT-01" data-goods="' + attr(x.id) + '" role="button" tabindex="0">' +
          '<span class="tag" style="width:22px;text-align:center;margin:0">' + (k + 1) + '</span>' + '<span class="small">' + esc(x.nm) + '</span></div>';
      }).join(''), 'div', 'card') : '';
    return deskShell(webPageFrame('搜索', '输入关键词后按 Enter 或点击搜索', navWebPlaceholder(), box + disc + hot));
  }
  var hits = GOODS.filter(function (x) { return x.nm.indexOf(kw) >= 0; });
  var body;
  if (st === 'EMPTY' || sim === 'empty' || !hits.length) {
    body = stateBlock('', 'empty', '未找到匹配内容', '关键词“' + esc(kw) + '”没有匹配商品；已保留关键词，可修改后重新搜索。');
  } else if (st === 'ERROR' || sim === 'fail') {
    body = stateBlock('', 'error', '请求失败', '已保留关键词，可重试。', '重试', 'retry');
  } else {
    body = webGoodsGrid(c + '04', hits, 4);
  }
  var pager = C(c + '05',
    '<div class="row" style="gap:8px;justify-content:center;margin-top:10px">' +
    '<button class="btn sm" type="button" disabled>上一页</button>' +
    '<button class="btn sm" type="button" aria-pressed="true">1</button>' +
    '<button class="btn sm" type="button" disabled>下一页</button>' +
    '<span class="xsmall muted">共 ' + (hits.length || 0) + ' 条 · 每页 20 条 · 仅 1 页时禁用无效翻页</span></div>', 'div', '');
  return deskShell(webPageFrame('搜索结果', '关键词：' + esc(kw) + '　结果 ' + hits.length +
    ' 条　·　顺序由搜索服务按相关度返回，结果页不提供排序与筛选入口（SEARCH-03）', navWebPlaceholder(), box + body + pager));
}


/* ---------- WEB-PRODUCT-01 ---------- */
function rWebProduct(page, st, sim) {
  var c = 'WEB-PRODUCT-01-C';
  var gd = g(RV.goodsId || 'P1001');
  var off = st === 'UNAVAILABLE';
  var delisted = goodsDelisted(gd);
  var pending = st === 'PENDING_ORDER';
  /* 顶栏仍是本页的「详情顶部导航」（C01）；返回入口与它同属 C01，
     但按评审意见落在业务标题左侧，不放进顶栏。选择 C01 时两处一起描边。 */
  var nav = webNav(c + '01', '');
  /* 顶图与缩略图取后台「商品图片/视频」列表，顺序＝后台拖拽后的顺序（CHG-0069） */
  var wm = mediaItems(gd);
  var wi = Math.min(Math.max(RV.mediaIdx || 0, 0), wm.length - 1);
  var wcur = wm[wi];
  var left = C(c + '02',
    '<div class="blk" style="height:280px;display:flex;align-items:center;justify-content:center;color:#6b7280;font-size:12px">' +
      (wcur.kind === 'VIDEO' ? '▶ ' : '') + esc(wcur.label) + '</div>' +
    (wm.length > 1 ? '<div class="row" style="gap:6px;margin-top:8px">' + wm.map(function (it, k) {
      return '<button class="blk" type="button" data-act="media-go" data-idx="' + k + '" aria-pressed="' + (k === wi ? 'true' : 'false') +
        '" style="width:72px;height:46px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#6b7280;cursor:pointer">' +
        (it.kind === 'VIDEO' ? '▶视频' : '图' + it.idx) + '</button>';
    }).join('') + '</div>' : ''), 'div', '');
  var right = C(c + '03',
    '<div class="strong" style="font-size:18px">' + esc(gd.nm) + '</div>' +
    '<div class="small muted">' + esc(gd.en) + '</div>' +
    '<div class="row" style="margin-top:6px"><span class="price" style="font-size:22px"><span class="cur">¥</span>' + gd.price.toFixed(2) + '</span>' +
    '<span class="tag">' + typeText(gd) + '</span>' + ((off || delisted) ? '<span class="tag err">已下架</span>' : '') + '</div>' +
    '<div class="hint">使用本商城实际销售价；不使用券后价、折扣或历史最低标识（HOME-02）</div>', 'div', 'card');
  /* 游戏介绍（WEB-PRODUCT-01-C09）：正文取自后台商品编辑里运营填写的「游戏介绍」，
     为空时整块隐藏、不生成占位。与 APP-PRODUCT-01-C09 同源同字段。 */
  var opIntro = goodsIntro(gd) ? C(c + '09',
    '<div class="strong small">游戏介绍</div>' +
    '<div class="small" style="margin-top:4px;line-height:1.75">' + esc(goodsIntro(gd)) + '</div>', 'div', 'card') : '';
  /* 商品须知（WEB-PRODUCT-01-C06）：正文读取后台商品编辑里运营填写的「商品须知」，
     为空时整块隐藏。长文本保留展开/收起（WEB-PRODUCT-01::EXPANDED），
     折叠态取正文前 60 字作为摘要。与 APP-PRODUCT-01-C06 同源同字段。 */
  var wNotice = goodsNotice(gd);
  var intro = wNotice ? C(c + '06', '<div class="row"><span class="strong small">商品须知</span>' +
    '<button class="btn sm" type="button" data-act="toggle-intro" style="margin-left:auto">' + (st === 'EXPANDED' ? '收起' : '展开全部') + '</button></div>' +
    '<div class="small" style="margin-top:4px;line-height:1.75">' + (st === 'EXPANDED'
      ? esc(wNotice)
      : esc(wNotice.slice(0, 60)) + (wNotice.length > 60 ? '……' : '')) + '</div>' +
    '<div class="hint">退换与客服说明以本区块为准；社区、评分、在线人数、价格趋势、愿望单不纳入首期（PRODUCT-06）</div>', 'div', 'card') : '';
  /* 硬件配置（WEB-PRODUCT-01-C10）：与 APP-PRODUCT-01-C10 同源，
     读后台商品编辑里「硬件配置」的内容——最低配置为运营维护，推荐配置为按游戏名
     搜索到的 Steam 官方配置（模拟）。两档都缺时整块隐藏，不生成占位。 */
  var wSys = goodsSys(gd);
  var wSysRows = function (obj) {
    return [['操作系统', obj.os], ['处理器', obj.cpu], ['内存', obj.ram], ['显卡', obj.gpu], ['存储空间', obj.disk]]
      .filter(function (r) { return r[1]; })
      .map(function (r) {
        return '<tr><td style="padding:4px 0;color:#6b7280;width:76px;vertical-align:top">' + esc(r[0]) + '</td>' +
          '<td style="padding:4px 0">' + esc(r[1]) + '</td></tr>';
      }).join('');
  };
  var wHasMin = wSys && wSys.min && (wSys.min.os || wSys.min.cpu || wSys.min.ram || wSys.min.gpu || wSys.min.disk);
  var wHasRec = wSys && wSys.rec && (wSys.rec.os || wSys.rec.cpu || wSys.rec.ram || wSys.rec.gpu || wSys.rec.disk);
  var sysreq = (wHasMin || wHasRec) ? C(c + '10',
    '<div class="strong small">硬件配置</div>' +
    (wHasMin ? '<div class="small strong" style="margin-top:6px">最低配置</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px">' + wSysRows(wSys.min) + '</table>' : '') +
    (wHasRec ? '<div class="small strong" style="margin-top:8px">推荐配置</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px">' + wSysRows(wSys.rec) + '</table>' : '') +
    '<div class="xsmall muted" style="margin-top:6px">' + (wSys.from === 'steam'
      ? '推荐配置取自 Steam 官方商店；最低配置由运营维护'
      : '以上配置由运营维护') + '</div>', 'div', 'card') : '';
  var buyCard;
  var wSpec = RV.session.spec || gd.ver;
  var wBlock = goodsBlockReason(gd, wayOf(gd), wSpec);
  var wAlt = goodsAltWay(gd, wSpec);
  var wStockNote = goodsStockNote(gd, wayOf(gd));
  var wUnavailable = !goodsAnyWayPurchasable(gd, wSpec);
  if (off || delisted || wUnavailable) {
    buyCard = C(c + '07', '<div class="empty"><span class="t">' + ((off || delisted) ? '该商品已下架' : (wBlock || '暂不可购买')) + '</span>' + ((off || delisted) ? '不可新增交易；已有关联订单仍保留查看入口（PRODUCT-09）。' : '当前发货方式均不可售，请稍后重试或浏览其他商品。') + '</div>' +
      '<button class="btn wide" type="button" data-act="go" data-to="WEB-ORDER-01" style="margin-top:8px">查看我的订单</button>', 'div', 'card');
  } else if (pending) {
    buyCard = C(c + '07', '<div class="banner"><span class="grow">您有一笔订单待确认，点击查看</span></div>' +
      '<button class="btn primary wide" type="button" data-act="go" data-to="WEB-CHECKOUT-01" style="margin-top:8px">订单处理中</button>' +
      '<div class="hint">不代表好友赠送已开始履约（PRODUCT-08、4.4）</div>', 'div', 'card');
  } else {
    var wSwitchNotice = (wBlock && wAlt)
      ? '<div class="banner" style="margin-top:8px"><span class="grow">当前发货方式「' + esc(wayText(wayOf(gd))) + '」' +
        (wBlock.indexOf('补货') === 0 ? '补货中' : '已售罄') +
        '，可在面板切换「' + esc(wayText(wAlt)) + '」后购买。</span></div>'
      : '<div class="hint">PC 使用居中面板承接规格、交付方式、支付方式与协议确认（4.4）</div>';
    buyCard = C(c + '07', '<div class="row"><span class="small muted">应付金额</span><span class="price" style="margin-left:auto">' + CNY(gd.price) + '</span></div>' +
      '<div class="row" style="gap:8px;margin-top:8px"><button class="btn" type="button" data-act="use-guide" style="flex:none">使用指引</button>' +
      '<button class="btn primary grow" type="button" data-act="open-panel">立即购买</button></div>' +
      wSwitchNotice, 'div', 'card');
  }
  var body = '<div class="split2">' +
    '<div class="col">' + left + opIntro + sysreq + intro + '</div>' +
    '<div class="col">' + right + (wStockNote ? '<div class="banner"><span class="grow">' + esc(wStockNote) + '</span></div>' : '') + buyCard + '</div></div>';
  return deskShell(webPageFrame('商品详情', '', nav, body, c + '01'),
    { scroll: true, overlay: webBuyPanel(st) + webAuthModal(), url: 'steam-mall.example/product/' + gd.id });
}

/* WEB-PRODUCT-01-C08 购买面板（居中弹层）
   登记形态见 01 第6.2.2节「WEB-PRODUCT-01::PANEL_OPEN｜居中购买面板｜原型入口：点击「立即购买」」；
   面板内容与规则复用 APP-PANEL-01（PRD 4.4「PC 可采用侧栏或居中面板」），
   因此直接调用同一份 renderPanel，只是宿主换成 PC 画布的居中弹层、整块算一个组件编号。
   此前 PC 详情页只在右侧购买卡放了按钮，点下去没有任何反应（面板未实现）。 */
function webAuthModal() {
  if (!RV.session.authPrompt) return '';
  return C('WEB-PRODUCT-01-C11',
    '<div class="modal" style="max-width:460px">' +
    '<div class="center strong" style="margin-bottom:6px">购买前需完成实名认证</div>' +
    '<div class="small" style="line-height:1.75">若所属平台已返回可信实名结果，商城将直接使用；平台无法提供或您尚未认证时，可填写姓名与身份证号，由商城调用国家认证接口完成核验。</div>' +
    '<div class="hint">认证服务由国家认证接口提供，销售 CDK 公司后续提供；原型不调用真实接口、不保存完整姓名与证件号。</div>' +
    '<div class="row" style="gap:8px;margin-top:12px">' +
    '<button class="btn grow" type="button" data-act="auth-cancel-web">暂不认证</button>' +
    '<button class="btn primary grow" type="button" data-act="auth-manual">前往认证</button></div>' +
    '<div class="hint center">取消后停止本次购买并保留现场，仍可继续浏览。</div>' +
    '</div>', 'div', 'modal-mask center', 'position:absolute;inset:0;z-index:20');
}
function webBuyPanel(st) {
  var open = RV.session.panelOpen || st === 'PANEL_OPEN' || st === 'PANEL_AGREE' || st === 'CDK_HELP';
  if (!open) return '';
  return renderPanel('', 'center', 'WEB-PRODUCT-01-C08');
}

/* PC 收银台扫码弹窗（CHG-0048）：待扫码 → 支付确认中 → 支付成功三态。
   支付方式在确认订单页（C03）选定，**弹窗内不展示支付方式、也不提供切换入口**（CHG-0052）：
   二维码块与提示语一律不带渠道名，渠道切换行已移除。
   原型不加载外部图片，二维码用占位块表示；两个「模拟」按钮分别代表
   "用户完成扫码付款"与"渠道回调确认支付成功"，便于评审分段查看每一步。 */
function payChannelName(ch) { return ch === 'ALIPAY' ? '支付宝' : '微信支付'; }
function payQrModal(cid, st) {
  var o = Object.assign({}, MOCK_ORDER, RV.session.order || {}, RV.session.resumeOrder ? { no: RV.session.resumeOrder } : {});
  var head = '<div class="row"><span class="strong">收银台 · 扫码支付</span>' +
    '<button class="x" type="button" data-act="pay-qr-cancel" style="position:static;margin-left:auto" aria-label="关闭收银台">✕</button></div>';
  var info = '<div class="kv" style="margin-top:8px"><span class="k">订单号</span><span class="v brk">' + esc(o.no) + '</span></div>' +
    '<div class="kv"><span class="k">应付金额</span><span class="v price">' + CNY(o.amount) + '</span></div>';
  var body;
  if (st === 'QR_SUCCESS') {
    body = '<div class="qr-ok" aria-hidden="true">✓</div>' +
      '<div class="center strong" style="font-size:16px">支付成功</div>' +
      '<div class="center small muted" style="margin-top:4px">页面可以关闭了。</div>' +
      '<div class="hint center" style="margin-top:8px">订单已完成付款与交付，可前往「我的订单」找到该笔订单并复制口令码。' +
      '口令码仅在本人登录且通过权限校验的订单中展示。</div>' + info +
      '<div class="row" style="gap:8px;margin-top:10px">' +
      '<button class="btn primary" type="button" data-act="go" data-to="WEB-ORDER-01" style="flex:1">前往我的订单</button>' +
      '<button class="btn" type="button" data-act="pay-qr-close" style="flex:1">关闭弹窗</button></div>';
  } else if (st === 'QR_CONFIRMING') {
    body = '<div class="qr-steps"><span class="done">1 扫码付款</span><span class="now">2 渠道确认</span><span>3 支付完成</span></div>' +
      '<div class="qr-box" aria-label="支付结果确认中">正在向支付渠道查询支付结果…</div>' +
      '<div class="hint center">渠道回调可能延迟。确认期间请勿关闭页面或重复付款；结果不明时以服务端查询结论为准。</div>' + info +
      '<div class="row" style="gap:8px;margin-top:10px">' +
      '<button class="btn primary" type="button" data-act="pay-qr-confirm" style="flex:1">模拟：渠道确认支付成功</button>' +
      '<button class="btn" type="button" data-act="pay-qr-cancel">取消</button></div>';
  } else {
    body = '<div class="qr-steps"><span class="now">1 扫码付款</span><span>2 渠道确认</span><span>3 支付完成</span></div>' +
      '<div class="qr-box" aria-label="支付二维码占位">［支付二维码］</div>' +
      '<div class="hint center">请使用所选支付方式扫描上方二维码完成付款。本原型不加载外部图片，二维码以占位块表示。</div>' + info +
      '<div class="row" style="gap:8px;margin-top:10px">' +
      '<button class="btn primary" type="button" data-act="pay-qr-scanned" style="flex:1">模拟：用户已扫码并付款</button>' +
      '<button class="btn" type="button" data-act="pay-qr-cancel">取消</button></div>';
  }
  return modalMask(cid, 'dlg', head + body);
}

/* ---------- WEB-CHECKOUT-01 ---------- */
function rWebCheckout(page, st, sim) {
  var c = 'WEB-CHECKOUT-01-C';
  /* 从订单列表「继续支付」进入时按被点击的订单号展示，而不是固定第一条 */
  var o = Object.assign({}, MOCK_ORDER, RV.session.order || {}, RV.session.resumeOrder ? { no: RV.session.resumeOrder } : {});
  var gd = g(o.goodsId);
  var qrOpen = st === 'QR_WAIT' || st === 'QR_CONFIRMING' || st === 'QR_SUCCESS';
  var submitting = st === 'SUBMITTING';
  var closed = st === 'EXPIRED';
  var nav = webNav('', '');
  var detail = C(c + '01',
    '<div class="row" style="gap:10px;align-items:flex-start">' + thumb(gd, 64).replace('height:64px', 'height:64px;width:92px;flex:none') +
    '<div class="grow col" style="gap:2px"><span class="small strong">' + esc(gd.nm) + '－' + esc(o.spec) + '</span>' +
    '<span class="xsmall muted">数量 ×1 · 交付方式：' + (o.type === 'GIFT' ? '好友赠送（人工交付）' : '口令码自动发码') + '</span>' +
    '<span class="xsmall muted">可激活地区：' + esc(regionText(gd)) + '　' + esc(regionOf(gd, RV.session.way)) + '</span></div></div>' +
    '<div class="kv" style="margin-top:6px"><span class="k">订单号</span><span class="v brk">' + esc(o.no) + '</span></div>' +
    '<div class="hint">保存成交商品、价格、规格、交付规则及协议版本快照（CHECKOUT-05）；下单价格已锁定，支付按下单快照金额，价格变化无需重新确认。</div>', 'div', 'card') +
    (goodsStockNote(gd, wayOf(gd)) ? '<div class="banner"><span class="grow">' + esc(goodsStockNote(gd, wayOf(gd))) + '</span></div>' : '');
  var link = C(c + '02', '<div class="strong small">Steam 好友链接（仅赠送必填）</div>' +
    '<div class="row" style="gap:8px;margin-top:4px"><input class="inp" value="' + attr(RV.session.link || '') + '" placeholder="口令码商品不要求填写" aria-label="Steam好友链接" style="max-width:460px">' +
    '<span class="xsmall muted">付款后不可修改</span></div>' +
    '<div class="hint">好友链接仅校验已具备的能力；没有供应商验证能力时不承诺格式正确等于必能赠送（CHECKOUT-08）</div>', 'div', 'card');
  var pay = C(c + '03', '<div class="strong small">支付方式</div>' +
    '<div class="row" style="gap:8px;margin-top:6px">' +
    [['WECHAT', '微信支付'], ['ALIPAY', '支付宝']].map(function (p) {
      return '<button class="tag' + ((RV.session.pay || 'WECHAT') === p[0] ? ' on' : '') + '" type="button" data-act="pay" data-pay="' + p[0] + '" style="padding:8px 12px;margin:0">' + p[1] + '</button>';
    }).join('') + '</div>' +
    (qrOpen ? '<div class="hint" style="margin-top:8px">收银台已在弹窗中打开：扫码 → 渠道确认 → 支付完成（PAY-03）；不开放外部浏览器独立访问与购买（2.3）</div>' : '') +
    '<div class="hint">仅微信与支付宝，商城统一经营主体收款；不提供余额、抖音支付与优惠抵扣（PAY-01）</div>', 'div', 'card');
  var price = C(c + '04', '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
    '<tr><td style="padding:5px 0">商品总价</td><td style="text-align:right">' + CNY(o.amount) + '</td></tr>' +
    '<tr><td style="padding:5px 0;border-top:1px solid #c9cdd3"><b>应付总额</b></td><td style="text-align:right;border-top:1px solid #c9cdd3"><b>' + CNY(o.amount) + '</b></td></tr></table>' +
    '<div class="hint">无优惠券与积分抵扣（CHECKOUT-01）</div>', 'div', 'card');
  var agr = C(c + '05', '<label class="row check-row" style="gap:8px"><input type="checkbox" data-act="agr" ' + (RV.session.agreementOk ? 'checked' : '') +
    ' style="width:18px;height:18px"><span class="small">我已阅读并同意《购买协议》</span></label>' +
    '<div class="hint">默认不勾选；未勾选点击继续支付将弹出购买须知（AGREEMENT-01／02）</div>', 'div', 'card');
  var side = C(c + '06',
    '<div class="strong">应付金额</div>' +
    '<div class="price" style="font-size:24px;margin:4px 0 10px">' + CNY(o.amount) + '</div>' +
    '<button class="btn primary wide" type="button" data-act="pay-continue"' + (submitting || closed ? ' disabled' : '') + '>' +
      (submitting ? '处理中…' : (closed ? '订单已关闭' : '继续支付')) + '</button>' +
    '<button class="btn wide" type="button" data-act="go" data-to="WEB-ORDER-01" style="margin-top:8px">返回我的订单</button>' +
    '<div class="banner" style="margin-top:8px"><span class="grow">订单 30 分钟内有效；超时未支付将自动关闭，未扣款、未发码。</span></div>' +
    '<div class="hint">不展示倒计时；关闭后重新下单按商品实时价格计算。下单价格已锁定，价格变化无需重新确认（CHG-0096）。防重复提交与服务端并发校验（CHECKOUT-06）。</div>', 'div', 'card');
  var body = '<div class="split2 pay">' +
    '<div class="col">' + detail + link + pay + price + agr + '</div><div class="col">' + side + '</div></div>';
  if (st === 'ERROR' || sim === 'fail') {
    return deskShell(webPageFrame('确认订单', '订单读取失败', nav, stateBlock('', 'error', '订单读取失败', '已保留订单号，可重试。', '重试', 'retry')));
  }
  /* 弹窗覆盖在确认订单页之上，关闭后回到本页（不改变已填内容） */
  var overlay = qrOpen ? payQrModal('WEB-CHECKOUT-01-C07', st) : '';
  return deskShell(webPageFrame('确认订单', closed ? '订单已关闭' : (qrOpen ? '收银台已打开' : ''), nav, body),
    { url: 'steam-mall.example/checkout', overlay: overlay });
}

/* ---------- WEB-PAYRET-01 ---------- */
function rWebPayret(page, st) {
  var inner = modalMask('WEB-PAYRET-01-C01', 'center',
    modalHead('您是否已经完成了支付？', false) +
    '<div class="hint center">支付返回、页面恢复可见、刷新或从订单页重进时，先按当前订单主动向服务端查询；仍未得到结论时才询问（PAY-07、PAY-08）。</div>' +
    (st === 'QUERYING' ? C('WEB-PAYRET-01-C02', '<div class="banner" style="margin-top:10px"><span class="grow">正在向服务端查询支付结果…</span><span class="xsmall muted">按钮已禁用</span></div>', 'div', '') : '') +
    '<div class="row" style="gap:10px;margin-top:12px">' +
    '<button class="btn grow" type="button" data-act="pay-choose" data-choose="N"' + (st === 'QUERYING' ? ' disabled' : '') + '>未支付</button>' +
    '<button class="btn primary grow" type="button" data-act="pay-choose" data-choose="Y"' + (st === 'QUERYING' ? ' disabled' : '') + '>已支付</button></div>' +
    '<div class="hint center">两个选项都触发接口查询，不修改订单支付状态；选择与真实结果相反时仍以服务端结果为准（PAY-08／09）</div>');
  return deskShell(webPageFrame('支付返回确认', '无可用支付结果时展示', navWebPlaceholder(), '<div style="position:relative;height:340px">' + inner + '</div>'), { url: 'steam-mall.example/order/result' });
}

/* ---------- WEB-RESULT-01 ---------- */
function rWebResult(page, st, sim) {
  var c = 'WEB-RESULT-01-C';
  var gift = /^GIFT/.test(st);
  var failed = st === 'PAY_FAILED';
  var closed = st === 'ORDER_CLOSED';
  var late = st === 'LATE_PAY';
  var confirming = st === 'PAY_CONFIRMING';
  var o = Object.assign({}, gift ? MOCK_GIFT_ORDER : MOCK_ORDER, { payStatus: (failed || closed) ? 'PAY::PENDING' : 'PAY::PAID' });
  var gd = g(o.goodsId);
  var nav = webNav('', '');
  if (st === 'ERROR' || sim === 'fail') {
    return deskShell(webPageFrame('支付结果', '结果读取失败', nav, stateBlock('', 'error', '结果读取失败', '可重试；状态以服务端为准。', '重试', 'retry')));
  }
  var payText = confirming ? '支付结果确认中'
    : failed ? '支付失败/已取消'
      : closed ? '未支付'
        : late ? '已支付（晚到款）' : '已支付';
  var orderText = closed ? '已关闭'
    : (failed ? '待支付'
      : (late ? '已关闭·待核查'
        : (confirming ? '待支付'
          : (gift ? (st === 'GIFT_DONE' ? '已完成' : '待发货') : (st === 'DELIVERED' ? '已完成' : '待发货')))));
  var summary = C(c + '01',
    '<div class="row wrap" style="gap:6px"><span class="tag ' + (confirming || failed ? 'warn' : (closed ? 'err' : 'ok')) + '">支付状态：' + payText + '</span>' +
    '<span class="tag ' + (closed ? 'err' : '') + '">订单状态：' + orderText + '</span>' +
    '<span class="tag">交付状态：' + (gift ? giftStatusText(st) : (closed || failed || late || confirming ? '未启动' : codeStatusText(st))) + '</span></div>' +
    '<hr class="hr">' +
    '<div class="kv"><span class="k">订单号</span><span class="v brk">' + esc(o.no) + '</span>' +
    '<button class="btn sm" type="button" data-act="copy" data-copy="' + attr(o.no) + '" style="margin-left:auto">复制</button></div>' +
    '<div class="kv"><span class="k">商品</span><span class="v">' + esc(gd.nm) + '－' + esc(o.spec) + ' ×1</span></div>' +
    '<div class="kv"><span class="k">' + (failed || closed ? '订单金额' : '实付金额') + '</span><span class="v">' + CNY(o.amount) + '</span></div>' +
    '<div class="kv"><span class="k">下单价格</span><span class="v">已锁定，支付与退款均按下单快照金额；价格变化无需重新确认</span></div>' +
    (confirming ? '<div class="banner" style="margin-top:8px"><span class="grow">尚未取得可信支付结果，不发码、不新建订单、不重复扣款；可重新查询。</span></div>' +
      '<div class="hint">自动查询：返回后立即查询，2s/3s/5s 递增，最长 60 秒；之后手动刷新并由后台补偿查询。</div>' : '') +
    (failed ? '<div class="banner" style="margin-top:8px"><span class="grow">支付未完成或已取消，未扣款、未发码；订单在 30 分钟内仍可继续支付。</span></div>' : '') +
    (closed ? '<div class="banner" style="margin-top:8px"><span class="grow">订单超过 30 分钟未支付，已自动关闭；未扣款、未发码。重新下单按实时价格计算。</span></div>' : '') +
    (late ? '<div class="banner" style="margin-top:8px;border-color:#8a641e"><span class="grow">支付结果到达时订单已关闭，属于晚到款：不自动发货，已转人工审核；确认后按原支付渠道退款。</span></div>' : '') +
    '<div class="hint">"已付款"不等于"已交付"，两者分别展示（RESULT-01）</div>', 'div', 'card');
  var deliver;
  if (gift) {
    deliver = C(c + '03',
      '<div class="strong small">好友赠送交付</div>' +
      '<div class="kv" style="margin-top:6px"><span class="k">交付状态</span><span class="v">' + giftStatusText(st) + '</span></div>' +
      '<div class="kv"><span class="k">好友链接</span><span class="v brk">' + esc(o.friendLink) + '（付款时锁定）</span></div>' +
      '<div class="small muted" style="margin-top:6px">服务时段：工作日 8:00～18:00（Asia/Shanghai）。工作时间内下单预计 2～6 小时完成，非工作时段顺延至下一工作时段；不展示精确倒计时、不自动判定违约（REQ-13）。</div>', 'div', 'card');
  } else {
    var inner;
    if (closed) inner = '<div class="empty"><span class="t">［订单已关闭］</span>未支付、未发码；请重新下单，价格以实时价格为准。</div>';
    else if (failed) inner = '<div class="empty"><span class="t">［支付未完成］</span>未扣款、未发码；订单保留至 30 分钟有效期结束，可继续支付。</div>';
    else if (late) inner = '<div class="empty" style="border-color:#8a641e"><span class="t" style="color:#8a641e">［晚到款处理中］</span>支付已到账但订单已关闭，商城不自动发货；运营正在人工审核，确认后原路退款。</div>';
    else if (confirming) inner = '<div class="empty"><span class="t">［支付确认中］</span>尚未取得可信支付结果，不发码、不重复扣款；请等待自动查询或手动刷新。</div>';
    else if (st === 'ISSUING') inner = '<div class="empty" style="margin-top:6px"><span class="t">［发码中］</span>已确认支付，正在向供应商获取口令码；取得后自动展示。</div>';
    else if (st === 'EXCEPTION') inner = '<div class="empty" style="margin-top:6px;border-color:#a33b3b;color:#a33b3b"><span class="t" style="color:#a33b3b">［交付异常］</span>未取得有效口令码，已进入人工处理，请联系企业微信客服并提供订单编号。</div>';
    else inner = '<div class="row" style="gap:8px;margin-top:6px"><div class="code-box grow">' + esc(MOCK_CODE) + '</div>' +
      '<button class="btn sm" type="button" data-act="copy" data-copy="' + esc(MOCK_CODE) + '">复制口令码</button></div>' +
      '<div class="row" style="margin-top:8px;gap:8px"><button class="btn sm" type="button" data-act="use-guide">使用指引</button>' +
      '<span class="xsmall muted" style="align-self:center">Steam 客户端 → 添加游戏 → 在 Steam 上激活产品；商城无激活查询能力时不展示"已激活"状态（CODE-04）</span></div>';
    deliver = C(c + '02', '<div class="strong small">口令码交付</div>' + inner, 'div', 'card');
  }
  var actions;
  if (confirming) actions = '<button class="btn primary sm" type="button" data-act="pay-query-again">重新查询支付结果</button>' +
    '<button class="btn sm" type="button" data-act="go" data-to="WEB-ORDER-01">查看订单</button>';
  else if (closed) actions = '<button class="btn primary sm" type="button" data-act="go" data-to="WEB-HOME-01">重新下单</button>' +
    '<button class="btn sm" type="button" data-act="go" data-to="WEB-ORDER-01">查看订单</button>';
  else if (failed) actions = '<button class="btn primary sm" type="button" data-act="go" data-to="WEB-CHECKOUT-01">继续支付</button>' +
    '<button class="btn sm" type="button" data-act="go" data-to="WEB-ORDER-01">查看订单</button>' +
    '<button class="btn sm" type="button" data-act="go" data-to="APP-SERVICE-01">企业微信客服</button>';
  else if (late) actions = '<button class="btn primary sm" type="button" data-act="go" data-to="APP-SERVICE-01">联系客服</button>' +
    '<button class="btn sm" type="button" data-act="go" data-to="WEB-ORDER-01">查看订单</button>';
  else actions = '<button class="btn primary sm" type="button" data-act="go" data-to="WEB-ORDER-01">查看订单</button>' +
    '<button class="btn sm" type="button" data-act="go" data-to="APP-SERVICE-01">企业微信客服</button>';
  var entry = C(c + '04', '<div class="row wrap" style="gap:8px">' + actions + '</div>' +
    '<div class="hint">刷新、关闭后重进及从"我的订单"进入均恢复服务端状态（RESULT-04）</div>', 'div', 'card');
  return deskShell(webPageFrame('支付结果', '支付与交付状态分别展示', nav, summary + deliver + entry), { url: 'steam-mall.example/order/result' });
}

/* ---------- WEB-ORDER-01 ---------- */
function rWebOrder(page, st, sim) {
  var c = 'WEB-ORDER-01-C';
  var nav = webNav('', 'WEB-ORDER-01');
  var filter = C(c + '01',
    '<div class="row wrap" style="gap:8px;align-items:flex-end">' +
    '<label class="col" style="gap:2px"><span class="xsmall muted">订单号</span><input class="inp" style="min-height:40px;max-width:220px" placeholder="支持订单号查询" aria-label="订单号"></label>' +
    '<label class="col" style="gap:2px"><span class="xsmall muted">时间范围</span><input class="inp" style="min-height:40px;max-width:200px" value="2026-10-01 ~ 2026-10-15" aria-label="时间范围"></label>' +
    '<label class="col" style="gap:2px"><span class="xsmall muted">状态</span><select style="min-height:40px" aria-label="状态">' + ORDER_TABS.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select></label>' +
    '<button class="btn sm" type="button" data-act="wq">查询</button><button class="btn sm" type="button" data-act="reset">重置</button>' +
    '</div><div class="hint">草稿与已提交条件分开，点击查询或按 Enter 才提交（7.6.3）</div>', 'div', 'card');
  var tab = ORDER_TABS.indexOf(RV.orderTab) >= 0 ? RV.orderTab : '全部';
  var tabs = C('APP-ORDER-01-C02',
    '<div class="segbar">' + ORDER_TABS.map(function (t) {
      return '<button class="tag' + (tab === t ? ' on' : '') + '" type="button" data-act="otab" data-tab="' + attr(t) + '" style="padding:8px 10px;margin:0">' + esc(t) + '</button>';
    }).join('') + '</div>', 'div', 'card flat');
  if (st === 'SESSION_EXPIRED') {
    return deskShell(webPageFrame('我的订单', '会话失效', nav, filter + tabs +
      C('COM-CLIENT-C13', '<div class="empty"><span class="t">［登录已失效］</span>请重新登录后查看订单；切换账号后清除旧缓存并按新账号重新加载。' +
        '<div style="margin-top:8px"><button class="btn sm" type="button" data-act="login">去登录</button></div></div>', 'div', 'card')));
  }
  if (st === 'ERROR' || sim === 'fail') {
    return deskShell(webPageFrame('我的订单', '请求失败', nav, filter + tabs +
      C('ADM-COMMON-C11', stateBlock('', 'error', '订单请求失败', '已保留筛选条件与页签，可重试。', '重试', 'retry'), 'div', 'card')));
  }
  var rows = orderRows().filter(function (r) { return tab === '全部' || orderState(r) === tab; });
  if (st === 'EMPTY' || sim === 'empty' || !rows.length) {
    return deskShell(webPageFrame('我的订单', '无匹配记录', nav, filter + tabs +
      C('ADM-COMMON-C11', stateBlock('', 'empty', '未找到匹配订单', '已保留筛选条件与页签，可修改条件后重新查询；不残留旧结果。'), 'div', 'card')));
  }
  var table = C(c + '02',
    '<table class="admin-table"><thead><tr><th style="width:20%">订单号</th><th style="width:23%">商品</th><th style="width:11%">实付金额</th>' +
    '<th style="width:15%">下单时间</th><th style="width:10%">订单状态</th><th style="width:12%">交付</th><th style="width:10%">操作</th></tr></thead><tbody>' +
    rows.map(function (r) {
      var gd = g(r.goodsId);
      /* 待支付 → 「继续支付」（FL-CHECKOUT-001 登记的入口之一即"订单列表继续支付"）；
         已支付／已完成 → 「查看」打开订单详情（CHG-0053）。此前只有待支付有按钮，
         其余状态一律显示「—」，用户看不出这行能不能点开看详情。
         两个按钮都带 data-order，点按钮与点行得到同一条记录。 */
      var op = (r.pay === 'PAY::PENDING' && r.uncertain)
        ? '<button class="btn sm" type="button" data-act="pay-query" data-order="' + attr(r.no) + '">查询支付结果</button>'
        : (r.pay === 'PAY::PENDING'
          ? '<button class="btn sm" type="button" data-act="resume-pay" data-order="' + attr(r.no) + '">继续支付</button>'
          : '<button class="btn sm" type="button" data-act="open-drawer" data-order="' + attr(r.no) + '">查看</button>');
      return '<tr data-act="open-drawer" role="button" tabindex="0" data-order="' + attr(r.no) + '">' +
        '<td class="brk">' + esc(r.no) + '</td><td>' + esc(gd.nm) + '－' + esc(r.spec) + ' ×1</td>' +
        '<td>' + CNY(r.amount) + '</td><td>' + esc(r.t) + '</td>' +
        '<td>' + esc(orderState(r)) + (r.refundStatus === '退款中' ? '<div class="xsmall" style="color:var(--warn)">退款中</div>' : '') + (r.uncertain ? '<div class="xsmall muted">支付确认中</div>' : '') + '</td><td>' + esc(deliverText(r.deliver)) + '</td><td>' + op + '</td></tr>';
    }).join('') + '</tbody></table>', 'div', 'card');
  var pager = C(c + '04',
    '<div class="row" style="gap:8px;justify-content:flex-end;margin-top:10px">' +
    '<button class="btn sm" type="button" disabled>上一页</button><button class="btn sm" type="button" aria-pressed="true">1</button>' +
    '<button class="btn sm" type="button" disabled>下一页</button>' +
    '<span class="xsmall muted">共 ' + rows.length + ' 条 · 每页 20 条</span></div>', 'div', '');
  /* 按被点击的那条记录渲染。此前标题取了 RV.drawerOrder，正文却全读 rows[0]，
     点第 2 条会显示第 1 条的商品与金额（CHG-0053 修）。 */
  var cur = null;
  if (RV.drawerOpen) {
    orderRows().forEach(function (r) { if (!cur && r.no === RV.drawerOrder) cur = r; });
    if (!cur) cur = rows[0];
    if (!cur) cur = orderRows()[0];
  }
  /* 口令码区按交付类型分支（03 的 C03：口令码区"或"赠送区，不是同一区）：
     口令码只在自动发码且已交付时才有内容；好友赠送不出码，待处理时复制按钮禁用。 */
  var codeBlock;
  if (!cur) {
    codeBlock = '';
  } else if (cur.refund === 'REFUND::SUCCESS') {
    codeBlock = '<div class="kv"><span class="k">售后</span><span class="v">已退款，原口令码不再展示，订单记录保留</span></div>' +
      '<div class="row" style="margin-top:8px"><button class="btn sm" type="button" data-act="copy" data-copy="' + attr(cur.no) + '">复制订单号</button>' +
      '<span class="xsmall muted" style="align-self:center">已退款订单可重新购买，生成新订单</span></div>';
  } else if (cur.deliver === 'CODE::DELIVERED') {
    codeBlock = '<div class="kv"><span class="k">口令码</span><span class="v brk">' + esc(MOCK_CODE) + '</span></div>' +
      '<div class="row" style="margin-top:8px"><button class="btn sm" type="button" data-act="copy" data-copy="' + attr(MOCK_CODE) + '">复制口令码</button>' +
      '<button class="btn sm" type="button" data-act="copy" data-copy="' + attr(cur.no) + '">复制订单号</button>' +
      '<span class="xsmall muted" style="align-self:center">口令码仅在本人登录且通过权限校验的订单中展示</span></div>';
  } else if (cur.deliver === 'CODE::ISSUING') {
    codeBlock = '<div class="kv"><span class="k">口令码</span><span class="v">已付款，正在获取口令码</span></div>' +
      '<div class="row" style="margin-top:8px"><button class="btn sm" type="button" disabled>复制口令码</button>' +
      '<button class="btn sm" type="button" data-act="copy" data-copy="' + attr(cur.no) + '">复制订单号</button>' +
      '<span class="xsmall muted" style="align-self:center">发码中，暂无内容可复制</span></div>';
  } else if (cur.deliver === 'CODE::EXCEPTION') {
    codeBlock = '<div class="kv"><span class="k">口令码</span><span class="v">口令码获取异常，请联系客服</span></div>' +
      '<div class="row" style="margin-top:8px"><button class="btn sm" type="button" disabled>复制口令码</button>' +
      '<button class="btn sm" type="button" data-act="copy" data-copy="' + attr(cur.no) + '">复制订单号</button>' +
      '<button class="btn sm" type="button" data-act="service">联系客服</button></div>';
  } else if (cur.deliver === 'GIFT::DONE') {
    codeBlock = '<div class="kv"><span class="k">好友赠送</span><span class="v">已通过好友赠送完成交付</span></div>' +
      '<div class="row" style="margin-top:8px"><button class="btn sm" type="button" data-act="copy" data-copy="' + attr(cur.no) + '">复制订单号</button>' +
      '<span class="xsmall muted" style="align-self:center">好友赠送不产生口令码</span></div>';
  } else if (cur.deliver === 'GIFT::PROCESSING' || cur.deliver === 'GIFT::PENDING') {
    codeBlock = '<div class="kv"><span class="k">好友赠送</span><span class="v">' + esc(deliverText(cur.deliver)) + '，等待人工交付（工作日 8:00～18:00，预计 2～6 小时）</span></div>' +
      '<div class="row" style="margin-top:8px"><button class="btn sm" type="button" disabled>复制口令码</button>' +
      '<button class="btn sm" type="button" data-act="copy" data-copy="' + attr(cur.no) + '">复制订单号</button>' +
      '<button class="btn sm" type="button" data-act="service">联系客服</button></div>';
  } else if (cur.deliver === 'GIFT::EXCEPTION') {
    codeBlock = '<div class="kv"><span class="k">好友赠送</span><span class="v">赠送交付异常，请联系客服</span></div>' +
      '<div class="row" style="margin-top:8px"><button class="btn sm" type="button" data-act="copy" data-copy="' + attr(cur.no) + '">复制订单号</button>' +
      '<button class="btn sm" type="button" data-act="service">联系客服</button></div>';
  } else {
    codeBlock = '<div class="kv"><span class="k">口令码</span><span class="v">未生成（订单尚未支付）</span></div>' +
      '<div class="row" style="margin-top:8px"><button class="btn sm" type="button" disabled>复制口令码</button>' +
      '<button class="btn sm" type="button" data-act="copy" data-copy="' + attr(cur.no) + '">复制订单号</button></div>';
  }
  var drawer = (RV.drawerOpen && cur) ? C(c + '03',
    '<div class="modal center" style="position:relative;margin-top:12px;max-width:100%">' +
    '<div class="row"><span class="strong">订单详情 · ' + esc(cur.no) + '</span>' +
    '<button class="x" type="button" data-act="close-modal" style="position:static;margin-left:auto" aria-label="关闭详情">✕</button></div>' +
    '<div class="kv" style="margin-top:8px"><span class="k">订单号</span><span class="v brk">' + esc(cur.no) + '</span>' +
      '<button class="btn sm" type="button" data-act="copy" data-copy="' + attr(cur.no) + '" style="margin-left:8px">复制</button></div>' +
    '<div class="kv"><span class="k">商品</span><span class="v">' + esc(g(cur.goodsId).nm) + '－' + esc(cur.spec) + ' ×1</span></div>' +
    '<div class="kv"><span class="k">实付</span><span class="v">' + CNY(cur.amount) + '</span></div>' +
    '<div class="kv"><span class="k">下单时间</span><span class="v">' + esc(cur.t) + '</span></div>' +

    codeBlock +
    (function () {
      var cst = orderState(cur);
      var ops = [];
      if (cur.deliver !== 'GIFT::DONE' && (cur.deliver === 'CODE::DELIVERED')) ops.push({ t: '使用指引', a: 'data-act="use-guide"' });
      if (cst === '待支付') ops.push({ t: '继续支付', a: 'data-act="resume-pay" data-order="' + attr(cur.no) + '"', p: true });
      if (cst === '已完成' || cst === '已退款') ops.push({ t: '再次购买', a: 'data-act="go" data-to="WEB-PRODUCT-01"' });
      if (cst === '已关闭') ops.push({ t: '重新下单', a: 'data-act="go" data-to="WEB-HOME-01"', p: true });
      var row = ops.length ? '<div class="row" style="gap:8px;margin-top:10px">' + ops.map(function (x) {
        return '<button class="btn ' + (x.p ? 'primary ' : '') + (ops.length > 1 ? 'grow' : 'wide') + '" type="button" ' + x.a + '>' + x.t + '</button>';
      }).join('') + '</div>' : '';
      return row + '<div class="center" style="margin-top:8px"><button class="btn-link" type="button" data-act="go" data-to="APP-SERVICE-01" style="font-size:12px;text-decoration:underline">联系客服</button></div>';
    })() +
    '<div class="hint">详情按被点击记录读取，不固定展示第一条；关闭后恢复查询条件、页码、滚动位置与触发焦点（7.6.2）</div></div>', 'div', '') : '';
  return deskShell(webPageFrame('我的订单', '当前页签：' + esc(tab) + '　共 ' + rows.length + ' 条', nav, filter + tabs + table + pager + drawer), { url: 'steam-mall.example/orders' });
}

/* ---------- WEB-MINE-01 ---------- */
/* PC 的「我的」与移动端同属第二个一级页面：内容结构一致，仅由单列改为左右分栏
   （左：账号与资格；右：我的订单与服务）。「我的订单 / 客服」在顶栏移除后统一收在这里。 */
function rWebMine(page, st) {
  var guest = st === 'GUEST';
  var unknown = st === 'UNKNOWN';
  var independent = !!RV.session.independent;
  var realNone = (RV.session.realname === 'none');
  var nav = webNav('', 'WEB-MINE-01');
  var info = C('WEB-MINE-01-C01',
    '<div class="row" style="gap:12px"><div class="avatar" style="width:52px;height:52px">头像</div>' +
    '<div class="grow col" style="gap:2px"><span class="strong">' + (guest ? '未登录' : (independent ? '商城用户_6721' : '玩家_小七')) + '</span>' +
    '<span class="xsmall muted">' + (guest ? '登录后可查看本人订单与口令码' : (independent ? '商城用户账号 · 已绑定手机号：138****6721' : '商城用户账号 · 已绑定平台C')) + '</span></div>' +
    (guest ? '<button class="btn sm" type="button" data-act="login">去登录</button>' : '') + '</div>' +
    (independent ? '<div class="hint">商城用户账号不自动合并；订单仅展示当前账号的数据。</div>' : ''), 'div', 'card');
  var val = function (known) { return guest ? '登录后查看' : unknown ? '暂不可获取' : known; };
  var realVal = guest ? '登录后查看'
    : (RV.session.realname === 'minor' ? '已实名（未成年）'
      : (RV.session.realname === 'verified' ? '已实名（成年）'
        : (realNone || unknown ? '未实名 / 暂不可获取，去认证' : '已实名认证')));
  var phoneVal = guest ? '登录后查看'
    : (RV.session.phone === 'bound' ? (RV.session.phoneMasked || '138****6721') + ' · 已绑定'
      : (RV.session.phone === 'unknown' ? '状态未知，去绑定' : '未绑定，去绑定'));
  var qual = C('WEB-MINE-01-C02',
    '<div class="sec-hd"><span class="strong">账号与资格</span>' +
    (unknown && !guest ? '<button class="more" type="button" data-act="retry">重新获取</button>' : '') + '</div>' +
    '<button class="cell" type="button" data-act="mine-platform" data-kind="realname"' + (guest ? ' disabled' : '') + '>' +
      '<span class="k">实名认证</span><span class="v">' + esc(realVal) + '</span><span class="arrow">›</span></button>' +
    '<button class="cell" type="button" data-act="mine-phone"' + (guest ? ' disabled' : '') + '>' +
      '<span class="k">手机号</span><span class="v">' + esc(phoneVal) + '</span><span class="arrow">›</span></button>' +
    '<div class="hint">手机号由用户主动填写并短信验证后绑定当前商城用户账号；平台不提供手机号。商城用户账号不自动合并，实名结果不跨账号复用。</div>', 'div', 'card');
  /* 状态快捷入口按订单状态三态生成（CHG-0048）。此前按 ORDER_ROWS 的 tab 字段计数，
     而该字段随本轮改动已删除，计数会全部落空、角标永远不出现——这里改为用派生状态计数。 */
  var counts = { '待支付': 0, '待发货': 0, '已完成': 0, '已退款': 0, '已关闭': 0 };
  orderRows().forEach(function (r) {
    var s = orderState(r);
    if (counts[s] !== undefined) counts[s]++;
  });
  var stats = ['待支付', '待发货', '已完成', '已退款', '已关闭'].map(function (t) {
    var n = counts[t];
    /* 角标＝需要用户处理：只有待支付（继续支付／支付结果未确定时重新查询）；其余状态不堆角标 */
    var need = (t === '待支付') && n > 0;
    return '<button class="stat" type="button" data-act="mine-order" data-tab="' + attr(t) + '">' +
      (need ? '<span class="badge">' + n + '</span>' : '') +
      '<span class="st-ico" aria-hidden="true"></span><span>' + esc(t) + '</span></button>';
  }).join('');
  var orders = C('WEB-MINE-01-C03',
    '<div class="sec-hd"><span class="strong">我的订单</span>' +
    '<button class="more" type="button" data-act="mine-order" data-tab="全部">全部订单 ›</button></div>' +
    '<div class="stat-grid" style="margin-top:4px">' + stats + '</div>', 'div', 'card');
  var service = C('WEB-MINE-01-C04',
    '<div class="sec-hd"><span class="strong">服务与支持</span></div>' +
    '<button class="cell" type="button" data-act="go" data-to="APP-SERVICE-01">' +
      '<span class="k">企业微信客服</span><span class="v">8:00～18:00</span><span class="arrow">›</span></button>', 'div', 'card');
  var about = C('WEB-MINE-01-C05',
    '<button class="cell" type="button" data-act="go" data-to="APP-AGREEMENT-01">' +
      '<span class="k">《购买协议》</span><span class="v">V1.0</span><span class="arrow">›</span></button>' +
    '<button class="cell" type="button" data-act="go" data-to="APP-PRIVACY-01">' +
      '<span class="k">《隐私政策》</span><span class="v">V1.0</span><span class="arrow">›</span></button>' +
    '<div class="hint">商城经营主体：商城经营公司。三个入口所属公司不因接入获得商城后台权限；商城不提供外部浏览器独立访问与购买。</div>', 'div', 'card');
  var body = '<div class="split2"><div class="col">' + info + qual + '</div>' +
    '<div class="col">' + orders + service + about + '</div></div>';
  return deskShell(webPageFrame('我的', guest ? '未登录' : '玩家_小七', nav, body), { url: 'steam-mall.example/mine' });
}
/* ============================================================
   WEB-LOGIN-01 / WEB-REALNAME-01 / WEB-REALNAME-02
   独立手机号账号在 PC 端的同一套流程（CHG-0096）
   ============================================================ */
function rWebLogin(page, st, sim) {
  var c = 'WEB-LOGIN-01-C';
  var sent = st === 'CODE_SENT' || (RV.session.smsSent && st !== 'ERROR');
  var failed = st === 'ERROR' || !!RV.loginErr;
  var nav = webNav('', '');
  var left = C(c + '01',
    '<div class="strong" style="font-size:20px">Steam商城</div>' +
    '<div class="small muted" style="margin-top:6px">外部渠道用户可使用手机号登录或注册</div>' +
    '<div class="hint">平台授权登录会创建/恢复商城用户账号并绑定平台账号；手机号注册会创建商城用户账号并绑定手机号。两者不自动合并，订单按当前商城用户账号展示。</div>', 'div', 'card');
  var form = C(c + '02',
    (failed ? '<div class="banner" style="border-color:#a33b3b;color:#a33b3b"><span class="grow">' + esc(RV.loginErr || '请输入正确的手机号与验证码，并勾选隐私政策。') + '</span></div>' : '') +
    (sent ? '<div class="banner"><span class="grow">验证码已发送至 ' + esc(RV.session.smsPhone || '138****6721') + '；60 秒内不可重复发送。</span></div>' : '') +
    '<div class="row" style="gap:8px;margin-top:10px"><span class="small muted" style="width:72px;flex:none">手机号</span>' +
    '<input class="inp" data-login-phone="1" value="' + attr(RV.session.loginPhone || '') + '" inputmode="numeric" maxlength="11" placeholder="请输入 11 位手机号" style="flex:1" aria-label="手机号"></div>' +
    '<div class="row" style="gap:8px;margin-top:10px"><span class="small muted" style="width:72px;flex:none">验证码</span>' +
    '<input class="inp" data-login-code="1" value="' + attr(RV.session.loginCode || '') + '" inputmode="numeric" maxlength="6" placeholder="6 位短信验证码" style="flex:1" aria-label="短信验证码">' +
    '<button class="btn sm" type="button" data-act="sms-send"' + (sent ? ' disabled' : '') + '>' + (sent ? '60s 后重发' : '获取验证码') + '</button></div>' +
    '<div class="hint">无需图形验证码；短信 60 秒频率限制，服务商由销售 CDK 公司后续提供；原型不发送真实短信。</div>' +
    '<label class="row check-row" style="gap:8px;margin-top:10px"><input type="checkbox" data-login-agree="1" ' + (RV.session.privacyOk ? 'checked' : '') + ' style="width:18px;height:18px;flex:none;margin-top:3px">' +
    '<span class="small">我已阅读并同意《隐私政策》与《用户协议》</span></label>' +
    '<div class="hint">未勾选隐私政策不能登录或注册；<button class="btn-link" type="button" data-act="go" data-to="APP-PRIVACY-01">查看《隐私政策》</button></div>' +
    '<button class="btn primary wide" type="button" data-act="phone-login" style="margin-top:12px">登录 / 注册</button>' +
    '<button class="btn wide" type="button" data-act="platform-login" style="margin-top:8px">使用所属平台账号登录（平台A/B/C）</button>' +
    '<div class="hint center">未注册手机号验证通过后创建商城用户账号并绑定手机号；商城用户账号不自动合并。</div>', 'div', 'card');
  return deskShell(webPageFrame('登录 / 注册', '商城用户账号', nav,
    '<div class="split2"><div class="col">' + left + '</div><div class="col">' + form + '</div></div>'), { url: 'steam-mall.example/login' });
}

/* ---------- WEB-PHONE-01 绑定手机号（商城账号主动绑定） ---------- */
function rWebPhone(page, st) {
  var c = 'WEB-PHONE-01-C';
  var s = RV.session;
  var bound = st === 'BOUND' || (s.phone === 'bound' && !s.bindChange);
  var sent = s.bindSmsSent || st === 'CODE_SENT';
  var err = s.bindErr || (st === 'ERROR' ? '手机号或验证码不正确，请重试。' : '');
  var current = s.phoneMasked || '138****6721';
  var changing = s.phone === 'bound';
  var fromBuy = s.bindFrom === 'BUY';
  var nav = webNav('', '');
  var status, form, actions;
  if (bound) {
    status = C(c + '02',
      '<div class="center" style="padding:18px 8px 10px">' +
        '<div class="qr-ok" style="margin:0 auto 10px">✓</div>' +
        '<div class="strong" style="font-size:18px">手机号已绑定商城账号</div>' +
        '<div class="small muted" style="margin-top:6px">' + esc(current) + '</div>' +
      '</div>', 'div', 'card');
    form = C(c + '03',
      '<div class="small" style="line-height:1.8">手机号仅用于购买下单、订单通知与账号安全，展示时脱敏；商城不会把手机号提供给平台，也不从平台读取手机号。</div>' +
      '<div class="hint">如需更换手机号，需先验证新号码；旧号码验证通过后解除绑定。</div>', 'div', 'card');
    actions = C(c + '04',
      '<button class="btn primary wide" type="button" data-act="bind-change">更换手机号</button>' +
      '<button class="btn wide" type="button" data-act="go" data-to="WEB-MINE-01" style="margin-top:8px">返回我的</button>', 'div', 'card');
  } else {
    status = C(c + '02',
      '<div class="small" style="line-height:1.75">绑定手机号后可用于购买下单、订单通知与账号安全。手机号由你主动填写并通过短信验证码验证，<b>商城不会从所属平台读取或绑定手机号</b>。</div>' +
      (changing ? '<div class="banner" style="margin-top:10px"><span class="grow">当前绑定：' + esc(current) + '；验证新号码后完成更换。</span></div>' : '') +
      (fromBuy ? '<div class="banner" style="margin-top:10px"><span class="grow">完成绑定后将返回原购买面板，继续本次购买。</span></div>' : ''), 'div', 'card');
    form = C(c + '03',
      (err ? '<div class="banner" style="border-color:#a33b3b;color:#a33b3b;margin-bottom:8px"><span class="grow">' + esc(err) + '</span></div>' : '') +
      (sent ? '<div class="banner" style="margin-bottom:8px"><span class="grow">验证码已发送至 ' + esc(s.bindSmsPhone || current) + '（模拟）；60 秒内不可重复发送。</span></div>' : '') +
      '<div class="row" style="gap:8px;margin-top:10px"><span class="small muted" style="width:72px;flex:none">手机号</span>' +
        '<input class="inp" data-bind-phone="1" value="' + attr(s.bindPhone || '') + '" inputmode="numeric" maxlength="11" placeholder="请输入 11 位手机号" aria-label="手机号" style="flex:1"></div>' +
      '<div class="row" style="gap:8px;margin-top:10px"><span class="small muted" style="width:72px;flex:none">验证码</span>' +
        '<input class="inp" data-bind-code="1" value="' + attr(s.bindCode || '') + '" inputmode="numeric" maxlength="6" placeholder="6 位短信验证码" aria-label="短信验证码" style="flex:1">' +
        '<button class="btn sm" type="button" data-act="bind-send"' + (sent ? ' disabled' : '') + '>' + (sent ? '已发送' : '获取验证码') + '</button></div>' +
      '<div class="hint">短信 60 秒频率限制；原型不发送真实短信、不保存完整手机号。</div>' +
      '<label class="row check-row" style="gap:8px;margin-top:10px"><input type="checkbox" data-bind-agree="1" ' + (s.bindAgree ? 'checked' : '') + ' style="width:18px;height:18px;flex:none;margin-top:3px">' +
        '<span class="small">我已阅读并同意《隐私政策》</span></label>', 'div', 'card');
    actions = C(c + '04',
      '<button class="btn primary wide" type="button" data-act="bind-submit">确认绑定</button>' +
      '<div class="hint center">成功后写入商城账号绑定关系；返回、失败或结果未知不改变绑定状态；退出使用左上角返回。</div>', 'div', 'card');
  }
  return deskShell(webPageFrame('绑定手机号', '商城账号安全验证', nav,
    '<div style="max-width:620px;margin:0 auto">' + status + form + actions + '</div>', c + '01'),
    { url: 'steam-mall.example/phone/bind' });
}

function rWebRealname(page, st, sim) {
  var c = 'WEB-REALNAME-01-C';
  var submitting = st === 'SUBMITTING';
  var failed = st === 'FAILED' || !!RV.realErr;
  var minor = st === 'MINOR';
  var demo = RV.session.realDemo;
  var nav = webNav('', '');
  var intro = C(c + '01',
    '<div class="strong" style="font-size:18px">实名认证</div>' +
    '<div class="small" style="margin-top:6px">为落实未成年人保护与交易合规要求，首次购买前需完成实名认证。若所属平台已返回可信实名结果，商城直接使用；平台无法提供或未认证时，可在本页填写姓名与身份证号，由商城调用国家认证接口完成核验。<b>商城只保存核验结果与脱敏信息。</b></div>' +
    '<div class="hint">国家认证接口由销售 CDK 公司后续提供；原型不调用真实服务、不联网核验。<b>请勿输入真实姓名或身份证号</b>，以下内容仅用于演示，提交后不落盘、不上传。</div>', 'div', 'card');
  var form = C(c + '02',
    (minor ? '<div class="banner" style="border-color:#8a641e"><span class="grow">模拟核验结果为未成年人：可浏览，暂不可购买。</span></div>' : '') +
    (failed ? '<div class="banner" style="border-color:#a33b3b;color:#a33b3b"><span class="grow">' + esc(RV.realErr || '实名核验失败，请检查信息后重试。') + '</span></div>' : '') +
    '<div class="row" style="gap:8px;margin-top:10px"><span class="small muted" style="width:76px;flex:none">姓名</span>' +
    '<input class="inp" data-real-name="1" value="' + attr(demo ? '演示用户' : (RV.session.realName || '')) + '" maxlength="20" placeholder="演示环境请填测试姓名" style="flex:1" aria-label="姓名"></div>' +
    '<div class="row" style="gap:8px;margin-top:10px"><span class="small muted" style="width:76px;flex:none">身份证号</span>' +
    '<input class="inp" data-real-id="1" value="' + attr(demo ? '000000000000000000' : (RV.session.realId || '')) + '" maxlength="18" placeholder="演示环境请填测试号码" style="flex:1" aria-label="身份证号"></div>' +
    '<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm" type="button" data-act="real-demo">填入演示资料</button>' +
    '<span class="xsmall muted" style="align-self:center">演示资料不是真实个人信息</span></div>' +
    '<label class="row check-row" style="gap:8px;margin-top:10px"><input type="checkbox" data-real-agree="1" ' + (RV.session.realAgree ? 'checked' : '') + ' style="width:18px;height:18px;flex:none;margin-top:3px">' +
    '<span class="small">我已阅读并同意《实名认证授权与隐私政策》</span></label>' +
    '<div class="hint">姓名与证件号仅用于本次核验；商城不保存完整值，展示与日志均脱敏。</div>' +
    '<button class="btn primary wide" type="button" data-act="real-submit"' + (submitting ? ' disabled' : '') + ' style="margin-top:12px">' + (submitting ? '核验中…' : '提交实名认证') + '</button>' +
    '<button class="btn wide" type="button" data-act="go" data-to="WEB-MINE-01" style="margin-top:8px">暂不认证，返回我的</button>', 'div', 'card');
  return deskShell(webPageFrame('实名认证', '独立手机号账号', nav,
    '<div class="split2"><div class="col">' + intro + '</div><div class="col">' + form + '</div></div>'), { url: 'steam-mall.example/realname' });
}

function rWebRealnameResult(page, st) {
  var c = 'WEB-REALNAME-02-C';
  var nav = webNav('', '');
  return deskShell(webPageFrame('实名认证结果', '', nav,
    C(c + '02',
      authResultInner(st), 'div', 'card',
      'max-width:560px;margin:16px auto 0'),
    c + '01'), { url: 'steam-mall.example/realname/result' });
}

