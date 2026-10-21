"""Historical analysis generator; do not overwrite approved implementation records."""
from pathlib import Path
from collections import Counter
import json,re,hashlib
from audit_trial4 import FINAL,sha
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2]
if json.loads((ROOT/'standard-manifest.json').read_text('utf-8'))['content_revision'] != 'draft-20261021-trial3-detail':
    raise SystemExit('Historical analysis only: current rules changed; continue from 22/23, do not regenerate approved reports.')
T=Path(r'D:\模型汇总\GitHub维护测试\试跑4.0\项目原型交付_V1.0\02_低保真交互原型.html')
s=T.read_text('utf-8-sig');ls=s.splitlines();data=json.JSONDecoder().raw_decode(s.split('window.DATA=',1)[1])[0]
base=json.loads((OUT/'05_当前基线.json').read_text('utf-8')); inv=json.loads((OUT/'06_当前结构清单.json').read_text('utf-8'))
assert sha(T)==base['inputs']['trial']['sha256']
assert sha(FINAL)==base['inputs']['final']['sha256']
def save(name,v): (OUT/name).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n','utf-8')
def md(name,v): (OUT/name).write_text(v.strip()+'\n','utf-8')
def ev(pattern):
    hits=[{'line':i,'excerpt':l.strip()[:210]} for i,l in enumerate(ls,1) if len(l)<10000 and re.search(pattern,l)]
    assert hits,pattern
    return hits[:3]

