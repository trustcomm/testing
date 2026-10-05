"""mix.py <events.json> <out.wav>: the film's sound (style frames, animatic).

events.json = {
  "dur": s,
  "vo": "vo/VO6.mp3"                       (one line at t = 0)   or
  "vos": [{"file": "vo/VO1.mp3", "t": s}, ...]   (every line at its beat's start),
  "events": [{"t": s, "sfx": "SFX03", "gain": dB, "rate": 1.0, "align": "onset"|"peak", "loop": s}, ...],
  "pulse": [{"t0": s, "t1": s, "style": "sparse"|"low"|"full"|"lift"|"thin"|"peak", "stop": s?}, ...]   (optional)
}
- VO at its own level. Each SFX file (sfx/SFXnn.*, the user's accepted picks) is peak-normalised to the VO peak,
  then `gain` dB; its ONSET (first sample within 30 dB of its peak) — or its PEAK with align "peak" (risers) — is
  placed on the event time, so the sound hits the frame. `loop` tiles a loop (SFX11 ambience) to that length.
- "HEART" and "BURST" are code-synthesised PLACEHOLDERS (music pulse stand-in; the wordless angry burst, which has no
  SFX in BRIEF §6). "pulse" is a code-synthesised PLACEHOLDER music bed on the 124 BPM grid — it is replaced by the
  licensed / generated track.
- Loudness: gain to -14 LUFS, 4x-oversampled soft limiter at -2 dBFS (true peak stays under -1 dBTP after AAC).
Prints a JSON report of where every event landed.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
BEAT = 60 / 124


def load(p, rate=1.0):
    af = ["-af", f"asetrate={int(SR * rate)},aresample={SR}"] if rate != 1.0 else []
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), *af, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def heart():
    t = np.arange(int(0.22 * SR)) / SR
    f = 48 + 40 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18) * np.minimum(1, t / 0.003)


def burst():
    """A wordless, angry vocal-ish burst: buzzy sawtooth with a falling pitch and formant-ish band, 0.6 s."""
    rng = np.random.default_rng(7)
    t = np.arange(int(0.6 * SR)) / SR
    f0 = 260 - 90 * t / 0.6 + 12 * np.sin(2 * np.pi * 7 * t)
    ph = np.cumsum(f0) / SR
    saw = 2 * (ph % 1) - 1
    x = saw + 0.15 * rng.standard_normal(len(t))
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    X *= np.exp(-((fr - 900) / 700) ** 2) + 0.5 * np.exp(-((fr - 2400) / 600) ** 2)
    x = np.fft.irfft(X, len(x))
    return x * np.minimum(1, t / 0.03) * np.minimum(1, (0.6 - t) / 0.12)


def kick():
    t = np.arange(int(0.25 * SR)) / SR
    return np.sin(2 * np.pi * np.cumsum(50 + 90 * np.exp(-t * 35)) / SR) * np.exp(-t * 14)


def hat(rng):
    x = rng.standard_normal(int(0.05 * SR))
    x = np.diff(x, prepend=0)
    return x * env(len(x), 0.001, 0.012) * 0.35


def clap(rng):
    x = rng.standard_normal(int(0.18 * SR))
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    X *= np.exp(-((fr - 1500) / 900) ** 2)
    return np.fft.irfft(X, len(x)) * env(len(x), 0.002, 0.05) * 1.6


def pulse_bed(segs, n):
    """Placeholder bed on the 124 BPM grid; styles per section (BRIEF §6 structure)."""
    rng = np.random.default_rng(124)
    out = np.zeros(n)
    K, H, C = kick(), hat(rng), clap(rng)

    def put(x, t, g):
        i = int(round(t * SR))
        if 0 <= i < n:
            m = min(len(x), n - i)
            out[i:i + m] += x[:m] * g

    for s in segs:
        k = int(np.ceil(s["t0"] / BEAT - 1e-9))
        while k * BEAT < s["t1"] - 1e-9:
            t, bar = k * BEAT, k % 4
            if s.get("stop") is not None and t >= s["stop"] - 1e-9:
                break
            st = s["style"]
            if st == "sparse":
                put(H, t, 0.5)
            elif st == "low":
                if k % 2 == 0:
                    put(K, t, 0.35)
            elif st == "thin":
                put(K, t, 0.4)
            else:
                g = {"full": 0.8, "lift": 0.9, "peak": 1.0}[st]
                put(K, t, g)
                put(H, t + BEAT / 2, 0.8 * g)
                if bar in (1, 3):
                    put(C, t, 0.55 * g)
                if st in ("lift", "peak"):
                    put(H, t + BEAT / 4, 0.45 * g)
                    put(H, t + 3 * BEAT / 4, 0.45 * g)
            k += 1
    return out


def onset(x):
    pk = np.abs(x).max()
    i = np.flatnonzero(np.abs(x) >= pk * 10 ** (-30 / 20))
    return int(i[0]) if len(i) else 0


def measure(x):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", "ebur128=peak=true", "-f", "null", "-"], input=x.tobytes(), capture_output=True).stderr.decode()
    s = e[e.rfind("Summary:"):]
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1)), float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))


def limit(x, ceil_db=-2.0):
    """Soft limiter, 4x oversampled so inter-sample peaks are caught: tanh knee above the ceiling."""
    up = resample_poly(x, 4, 1)
    c = 10 ** (ceil_db / 20)
    k = 0.7 * c
    a = np.abs(up)
    y = np.where(a <= k, up, np.sign(up) * (k + (c - k) * np.tanh((a - k) / (c - k))))
    return resample_poly(y, 1, 4)


ev = json.loads(Path(sys.argv[1]).read_text())
n = int(round(ev["dur"] * SR))
mix = np.zeros(n)
vos = ev.get("vos") or [{"file": ev["vo"], "t": 0}]
ref = 0.0
for v in vos:
    x = load(ROOT / v["file"])
    ref = max(ref, np.abs(x).max())
    i = int(round(v["t"] * SR))
    m = min(len(x), n - i)
    if m > 0:
        mix[i:i + m] += x[:m]
report = []
for e in ev["events"]:
    if e["sfx"] in ("HEART", "BURST"):
        x, src = (heart() if e["sfx"] == "HEART" else burst()), "synth placeholder"
    else:
        src = next((p for p in sorted((ROOT / "sfx").glob(f"{e['sfx']}.*"))), None)
        x = load(src, e.get("rate", 1.0))
        src = str(src.relative_to(ROOT))
    if e.get("loop"):
        reps = int(np.ceil(e["loop"] * SR / len(x)))
        x = np.tile(x, reps)[: int(e["loop"] * SR)]
        fade = int(0.4 * SR)
        x[-fade:] *= np.linspace(1, 0, fade)
    x = x / max(np.abs(x).max(), 1e-9) * ref * 10 ** (e["gain"] / 20)
    o = int(np.argmax(np.abs(x))) if e.get("align") == "peak" else (0 if e.get("loop") else onset(x))
    at = int(round(e["t"] * SR)) - o
    a, b = max(0, at), min(n, at + len(x))
    if b > a:
        mix[a:b] += x[a - at : b - at]
    report.append({**e, "src": src, "alignedOn": "peak" if e.get("align") == "peak" else "onset", "placedAt": round((at + o) / SR, 4)})
if ev.get("pulse"):
    bed = pulse_bed(ev["pulse"], n)
    mix += bed / max(np.abs(bed).max(), 1e-9) * ref * 10 ** (-14 / 20)

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
