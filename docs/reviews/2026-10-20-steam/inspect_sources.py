"""Read-only source comparison; does not execute the supplied HTML or JavaScript.

Run: python -X utf8 inspect_sources.py
Requires Python 3.10+; optional Node.js is used ONLY with --check.
The JSON output records static observations, not browser test results.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile


DEFAULTS = {
    "trial": r"D:\模型汇总\电子宠物\Steam商城原型交付_V1.4\02_低保真交互原型-试跑版本.html",
    "final": r"D:\模型汇总\CDK商城\Steam商城原型交付_V1.0\02_低保真交互原型-最终版本.html",
}


def assigned_json(source: str, key: str):
    match = re.search(r"window\." + re.escape(key) + r"\s*=\s*", source)
    if match is None:
        return None
    return json.JSONDecoder().raw_decode(source[match.end():])[0]


def scripts_of(source: str):
    return list(re.finditer(r"<script\b[^>]*>(.*?)</script>", source, re.S | re.I))


def section_text(section):
    return section if isinstance(section, str) else section.get("md", "")


def locate(source: str, needle: str):
    pos = source.find(needle)
    if pos < 0:
        return None
    line = source.count("\n", 0, pos) + 1
    return {"line": line, "excerpt": source.splitlines()[line - 1][:600]}


def inspect(path: Path):
    data = path.read_bytes()
    source = data.decode("utf-8-sig")
    scripts = scripts_of(source)
    defs = assigned_json(source, "COMP_DOCS")
    diagrams = assigned_json(source, "DIAGRAMS")
    docs = assigned_json(source, "DOCS")
    registry = assigned_json(source, "__DATA__")
    if registry:
        pages = [{"id": p["id"], "end": p["end"], "states": p["states"]} for p in registry["pages"]]
        instances = len(registry["components"])
    else:
        page_code = source.split("const PAGES = [", 1)[1].split("const ENDS =", 1)[0]
        pages = []
        for match in re.finditer(r"\{ id: '([^']+)', end: '([^']+)'(.*?)(?=\n  \{ id:|\n\];)", page_code, re.S):
            pages.append({"id": match[1], "end": match[2], "states": re.findall(r"\['([A-Z_]+)', '([^']*)'\]", match[3])})
        # Counts definitions with a page-specific ID or backend common ID; not live DOM occurrences.
        instances = None

    node = shutil.which("node")
    syntax = []
    with tempfile.TemporaryDirectory(prefix="steam-static-syntax-") as temp:
        for index, match in enumerate(scripts):
            record = {"index": index, "html_line": source.count("\n", 0, match.start()) + 1}
            if node:
                js = Path(temp) / f"script-{index}.js"
                js.write_text(match[1], encoding="utf-8")
                result = subprocess.run([node, "--check", str(js)], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=30)
                record.update(exit_code=result.returncode, diagnostic=result.stderr[:1200])
            else:
                record["status"] = "not_run_node_unavailable"
            syntax.append(record)

    fences = [(d["file"], m[1].strip()) for d in docs for m in re.finditer(r"```plantuml\s*\n(.*?)```", d["md"], re.S)]
    diagram_sources = {d["src"].strip() for d in diagrams}
    repeats = []
    for index in range(10):
        counter = Counter(section_text(d["sections"][index]) for d in defs.values())
        text, count = counter.most_common(1)[0]
        repeats.append({"section": index + 1, "max_exact_repetitions": count, "example": text[:240]})

    anchors = {}
    for key, needle in {
        "shell": ".shell{", "shell_spaced": ".shell {", "phone": ".phone{",
        "phone_spaced": ".phone {", "phone_body": ".phone-body{", "app_body": ".appbody {",
        "review_scroller": ".component-inspector-body {", "fixed_table_font": ".docsec table {",
        "review_render": "function render() {", "component_switch": 'const comp = $("#rv-comp")',
        "confirm_missing_handler": "handleAction(c.act", "actual_handler": "function handleAct(",
        "diagram_render": "function renderDiagram() {", "diagram_zoom": "function applyDgmZoom()",
        "outline_outside": ".outlined {", "outline_inside": "body.outline-on [data-component].rv-sel{",
        "reader_three_columns": ".reader-body-wrap {", "reader_toc_top": ".reader-toc{",
        "modal_scroll_lock": "function admSyncScrollLock()", "review_notes": "function collectReviewNotes(",
        "picker_registry": "const list = compsOfPage(RV.pageId)", "picker_dom": "function renderPicker(p)",
        "drawer_missing_fallback": 'cfg.rows().find((x) => x.id === r.drawerId) || cfg.rows()[0]',
        "drawer_exact_record": "function admDrawer(cfg, rt, rows)",
        "business_toast": "function admToast(", "global_toast": "function showToast(",
        "markdown_breaks": "breaks: false", "phone_overlay": ".app-mask {",
        "sort_touch": ".sortbar button {", "gradient_art": ".art-star {",
        "mobile_ad": 'const adBlock = C("APP-HOME-01-C01"',
        "ad_click": "function adBanner(", "media_preview": "function admGoodsMediaPreview(",
        "esc_handler": "if (e.key !== 'Escape') return;",
        "reader_close": "function closeReader()", "final_pages": "const PAGES = [",
        "component_docs": "window.COMP_DOCS", "diagrams": "window.DIAGRAMS", "docs": "window.DOCS",
    }.items():
        hit = locate(source, needle)
        if hit:
            anchors[key] = hit

    # Exclude JSON registries so prose mentioning a function is not mistaken for a definition.
    code = "\n".join(m[1] for m in scripts if not re.match(r"\s*window\.(?:__DATA__|COMP_DOCS|DIAGRAMS|DOCS)\s*=", m[1]))
    return {
        "path": str(path), "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data),
        "lines": len(source.splitlines()), "title": re.search(r"<title>(.*?)</title>", source, re.S)[1],
        "declared_meta": registry.get("meta") if registry else None,
        "registered_pages": len(pages), "pages_by_end": dict(Counter(p["end"] for p in pages)),
        "registered_page_states": sum(len(p["states"]) for p in pages), "pages": pages,
        "registered_component_instances": instances,
        "component_definitions": len(defs), "definitions_with_ten_sections": sum(len(d.get("sections", [])) == 10 for d in defs.values()),
        "section_repetition": repeats,
        "embedded_documents": [{"file": d["file"], "chars": len(d["md"]), "sha256_utf8": hashlib.sha256(d["md"].encode("utf-8")).hexdigest()} for d in docs],
        "diagrams_count": len(diagrams), "diagrams_by_type": dict(Counter(d["id"].split("-")[0] for d in diagrams)),
        "diagram_entries": [{"id": d["id"], "width": d.get("w"), "height": d.get("h"), "source_sha256": hashlib.sha256(d["src"].encode("utf-8")).hexdigest()} for d in diagrams],
        "plantuml_fences": len(fences), "unmatched_fences": [f for f, src in fences if src not in diagram_sources],
        "syntax_checks": syntax, "anchors": anchors,
        "static_tokens": {
            "container_queries": sum(len(re.findall(r"@container\s+", m[1])) for m in re.finditer(r"<style\b[^>]*>(.*?)</style>", source, re.S | re.I)),
            "dgzoom_property_declarations": code.count("--dgzoom:"),
            "dgzoom_css_consumers": len(re.findall(r"var\(\s*--dgzoom", source)),
            "handleAction_calls": len(re.findall(r"\bhandleAction\(", code)),
            "handleAction_function_definitions": len(re.findall(r"\bfunction\s+handleAction\b", code)),
            "handleAction_assignments": len(re.findall(r"\bhandleAction\s*=", code)),
        },
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--trial", type=Path, default=Path(DEFAULTS["trial"]))
    parser.add_argument("--final", type=Path, default=Path(DEFAULTS["final"]))
    parser.add_argument("--output", type=Path, default=Path(__file__).with_name("evidence.json"))
    args = parser.parse_args()
    result = {
        "review_date": "2026-10-20", "method": "static_source_and_embedded_data_only",
        "browser_tests": "not_run_local_file_navigation_blocked_by_browser_security_policy",
        "limits": ["No screenshot/computed-style/click/scroll/offline browser verification", "Embedded historical CHK claims were not re-executed", "External PRD and independent MD files not supplied for this review"],
        "trial": inspect(args.trial), "final": inspect(args.final),
    }
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for tag in ("trial", "final"):
        value = result[tag]
        print(tag, {k: value[k] for k in ("registered_pages", "registered_page_states", "component_definitions", "diagrams_count")})
        print("syntax", len(value["syntax_checks"]), "passed", sum(s.get("exit_code") == 0 for s in value["syntax_checks"]))
    print("Evidence written:", args.output)


if __name__ == "__main__":
    main()
