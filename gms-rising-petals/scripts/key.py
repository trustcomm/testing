"""Chroma-key the green-screen character images into PNGs with clean alpha and despilled edges.
usage: python scripts/key.py   (reads assets/images/raw/*.jpg, writes assets/images/cut/*.png, trimmed to content)"""
import glob, os, numpy as np
from PIL import Image, ImageFilter
for f in sorted(glob.glob('assets/images/raw/*.jpg')):
    im = np.asarray(Image.open(f).convert('RGB')).astype(np.float32) / 255
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    # how much greener than the other channels: 0 on the subject, high on the screen
    d = g - np.maximum(r, b)
    a = 1 - np.clip((d - 0.10) / 0.22, 0, 1)
    A = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.9))
    a = np.asarray(A).astype(np.float32) / 255
    # despill: pull green down to the max of red/blue where it exceeds them (removes the green fringe)
    # only near the outline: the green book cover inside the subject must keep its colour
    edge = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(9))).astype(np.float32) / 255 < 0.98
    g2 = np.where(edge & (g > np.maximum(r, b)), np.maximum(r, b) * 0.98 + g * 0.02, g)
    out = np.dstack([r, g2, b, a])
    ys, xs = np.where(a > 0.02); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    pad = 6; y0, x0 = max(0, y0 - pad), max(0, x0 - pad); y1, x1 = min(a.shape[0], y1 + pad), min(a.shape[1], x1 + pad)
    img = Image.fromarray((out[y0:y1, x0:x1] * 255).astype(np.uint8), 'RGBA')
    name = os.path.splitext(os.path.basename(f))[0]
    img.save(f'assets/images/cut/{name}.png', optimize=True); print(name, img.size)
