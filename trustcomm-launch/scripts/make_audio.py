#!/usr/bin/env python3
"""Synthesize the trustcomm launch film's music bed and SFX, cue-locked to index.html.

Everything is generated procedurally (no samples, no paid APIs), so it is
royalty-free and reproducible. Outputs (48 kHz, 24-bit stereo WAV):

  assets/audio/music-bed.wav   music only
  assets/audio/sfx.wav         sound effects only
  assets/audio/mix.wav         music + SFX (what the rendered MP4 carries)
  assets/audio/sfx/*.wav       individual one-shot SFX for re-editing

Stems share the same gain as the mix, so they can be re-balanced under a
voiceover in any editor. Cue times below mirror the GSAP timeline in index.html;
if you move an animation, move its cue here and re-run:

  python3 scripts/make_audio.py
"""
import json
import os
import subprocess

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
LEN = 47.0
N = int(SR * LEN)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "audio")
rng = np.random.default_rng(20260929)


# ---------------------------------------------------------------- helpers
def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def env_ad(dur, a=0.005, d=None, curve=6.0):
    t = t_axis(dur)
    e = np.minimum(1.0, t / max(a, 1e-4))
    d = d if d is not None else dur
    return e * np.exp(-curve * np.maximum(0, t - a) / d)


def fade_tail(x, ms=15):
    n = min(len(x), int(SR * ms / 1000))
    if n:
        x[-n:] *= np.linspace(1, 0, n)
    return x


def filt(x, kind, f, order=2):
    if isinstance(f, (list, tuple)):
        f = [min(v, SR / 2 - 100) for v in f]
    else:
        f = min(f, SR / 2 - 100)
    sos = butter(order, f, btype=kind, fs=SR, output="sos")
    return sosfilt(sos, x)


def noise(dur):
    return rng.standard_normal(int(SR * dur))


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def place(buf, x, t, gain=1.0, pan=0.0):
    """Add mono or stereo x into stereo buf at time t."""
    i = int(round(t * SR))
    if i >= buf.shape[0]:
        return
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * l * 1.414, x * r * 1.414], axis=1)
    n = min(len(x), buf.shape[0] - i)
    buf[i:i + n] += x[:n] * gain


# ---------------------------------------------------------------- instruments
def pluck(f, dur=0.9, bright=1.0):
    t = t_axis(dur)
    y = np.zeros_like(t)
    for h, amp in [(1, 1.0), (2, 0.5), (3, 0.28), (4, 0.16), (5, 0.08), (6, 0.05)]:
        y += amp * bright ** (h - 1) * np.sin(2 * np.pi * f * h * t) * np.exp(-t * (3.5 + 2.2 * h))
    y *= np.minimum(1, t / 0.003)
    return fade_tail(y * 0.5)


def mallet(f, dur=1.2):
    t = t_axis(dur)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2) + 0.35 * np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-t * 9)
    y += 0.15 * np.sin(2 * np.pi * f * 9.9 * t) * np.exp(-t * 20)
    return fade_tail(y * np.minimum(1, t / 0.002) * 0.5)


def pad(freqs, dur, attack=0.6, release=0.8, cutoff=2200):
    t = t_axis(dur)
    y = np.zeros_like(t)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ff = f * 2 ** (det / 12)
            for h in range(1, 7):
                y += np.sin(2 * np.pi * ff * h * t + h * det * 7) / h
    y = filt(y, "low", cutoff)
    e = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, dur - t) / release)
    return y * e / (len(freqs) * 6)


def bass(f, dur=0.45):
    t = t_axis(dur)
    y = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    e = np.minimum(1, t / 0.006) * np.exp(-t * 3.0)
    return fade_tail(y * e * 0.6)


def kick(dur=0.38):
    t = t_axis(dur)
    f = 45 + 95 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t * 9) + 0.25 * filt(noise(dur), "low", 3000) * np.exp(-t * 90)
    return fade_tail(y * 0.9)


def clap(dur=0.25):
    t = t_axis(dur)
    n = filt(noise(dur), "band", [900, 2600])
    e = np.zeros_like(t)
    for o in (0, 0.011, 0.022):
        e += (t >= o) * np.exp(-np.maximum(0, t - o) * 60)
    e += 0.6 * np.exp(-t * 16)
    return fade_tail(n * e * 0.35)


def hat(dur=0.06, open_=False):
    d = 0.22 if open_ else dur
    t = t_axis(d)
    y = filt(noise(d), "high", 7500) * np.exp(-t * (14 if open_ else 70))
    return fade_tail(y * 0.25)


