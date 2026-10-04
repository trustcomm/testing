# STATE: Hindi business-story video factory

| Stage | Status |
|---|---|
| 1 Plan (file tree + scene schemas) | ✅ approved (choices recorded below) |
| 2 Tokens + format.ts + Paper/Ink stills | ✅ approved |
| 3 Scene library + contact sheet | ✅ approved (changes applied, below) |
| 4 Pipeline scripts + Byju's draft | ✅ draft done, ⏸ **awaiting approval** |
| 5 Final render + report.json + QA | 🚫 **BLOCKED**: needs real word timings (see blocker) |
| 6 NOTES.md, FROZEN headers, tag | not started |

---

## Stage 1: plan

### Facts measured in this environment (numbers, not impressions)

| Item | Value |
|---|---|
| Supplied voice file | `ElevenLabs_2026-10-04T18_58_01_…mp3`: **38.61 s**, mono, 44.1 kHz, one file for the whole film |
| Pauses ≥ 0.35 s (−35 dB) | **corrected in Stage 2**, see below |
| Start of file | ~~silent until 5.48 s~~ **wrong, see correction**: speech starts at ~0.1 s |
| Whisper model hosts | huggingface.co → **403**, openaipublic.azureedge.net → **403** (blocked by network policy) |
| Remotion's Chrome download | blocked; Playwright's headless shell is installed and worked for the earlier Remotion project |
| Google Fonts from Chrome | fails (cert); fonts are vendored as .woff2 (same files) |
| ffmpeg | 6.1.1 (has `sidechaincompress`, `loudnorm`, `ebur128`, `silencedetect`, `blackdetect`, `freezedetect`) |

### Decisions I need from you (⏸)

1. **One VO file → per-scene WAVs.** Proposal: a `split` step cuts the master at the pauses nearest each scene boundary. It assigns one cut per scene boundary in narration order, choosing the pause whose position best matches the cumulative word share of the narration. It prints the proposed cut table for approval before writing `audio/s010.wav…`. Future films can supply per-scene files directly, or use `tts`.
2. **Word timing without Whisper.** Options:
   (a) you add `huggingface.co` to the environment's allowed domains → real multilingual Whisper alignment as specified;
   (b) you supply ElevenLabs word or character timestamps → used directly;
   (c) fallback: per-scene boundaries are exact (from the split); words inside a scene are spread by syllable weight (about ±120 ms, measured last time).
   The align step supports all three; (c) is the default until (a) or (b) exists.
3. **The `tts` step** is built (ElevenLabs, key from `.env`, cache = hash(voice settings + spoken text), `meta.pronounce` respellings), but it is **not run**, per your instruction. Provided audio always wins.
4. **Fingerprint scope.** You specified data + duration + timings + pixel meta + tokens + *only that scene type's file*. Risk: shared files that also draw pixels (scene frame with the 0.2 s fades, in-canvas captions, fonts, format.ts) wouldn't invalidate the cache if edited. Recommend adding exactly those shared files to every fingerprint. Since the engine gets frozen, this only matters before the freeze. Your call; default = your spec plus these shared files.
5. **Music.** None supplied. I'll generate a procedural bed and a premium-styled SFX kit (whoosh for the wipe, ticks, paper slides, impacts, a sting), all royalty-free and replaceable by dropping files into `assets/`.

### File tree

