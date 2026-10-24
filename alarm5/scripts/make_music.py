#!/usr/bin/env python3
"""Alarm5: the music bed (original, synthesised in numpy, seeded and deterministic).

Reads the MUSIC cues + scene starts from public/timeline.json and writes two full-length (totalFrames / 60 s) 48 kHz stereo files that the mixer lays under the voice:

  public/music_dark.wav  S1 .. S12: a tense pulse at 96 BPM. A low drone (C2 / G2, then an Eb and a Db creep in as the tension T(t) rises), a sub pulse on every beat,
                         from `tickStart` (alarm #5) to `tickEnd` (alarm #1 done) a ticking hi-hat texture (eighths, then sixteenths towards alarms 2 and 1), a slow wind swell
                         per 4 bars. It keeps room for the SFX: no sustained energy in the 1-3 kHz band, everything soft. It is cut at `drop` (12 frames before S13).
  public/music_warm.wav  from `hopeStart` (silent before it): warm, resolved C major (Cadd9 | G/B | Am7 | Fmaj7), felt piano bass and melody, a light pluck arpeggio, a soft pad;
                         gentle and sparse; fades out over the last 4 s.

    python3 scripts/make_music.py [--timeline public/timeline.json]
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from scipy import signal

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audiolib import (  # noqa: E402
    BUILD, PUBLIC, SPF, SR, attack, bp, db2lin, fade_in, fade_out, hp, lp, make_ir, nsamp, pad_tone, phase, piano, place, read_json, rng_for, saw_filtered, smoothstep,
    tt, write_wav,
)

C_PEAK_DB = -3.0           # both files are peak-normalised to this; the mixer sets the real level by loudness
BPM = 96.0
BEAT = 60.0 / BPM          # 0.625 s


def midi(m):
    return 440.0 * 2.0 ** ((np.asarray(m, dtype=float) - 69.0) / 12.0)


def stereo_place(buf, mono, start, gain=1.0, pan=0.0):
    a = (pan + 1) * np.pi / 4
    place(buf[:, 0], mono, start, gain * np.cos(a) * 1.414 * 0.707)
    place(buf[:, 1], mono, start, gain * np.sin(a) * 1.414 * 0.707)


def sreverb(bus, ir, wet_db):
    n = len(bus)
    wl = signal.fftconvolve(bus[:, 0], ir[:, 0])[:n]
    wr = signal.fftconvolve(bus[:, 1], ir[:, 1])[:n]
    return bus + db2lin(wet_db) * np.stack([wl, wr], axis=1)


def norm(x, db=C_PEAK_DB):
    p = np.max(np.abs(x))
    return x * (db2lin(db) / p) if p > 0 else x


def hat(r, open_=False, bright=1.0):
    n = nsamp(0.09 if open_ else 0.035)
    t = tt(n)
    x = bp(r.standard_normal(n), 6500, 11500, 2) * np.exp(-t / (0.03 if open_ else 0.008)) * attack(t, 0.0004)
    return x / (np.max(np.abs(x)) + 1e-9) * bright


def sub_pulse(vel=1.0):
    n = nsamp(0.45)
    t = tt(n)
    f = 44 + 38 * np.exp(-t / 0.05)
    p = phase(f)
    return (np.sin(p) + 0.25 * np.sin(2 * p)) * np.exp(-t / 0.15) * attack(t, 0.004) * vel


def tension(tl, secs, n):
    """0 at S1 .. 1 at the end of S11 (the alarms 5 -> 1 get tenser scene by scene)"""
    st = {s["id"]: s["startSeconds"] for s in tl["scenes"]}
    xs = [0.0, st["S3"], st["S5"], st["S7"], st["S9"], st["S11"], tl["music"]["dropSeconds"]]
    ys = [0.0, 0.18, 0.38, 0.6, 0.82, 1.0, 1.0]
    return np.interp(secs, xs, ys)


def render_dark(tl, n_total):
    mu = tl["music"]
    n = n_total
    t = tt(n)
    secs = t
    r = rng_for("music_dark")
    T = tension(tl, secs, n)
    out = np.zeros((n, 2))
    t_drop = mu["dropSeconds"]
    # --- drone: C2 + G2 (saws through a slow low-pass), an Eb2 from mid-film, a Db2 at the end of the tension
    env = smoothstep((secs - 0.5) / 3.0) * (0.6 + 0.4 * T)
    for k, (f0, amt) in enumerate([(65.41, 1.0), (98.0, 0.6), (77.78, 0.0), (69.3, 0.0)]):
        gate = 1.0 if k < 2 else smoothstep((T - (0.45 if k == 2 else 0.8)) / 0.25)
        f = np.full(n, f0) * (1 + 0.0025 * np.sin(2 * np.pi * (0.07 + 0.02 * k) * secs))
        cut = 140 + 360 * T + 70 * np.sin(2 * np.pi * 0.05 * secs + k)
        d = saw_filtered(f, cut, 14, 1.35, 0.6 * k) * 0.5 + np.sin(phase(f)) * 0.7
        out[:, 0] += d * env * amt * gate * (0.85 if k % 2 else 1.0)
        out[:, 1] += d * env * amt * gate * (1.0 if k % 2 else 0.85)
    # --- sub pulse on every beat: soft at first, firmer with the tension (from 1.0 s)
    nb = int(t_drop / BEAT)
    for b in range(nb):
        s = 1.0 + b * BEAT
        if s >= t_drop - 0.05:
            break
        v = (0.18 + 0.82 * float(np.interp(s, [0, t_drop], [0.15, 1.0]))) * (1.0 if b % 4 == 0 else 0.7)
        stereo_place(out, sub_pulse(v) * 0.9, int(round(s * SR)), 1.0, 0.0)
    # --- the ticking hi-hat: eighths from tickStart, sixteenths during the last two alarms, an accent every bar
    s0, s1 = mu["tickStartSeconds"], mu["tickEndSeconds"]
    st = {x["id"]: x["startSeconds"] for x in tl["scenes"]}
    step = BEAT / 2
    k = 0
    s = s0
    # keep the grid anchored to the sub pulse (beats at 1.0 + b * BEAT)
    s = 1.0 + np.ceil((s0 - 1.0) / step) * step
    while s < min(s1, t_drop - 0.02):
        sixteenth = s >= st["S9"]
        sub = [0.0, step / 2] if sixteenth else [0.0]
        for off in sub:
            ss = s + off
            if ss >= s1:
                break
            beat_idx = int(round((s - 1.0) / step))
            accent = 1.0 if beat_idx % 8 == 0 else (0.62 if beat_idx % 2 == 0 else 0.4)
            if off > 0:
                accent *= 0.45
            gain = 0.12 * (0.45 + 0.55 * float(np.interp(ss, [s0, s1], [0.35, 1.0]))) * accent
            stereo_place(out, hat(r, open_=(beat_idx % 8 == 4), bright=1.0) * gain, int(round(ss * SR)), 1.0, 0.25 * np.sin(beat_idx * 1.3))
        s += step
        k += 1
    # --- a slow wind swell every 4 bars
    for sw in np.arange(2.0, t_drop - 3.0, BEAT * 16):
        n_sw = nsamp(5.0)
        tw = tt(n_sw)
        w = bp(r.standard_normal(n_sw), 300, 1600, 2) * (smoothstep(tw / 2.4) * smoothstep((5.0 - tw) / 2.6)) ** 1.5
        w = w / (np.max(np.abs(w)) + 1e-9) * 0.05 * (0.4 + 0.6 * float(np.interp(sw, [0, t_drop], [0.3, 1.0])))
        stereo_place(out, w, int(round(sw * SR)), 1.0, float(np.sin(sw)))
    # --- the cut: everything stops at `drop` (the mixer fades the bed over a few frames, this removes the tail)
    out *= (1 - smoothstep((secs - t_drop) / 0.12))[:, None]
    ir = make_ir(2.6, seed=7, lp_hz=2600, stereo=True)
    out = sreverb(out, ir, -16.0)
    out *= (1 - smoothstep((secs - t_drop) / 0.12))[:, None]
    return norm(out)


CHORDS = [  # (bass, chord tones, name) one bar each: Cadd9 | G/B | Am7 | Fmaj7, twice
    (36, [48, 55, 64, 74], "Cadd9"), (35, [47, 55, 62, 71], "G/B"), (33, [45, 52, 55, 60], "Am7"), (29, [41, 48, 52, 57], "Fmaj7"),
]
MELODY = [  # beats (in eighths) and midi: a calm C-major-pentatonic line, answered every two bars
    [(0, 76), (3, 79), (5, 74)], [(0, 71), (2, 74), (6, 79)], [(0, 72), (3, 76), (5, 79)], [(0, 77), (4, 76), (6, 72)],
]


def render_warm(tl, n_total):
    mu = tl["music"]
    n = n_total
    secs = tt(n)
    r = rng_for("music_warm")
    out = np.zeros((n, 2))
    t0 = mu["hopeStartSeconds"]
    t_end = n_total / SR
    bar = BEAT * 4
    nbars = int((t_end - t0) / bar) + 1
    from make_sfx import pluck_tone
    for b in range(nbars):
        s = t0 + b * bar
        if s >= t_end - 0.5:
            break
        bass, tones, _ = CHORDS[b % 4]
        # felt-piano bass + a rolled chord
        stereo_place(out, piano(float(midi(bass)), 3.2, vel=0.45, bright=0.7, seed=b, tail_tau=2.4) * 0.9, int(round(s * SR)), 1.0, -0.2)
        for j, m in enumerate(tones):
            stereo_place(out, piano(float(midi(m)), 2.8, vel=0.4, bright=0.8, seed=b * 7 + j, tail_tau=2.2) * 0.38, int(round((s + 0.035 * j) * SR)), 1.0, -0.4 + 0.25 * j)
        # a soft pad under the chord
        for j, m in enumerate(tones[:3]):
            pt = pad_tone(float(midi(m)), bar * 0.9, att=0.9, rel=1.4, bright=0.6, voices=3, detune_cents=8, seed=b + j)
            stereo_place(out, pt * 0.2, int(round(s * SR)), 1.0, -0.6 + 0.6 * j)
        # the melody on the first of every two bars
        if b % 2 == 0 and b >= 1:
            for e, m in MELODY[(b // 2) % 4]:
                stereo_place(out, piano(float(midi(m)), 1.8, vel=0.5, bright=0.9, seed=b * 3 + e, tail_tau=1.6) * 0.5, int(round((s + e * BEAT / 2) * SR)), 1.0, 0.25)
        # a light pluck arpeggio on the off-beats of every bar from the second one
        if b >= 1:
            for k2, m in enumerate([tones[1] + 12, tones[2] + 12, tones[3], tones[2] + 12]):
                stereo_place(out, pluck_tone(float(midi(m)), 0.9, vel=0.5, tau_scale=0.55, seed=b + k2) * 0.16, int(round((s + BEAT * (k2 + 0.5)) * SR)), 1.0, 0.45 - 0.2 * k2)
    ir = make_ir(2.8, seed=9, lp_hz=3600, stereo=True)
    out = sreverb(out, ir, -12.0)
    fade_t = 4.0
    out *= np.where(secs < t0, 0.0, 1.0)[:, None] * (smoothstep((t_end - secs) / fade_t))[:, None] * smoothstep((secs - t0) / 0.5)[:, None]
    return norm(out)


def stamp(tl) -> dict:
    """what the music depends on: the mixer regenerates the files when this changes"""
    st = {s["id"]: s["startSeconds"] for s in tl["scenes"]}
    return {"music": tl["music"], "totalFrames": tl["meta"]["totalFrames"], "sceneStarts": st, "version": 1}


def build(timeline: Path, outdir: Path = PUBLIC, verbose=True):
    import json
    tl = read_json(timeline)
    n_total = tl["meta"]["totalFrames"] * SPF
    dark = render_dark(tl, n_total)
    warm = render_warm(tl, n_total)
    write_wav(outdir / "music_dark.wav", dark, "PCM_24")
    write_wav(outdir / "music_warm.wav", warm, "PCM_24")
    BUILD.mkdir(exist_ok=True)
    (BUILD / "music_meta.json").write_text(json.dumps(stamp(tl), sort_keys=True))
    if verbose:
        print(f"music_dark.wav / music_warm.wav: {n_total / SR:.3f} s, stereo, 48 kHz (ticks {tl['music']['tickStartSeconds']:.2f}-{tl['music']['tickEndSeconds']:.2f} s, drop {tl['music']['dropSeconds']:.3f} s, hopeStart {tl['music']['hopeStartSeconds']:.3f} s)")
    return dark, warm


if __name__ == "__main__":
    args = sys.argv[1:]
    tlp = Path(args[args.index("--timeline") + 1]) if "--timeline" in args else PUBLIC / "timeline.json"
    build(tlp)
