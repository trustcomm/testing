#!/usr/bin/env python3
"""The reel's soundtrack, written in code: a 120 BPM, 15.0 s cue synthesized from scratch plus bundled SFX.

Usage: python3 -I scripts/compose_audio.py
Reads : src/cues.json (the shared timing spine), the media-use bundled Pixabay SFX (commercial use, no attribution)
Writes: assets/audio/soundtrack.wav (48 kHz / 24-bit stereo, mastered −14 LUFS, true peak < −1 dBTP after AAC)
        src/waveform.json (peaks for the timeline panel at the close)
        out/audio/stems/*.wav, out/audio/report.json
Everything is deterministic: seeded noise, closed-form envelopes, no randomness at run time.

Arrangement (beat n at 0.5 n s; pickup 0–1 s, bar k at 1 + 2(k−1) s), key D minor, resolving to D major on the name:
  pickup  riser + falling whistle                     | bar 1 Dm9   house groove, rubber boops on the ball contacts
  bar 2   Bbmaj9, liquid bloops                       | bar 3 Gm9   key clicks / whoosh / thud / boing per word
  bar 4   Dm9 low, half-time, sub drop (ink world)    | bar 5 Bbmaj7#11, 16th arp shimmer, particle burst
  bar 6   A7b9, ticks + pops + stamp, snare roll      | bar 7 D major add9 final hit, chime, tails to silence
"""
import json, os, re, subprocess
import numpy as np
import scipy.signal as ss

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SR = 48000
CUES = json.load(open("src/cues.json"))
DUR = CUES["duration"]
N = int(round(DUR * SR))
B = CUES["beat"]
SFX_DIR = os.path.expanduser("~/.claude/skills/media-use/audio/assets/sfx")
os.makedirs("out/audio/stems", exist_ok=True)
os.makedirs("assets/audio", exist_ok=True)
rng = np.random.default_rng(20261007)          # seeded once; all noise below is drawn from it in a fixed order


def bar(k):
    return 1.0 + 2.0 * (k - 1)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def stereo():
    return np.zeros((N, 2), np.float64)


def place(bus, x, t, gain=1.0, pan=0.0):
    """Add mono or stereo x into bus at time t (constant-power pan for mono)."""
    k = int(round(t * SR))
    if x.ndim == 1:
        a = (pan + 1) * np.pi / 4
        x = np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)
    if k < 0:
        x, k = x[-k:], 0
    m = max(0, min(len(x), N - k))
    bus[k:k + m] += x[:m] * gain


def env_exp(n, tau, attack=0.002):
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1) if attack > 0 else 1.0
    return a * np.exp(-t / tau)


def noise(n):
    return rng.standard_normal(n)


def saw(freq, n, detune_cents=0.0, phase=0.0):
    """Band-limited saw (polyBLEP); freq may be a scalar or a per-sample array."""
    f = np.broadcast_to(np.asarray(freq, np.float64) * 2 ** (detune_cents / 1200), (n,))
    dt = f / SR
    ph = (phase + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]
    y[m] -= x * x + x + x + 1
    return y


def sine(freq, n, phase=0.0):
    f = np.broadcast_to(np.asarray(freq, np.float64), (n,))
    return np.sin(2 * np.pi * (phase + np.cumsum(f) / SR))


def biquad(kind, fc, q=0.707):
    w = 2 * np.pi * min(max(fc, 10), SR * 0.45) / SR
    c, s = np.cos(w), np.sin(w)
    al = s / (2 * q)
    if kind == "lp":
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    elif kind == "hp":
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
    else:                                        # band-pass, constant peak gain
        b = [al, 0, -al]
    a = [1 + al, -2 * c, 1 - al]
    return np.array(b) / a[0], np.array(a) / a[0]


def filt(x, kind, fc, q=0.707):
    b, a = biquad(kind, fc, q)
    return ss.lfilter(b, a, x, axis=0)


