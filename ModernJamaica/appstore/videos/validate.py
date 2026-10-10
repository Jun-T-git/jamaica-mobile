#!/usr/bin/env python3
"""Decode deliverables, check Apple dimensions/rate/duration, and measure loop seams."""
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parent
FF = os.environ.get('FFMPEG') or shutil.which('ffmpeg')
if not FF:
    raise SystemExit('Set FFMPEG')
results = []
for name,width,height,duration in [('01-product-header-ja',3840,1646,12),('02-search-results-ja',1920,1280,12),('03-app-preview-ja',886,1920,24.3)]:
    path=ROOT/f'{name}.mp4'
    p=subprocess.run([FF,'-hide_banner','-i',str(path),'-map','0:v:0','-progress','pipe:1','-f','null','-'],capture_output=True,text=True,check=True)
    stream=next(line for line in p.stderr.splitlines() if 'Stream #0:0' in line)
    assert f'{width}x{height}' in stream and 'h264 (High)' in stream and 'yuv420p' in stream and '30 fps' in stream,stream
    hh,mm,ss=re.search(r'Duration: (\d+):(\d+):([\d.]+)',p.stderr).groups()
    seconds=int(hh)*3600+int(mm)*60+float(ss)
    assert abs(seconds-duration)<.1
    assert path.stat().st_size<500_000_000
    frame_count=int(re.findall(r'^frame=(\d+)',p.stdout,re.M)[-1])
    assert frame_count==round(duration*30),(name,frame_count)
    result={'file':path.name,'width':width,'height':height,'seconds':seconds,'fps':30,'frames_decoded':frame_count,'bytes':path.stat().st_size,'codec':'H.264 High','pixel_format':'yuv420p','audio':'none','decode':'passed'}
    if name.startswith(('01','02')):
        for label,t in [('first',0),('last',seconds-1/30)]:
            subprocess.run([FF,'-hide_banner','-loglevel','error','-y','-ss',str(t),'-i',str(path),'-frames:v','1','-vf','scale=384:-1',str(ROOT/'qa'/f'{name}-{label}.png')],check=True)
        a=Image.open(ROOT/'qa'/f'{name}-first.png').convert('RGB')
        b=Image.open(ROOT/'qa'/f'{name}-last.png').convert('RGB')
        mae=sum(ImageStat.Stat(ImageChops.difference(a,b)).mean)/3
        result['loop_seam_mean_absolute_error_0_to_255']=round(mae,3)
        assert mae<3,(name,mae)
    else:
        assert 'Audio: aac' in p.stderr and '48000 Hz, stereo' in p.stderr
        result['audio'] = 'AAC stereo 48kHz (silent, 256kbps target)'
        headers=subprocess.run([FF,'-hide_banner','-i',str(path),'-c:v','copy','-bsf:v','trace_headers','-frames:v','1','-f','null','-'],capture_output=True,text=True,check=True)
        assert re.search(r'level_idc.*= 40',headers.stderr)
        result['h264_level']='4.0'
        bitrate=float(re.search(r'bitrate: ([\d.]+) kb/s',p.stderr).group(1))
        assert 10000<=bitrate<=12300,bitrate
        result['container_bitrate_kbps']=bitrate
    results.append(result)
(ROOT/'qa'/'validation.json').write_text(json.dumps({'checked_on':'2026-10-11','results':results,'connect_upload_and_review':'See README.md for live submission status'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(results,ensure_ascii=False,indent=2))
