"""Build compact inventories for the Steam trial 17 review; never print source."""
from pathlib import Path
import collections
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "_data"
DATA.mkdir(parents=True, exist_ok=True)
TRIAL = Path(r"D:\模型汇总\GitHub维护测试\试跑17.0\项目原型交付_V1.1")
RUN = Path(r"D:\模型汇总\GitHub验收\验收17.0\RUN-001")
FINAL = Path(r"D:\模型汇总\CDK商城\Steam商城原型交付_V1.5")
FINAL_HTML = Path(r"D:\模型汇总\CDK商城\02_低保真交互原型-最终版本.html")


def read(path):
    return path.read_text(encoding="utf-8-sig")


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def save(name, value):
    (DATA / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def assignment(source, key):
    match = re.search(r"(?:const|let|var)\s+" + re.escape(key) + r"\s*=\s*|window\." + re.escape(key) + r"\s*=\s*", source)
    if not match:
        return None
    try:
        return json.JSONDecoder().raw_decode(source[match.end():])[0]
    except json.JSONDecodeError:
        return None


def document_index(folder):
    patterns = [r"TC-[A-Z0-9-]+", r"CHK-[A-Z0-9-]+", r"DEC-[A-Z0-9-]+", r"AC-[A-Z0-9-]+", r"DEF-[A-Z0-9-]+", r"API-[A-Z0-9-]+", r"(?:APP|WEB|ADM)-[A-Z0-9-]+", r"(?:COM|CL|ADM-COM)[A-Z0-9-]+"]
    result = {}
    for path in sorted(folder.glob("*.md")):
        text = read(path)
        result[path.name] = {
            "bytes": path.stat().st_size,
            "sha256": sha(path.read_bytes()),
            "lines": len(text.splitlines()),
            "headings": [{"line": n, "title": line[:180]} for n, line in enumerate(text.splitlines(), 1) if re.match(r"^#{1,6} ", line)],
            "ids": {pattern: sorted(set(re.findall(pattern, text))) for pattern in patterns},
        }
    return result


def markdown_pages(folder):
    path = folder / "01_页面与状态说明.md"
    if not path.exists():
        return []
    rows = []
    seen = set()
    for line in read(path).splitlines():
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        for index, cell in enumerate(cells):
            if re.fullmatch(r"(?:APP|WEB|ADM)-[A-Z0-9]+-\d+", cell) and cell not in seen:
                seen.add(cell)
                rows.append({"id": cell, "end": cell.split("-", 1)[0], "name": cells[index + 1] if index + 1 < len(cells) else ""})
                break
    return rows


def extract_html(folder, html_name, prefix, docs_base=None):
    path = folder / html_name
    raw = path.read_bytes()
    source = read(path)
    model = assignment(source, "MODEL") or {}
    if not model:
        page_model = assignment(source, "PAGES")
        if isinstance(page_model, list):
            model = {"pages": page_model}
    comps = assignment(source, "COMP_DOCS") or {}
    diagrams = assignment(source, "DIAGRAMS") or []
    docs = assignment(source, "DOCS") or []
    pages = model.get("pages", []) if isinstance(model, dict) else []
    state_count = sum(len(p.get("states", [])) for p in pages)
    if not pages:
        page_rows = markdown_pages(docs_base or folder)
        page_match = re.search(r"const\s+PAGES\s*=\s*\[([\s\S]*?)\]\s*;", source)
        if page_match:
            section = page_match.group(1)
            page_ids = re.findall(r"\bid:\s*['\"]((?:APP|WEB|ADM)-[A-Z0-9]+-\d+)['\"]", section)
            names = {p["id"]: p.get("name", "") for p in page_rows}
            pages = [{"id": page_id, "end": page_id.split("-", 1)[0], "name": names.get(page_id, ""), "states": [], "components": []} for page_id in page_ids]
            state_count = len(re.findall(r"\[\s*['\"][A-Z][A-Z0-9_]*['\"]\s*,", section))
        else:
            pages = page_rows
    page_rows = [{"id": p.get("id"), "end": p.get("end"), "name": p.get("name"),
                  "states": p.get("states", []), "components": p.get("components", p.get("comps", []))} for p in pages]
    comp_rows = [{"id": key, "name": value.get("name"), "pattern": value.get("pattern"),
                  "sections": len(value.get("sections", [])) if isinstance(value.get("sections"), list) else len(value.get("sections", {}))}
                 for key, value in comps.items()]
    diagram_rows = [{"id": d.get("id"), "type": d.get("type"), "title": d.get("title"),
                     "source_chars": len(d.get("src", d.get("puml", ""))), "svg_chars": len(d.get("svg", ""))}
                    for d in diagrams]
    docs_check = []
    for item in docs:
        name = item.get("file")
        external = (docs_base or folder) / name if name else None
        embedded = item.get("md", "")
        if not embedded and isinstance(item.get("content"), str):
            embedded = item["content"]
        norm = lambda value: value.replace("\r\n", "\n").replace("\r", "\n").rstrip()
        embedded_normalized = norm(embedded)
        external_normalized = norm(read(external)) if external and external.exists() else ""
        docs_check.append({"file": name, "embedded_version": item.get("ver"),
                           "embedded_chars": len(embedded_normalized),
                           "embedded_sha256": sha(embedded_normalized.encode("utf-8")),
                           "external_sha256": sha(external_normalized.encode("utf-8")) if external and external.exists() else None,
                           "exists": bool(external and external.exists()),
                           "match": bool(external and external.exists() and embedded_normalized == external_normalized)})
    summary = {"path": str(path), "bytes": len(raw), "sha256": sha(raw), "model_present": bool(model),
               "page_count": len(pages), "state_count": state_count,
               "instance_count": sum(len(p.get("components", p.get("comps", []))) for p in pages), "component_definition_count": len(comps),
               "diagram_count": len(diagrams), "embedded_doc_count": len(docs),
               "page_ends": dict(collections.Counter(p.get("end") for p in pages)),
               "embedded_docs_matched": sum(d["match"] for d in docs_check), "embedded_docs_checked": len(docs_check)}
    save(f"{prefix}-summary.json", summary)
    save(f"{prefix}-pages.json", page_rows)
    save(f"{prefix}-components.json", comp_rows)
    save(f"{prefix}-diagrams.json", diagram_rows)
    save(f"{prefix}-embedded-doc-check.json", docs_check)
    return summary


trial = extract_html(TRIAL, "02_低保真交互原型.html", "trial17-v11")
final_package = extract_html(FINAL, "02_低保真交互原型.html", "final-package-v15")
final_standalone_raw = FINAL_HTML.read_bytes()
final_standalone = {"path": str(FINAL_HTML), "bytes": len(final_standalone_raw), "sha256": sha(final_standalone_raw)}
final_standalone_summary = extract_html(FINAL_HTML.parent, FINAL_HTML.name, "final-standalone", docs_base=FINAL)
trial_docs = document_index(TRIAL)
final_docs = document_index(FINAL)
save("trial17-doc-index.json", trial_docs)
save("final-package-doc-index.json", final_docs)

build = json.loads(read(TRIAL / "_checks" / "build-report.json"))
fix_run = json.loads(read(TRIAL / "_checks" / "acceptance-fix-run.json"))
final_run = json.loads(read(TRIAL / "_checks" / "final-run.json"))
acceptance = json.loads(read(RUN / "验收问题清单.json"))
acceptance_text = read(RUN / "验收结论.md")
issues = acceptance.get("issues", [])
def_rows = [{"id": item.get("def_id", item.get("id")), "severity": item.get("severity"),
             "title": item.get("title"), "status": item.get("status"), "blocking": item.get("blocking"),
             "rule_refs": item.get("related_ids"), "evidence": item.get("evidence")} for item in issues]
save("trial17-first-acceptance-def-index.json", def_rows)
save("trial17-build-summary.json", build)
save("trial17-fix-run-summary.json", {"at": fix_run.get("at"), "artifact_sha256": fix_run.get("htmlSha256"),
     "summary": fix_run.get("summary"), "results": [{"id": r.get("id"), "title": r.get("title"), "ok": r.get("ok"), "evidence": r.get("evidence")} for r in fix_run.get("results", [])]})
save("trial17-final-run-summary.json", {"runId": final_run.get("runId"), "artifact": final_run.get("artifact"),
     "runtime": final_run.get("runtime"), "render": final_run.get("render"), "environment": final_run.get("environment"),
     "structural": final_run.get("structural"), "layout": final_run.get("layout"), "journeys": final_run.get("journeys")})

summary = {"trial17_v11": trial, "trial17_run001": {"run": "RUN-001", "tested_html_sha256": acceptance.get("artifact", {}).get("sha256"),
           "artifact_version": acceptance.get("artifact", {}).get("version"), "verdict": "failed" if "总体检查结论：**失败**" in acceptance_text else "see acceptance conclusion",
           "development_readiness": "暂不可进入开发" if "暂不可进入开发" in acceptance_text else "see acceptance conclusion", "issue_count": len(issues),
           "counts": acceptance.get("counts"), "repair_html_sha256": trial["sha256"],
           "same_artifact_as_repair": acceptance.get("artifact", {}).get("sha256") == trial["sha256"]},
           "final_v15_package": final_package, "final_standalone_html": {**final_standalone, "inventory": final_standalone_summary},
           "final_package_doc_files": sorted(final_docs), "trial17_doc_files": sorted(trial_docs),
           "build_counts": build.get("counts"), "fix_run": fix_run.get("summary"), "final_run_id": final_run.get("runId")}
screenshots = []
for name in ["trial17-v11-home.png", "final-v15-home.png", "final-standalone-home.png"]:
    path = DATA / name
    if path.exists():
        raw = path.read_bytes()
        screenshots.append({"file": name, "bytes": len(raw), "sha256": sha(raw), "viewport": "1440x900",
                            "browser": "Microsoft Edge headless; file://; default page state"})
summary["comparison_screenshots"] = screenshots
save("summary.json", summary)
print(json.dumps(summary, ensure_ascii=False, indent=2))
