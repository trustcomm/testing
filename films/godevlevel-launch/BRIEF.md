# GoDevLevel Launch Film — Director's Package v1

**Film:** 30 seconds, energetic, one continuous take. 16:9 master + 9:16 Reel cut.
**Offer it sells:** launch films for businesses that launch often, made in code.
**Who it's for:** mobile and electronics shops (a new phone launch or offer every month), real estate developers and channel partners (project launches), and D2C brands.

---

## 0. How to use this file

**You (before handing to Claude Code):**
1. Record the voiceover lines in Section 5 as separate files (V1–V11).
2. **All visual assets and music come from Canva Pro only** (Section 6). Claude Code generates the stills itself through the Canva connector; you build one Canva video design holding the stock clips and the music track (Section 6.3), about 10 minutes of drag-and-drop.
3. Connect Canva to Claude Code first (Section 6.0).
4. Put the voiceover, logo and references in the folders listed in Section 8.
5. Add 2–3 **real** reference films you admire to `refs/` (see Section 2). These are for private study and measurement only, never used in the film.
6. Give Claude Code this whole file plus the folders.

**Claude Code:** start at Section 9.

---

## 1. Real source material (no guessing)

| Item | Where it comes from | Rule |
|---|---|---|
| Brand colours | Extract exact hex values from the GoDevLevel logo file (`brand/logo.*`). Known: dark charcoal + orange. | Never invent a colour. If the logo is missing, stop and ask. |
| Brand kit, logo, fonts | `brand/` folder, or the Canva Brand Kit if a Canva connector is available | Use what exists; ask before substituting. |
| Website | godevlevel.com / godevlevel.in | Read the live site for real copy and tone. |
| Claims | Only what is true about the service | No statistics. No "days not weeks" or any speed promise unless confirmed. |
| Prices shown on screen | Sample UI only (Beat 7) | Must read as an example; replace with a real client example if one exists. |

---

## 2. References vs assets (two different things)

- **References** = real films you admire, used only to measure rhythm, stillness, cuts and easing. Put 2–3 in `refs/`. Good sources: product launch films and motion-design reels you genuinely like. Never use their footage, logos, characters or music in our film.
- **Assets** = footage and images that appear *in* our film. Generated (Section 6), from Canva Pro stock, or shot by you.

AI-generated clips are assets, not references. Rhythm targets come from real films.

---

## 3. Director's treatment

### The three concepts considered

| Concept | The one idea | Verdict |
|---|---|---|
| **A. One caret builds everything** | GoDevLevel's orange text caret is the only object that never leaves. It types, stretches, folds and becomes every frame, then lands as the bar under the wordmark. | **Chosen.** It *is* the product: a film written in code. |
| B. One price tag travels | A price tag flies through a shop, a tower, a brand, changing each time. | Strong for retail, but too narrow for real estate. |
| C. Slideshow vs carried | Left half plays a generic slideshow ad, right half plays the carried version, then the right swallows the left. | Clever, but needs explaining. Save for a sequel. |

### Look

- **Ground:** charcoal (from logo). **Single accent:** orange (from logo). **Ink:** off-white.
- **Type:** one bold grotesque display face (Claude Code proposes 2 OFL options; you pick). Huge, tight, few words.
- **Real-world footage only ever appears inside a shape the caret has built** (a phone screen, a tower outline, a card). The caret carries the film; footage fills it.
- **Energy:** 128 BPM. Every cut and hit lands on the beat grid. Fast moves get motion blur. Two designed stillnesses so the energy has something to land against.

### Rhythm targets (adjust after measuring `refs/`)

- Beat = 0.469 s, bar = 1.875 s, 16 bars = 30.0 s.
- Shortest beat 0.47 s, longest 3.75 s (8× spread; target at least 4×).
- About 20% of the film nearly still (two stillness pockets: Beat 4 and Beat 10).
- No uniform cadence: never three beats in a row of the same length.

---

## 4. Beat sheet (the film, second by second)

Every boundary names what **carries** into the next beat. A boundary with no carry is a bug.

