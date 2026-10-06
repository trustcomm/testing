#!/usr/bin/env python3
"""Cut the PROVISIONAL working logo out of the user's header screenshot (brand/source/).

Usage: python3 -I scripts/clean_logo.py
Writes (all transparent PNG, native resolution, no upscaling):
  brand/logo.png            lockup: mark + "EduLedger" + tagline, page background and the site's tile removed
  brand/logo-mark.png       the mark only (artwork; white areas inside it become transparent)
  brand/logo-mark-tile.png  the mark on a clean white rounded tile, as the site shows it (border and shadow dropped)
  brand/logo-wordmark.png   "EduLedger" only, original ink colour (recolour at build time)
  brand/logo-tagline.png    "School management, reimagined" only
  brand/logo-wordmark-on-dark.png  "EduLedger" reversed to white for the navy canvas, PROVISIONAL
  brand/logo-on-dark.png    the lockup reversed for the navy canvas (wordmark white, tagline #C8D0E2), PROVISIONAL
The mark sits on a white tile and the text on the page colour, so each part is keyed against its own
background: a hard key with a 1–2 px soft edge, then the edge colour is un-blended from that background.
Light inks stay fully opaque, so the logo keeps its look on the navy canvas.
"""
import os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SRC = "brand/source/logo-screenshot-from-chat.png"
W, H = map(int, subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", SRC],
                               capture_output=True, text=True, check=True).stdout.strip().split(","))
img = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                                   capture_output=True, check=True).stdout, np.uint8).reshape(H, W, 3).astype(np.float32)

def key(region, bg, lo, hi):
    """alpha from the largest channel distance to bg (lo → 0, hi → 1); colour un-blended from bg."""
    d = np.abs(region - bg).max(2)
    a = np.clip((d - lo) / (hi - lo), 0, 1)
    fg = np.where(a[..., None] > 0, (region - (1 - a[..., None]) * bg) / np.maximum(a[..., None], 1e-3), 0)
    return np.dstack([np.clip(fg, 0, 255), a * 255])

def bbox(rgba, pad=2):
    ys, xs = np.where(rgba[..., 3] > 8)
    h, w = rgba.shape[:2]
    return max(ys.min() - pad, 0), min(ys.max() + pad + 1, h), max(xs.min() - pad, 0), min(xs.max() + pad + 1, w)

def save(rgba, path):
    rgba = np.clip(np.round(rgba), 0, 255).astype(np.uint8)
    h, w = rgba.shape[:2]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{w}x{h}", "-i", "-",
                    "-frames:v", "1", path], input=rgba.tobytes(), check=True)
    print(f"{path}: {w}x{h}")

page = np.median(img[:, W - 15:W - 2].reshape(-1, 3), 0)          # page colour, right margin
# the site tile: find its border (first column / row from the left / top that departs from the page colour)
dpage = np.abs(img - page).max(2)
cols = np.where((dpage > 20).any(0))[0]; rows = np.where((dpage[:, :cols.min() + 260] > 20).any(1))[0]
tx0 = cols.min(); ty0, ty1 = rows.min(), rows.max()
tile_w = ty1 - ty0 + 1                                               # the tile is square
tx1 = tx0 + tile_w - 1
inset = 14                                                           # clear of the 6 px border and its anti-aliasing
mark_src = img[ty0 + inset:ty1 - inset + 1, tx0 + inset:tx1 - inset + 1]
mark = key(mark_src, np.array([255, 255, 255], np.float32), 6, 30)
# the tile has rounded corners, so the inset square still catches the border there: keep only the tile interior
R = 0.22                                                             # corner radius / side, measured by eye
def rounded(side, r):
    yy, xx = np.mgrid[0:side, 0:side] + 0.5
    qx = np.maximum(np.abs(xx - side / 2) - (side / 2 - r), 0); qy = np.maximum(np.abs(yy - side / 2) - (side / 2 - r), 0)
    return np.clip(r - np.hypot(qx, qy) + 0.5, 0, 1)
inner = rounded(mark_src.shape[0], R * tile_w - inset - 4)[:, :mark_src.shape[1]]
mark[..., 3] *= inner
# the border is a pale grey (saturation ~0.05); every ink in the mark is coloured. Drop grey, near-white pixels.
mx, mn = mark_src.max(2), mark_src.min(2)
sat = (mx - mn) / np.maximum(mx, 1)
mark[..., 3] *= np.clip((sat - 0.08) / 0.07, 0, 1) * (mx > 150) + (mx <= 150)
y0, y1, x0, x1 = bbox(mark)
mark = mark[y0:y1, x0:x1]
save(mark, "brand/logo-mark.png")

# clean white rounded tile behind the mark, same proportions as the site's tile
side = tile_w - 12                                                   # inside the dropped border
inside = rounded(side, R * side)
tile = np.dstack([np.full((side, side, 3), 255, np.float32), inside * 255])
oy = (ty0 + inset + y0) - (ty0 + 6); ox = (tx0 + inset + x0) - (tx0 + 6)
m = mark[..., 3:4] / 255
tile[oy:oy + mark.shape[0], ox:ox + mark.shape[1], :3] = mark[..., :3] * m + tile[oy:oy + mark.shape[0], ox:ox + mark.shape[1], :3] * (1 - m)
save(tile, "brand/logo-mark-tile.png")

# text, keyed against the page colour
text = img[:, tx1 + 20:]
textk = key(text, page, 10, 60)
rows_t = np.where((textk[..., 3] > 8).any(1))[0]
gap = np.where(np.diff(rows_t) > 10)[0]                              # blank band between the two lines
split = rows_t[gap[0]] + (rows_t[gap[0] + 1] - rows_t[gap[0]]) // 2
word = textk[:split]; tag = textk[split:]
b = bbox(word); save(word[b[0]:b[1], b[2]:b[3]], "brand/logo-wordmark.png")
wdark = word[b[0]:b[1], b[2]:b[3]].copy(); wdark[..., :3] = 255.0          # reversed for the navy canvas (ours, PROVISIONAL)
save(wdark, "brand/logo-wordmark-on-dark.png")
b = bbox(tag); save(tag[b[0]:b[1], b[2]:b[3]], "brand/logo-tagline.png")

# lockup in the original layout, tile removed
lock = np.zeros((H, W, 4), np.float32)
lock[ty0 + inset + y0:ty0 + inset + y1, tx0 + inset + x0:tx0 + inset + x1] = mark
lock[:, tx1 + 20:] = np.where(textk[..., 3:4] > 0, textk, lock[:, tx1 + 20:])
b = bbox(lock, pad=4)
save(lock[b[0]:b[1], b[2]:b[3]], "brand/logo.png")

# reversed lockup for the navy canvas: same alpha, wordmark white, tagline a light grey-blue
rev = lock.copy()
tx = slice(tx1 + 20, None)
wm = np.zeros((H, W), bool); wm[:split, tx] = True
rev[..., :3] = np.where((wm & (rev[..., 3] > 0))[..., None], 255.0, rev[..., :3])
tg = np.zeros((H, W), bool); tg[split:, tx] = True
rev[..., :3] = np.where((tg & (rev[..., 3] > 0))[..., None], np.array([200, 208, 226], np.float32), rev[..., :3])
save(rev[b[0]:b[1], b[2]:b[3]], "brand/logo-on-dark.png")
