#!/usr/bin/env python3
"""PHP2Shell: the mixer.  public/timeline.json + public/vo.mp3 + public/sfx/*.wav + the music beds  ->  public/mix.wav (+ stems + report).

    python3 scripts/build_mix.py                                   # the real film  -> public/mix.wav, build/stems/*.wav, public/mix_report.json
    python3 scripts/build_mix.py --timeline build/test_timeline.json --out build/test      # any timeline -> <out>/mix.wav, <out>/stems, <out>/mix_report.json

Signal flow (everything 48 kHz, float64 inside, deterministic):
  voice  vo.mp3 -> HPF 60 Hz -> light compressor (2.5:1, soft knee, 10 ms / 120 ms) -> gain to -14 LUFS -> true-peak look-ahead limiter
  sfx    every timeline event: sound file -> pitch (resampling) -> hit instant aligned to frame/30 s to the sample -> gainDb, pan (constant power /
         balance) -> calibrated so that a gainDb 0 event peaks SFX_UNDER_DB (12 dB) under the voice's peak
  music  dark bed + warm bed -> loudness-calibrated -> drop (10 frames to near silence at music.drop, silence until silentUntil) ->
         sidechain duck 8 dB under the voice (40 ms attack, 350 ms release) + up to 4 dB under big SFX hits -> a gentle 2 dB carve at 2 kHz
  master voice + sfx + music -> bus glue compressor (1.3:1, only the peaks) -> true-peak limiter (<= -1 dBTP)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import zlib
from pathlib import Path

import numpy as np
from scipy import ndimage, signal

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audiolib import (  # noqa: E402
    BUILD, FPS, PUBLIC, SFX_DIR, SPF, SR, db2lin, fade_in, fade_out, highshelf, hp, lin2db, lufs, nsamp, peak_db, peaking, read_json, resample_pitch,
    rms, true_peak_db, write_wav,
)

# ---------------------------------------------------------------------------------------------------------------- the levels (BRIEF section 6)
VOICE_LUFS = -14.0          # the voice alone, integrated, measured on the voice STEM as delivered (dual-mono stereo, BS.1770: = mono loudness + 3.01 LU)
STEREO_OF_MONO_LU = 10 * np.log10(2.0)  # a mono voice placed at L = R reads this much louder than the mono file
VOICE_CEIL_TP = -2.0       # voice limiter ceiling (dBTP): leaves room for sfx + music on top of the voice peaks
COMP = dict(ratio=2.5, knee_db=6.0, att_ms=10.0, rel_ms=120.0)
COMP_THR_REL_LUFS = -1.2    # threshold = the voice's own integrated loudness - 1.2 dB (= -24 dB for the current vo.mp3, per the spec)
SFX_UNDER_DB = 12.0         # a gainDb 0 event peaks this far under the voice's peak (brief: 10-14)
DUCK_DB = 8.0               # music ducks this far under the voice
DUCK_ATT_MS, DUCK_REL_MS, DUCK_HOLD_MS, DUCK_LOOK_MS = 40.0, 350.0, 150.0, 30.0
SFX_DUCK_MAX_DB = 4.0       # extra music dip under the big SFX hits ("hit room")
VP_MARGIN_DB, VP_MAX_CUT_DB, VP_ATT_MS, VP_REL_MS, VP_BAND = 8.0, 5.0, 3.0, 90.0, (300.0, 4500.0)  # voice priority: the SFX's speech band stays >= 8 dB under the voice's, cut <= 5 dB
MUSIC_DARK_LUFS = -25.5     # integrated loudness of the dark bed before ducking (S1-S9)
MUSIC_WARM_LUFS = -24.5     # integrated loudness of the warm bed before ducking (S10-S13)
DROP_FLOOR_DB = -46.0       # the "near silence" level after the drop, relative to the bed
GLUE = dict(thr_db=-9.0, ratio=1.3, knee_db=8.0, att_ms=30.0, rel_ms=250.0)
MASTER_CEIL_TP = -1.15      # a hair under -1 dBTP so every meter agrees


# ---------------------------------------------------------------------------------------------------------------- dynamics
def smooth_ar(target, att_ms, rel_ms, fs):
    """attack/release smoothing of a control signal; `target` < current value uses the attack (it is the 'more reduction' direction for gain in dB)"""
    aa = np.exp(-1.0 / (att_ms * 1e-3 * fs))
    ar = np.exp(-1.0 / (rel_ms * 1e-3 * fs))
    out = np.empty(len(target))
    y = 0.0
    for i, tg in enumerate(target):
        y = aa * y + (1 - aa) * tg if tg < y else ar * y + (1 - ar) * tg
        out[i] = y
    return out


def compressor(x, thr_db, ratio, knee_db, att_ms, rel_ms, det_ms=3.0, block=8, detector=None):
    """feed-forward log-domain compressor (soft knee).  Returns (gain per sample (linear), gain reduction curve in dB at control rate).
    thr_db is on the power scale of a det_ms-smoothed detector (a full-scale sine reads -3 dB)."""
    d = np.abs(x) if detector is None else detector
    a = np.exp(-1.0 / (det_ms * 1e-3 * SR))
    p = signal.lfilter([1 - a], [1, -a], d * d)
    lvl = 10 * np.log10(p + 1e-12)
    nb = len(lvl) // block
    lc = lvl[:nb * block].reshape(nb, block).max(axis=1)
    over = lc - thr_db
    out = np.where(2 * over < -knee_db, lc, np.where(2 * np.abs(over) <= knee_db, lc + (1 / ratio - 1) * (over + knee_db / 2) ** 2 / (2 * knee_db), thr_db + over / ratio))
    gr_t = np.minimum(out - lc, 0.0)
    gr = smooth_ar(gr_t, att_ms, rel_ms, SR / block)
    pos = (np.arange(nb) + 0.5) * block
    g_db = np.interp(np.arange(len(x)), pos, gr)
    return db2lin(g_db), gr


def _release_follow(d, dec, B=2048):
    out = np.empty_like(d)
    k = np.arange(B)
    pw, ipw = dec ** k, dec ** (-k)
    carry = 0.0
    for s in range(0, len(d), B):
        blk = d[s:s + B]
        m = len(blk)
        cm = np.maximum.accumulate(blk * ipw[:m]) * pw[:m]
        out[s:s + m] = np.maximum(cm, carry * dec ** (k[:m] + 1))
        carry = out[s + m - 1]
    return out


def limiter(x, ceiling_db, look_ms=3.0, rel_ms=80.0, os=4):
    """transparent look-ahead true-peak limiter: the gain reaches the required reduction `look_ms` before each (oversampled) peak and releases
    with an `rel_ms` time constant.  x: (n,) or (n, ch).  Returns (y, gain per sample)."""
    x2 = x[:, None] if x.ndim == 1 else x
    n = len(x2)
    pk = np.max(np.abs(x2), axis=1)
    if os > 1:
        y = signal.resample_poly(x2, os, 1, axis=0)
        pk = np.maximum(pk, np.max(np.abs(y), axis=1).reshape(n, os).max(axis=1))
        del y
    g_req = np.minimum(1.0, db2lin(ceiling_db) / np.maximum(pk, 1e-9))
    L = max(1, int(look_ms * 1e-3 * SR))
    g_hold = ndimage.minimum_filter1d(g_req, size=2 * L + 1, mode="nearest")
    g_s = ndimage.uniform_filter1d(g_hold, size=2 * L + 1, mode="nearest")
    r = _release_follow(1.0 - g_s, np.exp(-1.0 / (rel_ms * 1e-3 * SR)))
    g = 1.0 - r
    y = x2 * g[:, None]
    return (y[:, 0] if x.ndim == 1 else y), g


def limit_to_tp(x, ceiling_db, **kw):
    """limit and verify the true peak, tightening the ceiling until it holds"""
    c = ceiling_db
    for _ in range(6):
        y, g = limiter(x, c, **kw)
        tp = true_peak_db(y)
        if tp <= ceiling_db + 0.005:
            return y, g
        c -= (tp - ceiling_db) + 0.02
    return y, g


# ---------------------------------------------------------------------------------------------------------------- assets
def ensure_assets(tl, timeline_path):
    import make_music
    import make_sfx
    spec_names = list(make_sfx.parse_spec())
    idx_p = SFX_DIR / "index.json"
    need = (not idx_p.exists()) or any(not (SFX_DIR / f"{n}.wav").exists() for n in spec_names)
    if not need:
        idx = json.loads(idx_p.read_text())
        need = any(n not in idx for n in spec_names)
    if need:
        print("[build_mix] public/sfx missing: running make_sfx.py")
        make_sfx.build(verbose=False)
    meta_p = BUILD / "music_meta.json"
    stale = (not (PUBLIC / "music_dark.wav").exists()) or (not (PUBLIC / "music_warm.wav").exists()) or (not meta_p.exists())
    if not stale:
        stale = json.loads(meta_p.read_text()) != json.loads(json.dumps(make_music.stamp(tl), sort_keys=True))
    if stale:
        print("[build_mix] music missing or stale: running make_music.py")
        make_music.build(Path(timeline_path), verbose=False)


# ---------------------------------------------------------------------------------------------------------------- voice
def build_voice(vo_path, n_total, offset):
    import soundfile as sf
    raw, sr = sf.read(str(vo_path), always_2d=False)
    if raw.ndim == 2:
        raw = raw.mean(axis=1)
    if sr != SR:
        raw = signal.resample_poly(raw, SR, sr)
    raw = hp(raw, 60.0, 2)
    raw_l = lufs(raw)
    thr = raw_l + COMP_THR_REL_LUFS  # = -24.0 for the current vo.mp3: the spec's "2.5:1 above -24 dB"
    g, gr = compressor(raw, thr_db=thr, **COMP)
    comp = raw * g
    comp_l = lufs(comp)
    # gain to -14 LUFS, limit, re-aim (the limiter takes a little loudness back)
    gain_db = VOICE_LUFS - (comp_l + STEREO_OF_MONO_LU)
    for _ in range(4):
        v, lg = limit_to_tp(comp * db2lin(gain_db), VOICE_CEIL_TP, look_ms=4.0, rel_ms=90.0)
        l_now = lufs(v) + STEREO_OF_MONO_LU
        if abs(l_now - VOICE_LUFS) < 0.03:
            break
        gain_db += VOICE_LUFS - l_now
    st = {
        "rawLufs": raw_l, "rawPeakDb": peak_db(raw), "rawCrestDb": peak_db(raw) - 20 * np.log10(rms(raw) + 1e-12), "compThresholdDb": thr, "compRatio": COMP["ratio"],
        "compGrMeanDb": float(np.mean(gr[gr < -0.1])) if np.any(gr < -0.1) else 0.0, "compGrMaxDb": float(-gr.min()), "compLufs": comp_l, "gainDb": gain_db,
        "limiterGrMaxDb": float(-lin2db(lg.min())), "limiterActiveFrac": float(np.mean(lg < 0.999)),
        "finalLufs": lufs(v) + STEREO_OF_MONO_LU, "finalLufsMonoFile": lufs(v), "peakDb": peak_db(v), "truePeakDb": true_peak_db(v), "crestDb": peak_db(v) - 20 * np.log10(rms(v) + 1e-12),
    }
    out = np.zeros(n_total)
    n = min(len(v), n_total - offset)
    out[offset:offset + n] = v[:n]
    return out, st


# ---------------------------------------------------------------------------------------------------------------- sfx
_cache: dict = {}


def load_sfx(name):
    if name not in _cache:
        import soundfile as sf
        x, sr = sf.read(str(SFX_DIR / f"{name}.wav"), always_2d=False)
        assert sr == SR
        _cache[name] = x
    return _cache[name]


def pan_gains(pan, stereo):
    p = float(np.clip(pan, -1, 1))
    if stereo:  # balance: unity on the louder side, equal-power attenuation of the other
        return np.cos(max(p, 0.0) * np.pi / 2), np.cos(max(-p, 0.0) * np.pi / 2)
    a = (p + 1) * np.pi / 4  # constant power: centre = 0.7071 per channel
    return np.cos(a), np.sin(a)


def render_event(e, index, voice_peak_db, under_db=SFX_UNDER_DB):
    """one timeline event -> (stereo array, start sample (may be negative), hit sample (float, in the global timeline), info)
    The sound's own `hit` instant (index.json) lands on frame * 1600 samples EXACTLY (to rounding of the pitched hit offset, <= 0.5 sample)."""
    meta = index[e["sfx"]]
    x = load_sfx(e["sfx"])
    stereo = x.ndim == 2
    pitch = float(e.get("pitch", 0) or 0)
    gdb = float(e.get("gainDb", 0) or 0)
    seed = int(e.get("seed", 0) or 0)
    if seed:  # `seed` varies noisy sounds: a tiny deterministic pitch / level jitter
        rr = np.random.default_rng(zlib.crc32(e["id"].encode()) + seed)
        pitch += float(rr.uniform(-0.5, 0.5))
        gdb += float(rr.uniform(-0.6, 0.6))
    y, r_eff = resample_pitch(x, pitch)
    hit = meta["hit"] / r_eff * SR  # samples from the start of y
    dur = len(y)
    frames = e.get("frames")
    if frames:
        L = int(round(frames / FPS * SR))
        kind = meta.get("hitKind", "start")
        if kind == "start":
            lo, hi = 0, min(dur, L)
        elif kind == "end":
            lo, hi = max(0, dur - L), dur
        else:
            lo, hi = max(0, int(hit - L / 2)), min(dur, int(hit + L / 2))
        if hi - lo < dur:
            seg = y[lo:hi]
            seg = fade_out(seg, 15.0) if hi < dur else seg
            seg = fade_in(seg, 15.0) if lo > 0 else seg
            y, hit = seg, hit - lo
    peak_file = float(np.max(np.abs(x))) if len(x) else 1.0
    target = db2lin(voice_peak_db - under_db)
    cal = target / (peak_file * np.sqrt(0.5))  # a centred mono sound: 0.7071 per channel
    if stereo:
        cal *= np.sqrt(0.5)  # a stereo file at balance 0 peaks like a centred mono one
    gl, gr = pan_gains(e.get("pan", 0), stereo)
    g = cal * db2lin(gdb)
    out = np.zeros((len(y), 2))
    if stereo:
        out[:, 0], out[:, 1] = y[:, 0] * gl * g, y[:, 1] * gr * g
    else:
        out[:, 0], out[:, 1] = y * gl * g, y * gr * g
    start = int(e["frame"]) * SPF - int(round(hit))
    return out, start, int(e["frame"]) * SPF, {"pitchEff": pitch, "gainDbEff": gdb, "calDb": float(lin2db(cal))}


