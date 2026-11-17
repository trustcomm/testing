# TASTE — Trustcomm Instagram reel (style memory; read first in every chat)

## 1. Brief
- trustcomm.app (built by GoDevLevel, Tumkur): QR on the counter → customers rate in their language → a draft they edit
  and post on Google themselves, or a private note to the owner. ₹699/month launch price; free Google score quiz.
- Reel 9:16 1080×1920, 60 fps, 42.6 s, Hinglish VO (owner's ElevenLabs voice, assets/vo/vo_v1.mp3), SFX only.
- Audience: shop / restaurant owners in Karnataka and South India. CTA: free Google score (trustcomm.app/score).
- Demo shop: Meera's Tiffin Room (the site's own demo).

## 2. Look (MotionSmith SaaS Launch, bright-flat, recoloured to trustcomm.app)
- Stage #faf9f6, ink #12151c, muted #667085, ONE accent blue #1f5eff; red #e24a29 once (the 1-star card); green #16a34a once (posted).
- Type: Plus Jakarta Sans 800 (headlines, wordmark), Inter (UI); customer page uses the site's own Noto Sans Kannada/Tamil/Telugu/Devanagari.
- Through-line: the blue line from the "m" of the wordmark (poll bar → QR → scan line → split paths → gauge).
- The customer page is rebuilt from trustcomm.app/r/demo with its real strings in all 6 languages (assets/i18n.json).

## 3. Motion
- SaaS Launch tokens (src/kit.js EZ): blur-in words 0.4 s, pops with 9–17 % overshoot, camera tilts 0.6 s, morphs ~0.5 s.
- No hard cuts: camera tilts, card → dot morph, wordmark tail, phone rise, line split.

## 4. Sound
- SFX only (style forbids music). 71 cues (assets/sfx/cues.json), Baqur kit synth. Voice normalised to −16 LUFS.
  Climax: the URL lands ("score", 40.3 s). Master −14.1 LUFS, −1.5 dBTP.

## 5. Honesty
- No invented ratings, review counts or results; the hook is a question; the gauge shows "?".
- Real flow only: the customer edits and posts on Google; the private note is offered, never instead of Google.

## 6. Technical
- Render: `MVD_TOOLKIT=/opt/node-tools node src/render.js --fps 60 --scale 1 --out renders/final --name "<name>" --audio renders/audio/mix.wav`
- Sound: `node <skill>/framewright/fw-sfx.mjs assets/sfx/cues.json`; keying: `python scripts/key.py` (also writes phone screen boxes).
