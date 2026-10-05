"""tempo.py <audio> [--json out.json]

Measure a music track's tempo, beat grid, downbeats and where it is busiest.
numpy/scipy only (no audio libraries), written for this engine.

1. Onset envelope: log-magnitude spectral flux (STFT 2048/512 @ 44.1 kHz), half-wave rectified.
2. Tempo: autocorrelation of the envelope over 70–180 BPM, weighted by a broad prior centred on
   120 BPM (to settle octave ambiguity), refined by parabolic interpolation, then by a fine comb search.
3. Beat phase: the offset whose beat comb collects the most onset energy.
4. Downbeats: of the 4 beat phases, the one with the most low-band (<150 Hz) onset energy (kick/bass).
5. Busyness: onset energy per beat, smoothed over a bar.
"""
import json
import subprocess
import sys

import numpy as np

SR = 44100
N_FFT = 2048
HOP = 512


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def stft_mag(x):
    win = np.hanning(N_FFT).astype(np.float32)
    n = 1 + max(0, (len(x) - N_FFT) // HOP)
    frames = np.lib.stride_tricks.as_strided(x, shape=(n, N_FFT), strides=(x.strides[0] * HOP, x.strides[0]))
    return np.abs(np.fft.rfft(frames * win, axis=1))


def flux(mag, lo_hz=None, hi_hz=None):
    f = np.fft.rfftfreq(N_FFT, 1 / SR)
    sel = np.ones_like(f, bool)
    if lo_hz is not None:
        sel &= f >= lo_hz
    if hi_hz is not None:
        sel &= f < hi_hz
    lm = np.log1p(100 * mag[:, sel])
    d = np.diff(lm, axis=0, prepend=lm[:1])
    env = np.maximum(d, 0).sum(axis=1)
    env -= np.convolve(env, np.ones(16) / 16, mode="same")  # remove slow trend
    return np.maximum(env, 0)


def comb_score(env, period, phase):
    idx = np.arange(phase, len(env) - 1, period)
    i0 = np.floor(idx).astype(int)
    u = idx - i0
    return float(((1 - u) * env[i0] + u * env[i0 + 1]).sum() / max(1, len(idx)))


def main():
    path = sys.argv[1]
    out = sys.argv[sys.argv.index("--json") + 1] if "--json" in sys.argv else None
    x = load(path)
    fps = SR / HOP
    mag = stft_mag(x)
    env = flux(mag)
    low = flux(mag, hi_hz=150)

    # Tempo by autocorrelation with a broad log-normal prior around 120 BPM.
    e = env - env.mean()
    ac = np.correlate(e, e, mode="full")[len(e) - 1 :]
    bpms = np.arange(70.0, 180.01, 0.25)
    lags = 60 * fps / bpms
    vals = np.interp(lags, np.arange(len(ac)), ac)
    prior = np.exp(-0.5 * (np.log2(bpms / 120) / 0.9) ** 2)
    score = vals * prior
    k = int(np.argmax(score))
    bpm = float(bpms[k])
    # Fine comb search ±2 BPM around the autocorrelation peak.
    best = (-1, bpm, 0.0)
    for b in np.arange(bpm - 2, bpm + 2.001, 0.02):
        period = 60 * fps / b
        for ph in np.linspace(0, period, 48, endpoint=False):
            s = comb_score(env, period, ph)
            if s > best[0]:
                best = (s, float(b), float(ph))
    _, bpm, phase = best
    period = 60 * fps / bpm
    # Envelope frame i covers samples [i*HOP, i*HOP + N_FFT); an onset registers about half a window early.
    LATENCY = (N_FFT / 2) / SR
    beats = np.arange(phase, len(env), period) / fps + LATENCY
    # Confidence: comb score at the chosen tempo vs the median over a wide tempo range.
    ref = np.median([max(comb_score(env, 60 * fps / b, p) for p in np.linspace(0, 60 * fps / b, 16, endpoint=False)) for b in np.arange(70, 180, 3.0)])
    confidence = best[0] / ref if ref > 0 else 0.0

    # Downbeat phase from low-band energy.
    lows = []
    for d in range(4):
        idx = (np.arange(phase + d * period, len(low), 4 * period)).astype(int)
        lows.append(float(low[idx].mean()) if len(idx) else 0.0)
    d = int(np.argmax(lows))
    downbeats = beats[d::4]

    # Busyness per beat (onset energy in each beat window), smoothed over one bar.
    per_beat = []
    for t0 in beats:
        a, b = int((t0 - LATENCY) * fps), int((t0 - LATENCY + period / fps) * fps)
        per_beat.append(float(env[a:b].sum()))
    pb = np.array(per_beat)
    bar_smooth = np.convolve(pb, np.ones(4) / 4, mode="same") if len(pb) >= 4 else pb
    busiest = int(np.argmax(bar_smooth)) if len(bar_smooth) else 0

    res = {
        "file": path,
        "duration": round(len(x) / SR, 3),
        "bpm": round(bpm, 2),
        "beat": round(60 / bpm, 5),
        "confidence": round(confidence, 2),
        "firstBeat": round(float(beats[0]), 4),
        "downbeatPhase": d,
        "downbeats": [round(float(t), 4) for t in downbeats],
        "beats": [round(float(t), 4) for t in beats],
        "busyPerBeat": [round(v, 2) for v in pb],
        "busiest": {"beat": busiest, "time": round(float(beats[busiest]), 3) if len(beats) else 0},
        "lowBandByPhase": [round(v, 3) for v in lows],
    }
    if out:
        json.dump(res, open(out, "w"), indent=1)
    print(f"{path}: {res['duration']} s · {res['bpm']} BPM (beat {res['beat']} s, confidence {res['confidence']}×) · first beat {res['firstBeat']} s · downbeats {res['downbeats'][:6]} … · busiest around {res['busiest']['time']} s")


if __name__ == "__main__":
    main()
