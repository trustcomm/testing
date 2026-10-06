#!/usr/bin/env python3
"""Stage A (STUDY): frame-by-frame measurements of a reference film.

Usage: python3 -I scripts/study.py <video> <out-dir> [--bpm 129] [--phase 0.0]

Writes <out-dir>/measure.json and prints a summary:
  - per-frame luma difference (64-px-wide grey) and candidate cuts (adaptive threshold)
  - per-frame "motion" measured at a common 1/30 s spacing, so 30 and 60 fps films compare
  - stillness: share of 1/30 s steps whose motion is below 0.5 and 1.0 grey levels
  - audio: tempo estimate (onset autocorrelation), onsets, RMS
  - with --bpm: offset of every candidate cut from the nearest beat / half beat
Candidates are verified by eye from frame strips (see strips.sh); the verified
shot list is kept in STYLE.md, not here.
"""
import json, subprocess, sys
import numpy as np

args = sys.argv[1:]
def opt(name, default):
    if f"--{name}" in args:
        return float(args[args.index(f"--{name}") + 1])
    return default
pos = [a for i, a in enumerate(args) if not a.startswith("--") and not (i and args[i - 1].startswith("--"))]
video, out = pos[0], pos[1]
BPM, PHASE = opt("bpm", 0), opt("phase", 0.0)

def probe(entries, stream="v:0"):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", stream, "-show_entries", entries,
                        "-of", "default=nw=1:nk=1", video], capture_output=True, text=True, check=True)
    return r.stdout.split()

w, h, rate = probe("stream=width,height,r_frame_rate")
w, h = int(w), int(h)
num, den = map(int, rate.split("/"))
fps = num / den
# analysis size keeps the aspect: 64 px on the short side
sw, sh = (64, round(64 * h / w)) if w >= h else (round(64 * w / h), 64)
sw += sw % 2; sh += sh % 2
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={sw}:{sh}:flags=area,format=gray",
                      "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, sh, sw).astype(np.float32)
n = len(F)
lum = F.mean(axis=(1, 2))
d = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2))           # d[i] = change into frame i+1
# per-region differences (thirds of the long axis) catch cuts inside one panel of a split layout
if h > w:
    bands = np.array_split(np.arange(sh), 3)
    dreg = np.stack([np.abs(np.diff(F[:, b, :], axis=0)).mean(axis=(1, 2)) for b in bands], 1)
else:
    bands = np.array_split(np.arange(sw), 3)
    dreg = np.stack([np.abs(np.diff(F[:, :, b], axis=0)).mean(axis=(1, 2)) for b in bands], 1)
dmax = np.maximum(d, dreg.max(1))

# adaptive cut candidates: a spike well above its neighbourhood
cands = []
for i in range(len(dmax)):
    lo, hi = max(0, i - 8), min(len(dmax), i + 9)
    nb = np.concatenate([dmax[lo:i], dmax[i + 1:hi]])
    base = np.median(nb) if len(nb) else 0
    if dmax[i] > 6 and dmax[i] > 3.0 * base + 2 and dmax[i] == dmax[max(0, i - 2):i + 3].max():
        cands.append({"frame": i + 1, "t": round((i + 1) / fps, 3), "diff": round(float(dmax[i]), 1),
                      "base": round(float(base), 1)})

# motion at a common 1/30 s step
step = max(1, round(fps / 30))
mot = np.abs(F[step::step] - F[:-step:step]).mean(axis=(1, 2)) if step > 1 else d
still05 = float((mot < 0.5).mean()); still10 = float((mot < 1.0).mean())

# near-still, same rule as the shared engine (films/godevlevel-launch/engine/scripts/rhythm.mjs):
# at 0.25x, a frame is near-still when < 0.3% of pixels change by > 8 levels in any channel.
# Measured frame-to-frame at the native rate and at a common 1/30 s step.
qw, qh = w // 4, h // 4
proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={qw}:{qh}:flags=area",
                         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
fb = qw * qh * 3
hist, ns_native, ns_30 = [], [], []
while True:
    buf = proc.stdout.read(fb)
    if len(buf) < fb:
        break
    cur = np.frombuffer(buf, np.uint8).reshape(qh, qw, 3).astype(np.int16)
    if hist:
        ns_native.append(bool((np.abs(cur - hist[-1]).max(2) > 8).mean() < 0.003))
    if len(hist) >= step:
        ns_30.append(bool((np.abs(cur - hist[-step]).max(2) > 8).mean() < 0.003))
    hist.append(cur)
    if len(hist) > step:
        hist.pop(0)
