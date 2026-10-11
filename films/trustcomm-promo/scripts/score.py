#!/usr/bin/env python3
"""Trustcomm 15 s launch film: the score, 100 % synthesized (numpy/scipy; no samples, no sound libraries).

A 120 BPM cue in D major (a beat = 0.5 s = 30 frames at 60 fps, so every hit lands on an exact frame) plus one designed
sound on every visual sync point listed in STORYBOARD.md ("Sound sync" per frame; global time = frame start + local).
  F1 0.0  hook: the loud red bar's shouts vs. quiet ticks · no kick yet
  F2 2.5  the drop: kick, bass, claps, hats start · QR swarm, module cascade, scan beep, chip pops
  F3 4.5  taps, chip tick, six rising language pops
  F4 7.5  page swipe, card whooshes, typing, badge pops (lighter groove)
  F5 10.0 swell into the unified pulse at 11.0 (chorus layer + pad)
  F6 12.5 reverse rush into the BIG hit at 12.75, CTA pop, URL ticks, sparkle tail
Master: −14 LUFS integrated, true peak ≤ −1.5 dBTP (4× oversampled look-ahead limiter), checked with ffmpeg EBU R128.

Usage: python3 -I scripts/score.py  → assets/score.wav, build/score-spectrogram.png, build/score-report.json
"""
import json, os, re, subprocess, sys
import numpy as np
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, fftconvolve, istft, resample_poly, sosfilt, sosfiltfilt, stft
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SR = 48000
DUR = 15.0
N = int(DUR * SR)
TAIL = 4 * SR
BEAT = 0.5
R = np.random.default_rng(20261011)


def hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def T(dur):
    return np.arange(int(round(dur * SR))) / SR


def S(t):  # seconds → sample index (all events are frame-exact: 800 samples per frame)
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
        i0 = S(t) if isinstance(t, float) else t
        i1 = i0 + len(sig)
        s0 = max(0, -i0)
        i0, i1 = max(0, i0), min(len(self.x), i1)
        if i1 > i0:
            self.x[i0:i1] += gain * sig[s0 : s0 + i1 - i0]


def make_ir(rt=1.8, length=2.6, pre=0.018, seed=5):
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
        ir[:, ch] = lo * env(1.1) + mid * env(1.0) + hi * env(0.45)
    ir *= (np.clip(t / 0.05, 0, 1) ** 1.5)[:, None]
    ir = np.vstack([np.zeros((int(pre * SR), 2)), ir])
    ir /= np.sqrt(np.sum(ir**2) / 2)
    return ir


IR = make_ir()
IRM = IR.mean(axis=1)[int(0.018 * SR) :]


# ------------------------------------------------------------------ drums
def kick(dur=0.45, punch=1.0):
    t = T(dur)
    f = 50 + 110 * np.exp(-t / 0.035)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    x += 0.35 * punch * sosfilt(sos("bandpass", [1500, 6000]), R.standard_normal(len(t))) * np.exp(-t / 0.004)
    x = np.tanh(1.6 * x)
    return edge(norm(x), 0.0005, 0.05)


def clap():
    t = T(0.3)
    n = R.standard_normal(len(t))
    env = np.zeros_like(t)
    for d in (0.0, 0.011, 0.023):
        env += np.where(t >= d, np.exp(-(t - d) / 0.008), 0)
    env += np.where(t >= 0.03, 0.6 * np.exp(-(t - 0.03) / 0.09), 0)
    x = sosfilt(sos("bandpass", [900, 2600]), n) * env
    return edge(norm(x), 0.0005, 0.04)


def hat(open_=False):
    t = T(0.18 if open_ else 0.06)
    x = sosfilt(sos("highpass", 7000), R.standard_normal(len(t))) * np.exp(-t / (0.06 if open_ else 0.014))
    return edge(norm(x), 0.0003, 0.01)


