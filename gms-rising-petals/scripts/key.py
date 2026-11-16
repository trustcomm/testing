"""Chroma-key the green-screen images into PNGs with clean alpha and despilled edges.
Background = screen-coloured pixels CONNECTED TO THE IMAGE BORDER (flood fill), so greens inside the subject
(a green toy block, a ring, a book cover) are kept even when they are nearly the screen colour.
usage: python scripts/key.py   (reads assets/images/raw/*.png, writes assets/images/cut/*.png, trimmed to content)"""
import glob, os, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

def cut(f):
    im = np.asarray(Image.open(f).convert('RGB')).astype(np.float32) / 255
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    border = np.concatenate([im[:8].reshape(-1, 3), im[-8:].reshape(-1, 3), im[:, :8].reshape(-1, 3), im[:, -8:].reshape(-1, 3)])
    key = np.median(border, axis=0)
    dist = np.sqrt(((im - key) ** 2).sum(-1))
    # screen-like = close to the key colour, or the same pure green in shadow (red and blue near zero relative to green)
    shade = ((r + b) / np.maximum(g, 1e-3) < 0.10) & (g > 0.2)
    lab, _ = ndimage.label((dist < 0.12) | shade)
    edge_ids = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); edge_ids = edge_ids[edge_ids > 0]
    bg = np.isin(lab, edge_ids)
    # enclosed holes (the gap between two heads) that are exactly the screen colour are background too;
    # subject greens sit further from the key (a toy ring measures ≈0.18), so a tight threshold keeps them
    hl, n = ndimage.label(dist < 0.07)
    if n:
        sizes = ndimage.sum(np.ones_like(dist), hl, index=np.arange(1, n + 1))
        bg |= np.isin(hl, np.arange(1, n + 1)[sizes > 150])
    # soft edge only in a thin band around the background; inside the subject alpha stays 1
    band = ndimage.binary_dilation(bg, iterations=3) & ~bg
    soft = np.clip((dist - 0.12) / 0.30, 0, 1)
    a = np.where(bg, 0.0, np.where(band, soft, 1.0)).astype(np.float32)
    a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255
    a[bg] = 0
    # despill in the band only: the edge loses its green fringe, inner greens keep their colour
    near = ndimage.binary_dilation(bg, iterations=5) & ~bg
    g2 = np.where(near & (g > np.maximum(r, b)), np.maximum(r, b) * 0.98 + g * 0.02, g)
    out = np.dstack([r, g2, b, a])
    ys, xs = np.where(a > 0.02); pad = 6
    y0, x0 = max(0, ys.min() - pad), max(0, xs.min() - pad); y1, x1 = min(a.shape[0], ys.max() + 1 + pad), min(a.shape[1], xs.max() + 1 + pad)
    return Image.fromarray((out[y0:y1, x0:x1] * 255).astype(np.uint8), 'RGBA')

for f in sorted(glob.glob('assets/images/raw/*.png')):
    name = os.path.splitext(os.path.basename(f))[0]; img = cut(f)
    img.save(f'assets/images/cut/{name}.png', optimize=True); print(name, img.size)
