#!/usr/bin/env python3
"""Native target retained; blank strip shortened; tree and controls remain continuous."""
from pathlib import Path
import hashlib, io, json, shutil, subprocess, wave, re, math
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

import argparse
from problem import load_problem,star_level,STAR_BANDS,fixed_comment_text
PARSER=argparse.ArgumentParser()
PARSER.add_argument('--problem',required=True,type=Path)
PARSER.add_argument('--output',required=True,type=Path)
ARGS=PARSER.parse_args();CONFIG=load_problem(ARGS.problem)
FAIL=CONFIG['variant']=='fail'
COMMENT=CONFIG['variant']=='comment-answer'
COMMENT_WRONG=COMMENT and CONFIG.get('commentResult')=='wrong'
MODERN=CONFIG.get('presentation',{}).get('version')==2
PRESENTATION=CONFIG.get('presentation',{})
INTRO=PRESENTATION.get('introDuration',2)
OUT=ARGS.output.resolve();OUT.mkdir(parents=True,exist_ok=True)
APP=next(x for x in Path(__file__).resolve().parents if (x/'ios/ModernJamaica').is_dir());RAW=CONFIG['recordingPath']
BUILD=OUT/'build';QA=OUT/'qa'
for p in [BUILD,QA]:p.mkdir(exist_ok=True)
FF=imageio_ffmpeg.get_ffmpeg_exe()
W,H,FPS=1080,1920,30
TARGET=CONFIG['target']
BG='#171822';WHITE='#f7f8fc';MINT='#6ee7b7'
HEAD='/System/Library/Fonts/ヒラギノ角ゴシック W7.ttc'
BODY='/System/Library/Fonts/ヒラギノ角ゴシック W4.ttc'
CUTS=CONFIG['cuts'];FREEZES={f['cut']:f['sourceTime'] for f in CONFIG['operatorFreezes']}
FREEZE_LENGTHS={f['cut']:f['seconds'] for f in CONFIG['operatorFreezes']}
HOLD,END=CONFIG['completedHold'],CONFIG['endCardDuration']
COMMENT_HOLD=CONFIG.get('commentHoldDuration',0) if COMMENT else 0
PLAY=round((sum(b-a for a,b in CUTS)+sum(FREEZE_LENGTHS.values())+HOLD+COMMENT_HOLD)*FPS)/FPS;DURATION=round((PLAY+END)*FPS)/FPS
DEST=OUT/f"{CONFIG['id']}-{CONFIG['variant']}.mp4"

def run(args,log=None):
    r=subprocess.run([FF,'-hide_banner','-y',*map(str,args)],capture_output=True)
    if log:(QA/log).write_bytes(r.stderr)
    if r.returncode:raise RuntimeError(r.stderr.decode(errors='replace')[-3500:])
    return r.stdout

SRC=BUILD/'capture-cfr.mp4'
if not SRC.exists():
    cached=CONFIG['normalizedCachePath']
    if cached.exists():shutil.copy2(cached,SRC)
    else:run(['-loglevel','warning','-i',RAW,'-vf','fps=30,setpts=PTS-STARTPTS','-an','-c:v','libx264','-preset','fast','-crf',17,SRC],'normalize.log')

layout={}
GOLD='#fde047';MUTED='#b7bfd0'
LEVEL=star_level(TARGET)

def text_art(text,size,color=WHITE,bold=True):
    font=ImageFont.truetype(HEAD if bold else BODY,size)
    bb=font.getbbox(text)
    im=Image.new('RGBA',(bb[2]-bb[0]+8,bb[3]-bb[1]+8))
    ImageDraw.Draw(im).text((4-bb[0],4-bb[1]),text,font=font,fill=color)
    return im.crop(im.getbbox())

def label(im,text,y,size,color=WHITE,bold=True):
    art=text_art(text,size,color,bold);assert art.width<=920
    x=(W-art.width)//2;im.alpha_composite(art,(x,y))
    layout[text]=[x,y,art.width,art.height]

icon_original=Image.open(APP/'ios/ModernJamaica/Images.xcassets/AppIcon.appiconset/1024.png').convert('RGBA')
def icon(size,radius):
    im=ImageOps.fit(icon_original,(size,size),method=Image.Resampling.LANCZOS)
    mask=Image.new('L',(size,size));ImageDraw.Draw(mask).rounded_rectangle((0,0,size-1,size-1),radius=radius,fill=255)
    im.putalpha(mask);return im

