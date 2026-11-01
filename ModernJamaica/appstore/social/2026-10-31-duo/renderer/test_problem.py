"""再編集で解答未確認の映像や字幕が混ざる失敗を防ぐ。"""
import json
from pathlib import Path
import unittest
from problem import validate_problem

P=Path(__file__).resolve().parent.parent
NEW=P.parent/'2026-11-01-duo-v2'


class ReeditValidation(unittest.TestCase):
    def config(self,root,target,variant):
        return json.loads((root/'problems'/f'make-{target}-{variant}.json').read_text())

    def test_original_and_reedited_configs_validate(self):
        for root in (P,NEW):
            for target,variant in ((23,'reveal'),(65,'fail')):
                validate_problem(self.config(root,target,variant))

    def test_short_intro_must_have_matching_native_cut(self):
        c=self.config(NEW,23,'reveal');c['cuts'][0][1]+=.4
        with self.assertRaises(ValueError):validate_problem(c)

    def test_unknown_presentation_rejected(self):
        c=self.config(NEW,23,'reveal');c['presentation']['version']=99
        with self.assertRaises(ValueError):validate_problem(c)

    def test_fail_closing_cannot_read_past_reviewed_footage(self):
        c=self.config(NEW,65,'fail');c['presentation']['ctaStillTime']=73
        with self.assertRaises(ValueError):validate_problem(c)

    def test_failure_caption_cannot_precede_wrong_answer(self):
        c=self.config(NEW,65,'fail');c['presentation']['resultCaption']['start']=3
        with self.assertRaises(ValueError):validate_problem(c)

    def test_caption_cannot_overlap_later_cta(self):
        c=self.config(NEW,65,'fail');c['presentation']['resultCaption']['end']=16
        with self.assertRaises(ValueError):validate_problem(c)


if __name__=='__main__':unittest.main()
