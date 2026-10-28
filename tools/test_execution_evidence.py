"""Counterexamples for execution evidence preflight, not project acceptance."""
import hashlib
import tempfile
import unittest
from pathlib import Path
from check_execution_evidence import validate


class ExecutionEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / 'profile.json').write_text('{"spacing":8}', encoding='utf-8')
        (self.root / 'prototype.html').write_text('<main>sample</main>', encoding='utf-8')
        (self.root / 'generate.py').write_text('# generation entrypoint fixture\n', encoding='utf-8')
        (self.root / 'readback.json').write_text(
            '{"target_id":"item-2","published_value":["b","a"],"consumer_value":["b","a"]}',
            encoding='utf-8')
        self.data = {
            'protocol': 'execution-evidence-1',
            'profile': {'path': 'profile.json', 'sha256': self.digest('profile.json'),
                        'algorithm': 'sha256', 'consumed_fields': ['spacing'],
                        'consumption_stage': 'before-generation', 'truncation_length': 64,
                        'serialization': 'utf-8-json', 'normalization': 'none'},
            'artifact': {'path': 'prototype.html', 'sha256': self.digest('prototype.html')},
            'run': {'entrypoint': 'generate.py', 'working_directory': '.',
                    'dependencies': [], 'environment': 'test fixture',
                    'results_encoding': 'utf-8', 'evidence_path': 'evidence/run-1'},
            'write_readback': [{'action': 'publish', 'target_id': 'item-2',
                                'published_value': ['b', 'a'], 'consumer_value': ['b', 'a'],
                                'consumer': 'public list', 'evidence_path': 'readback.json',
                                'evidence_sha256': self.digest('readback.json'),
                                'result_basis': 'consumer-readback'}]
        }

    def tearDown(self):
        self.temp.cleanup()

    def digest(self, name):
        return hashlib.sha256((self.root / name).read_bytes()).hexdigest()

    def assert_invalid(self, mutate):
        data = self.data.copy()
        data['profile'] = self.data['profile'].copy()
        data['artifact'] = self.data['artifact'].copy()
        data['run'] = self.data['run'].copy()
        data['write_readback'] = [self.data['write_readback'][0].copy()]
        mutate(data)
        self.assertTrue(validate(data, self.root))

    def test_valid_manifest_keeps_input_and_output_fingerprints_separate(self):
        self.assertEqual(validate(self.data, self.root), [])

    def test_declared_truncated_profile_hash_is_reproducible(self):
        data = self.data.copy()
        data['profile'] = self.data['profile'].copy()
        data['profile'].update(truncation_length=32, sha256=self.digest('profile.json')[:32])
        self.assertEqual(validate(data, self.root), [])

    def test_output_hash_cannot_stand_in_for_profile_hash(self):
        self.assert_invalid(lambda d: d['profile'].update(sha256=d['artifact']['sha256']))

    def test_missing_or_changed_target_blocks_preflight(self):
        self.assert_invalid(lambda d: d['artifact'].update(path='missing.html'))
        self.assert_invalid(lambda d: d['artifact'].update(sha256='0' * 64))

    def test_path_escape_is_rejected(self):
        self.assert_invalid(lambda d: d['profile'].update(path='../outside.json'))

    def test_profile_must_claim_pre_generation_consumption(self):
        self.assert_invalid(lambda d: d['profile'].update(consumption_stage='after-generation'))
        self.assert_invalid(lambda d: d['profile'].update(consumed_fields=[]))

    def test_stale_consumer_and_toast_only_are_rejected(self):
        self.assert_invalid(lambda d: d['write_readback'][0].update(consumer_value=['a', 'b']))
        self.assert_invalid(lambda d: d['write_readback'][0].update(result_basis='toast'))

    def test_readback_evidence_must_match_declared_target_and_values(self):
        self.assert_invalid(lambda d: d['write_readback'][0].update(target_id='item-1'))

    def test_missing_environment_or_encoding_is_rejected(self):
        self.assert_invalid(lambda d: d['run'].update(environment=''))
        self.assert_invalid(lambda d: d['run'].update(results_encoding='not-an-encoding'))


if __name__ == '__main__':
    unittest.main()
