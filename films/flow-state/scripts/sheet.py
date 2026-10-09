#!/usr/bin/env python3
"""Contact sheet from rendered PNG frames (build/<dir>/fNNNN.png), labelled with frame and time.

Usage: python3 -I scripts/sheet.py <frames-dir> <out.jpg> [--cols 6] [--width 300]
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

args = sys.argv[1:]
src, out = args[0], args[1]
cols = int(args[args.index("--cols") + 1]) if "--cols" in args else 6
tw = int(args[args.index("--width") + 1]) if "--width" in args else 300
files = sorted(f for f in os.listdir(src) if f.startswith("f") and f.endswith(".png"))
th = tw * 16 // 9
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * (th + 26)), (12, 12, 12))
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 16)
except OSError:
    font = ImageFont.load_default()
d = ImageDraw.Draw(sheet)
for i, name in enumerate(files):
    f = int(name[1:5])
    im = Image.open(os.path.join(src, name)).convert("RGB").resize((tw, th), Image.LANCZOS)
    x, y = (i % cols) * tw, (i // cols) * (th + 26)
    sheet.paste(im, (x, y))
    d.text((x + 6, y + th + 4), f"f{f}  {f / 60:.2f}s", fill=(220, 220, 220), font=font)
sheet.save(out, quality=90)
print(out, sheet.size)
