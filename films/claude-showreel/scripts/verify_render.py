#!/usr/bin/env python3
"""Verify the rendered reel against the brief: format, loudness, picture/sound sync, cuts, stillness, contact sheet.

Usage: python3 -I scripts/verify_render.py [out/render/claude-showreel.mp4]
Writes out/render/verify.json and out/render/contact-sheet.jpg; exits 1 if a hard check fails.
"""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
MP4 = sys.argv[1] if len(sys.argv) > 1 else "out/render/claude-showreel.mp4"
CUES = json.load(open("src/cues.json"))
FPS, DUR = CUES["fps"], CUES["duration"]
V = CUES["visual"]


def probe():
    out = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", MP4],
                                    capture_output=True, text=True, check=True).stdout)
    vs = next(s for s in out["streams"] if s["codec_type"] == "video")
    aus = [s for s in out["streams"] if s["codec_type"] == "audio"]
    nb = int(vs.get("nb_frames") or 0)
    return {"width": vs["width"], "height": vs["height"], "fps": vs["r_frame_rate"], "frames": nb, "video_codec": vs["codec_name"],
            "pix_fmt": vs.get("pix_fmt"), "duration_s": round(float(out["format"]["duration"]), 3),
            "audio": {"codec": aus[0]["codec_name"], "rate": int(aus[0]["sample_rate"]), "channels": aus[0]["channels"]} if aus else None,
            "size_mb": round(int(out["format"]["size"]) / 1e6, 1)}


def loudness():
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", MP4, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return {"integrated_lufs": float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1]), "true_peak_dbtp": float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)[-1])}


def onsets():
    """Measured audio onset vs. cue for the beats the picture lands on (kicks on bars, ball contacts, the final hit)."""
    sr = 48000
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", MP4, "-map", "0:a:0", "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).astype(np.float64)
    hop = 48  # 1 ms
    env = np.sqrt(np.convolve(x * x, np.ones(hop) / hop, mode="same"))[::hop]
    cues = sorted(set([1.0, 3.0, 5.0, 7.0, 9.0, 11.0, 13.0] + V["c1"]["contacts"] + V["c4"]["contacts"] + [V["c3"]["words"][2][0]]))
    res = []
    for c in cues:
        i0, i1 = int((c - 0.03) * 1000), int((c + 0.04) * 1000)
        seg = env[i0:i1]
        d = np.diff(seg)
        k = int(np.argmax(d))
        res.append({"cue": c, "onset": round((i0 + k) / 1000, 3), "offset_ms": round((i0 + k) / 1000 * 1000 - c * 1000, 1)})
    return res


