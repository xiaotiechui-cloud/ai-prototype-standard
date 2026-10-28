
/* ============================================================
   ADM 运营后台：模拟数据集
   全部为脱敏模拟数据，不代表生产配置、正式统计口径或真实记录数量。
   数据集刻意覆盖各状态选项，并保留至少一个可产生“无匹配”的组合以验证空态。
   ============================================================ */
const ADM_MENU = [
  { g: '首页与商品' },
  { id: 'ADM-HOME-01', n: '首页配置管理', adm: 'ADM-01' },
  { id: 'ADM-GOODS-01', n: '商品管理', adm: 'ADM-02' },
  { id: 'ADM-STOCK-01', n: '可售库存', adm: 'ADM-04' },
  { id: 'ADM-SEARCH-01', n: '搜索推荐配置', adm: 'ADM-14' },
  { g: '交易与交付' },
  { id: 'ADM-ORDER-01', n: '订单管理', adm: 'ADM-05' },
  { id: 'ADM-GIFT-01', n: '好友赠送', adm: 'ADM-06' },
  { id: 'ADM-CODE-01', n: '口令码交付', adm: 'ADM-07' },
  { id: 'ADM-NOTIFY-01', n: '通知记录', adm: 'ADM-16' },
  /* 资金与售后组移除；退款改为订单管理行内操作（CHG-0086）。 */
  /* 支付核查菜单移除（CHG-0087）：后续有需要直接通过后端查询记录，后台暂不展示；页面保留在页库。 */
  { g: '配置与治理' },
  { id: 'ADM-AGREE-01', n: '协议管理', adm: 'ADM-13' },
  /* 客服配置、基础统计菜单移除（CHG-0089）；页面保留在页库供对照。 */
  { id: 'ADM-RBAC-01', n: '权限管理', adm: 'ADM-10' },
  { id: 'ADM-AUDIT-01', n: '操作记录', adm: 'ADM-11' }
];
const ADM_ROLE = { name: '运营_02', role: '运营', platform: '全部平台', perm: ['query', 'code', 'export', 'gift'] };
const ADM_ROLE_NOPERM = { name: '客服_01', role: '客服', platform: '全部平台', perm: ['query'] };

const ADM_PLATFORMS = ['平台A', '平台B', '平台C'];
/* 订单状态拆成两维（CHG-0081）：支付＝已支付/待支付；交付＝已交付/未交付。
   列表页签按派生状态分组：待支付 / 已支付（未交付）/ 已关闭（已支付且已交付）。 */
const ADM_PAY_TABS = ['全部', '待支付', '待发货', '已完成', '已退款', '已关闭'];

