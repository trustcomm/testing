import { fw, w } from "../anchors";
import type { SfxEvent } from "../sfx";
import { cues as c11 } from "./s11";
import type { SceneCues } from "./types";

// S12 "Aur dhyan rakhna... sirf plugin update karne se yeh theek nahi hota. PHP khud update karna padega."
const W = (b: string, n = 0) => w("S12", b, n);
const fPlugin = fw(W("plugin")), fUpdate = fw(W("update")), fKarne = fw(W("karne")), fTheek = fw(W("theek")), fNahi = fw(W("nahi")), fHota = fw(W("hota")),
  fPhp = fw(W("php")), fKhud = fw(W("khud")), fUpdate2 = fw(W("update", 1)), fPadega = fw(W("padega"));

const cue = {
  // the S11 panel is held until here (see s11.ts: exitStart = "plugin" + 4, exitEnd = +11)
  panelExit: c11.cue.exitStart,
  leftCard: fUpdate,                    // "plugin update": the left card ("Plugin update") lands on "update"; its puzzle piece writes on
  rightCard: fKarne,                    // "karne": the right card ("PHP update + server restart") arrives, still without its verdict
  xRing: fTheek,                        // "theek": the red ring pops in the left card's verdict slot
  xHit: fNahi,                          // "nahi": the red X lands (bonk)
  checkHit: fPhp,                       // "PHP": the green check lands (ding) and the restart arrow spins once
  spinEnd: fPhp + 22,
  scaleUp: fKhud,                       // "khud": the right card scales up to 1.08, the left dims
  update2: fUpdate2,                    // "update": the green underline wipes under "PHP update"
};

const sfx: SfxEvent[] = [
  { id: "s12.cardL", frame: cue.leftCard, sfx: "glass_tap", gainDb: -9, pan: -0.4, note: "the left card ('Plugin update') lands on 'update'" },
  { id: "s12.cardR", frame: cue.rightCard, sfx: "glass_tap", gainDb: -11, pan: 0.4, pitch: 3, note: "the right card ('PHP update + server restart') lands" },
  { id: "s12.bonk", frame: cue.xHit, sfx: "bonk_neg", gainDb: -4, pan: -0.4, note: "'nahi': the red X lands on the plugin card" },
  { id: "s12.ding", frame: cue.checkHit, sfx: "ding_pos", gainDb: -6, pan: 0.4, note: "'PHP': the green check lands on the PHP card" },
  { id: "s12.spin", frame: cue.checkHit, sfx: "spin_whoosh", gainDb: -10, pan: 0.3, note: "the restart arrow spins once" },
  { id: "s12.scale", frame: cue.scaleUp, sfx: "pop", gainDb: -14, pan: 0.3, pitch: -2, note: "'khud': the PHP card scales up to 1.08 and the plugin card dims" },
];

const A = (label: string, frame: number, expect: string) => ({ label, frame, expect });
export const cues: SceneCues<typeof cue> = {
  cue, sfx, hero: fPadega + 4,
  anchors: [
    A("aur", fw(W("aur")) + 4, "the S11 panel is still there, full and still (hold)"),
    A("rakhna", fw(W("rakhna")) + 4, "hold: the panel and the question, unchanged"),
    A("plugin", fPlugin + 4, "hold: the panel is still fully visible, nothing has left yet"),
    A("update", fUpdate + 4, "the panel is blurring out; the left 'Plugin update' card lands with a puzzle piece"),
    A("karne", fKarne + 4, "the left card with its piece; the right card 'PHP update + server restart' arrives"),
    A("theek", fTheek + 4, "both cards are in, neutral; a red ring pops in the left card's verdict slot"),
    A("nahi", fNahi + 3, "the red X has landed on the Plugin update card"),
    A("hota", fHota + 4, "red X holds on the left card; the right card waits"),
    A("PHP", fPhp + 5, "the green check lands on the right card, the restart arrow is spinning"),
    A("khud", fKhud + 4, "the right card scales up (1.08), the left card dims"),
    A("update", fUpdate2 + 5, "the green underline wipes under 'PHP update'"),
    A("padega", fPadega + 6, "hold: right card big and green, left card dim with its red X"),
  ],
  pushes: [{ frame: fKhud - 6, frames: 26, extra: 0.015 }],
};