# id, title, classification, priority, trial evidence regex, final comparison,
# current observation / implication, solution and independent regression, authority, probes
rows=[
('A01','搜索历史与新开搜索仍缺完整契约','执行错误','P1',r'function freshSession|S.searchDraft=v|value="\$\{esc\(S.searchDraft\)',
 'F有历史去重/置顶/管理/删除能力（F1417、1428、6650、6686、6694、6704）；默认搜索主动清空（F6634）。',
 'T仅有搜索草稿/关键词/排序，提交不维护历史；默认页直接回显searchDraft。09的DEC-SEARCH-001把历史排除仍是待确认，不能当成用户已批准覆盖。',
 '按client10.2补历史与默认页不回填；若确有原PRD冲突先保留冲突记录，不自行采纳裁剪。验收A/B/A、单删/清空、新开和返回分别检查。','client10.2；core1.3；runtime13.5',[]),
('A02','无匹配结果不再回填演示商品','正向差异','P2',r'没有找到相关商品|list=DB.products.filter\(p=>p.name',
 'F无匹配时回填GOODS前几条（F1721、1737），属于反例。',
 'T两端过滤后为空显示无结果，未见旧版本回填示例的分支；这是4.0的静态改善。',
 '保留空结果行为；浏览器提交唯一无匹配词，并与失败/未取得/末页区分。不得从静态分支宣称全搜索通过。','business24.5；quality29.13',[]),
('A03','销量排序使用库存，PC销量选项无排序分支','执行错误','P1',r'searchSort==="sales"|\["sales","销量"\]|searchSort==="latest"',
 'F的商品排序需按数据语义复核，不能以最终版存在控件证明口径成立；历史参数不推广。',
 'T移动端按stock降序；PC展示销量按钮但只有价格/最新排序分支。03第1014行要求无统一口径不展示，09 DEC-HOME-002仍待确认。',
 '未批准销量口径时移除/明确不可用，不以库存代替销量；确认后使用同源sales字段。夹具让销量与库存逆序，两端提交前后均核对。','admin12.4；client10.2；business24.5',[]),
('A04','媒体选择已有稳定ID，但不能等同上传/播放能力','正向差异','P2',r'media.find\(m=>m.id|"product-media"|"wb-media"',
 'F按媒体序列切换（F1362、1759、1769、6742），是可保留职责。',
 'T媒体缩略入口写mediaId并读取当前商品对应项，优于固定三个无动作占位；当前仍是文字/灰图占位。',
 '以0/1/多项、删当前项/重排/切商品验证同一ID。媒体上传、视频和硬件资料属于本项目适用性，未批准视频不新增；硬件未落实列项目兼容缺口。','core3.4；runtime13.5；商城项目契约2',[]),
('A05','后台宣称维护的详情资料缺少生产入口','执行错误','P1',r'RENDERERS.adminProductEdit|维护商品、规格、售价|p.skus.forEach',
 'F有媒体/规格配置入口，但消费端固定价差仍有错误（F3313与1891）。',
 'T商品编辑仅名称、单一售价、类型、状态、库存、说明和须知；规格逐条、媒体、介绍、Steam限制缺编辑入口。静态预置内容能展示不等于配置闭环。',
 '先按本项目范围逐字段列生产者/消费者；补已承诺入口或把不可维护项如实标只读/待接入。修改商品B第二规格及介绍，追到两端和新单。','core3.4；admin16；quality29.10',[]),
('A06','显式失效对象仍会回退其他订单','执行错误','P0',r'function currentOrder|orderById\(S.selectedOrderId\)\|\|DB.orders\[0\]|const o=orderById\(S.activeOrderId\)\|\|DB.orders\[2\]',
 'F部分恢复入口传稳定订单ID，客服仍MOCK_ORDER（F6619、6764、2490），不能整体继承。',
 'T currentOrder、移动详情、PC确认/支付/结果存在首条或第三条回退；VM01失效ID返回OA。不存在与演示初始化被混用。',
 '显式ID失效只报不存在/无权限，不换目标；新增模式独立。用A/B/MISSING分别从列表、支付返回、客服进入并比对数据。','admin12.6；runtime13.5',['VM01']),
('A07','返回只恢复页面，未覆盖查询和滚动现场','执行错误','P1',r'RV.history.push|function back\(|RV.pageId=h.pageId',
 'F来源也只记部分字段（F5574、5581），不能证明完整恢复。',
 'T历史只存pageId/end/state，render重建画布；搜索草稿、页码、位置和焦点没有对应导航快照，PC详情“返回商城”固定回首页。',
 '按来源记录已提交条件、分页及位置，区分新开和返回。搜索中段→商品B→返回，核对对象、条件、位置及焦点；浏览器待测。','runtime13.5；client10.1；STD-RV-001',[]),
('A08','组件选择改为局部更新说明区','正向差异','P2',r'el.id==="compSel"|el.id==="outlineChk"',
 'F pickComp局部更新说明（F5928～5933），可作为职责参考。',
 'T组件选择调用renderComponentDoc/applyOutline，未调用整页render，是较合理的更新路径。',
 '保留局部更新；仍需输入法、文字选区、业务中段滚动和父子弹层打开时逐项实测不变。不得仅凭无render认定所有快照均合格。','STD-RV-001',[]),
('B01','个人订单集合未按平台或账号隔离','执行错误','P0',r'o.platform===S.platform\|\|true|let list=DB.orders|function freshSession',
 'F多套演示订单不能证明真实归属；不能把固定样例当权限实现。',
 'T移动集合过滤带||true；PC订单从DB.orders开始，订单记录缺账号身份。错误预设写“旧账号已清除”不代表真实数据已清。',
 '保留平台与当前展示端分离，同时绑定账号/平台数据范围；游客/切账号/错账号B均不得见旧单或口令码。仅原型内存模拟也要真实执行同样守卫。','runtime13.5；admin12.13；商城项目契约5',[]),
('B02','交易守卫仍不完整：下架与确认中旧单','执行错误','P0',r'function continueBuy|function wbSubmit|x.pay_status==="待支付"',
 'F具备部分旧单恢复入口但不代表资格重验与所有守卫通过。',
 'T两端提交仅查登录/实名/协议/手机/链接；未核对售卖、库存和稳定规格归属。只恢复待支付单，确认中订单可另建。VM12/13分别生成下架单和第二笔单。',
 '提交与继续支付前重验资格/商品/规格/旧支付尝试；确认中先查同单。保留草稿不保留资格结论，服务端契约另留待联调。','runtime13.3/13.6；商城项目契约4',['VM12','VM13','VM32']),
('B03','异步回调混用新会话与旧对象','执行错误','P0',r'function continueBuy|const res=S.payQueryResult|"wb-pay-scan"',
 'F普通token有隔离但重置重用有ABA风险（F3531、3539～3540）；不推广脆弱计数器。',
 'VM09发起A后切B，回调创建product=A但sku=SB/platform=B/amount=260；VM10发起A的查询后切B，回调把B改已支付。不是仅少一个字段名。',
 '发起时固定端/账号/对象/规格/金额/请求代次；离页、关闭、重置失效。真实入口覆盖慢A快B及A未回→重置→B→A回，不改B/loading/提示/导航。','runtime13.6',['VM09','VM10']),
('B04','支付与交付仍被自动合并，PC还可复制样例码','执行错误','P0',r'if\(o.delivery_type==="CODE"\)\{ o.delivery_status|STEAM-DEMO-XXXX|^  "wb-pay-scan":',
 'F查询已付直接DELIVERED（F6994～7009），也是反例。',
 'T支付查询/扫码定时器直接发码并标已交付；PC结果DELIVERED无code时回填样例可复制。界面虽写“支付成功不等于交付”，动作未遵守。',
 '支付查询只写支付事实，独立供应商/交付模拟结果驱动码与状态；缺码显示发码中/异常，不可复制演示码。分别测已付未交付、取码失败与GIFT。','STD-ACT-001；business24.5；商城项目契约4',['VM11']),
('B05','明确未支付查询与重新查询未形成闭环','执行错误','P1',r'else if\(res==="unpaid"\)|"wb-pay-query"|"result-refresh"',
 'F应按可信结果区分未支付/未知，不以用户选择写结果；旧已付捷径仍是反例。',
 'T未支付分支跳回确认页却未同步原单确认中状态；wb-pay-query只改CONFIRMING且没有查询结果回调，部分“刷新”只提示已刷新。',
 '模拟也须明确发起/返回/超时与可恢复动作；未知不变成未付，明确未付按允许迁移更新且防重复支付。检验数据与可用入口，不只toast。','runtime13.3/13.6；quality29.10',[]),
('B06','协议子层关闭未回原须知，Esc会先命中移动处理器','执行错误','P1',r'^  "agreement-(view|close)":|else if\(kind==="auth"',
 '商城已批准须知→协议→回须知与Esc仅栈顶；不把最终版任意回商品实现当正确。',
 'T记录agreementFromNotice但关闭不还原agreementNoticeOpen；VM24为false。公共Esc先按kind=auth/payret调用移动处理器，WEB分支靠后，需逐端复核错误出口。',
 '按宿主端与真实栈顶解析统一关闭生命周期；保存父层、来源、滚动和触发焦点。分别测按钮/Esc/遮罩；一次只关闭一层。','STD-RT-001；商城项目契约3',['VM23','VM24']),
('B07','协议同意只有全局布尔，不能证明同意当前版本','执行错误','P1',r'agreementAccepted:false|S.agreementAccepted=true|agreement_version:DB.currentAgreement',
 'F历史版本与前台固定文案曾不同源（F2020、2026、7303、7314），不继承。',
 'T正文读取当前版本有改善，但同意仅置true；后台发新版本/换商品平台后仍复用，并在新单写最新版本。09 DEC-AGREEMENT-002说“按交易上下文”，实现未绑定。',
 '项目明确同意作用域及版本变更策略，保存真实acceptedVersion/上下文；不得默认用户已同意未读新版。历史订单保留原版本，正式协议文字仍待专项确认。','core3.4；runtime13.5；项目04/05/09',[]),
('B08','PC复合认证模拟的回执含义需要明确','实现歧义','P1',r'^  "wb-auth-success":|^    S.authStatus="verified_adult"|function setState',
 '最终版同样必须按登录/实名/成年独立条件核对；不以一张认证成功图替代。',
 'VM14未登录未实名时auth-success一次改为已登录且成年；该动作也可能合法代表复合平台认证成功，不能仅因合并调用判错。缺口在回执范围与资格来源未明确；setState只改RV.state，一些结果预设未同步业务事实。移动未成年门禁VM32正确，不能代表PC。',
 '声明登录、资格独立结果或明确可信复合回执；若仅登录成功不得推出成年。保留合法复合流程，补登录成功但资格未知/未成年夹具；预设与真实主链分开。','ui8；runtime13.3；quality29.10',['VM14','VM32']),
('C01','首页草稿隔离改善，但失败发布仍直接生效','执行错误','P1',r'function saveHomeDraft|function publishHome|DB.home=clone',
 'F采用直接保存契约（F7127～7158），并非所有模块都要加发布。',
 'T草稿保存未改DB.home，VM07通过；发布正常VM29切换。publishHome不处理fail模拟，VM08在fail仍替换生效值并提示发布。',
 '保留本模块草稿发布；定义发布失败原子性/恢复，别把所有模块改为相同方式。未发布、生效失败、成功逐端检查配置版本。','admin12.11；core3.4',['VM07','VM08','VM29']),
('C02','普通商品保存会抹平独立规格价','执行错误','P0',r'p.skus.forEach|function saveProduct|function currentSku',
 'F规格面板使用固定价差（F1891、1915），也不合格。',
 'T前台currentSku读取独立价，VM30读158；后台即使只改名称仍给所有SKU写基础price，VM02得到98/98。订单保留amount/sku_id但列表与详情仍从当前productById取名称，改目录会改变旧单显示；前台读对不等于生产者与快照正确。',
 '商品与规格分层维护，稳定子项ID；普通商品编辑不得覆盖未声明规格字段。按项目契约保存成交名称/规格描述快照，历史缺快照不伪造补齐。用98/158或100/260测改名、编辑第二规格、新旧订单全链。','core3.4',['VM02','VM30']),
('C03','控件字符串0被当true，库存必填原因未校验','执行错误','P1',r's.enabled=f.enabled|f.sellable\?"ON"|function saveStock',
 'F的空值/数值同样按契约验证；不以不同控件外观推定类型正确。',
 'DOM select写字符串；saveSupplier用!!f.enabled，saveStock用真值判断，"0"仍启用/可售。库存原因虽标必填却未拒空，负数/NaN等边界未完整校验。',
 '在输入边界按声明类型解析枚举/布尔/数值，非法值拒绝并留草稿；强制字段空白不能静默保存。覆盖0/1/false/空/非法。','business24.5；admin12.11',['VM04','VM05']),
('C04','新增供应商草稿提前写正式集合','执行错误','P1',r'"adm-supplier-new"|"adm-close-drawer"',
 '最终版查看/新增也按独立草稿核对，不继承演示预置记录为正确行为。',
 'T点新增即DB.suppliers.push且未打开编辑；取消/关闭只清drawer。VM26在尚未保存时正式集合已多一条空映射。',
 '用独立新增草稿，校验保存才写正式集合；取消不改列表/计数/配置/审计。以A/B两映射验证编辑对象失效不能转新增。','admin12.6/12.11；runtime13.5',['VM26']),
('C05','审计before来自已修改引用','执行错误','P1',r'writeAudit\(old\?|writeAudit\("客服配置保存|function writeAudit',
 'F敏感动作也需真实原值/目标，存在记录不代表审计真实。',
 'T saveProduct先原地修改old，再取old.name/price作before；VM03得到NEW/120。客服保存before与after都从修改后DB读取，部分动作使用占位旧值。',
 '执行前冻结必要原值，成功后记录实际after/操作者/目标；拒绝不写业务事实。不要为所有普通浏览添加业务埋点。','admin12.13',['VM03']),
('C06','人工排序未改拖拽，原上移还会反复交换','执行错误','P1',r'"adm-home-banner-up"|"adm-home-banner-down"|广告标题</th>',
 '最终版排序样式不高于用户已批准的拖拽规则；按人工展示顺序归类，查询排序不改拖拽。',
 'T操作列仍上移/下移；未见drag/pointer拖拽入口。原数组不重排而按sort绘制，VM27同一B上移两次反而回原序。',
 '操作列提供“排序”把手、插入位和键盘/触屏替代，稳定ID重排草稿、保存/发布生效；失败可恢复。不靠仅换按钮文字修复。','admin12.6；forms-and-layers',['VM27']),
('C07','客服账号与文案已消费，服务时间仍固定说明','执行错误','P1',r'DB.service.fallback|服务时间待运营确认|DB.service.hours=f.hours',
 'F客服使用固定内容及MOCK_ORDER（F2478、2490、2493），不能推广。',
 'T公共/订单客服已消费wecom_id/fallback并按serviceOrderId取单，比旧固定文案好；保存hours后前台仍说待运营确认；清空fallback用||吞掉，表单模型与回显也需复核。',
 '逐字段追生产→消费，已确认服务时间才展示承诺；空允许则保留、必填则拒绝。公共入口不带旧单，订单B只带B。','core3.4；business24.5；runtime13.5',['VM06']),
('C08','权限空分组已经过滤，但不能据此判鉴权通过','正向差异','P2',r'filter\(g=>g.items.length\)|function menuHtml|const groups=',
 '最终版与旧版空菜单表现不再作为依据；本项按当前已批准admin12.2核验。',
 'T先过滤授权项再过滤空组，VM28无权时不渲染系统标题；有权时系统下有权限/审计项属于合理差异。',
 '保留过滤；逐角色查空/非空、菜单搜索与折叠。执行前重验另见D01，不把隐藏组当权限边界。','admin12.2/12.13',['VM28']),
('D01','敏感动作与确认回调缺执行时重验','执行错误','P0',r'^  "adm-confirm-ok":|function refundTransition|function codeReplace',
 'F含NO_PERM文案不代表敏感动作全重验（F7012、7618、7640等旧报告）。',
 'T全局分发直接调用handler；go无后台登录/权限拦截，多数helper只查对象存在。确认后切角色/目标状态变化仍可能写入；此为内存模拟缺口，不宣称线上提权。',
 '执行前按当前账号/角色/范围/目标/状态校验，捕获确认对象身份；拒绝无业务写入。真实服务端鉴权仍是独立待联调项。','admin12.13；STD-ACT-001',['VM16','VM25']),
('D02','退款拒绝态仍能直接执行成功','执行错误','P0',r'function refundTransition|action==="execute"',
 'F分处理中及渠道结果（F7427～7445），仅为较好阶段设计，不等于真实回执已验证。',
 'VM16已拒绝记录调用execute后变成功；无当前允许迁移守卫。正常模拟结果可存在，但不能绕过审核/幂等并宣称资金完成。',
 '原型按状态机拒绝不允许迁移；退款中/未知/失败先核查，重复不重复执行。明确模拟回执，不要求接真实资金完成本轮设计审查。','admin12.13；runtime13.6；项目04/05',['VM16']),
('D03','通知重试没有重查订单/交付与去重状态','执行错误','P1',r'function notifyRetry|重试前会校验订单与交付记录',
 'F仅有通知记录和重试入口不能证明去重与实时内容已闭环。',
 'T确认文案承诺校验，helper只找task后重试并写受理。VM17已经受理任务retry_count仍递增；未检查退款、旧码替换或当前账号。',
 '按任务状态和交付快照决定重试/核查；内容过期不继续旧消息，受理不等于送达。真实平台回执不计作原型通过。','core3.4；admin12.13；STD-ACT-001',['VM17']),
('D04','单项完成错误推进整个批次，开始处理缺守卫','执行错误','P1',r'function completeGift|b.status="已完成"|function startGift',
 'F区分导出/处理/完成（F7596～7602）但不能据此推断聚合规则已执行。',
 'VM18批次A/B都处理中，仅完成A后批次已完成而B仍处理；VM25关闭订单仍可开始。项目批次有items成员，完成并非只改文案。',
 '先明确父状态按成员汇总还是独立审批；本商城以逐项交付事实汇总，不提前宣称整体完成。部分失败列ID，重试只处理允许项。','admin12.8/12.11/12.13；项目批次契约',['VM18','VM25']),
('D05','赠送导出只建批次，没有导出文件','执行错误','P1',r'function exportGiftOrders|已创建批次|function downloadCSV',
 'F明确模拟文件（F7596～7602）；模拟文件与真实导出均不可互相冒充。',
 'T通用CSV确实建Blob并说已发起，较好；赠送导出helper只创建批次和关联，不调CSV或产生文件，VM19为0。允许组合动作但按钮/确认应写清副作用。',
 '依批准契约实现“导出并建批次”或改为“创建批次（模拟）”；两种都不代表交付完成。核对产生物、所选ID、批次、取消和下载受阻反馈。','STD-ACT-001',['VM19']),
('D06','审计日期与统计筛选未参与集合计算','执行错误','P1',r'filterFn:\(a,c\)|const metrics=\[\["订单量",DB.stats|DB.stats.by_platform',
 'F统计集合也有混用风险（F5003～5046），不能仅按卡片多少比较。',
 'T审计有起止日期控件但filterFn只查对象/人；统计筛选渲染却直接读取固定DB.stats，不随提交变化，业务变更后也未重算。全局指标可以保留，但不能伪装筛选结果。',
 '声明每个列表/指标/导出的集合、时间字段、公式，所有可编辑筛选真实参与；固定演示要明确不可用。用不同日期/平台及退款状态对照预期。','admin12.4/12.5；core3.4；queries-and-async',[]),
('D07','标注仅当前页却保留跨页选择','执行错误','P1',r'仅当前页|^  "adm-page":|^  "adm-selall":',
 'F翻页清选择并检查页码上界（F7029～7035），是可用参考。',
 'T adm-page只检查n>=1且不清sel；VM20翻页后OA仍选中，批量条却显示仅当前页。动作内无最大页保护不等于UI必能点999。',
 '遵守当前页策略或明确批准跨页选择；翻页/筛选/页签/每页条数后核对范围、半选及批量目标。对象应有不同ID，勿只一页数据。','admin12.8；runtime13.7',['VM20']),
('D08','本地同步查询可不造异步，故障预设与重试分开','合理替代','P2',r'"adm-refresh"|"adm-query"|RV.sim==="fail"\|\|rt.error',
 'F普通请求有token流程但有重置边界风险，非整体优胜。',
 'T通用列表从本地DB同步过滤，adm-query提交draft后重绘，不需要为了字段名合规添加请求token。VM21保持fail模拟后重试仍fail；这可属于故障持续，不能把注入的rt.error说成真实入口已复现的缺陷。支付查询无结果另见B05。',
 '说明同步查询、故障模拟持续与恢复策略；真实存在的购买/支付定时器仍按B03隔离。验证真实重试可发起、条件保留、再次失败/成功可辨，不强迫重试自动转成功。','runtime13.6/13.7；admin12.4',['VM21']),
('E01','9份主文档内外同源，较最终版改善','正向差异','P2',r'window.DATA=',
 'F只有06内外一致，其余8份有差异（旧10_交付物局部核对.json）；本轮最终版HTML哈希未变。',
 '当前T9份Markdown经仅BOM/换行规范化后全部一致；07 JSON保存外部原字节和内嵌UTF-8哈希。9份下载动作从DATA.docs原md建Blob。',
 '保留构建同源；下载还要真实入口复测。字节相同不代表语义正确，E08单独检查；本项不替代交付物验收。','core3.4；reader19.5/19.7；quality29.13',[]),
('E02','隐藏锚点会让组件覆盖检查出现假阳性','执行错误','P1',r'function addRegistryAnchors|div.hidden=true|data-component-anchor',
 'F有组件定位职责，但ID/十节/计数都不能证明实际组件可操作。',
 'T把未出现的注册组件补为hidden span；check-all以DOM/锚点存在计0缺失。该方法可做元数据索引，却不能证明当前状态的真实组件已渲染。',
 '按页面状态列必需/条件/不适用组件，分开元数据存在、真实可见/可达、处理器和结果证据；不得把hidden锚点计作动作入口覆盖。','quality29.10/29.13；STD-QA-001',[]),
('E03','独立图示能缩放，阅读器仍把PlantUML当源码','执行错误','P1',r'function mdToHtml|data-lang=|function applyDiagramZoom',
 'F Markdown围栏调用图示注册渲染（F1205～1207、7717～7771）；缩放仍须测实际尺寸。',
 'T独立图示18张均有SVG且缩放函数改实际宽度；但mdToHtml对所有围栏输出pre/code，VM33未产生SVG，文档内不能按要求读图。',
 '阅读器按源/图ID映射离线SVG，保留图源查看；核对ID前缀和源/SVG/表格语义。50/100/200测宽度及长图边界，数量减少不自动失败。','reader18.3/18.7/19.3/19.7',['VM33']),
('E04','阅读历史只有文件名，文内MD链接被吞掉','执行错误','P1',r'const cur=RV.reader.file|const prev=RV.reader.hist.pop|if\(/\^\(https\?:',
 'F保存阅读位置并生成目录（F7790～7846），但焦点仍需真实触发核验。',
 'T历史只存file，切文档重建正文，未恢复A中段；inlineMd只保留http/#/mailto，相对MD链接退化文本。invalid file还默认首文档。',
 'A→B→返回恢复位置/目录；MD内部跳转由阅读器处理、非法目标报错。保留下载原MD的正确职责，不擅自用浏览器外链代替。','reader19.4/19.6',[]),
('E05','滚动条隐藏与画布宿主有改善，层栈仍不完整','执行错误','P1',r'phone-scroll\{|\.biz-overlay\{|const ov=\$\(".biz-overlay"',
 '最终版布局只作本商城参考，旧截图和旧通过不作为本轮实测。',
 'T有隐藏滑块、绝对定位业务层、WEB两栏与窄容器规则；提供截图也可见灰度布局。Esc找第一个overlay而非栈顶；业务层未见完整背景锁/恢复/Tab循环。当前浏览器打开被策略拒绝。',
 '保留宿主定位和灰度外观，按真实栈顶/关闭出口落实STD-RT-001；窄矮容器测主动作可达、滚动不中断、不遮评审区。不能凭CSS说滑动条问题全部解决。','STD-RT-001；ui15.1/15.5',[]),
('E06','复制失败仍提示成功','执行错误','P1',r'function copyText|fallbackCopy\(text\); done|document.execCommand',
 'F空catch后提示成功（F6785～6790），是共同反例。',
 'T Clipboard拒绝后尝试兼容复制，但无论兼容false/异常都会done；VM22失败桩仍见已复制。正常下载文案“已发起”则较准确。',
 'fulfilled/明确true再说成功，失败给可选文本及手动路径；原型不必证明系统之外动作完成。覆盖拒绝/无API/false/异常/B对象。','STD-ACT-001',['VM22']),
('E07','附带浏览器记录要按哈希和断言重新归属','证据缺口','P1',r'window.DATA=',
 'F自述验证同样不能直接算本轮通过；不能用最终版认可身份替代证据。',
 'T提供86项浏览器结果、截图和封存说明，这是证据改善。当前封存文档与结构记录均已更新为本轮f91c哈希，汇总也已一致为86/86；早期不一致不能报为现存缺陷。现有正向断言未覆盖本轮对象隔离/状态守卫等反例，“锚点覆盖”另见E02。',
 '保留提供方已有执行与当前版本声明，但不记作本轮复测，也不把86个局部断言当91条TC全部完成；按run/对象/步骤/预期补风险反例及变化后的回归，不能只更新哈希。','quality29.9～29.14',[]),
('E08','同源文档仍含未批准裁剪和行为矛盾','执行错误','P1',r'window.DATA=',
 'F组件十节齐全亦含搜索历史/规格等反例；组件数量不是质量标准。',
 'T03称排序在提交前，结果页却有排序；09历史不纳入仍待确认；换码称保留旧记录，VM15只有覆盖当前code；统计/通知承诺也与动作不符。73个定义与70个被引用定义是不同口径，不直接判缺3个。',
 '按已批准需求/项目覆盖→01/03/04/05→真实动作→07/08逐项校正。先解决含义冲突再重建同源；新增交付记录须有稳定身份/来源链，不以toast冒充事实。','quality29.13；core1.3/3.4',['VM15']),
]

