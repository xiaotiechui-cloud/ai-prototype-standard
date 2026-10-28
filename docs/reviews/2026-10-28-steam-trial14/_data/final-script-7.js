
/* ============================================================
   ADM 后台画布渲染（标准 7.6.1 / 7.6.2 / 7.6.3）
   ============================================================ */
/* ---------- 后台侧边菜单（CHG-0054）---------- */
/* 16×16 线性图标，内联 SVG，不引外部依赖；stroke 取 currentColor，随文字与选中态变色。 */
var ADM_ICONS = {
  'ADM-HOME-01': '<path d="M2.4 6.9 8 2.3l5.6 4.6v7.2H10V9.9H6v4.2H2.4z"/>',
  'ADM-GOODS-01': '<path d="M8 1.9 13.8 5v6L8 14.1 2.2 11V5z"/><path d="M2.2 5 8 8.1 13.8 5"/><path d="M8 8.1v6"/>',
  'ADM-SEARCH-01': '<circle cx="7" cy="7" r="4.6"/><path d="M10.4 10.4 13.8 13.8"/>',
  'ADM-ORDER-01': '<path d="M4.2 1.9h7.6v12.2H4.2z"/><path d="M6.3 5.3h3.4M6.3 7.8h3.4M6.3 10.3h2.2"/>',
  'ADM-GIFT-01': '<path d="M2.4 5h11.2v2.5H2.4zM3.5 7.5h9v6.6h-9z"/><path d="M8 5v9.1"/>' +
    '<path d="M8 4.9S6.8 2.2 5.5 2.7C4.4 3.2 5.3 4.9 8 4.9M8 4.9s1.2-2.7 2.5-2.2C11.6 3.2 10.7 4.9 8 4.9"/>',
  'ADM-CODE-01': '<circle cx="10.2" cy="5.8" r="2.7"/><path d="M8.3 7.7 2.5 13.5"/><path d="M4.6 11.4l1.4 1.4M6.2 9.8l1.4 1.4"/>',
  'ADM-NOTIFY-01': '<path d="M12.3 10.7H3.7l1-1.6V6.7a3.3 3.3 0 0 1 6.6 0v2.4z"/><path d="M6.6 10.7a1.4 1.4 0 0 0 2.8 0"/>',
  'ADM-REFUND-01': '<path d="M2.6 6.3h7.2a3.4 3.4 0 0 1 0 6.8H6.1"/><path d="M5.2 3.5 2.4 6.3l2.8 2.8"/>',
  'ADM-PAYCHK-01': '<path d="M1.9 4.2h12.2v7.6H1.9z"/><path d="M1.9 6.8h12.2"/><path d="M4.3 9.6h3"/>',
  'ADM-AGREE-01': '<path d="M3.8 1.9h5.6l3 3v9.2H3.8z"/><path d="M9.4 1.9v3h3"/><path d="M6.1 9.2l1.4 1.4 2.6-2.7"/>',
  'ADM-SERVICE-01': '<path d="M2.9 9.8V8a5.1 5.1 0 0 1 10.2 0v1.8"/><path d="M2.9 9.4h1.9v3.3H2.9zM11.2 9.4h1.9v3.3h-1.9z"/>' +
    '<path d="M13.1 12.7v.4a1.6 1.6 0 0 1-1.6 1.6H8.7"/>',
  'ADM-RBAC-01': '<path d="M8 2 3.2 3.9v4.4c0 2.6 2 4.7 4.8 5.8 2.8-1.1 4.8-3.2 4.8-5.8V3.9z"/>' +
    '<path d="M6 8.1l1.5 1.5 2.6-2.8"/>',
  'ADM-AUDIT-01': '<path d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12"/><path d="M8 5.2V8.4l2.2 1.3"/>',
  'ADM-STAT-01': '<path d="M2.4 13.6h11.2"/><path d="M4.6 13.6V9.2M8 13.6V4.6M11.4 13.6V10.4"/>'
};

function admIcon(id) {
  var d = ADM_ICONS[id];
  if (!d) d = '<path d="M3 3h10v10H3z"/>';
  return '<svg class="sb-ic" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor"' +
    ' stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
}

/* 菜单角标＝该模块的「待处理」条数。全部取自各页面已在用的模拟数据，不新增接口。
   角标是导航提示，不代表权限范围，也不改变各页自身的筛选口径。 */
