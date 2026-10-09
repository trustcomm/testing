#!/usr/bin/env python3
"""Flow State — the score, 100 % synthesized (numpy/scipy; no samples, no sound libraries).

Reads build/events.json (written from src/timeline.js by scripts/export_events.mjs) and renders one sound per visual
event on its exact sample: frame f → sample f × 800 (48 kHz / 60 fps). Under the events: a warm pad in D-flat major whose
chords change on the big transitions, a soft sine bass with a heartbeat pulse through the middle of the film, and a
night-water ambience. Every sound is tuned to the D-flat major pentatonic and passes through one synthetic stereo hall.

Master: −14 LUFS integrated, true peak ≤ −1.5 dBTP (4× oversampled look-ahead limiter), measured with ffmpeg's EBU R128 meter.

Usage: python3 -I scripts/audio.py   → build/score.wav, build/spectrogram.png, build/audio_report.json
"""
import json, os, re, subprocess, sys
import numpy as np
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, fftconvolve, istft, lfilter, resample_poly, sosfilt, stft
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SR = 48000
D = json.load(open("build/events.json"))
FPS = D["fps"]
SPF = SR // FPS  # 800 samples per frame
TOTAL = D["total_frames"]
N = TOTAL * SPF  # 30.4 s
TAIL = 6 * SR
R = np.random.default_rng(20261008)

PENTA = [0, 2, 4, 7, 9]


def deg(d):  # pentatonic degree → MIDI (degree 0 = D-flat 4)
    return 61 + PENTA[d % 5] + 12 * (d // 5)


def hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def T(dur):
    return np.arange(int(round(dur * SR))) / SR


def at(f):
    return int(round(f * SPF))


def sos(kind, f, order=2):
    return butter(order, f, kind, fs=SR, output="sos")


def edge(x, a=0.001, r=0.02):
    """Smooth fade over the first a and last r seconds: nothing starts or stops on a non-zero sample."""
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

    def add(self, sig, start, pan=0.0, gain=1.0):
        if sig.ndim == 1:
            sig = pan2(sig, pan)
        i0, i1 = start, start + len(sig)
        s0 = max(0, -i0)
        i0, i1 = max(0, i0), min(len(self.x), i1)
        if i1 > i0:
            self.x[i0:i1] += gain * sig[s0 : s0 + i1 - i0]


# ------------------------------------------------------------------ the hall (synthetic stereo IR)
def make_ir(rt=3.3, length=4.6, pre=0.025, seed=3):
    r = np.random.default_rng(seed)
    n = int(length * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for ch in range(2):
        w = r.standard_normal(n)
        lo = sosfilt(sos("lowpass", 450), w)
        hi = sosfilt(sos("highpass", 3800), w)
        mid = w - lo - hi
        env = lambda k: np.exp(-6.91 * t / (rt * k))
        ir[:, ch] = lo * env(1.12) + mid * env(1.0) + hi * env(0.42)
    ir *= (np.clip(t / 0.08, 0, 1) ** 1.6)[:, None]  # diffuse build-up
    for d, g, p in ((0.011, 0.5, -0.6), (0.017, 0.42, 0.55), (0.024, 0.34, -0.25), (0.031, 0.3, 0.7), (0.043, 0.22, -0.8), (0.058, 0.17, 0.2)):
        i = int(d * SR)
        th = (p + 1) * np.pi / 4
        ir[i, 0] += g * np.cos(th) * 3
        ir[i, 1] += g * np.sin(th) * 3
    ir = np.vstack([np.zeros((int(pre * SR), 2)), ir])
    ir /= np.sqrt(np.sum(ir**2) / 2)
    return ir


IR = make_ir()
IRM = IR.mean(axis=1)[int(0.025 * SR) :]  # mono, without the pre-delay (reverse swells must peak on their event)


# ------------------------------------------------------------------ instruments
def water_drop(f, dur=0.5, tau=0.075, depth=0.5, body=0.4, tick=0.1):
    """A tuned water drop: a sine bubble whose pitch rises onto the note, a softer octave-down body, a tiny impact tick."""
    t = T(dur)
    fi = f * (1 - depth * np.exp(-t / 0.012))
    x = np.sin(2 * np.pi * np.cumsum(fi) / SR) * np.exp(-t / tau)
    fb = 0.5 * f * (1 - 0.55 * np.exp(-t / 0.02))
    x += body * np.sin(2 * np.pi * np.cumsum(fb) / SR) * np.exp(-t / (tau * 0.8))
    x *= 1 - np.exp(-t / 0.0006)
    n = int(0.006 * SR)
    x[:n] += tick * sosfilt(sos("bandpass", [2500, 9000]), R.standard_normal(n) * np.hanning(n))
    return edge(norm(x), 0.0005, 0.04)


def kalimba(f, dur=2.0):
    t = T(dur)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.55)
    if f * 5.93 < 17000:
        x += 0.22 * np.sin(2 * np.pi * f * 5.93 * t + 0.3) * np.exp(-t / 0.06)
    x += 0.1 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t / 0.3)
    x *= 1 - np.exp(-t / 0.0012)
    n = int(0.004 * SR)
    x[:n] += 0.05 * sosfilt(sos("bandpass", [1200, 5000]), R.standard_normal(n) * np.hanning(n))
    return edge(norm(x), 0.0005, 0.06)