proc.wait()
near_still_native = float(np.mean(ns_native)); near_still_30 = float(np.mean(ns_30))

# audio
pcm =subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-ac", "1", "-ar", "22050", "-f", "s16le", "-"],
                     capture_output=True).stdout
audio = {}
if pcm:
    x = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    SR, HOP = 22050, 256
    nfr = len(x) // HOP
    fr = x[:nfr * HOP].reshape(nfr, HOP)
    rms = np.sqrt((fr ** 2).mean(1) + 1e-12)
    # spectral-flux onset envelope
    win = 1024
    spec = []
    for k in range(0, len(x) - win, HOP):
        spec.append(np.abs(np.fft.rfft(x[k:k + win] * np.hanning(win))))
    S = np.log1p(np.array(spec) * 10)
    flux = np.maximum(0, np.diff(S, axis=0)).sum(1)
    flux = (flux - flux.mean()) / (flux.std() + 1e-9)
    env_t = (np.arange(len(flux)) + 1) * HOP / SR
    peaks = [i for i in range(1, len(flux) - 1) if flux[i] > 1.5 and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]]
    # tempo: autocorrelation of the flux envelope between 70 and 180 BPM
    ac = np.correlate(flux, flux, "full")[len(flux) - 1:]
    lags = np.arange(len(ac)) * HOP / SR
    rng = (lags > 60 / 180) & (lags < 60 / 70)
    best = np.argmax(ac * rng)
    tempo = 60 / lags[best]
    audio = {"tempo_bpm_est": round(float(tempo), 2),
             "tempo_strength": round(float(ac[best] / ac[0]), 3),
             "onsets": [round(float(env_t[i]), 3) for i in peaks],
             "rms_db_0_25s": [round(float(20 * np.log10(rms[int(t * SR / HOP)] + 1e-9)), 1)
                              for t in np.arange(0, len(x) / SR - 0.05, 0.25)]}

res = {"video": video, "size": [w, h], "fps": fps, "frames": n, "duration": round(n / fps, 3),
       "luma_mean": round(float(lum.mean()), 1), "luma_every_0_5s": [round(float(lum[int(t * fps)])) for t in np.arange(0, n / fps, 0.5)],
       "motion_step_s": round(step / fps, 4), "motion_median": round(float(np.median(mot)), 2),
       "still_lt_0_5": round(still05, 3), "still_lt_1_0": round(still10, 3),
       "near_still_native": round(near_still_native, 3), "near_still_30": round(near_still_30, 3),
       "near_still_frames_native": ns_native,
       "cut_candidates": cands, "audio": audio,
       "diff": [round(float(v), 2) for v in dmax], "motion": [round(float(v), 2) for v in mot]}
if BPM:
    P = 60 / BPM
    off = lambda c, q: ((c - PHASE + q / 2) % q) - q / 2
    for c in cands:
        c["beat_ms"] = round(off(c["t"], P) * 1000); c["half_ms"] = round(off(c["t"], P / 2) * 1000)
import os
os.makedirs(out, exist_ok=True)
json.dump(res, open(os.path.join(out, "measure.json"), "w"))
print(f"{video}: {w}x{h} {fps:g} fps, {n} frames, {n / fps:.2f} s, mean luma {lum.mean():.0f}")
print(f"motion per 1/30 s: median {np.median(mot):.2f}; still <0.5: {still05:.1%}, <1.0: {still10:.1%}")
print(f"near-still (engine rule): {near_still_native:.1%} frame-to-frame, {near_still_30:.1%} at 1/30 s")
if audio:
    print(f"tempo est {audio['tempo_bpm_est']} BPM (strength {audio['tempo_strength']})")
print(f"{len(cands)} cut candidates:")
for c in cands:
    extra = f"  beat {c['beat_ms']:+d} ms  half {c['half_ms']:+d} ms" if BPM else ""
    print(f"  f{c['frame']:5d}  {c['t']:7.3f}s  diff {c['diff']:5.1f} (base {c['base']}){extra}")