header=Image.new('RGBA',(W,H));d=ImageDraw.Draw(header)
header.alpha_composite(icon(80,18),(110,258))
name=text_art('ジャマイカの木',48)
header.alpha_composite(name,(210,258+(80-name.height)//2))
small=text_art('難易度',28,MUTED,False);header.alpha_composite(small,(675+(210-small.width)//2,258))
star_boxes=[]
for i in range(5):
    x=675+i*43;cx=x+17;cy=315;points=[]
    for vertex in range(10):
        radius=17 if vertex%2==0 else 7.5
        angle=-math.pi/2+vertex*math.pi/5
        points.append((cx+math.cos(angle)*radius,cy+math.sin(angle)*radius))
    d.polygon(points,fill=GOLD if i<LEVEL else BG)
    d.line(points+[points[0]],fill=GOLD if i<LEVEL else '#8b94ab',width=2,joint='curve')
    star_boxes.append([x,298,34,34])
layout['brandHeader']={'icon':[110,258,80,80],'title':[210,258+(80-name.height)//2,name.width,name.height]}
layout['difficulty']={'level':LEVEL,'bands':STAR_BANDS,'label':[675+(210-small.width)//2,258,small.width,small.height],'stars':star_boxes,'displayStart':0,'displayEnd':PLAY}

# Remove only a blank horizontal strip above the tree; retain native target and
# the entire tree-to-controls region at a common scale with no internal edits.
GAME_Y=350
GAME_CROP='split=2[goal][board];[goal]crop=1206:280:0:420[top];[board]crop=1206:1550:0:1000[bottom];[top][bottom]vstack=inputs=2,scale=860:1304:flags=lanczos,setsar=1'
layout['gameViewport']={'sourceCrops':[[0,420,1206,280],[0,1000,1206,1550]],'omittedBlankStrip':[0,700,1206,300],'placement':[110,350,860,1304],'nativeTargetRetained':True,'treeAndControlsContinuous':True}
if COMMENT_WRONG and CONFIG.get('nativeViewport'):
    goal,board=CONFIG['nativeViewport']['sourceCrops']
    GAME_Y=CONFIG['nativeViewport'].get('y',350)
    gx,gy,gw,gh=goal;bx,by,bw,bh=board
    native_height=round((gh+bh)*860/1206)
    GAME_CROP=f'split=2[goal][board];[goal]crop={gw}:{gh}:{gx}:{gy}[top];[board]crop={bw}:{bh}:{bx}:{by}[bottom];[top][bottom]vstack=inputs=2,scale=860:{native_height}:flags=lanczos,setsar=1'
    layout['gameViewport']={'sourceCrops':[goal,board],'placement':[110,GAME_Y,860,native_height],'nativeTargetRetained':True,'treeAndControlsContinuous':True,'reviewScreen':True,'sameCropThroughoutGameplayAndPrompt':True}


for kind in ['hook','plain','complete','hold','cta']+(['comment'] if COMMENT else [])+(['timeout'] if FAIL else []):
    im=header.copy()
    if kind=='hook' and MODERN:
        label(im,'5つ全部を1回ずつ',975,60,MINT)
        ImageDraw.Draw(im).rounded_rectangle((130,1070,950,1248),radius=28,outline=MINT,width=5)
        layout['puzzleRule']={'text':'5つ全部を1回ずつ','targetShownOnlyInNativeCard':True}
        layout['numberFrame']={'bounds':[130,1070,950,1248],'displayStart':0,'displayEnd':INTRO}
    elif kind=='hook':
        label(im,'この5つの数字で',585,46,MUTED,False)
        label(im,f'{TARGET}を作れる？',665,80,MINT)
        runs=[('5つの数を使って',52,WHITE),(str(TARGET),76,GOLD),('を作れ',52,WHITE)]
        fonts=[ImageFont.truetype(HEAD,size) for _,size,_ in runs]
        total=sum(font.getlength(text)for(text,_,_),font in zip(runs,fonts))+28
        x=(W-total)/2;parts=[]
        for (text,size,color),font in zip(runs,fonts):
            bb=font.getbbox(text,anchor='ls')
            ImageDraw.Draw(im).text((round(x),1030),text,font=font,fill=color,anchor='ls')
            parts.append({'text':text,'color':color,'bounds':[round(x+bb[0]),1030+bb[1],bb[2]-bb[0],bb[3]-bb[1]]})
            x+=font.getlength(text)+14
        ImageDraw.Draw(im).rounded_rectangle((130,1070,950,1248),radius=28,outline=MINT,width=5)
        layout['puzzleRule']={'text':f'5つの数を使って{TARGET}を作れ','runs':parts}
        layout['numberFrame']={'bounds':[130,1070,950,1248],'displayStart':0,'displayEnd':2}
    elif kind=='comment':
        label(im,'答えは固定コメントへ',CONFIG.get('commentCaptionY',575) if COMMENT_WRONG else 665,48 if COMMENT_WRONG else 54,MINT)
        layout['commentPrompt']={'bounds':layout['答えは固定コメントへ'],'displayStart':PLAY-COMMENT_HOLD,'displayEnd':PLAY,'sameLastUnfinishedFrame':True}
    elif kind=='plain':
        pass
    elif kind in ['complete','timeout','hold']:
        if MODERN and kind=='hold':label(im,'次は自分でつなごう',650,54,MINT)

        if kind=='timeout':label(im,'時間切れ',800,68,'#fda4af')
    elif MODERN:
        label(im,'今度は自分でつなごう',610,48,MINT)
        label(im,'App Storeで',710,42,WHITE,False)
        label(im,'「ジャマイカの木」を検索',775,52,WHITE)
    else:
        yy,xx=np.mgrid[0:H,0:W];glow=np.exp(-((xx-540)**2/(650**2)+(yy-850)**2/(850**2)))
        pixels=np.zeros((H,W,3),dtype=np.uint8)
        for channel,base in enumerate([23,24,34]):pixels[:,:,channel]=base+glow*[4,8,17][channel]
        im=Image.fromarray(pixels).convert('RGBA')
        if FAIL or COMMENT:label(im,'みんなは解けた？',350,68,MINT)
        im.alpha_composite(icon(280,60),(400,485))
        art=text_art('ジャマイカの木',72);im.alpha_composite(art,((W-art.width)//2,835));layout['ジャマイカの木']=[(W-art.width)//2,835,art.width,art.height]
        art=text_art('あなたもアプリで挑戦' if FAIL or COMMENT else '数字をつなぐ計算パズル',39,MINT,False);im.alpha_composite(art,((W-art.width)//2,965));layout['あなたもアプリで挑戦' if FAIL or COMMENT else '数字をつなぐ計算パズル']=[(W-art.width)//2,965,art.width,art.height]
        ImageDraw.Draw(im).rounded_rectangle((225,1090,855,1210),radius=30,fill='#293f5e',outline='#60a5fa',width=2)
        art=text_art('App Storeで検索',50,WHITE,False);im.alpha_composite(art,((W-art.width)//2,1125));layout['App Storeで検索']=[(W-art.width)//2,1125,art.width,art.height]
    im.save(BUILD/f'{kind}.png')
    if kind in ['plain','timeout']:
        timer_overlay=im.copy();ImageDraw.Draw(timer_overlay).rectangle((665,220,970,345),fill=BG);timer_overlay.save(BUILD/('timer-timeout.png' if kind=='timeout' else 'timer.png'))
Image.new('RGB',(W,H),BG).save(BUILD/'canvas.png')
RESULT=PRESENTATION.get('resultCaption')
if RESULT:
    im=Image.new('RGBA',(W,H));label(im,RESULT['text'],531,32,MINT);im.save(BUILD/'result-caption.png')


# The gameplay viewport excludes native chrome and the development refresh strip.
clips=[];timeline=[];offset=0
for i,(a,b) in enumerate(CUTS):
    kind='hook' if i==0 else 'complete' if i==len(CUTS)-1 else 'plain'
    freeze=FREEZE_LENGTHS.get(i,0)
    frames=round((b-a+freeze)*FPS)
    timing=f"setpts=PTS+if(gte(T\\,{FREEZES[i]-a+1/FPS-1e-6:.9f})\\,{freeze}/TB\\,0),fps=30," if freeze else ''
    clip=BUILD/f'cut-{i}.mp4';clips.append(clip)
    pad_seconds=(HOLD if i==len(CUTS)-1 else 0)+freeze+.1
    crop=GAME_CROP
    game_x,game_y=110,GAME_Y
    if (FAIL or COMMENT_WRONG) and i in CONFIG.get('fullFrameCuts',[]):
        crop='crop=1206:2130:0:420,scale=760:1342:flags=lanczos,setsar=1';game_x=160
    if FAIL and i in CONFIG.get('resultCuts',[]):crop='crop=1206:2130:0:180,scale=860:1518:flags=lanczos,setsar=1'
    if FAIL and i in CONFIG.get('timeoutCuts',[]):kind='timeout'
    timer=FAIL and i in CONFIG.get('timerCuts',[])
    timer_filter=f'[timerin]fps=30,setpts=PTS-STARTPTS,trim=duration={b-a},crop=260:185:335:205,scale=180:128,{timing}tpad=stop_mode=clone:stop_duration={pad_seconds}[nativetimer];[timerbase][nativetimer]overlay=720:215:shortest=1,format=yuv420p[v]' if timer else ''
    graph=f'[0:v]'+('split=2[mainin][timerin];[mainin]' if timer else '')+f'fps=30,setpts=PTS-STARTPTS,trim=duration={b-a},{crop},{timing}tpad=stop_mode=clone:stop_duration={pad_seconds}[game];[1:v][game]overlay={game_x}:{game_y}:shortest=1[base];[base][2:v]overlay=0:0'+('[timerbase];'+timer_filter if timer else ',format=yuv420p[v]')
    run(['-loglevel','warning','-ss',a,'-i',SRC,'-loop',1,'-framerate',FPS,'-i',BUILD/'canvas.png','-loop',1,'-framerate',FPS,'-i',BUILD/(('timer-timeout.png' if kind=='timeout' else 'timer.png') if timer else f'{kind}.png'),
         '-filter_complex',graph,'-map','[v]','-frames:v',frames,'-r',FPS,'-fps_mode','cfr','-an','-c:v','libx264','-preset','fast','-crf',18,clip],f'cut-{i}.log')
    timeline.append({'sourceStart':a,'sourceEnd':b,'outputStart':round(offset,3),'caption':kind,'speed':1,'operatorFreezeSource':FREEZES.get(i),'operatorFreezeSeconds':freeze,'viewportStyle':'result' if FAIL and i in CONFIG.get('resultCuts',[]) else 'full' if (FAIL or COMMENT_WRONG) and i in CONFIG.get('fullFrameCuts',[]) else 'standard','nativeTimerShown':timer})
    offset+=b-a+freeze
    print(f'Full-screen cut {i+1} rendered',flush=True)

# Same complete screen after the last merge, held while showing the search copy.
closing_time=CONFIG['commentStillTime'] if COMMENT else PRESENTATION.get('ctaStillTime',CONFIG['questionStillTime'] if FAIL else CONFIG['cleanCompletedTime'])
complete=Image.new('RGB',(W,H),BG)
if MODERN:
    # Closing composition only: one contiguous native tree crop, no redrawn nodes.
    # Keep all leaves and roots; omit the now-unused controls to separate the copy.
    run(['-loglevel','error','-ss',closing_time,'-i',SRC,'-frames:v',1,'-vf','crop=1206:280:0:420,scale=860:200:flags=lanczos',BUILD/'closing-goal.png'])
    tree_height=940 if FAIL else 1000
    scaled_tree_height=round(tree_height*860/1206)
    run(['-loglevel','error','-ss',closing_time,'-i',SRC,'-frames:v',1,'-vf',f'crop=1206:{tree_height}:0:1000,scale=860:{scaled_tree_height}:flags=lanczos',BUILD/'closing-tree.png'])
    complete.paste(Image.open(BUILD/'closing-goal.png'),(110,350))
    complete.paste(Image.open(BUILD/'closing-tree.png'),(110,800))
    layout['closingViewport']={'sourceTreeCrop':[0,1000,1206,tree_height],'treePlacement':[110,800,860,scaled_tree_height],'goalPlacement':[110,350,860,200],'controlsOmitted':True,'nativeTreeContinuous':True}
else:
    closing_crop=GAME_CROP;closing_x=110
    if COMMENT_WRONG and len(CUTS)-1 in CONFIG.get('fullFrameCuts',[]):
        closing_crop='crop=1206:2130:0:420,scale=760:1342:flags=lanczos,setsar=1';closing_x=160
        layout['commentClosingViewport']={'sourceCrop':[0,420,1206,2130],'placement':[160,350,760,1342],'sameAsLastGameplayCut':True}
    run(['-loglevel','error','-ss',closing_time,'-i',SRC,'-frames:v',1,'-vf',closing_crop,BUILD/'complete-game.png'])
    complete.paste(Image.open(BUILD/'complete-game.png'),(closing_x,GAME_Y))
complete.save(BUILD/'complete-app.png')
for name,seconds in ([('hold',HOLD)] if HOLD else [])+([('comment',COMMENT_HOLD)] if COMMENT else [])+[('cta',END)]:
    clip=BUILD/f'{name}.mp4';clips.append(clip)
    overlay='comment' if name=='comment' else ('hold' if MODERN else 'complete') if name=='hold' else 'cta'
    run(['-loglevel','warning','-loop',1,'-framerate',FPS,'-i',BUILD/'complete-app.png','-loop',1,'-framerate',FPS,'-i',BUILD/f'{overlay}.png',
         '-filter_complex','[0:v][1:v]overlay=0:0,format=yuv420p[v]','-map','[v]','-frames:v',round(seconds*FPS),'-r',FPS,'-fps_mode','cfr','-an',
         '-c:v','libx264','-preset','fast','-crf',18,clip],f'{name}.log')
listing=BUILD/'concat.txt';listing.write_text(''.join(f"file '{p}'\n"for p in clips))
run(['-loglevel','warning','-f','concat','-safe',0,'-i',listing,'-c','copy',BUILD/'silent.mp4'])

# Audio composition is the same original score and app effects as v2.
exec(Path(__file__).with_name('audio.py').read_text())
extra_input=['-loop',1,'-framerate',FPS,'-i',BUILD/'result-caption.png'] if RESULT else []
extra_filter=['-filter_complex',f"[0:v][2:v]overlay=0:0:enable='between(t,{RESULT['start']},{RESULT['end']-1/FPS})'[captioned]"] if RESULT else []
video_stream='[captioned]' if RESULT else '0:v'

run(['-loglevel','warning','-i',BUILD/'silent.mp4','-i',BUILD/'mix.wav',*extra_input,*extra_filter,'-map',video_stream,'-map','1:a',
     '-t',DURATION,'-c:v','libx264','-preset','fast','-b:v','3M','-minrate','3M','-maxrate','3M','-bufsize','6M','-x264-params','nal-hrd=cbr:filler=1','-profile:v','high','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-af','loudnorm=I=-17:TP=-1.5:LRA=7','-c:a','aac','-ar',48000,'-ac',2,'-b:a','192k',
     '-movflags','+faststart',DEST],'encode.log')
run(['-v','error','-i',DEST,'-f','null','-'],'decode.log')
run(['-i',DEST,'-af','loudnorm=I=-17:TP=-1.5:LRA=7:print_format=json','-vn','-f','null','-'],'loudness.log')
sheet=Image.new('RGB',(1800,1340),BG);d=ImageDraw.Draw(sheet)
sample_times=[0,1.9,3.5,5.5,7.7,10.5,PLAY-2.5,PLAY-.4,PLAY+.5,DURATION-.1] if FAIL else [0,2.4,3.6,4.9,6.3,8.8,11.4,PLAY-1.3,PLAY+.2,DURATION-.2]
if COMMENT:
    prompt_start=PLAY-COMMENT_HOLD
    sample_times=[0,INTRO-.1,*np.linspace(INTRO,prompt_start-.1,4),prompt_start+.2,PLAY-.3,PLAY+.3,DURATION-.1]
for i,t in enumerate(sample_times):
    raw=run(['-loglevel','error','-ss',t,'-i',DEST,'-frames:v',1,'-f','image2pipe','-vcodec','png','-'])
    im=Image.open(io.BytesIO(raw)).convert('RGB');small=im.resize((360,640),Image.Resampling.LANCZOS)
    if i in [0,7,8]:
        im.save(OUT/(['poster.png','timeout.png','ending.png'] if FAIL else ['poster.png','comment-prompt.png' if COMMENT else 'completed-tree.png','ending.png'])[[0,7,8].index(i)])
        small.save(QA/f'mobile-{i}.png')
    x=i%5*360;y=i//5*670;sheet.paste(small,(x,y+25));d.text((x+8,y+7),f'{t:.2f}s',fill='white')
sheet.save(QA/'contact-sheet.jpg',quality=94)
reader=imageio_ffmpeg.read_frames(str(DEST));meta=next(reader);count=0;blue_banner_max=0
for frame in reader:
    count+=1
    top=np.frombuffer(frame,dtype=np.uint8).reshape(H,W,3)[:128,98:982]
    blue_banner_max=max(blue_banner_max,float(((top[:,:,2]>140)&(top[:,:,1]>80)&(top[:,:,0]<80)).mean()))
assert blue_banner_max<.02, 'Developer refresh banner detected'

assert count==round(DURATION*FPS)
audio=json.loads(re.findall(r'\{\s*"input_i".*?\}',(QA/'loudness.log').read_text(),re.S)[-1])
(OUT/'timeline.json').write_text(json.dumps({'segments':timeline,'variant':CONFIG['variant'],'answerHold':HOLD,**({'commentHold':COMMENT_HOLD,'commentStart':PLAY-COMMENT_HOLD,'commentResult':CONFIG.get('commentResult','preview')} if COMMENT else {}),'presentation':PRESENTATION,'ctaStart':PLAY,'duration':DURATION,'effects':events},ensure_ascii=False,indent=2)+'\n')
(OUT/'layout.json').write_text(json.dumps({'appSourceBounds':[0,0,1206,2622],'fit':('Reviewed native target row and continuous native tree/operator crops at a common scale' if COMMENT_WRONG and CONFIG.get('nativeViewport') else 'Gameplay retains native target and continuous tree-controls; closing retains native goal and separate continuous tree crop without controls' if MODERN else 'Native target and continuous tree-controls region retained; only blank strip y700-1000 removed; no custom playback target'),'captionBounds':layout},ensure_ascii=False,indent=2)+'\n')
(QA/'validation.json').write_text(json.dumps({'decode':'passed','resolution':meta['size'],'duration':meta['duration'],'fps':meta['fps'],'frames':count,
    'sourceSha256':hashlib.sha256(RAW.read_bytes()).hexdigest(),'sha256':hashlib.sha256(DEST.read_bytes()).hexdigest(),
    'integratedLUFS':float(audio['input_i']),'truePeakDBTP':float(audio['input_tp']),
    'appFrameUncropped':False,'nativeStatsOmitted':True,'nativeTargetRetained':True,'customPlaybackTarget':False,'variant':CONFIG['variant'],'endCardStart':PLAY,'endCardOpaque':not MODERN,'presentation':PRESENTATION,'cropping':True,'developerBannerPixelFractionMax':blue_banner_max,'visualReview':'pending','published':False},ensure_ascii=False,indent=2)+'\n')
(OUT/'post-copy.txt').write_text(f"5つの数字で{TARGET}を{'作れる？' if FAIL else '作れ！'}\n5つの数をすべて1回ずつ使う計算パズル\n難易度 {'★'*LEVEL}{'☆'*(5-LEVEL)}\n"+('みんなは解けた？\n' if FAIL else '')+'ジャマイカの木\nApp Storeで検索\n#ジャマイカの木 #算数パズル #脳トレ\n')
if MODERN:
    title=f'5つの数字で{TARGET}を'+('作れる？' if FAIL else '作れ！')
    (OUT/'post-copy.txt').write_text(title+'｜ジャマイカの木\n\n5つの数字を全部1回ずつ使う計算パズル。\n'+('あなたならどうつなぐ？\n' if FAIL else '次は自分でつないでみよう。\n')+'App Storeで「ジャマイカの木」を検索\n#ジャマイカの木 #算数パズル #脳トレ\n')
if COMMENT:
    (OUT/'fixed-comment.txt').write_text(fixed_comment_text(CONFIG))
    (OUT/'post-copy.txt').write_text(f'5つの数字で{TARGET}を作れる？｜ジャマイカの木\n\n5つの数字を全部1回ずつ使う計算パズル。\n答えは固定コメントへ。\nApp Storeで「ジャマイカの木」を検索\n#ジャマイカの木 #算数パズル #脳トレ\n')
print(DEST,flush=True)
