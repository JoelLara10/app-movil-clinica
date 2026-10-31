"""Prove failures cannot silently pass and exceptions cannot hide other secrets."""
import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('mobile_security_review', Path(__file__).with_name('security_review.py'))
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


class GatePolicy(unittest.TestCase):
    def test_unreviewed_secret_blocks_and_exception_is_exact(self):
        known, other = 'a' * 40, 'b' * 40
        scan = {'results': {'tests\\fixture.js': [
            {'type': 'Secret Keyword', 'hashed_secret': known, 'line_number': 1},
            {'type': 'Secret Keyword', 'hashed_secret': other, 'line_number': 2}],
            'src/file.js': [{'type': 'Secret Keyword', 'hashed_secret': known, 'line_number': 3}]}}
        self.assertEqual(len(review.finding_locations(scan, [])), 3)
        allow = [{'file': 'tests/fixture.js', 'type': 'Secret Keyword', 'hashed_secret': known}]
        self.assertEqual([x['line'] for x in review.finding_locations(scan, allow)], [2, 3])

    def test_invalid_catalog_and_plaintext_are_rejected(self):
        for item in [{'file': '../secret', 'type': 'Secret Keyword', 'hashed_secret': 'a'*40, 'reason': next(iter(review.REASONS))},
                     {'file': 'ci/security_review.py', 'type': 'Secret Keyword', 'hashed_secret': 'plain-value', 'reason': next(iter(review.REASONS))},
                     {'file': 'ci/security_review.py', 'type': 'Secret Keyword', 'hashed_secret': 'a'*40, 'reason': next(iter(review.REASONS)), 'secret': 'forbidden'}]:
            with self.assertRaises(ValueError):
                review.validate_reviewed([item])

    def test_high_or_critical_dependencies_fail(self):
        for high, critical in [(1, 0), (0, 1)]:
            self.assertEqual(review.audit_status({'metadata': {'vulnerabilities': {'high': high, 'critical': critical}}})[0], 1)
        self.assertEqual(review.audit_status({'metadata': {'vulnerabilities': {'high': 0, 'critical': 0}}})[0], 0)

    def test_broken_scanners_fail_closed(self):
        cases = [('secrets', subprocess.CompletedProcess([], 1, '{}', 'private-value')),
                 ('secrets', subprocess.CompletedProcess([], 0, '{}', '')),
                 ('audit', subprocess.CompletedProcess([], 1, '{"error": "unavailable"}', '')),
                 ('audit', subprocess.CompletedProcess([], 0, '{}', ''))]
        with tempfile.TemporaryDirectory() as directory:
            for mode, proc in cases:
                result = review.run_check('broken', [], Path(directory), mode, runner=lambda *a, **kw: proc)
                self.assertFalse(result['passed'])
                self.assertEqual(result['exit_code'], 2)
            def unavailable(*a, **kw):
                raise FileNotFoundError()
            self.assertFalse(review.run_check('missing', [], Path(directory), runner=unavailable)['passed'])
            for file in Path(directory).iterdir():
                self.assertNotIn('private-value', file.read_text())

    def test_secret_reports_keep_locations_without_source(self):
        scan = {'results': {'src/file.js': [{'type': 'Secret Keyword', 'hashed_secret': 'a'*40, 'line_number': 2, 'secret_value': 'private-value'}]}}
        import json
        with tempfile.TemporaryDirectory() as directory, patch.object(review, 'validate_reviewed'):
            with patch.object(review, 'finding_locations', return_value=[{'file': 'src/file.js', 'type': 'Secret Keyword', 'line': 2}]):
                proc = subprocess.CompletedProcess([], 0, json.dumps(scan), 'private-value')
                result = review.run_check('secret', [], Path(directory), 'secrets', runner=lambda *a, **kw: proc)
            self.assertFalse(result['passed'])
            self.assertNotIn('private-value', (Path(directory) / 'secret.json').read_text())


if __name__ == '__main__':
    unittest.main()
