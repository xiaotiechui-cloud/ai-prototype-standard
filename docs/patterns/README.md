# 按能力读取的模式细节

这些文件是活动规范的执行辅助，按PRD能力选择，不另立规则或新增业务需求。权威为 [ui15](../../standards/ui-and-components.md#s-15)、各端专章及 [自测协议](../../standards/quality-and-evidence.md#s-29)。模式按需不意味着既有强制要求可随意省略。

| 涉及能力 | 文件 / support ID | 对应既有PAT | 前轮分析来源 |
| --- | --- | --- | --- |
| 导航、搜索、详情、媒体、图示 | [内容与导航](content-and-navigation.md) / `patterns-content` | NAV、INPUT、TAG、LIST、GALLERY、DGM | P01～P04、P17 |
| 依赖表单、父子层、对象选择、素材 | [表单与层级](forms-and-layers.md) / `patterns-forms` | INPUT、CHOICE、MODAL、DRAWER、GALLERY | P05～P08 |
| 配置发布、交易、状态、副作用、审计 | [数据与交易](data-and-transactions.md) / `patterns-data` | ACTION、BATCH、EXPORT、FEEDBACK | P09～P11、P15～P16 |
| 查询、异步、表格和跨文档一致 | [查询与异步](queries-and-async.md) / `patterns-query` | FILTER、TABLE、PAGE、LIST | P12～P14、P18 |

P01～P18仅是前轮评审追溯编号，不成为第二套正式PAT。项目在01记录已选模式、加载文件/哈希、适用端、依据与覆盖；填写03十节，并将真实操作映射07、结果归08。不要求读取整个历史分析目录。

细节契约复用现有模型：`页面/组件/父层ID、职责、区块与顺序、尺寸令牌/覆盖、数据来源、状态/中文标签、入口与守卫、写入/不变断言、退出/恢复、并发失效、TC/依据`。数值有默认则引用，推断须标明，不凭案例私设统一阈值。

经过验证的共用实现按 [黄金样例准入](../../reference/golden/README.md) 晋级；当前参考代码不因条款批准自动成为浏览器验收通过。商城特定结构和状态见 [项目契约](../../reference/projects/steam-store.md)，仅项目匹配或明确选用时读取。
