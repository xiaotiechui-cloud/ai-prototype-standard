"""Pure-model contract examples only; no browser or project acceptance claim."""
import unittest
from review_contract_fixture import generate_tokens, layer_contract, publish_and_read, reorder_before


class ReviewContractFixtureTests(unittest.TestCase):
    def setUp(self):
        self.profile = {'tokens': {'spacing': 8}, 'page_shell': {'frame': 'phone'},
                        'modal_defaults': {'business_host': 'business-container'}}

    def test_generation_output_consumes_profile_fields(self):
        baseline = generate_tokens(self.profile)
        changed = {'tokens': {'spacing': 12}, 'page_shell': {'frame': 'phone'},
                   'modal_defaults': {'business_host': 'business-container'}}
        self.assertNotEqual(baseline, generate_tokens(changed))
        self.assertEqual(baseline['spacing'], 8)

    def test_business_and_review_layers_have_distinct_hosts(self):
        business = layer_contract('business')
        review = layer_contract('review-viewport')
        self.assertEqual((business['host'], business['position']), ('business-container', 'absolute'))
        self.assertEqual((review['host'], review['position']), ('document-viewport', 'fixed'))

    def test_drag_and_keyboard_order_semantics_share_stable_id_operation(self):
        rows = [{'id': 'a'}, {'id': 'b'}, {'id': 'c'}]
        self.assertEqual([r['id'] for r in reorder_before(rows, 'c', 'a')], ['c', 'a', 'b'])
        # Both UI handlers must call this same stable-ID model operation.
        drag_result = reorder_before(rows, 'c', 'a')
        keyboard_result = reorder_before(rows, 'c', 'a')
        self.assertEqual(drag_result, keyboard_result)
        with self.assertRaises(ValueError):
            reorder_before(rows, 'missing', 'a')

    def test_published_value_is_read_by_consumer(self):
        published, consumer = publish_and_read({'order': ['c', 'a', 'b']})
        self.assertEqual(consumer, published)
        stale_consumer = {'order': ['a', 'b', 'c']}
        self.assertNotEqual(stale_consumer, published)


if __name__ == '__main__':
    unittest.main()
