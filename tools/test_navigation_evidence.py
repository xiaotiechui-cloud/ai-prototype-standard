import hashlib
import tempfile
import unittest
from pathlib import Path
from check_navigation_evidence import validate


class NavigationEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        for name, content in {
            "prototype.html": "<button id='search'>Search</button>",
            "navigation.json": '{"entries": [{"id": "NAV-1"}]}',
            "evidence.json": '{"navigation_id":"NAV-1","component_id":"APP-HOME-C01","target":"APP-SEARCH-01","result":"search page"}'
        }.items():
            (self.root / name).write_text(content, encoding="utf-8")

    def tearDown(self):
        self.temp.cleanup()

    def digest(self, name):
        return hashlib.sha256((self.root / name).read_bytes()).hexdigest()

    def manifest(self):
        return {
            "protocol": "navigation-evidence-1",
            "artifact": {"path": "prototype.html", "sha256": self.digest("prototype.html")},
            "navigation_model": {"path": "navigation.json", "sha256": self.digest("navigation.json")},
            "run": {"run_id": "RUN-1", "browser": "Chromium 131", "viewport": [1440, 900], "zoom": 100},
            "checks": [{"id": "CHK-NAV-1", "navigation_id": "NAV-1", "component_id": "APP-HOME-C01",
                         "selector": "#search", "action": "click", "expected": {"target": "APP-SEARCH-01", "result": "search page"},
                         "actual": {"target": "APP-SEARCH-01", "result": "search page", "returned_to": "APP-HOME-01"},
                         "status": "pass", "basis": "browser-action",
                         "evidence": [{"path": "evidence.json", "sha256": self.digest("evidence.json")}] }],
            "summary": {"total": 1, "pass": 1, "gate_ready": True}
        }

    def test_valid_browser_evidence(self):
        self.assertEqual(validate(self.manifest(), self.root), [])

    def test_dom_only_basis_is_rejected(self):
        data = self.manifest()
        data["checks"][0]["basis"] = "dom"
        self.assertTrue(validate(data, self.root))

    def test_target_mismatch_is_rejected(self):
        data = self.manifest()
        data["checks"][0]["actual"]["target"] = "APP-MINE-01"
        self.assertTrue(validate(data, self.root))

    def test_missing_evidence_or_stale_hash_is_rejected(self):
        data = self.manifest()
        data["checks"][0]["evidence"] = []
        self.assertTrue(validate(data, self.root))
        data = self.manifest()
        data["artifact"]["sha256"] = "0" * 64
        self.assertTrue(validate(data, self.root))


if __name__ == "__main__":
    unittest.main()
