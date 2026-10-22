"""Build compact review artifacts from sealed inventories and current observations.
Does not run or alter prototypes, previous reviews, or active standards.
"""
from pathlib import Path
from collections import Counter
import json,re,hashlib
from audit_trial5 import OUT,ROOT,TRIAL,FINAL,sha,save

def read(name): return json.loads((OUT/name).read_text('utf-8'))
def md(name,text): (OUT/name).write_text(text.strip()+'\n','utf-8')
baseline=read('01_基线.json'); inventory=read('02_结构清单.json'); probe=read('08_局部函数观察.json')
assert sha(TRIAL)==baseline['inputs']['trial']['sha256']
assert sha(FINAL)==baseline['inputs']['final']['sha256']
old=ROOT/'docs/reviews/2026-10-21-steam-trial4'
cached={x['id']:x['final_comparison'] for x in json.loads((old/'10_差异与规则映射.json').read_text('utf-8'))['findings']}
findings=[]
def item(id,title,kind,lines,reference,observation,authority,fix,accept,probes='',priority='P1'):
    findings.append(dict(id=id,title=title,classification=kind,priority=priority,
        trial_evidence=[dict(path=str(TRIAL),line=n) for n in lines],
        final_comparison=cached.get(reference,reference),final_evidence_source='SHA匹配后复用trial4最终版定位缓存；不继承试跑4结论或浏览器通过',
        observation=observation,authority=authority,solution=fix,acceptance=accept,
        probes=probes.split() if probes else [],browser_retested=False))

item('A01','PC绑定按钮误接移动端动作','执行错误',[2134,1828,1775,2287],'手机号职责参考APP-PHONE-01；WEB新增兜底页不要求与最终版页数一致。',
 'WB-PHONE-01渲染phone-bind-submit，未接已定义的wb-phone-bind-submit；原移动处理函数成功后跳CL-CHECKOUT-01。VM34复现导航目标，但没有执行真实浏览器点击。',
 'core3.3；runtime13.3/13.5；STD-ACT-001','绑定正确的WEB入口或使用携带端与来源的共享动作；成功恢复WEB购买现场。',
 '从WEB商品发起未绑定流程，发送/输入验证码并提交；保留商品、SKU和来源，进入WEB结算；移动同路径回归。','VM34')
item('A02','验证码通过状态未绑定发送目标','执行错误',[1118,1814,1833],'手机号属于本轮新增兜底实现；不把最终版固定模拟当真实短信契约。',
 '发送仅留下全局phoneCodeSent；号码A发送后改号码B仍可通过模拟验证码。05文档另声明sms_send_id与目标字段。该问题限于离线资格模拟，不是已证实的短信服务漏洞。',
 'runtime13.5/13.6；core3.3','发送上下文关联目标号码、账号/来源及请求身份；变更后按项目契约失效或重验。保留模拟标识。',
 'A发送后改B、切账号/平台、重新发送及迟到响应；旧资格不能认证新目标。有效期和次数按DEC-PHONE-002确认，不预设数值。','VM35')
item('A03','显式失效对象静默回退首条','执行错误',[756,758,2202,2298],'A06',
 '商品、订单及WEB详情/支付存在首条或固定下标回退；失效ID可转为操作另一条记录。',
 'admin12.6；runtime13.5','区分初次默认选择与显式无效ID，后者显示失效并停止写入/复制/支付。',
 '分别用不存在商品/订单ID和删除后旧入口，确认无其他记录详情或副作用；空集合不报未捕获错误。','VM01 VM43')
item('A04','异步建单和支付查询串用当前对象','执行错误',[1755,1775,1846,1852],'B03',
 '建单混合请求发起时商品与回调时SKU/平台；查询期间切订单，迟到回调写入新订单。',
 'runtime13.6','固定不可变操作身份；离页、重置、换端/对象令旧请求失效，拒绝旧回调的写入与导航。',
 'A请求未回→改B→B返回→A返回；再做关闭/重开与重置；检查订单字段、loading、提示、导航。','VM09 VM10')
item('A05','建单缺销售资格与旧支付状态守卫','执行错误',[1755,2248],'B02',
 '未成年阻断局部符合；WEB下架商品仍建单，确认中旧单未先处置又新建。同商品/平台待支付匹配还需按购买意图检查规格与账号。',
 'runtime13.5；business23.4/24.4','执行前重读商品可售、库存和资格，按已批准幂等键处理待支付/确认中订单。',
 '下架、售罄、未成年、确认中、不同规格分别从真实购买入口触发；不得错误复用或重复建单。','VM12 VM13 VM32')
item('A06','支付成功直接生成交付码','执行错误',[1846,1852,2299],'B04',
 '查询/扫码成功直接改为已交付并写DEMO码，混合支付与供应商交付事实；关闭扫码层不取消订单的局部行为符合。',
 'business23.4/24.4；core3.4','支付结果与取码/赠送结果分开，分别模拟成功、失败、未知与重试；交付码须来自声明的交付结果。',
 '已支付+交付失败/处理中不能显示可复制成功码；关闭重开不取消支付；同回执重放不重复交付。','VM11 VM31')
