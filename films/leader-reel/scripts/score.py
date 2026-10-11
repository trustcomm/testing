#!/usr/bin/env python3
"""Leader — the score, 100 % synthesized (numpy/scipy; no samples, no sound libraries).

A 128 BPM cue in D minor, 8 bars = exactly 15.000 s. Each numeral of the countdown is one bar and adds one layer:
  bar 1 (8 fluid)     drone + water: the impact bloom, bloops on the beats, the vortex riser, the dive
  bar 2 (7 light/3D)  half-time kick, the forge hit, metallic "shing" sweeps, the dissolve sizzle
  bar 3 (6 particles) four-on-the-floor, hats, spark burst, spiral swell, the SNAP, the implosion
  bar 4 (5 glass)     claps + bass + pad, glass bloom, lens swell, the freeze
  bar 5 (4 geometry)  the clack, clicks on 8ths, the lock, 16th hats, the stripe zoom
  bar 6 (3 type)      tape swoop, typewriter 16ths, word stabs, the unspool, the sweep-hand whip
  bar 7 (2 camera)    the 2-pop (1 kHz, one film frame) on SILENCE, then the dive: snare roll + riser to the drop
  bar 8 (lockup)      the DROP in D major, one bell per letter as the letters fill, key clicks, the glint, the tail
Harmony: Dm · Dm · B♭ · Gm · A · Dm · B♭→A · D (the countdown climbs to the dominant and resolves on the lockup).
Event times come from src/cues.js (the same cue sheet the picture reads), so sound and image cannot drift.
Master: −14 LUFS integrated, true peak ≤ −1.5 dBTP (4× oversampled look-ahead limiter), checked with ffmpeg EBU R128.

Usage: python3 -I scripts/score.py → assets/audio/score.wav, build/score-report.json, build/score-spectrogram.png
"""
import json, os, re, subprocess, sys
import numpy as np
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, fftconvolve, istft, resample_poly, sosfilt, sosfiltfilt, stft
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
src = open("src/cues.js").read()
CUES = json.loads(src.split("/* CUES-JSON-BEGIN */")[1].split("/* CUES-JSON-END */")[0].split("=", 1)[1].strip().rstrip(";"))
EV = {e["id"]: e["t"] for e in CUES["events"]}
SR = 48000
DUR = CUES["duration"]
N = int(DUR * SR)
TAIL = 3 * SR
BEAT = CUES["beat"]
BAR = CUES["bar"]
R = np.random.default_rng(20261011)


def hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def T(dur):
    return np.arange(int(round(dur * SR))) / SR


def S(t):
    return int(round(t * SR))


def sos(kind, f, order=2):
    return butter(order, f, kind, fs=SR, output="sos")


def edge(x, a=0.001, r=0.02):
    n = len(x)
    na, nr = min(n, max(2, int(a * SR))), min(n, max(2, int(r * SR)))
    e = np.ones(n)
    e[:na] *= np.sin(np.linspace(0, np.pi / 2, na)) ** 2
    e[n - nr :] *= np.cos(np.linspace(0, np.pi / 2, nr)) ** 2
    return x * (e[:, None] if x.ndim == 2 else e)


def pan2(x, pan):
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], 1)


def norm(x):
    return x / max(1e-12, np.max(np.abs(x)))


def smoothstep(a, b, u):
    v = np.clip((u - a) / (b - a), 0, 1)
    return v * v * (3 - 2 * v)


class Bus:
    def __init__(self):
        self.x = np.zeros((N + TAIL, 2))

    def add(self, sig, t, pan=0.0, gain=1.0):
        if sig.ndim == 1:
            sig = pan2(sig, pan)
        i0 = S(t)
        i1 = i0 + len(sig)
        s0 = max(0, -i0)
        i0, i1 = max(0, i0), min(len(self.x), i1)
        if i1 > i0:
            self.x[i0:i1] += gain * sig[s0 : s0 + i1 - i0]


