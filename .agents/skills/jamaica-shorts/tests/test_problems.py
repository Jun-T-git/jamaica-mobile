import contextlib
import importlib.util
import io
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/problems.py'
SPEC = importlib.util.spec_from_file_location('problems', SCRIPT)
M = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(M)


class DuplicateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.social = Path(self.tmp.name)
        self.config = self.social / 'campaign/problems/old.json'
        self.config.parent.mkdir(parents=True)
        self.config.write_text(json.dumps(dict(target=23, numbers=[3, 2, 3, 2, 6], variant='reveal')))

    def call(self, command, target=None, numbers=None):
        args = [command, '--social', str(self.social)]
        if target is not None:
            args += ['--target', str(target), '--numbers', *map(str, numbers)]
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            code = M.main(args)
        return code, json.loads(output.getvalue())

    def test_permuted_hand_is_duplicate_across_variants(self):
        code, result = self.call('check', 23, [6, 3, 2, 3, 2])
        self.assertEqual(code, 1)
        self.assertTrue(result['duplicate'])

    def test_same_target_different_hand_allowed_and_id_changes(self):
        code, a = self.call('check', 23, [1, 2, 3, 4, 5])
        code2, b = self.call('check', 23, [1, 2, 3, 4, 6])
        self.assertEqual((code, code2), (0, 0))
        self.assertNotEqual(a['suggestedId'], b['suggestedId'])

    def test_same_hand_different_target_allowed(self):
        self.assertEqual(self.call('check', 24, [3, 2, 3, 2, 6])[0], 0)

    def test_multiplicity_matters(self):
        self.assertNotEqual(M.identity(23, [2, 2, 3, 3, 6]), M.identity(23, [2, 3, 3, 3, 6]))

    def test_reserve_blocks_next_attempt_without_creating_footage(self):
        self.assertEqual(self.call('reserve', 23, [1, 2, 3, 4, 5])[0], 0)
        self.assertEqual(self.call('check', 23, [5, 4, 3, 2, 1])[0], 1)
        self.assertFalse(list(self.social.rglob('*.mp4')))

    def test_synced_history_survives_missing_originals(self):
        self.assertEqual(self.call('sync')[0], 0)
        self.config.unlink()
        self.assertEqual(self.call('check', 23, [3, 2, 3, 2, 6])[0], 1)
        self.assertEqual(self.call('sync')[1]['uniqueProblems'], 1)

    def test_missing_or_corrupt_history_does_not_clear_candidate(self):
        self.config.write_text('{')
        self.assertEqual(self.call('reserve', 24, [1, 2, 3, 4, 5])[0], 2)
        self.assertFalse((self.social / 'problem-history.json').exists())
        self.config.unlink()
        self.assertEqual(self.call('check', 24, [1, 2, 3, 4, 5])[0], 2)

    def test_active_plan_without_numbers_or_config_blocks(self):
        # 同じtarget/variantの設定があっても、過去投稿の手札とは推定できない。
        (self.social / 'batch-plan.json').write_text(json.dumps({'items': [{'status': 'published', 'target': 23, 'variant': 'reveal'}]}))
        self.assertEqual(self.call('check', 24, [1, 2, 3, 4, 5])[0], 2)

    def test_explicit_config_must_match_plan_target(self):
        batch = self.social / 'batch-plan.json'
        item = dict(target=23, variant='reveal', status='published', config='campaign/problems/old.json')
        batch.write_text(json.dumps({'items': [item]}))
        self.assertEqual(self.call('check', 24, [1, 2, 3, 4, 5])[0], 0)
        item['target'] = 24
        batch.write_text(json.dumps({'items': [item]}))
        self.assertEqual(self.call('check', 24, [1, 2, 3, 4, 5])[0], 2)

    def test_verified_legacy_binding_is_exact_and_content_bound(self):
        item = dict(target=23, variant='reveal', status='published')
        batch = self.social / 'batch-plan.json'
        batch.write_text(json.dumps({'existingPublished': [item]}))
        binding = dict(path='batch-plan.json', record='existingPublished/0',
                       recordSha256=hashlib.sha256(json.dumps(item, sort_keys=True).encode()).hexdigest(),
                       target=23, numbers=[3, 2, 3, 2, 6], variant='reveal')
        (self.social / 'problem-history.json').write_text(json.dumps(dict(version=1, items=[], bindings=[binding])))
        self.assertEqual(self.call('check', 24, [1, 2, 3, 4, 5])[0], 0)
        item['url'] = 'new-unverified-record'
        batch.write_text(json.dumps({'existingPublished': [item]}))
        self.assertEqual(self.call('check', 24, [1, 2, 3, 4, 5])[0], 2)

    def test_parallel_reservations_have_one_winner(self):
        args = [sys.executable, str(SCRIPT), 'reserve', '--social', str(self.social),
                '--target', '24', '--numbers', '1', '2', '3', '4', '5']
        processes = [subprocess.Popen(args, stdout=subprocess.PIPE) for _ in range(2)]
        for process in processes:
            process.communicate(timeout=10)
        self.assertEqual(sorted(p.returncode for p in processes), [0, 1])


if __name__ == '__main__':
    unittest.main()
