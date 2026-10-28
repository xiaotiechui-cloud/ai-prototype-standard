
/* ============================================================
   ADM 运营后台：通用运行时与页面配置（第一部分）
   ============================================================ */
const ADM_RT = {};
function admRT(id) {
  if (!ADM_RT[id]) admResetRT(id);
  return ADM_RT[id];
}
function admResetRT(id) {
  ADM_RT[id] = {
    draft: {}, committed: {}, tab: '全部', page: 1, size: 10, sel: [], loading: false,
    error: false, noperm: false, drawer: null, drawerId: null, msg: '', msgKind: '',
    reqVer: 0, advOpen: false, exportState: 'IDLE', refreshSeq: 0
  };
}
/* 迟到响应作废：每次查询递增 reqVer，回调只处理版本一致的请求（7.6.3 第9条） */
function admQuery(id) { var rt = admRT(id); rt.reqVer++; return rt.reqVer; }
function admIsStale(id, ver) { return admRT(id).reqVer !== ver; }

function admVal(rt, key) {
  var v = rt.committed[key];
  return (v === undefined || v === null) ? '' : v;
}
function admApplyFilters(cfg, rt, rows) {
  var out = rows.slice();
  var all = (cfg.filters || []).concat(cfg.advanced || []);
  all.forEach(function (f) {
    if (f.type === 'date') return;
    var v = admVal(rt, f.k);
    if (v === '' || v === '全部') return;
    out = out.filter(function (r) {
      var rv = f.get ? f.get(r) : r[f.k];
      if (rv === undefined || rv === null) return false;
      if (f.type === 'select') return String(rv) === String(v);
      return String(rv).toLowerCase().indexOf(String(v).toLowerCase()) >= 0;
    });
  });
  all.forEach(function (f) {
    if (f.type !== 'date') return;
    var from = admVal(rt, f.k + '_from'), to = admVal(rt, f.k + '_to');
    if (!from && !to) return;
    out = out.filter(function (r) {
      var rv = String((f.get ? f.get(r) : r[f.k]) || '').slice(0, 10);
      if (from && rv < from) return false;
      if (to && rv > to) return false;
      return true;
    });
  });
  return out;
}
/* 页签计数同源：取“其他已提交筛选条件下各状态的数量”（7.6.3 第4条） */
function admTabCounts(cfg, rt, rows) {
  /* 页签不是状态分组、而是数据源切换时（如搜索推荐配置），由配置自己给出计数 */
  if (typeof cfg.tabCounts === 'function') return cfg.tabCounts(rt, rows);
  var counts = {};
  (cfg.tabs || ['全部']).forEach(function (t) { counts[t] = 0; });
  rows.forEach(function (r) {
    if (counts['全部'] !== undefined) counts['全部']++;
    var v = cfg.tabField ? String(cfg.tabField(r)) : '';
    if (counts[v] !== undefined) counts[v]++;
  });
  return counts;
}
function admFiltered(cfg, rt) {
  var rows = admApplyFilters(cfg, rt, cfg.rows());
  if (cfg.tabs && cfg.tabField && rt.tab !== '全部') {
    rows = rows.filter(function (r) { return String(cfg.tabField(r)) === rt.tab; });
  }
  return rows;
}

const ADM_CFG = {};

/* ---------- ADM-HOME-01 首页配置管理 ---------- */
/* 首页组件固定两种、不可增删；页面不提供搜索/筛选与状态页签（评审 CHG-0055）。
   首页banner 的编辑支持素材的增删与拖拽排序、图片上传、商品选择（CHG-0056）。 */
