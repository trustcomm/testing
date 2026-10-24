#!/usr/bin/env python3
"""Alarm5: procedural, LAYERED sound-effect synthesis.

Every name of SFX_SPEC (src/sfx.ts) becomes public/sfx/<name>.wav (48 kHz, 24-bit, peak -1 dBFS) + public/sfx/index.json.
EVERY sound is built from three layers, and the finished file's TRANSIENT is where the visual hit lands:
    T = TRANSIENT  a click / tick / snap of 10-40 ms
    B = BODY       the whoosh / boom / swell / note, 150-600 ms
    A = TAIL       reverb / air, 0.5-2 s, filtered
Move sounds (flyto_whoosh, dolly_*, pullback_whoosh ...) carry their PRE-ROLL inside the file: they are audible `PRE` seconds before their hit (see src/sfx.ts).
index.json records, per file: dur, hit (s), hitKind, audibleStart (s: the envelope first reaches -30 dB of its peak), and the three layers' levels.
Seeded and deterministic: running it twice gives byte-identical files.

    python3 scripts/make_sfx.py            # all sounds
    python3 scripts/make_sfx.py pop tink   # only these
    python3 scripts/make_sfx.py --plots    # spectrogram contact sheets -> build/sfx_plots/
    python3 scripts/make_sfx.py --doc      # docs/SFX.md
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import numpy as np
from scipy import ndimage, signal

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audiolib import (  # noqa: E402
    ROOT, SFX_DIR, SR, attack, bp, db2lin, edecay, fade_in, fade_out, hp, hp_zero, lin2db, lp, make_ir, modal, nsamp, noise,
    normalize_peak, phase, pink, piano, pad_tone, place, reverb, rms, rng_for, saw_filtered, smoothstep, soft_sat, spectral_centroid,
    sweep_noise, tt, write_wav,
)

SFX_TS = ROOT / "src" / "sfx.ts"
STEREO = {"pullback_whoosh", "pad_bloom", "room_tone", "relief_swell", "dolly_dive", "dolly_out"}


def parse_spec() -> dict:
    """name -> (hit kind, duration seconds, what) out of src/sfx.ts"""
    txt = SFX_TS.read_text()
    out = {}
    for m in re.finditer(r'^\s*([a-z0-9_]+):\s*\{\s*hit:\s*"(start|peak|end|mark)",\s*dur:\s*"([0-9.]+)\s*s",\s*what:\s*"(.*)"\s*\},?\s*$', txt, re.M):
        out[m.group(1)] = (m.group(2), float(m.group(3)), m.group(4))
    return out


REG: dict = {}
LAYERS: dict = {}


def reg(name):
    def deco(fn):
        REG[name] = fn
        return fn
    return deco


# ---------------------------------------------------------------------------------------------------------------- helpers
def unit(x):
    p = np.max(np.abs(x))
    return x / p if p > 0 else x


def burst(r, n, lo, hi, tau, order=2, att=0.0003):
    """band-limited noise burst, exponential decay: the transient of most small sounds"""
    t = tt(n)
    return unit(bp(noise(r, n), lo, hi, order)) * np.exp(-t / tau) * attack(t, att)


def rv(x, rt, lp_hz=5000.0, wet=-14.0, seed=1, hp_hz=80.0, dry=0.0):
    return reverb(x, make_ir(rt, seed=seed, lp_hz=lp_hz, hp_hz=hp_hz), wet_db=wet, dry_db=dry, n_out=len(x))


def at(buf, x, sec, gain=1.0):
    """add x at `sec` (its last 6 ms faded so a cut component never clicks)"""
    return place(buf, fade_out(x, min(6.0, 1000.0 * len(x) / SR / 3)), int(round(sec * SR)), gain)


def bell(f, t, ratios=(1.0, 2.76, 5.4), amps=(1.0, 0.3, 0.08), tau=0.5, att=0.001):
    out = np.zeros(len(t))
    for k, (rt, a) in enumerate(zip(ratios, amps)):
        out += a * np.sin(2 * np.pi * f * rt * t + 0.7 * k) * np.exp(-t / (tau / (1 + 0.8 * k)))
    return out * attack(t, att)


def thump(t, f0, f1, tau_f, tau_a, att=0.003, harm=0.3):
    """a pitched sub/low thump: sine gliding f0 -> f1 (tau_f), amplitude tau_a, with a 2nd harmonic so a phone speaker hears it"""
    f = f1 + (f0 - f1) * np.exp(-t / tau_f)
    p = phase(f)
    return (np.sin(p) + harm * np.sin(2 * p + 0.3) * np.exp(-t / (tau_a * 0.6))) * np.exp(-t / tau_a) * attack(t, att)


def hump(t, t0, up, down):
    """a smooth 0-1-0 envelope peaking at t0 (rise over `up`, fall over `down`)"""
    return np.where(t < t0, smoothstep(t / up) ** 1.4, np.exp(-(np.abs(t - t0) / down) ** 1.6 * 2.2))


def pluck_tone(f, dur, vel=0.8, tau_scale=1.0, seed=0, bright=1.0):
    """warm light pluck: decaying harmonics (high ones die first), soft pick"""
    n = nsamp(dur)
    t = tt(n)
    r = np.random.default_rng(seed + int(f))
    out = np.zeros(n)
    for k in range(1, 15):
        fk = f * k
        if fk > SR * 0.4:
            break
        a = (k ** -1.35) * np.exp(-(k / (5.0 * bright)) ** 2)
        tau = 0.95 * tau_scale / (1 + 0.85 * (k - 1))
        det = 0.15 * k ** 0.5
        out += a * np.exp(-t / tau) * 0.5 * (np.sin(2 * np.pi * (fk - det) * t + r.uniform(0, 6.28)) + np.sin(2 * np.pi * (fk + det) * t + r.uniform(0, 6.28)))
    out *= attack(t, 0.0015)
    out += 0.09 * vel * lp(noise(r, n), 2400, 2) * np.exp(-t / 0.006)
    return out * (0.6 + 0.4 * vel)


def mix3(name, n, T, B, A, gT=1.0, gB=1.0, gA=1.0):
    """T + B + A layers (already placed on a length-n axis); remembers their RMS for the doc"""
    T, B, A = (np.zeros(n) if v is None else v for v in (T, B, A))
    LAYERS[name] = {"T": round(float(lin2db(rms(T * gT) + 1e-9)), 1), "B": round(float(lin2db(rms(B * gB) + 1e-9)), 1), "A": round(float(lin2db(rms(A * gA) + 1e-9)), 1)}
    return T * gT + B * gB + A * gA


def padded(x, n):
    return np.pad(x, (0, max(0, n - len(x))))[:n]


# ---------------------------------------------------------------------------------------------------------------- map / camera
@reg("beacon_bip")
def beacon_bip(r, d):
    n = nsamp(d); t = tt(n)
    T = np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.012) * attack(t, 0.0004) + 0.3 * burst(r, n, 3000, 9000, 0.002)
    f = 55 + 5 * np.sin(2 * np.pi * 0.6 * t)
    B = np.sin(phase(f)) * hump(t, 0.16, 0.12, 0.28) * 0.9 + 0.25 * np.sin(2 * phase(f) + 0.4) * hump(t, 0.16, 0.12, 0.2)
    A = rv(T * 0.6 + lp(noise(r, n), 2400, 2) * np.exp(-t / 0.18) * 0.04, 1.3, 3500, -6.0, seed=2)
    return mix3("beacon_bip", n, T, B, A, 1.0, 0.7, 0.7), None


@reg("pullback_whoosh")
def pullback_whoosh(r, d):
    n = nsamp(d); t = tt(n)
    out = np.zeros((n, 2))
    env = hump(t, 1.2, 1.1, 0.95)
    for c in range(2):
        rc = np.random.default_rng(100 + c)
        fc = 380 + 3600 * np.exp(-t / 0.95)
        w = sweep_noise(rc, n, fc, 1.1) * env
        out[:, c] = w
    body = np.sin(phase(70 + 28 * np.exp(-t / 0.8))) * hump(t, 1.2, 1.0, 0.8) * 0.5
    air = lp(noise(r, n), 3000, 2) * hump(t, 1.35, 1.2, 1.2) * 0.12
    x = out + body[:, None] + air[:, None]
    A = rv(x[:, 0], 1.8, 3200, -8.0, seed=3), rv(x[:, 1], 1.8, 3200, -8.0, seed=4)
    x = x + 0.5 * np.stack([a - x[:, i] for i, a in enumerate(A)], axis=1)
    LAYERS["pullback_whoosh"] = {"T": -90.0, "B": round(float(lin2db(rms(out))), 1), "A": round(float(lin2db(rms(x - out))), 1)}
    return x, 1.2


@reg("reverse_riser")
def reverse_riser(r, d):
    n = nsamp(d); t = tt(n); T0 = d - 0.04
    u = np.clip(t / T0, 0, 1)
    B = hp(noise(r, n), 1800, 2) * u ** 2.4 * 0.7 + np.sin(phase(300 * 4 ** u)) * u ** 3 * 0.12
    A = lp(noise(r, n), 9000, 1) * u ** 3 * 0.06
    x = (B + A) * np.where(t < T0, 1.0, np.exp(-(t - T0) / 0.01))
    LAYERS["reverse_riser"] = {"T": -90.0, "B": round(float(lin2db(rms(B))), 1), "A": round(float(lin2db(rms(A))), 1)}
    return x, T0


@reg("punch_hit")
def punch_hit(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1500, 6500, 0.004) * 0.9 + 0.5 * burst(r, n, 200, 900, 0.008)
    B = thump(t, 150, 58, 0.035, 0.16, harm=0.45)
    A = rv(B * 0.9 + T * 0.2, 0.75, 650, -6.0, seed=5)
    return mix3("punch_hit", n, T, B, A, 0.8, 1.0, 0.8), None


@reg("heartbeat")
def heartbeat(r, d):
    n = nsamp(d); t = tt(n)
    T = np.zeros(n); B = np.zeros(n)
    for k, (at_s, f, g) in enumerate([(0.0, 54, 1.0), (0.22, 60, 0.72)]):
        tk = tt(nsamp(0.4))
        B = at(B, thump(tk, f * 1.7, f, 0.03, 0.09, att=0.004, harm=0.35), at_s, g)
        T = at(T, burst(r, nsamp(0.05), 200, 900, 0.008, att=0.001), at_s, 0.28 * g)
    A = rv(B, 0.5, 700, -9.0, seed=6)
    return mix3("heartbeat", n, T, B, A), None


@reg("flyto_whoosh")
def flyto_whoosh(r, d):
    n = nsamp(d); t = tt(n); hit = 0.75
    u = np.clip(t / hit, 0, 1)
    fc = np.where(t < hit, 250 * 10.4 ** (u ** 1.1), 2600 * np.exp(-(t - hit) / 0.45) + 650)       # rises into the pass, falls after it (the Doppler drop)
    env = np.where(t < hit, (u ** 1.9) * (0.04 + 0.96 * u ** 0.3 * 0 + 0.96 * u ** 0.0), np.exp(-(t - hit) / 0.42))
    env = np.where(t < hit, 0.015 + 0.985 * smoothstep(t / hit) ** 1.5, np.exp(-(t - hit) / 0.40))
    B = sweep_noise(r, n, fc, 0.95) * env
    whine = np.sin(phase(np.where(t < hit, 600 + 900 * u ** 1.4, 1500 * np.exp(-(t - hit) / 0.5) + 420))) * env * 0.05
    low = np.sin(phase(65 + 20 * u)) * hump(t, hit, 0.5, 0.45) * 0.45
    T = burst(r, n, 2500, 9000, 0.006) * np.exp(-np.abs(t - hit) / 0.01) * 0.0                      # (no click: a pass has no transient)
    A = rv(B * 0.8, 1.5, 3000, -7.0, seed=7)
    x = mix3("flyto_whoosh", n, T, B + whine + low, A, 1.0, 1.0, 0.65)
    return x, hit


@reg("dolly_dive")
def dolly_dive(r, d):
    n = nsamp(d); t = tt(n); hit = 0.28
    u = np.clip(t / hit, 0, 1)
    fc = np.where(t < hit, 200 * 25 ** u ** 1.3, 5000 * np.exp(-(t - hit) / 0.12) + 260)
    env = np.where(t < hit, 0.02 + 0.98 * smoothstep(t / hit) ** 1.6, np.exp(-(t - hit) / 0.22))
    out = np.zeros((n, 2))
    for c in range(2):
        out[:, c] = sweep_noise(np.random.default_rng(210 + c), n, fc, 0.9) * env
    glide = np.sin(phase(np.where(t < hit, 110 * 2 ** u, 220 * np.exp(-(t - hit) / 0.3) + 55))) * env * 0.45
    suck = lp(noise(r, n), 600, 2) * np.where(t > hit, np.exp(-(t - hit) / 0.35), 0) * 0.25
    x = out + (glide + suck)[:, None]
    tail = np.stack([rv(x[:, 0], 0.9, 1800, -9.0, seed=8), rv(x[:, 1], 0.9, 1800, -9.0, seed=9)], axis=1)
    LAYERS["dolly_dive"] = {"T": -90.0, "B": round(float(lin2db(rms(x))), 1), "A": round(float(lin2db(rms(tail - x))), 1)}
    return x + 0.6 * (tail - x), hit


@reg("dolly_out")
def dolly_out(r, d):
    n = nsamp(d); t = tt(n); hit = 0.75
    u = np.clip(t / hit, 0, 1)
    fc = np.where(t < hit, 2800 * 0.18 ** (u ** 1.1) * 1.0 + 300, 520 * np.exp(-(t - hit) / 0.5) + 240)
    env = np.where(t < hit, 0.02 + 0.98 * smoothstep(t / hit) ** 1.7, np.exp(-(t - hit) / 0.45))
    out = np.zeros((n, 2))
    for c in range(2):
        out[:, c] = sweep_noise(np.random.default_rng(220 + c), n, fc, 1.0) * env * 0.8
    glide = np.sin(phase(220 * 0.5 ** u + 40)) * env * 0.3
    x = out + glide[:, None]
    tail = np.stack([rv(x[:, 0], 1.3, 2200, -8.0, seed=10), rv(x[:, 1], 1.3, 2200, -8.0, seed=11)], axis=1)
    LAYERS["dolly_out"] = {"T": -90.0, "B": round(float(lin2db(rms(x))), 1), "A": round(float(lin2db(rms(tail - x))), 1)}
    return x + 0.6 * (tail - x), hit


def _riser(r, n, t, dur, f0, f1):
    u = np.clip(t / dur, 0, 1)
    return (hp(noise(r, n), 1500, 2) * u ** 2.2 * 0.17 + np.sin(phase(f0 * (f1 / f0) ** u)) * u ** 2.5 * 0.08 + 0.025 * lp(noise(r, n), 7000, 1) * u ** 3) * (t < dur + 0.004)


@reg("number_reveal")
def number_reveal(r, d):
    n = nsamp(d); t = tt(n); h = 0.45
    ri = _riser(r, n, t, h, 400, 1700) * (t < h)
    th = np.clip(t - h, 0, None)
    T = (burst(r, n, 3000, 9500, 0.003) * 0.7 + bell(3100, th, (1.0, 1.68, 2.54), (1.0, 0.55, 0.3), 0.07, 0.0004) * 0.6) * (t >= h)
    B = thump(th, 78, 46, 0.12, 0.45, att=0.004, harm=0.5) * (t >= h)
    A = rv(T * 0.8 + B * 0.3, 1.5, 6500, -5.0, seed=12) * (t >= h) + 0.04 * bell(2093, th, (1, 1.5, 2.0), (1, 0.5, 0.25), 1.2) * (t >= h) * 0.4
    x = ri + mix3("number_reveal", n, T, B, A, 0.9, 1.0, 0.6)
    return x, h


@reg("number_reveal_big")
def number_reveal_big(r, d):
    n = nsamp(d); t = tt(n); h = 1.0
    ri = _riser(r, n, t, h, 160, 1400) * 1.2 * (t < h)
    th = np.clip(t - h, 0, None)
    T = (burst(r, n, 2000, 9000, 0.004) * 0.9 + bell(2480, th, (1.0, 1.68, 2.54), (1.0, 0.6, 0.35), 0.1, 0.0004) * 0.6 + 0.6 * burst(r, n, 300, 1200, 0.012)) * (t >= h)
    B = soft_sat(thump(th, 82, 34, 0.22, 0.85, att=0.004, harm=0.55), 2.2) * (t >= h)
    A = rv(B * 0.7 + T * 0.3, 2.4, 1800, -4.0, seed=13) * (t >= h)
    x = ri + mix3("number_reveal_big", n, T, B, A, 1.0, 1.3, 0.8)
    return x, h


# ---------------------------------------------------------------------------------------------------------------- screen / ui
@reg("piano_tick")
def piano_tick(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 800, 3200, 0.004, att=0.0006) * 0.4
    B = padded(piano(261.63, 1.9, vel=0.55, bright=0.8, seed=2, tail_tau=1.6), n)
    A = rv(B, 1.5, 3500, -9.0, seed=14, dry=-99.0)
    return mix3("piano_tick", n, T, B, A, 0.5, 0.8, 0.6), None


@reg("action_chime")
def action_chime(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 3000, 9000, 0.002)
    B = np.zeros(n)
    for s, f in ((0.0, 523.25), (0.14, 783.99)):
        tk = tt(nsamp(1.5))
        B = at(B, bell(f, tk, (1.0, 2.0, 3.0), (1.0, 0.4, 0.15), 0.9, 0.002), s, 0.8)
    A = rv(B, 1.5, 4500, -7.0, seed=15)
    return mix3("action_chime", n, T, B, A, 0.12, 1.0, 0.7), None


@reg("tink")
def tink(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 4500, 11000, 0.0012)
    B = bell(2637, t, (1.0, 2.76, 5.4), (1.0, 0.3, 0.1), 0.14, 0.0005)
    A = rv(B, 0.9, 7000, -8.0, seed=16)
    return mix3("tink", n, T, B, A, 0.35, 0.9, 0.5), None


@reg("lock_click")
def lock_click(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1500, 6500, 0.0016) * 1.0
    B = modal(t, [(780, 0.8, 0.04), (1320, 0.5, 0.03), (2110, 0.25, 0.02)]) * attack(t, 0.0004) + 0.5 * np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.03)
    A = bell(3100, t, (1.0, 1.9), (0.5, 0.2), 0.14) * 0.4
    A = rv(A, 0.5, 5000, -6.0, seed=17)
    return mix3("lock_click", n, T, B, A, 0.9, 0.8, 0.5), None


@reg("ui_click")
def ui_click(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1200, 3600, 0.002) * 0.8
    B = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.014) * attack(t, 0.0008)
    A = rv(T + B * 0.4, 0.3, 4000, -12.0, seed=18)
    return mix3("ui_click", n, T, B, A, 0.5, 0.9, 0.4), None


@reg("card_slide")
def card_slide(r, d):
    n = nsamp(d); t = tt(n); hit = 0.2
    fc = 600 + 2400 * np.exp(-((t - hit) / 0.14) ** 2)
    B = sweep_noise(r, n, fc, 0.8) * hump(t, hit, 0.14, 0.16) * 0.6
    T = burst(r, n, 1500, 5000, 0.004) * np.exp(-np.abs(t - 0.34) / 0.5) * (t > 0.3) * 0.5
    A = rv(B * 0.5 + T, 0.6, 3000, -9.0, seed=19)
    return mix3("card_slide", n, T, B, A, 0.5, 0.8, 0.5), hit


@reg("play_tap")
def play_tap(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1500, 5000, 0.002) * 0.8
    B = np.sin(phase(380 + 120 * np.exp(-t / 0.04))) * np.exp(-t / 0.07) * attack(t, 0.001)
    A = rv(B * 0.6, 0.5, 3500, -8.0, seed=20)
    return mix3("play_tap", n, T, B, A, 0.6, 0.8, 0.5), None


@reg("type_click")
def type_click(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1000, 4200, 0.003)
    B = np.sin(2 * np.pi * 280 * t) * np.exp(-t / 0.012) * attack(t, 0.001)
    A = rv(T * 0.5, 0.2, 3000, -12.0, seed=21)
    return mix3("type_click", n, T, B, A, 0.7, 0.8, 0.3), None


@reg("checklist_tick")
def checklist_tick(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 2500, 8000, 0.0015) * 0.7
    B = np.zeros(n)
    B = at(B, bell(1318.5, tt(nsamp(0.3)), (1.0, 2.0), (1.0, 0.25), 0.12), 0.0, 0.7)
    B = at(B, bell(1760, tt(nsamp(0.4)), (1.0, 2.0), (1.0, 0.25), 0.2), 0.07, 0.8)
    A = rv(B, 0.7, 6000, -8.0, seed=22)
    return mix3("checklist_tick", n, T, B, A, 0.4, 0.8, 0.5), None


@reg("crowd_flat")
def crowd_flat(r, d):
    n = nsamp(d); t = tt(n)
    T = np.zeros(n)
    base = lp(pink(r, n), 700, 2) * 0.12
    murmur = np.zeros(n)
    for k in range(9):                                     # a few muffled syllables that die away
        s = 0.1 + k * 0.17 + r.uniform(-0.03, 0.03)
        tk = tt(nsamp(0.14)); f = r.uniform(180, 320)
        syl = lp(np.sin(2 * np.pi * f * tk + 3 * np.sin(2 * np.pi * 7 * tk)) * np.sin(np.pi * tk / 0.14), 900, 2)
        murmur = at(murmur, syl, s, 0.3 * np.exp(-s / 0.9))
    B = (base + murmur) * hump(t, 0.5, 0.35, 0.9)
    A = rv(B, 1.2, 1500, -8.0, seed=23)
    return mix3("crowd_flat", n, T, B, A, 1.0, 1.0, 0.6), None


@reg("robot_step")
def robot_step(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1200, 3800, 0.002) * 0.8
    B = np.sin(2 * np.pi * 650 * t) * np.exp(-t / 0.012) * attack(t, 0.0006) + 0.5 * np.sin(2 * np.pi * 310 * t) * np.exp(-t / 0.02)
    A = rv(T * 0.4, 0.25, 3500, -14.0, seed=24)
    return mix3("robot_step", n, T, B, A, 0.7, 0.9, 0.3), None


@reg("brake_squeal")
def brake_squeal(r, d):
    n = nsamp(d); t = tt(n)
    sq = np.sin(phase(2400 - 520 * smoothstep(t / 0.35) + 25 * np.sin(2 * np.pi * 46 * t))) * hump(t, 0.14, 0.08, 0.15)
    B = (sq * 0.35 + bp(noise(r, n), 1600, 3200, 2) * hump(t, 0.14, 0.08, 0.15) * 0.25)
    T = burst(r, n, 1000, 5000, 0.003) * np.exp(-np.abs(t - 0.4) / 0.002) * 0.0
    T = np.zeros(n); T = at(T, np.sin(2 * np.pi * 210 * tt(nsamp(0.1))) * np.exp(-tt(nsamp(0.1)) / 0.02) * 0.7, 0.34)
    A = rv(B * 0.5, 0.4, 3500, -10.0, seed=25)
    return mix3("brake_squeal", n, T, B, A, 0.8, 1.0, 0.4), None


@reg("glass_thunk")
def glass_thunk(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 3000, 9000, 0.002) * 0.9
    B = thump(t, 120, 88, 0.05, 0.12, att=0.002, harm=0.4) + 0.45 * np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.03)
    A = modal(t, [(2110, 0.5, 0.35), (3330, 0.35, 0.28), (5470, 0.2, 0.2), (1420, 0.3, 0.4)]) * attack(t, 0.001) * 0.45
    A = rv(A + B * 0.2, 0.9, 5000, -7.0, seed=26)
    return mix3("glass_thunk", n, T, B, A, 0.7, 1.0, 0.7), None


@reg("buzzer_blip")
def buzzer_blip(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1500, 5000, 0.002) * 0.8
    f = 150 * 2 ** (-1.2 * smoothstep(t / 0.3) / 12)
    saw = saw_filtered(np.full(n, 150.0) * f / 150.0, np.full(n, 800.0), 14, 1.1)
    gate = ((t > 0.02) & (t < 0.12)).astype(float) + 0.8 * ((t > 0.17) & (t < 0.3)).astype(float)
    B = saw * lp(gate, 200, 1) * 0.5 * np.exp(-t / 0.25)
    A = rv(B * 0.4, 0.3, 1500, -12.0, seed=27)
    return mix3("buzzer_blip", n, T, B, A, 0.7, 1.0, 0.3), None


@reg("coin_bounce")
def coin_bounce(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 4000, 11000, 0.0015) * 0.8
    cl = modal(t, [(3400, 0.7, 0.07), (5100, 0.45, 0.05), (8000, 0.2, 0.03), (2300, 0.3, 0.09)]) * attack(t, 0.0003)
    B = cl.copy()
    B = at(B, thump(tt(nsamp(0.25)), 210, 120, 0.03, 0.05, att=0.002), 0.11, 0.8)
    B = at(B, modal(tt(nsamp(0.3)), [(3400, 0.7, 0.05), (5100, 0.4, 0.04)]), 0.3, 0.4)
    B = at(B, modal(tt(nsamp(0.3)), [(3400, 0.7, 0.04), (5100, 0.4, 0.03)]), 0.46, 0.22)
    A = rv(B, 0.7, 6000, -8.0, seed=28)
    return mix3("coin_bounce", n, T, B, A, 0.5, 0.9, 0.5), None


@reg("quiz_pluck")
def quiz_pluck(r, d):
    n = nsamp(d); t = tt(n)
    f = 392.0 * 2 ** (3.0 * smoothstep((t - 0.04) / 0.28) / 12)
    p = phase(f)
    B = np.zeros(n)
    for k in range(1, 8):
        B += (k ** -1.3) * np.sin(k * p) * np.exp(-t / (0.5 / (1 + 0.7 * (k - 1))))
    B *= attack(t, 0.002) * 0.9
    T = burst(r, n, 1500, 5000, 0.004) * 0.3
    sh = bell(1568, t, (1.0, 2.0), (0.3, 0.12), 0.5) * np.where(t > 0.3, 1.0, 0.0) * 0.4
    A = rv(B * 0.6 + sh, 1.0, 4500, -8.0, seed=29)
    return mix3("quiz_pluck", n, T, B, A, 0.4, 1.0, 0.6), None


@reg("conveyor_hum")
def conveyor_hum(r, d):
    n = nsamp(d); t = tt(n)
    belt = (0.6 + 0.4 * np.sin(2 * np.pi * 2.2 * t)) ** 2
    B = np.sin(phase(np.full(n, 71.0) * (1 + 0.003 * np.sin(2 * np.pi * 0.5 * t)))) * 0.5 + lp(noise(r, n), 220, 2) * 0.5 * belt + 0.25 * lp(noise(r, n), 900, 2) * belt
    T = np.zeros(n); A = rv(B * 0.3, 0.8, 900, -10.0, seed=30)
    env = smoothstep(t / 0.6) * smoothstep((d - t) / 1.6)
    return mix3("conveyor_hum", n, T, B * env, A * env, 1.0, 1.0, 0.5), None


@reg("creak")
def creak(r, d):
    n = nsamp(d); t = tt(n)
    fc = 650 + 700 * smoothstep(t / 0.5) + 90 * np.sin(2 * np.pi * 11 * t)
    B = sweep_noise(r, n, fc, 0.22) * hump(t, 0.4, 0.3, 0.3) * (0.55 + 0.45 * np.sin(2 * np.pi * 15 * t) ** 2) * 0.8
    scrape = lp(noise(r, n), 260, 2) * hump(t, 0.35, 0.25, 0.3) * 0.25
    T = burst(r, n, 2000, 6000, 0.003) * 0.25
    A = rv(B * 0.4, 0.6, 2500, -10.0, seed=31)
    return mix3("creak", n, T, B + scrape, A, 0.4, 1.0, 0.4), None


@reg("glassy_pluck")
def glassy_pluck(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 4000, 10000, 0.0015) * 0.8
    B = modal(t, [(1568, 1.0, 0.45), (3136, 0.45, 0.3), (3790, 0.3, 0.2), (5500, 0.12, 0.12)]) * attack(t, 0.0005)
    A = rv(bell(2349, t, (1.0, 2.4), (0.2, 0.08), 0.5), 0.9, 7000, -6.0, seed=32)
    return mix3("glassy_pluck", n, T, B, A, 0.4, 0.9, 0.5), None


@reg("key_ratchet")
def key_ratchet(r, d):
    n = nsamp(d); t = tt(n)
    B = np.zeros(n)
    s = 0.0
    for i in range(6):
        tk = tt(nsamp(0.05))
        B = at(B, unit(bp(noise(r, len(tk)), 1500, 5000, 2)) * np.exp(-tk / 0.004) + 0.4 * np.sin(2 * np.pi * 1150 * tk) * np.exp(-tk / 0.008), s, 0.7 + 0.05 * i)
        s += 0.095 - 0.012 * i
    T = burst(r, n, 2500, 8000, 0.002) * 0.3
    A = bell(3200, t, (1.0, 1.5), (0.3, 0.12), 0.18) * np.where(t > s, 1.0, 0.0) * 0.5
    A = rv(A + B * 0.2, 0.5, 5500, -9.0, seed=33)
    return mix3("key_ratchet", n, T, B, A, 0.5, 1.0, 0.5), None


@reg("stamp_thud")
def stamp_thud(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 400, 2500, 0.012) * 0.9
    B = thump(t, 120, 66, 0.04, 0.14, att=0.002, harm=0.4)
    A = rv(B * 0.6 + T * 0.2, 0.5, 900, -9.0, seed=34)
    return mix3("stamp_thud", n, T, B, A, 0.8, 1.0, 0.5), None


@reg("counter_roll")
def counter_roll(r, d):
    n = nsamp(d); t = tt(n); h = 1.0
    ticks = np.zeros(n); s = 0.0; i = 0
    while s < h - 0.02:
        tk = tt(nsamp(0.04))
        ticks = at(ticks, bell(4200 + 120 * (i % 5), tk, (1.0, 2.1), (1.0, 0.3), 0.012) * (0.4 + 0.5 * s / h), s, 0.9)
        s += 0.115 * (1 - 0.88 * (s / h)) ** 1.2 + 0.012; i += 1
    th = np.clip(t - h, 0, None)
    T = burst(r, n, 3000, 9000, 0.003) * (t >= h) * 0.7
    B = thump(th, 72, 45, 0.1, 0.4, att=0.003, harm=0.45) * (t >= h)
    A = rv(B * 0.6, 0.9, 1500, -8.0, seed=35) * (t >= h)
    x = ticks * (t < h) + mix3("counter_roll", n, T, B, A, 0.8, 1.0, 0.6)
    return x, h


@reg("spark_crackle")
def spark_crackle(r, d):
    n = nsamp(d); t = tt(n)
    dens = np.exp(-t / 0.55) * 900
    pulses = (r.random(n) < dens / SR).astype(float)
    sp = signal.fftconvolve(pulses, burst(r, nsamp(0.012), 2500, 9000, 0.0025), mode="full")[:n]
    sp = sp * (0.5 + 0.5 * r.random(n))
    T = burst(r, n, 2000, 8000, 0.003) * 0.5
    B = sp * 1.4
    hiss = hp(noise(r, n), 5500, 1) * np.exp(-t / 0.5) * 0.03
    A = rv(B * 0.3 + hiss, 0.5, 8000, -9.0, seed=36)
    return mix3("spark_crackle", n, T, B, A + hiss, 0.4, 1.0, 0.8), None


@reg("window_click")
def window_click(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1800, 6000, 0.0018)
    B = np.sin(2 * np.pi * 420 * t) * np.exp(-t / 0.012) * attack(t, 0.0006)
    A = rv(T * 0.4, 0.2, 3500, -14.0, seed=37)
    return mix3("window_click", n, T, B, A, 0.7, 0.8, 0.3), None


@reg("sad_drop")
def sad_drop(r, d):
    n = nsamp(d); t = tt(n)
    f = 196.0 * 2 ** (-7.0 * smoothstep((t - 0.2) / 1.5) / 12)
    trem = 1 - 0.3 * (0.5 + 0.5 * np.sin(2 * np.pi * 5 * t))
    B = (saw_filtered(f, 650 + 0 * t, 18, 1.3) * 0.5 + np.sin(phase(f)) * 0.8 + 0.3 * np.sin(phase(f * 2.003))) * attack(t, 0.25) * np.exp(-np.clip(t - 0.9, 0, None) / 0.7) * trem * 0.7
    T = burst(r, n, 500, 2500, 0.01) * 0.12
    A = rv(B, 2.0, 1400, -4.0, seed=38)
    return mix3("sad_drop", n, T, B, A, 0.5, 1.0, 0.8), None


@reg("lift_whoop")
def lift_whoop(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1000, 4000, 0.003) * 0.7
    B = np.sin(phase(380 + 760 * smoothstep(t / 0.2))) * hump(t, 0.1, 0.05, 0.12) * 0.8
    A = rv(B * 0.6, 0.5, 4000, -9.0, seed=39)
    return mix3("lift_whoop", n, T, B, A, 0.5, 1.0, 0.5), None


@reg("arc_whoosh")
def arc_whoosh(r, d):
    n = nsamp(d); t = tt(n); hit = 0.4
    fc = np.where(t < hit, 500 * 5 ** (t / hit), 2500 * np.exp(-(t - hit) / 0.3) + 850)
    B = sweep_noise(r, n, fc, 0.9) * hump(t, hit, 0.3, 0.3) * 0.8
    T = np.zeros(n)
    A = rv(B * 0.6, 0.8, 3500, -8.0, seed=40)
    return mix3("arc_whoosh", n, T, B, A, 1.0, 1.0, 0.6), hit


@reg("land_tap")
def land_tap(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1200, 4000, 0.003) * 0.7
    B = thump(t, 220, 140, 0.03, 0.06, att=0.002, harm=0.3)
    A = rv(B * 0.5, 0.4, 3000, -10.0, seed=41)
    return mix3("land_tap", n, T, B, A, 0.6, 1.0, 0.5), None


@reg("call_tone")
def call_tone(r, d):
    n = nsamp(d); t = tt(n)
    gate = np.zeros(n)
    for s in (0.0, 0.8):
        gate += ((t >= s) & (t < s + 0.4)).astype(float)
    gate = lp(gate, 90, 2)
    B = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * 0.4 * gate
    B = lp(B, 1400, 2)
    T = burst(r, n, 800, 3000, 0.004) * 0.1
    A = rv(B, 0.8, 2500, -10.0, seed=42)
    return mix3("call_tone", n, T, B, A, 0.3, 1.0, 0.5), None


@reg("hangup_blip")
def hangup_blip(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1500, 5000, 0.002) * 0.7
    B = np.sin(2 * np.pi * 880 * t) * np.exp(-t / 0.05) * (t < 0.1) + np.sin(2 * np.pi * 587 * (t - 0.09)) * np.exp(-np.clip(t - 0.09, 0, None) / 0.07) * (t >= 0.09) * 0.9
    B = B * attack(t, 0.001)
    A = rv(B * 0.5, 0.4, 3500, -10.0, seed=43)
    return mix3("hangup_blip", n, T, B, A, 0.5, 0.8, 0.4), None


@reg("room_tone")
def room_tone(r, d):
    n = nsamp(d); t = tt(n)
    out = np.zeros((n, 2))
    env = smoothstep(t / 1.4) * smoothstep((d - t) / 1.6)
    for c in range(2):
        rc = np.random.default_rng(300 + c)
        hiss = hp(noise(rc, n), 5200, 1) * 0.05 * (0.7 + 0.3 * np.sin(2 * np.pi * 0.3 * t + c))
        low = lp(pink(rc, n), 400, 2) * 0.14
        drone = np.sin(phase(np.full(n, 55.0 + 0.6 * c))) * 0.1
        out[:, c] = (hiss + low + drone) * env
    LAYERS["room_tone"] = {"T": -90.0, "B": round(float(lin2db(rms(out))), 1), "A": -90.0}
    return out, None


@reg("relief_swell")
def relief_swell(r, d):
    n = nsamp(d); t = tt(n)
    out = np.zeros(n)
    for f in (261.63, 329.63, 392.0, 523.25):
        out += padded(pad_tone(f, 1.2, att=0.8, rel=1.6, bright=0.8, voices=3, seed=1), n) * (0.8 if f < 500 else 0.5)
    B = out * 0.5
    T = burst(r, n, 600, 3000, 0.01) * 0.04
    A = rv(B, 2.2, 3500, -5.0, seed=44)
    x = mix3("relief_swell", n, T, B, A, 0.5, 1.0, 0.6)
    return np.stack([x, np.roll(x, 40)], axis=1), 1.0


@reg("ring_fill")
def ring_fill(r, d):
    n = nsamp(d); t = tt(n); h = 1.4
    u = np.clip(t / h, 0, 1)
    B = (np.sin(phase(300 * 4 ** u)) * u ** 2 * 0.5 + sweep_noise(r, n, 800 * 6 ** u, 1.2) * u ** 2.4 * 0.35) * (t < h)
    T = np.zeros(n); T = at(T, burst(r, nsamp(0.05), 3000, 9000, 0.004), h, 0.6)
    T = at(T, bell(2200, tt(nsamp(0.2)), (1.0, 2.0), (1.0, 0.2), 0.05), h, 0.5)
    A = rv(T + B * 0.2, 0.5, 6000, -8.0, seed=45)
    return B + mix3("ring_fill", n, T, np.zeros(n), A, 0.9, 1.0, 0.5), h


@reg("ding_done")
def ding_done(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 3500, 10000, 0.0015) * 0.8
    B = bell(1318.5, t, (1.0, 2.0, 3.0, 4.2), (1.0, 0.45, 0.25, 0.1), 0.9, 0.0008)
    A = rv(B, 1.4, 6500, -6.0, seed=46)
    return mix3("ding_done", n, T, B, A, 0.3, 1.0, 0.7), None


@reg("dust_swell")
def dust_swell(r, d):
    n = nsamp(d); t = tt(n); h = 1.4
    cr = (r.random(n) < (80 + 700 * np.clip(t / h, 0, 1) ** 2) / SR).astype(float)
    crack = signal.fftconvolve(cr, burst(r, nsamp(0.006), 2000, 7000, 0.0015), mode="full")[:n]
    B = lp(noise(r, n), 1800, 2) * hump(t, h, 1.1, 0.25) * 0.5 + crack * 0.7 * hump(t, h, 1.1, 0.25)
    T = burst(r, n, 1000, 4000, 0.01) * np.exp(-np.abs(t - h) / 0.04) * 0.2
    A = rv(B * 0.3, 0.7, 2500, -9.0, seed=47)
    return mix3("dust_swell", n, T, B, A, 0.3, 1.0, 0.5), None


@reg("dig_drop")
def dig_drop(r, d):
    n = nsamp(d); t = tt(n); h = 0.3
    gr = bp(noise(r, n), 150, 900, 2) * (0.6 + 0.4 * (r.random(n) > 0.5))
    B = gr * hump(t, h, 0.2, 0.35) * 0.6 + sweep_noise(r, n, np.where(t < h, 150 + 700 * t / h, 850 * np.exp(-(t - h) / 0.3) + 120), 0.9) * hump(t, h, 0.22, 0.3) * 0.6
    T = thump(np.clip(t - h, 0, None), 100, 50, 0.08, 0.18, att=0.004) * (t >= h) * 0.9
    A = rv(B * 0.4 + T * 0.4, 1.0, 1400, -8.0, seed=48)
    return mix3("dig_drop", n, T, B, A, 1.0, 1.0, 0.6), h


@reg("up_whoosh")
def up_whoosh(r, d):
    n = nsamp(d); t = tt(n); h = 0.7
    u = np.clip(t / h, 0, 1)
    fc = np.where(t < h, 200 * 13 ** u, 2600 * np.exp(-(t - h) / 0.3) + 600)
    B = sweep_noise(r, n, fc, 0.95) * hump(t, h, 0.55, 0.3) * 0.8
    T = np.zeros(n); T = at(T, np.sin(phase(500 + 600 * np.exp(-tt(nsamp(0.08)) / 0.01))) * np.exp(-tt(nsamp(0.08)) / 0.02), h, 0.7)
    A = rv(B * 0.5 + T, 0.9, 3500, -8.0, seed=49)
    return mix3("up_whoosh", n, T, B, A, 0.8, 1.0, 0.6), h


@reg("scuttle_s")
def scuttle_s(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 3000, 8000, 0.002) * 0.4
    B = np.zeros(n)
    s = 0.03
    for i in range(8):
        B = at(B, burst(r, nsamp(0.012), 3500 + 400 * (i % 3), 7500, 0.0025), s, 0.3 + 0.4 * r.random())
        s += r.uniform(0.03, 0.09)
    A = hp(noise(r, n), 4500, 1) * np.exp(-t / 0.18) * 0.02
    return mix3("scuttle_s", n, T, B, rv(A, 0.3, 8000, -12.0, seed=50), 0.4, 1.0, 0.6), None


@reg("piano_low")
def piano_low(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 300, 1500, 0.006) * 0.3
    B = padded(piano(130.81, 3.6, vel=0.5, bright=0.7, seed=3, tail_tau=2.6), n)
    A = rv(B, 2.4, 2600, -8.0, seed=51, dry=-99.0)
    return mix3("piano_low", n, T, B, A, 0.4, 1.0, 0.7), None


@reg("tone_soft")
def tone_soft(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1500, 5000, 0.004) * 0.25
    p = phase(np.full(n, 392.0))
    B = (np.sin(p) + 0.22 * np.sin(2 * p) + 0.08 * np.sin(3 * p)) * attack(t, 0.012) * np.exp(-t / 0.9)
    A = rv(B * 0.7, 1.5, 3500, -8.0, seed=52)
    return mix3("tone_soft", n, T, B, A, 0.4, 1.0, 0.7), None


@reg("pad_bloom")
def pad_bloom(r, d):
    n = nsamp(d)
    out = np.zeros((n, 2))
    for i, f in enumerate((130.81, 196.0, 261.63, 329.63, 392.0, 587.33)):
        v = padded(pad_tone(f, 2.2, att=1.4, rel=1.8, bright=0.7, voices=3, detune_cents=9, seed=i), n) * (0.9 if f < 300 else 0.55)
        pan = np.cos((i / 5) * np.pi / 2), np.sin((i / 5) * np.pi / 2)
        out[:, 0] += v * pan[0]; out[:, 1] += v * pan[1]
    mono = out.mean(axis=1)
    tail = np.stack([rv(out[:, 0], 2.8, 3800, -4.0, seed=53), rv(out[:, 1], 2.8, 3800, -4.0, seed=54)], axis=1)
    LAYERS["pad_bloom"] = {"T": -90.0, "B": round(float(lin2db(rms(out))), 1), "A": round(float(lin2db(rms(tail - out))), 1)}
    return tail, None


@reg("green_tink")
def green_tink(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 4500, 11000, 0.0012)
    B = bell(3136, t, (1.0, 2.76, 4.1), (1.0, 0.3, 0.12), 0.16, 0.0005)
    A = rv(B, 1.0, 7500, -7.0, seed=55)
    return mix3("green_tink", n, T, B, A, 0.3, 0.9, 0.6), None


@reg("hit_firm")
def hit_firm(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1000, 4500, 0.004) * 0.8
    B = thump(t, 150, 98, 0.04, 0.16, att=0.002, harm=0.5) + 0.35 * np.sin(2 * np.pi * 196 * t) * np.exp(-t / 0.1)
    A = rv(B * 0.6 + T * 0.2, 0.7, 1800, -8.0, seed=56)
    return mix3("hit_firm", n, T, B, A, 0.7, 1.0, 0.7), None


@reg("boop")
def boop(r, d):
    n = nsamp(d); t = tt(n)
    B = np.zeros(n)
    for s, f0 in ((0.0, 720), (0.13, 880)):
        tk = tt(nsamp(0.14))
        B = at(B, np.sin(phase(f0 * (1 + 0.4 * smoothstep(tk / 0.08)))) * np.exp(-tk / 0.05) * attack(tk, 0.003), s, 0.9)
    T = burst(r, n, 2000, 6000, 0.002) * 0.15
    A = rv(B * 0.6, 0.4, 4000, -10.0, seed=57)
    return mix3("boop", n, T, B, A, 0.3, 1.0, 0.4), None


@reg("pluck_resolve")
def pluck_resolve(r, d):
    n = nsamp(d); t = tt(n)
    B = np.zeros(n)
    for i, (f, tau) in enumerate(((261.63, 1.0), (329.63, 1.0), (392.0, 1.0), (523.25, 1.7))):
        B = at(B, pluck_tone(f, 1.9, vel=0.8, tau_scale=tau, seed=i), i * 0.15, 0.85)
    T = burst(r, n, 1500, 5000, 0.004) * 0.2
    A = rv(B, 1.3, 4500, -8.0, seed=58)
    return mix3("pluck_resolve", n, T, B, A, 0.4, 1.0, 0.6), None


@reg("pop")
def pop(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 1500, 5000, 0.0012) * 0.3
    B = np.sin(phase(260 + 620 * (1 - np.exp(-t / 0.006)))) * np.exp(-t / 0.03) * attack(t, 0.0006)
    A = np.sin(2 * np.pi * 150 * t) * np.exp(-t / 0.05) * 0.2
    return lp(mix3("pop", n, T, B, A, 0.6, 1.0, 0.5), 3800, 2), None


@reg("page_flip")
def page_flip(r, d):
    n = nsamp(d); t = tt(n)
    flutter = 0.6 + 0.4 * np.sin(2 * np.pi * 38 * t) ** 2
    B = sweep_noise(r, n, 1600 + 2600 * smoothstep(t / 0.25), 0.7) * hump(t, 0.13, 0.08, 0.12) * flutter * 0.6
    T = np.zeros(n); T = at(T, burst(r, nsamp(0.05), 2000, 6000, 0.005), 0.26, 0.5)
    T = T + burst(r, n, 2000, 6000, 0.003) * 0.4
    A = rv(B * 0.4 + T * 0.3, 0.4, 5000, -10.0, seed=59)
    return mix3("page_flip", n, T, B, A, 0.6, 1.0, 0.4), None


@reg("final_chime")
def final_chime(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 3000, 9000, 0.002) * 0.4
    B = bell(1046.5, t, (1.0, 2.0, 2.4, 3.0, 4.2), (1.0, 0.45, 0.2, 0.2, 0.08), 1.6, 0.001) + 0.3 * np.sin(2 * np.pi * 523.25 * t) * np.exp(-t / 1.4)
    A = rv(B, 2.6, 5500, -4.0, seed=60)
    return mix3("final_chime", n, T, B, A, 0.3, 1.0, 0.9), None


@reg("whoosh")
def whoosh(r, d):
    n = nsamp(d); t = tt(n); h = 0.4
    fc = np.where(t < h, 300 * 6.5 ** (t / h), 2000 * np.exp(-(t - h) / 0.35) + 700)
    B = sweep_noise(r, n, fc, 0.95) * hump(t, h, 0.3, 0.25) * 0.8
    A = rv(B * 0.5, 0.7, 3200, -9.0, seed=61)
    return mix3("whoosh", n, np.zeros(n), B, A, 1.0, 1.0, 0.5), h


@reg("tick")
def tick(r, d):
    n = nsamp(d); t = tt(n)
    T = burst(r, n, 2000, 6200, 0.0015)
    B = np.sin(2 * np.pi * 1500 * t) * np.exp(-t / 0.01) * attack(t, 0.0005)
    A = rv(T * 0.4, 0.3, 4500, -12.0, seed=62)
    return mix3("tick", n, T, B, A, 0.7, 0.7, 0.4), None


# ---------------------------------------------------------------------------------------------------------------- finishing
def envelope(x, ms=2.0):
    p = (x ** 2).sum(axis=1) if x.ndim == 2 else x ** 2
    w = max(1, int(SR * ms / 1000))
    return np.sqrt(np.maximum(ndimage.uniform_filter1d(p, w, mode="nearest"), 0.0))


def auto_hit(x, kind):
    """where the HIT lands, computed from the finished sound according to the spec's kind
    start: the onset (the 1 ms envelope first reaches 25 % of the loudest moment of the first 250 ms)
    peak:  the middle of the region where the 50 ms envelope is within 2 dB of its maximum
    end:   the last moment the 25 ms envelope is within 1.5 dB of its maximum
    mark:  the first moment the 2 ms envelope reaches 60 % of its maximum (the transient after a riser: the riser stays far below it)"""
    if kind == "start":
        env = envelope(x, 1.0)
        head = env[:int(0.25 * SR)]
        if head.max() < 0.1 * env.max():
            return 0.0
        return float(np.argmax(head >= 0.25 * head.max()) / SR)
    if kind == "peak":
        env = envelope(x, 50.0)
        idx = np.nonzero(env >= 0.8 * env.max())[0]
        return float((idx[0] + idx[-1]) / 2 / SR)
    if kind == "mark":
        env = envelope(x, 2.0)
        return float(np.argmax(env >= 0.6 * env.max()) / SR)
    env = envelope(x, 25.0)
    return float(np.nonzero(env >= 0.84 * env.max())[0][-1] / SR)


def audible_start(x):
    """first moment the 10 ms envelope reaches -30 dB of the file's peak envelope (the pre-roll check reads this)"""
    env = envelope(x, 10.0)
    idx = np.nonzero(env >= env.max() * 0.0316)[0]
    return float(idx[0] / SR)


