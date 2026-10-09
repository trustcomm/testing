#!/usr/bin/env bash
# Mux the rendered picture and the synthesized score into the delivery file for Reels / TikTok:
# H.264 High (picture stream copied, yuv420p, BT.709 tagged) + AAC-LC 320 kb/s 48 kHz stereo, moov atom first.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
ffmpeg -hide_banner -loglevel error -y \
  -i build/picture.mp4 -i build/score.wav \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy -bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 320k -ar 48000 -ac 2 \
  -movflags +faststart -shortest \
  -metadata title="Flow State" -metadata artist="Baqur.ai" \
  out/flow-state.mp4
ls -l out/flow-state.mp4
