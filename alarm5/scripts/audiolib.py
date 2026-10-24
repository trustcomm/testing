"""PHP2Shell audio engine: shared DSP helpers (numpy / scipy only, seeded, deterministic).

Used by make_sfx.py, make_music.py, build_mix.py and qa_audio.py.  Nothing in here reads the network or the clock.
"""
from __future__ import annotations

import json
import zlib
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
FPS = 60
SPF = SR // FPS  # samples per video frame (1600, exact)

ROOT = Path(__file__).resolve().parent.parent  # alarm5/
PUBLIC = ROOT / "public"
BUILD = ROOT / "build"
SFX_DIR = PUBLIC / "sfx"


# ----------------------------------------------------------------------------------------------------------------- basics
def seed_for(name: str, extra: int = 0) -> int:
    return (zlib.crc32(name.encode()) + 7919 * int(extra)) & 0xFFFFFFFF


def rng_for(name: str, extra: int = 0) -> np.random.Generator:
    return np.random.default_rng(seed_for(name, extra))


def db2lin(d):
    return 10.0 ** (np.asarray(d, dtype=float) / 20.0)


def lin2db(x):
    return 20.0 * np.log10(np.maximum(np.asarray(x, dtype=float), 1e-12))


def nsamp(sec: float) -> int:
    return int(round(sec * SR))


def tt(n: int) -> np.ndarray:
    return np.arange(n) / SR


def smoothstep(x):
    u = np.clip(x, 0.0, 1.0)
    return u * u * (3 - 2 * u)


def noise(r: np.random.Generator, n: int) -> np.ndarray:
    return r.standard_normal(n)


def phase(f_inst: np.ndarray, p0: float = 0.0) -> np.ndarray:
    """phase (rad) of an oscillator with instantaneous frequency f_inst (Hz per sample)."""
    return 2 * np.pi * np.cumsum(f_inst) / SR + p0


def rms(x) -> float:
    x = np.asarray(x, dtype=float)
    return float(np.sqrt(np.mean(x * x))) if x.size else 0.0


# ----------------------------------------------------------------------------------------------------------------- envelopes
def edecay(t, tau):
    return np.exp(-np.asarray(t) / tau)


def attack(t, att):
    """raised-cosine attack 0 -> 1 over `att` seconds"""
    if att <= 0:
        return np.ones_like(t)
    return 0.5 - 0.5 * np.cos(np.pi * np.clip(t / att, 0, 1))


def fade_in(x, ms: float):
    n = min(len(x), max(2, int(SR * ms / 1000)))
    w = 0.5 - 0.5 * np.cos(np.pi * np.arange(n) / n)
    y = np.array(x, dtype=float, copy=True)
    y[:n] *= w if y.ndim == 1 else w[:, None]
    return y


def fade_out(x, ms: float):
    n = min(len(x), max(2, int(SR * ms / 1000)))
    w = 0.5 + 0.5 * np.cos(np.pi * np.arange(n) / n)
    y = np.array(x, dtype=float, copy=True)
    y[-n:] *= w if y.ndim == 1 else w[:, None]
    return y


def place(buf: np.ndarray, x: np.ndarray, start: int, gain: float = 1.0):
    """add x into buf (mono or stereo) at integer sample `start`, clipped to buf; returns buf"""
    s0 = max(0, start)
    s1 = min(len(buf), start + len(x))
    if s1 > s0:
        buf[s0:s1] += gain * x[s0 - start:s1 - start]
    return buf


# ----------------------------------------------------------------------------------------------------------------- filters
def _sos(kind, fc, order):
    nyq = SR / 2
    if np.ndim(fc) == 0:
        fc = min(float(fc), nyq * 0.98)
    else:
        fc = [min(float(v), nyq * 0.98) for v in fc]
    return signal.butter(order, fc, btype=kind, fs=SR, output="sos")


def lp(x, fc, order=2):
    return signal.sosfilt(_sos("lowpass", fc, order), x, axis=0)


