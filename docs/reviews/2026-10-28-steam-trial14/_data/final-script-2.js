
/* ============================================================
   APP-PHONE-01 绑定手机号（商城账号主动绑定）
   ============================================================ */
function rPhone(page, st) {
  var c = 'APP-PHONE-01-C';
  var s = RV.session;
  var bound = st === 'BOUND' || (s.phone === 'bound' && !s.bindChange);
  var sent = s.bindSmsSent || st === 'CODE_SENT';
  var err = s.bindErr || (st === 'ERROR' ? '手机号或验证码不正确，请重试。' : '');
  var current = s.phoneMasked || '138****6721';
  var changing = s.phone === 'bound';
  var fromBuy = s.bindFrom === 'BUY';
  var status, form, actions;
  if (bound) {
    status = C(c + '02',
      '<div class="center" style="padding:16px 6px 8px">' +
        '<div class="qr-ok" style="margin:0 auto 10px">✓</div>' +
        '<div class="strong" style="font-size:16px">手机号已绑定商城账号</div>' +
        '<div class="small muted" style="margin-top:6px">' + esc(current) + '</div>' +
      '</div>', 'div', 'card');
    form = C(c + '03',
      '<div class="small" style="line-height:1.8">手机号仅用于购买下单、订单通知与账号安全，展示时脱敏；商城不会把手机号提供给平台，也不从平台读取手机号。</div>' +
      '<div class="hint">如需更换手机号，需先验证新号码；旧号码验证通过后解除绑定。</div>', 'div', 'card');
    actions = C(c + '04',
      '<button class="btn primary wide" type="button" data-act="bind-change">更换手机号</button>' +
      '<button class="btn wide" type="button" data-act="go" data-to="APP-MINE-01" style="margin-top:8px">返回我的</button>', 'div', 'card');
  } else {
    status = C(c + '02',
      '<div class="small" style="line-height:1.75">绑定手机号后可用于购买下单、订单通知与账号安全。手机号由你主动填写并通过短信验证码验证，<b>商城不会从所属平台读取或绑定手机号</b>。</div>' +
      (changing ? '<div class="banner" style="margin-top:10px"><span class="grow">当前绑定：' + esc(current) + '；验证新号码后完成更换。</span></div>' : '') +
      (fromBuy ? '<div class="banner" style="margin-top:10px"><span class="grow">完成绑定后将返回原购买面板，继续本次购买。</span></div>' : ''), 'div', 'card');
    form = C(c + '03',
      (err ? '<div class="banner" style="border-color:#a33b3b;color:#a33b3b;margin-bottom:8px"><span class="grow">' + esc(err) + '</span></div>' : '') +
      (sent ? '<div class="banner" style="margin-bottom:8px"><span class="grow">验证码已发送至 ' + esc(s.bindSmsPhone || current) + '（模拟）；60 秒内不可重复发送。</span></div>' : '') +
      '<div class="row" style="gap:8px"><span class="small muted" style="width:64px;flex:none">手机号</span>' +
        '<input class="inp" data-bind-phone="1" value="' + attr(s.bindPhone || '') + '" maxlength="11" inputmode="numeric" placeholder="请输入 11 位手机号" aria-label="手机号" style="flex:1"></div>' +
      '<div class="row" style="gap:8px;margin-top:10px"><span class="small muted" style="width:64px;flex:none">验证码</span>' +
        '<input class="inp" data-bind-code="1" value="' + attr(s.bindCode || '') + '" maxlength="6" inputmode="numeric" placeholder="6 位短信验证码" aria-label="验证码" style="flex:1">' +
        '<button class="btn sm" type="button" data-act="bind-send"' + (sent ? ' disabled' : '') + ' style="flex:none">' + (sent ? '已发送' : '获取验证码') + '</button></div>' +
      '<label class="row check-row" style="gap:8px;margin-top:10px"><input type="checkbox" data-bind-agree="1" ' + (s.bindAgree ? 'checked' : '') + ' style="width:18px;height:18px;flex:none;margin-top:3px">' +
        '<span class="small">我已阅读并同意《隐私政策》</span></label>' +
      '<div class="hint">短信服务与验证码校验为模拟；原型不发送真实短信、不保存完整手机号。</div>', 'div', 'card');
    actions = C(c + '04',
      '<button class="btn primary wide" type="button" data-act="bind-submit">确认绑定</button>' +
      '<div class="hint center">成功后写入商城账号绑定关系；返回、失败或结果未知不改变绑定状态；退出使用左上角返回。</div>', 'div', 'card');
  }
  return phoneShell(
    navBar(c + '01', '绑定手机号', '商城账号安全验证') + status + form + actions);
}

/* ============================================================
   APP-CHECKOUT-01 确认订单
   ============================================================ */
function rCheckout(page, st, sim) {
  var c = 'APP-CHECKOUT-01-C';
  var o = Object.assign({}, MOCK_ORDER, RV.session.order || {});
  var gd = g(o.goodsId);
  var closed = st === 'EXPIRED';
  var readonly = st === 'READONLY';
  var submitting = st === 'SUBMITTING';
  var head = navBar(c + '01', '确认订单', '未支付返回与继续支付共用本页');
  if (st === 'ERROR' || sim === 'fail') {
    return phoneShell(head + stateBlock('', 'error', '订单读取失败', '已保留订单号，可重试；刷新或重新进入会恢复服务端实际状态（ORDER-05）。', '重试', 'retry'));
  }
  var info = C(c + '02',
    '<div class="row"><span class="small muted">订单号</span><span class="small brk grow">' + esc(o.no) + '</span>' +
    '<button class="btn sm" type="button" data-act="copy" data-copy="' + attr(o.no) + '">复制</button></div>' +
    '<div class="hint">支持复制订单编号；联系客服时需提供订单编号（ORDER-04、8.2）。订单 30 分钟内有效，超时未支付将关闭。</div>', 'div', 'card');
  var detail = C(c + '03',
    '<div class="row" style="gap:8px;align-items:flex-start">' + thumb(gd, 56).replace('height:56px', 'height:56px;width:80px;flex:none') +
    '<div class="grow col" style="gap:2px">' +
      '<span class="small">' + esc(gd.nm) + '－' + esc(o.spec) + '</span>' +
      '<span class="xsmall muted">数量 ×1　发货方式：' + esc(wayText(wayOf(gd))) + '</span>' +
      '<span class="xsmall muted">' + esc(regionOf(gd, RV.session.way)) + '</span></div></div>' +
    '<div class="hint">成交商品、价格、规格、交付规则与协议版本将保存快照，运营修改不覆盖历史信息（CHECKOUT-05）</div>', 'div', 'card') +
    (goodsStockNote(gd, wayOf(gd)) ? '<div class="banner"><span class="grow">' + esc(goodsStockNote(gd, wayOf(gd))) + '</span></div>' : '');
  var link = wayOf(gd) === 'GIFT' ? C(c + '04',
    '<div class="sect-t">Steam 好友链接</div>' +
    '<input class="inp" id="flink2" value="' + attr(RV.session.link || o.friendLink || '') + '" ' + (readonly ? 'readonly' : '') + ' aria-label="Steam好友链接">' +
    '<div class="hint keep-note">' + (readonly
      ? '付款后好友链接已锁定，不可修改。'
      : '付款前可修改；付款后不可修改，请仔细核对。') + '</div>', 'div', 'card') : '';
  var pay = C(c + '05',
    '<div class="sect-t">支付方式</div><div class="row wrap" style="gap:8px">' +
    [['WECHAT', '微信支付'], ['ALIPAY', '支付宝']].map(function (p) {
      return '<button class="tag' + ((RV.session.pay || o.payChannel) === p[0] ? ' on' : '') + '" type="button" data-act="pay" data-pay="' + p[0] +
        '" style="padding:8px 12px;margin:0"' + (readonly ? ' disabled' : '') + '>' + p[1] + '</button>';
    }).join('') + '</div>' +
    '<div class="hint">继续支付同一订单时重新校验购买条件；更换渠道前需核实旧支付尝试，避免两个渠道同时有效导致重复付款（PENDING-05）。</div>', 'div', 'card');
  var amount = o.amount;
  var priceTbl = C(c + '06',
    '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
    '<tr><td style="padding:5px 0">商品总价</td><td style="text-align:right">' + CNY(o.amount) + '</td></tr>' +
    '<tr><td style="padding:5px 0;border-top:1px solid #c9cdd3"><b>应付总额</b></td><td style="text-align:right;border-top:1px solid #c9cdd3"><b>' + CNY(amount) + '</b></td></tr>' +
    '</table><div class="hint">无优惠券、积分抵扣与余额抵扣项（CHECKOUT-01）</div>', 'div', 'card');
  var agr = C(c + '07',
    '<label class="row check-row" style="gap:8px">' +
    '<input type="checkbox" data-act="agr" ' + (RV.session.agreementOk ? 'checked' : '') + ' style="width:18px;height:18px;flex:none;margin-top:3px">' +
    '<span class="small">我已阅读并同意《购买协议》<span class="muted">（V1.0）</span></span></label>' +
    '<div class="hint">保留此前选择；版本变化时需重新确认（AGREEMENT-04）</div>', 'div', 'card');
  var countdown = C(c + '09',
    '<div class="banner"><span class="grow">订单 30 分钟内有效；超时未支付将自动关闭。</span></div>' +
    '<div class="hint">不展示倒计时；下单价格已锁定，支付按下单快照金额，价格变化无需重新确认；关闭后重新下单按实时价格计算（CHG-0096）。</div>', 'div', '');
  var bottom = C(c + '08',
    (closed ? '<div class="banner" style="margin-bottom:8px"><span class="grow">订单已超过 30 分钟，已关闭；请重新下单，价格以实时价格为准。</span></div>' : '') +
    '<button class="btn primary wide" type="button" data-act="pay-continue"' + (submitting || readonly || closed ? ' disabled' : '') + '>' +
    (submitting ? '处理中…' : (closed ? '订单已关闭' : (readonly ? '该订单已支付，不可再次付款' : '继续支付 ' + CNY(amount)))) + '</button>' +
    '<div class="hint center">防重复提交；服务端并发校验避免重复建单（CHECKOUT-06）</div>', 'div', 'bottom-bar');
  return phoneShell(head + info + detail + link + pay + priceTbl + agr + countdown + bottom);
}