def make_ir(rt=1.9, length=2.8, pre=0.02, seed=5):
    r = np.random.default_rng(seed)
    n = int(length * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for ch in range(2):
        w = r.standard_normal(n)
        lo = sosfilt(sos("lowpass", 500), w)
        hi = sosfilt(sos("highpass", 4000), w)
        mid = w - lo - hi
        env = lambda k: np.exp(-6.91 * t / (rt * k))
        ir[:, ch] = lo * env(1.1) + mid * env(1.0) + hi * env(0.5)
    ir *= (np.clip(t / 0.05, 0, 1) ** 1.5)[:, None]
    ir = np.vstack([np.zeros((int(pre * SR), 2)), ir])
    ir /= np.sqrt(np.sum(ir**2) / 2)
    return ir


IR = make_ir()
IRM = IR.mean(axis=1)[int(0.02 * SR) :]


def saw(f, t, detune=(0.0,), kmax=40):
    x = np.zeros_like(t)
    f = np.broadcast_to(np.asarray(f, dtype=float), t.shape)
    for d in detune:
        ff = f * 2 ** (d / 1200)
        ph = 2 * np.pi * np.cumsum(ff) / SR
        top = float(ff.max())
        for k in range(1, kmax + 1):
            if top * k > 15000:
                break
            x += np.sin(k * ph + 0.7 * k * (d + 1)) / k
    return x / len(detune)


def shaped_noise(dur, fc_fn, bw_oct, env_fn):
    n = int(dur * SR)
    w = R.standard_normal(n + 2048)
    fr, tt, Z = stft(w, fs=SR, nperseg=1024, noverlap=768)
    fc = np.maximum(30.0, fc_fn(np.clip(tt / dur, 0, 1)))
    lf = np.log2(np.maximum(fr, 1.0))[:, None]
    G = np.exp(-0.5 * ((lf - np.log2(fc)[None, :]) / (bw_oct / 2)) ** 2)
    _, y = istft(Z * G, fs=SR, nperseg=1024, noverlap=768)
    return y[:n] * env_fn(np.arange(n) / n)


# ------------------------------------------------------------------ drums
def kick(dur=0.42, punch=1.0, f_end=46):
    t = T(dur)
    f = f_end + 120 * np.exp(-t / 0.032)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.17)
    x += 0.32 * punch * sosfilt(sos("bandpass", [1600, 6500]), R.standard_normal(len(t))) * np.exp(-t / 0.004)
    x = np.tanh(1.7 * x)
    return edge(norm(x), 0.0005, 0.05)


def clap():
    t = T(0.32)
    n = R.standard_normal(len(t))
    env = np.zeros_like(t)
    for d in (0.0, 0.010, 0.021):
        env += np.where(t >= d, np.exp(-(t - d) / 0.007), 0)
    env += np.where(t >= 0.028, 0.65 * np.exp(-(t - 0.028) / 0.1), 0)
    x = sosfilt(sos("bandpass", [950, 2900]), n) * env
    return edge(norm(x), 0.0005, 0.04)


def snare():
    t = T(0.22)
    tone = np.sin(2 * np.pi * np.cumsum(190 + 60 * np.exp(-t / 0.01)) / SR) * np.exp(-t / 0.05)
    nz = sosfilt(sos("bandpass", [1800, 8000]), R.standard_normal(len(t))) * np.exp(-t / 0.06)
    return edge(norm(0.55 * tone + nz), 0.0004, 0.03)


def hat(open_=False):
    t = T(0.2 if open_ else 0.055)
    x = sosfilt(sos("highpass", 7200), R.standard_normal(len(t))) * np.exp(-t / (0.07 if open_ else 0.012))
    return edge(norm(x), 0.0003, 0.01)


# ------------------------------------------------------------------ tonal
def bass_note(m, dur, bright=640):
    t = T(dur)
    f = hz(m)
    x = 0.8 * np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.4 * saw(f, t, kmax=10)
    x = sosfilt(sos("lowpass", bright), x)
    x *= (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.45)
    return edge(norm(x), 0.002, 0.03)


def pluck(m, dur=0.5, bright=1.0):
    t = T(dur)
    f = hz(m)
    x = np.zeros_like(t)
    for k in range(1, 18):
        if f * k > 14000:
            break
        x += abs(np.sin(k * np.pi * 0.16)) / k**1.05 * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (7 + 2.4 * k**1.3 / bright))
    x *= 1 - np.exp(-t / 0.0007)
    return edge(norm(x), 0.0005, 0.04)


def bell(m, dur=1.6, bright=1.0):
    t = T(dur)
    f = hz(m)
    x = np.zeros_like(t)
    for r, a, d in ((1.0, 1.0, 1.2), (2.756, 0.4 * bright, 0.5), (5.404, 0.18 * bright, 0.25), (8.933, 0.08 * bright, 0.12)):
        if f * r < 17000:
            x += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d)
    x *= 1 - np.exp(-t / 0.001)
    return edge(norm(x), 0.0005, 0.06)


def glass_bell(m, dur=1.4):
    """Glassy FM partials (inharmonic, bright), a long shimmer."""
    t = T(dur)
    f = hz(m)
    mod = np.sin(2 * np.pi * f * 3.51 * t) * 2.2 * np.exp(-t / 0.25)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / 0.7)
    x += 0.35 * np.sin(2 * np.pi * f * 4.07 * t) * np.exp(-t / 0.3)
    x *= 1 - np.exp(-t / 0.0006)
    return edge(norm(x), 0.0004, 0.08)


def pad(notes, dur, bright=1600, attack=0.3):
    t = T(dur)
    x = np.zeros((len(t), 2))
    for m in notes:
        for ch, det in ((0, (-7, 4)), (1, (-3, 8))):
            x[:, ch] += saw(hz(m), t, detune=det, kmax=18)
    for ch in range(2):
        x[:, ch] = sosfilt(sos("lowpass", bright), x[:, ch])
    env = (1 - np.exp(-t / attack)) * np.exp(-t / (dur * 1.6))
    return edge(x * env[:, None] / np.max(np.abs(x)), 0.01, 0.25)


