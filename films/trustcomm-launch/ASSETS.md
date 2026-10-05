# Trustcomm launch: asset log

Every generation is logged here: voice, model, settings, prompt and result. Nothing marked NOT FOR DELIVERY may enter a client render.

## Credit ledger (cap for this film: 15,000 credits)
| Batch | What | Priced before run | Billed (connector) | Running total |
|---|---|---|---|---|
| 1 | VO4 ×3 (English) | 45 | 45 | 45 |
| 2 | VO1–VO3, VO5 ×3 | 369 | 369 | 414 |
| 3 | VO6–VO9 ×3 | 552 | 552 | 966 |
| 4 | VO10–VO13 ×3 | 324 | 324 | 1,290 |
| 5 | VO14–VO16 ×3 | 426 | 426 | 1,716 |
| 6 | SFX01–SFX12 ×2 | 1,200 (estimate, 50/variant) | 400 (16.67/variant) | **2,116** |
| — | Music, one 60 s generation | 1,500 (estimate) | not run: waiting for the user's OK | 2,116 |

Estimates (`estimate_only`) cost nothing. The workspace balance is not exposed by the connector; at 34,611 credits before this work the expected balance is about 32,495.

## Voiceover (paid ElevenLabs, 2026-10-05)
- **Voice:** "Ishan – Bold and Upbeat" (N09NFwYJJG9VSSgdLQbT).
- **Model:** eleven_multilingual_v2.
- **Flow:** xKmgwytAWVRGt81PkL3u ("Trustcomm launch — VO (paid)"). Workspace 5fabf1efae0842b2ba608bbae195fb2f, the user's paid Starter plan.
- **Settings:** the connector exposes **no** stability, similarity, style or speaker-boost controls, so ElevenLabs defaults were used. The brief's 35 / 75 / 30 / boost settings were **not** applied.
- **Prompt:** each line's exact BRIEF §5 English text. 3 takes per line. Credits are per take (1 credit per character).
- **Status:** all 48 takes sit in `vo/takes/`. **Nothing has been moved to `vo/`**: the pre-picks (◀) await the user's listening review.

Measurements come from `scripts/vo_takes.py` and are also in `vo/takes/takes.json`:
- **Speech:** the span with leading and trailing silence (below −40 dB) trimmed. WPM is measured over that span.
- **Fits slot:** speech ≤ the BRIEF §4 beat length − 0.3 s.
- **Pre-pick:** among takes that fit, the lowest |WPM − 160| / 10, plus penalties for a true peak above −1 dBTP or an internal pause longer than 0.6 s.

