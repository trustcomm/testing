#!/usr/bin/env python3
"""Verify the delivery file against the brief: format and colour tags, loudness after AAC, picture/sound sync,
event onsets, no hard cuts, never still, plus a contact sheet every 0.5 s.

Usage: python3 -I scripts/verify.py [out/flow-state.mp4]
Writes out/verify.json and out/contact-sheet.jpg; exits 1 if a hard check fails.
"""
import json, os, re, struct, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
MP4 = sys.argv[1] if len(sys.argv) > 1 else "out/flow-state.mp4"
EV = json.load(open("build/events.json"))
FPS, TOTAL = EV["fps"], EV["total_frames"]
SR = 48000


def probe():
    out = json.loads(subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-show_streams", "-show_format", "-of", "json", MP4],
                                    capture_output=True, text=True, check=True).stdout)
    v = next(s for s in out["streams"] if s["codec_type"] == "video")
    a = next((s for s in out["streams"] if s["codec_type"] == "audio"), None)
    return {
        "video": {k: v.get(k) for k in ("codec_name", "profile", "width", "height", "r_frame_rate", "pix_fmt", "color_space", "color_primaries",
                                        "color_transfer", "color_range", "nb_read_frames", "bit_rate")},
        "audio": {k: a.get(k) for k in ("codec_name", "profile", "sample_rate", "channels", "bit_rate")} if a else None,
        "duration_s": round(float(out["format"]["duration"]), 3),
        "size_mb": round(int(out["format"]["size"]) / 1e6, 2),
    }


def faststart():
    """True when the moov box comes before mdat (playback can start before the whole file has downloaded)."""
    order = []
    with open(MP4, "rb") as fh:
        while True:
            hdr = fh.read(8)
            if len(hdr) < 8:
                break
            size, kind = struct.unpack(">I4s", hdr)
            if size == 1:
                size = struct.unpack(">Q", fh.read(8))[0]
                fh.seek(size - 16, 1)
            else:
                fh.seek(size - 8, 1)
            order.append(kind.decode("latin1"))
            if size == 0:
                break
    return order.index("moov") < order.index("mdat"), order


def loudness():
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", MP4, "-map", "0:a:0", "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return {"integrated_lufs": float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1]),
            "true_peak_dbtp": float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)[-1]),
            "lra_lu": float(re.findall(r"LRA:\s+(-?[\d.]+) LU", err)[-1])}


