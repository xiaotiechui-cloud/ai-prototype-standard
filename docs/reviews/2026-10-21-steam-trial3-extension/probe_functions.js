'use strict';
// Execute selected original functions against isolated fixtures, never the HTML.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const here = __dirname;
const inventory = JSON.parse(fs.readFileSync(path.join(here, '../2026-10-21-steam-trial3/01_结构清单.json'), 'utf8').replace(/^\uFEFF/, ''));
const sources = {};
for (const version of ['trial', 'final']) {
  const raw = fs.readFileSync(inventory[version].path);
  if (crypto.createHash('sha256').update(raw).digest('hex') !== inventory[version].sha256) throw Error('Changed input: ' + version);
  sources[version] = raw.toString('utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
}
function original(version, name) {
  const lines = sources[version];
  const rx = new RegExp('^([ \\t]*)function ' + name + '\\(');
  const start = lines.findIndex(x => rx.test(x));
  if (start < 0) throw Error('Missing original function ' + name);
  const indent = lines[start].match(rx)[1];
  if (/\}\s*;?\s*$/.test(lines[start])) return lines[start];
  const close = new RegExp('^' + indent + '\\}\\s*;?\\s*$');
  let end = start + 1;
  while (end < lines.length && !close.test(lines[end])) end++;
  if (end === lines.length) throw Error('Unclosed original function ' + name);
  return lines.slice(start, end + 1).join('\n');
}
function line(version, number) { return sources[version][number - 1]; }
function context(extra = {}) { return vm.createContext({ ...extra }); }
const results = [];
function record(id, source, execute) {
  try { results.push({ id, source, scope: 'isolated-function-or-original-statements', ...execute() }); }
  catch (e) { results.push({ id, source, scope: 'isolated-function-or-original-statements', harness_error: e.name + ': ' + e.message }); }
}