| # | Time (s) | Bars | Voice | Picture & motion | Carries out as | Source |
|---|---|---|---|---|---|---|
| 1 | 0.00–1.88 | 1 | V1 "New phone in store." | Charcoal. Orange caret blinks twice on the beat, then shoots up and draws a phone outline in one stroke. Inside the phone: H1 (phone reveal in a shop). | Phone outline | Code + H1 |
| 2 | 1.88–2.81 | ½ | V2 "New tower on sale." | Whip (blur). The phone outline stretches tall into a residential tower outline. Inside: H2 (tower aerial). | Tower outline | Code + H2 |
| 3 | 2.81–3.75 | ½ | V3 "New offer every week." | Tower snaps down into a tag shape. "OFFER" stamps three times on three beats, each bigger. | Tag's bottom edge | Code |
| 4 | 3.75–7.50 | 2 | V4 "Your launches move fast. Your videos should too." | **Stillness pocket.** Tag edge becomes a long underline. Huge type, two lines, rises in. Camera nearly still, tiny drift. | Underline | Code |
| 5 | 7.50–9.38 | 1 | V5 "GoDevLevel builds launch films — in code." | Underline lifts and becomes the caret again; it types a line of code: `film.launch({ brand: "yours" })`. | Code editor window | Code |
| 6 | 9.38–13.13 | 2 | V6 "Your colours. Your words. Your product. Exactly." | Three hits on three beats: (1) brand swatches pop in the editor and the whole frame recolours; (2) a headline word swaps; (3) product image I1 drops into a frame. | The product frame | Code + I1 |
| 7 | 13.13–15.00 | 1 | V7 "Change the price? One line. Re-render." | Close-up of one line of code: the sample price scrambles to a new one. The product frame updates instantly in sync. | Product frame | Code |
| 8 | 15.00–18.75 | 2 | V8 "Wide for YouTube. Tall for Reels. Same film." | The frame splits: one copy stays 16:9, one morphs to 9:16 and re-composes its layout. Labels stamp on "YouTube" and "Reels". | The 9:16 frame | Code |
| 9 | 18.75–22.50 | 2 | V9 "Mobile shops. Real estate. Brands. Anyone launching." | **Energy peak.** The 9:16 frame flips through four quick examples, one per beat pair: H3 shop shutter, H2 tower, H4 product unboxing, H5 launch-day crowd. Motion blur on every flip. | Frame shrinks to an orange dot | Code + H2–H5 |
| 10 | 22.50–26.25 | 2 | V10 "GoDevLevel." | **Stillness pocket.** Dot holds dead still for 0.9 s. Then it springs out and writes the wordmark; the caret settles as the bar under "Level". | Wordmark | Code + logo |
| 11 | 26.25–30.00 | 2 | V11 "Build your launch." | Tagline + URL type on. Final hit on the downbeat at 28.13. Hold. Fade to charcoal. | — (end) | Code |

---

## 5. Voiceover

### Voice direction (paste into ElevenLabs)

```
Male, late 20s to early 30s, Indian English, energetic and confident,
a smile in the voice. Punchy, fast, rhythmic: around 165–175 words per
minute. Crisp consonants. Hit the first word of each line hard. Short
lines land like beats, not sentences. Not a radio voice, not a hype
shout — a sharp founder pitching something he's proud of. Each line is
a separate take; keep energy and pitch identical across all takes.
```

**Settings:** use ElevenLabs' current multilingual model. Starting points:
- Stability ~35% (lower = more energy and variation).
- Similarity ~75%.
- Style ~30% (higher than our documentary voice, for punch).
- Speaker boost on.

Generate each line 3 times and pick the punchiest take. Keep one voice and the same settings for all lines.

### Lines — English master (save as named)

| File | Line |
|---|---|
| V1.wav | New phone in store. |
| V2.wav | New tower on sale. |
| V3.wav | New offer every week. |
| V4.wav | Your launches move fast. Your videos should too. |
| V5.wav | GoDevLevel builds launch films — in code. |
| V6.wav | Your colours. Your words. Your product. Exactly. |
| V7.wav | Change the price? One line. Re-render. |
| V8.wav | Wide for YouTube. Tall for Reels. Same film. |
| V9.wav | Mobile shops. Real estate. Brands. Anyone launching. |
| V10.wav | GoDevLevel. |
| V11.wav | Build your launch. |