def build_sfx(tl, index, n_total, voice_peak_db):
    stem = np.zeros((n_total, 2))
    rows = []
    for e in tl["sfx"]:
        out, start, hit_sample, info = render_event(e, index, voice_peak_db)
        s0, s1 = max(0, start), min(n_total, start + len(out))
        if s1 > s0:
            stem[s0:s1] += out[s0 - start:s1 - start]
        pk = peak_db(out) if len(out) else -120.0
        rows.append({
            "id": e["id"], "scene": e["scene"], "sfx": e["sfx"], "frame": e["frame"], "gainDb": e.get("gainDb", 0), "pan": e.get("pan", 0), "pitch": e.get("pitch", 0),
            "startSample": start, "hitSample": hit_sample, "peakDb": pk, "peakUnderVoiceDb": voice_peak_db - pk, **info,
        })
    return stem, rows


def voice_priority(sfx, voice):
    """Safety net so that "nothing masks a word": wherever the SFX's speech band (300 Hz-4.5 kHz) would come closer than VP_MARGIN_DB to the voice's band
    energy, that band (and only that band: sub bass, low body and air are untouched) is turned down, by at most VP_MAX_CUT_DB, 3 ms attack / 90 ms release.  The voice
    is looked at 150 ms AHEAD, so a hit that lands on the first frame of a word is judged against the word that is about to sound and keeps its punch.
    Zero-phase band split: nothing moves in time.  Returns (new sfx stem, gain curve per sample in dB)."""
    sos = signal.butter(2, VP_BAND, btype="bandpass", fs=SR, output="sos")
    band = signal.sosfiltfilt(sos, sfx, axis=0)
    vb = signal.sosfiltfilt(sos, voice)
    blk = SR // 1000
    nb = len(voice) // blk
    pw = lambda x: ndimage.uniform_filter1d((x[:nb * blk] ** 2).reshape(nb, blk).mean(axis=1), 30, mode="nearest")  # noqa: E731  40 ms-ish power at 1 kHz
    pv = pw(vb)
    ps = np.maximum(pw(band[:, 0]), pw(band[:, 1]))
    pv_look = np.roll(ndimage.maximum_filter1d(pv, size=171, mode="nearest"), -150)  # the voice over [t-20 ms, t+150 ms]
    pv_look[-150:] = pv[-150:]
    active = pv_look > 3e-6  # speech (> -55 dB power); pauses and room tone are left alone
    want = np.where(active & (ps > 1e-12), np.sqrt(pv_look * 10 ** (-VP_MARGIN_DB / 10) / np.maximum(ps, 1e-18)), 1.0)
    g_db = smooth_ar(20 * np.log10(np.clip(want, db2lin(-VP_MAX_CUT_DB), 1.0)), VP_ATT_MS, VP_REL_MS, 1000.0)
    g = np.interp(np.arange(len(voice)), (np.arange(nb) + 0.5) * blk, g_db)
    out = (sfx - band) + band * db2lin(g)[:, None]
    return out, g


