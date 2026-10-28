
/* ============================================================
   ADM 运营后台：页面配置（第二部分）与渲染引擎
   ============================================================ */
/* 好友赠送 · 批次记录页签的查看弹窗（CHG-0066）。
   只读：批次是导出结果的快照，不在这里改数据；导出不代表赠送完成（GIFT-03）。 */
function admGiftBatchDrawer(r) {
  return '<div class="hint">批次是某次导出的结果快照。导出只代表已生成待赠送清单，**不自动代表赠送完成**（GIFT-03）；'
    + '完成情况以逐单核实为准，重复导出在下表「重复识别」中标注。</div>'
    + '<table class="admin-table" style="margin-top:8px"><tbody>'
    + '<tr><th style="width:26%">批次号</th><td>' + esc(r.id) + '</td></tr>'
    + '<tr><th>导出文件</th><td class="brk">' + esc(r.file) + '<div class="xsmall muted">原型不产生真实文件，仅展示文件名与字段口径</div></td></tr>'
    + '<tr><th>订单数</th><td>' + esc(r.cnt) + ' 单</td></tr>'
    + '<tr><th>操作人 / 导出时间</th><td>' + esc(r.op) + '　' + esc(r.time) + '</td></tr>'
    + '<tr><th>当前状态</th><td>' + esc(r.stat) + '</td></tr>'
    + '<tr><th>已完成</th><td>' + esc(r.done) + ' / ' + esc(r.cnt) + ' 单</td></tr>'
    + '<tr><th>重复识别</th><td>' + esc(r.dup) + '</td></tr>'
    + '</tbody></table>'
    + '<div class="hint" style="margin-top:10px">导出内容不默认包含实名资料与手机号（GIFT-02、PHONE-04）；'
    + '本页不提供批次内的逐单列表，逐单处理在「待处理队列」页签完成。</div>'
    ;
}

/* 通知模板管理（CHG-0088）：覆盖在通知记录页上的独立弹层，支持查看、编辑与保存新版本。 */
function admTplPreview(text) {
  return String(text || '')
    .replace(/\{\{order_no\}\}/g, 'SO2026101500012311')
    .replace(/\{\{goods_name\}\}/g, 'P1002 暗影回廊')
    .replace(/\{\{code_masked\}\}/g, 'SUP-••••9-CN')
    .replace(/\{\{deliver_time\}\}/g, '2026-10-16 15:40')
    .replace(/\{\{refund_amount\}\}/g, '128.00');
}
function admNotifyTplList(rt) {
  return (rt.tplMsg ? '<div class="xsmall" style="color:#1f7a3d;margin-bottom:8px">' + esc(rt.tplMsg) + '</div>' : '') +
    '<div class="xsmall" style="color:#6b7280;margin-bottom:8px">模板变量：{{order_no}}、{{goods_name}}、{{code_masked}}、{{deliver_time}}、{{refund_amount}}；所有用户通知统一走站内信，正文不得包含完整口令码（CODE-08）。</div>' +
    '<table class="admin-table"><thead><tr><th>模板</th><th>场景 / 渠道</th><th>版本 / 状态</th><th>最近更新</th><th>操作</th></tr></thead><tbody>' +
    ADM_NOTIFY_TPLS.map(function (x) {
      return '<tr data-tplid="' + attr(x.id) + '"><td>' + esc(x.name) + '<div class="xsmall" style="color:#6b7280">' + esc(x.id) + '</div></td>' +
        '<td>' + esc(x.scene) + '<div class="xsmall" style="color:#6b7280">' + esc(x.channel) + '</div></td>' +
        '<td>' + esc(x.ver) + '<div class="xsmall" style="color:#6b7280">' + esc(x.status) + '</div></td>' +
        '<td>' + esc(x.updatedAt) + '<div class="xsmall" style="color:#6b7280">' + esc(x.op) + '</div></td>' +
        '<td><button class="btn mini" type="button" data-act="adm-tpl-edit" data-id="' + attr(x.id) + '">编辑</button></td></tr>';
    }).join('') +
    '</tbody></table>';
}
function admNotifyTplEditor(rt, x) {
  var d = rt.tplDraft || { name: x.name, title: x.title, body: x.body, status: x.status };
  return '<table class="admin-table"><tbody>' +
    '<tr><th style="width:26%">模板ID / 场景</th><td>' + esc(x.id) + ' / ' + esc(x.scene) + '</td></tr>' +
    '<tr><th>渠道 / 当前版本</th><td>' + esc(x.channel) + ' / ' + esc(x.ver) + '（保存后生成新版本，历史通知保留快照）</td></tr>' +
    '</tbody></table>' +
    '<div class="col" style="gap:8px;margin-top:10px">' +
    '<div class="row"><span class="small muted" style="width:96px;flex:none">模板名称<span style="color:var(--error)">*</span></span>' +
    '<input class="inp" data-tpl-name="1" value="' + attr(d.name) + '" style="min-height:40px;flex:1" aria-label="模板名称"></div>' +
    '<div class="row"><span class="small muted" style="width:96px;flex:none">状态</span>' +
    '<select class="inp" data-tpl-status="1" style="min-height:40px;flex:1" aria-label="模板状态">' +
    '<option value="启用"' + (d.status === '启用' ? ' selected' : '') + '>启用</option>' +
    '<option value="停用"' + (d.status === '停用' ? ' selected' : '') + '>停用</option></select></div>' +
    '<div class="row"><span class="small muted" style="width:96px;flex:none">标题<span style="color:var(--error)">*</span></span>' +
    '<input class="inp" data-tpl-title="1" value="' + attr(d.title) + '" style="min-height:40px;flex:1" aria-label="模板标题"></div>' +
    '<div class="row" style="align-items:flex-start"><span class="small muted" style="width:96px;flex:none;padding-top:10px">正文<span style="color:var(--error)">*</span></span>' +
    '<textarea class="inp" data-tpl-body="1" rows="5" style="flex:1;min-height:120px" aria-label="模板正文">' + esc(d.body) + '</textarea></div>' +
    '<div class="xsmall" style="color:#6b7280">可用变量：{{order_no}}、{{goods_name}}、{{code_masked}}、{{deliver_time}}、{{refund_amount}}；不要使用完整口令码变量（CODE-08）。</div>' +
    (rt.tplErr ? '<div class="xsmall" style="color:#a33b3b">' + esc(rt.tplErr) + '</div>' : '') +
    '<div class="row" style="align-items:flex-start"><span class="small muted" style="width:96px;flex:none;padding-top:10px">预览</span>' +
    '<div class="grow" style="border:1px solid #c9cdd3;border-radius:6px;padding:10px;background:#fafafa">' +
    '<div class="strong small">' + esc(admTplPreview(d.title)) + '</div>' +
    '<div class="small" style="margin-top:6px;white-space:pre-wrap">' + esc(admTplPreview(d.body)) + '</div></div>' +
    '<button class="btn sm" type="button" data-act="adm-tpl-preview">刷新预览</button></div>' +
    '</div>';
}
function admNotifyTplOverlay(rt) {
  if (!rt || !rt.tplOpen) return '';
  var editing = rt.tplEditId ? ADM_NOTIFY_TPLS.filter(function (x) { return x.id === rt.tplEditId; })[0] : null;
  var title = editing ? '编辑通知模板 · ' + editing.name : '通知模板管理';
  var meta = editing ? (editing.id + ' · 当前 ' + editing.ver) : ('共 ' + ADM_NOTIFY_TPLS.length + ' 个模板');
  var acts = editing
    ? '<button class="btn primary sm" type="button" data-act="adm-tpl-save">保存模板</button>' +
      '<button class="btn sm" type="button" data-act="adm-tpl-back">返回列表</button>'
    : '';
  return C('ADM-NOTIFY-01-C04',
    '<div class="adm-mask on stacked" id="tplMask" role="dialog" aria-modal="true" aria-label="通知模板管理">' +
    '<div class="adm-dlg" style="max-width:820px"><div class="dt"><span class="strong">' + esc(title) + '</span>' +
    '<span class="adm-meta">' + esc(meta) + '</span><div class="acts">' + acts +
    '<button class="btn sm" type="button" data-act="adm-tpl-close">关闭</button></div></div>' +
    '<div class="db">' + (editing ? admNotifyTplEditor(rt, editing) : admNotifyTplList(rt)) + '</div></div></div>', 'div', '');
}


