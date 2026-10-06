#!/usr/bin/env bash
# Frame strips around given frame numbers, for verifying cuts and transition types by eye.
# Usage: scripts/strips.sh <video> <out.png> <tile-width> <before> <after> <frame> [<frame> ...]
# Each row is one frame number: frames (n-before) .. (n+after-1), labelled with frame index and time.
set -euo pipefail
video=$1 out=$2 tw=$3 before=$4 after=$5; shift 5
tmp=$(mktemp -d)
cols=$((before + after))
i=0
for n in "$@"; do
  a=$((n - before)); b=$((n + after - 1)); [ $a -lt 0 ] && a=0
  ffmpeg -v error -y -i "$video" -vf "select='between(n\,$a\,$b)',scale=$tw:-2,drawtext=text='f%{n}':x=4:y=4:fontsize=14:fontcolor=yellow:box=1:boxcolor=black@0.7,tile=layout=${cols}x1:padding=2:color=red" \
    -fps_mode passthrough -frames:v 1 "$tmp/r$(printf %03d $i).png" 2>/dev/null || true
  # the drawtext n restarts per select; overlay the absolute start frame on the row
  ffmpeg -v error -y -i "$tmp/r$(printf %03d $i).png" -vf "pad=iw:ih+20:0:20:black,drawtext=text='cut cand f$n (row starts f$a)':x=4:y=2:fontsize=14:fontcolor=white" "$tmp/s$(printf %03d $i).png"
  i=$((i + 1))
done
inputs=(); for f in "$tmp"/s*.png; do inputs+=(-i "$f"); done
if [ $i -gt 1 ]; then
  ffmpeg -v error -y "${inputs[@]}" -filter_complex "vstack=inputs=$i" "$out"
else
  cp "$tmp/s000.png" "$out"
fi
rm -rf "$tmp"
echo "$out"