function admBadges() {
  function cnt(arr, f) { return arr.filter(f).length; }
  var b = {};
  b['ADM-ORDER-01'] = cnt(ADM_ORDERS, function (o) { return o.pay === '待支付' || o.pay === '确认中'; });
  b['ADM-GIFT-01'] = cnt(ADM_GIFT_ROWS, function (o) { return o.gift === '待处理' || o.gift === '处理中'; });
  b['ADM-CODE-01'] = cnt(ADM_CODE_ROWS, function (o) { return o.code === '交付异常'; });
  b['ADM-NOTIFY-01'] = cnt(ADM_NOTIFY_ROWS, function (o) { return o.nstat === '发送失败'; });
  b['ADM-REFUND-01'] = cnt(ADM_REFUND_ROWS, function (o) { return o.stat === '待审核' || o.stat === '退款中'; });
  return b;
}

function admSidebar(activeId) {
  var badges = admBadges();
  var closed = RV.admClosedGroups || [];

  /* 先按分组收集，再渲染——避免边拼串边开关标签。
     这里**不做**关键词过滤：过滤统一交给 admApplyMenuFilter() 在 DOM 上做，
     否则渲染态与输入态两套规则会各写一遍、迟早分叉（CHG-0054）。 */
  var groups = [];
  ADM_MENU.forEach(function (m) {
    if (m.g) { groups.push({ g: m.g, items: [] }); return; }
    if (!groups.length) groups.push({ g: '', items: [] });
    groups[groups.length - 1].items.push(m);
  });

  function item(m) {
    var nb = badges[m.id];
    return '<button class="sb-item" type="button" data-act="go" data-to="' + m.id +
      '" data-key="' + attr((m.n + ' ' + (m.adm || '')).toLowerCase()) +
      '" title="' + attr(m.n) + (nb ? '（待处理 ' + nb + '）' : '') +
      '" aria-pressed="' + (m.id === activeId ? 'true' : 'false') + '">' +
      admIcon(m.id) + '<span class="sb-label">' + esc(m.n) + '</span>' +
      (nb ? '<span class="sb-badge" aria-label="待处理 ' + nb + '">' + nb + '</span>' : '') + '</button>';
  }

  var nav = '<div class="sb-nav">';
  groups.forEach(function (grp) {
    var open = closed.indexOf(grp.g) < 0;
    if (grp.g) {
      nav += '<button class="sb-group" type="button" data-act="sb-group" data-g="' + attr(grp.g) +
        '" aria-expanded="' + (open ? 'true' : 'false') + '"><span>' + esc(grp.g) +
        '</span><span class="sb-caret" aria-hidden="true"></span></button>';
    }
    nav += '<div class="sb-groupbody" data-open="' + (open ? '1' : '0') + '" data-g="' + attr(grp.g) + '"' +
      (open ? '' : ' hidden') + '>' + grp.items.map(item).join('') + '</div>';
  });
  nav += '<div class="sb-empty" hidden>没有匹配的菜单。<br>可试试模块名或模块编号（如 ADM-05）。</div>';
  nav += '</div>';

  var brand = '<div class="sb-brand"><span class="sb-mark" aria-hidden="true">商</span>' +
    '<span class="sb-brand-t">商城运营后台</span>' +
    '<button class="sb-collapse" type="button" data-act="sb-collapse" aria-pressed="' +
    (RV.admCollapsed ? 'true' : 'false') + '" aria-label="' + (RV.admCollapsed ? '展开侧边栏' : '收起侧边栏') +
    '" title="' + (RV.admCollapsed ? '展开侧边栏' : '收起侧边栏') + '">' + (RV.admCollapsed ? '»' : '«') + '</button></div>';

  var search = '<div class="sb-search"><input id="admMenuQ" type="text" autocomplete="off" ' +
    'placeholder="搜索菜单…" aria-label="搜索菜单" value="' + attr(RV.admMenuQ || '') + '"></div>';

  return C('ADM-COMMON-C01', brand + search + nav, 'aside',
    'admin-sidebar' + (RV.admCollapsed ? ' collapsed' : ''));
}
function admTopbar(page) {
  /* 顶部栏只放账号信息与退出；页面编号、模拟环境等评审信息放在画布外的评审区 */
  return C('ADM-COMMON-C02',
    '<span class="grow"></span>' +
    '<span class="small">' + esc(ADM_ROLE.name) + '（' + esc(ADM_ROLE.role) + '）</span>' +
    '<span class="tag">数据范围：' + esc(ADM_ROLE.platform) + '</span>' +
    '<button class="btn mini" type="button" data-act="adm-logout">退出</button>', 'div', 'admin-topbar');
}
/* 删除等破坏性操作的二次确认层（CHG-0060）。挂在后台外壳上，任何后台页都能用：
   点击带 data-confirm 的按钮时不直接执行，先把动作与参数暂存到 rt.confirm，弹出本层；
   用户点「确认」才真正执行原动作。 */