### Lines — Hinglish version (for godevlevel.in and local clients)

Feed ElevenLabs the Devanagari line; keep English words in English. Same file names with `_hi` suffix.

| File | Devanagari (for the voice) | Roman (for captions) |
|---|---|---|
| V1_hi | नया phone store में। | Naya phone store mein. |
| V2_hi | नया tower launch पे। | Naya tower launch pe. |
| V3_hi | हर हफ़्ते नया offer। | Har hafte naya offer. |
| V4_hi | आपके launches fast हैं। आपके videos भी होने चाहिए। | Aapke launches fast hain. Aapke videos bhi hone chahiye. |
| V5_hi | GoDevLevel बनाता है launch films — code से। | GoDevLevel banata hai launch films — code se. |
| V6_hi | आपके colours। आपके words। आपका product — बिल्कुल exact। | Aapke colours. Aapke words. Aapka product — bilkul exact. |
| V7_hi | Price बदला? एक line। Re-render। | Price badla? Ek line. Re-render. |
| V8_hi | YouTube के लिए wide। Reels के लिए tall। एक ही film। | YouTube ke liye wide. Reels ke liye tall. Ek hi film. |
| V9_hi | Mobile shops। Real estate। Brands। जो भी launch करे। | Mobile shops. Real estate. Brands. Jo bhi launch kare. |
| V10_hi | GoDevLevel। | GoDevLevel. |
| V11_hi | Build your launch। | Build your launch. |

The Hinglish lines run longer; Claude Code re-times the beat sheet to the voice (audio-first), keeping cuts on the beat grid.

---

## 6. Assets — Canva Pro only

Every image, video clip and music track in this film comes from Canva Pro. Nothing from other generators or stock sites.

**What the Canva connector can and can't do** (so nobody wastes time):

| Claude Code can do itself, through the connector | You do by hand in the Canva app |
|---|---|
| Read the GoDevLevel Brand Kit (colours, fonts, logo) | Search Canva's **stock video** library and place clips |
| Generate AI images with Canva's image generator | Pick a **music** track from Canva's audio library |
| Find your designs and export them (PNG, MP4) | Approve which generated images to keep |
| Fetch images and videos already uploaded to your Canva account | |

The connector cannot search stock video or audio, and Canva's AI design generator does not make videos. That's why Section 6.3 has a short manual step.

**Rules for every asset:**
- No visible brand logos, readable shop signage or real product marks. No Apple, Samsung or any real brand.
- No famous or identifiable real people. Stock models only.
- Energetic: fast motion, bright light. Skip slow, drifting clips.
- Indian settings where possible; it's a GoDevLevel film for Indian businesses.
- Check Canva's content licence for using exported media in a film edited outside Canva and for client/commercial work. Keep a note of each asset's name in `canva/ASSETS.md`.

### 6.0 Connect Canva to Claude Code (one time)

Your Canva connector works in claude.ai; Claude Code needs its own connection. Canva's remote MCP server is `https://mcp.canva.com/mcp`. In a terminal:

```
claude mcp add --transport http canva https://mcp.canva.com/mcp
```

Then start Claude Code, run `/mcp`, and sign in to Canva. If the command differs in your Claude Code version, follow Canva's and Claude Code's current MCP setup docs.

### 6.1 Brand Kit (Claude Code does this)

- List your Canva Brand Kits and use the GoDevLevel one: exact colour hex values, fonts and logo.
- If there is no GoDevLevel Brand Kit, extract colours from `brand/logo.*` instead and tell you.
- Show the values to you before using them.

### 6.2 Stills (Claude Code generates these with Canva's image generator)

Generate each at the given aspect ratio, show you the options, and export the ones you approve as PNG into `canva/stills/`. These stills are also the **fallback** for any footage clip that isn't good enough: the still gets animated in code (fast push and parallax) inside its caret shape.

