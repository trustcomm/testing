# Title cards: code-rendered video (Canvas2D → headless Chrome → ffmpeg)

Silent 1920×1080 / 30 fps title-card video. Every frame is drawn by `window.renderFrame(t)`,
which uses only `t` and the constants in `tokens.js`, so the same input always produces the same pixels.

```sh
npm install puppeteer                 # or PUPPETEER_SKIP_DOWNLOAD=1 + CHROME_PATH=/path/to/chrome
npm run stills                        # one PNG per card → stills/card_N.png
npm run render                        # all frames → frames/f%05d.png
npm run encode                        # → out/title_cards.mp4
```

Edit `LINES` (text + which word gets the accent), `COLORS`, sizes and pacing in `tokens.js`.
Card timing: fade in + 40 px rise over 0.5 s, hold max(1.2, 0.35 + words/3.2) s, fade out 0.25 s.
Lines wider than the 144 px margin shrink to fit. `LEAD_IN`, `GAP` and `TAIL` set the total
length (15.9 s with the defaults).