def sweep(x, kind, fc_curve, q=0.707, block=64):
    """Time-varying biquad (cutoff per block), state carried across blocks."""
    y = np.zeros_like(x)
    zi = np.zeros(2)
    for i in range(0, len(x), block):
        b, a = biquad(kind, float(fc_curve[min(i, len(fc_curve) - 1)]), q)
        y[i:i + block], zi = ss.lfilter(b, a, x[i:i + block], zi=zi)
    return y


def load(name, stereo_out=False):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(SFX_DIR, name), "-ac", "2", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
    x /= max(1e-9, np.abs(x).max())
    return x if stereo_out else x.mean(1)


def resample(x, ratio):
    """Pitch-shift by resampling (ratio > 1 = higher, shorter)."""
    n = int(len(x) / ratio)
    return np.interp(np.arange(n) * ratio, np.arange(len(x)), x, right=0)


def lufs_tp(path):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)[-1])


def write(path, x, bits="pcm_s24le"):
    x = x if x.ndim == 2 else x[:, None]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", str(x.shape[1]), "-i", "-",
                    "-c:a", bits, path], input=x.astype(np.float32).tobytes(), check=True)


# ======================================================================== instruments
def kick(level=1.0, deep=False):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f0, f1 = (40, 95) if deep else (47, 120)
    f = f0 + f1 * np.exp(-t / 0.032)
    body = sine(f, n) * np.exp(-t / (0.42 if deep else 0.30))
    click = filt(noise(int(0.006 * SR)), "hp", 2500) * np.linspace(1, 0, int(0.006 * SR)) * 0.5
    body[:len(click)] += click
    return np.tanh(1.6 * body) * level


def clap():
    n = int(0.45 * SR)
    x = np.zeros(n)
    for d in (0.0, 0.009, 0.018):
        k = int(d * SR)
        x[k:] += noise(n - k) * env_exp(n - k, 0.012)
    tail = noise(n) * env_exp(n, 0.11, attack=0.02) * 0.6
    x += np.roll(tail, int(0.02 * SR))
    return filt(filt(x, "bp", 1500, 0.9), "hp", 600) * 0.9


def snare(level=1.0, tau=0.13):
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    tone = sine(185 + 40 * np.exp(-t / 0.02), n) * np.exp(-t / 0.07) * 0.6
    nz = filt(noise(n), "bp", 3200, 0.6) * env_exp(n, tau)
    return (tone + nz) * level


def hat(open_=False, level=1.0):
    n = int((0.25 if open_ else 0.06) * SR)
    x = filt(filt(noise(n), "hp", 7600), "hp", 7600) * env_exp(n, 0.09 if open_ else 0.018)
    return x * level


def crash():
    n = int(2.2 * SR)
    x = filt(noise(n), "hp", 4200) * env_exp(n, 0.65, attack=0.004)
    return x * 0.8


