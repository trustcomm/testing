// Trustcomm hero film: imports OUR engine from films/godevlevel-launch/engine (no copies, no other motion library).
// Built so far (Stage 3 style frames): Beat 6 and Beat 10. Timeline from ../beats.json (audio-first, scripts/beats.py).
import { Film, stub } from "../../godevlevel-launch/engine/web/core/film.js";
import beat06 from "./beat06.js";
import beat10 from "./beat10.js";
import { DRAWN } from "./ui.js";

const MODS = { b06: beat06, b10: beat10 };

window.GDL = {
  ready: (async () => {
    const bj = await (await fetch("../beats.json")).json();
    for (const w of [500, 600, 700, 800]) await document.fonts.load(`${w} 40px "Poppins"`, "Aa");
    if (!document.fonts.check(`700 40px "Poppins"`, "Aa")) throw new Error("font not loaded: Poppins");
    const beats = bj.beats.map((b) => ({ ...b, id: `b${String(b.beat).padStart(2, "0")}`, handoffIn: null, handoffOut: null }));
    const at = (n) => beats.find((b) => b.beat === n);
    const c0 = { x: 960, y: 540, z: 1 };
    const b6 = at(6), b10 = at(10);
    const tl = {
      fps: bj.fps, width: 1920, height: 1080, beat: bj.beat, frames: bj.frames, beats,
      camera: [
        { t: 0, ...c0 },
        { t: b6.startFrame / bj.fps + beat06.T.push, ...c0 },
        { t: b6.endFrame / bj.fps, x: 1170, y: 548, z: 1.18 },
        { t: b10.startFrame / bj.fps, ...c0 },
        { t: bj.frames / bj.fps, ...c0 },
      ],
    };
    const film = new Film(tl, { ...MODS, stub }, document.getElementById("c"));
    // Contracts: each built beat declares its own carry in/out (the neighbours, once built, must match them).
    for (const [id, m] of Object.entries(MODS)) {
      const b = beats.find((x) => x.id === id), e = film.env(b);
      b.handoffIn = m.carry(0, e);
      b.handoffOut = m.carry(e.dur, e);
    }
    window.GDL.film = film;
    return { fps: bj.fps, frames: bj.frames, built: Object.keys(MODS) };
  })(),
  beat(id) {
    const b = this.film.tl.beats.find((x) => x.id === id);
    return { id, startFrame: b.startFrame, endFrame: b.endFrame, vo: b.vo, voTake: b.voTake, events: MODS[id].events(), contract: this.film.contract(id) };
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
};