| ID | Aspect | Prompt |
|---|---|---|
| I1 | 16:9 | Studio product photograph: one sleek unbranded smartphone standing at a slight angle on a seamless dark charcoal background, a single hard orange rim light tracing its right edge, soft floor reflection, large negative space on the left. No logos, no text, no screen UI. Ultra sharp, premium commercial still. |
| S1 | 9:16 | Bright modern Indian mobile phone store at evening, glowing glass display shelves of unbranded phones, shallow depth of field, warm practical light, energetic commercial look. No logos, no readable signs, no people's faces in focus. |
| S2 | 9:16 | New high-rise residential tower in an Indian city at golden hour, shot from below looking up, warm sun flaring across the glass, balconies with plants, clean sky. No signage or text. Dramatic, energetic real-estate commercial look. |
| S3 | 9:16 | Busy Indian market street at early morning, an electronics shop with its metal shutter half raised and bright light spilling out, light dust in the sunbeams, low camera angle. No readable signage or logos. |
| S4 | 9:16 | Top-down view of hands lifting a sleek unbranded wireless-earbuds case out of a minimal kraft box on a dark charcoal tabletop, one warm orange rim light, crisp shadows. No logos or text. |
| S5 | 9:16 | Inside a bright showroom on launch day, a small crowd of happy young customers cheering at a glowing display wall, warm orange and white lights, light confetti in the air, shallow depth of field. Fictional people, no logos, no readable text. |

### 6.3 Stock footage + music (you, in the Canva app, ~10 minutes)

**Design 1 — footage.** Create a new **Mobile Video (1080 × 1920)** design named exactly **`GDL Launch — Footage`**. One stock clip per page, each trimmed to about 4–5 seconds, in this order:

| Page | Clip ID | What to find | Canva search terms |
|---|---|---|---|
| 1 | H1 | Hands sliding a new phone out of a box or turning it to camera, in a shop | "smartphone unboxing", "phone store hands" |
| 2 | H2 | Fast aerial rising past a new residential tower | "apartment building aerial", "skyscraper drone golden hour" |
| 3 | H3 | A shop shutter being pulled up, or a shop opening in the morning | "shop shutter opening", "store opening morning" |
| 4 | H4 | Quick top-down unboxing of a product | "unboxing top view", "product box hands" |
| 5 | H5 | Customers celebrating, confetti, launch-day energy in a store | "store celebration", "confetti crowd shop" |

If a page needs a 16:9 version (H2 is used in both shapes), add it as page 6 in a **YouTube Video (1920 × 1080)** design named **`GDL Launch — Footage Wide`**.

**Design 2 — music.** Create a **Video** design named **`GDL Launch — Music`** with one blank page about 32 seconds long, and add one track from Canva's audio library:
- Search terms: "energetic electronic", "upbeat tech", "corporate upbeat", "hype".
- Pick: fast and punchy (roughly 120–130 BPM), clear beat, **no vocals**, builds quickly.
- Don't worry about matching 128 BPM exactly. Claude Code measures the real tempo and re-grids the whole timeline to it.

**Then Claude Code:** finds both designs by name, exports each footage page as MP4 into `canva/footage/` (H1.mp4 … H5.mp4), exports the music design and extracts its audio to `canva/music/track.wav`. If an export isn't possible through the connector, it asks you to download that file into the same folder.

---

## 7. Music and sound

- **Music:** the Canva track from 6.3. Claude Code measures its tempo and downbeats, then places every cut and hit on that real grid (the 128 BPM in Section 3 is only the starting assumption).
- **SFX:** Claude Code synthesises them in code (no download): caret tick (blinks), whoosh (whips), stamp hit (OFFER, labels), scramble ticks (price), spring pop (dot), downbeat hit (end). You may also add Canva audio-library effects ("whoosh", "click", "impact") to the music design as extra pages if you prefer real recordings.
- **Mix:** voice on top, music ducked under voice, loudness around −14 LUFS, true peak below −1 dBTP.

---

## 8. Folder layout

```
films/godevlevel-launch/
  BRIEF.md      this file
  brand/        logo file (only needed if there's no Canva Brand Kit)
  vo/           V1.wav … V11.wav   (and V1_hi.wav … for Hinglish)
  refs/         2–3 real reference films (private study only)
  canva/        filled by Claude Code from Canva:
    stills/     I1.png S1.png … S5.png
    footage/    H1.mp4 … H5.mp4 (+ H2_wide.mp4)
    music/      track.wav
    ASSETS.md   every asset's Canva name and how it was made
```