def finish(name, x, hit, d):
    n = nsamp(d)
    x = np.nan_to_num(np.asarray(x, dtype=float))
    if len(x) < n:
        x = np.pad(x, [(0, n - len(x))] + [(0, 0)] * (x.ndim - 1))
    x = x[:n]
    x = hp_zero(x, 12.0 if d >= 0.5 else 40.0, 2)
    x = fade_in(x, 0.5 if d < 1.0 else 3.0)
    x = fade_out(x, min(60.0, max(6.0, d * 1000 * 0.04)))
    return normalize_peak(x, -1.0)


def synth_one(name, spec):
    kind, dur, _ = spec[name]
    r = rng_for(name)
    x, hit = REG[name](r, dur)
    x = finish(name, x, hit, dur)
    auto = auto_hit(x, kind)
    if hit is not None:
        assert abs(auto - hit) < 0.10, f"{name}: designed hit {hit:.3f}s but the finished sound's hit is at {auto:.3f}s"
    return x, float(auto)


def build(only=None, outdir: Path = SFX_DIR, verbose=True):
    spec = parse_spec()
    outdir.mkdir(parents=True, exist_ok=True)
    idx_path = outdir / "index.json"
    index = json.loads(idx_path.read_text()) if (only and idx_path.exists()) else {}
    names = [n for n in spec if (not only or n in only)]
    missing = [n for n in spec if n not in REG]
    assert not missing, f"no synth for {missing}"
    extra = [n for n in REG if n not in spec]
    assert not extra, f"synth without a spec in src/sfx.ts: {extra}"
    for name in names:
        x, hit = synth_one(name, spec)
        stereo = x.ndim == 2
        assert stereo == (name in STEREO), f"{name}: stereo mismatch"
        fn = f"{name}.wav"
        write_wav(outdir / fn, x, "PCM_24")
        mono = x.mean(axis=1) if stereo else x
        index[name] = {
            "file": fn, "dur": round(len(x) / SR, 6), "hit": round(hit, 6), "stereo": bool(stereo), "hitKind": spec[name][0], "audibleStart": round(audible_start(x), 4),
            "peakDb": round(float(lin2db(np.max(np.abs(x)))), 2), "rmsDb": round(float(lin2db(rms(x))), 2), "dc": round(float(np.mean(mono)), 8),
            "centroidHz": round(spectral_centroid(mono), 1), "layers": LAYERS.get(name),
        }
        if verbose:
            e = index[name]
            print(f"{name:16s} dur {e['dur']:5.2f}  hit {e['hit']:6.3f} ({spec[name][0]:5s}) audible {e['audibleStart']:5.3f}  peak {e['peakDb']:6.2f}  rms {e['rmsDb']:6.2f}  cent {e['centroidHz']:7.1f}  layers {e['layers']}")
    index = {k: index[k] for k in spec if k in index}
    idx_path.write_text(json.dumps(index, indent=1) + "\n")
    return index


