#!/usr/bin/env python3
"""Music bed + SFX for the Dots reel, cue-locked to index.html, mixed under the ElevenLabs VO.

Reuses the procedural instruments/SFX from trustcomm-launch/scripts/make_audio.py.
Outputs (48 kHz stereo WAV) in assets/audio/:
  mix.wav        VO + music + SFX (−14 LUFS, what the reel carries)
  music-bed.wav  music only (already ducked under the VO)
  sfx.wav        SFX only
  vo-48k.wav     the VO, resampled, level-matched
"""
import importlib.util
import os
import subprocess
import sys

import numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lib_path = os.path.join(ROOT, "..", "trustcomm-launch", "scripts", "make_audio.py")
spec = importlib.util.spec_from_file_location("tclib", lib_path)
L = importlib.util.module_from_spec(spec)
spec.loader.exec_module(L)

SR = L.SR
LEN = 61.5
N = int(SR * LEN)
OUT = os.path.join(ROOT, "assets", "audio")
place, midi = L.place, L.midi


def load_vo():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(OUT, "vo.mp3"), "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True).stdout
    v = np.frombuffer(raw, np.float32).astype(float)
    out = np.zeros(N)
    out[:min(N, len(v))] = v[:N]
    return out


def lufs(x):
    tmp = os.path.join(OUT, "_m.wav")
    write(tmp, x / max(1e-9, np.abs(x).max()) * 0.5)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    os.remove(tmp)
    import json
    js = json.loads(r.stderr[r.stderr.rfind("{"): r.stderr.rfind("}") + 1])
    return float(js["input_i"]) + 20 * np.log10(np.abs(x).max() / 0.5)


def write(path, x):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    x = np.clip(x, -1, 1)
    wavfile.write(path, SR, (x * (2 ** 23 - 1)).astype(np.int32) << 8)


# ---------------------------------------------------------------- music (100 BPM, A minor)
BEAT = 0.6
GRID0 = 4.13
PROG = [(45, [57, 60, 64, 67]), (41, [57, 60, 65, 69]), (48, [55, 60, 64, 67]), (43, [55, 59, 62, 67])]  # Am7 F C G
ARP = [0, 2, 3, 1, 2, 3, 1, 2]


def section(t):
    if t < 0.78:
        return "riser"
    if t < 4.13:
        return "intro"
    if t < 32.25:
        return "main"
    if t < 33.8:
        return "stop"
    if t < 48.9:
        return "half"
    if t < 58.2:
        return "peak"
    if t < 59.38:
        return "stop"
    return "end"