/* ============================================================
   APP-PAYRET-01 支付返回确认
   ============================================================ */
function rPayret(page, st) {
  var querying = st === 'QUERYING';
  var timeout = st === 'TIMEOUT';
  var inner;
  if (timeout) {
    inner = modalMask('APP-PAYRET-01-C01', 'center',
      modalHead('支付结果确认中', false) +
      C('APP-PAYRET-01-C05',
        '<div class="small">暂时无法确认这笔订单的支付结果，请稍后重新查询。在结果明确前，<b>请不要重复付款</b>。</div>' +
        '<div class="hint">查询失败或渠道处理中时保留"支付结果确认中"，提供重新查询、查看订单及客服入口（PAY-10）</div>', 'div', '') +
      '<div class="col" style="gap:8px;margin-top:12px">' +
      '<button class="btn primary wide" type="button" data-act="pay-query-again">重新查询</button>' +
      '<button class="btn wide" type="button" data-act="go" data-to="APP-ORDER-01">查看订单</button>' +
      '<button class="btn wide" type="button" data-act="go" data-to="APP-SERVICE-01">联系客服</button></div>');
  } else {
    inner = modalMask('APP-PAYRET-01-C01', 'center',
      C('APP-PAYRET-01-C02', '<div class="center" style="font-size:16px;font-weight:500;margin:10px 0 4px">您是否已经完成了支付？</div>' +
        '<div class="hint center">支付返回、页面恢复可见、刷新或从订单页重进时，先按当前订单主动向服务端查询；仅在仍未得到结论时才询问（PAY-07、PAY-08）</div>', 'div', '') +
      (querying ? C('APP-PAYRET-01-C05',
        '<div class="banner" style="margin-top:10px"><span class="grow">正在向服务端查询支付结果…</span></div>' +
        '<div class="hint">查询中防重复点击（PAY-09）</div>', 'div', '') : '') +
      '<div class="row" style="gap:10px;margin-top:12px">' +
        C('APP-PAYRET-01-C03', '<button class="btn grow" type="button" data-act="pay-choose" data-choose="N" ' + (querying ? 'disabled' : '') + '>未支付</button>', 'div', 'grow') +
        C('APP-PAYRET-01-C04', '<button class="btn primary grow" type="button" data-act="pay-choose" data-choose="Y" ' + (querying ? 'disabled' : '') + '>已支付</button>', 'div', 'grow') +
      '</div>' +
      '<div class="hint center">两个选项都只触发接口查询，用于表达您的操作情况，<b>不会修改订单支付状态</b>（PAY-08）</div>');
  }
  return phoneShell(
    navBar('APP-CHECKOUT-01-C01', '确认订单', '支付返回确认演示页', '') +
    '<div class="card"><div class="sk h20" style="margin-bottom:6px"></div><div class="sk" style="width:60%"></div></div>',
    inner);
}

/* ============================================================
   APP-RESULT-01 支付与交付结果页
   ============================================================ */
