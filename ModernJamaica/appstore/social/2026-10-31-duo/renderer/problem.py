"""Validate footage identity and arithmetic before any export is written."""
from collections import Counter
from fractions import Fraction
from pathlib import Path
import hashlib,json,re,math
STAR_BANDS=[(10,19),(20,39),(40,59),(60,79),(80,99)]
def star_level(target):
    for i,(a,b) in enumerate(STAR_BANDS,1):
        if type(target) is int and a<=target<=b:return i
    raise ValueError('Target is outside the reviewed 10–99 star bands')
def evaluate_tree(tree):
    if type(tree) is int:return Fraction(tree),[tree]
    if not isinstance(tree,list) or len(tree)!=3 or tree[0] not in ['+','-','*','/']:raise ValueError('Invalid arithmetic tree')
    op,a,b=tree;left,ls=evaluate_tree(a);right,rs=evaluate_tree(b)
    if op=='+':value=left+right
    elif op=='-':value=left-right
    elif op=='*':value=left*right
    else:
        if right==0:raise ValueError('Division by zero')
        value=left/right
    return value,ls+rs
def validate_problem(c):
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*',c['id']):raise ValueError('Unsafe problem id')
    star_level(c['target'])
    if len(c['numbers'])!=5 or any(type(n) is not int or not 1<=n<=10 for n in c['numbers']):raise ValueError('Five native numbers in the app range 1–10 required')
    value,used=evaluate_tree(c['answerTree'])
    if value!=c['target'] or Counter(used)!=Counter(c['numbers']):raise ValueError('Solution must reach target using all five numbers exactly once')
    if c['variant'] not in ['reveal','fail']:raise ValueError('Unknown variant')
    if not c['cuts'] or abs(c['cuts'][0][1]-c['cuts'][0][0]-2)>1e-6:raise ValueError('Intro must be 2 seconds')
    last=-1
    for a,b in c['cuts']:
        if not all(isinstance(x,(int,float)) and math.isfinite(x) for x in [a,b]) or not 0<=a<b or a<last:raise ValueError('Cuts must be chronological and nonoverlapping')
        last=b
        if abs((b-a)*30-round((b-a)*30))>1e-4:raise ValueError('Cuts must align to 30fps')
    for f in c['operatorFreezes']:
        a,b=c['cuts'][f['cut']]
        if not a<=f['sourceTime']<b or f['seconds']<0:raise ValueError('Invalid selected operator freeze')
    if not c['unsolvedWindow'][0]<=c['cuts'][0][0]<c['cuts'][0][1]<=c['unsolvedWindow'][1]:raise ValueError('Intro must use reviewed unsolved footage')
    for key in ['timerCuts','timeoutCuts','resultCuts','fullFrameCuts']:
        if any(type(i) is not int or not 0<=i<len(c['cuts']) for i in c.get(key,[])):raise ValueError('Invalid viewport cut index')
    if c['variant']=='fail':
        if c['completedHold']!=0:raise ValueError('Fail variant cannot hold a solved tree')
        if c['timeoutSourceTime']<=c['wrongSourceTime']:raise ValueError('Timeout must follow wrong answer')
        if not c.get('noCorrectAnswerObserved'):raise ValueError('Fail capture must be reviewed for answer leakage')
        if any(b>c['reviewedNoAnswerUntil'] for a,b in c['cuts']):raise ValueError('Fail export extends beyond reviewed answer-free footage')
        wrong,used=evaluate_tree(c['wrongTree'])
        if wrong==c['target'] or Counter(used)!=Counter(c['numbers']):raise ValueError('Wrong-answer take must use the same five digits and miss the target')
        if any(e['file']=='success.mp3' for e in c['effects']):raise ValueError('Fail variant cannot use success effect')
    return c

def load_problem(path):
    path=Path(path).resolve();c=validate_problem(json.loads(path.read_text()))
    for name in ['recording','evidence','normalizedCache']:
        c[name+'Path']=(path.parent/c[name]).resolve()
    evidence=json.loads(c['evidencePath'].read_text())
    if evidence['target']!=c['target'] or evidence['numbers']!=c['numbers']:raise ValueError('Native captured puzzle and caption config differ')
    if evidence['sourceSize']!=[1206,2622]:raise ValueError('Review viewport for a different recording size')
    if hashlib.sha256(c['recordingPath'].read_bytes()).hexdigest()!=c['sourceSha256']:raise ValueError('Recording hash does not match reviewed footage')
    import imageio_ffmpeg
    reader=imageio_ffmpeg.read_frames(str(c['recordingPath']));meta=next(reader);reader.close()
    if list(meta['size'])!=evidence['sourceSize']:raise ValueError('Actual source resolution differs from evidence')
    if max(b for a,b in c['cuts'])>meta['duration']:raise ValueError('Cut extends past recording end')
    if c['variant']=='reveal' and not 0<=c['cleanCompletedTime']<meta['duration']:raise ValueError('Invalid completed frame time')
    if c['normalizedCachePath'].exists() and hashlib.sha256(c['normalizedCachePath'].read_bytes()).hexdigest()!=c['normalizedSha256']:raise ValueError('Normalized cache mismatch')
    return c
