// All four props side by side on the card background, at 1.3x: qa/props_sheet.png.
import { mkdir, writeFile } from "node:fs/promises";
import { start } from "./harness.mjs";

const { open, browser, close } = await start();
try {
  await open();                                                 // serves the modules and waits for the fonts
  const page = await browser.newPage();
  await page.goto("http://localhost:8080/index.html?render");
  await page.waitForFunction("window.READY === true");
  const url = await page.evaluate(async () => {
    const props = await import("/engine/props.js"), { drawBackground } = await import("/engine/layout.js"), { grain } = await import("/engine/draw.js");
    const c = document.createElement("canvas"); c.width = 1920; c.height = 540;
    const g = c.getContext("2d"), t = 4;
    drawBackground(g, t);
    [props.laptop, props.chatBubble, props.chartCard, props.folder].forEach((p, i) => p(g, t, { x: 270 + i * 460, y: 230, s: 1.3, seed: i + 1 }));
    grain(g, t);
    return c.toDataURL("image/png");
  });
  await mkdir("qa", { recursive: true });
  await writeFile("qa/props_sheet.png", Buffer.from(url.split(",")[1], "base64"));
  console.log("wrote qa/props_sheet.png");
} finally { await close(); }
