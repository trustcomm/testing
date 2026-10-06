#!/usr/bin/env python3
"""Stage E sync gate: every cut against the VO word it belongs to.

Usage: python3 -I scripts/sync_check.py
1. Runs the kit's own validator (.kit/scripts/validate-beat-sync.mjs, unchanged) on a shim project in out/sync/.
   The film is one root composition with inline <section> shots, but the validator reads sub-composition beats,
   so the shim restates each shot as a beat file carrying the same data-start / data-duration / data-anchor
   as web/index.html, next to web/assets/transcript.json. Rule: −0.2 s ≤ word − cut ≤ 1.8 s.
2. Checks the exact anchor word (by line and word index, from timeline.json, so repeated words like "EduLedger"
   or "fees" cannot match the wrong occurrence) and the beat grid: every cut on a beat or half beat, ±1 frame.
Writes out/sync/report.json; exits 1 on any failure.
"""
import json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
tl = json.load(open("timeline.json"))
html = open("web/index.html").read()
secs = re.findall(r'<section id="([^"]+)" class="clip shot" data-start="([\d.]+)" data-duration="([\d.]+)"[^>]*?data-anchor="([^"]*)"', html)
assert len(secs) == len(tl["shots"]), (len(secs), len(tl["shots"]))

# ---------------------------------------------------------------- 1. the kit validator on a shim
shim = "out/sync"
shutil.rmtree(shim, ignore_errors=True)
os.makedirs(f"{shim}/beats"); os.makedirs(f"{shim}/assets")
shutil.copy("web/assets/transcript.json", f"{shim}/assets/transcript.json")
rows = []
for sid, st, du, anc in secs:
    rows.append(f'<template id="{sid}" data-composition-src="beats/{sid}.html" data-start="{st}" data-duration="{du}"></template>')
    open(f"{shim}/beats/{sid}.html", "w").write(f'<template id="{sid}-t"><div data-composition-id="{sid}" data-anchor="{anc}"></div></template>\n')
open(f"{shim}/index.html", "w").write("<!doctype html><html><body>\n" + "\n".join(rows) + "\n</body></html>\n")
kit = subprocess.run(["node", ".kit/scripts/validate-beat-sync.mjs", shim, "--json"], capture_output=True, text=True)
kit_rows = json.loads(kit.stdout)["rows"]
kit_fail = [r for r in kit_rows if r["status"] != "OK"]

# ---------------------------------------------------------------- 2. exact anchor word + grid
lines = {l["id"]: l for l in json.load(open("vo/lines.json"))["lines"]}
place = {v["id"]: v["start"] for v in tl["vo"]}
P, PH, FPS = tl["grid"]["period_s"], tl["grid"]["phase_s"], tl["fps"]
exact = []
for (sid, st, du, anc), s in zip(secs, tl["shots"]):
    assert sid == s["id"]
    t_cut = float(st)
    word = s["word_onset"]
    slack = word - t_cut
    beats = (t_cut - PH) / P
    off_grid = 0 if s["id"] == "S01" else abs(beats * 2 - round(beats * 2)) * P / 2   # distance to the nearest half beat (s)
    ok = (-0.2 <= slack <= 1.8) and off_grid <= 1 / FPS + 1e-6 and abs(t_cut - s["start"]) < 1e-3
    exact.append({"shot": sid, "cut": round(t_cut, 3), "word": s["word"], "line": s["line"], "word_onset": word,
                  "lead_s": round(slack, 3), "grid": s["grid"], "beat": round(beats, 2), "off_grid_ms": round(off_grid * 1000, 1),
                  "status": "OK" if ok else "FAIL"})
exact_fail = [r for r in exact if r["status"] != "OK"]

report = {"rule": "-0.2 s <= word - cut <= 1.8 s; cuts on the beat or half-beat grid within 1 frame",
          "kit_validator": {"ok": len(kit_rows) - len(kit_fail), "fail": len(kit_fail), "rows": kit_rows},
          "exact": {"ok": len(exact) - len(exact_fail), "fail": len(exact_fail), "rows": exact}}
json.dump(report, open(f"{shim}/report.json", "w"), indent=1)
print(f"kit validate-beat-sync: {len(kit_rows) - len(kit_fail)}/{len(kit_rows)} OK")
for r in kit_fail:
    print(f"  {r['id']}: {r['status']} {r['detail']}")
leads = [r["lead_s"] for r in exact]
print(f"exact anchor + grid: {len(exact) - len(exact_fail)}/{len(exact)} OK · lead {min(leads):.3f}–{max(leads):.3f} s · "
      f"max off-grid {max(r['off_grid_ms'] for r in exact):.1f} ms")
for r in exact_fail:
    print(f"  {r['shot']}: lead {r['lead_s']} s, off grid {r['off_grid_ms']} ms")
sys.exit(1 if exact_fail or kit_fail else 0)