function mkOrders() {
  var rows = [];
  var gs = ['P1001 孤刃：影逝二度', 'P1002 暗影回廊', 'P1003 星海远征', 'P1004 球场传奇 27', 'P1005 铁血战线', 'P1008 铁骑与战团'];
  var codeStat = ['发码中', '已交付', '交付异常'];
  var giftPool = ['待处理', '处理中', '已完成', '异常'];
  var giftIdx = 0;
  for (var i = 0; i < 24; i++) {
    var isGift = (i % 5 === 3);
    var paid = (i % 4 !== 0);                       // 6 条未支付，其余已支付
    var giftState = '—';
    if (isGift && paid) { giftState = giftPool[giftIdx % giftPool.length]; giftIdx++; }
    var codeState = isGift ? '—' : (!paid ? '未启动' : codeStat[i % 3]);
    /* 交付状态（CHG-0081）：口令码看是否已发出有效码；好友赠送看人工处理是否完成 */
    var delivered = paid && (isGift ? giftState === '已完成' : codeState === '已交付');
    var deliver = paid ? (delivered ? '已交付' : '未交付') : '—';
    var state = !paid ? '待支付' : (delivered ? '已完成' : '待发货');
    var hasOp = isGift ? (giftState !== '待处理' && giftState !== '—') : (paid && codeState !== '未启动');
    rows.push({
      id: 'SO2026101' + (50000000 + i * 137),
      no: 'SO2026101' + (50000000 + i * 137),
      platform: ADM_PLATFORMS[i % 3],
      goods: gs[i % 6],
      spec: i % 3 === 0 ? '豪华版' : '标准版',
      amount: [128.00, 298.00, 199.00, 198.17, 269.00, 24.50][i % 6],
      type: isGift ? '好友赠送' : '口令码',
      /* 支付两态（CHG-0081）：不再有「确认中」；已关闭由「已支付+已交付」派生 */
      pay: paid ? '已支付' : '待支付',
      deliver: deliver,
      state: state,
      expireAt: paid ? '—' : '2026-10-15 09:34',
      code: codeState,
      gift: giftState,
      /* 口令码交付侧的操作人与时间 */
      codeOp: (!isGift && hasOp) ? '运营_01' : '—',
      codeOpAt: (!isGift && hasOp) ? '2026-10-15 14:05' : '—',
      /* 好友赠送侧的操作人与时间 */
      giftOp: (isGift && hasOp) ? '运营_01' : '—',
      giftOpAt: (isGift && hasOp) ? '2026-10-15 14:20' : '—',
      /* 当前有效口令码：只在「已交付」时存在；人工补发会写入它 */
      currentCode: (!isGift && codeState === '已交付') ? 'CD' + (20261015000000 + i * 11) : '',
      resendLog: [],
      after: i % 7 === 0 ? '处理中' : '无',
      channel: i % 2 ? '支付宝' : '微信',
      time: '2026-10-' + (15 - (i % 12)) + ' ' + String(8 + (i % 11)).padStart(2, '0') + ':' + String((i * 7) % 60).padStart(2, '0'),
      buyer: '商城用户_' + (1000 + i),
      /* 用户以「来源平台＋平台用户ID」识别；手机号只存脱敏值，完整号码不进入原型数据（ADM-10） */
      buyerId: 'U' + (100000 + i * 7),
      phone: '138****' + String(((i * 37) % 9000) + 1000).slice(-4),
      friend: isGift ? 'https://s.team/p/' + ['abcd-efgh', 'ijkl-mnop', 'qrst-uvwx', 'yz12-3456'][i % 4] : '—',
      link: ''
    });
  }
  /* 演示超时关闭订单（CHG-0096）：未支付且超过 30 分钟，主状态=已关闭。 */
  var closed = rows.filter(function (o) { return o.pay === '待支付'; })[0];
  if (closed) {
    closed.state = '已关闭';
    closed.closedAt = '2026-10-15 09:34';
    closed.closeReason = '超时未支付，30 分钟有效期届满自动关闭';
  }
  /* 演示一笔退款进行中订单：主状态仍为待发货，只加退款中标记。 */
  var refunding = rows.filter(function (o) {
    return o !== closed && o.pay === '已支付' && o.deliver === '已交付';
  })[0];
  if (refunding) {
    refunding.refundStatus = '退款中';
    refunding.refundReason = '用户与企业微信客服协商退款，等待渠道回执';
    refunding.refundOp = '运营_02';
    refunding.refundAt = '2026-10-20 17:10';
    refunding.state = '待发货';
  }
  /* 演示一笔退款完成订单：退款中订单仍保持待发货；退款成功后展示已退款。 */
  var refunded = rows.filter(function (o) {
    return o !== refunding && o.pay === '已支付' && o.deliver === '已交付';
  })[0];
  if (refunded) {
    refunded.state = '已退款';
    refunded.refundStatus = '成功';
    refunded.refundReason = '用户与企业微信客服协商一致，全额退款';
    refunded.refundOp = '运营_02';
    refunded.refundAt = '2026-10-20 17:30';
    refunded.refundAmount = refunded.amount;
  }
  /* 口令码交付侧的派生字段（与订单同一对象，人工补发后订单同步可见） */
  rows.forEach(function (o, i) {
    if (o.type !== '口令码') return;
    o.codeRec = o.code === '已交付' ? 'CD' + (20261015000000 + i * 11) : '—';
    o.deliveredAt = o.deliver === '已交付' ? o.time : '—';
    o.processStatus = '—';
    o.processedBy = '—';
    o.processedAt = '—';
  });
  /* 上游 HIgame 发货信息（CHG-0090）。真实 API 同步返回 CDK；没有按订单号查询接口，
     超时/响应丢失/已处理待取码只能人工登录上游后台核查。原型用字段演示三种结果。 */
  var supUnknown = 0, supDup = 0, supFail = 0, supStock = 0;
  rows.forEach(function (o, i) {
    o.supOrderId = (o.type === '口令码' && o.pay === '已支付') ? o.no : '—';
    o.supBuyOrderId = '—';
    o.supCost = '';
    o.supStockClass = '—';
    o.supReqAt = '—';
    o.supCode = '—';
    o.supMsg = '';
    o.cdkSource = '—';
    o.manualOp = '—';
    o.manualAt = '—';
    if (o.type === '好友赠送') {
      o.supStatus = '不适用';
      o.supMsg = '好友赠送走人工交付，不调用上游自动发货接口';
      return;
    }
    if (o.pay !== '已支付') {
      o.supStatus = '未请求';
      o.supMsg = '待支付订单不发起上游发货';
      return;
    }
    if (o.code === '已交付') {
      o.supStatus = '已成功';
      o.supCode = '00000';
      o.supMsg = '上游返回 CDK，自动交付完成';
      o.supReqAt = o.time;
      o.supBuyOrderId = 'ws20261015' + String(100000 + i * 37);
      o.supStockClass = i % 2 ? '囤货' : '采购';
      o.supCost = Math.round(o.amount * (i % 2 ? 68 : 72)) / 100;
      o.cdkSource = 'API';
      return;
    }
    if (o.code === '发码中') {
      o.supStatus = '请求中';
      o.supCode = 'PENDING';
      o.supMsg = '已提交上游，等待返回';
      o.supReqAt = o.time;
      return;
    }
    /* 交付异常：演示「结果未知」「已处理待取码」「明确失败」三种人工核查场景。 */
    if (supUnknown === 0) {
      o.supStatus = '结果未知';
      o.supCode = 'TIMEOUT';
      o.supMsg = '请求超时/响应丢失，上游结果未知；不可自动重试';
      o.supReqAt = o.time;
      supUnknown++;
      return;
    }
    if (supDup === 0) {
      o.supStatus = '已处理待取码';
      o.supCode = 'pu006';
      o.supMsg = '上游已处理该订单，未返回 CDK；需人工核查';
      o.supReqAt = o.time;
      supDup++;
      return;
    }
    if (supFail === 0) {
      o.supStatus = '明确失败';
      o.supCode = 'pu005';
      o.supMsg = '出库失败：供应商未扣我方采购款，但用户已支付成功；需人工补发或退款，不自动重新调用';
      o.supReqAt = o.time;
      supFail++;
      return;
    }
    if (supStock === 0) {
      o.supStatus = '明确失败';
      o.supCode = 'pu004';
      o.supMsg = '供应商库存不足：未出库、未扣我方采购款；用户已支付，订单保持待发货并进入口令交付人工处理';
      o.supReqAt = o.time;
      supStock++;
      return;
    }
    o.supStatus = '结果未知';
    o.supCode = 'TIMEOUT';
    o.supMsg = '请求超时/响应丢失，上游结果未知；不可自动重试';
    o.supReqAt = o.time;
  });
  /* 请求状态按上游最终结果回填，避免把 pu004/pu005/pu006 这类明确返回误标为“返回不明”（CHG-0092）。 */
  rows.forEach(function (o) {
    if (o.type !== '口令码') return;
    if (o.supStatus === '未请求') o.reqState = '未请求';
    else if (o.supStatus === '请求中') o.reqState = '请求中';
    else if (o.supStatus === '结果未知') o.reqState = '返回不明';
    else o.reqState = '已返回';
    var manual = o.pay === '已支付' && (o.supStatus === '结果未知' || o.supCode === 'pu004' || o.supCode === 'pu005' || o.supCode === 'pu006');
    o.processStatus = manual ? '待处理' : '—';
    /* 钉钉实时通知只对内部运营，不向用户发送；正文不含完整 CDK（CHG-0096）。 */
    o.dingStatus = manual ? '已发送' : '—';
    o.dingAt = manual ? '2026-10-15 14:06' : '—';
    o.dingMsg = manual
      ? '异常订单 ' + o.no + '｜' + o.goods + '｜' + o.buyer + '｜' + (o.supCode === 'TIMEOUT' ? '结果未知' : o.supCode) + '｜请到口令码交付处理'
      : '—';
  });
  /* 演示一笔已处理订单：结果未知订单经人工后台查码并补录，处理状态=已处理，列表操作=查看。 */
  var seed = rows.filter(function (o) { return o.no === 'SO202610150001918'; })[0];
  if (seed) {
    var seedCode = 'HI-SEED-1918';
    seed.processStatus = '已处理';
    seed.processedBy = ADM_ROLE.name;
    seed.processedAt = '2026-10-20 16:20';
    seed.manualOp = ADM_ROLE.name;
    seed.manualAt = '2026-10-20 16:20';
    seed.cdkSource = '人工补录';
    seed.currentCode = seedCode;
    seed.code = '已交付';
    seed.reqState = '已返回';
    seed.codeOp = ADM_ROLE.name;
    seed.codeOpAt = '2026-10-20 16:20';
    seed.deliver = '已交付';
    seed.state = '已完成';
    seed.deliveredAt = '2026-10-20 16:20';
    seed.resendLog = [{ at: '2026-10-20 16:20', op: ADM_ROLE.name, type: '人工补发（人工查询上游后台）',
      reason: 'HIgame 后台按订单号查到已出库 CDK，补录', code: seedCode }];
    CODE_SYNC[seed.no] = seedCode;
    DELIVERY_SYNC[seed.no] = 'CODE::DELIVERED';
  }
  return rows;
}
const ADM_ORDERS = mkOrders();
/* 演示打通（CHG-0081）：后台这笔订单对应前台「我的订单」里已交付的演示订单，
   人工补发提交后前台订单详情读取到补录口令码。 */
(function () {
  var demo = ADM_ORDERS.filter(function (o) {
    return o.type === '口令码' && o.pay === '已支付' && o.code === '已交付';
  })[0];
  if (!demo) return;
  demo.no = 'SO2026101500012311'; demo.id = demo.no;
  demo.buyer = '玩家_小七'; demo.buyerId = 'U100000'; demo.phone = '138****0000';
  demo.platform = '平台A';
  demo.goods = 'P1002 暗影回廊'; demo.spec = '豪华版'; demo.amount = 298.00;
  demo.currentCode = MOCK_CODE; demo.codeRec = MOCK_CODE;
})();

