import { fw, w } from "../anchors";
import type { SfxEvent } from "../sfx";
import type { SceneCues } from "./types";

// S7 "PHP server bhi kuch aisa hi karta hai. Har request ek tiffin hai. Aur yeh bug, pichhli request ka bacha hua data... agle ke haath mein de sakta hai. Password. Token. API keys."
const f = (bare: string, nth = 0) => fw(w("S7", bare, nth));
const fPhp = f("php"), fServer = f("server"), fRequest = f("request", 0), fTiffin = f("tiffin"), fBug = f("bug"), fBacha = f("bacha"), fHua = f("hua"), fData = f("data"),
  fAgle = f("agle"), fHaath = f("haath"), fPassword = f("password"), fToken = f("token"), fApi = f("api"), fKeys = f("keys");
const fMein6 = fw(w("S6", "mein")), fS8 = fw(w("S8", "aur"));

const cue = {
  personDust: fMein6 + 8, personDustFrames: 14,    // S6's person and key dissolve to dust (11 frames of stillness after the hit)
  pullBackStart: fPhp - 10, pullBackEnd: fServer + 2,   // "PHP server": the camera pulls back to the wide shot
  morphStart: fServer - 4, morphEnd: fServer + 26,      // "server": the houses grow into the six racks (match cut), the camera settles on the hall
  figureDust: fServer + 3, figureDustFrames: 24,        // the dabbawala and the ground line dissolve to dust
  interior: fServer + 12,                               // the racks' slots, LEDs and vents write on, bottom to top
  flatStart: fServer + 26, flatEnd: fServer + 60,       // the dotted arcs (the dabbawala's path) flatten into the request line above the racks
  convert: fRequest,                                    // "request": the tiffins turn into request envelopes (and the first pill)
  pill1: fRequest, kwTiffin: fTiffin,                   // "TIFFIN -> REQUEST": REQUEST pops on "request", TIFFIN on "tiffin"
  pill2: fBacha, kwHua: fHua, kwData: fData,            // "BACHA HUA DATA -> MEMORY", each word as it is said
  leftover: fBacha,                                     // red leftover bits appear inside rack 2's memory slot
  leak: fAgle,                                          // "agle": the bits rise out of the rack into the request envelope above it
  leave: fAgle + 6, arrive: fPassword - 4,              // the envelope leaves rack 2 carrying a faint red trail, travels along the request line to the middle
  chip1: fPassword, chip2: fToken, chip3: fApi,         // PASSWORD, TOKEN, API KEY burst out of it, each on its word
  fadeOut: fKeys - 3, fadeFrames: 12,                   // everything but the six racks dissolves (blur + fade), done well before S8's layer
};

const sfx: SfxEvent[] = [
  { id: "s7.hum1", frame: fPhp + 4, sfx: "data_hum", gainDb: -19, note: "the data-flow hum begins under the match cut" },
  { id: "s7.hum2", frame: fPhp + 4 + 112, sfx: "data_hum", gainDb: -20, note: "the hum continues" },
  { id: "s7.hum3", frame: fPhp + 4 + 224, sfx: "data_hum", gainDb: -20, frames: 96, note: "the hum under the leak and the chips (cut before S8)" },
  { id: "s7.grow", frame: fServer + 12, sfx: "layer_sweep", gainDb: -10, note: "server: the houses grow into server racks (peak as they stand)" },
  { id: "s7.swipe1", frame: cue.pill1, sfx: "swipe", gainDb: -11, pan: 0, note: "pill TIFFIN -> REQUEST (the tiffins become envelopes)" },
  { id: "s7.swipe2", frame: cue.pill2, sfx: "swipe", gainDb: -11, pan: 0, note: "pill BACHA HUA DATA -> MEMORY (red bits appear in rack 2)" },
  { id: "s7.leak", frame: cue.leak, sfx: "tick", gainDb: -16, pan: -0.4, pitch: 6, note: "agle: the red bits lift out of rack 2" },
  { id: "s7.send", frame: cue.leave, sfx: "whoosh", gainDb: -20, pan: -0.2, note: "the envelope leaves the server along the request line" },
  { id: "s7.tsk1", frame: cue.chip1, sfx: "glitch_tsk", gainDb: -5, pitch: 0, seed: 1, pan: -0.45, note: "PASSWORD bursts out of the envelope (glitch flicker)" },
  { id: "s7.tsk2", frame: cue.chip2, sfx: "glitch_tsk", gainDb: -5, pitch: 4, seed: 2, pan: 0, note: "TOKEN bursts out (glitch flicker)" },
  { id: "s7.tsk3", frame: cue.chip3, sfx: "glitch_tsk", gainDb: -5, pitch: -3, seed: 3, pan: 0.45, note: "API KEY bursts out (glitch flicker)" },
];
const A = (label: string, frame: number, expect: string) => ({ label, frame, expect });
export const cues: SceneCues<typeof cue> = {
  cue, sfx, hero: fPassword + 14,
  anchors: [
    A("php", fPhp + 4, "the camera is pulling back from the person with the key (dissolving to dust) towards the wide shot of the six houses"),
    A("server", fServer + 5, "match cut: the houses are growing into server racks, the dabbawala dissolving into dust"),
    A("bhi", f("bhi") + 4, "six racks standing, interior lines writing on; the dotted arcs above them starting to flatten"),
    A("karta", f("karta") + 4, "six server racks with a request line above them, tiffins on the line"),
    A("request", fRequest + 4, "the tiffins turn into request envelopes; the pill TIFFIN -> REQUEST has sprung in below the racks"),
    A("tiffin", fTiffin + 4, "TIFFIN pops inside the pill; envelopes flow along the request line"),
    A("bug", fBug + 4, "held: racks, request line with envelopes, one pill (stillness)"),
    A("bacha", fBacha + 4, "the second pill BACHA HUA DATA -> MEMORY springs in; red bits appear inside rack 2"),
    A("data", fData + 4, "DATA pops with a red underline; the red leftover bits sit in rack 2's memory"),
    A("agle", fAgle + 5, "the red bits lift out of rack 2 into the envelope above it"),
    A("haath", fHaath + 4, "the envelope leaves rack 2 along the request line with a faint red trail"),
    A("sakta", f("sakta") + 4, "the envelope with its red trail is nearly at the middle of the line"),
    A("password", fPassword + 4, "the red chip PASSWORD bursts out of the envelope with a glitch flicker"),
    A("token", fToken + 4, "TOKEN bursts out; PASSWORD sits at the left"),
    A("api", fApi + 4, "API KEY bursts out: three red chips in a fan above the envelope"),
    A("keys", fKeys + 2, "everything is dissolving; the six racks stay"),
    A("end", fS8 - 6, "ONLY the six white racks at HALL.xs, still (the boundary contract with S8)"),
  ],
  pushes: [{ frame: fPassword - 6, frames: 14, extra: 0.03 }],
};
