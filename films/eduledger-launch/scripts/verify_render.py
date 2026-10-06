#!/usr/bin/env python3
"""Verify the rendered film against the plan. Usage: python3 -I scripts/verify_render.py [video]

Default video: out/draft/eduledger-launch-draft.mp4. Writes out/verify/:
  report.json            format, frame count, cut-by-cut match, stillness, loudness of the delivered audio
  contact-2fps-*.jpg     2 fps contact sheets (Stage E review / Stage F)
  cuts-*.jpg             one strip per cut: frames −6, −3, −1, 0, +1, +3, +6 around the planned cut
Cut check: the plan's cut frame vs the frame where the picture changes most within ±4 frames (luma, 192×108,
grain-blurred). A motion transition (whip, glitch, stomp) peaks on its cut frame; ±1 frame passes.
"""
import json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
VID = sys.argv[1] if len(sys.argv) > 1 else "out/draft/eduledger-launch-draft.mp4"
OUT = "out/verify"
os.makedirs(OUT, exist_ok=True)
tl = json.load(open("timeline.json"))
FPS = tl["fps"]

probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", VID],
                                  capture_output=True, text=True, check=True).stdout)
v = next(s for s in probe["streams"] if s["codec_type"] == "video")
a = next((s for s in probe["streams"] if s["codec_type"] == "audio"), None)
W, H = 192, 108
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", VID, "-vf", f"scale={W}:{H}:flags=area,gblur=sigma=1.2,format=gray",
                      "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
n = len(fr)
diff = np.r_[0, np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))]          # diff[k] = change from frame k−1 to k

# ---------------------------------------------------------------- cuts
cuts = []
for s in tl["shots"][1:]:
    k = int(round(s["start"] * FPS))
    lo, hi = max(1, k - 4), min(n - 1, k + 4)
    j = lo + int(np.argmax(diff[lo:hi + 1]))
    local = np.median(diff[max(1, k - 30):min(n, k + 30)])
    cuts.append({"shot": s["id"], "planned_s": s["start"], "planned_frame": k, "peak_frame": j, "offset_frames": j - k,
                 "peak_change": round(float(diff[j]), 2), "local_median": round(float(local), 2),
                 "ok": abs(j - k) <= 1})
# unplanned hard changes: big spikes away from every planned cut (± 6 frames)
planned = np.array([c["planned_frame"] for c in cuts])
thr = max(12.0, float(np.percentile(diff, 99.5)))
spikes = [int(k) for k in np.where(diff > thr)[0] if np.min(np.abs(planned - k)) > 6]

# ---------------------------------------------------------------- stillness (P6: ≤ 20 % near-still, in the holds)
still = diff < 0.35
still_pct = round(100 * float(still.mean()), 1)
runs, k = [], 0
while k < n:
    if still[k]:
        j = k
        while j < n and still[j]:
            j += 1
        if j - k >= FPS // 2:
            runs.append([round(k / FPS, 2), round(j / FPS, 2)])
        k = j
    else:
        k += 1

# ---------------------------------------------------------------- loudness of the delivered audio
lu = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", VID, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-"],
                    capture_output=True, text=True).stderr
I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", lu)[-1])
TP = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", lu)[-1])
LRA = float(re.findall(r"LRA:\s+(-?[\d.]+) LU", lu)[-1])

# ---------------------------------------------------------------- contact sheets + cut strips
try:
    font = ImageFont.truetype("web/assets/fonts/Inter-SemiBold.otf", 18)
except OSError:
    font = ImageFont.load_default()
def grab(times, size):
    """Full-colour frames at the given film times (seconds), scaled to size."""
    ims = []
    for t in times:
        b = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(0, t):.4f}", "-i", VID, "-frames:v", "1",
                            "-vf", f"scale={size[0]}:{size[1]}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                           capture_output=True, check=True).stdout
        ims.append(Image.frombytes("RGB", size, b))
    return ims
for f in os.listdir(OUT):
    if f.endswith(".jpg"):
        os.remove(os.path.join(OUT, f))