def supersaw(notes, dur=1.8, bright=5600, decay=0.7):
    t = T(dur)
    x = np.zeros((len(t), 2))
    for m in notes:
        for ch, det in ((0, (-15, -6, 5, 12)), (1, (-10, -2, 7, 16))):
            x[:, ch] += saw(hz(m), t, detune=det, kmax=32)
    for ch in range(2):
        x[:, ch] = sosfilt(sos("lowpass", bright), x[:, ch])
    env = (1 - np.exp(-t / 0.003)) * np.exp(-t / decay)
    return edge(x * env[:, None] / np.max(np.abs(x)), 0.0005, 0.25)


def drone(notes, dur):
    t = T(dur)
    x = np.zeros((len(t), 2))
    for i, m in enumerate(notes):
        f = hz(m)
        for ch in range(2):
            x[:, ch] += np.sin(2 * np.pi * f * (1 + 0.0015 * (ch - 0.5)) * t + i) * (0.6 if i == 0 else 0.35)
            x[:, ch] += 0.12 * saw(f * 2, t, detune=(-6 + 12 * ch,), kmax=6)
    for ch in range(2):
        x[:, ch] = sosfilt(sos("lowpass", 900), x[:, ch])
    return edge(x / np.max(np.abs(x)), 0.4, 0.3)


# ------------------------------------------------------------------ sound design
def whoosh(dur, kind="pass", pan0=0.0, pan1=0.0):
    if kind == "rise":
        fc, env = (lambda u: 250 * 16 ** (u**1.4)), (lambda u: u**2.2 * (1 - smoothstep(0.96, 1.0, u)))
    elif kind == "fall":
        fc, env = (lambda u: 5000 * 0.12**u), (lambda u: np.sin(np.pi * u) ** 1.4)
    else:
        fc, env = (lambda u: 350 + 3400 * np.sin(np.pi * u) ** 2), (lambda u: np.sin(np.pi * np.clip(u, 0, 1)) ** 2)
    a, b = shaped_noise(dur, fc, 1.3, env), shaped_noise(dur, fc, 1.3, env)
    u = np.arange(len(a)) / len(a)
    st = pan2(0.85 * a, pan0 + (pan1 - pan0) * smoothstep(0, 1, u)) + 0.25 * np.stack([b, -b], 1)
    return edge(st / max(1e-12, np.max(np.abs(st))), 0.004, 0.01)


def swirl_riser(dur):
    """Rising noise with a spinning tremolo (the vortex spinning up)."""
    t = T(dur)
    u = t / dur
    base = shaped_noise(dur, lambda v: 300 * 12 ** (v**1.2), 0.9, lambda v: v**1.8)
    trem = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(4 + 26 * u**2) / SR)
    tone = np.sin(2 * np.pi * np.cumsum(hz(50) * 2 ** (u * 1.6)) / SR) * u**2 * 0.25
    x = base * trem + tone
    return edge(norm(x), 0.01, 0.01)


def splash_bloom():
    """Frame 0: a drop hits — low bloom, a bloop that rises, a fizz of spray, a long wet tail."""
    t = T(1.4)
    sub = np.sin(2 * np.pi * np.cumsum(32 + 70 * np.exp(-t / 0.06)) / SR) * np.exp(-t / 0.5)
    bloop = np.sin(2 * np.pi * np.cumsum(260 * 2 ** (np.minimum(t, 0.08) / 0.08 * 1.2)) / SR) * np.exp(-t / 0.07) * 0.5
    spray = sosfilt(sos("bandpass", [2000, 9000]), R.standard_normal(len(t))) * np.exp(-t / 0.09) * 0.35
    x = norm(sub) + bloop + spray
    wet = fftconvolve(x, IRM)[: len(t)] * 0.18
    return edge(norm(x + wet), 0.0004, 0.2)


def bloop(m=62):
    t = T(0.25)
    f = hz(m) * 2 ** (np.minimum(t, 0.05) / 0.05 * 0.9)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.06)
    return edge(norm(x), 0.0004, 0.03)


def forge_hit():
    """The 7 appears: a heavy boom, an inharmonic metal ring, a bright noise flash."""
    t = T(2.0)
    boom = np.sin(2 * np.pi * np.cumsum(40 + 90 * np.exp(-t / 0.05)) / SR) * np.exp(-t / 0.6)
    ring = np.zeros_like(t)
    for r, a, d in ((1.0, 1.0, 1.1), (2.32, 0.6, 0.7), (3.71, 0.45, 0.45), (5.13, 0.3, 0.3), (7.44, 0.2, 0.2)):
        ring += a * np.sin(2 * np.pi * hz(62) * r * t) * np.exp(-t / d)
    flash = sosfilt(sos("highpass", 3000), R.standard_normal(len(t))) * np.exp(-t / 0.05)
    x = norm(boom) * 1.0 + norm(ring) * 0.38 + flash * 0.3
    return edge(norm(x), 0.0004, 0.3)