# ---------------------------------------------------------------------------------------------------------------- music
def region_lufs(x, t0, t1):
    return lufs(x[int(t0 * SR):int(t1 * SR)])


def drop_curve(n, mu, floor_db=DROP_FLOOR_DB):
    """gain of the dark bed: 1, then `dropFrames` frames down to the near-silence floor at music.drop, held until silentUntil, then out over 0.8 s"""
    t = np.arange(n) / SR
    t_drop = mu["drop"] / FPS
    t_dfin = (mu["drop"] + mu["dropFrames"]) / FPS
    t_sil = mu["silentUntil"] / FPS
    fl = db2lin(floor_db)
    u = np.clip((t - t_drop) / (t_dfin - t_drop), 0, 1)
    g = 1.0 - (1.0 - fl) * (0.5 - 0.5 * np.cos(np.pi * u))
    v = np.clip((t - t_sil) / 0.8, 0, 1)
    g = g * (0.5 + 0.5 * np.cos(np.pi * v))
    return g


def speech_activity(voice, thr_db=-50.0, fs_c=1000):
    """per control block (1 kHz): 1 where the voice is speaking (1 ms RMS above threshold).  Gaps shorter than DUCK_HOLD_MS are bridged (hold on
    the release side only) and the whole curve is moved DUCK_LOOK_MS earlier so the duck is already down when the first word starts."""
    blk = SR // fs_c
    nb = len(voice) // blk
    e = voice[:nb * blk].reshape(nb, blk)
    r = 10 * np.log10(np.mean(e * e, axis=1) + 1e-12)
    act = (r > thr_db).astype(float)
    hold = int(DUCK_HOLD_MS * fs_c / 1000)
    act = (np.convolve(act, np.ones(hold + 1))[:nb] > 0).astype(float)
    look = int(DUCK_LOOK_MS * fs_c / 1000)
    return np.concatenate([act[look:], np.zeros(look)])