def pluck(m_list, dur=0.32, cutoff=(4200, 520), detune=8, level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for m in m_list:
        for c in (-detune, detune):
            x += saw(midi(m), n, c, phase=(m * 0.137) % 1)
    fc = cutoff[1] + (cutoff[0] - cutoff[1]) * np.exp(-t / 0.07)
    y = sweep(x, "lp", fc, q=1.1)
    y *= env_exp(n, dur * 0.45, attack=0.003)
    return y / (2 * len(m_list)) * level


def pad(m_list, dur, cut=(380, 1500), level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for i, m in enumerate(m_list):
        for c in (-11, 0, 11):
            x += saw(midi(m), n, c, phase=(i * 0.31 + c * 0.01) % 1)
    fc = cut[0] + (cut[1] - cut[0]) * (0.5 - 0.5 * np.cos(np.pi * np.clip(t / dur, 0, 1)))
    y = sweep(x, "lp", fc, q=0.9)
    a = np.clip(t / 0.25, 0, 1) * np.clip((dur - t) / 0.3, 0, 1)
    return y * a / (3 * len(m_list)) * level


def bass_note(m, dur, level=1.0, cut=900):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = saw(midi(m), n) * 0.7 + sine(midi(m - 12), n) * 0.9
    y = sweep(x, "lp", cut * (0.35 + 0.65 * np.exp(-t / 0.06)), q=1.2)
    return np.tanh(1.4 * y * env_exp(n, dur * 0.9, attack=0.004)) * level


def bell(m, dur=1.6, level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    mod = sine(midi(m) * 3.5, n) * 2.2 * np.exp(-t / 0.25)
    car = np.sin(2 * np.pi * midi(m) * t + mod)
    return car * env_exp(n, 0.55, attack=0.002) * level


# ======================================================================== SFX (synthesized)
def boop(f0=330, level=1.0):
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    x = sine(f0 * (0.55 + 0.45 * np.exp(-t / 0.03)), n) * env_exp(n, 0.07, attack=0.001)
    return np.tanh(2.0 * x) * level


def bloop(f_lo=110, f_hi=420, dur=0.22, level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f_lo + (f_hi - f_lo) * (1 - np.exp(-t / 0.025))
    x = sine(f * (1 + 0.04 * np.sin(2 * np.pi * 28 * t)), n) * env_exp(n, dur * 0.35, attack=0.003)
    return x * level


def zip_up(dur=0.18, f=(1800, 9000), level=1.0):
    n = int(dur * SR)
    fc = np.geomspace(f[0], f[1], n)
    return sweep(noise(n), "bp", fc, q=4) * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.7 * level


def boing(f0=290, dur=0.55, level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.12 * np.exp(-t / 0.18) * np.sin(2 * np.pi * (9 + 12 * t) * t)
    f = f0 * vib * (1 - 0.25 * t / dur)
    x = sine(f, n) * env_exp(n, 0.2, attack=0.002) + 0.3 * saw(f, n) * env_exp(n, 0.08)
    return filt(x, "lp", 3000) * level


def riser(dur, f=(250, 6000), level=1.0, tone=None):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fc = np.geomspace(f[0], f[1], n)
    x = sweep(noise(n), "bp", fc, q=1.6)
    x *= (t / dur) ** 2.2
    if tone:
        x += sine(np.geomspace(midi(tone[0]), midi(tone[1]), n), n) * (t / dur) ** 2 * 0.35
    return x * level


def whistle_fall(dur=0.38, f=(2300, 650), level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fr = f[0] * (f[1] / f[0]) ** (t / dur)
    x = sine(fr * (1 + 0.006 * np.sin(2 * np.pi * 7 * t)), n) * np.sin(np.pi * t / dur) ** 0.6
    return x * level


def sub_drop(dur=1.3, f=(72, 27), level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fr = f[0] * (f[1] / f[0]) ** (t / dur)
    return np.tanh(1.3 * sine(fr, n) * env_exp(n, 0.55, attack=0.003)) * level


def thud(f0=95, level=1.0):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    x = sine(f0 * (0.45 + 0.55 * np.exp(-t / 0.04)), n) * env_exp(n, 0.16, attack=0.001)
    x += filt(noise(n), "lp", 900) * env_exp(n, 0.03) * 0.5
    return np.tanh(1.8 * x) * level


def swirl(dur, level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fc = 900 * 2 ** (1.6 * np.sin(2 * np.pi * 1.1 * t))
    x = sweep(noise(n), "bp", fc, q=2.5) * np.sin(np.pi * t / dur) ** 0.8
    pan = np.sin(2 * np.pi * 1.1 * t)
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2) * level


def magnet(dur, level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 180 * (4.6 ** (t / dur))
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * (10 + 22 * t / dur) * t)
    return sine(f, n) * trem * (t / dur) ** 1.5 * level


def tick(f=4200, level=1.0):
    n = int(0.03 * SR)
    return sine(f, n) * env_exp(n, 0.006, attack=0.0005) * level


def reverse(x):
    return x[::-1].copy()


# ======================================================================== buses
drums, bass, music, fx, sfx = stereo(), stereo(), stereo(), stereo(), stereo()
kicks = []                                         # sidechain trigger times


def K(t, level=1.0, deep=False):
    kicks.append(t)
    place(drums, kick(level, deep), t, 0.95)


# ---------------------------------------------------------------- drums
for k in (1, 2, 3, 5, 6):                          # four-on-the-floor bars
    for i in range(4):
        K(bar(k) + i * B)
    for i in (1, 3):
        place(drums, clap(), bar(k) + i * B, 0.55, pan=0.05)
    for i in range(4):
        place(drums, hat(True, 0.32), bar(k) + i * B + B / 2, 1.0, pan=0.25)
    for i in range(16):
        if i % 2 == 1:
            place(drums, hat(False, 0.22 + 0.06 * (i % 4 == 3)), bar(k) + i * B / 4, 1.0, pan=-0.3)
# bar 4: half-time, heavy (the ink world)
K(bar(4), 1.15, deep=True)
K(bar(4) + 2 * B, 1.05, deep=True)
place(drums, snare(1.0, 0.18), bar(4) + 1 * B, 0.55)
place(drums, snare(1.0, 0.18), bar(4) + 3 * B, 0.55)
place(drums, hat(True, 0.3), bar(4) + 1.5 * B, 1.0, pan=0.3)
place(drums, hat(True, 0.3), bar(4) + 2.5 * B, 1.0, pan=-0.3)
# bar 3 → 4 fill (16ths), bar 6 → 7 roll (16ths then 32nds, crescendo)
for i, tt in enumerate(np.arange(bar(4) - 0.25, bar(4), B / 4)):
    place(drums, snare(0.35 + 0.15 * i, 0.08), tt, 0.5)
roll = list(np.arange(bar(7) - 0.5, bar(7) - 0.25, B / 4)) + list(np.arange(bar(7) - 0.25, bar(7), B / 8))
for i, tt in enumerate(roll):
    place(drums, snare(0.18 + 0.05 * i, 0.06), tt, 0.5, pan=0.1 * ((i % 2) * 2 - 1))
# bar 7: the final hit, then silence
K(bar(7), 1.2, deep=True)
place(drums, crash(), bar(7), 0.42, pan=0.15)
place(drums, crash(), bar(7) + 0.012, 0.36, pan=-0.2)

# ---------------------------------------------------------------- harmony (one chord per bar)
CH = {1: [50, 53, 57, 60, 64],              # Dm9
      2: [46, 50, 53, 57, 60],              # Bbmaj9
      3: [43, 46, 50, 53, 57],              # Gm9
      4: [38, 45, 50, 53, 57, 60],          # Dm9, low and wide
      5: [46, 50, 53, 57, 64],              # Bbmaj7#11
      6: [45, 49, 52, 55, 58],              # A7b9
      7: [50, 54, 57, 64, 69, 74]}          # D major add9 (the lift)
ROOT_BASS = {1: 38, 2: 34, 3: 31, 4: 26, 5: 34, 6: 33, 7: 38}
for k in (1, 2, 3, 6):                       # offbeat house stabs + offbeat bass
    for i in range(4):
        place(music, pluck([m + 12 for m in CH[k]], 0.3, level=3.0), bar(k) + i * B + B / 2, 1.0)
        place(bass, bass_note(ROOT_BASS[k] + 12, 0.24), bar(k) + i * B + B / 2, 0.9)
for k, lv in ((2, 1.2), (3, 1.2), (6, 0.8)):
    place(music, pad(CH[k], 2.0, level=lv), bar(k), 1.0)
place(music, pad(CH[4], 2.1, cut=(220, 1900), level=1.6), bar(4), 1.0)
place(bass, bass_note(ROOT_BASS[4] + 12, 1.9, cut=420), bar(4), 0.9)
# bar 5: 16th arpeggio shimmer across the particle burst (ping-pong panned)
arp = [58, 62, 65, 69, 76, 69, 65, 62]
for i in range(16):
    place(music, pluck([arp[i % 8] + 12], 0.18, cutoff=(6000, 900), detune=5, level=1.0), bar(5) + i * B / 4, 1.0,
          pan=0.5 * np.sin(i * 1.3))
    if i % 2 == 1:
        place(bass, bass_note(ROOT_BASS[5] + 12, 0.22), bar(5) + i * B / 4, 0.9)
place(music, pad(CH[5], 2.0, cut=(500, 2400), level=0.75), bar(5), 1.0)
# bar 7: the lift — D major add9 stab + bell motif, long tails
place(music, pluck(CH[7], 1.9, cutoff=(5200, 900), detune=10, level=1.3), bar(7), 1.0)
place(music, pad(CH[7], 2.0, cut=(900, 3200), level=0.75), bar(7), 1.0)
place(bass, bass_note(ROOT_BASS[7], 1.6, cut=600, level=1.1), bar(7), 1.0)
for i, (m, dt) in enumerate(((74, 0.0), (81, 0.25), (78, 0.5), (86, 0.75))):
    place(music, bell(m, 1.4, 0.32), bar(7) + dt, 1.0, pan=(-0.3, 0.3, -0.15, 0.15)[i])

# ---------------------------------------------------------------- SFX on the picture's events
V = CUES["visual"]
place(fx, riser(1.0, (180, 7000), 0.55, tone=(50, 62)), 0.0)
place(sfx, whistle_fall(0.38, (2300, 640), 0.22), V["c0"]["zoomEnd"])
for i, t in enumerate(V["c1"]["contacts"]):                            # rubber boops, a semitone down each hop
    place(sfx, boop(340 * 2 ** (-i / 12), 0.9 if i else 1.1), t, 1.0, pan=-0.45 + 0.3 * i)
place(sfx, boing(250, 0.5, 0.5), V["c1"]["launch"] + 0.02, 1.0, pan=0.3)
place(sfx, zip_up(0.42, (500, 4000), 0.45), V["c1"]["launch"] + 0.05, 1.0)
place(sfx, bloop(70, 260, 0.35, 1.0), V["c2"]["land"], 1.0)
for j, (lo, hi) in enumerate(((380, 900), (470, 1100), (560, 1320))):
    place(sfx, bloop(lo, hi, 0.16, 0.55), V["c2"]["split"] + 0.03 * j, 1.0, pan=(-0.5, 0.5, 0.0)[j])
place(sfx, bloop(130, 300, 0.25, 0.7), V["c2"]["pulse"], 1.0)
place(sfx, reverse(bloop(120, 520, 0.35, 0.6)), V["c2"]["merge"], 1.0)
place(sfx, zip_up(0.15, (1600, 9000), 0.5), V["c2"]["stretch"], 1.0)
key = load("key-press.mp3")
for i in range(7):                                                       # "Timing." — one key per glyph, on 32nds
    place(sfx, resample(key, 2 ** (((i * 5) % 7 - 3) / 12)), V["c3"]["words"][0][0] + i * B / 8, 0.42,
          pan=-0.4 + 0.12 * i)
place(sfx, load("whoosh-short.mp3"), V["c3"]["words"][1][0] - 0.06, 0.5, pan=0.2)
imp1 = load("impact-bass-1.mp3")
place(sfx, imp1[: int(0.8 * SR)] * np.linspace(1, 0, int(0.8 * SR)), V["c3"]["words"][2][0], 0.7)
place(sfx, boing(300, 0.6, 0.55), V["c3"]["words"][3][0], 1.0, pan=-0.2)
place(fx, reverse(filt(noise(int(0.3 * SR)), "hp", 3000) * env_exp(int(0.3 * SR), 0.12)), V["c3"]["swallow"] - 0.05, 0.5)
# bar 4 (ink)
place(sfx, imp1, bar(4), 0.85)
place(fx, sub_drop(1.4, (74, 26), 0.9), bar(4), 1.0)
wc = load("whoosh-cinematic.mp3", stereo_out=True)
place(fx, wc[int(0.4 * SR): int(1.6 * SR)] * np.linspace(1, 0, int(1.2 * SR))[:, None], bar(4), 0.45)
for i, t in enumerate(V["c4"]["contacts"]):
    place(sfx, thud(92 - 8 * i, 0.95), t, 1.0)
    click = load("click-soft.mp3")
    for j in range(5):                                                   # the cube floor rattling outward
        place(sfx, resample(click, 0.8 + 0.12 * j), t + 0.03 + 0.045 * j, 0.16 * (1 - j / 6), pan=(-1) ** j * 0.6)
imp2 = load("impact-bass-2.mp3")
place(fx, reverse(imp2[: int(0.5 * SR)]), V["c4"]["implode"] - 0.25, 0.5)
# bar 5 (particles)
place(sfx, imp2, V["c5"]["burst"], 0.7)
place(sfx, load("sparkle.mp3", stereo_out=True), V["c5"]["burst"], 0.55)
place(fx, filt(noise(int(0.7 * SR)), "bp", 2500, 0.7) * env_exp(int(0.7 * SR), 0.18), V["c5"]["burst"], 0.35)
place(fx, swirl(1.0, 0.32), V["c5"]["burst"] + 0.2)
place(fx, magnet(0.65, 0.2), V["c5"]["assemble"])
place(sfx, load("click.mp3"), V["c5"]["lock"], 0.6)
# bar 6 (data)
pop = load("pop.mp3")
for i, t in enumerate(V["c6"]["counts"][:3]):
    place(sfx, pop, t, 0.45, pan=-0.5 + 0.35 * i)
    for j in range(7):                                                   # counter ticks, decelerating with power3.out
        dt = 0.45 * (1 - (1 - (j + 1) / 8) ** (1 / 3)) * 0.9
        place(sfx, tick(4400 - 160 * j, 0.22 * (1 - j / 9)), t + dt, 1.0, pan=-0.5 + 0.35 * i)
place(sfx, imp2[: int(0.9 * SR)] * np.linspace(1, 0, int(0.9 * SR)), V["c6"]["counts"][3], 0.55)
place(sfx, snare(1.0, 0.1), V["c6"]["counts"][3], 0.5)
place(fx, riser(0.5, (400, 9000), 0.5), V["c6"]["drop"] - 0.25)
# bar 7 (identity)
place(sfx, imp1, bar(7), 0.75)
place(sfx, load("chime.mp3", stereo_out=True), bar(7) + 0.02, 0.35)
place(sfx, bloop(900, 1500, 0.12, 0.45), V["c7"]["period"], 1.0, pan=0.25)
place(sfx, boop(240, 0.5), V["c7"]["period"], 1.0, pan=0.25)
air = reverse(filt(noise(int(0.8 * SR)), "hp", 2000) * env_exp(int(0.8 * SR), 0.3))
place(fx, air, V["c7"]["pullback"][0], 0.12)

# ======================================================================== mix
t_axis = np.arange(N) / SR
duck = np.ones(N)
for tk in kicks:                                    # analytic sidechain: fast dip, 170 ms release
    k = int(tk * SR)
    seg = t_axis[k:] - tk
    duck[k:] = np.minimum(duck[k:], 1 - 0.72 * np.exp(-seg / 0.17) * np.clip(seg / 0.004, 0, 1))
bass *= duck[:, None]
music *= (0.35 + 0.65 * duck)[:, None]


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


# reverb: synthetic stereo IR, 1.9 s, filtered decaying noise with a 14 ms pre-delay
nir = int(1.9 * SR)
ir = np.stack([noise(nir), noise(nir)], 1) * np.exp(-np.arange(nir) / SR / 0.42)[:, None]
ir = filt(ir, "lp", 5200)
ir[: int(0.014 * SR)] = 0
ir /= np.sqrt(np.sum(ir ** 2))
send = music * 0.55 + sfx * 0.22 + fx * 0.3 + drums * 0.08
wet = np.stack([ss.fftconvolve(send[:, c], ir[:, c])[:N] for c in range(2)], 1) * 0.45
# ping-pong delay (3/16 note) on music + sfx
delay = stereo()
d = int(0.1875 * SR)
src_d = music * 0.3 + sfx * 0.12
for i in range(1, 5):
    g = 0.4 ** i
    sh = np.zeros_like(src_d)
    sh[i * d:] = src_d[: N - i * d]
    delay[:, i % 2] += sh[:, 0] * g + sh[:, 1] * g
GAINS = {"drums": 0.85, "bass": 0.75, "music": 1.0, "fx": 0.7, "sfx": 0.72}
mix = drums * GAINS["drums"] + bass * GAINS["bass"] + music * GAINS["music"] + fx * GAINS["fx"] + sfx * GAINS["sfx"]
mix += wet + delay * 0.5
mix = filt(mix, "hp", 28)
# tail: the music stops on the final hit; tails fade to silence by 15.0 s
fade = np.ones(N)
f0 = int(14.55 * SR)
fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2
mix *= fade[:, None]
mix[: int(0.003 * SR)] *= np.linspace(0, 1, int(0.003 * SR))[:, None]
for name, x in (("drums", drums), ("bass", bass), ("music", music), ("fx", fx), ("sfx", sfx)):
    write(f"out/audio/stems/{name}.wav", x * GAINS[name])
pk = np.abs(mix).max()
mix = np.tanh(1.2 * mix / pk) / np.tanh(1.2)       # gentle glue saturation
write("out/audio/premaster.wav", mix * 0.7, "pcm_f32le")

# ======================================================================== master: linear gain → 4× oversampled limiter, AAC-checked
TARGET = -14.0
pre_i, pre_tp = lufs_tp("out/audio/premaster.wav")
gain_db, limit = TARGET - pre_i, 10 ** (-1.9 / 20)
for _ in range(6):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "out/audio/premaster.wav", "-af",
                    f"volume={gain_db:.3f}dB,aresample=192000,alimiter=limit={limit:.4f}:attack=0.5:release=40:level=false:asc=1,"
                    f"aresample={SR}", "-c:a", "pcm_s24le", "assets/audio/soundtrack.wav"], check=True)
    I, TP = lufs_tp("assets/audio/soundtrack.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "assets/audio/soundtrack.wav", "-c:a", "aac", "-b:a", "320k",
                    "out/audio/soundtrack-aac.m4a"], check=True)
    I_aac, TP_aac = lufs_tp("out/audio/soundtrack-aac.m4a")
    if abs(I - TARGET) <= 0.15 and TP < -1.0 and TP_aac <= -1.2:
        break
    gain_db += TARGET - I
    if TP_aac > -1.2:
        limit *= 10 ** ((-1.3 - TP_aac) / 20)

# waveform peaks for the timeline panel (750 bins over 15 s)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "assets/audio/soundtrack.wav", "-ac", "2", "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
mono = np.frombuffer(raw, np.float32).reshape(-1, 2).mean(1)
bins = 750
peaks = np.array([np.abs(c).max() for c in np.array_split(mono, bins)])
peaks = [round(float(v), 3) for v in peaks / peaks.max()]        # display-normalised: loudest bin = 1
json.dump({"bins": bins, "duration": DUR, "peaks": peaks}, open("src/waveform.json", "w"))
report = {"integrated_lufs": I, "true_peak_dbtp": TP, "aac": {"lufs": I_aac, "true_peak_dbtp": TP_aac},
          "pre_master": {"lufs": pre_i, "true_peak": pre_tp}, "gain_db": round(gain_db, 2),
          "limit_dbfs": round(20 * np.log10(limit), 2), "kicks": len(kicks),
          "stems_rms_db": {n: round(rms_db(x), 1) for n, x in (("drums", drums), ("bass", bass), ("music", music),
                                                                 ("fx", fx), ("sfx", sfx))},
          "pass": bool(abs(I - TARGET) <= 0.5 and TP < -1.0 and TP_aac < -1.0)}
json.dump(report, open("out/audio/report.json", "w"), indent=1)
print(f"soundtrack: {I:.1f} LUFS, TP {TP:.1f} dBTP; AAC {I_aac:.1f} LUFS / {TP_aac:.1f} dBTP "
      f"({'PASS' if report['pass'] else 'FAIL'}) · {len(kicks)} kicks · stems {report['stems_rms_db']}")
