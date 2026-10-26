#!/usr/bin/env bash
# Word timestamps for your VO, run on YOUR Mac (M1 Pro is fine).
# Usage: bash scripts/transcribe.sh paste-leak
# Output: src/reels/<reel>/timings.json  → then: npm run timeline -- <reel>
set -e
REEL=${1:-paste-leak}
VO="public/reels/$REEL/vo.mp3"
OUT="src/reels/$REEL"
[ -f "$VO" ] || { echo "Put your voiceover at $VO first"; exit 1; }

if ! python3 -c "import whisper" 2>/dev/null; then
  echo "Installing openai-whisper (one time)…"
  pip3 install -U openai-whisper
  command -v ffmpeg >/dev/null || brew install ffmpeg
fi

# --language en makes Whisper write Hinglish in Latin letters ("ek employee ne…"),
# which aligns far better with the script than Devanagari output.
python3 -m whisper "$VO" --model small --language en --word_timestamps True \
  --output_format json --output_dir /tmp/whisper_$REEL --fp16 False
cp "/tmp/whisper_$REEL/vo.json" "$OUT/timings.json"
echo "✓ $OUT/timings.json written. Next: npm run timeline -- $REEL"