def hp(x, fc, order=2):
    return signal.sosfilt(_sos("highpass", fc, order), x, axis=0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(_sos("bandpass", (lo, hi), order), x, axis=0)


def hp_zero(x, fc, order=2):
    return signal.sosfiltfilt(_sos("highpass", fc, order), x, axis=0)


def peaking(x, f0, gain_db, q=1.0):
    """RBJ peaking EQ"""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    al = np.sin(w0) / (2 * q)
    b = np.array([1 + al * A, -2 * np.cos(w0), 1 - al * A])
    a = np.array([1 + al / A, -2 * np.cos(w0), 1 - al / A])
    return signal.lfilter(b / a[0], a / a[0], x, axis=0)


def highshelf(x, f0, gain_db, slope=0.8):
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    cw, sw = np.cos(w0), np.sin(w0)
    al = sw / 2 * np.sqrt((A + 1 / A) * (1 / slope - 1) + 2)
    sA = 2 * np.sqrt(A) * al
    b0 = A * ((A + 1) + (A - 1) * cw + sA)
    b1 = -2 * A * ((A - 1) + (A + 1) * cw)
    b2 = A * ((A + 1) + (A - 1) * cw - sA)
    a0 = (A + 1) - (A - 1) * cw + sA
    a1 = 2 * ((A - 1) - (A + 1) * cw)
    a2 = (A + 1) - (A - 1) * cw - sA
    return signal.lfilter(np.array([b0, b1, b2]) / a0, np.array([1, a1 / a0, a2 / a0]), x, axis=0)


def lowshelf(x, f0, gain_db, slope=0.8):
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    cw, sw = np.cos(w0), np.sin(w0)
    al = sw / 2 * np.sqrt((A + 1 / A) * (1 / slope - 1) + 2)
    sA = 2 * np.sqrt(A) * al
    b0 = A * ((A + 1) - (A - 1) * cw + sA)
    b1 = 2 * A * ((A - 1) - (A + 1) * cw)
    b2 = A * ((A + 1) - (A - 1) * cw - sA)
    a0 = (A + 1) + (A - 1) * cw + sA
    a1 = -2 * ((A - 1) + (A + 1) * cw)
    a2 = (A + 1) + (A - 1) * cw - sA
    return signal.lfilter(np.array([b0, b1, b2]) / a0, np.array([1, a1 / a0, a2 / a0]), x, axis=0)


def soft_sat(x, drive=1.5):
    return np.tanh(drive * x) / np.tanh(drive)


def pink(r, n):
    """approximate pink noise (1/f) by filtering white noise (Paul Kellet's refined filter)"""
    w = r.standard_normal(n)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, w)