| File | Line text (prompt) | Generation ID | Credits | Length s | Speech s | WPM | LUFS | TP dBTP | Fits slot | Pre-pick |
|---|---|---|---|---|---|---|---|---|---|---|
| vo/takes/VO1_t1.mp3 | Your happiest customers? | Jg2cvZtXUVi1WhlYe5r1 | 24 | 1.8 | 1.44 | 125 | -27.5 | -10.4 | yes | ◀ |
| vo/takes/VO1_t2.mp3 | Your happiest customers? | Q8EvqcDH55adWXy7XsQG | 24 | 1.8 | 1.48 | 121 | -27.7 | -9.2 | yes |  |
| vo/takes/VO1_t3.mp3 | Your happiest customers? | Dpx4SV2FfgzqfTpTEcJW | 24 | 1.91 | 1.54 | 117 | -28.0 | -11.5 | yes |  |
| vo/takes/VO2_t1.mp3 | They pay, they smile… and they leave. | iGpkdsxsxrzssB0Pmf0X | 37 | 2.4 | 2.05 | 205 | -28.0 | -10.4 | yes |  |
| vo/takes/VO2_t2.mp3 | They pay, they smile… and they leave. | 7YrgM3uFtvCnZhli3Np7 | 37 | 2.22 | 1.74 | 242 | -27.0 | -11.1 | yes |  |
| vo/takes/VO2_t3.mp3 | They pay, they smile… and they leave. | HVNQbS6CRGuKvWwsXYO0 | 37 | 2.51 | 2.06 | 203 | -27.0 | -9.5 | yes | ◀ |
| vo/takes/VO3_t1.mp3 | The loudest one writes the review. | FpWBN2N6xJ5fJTYwVxaR | 34 | 2.12 | 1.74 | 207 | -27.6 | -11.8 | yes |  |
| vo/takes/VO3_t2.mp3 | The loudest one writes the review. | JltTjFP8mfxiLF8OQyRL | 34 | 2.32 | 1.91 | 189 | -28.6 | -10.3 | yes | ◀ |
| vo/takes/VO3_t3.mp3 | The loudest one writes the review. | EeXnMOMB49Z2YDZJYFVo | 34 | 2.17 | 1.78 | 202 | -27.1 | -10.7 | yes |  |
| vo/takes/VO4_t1.mp3 | Meet Trustcomm. | O78z0tSqCtGNTXb5pku7 | 15 | 1.33 | 0.95 | 126 | -28.2 | -11.5 | yes | ◀ |
| vo/takes/VO4_t2.mp3 | Meet Trustcomm. | 1V7PWTbq3abhjXFbsYik | 15 | 1.38 | 1.01 | 119 | -28.7 | -11.6 | yes |  |
| vo/takes/VO4_t3.mp3 | Meet Trustcomm. | g4EzY9mnRAeXrgJJBbYt | 15 | 1.67 | 1.25 | 96 | -28.7 | -12.4 | yes |  |
| vo/takes/VO5_t1.mp3 | One QR code on your counter. | clmW0EeRvYvMZeJI6mf3 | 28 | 2.17 | 1.96 | 184 | -27.3 | -10.1 | yes |  |
| vo/takes/VO5_t2.mp3 | One QR code on your counter. | dY2Za7j8caddZhEQc5uz | 28 | 2.17 | 1.77 | 203 | -27.2 | -10.3 | yes |  |
| vo/takes/VO5_t3.mp3 | One QR code on your counter. | 8q5xVAsMH6M3CjabBHMg | 28 | 2.22 | 2.06 | 175 | -27.1 | -9.9 | yes | ◀ |
| vo/takes/VO6_t1.mp3 | Customers scan. No app. No sign-in. | OV1w8lQMTdPN7MMiPHAe | 35 | 2.77 | 2.39 | 151 | -28.0 | -10.5 | yes | ◀ |
| vo/takes/VO6_t2.mp3 | Customers scan. No app. No sign-in. | dkdrfwzPZe7pe5ERP8wt | 35 | 3.06 | 2.7 | 133 | -28.3 | -10.4 | yes |  |
| vo/takes/VO6_t3.mp3 | Customers scan. No app. No sign-in. | C5I0I9JM42qaLvnv8eQ2 | 35 | 2.64 | 2.48 | 145 | -28.1 | -10.4 | yes |  |
| vo/takes/VO7_t1.mp3 | They rate their visit… | 0e3avF9Q7xzU1rOsILdX | 22 | 1.57 | 1.09 | 220 | -26.0 | -12.4 | yes |  |
| vo/takes/VO7_t2.mp3 | They rate their visit… | A36mUDxPX6hmKuhhX1LA | 22 | 1.44 | 1.12 | 214 | -26.9 | -11.9 | yes |  |
| vo/takes/VO7_t3.mp3 | They rate their visit… | C4Z4qvAz3xKnPnmxRESp | 22 | 1.52 | 1.18 | 204 | -27.0 | -12.0 | yes | ◀ |
| vo/takes/VO8_t1.mp3 | …in their own language. English. Hinglish. Hindi. Kannada. Tamil. Telugu. | LXf9szGDpwsayHUpNZSJ | 73 | 5.09 | 4.75 | 126 | -27.2 | -7.9 | **no** (slot 3.9 s) | ◀ |
| vo/takes/VO8_t2.mp3 | …in their own language. English. Hinglish. Hindi. Kannada. Tamil. Telugu. | fmMbrmDPSDV8FxJdGIlw | 73 | 6.53 | 5.96 | 101 | -27.4 | -10.1 | **no** (slot 3.9 s) |  |
| vo/takes/VO8_t3.mp3 | …in their own language. English. Hinglish. Hindi. Kannada. Tamil. Telugu. | 6jcvNRppQMtDoemtmkl1 | 73 | 6.58 | 6.25 | 96 | -27.6 | -9.3 | **no** (slot 3.9 s) |  |
| vo/takes/VO9_t1.mp3 | They pick what to mention. Nothing is ticked for them. | 0pYcbICdnIGIDHXEQCTM | 54 | 3.24 | 2.87 | 209 | -26.4 | -7.3 | yes |  |
| vo/takes/VO9_t2.mp3 | They pick what to mention. Nothing is ticked for them. | 5dJdqjiCPYmaknDcBy0X | 54 | 3.37 | 3.03 | 198 | -28.2 | -9.9 | yes |  |
| vo/takes/VO9_t3.mp3 | They pick what to mention. Nothing is ticked for them. | qPS9Z007Hl2OkXYhigsr | 54 | 3.42 | 3.04 | 197 | -28.0 | -8.9 | yes | ◀ |
| vo/takes/VO10_t1.mp3 | Then they choose. | UwICIiHk0QZnbFGeNXBs | 17 | 1.28 | 0.98 | 184 | -27.4 | -11.4 | yes |  |
| vo/takes/VO10_t2.mp3 | Then they choose. | pIKd326R7lPFlvw4OTrh | 17 | 1.52 | 1.15 | 156 | -27.6 | -10.4 | yes | ◀ |
| vo/takes/VO10_t3.mp3 | Then they choose. | 5j4cg8Maifh1zM6GtgYn | 17 | 1.2 | 0.84 | 214 | -27.5 | -9.5 | yes |  |
| vo/takes/VO11_t1.mp3 | Post on Google, in their own name… | uEQfA7GNR9icZtL1CWxP | 34 | 2.27 | 1.92 | 219 | -26.6 | -10.8 | yes |  |
| vo/takes/VO11_t2.mp3 | Post on Google, in their own name… | xrE39vmRnUgekl9bazKl | 34 | 2.35 | 1.99 | 211 | -28.0 | -12.1 | yes | ◀ |
| vo/takes/VO11_t3.mp3 | Post on Google, in their own name… | r2SDcUnIJcMk97w1LQxa | 34 | 2.35 | 1.96 | 215 | -27.8 | -11.2 | yes |  |
| vo/takes/VO12_t1.mp3 | …or tell you privately. | efn6GjTV6ptdGPjCCx42 | 23 | 2.51 | 2.13 | 113 | -27.3 | -10.2 | yes |  |
| vo/takes/VO12_t2.mp3 | …or tell you privately. | WVPYgjSEXqQEnlSva1Xu | 23 | 2.27 | 1.88 | 128 | -28.1 | -10.4 | yes | ◀ |
| vo/takes/VO12_t3.mp3 | …or tell you privately. | F6D5rAHEOTah00kkEfBK | 23 | 2.87 | 2.48 | 97 | -27.3 | -8.9 | yes |  |
| vo/takes/VO13_t1.mp3 | Real reviews, from real customers. | A2VmFaKEth7oxrcTJ2dd | 34 | 2.82 | 2.51 | 120 | -26.9 | -10.6 | yes |  |
| vo/takes/VO13_t2.mp3 | Real reviews, from real customers. | 5Zwf1UDn3WA8BRNU8dGN | 34 | 2.69 | 2.34 | 128 | -26.9 | -11.3 | yes |  |
| vo/takes/VO13_t3.mp3 | Real reviews, from real customers. | 7UdcZyiRJ0xL8Jj0GwfL | 34 | 2.53 | 2.17 | 138 | -27.5 | -9.9 | yes | ◀ |
| vo/takes/VO14_t1.mp3 | Hear from more of your customers. Not just the loudest ones. | jkiqa1peKnOtq9al1M3E | 60 | 3.76 | 3.4 | 194 | -27.1 | -9.8 | yes |  |
| vo/takes/VO14_t2.mp3 | Hear from more of your customers. Not just the loudest ones. | VF4VjclemaQbwCseaGDR | 60 | 3.71 | 3.44 | 192 | -27.1 | -9.8 | yes | ◀ |
| vo/takes/VO14_t3.mp3 | Hear from more of your customers. Not just the loudest ones. | Rih3HEoVZCVzlRRCiZC0 | 60 | 3.94 | 3.54 | 187 | -26.6 | -8.9 | **no** (slot 3.8 s) |  |
| vo/takes/VO15_t1.mp3 | Fourteen days free. No card needed. | B9d8onF3l63PyYBC70At | 35 | 2.77 | 2.31 | 156 | -27.1 | -10.6 | yes | ◀ |
| vo/takes/VO15_t2.mp3 | Fourteen days free. No card needed. | 0QzkduDTrrsc8fG9SS1c | 35 | 2.77 | 2.52 | 143 | -27.2 | -10.9 | yes |  |
| vo/takes/VO15_t3.mp3 | Fourteen days free. No card needed. | AW4d2kg6CViFKGG2xtEA | 35 | 2.32 | 2.13 | 169 | -26.8 | -12.0 | yes |  |
| vo/takes/VO16_t1.mp3 | Trustcomm. Now across India. trustcomm dot app. | ashf3hZaae9ZO6lzYQqY | 47 | 4.31 | 3.82 | 110 | -28.0 | -10.8 | yes |  |
| vo/takes/VO16_t2.mp3 | Trustcomm. Now across India. trustcomm dot app. | 5IYP2nYYIoZV0zKoTUtm | 47 | 4.44 | 4.06 | 104 | -27.9 | -9.3 | yes |  |
| vo/takes/VO16_t3.mp3 | Trustcomm. Now across India. trustcomm dot app. | X0nKDylsan8v3V41lzGH | 47 | 3.58 | 3.06 | 137 | -28.6 | -10.4 | yes | ◀ |