def shaker(dur=0.09):
    t = t_axis(dur)
    y = filt(noise(dur), "band", [5000, 11000]) * np.sin(np.pi * t / dur) ** 2
    return y * 0.12


# ---------------------------------------------------------------- SFX
def sfx_pop(f=600, dur=0.14):
    t = t_axis(dur)
    fr = f * (1 + 1.4 * np.exp(-t * 60))
    y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 32)
    return fade_tail(y * 0.8)


def sfx_click(dur=0.03):
    t = t_axis(dur)
    y = filt(noise(dur), "band", [2000, 6000]) * np.exp(-t * 300) + 0.5 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 250)
    return fade_tail(y * 0.7)


def sfx_tick(f=3200):
    t = t_axis(0.025)
    return fade_tail(np.sin(2 * np.pi * f * t) * np.exp(-t * 260) * 0.5)


def sfx_whoosh(dur=0.6, lo=300, hi=4000, peak=0.6):
    t = t_axis(dur)
    n = noise(dur)
    out = np.zeros_like(n)
    seg = 480
    for i in range(0, len(n), seg):
        p = i / len(n)
        fc = lo * (hi / lo) ** (np.sin(np.pi * min(1, p / peak) / 2) if p < peak else 1 - (p - peak) / (1 - peak) * 0.6)
        out[i:i + seg] = filt(n[max(0, i - 2000):i + seg], "band", [fc * 0.6, fc * 1.6])[-len(n[i:i + seg]):]
    e = np.where(t < peak * dur, (t / (peak * dur)) ** 2, np.exp(-(t - peak * dur) * 9))
    return fade_tail(out * e * 0.9)


def sfx_riser(dur=1.0):
    t = t_axis(dur)
    f = 180 * (8 ** (t / dur))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    n = filt(noise(dur), "high", 1500) * 0.5
    e = (t / dur) ** 2.2
    return fade_tail((tone + n) * e * 0.8, 5)


def sfx_impact(dur=1.4):
    t = t_axis(dur)
    f = 38 + 80 * np.exp(-t * 12)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    crack = filt(noise(dur), "low", 5000) * np.exp(-t * 35) * 0.6
    return fade_tail((sub + crack) * 0.9)


def sfx_chime(notes=(84, 88, 91), spacing=0.07, dur=1.6):
    y = np.zeros(int(SR * (dur + spacing * len(notes))))
    for i, n in enumerate(notes):
        m = mallet(midi(n), dur)
        s = int(SR * i * spacing)
        y[s:s + len(m)] += m
    return y * 0.8


def sfx_shimmer(dur=1.2):
    t = t_axis(dur)
    y = np.zeros_like(t)
    for k, f in enumerate([2093, 2637, 3136, 3951, 4699, 5274]):
        y += np.sin(2 * np.pi * f * t + k) * (0.5 + 0.5 * np.sin(2 * np.pi * (7 + k * 1.3) * t)) * np.exp(-t * (2.5 + k * 0.4))
    return fade_tail(y * np.minimum(1, t / 0.02) * 0.12)


def sfx_beep(f=1760, dur=0.12):
    t = t_axis(dur)
    y = np.sign(np.sin(2 * np.pi * f * t)) * 0.18 + np.sin(2 * np.pi * f * t) * 0.3
    return fade_tail(filt(y, "low", 6000) * np.minimum(1, t / 0.004))


def sfx_type(chars, dur):
    """Keyboard clicks spread over dur."""
    y = np.zeros(int(SR * (dur + 0.1)))
    r = np.random.default_rng(7)
    for i in range(chars):
        c = sfx_click() * (0.5 + 0.4 * r.random())
        c = filt(c, "band", [1500 + 2500 * r.random(), 9000])
        s = int(SR * (dur * i / chars + 0.012 * r.random()))
        y[s:s + len(c)] += c
    return y


def sfx_uhoh():
    return np.concatenate([mallet(midi(64), 0.18) * 0.7, mallet(midi(59), 0.7) * 0.7])


def sfx_hum(dur=1.1):
    t = t_axis(dur)
    y = np.sin(2 * np.pi * 420 * t) * 0.3 + np.sin(2 * np.pi * 840 * t) * 0.1
    y *= 0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)
    return fade_tail(y * np.minimum(1, t / 0.05) * 0.35, 60)


def sfx_rattle(dur=0.9):
    y = np.zeros(int(SR * dur))
    for i in range(10):
        c = filt(noise(0.05), "band", [300, 1800]) * np.exp(-t_axis(0.05) * 70) * 0.35
        s = int(SR * i * 0.09)
        y[s:s + len(c)] += c
    return y


