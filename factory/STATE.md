# STATE: Hindi business-story video factory

| Stage | Status |
|---|---|
| 1 Plan (file tree + scene schemas) | ✅ written, ⏸ **awaiting approval** |
| 2 Tokens + format.ts + Paper/Ink stills | not started |
| 3 Scene library + contact sheet | not started |
| 4 Pipeline scripts + Byju's draft | not started (needs your video.json) |
| 5 Final render + report.json + QA | not started |
| 6 NOTES.md, FROZEN headers, tag | not started |

---

## Stage 1: plan

### Facts measured in this environment (numbers, not impressions)

| Item | Value |
|---|---|
| Supplied voice file | `ElevenLabs_2026-10-04T18_58_01_…mp3`: **38.61 s**, mono, 44.1 kHz, one file for the whole film |
| Pauses ≥ 0.35 s (−35 dB) | 7.70–8.14, 10.89–11.29, 15.00–15.54, 16.58–17.21, 17.96–18.46, 20.53–20.89, 23.09–23.46, 28.86–29.36, 30.76–31.16, 32.13–32.52, 35.52–36.11 |
| Start of file | below −35 dB until **5.48 s** (quiet intro or real leading silence; checked in Stage 4 before any cut) |
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