/* 协议富文本（CHG-0089）：简单清洗发布内容，禁止脚本与内联事件。 */
function sanitizeAgreeHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '');
}
function bumpAgreeVersion(ver) {
  var m = String(ver || 'V1.0').match(/^V(\d+)\.(\d+)$/);
  return m ? ('V' + m[1] + '.' + (parseInt(m[2], 10) + 1)) : 'V1.1';
}
function admAgreeViewer(r) {
  return '<div class="row wrap" style="gap:6px"><span class="tag">' + esc(r.stat) + '</span><span class="tag">' + esc(r.ver) + '</span></div>' +
    '<table class="admin-table" style="margin-top:8px"><tbody>' +
    '<tr><th style="width:26%">协议名称</th><td>' + esc(r.title) + '</td></tr>' +
    '<tr><th>版本</th><td>' + esc(r.ver) + '</td></tr>' +
    '<tr><th>生效时间</th><td>' + esc(r.pub) + '（发布并生效的时间）</td></tr>' +
    '<tr><th>关联订单数（模拟）</th><td>' + r.orders + '</td></tr>' +
    '<tr><th>维护方式</th><td>' + esc(r.mode) + '　操作人：' + esc(r.op || '—') + '</td></tr>' +
    '<tr><th>说明</th><td>' + esc(r.note) + '</td></tr>' +
    '</tbody></table>' +
    '<div class="strong small" style="margin-top:12px">协议正文</div>' +
    '<div class="agree-rich" style="margin-top:6px">' + (r.body || '') + '</div>' +
    '<div class="xsmall" style="color:#6b7280;margin-top:8px">订单关联协议版本与确认时间；成交后保存版本快照，避免运营修改覆盖历史信息（AGREEMENT-01、CHECKOUT-05）。</div>';
}
function admAgreeEditor(rt) {
  var d = (rt && rt.agreeDraft) || { body: '' };
  return '<div class="row"><span class="small muted" style="width:80px;flex:none">协议名称</span>' +
    '<input class="inp" value="购买协议" readonly style="min-height:40px;flex:1" aria-label="协议名称"></div>' +
    '<div class="xsmall" style="color:#6b7280;margin-top:4px">版本号与生效时间由发布自动生成；每次发布生成一条修改记录。不支持保存草稿。</div>' +
    '<div class="agree-toolbar" style="margin-top:10px">' +
    '<button class="btn mini" type="button" data-act="adm-agree-fmt" data-cmd="bold" title="加粗"><b>B</b></button>' +
    '<button class="btn mini" type="button" data-act="adm-agree-fmt" data-cmd="italic" title="斜体"><i>I</i></button>' +
    '<button class="btn mini" type="button" data-act="adm-agree-fmt" data-cmd="underline" title="下划线"><u>U</u></button>' +
    '<select class="inp" data-agree-font="1" aria-label="字体"><option value="">默认字体</option><option value="SimSun">宋体</option><option value="SimHei">黑体</option><option value="Microsoft YaHei">微软雅黑</option></select>' +
    '<select class="inp" data-agree-size="1" aria-label="字号"><option value="">默认字号</option><option value="2">小</option><option value="3">中</option><option value="4">大</option><option value="5">特大</option></select>' +
    '<button class="btn mini" type="button" data-act="adm-agree-fmt" data-cmd="insertUnorderedList" title="项目符号">• 列表</button>' +
    '<button class="btn mini" type="button" data-act="adm-agree-fmt" data-cmd="removeFormat" title="清除格式">清除格式</button>' +
    '</div>' +
    '<div class="agree-editor" id="agreeEditor" contenteditable="true" data-agree-editor="1" style="margin-top:6px;min-height:260px;border:1px solid #c9cdd3;border-radius:6px;padding:10px;background:#fff">' + (d.body || '') + '</div>' +
    (rt.agreeErr ? '<div class="xsmall" style="color:#a33b3b;margin-top:6px">' + esc(rt.agreeErr) + '</div>' : '') +
    '<div class="xsmall" style="color:#6b7280;margin-top:6px">发布后立即生效并生成修改记录；协议正文支持加粗、斜体、下划线、字体、字号与列表等基础格式。</div>';
}

/* 权限管理（CHG-0089）：授权对象＝后台菜单。 */
function admRbacMenuName(id) {
  var m = ADM_MENU.filter(function (x) { return x.id === id; })[0];
  return m ? m.n : id;
}
function admRbacAllMenuIds() {
  return ADM_MENU.filter(function (x) { return x.id; }).map(function (x) { return x.id; });
}
function admRbacMenusText(r) {
  var all = admRbacAllMenuIds();
  var ms = (r && r.menus) || [];
  if (!ms.length) return '未配置';
  if (ms.length === all.length && all.every(function (id) { return ms.indexOf(id) >= 0; })) return '全部菜单';
  return ms.map(admRbacMenuName).join('、');
}
function admRbacMenuGroups(d) {
  var out = [], cur = null;
  ADM_MENU.forEach(function (m) {
    if (m.g) { cur = { g: m.g, items: [] }; out.push(cur); return; }
    if (m.id && cur) cur.items.push(m);
  });
  return out.map(function (grp) {
    return '<div class="rbac-group"><div class="t">' + esc(grp.g) + '</div>' +
      grp.items.map(function (m) {
        var checked = (d.menus || []).indexOf(m.id) >= 0;
        return '<label class="rbac-cb"><input type="checkbox" data-rbac-menu="' + attr(m.id) + '"' + (checked ? ' checked' : '') + '> ' + esc(m.n) + '</label>';
      }).join('') + '</div>';
  }).join('');
}
function admRbacRoleDrawer(r, rt) {
  var d = (rt && rt.rbacDraft) || { nm: r.nm, desc: r.desc || '', menus: (r.menus || []).slice() };
  var isNew = rt && rt.rbacNewRole;
  return '<div class="xsmall" style="color:#6b7280">授权对象为后台菜单；菜单可见不代表可执行敏感操作，服务端仍按角色校验（ADM-10、AC-17）。</div>' +
    '<div class="row" style="gap:8px;margin-top:10px"><span class="small muted" style="width:88px;flex:none">角色名称<span style="color:var(--error)">*</span></span>' +
    '<input class="inp" data-rbac-name="1" value="' + attr(d.nm) + '" style="min-height:40px;flex:1" aria-label="角色名称"></div>' +
    '<div class="row" style="gap:8px;margin-top:8px"><span class="small muted" style="width:88px;flex:none">角色说明</span>' +
    '<input class="inp" data-rbac-desc="1" value="' + attr(d.desc) + '" style="min-height:40px;flex:1" aria-label="角色说明"></div>' +
    '<div class="strong small" style="margin-top:12px">菜单权限</div>' +
    '<div style="margin-top:6px">' + admRbacMenuGroups(d) + '</div>' +
    (rt.rbacErr ? '<div class="xsmall" style="color:#a33b3b;margin-top:6px">' + esc(rt.rbacErr) + '</div>' : '') +
    '<div class="xsmall" style="color:#6b7280;margin-top:8px">' + (isNew ? '保存后生成角色ID，可在账号列表中分配。' : '保存后立即更新该角色可见的后台菜单。') + '</div>';
}
function admRbacAccountDrawer(r, rt) {
  var d = (rt && rt.rbacDraft) || { role: r.role };
  return '<div class="xsmall" style="color:#6b7280">账号通过角色获得菜单权限；角色的菜单配置在「角色列表」中维护。</div>' +
    '<table class="admin-table" style="margin-top:8px"><tbody>' +
    '<tr><th style="width:26%">账号</th><td>' + esc(r.nm) + '（' + esc(r.id) + '）</td></tr>' +
    '<tr><th>数据范围 / 状态</th><td>' + esc(r.platform) + ' / ' + esc(r.state) + '</td></tr>' +
    '</tbody></table>' +
    '<div class="row" style="gap:8px;margin-top:10px"><span class="small muted" style="width:88px;flex:none">角色<span style="color:var(--error)">*</span></span>' +
    '<select class="inp" data-rbac-role="1" style="min-height:40px;flex:1" aria-label="角色">' +
    ADM_ROLES.map(function (x) { return '<option value="' + attr(x.nm) + '"' + (x.nm === d.role ? ' selected' : '') + '>' + esc(x.nm) + '</option>'; }).join('') +
    '</select></div>' +
    (rt.rbacErr ? '<div class="xsmall" style="color:#a33b3b;margin-top:6px">' + esc(rt.rbacErr) + '</div>' : '') +
    '<div class="xsmall" style="color:#6b7280;margin-top:8px">更换角色后，账号可访问的后台菜单随之变化；敏感操作仍由服务端校验。</div>';
}

