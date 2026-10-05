"""beats.py: the hero film's beat timeline as data (beats.json), audio-first.

Starts from the BRIEF §4 beat sheet (60 s, 124 BPM grid) and applies the user's decisions:
- 2026-10-05: Beat 8 is lengthened to fit the chosen VO8 take (no speed-up, no cut languages):
  length = VO8 speech end + 0.30 s tail, rounded UP to whole beats (0.484 s) so every later cut stays on the grid.
  Later beats shift by the difference; no other beat is shortened (the 60 s question is open, see STATE.md).
- The six language flips land on the spoken language names in the VO8 take (onsets found from the gaps between
  words), 1 frame ahead of the sound (picture leads audio). The voice reads the names at an even pace, so the flip
  intervals follow the voice; the acceleration is carried by each flip's transition getting shorter (0.30 → 0.08 s)
  and the SFX07 tick-pop rising in pitch on each flip.
Each VO file starts at its beat's start (voIn/voOut; voFits checks it ends inside the beat).
Picks come from vo/picks.json (the user's) if present, else the pre-picks in vo/takes/takes.json.

Hinglish (`beats.py hi` → beats_hi.json, user 2026-10-05): the same rule for EVERY beat, audio-first — a beat whose
chosen VO*_hi take ends (speech end + 0.30 s) past the beat's brief length grows to fit, rounded up to whole beats.
That is Beat 2 (VO2_hi) and Beat 8; every other beat keeps its brief length. Language flips use the VO8_hi take.
"""
import json
import math
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30  # provisional: the brief fixes 1920×1080 but no frame rate
BPM = 124
BEAT = 60 / BPM
TAIL = 0.30
LEAD_FRAMES = 1
LANGS = ["English", "Hinglish", "Hindi", "Kannada", "Tamil", "Telugu"]
# BRIEF §4: (beat, start, end, VO line)
SHEET = [(1, 0.0, 3.9), (2, 3.9, 6.8), (3, 6.8, 9.7), (4, 9.7, 11.6), (5, 11.6, 15.5), (6, 15.5, 19.4), (7, 19.4, 23.2), (8, 23.2, 27.1),
         (9, 27.1, 31.0), (10, 31.0, 34.8), (11, 34.8, 38.7), (12, 38.7, 42.6), (13, 42.6, 46.5), (14, 46.5, 50.3), (15, 50.3, 54.2), (16, 54.2, 60.0)]


def speech_segments(p):
    """Speech segments of a VO8 take: the lead phrase + six language names = 7 segments. Sweep the silence threshold
    until exactly 7 segments of >= 0.12 s appear, each name <= 0.8 s; fail loudly otherwise (then word timing needs a transcript)."""
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)
    for db in (-38, -36, -40, -34, -42, -32):
        for d in (0.06, 0.05, 0.08, 0.04):
            e = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(p), "-af", f"silencedetect=n={db}dB:d={d}", "-f", "null", "-"], capture_output=True, text=True).stderr
            s = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", e)]
            en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", e)]
            sil = list(zip(s, en + [dur] * (len(s) - len(en))))
            edges, t = [], 0.0
            for a, b in sil:
                if a > t:
                    edges.append((t, a))
                t = b
            if t < dur - 0.03:
                edges.append((t, dur))
            segs = [x for x in edges if x[1] - x[0] >= 0.12]
            if len(segs) == 7 and all(b - a <= 0.8 for a, b in segs[1:]):  # a single language name is short
                return segs, {"thresholdDb": db, "minGap": d}
    raise SystemExit(f"{p.name}: could not split into lead phrase + 6 language names; needs a word-timed transcript")


def speech_end(p):
    """End of the last speech in a file (trailing silence under -40 dB trimmed)."""
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)
    e = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(p), "-af", "silencedetect=n=-40dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
    s = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", e)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", e)]
    tail = [a for a, b in zip(s, en + [dur] * (len(s) - len(en))) if b >= dur - 0.05]
    return tail[0] if tail else dur


