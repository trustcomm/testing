"""verify_inputs.py: check every input the Trustcomm film needs before Stage 1.

Run from films/trustcomm-launch/:  python3 scripts/verify_inputs.py
Writes inputs.json and prints a table. Exit code 0 only when nothing required is missing.

Checks (BRIEF §5, §6, §8 and the user's plan of 2026-10-05):
  vo/      VO1–VO16 and VO1_hi–VO16_hi (one file each, .wav/.mp3/.flac); duration, sample rate,
           integrated loudness, words/min vs the brief's ~160.
  sfx/     SFX01–SFX12, at least one file each (variants allowed: SFX01_a.wav, SFX01-2.mp3 …).
  music/   exactly one audio track + a LICENSE file; duration; tempo via the engine's tempo.py.
  client/  logo SVG, brand colours file, font files (optional: Poppins proposal otherwise), FACTS.md
           with the sign-offs (launch date, tagline, F1–F10, ₹699, shop names).
  ui/      screenshots of the real product / demo.
  refs/    2–3 reference films, or a REFS.md saying "use BRIEF §3 targets".
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENGINE = ROOT.parent / "godevlevel-launch" / "engine" / "scripts" / "tempo.py"
AUDIO = {".wav", ".mp3", ".flac", ".m4a", ".aac", ".ogg"}
IMAGE = {".png", ".jpg", ".jpeg", ".webp"}
VIDEO = {".mp4", ".mov", ".mkv", ".webm"}

EN = {
    1: "Your happiest customers?",
    2: "They pay, they smile… and they leave.",
    3: "The loudest one writes the review.",
    4: "Meet Trustcomm.",
    5: "One QR code on your counter.",
    6: "Customers scan. No app. No sign-in.",
    7: "They rate their visit…",
    8: "…in their own language. English. Hinglish. Hindi. Kannada. Tamil. Telugu.",
    9: "They pick what to mention. Nothing is ticked for them.",
    10: "Then they choose.",
    11: "Post on Google, in their own name…",
    12: "…or tell you privately.",
    13: "Real reviews, from real customers.",
    14: "Hear from more of your customers. Not just the loudest ones.",
    15: "Fourteen days free. No card needed.",
    16: "Trustcomm. Now across India. trustcomm dot app.",
}
FACT_KEYS = ["launch date", "tagline", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "₹699", "shop names"]


def probe(p):
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,sample_rate,channels,width,height", "-of", "json", str(p)], capture_output=True, text=True, check=True).stdout
        return json.loads(out)
    except Exception as e:  # unreadable file
        return {"error": str(e)}


def lufs(p):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(p), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    s = r.stderr[r.stderr.rfind("Summary:") :]
    i = re.search(r"I:\s+(-?[\d.]+) LUFS", s)
    tp = re.search(r"Peak:\s+(-?[\d.]+) dBFS", s)
    return (float(i.group(1)) if i else None, float(tp.group(1)) if tp else None)


def find(folder, stem):
    return sorted(p for p in (ROOT / folder).glob(f"{stem}*") if p.suffix.lower() in AUDIO and re.match(rf"^{re.escape(stem)}(\b|[_\-\s.]|$)", p.name))


report = {"missing": [], "warnings": [], "vo": {}, "sfx": {}, "music": {}, "client": {}, "ui": {}, "refs": {}}
miss = report["missing"].append
warn = report["warnings"].append

# --- VO ---
for lang in ["en", "hi"]:
    for n in range(1, 17):
        stem = f"VO{n}" + ("_hi" if lang == "hi" else "")
        files = [p for p in find("vo", stem) if (lang == "hi") == ("_hi" in p.name)]
        if not files:
            miss(f"vo/{stem}")
            continue
        if len(files) > 1:
            warn(f"vo/{stem}: {len(files)} files ({', '.join(f.name for f in files)}); keep only the chosen take")
        p = files[0]
        pr = probe(p)
        if "error" in pr:
            warn(f"vo/{p.name}: unreadable")
            continue
        dur = float(pr["format"]["duration"])
        sr = next((s.get("sample_rate") for s in pr.get("streams", []) if s.get("codec_type") == "audio"), None)
        i, tp = lufs(p)
        row = {"file": p.name, "sec": round(dur, 3), "sampleRate": sr, "LUFS": i, "truePeak": tp}
        if lang == "en":
            words = len(re.findall(r"[A-Za-z]+", EN[n]))
            row["wpm"] = round(words / dur * 60) if dur else None
        report["vo"][stem] = row

# --- SFX ---
for n in range(1, 13):
    stem = f"SFX{n:02d}"
    files = find("sfx", stem)
    if not files:
        miss(f"sfx/{stem}")
    else:
        report["sfx"][stem] = [{"file": f.name, "sec": round(float(probe(f)["format"]["duration"]), 3)} for f in files]

# --- Music ---
tracks = [p for p in (ROOT / "music").iterdir() if p.suffix.lower() in AUDIO] if (ROOT / "music").exists() else []
lic = [p for p in (ROOT / "music").iterdir() if p.name.upper().startswith("LICEN")] if (ROOT / "music").exists() else []
if not tracks:
    miss("music/<track>")
elif len(tracks) > 1:
    warn(f"music/: {len(tracks)} audio files; expected one track")
if not lic:
    miss("music/LICENSE (commercial licence for the track)")
if tracks:
    t = tracks[0]
    m = {"file": t.name, "sec": round(float(probe(t)["format"]["duration"]), 3), "license": [p.name for p in lic]}
    try:
        out = subprocess.run([sys.executable, str(ENGINE), str(t), "--json", str(ROOT / "music" / "tempo.json")], capture_output=True, text=True, check=True).stdout.strip()
        tj = json.loads((ROOT / "music" / "tempo.json").read_text())
        m.update({"bpm": tj["bpm"], "confidence": tj["confidence"], "firstDownbeat": tj["downbeats"][0] if tj["downbeats"] else None, "tempoLine": out})
    except Exception as e:
        warn(f"music tempo measurement failed: {e}")
    report["music"] = m

# --- Client ---
c = ROOT / "client"
logos = sorted(c.glob("*.svg"))
fonts = sorted(p for p in c.rglob("*") if p.suffix.lower() in {".ttf", ".otf", ".woff", ".woff2"})
colours = sorted(p for p in c.iterdir() if re.search(r"colou?r|brand|palette", p.name, re.I) and p.suffix.lower() in {".md", ".json", ".txt", ".css", ".ase", ".pdf"}) if c.exists() else []
facts = c / "FACTS.md"
report["client"] = {"logos": [p.name for p in logos], "fonts": [p.name for p in fonts], "colours": [p.name for p in colours], "facts": facts.exists()}
if not logos:
    miss("client/*.svg (logo)")
if not colours:
    miss("client/ brand colours file (e.g. colours.md)")
if not fonts:
    warn("client/: no font files: will propose Poppins (geometric, OFL, Devanagari) + an alternative")
if not facts.exists():
    miss("client/FACTS.md (client sign-offs)")
else:
    text = facts.read_text(encoding="utf-8")
    absent = [k for k in FACT_KEYS if k.lower() not in text.lower()]
    if absent:
        warn(f"client/FACTS.md does not mention: {', '.join(absent)}")
    report["client"]["factsMissingKeys"] = absent

# --- UI ---
shots = sorted(p for p in (ROOT / "ui").rglob("*") if p.suffix.lower() in IMAGE) if (ROOT / "ui").exists() else []
report["ui"] = {"screenshots": [p.name for p in shots]}
if not shots:
    miss("ui/ screenshots of trustcomm.app and /r/demo")

# --- Refs ---
films = sorted(p for p in (ROOT / "refs").iterdir() if p.suffix.lower() in VIDEO) if (ROOT / "refs").exists() else []
refsmd = (ROOT / "refs" / "REFS.md").exists()
report["refs"] = {"films": [p.name for p in films], "useBriefTargets": refsmd}
if not films and not refsmd:
    miss("refs/: 2–3 reference films, or refs/REFS.md saying to use BRIEF §3 targets")

(ROOT / "inputs.json").write_text(json.dumps(report, indent=1, ensure_ascii=False))

# --- summary ---
print(f"VO      {len(report['vo'])}/32 present")
for k, v in report["vo"].items():
    print(f"  {k:8} {v['sec']:6.2f} s  {v.get('LUFS')} LUFS  TP {v.get('truePeak')}  {('%s wpm' % v['wpm']) if v.get('wpm') else ''}")
print(f"SFX     {len(report['sfx'])}/12 present ({sum(len(v) for v in report['sfx'].values())} files)")
print(f"music   {report['music'] or 'none'}")
print(f"client  {report['client']}")
print(f"ui      {len(shots)} screenshots · refs {len(films)} films{' + REFS.md' if refsmd else ''}")
for w in report["warnings"]:
    print("WARN   ", w)
for m_ in report["missing"]:
    print("MISSING", m_)
sys.exit(1 if report["missing"] else 0)