def sync():
    """Muxed audio vs the master soundtrack (whose events sit on the cue sheet's exact samples): cross-correlation lag."""
    sr = 48000
    def rd(path):
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout
        return np.frombuffer(raw, np.float32).astype(np.float64)
    a, b = rd("assets/audio/soundtrack.wav"), rd(MP4)
    lags = []
    for t0 in (1.0, 5.0, 9.0, 13.0):
        x, y = a[int(t0 * sr):int((t0 + 1.5) * sr)], b[int(t0 * sr):int((t0 + 1.5) * sr)]
        M = 1 << int(np.ceil(np.log2(2 * len(x))))
        c = np.fft.irfft(np.fft.rfft(y, M) * np.conj(np.fft.rfft(x, M)), M)
        l = int(np.argmax(np.abs(c)))
        lags.append({"section_s": t0, "lag_ms": round((l if l < M // 2 else l - M) / sr * 1000, 2)})
    return lags


def frames_gray(scale=(240, 135)):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", MP4, "-vf", f"scale={scale[0]}:{scale[1]}:flags=area,format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, scale[1], scale[0]).astype(np.float32)


def motion(g):
    d = np.abs(np.diff(g, axis=0)).mean(axis=(1, 2))  # mean abs change between consecutive frames (0..255)
    # hard-cut test: a frame whose change is an isolated spike (much larger than both neighbours' changes)
    spikes = []
    for i in range(1, len(d) - 1):
        nb = max(d[i - 1], d[i + 1], 0.5)
        if d[i] > 18 and d[i] > 4 * nb:
            spikes.append({"t": round((i + 1) / FPS, 3), "change": round(float(d[i]), 1), "neighbours": round(float(nb), 1)})
    # stillness: longest run of (near) identical frames
    still = d < 0.05
    runs, cur, start = [], 0, 0
    for i, s in enumerate(still):
        if s:
            if cur == 0:
                start = i
            cur += 1
        else:
            if cur:
                runs.append((start, cur))
            cur = 0
    if cur:
        runs.append((start, cur))
    longest = max(runs, key=lambda r: r[1]) if runs else (0, 0)
    top = np.argsort(d)[::-1][:6]
    return {"max_change": round(float(d.max()), 1), "largest_changes": [{"t": round((i + 1) / FPS, 3), "change": round(float(d[i]), 1)} for i in sorted(top)],
            "isolated_spikes": spikes, "longest_still_run_frames": int(longest[1]), "longest_still_starts_s": round((longest[0] + 1) / FPS, 3)}


def contact_sheet():
    times = [0.0, 0.3, 0.9, 1.25, 2.25, 2.8, 3.6, 4.1, 4.95, 5.4, 5.97, 6.1, 6.7, 6.93, 7.05, 7.6, 8.1, 8.97,
             9.12, 9.6, 10.2, 10.6, 11.2, 12.1, 12.6, 12.93, 13.3, 13.55, 14.0, 14.98]
    w, h, cols = 480, 270, 5
    rows = (len(times) + cols - 1) // cols
    args, parts = [], []
    for i, t in enumerate(times):
        args += ["-ss", f"{t:.3f}", "-i", MP4]
        parts.append(f"[{i}:v]scale={w}:{h},drawtext=text='{t:.2f}s':x=8:y={h - 30}:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.55[v{i}]")
    layout = "|".join(f"{(i % cols) * w}_{(i // cols) * h}" for i in range(len(times)))
    flt = ";".join(parts) + ";" + "".join(f"[v{i}]" for i in range(len(times))) + f"xstack=inputs={len(times)}:layout={layout}[out]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args, "-filter_complex", flt, "-map", "[out]", "-frames:v", "1", "-q:v", "3",
                    "out/render/contact-sheet.jpg"], check=True)
    return "out/render/contact-sheet.jpg"


if __name__ == "__main__":
    p = probe()
    L = loudness()
    on = onsets()
    sy = sync()
    m = motion(frames_gray())
    sheet = contact_sheet()
    checks = {
        "format_1920x1080_60fps_900f": p["width"] == 1920 and p["height"] == 1080 and p["fps"] == "60/1" and p["frames"] == int(DUR * FPS),
        "audio_present": bool(p["audio"]),
        "loudness_-14_lufs": abs(L["integrated_lufs"] + 14) <= 0.5 and L["true_peak_dbtp"] <= -1.0,
        "audio_in_sync_with_master_±1ms": all(abs(l["lag_ms"]) <= 1.0 for l in sy),
        "no_hard_cuts": not m["isolated_spikes"],
        "never_still_over_0.5s": m["longest_still_run_frames"] <= FPS // 2,
    }
    report = {"file": MP4, "probe": p, "loudness": L, "sync_lags": sy, "envelope_onsets_informational": on, "motion": m, "contact_sheet": sheet, "checks": checks,
              "pass": all(checks.values())}
    json.dump(report, open("out/render/verify.json", "w"), indent=1)
    for k, v in checks.items():
        print(("PASS " if v else "FAIL ") + k)
    print(f"{p['frames']} frames · {p['duration_s']} s · {p['size_mb']} MB · {L['integrated_lufs']} LUFS / {L['true_peak_dbtp']} dBTP · "
          f"A/V lag {max(abs(l['lag_ms']) for l in sy)} ms · longest still {m['longest_still_run_frames']} f")
    sys.exit(0 if report["pass"] else 1)