/* 钉钉通知记录弹层（CHG-0096）：pu004／pu005／pu006／结果未知四类异常实时推送运营群。
   原型只展示模拟消息，不配置真实 webhook、不发送真实通知；消息不含完整 CDK。 */
function admDingOverlay(rt) {
  if (!rt || !rt.dingOpen) return '';
  return C('ADM-CODE-01-C05',
    '<div class="adm-mask on stacked" id="dingMask" role="dialog" aria-modal="true" aria-label="钉钉通知记录">' +
    '<div class="adm-dlg" style="max-width:860px"><div class="dt"><span class="strong">钉钉实时通知记录（模拟）</span>' +
    '<span class="adm-meta">共 ' + ADM_DING_ROWS.length + ' 条 · 运营异常处理群</span>' +
    '<div class="acts"><button class="btn sm" type="button" data-act="adm-ding-close">关闭</button></div></div>' +
    '<div class="db"><div class="hint">触发范围：pu004 库存不足、pu005 出库失败、pu006 已处理待取码、结果未知。通知内容含订单号、商品、用户脱敏信息、错误码、时间与处理入口；<b>不含完整 CDK</b>。真实 webhook 由技术开发后续提供，原型不发送真实通知。</div>' +
    '<table class="admin-table" style="margin-top:8px"><thead><tr><th style="width:15%">时间</th><th style="width:18%">订单号</th>' +
    '<th style="width:16%">商品</th><th style="width:13%">用户</th><th style="width:10%">错误码</th><th style="width:9%">状态</th><th style="width:19%">处理</th></tr></thead><tbody>' +
    ADM_DING_ROWS.map(function (d) {
      return '<tr><td>' + esc(d.at) + '</td><td class="brk">' + esc(d.no) + '</td><td>' + esc(d.goods) + '</td>' +
        '<td>' + esc(d.buyer) + '<div class="xsmall muted">' + esc(d.phone) + '</div></td><td>' + esc(d.code) + '</td><td>' + esc(d.status) + '</td>' +
        '<td><button class="btn mini" type="button" data-act="adm-ding-order" data-order="' + attr(d.no) + '">订单管理</button></td></tr>';
    }).join('') + '</tbody></table>' +
    '<div class="xsmall muted" style="margin-top:8px">同一异常只推送一次；通知失败的重试与兜底策略待技术确认（TBD-09）。</div></div></div></div>', 'div', '');
}