item('A07','协议返回与Esc缺正确层栈','执行错误',[1807,1808,1145],'B06',
 '打开协议已记录来自须知，但关闭未还原须知；Esc按kind先进入移动处理器，WEB分支可能不可达。',
 'runtime13.8；STD-RT-001','按宿主与栈顶管理子层；关闭协议恢复父须知，保留购买上下文与焦点。',
 '两端从须知开协议，按钮/Esc各关闭一次；只关栈顶，返回父层，底层草稿不变。','VM23 VM24')
item('A08','协议同意缺版本，复合认证需声明回执','执行错误',[1758,2277],'B07',
 '协议接受用全局布尔，不能证明同意当前版本。WEB认证同时设登录和成年是否属于获准复合回执，本轮未定，不将它另算缺陷。',
 'core3.4；runtime13.5','协议同意关联账号/适用版本；复合认证明确回执字段和模拟边界。',
 '已同意旧版本→发布新版本→再次购买按契约确认；登录成功但实名未知、未成年分别测试。')

item('A09','搜索空态改善，但销量按库存排序','执行错误',[1480,1487,1498],'A03',
 '客户端销量选项实际以stock排序，数据语义与标签不符；无匹配已显示真实空态，不再填演示商品。最终版无匹配回填样例（F1721、1737）是反例，不继承。媒体选择已有稳定mediaId（T1510、1787），不据此宣称上传/播放能力通过。',
 'core3.4；client10.2；runtime13.3','销量使用声明的销量字段与统计范围；若本轮不具备销量，明确不支持或按获准范围调整入口，不借库存冒充。保留真实空态与稳定媒体选择。',
 '准备库存多但销量少、库存少但销量多的两条商品；按销量应遵循销量。无匹配保持空态；PC同类入口独立验证。')

item('B01','首页草稿隔离改善，失败发布仍写生效配置','执行错误',[2811,2812],'C01',
 '保存草稿不生效、成功发布生效均局部符合；RV.sim=fail时仍发布。最终版直接保存可作为另一生效契约，不强制所有后台加发布。',
 'admin12.11；core3.4','失败发布保留线上配置与可重试草稿，成功才切换版本。',
 '分别保存、取消、失败发布、成功发布；三端读同一生效版本，未发布内容不泄漏。','VM07 VM08 VM29')
item('B02','新增商品混入上一条编辑草稿','执行错误',[2817,2982,2983],'C04',
 '新增只赋ADMIN.productDraft，未清页面rt.draft；表单合并时旧草稿覆盖新空值。',
 'runtime13.5；admin12.6','为对象/新增会话分配草稿身份，进入新增按契约初始化。',
 '编辑A未保存→新增→输入B→取消→重开A/B；新建不携带A旧值，取消无写入。','VM40')
item('B03','底价校验改善，空白售价被转换为0','执行错误',[2825,2828,2829],'C03',
 '低于供货/最低价被拒绝；空白必填售价经Number转换为0并保存。合法0与未填写不等价。',
 'business24.5','先做必填与词法解析再做有限数值、精度、值域和底价校验。',
 '空串、空格、0、小数、负数、非法字符、低于底价/等于底价逐项验证；失败不写正式值。','VM38 VM42')
item('B04','商品保存覆盖所有规格价格','项目特例待核',[2838],'C02',
 '当前规格读取支持独立价，保存却全部写商品价。05登记SKU.price为读写字段，但未取得原PRD确认统一价还是独立价；VM02只证明覆盖行为。',
 'core3.4；business24.5','先确定价格模型：独立价保留每SKU值；统一价须明确来源与维护范围，不保留误导性的独立编辑语义。',
 '两规格98/158，仅改名称保存；独立模型必须保留；统一模型按已批准契约同步并清楚说明。','VM02 VM30')
item('B05','停用与不可售的字符串0被当真值','执行错误',[2568,2847,2852],'C03',
 '选项value="0"经布尔转换/真值判断成启用或保持ON；上轮已批准类型解码仍未落实。',
 'business24.5','按控件契约显式解码枚举，拒绝未知值，不用!!或字符串真值代替业务布尔。',
 '真实select选择启用/停用、可售/不可售，保存后重开和前台消费均正确；未知值拒绝。','VM04 VM05')
item('B06','必填客服兜底空白未拒绝且部分保存','执行错误',[2856,2858],'C03',
 '05表明fallback必填；空白时保留旧fallback却提交其他字段并提示成功。不能沿用旧轮“该字段可清空”的前提。',
 'business24.5；runtime13.5','依当前字段契约拒绝非法空值并保留草稿；检查通过后按声明原子性提交。',
 '同时改客服号并清空必填fallback，显示字段错误且正式配置不变；合法可空字段另验证清空。','VM06')
item('B07','新增供应商草稿提前写正式集合','执行错误',[2996],'C04',
 '新增动作立即push供应商并称草稿，未保存已影响正式集合。',
 'runtime13.5；admin12.11','新增保留独立草稿；保存成功后才提交正式集合。',
 '新增→取消/返回不增加正式记录；保存成功只新增一条；失败草稿可重试。','VM26')
item('B08','审计before取自已被修改的对象','执行错误',[2833,2841,2859],'C05',
 '商品old引用与写入对象相同，写后再取before，导致变更前显示新值；客服保存也直接同值前后。',
 'admin12.13','提交前保存不可变原值，成功后形成真实前后差异与目标。',
 'OLD/98改NEW/120，核对记录前后值、对象、操作者与失败无成功审计。','VM03')
