#!/usr/bin/env python3
"""Alarm5: audio QA.  Reads the stems + mix written by build_mix.py and checks them against the brief (sections 6 and 7).

    python3 scripts/qa_audio.py                       # the real film: public/mix.wav, build/stems (built first if missing) -> docs/SFX_EVENT_TABLE.md
    python3 scripts/qa_audio.py --build               # rebuild the mix first
    python3 scripts/qa_audio.py --timeline T.json --out DIR

The event table: for every audible SFX event, the expected frame (the visual hit) and the ACTUAL hit frame found in the sfx STEM by matched filtering
(the event's sound, pitched and gained exactly as the mixer does, is slid over the stem within +-8 frames; the peak of the amplitude-matched
correlation is where the sound really is, in samples).  FAIL if any |delta| > 1 frame.  Also: levels (voice LUFS, mix LUFS / true peak, SFX vs voice peak),
music duck depth under speech, the S10 drop, a per-word masking check, clipping / NaN, mono-fold.  Exit code 1 on any FAIL.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from scipy import ndimage, signal

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_mix as bm  # noqa: E402
from audiolib import BUILD, FPS, PUBLIC, ROOT, SFX_DIR, SPF, SR, bp, lin2db, lufs, peak_db, read_json, rms, true_peak_db  # noqa: E402

DOCS = ROOT / "docs"
SEARCH_FRAMES = 8
TOL_FRAMES = 1.0


# ---------------------------------------------------------------------------------------------------------------- locating an event inside the stem
def own_hit_seconds(name, index):
    """QA's own, independent estimate of where the hit of a sound is (from the wav file, not from index.json)"""
    x = bm.load_sfx(name)
    m = np.sqrt((x ** 2).sum(axis=1)) if x.ndim == 2 else np.abs(x)
    kind = index[name]["hitKind"]
    if kind == "start":
        env = ndimage.uniform_filter1d(m ** 2, 48, mode="nearest") ** 0.5
        head = env[:int(0.25 * SR)]
        if head.max() < 0.1 * env.max():  # a sound that fades in from silence: continuous, the spec says hit = 0
            return 0.0
        return float(np.argmax(head >= 0.25 * head.max()) / SR)
    if kind == "mark":  # the first moment the 2 ms envelope reaches 60 % of its maximum
        env = ndimage.uniform_filter1d(m ** 2, 96, mode="nearest") ** 0.5
        return float(np.argmax(env >= 0.6 * env.max()) / SR)
    if kind == "peak":  # the middle of the region within 2 dB of the maximum (50 ms envelope)
        env = ndimage.uniform_filter1d(m ** 2, int(0.050 * SR), mode="nearest") ** 0.5
        idx = np.nonzero(env >= 0.8 * env.max())[0]
        return float((idx[0] + idx[-1]) / 2 / SR)
    env = ndimage.uniform_filter1d(m ** 2, int(0.025 * SR), mode="nearest") ** 0.5  # end: the climax of a build, the last moment within 1.5 dB of the maximum
    return float(np.nonzero(env >= 0.84 * env.max())[0][-1] / SR)


def locate(stem_mono, out, start, hit_sample, post=0.4):
    """matched filter: where (in samples) is the hit of this event really?  The sound (pitched / gained / panned exactly as the mixer does, folded to mono)
    is slid over the stem within +-8 frames; score = normalised correlation x an amplitude-match penalty (a == 1 when the stem holds exactly this sound
    at this level; the penalty stops fade-in sounds from sliding to a later, louder lag).
    returns (actual hit sample (float), amplitude ratio a, number of competing peaks)"""
    tpl = out.mean(axis=1)
    n = len(stem_mono)
    clip_lo = max(0, -start)
    tpl = tpl[clip_lo:]
    st0 = start + clip_lo  # expected start in the stem (>= 0)
    tpl = tpl[:max(0, n - st0)]
    if len(tpl) < 8 or np.max(np.abs(tpl)) < 1e-7:
        return None, 0.0, 0
    h_in = hit_sample - st0
    lo_t = int(max(0, h_in - 0.5 * SR))  # up to 0.5 s before the hit (risers) ...
    hi_t = int(min(len(tpl), h_in + post * SR))  # ... and `post` s after it
    tpl = tpl[lo_t:hi_t]
    h_in -= lo_t
    S = SEARCH_FRAMES * SPF
    lo = st0 + lo_t - S
    pad = np.zeros(2 * S + len(tpl))
    a0, a1 = max(lo, 0), min(lo + len(pad), n)
    pad[a0 - lo:a1 - lo] = stem_mono[a0:a1]
    c = signal.correlate(pad, tpl, mode="valid", method="fft")
    cs = np.concatenate([[0.0], np.cumsum(pad * pad)])
    e = cs[len(tpl):len(tpl) + len(c)] - cs[:len(c)]
    tn2 = float(tpl @ tpl)
    ncc = np.where(e > 1e-3 * tn2, c / (np.sqrt(np.maximum(e, 1e-30)) * np.sqrt(tn2)), 0.0)  # a (near-)silent stem window cannot be a match (FFT noise would blow ncc up)
    ncc = np.clip(ncc, -1.0, 1.0)
    a = c / tn2
    score = ncc * np.exp(-1.5 * np.abs(np.log(np.clip(np.abs(a), 1e-3, 1e3))))
    j = int(np.argmax(score))
    pk, _ = signal.find_peaks(score, height=max(0.6 * score[j], 0.2), distance=int(0.004 * SR))
    if len(pk) > 1:  # identical-sounding neighbours: take the strong local maximum nearest the expected position
        j = int(pk[np.argmin(np.abs(pk - S))])
    jf = float(j)
    if 0 < j < len(score) - 1:  # parabolic refinement to a fraction of a sample
        y0, y1, y2 = score[j - 1], score[j], score[j + 1]
        den = y0 - 2 * y1 + y2
        if abs(den) > 1e-12:
            jf = j + 0.5 * (y0 - y2) / den
    return lo + jf + h_in, float(a[j]), int(len(pk))