def glass_bell(f, dur=3.4, bright=1.0):
    t = T(dur)
    x = np.zeros_like(t)
    for r, a, d in ((1.0, 1.0, 2.4), (2.756, 0.42 * bright, 1.1), (5.404, 0.2 * bright, 0.5), (8.933, 0.09 * bright, 0.25)):
        fr = f * r
        if fr > 17000:
            continue
        x += a * (np.sin(2 * np.pi * fr * t) + 0.5 * np.sin(2 * np.pi * fr * 1.0013 * t + 1.0)) / 1.5 * np.exp(-t / d)
    x *= 1 - np.exp(-t / 0.0015)
    return edge(norm(x), 0.001, 0.1)


def string(f, dur, pos, d0, dk, kexp, B=0.0004, kmax=24):
    """Modal plucked string: harmonics weighted by the pluck position, upper partials dying faster, slight stiffness."""
    t = T(dur)
    x = np.zeros_like(t)
    for k in range(1, kmax + 1):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 16000:
            break
        a = abs(np.sin(k * np.pi * pos)) / k**1.1
        x += a * np.sin(2 * np.pi * fk * t + R.uniform(0, 0.3)) * np.exp(-t * (d0 + dk * k**kexp))
    x *= 1 - np.exp(-t / 0.0008)
    return edge(norm(x), 0.0005, 0.06)


def harp(f):
    return string(f, 3.0, 0.2, 0.7, 0.35, 1.35)


def pluck(f):
    return string(f, 1.8, 0.12, 2.0, 0.8, 1.3)


def sub_boom(dur=2.6):
    t = T(dur)
    fr = 37 + 20 * np.exp(-t / 0.16)  # 57 → 37 Hz
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * (1 - np.exp(-t / 0.003)) * np.exp(-t / 0.75)
    harm = sosfilt(sos("bandpass", [70, 420]), np.tanh(3 * x)) * 0.35  # harmonics so small speakers feel it
    thump = np.sin(2 * np.pi * np.cumsum(90 + 50 * np.exp(-t / 0.01)) / SR) * np.exp(-t / 0.04) * 0.25
    return edge(norm(x + harm + thump), 0.0005, 0.3)


def shaped_noise(dur, fc_fn, bw_oct, env_fn):
    """Noise through a band-pass whose centre moves over time (STFT-domain, Gaussian in log-frequency)."""
    n = int(dur * SR)
    w = R.standard_normal(n + 2048)
    fr, tt, Z = stft(w, fs=SR, nperseg=1024, noverlap=768)
    fc = np.maximum(30.0, fc_fn(np.clip(tt / dur, 0, 1)))
    lf = np.log2(np.maximum(fr, 1.0))[:, None]
    G = np.exp(-0.5 * ((lf - np.log2(fc)[None, :]) / (bw_oct / 2)) ** 2)
    _, y = istft(Z * G, fs=SR, nperseg=1024, noverlap=768)
    y = y[:n]
    return y * env_fn(np.arange(n) / n)


