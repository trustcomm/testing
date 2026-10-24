#!/usr/bin/env python3
"""PHP2Shell: the music bed (original, synthesised in numpy, seeded and deterministic).

Reads the MUSIC cues + scene starts from public/timeline.json and writes two full-length (totalFrames/30 s) 48 kHz stereo files
that the mixer lays under the voice:

  public/music_dark.wav  S1-S9: dark ambient pulse.  A low drone (C2 / G2, then a minor third, a minor second and a tritone creep in as the
                         tension T(t) rises scene by scene towards the S8/S9 alarm hits), a soft sub heartbeat, subtle clock ticks on the 92 BPM
                         grid (quarters, then eighths, then a few sixteenths), a slow wind swell per 8 bars and a rising riser into the drop.
                         It keeps room for the SFX: no sustained energy in the 1-3 kHz band, everything soft.  After `music.drop` only a faint
                         drone remains (the mixer imposes the 10-frame drop / near silence / out by `silentUntil`).
  public/music_warm.wav  from `hopeStart` (silent before it): warm, hopeful, resolved C major (Cadd9 | G/B | Am7 | Fmaj7 ...), felt piano bass
                         and melody, a light pluck arpeggio, a soft pad; gentle, sparse; fades out over the last seconds.

    python3 scripts/make_music.py [--timeline public/timeline.json]
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from scipy import interpolate, signal

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audiolib import (  # noqa: E402
    BUILD, PUBLIC, SPF, SR, attack, bp, db2lin, fade_in, fade_out, hp, lp, make_ir, modal, nsamp, peaking, pad_tone, phase, piano, place, read_json,
    reverb, rng_for, saw_filtered, smoothstep, sweep_noise, tt, write_wav,
)

C_PEAK_DB = -3.0  # both files are peak-normalised to this; the mixer sets the real level by loudness


def midi(m):
    return 440.0 * 2.0 ** ((np.asarray(m, dtype=float) - 69.0) / 12.0)


def unit(x):
    p = np.max(np.abs(x))
    return x / p if p > 0 else x


def sreverb(bus, ir, wet_db):
    """stereo bus through a stereo IR (each channel through its own decorrelated response); dry + wet"""
    n = len(bus)
    wl = signal.fftconvolve(bus[:, 0], ir[:, 0])[:n]
    wr = signal.fftconvolve(bus[:, 1], ir[:, 1])[:n]
    return bus + db2lin(wet_db) * np.stack([wl, wr], axis=1)


def stereo_place(buf, mono, start, gain=1.0, pan=0.0):
    """add a mono one-shot into the stereo buffer with a constant-power pan"""
    a = (pan + 1) * np.pi / 4
    place(buf[:, 0], mono, start, gain * np.cos(a) * np.sqrt(2) * 0.707)
    place(buf[:, 1], mono, start, gain * np.sin(a) * np.sqrt(2) * 0.707)


# ------------------------------------------------------------------------------------------------------------------ one-shots
def tick_a(r):  # the beat: a soft dry clock tick with a little wooden body
    n = nsamp(0.12)
    t = tt(n)
    x = 0.8 * unit(bp(r.standard_normal(n), 2200, 5800, 2)) * np.exp(-t / 0.0011)
    x += 0.5 * modal(t, [(820, 0.9, 0.016), (1710, 0.5, 0.01), (2690, 0.25, 0.006)]) * attack(t, 0.0004)
    return fade_out(unit(x), 8)


def tick_b(r):  # off-beat eighth: higher, lighter
    n = nsamp(0.08)
    t = tt(n)
    x = 0.8 * unit(bp(r.standard_normal(n), 3200, 8200, 2)) * np.exp(-t / 0.0008) + 0.35 * modal(t, [(2480, 1.0, 0.008), (4100, 0.4, 0.004)]) * attack(t, 0.0003)
    return fade_out(unit(x), 6)


def tick_c(r):  # sixteenth: a breath of hat
    n = nsamp(0.05)
    t = tt(n)
    return fade_out(unit(hp(r.standard_normal(n), 6500, 2)) * np.exp(-t / 0.0006), 4)


def sub_kick(f_end=46.0, dur=0.42):
    n = nsamp(dur)
    t = tt(n)
    f = f_end * (1 + 0.5 * np.exp(-t / 0.035))
    p = phase(f)
    x = (np.sin(p) + 0.28 * np.sin(2 * p + 0.4) * np.exp(-t / 0.08)) * attack(t, 0.008) * np.exp(-t / 0.13)
    return fade_out(x, 25)


# ------------------------------------------------------------------------------------------------------------------ DARK
def tension_curve(tl, n_dark):
    """T(t) in 0..1 per sample: scene by scene towards S9 (the alarm hits), 1.0 at the drop"""
    st = {s["id"]: s["startSeconds"] for s in tl["scenes"]}
    drop = tl["music"]["dropSeconds"]
    knots = [(0.0, 0.05), (st["S2"], 0.14), (st["S3"], 0.22), (st["S4"], 0.28), (st["S5"], 0.24), (st["S6"], 0.38), (st["S7"], 0.55), (st["S8"], 0.80), (st["S9"], 0.95), (drop, 1.0)]
    ts, vs = zip(*knots)
    f = interpolate.PchipInterpolator(ts, vs)
    return np.clip(f(np.clip(tt(n_dark), 0, drop)), 0, 1)


def render_dark(tl, n_total):
    mu = tl["music"]
    beat = 60.0 / mu["bpm"]
    t_drop = mu["dropSeconds"]
    t_end = mu["silentUntilSeconds"] + 1.0  # the drone (only) lingers a little past the drop so the mixer's fade has something to fade
    n = nsamp(t_end)
    t = tt(n)
    T = tension_curve(tl, n)
    r = rng_for("music_dark")
    pre_drop = np.where(t < t_drop, 1.0, 0.0)

    # --- the drone: C2 pair (slow 0.23 Hz beating, one per ear), G2, then a minor third, minor second and tritone creep in with T
    fc = 170.0 + 1500.0 * T ** 1.4
    lfo = 1 + 0.18 * np.sin(2 * np.pi * 0.041 * t + 0.8)
    L = np.zeros(n)
    R = np.zeros(n)
    sub = 0.42 * np.sin(phase(np.full(n, 32.703))) * (0.6 + 0.4 * T)
    L += sub
    R += sub
    for f0, amp, gate, pl, ph0, vib in [
        (65.406, 1.00, 1.0, 0.8, 0.0, 0.0012), (65.406 * 1.0035, 0.90, 1.0, 0.2, 1.7, 0.0010), (98.0, 0.50, 0.35 + 0.65 * T, 0.5, 0.9, 0.0008),
        (155.56, 0.42, smoothstep((T - 0.30) / 0.22), 0.3, 2.4, 0.0007),  # Eb3: the minor third, dark
        (138.59, 0.34, smoothstep((T - 0.62) / 0.22), 0.7, 0.4, 0.0009),  # Db3: a minor second against the C drone, unease
        (185.0, 0.26, smoothstep((T - 0.86) / 0.1), 0.5, 1.2, 0.0011),  # Gb3: the tritone, the last turn of the screw
    ]:
        f_inst = f0 * (1 + vib * np.sin(2 * np.pi * (0.06 + 0.02 * ph0) * t + ph0))
        x = saw_filtered(f_inst, fc, 16, 1.35, ph0) * amp * gate * lfo * (0.5 + 0.5 * T)
        L += x * np.sqrt(1 - pl)
        R += x * np.sqrt(pl)
    drone = np.stack([L, R], axis=1)
    drone = lp(drone, 2600, 2)
    drone *= 0.55

    # --- sub heartbeat on the grid + soft ticks
    pulse = np.zeros((n, 2))
    ticks = np.zeros((n, 2))
    tA, tB, tC = tick_a(r), tick_b(r), tick_c(r)
    kick = sub_kick()
    kick2 = sub_kick(52.0, 0.3)
    t_tick0 = tl["scenes"][1]["startSeconds"] - 0.0  # the ticking starts with S2 (S1's own clock_tick sound owns the first seconds)
    k = 0
    while True:
        tb = k * beat
        if tb >= t_drop:
            break
        i = int(round(tb * SR))
        Tk = float(T[min(i, n - 1)])
        down = (k % 4 == 0)
        if tb >= t_tick0:
            stereo_place(ticks, tA, i, (0.30 + 0.40 * Tk) * (1.4 if down else 1.0), pan=-0.15 if k % 2 else 0.15)
            if Tk > 0.28:  # eighths
                stereo_place(ticks, tB, i + int(round(beat / 2 * SR)), 0.14 + 0.30 * Tk, pan=0.35 if k % 2 else -0.35)
            if Tk > 0.78:  # a few sixteenths: an anxious flutter
                for q, on in zip((0.25, 0.75), (k % 3 != 0, k % 2 == 0)):
                    if on:
                        stereo_place(ticks, tC, i + int(round(q * beat * SR)), 0.10 + 0.16 * Tk, pan=r.uniform(-0.6, 0.6))
        # the sub heartbeat: bar downbeat first, then beat 3, then every beat; lub-dub near the end
        beat_in_bar = k % 4
        if Tk > 0.10 and (beat_in_bar == 0 or (Tk > 0.35 and beat_in_bar == 2) or (Tk > 0.60 and beat_in_bar in (1, 3))) and tb > 3.0:
            g = 0.22 + 0.55 * Tk
            stereo_place(pulse, kick, i, g)
            if Tk > 0.78 and beat_in_bar == 0:
                stereo_place(pulse, kick2, i + int(round(0.215 * SR)), g * 0.65)
        k += 1

    # --- air / shimmer: a slow wind swell every 8 bars (resets: a breath), high clustered partials once the tension is up
    bar = 4 * beat
    phrase = 8 * bar
    u = (t % phrase) / phrase
    swell_fc = 260.0 * (2300 / 260.0) ** u
    wind = sweep_noise(r, n, swell_fc, 1.4) * (0.05 + 0.20 * T ** 1.2) * (u ** 2.0) * 0.32
    shimmer = np.zeros((n, 2))
    for f0, pl, ph0 in [(1046.5, 0.25, 0.3), (1108.7, 0.75, 1.1), (1568.0, 0.5, 2.0)]:
        trem = 0.55 + 0.45 * np.sin(2 * np.pi * (0.13 + 0.05 * ph0) * t + ph0)
        x = np.sin(phase(np.full(n, f0), ph0)) * smoothstep((T - 0.45) / 0.3) * T ** 2 * 0.045 * trem
        shimmer[:, 0] += x * np.sqrt(1 - pl)
        shimmer[:, 1] += x * np.sqrt(pl)
    airy = np.stack([wind, np.roll(wind, 211)], axis=1) + shimmer

    # --- riser into the drop: noise + tone rising over the last 3.2 s (the drop then cuts it)
    rs = 3.2
    ur = np.clip((t - (t_drop - rs)) / rs, 0, 1)
    riser_env = (ur ** 2.2) * np.where(t < t_drop, 1.0, 0.0)
    riser = sweep_noise(r, n, 350.0 * (5200 / 350.0) ** ur, 1.1) * riser_env * 0.17
    riser_tone = (np.sin(phase(150.0 * 2 ** (ur * 18 / 12))) + 0.5 * np.sin(phase(155.0 * 2 ** (ur * 18 / 12) * 1.0595))) * riser_env * 0.10
    airy += np.stack([riser + riser_tone, np.roll(riser, 97) + riser_tone * 0.9], axis=1)

    # --- the bed that stops at the drop (everything but the drone); a plate-ish reverb on ticks + air for depth
    wet_src = (ticks + airy) * pre_drop[:, None]
    ir = make_ir(1.5, seed=101, lp_hz=5000, predelay=0.012, stereo=True)
    bed = sreverb(wet_src, ir, -13.0)
    mix = drone + pulse * pre_drop[:, None] + bed
    # hit room: carve a gentle hole where the SFX live (alarm hits, 1-3 kHz clicks)
    mix[:, 0] = peaking(mix[:, 0], 1800, -3.0, 0.7)
    mix[:, 1] = peaking(mix[:, 1], 1800, -3.0, 0.7)
    # the intro: S1 belongs to its own sounds, so the bed arrives slowly (full by the middle of S2)
    s2 = tl["scenes"][1]["startSeconds"]
    intro = 0.10 + 0.90 * smoothstep((t - 0.5) / (s2 + 2.0))
    mix *= intro[:, None]
    # after the drop only the (quiet) drone remains: stop the rest with the same time as the mixer's ramp
    out = np.zeros((n_total, 2))
    out[:n] = fade_out(mix[:n], 30)
    return _norm(out)


def _norm(x):
    p = np.max(np.abs(x))
    return x * (db2lin(C_PEAK_DB) / p) if p > 0 else x


# ------------------------------------------------------------------------------------------------------------------ WARM
CHORDS = {  # midi: bass, arpeggio tones (ascending), pad tones
    "C": dict(bass=48, tones=[60, 64, 67, 74], pad=[55, 60, 64, 71]),
    "G": dict(bass=43, tones=[59, 62, 67, 74], pad=[50, 55, 59, 62]),
    "Am": dict(bass=45, tones=[57, 60, 64, 67], pad=[52, 57, 60, 64]),
    "F": dict(bass=41, tones=[60, 65, 69, 76], pad=[48, 53, 57, 64]),
}
PROGRESSION = ["C", "G", "Am", "F", "C", "G", "Am", "F", "C", "F", "C"]
# melody: (bar index, beat (0-based, 4/4), midi, length in beats, velocity)
MELODY = [
    (4, 0, 76, 1.5, 0.55), (4, 2.5, 74, 0.5, 0.45), (4, 3, 72, 1, 0.5),
    (5, 0, 71, 1.5, 0.52), (5, 1.5, 72, 0.5, 0.42), (5, 2, 74, 2, 0.55),
    (6, 0, 76, 1.5, 0.55), (6, 2.5, 74, 0.5, 0.45), (6, 3, 72, 0.5, 0.45), (6, 3.5, 69, 0.5, 0.42),
    (7, 0, 72, 1.5, 0.52), (7, 1.5, 74, 0.5, 0.42), (7, 2, 76, 2, 0.58),
    (8, 0, 79, 2, 0.6), (8, 2, 76, 2, 0.5),
    (9, 0, 72, 2, 0.5), (9, 2, 74, 2, 0.5),
    (10, 0, 76, 5, 0.5),
]
ARP_PATTERN = [0, 2, 1, 2, 3, 2, 1, 2]  # eighth notes over the chord's four tones


def pluck_note(f, dur, vel, seed):
    n = nsamp(dur)
    t = tt(n)
    r = np.random.default_rng(seed)
    out = np.zeros(n)
    for k in range(1, 12):
        if f * k > 9000:
            break
        a = (k ** -1.45) * np.exp(-(k / 4.0) ** 2)
        tau = 0.5 / (1 + 0.9 * (k - 1))
        out += a * np.exp(-t / tau) * np.sin(2 * np.pi * f * k * t + r.uniform(0, 6.28))
    out *= attack(t, 0.0015)
    out += 0.05 * vel * lp(r.standard_normal(n), 2600, 2) * np.exp(-t / 0.005)
    return fade_out(out * (0.5 + 0.5 * vel), 20)


def render_warm(tl, n_total):
    mu = tl["music"]
    beat = 60.0 / mu["bpm"]
    bar = 4 * beat
    t0 = mu["hopeStartSeconds"]
    t_end = tl["meta"]["totalSeconds"]
    r = rng_for("music_warm")
    piano_bus = np.zeros((n_total, 2))
    pluck_bus = np.zeros((n_total, 2))
    pad_bus = np.zeros((n_total, 2))

    def jit(i):  # seeded human timing (never on the very first note)
        return 0.0 if i == 0 else float(r.uniform(-0.006, 0.006))

    for bi, name in enumerate(PROGRESSION):
        ch = CHORDS[name]
        tb = t0 + bi * bar
        if tb >= t_end:
            break
        left = t_end - tb
        # pad: soft, blooming, one per bar, overlapping into the next
        for j, m in enumerate(ch["pad"]):
            pd = pad_tone(float(midi(m)), min(bar, left), att=0.7 if bi == 0 else 0.45, rel=1.4 if bi < len(PROGRESSION) - 1 else 3.5, bright=0.7, voices=3, detune_cents=6.0, seed=bi * 10 + j)
            pd = lp(pd, 1900, 2)
            stereo_place(pad_bus, pd, int(round(tb * SR)), 0.30, pan=(j - 1.5) * 0.35)
        # piano bass: root on beat 1 (+ the fifth an octave up on beat 3 in the middle of the piece)
        b = piano(float(midi(ch["bass"])), min(3.2, left), vel=0.48, bright=0.55, seed=bi, tail_tau=2.8)
        stereo_place(piano_bus, b, int(round((tb + jit(bi)) * SR)), 0.9, pan=-0.35)
        if 2 <= bi <= 7:
            b2 = piano(float(midi(ch["bass"] + 7)), min(2.2, left), vel=0.38, bright=0.55, seed=bi + 50, tail_tau=2.0)
            stereo_place(piano_bus, b2, int(round((tb + 2 * beat + jit(bi)) * SR)), 0.55, pan=-0.2)
        # arpeggio on plucks, eighth notes; sparse at first, full from bar 3, thinning out at the end
        if bi == 0:
            steps = [0, 4]  # two notes: very sparse
        elif bi == 1:
            steps = [0, 2, 4, 5, 6]
        elif bi <= 8:
            steps = list(range(8))
        else:
            steps = [0, 2, 4]
        for s_i in steps:
            ts = tb + s_i * beat / 2 + jit(bi + s_i + 1)
            if ts >= t_end - 0.2:
                continue
            tone = ch["tones"][ARP_PATTERN[s_i % 8]]
            vel = (0.62 if s_i % 2 == 0 else 0.42) * (0.75 if bi == 0 else 1.0) * float(r.uniform(0.9, 1.08))
            pk = pluck_note(float(midi(tone + (12 if bi >= 4 and s_i % 4 == 3 else 0))), min(1.4, t_end - ts), vel, seed=bi * 8 + s_i)
            stereo_place(pluck_bus, pk, int(round(ts * SR)), 0.5 * vel, pan=-0.45 + 0.9 * (ARP_PATTERN[s_i % 8] / 3.0))
    for bar_i, beat_i, m, length, vel in MELODY:
        ts = t0 + bar_i * bar + beat_i * beat + float(r.uniform(-0.005, 0.005))
        if ts >= t_end:
            continue
        pn = piano(float(midi(m)), min(length * beat + 2.2, t_end - ts), vel=vel, bright=0.85, seed=int(bar_i * 10 + beat_i * 2), tail_tau=2.6)
        stereo_place(piano_bus, pn, int(round(ts * SR)), 0.8, pan=0.25)

    # reverb: a warm hall on the piano + plucks, a touch on the pad
    ir = make_ir(2.3, seed=113, lp_hz=4800, predelay=0.02, stereo=True)

    piano_w = sreverb(piano_bus, ir, -11.0)
    pluck_w = sreverb(pluck_bus, ir, -10.0)
    # warm: a gentle low-pass + a little low-mid body; fade out over the last seconds
    mix = piano_w * 1.0 + pluck_w * 0.8 + pad_bus * 0.8
    mix = np.stack([lp(mix[:, 0], 9000, 1), lp(mix[:, 1], 9000, 1)], axis=1)
    t = tt(n_total)
    fade_len = 4.6
    mix *= np.where(t < t_end - fade_len, 1.0, 0.5 + 0.5 * np.cos(np.pi * np.clip((t - (t_end - fade_len)) / fade_len, 0, 1)))[:, None]
    mix = fade_out(mix, 30)
    mix[: int(t0 * SR)] = 0.0
    return _norm(mix)


def stamp(tl) -> dict:
    """what the music depends on: the mixer regenerates the files when this changes"""
    st = {s["id"]: s["startSeconds"] for s in tl["scenes"]}
    return {"music": tl["music"], "totalFrames": tl["meta"]["totalFrames"], "sceneStarts": st, "version": 3}


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
        print(f"music_dark.wav / music_warm.wav: {n_total / SR:.3f} s, stereo, 48 kHz (drop {tl['music']['dropSeconds']:.3f} s, silentUntil {tl['music']['silentUntilSeconds']:.3f} s, hopeStart {tl['music']['hopeStartSeconds']:.3f} s)")
    return dark, warm


if __name__ == "__main__":
    args = sys.argv[1:]
    tlp = Path(args[args.index("--timeline") + 1]) if "--timeline" in args else PUBLIC / "timeline.json"
    build(tlp)
