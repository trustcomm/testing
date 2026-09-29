# ElevenLabs voiceover: frame-matched prompt

Video: `renders/video-silent.mp4` (47.0 s, 30 fps). Every cue below starts on the frame where
its words appear or its action happens on screen.

## 1. Voice

**Voice Design prompt** (Voices → Add voice → Voice Design):

> A warm, friendly, confident narrator in their late 20s to 30s with a clear neutral accent.
> Smiling, upbeat but calm, like a modern tech product launch film. Crisp diction, natural
> conversational rhythm, no radio-announcer hype. Studio-quality, close-mic, no reverb.

Or pick any warm, conversational narration voice from the Voice Library. For an Indian audience,
search the library for "Indian English narrator".

**Settings:** Model **Eleven Multilingual v2** (supports `<break>` tags) · Stability **50%** ·
Similarity **75%** · Style **25%** · Speaker boost **on** · Speed **1.0** (use 1.05 if lines run long).

## 2. Best sync: one clip per cue (recommended)

Generate each line as its own clip, then place it on the timeline at its **Start** time.
The **Hits on** column tells you which word should land on which visual. Nudge the clip so it does.

| # | Start | Must end by | Paste into ElevenLabs | Hits on (frame) |
|---|-------|-------------|-----------------------|-----------------|
| 1 | 0:00.40 | 0:04.50 | `Your customers love your store… but most never leave a review.` | "love your store" as the headline appears (2.5 s); "review" as the yellow marker sweeps (3.9 s) |
| 2 | 0:05.30 | 0:07.60 | `Asking for reviews? It's a headache.` | "headache" on the red word pop (5.8 s) |
| 3 | 0:07.60 | 0:08.50 | `Long links.` | the review URL typing out (7.55 s) |
| 4 | 0:08.60 | 0:10.90 | `"I'll do it later"… never happens.` | "I'll do it later" card (8.55 s); "never happens" on the 3.9★ tile (9.15 s) |
| 5 | 0:11.65 | 0:12.60 | `Meet trustcomm.` | "Meet" on screen (11.6 s); "trustcomm" as the logo springs in (12.15 s) |
| 6 | 0:13.10 | 0:16.40 | `The easiest way to get Google reviews from your customers.` | subtitle appears (13.05 s) |
| 7 | 0:17.00 | 0:20.80 | `First, customers scan your QR code at the counter.` | step 1 highlights (17.7 s); "scan" during the scan line (18.45 s) |
| 8 | 0:21.10 | 0:24.90 | `Then they tap the stars… and add a quick note.` | "stars" as the stars fill (21.6–22.3 s); "note" while the text types (22.8 s) |
| 9 | 0:25.10 | 0:26.00 | `One tap…` | the finger tap (25.7 s) |
| 10 | 0:26.30 | 0:29.00 | `and their review is live on Google.` | "live on Google" as the review lands and the count goes to 249 (27.2–27.5 s) |
| 11 | 0:29.10 | 0:29.90 | `Done. In seconds.` | end of the phone scene, before the wipe (29.9 s) |
| 12 | 0:30.80 | 0:31.50 | `More reviews.` | headline words (30.8 s) |
| 13 | 0:31.60 | 0:32.80 | `A better rating.` | rating counting 3.9 → 4.8 (31.4–33.4 s) |
| 14 | 0:33.00 | 0:35.50 | `And more customers finding your store.` | "Top rated nearby" badge pops (34.1 s) |
| 15 | 0:37.60 | 0:38.30 | `No chasing.` | line 1 (37.55 s) |
| 16 | 0:38.40 | 0:39.20 | `No awkward asks.` | line 2 (38.35 s) |
| 17 | 0:39.30 | 0:40.80 | `Just more five-star reviews.` | "five-star" on the colour burst (39.5 s) |
| 18 | 0:41.90 | 0:42.50 | `trustcomm.` | logo springs in (41.95 s) |
| 19 | 0:42.70 | 0:44.50 | `Google reviews, without the headache.` | tagline appears (42.7 s) |
| 20 | 0:44.70 | 0:46.10 | `trustcomm dot app.` | CTA pill pulsing (44.4 s), before the fade (46.3 s) |

Silent gaps (0:04.5–5.3, 0:10.9–11.65, 0:16.4–17.0, 0:29.9–30.8, 0:35.5–37.6, 0:40.8–41.9)
land on the transition whooshes and let the music breathe. Leave them empty.

## 3. Quick option: one-shot full read

Paste this whole block into Text to Speech with **Multilingual v2**, then place the file at
**0:00.40**. The `<break>` tags are tuned to about 2.6 words/sec. If a section drifts, split the
audio at that pause and slide it to the start time in the table above.

```
Your customers love your store… but most never leave a review. <break time="0.8s" />
Asking for reviews? It's a headache. Long links. <break time="0.2s" />
"I'll do it later"… never happens. <break time="0.8s" />
Meet trustcomm. <break time="0.6s" />
The easiest way to get Google reviews from your customers. <break time="0.6s" />
First, customers scan your QR code at the counter. <break time="0.5s" />
Then they tap the stars… and add a quick note. <break time="0.3s" />
One tap… <break time="0.3s" /> and their review is live on Google. <break time="0.1s" />
Done. In seconds. <break time="0.9s" />
More reviews. <break time="0.1s" /> A better rating. <break time="0.2s" />
And more customers finding your store. <break time="2.1s" />
No chasing. <break time="0.1s" /> No awkward asks. <break time="0.1s" />
Just more five-star reviews. <break time="1.1s" />
trustcomm. <break time="0.3s" /> Google reviews, without the headache. <break time="0.2s" />
trustcomm dot app.
```

If you use **Eleven v3** instead: remove the `<break>` tags (v3 doesn't support them), keep the
`…` ellipses for pauses, and add a tone tag at the top, e.g. `[warm, friendly, upbeat]`. Use the
per-clip method in section 2 for timing.

## 4. Pronunciation

- **trustcomm** → "TRUST-comm", one word, stress on *trust*. If the voice splits it, add a
  pronunciation dictionary alias `trustcomm → trust comm`.
- **trustcomm.app** → always write it as `trustcomm dot app` in the prompt.

## 5. Mixing in your editor

- V1 `video-silent.mp4` · A1 `assets/audio/music-bed.wav` · A2 `assets/audio/sfx.wav` · A3 voiceover.
- VO at about **−16 LUFS** (peaks around −3 dB). Duck the music **−5 dB** under speech. Keep SFX as is.
- Export H.264 1080p30, AAC 256 kbps.
