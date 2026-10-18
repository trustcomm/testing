#!/bin/sh
# the same video without captions (out/argon-nocaptions.mp4); intermediates go to build/nocap so the main render's are kept
set -e
B=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
P='{"captions":false}'
mkdir -p out build/nocap
npx remotion render src/index.ts Argon build/nocap/video.mp4 --props="$P" --codec=h264 --muted --pixel-format=yuv420p --video-bitrate=${VIDEO_BITRATE:-12M} --x264-preset=slow --browser-executable=$B
cp build/mix.wav build/nocap/mix.wav            # the audio is identical: captions do not change the mix
python3 -I scripts/master.py build/nocap/mix.wav build/nocap/master.m4a
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 build/nocap/video.mp4)
ffmpeg -y -v error -i build/nocap/video.mp4 -i build/nocap/master.m4a -map 0:v -map 1:a -c copy -t "$D" -movflags +faststart out/argon-nocaptions.mp4
ls -la out/argon-nocaptions.mp4