def write_doc():
    spec = parse_spec()
    index = json.loads((SFX_DIR / "index.json").read_text())
    rows = []
    for name, (kind, dur, what) in spec.items():
        e = index[name]
        ly = e.get("layers") or {}
        rows.append(f"| `{name}` | {kind} | {e['dur']:.2f} | {e['hit']:.3f} | {e['audibleStart']:.3f} | {'yes' if e['stereo'] else ''} | T {ly.get('T', '')} / B {ly.get('B', '')} / A {ly.get('A', '')} | {what} |")
    out = ROOT / "docs" / "SFX.md"
    out.parent.mkdir(exist_ok=True)
    out.write_text("# SFX: the sound vocabulary\n\nEvery sound is three layers (T transient, B body, A tail); the transient lands on the visual hit. Procedural, seeded, deterministic (`python3 scripts/make_sfx.py`).\n"
                   "`hit` = seconds into the file where the transient is; `audible` = when the file first reaches -30 dB of its peak (the pre-roll of the move sounds).\n\n"
                   "| name | hit kind | dur s | hit s | audible s | stereo | layers (RMS dB) | what |\n|---|---|---|---|---|---|---|---|\n" + "\n".join(rows) + "\n")
    return out


def plot_sheets(outdir: Path, per_sheet=9, cols=3, only=None):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import soundfile as sf
    spec = parse_spec()
    index = json.loads((SFX_DIR / "index.json").read_text())
    names = [n for n in spec if (not only or n in only)]
    outdir.mkdir(parents=True, exist_ok=True)
    for si in range(0, len(names), per_sheet):
        grp = names[si:si + per_sheet]
        fig, axes = plt.subplots(len(grp) // cols + (len(grp) % cols > 0), cols, figsize=(cols * 5, 3.2 * ((len(grp) + cols - 1) // cols)), squeeze=False)
        for ax, nm in zip(axes.ravel(), grp):
            x, sr = sf.read(str(SFX_DIR / f"{nm}.wav"), always_2d=False)
            m = x.mean(axis=1) if x.ndim == 2 else x
            ax.specgram(m, NFFT=1024, Fs=sr, noverlap=768, cmap="magma", vmin=-120)
            ax.axvline(index[nm]["hit"], color="cyan", lw=1)
            ax.set_title(f"{nm}  hit {index[nm]['hit']:.2f}s", fontsize=9)
            ax.set_ylim(0, 12000)
        for ax in axes.ravel()[len(grp):]:
            ax.axis("off")
        fig.tight_layout()
        fig.savefig(outdir / f"sheet{si // per_sheet:02d}.png", dpi=70)
        plt.close(fig)


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--doc":
        print(write_doc())
    elif args and args[0] == "--plots":
        plot_sheets(ROOT / "build" / "sfx_plots", only=args[1:] or None)
    else:
        build(only=set(args) or None)
