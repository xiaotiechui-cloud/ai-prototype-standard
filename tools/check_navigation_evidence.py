"""Validate browser evidence that a declared navigation entry was really exercised.

This checks the evidence protocol and file hashes. It cannot decide whether the
declared target or equivalence group is semantically correct; that remains a
01/09 review and 08 acceptance responsibility.
"""
import argparse
import hashlib
import json
from pathlib import Path


def resolve(root, relative):
    if type(relative) is not str or not relative.strip():
        raise ValueError("path must be a nonempty relative path")
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f"path escapes declared root: {relative}")
    if not path.is_file():
        raise ValueError(f"path does not exist: {relative}")
    return path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate(data, root):
    errors = []
    if type(data) is not dict or data.get("protocol") != "navigation-evidence-1":
        return ["protocol must be navigation-evidence-1"]
    for key in ("artifact", "navigation_model", "run"):
        if type(data.get(key)) is not dict:
            errors.append(f"{key} must be an object")
    for key in ("artifact", "navigation_model"):
        item = data.get(key)
        if type(item) is not dict:
            continue
        try:
            path = resolve(root, item.get("path"))
            if item.get("sha256") != digest(path):
                errors.append(f"{key} sha256 does not match original bytes")
        except (ValueError, OSError) as exc:
            errors.append(f"{key}: {exc}")
    run = data.get("run")
    if type(run) is dict:
        for key in ("run_id", "browser", "viewport", "zoom"):
            if run.get(key) in (None, "", []):
                errors.append(f"run.{key} is required")
        if type(run.get("viewport")) is not list or len(run.get("viewport", [])) != 2:
            errors.append("run.viewport must be [width,height]")
    checks = data.get("checks")
    if type(checks) is not list or not checks:
        errors.append("checks must be a nonempty list")
        checks = []
    ids = set()
    for index, row in enumerate(checks):
        prefix = f"checks[{index}]"
        if type(row) is not dict:
            errors.append(prefix + " must be an object")
            continue
        for key in ("id", "navigation_id", "component_id", "selector", "action", "expected", "actual", "status", "basis", "evidence"):
            if key not in row or row[key] in (None, ""):
                errors.append(f"{prefix}.{key} is required")
        if row.get("id") in ids:
            errors.append(prefix + ": duplicate id")
        ids.add(row.get("id"))
        if row.get("status") not in ("pass", "fail", "unverified"):
            errors.append(prefix + ".status must be pass/fail/unverified")
        if row.get("basis") != "browser-action":
            errors.append(prefix + ".basis must be browser-action")
        expected = row.get("expected") if type(row.get("expected")) is dict else {}
        actual = row.get("actual") if type(row.get("actual")) is dict else {}
        for key in ("target", "result"):
            if key not in expected or key not in actual:
                errors.append(f"{prefix} expected/actual must include {key}")
            elif row.get("status") == "pass" and actual[key] != expected[key]:
                errors.append(f"{prefix} actual {key} differs from expected")
        if "returned_to" in expected and row.get("status") == "pass" and actual.get("returned_to") != expected["returned_to"]:
            errors.append(f"{prefix} actual returned_to differs from expected")
        evidence = row.get("evidence")
        if type(evidence) is not list:
            errors.append(prefix + ".evidence must be a list")
            evidence = []
        if row.get("status") == "pass" and not evidence:
            errors.append(prefix + ": pass requires evidence")
        for ei, item in enumerate(evidence):
            if type(item) is not dict or not item.get("path") or not item.get("sha256"):
                errors.append(f"{prefix}.evidence[{ei}] requires path/sha256")
                continue
            try:
                path = resolve(root, item["path"])
                if item["sha256"] != digest(path):
                    errors.append(f"{prefix}.evidence[{ei}] sha256 does not match original bytes")
                if path.suffix.lower() == ".json":
                    evidence_data = json.loads(path.read_text(encoding="utf-8-sig"))
                    if type(evidence_data) is dict:
                        for key in ("navigation_id", "component_id", "target", "result"):
                            if key in evidence_data and evidence_data[key] != row.get(key, expected.get(key)):
                                errors.append(f"{prefix}.evidence[{ei}] {key} differs from declared result")
            except (ValueError, OSError, json.JSONDecodeError) as exc:
                errors.append(f"{prefix}.evidence[{ei}]: {exc}")
    summary = data.get("summary")
    if type(summary) is not dict:
        errors.append("summary must be an object")
    else:
        if summary.get("total") != len(checks):
            errors.append("summary.total does not match checks")
        actual_pass = sum(row.get("status") == "pass" for row in checks if type(row) is dict)
        if summary.get("pass") != actual_pass:
            errors.append("summary.pass does not match checks")
        if summary.get("gate_ready") is True and (errors or actual_pass != len(checks)):
            errors.append("summary.gate_ready cannot be true unless every check is valid and pass")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--root", type=Path, required=True)
    args = parser.parse_args()
    data = json.loads(args.manifest.read_text(encoding="utf-8-sig"))
    errors = validate(data, args.root.resolve())
    result = {"valid": not errors, "errors": errors,
              "meaning": "protocol and hashes only; semantic navigation and browser truth remain review responsibilities"}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if not errors else 1)


if __name__ == "__main__":
    main()
