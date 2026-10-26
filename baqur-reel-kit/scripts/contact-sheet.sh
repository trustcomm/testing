#!/usr/bin/env bash
# Renders key frames (one per cue) at low res into out/contact-sheet.png for a fast visual QA.
# Usage: bash scripts/contact-sheet.sh PasteLeak paste-leak [extra remotion flags]
set -e
COMP=${1:-PasteLeak}; REEL=${2:-paste-leak}; shift 2 || true
mkdir -p out/sheet
FRAMES=$(node -e "const t=require('./src/reels/$REEL/timeline.json');const ks=Object.keys(t.cues).filter((k,i)=>i%3===0);console.log(ks.map(k=>Math.round(t.cues[k].t*60)+12).join(' '))")
for f in $FRAMES; do npx remotion still $COMP out/sheet/$f.png --frame=$f --scale=0.3 --log=error "$@"; done
python3 - <<'PY'
from PIL import Image, ImageDraw
import glob, os
fs=sorted(glob.glob('out/sheet/*.png'), key=lambda p:int(os.path.basename(p)[:-4]))
ims=[Image.open(f) for f in fs]; w,h=ims[0].size; cols=8; rows=(len(ims)+cols-1)//cols
g=Image.new('RGB',(w*cols,h*rows),'#111')
for i,(im,f) in enumerate(zip(ims,fs)):
    x,y=(i%cols)*w,(i//cols)*h; g.paste(im,(x,y)); ImageDraw.Draw(g).text((x+6,y+h-16),os.path.basename(f)[:-4],fill='#FFB340')
g.save('out/contact-sheet.png'); print('out/contact-sheet.png', len(ims),'frames')
PY