def whoosh(dur, pan0=0.0, pan1=0.0, rise=False, fall=False):
    if rise:
        fc = lambda u: 200 * 18 ** (u**1.5)
        env = lambda u: u**2.4 * (1 - smoothstep(0.97, 1.0, u))
    elif fall:
        fc = lambda u: 5000 * 0.12**u
        env = lambda u: np.sin(np.pi * u) ** 1.5
    else:
        fc = lambda u: 300 + 2700 * np.sin(np.pi * u) ** 2
        env = lambda u: np.sin(np.pi * np.clip(u, 0, 1)) ** 2
    a = shaped_noise(dur, fc, 1.4, env)
    b = shaped_noise(dur, fc, 1.4, env)
    u = np.arange(len(a)) / len(a)
    p = pan0 + (pan1 - pan0) * smoothstep(0, 1, u)
    st = pan2(0.85 * a, p) + 0.25 * np.stack([b, -b], 1)
    return edge(st / max(1e-12, np.max(np.abs(st))), 0.005, 0.01)


def rev_swell(dur, f):
    """A reverse swell: a bell cluster through the hall, reversed, so it rises out of nothing and lands on the event."""
    hit = glass_bell(f, 2.2) + 0.6 * glass_bell(f * 1.5, 2.2) + 0.4 * glass_bell(f * 2, 2.2)
    wet = fftconvolve(hit, IRM)[: int((dur + 0.05) * SR)]
    y = wet[::-1].copy()
    y *= np.linspace(0, 1, len(y)) ** 2.4
    return edge(norm(y), 0.01, 0.004)


def sparkle(dur, density):
    n = int((dur + 0.5) * SR)
    out = np.zeros((n, 2))
    times = np.sort(R.uniform(0, dur, int(density * dur)))
    for ti in times:
        f = hz(deg(int(R.integers(14, 23)))) * (1 + R.uniform(-0.002, 0.002))
        t = T(0.3)
        ping = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.756 * f * t)) * np.exp(-t / R.uniform(0.03, 0.1))
        ping = edge(ping * (1 - np.exp(-t / 0.0005)), 0.0005, 0.02)
        amp = np.sin(np.pi * ti / dur) ** 1.2 * R.uniform(0.35, 1.0)
        i = int(ti * SR)
        out[i : i + len(ping)] += pan2(ping, R.uniform(-0.85, 0.85)) * amp
    return out


def breath(dur):
    fc = lambda u: 1500 * 0.4**u
    env = lambda u: np.sin(np.pi * u) ** 2 * (1 - 0.3 * u)
    st = np.stack([shaped_noise(dur, fc, 2.2, env), shaped_noise(dur, fc, 2.2, env)], 1)
    return edge(st / np.max(np.abs(st)), 0.01, 0.05)


def text_air(dur=0.55):
    fc = lambda u: 6500 + 3500 * u
    env = lambda u: np.sin(np.pi * u) ** 2 * (1 - u) ** 0.5
    st = np.stack([shaped_noise(dur, fc, 1.5, env), shaped_noise(dur, fc, 1.5, env)], 1)
    return edge(st / np.max(np.abs(st)), 0.01, 0.02)


def glass_chord(notes, dur=3.4):
    t = T(dur)
    x = np.zeros_like(t)
    for i, m in enumerate(notes):
        f = hz(m + 12)
        vib = 1 + 0.0025 * np.sin(2 * np.pi * (4.2 + 0.3 * i) * t)
        ph = 2 * np.pi * np.cumsum(f * vib) / SR
        x += (np.sin(ph) + 0.25 * np.sin(2 * ph)) * (1 - np.exp(-t / 0.14)) * np.exp(-t / 1.4)
    return edge(norm(x), 0.005, 0.2)


def chime(degs, gap=0.024):
    n = int((3.6 + gap * len(degs)) * SR)
    out = np.zeros((n, 2))
    for i, d in enumerate(degs):
        f = hz(deg(d))
        s = 0.8 * glass_bell(f) + 0.35 * np.pad(kalimba(f), (0, int(3.4 * SR) - int(2.0 * SR)))[: int(3.4 * SR)]
        i0 = int(i * gap * SR)
        out[i0 : i0 + len(s)] += pan2(s, -0.45 + 0.9 * i / max(1, len(degs) - 1)) * (1 - 0.08 * i)
    return out / np.max(np.abs(out))


