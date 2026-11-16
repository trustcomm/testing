"""Rebuild the music bed so it stays joyful for the whole film:
1) take the track's full section (≈24–46 s), loop it on bar lines, end on the track's own outro;
2) speed up ~12% without changing pitch (rubberband); 3) brighten slightly;
4) add a light hand-clap (2 and 4) + shaker (8ths) groove locked to the stretched beat grid, from the garden scene on.
usage: python scripts/music_bed.py  → assets/music/music_bed_joyful.wav (46.5 s, 48 kHz stereo)"""
import subprocess, numpy as np, soundfile as sf, librosa
SR, OUT, TEMPO = 48000, 46.5, 1.12
def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
x = load('assets/music/music_bed.mp3'); mono = x.mean(1)
tempo, bt = librosa.beat.beat_track(y=librosa.resample(mono, orig_sr=SR, target_sr=22050), sr=22050, units='time')
bt = np.asarray(bt); i1 = int(np.argmin(abs(bt - 24.0))); k = round((46.0 - bt[i1]) / (4 * np.median(np.diff(bt))))
i2 = i1 + 4 * k; L1, L2 = bt[i1], bt[i2]; bar = 4 * np.median(np.diff(bt))
print(f'tempo {float(np.atleast_1d(tempo)[0]):.1f} BPM, loop {L1:.2f}→{L2:.2f} s ({k} bars), bar {bar:.2f} s')
def seg(a, b): return x[int(a * SR):int(b * SR)]
# source needed before stretching: OUT*TEMPO; outro (from L2 to the track end) closes it
need = OUT * TEMPO + 0.6; outro = seg(L2, len(x) / SR); parts = []; total = 0
while total + (L2 - L1) + outro.shape[0] / SR * 0.35 < need: parts.append(seg(L1, L2)); total += L2 - L1
rest = need - total - 3.0                                 # leave ~3 s (source) of the real outro at the end
nb = max(0, int(np.floor(rest / bar))); parts.append(seg(L1, L1 + nb * bar)); parts.append(outro)
def join(parts, xf=int(0.03 * SR)):
    out = parts[0]
    for p in parts[1:]:
        if len(p) < xf or len(out) < xf: out = np.concatenate([out, p]); continue
        r = np.linspace(0, 1, xf)[:, None]; out = np.concatenate([out[:-xf], out[-xf:] * (1 - r) + p[:xf] * r, p[xf:]])
    return out
src = join([p for p in parts if len(p)])
sf.write('cache/bed_src.wav', src, SR)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', 'cache/bed_src.wav', '-af',
    f'rubberband=tempo={TEMPO}:transients=crisp:pitchq=quality,highshelf=f=5500:g=2.5,equalizer=f=320:t=q:w=1:g=-1.5',
    '-ar', str(SR), 'cache/bed_fast.wav'], check=True)
y, _ = sf.read('cache/bed_fast.wav', dtype='float32'); y = y[:int(OUT * SR)]
if len(y) < int(OUT * SR): y = np.concatenate([y, np.zeros((int(OUT * SR) - len(y), 2), np.float32)])
# beat grid of the stretched bed
t2, b2 = librosa.beat.beat_track(y=librosa.resample(y.mean(1), orig_sr=SR, target_sr=22050), sr=22050, units='time')
b2 = np.asarray(b2); step = np.median(np.diff(b2)); print(f'stretched tempo {60 / step:.1f} BPM, {len(b2)} beats')
grid = np.arange(b2[0] % step, OUT, step)                # regular grid through the detected beats
rng = np.random.default_rng(3)
def clap():
    n = int(0.16 * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for d in (0, 0.009, 0.019):                           # three quick hand slaps = a real-sounding clap
        k0 = int(d * SR); e = np.exp(-(t[:n - k0]) / 0.012); s[k0:] += rng.standard_normal(n - k0) * e * (0.6 if d else 1)
    s += rng.standard_normal(n) * np.exp(-t / 0.06) * 0.25
    from scipy.signal import butter, sosfilt
    s = sosfilt(butter(2, [900, 6500], 'bandpass', fs=SR, output='sos'), s); return s / np.max(abs(s))
def shaker():
    n = int(0.07 * SR); t = np.arange(n) / SR; s = rng.standard_normal(n) * np.sin(np.pi * t / t[-1]) ** 2
    from scipy.signal import butter, sosfilt
    s = sosfilt(butter(2, 6000, 'highpass', fs=SR, output='sos'), s); return s / np.max(abs(s))
groove = np.zeros_like(y); start, fade_in = 3.9, 1.5
def put(sig, at, g, pan=0.0):
    i = int(at * SR); j = min(len(groove), i + len(sig)); 
    if i >= len(groove) or i < 0: return
    groove[i:j, 0] += sig[:j - i] * g * (1 - pan); groove[i:j, 1] += sig[:j - i] * g * (1 + pan)
for n, b in enumerate(grid):
    if b < start or b > OUT - 1.0: continue
    env = min(1.0, (b - start) / fade_in)
    if n % 2 == 1: put(clap(), b, 0.16 * env, pan=-0.12)
    put(shaker(), b + step / 2, 0.055 * env, pan=0.25)
    put(shaker(), b, 0.035 * env, pan=0.25)
y = y + groove
fo = int(2.0 * SR); y[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5; fi = int(0.25 * SR); y[:fi] *= np.linspace(0, 1, fi)[:, None]
y = y / max(1e-6, np.max(abs(y))) * 0.89
sf.write('assets/music/music_bed_joyful.wav', y, SR, subtype='PCM_24'); print('written', len(y) / SR, 's')
