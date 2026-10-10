# FORM / FREQUENCY

[Download the 15-second film](https://github.com/trustcomm/testing/raw/refs/heads/codex/form-frequency-showreel/films/form-frequency/form-frequency-15s.mp4)

[Download editable source](https://github.com/trustcomm/testing/raw/refs/heads/codex/form-frequency-showreel/films/form-frequency/Form-Frequency-Editable-Source.zip)

**1920 × 1080 · 60 fps · stereo AAC · H.264 MP4**

An original six-part motion-design showreel built with **GLSL, Canvas and Web Audio**. Glossy procedural sculptures, rotating graphic tiles, an optical tunnel, a disrupted geometric grid, a fluid transformation and a bold typographic finish are synchronized to an original synthesized 120 BPM score. No recorded music or external visual footage.

The source lives in `source/`. It includes an interactive browser preview, deterministic `renderAt(seconds)`, GLSL shaders, sound synthesis, fonts with their licenses, a pinned Node dependency and a frame-capture export script. See the source README for playback and rendering commands. The ZIP is self-contained source; generated audio is recreated by Web Audio.

## Added reference skill

The requested [awesome-opus5-5-videos repository](https://github.com/yihui-dev/awesome-opus5-5-videos) has a prompt catalog rather than an installable skill. This project adds `.agents/skills/awesome-opus-videos`, a Codex skill adapter with offline search over 513 pinned entries, source attribution, full/partial prompt distinctions and eight passing retrieval tests. `AGENTS.md` routes requests naming the collection to the adapter.

[Download the portable skill](https://github.com/trustcomm/testing/raw/refs/heads/codex/form-frequency-showreel/films/form-frequency/awesome-opus-videos-skill.zip). Extract its `awesome-opus-videos` directory under another project's `.agents/skills/` directory.

```bash
python -I .agents/skills/awesome-opus-videos/tests/test_search.py
python .agents/skills/awesome-opus-videos/scripts/search.py "kinetic shader cinematic audio motion" --category motion --tag canvas --tag shader --tag audio --limit 4 --json
```

The selected reference is [@prasenx's original prompt](https://x.com/prasenx/status/2103538744695693512). Its 15-second brief, code-only score, beat synchronization and export specifications informed this original production. The linked reference video and its unpublished implementation were not downloaded or copied. `references.json` records the shared prompt and attribution.

## Verification

`validation.json` records duration, 900 frames at 60 fps, dimensions, codecs, audio levels, full FFmpeg decoding, beat-aligned cuts, full-resolution shader rendering, fast-start MP4 structure and SHA-256. `source-validation.json` records repeated-frame equality, loaded fonts and live Web Audio playback. `browser-validation.json` records actual Chromium loading, seeks across all six movements and successful playback. Downloaded GitHub files are checked against local SHA-256 hashes before delivery.