# ------------------------------------------------------------------ music bed
CH = D["chords"]
CH_T = [c["f"] / FPS for c in CH]
END_T = N / SR


def chord_at(f):
    c = CH[0]
    for x in CH:
        if x["f"] <= f:
            c = x
    return c


def note_env(on, t, att=0.45, rel=0.75, first=0.3):
    env = np.zeros_like(t)
    cur = 0.0
    bounds = CH_T + [t[-1] + 1]
    for i, o in enumerate(on):
        idx = (t >= bounds[i]) & (t < bounds[i + 1])
        if not idx.any():
            continue
        target = 1.0 if o else 0.0
        tau = (first if i == 0 else att) if target > cur else rel
        env[idx] = target + (cur - target) * np.exp(-(t[idx] - bounds[i]) / tau)
        cur = env[idx][-1]
    return env


def pulse_depth(t):
    # a heartbeat through the middle of the film (flow → build), easing in and out
    return np.interp(t, [0, 9.6, 11.2, 20.6, 21.6, 99], [0, 0, 1, 1, 0, 0])


def pad():
    sr2 = 24000
    n2 = (N + TAIL) // 2
    t = np.arange(n2) / sr2
    notes = sorted({m for c in CH for m in c["notes"]})
    fcut = np.interp(t, [0, 6.4, 12.8, 19.2, 22.0, 22.6, 25.6, 30.4, 40], [700, 1000, 1300, 1600, 1700, 2700, 2200, 1700, 1500])
    out = np.zeros((n2, 2))
    for m in notes:
        env = note_env([m in c["notes"] for c in CH], t)
        if env.max() < 1e-4:
            continue
        f = hz(m)
        K = max(1, min(14, int(3800 / f)))
        for ch, dets in ((0, (-9, -2, 6)), (1, (-5, 3, 10))):
            acc = np.zeros(n2)
            for j, dc in enumerate(dets):
                vib = 1 + (2 ** (4 / 1200) - 1) * np.sin(2 * np.pi * (0.11 + 0.03 * j) * t + 1.7 * j + m)
                ph = 2 * np.pi * np.cumsum(f * 2 ** (dc / 1200) * vib) / sr2 + R.uniform(0, 2 * np.pi)
                for k in range(1, K + 1):
                    a = (1 / k) / np.sqrt(1 + (k * f / fcut) ** 4)
                    acc += a * np.sin(k * ph)
            out[:, ch] += acc * env / 3
    # an arc: soft over the water, building scene by scene, opening wide at the shine, settling for the end card
    lvl = np.interp(t, [0, 0.6, 6.4, 12.8, 19.2, 22.3, 22.45, 25.6, 30.4, 40], [0, 0.66, 0.72, 0.82, 0.95, 1.0, 1.22, 1.1, 0.92, 0.92])
    duck = 1 - 0.2 * pulse_depth(t) * np.exp(-np.mod(t, 0.8) / 0.22)  # gentle pump on each beat (75 BPM: 0.8 s)
    out *= (lvl * duck)[:, None]
    out = resample_poly(out, 2, 1, axis=0)[: N + TAIL]
    return out


def bass():
    t = np.arange(N + TAIL) / SR
    x = np.zeros_like(t)
    segs = []
    for i, c in enumerate(CH):
        if c["bass"] is None:
            continue
        a = CH_T[i]
        b = CH_T[i + 1] if i + 1 < len(CH) else t[-1]
        segs.append((a, b, c["bass"]))
    for a, b, m in segs:
        f = hz(m)
        rise = smoothstep(a - 0.02, a + 0.3, t)
        fallw = 1 - smoothstep(b - 0.05, b + 0.25, t)
        w = rise * fallw
        idx = w > 0
        tt = t[idx] - a
        sig = np.sin(2 * np.pi * f * tt) + 0.32 * np.sin(2 * np.pi * 2 * f * tt + 0.4) + 0.12 * np.sin(2 * np.pi * 3 * f * tt + 0.9)
        bloom = 1 + 0.35 * np.exp(-np.maximum(tt, 0) / 0.5)  # each chord change blooms, then settles
        x[idx] += w[idx] * sig * bloom
    beat = 1 + pulse_depth(t) * (0.55 * np.exp(-np.mod(t, 0.8) / 0.17) - 0.18)
    x *= beat * np.interp(t, [0, 2.4, 9.6, 99], [0.6, 0.6, 1.0, 1.0])
    x = np.tanh(1.2 * x) / np.tanh(1.2)
    return pan2(x, 0.0)