# ---------------------------------------------------------------------------------------------------------------- checks
def load_stems(stem_dir):
    import soundfile as sf
    out = {}
    for k in ("voice", "sfx", "music", "music_pre"):
        out[k], sr = sf.read(str(stem_dir / f"{k}.wav"), always_2d=True)
        assert sr == SR
    return out


class Report:
    def __init__(self):
        self.lines, self.fails, self.warns = [], [], []

    def out(self, s=""):
        print(s)
        self.lines.append(s)

    def check(self, ok, label, detail="", warn=False):
        tag = "PASS" if ok else ("WARN" if warn else "FAIL")
        if not ok:
            (self.warns if warn else self.fails).append(label)
        self.out(f"  [{tag}] {label}" + (f": {detail}" if detail else ""))


def run_qa(timeline_path: Path, out_dir: Path | None, md_path: Path, strict: bool = True):
    """strict (the real film): level / masking problems FAIL.  Not strict (the synthetic test timeline puts every sound at gain 0 on arbitrary frames, often on quiet words):
    they are reported as WARN; the timing, clipping, true peak, structure and loudness checks always FAIL."""
    tl = read_json(timeline_path)
    meta = tl["meta"]
    n_total = meta["totalFrames"] * SPF
    if out_dir is None:
        mix_path, stem_dir, rep_path = PUBLIC / "mix.wav", BUILD / "stems", PUBLIC / "mix_report.json"
    else:
        mix_path, stem_dir, rep_path = out_dir / "mix.wav", out_dir / "stems", out_dir / "mix_report.json"
    import soundfile as sf
    mix, sr = sf.read(str(mix_path), always_2d=True)
    assert sr == SR
    st = load_stems(stem_dir)
    rp = read_json(rep_path)
    index = json.loads((SFX_DIR / "index.json").read_text())
    R = Report()
    R.out(f"# PHP2Shell audio QA: {timeline_path.name}, {len(tl['sfx'])} sound events, {n_total / SR:.3f} s ({meta['totalFrames']} frames)")
    R.out("")

    # ---------------- 0. the sound library
    R.out("## SFX library (public/sfx)")
    import re
    import soundfile as sf2
    spec_txt = (ROOT / "src" / "sfx.ts").read_text()
    spec = {m.group(1): float(m.group(2)) for m in re.finditer(r'^\s*([a-z0-9_]+):\s*\{\s*hit:\s*"(?:start|peak|end)",\s*dur:\s*"([0-9.]+)\s*s"', spec_txt, re.M)}
    problems = []
    for name, dur in spec.items():
        p = SFX_DIR / f"{name}.wav"
        if name not in index or not p.exists():
            problems.append(f"{name}: missing")
            continue
        x, sr_ = sf2.read(str(p), always_2d=True)
        m = x.mean(axis=1)
        e = index[name]
        if sr_ != SR or abs(len(x) / SR - dur) > 2 / SR:
            problems.append(f"{name}: {len(x) / SR:.3f} s at {sr_} Hz (spec {dur} s at 48000)")
        if not np.isfinite(x).all():
            problems.append(f"{name}: NaN/inf")
        pk = peak_db(x)
        if not -1.1 <= pk <= -0.9:
            problems.append(f"{name}: peak {pk:.2f} dBFS")
        if abs(float(m.mean())) > 0.02 * float(np.abs(m).max()):  # short transients are one-sided (0.5-1% of the peak is legit): a real DC offset would be several %
            problems.append(f"{name}: DC {m.mean():.4f} ({100 * m.mean() / np.abs(m).max():.1f}% of peak)")
        if np.abs(x[0]).max() > 0.01 or np.abs(x[-1]).max() > 0.002:
            problems.append(f"{name}: does not start/end at silence ({np.abs(x[0]).max():.4f} / {np.abs(x[-1]).max():.5f}): would click")
        if not 0 <= e["hit"] < e["dur"] or e["stereo"] != (x.shape[1] == 2):
            problems.append(f"{name}: index.json hit/stereo inconsistent")
    R.check(not problems and len(spec) > 0, f"all {len(spec)} sounds of SFX_SPEC exist: 48 kHz, spec duration, peak -1 dBFS, no DC, silent first/last sample, no NaN", "; ".join(problems[:6]))

    # ---------------- 0b. files
    R.out("")
    R.out("## Files")
    cur = {"timeline": bm.sha(timeline_path), "sfxIndex": bm.sha(SFX_DIR / "index.json"), "vo": bm.sha(PUBLIC / "vo.mp3"), "musicDark": bm.sha(PUBLIC / "music_dark.wav"), "musicWarm": bm.sha(PUBLIC / "music_warm.wav")}
    stale = [k for k, v in cur.items() if rp.get("inputs", {}).get(k) != v and not (k == "vo" and False)]
    R.check(not stale, "the mix is up to date with its inputs (timeline.json, sfx/index.json, vo.mp3, music)", ("changed since the mix was built: " + ", ".join(stale) + " -> run scripts/build_mix.py") if stale else "hashes match")
    R.check(len(mix) == n_total, "mix length is exactly totalFrames/60 s", f"{len(mix)} samples = {len(mix) / SR:.4f} s (need {n_total})")
    R.check(all(len(v) == n_total for v in st.values()), "stems are the same length and sample-aligned with the mix", ", ".join(f"{k}={len(v)}" for k, v in st.items()))
    finite = all(np.isfinite(a).all() for a in [mix, *st.values()])
    R.check(finite, "no NaN / inf in mix or stems")
    R.check(mix.shape[1] == 2, "mix is stereo", f"{mix.shape[1]} channels, 48 kHz, 24-bit")
    # voice alignment: the first word starts at its timeline time
    w0 = tl["words"][0]
    vmono = st["voice"].mean(axis=1)
    onset = int(np.argmax(np.abs(vmono) > 0.02 * np.max(np.abs(vmono))))
    R.check(abs(onset / SR - (w0["start"] - 0.05)) < 0.12, "voice stem is placed after the 0.4 s lead-in", f"first sound at {onset / SR:.3f} s, first word '{w0['text']}' at {w0['start']:.3f} s")

    # ---------------- 1. voice + mix levels
    R.out("")
    R.out("## Levels")
    v = vmono
    v_l_st = lufs(st["voice"])
    v_l_mono = lufs(v)
    R.check(abs(v_l_st - bm.VOICE_LUFS) <= 0.3, "voice LUFS (BS.1770, the stereo voice stem as it sits in the mix)", f"{v_l_st:.2f} LUFS (target {bm.VOICE_LUFS}); as a mono file {v_l_mono:.2f} LUFS")
    vpk = peak_db(st["voice"])
    R.out(f"  voice: peak {vpk:.2f} dBFS, true peak {true_peak_db(st['voice'][:, 0]):.2f} dBTP, crest {vpk - 20 * np.log10(rms(v) + 1e-12):.1f} dB (raw vo.mp3 crest {rp['voice']['rawCrestDb']:.1f} dB), "
          f"compressor GR mean {rp['voice']['compGrMeanDb']:.1f} / max {rp['voice']['compGrMaxDb']:.1f} dB, limiter GR max {rp['voice']['limiterGrMaxDb']:.1f} dB")
    mix_l = lufs(mix)
    tp = true_peak_db(mix)
    eb = bm.ffmpeg_ebur128(mix_path)
    R.out(f"  mix: integrated {mix_l:.2f} LUFS (ffmpeg ebur128: {eb.get('integrated')}), loudness range {eb.get('lra')} LU, sample peak {peak_db(mix):.2f} dBFS, true peak {tp:.2f} dBTP (ffmpeg {eb.get('truePeak')})")
    R.check(tp <= -1.0 and (eb.get("truePeak", -99) <= -1.0), "mix true peak <= -1 dBTP (4x oversampled, and ffmpeg ebur128)", f"{tp:.2f} / {eb.get('truePeak')}")
    R.check(-14.5 <= mix_l <= -11.5, "mix integrated loudness near the voice's (about -14 .. -12 LUFS)", f"{mix_l:.2f} LUFS ({mix_l - v_l_st:+.2f} LU over the voice alone)", warn=True)
    clip_n = int(np.sum(np.abs(mix) >= 0.999))
    R.check(clip_n == 0 and peak_db(mix) < -0.9, "no clipping in the mix", f"{clip_n} samples at full scale, peak {peak_db(mix):.2f} dBFS")
    R.check(all(peak_db(st[k]) < -0.5 for k in ("voice", "sfx", "music")), "no clipping in the stems", ", ".join(f"{k} {peak_db(st[k]):.1f} dBFS" for k in ("voice", "sfx", "music")))
    sfx_pk = peak_db(st["sfx"])
    margin = vpk - sfx_pk
    # mono fold
    mid = mix.mean(axis=1)
    rl, rr = rms(mix[:, 0]), rms(mix[:, 1])
    fold = 20 * np.log10(rms(mid) / (np.sqrt((rl ** 2 + rr ** 2) / 2) + 1e-12))
    folds = {k: 20 * np.log10(rms(st[k].mean(axis=1)) / (np.sqrt((rms(st[k][:, 0]) ** 2 + rms(st[k][:, 1]) ** 2) / 2) + 1e-12)) for k in ("sfx", "music")}
    R.check(fold > -1.5, "mono-fold sanity (L+R)/2 keeps the level: no phase cancellation", f"mix {fold:+.2f} dB, sfx {folds['sfx']:+.2f} dB, music {folds['music']:+.2f} dB (0 dB = dual mono)")

    # ---------------- 2. the event table
    R.out("")
    R.out("## SFX event table (expected visual-hit frame vs the hit actually found in the sfx stem)")
    sfx_mono = st["sfx"].mean(axis=1)
    rows = []
    bad_index = []
    for name in sorted({e["sfx"] for e in tl["sfx"]}):
        oh = own_hit_seconds(name, index)
        if abs(oh - index[name]["hit"]) > 0.02:
            bad_index.append((name, oh, index[name]["hit"]))
    for e in tl["sfx"]:
        out, start, hit_sample, info = bm.render_event(e, index, vpk)
        pk = peak_db(out) if len(out) else -120.0
        vpc = max(0.0, next((r["voicePriorityCutDb"] for r in rp["events"] if r["id"] == e["id"]), 0.0)) + 0.0
        row = {"vp": vpc, "id": e["id"], "scene": e["scene"], "sfx": e["sfx"], "frame": e["frame"], "pk": pk, "under": vpk - pk, "note": e.get("note", ""), "gain": float(e.get("gainDb", 0) or 0), "pan": float(e.get("pan", 0) or 0), "cut": bool(e.get("frames"))}
        if pk < -75.0:
            row.update(status="inaudible", actual=None, df=None, dms=None, a=None)
        else:
            act, a, ncomp = locate(sfx_mono, out, start, hit_sample, post=2.0 if index[e['sfx']]['hit'] < 0.05 and index[e['sfx']]['dur'] > 2.0 else 0.4)
            if act is None or a < 0.4:
                row.update(status="FAIL: not found", actual=None, df=None, dms=None, a=a)
            else:
                af = act / SPF
                df = af - e["frame"]
                row.update(actual=af, df=df, dms=df * 1000 / FPS, a=a, status="ok" if abs(df) <= TOL_FRAMES else "FAIL")
                if row["status"] == "FAIL":  # identical or louder neighbours can pull the matched filter off: cancel their exact renders from the stem and look again
                    neigh = [(o, st_, hs_) for k, o2 in enumerate(tl["sfx"]) if o2 is not e and abs(o2["frame"] - e["frame"]) <= 24
                             for o, st_, hs_, _ in [bm.render_event(o2, index, vpk)] if len(o)]
                    resid = sfx_mono.copy()
                    for o, st_, _hs in neigh:
                        a0, a1 = max(0, st_), min(len(resid), st_ + len(o))
                        if a1 > a0:
                            resid[a0:a1] -= o.mean(axis=1)[a0 - st_:a1 - st_]
                    act2, a2, _n2 = locate(resid, out, start, hit_sample, post=2.0 if index[e['sfx']]['hit'] < 0.05 and index[e['sfx']]['dur'] > 2.0 else 0.4)
                    if act2 is not None and a2 >= 0.4 and abs(act2 / SPF - e["frame"]) <= TOL_FRAMES:
                        af = act2 / SPF
                        df = af - e["frame"]
                        row.update(actual=af, df=df, dms=df * 1000 / FPS, a=a2, status=f"ok (cancelled {len(neigh)} neighbours)")
        rows.append(row)
    audible = [r for r in rows if r["status"] != "inaudible"]
    fails = [r for r in audible if r["status"].startswith("FAIL")]
    maxd = max((abs(r["df"]) for r in audible if r["df"] is not None), default=0.0)
    R.out(f"  {len(rows)} events, {len(audible)} audible, {len(rows) - len(audible)} inaudible (< -75 dBFS); worst |delta| = {maxd:.3f} frames = {maxd * 1000 / FPS:.2f} ms")
    R.check(not fails, "every audible SFX event lands within +-1 frame of its visual hit", f"{len(fails)} failing" if fails else f"all {len(audible)} within {maxd:.3f} frames")
    n_vp = sum(1 for r in rows if r["vp"] > 1.0)
    R.out(f"  voice-priority duck (SFX speech band {bm.VP_BAND[0]:.0f} Hz-{bm.VP_BAND[1] / 1000:.1f} kHz kept >= {bm.VP_MARGIN_DB:.0f} dB under the voice, cut <= {bm.VP_MAX_CUT_DB:.0f} dB): {n_vp} of {len(rows)} events were turned down by more than 1 dB in that band (deepest {max((r['vp'] for r in rows), default=0):.1f} dB); "
          + ", ".join(f"{r['id']} {r['vp']:.1f} dB" for r in sorted(rows, key=lambda r: -r['vp'])[:4] if r["vp"] > 1.0))
    nominal = [r for r in rows if r["gain"] == 0 and r["pan"] == 0 and not r["cut"] and r["status"] != "inaudible"]
    if nominal:
        un = np.array([r["under"] for r in nominal])
        R.check(bool(np.all((un > bm.SFX_UNDER_DB - 1.0) & (un < bm.SFX_UNDER_DB + 1.0))), f"calibration: a gainDb 0 centred event peaks {bm.SFX_UNDER_DB:.0f} dB under the voice peak ({len(nominal)} such events)",
                f"{un.min():.2f} .. {un.max():.2f} dB under the voice peak ({vpk:.2f} dBFS)")
    loud = max(rows, key=lambda r: -r["under"])
    R.out(f"  loudest single event: {loud['id']} ({loud['sfx']}, gain {loud['gain']:+.0f} dB, pan {loud['pan']:+.1f}) peaks {loud['under']:.1f} dB under the voice peak")
    R.check(loud["under"] >= 8.0, "no single event is louder than 8 dB under the voice peak (a hard pan adds up to +3 dB in one channel)", f"{loud['under']:.1f} dB", warn=not strict)
    i_pk = int(np.argmax(np.abs(st["sfx"]).max(axis=1)))
    act = sorted([r for r in rows if r["status"] != "inaudible" and abs(r["frame"] * SPF - i_pk) < 1.5 * SR], key=lambda r: r["under"])[:3]
    R.check(8.0 <= margin <= 12.5, "SFX bus peaks 8-12 dB under the voice peak even where events stack (brief: 8-12 dB)",
            f"loudest SFX moment {sfx_pk:.2f} dBFS = {margin:.1f} dB under the voice peak ({vpk:.2f}); at {i_pk / SR:.2f} s, events near: " + ", ".join(f"{r['id']} ({r['under']:.0f} dB)" for r in act), warn=not strict)
    # --- pre-roll: every camera move has its whoosh audible 6-12 frames BEFORE the move starts (the file's own audible start is in index.json)
    MOVE_SFX = {"flyto_whoosh", "dolly_dive", "dolly_out", "up_whoosh", "dig_drop", "pullback_whoosh", "whoosh"}
    pr_rows, pr_bad = [], []
    for tr in tl["camera"]["travels"]:
        if tr["to"] - tr["from"] < 40 and not any(e["sfx"] in ("dolly_dive", "dig_drop") and tr["from"] - 30 <= e["frame"] <= tr["to"] + 6 for e in tl["sfx"]):
            continue
        cands = []
        for e in tl["sfx"]:
            if e["sfx"] in MOVE_SFX and tr["from"] - 90 <= e["frame"] <= tr["to"] + 6:
                m = index[e["sfx"]]
                pre = tr["from"] - (e["frame"] - (m["hit"] - m["audibleStart"]) * FPS)
                cands.append((abs(pre - 9), e["id"], pre))
        if not cands:
            pr_bad.append(f"move {tr['from']}-{tr['to']}: no whoosh")
            continue
        _, eid, pre = min(cands)
        pr_rows.append((tr["from"], tr["to"], eid, pre))
        if not 5.0 <= pre <= 13.0:
            pr_bad.append(f"move {tr['from']}-{tr['to']}: {eid} is audible {pre:.1f} frames before it")
    R.check(not pr_bad, f"every camera move has a pre-rolled whoosh, audible 6-12 frames before it starts ({len(pr_rows)} moves)", "; ".join(pr_bad[:6]) if pr_bad else ", ".join(f"{a}: {p:.0f}f" for a, _, _, p in pr_rows))
    # --- stereo placement: every panned event sits on its side; the travel pans (panTo) really sweep
    pan_bad = []
    for e in tl["sfx"]:
        pn, pt = float(e.get("pan", 0) or 0), e.get("panTo")
        out_e, _s, _h, _i = bm.render_event(e, index, vpk)
        if not len(out_e):
            continue
        L, Rr = rms(out_e[:, 0]), rms(out_e[:, 1])
        if pt is not None:
            h = int(index[e["sfx"]]["hit"] * SR)
            a, b = max(1, h // 2), min(len(out_e), h * 2)
            first, last = (rms(out_e[:h // 3 + 1, 1]) - rms(out_e[:h // 3 + 1, 0])), (rms(out_e[h + h // 2:b, 1]) - rms(out_e[h + h // 2:b, 0]))
            if (float(pt) - pn) * (last - first) <= 0:
                pan_bad.append(f"{e['id']}: panTo {pn:+.1f}->{pt:+.1f} but the stem goes {first:+.3f}->{last:+.3f}")
        elif abs(pn) >= 0.3 and (pn > 0) != (Rr > L):
            pan_bad.append(f"{e['id']}: pan {pn:+.2f} but L {L:.4f} R {Rr:.4f}")
    R.check(not pan_bad, f"every SFX is panned by the on-screen x of its element ({sum(1 for e in tl['sfx'] if abs(float(e.get('pan', 0) or 0)) >= 0.3)} panned, {sum(1 for e in tl['sfx'] if e.get('panTo') is not None)} travel pans)", "; ".join(pan_bad[:5]))
    R.check(not bad_index, "index.json `hit` offsets agree with an independent analysis of each sound (+-20 ms)", "; ".join(f"{n}: own {o:.3f}s vs index {h:.3f}s" for n, o, h in bad_index))
    R.out("")
    hdr = "| id | scene | sfx | expected frame | actual frame | delta frames | delta ms | event peak dBFS | under voice peak dB | voice-priority cut dB | match | status |"
    R.out(hdr)
    R.out("|" + "|".join(["---"] * 12) + "|")
    for r in rows:
        if r["actual"] is None:
            R.out(f"| {r['id']} | {r['scene']} | {r['sfx']} | {r['frame']} | - | - | - | {r['pk']:.1f} | {r['under']:.1f} | {r['vp']:.1f} | - | {r['status']} |")
        else:
            R.out(f"| {r['id']} | {r['scene']} | {r['sfx']} | {r['frame']} | {r['actual']:.3f} | {r['df']:+.3f} | {r['dms']:+.2f} | {r['pk']:.1f} | {r['under']:.1f} | {r['vp']:.1f} | {r['a']:.2f} | {r['status']} |")

    # ---------------- 3. music: duck, drop, near silence
    R.out("")
    R.out("## Music")
    mu = tl["music"]
    words = tl["words"]
    mus, pre = st["music"].mean(axis=1), st["music_pre"].mean(axis=1)
    sf_rms_ok = []
    ducks = []
    for w in words:
        a, b = int((w["start"] + 0.35 * (w["end"] - w["start"])) * SR), int((w["end"] - 0.1 * (w["end"] - w["start"])) * SR)
        if b - a < 480:
            continue
        pr = rms(pre[a:b])
        if lin2db(pr) < -60 or lin2db(rms(st["sfx"][a:b].mean(axis=1))) > -48:
            continue  # no music there (S10 silence), or an SFX is dipping the music too: not a pure duck measurement
        ducks.append(lin2db(rms(mus[a:b]) / pr))
    if ducks:
        d50, d10, d90 = np.median(ducks), np.percentile(ducks, 10), np.percentile(ducks, 90)
        R.check(-11.0 <= d50 <= -7.5, "music ducks 8-10 dB under speech (median over words, SFX-free windows)", f"median {d50:.1f} dB (10-90%: {d10:.1f} .. {d90:.1f}) over {len(ducks)} words; "
                f"attack {rp['music']['duckAttackMs']:.0f} ms, release {rp['music']['duckReleaseMs']:.0f} ms; the 2 kHz carve is included")
    else:
        R.out("  (no word windows with music to measure the duck)")

    def lvl(t0, t1, x=mus):
        return lin2db(rms(x[int(t0 * SR):int(t1 * SR)]))
    td, th = mu["drop"] / FPS, mu["hopeStart"] / FPS
    pre_l = lvl(td - 0.5, td, pre)
    at_drop = [lvl(td + k / FPS, td + (k + 1) / FPS, pre) for k in range(0, 14)]
    sil = lvl(td + 6 / FPS + 0.01, th - 0.01, pre)
    R.out(f"  drop at frame {mu['drop']} ({td:.3f} s): bed level before {pre_l:.1f} dBFS; per frame after the drop: " + " ".join(f"{x:.0f}" for x in at_drop) + " dBFS")
    R.check(sil - pre_l <= -45.0, f"silence for the 12 frames before S13 (frames {mu['drop']}..{mu['hopeStart']})", f"music {sil:.1f} dBFS = {sil - pre_l:.1f} dB under the bed before the drop")
    R.check(at_drop[0] - pre_l > -8.0 and at_drop[8] - pre_l <= -45.0, "the drop is abrupt: the bed is gone within 8 frames", f"frame 0: {at_drop[0] - pre_l:.1f} dB, frame 8: {at_drop[8] - pre_l:.1f} dB")
    hope_l = lvl(th + 0.3, th + 3.0, pre)
    R.check(hope_l > pre_l - 15, "the warm resolved bed enters at S13 (`hopeStart`)", f"warm {hope_l:.1f} dBFS after hopeStart vs dark {pre_l:.1f} dBFS before the drop")
    tk0, tk1 = mu["tickStartSeconds"], mu["tickEndSeconds"]
    sos_h = signal.butter(2, 6500, btype="highpass", fs=SR, output="sos")
    hb = signal.sosfilt(sos_h, pre)
    R.check(lvl(tk0 + 1, tk1 - 1, hb) > lvl(1.0, tk0 - 0.5, hb) + 6, "the ticking hi-hat texture runs during the alarms 5 -> 1 (S3 .. S11)", f"hat band {lvl(tk0 + 1, tk1 - 1, hb):.1f} dBFS inside, {lvl(1.0, tk0 - 0.5, hb):.1f} dBFS before")
    end_l = lvl(meta["totalSeconds"] - 0.6, meta["totalSeconds"] - 0.05, pre)
    R.check(end_l < lvl(meta["totalSeconds"] - 8, meta["totalSeconds"] - 6, pre) - 12, "music fades out at the end", f"last 0.5 s {end_l:.1f} dBFS vs {lvl(meta['totalSeconds'] - 8, meta['totalSeconds'] - 6, pre):.1f} dBFS eight seconds earlier")

    # ---------------- 4. masking
    R.out("")
    R.out("## Masking (per spoken word: voice vs sfx + music, speech band 200 Hz - 5 kHz, voice-to-others ratio)")
    sos = signal.butter(2, (200, 5000), btype="bandpass", fs=SR, output="sos")
    vb = signal.sosfilt(sos, v)
    ob = signal.sosfilt(sos, (st["sfx"] + st["music"]).mean(axis=1))
    sb = signal.sosfilt(sos, st["sfx"].mean(axis=1))
    mb = signal.sosfilt(sos, st["music"].mean(axis=1))
    mrows = []
    fr, hop = int(0.020 * SR), int(0.010 * SR)
    word_rms = {id(w): lin2db(rms(v[int(w["start"] * SR):int(w["end"] * SR)])) for w in words if int(w["end"] * SR) - int(w["start"] * SR) >= 480}
    med_word = float(np.median(list(word_rms.values())))
    skipped, short = [], []
    for w in words:
        a, b = int(w["start"] * SR), int(w["end"] * SR)
        if b - a < 480:
            continue
        if b - a < int(0.09 * SR):  # 50-90 ms alignment windows ('se', 'pe', 'ka') are not a perceptual unit: their phrase carries them
            short.append(w["text"])
            continue
        if word_rms[id(w)] < med_word - 24.0:  # the aligner's window sits on a trailing gap, not on speech
            skipped.append(w["text"])
            continue
        # local SNR over the frames where the voice is really speaking (within 20 dB of the word's loudest frame): the silent gaps inside an
        # alignment window are not 'speech' and cannot be masked
        starts = np.arange(a, max(a + 1, b - fr), hop)
        pv = np.array([np.mean(vb[k:k + fr] ** 2) for k in starts])
        if pv.max() < 1e-10:
            continue
        act = pv > pv.max() * 0.01
        def band(x):
            return np.array([np.mean(x[k:k + fr] ** 2) for k in starts])
        pv_a, po_a, pm_a, ps_a = pv[act].sum(), band(ob)[act].sum(), band(mb)[act].sum(), band(sb)[act].sum()
        mrows.append((10 * np.log10(pv_a / (po_a + 1e-18)), 10 * np.log10(pv_a / (pm_a + 1e-18)), 10 * np.log10(pv_a / (ps_a + 1e-18)), w))
    mrows.sort(key=lambda r: r[0])
    worst = mrows[:8]
    R.out("  worst 8 words: " + "; ".join(f"'{w['text']}' ({w['scene']} {w['start']:.2f}s) {s:.1f} dB" for s, _, _, w in worst))
    R.out(f"  not judged: {len(short)} alignment windows shorter than 90 ms ('se', 'pe', 'ka': their phrase carries them) and {len(skipped)} windows whose voice level is > 24 dB under the median word (a pause, not speech: {' '.join(skipped[:8])})")
    R.out(f"  all {len(mrows)} words: median voice-to-others {np.median([r[0] for r in mrows]):.1f} dB (music alone {np.median([r[1] for r in mrows]):.1f} dB)")
    R.check(worst[0][0] >= 6.0 if mrows else True, "no word is masked (voice >= 6 dB over sfx + music in the speech band)", f"worst {worst[0][0]:.1f} dB on '{worst[0][3]['text']}' ({worst[0][3]['scene']} {worst[0][3]['start']:.2f} s)" if mrows else "", warn=not strict)
    R.check(worst[0][0] >= 10.0 if mrows else True, "comfortable: every word >= 10 dB over sfx + music", f"{sum(1 for r in mrows if r[0] < 10)} word(s) between 6 and 10 dB", warn=True)
    R.out("")
    R.out("## Summary")
    R.out(f"  RESULT: {'FAIL' if R.fails else 'PASS'}" + (f" ({len(R.fails)} failing: {'; '.join(R.fails)})" if R.fails else "") + (f"; {len(R.warns)} warning(s): {'; '.join(R.warns)}" if R.warns else ""))

    # ---------------- the markdown table
    md = ["# SFX event table", "",
          f"Generated by `scripts/qa_audio.py` from `{timeline_path.relative_to(ROOT) if timeline_path.is_relative_to(ROOT) else timeline_path}`: {len(rows)} sound events, {len(audible)} audible. "
          f"expected = the frame of the visual hit (src/cues); actual = where the hit really is in the SFX stem (matched filter, sub-sample). **FAIL if |delta| > 1 frame.**", "",
          f"**Result: {'FAIL' if R.fails else 'PASS'}** | worst delta {maxd:.3f} frames ({maxd * 1000 / FPS:.2f} ms) | voice {v_l_st:.2f} LUFS | mix {mix_l:.2f} LUFS, {tp:.2f} dBTP | "
          f"SFX peak {margin:.1f} dB under the voice peak", "",
          "| id | scene | sfx | expected frame | actual frame | delta frames | delta ms | event peak dBFS | under voice peak dB | voice-priority cut dB | status |", "|" + "|".join(["---"] * 11) + "|"]
    for r in rows:
        if r["actual"] is None:
            md.append(f"| {r['id']} | {r['scene']} | {r['sfx']} | {r['frame']} | - | - | - | {r['pk']:.1f} | {r['under']:.1f} | {r['vp']:.1f} | {r['status']} |")
        else:
            md.append(f"| {r['id']} | {r['scene']} | {r['sfx']} | {r['frame']} | {r['actual']:.3f} | {r['df']:+.3f} | {r['dms']:+.2f} | {r['pk']:.1f} | {r['under']:.1f} | {r['vp']:.1f} | {r['status']} |")
    md += ["", "## Other checks", "", "```", *[ln for ln in R.lines if not ln.startswith("|") and not ln.startswith("# ") ], "```", ""]
    md_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.write_text("\n".join(md))
    R.out(f"  wrote {md_path}")
    return R


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--timeline", default=None)
    ap.add_argument("--out", default=None)
    ap.add_argument("--build", action="store_true", help="(re)build the mix first")
    ap.add_argument("--md", default=None)
    ap.add_argument("--check-determinism", action="store_true", help="build the mix twice and compare sha256")
    a = ap.parse_args()
    real_tl = PUBLIC / "timeline.json"
    timeline = Path(a.timeline) if a.timeline else real_tl
    out_dir = Path(a.out) if a.out else None
    md = Path(a.md) if a.md else (DOCS / "SFX_EVENT_TABLE.md" if out_dir is None else out_dir / "SFX_EVENT_TABLE.md")
    mix_path = (out_dir / "mix.wav") if out_dir else PUBLIC / "mix.wav"
    if a.build or not mix_path.exists():
        bm.build(timeline, out_dir)
    if a.check_determinism:
        h1 = hashlib.sha256(mix_path.read_bytes()).hexdigest()
        bm.build(timeline, out_dir, verbose=False)
        h2 = hashlib.sha256(mix_path.read_bytes()).hexdigest()
        print(f"determinism: sha256 {h1[:16]} / {h2[:16]} -> {'IDENTICAL' if h1 == h2 else 'DIFFERENT'}")
        if h1 != h2:
            return 1
    R = run_qa(timeline, out_dir, md, strict=True)
    return 1 if R.fails else 0


if __name__ == "__main__":
    sys.exit(main())