findings=[]
for row in rows:
    id,title,classification,priority,pat,final,obs,action,authority,probes=row
    # DATA's giant embedded line is never duplicated as evidence.
    evidence=[{'line':next(i for i,l in enumerate(ls,1) if l.startswith('window.DATA=')), 'excerpt':'DATA metadata/JSON pointers; embedded body not copied'}] if pat=='window.DATA=' else ev(pat)
    findings.append(dict(id=id,title=title,classification=classification,priority=priority,trial_evidence=evidence,final_comparison=final,observation=obs,solution=action,authority=authority,probes=probes,browser_retested=False))
save('10_差异与规则映射.json',{'input_sha256':sha(T),'findings':findings,'classification_counts':dict(Counter(x['classification'] for x in findings))})
titles={'A':('11_客户端内容与导航.md','第一批：客户端内容、媒体与导航'),'B':('12_购买支付与订单上下文.md','第二批：购买、支付与订单上下文'),'C':('13_后台配置生产与消费.md','第三批：后台配置生产与消费'),'D':('14_查询权限与批量操作.md','第四批：查询、权限与批量操作'),'E':('15_评审工具与交付证据.md','第五批：评审工具与交付证据')}
for group,(name,title) in titles.items():
    items=[x for x in findings if x['id'].startswith(group)]
    chunks=[f'# {title}',
      '当前T输入和唯一行号基线见[05 JSON](05_当前基线.json)；F最终版哈希已复核，复用前轮已保存局部证据，不重复展开。T完整路径为 `'+str(T)+'`；F为 `'+str(FINAL)+'`。以下是静态/隔离观察，不是本轮浏览器复测结果。',
      '## 本批摘要（不超过一页）',
      '本批8项，分类为'+ '、'.join(k+str(v)+'项' for k,v in Counter(x['classification'] for x in items).items())+'。优先修已有规则未落实，最终版共同缺陷不推广。详细条目与验收如下。']
    for x in items:
      evidence='；'.join('T:'+str(e['line'])+' `'+e['excerpt'].replace('`','\u2032')+'`' for e in x['trial_evidence'])
      chunks.extend([f"## {x['id']} {x['title']}（{x['priority']} / {x['classification']}）",
       '- **两版比较**：'+x['final_comparison']+' '+x['observation'],
       '- **证据**：'+evidence+('；隔离观察 '+', '.join(x['probes']) if x['probes'] else '')+'。',
       '- **可执行处理/验收**：'+x['solution'],
       '- **归口**：'+x['authority']+'。已有原则优先修实现/补回归；不直接新建同义STD。'])
    md(name,'\n\n'.join(chunks))

