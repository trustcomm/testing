#!/usr/bin/env python3
"""The scene timing table, the camera moves and the sound event counts as Markdown, from public/timeline.json. usage: python3 scripts/report.py > docs/TIMING.md"""
import json
from collections import Counter

t = json.load(open("public/timeline.json"))
fps = t["meta"]["fps"]
print(f"# Iss hafte 5 alarm: timing\n\n{t['meta']['totalFrames']} frames at {fps} fps = {t['meta']['totalSeconds']:.3f} s = voice-over {t['meta']['voiceSeconds']:.3f} s + {t['meta']['leadSeconds'] + t['meta']['tailSeconds']:.1f} s (0.4 s of silence in front, 0.4 s after).\n")
print("## Scenes\n\n| Scene | Starts on | Start | Frame | End frame | Frames | Seconds | Hero still |\n|---|---|---|---|---|---|---|---|")
words = t["words"]
for s in t["scenes"]:
    first = next(w for w in words if w["scene"] == s["id"])["text"]
    print(f"| {s['id']} {s['name']} | “{first}” | {s['start'] / fps:.2f} s | {s['start']} | {s['end']} | {s['end'] - s['start']} | {(s['end'] - s['start']) / fps:.2f} | {s['hero']} |")
print("\n## Camera\n\n| Move | From frame | To frame | Frames | Seconds |\n|---|---|---|---|---|")
kinds = {k["f"]: k["move"] for k in t["camera"]["keys"]}
for a in t["camera"]["travels"]:
    print(f"| {kinds[a['to']]} | {a['from']} | {a['to']} | {a['to'] - a['from']} | {(a['to'] - a['from']) / fps:.2f} |")
print(f"\nPUNCH (x1.25 on an alarm word, 2-frame shake) at frames {', '.join(map(str, t['camera']['punches']))}.")
c = Counter(e["sfx"] for e in t["sfx"])
print(f"\n## Sound\n\n{len(t['sfx'])} events from {len(c)} distinct sounds (every one is a transient + body + tail layered file); see SFX_EVENT_TABLE.md for the full table.\n")
print("| Sound | Events |\n|---|---|")
for k, v in c.most_common(): print(f"| {k} | {v} |")
