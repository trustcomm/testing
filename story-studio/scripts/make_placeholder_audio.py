#!/usr/bin/env python3
"""Generate royalty-free placeholder audio for the Remotion audio slots:
public/music.mp3 and public/sfx/{tick,swipe,hit,logo}.mp3.

Swap any of them for real files with the same names; the composition picks them up automatically.
Synth helpers are reused from trustcomm-launch/scripts/make_audio.py.
"""
import importlib.util
import os
import subprocess

import numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location(
    "lib", os.path.join(ROOT, "..", "trustcomm-launch", "scripts", "make_audio.py"))
L = importlib.util.module_from_spec(spec)
spec.loader.exec_module(L)
SR, midi, place = L.SR, L.midi, L.place
PUB = os.path.join(ROOT, "public")


def to_mp3(x, path, peak=0.89):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    x = x / max(1e-9, np.abs(x).max()) * peak
    tmp = path + ".wav"
    wavfile.write(tmp, SR, (x * 32767).astype(np.int16))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-codec:a", "libmp3lame", "-b:a", "192k", path], check=True)
    os.remove(tmp)


def music(length=36.0):
    """Calm documentary bed: 76 BPM, D minor, soft mallet arpeggio + warm pad, no drums."""
    n = int(SR * length)
    m = np.zeros((n, 2))
    beat = 60 / 76
    prog = [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 61]]  # Dm Bb C A
    t, bar = 0.0, 0
    while t < length:
        ch = prog[bar % 4]
        place(m, L.pad([midi(x) for x in ch], beat * 4 + 0.6, attack=0.8, release=0.8, cutoff=1500), t, 0.5)
        place(m, L.bass(midi(ch[0] - 12), beat * 3.5), t, 0.35)
        for i, k in enumerate([0, 2, 3, 2, 1, 2, 3, 2]):
            place(m, L.mallet(midi(ch[k] + 12), 1.2), t + i * beat / 2, 0.16, pan=-0.3 if i % 2 else 0.3)
        t += beat * 4
        bar += 1
    tt = np.arange(n) / SR
    m *= np.clip(tt / 1.5, 0, 1)[:, None] * np.clip((length - tt) / 2.5, 0, 1)[:, None]
    return m


def main():
    os.makedirs(os.path.join(PUB, "sfx"), exist_ok=True)
    to_mp3(music(), os.path.join(PUB, "music.mp3"))
    to_mp3(L.sfx_tick(2600), os.path.join(PUB, "sfx", "tick.mp3"), 0.6)
    to_mp3(L.sfx_whoosh(0.55, 300, 4200, 0.5), os.path.join(PUB, "sfx", "swipe.mp3"))
    hit = L.sfx_impact(1.6) * 0.8 + np.pad(L.mallet(midi(38), 1.5), (0, int(SR * 0.1)))[: int(SR * 1.6)] * 0.4
    to_mp3(hit, os.path.join(PUB, "sfx", "hit.mp3"))
    to_mp3(L.sfx_chime((74, 81, 86), 0.09, 1.6), os.path.join(PUB, "sfx", "logo.mp3"))
    print("ok")


if __name__ == "__main__":
    main()
