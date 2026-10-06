#!/usr/bin/env bash
# Rebuild everything after inputs land: placeholders swap to real files, the mix picks up real SFX, then the gates run.
# Usage: scripts/build_all.sh            build + mix + lint/check/preflight/sync
#        scripts/build_all.sh --render   … and render the full draft (out/draft/eduledger-launch-draft.mp4)
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d .kit/node_modules ] || scripts/setup-kit.sh
export HYPERFRAMES_TELEMETRY=0 DO_NOT_TRACK=1
export PRODUCER_HEADLESS_SHELL_PATH="${PRODUCER_HEADLESS_SHELL_PATH:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}"
HF=.kit/node_modules/.bin/hyperframes
[ -f music/edit/bed.wav ] || python3 -I scripts/timeline.py >/dev/null      # the edited music bed is rebuilt, not stored

echo "== build (resolve inputs)";  python3 -I scripts/build_web.py | tail -2
echo "== mix";                     python3 -I scripts/mix.py
echo "== build (with the master)"; python3 -I scripts/build_web.py | tail -2
echo "== inputs";                  python3 -I scripts/verify_inputs.py | tail -3 || true
echo "== lint";                    $HF lint web 2>&1 | tail -2
echo "== check (layout + contrast)"; $HF check web 2>&1 | tail -4
echo "== preflight";               node .kit/scripts/preflight.mjs web 2>&1 | tail -4
echo "== sync";                    python3 -I scripts/sync_check.py
if [ "${1:-}" = "--render" ]; then
  echo "== render";                scripts/render_draft.sh
fi
