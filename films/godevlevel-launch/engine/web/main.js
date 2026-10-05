import { ASSETS, loadImage } from "./core/assets.js";
import { FONT } from "./core/brand.js";
import { Film, stub } from "./core/film.js";
import b01 from "./beats/b01.js";
import b02 from "./beats/b02.js";
import b03 from "./beats/b03.js";
import b04 from "./beats/b04.js";
import b05 from "./beats/b05.js";
import b06 from "./beats/b06.js";
import b07 from "./beats/b07.js";
import b08 from "./beats/b08.js";
import b09 from "./beats/b09.js";
import b10 from "./beats/b10.js";
import b11 from "./beats/b11.js";

const modules = { b01, b02, b03, b04, b05, b06, b07, b08, b09, b10, b11, stub };

window.GDL = {
  ready: (async () => {
    const tl = await (await fetch("../timeline.json")).json();
    ASSETS.logo = await loadImage("../assets/logo-reversed.png");
    ASSETS.logoMeta = await (await fetch("../assets/logo-reversed.json")).json();
    await Promise.all([
      document.fonts.load('800 100px "Inter Tight"', "Aa₹"),
      document.fonts.load('800 100px "Archivo"', "Aa₹"),
      document.fonts.load('500 64px "JetBrains Mono"', "Aa{}₹"),
    ]);
    const faces = ['800 100px "Inter Tight"', '800 100px "Archivo"', '500 64px "JetBrains Mono"'];
    const missing = faces.filter((f) => !document.fonts.check(f, "Aa"));
    if (missing.length) throw new Error("fonts not loaded: " + missing.join(", "));
    window.GDL.film = new Film(tl, modules, document.getElementById("c"));
    return { frames: tl.frames, fps: tl.fps, built: Object.keys(modules).filter((k) => k !== "stub") };
  })(),
  /** Switch the display face ("Inter Tight" | "Archivo"). */
  setDisplay(family) {
    FONT.display = `"${family}"`;
  },
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
  contracts() {
    return this.film.tl.beats.map((b) => this.film.contract(b.id));
  },
  camera(t) {
    return this.film.cam(t);
  },
};
