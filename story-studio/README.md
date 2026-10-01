# Story Studio: Remotion brand system for the Hindi business-story channel

Every episode is assembled from this library. **No new styling per episode:** if a scene
needs something the library doesn't have, add a component here, built on the tokens.

```
src/
  brand/
    tokens.ts      colours (semantic roles), type, motion, grid: the only source of style values
    fonts.ts       Anek Latin + Anek Devanagari + Inter (vendored in public/fonts, else Google Fonts)
    motion.ts      progress() / tween() / tweenColor(): the shared ease + token durations
    theme.tsx      ThemeProvider + useTheme(): { bg, fg } for the current paper/ink mode
    timing.ts      word-timestamp parser + resolveCues(): "show X on the word Y"
  components/      one component per file (below)
  episodes/byjus/  ByjusDemo.tsx (composition) + cues.ts (its cue map)
  Root.tsx         registers compositions; calculateMetadata reads public/ (VO length, timestamps, audio)
public/
  vo.mp3  music.mp3  sfx/{tick,swipe,hit,logo}.mp3  fonts/*.woff2  [vo-timestamps.json]
```

## Commands

```sh
npm ci
npm run studio                       # live preview
npm run render                       # → out/ByjusDemo.mp4 (1920×1080, 30 fps, mastered to −14 LUFS)
python3 scripts/make_placeholder_audio.py   # regenerate placeholder music/SFX
```

If Remotion can't download its own browser (offline/proxied machines), point it at any Chrome
headless shell: `REMOTION_BROWSER=/path/to/headless_shell npm run render`.

## Brand rules (enforced by tokens)

| Token | Value | Rule |
|---|---|---|
| `colors.paper` | #F2EFE8 | default background |
| `colors.ink` | #121212 | all text and lines; dark-mode background |
| `colors.saffron` | #FF7A00 | **brand only**: titles, wipes, highlights. Never data. |
| `colors.green` | #1F9D55 | growth / rising numbers only |
| `colors.crimson` | #D7263D | loss / falling numbers only |
| `colors.cobalt` | #2B4CFF | second entity in comparisons only |
| `colors.stone` | #B8B2A7 | muted / inactive data |
| `ease` | bezier(0.16, 1, 0.3, 1) | every entrance; no linear, bounce or overshoot |
| `durations` | fast 9 · standard 15 · slow 24 frames | the only durations allowed |
| `direction` | past ← left, future → right | up = growth, down = decline |
| `KEY_NUMBER_MIN_HOLD` | 60 frames | key numbers stay on screen at least this long |
| `grid` | 12 columns, 120 px margins, 24 px gutters | place with `colX(i)` and `span(n)` |

Max 3 accent colours in a frame. Flat colour only: no glow, gradients, effect shadows, blur, particles, 3D, shake or bounce.

## Components

All take props only. Colours default to the theme foreground (`useTheme().fg`), so the same
component works on paper and on ink. Each component's entrance plays from local frame 0 of the
`<Sequence>` it's placed in. State changes (grow, collapse, dim) come in through props, animated
by the parent with `tween()` / `tweenColor()`.

### `<ThemeFlip mode children />`
| Prop | Type | |
|---|---|---|
| `mode` | `"paper" \| "ink"` | paper = paper bg + ink text; ink = ink bg + paper text |
| `children` | ReactNode | everything rendered in this theme |

Switch modes underneath a `<SaffronWipe />` (at `WIPE_COVERED`) so the flip is never seen.

### `<NumberCounter from to prefix suffix color value startFrame duration decimals size />`
| Prop | Type | Default | |
|---|---|---|---|
| `from`, `to` | number | — | count range |
| `prefix`, `suffix` | string | "" | e.g. `"$"`, `"B"` |
| `color` | string | theme fg | data role: green rise, crimson fall |
| `value` | string | — | final label once landed (e.g. `"~$0"`) |
| `startFrame` | number | 0 | local frame the count starts |
| `duration` | `"fast" \| "standard" \| "slow"` | `"slow"` | |
| `decimals` | number | 0 | |
| `size` | number | `type.number` (210) | px |

