"""Counterexamples for the required-check-set gate, not project acceptance."""
import hashlib
import json
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path

from check_required_check_set import assess


class RequiredCheckSetTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        for name, content in {
            'prototype.html': '<main>current</main>',
            'build.json': '{"ok":true}',
            'browser.json': '{"clicked":true,"result":"saved"}',
        }.items():
            (self.root / name).write_text(content, encoding='utf-8')
        self.data = {
            'protocol': 'required-check-set-1',
            'artifact': {'path': 'prototype.html', 'sha256': self.digest('prototype.html')},
            'plan': [
                {'id': 'CHK-STRUCT', 'category': 'structure', 'source': 'S9',
                 'required': True, 'evidence_required': True, 'minimum_basis': ['build']},
                {'id': 'CHK-P0', 'category': 'entry', 'source': '29.10',
                 'required': True, 'evidence_required': True, 'minimum_basis': ['browser']},
            ],
            'checks': [
                {'id': 'CHK-STRUCT', 'status': 'pass', 'executed': True, 'method': 'build lint',
                 'basis': 'build', 'actual': 'registry and diagram lint passed',
                 'evidence': [{'path': 'build.json', 'sha256': self.digest('build.json')}]},
                {'id': 'CHK-P0', 'status': 'pass', 'executed': True, 'method': 'real browser click',
                 'basis': 'browser', 'actual': 'save and consumer readback matched',
                 'evidence': [{'path': 'browser.json', 'sha256': self.digest('browser.json')}]},
            ],
        }
        self.refresh_summary()

    def tearDown(self):
        self.temp.cleanup()

    def digest(self, name):
        return hashlib.sha256((self.root / name).read_bytes()).hexdigest()

    def refresh_summary(self):
        statuses = [row['status'] for row in self.data['checks']]
        self.data['summary'] = {
            'pass': statuses.count('pass'), 'fail': statuses.count('fail'),
            'unverified': statuses.count('unverified'), 'blocked': statuses.count('blocked'),
            'not_applicable': statuses.count('not_applicable'), 'planned_total': 2,
            'required_total': 2, 'required_pass': sum(row['status'] == 'pass' and row['executed'] for row in self.data['checks']),
            'gate_ready': True,
        }

    def invalid(self, mutate):
        data = deepcopy(self.data)
        mutate(data)
        result = assess(data, self.root)
        self.assertFalse(result['gate_ready'])
        self.assertFalse(result['protocol_valid'])

    def test_valid_current_required_set_is_gate_ready(self):
        result = assess(self.data, self.root)
        self.assertTrue(result['protocol_valid'])
        self.assertTrue(result['gate_ready'])
        self.assertEqual(result['summary']['required_pass'], 2)

    def test_stale_artifact_blocks_gate(self):
        self.invalid(lambda data: data['artifact'].__setitem__('sha256', '0' * 64))

    def test_missing_result_or_evidence_blocks_gate(self):
        self.invalid(lambda data: data['checks'].pop())
        self.invalid(lambda data: data['checks'][0].__setitem__('evidence', []))

    def test_unverified_required_result_blocks_but_is_valid_protocol(self):
        data = deepcopy(self.data)
        data['checks'][1].update(status='unverified', executed=False, actual='not run')
        data['summary'].update({'pass': 1, 'unverified': 1, 'required_pass': 1, 'gate_ready': False})
        result = assess(data, self.root)
        self.assertTrue(result['protocol_valid'])
        self.assertFalse(result['gate_ready'])
        self.assertEqual(result['summary']['unverified'], 1)

    def test_dom_or_toast_only_basis_is_rejected(self):
        for basis in ('dom-only', 'toast-only', 'historical', 'self-report'):
            with self.subTest(basis=basis):
                self.invalid(lambda data, value=basis: data['checks'][1].__setitem__('basis', value))

    def test_summary_and_ids_are_fixed(self):
        self.invalid(lambda data: data['summary'].__setitem__('required_pass', 1))
        self.invalid(lambda data: data['checks'][1].__setitem__('id', 'CHK-OTHER'))

    def test_conditional_not_applicable_does_not_pass_required_gate(self):
        data = deepcopy(self.data)
        data['plan'][1]['required'] = False
        data['checks'][1].update(status='not_applicable', executed=False, actual='platform unavailable',
                                 na_reason='external platform unavailable', evidence=[])
        data['summary'].update({'pass': 1, 'not_applicable': 1, 'planned_total': 2, 'required_total': 1,
                                'required_pass': 1, 'gate_ready': True})
        result = assess(data, self.root)
        self.assertTrue(result['protocol_valid'])
        self.assertTrue(result['gate_ready'])


if __name__ == '__main__':
    unittest.main()
