#!/usr/bin/env bash
# Rebuild everything after inputs land: placeholders swap to real files, the mix picks up real SFX, then the gates run.
# Usage: scripts/build_all.sh            DRAFT build (missing app screens → watermarked MOCKs) + mix + lint/check/preflight/sync
#        scripts/build_all.sh --render   … and render the full draft (out/draft/eduledger-launch-draft.mp4)
# The FINAL film is scripts/render_final.sh: no mocks, and it refuses to render while any MOCK or PLACEHOLDER remains.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d .kit/node_modules ] || scripts/setup-kit.sh
export HYPERFRAMES_TELEMETRY=0 DO_NOT_TRACK=1
export PRODUCER_HEADLESS_SHELL_PATH="${PRODUCER_HEADLESS_SHELL_PATH:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}"
HF=.kit/node_modules/.bin/hyperframes
[ -f music/edit/bed.wav ] || python3 -I scripts/timeline.py >/dev/null      # the edited music bed is rebuilt, not stored

if [ "${EL_MODE:-draft}" = "draft" ]; then
  echo "== mocks (internal drafts only)"; node scripts/build_mocks.mjs | tail -1
fi
echo "== build (resolve inputs)";  python3 -I scripts/build_web.py | tail -4
echo "== mix";                     python3 -I scripts/mix.py
echo "== build (with the master)"; python3 -I scripts/build_web.py | tail -2
echo "== inputs";                  python3 -I scripts/verify_inputs.py | tail -3 || true
mkdir -p out/audit
echo "== lint";                    $HF lint web > out/audit/lint.txt 2>&1; tail -1 out/audit/lint.txt
echo "== check (layout + contrast, 2 points per shot)"; python3 -I scripts/check_sweep.py
echo "== preflight";               node .kit/scripts/preflight.mjs web 2>&1 | sed 's/\x1b\[[0-9;]*m//g' > out/audit/preflight.txt; tail -1 out/audit/preflight.txt
echo "== sync";                    python3 -I scripts/sync_check.py
echo "== motion audit (§4/§5)";    node scripts/motion_audit.mjs
echo "== final gate (informational for drafts)"; python3 -I scripts/final_gate.py | tail -1 || true
if [ "${1:-}" = "--render" ]; then
  echo "== render";                scripts/render_draft.sh
  echo "== verify render";         python3 -I scripts/verify_render.py
  python3 -I scripts/write_verify.py
fi