def water_bed():
    n = N + TAIL
    t = np.arange(n) / SR
    w = R.standard_normal((n, 2))
    b = lfilter([1.0], [1.0, -0.985], w, axis=0)
    b = sosfilt(sos("bandpass", [110, 1500]), b, axis=0)
    b /= np.max(np.abs(b))
    lap = 0.55 + 0.45 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.13 * t + 0.7)) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.31 * t + 2.1))
    fade = smoothstep(0, 3.0, t)
    return b * (lap * fade)[:, None]


# ------------------------------------------------------------------ render
LEVEL = {"drop": 0.55, "drip": 0.32, "kalimba": 0.3, "bell": 0.27, "harp": 0.3, "pluck": 0.3, "chime": 0.34, "whoosh": 0.2,
         "sub": 0.4, "swell": 0.24, "sparkle": 0.15, "breath": 0.16, "text": 0.06, "chord": 0.16}
SEND = {"drop": 0.3, "drip": 0.32, "kalimba": 0.35, "bell": 0.55, "harp": 0.42, "pluck": 0.32, "chime": 0.5, "whoosh": 0.22,
        "sub": 0.04, "swell": 0.15, "sparkle": 0.6, "breath": 0.3, "text": 0.35, "chord": 0.6}


def render():
    sfx, send = Bus(), Bus()
    placed = []
    for e in D["events"]:
        ty, f = e["type"], e["f"]
        g = e.get("gain", 1.0)
        pan = e.get("pan", 0.0)
        s0 = at(f)
        if ty in ("pad", "air"):
            continue
        if ty == "drop":
            sig = water_drop(hz(deg(e["deg"])), tau=0.09 if g > 0.9 else 0.075, tick=0.14 if g > 0.9 else 0.1)
        elif ty == "drip":
            sig = water_drop(hz(deg(e["deg"])), dur=0.3, tau=0.045, depth=0.42, body=0.25, tick=0.06)
        elif ty == "kalimba":
            sig = kalimba(hz(deg(e["deg"])))
        elif ty == "bell":
            sig = glass_bell(hz(deg(e["deg"])))
        elif ty == "harp":
            sig = harp(hz(deg(e["deg"])))
        elif ty == "pluck":
            sig = pluck(hz(deg(e["deg"])))
        elif ty == "chime":
            sig = chime(e["degs"])
        elif ty == "sub":
            sig = sub_boom()
        elif ty == "whoosh":
            sig = whoosh(e["dur"], e.get("pan0", 0), e.get("pan1", 0), e.get("rise", False), e.get("fall", False))
        elif ty == "swell":
            sig = rev_swell(e["dur"], hz(deg(e["deg"])))
            s0 -= len(sig)  # ends exactly on the event
        elif ty == "sparkle":
            sig = sparkle(e["dur"], e["density"])
        elif ty == "breath":
            sig = breath(e["dur"])
        elif ty == "text":
            sig = text_air()
        elif ty == "chord":
            sig = glass_chord(chord_at(f)["notes"])
        else:
            raise ValueError("unknown event type " + ty)
        lv = LEVEL[ty] * g
        sfx.add(sig, s0, pan, lv)
        send.add(sig, s0, pan, lv * SEND[ty])
        placed.append({"f": f, "type": ty, "sample": s0, "t": round(s0 / SR, 4)})
    print(f"{len(placed)} event sounds placed", file=sys.stderr)
    music = pad() * 0.04 + bass() * 0.07
    bed = water_bed() * 0.04
    send.x += music * 0.35
    s = send.x
    s = sosfilt(sos("highpass", 220), s, axis=0)
    s = sosfilt(sos("lowpass", 9000), s, axis=0)
    wet = np.stack([fftconvolve(s[:, 0], IR[:, 0])[: N + TAIL], fftconvolve(s[:, 1], IR[:, 1])[: N + TAIL]], 1)
    mix = sfx.x + music + bed + wet * 0.3
    mix = sosfilt(sos("highpass", 24), mix, axis=0)
    stems = {"sfx": sfx.x + wet * 0.3, "music": music, "bed": bed}
    return mix[:N], stems, placed