shot_at = lambda t: next(s["id"] for s in reversed(tl["shots"]) if s["start"] <= t + 1e-6)
# 2 fps: one frame every 0.5 s, 6 columns × 6 rows per sheet
times = [i / 2 + 0.25 for i in range(int(tl["length_s"] * 2))]
TW, TH, C, R = 320, 180, 6, 6
sheets = []
for p in range(0, len(times), C * R):
    chunk = times[p:p + C * R]
    sheet = Image.new("RGB", (C * TW, R * (TH + 24)), (18, 18, 22))
    d = ImageDraw.Draw(sheet)
    for i, (t, im) in enumerate(zip(chunk, grab(chunk, (TW, TH)))):
        x, y = (i % C) * TW, (i // C) * (TH + 24)
        sheet.paste(im, (x, y + 24))
        d.text((x + 6, y + 3), f"{t:5.2f}s  {shot_at(t)}", fill=(230, 230, 235), font=font)
    name = f"{OUT}/contact-2fps-{p // (C * R) + 1}.jpg"
    sheet.save(name, quality=86)
    sheets.append(name)
# cut strips: 7 frames per cut, 9 cuts per image
OFFS = [-6, -3, -1, 0, 1, 3, 6]
SW, SH = 240, 135
strips = []
for p in range(0, len(cuts), 9):
    chunk = cuts[p:p + 9]
    img = Image.new("RGB", (len(OFFS) * SW + 150, len(chunk) * (SH + 6)), (18, 18, 22))
    d = ImageDraw.Draw(img)
    for r, c in enumerate(chunk):
        y = r * (SH + 6)
        d.text((8, y + 8), f"{c['shot']}", fill=(240, 240, 245), font=font)
        d.text((8, y + 34), f"{c['planned_s']:.3f}s", fill=(170, 175, 190), font=font)
        d.text((8, y + 60), f"peak {c['offset_frames']:+d} f", fill=(120, 220, 160) if c["ok"] else (240, 90, 90), font=font)
        frames = grab([(c["planned_frame"] + o) / FPS + 0.5 / FPS for o in OFFS], (SW, SH))
        for i, im in enumerate(frames):
            img.paste(im, (150 + i * SW, y))
            if OFFS[i] == 0:
                d.rectangle([150 + i * SW, y, 150 + (i + 1) * SW - 1, y + SH - 1], outline=(110, 140, 255), width=3)
    name = f"{OUT}/cuts-{p // 9 + 1}.jpg"
    img.save(name, quality=86)
    strips.append(name)

expected = int(round(tl["length_s"] * FPS))
report = {
    "video": VID, "size_mb": round(os.path.getsize(VID) / 1e6, 1),
    "format": {"width": v["width"], "height": v["height"], "fps": v["r_frame_rate"], "frames": n, "expected_frames": expected,
               "duration_s": float(probe["format"]["duration"]), "vcodec": v["codec_name"], "pix_fmt": v.get("pix_fmt"),
               "acodec": a and a["codec_name"], "audio_rate": a and a.get("sample_rate"), "audio_channels": a and a.get("channels")},
    "cuts": {"planned": len(cuts), "within_1_frame": sum(c["ok"] for c in cuts), "rows": cuts, "unplanned_spikes_frames": spikes},
    "stillness": {"near_still_pct": still_pct, "runs_over_0_5s": runs},
    "audio": {"integrated_lufs": I, "true_peak_dbtp": TP, "lra_lu": LRA, "pass": bool(abs(I + 14) <= 0.5 and TP < -1.0)},
    "sheets": sheets, "strips": strips,
}
json.dump(report, open(f"{OUT}/report.json", "w"), indent=1)
print(f"{VID}: {v['width']}×{v['height']} @ {v['r_frame_rate']}, {n} frames (expected {expected}), {report['size_mb']} MB")
print(f"cuts on plan ±1 frame: {report['cuts']['within_1_frame']}/{len(cuts)}; unplanned spikes at frames {spikes}")
for c in cuts:
    if not c["ok"]:
        print(f"  {c['shot']}: planned frame {c['planned_frame']}, peak {c['peak_frame']} ({c['offset_frames']:+d})")
print(f"near-still frames {still_pct}% · runs ≥ 0.5 s: {runs}")
print(f"audio {I} LUFS, true peak {TP} dBTP, LRA {LRA} LU → {'PASS' if report['audio']['pass'] else 'FAIL'}")