def main():
    import sys
    lang = sys.argv[1] if len(sys.argv) > 1 else "en"
    suf = "_hi" if lang == "hi" else ""
    user = ROOT / "vo" / f"picks{suf}.json"
    picks = json.loads(user.read_text()) if user.exists() else {k: v["take"] for k, v in json.loads((ROOT / "vo" / "takes" / f"takes{suf}.json").read_text())["picks"].items()}
    picks = {k.replace("_hi", ""): v for k, v in picks.items()}
    vo8 = ROOT / "vo" / "takes" / picks["VO8"]
    segs, how = speech_segments(vo8)
    end8 = segs[-1][1]
    beats8 = math.ceil((end8 + TAIL) / BEAT - 1e-9)
    len8 = beats8 * BEAT
    delta = len8 - (SHEET[7][2] - SHEET[7][1])

    grown = {}
    if lang == "hi":
        for n, a, b in SHEET:
            if n == 8:
                continue
            end = speech_end(ROOT / "vo" / "takes" / picks[f"VO{n}"]) + TAIL
            if end > (b - a) + 1e-9:  # the voice really overruns the brief's beat (not just beat-grid rounding)
                grown[n] = math.ceil(end / BEAT - 1e-9) * BEAT
    beats, t = [], 0.0
    for n, a, b in SHEET:
        L = len8 if n == 8 else grown.get(n, b - a)
        vlen = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(ROOT / "vo" / "takes" / picks[f"VO{n}"])], capture_output=True, text=True).stdout)
        beats.append({"beat": n, "vo": f"VO{n}{suf}", "voTake": picks[f"VO{n}"], "voIn": round(t, 4), "voOut": round(t + vlen, 4), "voFits": vlen <= L,
                      "start": round(t, 4), "end": round(t + L, 4), "dur": round(L, 4),
                      "startFrame": round(t * FPS), "briefStart": a, "shiftedBy": round(t - a, 4)})
        t += L
    flips = []
    for i, (lang, (on, _)) in enumerate(zip(LANGS, segs[1:])):
        f = round(on * FPS) - LEAD_FRAMES
        flips.append({"lang": lang, "voOnset": round(on, 3), "frameInBeat": f, "atSec": round(beats[7]["start"] + f / FPS, 4),
                      "transition": round(0.30 - (0.30 - 0.08) * i / 5, 3), "tickPopSemitones": 2 * i})
    for a, b in zip(beats, beats[1:] + [None]):
        a["endFrame"] = b["startFrame"] if b else round(t * FPS)
    gaps = [round(b["atSec"] - a["atSec"], 3) for a, b in zip(flips, flips[1:])]
    beats[7].update({"lengthenedFor": f"{picks['VO8']} speech ends {end8:.3f} s + {TAIL} s tail → {beats8} beats", "segmentation": how,
                     "flips": flips, "flipGaps": gaps, "holdAfterLastFlip": round(beats[7]["end"] - flips[-1]["atSec"], 3)})
    for n, L in grown.items():
        beats[n - 1]["lengthenedFor"] = f"{picks[f'VO{n}']} ends past the brief's {SHEET[n - 1][2] - SHEET[n - 1][1]:.1f} s → {round(L / BEAT)} beats"
    out = {"film": f"trustcomm-launch hero ({lang})", "lang": lang, "provisional": True, "fps": FPS, "bpm": BPM, "beat": round(BEAT, 5),
           "picksFrom": user.name if user.exists() else "pre-picks", "duration": round(t, 4), "frames": round(t * FPS), "overBriefBy": round(delta, 4), "beats": beats}
    (ROOT / f"beats{suf}.json").write_text(json.dumps(out, indent=1))
    if grown:
        print("grown (audio-first): " + ", ".join(f"Beat {n} → {L:.3f} s" for n, L in grown.items()))
    over = [b["beat"] for b in beats if not b["voFits"]]
    if over:
        print(f"WARNING: VO file runs past its beat in beats {over}")
    b8 = beats[7]
    print(f"Beat 8: {b8['dur']:.3f} s ({beats8} beats; was 3.9 s) for {picks['VO8']} (speech ends {end8:.2f} s). Film {t:.3f} s (+{delta:.3f} s vs brief).")
    print("flips (s into beat 8): " + "  ".join(f"{x['lang']} {x['frameInBeat'] / FPS:.2f}" for x in flips) + f" · gaps {gaps} · hold after last flip {b8['holdAfterLastFlip']} s")


if __name__ == "__main__":
    main()