Removed: three free-tier test takes of VO1 (2026-10-05). They were deleted at the user's instruction and never committed.

## SFX (paid ElevenLabs, 2026-10-05)
- **Model:** eleven_text_to_sound_v2, prompt influence 0.3, loop off (connector defaults). Same flow.
- **Prompts:** exactly BRIEF §6. 2 variants each, in `sfx/takes/`.
- **Duration:** the connector has no duration control, so the model picks its own length (1–5 s). The lengths written in the prompts were not honoured:
  - SFX10: 1 s against 2.5 s.
  - SFX11: 3 s and 1 s against 6 s.
- Peaks near or over 0 dBFS are normalised in the mix (SFX below VO; master −14 LUFS / −1 dBTP).

| File | Prompt | Generation ID | Credits | Length s | Peak dBFS | Note |
|---|---|---|---|---|---|---|
| sfx/takes/SFX01_v1.mp3 | Short bright UI tap, soft plastic click, clean | tgHnaSnhA5cLDyXyXnIy | 16.67 | 1.04 | -40.2 | near-silent: unusable |
| sfx/takes/SFX01_v2.mp3 | Short bright UI tap, soft plastic click, clean | kYJvQTLxhJzQ2ZF2ZOdB | 16.67 | 1.04 | -0.5 | near full scale: normalise in mix |
| sfx/takes/SFX02_v1.mp3 | Phone camera scan lock, quick rising beep with soft focus click | GpG4Tqk8VVLvZ65NxVQZ | 16.67 | 3.03 | -5.9 |  |
| sfx/takes/SFX02_v2.mp3 | Phone camera scan lock, quick rising beep with soft focus click | CMvSgalcL9jpHu74L8Y1 | 16.67 | 1.04 | -2.4 |  |
| sfx/takes/SFX03_v1.mp3 | Punchy rubber stamp hit on paper, tight and dry | a7bbzTfOZ4dVsX6yrYIj | 16.67 | 1.04 | 0.5 | near full scale: normalise in mix |
| sfx/takes/SFX03_v2.mp3 | Punchy rubber stamp hit on paper, tight and dry | EHuIGnJvWt4YCpYQ2oQA | 16.67 | 3.03 | -2.4 |  |
| sfx/takes/SFX04_v1.mp3 | Fast airy whoosh, left to right, 0.4 s | 3T1VDzEID3vocEysD6Ku | 16.67 | 2.04 | -1.9 |  |
| sfx/takes/SFX04_v2.mp3 | Fast airy whoosh, left to right, 0.4 s | 4QAkxvTYzELXkFcToW0A | 16.67 | 1.04 | 0.8 | near full scale: normalise in mix |
| sfx/takes/SFX05_v1.mp3 | Small receipt printer zip, short | IxJmvZAoNMmFg16e0kBy | 16.67 | 2.04 | -11.7 |  |
| sfx/takes/SFX05_v2.mp3 | Small receipt printer zip, short | J2ZFid7BU8YOkU5IqVVo | 16.67 | 1.04 | -10.8 |  |
| sfx/takes/SFX06_v1.mp3 | Shop door bell chime, single, warm | UXFhVKuylQK2dDqyPmnD | 16.67 | 1.04 | -5.6 |  |
| sfx/takes/SFX06_v2.mp3 | Shop door bell chime, single, warm | me6J3lj0TDt8ZqfZ6QJ0 | 16.67 | 1.04 | -6.2 |  |
| sfx/takes/SFX07_v1.mp3 | Short pop, rising pitch, playful, 0.15 s | kqFYnxuC0kIZZnALlNRo | 16.67 | 2.04 | -0.3 | near full scale: normalise in mix |
| sfx/takes/SFX07_v2.mp3 | Short pop, rising pitch, playful, 0.15 s | YcOSBursZ7P719pLMW1R | 16.67 | 1.04 | -0.8 | near full scale: normalise in mix |
| sfx/takes/SFX08_v1.mp3 | Gentle phone notification ping, warm and soft | VmsCgQTCZAKqC7Ylkp4D | 16.67 | 2.04 | 0.5 | near full scale: normalise in mix |
| sfx/takes/SFX08_v2.mp3 | Gentle phone notification ping, warm and soft | 2SBWnm6MHPItFi0T0W7O | 16.67 | 2.04 | -0.4 | near full scale: normalise in mix |
| sfx/takes/SFX09_v1.mp3 | Cinematic riser into a deep punchy impact, 1.5 s | A5457TOobu1Y7SHRUKOf | 16.67 | 5.04 | 1.7 | near full scale: normalise in mix |
| sfx/takes/SFX09_v2.mp3 | Cinematic riser into a deep punchy impact, 1.5 s | 48SKiVZ91mOP2gRzKyDP | 16.67 | 4.05 | 1.8 | near full scale: normalise in mix |
| sfx/takes/SFX10_v1.mp3 | Big final impact with sparkling shimmer tail, 2.5 s | EJzzT9cs3ECpr9RusfcU | 16.67 | 1.04 | -0.5 | near full scale: normalise in mix |
| sfx/takes/SFX10_v2.mp3 | Big final impact with sparkling shimmer tail, 2.5 s | 85UnwvXoS12JIUkpN0Js | 16.67 | 1.04 | 0.5 | near full scale: normalise in mix |
| sfx/takes/SFX11_v1.mp3 | Indian café ambience, cutlery, light chatter, 6 s, loopable | EycUPixknfyZVPB417Jk | 16.67 | 3.03 | -11.8 | shorter than the 6 s asked for |
| sfx/takes/SFX11_v2.mp3 | Indian café ambience, cutlery, light chatter, 6 s, loopable | 199XRk99ZiNqSqXXw2L7 | 16.67 | 1.04 | -20.3 | shorter than the 6 s asked for |
| sfx/takes/SFX12_v1.mp3 | Paper folding quickly, crisp | 7N3olh0WoQL7I3WkUb2n | 16.67 | 1.04 | -12.9 |  |
| sfx/takes/SFX12_v2.mp3 | Paper folding quickly, crisp | GnaPLrocs7CaFZl0EqTO | 16.67 | 1.04 | -7.6 |  |

**Fallbacks:** code-synthesised SFX01–SFX12 are in `sfx/synth/SFXnn_synth.wav`.
- Made by `scripts/synth_sfx.py`: numpy only, deterministic (seed 20261005), 48 kHz / 24-bit, peak −3 dBFS.
- SFX11 is a 5.5 s stereo loop.
- No third-party or free-tier audio is involved.

## Music
**Not generated.**
- ElevenLabs music (eleven_music_v1 / v2 / v2_5) is available in this workspace, and one 60 s generation from the BRIEF §6 prompt is priced at 1,500 credits.
- The commercial terms could not be verified from here:
  - elevenlabs.io is blocked by the network policy.
  - The connector exposes no plan or terms information.
  - The licence screenshot is not in `client/`.
- Waiting for the user's OK, or for a licensed track + LICENSE in `music/`.

## Stock (Canva, optional)
None yet.

## Client brand
| File | Source | Notes |
|---|---|---|
| client/logo-from-chat.jpg | image pasted in chat by the user, 2026-10-05 | 2000×667 JPG: "trust" dark, "comm" blue on white. Measured (median of pixels, JPG): blue #0E50FC, dark #141723. Awaiting the SVG or official hex values and approval before use. |