# ---------------------------------------------------------------- music
# 120 BPM, 4/4, bars start on odd seconds so drops land on scene cuts (5, 11, 17, 31, 37, 41).
BEAT = 0.5
BAR0 = 1.0
PROG = [  # (bass midi, chord midis)
    (48, [60, 64, 67, 71]),  # Cmaj7
    (43, [59, 62, 67, 69]),  # G6/B-ish
    (45, [57, 60, 64, 67]),  # Am7
    (41, [57, 60, 65, 69]),  # Fmaj7
]
ARP = [0, 2, 1, 3, 2, 1, 3, 2]


def section(t):
    if t < 5.0:
        return "intro"
    if t < 11.0:
        return "tension"
    if t < 37.0:
        return "main"
    if t < 41.0:
        return "lift"
    return "outro"


def build_music():
    m = np.zeros((N, 2))
    # intro pad from 0
    bar = -1
    while True:
        bs = BAR0 + bar * 2.0
        if bs >= LEN:
            break
        b_idx = bar % 4
        root, chord = PROG[b_idx]
        sec = section(max(bs, 0) + 0.01)
        if sec == "tension":
            root, chord = [(45, [57, 60, 64, 69]), (41, [57, 60, 65, 69])][b_idx % 2]
        # pad
        if bs + 2 > 0 and sec != "outro":
            p = pad([midi(n) for n in chord], 2.3, attack=0.4 if sec != "intro" else 0.9, release=0.5,
                    cutoff=1200 if sec == "tension" else 2600)
            st = max(bs, 0)
            place(m, p[int((st - bs) * SR):], st, 0.55 if sec != "main" else 0.42)
        for eighth in range(8):
            t = bs + eighth * BEAT / 2
            if t < 0 or t >= LEN:
                continue
            sec = section(t)
            # arp plucks
            if sec in ("intro", "main", "lift") and not (sec == "intro" and eighth % 2):
                n = chord[ARP[eighth]] + 12
                place(m, pluck(midi(n), 0.7, 0.8), t, 0.30 if sec == "intro" else 0.26, pan=-0.35 if eighth % 2 else 0.35)
            if sec == "tension" and eighth in (0, 3, 6):
                place(m, pluck(midi(chord[0]), 0.9, 0.5), t, 0.22, pan=-0.2)
            # drums
            beat_i = eighth // 2
            on_beat = eighth % 2 == 0
            if sec in ("main", "lift"):
                if on_beat:
                    place(m, kick(), t, 0.55)
                if on_beat and beat_i in (1, 3):
                    place(m, clap(), t, 0.45)
                place(m, hat(open_=not on_beat and sec == "lift"), t, 0.28 if not on_beat else 0.16, pan=0.3)
                place(m, shaker(), t + BEAT / 4, 0.8, pan=-0.3)
                if eighth in (0, 3, 6):
                    place(m, bass(midi(root)), t, 0.55)
            if sec == "tension" and on_beat:
                place(m, hat(), t, 0.10, pan=0.4)
                if eighth == 0:
                    place(m, bass(midi(root), 0.9), t, 0.45)
        bar += 1
    # snare-ish fill into endcard
    for i, t in enumerate(np.arange(40.25, 40.9, 0.125)):
        place(m, clap(), t, 0.18 + i * 0.05)
    # outro: big Cadd9 chord on the logo hit, long tail
    chord = [48, 55, 60, 62, 64, 67, 72]
    place(m, pad([midi(n) for n in chord], 5.4, attack=0.05, release=2.6, cutoff=3000), 41.35, 0.75)
    for i, n in enumerate([72, 76, 79, 84]):
        place(m, pluck(midi(n), 2.0, 0.9), 41.95 + i * 0.12, 0.28, pan=(-0.4, 0.4)[i % 2])
    place(m, bass(midi(36), 3.0), 41.95, 0.6)
    place(m, kick(), 41.95, 0.6)
    # final little sign-off plucks
    for i, n in enumerate([79, 84]):
        place(m, pluck(midi(n), 1.6, 0.9), 44.4 + i * 0.25, 0.2)
    # master fade
    t = np.arange(N) / SR
    m *= np.clip((LEN - 0.2 - t) / 1.2, 0, 1)[:, None]
    return m


