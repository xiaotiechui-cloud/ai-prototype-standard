"""Protocol counterexamples only; these fixtures do not execute a browser."""
import json
import unittest
from copy import deepcopy

from check_required_check_set import assess
import test_required_check_set as legacy


class ModelCoverageTests(unittest.TestCase):
    digest = legacy.RequiredCheckSetTests.digest
    invalid = legacy.RequiredCheckSetTests.invalid
    refresh_summary = legacy.RequiredCheckSetTests.refresh_summary
    tearDown = legacy.RequiredCheckSetTests.tearDown

    def setUp(self):
        legacy.RequiredCheckSetTests.setUp(self)
        (self.root / 'model.md').write_text('Approved model snapshot', encoding='utf-8')
        self.inventory = {
            'plan_version': 'fixture-1', 'derivation_method': 'model duties reviewed before execution',
            'scope_review': 'single end, one journey; no external service is proven',
            'ends': ['client'],
            'sources': [{'id': '01', 'path': 'model.md', 'sha256': self.digest('model.md')}],
            'obligations': [{
                'id': 'D-P0', 'kind': 'p0-journey', 'end': 'client',
                'source_id': '01', 'source_locator': 'main task', 'entry': 'visible main action',
                'expected': 'action completes and result is read back',
                'unchanged': 'object identity and permissions',
            }],
        }
        self.data.update(protocol='required-check-set-2', run_id='RUN-fixture')
        for item in self.data['plan']:
            item.update(origin='fixed', covers=[])
        self.data['plan'][1].update(origin='derived', covers=['D-P0'])
        for row in self.data['checks']:
            row['run_id'] = 'RUN-fixture'
        self.data['checks'][1]['environment'] = {
            'browser': 'fixture only, not a real browser result', 'viewport': [960, 720], 'zoom': 100,
        }
        self.freeze_inventory()
        self.sync_summary()

    def freeze_inventory(self):
        (self.root / 'coverage.json').write_text(json.dumps(self.inventory), encoding='utf-8')
        self.data['coverage'] = {'path': 'coverage.json', 'sha256': self.digest('coverage.json')}

    def sync_summary(self):
        statuses = [r['status'] for r in self.data['checks']]
        passed = {r['id'] for r in self.data['checks'] if r['status'] == 'pass' and r['executed'] is True}
        required = [p['id'] for p in self.data['plan'] if p['required']]
        fixed = [p['id'] for p in self.data['plan'] if p['required'] and p['origin'] == 'fixed']
        links = [[p['id'] for p in self.data['plan'] if d['id'] in p['covers']]
                 for d in self.inventory['obligations']]
        self.data['summary'] = {
            **{s: statuses.count(s) for s in ('pass', 'fail', 'unverified', 'blocked', 'not_applicable')},
            'planned_total': len(self.data['plan']), 'required_total': len(required),
            'required_pass': sum(cid in passed for cid in required),
            'fixed_required_total': len(fixed), 'fixed_required_pass': sum(cid in passed for cid in fixed),
            'derived_total': len(links), 'derived_covered': sum(bool(ids) for ids in links),
            'derived_pass': sum(bool(ids) and all(cid in passed for cid in ids) for ids in links),
            'gate_ready': all(cid in passed for cid in required) and all(links),
        }

    def test_v2_positive_counts_and_scope(self):
        result = assess(self.data, self.root)
        self.assertTrue(result['gate_ready'], result['errors'])
        self.assertEqual(result['coverage_scope'], 'declared-model-inventory')
        self.assertEqual(result['summary'], {
            'pass': 2, 'fail': 0, 'unverified': 0, 'blocked': 0, 'not_applicable': 0,
            'planned_total': 2, 'required_total': 2, 'required_pass': 2,
            'fixed_required_total': 1, 'fixed_required_pass': 1,
            'derived_total': 1, 'derived_covered': 1, 'derived_pass': 1, 'gate_ready': True,
        })

    def test_each_missing_model_duty_blocks_fixed_green(self):
        for kind in ('p0-journey', 'risk-positive', 'risk-negative', 'navigation',
                     'layout', 'diagram', 'references'):
            with self.subTest(kind=kind):
                duty = deepcopy(self.inventory['obligations'][0])
                duty.update(id='D-OMITTED', kind=kind)
                self.inventory['obligations'] = [self.inventory['obligations'][0], duty]
                self.freeze_inventory()
                self.sync_summary()
                result = assess(self.data, self.root)
                self.assertFalse(result['gate_ready'])
                self.assertIn('uncovered obligation: D-OMITTED', result['errors'])
                self.assertEqual(result['summary']['fixed_required_pass'], 1)

    def test_source_and_inventory_changes_block(self):
        (self.root / 'model.md').write_text('changed', encoding='utf-8')
        self.assertFalse(assess(self.data, self.root)['gate_ready'])
        self.invalid(lambda data: data['coverage'].__setitem__('sha256', '0' * 64))

    def test_v2_unverified_fail_or_blocked_duties_are_valid_but_not_ready(self):
        for status in ('unverified', 'fail', 'blocked'):
            self.data['checks'][1].update(status=status, executed=status == 'fail', actual=status)
            self.sync_summary()
            result = assess(self.data, self.root)
            self.assertTrue(result['protocol_valid'], result['errors'])
            self.assertFalse(result['gate_ready'])
            self.assertEqual(result['summary']['derived_pass'], 0)

    def test_v2_bad_types_and_missing_fields_fail_closed(self):
        for field, value in [('source_id', []), ('kind', {}), ('end', []), ('entry', ''), ('unchanged', '')]:
            original = deepcopy(self.inventory)
            self.inventory['obligations'][0][field] = value
            self.freeze_inventory()
            self.assertFalse(assess(self.data, self.root)['gate_ready'])
            self.inventory = original
        self.freeze_inventory()
        self.invalid(lambda data: data['checks'][1].__setitem__('environment', []))
        self.invalid(lambda data: data['checks'][1].__setitem__('run_id', 'old-run'))
        self.assertFalse(assess([], self.root)['gate_ready'])

    def test_v2_p0_per_end_and_duplicate_duties(self):
        self.inventory['ends'].append('admin')
        self.freeze_inventory()
        self.assertIn('missing P0 journey for end: admin', assess(self.data, self.root)['errors'])
        self.inventory['obligations'].append(deepcopy(self.inventory['obligations'][0]))
        self.freeze_inventory()
        self.assertFalse(assess(self.data, self.root)['gate_ready'])

    def test_v2_render_only_and_weakened_requirement_block(self):
        self.invalid(lambda data: data['checks'][1].__setitem__('basis', 'render-only'))
        self.invalid(lambda data: data['plan'][1].__setitem__('required', False))
        self.invalid(lambda data: data['plan'][1].__setitem__('minimum_basis', ['build']))

if __name__ == '__main__':
    unittest.main()