def shing(up=True):
    """A highlight racing along a chrome bevel: a resonant metallic sweep."""
    dur = 0.5
    t = T(dur)
    u = t / dur
    sweep = shaped_noise(dur, (lambda v: 1800 * 5 ** v) if up else (lambda v: 9000 * 0.25 ** v), 0.35, lambda v: np.sin(np.pi * v) ** 1.5)
    ringf = (hz(86) if up else hz(84)) * (1 + 0.04 * u)
    ring = np.sin(2 * np.pi * np.cumsum(ringf * np.ones_like(t)) / SR) * np.sin(np.pi * u) ** 2 * 0.3
    return edge(norm(sweep + ring), 0.003, 0.03)


def sizzle(dur=0.6):
    """Metal burning away: crackle (sparse impulses) over fizz."""
    t = T(dur)
    x = np.zeros_like(t)
    idx = R.integers(0, len(t), int(130 * dur))
    x[idx] = R.uniform(-1, 1, len(idx))
    crack = sosfilt(sos("bandpass", [1500, 9000]), x)
    fizz = sosfilt(sos("highpass", 5000), R.standard_normal(len(t))) * 0.25
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.7
    return edge(norm((crack * 3 + fizz) * env), 0.005, 0.05)


def spark_burst():
    t = T(0.9)
    nz = sosfilt(sos("bandpass", [3000, 12000]), R.standard_normal(len(t))) * np.exp(-t / 0.12)
    out = pan2(norm(nz) * 0.6, 0)
    for i in range(28):
        ti = R.uniform(0, 0.5) ** 1.6
        s = bell(int(R.choice([86, 89, 91, 93, 96, 98])), 0.25, bright=0.5) * R.uniform(0.15, 0.5) * np.exp(-ti * 4)
        out[S(ti) : S(ti) + len(s)] += pan2(s, R.uniform(-0.9, 0.9))
    return out / np.max(np.abs(out))


def snap():
    """The 6 locks: a hard finger-snap transient + a glassy fifth."""
    t = T(0.6)
    clk = sosfilt(sos("bandpass", [1800, 6000]), R.standard_normal(len(t))) * np.exp(-t / 0.006)
    tone = (np.sin(2 * np.pi * hz(74) * t) + 0.6 * np.sin(2 * np.pi * hz(81) * t)) * np.exp(-t / 0.25) * 0.4
    return edge(norm(clk * 1.6 + tone), 0.0003, 0.05)


def implode(dur):
    """Reverse crash + a sucking sub sweep into a point."""
    c = crash()[: S(dur)]
    rev = c[::-1].copy() * np.linspace(0, 1, S(dur)) ** 2.5
    t = T(dur)
    suck = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (-2.5 * (t / dur))) / SR) * (t / dur) ** 3 * 0.4
    return edge(norm(rev + suck), 0.01, 0.003)


def freeze():
    """Glass freezing flat: a dense cascade of tiny crystalline ticks."""
    dur = 0.45
    out = np.zeros(S(dur + 0.1))
    for i in range(70):
        ti = R.uniform(0, dur) ** 1.3 * 0.9
        f = R.uniform(4000, 11000)
        tt = T(0.02)
        s = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.003) * R.uniform(0.2, 1)
        out[S(ti) : S(ti) + len(s)] += s
    return edge(norm(out), 0.001, 0.03)


def clack():
    """Woodblock + metal plate: the shards snapping into tiles."""
    t = T(0.25)
    imp = R.standard_normal(len(t)) * np.exp(-t / 0.002)
    wood = sosfilt(sos("bandpass", [700, 1100]), imp) * 2 + sosfilt(sos("bandpass", [2000, 2600]), imp)
    metal = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, d in ((1870, 0.05), (2950, 0.035), (4430, 0.02))) * 0.25
    return edge(norm(wood + metal), 0.0002, 0.04)


def click(f=3200):
    t = T(0.03)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.004) + 0.4 * sosfilt(sos("highpass", 4000), R.standard_normal(len(t))) * np.exp(-t / 0.0015)
    return edge(norm(x), 0.0002, 0.006)


def key_click():
    t = T(0.035)
    x = sosfilt(sos("bandpass", [2200, 7000]), R.standard_normal(len(t))) * np.exp(-t / 0.0035)
    return edge(norm(x), 0.0002, 0.005)


def tape_swoop(dur=0.4, up=False):
    t = T(dur)
    u = t / dur
    f = hz(57) * 2 ** ((u if up else (1 - u)) * 2.0 - 1.0)
    x = saw(f, t, kmax=20) * np.sin(np.pi * u) ** 1.2
    x = sosfilt(sos("lowpass", 3500), x)
    return edge(norm(x), 0.003, 0.02)


