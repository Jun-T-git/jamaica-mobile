#!/usr/bin/env python3
"""Restore the native static timer label obscured by a development refresh overlay.

Run after the shared renderer. --refresh-input saves a newly rendered unmasked master.
The numeric countdown and gameplay pixels are never composited over.
"""
from pathlib import Path
import argparse,hashlib,json,subprocess,shutil,re
import imageio_ffmpeg
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('--refresh-input',action='store_true');args=p.parse_args()
out=Path(__file__).resolve().parent;week=out.parents[2];ff=imageio_ffmpeg.get_ffmpeg_exe();dest=out/'make-15-a8098f84-fail.mp4';original=out/'build/unmasked-master.mp4';label=out/'build/native-timer-label.png';temp=out/'build/label-restored.mp4';tl=json.loads((out/'timeline.json').read_text());start=tl['segments'][-2]['outputStart'];end=tl['ctaStart']
def run(a):
 r=subprocess.run([ff,'-hide_banner','-y',*map(str,a)],capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr.decode()[-3000:])
 return r.stderr.decode()
if args.refresh_input or not original.exists():shutil.copy2(dest,original)
run(['-v','error','-ss',3,'-i',week/'build/make-15-a8098f84-cfr.mp4','-frames:v',1,'-vf','crop=260:80:335:205,scale=180:55',label])
run(['-v','error','-i',original,'-loop',1,'-framerate',30,'-i',label,'-filter_complex',f"[0:v][1:v]overlay=720:215:enable='between(t,{start},{end-1/30})':shortest=1[v]",'-map','[v]','-map','0:a','-c:v','libx264','-preset','fast','-b:v','3M','-minrate','3M','-maxrate','3M','-bufsize','6M','-x264-params','nal-hrd=cbr:filler=1','-profile:v','high','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','copy','-t',tl['duration'],'-movflags','+faststart',temp])
shutil.copy2(temp,dest)
run(['-v','error','-i',dest,'-f','null','-'])
report={'operation':'Restore only the native static timer label covered by blue development overlay','sourceLabel':{'normalizedRecording':'build/make-15-a8098f84-cfr.mp4','time':3,'crop':[335,205,260,80],'scale':[180,55]},'placement':[720,215,180,55],'outputInterval':[start,end],'nativeTimerDigitsBelowY':270,'nativeTimerNumbersReplaced':False,'treePixelsCompositedOver':False,'unmaskedSha256':hashlib.sha256(original.read_bytes()).hexdigest(),'finalSha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
(out/'qa/postprocess.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
# Refresh final still artifacts after composition.
for name,t in [('poster',0),('timeout',end-.4),('ending',end+.5)]:run(['-v','error','-ss',t,'-i',dest,'-frames:v',1,out/f'{name}.png'])
val=json.loads((out/'qa/validation.json').read_text());val['sha256']=report['finalSha256'];val['postprocess']=report;val['visualReview']='pending after native-label restoration';(out/'qa/validation.json').write_text(json.dumps(val,ensure_ascii=False,indent=2)+'\n')
print(report['finalSha256'])
