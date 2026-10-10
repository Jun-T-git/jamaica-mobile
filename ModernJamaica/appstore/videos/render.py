#!/usr/bin/env python3
"""Rebuild three store videos from original simulator captures. Requires Pillow + ffmpeg."""
import os
from pathlib import Path
import shutil
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
FFMPEG = os.environ.get('FFMPEG') or shutil.which('ffmpeg')
if not FFMPEG:
    raise SystemExit('Set FFMPEG to an ffmpeg executable.')
FONT = os.environ.get('JAPANESE_FONT', '/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc')
BG = '#1A1B23'
WHITE = '#F9FAFB'
MUTED = '#CBD5E1'
BLUE = '#60A5FA'
MINT = '#6EE7B7'
GOLD = '#FDE047'
ORANGE = '#FB923C'
for folder in ('posters', 'qa', 'build'):
    (ROOT / folder).mkdir(exist_ok=True)


def run(args):
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)], check=True)


def font(size):
    return ImageFont.truetype(FONT, size)


def text(draw, xy, value, size, fill=WHITE, anchor=None):
    draw.text(xy, value, font=font(size), fill=fill, anchor=anchor, spacing=int(size * .24))


def caption(value, path, y=1360):
    img = Image.new('RGBA', (886, 1920))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((45, y, 841, y+102), radius=30, fill=(36,37,48,245), outline=(96,165,250,100), width=2)
    text(d, (443, y+50), value, 38, anchor='mm')
    img.save(path)


def captured_clip(source, start, end, name, copy=None, y=1360, hold=0):
    dst = ROOT / 'build' / f'{name}.mp4'
    args = ['-ss', start, '-t', end-start, '-i', ROOT/'source'/source]
    vf = 'setpts=PTS-STARTPTS,fps=30,scale=886:1920:flags=lanczos,setsar=1'
    if hold:
        vf += f',tpad=stop_mode=clone:stop_duration={hold}'
    if copy:
        png = ROOT/'build'/f'{name}.png'
        caption(copy, png, y)
        args += ['-i', png, '-filter_complex', f'[0:v]{vf}[v];[v][1:v]overlay=0:0:format=auto,format=yuv420p[out]', '-map', '[out]']
    else:
        args += ['-vf', vf]
    run([*args, '-t', end-start+hold, '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', dst])
    return dst


