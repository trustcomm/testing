#!/usr/bin/env python3
"""
SFX + music stem builder (Motion Quality Spec v2 audio).

Reads  src/reels/<reel>/sfx-events.json   (made by build-timeline.mjs)
       src/reels/<reel>/timeline.json
       public/reels/<reel>/vo.mp3          (optional; used for sidechain ducking)
       public/sfx/<type>.wav               (optional; YOUR sound replaces the synth one)
Writes public/reels/<reel>/sfx_stem.wav    (48 kHz stereo: SFX + ducked music bed)
       out/<reel>-preview-mix.wav          (VO + stem, for listening / loudness check)

Every sound has an IMPACT point. The event time is where the impact lands,
so whooshes/risers automatically start early (pre-roll) and peak on the cue.
Each impact sound is three layers: transient + body + tail. Pan is constant-power.

Usage: python3 scripts/make_sfx.py paste-leak [--no-music] [--music-gain -24]
"""
import json, os, subprocess, sys, argparse
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
ap = argparse.ArgumentParser()
ap.add_argument('reel', nargs='?', default='paste-leak')
ap.add_argument('--no-music', action='store_true')
ap.add_argument('--music-gain', type=float, default=-26.0, help='music bed level in dB (before ducking)')
ap.add_argument('--sfx-gain', type=float, default=-9.0, help='SFX bus level in dB')
args = ap.parse_args()

R = args.reel
src = f'src/reels/{R}'
pub = f'public/reels/{R}'
os.makedirs(pub, exist_ok=True); os.makedirs('out', exist_ok=True)
ev = json.load(open(f'{src}/sfx-events.json'))
tl = json.load(open(f'{src}/timeline.json'))
DUR = ev['duration']
N = int(DUR * SR) + SR
rng = np.random.default_rng(7)

db = lambda d: 10 ** (d / 20)
t_ = lambda s: np.arange(int(s * SR)) / SR

def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)
def env(n, a, d, curve=4.0):
    """attack seconds, then exponential decay over d seconds."""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), np.exp(-(t - a) * curve / max(d, 1e-4)))
    return e
def noise(s):
    return rng.standard_normal(int(s * SR))
def sine(f, s, phase=0):
    t = t_(s)
    if callable(f):
        ph = 2 * np.pi * np.cumsum(f(t)) / SR
        return np.sin(ph + phase)
    return np.sin(2 * np.pi * f * t + phase)
def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak

# ── Sound designs. Each returns (mono signal, impact_seconds_from_start) ──
def s_hit():
    # transient: click+noise burst · body: pitched-down sine thump · tail: filtered noise room
    tr = hp(noise(0.03), 2000) * env(int(0.03 * SR), 0.0005, 0.02, 6)
    body = sine(lambda t: 55 + 90 * np.exp(-t * 18), 0.7) * env(int(0.7 * SR), 0.002, 0.5, 5)
    tail = lp(noise(1.4), 900) * env(int(1.4 * SR), 0.01, 1.2, 4) * 0.25
    out = np.zeros(int(1.4 * SR)); out[:len(tr)] += tr * 0.6; out[:len(body)] += body; out += tail
    return norm(out), 0.0
def s_sub():
    s = sine(lambda t: 38 + 30 * np.exp(-t * 4), 1.6) * env(int(1.6 * SR), 0.01, 1.4, 3.5)
    return norm(s, 0.85), 0.0
