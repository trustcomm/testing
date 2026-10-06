#!/usr/bin/env python3
"""PLACEHOLDER sound effects for timing previews only, until the user's X01–X14 land in sfx/.

Usage: python3 -I scripts/sfx_placeholders.py
Writes sfx/placeholder/PH-X01.wav … PH-X14.wav (44.1 kHz mono, peak −3 dBFS) and anchors.json.
`anchor` is the moment in each file that lines up with its visual event (an impact, a whoosh's peak).
Code-synthesised with numpy (deterministic seed). Not for the final mix; verify_inputs.py ignores this folder.
"""
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "sfx", "placeholder")
os.makedirs(OUT, exist_ok=True)
SR = 44100
rng = np.random.default_rng(20261006)
T = lambda s: np.arange(int(s * SR)) / SR
def env(n, a, d):
    x = np.arange(n) / SR
    return np.where(x < a, x / max(a, 1e-6), np.exp(-6 * (x - a) / d))
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))
def noise(s):
    return rng.standard_normal(int(s * SR))

def thud(s=0.35, f=55):
    t = T(s); return np.sin(2 * np.pi * f * t * (1 - 0.3 * t)) * env(len(t), 0.003, 0.25) + 0.5 * bp(noise(s), 200, 3000) * env(len(t), 0.001, 0.05)

S = {}
S["X01"] = (thud(0.4), 0.0)                                                    # ledger slam
t = T(0.45); S["X02"] = (bp(noise(0.45), 1500, 6000) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 38 * t))) * env(len(t), 0.01, 0.4), 0.0)  # printer zip
t = T(0.32); S["X03"] = (np.sin(2 * np.pi * np.where(np.sin(2 * np.pi * 20 * t) > 0, 1400, 1700) * t) * env(len(t), 0.003, 0.3) * (t < 0.26), 0.0)  # ring burst
t = T(0.4); S["X04"] = (bp(noise(0.4), 2000, 7000) * np.abs(np.sin(2 * np.pi * 9 * t)) * env(len(t), 0.01, 0.4), 0.0)  # scribble
t = T(0.3); g = noise(0.3); g = np.round(g * 3) / 3; S["X05"] = (bp(g, 300, 8000) * (np.sin(2 * np.pi * 33 * t) > -0.2) * env(len(t), 0.002, 0.3), 0.0)  # glitch
t = T(2.2); rise = bp(noise(2.2), 400, 9000) * (t / 1.8) ** 3 * (t < 1.8)
S["X06"] = (rise * 0.6 + np.concatenate([np.zeros(int(1.8 * SR)), thud(0.4, 45)])[:len(t)] * 1.2, 1.8)  # riser into impact
t = T(0.42); w = bp(noise(0.42), 300, 5000) * np.exp(-((t - 0.21) / 0.08) ** 2); S["X07"] = (w, 0.21)  # whoosh, peak at 0.21
t = T(0.08); S["X08"] = (np.sin(2 * np.pi * (700 + 900 * t / 0.08) * t) * env(len(t), 0.002, 0.07), 0.0)  # pop
t = T(0.03); S["X09"] = (np.sin(2 * np.pi * 3200 * t) * env(len(t), 0.0005, 0.02), 0.0)  # tick
t = T(0.7); S["X10"] = (sum(a * np.sin(2 * np.pi * 2300 * r * t) for r, a in ((1, 1), (1.52, .6), (2.31, .4), (3.1, .25))) * env(len(t), 0.002, 0.6), 0.0)  # coin
t = T(0.45); sw = bp(noise(0.45), 800, 6000) * np.exp(-((t - 0.12) / 0.06) ** 2)
blip = lambda at: np.sin(2 * np.pi * 1900 * t) * ((t > at) & (t < at + 0.04))
S["X11"] = (sw + 0.6 * blip(0.28) + 0.6 * blip(0.36), 0.28)                     # message sent + double tick (anchor: first tick)
S["X12"] = (thud(0.3, 70) * 1.2, 0.0)                                           # stamp
t = T(3.6); shimmer = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate((2093, 2637, 3136, 4186))) * 0.15 * np.exp(-t / 1.4)
S["X13"] = (np.concatenate([thud(0.6, 40), np.zeros(int(3.0 * SR))])[:len(t)] * 1.3 + shimmer, 0.0)  # final impact + shimmer
t = T(0.65); cr = bp(noise(0.65), 1000, 9000) * (rng.random(len(t)) < 0.08) * 4; S["X14"] = (cr * env(len(t), 0.02, 0.6), 0.0)  # crumple

anchors = {}
for k, (x, a) in S.items():
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-3 / 20)
    p = os.path.join(OUT, f"PH-{k}.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s16le", p],
                   input=x.astype(np.float32).tobytes(), check=True)
    anchors[k] = {"file": f"sfx/placeholder/PH-{k}.wav", "anchor": a, "duration": round(len(x) / SR, 3)}
json.dump(anchors, open(os.path.join(OUT, "anchors.json"), "w"), indent=1)
print("wrote", len(anchors), "placeholder SFX to sfx/placeholder/")
