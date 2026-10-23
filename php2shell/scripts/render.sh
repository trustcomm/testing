#!/bin/sh
# usage: sh scripts/render.sh [out=out/php2shell.mp4]
# 1. the picture, H.264 High at $VIDEO_BITRATE (default 14M), no audio; 2. public/mix.wav (scripts/build_mix.py) -> AAC 320 kbit/s;
# 3. mux, the audio trimmed to the video's length (the AAC encoder pads a few ms); 4. report the true peak of what was actually encoded.
set -e
OUT=${1:-out/php2shell.mp4}
B=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
mkdir -p out build
[ -f public/mix.wav ] || python3 scripts/build_mix.py
npx remotion render src/index.ts Php2Shell build/video.mp4 --props='{"audio":false}' --codec=h264 --muted --pixel-format=yuv420p --video-bitrate=${VIDEO_BITRATE:-14M} --x264-preset=slow --browser-executable=$B
ffmpeg -y -v error -i public/mix.wav -ar 48000 -c:a aac -b:a 320k -aac_coder fast -cutoff 20000 build/master.m4a
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 build/video.mp4)
ffmpeg -y -v error -i build/video.mp4 -i build/master.m4a -map 0:v -map 1:a -c copy -t "$D" -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=codec_name,profile,width,height,r_frame_rate,bit_rate,nb_frames,duration -of default=nw=1 "$OUT"
ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | tr '\r' '\n' | grep -E "Integrated loudness|I: |True peak|Peak: |LRA:" | tail -6
