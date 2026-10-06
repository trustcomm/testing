#!/usr/bin/env python3
"""Stage A: how the reference films' cuts sync to sound.

1. YouTube showreel: offset of every verified cut from the 129 BPM grid (phase 0).
2. AIS Live ad: the burned-in captions highlight the spoken word in blue, so the
   highlight's jumps give the editor's own word timing. For every verified cut,
   the offset to the nearest word onset; plus a beat-grid test (best phase at the
   estimated tempo, and the same test on shuffled cut times as a baseline).
Usage: python3 -I scripts/study_sync.py <kit-root> <out-dir>
"""
import json, os, subprocess, sys
import numpy as np

kit, out = sys.argv[1], sys.argv[2]
show = os.path.join(kit, "examples/showcase/youtube-showreel.mp4")
ais = os.path.join(kit, "examples/showcase/ais-live-ad.mp4")

# verified by eye from frame strips (out/study/*/strips_*.png); frame = first frame of the new shot
YT_CUTS = [111, 167, 221, 279, 432, 446, 558, 614, 669, 697, 713, 725, 739, 753, 767, 781]
YT_FPS, YT_BPM = 60, 129
AIS_CUTS = [67, 106, 136, 186, 231, 296, 330, 369, 411, 439, 491, 568, 660, 709, 753, 779, 799, 848,
            876, 944, 989, 1043, 1073, 1114, 1176, 1274, 1328, 1379, 1419, 1450]
AIS_FPS = 30

def grid_off(t, period, phase=0.0):
    return ((t - phase + period / 2) % period) - period / 2

res = {}
P = 60 / YT_BPM
yt = []
for f in YT_CUTS:
    t = f / YT_FPS
    yt.append({"frame": f, "t": round(t, 3), "beat_ms": round(grid_off(t, P) * 1000),
               "half_ms": round(grid_off(t, P / 2) * 1000)})
res["showreel_cuts"] = yt
best = [min(abs(c["beat_ms"]), abs(c["half_ms"])) for c in yt]
res["showreel_summary"] = {"cuts": len(yt), "on_beat_or_half_within_35ms": sum(b <= 35 for b in best),
                           "median_abs_ms": float(np.median(best)), "max_abs_ms": max(best),
                           "on_full_beat_within_35ms": sum(abs(c["beat_ms"]) <= 35 for c in yt)}

# AIS caption word onsets from the blue highlight
W, H = 1080, 1920
y0, y1 = 1480, 1555
proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", ais, "-vf", f"crop={W}:{y1 - y0}:0:{y0}",
                         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
fb = W * (y1 - y0) * 3
cx, cnt = [], []
while True:
    buf = proc.stdout.read(fb)
    if len(buf) < fb:
        break
    a = np.frombuffer(buf, np.uint8).reshape(y1 - y0, W, 3).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (b > 150) & (b - r > 90) & (g > 110) & (g < b)
    n = int(m.sum()); cnt.append(n)
    cx.append(float(np.nonzero(m)[1].mean()) if n > 60 else None)
proc.wait()
onsets = []
for i in range(1, len(cx)):
    if cx[i] is None:
        continue
    if cx[i - 1] is None or abs(cx[i] - cx[i - 1]) > 25:
        onsets.append(i)
onsets_t = np.array(onsets) / AIS_FPS
res["ais_word_onsets_detected"] = len(onsets)
ais_rows = []
for f in AIS_CUTS:
    t = f / AIS_FPS
    k = int(np.argmin(np.abs(onsets_t - t)))
    ais_rows.append({"frame": f, "t": round(t, 3), "nearest_word_onset": round(float(onsets_t[k]), 3),
                     "word_ms": round((t - onsets_t[k]) * 1000)})
res["ais_cuts"] = ais_rows
offs = np.array([r["word_ms"] for r in ais_rows])
# baseline: random times give this median distance to the nearest onset
rng = np.random.default_rng(7)
rand = rng.uniform(1, 49, 4000)
base = np.median(np.min(np.abs(rand[:, None] - onsets_t[None, :]), axis=1) * 1000)
res["ais_word_summary"] = {"median_abs_ms": float(np.median(np.abs(offs))),
                           "within_1_frame_33ms": int((np.abs(offs) <= 34).sum()),
                           "within_2_frames_67ms": int((np.abs(offs) <= 67).sum()),
                           "random_baseline_median_ms": round(float(base)),
                           "median_gap_between_onsets_ms": round(float(np.median(np.diff(onsets_t)) * 1000))}

# AIS beat-grid test at the estimated 129.2 BPM: best phase vs shuffled baseline
def best_phase_err(times, period):
    errs = []
    for ph in np.linspace(0, period, 200, endpoint=False):
        e = np.abs([grid_off(t, period / 2, ph) for t in times])
        errs.append((float(np.median(e)), float(ph)))
    return min(errs)
ais_t = np.array(AIS_CUTS) / AIS_FPS
Pa = 60 / 129.2
m_err, ph = best_phase_err(ais_t, Pa)
shuf = [best_phase_err(rng.uniform(0, 49.7, len(ais_t)), Pa)[0] for _ in range(40)]
res["ais_beat_summary"] = {"bpm": 129.2, "best_phase_s": round(ph, 3), "median_abs_ms_to_half_beat": round(m_err * 1000),
                           "random_cuts_median_abs_ms": round(float(np.median(shuf)) * 1000)}

os.makedirs(out, exist_ok=True)
json.dump(res, open(os.path.join(out, "sync.json"), "w"), indent=1)
print(json.dumps({k: v for k, v in res.items() if k.endswith("summary") or k.endswith("detected")}, indent=1))
print("showreel cut offsets (beat/half ms):", [(c["t"], c["beat_ms"], c["half_ms"]) for c in yt])
print("AIS cut→word ms:", [r["word_ms"] for r in ais_rows])

# AIS: VO phrase onsets from the audio (speech band 300-3400 Hz; an onset is speech after >= 120 ms below threshold)
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", ais, "-ac", "1", "-ar", "16000", "-af", "highpass=f=300,lowpass=f=3400",
                      "-f", "s16le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
HOP = 160  # 10 ms
e = np.sqrt((x[:len(x) // HOP * HOP].reshape(-1, HOP) ** 2).mean(1) + 1e-12)
db = 20 * np.log10(e)
thr = np.percentile(db, 90) - 22
on = []
quiet = 0
for i, v in enumerate(db):
    if v < thr:
        quiet += 1
    else:
        if quiet >= 12:
            on.append(i * HOP / 16000)
        quiet = 0
on = np.array(on)
rows = []
for f in AIS_CUTS:
    t = f / AIS_FPS
    k = int(np.argmin(np.abs(on - t)))
    rows.append(round((t - on[k]) * 1000))
rand = rng.uniform(1, 49, 4000)
base = np.median(np.min(np.abs(rand[:, None] - on[None, :]), axis=1) * 1000)
res["ais_phrase_summary"] = {"threshold_db": round(float(thr), 1), "phrase_onsets": len(on),
                             "median_abs_ms": float(np.median(np.abs(rows))),
                             "within_100ms": int((np.abs(np.array(rows)) <= 100).sum()),
                             "within_200ms": int((np.abs(np.array(rows)) <= 200).sum()),
                             "random_baseline_median_ms": round(float(base)),
                             "cut_minus_phrase_onset_ms": rows}
json.dump(res, open(os.path.join(out, "sync.json"), "w"), indent=1)
print(json.dumps(res["ais_phrase_summary"], indent=1))
