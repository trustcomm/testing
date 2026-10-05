// Trustcomm hero film: imports OUR engine from films/godevlevel-launch/engine (no copies, no other motion library).
// All 16 beats (Stage 4 animatic, draft quality). Timeline: ../beats.json (audio-first, scripts/beats.py).
// The camera is static; beats that push or swing do it inside their own module.
import { ASSETS, loadImage } from "../../godevlevel-launch/engine/web/core/assets.js";
import { matches } from "../../godevlevel-launch/engine/web/core/carry.js";
import { Film, stub } from "../../godevlevel-launch/engine/web/core/film.js";
import beat01 from "./beat01.js";
import beat02 from "./beat02.js";
import beat03 from "./beat03.js";
import beat04 from "./beat04.js";
import beat05 from "./beat05.js";
import beat06 from "./beat06.js";
import beat07 from "./beat07.js";
import beat08 from "./beat08.js";
import beat09 from "./beat09.js";
import beat10 from "./beat10.js";
import beat11 from "./beat11.js";
import beat12 from "./beat12.js";
import beat13 from "./beat13.js";
import beat14 from "./beat14.js";
import beat15 from "./beat15.js";
import beat16 from "./beat16.js";
import { DRAWN } from "./ui.js";

const LIST = [beat01, beat02, beat03, beat04, beat05, beat06, beat07, beat08, beat09, beat10, beat11, beat12, beat13, beat14, beat15, beat16];
const MODS = Object.fromEntries(LIST.map((m, i) => [`b${String(i + 1).padStart(2, "0")}`, m]));
const lang = new URLSearchParams(location.search).get("lang") === "hi" ? "hi" : "en";

window.GDL = {
  ready: (async () => {
    const bj = await (await fetch(lang === "hi" ? "../beats_hi.json" : "../beats.json")).json();
    for (const w of [500, 600, 700, 800]) await document.fonts.load(`${w} 40px "Poppins"`, "Aa");
    for (const w of [400, 500, 600, 700]) await document.fonts.load(`${w} 40px "Inter"`, "Aa");
    await document.fonts.load(`500 40px "Inter"`, "₹");
    for (const [f, sample] of [["Noto Sans Devanagari", "खाना"], ["Noto Sans Kannada", "ಊಟ"], ["Noto Sans Tamil", "சாப்பாடு"], ["Noto Sans Telugu", "భోజనం"]]) {
      await document.fonts.load(`600 40px "${f}"`, sample);
      if (!document.fonts.check(`600 40px "${f}"`, sample)) throw new Error("font not loaded: " + f);
    }
    for (const f of ["Poppins", "Inter"]) if (!document.fonts.check(`600 40px "${f}"`, "Aa")) throw new Error("font not loaded: " + f);
    // PLACEHOLDER logo until the client's SVG arrives
    ASSETS.logo = await loadImage("../client/logo-from-chat.jpg");
    const beats = bj.beats.map((b) => ({ ...b, id: `b${String(b.beat).padStart(2, "0")}`, handoffIn: null, handoffOut: null }));
    const c0 = { x: 960, y: 540, z: 1 };
    const tl = { fps: bj.fps, width: 1920, height: 1080, beat: bj.beat, frames: bj.frames, beats, camera: [{ t: 0, ...c0 }, { t: bj.frames / bj.fps, ...c0 }] };
    const film = new Film(tl, { ...MODS, stub }, document.getElementById("c"));
    // Contracts: each boundary's carry is what the outgoing beat ends on; the incoming beat must start on it.
    beats.forEach((b, i) => {
      if (i > 0) b.handoffIn = MODS[beats[i - 1].id].carry(film.env(beats[i - 1]).dur, film.env(beats[i - 1]));
      if (i < beats.length - 1) b.handoffOut = MODS[beats[i + 1].id].carry(0, film.env(beats[i + 1]));
    });
    window.GDL.film = film;
    return { fps: bj.fps, frames: bj.frames, lang, built: Object.keys(MODS) };
  })(),
  /** Per-beat info for the render/check scripts. */
  beats() {
    const f = this.film;
    return f.tl.beats.map((b) => {
      const m = MODS[b.id], e = f.env(b);
      return {
        id: b.id, beat: b.beat, startFrame: b.startFrame, endFrame: b.endFrame, vo: b.vo, voTake: b.voTake, voIn: b.voIn, voOut: b.voOut, voFits: b.voFits,
        events: m.events ? m.events(e) : [], cuts: m.cuts ? m.cuts(e) : [], stills: m.stills ?? [],
        contract: f.contract(b.id), carryIn: m.carry(0, e), carryOut: m.carry(e.dur, e),
      };
    });
  },
  beat(id) {
    return this.beats().find((b) => b.id === id);
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
  state10(lt) {
    return beat10.state(lt);
  },
  drawn: () => [...DRAWN],
  matches,
};