def build_music():
    m = np.zeros((N, 2))
    # riser into the lid snap, then the hit
    place(m, L.sfx_riser(0.75), 0.03, 0.5)
    # grid: every 8th note from 0.78 (intro) and from GRID0 onward
    k0 = int(np.floor((0.78 - GRID0) / (BEAT / 2)))
    k = k0
    while True:
        t = GRID0 + k * BEAT / 2
        k += 1
        if t >= LEN:
            break
        if t < 0.78:
            continue
        sec = section(t)
        e8 = (k - 1) % 16  # eighth index within a 2-bar cycle? use per-bar
        bar = int(np.floor((t - GRID0) / (BEAT * 4)))
        root, chord = PROG[bar % 4]
        eighth = int(round((t - GRID0) / (BEAT / 2))) % 8
        on_beat = eighth % 2 == 0
        beat_i = eighth // 2
        # pad at bar starts
        if eighth == 0 and sec in ("intro", "main", "half", "peak"):
            place(m, L.pad([midi(n) for n in chord], BEAT * 4 + 0.3, attack=0.25, release=0.4,
                           cutoff=1600 if sec == "half" else 2400), t, 0.32)
        if sec == "intro" and eighth == 4 and t < 4.13:
            place(m, L.pad([midi(n) for n in chord], 2.2, attack=0.2, release=0.5, cutoff=1400), t, 0.3)
        if sec in ("intro", "main", "half", "peak"):
            if sec != "intro" or on_beat:
                n = chord[ARP[eighth]] + 12
                place(m, L.pluck(midi(n), 0.45, 0.7), t, 0.22 if sec != "peak" else 0.25, pan=-0.3 if eighth % 2 else 0.3)
        if sec in ("main", "peak"):
            if on_beat:
                place(m, L.kick(), t, 0.5)
            if on_beat and beat_i in (1, 3):
                place(m, L.clap(), t, 0.36)
            place(m, L.hat(open_=(sec == "peak" and not on_beat)), t, 0.2 if not on_beat else 0.12, pan=0.3)
            if eighth in (0, 3, 6):
                place(m, L.bass(midi(root)), t, 0.5)
        if sec == "half":
            if eighth == 0:
                place(m, L.kick(), t, 0.45)
                place(m, L.bass(midi(root), 0.9), t, 0.45)
            if eighth == 4:
                place(m, L.clap(), t, 0.3)
            if on_beat:
                place(m, L.hat(), t, 0.1, pan=0.3)
    # "bura news" drone and end stop drone
    place(m, L.pad([midi(33), midi(40)], 1.7, attack=0.05, release=0.6, cutoff=500), 32.25, 0.6)
    place(m, L.pad([midi(45), midi(52), midi(57)], 1.2, attack=0.1, release=0.4, cutoff=900), 58.2, 0.35)
    # final chord
    place(m, L.pad([midi(n) for n in [45, 52, 57, 60, 64, 69]], 2.2, attack=0.02, release=1.2, cutoff=2600), 59.38, 0.55)
    place(m, L.bass(midi(33), 1.8), 59.38, 0.6)
    for i, n in enumerate([69, 72, 76, 81]):
        place(m, L.pluck(midi(n), 1.2, 0.9), 59.5 + i * 0.1, 0.2)
    return m


