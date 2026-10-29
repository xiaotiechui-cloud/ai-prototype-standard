"""Optional lint of a navigation projection exported from the single 01 model.

An equivalence key represents target + effective parameters + guards + results.
The tool cannot determine whether those declarations or an exception are true.
"""
import argparse
import json
from pathlib import Path


def assess(data):
    errors = []
    if type(data) is not dict or type(data.get('entries')) is not list:
        return {'valid': False, 'errors': ['entries must be a list']}
    groups, ids = {}, set()
    for index, entry in enumerate(data['entries']):
        prefix = f'entries[{index}]'
        if type(entry) is not dict:
            errors.append(prefix + ' must be an object')
            continue
        fields = ('id', 'end', 'view', 'state', 'role', 'target', 'level', 'placement',
                  'source', 'task', 'equivalence_key')
        if any(type(entry.get(f)) is not str or not entry[f].strip() for f in fields):
            errors.append(prefix + ' requires nonempty ' + '/'.join(fields))
            continue
        if entry['id'] in ids:
            errors.append('duplicate navigation id: ' + entry['id'])
        ids.add(entry['id'])
        if type(entry.get('primary')) is not bool:
            errors.append(prefix + '.primary must be boolean')
        if entry['level'] not in ('primary', 'secondary', 'context'):
            errors.append(prefix + '.level must be primary/secondary/context')
        if entry['level'] != 'primary' and (type(entry.get('return_strategy')) is not str
                                              or not entry['return_strategy'].strip()):
            errors.append(prefix + ' requires source/return strategy')
        group = tuple(entry[f] for f in ('end', 'view', 'state', 'role', 'equivalence_key'))
        groups.setdefault(group, []).append(entry)
    for group, entries in groups.items():
        if sum(e.get('primary') is True for e in entries) != 1:
            errors.append('equivalent destination requires one primary entry: ' + '/'.join(group))
        if len(entries) > 1:
            for entry in entries:
                if entry.get('primary') is True:
                    continue
                for field in ('exception_reason', 'decision_source', 'verification'):
                    if type(entry.get(field)) is not str or not entry[field].strip():
                        errors.append(entry['id'] + ': repeated entry requires ' + field)
    return {'valid': not errors, 'errors': errors, 'entries': len(data['entries']),
            'equivalent_groups': len(groups), 'scope': 'declared-navigation-model-only'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('model', type=Path)
    args = parser.parse_args()
    result = assess(json.loads(args.model.read_text(encoding='utf-8-sig')))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result['valid'] else 1)
