# SFX: the sound vocabulary, the music bed and the mixer

Everything is synthesised procedurally in numpy (seeded: the files are byte-identical on every run), no samples, no network, no API key.
Taste: "Apple keynote at night": subtle, premium, clean, dark and warm; filtered noise, sine / FM tones, tuned partials, short convolution tails; no siren,
no harsh digital edge.

## Rebuild

```
cd php2shell
npm ci && npx tsx scripts/export_timeline.ts      # public/timeline.json from the cue modules (scenes, sound events, music cues)
python3 scripts/make_sfx.py                       # public/sfx/<name>.wav (+ index.json)         [only if missing: build_mix.py calls it]
python3 scripts/make_music.py                         # public/music_dark.wav, music_warm.wav           [only if missing / stale: build_mix.py calls it]
python3 scripts/build_mix.py                      # public/mix.wav, build/stems/{voice,sfx,music}.wav, public/mix_report.json
python3 scripts/qa_audio.py                       # the checks + docs/SFX_EVENT_TABLE.md (exit code 1 on FAIL)
python3 scripts/qa_audio.py --test                # the same on build/test_timeline.json: at least one event of EVERY sound, stress cases
python3 scripts/make_sfx.py --plots [name ...]    # spectrogram + waveform contact sheets -> build/sfx_plots/
python3 scripts/make_sfx.py --doc                 # regenerate this file's table
```

`build_mix.py` runs end to end (about a minute) and is deterministic (`qa_audio.py --check-determinism` compares the sha256 of two builds).

## How an event becomes sound (what scene owners need to know)

`src/cues/sNN.ts` lists `{ id, frame, sfx, gainDb?, pan?, pitch?, seed?, frames? }`.  `frame` is the frame of the visual HIT.  `index.json` says where in the file the
hit is (`hit`, seconds): the mixer places the file so that this instant lands on `frame * 1600` samples (48 kHz / 30 fps), to the sample.

- **start** sounds hit at their onset (a few ms in); **peak** sounds hit in the middle of the swell (whoosh_through 0.54 s, layer_sweep 0.74 s, whoosh 0.37 s);
  **end** sounds hit at their climax (alarm_swell 1.38 s, reverse_riser 2.36 s, focus_swoosh 0.47 s): the sound begins BEFORE `frame`.
  Continuous beds (sub_drone, data_hum) have hit 0.
- **level**: every file is peak-normalised to -1 dBFS.  The mixer calibrates so that a centred, `gainDb` 0 event peaks **12 dB under the voice's peak** (brief: 10-14 dB).
  `gainDb` is relative to that: -12 .. 0 is the range to use; tiny sounds (pings, ticks, scuttles) -20 .. -8, long beds (drones, chords, hums) -8 .. -3.
  Dense, long sounds (drones, chords, pads, big_hit) are far louder than their peak suggests: trust the QA's "voice-to-others" numbers.
- **pan** -1 .. +1, constant power (0.707 per channel at the centre, so a hard-panned mono sound is +3 dB in its channel). Stereo sounds (whoosh_through, spin_whoosh, plane_swish) use balance.
- **pitch** in semitones, by resampling (the sound gets shorter / longer, the hit offset follows). Tonal sounds were designed in the middle of the range so +-12 is fine.
- **seed** != 0: a deterministic +-0.5 semitone / +-0.6 dB variation of this one event (noisy sounds, repeated ticks).
- **frames**: cut a long sound to `frames` video frames. start sounds: the tail is cut (15 ms fade); end sounds: the FRONT is cut (the riser still ends on the hit);
  peak sounds: `frames` around the hit.
- **voice priority** (automatic): wherever an event's speech band (300 Hz-4.5 kHz) would come within 8 dB of the voice's, only that band is turned down, by at most 5 dB
  (3 ms attack, 90 ms release; the voice is looked at 150 ms ahead so a hit on the first frame of a word keeps its punch; sub bass and air are untouched).
  `qa_audio.py` prints how much each event was turned down: if it is more than 2-3 dB, lower that event's `gainDb` yourself.

## Music (scripts/make_music.py, structure from `music` in timeline.json)

Two stereo 48 kHz beds of the full length: `music_dark.wav` (S1-S9: C2 / G2 drone, then an Eb, a Db and a Gb creep in as the tension rises scene by scene towards S8 / S9;
a sub heartbeat; clock ticks on the 92 BPM grid: quarters, then eighths, then a few sixteenths; a wind swell per 8 bars; a riser into the drop) and `music_warm.wav`
(from `hopeStart`: C major, Cadd9 | G/B | Am7 | Fmaj7 ..., felt piano bass + melody, a light pluck arpeggio, a soft pad, faded out over the last 4.6 s).
The mixer: loudness-calibrates them (dark -25.5 LUFS, warm -24.5 LUFS before ducking), drops the dark bed over `dropFrames` (10) frames to -46 dB at `drop`, holds it until
`silentUntil`, then fades it out in 0.8 s (the piano_note SFX lands there); ducks both 8 dB under the voice (40 ms attack, 350 ms release, 150 ms hold, 30 ms look-ahead)
plus up to 4 dB under big SFX hits; carves 2 dB at 2 kHz and 3.5 dB above 3 kHz.

