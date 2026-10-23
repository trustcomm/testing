import { fw, fwEnd, w } from "../anchors";
import type { SfxEvent } from "../sfx";
import type { SceneCues } from "./types";

// S11 "Toh aaj hi apne hosting wale se ek sawaal pucho: 'Kya PHP update ho gaya?' Naye versions screen pe hain."
const W = (b: string, n = 0) => w("S11", b, n);
const fAaj = fw(W("aaj")), fHosting = fw(W("hosting")), fEk = fw(W("ek")), fSawaal = fw(W("sawaal")), fPucho = fw(W("pucho")),
  fNaye = fw(W("naye")), fVersions = fw(W("versions")), fScreen = fw(W("screen")), fHain = fw(W("hain"));
const fPlugin = fw(w("S12", "plugin")), fUpdate12 = fw(w("S12", "update"));

// ---- the question types itself in step with the spoken words: the first letter of every word lands ON the word, the rest follow inside it ----
export const QUESTION = "Kya PHP update ho gaya?";
const spoken: [string, ReturnType<typeof W>][] = [["Kya", W("kya")], ["PHP", W("php")], ["update", W("update")], ["ho", W("ho")], ["gaya?", W("gaya")]];
/** the frame each character of QUESTION appears on (strictly increasing) */
export const TYPE_FRAMES: number[] = (() => {
  const out: number[] = [];
  spoken.forEach(([word, wd], k) => {
    const s = fw(wd), span = Math.max(word.length - 1, fwEnd(wd) - 2 - s);
    if (k > 0) out.push(Math.max(out[out.length - 1] + 1, s - 2));           // the space before the word
    for (let j = 0; j < word.length; j++) out.push(Math.max(j === 0 ? s : out[out.length - 1] + 1, s + Math.round((j * span) / word.length)));
  });
  return out;
})();
const typedEnd = TYPE_FRAMES[TYPE_FRAMES.length - 1];

const cue = {
  kicker: fAaj,                         // "AAJ HI" pill pops on "aaj"
  header: fHosting,                     // the host's avatar writes on, its name rises on "hosting"
  bubble: fEk - 2,                      // the bubble outline writes on across "ek sawaal"
  caret: fPucho,                        // the caret starts blinking in the empty bubble on "pucho:"
  typeStart: TYPE_FRAMES[0], typeEnd: typedEnd,
  sent: typedEnd + 1,                   // the message is sent right after the last character ("gaya?")
  panelIn: fNaye - 10,                  // the glass panel slides up, arriving on "Naye"
  tick1: fNaye, tick2: fNaye + 4, tick3: fNaye + 8, tick4: fNaye + 12,   // the four version lines tick in
  shutter: fScreen,                     // "screen": the shutter click, a soft flash on the panel's edge
  holdStart: fNaye + 12 + 6,            // everything on the panel is at rest from here (last tick + 6 frames)
  exitStart: fPlugin + 4,               // the panel + chat leave (blur + fade 7 frames) just before S12's cards land on "plugin update"
  exitEnd: fPlugin + 11,
};
/** the hold: the whole panel fully visible and still for at least 75 frames (2.5 s) */
export const HOLD_FRAMES = cue.exitStart - cue.holdStart;

const keys: SfxEvent[] = TYPE_FRAMES.map((frame, i) => {
  const space = QUESTION[i] === " ";
  return { id: `s11.key${i}`, frame, sfx: "type_click", gainDb: space ? -22 : -17, pitch: space ? -3 : ((i * 7) % 5) - 2, seed: i + 3, note: `types "${QUESTION[i]}"` };
});
const ticks: SfxEvent[] = [cue.tick1, cue.tick2, cue.tick3, cue.tick4].map((frame, i) => ({ id: `s11.tick${i + 1}`, frame, sfx: "tick_asc", pitch: [0, 2, 4, 7][i], gainDb: -7, note: `line ${i + 1} ticks in with its green check` }));
const sfx: SfxEvent[] = [
  { id: "s11.bubble", frame: fEk, sfx: "ui_click", gainDb: -16, note: "the chat bubble appears (it writes on across 'ek sawaal')" },
  ...keys,
  { id: "s11.sent", frame: cue.sent, sfx: "send_whoosh", gainDb: -9, note: "the message is sent; the panel starts to slide up" },
  ...ticks,
  { id: "s11.shutter", frame: cue.shutter, sfx: "shutter", gainDb: -8, note: "the hold starts: screenshot cue, a soft flash runs round the panel's edge" },
];

const A = (label: string, frame: number, expect: string) => ({ label, frame, expect });
export const cues: SceneCues<typeof cue> = {
  cue, sfx, hero: cue.holdStart + 20,
  anchors: [
    A("aaj", fAaj + 4, "black: a green 'AAJ HI' pill has just popped in at the top left"),
    A("hosting", fHosting + 4, "the host's avatar ring and the name 'Hosting support' (the word 'Hosting' pops)"),
    A("sawaal", fSawaal + 4, "the empty chat bubble is writing on, left-aligned"),
    A("pucho", fPucho + 4, "the empty bubble with a blinking caret, waiting"),
    A("kya", TYPE_FRAMES[2] + 2, "'Kya' is typed in the bubble"),
    A("php", fw(W("php")) + 5, "'Kya PHP' typed"),
    A("update", fw(W("update")) + 6, "'Kya PHP update' typed"),
    A("gaya", fw(W("gaya")) + 5, "the whole question 'Kya PHP update ho gaya?' is typed"),
    A("naye", fNaye + 2, "message sent (double check); the glass panel has risen, line 1 'PHP 8.5.12+' is ticking in"),
    A("versions", fVersions + 4, "all four lines are in (8.5.12+, 8.4.27+, 8.3.36+, 8.2.35+) with green checks"),
    A("screen", fScreen + 3, "the shutter: the panel is complete, its edge flashes; the grey 'PHP 8.1 or older → upgrade required' line is there"),
    A("hain", fHain + 4, "hold: the full panel, still"),
    A("hold end", cue.exitStart - 2, "still the full panel, last frame of the 2.5 s hold (this is already S12: 'plugin')"),
  ],
  pushes: [{ frame: cue.panelIn, frames: 36, extra: 0.02 }],
};
