"""Check the approved trial4 rule rollout without rerunning historical analysis."""
from pathlib import Path
import hashlib, json, re, subprocess

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]

def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def load(name: str):
    return json.loads((OUT / name).read_text(encoding="utf-8"))

def git_text(spec: str) -> str:
    run = subprocess.run(["git", "show", spec], cwd=ROOT, capture_output=True, check=True)
    return run.stdout.decode("utf-8").replace("\r\n", "\n")

base = load("05_当前基线.json")
manifest = json.loads((ROOT / "standard-manifest.json").read_text(encoding="utf-8"))
assert manifest["content_revision"] == "draft-20261021-trial4-detail"
assert manifest["rule_version"] == "V3.0" and manifest["layout_revision"] == "modular-1"
old_manifest = json.loads(git_text(base["head"] + ":standard-manifest.json"))
comparable = dict(manifest)
comparable["content_revision"] = base["content_revision"]
assert comparable == old_manifest, "manifest routing or resource registration changed"

for path, expected in base["archive"].items():
    assert sha(ROOT / path) == expected, f"archive changed: {path}"
for path, expected in base["inputs"].items():
    assert sha(Path(expected["path"])) == expected["sha256"], f"input changed: {path}"
same_source = load("07_当前同源核对.json")
for item in same_source["documents"]:
    assert sha(Path(item["file"])) == item["external_sha256"], item["file"]
provided = load("09_随附证据归属核对.json")
for item in provided["files"]:
    assert sha(Path(item["path"])) == item["sha256"], item["path"]
final_docs = load("20_最终版外部文档哈希复核.json")
for item in final_docs["documents"]:
    assert sha(Path(item["path"])) == item["sha256"], item["path"]

changed_modules = {"standards/core.md", "standards/deliverables-business.md"}
module_results = {}
for path, expected in base["modules"].items():
    actual = sha(ROOT / path)
    module_results[path] = {"baseline": expected, "actual": actual, "changed": actual != expected}
    if path not in changed_modules:
        assert actual == expected, f"unexpected module change: {path}"
assert all(module_results[p]["changed"] for p in changed_modules)

core = (ROOT / "standards/core.md").read_text(encoding="utf-8")
business = (ROOT / "standards/deliverables-business.md").read_text(encoding="utf-8")
assert "稳定成员身份、成员变化规则及父状态的权威来源" in core
assert "一个成员完成不得提前表示全部成员完成" in core
assert "字符串枚举“0/1”、字符串“false/true”与布尔值是否等价须由契约确定" in business
assert "解析失败不得静默写入默认值或保留旧值并反馈成功" in business

required = {
    "templates/03_组件级文档.md": ["原始类型、解码契约", "聚合条件"],
    "templates/04_业务流程与异常规则.md": ["稳定成员身份", "空批次"],
    "templates/05_接口数据与权限说明.md": ["原始类型", "稳定成员ID"],
    "templates/07_测试用例.md": ["非法数值", "重复回执"],
    "templates/08_验证记录与验收映射.md": ["输入原值", "成员前后状态"],
    "docs/patterns/forms-and-layers.md": ["枚举解码", "聚合条件"],
    "docs/patterns/data-and-transactions.md": ["重复回执", "全局原子提交"],
    "docs/acceptance/actions-and-results.md": ["ACT-16", "ACT-17"],
    "docs/acceptance/README.md": ["字段解码", "批次聚合"],
}
for path, needles in required.items():
    body = (ROOT / path).read_text(encoding="utf-8")
    for needle in needles:
        assert needle in body, f"missing {needle}: {path}"

review = (OUT / "18_规则提炼与方案_待审.md").read_text(encoding="utf-8")
assert "已确认，保留原待审文件名" in review and "已审核通过" in review
assert (OUT / "22_确认与落实.md").exists()
approved = re.findall(r"^> (.+)$", review, re.M)
exceptions = re.findall(r"^\*\*例外/边界：\*\* (.+)$", review, re.M)
assert len(approved) == len(exceptions) == 2
for index, path in enumerate(["standards/deliverables-business.md", "standards/core.md"]):
    body = (ROOT / path).read_text(encoding="utf-8")
    old = git_text(base["head"] + ":" + path)
    for paragraph in (approved[index], exceptions[index]):
        assert body.count(paragraph) == 1, (path, "approved paragraph missing or duplicated")
        body = body.replace(paragraph + "\n\n", "", 1)
    assert body == old, (path, "change beyond approved paragraphs")

for path in ["README.md", "AI-START.md", "MIGRATION.md", "CHANGELOG.md", "docs/REVIEW.md"]:
    assert manifest["content_revision"] in (ROOT / path).read_text(encoding="utf-8"), path
for path in ["build_reports.py", "verify_review.py"]:
    assert "Historical analysis" in (OUT / path).read_text(encoding="utf-8"), path

# Keep the protected review evidence and old inputs out of the implementation diff.
status = subprocess.run(["git", "status", "--short"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
for forbidden in ["02_低保真交互原型", "archive/", "_checks/"]:
    assert forbidden not in status, f"protected path appears in status: {forbidden}"

command_results = []
for command in [["python", "tools/maintain.py", "verify"], ["git", "diff", "--check"]]:
    run = subprocess.run(command, cwd=ROOT, capture_output=True)
    record = {"command": command, "exit_code": run.returncode,
              "stdout": run.stdout.decode("utf-8", errors="replace").strip(),
              "stderr": run.stderr.decode("utf-8", errors="replace").strip()}
    command_results.append(record)
    assert run.returncode == 0, record

head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
branch = subprocess.run(["git", "branch", "--show-current"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
assert head == base["head"] and branch == "main", "unexpected commit or branch change during implementation"

result = {
    "status": "implementation-consistency-pass",
    "approved_revision": manifest["content_revision"],
    "date": "2026-10-21",
    "branch": branch,
    "head": head,
    "worktree_changes_uncommitted": True,
    "module_hashes": module_results,
    "manifest_sha256": sha(ROOT / "standard-manifest.json"),
    "manifest_only_change": "content_revision",
    "input_hashes": base["inputs"],
    "protected_file_counts": {"archive": len(base["archive"]), "prototype_inputs": len(base["inputs"]),
                              "trial_external_md": len(same_source["documents"]),
                              "final_external_md": len(final_docs["documents"]),
                              "provided_evidence": len(provided["files"])},
    "changed_modules": [p for p, v in module_results.items() if v["changed"]],
    "protected": ["archive", "trial4 input", "final input", "provided _checks evidence"],
    "checks": [
        "approved core3.4 and business24.5 text present with exceptions",
        "approved paragraphs and exceptions exactly match proposal; prior module text preserved",
        "only the two intended normative modules changed",
        "manifest changed only content_revision; routes, dependencies, resource registration unchanged",
        "templates, patterns, acceptance actions and routing trigger synchronized",
        "entry points, migration, changelog, review status and historical generator guards synchronized",
        "historical review inputs and archive unchanged",
    ],
    "commands": command_results,
    "git_actions": "no commit/push/tag/release performed",
    "not_verified": ["browser behavior", "prototype acceptance", "production business semantics"],
}
(OUT / "23_规则落实核对.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"status": result["status"], "checks": len(result["checks"]),
                  "protected_file_counts": result["protected_file_counts"],
                  "commands": [{"command": x["command"], "exit_code": x["exit_code"], "stdout": x["stdout"]}
                               for x in command_results]}, ensure_ascii=False))