# ----------------------------------------------------------------------------------------------------------------- sweeps / oscillators
def sweep_noise(r, n, fc, bw_oct=1.0, nper=1024):
    """Noise shaped by a band that follows the time-varying centre frequency fc (Hz; scalar or array len n).
    STFT mask, log-frequency Gaussian of width bw_oct (octaves, sigma).  Unit-RMS output."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), (n,))
    bw = np.broadcast_to(np.asarray(bw_oct, dtype=float), (n,))
    x = r.standard_normal(n)
    hop = nper // 4
    f, tf, Z = signal.stft(x, fs=SR, window="hann", nperseg=nper, noverlap=nper - hop)
    pos = np.clip(np.round(tf * SR).astype(int), 0, n - 1)
    fcs = fc[pos]
    bws = bw[pos]
    ff = np.maximum(f[:, None], 1.0)
    mask = np.exp(-0.5 * (np.log2(ff / fcs[None, :]) / bws[None, :]) ** 2)
    mask[0, :] = 0
    _, y = signal.istft(Z * mask, fs=SR, window="hann", nperseg=nper, noverlap=nper - hop)
    y = y[:n]
    if len(y) < n:
        y = np.pad(y, (0, n - len(y)))
    y = y * np.sqrt(np.sqrt(fc.min() * fc.max()) / fc)  # a band of white noise passes power ~ fc: compensate so the loudness follows the envelope
    return y / (rms(y) + 1e-12)


def saw_filtered(f_inst, fc_inst, nharm=28, rolloff=1.0, p0=0.0):
    """band-limited saw with a (time-varying) 2-pole-ish low-pass applied per harmonic.  f_inst, fc_inst: Hz arrays."""
    ph = phase(f_inst, p0)
    out = np.zeros(len(ph))
    for k in range(1, nharm + 1):
        fk = f_inst * k
        a = (1.0 / k ** rolloff) / np.sqrt(1.0 + (fk / np.maximum(fc_inst, 20.0)) ** 4)
        a = np.where(fk < SR * 0.45, a, 0.0)
        out += a * np.sin(k * ph)
    return out


def modal(t, parts, p0=0.0):
    """sum of exponentially decaying sines. parts: iterable of (freq_hz, amp, tau_s [, phase])"""
    out = np.zeros(len(t))
    for p in parts:
        f, a, tau = p[:3]
        ph = p[3] if len(p) > 3 else p0
        if f >= SR * 0.46:
            continue
        out += a * np.exp(-t / tau) * np.sin(2 * np.pi * f * t + ph)
    return out


# ----------------------------------------------------------------------------------------------------------------- reverb ("convolution-ish tails")
def make_ir(rt60, seed=1, lp_hz=6000.0, predelay=0.0, early=True, stereo=False, hp_hz=60.0):
    L = int(rt60 * 1.15 * SR) + int(predelay * SR) + 8
    t = np.arange(L) / SR
    env = 10.0 ** (-3.0 * np.clip(t - predelay, 0, None) / rt60)
    env[t < predelay] = 0
    chans = 2 if stereo else 1
    out = np.zeros((L, chans))
    for c in range(chans):
        r = np.random.default_rng(seed * 31 + c)
        nz = r.standard_normal(L)
        bright = lp(nz, lp_hz, 2)
        dark = lp(nz, max(300.0, lp_hz / 4.0), 2)
        w = np.clip((t - predelay) / rt60, 0, 1) ** 0.7
        y = ((1 - w) * bright + w * dark) * env
        if early:
            for _ in range(10):
                k = int((predelay + r.uniform(0.004, 0.06)) * SR)
                if k < L:
                    y[k] += r.choice([-1, 1]) * r.uniform(0.6, 1.4) * 2.5
        out[:, c] = hp(y, hp_hz, 1)
    out /= np.sqrt(np.sum(out[:, 0] ** 2)) + 1e-12
    return out if stereo else out[:, 0]


def reverb(x, ir, wet_db=-12.0, dry_db=0.0, n_out=None):
    """x (n,) mono -> (n_out,) mono or (n_out,2) with a stereo IR.  wet_db relative to dry energy."""
    n_out = n_out or len(x)
    if ir.ndim == 1:
        wet = signal.fftconvolve(x, ir)[:n_out]
        y = np.zeros(n_out)
        y[:min(len(x), n_out)] += db2lin(dry_db) * x[:n_out]
        y[:len(wet)] += db2lin(wet_db) * wet
        return y
    y = np.zeros((n_out, 2))
    for c in range(2):
        wet = signal.fftconvolve(x, ir[:, c])[:n_out]
        y[:min(len(x), n_out), c] += db2lin(dry_db) * x[:n_out]
        y[:len(wet), c] += db2lin(wet_db) * wet
    return y


# ----------------------------------------------------------------------------------------------------------------- instruments shared by sfx + music
def piano(freq, dur, vel=0.7, bright=1.0, seed=0, tail_tau=3.2):
    """a felt piano note (soft hammer): inharmonic partials, two slightly detuned strings, fast + slow decay, hammer thud.
    returns mono float array of length dur*SR, unit-ish amplitude (not normalised)."""
    n = nsamp(dur)
    t = tt(n)
    r = np.random.default_rng(seed + int(freq * 10))
    out = np.zeros(n)
    B = 0.00018 * (1.0 + (freq / 262.0) ** 1.5)
    for k in range(1, 40):
        fk = freq * k * np.sqrt(1 + B * k * k)
        if fk > SR * 0.42:
            break
        a = (k ** -1.15) * np.exp(-(k / (6.0 * bright + 0.5)) ** 2) * (0.55 + 0.45 * vel)
        if k == 2:
            a *= 0.9
        if k == 3:
            a *= 0.75
        tau_fast = 0.9 * tail_tau / 3.2 / (1 + 0.55 * (k - 1))
        tau_slow = tail_tau / (1 + 0.35 * (k - 1))
        env = 0.62 * np.exp(-t / tau_fast) + 0.38 * np.exp(-t / tau_slow)
        det = 0.11 * np.sqrt(k) * (0.6 + 0.4 * r.random())
        ph0 = r.uniform(0, 2 * np.pi)
        # two strings, slightly detuned and unequal -> a gentle, shallow beating (never a full null)
        s = 0.62 * np.sin(2 * np.pi * (fk - det) * t + ph0) + 0.38 * np.sin(2 * np.pi * (fk + det) * t + ph0 * 0.7)
        out += a * env * s
    out *= attack(t, 0.0025 + 0.002 * (1 - vel))
    # soft felt thud
    thud = lp(r.standard_normal(n), 700 + 300 * vel, 2) * np.exp(-t / 0.006) * 0.10 * (0.4 + vel)
    out += thud
    return out


def pad_tone(freq, dur, att=0.6, rel=1.5, bright=1.0, voices=3, detune_cents=7.0, seed=0, end_fade=True):
    """a soft sustained pad tone (sine + soft overtones, detuned voices). total length dur+rel."""
    total = nsamp(dur + rel)
    t = tt(total)
    r = np.random.default_rng(seed + int(freq * 7))
    out = np.zeros(total)
    for v in range(voices):
        cents = (v - (voices - 1) / 2) * detune_cents * 2 / max(1, voices - 1) if voices > 1 else 0
        f = freq * 2 ** (cents / 1200)
        ph = r.uniform(0, 2 * np.pi)
        lfo = 1 + 0.0007 * np.sin(2 * np.pi * (0.11 + 0.05 * v) * t + ph)
        p = 2 * np.pi * np.cumsum(f * lfo) / SR + ph
        s = np.sin(p) + 0.32 * bright * np.sin(2 * p + 0.5) + 0.12 * bright * np.sin(3 * p + 1.0) + 0.05 * bright * np.sin(4 * p)
        out += s / voices
    env = attack(t, att)
    if end_fade:
        env *= np.where(t < dur, 1.0, 0.5 + 0.5 * np.cos(np.pi * np.clip((t - dur) / rel, 0, 1)))
    return out * env


# ----------------------------------------------------------------------------------------------------------------- loudness / peaks
def true_peak_db(x) -> float:
    x = np.asarray(x, dtype=float)
    if x.size == 0:
        return -120.0
    y = signal.resample_poly(x, 4, 1, axis=0)
    return float(lin2db(np.max(np.abs(y))))


def peak_db(x) -> float:
    return float(lin2db(np.max(np.abs(x)))) if np.size(x) else -120.0


def lufs(x, sr=SR) -> float:
    import pyloudnorm as pyln
    x = np.asarray(x, dtype=float)
    if x.shape[0] < sr * 0.4:
        return -120.0
    try:
        v = pyln.Meter(sr).integrated_loudness(x)
    except Exception:
        return -120.0
    return float(v) if np.isfinite(v) else -120.0


def spectral_centroid(x, sr=SR) -> float:
    x = np.asarray(x, dtype=float)
    if x.ndim > 1:
        x = x.mean(axis=1)
    sp = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2
    f = np.fft.rfftfreq(len(x), 1 / sr)
    return float((f * sp).sum() / (sp.sum() + 1e-18))


def normalize_peak(x, dbfs=-1.0):
    p = np.max(np.abs(x))
    return x * (db2lin(dbfs) / p) if p > 0 else x


# ----------------------------------------------------------------------------------------------------------------- pitch shift by resampling (the mixer's pitch)
def pitch_ratio(semitones: float) -> float:
    return 2.0 ** (semitones / 12.0)


def resample_pitch(x: np.ndarray, semitones: float):
    """Shift pitch (and speed) by resampling: returns (y, r_eff) where y plays r_eff times faster (duration / r_eff).
    Band-limited FFT resampling to a whole number of output samples; r_eff = len(x)/len(y) is the ratio really applied."""
    if abs(semitones) < 1e-9:
        return x, 1.0
    r = pitch_ratio(semitones)
    n = len(x)
    m = int(round(n / r))
    y = signal.resample(x, m, axis=0)
    return y, n / m


# ----------------------------------------------------------------------------------------------------------------- IO
def read_json(p):
    with open(p) as f:
        return json.load(f)


def write_wav(path, x, subtype="PCM_24", sr=SR):
    import soundfile as sf
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), np.asarray(x, dtype=np.float64), sr, subtype=subtype)


def read_wav(path):
    import soundfile as sf
    x, sr = sf.read(str(path), always_2d=False)
    return x, sr