def s_whoosh():
    d = 0.9; n = int(d * SR); t = np.arange(n) / SR
    x = noise(d)
    # sweeping band: low→high→low, peak at 0.45s
    k = np.sin(np.pi * t / d)
    y = np.zeros(n); blocks = 30
    for b in range(blocks):
        a, z = b * n // blocks, (b + 1) * n // blocks
        c = 300 + 3500 * k[(a + z) // 2] ** 2
        y[a:z] = bp(x, c * 0.6, min(c * 1.6, 20000))[a:z]
    y *= k ** 2.2
    return norm(y, 0.8), 0.45
def s_swish():
    y, _ = s_whoosh(); y = y[::2]  # shorter, higher
    return norm(hp(y, 900), 0.7), 0.22
def s_riser():
    d = 2.2; t = t_(d)
    tone = sine(lambda t: 180 * 2 ** (t * 1.4), d) * 0.35
    nz = hp(noise(d), 1500) * (t / d) ** 2 * 0.6
    y = (tone + nz) * (t / d) ** 2.5
    y[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
    return norm(y, 0.7), d
def s_pop():
    body = sine(lambda t: 520 + 900 * np.exp(-t * 60), 0.16) * env(int(0.16 * SR), 0.001, 0.1, 6)
    tr = hp(noise(0.01), 4000) * 0.4
    body[:len(tr)] += tr
    return norm(body, 0.7), 0.0
def s_tick():
    y = bp(noise(0.03), 2500, 7000) * env(int(0.03 * SR), 0.0003, 0.015, 7)
    y += sine(2400, 0.03) * env(int(0.03 * SR), 0.0003, 0.012, 7) * 0.5
    return norm(y, 0.6), 0.0
def s_type():
    out = np.zeros(int(1.0 * SR))
    for i in range(9):
        k, _ = s_tick(); p = int((i * 0.1 + rng.uniform(0, 0.03)) * SR)
        out[p:p + len(k)] += k * rng.uniform(0.5, 1.0)
    return norm(lp(out, 6000), 0.5), 0.0
def s_paste():
    # soft "thunk + swallow": low click + short down-sweep
    a = sine(lambda t: 900 * np.exp(-t * 14) + 120, 0.25) * env(int(0.25 * SR), 0.001, 0.2, 5)
    return norm(a, 0.7), 0.0
def s_alert():
    # two-tone soft alarm (not a siren): 880 → 660, glassy
    a = sine(880, 0.16) + 0.3 * sine(1760, 0.16)
    b = sine(660, 0.26) + 0.3 * sine(1320, 0.26)
    y = np.concatenate([a * env(len(a), 0.004, 0.14, 3), b * env(len(b), 0.004, 0.24, 4)])
    return norm(y, 0.45), 0.0
def s_glitch():
    d = 0.35; n = int(d * SR); y = np.zeros(n)
    for _ in range(12):
        p = rng.integers(0, n - 2000); L = rng.integers(200, 2000)
        y[p:p + L] += np.sign(np.sin(np.arange(L) * rng.uniform(0.05, 0.6))) * rng.uniform(0.2, 0.8)
    return norm(bp(y, 400, 8000) * env(n, 0.001, 0.3, 3), 0.4), 0.0
def s_paper():
    y = bp(noise(0.35), 1800, 9000) * env(int(0.35 * SR), 0.03, 0.3, 4)
    y *= 0.6 + 0.4 * np.abs(np.sin(np.arange(len(y)) / SR * 70))
    return norm(y, 0.5), 0.05
def s_paper2():
    y, i = s_paper(); return np.concatenate([np.zeros(int(0.12 * SR)), y * 0.8]), 0.17
def s_chime():
    d = 1.6; y = np.zeros(int(d * SR))
    for f, a, o in [(1046.5, 1, 0), (1318.5, 0.7, 0.06), (1568, 0.55, 0.12)]:
        s = (sine(f, d) + 0.25 * sine(f * 2.01, d)) * env(int(d * SR), 0.003, 1.3, 4) * a
        p = int(o * SR); y[p:] += s[:len(y) - p]
    return norm(y, 0.45), 0.0
def s_check():
    y = sine(lambda t: 1200 + 600 * (t > 0.05), 0.14) * env(int(0.14 * SR), 0.002, 0.12, 5)
    return norm(y, 0.45), 0.0
def s_toggle():
    a, _ = s_tick(); b, _ = s_tick()
    y = np.zeros(int(0.12 * SR)); y[:len(a)] += a; p = int(0.06 * SR); y[p:p + len(b)] += b * 0.7
    return norm(lp(y, 5000), 0.6), 0.0

SYN = {k[2:]: v for k, v in globals().items() if k.startswith('s_') and callable(v)}
GAIN = {'sub': -2, 'hit': 0, 'whoosh': -4, 'swish': -6, 'riser': -5, 'pop': -7, 'tick': -10,
        'type': -12, 'paste': -6, 'alert': -9, 'glitch': -10, 'paper': -9, 'paper2': -10,
        'chime': -8, 'check': -8, 'toggle': -6}

def load_user(t):
    p = f'public/sfx/{t}.wav'
    if not os.path.exists(p): return None
    sr, x = wavfile.read(p)
    x = x.astype(np.float32); x = x.mean(axis=1) if x.ndim > 1 else x
    if sr != SR: x = np.interp(np.arange(0, len(x), sr / SR), np.arange(len(x)), x)
    impact = int(np.argmax(np.abs(x))) / SR  # loudest point = impact
    return norm(x), impact

L = np.zeros(N); Rr = np.zeros(N)
cache = {}
for e in ev['events']:
    t = e['type']
    if t not in cache:
        cache[t] = load_user(t) or (SYN[t]() if t in SYN else None)
        if cache[t] is None: print(f'⚠️  unknown sfx "{t}" (add public/sfx/{t}.wav)'); continue
    sig, impact = cache[t]
    if sig is None: continue
    start = int((e['t'] - impact) * SR)
    if start < 0: sig = sig[-start:]; start = 0
    sig = sig[:max(0, N - start)] * db(GAIN.get(t, -8)) * e.get('gain', 1)
    pan = float(np.clip(e.get('pan', 0), -1, 1))
    th = (pan + 1) * np.pi / 4
    L[start:start + len(sig)] += sig * np.cos(th)
    Rr[start:start + len(sig)] += sig * np.sin(th)

sfx = np.stack([L, Rr], 1) * db(args.sfx_gain)

# ── VO envelope for sidechain ducking ──
vo = None
vo_path = f'{pub}/vo.mp3'
if os.path.exists(vo_path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', vo_path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    vo = np.frombuffer(raw, np.float32)[:N]
    vo = np.pad(vo, (0, N - len(vo)))
    venv = lp(np.abs(vo), 6)
    venv = np.clip(venv / (np.percentile(venv, 95) or 1), 0, 1)
else:
    venv = np.zeros(N)
    for s in tl['segments']:
        venv[int(s['start'] * SR):int(s['end'] * SR)] = 1
    venv = lp(venv, 3)
duck = 1 - 0.6 * np.clip(venv, 0, 1)  # about -8 dB under speech

# ── Music bed: dark, slow pad (A minor → F → C → G), keynote-style pulse. Original, royalty-free. ──
if not args.no_music:
    t = np.arange(N) / SR
    chords = [[110, 130.81, 164.81], [87.31, 110, 130.81], [65.41, 98, 130.81], [98, 123.47, 146.83]]
    bar = 4.0
    pad = np.zeros(N)
    for i, ch in enumerate(chords * int(DUR // (bar * 4) + 2)):
        a, z = int(i * bar * SR), int((i + 1) * bar * SR + SR)
        if a >= N: break
        z = min(z, N); tt = t[a:z] - t[a]
        seg = sum(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.003 * tt) for f in ch)
        fade = np.minimum(1, tt / 1.0) * np.minimum(1, (tt[-1] - tt) / 1.0 + 1e-9)
        pad[a:z] += seg * fade
    pad = lp(pad, 900)
    pulse = np.sin(2 * np.pi * 55 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * t * (100 / 60) / 2))) * 0.15
    pulse = lp(pulse, 200)
    music = norm(pad + pulse, 1.0)
    # arc: tense first half, opens up after the "safe" turn
    s9 = next((s['start'] for s in tl['segments'] if s['id'] == 'S9'), DUR * 0.6)
    bright = np.clip((t - s9) / 2, 0, 1)
    music = music * (0.8 + 0.2 * bright) + hp(music, 400) * 0.3 * bright
    fade_io = np.minimum(1, t / 0.6) * np.clip((DUR - t) / 1.5, 0, 1)
    music *= duck * fade_io * db(args.music_gain)
    sfx += np.stack([music * 0.98, music], 1)

peak = np.max(np.abs(sfx))
if peak > 0.89: sfx *= 0.89 / peak  # never clip
wavfile.write(f'{pub}/sfx_stem.wav', SR, (sfx * 32767).astype(np.int16))
print(f'✓ {pub}/sfx_stem.wav  ({len(ev["events"])} events, {DUR:.1f}s, ducking from {"VO" if vo is not None else "estimated speech"})')

if vo is not None:
    mix = sfx + np.stack([vo, vo], 1) * 0.9
    mix *= 0.95 / max(np.max(np.abs(mix)), 1e-6)
    wavfile.write(f'out/{R}-preview-mix.wav', SR, (mix * 32767).astype(np.int16))
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', f'out/{R}-preview-mix.wav', '-af', 'ebur128', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    li = [l for l in r.splitlines() if l.strip().startswith('I:')]
    print('Integrated loudness of preview mix:', li[-1].strip() if li else '?', '(target ≈ -14 LUFS for Reels; use ffmpeg loudnorm on the final MP4 if far off)')