/* 商品资料（CHG-0069）。一个商品可以有多条规格、可以同时支持两种交付类型、可以配置多个可激活地区，
   并带一段游戏介绍与一组图片／视频素材；素材顺序即前端商品详情页顶图的展示顺序。
   原先把规格、价格、交付类型、地区压成四个单值字段，无法表达"多规格""两种交付都支持""多地区"。 */
const ADM_GOODS = [
  { id: 'P1001', nm: '孤刃：影逝二度', status: '在售', sales7: 128, stock: 316,
    specs: [{ nm: '标准版', price: 128.00 }, { nm: '年度版', price: 198.00 }],
    ways: ['口令码', '好友赠送'], regions: ['中国'],
    intro: '以刀剑对决为核心的动作游戏。玩家扮演一名失去记忆的浪人，在战国末期的城镇与山道间追查自己的过去；战斗强调招架与反击的节奏，剧情由多个可选择的结局收束。',
    media: [{ t: 'image', n: 'lone_blade_keyart.jpg' }, { t: 'image', n: 'lone_blade_ss01.jpg' },
            { t: 'video', n: 'lone_blade_trailer.mp4' }, { t: 'image', n: 'lone_blade_ss02.jpg' }],
    notice: '本商品为 Steam 平台数字商品，下单前请确认账号可激活地区与版本。虚拟商品一经售出原则上不可退款；确因商品本身问题无法激活的，请通过企业微信客服并提供订单编号，由客服核实后按流程处理。商品价格与内容以本商城详情页展示为准，不随 Steam 商店售价调整而变更。',
    sys: { from: 'steam', at: '2026-10-15 09:20',
      min: { os: 'Windows 10 64 位', cpu: 'Intel Core i5-8400 / AMD Ryzen 5 2600', ram: '8 GB', gpu: 'NVIDIA GeForce GTX 1060 6 GB', disk: '50 GB 可用空间' },
      rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i7-9700K / AMD Ryzen 7 3700X', ram: '16 GB', gpu: 'NVIDIA GeForce RTX 2060', disk: '50 GB 可用空间' } },
  },
  { id: 'P1002', nm: '暗影回廊', status: '在售', sales7: 96, stock: 128,
    specs: [{ nm: '标准版', price: 258.00 }, { nm: '豪华版', price: 328.00 }],
    ways: ['口令码', '好友赠送'], regions: ['中国'],
    intro: '第一人称恐怖解谜游戏。玩家在一座结构不断改变的旧宅中寻找出口，需要收集线索、管理有限的照明电源，并决定在何处停下脚步。',
    media: [{ t: 'image', n: 'shadow_corridor_keyart.jpg' }, { t: 'image', n: 'shadow_corridor_ss01.jpg' }],
    notice: '本商品为 Steam 平台数字商品，下单前请确认账号可激活地区与版本。虚拟商品一经售出原则上不可退款；确因商品本身问题无法激活的，请通过企业微信客服并提供订单编号，由客服核实后按流程处理。商品价格与内容以本商城详情页展示为准，不随 Steam 商店售价调整而变更。',
    sys: { from: 'steam', at: '2026-10-15 09:20',
      min: { os: 'Windows 10 64 位', cpu: 'Intel Core i5-7400 / AMD Ryzen 3 2200G', ram: '8 GB', gpu: 'NVIDIA GeForce GTX 1050 Ti', disk: '40 GB 可用空间' },
      rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i7-8700 / AMD Ryzen 5 3600', ram: '16 GB', gpu: 'NVIDIA GeForce GTX 1660 Ti', disk: '40 GB 可用空间' } },
  },
  { id: 'P1003', nm: '星海远征', status: '在售', sales7: 74, stock: 0,
    specs: [{ nm: '标准版', price: 199.00 }, { nm: '完整版', price: 269.00 }],
    ways: ['口令码', '好友赠送'], regions: ['中国', '中国香港', '新加坡', '马来西亚'],
    intro: '开放宇宙探索游戏。玩家驾驶一艘可改造的飞船在程序生成的星系间航行，采集资源、建立前哨，并与沿途势力进行交易。',
    media: [{ t: 'image', n: 'star_voyage_keyart.jpg' }, { t: 'video', n: 'star_voyage_trailer.mp4' }],
    notice: '本商品为 Steam 平台数字商品，下单前请确认账号可激活地区与版本。虚拟商品一经售出原则上不可退款；确因商品本身问题无法激活的，请通过企业微信客服并提供订单编号，由客服核实后按流程处理。商品价格与内容以本商城详情页展示为准，不随 Steam 商店售价调整而变更。',
    sys: { from: 'steam', at: '2026-10-15 09:20',
      min: { os: 'Windows 10 64 位', cpu: 'Intel Core i5-9400 / AMD Ryzen 5 3600', ram: '12 GB', gpu: 'NVIDIA GeForce GTX 1660', disk: '60 GB 可用空间' },
      rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i7-10700 / AMD Ryzen 7 5800X', ram: '16 GB', gpu: 'NVIDIA GeForce RTX 3060', disk: '60 GB 可用空间' } },
  },
  { id: 'P1004', nm: '球场传奇 27', status: '在售', sales7: 61, stock: 52,
    specs: [{ nm: '标准版', price: 198.17 }, { nm: '豪华版', price: 268.00 }],
    ways: ['口令码'], regions: ['中国'],
    intro: '足球竞技游戏。包含俱乐部赛季、球员生涯与线上对战三种模式，本作采用新的控球与传球判定。',
    media: [{ t: 'image', n: 'court_legend_keyart.jpg' }, { t: 'image', n: 'court_legend_ss01.jpg' }],
    notice: '本商品为 Steam 平台数字商品，下单前请确认账号可激活地区与版本。虚拟商品一经售出原则上不可退款；确因商品本身问题无法激活的，请通过企业微信客服并提供订单编号，由客服核实后按流程处理。商品价格与内容以本商城详情页展示为准，不随 Steam 商店售价调整而变更。',
    sys: { from: 'steam', at: '2026-10-15 09:20',
      min: { os: 'Windows 10 64 位', cpu: 'Intel Core i5-6600K / AMD Ryzen 5 1600', ram: '8 GB', gpu: 'NVIDIA GeForce GTX 1050 Ti', disk: '45 GB 可用空间' },
      rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i7-8700K / AMD Ryzen 7 2700X', ram: '16 GB', gpu: 'NVIDIA GeForce GTX 1660 Super', disk: '45 GB 可用空间' } },
  },
  { id: 'P1005', nm: '铁血战线', status: '已下架', sales7: 12, stock: 0,
    specs: [{ nm: '标准版', price: 269.00 }, { nm: '金库版', price: 359.00 }],
    ways: ['口令码', '好友赠送'], regions: ['中国'],
    intro: '二战题材战术射击游戏。单人战役以小队指挥为主线，可下达推进、掩护与压制指令；多人模式不包含在本商品内。',
    media: [{ t: 'image', n: 'iron_front_keyart.jpg' }],
    notice: '本商品为 Steam 平台数字商品，下单前请确认账号可激活地区与版本。虚拟商品一经售出原则上不可退款；确因商品本身问题无法激活的，请通过企业微信客服并提供订单编号，由客服核实后按流程处理。商品价格与内容以本商城详情页展示为准，不随 Steam 商店售价调整而变更。',
    sys: { from: 'steam', at: '2026-10-15 09:20',
      min: { os: 'Windows 10 64 位', cpu: 'Intel Core i5-10400 / AMD Ryzen 5 3600', ram: '12 GB', gpu: 'NVIDIA GeForce GTX 1660 Super', disk: '80 GB 可用空间' },
      rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i7-11700 / AMD Ryzen 7 5800X', ram: '16 GB', gpu: 'NVIDIA GeForce RTX 3070', disk: '80 GB 可用空间' } },
  },
  { id: 'P1006', nm: '龙之誓言 II', status: '在售', supOnSale: false, sales7: 43, stock: 88,
    specs: [{ nm: '标准版', price: 224.00 }],
    ways: ['口令码'], regions: ['中国'],
    intro: '单人角色扮演游戏。以一支佣兵团的兴衰为主线，玩家的选择会改变阵营关系与结局；战斗为即时制，可暂停下达指令。',
    media: [{ t: 'image', n: 'dragon_oath_keyart.jpg' }, { t: 'image', n: 'dragon_oath_ss01.jpg' }],
    notice: '本商品为 Steam 平台数字商品，下单前请确认账号可激活地区与版本。虚拟商品一经售出原则上不可退款；确因商品本身问题无法激活的，请通过企业微信客服并提供订单编号，由客服核实后按流程处理。商品价格与内容以本商城详情页展示为准，不随 Steam 商店售价调整而变更。',
    sys: { from: 'steam', at: '2026-10-15 09:20',
      min: { os: 'Windows 10 64 位', cpu: 'Intel Core i5-8400 / AMD Ryzen 5 2600X', ram: '16 GB', gpu: 'NVIDIA GeForce GTX 1070', disk: '70 GB 可用空间' },
      rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i7-10700K / AMD Ryzen 7 3800X', ram: '16 GB', gpu: 'NVIDIA GeForce RTX 2070', disk: '70 GB 可用空间' } },
  },
  { id: 'P1007', nm: '街霸传说 6', status: '售罄', sales7: 88, stock: 0,
    specs: [{ nm: '标准版', price: 72.00 }],
    ways: ['口令码', '好友赠送'], regions: ['中国', '中国香港', '日本', '韩国'],
    intro: '2D 对战格斗游戏。包含街机、训练与线上排位模式，本作加入驱动系统与实时解说。',
    media: [{ t: 'image', n: 'fighter_legend_keyart.jpg' }, { t: 'video', n: 'fighter_legend_trailer.mp4' }],
    notice: '本商品为 Steam 平台数字商品，下单前请确认账号可激活地区与版本。虚拟商品一经售出原则上不可退款；确因商品本身问题无法激活的，请通过企业微信客服并提供订单编号，由客服核实后按流程处理。商品价格与内容以本商城详情页展示为准，不随 Steam 商店售价调整而变更。',
    sys: { from: 'steam', at: '2026-10-15 09:20',
      min: { os: 'Windows 10 64 位', cpu: 'Intel Core i5-7500 / AMD Ryzen 3 1200', ram: '8 GB', gpu: 'NVIDIA GeForce GTX 1060', disk: '60 GB 可用空间' },
      rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i5-10400 / AMD Ryzen 5 3600', ram: '16 GB', gpu: 'NVIDIA GeForce GTX 1660', disk: '60 GB 可用空间' } },
  },
  { id: 'P1008', nm: '铁骑与战团', status: '在售', sales7: 35, stock: 0,
    specs: [{ nm: '标准版', price: 24.50 }, { nm: '合集（本体+2款DLC）', price: 98.00 }],
    ways: ['口令码', '好友赠送'], regions: ['中国'],
    intro: '中世纪战争策略游戏。玩家经营一支雇佣兵团，在战役地图上行军、招募与补给，战斗采用可暂停的即时指挥。',
    media: [{ t: 'image', n: 'rider_warband_keyart.jpg' }],
    notice: '本商品为 Steam 平台数字商品，下单前请确认账号可激活地区与版本。虚拟商品一经售出原则上不可退款；确因商品本身问题无法激活的，请通过企业微信客服并提供订单编号，由客服核实后按流程处理。商品价格与内容以本商城详情页展示为准，不随 Steam 商店售价调整而变更。',
    sys: { from: 'steam', at: '2026-10-15 09:20',
      min: { os: 'Windows 10 64 位', cpu: 'Intel Core i5-7300HQ / AMD Ryzen 5 2500U', ram: '8 GB', gpu: 'NVIDIA GeForce GTX 1050', disk: '35 GB 可用空间' },
      rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i5-10300H / AMD Ryzen 5 4600H', ram: '16 GB', gpu: 'NVIDIA GeForce GTX 1650', disk: '35 GB 可用空间' } },
  }

];


/* CHG-0096：商品履约模式、SKU 库存与供应商价格（原型模拟；实际以 API/联调为准）。
   OWN_STOCK=自有 CDK 码池；API_PURCHASE=支付后向上游采购。 */
ADM_GOODS.forEach(function (gd, i) {
  var modes = ['自有库存', '自有库存', 'API采购', '自有库存', 'API采购', 'API采购', '自有库存', 'API采购'];
  gd.supplyMode = modes[i] || 'API采购';
  var listPrice = Math.min.apply(null, (gd.specs || []).map(function (sp) { return Number(sp.price) || 0; }));
  gd.supplierPrice = Math.round(listPrice * 0.72 * 100) / 100;
  gd.lowestPrice = Math.round(listPrice * 0.88 * 100) / 100;
  gd.steamPrice = Math.round(listPrice * 1.15 * 100) / 100;
  gd.steamLowPrice = Math.round(listPrice * 0.92 * 100) / 100;
  gd.priceSyncAt = '2026-10-22 09:00';
  gd.supInventory = [0, 0, 0, 0, 12, 9, 0, 0][i] || 0;
  gd.supOnSale = gd.status !== '已下架';
  /* 供应商库存同步状态（CHG-0099）：
     P1003 新鲜快照为 0 → 前台“已售罄”并禁止新购；
     P1006 新鲜库存充足但采购账户余额不足 → “补货中，暂不可购买”；
     P1008 同步失败/缓存过期且快照为 0 → 不判售罄，允许下单并提示以付款后结果为准；
     好友赠送两种商品均不校验供应商钱包/库存。 */
  gd.supSyncStatus = i === 7 ? '失败' : '成功';
  gd.supInventoryFresh = i !== 7;
  gd.supInventoryAt = i === 7 ? '2026-10-22 07:40' : '2026-10-22 09:00';
  gd.supInventoryText = i === 7 ? '缓存已过期 / 同步失败' : (gd.supplyMode === 'API采购' ? '缓存新鲜' : '—');
  /* 自有库存按 SKU 维护实际 CDK 码池（CHG-0096）：pool=码池总量，reserved=下单预占，
     available=pool-reserved 才是前台可售数量。API 采购不占用自有码池。 */
  gd.skuPool = {};
  gd.skuReserved = {};
  gd.skuStock = {};
  gd.skuCodes = {};
  gd.stockLog = [];
  var total = typeof gd.stock === 'number' ? gd.stock : 0;
  gd.specs.forEach(function (sp, j) {
    var pool = gd.supplyMode === '自有库存'
      ? Math.max(0, Math.floor(total * (j === 0 ? 0.65 : 0.35)))
      : 0;
    var reserved = gd.supplyMode === '自有库存' && j === 0 && pool > 4 ? 2 : 0;
    gd.skuPool[sp.nm] = pool;
    gd.skuReserved[sp.nm] = reserved;
    gd.skuStock[sp.nm] = Math.max(0, pool - reserved);
    gd.skuCodes[sp.nm] = [];
    for (var c = 0; c < pool; c++) {
      gd.skuCodes[sp.nm].push('CD-' + gd.id + '-' + String(j + 1) + '-' + String(c + 1).padStart(4, '0'));
    }
  });
  if (gd.supplyMode === '自有库存') {
    gd.stockLog.push({ at: '2026-10-21 16:20', op: '运营_02', sku: gd.specs[0].nm, delta: 12,
      before: Math.max(0, gd.skuPool[gd.specs[0].nm] - 12), after: gd.skuPool[gd.specs[0].nm],
      reason: '供应商补货入库（模拟）' });
    if (gd.skuReserved[gd.specs[0].nm]) {
      gd.stockLog.unshift({ at: '2026-10-22 09:10', op: '系统', sku: gd.specs[0].nm, delta: 0,
        before: gd.skuPool[gd.specs[0].nm], after: gd.skuPool[gd.specs[0].nm],
        reason: '当前预占 ' + gd.skuReserved[gd.specs[0].nm] + ' 个（待支付订单，30 分钟未支付将释放）' });
    }
  }
});


/* 供应商采购账户（CHG-0099）。口令码商品创建可支付订单前强校验余额；
   安全垫按供货价的 10% 模拟，正式阈值待财务/运营确认。 */
const ADM_SUPPLIER_WALLET = {
  available: 170.00,
  updatedAt: '2026-10-22 09:00',
  bufferRate: 0.10,
  inventoryFreshMinutes: 30,
  status: '正常'
};
function admSupplyWalletEnough(gd) {
  var cost = Number(gd.supplierPrice || 0);
  return ADM_SUPPLIER_WALLET.available >= cost * (1 + ADM_SUPPLIER_WALLET.bufferRate);
}

/* Steam 官方配置「查询结果」的模拟数据（CHG-0072）。
   原型不联网、不调用 Steam：这份表按游戏名匹配，用来演示「按游戏名称搜索配置 → 采用」
   这条交互。真实实现由服务端调用 Steam 商店接口取回并落库，字段口径与这里一致。
   查不到时如实返回"未找到"，不编造配置。 */
const ADM_STEAM_SYS = [
  { nm: '孤刃：影逝二度', appId: '2100001',
    rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i7-9700K / AMD Ryzen 7 3700X', ram: '16 GB', gpu: 'NVIDIA GeForce RTX 2060', disk: '50 GB 可用空间' } },
  { nm: '暗影回廊', appId: '2100002',
    rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i7-8700 / AMD Ryzen 5 3600', ram: '16 GB', gpu: 'NVIDIA GeForce GTX 1660 Ti', disk: '40 GB 可用空间' } },
  { nm: '星海远征', appId: '2100003',
    rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i7-10700 / AMD Ryzen 7 5800X', ram: '16 GB', gpu: 'NVIDIA GeForce RTX 3060', disk: '60 GB 可用空间' } },
  { nm: '球场传奇 27', appId: '2100004',
    rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i7-8700K / AMD Ryzen 7 2700X', ram: '16 GB', gpu: 'NVIDIA GeForce GTX 1660 Super', disk: '45 GB 可用空间' } },
  { nm: '铁血战线', appId: '2100005',
    rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i7-11700 / AMD Ryzen 7 5800X', ram: '16 GB', gpu: 'NVIDIA GeForce RTX 3070', disk: '80 GB 可用空间' } },
  { nm: '龙之誓言 II', appId: '2100006',
    rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i7-10700K / AMD Ryzen 7 3800X', ram: '16 GB', gpu: 'NVIDIA GeForce RTX 2070', disk: '70 GB 可用空间' } },
  { nm: '街霸传说 6', appId: '2100007',
    rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i5-10400 / AMD Ryzen 5 3600', ram: '16 GB', gpu: 'NVIDIA GeForce GTX 1660', disk: '60 GB 可用空间' } },
  { nm: '铁骑与战团', appId: '2100008',
    rec: { os: 'Windows 10 64 位', cpu: 'Intel Core i5-10300H / AMD Ryzen 5 4600H', ram: '16 GB', gpu: 'NVIDIA GeForce GTX 1650', disk: '35 GB 可用空间' } }
];

/* 交付类型为固定两项，不多不少（CHG-0069 评审明确：口令码、好友赠送） */
const ADM_WAYS = ['口令码', '好友赠送'];
/* Steam 官方支持的激活地区节选。正式实现由服务端同步 Steam 地区表，
   这里只取代表性地区用于原型演示；新增地区不改动本数组以外的逻辑。 */
const ADM_REGIONS = ['中国', '中国香港', '中国台湾', '日本', '韩国', '新加坡', '马来西亚', '泰国', '越南',
  '印度尼西亚', '菲律宾', '印度', '澳大利亚', '新西兰', '美国', '加拿大', '墨西哥', '巴西', '阿根廷',
  '智利', '哥伦比亚', '英国', '爱尔兰', '德国', '法国', '意大利', '西班牙', '葡萄牙', '荷兰', '比利时',
  '卢森堡', '奥地利', '瑞士', '瑞典', '挪威', '丹麦', '芬兰', '波兰', '捷克', '斯洛伐克', '匈牙利',
  '罗马尼亚', '保加利亚', '希腊', '土耳其', '俄罗斯', '乌克兰', '以色列', '沙特阿拉伯', '阿联酋',
  '南非', '埃及', '尼日利亚', '哈萨克斯坦'];

/* ---- 派生字段：多规格／多交付／多地区在列表里按「起价 / 名称串 / 类型串 / 地区串」展示 ---- */
function admGoodsPrice(gd) {
  var ps = (gd.specs || []).map(function (s) { return s.price; });
  return ps.length ? Math.min.apply(null, ps) : 0;
}
function admGoodsSpecText(gd) { return (gd.specs || []).map(function (s) { return s.nm; }).join(' / ') || '—'; }
function admGoodsWayText(gd) { return (gd.ways || []).join(' / ') || '—'; }
function admGoodsHasWay(gd, w) { return (gd.ways || []).indexOf(w) >= 0; }
function admGoodsRegionText(gd) { return (gd.regions || []).join('、') || '—'; }
/* 商品须知与硬件配置：详情页直接读原始字段，这里给后台列表与校验用的取值函数 */
function admGoodsNoticeText(gd) { var n = (gd.notice || "").trim(); return n ? (n.slice(0, 24) + (n.length > 24 ? "…" : "")) : "—"; }
function admGoodsSysText(gd) {
  var s = gd.sys;
  if (!s || !s.min) return "—";
  return (s.from === "steam" ? "Steam 官方" : "人工填写") + " · " + (s.at || "—");
}
function admGoodsMediaText(gd) {
  var m = gd.media || [];
  var img = m.filter(function (x) { return x.t === 'image'; }).length;
  var vid = m.length - img;
  return m.length ? (img + ' 图' + (vid ? ' / ' + vid + ' 视频' : '')) : '—';
}
function admGoodsAvailable(gd) {
  if (gd.supplyMode !== '自有库存') return null;
  return Object.keys(gd.skuStock || {}).reduce(function (n, k) { return n + (gd.skuStock[k] || 0); }, 0);
}
function admGoodsReserved(gd) {
  return Object.keys(gd.skuReserved || {}).reduce(function (n, k) { return n + (gd.skuReserved[k] || 0); }, 0);
}
function admGoodsPool(gd) {
  return Object.keys(gd.skuPool || {}).reduce(function (n, k) { return n + (gd.skuPool[k] || 0); }, 0);
}
/* 列表行：派生字段只读，写回仍以 ADM_GOODS 的原始结构为准 */
function admGoodsRows() {
  return ADM_GOODS.map(function (gd) {
    var avail = admGoodsAvailable(gd);
    return Object.assign({}, gd, {
      price: admGoodsPrice(gd), type: admGoodsWayText(gd),
      spec: admGoodsSpecText(gd), region: admGoodsRegionText(gd),
      stockAvail: avail === null ? gd.supInventory : avail,
      stockReserved: admGoodsReserved(gd),
      stockPool: admGoodsPool(gd),
      stock: avail === null ? gd.supInventory : avail
    });
  });
}

/* 好友赠送队列＝已支付的好友赠送订单（CHG-0079）。
   这里的行与 ADM_ORDERS 中的是同一个对象，状态一改，订单管理的交付列同步变化。 */
const ADM_GIFT_ROWS = ADM_ORDERS.filter(function (o) { return o.type === '好友赠送' && o.pay === '已支付'; });

/* 口令码交付只处理已支付订单（CHG-0085）：未支付订单不进入交付菜单；
   列表直接引用订单对象（CHG-0081），人工补发写回后订单管理同步可见。 */
const ADM_CODE_ROWS = ADM_ORDERS.filter(function (o) { return o.type === '口令码' && o.pay === '已支付'; });

/* 钉钉通知记录（CHG-0096）：pu004／pu005／pu006／结果未知四类异常实时推送运营群。
   原型只展示模拟消息，不配置真实 webhook、不发送真实通知。 */
const ADM_DING_ROWS = ADM_ORDERS.filter(function (o) {
  return o.type === '口令码' && o.pay === '已支付' &&
    (o.supStatus === '结果未知' || o.supCode === 'pu004' || o.supCode === 'pu005' || o.supCode === 'pu006');
}).map(function (o, i) {
  return {
    id: 'DING' + (20261015000000 + i * 5),
    no: o.no, goods: o.goods, buyer: o.buyer, phone: o.phone,
    code: o.supCode === 'TIMEOUT' ? '结果未知' : o.supCode,
    msg: o.dingMsg, at: o.dingAt, status: o.dingStatus,
    channel: '运营异常处理群（模拟）'
  };
});

const ADM_NOTIFY_ROWS = ADM_ORDERS.filter(function (o) { return o.pay === '已支付'; }).map(function (o, i) {
  var st = ['平台已受理', '发送失败', '结果未知', '待发送', '发送中'][i % 5];
  return Object.assign({}, o, {
    nid: 'NT' + (20261015000000 + i * 7), tpl: 'TPL-CODE-ARRIVED-V1',
    nstat: st, tries: st === '发送失败' ? 3 : (st === '结果未知' ? 2 : 1),
    reason: st === '发送失败' ? '平台返回限流（模拟）' : st === '结果未知' ? '请求超时，平台可能已受理' : '—'
  });
});

/* 通知模板（CHG-0088）：后台可编辑；保存后生成新版本，历史通知保留原版本快照。
   正文使用变量占位，不允许下发完整口令码（CODE-08）。 */
const ADM_NOTIFY_TPLS = [
  { id: 'TPL-CODE-ARRIVED', name: '口令码已到账', scene: '口令码已获取并保存', channel: '站内信',
    ver: 'V1', status: '启用',
    title: '您的口令码已到账',
    body: '您购买的《{{goods_name}}》（订单号 {{order_no}}）已交付。请登录商城，在「我的订单」中查看口令码。为保护账户安全，通知不展示完整口令码。',
    updatedAt: '2026-10-15 09:00', op: '运营_02' },
  { id: 'TPL-PAY-SUCCESS', name: '支付成功', scene: '服务端确认支付成功', channel: '站内信',
    ver: 'V1', status: '启用',
    title: '支付成功，等待发货',
    body: '订单 {{order_no}} 已支付成功，金额以订单快照为准。商城正在交付《{{goods_name}}》，请勿重复付款。',
    updatedAt: '2026-10-22 09:00', op: '运营_02' },
  { id: 'TPL-ORDER-CLOSED', name: '订单关闭', scene: '待支付订单超时关闭或用户取消', channel: '站内信',
    ver: 'V1', status: '启用',
    title: '订单已关闭',
    body: '订单 {{order_no}} 因超时未支付已关闭，未扣款、未发码。如需购买请重新下单，价格以实时价格为准。',
    updatedAt: '2026-10-22 09:05', op: '运营_02' },
  { id: 'TPL-GIFT-PROGRESS', name: '好友赠送进度', scene: '好友赠送开始处理或状态更新', channel: '站内信',
    ver: 'V1', status: '启用',
    title: '好友赠送进度更新',
    body: '订单 {{order_no}} 的好友赠送正在处理中。工作时间内预计 2～6 小时完成，非工作时段顺延至下一工作时段；请勿重复付款。',
    updatedAt: '2026-10-22 09:10', op: '运营_02' },
  { id: 'TPL-GIFT-DONE', name: '好友赠送已完成', scene: '运营确认好友赠送完成', channel: '站内信',
    ver: 'V1', status: '启用',
    title: '好友赠送已完成',
    body: '您购买的《{{goods_name}}》（订单号 {{order_no}}）已完成好友赠送交付，完成时间 {{deliver_time}}。如未收到，请联系企业微信客服。',
    updatedAt: '2026-10-15 09:10', op: '运营_02' },
  { id: 'TPL-DELIVER-EXCEPTION', name: '交付异常提醒', scene: '交付异常需人工处理', channel: '站内信',
    ver: 'V1', status: '启用',
    title: '您的订单交付需要人工处理',
    body: '订单 {{order_no}} 的交付暂未完成，运营正在人工处理。请勿重复付款，可在「我的订单」查看最新进度或联系企业微信客服。',
    updatedAt: '2026-10-15 09:20', op: '运营_02' },
  { id: 'TPL-MANUAL-RESEND', name: '人工补发完成', scene: '运营完成人工补发', channel: '站内信',
    ver: 'V1', status: '启用',
    title: '您的订单已补发',
    body: '订单 {{order_no}} 已完成人工补发，请登录商城在「我的订单」中查看最新口令码。为保护账户安全，通知不展示完整口令码。',
    updatedAt: '2026-10-22 09:15', op: '运营_02' },
  { id: 'TPL-REFUND-RESULT', name: '退款结果通知', scene: '退款执行结果回执', channel: '站内信',
    ver: 'V1', status: '启用',
    title: '退款处理结果',
    body: '订单 {{order_no}} 的退款已处理，金额 {{refund_amount}} 元，结果以原支付渠道回执为准。如有疑问，请联系企业微信客服。',
    updatedAt: '2026-10-22 09:20', op: '运营_02' }
];

const ADM_REFUND_ROWS = [
  { id: 'RF2026101500001', order: 'SO2026101500000130', amount: 269.00, channel: '微信', stat: '待审核', reason: '用户反馈口令码无法激活，经客服协商', deliver: '已交付（需核查联动）', op: '运营_02', time: '2026-10-15 10:02' },
  { id: 'RF2026101500002', order: 'SO2026101500000267', amount: 199.00, channel: '支付宝', stat: '退款中', reason: '好友赠送超时未完成，客服协商退款', deliver: '赠送处理中（存在冲突）', op: '运营_02', time: '2026-10-15 10:20' },
  { id: 'RF2026101500003', order: 'SO2026101400000404', amount: 128.00, channel: '微信', stat: '成功', reason: '重复购买协商退款', deliver: '未交付', op: '财务_01', time: '2026-10-14 18:41' },
  { id: 'RF2026101500004', order: 'SO2026101300000541', amount: 24.50, channel: '微信', stat: '失败', reason: '用户申请退款，渠道返回失败（模拟）', deliver: '未交付', op: '财务_01', time: '2026-10-13 15:11' },
  { id: 'RF2026101500005', order: 'SO2026101500000678', amount: 224.00, channel: '支付宝', stat: '已拒绝', reason: '不符合退款条件，商品已正常交付', deliver: '已交付', op: '运营_02', time: '2026-10-15 11:03' }
];

const ADM_PAYCHK_ROWS = ADM_ORDERS.filter(function (o) { return o.pay === '确认中' || o.pay === '待支付'; }).map(function (o, i) {
  return Object.assign({}, o, {
    pid: 'PY' + (20261015000000 + i * 13),
    attempts: (i % 3) + 1,
    lastQuery: '2026-10-15 ' + String(9 + (i % 6)).padStart(2, '0') + ':' + String((i * 11) % 60).padStart(2, '0'),
    qReason: ['渠道处理中', '查询超时', '用户放弃支付后返回', '等待渠道异步通知'][i % 4],
    resolvable: '仅可在渠道或查询结果确认后更新，不能人工改为已支付'
  });
});

const ADM_AUDIT_ROWS = [
  { id: 'AU2026101500001', op: '运营_02', role: '运营', act: '口令码补发', obj: 'SO2026101500000130', before: '—', after: 'CD20261015000099', reason: '用户反馈未收到口令码', time: '2026-10-15 10:12', ip: '10.0.0.31' },
  { id: 'AU2026101500002', op: '运营_02', role: '运营', act: '赠送批次导出', obj: 'BATCH-20261015-01', before: '待导出（8 单）', after: '已导出', reason: '日常处理', time: '2026-10-15 09:40', ip: '10.0.0.31' },
  { id: 'AU2026101500003', op: '财务_01', role: '财务', act: '退款执行', obj: 'RF2026101500003', before: '退款中', after: '成功', reason: '重复购买协商退款', time: '2026-10-14 18:41', ip: '10.0.0.52' },
  { id: 'AU2026101500004', op: '管理员', role: '管理员', act: '权限变更', obj: '账号 客服_02', before: '查询', after: '查询、查码', reason: '排班调整', time: '2026-10-14 16:22', ip: '10.0.0.9' },
  { id: 'AU2026101500005', op: '运营_02', role: '运营', act: '商品下架', obj: 'P1005 铁血战线', before: '在售', after: '已下架', reason: '供应商缺货', time: '2026-10-14 14:05', ip: '10.0.0.31' },
  { id: 'AU2026101500006', op: '运营_02', role: '运营', act: '通知重试', obj: 'NT20261015000003', before: '发送失败', after: '平台已受理', reason: '平台限流已恢复', time: '2026-10-14 11:35', ip: '10.0.0.31' }
];
for (var _i = 7; _i <= 26; _i++) {
  ADM_AUDIT_ROWS.push({
    id: 'AU2026101' + String(5000000 + _i * 3), op: ['运营_01', '运营_02', '客服_01', '财务_01'][_i % 4], role: ['运营', '客服', '财务'][_i % 3],
    act: ['订单查询', '口令码查看', '订单查询', '通知重试', '商品编辑'][_i % 5], obj: 'SO2026101' + String(50000000 + _i * 137),
    before: '—', after: '—', reason: '日常处理', time: '2026-10-' + (13 - (_i % 10)) + ' ' + String(9 + (_i % 8)).padStart(2, '0') + ':' + String((_i * 13) % 60).padStart(2, '0'), ip: '10.0.0.' + (10 + (_i % 40))
  });
}

const ADM_AGREE_ROWS = [
  { id: 'AG-V1.0', ver: 'V1.0', title: '购买协议',
    pub: '2026-10-15 00:00', stat: '生效中', orders: 128, mode: '后台发布',
    note: '当前生效版本', op: '运营_02',
    body: '<p><strong>一、商品适用范围</strong></p><p>本协议适用于本商城销售的 Steam 平台数字商品，交付方式包括口令码自动发码与 Steam 好友赠送人工交付，以商品页实际标注为准。</p><p><strong>二、交付方式与时效</strong></p><p>口令码商品在服务端确认付款成功后自动取码；好友赠送由运营在工作日 8:00～18:00（中国标准时间）人工完成，工作时间内下单预计 2～6 小时完成，非工作时段顺延至下一工作时段。</p><p><strong>三、退款原则</strong></p><p>虚拟商品一经售出原则上不可退款；如遇口令码无法激活、交付异常等情况，请联系企业微信客服并提供订单编号，由商城核查后处理。</p><p><strong>四、客服方式</strong></p><p>客服渠道与企业微信服务时间以商城页面展示为准。</p>' },
  { id: 'AG-V0.9', ver: 'V0.9', title: '购买协议',
    pub: '2026-10-01 00:00', stat: '已停用', orders: 4, mode: '后台发布',
    note: '版本变化时需重新确认（AGREEMENT-04）', op: '运营_01',
    body: '<p><strong>一、商品适用范围</strong></p><p>本协议适用于本商城销售的 Steam 平台数字商品。</p><p><strong>二、交付方式与时效</strong></p><p>口令码商品在付款成功后自动发码；好友赠送由运营人工处理。</p><p><strong>三、退款原则</strong></p><p>虚拟商品原则上不可退款；特殊情况经客服协商处理。</p><p><strong>四、客服方式</strong></p><p>客服渠道以商城页面展示为准。</p>' }
];



/* 搜索推荐配置（CHG-0075）。
   不再维护「排序」字段：数组顺序即前台展示顺序，热门商品通过拖拽调整。
   前台展示位有限（SEARCH_KW_LIMIT / SEARCH_HOT_LIMIT），启用项按顺序取前 N 条，
   超出的不展示——后台可以多配，但不会撑破前台布局。
   这里故意配得比展示位多，便于评审验证「超出不显示」这条规则。 */
const ADM_SEARCH_KW = [
  { id: 'KW-01', w: '孤刃', on: '启用' },
  { id: 'KW-02', w: '暗影回廊', on: '启用' },
  { id: 'KW-03', w: '星海远征', on: '启用' },
  { id: 'KW-04', w: '球场传奇', on: '启用' },
  { id: 'KW-05', w: '铁血战线', on: '停用' },
  { id: 'KW-06', w: '铁骑与战团', on: '启用' },
  { id: 'KW-07', w: '龙之誓言', on: '启用' },
  { id: 'KW-08', w: '街霸传说', on: '启用' }
];
const ADM_SEARCH_GOODS = [
  { id: 'RG-01', gid: 'P1001', on: '启用' },
  { id: 'RG-02', gid: 'P1002', on: '启用' },
  { id: 'RG-03', gid: 'P1004', on: '启用' },
  { id: 'RG-04', gid: 'P1003', on: '启用' },
  { id: 'RG-05', gid: 'P1006', on: '启用' }
];
/* 列表展示名：关键词直接用词；热门商品从商品资料派生商品名（不区分规格），
   商品被删除时如实标注，不保留陈旧名称。 */
function admSearchRow(rec) {
  if (rec.w) return { id: rec.id, nm: rec.w, on: rec.on, w: rec.w };
  var gd = ADM_GOODS.filter(function (g) { return g.id === rec.gid; })[0];
  /* 商品下架/售罄后该条推荐自然失效：后台如实标注状态，前台不展示（CHG-0077） */
  var nm = gd ? (gd.nm + (gd.status !== '在售' ? '（' + gd.status + '）' : '')) : '（商品已删除）';
  return { id: rec.id, nm: nm, on: rec.on, gid: rec.gid };
}

/* 首页组件固定两种——「首页banner」与「商品列表」，不支持新增与删除（评审 CHG-0055）。
   组件类型与所属 Tab 由组件自身决定，不可修改；最后操作人与时间用于列表展示与追溯。
   首页banner 的展示内容为「图片 + 商品」的商品广告，最多 ADM_BANNER_MAX 个；
   只要存在已配置的素材即视为生效，未配置时前端不显示广告位，因此没有独立的启停与生效时间（评审 CHG-0056）。 */
const ADM_BANNER_MAX = 4;
const ADM_HOME_BLOCKS = [
  { id: 'HM-01', nm: '首页banner', type: 'banner', tab: '首页', opBy: '运营_02', opAt: '2026-10-15 10:24',
    interval: 4,
    items: [{ id: 'BI-01', img: '', goodsId: 'P1001' },
            { id: 'BI-02', img: '', goodsId: 'P1002' },
            { id: 'BI-03', img: '', goodsId: 'P1003' }] },
  { id: 'HM-02', nm: '商品列表', type: '列表', tab: '首页', opBy: '运营_02', opAt: '2026-10-14 18:07',
    /* 数据范围固定为全部在售商品；展示数量与排序方式不再由后台配置（评审 CHG-0058）：
       客户端每页取 15 条、下拉再取 15 条，默认按「推荐」排序。
       hot 为热门商品ID的有序列表，排序优先级最高。 */
    scope: '全部在售商品',
    hot: ['P1002', 'P1001'] }
];

/* 角色授权对象＝后台菜单权限（CHG-0089）；具体操作权限仍由服务端按角色校验。
   新增角色通过页面写入本数组；账号通过角色获得菜单可见范围。 */
const ADM_ROLES = [
  { id: 'ROLE-01', nm: '运营', desc: '商品、订单、赠送与口令码处理', acc: 3,
    menus: ['ADM-HOME-01', 'ADM-GOODS-01', 'ADM-STOCK-01', 'ADM-SEARCH-01', 'ADM-ORDER-01', 'ADM-GIFT-01', 'ADM-CODE-01', 'ADM-NOTIFY-01'],
    updatedAt: '2026-10-15 09:00', op: '管理员' },
  { id: 'ROLE-02', nm: '客服', desc: '订单查询、好友赠送与通知核查', acc: 2,
    menus: ['ADM-ORDER-01', 'ADM-GIFT-01', 'ADM-NOTIFY-01'],
    updatedAt: '2026-10-15 09:05', op: '管理员' },
  { id: 'ROLE-03', nm: '财务', desc: '订单与退款相关查询', acc: 1,
    menus: ['ADM-ORDER-01', 'ADM-NOTIFY-01', 'ADM-AUDIT-01'],
    updatedAt: '2026-10-15 09:10', op: '管理员' },
  { id: 'ROLE-04', nm: '管理员', desc: '全部后台菜单与权限配置', acc: 1,
    menus: ['ADM-HOME-01', 'ADM-GOODS-01', 'ADM-STOCK-01', 'ADM-SEARCH-01', 'ADM-ORDER-01', 'ADM-GIFT-01', 'ADM-CODE-01', 'ADM-NOTIFY-01', 'ADM-AGREE-01', 'ADM-RBAC-01', 'ADM-AUDIT-01'],
    updatedAt: '2026-10-15 09:15', op: '管理员' }
];
const ADM_ACCOUNTS = [
  { id: 'ACC-01', nm: '运营_02', role: '运营', platform: '全部平台', state: '启用', last: '2026-10-15 09:31' },
  { id: 'ACC-02', nm: '运营_01', role: '运营', platform: '平台A', state: '启用', last: '2026-10-15 09:02' },
  { id: 'ACC-03', nm: '客服_01', role: '客服', platform: '全部平台', state: '启用', last: '2026-10-15 08:55' },
  { id: 'ACC-04', nm: '财务_01', role: '财务', platform: '全部平台', state: '启用', last: '2026-10-14 18:42' },
  { id: 'ACC-05', nm: '管理员', role: '管理员', platform: '全部平台', state: '启用', last: '2026-10-14 16:22' }
];
const ADM_PERM_MATRIX = [
  { k: 'query', n: '订单查询' }, { k: 'code', n: '查看口令码' }, { k: 'export', n: '导出' },
  { k: 'resend', n: '人工补发' }, { k: 'refund', n: '退款' }, { k: 'config', n: '系统配置' }
];
const ADM_BATCH_ROWS = [
  { id: 'BATCH-20261015-01', cnt: 8, op: '运营_02', time: '2026-10-15 09:40', stat: '已导出', done: 5, dup: '未识别到重复导出', file: 'gift_batch_20261015_01.csv（模拟）' },
  { id: 'BATCH-20261014-02', cnt: 6, op: '运营_01', time: '2026-10-14 15:10', stat: '已完成', done: 6, dup: '其中 1 单与上一批次重复，已核对', file: 'gift_batch_20261014_02.csv（模拟）' },
  { id: 'BATCH-20261014-01', cnt: 5, op: '运营_01', time: '2026-10-14 10:02', stat: '部分完成', done: 3, dup: '无', file: 'gift_batch_20261014_01.csv（模拟）' }
];