function admHomeRow(label, val) {
  return '<div class="row" style="gap:10px;align-items:flex-start">' +
    '<span class="small muted" style="width:88px;flex:none">' + esc(label) + '</span>' +
    '<span class="small grow">' + val + '</span></div>';
}
/* 编辑中的副本：抽屉打开时从记录深拷贝，只有点「保存配置」才写回。 */
function admHomeDraft(r) {
  return {
    id: r.id,
    items: (r.items || []).map(function (x) { return { id: x.id, img: x.img, goodsId: x.goodsId }; }),
    interval: r.interval, scope: r.scope,
    hot: (r.hot || []).slice()
  };
}
function admHomeBannerEditor(r, rt) {
  var d = rt.hmDraft, n = d.items.length;
  var rows = d.items.map(function (it, k) {
    var gd = it.goodsId ? ADM_GOODS.filter(function (x) { return x.id === it.goodsId; })[0] : null;
    return '<div class="hm-item" draggable="true" data-hm-item="' + attr(it.id) + '" data-idx="' + k + '">' +
      '<button class="hm-grip" type="button" tabindex="-1" aria-hidden="true" title="按住拖拽调整顺序">⣿</button>' +
      '<div class="hm-up' + (it.img ? ' has-img' : '') + '" style="' + (it.img ? 'background-image:url(' + it.img + ')' : '') + '">' +
        '<span>点击上传图片</span>' +
        '<input type="file" accept="image/*" data-hm-file="' + attr(it.id) + '"' +
        ' aria-label="上传第 ' + (k + 1) + ' 个广告的图片" title="点击选择本地图片">' +
      '</div>' +
      '<div class="hm-body">' +
        '<div class="hm-top">' +
          '<span class="hm-no">第 ' + (k + 1) + ' 个广告</span>' +
          (it.img ? '' : '<span class="hm-flag">未上传图片</span>') +
          (gd ? '' : '<span class="hm-flag">未选择商品</span>') +
          '<button class="btn sm hm-x" type="button" data-act="adm-hm-del" data-item="' + attr(it.id) + '"' +
          ' data-confirm="删除后该条广告（含已上传的图片）将从展示内容中移除，保存配置后生效。"' +
          ' data-confirm-title="删除该条广告？" data-confirm-obj="第 ' + (k + 1) + ' 个广告　' + (gd ? gd.nm : '未选择商品') + '">删除</button>' +
        '</div>' +
        '<div class="hm-bot">' +
          '<span class="gd' + (gd ? '' : ' empty') + '">' + (gd ? esc(gd.nm + '（' + gd.id + '）') : '未选择商品') + '</span>' +
          (gd ? '<span class="pr">¥' + admGoodsPrice(gd).toFixed(2) + ' 起</span>' : '') +
          '<button class="btn sm hm-pick" type="button" data-act="adm-hm-pick" data-item="' + attr(it.id) + '">' +
            (gd ? '更换商品' : '选择商品') + '</button>' +
        '</div>' +
      '</div>' +
      '</div>';
  }).join('');
  var body = n
    ? '<div class="hm-list">' + rows + '</div>'
    : '<div class="hm-empty">尚未配置展示内容。点击下方「添加商品广告」添加，最多 ' + ADM_BANNER_MAX + ' 个。</div>';
  var fullHint = n >= ADM_BANNER_MAX
    ? '<div class="hm-hint">已达上限 ' + ADM_BANNER_MAX + ' 个，需先删除已有广告才能继续添加。</div>' : '';
  return '<div class="col" style="gap:10px">' +
    admHomeRow('组件名称', '<span class="tag">' + esc(r.nm) + '</span>') +
    admHomeRow('组件类型', '<span class="tag">' + esc(r.type) + '</span>') +
    admHomeRow('所属Tab', '<span class="tag">' + esc(r.tab) + '</span>') +
    '<div class="hint">组件名称、组件类型与所属Tab均为固定值，本页不可修改、不可新增或删除组件。</div>' +
    admHomeRow('展示内容', '') +
    '<div style="margin-left:98px">' + body +
      '<div class="row" style="margin-top:8px"><button class="btn sm" type="button" data-act="adm-hm-add"' +
      (n >= ADM_BANNER_MAX ? ' disabled' : '') + '>添加商品广告</button>' +
      '<span class="xsmall muted" style="align-self:center">已配置 ' + n + ' / ' + ADM_BANNER_MAX + '　每条广告需同时具备图片与商品</span></div>' +
      fullHint +
      '<div class="hm-hint">建议图片尺寸与首页广告位同比例（APP 画布内 288×96、PC 画布内约 1240×220；最终规格待设计确认 TBD-03）。</div>' +
    '</div>' +
    admHomeRow('轮播间隔', '<input class="inp" id="hmInterval" data-hm-int="1" style="min-height:34px;max-width:90px" value="' + attr(d.interval) + '" inputmode="numeric" aria-label="轮播间隔（秒）">' +
      ' <span class="small">秒</span>' +
      ' <span class="xsmall muted">默认 4 秒；不允许为空或 0，填入 0 或清空时按 1 秒兜底。</span>') +
    admHomeRow('最后操作', esc(r.opBy) + '　' + esc(r.opAt)) +
    (rt.hmMsg ? '<div class="hm-hint' + (rt.hmMsgKind === 'err' ? ' err' : '') + '">' + esc(rt.hmMsg) + '</div>' : '') +
    '</div>';
}
function admHomeListEditor(r, rt) {
  var d = rt.hmDraft;
  var hotRows = d.hot.map(function (gid, k) {
    var gd = ADM_GOODS.filter(function (x) { return x.id === gid; })[0];
    return '<tr draggable="true" data-drag-item="' + attr(gid) + '" data-drag-list="hot"' +
      ' data-component="ADM-COMMON-C05">' +
      '<td class="col-grip"><button class="hm-hotgrip" type="button" tabindex="-1" aria-hidden="true" title="按住拖拽调整顺序">⣿</button></td>' +
      '<td class="nm">' + esc(gd ? gd.nm : gid) + '<span class="xsmall muted">　' + esc(gid) + '</span></td>' +
      '<td class="col-img"><span class="hm-thumb">［商品图］</span></td>' +
      '<td class="col-sale">' + (gd ? gd.sales7 : '—') + '</td>' +
      '<td class="col-op">' +
        '<button class="btn sm hm-hotop-b danger" type="button" data-act="adm-hm-hot-del" data-goods="' + attr(gid) + '"' +
        ' data-confirm="删除后该商品将从热门商品列表中移除，其余商品仍按客户端所选排序展示。保存配置后生效。"' +
        ' data-confirm-title="从热门商品中移除？" data-confirm-obj="' + esc(gd ? gd.nm : gid) + '（' + esc(gid) + '）">删除</button>' +
      '</td></tr>';
  }).join('');
  var hotBox = d.hot.length
    ? '<table class="hm-hot"><thead><tr><th class="col-grip"></th><th>商品名称</th>' +
      '<th class="col-img">商品图片</th><th class="col-sale">最近7天销量</th><th class="col-op">操作</th></tr></thead>' +
      '<tbody>' + hotRows + '</tbody></table>'
    : '<div class="hm-empty">尚未添加热门商品。热门商品会排在商品列表最前面。</div>';
  var inSale = ADM_GOODS.filter(function (x) { return x.status === '在售'; }).length;

  return '<div class="col" style="gap:10px">' +
    admHomeRow('组件名称', '<span class="tag">' + esc(r.nm) + '</span>') +
    admHomeRow('组件类型', '<span class="tag">' + esc(r.type) + '</span>') +
    admHomeRow('所属Tab', '<span class="tag">' + esc(r.tab) + '</span>') +
    '<div class="hint">组件名称、组件类型与所属Tab均为固定值，本页不可修改、不可新增或删除组件。</div>' +
    admHomeRow('数据范围', '<span class="tag">' + esc(d.scope) + '</span>' +
      ' <span class="xsmall muted">固定选项，不可修改。当前在售 ' + inSale + ' 个商品（模拟数据）。</span>') +
    admHomeRow('获取方式', '<span class="xsmall muted">客户端分页获取，每页 15 条；每次下拉加载再取 15 条，直至取完。本页不再配置展示数量。</span>') +
    admHomeRow('默认排序', '<span class="xsmall muted">客户端默认选中「推荐」，排序规则由客户端决定，本页不再配置。</span>') +
    admHomeRow('空数据', '<span class="xsmall muted">若后台无在售商品，客户端商品列表为空，客户端展示空状态（不显示空白区）。</span>') +
    '<div class="hm-section"><div class="hm-section-t">热门商品列表</div>' + hotBox +
      '<div class="row" style="margin-top:8px"><button class="btn sm" type="button" data-act="adm-hm-hot-add">添加热门商品</button>' +
      '<span class="xsmall muted" style="align-self:center">已添加 ' + d.hot.length + ' 个　仅可选在售商品</span></div>' +
    '</div>' +
    admHomeRow('最后操作', esc(r.opBy) + '　' + esc(r.opAt)) +
    (rt.hmMsg ? '<div class="hm-hint' + (rt.hmMsgKind === 'err' ? ' err' : '') + '">' + esc(rt.hmMsg) + '</div>' : '') +
    '</div>';
}
/* 商品选择弹层：带搜索框，点击行选中。 */
function admHomePicker(rt) {
  var q = (rt.pickQ || '').trim().toLowerCase();
  /* 热门商品只列在售商品（已下架/售罄不应被推荐）；banner 模式维持原口径 */
  var list = ADM_GOODS.filter(function (gd) {
    if (rt.pickMode === 'hot' && gd.status !== '在售') return false;
    if (rt.pickMode === 'hot' && (rt.hmDraft.hot || []).indexOf(gd.id) >= 0) return false;   // 已在热门里不再重复列出
    return !q || (gd.nm + ' ' + gd.id).toLowerCase().indexOf(q) >= 0;
  });
  var body = list.length
    ? list.map(function (gd) {
        return '<button class="hm-grow" type="button" data-act="adm-hm-pick-ok" data-goods="' + attr(gd.id) + '"' +
          ' aria-selected="' + (rt.pickSel === gd.id ? 'true' : 'false') + '">' +
          '<span class="nm">' + esc(gd.nm) + '（' + esc(gd.id) + '）' + '</span>' +
          '<span class="pr">¥' + admGoodsPrice(gd).toFixed(2) + ' 起</span></button>';
      }).join('')
    : '<div class="hm-empty">没有匹配「' + esc(rt.pickQ) + '」的商品。可试试商品名称或商品ID。</div>';
  return '<div class="adm-mask' + (rt.pickOpen ? ' on' : '') + '" id="hmMask" role="dialog" aria-modal="true" aria-label="选择商品">' +
    '<div class="adm-dlg picker"><div class="dt"><span class="strong">' + (rt.pickMode === 'hot' ? '添加热门商品' : '选择商品') + '</span>' +
    '<span class="gd-count">共 ' + list.length + ' 个商品</span>' +
    /* 确定/取消与其它弹窗一致收在右上角（CHG-0067）；关闭固定为 ✕ */
    '<div class="acts"><button class="btn sm" type="button" data-act="adm-hm-pick-cancel">取消</button>' +
    '<button class="btn primary sm" type="button" data-act="adm-hm-pick-confirm"' + (rt.pickSel ? '' : ' disabled') + '>确定</button>' +
    '<button class="btn mini" type="button" data-act="adm-hm-pick-cancel" aria-label="关闭" title="关闭">✕</button></div></div>' +
    '<div class="db"><div class="hm-srch"><input id="hmPickQ" data-hm-pickq="1" placeholder="搜索商品名称或商品ID" value="' + attr(rt.pickQ || '') + '" aria-label="搜索商品"></div>' +
    '<div>' + body + '</div></div>' +
    '<div class="df"><span class="xsmall muted" style="margin-right:auto;align-self:center">点击商品行即选中，再点右上角「确定」加入；关闭不影响已打开的上层弹窗与草稿</span>' +
    '</div></div></div>';
}
ADM_CFG['ADM-HOME-01'] = {
  title: '首页配置管理', adm: 'ADM-01', perm: 'config', metrics: false,
  noFilters: true, noTabs: true,
  sub: '维护首页各组件的展示内容。首页组件固定为「首页banner」与「商品列表」两种，不支持新增与删除；组件类型与所属Tab由组件自身决定，不可修改。',
  columns: [{ k: 'nm', t: '组件名称', w: '18%' },
            { k: 'type', t: '组件类型', w: '12%' },
            { k: 'tab', t: '所属Tab', w: '12%' },
            { k: 'opBy', t: '最后操作人', w: '16%' },
            { k: 'opAt', t: '最后操作时间', w: '24%', sec: true },
            { k: '_op', t: '操作', w: '18%' }],
  rows: function () { return ADM_HOME_BLOCKS; },
  actions: ['编辑'],
  overlay: function (rt) { return admHomePicker(rt); },
  drawerHead: function () {
    return '<button class="btn primary sm" type="button" data-act="adm-hm-save">保存配置</button>';
  },
  drawerTitle: function (r) { return r.nm + ' · 编辑'; },
  drawer: function (r, rt) {
    if (!rt.hmDraft || rt.hmDraft.id !== r.id) rt.hmDraft = admHomeDraft(r);
    return r.type === 'banner' ? admHomeBannerEditor(r, rt) : admHomeListEditor(r, rt);
  }
};

/* ---------- 商品编辑（CHG-0069）：草稿、各字段渲染、地区选择子层 ---------- */

/* 草稿：深拷贝一份，只有「保存」才写回 ADM_GOODS（与首页配置同一套做法）。
   多规格／多交付类型／多地区都允许在草稿里自由增删，取消保存即整体丢弃。 */
function admGoodsDraft(r) {
  return {
    id: r.id, nm: r.nm,
    supplyMode: r.supplyMode || 'API采购',
    specs: (r.specs || []).map(function (s) { return { nm: s.nm, price: s.price }; }),
    ways: (r.ways || []).slice(),
    regions: (r.regions || []).slice(),
    intro: r.intro || '',
    notice: r.notice || '',
    /* 硬件配置：min 为可编辑的最低配置，rec 为搜索到的 Steam 推荐配置（未采用前也先存下来） */
    sys: {
      from: (r.sys && r.sys.from) || 'manual',
      at: (r.sys && r.sys.at) || '',
      min: Object.assign({ os: '', cpu: '', ram: '', gpu: '', disk: '' }, (r.sys && r.sys.min) || {}),
      rec: (r.sys && r.sys.rec) ? Object.assign({}, r.sys.rec) : null
    },
    /* u 是本地预览用的 dataURL：只存在于本次编辑会话，不写回商品资料、不落盘、不上传 */
    media: (r.media || []).map(function (m, k) { return { id: 'MD-' + (k + 1), t: m.t, n: m.n, u: '' }; })
  };
}

