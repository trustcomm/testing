#!/usr/bin/env python3
"""contact-sheet.py OUT.png img1.png img2.png … → 3-column sheet at 640×360 per tile, labelled."""
import os, sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
cols, w, h = 3, 640, 360
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w + (cols + 1) * 8, rows * (h + 30) + 8), "#888888")
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    x = 8 + (i % cols) * (w + 8); y = 8 + (i // cols) * (h + 30)
    sheet.paste(Image.open(f).convert("RGB").resize((w, h)), (x, y + 22))
    d.text((x, y + 4), os.path.basename(f), fill="black")
sheet.save(out)
print(f"contact sheet {out}: {len(files)} tiles")
