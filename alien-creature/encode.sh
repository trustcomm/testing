#!/usr/bin/env bash
# Encode rendered frames. Run after: node render.mjs video --ss 2
set -euo pipefail
cd "$(dirname "$0")"
FPS=30
SRC=frames_ss2/f%05d.png
mkdir -p out

# supersampled 1080x1920 (2x render, lanczos down)
ffmpeg -y -v error -framerate $FPS -i "$SRC" -vf "scale=1080:1920:flags=lanczos" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart out/final_1080_ss.mp4

# native 2160x3840 from the same frames
ffmpeg -y -v error -framerate $FPS -i "$SRC" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart out/final_2160.mp4

# silent audio track for uploaders that reject video-only files
ffmpeg -y -v error -i out/final_1080_ss.mp4 -f lavfi -i anullsrc=r=48000:cl=stereo \
  -c:v copy -c:a aac -shortest out/final_1080_ss_silent_track.mp4

# thumbnail: the loop's first frame
ffmpeg -y -v error -i frames_ss2/f00000.png -vf "scale=1080:1920:flags=lanczos" -q:v 2 out/thumb.jpg

ls -la out