def build_music(tl, voice, sfx_stem, n_total):
    mu = tl["music"]
    dark = read_wav_stereo(PUBLIC / "music_dark.wav")
    warm = read_wav_stereo(PUBLIC / "music_warm.wav")
    assert len(dark) == n_total and len(warm) == n_total, f"music files are {len(dark)}/{len(warm)} samples, timeline needs {n_total}: run make_music.py"
    t_drop, t_hope, t_end = mu["drop"] / FPS, mu["hopeStart"] / FPS, n_total / SR
    ld = region_lufs(dark, 3.0, t_drop)
    lw = region_lufs(warm, t_hope, t_end - 5.0)
    gd, gw = MUSIC_DARK_LUFS - ld, MUSIC_WARM_LUFS - lw
    dark = dark * db2lin(gd)
    warm = warm * db2lin(gw)
    structure = drop_curve(n_total, mu)
    pre = dark * structure[:, None] + warm  # the music as composed + dropped, before any ducking
    # --- sidechain duck from the voice: 8 dB while speaking (40 ms attack, 350 ms release)
    fs_c = 1000
    blk = SR // fs_c
    act = speech_activity(voice, fs_c=fs_c)
    s = smooth_ar(-act, DUCK_ATT_MS, DUCK_REL_MS, fs_c)  # 0 .. -1 (the "attack" is the move towards -1)
    s = -s  # 0..1 ducking amount
    duck_db_c = -DUCK_DB * s
    # --- extra dip under big sfx hits ("hit room")
    nb = len(act)
    se = np.max(np.abs(sfx_stem[:nb * blk]), axis=1).reshape(nb, blk)
    se_db = 20 * np.log10(np.sqrt(np.mean(se * se, axis=1)) + 1e-9)
    amt = np.clip((se_db - (-42.0)) / 16.0, 0, 1)
    sd = smooth_ar(-amt, 8.0, 400.0, fs_c)
    sfx_duck_db_c = SFX_DUCK_MAX_DB * sd  # 0 .. -SFX_DUCK_MAX_DB
    total_db_c = duck_db_c + sfx_duck_db_c
    pos = (np.arange(nb) + 0.5) * blk
    gdb = np.interp(np.arange(n_total), pos, total_db_c)
    duck_gain = db2lin(gdb)
    m = pre * duck_gain[:, None]
    # --- carve a little room where the words live (2 kHz) and soften the sparkle that would sit on top of consonants (shelf above 3 kHz); tidy the bottom
    for c in range(2):
        m[:, c] = highshelf(peaking(hp(m[:, c], 30.0, 1), 2000.0, -2.0, 0.7), 3000.0, -3.5)
    info = {
        "darkLufsBefore": ld, "darkGainDb": gd, "warmLufsBefore": lw, "warmGainDb": gw, "targetDark": MUSIC_DARK_LUFS, "targetWarm": MUSIC_WARM_LUFS,
        "duckDb": DUCK_DB, "duckAttackMs": DUCK_ATT_MS, "duckReleaseMs": DUCK_REL_MS, "dropFloorDb": DROP_FLOOR_DB, "sfxDuckMaxDb": SFX_DUCK_MAX_DB,
        "speechFrac": float(np.mean(act > 0.5)),
    }
    return m, pre, info


