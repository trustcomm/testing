#!/bin/sh
# usage: scripts/render.sh [out=out/argon.mp4] [props='{}']
# 1. the picture, H.264 high profile at $VIDEO_BITRATE (default 12M; no audio); 2. the mixdown as WAV; 3. master it to -16 LUFS and encode AAC 320 kbit/s;
# 4. mux, with the audio trimmed to the video's length (the AAC encoder pads a few ms).
set -e
OUT=${1:-out/argon.mp4}; PROPS=${2:-'{}'}
B=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
mkdir -p out build
npx remotion render src/index.ts Argon build/video.mp4 --props="$PROPS" --codec=h264 --muted --pixel-format=yuv420p --video-bitrate=${VIDEO_BITRATE:-12M} --x264-preset=slow --browser-executable=$B
npx remotion render src/index.ts Argon build/mix.wav --props="$PROPS" --codec=wav --browser-executable=$B
python3 -I scripts/master.py build/mix.wav build/master.m4a
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 build/video.mp4)
ffmpeg -y -v error -i build/video.mp4 -i build/master.m4a -map 0:v -map 1:a -c copy -t "$D" -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=codec_name,profile,width,height,r_frame_rate,bit_rate,nb_frames,duration -of default=nw=1 "$OUT"
