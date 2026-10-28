
/* ===== core runtime ===== */
const PAGES = window.__PAGES__;
const COMP_DOCS = window.__COMP_DOCS__;
const DIAGRAMS = window.__DIAGRAMS__;
const DOCS = window.__DOCS__;
const META = window.__META__;
const PAGE_MAP = {};
PAGES.forEach(p => PAGE_MAP[p.id] = p);

const RV = {
  end: 'H5', pageId: 'H5-HOME-01', state: 'DEFAULT', sim: 'ok',
  selected: '', outline: false, from: null, flash: '',
  readerOpen: false, readerDoc: 0, readerHist: [], readerScroll: 0,
  diagramOpen: false, diagramIndex: 0, diagramZoom: 'fit', diagramSrc: false
};
const NAV = [];
const TIMERS = [];
let TOASTS = [];

function clearTimers(){ while(TIMERS.length){ clearTimeout(TIMERS.pop()); } clearIntervalTimers(); }
let INTERVALS = [];
function clearIntervalTimers(){ while(INTERVALS.length){ clearInterval(INTERVALS.pop()); } }
function later(fn, ms){ const t=setTimeout(fn, ms); TIMERS.push(t); return t; }
function every(fn, ms){ const t=setInterval(fn, ms); INTERVALS.push(t); return t; }

const S = {
  platform: 'A',
  account: null,
  nickname: '玩家小陈',
  realName: 'unverified',
  adult: false,
  agreementChecked: false,
  phoneBound: false,
  phoneMasked: '138****0000',
  noticeSeen: {},
  wallet: 'SUFFICIENT',
  bindPhone: '', bindCode: '', bindError: '', bindCooldown: 0,
  search: { draft:'', committed:'', sort:'RECOMMEND', results:[] },
  ordersTab: 'ALL',
  homeBanner: 0,
  buy: null,
  currentOrder: null,
  lastPay: null,
  purchased: []
};

const PRODUCTS = [
  {id:'p01', name:'影之刃零', nameEn:'Phantom Blade Zero', price:25800, delivery:'CODE', stock:'SUFFICIENT', sale:'AVAILABLE', tag:'口令码', desc:'国产武侠动作游戏，标准版含本体。', restrict:['可激活地区：中国大陆','语言：简体中文/英语','版本：标准版'], specs:[{id:'p01-s1',name:'标准版',price:25800,gid:10191},{id:'p01-s2',name:'豪华版',price:29800,gid:10192}]},
  {id:'p02', name:'赛博朋克2077', nameEn:'Cyberpunk 2077', price:19800, delivery:'CODE', stock:'SOLD_OUT', sale:'SOLD_OUT', tag:'口令码', desc:'开放世界角色扮演游戏。', restrict:['可激活地区：中国大陆','语言：简体中文'], specs:[{id:'p02-s1',name:'标准版',price:19800,gid:10201}]},
  {id:'p03', name:'艾尔登法环', nameEn:'ELDEN RING', price:29800, delivery:'CODE', stock:'UNKNOWN', sale:'AVAILABLE', tag:'口令码', desc:'黑暗奇幻动作角色扮演游戏。', restrict:['可激活地区：待供应商确认','语言：简体中文'], specs:[{id:'p03-s1',name:'标准版',price:29800,gid:10202}]},
  {id:'p04', name:'黑神话：悟空', nameEn:'Black Myth: Wukong', price:26800, delivery:'GIFT', stock:'GIFT', sale:'AVAILABLE', tag:'好友赠送', desc:'以中国神话为背景的动作角色扮演游戏。', restrict:['交付方式：Steam 好友赠送','交付时段：每天 8:00～18:00'], specs:[{id:'p04-s1',name:'标准版',price:26800,gid:10203}]},
  {id:'p05', name:'双人成行', nameEn:'It Takes Two', price:9800, delivery:'GIFT', stock:'GIFT', sale:'AVAILABLE', tag:'好友赠送', desc:'合作冒险游戏，需好友共同游玩。', restrict:['交付方式：Steam 好友赠送','交付时段：每天 8:00～18:00'], specs:[{id:'p05-s1',name:'标准版',price:9800,gid:10204}]},
  {id:'p06', name:'鬼谷八荒', nameEn:'Tale of Immortal', price:5800, delivery:'CODE', stock:'SUFFICIENT', sale:'OFFLINE', tag:'口令码', desc:'开放世界修仙游戏。', restrict:['未发布'], specs:[{id:'p06-s1',name:'标准版',price:5800,gid:10205}]},
  {id:'p07', name:'Steam 组合包', nameEn:'Steam Bundle', price:38800, delivery:'CODE', stock:'BUNDLE', sale:'OFFLINE', tag:'组合', desc:'组合商品首期不上架。', restrict:['组合商品'], specs:[{id:'p07-s1',name:'组合包',price:38800,gid:10206}]},
  {id:'p08', name:'NBA 2K27', nameEn:'NBA 2K27', price:19817, delivery:'CODE', stock:'SUFFICIENT', sale:'OFFLINE', tag:'口令码', desc:'篮球模拟游戏。', restrict:['已下架'], specs:[{id:'p08-s1',name:'标准版',price:19817,gid:10207}]}
];
function product(id){ return PRODUCTS.find(p=>p.id===id) || PRODUCTS[0]; }
function specOf(p, sid){ return (p.specs||[]).find(s=>s.id===sid) || p.specs[0]; }

let ORDERS = [
  {id:'o1', no:'SO20261027001', productId:'p01', specId:'p01-s1', delivery:'CODE', pay:'PAID', deliveryStatus:'DELIVERED', refund:'NONE', amount:25800, created:'2026-10-27 09:12', paidAt:'2026-10-27 09:13', cdk:'VG-AAA-0016', friendLink:'', account:'u1001'},
  {id:'o2', no:'SO20261027002', productId:'p04', specId:'p04-s1', delivery:'GIFT', pay:'PAID', deliveryStatus:'PENDING', refund:'NONE', amount:26800, created:'2026-10-26 17:30', paidAt:'2026-10-26 17:30', friendLink:'steam://friends/add/7656119****', account:'u1001'},
  {id:'o3', no:'SO20261027003', productId:'p01', specId:'p01-s1', delivery:'CODE', pay:'PENDING', deliveryStatus:'NOT_STARTED', refund:'NONE', amount:25800, created:'2026-10-27 11:50', paidAt:'', friendLink:'', account:'u1001', expiresAt:'2026-10-27 12:20'},
  {id:'o4', no:'SO20261027004', productId:'p03', specId:'p03-s1', delivery:'CODE', pay:'CONFIRMING', deliveryStatus:'NOT_STARTED', refund:'NONE', amount:29800, created:'2026-10-27 10:05', paidAt:'', friendLink:'', account:'u1001'},
  {id:'o5', no:'SO20261027005', productId:'p02', specId:'p02-s1', delivery:'CODE', pay:'PAID', deliveryStatus:'DELIVERED', refund:'FAILED', amount:19800, created:'2026-10-25 14:20', paidAt:'2026-10-25 14:21', cdk:'VG-CB-2077', friendLink:'', account:'u1001', refundReason:'渠道明确失败，需财务重试'},
  {id:'o6', no:'SO20261027006', productId:'p05', specId:'p05-s1', delivery:'GIFT', pay:'CLOSED', deliveryStatus:'NOT_STARTED', refund:'NONE', amount:9800, created:'2026-10-24 16:00', paidAt:'', friendLink:'', account:'u1001'}
];
function ordersFor(acc){ return ORDERS.filter(o=>o.account===acc); }
function orderById(id){ return ORDERS.find(o=>o.id===id); }
function activeOrderFor(pid){
  if(!S.account) return null;
  return ORDERS.find(o=>o.account===S.account && o.productId===pid && (o.pay==='PENDING'||o.pay==='CONFIRMING'));
}
function displayStatus(o){
  if(o.refund==='FAILED') return '退款失败';
  if(o.refund==='PROCESSING') return '退款中';
  if(o.refund==='SUCCESS') return '已退款';
  if(o.pay==='CONFIRMING') return '支付确认中';
  if(o.deliveryStatus==='EXCEPTION') return '交付异常';
  if(o.deliveryStatus==='DELIVERED') return '已交付';
  if(o.pay==='PAID' && o.delivery==='GIFT' && o.deliveryStatus==='PROCESSING') return '已支付·赠送处理中';
  if(o.pay==='PAID' && o.delivery==='GIFT' && o.deliveryStatus==='PENDING') return '已支付·赠送待处理';
  if(o.pay==='PAID' && o.delivery==='CODE' && o.deliveryStatus!=='DELIVERED') return '已支付·发码中';
  if(o.pay==='PENDING') return '待支付';
  if(o.pay==='CLOSED') return '已关闭';
  return '支付确认中';
}
const DISPLAY_ORDER = ['退款失败','退款中','已退款','支付确认中','交付异常','已交付','已支付·赠送处理中','已支付·赠送待处理','已支付·发码中','待支付','已关闭'];

