import { Film, stub } from "./core/film.js";
import b01 from "./beats/b01.js";
import b04 from "./beats/b04.js";
import b05 from "./beats/b05.js";
import b08 from "./beats/b08.js";

const modules = { b01, b04, b05, b08, stub };

window.GDL = {
  ready: (async () => {
    const tl = await (await fetch("../timeline.json")).json();
    await Promise.all([
      document.fonts.load('800 100px "Inter Tight"', "Aa₹"),
      document.fonts.load('500 64px "JetBrains Mono"', "Aa{}"),
    ]);
    const missing = ['800 100px "Inter Tight"', '500 64px "JetBrains Mono"'].filter((f) => !document.fonts.check(f, "Aa"));
    if (missing.length) throw new Error("fonts not loaded: " + missing.join(", "));
    window.GDL.film = new Film(tl, modules, document.getElementById("c"));
    return { frames: tl.frames, fps: tl.fps, built: Object.keys(modules).filter((k) => k !== "stub") };
  })(),
  /** Render frame f; returns PNG data URL + render info. */
  frame(f, opts) {
    const info = this.film.render(f, opts);
    return { png: this.film.canvas.toDataURL("image/png"), info };
  },
  /** Render frame f; returns raw RGBA (base64) for pixel checks. */
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
