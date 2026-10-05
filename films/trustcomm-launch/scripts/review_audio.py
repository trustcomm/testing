"""review_audio.py [en|hi]: phone-friendly listening files for the user's review (not for delivery).

vo/review/VOn_takes.mp3   t1, t2, t3 back to back; before take k: k short beeps (so you always know which take plays).
vo/review/picks_reel.mp3  the 16 current picks in order, 0.5 s silence between.
sfx/review/SFX_all.mp3    per ID: v1, v2, synth fallback (1, 2, 3 beeps before each); a low tone + 1 s gap between IDs.
                          Cue sheet with timestamps: sfx/review/SFX_all.txt.
Every VO clip has its leading/trailing silence trimmed and is gain-matched to -16 LUFS (limiter at -1 dBTP) so takes
compare on performance, not level. SFX clips are peak-normalised to -3 dBFS (gain capped at +12 dB). Source files are not changed.
Picks come from vo/picks.json if present (the user's), else vo/takes/takes.json (pre-picks); SFX picks from sfx/picks.json.
"""
import json
import re
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 44100


def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def trim(x, db=-45):
    on = np.flatnonzero(np.abs(x) > 10 ** (db / 20))
    if not len(on):
        return x
    a, b = max(0, on[0] - int(0.02 * SR)), min(len(x), on[-1] + int(0.05 * SR))
    return x[a:b]


def lufs(p):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(p), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS", e[e.rfind("Summary:"):]).group(1))


def vo_clip(p):
    x = trim(load(p)) * 10 ** ((-16 - lufs(p)) / 20)
    lim = 10 ** (-1.5 / 20)
    return np.where(np.abs(x) > lim, np.sign(x) * (lim + (1 - lim) * np.tanh((np.abs(x) - lim) / (1 - lim))), x)


def sfx_clip(p):
    x = load(p)
    pk = np.abs(x).max()
    return x * min(10 ** (-3 / 20) / pk, 10 ** (12 / 20)) if pk > 0 else x  # cap +12 dB: a near-silent take stays near-silent


def sil(s):
    return np.zeros(int(s * SR))


def tone(f, s, db):
    t = np.arange(int(s * SR)) / SR
    return np.sin(2 * np.pi * f * t) * 10 ** (db / 20) * np.minimum(1, np.minimum(t, s - t) / 0.01)


def beeps(n):
    out = [sil(0.35)]
    for _ in range(n):
        out += [tone(1000, 0.08, -20), sil(0.1)]
    return np.concatenate(out + [sil(0.25)])


def write(x, p):
    p.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "libmp3lame", "-b:a", "160k", str(p)],
                   input=x.astype(np.float64).tobytes(), check=True)
    return len(x) / SR


import sys
LANG = sys.argv[1] if len(sys.argv) > 1 else "en"
SUF = "_hi" if LANG == "hi" else ""

# --- VO per line ---
for n in range(1, 17):
    parts = []
    for k in (1, 2, 3):
        parts += [beeps(k), vo_clip(ROOT / "vo" / "takes" / f"VO{n}{SUF}_t{k}.mp3")]
    write(np.concatenate(parts + [sil(0.5)]), ROOT / "vo" / "review" / f"VO{n}{SUF}_takes.mp3")

# --- picks reel ---
user = ROOT / "vo" / f"picks{SUF}.json"
picks = json.loads(user.read_text()) if user.exists() else {k: v["take"] for k, v in json.loads((ROOT / "vo" / "takes" / f"takes{SUF}.json").read_text())["picks"].items()}
reel = []
for n in range(1, 17):
    reel += [vo_clip(ROOT / "vo" / "takes" / picks[f"VO{n}{SUF}"]), sil(0.5)]
d = write(np.concatenate(reel), ROOT / "vo" / "review" / f"picks_reel{SUF}.mp3")
print(f"picks_reel{SUF}.mp3 {d:.1f} s from {user.name if user.exists() else 'pre-picks'}: " + " ".join(f"{k}={v[-6:-4]}" for k, v in picks.items()))
if LANG == "hi":
    raise SystemExit  # SFX review is language-independent (already built)

# --- SFX ---
spicks = json.loads((ROOT / "sfx" / "picks.json").read_text())["picks"]
parts, cues, t = [], [], 0.0
for n in range(1, 13):
    sid = f"SFX{n:02d}"
    srcs = [ROOT / "sfx" / "takes" / f"{sid}_v1.mp3", ROOT / "sfx" / "takes" / f"{sid}_v2.mp3", ROOT / "sfx" / "synth" / f"{sid}_synth.wav"]
    head = np.concatenate([tone(330, 0.25, -18), sil(0.75)])
    parts.append(head)
    t += len(head) / SR
    for k, s in enumerate(srcs, 1):
        b = beeps(k)
        c = sfx_clip(s)
        cues.append(f"{t + len(b) / SR:7.2f} s  {sid} {['v1', 'v2', 'synth'][k - 1]:5}  ({s.relative_to(ROOT)}){'  ← current pick' if spicks[sid] == str(s.relative_to(ROOT)) else ''}")
        parts += [b, c, sil(0.3)]
        t += (len(b) + len(c)) / SR + 0.3
d = write(np.concatenate(parts), ROOT / "sfx" / "review" / "SFX_all.mp3")
(ROOT / "sfx" / "review" / "SFX_all.txt").write_text("SFX_all.mp3 cue sheet. Low tone = next SFX ID; 1/2/3 beeps = v1 / v2 / synth.\n\n" + "\n".join(cues) + "\n")
print(f"SFX_all.mp3 {d:.1f} s")
