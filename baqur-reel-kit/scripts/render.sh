#!/bin/sh
# Final render of a reel: H.264 High CRF 14 (x264 slow), 60 fps, PNG frames (no JPEG loss in the dark gradients), then loudness-normalised audio.
# usage: sh scripts/render.sh AgentLied agent-lied            ->  out/agent-lied.mp4
#   CRF=16 CONCURRENCY=4 SCALE=0.5 (a half-size preview) are optional.
# Audio: the composition mixes the VO and the SFX stem (public/reels/<reel>/); the result is measured and normalised to -14 LUFS / -1.5 dBTP in two passes (linear, no pumping).
set -e
COMP=${1:-AgentLied}; REEL=${2:-agent-lied}
OUT=out/$REEL.mp4; RAW=out/$REEL.raw.mp4
B=${BROWSER:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
[ -x "$B" ] && BROWSER_FLAG="--browser-executable=$B" || BROWSER_FLAG=""
mkdir -p out
npx remotion render "$COMP" "$RAW" --codec=h264 --crf=${CRF:-14} --x264-preset=slow --pixel-format=yuv420p --image-format=png --concurrency=${CONCURRENCY:-4} --scale=${SCALE:-1} $BROWSER_FLAG
M=$(ffmpeg -hide_banner -nostats -i "$RAW" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
v() { echo "$M" | sed -n "s/.*\"$1\" *: *\"\([^\"]*\)\".*/\1/p"; }
ffmpeg -y -v error -i "$RAW" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(v input_i):measured_TP=$(v input_tp):measured_LRA=$(v input_lra):measured_thresh=$(v input_thresh):offset=$(v target_offset):linear=true" -ar 48000 -c:a aac -b:a 320k -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=codec_name,profile,width,height,r_frame_rate,bit_rate,nb_frames,duration -of default=nw=1 "$OUT"
ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | tr '\r' '\n' | grep -E "I: |Peak:|LRA:" | tail -3
