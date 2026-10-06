#!/usr/bin/env python3
"""Stage B: split the supplied single-file VO into L01–L14 at its pauses. Editing only.

Usage: python3 -I scripts/split_vo.py
Reads  vo/master/*.mp3 and vo/scribe/master-words.json (ElevenLabs Scribe word timings)
Writes vo/L01.wav … vo/L14.wav (mono, source rate, 24-bit, 10 ms fades at the cuts) and vo/lines.json
       (cut points in the master, speech on/off inside each file, words relative to each file,
        speech rate, internal pauses, loudness and true peak).
Each cut sits at the quietest 10 ms frame inside the gap between two lines' words, so no breath
or word tail is clipped. Nothing is resampled, sped up, regenerated or re-voiced.
"""
import glob, json, os, re, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
master = glob.glob("vo/master/*.mp3")[0]
words = json.load(open("vo/scribe/master-words.json"))["words"]
words = [w for w in words if w.get("type") == "word"]

# BRIEF §2 lines, and the two-word anchor that opens each line in the Scribe transcript
LINES = [
    ("L01", "Registers. Receipts. Reminders.", ("registers", "receipts")),
    ("L02", "Spreadsheets for fees. Paper for attendance. Phone calls for parents.", ("spreadsheets", "for")),
    ("L03", "Running a school shouldn't feel like this.", ("running", "a")),
    ("L04", "Meet EduLedger.", ("meet", "eduledger")),
    ("L05", "One connected platform for your entire school.", ("one", "connected")),
    ("L06", "Students. Staff. Fees.", ("students", "staff")),
    ("L07", "Admissions to attendance, in one clean dashboard.", ("admissions", "to")),
    ("L08", "Fees? Collected, receipted, tracked, in real time.", ("fees", "collected")),
    ("L09", "Payroll and cashbook? Done, with less paperwork.", ("payroll", "and")),
    ("L10", "And parents? Updated instantly on WhatsApp. Attendance, fee receipts, results.", ("and", "parents")),
    ("L11", "Every number that matters. One command centre.", ("every", "number")),
    ("L12", "No setup fee. Secure by design. Built for Indian schools.", ("no", "setup")),
    ("L13", "EduLedger. Manage better. Educate smarter.", ("eduledger", "manage")),
    ("L14", "Get started at eduledger dot co dot in.", ("get", "started")),
]
norm = lambda s: re.sub(r"[^a-z']", "", s.lower())
starts, k = [], 0
for lid, _, (a, b) in LINES:
    while not (norm(words[k]["text"]) == a and norm(words[k + 1]["text"]) == b):
        k += 1
    starts.append(k)
    k += 1
assert len(starts) == 14

info = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate",
                       "-of", "csv=p=0", master], capture_output=True, text=True, check=True).stdout.strip()
SR = int(info)
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", master, "-ac", "1", "-f", "f32le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.float32).copy()
HOP = SR // 100
nfr = len(x) // HOP
db = 20 * np.log10(np.sqrt((x[:nfr * HOP].reshape(nfr, HOP) ** 2).mean(1)) + 1e-9)

cuts = [0.0]
for i in range(1, 14):
    end_prev = words[starts[i] - 1]["end"]
    start_next = words[starts[i]]["start"]
    a, b = int(end_prev * 100), int(start_next * 100)
    if b <= a:
        b = a + 1
    seg = db[a:b + 1]
    # the centre of the quietest run (within 1 dB of the minimum) in the gap
    quiet = np.where(seg <= seg.min() + 1.0)[0]
    runs = np.split(quiet, np.where(np.diff(quiet) > 1)[0] + 1)
    run = max(runs, key=len)
    cuts.append(round((a + run[len(run) // 2]) / 100 + 0.005, 3))
cuts.append(round(len(x) / SR, 3))

FADE = int(0.010 * SR)
def loudness(path):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    summ = out[out.rfind("Summary:"):]
    i = re.search(r"I:\s+(-?[\d.]+) LUFS", summ); p = re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ)
    return (float(i.group(1)) if i else None, float(p.group(1)) if p else None)

out = {"master": os.path.basename(master), "sample_rate": SR, "scribe_model": "eleven_scribe_v1",
       "method": "cut at the centre of the quietest 10 ms run between two lines' words; 10 ms fades", "lines": []}
for i, (lid, script, _) in enumerate(LINES):
    t0, t1 = cuts[i], cuts[i + 1]
    seg = x[int(t0 * SR):int(t1 * SR)].copy()
    seg[:FADE] *= np.linspace(0, 1, FADE, dtype=np.float32)
    seg[-FADE:] *= np.linspace(1, 0, FADE, dtype=np.float32)
    path = f"vo/{lid}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-c:a", "pcm_s24le", path], input=seg.tobytes(), check=True)
    ws = words[starts[i]:(starts[i + 1] if i < 13 else len(words))]
    rel = [{"text": w["text"], "start": round(w["start"] - t0, 3), "end": round(w["end"] - t0, 3)} for w in ws]
    on, off = rel[0]["start"], rel[-1]["end"]
    pauses = [{"after": rel[j]["text"], "s": round(rel[j + 1]["start"] - rel[j]["end"], 2)}
              for j in range(len(rel) - 1) if rel[j + 1]["start"] - rel[j]["end"] >= 0.25]
    lufs, tp = loudness(path)
    out["lines"].append({
        "id": lid, "script": script, "spoken": " ".join(w["text"] for w in ws), "file": path,
        "master_in": t0, "master_out": t1, "duration": round(t1 - t0, 3),
        "speech_on": on, "speech_off": off, "speech_span": round(off - on, 3),
        "words": len(ws), "wpm": round(len(ws) / (off - on) * 60), "pauses_ge_250ms": pauses,
        "lufs": lufs, "true_peak_dbfs": tp, "word_times": rel})
json.dump(out, open("vo/lines.json", "w"), indent=1)
print(f"{'id':4} {'master in-out':>15} {'dur':>6} {'on':>5} {'off':>6} {'span':>5} {'wds':>3} {'wpm':>4} {'LUFS':>6} {'TP':>6}  pauses")
for L in out["lines"]:
    print(f"{L['id']:4} {L['master_in']:6.2f}-{L['master_out']:6.2f} {L['duration']:6.2f} {L['speech_on']:5.2f} {L['speech_off']:6.2f} "
          f"{L['speech_span']:5.2f} {L['words']:3d} {L['wpm']:4d} {L['lufs']:6.1f} {L['true_peak_dbfs']:6.1f}  "
          + ", ".join(f"{p['after']} {p['s']}" for p in L["pauses_ge_250ms"]))
