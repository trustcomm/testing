"""Reversed wordmark for the charcoal ground, derived from brand/logo.png (no redrawing).
Charcoal letter pixels ("Go", "Level") -> off-white #F5F3EF; orange pixels ("Dev") kept; alpha kept.
Cropped to the letters' bounding box (alpha > 8) with no padding. Writes assets/logo-reversed.png + JSON metrics."""
import json, sys
from PIL import Image
import numpy as np

src = Image.open("../brand/logo.png").convert("RGBA")
a = np.array(src).astype(np.int32)
alpha = a[..., 3]
ys, xs = np.where(alpha > 8)
x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
a = a[y0:y1, x0:x1]
r, g, b = a[..., 0], a[..., 1], a[..., 2]
orange = (r - g) > 60  # orange letters are strongly red-dominant; charcoal is near-neutral
out = a.copy()
out[~orange, 0], out[~orange, 1], out[~orange, 2] = 0xF5, 0xF3, 0xEF
Image.fromarray(out.astype(np.uint8), "RGBA").save("assets/logo-reversed.png")
# Column extents of "Level" (the last dark run of letters) for the bar.
dark_cols = np.where(((alpha[y0:y1, x0:x1] > 8) & ~orange).any(axis=0))[0]
org_cols = np.where(((alpha[y0:y1, x0:x1] > 8) & orange).any(axis=0))[0]
level_start = int(dark_cols[dark_cols > org_cols.max()].min())
m = {"w": int(x1 - x0), "h": int(y1 - y0), "crop": [int(x0), int(y0), int(x1), int(y1)], "dev": [int(org_cols.min()), int(org_cols.max() + 1)], "level": [level_start, int(x1 - x0)]}
json.dump(m, open("assets/logo-reversed.json", "w"), indent=1)
print(m)