Object.assign(ADM_CFG, {
  /* ---------- ADM-GIFT-01 好友赠送 ---------- */
  'ADM-GIFT-01': {
    title: '好友赠送', adm: 'ADM-06', perm: 'gift',
    sub: '只处理已支付的好友赠送订单：运营按批次导出用户填写的好友链接、交付第三方处理，并手动推进「待处理 → 处理中 → 已完成」；状态与订单管理的「交付」列同源，改这里即同步。导出操作不自动代表赠送完成（GIFT-03）；不默认导出实名资料与手机号（GIFT-02、PHONE-04）。',
    filters: [{ k: 'no', label: '订单号', type: 'text', ph: '按订单号查询' },
              { k: 'platform', label: '来源平台', type: 'select', opts: ['全部'].concat(ADM_PLATFORMS) },
              { k: 'goods', label: '商品', type: 'text', ph: '按商品查询' }],
    advanced: [{ k: 'gift', label: '赠送状态', type: 'select', opts: ['全部', '待处理', '处理中', '已完成'] },
               { k: 'time', label: '付款时间（区间）', type: 'date' }],
    /* 页签只有一个：批次记录取消（CHG-0080） */
    tabs: ['好友赠送订单列表'], customTabs: true,
    closeText: '关闭',
    batch: true, export: true,
    exportNote: '导出字段＝订单号、用户名称、商品、好友链接（用户填写原文）、付款时间、交付状态、操作人、操作时间；用于交付第三方处理。',
    /* 列（CHG-0080）：新增「用户」（可点开用户信息）、「操作人」「操作时间」，移除「批次号」 */
    columns: [{ k: 'no', t: '订单号', w: '14%' },
              { k: '_buyer', t: '用户', w: '11%', raw: function (r) {
                return '<button class="btn-link ellip" type="button" data-act="adm-order-user" data-row="' + attr(r.no) + '" title="' + attr('查看用户信息：' + r.buyer) + '">' + esc(r.buyer) + '</button>';
              } },
              { k: 'goods', t: '商品', w: '15%' },
              { k: 'friend', t: '好友链接', w: '15%' },
              { k: 'time', t: '付款时间', w: '10%', sec: true },
              { k: 'gift', t: '交付状态', w: '9%' },
              { k: 'giftOp', t: '操作人', w: '9%' },
              { k: 'giftOpAt', t: '操作时间', w: '11%', sec: true },
              { k: '_op', t: '操作', w: '16%' }],
    rows: function () { return ADM_GIFT_ROWS; },
    /* 只有一个页签，且它是数据源不是状态分组：直接取已过滤行数（CHG-0080） */
    tabCounts: function (rt, rows) { return { '好友赠送订单列表': rows.length }; },
    overlay: function (rt) { return admOrderUserCard(rt); },
    /* 入口统一「查看」；状态推进就地执行，且都走二次确认（CHG-0080 移除「异常备注」） */
    actions: ['查看'],
    /* 状态由运营手动推进（CHG-0079）：待处理→开始处理，处理中→标记完成，已完成不再给动作。
       两个动作都走二次确认；写回的是订单对象本身，订单管理的交付列同步更新。 */
    extraActions: [
      { n: function (r) { return r.gift === '待处理' ? '开始处理' : (r.gift === '处理中' ? '标记完成' : ''); },
        direct: true, confirmFn: function (r) {
          if (r.gift === '待处理') return {
            title: '确认开始处理该赠送订单？', ok: '确认开始处理', tone: 'normal',
            body: '标记为「处理中」后，运营需导出好友链接并交付第三方处理；订单管理的「交付」仍为「未交付」——处理中不等于已交付。',
            obj: r.no + '　好友链接：' + r.friend,
            note: '这是人工状态确认，不代表第三方已回执。'
          };
          return {
            title: '确认该订单已完成赠送？', ok: '确认完成', tone: 'normal',
            body: '确认后订单管理的「交付」同步更新为「已交付」，订单随之转为「已关闭」。请先核实第三方已处理完毕再点击。',
            obj: r.no + '　好友链接：' + r.friend,
            note: '确认完成不可撤销；如判断有误，需重新记录异常。'
          };
        } },
    ],
    batchActions: [{ n: '批量导出', act: 'adm-export' }, { n: '批量开始处理', act: 'adm-start' }],
    drawerTitle: function (r) { return '赠送订单 · ' + r.no; },
    drawerHead: function (r) {
      /* 只保留「确认」（原「确认完成」，CHG-0080）；「记录异常」已移除 */
      return '<button class="btn primary sm" type="button" data-act="adm-done-submit">确认</button>';
    },
    drawer: function (r) {
      return '<div class="hint">服务时段为工作日 8:00～18:00（Asia/Shanghai）。工作时间内下单预计 2～6 小时完成，非工作时段顺延至下一工作时段；节假日沿用同一工作时段（REQ-13）。</div>' +
        '<div class="hint">工作时间内下单预计 2～6 小时完成，非工作时段顺延至下一工作时段；不展示精确交付倒计时，也不自动认定违约（REQ-13）。</div>' +
        '<table class="admin-table" style="margin-top:8px"><tbody>' +
        '<tr><th style="width:26%">订单号</th><td>' + esc(r.no) + '</td></tr>' +
        '<tr><th>用户</th><td>' + esc(r.buyer) + '（用户ID：' + esc(r.buyerId) + '）　' + esc(r.phone) +
          '　<button class="btn mini" type="button" data-act="adm-order-user" data-row="' + attr(r.no) + '">查看用户信息</button></td></tr>' +
        '<tr><th>商品 / 规格</th><td>' + esc(r.goods) + ' / ' + esc(r.spec) + '</td></tr>' +
        '<tr><th>好友链接</th><td class="brk">' + esc(r.friend) + '<div class="xsmall muted">付款后资料锁定，后台普通编辑不得修改；异常经客服与供应商协调（GIFT-05、5.6）</div></td></tr>' +
        '<tr><th>付款时间</th><td>' + esc(r.time) + '</td></tr>' +
        '<tr><th>当前状态</th><td>' + esc(r.gift) + '</td></tr>' +
        '<tr><th>操作人 / 操作时间</th><td>' + esc(r.giftOp || '—') + ' / ' + esc(r.giftOpAt || '—') + '</td></tr></tbody></table>' +
        '<div class="hint">运营核实好友是否收到后方可标记已完成；完成确认依据字段已按 CHG-0080 移除。</div>';
    }
  },

/* ---------- ADM-CODE-01 口令码交付 ---------- */
  /* 只展示需要人工处理的口令码订单：结果未知、pu004 库存不足、pu005 出库失败、pu006 已处理待取码。
     正常已交付订单不进入本列表；每笔订单只允许人工补发一次，处理后操作栏变为「查看」。 */
  'ADM-CODE-01': {
    title: '口令码交付', adm: 'ADM-07', perm: 'code',
    sub: '只展示已支付且需要人工处理的口令码订单：结果未知、库存不足（pu004）、出库失败（pu005）、已处理待取码（pu006）；正常已交付订单不进入本列表。每笔订单只允许人工补发一次，提交后处理状态=已处理、操作栏变为「查看」；补发码由运营登录 HIgame 后台按订单号查询后手工录入，禁止调用供应商 API 重新发货。pu004/pu005/pu006/结果未知同时推送钉钉运营群（模拟）；口令码加密保存、按权限查看，不在普通日志或常规报表中输出完整内容（CODE-08、CHG-0096）。',
    filters: [{ k: 'no', label: '订单号', type: 'text', ph: '按订单号查询' },
              { k: 'platform', label: '来源平台', type: 'select', opts: ['全部'].concat(ADM_PLATFORMS) },
              { k: 'goods', label: '商品', type: 'text', ph: '按商品查询' },
              { k: 'processStatus', label: '处理状态', type: 'select', opts: ['全部', '待处理', '已处理'] }],
    advanced: [{ k: 'time', label: '时间（区间）', type: 'date' }],
    /* 状态页签取消，只留一个数据列表（CHG-0081）；右侧给钉钉通知入口（CHG-0096）。 */
    tabs: ['口令码交付列表'], customTabs: true, closeText: '关闭',
    tabCounts: function (rt, rows) { return { '口令码交付列表': rows.length }; },
    tabAction: function () {
      return '<button class="btn sm" type="button" data-act="adm-ding-open">钉钉通知（' + ADM_DING_ROWS.length + '）</button>';
    },
    export: true,
    overlay: function (rt) { return admOrderUserCard(rt) + admDingOverlay(rt); },
    columns: [{ k: 'no', t: '订单号', w: '15%' },
              { k: '_buyer', t: '用户', w: '11%', raw: function (r) {
                return '<button class="btn-link ellip" type="button" data-act="adm-order-user" data-row="' + attr(r.no) + '" title="' + attr('查看用户信息：' + r.buyer) + '">' + esc(r.buyer) + '</button>';
              } },
              { k: 'platform', t: '来源平台', w: '8%', sec: true },
              { k: 'goods', t: '商品', w: '16%' },
              { k: 'deliver', t: '交付状态', w: '8%' },
              { k: 'processStatus', t: '处理状态', w: '9%' },
              { k: 'codeOp', t: '操作人', w: '9%' },
              { k: 'codeOpAt', t: '操作时间', w: '10%', sec: true },
              { k: '_op', t: '操作', w: '10%' }],
    rows: function () {
      return ADM_CODE_ROWS.filter(function (r) {
        return r.pay === '已支付' &&
          (r.supStatus === '结果未知' || r.supCode === 'pu004' || r.supCode === 'pu005' || r.supCode === 'pu006');
      });
    },
    actions: [],
    extraActions: [
      { n: function (r) { return r.processStatus === '已处理' ? '查看' : '编辑'; } },
      { n: '订单管理', direct: true }
    ],
    drawerTitle: function (r, rt) { return (rt && rt.codeViewMode ? '查看处理结果 · ' : '人工补发 · ') + r.no; },
    drawerHead: function (r, rt) {
      if (rt && rt.codeViewMode) return '<span class="small muted">该订单已处理，仅可查看</span>';
      return '<button class="btn primary sm" type="button" data-act="adm-resend-submit">提交处理结果</button>';
    },
    commitDraft: function (rt) {
      var d = rt.codeDraft; if (!d) return null;
      var reason = String(d.reason || '').replace(/^\s+|\s+$/g, '');
      var code = String(d.code || '').replace(/^\s+|\s+$/g, '');
      if (!reason) return '原因不能为空。';
      if (!code) return '补录口令码不能为空。';
      var rec = ADM_CODE_ROWS.filter(function (x) { return x.id === rt.drawerId; })[0];
      if (!rec) return '该订单已不存在，请刷新后重试。';
      /* 只允许人工处理队列内的订单提交（CHG-0092）。 */
      if (!(rec.supStatus === '结果未知' || rec.supCode === 'pu004' || rec.supCode === 'pu005' || rec.supCode === 'pu006')) {
        return '该订单不在人工处理队列，不能提交。';
      }
      /* 每笔订单只允许提交一次（CHG-0092）：处理后只能查看，避免对同一 CDK 反复补发。 */
      if (rec.processStatus === '已处理') return '该订单已处理，仅可查看，不能再次提交。';
      if (rec.pay !== '已支付') return '该订单尚未支付，不能补发；请先确认支付状态。';
      rec.resendLog = rec.resendLog || [];
      rec.resendLog.unshift({
        at: '2026-10-16 15:40', op: ADM_ROLE.name, type: '人工补发（人工查询上游后台）',
        reason: reason, code: code
      });
      rec.currentCode = code;
      CODE_SYNC[rec.no] = code;
      DELIVERY_SYNC[rec.no] = 'CODE::DELIVERED';
      rec.code = '已交付';
      rec.reqState = '已返回';
      rec.codeOp = ADM_ROLE.name; rec.codeOpAt = '2026-10-16 15:40';
      rec.manualOp = ADM_ROLE.name; rec.manualAt = '2026-10-16 15:40';
      rec.cdkSource = '人工补录';
      rec.processStatus = '已处理';
      rec.processedBy = ADM_ROLE.name;
      rec.processedAt = '2026-10-16 15:40';
      rec.deliver = '已交付';
      rec.state = '已完成';
      if (!rec.deliveredAt || rec.deliveredAt === '—') rec.deliveredAt = '2026-10-16 15:40';
      return null;
    },
    afterCommit: function (rt) { rt.codeDraft = null; },
    drawer: function (r, rt) {
      var view = !!(rt && rt.codeViewMode);
      var cd = (rt && rt.codeDraft) || { reason: '', code: '' };
      var head = view
        ? '<div class="hint">该订单已完成人工处理，以下为处理结果与操作记录，不可再次提交。</div>'
        : '<div class="xsmall" style="color:#a33b3b;margin-bottom:8px">上游 API 不支持异常订单重新调用；请先登录 HIgame 后台按订单号查询并获取 CDK，再在本页手工填写。每笔订单仅允许提交一次。</div>' +
          '<div class="hint">人工补发记录包含原因、补录口令码、操作人与操作时间（CODE-05）。人工操作须与自动任务协调，避免重复采购或交付（CODE-07）。</div>';
      var summary = '<table class="admin-table" style="margin-top:8px"><tbody>' +
        '<tr><th style="width:26%">订单号</th><td>' + esc(r.no) + '</td></tr>' +
        '<tr><th>用户</th><td>' + esc(r.buyer) + '（用户ID：' + esc(r.buyerId) + '）　' + esc(r.phone) +
          '　<button class="btn mini" type="button" data-act="adm-order-user" data-row="' + attr(r.no) + '">查看用户信息</button></td></tr>' +
        '<tr><th>商品 / 规格</th><td>' + esc(r.goods) + ' / ' + esc(r.spec) + '</td></tr>' +
        '<tr><th>支付 / 交付</th><td>' + esc(r.pay) + ' / ' + esc(r.deliver) + '</td></tr>' +
        '<tr><th>处理状态</th><td>' + esc(r.processStatus || '—') + (r.processedBy && r.processedBy !== '—' ? '（' + esc(r.processedBy) + ' / ' + esc(r.processedAt) + '）' : '') + '</td></tr>' +
        '<tr><th>上游状态 / 返回码</th><td>' + esc(r.supStatus || '—') + ' / ' + esc(r.supCode || '—') +
          (r.processStatus === '已处理' ? '（已人工处理）' : '') + '</td></tr>' +
        '<tr><th>钉钉通知</th><td>' + esc(r.dingStatus || '—') + '　' + esc(r.dingAt || '—') +
          '　<button class="btn mini" type="button" data-act="adm-ding-order" data-order="' + attr(r.no) + '">跳转订单管理</button>' +
          '<div class="xsmall muted">内部运营提醒，不向用户发送；正文不含完整 CDK。</div></td></tr>' +
        '<tr><th>当前口令码</th><td>' + (r.currentCode ? maskCode(r.currentCode) + '（需查码权限，完整内容不在此明文展示）' : '无有效口令码') + '</td></tr>' +
        '</tbody></table>';
      var form = view ? '' :
        '<div class="col" style="gap:8px;margin-top:10px">' +
        '<div class="row"><span class="small muted" style="width:96px;flex:none">原因<span style="color:var(--error)">*</span></span>' +
        '<input class="inp" data-code-reason="1" data-adm-req="原因" value="' + attr(cd.reason) + '" style="min-height:40px;flex:1" placeholder="必填，如：用户反馈未收到口令码" aria-label="原因"></div>' +
        '<div class="row" style="flex-wrap:wrap;gap:8px"><span class="small muted" style="width:96px;flex:none;padding-top:10px">补录口令码<span style="color:var(--error)">*</span></span>' +
        '<input class="inp" data-code-value="1" data-adm-req="补录口令码" value="' + attr(cd.code) + '" style="min-height:40px;flex:1;min-width:220px" placeholder="登录 HIgame 后台查询订单后，手工填写 CDK" aria-label="补录口令码"></div>' +
        '<div class="xsmall muted" style="margin-left:96px">异常订单不提供供应商 API 重新调用；请从上游后台查询结果手工录入，提交前核对订单与 CDK。提交后本订单只能查看，不能再次补发。</div>' +
        '<div class="hint">提交前会校验关联订单及重复提交；提交后补录口令码会写回该订单，用户可在前端订单详情查看。</div>' +
        '</div>';
      var log = '<div class="strong small" style="margin-top:14px">操作记录</div>' +
        ((r.resendLog && r.resendLog.length)
          ? '<table class="admin-table" style="margin-top:6px"><thead><tr><th>时间</th><th>操作人</th><th>类型</th><th>原因</th><th>补录口令码</th></tr></thead><tbody>' +
            r.resendLog.map(function (l) {
              return '<tr><td>' + esc(l.at) + '</td><td>' + esc(l.op) + '</td><td>' + esc(l.type) + '</td>' +
                '<td>' + esc(l.reason) + '</td><td>' + esc(maskCode(l.code)) + '</td></tr>';
            }).join('') + '</tbody></table>'
          : '<div class="xsmall muted" style="margin-top:4px">暂无操作记录</div>');
      return head + summary + form + log;
    }
  },


/* ---------- ADM-NOTIFY-01 通知记录 ---------- */
  'ADM-NOTIFY-01': {
    title: '通知记录', adm: 'ADM-16', perm: 'query',
    sub: '所有用户通知统一走站内信：按订单、平台及任务状态查看发送记录、失败原因与请求记录；模板在「模板管理」中维护，保存生成新版本。不提供任意向用户群发的入口，不发送完整 CDK（ADM-16、REQ-15）。',
    filters: [{ k: 'no', label: '订单号', type: 'text', ph: '按订单号查询' },
              { k: 'platform', label: '来源平台', type: 'select', opts: ['全部'].concat(ADM_PLATFORMS) },
              { k: 'nid', label: '任务ID', type: 'text', ph: '按通知任务ID查询' }],
    advanced: [{ k: 'nstat', label: '任务状态', type: 'select', opts: ['全部', '待发送', '发送中', '平台已受理', '发送失败', '结果未知'] },
               { k: 'tpl', label: '模板版本', type: 'select', opts: ['全部', 'TPL-CODE-ARRIVED-V1'] },
               { k: 'time', label: '创建时间（区间）', type: 'date' }],
    /* 状态页签取消，只留一个数据列表；模板管理放在页签右侧（CHG-0088） */
    tabs: ['通知记录列表'], customTabs: true,
    tabCounts: function (rt, rows) { return { '通知记录列表': rows.length }; },
    tabAction: function () { return '<button class="btn sm" type="button" data-act="adm-tpl-open">模板管理</button>'; },
    export: true,
    columns: [{ k: 'nid', t: '任务ID', w: '14%' }, { k: 'no', t: '订单号', w: '16%' },
              { k: 'platform', t: '来源平台', w: '9%', sec: true }, { k: 'goods', t: '商品', w: '18%' },
              { k: 'nstat', t: '任务状态', w: '11%' }, { k: 'tries', t: '重试次数', w: '8%', sec: true },
              { k: 'reason', t: '失败原因', w: '12%' },
              { k: '_op', t: '操作', w: '12%' }],
    rows: function () { return ADM_NOTIFY_ROWS; },
    actions: ['查看'],
    extraActions: [{ n: '重试', direct: true }],
    overlay: function (rt) { return admNotifyTplOverlay(rt); },
    drawerTitle: function (r) { return '通知详情 · ' + r.nid; },
    drawerHead: function (r, rt) {
      /* 已退款/已补发的任务不再重试，避免发送过时成功文案（NOTIFY-08） */
      /* 单列表后不再按页签判断；直接看任务状态（CHG-0088） */
      var stale = r.nstat === '结果未知';
      return '<button class="btn primary sm" type="button" data-act="adm-retry"' + (stale ? ' disabled' : '') + '>授权重试</button>' +
        '<button class="btn sm" type="button" data-act="adm-note">记录核查说明</button>';
    },
    drawer: function (r) {
      var stale = (r.nstat === '发送失败' && r.tries >= 3);
      return '<table class="admin-table"><tbody>' +
        '<tr><th style="width:26%">通知任务ID</th><td>' + esc(r.nid) + '</td></tr>' +
        '<tr><th>触发事件</th><td>支付成功、口令码已到账、人工补发完成、退款完成、好友赠送进度、订单关闭等；所有用户通知统一走站内信（NOTIFY-01、REQ-15）</td></tr>' +
        '<tr><th>订单 / 交付记录</th><td>' + esc(r.no) + ' / ' + esc(r.codeRec || '—') + '</td></tr>' +
        '<tr><th>来源平台 / 收件账号</th><td>' + esc(r.platform) + ' / ' + esc(r.buyer) + '（按订单保存的来源平台和下单平台用户ID定向发送，不因手机号相同跨平台发送，NOTIFY-02）</td></tr>' +
        '<tr><th>模板版本</th><td>' + esc(r.tpl) + '</td></tr>' +
        '<tr><th>处理状态</th><td>' + esc(r.nstat) + '　重试次数：' + r.tries + '</td></tr>' +
        '<tr><th>失败原因</th><td>' + esc(r.reason) + '</td></tr>' +
        '<tr><th>回执</th><td>接口受理不等于用户已阅读；只有平台提供可信回执时才记录送达或已读（NOTIFY-07）</td></tr>' +
        '</tbody></table>' +
        '<div class="hint" style="margin-top:8px">通知结果与支付、交付分别记录。发送失败、延迟或用户未读不回退订单交付状态、不隐藏口令码，也不重新调用供应商取码（NOTIFY-05）。' +
        '重试须校验当前订单和交付记录，已退款或交付内容已被替换时不继续发送过时成功文案（NOTIFY-08）。</div>' +
        (stale ? '<div class="banner" style="margin-top:8px;border-color:#8a641e">该订单当前状态需先核查再重试：若订单已退款或交付内容已被替换，本任务不得继续发送过时成功文案（NOTIFY-08）。请先核对订单最新状态。</div>' : '') +
        '';
    }
  },

  /* ---------- ADM-REFUND-01 特殊退款 ---------- */
  'ADM-REFUND-01': {
    title: '特殊退款', adm: 'ADM-08', perm: 'refund',
    sub: '记录客服协商结果、运营审核、执行退款、查询及处理失败。不得仅将后台订单改为"已退款"而未确认资金退回（8.3）。',
    filters: [{ k: 'id', label: '退款单号', type: 'text', ph: '按退款单号查询' },
              { k: 'order', label: '订单号', type: 'text', ph: '按订单号查询' },
              { k: 'channel', label: '退款渠道', type: 'select', opts: ['全部', '微信', '支付宝'] }],
    advanced: [{ k: 'stat', label: '退款状态', type: 'select', opts: ['全部', '待审核', '已拒绝', '退款中', '成功', '失败'] },
               { k: 'time', label: '申请时间（区间）', type: 'date' }],
    tabs: ['全部', '待审核', '退款中', '成功', '失败', '已拒绝'], tabField: function (r) { return r.stat; },
    export: true,
    columns: [{ k: 'id', t: '退款单号', w: '15%' }, { k: 'order', t: '订单号', w: '15%' },
              { k: 'amount', t: '退款金额（元）', w: '12%', fmt: function (r) { return r.amount.toFixed(2); } },
              { k: 'channel', t: '渠道', w: '8%', sec: true }, { k: 'stat', t: '状态', w: '10%' },
              { k: 'deliver', t: '交付联动', w: '19%' }, { k: 'time', t: '时间', w: '9%', sec: true },
              { k: '_op', t: '操作', w: '12%' }],
    rows: function () { return ADM_REFUND_ROWS; },
    actions: ['编辑'],
    drawerTitle: function (r) { return '退款审核 · ' + r.id; },
    drawerHead: function () {
      return '<button class="btn primary sm" type="button" data-act="adm-refund-approve">审核通过并执行退款</button>' +
        '<button class="btn sm" type="button" data-act="adm-refund-reject">拒绝</button>';
    },
    drawer: function (r) {
      var conflict = /处理中|已交付（需核查联动）/.test(r.deliver);
      return '<div class="row wrap" style="gap:6px"><span class="tag ' + (r.stat === '成功' ? 'ok' : r.stat === '失败' ? 'err' : '') + '">' + esc(r.stat) + '</span>' +
        '<span class="tag' + (conflict ? ' warn' : '') + '">交付联动：' + esc(r.deliver) + '</span></div>' +
        '<table class="admin-table" style="margin-top:8px"><tbody>' +
        '<tr><th style="width:26%">退款单号 / 订单号</th><td>' + esc(r.id) + ' / ' + esc(r.order) + '</td></tr>' +
        '<tr><th>退款金额 / 渠道</th><td>' + CNY(r.amount) + ' / ' + esc(r.channel) + '（默认沿原支付渠道处理，具体依现有支付能力评审）</td></tr>' +
        '<tr><th>协商与原因</th><td>' + esc(r.reason) + '</td></tr>' +
        '<tr><th>交付核查</th><td>' + (conflict
          ? '⚠ 存在交付联动冲突：需先核查是否已交付或仍在第三方处理中，避免退款后继续交付（8.3）。'
          : '已核查：未交付或交付已终止。') + '</td></tr>' +
        '<tr><th>审核意见</th><td><input class="inp" style="min-height:40px" placeholder="审核意见与必要凭证说明"></td></tr>' +
        '</tbody></table>' +
        '<div class="hint">退款需支持审核通过或拒绝、执行中、成功及失败跟踪；资金结果以实际渠道回执确认，不能只改状态。部分退款及多次退款规则待确认（TBD-08）。</div>' +
        '';
    }
  },

  /* ---------- ADM-PAYCHK-01 支付核查 ---------- */
  'ADM-PAYCHK-01': {
    title: '支付核查', adm: 'ADM-15', perm: 'query',
    sub: '查看支付尝试、查询记录、确认中原因及处理结果。不能人工凭用户口述改为已支付（ADM-15）。',
    filters: [{ k: 'no', label: '订单号', type: 'text', ph: '按订单号查询' },
              { k: 'platform', label: '来源平台', type: 'select', opts: ['全部'].concat(ADM_PLATFORMS) },
              { k: 'channel', label: '支付渠道', type: 'select', opts: ['全部', '微信', '支付宝'] }],
    tabs: ['全部', '待支付', '确认中'], tabField: function (r) { return r.pay; },
    columns: [{ k: 'pid', t: '支付尝试ID', w: '14%' }, { k: 'no', t: '订单号', w: '14%' }, { k: 'platform', t: '来源平台', w: '7%' },
              { k: 'amount', t: '金额（元）', w: '9%', fmt: function (r) { return r.amount.toFixed(2); } },
              { k: 'channel', t: '渠道', w: '7%' }, { k: 'pay', t: '支付状态', w: '8%' }, { k: 'attempts', t: '尝试次数', w: '7%' },
              { k: 'lastQuery', t: '最近查询', w: '11%' }, { k: 'qReason', t: '确认中原因', w: '11%' },
              { k: '_op', t: '操作', w: '12%' }],
    rows: function () { return ADM_PAYCHK_ROWS; },
    actions: ['查看'],
    drawerTitle: function (r) { return '核查记录 · ' + r.no; },
    drawerHead: function () { return '<button class="btn sm" type="button" data-act="adm-requery">发起一次服务端查询</button>'; },
    drawer: function (r) {
      return '<div class="banner" style="border-color:#a33b3b;color:#a33b3b">不能人工凭用户口述改为已支付。支付状态只能由服务端基于渠道可信结果更新（ADM-15）。</div>' +
        '<table class="admin-table" style="margin-top:8px"><thead><tr><th style="width:24%">查询时间</th><th style="width:20%">来源</th>' +
        '<th style="width:20%">结果</th><th style="width:36%">说明</th></tr></thead><tbody>' +
        '<tr><td>2026-10-15 09:31</td><td>主动查询</td><td>' + esc(r.qReason) + '</td><td>客户端支付返回后触发（PAY-07）</td></tr>' +
        '<tr><td>2026-10-15 09:33</td><td>主动查询</td><td>结果未确定</td><td>保持"支付结果确认中"，不判未付、不发码（PAY-10）</td></tr>' +
        '<tr><td>—</td><td>异步通知</td><td>未收到</td><td>异步通知与主动查询并行到达时状态需一致；晚到的未支付查询不得覆盖已支付结果（5.4）</td></tr>' +
        '</tbody></table>' +
        '<div class="hint" style="margin-top:8px">超时与晚到款须有核查流程；关闭、继续支付及晚到款处理规则待评审（PAY-06、TBD-08）。</div>' +
        '';
    }
  },

  /* ---------- ADM-AGREE-01 协议管理 ---------- */
  'ADM-AGREE-01': {
    title: '协议管理', adm: 'ADM-13', perm: 'config',
    sub: '以「修改记录列表」展示协议发布记录；编辑并发布新版本后自动生成记录与版本号，列表生效时间即发布并生效的时间（ADM-13、CHG-0089）。',
    filters: [{ k: 'ver', label: '版本', type: 'text', ph: '如 V1.0' },
              { k: 'stat', label: '状态', type: 'select', opts: ['全部', '生效中', '已停用'] }],
    /* 状态页签取消，只留修改记录列表；编辑独立在列表上方（CHG-0089） */
    tabs: ['修改记录列表'], customTabs: true,
    tabCounts: function (rt, rows) { return { '修改记录列表': rows.length }; },
    tabAction: function () { return '<button class="btn sm" type="button" data-act="adm-agree-edit">编辑协议</button>'; },
    columns: [{ k: 'ver', t: '版本', w: '9%' }, { k: 'title', t: '协议名称', w: '18%' }, { k: 'pub', t: '生效时间', w: '16%' },
              { k: 'stat', t: '状态', w: '10%' }, { k: 'orders', t: '关联订单数（模拟）', w: '14%' },
              { k: 'mode', t: '维护方式', w: '11%' }, { k: 'note', t: '说明', w: '10%' },
              { k: '_op', t: '操作', w: '12%' }],
    rows: function () { return ADM_AGREE_ROWS; },
    actions: ['查看'],
    closeText: '关闭',
    draftRow: function (rt) {
      if (!rt.agreeEditMode) return null;
      return { id: '__newver__', ver: '发布后生成', title: '购买协议', pub: '发布时生成', stat: '生效中', orders: 0, mode: '后台发布', note: '后台发布新版本', op: ADM_ROLE.name };
    },
    drawerTitle: function (r, rt) { return (rt && rt.agreeEditMode) ? '协议编辑 · 新版本' : ('协议查看 · ' + r.ver); },
    drawerMeta: function (rt, r) { return (rt && rt.agreeEditMode) ? '记录ID：发布后生成' : ('记录ID：' + ((r && r.id) || '—')); },
    drawerHead: function (r, rt) {
      return (rt && rt.agreeEditMode) ? '<button class="btn primary sm" type="button" data-act="adm-agree-publish">发布新版本</button>' : '';
    },
    drawer: function (r, rt) {
      if (rt && rt.agreeEditMode) return admAgreeEditor(rt);
      return admAgreeViewer(r);
    }
  },

  /* ---------- ADM-SERVICE-01 客服配置 ---------- */
  'ADM-SERVICE-01': {
    title: '客服配置', adm: 'ADM-09', perm: 'config', formPage: true,
    sub: '维护统一的企业微信联系方式、引导文案和已确认服务时间。客服联系方式建议后台统一维护，服务时间待运营提供（8.2、TBD-09）。'
  },

  /* ---------- ADM-RBAC-01 权限管理 ---------- */
  'ADM-RBAC-01': {
    title: '权限管理', adm: 'ADM-10', perm: 'config',
    sub: '按角色授权后台菜单；支持新增角色、配置角色菜单权限和给账号分配角色。敏感操作仍由服务端校验（ADM-10、3.7、CHG-0089）。',
    filters: [{ k: 'nm', label: '账号 / 角色', type: 'text', ph: '按账号或角色查询' },
              { k: 'role', label: '角色', type: 'select', opts: ['全部', '运营', '客服', '财务', '管理员'] },
              { k: 'state', label: '状态', type: 'select', opts: ['全部', '启用', '停用'] }],
    tabs: ['账号列表', '角色列表'], customTabs: true,
    tabCounts: function () { return { '账号列表': ADM_ACCOUNTS.length, '角色列表': ADM_ROLES.length }; },
    tabAction: function (rt) {
      return rt.tab === '角色列表' ? '<button class="btn sm" type="button" data-act="adm-rbac-add-role">新增角色</button>' : '';
    },
    columns: function () {
      var rt = admRT('ADM-RBAC-01');
      if (rt.tab === '角色列表') {
        return [{ k: 'id', t: '角色ID', w: '10%' }, { k: 'nm', t: '角色', w: '12%' },
                { k: 'desc', t: '说明', w: '16%', sec: true }, { k: 'acc', t: '账号数', w: '8%' },
                { k: '_menus', t: '菜单权限', w: '34%', raw: function (r) {
                  var txt = admRbacMenusText(r);
                  return '<span class="ellip" title="' + attr(txt) + '">' + esc(txt) + '</span>';
                } },
                { k: 'updatedAt', t: '最近更新', w: '11%', sec: true },
                { k: '_op', t: '操作', w: '9%' }];
      }
      return [{ k: 'id', t: '账号ID', w: '12%' }, { k: 'nm', t: '账号', w: '16%' }, { k: 'role', t: '角色', w: '14%' },
              { k: 'platform', t: '数据范围', w: '18%' }, { k: 'state', t: '状态', w: '12%' },
              { k: 'last', t: '最近登录', w: '18%' }, { k: '_op', t: '操作', w: '10%' }];
    },
    rows: function () {
      var rt = admRT('ADM-RBAC-01');
      return rt.tab === '角色列表' ? ADM_ROLES : ADM_ACCOUNTS;
    },
    actions: [],
    /* 同一入口按行区分：角色＝配置权限，账号＝分配角色 */
    extraActions: [{ n: function (r) { return r.menus ? '配置权限' : '分配角色'; } }],
    draftRow: function (rt) {
      if (!rt.rbacNewRole) return null;
      return { id: '__newrole__', nm: '', desc: '', acc: 0, menus: [], updatedAt: '—', op: '—' };
    },
    drawerTitle: function (r, rt) {
      if (rt && rt.rbacNewRole) return '新增角色';
      return r.menus ? ('配置角色权限 · ' + r.nm) : ('分配角色 · ' + r.nm);
    },
    drawerMeta: function (rt, r) { return (rt && rt.rbacNewRole) ? '记录ID：保存后分配' : ('记录ID：' + ((r && r.id) || '—')); },
    drawerHead: function (r, rt) {
      if (r.menus || (rt && rt.rbacNewRole)) {
        return '<button class="btn primary sm" type="button" data-act="adm-rbac-save">' + ((rt && rt.rbacNewRole) ? '保存角色' : '保存权限') + '</button>';
      }
      return '<button class="btn primary sm" type="button" data-act="adm-rbac-save">保存角色</button>';
    },
    drawer: function (r, rt) {
      if (r.menus || (rt && rt.rbacNewRole)) return admRbacRoleDrawer(r, rt);
      return admRbacAccountDrawer(r, rt);
    }
  },

  /* ---------- ADM-AUDIT-01 操作记录 ---------- */
  'ADM-AUDIT-01': {
    title: '操作记录', adm: 'ADM-11', perm: 'config',
    sub: '留存敏感操作结果、人员、时间及原因，支持按订单追踪。查码、补发、退款和导出为敏感操作，应明确权限并记录审计信息（9.2）。',
    filters: [{ k: 'op', label: '操作人', type: 'text', ph: '按操作人查询' },
              { k: 'act', label: '操作类型', type: 'select', opts: ['全部', '口令码补发', '口令码查看', '赠送批次导出', '退款执行', '权限变更', '商品下架', '通知重试', '订单查询', '商品编辑'] },
              { k: 'obj', label: '对象编号', type: 'text', ph: '按订单号 / 批次号 / 账号查询' }],
    advanced: [{ k: 'role', label: '角色', type: 'select', opts: ['全部', '运营', '客服', '财务', '管理员'] },
               { k: 'time', label: '操作时间（区间）', type: 'date' }],
    tabs: ['全部', '敏感操作', '查询类'], customTabs: true,
    export: true, batch: true,
    columns: [{ k: 'id', t: '记录ID', w: '13%' }, { k: 'op', t: '操作人', w: '10%' },
              { k: 'act', t: '操作类型', w: '14%' }, { k: 'obj', t: '对象', w: '17%' },
              { k: 'before', t: '变更前', w: '11%', sec: true }, { k: 'after', t: '变更后', w: '11%', sec: true },
              { k: 'time', t: '时间', w: '12%' },
              { k: '_op', t: '操作', w: '12%' }],
    rows: function () {
      var rt = admRT('ADM-AUDIT-01');
      var sensitive = ['口令码补发', '口令码查看', '赠送批次导出', '退款执行', '权限变更', '商品下架'];
      if (rt.tab === '敏感操作') return ADM_AUDIT_ROWS.filter(function (r) { return sensitive.indexOf(r.act) >= 0; });
      if (rt.tab === '查询类') return ADM_AUDIT_ROWS.filter(function (r) { return sensitive.indexOf(r.act) < 0; });
      return ADM_AUDIT_ROWS;
    },
    actions: ['查看'],
    drawerTitle: function (r) { return '操作记录 · ' + r.id; },
    drawerHead: function () { return '<button class="btn sm" type="button" data-act="adm-export">导出当前结果</button>'; },
    drawer: function (r) {
      return '<table class="admin-table"><tbody>' +
        '<tr><th style="width:24%">记录ID</th><td>' + esc(r.id) + '</td></tr>' +
        '<tr><th>操作人 / 角色</th><td>' + esc(r.op) + ' / ' + esc(r.role) + '</td></tr>' +
        '<tr><th>操作类型</th><td>' + esc(r.act) + '</td></tr>' +
        '<tr><th>操作对象</th><td>' + esc(r.obj) + '</td></tr>' +
        '<tr><th>变更前 / 变更后</th><td>' + esc(r.before) + ' → ' + esc(r.after) + '</td></tr>' +
        '<tr><th>原因</th><td>' + esc(r.reason) + '</td></tr>' +
        '<tr><th>时间 / 来源IP</th><td>' + esc(r.time) + ' / ' + esc(r.ip) + '</td></tr>' +
        '</tbody></table>' +
        '<div class="hint" style="margin-top:8px">操作记录为后台审计留痕，<b>不属于客户端业务埋点</b>，不在 06 埋点文档中登记（标准 1.5、12.1）。' +
        '按订单追踪时可通过"对象"列关联订单号。</div>' +
        '';
    }
  },

  /* ---------- ADM-STAT-01 基础统计 ---------- */
  'ADM-STAT-01': {
    title: '基础统计', adm: 'ADM-12', perm: 'query',
    sub: '按平台、商品类型及时间统计订单、实收、退款和交付情况。销售额、实收、退款额和订单量分别定义，不混用创建订单额与实际到账额（9.3）。',
    filters: [{ k: 'platform', label: '来源平台', type: 'select', opts: ['全部'].concat(ADM_PLATFORMS) },
              { k: 'type', label: '商品类型', type: 'select', opts: ['全部', '口令码', '好友赠送'] },
              { k: 'time', label: '统计区间', type: 'date' }],
    metrics: true,
    metricDefs: function (rows) {
      var paid = rows.filter(function (r) { return r.pay === '已支付'; });
      var sum = paid.reduce(function (a, b) { return a + b.amount; }, 0);
      var refund = ADM_REFUND_ROWS.filter(function (r) { return r.stat === '成功'; }).reduce(function (a, b) { return a + b.amount; }, 0);
      return [
        { k: '订单量（笔）', v: rows.length, u: '创建订单数，不等于实收' },
        { k: '销售额（元）', v: (sum + 460).toFixed(2), u: '按订单成交金额统计（模拟口径待评审）' },
        { k: '实收（元）', v: sum.toFixed(2), u: '已支付且渠道确认的金额合计' },
        { k: '退款额（元）', v: refund.toFixed(2), u: '以资金结果确认成功的退款单合计' },
        { k: '已交付（笔）', v: rows.filter(function (r) { return r.code === '已交付' || r.gift === '已完成'; }).length, u: '口令码已交付或赠送已完成' },
        { k: '交付异常（笔）', v: rows.filter(function (r) { return r.code === '交付异常' || r.gift === '异常'; }).length, u: '需人工介入' }
      ];
    },
    tabs: ['按来源平台', '按商品类型', '按日期'], customTabs: true,
    statGroup: true,
    columns: [{ k: 'g', t: '统计维度', w: '20%' }, { k: 'orders', t: '订单量（笔）', w: '13%' },
              { k: 'sales', t: '销售额（元）', w: '15%' }, { k: 'paid', t: '实收（元）', w: '15%' },
              { k: 'refund', t: '退款额（元）', w: '14%' }, { k: 'delivered', t: '已交付（笔）', w: '12%' },
              { k: 'abnormal', t: '交付异常（笔）', w: '11%' }],
    rows: function () {
      var rt = admRT('ADM-STAT-01');
      var base = ADM_ORDERS;
      function agg(keyFn, labelFn) {
        var m = {};
        base.forEach(function (r) {
          var k = keyFn(r);
          if (!m[k]) m[k] = { id: k, g: labelFn(r), orders: 0, sales: 0, paid: 0, refund: 0, delivered: 0, abnormal: 0 };
          m[k].orders++;
          m[k].sales += r.amount;
          if (r.pay === '已支付') m[k].paid += r.amount;
          if (r.code === '已交付' || r.gift === '已完成') m[k].delivered++;
          if (r.code === '交付异常' || r.gift === '异常') m[k].abnormal++;
        });
        return Object.keys(m).map(function (k) {
          var o = m[k];
          return { id: o.id, g: o.g, orders: o.orders, sales: o.sales.toFixed(2), paid: o.paid.toFixed(2), refund: '0.00', delivered: o.delivered, abnormal: o.abnormal };
        });
      }
      if (rt.tab === '按商品类型') return agg(function (r) { return r.type; }, function (r) { return r.type; });
      if (rt.tab === '按日期') return agg(function (r) { return r.time.slice(0, 10); }, function (r) { return r.time.slice(0, 10); });
      return agg(function (r) { return r.platform; }, function (r) { return r.platform; });
    },
    noDrawer: true,
    footerNote: '口径说明：销售额、实收、退款额和订单量分别定义，不混用创建订单额与实际到账额（9.3）。时区 Asia/Shanghai；统计区间默认最近 15 天（模拟值）。是否提供报表导出、利润及供应商成本统计、复杂结算报表待评审（TBD-08）；首期不默认建设各入口公司分账系统。'
  },

  /* ---------- ADM-LOGIN-01 后台登录 ---------- */
  'ADM-LOGIN-01': {
    title: '后台登录', adm: 'ADM-10', perm: 'none', loginPage: true,
    sub: '运营后台为独立管理端，目标设备及浏览器范围待技术评审明确（2.4）。'
  }
});