## Master

voice (HPF 60 Hz, 2.5:1 compressor above the voice's own loudness - 1.2 dB (= -24 dB), soft knee, 10 / 120 ms, then gain to **-14.0 LUFS measured on the stereo voice stem**
(= dual mono, BS.1770 reads a dual-mono file 3 dB louder than the mono file: the mono voice is -17.0 LUFS), look-ahead true-peak limiter at -2 dBTP) + sfx + music
-> bus glue (1.3:1, only the peaks) -> true-peak limiter at -1.15 dBTP (4x oversampled; ffmpeg ebur128 agrees).  Output `public/mix.wav` 48 kHz 24-bit stereo, exactly `totalFrames / 30` s.

## The sounds

| name | hit kind | dur s | hit s | stereo | centroid Hz | what it is, as built |
|---|---|---|---|---|---|---|
| `sub_drone` | start | 8.00 | 0.000 |  | 54 | 45 Hz + 0.38 Hz-detuned twin (slow beating) with soft harmonics at 2-5x so a phone speaker still hears it, a breath of dark air. Grows from silence (t^1.7) to 6.2 s, then breathes out. Place at frame 0 with gainDb about -8. Continuous: hit 0. |
| `clock_tick` | start | 0.25 | 0.000 |  | 526 | Dry filtered click (2.2-5.8 kHz, 1 ms) over a tiny wooden body (820 / 1710 / 2690 Hz, 18 ms) and a 410 Hz cavity, 24 dB-down room. Intimate; gainDb -4 or lower. |
| `thoom` | start | 1.60 | 0.011 |  | 40 | Sine gliding 80 -> 32 Hz (tau 160 ms) + 2nd/3rd harmonic (phone-audible), low-noise thump on the front, soft saturation, dark 1.3 s tail. Sub heavy: most energy is under 100 Hz. |
| `alarm_swell` | end | 1.50 | 1.376 |  | 286 | Two detuned saws a minor second apart (110 Hz + drift of 3.2 semitones), low-pass opening 330 -> 2800 Hz, tremolo accelerating 3 -> 14 Hz, air noise; t^2.3 build. NOT a siren. Hit = the climax at about 1.38 s: put `frame` on the hit and the swell starts 1.4 s earlier. |
| `server_ping` | start | 0.20 | 0.000 |  | 1765 | 1760 Hz sine + 2.76x inharmonic partial, 32 ms decay, 0.6 ms attack. `pitch` 0 .. 9 semitones for a run of pings (S1 uses k * 0.8). Use gainDb -20 .. -14. |
| `whoosh_through` | peak | 1.20 | 0.537 | yes | 2467 | STEREO. Wide band noise rising 220 -> 2900 Hz into the pass at 0.54 s, then the Doppler fall to 900 Hz; decorrelated L/R, low air-displacement rumble. Hit = the pass. |
| `ui_click` | start | 0.15 | 0.000 |  | 190 | 190 Hz damped thump (14 ms) + soft 1.2-3.6 kHz tick: a trackpad tap, not a mouse click. |
| `heartbeat` | start | 0.70 | 0.002 |  | 74 | Lub-dub: two rounded thumps (52 Hz / 58 Hz with a 55 % pitch drop in 30 ms), 0.22 s apart, the second at 72 %. Hit = the first thump. |
| `layer_sweep` | peak | 1.40 | 0.742 |  | 780 | Dark noise body sweeping 160 -> 1300 Hz with six shimmering partials (1.2-5.3 kHz, +4 semitones glide, per-partial tremolo) under a bell curve; hit = the middle of the swell (0.74 s). |
| `scuttle` | start | 0.60 | 0.000 |  | 4319 | Nine irregular ticks (3-6 kHz, 2 ms) with random level, over 0.52 s. Pan by `pan`; `seed` re-rolls the level/pitch a little. Very quiet by design: gainDb -6 or lower. |
| `key_click` | start | 0.10 | 0.000 |  | 574 | Key-down tick (1.5-6.2 kHz) + 340 Hz thock, and a soft key-up 52 ms later. Vary `pitch` +-2 / `seed`. |
| `reverse_riser` | end | 2.40 | 2.356 |  | 306 | A soft dark cymbal cluster + dust crackle + a falling tape-stop tone (45 + 300 e^(-t/0.7) Hz, wow and flutter) built FORWARDS, then reversed. Ends with a 30 ms ramp-down right after the hit (hit = 2.36 s). With `frames` the riser is shortened from the FRONT, so it still ends on the hit. |
| `focus_swoosh` | end | 0.55 | 0.469 |  | 2985 | Airy 650 -> 4800 Hz noise rising, a whispering 900 Hz+ tone, ending in a tiny lock (2.5 kHz tick, 22 ms) at 0.46 s = the hit. |
| `chip_tick` | start | 0.30 | 0.000 |  | 2856 | 1480 Hz tick (30 ms) with a bell tail (2.0x, 2.76x, 5.4x partials, up to 150 ms) and a 3.5-9 kHz click. `pitch` 0 / 4 / 9 for the three name chips. |
| `caught_click` | start | 0.25 | 0.000 |  | 544 | Two-part click-clack: a bright 780 Hz click, then 58 ms later a lower 520 Hz clack (a lid shutting). |
| `pluck` | start | 1.20 | 0.001 |  | 279 | Warm pluck at C4 (261.6 Hz): partials k^-1.35 with high ones dying first, detuned pairs, a soft pick. `pitch` = semitones above C4; the S5 motif is built from these. |
| `tok` | start | 0.25 | 0.000 |  | 469 | Soft wood knock: 460 Hz falling 22 % in 8 ms, 2.45x and 3.8x wood modes, a 1.1 kHz body puff. `pitch` -3 .. +3 per tiffin. |
| `bike_bell` | start | 1.40 | 0.001 |  | 2640 | Two inharmonic bright partials (2350 Hz and x1.505), each a beating pair (5.5 Hz shimmer), 0.55 / 0.36 s decay, small room. Gentle: low-passed at 7.5 kHz. |
| `tiffin_rattle` | start | 0.80 | 0.000 |  | 2466 | Nine metal ticks (1.3-3 kHz tin modes at 1 / 1.58 / 2.37 / 3.4x) accelerating over 0.5 s with a 0.2 s clattery 2.2-6.5 kHz tail. |
| `lid_clink` | start | 0.60 | 0.000 |  | 2652 | Bright metal tap: 2850 Hz (+3.2 Hz beating twin), 4310, 6200 and 1420 Hz rings (up to 160 ms), a 640 Hz body, small room. |
| `key_jingle` | start | 0.60 | 0.000 |  | 5523 | Five tumbling key ticks (4.1-6.3 kHz bells with 1.51x and 2.3x partials) over 0.32 s, levels 1 .. 0.36. |
| `uhoh_note` | start | 0.90 | 0.008 |  | 185 | Two soft descending saw+sine notes, G3 -> E3 (a minor third), 6-cent detuned pairs, a filter that closes, a scoop into each note. Hit = the first note. |
| `data_hum` | start | 4.00 | 0.000 |  | 163 | 55 Hz filtered saw pair with a 0.45 Hz cutoff LFO (380 +- 260 Hz), 650-2800 Hz flow noise with a 0.7 Hz swell, two thin whines (660 / 990 Hz). sin^2 fade in and out. Continuous: hit 0. |
| `swipe` | start | 0.30 | 0.014 |  | 2288 | Narrow band noise sweeping 1.1 -> 3.7 kHz in 0.24 s, 32 ms attack: a thumb on glass. |
| `glitch_tsk` | start | 0.15 | 0.000 |  | 3938 | High-passed noise burst (hard attack, 22 ms), a micro-stutter at 52 ms, then bit-crushed (4.5 bit) + sample-rate-reduced (hold 3) and low-passed at 9 kHz so the grit is tamed. `pitch` shifts the crush. |
| `stealth_pulse` | start | 0.70 | 0.013 |  | 52 | 50 Hz sine (+14 % pitch dip) + 2nd harmonic, 45 ms swell, 200 ms decay, dark room. Hit = its onset (13 ms). |
| `denied_buzz` | start | 0.60 | 0.000 |  | 131 | A soft click, then two stuttering low buzzes (92 Hz saw, filtered at 650 Hz, falling 1.2 semitones): the second one slower and dying. Reads as 'access denied' without being harsh. |
| `big_hit` | start | 2.00 | 0.005 |  | 43 | The loudest event: 28 -> 90 Hz sub boom (tau 220 ms, amplitude tau 560 ms), a 230 -> 70 Hz knock, 2nd/3rd harmonics, 2.6 kHz + 650 Hz noise transient, soft saturation, a dark 1.7 s tail. Dense sub energy gives loudness without a high peak. |
| `zap_sweep` | start | 0.90 | 0.013 |  | 2137 | Electric noise rising 170 -> 6000 Hz over 0.7 s (crackle modulation, an FM tone riding the sweep), then a 70 ms decay. Hit = the start of the sweep. |
| `ratchet_tick` | start | 0.08 | 0.000 |  | 1508 | 80 ms: dry 1.5-4.8 kHz tick + 1250 Hz pawl + a small second click at 12 ms. `pitch` +- 3 per tick as the needle moves. |
| `clunk` | start | 0.90 | 0.000 |  | 328 | Heavy thud: 98 -> 70 Hz body (140 ms), metal rings at 410 / 688 / 1133 / 1790 Hz (up to 250 ms), a 2.2 kHz transient. |
| `chime_pos` | start | 1.40 | 0.002 |  | 750 | Two FM-ish bells, C5 then G5 (a fifth up, 165 ms later), warm (sine + 2x + 3x partials), 1 s hall. Hit = the first note. |
| `ping_impact` | start | 0.35 | 0.000 |  | 2139 | Tight metal ping: 2100 / 3900 / 6300 / 1100 Hz modes (30-70 ms) + a click. `pitch` +- 3 to vary the deflected arrows. |
| `piano_note` | start | 3.50 | 0.002 |  | 279 | A felt piano C4: inharmonic partials (soft-hammer spectrum), two unequal strings (shallow beating), fast + slow decay, a felt thud, 1.6 s soft room. `pitch` = semitones above C4 (the music is in C major: 0, 4, 7 are safe). |
| `glass_tap` | start | 0.50 | 0.000 |  | 3283 | Bright tick + glass rings at 3150 (+8 Hz twin), 4780, 7350 and 1580 Hz (60-160 ms), small room. |
| `chord_resolved` | start | 4.00 | 0.005 |  | 261 | C major add9 (C3 G3 E4 D5 + C4) as felt piano, rolled over 75 ms, over a soft pad (0.75 s bloom, 1.6 s release), 2.2 s hall. Hit = the first note. |
| `type_click` | start | 0.08 | 0.000 |  | 280 | Soft keystroke: 1-4.2 kHz puff + 280 Hz thock (10 ms). Vary `pitch` +- 2 / `seed`. |
| `send_whoosh` | start | 0.45 | 0.031 |  | 1841 | Airy 600 -> 4200 Hz swoosh, 70 ms attack, with a faint rising 700 Hz tone. |
| `tick_asc` | start | 0.25 | 0.000 |  | 1803 | Clean 1760 Hz tick (2x partial) with a quiet bell tail. `pitch` 0, 2, 4, 7 for the four version lines. |
| `shutter` | start | 0.25 | 0.000 |  | 439 | Two soft clicks 74 ms apart (520 Hz then a lower 410 Hz): open and close. |
| `bonk_neg` | start | 0.50 | 0.000 |  | 168 | Low hollow knock 205 -> 150 Hz (falling = negative), 2.3x and 3.9x hollow modes, a 500 Hz thump, a short room. |
| `ding_pos` | start | 1.60 | 0.002 |  | 1521 | A clean E6 bell (partials 1, 2, 3, 4.2x; a 0.7 Hz twin) with a 1 s tail and a 1.1 s hall. |
| `spin_whoosh` | start | 0.80 | 0.089 | yes | 1248 | STEREO. Band noise (1250 +- 650 Hz) that goes once around the stereo field (pan = sin(2 pi t / 0.8): centre -> right -> centre -> left -> centre). Hit = its onset. |
| `pluck_resolve` | start | 1.80 | 0.003 |  | 536 | C4 E4 G4 C5 plucks, 150 ms apart, every note ringing out, the last one long (tau x1.7); 0.9 s hall. Hit = the first note. |
| `pop` | start | 0.20 | 0.002 |  | 855 | A rounded bubble: sine rising 260 -> 880 Hz in 14 ms, 32 ms decay, low-passed at 3.8 kHz. No click. |
| `plane_swish` | start | 0.90 | 0.020 | yes | 3604 | STEREO. Airy 900 -> 2800 Hz swoosh that moves left -> right (pan -0.92 -> +0.92 in 0.82 s). |
| `final_chime` | start | 3.50 | 0.002 |  | 1001 | Soft C6 bell (partials 1, 2, 2.4, 3, 4.2x + an octave-down C5 at -10 dB, a 0.55 Hz twin), 2.4 s tail, 2.4 s hall. |
| `whoosh` | peak | 0.80 | 0.370 |  | 2596 | Generic soft whoosh: band noise 300 -> 2200 Hz, peak at 0.37 s, falling to 700 Hz. |
| `tick` | start | 0.10 | 0.000 |  | 1494 | Generic soft tick: 2-6.2 kHz click + 1500 Hz body (10 ms). |

The spec text of each sound is in `src/sfx.ts`; the event table of the real film is `docs/SFX_EVENT_TABLE.md`.
