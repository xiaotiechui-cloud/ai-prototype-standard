"""Synthetic navigation declarations; no prototype/browser acceptance."""
import unittest
from copy import deepcopy
from check_navigation_model import assess


class NavigationTests(unittest.TestCase):
    def setUp(self):
        self.entry = dict(id='NAV-A', end='web', view='list', state='normal', role='member',
                          target='search', level='primary', placement='main-nav', source='01 task model',
                          task='find content', equivalence_key='search|empty|member|results', primary=True)

    def test_single_primary(self):
        self.assertTrue(assess({'entries': [self.entry]})['valid'])

    def test_equivalent_cross_region_duplicates_fail(self):
        other = dict(self.entry, id='NAV-B', placement='quick-area', primary=False)
        result = assess({'entries': [self.entry, other]})
        self.assertFalse(result['valid'])
        self.assertEqual(len(result['errors']), 3)

    def test_contextual_action_with_distinct_parameters_survives(self):
        other = dict(self.entry, id='NAV-B', placement='result-panel', level='context',
                     equivalence_key='search|current-object|member|filtered-results',
                     return_strategy='restore result object and query')
        self.assertTrue(assess({'entries': [self.entry, other]})['valid'])

    def test_documented_secondary_and_explicit_exception(self):
        other = dict(self.entry, id='NAV-B', placement='result-panel', level='context', primary=False,
                     return_strategy='restore query', exception_reason='continue current task',
                     decision_source='01 task decision', verification='TC-context actual entry and return')
        self.assertTrue(assess({'entries': [self.entry, other]})['valid'])

    def test_two_primaries_or_missing_return_fail(self):
        other = dict(self.entry, id='NAV-B')
        self.assertFalse(assess({'entries': [self.entry, other]})['valid'])
        other.update(level='secondary', equivalence_key='new-key')
        self.assertFalse(assess({'entries': [self.entry, other]})['valid'])

    def test_malformed_or_duplicate_id_fails(self):
        for data in ([], {'entries': [None]}, {'entries': [dict(self.entry, target=[])]},
                     {'entries': [self.entry, deepcopy(self.entry)]}):
            self.assertFalse(assess(data)['valid'])


if __name__ == '__main__':
    unittest.main()
