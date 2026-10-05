"""vo_takes.py: measure every English VO take in vo/takes/ and pre-select one per line.

Per take: file length, speech span (silence < -40 dB trimmed at both ends), words per minute over the
speech span, integrated loudness / true peak (EBU R128), longest internal pause.
Pre-selection (a proposal only; nothing is moved to vo/): the take must fit its beat slot
(speech span <= slot - 0.3 s headroom); among those, the lowest cost of
  |wpm - 160| / 10  +  2 * (true peak > -1 dBTP)  +  max(0, longest pause - 0.6 s) * 5.
Writes vo/takes/takes.json and prints a markdown table.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
EN = {
    1: "Your happiest customers?", 2: "They pay, they smile… and they leave.", 3: "The loudest one writes the review.",
    4: "Meet Trustcomm.", 5: "One QR code on your counter.", 6: "Customers scan. No app. No sign-in.", 7: "They rate their visit…",
    8: "…in their own language. English. Hinglish. Hindi. Kannada. Tamil. Telugu.",
    9: "They pick what to mention. Nothing is ticked for them.", 10: "Then they choose.", 11: "Post on Google, in their own name…",
    12: "…or tell you privately.", 13: "Real reviews, from real customers.",
    14: "Hear from more of your customers. Not just the loudest ones.", 15: "Fourteen days free. No card needed.",
    16: "Trustcomm. Now across India. trustcomm dot app.",
}
# Beat slots from BRIEF §4 (seconds).
SLOT = {1: 3.9, 2: 2.9, 3: 2.9, 4: 1.9, 5: 3.9, 6: 3.9, 7: 3.8, 8: 3.9, 9: 3.9, 10: 3.8, 11: 3.9, 12: 3.9, 13: 3.9, 14: 3.8, 15: 3.9, 16: 5.8}
HEADROOM = 0.3


def measure(p):
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(p), "-af", "silencedetect=n=-40dB:d=0.12,ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    sil = list(zip(starts, ends + [dur] * (len(starts) - len(ends))))
    head = next((e for s, e in sil if s <= 0.01), 0.0)
    tail = next((s for s, e in sil if e >= dur - 0.05), dur)
    pauses = [e - s for s, e in sil if s > head + 0.01 and e < tail - 0.01]
    summ = err[err.rfind("Summary:"):]
    i = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1))
    tp = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1))
    return dur, head, tail, max(pauses, default=0.0), i, tp


rows, picks = [], {}
for n in range(1, 17):
    words = len(re.findall(r"[A-Za-z]+(?:-[A-Za-z]+)?", EN[n]))
    cands = []
    for p in sorted((ROOT / "vo" / "takes").glob(f"VO{n}_t*.mp3")):
        dur, head, tail, pause, i, tp = measure(p)
        speech = tail - head
        wpm = words / speech * 60
        fits = speech <= SLOT[n] - HEADROOM
        cost = abs(wpm - 160) / 10 + (2 if tp > -1 else 0) + max(0, pause - 0.6) * 5
        r = {"line": f"VO{n}", "take": p.name, "words": words, "sec": round(dur, 2), "speech": round(speech, 2), "lead": round(head, 2),
             "wpm": round(wpm), "LUFS": i, "TP": tp, "maxPause": round(pause, 2), "slot": SLOT[n], "fits": fits, "cost": round(cost, 2)}
        rows.append(r)
        cands.append(r)
    fitting = [r for r in cands if r["fits"]]
    best = min(fitting or cands, key=lambda r: r["cost"] if fitting else r["speech"])
    best["pick"] = True
    picks[f"VO{n}"] = {"take": best["take"], "fitsSlot": bool(fitting)}

(ROOT / "vo" / "takes" / "takes.json").write_text(json.dumps({"rule": __doc__.strip().splitlines()[3:6], "takes": rows, "picks": picks}, indent=1))
print("| Line | Take | Length s | Speech s | Slot s | WPM | LUFS | TP dBTP | Max pause s | Fits | Pick |")
print("|---|---|---|---|---|---|---|---|---|---|---|")
for r in rows:
    print(f"| {r['line']} | {r['take'][-6:-4]} | {r['sec']} | {r['speech']} | {r['slot']} | {r['wpm']} | {r['LUFS']} | {r['TP']} | {r['maxPause']} | {'yes' if r['fits'] else 'NO'} | {'**◀**' if r.get('pick') else ''} |")
