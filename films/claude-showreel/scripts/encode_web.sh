#!/bin/bash
# Web delivery encode of the render master: H.264 High@4.2, yuv420p, CRF 18 (preset slow), +faststart.
# The audio stream is copied untouched from the master, so the verified A/V alignment carries over.
# Usage: scripts/encode_web.sh [master.mp4] [out.mp4]      (CRF=20 scripts/encode_web.sh for a smaller file)
set -euo pipefail
cd "$(dirname "$0")/.."
IN=${1:-out/render/work/claude-showreel-master.mp4}
OUT=${2:-out/render/claude-showreel.mp4}
ffmpeg -v error -y -i "$IN" -map 0:v:0 -map 0:a:0 -c:v libx264 -preset slow -crf "${CRF:-18}" -profile:v high -level 4.2 \
  -pix_fmt yuv420p -tune film -c:a copy -movflags +faststart "$OUT"
ls -la "$OUT" | awk '{printf "%s: %.1f MB\n", $NF, $5/1e6}'
