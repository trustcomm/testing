"""synth_sfx.py: code-synthesised fallbacks for SFX01–SFX12 (BRIEF §6). numpy only, deterministic.

Writes sfx/synth/SFXnn_synth.wav (48 kHz, 24-bit mono; SFX11 stereo), peak-normalised to -3 dBFS.
These are fallbacks for the ElevenLabs takes in sfx/takes/; nothing here is free-tier or third-party audio.
"""
import subprocess
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / "sfx" / "synth"
rng = np.random.default_rng(20261005)


def t(sec):
    return np.arange(int(sec * SR)) / SR


def env(n, a, d, curve=6.0):
    """Attack a s (linear), then exponential decay over d s."""
    x = np.arange(n) / SR
    return np.where(x < a, x / max(a, 1e-6), np.exp(-curve * (x - a) / d))


def noise(sec):
    return rng.standard_normal(int(sec * SR))


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def sweep(f0, f1, sec, shape="exp"):
    tt = t(sec)
    f = f0 * (f1 / f0) ** (tt / sec) if shape == "exp" else f0 + (f1 - f0) * tt / sec
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def pad(x, sec):
    return np.concatenate([x, np.zeros(max(0, int(sec * SR) - len(x)))])


def mix(*parts):
    n = max(len(p) for p in parts)
    return sum(pad(p, n / SR) for p in parts)


def at(x, sec, total):
    out = np.zeros(int(total * SR))
    i = int(sec * SR)
    out[i : i + len(x)] += x[: len(out) - i]
    return out


def bell(f, sec, partials=((1, 1), (2.76, 0.5), (5.4, 0.25), (8.9, 0.12))):
    tt = t(sec)
    return sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * (3 + 2 * k)) for k, a in partials)


def tap():  # SFX01
    n = noise(0.08) * env(int(0.08 * SR), 0.001, 0.02, 8)
    return mix(bandpass(n, 1500, 7000), 0.6 * sweep(2200, 1400, 0.05) * env(int(0.05 * SR), 0.001, 0.03))


def scan():  # SFX02
    beep = sweep(1200, 2400, 0.18) * env(int(0.18 * SR), 0.005, 0.5, 2)
    return mix(beep * 0.6, at(tap() * 0.8, 0.2, 0.4))


def stamp():  # SFX03
    thump = np.sin(2 * np.pi * np.cumsum(90 * np.exp(-t(0.25) * 20) + 60) / SR) * env(int(0.25 * SR), 0.001, 0.12)
    slap = bandpass(noise(0.06), 400, 4000) * env(int(0.06 * SR), 0.0005, 0.02, 8)
    return mix(thump, slap * 0.8)


def whoosh():  # SFX04 (left to right handled in the mix by panning)
    n = noise(0.45)
    tt = t(0.45)
    out = np.zeros_like(n)
    for i, c in enumerate(np.linspace(600, 4000, 9)):
        seg = slice(i * len(n) // 9, (i + 1) * len(n) // 9)
        out[seg] = bandpass(n, c * 0.6, c * 1.6)[seg]
    return out * np.sin(np.pi * tt / 0.45) ** 2


def printer():  # SFX05
    tt = t(0.5)
    buzz = np.sign(np.sin(2 * np.pi * 180 * tt)) * 0.3 + bandpass(noise(0.5), 2000, 6000) * 0.5
    return buzz * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * tt)) * np.clip(np.minimum(tt / 0.02, (0.5 - tt) / 0.05), 0, 1)


def door():  # SFX06
    return mix(bell(1318, 1.6), at(bell(1568, 1.4) * 0.7, 0.09, 1.6))


def pop():  # SFX07
    return sweep(500, 1400, 0.15) * env(int(0.15 * SR), 0.002, 0.12, 4)


def ping():  # SFX08
    return mix(bell(988, 1.0, ((1, 1), (2, 0.15))), at(bell(1480, 0.9, ((1, 1), (2, 0.1))) * 0.8, 0.11, 1.0))


def riser_hit():  # SFX09
    tt = t(1.2)
    rise = bandpass(noise(1.2), 300, 8000) * (tt / 1.2) ** 3 * 0.5 + sweep(200, 1600, 1.2) * (tt / 1.2) ** 2 * 0.3
    boom = np.sin(2 * np.pi * np.cumsum(45 + 80 * np.exp(-t(0.9) * 25)) / SR) * env(int(0.9 * SR), 0.001, 0.6, 4)
    return mix(rise, at(mix(boom, stamp() * 0.6), 1.2, 2.1))


def final_hit():  # SFX10
    boom = np.sin(2 * np.pi * np.cumsum(40 + 90 * np.exp(-t(1.5) * 20) ) / SR) * env(int(1.5 * SR), 0.001, 1.0, 4)
    shimmer = sum(bell(f, 2.5, ((1, 1),)) * 0.25 for f in (2093, 2637, 3136, 4186))
    sparkle = bandpass(noise(2.5), 6000, 14000) * np.exp(-t(2.5) * 1.8) * 0.15
    return mix(boom, stamp() * 0.5, shimmer, sparkle)


def cafe():  # SFX11, 6 s loopable stereo
    L, R = [], []
    for _ in range(2):
        murmur = bandpass(noise(6), 200, 2500) * (0.5 + 0.5 * bandpass(noise(6), 0.1, 3) / 3)
        x = murmur * 0.25
        for s in rng.uniform(0, 5.8, 14):  # cutlery clinks
            x += at(bell(rng.uniform(2500, 5200), 0.25, ((1, 1), (2.4, 0.4))) * rng.uniform(0.15, 0.35), s, 6)
        (L if not L else R).append(x)
    st = np.stack([L[0], R[0]], 1)
    fade = int(0.5 * SR)  # cross-fade the tail into the head so it loops
    w = np.linspace(0, 1, fade)[:, None]
    st[:fade] = st[:fade] * w + st[-fade:] * (1 - w)
    return st[:-fade]


def paper():  # SFX12
    n = bandpass(noise(0.35), 1500, 9000)
    crinkle = (rng.random(len(n)) < 0.02) * 3.0
    return (n * 0.4 + bandpass(crinkle * noise(0.35), 2000, 10000)) * env(len(n), 0.01, 0.3, 3)


SFX = {1: tap, 2: scan, 3: stamp, 4: whoosh, 5: printer, 6: door, 7: pop, 8: ping, 9: riser_hit, 10: final_hit, 11: cafe, 12: paper}
OUT.mkdir(parents=True, exist_ok=True)
for k, fn in SFX.items():
    x = np.asarray(fn(), dtype=np.float64)
    x *= 10 ** (-3 / 20) / max(np.abs(x).max(), 1e-9)
    ch = 2 if x.ndim == 2 else 1
    p = OUT / f"SFX{k:02d}_synth.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", str(ch), "-i", "-", "-c:a", "pcm_s24le", str(p)],
                   input=x.astype(np.float32).tobytes(), check=True)
    print(f"{p.name}  {len(x) / SR:.2f} s")