```
factory/
  package.json            scripts: validate | split | tts | align | plan | render | mix | build | tools:*
  tsconfig.json
  remotion.config.ts      REMOTION_BROWSER env → headless shell
  .env.example            ELEVENLABS_API_KEY=, ELEVENLABS_VOICE_ID=
  STATE.md  NOTES.md      progress log / frozen rules (Stage 6)
  assets/
    fonts/                AnekLatin, AnekDevanagari (latin+deva), Inter: .woff2
    sfx/                  generated: wipe, tick, pop, slide, impact, sting, … .wav
    music/bed.wav         generated, replaceable
  films/<slug>/
    video.json            { meta, scenes[] }: the ONLY file edited per film
    voice/master.mp3      optional single take (split → audio/)
    audio/<id>.wav        per-scene voice (supplied, split, or tts)
    timestamps.json       optional word/char timings (ElevenLabs)
    build/
      align/<id>.json     word timings per scene (our words, borrowed times)
      timeline.json       plan output
      scenes/<id>.<fp>.mp4  per-scene renders (cache)
      audio/<id>.wav      per-scene audio padded to exact frame length
      film.mp4  report.json  captions.srt  chapters.txt  stills/contact.png
  src/
    index.ts  Root.tsx    compositions: Scene (one scene, props from timeline) + Film (preview)
    brand/                FROZEN after stage 2
      tokens.ts           colours, type, motion, layout, captions band
      format.ts           Indian grouping, ₹ lakh/crore, $ billion
      motion.ts           progress/tween/tweenColor (single ease, 9/15/24f)
      fit.ts              fit(text, box, font) → font size (measureText, no overflow)
      fonts.ts            vendored font loading
      random.ts           seeded random(seed) re-export + helpers
    engine/
      manifest.ts         Zod: Meta, Scene (discriminated union by type)
      SceneFrame.tsx      bg, 0.2s fade-from/to bg, safe area, captions band
      Captions.tsx        Roman Hinglish, per-word, active word saffron, in-canvas
      Words.tsx           per-WORD animation helper (Devanagari conjuncts intact)
      Wordmark.tsx        company names in Anek (never logos)
      SaffronWipe.tsx     signature transition
      pace.ts             reveal schedule across the voice span (word-anchored)
      fingerprint.ts      sha256 of the inputs listed in decision 4
    scenes/               one file per type, default export + `schema`
      title.tsx  stat.tsx  bars.tsx  timeline.tsx  moneyMap.tsx  versus.tsx
      xray.tsx  reasons.tsx  founder.tsx  verdict.tsx  outro.tsx  index.ts (registry)
  scripts/
    validate.ts  split.ts  tts.ts  align.ts  plan.ts  render.ts  mix.ts  sfx.py
    tools/scene-at.ts  tools/chapters.ts  tools/srt.ts
```

### Manifest

```ts
const Meta = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  fps: z.literal(30).default(30),
  width: z.literal(1920).default(1920),
  height: z.literal(1080).default(1080),
  lead: z.number().min(0).max(1).default(0.25),   // s before voice
  tail: z.number().min(0).max(1.5).default(0.45), // s after voice
  theme: z.enum(["paper", "ink"]).default("paper"),
  channel: z.string(),
  pronounce: z.record(z.string(), z.string()).default({}), // voice-only respellings
  music: z.object({ file: z.string(), gainDb: z.number().default(-20) }).optional(),
});
const Base = z.object({
  id: z.string().regex(/^s\d{3}$/),                // s010, s015, s020…
  narration: z.string(),                           // Hinglish (Roman) — no digits
  captions: z.string().optional(),                 // override caption text (Roman); default = narration
  sfx: z.array(z.object({ name: z.string(), atWord: z.number().int().optional(), at: z.number().optional(), gainDb: z.number().default(-6) })).optional(),
  chapter: z.string().optional(),                  // starts a YouTube chapter
  theme: z.enum(["paper", "ink"]).optional(),      // per-scene override (verdict = ink)
  wipeIn: z.boolean().default(false),              // saffron wipe at the start (act change)
});
const Scene = z.discriminatedUnion("type", [Title, Stat, Bars, Timeline, MoneyMap, Versus, Xray, Reasons, Founder, Verdict, Outro]);
```

`anchor` below = optional 0-based word index in that scene's narration; the element appears on that
word. Otherwise reveals are spread evenly across the voice span (`pace.ts`).

### Scene types (`data` schemas)