---

## 9. Build prompt for Claude Code

```
You are the motion director and engineer for a 30-second GoDevLevel
launch film. Read BRIEF.md fully first. It is the brief: do not invent
anything it doesn't give you. Work in stages and STOP at each ⏸.

ASSETS: CANVA PRO ONLY
- Every image, clip and music track comes from my Canva account via the
  Canva connector. Do not use any other generator, stock site or
  library. If the Canva connector is not connected, stop and tell me.
- Brand: list my Canva Brand Kits, use the GoDevLevel kit (colours,
  fonts, logo). If none exists, extract colours from brand/logo.* and
  tell me. Show me the values before using them.
- Stills: generate I1 and S1–S5 with Canva's image generator using the
  prompts and aspect ratios in BRIEF section 6.2. Show me the options;
  export only the ones I approve as PNG into canva/stills/.
- Footage + music: find my designs "GDL Launch — Footage" (and
  "Footage Wide" if present) and "GDL Launch — Music". Export each
  footage page as MP4 into canva/footage/ (H1.mp4 … H5.mp4); export the
  music design and extract its audio to canva/music/track.wav. If an
  export isn't possible, tell me exactly which file to download.
- Log every asset in canva/ASSETS.md (Canva name, design, page).
- Fallback: if a clip is weak or missing, animate its matching still
  (fast push + parallax) inside the caret shape instead. Never fake
  photos or footage in code.

STAGE 1 — MEASURE ⏸
- Analyse each film in refs/ with ffmpeg (scene detection + frame
  differences): cuts per minute, % near-still, beat-length min/max and
  ratio, contact sheet. Report the numbers next to the targets in BRIEF
  section 3 and propose adjustments.
- Measure each VO file's length and the Canva track's real tempo and
  downbeats.

STAGE 2 — TIMELINE ⏸
- Build the timeline audio-first: VO lines placed on the real beat
  grid, cuts and hits on beats. Show the final beat sheet with real
  times. Check: beat lengths vary ≥4×, ~20% stillness, no three equal
  beats in a row, every boundary has a named carry object.

STAGE 3 — EXEMPLARS ⏸
- Build Beat 1 (caret → phone with H1 inside) and Beat 8 (16:9/9:16
  split) to final quality. Render stills at entrance, hold and exit.

STAGE 4 — FULL FILM ⏸
- Continuity rules (implement fresh, clean-room — do not use code
  from any other motion library):
  * Every boundary declares a handoff (shape, position, size, colour);
    the next beat starts from exactly that state. Verify by comparing
    the boundary frames in the handoff region.
  * One camera defined over film time; it never jumps at a boundary.
  * Real-world footage and stills only inside shapes the caret has
    built.
  * Motion blur (several sub-frame samples averaged) on fast moves.
- Brand: Canva Brand Kit colours — charcoal ground, orange single
  accent, off-white ink — unless the kit says otherwise. No glow or
  bloom unless I approve it. Animate per word; Devanagari (Hinglish
  captions) must stay correctly shaped.
- Captions: burned in for the 9:16 cut; .srt for the 16:9.

STAGE 5 — CHECK ⏸
- Carry score for every boundary; rhythm numbers; blur on fast moves;
  subject stays in frame; loudness −14 LUFS, peak below −1 dBTP;
  determinism (same frame rendered twice is identical).
- Contact sheet of one frame per second.
- Deliver: 16:9 1080p master, 9:16 1080×1920 re-composed cut,
  .srt, and a short report of every number above. Report honestly,
  including anything that failed.
```

---

## 10. Before publishing

- Re-check Canva's content licence for each asset used, especially for client or paid work, and keep `canva/ASSETS.md` with the project.
- Stock footage and AI stills show realistic people and places. If YouTube asks about altered or synthetic content, answer accurately for the AI-generated stills.
- Watch the 9:16 cut once on a phone at full brightness, sound on.
