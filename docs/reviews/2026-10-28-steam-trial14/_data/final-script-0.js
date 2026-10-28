
/* ============================================================
   00 基础工具
   ============================================================ */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const attr = s => esc(s);
const CNY = n => '¥' + Number(n).toFixed(2);

/* 全局评审状态（评审工具，不进入业务埋点、不触发业务接口） */
const RV = {
  end: 'ALL',
  pageId: null,
  state: null,
  sim: 'ok',
  selectedComponent: null,
  from: null,                       // 进入当前页之前的页面（PC 详情页「返回来源页面」用）
  banner: 0,                        // 首页广告位当前索引（多图轮播用）
  drawerOpen: false,                // PC 我的订单的详情抽屉
  drawerOrder: null,                // 抽屉当前展示的订单号
  // 后台侧边菜单（CHG-0054）：折叠为窄条、菜单搜索词、被收起的分组
  admCollapsed: false,
  admMenuQ: '',
  admClosedGroups: [],
  hmSeq: 100,                      // 首页banner 新增素材的临时ID计数（CHG-0056）
  hmNow: '2026-10-16 14:30',       // 「最后操作时间」的模拟值：原型不取真实系统时间
  notes: { page: null, all: [] },   // 当前页收集到的评审注释，按归属分发到「状态」与「组件说明」
  outline: false,
  live: false,
  readerOpen: false,
  readerDoc: null,
  readerHist: [],
  readerScroll: {},
  readerTocOpen: {},
  // 业务会话（原型内模拟，不落盘）
  session: {
    loggedIn: false,
    realname: 'none',      // none | verified | minor | unknown
    phone: 'unbound',      // bound | unbound | unknown
    phoneMasked: '',       // 商城账号主动绑定后的脱敏手机号（不落盘）
    agreementOk: false,
    noticeClosed: false,
    pendingOrder: null,
    orderPaid: false,
    codeDelivered: false,
    giftStage: 'pending',
    payQuery: null,
    cart: null,
    bindFrom: '',          // BUY | MINE
    bindChange: false,
    bindPhone: '',
    bindCode: '',
    bindSmsSent: false,
    bindSmsPhone: '',
    bindAgree: false,
    bindErr: '',
    // 搜索历史：仅本次评审会话内保留，不写浏览器持久存储、不落盘
  }
};
function resetSession() {
  RV.session = {
    loggedIn: false, realname: 'none', phone: 'unbound', phoneMasked: '',
    agreementOk: false, noticeClosed: false, pendingOrder: null, orderPaid: false, detailOrder: '',
    codeDelivered: false, giftStage: 'pending', payQuery: null, cart: null,
    bindFrom: '', bindChange: false, bindPhone: '', bindCode: '',
    bindSmsSent: false, bindSmsPhone: '', bindAgree: false, bindErr: '',
    panelOpen: false, panelPrompt: false, panelMsg: '', busy: false, authBusy: false,
  };
}

/* ============================================================
   01 Markdown 渲染（自包含、离线、不执行脚本来源）
   ============================================================ */