| type | `data` (Zod) | Renders |
|---|---|---|
| **title** | `{ kicker?: str≤40, title: str≤60, subtitle?: str≤90, wordmark?: str≤24 }` | wordmark/kicker, per-word title reveal |
| **stat** | `{ value: num, from?: num, unit: enum("inr","inr_lakh","inr_crore","inr_lakh_crore","usd","usd_million","usd_billion","pct","count"), label: str≤60, trend: enum("up","down","neutral"), approx?: bool, note?: str≤80, anchor?: int }` | NumberCounter (Inter tabular), colour by trend (green/crimson/ink), held ≥ 60 f |
| **bars** | `{ title?: str≤60, unit: same enum, items: [{ label: str≤24, value: num, role?: enum("primary","second","muted","growth","loss"), anchor?: int }] (2–8) }` | vertical bars, labelled; validator rejects max/min > 40 |
| **timeline** | `{ years: int[] (2–12, ascending), events: [{ year: int, text: str≤48, tense?: "past"\|"future", anchor?: int }] (1–6) }` | TimelineRuler; active year moves event by event |
| **moneyMap** | `{ nodes: [{ id: str, label: str≤24, kind?: "company"\|"investor"\|"person"\|"bank" }] (2–6), flows: [{ from: id, to: id, amount?: num, unit?: enum, label?: str≤32, direction?: "in"\|"out", anchor?: int }] (1–8) }` | wordmark nodes on a grid, flat arrows drawn in sequence |
| **versus** | `{ left: { name: str≤24, value?: num, unit?: enum, caption?: str≤60 }, right: {same}, metric?: str≤40 }` | split screen; left = ink/primary, right = cobalt (second entity) |
| **xray** | `{ entity: str≤24, unit: enum, segments: [{ label: str≤24, value: num, kind: "revenue"\|"cost"\|"loss"\|"profit", anchor?: int }] (2–7), total?: { label: str≤24, value: num } }` | stacked bar of how money is earned/lost; loss = crimson, profit = green |
| **reasons** | `{ title?: str≤50, items: [{ title: str≤40, icon: enum(IconName), anchor?: int, iconText?: str≤8 }] (2–5) }` | numbered cards revealed across the narration; earlier ones dim to stone |
| **founder** | `{ name: str≤32, role?: str≤40, years?: str≤20, quote?: str≤120 }` | flat silhouette card (geometric, no photo) |
| **verdict** | `{ word: str≤16, anchorWord?: int }` | one huge word, still, fast fade + 8 px rise; ink theme by default |
| **outro** | `{ line: str≤60, cta?: str≤40 }` | end card, channel name in saffron |

Shared layout rules (enforced in `SceneFrame` + `fit.ts`): content inside x ∈ [160, 1760], y ≤ 860;
captions band y 880–1040; every variable-length string goes through `fit()`; numbers via `format.ts` only.

### Validator rules (`validate.ts`)
- **Schema:** Zod-check meta and every scene; unknown `type` fails.
- **Ids:** duplicate `id` fails; ids must be ascending.
- **Narration:** any digit (`/[0-9०-९]/`) fails; word count outside 6–55 fails.
- **Variety:** 3 scenes of the same type in a row fails.
- **`bars`:** max/min > 40 fails.
- **Anchors:** an `anchor` greater than or equal to the scene's word count fails.
- **Output:** prints `scenes · words · est. minutes (words / 2.5 wps)`.

### Pipeline (each step prints one summary line)
`validate → split|tts → align → plan → render [--draft] [--stills] [--only s030] → mix`
- **plan:** `frames = ceil((lead + voiceDur + tail) * fps − 1e-6)`; writes `timeline.json` (start, dur, frames, lead, words).
- **render:** one Remotion render per scene. It skips a scene when `<id>.<fp>.mp4` exists, runs a worker pool (default 2), writes `.tmp` then renames, and `--draft` renders at 960×540.
- **mix:** concat video with `-c copy`. Pad each scene's audio to exactly `frames/fps` s and concat. Duck the bed with `sidechaincompress`, then `loudnorm I=-14 TP=-1.5`, then mux. `report.json` records planned vs real length (fails if they differ by more than 0.1 s), LUFS and peak.
- **tools:** `scene-at 01:23`, `chapters` (first at 00:00, ≥ 3 chapters, each ≥ 10 s), `srt`.

### Risks I'll report on as they come up
- Per-scene Remotion renders each start a browser, which adds per-scene overhead. Measured in Stage 4.
- `-c copy` concat needs identical encoder settings for every scene. Enforced via one render config.
- Placing SFX by word index depends on alignment quality (see decision 2).

---

