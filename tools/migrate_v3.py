"""One-time, non-destructive migration of the supplied V3.0 into modules."""
import argparse
import json
import re
from pathlib import Path
from maintain import split_original, sha

GROUPS = [
    ('core', 'standards/core.md', '全局边界、交付、同源与关卡', ['1', '2', '3', '31'], [], 'normative'),
    ('workflow', 'standards/workflow-and-model.md', '快速摘要、流水线与需求/状态建模', ['0', '4', '5', '6'], ['core'], 'normative'),
    ('ui', 'standards/ui-and-components.md', '视觉、评审外壳、组件与模式库', ['7', '8', '9', '14', '15'], ['core'], 'normative'),
    ('client', 'standards/profiles/client.md', 'APP / H5 / 小程序', ['10'], ['core'], 'normative'),
    ('web', 'standards/profiles/desktop-web.md', '桌面业务 Web', ['11'], ['client'], 'normative'),
    ('admin', 'standards/profiles/admin.md', '管理后台与配置引擎', ['12', '16'], ['core'], 'normative'),
    ('runtime', 'standards/runtime-and-build.md', '交互运行时与单文件构建', ['13', '17'], ['ui'], 'normative'),
    ('reader', 'standards/diagrams-and-reader.md', '图示与离线文档阅读器', ['18', '19'], ['runtime'], 'normative'),
    ('docs-ui', 'standards/deliverables-ui.md', '00 / 01 / 03 交付规范', ['20', '21', '22'], ['core'], 'normative'),
    ('docs-business', 'standards/deliverables-business.md', '04 / 05 / 06 交付规范', ['23', '24', '25'], ['core'], 'normative'),
    ('quality', 'standards/quality-and-evidence.md', '07 / 08、验证与反模式', ['26', '27', '29', '33'], ['core'], 'normative'),
    ('change', 'standards/decisions-and-change.md', '09、变更回归与版本兼容', ['28', '30', '34'], ['core'], 'normative'),
    ('checklists', 'standards/contracts-and-checklists.md', '状态/动作/数据契约与检查清单', list('ABCDEFG'), ['core'], 'normative'),
    ('front', 'reference/original-front-matter.md', '原单文件封面与阅读索引（历史）', ['front'], [], 'reference'),
    ('legacy-prompts', 'reference/original-prompts.md', '原单文件提示词（历史兼容）', ['32'], [], 'reference'),
    ('examples', 'reference/examples.md', '参考实现与贯通示例', ['H', 'I'], [], 'reference'),
]


README = '''# AI 原型与组件级交付规范

本仓库用于维护「已评审 PRD → 单文件离线 HTML + 9 份 Markdown」的生成规范。当前规则基线为 **V3.0**，模块化结构为 **split-draft-1（待确认）**；尚未发布新规范版本。

## 从这里开始

- 给 AI 执行项目任务：[AI-START.md](AI-START.md)。
- 查询原章号在哪个文件：[章节索引](docs/CHAPTER-INDEX.md)。
- 查看当前版本、模块与依赖：[standard-manifest.json](standard-manifest.json)。
- 以后让 AI 修改规范：[维护流程](MAINTENANCE.md)。
- 确认本轮结果：[待确认事项](docs/REVIEW.md)；[实际核对记录](docs/MIGRATION-REPORT.md)。
- 学习 GitHub Desktop：[入门教程](docs/GITHUB-DESKTOP.md)。
- 原文只读存档：[V3.0](archive/AI原型图与组件级文档说明标准_V3.0.md)。

## 文件职责

| 位置 | 用途 |
| --- | --- |
| `standards/` | 今后修改规范的唯一活动来源；保留原章号和完整条款 |
| `reference/` | 原封面、旧提示词和示例；默认不随任务加载 |
| `templates/` | 9 份 MD 的起步骨架；不是已经完成的交付物 |
| `archive/` | 字节不变的原始基线；不用来覆盖活动模块 |
| `docs/` | 章号映射、核对、评审与使用教程 |
| `tools/` | 无第三方依赖的 Python 检查和导出工具 |
| `exports/` | 自动生成的阶段包/合订版；可重建，Git 默认忽略 |

本次仅拆分原文，不删除重复规则、不改强制程度、不重新定义交付范围。新的入口和路由属于建议的使用方式，尚待你确认。未来要合并重复条款，应单独提交语义修改。

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
python tools/maintain.py bundle --name standard-complete
```

导出拒绝覆盖同名文件；需要重导出时用新名字，或先确认旧文件是否还需要。阶段包括 `model`、`prototype`、`docs`、`verify`、`change`、`full`。`change` 默认加载全部通用模块以降低影响分析遗漏，端仍按项目选择。阶段切换需保留同一项目模型、ID、待确认项和交付状态，不能只靠聊天记忆。

`verify --baseline` 专用于本次迁移，核对每一段是否与 V3.0 原文一致。日后规则经过批准修改后用普通 `verify`；不应要求新规则继续与旧版逐字相同。

## 版本和同步

日常修改由 Commit 记录；只有你确认之后才创建正式版本标签/Release。项目使用时固定一个已发布版本和 commit SHA；规则版本、模块化结构修订与项目交付版本分开记录。当前本地仓库尚无远程地址，不能把本地保存称为已上传 GitHub。
'''