Inter, tabular figures, so digits never wobble.

### `<TimelineRuler years activeYear width />`
| Prop | Type | Default | |
|---|---|---|---|
| `years` | number[] | — | ticks, past → future |
| `activeYear` | number | — | saffron tick + bold label |
| `width` | number | `span(12)` | px |

### `<BigBar value maxValue color width maxHeight />`
| Prop | Type | Default | |
|---|---|---|---|
| `value` | number | — | current value (tween it to grow/collapse) |
| `maxValue` | number | — | value that fills `maxHeight` |
| `color` | string | theme fg | data role colour |
| `width` | number | 220 | px |
| `maxHeight` | number | 560 | px |

Stands on a baseline: grows up, collapses down.

### `<ReasonCard index title icon iconText iconEntrance dim width />`
| Prop | Type | Default | |
|---|---|---|---|
| `index` | number | — | big number top-left |
| `title` | string | — | the reason |
| `icon` | `IconName` | — | see GeoIcon |
| `iconText` | string | — | text on the icon (e.g. `"$1.2B"` on `weight`) |
| `iconEntrance` | `"fade" \| "drop"` | `"fade"` | `drop` = the icon falls in (burden/decline) |
| `dim` | 0–1 | 0 | 1 = stone (inactive); tween when the next reason is spoken |
| `width` | number | `span(4)` | px |

Enters from the left (reasons are the past).

### `<GeoIcon name color size text textColor />`
Flat icons from rects, circles and arrows: `"blocks" | "steepArrow" | "fallingArrow" | "weight" | "coin" | "people"`.

### `<SaffronWipe />`
No props. The signature act transition: solid saffron covers left→right over `standard`, then
exits right over `standard`. Place it in `<Sequence durationInFrames={WIPE_FRAMES}>`; the frame is
fully covered at local frame `WIPE_COVERED`, which is where you swap acts/themes.

### `<VerdictWord text color size />`
One huge centred word. Fast fade + 8 px rise only. `color` defaults to theme fg, `size` to 220.

### `<EndCard line channelName />`
The closing line (theme fg), a short saffron rule, then the channel name in saffron.

### `<Wordmark text tense size color />`
A company name set as type (never a logo). `tense="past"` enters from the left, `"future"` from the right.

### `<Label text color size />`
Small supporting text; pass `colors.stone` once the fact is no longer current.

### `<SafeAudio src available from durationInFrames volume />`
An audio slot that renders nothing if `public/<src>` is missing, so renders never break.
`available` comes from `calculateMetadata` (`getStaticFiles()`).

## Syncing visuals to the voice

`brand/timing.ts`: each episode declares a cue map (see `episodes/byjus/cues.ts`):

```ts
card1: { match: /acquisition/, fallback: 466 },             // appears on "acquisitions"
counterUp: { match: /billion/, fallback: 80, offset: -24 },  // 24-frame count LANDS on "billion"
```

- **With `public/vo-timestamps.json`:** every cue snaps to the frame the word is spoken, matched in narration order. Accepted formats: a word array `[{word,start,end}]`, `{words:[{text,start,end}]}` (ElevenLabs Scribe / Whisper), or ElevenLabs TTS `with-timestamps` character `alignment`.
- **Without it:** the `fallback` frames are used.
- **Duration:** taken from `vo.mp3` (minimum 900 frames).

## New episode checklist

1. `src/episodes/<slug>/cues.ts`: cue map for the script (regex + fallback frame).
2. `src/episodes/<slug>/<Name>.tsx`: compose **only** from `components/`, place with `colX()` and `span()`, and animate state with `tween()`.
3. Register it in `Root.tsx` (copy the `ByjusDemo` block and its `calculateMetadata`).
4. Put `vo.mp3` (and ideally `vo-timestamps.json`) in `public/`.
5. Render, then check stills at phone size (≈390 px wide): numbers and labels must stay readable.