def pcm(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def sync(a, b):
    """Lag of the delivered audio (b) against the master score (a), by cross-correlation over several sections."""
    lags = []
    for t0 in (2.0, 9.0, 16.0, 22.0, 28.5):
        x, y = a[int(t0 * SR) : int((t0 + 1.5) * SR)], b[int(t0 * SR) : int((t0 + 1.5) * SR)]
        M = 1 << int(np.ceil(np.log2(2 * len(x))))
        c = np.fft.irfft(np.fft.rfft(y, M) * np.conj(np.fft.rfft(x, M)), M)
        l = int(np.argmax(np.abs(c)))
        lags.append({"section_s": t0, "lag_ms": round((l if l < M // 2 else l - M) / SR * 1000, 2)})
    return lags


def onsets(b):
    """Measured onset of the loudest event sounds vs their frame (informational: synthesized attacks take ~1–3 ms)."""
    hop = 48
    env = np.sqrt(np.convolve(b * b, np.ones(hop) / hop, mode="same"))[::hop]  # 1 ms resolution
    keys = [e for e in EV["events"] if e["type"] in ("drop", "sub", "chime")]
    res = []
    for e in keys:
        c = e["f"] / FPS
        i0, i1 = int((c - 0.02) * 1000), int((c + 0.04) * 1000)
        d = np.diff(env[i0:i1])
        k = int(np.argmax(d))
        res.append({"frame": e["f"], "type": e["type"], "offset_ms": round((i0 + k + 1) - c * 1000, 1)})
    return res


def motion():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", MP4, "-vf", "scale=135:240:flags=area,format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    g = np.frombuffer(raw, np.uint8).reshape(-1, 240, 135).astype(np.float32)
    d = np.abs(np.diff(g, axis=0)).mean(axis=(1, 2))
    spikes = [{"frame": i + 1, "change": round(float(d[i]), 2), "neighbours": round(float(max(d[i - 1], d[i + 1])), 2)}
              for i in range(1, len(d) - 1) if d[i] > 3 and d[i] > 3 * max(d[i - 1], d[i + 1], 0.3)]
    runs, cur = [], 0
    for s in d < 0.02:
        cur = cur + 1 if s else 0
        runs.append(cur)
    return {"frames": len(g), "mean_change": round(float(d.mean()), 3), "max_change": round(float(d.max()), 2),
            "max_change_frame": int(d.argmax()) + 1, "isolated_spikes": spikes, "longest_still_run_frames": int(max(runs) if runs else 0)}


def contact_sheet(path="out/contact-sheet.jpg"):
    vf = ("select='not(mod(n\\,30))',scale=180:320:flags=area,"
          "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='%{eif\\:n*30/60\\:d}.%{eif\\:mod(n*30\\,60)/6\\:d}s':"
          "x=4:y=300:fontsize=13:fontcolor=white,tile=11x6")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", MP4, "-vf", vf, "-frames:v", "1", "-vsync", "vfr", "-q:v", "3", path], check=True)
    return path


if __name__ == "__main__":
    p = probe()
    fs, boxes = faststart()
    L = loudness()
    a, b = pcm("build/score.wav"), pcm(MP4)
    sy = sync(a, b)
    on = onsets(b)
    m = motion()
    sheet = contact_sheet()
    v = p["video"]
    checks = {
        "format_1080x1920_60fps_1824f": v["width"] == 1080 and v["height"] == 1920 and v["r_frame_rate"] == "60/1" and int(v["nb_read_frames"]) == TOTAL,
        "h264_high_yuv420p": v["codec_name"] == "h264" and v["profile"] == "High" and v["pix_fmt"] == "yuv420p",
        "bt709_tv_range": (v["color_space"], v["color_primaries"], v["color_transfer"], v["color_range"]) == ("bt709", "bt709", "bt709", "tv"),
        "aac_48k_stereo_320k": bool(p["audio"]) and p["audio"]["codec_name"] == "aac" and p["audio"]["sample_rate"] == "48000"
        and p["audio"]["channels"] == 2 and abs(int(p["audio"]["bit_rate"]) - 320000) < 20000,
        "duration_30.4s": abs(p["duration_s"] - TOTAL / FPS) < 0.05,
        "faststart": fs,
        "loudness_-14_lufs": abs(L["integrated_lufs"] + 14) <= 0.5,
        "true_peak_below_-1_dbtp": L["true_peak_dbtp"] <= -1.0,
        "audio_in_sync_±1ms": all(abs(x["lag_ms"]) <= 1.0 for x in sy),
        "no_hard_cuts": not m["isolated_spikes"],
        "never_still_over_0.5s": m["longest_still_run_frames"] <= FPS // 2,
    }
    rep = {"file": MP4, "probe": p, "top_level_boxes": boxes, "loudness": L, "sync_lags": sy, "event_onsets": on, "motion": m,
           "contact_sheet": sheet, "checks": checks, "pass": all(checks.values())}
    json.dump(rep, open("out/verify.json", "w"), indent=1)
    for k, ok in checks.items():
        print(("PASS " if ok else "FAIL ") + k)
    print(f"{v['nb_read_frames']} frames · {p['duration_s']} s · {p['size_mb']} MB · {L['integrated_lufs']} LUFS / {L['true_peak_dbtp']} dBTP · "
          f"A/V lag ≤ {max(abs(x['lag_ms']) for x in sy)} ms · onsets {min(o['offset_ms'] for o in on)}…{max(o['offset_ms'] for o in on)} ms · "
          f"longest still {m['longest_still_run_frames']} f · flashes {[s['frame'] for s in m['isolated_spikes']]}")
    sys.exit(0 if rep["pass"] else 1)
