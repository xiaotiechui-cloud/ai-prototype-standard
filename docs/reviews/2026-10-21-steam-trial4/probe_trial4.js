// Only selected original functions execute in isolated fixtures. No page scripts,
// browser launch, network, full app boot, or DOM implementation are executed.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const input='D:/模型汇总/GitHub维护测试/试跑4.0/项目原型交付_V1.0/02_低保真交互原型.html';
const raw=fs.readFileSync(input),source=raw.toString('utf8').replace(/^\uFEFF/,''),ls=source.split(/\r?\n/);
const records=[];
function named(name){
 const i=ls.findIndex(l=>l.startsWith('function '+name+'('));if(i<0)throw Error(name);
 let j=i;if(!/}\s*$/.test(ls[i])){j=ls.findIndex((l,k)=>k>i&&/^}$/.test(l));}
 return {code:ls.slice(i,j+1).join('\n'),line:i+1,end:j+1};
}
function action(name){
 const i=ls.findIndex(l=>l.startsWith('  "'+name+'":function'));if(i<0)throw Error(name);
 let j=i+1;while(j<ls.length&&!/^  "[^"]+":function|^}\);/.test(ls[j]))j++;
 let code=ls.slice(i,j).join('\n').trim().replace(/,\s*$/,'');
 return {code:'globalThis.act=({'+code+'})['+JSON.stringify(name)+'];',line:i+1,end:j};
}
function context(){
 const calls=[],queue=[],S={loggedIn:true,authStatus:'verified_adult',agreementAccepted:true,phoneBound:true,productId:'A',skuId:'SA1',platform:'A',friendLink:'https://s.team/p/a',payChannel:'wechat',activeOrderId:'OA',selectedOrderId:'OA'};
 const products=[{id:'A',name:'OLD',price:98,delivery_type:'CODE',sale_status:'ON',stock:5,skus:[{id:'SA1',price:98},{id:'SA2',price:158}]},{id:'B',name:'B',price:260,delivery_type:'GIFT',sale_status:'ON',stock:8,skus:[{id:'SB',price:260}]}];
 const orders=[{order_no:'OA',product_id:'A',sku_id:'SA1',platform:'A',amount:98,pay_status:'待支付',delivery_type:'CODE',delivery_status:'未启动',timeline:[]},{order_no:'OB',product_id:'B',sku_id:'SB',platform:'B',amount:260,pay_status:'待支付',delivery_type:'GIFT',delivery_status:'待处理',timeline:[]}];
 const c={S,SESSION:S,DB:{products,orders,audit:[],home:{version:'home_v3',banners:[]},currentAgreement:'v1.0',giftBatches:[],refunds:[],notify:[],suppliers:[],service:{}},RV:{pageId:'CL-PRODUCT-01',end:'CLIENT',state:'DEFAULT',sim:'ok'},ADMIN:{rt:{}},calls,queue,console,
  render:()=>calls.push(['render']),flash:(...x)=>calls.push(['flash',...x]),admToast:(...x)=>calls.push(['toast',...x]),go:(...x)=>calls.push(['go',...x]),
  setTimeout:f=>{queue.push(f);return queue.length;},nowStamp:()=> 'fixture-time',uid:p=>p+'-FIX',clone:x=>JSON.parse(JSON.stringify(x)),hasPerm:()=>{calls.push(['hasPerm']);return false;},
  admRT:id=>c.ADMIN.rt[id]||(c.ADMIN.rt[id]={form:{},draft:{},committed:{},sel:[],page:1,size:10}),
  productById:id=>c.DB.products.find(x=>x.id===id),orderById:id=>c.DB.orders.find(x=>x.order_no===id),
  currentProduct:()=>c.DB.products.find(x=>x.id===S.productId),currentSku:()=>c.currentProduct().skus.find(x=>x.id===S.skuId),currentOrder:()=>c.DB.orders.find(x=>x.order_no===S.activeOrderId),writeAudit:(...x)=>calls.push(['audit',...x]),
  downloadCSV:(...x)=>calls.push(['downloadCSV',...x]),$$:()=>[]};
 return vm.createContext(c);
}
function run(id,kind,name,setup,check){
 const c=context(),f=kind==='action'?action(name):named(name);
 setup(c);vm.runInContext(f.code,c,{timeout:1000,filename:input+':'+f.line});
 const result=check(c,kind==='action'?c.act:c[name]);
 records.push({id,method:'original-function-isolated-fixture',entry:name,source:{path:input,line:f.line,end:f.end},...result});
}
const observed=(label,actual,expected)=>({observation:label,actual,expected,contract_met:JSON.stringify(actual)===JSON.stringify(expected)});
run('VM01','fn','currentOrder',c=>{c.S.activeOrderId='MISSING';c.S.selectedOrderId='MISSING';},(c,f)=>observed('missing order must not select another order',f().order_no,null));
run('VM02','fn','saveProduct',c=>{c.S.adminProductId='A';c.ADMIN.productDraft={name:'NEW',price:98,delivery_type:'CODE',stock:4,sale_status:'ON'};c.productDraftFromForm=()=>c.ADMIN.productDraft;},(c,f)=>{f();return observed('independent SKU prices survive name-only product save',c.DB.products[0].skus.map(s=>s.price),[98,158]);});
run('VM03','fn','saveProduct',c=>{c.S.adminProductId='A';c.ADMIN.productDraft={name:'NEW',price:120};c.productDraftFromForm=()=>c.ADMIN.productDraft;},(c,f)=>{f();return observed('audit captures pre-write values',c.calls.find(x=>x[0]==='audit')[3],'OLD / 98');});
run('VM04','fn','saveSupplier',c=>{c.S.adminSupplierId='MAP';c.DB.suppliers=[{id:'MAP',sku_id:'SA1',supplier_sku:'S1',enabled:true}];c.admRT('ADM-SUPPLIER-01').form={enabled:'0'};},(c,f)=>{f();return observed('select option 0 decodes to false',c.DB.suppliers[0].enabled,false);});
run('VM05','fn','saveStock',c=>{c.S.adminStockId='A';c.admRT('ADM-STOCK-01').form={stock:'5',sellable:'0',reason:''};},(c,f)=>{f();return observed('not-sellable selection must not remain ON',c.DB.products[0].sale_status==='ON',false);});
run('VM06','fn','saveService',c=>{c.DB.service={wecom_id:'OLD',wecom_link:'url',hours:'old',fallback:'OLD'};c.admRT('ADM-SERVICE-01').form={wecom_id:'NEW',hours:'',fallback:''};},(c,f)=>{f();return observed('legally empty optional fallback stays empty',c.DB.service.fallback,'');});
run('VM07','fn','saveHomeDraft',c=>{c.ADMIN.homeDraft={version:'home_v3',banners:[{title:'NEW'}]};},(c,f)=>{f();return observed('saving home draft does not publish',c.DB.home.banners,[]);});
run('VM08','fn','publishHome',c=>{c.RV.sim='fail';c.ADMIN.homeDraft={version:'home_v3',banners:[{title:'NEW'}]};},(c,f)=>{f();return observed('simulated failed publish leaves live configuration unchanged',c.DB.home.banners,[]);});
run('VM09','fn','continueBuy',c=>{c.DB.orders=[];},(c,f)=>{f();c.S.productId='B';c.S.skuId='SB';c.S.platform='B';c.queue[0]();const o=c.DB.orders[0];return observed('creation uses immutable original product/SKU/platform', [o.product_id,o.sku_id,o.platform,o.amount],['A','SA1','A',98]);});
run('VM10','action','payret-choice',c=>{c.S.payQueryResult='paid';},(c,f)=>{f({dataset:{}});c.S.activeOrderId='OB';c.queue[0]();return observed('late query does not mutate newly selected order B',c.DB.orders[1].pay_status,'待支付');});
run('VM11','action','payret-choice',c=>{c.S.payQueryResult='paid';},(c,f)=>{f({dataset:{}});c.queue[0]();return observed('paid query alone does not issue a code',c.DB.orders[0].delivery_status,'未启动');});
run('VM12','fn','wbSubmit',c=>{c.DB.orders=[];c.DB.products[0].sale_status='OFF';},(c,f)=>{f();c.queue.forEach(x=>x());return observed('off-sale product cannot create order',c.DB.orders.length,0);});
run('VM13','fn','wbSubmit',c=>{c.DB.orders[0].pay_status='确认中';},(c,f)=>{f();c.queue.forEach(x=>x());return observed('confirming old payment is resolved before new order',c.DB.orders.filter(o=>o.product_id==='A').length,1);});
run('VM14','action','wb-auth-success',c=>{c.S.loggedIn=false;c.S.authStatus='unverified';c.wbSubmit=()=>{};},(c,f)=>{f();return observed('login result does not imply adult verification',c.S.authStatus,'unverified');});
run('VM15','fn','codeReplace',c=>{c.admRT('ADM-CODE-01').form={code_reason:'replace',code_new:'NEW-CODE'};c.DB.orders[0].code='OLD-CODE';c.DB.orders[0].pay_status='已支付';},(c,f)=>{f('OA','replace');return observed('replacement preserves an identifiable old/new delivery record',JSON.stringify(c.DB.orders[0]).includes('OLD-CODE'),true);});
run('VM16','fn','refundTransition',c=>{c.DB.refunds=[{refund_id:'R',status:'已拒绝'}];c.admRT('ADM-REFUND-01').form={refund_reason:'fixture'};},(c,f)=>{f('R','execute');return observed('rejected refund cannot execute directly',c.DB.refunds[0].status,'已拒绝');});
run('VM17','fn','notifyRetry',c=>{c.DB.notify=[{task_id:'N',status:'平台已受理',retry_count:1}];},(c,f)=>{f('N');return observed('accepted notification cannot blindly retry',c.DB.notify[0].retry_count,1);});
run('VM18','fn','completeGift',c=>{c.DB.orders.forEach(o=>{o.delivery_type='GIFT';o.delivery_status='处理中';o.batch_no='G';o.pay_status='已支付';});c.DB.giftBatches=[{batch_no:'G',items:['OA','OB'],status:'处理中'}];c.admRT('ADM-GIFT-01').form={gift_note:'A received'};},(c,f)=>{f('OA');return observed('batch is not completed while another member is processing',c.DB.giftBatches[0].status,'处理中');});
run('VM19','fn','exportGiftOrders',()=>{},(c,f)=>{f(['OB']);return observed('export entry produces declared file or explicitly simulated artifact',c.calls.filter(x=>x[0]==='downloadCSV').length,1);});
run('VM20','action','adm-page',c=>{c.admRT(c.RV.pageId).sel=['OA'];},(c,f)=>{f({dataset:{pageNo:'2'}});return observed('current-page selection cleared on paging',c.admRT(c.RV.pageId).sel,[]);});
run('VM21','action','adm-refresh',c=>{c.RV.sim='fail';c.admRT(c.RV.pageId).error='error';},(c,f)=>{f();return observed('retry exits persistent simulated error for new attempt',[c.RV.sim,c.admRT(c.RV.pageId).error],['ok',null]);});
run('VM22','fn','copyText',c=>{c.navigator={};c.fallbackCopy=()=>false;},(c,f)=>{f('B');return observed('failed compatibility copy cannot show success',c.calls.some(x=>x[0]==='flash'&&x[1]==='已复制'),false);});
run('VM23','action','agreement-view',c=>{c.S.agreementNoticeOpen=true;},(c,f)=>{f();return observed('opening agreement records parent notice',c.S.agreementFromNotice,true);});
run('VM24','action','agreement-close',c=>{c.S.agreementFromNotice=true;c.S.agreementOpen=true;c.S.agreementNoticeOpen=false;},(c,f)=>{f();return observed('closing child restores original notice layer',c.S.agreementNoticeOpen,true);});
run('VM25','fn','startGift',c=>{c.DB.orders[1].pay_status='已关闭';},(c,f)=>{f('OB');return observed('closed/unpaid gift cannot start processing',c.DB.orders[1].delivery_status,'待处理');});
run('VM26','action','adm-supplier-new',()=>{},(c,f)=>{f();return observed('new draft is not persisted before save',c.DB.suppliers.length,0);});
run('VM27','action','adm-home-banner-up',c=>{c.ADMIN.homeDraft={banners:[{id:'A',sort:0},{id:'B',sort:1}]};},(c,f)=>{f({dataset:{index:'1'}});f({dataset:{index:'1'}});return observed('moving same item upwards twice does not undo first move',c.ADMIN.homeDraft.banners.slice().sort((a,b)=>a.sort-b.sort).map(x=>x.id),['B','A']);});
run('VM28','fn','menuHtml',c=>{c.MENU=[{g:'系统',items:[{id:'ADM-RBAC-01',perm:'rbac',label:'权限'}]}];c.esc=String;},(c,f)=>observed('empty unauthorized group is hidden',f().includes('admin-group-title'),false));
run('VM29','fn','publishHome',c=>{c.ADMIN.homeDraft={version:'home_v3',banners:[{title:'NEW'}]};},(c,f)=>{f();return observed('successful publish switches live config',c.DB.home.banners.map(x=>x.title),['NEW']);});
run('VM30','fn','currentSku',c=>{c.S.skuId='SA2';},(c,f)=>observed('SKU selection reads configured independent price',f().price,158));
run('VM31','action','wb-pay-close',c=>{c.DB.orders[0].pay_status='确认中';},(c,f)=>{f();return observed('closing scan layer does not cancel payment',c.DB.orders[0].pay_status,'确认中');});
run('VM32','fn','continueBuy',c=>{c.S.authStatus='verified_minor';c.DB.orders=[];},(c,f)=>{f();return observed('minor gate blocks order creation',[c.DB.orders.length,c.queue.length],[0,0]);});
run('VM33','fn','mdToHtml',c=>{c.esc=String;},(c,f)=>observed('PlantUML fence maps to registered offline SVG',f('```plantuml\n@startuml\nA -> B\n@enduml\n```').includes('<svg'),true));
// These two fixtures depend on an undeclared event/simulator contract. Retain
// the observed facts, but do not count them as definitive implementation fails.
for(const id of ['VM14','VM21']){
 const r=records.find(x=>x.id===id);r.contract_met=null;
 r.interpretation=id==='VM14'?'Auth-success may explicitly represent a combined login+adult callback; this fixture alone cannot prove that combination is forbidden. Clarify the simulated return contract.':'A persistent fail simulator may legitimately keep retry failing. This injected rt.error is not established as reachable; clarify recovery policy rather than requiring retry to force success.';
}
// Parser-only validation; this does not execute the full HTML.
const syntax=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m,i)=>{try{new vm.Script(m[1]);return {index:i+1,parsed:true};}catch(e){return {index:i+1,parsed:false,error:String(e)};}});
const report={input,sha256:crypto.createHash('sha256').update(raw).digest('hex'),node:process.version,method:'Selected original functions with explicit isolated fixtures; no full app/browser execution.',
 limitations:['Failed contract_met is a local fixture observation, not a browser reproduction. Positive fixtures do not establish whole-feature pass.','VM21 diagnoses retry fixture persistence; a real network retry is not simulated.','VM19 confirms no CSV function call/artifact in this helper; business choice of combined batch export still requires review.'],syntax,records};
fs.writeFileSync(path.join(__dirname,'08_局部函数观察.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({syntax_parsed:syntax.filter(x=>x.parsed).length,observations:records.length,contract_met:records.filter(x=>x.contract_met===true).length,contract_not_met:records.filter(x=>x.contract_met===false).length,contract_undetermined:records.filter(x=>x.contract_met===null).length}));