function safeUrl(u) {
  const s = String(u || '').trim();
  if (/^(https?:|mailto:|#)/i.test(s)) return s;
  if (/^[A-Za-z]:[\\/]/.test(s)) return '#';   // 本地绝对路径不外跳
  return '#';
}
function inlineMd(t) {
  let s = esc(t);
  s = s.replace(/`([^`]+)`/g, (m, a) => '<code class="md-code">' + a + '</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, (m, a, b) => a + '<em>' + b + '</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, a, b) => '<a href="' + attr(safeUrl(b)) + '" target="_blank" rel="noopener noreferrer">' + a + '</a>');
  return s;
}
/* 单元格：还原上面被转义的 \| 占位 */
function cellMd(t) {
  return inlineMd(String(t).replace(//g, '|'));
}
function splitTableRow(line) {
  let s = String(line).trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && s.charAt(s.length - 2) !== '\\') s = s.slice(0, -1);
  let out = [], cur = '', k = 0;
  while (k < s.length) {
    const ch = s[k];
    if (ch === '\\' && s[k + 1] === '|') { cur += ''; k += 2; continue; }
    if (ch === '|') { out.push(cur); cur = ''; k++; continue; }
    cur += ch; k++;
  }
  out.push(cur);
  return out.map(x => x.trim());
}
function isTableSep(line) { return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line); }

/**
 * renderMd(text, opts)
 * 支持：# 标题、段落、- / 1. 列表、| 表格、``` 代码块（含 plantuml 图示）、> 引用、--- 分隔线、图片
 * 不执行任何来自 MD 的原始 HTML 或脚本。
 */
let MD_SEC_SEQ = 0;   /* 全局递增，保证同一页面多次渲染的章节锚点 id 唯一（避免阅读器与组件说明区 id 冲突） */
function renderMd(text) {
  const lines = String(text == null ? '' : text).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const listStack = [];
  function closeLists() { while (listStack.length) { out.push(listStack.pop() === 'ol' ? '</ol>' : '</ul>'); } }
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.replace(/\s+$/, '');
    // 代码块
    const fence = line.match(/^\s*(```+|~~~+)\s*([A-Za-z0-9_+-]*)\s*$/);
    if (fence) {
      closeLists();
      const mark = fence[1], lang = (fence[2] || '').toLowerCase();
      const buf = []; i++;
      while (i < lines.length && !new RegExp('^\\s*' + mark).test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      const code = buf.join('\n');
      if (lang === 'plantuml' || lang === 'puml' || lang === 'mermaid') {
        out.push('<div class="md-diagram">' + renderDiagram(code) + '</div>' +
          '<details class="src"><summary>查看 PlantUML 图源</summary><pre>' + esc(code) + '</pre></details>');
      } else {
        out.push('<pre class="md-pre">' + esc(code) + '</pre>');
      }
      continue;
    }
    // 表格
    if (/\|/.test(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      closeLists();
      const head = splitTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim() !== '') { rows.push(splitTableRow(lines[i])); i++; }
      let t = '<div class="md-tbl-wrap"><table><thead><tr>' +
        head.map(h => '<th>' + cellMd(h) + '</th>').join('') + '</tr></thead><tbody>';
      rows.forEach(r => {
        t += '<tr>';
        for (let c = 0; c < head.length; c++) t += '<td>' + cellMd(r[c] == null ? '' : r[c]) + '</td>';
        t += '</tr>';
      });
      t += '</tbody></table></div>';
      out.push(t);
      continue;
    }
    // 标题
    let m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      closeLists();
      const lv = m[1].length; MD_SEC_SEQ++;
      out.push('<div class="md-h' + lv + '" id="mdsec-' + MD_SEC_SEQ + '" data-sec="' + attr(m[2].replace(/[*`]/g, '')) + '">' + inlineMd(m[2]) + '</div>');
      i++; continue;
    }
    // 分隔线
    if (/^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/.test(line)) { closeLists(); out.push('<hr class="md-hr">'); i++; continue; }
    // 引用
    if (/^\s*>/.test(line)) {
      closeLists();
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
      out.push('<div class="md-quote">' + buf.map(b => inlineMd(b)).join('<br>') + '</div>');
      continue;
    }
    // 列表
    let lm = line.match(/^\s*([-*+])\s+(.*)$/);
    let om = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (lm || om) {
      const want = om ? 'ol' : 'ul';
      if (!listStack.length || listStack[listStack.length - 1] !== want) {
        closeLists(); listStack.push(want); out.push(want === 'ol' ? '<ol class="md-ol">' : '<ul class="md-ul">');
      }
      out.push('<li class="md-li' + (om ? ' ol' : '') + '">' + inlineMd((om ? om[2] : lm[2])) + '</li>');
      i++; continue;
    }
    // 空行
    if (line.trim() === '') { closeLists(); i++; continue; }
    // 图片单独成行
    const img = line.match(/^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (img) {
      closeLists();
      out.push('<div class="md-img-miss">［图片资源缺失或未随交付提供：' + esc(img[1] || img[2]) + '］本原型不依赖外部图片，图示以离线 SVG 提供。</div>');
      i++; continue;
    }
    // 段落
    closeLists();
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|```|~~~)/.test(lines[i])
      && !(/\|/.test(lines[i]) && i + 1 < lines.length && isTableSep(lines[i + 1]))) { buf.push(lines[i]); i++; }
    /* 段落内的单换行按换行渲染：组件十节里的「所属页面／需求来源／业务目的…」
       是逐点罗列的说明，并成一行会显著增加阅读难度（评审反馈）。
       Markdown 源里已按 GFM 硬换行（行尾两空格）写，两边表现一致。 */
    /* 逐行转义后再拼 <br>：先拼再转义会把 <br> 本身转成 &lt;br&gt; */
    out.push('<p class="md-p">' + buf.map(inlineMd).join('<br>') + '</p>');
  }
  closeLists();
  return out.join('\n');
}

/* ============================================================
   02 图示：构建期已用 PlantUML 渲染为 SVG，这里只做查表
   —— 运行时不解析图源、不依赖网络、不依赖任何 Diagram 库（标准 8.5 离线要求）。
   图源与 SVG 一并内嵌：SVG 用于显示，PlantUML 源文用于「查看图源」与二次编辑。
   ============================================================ */
function diagramSvg(src) {
  const s = String(src || '').trim();
  const list = window.DIAGRAMS || [];
  let hit = list.find(d => d.src === s);
  if (!hit) {
    /* 图源里的首行注释带编号，兜底按编号匹配（例如阅读器里重新切分了代码块） */
    const idm = s.match(/\b(FL|SM|SEQ)-[A-Z0-9-]+/);
    if (idm) hit = list.find(d => d.id === idm[0]);
  }
  if (!hit || !hit.svg) return '';
  return '<div class="puml-fig" data-w="' + (hit.w || 0) + '" data-h="' + (hit.h || 0) + '">' + hit.svg + '</div>';
}
function renderDiagram(src) {
  const svg = diagramSvg(src);
  if (svg) return svg;
  return '<div class="md-img-miss">［该图未随构建内嵌 SVG，请在下方查看并复制 PlantUML 图源］</div>';
}
