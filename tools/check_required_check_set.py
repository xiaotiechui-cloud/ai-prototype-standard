"""Validate a required-check-set and decide whether its current evidence is gate-ready.

This is an execution gate, not a project acceptance engine. It checks that a
fixed plan is complete, the declared artifact is current, required results are
explicit and evidence files are bound to this run. It cannot prove that a
browser action really happened or that a project rule is correct.

Protocols: required-check-set-1 (legacy plan only), required-check-set-2
(also checks a separately frozen model-derived coverage inventory).
"""
import argparse
import hashlib
import json
from pathlib import Path

PROTOCOL = 'required-check-set-1'
MODEL_PROTOCOL = 'required-check-set-2'
STATUSES = ('pass', 'fail', 'unverified', 'blocked', 'not_applicable')
DISALLOWED_BASES = {'dom-only', 'toast-only', 'historical', 'self-report',
                    'static-claim', 'screenshot-only', 'render-only'}


def validate_coverage(data, root, plan_by_id, check_by_id, errors):
    """Validate declared coverage, not the truth/completeness of its source model.

    The inventory is a separately hashed pre-execution input. It must not be
    regenerated from the checks that happened to pass.
    """
    coverage = data.get('coverage')
    if type(coverage) is not dict:
        errors.append('v2 requires coverage inventory binding')
        return {}
    try:
        path = resolve(root, coverage.get('path'))
        if digest(path) != coverage.get('sha256'):
            errors.append('coverage inventory sha256 mismatch')
        inventory = json.loads(path.read_text(encoding='utf-8-sig'))
    except (ValueError, OSError) as exc:
        errors.append(f'coverage inventory: {exc}')
        return {}
    if type(inventory) is not dict:
        errors.append('coverage inventory must be an object')
        return {}
    for field in ('plan_version', 'derivation_method', 'scope_review'):
        if type(inventory.get(field)) is not str or not inventory[field].strip():
            errors.append(f'coverage.{field} is required')
    sources = inventory.get('sources')
    if type(sources) is not list or not sources:
        errors.append('coverage.sources must bind current model/document bytes')
        sources = []
    source_ids = set()
    for source in sources:
        if (type(source) is not dict or type(source.get('id')) is not str
                or not source['id'].strip()):
            errors.append('coverage source requires id/path/sha256')
            continue
        if source['id'] in source_ids:
            errors.append('duplicate coverage source: ' + source['id'])
        source_ids.add(source['id'])
        try:
            if digest(resolve(root, source.get('path'))) != source.get('sha256'):
                errors.append('coverage source sha256 mismatch: ' + source['id'])
        except (ValueError, OSError) as exc:
            errors.append(f'coverage source: {exc}')
    duties = inventory.get('obligations')
    if type(duties) is not list or not duties:
        errors.append('coverage.obligations must be nonempty')
        duties = []
    known = {}
    browser_kinds = {'p0-journey', 'risk-positive', 'risk-negative', 'navigation', 'layout'}
    kinds = browser_kinds | {'diagram', 'references'}
    for duty in duties:
        if type(duty) is not dict or type(duty.get('id')) is not str or not duty['id'].strip():
            errors.append('coverage obligation requires nonempty id')
            continue
        duty_id = duty['id']
        if duty_id in known:
            errors.append('duplicate obligation: ' + duty_id)
        known[duty_id] = duty
        for field in ('end', 'source_locator', 'expected'):
            if type(duty.get(field)) is not str or not duty[field].strip():
                errors.append(f'obligation[{duty_id}].{field} is required')
        if type(duty.get('source_id')) is not str or duty['source_id'] not in source_ids:
            errors.append(f'obligation[{duty_id}] has unknown source')
        if type(duty.get('kind')) is not str or duty['kind'] not in kinds:
            errors.append(f'obligation[{duty_id}] has unknown kind')
        if type(duty.get('kind')) is str and duty['kind'] in browser_kinds:
            for field in ('entry', 'unchanged'):
                if type(duty.get(field)) is not str or not duty[field].strip():
                    errors.append(f'obligation[{duty_id}].{field} is required')

    ends = inventory.get('ends')
    if type(ends) is not list or not ends or any(type(v) is not str or not v.strip() for v in ends):
        errors.append('coverage.ends must list applicable project ends')
        ends = []
    if len(set(ends)) != len(ends):
        errors.append('duplicate coverage end')
    for end in ends:
        if not any(d.get('kind') == 'p0-journey' and d.get('end') == end for d in known.values()):
            errors.append('missing P0 journey for end: ' + end)
    for duty_id, duty in known.items():
        if duty.get('end') not in ends:
            errors.append(f'obligation[{duty_id}] end outside declared scope')

    links = {duty_id: [] for duty_id in known}
    for check_id, item in plan_by_id.items():
        if item.get('origin') not in ('fixed', 'derived'):
            errors.append(f'plan[{check_id}].origin must be fixed or derived')
        covers = item.get('covers')
        if type(covers) is not list or any(type(v) is not str for v in covers):
            errors.append(f'plan[{check_id}].covers must be a string list')
            continue
        if item.get('origin') == 'derived' and not covers:
            errors.append(f'plan[{check_id}] derived item requires obligations')
        for duty_id in covers:
            if duty_id not in known:
                errors.append(f'plan[{check_id}] unknown obligation: {duty_id}')
                continue
            links[duty_id].append(check_id)
            if item.get('required') is not True or item.get('evidence_required') is not True:
                errors.append(f'obligation[{duty_id}] must map to required evidenced checks')
            kind = known[duty_id].get('kind')
            if type(kind) is str and kind in browser_kinds and item.get('minimum_basis') != ['browser']:
                errors.append(f'obligation[{duty_id}] requires real browser basis')
    for duty_id, linked in links.items():
        if not linked:
            errors.append('uncovered obligation: ' + duty_id)

    run_id = data.get('run_id')
    if type(run_id) is not str or not run_id.strip():
        errors.append('v2 requires run_id')
    for check_id, result in check_by_id.items():
        if result.get('run_id') != run_id:
            errors.append(f'checks[{check_id}] run_id mismatch')
        if result.get('basis') == 'browser' and result.get('executed') is True:
            environment = result.get('environment', {})
            if type(environment) is not dict:
                environment = {}
            viewport = environment.get('viewport')
            zoom = environment.get('zoom')
            if (type(viewport) is not list or len(viewport) != 2 or
                    any(type(v) is not int or v <= 0 for v in viewport) or
                    type(zoom) not in (int, float) or not 0 < zoom < 1000 or
                    not isinstance(environment.get('browser'), str) or not environment['browser'].strip()):
                errors.append(f'checks[{check_id}] requires browser/viewport/zoom environment')

    def passed(check_id):
        row = check_by_id.get(check_id, {})
        return row.get('status') == 'pass' and row.get('executed') is True

    fixed = [cid for cid, item in plan_by_id.items()
             if item.get('origin') == 'fixed' and item.get('required') is True]
    if not fixed:
        errors.append('v2 must retain fixed minimum checks')
    return {
        'fixed_required_total': len(fixed),
        'fixed_required_pass': sum(passed(cid) for cid in fixed),
        'derived_total': len(known),
        'derived_covered': sum(bool(ids) for ids in links.values()),
        'derived_pass': sum(bool(ids) and all(passed(cid) for cid in ids) for ids in links.values()),
    }


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
    if data.get('protocol') not in (PROTOCOL, MODEL_PROTOCOL):
        errors.append(f'protocol must be {PROTOCOL} or {MODEL_PROTOCOL}')

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
    coverage_counts = {}
    if data.get('protocol') == MODEL_PROTOCOL:
        coverage_counts = validate_coverage(data, root, plan_by_id, check_by_id, errors)
    gate_ready = not errors and artifact_ok and required_pass == len(required_ids)
    counts = _count(statuses)
    derived = {
        **counts,
        'planned_total': len(plan_by_id),
        'required_total': len(required_ids),
        'required_pass': required_pass,
        **coverage_counts,
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
        'coverage_scope': ('declared-model-inventory' if isinstance(data, dict) and data.get('protocol') == MODEL_PROTOCOL
                           else 'legacy-plan-only'),
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
