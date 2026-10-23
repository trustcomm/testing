#!/bin/sh
# The whole quality check, in the order the brief asks for. Stops at the first failing stage but reports everything it ran.
# usage: sh scripts/qa.sh            (needs public/mix.wav for the audio stage: python3 scripts/build_mix.py)
set -u
fail=0
step() { echo; echo "=== $1"; shift; "$@" || fail=1; }
step "timeline -> public/timeline.json" npx tsx scripts/export_timeline.ts
step "types" npx tsc --noEmit
step "sync: scenes, transcript vs audio, cue modules, captions" npx tsx scripts/verify-sync.ts
step "facts on screen + no logos / randomness / network" node scripts/facts.mjs
F=$(node -e 'const t=require("./public/timeline.json");const s=new Set([...t.anchors.map(a=>a.frame),...t.scenes.map(s=>s.hero)]);console.log([...s].sort((a,b)=>a-b).join(" "))')
step "layout: safe zones, sides, captions at every anchor + hero frame" node scripts/layout.mjs $F
step "colour story: red ends at S10, green starts at S10" node scripts/colors.mjs 15
[ -f public/mix.wav ] && step "audio: event table (+-1 frame), loudness, true peak" python3 scripts/qa_audio.py
step "stills per scene + contact sheet" node scripts/deliver-stills.mjs
[ $fail = 0 ] && echo "\nQA PASS" || echo "\nQA FAIL"
exit $fail
