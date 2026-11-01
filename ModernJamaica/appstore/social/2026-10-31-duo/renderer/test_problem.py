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


class CommentAnswerValidation(unittest.TestCase):
    def config(self):
        c=json.loads((P/'problems/make-23-reveal.json').read_text())
        c.update(variant='comment-answer',cuts=[[1,3],[14.6,16.2],[26.7,28.3]],operatorFreezes=[],
                 completedHold=0,endCardDuration=2,cleanCompletedTime=None,
                 commentHoldDuration=2,commentStillTime=28.3-1/30,
                 noCorrectAnswerObserved=True,reviewedNoAnswerUntil=28.3,
                 previewTrees=[['+',['*',3,3],2],2,6],effects=[{'file':'connect.mp3','source':27,'gain':.4}])
        return c

    def test_valid_unfinished_native_preview(self):
        validate_problem(self.config())

    def test_selection_only_preview_keeps_all_five_native_digits(self):
        c=self.config();c['previewTrees']=c['numbers'][:];c['effects']=[]
        validate_problem(c)

    def test_unreviewed_or_late_answer_frames_rejected(self):
        for field,value in [('noCorrectAnswerObserved',False),('reviewedNoAnswerUntil',28),('cleanCompletedTime',53.7)]:
            with self.subTest(field=field):
                c=self.config();c[field]=value
                with self.assertRaises(ValueError):validate_problem(c)

    def test_hold_cannot_jump_to_another_source_frame(self):
        c=self.config();c['commentStillTime']=15
        with self.assertRaises(ValueError):validate_problem(c)

    def test_finished_or_wrong_digits_or_too_deep_preview_rejected(self):
        forests=[[],[self.config()['answerTree']],[['+',3,3],2,6,6],
                 [['+',['+',['*',3,3],2],2],6]]
        for forest in forests:
            with self.subTest(forest=forest):
                c=self.config();c['previewTrees']=forest
                with self.assertRaises(ValueError):validate_problem(c)

    def test_preview_matching_target_rejected_even_when_other_leaves_remain(self):
        c=self.config();c['previewTrees']=[['+',['*',6,3],['+',3,2]],2]
        with self.assertRaisesRegex(ValueError,'root matching'):validate_problem(c)

    def test_success_sound_and_solved_hold_rejected(self):
        for key,value in [('completedHold',2.1),('effects',[{'file':'success.mp3','source':27,'gain':.5}])]:
            with self.subTest(key=key):
                c=self.config();c[key]=value
                with self.assertRaises(ValueError):validate_problem(c)

    def test_unsafe_layout_or_prompt_timing_rejected(self):
        for key,value in [('presentation',{'version':2}),('commentHoldDuration',1),('fullFrameCuts',[1]),('endCardDuration',4)]:
            with self.subTest(key=key):
                c=self.config();c[key]=value
                with self.assertRaises(ValueError):validate_problem(c)

    def test_correct_answer_is_generated_only_as_fixed_comment_text(self):
        from problem import fixed_comment_text
        text=fixed_comment_text(self.config())
        self.assertIn('＝23',text)
        self.assertIn('×',text)
        self.assertIn('他の解き方を見つけた方はコメントで教えてください！',text)


if __name__=='__main__':unittest.main()