# ------------------------------------------------------------------ tonal
def saw(f, t, detune=(0.0,), kmax=40):
    # f may be a scalar or a per-sample array (vibrato); phase is integrated
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


def bass_note(m, dur):
    t = T(dur)
    f = hz(m)
    # 2nd harmonic keeps the line audible on phone/laptop speakers
    x = 0.8 * np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.35 * saw(f, t, kmax=8)
    x = sosfilt(sos("lowpass", 640), x)
    x *= (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.5)
    return edge(norm(x), 0.002, 0.03)


def pluck(m, dur=0.6, bright=1.0):
    t = T(dur)
    f = hz(m)
    x = np.zeros_like(t)
    for k in range(1, 18):
        if f * k > 14000:
            break
        x += abs(np.sin(k * np.pi * 0.16)) / k**1.05 * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (6 + 2.2 * k**1.3 / bright))
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


def chord_pad(notes, dur, bright=1800):
    t = T(dur)
    x = np.zeros((len(t), 2))
    for i, m in enumerate(notes):
        f = hz(m)
        for ch, det in ((0, (-7, 4)), (1, (-3, 8))):
            v = saw(f, t, detune=det, kmax=18)
            x[:, ch] += v
    for ch in range(2):
        x[:, ch] = sosfilt(sos("lowpass", bright), x[:, ch])
    env = (1 - np.exp(-t / 0.25)) * np.exp(-t / (dur * 1.4))
    return edge(x * env[:, None] / np.max(np.abs(x)), 0.01, 0.3)


def supersaw_stab(notes, dur=1.8):
    t = T(dur)
    x = np.zeros((len(t), 2))
    for m in notes:
        for ch, det in ((0, (-14, -5, 6)), (1, (-8, 3, 15))):
            x[:, ch] += saw(hz(m), t, detune=det, kmax=30)
    for ch in range(2):
        x[:, ch] = sosfilt(sos("lowpass", 5200), x[:, ch])
    env = (1 - np.exp(-t / 0.003)) * np.exp(-t / 0.55)
    return edge(x * env[:, None] / np.max(np.abs(x)), 0.0005, 0.2)


# ------------------------------------------------------------------ sound design
def shout(level=1.0):
    """The loud customer: a harsh, detuned, distorted cluster with a growl. Short and unpleasant on purpose."""
    t = T(0.42)
    x = np.zeros_like(t)
    for m in (50, 51, 57, 62, 63):  # D3 Eb3 A3 D4 Eb4: a sour cluster
        x += saw(hz(m) * (1 + 0.02 * np.sin(2 * np.pi * 31 * t)), t, kmax=25)
    x = np.tanh(3.5 * x / np.max(np.abs(x)))
    x = sosfilt(sos("bandpass", [180, 3600]), x)
    x += 0.4 * sosfilt(sos("bandpass", [300, 1200]), R.standard_normal(len(t))) * np.exp(-t / 0.05)
    x *= (1 - np.exp(-t / 0.002)) * np.exp(-t / 0.13)
    return edge(norm(x) * level, 0.0005, 0.06)


def tick(f=2800, dur=0.05):
    t = T(dur)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.008) + 0.3 * sosfilt(sos("highpass", 5000), R.standard_normal(len(t))) * np.exp(-t / 0.002)
    return edge(norm(x), 0.0002, 0.01)


def pop(m=81, dur=0.16):
    """UI pop: a short sine that drops a fifth, with a soft click — chips, badges, the CTA."""
    t = T(dur)
    f = hz(m) * (1 + 0.5 * np.exp(-t / 0.012))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.045)
    x += 0.15 * sosfilt(sos("highpass", 3000), R.standard_normal(len(t))) * np.exp(-t / 0.002)
    return edge(norm(x), 0.0003, 0.02)


