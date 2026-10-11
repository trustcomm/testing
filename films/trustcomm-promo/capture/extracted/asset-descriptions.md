# Asset inventory (no-capture path, client-supplied material)

The live site could not be captured (network policy blocks trustcomm.app; see ../CAPTURE-BLOCKED.md). These assets
were supplied with the client's launch-film project and are the canonical inventory.

| File | What it is | Use |
|---|---|---|
| assets/trustcomm-logo.jpg | Trustcomm wordmark, raster (2000×667): "trust" in ink #111216, "comm" in blue, heavy rounded geometric sans, white ground | End-card logo reference; rebuild as live type matched to it (no SVG supplied) |
| assets/demo-1-rate-and-mention.jpg | Real /r/demo screen 1: food + service star rows ("Excellent"), mention chips (How long it took ticked), "What did you have?" chips (Filter Coffee ticked), blue Continue button | Phone screen for the rating + mentions beats (rebuild in vector from it) |
| assets/demo-2-where-should-your-words-go.jpg | Real screen 2: "Where should your words go?" with two equal option cards (Straight to the owner / On Google) | The free-choice beat (F7) |
| assets/demo-3-message-to-owner.jpg | Real screen 3: "Your message to Meera's Tiffin Room" panel, text box, Send to owner | Private-note path |
| assets/demo-4-google-draft.jpg | Real screen 4: "Here's a draft" with the demo draft text, Copy my words | Google-post path |
| assets/demo-5-thank-you.jpg | Real screen 5: tick badge, "Thank you — That's it — you're done." | Optional end of the flow |

Fonts (OFL, in project assets/fonts/): Poppins 600/700/800 (film type), Inter 500/600/700 (phone UI), Noto Sans
Devanagari / Kannada / Tamil / Telugu 600 (language burst).

| File | What it is | Use |
|---|---|---|
| assets/qr-trustcomm.js | The real QR code for https://trustcomm.app as data: `window.QR_TRUSTCOMM` = 25 strings of 25 chars, "1" = dark module (error correction M, no quiet zone). Generated with the `qrcode` npm package | Draw the counter QR module-by-module (rounded squares) so the modules can animate; leave a 4-module light margin so it really scans |