def unspool(dur=0.25):
    out = np.zeros(S(dur + 0.05))
    n = 16
    for i in range(n):
        ti = dur * (1 - (1 - i / n) ** 1.6)
        tt = T(0.025)
        s = np.sin(2 * np.pi * np.cumsum(np.full(len(tt), 2400 - i * 110)) / SR) * np.exp(-tt / 0.006)
        out[S(ti) : S(ti) + len(s)] += s * (0.4 + 0.6 * i / n)
    return edge(norm(out), 0.001, 0.02)


def two_pop():
    """The leader's 2-pop: a 1 kHz tone exactly one film frame (1/24 s) long."""
    t = T(1 / 24)
    x = np.sin(2 * np.pi * 1000 * t)
    return edge(x, 0.0015, 0.0015)


def crash():
    t = T(2.4)
    x = sosfilt(sos("highpass", 3500), R.standard_normal(len(t))) * np.exp(-t / 0.6)
    x += 0.4 * sosfilt(sos("bandpass", [5000, 9000]), R.standard_normal(len(t))) * np.exp(-t / 0.22)
    return edge(norm(x), 0.0005, 0.3)


def sub_hit(dur=1.8):
    t = T(dur)
    f = 34 + 44 * np.exp(-t / 0.09)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-t / 0.002)) * np.exp(-t / 0.55)
    x += 0.28 * sosfilt(sos("bandpass", [80, 420]), np.tanh(3 * x))
    return edge(norm(x), 0.0005, 0.2)


def rev_swell(dur, notes):
    hit = sum(bell(m, 1.4) for m in notes)
    wet = fftconvolve(hit, IRM)[: S(dur + 0.03)]
    y = wet[::-1].copy() * np.linspace(0, 1, len(wet)) ** 2.2
    return edge(norm(y), 0.01, 0.004)


def sparkle_tail(dur, density, base=86):
    out = np.zeros((S(dur + 0.4), 2))
    times = np.sort(R.uniform(0, dur, int(density * dur)))
    pent = [0, 2, 4, 7, 9]
    for ti in times:
        m = base + pent[int(R.integers(0, 5))] + 12 * int(R.integers(0, 2))
        s = bell(m, 0.35, bright=0.6) * (1 - ti / dur) ** 1.5 * R.uniform(0.4, 1)
        out[S(ti) : S(ti) + len(s)] += pan2(s, R.uniform(-0.8, 0.8))
    return out / np.max(np.abs(out))


EVENTS = []


def ev(t, label):
    EVENTS.append({"t": round(float(t), 4), "label": label})


# ------------------------------------------------------------------ the arrangement
CH = {  # chord tones (MIDI) per bar
    "Dm": [50, 53, 57, 62], "Bb": [46, 50, 53, 58], "Gm": [43, 50, 55, 58], "A": [45, 49, 52, 57], "D": [50, 54, 57, 62],
}
ROOTS = {"Dm": 38, "Bb": 34, "Gm": 31, "A": 33, "D": 38}
PROG = ["Dm", "Dm", "Bb", "Gm", "A", "Dm", "Bb", "D"]


def bar_t(b):
    return b * BAR