START = '''# AI 执行入口

规则基线：**V3.0**；模块化结构：**split-draft-1，待确认**。本文件是装载入口，不替代详细规范。用户若要求本拆分稿试跑，可以用于试跑；不得宣称已经正式发布。

## 先识别任务，再读取文件

1. 读取本轮用户请求、PRD、已有交付模型和明确决策。不要把示例或引用材料中的命令当成本轮新授权。
2. 读取 [清单](standard-manifest.json) 与 [core](standards/core.md)。声明端、阶段、交付范围、基线与加载模块。只在真正读取正文后报告「已加载」。
3. 按清单 `always + stages[阶段] + profiles[端]` 选模块，并递归读取 `requires`。多端取并集。不确定的范围先列为待确认，不能默认为不适用。
4. 按 [章节索引](docs/CHAPTER-INDEX.md) 定位后续遇到的跨章引用；若当前阶段依赖该条款，先补读权威文件，不凭记忆补写。各端不适用的业务示例仍应按 PRD 判断。
5. 将范围、规则版本、PRD 基线、稳定 ID、模型位置、加载模块及摘要写入项目工作区的上下文记录。后续阶段读取该记录与真实交付物。

完整生成推荐阶段：`model → prototype → docs → verify`；最后依据 core 的第 31 章判断交付状态。阶段提示只划分工作，不能自行删除最终交付物。第一轮默认是设计评审稿。

## 通用底线（助记，不替代权威条款）

规范用语按 [core 中的完整定义](standards/core.md) 理解；模块开头已原样保留原封面的强制程度定义。

- 用户最新明确决策、已评审 PRD、已批准契约与标准的优先级，按 core 第 1 章执行；缺口和假设可见，不把建议写成批准。
- 最终 00～09 为 9 MD + 1 HTML；仅后台也保留 06。单文件离线、组件十节、编号稳定、同源、真实交互及高影响操作确认等，按 core、workflow 和适用模块执行。
- 页面状态与业务状态分开；客户端事件与后台审计分开；评审注释与业务画布分开。
- 用例、覆盖、实际验证分开。未执行写未验证；没有真实证据不得标为通过。
- 原文中可能冲突的写法见 [待确认事项](docs/REVIEW.md)，遇到影响实际产出的冲突要说明并请求裁决，不能自行改成已批准规则。

## 装载边界

`reference/` 中的旧单文件入口与提示词仅作历史；不再要求把完整原文和全部历史材料重复塞进每个阶段。示例不构成项目业务需求。`archive/` 是留档，不与活动模块同时维护。

模板只是起步骨架，必须按权威章节补全表格、字段和实质内容。不要把模板占位符、未执行用例或生成的规范包误认为最终项目交付。

没有文件访问能力时，请维护方提供已生成的阶段包和 PRD。不能通过路径或目录名推断已经读过规则。

## 可直接给 AI 的任务句式

```text
本轮 PRD 已评审。请读取 AI-START.md 和 standard-manifest.json。
本次使用 V3.0 / split-draft-1 做试跑；先识别端和范围，按路由实际读取规则。
从建模开始，保存模型、稳定 ID 和待确认项；后续依次完成原型、文档、验证。
每阶段报告实际加载的模块与缺口，最终按标准关卡报告交付状态和未验证项。
```
'''

