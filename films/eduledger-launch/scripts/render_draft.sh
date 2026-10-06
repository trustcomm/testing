#!/usr/bin/env bash
# Full draft render of web/ at 1920×1080, 60 fps, with the mastered mix muxed in bit-for-bit from out/mix/master.wav.
# Usage: scripts/render_draft.sh [draft|standard|high]     (default standard) → out/draft/eduledger-launch-draft.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
Q="${1:-standard}"
export HYPERFRAMES_TELEMETRY=0 DO_NOT_TRACK=1
export PRODUCER_HEADLESS_SHELL_PATH="${PRODUCER_HEADLESS_SHELL_PATH:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}"
mkdir -p out/draft/work
.kit/node_modules/.bin/hyperframes render web --fps 60 --quality "$Q" -o out/draft/work/render.mp4
# picture from the render, sound from the master (AAC 320k); the frame count and length are checked by scripts/verify_render.py
ffmpeg -v error -y -i out/draft/work/render.mp4 -i out/mix/master.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k \
  -shortest -movflags +faststart out/draft/eduledger-launch-draft.mp4
ls -la out/draft/eduledger-launch-draft.mp4
