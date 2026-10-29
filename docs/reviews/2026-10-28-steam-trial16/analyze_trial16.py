"""Build compact, source-local inventories for the Steam trial 16 review."""
from pathlib import Path
import collections
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "_data"
DATA.mkdir(parents=True, exist_ok=True)
TRIAL = Path(r"D:\模型汇总\GitHub维护测试\试跑16.0\Steam商城_原型交付_V1.6")
FINAL = Path(r"D:\模型汇总\CDK商城\Steam商城原型交付_V1.5")
RUN = Path(r"D:\模型汇总\GitHub验收\验收16.0\Steam商城_V1.6_独立验收\RUN-001")
read = lambda p: p.read_text(encoding="utf-8-sig")
sha = lambda b: hashlib.sha256(b).hexdigest()

def save(name, obj):
    (DATA / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def extract(source, key):
    # Trial 16 uses JSON literal const assignments rather than window.* assignments.
    m = re.search(r"(?:const|let|var)\s+" + re.escape(key) + r"\s*=\s*", source)
    if not m:
        m = re.search(r"window\." + re.escape(key) + r"\s*=\s*", source)
    if not m:
        return None
    return json.JSONDecoder().raw_decode(source[m.end():])[0]

def doc_index(folder):
    result = {}
    patterns = [r"TC-[A-Z0-9-]+", r"CHK-[A-Z0-9-]+", r"DEC-[A-Z0-9-]+", r"AC-[A-Z0-9-]+", r"DEF-[A-Z0-9-]+", r"API-[A-Z0-9-]+"]
    for path in sorted(folder.glob("*.md")):
        text = read(path)
        lines = text.splitlines()
        result[path.name] = {
            "bytes": path.stat().st_size,
            "lines": len(lines),
            "headings": [{"line": n, "title": line} for n, line in enumerate(lines, 1) if re.match(r"^#{1,6} ", line)],
            "ids": {pattern: len(set(re.findall(pattern, text))) for pattern in patterns},
        }
    return result

def embedded_matches(folder, docs):
    rows = []
    for item in docs or []:
        path = folder / item["file"]
        norm = lambda text: text.replace("\r\n", "\n").replace("\r", "\n").rstrip()
        embedded = norm(item.get("md", ""))
        external = norm(read(path)) if path.exists() else ""
        rows.append({"file": item["file"], "exists": path.exists(), "match": embedded == external,
                     "embedded_sha256": sha(embedded.encode()), "external_sha256": sha(external.encode())})
    return rows

def file_inventory(folder):
    result = []
    for path in sorted(folder.rglob("*")):
        if path.is_file():
            raw = path.read_bytes()
            result.append({"relative": path.relative_to(folder).as_posix(), "bytes": len(raw), "sha256": sha(raw)})
    return result

html_path = TRIAL / "02_低保真交互原型.html"
html_raw = html_path.read_bytes()
html = read(html_path)
model = extract(html, "MODEL") or {}
pages = model.get("pages", [])
components = extract(html, "COMP_DOCS") or {}
diagrams = extract(html, "DIAGRAMS") or []
docs = extract(html, "DOCS") or []

page_rows = []
for page in pages:
    states = page.get("states", [])
    page_rows.append({"id": page.get("id"), "end": page.get("end"), "name": page.get("name"),
                      "states": states, "state_count": len(states), "components": page.get("comps", [])})
save("trial16-pages.json", page_rows)
save("trial16-components-index.json", [{"id": key, "name": value.get("name"), "def": value.get("def"),
     "sections": len(value.get("sections", [])) if isinstance(value.get("sections"), list) else len(value.get("sections", {}))}
     for key, value in components.items()])

diagram_rows = []
for item in diagrams:
    svg = item.get("svg", "")
    texts = re.findall(r"<text\b[^>]*>([\s\S]*?)</text>", svg)
    diagram_rows.append({"id": item.get("id"), "title": item.get("title"), "type": item.get("type"),
                         "source_chars": len(item.get("src", item.get("puml", ""))), "svg_chars": len(svg),
                         "w": item.get("w"), "h": item.get("h"),
                         "empty_svg_text_elements": sum(not re.sub(r"<[^>]+>", "", value).strip() for value in texts),
                         "lint": item.get("lint"), "svgLint": item.get("svgLint")})
save("trial16-diagrams-index.json", diagram_rows)
save("trial16-doc-index.json", doc_index(TRIAL))
save("trial16-embedded-doc-check.json", embedded_matches(TRIAL, docs))
save("trial16-files.json", file_inventory(TRIAL))

checks_dir = TRIAL / "_checks"
check_summary = {}
for name in ["required_check_set.json", "required_check_result.json", "verification_summary.json", "acceptance_fixes_result.json", "build_report.json", "layout_result.json", "docs_sync_result.json", "docs_integrity_result.json", "final_manifest.json"]:
    path = checks_dir / name
    if path.exists():
        check_summary[name] = json.loads(read(path))
save("trial16-checks-summary.json", check_summary)

final_summary = json.loads(read(ROOT.parent / "2026-10-28-steam-trial14" / "_data" / "summary.json"))
final_hash = sha((FINAL / "02_低保真交互原型.html").read_bytes())
save("final-reuse-check.json", {"actual_html_sha256": final_hash,
     "prior_html_sha256": final_summary["final"]["html_sha256"],
     "matches_prior": final_hash == final_summary["final"]["html_sha256"],
     "reuse_counts": final_summary["final"]})

acceptance_report = json.loads(read(RUN / "验收问题清单.json"))
def_rows = []
for value in acceptance_report.get("issues", []):
    def_rows.append({"id": value.get("def_id"), "severity": value.get("severity"), "title": value.get("title"),
                     "status_at_first_acceptance": value.get("status"), "blocking": value.get("blocking"),
                     "rule_refs": value.get("related_ids"), "evidence_refs": value.get("evidence")})
save("trial16-first-acceptance-def-index.json", def_rows)

build = check_summary.get("build_report.json", {})
counts = build.get("counts", {})
required = check_summary.get("required_check_set.json", {}).get("summary", {})
verification = check_summary.get("verification_summary.json", {})
summary = {
    "trial": {"folder": str(TRIAL), "html_sha256": sha(html_raw), "bytes": len(html_raw),
              "project": model.get("project"), "pages": len(pages),
              "states": sum(len(p.get("states", [])) for p in pages),
              "instances": sum(len(p.get("comps", [])) for p in pages), "component_definitions": len(components),
              "diagrams": len(diagrams), "embedded_docs": len(docs),
              "ends": dict(collections.Counter(p.get("end") for p in pages)),
              "counts_from_build": counts, "embedded_docs_match": sum(r["match"] for r in embedded_matches(TRIAL, docs)),
              "embedded_docs_total": len(docs)},
    "final": {"folder": str(FINAL), "html_sha256": final_hash,
              "matches_saved_baseline": final_hash == final_summary["final"]["html_sha256"],
              "saved_counts": final_summary["final"]},
    "first_acceptance": {"run": acceptance_report.get("run_id"), "verdict": acceptance_report.get("verdict"),
                         "development_readiness": acceptance_report.get("development_readiness"),
                         "counts": acceptance_report.get("counts"), "def_count": len(def_rows),
                         "run_html_sha256": acceptance_report.get("artifact", {}).get("sha256"),
                         "repair_html_sha256": sha(html_raw)},
    "required_check_set": {"plan_total": required.get("planned_total"), "required_total": required.get("required_total"),
                            "required_pass": required.get("required_pass"), "gate_ready": required.get("gate_ready"),
                            "protocol_valid": check_summary.get("required_check_result.json", {}).get("protocol_valid")},
    "verification": verification,
}
save("summary.json", summary)
print(json.dumps(summary, ensure_ascii=False, indent=2))