item('B09','人工顺序仍用上下移，重复操作可反弹','执行错误',[2492,2497,3030],'C06',
 '未实现用户已确认的排序把手拖拽；列表先绑定原数组index后按sort展示，两次对同一项上移交换回原顺序，VM27夹具符合该index绑定方式。最终版有draggable，不代表其把手等细节全通过。',
 'admin12.6','通用人工顺序使用操作栏“排序”把手；稳定ID更新序列，声明保存/生效与取消。查询价格/销量排序保留业务排序。',
 '拖拽首尾/中间、取消、重复拖同项、保存重开；不可编辑行与触控/键盘替代按适用范围检查。','VM27')
item('B10','权限空菜单过滤已改善','正向差异',[2380],'C08',
 '过滤后没有可见子项的分组不渲染，空“系统”菜单问题局部已修复。菜单隐藏不证明动作权限重验。',
 'admin12.2/12.13','保留当前过滤行为；执行鉴权由C01单独验收。',
 '不同权限角色切换，空组不出现；有任一可访问子项时组可见且可进入。','VM28',priority='P2')

item('C01','敏感动作缺执行时授权重验','执行错误',[2821,2904,2937,2957],'D01',
 '所查保存/赠送/退款/通知执行函数未调用权限守卫；局部夹具hasPerm=false仍能执行。是否另有真实入口保护需要浏览器确认，不推断生产服务端漏洞。',
 'admin12.13；runtime13.3','动作执行及确认重放时重新校验权限、对象和状态；UI隐藏之外保持统一拒绝结果。',
 '打开编辑/确认后撤销权限再提交；越权不改对象、不产生成功审计；绕旧入口也拒绝。')
item('C02','拒绝态退款仍能执行成功','执行错误',[2937],'D02',
 '原函数直接执行已拒绝退款并推进结果，缺合法前置态。',
 'business23.4/24.4','以当前状态机守卫退款执行；发起、处理中与渠道结果分开。',
 '拒绝/已成功/处理中/合法待执行分别触发，非法态无副作用，回调重放不重复退款。','VM16')
item('C03','已受理通知仍可盲目重试','执行错误',[2957],'D03',
 '平台已受理的通知仍增长重试次数；执行函数未先核对当前任务与允许重试状态。',
 'business24.4；runtime13.3','执行前核对任务去重键与最新业务内容；仅允许声明的重试状态。',
 '已受理、发送失败、内容变更及重复点击分别验证；不重复发已受理任务。','VM17')
item('C04','批次成员聚合改善，但全失败误标部分成功','执行错误',[2882,2889,2904,2912],'D04',
 '一单完成、另一单处理中时父批次保持处理中，已修好；全成员处理异常却进入部分成功分支。开始处理对关闭/未支付订单也缺守卫。',
 'core3.4；business23.4','按项目状态字典建立聚合真值表；零成功不能称部分成功；执行前确认订单可履约。',
 '全待处理、处理中混合、全成功、成功+失败、全失败、成员缺失；关闭/未支付禁止处理。不同项目聚合标签不强制统一。','VM18 VM36 VM25')
item('C05','重复导出生成重叠批次','执行错误',[2896,2898,2900],'D04',
 '同一待处理订单连续导出创建两个批次，order.batch_no被覆盖，旧批次成员保留；04的N-GIFT-004要求重复导出识别。',
 'core3.4；business24.4','区分重下载与新建批次，依据稳定成员与导出意图识别重复；允许重批时显式记录关系。',
 '重复点击、重复选择同成员、部分交叠成员；旧批成员与新批关系不静默矛盾。','VM37')
item('C06','赠送导出只建批次，没有文件或模拟产物','执行错误',[2896,2902,3011],'D05',
 '导出函数仅修改批次并提示创建批次，未调用下载。不能以创建记录代替承诺的导出结果。',
 'runtime13.3；STD-ACT-001','提供正确文件/可审阅模拟产物，或明确该入口仅建批；文件成功与批次状态分开。',
 '从筛选/勾选范围导出，核对内容、数量、编码、范围和失败反馈；下载落盘另记录。','VM19')
item('C07','换码覆盖旧值，缺新旧关联记录','执行错误',[2923],'B04',
 '代码覆盖o.code，提示称新旧关联却未保存可定位旧码记录。',
 'core3.4；runtime13.3；admin12.13','记录每次交付/替换的身份、旧新关系、原因与权限；前台展示有效码。',
 '初码→替换→重开记录，能追溯旧新关系且不重复交付；失败保留原有效码。','VM15')
item('C08','声明仅当前页选择却跨页保留','执行错误',[2477,2973],'D07',
 '翻页只改page，未清sel；批量动作可能带上未显示页的记录。',
 'admin12.8','按当前页契约清选择；若业务确需跨页，显式声明范围与数量，另作项目决策。',
 '第一页选A→第二页选B→执行；当前页模式只能作用B，筛选/页大小变化也处理失效选择。','VM20')

