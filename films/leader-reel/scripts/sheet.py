#!/usr/bin/env python3
"""Contact sheet: sheet.py OUT.jpg COLS SCALE frame1.png frame2.png ... (labels from the t*.png names)."""
import os, sys
from PIL import Image, ImageDraw

out, cols, scale = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
files = sys.argv[4:]
ims = [Image.open(f).convert("RGB") for f in files]
w, h = int(ims[0].width * scale), int(ims[0].height * scale)
rows = (len(ims) + cols - 1) // cols
pad, lab = 6, 22
S = Image.new("RGB", (cols * (w + pad) + pad, rows * (h + pad + lab) + pad), (24, 24, 28))
d = ImageDraw.Draw(S)
for i, (im, f) in enumerate(zip(ims, files)):
    x = pad + (i % cols) * (w + pad)
    y = pad + (i // cols) * (h + pad + lab)
    d.text((x + 2, y + 4), os.path.basename(f).replace(".png", ""), fill=(255, 200, 120))
    S.paste(im.resize((w, h), Image.LANCZOS), (x, y + lab))
S.save(out, quality=88)
print("sheet", out, S.size)
