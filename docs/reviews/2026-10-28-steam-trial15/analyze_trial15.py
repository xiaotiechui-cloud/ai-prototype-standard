"""Build compact, source-local inventories for the Steam trial 15 review."""
from pathlib import Path
import collections
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "_data"
DATA.mkdir(exist_ok=True)
TRIAL = Path(r"D:\模型汇总\GitHub维护测试\试跑15.0\Steam商城原型交付_V1.0")
FINAL = Path(r"D:\模型汇总\CDK商城\Steam商城原型交付_V1.5")
RUN = Path(r"D:\模型汇总\GitHub验收\验收15.0\RUN-20261028-01")
PRD = Path(r"C:\Users\xiaot\AppData\Roaming\CherryStudio\Data\Files\01a1806d-0d26-742b-b27e-aa985f14a067.md")
sha = lambda b: hashlib.sha256(b).hexdigest()
read = lambda p: p.read_text(encoding="utf-8-sig")

def save(name, obj):
    (DATA / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def extract(source, key):
    match = re.search(r"window\." + re.escape(key) + r"\s*=\s*", source)
    if not match:
        return None
    return json.JSONDecoder().raw_decode(source[match.end():])[0]

def doc_index(folder):
    result = {}
    patterns = [r"TC-[A-Z0-9-]+", r"CHK-\d+", r"DEC-\d+", r"AC-\d+", r"DEF-\d+"]
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
        embedded = norm(item["md"])
        external = norm(read(path))
        rows.append({"file": item["file"], "match": embedded == external,
                     "embedded_sha256": sha(embedded.encode()), "external_sha256": sha(external.encode())})
    return rows

def file_inventory(folder):
    result = []
    for path in sorted(folder.rglob("*")):
        if path.is_file():
            raw = path.read_bytes()
            result.append({"relative": path.relative_to(folder).as_posix(), "bytes": len(raw), "sha256": sha(raw)})
    return result

manifest = json.loads(read(TRIAL / "BUILD-MANIFEST.json"))
checks = []
for name, expected in manifest["files"].items():
    path = TRIAL / name
    actual = path.read_bytes() if path.exists() else b""
    checks.append({"file": name, "exists": path.exists(), "bytes_ok": len(actual) == expected["bytes"],
                   "sha256_ok": sha(actual) == expected["sha256"]})
save("trial15-manifest-check.json", checks)

html_path = TRIAL / "02_低保真交互原型.html"
html_raw = html_path.read_bytes()
html = read(html_path)
pages = extract(html, "PAGES_DATA") or []
components = extract(html, "COMP_DOCS") or {}
diagrams = extract(html, "DIAGRAMS") or []
docs = extract(html, "DOCS") or []
meta = {"counts": extract(html, "COUNTS"), "profile": extract(html, "PROFILE"),
        "profile_hash": extract(html, "PROFILE_HASH"), "gate_version": extract(html, "GATEVER")}

page_rows = []
for page in pages:
    states = page.get("states", [])
    page_rows.append({"id": page.get("id"), "end": page.get("end"), "name": page.get("name"),
                      "states": states,
                      "state_count": len(states),
                      "components": page.get("comps", [])})
save("trial15-pages.json", page_rows)
save("trial15-components-index.json", [{"id": key, "name": value.get("name"), "def": value.get("def"),
     "sections": len(value.get("sections", [])) if isinstance(value.get("sections"), list) else len(value.get("sections", {}))}
     for key, value in components.items()])

diagram_rows = []
for item in diagrams:
    svg = item.get("svg", "")
    texts = re.findall(r"<text\b[^>]*>([\s\S]*?)</text>", svg)
    diagram_rows.append({"id": item.get("id"), "title": item.get("title"), "source_chars": len(item.get("puml", "")),
                         "svg_chars": len(svg), "empty_svg_text_elements": sum(not re.sub(r"<[^>]+>", "", value).strip() for value in texts)})
save("trial15-diagrams-index.json", diagram_rows)

trial_doc_idx = doc_index(TRIAL)
save("trial15-doc-index.json", trial_doc_idx)
embedded = embedded_matches(TRIAL, docs)
save("trial15-embedded-doc-check.json", embedded)
save("trial15-files.json", file_inventory(TRIAL))

final_html = FINAL / "02_低保真交互原型.html"
final_hash = sha(final_html.read_bytes())
prior_check = json.loads(read(ROOT.parent / "2026-10-28-steam-trial14" / "_data" / "final-integrity-check.json"))
prior_summary = json.loads(read(ROOT.parent / "2026-10-28-steam-trial14" / "_data" / "summary.json"))
expected_final_hash = prior_summary["final"]["html_sha256"]
save("final-reuse-check.json", {"actual_html_sha256": final_hash, "prior_html_sha256": expected_final_hash,
     "matches_prior": final_hash == expected_final_hash, "prior_files_integrity": prior_check["final-files.json"],
     "reuse_counts": prior_summary["final"]})

acceptance_report = json.loads(read(RUN / "验收问题清单.json"))
acceptance = acceptance_report.get("issues", acceptance_report.get("findings", acceptance_report))
def_rows = []
iterable = acceptance.items() if isinstance(acceptance, dict) else enumerate(acceptance)
for key, value in iterable:
    if not isinstance(value, dict):
        continue
    def_id = value.get("def_id", value.get("id", key))
    def_rows.append({"id": def_id, "severity": value.get("severity") or value.get("priority"),
                     "title": value.get("title") or value.get("name"),
                     "status_at_first_acceptance": value.get("status"),
                     "rule_refs": value.get("rule_refs") or value.get("standard_refs") or value.get("rule_reference"),
                     "evidence_refs": value.get("evidence_refs") or value.get("evidence")})
save("trial15-first-acceptance-def-index.json", def_rows)
prd_ref = next((item for item in acceptance_report.get("source_refs", []) if item.get("id") == "PRD"), {})
prd_actual_hash = sha(PRD.read_bytes()) if PRD.exists() else None

summary = {
    "trial": {"folder": str(TRIAL), "html_sha256": sha(html_raw), "bytes": len(html_raw), "meta": meta,
              "pages": len(pages), "states": sum(len(p.get("states", [])) for p in pages),
              "instances": (meta.get("counts") or {}).get("instances"), "component_definitions": len(components),
              "diagrams": len(diagrams), "embedded_docs": len(docs),
              "ends": dict(collections.Counter(p.get("end") for p in pages)),
              "manifest_files_passed": sum(r["exists"] and r["bytes_ok"] and r["sha256_ok"] for r in checks),
              "manifest_files_total": len(checks), "embedded_docs_match": sum(r["match"] for r in embedded),
              "embedded_docs_total": len(embedded)},
    "final": {"folder": str(FINAL), "html_sha256": final_hash, "matches_saved_baseline": final_hash == expected_final_hash,
              "saved_counts": prior_summary["final"]},
    "first_acceptance": {"run": "RUN-20261028-01", "def_count": len(def_rows),
                         "run_html_sha256": "633d73c45721d6bb563652648c74626935a6afae8e075d9af07a2b61a77a8fa3",
                         "repair_html_sha256": sha(html_raw)},
    "prd": {"path": prd_ref.get("path"), "exists": PRD.exists(), "expected_sha256": prd_ref.get("sha256"),
            "actual_sha256": prd_actual_hash, "hash_matches": prd_actual_hash == prd_ref.get("sha256")},
}
save("summary.json", summary)
print(json.dumps(summary, ensure_ascii=False, indent=2))
