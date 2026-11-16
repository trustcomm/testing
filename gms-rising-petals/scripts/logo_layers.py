"""Split the client's logo into layers for animation (all 1000x1000, same registration as logo_badge.png):
logo_rings.png (the two rings), logo_gms.png (the ribbon GMS mark), logo_text.png (RISING PETALS + tagline + rules).
White is keyed out of the inner layers so they sit on a disc drawn in code."""
import numpy as np
from PIL import Image
b = np.asarray(Image.open('assets/images/cut/logo_badge.png')).astype(np.float32)
yy, xx = np.mgrid[0:1000, 0:1000]; rr = np.hypot(xx - 499.5, yy - 499.5)
rgb, A = b[..., :3], b[..., 3]
mn = rgb.min(-1); wa = np.clip((250 - mn) / 70, 0, 1)            # 0 on white, 1 on ink
def save(mask, name, keyw=True):
    a = A / 255 * mask * (wa if keyw else 1)
    # un-blend the white so edges don't halo: c = (c - (1-a)*255)/a
    c = np.where(a[..., None] > 0.02, (rgb - (1 - wa[..., None]) * 255) / np.maximum(wa[..., None], 0.02), rgb) if keyw else rgb
    out = np.dstack([np.clip(c, 0, 255), a * 255]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(f'assets/images/cut/{name}.png', optimize=True); print(name)
save((rr >= 436).astype(np.float32), 'logo_rings')
save(((rr < 436) & (yy < 562)).astype(np.float32), 'logo_gms')
save(((rr < 436) & (yy >= 562)).astype(np.float32), 'logo_text')
