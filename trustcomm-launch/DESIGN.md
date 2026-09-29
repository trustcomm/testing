# trustcomm: design reference

## Style prompt
A friendly, optimistic, Google-product-launch look: soft off-white canvas, blurred blue and
amber colour fields, white rounded cards with soft blue-tinted shadows, and bold geometric
headlines. Motion is springy and physical (back/elastic eases, staggered word entrances), and
scenes change through colour iris wipes and slide panels.

## Colours
| Role | Hex |
|------|-----|
| Canvas | `#f5f7fc` |
| Ink (logo "trust") | `#14171f` |
| Brand blue (logo "comm") | `#1150fc` |
| Blue tint / soft | `#9fb8ff` / `#e5ecff` |
| Star / highlight | `#ffb400` |
| Success | `#12a15f` |
| Problem accent | `#e5484d` |
| Muted text | `#5b6275` |

Only the four-dot motif uses red, amber and green together (a playful nod to launch-video
colour, not Google's logo).

## Typography
- **Outfit** 600–700: headlines. Geometric, matches the rounded logo lettering.
- **Inter** 400–600: body and UI.
- **JetBrains Mono**: the long review URL.
All three are bundled in `assets/fonts/`, so renders are deterministic.

## Logo
`assets/trustcomm-logo.png` is cut out from the supplied JPG. `logo-trust.png` and `logo-comm.png`
are split at the colour boundary so each half can animate separately.

## What not to do
- No Google logo or Google trademarks beyond the plain word "Google".
- No invented stats presented as real (dashboard is labelled "Illustrative example").
- No dark scenes, neon or gradient text. Keep it light and airy.
- No hard cuts. Every scene change is a wipe.