def blip(m, dur=0.22):
    """Language pops: a glassy sine-plus-fifth blip, pitched up the D major pentatonic."""
    t = T(dur)
    x = np.sin(2 * np.pi * hz(m) * t) + 0.35 * np.sin(2 * np.pi * hz(m + 19) * t)
    x *= (1 - np.exp(-t / 0.002)) * np.exp(-t / 0.07)
    return edge(norm(x), 0.0003, 0.02)


def beep():
    """Scan beep: two short square-ish tones, up a fourth."""
    out = np.zeros(S(0.24))
    for i, f in enumerate((1760, 2349)):
        t = T(0.1)
        x = np.tanh(3 * np.sin(2 * np.pi * f * t)) * edge(np.ones_like(t), 0.003, 0.02)
        x = sosfilt(sos("lowpass", 6000), x)
        out[S(0.11 * i) : S(0.11 * i) + len(x)] += x
    return norm(out)


def thump(f0=95):
    t = T(0.22)
    x = np.sin(2 * np.pi * np.cumsum(f0 + 60 * np.exp(-t / 0.01)) / SR) * np.exp(-t / 0.06)
    return edge(norm(x), 0.0005, 0.03)


def key_click():
    t = T(0.04)
    x = sosfilt(sos("bandpass", [2500, 7000]), R.standard_normal(len(t))) * np.exp(-t / 0.004)
    return edge(norm(x), 0.0002, 0.005)


def shaped_noise(dur, fc_fn, bw_oct, env_fn):
    n = int(dur * SR)
    w = R.standard_normal(n + 2048)
    fr, tt, Z = stft(w, fs=SR, nperseg=1024, noverlap=768)
    fc = np.maximum(30.0, fc_fn(np.clip(tt / dur, 0, 1)))
    lf = np.log2(np.maximum(fr, 1.0))[:, None]
    G = np.exp(-0.5 * ((lf - np.log2(fc)[None, :]) / (bw_oct / 2)) ** 2)
    _, y = istft(Z * G, fs=SR, nperseg=1024, noverlap=768)
    return y[:n] * env_fn(np.arange(n) / n)


def whoosh(dur, kind="pass", pan0=0.0, pan1=0.0):
    if kind == "rise":
        fc, env = (lambda u: 250 * 14 ** (u**1.4)), (lambda u: u**2.2 * (1 - smoothstep(0.96, 1.0, u)))
    elif kind == "fall":
        fc, env = (lambda u: 4500 * 0.15**u), (lambda u: np.sin(np.pi * u) ** 1.4)
    else:
        fc, env = (lambda u: 350 + 3200 * np.sin(np.pi * u) ** 2), (lambda u: np.sin(np.pi * np.clip(u, 0, 1)) ** 2)
    a, b = shaped_noise(dur, fc, 1.3, env), shaped_noise(dur, fc, 1.3, env)
    u = np.arange(len(a)) / len(a)
    st = pan2(0.85 * a, pan0 + (pan1 - pan0) * smoothstep(0, 1, u)) + 0.25 * np.stack([b, -b], 1)
    return edge(st / max(1e-12, np.max(np.abs(st))), 0.004, 0.01)


def rev_swell(dur, notes):
    hit = sum(bell(m, 1.4) for m in notes)
    wet = fftconvolve(hit, IRM)[: S(dur + 0.03)]
    y = wet[::-1].copy() * np.linspace(0, 1, len(wet[: S(dur + 0.03)])) ** 2.2
    return edge(norm(y), 0.01, 0.004)


def crash():
    t = T(2.2)
    x = sosfilt(sos("highpass", 3500), R.standard_normal(len(t))) * np.exp(-t / 0.55)
    x += 0.4 * sosfilt(sos("bandpass", [5000, 9000]), R.standard_normal(len(t))) * np.exp(-t / 0.2)
    return edge(norm(x), 0.0005, 0.3)


def sub_hit():
    t = T(1.6)
    f = 36 + 40 * np.exp(-t / 0.08)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-t / 0.002)) * np.exp(-t / 0.45)
    x += 0.3 * sosfilt(sos("bandpass", [80, 400]), np.tanh(3 * x))
    return edge(norm(x), 0.0005, 0.2)


