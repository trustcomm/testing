# trustcomm: launch motion-graphics film

A 47-second, 1920×1080 Google-style launch video for [trustcomm.app](https://trustcomm.app),
built with the HyperFrames + GSAP workflow from
[hyperframes-student-kit](https://github.com/nateherkai/hyperframes-student-kit).
It has music and sound effects, and room left for a voiceover.

## Deliverables

| File | What it is |
|------|------------|
| `renders/trustcomm-launch.mp4` | Final video with music and SFX (no VO) |
| `renders/video-silent.mp4` | Same picture with no audio, for your editor |
| `assets/audio/mix.wav` | Music + SFX mix (≈ −19 LUFS, leaves room for VO) |
| `assets/audio/music-bed.wav` | Music stem only (duck this under the VO) |
| `assets/audio/sfx.wav` | SFX stem only |
| `assets/audio/sfx/*.wav` | Individual one-shot sounds |
| `SCRIPT.md` | Timed voiceover script to record or generate with TTS |
| `STORYBOARD.md` / `DESIGN.md` | Scene plan, cue map and brand reference |

## Adding the voiceover

1. Generate the VO in your TTS app from `SCRIPT.md`, one clip per line or one full read.
2. In CapCut, Premiere or DaVinci, put `video-silent.mp4` on V1, `music-bed.wav` and `sfx.wav` on A1/A2, and the VO on A3, starting each line at the time in `SCRIPT.md`.
3. Duck the music bed by 4–6 dB under speech and bring the VO to about −16 LUFS.

## Editing and re-rendering

```sh
npm ci                                  # from the repo root (Node 22+, FFmpeg, Chrome)
cd trustcomm-launch
npx hyperframes preview                 # live Studio at http://localhost:3002
python3 scripts/make_audio.py           # regenerate music + SFX (needs numpy, scipy)
npx hyperframes render --quality standard --output renders/video-silent.mp4
ffmpeg -y -i renders/video-silent.mp4 -i assets/audio/mix.wav -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 256k -shortest renders/trustcomm-launch.mp4
```

All copy is in `index.html`. Every animation cue is an absolute time in the GSAP timeline, and
the matching sound cue uses the same time in `scripts/make_audio.py`. If you move one, move the other.