# ---------------------------------------------------------------- SFX cue sheet (mirrors index.html)
def build_sfx():
    s = np.zeros((N, 2))
    kit = {}

    def cue(name, x, t, g=1.0, pan=0.0):
        kit.setdefault(name, x)
        place(s, x, t, g, pan)

    # S1 hook
    for i, (t, f) in enumerate([(0.53, 520), (0.68, 620), (0.83, 700), (0.98, 830)]):
        cue("pop", sfx_pop(f), t, 0.55, pan=(-0.45, -0.15, 0.15, 0.45)[i])
    cue("whoosh_small", sfx_whoosh(0.35, 800, 5000, 0.8), 1.30, 0.35)
    cue("star_chime", sfx_chime((84, 88, 91, 96)), 1.62, 0.55)
    cue("shimmer", sfx_shimmer(), 1.62, 0.8)
    cue("tick", sfx_tick(), 2.50, 0.35)
    cue("tick", sfx_tick(2600), 3.15, 0.3)
    cue("swish", sfx_whoosh(0.3, 2000, 7000, 0.7), 3.85, 0.25)
    # transitions (iris / slide): whoosh peaks as the cover lands
    for t, big in [(4.55, False), (10.90, True), (15.90, False), (29.90, False), (36.90, False), (40.90, True)]:
        w = sfx_whoosh(0.9 if big else 0.7, 250, 4500 if big else 3500, 0.62)
        cue("whoosh_big" if big else "whoosh", w, t - 0.15, 0.7 if big else 0.55)
    # S2 problem
    cue("thud", sfx_pop(160, 0.22), 5.40, 0.5)
    cue("bonk", sfx_uhoh(), 5.78, 0.35)
    for t in (6.30, 6.85, 7.40, 8.55, 9.15):
        cue("card_pop", sfx_pop(420, 0.12), t + 0.05, 0.45)
    cue("typing_url", sfx_type(34, 1.05), 7.55, 0.5)
    cue("uhoh", sfx_uhoh(), 9.30, 0.45)
    cue("rattle", sfx_rattle(), 9.85, 0.6)
    cue("riser", sfx_riser(1.1), 9.85, 0.55)
    # S3 reveal
    cue("tick", sfx_tick(2400), 11.62, 0.35)
    cue("whoosh_up", sfx_whoosh(0.45, 400, 6000, 0.85), 11.85, 0.4)
    cue("impact", sfx_impact(), 12.15, 0.45)
    cue("logo_chime", sfx_chime((79, 84, 88, 91, 96), 0.06, 2.0), 12.20, 0.5)
    cue("shimmer", sfx_shimmer(1.6), 12.25, 0.9)
    cue("tick", sfx_tick(2200), 13.05, 0.25)
    for i in range(5):
        cue("chip_pop", sfx_pop(700 + 90 * i, 0.1), 13.80 + 0.14 * i, 0.35, pan=-0.5 + 0.25 * i)
    # S4 how it works
    cue("swoosh_ui", sfx_whoosh(0.5, 300, 3000, 0.5), 16.80, 0.45, pan=0.4)
    cue("swoosh_ui", sfx_whoosh(0.5, 300, 3000, 0.5), 17.00, 0.35, pan=0.1)
    for t in (17.70, 21.00, 25.00):
        cue("ui_tick", sfx_tick(1900), t, 0.4, pan=-0.4)
    cue("scan_hum", sfx_hum(1.1), 18.45, 0.4, pan=0.4)
    cue("scan_beep", sfx_beep(), 19.58, 0.45, pan=0.4)
    cue("success_small", sfx_chime((88, 95), 0.06, 0.9), 19.62, 0.35, pan=0.4)
    cue("swipe", sfx_whoosh(0.3, 1200, 6000, 0.6), 20.20, 0.3, pan=0.4)
    for i, t in enumerate([21.60, 21.78, 21.96, 22.14, 22.32]):
        cue("star_twinkle", mallet(midi([79, 81, 83, 84, 88][i]), 0.6), t + 0.03, 0.4, pan=0.2 + 0.1 * i)
    cue("shimmer", sfx_shimmer(0.8), 22.36, 0.5, pan=0.4)
    cue("typing_note", sfx_type(38, 1.6), 22.80, 0.45, pan=0.4)
    cue("ready", sfx_pop(900, 0.12), 24.58, 0.35, pan=0.4)
    cue("tap", sfx_click(), 25.72, 0.8, pan=0.5)
    cue("whoosh_small", sfx_whoosh(0.35, 800, 5000, 0.8), 25.25, 0.25, pan=0.1)
    cue("card_pop", sfx_pop(480, 0.12), 25.80, 0.35, pan=0.1)
    cue("swipe", sfx_whoosh(0.3, 1200, 6000, 0.6), 26.15, 0.3, pan=0.4)
    cue("success", sfx_chime((84, 88, 91, 96), 0.07, 1.4), 26.58, 0.5, pan=0.3)
    cue("fly", sfx_whoosh(0.55, 500, 5000, 0.55), 27.00, 0.45, pan=0.0)
    cue("notify", sfx_chime((91, 96), 0.09, 1.2), 27.50, 0.5, pan=-0.1)
    # S5 results
    cue("swoosh_ui", sfx_whoosh(0.5, 300, 3000, 0.5), 30.80, 0.4, pan=0.3)
    for i in range(6):
        cue("bar_pop", sfx_pop(360 + 60 * i, 0.12), 31.55 + 0.12 * i, 0.3, pan=0.1 + 0.08 * i)
    # counter ticks follow power2.out: fast then slowing
    tt, prev = [], -1
    for k in range(200):
        u = k / 199
        v = 1 - (1 - u) ** 2
        c = int(v * 40)
        if c != prev:
            tt.append(31.40 + 2.0 * u)
            prev = c
    for t in tt:
        cue("count_tick", sfx_tick(3600), t, 0.18, pan=0.3)
    cue("kpi_ding", sfx_chime((88, 91), 0.1, 0.9), 33.40, 0.35, pan=0.3)
    cue("badge", sfx_chime((91, 96, 100), 0.06, 1.4), 34.12, 0.45, pan=0.5)
    cue("shimmer", sfx_shimmer(1.2), 34.15, 0.7, pan=0.5)
    # S6 kinetic
    for base, n, f0 in [(37.55, 2, 520), (38.35, 3, 580), (39.25, 4, 660)]:
        for i in range(n):
            cue("word_pop", sfx_pop(f0 + 40 * i, 0.12), base + 0.09 * i + 0.12, 0.4)
    cue("impact_soft", sfx_impact(1.0), 39.50, 0.45)
    cue("burst_chime", sfx_chime((84, 88, 91, 96, 100), 0.05, 1.6), 39.50, 0.5)
    cue("shimmer", sfx_shimmer(1.4), 39.52, 0.9)
    # S7 endcard
    cue("whoosh_up", sfx_whoosh(0.45, 400, 6000, 0.85), 41.62, 0.4)
    cue("impact", sfx_impact(1.8), 41.95, 0.42)
    cue("logo_chime", sfx_chime((79, 84, 88, 91, 96), 0.06, 2.2), 42.00, 0.5)
    cue("tick", sfx_tick(2200), 42.72, 0.25)
    cue("cta_pop", sfx_pop(760, 0.14), 43.35, 0.45)
    for i in range(4):
        cue("dot_bounce", sfx_pop([520, 620, 700, 830][i], 0.12), 43.95 + 0.1 * i, 0.35, pan=-0.3 + 0.2 * i)
    cue("shimmer", sfx_shimmer(2.0), 44.0, 0.6)
    return s, kit


