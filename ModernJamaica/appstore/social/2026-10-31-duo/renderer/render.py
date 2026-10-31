#!/usr/bin/env python3
"""Render ready recordings only Never uploads or publishes anything."""
from pathlib import Path
import argparse,json,subprocess,sys
from problem import load_problem

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--problem',type=Path,action='append',help='Problem config Repeat to export several')
    ap.add_argument('--manifest',type=Path,help='Batch manifest Ready entries only')
    ap.add_argument('--output-root',type=Path,default=Path(__file__).parent/'exports')
    ap.add_argument('--check',action='store_true',help='Validate source identity arithmetic and timing without rendering')
    args=ap.parse_args()
    paths=[p.resolve() for p in (args.problem or [])]
    if args.manifest:
        manifest=args.manifest.resolve()
        for item in json.loads(manifest.read_text())['items']:
            if item['status']=='ready':paths.append((manifest.parent/item['config']).resolve())
            else:print(f"SKIP {item['episode']} {item['variant']} — {item['status']}")
    if not paths:ap.error('Pass --problem or --manifest with ready entries')
    # Validate the entire batch first Avoid partial output on a mismatched source
    jobs=[];seen=set()
    for path in dict.fromkeys(paths):
        config=load_problem(path);key=(config['id'],config['variant'])
        if key in seen:raise ValueError(f'Duplicate output identity {key}')
        seen.add(key);jobs.append((path,config))
        print(f"READY {config['id']} {config['variant']} target={config['target']} numbers={config['numbers']}",flush=True)
    if args.check:return
    for path,config in jobs:
        output=args.output_root.resolve()/config['id']/config['variant']
        subprocess.run([sys.executable,str(Path(__file__).with_name('render_one.py')),'--problem',str(path),'--output',str(output)],check=True)
if __name__=='__main__':main()