item('D01','滚动隐藏与画布弹层宿主改善，视觉待测','正向差异',[96,203,247,388],'E05',
 '静态样式已有手机隐藏装饰滑块、画布absolute弹层和PC双栏；响应式使用viewport媒体查询，仍需验证宽浏览器内窄画布。不能从CSS推定真机无滚动条或全部居中。',
 'ui7/8/9；desktop-web15','保留局部滚动能力；以实际画布验证弹层中心、正文可达和PC降栏。',
 '宽浏览器+窄画布/说明展开，长弹窗、320移动画布、键盘/触控滚动；记录viewport、画布、缩放及截图。',priority='P2')
item('D02','内嵌阅读器的PlantUML仍输出源码','执行错误',[803],'E03',
 '当前注册图源送入原mdToHtml仍只得pre/code；独立图示页能看SVG不等于MD围栏已渲染图。',
 'reader18/19','阅读器围栏解析映射已注册离线图；未注册来源明确降级及缺口。',
 '打开含当前已注册PlantUML的MD正文，验证SVG及缩放；未匹配图源不能伪装已渲染。','VM44')
item('D03','MD相对链接被吞，返回丢阅读位置','执行错误',[791,793,1179,1184],'E04',
 '相对MD链接变纯文本；历史只保存文件名，缺滚动/定位恢复。',
 'reader19','文内MD链接进入内置阅读器，按文档/锚点保存返回位置与必要焦点。',
 'A中部链接B→再C→返回两次，文档、位置和锚点正确；无效链接有明确反馈。')
item('D04','复制失败仍提示已复制','执行错误',[978,984],'E06',
 '兼容复制返回false/异常仍走成功提示，最终版也有共同反例。',
 'runtime13.3','传播真实复制结果；失败提示并提供手动选择，不虚构成功。',
 'Clipboard拒绝、execCommand=false/异常、成功分别验证提示与可手动复制内容。','VM22')
item('D05','隐藏补锚点不能证明组件覆盖','执行错误',[870],'E02',
 '注册组件未出现时自动补hidden span，querySelector存在不等于真实状态下可见可交互。',
 'quality26.4/29.10；STD-QA-001','覆盖检查区分注册、实际渲染、可见性、可操作性和文档绑定；缺失留失败。',
 '删除/隐藏一个实际组件后检查应暴露缺口；允许条件组件登记适用状态，不要求所有状态同时可见。')
item('D06','Steam资料辅助反馈大于可见结果','条款适用待核',[2988,2989,2990],'A05',
 '预览宣称名称/介绍/截图等，动作只改content_source/content_status并提示已填充草稿。VM41未见description/media更新；离线可模拟，但不要求连接真实Steam接口。',
 'runtime13.3；core3.4','明确是元信息占位还是模拟资料；若声称填充，至少展示对应字段结果并保留手工覆盖。',
 '有/无SteamID、失败、重复拉取与手工改值分别测试；只有元信息变化时文案不得称资料已填充。','VM41',priority='P2')

item('E01','9份MD内外同源，但语义仍有冲突','正向差异',[594],'E01',
 '本轮9/9外部与内嵌MD仅规范化BOM/换行后相同；这是同源改善，不证明正文正确。05 GIFT_BATCH.status字段表缺部分成功，而枚举字典包含，需统一。最终版九份外部MD本轮哈希与历史匹配，可沿用历史1/9同源统计（07记录）。',
 'docs-business；quality29.13','保留单源生成；字段表、枚举、状态图与实现使用同一获准契约。',
 '09决策/05字段枚举/04流程/实现同语义；每次重建封存9份MD与HTML摘要。',priority='P2')
item('E02','提供方证据匹配主文件，hash字段实际是DOM长度','执行错误',[594],'E07',
 '提供方主HTML SHA匹配；浏览器结果46条自述通过未由本轮重跑。_work/browser_check_v15.js:226的hash取innerHTML.length=1913472，不能当文件SHA；WEB覆盖页渲染但没有绑定提交闭环。932分母应为233个页面状态组合×4，不能再乘53。',
 'quality29.9/29.10/29.13','分开文件SHA、运行时摘要和计数；断言逐条绑定输入与能力边界。保留现有证据为提供方旁证，不全部否定。',
 '记录测试输入文件SHA、环境、断言与截图映射；展示型断言不冒充完整操作；更名不影响相同字节身份。',priority='P2')
item('E03','范围决策发生变化，不能照搬上轮裁剪结论','项目特例待核',[594],'A01',
 '09 DEC-SEARCH-001现自述已确认，排除历史/联想；05另写待评审。01/04写短信不在本轮，与新交易验证码能力冲突。新增钱包、移除统计均先核原PRD；不能按最终版少一页机械补功能。',
 'core1.3；change；quality29.9','区分交易验证码、交付通知短信与营销短信；统一决策状态并取得PRD/确认依据。不要把项目排除升级为通用删除搜索历史。',
 '核对PRD V1.5 SHA与D-15/SEARCH-04/PHONE-05等出处，回填项目覆盖；确认前标自述而非用户已批准。',priority='P2')
item('E04','钱包失败仍更新时间，字段含义待定','条款适用待核',[2713,3067],'本轮新增ADM-WALLET-01；最终版无独立钱包页，不能据此判新增错误。',
 '失败保留余额但更新“最近查询”时间；若为尝试时间可以成立，若为结果有效时间会误导。VM39不判确定失败。',
 'core3.4；runtime13.3','明确时间语义，必要时分别展示本次查询失败和上次成功结果时间；不要求所有项目新增固定字段。',
 '成功后再失败，旧余额明确标记；用户能辨别结果来自哪次成功请求。','VM39',priority='P2')