# ---------------------------------------------------------------- render
def lufs(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    js = r.stderr[r.stderr.rfind("{"): r.stderr.rfind("}") + 1]
    return float(json.loads(js)["input_i"])


def write(path, x):
    x = np.clip(x, -1, 1)
    wavfile.write(path, SR, (x * (2 ** 23 - 1)).astype(np.int32) << 8)


def main():
    os.makedirs(os.path.join(OUT, "sfx"), exist_ok=True)
    music = build_music()
    sfx, kit = build_sfx()
    music *= 0.62  # keep the bed under a future voiceover
    mix = music + sfx
    tmp = os.path.join(OUT, "_tmp.wav")
    write(tmp, mix / max(1e-9, np.abs(mix).max()) * 0.5)
    measured = lufs(tmp) + 20 * np.log10(np.abs(mix).max() / 0.5)
    os.remove(tmp)
    g = 10 ** ((-16.0 - measured) / 20)  # target -16 LUFS for the mix
    peak = np.abs(mix * g).max()
    if peak > 0.89:  # keep true-peak headroom
        g *= 0.89 / peak
    write(os.path.join(OUT, "music-bed.wav"), music * g)
    write(os.path.join(OUT, "sfx.wav"), sfx * g)
    write(os.path.join(OUT, "mix.wav"), mix * g)
    for name, x in kit.items():
        x = x / max(1e-9, np.abs(x).max()) * 0.8
        write(os.path.join(OUT, "sfx", name + ".wav"), np.stack([x, x], axis=1))
    print("mix gain %.2f dB, peak %.2f, %d one-shots" % (20 * np.log10(g), np.abs(mix * g).max(), len(kit)))


if __name__ == "__main__":
    main()