# Semantic responsibilities, not counts or ID-name equality.
domains=[('首页/内容配置','HOME'),('搜索/结果/历史','SEARCH'),('商品资料/规格/媒体','PRODUCT|GOODS'),('购买面板','PANEL|BUY'),('首次提醒','NOTICE'),('登录/实名/成年','AUTH'),('协议/须知','AGREEMENT|AGREE'),('手机号','PHONE'),('确认订单','CHECKOUT'),('支付/返回查询','PAYRET|PAY-'),('支付交付结果','RESULT'),('订单/归属/快照','ORDER'),('我的/账号','PROFILE|MINE'),('客服/来源','SERVICE'),('容器异常','CONTAINER'),('后台登录','LOGIN'),('库存','STOCK'),('赠送/批次','GIFT'),('口令码/换码','CODE'),('退款','REFUND'),('后台权限','RBAC'),('审计','AUDIT'),('统计','STATS|STAT-'),('支付核查/通知/供应商','PAYCHECK|PAYCHK|NOTIFY|SUPPLIER')]
mapped=[]
for name,pattern in domains:
    a=[p['id'] for p in data['pages'] if re.search(pattern,p['id'])]
    b=[p['id'] for p in inv['final_reused']['pages'] if re.search(pattern,p['id'])]
    mapped.append({'responsibility':name,'trial_pages':a,'final_pages':b,'coverage':'registered responsibility mapping; not all states executed'})
