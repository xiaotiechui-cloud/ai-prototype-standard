# 评审外壳、层栈与图示局部参考 RK-01

用途：复用通用机制，避免复制商城业务。输入见 [scenario.md](scenario.md)，代码见 [review-kit.html](review-kit.html)，图源见 [diagram.puml](diagram.puml)，构建期 SVG 见 [diagram.svg](diagram.svg)，基线见 [baseline.json](baseline.json)。HTML 自包含，不需要运行服务或下载依赖；可由后续执行者直接打开补验。

当前状态：**代码与纯模型可检查；真实浏览器未验证；尚未晋级为已验收黄金产物。** 它不是完整 00～09 交付，也不替代活动规范。权威依据是 ui 7～9、runtime 13、reader 18。

说明：示例 HTML 保留 `.phone` 设备外壳，用于演示宿主与层栈边界；它不是商城业务模板。按当前 ui 7.4 / client 10.1 复用时，默认 `frameMode=phone`，使用已登记的手机外框规格；只有项目明确批准并在 01/09 登记时才使用 `frameMode=none` 或其他皮肤/尺寸，并记录逻辑画布与实际渲染矩形。此样例代码仍展示历史演示尺寸（320×610、旧边线颜色），不符合当前默认几何令牌；复用层栈机制时不得复制该几何样式。示例代码和验证记录仍未完成真实浏览器验收，不能把示例通过继承给项目。

## 可复用位置

| 能力 | 代码入口 | 需要项目自行适配 |
| --- | --- | --- |
| 容器响应、单一说明滚动、实测标注 | `.host/.layout/.side`、ResizeObserver | 端布局、目标设备、矮视口、字号与热区实测 |
| 页级注册、未展示提示、局部说明/描边 | `registry`、`renderDescription/updateOutline` | 从项目同源模型/03 生成完整十节；不手工复制样例业务文本 |
| 稳定记录、失败不写入、重复提交拦截 | `createModel/read/save` | 真实项目守卫、异步与未知结果、幂等契约 |
| 业务宿主与评审视口、父子层、脏退出 | `openLayer/requestClose/closeLayer`、`locks/syncInert` | 多端宿主、焦点回退、所有退出与嵌套场景实测 |
| 构建期 SVG 与真实宽度缩放 | `diagram-template`、图示 `resize` | 本项目 PlantUML 图、可读性阈值校准与拆图 |

业务层只阻断其业务宿主；评审视口层阻断整个外壳。CSS/焦点/inert 支持须按目标浏览器补验；不因使用同一函数就默认所有路径通过。

## 复核方法

在仓库根目录运行 `python tools/check_reference.py`：检查脚本语法、静态 ID/资源依赖、图源与 SVG 嵌入一致性，并执行真实模型的失效 ID、独立草稿、失败不写、指定记录、重复提交和重置断言。结果见 [验证记录](validation.json)。

生成前档案指纹、产物hash、复跑目标与消费者读回证据的声明预检，见 [按需证据检查方法](../../../docs/acceptance/selftest.md)；该检查不证明声明真实，也不替代本样例浏览器补验。

该脚本**不启动浏览器**，不能证明布局、遮挡、滚动锁、焦点、原生点击或可见缩放。浏览器补验优先采用 [上下文矩阵](../../../docs/acceptance/context-and-layers.md) CTX-01/02/04/05/06 与 [动作矩阵](../../../docs/acceptance/actions-and-results.md) ACT-02/03/06；再跑 [布局矩阵](../../../docs/acceptance/layout-and-reading.md) LAY-01～05。

图源修改后，用本地 PlantUML 在构建期重生成 diagram.svg，并同步替换 HTML 模板中的 SVG 与 `DIAGRAM_SOURCE`；检查脚本会阻止两者脱节。PlantUML/Java 只用于维护构建，不是打开 HTML 的前置条件。不要把样例脚本或原有验证日志复制为项目“通过”证据。

## 已知范围

未实现完整阅读器、文件上传、后台列表引擎、真实接口、未知异步结果、埋点或全项目覆盖；需要这些能力时回到适用模块和矩阵。布局与弹层的候选实现仍可能存在浏览器兼容问题，后续应根据真实回归修复。用户确认的是规范原则，不等于已认可这份新增代码的实际表现。