def render():
    mus, sfx, send, drm = Bus(), Bus(), Bus(), Bus()
    K, CL, SN, HH, OH = kick(), clap(), snare(), hat(), hat(True)

    # ---------------- bar 1: drone + water
    mus.add(drone([38, 45, 50], BAR + 0.25), 0.0, 0, 0.32)
    sfx.add(splash_bloom(), EV["impact"], 0, 1.0); ev(EV["impact"], "splash bloom (frame 0)")
    for k, id_ in enumerate(["fluid-pulse-1", "fluid-pulse-2"]):
        sfx.add(bloop(62 + 3 * k), EV[id_], 0.25 * (-1) ** k, 0.42); ev(EV[id_], "bloop")
    sfx.add(bloop(69), 3 * BEAT, -0.2, 0.36)
    sfx.add(swirl_riser(EV["dive"] + 0.24 - EV["vortex-spinup"]), EV["vortex-spinup"], 0, 0.5); ev(EV["vortex-spinup"], "vortex riser")
    sfx.add(whoosh(0.32, "rise", -0.3, 0.3), EV["dive"] - 0.08, 0, 0.55); ev(EV["dive"], "dive whoosh")
    # quiet pluck pulse, filtered, in the intro (the 8's flow)
    for i in range(8):
        tt = i * BEAT / 2
        mus.add(pluck(CH["Dm"][i % 4] + 12, 0.45, bright=0.5), tt + 0.0, 0.3 * (-1) ** i, 0.07 + 0.01 * i)

    # ---------------- bars 2..6: the groove builds
    for b in range(1, 6):
        t0 = bar_t(b)
        ch = PROG[b]
        for q in range(4):
            tb = t0 + q * BEAT
            half_time = b == 1
            if not half_time or q in (0, 2):
                drm.add(K, tb, 0, 0.95 if q == 0 else 0.85)
            if b >= 3 and q in (1, 3):
                drm.add(CL, tb, 0.06, 0.5)
                send.add(CL, tb, 0.06, 0.18)
            # hats: 8ths from bar 3, 16ths from bar 4
            if b >= 2:
                drm.add(HH, tb + BEAT / 2, 0.3, 0.2)
            if b >= 3:
                drm.add(HH, tb + BEAT / 4, -0.3, 0.09)
                drm.add(HH, tb + 3 * BEAT / 4, -0.3, 0.09)
        # bass: 8ths on the root (octave jumps in bars 5–6)
        for e in range(8):
            te = t0 + e * BEAT / 2
            m = ROOTS[ch] + (12 if (b >= 4 and e % 2) else 0)
            mus.add(bass_note(m, 0.22), te, 0, 0.5 if b >= 2 else 0.36)
        # arpeggio 16ths from bar 3 (the particles) — brighter each bar
        if b >= 2:
            pat = [0, 1, 2, 3, 2, 1, 2, 3]
            for s16 in range(16):
                ts = t0 + s16 * BEAT / 4
                m = CH[ch][pat[s16 % 8]] + 12
                p = pluck(m, 0.38, bright=0.7 + 0.25 * b)
                pn = 0.4 * (-1) ** s16
                mus.add(p, ts, pn, 0.09 + 0.012 * b)
                send.add(p, ts, pn, 0.05)
        # pad from bar 4
        if b >= 3:
            mus.add(pad(CH[ch], BAR + 0.1, 1400 + 300 * b), t0, 0, 0.12)
            send.add(pad(CH[ch], BAR, 1600), t0, 0, 0.05)

    # ---------------- events, bar 2 (7)
    sfx.add(forge_hit(), EV["forge-hit"], 0, 0.95); ev(EV["forge-hit"], "forge hit")
    sfx.add(sub_hit(1.2), EV["forge-hit"], 0, 0.5)
    sfx.add(shing(True), EV["sweep-ice"] - 0.04, -0.35, 0.42); ev(EV["sweep-ice"], "shing (ice sweep)")
    sfx.add(shing(False), EV["sweep-infra"] - 0.04, 0.35, 0.42); ev(EV["sweep-infra"], "shing (infra sweep)")
    sfx.add(sizzle(0.62), EV["dissolve"], 0, 0.42); ev(EV["dissolve"], "dissolve sizzle")
    # ---------------- bar 3 (6)
    sfx.add(spark_burst(), EV["spark-burst"], 0, 0.6); ev(EV["spark-burst"], "spark burst")
    sfx.add(whoosh(0.5, "pass", -0.7, 0.7), EV["spiral-swell"] - 0.1, 0, 0.32); ev(EV["spiral-swell"], "spiral swell")
    sfx.add(snap(), EV["snap-six"], 0, 0.75); ev(EV["snap-six"], "SNAP (the 6 locks)")
    sfx.add(implode(EV["glass-bloom"] - EV["implode"]), EV["implode"], 0, 0.55); ev(EV["implode"], "implosion")
    # ---------------- bar 4 (5)
    gb = sum(glass_bell(m, 1.5) for m in (81, 86, 88, 93))
    sfx.add(norm(gb), EV["glass-bloom"], 0, 0.5); ev(EV["glass-bloom"], "glass bloom")
    sfx.add(sub_hit(1.0), EV["glass-bloom"], 0, 0.45)
    send.add(norm(gb), EV["glass-bloom"], 0, 0.25)
    sfx.add(whoosh(0.32, "rise", 0.2, -0.2), EV["lens-push"] - 0.2, 0, 0.3)
    sfx.add(norm(glass_bell(93, 0.8) + glass_bell(98, 0.8)), EV["lens-push"], 0.2, 0.3); ev(EV["lens-push"], "lens push")
    sfx.add(freeze(), EV["freeze"], 0, 0.42); ev(EV["freeze"], "freeze")
    # ---------------- bar 5 (4)
    sfx.add(clack(), EV["clack"], 0, 0.85); ev(EV["clack"], "clack")
    for id_, pn, f in (("snap-a", -0.4, 2600), ("snap-b", 0.4, 3000), ("snap-c", -0.2, 3400)):
        sfx.add(click(f), EV[id_], pn, 0.45); ev(EV[id_], "click (8th)")
    lock = sum(pluck(m + 12, 0.7, 1.4) for m in CH["A"])
    sfx.add(norm(lock), EV["four-lock"], 0, 0.42); ev(EV["four-lock"], "lock stab")
    for s16 in range(8):  # the dot pulses, on 16ths, from the sweep start
        sfx.add(click(5200), EV["snap-c"] + s16 * BEAT / 4, 0.5 * (-1) ** s16, 0.1)
    sfx.add(whoosh(0.47, "rise", 0, 0), EV["stripe-zoom"], 0, 0.45); ev(EV["stripe-zoom"], "stripe zoom")
    # ---------------- bar 6 (3)
    sfx.add(tape_swoop(0.42, False), EV["type-swoop"], 0, 0.42); ev(EV["type-swoop"], "tape swoop")
    for s16 in range(4, 22):
        sfx.add(key_click(), EV["type-swoop"] + s16 * BEAT / 4 + 0.004 * ((s16 * 7) % 3), 0.35 * (-1) ** s16, 0.16)
    for id_ in ("word-hit-1", "tighten"):
        st = norm(sum(pluck(m + 24, 0.3, 2.0) for m in CH["Dm"][:3]))
        sfx.add(st, EV[id_], 0, 0.42); ev(EV[id_], "word stab")
    sfx.add(unspool(0.24), EV["unspool"], 0, 0.42); ev(EV["unspool"], "unspool")
    sfx.add(whoosh(0.24, "pass", 0.6, -0.6), EV["sweep-hand"], 0, 0.5); ev(EV["sweep-hand"], "sweep-hand whip")

    # ---------------- bar 7 (2): the pop on silence, then the dive
    t7 = bar_t(6)
    sfx.add(two_pop(), EV["two-pop"], 0, 0.62); ev(EV["two-pop"], "2-POP (1 kHz, 1/24 s)")
    # projector hum + clatter during the pop beat (the film moment), very quiet
    tp = T(BEAT)
    proj = sosfilt(sos("bandpass", [90, 400]), R.standard_normal(len(tp))) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 24 * tp))) * 0.25
    sfx.add(edge(proj, 0.01, 0.05), EV["two-pop"] + 0.05, 0, 0.18)
    sfx.add(whoosh(0.4, "fall", -0.2, 0.2), EV["flight-dive"] - 0.05, 0, 0.55); ev(EV["flight-dive"], "dive")
    sfx.add(sub_hit(0.9), EV["flight-dive"], 0, 0.4)
    # snare roll accelerating into the drop (16ths → 32nds), hats on 16ths (the arches)
    tr = EV["flight-dive"]
    k = 0
    while tr < EV["drop"] - 0.01:
        u = (tr - EV["flight-dive"]) / (EV["drop"] - EV["flight-dive"])
        drm.add(SN, tr, 0.15 * (-1) ** k, 0.16 + 0.42 * u**1.5)
        tr += BEAT / 4 if u < 0.55 else BEAT / 8
        k += 1
    for s16 in range(12):
        drm.add(HH, EV["flight-dive"] + s16 * BEAT / 4, -0.4, 0.12)
    for b2 in range(2):  # bass pedal on A, rising
        mus.add(bass_note(33 + 12 * b2, BEAT * 1.5, 400 + 600 * b2), EV["flight-dive"] + b2 * BEAT * 1.5, 0, 0.42)
    sfx.add(swirl_riser(EV["drop"] - EV["exit-glow"] + 0.02), EV["exit-glow"], 0, 0.55); ev(EV["exit-glow"], "exit riser")
    sfx.add(whoosh(EV["drop"] - EV["flight-dive"] - 0.1, "rise", -0.3, 0.3), EV["flight-dive"] + 0.1, 0, 0.42)
    sfx.add(rev_swell(0.45, [74, 81, 86]), EV["drop"] - 0.45, 0, 0.42)

    # ---------------- bar 8: the drop, D major
    td = EV["drop"]
    drm.add(kick(0.7, 1.4, 40), td, 0, 1.25); ev(td, "DROP")
    sfx.add(sub_hit(1.8), td, 0, 0.8)
    sfx.add(crash(), td, 0, 0.5)
    st = supersaw([50, 54, 57, 62, 64, 69], 1.9, 5200, 0.85)
    mus.add(st, td, 0, 0.58)
    send.add(st, td, 0, 0.2)
    mus.add(pad([38, 50, 57, 62, 66], DUR - td + 0.3, 2200, 0.05), td, 0, 0.22)
    mus.add(bass_note(26, 1.6, 300), td, 0, 0.55)
    drm.add(K, td + 2 * BEAT, 0, 0.6)
    # one bell per letter as the letters fill (8 letters, 42 ms apart), up the D major pentatonic
    pent = [74, 76, 78, 81, 83, 86, 88, 90]
    for i in range(8):
        tl = EV["fill-cascade"] + i * 0.042
        sfx.add(bell(pent[i], 0.9, 0.8), tl, -0.7 + 0.2 * i, 0.2)
        send.add(bell(pent[i], 0.9, 0.8), tl, -0.7 + 0.2 * i, 0.1)
    ev(EV["fill-cascade"], "letter bells x8")
    # the typed line: a soft key click every two characters
    for c in range(0, 46, 2):
        sfx.add(key_click(), EV["type-on"] + c * 0.0146, 0.2, 0.09)
    ev(EV["type-on"], "type-on clicks")
    g1, g2 = bell(98, 1.2, 0.5), bell(105, 0.8, 0.3)
    g1[: len(g2)] += 0.5 * g2
    gl = norm(g1)
    sfx.add(gl, EV["glint"], 0.4, 0.3)
    send.add(gl, EV["glint"], 0.4, 0.2); ev(EV["glint"], "glint")
    sfx.add(sparkle_tail(0.45, 30, 86), EV["glint"] + 0.05, 0, 0.12)

    # reverb send
    sh = sosfilt(sos("highpass", 220), send.x, axis=0)
    wet = np.stack([fftconvolve(sh[:, 0], IR[:, 0])[: N + TAIL], fftconvolve(sh[:, 1], IR[:, 1])[: N + TAIL]], 1)
    # sidechain-style ducking of the music under kicks
    duck = np.ones(N + TAIL)
    for tb in [b * BEAT for b in range(32)]:
        i0 = S(tb)
        if 1.875 <= tb < 11.25 or abs(tb - td) < 1e-6:
            n = S(0.18)
            duck[i0 : i0 + n] = np.minimum(duck[i0 : i0 + n], 1 - 0.38 * np.exp(-np.arange(n) / SR / 0.06))
    mix = mus.x * duck[:, None] * 1.15 + drm.x * 0.78 + sfx.x * 1.28 + 0.32 * wet
    mix = sosfilt(sos("highpass", 28), mix, axis=0)
    mix -= 0.25 * sosfiltfilt(sos("lowpass", 85), mix, axis=0)
    # end: let the tail ring, but finish at exactly 15.000 s with a short fade
    fade = np.ones(N)
    nf = S(0.25)
    fade[N - nf :] = np.cos(np.linspace(0, np.pi / 2, nf)) ** 2
    return mix[:N] * fade[:, None], {"music": mus.x[:N], "drums": drm.x[:N], "sfx": sfx.x[:N] + 0.32 * wet[:N]}


