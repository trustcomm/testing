# Trustcomm India Launch Film — Director's Package v1

**Client:** Trustcomm (trustcomm.app) · **Budget:** $10,000 · **Launch:** all of India
**Look:** bright, optimistic, product-first, constant motion (a "big tech launch film" feel, without borrowing any other company's brand)
**Engine:** our own clean-room continuity engine (`films/godevlevel-launch/engine/`). **Do not use onetake** — its licence forbids commercial use.

---

## 0. Deliverables (what the $10,000 buys)

| # | Deliverable | Spec |
|---|---|---|
| 1 | Hero launch film | 60 s, 16:9, 1920×1080 (+ 4K render) — YouTube, website, events |
| 2 | Reel cut | 30 s, 9:16, 1080×1920 — Instagram Reels, YouTube Shorts |
| 3 | Bumper | 15 s, 9:16 — ads |
| 4 | Hindi/Hinglish version | Hero + Reel with Hinglish voiceover and captions |
| 5 | Captions | .srt for every version; burned-in captions on 9:16 cuts |
| 6 | Stills | 3 key frames for thumbnails and social posts |
| 7 | Project archive | Engine + manifests, so any word or price can be changed and re-rendered later |

**Approval gates with the client** (protects the budget): treatment → style frames → animatic with VO → final. Two revision rounds per gate, requested by beat number.

---

## 1. Real source material (facts only from the client)

Everything below is from trustcomm.app (read 5 Oct 2026). **The film may say nothing that isn't in this ledger.** Re-check with the client before final.

| ID | Fact | Source |
|---|---|---|
| F1 | Helps shops get more Google reviews from their real customers | Homepage headline |
| F2 | "Hear from more of your customers, not just the loudest ones" | Homepage |
| F3 | One QR code on the counter, printed with the shop's name and colours; setup in a few steps | How it works, step 1 |
| F4 | Customers scan and rate: no app, no sign-in, under a minute | Step 2 / demo |
| F5 | Languages: English, Hinglish, Hindi, Kannada, Tamil, Telugu | Step 2 |
| F6 | Customer picks what the review mentions; nothing is ticked for them | Demo |
| F7 | Customer chooses: post on Google (starting from a draft built from what they tapped, which they edit and post in their own name) or send the owner a private message | Step 3 |
| F8 | 14-day free trial, no card needed to start | CTA |
| F9 | ₹699 a month after the trial | CTA |
| F10 | Trustcomm does not create reviews for people who haven't visited; reviews are written and posted by customers | Footer disclaimer |

**Get from the client before building:**
- Logo files (SVG), exact brand colours, brand font (or approval of ours).
- Product UI: real screenshots or the live demo at `trustcomm.app/r/demo` (Claude Code may screenshot it and rebuild the UI in vector).
- Launch date, launch tagline (if any), and confirmation of F1–F10 wording and price.
- Whether to show real shop names. Default: fictional shops only (the site's own demo uses "Meera's Tiffin Room").

---

## 2. Compliance guardrails (non-negotiable for this product)

This is a reviews product, so the film must not look like it helps fake or filter reviews.

1. **Never imply review gating.** Don't show happy customers sent to Google and unhappy ones sent privately. Show the **customer choosing** freely (F7), with both a positive Google post and a constructive private note — exactly as the site does.
2. **No star-farming language:** no "more 5-star reviews", "boost your rating", "remove bad reviews". Use "more reviews from real customers" (F1).
3. **No Google logo, no Google Maps UI clones, no Google font (Google Sans), no Google colour sequence.** Saying "Google reviews" as plain text is fine. Nothing may suggest Google endorses Trustcomm.
4. **Every customer, shop and review in the film is fictional** and clearly reads as an example.
5. **Price and trial terms (F8, F9)** shown exactly as on the site, and confirmed with the client before final.

---

## 3. Director's treatment

### Story spine (from the client's own line, F2)
**The loud few vs. the quiet many.** One angry customer shouts a one-star review; ten happy ones smile and walk out silently. Trustcomm gives the quiet ones a voice in one scan.

### The three concepts considered

| Concept | The one idea | Verdict |
|---|---|---|
| **A. One square, many voices** | A single QR-code square is the only object that never leaves. It prints onto the counter sign, becomes the phone's scan frame, splits into rating buttons, flips through six languages, folds into a review card, and finally stacks into the full QR code and the Trustcomm logo. | **Chosen.** The product *is* the QR code; one square carrying the whole film is the product's promise made visible. |
| B. The volume knob | Loud vs. quiet as literal sound waves; Trustcomm turns up the quiet voices. | Clever, but abstract; harder to show the UI. Use as a motif inside A (Beats 1–3). |
| C. A day at the counter | Real-time day in one shop, sunrise to close, with scans piling up. | Charming but slow; fights "constant motion". |

### Look
- **Palette:** client brand colours (extract from logo/site — never guess) + one bright paper white + one warm neutral. Bright grounds, not dark: optimistic daytime energy.
- **Type:** one geometric OFL sans, huge and friendly, sentence case.
- **Shapes:** rounded squares (from the QR module), pills (language chips), circles (buttons). Everything is built from the QR square's geometry.
- **People/places:** short stock or illustrated moments of Indian shops (tiffin room, salon, mobile shop, café, clinic) that only ever appear **inside shapes the square has built**.
- **Energy:** 124 BPM. Something changes on every beat. Two short stillness pockets so the hits land (Beat 3 and Beat 13).
- **Sound:** every visual event has a designed sound (Section 6). Nothing moves silently.

### Rhythm targets
- Beat 0.484 s, bar 1.935 s, 31 bars ≈ 60 s.
- Shortest shot ~0.24 s (language flips), longest ~3.9 s (owner reading feedback). Spread ≥ 8×.
- Accelerating montage in Beat 8 (languages) and Beat 14 (shop types), shrinking from ~0.97 s to ~0.24 s.
- ~15% stillness overall.

---

## 4. Beat sheet — 60 s hero film

Every boundary names what **carries** into the next beat.

| # | Time (s) | Voice | Picture & motion | Sound | Carries out as |
|---|---|---|---|---|---|
| 1 | 0.0–3.9 | VO1 "Your happiest customers?" | A shop counter in flat illustration. Customers pass through as rounded shapes: green smiles drift out quietly, one red shape shouts, its sound-wave spikes huge. | Busy shop murmur, one loud angry burst (wordless), till ding | The red sound-wave spike |
| 2 | 3.9–6.8 | VO2 "They pay, they smile… and they leave." | The quiet ones slide out of frame one by one on the beat; door swings. | Soft footsteps, door chime ×3 on beats | The empty doorway (a rectangle) |
| 3 | 6.8–9.7 | VO3 "The loudest one writes the review." | **Stillness pocket.** The doorway rectangle becomes a single phone screen showing one harsh one-star review (fictional). It sits, uncomfortably still. | Music drops to a low pulse; single thud | One square pixel lifts off the screen |
| 4 | 9.7–11.6 | VO4 "Meet Trustcomm." | The pixel spins, grows, and snaps into the Trustcomm logo mark; colour floods the frame; music kicks in full. | Riser → big downbeat hit | Logo's square |
| 5 | 11.6–15.5 | VO5 "One QR code on your counter." | The square multiplies into a full QR code, which prints onto a counter stand-up with the fictional shop's name and colours (F3). Camera swings round the stand. | Printer zip, stamp hit | QR code on the stand |
| 6 | 15.5–19.4 | VO6 "Customers scan. No app. No sign-in." | A phone's camera frame locks onto the QR code; corners snap in; the screen opens the rating page instantly (F4). "No app" and "No sign-in" stamp as chips. | Scan beep, two stamp pops | The phone screen |
| 7 | 19.4–23.2 | VO7 "They rate their visit…" | Rebuilt real UI: "How was the food?" Tap. "How was the service?" Tap. Buttons pop on beats. | Tap ×4 on beats, soft haptic buzz | The language chip |
| 8 | 23.2–27.1 | VO8 "…in their own language. English. Hinglish. Hindi. Kannada. Tamil. Telugu." | **Accelerating montage:** the same question flips through six languages (F5), each flip faster, the chip changing colour every time. | Six ascending tick-pops, accelerating | The chips row |
| 9 | 27.1–31.0 | VO9 "They pick what to mention. Nothing is ticked for them." | Mention chips: "The food", "The staff", "Filter Coffee"… the customer taps two; the rest stay empty (F6). | Taps, a soft "check" sound | The ticked chips |
| 10 | 31.0–34.8 | VO10 "Then they choose." | **The split:** the screen divides into two paths, both glowing equally: "Post on Google" and "Tell the owner privately" (F7). The customer's thumb hovers… | Music lifts; heartbeat-like pulse | Both paths, equal |
| 11 | 34.8–38.7 | VO11 "Post on Google, in their own name…" | Path 1: the ticked chips assemble into a draft; the customer edits a word; the review card posts (generic review card, no Google UI or logo). | Typing ticks, send whoosh | Review card |
| 12 | 38.7–42.6 | VO12 "…or tell you privately." | Path 2: a private note flies to the owner's phone ("The table by the door gets cold in the evening" — from the site's own example). | Paper fold, soft notification | Owner's phone |
| 13 | 42.6–46.5 | VO13 "Real reviews, from real customers." | **Stillness pocket.** The owner reads, nods, smiles. One card at a time stacks gently: two real-sounding reviews and one private note. | Music thins to pulse; single warm chime | The stack of cards |
| 14 | 46.5–50.3 | VO14 "Hear from more of your customers. Not just the loudest ones." | **Accelerating montage:** the stack fans into many shops across India (tiffin room, salon, mobile shop, café, clinic, sweet shop), each inside a rounded square, faster and faster. The quiet green shapes from Beat 1 now have voices. | Accelerating hits, crowd cheer swell | All squares converge |
| 15 | 50.3–54.2 | VO15 "Fourteen days free. No card needed." | Squares converge into one big card: "14-day free trial · No card needed · ₹699/month after" (F8, F9). | Three stamp hits on beats | The card collapses to one square |
| 16 | 54.2–60.0 | VO16 "Trustcomm. Now across India. trustcomm.app" | The square becomes the logo; a map of India fills with tiny QR squares lighting up; URL types on. Final hit on the downbeat, hold, silence. | Big final hit, shimmer tail, silence | — (end) |

**Cutdowns:** the 30 s Reel uses Beats 1, 3 (short), 4, 6, 8, 10–12 (tight), 15, 16. The 15 s bumper uses 4, 6, 8, 16. Re-composed for 9:16, never cropped.

---

## 5. Voiceover (ElevenLabs)

### Voice direction
```
Indian-English narrator, warm and energetic, mid-20s to mid-30s.
Bright, confident, smiling, never shouty. Fast and rhythmic: about
160 words per minute, short lines landing like beats. Playful on the
setup ("They pay, they smile… and they leave."), crisp and proud on
the product lines, big and celebratory on "Trustcomm. Now across
India." Keep energy and pitch identical across all takes.
```
Starting settings (adjust by ear): stability ~35%, similarity ~75%, style ~30%, speaker boost on. Generate each line 3×, keep the punchiest. One voice, same settings throughout.

### English lines (VO1–VO16)

| File | Line |
|---|---|
| VO1 | Your happiest customers? |
| VO2 | They pay, they smile… and they leave. |
| VO3 | The loudest one writes the review. |
| VO4 | Meet Trustcomm. |
| VO5 | One QR code on your counter. |
| VO6 | Customers scan. No app. No sign-in. |
| VO7 | They rate their visit… |
| VO8 | …in their own language. English. Hinglish. Hindi. Kannada. Tamil. Telugu. |
| VO9 | They pick what to mention. Nothing is ticked for them. |
| VO10 | Then they choose. |
| VO11 | Post on Google, in their own name… |
| VO12 | …or tell you privately. |
| VO13 | Real reviews, from real customers. |
| VO14 | Hear from more of your customers. Not just the loudest ones. |
| VO15 | Fourteen days free. No card needed. |
| VO16 | Trustcomm. Now across India. trustcomm dot app. |

### Hinglish lines (VO1_hi–VO16_hi) — feed ElevenLabs the Devanagari; captions use Roman

| File | Devanagari (voice) | Roman (captions) |
|---|---|---|
| VO1_hi | आपके सबसे ख़ुश customers? | Aapke sabse khush customers? |
| VO2_hi | Pay करते हैं, smile करते हैं… और चले जाते हैं। | Pay karte hain, smile karte hain… aur chale jaate hain. |
| VO3_hi | और review लिखता है सबसे loud वाला। | Aur review likhta hai sabse loud wala. |
| VO4_hi | मिलिए Trustcomm से। | Miliye Trustcomm se. |
| VO5_hi | आपके counter पर एक QR code। | Aapke counter par ek QR code. |
| VO6_hi | Customer scan करे। ना app, ना sign-in। | Customer scan kare. Na app, na sign-in. |
| VO7_hi | अपना visit rate करें… | Apna visit rate karein… |
| VO8_hi | …अपनी भाषा में। English. Hinglish. हिंदी. ಕನ್ನಡ. தமிழ். తెలుగు. | …apni bhasha mein. English. Hinglish. Hindi. Kannada. Tamil. Telugu. |
| VO9_hi | क्या mention करना है, वो ख़ुद चुनें। पहले से कुछ tick नहीं। | Kya mention karna hai, woh khud chunein. Pehle se kuch tick nahi. |
| VO10_hi | फिर फ़ैसला उनका। | Phir faisla unka. |
| VO11_hi | Google पर post करें, अपने नाम से… | Google par post karein, apne naam se… |
| VO12_hi | …या सीधे आपको बताएँ। | …ya seedhe aapko batayein. |
| VO13_hi | असली customers से, असली reviews। | Asli customers se, asli reviews. |
| VO14_hi | सिर्फ़ loud वालों को नहीं, सबको सुनिए। | Sirf loud walon ko nahi, sabko suniye. |
| VO15_hi | चौदह दिन free। कोई card नहीं चाहिए। | Chaudah din free. Koi card nahi chahiye. |
| VO16_hi | Trustcomm. अब पूरे India में। trustcomm dot app. | Trustcomm. Ab poore India mein. trustcomm dot app. |

The Hinglish lines run longer; the timeline is audio-first and re-times around them, cuts still on the beat grid.

---

## 6. Music and sound design

### Music (one track, no vocals)
If the client's ElevenLabs plan includes music generation and its terms cover commercial use, generate there; otherwise license from a royalty-free library with a commercial licence. Prompt:
```
Energetic, optimistic Indian-fusion electronic instrumental for a
nationwide product launch, 124 BPM, 4/4. Modern kick and claps layered
with dhol and tabla percussion, bright plucked synth hook, light
sitar-like lead accents. Structure for 60 s: playful sparse intro
(0–7 s), drop to a low pulse (7–10 s), big kick-in with full beat at
10 s, steady build, lift at 31 s, peak 46–54 s, final big hit at 58 s
with a shimmering tail. No vocals. Must not resemble any existing song.
```

### Sound effects (ElevenLabs sound-effects generator, one file each)
Every on-screen event gets a sound. Generate 2–3 variants of each:

| ID | Prompt | Used in |
|---|---|---|
| SFX01 | Short bright UI tap, soft plastic click, clean | Beats 7, 9 |
| SFX02 | Phone camera scan lock, quick rising beep with soft focus click | Beat 6 |
| SFX03 | Punchy rubber stamp hit on paper, tight and dry | Beats 6, 15 |
| SFX04 | Fast airy whoosh, left to right, 0.4 s | Transitions |
| SFX05 | Small receipt printer zip, short | Beat 5 |
| SFX06 | Shop door bell chime, single, warm | Beat 2 |
| SFX07 | Short pop, rising pitch, playful, 0.15 s | Beat 8 (pitch-shift ×6) |
| SFX08 | Gentle phone notification ping, warm and soft | Beat 12 |
| SFX09 | Cinematic riser into a deep punchy impact, 1.5 s | Beat 4 |
| SFX10 | Big final impact with sparkling shimmer tail, 2.5 s | Beat 16 |
| SFX11 | Indian café ambience, cutlery, light chatter, 6 s, loopable | Beats 1–2 |
| SFX12 | Paper folding quickly, crisp | Beat 12 |

**Mix:** VO on top; music ducked under VO; SFX tight to frames (±1 frame) and always below VO. Loudness −14 LUFS, true peak below −1 dBTP.

---

## 7. Visual assets

**Built in code (most of the film):** QR geometry, UI rebuilt in vector from the real product, cards, chips, phones, India map, type, the counter stand, illustrated shop counter and customer shapes.

**Real-world moments (optional, 5 clips, 9:16 and 16:9):** Canva Pro stock, used only inside rounded squares in Beat 14. Rules: Indian shops, no visible brand logos or readable signage, no identifiable real people up close, bright daytime energy.

| Clip | Canva search |
|---|---|
| C1 tiffin room / South Indian restaurant | "indian restaurant dosa serving" |
| C2 salon | "indian salon haircut" |
| C3 mobile shop | "mobile phone shop india" |
| C4 café | "cafe counter india coffee" |
| C5 sweet shop / bakery | "indian sweet shop counter" |

Fallback: if any clip is weak, that square shows an illustrated shop instead.

---

## 8. Folder layout

```
films/trustcomm-launch/
  BRIEF.md            this file
  STATE.md            maintained by Claude Code
  client/             logo (SVG), brand colours, fonts, confirmed facts
  ui/                 screenshots of the real product / demo
  vo/                 VO1–VO16 (+ _hi versions)
  music/              track + LICENSE
  sfx/                SFX01–SFX12 (+ variants)
  stock/              C1–C5 (optional) + ASSETS.md
  refs/               2–3 real reference launch films (private study only)
```

---

## 9. Build prompt for Claude Code

```
You are the motion director and engineer for a paid client launch film:
Trustcomm (trustcomm.app), launching across India. Read BRIEF.md fully.
It is the brief: do not invent anything it doesn't give you.

LICENCE RULE: build only with OUR engine in films/godevlevel-launch/
engine/ (reuse; import, don't fork). Do NOT download, read or use code
from onetake or any other motion library. This is commercial work.

TOOLS
- ElevenLabs connector: generate VO1–VO16 (and _hi) with the voice
  direction in BRIEF §5; generate SFX01–SFX12 (§6); generate the music
  (§6) only if the plan's terms allow commercial use, otherwise stop
  and ask me for a licensed track. Save to vo/, sfx/, music/ and log
  every generation (voice, settings, prompt) in ASSETS.md.
  If the ElevenLabs connector isn't available in this session, stop
  and tell me.
- Canva connector (optional): stock clips C1–C5 via designs I create;
  otherwise use the illustrated fallback.
- Read trustcomm.app and trustcomm.app/r/demo for real UI and copy;
  rebuild the UI in vector from screenshots. Extract brand colours from
  the client logo/site; show me the values before using them.

COMPLIANCE (BRIEF §2) — the checker must fail the build if:
- any line or visual implies review gating or star-farming,
- any Google logo, Google Maps UI clone or Google font appears,
- any number or claim isn't in the BRIEF §1 fact ledger.

STAGES — stop at each ⏸
1. MEASURE: analyse refs/ (cuts/min, % still, beat spread, interval
   curves) and every VO file's length; music tempo and downbeats. ⏸
2. TIMELINE: audio-first, on the music's real beat grid. Show the beat
   sheet with real times, carry object per boundary, stillness %,
   spread, and the accelerating runs (Beats 8 and 14). ⏸
3. STYLE FRAMES + EXEMPLARS: Beat 6 (QR scan → rating page) and
   Beat 10 (the equal split) to final quality, with sound. ⏸
   (These go to the client for approval.)
4. ANIMATIC: full 60 s at draft quality with VO, music and SFX. ⏸
5. FINAL: full build with carry handoffs, global camera, motion blur
   on fast moves, every event synced to a sound (±1 frame).
6. CUTDOWNS: 30 s and 15 s 9:16 versions, re-composed, not cropped;
   Hinglish versions of hero + Reel.
7. CHECK: carry scores, rhythm, compliance, loudness −14 LUFS / peak
   < −1 dBTP, determinism, contact sheets. Report honestly. ⏸
Update STATE.md after every stage; commit and push.
```

---

## 10. Before delivery

- Client signs off the fact ledger (F1–F10) and the price on screen.
- Client approves every fictional review text shown on screen.
- Keep all licences (ElevenLabs plan terms, music, Canva stock) with the project.
- Watch every version on a phone, sound on, at full brightness.