unmappedT=[p['id'] for p in data['pages'] if not any(p['id'] in d['trial_pages'] for d in mapped)]
unmappedF=[p['id'] for p in inv['final_reused']['pages'] if not any(p['id'] in d['final_pages'] for d in mapped)]
assert not unmappedT and not unmappedF,(unmappedT,unmappedF)
save('16_职责覆盖.json',{'domains':mapped,'trial_pages':len(data['pages']),'final_pages':len(inv['final_reused']['pages']),'unmapped_trial':unmappedT,'unmapped_final':unmappedF,
 'semantic_mapping_note':'Embedded/merged pages can cover multiple domains. A missing standalone page is not by itself missing behavior. WEB phone/notice/service and dedicated suppliers are compared by responsibility.',
 'all_206_states_browser_executed':False,'unknowns':['Original approved PRD not independently supplied/read this round; self-declared references kept separate.','Whole visual/keyboard/touch/host behavior not reproduced.','Supplier/payment/platform integration, real permissions, performance remain unverified.']})
matrix=['# 本轮回归验收矩阵','40个父场景与33项局部观察分开统计。下面全部为**待执行**浏览器回归；提供的86条原日志不是本轮执行，也不能替代逐端及风险分支。每条需展开适用端/状态及数据夹具，记录预期来源、实际结果、截图/日志、缺陷和复测。','| 场景 | 来源 | 重点预期/操作 | 方法/当前状态 |','| --- | --- | --- | --- |']
for x in findings: matrix.append('| R4-'+x['id']+' | '+x['authority']+' | '+x['solution'].replace('|','／')+' | 浏览器真实入口；未执行 |')
matrix.extend(['','报告统计：40父场景已计划；本轮浏览器执行0、通过0、失败0、未执行40。33项VM观察中7项满足、24项不满足局部预期，2项因复合认证/持续故障契约未明确而不判通过或失败；这是目的性抽样，不是总体通过率。6段script仅语法解析通过。','本轮任务为分析和提炼，不修原型、不重新生成。现有P0实现不符合点与必要浏览器证据缺口未处置，不能交付“试跑验收通过”结论。'])
md('17_回归验收矩阵.md','\n\n'.join(matrix[:3])+'\n\n'+'\n'.join(matrix[3:]))

