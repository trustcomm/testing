#!/usr/bin/env bash
# Install the HyperFrames student kit at the pinned commit into films/eduledger-launch/.kit (gitignored, ~820 MB).
# Its LICENSE, THIRD_PARTY_NOTICES and licences are kept in third_party/hyperframes-student-kit/.
set -euo pipefail
cd "$(dirname "$0")/.."
KIT_SHA=0d30152a82b9ceb93cfdd9bdbf46f0d5ab3cde86
if [ ! -d .kit/.git ]; then
  git clone https://github.com/nateherkai/hyperframes-student-kit.git .kit
fi
git -C .kit fetch --depth 1 origin "$KIT_SHA" 2>/dev/null || true
git -C .kit checkout -q "$KIT_SHA"
(cd .kit && npm ci && npm run setup)
# Use the pre-installed headless Chromium instead of downloading one.
HS=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-linux 2>/dev/null | head -1)/headless_shell
[ -x "$HS" ] && export PRODUCER_HEADLESS_SHELL_PATH="$HS"
(cd .kit && npx hyperframes doctor) || true
echo "Render with: PRODUCER_HEADLESS_SHELL_PATH=$HS"