record('PROBE-01', 'trial:1934;3657', () => {
  const s = {search:{keyword:'ZZ_NO_MATCH',sort:'recommend',results:[]}, products:[{id:'P-X',name:'星海示例',en:'star',status:'ON',price:100}]};
  const c = context({S:s, C:(id,body)=>body, esc:String, btn:()=>'', money:String,
    phoneShell:x=>x.content, productCard:p=>'[CARD:'+p.id+']', goodsCard:()=>'', art:()=>'', chip:()=>''});
  vm.runInContext(original('trial','sortProducts') + '\n' + original('trial','renderAppSearchResults'), c);
  const html = vm.runInContext('renderAppSearchResults("RESULTS")', c);
  return {result_count:s.search.results.length, rendered_example:html.includes('P-X'), observation:'empty result renderer selected demonstration product'};
});
record('PROBE-02', 'final:1711;1737', () => {
  const c = context({RV:{state:'RESULTS',kw:'ZZ_NO_MATCH',sim:'ok'},GOODS:[{id:'P-X',nm:'演示商品'}],
    C:(id,body)=>body,esc:String,attr:String,phoneShell:x=>x,goodsCard:(id,g)=>'[CARD:'+g.id+']',stateBlock:()=>''});
  vm.runInContext(original('final','rSearchResult'), c);
  const html = vm.runInContext('rSearchResult()', c);
  return {matching_products:0, rendered_example:html.includes('P-X'), observation:'no-match lookup fell back to GOODS sample'};
});
record('PROBE-03', 'final:1417', () => {
  const c = context({RV:{session:{history:['A','B']}},HISTORY_MAX:10,HISTORY_MAX_LEN:30});
  vm.runInContext(original('final','pushHistory'),c);
  vm.runInContext('pushHistory(" B ")',c);
  return {history:c.RV.session.history, observation:'original helper trims, deduplicates and moves submitted term to first position'};
});
record('PROBE-04', 'trial:1633', () => {
  const c = context({S:{buy:{productId:'P-X',specId:'SP-B',friendLink:'draft',agreement:true,payChannel:'alipay'}},
    productById:id=>({id}),specsOf:()=>[{id:'SP-A'}]});
  vm.runInContext(original('trial','beginBuy'),c); vm.runInContext('beginBuy("P-X")',c);
  return {after:c.S.buy, observation:'reopening same product reset existing selections'};
});
record('PROBE-05', 'final:1891', () => {
  const c = context({gd:{ver:'A',price:100,type:'CODE',specs:[{nm:'A',price:100},{nm:'B',price:260}]},spec:'B'});
  vm.runInContext(line('final',1891),c);
  return {configured_price:260, rendered_price:c.price, observation:'price expression uses fixed increment instead of configured second-spec price'};
});
record('PROBE-06', 'trial:4655;4657', () => {
  const c = context({u:{account:'B',role:'运营'},role:'财务',S:{audits:[]},nowText:()=> 'fixture-time'});
  vm.runInContext(line('trial',4655)+'\n'+line('trial',4657),c);
  return {record:c.S.audits[0], observation:'audit before equals new role because original assignment precedes snapshot'};
});
record('PROBE-07', 'trial:4327;4336;4338', () => {
  const tasks=[];const pages={A:{draft:{keyword:'a'},committed:{},page:1,sel:[],reqVer:0}};
  const c = context({RV:{pageId:'A',sim:'ok'},admRt:id=>pages[id]||(pages[id]={reqVer:1,loading:true}),
    render:()=>{},setTimeout:f=>tasks.push(f)});
  vm.runInContext(original('trial','admAction'),c);
  vm.runInContext('admAction("adm-query",{})',c);
  pages.A.draft.keyword='b'; vm.runInContext('admAction("adm-query",{})',c);
  tasks[0]();
  return {pending_callbacks:tasks.length, second_request_loading_after_first_callback:pages.A.loading,
    observation:'mutable runtime references defeat stale-response comparison'};
});
record('PROBE-08', 'trial:4470;4478;1630', () => {
  const ad={id:'A',name:'OLD',target:'P-X',sort:1,active:true};
  const fields={'#ad-name':{value:'NEW'},'#ad-target':{value:'P-Y'},'#ad-sort':{value:'1'},'#ad-active':{checked:true}};
  const rt={drawerId:'A',drawer:true};
  const c = context({RV:{pageId:'ADM-HOME-01'},S:{ads:[ad]},admRt:()=>rt,$:sel=>fields[sel],render:()=>{},setToast:()=>{}});
  vm.runInContext(original('trial','admAction')+'\n'+original('trial','activeAds'),c);
  vm.runInContext('admAction("adm-save:ad",{})',c);
  return {active_ad_name_before_publish:vm.runInContext('activeAds()[0].name',c),
    observation:'save-draft action mutated object read by client before publish'};
});
record('PROBE-09', 'trial:4500;4506', () => {
  const gift={id:'G-B',status:'PENDING'};
  const c = context({RV:{pageId:'ADM-GIFT-01'},S:{gifts:[gift],giftBatches:[]},admRt:()=>({}),nowText:()=> 'fixture-time',setToast:()=>{},render:()=>{}});
  vm.runInContext(original('trial','admAction'),c);
  // The original branch is located by its leading condition, not an invented API.
  const header = sources.trial.slice(4493,4501).find(x=>/if \(act ===/.test(x));
  const action = header && header.match(/act === "([^"]+)"/)[1];
  if (!action) throw Error('Could not locate original gift action');
  c.fixtureAction=action; vm.runInContext('admAction(fixtureAction,{rowid:"G-B"})',c);
  return {action, gift_status_after_open:gift.status, batches:c.S.giftBatches.length,
    observation:'explicit start-processing action creates a batch; label and confirmation are checked separately from read-only details'};
});
record('PROBE-10', 'final:3539;3540', () => {
  const states={A:{reqVer:0}};
  const c=context({admRT:id=>states[id]});
  vm.runInContext(original('final','admQuery')+'\n'+original('final','admIsStale'),c);
  const old=vm.runInContext('admQuery("A")',c);vm.runInContext('admQuery("A")',c);c.old=old;
  return {old_token:old,current_token:states.A.reqVer,stale_rejected:vm.runInContext('admIsStale("A",old)',c),
    observation:'immutable token rejects earlier request within one runtime generation'};
});
record('PROBE-11', 'trial:2153', () => {
  const c=context({S:{currentOrderId:'MISSING-B',lastOrderId:''},orderById:()=>null,ordersOfCurrent:()=>[{id:'A'}]});
  const chosen=vm.runInContext(line('trial',2153)+'\n o',c);
  return {requested_id:'MISSING-B',selected_id:chosen.id,observation:'unknown explicit order ID falls back to another order'};
});
record('PROBE-12', 'trial:1550;1551', () => {
  const product={id:'P-X',name:'OLD'}; const c=context({productById:()=>product,PRODUCT_SPECS:{'P-X':[{id:'SP-A',name:'OLD-SPEC'}]}});
  vm.runInContext(line('trial',1550)+'\n'+line('trial',1551),c);
  c.order={productId:'P-X',specId:'SP-A'};
  const before=vm.runInContext('orderProduct(order).name+"/"+orderSpec(order)',c);
  product.name='NEW';c.PRODUCT_SPECS['P-X'][0].name='NEW-SPEC';
  return {before,after:vm.runInContext('orderProduct(order).name+"/"+orderSpec(order)',c),observation:'historical display reads current catalog rather than order snapshot'};
});
record('PROBE-13', 'final:3531;3539;3540', () => {
  const c=context({ADM_RT:{}});
  vm.runInContext(original('final','admRT')+'\n'+original('final','admResetRT')+'\n'+original('final','admQuery')+'\n'+original('final','admIsStale'),c);
  const old=vm.runInContext('admQuery("A")',c);vm.runInContext('admResetRT("A");admQuery("A")',c);c.old=old;
  return {old_token:old,new_generation_token:c.ADM_RT.A.reqVer,old_rejected:vm.runInContext('admIsStale("A",old)',c),observation:'numeric token is reused after runtime reset; reset overlap needs generation isolation'};
});
record('PROBE-14', 'trial:4275;4284;4286', () => {
  const feedback=[];
  const c=context({navigator:{},document:{createElement:()=>({select(){},remove(){}}),body:{appendChild(){}},execCommand:()=>false},
    setToast:(...x)=>feedback.push(x),render:()=>{}});
  vm.runInContext(original('trial','copy'),c);vm.runInContext('copy("fixture-value")',c);
  return {copy_api_return:false,feedback,observation:'legacy copy failure still reports copied successfully'};
});
record('PROBE-15', 'trial:4293;4649;4655', () => {
  const user={id:'U-B',account:'B',role:'运营'}, rt={drawerId:'U-B',drawer:true};let checks=0;
  const c=context({RV:{pageId:'ADM-RBAC-01'},S:{adminRole:'客服',adminUsers:[user],audits:[]},admRt:()=>rt,
    can:()=>{checks++;return false;},$:()=>({value:'管理员'}),nowText:()=> 'fixture-time',render:()=>{},setToast:()=>{}});
  vm.runInContext(original('trial','admAction'),c);vm.runInContext('admAction("adm-save:rbac",{})',c);
  return {role_after:user.role,permission_checks:checks,observation:'original role-write branch does not recheck authorization; isolated internal action only'};
});
record('PROBE-16', 'trial:1832;4605', () => {
  const refund={id:'R-B',orderId:'O-B',status:'REJECTED'},order={id:'O-B'};
  const c=context({S:{refunds:[refund],audits:[]},orderById:()=>order});
  vm.runInContext(original('trial','executeRefund'),c);
  vm.runInContext('executeRefund("R-B");executeRefund("R-B")',c);
  return {initial:'REJECTED',after:refund.status,audit_count:c.S.audits.length,
    observation:'refund helper overwrites rejected status and repeats success audit; no real channel execution in this probe'};
});
record('PROBE-17', 'trial:4374;4377', () => {
  const rt={page:1,sel:['A'],size:10};const c=context({RV:{pageId:'ADM-ORDER-01'},admRt:()=>rt,render:()=>{}});
  vm.runInContext(original('trial','admAction'),c);vm.runInContext('admAction("adm-page",{page:"999"})',c);
  return {page:rt.page,selection:rt.sel,observation:'page action accepts positive page without upper bound and retains previous selection'};
});
const report={method:'original-functions-in-node-vm-with-fixtures',browser_verification:'not_run',
  source_hashes:{trial:inventory.trial.sha256,final:inventory.final.sha256},
  results};
fs.writeFileSync(path.join(here,'02_局部函数复核.json'),JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify({probes:results.length,harness_errors:results.filter(x=>x.harness_error).map(x=>({id:x.id,error:x.harness_error})),results:results.filter(x=>!x.harness_error).map(({id,observation,...rest})=>({id,...rest}))},null,2));
if(results.some(x=>x.harness_error))process.exitCode=1;
