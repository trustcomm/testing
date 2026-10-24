#!/usr/bin/env python3
"""Motion audit on the ENCODED video: decode every frame (270x480 gray), measure the mean absolute difference between neighbours, and flag
 - spikes: a frame step that is much larger than the steps around it (a pop / a dropped or doubled frame / a flicker);
 - stalls: a frame identical to its predecessor in the middle of a camera move (a doubled frame);
 - brightness jumps: the mean level changes by more than 4 grey levels from one frame to the next (a flash).
usage: python3 scripts/video-audit.py out/alarm5.mp4      (needs public/timeline.json for the camera moves)"""
import json, subprocess, sys
import numpy as np

src = sys.argv[1] if len(sys.argv) > 1 else "out/alarm5.mp4"
t = json.load(open("public/timeline.json"))
W, H = 270, 480
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-an", "-vf", f"scale={W}:{H}:flags=area,format=gray", "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
prev = None; d = []; lvl = []
n = 0
while True:
    buf = p.stdout.read(W * H)
    if len(buf) < W * H: break
    fr = np.frombuffer(buf, dtype=np.uint8).astype(np.int16)
    lvl.append(fr.mean())
    d.append(0.0 if prev is None else float(np.abs(fr - prev).mean()))
    prev = fr; n += 1
d = np.array(d); lvl = np.array(lvl)
print(f"{n} frames decoded (expected {t['meta']['totalFrames']})")
moving = np.zeros(n, bool)
for a, b in t["camera"]["travels"]: moving[a:b + 1] = True
punch = np.zeros(n, bool)
for f in t["camera"]["punches"]: punch[f:f + 20] = True
spikes = []
for i in range(3, n - 3):
    nb = np.concatenate([d[max(1, i - 8):i - 1], d[i + 2:i + 9]])
    base = np.median(nb) if len(nb) else 0
    if d[i] > 2.5 * base + 0.6 and d[i] > 1.0 and not punch[i]: spikes.append((i, d[i], base))
for i in range(1, n):
    if moving[i] and moving[i - 1] and d[i] < 0.02: spikes.append((i, d[i], -1))
jumps = [(i, lvl[i] - lvl[i - 1]) for i in range(1, n) if abs(lvl[i] - lvl[i - 1]) > 4 and not punch[i]]
spikes.sort(key=lambda s: -s[1])
print(f"frame-to-frame mean difference: median {np.median(d):.2f}, p99 {np.percentile(d, 99):.2f}, max {d.max():.2f} at frame {int(d.argmax())}")
print(f"spikes (step > 2.5x its neighbours' median, outside the punches) and stalls (identical frames inside a camera move): {len(spikes)}")
for i, v, base in spikes[:25]:
    sc = [s["id"] for s in t["scenes"] if s["start"] <= i][-1]
    print(f"  frame {i:5} {sc:4} step {v:6.2f}  neighbours {base:6.2f}" if base >= 0 else f"  frame {i:5} {sc:4} STALL (step {v:.3f}) inside a camera move")
print(f"brightness jumps > 4 grey levels: {len(jumps)}  {jumps[:10]}")
ok = len(spikes) == 0 and len(jumps) == 0
print("PASS" if ok else "REVIEW: look at the frames listed")
sys.exit(0 if ok else 1)
