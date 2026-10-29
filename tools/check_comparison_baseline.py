"""Validate a comparison review's input roles, versions and original-byte hashes."""
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


def validate(data, root):
    errors = []
    if type(data) is not dict or data.get("protocol") != "comparison-baseline-1":
        return ["protocol must be comparison-baseline-1"]
    if not data.get("review_id"):
        errors.append("review_id is required")
    required = data.get("required_roles")
    inputs = data.get("inputs")
    if type(required) is not list or not required:
        errors.append("required_roles must be a nonempty list")
        required = []
    if type(inputs) is not list or not inputs:
        errors.append("inputs must be a nonempty list")
        inputs = []
    ids, roles = set(), set()
    for index, item in enumerate(inputs):
        prefix = f"inputs[{index}]"
        if type(item) is not dict:
            errors.append(prefix + " must be an object")
            continue
        for key in ("id", "role", "path", "version", "sha256", "purpose", "relationship"):
            if not item.get(key):
                errors.append(f"{prefix}.{key} is required")
        if item.get("id") in ids:
            errors.append(prefix + ": duplicate id")
        ids.add(item.get("id"))
        roles.add(item.get("role"))
        try:
            path = resolve(root, item.get("path"))
            actual = hashlib.sha256(path.read_bytes()).hexdigest()
            if item.get("sha256") != actual:
                errors.append(f"{prefix}.sha256 does not match original bytes")
        except (ValueError, OSError) as exc:
            errors.append(f"{prefix}: {exc}")
    for role in required:
        if role not in roles:
            errors.append("missing required role: " + str(role))
    comparison = data.get("comparison")
    if type(comparison) is not dict:
        errors.append("comparison must be an object")
    else:
        if comparison.get("semantic_mapping_required") is not True:
            errors.append("comparison.semantic_mapping_required must be true")
        if comparison.get("counts_not_quality") is not True:
            errors.append("comparison.counts_not_quality must be true")
        if not comparison.get("mismatch_action"):
            errors.append("comparison.mismatch_action is required")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--root", type=Path, required=True)
    args = parser.parse_args()
    data = json.loads(args.manifest.read_text(encoding="utf-8-sig"))
    errors = validate(data, args.root.resolve())
    print(json.dumps({"valid": not errors, "errors": errors,
                      "meaning": "input roles and hashes only; semantic mapping remains a review task"}, ensure_ascii=False, indent=2))
    raise SystemExit(0 if not errors else 1)


if __name__ == "__main__":
    main()
