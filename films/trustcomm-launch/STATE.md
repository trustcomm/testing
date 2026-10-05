# Trustcomm India launch film: STATE

This file is updated after every stage. The brief is `BRIEF.md`. Every asset generation is logged in `ASSETS.md`.

## Current stage
**Blocked before Stage 1 ⏸.** The voiceover, SFX and music sources, plus the client's real UI and brand, are not available yet (see Blockers). No film code has been written yet.

## Licence rule
- Build only with our engine, `films/godevlevel-launch/engine/`, imported and not forked.
- No onetake, and no other motion library.
- The repo's older root folder `trustcomm-launch/` (a HyperFrames + GSAP test from earlier) is **not** used. GSAP is a third-party motion library.

## Blockers
| # | Blocker | Evidence | What unblocks it |
|---|---|---|---|
| 1 | **ElevenLabs account is on the Free tier, and free-tier access has now been disabled** | Generation error (2026-10-05 14:10 UTC): "Unusual activity has been detected on your account, so Free Tier access has been disabled. This can be triggered by using a proxy or VPN… Please upgrade to a paid subscription to continue." Only VO1 (3 takes) finished before this. | A **paid** ElevenLabs plan connected to this session. ElevenLabs' Free tier doesn't license output for commercial use, so even the finished VO1 takes can't ship in a paid client film. They are quarantined in `vo/_test-free-tier/` (gitignored, not for delivery). |
| 2 | **Music licence unverifiable** | No connector tool reports plan terms, and the plan is Free in any case. | Per the brief: confirm the paid plan's terms allow commercial use, or supply a licensed track plus its LICENSE in `music/`. |
| 3 | **trustcomm.app is blocked by this environment's network policy** | Proxy refuses CONNECT to trustcomm.app:443 (403) for both the homepage and `/r/demo`. | Add `trustcomm.app` to the environment's allowed domains (new session), **or** supply UI screenshots in `ui/`. |
| 4 | **Client inputs missing** | `client/` is empty. | Logo SVG, exact brand colours, font (or approval of ours: Archivo ExtraBold is approved for our films, but the brief asks for a geometric OFL sans), launch date and tagline, sign-off of F1–F10 and ₹699, real vs fictional shop names. |
| 5 | **No reference films** | `refs/` is empty. | 2–3 reference launch films, or approval to use the BRIEF §3 rhythm targets as they are. |

## Decisions so far
- **Voice auditioned: "Ishan – Bold and Upbeat"** (ElevenLabs library voice N09NFwYJJG9VSSgdLQbT, Indian-English, high-energy). Chosen as the closest match to §5. The model was eleven_multilingual_v2.
- The connector exposes no stability, similarity, style or speaker-boost controls, so the §5 settings can't be applied through it. They have to be set in the ElevenLabs app, or confirmed as acceptable at defaults.

## Log
- 2026-10-05:
  - Created the folder layout (§8) and saved BRIEF.md.
  - The ElevenLabs connector is available. Priced VO1 (72 credits for 3 takes) and generated VO1 ×3.
  - The VO2–VO6 batch hit the rate limit, then the Free tier was disabled. Stopped all generation.
  - trustcomm.app is blocked by the network policy. Stopped at the blockers.