function rResult(page, st, sim) {
  var c = 'APP-RESULT-01-C';
  var gift = /^GIFT/.test(st);
  var failed = st === 'PAY_FAILED';
  var closed = st === 'ORDER_CLOSED';
  var late = st === 'LATE_PAY';
  var confirming = st === 'PAY_CONFIRMING';
  var o = Object.assign({}, gift ? MOCK_GIFT_ORDER : MOCK_ORDER,
    { payStatus: (failed || closed) ? 'PAY::PENDING' : 'PAY::PAID', codeStatus: /ISSUING/.test(st) ? 'CODE::ISSUING' : (/EXCEPTION/.test(st) ? 'CODE::EXCEPTION' : 'CODE::DELIVERED') });
  var gd = g(o.goodsId);
  var head = navBar(c + '01', '支付与交付结果', '支付成功与交付完成分别展示', '<button class="ico-btn" type="button" data-act="go" data-to="APP-SERVICE-01">客服</button>');
  if (st === 'ERROR' || sim === 'fail') {
    return phoneShell(head + stateBlock('', 'error', '结果读取失败', '刷新、关闭后重进或从"我的订单"进入均会恢复服务端状态（RESULT-04）。', '重试', 'retry'));
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
  var summary = C(c + '02',
    '<div class="row wrap"><span class="tag ' + (confirming || failed ? 'warn' : (closed ? 'err' : 'ok')) + '">支付状态：' + payText + '</span>' +
    '<span class="tag ' + (closed ? 'err' : '') + '">订单状态：' + orderText + '</span>' +
    '<span class="tag">交付状态：' + (gift ? giftStatusText(st) : (closed || failed || late || confirming ? '未启动' : codeStatusText(st))) + '</span></div>' +
    '<hr class="hr">' +
    '<div class="kv"><span class="k">订单号</span><span class="v brk">' + esc(o.no) + '</span></div>' +
    '<div class="kv"><span class="k">商品</span><span class="v">' + esc(gd.nm) + '－' + esc(o.spec) + ' ×1</span></div>' +
    '<div class="kv"><span class="k">' + (failed || closed ? '订单金额' : '实付金额') + '</span><span class="v">' + CNY(o.amount) + '</span></div>' +
    '<div class="kv"><span class="k">下单价格</span><span class="v">已锁定，支付与退款均按下单快照金额；价格变化无需重新确认</span></div>' +
    (confirming ? '<div class="banner" style="margin-top:8px">尚未取得可信支付结果，不会发码、也不按未支付新建交易；可重新查询。</div>' +
      '<div class="hint">自动查询节奏：返回后立即查询，2s/3s/5s 递增，最长 60 秒；超时后可手动刷新，后台继续补偿查询。</div>' : '') +
    (failed ? '<div class="banner" style="margin-top:8px"><span class="grow">支付未完成或已取消，未扣款、未发码。订单在 30 分钟内仍可继续支付。</span></div>' : '') +
    (closed ? '<div class="banner" style="margin-top:8px"><span class="grow">订单超过 30 分钟未支付，已自动关闭；未扣款、未发码。重新下单按实时价格计算。</span></div>' : '') +
    (late ? '<div class="banner" style="margin-top:8px;border-color:#8a641e"><span class="grow">支付结果到达时订单已关闭，属于晚到款：不自动发货，已转人工审核；确认后按原支付渠道退款。</span></div>' : '') +
    '<div class="hint">"已付款"不等于"已交付"，两者分别展示（RESULT-01、5.5）</div>', 'div', 'card');
  var deliverBlock;
  if (gift) {
    deliverBlock = C(c + '04',
      '<div class="sect-t">好友赠送交付</div>' +
      '<div class="kv"><span class="k">交付状态</span><span class="v">' + giftStatusText(st) + '</span></div>' +
      '<div class="kv"><span class="k">好友链接</span><span class="v brk">' + esc(o.friendLink) + '（付款时锁定）</span></div>' +
      '<div class="small" style="margin-top:6px">服务时段：工作日 8:00～18:00（中国标准时间）。工作时间内下单预计 2～6 小时完成，非工作时段顺延至下一工作时段；节假日沿用同一工作时段，不展示精确倒计时、不自动判定违约（REQ-13）。</div>' +
      '<div class="hint">' + (st === 'GIFT_EXCEPTION'
        ? '赠送异常：请通过企业微信客服提供订单号，由客服核查批次与供应商进度（GIFT-05）。'
        : '付款后不直接标记赠送完成，由运营核实好友是否收到后标记完成（GIFT-04／06）。临近 18:00 的计时口径待运营确认（TBD-02）。') + '</div>', 'div', 'card');
  } else {
    var codeHtml;
    if (closed) {
      codeHtml = '<div class="empty"><span class="t">［订单已关闭］</span>未支付、未发码；请在商城重新下单，价格以实时价格为准。</div>';
    } else if (failed) {
      codeHtml = '<div class="empty"><span class="t">［支付未完成］</span>未扣款、未发码；订单保留至 30 分钟有效期结束，可继续支付。</div>';
    } else if (late) {
      codeHtml = '<div class="empty" style="border-color:#8a641e"><span class="t" style="color:#8a641e">［晚到款处理中］</span>支付已到账但订单已关闭，商城不自动发货；运营正在人工审核，确认后原路退款。</div>';
    } else if (confirming) {
      codeHtml = '<div class="empty"><span class="t">［支付确认中］</span>尚未取得可信支付结果，不发码、不新建订单、不重复扣款。请等待自动查询或手动刷新。</div>';
    } else if (st === 'ISSUING') {
      codeHtml = '<div class="empty"><span class="t">［发码中］</span>服务端已确认支付，正在向供应商获取口令码。取得后自动展示，无需重新付款。</div>';
    } else if (st === 'EXCEPTION') {
      codeHtml = '<div class="empty" style="border-color:#a33b3b;color:#a33b3b"><span class="t" style="color:#a33b3b">［交付异常］</span>' +
        '本次未取得有效口令码。请通过企业微信客服并提供订单编号，由客服查验支付与交付状态。' +
        '<div style="margin-top:8px"><button class="btn sm" type="button" data-act="copy" data-copy="' + attr(o.no) + '">复制订单号</button></div></div>' +
        '<div class="hint">不伪造口令码；不将付款成功直接等同于交付成功（CODE-03、RESULT-02）</div>';
    } else {
      codeHtml = '<div class="code-box" id="codebox">' + esc(latestCode(o.no, MOCK_CODE)) + '</div>' +
        '<div class="row" style="gap:8px;margin-top:8px">' +
        '<button class="btn sm" type="button" data-act="copy" data-copy="' + esc(latestCode(o.no, MOCK_CODE)) + '">复制口令码</button>' +
        '<span class="xsmall muted">请在 Steam 客户端"添加游戏 → 在 Steam 上激活产品"中完成激活</span></div>' +
        '<div class="hint">商城无激活查询能力时不展示"已激活"状态（CODE-04）</div>';
    }
    deliverBlock = C(c + '03',
      '<div class="sect-t">口令码交付</div>' + codeHtml +
      (st === 'EXCEPTION' ? '' : '<div class="hint">口令码加密保存、按权限查看，不在普通日志或常规报表中输出完整内容（CODE-08）。</div>'), 'div', 'card');
  }
  var entry;
  if (confirming) {
    entry = C(c + '05', '<div class="col" style="gap:8px">' +
      '<button class="btn primary wide" type="button" data-act="pay-query-again">重新查询支付结果</button>' +
      '<button class="btn wide" type="button" data-act="go" data-to="APP-ORDER-02">查看订单</button>' +
      '<button class="btn wide" type="button" data-act="go" data-to="APP-SERVICE-01">企业微信客服</button></div>' +
      '<div class="hint center">查询中请勿重复付款；超过 60 秒仍未明确时可手动刷新，后台补偿任务继续查询。</div>', 'div', 'bottom-bar');
  } else if (closed) {
    entry = C(c + '05', '<div class="col" style="gap:8px">' +
      '<button class="btn primary wide" type="button" data-act="go" data-to="APP-PRODUCT-01">重新下单</button>' +
      '<button class="btn wide" type="button" data-act="go" data-to="APP-ORDER-02">查看订单</button></div>' +
      '<div class="hint center">重新下单按商品实时价格计算；已关闭订单不占用库存。</div>', 'div', 'bottom-bar');
  } else if (failed) {
    entry = C(c + '05', '<div class="col" style="gap:8px">' +
      '<button class="btn primary wide" type="button" data-act="go" data-to="APP-CHECKOUT-01">继续支付</button>' +
      '<button class="btn wide" type="button" data-act="go" data-to="APP-ORDER-02">查看订单</button>' +
      '<button class="btn wide" type="button" data-act="go" data-to="APP-SERVICE-01">企业微信客服</button></div>' +
      '<div class="hint center">支付失败或取消不改变订单价格；30 分钟内可继续支付。</div>', 'div', 'bottom-bar');
  } else if (late) {
    entry = C(c + '05', '<div class="col" style="gap:8px">' +
      '<button class="btn primary wide" type="button" data-act="go" data-to="APP-SERVICE-01">联系客服</button>' +
      '<button class="btn wide" type="button" data-act="go" data-to="APP-ORDER-02">查看订单</button></div>' +
      '<div class="hint center">晚到款不自动发货；人工审核确认后按原支付渠道退款。</div>', 'div', 'bottom-bar');
  } else {
    entry = C(c + '05',
      '<div class="col" style="gap:8px">' +
      '<button class="btn primary wide" type="button" data-act="go" data-to="APP-ORDER-02">查看订单</button>' +
      '<button class="btn wide" type="button" data-act="go" data-to="APP-SERVICE-01">企业微信客服</button></div>' +
      '<div class="hint center">刷新、关闭后重进及从"我的订单"进入均恢复服务端状态；人工补发后同步最新交付记录，不要求重新付款（RESULT-04）</div>', 'div', 'bottom-bar');
  }
  return phoneShell(head + summary + deliverBlock + entry);
}
function codeStatusText(st) {
  if (st === 'ORDER_CLOSED' || st === 'PAY_FAILED' || st === 'LATE_PAY' || st === 'PAY_CONFIRMING') return '未启动';
  return st === 'ISSUING' ? '发码中' : (st === 'EXCEPTION' ? '交付异常' : '已交付');
}
function giftStatusText(st) {
  if (st === 'ORDER_CLOSED' || st === 'PAY_FAILED' || st === 'LATE_PAY' || st === 'PAY_CONFIRMING') return '未启动';
  return st === 'GIFT_PROCESSING' ? '处理中' : st === 'GIFT_DONE' ? '已完成' : st === 'GIFT_EXCEPTION' ? '异常' : '待处理';
}

/* ============================================================
   APP-ORDER-01 我的订单
   ============================================================ */
var ORDER_ROWS = [
  { no:'SO2026101500012345', goodsId:'P1001', spec:'标准版', amount:128.00, t:'2026-10-15 09:04', pay:'PAY::PENDING', deliver:'CODE::NOT_STARTED', expireAt:'2026-10-15 09:34' },
  { no:'SO2026101500012399', goodsId:'P1003', spec:'标准版', amount:199.00, t:'2026-10-15 09:12', pay:'PAY::PAID', deliver:'GIFT::PROCESSING' },
  { no:'SO2026101500012311', goodsId:'P1002', spec:'豪华版', amount:298.00, t:'2026-10-15 08:51', pay:'PAY::PAID', deliver:'CODE::DELIVERED' },
  /* 已支付但交付异常：主状态为「待发货」，进入口令交付人工处理（CHG-0096） */
  { no:'SO2026101500012288', goodsId:'P1002', spec:'标准版', amount:258.00, t:'2026-10-15 08:30', pay:'PAY::PAID', deliver:'CODE::EXCEPTION' },
  /* 退款中不改主状态：仍为「待发货」，只加「退款中」标记（CHG-0096） */
  { no:'SO2026101500012255', goodsId:'P1005', spec:'标准版', amount:269.00, t:'2026-10-15 08:20', pay:'PAY::PAID', deliver:'CODE::DELIVERED', refundStatus:'退款中', refundReason:'用户与企业微信客服协商退款，等待渠道回执' },
  /* 支付结果未确定的单据仍属「待支付」，只加一行提示——避免用户在结果不明时重复付款（CHG-0048） */
  { no:'SO2026101400011880', goodsId:'P1004', spec:'标准版', amount:198.17, t:'2026-10-14 21:32', pay:'PAY::PENDING', deliver:'CODE::NOT_STARTED', uncertain:true, expireAt:'2026-10-14 22:02' },
  { no:'SO2026101400011702', goodsId:'P1005', spec:'标准版', amount:269.00, t:'2026-10-14 19:08', pay:'PAY::PENDING', deliver:'CODE::NOT_STARTED', expireAt:'2026-10-14 19:38' },
  { no:'SO2026101400011620', goodsId:'P1001', spec:'标准版', amount:128.00, t:'2026-10-14 11:40', pay:'PAY::PENDING', deliver:'CODE::NOT_STARTED', closed:true, closeReason:'超时未支付' },
  { no:'SO2026101400011666', goodsId:'P1008', spec:'标准版', amount:24.50, t:'2026-10-14 10:15', pay:'PAY::PAID', deliver:'GIFT::DONE' },
  { no:'SO2026101300011555', goodsId:'P1005', spec:'标准版', amount:269.00, t:'2026-10-13 16:20', pay:'PAY::PAID', deliver:'CODE::DELIVERED', refund:'REFUND::SUCCESS', refundReason:'用户与企业微信客服协商一致，全额退款', refundAt:'2026-10-20 17:30', refundAmount:269.00 }
];
/* 评审口径（CHG-0048）：订单只有三个用户可见状态。
   已支付＝支付接口确认收款；已完成＝已支付且口令码已交付或好友赠送已完成。
   「确认中」（渠道结果未回）与「已关闭」（超时未支付）不再作为订单状态。 */
var ORDER_TABS = ['全部', '待支付', '待发货', '已完成', '已退款', '已关闭'];
function orderState(r) {
  if (r.refund === 'REFUND::SUCCESS') return '已退款';
  if (r.closed) return '已关闭';
  if (r.pay !== 'PAY::PAID') return '待支付';
  /* 退款中不改主状态，仍展示「待发货」并加标记（CHG-0096）。 */
  if (r.refundStatus === '退款中') return '待发货';
  return (r.deliver === 'CODE::DELIVERED' || r.deliver === 'GIFT::DONE') ? '已完成' : '待发货';
}
function orderStateTagClass(s) {
  return s === '已完成' ? 'ok' : (s === '已退款' || s === '已关闭' ? 'err' : (s === '待发货' ? 'warn' : ''));
}
function orderRows() {
  /* 在 PC 收银台完成支付后，同一笔订单由「待支付」转为「已完成」，列表与详情同步变化 */
  return ORDER_ROWS.map(function (r) {
    /* 后台人工补发后，前台交付状态同步为已交付（CHG-0084） */
    if (deliverySynced(r.no)) return Object.assign({}, r, { deliver: 'CODE::DELIVERED' });
    if (RV.session.orderPaid && r.no === MOCK_ORDER.no && r.pay === 'PAY::PENDING') {
      return Object.assign({}, r, { pay: 'PAY::PAID', deliver: 'CODE::DELIVERED', uncertain: false });
    }
    return r;
  });
}
function rOrder(page, st, sim) {
  var c = 'APP-ORDER-01-C';
  var head = navBar(c + '01', '我的订单', '仅展示当前商城身份的订单');
  /* 页签一行展示（评审反馈）：不换行；极窄时横向滚动而不是折成两行 */
  var tabs = C(c + '02', '<div class="segbar">' + ORDER_TABS.map(function (t) {
    return '<button class="tag' + ((RV.orderTab || '全部') === t ? ' on' : '') + '" type="button" data-act="otab" data-tab="' + attr(t) + '" style="padding:8px 10px;margin:0">' + esc(t) + '</button>';
  }).join('') + '</div>', 'div', 'card flat');
  if (st === 'SESSION_EXPIRED') {
    return phoneShell(head + tabs + C(c + '05',
      '<div class="empty"><span class="t">［登录已失效］</span>请重新登录后查看订单。切换账号后会清除旧会话、订单缓存、待支付上下文与协议勾选，并按新账号重新加载。' +
      '<div style="margin-top:8px"><button class="btn sm" type="button" data-act="login">去登录</button></div></div>' +
      '<div class="hint">读取个人订单必须登录并校验所属账号（3.3、ORDER-05）</div>', 'div', 'card'));
  }
  if (st === 'ERROR' || sim === 'fail') {
    return phoneShell(head + tabs + C(c + '04', stateBlock('', 'error', '订单请求失败', '已保留状态筛选条件，可重试。', '重试', 'retry'), 'div', 'card'));
  }
  var tab = ORDER_TABS.indexOf(RV.orderTab) >= 0 ? RV.orderTab : '全部';
  var rows = orderRows().filter(function (r) { return tab === '全部' || orderState(r) === tab; });
  if (st === 'LOADING') {
    return phoneShell(head + tabs + '<div class="card"><div class="sk h20" style="margin-bottom:6px"></div><div class="sk" style="width:55%"></div></div><div class="card"><div class="sk h20"></div></div>' +
      C(c + '04', '<div class="center small muted" style="padding:8px 0">加载中…</div>', 'div', 'card'));
  }
  if (st === 'EMPTY' || sim === 'empty' || !rows.length) {
    return phoneShell(head + tabs + C(c + '03', stateBlock('', 'empty', '该状态下暂无订单', '当前页签“' + esc(tab) + '”没有订单。可切换其他状态查看。筛选条件与页签已保留。'), 'div', 'card') +
      C(c + '04', '<div class="center small muted" style="padding:6px 0">共 0 条</div>', 'div', 'card'));
  }
  var cards = C(c + '03', rows.map(function (r) {
    var gd = g(r.goodsId);
    var stt = orderState(r);
    /* 待支付订单给出「继续支付」；支付结果未确定时只给「查询支付结果」，避免重复付款。 */
    var op = '';
    if (r.closed) {
      op = '';
    } else if (r.pay === 'PAY::PENDING' && r.uncertain) {
      op = '<div class="row" style="margin-top:6px"><button class="btn sm" type="button" data-act="pay-query" data-order="' + attr(r.no) + '" style="margin-left:auto">查询支付结果</button></div>';
    } else if (r.pay === 'PAY::PENDING') {
      op = '<div class="row" style="margin-top:6px"><button class="btn sm" type="button" data-act="resume-pay" data-order="' + attr(r.no) + '" style="margin-left:auto">继续支付</button></div>';
    }
    return '<div class="card" data-act="go" data-to="APP-ORDER-02" data-order="' + attr(r.no) + '" role="button" tabindex="0">' +
      '<div class="row"><span class="xsmall muted brk">订单号 ' + esc(r.no) + '</span>' +
      '<span class="tag ' + orderStateTagClass(stt) + '" style="margin-left:auto">' + esc(stt) + '</span></div>' +
      (r.refundStatus === '退款中' ? '<div class="xsmall" style="color:var(--warn);margin-top:4px">退款中，订单仍为待发货</div>' : '') +
      (r.uncertain ? '<div class="xsmall" style="color:var(--warn);margin-top:4px">支付确认中，请勿重复付款</div>' : '') +
      '<div class="row" style="gap:8px;margin-top:6px;align-items:flex-start">' +
      thumb(gd, 44).replace('height:44px', 'height:44px;width:64px;flex:none') +
      '<div class="grow col" style="gap:2px"><span class="small brk">' + esc(gd.nm) + '－' + esc(r.spec) + ' ×1</span>' +
      '<span class="xsmall muted">交付：' + esc(deliverText(r.deliver)) + '　' + esc(r.t) + '</span></div>' +
      '<span class="price small">' + CNY(r.amount) + '</span></div>' + op + '</div>';
  }).join(''), 'div', '');
  return phoneShell(head + tabs + cards +
    C(c + '04', '<div class="center small muted" style="padding:6px 0">共 ' + rows.length + ' 条 · 已加载 ' + rows.length + ' 条</div>' +
      '<button class="btn sm wide" type="button" data-act="loadmore">继续加载</button>', 'div', 'card'));
}
/* 支付维度的展示文案：订单状态由 pay + deliver 组合派生（见 orderState） */
function payText(p) { return p === 'PAY::PAID' ? '已支付' : '待支付'; }
function payTag(p) { return p === 'PAY::PAID' ? 'ok' : ''; }
function deliverText(d) {
  return d === 'CODE::DELIVERED' ? '已交付口令码' : d === 'CODE::ISSUING' ? '发码中' : d === 'CODE::EXCEPTION' ? '交付异常'
    : d === 'GIFT::PENDING' ? '赠送待处理' : d === 'GIFT::PROCESSING' ? '赠送处理中' : d === 'GIFT::DONE' ? '赠送已完成'
      : d === 'GIFT::EXCEPTION' ? '赠送异常' : '未启动';
}

/* ============================================================
   APP-ORDER-02 订单详情
   ============================================================ */
function rOrderDetail(page, st, sim) {
  var c = 'APP-ORDER-02-C';
  var gift = /^GIFT/.test(st);
  /* 订单状态只有三个（CHG-0048）：详情页展示的支付状态也只可能是待支付或已支付 */
  /* 从「我的订单」点进详情时按订单号取那一笔（CHG-0081）；直接进入时仍展示演示订单 */
  var picked = RV.session.detailOrder
    ? orderRows().filter(function (x) { return x.no === RV.session.detailOrder; })[0] : null;
  var o = Object.assign({}, gift ? MOCK_GIFT_ORDER : MOCK_ORDER, picked || {});
  if (picked && picked.pay) o.payStatus = picked.pay;
  if (picked && picked.deliver) o.codeStatus = picked.deliver;
  var gd = g(o.goodsId);
  if (!gift && RV.session.orderPaid) { o.payStatus = 'PAY::PAID'; }
  var pay = o.payStatus;
  var codeSynced = !gift && deliverySynced(o.no);
  if (codeSynced) o.codeStatus = 'CODE::DELIVERED';
  var codeStat = o.codeStatus || 'CODE::NOT_STARTED';
  if (st === 'CODE_ISSUING') codeStat = 'CODE::ISSUING';
  if (st === 'CODE_EXCEPTION') codeStat = 'CODE::EXCEPTION';
  if (st === 'REPLACED') codeStat = 'CODE::DELIVERED';
  var refunded = o.refund === 'REFUND::SUCCESS';
  var refunding = o.refundStatus === '退款中';
  var closedOrder = !!o.closed;
  var orderStat = orderState({ pay: pay, deliver: codeStat, refund: o.refund, refundStatus: o.refundStatus, closed: o.closed });
  var head = navBar(c + '01', '订单详情', o.no,
    '<button class="ico-btn" type="button" data-act="copy" data-copy="' + attr(o.no) + '">复制</button>' +
    '<button class="ico-btn" type="button" data-act="go" data-to="APP-SERVICE-01">客服</button>');
  if (st === 'ERROR' || sim === 'fail') {
    return phoneShell(head + stateBlock('', 'error', '订单读取失败', '已保留订单号，可重试。', '重试', 'retry'));
  }
  var status = '';
  var snapshot = C(c + '03',
    '<div class="row" style="gap:8px;align-items:flex-start">' + thumb(gd, 56).replace('height:56px', 'height:56px;width:80px;flex:none') +
    '<div class="grow col" style="gap:2px"><span class="small">' + esc(gd.nm) + '－' + esc(o.spec) + '</span>' +
    '<span class="xsmall muted">数量 ×1 · ' + (o.type === 'GIFT' ? '好友赠送（人工交付）' : '口令码自动发码') + '</span>' +
    '<span class="xsmall muted">' + esc(regionOf(gd, RV.session.way)) + '</span></div>' +
    '<span class="price small">' + CNY(o.amount) + '</span></div>' +
    '<div class="kv" style="margin-top:6px"><span class="k">订单号</span><span class="v brk">' + esc(o.no) + '</span>' +
      '<button class="btn sm" type="button" data-act="copy" data-copy="' + attr(o.no) + '" style="margin-left:6px">复制</button></div>' +
    '<div class="kv"><span class="k">下单时间</span><span class="v">' + esc(o.createdAt) + '</span></div>' +
    '<div class="hint">保存成交商品、价格、规格与交付规则快照，运营修改不覆盖历史信息（CHECKOUT-05）</div>', 'div', 'card');
  var deliver;
  if (gift) {
    deliver = C(c + '05',
      '<div class="sect-t">好友赠送</div>' +
      '<div class="kv"><span class="k">状态</span><span class="v">' + giftStatusText(st) + '</span></div>' +
      '<div class="kv"><span class="k">好友链接</span><span class="v brk">' + esc(o.friendLink) + '</span></div>' +
      '<div class="small" style="margin-top:6px">交付时段：工作日 8:00～18:00（Asia/Shanghai），预计 2～6 小时完成。不展示口令码，也不在付款后直接标记赠送完成（RESULT-03）。</div>', 'div', 'card');
  } else {
    var inner;
    if (refunded) inner = '<div class="empty"><span class="t">［已退款］</span>本订单已完成全额退款，原口令码不再展示，订单记录保留。</div>' +
      '<div class="hint">已退款订单不展示有效口令码；如需重新购买，请生成新订单。</div>';
    else if (pay !== 'PAY::PAID') inner = closedOrder
      ? '<div class="empty"><span class="t">［订单已关闭］</span>超时未支付，未生成口令码；重新下单按实时价格计算。</div>'
      : '<div class="empty"><span class="t">［未支付］</span>订单尚未支付，未生成口令码；请在 30 分钟内继续支付。</div>' +
        '<div class="hint">下单价格已锁定；支付按下单快照金额，价格变化无需重新确认。</div>';
    else if (codeSynced) inner = '<div class="code-box">' + esc(latestCode(o.no, MOCK_CODE)) + '</div>' +
      '<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm" type="button" data-act="copy" data-copy="' + esc(latestCode(o.no, MOCK_CODE)) + '">复制口令码</button>' +
      '<span class="xsmall muted">Steam 客户端 → 添加游戏 → 在 Steam 上激活产品</span></div>' +
      '<div class="hint">后台已完成人工补发，交付状态同步为「已交付」；当前展示补录口令码（CHG-0084）。</div>';
    else if (codeStat === 'CODE::ISSUING') inner = '<div class="empty"><span class="t">［发码中］</span>已确认支付，正在获取口令码。</div>';
    else if (codeStat === 'CODE::EXCEPTION') inner = '<div class="empty" style="border-color:#a33b3b;color:#a33b3b"><span class="t" style="color:#a33b3b">［交付异常］</span>订单已支付但暂未取得有效口令码，已进入人工处理；请通过企业微信客服提供订单编号，请勿重复付款。</div>';
    else if (codeStat === 'CODE::DELIVERED') inner = '<div class="code-box">' + esc(latestCode(o.no, MOCK_CODE)) + '</div>' +
      '<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm" type="button" data-act="copy" data-copy="' + esc(latestCode(o.no, MOCK_CODE)) + '">复制口令码</button>' +
      '<span class="xsmall muted">Steam 客户端 → 添加游戏 → 在 Steam 上激活产品</span></div>' +
      (st === 'REPLACED' ? '<div class="hint">后台已完成人工补发；当前展示补录口令码（CHG-0094）。</div>' : '');
    else inner = '<div class="empty"><span class="t">［未启动］</span>订单尚未进入交付。</div>';
    deliver = C(c + '04', '<div class="sect-t">口令码</div>' + inner +
      '<div class="hint">口令码仅在本人登录且通过权限校验的订单中展示（ORDER-04）。</div>', 'div', 'card');
  }
  var after = C(c + '06',
    '<div class="sect-t">售后记录</div>' +
    (refunded
      ? '<div class="small">' + esc(o.refundAt || '2026-10-20 17:30') + '　全额退款　原因：' + esc(o.refundReason || '用户与企业微信客服协商一致，全额退款') + '；退款金额 ' + CNY(o.refundAmount || o.amount) + '，操作人：运营_02</div>' +
        '<div class="hint">已交付口令码的退款由人工协商处理，不要求上游确认；退款完成后不再展示有效口令码（REQ-14、CHG-0096）。</div>'
      : refunding
        ? '<div class="small">退款处理中　原因：' + esc(o.refundReason || '用户与企业微信客服协商退款，等待渠道回执') + '。退款期间订单仍为「待发货」。</div>' +
          '<div class="hint">已交付口令码的退款由人工协商处理，不要求上游确认；资金结果以渠道回执为准。</div>'
        : (st === 'REPLACED'
          ? '<div class="small">2026-10-15 10:12　人工补发　原因：用户反馈未收到口令码；补录口令码 CODE-20261015-0002，操作人：运营_02</div>'
          : '<div class="small muted">暂无售后记录。</div>') +
          '<div class="hint">记录包含原因、补录口令码、操作人与时间（CODE-05）；前台不提供自助退款或补发申请表单，已交付口令码的售后由企业微信客服人工协商（REQ-14）。</div>'), 'div', 'card');
  var ops = [];
  if (!gift && orderStat === '已完成') ops.push({ t: '使用指引', a: 'data-act="use-guide"' });
  if (orderStat === '已完成' || orderStat === '已退款') ops.push({ t: '再次购买', a: 'data-act="go" data-to="APP-PRODUCT-01"' });
  if (orderStat === '待支付') ops.push({ t: '继续支付', a: 'data-act="go" data-to="APP-CHECKOUT-01"', primary: true });
  if (orderStat === '已关闭') ops.push({ t: '重新下单', a: 'data-act="go" data-to="APP-PRODUCT-01"', primary: true });
  var opHtml = ops.length
    ? '<div class="row" style="gap:8px">' + ops.map(function (x) {
        return '<button class="btn ' + (x.primary ? 'primary ' : '') + (ops.length > 1 ? 'grow' : 'wide') + '" type="button" ' + x.a + ' style="' + (ops.length > 1 ? 'flex:1' : '') + '">' + x.t + '</button>';
      }).join('') + '</div>'
    : '';
  var bottom = C(c + '07', opHtml +
    '<div class="center" style="margin-top:10px"><button class="btn-link" type="button" data-act="go" data-to="APP-SERVICE-01" style="font-size:12px;text-decoration:underline">联系客服</button></div>' +
    '<div class="hint center" style="margin-top:6px">已支付订单不能再次付款；已关闭订单提示重新购买；已退款订单保留记录并允许重新下单（CHECKOUT-07）</div>', 'div', 'bottom-bar');
  return phoneShell(head + status + snapshot + deliver + after + bottom);
}

/* ============================================================
   APP-MINE-01 我的
   ============================================================ */
/* 「我的」是移动端的第二个一级页面（与「商城」并列，由底部标签栏切换），
   因此不设「返回」与独立标题栏——账号卡即页面顶部（移动端主流做法）。
   页面结构自上而下：账号 → 我的订单（状态快捷入口）→ 账号与资格 → 服务与支持。
   「我的订单 / 客服」在首页移除后统一收在这里，入口不再重复。 */
function rMine(page, st) {
  var c = 'APP-MINE-01-C';
  var guest = st === 'GUEST';
  var unknown = st === 'UNKNOWN';
  var independent = !!RV.session.independent;
  var realNone = (RV.session.realname === 'none');
  /* C01 账号信息区：平台账号与商城手机号账号分开展示，不合并身份（CHG-0096） */
  var info = C(c + '01',
    '<div class="row" style="gap:10px">' +
      '<div class="avatar">头像</div>' +
      '<div class="grow col" style="gap:2px">' +
        '<span class="strong">' + (guest ? '未登录' : (independent ? '商城用户_6721' : '玩家_小七')) + '</span>' +
        '<span class="xsmall muted">' + (guest ? '登录后可查看本人订单与口令码' : (independent ? '商城用户账号 · 已绑定手机号：138****6721' : '商城用户账号 · 已绑定平台A')) + '</span></div>' +
      (guest ? '<button class="btn sm" type="button" data-act="login">去登录</button>' : '') +
    '</div>' +
    (independent ? '<div class="hint">商城用户账号不自动合并；订单仅展示当前账号的数据。</div>' : ''), 'div', 'card');
  /* C03 我的订单区：状态快捷入口按当前账号真实订单数生成；仅「待支付」带角标（需用户处理），
     其余状态不堆角标，避免把「可查看」误读成「待办」。 */
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
  var orders = C(c + '03',
    '<div class="sec-hd"><span class="strong">我的订单</span>' +
    '<button class="more" type="button" data-act="mine-order" data-tab="全部">全部订单 ›</button></div>' +
    '<div class="stat-grid" style="margin-top:4px">' + stats + '</div>', 'div', 'card');
  /* C02 资格状态区：手机号脱敏展示；状态未知时不推定，提供「重新获取」（PHONE-04、AUTH-05） */
  var val = function (known) { return guest ? '登录后查看' : unknown ? '暂不可获取' : known; };
  var realVal = guest ? '登录后查看'
    : (RV.session.realname === 'minor' ? '已实名（未成年）'
      : (RV.session.realname === 'verified' ? '已实名（成年）'
        : (realNone || unknown ? '未实名 / 暂不可获取，去认证' : '已实名认证')));
  var phoneVal = guest ? '登录后查看'
    : (RV.session.phone === 'bound' ? (RV.session.phoneMasked || '138****6721') + ' · 已绑定'
      : (RV.session.phone === 'unknown' ? '状态未知，去绑定' : '未绑定，去绑定'));
  var qual = C(c + '02',
    '<div class="sec-hd"><span class="strong">账号与资格</span>' +
    (unknown && !guest ? '<button class="more" type="button" data-act="retry">重新获取</button>' : '') + '</div>' +
    '<button class="cell" type="button" data-act="mine-platform" data-kind="realname"' + (guest ? ' disabled' : '') + '>' +
      '<span class="k">实名认证</span><span class="v">' + esc(realVal) + '</span><span class="arrow">›</span></button>' +
    '<button class="cell" type="button" data-act="mine-phone"' + (guest ? ' disabled' : '') + '>' +
      '<span class="k">手机号</span><span class="v">' + esc(phoneVal) + '</span><span class="arrow">›</span></button>' +
    '<div class="hint">手机号由用户主动填写并短信验证后绑定当前商城用户账号；平台不提供手机号。商城用户账号不自动合并，实名结果不跨账号复用。</div>', 'div', 'card');
  /* C04 客服入口 / C05 协议与关于：售后与规则类入口，同属「服务与支持」分组 */
  var service = C(c + '04',
    '<div class="sec-hd"><span class="strong">服务与支持</span></div>' +
    '<button class="cell" type="button" data-act="go" data-to="APP-SERVICE-01">' +
      '<span class="k">企业微信客服</span><span class="v">8:00～18:00</span><span class="arrow">›</span></button>', 'div', 'card');
  var about = C(c + '05',
    '<button class="cell" type="button" data-act="go" data-to="APP-AGREEMENT-01">' +
      '<span class="k">《购买协议》</span><span class="v">V1.0</span><span class="arrow">›</span></button>' +
    '<button class="cell" type="button" data-act="go" data-to="APP-PRIVACY-01">' +
      '<span class="k">《隐私政策》</span><span class="v">V1.0</span><span class="arrow">›</span></button>' +
    '<div class="hint">商城经营主体：商城经营公司。三个入口所属公司不因接入获得商城后台权限；商城不提供外部浏览器独立访问与购买。</div>', 'div', 'card');
  return phoneShell(info + orders + qual + service + about, null, tabBar(c + '06', 'APP-MINE-01'));
}

/* ============================================================
   APP-SERVICE-01 企业微信客服
   ============================================================ */
function rService(page, st) {
  var c = 'APP-SERVICE-01-C';
  var fallback = st === 'FALLBACK';
  var withOrder = st === 'WITH_ORDER';
  return phoneShell(
    navBar(c + '01', '企业微信客服', '售中与售后统一咨询入口') +
    C(c + '01',
      '<div class="small">前台售后统一通过企业微信沟通。联系时请提供<b>订单编号</b>，便于客服核查支付与交付状态。</div>' +
      '<div class="hint">本商城不提供自助退款或补发申请表单；已交付口令码的退款由客服与用户人工协商，无需上游确认，退款完成后订单展示「已退款」（REQ-14）。</div>', 'div', 'card') +
    C(c + '02',
      '<div class="sect-t">订单编号</div>' +
      (withOrder
        ? '<div class="row"><input class="inp" value="' + attr(MOCK_ORDER.no) + '" readonly aria-label="订单编号" style="flex:1">' +
          '<button class="btn sm" type="button" data-act="copy" data-copy="' + attr(MOCK_ORDER.no) + '">复制</button></div>'
        : '<div class="empty"><span class="t">［未携带订单号］</span>从首页进入客服时未选择订单。如需咨询订单问题，请先在"我的订单"中复制订单编号。</div>' +
          '<button class="btn sm" type="button" data-act="go" data-to="APP-ORDER-01" style="margin-top:8px">前往我的订单</button>') +
      '<div class="hint">订单页提供订单号复制和客服入口（8.2、ORDER-04）</div>', 'div', 'card') +
    C(c + '03',
      '<div class="sect-t">添加企业微信</div>' +
      '<div class="blk" style="height:120px;display:flex;align-items:center;justify-content:center;color:#6b7280;font-size:12px">［企业微信二维码］</div>' +
      '<button class="btn primary wide" type="button" data-act="open-wework" style="margin-top:8px">打开企业微信</button>' +
      '<div class="hint">客服添加方式可采用企业微信可用链接、二维码或账号说明，需验证在两个 App 与 PC 容器中的实际可用性（8.2）</div>', 'div', 'card') +
    C(c + '04',
      '<div class="banner' + (fallback ? '' : '') + '"><span class="grow">' + (fallback
        ? '无法唤起企业微信。请复制客服账号后在微信中搜索添加，或稍后重试。'
        : '若无法唤起企业微信，本区域将显示备用提示与可复制的客服账号。') + '</span></div>' +
      '<div class="row" style="gap:8px;margin-top:8px">' +
      '<button class="btn sm" type="button" data-act="copy" data-copy="kf_steam_mall">复制客服账号</button>' +
      '<button class="btn sm" type="button" data-act="noop">复制联系方式</button></div>' +
      '<div class="hint">客服服务时间待运营提供，不得直接沿用交付排班作为客服承诺（7.2、TBD-09）</div>', 'div', 'card'));
}

/* ============================================================
   APP-CONTAINER-01 容器异常提示（待评审）
   ============================================================ */
function rContainer() {
  return phoneShell(
    C('APP-CONTAINER-01-C01',
      '<div class="empty" style="padding:28px 16px"><span class="t">请在所属平台 App 内打开商城</span>' +
      '检测到当前不在受支持的容器内（外部浏览器）。请返回对应平台 App 后重新进入商城，即可正常浏览与购买。' +
      '<div class="hint" style="margin-top:10px;text-align:left">本提示属于容器异常处理设计，<b>需评审</b>（PRD 2.3）。本项目三个正常入口<b>不提供商城链接复制功能</b>，也不将隐藏复制入口作为访问限制措施。</div></div>', 'div', 'card') +
    C('APP-CONTAINER-01-C02',
      '<div class="col" style="gap:8px"><button class="btn primary wide" type="button" data-act="noop">返回平台入口</button>' +
      '<button class="btn wide" type="button" data-act="noop">继续只读浏览（待评审）</button></div>', 'div', 'card'));
}

/* ============================================================
   APP-LOGIN-01 商城手机号登录/注册（独立账号，CHG-0096）
   ============================================================ */
function rLogin(page, st, sim) {
  var c = 'APP-LOGIN-01-C';
  var sent = st === 'CODE_SENT' || (RV.session.smsSent && st !== 'ERROR');
  var failed = st === 'ERROR' || !!RV.loginErr;
  var phone = RV.session.loginPhone || '';
  var code = RV.session.loginCode || '';
  return phoneShell(
    navBar(c + '01', '登录 / 注册', '商城用户账号', '<button class="ico-btn" type="button" data-act="login-later">稍后</button>') +
    C(c + '02',
      '<div class="center" style="padding:8px 0 2px"><div class="strong" style="font-size:18px">Steam商城</div>' +
      '<div class="small muted" style="margin-top:4px">外部渠道用户可使用手机号登录或注册</div></div>' +
      '<div class="hint">平台授权登录会创建/恢复商城用户账号并绑定平台账号；手机号注册会创建商城用户账号并绑定手机号。两者不自动合并，订单按当前商城用户账号展示。</div>', 'div', 'card') +
    (failed ? C(c + '03', '<div class="banner" style="border-color:#a33b3b;color:#a33b3b"><span class="grow">' + esc(RV.loginErr || '请输入正确的手机号与验证码，并勾选隐私政策。') + '</span></div>', 'div', '') : '') +
    (sent ? C(c + '04', '<div class="banner"><span class="grow">验证码已发送至 ' + esc(RV.session.smsPhone || '138****6721') + '；60 秒内不可重复发送。</span></div>', 'div', '') : '') +
    C(c + '05',
      '<div class="row" style="gap:8px"><span class="small muted" style="width:70px;flex:none">手机号</span>' +
      '<input class="inp" data-login-phone="1" value="' + attr(phone) + '" inputmode="numeric" maxlength="11" placeholder="请输入 11 位手机号" style="flex:1" aria-label="手机号"></div>' +
      '<div class="row" style="gap:8px;margin-top:10px"><span class="small muted" style="width:70px;flex:none">验证码</span>' +
      '<input class="inp" data-login-code="1" value="' + attr(code) + '" inputmode="numeric" maxlength="6" placeholder="6 位短信验证码" style="flex:1" aria-label="短信验证码">' +
      '<button class="btn sm" type="button" data-act="sms-send"' + (sent ? ' disabled' : '') + '>' + (sent ? '60s 后重发' : '获取验证码') + '</button></div>' +
      '<div class="hint">无需图形验证码；短信 60 秒频率限制，服务商由销售 CDK 公司后续提供。原型不调用真实短信服务，也不会真实发送短信。</div>' +
      '<label class="row check-row" style="gap:8px;margin-top:10px"><input type="checkbox" data-login-agree="1" ' + (RV.session.privacyOk ? 'checked' : '') + ' style="width:18px;height:18px;flex:none;margin-top:3px">' +
      '<span class="small">我已阅读并同意《隐私政策》与《用户协议》</span></label>' +
      '<div class="hint">未勾选隐私政策不能登录或注册；<button class="btn-link" type="button" data-act="go" data-to="APP-PRIVACY-01">查看《隐私政策》</button></div>' +
      '<button class="btn primary wide" type="button" data-act="phone-login" style="margin-top:12px">登录 / 注册</button>' +
      '<div class="hint center">未注册手机号验证通过后自动创建商城账号；短信验证只用于本次登录，不保存验证码。</div>', 'div', 'card') +
    C(c + '06',
      '<button class="btn wide" type="button" data-act="platform-login">使用所属平台账号登录（平台 A/B/C）</button>' +
      '<div class="hint center">平台授权登录由所属平台完成；商城创建/恢复商城用户账号并绑定该平台账号，只接收平台用户 ID 与可信实名结果，不接收手机号。商城用户账号不自动合并。</div>', 'div', 'card'));
}

/* ============================================================
   APP-REALNAME-01 实名认证（独立手机号账号）
   ============================================================ */
function rRealname(page, st, sim) {
  var c = 'APP-REALNAME-01-C';
  var submitting = st === 'SUBMITTING';
  var failed = st === 'FAILED' || !!RV.realErr;
  var minor = st === 'MINOR';
  var demo = RV.session.realDemo;
  return phoneShell(
    navBar(c + '01', '实名认证', '独立手机号账号') +
    C(c + '02',
      '<div class="small">为落实未成年人保护与交易合规要求，首次购买前需完成实名认证。若所属平台已返回可信实名结果，商城直接使用；平台无法提供或未认证时，可在本页填写姓名与身份证号，由商城调用国家认证接口完成核验。<b>商城只保存核验结果与脱敏信息。</b></div>' +
      '<div class="hint">国家认证接口由销售 CDK 公司后续提供；原型不调用真实服务、不联网核验。<b>请勿输入真实姓名或身份证号</b>，以下内容仅用于演示，提交后不落盘、不上传。</div>', 'div', 'card') +
    (minor ? C(c + '03', '<div class="banner" style="border-color:#8a641e"><span class="grow">模拟核验结果为未成年人：可浏览，暂不可购买。</span></div>', 'div', '') : '') +
    (failed ? C(c + '04', '<div class="banner" style="border-color:#a33b3b;color:#a33b3b"><span class="grow">' + esc(RV.realErr || '实名核验失败，请检查信息后重试。') + '</span></div>', 'div', '') : '') +
    C(c + '05',
      '<div class="row" style="gap:8px"><span class="small muted" style="width:70px;flex:none">姓名</span>' +
      '<input class="inp" data-real-name="1" value="' + attr(demo ? '演示用户' : (RV.session.realName || '')) + '" maxlength="20" placeholder="演示环境请填测试姓名" style="flex:1" aria-label="姓名"></div>' +
      '<div class="row" style="gap:8px;margin-top:10px"><span class="small muted" style="width:70px;flex:none">身份证号</span>' +
      '<input class="inp" data-real-id="1" value="' + attr(demo ? '000000000000000000' : (RV.session.realId || '')) + '" maxlength="18" placeholder="演示环境请填测试号码" style="flex:1" aria-label="身份证号"></div>' +
      '<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm" type="button" data-act="real-demo">填入演示资料</button>' +
      '<span class="xsmall muted" style="align-self:center">演示资料不是真实个人信息</span></div>' +
      '<label class="row check-row" style="gap:8px;margin-top:10px"><input type="checkbox" data-real-agree="1" ' + (RV.session.realAgree ? 'checked' : '') + ' style="width:18px;height:18px;flex:none;margin-top:3px">' +
      '<span class="small">我已阅读并同意《实名认证授权与隐私政策》</span></label>' +
      '<div class="hint">姓名与证件号仅用于本次核验；商城不保存完整值，展示与日志均脱敏。核验服务商待销售 CDK 公司提供。</div>' +
      '<button class="btn primary wide" type="button" data-act="real-submit"' + (submitting ? ' disabled' : '') + ' style="margin-top:12px">' + (submitting ? '核验中…' : '提交实名认证') + '</button>' +
      '<button class="btn wide" type="button" data-act="go" data-to="APP-MINE-01" style="margin-top:8px">暂不认证，返回我的</button>', 'div', 'card'));
}

/* ============================================================
   APP-REALNAME-02 实名认证结果
   ============================================================ */
function rRealnameResult(page, st) {
  var c = 'APP-REALNAME-02-C';
  return phoneShell(
    navBar(c + '01', '实名认证结果', '') +
    C(c + '02', authResultInner(st), 'div', ''));
}

/* ============================================================
   APP-PRIVACY-01 隐私政策（占位文本，需法务评审）
   ============================================================ */
function rPrivacy(page, st) {
  var c = 'APP-PRIVACY-01-C';
  return phoneShell(
    navBar(c + '01', '隐私政策', 'V1.0 · 原型占位文本') +
    C(c + '02',
      '<div class="small" style="line-height:1.8">' +
      '<b>一、我们收集的信息</b><br>手机号（用于登录、订单通知与客服联系）；实名核验结果与脱敏姓名/证件号（用于未成年人保护与交易合规）；订单、支付与交付记录（用于履约与售后）。<br><br>' +
      '<b>二、使用目的</b><br>账号登录与身份识别、下单与支付、口令码或好友赠送交付、订单通知、售后处理、风控与合规审计。<br><br>' +
      '<b>三、最小化与脱敏</b><br>商城不保存完整口令码到普通日志；不展示完整手机号、姓名与证件号；完整 CDK 仅在订单详情按权限查看。<br><br>' +
      '<b>四、共享与委托处理</b><br>支付渠道、短信服务商、实名服务商与供应商仅在履约所需范围内处理必要信息；不向无关第三方出售个人信息。<br><br>' +
      '<b>五、账号体系</b><br>平台授权登录与手机号注册分别创建商城用户账号并绑定对应身份；两者不自动合并，订单按当前商城用户账号展示。<br><br>' +
      '<b>六、你的权利</b><br>可联系企业微信客服查询、更正或删除相关个人信息；法律法规另有规定的除外。<br><br>' +
      '<span class="muted">（正式文本由业务与法务提供并评审，本处仅用于原型演示，不构成法律文件。）</span></div>', 'div', 'card') +
    C(c + '03', '<button class="btn wide" type="button" data-act="back">返回</button>', 'div', 'bottom-bar'));
}