function admConfirmBox(pageId) {
  var rt = admRT(pageId), cf = rt.confirm;
  if (!cf) return '';
  return '<div class="adm-mask on top" id="admConfirm" role="dialog" aria-modal="true" aria-label="操作确认">' +
    '<div class="adm-dlg confirm"><div class="dt"><span class="strong">' + esc(cf.title) + '</span></div>' +
    '<div class="db">' + esc(cf.body) +
    (cf.obj ? '<div class="obj">对象：' + esc(cf.obj) + '</div>' : '') +
    '<div class="obj">' + esc(cf.note || '此操作在原型中即时作用于当前草稿；保存配置后才对线上生效。') + '</div></div>' +
    '<div class="df"><button class="btn sm" type="button" data-act="adm-confirm-cancel">取消</button>' +
    '<button class="btn sm ' + (cf.tone === 'normal' ? 'primary' : 'danger') + '" type="button" data-act="adm-confirm-ok">' + esc(cf.ok) + '</button></div>' +
    '</div></div>';
}
/* 操作结果浮层：由 rt.toast 驱动，约 3 秒后自动消失。
   与评审外壳的 #flash 是两回事——那个在说明列里，评审者看画布时看不到。 */
function admToastBox(pageId) {
  var rt = admRT(pageId);
  if (!rt.toast) return '';
  return '<div class="adm-toast' + (rt.toastKind === 'err' ? ' err' : '') + '" role="status" aria-live="polite">' +
    esc(rt.toast) + '</div>';
}
function admWrap(page, content) {
  return admSidebar(page.id) + '<div class="admin-main">' + admTopbar(page) +
    '<div class="admin-content">' + content + '</div></div>' + admConfirmBox(page.id) + admToastBox(page.id);
}
function admField(f, rt) {
  var v = rt.draft[f.k] === undefined ? admVal(rt, f.k) : rt.draft[f.k];
  var id = 'flt-' + f.k;
  if (f.type === 'select') {
    return '<label class="fld"><span>' + esc(f.label) + '</span><select id="' + id + '" data-flt="' + attr(f.k) + '">' +
      f.opts.map(function (o) { return '<option' + (String(o) === String(v) ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') +
      '</select></label>';
  }
  if (f.type === 'date') {
    var from = rt.draft[f.k + '_from'] === undefined ? admVal(rt, f.k + '_from') : rt.draft[f.k + '_from'];
    var to = rt.draft[f.k + '_to'] === undefined ? admVal(rt, f.k + '_to') : rt.draft[f.k + '_to'];
    return '<label class="fld"><span>' + esc(f.label) + '（起）</span><input id="' + id + '-from" data-flt="' + attr(f.k) + '_from" type="date" value="' + attr(from) + '"></label>' +
      '<label class="fld"><span>' + esc(f.label) + '（止）</span><input id="' + id + '-to" data-flt="' + attr(f.k) + '_to" type="date" value="' + attr(to) + '"></label>';
  }
  return '<label class="fld"><span>' + esc(f.label) + '</span><input id="' + id + '" data-flt="' + attr(f.k) +
    '" value="' + attr(v) + '" placeholder="' + attr(f.ph || '') + '"></label>';
}
function admFilters(cfg, rt) {
  var shown = cfg.filters || [];
  var adv = (cfg.advanced || []);
  var advVisible = rt.advOpen;
  var html = '<div class="admin-filter-grid">' + shown.map(function (f) { return admField(f, rt); }).join('');
  if (adv.length && advVisible) html += adv.map(function (f) { return admField(f, rt); }).join('');
  html += '<div class="admin-filter-actions">' +
    '<button class="btn primary sm" type="button" data-act="adm-query">查询</button>' +
    '<button class="btn sm" type="button" data-act="adm-reset">重置</button>' +
    (adv.length ? '<button class="btn sm" type="button" data-act="adm-adv" aria-pressed="' + (rt.advOpen ? 'true' : 'false') + '">' +
      (rt.advOpen ? '收起高级筛选' : '高级筛选（' + adv.length + '）') + '</button>' : '') +
    '<button class="btn sm" type="button" data-act="adm-refresh">刷新</button>' +
    (cfg.export ? '<button class="btn sm" type="button" data-act="adm-export">导出当前结果</button>' : '') +
    '<span class="xsmall muted rv-annot" style="align-self:center">输入或选择先更新草稿；点击"查询"或按 Enter 才提交。提交时自动去除首尾空格。</span>' +
    '</div></div>';
  var committedNote = '';
  var cks = Object.keys(rt.committed).filter(function (k) { return rt.committed[k] !== '' && rt.committed[k] !== undefined && rt.committed[k] !== '全部'; });
  if (cks.length) {
    committedNote = '<div class="xsmall muted rv-annot" style="margin-top:6px">已提交条件：' +
      cks.map(function (k) { return esc(k) + '=' + esc(rt.committed[k]); }).join('　') + '　（重置将清除全部普通与高级条件）</div>';
  }
  return C('ADM-COMMON-C03', html + committedNote, 'div', 'card flat');
}
function admTabs(cfg, rt, counts) {
  var tabs = cfg.tabs || ['全部'];
  /* 单页签或自定义页签（customTabs）时 rt.tab 的默认值「全部」可能不在列表里：
     显示上回落到第一个页签，避免一个都没有选中态（CHG-0081）。 */
  var cur = tabs.indexOf(rt.tab) >= 0 ? rt.tab : tabs[0];
  /* 页签右侧的动作位（CHG-0075）：用于「新增关键词 / 添加商品」这类页签级操作。
     单独放在 .admin-tabs 之外——否则会继承页签按钮的透明背景与下边框。 */
  var act = cfg.tabAction ? '<div class="admin-tabs-act">' + cfg.tabAction(rt, counts) + '</div>' : '';
  return C('ADM-COMMON-C04',
    '<div class="admin-tabs-row"><div class="admin-tabs">' + tabs.map(function (t) {
      var n = counts[t] === undefined ? '' : '（' + counts[t] + '）';
      return '<button type="button" data-act="adm-tab" data-tab="' + attr(t) + '" aria-pressed="' + (cur === t ? 'true' : 'false') + '">' +
        esc(t) + n + '</button>';
    }).join('') + '</div>' + act + '</div>' +
    '<div class="xsmall muted rv-annot">页签即时查询；计数与列表同源（其他已提交筛选条件下各状态的数量）。</div>', 'div', '');
}
function admTable(cfg, rt, rows) {
  var cols = typeof cfg.columns === 'function' ? cfg.columns() : cfg.columns;
  var head = '<tr>' + (cfg.batch ? '<th class="select-col" style="width:5%"><input type="checkbox" data-act="adm-selall" aria-label="全选当前页"' +
    (rows.length && rt.sel.length === rows.length ? ' checked' : '') + '></th>' : '') +
    /* 未给 w 的列交给浏览器平分剩余宽度（table-layout:fixed） */
    cols.map(function (c) { return '<th' + (c.sec ? ' class="sec"' : '') + (c.w ? ' style="width:' + c.w + '"' : '') + '>' + esc(c.t) + '</th>'; }).join('') + '</tr>';
  var body = rows.map(function (r) {
    var rid = r.id || r.no || r.nid;
    var selected = rt.sel.indexOf(rid) >= 0;
    var cells = cols.map(function (c) {
      if (c.k === '_op') {
        /* 操作列两类按钮（CHG-0066）：
           entry  ——「编辑」/「查看」，打开独立弹窗完成编辑或查看；
           direct —— 标注 direct 的动作（上架/下架、手动同步、重试等）就地执行，不打开弹窗。 */
        var btns = (cfg.actions || []).map(function (n) { return { n: n, act: 'adm-rowact' }; });
        (cfg.extraActions || []).forEach(function (a) {
          /* n 支持函数：同一个按钮按行显示「启用」或「停用」（CHG-0075） */
          var nmA = (typeof a.n === 'function' ? a.n(r) : a.n);
          if (!nmA) return;          // 该行不适用这个动作（如已完成的赠送不再给「标记完成」）
          var b = { n: nmA, act: a.direct ? 'adm-rowdo' : 'adm-rowact' };
          /* confirmFn 按当前行算文案（上架与下架的标题、说明、按钮都不同）；
             confirm 为固定文案。两者都给按钮挂上统一的二次确认层。 */
          if (typeof a.confirmFn === 'function') b.cf = a.confirmFn(r);
          else if (a.confirm) b.cf = { body: a.confirm, title: a.confirmTitle, obj: a.confirmObj, ok: a.confirmOk, note: a.confirmNote, tone: a.confirmTone };
          btns.push(b);
        });
        return '<td>' + btns.map(function (b) {
          var cf = '';
          if (b.cf) {
            cf = ' data-confirm="' + attr(b.cf.body || '') + '"' +
              (b.cf.title ? ' data-confirm-title="' + attr(b.cf.title) + '"' : '') +
              (b.cf.obj ? ' data-confirm-obj="' + attr(b.cf.obj) + '"' : '') +
              (b.cf.ok ? ' data-confirm-ok="' + attr(b.cf.ok) + '"' : '') +
              (b.cf.note ? ' data-confirm-note="' + attr(b.cf.note) + '"' : '') +
              (b.cf.tone ? ' data-confirm-tone="' + attr(b.cf.tone) + '"' : '');
          }
          return '<button class="btn mini" type="button" data-act="' + b.act + '" data-row="' + attr(rid) + '" data-rn="' + attr(b.n) + '"' + cf + ' style="margin:0 4px 4px 0">' + esc(b.n) + '</button>';
        }).join('') + '</td>';
      }
      /* raw 列直接输出 HTML（如拖拽手柄），不转义；其余列一律转义（CHG-0075） */
      if (typeof c.raw === 'function') {
        return '<td' + (c.sec ? ' class="sec"' : '') + '>' + c.raw(r) + '</td>';
      }
      var v = c.fmt ? c.fmt(r) : r[c.k];
      return '<td' + (c.sec ? ' class="sec"' : '') + '>' + esc(v == null ? '—' : v) + '</td>';
    }).join('');
    /* 数据行共享 ADM-COMMON-C05 定义；选择该组件时描边当前已渲染的同类实例（标准 7.4.2 第6条）。
       行本身不再绑定任何动作（CHG-0066）：进入详情/编辑一律走操作列按钮，避免误点整行进入。
       data-rowid 只用于弹窗回填与 row-open 高亮。 */
    var rowAttr = typeof cfg.rowAttrs === 'function' ? cfg.rowAttrs(r) : '';
    return '<tr data-component="ADM-COMMON-C05" data-rowid="' + attr(rid) + '"' + rowAttr + (rt.drawerId === rid ? ' class="row-open"' : '') + '>' +
      (cfg.batch ? '<td class="select-col"><input type="checkbox" data-act="adm-sel" data-row="' + attr(rid) + '"' + (selected ? ' checked' : '') + ' aria-label="选择该行"></td>' : '') +
      cells + '</tr>';
  }).join('');
  return C('ADM-COMMON-C05',
    '<div style="overflow:visible"><table class="admin-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>',
    'div', '');
}
function admPager(cfg, rt, total, rows) {
  var pages = Math.max(1, Math.ceil(total / rt.size));
  if (rt.page > pages) rt.page = pages;
  var btns = '';
  for (var p = 1; p <= pages; p++) {
    if (pages > 7 && p > 3 && p < pages - 1 && Math.abs(p - rt.page) > 1) {
      if (p === 4) btns += '<span class="small muted" style="padding:0 4px">…</span>';
      continue;
    }
    btns += '<button class="btn mini" type="button" data-act="adm-page" data-page="' + p + '" aria-pressed="' + (p === rt.page ? 'true' : 'false') + '">' + p + '</button>';
  }
  return C('ADM-COMMON-C06',
    '<div class="row wrap" style="gap:8px;margin-top:12px;align-items:center">' +
    '<span class="small muted">共 ' + total + ' 条 · 第 ' + rt.page + ' / ' + pages + ' 页</span>' +
    '<span class="grow"></span>' +
    '<button class="btn mini" type="button" data-act="adm-page" data-page="' + (rt.page - 1) + '"' + (rt.page <= 1 ? ' disabled' : '') + '>上一页</button>' +
    btns +
    '<button class="btn mini" type="button" data-act="adm-page" data-page="' + (rt.page + 1) + '"' + (rt.page >= pages ? ' disabled' : '') + '>下一页</button>' +
    '<label class="small muted">每页 <select data-act="adm-size" style="min-height:34px;display:inline-block;width:auto">' +
    [10, 20].map(function (s) { return '<option value="' + s + '"' + (s === rt.size ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
    '</select> 条</label>' +
    '<span class="xsmall muted rv-annot">仅一页时禁用无效翻页，不模拟并不存在的下一页</span></div>', 'div', '');
}
function admMetrics(cfg, rt, rows) {
  if (!cfg.metrics || !cfg.metricDefs) return '';
  var defs = cfg.metricDefs(rows);
  return C('ADM-COMMON-C10', '<div class="admin-cards">' + defs.map(function (d) {
    return '<div class="admin-card"><div class="k">' + esc(d.k) + '</div><div class="v">' + esc(d.v) + '</div><div class="u">' + esc(d.u) + '</div></div>';
  }).join('') + '</div>' +
    '<div class="xsmall muted rv-annot" style="margin:-6px 0 12px">指标取值随已提交筛选条件与状态页签变化；口径见 05 与 04。模拟值，不代表正式统计。</div>', 'div', '');
}
function admMsg(rt) {
  if (!rt.msg) return '';
  var cls = rt.msgKind === 'err' ? 'err-txt' : (rt.msgKind === 'ok' ? 'ok-txt' : 'hint');
  return '<div class="' + cls + '" style="margin-bottom:10px" role="status">' + esc(rt.msg) + '</div>';
}
function admBatchBar(cfg, rt, rows) {
  if (!cfg.batch) return '';
  var selRows = rows.filter(function (r) { return rt.sel.indexOf(r.id || r.no || r.nid) >= 0; });
  var acts = cfg.batchActions || [{ n: '批量导出', act: 'adm-export' }];
  return C('ADM-COMMON-C08',
    '<div class="row wrap" style="gap:8px;align-items:center">' +
    '<span class="small">已选 <b>' + selRows.length + '</b> / 当前页 ' + rows.length + ' 条</span>' +
    '<button class="btn mini" type="button" data-act="adm-selclear"' + (rt.sel.length ? '' : ' disabled') + '>清除选择</button>' +
    acts.map(function (a) {
      return '<button class="btn mini" type="button" data-act="adm-batch" data-bn="' + attr(a.n) + '"' + (rt.sel.length ? '' : ' disabled') + '>' + esc(a.n) + '</button>';
    }).join('') +
    '<span class="xsmall muted rv-annot">批量操作显示选中范围和处理结果，部分失败可识别具体订单，避免重复执行；跨页选择策略：仅当前页（本原型）。</span></div>', 'div', 'card flat');
}
/* 编辑/查看弹窗（CHG-0066）：后台的详情与编辑统一渲染成居中的独立弹窗，
   不再拼在列表下方。列表状态下弹窗关闭，弹窗打开时列表仍在其后保持上下文。 */
function admDrawer(cfg, rt, rows) {
  if (!cfg.drawer || rt.drawer === null || rt.drawer === undefined) return '';
  var rid = rt.drawerId;
  var row = rows.filter(function (r) { return (r.id || r.no || r.nid) === rid; })[0];
  /* 新增模式（CHG-0075）：列表里还没有这条记录，由 draftRow 提供一行占位，
     复用同一套弹窗结构（标题、右上角保存/关闭、正文）。 */
  if (!row && typeof cfg.draftRow === 'function') row = cfg.draftRow(rt);
  var title = row ? (cfg.drawerTitle ? cfg.drawerTitle(row, rt) : '详情') : '记录不可访问';
  var metaTxt = typeof cfg.drawerMeta === 'function' ? cfg.drawerMeta(rt, row) : ('记录ID：' + (rid == null ? '—' : rid));
  /* 保存、提交、关闭类动作统一在右上角（CHG-0067）：动作区靠右、标题过长时省略。
     关闭固定为 ✕，始终排在动作区最后一位。 */
  var head = '<div class="dt"><span class="strong">' + esc(title) + '</span>' +
    '<span class="adm-meta">' + esc(metaTxt) + '</span>' +
    '<div class="acts">' +
    (row && cfg.drawerHead ? cfg.drawerHead(row, rt) : '') +
    (cfg.closeText
      ? '<button class="btn sm" type="button" data-act="adm-close-drawer">' + esc(cfg.closeText) + '</button>'
      : '<button class="btn mini" type="button" data-act="adm-close-drawer" aria-label="关闭" title="关闭">✕</button>') + '</div></div>';
  var body;
  if (row) {
    body = '<div class="db">' + cfg.drawer(row, rt) + '</div>';
  } else {
    /* 错误态同样不留底部按钮行：刷新放到右上角动作区，关闭由 ✕ 承担（CHG-0067） */
    head = head.replace('<div class="acts">',
      '<div class="acts"><button class="btn sm" type="button" data-act="adm-refresh">刷新列表</button>');
    body = '<div class="db"><div class="err-txt">该记录已不存在或不可访问，请刷新列表后重试。</div>' +
      '<div class="hint" style="margin-top:8px">列表数据可能已被其他会话变更；刷新列表即可看到最新结果，关闭弹窗不做其他改动。</div></div>';
  }
  return C('ADM-COMMON-C07',
    '<div class="adm-mask on" id="admModal" role="dialog" aria-modal="true" aria-label="' + attr(title) + '">' +
    '<div class="adm-dlg form">' + head + body + '</div></div>', 'div', '');
}
function admEmpty(kind, cfg, rt) {
  if (kind === 'NOPERM') {
    return C('ADM-COMMON-C11', '<div class="empty" style="border-color:#a33b3b"><span class="t" style="color:#a33b3b">［无权限］</span>' +
      '当前角色（' + esc(ADM_ROLE.name) + '）没有访问"' + esc(cfg.title) + '"的权限。服务端会拒绝该请求，前端隐藏不作为权限保障（AC-17）。' +
      '<div style="margin-top:8px"><button class="btn sm" type="button" data-act="adm-noperm-toggle">以有权限角色重新进入（演示）</button></div></div>', 'div', 'card');
  }
  if (kind === 'ERROR') {
    return C('ADM-COMMON-C11', '<div class="empty" style="border-color:#a33b3b"><span class="t" style="color:#a33b3b">［查询失败］</span>' +
      '请求失败，已保留当前筛选条件、页签与页码。错误原因：服务暂不可用（模拟）。' +
      '<div style="margin-top:8px"><button class="btn sm" type="button" data-act="adm-query">重试</button>' +
      '<button class="btn sm" type="button" data-act="adm-reset" style="margin-left:8px">重置条件</button></div></div>', 'div', 'card');
  }
  return C('ADM-COMMON-C11', '<div class="empty"><span class="t">［无匹配记录］</span>' +
    '当前已提交的筛选组合没有匹配记录。条件已保留，可修改条件或点击"重置"恢复默认数据范围。' +
    '<div style="margin-top:8px"><button class="btn sm" type="button" data-act="adm-reset">重置条件</button></div></div>', 'div', 'card');
}
function renderAdmin(page, state, sim) {
  var cfg = ADM_CFG[page.id];
  var rt = admRT(page.id);
  if (rt.noperm || state === 'NO_PERM') {
    return admWrap(page, '<div class="admin-title">' + esc(cfg.title) + '</div><div class="admin-sub rv-annot">' + esc(cfg.sub) + '</div>' +
      admEmpty('NOPERM', cfg, rt));
  }
  if (cfg.loginPage) return renderLogin();
  if (cfg.formPage) return renderServiceForm(page, cfg);

  var loading = rt.loading || state === 'LOADING';
  var error = rt.error || state === 'ERROR' || sim === 'fail';
  var filtered = admFiltered(cfg, rt);
  var counts = admTabCounts(cfg, rt, admApplyFilters(cfg, rt, cfg.rows()));
  var total = filtered.length;
  var start = (rt.page - 1) * rt.size;
  var pageRows = filtered.slice(start, start + rt.size);
  var content =
    '<div class="admin-title">' + esc(cfg.title) + '</div><div class="admin-sub rv-annot">' + esc(cfg.adm) + '　' + esc(cfg.sub) + '</div>' +
    '<div class="admin-sub rv-annot">' + esc(cfg.sub) + '</div>' +
    admMsg(rt) +
    /* noFilters / noTabs：整块不渲染。用于内容固定、无需检索与状态分组的页面
       （如首页配置管理只有两个固定组件，评审 CHG-0055 要求移除这两块）。 */
    (cfg.noFilters ? '' : admFilters(cfg, rt)) +
    admMetrics(cfg, rt, filtered) +
    (cfg.noTabs ? '' : admTabs(cfg, rt, counts)) +
    admBatchBar(cfg, rt, pageRows);
  if (loading) {
    content += '<div class="card"><div class="sk h20" style="margin-bottom:8px;width:40%"></div>' +
      '<div class="sk" style="margin-bottom:6px"></div><div class="sk" style="margin-bottom:6px;width:88%"></div>' +
      '<div class="sk" style="width:70%"></div></div>' +
      '<div class="xsmall muted">查询中：禁止同次重复提交；加载中保持筛选结构，不以空框替换整个工作区。</div>';
  } else if (error) {
    content += admEmpty('ERROR', cfg, rt);
  } else if (sim === 'timeout') {
    content += C('ADM-COMMON-C11', '<div class="empty" style="border-color:#8a641e"><span class="t" style="color:#8a641e">［查询超时］</span>' +
      '请求超时，未获得结果。已保留筛选条件与页码，可重试。超时不等于服务端未执行，重试前不会重复提交写操作（05 契约约束）。' +
      '<div style="margin-top:8px"><button class="btn sm" type="button" data-act="adm-query">重试</button></div></div>', 'div', 'card');
  } else if (sim === 'empty' || !total) {
    content += admEmpty('EMPTY', cfg, rt);
  } else {
    content += admTable(cfg, rt, pageRows);
    content += admPager(cfg, rt, total, pageRows);
  }
  /* 编辑/查看弹窗：position:fixed，挂在画布内但覆盖整个画布区（与二次确认层同一容器） */
  if (cfg.noDrawer !== true && !loading) content += admDrawer(cfg, rt, filtered);
  if (cfg.footerNote) content += '<div class="xsmall muted rv-annot" style="margin-top:14px">' + esc(cfg.footerNote) + '</div>';
  /* 页面自带的覆盖层（如首页配置的商品选择弹层）由 cfg.overlay 提供 */
  if (cfg.overlay) content += cfg.overlay(rt);
  return admWrap(page, content);
}
function renderLogin() {
  return admWrap({ id: 'ADM-LOGIN-01' },
    '<div style="max-width:420px;margin:40px auto 0">' +
    C('ADM-LOGIN-01-C01',
      '<div class="strong" style="font-size:18px;margin-bottom:4px">商城运营后台</div>' +
      '<div class="hint" style="margin-bottom:12px">账号密码登录（模拟）。连续失败锁定与验证码策略待技术确认（DEC-ADM-001）。</div>' +
      '<label class="fld" style="display:block;margin-bottom:10px"><span class="xsmall muted">账号</span>' +
      '<input class="inp" id="admUser" style="min-height:40px" value="' + attr(RV.admUser || '') + '" placeholder="请输入后台账号"></label>' +
      '<label class="fld" style="display:block;margin-bottom:10px"><span class="xsmall muted">密码</span>' +
      '<input class="inp" id="admPwd" type="password" style="min-height:40px" value="' + attr(RV.admPwd || '') + '" placeholder="请输入密码"></label>' +
      (RV.admLoginErr ? '<div class="err-txt">' + esc(RV.admLoginErr) + '</div>' : '') +
      '<div class="hint">登录失败时就地展示错误，不跳转空白页；成功后进入首页配置管理。</div>', 'div', 'card') +
    C('ADM-LOGIN-01-C02', '<button class="btn primary wide" type="button" data-act="adm-login"' + (RV.admBusy ? ' disabled' : '') + '>' +
      (RV.admBusy ? '登录中…' : '登录') + '</button>', 'div', '') +
    '</div>');
}
function renderServiceForm(page, cfg) {
  return admWrap(page,
    /* 保存与重置固定在页面右上角（CHG-0067），与其他编辑界面一致 */
    '<div class="row" style="gap:12px;align-items:flex-start">' +
    '<div><div class="admin-title">客服配置　<span class="xsmall muted">ADM-09</span></div>' +
    '<div class="admin-sub rv-annot">' + esc(cfg.sub) + '</div></div>' +
    '<div class="admin-page-acts"><button class="btn primary sm" type="button" data-act="adm-save">保存</button>' +
    '<button class="btn sm" type="button" data-act="adm-reset">重置为上次保存值</button></div></div>' +
    admMsg(admRT(page.id)) +
    C('ADM-SERVICE-01-C01',
      '<div class="col" style="gap:12px;max-width:640px">' +
      '<label class="fld"><span class="xsmall muted">企业微信添加方式</span><select style="min-height:40px">' +
      '<option>企业微信链接（推荐）</option><option>二维码</option><option>客服账号说明</option></select></label>' +
      '<label class="fld"><span class="xsmall muted">企业微信链接 / 账号</span><input class="inp" style="min-height:40px" value="https://work.weixin.qq.com/kf/（模拟）"></label>' +
      '<label class="fld"><span class="xsmall muted">引导文案</span><textarea class="inp" style="min-height:80px">前台售后统一通过企业微信沟通，联系时请提供订单编号，便于客服核查支付与交付状态。</textarea></label>' +
      '<label class="fld"><span class="xsmall muted">无法唤起时的备用提示</span><textarea class="inp" style="min-height:64px">无法唤起企业微信时，请复制客服账号后在微信中搜索添加，或稍后重试。</textarea></label>' +
      '<label class="fld"><span class="xsmall muted">客服服务时间</span><input class="inp" style="min-height:40px" placeholder="待运营提供；不得直接沿用交付排班（7.2、TBD-09）"></label>' +
      '<div class="hint">客服添加方式需验证在两个 App 与 PC 容器中的实际可用性；客服联系方式建议后台统一维护（8.2）。</div>' +
      '</div>', 'div', 'card'));
}
