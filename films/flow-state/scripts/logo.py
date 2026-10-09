#!/usr/bin/env python3
"""Make the on-dark GoDevLevel wordmark: the slate letters ("Go", "Level") become moon white so they read on the
night background; the brand orange "Dev" is kept exactly. Alpha and anti-aliasing are preserved; the canvas is cropped
to the ink with a small margin.  Usage: python3 -I scripts/logo.py <source.png>"""
import os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = Image.open(sys.argv[1]).convert("RGBA")
a = np.asarray(src).astype(np.float64)
rgb, al = a[..., :3], a[..., 3]
orange = np.array([253, 76, 38.0])
moon = np.array([238, 246, 244.0])
# how "orange" each pixel is (0 = slate ink, 1 = brand orange), measured on hue-ish distance
d_or = np.linalg.norm(rgb - orange, axis=-1)
d_sl = np.linalg.norm(rgb - np.array([50, 55, 67.0]), axis=-1)
w = np.clip(d_sl / (d_sl + d_or + 1e-9), 0, 1)
w = np.where(w > 0.5, 1.0, 0.0)  # the two inks never blend in this mark
out_rgb = w[..., None] * orange + (1 - w[..., None]) * moon
out = np.dstack([out_rgb, al]).clip(0, 255).astype(np.uint8)
ys, xs = np.nonzero(al > 8)
m = 12
crop = Image.fromarray(out).crop((max(0, xs.min() - m), max(0, ys.min() - m), xs.max() + m + 1, ys.max() + m + 1))
dst = os.path.join(ROOT, "assets/img/godevlevel-on-dark.png")
crop.save(dst)
print(dst, crop.size)
