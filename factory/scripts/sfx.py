#!/usr/bin/env python3
"""PLACEHOLDER audio generator (procedural, royalty-free).

Writes, only if the file does not already exist (drop your own files at the same paths to replace):
  public/sfx/tick.wav   counter tick
  public/sfx/swipe.wav  saffron wipe whoosh
  public/sfx/hit.wav    verdict hit
  public/sfx/logo.wav   outro sting
  public/music/bed.wav  quiet, neutral bed (no melody), 90 s, loops cleanly

Usage: python3 scripts/sfx.py [--force]
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORCE = "--force" in sys.argv
rng = np.random.default_rng(1207)


def t_(d):
    return np.arange(int(SR * d)) / SR


def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output="sos"), x)


def fade(x, a=0.004, r=0.02):
    n = len(x)
    e = np.ones(n)
    na, nr = int(SR * a), int(SR * r)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] = np.linspace(1, 0, nr)
    return x * e


def norm(x, peak):
    return x / (np.abs(x).max() + 1e-12) * peak


def tick():
    t = t_(0.045)
    y = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 180) + 0.4 * filt(rng.standard_normal(len(t)), "band", [3000, 7000]) * np.exp(-t * 400)
    return norm(fade(y, 0.0005, 0.01), 0.7)


def swipe():
    d = 0.5
    t = t_(d)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(n)
    seg = 480
    for i in range(0, len(n), seg):
        p = i / len(n)
        fc = 400 * (4000 / 400) ** (np.sin(np.pi * min(1, p / 0.55) / 2) if p < 0.55 else 1 - (p - 0.55) / 0.45 * 0.5)
        blk = filt(n[max(0, i - 2000): i + seg], "band", [fc * 0.6, min(fc * 1.6, 20000)])
        out[i: i + seg] = blk[-len(n[i: i + seg]):]
    env = np.where(t < 0.55 * d, (t / (0.55 * d)) ** 2, np.exp(-(t - 0.55 * d) * 10))
    return norm(fade(out * env), 0.8)


def hit():
    d = 1.6
    t = t_(d)
    f = 42 + 70 * np.exp(-t * 14)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.8)
    body = filt(rng.standard_normal(len(t)), "low", 900) * np.exp(-t * 18) * 0.5
    return norm(fade(sub + body, 0.001, 0.2), 0.85)


def logo():
    d = 1.8
    t = t_(d)
    y = np.zeros_like(t)
    for k, (f, g) in enumerate([(587.33, 1.0), (880.0, 0.7), (1174.66, 0.45)]):  # D5 A5 D6, soft bell
        s = int(SR * 0.07 * k)
        tt = t[: len(t) - s]
        y[s:] += g * (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 6)) * np.exp(-tt * 2.6)
    return norm(fade(y, 0.002, 0.3), 0.75)


def bed(length=90.0):
    """Neutral bed: low filtered noise + a soft, static two-note drone. No melody, no rhythm."""
    t = t_(length)
    drone = np.sin(2 * np.pi * 73.42 * t) * 0.5 + np.sin(2 * np.pi * 110.0 * t) * 0.35 + np.sin(2 * np.pi * 146.83 * t) * 0.15
    drone *= 0.85 + 0.15 * np.sin(2 * np.pi * t / 15.0)  # slow breathe, period divides 90 s → loops cleanly
    air = filt(rng.standard_normal(len(t)), "band", [200, 1800]) * 0.08
    y = filt(drone, "low", 900) + air
    xf = int(SR * 2.0)  # crossfade tail into head for a seamless loop
    y[:xf] = y[:xf] * np.linspace(0, 1, xf) + y[-xf:] * np.linspace(1, 0, xf)
    return norm(y[:-xf], 0.5)


def write(rel, x):
    path = os.path.join(ROOT, rel)
    if os.path.exists(path) and not FORCE:
        print(f"keep  {rel} (exists; use --force to regenerate)")
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    wavfile.write(path, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
    print(f"wrote {rel} ({len(x) / SR:.2f} s) PLACEHOLDER")


write("public/sfx/tick.wav", tick())
write("public/sfx/swipe.wav", swipe())
write("public/sfx/hit.wav", hit())
write("public/sfx/logo.wav", logo())
write("public/music/bed.wav", bed())
