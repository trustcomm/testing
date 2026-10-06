#!/usr/bin/env bash
# FINAL render. Builds with mocks switched off (EL_MODE=final), then refuses to render while anything is a MOCK or a
# PLACEHOLDER (scripts/final_gate.py), and deletes the output if the build changed during the render.
# Usage: scripts/render_final.sh [standard|high]   → out/final/eduledger-launch.mp4
# Drafts (with watermarked mocks) are scripts/build_all.sh --render → out/draft/eduledger-launch-draft.mp4.
set -euo pipefail
cd "$(dirname "$0")/.."
Q="${1:-high}"
export EL_MODE=final HYPERFRAMES_TELEMETRY=0 DO_NOT_TRACK=1
export PRODUCER_HEADLESS_SHELL_PATH="${PRODUCER_HEADLESS_SHELL_PATH:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}"
python3 -I scripts/build_web.py | tail -4
python3 -I scripts/mix.py
python3 -I scripts/build_web.py >/dev/null
mkdir -p out/final/work
python3 -I scripts/final_gate.py --stamp out/final/gate.json     # exit 1 here stops the script: no render
.kit/node_modules/.bin/hyperframes render web --fps 60 --quality "$Q" --workers "${WORKERS:-3}" -o out/final/work/render.mp4
ffmpeg -v error -y -i out/final/work/render.mp4 -i out/mix/master.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k \
  -shortest -movflags +faststart out/final/eduledger-launch.mp4
if ! python3 -I scripts/final_gate.py --check-stamp out/final/gate.json; then
  rm -f out/final/eduledger-launch.mp4; echo "final render discarded"; exit 1
fi
python3 -I scripts/verify_render.py out/final/eduledger-launch.mp4