def read_wav_stereo(p):
    import soundfile as sf
    x, sr = sf.read(str(p), always_2d=True)
    assert sr == SR
    return x if x.shape[1] == 2 else np.repeat(x[:, :1], 2, axis=1)


# ---------------------------------------------------------------------------------------------------------------- loudness via ffmpeg (LRA, cross-check)
def ffmpeg_ebur128(path):
    try:
        p = subprocess.run(["ffmpeg", "-nostats", "-hide_banner", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, timeout=300)
        txt = p.stderr
        tail = txt[txt.rindex("Summary:"):] if "Summary:" in txt else txt
        g = lambda pat: float(re.search(pat, tail).group(1))  # noqa: E731
        return {"integrated": g(r"I:\s+(-?[\d.]+) LUFS"), "lra": g(r"LRA:\s+(-?[\d.]+) LU"), "truePeak": g(r"Peak:\s+(-?[\d.]+) dBFS")}
    except Exception as ex:  # ffmpeg missing / unparsable: not fatal
        return {"error": str(ex)}


# ---------------------------------------------------------------------------------------------------------------- main
def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()[:16]


def build(timeline_path, out_dir=None, vo_path=None, verbose=True):
    import time
    t_start = time.time()
    lap = lambda msg: print(f"        [{time.time() - t_start:5.1f}s] {msg}") if verbose else None  # noqa: E731
    timeline_path = Path(timeline_path)
    tl = read_json(timeline_path)
    meta = tl["meta"]
    n_total = meta["totalFrames"] * SPF
    offset = int(round(meta["voiceOffsetSeconds"] * SR))
    vo_path = Path(vo_path) if vo_path else PUBLIC / "vo.mp3"
    if out_dir is None:
        mix_path, stem_dir, report_path = PUBLIC / "mix.wav", BUILD / "stems", PUBLIC / "mix_report.json"
    else:
        out_dir = Path(out_dir)
        mix_path, stem_dir, report_path = out_dir / "mix.wav", out_dir / "stems", out_dir / "mix_report.json"
    ensure_assets(tl, timeline_path)
    index = json.loads((SFX_DIR / "index.json").read_text())
    for e in tl["sfx"]:
        assert e["sfx"] in index, f"event {e['id']}: unknown sound {e['sfx']}"

    lap('assets ready')
    voice, vst = build_voice(vo_path, n_total, offset)
    lap('voice done')
    vpk = peak_db(voice)
    if verbose:
        print(f"[voice] raw {vst['rawLufs']:.2f} LUFS crest {vst['rawCrestDb']:.1f} dB -> comp (GR mean {vst['compGrMeanDb']:.1f} / max {vst['compGrMaxDb']:.1f} dB) -> {vst['finalLufs']:.2f} LUFS on the stereo stem ({vst['finalLufsMonoFile']:.2f} as a mono file), "
              f"peak {vst['peakDb']:.2f} dBFS, TP {vst['truePeakDb']:.2f}, crest {vst['crestDb']:.1f} dB, limiter GR max {vst['limiterGrMaxDb']:.2f} dB")
    sfx_raw, rows = build_sfx(tl, index, n_total, vpk)
    sfx_stem, vp_db = voice_priority(sfx_raw, voice)
    for r in rows:  # how much did the voice-priority duck turn each event down (deepest cut from just before its hit to 300 ms after)?
        h = r["hitSample"]
        seg = vp_db[max(0, h - 1600):h + 14400]
        r["voicePriorityCutDb"] = float(-seg.min()) if len(seg) else 0.0
    lap('sfx done')
    music, music_pre, mst = build_music(tl, voice, sfx_stem, n_total)
    lap('music done')
    voice2 = np.stack([voice, voice], axis=1)

    bus = voice2 + sfx_stem + music
    pre_peak = peak_db(bus)
    det = np.max(np.abs(bus), axis=1)
    gl, glue_gr = compressor(det, GLUE["thr_db"], GLUE["ratio"], GLUE["knee_db"], GLUE["att_ms"], GLUE["rel_ms"], det_ms=10.0, block=16)
    bus = bus * gl[:, None]
    mix, mg = limit_to_tp(bus, MASTER_CEIL_TP, look_ms=3.0, rel_ms=100.0)
    mix_gain_db = lin2db(gl * mg)  # total master gain (glue x limiter) per sample
    lap('master done')

    ens = lambda a: np.nan_to_num(a)  # noqa: E731
    write_wav(mix_path, ens(mix), "PCM_24")
    write_wav(stem_dir / "voice.wav", voice2, "FLOAT")
    write_wav(stem_dir / "sfx.wav", sfx_stem, "FLOAT")
    write_wav(stem_dir / "music.wav", music, "FLOAT")
    write_wav(stem_dir / "music_pre.wav", music_pre, "FLOAT")

    mix_l = lufs(mix)
    eb = ffmpeg_ebur128(mix_path)
    mono = mix.mean(axis=1)
    sfx_pk = peak_db(sfx_stem)
    report = {
        "inputs": {"timeline": sha(timeline_path), "sfxIndex": sha(SFX_DIR / "index.json"), "vo": sha(vo_path), "musicDark": sha(PUBLIC / "music_dark.wav"), "musicWarm": sha(PUBLIC / "music_warm.wav")},
        "timeline": str(timeline_path), "fps": FPS, "sampleRate": SR, "totalFrames": meta["totalFrames"], "samples": int(n_total), "seconds": n_total / SR, "voiceOffsetSamples": offset,
        "voice": vst,
        "sfx": {
            "voicePriority": {"marginDb": VP_MARGIN_DB, "maxCutDb": VP_MAX_CUT_DB, "deepestCutDb": float(-vp_db.min()), "samplesCutMoreThan1dB": float(np.mean(vp_db < -1.0)),
                              "eventsCutMoreThan1dB": sum(1 for r in rows if r["voicePriorityCutDb"] > 1.0)},
            "events": len(rows), "underVoiceNominalDb": SFX_UNDER_DB, "voicePeakDb": vpk, "sfxPeakDb": sfx_pk, "sfxPeakUnderVoiceDb": vpk - sfx_pk,
            "nominalPeakDb": vpk - SFX_UNDER_DB, "gainDb0Events": sum(1 for r in rows if float(r["gainDb"]) == 0),
        },
        "music": {**mst, "preDuckPeakDb": peak_db(music_pre), "peakDb": peak_db(music), "lufs": lufs(music)},
        "master": {
            "preMasterPeakDb": pre_peak, "glueGrMaxDb": float(-glue_gr.min()), "glueGrMeanDb": float(-np.mean(glue_gr)), "masterGainMinDb": float(mix_gain_db.min()),
            "limiterGrMaxDb": float(-lin2db(mg.min())), "samplePeakDb": peak_db(mix), "truePeakDb": true_peak_db(mix), "integratedLufs": mix_l, "ffmpeg": eb,
            "monoFoldLufs": lufs(mono), "monoFoldLossDb": lufs(mono) - mix_l, "nan": bool(np.isnan(mix).any()),
        },
        "events": rows,
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=1, default=float) + "\n")
    if verbose:
        vpr = report["sfx"]["voicePriority"]
        print(f"[sfx]   voice priority: {vpr['eventsCutMoreThan1dB']} of {len(rows)} events turned down > 1 dB in the speech band (deepest {vpr['deepestCutDb']:.1f} dB)")
        print(f"[sfx]   {len(rows)} events; loudest peak {sfx_pk:.2f} dBFS = {vpk - sfx_pk:.1f} dB under the voice peak ({vpk:.2f})")
        print(f"[music] dark {mst['darkLufsBefore']:.1f} -> {MUSIC_DARK_LUFS} LUFS (gain {mst['darkGainDb']:+.1f} dB), warm {mst['warmLufsBefore']:.1f} -> {MUSIC_WARM_LUFS} (gain {mst['warmGainDb']:+.1f} dB), duck {DUCK_DB} dB, speech {mst['speechFrac'] * 100:.0f}% of the film")
        print(f"[mix]   {n_total / SR:.3f} s, integrated {mix_l:.2f} LUFS (ffmpeg {eb.get('integrated')}, LRA {eb.get('lra')} LU), true peak {report['master']['truePeakDb']:.2f} dBTP "
              f"(ffmpeg {eb.get('truePeak')}), glue GR max {report['master']['glueGrMaxDb']:.1f} dB, limiter GR max {report['master']['limiterGrMaxDb']:.2f} dB")
        print(f"        -> {mix_path}  stems in {stem_dir}  report {report_path}")
    return report


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--timeline", default=str(PUBLIC / "timeline.json"))
    ap.add_argument("--out", default=None, help="output directory (default: public/mix.wav + build/stems + public/mix_report.json)")
    ap.add_argument("--vo", default=None)
    a = ap.parse_args()
    build(a.timeline, a.out, a.vo)
