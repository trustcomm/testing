# GoDevLevel launch — Canva asset log

Every asset comes from the Canva Pro account via the Canva connector. Nothing is exported until the user approves it.

## Brand
| Item | Source | Value | Status |
|---|---|---|---|
| Brand Kit | Canva `list-brand-kits` | none found | missing |
| Orange (accent) | `brand/logo.png`, alpha-weighted pixels of "Dev" | #FD4B25 | approved. Large type (≥48 px), shapes and caret only; never text <48 px (~3.5:1 on charcoal) |
| Charcoal (ground) | `brand/logo.png`, "Go"/"Level" | #323743 | approved |
| Off-white (ink) | user's choice | #F5F3EF | approved. All body and caption text |

## Stills (Canva generate-image, BRIEF 6.2)
| ID | Canva media | Link | Status |
|---|---|---|---|
| I1 | MAHXHzVDMJE | https://www.canva.com/M/MAHXHzVDMJE | approved; exported PNG 1680×944 (1:1 crop) from design DAHXHyyBkx8 page 2. Download pending network allow-list, so `stills/I1.png` is not on disk yet |
| S1 | MAHXHwHKl_c | https://www.canva.com/M/MAHXHwHKl_c | approved; exported PNG 944×1680 (1:1 crop) from design DAHXHyyBkx8 page 3. Download pending network allow-list, so `stills/S1.png` is not on disk yet |
| S2 | MAHXHwYWheQ | https://www.canva.com/M/MAHXHwYWheQ | approved; exported PNG 944×1680 (1:1 crop) from design DAHXHyyBkx8 page 4. Download pending network allow-list, so `stills/S2.png` is not on disk yet |
| S3 (v1) | MAHXHwEbU00 | https://www.canva.com/M/MAHXHwEbU00 | rejected (shopkeeper face in focus, partial sign) |
| S3 option A | MAHXH6W6FJU | https://www.canva.com/M/MAHXH6W6FJU | not chosen |
| S3 option B | MAHXHxXzRss | https://www.canva.com/M/MAHXHxXzRss | approved; exported PNG 944×1680 (1:1 crop) from design DAHXHyyBkx8 page 5 (job d372f052). Download pending network allow-list |
| S4 | MAHXH8uGpCA | https://www.canva.com/M/MAHXH8uGpCA | approved; exported PNG 944×1680 (1:1 crop) from design DAHXHyyBkx8 page 6. Download pending network allow-list, so `stills/S4.png` is not on disk yet |
| S5 (v1) | MAHXH3OTpI8 | https://www.canva.com/M/MAHXH3OTpI8 | rejected (faces in focus) |
| S5 option A | MAHXH_UY_zU | https://www.canva.com/M/MAHXH_UY_zU | approved; exported PNG 944×1680 (1:1 crop) from design DAHXHyyBkx8 page 7. Download pending network allow-list |
| S5 option B | MAHXH5FV3WY | https://www.canva.com/M/MAHXH5FV3WY | not chosen |

## Footage / music
| File | Canva design | Page | Status |
|---|---|---|---|
| footage/H1–H5.mp4 | "GDL Launch — Footage" | 1–5 | design not found in account |
| footage (wide) | "GDL Launch — Footage Wide" | — | design not found in account |
| music/track.wav | "GDL Launch — Music" | 1 | design not found in account |

## Export holder design
"GDL Launch — Stills Export" (DAHXHyyBkx8, https://www.canva.com/d/8rNAVJKuCn80hR0). Page 1 is a blank 1080×1920 page. Pages 2–7 are I1, S1, S2, S3 (option B), S4, S5, each at the image's native size with the image placed 1:1 (no crop, no scaling). Exported as PNG, lossless, pro quality.
Export job 08771bdf (pages 2, 3, 4, 6, 7). Page 5 (S3 option B) exported in job d372f052.

Download status (2026-10-05 07:59 UTC): the proxy refuses CONNECT to export-download.canva.com:443 with `request blocked: no rule or allowlist entry allows host "export-download.canva.com"`.
