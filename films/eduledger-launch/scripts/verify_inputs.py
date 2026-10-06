#!/usr/bin/env python3
"""Stage B: check every input the brief needs, measure what has landed, list what is missing.

Usage: python3 -I scripts/verify_inputs.py      (run from anywhere; writes inputs.json next to BRIEF.md)
Exit code 0 only when nothing required is missing.

Checks (BRIEF §2, §3, §6):
  vo/       L01–L14 split files + vo/lines.json (scripts/split_vo.py)
  music/    one track + a LICENSE file; tempo and downbeat phase measured with the kit's music-grid.mjs
  sfx/      X01–X14, as X01.wav or variants X01_v1/X01_v2 (wav/mp3/flac)
  brand/    logo (SVG preferred, or PNG >= 1000 px), colours file, fonts
  ui/       the ten app screenshots listed below, >= 1920 px wide (phone shot excepted)
  heroes/   H1–H5, 16:9, >= 3840 px wide
  client/   FACTS.md with every sign-off ticked
"""
import glob, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
AUDIO = (".wav", ".mp3", ".flac", ".m4a", ".aif", ".aiff")
IMG = (".png", ".jpg", ".jpeg", ".webp", ".svg")
UI_REQUIRED = {  # file stem keyword -> what it shows
    "dashboard": "Main dashboard (command centre) of the demo school",
    "students": "Student records list or profile",
    "admissions": "Admissions / onboarding screen",
    "attendance": "Attendance marking screen (a class with present/absent)",
    "fees": "Fees / invoice screen with collection status",
    "receipt": "A generated fee receipt",
    "payroll": "Staff & payroll screen",
    "cashbook": "Cashbook / financial report",
    "parent-chat": "The parent message card EduLedger shows on its website",
    "phone": "A phone screenshot (any EduLedger mobile view)",
}

def probe(path, entries):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", entries, "-of", "json", path],
                       capture_output=True, text=True)
    return json.loads(r.stdout or "{}")

def img_size(path):
    if path.endswith(".svg"):
        return None
    s = probe(path, "stream=width,height").get("streams", [{}])[0]
    return s.get("width"), s.get("height")

def files(folder, exts):
    return sorted(p for p in glob.glob(f"{folder}/**/*", recursive=True)
                  if os.path.isfile(p) and p.lower().endswith(exts) and "/provisional/" not in p and "/ref/" not in p)

R = {"missing": [], "notes": []}

# VO
vo = {}
lines = json.load(open("vo/lines.json"))["lines"] if os.path.exists("vo/lines.json") else []
for i in range(1, 15):
    lid = f"L{i:02d}"
    f = f"vo/{lid}.wav"
    if os.path.exists(f):
        L = next((l for l in lines if l["id"] == lid), {})
        vo[lid] = {k: L.get(k) for k in ("duration", "speech_span", "wpm", "lufs", "true_peak_dbfs")}
    else:
        R["missing"].append(f"VO {lid}")
R["vo"] = vo

# Music
tracks = [p for p in files("music", AUDIO)]
lic = [p for p in glob.glob("music/*") if re.search(r"licen[cs]e", os.path.basename(p), re.I)]
R["music"] = {"tracks": tracks, "licence": lic}
if not tracks:
    R["missing"].append("Music track")
if not lic:
    R["missing"].append("Music LICENSE / terms")
grid = os.path.join(".kit/.claude/skills/motion-showreel/scripts/music-grid.mjs")
for t in tracks:
    d = float(probe(t, "format=duration")["format"]["duration"])
    info = {"duration": round(d, 2)}
    if os.path.exists(grid):
        out = subprocess.run(["node", grid, t, "--bpm", "128", "--json", t + ".grid.json"], capture_output=True, text=True)
        info["music_grid"] = out.stdout.strip().splitlines()[:6]
    R["music"][t] = info

# SFX
sfx = {}
allsfx = files("sfx", AUDIO)
for i in range(1, 15):
    xid = f"X{i:02d}"
    got = [p for p in allsfx if re.match(rf"{xid}([_\-. ]|$)", os.path.basename(p), re.I)]
    if got:
        sfx[xid] = [{"file": p, "duration": round(float(probe(p, "format=duration")["format"]["duration"]), 2)} for p in got]
    else:
        R["missing"].append(f"SFX {xid}")
R["sfx"] = sfx

# Brand
logos = [p for p in files("brand", IMG) if "logo" in os.path.basename(p).lower()]
svg = [p for p in logos if p.endswith(".svg")]
big = [p for p in logos if not p.endswith(".svg") and (img_size(p) or (0, 0))[0] >= 1000]
R["brand"] = {"logos": logos, "colours_file": [p for p in glob.glob("brand/*") if re.search(r"colou?rs?", p, re.I)],
              "fonts": files("brand", (".woff2", ".woff", ".ttf", ".otf"))}
if not svg and not big:
    R["missing"].append("Logo (SVG, or PNG ≥ 1000 px wide)")
if not R["brand"]["colours_file"]:
    R["missing"].append("Exact brand colours (hex) from the developer")
if not R["brand"]["fonts"]:
    R["notes"].append("No brand fonts supplied: Stage D proposes Inter + one display face (BRIEF §4)")

# UI
ui = {}
allui = files("ui", IMG)
for key, what in UI_REQUIRED.items():
    got = [p for p in allui if key in os.path.basename(p).lower()]
    if not got:
        R["missing"].append(f"UI screenshot: {key} ({what})")
        continue
    w, h = img_size(got[0]) or (None, None)
    ui[key] = {"file": got[0], "size": [w, h]}
    if key != "phone" and w and w < 1920:
        R["missing"].append(f"UI screenshot {key}: {w} px wide, needs ≥ 1920")
R["ui"] = ui

# Heroes
heroes = {}
allh = files("heroes", IMG)
for i in range(1, 6):
    hid = f"H{i}"
    got = [p for p in allh if re.match(rf"{hid}([_\-. ]|$)", os.path.basename(p), re.I)]
    if not got:
        R["missing"].append(f"Hero render {hid}")
        continue
    w, h = img_size(got[0])
    heroes[hid] = {"file": got[0], "size": [w, h], "ok": bool(w and w >= 3840 and abs(w / h - 16 / 9) < 0.02)}
    if not heroes[hid]["ok"]:
        R["missing"].append(f"Hero {hid}: {w}×{h}, needs 16:9 ≥ 3840 px wide")
R["heroes"] = heroes

# Client sign-offs
facts = "client/FACTS.md"
if os.path.exists(facts):
    txt = open(facts).read()
    open_items = re.findall(r"^- \[ \] (.+)$", txt, re.M)
    R["client"] = {"open_signoffs": open_items, "ticked": len(re.findall(r"^- \[x\] ", txt, re.M | re.I))}
    for o in open_items:
        R["missing"].append(f"Sign-off: {o.split(' — ')[0]}")
else:
    R["missing"].append("client/FACTS.md")

json.dump(R, open("inputs.json", "w"), indent=1, ensure_ascii=False)
print(f"VO {len(vo)}/14 · music {len(tracks)} track(s), licence {'yes' if lic else 'no'} · SFX {len(sfx)}/14 · "
      f"logo {'yes' if (svg or big) else 'no'} · UI {len(ui)}/10 · heroes {len(heroes)}/5")
print(f"{len(R['missing'])} missing:")
for m in R["missing"]:
    print("  -", m)
for n in R["notes"]:
    print("  note:", n)
sys.exit(1 if R["missing"] else 0)
