import hashlib
import tempfile
import unittest
from pathlib import Path
from check_comparison_baseline import validate


class ComparisonBaselineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        for name in ("trial.html", "acceptance.html", "visual.html", "docs.md", "prd.md"):
            (self.root / name).write_text(name, encoding="utf-8")

    def tearDown(self):
        self.temp.cleanup()

    def digest(self, name):
        return hashlib.sha256((self.root / name).read_bytes()).hexdigest()

    def data(self):
        specs = [("trial", "trial_artifact", "trial.html"), ("acceptance", "acceptance_artifact", "acceptance.html"),
                 ("visual", "visual_reference", "visual.html"), ("docs", "document_reference", "docs.md"), ("prd", "prd", "prd.md")]
        return {"protocol": "comparison-baseline-1", "review_id": "REV-1",
                "required_roles": [x[1] for x in specs],
                "inputs": [{"id": i, "role": role, "path": path, "version": "V1", "sha256": self.digest(path),
                             "purpose": role, "relationship": "reference"} for i, role, path in specs],
                "comparison": {"semantic_mapping_required": True, "counts_not_quality": True, "mismatch_action": "split findings"}}

    def test_valid_baseline(self):
        self.assertEqual(validate(self.data(), self.root), [])

    def test_missing_role_or_stale_hash_fails(self):
        data = self.data()
        data["inputs"] = data["inputs"][:-1]
        self.assertTrue(validate(data, self.root))
        data = self.data()
        data["inputs"][0]["sha256"] = "0" * 64
        self.assertTrue(validate(data, self.root))

    def test_semantic_mapping_and_count_flags_are_required(self):
        data = self.data()
        data["comparison"]["counts_not_quality"] = False
        self.assertTrue(validate(data, self.root))


if __name__ == "__main__":
    unittest.main()
