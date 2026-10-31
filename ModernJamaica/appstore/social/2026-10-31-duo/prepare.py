"""新規の実収録2本を、既存v14の構成で書き出す設定を保存する。"""
from pathlib import Path
import json
import hashlib

P = Path(__file__).resolve().parent
(P / 'problems').mkdir(exist_ok=True)
JOBS = [
    (23, 'reveal', [3, 2, 3, 2, 6],
     ['+', ['+', ['*', 3, 3], 2], ['*', 2, 6]],
     [[1, 3], [4.8, 5.2], [10.3, 10.9], [14.6, 16.2],
      [19.3, 19.7], [22.7, 23.3], [26.7, 28.3], [30.9, 31.3],
      [34.6, 35.2], [39.3, 40.9], [43.7, 44.1], [48.5, 49.1], [52, 53.4]], 53.7),
    (65, 'fail', [1, 10, 9, 4, 5],
     ['+', ['*', ['+', 1, 9], ['-', 10, 4]], 5],
     [[12, 14], [19.2, 20.8], [24.5, 26.1], [30.3, 31.9],
      [35.7, 37.3], [68.5, 71.5], [71.5, 71.6]], None),
]

for target, variant, numbers, tree, cuts, clean in JOBS:
    stem = f'make-{target}-{variant}'
    src = 'make-23-reveal' if variant == 'reveal' else 'fail'
    raw = P / 'sources' / f'{src}.mov'
    cache = P / 'build' / f'{src}-cfr.mp4'
    evidence = dict(target=target, numbers=numbers, sourceSize=[1206, 2622],
                    capture='Native app UI on existing isolated Jamaica Ad Capture simulator; ordinary random puzzle; no game code or puzzle-state changes',
                    review='Native target and ordered leaves visually verified, 2026-10-31 JST')
    (P / 'sources' / f'{stem}-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2))
    c = dict(id=f'make-{target}', episode=f'new-{target}-2026-10-31',
             variant=variant, numbers=numbers, target=target, answerTree=tree,
             recording=f'../sources/{src}.mov', evidence=f'../sources/{stem}-evidence.json',
             sourceSha256=hashlib.sha256(raw.read_bytes()).hexdigest(),
             normalizedCache=f'../build/{src}-cfr.mp4',
             normalizedSha256=hashlib.sha256(cache.read_bytes()).hexdigest(),
             unsolvedWindow=[1, 4] if variant == 'reveal' else [11, 18],
             questionStillTime=2 if variant == 'reveal' else 13,
             cleanCompletedTime=clean, cuts=cuts, operatorFreezes=[], effects=[],
             completedHold=2.1 if variant == 'reveal' else 0,
             endCardDuration=3.5 if variant == 'reveal' else 4)
    if variant == 'reveal':
        for t in [14.9, 27, 39.6, 52.5]:
            c['effects'].append(dict(file='success.mp3' if t == 52.5 else 'connect.mp3', source=t, gain=.5 if t == 52.5 else .4))
    else:
        c.update(wrongTree=['-', ['*', 10, 9], ['*', 4, ['+', 1, 5]]],
                 wrongSourceTime=36.6, timeoutSourceTime=71.5,
                 noCorrectAnswerObserved=True, reviewedNoAnswerUntil=71.7,
                 fullFrameCuts=[], timerCuts=[5, 6], timeoutCuts=[6], resultCuts=[],
                 operatorFreezes=[dict(cut=i, sourceTime=t, seconds=.7 if i < 5 else .8,
                                       purpose='Hold actual selected operator' if i < 5 else 'Hold actual native zero')
                                  for i, t in [(1, 19.733333333333334), (2, 24.933333333333334),
                                               (3, 30.9), (4, 36.233333333333334), (6, 71.5)]])
        for t in [19.9, 25.1, 31, 36.6]:
            c['effects'].append(dict(file='connect.mp3', source=t, gain=.4))
    (P / 'problems' / f'{stem}.json').write_text(json.dumps(c, ensure_ascii=False, indent=2))

(P / 'batch-plan.json').write_text(json.dumps(dict(
    items=[dict(episode=f'new-{t}', variant=v, status='ready', config=f'problems/make-{t}-{v}.json')
           for t, v, *_ in JOBS], automaticPublishing=False), indent=2))