def concat(clips, output, preview=False):
    listing = ROOT/'build'/f'{output.stem}.txt'
    listing.write_text(''.join(f"file '{p.as_posix()}'\n" for p in clips))
    encode = ['-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-r', '30']
    if preview:
        encode += ['-profile:v', 'high', '-level:v', '4.0', '-b:v', '11M', '-minrate', '10M', '-maxrate', '12M', '-bufsize', '22M', '-x264-params', 'nal-hrd=cbr:filler=1']
    else:
        encode += ['-crf', '17']
    inputs = ['-f', 'concat', '-safe', '0', '-i', listing]
    audio = ['-an']
    if preview:
        inputs += ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000']
        audio = ['-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '256k', '-shortest']
    run([*inputs, *encode, *audio, '-movflags', '+faststart', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', output])


def make_preview():
    cuts = [(1,4.5,'5つの数字を、ぜんぶ使う。'),
            (6.5,11.8,'数字 → 記号 → 数字をタップ。'),
            (13.5,16.5,'計算結果を、次の枝に。'),
            (19,21.5,'もう一方の枝を育てて…'),
            (23,24.6,'ぴったり14。ひらめきがつながる。')]
    core = [captured_clip('core.mov', a,b,f'core-{i}',copy,hold=1.4 if i==4 else 0) for i,(a,b,copy) in enumerate(cuts)]
    concat(core, ROOT/'build'/'gameplay.mp4')
    modes = [captured_clip('modes.mov',18,21,'modes','じっくり練習。時間に挑戦。',1530),
             captured_clip('modes.mov',21.5,25.5,'difficulty','自分に合う、3つの難易度。')]
    concat(core+modes, ROOT/'03-app-preview-ja.mp4', preview=True)
    # Search footage has no added copy; its copy is placed outside the real UI.
    clean = [captured_clip('core.mov',a,b,f'clean-{i}',hold=1.4 if i==4 else 0) for i,(a,b,_) in enumerate(cuts)]
    concat(clean, ROOT/'build'/'gameplay-clean.mp4')


def smooth(value):
    value = max(0, min(1, value))
    return value*value*(3-2*value)


def brand(draw, x,y, size):
    text(draw,(x,y),'ジャマイカの木',size)
    text(draw,(x,y+size*1.55),'数字をつなげる計算パズル',round(size*.5),MUTED)


def make_header():
    w,h = 3840,1646
    base = Image.new('RGB',(w,h),BG)
    d = ImageDraw.Draw(base)
    # One focal idea, spacious typography and an original graphic of the real solution.
    d.rounded_rectangle((155,205,690,285),40,fill='#242530')
    text(d,(423,245),'5つの数字 × ＋−×÷',40,MINT,'mm')
    text(d,(155,380),'ひらめきが、',172)
    text(d,(155,605),'木になる。',196)
    text(d,(165,940),'5つの数字で、14をつくろう。',63,MUTED)
    brand(d,165,1225,65)
    # Keep the goal prominent before any branches grow, separate from the result node.
    d.rounded_rectangle((2395,70,3175,240),radius=42,fill='#242530',outline=BLUE,width=3)
    text(d,(2605,155),'つくる数',62,MUTED,'mm')
    text(d,(2980,155),'14',126,BLUE,'mm')
    # Coordinates use the same tree topology and operator colors as the captured game.
    nodes = {'a':(2110,1240,'2'), 'b':(2410,1240,'1'), 'c':(2710,1240,'3'),
             'd':(3010,1240,'4'), 'e':(3310,1240,'3'),
             'f':(2410,960,'1'), 'g':(2410,680,'2'), 'h':(3160,960,'7'), 'i':(2785,400,'14')}
    steps = [(2.0,'f','c','a',ORANGE,'3 − 2 = 1'),(4.0,'g','f','b',MINT,'1 ＋ 1 = 2'),
             (6.0,'h','d','e',MINT,'4 ＋ 3 = 7'),(8.0,'i','g','h',GOLD,'2 × 7 = 14')]
    def node(layer,key,color=BLUE,alpha=1):
        x,y,label=nodes[key]
        ld=ImageDraw.Draw(layer)
        r=83 if key!='i' else 105
        ld.ellipse((x-r,y-r,x+r,y+r),fill='#242530',outline=color,width=6)
        text(ld,(x,y),label,76 if key!='i' else 98,WHITE,'mm')
        operations={'f':'−','g':'＋','h':'＋','i':'×'}
        if key in operations:
            ld.ellipse((x+49,y-97,x+109,y-37),fill=color)
            text(ld,(x+79,y-67),operations[key],38,BG,'mm')
    base.save(ROOT/'build'/'header-base.png')
    process=subprocess.Popen([FFMPEG,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/'01-product-header-ja.mp4')],stdin=subprocess.PIPE)
    for frame in range(360):
        t=frame/30
        img=base.copy()
        tree=Image.new('RGBA',(w,h))
        td=ImageDraw.Draw(tree)
        # Branches draw at a calm pace; all leaf nodes remain throughout the loop.
        for start,parent,left,right,color,copy in steps:
            p=smooth((t-start)/.8)
            if p<=0: continue
            x,y,_=nodes[parent]
            for child in (left,right):
                cx,cy,_=nodes[child]
                td.line((cx,cy,cx+(x-cx)*p,cy+(y-cy)*p),fill=color,width=9)
        for key in ('a','b','c','d','e'): node(tree,key)
        for start,parent,left,right,color,copy in steps:
            if t>start+.6: node(tree,parent,color)
        # Fade only the tree growth back to the original five leaves at the seam.
        if t>10.2:
            growth_alpha=1-smooth((t-10.2)/1.4)
            leaves=Image.new('RGBA',(w,h))
            for key in ('a','b','c','d','e'): node(leaves,key)
            tree=Image.blend(leaves,tree,growth_alpha)
        img.paste(tree,(0,0),tree)
        draw=ImageDraw.Draw(img)
        text(draw,(2785,1455),'5つの数字を、ぜんぶ使って。',48,MUTED,'mm')
        if frame==0: img.save(ROOT/'posters'/'01-product-header-first.png')
        if frame==285: img.save(ROOT/'posters'/'01-product-header-ja.png')
        process.stdin.write(img.tobytes())
    process.stdin.close()
    if process.wait(): raise RuntimeError('Header encoding failed')


def make_search():
    w,h=1920,1280
    img=Image.new('RGB',(w,h),BG)
    d=ImageDraw.Draw(img)
    d.rounded_rectangle((100,105,660,171),33,fill='#242530')
    text(d,(380,138),'5つの数字と ＋−×÷',31,MINT,'mm')
    text(d,(100,275),'この数字で、',89)
    text(d,(100,405),'14をつくれる？',89)
    text(d,(105,620),'数字をタップ。式の木が育つ。',38,MUTED)
    text(d,(105,745),'2    1    3    4    3',66,BLUE)
    brand(d,105,1010,48)
    # Real UI footage is deliberately large enough to inspect; status bar and timer are cropped.
    d.rounded_rectangle((1085,72,1825,1208),radius=48,fill='#242530',outline='#3C4054',width=3)
    img.save(ROOT/'build'/'search-base.png')
    # 17.3 s of gameplay, editorially shortened to 11 s. One-second return dissolve.
    run(['-i',ROOT/'build'/'gameplay-clean.mp4','-filter_complex',
         '[0:v]crop=886:1420:0:250,setpts=PTS*11/17.3,fps=30,scale=680:1090,setsar=1[v]',
         '-map','[v]','-an','-c:v','libx264','-preset','fast','-crf','17',ROOT/'build'/'search-action.mp4'])
    run(['-ss','0','-i',ROOT/'build'/'search-action.mp4','-frames:v','1',ROOT/'build'/'search-first.png'])
    run(['-loop','1','-i',ROOT/'build'/'search-base.png','-i',ROOT/'build'/'search-action.mp4',
         '-loop','1','-i',ROOT/'build'/'search-first.png','-filter_complex',
         '[1:v]tpad=stop_mode=clone:stop_duration=1.2,setpts=PTS-STARTPTS[a];'
         '[2:v]format=yuva420p,fade=t=in:st=10.8:d=1.0:alpha=1[b];'
         '[a][b]overlay=0:0:format=auto[c];[0:v][c]overlay=1115:95:shortest=1,format=yuv420p[out]',
         '-map','[out]','-t','12','-r','30','-an','-c:v','libx264','-preset','fast','-crf','17',
         '-movflags','+faststart',ROOT/'02-search-results-ja.mp4'])


def posters_and_qa():
    for name,poster in [('01-product-header-ja',9.5),('02-search-results-ja',10),('03-app-preview-ja',16.6)]:
        run(['-ss',poster,'-i',ROOT/f'{name}.mp4','-frames:v','1',ROOT/'posters'/f'{name}.png'])
        run(['-i',ROOT/f'{name}.mp4','-vf','fps=1/3,scale=384:-1,tile=4x3','-frames:v','1',ROOT/'qa'/f'{name}-sheet.jpg'])
        run(['-i',ROOT/f'{name}.mp4','-f','null','-'])


if __name__=='__main__':
    make_preview()
    print('App Preview rendered',flush=True)
    make_header()
    print('Header rendered',flush=True)
    make_search()
    posters_and_qa()
    print('All videos rendered and decoded successfully',flush=True)
