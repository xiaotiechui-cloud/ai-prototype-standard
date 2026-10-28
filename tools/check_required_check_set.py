"""Validate a required-check-set and decide whether its current evidence is gate-ready.

This is an execution gate, not a project acceptance engine. It checks that a
fixed plan is complete, the declared artifact is current, required results are
explicit and evidence files are bound to this run. It cannot prove that a
browser action really happened or that a project rule is correct.

Protocol: required-check-set-1
"""
import argparse
import hashlib
import json
from pathlib import Path

PROTOCOL = 'required-check-set-1'
STATUSES = ('pass', 'fail', 'unverified', 'blocked', 'not_applicable')
DISALLOWED_BASES = {'dom-only', 'toast-only', 'historical', 'self-report',
                    'static-claim', 'screenshot-only'}


def resolve(root, relative):
    if type(relative) is not str or not relative.strip():
        raise ValueError('path must be a nonempty relative path')
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f'path escapes declared root: {relative}')
    if not path.is_file():
        raise ValueError(f'path does not exist: {relative}')
    return path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _count(statuses):
    return {status: statuses.count(status) for status in STATUSES}


def validate(data, root):
    """Return ``(errors, derived)``; derived is absent when the protocol is invalid."""
    errors = []
    if type(data) is not dict:
        return ['root must be an object'], None
    if data.get('protocol') != PROTOCOL:
        errors.append(f'protocol must be {PROTOCOL}')

    artifact = data.get('artifact')
    artifact_ok = False
    if type(artifact) is not dict:
        errors.append('artifact must be an object')
    else:
        path = artifact.get('path')
        expected = artifact.get('sha256')
        if type(expected) is not str or len(expected) != 64:
            errors.append('artifact.sha256 must be a 64-character sha256 string')
        try:
            actual = digest(resolve(root, path))
            artifact_ok = actual == expected
            if not artifact_ok:
                errors.append('artifact sha256 does not match current bytes')
        except (ValueError, OSError) as exc:
            errors.append(f'artifact: {exc}')

    plan = data.get('plan')
    if type(plan) is not list or not plan:
        errors.append('plan must be a nonempty list')
        plan = []
    plan_by_id = {}
    for index, item in enumerate(plan):
        if type(item) is not dict:
            errors.append(f'plan[{index}] must be an object')
            continue
        check_id = item.get('id')
        if type(check_id) is not str or not check_id.strip():
            errors.append(f'plan[{index}].id must be a nonempty string')
            continue
        if check_id in plan_by_id:
            errors.append(f'duplicate planned ID: {check_id}')
            continue
        plan_by_id[check_id] = item
        if type(item.get('required')) is not bool:
            errors.append(f'plan[{check_id}].required must be boolean')
        if type(item.get('evidence_required')) is not bool:
            errors.append(f'plan[{check_id}].evidence_required must be boolean')
        if type(item.get('category')) is not str or not item['category'].strip():
            errors.append(f'plan[{check_id}].category is required')
        if type(item.get('source')) is not str or not item['source'].strip():
            errors.append(f'plan[{check_id}].source is required')
        bases = item.get('minimum_basis')
        if type(bases) is not list or not bases or any(type(value) is not str for value in bases):
            errors.append(f'plan[{check_id}].minimum_basis must be a nonempty string list')

    checks = data.get('checks')
    if type(checks) is not list:
        errors.append('checks must be a list')
        checks = []
    check_by_id = {}
    statuses = []
    for index, result in enumerate(checks):
        if type(result) is not dict:
            errors.append(f'checks[{index}] must be an object')
            continue
        check_id = result.get('id')
        if type(check_id) is not str or not check_id.strip():
            errors.append(f'checks[{index}].id must be a nonempty string')
            continue
        if check_id in check_by_id:
            errors.append(f'duplicate result ID: {check_id}')
            continue
        check_by_id[check_id] = result
        if check_id not in plan_by_id:
            errors.append(f'unplanned result ID: {check_id}')
        status = result.get('status')
        if type(status) is not str or status not in STATUSES:
            errors.append(f'checks[{check_id}].status must be an explicit enum')
        else:
            statuses.append(status)
        if type(result.get('executed')) is not bool:
            errors.append(f'checks[{check_id}].executed must be boolean')
        if type(result.get('method')) is not str or not result['method'].strip():
            errors.append(f'checks[{check_id}].method is required')
        if type(result.get('actual')) is not str or not result['actual'].strip():
            errors.append(f'checks[{check_id}].actual is required')
        basis = result.get('basis')
        if type(basis) is not str or not basis.strip():
            errors.append(f'checks[{check_id}].basis is required')
        elif basis in DISALLOWED_BASES:
            errors.append(f'checks[{check_id}].basis cannot be {basis}')
        if check_id in plan_by_id and isinstance(plan_by_id[check_id].get('minimum_basis'), list):
            allowed = plan_by_id[check_id]['minimum_basis']
            if type(basis) is str and basis not in allowed:
                errors.append(f'checks[{check_id}].basis is below the planned minimum')

        item = plan_by_id.get(check_id, {})
        evidence = result.get('evidence')
        if type(evidence) is not list:
            errors.append(f'checks[{check_id}].evidence must be a list')
            evidence = []
        if status != 'not_applicable' and item.get('evidence_required') is True and not evidence:
            errors.append(f'checks[{check_id}] requires current evidence')
        for evidence_index, entry in enumerate(evidence):
            if type(entry) is not dict:
                errors.append(f'checks[{check_id}].evidence[{evidence_index}] must be an object')
                continue
            path = entry.get('path')
            expected = entry.get('sha256')
            if type(expected) is not str or len(expected) != 64:
                errors.append(f'checks[{check_id}].evidence[{evidence_index}].sha256 is invalid')
                continue
            try:
                actual = digest(resolve(root, path))
                if actual != expected:
                    errors.append(f'checks[{check_id}] evidence hash does not match current bytes')
            except (ValueError, OSError) as exc:
                errors.append(f'checks[{check_id}] evidence: {exc}')

        if status == 'not_applicable':
            if item.get('required') is True:
                errors.append(f'checks[{check_id}] required item cannot be not_applicable')
            if type(result.get('na_reason')) is not str or not result['na_reason'].strip():
                errors.append(f'checks[{check_id}] not_applicable requires na_reason')

    planned_ids = set(plan_by_id)
    result_ids = set(check_by_id)
    if planned_ids != result_ids:
        missing = sorted(planned_ids - result_ids)
        extra = sorted(result_ids - planned_ids)
        if missing:
            errors.append('missing result IDs: ' + ', '.join(missing))
        if extra:
            errors.append('extra result IDs: ' + ', '.join(extra))

    required_ids = [check_id for check_id, item in plan_by_id.items() if item.get('required') is True]
    required_pass = 0
    for check_id in required_ids:
        result = check_by_id.get(check_id)
        if result and result.get('status') == 'pass' and result.get('executed') is True:
            required_pass += 1
    gate_ready = not errors and artifact_ok and required_pass == len(required_ids)
    counts = _count(statuses)
    derived = {
        **counts,
        'planned_total': len(plan_by_id),
        'required_total': len(required_ids),
        'required_pass': required_pass,
        'gate_ready': gate_ready,
    }
    summary = data.get('summary')
    if type(summary) is not dict or summary != derived:
        errors.append('summary must exactly match detail-derived counts and gate_ready')
        gate_ready = False
        derived['gate_ready'] = False
    return errors, derived


def assess(data, root):
    errors, derived = validate(data, root)
    return {
        'protocol_valid': not errors,
        'gate_ready': bool(derived and not errors and derived['gate_ready']),
        'errors': errors,
        'summary': derived,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('--root', type=Path, required=True)
    args = parser.parse_args()
    data = json.loads(args.manifest.read_text(encoding='utf-8-sig'))
    result = assess(data, args.root.resolve())
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if not result['protocol_valid']:
        raise SystemExit(2)
    if not result['gate_ready']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
