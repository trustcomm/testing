#!/usr/bin/env python3
"""Verify a rendered Leader reel: format, loudness after AAC, picture/sound sync, hand-off pops, stillness, contact sheet.

Usage: python3 -I scripts/verify_render.py renders/leader-reel.mp4
Writes build/verify.json and build/verify-sheet.jpg; exits 1 if a hard check fails.
"""
import json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
MP4 = sys.argv[1] if len(sys.argv) > 1 else "renders/leader-reel.mp4"
src = open("src/cues.js").read()
CUES = json.loads(src.split("/* CUES-JSON-BEGIN */")[1].split("/* CUES-JSON-END */")[0].split("=", 1)[1].strip().rstrip(";"))
DUR = CUES["duration"]
HANDOFFS = [w["t0"] for w in CUES["worlds"][1:]]


def probe():
    out = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", MP4], capture_output=True, text=True, check=True).stdout)
    vs = next(s for s in out["streams"] if s["codec_type"] == "video")
    aus = [s for s in out["streams"] if s["codec_type"] == "audio"]
    num, den = map(int, vs["r_frame_rate"].split("/"))
    return {"width": vs["width"], "height": vs["height"], "fps": num / den, "frames": int(vs.get("nb_frames") or 0), "codec": vs["codec_name"],
            "pix_fmt": vs.get("pix_fmt"), "color_space": vs.get("color_space"), "duration_s": round(float(out["format"]["duration"]), 3),
            "audio": {"codec": aus[0]["codec_name"], "rate": int(aus[0]["sample_rate"]), "channels": aus[0]["channels"], "bit_rate": aus[0].get("bit_rate")} if aus else None,
            "size_mb": round(int(out["format"]["size"]) / 1e6, 1)}


def loudness():
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", MP4, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    return {"integrated_lufs": float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1]), "true_peak_dbtp": float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)[-1])}


def sync():
    sr = 48000
    def rd(path):
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout
        return np.frombuffer(raw, np.float32).astype(np.float64)
    a, b = rd("assets/audio/score.wav"), rd(MP4)
    lags = []
    for t0 in (0.0, 3.5, 7.4, 11.1, 13.0):
        x, y = a[int(t0 * sr):int((t0 + 1.5) * sr)], b[int(t0 * sr):int((t0 + 1.5) * sr)]
        M = 1 << int(np.ceil(np.log2(2 * len(x))))
        c = np.fft.irfft(np.fft.rfft(y, M) * np.conj(np.fft.rfft(x, M)), M)
        l = int(np.argmax(np.abs(c)))
        lags.append({"section_s": t0, "lag_ms": round((l if l < M // 2 else l - M) / sr * 1000, 2)})
    return lags


def frames_gray(scale=(240, 135)):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", MP4, "-vf", f"scale={scale[0]}:{scale[1]}:flags=area,format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, scale[1], scale[0]).astype(np.float32)


def motion(g, fps):
    d = np.abs(np.diff(g, axis=0)).mean(axis=(1, 2))
    spikes = []
    for i in range(1, len(d) - 1):
        nb = max(d[i - 1], d[i + 1], 0.5)
        if d[i] > 18 and d[i] > 3.0 * nb:
            spikes.append({"t": round((i + 1) / fps, 3), "change": round(float(d[i]), 1), "neighbours": round(float(nb), 1)})
    # longest run of (near-)still frames
    still, run, best_at = 0, 0, 0
    for i, v in enumerate(d):
        run = run + 1 if v < 0.15 else 0
        if run > still:
            still, best_at = run, i
    handoffs = []
    for h in HANDOFFS:
        i = int(round(h * fps)) - 1
        if 0 <= i < len(d):
            handoffs.append({"t": h, "change_at_cut": round(float(d[i]), 1), "median_around": round(float(np.median(d[max(0, i - 6):i + 6])), 1)})
    return {"spikes": spikes, "longest_still_frames": still, "still_run_ends_s": round((best_at + 1) / fps, 3), "handoffs": handoffs, "mean_change": round(float(d.mean()), 2)}


def sheet(fps):
    times = [0.25, 0.9, 1.6, 2.3, 2.9, 3.5, 4.3, 5.0, 5.9, 6.6, 7.4, 8.4, 9.0, 9.6, 10.2, 10.8, 11.4, 12.0, 12.6, 13.4, 13.9, 14.3, 14.7, 14.97]
    tiles = []
    for t in times:
        t = min(t, DUR - 1.5 / fps)
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", MP4, "-frames:v", "1", "-vf", "scale=384:216", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
        tiles.append((t, Image.frombytes("RGB", (384, 216), raw)))
    cols = 6
    rows = (len(tiles) + cols - 1) // cols
    S = Image.new("RGB", (cols * 390 + 6, rows * 240 + 6), (20, 20, 24))
    d = ImageDraw.Draw(S)
    for i, (t, im) in enumerate(tiles):
        x, y = 6 + (i % cols) * 390, 6 + (i // cols) * 240
        S.paste(im, (x, y + 18))
        d.text((x + 2, y + 2), f"{t:.2f}s", fill=(255, 190, 120))
    S.save("build/verify-sheet.jpg", quality=88)


def main():
    p = probe()
    fps = p["fps"]
    L = loudness()
    s = sync()
    g = frames_gray()
    m = motion(g, fps)
    sheet(fps)
    rep = {"file": MP4, "probe": p, "loudness": L, "sync": s, "motion": m}
    hard = []
    if p["width"] != 1920 or p["height"] != 1080:
        hard.append("size")
    if abs(p["duration_s"] - DUR) > 0.05:
        hard.append("duration")
    if L["true_peak_dbtp"] > -1.0:
        hard.append("true peak")
    if abs(L["integrated_lufs"] + 14) > 1.0:
        hard.append("loudness")
    if any(abs(x["lag_ms"]) > 20 for x in s):
        hard.append("sync")
    rep["hard_failures"] = hard
    os.makedirs("build", exist_ok=True)
    json.dump(rep, open("build/verify.json", "w"), indent=1)
    print(json.dumps({"probe": p, "loudness": L, "sync": s, "spikes": m["spikes"], "handoffs": m["handoffs"], "longest_still_frames": m["longest_still_frames"], "hard_failures": hard}, indent=1))
    sys.exit(1 if hard else 0)


if __name__ == "__main__":
    main()
