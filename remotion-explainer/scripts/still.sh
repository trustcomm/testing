#!/bin/sh
# usage: scripts/still.sh <frame> <out.png> [propsJson]
npx remotion still src/index.ts Explainer "$2" --frame="$1" --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --props="${3:-{\"mode\":\"full\"\}}" --log=error
