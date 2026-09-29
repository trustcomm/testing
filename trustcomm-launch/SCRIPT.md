# trustcomm launch film: voiceover script

> **Frame-matched ElevenLabs version (recommended): see [ELEVENLABS.md](ELEVENLABS.md).**

**Length:** 47 s · **Pace:** ~2.5 words/sec (calm, warm, "Google keynote" delivery)
**Voice direction:** friendly and confident, smiling, not salesy. Short pauses at each full stop.
Record each line as its own take, then drop it in at the start time below. The music and SFX
were mixed with room for a voice (mix ≈ −19 LUFS). Put the VO at about −16 LUFS, or duck the
`music-bed.wav` stem by 4–6 dB under speech.

| # | Start | End | On screen | VO line (≈ words) |
|---|-------|-----|-----------|-------------------|
| 1 | 0:00.4 | 0:04.4 | Dots → star → "Your customers love your store." | "Your customers love your store… but most never leave a review." (11) |
| 2 | 0:05.4 | 0:10.6 | "Asking for reviews is a headache." + friction cards | "Asking is awkward. The links are long. And 'I'll do it later'… never happens." (13) |
| 3 | 0:11.6 | 0:15.8 | Logo reveal + subtitle + business chips | "Meet trustcomm. The easiest way to get Google reviews from your customers." (12) |
| 4a | 0:16.6 | 0:17.6 | "How it works" | "Here's how it works." (4) |
| 4b | 0:17.8 | 0:20.8 | Step 1 · Scan (QR stand + phone scanning) | "Customers scan your trustcomm QR code, right at the counter." (10) |
| 4c | 0:21.1 | 0:24.8 | Step 2 · Rate (stars fill, note types) | "They tap the stars and add a quick note…" (9) |
| 4d | 0:25.1 | 0:29.6 | Step 3 · Post (tap → "Review posted!" → lands on listing) | "…and one tap takes them straight to your Google review. Done, in seconds." (13) |
| 5 | 0:30.8 | 0:36.6 | Owner dashboard: rating 3.9→4.8, reviews 12→249 | "More reviews. A better rating. And more customers finding your store." (11) |
| 6 | 0:37.6 | 0:40.8 | Kinetic: "No chasing. No awkward asks. Just more 5-star reviews." | "No chasing. No awkward asks. Just more five-star reviews." (9) |
| 7 | 0:41.8 | 0:46.4 | Endcard: logo, tagline, CTA | "trustcomm. Google reviews, without the headache. Get started at trustcomm dot app." (12) |

## Full read (copy into your TTS / VO app)

> Your customers love your store… but most never leave a review.
>
> Asking is awkward. The links are long. And "I'll do it later"… never happens.
>
> Meet trustcomm. The easiest way to get Google reviews from your customers.
>
> Here's how it works. Customers scan your trustcomm QR code, right at the counter.
> They tap the stars and add a quick note… and one tap takes them straight to your Google review.
> Done, in seconds.
>
> More reviews. A better rating. And more customers finding your store.
>
> No chasing. No awkward asks. Just more five-star reviews.
>
> trustcomm. Google reviews, without the headache. Get started at trustcomm dot app.

## Pronunciation

- **trustcomm** → "TRUST-comm" (one word, stress on *trust*)
- **trustcomm.app** → "trustcomm dot app"

## Before publishing, check these claims against the real product

The site (trustcomm.app) could not be reached from the build environment, so the flow was
written from the brief ("helps stores easily get Google reviews from customers without any headache").
Confirm or change:

1. **QR at the counter** is how customers start. If trustcomm uses NFC cards, WhatsApp or SMS links, change step 1 in `index.html` (`.st1`, `.stand`) and line 4b.
2. **Rate → note → "Review on Google"** matches the real customer screen.
3. Dashboard numbers (3.9→4.8, 12→249) are **illustrative**. The frame is labelled "Illustrative example"; keep that label unless the numbers are real.