/* 地区选择子层：带搜索的多选清单，选中即回到主弹窗的已选标签区 */
function admRegionPicker(rt) {
  var q = (rt.regQ || '').trim().toLowerCase();
  var sel = (rt.regDraft || []);
  var list = ADM_REGIONS.filter(function (x) { return !q || x.toLowerCase().indexOf(q) >= 0; });
  var rows = list.length
    ? list.map(function (x) {
        return '<label class="gd-region-row"><input type="checkbox" data-act="adm-gd-region-toggle" data-region="' + attr(x) + '"' +
          (sel.indexOf(x) >= 0 ? ' checked' : '') + '><span>' + esc(x) + '</span></label>';
      }).join('')
    : '<div class="hm-empty">没有匹配「' + esc(rt.regQ) + '」的地区。可试试地区中文名或英文名。</div>';
  return '<div class="adm-mask' + (rt.regOpen ? ' on stacked' : '') + '" id="regMask" role="dialog" aria-modal="true" aria-label="选择地区">' +
    '<div class="adm-dlg picker"><div class="dt"><span class="strong">选择可激活地区</span>' +
    '<span class="gd-count">已选 <b id="regSelCount">' + sel.length + '</b> 个</span>' +
    '<div class="acts"><button class="btn sm" type="button" data-act="adm-gd-region-cancel">取消</button>' +
    '<button class="btn primary sm" type="button" data-act="adm-gd-region-ok"' + (sel.length ? '' : ' disabled') + '>确定</button>' +
    '<button class="btn mini" type="button" data-act="adm-gd-region-cancel" aria-label="关闭" title="关闭">✕</button></div></div>' +
    '<div class="db"><div class="hm-srch"><input id="regQ" data-gd-regq="1" placeholder="搜索地区名称" value="' + attr(rt.regQ || '') + '" aria-label="搜索地区"></div>' +
    '<div class="gd-regions">' + rows + '</div>' +
    '<div class="hint" style="margin-top:8px">列表为 Steam 官方支持地区节选，正式实现由服务端同步 Steam 地区表；' +
    '该字段会在前端购买界面（选择发货方式处）展示，仅用于说明本商品可激活的地区范围。</div></div>' +
    '<div class="df"><span class="xsmall muted" style="margin-right:auto;align-self:center">共 ' + list.length + ' 个地区　选择后点右上角「确定」</span></div>' +
    '</div></div>';
}


/* 硬件配置（CHG-0072）。搜索按游戏名匹配内置的 Steam 配置表——
   原型不联网、不调用 Steam，因此结果区明确写「模拟数据」；真实实现由服务端调用
   Steam 商店接口取回并落库，字段口径与这里一致。查不到时如实提示，不编造配置。 */
function admGoodsSysBlock(rt, block) {
  var d = rt.gdDraft;
  var q = rt.sysQ == null ? d.nm : rt.sysQ;
  var hit = rt.sysHit || null;
  var f = function (k, label) {
    return '<span class="k">' + esc(label) + '</span>' +
      '<input class="inp" data-gd-sys-f="' + k + '" value="' + attr(d.sys.min[k] || '') + '" aria-label="' + attr(label) + '">';
  };
  var hitBox = '';
  if (rt.sysSearched) {
    hitBox = hit
      ? '<div class="gd-sys-hit"><div class="t">Steam 官方推荐配置（AppID ' + esc(hit.appId) + '）</div>' +
        '<div class="v">' + esc(hit.rec.os) + '　' + esc(hit.rec.cpu) + '　' + esc(hit.rec.ram) + '　' + esc(hit.rec.gpu) + '　' + esc(hit.rec.disk) + '</div>' +
        '<div class="row" style="margin-top:8px"><button class="btn primary sm" type="button" data-act="adm-gd-sys-apply">采用推荐配置</button>' +
        '<span class="xsmall muted">采用后写入下方各项，并把数据来源标记为 Steam 官方</span></div></div>'
      : '<div class="gd-sys-hit"><div class="t">没有匹配「' + esc(rt.sysQ) + '」的配置。</div>' +
        '<div class="xsmall muted">可换个游戏名再搜，或直接在下方手工填写五项；<b>查不到时不编造配置</b>。</div></div>';
  }
  return block('硬件配置', 0,
    '<div class="gd-sys-q"><input class="inp" data-gd-sys-q="1" value="' + attr(q) + '" placeholder="输入游戏名称，如 孤刃：影逝二度" aria-label="用于搜索 Steam 配置的游戏名称">' +
    '<button class="btn sm" type="button" data-act="adm-gd-sys-search">搜索 Steam 配置</button></div>' +
    '<div class="xsmall muted" style="margin-top:6px">按游戏名称查询 Steam 官方配置；<b>原型为内置模拟数据，不联网、不调用 Steam</b>，正式实现由服务端调用 Steam 商店接口</div>' +
    hitBox +
    '<div class="gd-sys-fields">' + f('os', '操作系统') + f('cpu', '处理器') + f('ram', '内存') + f('gpu', '显卡') +
    f('disk', '存储空间') + '<span class="k">数据来源</span><span class="xsmall muted">' +
    esc(d.sys.from === 'steam' ? 'Steam 官方' : '人工填写') + '　' + esc(d.sys.at || '—') + '</span></div>' +
    '<div class="hint">以上为最低配置；已采用 Steam 推荐配置时，详情页会同时展示推荐配置。前端商品详情页的「硬件配置」读取的就是这里的内容</div>');
}


/* 素材预览（CHG-0074）。按当前顺序展示前端商品详情页顶图的效果：
   上面一个大预览块、下面一行缩略图，点缩略图切换；第一张标注「顶图」。
   本地上传的图片有 dataURL，直接显示；内置示例素材与视频没有本地文件，
   用占位块如实说明，不伪造画面。 */
function admGoodsMediaPreview(rt, d) {
  if (!d.media.length) return '';
  var curId = rt.gdPrev;
  if (!d.media.filter(function (m) { return m.id === curId; }).length) curId = d.media[0].id;
  var ci = 0;
  d.media.forEach(function (m, k) { if (m.id === curId) ci = k; });
  var cur = d.media[ci];
  var stage;
  if (cur.u && cur.t !== 'video') {
    stage = '<img class="gd-prev-img" src="' + attr(cur.u) + '" alt="' + attr(cur.n) + '">';
  } else if (cur.t === 'video') {
    stage = '<div class="gd-prev-ph">▶ 视频素材<br>' + esc(cur.n) + '<br>（原型不播放本地视频文件）</div>';
  } else {
    stage = '<div class="gd-prev-ph">第 ' + (ci + 1) + ' 张<br>' + esc(cur.n) + '<br>（示例素材，无本地文件）</div>';
  }
  var thumbs = d.media.map(function (m, k) {
    var on = m.id === curId;
    var inner = (m.u && m.t !== 'video')
      ? '<img src="' + attr(m.u) + '" alt="">'
      : (m.t === 'video' ? '▶' : '图' + (k + 1));
    return '<button class="gd-thumb' + (on ? ' on' : '') + '" type="button" data-act="adm-gd-prev"' +
      ' data-item="' + attr(m.id) + '" aria-pressed="' + (on ? 'true' : 'false') + '"' +
      ' aria-label="预览第 ' + (k + 1) + ' 个素材：' + attr(m.n) + '" title="' + attr(m.n) + '">' + inner + '</button>';
  }).join('');
  return '<div class="gd-prev">' +
    '<div class="gd-prev-hd">预览：前端商品详情页顶图（与下方列表同一顺序）</div>' +
    '<div class="gd-prev-stage">' + stage + '</div>' +
    '<div class="gd-prev-meta"><span>' + esc(cur.n) + '</span><span>·</span><span>' + (cur.t === 'video' ? '视频' : '图片') +
      '</span><span>·</span><span>第 ' + (ci + 1) + ' / ' + d.media.length + ' 张</span>' +
      (ci === 0 ? '<span class="gd-prev-top">顶图</span>' : '') + '</div>' +
    '<div class="gd-thumbs">' + thumbs + '</div></div>';
}

