# GitHub Desktop：本仓库下一步怎么用

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
