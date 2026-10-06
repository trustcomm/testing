#!/usr/bin/env python3
"""`hyperframes check` at two points in every shot (35 % and 70 %): layout at all 56, WCAG contrast at 30 of them
(check samples 5 contrast frames per pass, so six passes). Writes out/audit/check/check-N.json + check-summary.json.
Usage: python3 -I scripts/check_sweep.py   (exit 1 if any pass fails)
"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
os.makedirs("out/audit/check", exist_ok=True)
env = dict(os.environ, HYPERFRAMES_TELEMETRY="0", DO_NOT_TRACK="1",
           PRODUCER_HEADLESS_SHELL_PATH=os.environ.get("PRODUCER_HEADLESS_SHELL_PATH",
                                                       "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"))
tl = json.load(open("timeline.json"))
ts = [s["start"] + f * s["dur"] for s in tl["shots"] for f in (0.35, 0.7)]
tot = {"checked": 0, "passed": 0}; found = []; ok = True; ctimes = []; ltimes = []
for k in range(6):
    at = ",".join(f"{x:.2f}" for x in ts[k::6])
    out = subprocess.run([".kit/node_modules/.bin/hyperframes", "check", "web", "--at", at, "--json"],
                         capture_output=True, text=True, env=env).stdout
    open(f"out/audit/check/check-{k + 1}.json", "w").write(out)
    d = json.loads(out)
    ok &= d["ok"]
    c = d["contrast"]; tot["checked"] += c["checked"]; tot["passed"] += c["passed"]; ctimes += c["samples"]
    ltimes += d["layout"].get("samples", []) if isinstance(d["layout"].get("samples"), list) else []
    found += [{"time": f["time"], "code": f["code"], "severity": f["severity"], "selector": f["selector"]} for f in d["layout"]["findings"]]
    found += [{"contrast": f} for f in c["findings"]]
    for sec in ("lint", "runtime", "motion"):
        if d[sec]["errorCount"]:
            ok = False
summary = {"ok": ok, "contrast": tot, "contrast_times": sorted(ctimes), "layout_times": len(ts), "findings": found}
json.dump(summary, open("out/audit/check/check-summary.json", "w"), indent=1)
worst = sorted({f.get("severity", "contrast") for f in found})
print(f"check sweep: {'PASS' if ok else 'FAIL'} · contrast {tot['passed']}/{tot['checked']} text checks at {len(ctimes)} times · "
      f"layout at {len(ts)} times, findings: {len(found)} ({', '.join(worst) or 'none'})")
sys.exit(0 if ok else 1)
