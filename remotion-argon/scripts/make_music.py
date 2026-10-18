# PLACEHOLDER music bed. The brief names public/music.mp3 as an input but it was not supplied, so this synthesises a soft ambient
# pad (Cmaj9 - Am9 - Fmaj7 - G6, 84 bpm) with a sparse bell pulse, 49 s, so the mix, ducking and fades can be built and checked.
# Drop the real file at public/music.mp3 and it is picked up unchanged. Refuses to overwrite a music.mp3 it did not make.
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt

SR, DUR = 48000, 49.0
OUT = "public/music.mp3"
STAMP = "public/.music-placeholder"
import hashlib
md5 = lambda p: hashlib.md5(open(p, "rb").read()).hexdigest()
if os.path.exists(OUT) and not (os.path.exists(STAMP) and open(STAMP).read().split()[0] == md5(OUT)):
    raise SystemExit("public/music.mp3 is not the placeholder this script made: leaving it alone")
rng = np.random.default_rng(5)
n = int(SR * DUR); t = np.arange(n) / SR
beat = 60 / 84; bar = 4 * beat
chords = [[48, 55, 59, 62, 64], [45, 52, 59, 60, 64], [41, 48, 57, 60, 64], [43, 50, 55, 59, 64]]   # MIDI
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

def pad(freqs, d, amp=1.0):
    k = np.arange(int(SR * d)) / SR; y = np.zeros_like(k)
    for f in freqs:
        for det in (-0.12, 0.0, 0.12):
            ff = f * 2 ** (det / 12)
            y += np.sin(2 * np.pi * ff * k + rng.uniform(0, 6.28)) + 0.25 * np.sin(2 * np.pi * 2 * ff * k)
    env = np.minimum(1, k / 1.6) * np.minimum(1, (d - k) / 1.6)
    return y * env * amp / (len(freqs) * 3)

L = np.zeros(n); R = np.zeros(n)
for i in range(int(DUR / (2 * bar)) + 1):
    s = int(i * 2 * bar * SR); d = 2 * bar + 1.6
    seg = pad([hz(m) for m in chords[i % 4]], d)
    e = min(n, s + len(seg))
    L[s:e] += seg[:e - s]; R[s:e] += np.roll(seg, 37)[:e - s]
# sparse bell pulse: the chord's 5th and 9th every two beats, panned alternately
for k in range(int(DUR / (2 * beat))):
    s = int(k * 2 * beat * SR); ch = chords[(k // 4) % 4]; m = ch[(k % 3) + 2] + 12
    d = np.arange(int(SR * 1.4)) / SR
    bell = (np.sin(2 * np.pi * hz(m) * d) + 0.3 * np.sin(2 * np.pi * hz(m) * 2.76 * d)) * np.exp(-d * 3.2) * 0.07
    e = min(n, s + len(bell)); pan = 0.35 + 0.3 * (k % 2)
    L[s:e] += bell[:e - s] * (1 - pan); R[s:e] += bell[:e - s] * pan
sos = butter(2, 2600, btype="low", fs=SR, output="sos")
L, R = sosfilt(sos, L), sosfilt(sos, R)
y = np.stack([L, R], 1); y *= 0.55 / np.max(np.abs(y))
y *= np.minimum(1, t / 0.8)[:, None]
raw = "/tmp/_music.f32"; y.astype("<f4").tofile(raw)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", raw, "-af", "loudnorm=I=-14:TP=-1:LRA=7", "-ar", "48000", "-c:a", "libmp3lame", "-b:a", "256k", OUT], check=True)
open(STAMP, "w").write(md5(OUT) + "  public/music.mp3 is a synthesised placeholder (scripts/make_music.py), mastered to about -14 LUFS\n")
print("wrote", OUT, "(placeholder)")
