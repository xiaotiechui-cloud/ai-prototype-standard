"""Read-only trial2 review: static inspection and isolated function observations.

Does not load a browser or execute any complete supplied HTML/script.
Run from repository root: python -X utf8 docs/reviews/2026-10-20-steam-trial2/review_sources.py
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE.parent / '2026-10-20-steam'))
from inspect_sources import inspect, assigned_json

TRIAL = Path(r'D:\模型汇总\GitHub维护测试\试跑2.0\Steam商城原型交付_V1.4\02_低保真交互原型-试跑2.0.html')
FINAL = Path(r'D:\模型汇总\CDK商城\Steam商城原型交付_V1.0\02_低保真交互原型-最终版本.html')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def function_source(source, name):
    """Functions in this bundle have two-space indentation at module scope."""
    start = re.search(r'^  function ' + re.escape(name) + r'\(', source, re.M)
    if start is None:
        raise ValueError(name)
    tail = source[start.start():]
    # Stop at the function's own closing line, not an indented nested block.
    end = re.search(r'^  }\s*$', tail, re.M)
    if end is None:
        raise ValueError(name + ': closing line missing')
    return tail[:end.end()]


def observations(source):
    node = shutil.which('node')
    if not node:
        return {'status': 'not_run_node_unavailable'}
    names = ['setEnd', 'handleRv', 'handleAct', 'beginBuy', 'renderWebCheckout', 'queryPay', 'submitWebBuy']
    extracted = {name: function_source(source, name) for name in names}
    harness = r'''
const vm = require('node:vm');
const funcs = FUNCTIONS;
const results = [];
function context(names) {
  const o = {id:'A',payStatus:'PENDING',delivery:'CODE',deliveryStatus:'ISSUING',amount:12};
  const c = {S:{lastOrderId:'A',webOrderId:'B',buy:{payChannel:'wechat'},webQR:null},
    RV:{end:'WEB',pageId:'WEB-CHECKOUT-01',state:'DEFAULT',sim:'ok'},
    D:{pages:[{id:'WEB-HOME-01',end:'WEB'}]}, renders:0, marks:0, validations:0,
    render(){this.renders++;}, defaultState:()=> 'DEFAULT',
    orderById:id=>id ? {...o,id} : null,ordersOfCurrent:()=>[o],orderProduct:()=>({name:'p'}),
    art:()=>'',esc:x=>String(x??''),money:x=>String(x),orderSpec:()=> 's',maskLink:x=>x,
    C:(id,html)=>html,btn:(label)=>label,webFrame:(active,html)=>html,
    setToast:()=>{},copy(value){c.copied=value;},navigate(page,state){c.target={page,state};},
    productById:id=>({id,price:12}),specsOf:()=>[{id:'S1',price:12}],
    specsOfProduct:()=>[{id:'S1',price:12}],createOrRestoreOrder:()=>({...o}),
    buyValidation:()=>({ok:true}),markPaid(order){c.marks++;order.payStatus='PAID';},
    queryPay:()=> 'PAID',closeConfirm:()=>{}};
  c.render=()=>{c.renders++;};
  vm.createContext(c);
  for(const name of names) vm.runInContext(funcs[name],c,{timeout:1000});
  return c;
}
function record(id,body){try{results.push({id,...body()});}catch(e){results.push({id,harness_error:String(e)});}}
record('ISO-01',()=>{const c=context(['setEnd']);let error=null;try{c.setEnd('WEB');}catch(e){error=String(e);}
  return {error,end:c.RV.end,pageId:c.RV.pageId,renders:c.renders,
    reproduced:error?.includes('clearConfirm is not defined')&&c.renders===0};});
record('ISO-02',()=>{const c=context(['renderWebCheckout','handleRv']);const states={};
  for(const s of ['QR_PENDING','QR_CONFIRMING','QR_SUCCESS']){c.handleRv({dataset:{rv:'state:'+s}});
    states[s]={state:c.RV.state,webQR:c.S.webQR,modal:c.renderWebCheckout(s).includes('webmodal')};}
  c.S.webQR='PENDING';const positiveControl=c.renderWebCheckout('DEFAULT').includes('webmodal');
  return {states,positiveControl,reproduced:Object.values(states).every(x=>!x.modal)&&positiveControl};});
record('ISO-03',()=>{const c=context(['beginBuy','handleAct']);c.S.currentProductId='P1';
  c.S.buy={specId:'S2',friendLink:'saved',payChannel:'alipay',agreement:true};
  c.handleAct('web-open-buy',{});return {buy:c.S.buy,reproduced:c.S.buy.friendLink===''&&c.S.buy.specId==='S1'};});
record('ISO-04',()=>{const c=context(['handleAct']);c.S.webOverlay='buy';c.S.webBuyStep='agreement';
  c.handleAct('web-auth-cancel',{});return {overlay:c.S.webOverlay,step:c.S.webBuyStep,reproduced:c.S.webOverlay===null};});
record('ISO-05',()=>{const a=context(['handleAct']);a.RV.sim='empty';a.handleAct('web-qr-query',{});
  const b=context(['queryPay']);const order={payStatus:'PENDING'};const comparison=b.queryPay(order,'empty');
  return {webQR:a.S.webQR,marks:a.marks,sharedQueryResult:comparison,reproduced:a.marks===1&&comparison==='UNPAID'};});
record('ISO-06',()=>{const c=context(['handleAct']);c.handleAct('copy-order',{});
  return {visibleOrder:c.S.webOrderId,copied:c.copied,reproduced:c.copied!==c.S.webOrderId};});
record('ISO-07',()=>{const c=context(['handleAct']);c.handleAct('order-query:A',{});
  return {startEnd:'WEB',target:c.target,reproduced:c.target.page==='APP-RESULT-01'};});
record('ISO-08',()=>{const c=context(['handleAct']);c.buyValidation=()=>{c.validations++;return {ok:false,step:'UNVERIFIED'};};
  c.handleAct('web-checkout-pay',{});return {webQR:c.S.webQR,validations:c.validations,reproduced:c.S.webQR==='PENDING'&&c.validations===0};});
record('ISO-09',()=>{const c=context(['handleAct']);c.handleAct('web-go-result',{});
  return {deliveryStatus:'ISSUING',target:c.target,reproduced:c.target.state==='CODE_DELIVERED'};});
record('ISO-10',()=>{const c=context(['submitWebBuy']);c.submitWebBuy();
  return {target:c.target,webQR:c.S.webQR,reproduced:c.target.state==='DEFAULT'&&c.S.webQR===null};});
process.stdout.write(JSON.stringify({method:'isolated_extracted_functions_with_stub_dependencies',
  browser:false,results},null,2));
'''.replace('FUNCTIONS', json.dumps(extracted, ensure_ascii=True))
    run = subprocess.run([node, '-'], input=harness, text=True, encoding='utf-8',
                         capture_output=True, timeout=30)
    if run.returncode:
        raise RuntimeError(run.stderr)
    result = json.loads(run.stdout)
    if not all(x.get('reproduced') for x in result['results']):
        raise AssertionError(result)
    return result


def main():
    source = TRIAL.read_text(encoding='utf-8-sig')
    meta = assigned_json(source, '__DATA__')['meta']
    commit = subprocess.check_output(['git','rev-parse','HEAD'], cwd=ROOT,text=True).strip()
    manifest_at_commit = subprocess.check_output(['git','show',meta['standardCommit']+':standard-manifest.json'],cwd=ROOT)
    docs = assigned_json(source,'DOCS')
    companion = []
    for d in docs:
        p = TRIAL.parent/d['file']
        companion.append({'name':d['file'],'exists':p.exists(),
          'sha256':digest(p) if p.exists() else None,
          'same_decoded_text':p.read_text(encoding='utf-8-sig')==d['md'] if p.exists() else None})
    screenshots = [Path(r'C:\Users\xiaot\AppData\Local\Temp')/('codex-clipboard-'+x+'.png') for x in [
      '8befc16d-97d9-4605-939f-6a32d56a7c69','fb5f26fb-5455-4047-b8cf-8e857aa2c0e2',
      '1e42decd-a9dc-4f2a-bac0-ff95bf755d2a','76aead3d-337e-454b-b05f-df919235e124',
      'cc8f4d6c-382e-4009-8c95-b5268c62df0d']]
    result = {'review_date':'2026-10-20','method':'static_source_embedded_and_companion_documents_user_screenshots_isolated_functions',
      'browser_tests':'not_run_local_file_navigation_previously_blocked_by_browser_security_policy',
      'limits':['No browser click, scrolling, computed style or pixel comparison performed in this review',
        'Adjacent producer probe logs inspected as historical claims; original probe script not inspected or rerun',
        'Final prototype is user-approved project target, not independently certified production software',
        'Isolated function observations do not certify actual DOM/event binding behavior'],
      'baseline':{'head_at_review':commit,'declared_commit_exists':True,
        'manifest_hash_at_declared_commit':hashlib.sha256(manifest_at_commit).hexdigest(),
        'manifest_hash_current':digest(ROOT/'standard-manifest.json'),
        'manifest_hash_declared':meta['manifestHash'],
        'loading_modules':'self_reported_not_proof_of_reading_or_execution'},
      'trial':inspect(TRIAL),'final':inspect(FINAL),'isolated':observations(source),
      'companion_documents':companion,
      'screenshots':[{'path':str(p),'sha256':digest(p),'source':'user_supplied'} for p in screenshots],
      'producer_logs':[{'path':str(p),'sha256':digest(p)} for p in sorted((TRIAL.parent/'_checks').glob('*.txt'))]}
    out = HERE/'evidence.json'
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Read-only evidence:',out)
    for k in ['trial','final']:
        r=result[k];print(k,r['sha256'],len(r['syntax_checks']),'syntax segments',
          sum(x.get('exit_code')==0 for x in r['syntax_checks']),'syntax passed')
    print('Isolated negative observations reproduced:',sum(x['reproduced'] for x in result['isolated']['results']))
    print('Companion texts:',[(x['name'],x['same_decoded_text']) for x in companion])


if __name__=='__main__':
    main()
