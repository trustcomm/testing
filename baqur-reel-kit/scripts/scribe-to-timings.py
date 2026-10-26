#!/usr/bin/env python3
"""ElevenLabs Scribe words (Devanagari, per-word times) + the Latin-script script.json (the SAME words, one for one) -> timings.json for build-timeline.mjs.
When the VO is Hindi, Scribe writes Devanagari and the kit's fuzzy aligner cannot match it to a Latin script. If script.json is the same text transliterated word for word,
the mapping is exact: word i of the script gets the start/end of Scribe word i, no guessing.
usage: python3 scripts/scribe-to-timings.py agent-lied        (reads src/reels/<reel>/transcript.scribe.words.json)"""
import json, sys
reel = sys.argv[1] if len(sys.argv) > 1 else "agent-lied"
d = f"src/reels/{reel}"
sc = json.load(open(f"{d}/transcript.scribe.words.json"))["words"]
sc = [w for w in sc if w.get("type", "word") == "word"]
script = [w for s in json.load(open(f"{d}/script.json"))["segments"] for w in s["text"].split()]
assert len(sc) == len(script), f"{len(sc)} Scribe words but {len(script)} script words: the script must be the same words, one for one"
out = [{"word": w, "start": round(s["start"], 3), "end": round(s["end"], 3)} for w, s in zip(script, sc)]
json.dump(out, open(f"{d}/timings.json", "w"), ensure_ascii=False, indent=1)
print(f"{len(out)} words -> {d}/timings.json ({out[0]['start']} s .. {out[-1]['end']} s)")