MAINTENANCE = '''# AI 辅助维护流程

目标：你描述问题并确认规则与发布，AI 执行影响分析、编辑、同步、检查和变更说明。让 AI 自动做机械工作，不让它把未确认的规则建议写成正式决定。

## 你可以这样提需求

```text
本次修改：后台列表可以根据字段复杂度申请超过 7 个主列。
请先分析影响，提出具体条款、例外条件、检查方法和版本建议，整理成可审阅差异。
未经我的明确确认，不把新的规则含义标为已批准，也不合并或发布正式版本。
```

## AI 每次应完成的事

1. 检查 Git 状态，保护已有未提交修改。读取 AI-START、清单、相关章节与 REVIEW，识别本次请求是否已包含具体规则授权。
2. 先分析影响：规则、各端、模板、路由、检查表、示例、既有项目兼容性。小错字、格式、坏链接和已授权内容同步可直接修；资金、权限、范围、强制程度、交付结构的新增决策需给你具体方案。
3. 在分支或本地待审修改中完成可逆的修改，不覆盖 archive。不要把本次用户确认的项目例外自动升级成所有项目的通用规则。
4. 同步活动规范、AI 入口（若适用）、清单依赖、模板和检查表。保留章号和定位标记；跨章搬迁要更新映射，不能静默丢掉引用。
5. 更新 CHANGELOG。若行为不兼容，补 MIGRATION；版本号建议可以列出，但不能提前宣布已发布。
6. 运行 `python tools/maintain.py verify`。再做本次有意义的专项检查；涉及加载路由时生成代表性阶段包；涉及规则执行效果时用对应 PRD 试跑。
7. 给你交付「改了什么、为什么、影响哪些文件、实际检查、尚未验证、需要你确认的具体点」。不要只问抽象的“是否继续”。
8. 你确认规则后再记录批准依据；你明确授权提交、合并、推送或发布时再执行对应操作。不要把本地写文件、Commit、Push、Release 混为同一个动作。

## 建议的确认节奏

你通常只需确认规则含义和范围，以及正式发布。AI 可以一次准备完整可审阅的结果，减少逐步追问。若你已明确授权某类动作，后续按授权执行，不重复询问。

初次使用先试跑 2～3 份代表性 PRD：客户端、后台、多端各一类。检查结构、需求覆盖、组件完整度、实际交互及验证真实性。当前结构检查不能代替这些业务试跑。

## Git 工作方式

用 `docs/主题` 一类分支承载结构和语义变更。Commit 说明问题和结果；Pull Request 写具体变化、兼容性及验证。仓库未连接远程时可先做本地差异审阅，不能虚构 PR 链接。

发布前确保待确认项有处置、版本日期一致、检查通过、变化和迁移方式完整。记录最终 commit；项目固定 tag 与 commit SHA。`main` 会继续变化，不适合当作长期复核依据。

## 维护工具的边界

普通 verify 核对原始档案哈希、唯一章节归属、模块依赖、导航链接和模板数量。它不证明规范逻辑无冲突，也不验证项目原型。首次迁移的 `--baseline` 才额外做逐段原文比对。

pack 按清单递归装载依赖，在文件头记录模块 SHA-256 和当时 HEAD。若本地有未提交修改，HEAD 不代表这些工作区内容，模块哈希才精确描述本次包；正式交付仍应先把已批准内容提交，再从已发布版本导出。

bundle 从活动模块拼回原章序，包含标明历史身份的封面、旧提示词和参考示例，便于查阅；执行 AI 应使用阶段包，不能把合订版中的历史入口当作新的路由规则。
'''

