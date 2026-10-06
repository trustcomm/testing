#!/usr/bin/env python3
"""Stage E mix: VO + SFX + ducked music → out/mix/master.wav at −14 LUFS, true peak below −1 dBTP.

Usage: python3 -I scripts/mix.py          (scripts/build_all.sh runs it between two builds)
Inputs : timeline.json (VO placements, SFX events), vo/L01–L14.wav, music/edit/bed.wav (from scripts/timeline.py)
         sfx/X01–X14: the real file when it lands, else the synth placeholder in sfx/placeholder/
Outputs: out/mix/master.wav (48 kHz, 24-bit stereo), stems out/mix/{vo,sfx,music}.wav, out/mix/report.json

Levels (BRIEF Stage E / MOTION_PHILOSOPHY §2.6): VO 1.0; SFX ~0.2–0.4 of the VO peak level; music sidechain-ducked
under the VO. Loudness: one linear gain to −14 LUFS, then a 4× oversampled peak limiter; measured again (ebur128, true peak).

Real SFX: sfx/X01.wav (your pick) wins over sfx/X01_v1.* and sfx/X01_v2.* (v1 is used when no pick exists).
The anchor (the instant inside the file that lands on the visual event) is found automatically: the onset for
hits and pops, the loudest point for the riser/impact X06, the whoosh X07 and the final impact X13.
Override any anchor in sfx/anchors.json, e.g. {"X11": 0.42}  (seconds into the file).
"""
import glob, json, os, re, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
os.makedirs("out/mix", exist_ok=True)
SR = 48000
TARGET_I = -14.0                              # true peak: below −1 dBTP after the AAC encode of the delivery file (checked below)
tl = json.load(open("timeline.json"))
N = int(round(tl["length_s"] * SR))

def load(path, ch):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).copy()
def write(path, x):
    x = x if x.ndim == 2 else x[:, None]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", str(x.shape[1]), "-i", "-",
                    "-c:a", "pcm_s24le", path], input=x.astype(np.float32).tobytes(), check=True)
def place(dst, x, t):
    k = int(round(t * SR))
    if k < 0:
        x, k = x[-k:], 0
    m = max(0, min(len(x), len(dst) - k))
    dst[k:k + m] += x[:m]
def env(x, win=0.010):
    w = max(1, int(win * SR))
    return np.sqrt(np.convolve(x.astype(np.float64) ** 2, np.ones(w) / w, mode="same"))

# ---------------------------------------------------------------- VO at 1.0 (files untouched; placement from timeline.json)
vo = np.zeros(N, np.float32)
for v in tl["vo"]:
    place(vo, load(v["file"], 1)[:, 0], v["start"])

# ---------------------------------------------------------------- SFX: real file or placeholder, auto anchor
PEAK_ANCHOR = {"X06", "X07", "X13"}
GAIN = {"X01": 0.4, "X02": 0.3, "X03": 0.3, "X04": 0.25, "X05": 0.3, "X06": 0.4, "X07": 0.25, "X08": 0.3,
        "X09": 0.2, "X10": 0.35, "X11": 0.3, "X12": 0.4, "X13": 0.4, "X14": 0.3}
ph_anch = json.load(open("sfx/placeholder/anchors.json"))
overrides = json.load(open("sfx/anchors.json")) if os.path.exists("sfx/anchors.json") else {}
AUDIO = ("wav", "mp3", "flac", "m4a", "ogg")
def real_sfx(xid):
    files = [p for p in glob.glob("sfx/*") if p.rsplit(".", 1)[-1].lower() in AUDIO]
    pick = [p for p in files if re.fullmatch(rf"{xid}\.\w+", os.path.basename(p), re.I)]
    vs = sorted(p for p in files if re.match(rf"{xid}[_\-. ]v?\d", os.path.basename(p), re.I))
    return (pick or vs or [None])[0]
def anchor_of(x, xid):
    e = env(x)
    if xid in PEAK_ANCHOR:
        return float(np.argmax(e)) / SR, "loudest point"
    thr = 0.1 * e.max()                                   # onset: first crossing of −20 dB re the file's peak envelope
    return float(np.argmax(e >= thr)) / SR, "onset"

sources, ref_peak = {}, 10 ** (-1 / 20)                   # every SFX is peak-normalised to −1 dBFS before its gain
for xid in sorted({e["sfx"] for e in tl["sfx"]}):
    path = real_sfx(xid)
    if path:
        x = load(path, 1)[:, 0]
        a, how = anchor_of(x, xid)
        status = "REAL"
    else:
        path = ph_anch[xid]["file"]; x = load(path, 1)[:, 0]
        a, how, status = ph_anch[xid]["anchor"], "placeholder table", "PLACEHOLDER"
    if xid in overrides:
        a, how = float(overrides[xid]), "sfx/anchors.json"
    pk = float(np.abs(x).max()) or 1.0
    sources[xid] = {"status": status, "file": path, "anchor_s": round(a, 3), "anchor_by": how, "gain": GAIN[xid],
                    "x": x * (ref_peak / pk) * GAIN[xid]}
sfx = np.zeros(N, np.float32)
for e in tl["sfx"]:
    s = sources[e["sfx"]]
    place(sfx, s["x"], e["t"] - s["anchor_s"])

# ---------------------------------------------------------------- stems, ducking, master
write("out/mix/vo.wav", vo)
write("out/mix/sfx.wav", sfx)
music = load(tl["music"]["bed"], 2)[:N]
if len(music) < N:
    music = np.vstack([music, np.zeros((N - len(music), 2), np.float32)])
