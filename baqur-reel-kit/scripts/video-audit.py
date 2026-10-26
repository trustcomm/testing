#!/usr/bin/env python3
"""Audit of the ENCODED video: every frame decoded at 270x480 gray; flags
 - brightness jumps: the mean level changes by more than 4 grey levels from one frame to the next (a flash / a pop of the whole picture);
 - stalls: a frame exactly identical to the previous one (a dropped or doubled frame; the camera drift keeps the picture alive, so none are expected);
 - spikes: a frame-to-frame step more than 2.5x the median of the steps around it, away from the PUNCH cues and the hit cues (a pop).
usage: python3 scripts/video-audit.py out/agent-lied.mp4 agent-lied"""
import json, subprocess, sys
import numpy as np
src = sys.argv[1]; reel = sys.argv[2] if len(sys.argv) > 2 else "agent-lied"
t = json.load(open(f"src/reels/{reel}/timeline.json"))
W, H = 270, 480
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-an", "-vf", f"scale={W}:{H}:flags=area,format=gray", "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
prev = None; d = []; lvl = []
while True:
    buf = p.stdout.read(W * H)
    if len(buf) < W * H: break
    fr = np.frombuffer(buf, dtype=np.uint8).astype(np.int16)
    lvl.append(fr.mean()); d.append(0.0 if prev is None else float(np.abs(fr - prev).mean())); prev = fr
d = np.array(d); lvl = np.array(lvl); n = len(d)
print(f"{n} frames decoded ({n / 60:.2f} s; expected {round(t['duration'] * 60)})")
hits = [round(c["t"] * 60) for k, c in t["cues"].items() if any(s in ("hit", "deny", "sub", "stamp", "whoosh") for s in c["sfx"])]
near = np.zeros(n, bool)
for h in hits: near[max(0, h - 30):h + 24] = True       # whooshes start 30 frames before their cue (the camera flight), hits kick the camera
jumps = [(i, round(float(lvl[i] - lvl[i - 1]), 1)) for i in range(1, n) if abs(lvl[i] - lvl[i - 1]) > 4 and not near[i]]
stalls = [i for i in range(1, n) if d[i] == 0.0]   # exactly identical at 270x480; the camera drift moves a still picture by ~0.1 px per frame, which the downscale can hide, so only exact zeros count
spikes = []
for i in range(3, n - 3):
    nb = np.concatenate([d[max(1, i - 8):i - 1], d[i + 2:i + 9]]); base = np.median(nb) if len(nb) else 0
    if d[i] > 2.5 * base + 0.6 and d[i] > 1.0 and not near[i]: spikes.append((i, round(float(d[i]), 2), round(float(base), 2)))
print(f"frame-to-frame mean difference: median {np.median(d):.2f}, p99 {np.percentile(d, 99):.2f}, max {d.max():.2f} at frame {int(d.argmax())}")
print(f"brightness jumps > 4 grey levels outside the hit/flight windows: {len(jumps)} {jumps[:8]}")
print(f"stalled (identical) frames: {len(stalls)} {stalls[:8]}")
print(f"spikes outside the hit/flight windows: {len(spikes)} {spikes[:8]}")
ok = not jumps and not stalls and not spikes
print("PASS" if ok else "REVIEW: look at the frames listed")
sys.exit(0 if ok else 1)