## Stage 1 approval: choices (recorded)
1. **Split:** cut at the **midpoint** of the pause nearest each scene boundary, never inside a breath or word tail. 5 scenes (s010–s050). Trim leading silence to `meta.lead`. Show the cut table before writing. Stop if 0–5.48 s is quiet speech.
2. **Align:** multilingual Whisper (not `.en`) via huggingface.co. Keep script words, borrow timings. If still blocked at align → fallback (c) for this demo only, logged as a known issue.
3. **Fingerprint:** includes the scene type file **plus** the shared pixel files: scene frame (fades/wipe), captions, tokens.ts, format.ts, bundled font files. Exact list goes into NOTES.md.
4. **Placeholder audio:** quiet neutral bed (no melody), ducked; SFX kit = tick, swipe, hit, logo only; SFX gain ≤ 0.6; replaceable at the same paths; marked PLACEHOLDER in NOTES.md.
5. **Script:** the supplied video.json. Key names adapted to the schemas; narration and figures unchanged; schemas extended in Stage 3 where needed (e.g. stat counting down 22 → ~0).
- **Fonts:** Anek Latin, Anek Devanagari, Inter bundled locally (SIL OFL). No Google Fonts at render time.

## Stage 2: tokens, format.ts, frame stills

### Correction (measurement error in Stage 1)
The Stage 1 pause table paired ffmpeg's `silence_start`/`silence_end` lines off by one. Re-measured
(`silencedetect=noise=-35dB:d=0.35`), correctly paired:

| # | pause (s) | length | midpoint |
|---|---|---|---|
| 1 | 5.11–5.48 | 0.36 | 5.29 |
| 2 | 7.70–8.14 | 0.45 | 7.92 |
| 3 | 10.89–11.29 | 0.41 | 11.09 |
| 4 | 15.00–15.54 | 0.54 | 15.27 |
| 5 | 16.58–17.21 | 0.63 | 16.89 |
| 6 | 17.96–18.46 | 0.50 | 18.21 |
| 7 | 20.53–20.89 | 0.36 | 20.71 |
| 8 | 23.09–23.46 | 0.37 | 23.27 |
| 9 | 28.86–29.36 | 0.50 | 29.11 |
| 10 | 30.76–31.16 | 0.40 | 30.96 |
| 11 | 32.13–32.52 | 0.39 | 32.32 |
| 12 | 35.52–36.11 | 0.60 | 35.81 |

0–5.48 s is **normal-level speech** (RMS ≈ −20 dB, peak −3.9 dBFS), not quiet speech and not silence.
Speech begins at ≈0.1 s, so there is no leading silence to trim.

