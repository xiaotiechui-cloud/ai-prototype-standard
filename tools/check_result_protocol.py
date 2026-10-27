"""Optional example protocol checker; not proof of execution or acceptance.

JSON: {"protocol_version": "checks-enum-1", "planned_ids": ["CHK-1"],
       "checks": [{"id": "CHK-1", "status": "pass", "detail": "evidence path"}],
       "summary": {"pass": 1, "fail": 0, "unverified": 0, "blocked": 0,
                   "not_applicable": 0}}

Statuses are explicit enums, NOT booleans. All planned IDs must have a record;
unexecuted records use unverified. The real plan must be fixed separately: this
checker cannot establish plan provenance, evidence truth, or N/A justification.
Exit 0: valid protocol, all pass/N/A (not acceptance); 1: valid but incomplete/
failed/blocked; 2: invalid protocol. Run with one JSON file argument.
"""
import argparse
from collections import Counter
import json
from pathlib import Path

STATUSES = ('pass', 'fail', 'unverified', 'blocked', 'not_applicable')


def validate(data):
    errors = []
    if type(data) is not dict:
        return ['root must be object'], None
    if data.get('protocol_version') != 'checks-enum-1':
        errors.append('unknown protocol_version')
    planned = data.get('planned_ids')
    if (type(planned) is not list or not planned or
            any(type(x) is not str or not x.strip() for x in planned)):
        errors.append('planned_ids must be a nonempty string ID list')
        planned = []
    if len(set(planned)) != len(planned):
        errors.append('duplicate planned ID')
    checks = data.get('checks')
    if type(checks) is not list:
        errors.append('checks must be array')
        checks = []
    ids, counts = [], Counter({s: 0 for s in STATUSES})
    for index, row in enumerate(checks):
        if type(row) is not dict:
            errors.append(f'checks[{index}] must be object')
            continue
        key = row.get('id')
        if type(key) is not str or not key.strip():
            errors.append(f'checks[{index}] missing/invalid id')
        else:
            ids.append(key)
        state = row.get('status')
        if type(state) is not str or state not in STATUSES:
            errors.append(f'checks[{index}] invalid status type/value')
        else:
            counts[state] += 1
        if type(row.get('detail')) is not str:
            errors.append(f'checks[{index}] detail must be string (not status)')
    if len(set(ids)) != len(ids):
        errors.append('duplicate result ID')
    if set(ids) != set(planned):
        errors.append('result IDs differ from fixed plan')
    summary = data.get('summary')
    if type(summary) is not dict or set(summary) != set(STATUSES):
        errors.append('summary must contain exactly the status counters')
    elif any(type(v) is not int or v < 0 for v in summary.values()):
        errors.append('summary counters must be nonnegative integers, not booleans')
    elif summary != dict(counts):
        errors.append('summary differs from detail-derived counts')
    # Never publish a partial valid-only summary after rejecting rows.
    return errors, None if errors else dict(counts)


def assess(data):
    errors, summary = validate(data)
    valid = not errors
    ready = valid and not any(summary[s] for s in ('fail', 'unverified', 'blocked'))
    return {'protocol_valid': valid, 'ready_for_evidence_review': ready,
            'planned_total': len(data['planned_ids']) if type(data) is dict and
            type(data.get('planned_ids')) is list else None,
            'summary': summary, 'errors': errors,
            'meaning': 'Protocol check only; execution, evidence and acceptance unproved'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('file', type=Path)
    args = parser.parse_args()
    try:
        result = assess(json.loads(args.file.read_text(encoding='utf-8-sig')))
    except (OSError, ValueError) as exc:
        print(json.dumps({'protocol_valid': False, 'errors': [str(exc)]}))
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 2 if not result['protocol_valid'] else (0 if result['ready_for_evidence_review'] else 1)


if __name__ == '__main__':
    raise SystemExit(main())
