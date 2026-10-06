#!/usr/bin/env python3
"""FINAL GATE: a final render FAILS while any MOCK or PLACEHOLDER remains (user, 2026-10-06).

Usage: python3 -I scripts/final_gate.py                 check the current build (exit 1 on any blocker)
       python3 -I scripts/final_gate.py --stamp F       …and record the fingerprint of what will be rendered in F
       python3 -I scripts/final_gate.py --check-stamp F  after rendering: the build must be unchanged since the stamp
scripts/render_final.sh runs it before the render (no render on a blocker) and after (the output is deleted on a mismatch).

Blockers:
  - the build is not a final build (EL_MODE=final), so mocks could be in it;
  - web/assets/manifest.json lists any MOCK or PLACEHOLDER input (app screens, hero renders, parent card, S22 callout),
    or the audio is not the master mix;
  - out/mix/report.json has any PLACEHOLDER sound effect;
  - web/index.html still carries a mock or placeholder marker (data-mock, the watermark, a PLACEHOLDER label, a mock image).
Warnings (reported, not blocking): PROVISIONAL inputs, e.g. the working logo cut from the screenshot until the SVG lands.
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
blockers, warnings = [], []
man = json.load(open("web/assets/manifest.json"))
if man.get("_mode") != "final":
    blockers.append(f"build mode is '{man.get('_mode', 'draft')}', not 'final' (run scripts/render_final.sh, which builds with EL_MODE=final)")
for k, v in man.items():
    if k.startswith("_"):
        continue
    st = v["status"]
    if st in ("MOCK", "PLACEHOLDER", "PREVIEW"):
        blockers.append(f"{k}: {st}" + (f" (slots {', '.join(v['slots'])})" if v.get("slots") else ""))
    elif st == "PROVISIONAL":
        warnings.append(f"{k}: PROVISIONAL ({v.get('file', '')})")
mix = json.load(open("out/mix/report.json")) if os.path.exists("out/mix/report.json") else None
if not mix:
    blockers.append("out/mix/report.json missing: the master mix was not built")
else:
    for x, v in sorted(mix["sfx"].items()):
        if v["status"] != "REAL":
            blockers.append(f"sfx/{x}: {v['status']} ({v['file']})")
    if not mix.get("pass"):
        blockers.append(f"master mix fails loudness/true peak ({mix.get('integrated_lufs')} LUFS, {mix.get('true_peak_dbtp')} dBTP)")
html = re.sub(r"<style[\s\S]*?</style>", "", open("web/index.html").read())   # markup only: the stylesheet names the classes
for marker in ("data-mock", "MOCK — internal draft", "assets/ui/mock/", "mockcard", "PLACEHOLDER", "ph-ui", 'class="hero ph'):
    n = html.count(marker)
    if n:
        blockers.append(f"web/index.html contains '{marker}' ×{n}")

def fingerprint():
    h = hashlib.sha256()
    for root in ("web",):
        for d, _, fs in sorted(os.walk(root)):
            if "snapshots" in d:
                continue
            for f in sorted(fs):
                p = os.path.join(d, f)
                h.update(p.encode()); h.update(open(p, "rb").read())
    return h.hexdigest()

args = sys.argv[1:]
if "--check-stamp" in args:
    stamp = json.load(open(args[args.index("--check-stamp") + 1]))
    if stamp["fingerprint"] != fingerprint():
        blockers.append("web/ changed between the gate and the render: the rendered film is not the gated build")
for w in warnings:
    print(f"  ! warning: {w}")
if blockers:
    print(f"FINAL GATE: FAIL — {len(blockers)} blocker(s); a final render is not allowed:")
    for b in blockers:
        print(f"  ✗ {b}")
    sys.exit(1)
if "--stamp" in args:
    path = args[args.index("--stamp") + 1]
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump({"fingerprint": fingerprint(), "warnings": warnings}, open(path, "w"), indent=1)
print("FINAL GATE: PASS — no MOCK or PLACEHOLDER in the build" + (f" ({len(warnings)} warning(s))" if warnings else ""))
