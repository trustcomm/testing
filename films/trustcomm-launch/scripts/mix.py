"""mix.py <events.json> <out.wav>: sound for a rendered beat (style frames / animatic).

events.json = {"dur": s, "vo": "vo/VO6.mp3", "events": [{"t": s, "sfx": "SFX03", "gain": dB, "rate": 1.0}, ...]}
- VO starts at t = 0 at its own level.
- Each SFX file (sfx/SFXnn.*, the user's accepted picks) is peak-normalised to the VO's peak, then `gain` dB applied;
  its ONSET (first sample within 30 dB of its peak) is placed on the event time, so the sound hits the frame.
- "HEART" is a code-synthesised low double-thump: a placeholder for the music's pulse until the track exists.
- Loudness: gain to -14 LUFS, 4x-oversampled soft limiter at -2 dBFS (true peak stays under -1 dBTP after AAC).
"""
import json
import subprocess
import sys
from pathlib import Path

import re

import numpy as np
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
SR = 48000


def load(p, rate=1.0):
    af = ["-af", f"asetrate={int(SR * rate)},aresample={SR}"] if rate != 1.0 else []
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), *af, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def heart():
    t = np.arange(int(0.22 * SR)) / SR
    f = 48 + 40 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18) * np.minimum(1, t / 0.003)


def onset(x):
    pk = np.abs(x).max()
    i = np.flatnonzero(np.abs(x) >= pk * 10 ** (-30 / 20))
    return int(i[0]) if len(i) else 0


ev = json.loads(Path(sys.argv[1]).read_text())
n = int(round(ev["dur"] * SR))
vo = load(ROOT / ev["vo"])
ref = np.abs(vo).max()
mix = np.zeros(n)
mix[: min(n, len(vo))] += vo[:n]
report = []
for e in ev["events"]:
    if e["sfx"] == "HEART":
        x, src = heart(), "synth placeholder"
    else:
        src = next((p for p in (ROOT / "sfx").glob(f"{e['sfx']}.*")), None)
        x = load(src, e.get("rate", 1.0))
        src = str(src.relative_to(ROOT))
    x = x / max(np.abs(x).max(), 1e-9) * ref * 10 ** (e["gain"] / 20)
    o = onset(x)
    at = int(round(e["t"] * SR)) - o
    a, b = max(0, at), min(n, at + len(x))
    if b > a:
        mix[a:b] += x[a - at : b - at]
    report.append({**e, "src": src, "onsetInFile": round(o / SR, 4), "placedAt": round((at + o) / SR, 4)})
def measure(x):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", "ebur128=peak=true", "-f", "null", "-"], input=x.tobytes(), capture_output=True).stderr.decode()
    s = e[e.rfind("Summary:"):]
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1)), float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))


def limit(x, ceil_db=-2.0):
    """Soft limiter, 4× oversampled so inter-sample peaks are caught: tanh knee above the ceiling."""
    up = resample_poly(x, 4, 1)
    c = 10 ** (ceil_db / 20)
    k = 0.7 * c
    a = np.abs(up)
    y = np.where(a <= k, up, np.sign(up) * (k + (c - k) * np.tanh((a - k) / (c - k))))
    return resample_poly(y, 1, 4)


# Loudness to -14 LUFS with true peak under -1.5 dBTP (the AAC encode adds a little): gain, limit, re-measure.
TARGET = -14.0
g = 0.0
for _ in range(6):
    out = limit(mix * 10 ** (g / 20))
    I, tp = measure(out)
    if abs(I - TARGET) < 0.2:
        break
    g += TARGET - I
print(json.dumps({"loudness": {"I": I, "TP": tp, "gainDb": round(g, 2)}}), file=sys.stderr)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s24le", sys.argv[2]], input=out.tobytes(), check=True)
print(json.dumps(report))