item('E05','WEB订单已按平台过滤，账号隔离证据不足','正向差异',[2196,2198,2202],'B01',
 '当前WEB列表已经filter平台，不能继承上轮“未按平台过滤”的结论；本轮未证明同平台多账号隔离。抽屉失效ID回退见A03。',
 'core3.3；runtime13.5','保留平台过滤，按项目账号模型补同平台双账号夹具；纯单账号模拟可声明边界。',
 '平台A/B及同平台账号U1/U2切换，列表/计数/详情/动作一致；不把固定单账号样例称为鉴权验证。',priority='P2')

# External document and provider evidence avoids opaque giant DATA-line references.
doc_evidence={
 'A02':[('05_接口数据与权限说明.md',2466)],
 'B04':[('05_接口数据与权限说明.md',2416)],
 'B06':[('05_接口数据与权限说明.md',898)],
 'E01':[('05_接口数据与权限说明.md',2441),('05_接口数据与权限说明.md',2493)],
 'E03':[('01_页面与状态说明.md',42),('04_业务流程与异常规则.md',406),('05_接口数据与权限说明.md',386),('09_待确认事项与设计决策.md',38)]}
for f in findings:
    if f['id'] in ['E01','E02','E03']: f['trial_evidence']=[]
    for file,line in doc_evidence.get(f['id'],[]): f['trial_evidence'].append({'path':str(TRIAL.parent/file),'line':line})
    if f['id']=='E02': f['trial_evidence']=[{'path':str(TRIAL.parent/'_checks/验证证据_2026-10-21.md'),'line':6},{'path':str(TRIAL.parent.parent/'_work/browser_check_v15.js'),'line':226}]
save('10_差异与规则映射.json',{'input_sha256':baseline['inputs']['trial']['sha256'],'findings':findings,
 'count_meaning':'条目包括改善、执行错误和待核；不是独立缺陷总数。局部观察不是浏览器验收。'})
themes=[('A','11_批次一_交易上下文.md','交易入口、资格与支付','重点是WEB真实入口接错动作、验证码上下文及异步目标串写。未成年阻断有改善；支付与交付不能共用一个成功结果。'),
 ('B','12_批次二_后台配置.md','后台配置、草稿与字段','草稿与成功发布、底价校验、空菜单有所改善；失败发布、类型解码、草稿复用和拖拽要求仍未落实。SKU价模型留待项目确认。'),
 ('C','13_批次三_履约与批量.md','履约、退款、通知与批量','父批次不再被单条完成直接推进，但全失败及重复批次仍有问题。执行守卫、导出产物、换码追溯和选择范围按已有规则修正。'),
 ('D','14_批次四_布局与阅读.md','画布、阅读器与反馈','静态布局改善尚不能替代实际画布验收；MD围栏、相对链接、返回位置与复制失败反馈存在明确缺口，隐藏锚点也不能证明组件覆盖。'),
 ('E','15_批次五_证据与范围.md','交付证据、项目范围与同源','9份MD同源；主HTML SHA与提供方声明一致。提供方浏览器断言不是本轮复测，hash字段只是DOM长度；项目排除与新增范围要核原PRD。')]
for prefix,name,title,summary in themes:
    group=[f for f in findings if f['id'].startswith(prefix)]
    body=[f'# {title}',f'本批摘要：{summary}',f'共{len(group)}项。静态定位T为试跑5.0，F为SHA已核实的最终版历史证据；本轮浏览器全部未复测。路径见[基线](01_基线.json)。']
    for f in group:
        ev='、'.join(('T' if x['path']==str(TRIAL) else Path(x['path']).name+':')+str(x['line']) for x in f['trial_evidence'])
        body += [f"## {f['id']} {f['title']}",f"分类：{f['classification']}；优先级：{f['priority']}。证据：{ev}；局部观察：{'、'.join(f['probes']) or '静态核对'}。",
                 f['observation'],f"最终版比较：{f['final_comparison']}",f"规则归口：{f['authority']}。",f"修正：{f['solution']}",f"验收：{f['acceptance']}"]
    md(name,'\n\n'.join(body))

# Responsibility mapping reuses final IDs, but refreshes trial membership from current inventory.
domains=json.loads((old/'16_职责覆盖.json').read_text('utf-8'))['domains']
trial_ids={p['id'] for p in inventory['trial']['pages']}; final_ids={p['id'] for p in inventory['final_reused']['pages']}
for d in domains:
    d['trial_pages']=[p for p in d['trial_pages'] if p in trial_ids]
    d['coverage']='页面职责映射；非状态/行为通过。详情可在独立页、抽屉或面板实现。'
    if d['responsibility']=='手机号': d['trial_pages'] += ['CL-PHONE-02','WB-PHONE-01']
    if d['responsibility']=='统计': d['decision']='试跑5无独立统计页；先核PRD范围，不以最终版页面存在强制补齐。'