### Done
- **Project:** `factory/` (Remotion 4.0.532, zod 3.23.8, tsx). Static assets live in `public/` (Remotion's static dir), which replaces `assets/` from the plan.
- **`src/brand/tokens.ts`:** colours + roles, `semanticColor()` (saffron excluded), themes, type scale, the one ease, 9/15/24 f, `SCENE_FADE_S = 0.2`, safe area x 160–1760 / y ≤ 860, captions band 880–1040, 12-col grid.
- **`src/brand/format.ts`:** `groupIndian`, `formatValue(value, fmt, {decimals, approx, style})` with formats `count | pct | inr | inrLakh | inrCrore | inrLakhCrore | usd | usdMillion | usdBillion`, plus `inrCrore / inrLakhCrore / usdBillion` helpers. Zero in short $ style prints `$0`, so approx gives `~$0`.
- **`src/brand/fonts.ts`:** 4 bundled woff2 files (Anek Latin, Anek Devanagari latin + devanagari subsets, Inter); no network fonts.
- **`src/brand/motion.ts`:** `progress / tween / tweenColor / rand(seed)`.

### Results
| Check | Result |
|---|---|
| `scripts/test-format.ts` | **12/12 passed** (1,80,000 · 12,34,567 · ₹1,200 crore · ₹1.8 lakh crore · $22B · $22 billion · $1.2B · ~$0 · 42% · ₹1,80,000 …) |
| `tsc --noEmit` | 0 errors |
| `out/stills/frame-paper.png` | 1920×1080, 1 unique colour, #F2EFE8 |
| `out/stills/frame-ink.png` | 1920×1080, 1 unique colour, #121212 |
| `out/stills/frame-*-guides.png` | safe area + captions band overlays (debug only) |

### Open issues for later stages
- **huggingface.co still 403** (re-tested in Stage 2). Re-test at align; fallback (c) if still blocked.
- **Validator vs. script:** s040 narration "Aur twenty twenty-four mein... insolvency." is **5 words**; the rule is 6–55 → `validate` will fail. Needs your call: allow 5 for `verdict`, lower the global minimum, or change the line (I won't change narration myself).

## Stage 3: scene library

### Decisions taken (unfrozen engine; change any before Stage 6)
- **s040 / word minimum:** you approved Stage 2 without choosing, so I applied my suggestion. `verdict` scenes may have **3–55** words; every other type 6–55. Enforced in Stage 4 `validate`.
- **Phrase anchors:** in s010 the narration contains "twenty-two" twice ("Twenty **twenty-two** mein … thi **twenty-two** billion"). The anchor and tick were set to **"twenty-two billion"** so they hit the $22B, not the year. Narration and figures are unchanged.
- **`sfx.at`** = seconds from the scene's frame 0 (so swipe at 0 lines up with the wipe; logo at 0.3).
- **Stat counts down:** `from` / `value` in either direction (s020: 22 → 0). `approx` adds "~" only once the count lands → "~$0".

### Built (files)
| File | What |
|---|---|
| `src/engine/types.ts` | `SceneProps<D>`, `Word` (scene-local seconds) |
| `src/engine/manifest.ts` | Zod `Meta` (your keys: lead, tail, captions, captionScript, channelName, voice{engine,source}), `Sfx` (tick/swipe/hit/logo, gain ≤ 0.6, onWord XOR at), `Scene` = discriminated union over the 11 types, `Video` |
| `src/engine/SceneRunner.tsx` | resolves anchors (word/phrase → frame), renders SceneFrame + scene + captions |
| `src/engine/SceneFrame.tsx` | theme bg, 0.2 s fade from/to bg at both ends, saffron wipe-in from the previous scene's bg |
| `src/engine/Captions.tsx` | in-canvas Roman captions, ≤ 7 words per line, active word saffron, `fit()` to the band |
| `src/engine/ui.tsx` | `Words` (per-word reveal, Devanagari-safe), `Enter`, `Wordmark`, `Counter` (up/down, Indian format, tabular), `Bar`, `Label`, `Year` |
| `src/engine/fit.ts` | `fit()` via canvas measureText (single or multi-line) |
| `src/engine/pace.ts` | `findWordIndices` (words + phrases), `revealFrames` (anchored or spread over the voice span), `evenTimings` (fallback c) |
| `src/engine/icons.tsx` | flat icons: stack, steepArrow, fallingArrow, weight, coin, people, building, document |
| `src/scenes/*.tsx` (11) | each exports `schema`, `anchorNames`, `Component` |
| `films/byjus-demo/video.json` | your manifest, adapted to the schemas (see decisions above) |

### Scene types: anchors
title (–) · stat (`counter`) · bars (`items[]`) · timeline (`events[]`) · moneyMap (`flows[]`) · versus (`left`, `right`) · xray (`segments[]`) · reasons (`items[]`) · founder (–) · verdict (`word`) · outro (–)

### Results
| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `scripts/stills-demo.ts` | **12 stills / 11 types** rendered (stat twice: count up s010, count down s020). Sheet: `docs/stage3-contact.png` |
| Wipe-in pixels (s040, prev = paper) | f0 #F2EFE8 · f7 #FF7A00 · f15 #FF7A00 (fully covered) · f22 #121212 · last frames #121212 (fade to ink bg) |
| Accent count per demo frame | ≤ 3 in every still (bars: green + crimson + saffron caption) |
| Demo content | Byju's types use your video.json; the other 7 types use labelled placeholders ("DEMO", "Company A"), not data |

### Fixed during review
- **moneyMap:** flow labels overlapped arrows/nodes → moved above the arrow (re-rendered, verified).

### Known issues (for Stage 4)
- **xray:** a segment under ~8% of the total squeezes its label (demo: 5% "profit"). Plan: validator rejects segments < 8%.
- **Remotion log noise:** each renderer call prints a "differing memory amounts" warning (cgroup reports ~8.8 PB). Harmless; filtered from step output.

## Stage 3 approval: changes applied
| Change | Status |
|---|---|
| verdict word count 3–12 (others 6–55) | recorded → enforced in `validate` |
| Anchor rule: a word that occurs > 1× in the narration must be a phrase or use `word#n` | `pace.ts` supports `word#n` (1-based) + `occurrences()`; rule enforced in `validate` |
| `sfx.at` = seconds from scene start · approx "~" on landing | kept |
| s020 `data.label` → "Investors' stake value, written down (reported)" | **done** in video.json |
| xray small segments | **engine fixed**: share < 8% → label outside the bar with a 2 px ink leader; consecutive small segments alternate above/below; the total moved to top-right so nothing collides. Validator will WARN only. Verified still: segments 6% + 4% adjacent, no overlap |

## Devanagari shaping check (before Stage 4)
`scripts/stills-devanagari.ts` → `docs/devanagari-check.png`: title "क्षेत्र प्रतिष्ठा स्टार्टअप" mid per-word
reveal (frame 29) and settled (frame 75), plus reasons cards mid-entrance (frame 80) and settled (frame 130), with 1:1 crops.
Conjuncts क्ष, त्र, प्र, ष्ठ, स्ट, reph र्ट and matras ि ा े all render shaped; each word fades as one unit.
(First attempt picked frame 150 of 152, which is inside the scene fade-out; re-rendered at 130.)

## Stage 4: progress
- **huggingface.co:** still refused at the proxy (CONNECT 403, curl code 000). Re-tested after you allowed it; the exact domain from Whisper's error will be reported at align.
- **split.ts:** written. Dry run only (no files):

| boundary | expected (syllable share) | chosen pause | **CUT (midpoint)** | next-nearest |
|---|---|---|---|---|
| s010→s020 | 8.38 | 7.70–8.14 (0.45 s) | **7.92** | 11.09 (Δ 2.71 s) |
| s020→s030 | 16.46 | 16.58–17.21 (0.63 s) | **16.89** | 15.27 (Δ 1.19 s) |
| s030→s040 | 28.73 | 28.86–29.36 (0.50 s) | **29.11** | 30.96 (Δ 2.23 s) |
| s040→s050 | 32.02 | 32.13–32.52 (0.39 s) | **32.32** | 30.96 (Δ 1.07 s) |

| scene | words | voice start–end (s) | **voice duration** | planned frames (lead 0.5 + voice + tail 0.55) |
|---|---|---|---|---|
| s010 | 15 | 0.00–7.73 | **7.726 s** | 264 |
| s020 | 17 | 8.11–16.61 | **8.495 s** | 287 |
| s030 | 28 | 17.18–28.89 | **11.710 s** | 383 |
| s040 | 5 | 29.33–32.16 | **2.833 s** | 117 |
| s050 | 12 | 32.49–38.61 | **6.122 s** | 216 |
| total | 77 | | 36.886 s | 1267 frames = 42.23 s |

Keyword cross-check (pocketsphinx English model, rough): "reports" 8.1 s (1st word of s020 ✓) · "investors" 11.3 (s020 ✓) ·
"acquisitions" 19.7 (s030 ✓) · "one point two billion dollar" 24.3–26.0 (s030 ✓) · "twenty twenty" 29.5–29.9 (s040 ✓) · "frame … frame" 37.1–37.9 (s050 ✓).

### ⚠ Rule conflict found (needs your decision)
**Key numbers hold ≥ 60 frames.** s020's counter lands on "zero", which is near the END of its sentence
("…lagbhag **zero** likh di."). Estimated "zero" ≈ 16.0 s → lands ≈ 8.4 s into the scene; the scene ends at 9.55 s →
**hold ≈ 34 frames (< 60)**. (Timing estimate until real alignment; error ±0.15 s.)
Options: (a) per-scene `tail` override (s020 tail ≈ 1.5 s → hold ≈ 63 f); (b) land the count on an earlier word
(e.g. "value"), (c) accept. The same thing affects the verdict (s040 "insolvency" is the last word → ~36 f still),
though that's a word, not a number.

## Stage 4: results (draft)

### 🚫 BLOCKER for Stage 5 (final)
The final render must use **real word timings**: multilingual Whisper (faster-whisper `small`), or ElevenLabs alignment.
The draft used fallback (c) (syllable estimate) because **`huggingface.co:443`** is refused by the proxy
(`ProxyError: 403 Forbidden`; proxy log `connect_rejected … host huggingface.co:443`, last at 19:25:12Z).
Note: model weights may also be served from Hugging Face CDN hosts (`*.hf.co`, e.g. `cdn-lfs.hf.co`,
`cas-bridge.xethub.hf.co`). Allow those too if the model download starts but stalls.
Visible effect in the draft: s010's count lands ~0.3 s before "twenty-two billion" is spoken; card 2 in s030 is late versus "growth".

### Loudness check before writing audio (EBU R128 integrated, per scene)
| s010 | s020 | s030 | s040 | s050 | median |
|---|---|---|---|---|---|
| −23.1 | −24.0 | −23.6 | −23.8 | −22.9 | −23.6 |
s010 is +0.5 dB from the median (< 3 dB) → **no per-scene normalisation, no re-record**. Spread 1.1 dB. 0–5.48 s alone = −23.4 LUFS.

### Step output lines
```
validate byjus-demo: OK · 5 scenes · 77 words · est. 0.51 min (31 s @ 2.5 w/s) · 0 warnings · 0 errors
split    → wrote audio/s010…s050.wav (48 kHz mono 24-bit): 7.726 / 8.495 / 11.710 / 2.833 / 6.122 s
tts byjus-demo: skipped (voice.engine = manual; provided audio is used)
align byjus-demo: 5 scenes · method fallback-syllable×5 · reason: ProxyError: 403 Forbidden | blocked host: huggingface.co:443
EXTEND s020 (stat): landing f231, hold 56 f < 60 → tail 0.550 s → 0.705 s (frames 287 → 291)
EXTEND s040 (verdict): landing f78, hold 39 f < 60 → tail 0.550 s → 1.267 s (frames 117 → 138)
plan byjus-demo: 5 scenes · 1292 frames · 43.067 s · 2 tail extension(s) → build/timeline.json
render byjus-demo --draft: 5 scenes · 5 rendered (first run, 22.8 s) / 0 rendered · 5 cached (re-run, 1.6 s)
mix byjus-demo --draft: PASS · planned 43.067 s · video 43.067 s (Δ 0.000) · audio 43.066 s (Δ 0.001) · -14.5 LUFS · TP -4.3 dBFS
chapters byjus-demo: OK · 3 chapters (0:00 The peak · 0:18 Three mistakes · 0:31 The fall)
srt byjus-demo: 21 cues → build/captions.srt
```
Tests: `test-format` 12/12 · `test-validate` 10/10 (digits, verdict 13 words, ambiguous anchor, `#2` OK, anchor missing,
3-in-a-row, duplicate id, unknown type, bars ratio 50, sfx gain 0.9).
Per-scene renders: exact planned frame counts (264/291/383/138/216), no audio stream, 960×540 draft.
Voice stem: 2,067,200 samples = 1292 frames × 1600 exactly.

### Auto-extended tails (hold rule, on ESTIMATED timings; recomputed with real timings in Stage 5)
| scene | landing | hold before | tail | frames |
|---|---|---|---|---|
| s020 (stat → ~$0 on "zero") | f231 | 56 f | 0.550 → **0.705 s** | 287 → 291 |
| s040 (verdict INSOLVENCY, visible at word + 9 f) | f78 | 39 f | 0.550 → **1.267 s** | 117 → 138 |

### Fixed during draft review (frames extracted and inspected)
1. **s020 empty for ~4 s** (only captions) → label + starting "$22B" now appear at voice start; the count still lands on "zero".
2. **s030 empty for ~3 s** ("Paisa gaya kahaan? Teen galtiyan.") → numbered card outlines (muted) appear at voice start and fill in on each word. Structure only, no added data.
3. **s010 showed "$0" next to BYJU'S before counting** (a false visual claim, introduced by fix 1) → a count starting from 0 stays hidden until it starts; a non-zero start (s020's $22B) still shows immediately.
Cache proof: after fixes 1–2 only stat×2 + reasons re-rendered (s040/s050 cached); after fix 3 only stat×2.

### Known issues (open)
- **Loudness:** final integrated −14.5 LUFS vs −14 target (loudnorm linear mode, then AAC). TP −4.3 dBFS has headroom; will tighten in Stage 5 (target ±0.3 LU).
- **Pixel format:** per-scene MP4s report `yuvj420p` (full range) although `yuv420p` is requested. Will set an explicit BT.709 TV-range colour space for the final and verify with ffprobe.
- **Music:** placeholder bed at −24 dB, ducked by sidechaincompress (voice key).