# ------------------------------------------------------------------ master
def measure(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)[-1])
    lra = float(re.findall(r"LRA:\s+(-?[\d.]+) LU", err)[-1])
    return I, tp, lra


def limit(x, ceiling_db=-1.5, look=0.003):
    """Look-ahead true-peak limiter: gain from the 4× oversampled peak, widened by a min-filter, then smoothed."""
    up = resample_poly(x, 4, 1, axis=0)
    pk = np.max(np.abs(up), axis=1)
    pk = pk[: len(pk) // 4 * 4].reshape(-1, 4).max(axis=1)[: len(x)]
    ceil = 10 ** (ceiling_db / 20)
    g = np.minimum(1.0, ceil / np.maximum(pk, 1e-12))
    w = int(look * SR) | 1
    g = minimum_filter1d(g, size=2 * w + 1)
    g = uniform_filter1d(g, size=w)
    limit.gain = g
    return x * g[:, None], float(1 - g.min())


def write(path, x):
    wavfile.write(path, SR, x.astype(np.float32))


def click_scan(x):
    """Flag waveform steps much larger than the local slope (a click is a discontinuity, not a transient)."""
    hits = []
    for ch in range(2):
        d = np.abs(np.diff(x[:, ch]))
        loc = uniform_filter1d(d, size=480) + 1e-6
        idx = np.where((d > 25 * loc) & (d > 0.05))[0]
        hits += [int(i) for i in idx]
    return sorted(set(hits))


if __name__ == "__main__":
    os.makedirs("build", exist_ok=True)
    mix, stems, placed = render()
    # fade the last 0.35 s so the file never ends on a non-zero sample
    n = int(0.35 * SR)
    mix[-n:] *= np.cos(np.linspace(0, np.pi / 2, n))[:, None] ** 2
    tmp = "build/_score_tmp.wav"
    gain_db = 0.0
    for it in range(8):
        y, red = limit(mix * 10 ** (gain_db / 20))
        write(tmp, y)
        I, tp, lra = measure(tmp)
        print(f"pass {it}: gain {gain_db:+.2f} dB → {I:.2f} LUFS, {tp:.2f} dBTP (limiter max {20 * np.log10(1 - red + 1e-12):.2f} dB)", file=sys.stderr)
        if abs(I + 14) <= 0.05 and tp <= -1.5 + 0.05:
            break
        gain_db += -14 - I
    os.replace(tmp, "build/score.wav")
    stem_l = {}
    for k, v in stems.items():
        write(tmp, v[:N] * 10 ** (gain_db / 20))
        stem_l[k] = round(measure(tmp)[0], 1)
    os.remove(tmp)
    clicks = click_scan(y)
    # where the limiter works (≥ 1 dB), grouped into regions
    gdb = 20 * np.log10(np.maximum(limit.gain, 1e-9))
    hot = np.where(gdb < -1.0)[0]
    regions = []
    for i in hot:
        if regions and i - regions[-1][1] < SR // 10:
            regions[-1][1] = i
            regions[-1][2] = min(regions[-1][2], gdb[i])
        else:
            regions.append([i, i, gdb[i]])
    lim = [{"from_s": round(r0 / SR, 3), "to_s": round(r1 / SR, 3), "max_reduction_db": round(float(m), 2)} for r0, r1, m in regions]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "build/score.wav", "-lavfi",
                    "showspectrumpic=s=1600x700:legend=1:fscale=log:scale=log:color=intensity:gain=1.5", "build/spectrogram.png"], check=True)
    rep = {"integrated_lufs": I, "true_peak_dbtp": tp, "lra_lu": lra, "sample_peak_dbfs": round(20 * np.log10(np.max(np.abs(y))), 2),
           "master_gain_db": round(gain_db, 2), "stem_lufs_in_mix": stem_l, "limiter_regions": lim, "clicks": len(clicks), "click_positions_s": [round(c / SR, 4) for c in clicks[:20]],
           "duration_s": len(y) / SR, "events": placed}
    json.dump(rep, open("build/audio_report.json", "w"), indent=1)
    print(json.dumps({k: v for k, v in rep.items() if k != "events"}, indent=1))