# ---------------------------------------------------------------- SFX cue sheet (mirrors index.html)
def build_sfx():
    s = np.zeros((N, 2))

    def cue(x, t, g=1.0, pan=0.0):
        place(s, x, t, g, pan)

    W = lambda d=0.45: L.sfx_whoosh(d, 400, 4500, 0.6)
    pop = L.sfx_pop
    tick = L.sfx_tick
    # scene whooshes (peak lands on the cut)
    for t in [4.13, 6.72, 9.96, 14.0, 17.05, 19.56, 24.2, 29.3, 33.8, 39.5, 41.42, 46.08, 48.98, 54.0, 57.12, 58.35]:
        cue(W(), t - 0.27, 0.32)
    # V1 hook
    cue(pop(700, 0.12), 0.12, 0.35)
    cue(L.sfx_impact(0.8), 0.78, 0.55)
    cue(L.sfx_click(), 0.78, 0.9)
    cue(L.sfx_whoosh(0.5, 300, 5000, 0.8), 2.3, 0.35)
    cue(pop(820, 0.12), 2.92, 0.4)
    for i in range(3):
        cue(L.sfx_chime((88 + i * 2,), 0.05, 0.4), 3.5 + i * 0.25, 0.28)
    # V2 reveal
    cue(L.sfx_chime((81, 88, 93), 0.06, 1.2), 4.2, 0.45)
    cue(L.sfx_shimmer(1.2), 4.25, 0.8)
    cue(pop(600, 0.14), 5.02, 0.35)
    cue(tick(2400), 6.05, 0.35)
    # V3 chat
    for i in range(3):
        cue(pop(900 + i * 80, 0.1), 6.92 + i * 0.3, 0.3, pan=0.3 if i % 2 else -0.3)
    cue(L.sfx_click(), 8.47, 0.8)
    cue(L.sfx_whoosh(0.35, 3000, 400, 0.3), 8.55, 0.4)
    cue(L.sfx_impact(0.6), 9.02, 0.35)
    cue(L.sfx_uhoh(), 9.05, 0.3)
    # V4 cloud
    cue(L.sfx_whoosh(0.5, 200, 1500, 0.5), 10.0, 0.3)
    cue(pop(520, 0.12), 10.52, 0.35)
    cue(L.sfx_type(14, 1.8), 11.0, 0.25)
    cue(pop(640, 0.12), 11.82, 0.3)
    for i in range(3):
        cue(pop(760 + i * 90, 0.1), 12.97 + i * 0.12, 0.35, pan=(-0.5, 0.5, 0.4)[i])
    # V5 night
    cue(L.sfx_shimmer(1.2), 14.08, 0.7)
    cue(pop(560, 0.12), 14.92, 0.3)
    for i in range(12):
        u = i / 11
        cue(tick(2800), 15.4 + 1.5 * (u ** 0.7), 0.18)
    cue(L.sfx_chime((88, 93), 0.08, 1.0), 16.8, 0.4)
    # V6 slack bug
    cue(L.sfx_chime((84, 79), 0.12, 0.6), 17.08, 0.45)
    cue(L.sfx_beep(220, 0.25), 17.42, 0.25)
    cue(L.sfx_whoosh(0.3, 800, 4000, 0.6), 18.12, 0.3)
    cue(L.sfx_hum(0.8), 18.3, 0.35)
    cue(L.sfx_chime((84, 88, 91), 0.06, 1.0), 19.07, 0.4)
    # V7 invoice
    cue(L.sfx_whoosh(0.35, 1500, 6000, 0.6), 19.6, 0.3)
    for i in range(5):
        cue(tick(3000 - i * 150), 20.1 + i * 0.12, 0.25)
    cue(pop(480, 0.12), 20.92, 0.35)
    cue(pop(620, 0.14), 22.0, 0.4)
    cue(L.sfx_click(), 22.97, 0.9)
    cue(L.sfx_chime((88, 95), 0.06, 0.8), 23.0, 0.35)
    cue(L.sfx_whoosh(0.6, 500, 7000, 0.7), 23.4, 0.45)
    # V8 tabs
    for i in range(47):
        cue(tick(1800 + (i % 7) * 180), 24.35 + i * 0.045, 0.13, pan=-0.6 + 1.2 * i / 46)
    cue(L.sfx_rattle()[:int(SR * 0.5)], 26.5, 0.4)
    cue(L.sfx_whoosh(0.35, 5000, 300, 0.3), 27.8, 0.4)
    cue(pop(560, 0.14), 27.97, 0.35)
    for i in range(3):
        cue(L.sfx_chime((86 + 3 * i,), 0.05, 0.4), 28.32 + i * 0.25, 0.3)
    # V9 apps
    for i in range(30):
        cue(pop(500 + (i * 37) % 600, 0.08), 29.35 + i * 0.025, 0.12, pan=-0.5 + (i % 6) / 5)
    cue(L.sfx_chime((88, 93, 96), 0.06, 1.0), 31.0, 0.35)
    # V10 bura news
    cue(L.sfx_whoosh(0.4, 4000, 200, 0.2), 32.1, 0.4)
    cue(np.concatenate([L.mallet(midi(64), 0.25), L.mallet(midi(63), 0.25), L.mallet(midi(62), 0.25), L.mallet(midi(61), 0.9)]) * 0.8, 32.35, 0.45)
    # V11 club
    cue(L.sfx_impact(0.7), 33.87, 0.35)
    cue(L.sfx_uhoh(), 35.15, 0.35)
    cue(pop(700, 0.14), 36.37, 0.4)
    cue(L.sfx_chime((91, 96), 0.06, 0.8), 36.87, 0.4)
    cue(pop(600, 0.12), 38.12, 0.3)
    # V12 India
    cue(pop(300, 0.18), 39.6, 0.45)
    cue(pop(900, 0.12), 39.72, 0.35)
    cue(pop(640, 0.12), 40.12, 0.3)
    cue(L.sfx_whoosh(0.5, 1200, 5000, 0.5), 40.5, 0.2)
    # V13 rules
    cue(L.sfx_click(), 43.06, 0.7); cue(L.sfx_chime((88,), 0.05, 0.5), 43.08, 0.3)
    cue(L.sfx_click(), 44.11, 0.7); cue(L.sfx_chime((84,), 0.05, 0.5), 44.13, 0.3)
    cue(L.sfx_click(), 45.01, 0.7); cue(L.sfx_beep(180, 0.2), 45.03, 0.25)
    # V14 password
    cue(L.sfx_beep(200, 0.3), 46.6, 0.25)
    cue(L.sfx_impact(0.9), 47.25, 0.45)
    cue(L.sfx_chime((84, 88, 91, 96), 0.06, 1.2), 47.3, 0.4)
    # V15 vs
    cue(L.sfx_whoosh(0.4, 300, 3000, 0.6), 48.9, 0.4, pan=-0.5)
    cue(L.sfx_whoosh(0.4, 300, 3000, 0.6), 50.72, 0.4, pan=0.5)
    cue(L.sfx_impact(0.9), 51.52, 0.5)
    cue(L.sfx_riser(0.6), 51.9, 0.3)
    cue(L.sfx_impact(1.2), 52.5, 0.6)
    cue(L.sfx_rattle()[:int(SR * 0.45)], 52.6, 0.4)
    # V16 comment
    cue(L.sfx_type(4, 0.5), 54.35, 0.6)
    cue(L.sfx_click(), 55.0, 0.8)
    cue(L.sfx_whoosh(0.4, 600, 5000, 0.6), 55.3, 0.35)
    cue(L.sfx_chime((91, 96), 0.09, 1.0), 56.0, 0.45)
    # V17 follow
    cue(L.sfx_click(), 57.6, 0.8)
    cue(pop(880, 0.14), 57.68, 0.4)
    # V18 end
    cue(L.sfx_impact(0.8), 59.38, 0.5)
    cue(L.sfx_click(), 59.38, 0.9)
    cue(pop(760, 0.12), 59.77, 0.35)
    cue(pop(900, 0.14), 60.32, 0.35)
    cue(L.sfx_shimmer(1.2), 60.3, 0.6)
    return s