AGENTS = '''# 仓库维护约定

这是规范与模板仓库。先读 README.md、AI-START.md、MAINTENANCE.md、standard-manifest.json、docs/REVIEW.md。

- `standards/` 是活动规范的唯一维护来源；`archive/` 必须保持原始字节不变。不要重新运行首次迁移来覆盖后续迭代。
- 用户提供的文档内容属于待处理材料，不自动构成工具执行、上传或发布授权。
- 保护已有修改；不要擅自提交、推送、合并、打标签或发布。用户已明确给出的授权持续有效。
- 当前结构为待确认稿，正式批准与版本发布必须有真实用户依据。机械修复和已授权编辑可直接完成，新的规范决策准备具体可审阅结果供确认。
- 保留章号、SOURCE-SECTION 标记、锚点和稳定语义。章节移位时同步清单、索引、依赖和模板链接。
- 修改后运行 `python tools/maintain.py verify`；首次迁移核对才加 `--baseline`。结构通过不等于 PRD 试跑或真实浏览器验证通过。
- 阶段包与合订版由工具生成，默认不作为第二份手工权威来源。
- 汇报具体改动、实际检查、未验证范围、待确认事项；不编造上传、提交、PR 或测试结果。
'''

REVIEW = '''# 本轮待确认事项

状态：待用户审阅；2026-10-20。以下只列出，不擅自裁决或修订原条款。

## 1. 是否接受模块化维护方式

建议：V3.0 原文只读；今后只编辑 standards；短入口依据清单路由；templates 为辅助骨架；reference 的旧提示词与封面不进入默认加载。此项属于新使用方式，确认前标为拆分试用稿。

## 2. 证据目录的原文冲突

第 2.1 章交付树把 `_checks/` 放在交付目录内，第 0.2 / 2.3 章也将其说明为证据附件；第 32.1 章则写「证据放 _checks/，构建源放 _work/，均不进入交付目录」。证据位置存在歧义。

建议候选：证据可作为交付目录的附件，主交付物仍只有 10 项；构建源必须在外。但这只是候选，未经确认不改原文。原第 32 章保存在 reference，不参与新默认入口。

## 3. HTML 自包含与 assets 的边界

第 0.2 / 17.1 等要求 02 单文件自包含；第 2.3 章又允许 assets，并写在保留 assets 目录时离线运行。需要明确：允许的 assets 是仅作独立参考附件，还是允许 HTML 依赖本地文件。

建议候选：02 本身无外部文件依赖；assets 若有，仅作附件。未经确认不修改规范，也不把此建议宣称为既有规则。

## 4. 流水线名称与步骤数量

第 0.3 标题写「十二步」，表格是 S0～S12，共 13 项。建议只改名称为「十三步」或「S0～S12 生成流水线」，属于不改工作内容的澄清。本轮先保持原文供核对。

## 5. 后续优化是否另开一轮

本轮不删除摘要、详细条款、反模式、附录之间的重复说明，以保证原文完整迁移。建议下一轮再提稳定规则编号、归口去重和清单生成方案，并逐项比较修改前后含义。

## 确认记录

确认人：未确认。

确认日期：未确认。

发布授权：尚未获得；没有创建版本标签、远程仓库、Pull Request 或 Release。
'''

