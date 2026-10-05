// godevlevel.in reel: imports the launch film's engine (no copies). ?lang=en|hi  &font=Archivo|Inter%20Tight
import { ASSETS, loadImage } from "../../godevlevel-launch/engine/web/core/assets.js";
import { FONT } from "../../godevlevel-launch/engine/web/core/brand.js";
import { Film } from "../../godevlevel-launch/engine/web/core/film.js";
import card from "./card.js";

const q = new URLSearchParams(location.search);
window.REEL_LANG = q.get("lang") ?? "en";
// Display face: Archivo (approved 2026-10-05).
const family = q.get("font") ?? "Archivo";
FONT.display = `"${family}"`;

window.GDL = {
  ready: (async () => {
    const tl = await (await fetch("../timeline.json")).json();
    ASSETS.logo = await loadImage("../../godevlevel-launch/engine/assets/logo-reversed.png");
    await document.fonts.load(`800 100px "${family}"`, "abc");
    if (!document.fonts.check(`800 100px "${family}"`, "abc")) throw new Error("font not loaded: " + family);
    const mods = Object.fromEntries(tl.beats.map((b) => [b.id, card]));
    window.GDL.film = new Film(tl, mods, document.getElementById("c"));
    return { frames: tl.frames, fps: tl.fps, lang: window.REEL_LANG, font: family };
  })(),
  frame(f, opts) {
    const info = this.film.render(f, opts);
    return { png: this.film.canvas.toDataURL("image/png"), info };
  },
  rgba(f, opts) {
    const info = this.film.render(f, opts);
    const c = this.film.canvas;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let s = "";
    for (let i = 0; i < d.length; i += 0x8000) s += String.fromCharCode.apply(null, d.subarray(i, i + 0x8000));
    return { w: c.width, h: c.height, b64: btoa(s), info };
  },
  /** Font size and lines actually used per card (for the size checks). */
  layouts() {
    const ctx = this.film.ctx;
    return this.film.tl.beats.filter((b) => b.kind !== "logo").map((b) => {
      const str = b.kind === "type" ? b.text.en : b.text[window.REEL_LANG];
      return { card: b.card, text: str, ...pick(layoutOf(ctx, str, b.emphasis)) };
    });
  },
  contracts() {
    return this.film.tl.beats.map((b) => this.film.contract(b.id));
  },
};
import { layout as layoutOf } from "./card.js";
const pick = (L) => ({ size: +L.size.toFixed(1), lines: L.lines });