domains.append({'responsibility':'供应商钱包','trial_pages':['ADM-WALLET-01'],'final_pages':[], 'coverage':'新增职责；项目适用性待原PRD核对。'})
assert set(p for d in domains for p in d['trial_pages'])==trial_ids
assert set(p for d in domains for p in d['final_pages'])==final_ids
save('16_职责覆盖.json',{'domains':domains,'trial_pages_covered':len(trial_ids),'final_pages_covered':len(final_ids),'scope':'映射所有注册页面；不声称穷尽233状态和254组件的动态执行。'})

regress=[{'id':'R5-'+f['id'],'findings':[f['id']],'fixture': '依08局部夹具（如有）及项目PRD建立真实入口数据；含至少两条不同ID记录，具体账号/版本按契约补齐。',
 'procedure_and_expected':f['acceptance'],'method':'real-browser-entry-required','status':'未执行', 'local_observations':f['probes'],
 'scope':'父场景须展开成功/失败/边界子例；局部VM不得回填浏览器通过。','evidence':None} for f in findings]
save('17_回归验收矩阵.json',{'input_sha256':baseline['inputs']['trial']['sha256'],'browser_executed':0,'scenarios':regress})

# Provider provenance; no provider script is executed.
evidence=TRIAL.parent/'_checks/验证证据_2026-10-21.md'
ev=evidence.read_text('utf-8-sig')
module_claims=[{'path':p,'declared_sha256':h,'review_sha256':baseline['modules'].get(p),'matches_review':baseline['modules'].get(p)==h} for p,h in re.findall(r'\| (standards/[^ |]+) \| `([0-9a-f]{64})`',ev)]
provider_result=TRIAL.parent/'_checks/browser-check-v15-result.json'
br=json.loads(provider_result.read_text('utf-8-sig'))
provider_script=TRIAL.parent.parent/'_work/browser_check_v15.js'
ps=provider_script.read_text('utf-8-sig').splitlines()
hash_lines=[{'line':i,'excerpt':l[:400]} for i,l in enumerate(ps,1) if 'document.documentElement.innerHTML.length' in l]
assert hash_lines
save('06_提供方证据归属.json',{'evidence_document':str(evidence),'sha256':sha(evidence),
 'generation_commit':{'value':'1e43001b9aed7f667398326e2afb1887a54cf07e','source':'提供方验证证据，非当前HEAD倒填','matches_review':baseline['head']=='1e43001b9aed7f667398326e2afb1887a54cf07e'},
 'module_claims':module_claims,'prd':{'version':'V1.5 (2026-10-21，提供方标待评审)','declared_sha256':'a35db92d4e0b9f993e3562599df957278479a1853d50f778d52f34947ed0d10f','independently_verified':False,'reason':'原PRD未取得，不能核正文或批准链'},
 'artifact_sha_matches':baseline['inputs']['trial']['sha256'] in ev,
 'provider_browser_result':{'path':str(provider_result),'sha256':sha(provider_result),'checks':len(br['checks']),'console_errors':br.get('consoleErrors'),'hash_field':br.get('hash'),'hash_semantics':'document.documentElement.innerHTML.length，DOM字符长度，不是SHA', 'script':str(provider_script),'script_sha256':sha(provider_script),'source_evidence':hash_lines,'reexecuted':False},
 'render_denominator':'233个注册页面状态组合 × 4模拟结果 = 932；原说明重复乘53属公式表述错误，不据此否定渲染日志。',
 'limitations':['WEB绑定页可见断言不覆盖提交后端归属。','主文件摘要匹配是有用旁证，但每份截图/浏览器结果未独立绑定最终字节SHA。','提供方未验证真实SDK/支付/短信/供应商/文件落盘/真机/服务端；本轮也未验证。']})

# Confirm whether the historical final external-doc comparison can still be cited.
history=json.loads((old/'20_最终版外部文档哈希复核.json').read_text('utf-8'))
def file_records(x):
    if isinstance(x,dict):
        if any(k in x for k in ['path','file']): yield x
        for v in x.values(): yield from file_records(v)
    elif isinstance(x,list):
        for v in x: yield from file_records(v)
checks=[]
for x in file_records(history):
    path=x.get('path',x.get('file')); expected=x.get('sha256',x.get('current_sha256'))
    if isinstance(path,str) and expected and Path(path).is_file(): checks.append({'path':path,'sha256':sha(Path(path)),'historical_sha256':expected,'matches':sha(Path(path))==expected})
save('07_最终版外部证据复核.json',{'historical_report':str(old/'20_最终版外部文档哈希复核.json'),'records':checks,'all_nine_verified':len(checks)==9 and all(x['matches'] for x in checks),'claim_policy':'只有九份外部文件均匹配才沿用历史1/9同源统计；否则仅比较HTML结构并保留历史说明。'})

