# 模型派生覆盖与导航检查（可选试点）

权威要求归 quality29.10～29.13、docs-ui21.5 与 STD-RT-001。本页只给执行方法，不新增业务预期、项目必交文件或第二份验收台账。试跑16候选A/B/C已批准；以下v2协议及导航声明检查为工具试点，真实RUN-002、历史18个DEF的独立回归和完整误报验证尚未完成，不能宣称已证明能检出这些真实缺陷。

## 先冻结职责，再执行检查

1. 从本轮01/04/05/07/09及页面注册表的同源模型导出职责清单。保存来源原字节哈希、计划版本、派生方法和范围审查说明；不能只从已通过检查反推清单。登记各适用端；每端至少一条真实入口开始的P0连续旅程。
2. 高影响资金/权限/协议/交付/不可逆动作登记正向与拒绝/待授权分支；跨页入口登记来源—目标—返回及保持项。每个图示核对节点/边/首尾/标签/技术ID；API/TC/EX/页面/组件引用列出集合差集。合并同质实例时保留可追溯映射。
3. 职责映射到07的必需CHK及其证据计划；保留固定最小检查。浏览器职责不得用渲染或DOM检查代替。图示/引用差集可用构建检查，但图示可读性和UI真实操作仍需另列浏览器职责。
4. 同一运行执行并在08记录真实步骤、变化/保持、结果和恢复；每条结果带运行ID、方法及证据哈希，浏览器记录浏览器/视口/缩放。当前HTML原字节哈希必须一致。固定检查通过数、派生职责总数/已覆盖/已通过分开显示。
5. 外部真实能力未接入：本地模拟主链继续测，外部能力留未验证，不能整体裁成不适用。合法initial/terminal装饰节点由图示检查语义区分，不能因为无字一概判错；本工具不解析这些节点。

## 可选 required-check-set-2 协议

[职责清单骨架](model-coverage.example.json)与[门控骨架](required-check-set-v2.example.json)含占位符，不能直接用于报通过。它们只演示一条职责，项目必须先完成上面的范围推导。v1仍兼容，只能表示旧计划集合通过，不能报告模型派生覆盖通过。

v2沿用v1的artifact/plan/checks/summary，新增：

- `run_id`；`coverage:{path,sha256}`绑定执行前另存的职责清单。路径在声明root内，来源/产物/证据均校验原字节哈希。
- 清单：`plan_version/derivation_method/scope_review`、`ends`、`sources:[{id,path,sha256}]`、`obligations`。
- 每条职责：`id/kind/end/source_id/source_locator/expected`；kind为`p0-journey/risk-positive/risk-negative/navigation/layout/diagram/references`。前五类还须`entry/unchanged`并映射最低依据为browser的必需有证据检查。
- 每条plan：`origin:fixed|derived`、`covers:[职责ID]`；derived不得为空，全部职责须映射，固定最小项不得删除。一个CHK可覆盖多个职责，但证据必须实际证明每项断言，不能仅凭一个pass代表所有职责。
- 每条checks：同一`run_id`；已执行的browser结果须`environment:{browser,viewport:[宽,高],zoom:百分数}`。证据仍为文件路径/哈希引用，详细轨迹和图像保存在附件，08引用同源记录。
- summary在v1基础上增加`fixed_required_total/fixed_required_pass/derived_total/derived_covered/derived_pass`。工具对完整明细重新计算，缺项、非法协议或必需项未通过不可gate-ready。

```powershell
python tools/check_required_check_set.py <项目门控.json> --root <计划与证据路径基准>
python tools/test_required_check_set.py
python tools/test_required_check_coverage.py
```

返回0仅表示已声明模型职责的证据协议可封存；1表示合法结果尚未满足必需项；2表示协议无效。工具不能自动读懂PRD、证明清单已穷尽本轮模型、核实日志真实性或证明浏览器动作发生，`gate_ready`不是项目验收结论。需由审查者核对清单与来源，真实行为仍按07执行、08记录。

## 导航声明检查

从01同源导航记录导出`{entries:[...]}`，每项包含：`id/end/view/state/role/target/level/placement/source/task/equivalence_key/primary`。level取`primary/secondary/context`；后两类还需`return_strategy`。`primary`为该等价目标组的主入口布尔值，与导航层级不是同一字段。

先由任务审查规范化目标+有效参数+守卫+结果为`equivalence_key`，再在同端/角色/视图/状态分组。每组保留一个主入口，跨区次入口声明`exception_reason/decision_source/verification`。同一页面可有合理结果页行动按钮或不同参数入口，不按URL机械删除；范围/对象不同用不同等价键并审查理由。批准架构、职责交叉和例外仍由01/09裁决，声明检查只发现缺字段、无主入口、无依据重复及缺返回策略。

对存在多个导航区域的页面，声明检查之后必须补做当前产物的行为证据：入口声明中的组件/实例 ID、稳定 DOM 定位、真实点击、目标页面或弹层、结果/返回恢复和证据哈希逐项对应。`DOM`存在、配置被消费、路由字符串或自动化点击的隐式滚入不能单独作为通过；可用[导航行为证据协议](navigation-evidence.example.json)与`tools/check_navigation_evidence.py`预检。预检只核对协议和原字节哈希，语义等价、任务收益和浏览器真实行为仍由审查者及08台账确认。

```powershell
python tools/check_navigation_model.py <01导航导出.json>
python tools/test_navigation_model.py
```

不把Steam菜单写为通用规则。声明可错误地把重复入口写为不同等价键，或填入虚假例外；本工具无法自动证明语义正确，必须反查真实页面与需求。工具正反例均为合成声明，试跑16/最终版的实际入口独立回归未完成。

## 差异评审输入基线

跨版本比较先按[输入基线协议](comparison-baseline.md)登记当前试跑产物、实际被验收产物、视觉/交互参考、文档参考和PRD的用途、版本、路径、原字节SHA-256及相互关系。HTML与外部文档先核对内嵌/外部匹配；不匹配时拆分视觉和文档结论，不把一方的业务假设倒写成另一方要求。页面/状态/组件/图示数量只用于范围提示，先做语义映射再比较，不以数量差直接判定质量。该协议不新增项目交付物，也不替代08验收台账。

## 连续旅程与弹层可达证据

使用07逐步表：真实入口→守卫→目标页面/弹层→数据变化→返回/关闭→结果或恢复，逐步写明查询/页签/滚动/对象事实/权限应保持什么。

弹层测试在打开前记录视口与各滚动区，打开后用用户可用的滚轮/触摸/键盘到达主操作及关闭入口，再真实点击并核对结果和焦点恢复。分别记录外部评审文档、业务背景、弹层正文的前后滚动位置、头尾动作矩形/命中点。`bodyLocked=true`、弹层位于手机内、状态可渲染均不足以证明可达；自动click隐式滚入或直接scrollTop也不能单独替代用户滚动步骤。

工具反例通过只证明声明协议能失败；后续须用当前修复产物建立新的独立RUN，对历史18个DEF、故意失败、合法装饰节点、外部依赖及必要上下文入口逐项确认检出和误报范围，再考虑推广。