# Inspect supplied evidence as data; no pass is inherited into current execution.
checks=T.parent/'_checks';files=[]
for p in checks.rglob('*'):
 if p.is_file():files.append({'path':str(p),'sha256':sha(p),'bytes':p.stat().st_size})
decl=[]
for p in checks.glob('*'):
 if p.suffix in ['.txt','.md','.json']:
  for i,l in enumerate(p.read_text('utf-8-sig').splitlines(),1):
   if re.search(r'[a-f0-9]{64}|85/85|86/86|"checks"|"pass"|Chrome/',l):decl.append({'path':str(p),'line':i,'excerpt':l[:300]})
brow=json.loads((checks/'browser-check-result.json').read_text('utf-8-sig'))
save('09_随附证据归属核对.json',{'current_input':{'path':str(T),'sha256':sha(T)},'files':files,'declarations':decl,'browser_summary_as_provided':brow['summary'],
 'assertions':[{'name':x['name'],'claimed_pass':x['pass']} for x in brow['results']],
 'our_browser_retest':{'executed':False,'reason':'Browser URL security gate denied file protocol; no workaround attempted'},
 'disposition':'Supplied historical execution data retained; exact run/artifact and assertion strength require reconciliation. Not counted as this review execution.'})

case=json.loads((ROOT/'reference/golden/CASE-TEMPLATE.json').read_text('utf-8'))
case.update(case_id='steam-trial4-20261021',status='candidate-unverified',scope=['CLIENT','WEB','ADM'],
 prd={'path_or_uri':None,'version':'V1.4 (self-declared)','sha256':None},
 standard={'rule_version':'V3.0','content_revision':base['content_revision'],'commit':None,'module_hashes':[]},
 trial={'path_or_uri':str(T),'sha256':sha(T)},
 accepted_reference={'path_or_uri':str(FINAL),'sha256':sha(FINAL),'accepted_by':'User named final reference','acceptance_scope':'Reference for semantic comparison; not whole-code approval'},
 confirmed_overrides=[{'decision':'2026-10-21 user confirmed using current filename after input changed','scope':'analysis input only'}],
 differences=[{'id':x['id'],'classification':x['classification'],'final_decision':'review-only; no new active-rule approval','authority':x['authority'],'regression':['R4-'+x['id']]} for x in findings],
 evidence_locations=['05_当前基线.json','08_局部函数观察.json','09_随附证据归属核对.json','10_差异与规则映射.json'],
 unverified=['Independent generation baseline/PRD not established; self-reported metadata in supplied checks is evidence to reconcile, not current HEAD backfilled as generation.','Current-browser real-entry regression not executed.','No golden code promotion.'])