GITHUB = '''# GitHub Desktop：本仓库下一步怎么用

当前仓库已在本地建立。AI 的文件修改会出现在 GitHub Desktop 的 Changes（修改）页面。

1. 左上角选择 `ai-prototype-standard` 仓库；如果未列出，File → Add local repository，选本仓库目录。
2. 在 Changes 逐文件查看修改，重点看 README、AI-START、docs/REVIEW、CHANGELOG 和核对记录。原文存档与模块全文较长，核对记录说明逐段比对结果。
3. 你确认后再 Commit。提交标题可用「docs: 建立 V3.0 模块化试用稿」，不要把它描述为正式 V3.1 已发布。
4. 要上传时点击 Publish repository（发布仓库），核对账户、仓库名，并保持 Keep this code private（保持私有）勾选。登录和认证由你完成。
5. Publish 是建立 GitHub 远程仓库并上传，不等于创建规范的 Release。上传完成后，把仓库链接提供给维护 AI，它才能核实同步状态和按授权维护。
6. 后续日常修改：Fetch/Pull 获取更新 → 新建分支 → AI 修改与检查 → 你审阅 → Commit → Push → Pull Request → 确认后合并。

当前尚无远程地址，AI 没有上传文件或创建正式发布版。你可以先审阅本地内容再决定同步。

| 英文 | 意义 |
| --- | --- |
| Changes | 当前未提交修改 |
| History | 已提交历史 |
| Commit | 在本地记录一次修改 |
| Push origin | 将本地提交上传远程 |
| Pull origin | 获取远程提交到本地 |
| Publish repository | 首次在 GitHub 建立并上传仓库 |
| Release | 对一个确定提交创建可供项目固定引用的规范发布版 |
'''