def main():
    vo = load_vo()
    music = build_music()
    sfx = build_sfx()
    # duck music under the voice (smoothed envelope, ~-8 dB while speaking)
    hop = 480
    env = np.array([np.sqrt(np.mean(vo[i:i + hop] ** 2)) for i in range(0, N, hop)])
    act = np.clip((20 * np.log10(env + 1e-9) + 45) / 15, 0, 1)
    k = np.ones(9) / 9
    act = np.convolve(act, k, mode="same")
    duck = 1 - 0.6 * np.repeat(act, hop)[:N]
    music *= duck[:, None]
    # levels: VO to −16 LUFS; music ≈ 15 dB under; SFX ≈ 9 dB under
    vo *= 10 ** ((-16 - lufs(vo)) / 20)
    music *= 10 ** ((-31 - lufs(music.mean(axis=1))) / 20)
    sfx *= 10 ** ((-25 - lufs(sfx.mean(axis=1))) / 20)
    vo2 = np.stack([vo, vo], axis=1)
    mix = vo2 + music + sfx
    g = 10 ** ((-14 - lufs(mix.mean(axis=1))) / 20)
    mix *= g
    # soft-knee limiter
    thr = 0.85
    a = np.abs(mix)
    over = a > thr
    mix[over] = np.sign(mix[over]) * (thr + (1 - thr) * np.tanh((a[over] - thr) / (1 - thr)))
    t = np.arange(N) / SR
    mix *= np.clip((LEN - t) / 0.4, 0, 1)[:, None]
    write(os.path.join(OUT, "mix.wav"), mix * 0.88)
    write(os.path.join(OUT, "music-bed.wav"), music * g)
    write(os.path.join(OUT, "sfx.wav"), sfx * g)
    write(os.path.join(OUT, "vo-48k.wav"), vo2 * g)
    print("peak %.2f" % np.abs(mix).max())


if __name__ == "__main__":
    main()
