ROLE
You are a world-class motion designer and sound designer who has made Apple keynote films, now
building a 9:16 Hinglish news-explainer reel about the PHP2Shell security flaw. Tone: a calm,
cinematic thriller that turns into trustworthy clarity. Look: "Apple keynote at night": pure
black, precise white line art, one red alarm accent, glass panels, particle dissolves.
Every word that matters gets a visual, every visual event gets a sound, and nothing moves without a reason.
If a Remotion skill or best-practices guide is available, load it first.

=====================================================================
1. TECH + SYNC
=====================================================================
- Remotion + TypeScript, 1080x1920, 30fps. Duration = vo.mp3 length + 0.8s. Export H.264 high
  bitrate + AAC 320k, plus a 1080x1920 PNG still per scene and a contact sheet.
- Transcribe vo.mp3 with word-level timestamps (Whisper / faster-whisper / ElevenLabs) into
  src/timings.json. Every scene boundary, reveal, number change and sound effect is keyed to its
  ANCHOR WORD below. Never hardcode seconds. Visual anticipation starts 4–8 frames before the word;
  the hit lands ON the word.
- One source of truth: src/timeline.ts exports all scenes + events; picture and sound both read it.
- Seeded randomness only (particles, glitches), so renders are identical every time.

NARRATION (the audio says exactly this):
[S1] 21 October ki raat. Duniya bhar mein server sambhalne waalon ki neend udd gayi.
[S2] Aur agar aapki website WordPress pe hai... toh yeh kahani aapki bhi hai.
[S3] WordPress chalta hai PHP pe. Aur PHP ke andar mile do aise bug... jo das saal se chupchaap baithe the.
[S4] Inhe pakda Wiz, Calif aur OpenAI ke researchers ne.
[S5] Ab samjho, hua kya. Mumbai ka dabbawala. Roz hazaaron tiffin, ek ghar se doosre ghar.
[S6] Socho ek tiffin wapas aata hai... aur uske andar pichhle ghar ki chaabi reh gayi. Agla aadmi dabba kholta hai... aur chaabi uske haath mein.
[S7] PHP server bhi kuch aisa hi karta hai. Har request ek tiffin hai. Aur yeh bug, pichhli request ka bacha hua data... agle ke haath mein de sakta hai. Password. Token. API keys.
[S8] Aur kuch cases mein, hacker bina login kiye... poore server pe control le sakta hai.
[S9] Isliye PHP ne isey 10 mein se 9.2 ki critical rating di. 21 October ko fix aaya... aur usi din attack ki koshishein bhi dikhne lagi.
[S10] Lekin ab dar nahi, sach suniye. Abhi tak kisi bade hack ki confirm khabar nahi hai. Kuch companies ne safety ke liye services band ki. Aur fix aa chuka hai.
[S11] Toh aaj hi apne hosting wale se ek sawaal pucho: "Kya PHP update ho gaya?" Naye versions screen pe hain.
[S12] Aur dhyan rakhna... sirf plugin update karne se yeh theek nahi hota. PHP khud update karna padega.
[S13] Apni website check karne ka simple tareeka chahiye? Comment karo PHP, main bhej dunga. Aur yeh video us dost ko bhejo... jiski website hai.

=====================================================================
2. DESIGN SYSTEM
=====================================================================
Colour
- Background #000000 with a barely-there radial lift #0B0C0F at centre; ultra-subtle film grain 2%.
- Line art + text: #F5F5F7. Secondary text: #8E8E93. Hairlines: #2C2C2E.
- ALARM accent: #FF3B30 (danger, bug, hacker, critical). Used sparingly: it means "danger".
- TRUST accent: #34C759 (fix, safe versions, "sach") appears ONLY from S10 onward. The colour
  shift red → green IS the story.
- Glass panels: rgba(255,255,255,0.06), backdrop blur 24px, 1px rgba(255,255,255,0.12) stroke,
  28px radius.
Type
- Inter Display 700 for headlines (tracking -0.03em), Inter 500 for body, JetBrains Mono 500 for
  CVEs, versions, code, labels. Accent words in Instrument Serif Italic.
