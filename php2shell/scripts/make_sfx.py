#!/usr/bin/env python3
"""PHP2Shell: procedural sound-effect synthesis.

Synthesises EVERY name of SFX_SPEC (src/sfx.ts) into public/sfx/<name>.wav (48 kHz, 24-bit, mono unless a stereo sweep, peak -1 dBFS)
and public/sfx/index.json {name: {file, dur, hit, stereo, ...}} where `hit` = seconds from the start of the file at which the HIT lands
(start: the onset, peak: the loudest moment of a sweep, end: the climax of a riser).  Seeded and deterministic: running it twice gives
byte-identical files.  Taste: "Apple keynote at night": filtered noise, sine/FM tones, tuned partials, short convolution tails; dark, warm, clean.

    python3 scripts/make_sfx.py            # all sounds
    python3 scripts/make_sfx.py thoom pop  # only these
    python3 scripts/make_sfx.py --plots [name ...]   # spectrogram contact sheets -> build/sfx_plots/
    python3 scripts/make_sfx.py --doc                # docs/SFX.md
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

# ---------------------------------------------------------------------------------------------------------------- spec
SFX_TS = ROOT / "src" / "sfx.ts"

# the equal table kept in the script: name -> (hit kind, duration seconds).  Asserted against src/sfx.ts on every run.
TABLE = {
    "sub_drone": ("start", 8.0), "clock_tick": ("start", 0.25), "thoom": ("start", 1.6), "alarm_swell": ("end", 1.5), "server_ping": ("start", 0.2),
    "whoosh_through": ("peak", 1.2), "ui_click": ("start", 0.15), "heartbeat": ("start", 0.7),
    "layer_sweep": ("peak", 1.4), "scuttle": ("start", 0.6), "key_click": ("start", 0.1), "reverse_riser": ("end", 2.4),
    "focus_swoosh": ("end", 0.55), "chip_tick": ("start", 0.3), "caught_click": ("start", 0.25),
    "pluck": ("start", 1.2), "tok": ("start", 0.25), "bike_bell": ("start", 1.4),
    "tiffin_rattle": ("start", 0.8), "lid_clink": ("start", 0.6), "key_jingle": ("start", 0.6), "uhoh_note": ("start", 0.9),
    "data_hum": ("start", 4.0), "swipe": ("start", 0.3), "glitch_tsk": ("start", 0.15),
    "stealth_pulse": ("start", 0.7), "denied_buzz": ("start", 0.6), "big_hit": ("start", 2.0), "zap_sweep": ("start", 0.9),
    "ratchet_tick": ("start", 0.08), "clunk": ("start", 0.9), "chime_pos": ("start", 1.4), "ping_impact": ("start", 0.35),
    "piano_note": ("start", 3.5), "glass_tap": ("start", 0.5), "chord_resolved": ("start", 4.0),
    "type_click": ("start", 0.08), "send_whoosh": ("start", 0.45), "tick_asc": ("start", 0.25), "shutter": ("start", 0.25),
    "bonk_neg": ("start", 0.5), "ding_pos": ("start", 1.6), "spin_whoosh": ("start", 0.8),
    "pluck_resolve": ("start", 1.8), "pop": ("start", 0.2), "plane_swish": ("start", 0.9), "final_chime": ("start", 3.5),
    "whoosh": ("peak", 0.8), "tick": ("start", 0.1),
}
STEREO = {"whoosh_through", "spin_whoosh", "plane_swish"}


def parse_spec() -> dict:
    """read name -> (hit, dur seconds, what) out of src/sfx.ts"""
    txt = SFX_TS.read_text()
    out = {}
    for m in re.finditer(r'^\s*([a-z0-9_]+):\s*\{\s*hit:\s*"(start|peak|end)",\s*dur:\s*"([0-9.]+)\s*s",\s*what:\s*"(.*)"\s*\},?\s*$', txt, re.M):
        out[m.group(1)] = (m.group(2), float(m.group(3)), m.group(4))
    return out


def check_spec(spec: dict):
    missing = sorted(set(spec) - set(TABLE))
    extra = sorted(set(TABLE) - set(spec))
    assert not missing, f"sounds in src/sfx.ts but not in make_sfx.py TABLE: {missing}"
    assert not extra, f"sounds in make_sfx.py TABLE but not in src/sfx.ts: {extra}"
    for k, (hit, dur, _) in spec.items():
        assert TABLE[k] == (hit, dur), f"{k}: src/sfx.ts says {(hit, dur)}, make_sfx.py TABLE says {TABLE[k]}"


# ---------------------------------------------------------------------------------------------------------------- helpers
REG: dict = {}


def reg(name):
    def deco(fn):
        REG[name] = fn
        return fn
    return deco


def unit(x):
    p = np.max(np.abs(x))
    return x / p if p > 0 else x


def burst(r, n, lo, hi, tau, order=2, att=0.0003):
    """band-limited noise burst with an exponential decay: the 'click' of most small sounds"""
    t = tt(n)
    return unit(bp(noise(r, n), lo, hi, order)) * np.exp(-t / tau) * attack(t, att)


def at(buf, x, sec, gain=1.0):
    """add component x at `sec` (its last 6 ms are faded so a cut-off component never clicks)"""
    return place(buf, fade_out(x, min(6.0, 1000.0 * len(x) / SR / 3)), int(round(sec * SR)), gain)


def fmbell(f, t, ratio=1.0, idx=1.5, idx_tau=0.1, tau=0.8, att=0.002):
    mod = np.sin(2 * np.pi * f * ratio * t) * idx * np.exp(-t / idx_tau)
    return np.sin(2 * np.pi * f * t + mod) * attack(t, att) * np.exp(-t / tau)


def pluck_tone(f, dur, vel=0.8, tau_scale=1.0, seed=0, bright=1.0):
    """warm light pluck: decaying harmonics (high ones die first), soft pick; unit-ish amplitude"""
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


# ---------------------------------------------------------------------------------------------------------------- S1
@reg("sub_drone")
def sub_drone(r, d):
    n = nsamp(d)
    t = tt(n)
    f0 = 45.0 * (1 + 0.004 * np.sin(2 * np.pi * 0.07 * t))
    p1, p2 = phase(f0), phase(f0 + 0.38)  # slow beating ~0.4 Hz
    base = np.sin(p1) + 0.32 * np.sin(p2 + 1.1)
    shimmer = 0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t)
    harm = (0.40 * np.sin(2 * p1 + 0.4) + 0.18 * np.sin(2 * p2 + 2.0) + 0.22 * np.sin(3 * p1 + 1.3) * shimmer
            + 0.08 * np.sin(4 * p2 + 0.2) + 0.07 * np.sin(5 * p1 + 0.9) * shimmer)
    air = lp(noise(r, n), 150, 2)
    air = 0.10 * air / rms(air) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.09 * t))
    x = base + harm + air
    rise = np.clip(t / 6.2, 0, 1) ** 1.7  # fades in from silence over its length ...
    fall = np.where(t < 6.2, 1.0, 0.5 + 0.5 * np.cos(np.pi * np.clip((t - 6.2) / (d - 6.2), 0, 1)))  # ... and breathes out at the very end
    return x * rise * fall, 0.0


@reg("clock_tick")
def clock_tick(r, d):
    n = nsamp(d)
    t = tt(n)
    click = burst(r, n, 2200, 5800, 0.0011)
    body = modal(t, [(820, 0.9, 0.018), (1710, 0.5, 0.011), (2690, 0.25, 0.007)]) * attack(t, 0.0004)
    tock = 0.22 * np.sin(2 * np.pi * 410 * t) * np.exp(-t / 0.04)  # tiny wooden cavity
    x = 0.8 * click + 0.55 * body + tock
    x = reverb(x, make_ir(0.14, seed=3, lp_hz=5000), wet_db=-24)
    return x, None


@reg("thoom")
def thoom(r, d):
    n = nsamp(d)
    t = tt(n)
    f = 32 + 48 * np.exp(-t / 0.16)  # 80 -> 32 Hz
    p = phase(f)
    env = attack(t, 0.004) * np.exp(-t / 0.42)
    x = np.sin(p) * env + 0.36 * np.sin(2 * p + 0.3) * np.exp(-t / 0.26) + 0.12 * np.sin(3 * p) * np.exp(-t / 0.12)
    thump = lp(noise(r, n), 150, 2)
    x += 0.55 * unit(thump) * np.exp(-t / 0.05) * attack(t, 0.002)
    x = soft_sat(x, 1.5)
    x = reverb(x, make_ir(1.3, seed=5, lp_hz=420), wet_db=-9)
    return x, None


@reg("alarm_swell")
def alarm_swell(r, d):
    n = nsamp(d)
    t = tt(n)
    hit_t = 1.42
    u = np.clip(t / hit_t, 0, 1)
    f1 = 110.0 * 2 ** ((3.2 * u ** 1.5) / 12)  # slow upward pitch drift of ~3 semitones
    f2 = f1 * 2 ** (1 / 12) * 1.0015  # a detuned minor second above: the unease
    fc = 330.0 * 8.5 ** (u ** 1.25)  # filter opens 330 -> 2800 Hz
    trem_rate = 3.0 + 11.0 * u ** 2  # tremolo accelerates
    trem = 1 - 0.36 * (0.5 + 0.5 * np.sin(phase(trem_rate)))
    pad = (saw_filtered(f1, fc, 26, 1.2) + saw_filtered(f2, fc, 26, 1.2, 1.3) + 0.55 * saw_filtered(f1 * 0.5, fc * 0.6, 20, 1.2, 2.1)
           + 0.4 * saw_filtered(f2 * 2.0 * 1.003, fc * 0.8, 20, 1.4, 0.4))
    air = sweep_noise(r, n, 600 * 6 ** u, 1.3) * 0.22
    env = (0.04 + 0.96 * u ** 2.3) * np.where(t < hit_t, 1.0, 0.5 + 0.5 * np.cos(np.pi * np.clip((t - hit_t) / (d - hit_t), 0, 1)))
    env = env * attack(t, 0.03)
    x = (pad * trem + air) * env
    x = lp(x, 7000, 1)
    return x, hit_t


@reg("server_ping")
def server_ping(r, d):
    n = nsamp(d)
    t = tt(n)
    f = 1760.0
    x = modal(t, [(f, 1.0, 0.032), (f * 2.76, 0.28, 0.013), (f * 5.4, 0.08, 0.006)]) * attack(t, 0.0006)
    x += 0.18 * burst(r, n, 4000, 9000, 0.0008)
    return lp(x, 9000, 1), None


# ---------------------------------------------------------------------------------------------------------------- S2
@reg("whoosh_through")
def whoosh_through(r, d):
    n = nsamp(d)
    t = tt(n)
    pk = 0.55
    u1 = np.clip(t / pk, 0, 1)
    u2 = np.clip((t - pk) / (d - pk), 0, 1)
    fc = np.where(t < pk, 220.0 * (2900 / 220.0) ** (u1 ** 1.4), 2900.0 * (900 / 2900.0) ** (u2 ** 0.7))  # approach: up; Doppler fall after
    env = np.where(t < pk, 0.02 + 0.98 * u1 ** 2.2, np.exp(-(t - pk) / 0.20)) * attack(t, 0.02)
    common = sweep_noise(r, n, fc, 1.15)
    L = 0.72 * common + 0.62 * sweep_noise(r, n, fc, 1.15)
    R = 0.72 * common + 0.62 * sweep_noise(r, n, fc, 1.15)
    rumble = lp(noise(r, n), 130, 2)
    rumble = 0.55 * rumble / rms(rumble) * env ** 1.5
    # air displacement: a faint low swell arriving just before the pass
    out = np.stack([L * env + rumble, R * env + rumble * 0.95], axis=1)
    out = lp(out, 12000, 1)
    return out, pk


@reg("ui_click")
def ui_click(r, d):
    n = nsamp(d)
    t = tt(n)
    thump = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.014) * attack(t, 0.0008)
    tick = burst(r, n, 1200, 3600, 0.0014)
    x = thump + 0.55 * tick + 0.2 * np.sin(2 * np.pi * 760 * t) * np.exp(-t / 0.006)
    return lp(x, 6500, 1), None


@reg("heartbeat")
def heartbeat(r, d):
    n = nsamp(d)
    t = tt(n)

    def thump(amp, f0, dur=0.3):
        m = nsamp(dur)
        tm = tt(m)
        f = f0 * (1 + 0.55 * np.exp(-tm / 0.03))
        p = phase(f)
        env = attack(tm, 0.007) * np.exp(-tm / 0.07)
        y = (np.sin(p) + 0.34 * np.sin(2 * p + 0.5) * np.exp(-tm / 0.04)) * env
        y += 0.2 * unit(lp(noise(r, m), 180, 2)) * np.exp(-tm / 0.02)
        return amp * soft_sat(y, 1.3)

    x = np.zeros(n)
    at(x, thump(1.0, 52), 0.0)
    at(x, thump(0.72, 58), 0.22)
    x = reverb(x, make_ir(0.35, seed=7, lp_hz=500), wet_db=-14)
    return x, None


# ---------------------------------------------------------------------------------------------------------------- S3
@reg("layer_sweep")
def layer_sweep(r, d):
    n = nsamp(d)
    t = tt(n)
    pk = 0.7
    bell = np.exp(-0.5 * ((t - pk) / 0.30) ** 2) * attack(t, 0.1)
    fc = 160.0 * (1300 / 160.0) ** smoothstep(t / 1.2)
    body = sweep_noise(r, n, fc, 0.8)
    # shimmering high partials sliding up like a lifting pane
    shim = np.zeros(n)
    for k, f0 in enumerate([1180, 1760, 2330, 3150, 4200, 5300]):
        f = f0 * 2 ** ((4.0 * smoothstep(t / 1.25)) / 12) * (1 + 0.0015 * k)
        am = 0.55 + 0.45 * np.sin(2 * np.pi * (3.0 + 1.3 * k) * t + k * 1.7)
        shim += (0.9 ** k) * am * np.sin(phase(f, k * 0.9))
    shim *= np.exp(-0.5 * ((t - pk - 0.05) / 0.26) ** 2) * attack(t, 0.15)
    x = 0.75 * body * bell + 0.16 * shim
    x = reverb(x, make_ir(0.8, seed=11, lp_hz=5500), wet_db=-10)
    return lp(x, 9000, 1), pk


@reg("scuttle")
def scuttle(r, d):
    n = nsamp(d)
    x = np.zeros(n)
    gaps = r.choice([0.03, 0.045, 0.06, 0.085, 0.12], size=9)
    times = np.concatenate([[0.0], np.cumsum(gaps)])
    times = times * (0.52 / times[-1])
    for k, tm in enumerate(times):
        f = r.uniform(3000, 6200)
        m = nsamp(0.03)
        tk = tt(m)
        tick = burst(r, m, f * 0.8, f * 1.35, 0.0022) + 0.5 * np.sin(2 * np.pi * f * tk) * np.exp(-tk / 0.003)
        at(x, tick, tm, [1.0, 0.55, 0.8, 0.45, 0.7, 0.5, 0.9, 0.4, 0.6, 0.35][k] * r.uniform(0.75, 1.0))
    return x, 0.0


@reg("key_click")
def key_click(r, d):
    n = nsamp(d)
    t = tt(n)
    down = 0.9 * burst(r, n, 1500, 6200, 0.0016) + 0.7 * np.sin(2 * np.pi * 340 * t) * np.exp(-t / 0.012) * attack(t, 0.0006)
    x = down.copy()
    m = nsamp(0.03)
    up = 0.22 * burst(r, m, 1800, 5200, 0.0018) + 0.18 * np.sin(2 * np.pi * 520 * tt(m)) * np.exp(-tt(m) / 0.006)
    at(x, up, 0.052)
    return lp(x, 8000, 1), None


@reg("reverse_riser")
def reverse_riser(r, d):
    n = nsamp(d)
    t = tt(n)
    # build it forwards as a soft cymbal / tape stop with dust, then play it backwards
    # soft dark cymbal: inharmonic partial cluster + air
    cym = np.zeros(n)
    for _ in range(14):
        f = r.uniform(1800, 8500)
        cym += r.uniform(0.3, 1.0) * np.sin(2 * np.pi * f * t + r.uniform(0, 6.28)) * np.exp(-t / r.uniform(0.35, 0.9))
    cym = unit(cym)
    air = unit(hp(pink(r, n), 1800, 2)) * np.exp(-t / 0.55)
    # tape-stop tone: falls in pitch like a spooled-down reel (wow & flutter)
    wow = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) + 0.003 * np.sin(2 * np.pi * 11.3 * t + 1)
    f = (45.0 + 300.0 * np.exp(-t / 0.7)) * wow
    tone = np.sin(phase(f)) + 0.3 * np.sin(2 * phase(f) + 0.7)
    tone *= np.exp(-t / 0.75)
    # dust: sparse crackle
    dust = np.zeros(n)
    idx = np.where(r.random(n) < 55 / SR)[0]
    dust[idx] = r.uniform(-1, 1, size=len(idx))
    dust = unit(bp(dust, 1500, 7000, 2)) * np.exp(-t / 1.1)
    fwd = 0.5 * cym * np.exp(-t / 0.7) + 0.55 * air + 0.55 * tone + 0.35 * dust
    fwd = fwd * attack(t, 0.03)
    fwd = lp(fwd, 9500, 1)
    x = fwd[::-1].copy()
    # hit = the end of the build, just before the 30 ms ramp-down
    return x, d - 0.034


# ---------------------------------------------------------------------------------------------------------------- S4
@reg("focus_swoosh")
def focus_swoosh(r, d):
    n = nsamp(d)
    t = tt(n)
    lock_t = 0.462
    u = np.clip(t / lock_t, 0, 1)
    fc = 650.0 * (4800 / 650.0) ** (u ** 1.2)
    sw = sweep_noise(r, n, fc, 0.75)
    env = attack(t, 0.05) * (0.15 + 0.85 * u ** 1.5) * np.where(t < lock_t, 1.0, np.exp(-(t - lock_t) / 0.02))
    air = hp(sw * env, 900, 1)
    # a rising whisper tone (the lens focusing) which "locks"
    tone = 0.22 * np.sin(phase(900 * 2 ** (u * 14 / 12))) * env * u
    x = air * 0.85 + tone
    m = nsamp(0.09)
    tm = tt(m)
    lock = 0.55 * burst(r, m, 2500, 7000, 0.0012) + 0.9 * np.sin(2 * np.pi * 2500 * tm) * np.exp(-tm / 0.022) * attack(tm, 0.0005)
    at(x, lock, lock_t, 0.75)
    return lp(x, 11000, 1), lock_t


@reg("chip_tick")
def chip_tick(r, d):
    n = nsamp(d)
    t = tt(n)
    f = 1480.0
    x = modal(t, [(f, 1.0, 0.03), (f * 2.0, 0.4, 0.02)]) * attack(t, 0.0005)
    x += modal(t, [(f * 2.0, 0.17, 0.15), (f * 2.76, 0.12, 0.10), (f * 5.4, 0.05, 0.055)]) * attack(t, 0.0008)
    x += 0.35 * burst(r, n, 3500, 9000, 0.0009)
    return lp(x, 10500, 1), None


@reg("caught_click")
def caught_click(r, d):
    n = nsamp(d)
    t = tt(n)
    a = 0.9 * burst(r, n, 1800, 5500, 0.0018) + 0.6 * np.sin(2 * np.pi * 780 * t) * np.exp(-t / 0.008)
    x = a.copy()
    m = nsamp(0.12)
    tm = tt(m)
    b = 0.7 * burst(r, m, 1000, 3600, 0.003) + 0.9 * np.sin(2 * np.pi * 520 * tm) * np.exp(-tm / 0.016) * attack(tm, 0.0005)
    at(x, b, 0.058)
    return lp(x, 8000, 1), None


# ---------------------------------------------------------------------------------------------------------------- S5
@reg("pluck")
def pluck(r, d):
    n = nsamp(d)
    x = pluck_tone(261.63, d, vel=0.8, tau_scale=0.62, seed=2)
    x = reverb(x, make_ir(0.7, seed=13, lp_hz=5000), wet_db=-14)
    return x[:n], None


@reg("tok")
def tok(r, d):
    n = nsamp(d)
    t = tt(n)
    f = 460.0 * (1 + 0.22 * np.exp(-t / 0.008))
    p = phase(f)
    x = (np.sin(p) * np.exp(-t / 0.03) + 0.45 * np.sin(2.45 * p + 0.4) * np.exp(-t / 0.014) + 0.15 * np.sin(3.8 * p) * np.exp(-t / 0.008)) * attack(t, 0.0005)
    x += 0.35 * unit(lp(noise(r, n), 1100, 2)) * np.exp(-t / 0.004)
    x = reverb(x, make_ir(0.12, seed=17, lp_hz=4000), wet_db=-22)
    return x, None


@reg("bike_bell")
def bike_bell(r, d):
    n = nsamp(d)
    t = tt(n)
    f1 = 2350.0
    f2 = f1 * 1.505
    x = modal(t, [(f1, 1.0, 0.55), (f1 + 5.5, 0.8, 0.5), (f2, 0.55, 0.36), (f2 - 4.5, 0.45, 0.33), (f1 * 2.1, 0.12, 0.12)]) * attack(t, 0.0009)
    x += 0.25 * burst(r, n, 3000, 8000, 0.0012)
    x = lp(x, 7500, 1)
    x = reverb(x, make_ir(0.9, seed=19, lp_hz=6500), wet_db=-12)
    return x, None


# ---------------------------------------------------------------------------------------------------------------- S6
@reg("tiffin_rattle")
def tiffin_rattle(r, d):
    n = nsamp(d)
    x = np.zeros(n)
    times = np.array([0.0, 0.052, 0.098, 0.153, 0.208, 0.265, 0.335, 0.41, 0.50]) + r.uniform(-0.006, 0.006, size=9) * np.array([0, 1, 1, 1, 1, 1, 1, 1, 1])
    amps = [1.0, 0.62, 0.85, 0.5, 0.72, 0.42, 0.55, 0.32, 0.22]
    for tm, a in zip(times, amps):
        f = r.uniform(1300, 3000)
        m = nsamp(0.14)
        tk = tt(m)
        tin = modal(tk, [(f, 1.0, 0.03), (f * 1.58, 0.6, 0.02), (f * 2.37, 0.4, 0.014), (f * 3.4, 0.2, 0.008)]) * attack(tk, 0.0004)
        tin += 0.5 * burst(r, m, 2500, 6500, 0.0016)
        at(x, tin, max(tm, 0), a)
    tail = unit(bp(noise(r, n), 2200, 6500, 2)) * np.exp(-tt(n) / 0.22) * attack(tt(n), 0.04)
    x += 0.10 * tail
    return lp(x, 10000, 1), 0.0


@reg("lid_clink")
def lid_clink(r, d):
    n = nsamp(d)
    t = tt(n)
    x = modal(t, [(2850, 1.0, 0.16), (2853.2, 0.7, 0.14), (4310, 0.62, 0.11), (6200, 0.34, 0.07), (1420, 0.42, 0.20)]) * attack(t, 0.0005)
    x += 0.55 * burst(r, n, 2500, 8500, 0.0012)
    x += 0.4 * np.sin(2 * np.pi * 640 * t) * np.exp(-t / 0.02)
    x = lp(x, 9500, 1)
    x = reverb(x, make_ir(0.25, seed=23, lp_hz=6000), wet_db=-18)
    return x, None


@reg("key_jingle")
def key_jingle(r, d):
    n = nsamp(d)
    x = np.zeros(n)
    times = [0.0, 0.07, 0.122, 0.205, 0.318]
    amps = [1.0, 0.82, 0.7, 0.52, 0.36]
    for tm, a in zip(times, amps):
        f = r.uniform(4100, 6300)
        m = nsamp(0.16)
        tk = tt(m)
        k = modal(tk, [(f, 1.0, 0.045), (f * 1.51, 0.55, 0.032), (f * 2.3, 0.28, 0.02)]) * attack(tk, 0.0004) + 0.35 * burst(r, m, 4000, 9500, 0.0010)
        at(x, k, tm, a)
    x = lp(x, 11000, 1)
    x = reverb(x, make_ir(0.3, seed=29, lp_hz=7000), wet_db=-18)
    return x, 0.0


@reg("uhoh_note")
def uhoh_note(r, d):
    n = nsamp(d)
    t = tt(n)
    x = np.zeros(n)

    def note(f, dur, amp, scoop=0.0, rel=0.07):
        m = nsamp(dur + rel)
        tm = tt(m)
        fe = f * 2 ** ((scoop * np.exp(-tm / 0.05)) / 12)
        fc = 760.0 * np.exp(-tm / 0.5) + 260.0
        y = (saw_filtered(fe * 2 ** (-6 / 1200), fc, 18, 1.4) + saw_filtered(fe * 2 ** (6 / 1200), fc, 18, 1.4, 1.1)) * 0.5
        y += 0.9 * np.sin(phase(fe)) + 0.25 * np.sin(phase(fe * 0.5))
        env = attack(tm, 0.024) * np.where(tm < dur, 1.0, 0.5 + 0.5 * np.cos(np.pi * np.clip((tm - dur) / rel, 0, 1)))
        env *= np.exp(-tm / (0.7 if dur > 0.4 else 0.4))
        return amp * y * env

    at(x, note(196.0, 0.27, 0.8, scoop=-0.4), 0.0)  # G3  "uh"
    at(x, note(164.81, 0.50, 1.0, scoop=-0.6, rel=0.12), 0.34)  # E3  "oh" (a minor third down)
    x = soft_sat(x, 1.2)
    x = reverb(x, make_ir(0.6, seed=31, lp_hz=2500), wet_db=-13)
    return lp(x, 3500, 1), None


# ---------------------------------------------------------------------------------------------------------------- S7
@reg("data_hum")
def data_hum(r, d):
    n = nsamp(d)
    t = tt(n)
    f = 55.0 * (1 + 0.0025 * np.sin(2 * np.pi * 0.9 * t))
    fc = 380 + 260 * np.sin(2 * np.pi * 0.45 * t + 0.5)
    x = saw_filtered(f, fc, 26, 1.1) + 0.7 * saw_filtered(f * 1.0035, fc * 0.9, 26, 1.1, 0.8)
    x = x / rms(x)
    flow = bp(noise(r, n), 650, 2800, 2)
    flow = flow / rms(flow) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.7 * t)) * 0.16
    whine = (0.045 * np.sin(phase(660 * (1 + 0.003 * np.sin(2 * np.pi * 5.1 * t)))) + 0.03 * np.sin(phase(990 * (1 + 0.003 * np.sin(2 * np.pi * 4.3 * t + 1)))))
    whine *= 0.5 + 0.5 * np.sin(2 * np.pi * 0.31 * t + 2)
    y = x + flow + whine * 4
    env = np.sin(np.pi * t / d) ** 2
    return y * env, 0.0


@reg("swipe")
def swipe(r, d):
    n = nsamp(d)
    t = tt(n)
    fc = 1100.0 * 3.4 ** smoothstep(t / 0.24)
    env = attack(t, 0.032) * np.exp(-t / 0.11) * (1 - smoothstep((t - 0.2) / 0.1))
    x = sweep_noise(r, n, fc, 0.55) * env
    return lp(x, 9000, 1), None


@reg("glitch_tsk")
def glitch_tsk(r, d):
    n = nsamp(d)
    t = tt(n)
    x = hp(noise(r, n), 2800, 2) * np.exp(-t / 0.022) * attack(t, 0.0002)
    m = nsamp(0.03)
    x2 = hp(noise(r, m), 3500, 2) * np.exp(-tt(m) / 0.008)
    at(x, x2, 0.052, 0.45 * x.max() / (x2.max() + 1e-9))
    x = unit(x)
    # bit-crush (4.5 bits) + sample-rate reduction (hold 3 samples): digital grit, then tamed
    x = np.repeat(x[::3], 3)[:n]
    q = 2 ** 3.5
    x = np.round(x * q) / q
    x = lp(x, 9000, 2)
    return x, None


# ---------------------------------------------------------------------------------------------------------------- S8
@reg("stealth_pulse")
def stealth_pulse(r, d):
    n = nsamp(d)
    t = tt(n)
    f = 50.0 * (1 + 0.14 * np.exp(-t / 0.1))
    p = phase(f)
    env = smoothstep(t / 0.045) * np.exp(-t / 0.2)
    x = (np.sin(p) + 0.32 * np.sin(2 * p + 0.6) * np.exp(-t / 0.12)) * env
    x += 0.25 * unit(lp(noise(r, n), 130, 2)) * np.exp(-t / 0.05) * attack(t, 0.01)
    x = soft_sat(x, 1.3)
    x = reverb(x, make_ir(0.5, seed=37, lp_hz=420), wet_db=-12)
    return x, None


@reg("denied_buzz")
def denied_buzz(r, d):
    n = nsamp(d)
    t = tt(n)
    click = burst(r, n, 1800, 5200, 0.0016) * 0.9 + 0.5 * np.sin(2 * np.pi * 280 * t) * np.exp(-t / 0.01)
    f = 92.0 * 2 ** (-(1.2 * smoothstep(t / 0.5)) / 12)
    buzz = saw_filtered(f, 650.0 + 0 * t, 22, 1.0) + 0.5 * np.sign(np.sin(phase(f * 1.004))) * lp(np.ones(n), 400, 1)
    buzz = lp(buzz / np.max(np.abs(buzz)), 900, 2)

    def gate(a, b, rel=0.02):
        return smoothstep((t - a) / 0.006) * (1 - smoothstep((t - b) / rel))
    g = 0.85 * gate(0.045, 0.165) + 0.6 * gate(0.235, 0.43, 0.06) * np.exp(-(t - 0.235).clip(0) / 0.35)
    x = 0.95 * click + 0.7 * buzz * g
    x = reverb(x, make_ir(0.3, seed=41, lp_hz=2500), wet_db=-16)
    return x, None


@reg("big_hit")
def big_hit(r, d):
    n = nsamp(d)
    t = tt(n)
    f = 28 + 62 * np.exp(-t / 0.22)
    p = phase(f)
    boom = np.sin(p) * attack(t, 0.003) * np.exp(-t / 0.56)
    body = 0.55 * np.sin(phase(70 + 170 * np.exp(-t / 0.05))) * np.exp(-t / 0.16) * attack(t, 0.002)
    sub2 = 0.5 * np.sin(2 * p + 0.2) * np.exp(-t / 0.3) + 0.2 * np.sin(3 * p + 0.5) * np.exp(-t / 0.15)
    trans = 0.8 * unit(lp(noise(r, n), 2600, 2)) * np.exp(-t / 0.011) + 0.7 * unit(lp(noise(r, n), 650, 2)) * np.exp(-t / 0.07)
    x = boom + body + sub2 + trans
    x = soft_sat(x, 2.0)
    x = reverb(x, make_ir(1.7, seed=43, lp_hz=700), wet_db=-8)
    return x, None


@reg("zap_sweep")
def zap_sweep(r, d):
    n = nsamp(d)
    t = tt(n)
    sw = 0.7
    u = np.clip(t / sw, 0, 1)
    fc = 170.0 * (6000 / 170.0) ** (u ** 1.25)
    nz = sweep_noise(r, n, fc, 0.65)
    steps = np.repeat(r.uniform(0.35, 1.0, size=n // 300 + 2), 300)[:n]
    crackle = lp(steps, 400, 1)
    car = fc * 0.5
    tone = np.sin(phase(car) + 2.4 * np.sin(phase(car * 1.5))) * 0.22
    env = attack(t, 0.02) * np.where(t < sw, 0.5 + 0.5 * u, np.exp(-(t - sw) / 0.07))
    x = (nz * (0.55 + 0.45 * crackle) + tone) * env
    return lp(x, 11000, 1), None


# ---------------------------------------------------------------------------------------------------------------- S9
@reg("ratchet_tick")
def ratchet_tick(r, d):
    n = nsamp(d)
    t = tt(n)
    x = burst(r, n, 1500, 4800, 0.0013) + 0.5 * np.sin(2 * np.pi * 1250 * t) * np.exp(-t / 0.007) * attack(t, 0.0003)
    m = nsamp(0.02)
    at(x, 0.35 * burst(r, m, 1200, 3500, 0.002), 0.012)
    return lp(x, 7500, 1), None


@reg("clunk")
def clunk(r, d):
    n = nsamp(d)
    t = tt(n)
    f = 70 + 28 * np.exp(-t / 0.05)
    body = np.sin(phase(f)) * np.exp(-t / 0.14) * attack(t, 0.001)
    ring = modal(t, [(410, 0.55, 0.25), (688, 0.40, 0.18), (1133, 0.28, 0.1), (1790, 0.12, 0.06)]) * attack(t, 0.0007)
    trans = 0.9 * unit(lp(noise(r, n), 2200, 2)) * np.exp(-t / 0.006)
    x = body * 1.0 + ring + trans * 0.8
    x = soft_sat(x, 1.6)
    x = reverb(x, make_ir(0.55, seed=47, lp_hz=1800), wet_db=-12)
    return x, None


@reg("chime_pos")
def chime_pos(r, d):
    n = nsamp(d)
    x = np.zeros(n)

    def bell(f, dur):
        m = nsamp(dur)
        tm = tt(m)
        y = fmbell(f, tm, ratio=1.0, idx=0.9, idx_tau=0.08, tau=0.75) + 0.28 * np.sin(2 * np.pi * 2 * f * tm) * np.exp(-tm / 0.3) * attack(tm, 0.002)
        y += 0.1 * np.sin(2 * np.pi * 3 * f * tm) * np.exp(-tm / 0.12)
        return y

    at(x, bell(523.25, 1.4), 0.0, 0.85)  # C5
    at(x, bell(783.99, 1.4 - 0.165), 0.165, 1.0)  # G5: a fifth up
    x = reverb(x, make_ir(1.0, seed=53, lp_hz=5500), wet_db=-11)
    return x[:n], None


@reg("ping_impact")
def ping_impact(r, d):
    n = nsamp(d)
    t = tt(n)
    x = modal(t, [(2100, 1.0, 0.07), (3900, 0.5, 0.045), (6300, 0.25, 0.03), (1100, 0.4, 0.05)]) * attack(t, 0.0004)
    x += 0.45 * burst(r, n, 3000, 8000, 0.0010)
    return lp(x, 10000, 1), None


# ---------------------------------------------------------------------------------------------------------------- S10
@reg("piano_note")
def piano_note(r, d):
    x = piano(261.63, d, vel=0.62, bright=0.85, seed=5, tail_tau=2.3)
    n = nsamp(d)
    x = reverb(x, make_ir(1.6, seed=59, lp_hz=4500, predelay=0.012), wet_db=-13, n_out=n)
    return lp(x, 7000, 1), None


@reg("glass_tap")
def glass_tap(r, d):
    n = nsamp(d)
    t = tt(n)
    x = modal(t, [(3150, 1.0, 0.16), (3158, 0.7, 0.14), (4780, 0.62, 0.10), (7350, 0.34, 0.06), (1580, 0.25, 0.12)]) * attack(t, 0.0005)
    x += 0.5 * burst(r, n, 3500, 9500, 0.0010)
    x = lp(x, 10000, 1)
    x = reverb(x, make_ir(0.35, seed=61, lp_hz=7000), wet_db=-17)
    return x, None


@reg("chord_resolved")
def chord_resolved(r, d):
    n = nsamp(d)
    x = np.zeros(n)
    notes = [(130.81, 0.00, 0.62), (196.00, 0.022, 0.52), (329.63, 0.046, 0.5), (587.33, 0.075, 0.4), (261.63, 0.034, 0.34)]  # C3 G3 E4 D5 + C4
    for f, off, v in notes:
        p = piano(f, d - off, vel=v + 0.1, bright=0.8, seed=7, tail_tau=3.0)
        at(x, p, off, 0.9)
    pad = np.zeros(n)
    for f, g in [(130.81, 1.0), (196.0, 0.8), (329.63, 0.7), (587.33, 0.45), (261.63, 0.6)]:
        pd = pad_tone(f, 2.2, att=0.75, rel=1.6, bright=0.8, voices=3, detune_cents=6.0, seed=9)
        pad = place(pad, pd, 0, g)
    pad = lp(pad, 2200, 2)
    x = x + 0.34 * pad / (np.max(np.abs(pad)) + 1e-9) * np.max(np.abs(x))
    x = reverb(x, make_ir(2.2, seed=67, lp_hz=4500, predelay=0.015), wet_db=-10, n_out=n)
    return lp(x, 8000, 1), None


# ---------------------------------------------------------------------------------------------------------------- S11
@reg("type_click")
def type_click(r, d):
    n = nsamp(d)
    t = tt(n)
    x = 0.8 * burst(r, n, 1000, 4200, 0.0018) + 0.7 * np.sin(2 * np.pi * 280 * t) * np.exp(-t / 0.010) * attack(t, 0.0005)
    return lp(x, 6000, 1), None


@reg("send_whoosh")
def send_whoosh(r, d):
    n = nsamp(d)
    t = tt(n)
    fc = 600.0 * (4200 / 600.0) ** smoothstep(t / 0.4)
    env = attack(t, 0.07) * np.exp(-t / 0.2) * (1 - smoothstep((t - 0.36) / 0.09))
    x = sweep_noise(r, n, fc, 0.7) * env
    x += 0.07 * np.sin(phase(700 * 2 ** (smoothstep(t / 0.3) * 13 / 12))) * env
    return lp(x, 10000, 1), None


@reg("tick_asc")
def tick_asc(r, d):
    n = nsamp(d)
    t = tt(n)
    f = 1760.0
    x = modal(t, [(f, 1.0, 0.04), (f * 2.0, 0.3, 0.025)]) * attack(t, 0.0005)
    x += modal(t, [(f, 0.14, 0.12), (f * 3.0, 0.07, 0.07)]) * attack(t, 0.001)
    x += 0.3 * burst(r, n, 4000, 9500, 0.0008)
    return lp(x, 10000, 1), None


@reg("shutter")
def shutter(r, d):
    n = nsamp(d)
    x = np.zeros(n)
    for off, f, a, tau in [(0.0, 520, 1.0, 0.016), (0.074, 410, 0.78, 0.02)]:
        m = nsamp(0.14)
        tm = tt(m)
        k = 0.7 * burst(r, m, 800, 4200, 0.005, att=0.0006) + 0.9 * np.sin(2 * np.pi * f * tm) * np.exp(-tm / tau) * attack(tm, 0.0006)
        at(x, k, off, a)
    return lp(x, 6500, 1), None


# ---------------------------------------------------------------------------------------------------------------- S12
@reg("bonk_neg")
def bonk_neg(r, d):
    n = nsamp(d)
    t = tt(n)
    f = 150 + 55 * np.exp(-t / 0.12)
    p = phase(f)
    x = (np.sin(p) * np.exp(-t / 0.10) + 0.34 * np.sin(2.3 * p + 0.5) * np.exp(-t / 0.06) + 0.12 * np.sin(3.9 * p) * np.exp(-t / 0.03)) * attack(t, 0.0012)
    x += 0.35 * unit(lp(noise(r, n), 500, 2)) * np.exp(-t / 0.012)
    x = soft_sat(x, 1.25)
    x = reverb(x, make_ir(0.25, seed=71, lp_hz=1800), wet_db=-16)
    return x, None


@reg("ding_pos")
def ding_pos(r, d):
    n = nsamp(d)
    t = tt(n)
    f = 1318.5  # E6
    x = modal(t, [(f, 1.0, 1.0), (f + 0.7, 0.35, 0.9), (f * 2.0, 0.34, 0.55), (f * 3.0, 0.14, 0.28), (f * 4.2, 0.06, 0.15)]) * attack(t, 0.0012)
    x += 0.25 * burst(r, n, 3000, 9000, 0.0010)
    x = lp(x, 9500, 1)
    x = reverb(x, make_ir(1.1, seed=73, lp_hz=6500), wet_db=-12)
    return x, None


@reg("spin_whoosh")
def spin_whoosh(r, d):
    n = nsamp(d)
    t = tt(n)
    pan = np.sin(2 * np.pi * t / d)  # one revolution of the stereo field
    fc = 1250 + 650 * np.sin(2 * np.pi * t / d + 0.6)
    env = np.sin(np.pi * t / d) ** 1.4 * attack(t, 0.05)
    m = sweep_noise(r, n, fc, 0.9) * env
    ang = (pan + 1) * np.pi / 4
    dec = sweep_noise(r, n, fc, 0.9) * env * 0.35
    L = m * np.cos(ang) * np.sqrt(2) * 0.7 + dec
    R = m * np.sin(ang) * np.sqrt(2) * 0.7 - dec
    return lp(np.stack([L, R], axis=1), 11000, 1), None


# ---------------------------------------------------------------------------------------------------------------- S13
@reg("pluck_resolve")
def pluck_resolve(r, d):
    n = nsamp(d)
    x = np.zeros(n)
    for f, off, ts, v in [(261.63, 0.0, 0.5, 0.70), (329.63, 0.15, 0.5, 0.78), (392.00, 0.30, 0.55, 0.85), (523.25, 0.45, 1.7, 0.95)]:
        at(x, pluck_tone(f, d - off, vel=v, tau_scale=ts, seed=3), off, v)  # every note rings out on its own: no cut-offs
    x = reverb(x, make_ir(0.9, seed=79, lp_hz=5500), wet_db=-12, n_out=n)
    return x, None


@reg("pop")
def pop(r, d):
    n = nsamp(d)
    t = tt(n)
    f = 260.0 + 620.0 * (1 - np.exp(-t / 0.014))
    p = phase(f)
    x = np.sin(p) * attack(t, 0.0035) * np.exp(-t / 0.032) + 0.25 * np.sin(2 * p + 0.3) * np.exp(-t / 0.015) * attack(t, 0.003)
    return lp(x, 3800, 1), None


@reg("plane_swish")
def plane_swish(r, d):
    n = nsamp(d)
    t = tt(n)
    fc = 900 + 1900 * np.exp(-0.5 * ((t - 0.30) / 0.22) ** 2) - 150 * smoothstep((t - 0.5) / 0.4)
    env = attack(t, 0.055) * np.exp(-np.clip(t - 0.12, 0, None) / 0.30) * (1 - smoothstep((t - 0.72) / 0.18))
    m = sweep_noise(r, n, fc, 1.1) * env
    pan = -0.92 + 1.84 * smoothstep(t / 0.82)
    ang = (pan + 1) * np.pi / 4
    dec = sweep_noise(r, n, fc, 1.1) * env * 0.25
    L = m * np.cos(ang) * np.sqrt(2) * 0.75 + dec
    R = m * np.sin(ang) * np.sqrt(2) * 0.75 - dec
    return lp(np.stack([L, R], axis=1), 11000, 1), None


@reg("final_chime")
def final_chime(r, d):
    n = nsamp(d)
    t = tt(n)
    f = 1046.5  # C6
    parts = [(f, 1.0, 2.3), (f + 0.55, 0.45, 2.1), (f * 2.0, 0.34, 1.3), (f * 2.4, 0.2, 0.9), (f * 3.0, 0.11, 0.6), (f * 4.2, 0.05, 0.35), (f * 0.5, 0.3, 2.6)]
    x = modal(t, parts) * attack(t, 0.004)
    x += 0.2 * burst(r, n, 3000, 8000, 0.0015)
    x = lp(x, 8500, 1)
    x = reverb(x, make_ir(2.4, seed=83, lp_hz=5500, predelay=0.012), wet_db=-10)
    return x[:n], None


# ---------------------------------------------------------------------------------------------------------------- generic
@reg("whoosh")
def whoosh(r, d):
    n = nsamp(d)
    t = tt(n)
    pk = 0.35
    fc = np.where(t < pk, 300.0 * (2200 / 300.0) ** smoothstep(t / pk), 2200.0 * (700 / 2200.0) ** smoothstep((t - pk) / (d - pk)))
    env = np.exp(-0.5 * ((t - pk) / np.where(t < pk, 0.15, 0.20)) ** 2) * attack(t, 0.05)
    x = sweep_noise(r, n, fc, 1.0) * env
    return lp(x, 9500, 1), pk


@reg("tick")
def tick(r, d):
    n = nsamp(d)
    t = tt(n)
    x = burst(r, n, 2000, 6200, 0.0012) + 0.6 * np.sin(2 * np.pi * 1500 * t) * np.exp(-t / 0.010) * attack(t, 0.0004)
    return lp(x, 8500, 1), None


# ---------------------------------------------------------------------------------------------------------------- finishing + analysis
def envelope(x, ms=2.0):
    p = (x ** 2).sum(axis=1) if x.ndim == 2 else x ** 2
    w = max(1, int(SR * ms / 1000))
    return np.sqrt(np.maximum(ndimage.uniform_filter1d(p, w, mode="nearest"), 0.0))


def auto_hit(x, kind):
    """where the HIT lands, computed from the finished sound according to the spec's kind:
    start: the onset (first moment the 1 ms envelope reaches 25 % of the loudest moment of the first 250 ms); a sound that fades in from silence
           (its first 250 ms are < 10 % of its peak) is continuous: hit 0.
    peak:  the middle of the region where the 50 ms envelope is within 2 dB of its maximum (a sweep's centre)
    end:   the last moment the 25 ms envelope is within 1.5 dB of its maximum (the climax of a build, just before it is cut)"""
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
    env = envelope(x, 25.0)
    return float(np.nonzero(env >= 0.84 * env.max())[0][-1] / SR)


def finish(name, x, hit, d):
    n = nsamp(d)
    x = np.asarray(x, dtype=float)
    if len(x) < n:
        x = np.pad(x, [(0, n - len(x))] + [(0, 0)] * (x.ndim - 1))
    x = x[:n]
    x = np.nan_to_num(x)
    x = hp_zero(x, 12.0 if d >= 0.5 else 40.0, 2)  # no DC / sub-rumble offset (zero-phase: does not move the hit); short one-shots get a higher corner
    # gentle fades: never a click at either end (sounds that start from silence by design start at ~0 anyway)
    x = fade_in(x, 0.5 if d < 1.0 else 4.0)
    x = fade_out(x, min(60.0, max(6.0, d * 1000 * 0.04)))
    x = normalize_peak(x, -1.0)
    return x


def synth_one(name, spec):
    kind, dur, _ = spec[name]
    r = rng_for(name)
    x, hit = REG[name](r, dur)
    x = finish(name, x, hit, dur)
    auto = auto_hit(x, kind)
    if hit is not None:  # sanity: what the synth designed is what the finished sound does
        assert abs(auto - hit) < 0.10, f"{name}: designed hit {hit:.3f}s but the finished sound's hit is at {auto:.3f}s"
    return x, float(auto)


def build(only=None, outdir: Path = SFX_DIR, verbose=True):
    spec = parse_spec()
    check_spec(spec)
    outdir.mkdir(parents=True, exist_ok=True)
    idx_path = outdir / "index.json"
    index = json.loads(idx_path.read_text()) if (only and idx_path.exists()) else {}
    names = [n for n in spec if (not only or n in only)]
    for name in names:
        assert name in REG, f"no synth for {name}"
        x, hit = synth_one(name, spec)
        stereo = x.ndim == 2
        assert stereo == (name in STEREO), f"{name}: stereo mismatch"
        fn = f"{name}.wav"
        write_wav(outdir / fn, x, "PCM_24")
        mono = x.mean(axis=1) if stereo else x
        index[name] = {
            "file": fn, "dur": round(len(x) / SR, 6), "hit": round(hit, 6), "stereo": bool(stereo), "hitKind": spec[name][0],
            "peakDb": round(float(lin2db(np.max(np.abs(x)))), 2), "rmsDb": round(float(lin2db(rms(x))), 2),
            "dc": round(float(np.mean(mono)), 8), "centroidHz": round(spectral_centroid(mono), 1),
        }
        if verbose:
            e = index[name]
            print(f"{name:15s} dur {e['dur']:5.2f}  hit {e['hit']:6.3f} ({spec[name][0]:5s})  peak {e['peakDb']:6.2f}  rms {e['rmsDb']:6.2f}  cent {e['centroidHz']:7.1f}  {'stereo' if stereo else ''}")
    index = {k: index[k] for k in spec if k in index}  # spec order
    idx_path.write_text(json.dumps(index, indent=1) + "\n")
    return index


NOTES = {  # what it is as built, and how to use it (written to docs/SFX.md)
    "sub_drone": "45 Hz + 0.38 Hz-detuned twin (slow beating) with soft harmonics at 2-5x so a phone speaker still hears it, a breath of dark air. Grows from silence (t^1.7) to 6.2 s, then breathes out. Place at frame 0 with gainDb about -8. Continuous: hit 0.",
    "clock_tick": "Dry filtered click (2.2-5.8 kHz, 1 ms) over a tiny wooden body (820 / 1710 / 2690 Hz, 18 ms) and a 410 Hz cavity, 24 dB-down room. Intimate; gainDb -4 or lower.",
    "thoom": "Sine gliding 80 -> 32 Hz (tau 160 ms) + 2nd/3rd harmonic (phone-audible), low-noise thump on the front, soft saturation, dark 1.3 s tail. Sub heavy: most energy is under 100 Hz.",
    "alarm_swell": "Two detuned saws a minor second apart (110 Hz + drift of 3.2 semitones), low-pass opening 330 -> 2800 Hz, tremolo accelerating 3 -> 14 Hz, air noise; t^2.3 build. NOT a siren. Hit = the climax at about 1.38 s: put `frame` on the hit and the swell starts 1.4 s earlier.",
    "server_ping": "1760 Hz sine + 2.76x inharmonic partial, 32 ms decay, 0.6 ms attack. `pitch` 0 .. 9 semitones for a run of pings (S1 uses k * 0.8). Use gainDb -20 .. -14.",
    "whoosh_through": "STEREO. Wide band noise rising 220 -> 2900 Hz into the pass at 0.54 s, then the Doppler fall to 900 Hz; decorrelated L/R, low air-displacement rumble. Hit = the pass.",
    "ui_click": "190 Hz damped thump (14 ms) + soft 1.2-3.6 kHz tick: a trackpad tap, not a mouse click.",
    "heartbeat": "Lub-dub: two rounded thumps (52 Hz / 58 Hz with a 55 % pitch drop in 30 ms), 0.22 s apart, the second at 72 %. Hit = the first thump.",
    "layer_sweep": "Dark noise body sweeping 160 -> 1300 Hz with six shimmering partials (1.2-5.3 kHz, +4 semitones glide, per-partial tremolo) under a bell curve; hit = the middle of the swell (0.74 s).",
    "scuttle": "Nine irregular ticks (3-6 kHz, 2 ms) with random level, over 0.52 s. Pan by `pan`; `seed` re-rolls the level/pitch a little. Very quiet by design: gainDb -6 or lower.",
    "key_click": "Key-down tick (1.5-6.2 kHz) + 340 Hz thock, and a soft key-up 52 ms later. Vary `pitch` +-2 / `seed`.",
    "reverse_riser": "A soft dark cymbal cluster + dust crackle + a falling tape-stop tone (45 + 300 e^(-t/0.7) Hz, wow and flutter) built FORWARDS, then reversed. Ends with a 30 ms ramp-down right after the hit (hit = 2.36 s). With `frames` the riser is shortened from the FRONT, so it still ends on the hit.",
    "focus_swoosh": "Airy 650 -> 4800 Hz noise rising, a whispering 900 Hz+ tone, ending in a tiny lock (2.5 kHz tick, 22 ms) at 0.46 s = the hit.",
    "chip_tick": "1480 Hz tick (30 ms) with a bell tail (2.0x, 2.76x, 5.4x partials, up to 150 ms) and a 3.5-9 kHz click. `pitch` 0 / 4 / 9 for the three name chips.",
    "caught_click": "Two-part click-clack: a bright 780 Hz click, then 58 ms later a lower 520 Hz clack (a lid shutting).",
    "pluck": "Warm pluck at C4 (261.6 Hz): partials k^-1.35 with high ones dying first, detuned pairs, a soft pick. `pitch` = semitones above C4; the S5 motif is built from these.",
    "tok": "Soft wood knock: 460 Hz falling 22 % in 8 ms, 2.45x and 3.8x wood modes, a 1.1 kHz body puff. `pitch` -3 .. +3 per tiffin.",
    "bike_bell": "Two inharmonic bright partials (2350 Hz and x1.505), each a beating pair (5.5 Hz shimmer), 0.55 / 0.36 s decay, small room. Gentle: low-passed at 7.5 kHz.",
    "tiffin_rattle": "Nine metal ticks (1.3-3 kHz tin modes at 1 / 1.58 / 2.37 / 3.4x) accelerating over 0.5 s with a 0.2 s clattery 2.2-6.5 kHz tail.",
    "lid_clink": "Bright metal tap: 2850 Hz (+3.2 Hz beating twin), 4310, 6200 and 1420 Hz rings (up to 160 ms), a 640 Hz body, small room.",
    "key_jingle": "Five tumbling key ticks (4.1-6.3 kHz bells with 1.51x and 2.3x partials) over 0.32 s, levels 1 .. 0.36.",
    "uhoh_note": "Two soft descending saw+sine notes, G3 -> E3 (a minor third), 6-cent detuned pairs, a filter that closes, a scoop into each note. Hit = the first note.",
    "data_hum": "55 Hz filtered saw pair with a 0.45 Hz cutoff LFO (380 +- 260 Hz), 650-2800 Hz flow noise with a 0.7 Hz swell, two thin whines (660 / 990 Hz). sin^2 fade in and out. Continuous: hit 0.",
    "swipe": "Narrow band noise sweeping 1.1 -> 3.7 kHz in 0.24 s, 32 ms attack: a thumb on glass.",
    "glitch_tsk": "High-passed noise burst (hard attack, 22 ms), a micro-stutter at 52 ms, then bit-crushed (4.5 bit) + sample-rate-reduced (hold 3) and low-passed at 9 kHz so the grit is tamed. `pitch` shifts the crush.",
    "stealth_pulse": "50 Hz sine (+14 % pitch dip) + 2nd harmonic, 45 ms swell, 200 ms decay, dark room. Hit = its onset (13 ms).",
    "denied_buzz": "A soft click, then two stuttering low buzzes (92 Hz saw, filtered at 650 Hz, falling 1.2 semitones): the second one slower and dying. Reads as 'access denied' without being harsh.",
    "big_hit": "The loudest event: 28 -> 90 Hz sub boom (tau 220 ms, amplitude tau 560 ms), a 230 -> 70 Hz knock, 2nd/3rd harmonics, 2.6 kHz + 650 Hz noise transient, soft saturation, a dark 1.7 s tail. Dense sub energy gives loudness without a high peak.",
    "zap_sweep": "Electric noise rising 170 -> 6000 Hz over 0.7 s (crackle modulation, an FM tone riding the sweep), then a 70 ms decay. Hit = the start of the sweep.",
    "ratchet_tick": "80 ms: dry 1.5-4.8 kHz tick + 1250 Hz pawl + a small second click at 12 ms. `pitch` +- 3 per tick as the needle moves.",
    "clunk": "Heavy thud: 98 -> 70 Hz body (140 ms), metal rings at 410 / 688 / 1133 / 1790 Hz (up to 250 ms), a 2.2 kHz transient.",
    "chime_pos": "Two FM-ish bells, C5 then G5 (a fifth up, 165 ms later), warm (sine + 2x + 3x partials), 1 s hall. Hit = the first note.",
    "ping_impact": "Tight metal ping: 2100 / 3900 / 6300 / 1100 Hz modes (30-70 ms) + a click. `pitch` +- 3 to vary the deflected arrows.",
    "piano_note": "A felt piano C4: inharmonic partials (soft-hammer spectrum), two unequal strings (shallow beating), fast + slow decay, a felt thud, 1.6 s soft room. `pitch` = semitones above C4 (the music is in C major: 0, 4, 7 are safe).",
    "glass_tap": "Bright tick + glass rings at 3150 (+8 Hz twin), 4780, 7350 and 1580 Hz (60-160 ms), small room.",
    "chord_resolved": "C major add9 (C3 G3 E4 D5 + C4) as felt piano, rolled over 75 ms, over a soft pad (0.75 s bloom, 1.6 s release), 2.2 s hall. Hit = the first note.",
    "type_click": "Soft keystroke: 1-4.2 kHz puff + 280 Hz thock (10 ms). Vary `pitch` +- 2 / `seed`.",
    "send_whoosh": "Airy 600 -> 4200 Hz swoosh, 70 ms attack, with a faint rising 700 Hz tone.",
    "tick_asc": "Clean 1760 Hz tick (2x partial) with a quiet bell tail. `pitch` 0, 2, 4, 7 for the four version lines.",
    "shutter": "Two soft clicks 74 ms apart (520 Hz then a lower 410 Hz): open and close.",
    "bonk_neg": "Low hollow knock 205 -> 150 Hz (falling = negative), 2.3x and 3.9x hollow modes, a 500 Hz thump, a short room.",
    "ding_pos": "A clean E6 bell (partials 1, 2, 3, 4.2x; a 0.7 Hz twin) with a 1 s tail and a 1.1 s hall.",
    "spin_whoosh": "STEREO. Band noise (1250 +- 650 Hz) that goes once around the stereo field (pan = sin(2 pi t / 0.8): centre -> right -> centre -> left -> centre). Hit = its onset.",
    "pluck_resolve": "C4 E4 G4 C5 plucks, 150 ms apart, every note ringing out, the last one long (tau x1.7); 0.9 s hall. Hit = the first note.",
    "pop": "A rounded bubble: sine rising 260 -> 880 Hz in 14 ms, 32 ms decay, low-passed at 3.8 kHz. No click.",
    "plane_swish": "STEREO. Airy 900 -> 2800 Hz swoosh that moves left -> right (pan -0.92 -> +0.92 in 0.82 s).",
    "final_chime": "Soft C6 bell (partials 1, 2, 2.4, 3, 4.2x + an octave-down C5 at -10 dB, a 0.55 Hz twin), 2.4 s tail, 2.4 s hall.",
    "whoosh": "Generic soft whoosh: band noise 300 -> 2200 Hz, peak at 0.37 s, falling to 700 Hz.",
    "tick": "Generic soft tick: 2-6.2 kHz click + 1500 Hz body (10 ms).",
}

DOC_HEAD = """# SFX: the sound vocabulary, the music bed and the mixer

Everything is synthesised procedurally in numpy (seeded: the files are byte-identical on every run), no samples, no network, no API key.
Taste: "Apple keynote at night": subtle, premium, clean, dark and warm; filtered noise, sine / FM tones, tuned partials, short convolution tails; no siren,
no harsh digital edge.

## Rebuild

```
cd php2shell
npm ci && npx tsx scripts/export_timeline.ts      # public/timeline.json from the cue modules (scenes, sound events, music cues)
python3 scripts/make_sfx.py                       # public/sfx/<name>.wav (+ index.json)         [only if missing: build_mix.py calls it]
python3 scripts/make_music.py                         # public/music_dark.wav, music_warm.wav           [only if missing / stale: build_mix.py calls it]
python3 scripts/build_mix.py                      # public/mix.wav, build/stems/{voice,sfx,music}.wav, public/mix_report.json
python3 scripts/qa_audio.py                       # the checks + docs/SFX_EVENT_TABLE.md (exit code 1 on FAIL)
python3 scripts/qa_audio.py --test                # the same on build/test_timeline.json: at least one event of EVERY sound, stress cases
python3 scripts/make_sfx.py --plots [name ...]    # spectrogram + waveform contact sheets -> build/sfx_plots/
python3 scripts/make_sfx.py --doc                 # regenerate this file's table
```

`build_mix.py` runs end to end (about a minute) and is deterministic (`qa_audio.py --check-determinism` compares the sha256 of two builds).

## How an event becomes sound (what scene owners need to know)

`src/cues/sNN.ts` lists `{ id, frame, sfx, gainDb?, pan?, pitch?, seed?, frames? }`.  `frame` is the frame of the visual HIT.  `index.json` says where in the file the
hit is (`hit`, seconds): the mixer places the file so that this instant lands on `frame * 1600` samples (48 kHz / 30 fps), to the sample.

- **start** sounds hit at their onset (a few ms in); **peak** sounds hit in the middle of the swell (whoosh_through 0.54 s, layer_sweep 0.74 s, whoosh 0.37 s);
  **end** sounds hit at their climax (alarm_swell 1.38 s, reverse_riser 2.36 s, focus_swoosh 0.47 s): the sound begins BEFORE `frame`.
  Continuous beds (sub_drone, data_hum) have hit 0.
- **level**: every file is peak-normalised to -1 dBFS.  The mixer calibrates so that a centred, `gainDb` 0 event peaks **12 dB under the voice's peak** (brief: 10-14 dB).
  `gainDb` is relative to that: -12 .. 0 is the range to use; tiny sounds (pings, ticks, scuttles) -20 .. -8, long beds (drones, chords, hums) -8 .. -3.
  Dense, long sounds (drones, chords, pads, big_hit) are far louder than their peak suggests: trust the QA's "voice-to-others" numbers.
- **pan** -1 .. +1, constant power (0.707 per channel at the centre, so a hard-panned mono sound is +3 dB in its channel). Stereo sounds (whoosh_through, spin_whoosh, plane_swish) use balance.
- **pitch** in semitones, by resampling (the sound gets shorter / longer, the hit offset follows). Tonal sounds were designed in the middle of the range so +-12 is fine.
- **seed** != 0: a deterministic +-0.5 semitone / +-0.6 dB variation of this one event (noisy sounds, repeated ticks).
- **frames**: cut a long sound to `frames` video frames. start sounds: the tail is cut (15 ms fade); end sounds: the FRONT is cut (the riser still ends on the hit);
  peak sounds: `frames` around the hit.
- **voice priority** (automatic): wherever an event's speech band (300 Hz-4.5 kHz) would come within 8 dB of the voice's, only that band is turned down, by at most 5 dB
  (3 ms attack, 90 ms release; the voice is looked at 150 ms ahead so a hit on the first frame of a word keeps its punch; sub bass and air are untouched).
  `qa_audio.py` prints how much each event was turned down: if it is more than 2-3 dB, lower that event's `gainDb` yourself.

## Music (scripts/make_music.py, structure from `music` in timeline.json)

Two stereo 48 kHz beds of the full length: `music_dark.wav` (S1-S9: C2 / G2 drone, then an Eb, a Db and a Gb creep in as the tension rises scene by scene towards S8 / S9;
a sub heartbeat; clock ticks on the 92 BPM grid: quarters, then eighths, then a few sixteenths; a wind swell per 8 bars; a riser into the drop) and `music_warm.wav`
(from `hopeStart`: C major, Cadd9 | G/B | Am7 | Fmaj7 ..., felt piano bass + melody, a light pluck arpeggio, a soft pad, faded out over the last 4.6 s).
The mixer: loudness-calibrates them (dark -25.5 LUFS, warm -24.5 LUFS before ducking), drops the dark bed over `dropFrames` (10) frames to -46 dB at `drop`, holds it until
`silentUntil`, then fades it out in 0.8 s (the piano_note SFX lands there); ducks both 8 dB under the voice (40 ms attack, 350 ms release, 150 ms hold, 30 ms look-ahead)
plus up to 4 dB under big SFX hits; carves 2 dB at 2 kHz and 3.5 dB above 3 kHz.

## Master

voice (HPF 60 Hz, 2.5:1 compressor above the voice's own loudness - 1.2 dB (= -24 dB), soft knee, 10 / 120 ms, then gain to **-14.0 LUFS measured on the stereo voice stem**
(= dual mono, BS.1770 reads a dual-mono file 3 dB louder than the mono file: the mono voice is -17.0 LUFS), look-ahead true-peak limiter at -2 dBTP) + sfx + music
-> bus glue (1.3:1, only the peaks) -> true-peak limiter at -1.15 dBTP (4x oversampled; ffmpeg ebur128 agrees).  Output `public/mix.wav` 48 kHz 24-bit stereo, exactly `totalFrames / 30` s.

## The sounds

| name | hit kind | dur s | hit s | stereo | centroid Hz | what it is, as built |
|---|---|---|---|---|---|---|
"""


def write_doc():
    spec = parse_spec()
    index = json.loads((SFX_DIR / "index.json").read_text())
    rows = []
    for name, (kind, dur, what) in spec.items():
        e = index[name]
        rows.append(f"| `{name}` | {kind} | {e['dur']:.2f} | {e['hit']:.3f} | {'yes' if e['stereo'] else ''} | {e['centroidHz']:.0f} | {NOTES.get(name, what)} |")
    out = ROOT / "docs" / "SFX.md"
    out.write_text(DOC_HEAD + "\n".join(rows) + "\n\nThe spec text of each sound is in `src/sfx.ts`; the event table of the real film is `docs/SFX_EVENT_TABLE.md`.\n")
    return out


def plot_sheets(outdir: Path, per_sheet=9, cols=3, only=None):
    """spectrogram + waveform contact sheets of every sound (hit marked with a cyan line) -> <outdir>/sfx_sheet_N.png"""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    index = json.loads((SFX_DIR / "index.json").read_text())
    names = [n for n in index if not only or n in only]
    outdir.mkdir(parents=True, exist_ok=True)
    rows = per_sheet // cols
    paths = []
    for si in range(0, len(names), per_sheet):
        chunk = names[si:si + per_sheet]
        fig = plt.figure(figsize=(6.0 * cols, 3.6 * rows), dpi=80)
        gs = fig.add_gridspec(rows * 2, cols, height_ratios=[3, 1] * rows, hspace=0.55, wspace=0.18)
        for k, name in enumerate(chunk):
            e = index[name]
            x, _ = __import__("soundfile").read(str(SFX_DIR / e["file"]))
            m = x.mean(axis=1) if x.ndim == 2 else x
            r_, c_ = divmod(k, cols)
            ax = fig.add_subplot(gs[r_ * 2, c_])
            nper = 512 if e["dur"] < 0.6 else 2048
            f, tf, S = signal.spectrogram(m, SR, window="hann", nperseg=nper, noverlap=nper * 7 // 8, mode="magnitude")
            D = 20 * np.log10(S + 1e-9)
            D -= D.max()
            ax.pcolormesh(tf, np.maximum(f, 20), D, vmin=-90, vmax=0, cmap="magma", shading="auto")
            ax.set_yscale("log")
            ax.set_ylim(25, 20000)
            ax.axvline(e["hit"], color="cyan", lw=1.0, alpha=0.9)
            ax.set_title(f"{name}   dur {e['dur']:.2f}s  hit {e['hit']:.3f}s ({e['hitKind']})  cent {e['centroidHz']:.0f}Hz" + ("  STEREO" if e["stereo"] else ""), fontsize=8)
            ax.tick_params(labelsize=6)
            ax.set_xlim(0, e["dur"])
            aw = fig.add_subplot(gs[r_ * 2 + 1, c_])
            tx = np.arange(len(m)) / SR
            if x.ndim == 2:
                aw.plot(tx, x[:, 0], lw=0.4, color="#ff8c66")
                aw.plot(tx, x[:, 1], lw=0.4, color="#66b3ff")
            else:
                aw.plot(tx, m, lw=0.4, color="#bbbbbb")
            aw.axvline(e["hit"], color="cyan", lw=1.0, alpha=0.9)
            aw.set_xlim(0, e["dur"])
            aw.set_ylim(-1.05, 1.05)
            aw.tick_params(labelsize=6)
        p = outdir / (f"sfx_sheet_{si // per_sheet + 1}.png" if not only else f"sfx_pick_{si // per_sheet + 1}.png")
        fig.savefig(p, facecolor="white")
        plt.close(fig)
        paths.append(p)
    return paths


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--doc":
        print(write_doc())
    elif args and args[0] == "--plots":  # --plots [name ...]: spectrogram contact sheets -> build/sfx_plots/
        from audiolib import BUILD
        for p in plot_sheets(BUILD / "sfx_plots", only=set(args[1:]) or None):
            print(p)
    else:
        build(only=set(args) or None)