met=Counter('符合' if x['contract_met'] is True else '不符合' if x['contract_met'] is False else '未定' for x in probe['records'])
classes=Counter(f['classification'] for f in findings)
md('00_审查摘要.md',f'''
# 试跑5.0对比审查摘要

日期：2026-10-22。状态：比较与规则提炼已完成；待审方案未落实为活动规范。未改原型，未提交/推送。

本轮不只复查先前七项UI反馈：共{len(findings)}项差异/改善/待核，分交易、配置、履约、阅读布局、证据范围五批；职责映射覆盖试跑53页与最终41页，不按页数判断优劣。详细续接只需读本摘要与[差异索引](10_差异与规则映射.json)，按ID读取对应报告，无需重新展开HTML。

| 指标 | 试跑5.0 | 最终版 |
| --- | --- | --- |
| 页面 | 53（19客户端/15WEB/19后台） | 41（17/8/16） |
| 注册页面状态 | 233 | 152 |
| 组件口径 | 254实例/文档；75引用定义（提供方定义总数79） | 192定义，不与实例直接相减 |
| 图示 | 25 | 35 |
| 主HTML字节 | 2,821,789 | 5,930,662 |

主要结论：WEB手机号绑定的可见提交按钮接错移动动作；验证码状态未绑定发送目标；异步回调仍可能串对象；停用值解析、失败发布、拖拽排序、换码记录与阅读器存在执行缺口。赠送批次主路径修好，但全失败误标部分成功、重复导出建重叠批次。

改善：9份MD内外同源；空权限菜单过滤；首页草稿隔离；底价校验；单成员完成不再完成整个批次；WEB订单按平台过滤。滚动条隐藏、画布弹层宿主与PC布局仅确认静态设计，未做视觉验收。

实际验证：6段JS均语法可解析；41项原函数隔离观察，{met['符合']}符合、{met['不符合']}不符合、{met['未定']}未定。它们不是41个浏览器用例，也不等于{met['不符合']}个独立缺陷。本轮真实浏览器执行0；提供方46条记录单独归属。所有{len(regress)}个回归父场景均未执行。

提炼建议：现有条款足以覆盖多数问题，本轮不增加同义STD；在[待审方案](18_规则提炼与方案_待审.md)给出6组可直接采用的验收补强文本及项目待核项。规则批准不代表原型验收通过。

分批报告：[交易](11_批次一_交易上下文.md) · [后台配置](12_批次二_后台配置.md) · [履约](13_批次三_履约与批量.md) · [布局阅读](14_批次四_布局与阅读.md) · [证据范围](15_批次五_证据与范围.md)。[证据归属](06_提供方证据归属.json) · [职责覆盖](16_职责覆盖.json) · [回归矩阵](17_回归验收矩阵.json)。
''')

md('18_规则提炼与方案_待审.md','''
# 试跑5.0规则提炼与执行方案（待审）

## 建议结论与适用范围

本轮不新增强制规则ID，不改活动规范语义。多数问题是已有STD-ACT-001、STD-QA-001、runtime13.5/13.6、business24.5、core3.4和admin条款执行不到位。不能再把“类型解码”“父子聚合”包装成新规范，也不把最终版的直接交付、固定价格、复制假成功等反例推广。

建议采用下列六组验收方法补强，落实时合并到已有相近矩阵行，引用原权威条款；编号R5-M1～M6只是本次建议定位，不是新STD，也不是已执行测试。条款与矩阵都保持按需读取；不把长报告自动装入阶段包。

## R5-M1：从可见入口验证端与来源

拟加入动作矩阵：针对每端共享能力，从该端实际可见按钮触发，记录入口组件、实际处理动作、起始端/账号/对象、最终端/对象与回执。至少覆盖成功、失败及返回；只验证处理函数存在、直接调用正确函数、页面能渲染，均不能代替入口连通性验证。

归口：runtime13.3/13.5、core3.3、quality29.10。更新目标：docs/acceptance/actions-and-results.md中动作入口方法；必要时在selftest.md增加交叉引用。例外：获准跨端跳转登记目标与参数，不要求所有流程留在原页。验收：A01双端绑定闭环；A03无效目标；A07返回现场。

## R5-M2：资格结果的适用上下文

拟加入上下文矩阵：对验证码、实名、协议、授权等已有资格契约，登记通过结果适用的对象/账号/来源/版本。目标或版本改变后按契约失效或重验；测试旧请求迟到、重发及切换上下文。保留输入不能自动保留过期资格。

归口：runtime13.5/13.6；并非新增短信专用规则。更新目标：docs/acceptance/context-and-layers.md相近上下文/异步行。例外：已批准可跨端共享的资格沿用明确范围，不一律强制重验；离线模拟无需真实短信，TTL/重试次数由项目DEC决定。验收：A02号码A到B、A08协议换版；不伪造服务安全测试结论。

## R5-M3：类型、草稿与保存的反例组合

拟补充ACT-16已有字段解码方法：除单字段成功，还覆盖空白必填/合法0/字符串枚举0/未知值与“另一字段同时被修改”的组合；失败时检查正式集合、草稿与成功提示。编辑A后新增B应使用声明的新建草稿范围；审计before必须来自写入前快照。

归口：business24.5、runtime13.5、admin12.11/12.13。更新目标：docs/acceptance/actions-and-results.md既有字段/保存行。例外：合法可空不判必填；分步提交按已声明原子性，不强制全业务事务。验收：B02/B03/B05/B06/B07/B08。SKU独立价格先核项目模型，不以夹具自行新增要求。

## R5-M4：父子聚合和重复批次

拟补充ACT-17已有聚合方法：依据项目状态字典列全待处理、处理中混合、全成功、部分成功、全失败及成员失效的预期；重试/重导出校核稳定成员关系，不用一条正向聚合断言代表整个状态机。批次创建、导出文件、开始处理、完成各有独立结果。

归口：core3.4、business23.4/24.4、runtime13.3。更新目标：docs/acceptance/actions-and-results.md已有聚合/导出行。例外：存在独立审批、封批、允许重批时按项目契约；不把商城标签或“批次必须1个”推广到其他业务。验收：C04/C05/C06，真实副作用与模拟结果分开记录。

## R5-M5：展示断言与结果断言分开

拟补充动作/阅读验收方法：分别记录入口可见、真实操作、最终对象变化、对外产物及失败反馈；隐藏补锚点不能计作真实组件。独立图示页通过不等于阅读器围栏通过，预览元信息不等于资料已填充，建批次不等于文件已导出。

归口：runtime13.3、reader18/19、quality26.4/29.10。更新目标：actions-and-results.md及layout-and-reading.md相近行。例外：离线占位允许，但须与界面承诺一致并标未验证；条件组件按适用状态检查。验收：C06、D02～D06。

## R5-M6：证据身份和分母可追溯

拟补充自测矩阵：运行记录明确文件字节SHA、运行时DOM指纹/长度和统计数量的不同含义；保存输入摘要、断言与截图对应关系。总状态若已是页面状态组合数不得再乘页数。提供方结果可作旁证，必须标明是否本轮复跑、入口/风险分支和环境边界。

归口：quality29.9～29.14；不是新增哈希规范。更新目标：docs/acceptance/selftest.md版本封存/覆盖方法。例外：未能强绑定的历史证据保留来源与缺口，不删除或伪造完整关联。验收：E02，WEB绑定页展示与提交闭环独立计覆盖。

## 项目事项，不升级为通用条款

1. 取得PRD V1.5原文并核对提供方SHA。09对搜索历史排除自述已确认，但05仍待评审；更新同一决策状态。明确交易验证码与营销/交付短信的范围，新增钱包/移除统计按PRD评审。
2. SKU价格采用独立还是统一模型；钱包“最近查询”是尝试时间还是结果时间；Steam辅助究竟提供占位还是字段填充。三者先明确承诺再判对应验收。
3. 全失败批次用何标签、重复导出是重下载/重批、验证码TTL/重试次数均使用项目契约，不在本轮发明业务值。

## 落实范围与版本建议

当前仅保存评审及导航。审核采用后合并六组方法到四份按需矩阵，去重保留既有编号；同步acceptance入口、CHANGELOG、REVIEW。现有模板已有预期/证据/DEC字段，本轮不建议再加重复字段。无新增语义时无需修改standards、规则ID、模块依赖、manifest、content_revision或MIGRATION；若审核要求改变规则含义，应另给具体差异和兼容性决定。

本轮建议不是修改试跑5.0原型的授权，也不是提交/推送/发布授权。所有真实入口仍待执行，原型修复需另行落地。用户历史对试跑4的审核不当作本轮六组建议已获批准。
''')