def sparkle(dur, density, base=86):
    out = np.zeros((S(dur + 0.4), 2))
    times = np.sort(R.uniform(0, dur, int(density * dur)))
    pent = [0, 2, 4, 7, 9]
    for i, ti in enumerate(times):
        m = base + pent[int(R.integers(0, 5))] + 12 * int(R.integers(0, 2))
        s = bell(m, 0.35, bright=0.6) * np.sin(np.pi * ti / dur) ** 1.2 * R.uniform(0.4, 1)
        out[S(ti) : S(ti) + len(s)] += pan2(s, R.uniform(-0.8, 0.8))
    return out / np.max(np.abs(out))


# ------------------------------------------------------------------ the arrangement
D_MAJ = {"D": [50, 54, 57, 62], "A": [45, 52, 57, 61], "Bm": [47, 54, 59, 62], "G": [43, 50, 55, 59]}
BARS = [None, "D", "A", "Bm", "G", "D", "A", "D"]  # bar b covers [2b, 2b+2) s; bar 0 = the hook (no harmony)
ROOT = {"D": 38, "A": 33, "Bm": 35, "G": 31}
EVENTS = []  # (time s, label) — the report lists every placed sync sound


def ev(t, label):
    EVENTS.append((round(t, 4), label))


def render():
    mus, sfx, send = Bus(), Bus(), Bus()
    kick_s, clap_s, hh, oh = kick(), clap(), hat(), hat(True)

    # ---- groove: starts on the drop at 2.5 s (F2); lighter during F4; big again from F5; stops after the final hit
    t = 2.5
    while t < 12.75 - 1e-9:
        light = 7.5 <= t < 10.0
        if not (light and (t % 1.0) >= 0.5):  # F4: kick on 1 and 3 only
            mus.add(kick_s, t, 0, 0.85)
        t += BEAT
    for b in range(2, 13 * 2):  # claps on beats 2 and 4 of each bar
        tc = b * BEAT
        if 2.5 <= tc < 12.75 and (tc % 2.0) in (0.5, 1.5) and not (7.5 <= tc < 10.0 and (tc % 2.0) == 1.5):
            mus.add(clap_s, tc, 0.05, 0.45)
            send.add(clap_s, tc, 0.05, 0.18)
    t = 2.75
    while t < 12.75:
        mus.add(hh, t, 0.3, 0.16 if 7.5 <= t < 10 else 0.22)
        t += BEAT
    t = 10.0
    while t < 12.75:  # chorus: 16th hats
        mus.add(hh, t + 0.125, -0.3, 0.09)
        mus.add(hh, t + 0.375, -0.3, 0.09)
        t += BEAT
    mus.add(oh, 12.25, 0.2, 0.2)

    # ---- bass: 8th notes on the chord root, ducked after each kick (sidechain feel)
    t = 2.5
    while t < 12.75 - 1e-9:
        ch = BARS[int(t // 2)]
        if ch:
            on_beat = abs((t / BEAT) - round(t / BEAT)) < 1e-6
            note = bass_note(ROOT[ch] + (12 if (not on_beat and 10 <= t < 12.75) else 0), 0.24)
            mus.add(note, t, 0, 0.28 if on_beat else 0.42)
        t += BEAT / 2

    # ---- plucked chord arpeggio in 8ths (F2–F5), brighter in the chorus
    pat = [0, 2, 1, 3, 2, 1, 3, 2]
    t, i = 2.5, 0
    while t < 12.75 - 1e-9:
        ch = BARS[int(t // 2)]
        if ch:
            m = D_MAJ[ch][1 + pat[i % 8] % 3] + 12
            p = pluck(m, 0.5, bright=1.4 if t >= 10 else 1.0)
            pn = -0.35 if i % 2 else 0.35
            mus.add(p, t, pn, 0.26 if 7.5 <= t < 10 else 0.31)
            send.add(p, t, pn, 0.12)
        t += BEAT / 2
        i += 1

    # ---- pads: a low tension drone under the hook; full pads in the chorus and on the end card
    drone = chord_pad([38, 45], 2.6, bright=600)
    mus.add(drone, 0.0, 0, 0.18)
    mus.add(chord_pad(D_MAJ["D"], 2.1, 2200), 10.0, 0, 0.28)
    mus.add(chord_pad(D_MAJ["A"], 0.8, 2400), 12.0, 0, 0.25)
    send.add(chord_pad(D_MAJ["D"], 2.1, 2200), 10.0, 0, 0.1)

    # ---- F1 hook
    for tt, lv in ((0.0, 1.0), (0.75, 1.0), (1.5, 0.85)):
        sfx.add(shout(lv), tt, 0.0, 0.55)
        sfx.add(sub_hit()[: S(0.5)] * np.hanning(S(1.0))[S(0.5) :], tt, 0, 0.35)
        send.add(shout(lv), tt, 0, 0.12)
        ev(tt, "shout (loud red bar)")
    for tt in (0.25, 0.5, 1.25):
        sfx.add(tick(3400), tt, 0.0, 0.22)
        ev(tt, "word tick")
    for tt in (1.0, 2.0):  # the quiet bars' polite flicker: 12 tiny ticks rippling outward, almost inaudible
        for j in range(6):
            for side in (-1, 1):
                sfx.add(tick(4200 + 140 * j, 0.03), tt + 0.02 * j, 0.12 * side * (j + 1) / 6, 0.035)
        ev(tt, "quiet flicker")
    sfx.add(whoosh(0.3, "fall"), 2.2, 0, 0.3)
    ev(2.25, "whoosh down (headline clears)")
    sfx.add(whoosh(1.0, "rise"), 1.5, 0, 0.32)  # riser into the drop

    # ---- F2 QR (2.5)
    sfx.add(whoosh(0.5, "rise", -0.2, 0.2), 2.5, 0, 0.3)
    ev(2.5, "swarm whoosh up")
    for j in range(16):  # module cascade: rapid ascending ticks 3.0–3.5
        tt = 3.0 + j * (0.5 / 16)
        sfx.add(tick(2200 + 90 * j, 0.03), tt, ((j * 7) % 9) / 4.5 - 1, 0.07)
    ev(3.0, "module cascade (16 ticks to 3.5)")
    sfx.add(thump(140), 3.5, 0, 0.35)
    sfx.add(tick(5200, 0.04), 3.5, 0, 0.18)
    ev(3.5, "finder snap")
    sfx.add(thump(85), 4.0, 0, 0.5)
    sfx.add(key_click(), 4.0, 0, 0.25)
    ev(4.0, "phone lands + brackets snap")
    sfx.add(pop(81), 4.0, 0.35, 0.3)
    ev(4.0, "chip pop: No app")
    sfx.add(beep(), 4.2, 0, 0.18)
    ev(4.2, "scan beep")
    sfx.add(pop(86), 4.25, 0.4, 0.3)
    ev(4.25, "chip pop: No sign-in")

    # ---- F3 rate (4.5)
    sfx.add(whoosh(0.25, "pass", 0.4, 0.6), 4.5, 0, 0.2)
    ev(4.5, "headline swap whoosh")
    for tt in (5.0, 5.5):
        sfx.add(key_click(), tt, -0.25, 0.3)
        for j in range(5):  # stars fill left→right in 0.12 s
            sfx.add(tick(1900 + 220 * j, 0.04), tt + 0.024 * j, -0.35 + 0.05 * j, 0.09)
        ev(tt, "tap + star fill")
    sfx.add(pop(78, 0.12), 5.75, -0.2, 0.25)
    ev(5.75, "mention chip tick")
    pent_up = [74, 76, 78, 81, 83, 86]  # D5 E5 F#5 A5 B5 D6
    for j, tt in enumerate((6.0, 6.5, 6.875, 7.125, 7.25, 7.375)):
        sfx.add(blip(pent_up[j]), tt, 0.3, 0.3)
        send.add(blip(pent_up[j]), tt, 0.3, 0.12)
        ev(tt, f"language pop {j + 1}")

    # ---- F4 choice (7.5)
    sfx.add(whoosh(0.22, "pass", 0.3, -0.5), 7.5, 0, 0.22)
    ev(7.5, "page swipe")
    sfx.add(whoosh(0.45, "pass", 0, -0.8), 8.0, 0, 0.3)
    sfx.add(whoosh(0.45, "pass", 0, 0.8), 8.0, 0, 0.3)
    ev(8.0, "double whoosh (cards fly to the wings)")
    sfx.add(thump(110), 8.4, 0, 0.3)
    ev(8.4, "cards land")
    for j in range(12):
        sfx.add(key_click(), 8.4 + j * (0.5 / 12) + 0.006 * ((j * 5) % 3), -0.45, 0.1)
    ev(8.4, "typing ticks (to 8.9)")
    sfx.add(whoosh(0.25, "fall"), 8.45, 0, 0.12)
    ev(8.5, "title slides down")
    sfx.add(pop(83), 9.0, -0.35, 0.32)
    ev(9.0, "badge pop: Private")
    sfx.add(pop(86), 9.25, 0.35, 0.32)
    ev(9.25, "badge pop: Public, in their name")

    # ---- F5 chorus (10.0)
    sfx.add(whoosh(0.3, "pass", -0.5, 0.5), 10.0, 0, 0.2)
    ev(10.0, "card fold swish")
    sfx.add(whoosh(0.5, "rise"), 10.5, 0, 0.28)
    sfx.add(rev_swell(0.5, [74, 78, 81]), S(11.0) - S(0.5), 0, 0.25)
    ev(10.5, "rising swell")
    for j, tt in enumerate((10.5, 10.625, 10.75, 10.875, 11.0, 11.125)):
        sfx.add(tick(2600 + 150 * j, 0.04), tt, 0, 0.12)
    ev(10.5, "word hits on 8ths (to 11.125)")
    sfx.add(supersaw_stab(D_MAJ["D"] + [66], 1.2), 11.0, 0, 0.3)
    sfx.add(sub_hit(), 11.0, 0, 0.35)
    send.add(supersaw_stab(D_MAJ["D"] + [66], 1.2), 11.0, 0, 0.15)
    ev(11.0, "unified pulse hit")
    sfx.add(bell(86, 1.4), 11.5, 0.2, 0.16)
    sfx.add(bell(93, 1.2), 11.5, -0.2, 0.12)
    send.add(bell(86, 1.4), 11.5, 0.2, 0.2)
    ev(11.5, "sub-line chime")
    sfx.add(whoosh(0.5, "rise", -0.3, 0.3), 12.25, 0, 0.25)
    ev(12.25, "gather whoosh")

    # ---- F6 CTA (12.5)
    sfx.add(rev_swell(0.25, [74, 81, 86]), S(12.75) - S(0.25), 0, 0.35)
    ev(12.5, "inward rush (reverse swell into 12.75)")
    sfx.add(kick(0.6, 1.4), 12.75, 0, 0.8)
    sfx.add(sub_hit(), 12.75, 0, 0.45)
    sfx.add(crash(), 12.75, 0, 0.3)
    stab = supersaw_stab(D_MAJ["D"] + [66, 69, 74], 2.0)
    sfx.add(stab, 12.75, 0, 0.42)
    send.add(stab, 12.75, 0, 0.25)
    shim = sparkle(1.6, 14)
    sfx.add(shim, 12.8, 0, 0.18)
    send.add(shim, 12.8, 0, 0.2)
    ev(12.75, "BIG hit + shimmer (logo burst)")
    sfx.add(pop(81), 13.5, 0, 0.38)
    sfx.add(bass_note(38, 0.6), 13.5, 0, 0.25)
    ev(13.5, "CTA pop")
    sfx.add(bell(81, 1.4), 13.75, 0.15, 0.2)
    send.add(bell(81, 1.4), 13.75, 0.15, 0.2)
    ev(13.75, "soft chime (No card needed)")
    for j in range(13):  # "trustcomm.app" = 13 characters typed in 0.25 s
        sfx.add(key_click(), 14.0 + j * (0.25 / 13), 0.1, 0.12)
    ev(14.0, "URL type ticks (to 14.25)")
    tail = sparkle(0.6, 10, base=93)
    sfx.add(tail, 14.5, 0, 0.12)
    send.add(tail, 14.5, 0, 0.2)
    sfx.add(chord_pad(D_MAJ["D"] + [69], 1.6, 3000), 13.0, 0, 0.16)
    ev(14.5, "sparkle tail")

    s = sosfilt(sos("highpass", 200), send.x, axis=0)
    wet = np.stack([fftconvolve(s[:, 0], IR[:, 0])[: N + TAIL], fftconvolve(s[:, 1], IR[:, 1])[: N + TAIL]], 1)
    mix = mus.x + sfx.x + 0.3 * wet
    mix = sosfilt(sos("highpass", 30), mix, axis=0)
    mix -= 0.3 * sosfiltfilt(sos("lowpass", 90), mix, axis=0)  # zero-phase low shelf, about -3 dB below 90 Hz
    return mix[:N], {"music": mus.x[:N], "sfx": sfx.x[:N] + 0.3 * wet[:N]}


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


if __name__ == "__main__":
    os.makedirs("build", exist_ok=True)
    mix, stems = render()
    n = S(0.3)
    mix[-n:] *= np.cos(np.linspace(0, np.pi / 2, n))[:, None] ** 2
    tmp = "build/_score_tmp.wav"
    gain = 0.0
    for it in range(8):
        y, g = limit(mix * 10 ** (gain / 20))
        write(tmp, y)
        I, tp, lra = measure(tmp)
        print(f"pass {it}: gain {gain:+.2f} dB → {I:.2f} LUFS, {tp:.2f} dBTP, limiter max {20 * np.log10(g.min()):.2f} dB", file=sys.stderr)
        if abs(I + 14) <= 0.05 and tp <= -1.45:
            break
        gain += -14 - I
    os.replace(tmp, "assets/score.wav")
    stem_l = {}
    for k, v in stems.items():
        write(tmp, v * 10 ** (gain / 20))
        stem_l[k] = round(measure(tmp)[0], 1)
    os.remove(tmp)
    gdb = 20 * np.log10(np.maximum(g, 1e-9))
    hot, regions = np.where(gdb < -1.0)[0], []
    for i in hot:
        if regions and i - regions[-1][1] < SR // 10:
            regions[-1][1], regions[-1][2] = i, min(regions[-1][2], gdb[i])
        else:
            regions.append([i, i, gdb[i]])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "assets/score.wav", "-lavfi",
                    "showspectrumpic=s=1600x700:legend=1:fscale=log:scale=log:color=intensity:gain=1.5", "build/score-spectrogram.png"], check=True)
    rep = {"integrated_lufs": I, "true_peak_dbtp": tp, "lra_lu": lra, "master_gain_db": round(gain, 2), "stems_lufs_in_mix": stem_l,
           "limiter_regions": [{"from_s": round(a / SR, 3), "to_s": round(b / SR, 3), "max_db": round(float(m), 2)} for a, b, m in regions],
           "clicks": len(click_scan(y)), "duration_s": len(y) / SR, "sync_events": [{"t": t, "sound": l} for t, l in sorted(EVENTS)]}
    json.dump(rep, open("build/score-report.json", "w"), indent=1)
    print(json.dumps({k: v for k, v in rep.items() if k != "sync_events"}, indent=1))