write("out/mix/music-bed.wav", music)

# VO normalised to −16 LUFS (it is the 1.0 reference); SFX ride the same gain so their 0.2–0.4 stays relative to it.
def lufs(path):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)[-1])
    return i, tp
vo_i, _ = lufs("out/mix/vo.wav")
vo_gain_db = -16.0 - vo_i
g = 10 ** (vo_gain_db / 20)
# music: trimmed, then sidechain-compressed by the (gained) VO
DUCK = "sidechaincompress=threshold=0.03:ratio=4:attack=12:release=280:makeup=1"   # ≈ −7 dB under the voice
MUSIC_TRIM_DB = -6
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "out/mix/music-bed.wav", "-i", "out/mix/vo.wav", "-filter_complex",
                      f"[1:a]volume={vo_gain_db:.2f}dB,aformat=channel_layouts=stereo[sc];[0:a]volume={MUSIC_TRIM_DB}dB[m];[m][sc]{DUCK}",
                      "-ar", str(SR), "-ac", "2", "-f", "f32le", "-"], capture_output=True, check=True).stdout
ducked = np.frombuffer(raw, np.float32).reshape(-1, 2)[:N]
pre = ducked + (vo * g)[:, None] + (sfx * g)[:, None]
write("out/mix/premaster.wav", pre)
# master: one linear gain to −14 LUFS, then a 4× oversampled peak limiter (true-peak safe), re-measured; two rounds
gain_db, limit = 0.0, 10 ** (-1.6 / 20)
pre_i, pre_tp = lufs("out/mix/premaster.wav")
gain_db = TARGET_I - pre_i
# The film ships as AAC, whose decoder overshoots a little, so the true peak is measured on an AAC 320k encode too.
for rnd in range(5):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "out/mix/premaster.wav", "-af",
                    f"volume={gain_db:.3f}dB,aresample=192000,alimiter=limit={limit:.4f}:attack=0.5:release=40:level=false:asc=1,"
                    f"aresample={SR}", "-c:a", "pcm_s24le", "out/mix/master.wav"], check=True)
    I, TP = lufs("out/mix/master.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "out/mix/master.wav", "-c:a", "aac", "-b:a", "320k", "out/mix/master-aac.m4a"], check=True)
    I_aac, TP_aac = lufs("out/mix/master-aac.m4a")
    if abs(I - TARGET_I) <= 0.1 and TP < -1.0 and TP_aac <= -1.2:
        break
    gain_db += TARGET_I - I
    if TP_aac > -1.2:
        limit *= 10 ** ((-1.3 - TP_aac) / 20)
os.remove("out/mix/premaster.wav")
n2 = {"normalization_type": f"linear gain {gain_db:+.2f} dB + 4x-oversampled limiter at {20 * np.log10(limit):.1f} dBFS"}
m = {"input_i": pre_i, "input_tp": pre_tp}

# ---------------------------------------------------------------- measure the result
I, TP = lufs("out/mix/master.wav")
# how far the music sits under the voice while it speaks (ducked music vs. the trimmed bed, and VO over music)
speech = np.zeros(N, bool)
for v in tl["vo"]:
    a, b = v["speech"]; speech[int(a * SR):int(b * SR)] = True
rms_db = lambda x: 20 * np.log10(np.sqrt(np.mean(x.astype(np.float64) ** 2)) + 1e-12)
bed = music.mean(1) * 10 ** (MUSIC_TRIM_DB / 20)
duck_db = rms_db(ducked.mean(1)[speech]) - rms_db(bed[speech])
vo_over_music_db = rms_db((vo * g)[speech]) - rms_db(ducked.mean(1)[speech])
report = {"master": "out/mix/master.wav", "integrated_lufs": I, "true_peak_dbtp": TP,
          "aac_320k": {"integrated_lufs": I_aac, "true_peak_dbtp": TP_aac},
          "pass": bool(abs(I - TARGET_I) <= 0.5 and TP < -1.0 and TP_aac < -1.0),
          "mastering": n2["normalization_type"],
          "vo_gain_db": round(vo_gain_db, 2), "music_trim_db": MUSIC_TRIM_DB, "music_duck_under_vo_db": round(float(duck_db), 1),
          "vo_over_music_db": round(float(vo_over_music_db), 1), "pre_master": {"lufs": pre_i, "true_peak": pre_tp},
          "sfx": {k: {kk: vv for kk, vv in v.items() if kk != "x"} for k, v in sources.items()},
          "sfx_events": len(tl["sfx"])}
json.dump(report, open("out/mix/report.json", "w"), indent=1)
real = [k for k, v in sources.items() if v["status"] == "REAL"]
print(f"master {I:.1f} LUFS, true peak {TP:.1f} dBTP; as AAC 320k {I_aac:.1f} LUFS, {TP_aac:.1f} dBTP "
      f"({'PASS' if report['pass'] else 'FAIL'}; {n2['normalization_type']})")
print(f"VO {vo_gain_db:+.1f} dB to −16 LUFS · music {MUSIC_TRIM_DB} dB, ducked {duck_db:.1f} dB under the VO · "
      f"VO sits {vo_over_music_db:.1f} dB over the music · {len(tl['sfx'])} SFX events")
print(f"SFX REAL: {real or 'none'} · PLACEHOLDER: {[k for k in sources if k not in real]}")