/* ===== utils ===== */
function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function money(c){ return '¥' + (Number(c||0)/100).toFixed(2); }
function q(sel, root){ return (root||document).querySelector(sel); }
function qa(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }
function uid(prefix){ return prefix + '_' + Math.random().toString(36).slice(2,8); }
function nowStr(){ const d=new Date(); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; }
function pageOf(id){ return PAGE_MAP[id]; }
function compId(page, defId, n){
  n = n||0; const list = page.comps.filter(c=>c.def===defId); return list[n] ? list[n].id : '';
}
function C(id, html, tag, cls, attrs){
  tag = tag||'div'; cls = cls?` class="${cls}"`:''; attrs = attrs?` ${attrs}`:'';
  return `<${tag}${id?` data-component="${esc(id)}"`:''}${cls}${attrs}>${html}</${tag}>`;
}
function icon(name){
  const paths = {
    back:'<path d="M15 4L7 12l8 8"/>', search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/>',
    service:'<path d="M4 12a8 8 0 0116 0"/><rect x="3" y="12" width="4" height="7"/><rect x="17" y="12" width="4" height="7"/><path d="M19 19a4 4 0 01-4 3h-2"/>',
    home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>', user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',
    order:'<rect x="5" y="3" width="14" height="18"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    arrow:'<path d="M9 5l7 7-7 7"/>', close:'<path d="M6 6l12 12M18 6L6 18"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>', copy:'<rect x="8" y="8" width="11" height="11"/><path d="M5 15V5h10"/>',
    check:'<path d="M5 12l4 4L19 6"/>', alert:'<path d="M12 3l9 17H3z"/><path d="M12 9v5M12 17v.5"/>',
    play:'<path d="M7 4l12 8-12 8z"/>', image:'<rect x="3" y="4" width="18" height="16"/><path d="M3 15l5-4 4 3 3-2 6 5"/>',
    lock:'<rect x="5" y="10" width="14" height="10"/><path d="M8 10V7a4 4 0 018 0v3"/>',
    refresh:'<path d="M20 11a8 8 0 10-2 6"/><path d="M20 4v7h-7"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]||''}</svg>`;
}
function toast(text, kind){
  const host = q('#toastHost'); if(!host) return;
  const id = 't'+Math.random().toString(36).slice(2);
  host.insertAdjacentHTML('beforeend', `<div class="toast ${kind==='err'?'err':''}" role="status" id="${id}">${esc(text)}</div>`);
  later(()=>{ const n=document.getElementById(id); if(n) n.remove(); }, 3000);
}
function flash(text){ RV.flash = text||''; const n=q('#flashLine'); if(n) n.textContent = RV.flash; }

/* ===== controls ===== */
function ends(){ return [{k:'H5',n:'移动端（A/B）'},{k:'WEB',n:'PC 端（C）'},{k:'ADM',n:'运营后台'}]; }
function pagesOf(end){ return PAGES.filter(p=>p.end===end); }
function defaultPage(end){ const l=pagesOf(end); return l[0]?l[0].id:''; }
function stateDef(page, code){ return page.states.find(s=>s.code===code) || page.states[0]; }

function initShell(){
  const endSel = q('#endSel');
  endSel.innerHTML = ends().map(e=>`<option value="${e.k}">${e.n}</option>`).join('');
  endSel.value = RV.end;
  endSel.addEventListener('change', ()=>{ RV.end=endSel.value; const p=defaultPage(RV.end); RV.pageId=p; RV.state=pageOf(p).states[0].code; RV.selected=''; clearTimers(); renderAll(); });
  q('#pageSel').addEventListener('change', e=>{ go(e.target.value, pageOf(e.target.value).states[0].code, true); });
  q('#stateSel').addEventListener('change', e=>{ RV.state=e.target.value; RV.selected=''; clearTimers(); renderAll(); });
  q('#simSel').addEventListener('change', e=>{ RV.sim=e.target.value; flash('模拟结果已切换：'+e.target.value); renderAll(); });
  q('#resetBtn').addEventListener('click', ()=>{ resetSession(); });
  q('#outlineChk').addEventListener('change', e=>{ RV.outline=e.target.checked; applyOutline(); });
  ['accSel','rnSel','phoneSel','agrSel','walletSel'].forEach(id=>{
    const n=document.getElementById(id); if(n) n.addEventListener('change', onConditionChange);
  });
  bindGlobal();
}

function onConditionChange(){
  const acc = q('#accSel').value;
  if(acc==='guest'){ S.account=null; }
  else { if(S.account!==acc){ S.buy=null; S.agreementChecked=false; S.search.draft=''; S.search.committed=''; S.currentOrder=null; } S.account=acc; }
  S.realName = q('#rnSel').value;
  S.adult = S.realName==='verified';
  S.phoneBound = q('#phoneSel').value==='bound';
  S.agreementChecked = q('#agrSel').value==='agreed';
  S.wallet = q('#walletSel').value;
  if(S.phoneBound) S.phoneMasked='138****0000';
  renderAll();
}

function resetSession(){
  S.account=null; S.realName='unverified'; S.adult=false; S.agreementChecked=false; S.phoneBound=false;
  S.noticeSeen={}; S.wallet='SUFFICIENT'; S.bindPhone=''; S.bindCode=''; S.bindError=''; S.bindCooldown=0;
  S.search={draft:'',committed:'',sort:'RECOMMEND',results:[]}; S.ordersTab='ALL'; S.homeBanner=0;
  S.buy=null; S.currentOrder=null; S.lastPay=null; S.purchased=[];
  ORDERS = ORDERS.filter(o=>!o._new);
  const acc=q('#accSel'); if(acc) acc.value='guest';
  const rn=q('#rnSel'); if(rn) rn.value='unverified';
  const ph=q('#phoneSel'); if(ph) ph.value='unbound';
  const ag=q('#agrSel'); if(ag) ag.value='unagreed';
  const wl=q('#walletSel'); if(wl) wl.value='SUFFICIENT';
  RV.sim='ok'; const sm=q('#simSel'); if(sm) sm.value='ok';
  RV.state = pageOf(RV.pageId).states[0].code; RV.selected=''; RV.flash='';
  clearTimers(); renderAll(); flash('已重置评审与模拟会话');
}

function syncControls(){
  const endSel=q('#endSel'); if(endSel) endSel.value=RV.end;
  const pageSel=q('#pageSel'); if(pageSel) pageSel.innerHTML=pagesOf(RV.end).map(p=>`<option value="${p.id}">${esc(p.name)}（${p.id}）</option>`).join('');
  if(pageSel) pageSel.value=RV.pageId;
  const stateSel=q('#stateSel'); const page=pageOf(RV.pageId);
  if(stateSel) stateSel.innerHTML=page.states.map(s=>`<option value="${s.code}">${s.name}（${s.code}）</option>`).join('');
  if(stateSel) stateSel.value=RV.state;
  const sim=q('#simSel'); if(sim) sim.value=RV.sim;
  const acc=q('#accSel'); if(acc) acc.value = S.account || 'guest';
  const rn=q('#rnSel'); if(rn) rn.value = S.realName;
  const ph=q('#phoneSel'); if(ph) ph.value = S.phoneBound ? 'bound' : 'unbound';
  const ag=q('#agrSel'); if(ag) ag.value = S.agreementChecked ? 'agreed' : 'unagreed';
  const wl=q('#walletSel'); if(wl) wl.value = S.wallet;
}

function renderAll(){
  const page = pageOf(RV.pageId);
  if(!page) return;
  if(!page.states.find(s=>s.code===RV.state)) RV.state = page.states[0].code;
  syncControls();
  const status = q('#statusBlock');
  const sd = stateDef(page, RV.state);
  status.innerHTML = `<div><b>页面：</b>${esc(page.name)} <span class="st-code">${page.id}</span></div>
    <div><b>状态：</b>${esc(sd.name)} <span class="st-code">${RV.state}</span></div>
    <div><b>模拟结果：</b>${esc(RV.sim)}</div>
    <div><b>数据来源：</b>模拟数据/建议契约</div>
    <div><b>下一步：</b>${esc(sd.exit)}</div>
    <div class="review-flash" id="flashLine">${esc(RV.flash)}</div>`;
  const reviewBody=q('#reviewBody'); if(reviewBody) reviewBody.className = RV.end==='H5'?'review-body':'review-body wide';
  const notesCol=q('#notesCol'); if(notesCol) notesCol.className = RV.end==='H5'?'notes-col':'notes-col wide';
  const host = q('#canvasHost');
  host.className = RV.end==='H5'?'canvas-col':'canvas-col wide-canvas';
  host.innerHTML = (RV.end==='H5') ? renderClientPage(page) : (RV.end==='WEB' ? renderClientPage(page) : renderAdminPage(page));
  // component list
  RV.selected = page.comps.find(c=>c.id===RV.selected) ? RV.selected : (page.comps[0]?page.comps[0].id:'');
  renderCompSelector(page);
  renderFooter();
  postRender(page);
  applyOutline();
}

function go(pageId, state, replace){
  const page = pageOf(pageId); if(!page) return;
  if(!replace && RV.pageId!==pageId){ const cur=pageOf(RV.pageId); const body=q('.m-body')||q('.web-main')||q('.admin-work'); if(body) RV.scrollBack = {id:RV.pageId, top: body.scrollTop}; NAV.push({pageId:RV.pageId,state:RV.state}); }
  RV.from = RV.pageId;
  RV.pageId = pageId; RV.state = state||page.states[0].code; RV.selected=''; RV.flash='';
  clearTimers(); renderAll();
}

function back(){
  const prev = NAV.pop();
  if(prev){ RV.pageId=prev.pageId; RV.state=prev.state; RV.selected=''; RV.flash=''; clearTimers(); renderAll(); }
  else { RV.pageId = defaultPage(RV.end); RV.state = pageOf(RV.pageId).states[0].code; clearTimers(); renderAll(); }
}

/* ===== component docs ===== */
function renderCompSelector(page){
  const sel = q('#compSel'); if(!sel) return;
  sel.innerHTML = page.comps.map(c=>`<option value="${c.id}">${esc(c.name)}（${c.id}）</option>`).join('');
  sel.value = RV.selected;
  q('#compCount').textContent = `本页组件实例 ${page.comps.length} 个`;
  sel.onchange = ()=>{ RV.selected=sel.value; renderCompDoc(page); applyOutline(); };
  renderCompDoc(page);
}

function mdLite(md){
  // COMP_DOCS sections are pre-rendered to safe HTML at build time; fallback escapes.
  return md;
}

function renderCompDoc(page){
  const box = q('#compDoc'); if(!box) return;
  const inst = page.comps.find(c=>c.id===RV.selected);
  if(!inst){ box.innerHTML='<div class="empty-note">本页无组件。</div>'; return; }
  const doc = COMP_DOCS[inst.id];
  const present = !!document.querySelector(`[data-component="${inst.id}"]`);
  if(!doc){ box.innerHTML = `<div class="empty-note">组件 ${esc(inst.id)} 缺少十节说明，构建失败。</div>`; return; }
  box.innerHTML = `<div class="comp-meta">${present?'当前状态已展示':'该组件在当前状态下未展示（定义保留）'} · 定义 ${esc(inst.def)}</div>` +
    doc.sections.map(s=>`<h4>${s.n}. ${esc(s.title)}</h4><div>${s.html}</div>`).join('');
}

function applyOutline(){
  qa('[data-component]').forEach(n=>{ n.style.outline=''; n.style.outlineOffset=''; });
  if(!RV.outline || !RV.selected) return;
  qa(`[data-component="${RV.selected}"]`).forEach(n=>{ n.style.outline='2px dashed #444'; n.style.outlineOffset='2px'; });
}

/* ===== footer / diagram / reader ===== */
function renderFooter(){
  const d = q('#diagramList');
  d.innerHTML = DIAGRAMS.map((g,i)=>`<button class="entry-btn" data-act="open-diagram" data-index="${i}"><b>${esc(g.id)} ${esc(g.title)}</b><span>${esc(g.from)} · ${g.kind}</span></button>`).join('') || '<div class="empty-note">无图示</div>';
  const docs = q('#docList');
  docs.innerHTML = DOCS.map((doc,i)=>`<button class="entry-btn" data-act="open-reader" data-index="${i}"><b>${esc(doc.file)}</b><span>${esc(doc.title)} · ${esc(doc.ver)}</span></button>`).join('');
}

function openReader(i){
  RV.readerOpen = true; RV.readerHist=[]; RV.readerDoc = Number(i)||0;
  const mask = document.createElement('div'); mask.className='reader-mask'; mask.id='readerMask';
  mask.innerHTML = `<div class="reader" role="dialog" aria-modal="true" aria-label="完整交付文件阅读器">
    <div class="reader-head"><div class="rt"><b id="readerTitle"></b><div class="rm" id="readerMeta"></div></div>
      <button class="btn btn-sm" data-act="reader-back" id="readerBack">返回上一文档</button>
      <button class="btn btn-sm" data-act="reader-download">下载 MD</button>
      <button class="btn btn-sm" data-act="reader-close">关闭</button></div>
    <div class="reader-body"><div class="reader-list" id="readerList"></div>
      <div class="reader-main"><div class="reader-toc" id="readerToc"></div><div class="reader-content" id="readerContent"></div></div></div></div>`;
  document.body.appendChild(mask);
  mask.addEventListener('click', e=>{ if(e.target===mask) closeReader(); });
  renderReader();
  const first = q('#readerContent'); if(first) first.focus();
}
function renderReader(){
  const doc = DOCS[RV.readerDoc]; if(!doc) return;
  q('#readerTitle').textContent = doc.title;
  q('#readerMeta').textContent = `${doc.file} · ${doc.ver} / ${doc.batch} · 全文 ${doc.chars} 字`;
  q('#readerList').innerHTML = DOCS.map((d,i)=>`<button class="reader-doc-btn" data-act="reader-switch" data-index="${i}" aria-current="${i===RV.readerDoc}">${esc(d.file)}<span>${esc(d.title)}</span></button>`).join('');
  q('#readerContent').innerHTML = doc.html;
  const toc = q('#readerToc');
  toc.innerHTML = (doc.toc||[]).map(t=>`<button data-act="reader-jump" data-target="${esc(t.id)}">${esc(t.text)}</button>`).join('');
  q('#readerBack').disabled = RV.readerHist.length===0;
  q('#readerContent').scrollTop = 0;
}
function switchReader(i){
  RV.readerHist.push({doc:RV.readerDoc, scroll:q('#readerContent').scrollTop});
  RV.readerDoc = Number(i); renderReader();
}
function closeReader(){
  const mask=q('#readerMask'); if(!mask) return;
  mask.remove(); RV.readerOpen=false; RV.readerHist=[];
  const trigger = q('[data-act="open-reader"]'); if(trigger) trigger.focus();
}
function readerBack(){
  if(!RV.readerHist.length) return;
  const h=RV.readerHist.pop(); RV.readerDoc=h.doc; renderReader();
  const c=q('#readerContent'); if(c&&h.scroll!=null) c.scrollTop=h.scroll;
}
function downloadDoc(){
  const doc=DOCS[RV.readerDoc]; if(!doc) return;
  const blob=new Blob([doc.md],{type:'text/markdown;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=doc.file; document.body.appendChild(a); a.click();
  later(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('已开始下载 '+doc.file);
}

function openDiagram(i){
  RV.diagramOpen=true; RV.diagramIndex=Number(i)||0; RV.diagramZoom='fit'; RV.diagramSrc=false;
  const g=DIAGRAMS[RV.diagramIndex]; if(!g) return;
  const mask=document.createElement('div'); mask.className='diagram-mask'; mask.id='diagramMask';
  mask.innerHTML=`<div class="diagram" role="dialog" aria-modal="true" aria-label="图示查看">
    <div class="diagram-head"><div class="dt"><b>${esc(g.id)} ${esc(g.title)}</b><div class="dm">来源 ${esc(g.from)} · 构建期 PlantUML 离线渲染</div></div>
      <div class="diagram-tools"><button class="btn btn-sm" data-act="diagram-zoom" data-z="fit">适应宽度</button><button class="btn btn-sm" data-act="diagram-zoom" data-z="1">100%</button><button class="btn btn-sm" data-act="diagram-zoom" data-z="0.5">50%</button><button class="btn btn-sm" data-act="diagram-zoom" data-z="2">200%</button><button class="btn btn-sm" data-act="diagram-src">图源</button><button class="btn btn-sm" data-act="diagram-close">关闭</button></div></div>
    <div class="diagram-body" id="diagramBody">${g.svg||'<div class="empty-note">该图未内嵌 SVG，请查看图源。</div>'}</div>
    <div class="diagram-src" id="diagramSrc" hidden><pre>${esc(g.puml||'')}</pre></div></div>`;
  document.body.appendChild(mask);
  mask.addEventListener('click', e=>{ if(e.target===mask) closeDiagram(); });
  applyDiagramZoom();
}
function applyDiagramZoom(){
  const svg=q('#diagramBody svg'); if(!svg) return;
  const body=q('#diagramBody');
  if(RV.diagramZoom==='fit'){ svg.style.width='100%'; svg.style.height='auto'; }
  else { const z=Number(RV.diagramZoom); svg.style.width=(svg.viewBox&&svg.viewBox.baseVal? svg.viewBox.baseVal.width*z : 900*z)+'px'; svg.style.height='auto'; }
}
function closeDiagram(){ const m=q('#diagramMask'); if(m) m.remove(); RV.diagramOpen=false; const t=q('[data-act="open-diagram"]'); if(t) t.focus(); }

/* ===== generic list/table helpers ===== */
function tabsCount(rows, field, values){
  const o={}; values.forEach(v=>o[v]=rows.filter(r=>field(r)===v).length); return o;
}
function pagerHtml(rt, total, idPrefix){
  const pages=Math.max(1,Math.ceil(total/rt.size));
  let html=`<div class="pager" data-component="${idPrefix}-C06"><div>共 ${total} 条 · 每页 <select data-act="adm-size">`;
  [10,20,50].forEach(n=>html+=`<option value="${n}" ${rt.size===n?'selected':''}>${n}</option>`);
  html+=`</select> 条</div><div class="pages"><button data-act="adm-page" data-page="${rt.page-1}" ${rt.page<=1?'disabled':''}>上一页</button>`;
  for(let i=1;i<=pages;i++){ if(pages>7 && i>2 && i<pages-1 && Math.abs(i-rt.page)>1) { if(i===3) html+='<span>…</span>'; continue; } html+=`<button data-act="adm-page" data-page="${i}" ${i===rt.page?'aria-current="page"':''}>${i}</button>`; }
  html+=`<button data-act="adm-page" data-page="${rt.page+1}" ${rt.page>=pages?'disabled':''}>下一页</button></div></div>`;
  return html;
}
function stateBlock(page, kind){
  if(kind==='LOADING') return `<div class="emptystate admin-emptystate" data-component="${page.id}-C11"><div class="skeleton sk-line" style="width:60%"></div><div class="skeleton sk-line"></div><div class="skeleton sk-line" style="width:80%"></div><div class="mt8 small">加载中，保留筛选与页签结构</div></div>`;
  if(kind==='EMPTY') return `<div class="emptystate admin-emptystate" data-component="${page.id}-C11"><div class="es-title">无匹配记录</div><div>当前条件下没有数据。可清除筛选或刷新重试。</div><div class="es-actions"><button class="btn btn-sm" data-act="adm-reset">清除筛选</button><button class="btn btn-sm" data-act="adm-refresh">刷新</button></div></div>`;
  if(kind==='ERROR') return `<div class="emptystate admin-emptystate" data-component="${page.id}-C11"><div class="es-title">查询失败</div><div>服务暂时不可用，已保留当前筛选条件。</div><div class="es-actions"><button class="btn btn-sm" data-act="adm-refresh">重试</button></div></div>`;
  if(kind==='TIMEOUT') return `<div class="emptystate admin-emptystate" data-component="${page.id}-C11"><div class="es-title">查询超时</div><div>结果未知，不代表没有数据；请重新查询。</div><div class="es-actions"><button class="btn btn-sm" data-act="adm-refresh">重新查询</button></div></div>`;
  if(kind==='NO_PERM') return `<div class="emptystate admin-emptystate" data-component="${page.id}-C11"><div class="es-title">无权限访问该模块</div><div>当前角色没有此模块权限，请联系管理员授权。</div><div class="es-actions"><button class="btn btn-sm" data-act="adm-role-hint">申请权限</button></div></div>`;
  return '';
}

/* ===== client renderers ===== */
function h5Frame(page, body, opts){
  opts = opts||{};
  const overlay = opts.overlay||'';
  const backdrop = opts.backdrop||'';
  return `<div class="phone-wrap"><div class="phone"><div class="notch"></div><div class="phone-inner" id="phoneInner">
    ${backdrop?`<div class="m-page" aria-hidden="true" style="pointer-events:none">${backdrop}</div>`:''}
    ${backdrop?'':`<div class="m-page">${body}</div>`}
    ${overlay}
    <div class="toast-host" id="toastHost"></div>
  </div></div></div>`;
}
function webFrame(page, body, opts){
  opts=opts||{};
  return `<div class="web-canvas-host web-page" id="webCanvas">
    ${opts.backdrop||''}
    ${opts.backdrop?'':body}
    ${opts.overlay||''}
    <div class="toast-host" id="toastHost"></div>
  </div>`;
}
function h5Header(page, title, opts){
  opts=opts||{};
  const id = compId(page,'COM-CLIENT-C08');
  const idSvc = compId(page,'COM-CLIENT-C07');
  return C(id, `${opts.back?'<button class="iconbtn" data-act="back" aria-label="返回">'+icon('back')+'</button>':'<span style="width:44px"></span>'}
    <div class="m-title">${esc(title)}</div>
    <div class="m-actions">${opts.search?'<button class="iconbtn" data-act="go-search" aria-label="搜索">'+icon('search')+'</button>':''}${opts.service?(idSvc?C(idSvc,'<button class="iconbtn" data-act="go-service" aria-label="客服">'+icon('service')+'</button>'):'<button class="iconbtn" data-act="go-service" aria-label="客服">'+icon('service')+'</button>'):''}</div>`, 'header','m-header');
}
function h5Tabbar(page, active){
  const id=compId(page,'COM-CLIENT-C14');
  return C(id, `<button class="m-tab" data-act="tab-home" aria-current="${active==='home'?'page':'false'}">${icon('home')}<span>商城</span></button>
    <button class="m-tab" data-act="tab-profile" aria-current="${active==='profile'?'page':'false'}">${icon('user')}<span>我的</span></button>`, 'nav','m-tabbar');
}
function h5Body(html, cls){ return `<div class="m-body ${cls||''}">${html}</div>`; }
function webHeader(page, active){
  const id=compId(page,'COM-CLIENT-C34');
  const idSvc=compId(page,'COM-CLIENT-C07');
  return C(id, `<div class="web-header-in"><div class="web-logo">Steam商城</div>
    <nav class="web-nav"><button data-act="web-home" aria-current="${active==='home'?'page':'false'}">商城</button><button data-act="go-search">搜索商品</button><button data-act="tab-profile">我的</button></nav>
    <div class="web-user">${S.account?'<span>'+esc(S.nickname)+'</span>':'<button class="linkbtn" data-act="go-auth">登录</button>'}${idSvc?C(idSvc,'<button class="linkbtn" data-act="go-service">客服</button>'):'<button class="linkbtn" data-act="go-service">客服</button>'}</div></div>`, 'header','web-header');
}
function productCard(page, p){
  const id=compId(page,'COM-CLIENT-C03');
  const tag = p.delivery==='GIFT'?'好友赠送':'口令码';
  return C(id, `<div class="card-media">图片占位</div><div class="card-name">${esc(p.name)}</div><div class="card-price">${money(p.price)}</div><div class="card-tags"><span class="tag">${tag}</span>${p.sale==='SOLD_OUT'?'<span class="tag tag-err">售罄</span>':''}</div>`,
    'button','m-card',`data-act="open-product" data-id="${p.id}" style="text-align:left;border:1px solid var(--line);background:#fff;padding:8px"`);
}
function visibleProducts(){
  return PRODUCTS.filter(p=>p.sale!=='OFFLINE' && p.id!=='p07');
}
function sortedProducts(list, sort){
  const arr=list.slice();
  if(sort==='PRICE_ASC') arr.sort((a,b)=>a.price-b.price);
  else if(sort==='PRICE_DESC') arr.sort((a,b)=>b.price-a.price);
  else if(sort==='LATEST') arr.reverse();
  return arr;
}
function sortBar(page, sort, act){
  const id=compId(page,'COM-CLIENT-C05');
  const opts=[['RECOMMEND','推荐'],['LATEST','最新'],['PRICE_ASC','价格升序'],['PRICE_DESC','价格降序']];
  return C(id, `<div class="m-tabs" style="border-bottom:0">${opts.map(o=>`<button class="m-tab2" data-act="${act}" data-sort="${o[0]}" aria-selected="${sort===o[0]}">${o[1]}</button>`).join('')}</div>`, 'div','');
}
function listState(page, kind, msg){
  const id=compId(page,'COM-CLIENT-C09');
  if(kind==='LOADING') return C(id, `<div class="skeleton sk-card"></div><div class="skeleton sk-card"></div><div class="small muted" style="text-align:center">加载中…</div>`);
  if(kind==='EMPTY') return C(id, `<div class="emptystate"><div class="es-title">${esc(msg||'暂无内容')}</div><div>可修改条件或返回上一页。</div></div>`);
  if(kind==='ERROR') return C(id, `<div class="emptystate"><div class="es-title">加载失败</div><div>请检查网络后重试，当前条件已保留。</div><div class="es-actions"><button class="btn btn-sm" data-act="retry">重试</button></div></div>`);
  if(kind==='END') return C(id, `<div class="small muted" style="text-align:center;padding:12px">没有更多了</div>`);
  return '';
}
function noticeBar(page, kind, title, text, action){
  const id=compId(page,'COM-CLIENT-C36');
  return C(id, `<div class="nb-title">${esc(title)}</div><div>${esc(text)}</div>${action?`<div class="mt8">${action}</div>`:''}`, 'div','noticebar '+(kind==='ERROR'?'error':''));
}
function productTagLine(p){
  return `<span class="tag">${p.delivery==='GIFT'?'好友赠送':'口令码'}</span> ${p.sale==='SOLD_OUT'?'<span class="tag tag-err">售罄</span>':''} ${p.sale==='OFFLINE'?'<span class="tag tag-err">不可售</span>':''}`;
}
function stockNote(p){
  if(p.stock==='SOLD_OUT') return '库存缓存新鲜且为 0，显示售罄并禁止新购。';
  if(p.stock==='UNKNOWN') return '库存缓存过期或同步失败，允许下单，但以付款后供应商结果为准，失败自动退款/补货。';
  if(p.stock==='BUNDLE') return '组合商品首期不上架，不进入自动发码。';
  return '库存来自供应商缓存，付款后取码时才校验实际库存。';
}
function walletBlocked(p){
  return p.delivery==='CODE' && S.wallet!=='SUFFICIENT';
}

/* ---------- H5 pages ---------- */
function h5Home(page, state){
  if(state==='LOADING'){
    return h5Frame(page, h5Header(page,'Steam商城',{search:true,service:true})+h5Body(`<div class="page-pad">${listState(page,'LOADING')}</div>`)+h5Tabbar(page,'home'));
  }
  if(state==='EMPTY'||state==='ERROR'){
    return h5Frame(page, h5Header(page,'Steam商城',{search:true,service:true})+h5Body(`<div class="page-pad">${listState(page,state==='EMPTY'?'EMPTY':'ERROR','暂无商品')}</div>`)+h5Tabbar(page,'home'));
  }
  const idBanner=compId(page,'COM-CLIENT-C15');
  const idQuick=compId(page,'COM-CLIENT-C16');
  const idList=compId(page,'COM-CLIENT-C06');
  const list=sortedProducts(visibleProducts(),S.homeSort||'RECOMMEND');
  const banners=[{id:'b1',name:'影之刃零',pid:'p01'},{id:'b2',name:'黑神话：悟空',pid:'p04'},{id:'b3',name:'双人成行',pid:'p05'}];
  const b=banners[S.homeBanner%banners.length];
  const banner=C(idBanner, `<button data-act="open-product" data-id="${b.pid}" style="border:0;background:transparent;width:100%;height:100%;color:inherit;font-size:12px">广告位 ${S.homeBanner+1}/3 · ${esc(b.name)}<span class="dots">${banners.map((_,i)=>`<span class="dot ${i===S.homeBanner?'on':''}"></span>`).join('')}</span></button>`, 'div','m-banner');
  const quick=C(idQuick, `<button data-act="go-search">${icon('search')}<span>搜索</span></button><button data-act="tab-orders">${icon('order')}<span>我的订单</span></button><button data-act="go-service">${icon('service')}<span>客服</span></button>`, 'div','quicknav');
  const grid=`<div class="m-grid">${list.map(p=>productCard(page,p)).join('')}</div>`;
  const list_=C(idList, grid, 'div','');
  return h5Frame(page, h5Header(page,'Steam商城',{search:true,service:true})+h5Body(`<div class="page-pad">
      ${banner}
      <div class="mt12">${quick}</div>
      <div class="mt12">${sortBar(page,S.homeSort||'RECOMMEND','home-sort')}</div>
      <div class="mt8">${list_}</div>
      <div class="mt12 small muted" style="text-align:center">共 ${list.length} 个已发布商品</div>
    </div>`)+h5Tabbar(page,'home'));
}
function h5SearchHome(page, state){
  const idInput=compId(page,'COM-CLIENT-C01');
  const idSubmit=compId(page,'COM-CLIENT-C02');
  const idDisc=compId(page,'COM-CLIENT-C39');
  const search=C(idInput, `<input class="input" id="searchInput" type="text" value="${esc(S.search.draft)}" placeholder="输入商品名称搜索" aria-label="输入商品名称搜索">`, 'div','flex1');
  const btn=C(idSubmit, `<button class="btn btn-primary" data-act="search-submit" ${S.search.draft.trim()?'':'disabled'}>搜索</button>`);
  const body=`<div class="page-pad">
    <div class="searchbar">${search}${btn}</div>
    ${state==='ERROR'?listState(page,'ERROR'):''}
    ${state==='EMPTY'?`<div class="mt12 emptystate"><div class="es-title">暂无搜索发现内容</div><div>可直接输入商品名称搜索。</div></div>`:''}
    ${state!=='ERROR'&&state!=='EMPTY'?C(idDisc, `
      <div class="m-section"><div class="m-section-title">搜索发现</div><div class="kw-list">${['赛博朋克','影之刃','黑神话','双人成行','艾尔登法环'].map(k=>`<button class="kw" data-act="search-keyword" data-kw="${k}">${k}</button>`).join('')}</div></div>
      <div class="m-section"><div class="m-section-title">热门商品</div><div class="hot-list">${['p01','p04','p05','p03'].map(id=>{const p=product(id);return `<button class="hot-item" data-act="open-product" data-id="${p.id}"><div class="hm">图片</div><div class="card-name" style="min-height:0">${esc(p.name)}</div><div class="small">${money(p.price)}</div></button>`;}).join('')}</div></div>
    `,'div',''):''}
  </div>`;
  return h5Frame(page, h5Header(page,'搜索',{back:true})+h5Body(body));
}
function filterByKeyword(kw){
  const q=kw.trim().toLowerCase();
  return visibleProducts().filter(p=>p.name.toLowerCase().includes(q)||p.nameEn.toLowerCase().includes(q));
}
function h5SearchResults(page, state){
  const idInput=compId(page,'COM-CLIENT-C01');
  const idSubmit=compId(page,'COM-CLIENT-C02');
  const idList=compId(page,'COM-CLIENT-C06');
  const search=C(idInput, `<input class="input" id="searchInput" type="text" value="${esc(S.search.committed)}" placeholder="输入商品名称搜索" aria-label="当前搜索关键词">`, 'div','flex1');
  const btn=C(idSubmit, `<button class="btn btn-primary" data-act="search-submit">搜索</button>`);
  let body=`<div class="page-pad"><div class="searchbar">${search}${btn}</div>`;
  if(state==='LOADING'){ body+=listState(page,'LOADING'); }
  else if(state==='EMPTY'){ body+=`<div class="mt12 emptystate"><div class="es-title">没有找到相关商品</div><div>试试修改关键词，或返回搜索发现。</div><div class="es-actions"><button class="btn btn-sm" data-act="back">返回</button></div></div>`; }
  else if(state==='ERROR'){ body+=listState(page,'ERROR'); }
  else {
    const list=sortedProducts(filterByKeyword(S.search.committed),S.search.sort||'RECOMMEND');
    body+=`<div class="mt8">${sortBar(page,S.search.sort||'RECOMMEND','result-sort')}</div>`;
    body+=`<div class="small muted mt4">“${esc(S.search.committed)}” 共 ${list.length} 个结果</div>`;
    body+=`<div class="mt8">${C(idList,`<div class="m-grid">${list.map(p=>productCard(page,p)).join('')}</div>`,'div','')}</div>`;
    if(state==='END') body+=listState(page,'END');
  }
  body+='</div>';
  return h5Frame(page, h5Header(page,'搜索结果',{back:true,search:false})+h5Body(body));
}
function productState(p){
  if(walletBlocked(p)) return 'BUSINESS_REJECT';
  if(p.sale==='SOLD_OUT') return 'SOLD_OUT';
  if(p.sale==='OFFLINE') return 'OFFLINE';
  return 'OK';
}
function h5Product(page, state){
  const p=product(S.currentProduct||'p01');
  if(state==='LOADING') return h5Frame(page, h5Header(page,'商品详情',{back:true,search:true,service:true})+h5Body(`<div class="page-pad">${listState(page,'LOADING')}</div>`));
  if(state==='ERROR') return h5Frame(page, h5Header(page,'商品详情',{back:true,search:true,service:true})+h5Body(`<div class="page-pad">${listState(page,'ERROR')}</div>`));
  const idGal=compId(page,'COM-CLIENT-C18');
  const idInfo=compId(page,'COM-CLIENT-C40');
  const idExpand=compId(page,'COM-CLIENT-C19');
  const idAction=compId(page,'COM-CLIENT-C17');
  const active=activeOrderFor(p.id);
  const effective = state==='UNAVAILABLE' ? (p.sale==='SOLD_OUT'?'售罄':p.sale==='OFFLINE'?'已下架':'不可售')
    : state==='PENDING' ? '订单处理中' : '立即购买';
  let actionInner='';
  if(state==='PENDING'){
    actionInner=`<div class="small muted" style="flex:1">当前账号对该商品有一笔有效未支付/确认中订单<br><b>订单 ${active?active.no:''}</b></div><button class="btn btn-primary" data-act="recover-order" data-id="${active?active.id:'o3'}">订单处理中</button>`;
  } else if(state==='PAID_DELIVERING'){
    actionInner=`<div class="small muted" style="flex:1">您有一笔订单正在交付，点击查看<br><b>${active?active.no:''}</b></div><button class="btn btn-primary" data-act="buy-open" data-id="${p.id}">立即购买</button>`;
  } else if(state==='UNAVAILABLE'){
    actionInner=`<button class="btn btn-primary" disabled>${effective}</button><button class="btn" data-act="tab-orders">查看订单</button>`;
  } else {
    actionInner=`<div class="small muted" style="flex:1">${p.delivery==='GIFT'?'每天 8:00～18:00 人工交付':'付款后自动取码'}</div><button class="btn btn-primary" data-act="buy-open" data-id="${p.id}">立即购买</button>`;
  }
  const gal=C(idGal, `<div class="gallery-main">商品主图占位 ${S.mediaIndex!==undefined?(S.mediaIndex+1):1}/3</div><div class="gallery-thumbs">${[0,1,2].map(i=>`<button data-act="media" data-i="${i}" aria-pressed="${(S.mediaIndex||0)===i}">图${i+1}</button>`).join('')}</div>`);
  const info=C(idInfo, `<div class="m-row-between"><div><h3 style="font-size:19px">${esc(p.name)}</h3><div class="small muted">${esc(p.nameEn)}</div></div><div class="txt-r"><div class="price price-lg">${money(p.price)}</div><div class="small muted">数量固定 1</div></div></div>
    <div class="mt8">${productTagLine(p)}</div>
    <div class="mt8 small">${p.restrict.map(r=>esc(r)).join(' · ')}</div>
    <div class="mt8 small muted">${esc(stockNote(p))}</div>`);
  const notice = (state==='UNAVAILABLE'||state==='PENDING'||p.stock==='UNKNOWN'||walletBlocked(p)) ?
    noticeBar(page, state==='UNAVAILABLE'||walletBlocked(p)?'ERROR':'INFO', state==='PENDING'?'订单说明':'购买提示',
      state==='PENDING'?'“订单处理中”仅指已有未支付或支付结果待确认订单，不代表赠送已开始履约。':walletBlocked(p)?'供应商余额不足或查询失败，暂不可购买口令码商品；好友赠送不受影响。':p.sale==='SOLD_OUT'?'库存缓存新鲜且为 0，已售罄。':p.sale==='OFFLINE'?'商品未发布、已下架或价格不合规，暂不可购买。':'库存信息可能延迟，以付款后供应商结果为准；失败自动退款/补货。') : '';
  const expand=C(idExpand, `<div class="info-block"><h4>${S.productExpanded?'游戏介绍':'游戏介绍'}</h4><div class="small ${S.productExpanded?'':'muted'}">${S.productExpanded?esc(p.desc)+' 本段为运营维护的模拟内容，正式内容需审核后发布。':'开放世界/动作/角色扮演。展开查看完整介绍与购买须知。'}</div><button class="linkbtn mt4" data-act="expand">${S.productExpanded?'收起':'展开全部'}</button></div>`);
  const body=`<div class="page-pad">${gal}<div class="mt12">${info}</div>${notice}${expand}
    <div class="info-block"><h4>购买须知</h4><div class="small muted">虚拟商品一经履约原则上不退款；系统异常按规则原路退款。付款后好友链接不可修改。客服：企业微信。</div></div></div>`;
  return h5Frame(page, h5Header(page,'商品详情',{back:true,search:true,service:true})+h5Body(body)+C(idAction,actionInner,'div','m-actionbar'));
}
function h5BuyBackdrop(p){
  return h5Header(pageOf('H5-PRODUCT-01'),'商品详情',{back:true})+h5Body(`<div class="page-pad"><div class="gallery-main">商品主图占位</div><div class="mt12"><h3 style="font-size:19px">${esc(p.name)}</h3><div class="price">${money(p.price)}</div><div class="small muted mt4">${esc(p.restrict[0]||'')}</div></div></div>`)+`<div class="m-actionbar"><button class="btn btn-primary" disabled>立即购买</button></div>`;
}
function h5PhoneBackdrop(page,p){
  return h5Header(page,'商品详情',{back:true})+h5Body(`<div class="page-pad"><div class="gallery-main">商品主图占位</div><div class="mt12"><h3 style="font-size:19px">${esc(p.name)}</h3><div class="price">${money(p.price)}</div><div class="small muted mt4">${esc(p.restrict[0]||'')}</div></div></div>`)+`<div class="m-actionbar"><button class="btn btn-primary" disabled>立即购买</button></div>`;
}
function h5Buy(page, state){
  const b=S.buy||{productId:'p01',specId:'p01-s1',delivery:'CODE',friendLink:'',payMethod:'WECHAT',agreementChecked:S.agreementChecked,error:''};
  const p=product(b.productId); const sp=specOf(p,b.specId);
  const idSum=compId(page,'COM-CLIENT-C10');
  const idSpec=compId(page,'COM-CLIENT-C20');
  const idLink=compId(page,'COM-CLIENT-C23');
  const idPay=compId(page,'COM-CLIENT-C22');
  const idAgr=compId(page,'COM-CLIENT-C21');
  const idAmt=compId(page,'COM-CLIENT-C33');
  let inner=`<div class="m-row-between"><div><h3 style="font-size:16px">核对购买内容</h3><div class="small muted">${esc(p.name)} · ${esc(sp.name)}</div></div><div class="price">${money(sp.price)}</div></div>`;
  inner+=C(idSum,`<div class="m-row mt8"><div class="thumb">图片</div><div class="flex1"><div class="strong">${esc(p.name)}</div><div class="small muted">${esc(sp.name)} · 数量 1</div><div class="small muted">${p.delivery==='GIFT'?'好友赠送':'口令码自动交付'}</div></div></div>`);
  inner+=`<div class="info-block"><h4>选择规格</h4>${C(idSpec,`<div class="seg">${p.specs.map(s=>`<button class="segbtn" data-act="spec-select" data-id="${s.id}" aria-pressed="${s.id===b.specId}">${esc(s.name)} · ${money(s.price)}</button>`).join('')}</div><div class="small muted mt4">切换规格将先查询旧订单支付状态；确认中不关闭旧单。</div>`)}</div>`;
  if(p.delivery==='GIFT'){
    inner+=`<div class="info-block"><h4>Steam 好友链接</h4>${C(idLink,`<input class="input ${b.error==='link'?'err':''}" id="friendInput" type="text" value="${esc(b.friendLink)}" placeholder="请输入 Steam 好友链接" aria-label="Steam 好友链接"><div class="hint">付款前可修改，付款后不可修改；格式以供应商确认为准。</div>${b.error==='link'?'<div class="errmsg">请输入有效的 Steam 好友链接</div>':''}`)}</div>`;
  }
  inner+=`<div class="info-block"><h4>支付方式</h4>${C(idPay,`<div class="radio-list">${[['WECHAT','微信支付'],['ALIPAY','支付宝']].map(m=>`<div class="checkrow"><input type="radio" name="paym" id="pay_${m[0]}" data-act="pay-method" data-m="${m[0]}" ${b.payMethod===m[0]?'checked':''}><label for="pay_${m[0]}">${m[1]}</label></div>`).join('')}</div>`)}</div>`;
  const noticeNeeded=!b.agreementChecked;
  inner+=`<div class="info-block">${C(idAgr,`<div class="checkrow"><input type="checkbox" id="agrChk" data-act="agreement-check" ${b.agreementChecked?'checked':''}><label for="agrChk">我已阅读并同意 <button class="linkbtn" data-act="go-agreement" type="button">《购买协议》</button></label></div><div class="small muted">协议默认不勾选；未勾选点击购买将先展示购买须知。</div>`)}</div>`;
  inner+=C(idAmt,`<div class="m-row-between mt8"><span class="small muted">合计（数量 1）</span><span class="price">${money(sp.price)}</span></div>`);
  if(state==='BUSINESS_REJECT'||b.error==='reject'){
    inner+=noticeBar(page,'ERROR','暂不可购买', b.rejectText||'供应商余额不足或商品不可售，请稍后重试或联系客服。');
  } else if(state==='VALIDATION_ERROR'||b.error){
    inner+=noticeBar(page,'INFO','请先完善购买条件', b.error==='link'?'请填写有效的 Steam 好友链接。':'请完成登录、实名、协议或手机号校验后继续。');
  } else {
    inner+=noticeBar(page,'INFO','支付前校验','最终点击将依次校验登录、实名成年、协议、手机号、商品可售、供应商余额和订单并存规则。');
  }
  const btnText=state==='SUBMITTING'?'处理中…':`购买并支付 ${money(sp.price)}`;
  const overlay=`<div class="layer-host"><div class="layer-mask" data-act="buy-close"></div><div class="layer bottom"><div class="layer-head"><div class="layer-title">核对购买内容</div><button class="layer-close" data-act="buy-close" aria-label="关闭">✕</button></div><div class="layer-body">${inner}</div><div class="layer-foot"><button class="btn btn-primary btn-block" data-act="buy-submit" ${state==='SUBMITTING'?'disabled':''}>${btnText}</button></div></div></div>`;
  const noticeLayer = b.showNotice ? `<div class="layer-host" style="z-index:90"><div class="layer-mask"></div><div class="layer"><div class="layer-head"><div class="layer-title">购买须知</div><button class="layer-close" data-act="notice-close" aria-label="关闭">✕</button></div><div class="layer-body"><div class="small">购买前请阅读《购买协议》。虚拟商品一经履约原则上不退款；好友赠送在每天 8:00～18:00 人工交付。未勾选协议时需明确同意后才能继续。</div></div><div class="layer-foot"><button class="btn" data-act="notice-close">取消</button><button class="btn btn-primary" data-act="notice-agree">同意并继续</button></div></div></div>` : '';
  return h5Frame(page, '', {backdrop:h5BuyBackdrop(p), overlay:overlay+noticeLayer});
}
function h5Checkout(page, state){
  const o=S.currentOrder||orderById('o3');
  if(state==='ERROR') return h5Frame(page, h5Header(page,'确认订单',{back:true})+h5Body(`<div class="page-pad">${listState(page,'ERROR')}</div>`));
  const idSum=compId(page,'COM-CLIENT-C10'); const idAmt=compId(page,'COM-CLIENT-C33'); const idAgr=compId(page,'COM-CLIENT-C21'); const idAct=compId(page,'COM-CLIENT-C17');
  const p=product(o.productId); const sp=specOf(p,o.specId);
  let body=`<div class="page-pad"><div class="m-card"><div class="m-row-between"><span class="small muted">订单号</span><span class="mono small">${esc(o.no)}</span></div><div class="m-row-between mt4"><span class="small muted">状态</span><span class="tag">${state==='EXPIRED'?'已关闭':'待支付'}</span></div></div>
    <div class="mt12">${C(idSum,`<div class="m-card"><div class="m-row"><div class="thumb">图片</div><div class="flex1"><div class="strong">${esc(p.name)}</div><div class="small muted">${esc(sp.name)} · 数量 1</div><div class="small muted">${p.delivery==='GIFT'?'好友赠送':'口令码自动交付'}</div></div></div></div>`)}</div>
    ${state==='EXPIRED'?noticeBar(page,'ERROR','订单已关闭','超过有效期且服务端确认未支付，或商品已不可售。商品恢复可售后可重新购买。'):noticeBar(page,'INFO','保价不保售','有效期内按订单快照价格；继续支付前会重新校验商品可售性。')}
    <div class="mt12">${C(idAgr,`<div class="checkrow"><input type="checkbox" id="chkAgr2" data-act="agreement-check" checked><label for="chkAgr2">已同意《购买协议》 v1.6</label></div><div class="small muted">协议版本与确认时间随订单保存。</div>`)}</div>
    <div class="mt12">${C(idAmt,`<div class="m-row-between"><span class="small muted">应付金额</span><span class="price">${money(o.amount)}</span></div>`)}</div>
    <div class="mt8 small muted">剩余有效期：约 18 分钟（仅在有可信到期时间时展示）。</div></div>`;
  const action=state==='EXPIRED'
    ? `<button class="btn btn-primary" data-act="open-product" data-id="${p.id}">重新购买</button><button class="btn" data-act="tab-orders">查看订单</button>`
    : `<button class="btn btn-primary" data-act="checkout-pay" ${state==='SUBMITTING'?'disabled':''}>${state==='SUBMITTING'?'处理中…':'继续支付 '+money(o.amount)}</button>`;
  return h5Frame(page, h5Header(page,'确认订单',{back:true,service:true})+h5Body(body)+C(idAct,action,'div','m-actionbar'));
}
function h5Pay(page, state){
  const o=S.currentOrder||orderById('o3');
  const channel=(S.buy&&S.buy.payMethod)==='ALIPAY'?'支付宝':'微信支付';
  const idCash=compId(page,'COM-CLIENT-C38'); const idAmt=compId(page,'COM-CLIENT-C33');
  let body=`<div class="page-pad"><div class="m-card txt-r">${C(idAmt,`<div class="small muted">${esc(o.no)}</div><div class="price price-lg mt4">${money(o.amount)}</div><div class="small muted">${channel}</div>`)}</div>
    <div class="mt16 m-card" style="text-align:center;padding:24px 12px">${C(idCash,`<div style="font-size:40px">${icon('lock')}</div><div class="strong mt8">${state==='WAITING'?'等待支付结果':'正在唤起'+channel}</div><div class="small muted mt4">请在${channel}中完成支付后返回商城</div><div class="small muted mt8">支付结果以服务端查询为准，请勿重复付款。</div>`)}</div>
    <div class="mt12">${noticeBar(page,'INFO','支付说明','若已完成支付但页面未更新，请点击“我已完成支付”查询；若未支付，可返回确认订单继续支付。')}</div></div>`;
  const action=`<button class="btn btn-primary" data-act="pay-paid">我已完成支付</button><button class="btn" data-act="pay-problem">支付遇到问题</button>`;
  return h5Frame(page, h5Header(page,'支付',{back:true})+h5Body(body)+`<div class="m-actionbar">${action}</div>`);
}
function h5Payret(page, state){
  const o=S.currentOrder||orderById('o3');
  const idQ=compId(page,'COM-CLIENT-C24'); const idN=compId(page,'COM-CLIENT-C36'); const idS=compId(page,'COM-CLIENT-C09');
  let inner='';
  if(state==='QUERYING'){
    inner=C(idQ,C(idS,`<div style="text-align:center;padding:18px 0"><div class="skeleton sk-line" style="width:70%;margin:0 auto"></div><div class="strong mt12">正在查询支付结果…</div><div class="small muted mt4">请勿重复支付</div></div>`));
  } else if(state==='TIMEOUT'){
    inner=C(idQ,C(idS,C(idN,`<div class="noticebar error"><div class="nb-title">暂未取得支付结果</div><div>订单保持“支付确认中”。请稍后重新查询或联系客服；不要重复付款。</div></div>`)+`<div class="mt12 small muted">订单号：<span class="mono">${esc(o.no)}</span></div>`));
  } else if(state==='UNPAID'){
    inner=C(idQ,`<div class="noticebar"><div class="nb-title">服务端确认未支付</div><div>订单仍在有效期内，可返回确认订单继续支付。</div></div>`);
  } else if(state==='PAID'){
    inner=C(idQ,`<div class="noticebar"><div class="nb-title">服务端确认已支付</div><div>正在进入支付与交付结果页。</div></div>`);
  } else {
    inner=C(idQ,`<div class="small">您的支付结果尚未返回。无论选择哪一项，商城都会向服务端查询真实结果；选择不会直接改变订单状态。</div><div class="mt8 small muted">订单号：<span class="mono">${esc(o.no)}</span></div>`);
  }
  const actions = state==='QUERYING' ? '<button class="btn btn-primary" disabled>查询中…</button>'
    : state==='TIMEOUT' ? '<button class="btn btn-primary" data-act="pay-requery">重新查询</button><button class="btn" data-act="go-orders">查看订单</button>'
    : state==='UNPAID' ? '<button class="btn btn-primary" data-act="go-checkout">继续支付</button><button class="btn" data-act="go-orders">返回订单</button>'
    : state==='PAID' ? '<button class="btn btn-primary" data-act="go-result">查看结果</button>'
    : '<button class="btn btn-primary" data-act="pay-answer" data-a="unpaid">未支付</button><button class="btn btn-primary" data-act="pay-answer" data-a="paid">已支付</button>';
  const overlay=`<div class="layer-host"><div class="layer-mask"></div><div class="layer" style="max-width:280px"><div class="layer-head"><div class="layer-title">您是否已经完成了支付？</div></div><div class="layer-body">${inner}</div><div class="layer-foot" style="justify-content:center">${actions}</div></div></div>`;
  return h5Frame(page, '', {backdrop:h5CheckoutBackdrop(S.currentOrder||orderById('o3')), overlay});
}
function orderStatusSummary(page, o){
  const id=compId(page,'COM-CLIENT-C28');
  const pay=o.pay==='PAID'?'已支付':o.pay==='PENDING'?'待支付':o.pay==='CONFIRMING'?'支付确认中':'已关闭';
  const del=o.pay!=='PAID'?'—':o.deliveryStatus==='DELIVERED'?'已交付':o.deliveryStatus==='ISSUING'?'发码中':o.deliveryStatus==='PENDING'?'赠送待处理':o.deliveryStatus==='PROCESSING'?'赠送处理中':o.deliveryStatus==='EXCEPTION'?'交付异常':'未启动';
  const ref=o.refund==='FAILED'?'退款失败':o.refund==='SUCCESS'?'已退款':o.refund==='PROCESSING'?'退款中':o.refund==='PENDING'?'待处理':'—';
  return C(id,`<div class="m-card"><div class="small muted">订单状态</div><div class="mt8 m-row-between"><span class="small">支付</span><span class="tag">${pay}</span></div><div class="m-row-between mt4"><span class="small">交付</span><span class="tag">${del}</span></div><div class="m-row-between mt4"><span class="small">退款</span><span class="tag ${o.refund==='FAILED'?'tag-err':''}">${ref}</span></div></div>`);
}
function deliveryBlock(page,o){
  if(o.delivery==='CODE'){
    if(o.deliveryStatus==='DELIVERED'){
      const id=compId(page,'COM-CLIENT-C25');
      return C(id,`<div class="m-card"><div class="m-row-between"><div class="strong">口令码已交付</div><span class="tag tag-ok">已交付</span></div><div class="codebox mt8">${esc(o.cdk||'VG-****-0016')}</div><div class="small muted mt4">复制后请在 Steam 客户端激活；请勿向他人泄露。</div><div class="mt8"><button class="btn btn-sm" data-act="copy-cdk" data-id="${o.id}">${icon('copy')} 复制口令码</button></div></div>`);
    }
    if(o.deliveryStatus==='ISSUING'){
      const id=compId(page,'COM-CLIENT-C25');
      return C(id,`<div class="m-card"><div class="m-row-between"><div class="strong">正在获取口令码…</div><span class="tag">发码中</span></div><div class="small muted mt8">付款已确认，供应商取码尚未返回。请稍后刷新，不会重复扣款。</div><div class="mt8"><button class="btn btn-sm" data-act="refresh-result">刷新</button></div></div>`);
    }
    const id=compId(page,'COM-CLIENT-C25');
    return C(id,`<div class="m-card"><div class="m-row-between"><div class="strong">交付异常</div><span class="tag tag-err">异常</span></div><div class="small muted mt8">暂未取得口令码。请联系客服并提供订单号，不会伪造口令码。</div><div class="mt8"><button class="btn btn-sm" data-act="go-service">联系客服</button></div></div>`);
  }
  const id=compId(page,'COM-CLIENT-C26');
  const st=o.deliveryStatus==='DELIVERED'?'已完成':o.deliveryStatus==='PROCESSING'?'处理中':o.deliveryStatus==='EXCEPTION'?'处理异常':'待处理';
  return C(id,`<div class="m-card"><div class="m-row-between"><div class="strong">好友赠送</div><span class="tag ${o.deliveryStatus==='EXCEPTION'?'tag-err':''}">${st}</span></div><div class="small muted mt8">好友链接：${esc(o.friendLink||'—')}</div><div class="small muted mt4">交付时段：每天 8:00～18:00（含周末和节假日），按自然日累计 2 小时。17:30 付款承诺次日 9:30 前完成。</div><div class="steps mt8"><div class="step ${o.deliveryStatus!=='PENDING'?'done':''}">待处理</div><div class="step ${o.deliveryStatus==='DONE'||o.deliveryStatus==='DELIVERED'?'done':''}">运营人工赠送</div><div class="step ${o.deliveryStatus==='DONE'||o.deliveryStatus==='DELIVERED'?'done':''}">核实并完成</div></div></div>`);
}
function refundBlock(page,o){
  if(o.refund==='NONE') return '';
  const id=compId(page,'COM-CLIENT-C27');
  const st=o.refund==='FAILED'?'退款失败':o.refund==='SUCCESS'?'已退款':o.refund==='PROCESSING'?'退款中':'待处理';
  return C(id,`<div class="m-card"><div class="m-row-between"><div class="strong">退款</div><span class="tag ${o.refund==='FAILED'?'tag-err':''}">${st}</span></div><div class="small muted mt8">原因：${esc(o.refundReason||'系统异常')}</div>${o.refund==='FAILED'?'<div class="small mt4">退款失败，财务将重试；您可联系客服跟进。</div>':''}<div class="mt8"><button class="btn btn-sm" data-act="go-service">联系客服</button></div></div>`);
}
function h5Result(page, state){
  let o=S.currentOrder||orderById('o1');
  if(state==='GIFT_PENDING') o=orderById('o2');
  if(state==='REFUND_FAILED') o=orderById('o5');
  if(state==='ISSUING') o={...orderById('o1'), deliveryStatus:'ISSUING', cdk:''};
  if(state==='EXCEPTION') o={...orderById('o1'), deliveryStatus:'EXCEPTION', cdk:''};
  if(state==='CONFIRMING') o={...orderById('o3'), pay:'CONFIRMING', deliveryStatus:'NOT_STARTED'};
  const idAct=compId(page,'COM-CLIENT-C37');
  const p=product(o.productId);
  const body=`<div class="page-pad">${orderStatusSummary(page,o)}
    <div class="m-card mt12"><div class="m-row"><div class="thumb">图片</div><div class="flex1"><div class="strong">${esc(p.name)}</div><div class="small muted">订单号 ${esc(o.no)}</div><div class="small muted">实付 ${money(o.amount)}</div></div></div></div>
    <div class="mt12">${deliveryBlock(page,o)}</div>
    ${refundBlock(page,o)}
    <div class="mt12">${noticeBar(page,'INFO','下一步', state==='CONFIRMING'?'支付结果尚未确定，请重新查询，不要重复付款。':state==='ISSUING'?'口令码生成后会显示在本页和订单详情，也可从“我的订单”查看。':state==='GIFT_PENDING'?'已付款，等待运营人工交付；可在订单中查看进度。':'可复制订单号联系企业微信客服。')}</div>
  </div>`;
  const action=`<button class="btn btn-primary" data-act="view-order" data-id="${o.id}">查看订单</button><button class="btn" data-act="go-service">联系客服</button>`;
  return h5Frame(page, h5Header(page,'支付与交付结果',{back:true,service:true})+h5Body(body)+C(idAct,action,'div','m-actionbar'));
}
function ordersForTab(tab){
  const list=ordersFor(S.account||'u1001');
  if(tab==='ALL') return list;
  if(tab==='PENDING') return list.filter(o=>displayStatus(o)==='待支付');
  if(tab==='CONFIRMING') return list.filter(o=>displayStatus(o)==='支付确认中');
  if(tab==='DELIVERED') return list.filter(o=>displayStatus(o)==='已交付');
  if(tab==='GIFT') return list.filter(o=>displayStatus(o).includes('赠送'));
  if(tab==='REFUND') return list.filter(o=>displayStatus(o).includes('退款'));
  return list;
}
function orderCard(page,o){
  const id=compId(page,'COM-CLIENT-C12');
  const p=product(o.productId); const st=displayStatus(o);
  let actions='<button class="btn btn-sm" data-act="view-order" data-id="'+o.id+'">查看</button>';
  if(st==='待支付') actions+='<button class="btn btn-sm btn-primary" data-act="continue-pay" data-id="'+o.id+'">继续支付</button>';
  if(st==='支付确认中') actions+='<button class="btn btn-sm" data-act="query-order" data-id="'+o.id+'">重新查询</button>';
  if(st==='退款失败') actions+='<button class="btn btn-sm" data-act="go-service">联系客服</button>';
  return C(id,`<div class="oc-top"><span class="mono">${esc(o.no)}</span><span>${esc(o.created)}</span></div>
    <div class="m-row"><div class="thumb">图片</div><div class="flex1"><div class="strong">${esc(p.name)}</div><div class="small muted">${o.delivery==='GIFT'?'好友赠送':'口令码'} · 实付 ${money(o.amount)}</div><div class="mt4"><span class="tag ${st.includes('失败')?'tag-err':''}">${st}</span></div></div></div>
    <div class="oc-actions">${actions}</div>`, 'div','order-card');
}
function h5Orders(page, state){
  const idTabs=compId(page,'COM-CLIENT-C11'); const idList=compId(page,'COM-CLIENT-C12');
  if(state==='SESSION_EXPIRED'){
    const id=compId(page,'COM-CLIENT-C13');
    return h5Frame(page, h5Header(page,'我的订单',{back:true})+h5Body(`<div class="page-pad">${C(id,`<div class="m-card" style="text-align:center"><div class="strong">登录已失效，请重新登录</div><div class="small muted mt4">登录后将回到订单列表，不再显示旧账号数据。</div><div class="mt12"><button class="btn btn-primary" data-act="relogin">重新登录</button></div></div>`)}</div>`)+h5Tabbar(page,'profile'));
  }
  const tab=S.ordersTab||'ALL';
  const tabs=[['ALL','全部'],['PENDING','待支付'],['CONFIRMING','支付确认中'],['DELIVERED','已交付'],['GIFT','赠送处理中'],['REFUND','退款']];
  const rows=ordersForTab(tab);
  let body=`<div class="page-pad-tight">${C(idTabs,`<div class="m-tabs">${tabs.map(t=>`<button class="m-tab2" data-act="orders-tab" data-tab="${t[0]}" aria-selected="${tab===t[0]}">${t[1]}</button>`).join('')}</div>`, 'div','')}
    <div class="mt8">`;
  if(state==='LOADING') body+=listState(page,'LOADING');
  else if(state==='ERROR') body+=listState(page,'ERROR');
  else if(!rows.length) body+=listState(page,'EMPTY','暂无订单');
  else body+=rows.map(o=>orderCard(page,o)).join('');
  body+='</div></div>';
  return h5Frame(page, h5Header(page,'我的订单',{back:true,service:true})+h5Body(body)+h5Tabbar(page,'profile'));
}
function h5Order(page, state){
  let o=S.currentOrder||orderById('o1');
  if(state==='PENDING_PAY') o=orderById('o3');
  if(state==='CONFIRMING') o=orderById('o4');
  if(state==='GIFT') o=orderById('o2');
  if(state==='REFUND_FAILED') o=orderById('o5');
  if(state==='ERROR') return h5Frame(page, h5Header(page,'订单详情',{back:true})+h5Body(`<div class="page-pad">${listState(page,'ERROR')}</div>`));
  const p=product(o.productId); const sp=specOf(p,o.specId); const idSum=compId(page,'COM-CLIENT-C10'); const idAct=compId(page,'COM-CLIENT-C37');
  const body=`<div class="page-pad">${orderStatusSummary(page,o)}
    <div class="mt12">${C(idSum,`<div class="m-card"><div class="m-row"><div class="thumb">图片</div><div class="flex1"><div class="strong">${esc(p.name)}</div><div class="small muted">${esc(sp.name)} · 数量 1 · ${money(o.amount)}</div><div class="small muted">下单 ${esc(o.created)}</div></div></div><div class="small muted mt8">成交快照：价格/协议版本不随商品配置变化。</div></div>`)}</div>
    <div class="mt12">${deliveryBlock(page,o)}</div>
    ${refundBlock(page,o)}
    <div class="mt12 m-card"><div class="strong small">订单号</div><div class="mono small mt4">${esc(o.no)}</div><div class="mt8"><button class="btn btn-sm" data-act="copy-order" data-id="${o.id}">${icon('copy')} 复制订单号</button></div></div>
    <div class="mt12">${noticeBar(page,'INFO','售后说明','前台不提供退款/售后申请入口；请联系企业微信客服并复制订单号。')}</div></div>`;
  let action='';
  if(state==='PENDING_PAY') action='<button class="btn btn-primary" data-act="continue-pay" data-id="'+o.id+'">继续支付</button><button class="btn" data-act="go-service">客服</button>';
  else if(state==='CONFIRMING') action='<button class="btn btn-primary" data-act="query-order" data-id="'+o.id+'">重新查询</button><button class="btn" data-act="go-service">客服</button>';
  else action='<button class="btn btn-primary" data-act="copy-order" data-id="'+o.id+'">复制订单号</button><button class="btn" data-act="go-service">联系客服</button>';
  return h5Frame(page, h5Header(page,'订单详情',{back:true,service:true})+h5Body(body)+C(idAct,action,'div','m-actionbar'));
}
function h5Profile(page, state){
  const id=compId(page,'COM-CLIENT-C42');
  let card='';
  if(state==='GUEST'||!S.account){
    card=C(id,`<div class="m-card" style="text-align:center"><div class="strong">尚未登录</div><div class="small muted mt4">登录后可查看订单和口令码；浏览商品无需登录。</div><div class="mt12"><button class="btn btn-primary" data-act="go-auth">使用平台账号登录</button></div></div>`);
  } else {
    const rn=S.realName==='verified'?'已认证':S.realName==='minor'?'已实名未成年':S.realName==='unknown'?'状态未知':'未认证';
    card=C(id,`<div class="m-card"><div class="m-row"><div class="thumb" style="border-radius:50%">头像</div><div class="flex1"><div class="strong">${esc(S.nickname)}</div><div class="small muted">平台 ${S.platform} · ${S.account}</div></div></div><div class="hr"></div><div class="m-row-between small"><span>实名状态</span><span>${rn}</span></div><div class="m-row-between small mt4"><span>手机号</span><span>${S.phoneBound?S.phoneMasked:'未绑定'}</span></div><div class="mt8"><button class="btn btn-sm" data-act="go-auth">查看/更新认证</button> <button class="btn btn-sm" data-act="go-phone">绑定手机号</button></div></div>`);
  }
  const idSvc=compId(page,'COM-CLIENT-C07');
  return h5Frame(page, h5Header(page,'我的')+h5Body(`<div class="page-pad">${card}<div class="mt12 m-card"><button class="btn btn-block" data-act="tab-orders">我的订单</button><div class="mt8">${idSvc?C(idSvc,'<button class="btn btn-block" data-act="go-service">企业微信客服</button>'):'<button class="btn btn-block" data-act="go-service">企业微信客服</button>'}</div></div></div>`)+h5Tabbar(page,'profile'));
}
function h5Service(page, state){
  const id=compId(page,'COM-CLIENT-C29');
  const orderNo=S.currentOrder?S.currentOrder.no:'';
  const body=`<div class="page-pad"><div class="m-card" style="text-align:center"><div style="height:120px;background:#e9e9e9;border:1px solid #ddd;display:flex;align-items:center;justify-content:center;color:#777;font-size:12px">企业微信二维码占位</div><div class="strong mt8">商城企业微信客服</div><div class="small muted">客服号：mall-service（模拟）</div><div class="small muted">服务时间：待运营确认</div></div>
    ${orderNo?`<div class="mt12 m-card"><div class="small muted">当前订单号</div><div class="mono small mt4">${esc(orderNo)}</div><div class="mt8"><button class="btn btn-sm" data-act="copy-order" data-id="${S.currentOrder.id}">复制订单号</button></div></div>`:''}
    <div class="mt12">${noticeBar(page,'INFO','联系前请准备','请提供订单号、问题现象和截图；退款/换码/补发由客服记录后转运营处理，前台不提供申请入口。')}</div>
    ${state==='FALLBACK'?`<div class="mt12">${noticeBar(page,'ERROR','当前环境无法直接唤起','请复制客服号 mall-service，在微信中手动添加。')}</div>`:''}
    </div>`;
  const inner=C(id,body,'div','');
  return h5Frame(page, h5Header(page,'企业微信客服',{back:true})+h5Body(inner));
}
function h5Agreement(page, state){
  const id=compId(page,'COM-CLIENT-C43');
  const body=`<div class="page-pad">${state==='STALE'?noticeBar(page,'ERROR','协议已更新','本次为实质性变更，继续支付前需重新阅读并同意。'):''}
    ${C(id,`<div class="m-card"><div class="small muted">购买协议</div><h3 style="font-size:18px;margin:4px 0">Steam商城购买协议</h3><div class="small muted">版本 v1.6 · 生效时间 2026-10-22</div><div class="hr"></div><div class="small" style="line-height:1.8">1. 本商城由商城经营公司统一销售、收款与售后。<br>2. 商品为 Steam 口令码或好友赠送人工交付，付款成功不等于交付完成。<br>3. 虚拟商品一经履约原则上不退款；系统异常按规则原路退款。<br>4. 好友赠送每天 8:00～18:00 交付，按自然日累计 2 小时。<br>5. 用户须完成实名、成年、协议与手机号校验后购买。<br><span class="muted">（正式文本由业务/法务提供，本页为原型模拟内容。）</span></div></div>`)}
    <div class="mt12"><button class="btn btn-block" data-act="back">返回购买</button></div></div>`;
  return h5Frame(page, h5Header(page,'购买协议',{back:true})+h5Body(body));
}
function h5Auth(page, state){
  let inner='', title='';
  if(state==='LOGIN'){
    title='需要登录';
    inner=`<div class="small">登录后将保留当前商品、规格、好友链接和协议选择；浏览商品无需登录。</div><div class="noticebar mt8"><div>使用平台账号登录，商城按“来源平台+平台用户 ID”识别身份，不跨账号合并订单。</div></div>`;
  } else if(state==='UNVERIFIED'){
    title='请完成实名认证';
    inner=`<div class="small">购买前需完成实名认证，您也可以先浏览商品。认证由所属平台提供，商城不自建实名体系。</div><div class="noticebar mt8"><div>认证成功返回后将重新获取可信结果，并保留原购买现场。</div></div>`;
  } else if(state==='VERIFIED'){
    title='实名认证已完成';
    inner=`<div class="small">已取得可信实名及成年结果。继续后将依次校验购买协议、手机号、商品可售与订单并存规则。</div>`;
  } else if(state==='MINOR'){
    title='暂不可购买';
    inner=`<div class="small">当前账号已实名但未成年，可继续浏览商品，暂不可购买。</div>`;
  } else if(state==='UNKNOWN'){
    title='暂无法核验身份';
    inner=`<div class="small">平台身份或实名结果暂不可获取。为避免误判，未放行交易；可重试或继续浏览。</div>`;
  } else {
    title='正在前往认证';
    inner=`<div class="small">请在弹出的平台实名页面完成认证；取消或失败均可返回商城继续浏览。</div><div class="mt12 skeleton sk-line"></div>`;
  }
  let actions='';
  if(state==='LOGIN') actions='<button class="btn" data-act="auth-close">取消</button><button class="btn btn-primary" data-act="auth-login">使用平台账号登录</button>';
  else if(state==='UNVERIFIED') actions='<button class="btn" data-act="auth-close">暂不认证</button><button class="btn btn-primary" data-act="auth-verify">前往认证</button>';
  else if(state==='VERIFIED') actions='<button class="btn btn-primary" data-act="auth-close">继续购买</button>';
  else if(state==='MINOR') actions='<button class="btn btn-primary" data-act="auth-close">返回浏览</button>';
  else if(state==='UNKNOWN') actions='<button class="btn" data-act="auth-close">返回浏览</button><button class="btn btn-primary" data-act="auth-retry">重试</button>';
  else actions='<button class="btn" data-act="auth-close">取消</button>';
  const overlay=`<div class="layer-host"><div class="layer-mask"></div><div class="layer" style="max-width:280px"><div class="layer-head"><div class="layer-title">${title}</div><button class="layer-close" data-act="auth-close" aria-label="关闭">✕</button></div><div class="layer-body">${C(compId(page,'COM-CLIENT-C30'),inner)}</div><div class="layer-foot">${actions}</div></div></div>`;
  return h5Frame(page,'',{backdrop:h5BuyBackdrop(product((S.buy&&S.buy.productId)||'p01')),overlay});
}
function h5Phone(page, state){
  const id=compId(page,'COM-CLIENT-C31');
  let inner=`<div class="field"><label for="phoneInput">手机号</label><input class="input ${S.bindError==='phone'?'err':''}" id="phoneInput" type="text" inputmode="numeric" value="${esc(S.bindPhone)}" placeholder="请输入 11 位手机号"><div class="hint">仅用于交易验证与购买条件核验，不用于营销。</div></div>
    <div class="field"><label for="codeInput">短信验证码</label><div class="searchbar"><input class="input ${S.bindError==='code'?'err':''}" id="codeInput" type="text" inputmode="numeric" value="${esc(S.bindCode)}" placeholder="6 位验证码"><button class="btn" data-act="send-code" id="sendCodeBtn" ${S.bindCooldown>0?'disabled':''}>${S.bindCooldown>0?S.bindCooldown+'s 后重发':'获取验证码'}</button></div><div class="hint">演示验证码：123456</div>${S.bindError==='code'?'<div class="errmsg">验证码错误或已过期</div>':''}</div>
    <div class="noticebar"><div class="nb-title">隐私告知</div><div>获取验证码并提交即表示同意商城按交易验证目的处理手机号。可查看《隐私政策》；拒绝绑定可继续浏览，但不能购买。</div></div>`;
  if(state==='FREQUENCY_LIMIT') inner=noticeBar(page,'ERROR','操作过于频繁','请稍后再试。频繁获取不会发送新的验证码。')+inner;
  if(state==='SUCCESS') inner=noticeBar(page,'INFO','绑定成功','已写入商城兜底绑定记录，将返回购买现场继续校验。')+inner;
  const overlay=`<div class="layer-host"><div class="layer-mask"></div><div class="layer bottom"><div class="layer-head"><div class="layer-title">绑定手机号</div><button class="layer-close" data-act="phone-close" aria-label="关闭">✕</button></div><div class="layer-body">${C(id,inner,'div','')}</div><div class="layer-foot"><button class="btn" data-act="phone-close">取消</button><button class="btn btn-primary" data-act="bind-submit" ${state==='SUBMITTING'?'disabled':''}>${state==='SUBMITTING'?'提交中…':'提交绑定'}</button></div></div></div>`;
  return h5Frame(page,'',{backdrop:h5PhoneBackdrop(page,product((S.buy&&S.buy.productId)||'p01')),overlay});
}
function h5Notice(page, state){
  if(state==='HIDDEN'){
    return h5Home(pageOf('H5-HOME-01'),'DEFAULT');
  }
  const id=compId(page,'COM-CLIENT-C32');
  const verified=state==='SHOWN_VERIFIED'; const minor=state==='SHOWN_MINOR';
  const title=verified?'实名认证提醒':minor?'实名认证提醒':'实名认证提醒';
  const text=verified?'您已完成实名认证。':minor?'您已实名认证，但当前为未成年，可浏览、暂不可购买。':'购买前需完成实名认证，您也可以先浏览商品。';
  const actions=verified?'<button class="btn btn-primary" data-act="notice-know">知道了</button>'
    :minor?'<button class="btn btn-primary" data-act="notice-know">知道了</button>'
    :'<button class="btn" data-act="notice-close-x">关闭</button><button class="btn btn-primary" data-act="notice-verify">前往认证</button>';
  const overlay=`<div class="layer-host"><div class="layer-mask" data-act="notice-close-x"></div><div class="layer" style="max-width:272px"><div class="layer-head"><div class="layer-title">${title}</div><button class="layer-close" data-act="notice-close-x" aria-label="关闭">✕</button></div><div class="layer-body">${C(id,`<div class="small">${text}</div><div class="small muted mt8">提醒不会改变实名、成年、协议或手机号状态；购买时仍会完整校验。</div>`)}</div><div class="layer-foot">${actions}</div></div></div>`;
  return h5Frame(page,'',{backdrop:h5Home(pageOf('H5-HOME-01'),'DEFAULT'),overlay});
}

/* ---------- WEB pages ---------- */
function webMain(page, inner, cls){ return `<main class="web-main ${cls||''}">${inner}</main>`; }
function webCard(p,page){
  const id=compId(page,'COM-CLIENT-C03');
  return C(id,`<div class="media">图片占位</div><div class="body"><div class="card-name" style="min-height:0">${esc(p.name)}</div><div class="small muted">${esc(p.nameEn)}</div><div class="card-price">${money(p.price)}</div><div class="card-tags"><span class="tag">${p.delivery==='GIFT'?'好友赠送':'口令码'}</span>${p.sale==='SOLD_OUT'?'<span class="tag tag-err">售罄</span>':''}</div></div>`,
    'button','web-card',`data-act="open-product" data-id="${p.id}" style="text-align:left;padding:0"`);
}
function webHome(page,state){
  if(state==='LOADING') return webFrame(page, webHeader(page,'home')+webMain(page,`<div class="web-grid">${'<div class="web-card"><div class="media skeleton"></div><div class="body"><div class="skeleton sk-line"></div><div class="skeleton sk-line"></div></div></div>'.repeat(4)}</div>`));
  if(state==='EMPTY'||state==='ERROR') return webFrame(page, webHeader(page,'home')+webMain(page,listState(page,state==='EMPTY'?'EMPTY':'ERROR','暂无商品')));
  const idB=compId(page,'COM-CLIENT-C15'); const idQ=compId(page,'COM-CLIENT-C16'); const idG=compId(page,'COM-CLIENT-C35');
  const list=sortedProducts(visibleProducts(),S.homeSort||'RECOMMEND');
  const banners=[{n:'影之刃零',id:'p01'},{n:'黑神话：悟空',id:'p04'}]; const b=banners[S.homeBanner%banners.length];
  const banner=C(idB,`<button data-act="open-product" data-id="${b.id}" style="border:0;background:transparent;width:100%;height:100%;font-size:14px;color:#555">广告位 · ${esc(b.n)}　（${S.homeBanner+1}/${banners.length}）</button>`,'div','web-hero');
  const quick=C(idQ,`<div class="web-row" style="gap:8px"><button class="btn" data-act="go-search">搜索商品</button><button class="btn" data-act="tab-orders">我的订单</button><button class="btn" data-act="go-service">企业微信客服</button></div>`);
  return webFrame(page, webHeader(page,'home')+webMain(page,`${banner}${quick}<div class="mt12" style="display:flex;justify-content:space-between;align-items:center"><h2 class="web-title">已发布商品</h2><div style="max-width:420px;flex:1">${sortBar(page,S.homeSort||'RECOMMEND','home-sort')}</div></div><div class="mt12">${C(idG,`<div class="web-grid">${list.map(p=>webCard(p,page)).join('')}</div>`)}</div>`));
}
function webSearch(page,state){
  const idIn=compId(page,'COM-CLIENT-C01'); const idBt=compId(page,'COM-CLIENT-C02'); const idD=compId(page,'COM-CLIENT-C39'); const idG=compId(page,'COM-CLIENT-C35');
  const bar=`<div class="web-searchbar">${C(idIn,`<input class="input" id="searchInput" type="text" value="${esc(state==='DEFAULT'?S.search.draft:S.search.committed)}" placeholder="输入商品名称搜索" aria-label="输入商品名称搜索">`)}${C(idBt,`<button class="btn btn-primary" data-act="search-submit">搜索</button>`)}</div>`;
  if(state==='DEFAULT'||state==='EMPTY'){
    return webFrame(page, webHeader(page)+webMain(page,`${bar}${C(idD,`<div class="web-panel"><h3 class="mb8" style="font-size:16px">搜索发现</h3><div class="kw-list">${['赛博朋克','影之刃','黑神话','双人成行'].map(k=>`<button class="kw" data-act="search-keyword" data-kw="${k}">${k}</button>`).join('')}</div><hr class="web-hr"><h3 class="mb8" style="font-size:16px">热门商品</h3><div class="web-grid">${['p01','p04','p05','p03'].map(id=>webCard(product(id),page)).join('')}</div></div>`)}`));
  }
  if(state==='ERROR') return webFrame(page, webHeader(page)+webMain(page,`${bar}${listState(page,'ERROR')}`));
  const list=sortedProducts(filterByKeyword(S.search.committed),S.search.sort||'RECOMMEND');
  return webFrame(page, webHeader(page)+webMain(page,`${bar}<div class="m-row-between"><h2 class="web-title" style="font-size:18px">“${esc(S.search.committed)}” 的搜索结果 <span class="small muted">${list.length} 个</span></h2><div style="max-width:420px;flex:1">${sortBar(page,S.search.sort||'RECOMMEND','result-sort')}</div></div><div class="mt12">${list.length?C(idG,`<div class="web-grid">${list.map(p=>webCard(p,page)).join('')}</div>`):listState(page,'EMPTY','没有找到相关商品')}</div>${state==='END'?listState(page,'END'):''}`));
}
function webProductBackdrop(p){
  const pg=pageOf('WEB-PRODUCT-01');
  return webHeader(pg)+webMain(pg,`<div class="web-2col"><div><div class="web-hero">商品主图占位</div><h2 class="web-title">${esc(p.name)}</h2><div class="small muted">${esc(p.nameEn)}</div><div class="mt12 small">${p.restrict.join(' · ')}</div></div><div class="web-side"><div class="web-buycard"><div class="price-row"><span class="price price-lg">${money(p.price)}</span></div><button class="btn btn-primary btn-block" disabled>立即购买</button></div></div></div>`);
}
function webProduct(page,state){
  const p=product(S.currentProduct||'p01');
  if(state==='ERROR') return webFrame(page, webHeader(page)+webMain(page,listState(page,'ERROR')));
  const idG=compId(page,'COM-CLIENT-C18'); const idI=compId(page,'COM-CLIENT-C40'); const idE=compId(page,'COM-CLIENT-C19'); const idA=compId(page,'COM-CLIENT-C17');
  let action='';
  if(state==='PENDING') action=`<div class="small muted mb8">当前账号有一笔有效未支付/确认中订单</div><button class="btn btn-primary btn-block" data-act="recover-order" data-id="o3">订单处理中</button>`;
  else if(state==='PAID_DELIVERING') action=`<div class="small muted mb8">您有一笔订单正在交付，点击查看</div><button class="btn btn-primary btn-block" data-act="buy-open" data-id="${p.id}">立即购买</button>`;
  else if(state==='UNAVAILABLE') action=`<button class="btn btn-primary btn-block" disabled>${p.sale==='SOLD_OUT'?'售罄':'不可售'}</button><button class="btn btn-block mt8" data-act="tab-orders">查看订单</button>`;
  else action=`<button class="btn btn-primary btn-block" data-act="buy-open" data-id="${p.id}">立即购买</button>`;
  const gallery=C(idG,`<div class="web-hero">商品主图占位 1/3</div><div class="gallery-thumbs">${[0,1,2].map(i=>`<button data-act="media" data-i="${i}" aria-pressed="${(S.mediaIndex||0)===i}">图${i+1}</button>`).join('')}</div>`);
  const info=C(idI,`<div class="m-row-between"><div><h2 class="web-title">${esc(p.name)}</h2><div class="small muted">${esc(p.nameEn)}</div></div><div class="txt-r"><div class="price price-lg">${money(p.price)}</div><div class="small muted">数量固定 1</div></div></div><div class="mt8">${productTagLine(p)}</div><div class="mt8 small">${p.restrict.join(' · ')}</div><div class="mt8 small muted">${esc(stockNote(p))}</div>`);
  const expand=C(idE,`<div class="info-block"><h4>游戏介绍</h4><div class="small ${S.productExpanded?'':'muted'}">${S.productExpanded?esc(p.desc)+' 本段为运营维护的模拟内容。':'展开查看完整介绍、配置要求与购买须知。'}</div><button class="linkbtn mt4" data-act="expand">${S.productExpanded?'收起':'展开全部'}</button></div><div class="info-block"><h4>购买须知</h4><div class="small muted">虚拟商品一经履约原则上不退款；系统异常按规则原路退款。付款后好友链接不可修改。</div></div>`);
  const notice=(state==='UNAVAILABLE'||p.stock==='UNKNOWN'||walletBlocked(p))?noticeBar(page,state==='UNAVAILABLE'||walletBlocked(p)?'ERROR':'INFO',state==='UNAVAILABLE'?'不可售说明':'风险提示',walletBlocked(p)?'供应商余额不足或查询失败，暂不可购买口令码商品。':state==='UNAVAILABLE'?'商品未发布、已下架或价格不合规，暂不可购买。':'库存信息可能延迟，以付款后供应商结果为准；失败自动退款/补货。'):'';
  return webFrame(page, webHeader(page)+webMain(page,`<div class="web-crumbs">首页 / 商品详情</div><div class="web-2col"><div>${gallery}<div class="mt12">${info}</div>${notice}${expand}</div><div class="web-side">${C(idA,`<div class="web-buycard"><div class="small muted">交付方式</div><div class="strong">${p.delivery==='GIFT'?'好友赠送（每天 8:00～18:00）':'口令码自动交付'}</div><div class="small muted mt8">${p.restrict[0]||''}</div><div class="price-row"><span class="price price-lg">${money(p.price)}</span><span class="small muted">数量 1</span></div>${action}<div class="mt8 small muted">购买前需完成登录、实名、协议与手机号校验。</div></div>`)}</div></div>`));
}
function webBuy(page,state){
  const b=S.buy||{productId:'p01',specId:'p01-s1',delivery:'CODE',friendLink:'',payMethod:'WECHAT',agreementChecked:S.agreementChecked,error:''};
  const p=product(b.productId); const sp=specOf(p,b.specId);
  const idSum=compId(page,'COM-CLIENT-C10'); const idSpec=compId(page,'COM-CLIENT-C20'); const idLink=compId(page,'COM-CLIENT-C23'); const idPay=compId(page,'COM-CLIENT-C22'); const idAgr=compId(page,'COM-CLIENT-C21'); const idAmt=compId(page,'COM-CLIENT-C33');
  let inner=`<div class="small muted">${esc(p.name)} · ${esc(sp.name)}</div>`;
  inner+=C(idSum,`<div class="list-row mt8"><div class="thumb">图片</div><div class="grow"><div class="strong">${esc(p.name)}</div><div class="small muted">${esc(sp.name)} · 数量 1 · ${p.delivery==='GIFT'?'好友赠送':'口令码'}</div></div></div>`);
  inner+=`<div class="info-block"><h4>选择规格</h4>${C(idSpec,`<div class="seg">${p.specs.map(s=>`<button class="segbtn" data-act="spec-select" data-id="${s.id}" aria-pressed="${s.id===b.specId}">${esc(s.name)} · ${money(s.price)}</button>`).join('')}</div>`)}</div>`;
  if(p.delivery==='GIFT') inner+=`<div class="info-block"><h4>Steam 好友链接</h4>${C(idLink,`<input class="input ${b.error==='link'?'err':''}" id="friendInput" type="text" value="${esc(b.friendLink)}" placeholder="请输入 Steam 好友链接"><div class="hint">付款前可修改，付款后不可修改。</div>${b.error==='link'?'<div class="errmsg">请输入有效的 Steam 好友链接</div>':''}`)}</div>`;
  inner+=`<div class="info-block"><h4>支付方式</h4>${C(idPay,`<div class="radio-list">${[['WECHAT','微信支付'],['ALIPAY','支付宝']].map(m=>`<div class="checkrow"><input type="radio" name="payw" id="wpay_${m[0]}" data-act="pay-method" data-m="${m[0]}" ${b.payMethod===m[0]?'checked':''}><label for="wpay_${m[0]}">${m[1]}</label></div>`).join('')}</div>`)}</div>`;
  inner+=`<div class="info-block">${C(idAgr,`<div class="checkrow"><input type="checkbox" id="agrChkW" data-act="agreement-check" ${b.agreementChecked?'checked':''}><label for="agrChkW">我已阅读并同意 <button class="linkbtn" data-act="go-agreement">《购买协议》</button></label></div>`)}</div>`;
  inner+=C(idAmt,`<div class="m-row-between mt8"><span>合计</span><span class="price">${money(sp.price)}</span></div>`);
  if(state==='BUSINESS_REJECT'||b.error==='reject') inner+=noticeBar(page,'ERROR','暂不可购买',b.rejectText||'供应商余额不足或商品不可售。');
  else if(state==='VALIDATION_ERROR'||b.error) inner+=noticeBar(page,'INFO','请完善购买条件',b.error==='link'?'请填写有效的 Steam 好友链接。':'请完成登录、实名、协议或手机号校验。');
  const overlay=`<div class="web-layer"><div class="layer-mask" data-act="buy-close"></div><div class="layer"><div class="layer-head"><div class="layer-title">核对购买内容</div><button class="layer-close" data-act="buy-close" aria-label="关闭">✕</button></div><div class="layer-body">${inner}</div><div class="layer-foot"><button class="btn btn-primary btn-block" data-act="buy-submit" ${state==='SUBMITTING'?'disabled':''}>${state==='SUBMITTING'?'处理中…':'购买并支付 '+money(sp.price)}</button></div></div></div>`;
  const noticeLayer=b.showNotice?`<div class="web-layer confirm" style="z-index:210"><div class="layer-mask"></div><div class="layer"><div class="layer-head"><div class="layer-title">购买须知</div><button class="layer-close" data-act="notice-close">✕</button></div><div class="layer-body small">购买前请阅读《购买协议》。虚拟商品一经履约原则上不退款；好友赠送每天 8:00～18:00 人工交付。</div><div class="layer-foot"><button class="btn" data-act="notice-close">取消</button><button class="btn btn-primary" data-act="notice-agree">同意并继续</button></div></div></div>`:'';
  return webFrame(page,'',{backdrop:webProductBackdrop(p),overlay:overlay+noticeLayer});
}
function webCheckoutBackdrop(o){
  const p=product(o.productId); const pg=pageOf('WEB-CHECKOUT-01');
  return webHeader(pg)+webMain(pg,`<div class="web-2col"><div class="web-panel"><h2 class="web-title">确认订单</h2><div class="small muted mt8">订单号 ${o.no}</div><div class="mt12">${p.name} · ${money(o.amount)}</div></div><div class="web-side"><div class="web-buycard"><div class="price-row"><span class="price price-lg">${money(o.amount)}</span></div><button class="btn btn-primary btn-block" disabled>继续支付</button></div></div></div>`);
}
function webCheckout(page,state){
  const o=S.currentOrder||orderById('o3'); const p=product(o.productId); const sp=specOf(p,o.specId);
  const idSum=compId(page,'COM-CLIENT-C10'); const idAmt=compId(page,'COM-CLIENT-C33'); const idAgr=compId(page,'COM-CLIENT-C21'); const idAct=compId(page,'COM-CLIENT-C17');
  const body=`<div class="web-crumbs">我的订单 / 确认订单</div><div class="web-2col"><div class="web-panel"><div class="m-row-between"><h2 class="web-title">确认订单</h2><span class="tag">${state==='EXPIRED'?'已关闭':'待支付'}</span></div><div class="small muted mt4">订单号 ${esc(o.no)}</div><div class="mt12">${C(idSum,`<div class="list-row"><div class="thumb">图片</div><div class="grow"><div class="strong">${esc(p.name)}</div><div class="small muted">${esc(sp.name)} · 数量 1 · ${p.delivery==='GIFT'?'好友赠送':'口令码'}</div></div><div class="strong">${money(o.amount)}</div></div>`)}</div>${state==='EXPIRED'?noticeBar(page,'ERROR','订单已关闭','明确未支付且超过有效期，或商品不可售。商品恢复后可重新购买。'):noticeBar(page,'INFO','保价不保售','有效期内按快照保价；继续支付前重新校验可售性。')}<div class="mt12">${C(idAgr,`<div class="checkrow"><input type="checkbox" id="agrChkC" data-act="agreement-check" checked><label for="agrChkC">已同意《购买协议》 v1.6</label></div>`)}</div></div><div class="web-side">${C(idAct,`<div class="web-buycard"><div class="small muted">应付金额</div><div class="price-row"><span class="price price-lg">${money(o.amount)}</span></div>${C(idAmt,`<div class="small muted mb8">数量 1 · 含税</div>`)}${state==='EXPIRED'?`<button class="btn btn-primary btn-block" data-act="open-product" data-id="${p.id}">重新购买</button>`:`<button class="btn btn-primary btn-block" data-act="checkout-pay">继续支付 ${money(o.amount)}</button>`}<div class="small muted mt8">剩余有效期约 18 分钟（仅有可信到期时间时展示）。</div></div>`)}</div></div>`;
  return webFrame(page, webHeader(page)+webMain(page,body));
}
function webPay(page,state){
  const o=S.currentOrder||orderById('o3');
  const idCash=compId(page,'COM-CLIENT-C38'); const idAmt=compId(page,'COM-CLIENT-C33'); const idNotice=compId(page,'COM-CLIENT-C36');
  const qr=`<div class="web-qr">扫码支付占位</div>`;
  const title=state==='CONFIRMING'?'确认中':state==='SUCCESS'?'支付成功':'扫码支付';
  const text=state==='CONFIRMING'?'已扫码，等待渠道回调。请勿重复支付。':state==='SUCCESS'?'服务端已确认支付，可查看结果。':'请使用'+((S.buy&&S.buy.payMethod)==='ALIPAY'?'支付宝':'微信')+'扫码完成支付。';
  const notice=state==='CONFIRMING'||state==='UNKNOWN'?(idNotice?C(idNotice,`<div class="small mt8">${text}</div>`):`<div class="small mt8">${text}</div>`):`<div class="small mt8">${text}</div>`;
  const cashier=C(idCash,`${idAmt?C(idAmt,`<div class="strong">${money(o.amount)}</div><div class="small muted">订单号 ${esc(o.no)}</div>`):`<div class="strong">${money(o.amount)}</div><div class="small muted">订单号 ${esc(o.no)}</div>`}${state==='SUCCESS'?'<div class="mt12 strong">支付成功</div>':qr}${notice}`);
  const overlay=`<div class="web-layer"><div class="layer-mask"></div><div class="layer" style="max-width:420px"><div class="layer-head"><div class="layer-title">${title}</div><button class="layer-close" data-act="pay-close" aria-label="关闭">✕</button></div><div class="layer-body" style="text-align:center">${cashier}</div><div class="layer-foot" style="justify-content:center">${state==='SUCCESS'?'<button class="btn btn-primary" data-act="go-result">查看结果</button>':'<button class="btn" data-act="pay-close">关闭</button><button class="btn btn-primary" data-act="pay-paid">我已支付</button><button class="btn" data-act="pay-problem">遇到问题</button>'}</div></div></div>`;
  return webFrame(page,'',{backdrop:webCheckoutBackdrop(o),overlay});
}
function webPayret(page,state){
  const o=S.currentOrder||orderById('o3');
  const idQ=compId(page,'COM-CLIENT-C24'); const idN=compId(page,'COM-CLIENT-C36'); const idS=compId(page,'COM-CLIENT-C09');
  const body=state==='QUERYING'?C(idQ,C(idS,'<div class="strong">正在查询支付结果…</div>')):state==='TIMEOUT'?C(idQ,C(idS,C(idN,'<div class="noticebar error"><div class="nb-title">暂未取得支付结果</div><div>订单保持支付确认中，请重新查询或联系客服，不要重复付款。</div></div>'))):C(idQ,'<div class="small">支付结果尚未返回。无论选择哪一项都会查询服务端；选择不改变订单状态。</div><div class="small muted mt8">订单号 '+esc(o.no)+'</div>');
  const actions=state==='QUERYING'?'<button class="btn btn-primary" disabled>查询中…</button>':state==='TIMEOUT'?'<button class="btn btn-primary" data-act="pay-requery">重新查询</button><button class="btn" data-act="go-orders">查看订单</button>':'<button class="btn btn-primary" data-act="pay-answer" data-a="unpaid">未支付</button><button class="btn btn-primary" data-act="pay-answer" data-a="paid">已支付</button>';
  const overlay=`<div class="web-layer confirm"><div class="layer-mask"></div><div class="layer"><div class="layer-head"><div class="layer-title">您是否已经完成了支付？</div></div><div class="layer-body">${body}</div><div class="layer-foot" style="justify-content:center">${actions}</div></div></div>`;
  return webFrame(page,'',{backdrop:webCheckoutBackdrop(o),overlay});
}
function webResult(page,state){
  let o=S.currentOrder||orderById('o1');
  if(state==='GIFT_PENDING') o=orderById('o2');
  if(state==='REFUND_FAILED') o=orderById('o5');
  if(state==='ISSUING') o={...orderById('o1'),deliveryStatus:'ISSUING',cdk:''};
  if(state==='EXCEPTION') o={...orderById('o1'),deliveryStatus:'EXCEPTION',cdk:''};
  const p=product(o.productId);
  const idAct=compId(page,'COM-CLIENT-C37'); const idSvc=compId(page,'COM-CLIENT-C07');
  const acts=`<button class="btn btn-primary" data-act="view-order" data-id="${o.id}">查看订单</button>${idSvc?C(idSvc,'<button class="btn" data-act="go-service">联系客服</button>'):'<button class="btn" data-act="go-service">联系客服</button>'}`;
  const body=`<div class="web-crumbs">我的订单 / 支付与交付结果</div><div class="web-panel" style="max-width:820px;margin:0 auto">${orderStatusSummary(page,o)}<div class="mt12">${deliveryBlock(page,o)}${refundBlock(page,o)}</div><div class="mt12 small muted">订单号 ${esc(o.no)} · 实付 ${money(o.amount)}</div>${C(idAct, acts, 'div','', 'style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"')}</div>`;
  return webFrame(page, webHeader(page)+webMain(page,body));
}
function webOrders(page,state){
  const idTabs=compId(page,'COM-CLIENT-C11');
  if(state==='SESSION_EXPIRED'){const id=compId(page,'COM-CLIENT-C13');return webFrame(page,webHeader(page)+webMain(page,C(id,`<div class="web-panel" style="max-width:520px;margin:40px auto;text-align:center"><div class="strong">登录已失效，请重新登录</div><div class="small muted mt4">登录后回到订单列表，不显示旧账号数据。</div><div class="mt12"><button class="btn btn-primary" data-act="relogin">重新登录</button></div></div>`)));}
  const tab=S.ordersTab||'ALL'; const tabs=[['ALL','全部'],['PENDING','待支付'],['CONFIRMING','支付确认中'],['DELIVERED','已交付'],['GIFT','赠送处理中'],['REFUND','退款']];
  const rows=ordersForTab(tab);
  const body=`<div class="m-row-between"><h2 class="web-title">我的订单</h2></div>${C(idTabs,`<div class="tabs">${tabs.map(t=>`<button class="tab" data-act="orders-tab" data-tab="${t[0]}" aria-selected="${tab===t[0]}">${t[1]}</button>`).join('')}</div>`)}<div class="mt12">${state==='LOADING'?listState(page,'LOADING'):state==='ERROR'?listState(page,'ERROR'):rows.length?rows.map(o=>orderCard(page,o)).join(''):listState(page,'EMPTY','暂无订单')}</div>`;
  return webFrame(page, webHeader(page)+webMain(page,body));
}
function webOrder(page,state){
  let o=S.currentOrder||orderById('o1');
  if(state==='PENDING_PAY') o=orderById('o3');
  if(state==='CONFIRMING') o=orderById('o4');
  if(state==='GIFT') o=orderById('o2');
  if(state==='REFUND_FAILED') o=orderById('o5');
  if(state==='ERROR') return webFrame(page,webHeader(page)+webMain(page,listState(page,'ERROR')));
  const p=product(o.productId); const sp=specOf(p,o.specId);
  const idSum=compId(page,'COM-CLIENT-C10'); const idAct=compId(page,'COM-CLIENT-C37'); const idSvc=compId(page,'COM-CLIENT-C07');
  const item=C(idSum,`<h2 class="web-title" style="font-size:18px">${esc(p.name)}</h2><div class="small muted">${esc(sp.name)} · 数量 1 · 实付 ${money(o.amount)}</div><div class="small muted mt4">订单号 ${esc(o.no)} · 下单 ${esc(o.created)}</div>`);
  const acts=`${state==='PENDING_PAY'?'<button class="btn btn-primary" data-act="continue-pay" data-id="'+o.id+'">继续支付</button>':state==='CONFIRMING'?'<button class="btn btn-primary" data-act="query-order" data-id="'+o.id+'">重新查询</button>':''}<button class="btn" data-act="copy-order" data-id="${o.id}">复制订单号</button>${idSvc?C(idSvc,'<button class="btn" data-act="go-service">联系客服</button>'):'<button class="btn" data-act="go-service">联系客服</button>'}`;
  const body=`<div class="web-crumbs">我的订单 / 订单详情</div><div class="web-2col"><div>${orderStatusSummary(page,o)}<div class="web-panel mt12">${item}</div><div class="mt12">${deliveryBlock(page,o)}${refundBlock(page,o)}</div></div><div class="web-side"><div class="web-buycard"><div class="small muted">订单操作</div>${C(idAct,acts,'div','', 'style="margin-top:8px;display:flex;flex-direction:column;gap:8px"')}<div class="small muted mt8">前台不提供退款/售后申请入口。</div></div></div></div>`;
  return webFrame(page, webHeader(page)+webMain(page,body));
}
function webProfile(page,state){
  const id=compId(page,'COM-CLIENT-C42'); const idSvc=compId(page,'COM-CLIENT-C07');
  const svc=idSvc?C(idSvc,'<button class="btn" data-act="go-service">客服</button>'):'<button class="btn" data-act="go-service">客服</button>';
  const card=(state==='GUEST'||!S.account)
    ? C(id,`<div class="web-panel" style="max-width:520px"><div class="strong">尚未登录</div><div class="small muted mt4">登录后可查看订单；浏览无需登录。</div><div class="mt12"><button class="btn btn-primary" data-act="go-auth">登录</button></div></div>`)
    : C(id,`<div class="web-panel" style="max-width:620px"><div class="m-row"><div class="thumb" style="border-radius:50%">头像</div><div class="flex1"><div class="strong">${esc(S.nickname)}</div><div class="small muted">平台 ${S.platform} · ${S.account}</div></div></div><div class="web-hr"></div><div class="small">实名状态：${S.realName==='verified'?'已认证':S.realName==='minor'?'已实名未成年':S.realName==='unknown'?'未知':'未认证'} · 手机号：${S.phoneBound?S.phoneMasked:'未绑定'}</div><div class="mt12" style="display:flex;gap:8px"><button class="btn" data-act="tab-orders">我的订单</button>${svc}</div></div>`);
  return webFrame(page, webHeader(page)+webMain(page,`<div class="m-row-between"><h2 class="web-title">我的</h2></div><div class="mt12">${card}</div>`));
}
function webService(page,state){
  const id=compId(page,'COM-CLIENT-C29');
  const body=C(id,`<div class="web-panel" style="max-width:720px"><h2 class="web-title" style="font-size:18px">企业微信客服</h2><div class="mt8" style="display:flex;gap:16px;flex-wrap:wrap"><div style="width:160px;height:160px;background:#e9e9e9;border:1px solid #ddd;display:flex;align-items:center;justify-content:center;font-size:12px;color:#777">二维码占位</div><div class="flex1"><div class="small">客服号：mall-service（模拟）</div><div class="small muted mt4">服务时间：待运营确认</div><div class="mt8"><button class="btn btn-sm" data-act="copy-service">复制客服号</button></div>${S.currentOrder?`<div class="small mt8">当前订单：<span class="mono">${esc(S.currentOrder.no)}</span></div>`:''}</div></div><div class="mt12">${noticeBar(page,'INFO','联系前请准备','请提供订单号、问题现象和截图；退款/换码/补发由客服记录后转运营处理。')}</div></div>`);
  return webFrame(page, webHeader(page)+webMain(page,body));
}
function webAgreement(page,state){
  const id=compId(page,'COM-CLIENT-C43');
  const body=`<div class="web-panel" style="max-width:820px;margin:0 auto">${state==='STALE'?noticeBar(page,'ERROR','协议已更新','实质性变更，继续支付前需重新阅读并同意。'):''}${C(id,`<h2 class="web-title" style="font-size:20px">Steam商城购买协议</h2><div class="small muted">版本 v1.6 · 生效 2026-10-22</div><div class="web-hr"></div><div class="small" style="line-height:1.9">1. 本商城由商城经营公司统一销售、收款与售后。<br>2. 商品为 Steam 口令码或好友赠送人工交付，付款成功不等于交付完成。<br>3. 虚拟商品一经履约原则上不退款；系统异常按规则原路退款。<br>4. 好友赠送每天 8:00～18:00 交付，按自然日累计 2 小时。<br>5. 用户须完成实名、成年、协议与手机号校验后购买。<br><span class="muted">（正式文本由业务/法务提供，本页为原型模拟内容。）</span></div>`)}<div class="mt12"><button class="btn" data-act="back">返回购买</button></div></div>`;
  return webFrame(page, webHeader(page)+webMain(page,body));
}
function webAuth(page,state){
  const inner=state==='LOGIN'?'<div class="small">登录后保留当前商品与选择；浏览无需登录。</div>':state==='UNVERIFIED'?'<div class="small">购买前需完成实名认证，您也可以先浏览商品。</div>':state==='VERIFIED'?'<div class="small">已取得可信实名及成年结果，继续后将校验协议与手机号。</div>':state==='MINOR'?'<div class="small">已实名但未成年，可浏览、暂不可购买。</div>':state==='UNKNOWN'?'<div class="small">身份或实名结果暂不可获取，未放行交易。</div>':'<div class="small">请在弹出的平台实名页面完成认证。</div>';
  const actions=state==='LOGIN'?'<button class="btn" data-act="auth-close">取消</button><button class="btn btn-primary" data-act="auth-login">使用平台账号登录</button>':state==='UNVERIFIED'?'<button class="btn" data-act="auth-close">暂不认证</button><button class="btn btn-primary" data-act="auth-verify">前往认证</button>':state==='VERIFIED'?'<button class="btn btn-primary" data-act="auth-close">继续购买</button>':state==='UNKNOWN'?'<button class="btn" data-act="auth-close">返回浏览</button><button class="btn btn-primary" data-act="auth-retry">重试</button>':'<button class="btn btn-primary" data-act="auth-close">返回浏览</button>';
  const overlay=`<div class="web-layer confirm"><div class="layer-mask"></div><div class="layer"><div class="layer-head"><div class="layer-title">${state==='LOGIN'?'需要登录':state==='VERIFIED'?'实名认证已完成':state==='MINOR'?'暂不可购买':state==='UNKNOWN'?'暂无法核验':'请完成实名认证'}</div><button class="layer-close" data-act="auth-close">✕</button></div><div class="layer-body">${C(compId(page,'COM-CLIENT-C30'),inner)}</div><div class="layer-foot">${actions}</div></div></div>`;
  return webFrame(page,'',{backdrop:webBuyBackdrop(product((S.buy&&S.buy.productId)||'p01')),overlay});
}
function webPhone(page,state){
  const id=compId(page,'COM-CLIENT-C31'); const idNotice=compId(page,'COM-CLIENT-C36');
  const privacy=`<div class="noticebar"><div>获取验证码并提交即表示同意按交易验证目的处理手机号；可查看《隐私政策》。</div></div>`;
  const inner=`<div class="field"><label>手机号</label><input class="input ${S.bindError==='phone'?'err':''}" id="phoneInput" type="text" value="${esc(S.bindPhone)}" placeholder="请输入 11 位手机号"></div><div class="field"><label>短信验证码</label><div class="searchbar"><input class="input ${S.bindError==='code'?'err':''}" id="codeInput" type="text" value="${esc(S.bindCode)}" placeholder="6 位验证码"><button class="btn" data-act="send-code" ${S.bindCooldown>0?'disabled':''}>${S.bindCooldown>0?S.bindCooldown+'s':'获取验证码'}</button></div><div class="hint">演示验证码：123456</div>${S.bindError==='code'?'<div class="errmsg">验证码错误或已过期</div>':''}</div>${idNotice?C(idNotice,privacy):privacy}`;
  const overlay=`<div class="web-layer confirm"><div class="layer-mask"></div><div class="layer"><div class="layer-head"><div class="layer-title">绑定手机号</div><button class="layer-close" data-act="phone-close">✕</button></div><div class="layer-body">${C(id,inner)}</div><div class="layer-foot"><button class="btn" data-act="phone-close">取消</button><button class="btn btn-primary" data-act="bind-submit">提交绑定</button></div></div></div>`;
  return webFrame(page,'',{backdrop:webPhoneBackdrop(page,product((S.buy&&S.buy.productId)||'p01')),overlay});
}
function webNotice(page,state){
  if(state==='HIDDEN') return webHome(pageOf('WEB-HOME-01'),'DEFAULT');
  const id=compId(page,'COM-CLIENT-C32');
  const verified=state==='SHOWN_VERIFIED'; const minor=state==='SHOWN_MINOR';
  const text=verified?'您已完成实名认证。':minor?'您已实名认证，但当前为未成年，可浏览、暂不可购买。':'购买前需完成实名认证，您也可以先浏览商品。';
  const actions=verified||minor?'<button class="btn btn-primary" data-act="notice-know">知道了</button>':'<button class="btn" data-act="notice-close-x">关闭</button><button class="btn btn-primary" data-act="notice-verify">前往认证</button>';
  const overlay=`<div class="web-layer confirm"><div class="layer-mask" data-act="notice-close-x"></div><div class="layer"><div class="layer-head"><div class="layer-title">实名认证提醒</div><button class="layer-close" data-act="notice-close-x">✕</button></div><div class="layer-body">${C(id,`<div class="small">${text}</div><div class="small muted mt8">提醒不改变实名、成年、协议或手机号状态。</div>`)}</div><div class="layer-foot">${actions}</div></div></div>`;
  return webFrame(page,'',{backdrop:webHome(pageOf('WEB-HOME-01'),'DEFAULT'),overlay});
}

/* ---------- dispatch ---------- */
function renderClientPage(page){
  const st=RV.state;
  const fns={
    'client-home': page.end==='H5'?h5Home:webHome,
    'client-search': page.end==='H5'?h5SearchHome:webSearch,
    'client-results': h5SearchResults,
    'client-product': page.end==='H5'?h5Product:webProduct,
    'client-buy': page.end==='H5'?h5Buy:webBuy,
    'client-checkout': page.end==='H5'?h5Checkout:webCheckout,
    'client-pay': page.end==='H5'?h5Pay:webPay,
    'client-payret': page.end==='H5'?h5Payret:webPayret,
    'client-result': page.end==='H5'?h5Result:webResult,
    'client-orders': page.end==='H5'?h5Orders:webOrders,
    'client-order': page.end==='H5'?h5Order:webOrder,
    'client-profile': page.end==='H5'?h5Profile:webProfile,
    'client-service': page.end==='H5'?h5Service:webService,
    'client-agreement': page.end==='H5'?h5Agreement:webAgreement,
    'client-auth': page.end==='H5'?h5Auth:webAuth,
    'client-phone': page.end==='H5'?h5Phone:webPhone,
    'client-notice': page.end==='H5'?h5Notice:webNotice,
    'web-home': webHome, 'web-search': webSearch, 'web-product': webProduct, 'web-buy': webBuy,
    'web-checkout': webCheckout, 'web-pay': webPay, 'web-payret': webPayret, 'web-result': webResult,
    'web-orders': webOrders, 'web-order': webOrder, 'web-profile': webProfile, 'web-service': webService,
    'web-agreement': webAgreement, 'web-auth': webAuth, 'web-phone': webPhone, 'web-notice': webNotice
  };
  const fn=fns[page.kind]; if(!fn) return `<div class="emptystate">未注册页面渲染器：${esc(page.kind)}</div>`;
  return fn(page,st);
}

function h5CheckoutBackdrop(o){
  const p=product(o.productId); const sp=specOf(p,o.specId);
  return h5Header(pageOf('H5-CHECKOUT-01'),'确认订单',{back:true})+h5Body(`<div class="page-pad"><div class="m-card"><div class="m-row-between"><span class="small muted">订单号</span><span class="mono small">${esc(o.no)}</span></div></div><div class="mt12 m-card"><div class="m-row"><div class="thumb">图片</div><div class="flex1"><div class="strong">${esc(p.name)}</div><div class="small muted">${esc(sp.name)} · 数量 1</div></div></div></div><div class="mt12 m-card"><div class="m-row-between"><span class="small muted">应付金额</span><span class="price">${money(o.amount)}</span></div></div></div>`)+`<div class="m-actionbar"><button class="btn btn-primary" disabled>继续支付</button></div>`;
}
function webBuyBackdrop(p){
  const pg=pageOf('WEB-PRODUCT-01');
  return webHeader(pg)+webMain(pg,`<div class="web-crumbs">首页 / 商品详情</div><div class="web-2col"><div><div class="web-hero">商品主图占位</div><h2 class="web-title">${esc(p.name)}</h2><div class="small muted">${esc(p.nameEn)}</div><div class="mt12 small">${p.restrict.join(' · ')}</div></div><div class="web-side"><div class="web-buycard"><div class="price-row"><span class="price price-lg">${money(p.price)}</span><span class="small muted">数量 1</span></div><button class="btn btn-primary btn-block" disabled>立即购买</button></div></div></div>`);
}
function webPhoneBackdrop(page,p){
  return webHeader(page)+webMain(page,`<div class="web-crumbs">首页 / 商品详情</div><div class="web-2col"><div><div class="web-hero">商品主图占位</div><h2 class="web-title">${esc(p.name)}</h2><div class="small muted">${esc(p.nameEn)}</div><div class="mt12 small">${p.restrict.join(' · ')}</div></div><div class="web-side"><div class="web-buycard"><div class="price-row"><span class="price price-lg">${money(p.price)}</span><span class="small muted">数量 1</span></div><button class="btn btn-primary btn-block" disabled>立即购买</button></div></div></div>`);
}

/* ===== admin data & renderer ===== */
const ADMIN_MENU = [
  {g:'商品与供应', items:[
    {id:'ADM-HOME-01',n:'首页管理'},{id:'ADM-PRODUCT-01',n:'商品管理'},{id:'ADM-SUPPLIER-01',n:'供应商管理'},{id:'ADM-STOCK-01',n:'库存查看'}]},
  {g:'交易与交付', items:[
    {id:'ADM-ORDER-01',n:'订单管理',badge:3},{id:'ADM-GIFT-01',n:'好友赠送',badge:2},{id:'ADM-CODE-01',n:'口令码交付',badge:1},{id:'ADM-REFUND-01',n:'退款管理',badge:1},{id:'ADM-PAYCHECK-01',n:'支付核查',badge:1}]},
  {g:'运营配置', items:[
    {id:'ADM-SERVICE-01',n:'客服配置'},{id:'ADM-SEARCHCFG-01',n:'搜索推荐'},{id:'ADM-AGREEMENT-01',n:'协议管理'},{id:'ADM-NOTIFY-01',n:'通知记录'},{id:'ADM-WALLET-01',n:'钱包余额'}]},
  {g:'系统与审计', items:[
    {id:'ADM-RBAC-01',n:'权限管理'},{id:'ADM-AUDIT-01',n:'操作记录'}]}
];
const ROLE_MENU = {
  '管理员': ADMIN_MENU.flatMap(g=>g.items.map(i=>i.id)),
  '运营': ADMIN_MENU.flatMap(g=>g.items.map(i=>i.id)).filter(id=>id!=='ADM-RBAC-01'),
  '客服': ['ADM-ORDER-01','ADM-NOTIFY-01'],
  '财务': ['ADM-ORDER-01','ADM-REFUND-01','ADM-PAYCHECK-01','ADM-AUDIT-01','ADM-WALLET-01','ADM-NOTIFY-01']
};
const ADM = {role:'管理员', rt:{}, menuQuery:'', collapsed:false, toastSeq:0, confirm:null};

function admRt(id){
  if(!ADM.rt[id]){
    const page=pageOf(id); const cfg=page.cfg||{};
    ADM.rt[id]={draft:{},committed:{},tab:(cfg.tabs&&cfg.tabs[0])||'',page:1,size:10,sel:[],drawer:null,drawerId:'',msg:'',msgKind:'',loading:false,noperm:false,
      configDraft:null,preview:false,picker:false};
  }
  return ADM.rt[id];
}
function canAccess(id){ return (ROLE_MENU[ADM.role]||[]).includes(id); }

const ADM_DATA = {
 orders: [
  {id:'o1',no:'SO20261027001',platform:'A',gname:'影之刃零',amount:25800,pay:'已支付',delivery:'已交付',refund:'—',created:'2026-10-27 09:12',tab:'已支付',type:'CODE',user:'u_1001',gid:'10191',cdk:'VG-AAA-0016',attempt:'WX20261027091201'},
  {id:'o2',no:'SO20261027002',platform:'B',gname:'黑神话：悟空',amount:26800,pay:'已支付',delivery:'赠送待处理',refund:'—',created:'2026-10-26 17:30',tab:'已支付',type:'GIFT',user:'u_1001',gid:'10203',friend:'steam://friends/add/7656119****',attempt:'AL20261026173002'},
  {id:'o3',no:'SO20261027003',platform:'A',gname:'影之刃零',amount:25800,pay:'待支付',delivery:'—',refund:'—',created:'2026-10-27 11:50',tab:'待支付',type:'CODE',user:'u_1001',gid:'10191',attempt:''},
  {id:'o4',no:'SO20261027004',platform:'C',gname:'艾尔登法环',amount:29800,pay:'确认中',delivery:'—',refund:'—',created:'2026-10-27 10:05',tab:'支付确认中',type:'CODE',user:'u_1003',gid:'10202',attempt:'WX20261027100503'},
  {id:'o5',no:'SO20261027005',platform:'A',gname:'赛博朋克2077',amount:19800,pay:'已支付',delivery:'已交付',refund:'退款失败',created:'2026-10-25 14:20',tab:'退款',type:'CODE',user:'u_1001',gid:'10201',cdk:'VG-CB-2077',attempt:'WX20261025142005',fail:'渠道明确失败，需财务重试'},
  {id:'o6',no:'SO20261027006',platform:'B',gname:'双人成行',amount:9800,pay:'已关闭',delivery:'—',refund:'—',created:'2026-10-24 16:00',tab:'已关闭',type:'GIFT',user:'u_1002',gid:'10204'},
  {id:'o7',no:'SO20261027007',platform:'A',gname:'黑神话：悟空',amount:26800,pay:'已支付',delivery:'已完成',refund:'—',created:'2026-10-23 10:12',tab:'已支付',type:'GIFT',user:'u_1004',gid:'10203',friend:'steam://friends/add/7656119****',attempt:'WX20261023101207'},
  {id:'o8',no:'SO20261027008',platform:'C',gname:'影之刃零',amount:29800,pay:'已支付',delivery:'发码中',refund:'—',created:'2026-10-27 11:02',tab:'已支付',type:'CODE',user:'u_1005',gid:'10192',attempt:'AL20261027110208'},
  {id:'o9',no:'SO20261027009',platform:'B',gname:'艾尔登法环',amount:29800,pay:'已支付',delivery:'交付异常',refund:'—',created:'2026-10-27 08:40',tab:'交付异常',type:'CODE',user:'u_1002',gid:'10202',attempt:'WX20261027084009',fail:'pu005 出库失败'},
  {id:'o10',no:'SO20261027010',platform:'A',gname:'双人成行',amount:9800,pay:'待支付',delivery:'—',refund:'—',created:'2026-10-27 11:58',tab:'待支付',type:'GIFT',user:'u_1006',gid:'10204'},
  {id:'o11',no:'SO20261027011',platform:'C',gname:'赛博朋克2077',amount:19800,pay:'确认中',delivery:'—',refund:'—',created:'2026-10-27 11:59',tab:'支付确认中',type:'CODE',user:'u_1007',gid:'10201'},
  {id:'o12',no:'SO20261027012',platform:'B',gname:'影之刃零',amount:25800,pay:'已支付',delivery:'已交付',refund:'已退款',created:'2026-10-22 09:00',tab:'退款',type:'CODE',user:'u_1008',gid:'10191',cdk:'VG-OLD-001',attempt:'AL20261022090012'}
 ],
 products: [
  {id:'p01',gname:'影之刃零',gid:'10191',supplier:'虎供应',platform:'steam',cost:18000,lowest:22000,price:25800,selectStatus:'已选品',publishStatus:'已发布',content:'完整',combo:'否',tab:'已发布',stock:'充足'},
  {id:'p02',gname:'赛博朋克2077',gid:'10201',supplier:'莫尔康发行',platform:'steam',cost:15000,lowest:18000,price:19800,selectStatus:'已选品',publishStatus:'已发布',content:'完整',combo:'否',tab:'已发布',stock:'售罄'},
  {id:'p03',gname:'艾尔登法环',gid:'10202',supplier:'莫尔康发行',platform:'steam',cost:25000,lowest:28000,price:29800,selectStatus:'已选品',publishStatus:'已发布',content:'完整',combo:'否',tab:'已发布',stock:'未知'},
  {id:'p04',gname:'黑神话：悟空',gid:'10203',supplier:'虎供应',platform:'steam',cost:22000,lowest:25000,price:26800,selectStatus:'已选品',publishStatus:'已发布',content:'完整',combo:'否',tab:'已发布',stock:'充足'},
  {id:'p05',gname:'双人成行',gid:'10204',supplier:'虎供应',platform:'steam',cost:7000,lowest:9000,price:9800,selectStatus:'已选品',publishStatus:'已发布',content:'完整',combo:'否',tab:'已发布',stock:'充足'},
  {id:'p06',gname:'鬼谷八荒',gid:'10205',supplier:'虎供应',platform:'steam',cost:4000,lowest:5000,price:5800,selectStatus:'已选品',publishStatus:'待审核',content:'缺少主图',combo:'否',tab:'待审核',stock:'充足'},
  {id:'p07',gname:'Steam 组合包',gid:'10206',supplier:'虎供应',platform:'steam',cost:30000,lowest:35000,price:38800,selectStatus:'待选品',publishStatus:'未发布',content:'完整',combo:'是',tab:'待选品',stock:'—'},
  {id:'p08',gname:'NBA 2K27',gid:'10207',supplier:'莫尔康发行',platform:'steam',cost:15000,lowest:19000,price:19817,selectStatus:'已选品',publishStatus:'已下架',content:'完整',combo:'否',tab:'已下架',stock:'充足'},
  {id:'p09',gname:'信号法则',gid:'10208',supplier:'莫尔康发行',platform:'steam',cost:6000,lowest:0,price:8800,selectStatus:'待选品',publishStatus:'未发布',content:'未开始',combo:'否',tab:'待选品',stock:'充足'},
  {id:'p10',gname:'人渣',gid:'10209',supplier:'虎供应',platform:'steam',cost:3000,lowest:0,price:4200,selectStatus:'待选品',publishStatus:'未发布',content:'完整',combo:'否',tab:'待选品',stock:'充足'}
 ],
 stock: [
  {id:'s1',gname:'影之刃零',gid:'10191',stock:12,synced:'2026-10-27 11:50',fresh:'新鲜',sale:'可售',tab:'新鲜'},
  {id:'s2',gname:'赛博朋克2077',gid:'10201',stock:0,synced:'2026-10-27 11:48',fresh:'新鲜',sale:'售罄',tab:'售罄'},
  {id:'s3',gname:'艾尔登法环',gid:'10202',stock:null,synced:'2026-10-27 09:10',fresh:'过期',sale:'允许下单（风险）',tab:'过期/未知'},
  {id:'s4',gname:'黑神话：悟空',gid:'10203',stock:8,synced:'2026-10-27 11:45',fresh:'新鲜',sale:'可售',tab:'新鲜'},
  {id:'s5',gname:'双人成行',gid:'10204',stock:5,synced:'2026-10-27 11:40',fresh:'新鲜',sale:'可售',tab:'新鲜'},
  {id:'s6',gname:'NBA 2K27',gid:'10207',stock:3,synced:'2026-10-27 10:20',fresh:'过期',sale:'停止新购',tab:'过期/未知'},
  {id:'s7',gname:'信号法则',gid:'10208',stock:0,synced:'2026-10-27 11:51',fresh:'新鲜',sale:'售罄',tab:'售罄'},
  {id:'s8',gname:'人渣',gid:'10209',stock:null,synced:'2026-10-27 07:30',fresh:'未知',sale:'允许下单（风险）',tab:'过期/未知'}
 ],
 gift: [
  {id:'g1',batch:'GB-20261027-01',no:'SO20261027002',gname:'黑神话：悟空',link:'steam://friends/add/7656119****',paidAt:'2026-10-26 17:30',status:'待处理',tab:'待处理',user:'u_1001'},
  {id:'g2',batch:'GB-20261027-01',no:'SO20261027007',gname:'黑神话：悟空',link:'steam://friends/add/7656119****',paidAt:'2026-10-23 10:12',status:'已完成',tab:'已完成',user:'u_1004'},
  {id:'g3',batch:'GB-20261026-03',no:'SO20261026003',gname:'双人成行',link:'steam://friends/add/7656119****',paidAt:'2026-10-26 16:10',status:'处理中',tab:'处理中',user:'u_1002'},
  {id:'g4',batch:'GB-20261026-02',no:'SO20261026004',gname:'黑神话：悟空',link:'steam://friends/add/7656119****',paidAt:'2026-10-26 09:00',status:'处理异常',tab:'异常',user:'u_1006'},
  {id:'g5',batch:'GB-20261027-02',no:'SO20261027008',gname:'双人成行',link:'steam://friends/add/7656119****',paidAt:'2026-10-27 11:02',status:'待处理',tab:'待处理',user:'u_1005'},
  {id:'g6',batch:'GB-20261027-02',no:'SO20261027009',gname:'黑神话：悟空',link:'steam://friends/add/7656119****',paidAt:'2026-10-27 08:40',status:'待处理',tab:'待处理',user:'u_1002'},
  {id:'g7',batch:'GB-20261025-01',no:'SO20261025001',gname:'双人成行',link:'steam://friends/add/7656119****',paidAt:'2026-10-25 12:00',status:'已完成',tab:'已完成',user:'u_1007'},
  {id:'g8',batch:'GB-20261024-01',no:'SO20261024001',gname:'黑神话：悟空',link:'steam://friends/add/7656119****',paidAt:'2026-10-24 18:10',status:'待处理',tab:'待处理',user:'u_1008'}
 ],
 code: [
  {id:'c1',no:'SO20261027001',gid:'10191',reqid:'SO20261027001-1',buyid:'ws20261027091201001',status:'已交付',retry:0,deadline:'2026-10-28 09:12',tab:'已交付',cdk:'VG-AAA-0016',errcode:''},
  {id:'c2',no:'SO20261027008',gid:'10192',reqid:'SO20261027008-1',buyid:'—',status:'发码中',retry:1,deadline:'2026-10-28 11:02',tab:'发码中',cdk:'',errcode:'timeout'},
  {id:'c3',no:'SO20261027009',gid:'10202',reqid:'SO20261027009-1',buyid:'—',status:'交付异常',retry:2,deadline:'2026-10-28 08:40',tab:'交付异常',cdk:'',errcode:'pu005'},
  {id:'c4',no:'SO20261027012',gid:'10191',reqid:'SO20261027012-1',buyid:'ws20261022090101',status:'已交付',retry:0,deadline:'2026-10-23 09:00',tab:'已交付',cdk:'VG-OLD-001',errcode:''},
  {id:'c5',no:'SO20261026010',gid:'10201',reqid:'SO20261026010-1',buyid:'—',status:'交付异常',retry:4,deadline:'2026-10-27 09:00',tab:'超过 24 小时',cdk:'',errcode:'pu004'},
  {id:'c6',no:'SO20261026011',gid:'10202',reqid:'SO20261026011-1',buyid:'ws20261026093001',status:'已交付',retry:1,deadline:'2026-10-27 09:30',tab:'已交付',cdk:'VG-ER-001',errcode:''},
  {id:'c7',no:'SO20261026012',gid:'10203',reqid:'SO20261026012-1',buyid:'—',status:'交付异常',retry:1,deadline:'2026-10-27 14:00',tab:'交付异常',cdk:'',errcode:'pu006'},
  {id:'c8',no:'SO20261026013',gid:'10204',reqid:'SO20261026013-1',buyid:'ws20261026150001',status:'已交付',retry:0,deadline:'2026-10-27 15:00',tab:'已交付',cdk:'VG-IT-001',errcode:''}
 ],
 refund: [
  {id:'r1',no:'RF20261027001',order:'SO20261027005',type:'系统异常',amount:19800,status:'失败',reason:'渠道明确失败，需财务重试',op:'system',tab:'失败',task:'原支付渠道退回'},
  {id:'r2',no:'RF20261027002',order:'SO20261027012',type:'系统异常',amount:25800,status:'成功',reason:'重复支付',op:'system',tab:'成功',task:'原支付渠道退回'},
  {id:'r3',no:'RF20261027003',order:'SO20261027013',type:'用户特殊',amount:9800,status:'待审核',reason:'用户申请，已履约原则上拒绝',op:'service01',tab:'待审核',task:'待运营审核'},
  {id:'r4',no:'RF20261027004',order:'SO20261027014',type:'用户特殊',amount:26800,status:'待执行',reason:'审核通过，待财务执行',op:'ops01',tab:'待执行',task:'待执行'},
  {id:'r5',no:'RF20261027005',order:'SO20261027015',type:'系统异常',amount:29800,status:'退款中',reason:'晚到款无法履约',op:'system',tab:'退款中',task:'已发起'},
  {id:'r6',no:'RF20261027006',order:'SO20261027016',type:'系统异常',amount:25800,status:'失败',reason:'无法原路退回',op:'system',tab:'失败',task:'需人工联系用户'}
 ],
 notify: [
  {id:'n1',event:'发码通知',no:'SO20261027001',platform:'A',status:'平台已受理',retry:0,last:'2026-10-27 09:13',reason:'',tab:'发码通知'},
  {id:'n2',event:'发码通知',no:'SO20261027009',platform:'B',status:'发送失败',retry:2,last:'2026-10-27 08:45',reason:'平台超时',tab:'失败/未知'},
  {id:'n3',event:'退款发起',no:'SO20261027005',platform:'A',status:'平台已受理',retry:0,last:'2026-10-25 15:00',reason:'',tab:'退款发起'},
  {id:'n4',event:'退款到账',no:'SO20261027012',platform:'B',status:'结果未知',retry:1,last:'2026-10-27 10:00',reason:'无回执',tab:'失败/未知'},
  {id:'n5',event:'发码通知',no:'SO20261027008',platform:'C',status:'待发送',retry:0,last:'—',reason:'',tab:'发码通知'},
  {id:'n6',event:'发码通知',no:'SO20261027004',platform:'C',status:'发送失败',retry:1,last:'2026-10-27 11:00',reason:'模板变量缺失',tab:'失败/未知'},
  {id:'n7',event:'退款发起',no:'SO20261027014',platform:'A',status:'平台已受理',retry:0,last:'2026-10-27 10:20',reason:'',tab:'退款发起'},
  {id:'n8',event:'退款到账',no:'SO20261027016',platform:'B',status:'结果未知',retry:0,last:'2026-10-27 11:10',reason:'平台未返回',tab:'失败/未知'}
 ],
 paycheck: [
  {id:'pc1',no:'SO20261027004',created:'2026-10-27 10:05',channel:'微信',last:'2026-10-27 11:20',result:'渠道处理中',status:'待核查',tab:'待核查',attempt:'WX20261027100503'},
  {id:'pc2',no:'SO20261027011',created:'2026-10-27 11:59',channel:'支付宝',last:'2026-10-27 12:10',result:'未返回',status:'核查中',tab:'核查中',attempt:'AL20261027115911'},
  {id:'pc3',no:'SO20261026021',created:'2026-10-26 20:00',channel:'微信',last:'2026-10-27 08:00',result:'渠道确认已支付',status:'已定性',tab:'已定性',attempt:'WX20261026200021'},
  {id:'pc4',no:'SO20261026022',created:'2026-10-26 21:10',channel:'支付宝',last:'2026-10-27 09:30',result:'渠道确认未支付',status:'已定性',tab:'已定性',attempt:'AL20261026211022'},
  {id:'pc5',no:'SO20261027023',created:'2026-10-27 07:40',channel:'微信',last:'2026-10-27 11:50',result:'渠道超时',status:'待核查',tab:'待核查',attempt:'WX20261027074023'}
 ],
 audit: [
  {id:'a1',time:'2026-10-27 11:55',actor:'ops01',action:'商品发布',obj:'p01 影之刃零',before:'待审核',after:'已发布',type:'商品'},
  {id:'a2',time:'2026-10-27 11:40',actor:'finance01',action:'退款执行',obj:'RF20261027002',before:'待执行',after:'退款中',type:'退款'},
  {id:'a3',time:'2026-10-27 11:20',actor:'system',action:'自动退款',obj:'RF20261027007',before:'—',after:'待处理',type:'退款'},
  {id:'a4',time:'2026-10-27 10:30',actor:'ops01',action:'赠送完成',obj:'SO20261027007',before:'处理中',after:'已完成',type:'订单'},
  {id:'a5',time:'2026-10-27 10:10',actor:'admin',action:'权限变更',obj:'运营角色',before:'退款执行=不可',after:'退款执行=需授权',type:'权限'},
  {id:'a6',time:'2026-10-27 09:45',actor:'service01',action:'订单查询',obj:'SO20261027005',before:'—',after:'已查看',type:'订单'},
  {id:'a7',time:'2026-10-27 09:20',actor:'ops01',action:'口令码重试',obj:'SO20261027009',before:'重试2',after:'重试3',type:'订单'},
  {id:'a8',time:'2026-10-27 09:00',actor:'ops01',action:'协议发布',obj:'购买协议 v1.6',before:'v1.5',after:'v1.6',type:'商品'},
  {id:'a9',time:'2026-10-27 08:30',actor:'finance01',action:'订单导出',obj:'筛选：待支付',before:'—',after:'128 行',type:'订单'},
  {id:'a10',time:'2026-10-26 18:00',actor:'ops01',action:'搜索推荐保存',obj:'关键词排序',before:'4 项',after:'5 项',type:'商品'},
  {id:'a11',time:'2026-10-26 17:30',actor:'ops01',action:'赠送批次导出',obj:'GB-20261027-01',before:'—',after:'3 单',type:'订单'},
  {id:'a12',time:'2026-10-26 16:10',actor:'admin',action:'单人退款授权',obj:'财务角色',before:'关闭',after:'开启',type:'权限'}
 ],
 rbac: [
  {id:'u1',account:'admin',name:'管理员',role:'管理员',scope:'全部',status:'启用',last:'2026-10-27 11:40',tab:'账号'},
  {id:'u2',account:'ops01',name:'运营小周',role:'运营',scope:'商城全量',status:'启用',last:'2026-10-27 11:55',tab:'账号'},
  {id:'u3',account:'service01',name:'客服小林',role:'客服',scope:'订单查询',status:'启用',last:'2026-10-27 09:45',tab:'账号'},
  {id:'u4',account:'finance01',name:'财务小陈',role:'财务',scope:'退款/对账',status:'启用',last:'2026-10-27 11:40',tab:'账号'},
  {id:'u5',account:'ops02',name:'运营小李',role:'运营',scope:'商品/赠送',status:'停用',last:'2026-10-20 10:00',tab:'账号'},
  {id:'u6',account:'audit01',name:'审计',role:'财务',scope:'只读',status:'启用',last:'2026-10-26 16:00',tab:'账号'},
  {id:'r1',account:'ADMIN',name:'管理员',role:'全量权限',scope:'全部',status:'启用',last:'2026-10-27 11:40',tab:'角色'},
  {id:'r2',account:'OPS',name:'运营',role:'14 项',scope:'商城全量',status:'启用',last:'2026-10-27 11:55',tab:'角色'},
  {id:'r3',account:'SERVICE',name:'客服',role:'2 项',scope:'订单查询',status:'启用',last:'2026-10-27 09:45',tab:'角色'},
  {id:'r4',account:'FINANCE',name:'财务',role:'6 项',scope:'退款/对账',status:'启用',last:'2026-10-27 11:40',tab:'角色'}
 ],
 stockRows: [],
 supplier: [
  {id:'sp1',name:'Higame 主供应商',appid:'1003',status:'已连接',gidCount:10,whitelist:'3 项',updated:'2026-10-27 11:00',tab:'供应商'},
  {id:'sp2',name:'备用域名',appid:'1003',status:'待切换',gidCount:10,whitelist:'—',updated:'2026-10-26 18:00',tab:'供应商'}
 ],
 keywords: [
  {id:'k1',name:'赛博朋克',enabled:true,order:1},{id:'k2',name:'影之刃',enabled:true,order:2},{id:'k3',name:'黑神话',enabled:true,order:3},{id:'k4',name:'艾尔登法环',enabled:false,order:4},{id:'k5',name:'双人成行',enabled:true,order:5}
 ],
 hotProducts: [
  {id:'h1',pid:'p01',name:'影之刃零',price:25800,order:1,enabled:true},{id:'h2',pid:'p04',name:'黑神话：悟空',price:26800,order:2,enabled:true},{id:'h3',pid:'p05',name:'双人成行',price:9800,order:3,enabled:true},{id:'h4',pid:'p03',name:'艾尔登法环',price:29800,order:4,enabled:false}
 ],
 home: {version:'v12',draftVersion:'v13',banners:[{id:'b1',name:'影之刃零',target:'p01',enabled:true},{id:'b2',name:'黑神话：悟空',target:'p04',enabled:true},{id:'b3',name:'双人成行',target:'p05',enabled:false}],recommended:['p01','p04','p05','p03'],draft:null,published:'2026-10-27 09:00'},
 service: {wecomId:'mall-service',link:'',guide:'请提供订单号与问题截图，客服将按顺序处理。',hours:'待运营确认',updated:'2026-10-27 09:00'},
 agreement: {version:'v1.6',body:'本商城由商城经营公司统一销售、收款与售后。虚拟商品一经履约原则上不退款；好友赠送每天 8:00～18:00 交付。',materialChange:false,published:'2026-10-22 10:00',history:[{v:'v1.5',date:'2026-10-01',material:'否'},{v:'v1.6',date:'2026-10-22',material:'否'}]},
 wallet: {total:1000,available:800,frozen:200,queried:'2026-10-27 11:58',threshold:300,low:false}
};
ADM_DATA.stockRows = ADM_DATA.stock;

const ADMIN_FILTERS = {
 'ADM-PRODUCT-01':[{k:'gname',t:'商品名称',type:'text'},{k:'supplier',t:'供应商',type:'select',opts:['全部','虎供应','莫尔康发行']},{k:'platform',t:'平台',type:'select',opts:['全部','steam']},{k:'selectStatus',t:'选品状态',type:'select',opts:['全部','待选品','已选品']},{k:'publishStatus',t:'发布状态',type:'select',opts:['全部','未发布','待审核','已发布','已下架']}],
 'ADM-STOCK-01':[{k:'gname',t:'商品',type:'text'},{k:'fresh',t:'新鲜度',type:'select',opts:['全部','新鲜','过期','未知']}],
 'ADM-ORDER-01':[{k:'no',t:'订单号',type:'text'},{k:'platform',t:'来源平台',type:'select',opts:['全部','A','B','C']},{k:'gname',t:'商品',type:'text'},{k:'pay',t:'支付状态',type:'select',opts:['全部','待支付','确认中','已支付','已关闭']},{k:'delivery',t:'交付状态',type:'select',opts:['全部','—','发码中','已交付','赠送待处理','已完成','交付异常']},{k:'refund',t:'退款状态',type:'select',opts:['全部','—','退款失败','退款中','已退款']}],
 'ADM-GIFT-01':[{k:'batch',t:'批次号',type:'text'},{k:'no',t:'订单号',type:'text'},{k:'status',t:'状态',type:'select',opts:['全部','待处理','处理中','已完成','处理异常']}],
 'ADM-CODE-01':[{k:'no',t:'订单号',type:'text'},{k:'gid',t:'gid',type:'text'},{k:'status',t:'状态',type:'select',opts:['全部','发码中','已交付','交付异常']}],
 'ADM-REFUND-01':[{k:'no',t:'退款单号',type:'text'},{k:'order',t:'订单号',type:'text'},{k:'type',t:'类型',type:'select',opts:['全部','系统异常','用户特殊']},{k:'status',t:'状态',type:'select',opts:['全部','待审核','待执行','退款中','失败','成功']}],
 'ADM-AUDIT-01':[{k:'obj',t:'对象/订单号',type:'text'},{k:'actor',t:'操作人',type:'text'},{k:'action',t:'动作',type:'text'},{k:'type',t:'分类',type:'select',opts:['全部','订单','退款','商品','权限']}],
 'ADM-PAYCHECK-01':[{k:'no',t:'订单号',type:'text'},{k:'channel',t:'渠道',type:'select',opts:['全部','微信','支付宝']},{k:'status',t:'核查状态',type:'select',opts:['全部','待核查','核查中','已定性']}],
 'ADM-NOTIFY-01':[{k:'no',t:'订单号',type:'text'},{k:'platform',t:'平台',type:'select',opts:['全部','A','B','C']},{k:'event',t:'事件',type:'select',opts:['全部','发码通知','退款发起','退款到账']},{k:'status',t:'状态',type:'select',opts:['全部','待发送','发送失败','平台已受理','结果未知']}],
 'ADM-RBAC-01':[{k:'account',t:'账号/角色',type:'text'}],
 'ADM-SUPPLIER-01':[{k:'name',t:'供应商',type:'text'}]
};

function adminRows(pageId){
  const map={'ADM-ORDER-01':'orders','ADM-PRODUCT-01':'products','ADM-STOCK-01':'stock','ADM-GIFT-01':'gift','ADM-CODE-01':'code','ADM-REFUND-01':'refund','ADM-NOTIFY-01':'notify','ADM-PAYCHECK-01':'paycheck','ADM-AUDIT-01':'audit','ADM-RBAC-01':'rbac','ADM-SUPPLIER-01':'supplier'};
  return ADM_DATA[map[pageId]]||[];
}
function adminFiltered(pageId){
  const rt=admRt(pageId); const rows=adminRows(pageId).slice();
  const fs=ADMIN_FILTERS[pageId]||[];
  return rows.filter(r=>fs.every(f=>{
    const v=rt.committed[f.k]; if(!v||v==='全部') return true;
    const rv=r[f.k]; return String(rv==null?'':rv).toLowerCase().includes(String(v).toLowerCase());
  }));
}
function adminTabbed(pageId, rows){
  const rt=admRt(pageId); const cfg=pageOf(pageId).cfg||{};
  if(!cfg.tabs||!cfg.tabs.length||!rt.tab||rt.tab==='全部') return rows;
  return rows.filter(r=>r.tab===rt.tab);
}
function adminCounts(pageId, rows){
  const cfg=pageOf(pageId).cfg||{}; const o={};
  (cfg.tabs||[]).forEach(t=>o[t]=t==='全部'?rows.length:rows.filter(r=>r.tab===t).length);
  return o;
}

function adminFrame(page, inner, opts){
  opts=opts||{};
  const menu = renderAdminMenu(page);
  return `<div class="admin-canvas-host"><div class="admin-shell">
    ${menu}
    <div class="admin-main"><div class="admin-top" data-component="${page.id}-C02">
      <span>数据范围：${ADM.role==='管理员'?'全量':ADM.role==='运营'?'商城全量':'本人负责范围'}</span>
      <label class="small">角色 <select class="role-sel" data-act="adm-role">${Object.keys(ROLE_MENU).map(r=>`<option ${r===ADM.role?'selected':''}>${r}</option>`).join('')}</select></label>
      <span>${esc(ADM.role)}</span>
    </div><div class="admin-work">${inner}</div></div>
  </div>${opts.overlay||''}${ADM.overlay||''}${ADM.confirm?renderConfirmLayer():''}<div class="toast-host" id="toastHost"></div></div>`;
}
function renderAdminMenu(page){
  const allowed=ROLE_MENU[ADM.role]||[];
  const q=(ADM.menuQuery||'').trim().toLowerCase();
  let groups='';
  ADMIN_MENU.forEach(g=>{
    const items=g.items.filter(i=>allowed.includes(i.id)&&(!q||i.n.toLowerCase().includes(q)||i.id.toLowerCase().includes(q)));
    if(!items.length) return;
    groups+=`<div class="menu-group"><div class="menu-group-title">${esc(g.g)}</div>${items.map(i=>`<button class="menu-item" data-act="adm-menu" data-id="${i.id}" aria-current="${RV.pageId===i.id?'page':'false'}" title="${esc(i.n)}">${icon('order')}<span class="menu-label">${esc(i.n)}</span>${i.badge?`<span class="menu-badge">${i.badge}</span>`:''}</button>`).join('')}</div>`;
  });
  return `<aside class="admin-menu ${ADM.collapsed?'collapsed':''}" data-component="${page.id}-C01">
    <div class="brand"><div class="mark">CS</div><div class="bname">Steam商城运营后台</div><button class="menu-item" style="width:32px;min-height:32px;margin-left:auto;padding:0" data-act="adm-collapse" title="收起菜单">${icon('menu')}</button></div>
    <div class="menu-search"><input type="text" data-act="adm-menu-search" value="${esc(ADM.menuQuery)}" placeholder="搜索菜单" aria-label="搜索菜单"></div>
    <div class="menu-scroll">${groups||'<div class="menu-group-title">无匹配菜单</div>'}</div>
  </aside>`;
}

function renderAdminPage(page){
  if(!canAccess(page.id)){
    return adminFrame(page, `<div class="admin-title">${esc(page.name)}</div><div class="admin-sub">${page.module||''} · 无权限</div>${stateBlock(page,'NO_PERM')}`);
  }
  const cfg=page.cfg||{};
  const rt=admRt(page.id);
  if(RV.state==='NO_PERM') return adminFrame(page, `<div class="admin-title">${esc(page.name)}</div><div class="admin-sub">${page.module||''}</div>${stateBlock(page,'NO_PERM')}`);
  if(cfg.config||page.id==='ADM-WALLET-01') return renderAdminConfig(page,rt);
  return renderAdminList(page,rt);
}

function adminTitle(page, rt){
  return `<div class="admin-title">${esc(page.name)}</div><div class="admin-sub">${page.module||''} · ${esc(page.purpose)}</div>${rt.msg?`<div class="admin-msg ${rt.msgKind==='err'?'err':'ok'}" role="status">${esc(rt.msg)}</div>`:''}`;
}
function renderFilterBar(page, rt){
  const fs=ADMIN_FILTERS[page.id]; if(!fs) return '';
  return `<div class="filterbar" data-component="${page.id}-C03">${fs.map(f=>{
    const v=rt.draft[f.k]||'';
    if(f.type==='select') return `<div class="f"><label>${f.t}</label><select data-flt="${f.k}">${f.opts.map(o=>`<option ${v===o?'selected':''}>${o}</option>`).join('')}</select></div>`;
    return `<div class="f"><label>${f.t}</label><input type="text" data-flt="${f.k}" value="${esc(v)}" placeholder="输入${f.t}"></div>`;
  }).join('')}<div class="f-actions"><button class="btn btn-sm btn-primary" data-act="adm-query">查询</button><button class="btn btn-sm" data-act="adm-reset">重置</button><button class="btn btn-sm" data-act="adm-refresh">刷新</button>${page.cfg.export?`<span data-component="${page.id}-C09"><button class="btn btn-sm" data-act="adm-export">导出</button></span>`:''}</div></div>`;
}
function renderTabs(page, rt, filtered){
  const cfg=page.cfg||{}; if(!cfg.tabs||!cfg.tabs.length||cfg.noTabs) return '';
  const counts=adminCounts(page.id, filtered);
  return `<div class="tabs" data-component="${page.id}-C04">${cfg.tabs.map(t=>`<button class="tab" data-act="adm-tab" data-tab="${esc(t)}" aria-selected="${rt.tab===t}">${esc(t)}<span class="cnt">${counts[t]||0}</span></button>`).join('')}</div>`;
}
function renderMetrics(page, rows){
  if(!page.cfg.metrics) return '';
  const defs = page.id==='ADM-ORDER-01'
    ? [{n:'待支付',v:rows.filter(r=>r.tab==='待支付').length,note:'当前筛选'},{n:'支付确认中',v:rows.filter(r=>r.tab==='支付确认中').length,note:'需核查'},{n:'交付异常',v:rows.filter(r=>r.tab==='交付异常').length,note:'需处理'},{n:'退款',v:rows.filter(r=>r.tab==='退款').length,note:'含失败'}]
    : [{n:'可用余额',v:'¥800.00',note:'最近查询 11:58'},{n:'冻结金额',v:'¥200.00',note:'供应商快照'},{n:'可售商品',v:rows.filter(r=>r.sale!=='停止新购').length,note:'受影响列表'},{n:'售罄',v:rows.filter(r=>r.sale==='售罄').length,note:'新鲜且为 0'}];
  return `<div class="metrics" data-component="${page.id}-C10">${defs.map(d=>`<div class="metric"><div class="mname">${d.n}</div><div class="mval">${d.v}</div><div class="mnote">${d.note}</div></div>`).join('')}</div>`;
}
function renderBatch(page, rt){
  if(!page.cfg.batch) return '';
  return `<div class="batchbar" data-component="${page.id}-C08"><label class="small"><input type="checkbox" data-act="adm-selall" ${rt.sel.length&&rt.sel.length===Math.min(rt.size,adminTabbed(page.id,adminFiltered(page.id)).length)?'checked':''}> 当前页全选</label><span class="small">已选 ${rt.sel.length} 条（仅当前页）</span><span class="spacer"></span><button class="btn btn-sm" data-act="adm-batch-export" ${rt.sel.length?'':'disabled'}>批量导出</button><button class="btn btn-sm" data-act="adm-selclear" ${rt.sel.length?'':'disabled'}>清除选择</button></div>`;
}
function renderTable(page, rt, rows){
  const cfg=page.cfg||{}; const cols=cfg.columns||[];
  const start=(rt.page-1)*rt.size; const pageRows=rows.slice(start,start+rt.size);
  let head=`<tr>${page.cfg.batch?'<th style="width:36px"></th>':''}${cols.map(c=>`<th style="width:${c[2]}">${esc(c[1])}</th>`).join('')}</tr>`;
  let body='';
  pageRows.forEach(r=>{
    body+=`<tr data-rowid="${esc(r.id)}" class="${rt.sel.includes(r.id)?'sel':''}">${page.cfg.batch?`<td><input type="checkbox" data-act="adm-sel" data-id="${esc(r.id)}" ${rt.sel.includes(r.id)?'checked':''} aria-label="选择 ${esc(r.no||r.gname||r.id)}"></td>`:''}`;
    cols.forEach(c=>{
      if(c[0]==='_op'){ body+=`<td><div class="opcell">${adminRowActions(page,r)}</div></td>`; return; }
      let v=r[c[0]];
      if(c[0]==='amount'||c[0]==='price'||c[0]==='cost'||c[0]==='lowest') v=money(v);
      if(c[0]==='margin') v=money(r.price-r.cost);
      if(v==null||v==='') v='—';
      body+=`<td class="${['amount','price','cost','lowest','margin'].includes(c[0])?'num':''}">${esc(v)}</td>`;
    });
    body+='</tr>';
  });
  const stateNote = RV.state==='LOADING'?stateBlock(page,'LOADING'):RV.state==='EMPTY'?stateBlock(page,'EMPTY'):RV.state==='ERROR'?stateBlock(page,'ERROR'):'';
  if(stateNote) return `<div class="table-wrap" data-component="${page.id}-C05">${stateNote}</div>`+pagerHtml(rt,0,page.id);
  if(!pageRows.length) return `<div class="table-wrap" data-component="${page.id}-C05">${stateBlock(page,'EMPTY')}</div>`+pagerHtml(rt,0,page.id);
  return `<div class="table-wrap" data-component="${page.id}-C05"><div class="table-scroll"><table class="grid"><thead>${head}</thead><tbody>${body}</tbody></table></div>${pagerHtml(rt,rows.length,page.id)}</div>`;
}
function adminRowActions(page,r){
  const id=page.id;
  if(id==='ADM-ORDER-01') return `<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="查看">查看</button>${r.pay==='确认中'?'<button class="btn" data-act="adm-rowact" data-rowid="'+r.id+'" data-rn="支付核查">支付核查</button>':''}`;
  if(id==='ADM-PRODUCT-01'){
    let s=`<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="编辑">编辑</button>`;
    if(r.publishStatus==='已发布') s+=`<button class="btn" data-act="adm-rowdo" data-rowid="${r.id}" data-do="unpublish" data-confirm="下架后前台停止新购，历史订单仍可查看。">下架</button>`;
    else if(r.combo==='否') s+=`<button class="btn" data-act="adm-rowdo" data-rowid="${r.id}" data-do="publish" data-confirm="发布后商品将进入前台首页、搜索与详情。">发布</button>`;
    return s;
  }
  if(id==='ADM-GIFT-01'){
    let s=`<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="查看">查看</button>`;
    if(r.status==='待处理') s+=`<button class="btn" data-act="adm-rowdo" data-rowid="${r.id}" data-do="gift-start">开始处理</button>`;
    if(r.status==='处理中') s+=`<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="完成">完成</button><button class="btn" data-act="adm-rowdo" data-rowid="${r.id}" data-do="gift-exception">异常</button>`;
    return s;
  }
  if(id==='ADM-CODE-01'){
    let s=`<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="查看">查看</button>`;
    if(r.status==='交付异常'&&!r.deadline.includes('2026-10-27 09:00')) s+=`<button class="btn" data-act="adm-rowdo" data-rowid="${r.id}" data-do="code-retry" data-confirm="将复用原 orderid 重新请求供应商，不换新单号。">重试</button>`;
    s+=`<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="补发">补发</button>`;
    return s;
  }
  if(id==='ADM-REFUND-01'){
    let s=`<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="查看">查看</button>`;
    if(r.status==='待审核') s+=`<button class="btn" data-act="adm-rowdo" data-rowid="${r.id}" data-do="refund-approve" data-confirm="审核通过后进入执行；请确认退款原因与金额。">审核通过</button>`;
    if(r.status==='待执行') s+=`<button class="btn" data-act="adm-rowdo" data-rowid="${r.id}" data-do="refund-exec" data-confirm="将按原支付渠道发起退款；成功以资金结果为准。">执行</button>`;
    if(r.status==='失败') s+=`<button class="btn" data-act="adm-rowdo" data-rowid="${r.id}" data-do="refund-retry" data-confirm="将复用原退款任务标识重试，避免重复退款。">重试</button>`;
    return s;
  }
  if(id==='ADM-PAYCHECK-01') return `<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="核查">核查</button>`;
  if(id==='ADM-NOTIFY-01') return `<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="查看">查看</button>${r.status==='发送失败'||r.status==='结果未知'?'<button class="btn" data-act="adm-rowdo" data-rowid="'+r.id+'" data-do="notify-retry" data-confirm="重试前将校验订单与内容；已退款或内容已替换不发送旧文案。">重试</button>':''}`;
  if(id==='ADM-AUDIT-01') return `<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="查看">查看</button>`;
  if(id==='ADM-RBAC-01') return `<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="配置权限">配置权限</button>`;
  if(id==='ADM-SUPPLIER-01') return `<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="编辑">编辑</button>`;
  if(id==='ADM-STOCK-01') return `<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="查看">查看</button>`;
  return `<button class="btn" data-act="adm-rowact" data-rowid="${r.id}" data-rn="查看">查看</button>`;
}
function renderAdminList(page,rt){
  if(!page.cfg.columns){
    page.cfg.columns=[['name','供应商','24%'],['appid','APPID','12%'],['status','连接状态','14%'],['gidCount','gid 映射','12%'],['whitelist','组合白名单','14%'],['updated','最近更新','16%'],['_op','操作','8%']];
  }
  const filtered=adminFiltered(page.id);
  const rows=adminTabbed(page.id,filtered);
  const inner=`${adminTitle(page,rt)}${renderFilterBar(page,rt)}${renderMetrics(page,filtered)}${renderTabs(page,rt,filtered)}${renderBatch(page,rt)}${renderTable(page,rt,rows)}`;
  const drawer=rt.drawer?renderAdminDrawer(page,rt):'';
  return adminFrame(page,inner,{overlay:drawer});
}
function renderConfirmLayer(){
  const c=ADM.confirm;
  return `<div class="drawer-mask" style="z-index:500"><div class="drawer confirm"><div class="drawer-head"><div class="dt"><b>${esc(c.title||'确认操作')}</b><div class="dm">${esc(c.obj||'')}</div></div></div><div class="drawer-body"><div class="small">${esc(c.body||'')}</div>${c.note?`<div class="noticebar mt8"><div>${esc(c.note)}</div></div>`:''}</div><div class="drawer-foot"><button class="btn" data-act="adm-confirm-cancel">取消</button><button class="btn btn-primary" data-act="adm-confirm-ok">${esc(c.ok||'确认')}</button></div></div></div>`;
}

/* ===== drawers ===== */
function drawerShell(page, title, meta, body, actions){
  return `<div class="drawer-mask"><div class="drawer" data-component="${page.id}-C07"><div class="drawer-head"><div class="dt"><b>${esc(title)}</b><div class="dm">${esc(meta||'')}</div></div><div class="drawer-actions">${actions?actions.html:''}<button class="btn btn-sm" data-act="adm-close-drawer">关闭</button></div></div><div class="drawer-body">${body}</div></div></div>`;
}
function kv(rows){ return `<div class="kv">${rows.map(r=>`<div class="k">${esc(r[0])}</div><div>${r[1]}</div>`).join('')}</div>`; }
function timeline(items){
  if(!items||!items.length) return '<div class="empty-note">暂无操作记录</div>';
  return `<div class="timeline">${items.map(i=>`<div class="tl-item"><div class="strong">${esc(i.action||i.a)}</div><div class="tl-time">${esc(i.time||i.t)} · ${esc(i.actor||i.by||'系统')}</div>${i.before?`<div class="tl-before">前：${esc(i.before)} → 后：${esc(i.after||'')}</div>`:''}</div>`).join('')}</div>`;
}
function renderAdminDrawer(page,rt){
  const row=adminRows(page.id).find(r=>r.id===rt.drawerId);
  if(!row) return drawerShell(page,'记录不存在或无权访问',rt.drawerId,'<div class="emptystate"><div class="es-title">未找到该记录</div><div>不会回退到其他记录。请刷新列表或关闭。</div></div>',{html:''});
  const id=page.id;
  if(id==='ADM-ORDER-01') return orderDrawer(page,row);
  if(id==='ADM-PRODUCT-01') return productDrawer(page,row);
  if(id==='ADM-GIFT-01') return giftDrawer(page,row);
  if(id==='ADM-CODE-01') return codeDrawer(page,row);
  if(id==='ADM-REFUND-01') return refundDrawer(page,row);
  if(id==='ADM-PAYCHECK-01') return paycheckDrawer(page,row);
  if(id==='ADM-NOTIFY-01') return notifyDrawer(page,row);
  if(id==='ADM-AUDIT-01') return auditDrawer(page,row);
  if(id==='ADM-RBAC-01') return rbacDrawer(page,row);
  if(id==='ADM-SUPPLIER-01') return supplierDrawer(page,row);
  if(id==='ADM-STOCK-01') return stockDrawer(page,row);
  return drawerShell(page,page.name,row.id,kv(Object.keys(row).filter(k=>k!=='id').map(k=>[k,String(row[k]==null?'—':row[k])])),{html:''});
}
function orderDrawer(page,r){
  const body=`${kv([['订单号','<span class="mono">'+esc(r.no)+'</span>'],['来源平台',esc(r.platform)],['商城账号',esc(r.user)],['商品',esc(r.gname)],['实付',money(r.amount)],['支付状态',esc(r.pay)],['交付状态',esc(r.delivery)],['退款状态',esc(r.refund)],['下单时间',esc(r.created)],['供应商 gid',esc(r.gid)],['支付尝试',esc(r.attempt||'—')],['口令码',r.cdk?'<span class="mono">'+esc(r.cdk.slice(0,4)+'****'+r.cdk.slice(-2))+'</span>':'—']])}
    <div class="dgroup"><h4>成交快照</h4><div class="small muted">商品/价格/规格/协议版本来自订单创建时快照，运营改价不覆盖历史。</div></div>
    <div class="dgroup"><h4>操作记录</h4>${timeline([{action:'订单创建',time:r.created,actor:'system'},{action:r.pay==='已支付'?'支付确认':'支付尝试',time:r.created,actor:'支付渠道'},{action:r.delivery==='已交付'?'交付完成':'交付处理中',time:r.created,actor:'system'}])}</div>`;
  const actions={html:`${r.pay==='确认中'?'<button class="btn btn-sm" data-act="adm-goto-paycheck" data-no="'+r.no+'">支付核查</button>':''}`};
  return drawerShell(page,'订单详情',`${r.no} · ${r.platform}`,body,actions);
}
function productDrawer(page,r){
  const margin=r.price-r.cost; const invalid=r.price<Math.max(r.cost,r.lowest);
  const body=`<div class="form-grid">
    <div class="field full"><label>商城商品名</label><input class="input" data-fld="gname" value="${esc(r.gname)}"></div>
    <div class="field"><label>供应商 gid</label><input class="input" data-fld="gid" value="${esc(r.gid)}"></div>
    <div class="field"><label>供应商</label><input class="input" data-fld="supplier" value="${esc(r.supplier)}"></div>
    <div class="field"><label>供货价（分）</label><input class="input" type="number" data-fld="cost" value="${r.cost}"></div>
    <div class="field"><label>最低零售价（分）</label><input class="input" type="number" data-fld="lowest" value="${r.lowest}"></div>
    <div class="field"><label>零售价（分）</label><input class="input ${invalid?'err':''}" type="number" data-fld="price" value="${r.price}"></div>
    <div class="field"><label>毛利（按零售-供货）</label><div class="input" style="background:#f6f6f6">${money(margin)}</div></div>
    <div class="field full"><label>内容完整度</label><div class="small">${esc(r.content)} ${r.content!=='完整'?'<span class="tag tag-err">不可发布</span>':'<span class="tag tag-ok">完整</span>'}</div></div>
    <div class="field full"><label>选品/发布状态</label><div class="small">${esc(r.selectStatus)} / ${esc(r.publishStatus)} · 组合商品：${esc(r.combo)}</div></div>
  </div>${invalid?'<div class="noticebar error"><div class="nb-title">价格不合规</div><div>零售价必须 ≥ max(供货价, 最低零售价)。当前不能保存或发布。</div></div>':''}
  <div class="dgroup"><h4>素材与内容</h4><div class="small muted">主图/图集、介绍、Steam 限制与购买须知需审核后发布；删除素材需确认。</div></div>`;
  const actions={html:`${invalid?'':'<button class="btn btn-sm btn-primary" data-act="adm-save-product">保存</button>'}`};
  return drawerShell(page,'编辑商品',`${r.id} · ${r.gid}`,body,actions);
}
function giftDrawer(page,r){
  const body=`${kv([['批次号',esc(r.batch)],['订单号','<span class="mono">'+esc(r.no)+'</span>'],['商品',esc(r.gname)],['好友链接','<span class="mono">'+esc(r.link)+'</span>'],['付款时间',esc(r.paidAt)],['状态',esc(r.status)],['商城账号',esc(r.user)]])}
    <div class="dgroup"><h4>完成依据 / 异常备注</h4><textarea class="input" id="giftNote" placeholder="完成时必须填写核实依据；异常时填写原因"></textarea><div class="hint">导出批次不代表完成；运营核实好友收到游戏后才可标记完成。</div></div>
    <div class="dgroup"><h4>批次记录</h4>${timeline([{action:'导出批次',time:r.paidAt,actor:'ops01'},{action:r.status==='已完成'?'完成确认':'待处理',time:r.paidAt,actor:'ops01'}])}</div>`;
  const actions={html:`${r.status==='待处理'?'<button class="btn btn-sm" data-act="adm-gift-start-drawer">开始处理</button>':''}${r.status==='处理中'?'<button class="btn btn-sm btn-primary" data-act="adm-gift-done-drawer">完成</button>':''}`};
  return drawerShell(page,'赠送订单',`${r.no} · ${r.status}`,body,actions);
}
function codeDrawer(page,r){
  const body=`${kv([['订单号','<span class="mono">'+esc(r.no)+'</span>'],['供应商 gid',esc(r.gid)],['请求 orderid','<span class="mono">'+esc(r.reqid)+'</span>'],['供应商 buyorderid','<span class="mono">'+esc(r.buyid)+'</span>'],['交付状态',esc(r.status)],['重试次数',String(r.retry)],['24 小时截止',esc(r.deadline)],['错误码',esc(r.errcode||'—')],['当前口令码',r.cdk?'<span class="mono">'+esc(r.cdk.slice(0,5)+'****')+'</span>':'—']])}
    <div class="dgroup"><h4>补发 / 换码</h4><div class="field"><label>原因</label><input class="input" id="codeReason" placeholder="如：用户反馈口令码无法激活"></div><div class="field"><label>替代口令码</label><input class="input" id="codeNew" placeholder="录入供应商返回的新码"></div><div class="hint">补发/换码需关联原订单与新交付记录；旧码是否失效以供应商结果为准。</div></div>
    <div class="dgroup"><h4>审计</h4>${timeline([{action:'自动取码',time:'2026-10-27 09:12',actor:'system'},{action:'重试 '+r.retry+' 次',time:'2026-10-27 10:00',actor:'ops01'}])}</div>`;
  const actions={html:`${r.status==='交付异常'?'<button class="btn btn-sm" data-act="adm-code-retry-drawer">重试</button>':''}<button class="btn btn-sm btn-primary" data-act="adm-code-reissue">提交补发</button>`};
  return drawerShell(page,'口令码交付',`${r.no} · ${r.status}`,body,actions);
}
function refundDrawer(page,r){
  const body=`${kv([['退款单号','<span class="mono">'+esc(r.no)+'</span>'],['订单号','<span class="mono">'+esc(r.order)+'</span>'],['类型',esc(r.type)],['金额',money(r.amount)],['状态',esc(r.status)],['原因',esc(r.reason)],['操作人',esc(r.op)],['处理说明',esc(r.task)]])}
    <div class="dgroup"><h4>支付流水与退款结果</h4><div class="small muted">退款成功以支付渠道资金结果为准；失败可重试，必须复用原退款任务标识，避免重复退款。</div></div>
    <div class="dgroup"><h4>操作记录</h4>${timeline([{action:'退款任务创建',time:'2026-10-27 10:00',actor:'system'},{action:r.status==='失败'?'退款失败':'退款处理',time:'2026-10-27 11:00',actor:r.op}])}</div>`;
  const actions={html:`${r.status==='失败'?'<button class="btn btn-sm" data-act="adm-refund-retry-drawer">重试</button>':''}`};
  return drawerShell(page,'退款详情',`${r.no} · ${r.status}`,body,actions);
}
function paycheckDrawer(page,r){
  const body=`${kv([['订单号','<span class="mono">'+esc(r.no)+'</span>'],['发起时间',esc(r.created)],['渠道',esc(r.channel)],['最后一次查询',esc(r.last)],['查询结果',esc(r.result)],['核查状态',esc(r.status)],['支付尝试',esc(r.attempt)]])}
    <div class="dgroup"><h4>核查证据（必选）</h4><select class="input" id="payEvidence"><option value="">请选择渠道证据</option><option value="paid">渠道流水确认已支付</option><option value="unpaid">渠道流水确认未支付</option><option value="unknown">渠道仍无法确认</option></select><div class="hint">只有渠道查询结果或可信支付凭证可以改变订单支付状态；用户口述、聊天记录和前端参数不能作为依据。</div></div>
    <div class="dgroup"><h4>核查记录</h4>${timeline([{action:'进入核查队列',time:r.created,actor:'system'},{action:'最近查询：'+r.result,time:r.last,actor:'finance01'}])}</div>`;
  const actions={html:`<button class="btn btn-sm" data-act="adm-paycheck-decide" data-v="paid">确认已支付</button><button class="btn btn-sm" data-act="adm-paycheck-decide" data-v="unpaid">确认未支付</button>`};
  return drawerShell(page,'支付核查',`${r.no} · ${r.status}`,body,actions);
}
function notifyDrawer(page,r){
  const body=`${kv([['事件',esc(r.event)],['订单号','<span class="mono">'+esc(r.no)+'</span>'],['平台',esc(r.platform)],['状态',esc(r.status)],['重试次数',String(r.retry)],['最后处理',esc(r.last)],['失败原因',esc(r.reason||'—')],['模板版本','v1.2'],['平台消息号',r.status==='平台已受理'?'MSG-'+r.id.toUpperCase():'—']])}
    <div class="dgroup"><h4>重试约束</h4><div class="small muted">已退款或交付内容已被替换时不发送过时成功文案；同一订单同一事件只创建一个任务。</div></div>`;
  const actions={html:`<button class="btn btn-sm" data-act="adm-notify-retry-drawer">授权重试</button>`};
  return drawerShell(page,'通知任务',`${r.id} · ${r.event}`,body,actions);
}
function auditDrawer(page,r){
  const body=`${kv([['时间',esc(r.time)],['操作人',esc(r.actor)],['动作',esc(r.action)],['对象',esc(r.obj)],['分类',esc(r.type)]])}<div class="dgroup"><h4>前后值</h4><div class="small">前：<span class="mono">${esc(r.before)}</span></div><div class="small">后：<span class="mono">${esc(r.after)}</span></div></div><div class="dgroup"><h4>说明</h4><div class="small muted">记录只追加，不修改历史；敏感字段按权限脱敏。</div></div>`;
  return drawerShell(page,'操作记录',`${r.actor} · ${r.time}`,body,{html:''});
}
function rbacDrawer(page,r){
  const matrix=[['首页配置编辑','可','可','不可','不可'],['首页配置发布','可','需授权','不可','不可'],['商品选品/编辑/改价/上下架','可','需授权','不可','不可'],['订单查询','可','可','可','可'],['订单导出','可','需授权','需授权','需授权'],['查看完整口令码','可','需授权','需授权','不可'],['人工补发/换码','可','需授权','不可','不可'],['退款审核','可','需授权','不可','需授权'],['退款执行','可','不可','不可','需授权'],['单人退款（审核+执行）','可','需专项授权','不可','需专项授权'],['协议发布','可','需授权','不可','不可'],['支付核查','可','需授权','不可','需授权'],['权限配置','可','不可','不可','不可']];
  const body=`<div class="small muted mb8">当前账号 ${esc(r.account)} · 角色 ${esc(r.role)} · 数据范围 ${esc(r.scope)}</div><table class="matrix"><thead><tr><th>动作</th><th>管理员</th><th>运营</th><th>客服</th><th>财务</th></tr></thead><tbody>${matrix.map(m=>`<tr><td>${m[0]}</td>${m.slice(1).map((v,i)=>{const role=['管理员','运营','客服','财务'][i];const dis=(role==='客服'||role==='财务')&&m[0].includes('权限')?' disabled':'';return `<td><label style="display:inline-flex;gap:4px;align-items:center"><input type="checkbox" data-perm="${role}" ${v==='可'?'checked':''} ${dis}>${v}</label></td>`;}).join('')}</tr>`).join('')}</tbody></table>
    <div class="dgroup"><label class="checkrow"><input type="checkbox" id="singleRefund"> <span>允许单人退款（审核＋执行同一人）</span></label><div class="hint">必须由管理员显式开启并留痕；系统自动退款闭集不受此开关影响。</div></div>`;
  return drawerShell(page,'配置权限',`${r.account} · ${r.role}`,body,{html:'<button class="btn btn-sm btn-primary" data-act="adm-save-rbac">保存</button>'});
}
function supplierDrawer(page,r){
  const body=`<div class="form-grid"><div class="field full"><label>供应商平台</label><input class="input" value="Higame（直销商/商户）" readonly></div><div class="field"><label>APPID</label><input class="input" value="1003" readonly></div><div class="field"><label>APPKEY</label><input class="input" type="password" value="********" readonly></div><div class="field"><label>accesstoken</label><input class="input" type="password" value="********" readonly></div><div class="field"><label>主域名</label><input class="input" value="gameapi.higame.hk" readonly></div></div><div class="noticebar">敏感配置仅管理员可见；所有供应商调用由服务端发起，H5 不持有密钥。</div><div class="dgroup"><h4>组合商品白名单</h4><div class="small muted">首期仅人工确认非组合商品可上架；ProductList/ProductInfo 不返回 gclassType。</div><div class="mt8"><span class="search-pill">p01 影之刃零</span><span class="search-pill">p04 黑神话：悟空</span><span class="search-pill">p05 双人成行</span></div></div>`;
  return drawerShell(page,'供应商配置',r.name,body,{html:'<button class="btn btn-sm" data-act="adm-test-supplier">测试连接</button>'});
}
function stockDrawer(page,r){
  const body=`${kv([['商品',esc(r.gname)],['gid',esc(r.gid)],['缓存库存',r.stock==null?'未知':String(r.stock)],['同步时间',esc(r.synced)],['新鲜度',esc(r.fresh)],['可售状态',esc(r.sale)]])}<div class="dgroup"><h4>说明</h4><div class="small muted">库存为供应商缓存，商城不维护自有库存；新鲜且为 0 才判售罄，过期/未知允许下单但提示以付款后结果为准。</div></div>`;
  return drawerShell(page,'库存详情',r.gname,body,{html:''});
}

/* ===== config pages ===== */
function renderAdminConfig(page,rt){
  if(page.id==='ADM-HOME-01') return renderHomeConfig(page,rt);
  if(page.id==='ADM-SERVICE-01') return renderServiceConfig(page,rt);
  if(page.id==='ADM-AGREEMENT-01') return renderAgreementConfig(page,rt);
  if(page.id==='ADM-SEARCHCFG-01') return renderSearchConfig(page,rt);
  if(page.id==='ADM-WALLET-01') return renderWalletConfig(page,rt);
  return adminFrame(page,adminTitle(page,rt)+'<div class="empty-note">未实现配置页</div>');
}
function configActions(page, rt, actions){
  return `<div class="m-row-between mb12"><div class="small muted">配置版本：${esc(ADM_DATA.home.version)} · 已发布 ${esc(ADM_DATA.home.published)}</div><div class="m-row">${actions}</div></div>`;
}
function renderHomeConfig(page,rt){
  const h=ADM_DATA.home;
  const banners=h.banners.map((b,i)=>`<div class="list-row"><div class="thumb">广告占位</div><div class="grow"><div class="strong">${esc(b.name)}</div><div class="small muted">跳转：${esc(b.target)} · ${b.enabled?'已启用':'已停用'}</div></div><div class="actions"><button class="btn btn-sm" data-act="home-up" data-i="${i}" ${i===0?'disabled':''}>上移</button><button class="btn btn-sm" data-act="home-down" data-i="${i}" ${i===h.banners.length-1?'disabled':''}>下移</button><button class="btn btn-sm" data-act="home-toggle" data-i="${i}">${b.enabled?'停用':'启用'}</button><button class="btn btn-sm" data-act="home-del" data-i="${i}" data-confirm="删除广告位后需重新发布才能影响前台。">删除</button></div></div>`).join('');
  const rec=h.recommended.map(id=>product(id)).map(p=>`<span class="search-pill">${esc(p.name)} ${money(p.price)} <button class="linkbtn" data-act="home-remove-rec" data-id="${p.id}" style="min-height:auto">移除</button></span>`).join('');
  const body=`${adminTitle(page,rt)}<div class="web-panel" data-component="ADM-HOME-01-C12">${configActions(page,rt,`<button class="btn btn-sm" data-act="home-preview">预览</button><button class="btn btn-sm" data-act="home-save-draft">保存草稿</button><button class="btn btn-sm btn-primary" data-act="home-publish" data-confirm="发布后三入口同时生效，并保留版本记录。">发布</button>`)}
    <h4 class="mb8">广告位</h4>${banners||'<div class="empty-note">暂无广告，前台将隐藏该区块。</div>'}
    <div class="dgroup"><h4>推荐商品</h4><div class="small muted mb8">只能从已发布商品中选择；未发布/组合/下架商品不出现。</div><div>${rec||'<div class="empty-note">尚未选择推荐商品</div>'}</div><div class="mt8"><button class="btn btn-sm" data-act="home-add-rec">添加推荐商品</button></div></div>
    <div class="dgroup"><div class="small muted">草稿保存不改变前台；发布成功后记录版本、发布人与时间。</div></div>
    </div>`;
  return adminFrame(page,body);
}
function renderServiceConfig(page,rt){
  const s=ADM_DATA.service;
  const body=`${adminTitle(page,rt)}<div class="web-panel" style="max-width:720px" data-component="ADM-SERVICE-01-C12">${configActions(page,rt,`<button class="btn btn-sm" data-act="service-reset">重置</button><button class="btn btn-sm btn-primary" data-act="service-save">保存</button>`)}
    <div class="field"><label>企业微信客服号</label><input class="input" id="svcId" value="${esc(s.wecomId)}"></div>
    <div class="field"><label>可用链接（可空）</label><input class="input" id="svcLink" value="${esc(s.link)}"></div>
    <div class="field"><label>引导文案</label><textarea class="input" id="svcGuide">${esc(s.guide)}</textarea></div>
    <div class="field"><label>服务时间</label><input class="input" id="svcHours" value="${esc(s.hours)}"></div>
    <div class="noticebar"><div>保存即生效并记录操作人；服务时间未确认时前台不展示承诺。</div></div>
    <div class="small muted mt8">最近更新：${esc(s.updated)}</div></div>`;
  return adminFrame(page,body);
}
function renderAgreementConfig(page,rt){
  const a=ADM_DATA.agreement;
  const body=`${adminTitle(page,rt)}<div class="web-panel" style="max-width:820px" data-component="ADM-AGREEMENT-01-C12">${configActions(page,rt,`<button class="btn btn-sm" data-act="agr-preview">预览</button><button class="btn btn-sm btn-primary" data-act="agr-publish" data-confirm="发布后生成新版本；若标记实质性变更，旧未支付单继续支付前需重新同意。">发布</button>`)}
    <div class="field"><label>协议版本</label><input class="input" id="agrVersion" value="${esc(a.version)}"></div>
    <div class="field"><label>协议正文</label><textarea class="input" id="agrBody" style="min-height:180px">${esc(a.body)}</textarea></div>
    <div class="checkrow"><input type="checkbox" id="agrMaterial" ${a.materialChange?'checked':''}><label for="agrMaterial">本次为实质性变更（如退款原则、交付方式、用户权利发生实质变化）</label></div>
    <div class="noticebar"><div>实质性变更的判定标准由业务/法务确认；普通更新不强制旧未支付单重新同意。</div></div>
    <div class="dgroup"><h4>版本记录</h4><table class="matrix"><thead><tr><th>版本</th><th>发布时间</th><th>实质性变更</th></tr></thead><tbody>${a.history.map(v=>`<tr><td>${esc(v.v)}</td><td>${esc(v.date)}</td><td>${esc(v.material)}</td></tr>`).join('')}</tbody></table></div></div>`;
  return adminFrame(page,body);
}
function renderSearchConfig(page,rt){
  const kws=ADM_DATA.keywords.map((k,i)=>`<div class="list-row"><div class="grow"><div class="strong">${esc(k.name)}</div><div class="small muted">排序 ${k.order} · ${k.enabled?'已启用':'已停用'}</div></div><div class="actions"><button class="btn btn-sm" data-act="kw-up" data-i="${i}" ${i===0?'disabled':''}>上移</button><button class="btn btn-sm" data-act="kw-down" data-i="${i}" ${i===ADM_DATA.keywords.length-1?'disabled':''}>下移</button><button class="btn btn-sm" data-act="kw-toggle" data-i="${i}">${k.enabled?'停用':'启用'}</button><button class="btn btn-sm" data-act="kw-del" data-i="${i}" data-confirm="删除关键词后前台搜索发现区块不再展示该项。">删除</button></div></div>`).join('');
  const hots=ADM_DATA.hotProducts.map((h,i)=>`<div class="list-row"><div class="thumb">图片</div><div class="grow"><div class="strong">${esc(h.name)}</div><div class="small muted">${money(h.price)} · 排序 ${h.order} · ${h.enabled?'已启用':'已停用'}</div></div><div class="actions"><button class="btn btn-sm" data-act="hot-up" data-i="${i}" ${i===0?'disabled':''}>上移</button><button class="btn btn-sm" data-act="hot-toggle" data-i="${i}">${h.enabled?'停用':'启用'}</button><button class="btn btn-sm" data-act="hot-del" data-i="${i}" data-confirm="删除热门商品后前台不再展示；不会影响商品本身。">删除</button></div></div>`).join('');
  const body=`${adminTitle(page,rt)}<div class="web-panel" data-component="ADM-SEARCHCFG-01-C12">${configActions(page,rt,`<button class="btn btn-sm btn-primary" data-act="search-save">保存</button>`)}
    <div class="dgroup" data-component="ADM-SEARCHCFG-01-C15">
      <h4 class="mb8">搜索发现关键词</h4>
      ${kws||'<div class="empty-note">暂无关键词</div>'}
      <div class="mt8 m-row"><input class="input" id="newKw" placeholder="新增关键词" style="max-width:240px"><button class="btn btn-sm" data-act="kw-add">新增</button></div>
      <hr class="hr">
      <h4 class="mb8">热门商品</h4>
      ${hots||'<div class="empty-note">暂无热门商品</div>'}
      <div class="mt8" data-component="ADM-SEARCHCFG-01-C20"><button class="btn btn-sm" data-act="hot-add">从已发布商品选择</button></div>
    </div>
    <div class="dgroup"><div class="small muted">排序/启停保存即生效；热门商品只能从已发布商品中选择，不按销量自动计算。</div></div>
  </div>`;
  return adminFrame(page,body);
}
function renderWalletConfig(page,rt){
  if(RV.state==='LOADING'||RV.state==='EMPTY'||RV.state==='ERROR') return adminFrame(page,adminTitle(page,rt)+stateBlock(page,RV.state));
  const w=ADM_DATA.wallet;
  const rows=ADM_DATA.stock.map(r=>`<tr><td>${esc(r.gname)}</td><td>${esc(r.gid)}</td><td>${money(product(r.gname==='影之刃零'?25800:r.gname==='艾尔登法环'?29800:9800))}</td><td>${esc(r.fresh)}</td><td>${esc(r.sale)}</td><td>${esc(r.synced)}</td></tr>`).join('');
  const body=`${adminTitle(page,rt)}<div class="metrics"><div class="metric"><div class="mname">总金额</div><div class="mval">¥${w.total.toFixed(2)}</div><div class="mnote">供应商钱包快照</div></div><div class="metric"><div class="mname">可用金额</div><div class="mval">¥${w.available.toFixed(2)}</div><div class="mnote">低于阈值将预警</div></div><div class="metric"><div class="mname">冻结金额</div><div class="mval">¥${w.frozen.toFixed(2)}</div><div class="mnote">供应商返回</div></div><div class="metric"><div class="mname">最近查询</div><div class="mval" style="font-size:13px">${esc(w.queried)}</div><div class="mnote">数据新鲜度</div></div></div>
    <div class="web-panel mt12" data-component="ADM-WALLET-01-C12"><h4 class="mb8">预警阈值</h4><div class="m-row"><input class="input" id="walletThreshold" type="number" value="${w.threshold}" style="max-width:180px"><span class="small muted">元</span><button class="btn btn-sm btn-primary" data-act="wallet-save">保存阈值</button></div><div class="small muted mt4">阈值与安全垫由运营设置；余额不足或查询失败时停止新的口令码订单，好友赠送不受影响。</div></div>
    <div class="web-panel mt12"><h4 class="mb8">受影响商品</h4><table class="grid" style="border:1px solid var(--line)"><thead><tr><th>商品</th><th>gid</th><th>售价</th><th>库存新鲜度</th><th>销售状态</th><th>最近处理</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  return adminFrame(page,body);
}

/* ===== admin actions ===== */
function admSetMsg(pageId, text, kind){
  const rt=admRt(pageId); rt.msg=text; rt.msgKind=kind||'ok';
  later(()=>{ rt.msg=''; }, 3000);
}
function admRender(){ renderAll(); }
function admAsync(fn){
  const page=pageOf(RV.pageId); const rt=admRt(page.id);
  rt.loading=true; RV.state='LOADING'; admRender();
  later(()=>{ rt.loading=false; RV.state='RESULTS'; fn(); admRender(); }, 260);
}
function admQuery(pageId){
  const rt=admRt(pageId);
  qa('[data-flt]').forEach(n=>{ rt.draft[n.dataset.flt]=n.value; });
  rt.committed={...rt.draft}; rt.page=1; rt.sel=[];
  admAsync(()=>{ admSetMsg(pageId,'查询完成，已按当前筛选返回结果'); });
}
function admReset(pageId){
  const rt=admRt(pageId); rt.draft={}; rt.committed={}; rt.page=1; rt.sel=[]; rt.tab=(pageOf(pageId).cfg.tabs||[''])[0];
  admAsync(()=>{ admSetMsg(pageId,'已重置筛选与页码'); });
}
function admRefresh(pageId){
  const rt=admRt(pageId); rt.sel=[]; admAsync(()=>{ admSetMsg(pageId,'已刷新，保留已提交筛选'); });
}
function admTab(pageId, tab){
  const rt=admRt(pageId); rt.tab=tab; rt.page=1; rt.sel=[]; admAsync(()=>{ admSetMsg(pageId,'已切换页签：'+tab); });
}
function admPage(pageId, p){
  const rt=admRt(pageId); const total=adminTabbed(pageId,adminFiltered(pageId)).length; const max=Math.max(1,Math.ceil(total/rt.size));
  if(p<1||p>max) return; rt.page=p; rt.sel=[]; admRender();
}
function admRowact(pageId, id, rn){
  const rt=admRt(pageId); rt.drawerId=id; rt.drawer=rn||'查看'; admRender();
}
function admCloseDrawer(pageId){ const rt=admRt(pageId); rt.drawer=null; rt.drawerId=''; admRender(); }
function admConfirm(action, ds){
  const map={
    publish:{title:'发布该商品？',body:'发布后商品将进入前台首页、搜索和详情，可被用户购买。',ok:'发布'},
    unpublish:{title:'下架该商品？',body:'下架后前台停止新购，历史订单仍可查看和交付。',ok:'下架'},
    'code-retry':{title:'重试取码？',body:'将复用原 orderid 向供应商重新请求；不会换新单号，也不会重复扣款。',ok:'重试'},
    'refund-approve':{title:'审核通过该退款？',body:'审核通过后进入执行；请确认退款原因、金额和是否已履约。',ok:'审核通过'},
    'refund-exec':{title:'执行退款？',body:'将按原支付渠道发起退款，成功以资金结果为准。',ok:'执行退款'},
    'refund-retry':{title:'重试退款？',body:'将复用原退款任务标识重试，避免重复退款。',ok:'重试'},
    'notify-retry':{title:'授权重试通知？',body:'重试前会校验订单与内容；已退款或内容已替换时不发送旧文案。',ok:'重试通知'},
    'home-del':{title:'删除该广告？',body:'删除后需发布才会影响前台；取消不会改变任何数据。',ok:'删除'},
    'kw-del':{title:'删除该关键词？',body:'删除后保存即生效，前台搜索发现区块不再展示该项。',ok:'删除'},
    'hot-del':{title:'删除该热门商品？',body:'删除后保存即生效，不影响商品本身。',ok:'删除'},
    'home-publish':{title:'发布首页配置？',body:'发布后对三入口同时生效，并保留版本、发布人和时间。',ok:'发布'},
    'agr-publish':{title:'发布购买协议？',body:'发布后生成新版本；实质性变更需旧未支付单继续支付前重新同意。',ok:'发布'}
  };
  const m=map[action]||{title:'确认执行？',body:'该操作可能影响业务数据。',ok:'确认'};
  ADM.confirm={action,ds:ds||{},title:m.title,body:m.body,ok:m.ok};
  admRender();
}
function admDoRow(pageId, id, action){
  const row=adminRows(pageId).find(r=>r.id===id); if(!row) return;
  if(action==='publish'){
    if(row.combo==='是'){ admSetMsg(pageId,'组合商品不进可售列表，不能发布','err'); admRender(); return; }
    if(row.content!=='完整'){ admSetMsg(pageId,'内容不完整，不能发布','err'); admRender(); return; }
    row.publishStatus='已发布'; row.tab='已发布'; admSetMsg(pageId,'商品已发布：'+row.gname);
  } else if(action==='unpublish'){
    row.publishStatus='已下架'; row.tab='已下架'; admSetMsg(pageId,'商品已下架：'+row.gname);
  } else if(action==='gift-start'){
    row.status='处理中'; row.tab='处理中'; admSetMsg(pageId,'已开始处理：'+row.no);
  } else if(action==='gift-exception'){
    row.status='处理异常'; row.tab='异常'; admSetMsg(pageId,'已记录异常：'+row.no,'err');
  } else if(action==='code-retry'){
    row.retry++; row.status='发码中'; row.tab='发码中'; admSetMsg(pageId,'已用原 orderid 重试取码（模拟）');
  } else if(action==='refund-approve'){
    row.status='待执行'; row.tab='待执行'; admSetMsg(pageId,'退款已审核通过，等待执行');
  } else if(action==='refund-exec'){
    row.status='退款中'; row.tab='退款中'; admSetMsg(pageId,'已发起退款（模拟），成功以资金结果为准');
  } else if(action==='refund-retry'){
    row.status='退款中'; row.tab='退款中'; admSetMsg(pageId,'已复用原任务重试退款（模拟）');
  } else if(action==='notify-retry'){
    if(row.event==='退款发起'&&ADM_DATA.refund.some(x=>x.order===row.no&&x.status==='成功')){ admSetMsg(pageId,'该订单已退款成功，不发送过时成功文案','err'); admRender(); return; }
    row.retry++; row.status='平台已受理'; row.tab='平台已受理'; admSetMsg(pageId,'已授权重试通知（模拟）');
  }
  ADM.confirm=null; admRender();
}
function admConfirmOk(){
  const c=ADM.confirm; if(!c) return;
  ADM.confirm=null;
  if(c.action==='home-del'){ ADM_DATA.home.banners.splice(Number(c.ds.i),1); admSetMsg(RV.pageId,'已删除广告位'); admRender(); return; }
  if(c.action==='kw-del'){ ADM_DATA.keywords.splice(Number(c.ds.i),1); admSetMsg(RV.pageId,'已删除关键词'); admRender(); return; }
  if(c.action==='hot-del'){ ADM_DATA.hotProducts.splice(Number(c.ds.i),1); admSetMsg(RV.pageId,'已删除热门商品'); admRender(); return; }
  if(c.action==='home-publish'){ ADM_DATA.home.version='v'+(Number(ADM_DATA.home.version.slice(1))+1); ADM_DATA.home.published=nowStr(); admSetMsg(RV.pageId,'首页配置已发布：'+ADM_DATA.home.version); admRender(); return; }
  if(c.action==='agr-publish'){ publishAgreement(); return; }
  admDoRow(RV.pageId,c.ds.rowid,c.action);
}

/* ===== config actions, global dispatcher, boot ===== */
function publishAgreement(){
  const a=ADM_DATA.agreement;
  const v=(q('#agrVersion')&&q('#agrVersion').value.trim())||a.version;
  const body=(q('#agrBody')&&q('#agrBody').value.trim())||a.body;
  const material=!!(q('#agrMaterial')&&q('#agrMaterial').checked);
  if(!body){ admSetMsg('ADM-AGREEMENT-01','协议正文不能为空','err'); admRender(); return; }
  a.version=v; a.body=body; a.materialChange=material; a.published=nowStr();
  a.history.unshift({v:v,date:nowStr().slice(0,10),material:material?'是':'否'});
  ADM.confirm=null; admSetMsg('ADM-AGREEMENT-01','协议已发布：'+v+(material?'（实质性变更）':''));
  admRender();
}
function previewOverlay(title, body){
  ADM.overlay=`<div class="drawer-mask" style="z-index:450"><div class="drawer normal"><div class="drawer-head"><div class="dt"><b>${esc(title)}</b><div class="dm">预览不改变生效版本</div></div><div class="drawer-actions"><button class="btn btn-sm" data-act="adm-close-overlay">关闭</button></div></div><div class="drawer-body">${body}</div></div></div>`;
}
function closeOverlay(){ ADM.overlay=''; admRender(); }
function copyText(text){
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text); return true; }
  }catch(e){}
  try{ const t=document.createElement('textarea'); t.value=text; t.style.position='fixed'; t.style.opacity='0'; document.body.appendChild(t); t.select(); const ok=document.execCommand('copy'); t.remove(); return ok; }catch(e){ return false; }
}
function downloadCsv(filename, rows, cols){
  const head=cols.map(c=>c[1]).join(',');
  const body=rows.map(r=>cols.map(c=>{ let v=r[c[0]]; if(v==null) v=''; return '"'+String(v).replace(/"/g,'""')+'"'; }).join(',')).join('\n');
  const blob=new Blob(['﻿'+head+'\n'+body],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click();
  later(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000);
}
function currentAdminRowsForExport(){
  const page=pageOf(RV.pageId); const rows=adminTabbed(page.id,adminFiltered(page.id));
  const rt=admRt(page.id); return rt.sel.length?rows.filter(r=>rt.sel.includes(r.id)):rows;
}
function addAudit(action,obj,before,after,type){
  ADM_DATA.audit.unshift({id:'a'+(Date.now()%100000),time:nowStr(),actor:'admin',action,obj,before,after,type});
}

function handleAction(act, el){
  const ds=el.dataset||{};
  /* ---------- shell / nav ---------- */
  if(act==='back'){ back(); return; }
  if(act==='go-search'){ if(RV.end==='H5') go('H5-SEARCH-01','DEFAULT'); else go('WEB-SEARCH-01','DEFAULT'); return; }
  if(act==='go-service'){ go(RV.end==='H5'?'H5-SERVICE-01':'WEB-SERVICE-01', S.currentOrder?'WITH_ORDER':'NO_ORDER'); return; }
  if(act==='go-auth'){ go(RV.end==='H5'?'H5-AUTH-01':'WEB-AUTH-01', !S.account?'LOGIN':S.realName==='verified'?'VERIFIED':S.realName==='minor'?'MINOR':'UNVERIFIED'); return; }
  if(act==='go-phone'){ go(RV.end==='H5'?'H5-PHONE-01':'WEB-PHONE-01','DEFAULT'); return; }
  if(act==='go-orders'){ if(!S.account){ go(RV.end==='H5'?'H5-AUTH-01':'WEB-AUTH-01','LOGIN'); } else go(RV.end==='H5'?'H5-ORDERS-01':'WEB-ORDERS-01','RESULTS'); return; }
  if(act==='tab-home'){ go(RV.end==='H5'?'H5-HOME-01':'WEB-HOME-01','DEFAULT'); return; }
  if(act==='tab-profile'){ go(RV.end==='H5'?'H5-PROFILE-01':'WEB-PROFILE-01', S.account?'LOGGED_IN':'GUEST'); return; }
  if(act==='tab-orders'){ if(!S.account){ go(RV.end==='H5'?'H5-AUTH-01':'WEB-AUTH-01','LOGIN'); } else go(RV.end==='H5'?'H5-ORDERS-01':'WEB-ORDERS-01','RESULTS'); return; }
  if(act==='web-home'){ go('WEB-HOME-01','DEFAULT'); return; }
  if(act==='retry'){ renderAll(); flash('已按当前条件重试'); return; }
  if(act==='open-reader'){ openReader(Number(ds.index)); return; }
  if(act==='open-diagram'){ openDiagram(Number(ds.index)); return; }
  if(act==='reader-close'){ closeReader(); return; }
  if(act==='reader-download'){ downloadDoc(); return; }
  if(act==='reader-switch'){ switchReader(Number(ds.index)); return; }
  if(act==='reader-back'){ readerBack(); return; }
  if(act==='reader-jump'){ const t=document.querySelector('#'+CSS.escape(ds.target)); if(t) t.scrollIntoView({block:'start'}); return; }
  if(act==='diagram-close'){ closeDiagram(); return; }
  if(act==='diagram-zoom'){ RV.diagramZoom=ds.z; applyDiagramZoom(); return; }
  if(act==='diagram-src'){ RV.diagramSrc=!RV.diagramSrc; const s=q('#diagramSrc'); if(s) s.hidden=!RV.diagramSrc; return; }
  /* ---------- client ---------- */
  if(act==='open-product'){ openProduct(ds.id); return; }
  if(act==='buy-open'){ buyOpen(ds.id); return; }
  if(act==='buy-close'){ go(RV.end==='H5'?'H5-PRODUCT-01':'WEB-PRODUCT-01','DEFAULT'); return; }
  if(act==='buy-submit'){ buySubmit(); return; }
  if(act==='spec-select'){ if(S.buy){ S.buy.specId=ds.id; S.buy.error=''; } renderAll(); return; }
  if(act==='pay-method'){ if(S.buy){ S.buy.payMethod=ds.m; } renderAll(); return; }
  if(act==='agreement-check'){ S.agreementChecked=!!el.checked; if(S.buy) S.buy.agreementChecked=el.checked; return; }
  if(act==='go-agreement'){ go(RV.end==='H5'?'H5-AGREEMENT-01':'WEB-AGREEMENT-01','DEFAULT'); return; }
  if(act==='notice-agree'){ S.agreementChecked=true; if(S.buy){ S.buy.agreementChecked=true; S.buy.showNotice=false; } buySubmit(); return; }
  if(act==='notice-close'){ if(S.buy) S.buy.showNotice=false; renderAll(); return; }
  if(act==='orders-tab'){ S.ordersTab=ds.tab; renderAll(); return; }
  if(act==='checkout-pay'){ go(RV.end==='H5'?'H5-PAY-01':'WEB-PAY-01','READY'); return; }
  if(act==='pay-paid'){ payQuery('paid'); return; }
  if(act==='pay-problem'){ go(RV.end==='H5'?'H5-CHECKOUT-01':'WEB-CHECKOUT-01','DEFAULT'); return; }
  if(act==='pay-answer'){ payQuery(ds.a); return; }
  if(act==='pay-requery'){ payQuery('none'); return; }
  if(act==='go-checkout'){ go(RV.end==='H5'?'H5-CHECKOUT-01':'WEB-CHECKOUT-01','DEFAULT'); return; }
  if(act==='go-result'){ go(RV.end==='H5'?'H5-RESULT-01':'WEB-RESULT-01', resultState()); return; }
  if(act==='continue-pay'){ const o=orderById(ds.id); if(o){ S.currentOrder=o; go(RV.end==='H5'?'H5-CHECKOUT-01':'WEB-CHECKOUT-01','DEFAULT'); } return; }
  if(act==='query-order'){ const o=orderById(ds.id); if(o){ S.currentOrder=o; go(RV.end==='H5'?'H5-PAYRET-01':'WEB-PAYRET-01','QUERYING'); later(resolvePay,550); } return; }
  if(act==='view-order'){ viewOrder(ds.id); return; }
  if(act==='recover-order'){ recoverOrder(ds.id); return; }
  if(act==='copy-order'){ const o=orderById(ds.id)||S.currentOrder; if(o&&copyText(o.no)) toast('订单号已复制'); else toast('复制失败，请手动选择文本','err'); return; }
  if(act==='copy-cdk'){ const o=orderById(ds.id)||S.currentOrder; if(o&&o.cdk&&copyText(o.cdk)) toast('口令码已复制'); else toast('口令码不可用','err'); return; }
  if(act==='copy-service'){ if(copyText('mall-service')) toast('客服号已复制'); else toast('复制失败','err'); return; }
  if(act==='refresh-result'){ renderAll(); toast('已刷新交付状态'); return; }
  if(act==='auth-close'){ const t=S.authReturn; if(t){ go(t.page,t.state); } else go(RV.end==='H5'?'H5-PRODUCT-01':'WEB-PRODUCT-01','DEFAULT'); return; }
  if(act==='auth-login'){
    S.account='u1001'; S.nickname='玩家小陈';
    const t=S.authReturn; if(t){ go(t.page,t.state); later(()=>buySubmit(),250); } else go(RV.end==='H5'?'H5-PROFILE-01':'WEB-PROFILE-01','LOGGED_IN');
    return;
  }
  if(act==='auth-verify'){
    RV.state='LAUNCHING'; renderAll();
    later(()=>{ if(RV.sim==='fail'){ S.realName='unverified'; S.adult=false; } else if(RV.sim==='timeout'){ S.realName='unknown'; S.adult=false; } else { S.realName='verified'; S.adult=true; } if(S.authReturn){ go(S.authReturn.page,S.authReturn.state); later(()=>buySubmit(),250); } else go(RV.end==='H5'?'H5-PROFILE-01':'WEB-PROFILE-01','LOGGED_IN'); },650);
    return;
  }
  if(act==='auth-retry'){ RV.state='LAUNCHING'; renderAll(); later(()=>{ if(RV.sim==='ok'){ S.realName='verified'; S.adult=true; } else { S.realName='unknown'; } if(S.authReturn){ go(S.authReturn.page,S.authReturn.state); later(()=>buySubmit(),250); } },550); return; }
  if(act==='phone-close'){ const t=S.buy?{page:RV.end==='H5'?'H5-BUY-01':'WEB-BUY-01',state:'DEFAULT'}:null; if(t) go(t.page,t.state); else back(); return; }
  if(act==='send-code'){
    const p=(q('#phoneInput')&&q('#phoneInput').value.trim())||S.bindPhone;
    if(!/^1\d{10}$/.test(p)){ S.bindError='phone'; S.bindPhone=p; renderAll(); return; }
    S.bindPhone=p; S.bindCode=(q('#codeInput')&&q('#codeInput').value)||S.bindCode; S.bindError=''; S.bindCooldown=60;
    renderAll();
    const btn=q('#sendCodeBtn'); if(btn){ btn.disabled=true; btn.textContent='60s 后重发'; }
    let left=60; every(()=>{ left--; const b=q('#sendCodeBtn'); if(b){ if(left>0){ b.textContent=left+'s 后重发'; } else { b.disabled=false; b.textContent='获取验证码'; S.bindCooldown=0; } } if(left<=0){ clearIntervalTimers(); } },1000);
    toast('验证码已发送（演示：123456）');
    return;
  }
  if(act==='bind-submit'){
    S.bindPhone=(q('#phoneInput')&&q('#phoneInput').value.trim())||'';
    S.bindCode=(q('#codeInput')&&q('#codeInput').value.trim())||'';
    if(!/^1\d{10}$/.test(S.bindPhone)){ S.bindError='phone'; renderAll(); return; }
    if(S.bindCode!=='123456'){ S.bindError='code'; renderAll(); return; }
    S.bindError=''; S.phoneBound=true; S.phoneMasked=S.bindPhone.slice(0,3)+'****'+S.bindPhone.slice(-4);
    toast('手机号绑定成功'); later(()=>buySubmit(),300);
    return;
  }
  if(act==='notice-know'){ S.noticeSeen[(S.account||'guest')]=true; go(RV.end==='H5'?'H5-HOME-01':'WEB-HOME-01','DEFAULT'); return; }
  if(act==='notice-close-x'){ S.noticeSeen[(S.account||'guest')]=true; go(RV.end==='H5'?'H5-HOME-01':'WEB-HOME-01','DEFAULT'); return; }
  if(act==='notice-verify'){ S.noticeSeen[(S.account||'guest')]=true; go(RV.end==='H5'?'H5-AUTH-01':'WEB-AUTH-01','UNVERIFIED'); return; }
  if(act==='relogin'){ S.account=null; S.currentOrder=null; go(RV.end==='H5'?'H5-AUTH-01':'WEB-AUTH-01','LOGIN'); return; }
  if(act==='search-keyword'){ S.search.committed=ds.kw; S.search.draft=ds.kw; go(RV.end==='H5'?'H5-SEARCH-02':'WEB-SEARCH-01', RV.end==='H5'?'RESULTS':'RESULTS'); return; }
  if(act==='search-submit'){ const input=q('#searchInput'); const kw=input?input.value.trim():S.search.draft.trim(); if(!kw){ toast('请输入商品名称','err'); return; } S.search.committed=kw; S.search.draft=kw; go(RV.end==='H5'?'H5-SEARCH-02':'WEB-SEARCH-01','RESULTS'); return; }
  if(act==='home-sort'){ S.homeSort=ds.sort; renderAll(); return; }
  if(act==='result-sort'){ S.search.sort=ds.sort; renderAll(); return; }
  if(act==='media'){ S.mediaIndex=Number(ds.i); renderAll(); return; }
  if(act==='expand'){ S.productExpanded=!S.productExpanded; renderAll(); return; }
  /* ---------- admin nav ---------- */
  if(act==='adm-menu'){ const p=pageOf(ds.id); const st=p.cfg&&p.cfg.config?'DEFAULT':'RESULTS'; ADM.overlay=''; go(ds.id,st); return; }
  if(act==='adm-collapse'){ ADM.collapsed=!ADM.collapsed; renderAll(); return; }
  if(act==='adm-menu-search'){ return; }
  if(act==='adm-role-hint'){ toast('请切换为有权限的角色，或联系管理员授权','err'); return; }
  if(act==='adm-close-overlay'){ closeOverlay(); return; }
  /* ---------- admin list ---------- */
  if(act==='adm-query'){ admQuery(RV.pageId); return; }
  if(act==='adm-reset'){ admReset(RV.pageId); return; }
  if(act==='adm-refresh'){ admRefresh(RV.pageId); return; }
  if(act==='adm-tab'){ admTab(RV.pageId,ds.tab); return; }
  if(act==='adm-page'){ admPage(RV.pageId,Number(ds.page)); return; }
  if(act==='adm-size'){ const rt=admRt(RV.pageId); rt.size=Number(el.value)||10; rt.page=1; admAsync(()=>{}); return; }
  if(act==='adm-sel'){ const rt=admRt(RV.pageId); if(el.checked){ if(!rt.sel.includes(ds.id)) rt.sel.push(ds.id); } else rt.sel=rt.sel.filter(x=>x!==ds.id); renderAll(); return; }
  if(act==='adm-selall'){
    const rt=admRt(RV.pageId); const rows=adminTabbed(RV.pageId,adminFiltered(RV.pageId)).slice((rt.page-1)*rt.size,rt.page*rt.size);
    if(el.checked) rt.sel=rows.map(r=>r.id); else rt.sel=[];
    renderAll(); return;
  }
  if(act==='adm-selclear'){ const rt=admRt(RV.pageId); rt.sel=[]; renderAll(); return; }
  if(act==='adm-rowact'){ admRowact(RV.pageId,ds.rowid,ds.rn); return; }
  if(act==='adm-rowdo'){ admDoRow(RV.pageId,ds.rowid,ds.do); return; }
  if(act==='adm-close-drawer'){ admCloseDrawer(RV.pageId); return; }
  if(act==='adm-confirm-cancel'){ ADM.confirm=null; renderAll(); return; }
  if(act==='adm-confirm-ok'){ admConfirmOk(); return; }
  if(act==='adm-export'){
    const page=pageOf(RV.pageId); const rt=admRt(page.id); const rows=currentAdminRowsForExport();
    if(ADM.role==='客服'){ toast('无导出权限，请联系管理员','err'); return; }
    const cols=(page.cfg.columns||[]).filter(c=>c[0]!=='_op'&&c[0]!=='cdk');
    downloadCsv('订单导出_'+nowStr().replace(/[: ]/g,'')+'.csv',rows,cols);
    addAudit('订单导出','筛选导出','—',rows.length+' 行','订单');
    toast('已导出 '+rows.length+' 行（脱敏）'); return;
  }
  if(act==='adm-batch-export'){ const rt=admRt(RV.pageId); if(!rt.sel.length){ toast('请先选择记录','err'); return; } toast('已导出所选 '+rt.sel.length+' 条'); return; }
  /* ---------- drawers actions ---------- */
  if(act==='adm-goto-paycheck'){ toast('已定位支付核查任务（模拟）'); go('ADM-PAYCHECK-01','RESULTS'); return; }
  if(act==='adm-save-product'){
    const row=adminRows('ADM-PRODUCT-01').find(r=>r.id===admRt('ADM-PRODUCT-01').drawerId); if(!row) return;
    const vals={}; qa('[data-fld]').forEach(n=>vals[n.dataset.fld]=n.value);
    const cost=Number(vals.cost)||0, lowest=Number(vals.lowest)||0, price=Number(vals.price)||0;
    if(price<Math.max(cost,lowest)){ toast('零售价低于底价，不能保存','err'); return; }
    row.gname=vals.gname; row.gid=vals.gid; row.supplier=vals.supplier; row.cost=cost; row.lowest=lowest; row.price=price;
    admCloseDrawer('ADM-PRODUCT-01'); admSetMsg('ADM-PRODUCT-01','商品已保存：'+row.gname); admRender(); return;
  }
  if(act==='adm-gift-start-drawer'){ const row=adminRows('ADM-GIFT-01').find(r=>r.id===admRt('ADM-GIFT-01').drawerId); if(row){ row.status='处理中'; row.tab='处理中'; } admCloseDrawer('ADM-GIFT-01'); admSetMsg('ADM-GIFT-01','已开始处理'); admRender(); return; }
  if(act==='adm-gift-done-drawer'){
    const note=(q('#giftNote')&&q('#giftNote').value.trim())||'';
    if(!note){ toast('完成确认必须填写核实依据/备注','err'); return; }
    const row=adminRows('ADM-GIFT-01').find(r=>r.id===admRt('ADM-GIFT-01').drawerId); if(row){ row.status='已完成'; row.tab='已完成'; addAudit('赠送完成',row.no,'处理中','已完成','订单'); }
    admCloseDrawer('ADM-GIFT-01'); admSetMsg('ADM-GIFT-01','赠送已完成并记录依据'); admRender(); return;
  }
  if(act==='adm-code-retry-drawer'){ const row=adminRows('ADM-CODE-01').find(r=>r.id===admRt('ADM-CODE-01').drawerId); if(row){ row.retry++; row.status='发码中'; row.tab='发码中'; addAudit('口令码重试',row.no,'重试'+row.retry,'重试'+(row.retry+1),'订单'); } admCloseDrawer('ADM-CODE-01'); admSetMsg('ADM-CODE-01','已用原 orderid 重试（模拟）'); admRender(); return; }
  if(act==='adm-code-reissue'){
    const reason=(q('#codeReason')&&q('#codeReason').value.trim())||''; const code=(q('#codeNew')&&q('#codeNew').value.trim())||'';
    if(!reason){ toast('补发/换码必须填写原因','err'); return; }
    if(!code){ toast('请输入替代口令码','err'); return; }
    const row=adminRows('ADM-CODE-01').find(r=>r.id===admRt('ADM-CODE-01').drawerId); if(row){ row.cdk=code; row.status='已交付'; row.tab='已交付'; addAudit('人工补发/换码',row.no,'原交付记录','新交付记录','订单'); }
    admCloseDrawer('ADM-CODE-01'); admSetMsg('ADM-CODE-01','补发已提交并关联原订单'); admRender(); return;
  }
  if(act==='adm-refund-retry-drawer'){ const row=adminRows('ADM-REFUND-01').find(r=>r.id===admRt('ADM-REFUND-01').drawerId); if(row){ row.status='退款中'; row.tab='退款中'; } admCloseDrawer('ADM-REFUND-01'); admSetMsg('ADM-REFUND-01','已复用原任务重试退款（模拟）'); admRender(); return; }
  if(act==='adm-paycheck-decide'){
    const ev=q('#payEvidence')&&q('#payEvidence').value;
    if(!ev){ toast('请先选择渠道证据','err'); return; }
    if(ev==='unknown'){ toast('渠道仍无法确认，保留确认中并升级','err'); return; }
    const row=adminRows('ADM-PAYCHECK-01').find(r=>r.id===admRt('ADM-PAYCHECK-01').drawerId);
    if(row){ row.status='已定性'; row.result=ev==='paid'?'渠道确认已支付':'渠道确认未支付'; row.tab='已定性'; addAudit('支付核查定性',row.no,'确认中',row.result,'订单'); }
    admCloseDrawer('ADM-PAYCHECK-01'); admSetMsg('ADM-PAYCHECK-01','已按渠道证据完成定性'); admRender(); return;
  }
  if(act==='adm-notify-retry-drawer'){ const row=adminRows('ADM-NOTIFY-01').find(r=>r.id===admRt('ADM-NOTIFY-01').drawerId); if(row){ row.retry++; row.status='平台已受理'; row.tab='平台已受理'; } admCloseDrawer('ADM-NOTIFY-01'); admSetMsg('ADM-NOTIFY-01','已授权重试（模拟）'); admRender(); return; }
  if(act==='adm-save-rbac'){
    const single=q('#singleRefund')&&q('#singleRefund').checked;
    addAudit('权限变更','权限矩阵',single?'单人退款=关闭':'单人退款='+(single?'开启':'关闭'),single?'单人退款=开启':'单人退款=关闭','权限');
    admCloseDrawer('ADM-RBAC-01'); admSetMsg('ADM-RBAC-01','权限已保存并留痕；单人退款='+(single?'开启':'关闭')); admRender(); return;
  }
  if(act==='adm-test-supplier'){ toast('供应商连接测试成功（模拟）'); return; }
  /* ---------- config: home ---------- */
  if(act==='home-up'||act==='home-down'){
    const i=Number(ds.i); const j=act==='home-up'?i-1:i+1; const a=ADM_DATA.home.banners;
    if(j>=0&&j<a.length){ const t=a[i]; a[i]=a[j]; a[j]=t; }
    admSetMsg('ADM-HOME-01','广告顺序已调整（草稿）'); admRender(); return;
  }
  if(act==='home-toggle'){ const b=ADM_DATA.home.banners[Number(ds.i)]; if(b) b.enabled=!b.enabled; admSetMsg('ADM-HOME-01','广告启停已调整（草稿）'); admRender(); return; }
  if(act==='home-del'){ return; /* confirm */ }
  if(act==='home-save-draft'){ ADM_DATA.home.draftVersion='v'+(Number(ADM_DATA.home.version.slice(1))+1); admSetMsg('ADM-HOME-01','草稿已保存，前台未生效'); admRender(); return; }
  if(act==='home-preview'){
    previewOverlay('首页配置预览',`<div class="small muted">当前配置预览（不改变前台）</div><div class="mt8">${ADM_DATA.home.banners.filter(b=>b.enabled).map(b=>`<div class="list-row"><div class="thumb">广告</div><div class="grow"><div class="strong">${esc(b.name)}</div><div class="small muted">跳转 ${esc(b.target)}</div></div></div>`).join('')||'<div class="empty-note">无启用广告</div>'}</div>`);
    admRender(); return;
  }
  if(act==='home-add-rec'){ const p=ADM_DATA.products.find(x=>x.publishStatus==='已发布'&&!ADM_DATA.home.recommended.includes(x.id)); if(p){ ADM_DATA.home.recommended.push(p.id); admSetMsg('ADM-HOME-01','已添加推荐：'+p.gname); } else toast('没有可添加的已发布商品','err'); admRender(); return; }
  if(act==='home-remove-rec'){ ADM_DATA.home.recommended=ADM_DATA.home.recommended.filter(x=>x!==ds.id); admSetMsg('ADM-HOME-01','已移除推荐商品'); admRender(); return; }
  /* ---------- config: service ---------- */
  if(act==='service-save'){
    const id=q('#svcId')&&q('#svcId').value.trim(); if(!id){ toast('客服号不能为空','err'); return; }
    ADM_DATA.service={wecomId:id,link:(q('#svcLink')&&q('#svcLink').value)||'',guide:(q('#svcGuide')&&q('#svcGuide').value)||'',hours:(q('#svcHours')&&q('#svcHours').value)||'',updated:nowStr()};
    addAudit('客服配置保存','客服联系方式','旧配置','新配置','商品'); admSetMsg('ADM-SERVICE-01','配置已保存成功！'); admRender(); return;
  }
  if(act==='service-reset'){ admSetMsg('ADM-SERVICE-01','已恢复当前生效值'); admRender(); return; }
  /* ---------- config: agreement ---------- */
  if(act==='agr-preview'){ const body=(q('#agrBody')&&q('#agrBody').value)||''; previewOverlay('协议预览',`<div class="small muted">预览不等于发布</div><div class="mt8 small" style="line-height:1.8">${esc(body).replace(/\n/g,'<br>')}</div>`); admRender(); return; }
  /* ---------- config: search ---------- */
  if(act==='kw-add'){ const v=q('#newKw')&&q('#newKw').value.trim(); if(!v){ toast('请输入关键词','err'); return; } ADM_DATA.keywords.push({id:'k'+(ADM_DATA.keywords.length+1),name:v,enabled:true,order:ADM_DATA.keywords.length+1}); admSetMsg('ADM-SEARCHCFG-01','已新增关键词（未保存）'); admRender(); return; }
  if(act==='kw-up'||act==='kw-down'){ const i=Number(ds.i); const j=act==='kw-up'?i-1:i+1; const a=ADM_DATA.keywords; if(j>=0&&j<a.length){ [a[i],a[j]]=[a[j],a[i]]; a.forEach((x,k)=>x.order=k+1); } admSetMsg('ADM-SEARCHCFG-01','排序已调整（未保存）'); admRender(); return; }
  if(act==='kw-toggle'){ const k=ADM_DATA.keywords[Number(ds.i)]; if(k) k.enabled=!k.enabled; admSetMsg('ADM-SEARCHCFG-01','启停已调整（未保存）'); admRender(); return; }
  if(act==='kw-del'){ return; }
  if(act==='hot-add'){ const ids=ADM_DATA.products.filter(p=>p.publishStatus==='已发布').map(p=>p.id); previewOverlay('选择热门商品',`<div class="small muted">只能从已发布商品中选择。</div><div class="mt8">${ids.map(id=>{const p=product(id);return `<label class="checkrow"><input type="checkbox" data-hotpick="${p.id}" ${ADM_DATA.hotProducts.some(h=>h.pid===p.id)?'checked':''}> ${esc(p.name)} · ${money(p.price)}</label>`;}).join('')}</div><div class="mt8"><button class="btn btn-primary btn-sm" data-act="hot-picker-confirm">确认回填</button></div>`); admRender(); return; }
  if(act==='hot-picker-confirm'){
    const picked=qa('[data-hotpick]').filter(n=>n.checked).map(n=>n.dataset.hotpick);
    ADM_DATA.hotProducts=picked.map((pid,i)=>{const p=product(pid);return {id:'h'+i,pid:pid,name:p.name,price:p.price,order:i+1,enabled:true};});
    closeOverlay(); admSetMsg('ADM-SEARCHCFG-01','热门商品已回填（未保存）'); admRender(); return;
  }
  if(act==='hot-up'){ const i=Number(ds.i); const j=i-1; const a=ADM_DATA.hotProducts; if(j>=0){ [a[i],a[j]]=[a[j],a[i]]; a.forEach((x,k)=>x.order=k+1); } admSetMsg('ADM-SEARCHCFG-01','热门商品顺序已调整'); admRender(); return; }
  if(act==='hot-toggle'){ const h=ADM_DATA.hotProducts[Number(ds.i)]; if(h) h.enabled=!h.enabled; admSetMsg('ADM-SEARCHCFG-01','热门商品启停已调整'); admRender(); return; }
  if(act==='hot-del'){ return; }
  if(act==='search-save'){ addAudit('搜索推荐保存','关键词/热门商品','—','已保存','商品'); admSetMsg('ADM-SEARCHCFG-01','搜索推荐已保存并生效'); admRender(); return; }
  /* ---------- config: wallet ---------- */
  if(act==='wallet-save'){
    const v=Number(q('#walletThreshold')&&q('#walletThreshold').value)||0;
    ADM_DATA.wallet.threshold=v; ADM_DATA.wallet.low=ADM_DATA.wallet.available<v;
    addAudit('钱包阈值保存','预警阈值',String(v),String(v),'商品');
    admSetMsg('ADM-WALLET-01','阈值已保存：¥'+v.toFixed(2)+(ADM_DATA.wallet.low?'（当前低于阈值）':'')); admRender(); return;
  }
  /* fallback */
  toast('动作未实现：'+act,'err');
}

/* ---------- client helpers ---------- */
function openProduct(id){
  const p=product(id); S.currentProduct=id; S.mediaIndex=0; S.productExpanded=false;
  let st='DEFAULT';
  if(S.account){
    const ao=activeOrderFor(id);
    if(ao) st=ao.pay==='CONFIRMING'?'PENDING':'PENDING';
    else if(ORDERS.some(o=>o.account===S.account&&o.productId===id&&o.pay==='PAID'&&o.deliveryStatus!=='DELIVERED'&&o.delivery==='GIFT')) st='PAID_DELIVERING';
  }
  if(p.sale!=='AVAILABLE'&&st==='DEFAULT') st='UNAVAILABLE';
  go(RV.end==='H5'?'H5-PRODUCT-01':'WEB-PRODUCT-01',st);
}
function buyOpen(id){
  const p=product(id); const ao=activeOrderFor(id);
  if(ao){ S.currentOrder=ao; if(ao.pay==='CONFIRMING'){ go(RV.end==='H5'?'H5-PAYRET-01':'WEB-PAYRET-01','TIMEOUT'); } else { go(RV.end==='H5'?'H5-CHECKOUT-01':'WEB-CHECKOUT-01','DEFAULT'); } return; }
  S.buy={productId:id,specId:p.specs[0].id,delivery:p.delivery,friendLink:'',payMethod:(S.buy&&S.buy.payMethod)||'WECHAT',agreementChecked:S.agreementChecked,error:'',showNotice:false};
  go(RV.end==='H5'?'H5-BUY-01':'WEB-BUY-01','DEFAULT');
}
function buySubmit(){
  if(!S.buy){ toast('请先选择商品','err'); return; }
  const b=S.buy; const p=product(b.productId); const sp=specOf(p,b.specId);
  if(!S.account){ S.authReturn={page:RV.end==='H5'?'H5-BUY-01':'WEB-BUY-01',state:'DEFAULT'}; go(RV.end==='H5'?'H5-AUTH-01':'WEB-AUTH-01','LOGIN'); return; }
  if(S.realName!=='verified'||!S.adult){
    const st=S.realName==='minor'?'MINOR':S.realName==='unknown'?'UNKNOWN':'UNVERIFIED';
    S.authReturn={page:RV.end==='H5'?'H5-BUY-01':'WEB-BUY-01',state:'DEFAULT'};
    go(RV.end==='H5'?'H5-AUTH-01':'WEB-AUTH-01',st); return;
  }
  const buyPage=RV.end==='H5'?'H5-BUY-01':'WEB-BUY-01';
  const toBuyState=(state)=>{ if(RV.pageId!==buyPage) go(buyPage,state); else { RV.state=state; renderAll(); } };
  if(!b.agreementChecked){ b.showNotice=true; toBuyState('VALIDATION_ERROR'); return; }
  if(p.delivery==='GIFT'&&!b.friendLink.trim()){ b.error='link'; toBuyState('VALIDATION_ERROR'); return; }
  if(!S.phoneBound){ go(RV.end==='H5'?'H5-PHONE-01':'WEB-PHONE-01','DEFAULT'); return; }
  if(p.sale==='SOLD_OUT'||p.sale==='OFFLINE'||walletBlocked(p)){
    b.error='reject'; b.rejectText=p.sale==='SOLD_OUT'?'库存缓存新鲜且为 0，已售罄。':p.sale==='OFFLINE'?'商品未发布、已下架或价格不合规。':'供应商余额不足或查询失败，暂不可购买口令码商品。';
    toBuyState('BUSINESS_REJECT'); return;
  }
  const ao=activeOrderFor(p.id);
  if(ao){ b.error='reject'; b.rejectText='当前账号对该商品已有有效未支付/确认中订单 '+ao.no+'，请先恢复该订单。'; toBuyState('BUSINESS_REJECT'); return; }
  RV.state='SUBMITTING'; renderAll();
  later(()=>{
    const seq=ORDERS.filter(o=>o._new).length+1;
    const no='SO20261027'+String(100+seq);
    const o={id:'n'+seq,no:no,productId:p.id,specId:sp.id,delivery:p.delivery,pay:'PENDING',deliveryStatus:'NOT_STARTED',refund:'NONE',amount:sp.price,created:nowStr(),paidAt:'',cdk:'',friendLink:b.friendLink,account:S.account,expiresAt:'2026-10-27 18:00',_new:true};
    ORDERS.push(o); S.currentOrder=o;
    go(RV.end==='H5'?'H5-CHECKOUT-01':'WEB-CHECKOUT-01','DEFAULT');
    toast('订单已创建，请继续支付');
  },450);
}
function resultState(){
  const o=S.currentOrder||orderById('o1');
  if(o.pay==='CONFIRMING') return 'CONFIRMING';
  if(o.refund==='FAILED') return 'REFUND_FAILED';
  if(o.delivery==='GIFT') return o.deliveryStatus==='DELIVERED'?'DELIVERED':'GIFT_PENDING';
  if(o.deliveryStatus==='DELIVERED') return 'DELIVERED';
  if(o.deliveryStatus==='EXCEPTION') return 'EXCEPTION';
  return 'ISSUING';
}
function payQuery(answer){
  const o=S.currentOrder||orderById('o3');
  go(RV.end==='H5'?'H5-PAYRET-01':'WEB-PAYRET-01','QUERYING');
  later(()=>resolvePay(), 600);
}
function resolvePay(){
  const o=S.currentOrder||orderById('o3');
  if(RV.sim==='fail'){
    go(RV.end==='H5'?'H5-PAYRET-01':'WEB-PAYRET-01','UNPAID'); return;
  }
  if(RV.sim==='timeout'){
    o.pay='CONFIRMING';
    go(RV.end==='H5'?'H5-PAYRET-01':'WEB-PAYRET-01','TIMEOUT'); return;
  }
  o.pay='PAID'; o.paidAt=nowStr();
  if(o.delivery==='GIFT'){ o.deliveryStatus='PENDING'; go(RV.end==='H5'?'H5-RESULT-01':'WEB-RESULT-01','GIFT_PENDING'); return; }
  o.deliveryStatus='ISSUING';
  go(RV.end==='H5'?'H5-RESULT-01':'WEB-RESULT-01','ISSUING');
  later(()=>{ o.deliveryStatus='DELIVERED'; o.cdk='VG-'+o.no.slice(-3)+'-'+String(Math.floor(Math.random()*9000+1000)); if(RV.pageId==='H5-RESULT-01'||RV.pageId==='WEB-RESULT-01'){ RV.state='DELIVERED'; renderAll(); toast('口令码已生成'); } }, 900);
}
function viewOrder(id){
  const o=orderById(id)||S.currentOrder; if(!o){ toast('订单不存在','err'); return; }
  S.currentOrder=o;
  const st=displayStatus(o);
  let state='DEFAULT';
  if(st==='待支付') state='PENDING_PAY';
  else if(st==='支付确认中') state='CONFIRMING';
  else if(st.includes('赠送')) state='GIFT';
  else if(st==='退款失败') state='REFUND_FAILED';
  go(RV.end==='H5'?'H5-ORDER-01':'WEB-ORDER-01',state);
}
function recoverOrder(id){
  const o=orderById(id)||activeOrderFor(S.currentProduct);
  if(!o){ toast('未找到关联订单','err'); return; }
  S.currentOrder=o;
  if(o.pay==='CONFIRMING'){ go(RV.end==='H5'?'H5-PAYRET-01':'WEB-PAYRET-01','TIMEOUT'); }
  else if(o.pay==='PENDING'){ go(RV.end==='H5'?'H5-CHECKOUT-01':'WEB-CHECKOUT-01','DEFAULT'); }
  else { viewOrder(o.id); }
}

/* ---------- events ---------- */
function bindGlobal(){
  document.addEventListener('click', e=>{
    const el=e.target.closest('[data-act]');
    if(!el) return;
    const act=el.dataset.act;
    if(el.dataset.confirm && act!=='adm-confirm-ok'){
      e.preventDefault();
      admConfirm(el.dataset.do||act,{...el.dataset});
      return;
    }
    if(el.tagName==='INPUT' && (el.type==='checkbox'||el.type==='radio')){
      handleAction(act,el); return;
    }
    e.preventDefault();
    handleAction(act,el);
  });
  document.addEventListener('input', e=>{
    const n=e.target;
    if(n.matches('[data-flt]')){ const rt=admRt(RV.pageId); rt.draft[n.dataset.flt]=n.value; return; }
    if(n.id==='searchInput'){ S.search.draft=n.value; const b=q('[data-act="search-submit"]'); if(b) b.disabled=!n.value.trim(); return; }
    if(n.id==='friendInput'){ if(S.buy){ S.buy.friendLink=n.value; S.buy.error=''; } return; }
    if(n.id==='phoneInput'){ S.bindPhone=n.value; return; }
    if(n.id==='codeInput'){ S.bindCode=n.value; return; }
    if(n.matches('[data-act="adm-menu-search"]')){
      ADM.menuQuery=n.value; const qv=n.value.trim().toLowerCase();
      qa('.menu-item').forEach(it=>{ const t=(it.textContent||'').toLowerCase(); it.style.display=(!qv||t.includes(qv))?'':'none'; });
      return;
    }
  });
  document.addEventListener('change', e=>{
    const n=e.target;
    if(n.matches('[data-flt]')){ const rt=admRt(RV.pageId); rt.draft[n.dataset.flt]=n.value; return; }
    if(n.dataset.act==='adm-role'){ ADM.role=n.value; ADM.overlay=''; renderAll(); return; }
    if(n.dataset.act==='adm-size'){ const rt=admRt(RV.pageId); rt.size=Number(n.value)||10; rt.page=1; admAsync(()=>{}); return; }
  });
  document.addEventListener('keydown', e=>{
    if(e.key==='Enter'){
      if(e.target.id==='searchInput'){ e.preventDefault(); handleAction('search-submit',e.target); return; }
      if(e.target.matches('[data-flt]')){ e.preventDefault(); admQuery(RV.pageId); return; }
    }
    if(e.key==='Escape'){
      if(q('#readerMask')){ closeReader(); return; }
      if(q('#diagramMask')){ closeDiagram(); return; }
      if(ADM.confirm){ ADM.confirm=null; admRender(); return; }
      if(ADM.overlay){ closeOverlay(); return; }
      const page=pageOf(RV.pageId); const rt=page&&page.end==='ADM'?admRt(page.id):null;
      if(rt&&rt.drawer){ admCloseDrawer(page.id); return; }
      if(S.buy&&S.buy.showNotice){ S.buy.showNotice=false; renderAll(); return; }
    }
    if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-act]')&&!['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.target.tagName)){
      e.preventDefault(); e.target.click();
    }
  });
}

function postRender(page){
  clearIntervalTimers();
  if(page.id==='H5-HOME-01'&&RV.state==='DEFAULT'){
    const host=q('.m-banner'); if(host){ host.addEventListener('mouseenter',()=>S.bannerPaused=true); host.addEventListener('mouseleave',()=>S.bannerPaused=false); host.addEventListener('focusin',()=>S.bannerPaused=true); host.addEventListener('focusout',()=>S.bannerPaused=false); }
    every(()=>{ if(RV.pageId!=='H5-HOME-01'||S.bannerPaused) return; S.homeBanner=(S.homeBanner+1)%3; const b=q('.m-banner'); if(b){ const names=['影之刃零','黑神话：悟空','双人成行']; const pids=['p01','p04','p05']; b.innerHTML=`<button data-act="open-product" data-id="${pids[S.homeBanner]}" style="border:0;background:transparent;width:100%;height:100%;color:inherit;font-size:12px">广告位 ${S.homeBanner+1}/3 · ${names[S.homeBanner]}<span class="dots">${[0,1,2].map(i=>`<span class="dot ${i===S.homeBanner?'on':''}"></span>`).join('')}</span></button>`; } },5000);
  }
  if(page.id==='WEB-HOME-01'&&RV.state==='DEFAULT'){
    every(()=>{ if(RV.pageId!=='WEB-HOME-01') return; S.homeBanner=(S.homeBanner+1)%2; const b=q('.web-hero'); if(b){ const names=['影之刃零','黑神话：悟空']; const pids=['p01','p04']; b.innerHTML=`<button data-act="open-product" data-id="${pids[S.homeBanner]}" style="border:0;background:transparent;width:100%;height:100%;font-size:14px;color:#555">广告位 · ${names[S.homeBanner]}　（${S.homeBanner+1}/2）</button>`; } },6000);
  }
}
function initApp(){
  initShell();
  RV.end='H5'; RV.pageId='H5-HOME-01'; RV.state='DEFAULT';
  renderAll();
  if(!S.account){ const acc=q('#accSel'); if(acc) acc.value='guest'; }
}


initApp();