case=json.loads((ROOT/'reference/golden/CASE-TEMPLATE.json').read_text('utf-8'))
case.update({'case_id':'steam-trial5-20261022','status':'candidate-unverified','scope':['53页职责映射','五主题细节比较','原函数隔离观察；非全应用执行'],
 'prd':{'path_or_uri':None,'version':'V1.5（提供方声明）','sha256':None,'declared_sha256':'a35db92d4e0b9f993e3562599df957278479a1853d50f778d52f34947ed0d10f','reason':'未取得原文；声明哈希不冒充复核值'},
 'standard':{'rule_version':'V3.0','content_revision':baseline['content_revision'],'commit':'1e43001b9aed7f667398326e2afb1887a54cf07e','provenance':'提供方明确声明；本轮另核13模块摘要','module_hashes':module_claims},
 'confirmed_overrides':[],
 'trial':{'path_or_uri':str(TRIAL),'sha256':sha(TRIAL)},
 'accepted_reference':{'path_or_uri':str(FINAL),'sha256':sha(FINAL),'accepted_by':'用户在任务中指定为最终版','acceptance_scope':'比较参考；不代表源码所有能力符合现行规则'},
 'conversation_or_decisions':['用户要求继续细节对比并提炼规则；未批准本轮新条款','提供方09的确认记录待原PRD核对，不自动列入confirmed_overrides'],
 'differences':[{'id':f['id'],'classification':f['classification'],'final_decision':None,'authority':f['authority'],'regression':['R5-'+f['id']]} for f in findings],
 'evidence_locations':['01_基线.json','06_提供方证据归属.json','08_局部函数观察.json','10_差异与规则映射.json'],
 'unverified':['原PRD与项目范围批准链','本轮全部真实浏览器入口/布局/焦点/触控/下载','真实SDK、支付、短信、供应商与服务端','当前案例不能晋级黄金实现'], 'promotion_record':None})
save('19_黄金案例候选.json',case)
print(json.dumps({'findings':len(findings),'classes':dict(classes),'probes':dict(met),'mapped_trial':len(trial_ids),'mapped_final':len(final_ids),'provider_modules_match':sum(x['matches_review'] for x in module_claims),'provider_modules':len(module_claims),'final_external_verified':len(checks)},ensure_ascii=False))