- Label pills: mono 26px caps, 1px #F5F5F7 stroke, 999px radius (danger pills: red stroke + red text).
Line art
- All illustrations are single-weight white strokes (3px at 1080w), rounded caps, drawn on with
  stroke-dashoffset (write-on), slightly hand-feel but clean (Apple-precise, not sketchy).
- Particles: 2–3px white dots, used for dissolves/assemblies (text and shapes form from and break into dust).
Safe zones: no important text in the top 240px or bottom 440px. Captions sit above the bottom zone.
No logos anywhere. Company and product names appear as plain text only.

=====================================================================
3. MOTION LANGUAGE
=====================================================================
- Entrances: write-on strokes (0.5–0.8s, ease-in-out), springy scale for chips (stiffness 160,
  damping 18, overshoot ≤ 4%), text rise 20px + blur 8px → 0.
- Exits: dissolve to particles, or blur + fade 0.3s. No hard cuts; use match-cuts (one shape morphs
  into the next scene's shape) wherever possible.
- Camera: a slow continuous push (scale 1.00 → 1.04 per scene); a deliberate push-in on every
  emotional beat; a 2-frame micro-shake ONLY on the 3 alarm hits (S1 "udd gayi", S8 "control",
  S9 "9.2").
- Rhythm: hold 8–12 frames of stillness after every big hit. Silence is a design element.
- Kinetic type: key words pop 1.0 → 1.08 → 1.0 when spoken; danger words get a red underline wipe;
  trust words get a green underline wipe.

=====================================================================
4. SCENES (anchor word → visual → sound)
=====================================================================
S1 "21 October ki raat"
  Visual: pure black, 0.4s of silence. A thin white calendar outline writes on in the centre;
  "OCTOBER 2026" in mono; the 21st cell glows red and its number scales up to fill the cell. On
  "Duniya bhar mein" the calendar dissolves into a slowly rotating dotted globe (particles),
  with 30–40 tiny server icons (rect outlines) lighting up white across it. On "neend udd gayi" all
  server icons flash red at once; a red pulse ring expands from the globe; 2-frame micro-shake.
  Sound: low sub drone fades in from silence; soft clock tick on "21"; deep "thoom" + rising
  alarm-pad swell on "udd gayi" (no cheesy siren).

S2 "agar aapki website WordPress pe hai"
  Visual: the globe zooms past camera (dolly through) into ONE browser window outline that writes on,
  centred: an address bar reads "aapki-website.com", and a small label pill under it reads
  "WordPress". On "aapki bhi hai" the window slides close to camera (push-in), and a soft red outline
  pulses around it once.
  Sound: whoosh through the globe; soft UI click as the browser appears; a heartbeat thump on "aapki".

S3 "WordPress chalta hai PHP pe"
  Visual: the browser window lifts up to reveal a layer beneath, like an X-ray: a glass panel with a big
  mono "PHP" (white). A thin connector line runs from WordPress down to PHP (stack diagram:
  Website → WordPress → PHP). On "do aise bug" two small red bug glyphs (simple line insects) crawl out
  of the PHP panel's corners; their labels type in: "CVE-2026-109618", "CVE-2026-109619". On
  "das saal" a counter in mono rolls "2016 → 2026" with a dusty particle trail, and a faint cobweb line
  draws at the panel corner.
  Sound: low glassy "layer reveal" sweep; tiny scuttling clicks for the bugs; tape-like reverse riser
  under "das saal".

S4 "Inhe pakda Wiz, Calif aur OpenAI ke researchers ne"
  Visual: a magnifying-glass line icon sweeps across the PHP panel, and the bugs freeze inside its lens
  (caught). Three name chips spring in one by one, exactly on each name: "Wiz", "Calif", "OpenAI"
  (plain text pills, no logos), with the label above "Found by researchers". A small sparkle on the lens.
  Sound: lens "focus" swoosh; one bright tick per chip (pitch rising: low, mid, high); a soft "caught"
  click when the lens stops.

S5 "Ab samjho, hua kya. Mumbai ka dabbawala"
  Visual: everything dissolves to particles, which re-form into the analogy world. A single white line
  draws a long horizontal ground line; a dabbawala line figure (white cap, simple body) writes on,
  carrying a rack of round tiffins. A small label pill "DABBAWALA". On "hazaaron tiffin" the camera
  pulls wide to reveal a row of 6 tiny house outlines left and right; dotted path lines connect them as
  tiffins hop from house to house along the dotted arcs (staggered, rhythmic).
  Sound: warm pluck motif begins (light, curious); soft "tok" for each tiffin landing (seeded pitch
  variation); a gentle bicycle-bell ding on "dabbawala".

S6 "ek tiffin wapas aata hai... pichhle ghar ki chaabi... chaabi uske haath mein"
  Visual: close-up of ONE tiffin travelling back along the arc (camera follows). On "chaabi reh gayi"
  the tiffin lid opens slightly with an X-ray reveal: a red key outline is inside it. Label pill
  "PICHHLE GHAR KI CHAABI" (red). On "Agla aadmi dabba kholta hai" a second person outline at the
  next house lifts the lid; on "chaabi uske haath mein" the red key floats up into his hand, and his
  eyes (two dots) widen. A small red "!" pops above.
  Sound: tiffin rattle; metal lid "clink"; a tiny key jingle exactly on "chaabi"; low "uh-oh" synth
  note on "haath mein".

S7 "PHP server bhi kuch aisa hi karta hai"
  Visual: MATCH CUT. The houses morph into server rack outlines; the dabbawala's path becomes a request
  line; the tiffins become small request envelopes. Mapping pills appear stacked on the right, each on
  its words:
    "TIFFIN → REQUEST"  ("Har request ek tiffin hai")
    "BACHA HUA DATA → MEMORY" ("bacha hua data")
  On "agle ke haath mein" a request envelope leaves the server carrying a faint red trail of leaked bits.
  On "Password. Token. API keys." three red mono chips burst out of the envelope one by one, each on
  its word: "PASSWORD", "TOKEN", "API KEY", each with a tiny glitch flicker.
  Sound: data-flow hum; soft "swipe" per mapping pill; three sharp glitch "tsk" hits, one per chip.

S8 "hacker bina login kiye... poore server pe control"
  Visual: a hooded figure outline (red stroke) appears at the edge; a login box outline
  ("USERNAME / PASSWORD") sits in front of the server and he walks straight past it; on "bina login
  kiye" the login box gets a red strike-through. On "poore server pe control" every server rack
  outline turns red from bottom to top in a fast wave, a red cursor icon appears, 2-frame micro-shake.
  Sound: stealthy low pulse; a "denied" click that fails (soft buzz) on the login box; a big low hit + red
  wave "zap" sweep on "control".

S9 "10 mein se 9.2 ki critical rating ... fix aaya ... attack ki koshishein"
  Visual: a semicircle gauge (thin white arc, 0–10) writes on; the needle swings with physics and
  settles at 9.2; the number counts up in big Inter Display "9.2" with "/10" small, and a red pill
  "CRITICAL" springs in; micro-shake on settle. On "21 October ko fix aaya" a green-outlined small
  shield icon blinks in at the top-left of the gauge (first hint of green), plus a date chip
  "FIX: 21 OCT". On "attack ki koshishein" faint red arrows start pinging at the shield from the edges
  (3–4 arrows, deflected).
  Sound: gauge ratchet ticks while the needle moves; a heavy "clunk" on 9.2; soft positive chime on
  "fix"; small impact pings for each deflected arrow.

S10 "Lekin ab dar nahi, sach suniye"  ← THE TRUST TURN
  Visual: all red elements desaturate and fade; the music drops to near silence for 10 frames. Clean
  black. Headline writes in white: "Sach." with a green underline wipe. Then three glass fact cards
  stack in, each on its sentence:
    1 "No confirmed major breach (as of 21 Oct)"
    2 "Some services offline as a precaution"
    3 "Fix available" (green check)
  The background warms very slightly (centre lift to #0F1110).
  Sound: everything cuts to a single soft piano note on "sach suniye"; a gentle glass tap per card; a
  warm, resolved chord on "fix aa chuka hai".

S11 "hosting wale se ek sawaal ... Naye versions screen pe hain"
  Visual: a chat bubble outline (left-aligned, like messaging a host) types:
  "Kya PHP update ho gaya?" in Inter 600. On "Naye versions screen pe hain" a glass panel slides up with
  the safe versions in big mono, each line ticking in with a green check:
    PHP 8.5.12+
    PHP 8.4.27+
    PHP 8.3.36+
    PHP 8.2.35+
  plus a small grey line: "PHP 8.1 or older → upgrade required". Hold this panel ≥ 2.5s (people
  screenshot this).
  Sound: keyboard typing clicks for the bubble; a soft "message sent" whoosh; one ascending tick per
  version line; a camera-shutter-like soft click on hold (cue to screenshot).

S12 "sirf plugin update karne se yeh theek nahi hota. PHP khud update karna padega"
  Visual: two side-by-side cards. Left: a puzzle-piece "Plugin update" card with a red ✗ ("theek nahi
  hota"). Right: a "PHP update + server restart" card with a green ✓ and a little circular restart arrow
  that spins once. On "PHP khud" the right card scales up 1.08 and the left dims.
  Sound: soft negative "bonk" on ✗; satisfying "ding" + spin whoosh on ✓.

S13 "Comment karo PHP ... us dost ko bhejo ... jiski website hai"
  Visual: CTA. A big rounded pill "Comment PHP" (white fill, black text) pulses gently; above it the
  small line "Website check karne ka tareeka 📩". On "us dost ko bhejo" a paper-plane line icon flies
  from the pill to a small friend avatar outline with a browser window above his head. End card: "@baqur.ai"
  in mono, and a tiny grey sources line at the bottom edge: "Sources: PHP advisory · The Hacker News ·
  watchTowr · Qualys". Hold the final 0.8s.
  Sound: upbeat soft pluck resolves; a pop on the pill; a paper-plane swish; a gentle final chime.

=====================================================================
5. CAPTIONS
=====================================================================
Burned-in Hinglish captions from word timestamps: 2–4 words per chunk, Inter 700 44px, white, soft dark
shadow, centred above the bottom safe zone. The active word is red in S1–S9 and green in S10–S13
(reinforcing the danger → trust shift). Captions never cover numbers, CVEs, or the versions panel
(move them up during S11).

=====================================================================
6. SOUND DESIGN + MIX
=====================================================================
- Build every SFX listed above as audio events in the timeline at the exact frame of its visual hit.
  Generate them procedurally in code (filtered noise, sine/FM tones, envelopes) or use ElevenLabs
  sound effects if an API key exists. Cache files in public/sfx/.
- Music bed (original, generated or synthesised): S1–S9 dark ambient pulse (low drone + subtle
  ticking, 92 BPM feel); a 10-frame drop to silence at S10; S10–S13 warm, hopeful piano/pluck.
  The bed ducks 8 dB under the voice.
- Levels: voice ≈ -14 LUFS integrated; SFX peaks about 10–14 dB under the voice; nothing masks words.
  True peak ≤ -1 dBTP.

=====================================================================
7. QUALITY CHECK (must pass before final render)
=====================================================================
1. Still at every anchor word; each visual matches its spoken words.
2. Every SFX within ±1 frame of its visual hit (print an event table: event, expected, actual).
3. Facts on screen exactly: CVE-2026-109618 · CVE-2026-109619 · Wiz · Calif · OpenAI · 9.2/10
   critical · FIX: 21 OCT · 8.5.12 / 8.4.27 / 8.3.36 / 8.2.35 · "PHP 8.1 or older → upgrade required" ·
   "No confirmed major breach (as of 21 Oct)".
4. No logos, no text in safe zones, nothing clipped, red never appears after S10 except the S12 ✗.
5. Duration = vo + 0.8s. Report a scene timing table and render time.
