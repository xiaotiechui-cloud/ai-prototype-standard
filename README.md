# AI 原型与组件级交付规范

本仓库用于维护「已评审 PRD → 单文件离线 HTML + 9 份 Markdown」的生成规范。当前规则基线为 **V3.0**；用户已确认模块化维护及本轮澄清，维护结构为 **modular-1（未发布）**。

当前内容修订为 `draft-20261027-trial13-contracts`：用户批准试跑13全部建议，补齐需求子职责覆盖、输入类型几何隔离、结果协议/汇总有效性、决策与实施状态分离，并强化既有规则的紧凑执行契约；详见[本轮确认与落实](docs/reviews/2026-10-27-steam-trial13/08_确认与落实.md)。新增[最小输入参考](reference/implementations/input-kit/README.md)按需试点，不自动进入默认装载或晋级黄金样例。此前最终版稳定特征与已批准规则继续有效。V3.0 / modular-1 保持，未正式发布，项目浏览器试跑尚未执行。

试跑4.0的[五批细节比较与规则提炼](docs/reviews/2026-10-21-steam-trial4/00_审查摘要.md)已完成分析：40项观察、33项局部函数夹具、24职责域映射；[两处澄清方案](docs/reviews/2026-10-21-steam-trial4/18_规则提炼与方案_待审.md)已获用户审核并落实到原权威章节、模板及按需方法。商城待查证业务范围仍由项目04/05/09明确。原型未改，提供方已有浏览器记录单独保留，本轮40个浏览器父场景未执行，不代表试跑验收通过。

本轮将AI自测/修复/回归及最终文件证据归入quality，并补齐画布滚动、模拟条件、后台人工排序、权限空分组、桌面布局、弹层宿主定位和灰度组件一致性规则；按能力加载 [模式细节](docs/patterns/README.md)，商城设计/订单标签留 [项目契约](reference/projects/steam-store.md)。长报告不进入默认装载。

历史依据为 [试跑2.0全域差异](docs/reviews/2026-10-20-steam-trial2/00_阅读与确认.md) 及 [V2.2规则复核](docs/reviews/2026-10-20-cross-model-selftest/00_重新梳理与结论.md)。条款已确认不等于原型通过：60条浏览器用例、跨模型生成试验仍未执行，参考代码未晋级为浏览器验收通过。

七主题之外的补充比较见[试跑3.0补充审查摘要](docs/reviews/2026-10-21-steam-trial3-extension/00_补充审查摘要.md)：32项细节观察、[8组已确认条款审阅记录](docs/reviews/2026-10-21-steam-trial3-extension/07_规则提炼与归口方案_待审.md)及32个未执行浏览器父场景。多数为既有规则执行细化，已归入活动规范并同步模板/按需方法；长报告不加入默认装载。

## 从这里开始

- 给 AI 执行项目任务：[AI-START.md](AI-START.md)。
- 查询原章号在哪个文件：[章节索引](docs/CHAPTER-INDEX.md)。
- 查询稳定规则 ID 与权威归口：[规则索引](docs/RULE-INDEX.md)。
- 查看当前版本、模块与依赖：[standard-manifest.json](standard-manifest.json)。
- 以后让 AI 修改规范：[维护流程](MAINTENANCE.md)。
- 查看用户确认记录与发布状态：[评审记录](docs/REVIEW.md)；[实际核对记录](docs/MIGRATION-REPORT.md)。
- 学习 GitHub Desktop：[入门教程](docs/GITHUB-DESKTOP.md)。
- 排查布局、工具或动作问题：[按需验收矩阵](docs/acceptance/README.md)；[局部参考实现](reference/implementations/review-kit/README.md)；[黄金样例档案](reference/golden/README.md)。
- 原文只读存档：[V3.0](archive/AI原型图与组件级文档说明标准_V3.0.md)。

## 文件职责

| 位置 | 用途 |
| --- | --- |
| `standards/` | 今后修改规范的唯一活动来源；保留原章号和完整条款 |
| `reference/` | 历史材料、局部参考实现和黄金样例档案；默认不随任务加载 |
| `templates/` | 9 份 MD 的起步骨架；不是已经完成的交付物 |
| `archive/` | 字节不变的原始基线；不用来覆盖活动模块 |
| `docs/` | 章号映射、核对、评审与使用教程 |
| `tools/` | 规范检查/导出无 Python 第三方依赖；参考代码专项检查另需 Node.js |
| `exports/` | 自动生成的阶段包/合订版；可重建，Git 默认忽略 |

V3.0 原文只读；活动规范位于 `standards/`。快速摘要与清单引用稳定规则 ID 和权威章节；详细执行方法保留在归口章节。

## 使用方式

能读取本地仓库的 AI：提供 PRD、AI-START.md，并要求按清单实际读取对应模块。

不能读取仓库的 AI：让维护 AI 从固定版本生成阶段规范包，上传包文件和 PRD；只给链接或文件路径不会自动加载正文。

完整项目仍需依次完成建模、原型、文档、验证。阶段包的目的是减少单个阶段输入，不能把最终 10 项交付要求自动缩减。桌面业务 Web 默认同时加载客户端共用规范；后台专用项目仍保留 06 并写不适用依据。

## 本地工具

以下命令供维护 AI 使用，在仓库根目录运行，要求 Python 3.10+。不需要你日常手工输入。

```powershell
python tools/maintain.py verify
python tools/maintain.py pack --stage model --profiles admin --name admin-model
python tools/maintain.py pack --stage full --profiles client web admin --name all-platforms-full
python tools/maintain.py pack --stage prototype --profiles client --support acceptance-context review-kit --name client-review-reference
python tools/maintain.py bundle --name standard-complete
```

导出拒绝覆盖同名文件；需要重导出时用新名字，或先确认旧文件是否还需要。阶段包括 `model`、`prototype`、`docs`、`verify`、`change`、`full`。`change` 默认加载全部通用模块以降低影响分析遗漏，端仍按项目选择。阶段切换需保留同一项目模型、ID、待确认项和交付状态，不能只靠聊天记忆。

`--support` 仅显式加入清单中的辅助材料，并记录哈希；`full` 仍不默认导入这些正文。参考代码检查使用 `python tools/check_reference.py`，需 Node.js（仅内置模块），其结果不包含浏览器验证。已有样例 HTML 无这些运行依赖，Java/PlantUML 只在修改图源后重建时使用。

`verify --baseline` 仅用于迁移时的历史核验；本轮已按用户确认修订活动规范，预期不再与 V3.0 逐字一致。日常使用普通 `verify`。

## 版本和同步

日常修改由 Commit 记录；只有你确认之后才创建正式版本标签/Release。项目使用时固定一个已发布版本和 commit SHA；规则版本、模块化结构修订、内容维护稿与项目交付版本分开记录。仓库 origin 为 [GitHub 仓库](https://github.com/xiaotiechui-cloud/ai-prototype-standard)；本轮起始本地 main 为 7a89f54，本轮评审与规范落实修改尚未提交/推送，云端同步未核实，由用户自行操作。