def put(root, relative, content):
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8', newline='\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--repo', type=Path, required=True)
    args = parser.parse_args()
    root = args.repo.resolve()
    if (root / 'standard-manifest.json').exists():
        raise SystemExit('Already migrated; refusing to overwrite maintained files')
    if not (root / '.git').is_dir():
        raise SystemExit('Expected the user-created local Git repository')
    # No writes until all planned target paths have been checked.
    targets = [g[1] for g in GROUPS] + ['AGENTS.md', 'AI-START.md', 'MAINTENANCE.md',
              'standard-manifest.json', 'CHANGELOG.md', 'MIGRATION.md', '.gitignore',
              'docs/REVIEW.md', 'docs/CHAPTER-INDEX.md', 'docs/GITHUB-DESKTOP.md',
              'docs/MIGRATION-REPORT.md', 'archive/AI原型图与组件级文档说明标准_V3.0.md']
    if any((root / p).exists() for p in targets):
        raise SystemExit('A planned destination already exists; inspect before migration')
    raw = args.source.read_bytes()
    original = raw.decode('utf-8-sig').replace('\r\n', '\n')
    parts, order = split_original(original)
    keys = [k for g in GROUPS for k in g[3]]
    if len(keys) != len(set(keys)) or set(keys) != set(order):
        raise SystemExit('Source section map is incomplete or duplicated')
    baseline_path = 'archive/AI原型图与组件级文档说明标准_V3.0.md'
    (root / 'archive').mkdir()
    (root / baseline_path).write_bytes(raw)
    modules = []
    for mid, path, title, sections, requires, role in GROUPS:
        modules.append(dict(id=mid, path=path, title=title, sections=sections, requires=requires, role=role))
        rel_index = '../../docs/CHAPTER-INDEX.md' if '/profiles/' in path else '../docs/CHAPTER-INDEX.md'
        notice = ('这是活动规范模块；原章号与条款完整保留。' if role == 'normative' else
                  '这是历史入口或参考示例，不是当前任务的默认指令入口；示例业务不构成 PRD。')
        header = f'# {title}\n\n规则基线：V3.0；结构修订：split-draft-1（待确认）。\n\n{notice}\n\n原文中的跨章引用请按 [章节索引]({rel_index}) 找到权威文件；不要把缺失上下文当作不适用。\n\n'
        if mid == 'core':
            terms = parts['front'].split('**强制性用语：**\n', 1)[1].split('\n---\n', 1)[0].strip()
            header += ('## 规范用语\n\n以下定义从 [原封面](../reference/original-front-matter.md#s-front) 原样引用，使单独加载本模块时仍能正确理解强制程度。\n\n' + terms + '\n\n')
        body = ''.join(f'<!-- SOURCE-SECTION: {k} -->\n<a id="s-{k}"></a>\n' + parts[k] for k in sections)
        put(root, path, header + body)
    general = ['workflow', 'ui', 'runtime', 'reader', 'docs-ui', 'docs-business', 'quality', 'change', 'checklists']
    manifest = dict(rule_version='V3.0', layout_revision='split-draft-1', status='pending-user-review',
        baseline={'path': baseline_path, 'sha256': sha(raw), 'bytes': len(raw), 'date': '2026-10-19'},
        migration_date='2026-10-20', section_order=order, modules=modules, always=['core'],
        profiles={'client': ['client'], 'web': ['web'], 'admin': ['admin']},
        stages={'model': ['workflow', 'docs-business', 'change'],
                'prototype': ['workflow', 'ui', 'runtime', 'reader', 'docs-ui'],
                'docs': ['workflow', 'docs-ui', 'docs-business', 'quality', 'change'],
                'verify': ['quality', 'checklists'], 'change': general, 'full': general})
    put(root, 'standard-manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    index = '# 原章节 → 当前权威文件\n\n保留原章号作为稳定定位；无需翻阅全部模块来寻找引用。历史入口和示例标为 reference，默认不装载。\n\n| 原章号 | 标题 | 文件 | 类型 |\n| --- | --- | --- | --- |\n'
    for key in order:
        mod = next(m for m in modules if key in m['sections'])
        title = parts[key].splitlines()[0].lstrip('# ').replace('|', '\\|')
        index += f"| {key} | {title} | [{mod['id']}](../{mod['path']}#s-{key}) | {mod['role']} |\n"
    put(root, 'docs/CHAPTER-INDEX.md', index)
    for name, content in [('README.md', README), ('AI-START.md', START), ('MAINTENANCE.md', MAINTENANCE),
                          ('AGENTS.md', AGENTS), ('docs/REVIEW.md', REVIEW), ('docs/GITHUB-DESKTOP.md', GITHUB)]:
        put(root, name, content)
    put(root, '.gitignore', '# Generated and reproducible; never maintain a second source here.\nexports/\n__pycache__/\n*.pyc\n.DS_Store\nThumbs.db\n')
    attrs = (root / '.gitattributes').read_text(encoding='utf-8')
    put(root, '.gitattributes', attrs.rstrip() + '\n# Keep the supplied archived baseline byte-for-byte, including line endings.\narchive/*.md -text\n')
    put(root, 'CHANGELOG.md', '''# 变更记录\n\n## 未发布：split-draft-1（2026-10-20）\n\n规则基线仍为 V3.0，尚无用户批准的新规则或正式新版本。\n\n- 保存原始文件字节和 SHA-256；按原章号完整迁移到 13 个规范模块与 3 个历史/示例文件。\n- 新增短入口、模块依赖与阶段路由、章节映射、9 份 MD 起步模板、维护流程和本地检查/导出工具。\n- 原规则重复、冲突与示例内容保留；发现的证据目录、assets、自包含与流水线计数问题列入 REVIEW，未擅自修改。\n- 是否正式采用结构、如何修订歧义、是否提交和发布，等待用户确认。\n\n## V3.0（上游文档，2026-10-19）\n\n原文现行基线；仓库保存其完整文件，不代表已在此创建同名 Git 标签或 GitHub Release。\n''')
    put(root, 'MIGRATION.md', '''# 迁移说明\n\n## 从单文件 V3.0 迁到模块化试用稿\n\n规则内容不变；变的是维护和装载方式。原文在 archive 中只读，所有活动条款分配到 standards，原章号与编号保持。原封面和第 32 章中的单文件使用指令保存在 reference 作为历史材料，由 AI-START 和清单提供新入口。\n\n首次使用请确认当前结构，按章节索引读取模块；项目记录「规则 V3.0 / 结构 split-draft-1」以及文件快照，不能只写最新版。旧项目继续固定原基线，不自动改写，也不继承旧验证结果到新交付。\n\n未来修改规则只编辑活动模块，不回写 archive，不重新执行 migrate_v3.py。需要改变交付结构、强制要求或例外边界时，另写不兼容影响与迁移方案并等待用户确认。\n\n本轮还没有完整 PRD 对照试跑；结构和逐段核对结果见 docs/MIGRATION-REPORT.md。\n''')
    names = {'00': '交付说明与变更记录', '01': '页面与状态说明', '03': '组件级文档',
             '04': '业务流程与异常规则', '05': '接口数据与权限说明', '06': '埋点文档',
             '07': '测试用例', '08': '验证记录与验收映射', '09': '待确认事项与设计决策'}
    chapters = dict(zip(['00', '01', '03', '04', '05', '06', '07', '08', '09'], range(20, 29)))
    comp_sections = ['功能/组件名称', '数据来源', '功能交互逻辑', '界面反馈与体验表现', '组件样式',
                     '状态变更', '数据流转与接口', '埋点和日志', '测试与验收条件', '待确认项']
    for number, title in names.items():
        key = str(chapters[number])
        module = next(m for m in modules if key in m['sections'])
        source_link = f"../{module['path']}#s-{key}"
        content = f'# {number}_{title}\n\n> 起步模板，待填写；不是完成稿或验证证据。使用前读 [原规范第 {key} 章]({source_link}) 并补全规定字段与表格。\n\n'
        content += '文档版本 / 批次：待填写\n\nPRD 基线与来源章节：待填写\n\n适用端与范围：待填写\n\n文档状态：待评审\n\n关联文件：待填写\n\n更新时间：待填写\n\n编写方式：AI 辅助\n\n评审人与确认日期：\n\n'
        if number == '03':
            content += '## 页面概览（逐页复制填写）\n\n待填写业务目的、入口出口、角色、组件列表与关联流程。\n\n### 组件 ID 与名称（逐组件填写，编号稳定）\n\n'
            for i, heading in enumerate(comp_sections, 1):
                content += f'#### {i}. {heading}\n\n待填写。\n\n'
            content += '共享定义集中维护，实例标明差异；不能以「同上」省略十节。最终 03 还须满足原规范可解析结构，当前骨架本身不证明解析通过。\n'
        elif number == '06':
            content += '## 范围与适用性\n\n待判断：仅后台应写不适用依据、事件数 0，不生成空白事件表；客户端也需按实际需求判断事件。\n\n## 事件明细\n\n适用时严格使用第 25.2 章固定七列；这里不预填业务事件或属性。\n\n## 触发与统计口径\n\n待填写。\n\n## 属性复用与敏感信息边界\n\n待填写。\n'
        else:
            fixed = parts[key].split('### ' + key + '.1 ', 1)[1].split('\n### ', 1)[0]
            headings = re.findall(r'^\d+\. (.+?)[；。]?$', fixed, re.M)
            if not headings:
                raise ValueError(f'No fixed template headings for {key}')
            for i, heading in enumerate(headings, 1):
                content += f'## {i}. {heading.rstrip("；。")}\n\n待填写；依据权威章节补齐表格与内容。\n\n'
        if number == '07':
            content += '\n初始执行状态：未执行。编写了用例不等于执行通过。\n'
        if number == '08':
            content += '\n实际验证：尚未执行；只记录真正执行的方法、结果、证据及限制。\n'
        put(root, f'templates/{number}_{title}.md', content)
    put(root, 'templates/README.md', '''# 起步模板\n\n这里是 9 份 MD 的空白骨架，不包含 02 原型 HTML，也不是完整生成器。文件内链接指向权威要求，AI 必须按要求补齐字段、表格、规则和实质内容，不能直接把占位模板交付。\n\n模板里的「待填写」不是规范允许的最终内容；不适用必须说明依据。07 默认未执行，08 没有验证通过记录，06 的后台不适用逻辑须保留。\n''')
    put(root, 'docs/MIGRATION-REPORT.md', '# 迁移核对记录\n\n尚未执行；由维护 AI 在实际运行工具后填写。\n')
    print(f'MIGRATED: {len(parts)} source sections -> {len(modules)} modules; 9 starter templates; baseline SHA-256 {sha(raw)}')


if __name__ == '__main__':
    main()