case['generation_baseline_as_reported']={'source':str(checks/'验证证据_2026-10-21.md'),'note':'See 09 declarations; independently authenticated PRD/original generating workspace unavailable.'}
save('19_黄金案例候选.json',case)

md('00_审查摘要.md',f'''# 试跑4.0与最终版：细节比较及规则提炼

状态：分析完成，规则澄清待审；不是原型修复或验收通过。仓库起始HEAD `{base['head']}`，内容修订仍为 `{base['content_revision']}`。

用户确认后采用 `{T}`，SHA-256 `{sha(T)}`，{T.stat().st_size:,}字节；原始指定文件已在审查中移除，前阶段清单保留，见[输入变动](04_输入变动记录.md)。F最终版为 `{FINAL}`，哈希与原清单一致。

| 项目 | 试跑4.0 | 最终版 | 解释 |
| --- | ---: | ---: | --- |
| 注册页 | 51（18/14/19） | 41（17/8/16） | 按客户端/PC/后台；合并与拆页先映射职责 |
| 注册状态 | 206 | 152 | 不等于执行数 |
| 组件实例 | 242 | 见复用清单 | 与定义数量分开 |
| 定义引用/文档声明 | 70/73 | 192定义 | 口径不同，不据数量判断优劣 |
| 图示 | 18 | 35 | 需核关键分支，不要求复制数量 |
| 外部与内嵌MD一致 | 9/9 | 1/9 | 仅BOM/换行规范化；原字节哈希保留 |

已保存五批40项：[客户端](11_客户端内容与导航.md)、[购买支付](12_购买支付与订单上下文.md)、[后台配置](13_后台配置生产与消费.md)、[查询操作](14_查询权限与批量操作.md)、[工具证据](15_评审工具与交付证据.md)。其中5项正向差异、32项执行偏差、1项实现歧义、1项合理替代、1项证据缺口；混合条目另有局部改善，不重复计数。覆盖24职责域、T51/F41注册页，见[职责映射](16_职责覆盖.json)，不是全206状态实测。

明确改善：无匹配不补商品、媒体ID切换、组件说明局部更新、首页草稿隔离、权限空组过滤、9份文档同源。重要不符合点：订单归属/失效ID回退、迟到回调串对象、支付直接交付、规格价格被抹平；人工排序仍未落实拖拽。最终版的固定价差、空结果补样例及支付直达交付作为反例保留。

当前哈希下完成33项[原函数隔离观察](08_局部函数观察.json)：7项满足局部预期、24项不满足、2项契约不足不判成败；6段脚本语法解析通过。提供方已有86条浏览器记录/截图且当前封存哈希一致，保留其执行身份和断言范围；本轮浏览器工具拒绝file协议，真实入口回归0项。[40个父场景](17_回归验收矩阵.md)全部待执行，不能以现有正向断言掩盖新发现反例。

[规则提炼待审稿](18_规则提炼与方案_待审.md)区分已有规则执行清单、两处可选澄清和商城项目决策；不再重复增加同义强制规范。活动standards、manifest、archive和原型均不由本轮修改；没有Commit/Push/Tag/Release。后续从本摘要、10 JSON和专题继续；仅输入/规则哈希变化或待执行场景需定向重读。

检查记录：[一致性与保护检查](21_一致性与保护检查.json)核对源码定位、计数、输入及活动模块保护；随附证据自述的13个模块哈希均与当前一致，但不因此宣称原生成过程/原PRD已独立核实。仓库maintain verify与git diff --check通过；这些检查不替代浏览器验收。
''')
print(json.dumps({'findings':len(findings),'classifications':dict(Counter(x['classification'] for x in findings)),'domains':len(mapped),'pages':[len(data['pages']),len(inv['final_reused']['pages'])],'input':sha(T)},ensure_ascii=False))
