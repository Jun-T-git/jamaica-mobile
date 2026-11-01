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
def tree_depth(tree):
    return 0 if type(tree) is int else 1+max(tree_depth(tree[1]),tree_depth(tree[2]))

def format_tree(tree):
    if type(tree) is int:return str(tree)
    symbols={'+':'+','-':'−','*':'×','/':'÷'}
    return f'（{format_tree(tree[1])}{symbols[tree[0]]}{format_tree(tree[2])}）'

def fixed_comment_text(c):
    return f"答えの一例：{format_tree(c['answerTree'])}＝{c['target']}\n\n他の解き方を見つけた方はコメントで教えてください！\n"

def validate_problem(c):
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*',c['id']):raise ValueError('Unsafe problem id')
    star_level(c['target'])
    if len(c['numbers'])!=5 or any(type(n) is not int or not 1<=n<=10 for n in c['numbers']):raise ValueError('Five native numbers in the app range 1–10 required')
    value,used=evaluate_tree(c['answerTree'])
    if value!=c['target'] or Counter(used)!=Counter(c['numbers']):raise ValueError('Solution must reach target using all five numbers exactly once')
    if c['variant'] not in ['reveal','fail','comment-answer']:raise ValueError('Unknown variant')
    intro=c.get('presentation',{}).get('introDuration',2)
    presentation=c.get('presentation',{})
    if presentation.get('version',1) not in (1,2):raise ValueError('Unknown presentation version')
    if type(intro) not in (int,float) or not math.isfinite(intro) or not .5<=intro<=3:raise ValueError('Invalid intro duration')
    if not c['cuts'] or abs(c['cuts'][0][1]-c['cuts'][0][0]-intro)>1e-6:raise ValueError('Intro cut does not match its duration')
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
        closing=presentation.get('ctaStillTime',c['questionStillTime'])
        if type(closing) not in (int,float) or not math.isfinite(closing) or not 0<=closing<=c['reviewedNoAnswerUntil']:raise ValueError('Closing frame outside reviewed answer-free footage')
    if c['variant']=='comment-answer':
        if presentation.get('version',1)!=1 or intro!=2:raise ValueError('Comment-answer retains the v3 two-second question layout')
        if c['completedHold']!=0 or c['endCardDuration']!=2:raise ValueError('Comment-answer uses no solved hold and a two-second search card')
        if c.get('commentHoldDuration')!=2:raise ValueError('Comment prompt must hold for two seconds')
        reviewed=c.get('reviewedNoAnswerUntil');still=c.get('commentStillTime')
        if c.get('noCorrectAnswerObserved') is not True or type(reviewed) not in (int,float) or not math.isfinite(reviewed):raise ValueError('Comment-answer needs reviewed answer-free footage')
        if any(b>reviewed for a,b in c['cuts']):raise ValueError('Comment-answer cut extends beyond reviewed answer-free footage')
        if type(still) not in (int,float) or not math.isfinite(still) or abs(still-(c['cuts'][-1][1]-1/30))>1e-6:raise ValueError('Comment hold must preserve the last gameplay frame')
        if not 0<=still<=reviewed:raise ValueError('Comment still outside reviewed footage')
        forest=c.get('previewTrees',[])
        if not isinstance(forest,list) or len(forest)<2:raise ValueError('Preview must remain unfinished')
        leaves=[];merges=0
        for tree in forest:
            value,used=evaluate_tree(tree);leaves+=used;merges+=len(used)-1
            if tree_depth(tree)>2:raise ValueError('Preview tree enters the comment caption area')
            if isinstance(tree,list) and value==c['target']:raise ValueError('Preview cannot show a root matching the target')
        if Counter(leaves)!=Counter(c['numbers']) or not 0<=merges<=2:raise ValueError('Preview must use the native digits and show at most two merges')
        if c.get('cleanCompletedTime') is not None:raise ValueError('Comment-answer cannot use a completed frame')
        if any(e['file']=='success.mp3' for e in c['effects']):raise ValueError('Comment-answer cannot use success audio')
        if any(c.get(k) for k in ['timerCuts','timeoutCuts','resultCuts','fullFrameCuts']):raise ValueError('Comment-answer keeps the reviewed standard viewport')
        if presentation.get('resultCaption') or 'ctaStillTime' in presentation:raise ValueError('Comment-answer uses its dedicated prompt and unfinished still')
    caption=presentation.get('resultCaption')
    if caption:
        start,end=caption['start'],caption['end']
        play=sum(b-a for a,b in c['cuts'])+sum(f['seconds'] for f in c['operatorFreezes'])+c['completedHold']
        if not all(type(t) in (int,float) and math.isfinite(t) for t in (start,end)) or not 0<=start<end<=play+1e-6:raise ValueError('Caption outside gameplay')
        if c['variant']=='fail':
            elapsed=0;wrong_at=None
            for i,(a,b) in enumerate(c['cuts']):
                pauses=[f for f in c['operatorFreezes'] if f['cut']==i]
                if a<=c['wrongSourceTime']<b:
                    wrong_at=elapsed+c['wrongSourceTime']-a+sum(f['seconds'] for f in pauses if f['sourceTime']<=c['wrongSourceTime'])
                    break
                elapsed+=b-a+sum(f['seconds'] for f in pauses)
            if wrong_at is None or start<wrong_at:raise ValueError('Failure caption before native wrong result')
    return c

def load_problem(path):
    path=Path(path).resolve();c=validate_problem(json.loads(path.read_text()))
    for name in ['recording','evidence','normalizedCache']:
        c[name+'Path']=(path.parent/c[name]).resolve()
    evidence=json.loads(c['evidencePath'].read_text())
    if evidence['target']!=c['target'] or evidence['numbers']!=c['numbers']:raise ValueError('Native captured puzzle and caption config differ')
    if c['variant']=='comment-answer':
        if evidence.get('noCorrectAnswerObserved') is not True or evidence.get('reviewedNoAnswerUntil',-1)<c['reviewedNoAnswerUntil'] or evidence.get('previewTrees')!=c['previewTrees']:raise ValueError('Comment-answer review evidence does not match the unfinished footage')
    if evidence['sourceSize']!=[1206,2622]:raise ValueError('Review viewport for a different recording size')
    if hashlib.sha256(c['recordingPath'].read_bytes()).hexdigest()!=c['sourceSha256']:raise ValueError('Recording hash does not match reviewed footage')
    import imageio_ffmpeg
    reader=imageio_ffmpeg.read_frames(str(c['recordingPath']));meta=next(reader);reader.close()
    if list(meta['size'])!=evidence['sourceSize']:raise ValueError('Actual source resolution differs from evidence')
    if max(b for a,b in c['cuts'])>meta['duration']:raise ValueError('Cut extends past recording end')
    if c['variant']=='reveal' and not 0<=c['cleanCompletedTime']<meta['duration']:raise ValueError('Invalid completed frame time')
    if c['variant']=='comment-answer' and not 0<=c['commentStillTime']<meta['duration']:raise ValueError('Comment still outside source duration')
    if 'ctaStillTime' in c.get('presentation',{}):
        t=c['presentation']['ctaStillTime']
        if type(t) not in (int,float) or not math.isfinite(t) or not 0<=t<meta['duration']:raise ValueError('Invalid closing frame time')
    if c['normalizedCachePath'].exists() and hashlib.sha256(c['normalizedCachePath'].read_bytes()).hexdigest()!=c['normalizedSha256']:raise ValueError('Normalized cache mismatch')
    return c
