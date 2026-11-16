# GMS Rising Petals — admissions promo: choreography (v1, for approval)

Format: 9:16, 1080×1920, 60 fps, ≈ 50 s, English VO + soft music bed + SFX. Delivered as MP4 (H.264, −14 LUFS).
Look: "Petal Storybook" — custom, built on the client's own brand (no MotionSmith style fits a preschool; see §4).
Pipeline B: illustrated 3D-cartoon plates and characters generated from the prompts in `plan/asset-prompts.md`,
cut out and composited in code; all type, icons, transitions, petals and the logo animation drawn in code.
Times are estimates until the VO arrives; then every beat locks to word timestamps (`plan/beats.json`).

## 1. The idea
A child's first school is where a small seed starts to grow. **One petal** (orange → red → green, the logo's ribbon
colours) is the through-line: it sprouts in the hook, becomes the ribbon that writes "GMS", carries the camera into each
room, grows the program stems, and lands back in the logo at the end. Growth is the visual language: things sprout,
bloom, rise and open — nothing just fades in.

## 2. Story beats

| # | Time | VO (spoken) | Picture | Move / transition | Sound |
|---|---|---|---|---|---|
| 1 Hook | 0.0–4.0 | Every big dream… begins as a tiny seed. | Macro on soft soil in morning light. A seed cracks, a sprout pushes up and unfurls two leaves; one leaf is our petal. Dust motes, shallow depth of field. | Slow push-in from frame 1; sprout grows on "seed" | soft sparkle, earthy pop on the leaf |
| 2 Emotion | 4.0–9.0 | Your child's first school is where that seed begins to grow. | Pull back: the sprout is in the corner of a sunny garden path. The two mascots (boy, girl) walk hand in hand toward a cheerful school gate, backpacks bouncing; petals drift past camera. | Camera rises with the petal as it lifts off the sprout on the wind | light whoosh, footsteps tick, birds bed |
| 3 Brand | 9.0–14.5 | Welcome to G M S Rising Petals! A caring early learning space, right here in Tumkur. | The petal flies to centre, splits into three ribbons (orange, red, green) that draw the G, M, S letterforms; the double ring draws on around them; "RISING PETALS / Little Petals, Big Dreams" rises. A map pin drops: "Melekote Main Road, Tumkur". | Ribbon write-on (≈1.2 s), ring stroke draw, tagline blur-in | rising tonal sweep → bright chime on the ring close |
| 4 Promise | 14.5–20.0 | Where little ones play… explore… and learn, every single day. | Zoom through the "O"-shaped ring into a bright classroom. Three flowers bloom in a row, each opening onto an icon + word: **Play** (blocks), **Explore** (magnifier on a leaf), **Learn** (open book). The mascots react in the background. | Zoom-through (petal portal), stems grow on each word | three pops, rising pitch |
| 5 Values | 20.0–31.5 | Safe and nurturing. Activity-based learning. Early Islamic and moral values. And caring, trained educators for every little one. | A storybook opens on a desk; each page turn reveals one promise card with a hand-drawn tick: shield · building blocks · crescent with an open book · heart in two hands. Cards stack into a checklist on the last spread. | Page-flip per line (≈0.45 s), tick draws on the stressed word | paper flip + soft tick each line |
| 6 Programs | 31.5–40.0 | Playhome and Nursery begin on the first of December. L K G and U K G, from the next academic year. | Four flower stems grow from the grass, **taller with each age**: Playhome 2–3 (pink), Nursery 3–4 (orange), LKG 4–5 (blue), UKG 5–6 (purple), each topped with its program pill and toy icon. A calendar page flips to **1st December** beside the first two; "Next academic year" tag beside the last two. | Stems rise in sequence (growth = age), calendar flip | four rising pops, calendar flip, chime |
| 7 CTA | 40.0–46.0 | Admissions are now open! Call or WhatsApp us today. | A green cloud bursts open: **Admissions Open** in bright yellow with a megaphone; petal confetti. Then a phone card slides up with a WhatsApp badge: **99287 88015 · 99010 17215**, and the address line. | Cloud burst (the one big hit), card rise | impact + sparkle, phone pop |
| 8 End | 46.0–50.0 | G M S Rising Petals. Little petals… big dreams. | All the petals gather and settle into the logo ring; the garden blooms around it; numbers stay small at the bottom. Hold 1.5 s. | Petals converge into the logo, gentle settle, slow push | soft whoosh in, warm chime, music ending |

On screen at all times from beat 3: a small logo bug top-left. Captions: no full subtitles; each beat's keywords
are the on-screen text (all text inside 9:16 safe zones: top 240 px, bottom 420 px clear).

## 3. Design system
- Palette (from the client's logo and flyers): brand green #0f7a43 / deep green #0b5a31, brand red #d9262e,
  orange #f7941d, sunshine yellow #ffcc29, cream #fff8ec, sky #e8f6ff. Program colours: pink #e93f80, orange #f47b20,
  blue #1f6fe0, purple #7b2fbe (as on the flyer pills).
- Type: Fredoka (round, friendly titles) + Nunito (labels, numbers). Both SIL OFL, from MotionSmith packs.
- Motion: soft springs with ≤10% overshoot, growth from the bottom, everything breathes (gentle sway on stems,
  drifting petals, slow camera). Transitions all come from one family: the petal (portal, ribbon, confetti).
- Characters: the client's own mascot look (3D cartoon boy in white kurta and prayer cap, girl in pink hijab),
  regenerated as clean cut-out poses so they can move.

## 4. Why a custom look (MotionSmith styles checked)
- `saas-launch`: built for software launches (dark stages, UI pieces, no music) — wrong mood for parents of toddlers.
- `vox`: newspaper and archive collage — wrong genre.
- Used from MotionSmith instead: the engine's flat-2D-explainer sound rules, the effect recipes `zoom-through-cut`,
  `checklist-ticks`, `chip-row-list`, Fredoka/Nunito font packs, and the starter sound library.

## 5. Honesty rules
- The school building, classroom and playground are illustrations, not photos of the campus. No claim says otherwise.
- Only facts from the client's own flyers: programs, ages, dates, values, address, numbers. No fees, no results.