/* 商品编辑正文。所有输入都用 data-gd-* 标记，值实时写进 rt.gdDraft（不整页重渲染，避免丢焦点）。 */
function admGoodsEditor(r, rt) {
  if (!rt.gdDraft || rt.gdDraft.id !== r.id) rt.gdDraft = admGoodsDraft(r);
  var d = rt.gdDraft;

  var specs = d.specs.map(function (s, k) {
    return '<div class="gd-spec-row">' +
      '<input class="inp gd-spec-nm" data-gd-spec-nm="' + k + '" value="' + attr(s.nm) + '" placeholder="规格文案，如 标准版" aria-label="第 ' + (k + 1) + ' 条规格的名称">' +
      '<input class="inp gd-spec-pr" data-gd-spec-pr="' + k + '" value="' + attr(s.price) + '" inputmode="decimal" placeholder="价格" aria-label="第 ' + (k + 1) + ' 条规格的价格">' +
      '<button class="btn sm gd-del" type="button" data-act="adm-gd-spec-del" data-idx="' + k + '"' +
      (d.specs.length <= 1 ? ' disabled title="至少保留一条规格"' :
        ' data-confirm="删除后该规格与价格将从本商品中移除，保存后生效；已成交订单的历史快照不受影响。" data-confirm-obj="' + attr(s.nm || ('第 ' + (k + 1) + ' 条规格')) + '"') +
      '>删除</button></div>';
  }).join('');

  var ways = ADM_WAYS.map(function (w) {
    return '<label><input type="checkbox" data-act="adm-gd-way" data-way="' + attr(w) + '"' +
      (d.ways.indexOf(w) >= 0 ? ' checked' : '') + '><span>' + esc(w) + '</span></label>';
  }).join('');

  var chips = d.regions.length
    ? d.regions.map(function (x) {
        return '<span class="gd-chip">' + esc(x) +
          '<button type="button" data-act="adm-gd-region-del" data-region="' + attr(x) + '" aria-label="取消勾选 ' + attr(x) + '">✕</button></span>';
      }).join('')
    : '<span class="xsmall muted">尚未选择地区</span>';

  var meds = d.media.length
    ? d.media.map(function (m, k) {
        return '<div class="gd-med" draggable="true" data-gd-item="' + attr(m.id) + '" data-gd-idx="' + k + '">' +
          '<button class="grip" type="button" tabindex="-1" aria-hidden="true" title="按住拖拽调整顺序">⣿</button>' +
          '<span class="kind">' + (m.t === 'video' ? '视频' : '图片') + '</span>' +
          '<span class="fn" title="' + attr(m.n) + '">' + esc(m.n) + '</span>' +
          '<button class="del" type="button" data-act="adm-gd-media-del" data-idx="' + k + '"' +
          ' data-confirm="移除后该素材不再作为前端商品详情页的顶图，保存后生效。" data-confirm-obj="' + attr(m.n) + '">删除</button>' +
          '</div>';
      }).join('')
    : '<div class="xsmall muted">尚未上传素材；未上传时前端详情页顶图位置展示占位。</div>';

  function block(label, req, body) {
    return '<div class="gd-block"><div class="gd-label">' + esc(label) + (req ? '<span class="req">*</span>' : '') + '</div>' +
      '<div class="gd-body">' + body + '</div></div>';
  }

  return block('商品名称', 1,
      '<input class="inp" data-adm-req="商品名称" data-gd-nm="1" style="min-height:40px" value="' + attr(d.nm) + '" aria-label="商品名称">') +
    block('履约方式', 0,
      '<select class="inp" data-gd-mode="1" style="min-height:40px" aria-label="履约方式">' +
      ['自有库存', 'API采购'].map(function (x) { return '<option value="' + x + '"' + (d.supplyMode === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') +
      '</select><div class="hint">自有库存：下单预占、支付消耗、30 分钟关闭释放；API采购：支付后调用供应商取码。自有库存按 SKU 码池管理，库存导入待联调确认。</div>') +
    block('供应商价格', 0,
      '<table class="admin-table"><tbody>' +
      '<tr><th style="width:28%">商品官方原价</th><td>¥' + (r.steamPrice || 0).toFixed(2) + '</td></tr>' +
      '<tr><th>Steam 最低价</th><td>¥' + (r.steamLowPrice || 0).toFixed(2) + '</td></tr>' +
      '<tr><th>最低销售价</th><td>¥' + (r.lowestPrice || 0).toFixed(2) + '</td></tr>' +
      '<tr><th>最近同步</th><td>' + esc(r.priceSyncAt || '—') + '</td></tr>' +
      '</tbody></table>' +
      '<div class="row" style="margin-top:8px;gap:8px;align-items:center"><button class="btn sm" type="button" data-act="adm-gd-price-sync">手动更新获取</button>' +
      '<span class="xsmall muted">从供应商 API 获取最新价格，作为定价参考；不改变商品售价与已成交订单快照。</span></div>' +
      (rt.gdPriceMsg ? '<div class="xsmall" style="color:#1f7a3d;margin-top:6px">' + esc(rt.gdPriceMsg) + '</div>' : '') +
      '<div class="hint">价格由供应商 API 同步，运营不可修改；金额展示为元，接口原始单位以联调为准。当前采购账户可用余额 ¥' + ADM_SUPPLIER_WALLET.available.toFixed(2) + '，口令码商品创建可支付订单前会校验余额（含 ' + Math.round(ADM_SUPPLIER_WALLET.bufferRate * 100) + '% 安全垫）。</div>') +
    block('规格与价格', 1,
      '<div class="gd-specs">' + specs + '</div>' +
      '<div class="row" style="margin-top:8px"><button class="btn sm" type="button" data-act="adm-gd-spec-add">+ 添加规格</button>' +
      '<span class="xsmall muted">每条规格包含规格文案与价格；前端购买面板的「选择版本」按这里的顺序展示</span></div>') +
    block('交付类型', 1,
      '<div class="gd-ways">' + ways + '</div>' +
      '<div class="hint">固定两项，可多选、可取消勾选；默认勾选「口令码」。前端购买面板的可选发货方式与本项一致，' +
      '未勾选的类型在前端不出现（4.4：不把两种能力混作同一种）</div>') +
    block('地区', 1,
      '<div class="gd-chips">' + chips + '</div>' +
      '<div class="row" style="margin-top:8px"><button class="btn sm" type="button" data-act="adm-gd-region-open">选择地区</button>' +
      '<span class="xsmall muted">默认仅勾选「中国」；该字段在前端购买界面（选择发货方式处）展示</span></div>') +
    block('游戏介绍', 0,
      '<textarea class="inp" data-gd-intro="1" style="min-height:96px" aria-label="游戏介绍" placeholder="填写后展示在前端商品详情页">' + esc(d.intro) + '</textarea>' +
      '<div class="hint">纯文本；为空时前端详情页不展示该区块（不生成占位内容）</div>') +
    block('商品须知', 0,
      '<textarea class="inp" data-gd-notice="1" style="min-height:96px" aria-label="商品须知" placeholder="退换与客服说明等，填写后展示在前端商品详情页的「商品须知」区块">' + esc(d.notice) + '</textarea>' +
      '<div class="hint">纯文本；为空时前端该区块整体隐藏（不生成占位内容）</div>') +
    admGoodsSysBlock(rt, block) +
    block('商品图片/视频', 0,
      admGoodsMediaPreview(rt, d) +
      '<div class="gd-meds">' + meds + '</div>' +
      '<div class="row" style="margin-top:8px"><span class="gd-up"><button class="btn sm" type="button" tabindex="-1">+ 上传素材</button>' +
      '<input type="file" accept="image/*,video/*" multiple data-gd-file="1" aria-label="上传商品图片或视频" title="点击选择本地图片或视频"></span>' +
      '<span class="xsmall muted">支持图片与视频；<b>拖拽行首手柄调整顺序</b>，保存后决定前端商品详情页顶图的展示顺序；点击上方缩略图可切换预览</span></div>' +
      '<div class="hint">选择的本地文件只在本次编辑会话内预览：不落盘、不上传、不写入商品资料，保存后仅文件名保留在素材列表里。</div>');
}

/* ---------- ADM-GOODS-01 商品管理 ---------- */
ADM_CFG['ADM-GOODS-01'] = {
  title: '商品管理', adm: 'ADM-02', perm: 'config',
  sub: '维护商品、规格、售价、履约方式、交付类型、Steam 限制、须知及上下架；供应商价格只读展示。商品修改不覆盖历史成交快照；停用或下架不得使历史订单无法查收（9.2）。',
  filters: [{ k: 'nm', label: '商品名称', type: 'text', ph: '按名称或商品ID查询' },
            { k: 'type', label: '交付类型', type: 'select', opts: ['全部', '口令码', '好友赠送'] },
            { k: 'status', label: '状态', type: 'select', opts: ['全部', '在售', '已下架', '售罄'] }],
  advanced: [             { k: 'region', label: '可激活地区', type: 'select', opts: ['全部', '中国', '中国香港', '日本', '美国'] }],
  tabs: ['全部', '在售', '已下架', '售罄'], tabField: function (r) { return r.status; },
  columns: [{ k: 'id', t: '商品ID', w: '8%', sec: true }, { k: 'nm', t: '商品名称', w: '18%' },
            { k: 'price', t: '售价', w: '8%', fmt: function (r) { return r.price.toFixed(2); } },
            { k: 'steamPrice', t: '官方原价', w: '8%', sec: true, fmt: function (r) { return (r.steamPrice || 0).toFixed(2); } },
            { k: 'steamLowPrice', t: 'Steam最低', w: '8%', sec: true, fmt: function (r) { return (r.steamLowPrice || 0).toFixed(2); } },
            { k: 'lowestPrice', t: '最低销售价', w: '9%', sec: true, fmt: function (r) { return (r.lowestPrice || 0).toFixed(2); } },
            { k: 'supplyMode', t: '履约方式', w: '8%' }, { k: 'stock', t: '库存', w: '7%' },
            { k: 'status', t: '状态', w: '8%' }, { k: '_op', t: '操作', w: '10%' }],
  rows: function () { return admGoodsRows(); },
  actions: ['编辑'],
  /* 上架/下架是改商品状态的破坏性动作，必须二次确认后才生效（CHG-0070）；
     标题、说明与按钮按当前状态给「上架」或「下架」两套，避免用同一句话含糊两种后果。 */
  extraActions: [{ n: '上架/下架', direct: true, confirmFn: function (r) {
    var up = r.status !== '在售';
    return up
      ? { title: '确认上架该商品？', tone: 'normal', ok: '确认上架',
          body: '上架后该商品在前端商城可被浏览与购买；下单校验以服务端结果为准。',
          obj: r.nm + '（' + r.id + '）　当前状态：' + r.status,
          note: '确定后立即生效，无需额外保存。' }
      : { title: '确认下架该商品？', ok: '确认下架',
          body: '下架后该商品不再出现在前端列表、搜索结果与详情页；已有关联订单仍可正常查看与查收（9.2）。',
          obj: r.nm + '（' + r.id + '）　当前状态：' + r.status,
          note: '确定后立即生效，无需额外保存。' };
  } }],
  drawerTitle: function (r) { return '商品编辑 · ' + r.nm; },
  drawerHead: function () { return '<button class="btn primary sm" type="button" data-act="adm-save">保存</button>'; },
  drawer: function (r, rt) { return admGoodsEditor(r, rt); },
  /* 地区选择子层（叠加在编辑弹窗之上） */
  overlay: function (rt) { return admRegionPicker(rt); },
  /* 保存前的整体校验与写回：草稿写回 ADM_GOODS 的原始结构 */
  commitDraft: function (rt) {
    var d = rt.gdDraft;
    if (!d) return null;
    var row = ADM_GOODS.filter(function (x) { return x.id === d.id; })[0];
    if (!row) return '保存失败：该商品已不存在，请刷新列表后重试。';
    if (!String(d.nm || '').trim()) return '保存失败：商品名称不能为空。';
    if (!d.specs.length) return '保存失败：至少需要一条规格与价格。';
    for (var k = 0; k < d.specs.length; k++) {
      if (!String(d.specs[k].nm || '').trim()) return '保存失败：第 ' + (k + 1) + ' 条规格的规格文案不能为空。';
      var pr = Number(d.specs[k].price);
      if (!(pr > 0)) return '保存失败：第 ' + (k + 1) + ' 条规格的价格需大于 0。';
    }
    if (!d.ways.length) return '保存失败：交付类型至少勾选一项。';
    if (!d.regions.length) return '保存失败：可激活地区至少勾选一个。';
    row.nm = String(d.nm).trim();
    row.supplyMode = d.supplyMode || row.supplyMode;
    row.specs = d.specs.map(function (s) { return { nm: String(s.nm).trim(), price: Number(s.price) }; });
    row.ways = d.ways.slice();
    row.regions = d.regions.slice();
    row.intro = String(d.intro || '');
    row.notice = String(d.notice || '');
    row.sys = {
      from: d.sys.from, at: d.sys.at,
      min: Object.assign({}, d.sys.min),
      rec: d.sys.rec ? Object.assign({}, d.sys.rec) : null
    };
    row.media = d.media.map(function (m) { return { t: m.t, n: m.n }; });
    return null;
  },
  afterCommit: function (rt) { rt.gdDraft = null; rt.regOpen = false; rt.regDraft = null; rt.regQ = ''; rt.gdPrev = '';
    rt.sysQ = null; rt.sysHit = null; rt.sysSearched = false; rt.gdPriceMsg = '';   // 硬件配置/价格同步态
  }
};

/* ---------- ADM-STOCK-01 可售库存 ---------- */
function admStockDraft(r) {
  return { id: r.id, deltas: {}, reason: '' };
}
function admStockDrawer(r, rt) {
  var own = r.supplyMode === '自有库存';
  var d = rt.stockDraft && rt.stockDraft.id === r.id ? rt.stockDraft : admStockDraft(r);
  if (!own) {
    return '<div class="hint">该商品为 <b>API 采购</b>：支付后调用供应商 extractcode，不占用自有码池；供应商库存只是快照，不是预留，最终以取码返回为准。</div>' +
      '<table class="admin-table" style="margin-top:8px"><tbody>' +
      '<tr><th style="width:28%">供应商库存快照</th><td>' + (r.supInventory == null ? '—' : r.supInventory) + '（同步时间 ' + esc(r.priceSyncAt || '—') + '）</td></tr>' +
      '<tr><th>最近同步结果</th><td>成功；接口超时或返回不明时保留上次有效值，需人工核对</td></tr>' +
      '<tr><th>缺货处理</th><td>支付后返回 pu004 时进入待发货并转口令交付人工处理</td></tr>' +
      '</tbody></table>' +
      '<div class="strong small" style="margin-top:14px">同步记录</div>' +
      '<table class="admin-table" style="margin-top:6px"><thead><tr><th style="width:26%">同步时间</th><th style="width:18%">结果</th><th>说明</th></tr></thead><tbody>' +
      '<tr><td>2026-10-22 09:00</td><td>成功</td><td>供应商库存更新为 ' + (r.supInventory == null ? '—' : r.supInventory) + '（模拟数据）</td></tr>' +
      '<tr><td>2026-10-22 08:30</td><td>成功</td><td>无变化</td></tr>' +
      '<tr><td>2026-10-22 08:00</td><td>失败</td><td>接口超时，已保留上次有效值（模拟数据）</td></tr>' +
      '</tbody></table>' +
      '<div class="hint" style="margin-top:8px">调用超时或返回不明时先查询或人工核对，不直接无限重试（6.2）。预付款不足或供应商缺货时记录异常并提供运营处理入口。</div>';
  }
  var chips = (rt.stockCodeSku && r.skuCodes && r.skuCodes[rt.stockCodeSku])
    ? '<div class="hint" style="margin-top:6px">' + rt.stockCodeSku + ' 码池（脱敏预览，仅展示前 12 个）：' +
      r.skuCodes[rt.stockCodeSku].slice(0, 12).map(function (c) { return '<span class="tag" style="margin:2px">' + esc(maskCode(c)) + '</span>'; }).join('') +
      (r.skuCodes[rt.stockCodeSku].length > 12 ? ' … 共 ' + r.skuCodes[rt.stockCodeSku].length + ' 个' : '') + '</div>'
    : '';
  return '<div class="hint">自有库存按 SKU 维护实际 CDK 码池：<b>码池总量 − 预占 = 可售</b>。下单预占、支付成功消耗、待支付订单 30 分钟关闭后释放。真实 CDK 导入接口待与开发商联调确认，本页仅模拟数量与脱敏码池，不导入真实 CDK。</div>' +
    '<table class="admin-table" style="margin-top:8px"><thead><tr><th>规格（SKU）</th><th>码池总量</th><th>已预占</th><th>当前可售</th>' +
    (rt.stockEdit ? '<th style="width:15%">调整数量</th>' : '<th>调整后</th>') + '<th>码池</th></tr></thead><tbody>' +
    (r.specs || []).map(function (sp) {
      var pool = (r.skuPool || {})[sp.nm] || 0;
      var res = (r.skuReserved || {})[sp.nm] || 0;
      var avail = (r.skuStock || {})[sp.nm] || 0;
      var delta = rt.stockEdit && d.deltas[sp.nm] != null ? d.deltas[sp.nm] : '';
      var after = avail + (Number(delta) || 0);
      return '<tr><td>' + esc(sp.nm) + '</td><td>' + pool + '</td><td>' + res + '</td><td>' + avail + '</td>' +
        '<td>' + (rt.stockEdit
          ? '<input class="inp" data-stock-sku="' + attr(sp.nm) + '" value="' + attr(delta) + '" inputmode="numeric" placeholder="+/-" style="min-height:34px;max-width:100px" aria-label="' + attr(sp.nm + ' 调整数量') + '">'
          : after) + '</td>' +
        '<td><button class="btn mini" type="button" data-act="adm-stock-codes" data-sku="' + attr(sp.nm) + '">' + (rt.stockCodeSku === sp.nm ? '收起' : '查看') + '</button></td></tr>';
    }).join('') + '</tbody></table>' + chips +
    (rt.stockEdit
      ? '<div class="row" style="margin-top:10px"><span class="small muted" style="width:96px;flex:none">调整原因<span style="color:var(--error)">*</span></span>' +
        '<input class="inp" data-stock-reason="1" value="' + attr(d.reason) + '" placeholder="如：供应商补货、盘点差异修正" style="min-height:40px;flex:1" aria-label="调整原因"></div>' +
        '<div class="hint">调整数量填正数入库、负数出库；提交后写库存台账（操作人、时间、前后数量、原因）。</div>'
      : '') +
    '<div class="strong small" style="margin-top:14px">库存台账</div>' +
    '<table class="admin-table" style="margin-top:6px"><thead><tr><th>时间</th><th>操作人</th><th>规格</th><th>变动</th><th>调整前 → 调整后</th><th>原因</th></tr></thead><tbody>' +
    ((r.stockLog || []).length ? r.stockLog.map(function (l) {
      return '<tr><td>' + esc(l.at) + '</td><td>' + esc(l.op) + '</td><td>' + esc(l.sku) + '</td>' +
        '<td>' + (l.delta > 0 ? '+' : '') + l.delta + '</td><td>' + l.before + ' → ' + l.after + '</td><td>' + esc(l.reason) + '</td></tr>';
    }).join('') : '<tr><td colspan="6" class="xsmall muted">暂无调整记录</td></tr>') + '</tbody></table>' +
    '<div class="hint" style="margin-top:8px">库存为 0 时前台展示「已售罄」并禁用购买；供应商下架或供应商库存为 0 同样不可购买。供应商无锁库接口，API 采购不锁定供应商库存。</div>';
}
ADM_CFG['ADM-STOCK-01'] = {
  title: '可售库存', adm: 'ADM-04', perm: 'config',
  sub: '按履约方式查看库存：自有库存按 SKU 维护实际 CDK 码池（总量、预占、可售），支持手工调整并写台账；API 采购不占自有码池，展示供应商库存快照。口令码商品创建可支付订单前强校验采购账户余额；库存为 0 且同步新鲜时前台展示售罄并禁用购买，缓存过期/同步失败时允许下单但提示以付款后供应商结果为准。',
  filters: [{ k: 'nm', label: '商品', type: 'text', ph: '按名称或ID查询' },
            { k: 'supplyMode', label: '履约方式', type: 'select', opts: ['全部', '自有库存', 'API采购'] },
            { k: 'status', label: '可售状态', type: 'select', opts: ['全部', '在售', '已下架', '售罄'] }],
  tabs: ['全部', '在售', '售罄', '已下架'], tabField: function (r) { return r.status; },
  columns: [{ k: 'id', t: '商品ID', w: '8%' }, { k: 'nm', t: '商品名称', w: '16%' },
            { k: 'supplyMode', t: '履约方式', w: '9%' },
            { k: 'stock', t: '可售库存', w: '9%', raw: function (r) {
              if (r.supplyMode === '自有库存') return String(r.stockAvail);
              var sync = r.supSyncStatus === '失败' ? '同步失败' : (r.supInventoryFresh === false ? '缓存过期' : '缓存新鲜');
              return String(r.supInventory == null ? '—' : r.supInventory) +
                '<div class="xsmall muted">' + esc(sync) + ' · ' + esc(r.supInventoryAt || '—') + '</div>';
            } },
            { k: 'stockReserved', t: '已预占', w: '8%', raw: function (r) { return r.supplyMode === '自有库存' ? String(r.stockReserved) : '—'; } },
            { k: 'status', t: '可售状态', w: '9%', sec: true },
            { k: '_src', t: '数据来源', w: '26%', fmt: function (r) {
              return r.supplyMode === '自有库存' ? '自有 CDK 码池（SKU 级）' : '供应商 API 库存快照（非预留）';
            } },
            { k: '_op', t: '操作', w: '15%' }],
  rows: function () { return admGoodsRows(); },
  actions: ['查看'],
  tabAction: function () {
    return '<span class="tag">采购账户可用余额 ¥' + ADM_SUPPLIER_WALLET.available.toFixed(2) + '（' + ADM_SUPPLIER_WALLET.updatedAt + '）</span>' +
      '<span class="tag">安全垫 ' + Math.round(ADM_SUPPLIER_WALLET.bufferRate * 100) + '%</span>' +
      '<span class="tag">库存新鲜期 ' + ADM_SUPPLIER_WALLET.inventoryFreshMinutes + ' 分钟</span>';
  },
  extraActions: [{ n: function (r) { return r.supplyMode === '自有库存' ? '调整库存' : ''; } }],
  drawerTitle: function (r) { return (r.supplyMode === '自有库存' ? '库存与码池 · ' : '同步记录 · ') + r.nm; },
  drawerHead: function (r, rt) {
    if (r.supplyMode !== '自有库存') return '<button class="btn primary sm" type="button" data-act="adm-sync">立即同步</button>';
    return rt.stockEdit ? '<button class="btn primary sm" type="button" data-act="adm-save">保存库存调整</button>' : '';
  },
  drawer: function (r, rt) { return admStockDrawer(r, rt); },
  commitDraft: function (rt) {
    var d = rt.stockDraft;
    if (!d) return null;
    var gd = ADM_GOODS.filter(function (x) { return x.id === d.id; })[0];
    if (!gd) return '库存记录已不存在，请刷新后重试。';
    if (gd.supplyMode !== '自有库存') return 'API 采购商品不占用自有码池，不能手工调整库存。';
    var changed = [];
    Object.keys(d.deltas || {}).forEach(function (sku) {
      if (Number(d.deltas[sku])) changed.push({ sku: sku, delta: Number(d.deltas[sku]) });
    });
    if (!changed.length) return '请至少调整一个 SKU 的库存数量。';
    var reason = String(d.reason || '').replace(/^\s+|\s+$/g, '');
    if (!reason) return '调整原因不能为空。';
    for (var i = 0; i < changed.length; i++) {
      var sku = changed[i].sku, delta = changed[i].delta;
      if (!/^[+-]?\d+$/.test(String(delta))) return '调整数量必须为整数。';
      var pool = gd.skuPool[sku] || 0, res = gd.skuReserved[sku] || 0;
      var next = pool + delta;
      if (next < res) return sku + ' 调整后码池总量不能小于已预占数量（' + res + '）。';
    }
    changed.forEach(function (x) {
      var before = gd.skuPool[x.sku] || 0;
      var next = before + x.delta;
      gd.skuPool[x.sku] = next;
      gd.skuStock[x.sku] = Math.max(0, next - (gd.skuReserved[x.sku] || 0));
      if (x.delta > 0) {
        var exist = (gd.skuCodes[x.sku] || []).length;
        for (var k = 0; k < x.delta; k++) gd.skuCodes[x.sku].push('CD-' + gd.id + '-ADJ-' + String(exist + k + 1).padStart(4, '0'));
      } else if (x.delta < 0) {
        gd.skuCodes[x.sku] = (gd.skuCodes[x.sku] || []).slice(0, next);
      }
      gd.stockLog = gd.stockLog || [];
      gd.stockLog.unshift({ at: '2026-10-22 10:00', op: ADM_ROLE.name, sku: x.sku, delta: x.delta,
        before: before, after: next, reason: reason });
    });
    gd.stock = admGoodsAvailable(gd);
    if (gd.status !== '已下架') gd.status = gd.stock > 0 ? '在售' : '售罄';
    return null;
  },
  afterCommit: function (rt) { rt.stockDraft = null; rt.stockEdit = false; rt.stockCodeSku = ''; }
};

/* ---------- ADM-SEARCH-01 搜索推荐配置 ---------- */

/* 热门商品的商品选择子层（CHG-0077）。
   与首页配置的「选择商品」同一套交互：点「选择商品」打开列表，可按商品名称或 ID 搜索，
   点行选中、右上角「确定」写回草稿。只列在售商品——已下架的商品不应被推荐。 */
function admSrPicker(rt) {
  var q = (rt.srPickQ || '').trim().toLowerCase();
  var list = ADM_GOODS.filter(function (gd) {
    if (gd.status !== '在售') return false;
    return !q || (gd.nm + ' ' + gd.id).toLowerCase().indexOf(q) >= 0;
  });
  return '<div class="adm-mask' + (rt.srPickOpen ? ' on' : '') + '" id="srPickMask" role="dialog" aria-modal="true" aria-label="选择商品">' +
    '<div class="adm-dlg picker"><div class="dt"><span class="strong">选择商品</span>' +
    '<span class="gd-count">共 ' + list.length + ' 个在售商品</span>' +
    '<div class="acts"><button class="btn sm" type="button" data-act="adm-sr-pick-cancel">取消</button>' +
    '<button class="btn primary sm" type="button" data-act="adm-sr-pick-ok"' + (rt.srPickSel ? '' : ' disabled') + '>确定</button>' +
    '<button class="btn mini" type="button" data-act="adm-sr-pick-cancel" aria-label="关闭" title="关闭">✕</button></div></div>' +
    '<div class="db"><div class="hm-srch"><input id="srPickQ" data-sr-pickq="1" placeholder="搜索商品名称或商品ID" value="' + attr(rt.srPickQ || '') + '" aria-label="搜索商品"></div>' +
    '<div>' + admSrPickerRows(rt, list) + '</div></div>' +
    '<div class="df"><span class="xsmall muted" style="margin-right:auto;align-self:center">点击商品行即选中，再点右上角「确定」；关闭不影响已打开的上层弹窗与草稿</span></div>' +
    '</div></div>';
}
function admSrPickerRows(rt, list) {
  return list.length
    ? list.map(function (gd) {
        return '<button class="hm-grow" type="button" data-act="adm-sr-pick-sel" data-goods="' + attr(gd.id) + '"' +
          ' aria-selected="' + (rt.srPickSel === gd.id ? 'true' : 'false') + '">' +
          '<span class="nm">' + esc(gd.nm) + '（' + esc(gd.id) + '）</span>' +
          '<span class="pr">¥' + admGoodsPrice(gd).toFixed(2) + ' 起</span></button>';
      }).join('')
    : '<div class="hm-empty">没有匹配「' + esc(rt.srPickQ) + '」的在售商品。可试试商品名称或商品ID。</div>';
}

ADM_CFG['ADM-SEARCH-01'] = {
  title: '搜索推荐配置', adm: 'ADM-14', perm: 'config',
  sub: '维护搜索发现关键词与搜索热门商品；启用项按配置顺序在前台展示，超出前台展示位的部分不显示（CHG-0075）。',
  filters: [{ k: 'w', label: '关键词 / 商品', type: 'text', ph: '按关键词或商品查询' },
            { k: 'on', label: '状态', type: 'select', opts: ['全部', '启用', '停用'] }],
  tabs: ['搜索发现关键词', '搜索热门商品'],
  customTabs: true,
  /* 页签级动作：新增关键词 / 添加商品（CHG-0075） */
  tabAction: function (rt) {
    var g = rt.tab === '搜索热门商品';
    return '<button class="btn primary sm" type="button" data-act="adm-sr-add">+ ' + (g ? '添加商品' : '新增关键词') + '</button>';
  },
  /* 两个页签都有一列拖拽手柄（CHG-0076）：顺序＝数组顺序，不再有「排序」输入。
     原「近7日点击」列移除——那是编造的模拟值（随排序字段一起失去来源），
     且挤占宽度导致按钮折行；后台这一页只承担配置维护（CHG-0075）。 */
  columns: function () {
    var rt = admRT('ADM-SEARCH-01');
    var drag = { k: '_drag', t: '顺序', w: '8%', raw: function () { return '<button class="grip" type="button" tabindex="-1" aria-hidden="true" title="按住拖拽调整顺序">⣿</button>'; } };
    if (rt.tab === '搜索热门商品') {
      return [drag,
        { k: 'id', t: 'ID', w: '13%' }, { k: 'nm', t: '商品', w: '41%' },
        { k: 'on', t: '状态', w: '13%' }, { k: '_op', t: '操作', w: '25%' }
      ];
    }
    return [drag,
      { k: 'id', t: 'ID', w: '12%' }, { k: 'nm', t: '关键词', w: '41%' },
      { k: 'on', t: '状态', w: '13%' }, { k: '_op', t: '操作', w: '26%' }];
  },
  rows: function () {
    var rt = admRT('ADM-SEARCH-01');
    var src = (rt.tab === '搜索热门商品') ? ADM_SEARCH_GOODS : ADM_SEARCH_KW;
    return src.map(admSearchRow);
  },
  /* 两个页签是两套数据源，各自计数；当前页签用已过滤的行数，另一页签单独算一次 */
  tabCounts: function (rt, rows) {
    var self = ADM_CFG['ADM-SEARCH-01'];
    var g = rt.tab === '搜索热门商品';
    var other = g ? ADM_SEARCH_KW : ADM_SEARCH_GOODS;
    var out = {};
    out[g ? '搜索热门商品' : '搜索发现关键词'] = rows.length;
    out[g ? '搜索发现关键词' : '搜索热门商品'] = admApplyFilters(self, rt, other.map(admSearchRow)).length;
    return out;
  },
  actions: ['编辑'],
  /* 操作栏（CHG-0075／0076）：启用/停用与删除都要二次确认。
     启停虽然可逆，但会直接改变前台可见性，同样需要确认（CHG-0076）。 */
  extraActions: [
    { n: function (r) { return r.on === '启用' ? '停用' : '启用'; }, direct: true, confirmFn: function (r) {
      var isOn = r.on === '启用';
      return isOn
        ? {
            title: '确认停用该配置？', ok: '确认停用', tone: 'danger',
            body: '停用后该条配置不再在前台展示，配置本身保留，可随时重新启用。',
            obj: r.nm + '（' + r.id + '）　当前状态：启用',
            note: '停用立即生效，无需额外保存。'
          }
        : {
            title: '确认启用该配置？', ok: '确认启用', tone: 'normal',
            body: '启用后该条配置按当前顺序在前台展示；超出展示位的部分仍不显示。',
            obj: r.nm + '（' + r.id + '）　当前状态：停用',
            note: '启用立即生效，无需额外保存。'
          };
    } },
    { n: '删除', direct: true, confirmFn: function (r) {
      return {
        title: '确认删除该配置？', ok: '确认删除', tone: 'danger',
        body: '删除后该条配置从列表中移除，前台不再展示；不影响商品本身与其他配置。',
        obj: r.nm + '（' + r.id + '）　当前状态：' + r.on,
        note: '删除立即生效，无需额外保存。'
      };
    } }
  ],
  /* 两个页签的行都可拖拽排序（CHG-0076）：数组顺序即前台展示顺序，不再维护排序值 */
  rowAttrs: function (r) {
    return ' data-sr-item="' + attr(r.id) + '" draggable="true"';
  },
  drawerTitle: function (r, rt) {
    var g = rt && rt.tab === '搜索热门商品';
    if (r.id === '__new__') return g ? '添加商品' : '新增关键词';
    return (g ? '编辑热门商品 · ' : '编辑关键词 · ') + r.nm;
  },
  drawerMeta: function (rt, row) {
    var d = rt.srDraft;
    if (d && d.id === '__new__') return '记录ID：保存后分配';
    return '记录ID：' + (d ? d.id : '—');
  },
  /* 新增模式：列表里还没有这条记录，给一行占位让弹窗能正常渲染 */
  draftRow: function (rt) {
    var d = rt.srDraft;
    if (!d || d.id !== '__new__') return null;
    return { id: '__new__', nm: rt.tab === '搜索热门商品' ? '商品' : '关键词', on: d.on || '启用' };
  },
  drawerHead: function () { return '<button class="btn primary sm" type="button" data-act="adm-save">保存</button>'; },
  overlay: function (rt) { return admSrPicker(rt); },
  drawer: function (r, rt) {
    var d = rt.srDraft || {};
    if (rt.tab === '搜索热门商品') {
      var gd = ADM_GOODS.filter(function (g) { return g.id === d.gid; })[0];
      return '<div class="row"><span class="small muted" style="width:70px;flex:none">商品</span>' +
          '<span class="small" style="flex:1;min-width:0">' +
            (gd ? esc(gd.nm) + '（' + esc(gd.id) + '）' : '<span class="muted">未选择商品</span>') +
          '</span>' +
          '<button class="btn sm" type="button" data-act="adm-sr-pick-open" style="flex:none">选择商品</button></div>' +
        '<div class="xsmall muted" style="margin-top:8px">前台按本列表顺序展示；超出展示位的配置不显示。</div>' +
        '<div class="hint">搜索热门商品不建设实时热榜，由运营手工维护（ADM-14、SEARCH-04）。同一商品不能重复添加；商品不区分规格。</div>';
    }
    return '<div class="row"><span class="small muted" style="width:70px;flex:none">关键词</span>' +
        '<input class="inp" data-sr-kw="1" data-adm-req="关键词" style="min-height:40px;flex:1" value="' + attr(d.w || '') + '" aria-label="关键词" placeholder="如：孤刃"></div>' +
      '<div class="xsmall muted" style="margin-top:8px">前台按本列表顺序展示；超出展示位的配置不显示。</div>' +
      '<div class="hint">关键词点击后执行搜索（SEARCH-04）。竞品的关键词联想、拼音检索与换一批为首期候选能力，是否纳入另定（SEARCH-05、TBD-15）。</div>';
  },
  commitDraft: function (rt) {
    var d = rt.srDraft;
    if (!d) return null;
    var isG = rt.tab === '搜索热门商品';
    var list = isG ? ADM_SEARCH_GOODS : ADM_SEARCH_KW;
    if (isG) {
      if (!d.gid) return '请选择商品。';
      var dup = list.filter(function (x) { return x.gid === d.gid && x.id !== d.id; })[0];
      if (dup) return '该商品已在热门列表中，不能重复添加。';
    } else {
      var w = String(d.w || '').replace(/^\s+|\s+$/g, '');
      if (!w) return '关键词不能为空。';
      if (w.length > 20) return '关键词不能超过 20 个字符。';
      var dup2 = list.filter(function (x) { return x.w === w && x.id !== d.id; })[0];
      if (dup2) return '关键词「' + w + '」已存在。';
      d.w = w;
    }
    if (d.id === '__new__') {
      /* 新编号取当前最大序号 +1；已有同号则继续往后找，避免删过再建时撞号 */
      var pre = isG ? 'RG-' : 'KW-', seq = 0;
      list.forEach(function (x) { var n = parseInt(String(x.id).replace(/\D+/g, ''), 10) || 0; if (n > seq) seq = n; });
      do { seq++; } while (list.filter(function (x) { return x.id === pre + ('0' + seq).slice(-2); }).length);
      var nid = pre + ('0' + seq).slice(-2);
      list.push(isG ? { id: nid, gid: d.gid, on: '启用' }
                    : { id: nid, w: d.w, on: '启用' });
    } else {
      var rec = list.filter(function (x) { return x.id === d.id; })[0];
      if (!rec) return '该记录已不存在，请刷新后重试。';
      if (isG) { rec.gid = d.gid; } else { rec.w = d.w; }
    }
    return null;
  },
  afterCommit: function (rt) { rt.srDraft = null; rt.srPickOpen = false; rt.srPickQ = ''; rt.srPickSel = ''; }
};


/* 用户信息弹窗（CHG-0078）：列表与详情里的「用户名称」都可点开。
   原型只存脱敏手机号；完整号码的查看需权限并留痕（ADM-10），这里是演示数据。 */
function admOrderUserCard(rt) {
  var o = ADM_ORDERS.filter(function (x) { return x.no === rt.userOrderNo; })[0];
  if (!o) return '';
  return '<div class="adm-mask' + (rt.userOpen ? ' on stacked' : '') + '" id="orderUserMask" role="dialog" aria-modal="true" aria-label="用户信息">' +
    '<div class="adm-dlg picker" style="max-width:440px"><div class="dt"><span class="strong">用户信息</span>' +
    '<span class="adm-meta">来源订单：' + esc(o.no) + '</span>' +
    '<div class="acts"><button class="btn mini" type="button" data-act="adm-order-user-close" aria-label="关闭" title="关闭">✕</button></div></div>' +
    '<div class="db"><table class="admin-table"><tbody>' +
      '<tr><th style="width:30%">用户名称</th><td>' + esc(o.buyer) + '</td></tr>' +
      '<tr><th>用户ID</th><td>' + esc(o.buyerId) + '</td></tr>' +
      '<tr><th>联系方式</th><td>' + esc(o.phone) + '</td></tr>' +
      '<tr><th>来源平台</th><td>' + esc(o.platform) + '</td></tr>' +
    '</tbody></table>' +
    '<div class="hint">手机号为脱敏展示；完整号码仅对有权限的角色可见，查看行为留痕（ADM-10）。用户以「来源平台＋平台用户ID」识别，不因手机号相同合并。</div>' +
    '</div></div></div>';
}

/* 口令码脱敏：交付明细里不展示完整内容（CODE-08） */
function maskCode(c) {
  var s = String(c || '');
  if (!s) return '—';
  return s.length > 8 ? s.slice(0, 4) + '••••' + s.slice(-4) : s.slice(0, 2) + '••••';
}

/* 订单退款：仅待发货/已完成订单可用；原因必填；提交前二次确认。 */
function admOrderRefundDrawer(r, rt) {
  var d = (rt && rt.refundDraft) || { reason: '' };
  var err = (rt && rt.refundErr) || '';
  return '<div class="xsmall" style="color:#6b7280">退款为敏感操作：需填写具体原因，提交前会二次确认；资金结果以渠道回执为准，本原型为模拟。</div>' +
    '<table class="admin-table" style="margin-top:8px"><tbody>' +
    '<tr><th style="width:26%">订单号</th><td>' + esc(r.no) + '</td></tr>' +
    '<tr><th>用户</th><td>' + esc(r.buyer) + '（用户ID：' + esc(r.buyerId) + '）</td></tr>' +
    '<tr><th>商品 / 规格</th><td>' + esc(r.goods) + ' / ' + esc(r.spec) + '</td></tr>' +
    '<tr><th>订单状态</th><td>支付：' + esc(r.pay) + '　交付：' + esc(r.deliver) + (r.refundStatus ? '　退款：' + esc(r.refundStatus) : '') + '</td></tr>' +
    '<tr><th>退款金额</th><td>' + CNY(r.amount) + '（本期只支持按实付金额全额退款；部分退款不展开）</td></tr>' +
    (r.deliver === '已交付' ? '<tr><th>交付联动</th><td>该订单已交付口令码。已交付码的退款由人工协商处理，无需上游确认；退款完成后前台不再展示有效口令码，运营在记录中备注该码是否作废（REQ-14）。</td></tr>' : '') +
    '</tbody></table>' +
    '<div class="col" style="gap:8px;margin-top:10px">' +
    '<div class="row"><span class="small muted" style="width:96px;flex:none">退款原因<span style="color:var(--error)">*</span></span>' +
    '<input class="inp" data-refund-reason="1" value="' + attr(d.reason) + '" style="min-height:40px;flex:1" placeholder="必填，如：用户反馈口令码无法激活且无法补发" aria-label="退款原因"></div>' +
    (err ? '<div class="xsmall" style="color:#a33b3b">' + esc(err) + '</div>' : '') +
    '<div class="xsmall" style="color:#6b7280">提交后进入退款处理；不得仅改订单状态而未确认资金退回（8.3）。</div>' +
    '</div>';
}

/* 上游 HIgame 发货信息（CHG-0090）：只展示过程与结果，不展示完整 CDK。 */
function admOrderSupInfo(r) {
  if (r.type !== '口令码') {
    return '<div class="xsmall" style="color:#6b7280">好友赠送为人工交付，不调用上游自动发货接口。</div>';
  }
  var rows = [
    ['上游订单号', r.supOrderId || '—'],
    ['上游状态', r.supStatus || '—'],
    ['返回码', r.supCode || '—'],
    ['请求时间', r.supReqAt || '—'],
    ['上游采购单号', r.supBuyOrderId || '—'],
    ['货源类型', r.supStockClass || '—'],
    ['采购成本', (r.supCost === '' || r.supCost == null) ? '—' : CNY(r.supCost)],
    ['CDK来源', r.cdkSource || '—'],
    ['人工核查', (r.manualOp && r.manualOp !== '—') ? (r.manualOp + ' / ' + r.manualAt) : '—']
  ];
  var html = '<table class="admin-table" style="margin-top:6px"><tbody>' +
    rows.map(function (x) {
      return '<tr><th style="width:26%">' + esc(x[0]) + '</th><td>' + esc(x[1]) + '</td></tr>';
    }).join('') + '</tbody></table>';
  if (r.supMsg) html += '<div class="xsmall" style="color:#6b7280;margin-top:6px">' + esc(r.supMsg) + '</div>';
  if (r.supStatus === '结果未知' || r.supStatus === '已处理待取码' || r.supStatus === '明确失败') {
    html += '<div class="xsmall" style="color:#a33b3b;margin-top:6px">上游 API 不支持按订单号查询；请登录 HIgame 后台按上游订单号核查，禁止自动重试。</div>';
  }
  return html;
}

/* ---------- ADM-ORDER-01 订单管理 ---------- */
ADM_CFG['ADM-ORDER-01'] = {
  title: '订单管理', adm: 'ADM-05', perm: 'query',
  sub: '按订单号、平台、商品、时间、支付及交付状态查询，查看明细；上游自动发货信息只读留存，不在本页做人工核查/补录（CHG-0092）。订单管理只保留订单数据与低频退款，人工处理异常交付请到「口令码交付」。订单状态按允许的业务动作更新，不提供任意跳转或直接修改付款结果的通用功能（9.2）。',
  filters: [{ k: 'no', label: '订单号', type: 'text', ph: '支持订单号查询' },
            { k: 'type', label: '交付类型', type: 'select', opts: ['全部', '口令码', '好友赠送'] },
            { k: 'platform', label: '来源平台', type: 'select', opts: ['全部'].concat(ADM_PLATFORMS) },
            { k: 'goods', label: '商品', type: 'text', ph: '按商品名称查询' }],
  advanced: [{ k: 'pay', label: '支付状态', type: 'select', opts: ['全部', '已支付', '待支付'] },
             { k: 'code', label: '口令码交付', type: 'select', opts: ['全部', '未启动', '发码中', '已交付', '交付异常', '—'] },
             { k: 'gift', label: '好友赠送', type: 'select', opts: ['全部', '待处理', '处理中', '已完成', '异常', '—'] },
             { k: 'time', label: '下单时间（区间）', type: 'date' }],
  /* 页签按订单展示状态：待支付 / 待发货 / 已完成 / 已退款 / 已关闭 */
  tabs: ADM_PAY_TABS, tabField: function (r) { return r.state; },
  batch: true, export: true,
  /* 指标卡移除（CHG-0078 评审：页面不需要展示红框内的四个汇总指标） */
  /* 导出说明：除列表字段外，额外带出好友赠送链接，供运营交付处理（CHG-0078） */
  exportNote: '导出字段＝列表字段（订单号、用户名称、商品、实付金额、支付状态、交付、下单时间）＋「好友赠送链接」；口令码订单该列为空。',
  /* 主列表 8 列：新增「用户名称」（可点击查看用户信息，CHG-0078）；
     来源平台移到详情与筛选，不再占用主列（标准 7.6.2：按字段优先级组织主列与详情） */
  columns: [{ k: 'no', t: '订单号', w: '18%', raw: function (r) {
              /* 订单号固定 18 位，列宽不够时省略而不是折行（折行会把行高撑到两倍） */
              return '<span class="ellip" title="' + attr(r.no) + '">' + esc(r.no) + '</span>';
            } },
            { k: '_buyer', t: '用户名称', w: '15%', raw: function (r) {
              return '<button class="btn-link ellip" type="button" data-act="adm-order-user" data-row="' + attr(r.no) + '" title="' + attr('查看用户信息：' + r.buyer) + '">' + esc(r.buyer) + '</button>';
            } },
            { k: 'goods', t: '商品', w: '21%' },
            { k: 'amount', t: '实付', w: '11%', fmt: function (r) { return r.amount.toFixed(2); } },
            { k: 'pay', t: '支付状态', w: '11%' },
            /* 交付列只展示「已交付 / 未交付」；未支付的订单统一为「—」；退款中加标记（CHG-0096） */
            { k: 'deliver', t: '交付', w: '13%', raw: function (r) {
              return esc(r.deliver) + (r.refundStatus === '退款中' ? '<div class="xsmall" style="color:var(--warn)">退款中</div>' : '');
            } },
            { k: 'time', t: '下单时间', w: '11%', sec: true },
            { k: '_op', t: '操作', w: '11%' }],
  rows: function () { return ADM_ORDERS; },
  actions: ['查看'],
  /* 退款只对待发货/已完成订单展示；退款中改为「退款完成」直行动作（CHG-0096）。 */
  extraActions: [
    { n: function (r) {
      return ((r.state === '待发货' || r.state === '已完成') && !r.refundStatus) ? '退款' : '';
    } },
    { n: function (r) { return r.refundStatus === '退款中' ? '退款完成' : ''; },
      direct: true, confirmFn: function (r) {
        return {
          title: '确认退款已完成？', ok: '确认退款完成', tone: 'warning',
          body: '确认后订单转为「已退款」，前台不再展示有效口令码；请先核对原支付渠道回执，不能只改状态。',
          obj: r.no + '　退款金额：' + CNY(r.amount) + '　原因：' + (r.refundReason || '—'),
          note: '全额退款；部分退款本期不展开。原型为模拟。'
        };
      } }
  ],
  overlay: function (rt) { return admOrderUserCard(rt); },
  drawerTitle: function (r, rt) {
    return (rt && rt.refundMode) ? '订单退款 · ' + r.no : '订单详情 · ' + r.no;
  },
  drawerHead: function (r, rt) {
    if (rt && rt.refundMode) {
      return '<button class="btn primary sm" type="button" data-act="adm-refund-submit">提交退款</button>';
    }
    return '<button class="btn sm" type="button" data-act="adm-export">导出当前结果</button>';
  },
  drawer: function (r, rt) {
    if (rt && rt.refundMode) return admOrderRefundDrawer(r, rt);
    return '<div class="row wrap" style="gap:6px"><span class="tag">支付：' + esc(r.pay) + '</span>' +
      '<span class="tag">交付：' + esc(r.deliver) + '</span>' +
      (r.type === '好友赠送' ? '<span class="tag">赠送处理：' + esc(r.gift) + '</span>' : '') +
      (r.refundStatus ? '<span class="tag">退款：' + esc(r.refundStatus) + '</span>' : '') + '</div>' +
      '<div class="hint">支付与交付状态分别记录，不把"已付款"等同于"已交付"；已支付未交付为待发货，已交付为已完成（CHG-0096）。</div>' +
      '<table class="admin-table" style="margin-top:8px"><tbody>' +
      '<tr><th style="width:26%">订单号</th><td>' + esc(r.no) + '</td></tr>' +
      '<tr><th>订单状态</th><td>' + esc(r.state) + (r.state === '已关闭' ? '　原因：' + esc(r.closeReason || '超时未支付') + '　关闭时间：' + esc(r.closedAt || '—') : '') + '</td></tr>' +
      '<tr><th>用户</th><td>' + esc(r.buyer) + '（用户ID：' + esc(r.buyerId) + '）　' + esc(r.phone) +
        '　<button class="btn mini" type="button" data-act="adm-order-user" data-row="' + attr(r.no) + '">查看用户信息</button></td></tr>' +
      '<tr><th>来源平台</th><td>' + esc(r.platform) + '（按来源平台＋平台用户ID识别，不因手机号相同合并）</td></tr>' +
      '<tr><th>商品 / 规格</th><td>' + esc(r.goods) + ' / ' + esc(r.spec) + ' ×1</td></tr>' +
      '<tr><th>实付金额 / 渠道</th><td>' + CNY(r.amount) + ' / ' + esc(r.channel) + '</td></tr>' +
      '<tr><th>成交快照</th><td>成交价格、规格、交付规则及协议版本已快照保存，运营修改不覆盖历史信息（CHECKOUT-05）</td></tr>' +
      '<tr><th>好友链接</th><td class="brk">' + esc(r.friend) + (r.type === '好友赠送' ? '　<span class="xsmall muted">付款后不允许普通编辑（9.2）</span>' : '') + '</td></tr>' +
      '<tr><th>口令码</th><td>' + (r.code === '已交付'
        ? '已交付 · 需"查看口令码"权限，查看行为留痕（CODE-08、ADM-10）'
        : esc(r.code)) + '</td></tr>' +
      '<tr><th>通知记录</th><td>站内信任务见"通知记录"模块 <button class="btn mini" data-act="adm-goto" data-goto="ADM-NOTIFY-01">前往查看</button></td></tr>' +
      (r.refundStatus ? '<tr><th>退款</th><td>' + esc(r.refundStatus) + '　原因：' + esc(r.refundReason) + '　操作人/时间：' + esc(r.refundOp) + ' / ' + esc(r.refundAt) + '</td></tr>' : '') +
      '</tbody></table>' +
      '<div class="strong small" style="margin-top:14px">上游发货信息</div>' +
      admOrderSupInfo(r) +
      '';
  }
};