def measure(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return (float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)[-1]),
            float(re.findall(r"LRA:\s+(-?[\d.]+) LU", err)[-1]))


def limit(x, ceiling_db=-1.5, look=0.003):
    up = resample_poly(x, 4, 1, axis=0)
    pk = np.max(np.abs(up), axis=1)
    pk = pk[: len(pk) // 4 * 4].reshape(-1, 4).max(axis=1)[: len(x)]
    g = np.minimum(1.0, 10 ** (ceiling_db / 20) / np.maximum(pk, 1e-12))
    w = int(look * SR) | 1
    g = uniform_filter1d(minimum_filter1d(g, size=2 * w + 1), size=w)
    return x * g[:, None], g


def write(path, x):
    wavfile.write(path, SR, x.astype(np.float32))


def click_scan(x):
    hits = []
    for ch in range(2):
        d = np.abs(np.diff(x[:, ch]))
        loc = uniform_filter1d(d, size=480) + 1e-6
        hits += [int(i) for i in np.where((d > 25 * loc) & (d > 0.05))[0]]
    return sorted(set(hits))


def main():
    os.makedirs("assets/audio", exist_ok=True)
    os.makedirs("build", exist_ok=True)
    mix, stems = render()
    out = "assets/audio/score.wav"
    tmp = "build/score-pre.wav"
    gain_db = 0.0
    for it in range(5):
        y, g = limit(mix * 10 ** (gain_db / 20))
        write(tmp, y)
        I, TP, LRA = measure(tmp)
        lim = 20 * np.log10(np.min(g))
        print(f"pass {it}: gain {gain_db:+.2f} dB → {I:.2f} LUFS, {TP:.2f} dBTP, limiter max {lim:.2f} dB")
        if abs(I + 14.0) < 0.15:
            break
        gain_db += -14.0 - I
    write(out, y)
    I, TP, LRA = measure(out)
    # limiter regions + clicks
    regions = []
    gdb = 20 * np.log10(np.maximum(g, 1e-9))
    on = gdb < -1.0
    i = 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]:
                j += 1
            regions.append({"from_s": round(i / SR, 3), "to_s": round(j / SR, 3), "max_db": round(float(gdb[i:j].min()), 2)})
            i = j
        else:
            i += 1
    stem_l = {}
    for k, v in stems.items():
        write("build/stem.wav", v * 10 ** (gain_db / 20))
        stem_l[k] = measure("build/stem.wav")[0]
    rep = {"integrated_lufs": I, "true_peak_dbtp": TP, "lra_lu": LRA, "master_gain_db": round(gain_db, 2), "stems_lufs_in_mix": stem_l,
           "limiter_regions": regions, "clicks": len(click_scan(y)), "duration_s": len(y) / SR, "sync_events": EVENTS}
    json.dump(rep, open("build/score-report.json", "w"), indent=1)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out, "-lavfi", "showspectrumpic=s=1600x700:legend=1:scale=log:fscale=log",
                    "build/score-spectrogram.png"])
    print(json.dumps({k: rep[k] for k in ("integrated_lufs", "true_peak_dbtp", "lra_lu", "master_gain_db", "stems_lufs_in_mix", "clicks", "duration_s")}, indent=1))
    print("limiter regions:", len(regions), "deepest:", min([r["max_db"] for r in regions], default=0))


if __name__ == "__main__":
    main()
