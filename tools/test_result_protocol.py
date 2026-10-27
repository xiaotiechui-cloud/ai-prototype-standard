"""Counterexamples for the optional result protocol, not project acceptance."""
from copy import deepcopy
import unittest
from check_result_protocol import assess, STATUSES


def fixture(status='pass'):
    return {'protocol_version': 'checks-enum-1', 'planned_ids': ['CHK-A', 'CHK-B'],
            'checks': [{'id': 'CHK-A', 'status': status, 'detail': 'evidence/A'},
                       {'id': 'CHK-B', 'status': 'pass', 'detail': 'evidence/B'}],
            'summary': {s: int(s == status) + int(s == 'pass') for s in STATUSES}}


class ProtocolTests(unittest.TestCase):
    def invalid(self, data):
        result = assess(data)
        self.assertFalse(result['protocol_valid'])
        self.assertFalse(result['ready_for_evidence_review'])
        self.assertIsNone(result['summary'])

    def test_valid_pass(self):
        self.assertTrue(assess(fixture())['ready_for_evidence_review'])

    def test_real_nonpass_preserved(self):
        for status in ('fail', 'blocked', 'unverified'):
            with self.subTest(status=status):
                result = assess(fixture(status))
                self.assertTrue(result['protocol_valid'])
                self.assertFalse(result['ready_for_evidence_review'])
                self.assertEqual(result['summary'][status], 1)
                self.assertEqual(result['planned_total'], 2)

    def test_invalid_status_types_and_aliases(self):
        for value in (False, True, 'false', 'ok', None, 1, [], {}):
            with self.subTest(value=value):
                data = fixture(); data['checks'][0]['status'] = value
                self.invalid(data)

    def test_missing_fields(self):
        for key in ('id', 'status', 'detail'):
            data = fixture(); del data['checks'][0][key]
            self.invalid(data)

    def test_swapped_fields(self):
        data = fixture(); data['checks'][0].update(status='evidence/A', detail=False)
        self.invalid(data)

    def test_duplicate_result_and_plan(self):
        data = fixture(); data['checks'][1]['id'] = 'CHK-A'; self.invalid(data)
        data = fixture(); data['planned_ids'][1] = 'CHK-A'; self.invalid(data)

    def test_omitted_or_unplanned_result(self):
        data = fixture(); data['checks'].pop(); self.invalid(data)
        data = fixture(); data['checks'][1]['id'] = 'CHK-C'; self.invalid(data)

    def test_summary_mismatch_or_bool(self):
        data = fixture(); data['summary']['pass'] = 20; self.invalid(data)
        data = fixture(); data['summary']['fail'] = False; self.invalid(data)

    def test_invalid_root_and_shape(self):
        for data in (None, False, [], {}, {'checks': [False]},
                     dict(fixture(), planned_ids=[{}]), dict(fixture(), checks='pass')):
            self.invalid(deepcopy(data))

    def test_na_keeps_denominator(self):
        result = assess(fixture('not_applicable'))
        self.assertEqual(result['planned_total'], 2)
        self.assertEqual(result['summary']['not_applicable'], 1)


if __name__ == '__main__':
    unittest.main()
