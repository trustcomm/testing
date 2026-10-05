#!/bin/sh
# fetch.sh: read "relative/path URL" lines on stdin and download each (signed ElevenLabs output URLs).
while read -r p u; do [ -z "$p" ] && continue; curl -sSf --retry 3 -o "$p" "$u" && echo "ok $p $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$p")s" || echo "FAIL $p"; done
