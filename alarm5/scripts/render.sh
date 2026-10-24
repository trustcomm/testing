#!/bin/sh
# usage: sh scripts/render.sh [out=out/alarm5.mp4]
# 1. the picture, 60 fps, H.264 High, CRF 14 (x264 slow), yuv420p, no audio; frames go to ffmpeg from memory (no frame files on disk)
# 2. public/mix.wav (scripts/build_mix.py) -> AAC 320 kbit/s; 3. mux, the audio trimmed to the video's length; 4. the true peak of what was actually encoded
# 5. optional 30 fps copy: COPY30=1 sh scripts/render.sh   (out/alarm5-30fps.mp4, CRF 16, every second frame)
set -e
OUT=${1:-out/alarm5.mp4}
B=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
mkdir -p out build
[ -f public/mix.wav ] || python3 scripts/build_mix.py
npx remotion render src/index.ts Alarm5 build/video.mp4 --props='{"audio":false}' --codec=h264 --muted --pixel-format=yuv420p --crf=${CRF:-14} --x264-preset=slow --image-format=${IMAGE_FORMAT:-jpeg} --jpeg-quality=100 --concurrency=${CONCURRENCY:-4} --browser-executable=$B
ffmpeg -y -v error -i public/mix.wav -ar 48000 -c:a aac -b:a 320k -aac_coder fast -cutoff 20000 build/master.m4a
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 build/video.mp4)
ffmpeg -y -v error -i build/video.mp4 -i build/master.m4a -map 0:v -map 1:a -c copy -t "$D" -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=codec_name,profile,width,height,r_frame_rate,bit_rate,nb_frames,duration -of default=nw=1 "$OUT"
ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | tr '\r' '\n' | grep -E "Integrated loudness|I: |True peak|Peak: |LRA:" | tail -6
if [ "${COPY30:-0}" = 1 ]; then
  ffmpeg -y -v error -i "$OUT" -vf fps=30 -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -c:a copy -movflags +faststart out/alarm5-30fps.mp4
  ls -l out/alarm5-30fps.mp4
fi
