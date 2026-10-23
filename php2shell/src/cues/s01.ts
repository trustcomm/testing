import { fw, w } from "../anchors";
import type { SfxEvent } from "../sfx";
import type { SceneCues } from "./types";

// S1 "21 October ki raat. Duniya bhar mein server sambhalne waalon ki neend udd gayi."
const f21 = fw(w("S1", "21")), fOct = fw(w("S1", "october")), fRaat = fw(w("S1", "raat")), fDuniya = fw(w("S1", "duniya")), fMein = fw(w("S1", "mein")),
  fServer = fw(w("S1", "server")), fNeend = fw(w("S1", "neend")), fUdd = fw(w("S1", "udd")), fGayi = fw(w("S1", "gayi"));
const cue = {
  calendarIn: 0,                        // the calendar writes on in the 0.4 s of silence
  f21, scaleEnd: f21 + 16,              // the 21st cell glows red on "21"; its number grows to fill the cell
  morphStart: fDuniya, morphEnd: fMein + 6,   // the calendar dissolves into the dotted globe on "Duniya bhar mein"
  serversStart: fServer, serversEnd: fNeend - 3,   // 36 server icons light up white, one by one, across "server sambhalne waalon ki"
  hit: fUdd,                            // "udd gayi": every server flashes red, a red ring leaves the globe, a 2-frame shake
};
const pings: SfxEvent[] = Array.from({ length: 12 }, (_, k) => ({ id: `s1.ping${k}`, frame: cue.serversStart + 3 * k, sfx: "server_ping", pitch: k * 0.8, gainDb: -20, pan: ((k * 5) % 7) / 3.5 - 1, note: `servers ${3 * k}-${3 * k + 2} light up` }));
const sfx: SfxEvent[] = [
  { id: "s1.drone", frame: 0, sfx: "sub_drone", gainDb: -8, note: "pure black: a low sub drone fades in from silence" },
  { id: "s1.tick21", frame: f21, sfx: "clock_tick", gainDb: -4, note: "the 21st cell glows red" },
  { id: "s1.dissolve", frame: cue.morphStart + 8, sfx: "whoosh", gainDb: -16, note: "the calendar dissolves into the globe" },
  ...pings,
  { id: "s1.swell", frame: cue.hit, sfx: "alarm_swell", gainDb: -6, note: "rising alarm pad: peaks as every server flashes red" },
  { id: "s1.thoom", frame: cue.hit, sfx: "thoom", gainDb: -2, note: "udd gayi: all servers flash red, red pulse ring, 2-frame shake" },
];
const A = (label: string, frame: number, expect: string) => ({ label, frame, expect });
export const cues: SceneCues<typeof cue> = {
  cue, sfx, hero: fUdd + 10,
  anchors: [
    A("21", f21 + 4, "the calendar is on; the 21st cell glows red and its number is growing"), A("October", fOct + 4, "'21' fills its cell, glowing red"), A("raat", fRaat + 4, "held: the red 21 on the calendar"),
    A("Duniya", fDuniya + 5, "the calendar is turning into dust, the dots flying to form a globe"), A("mein", fMein + 2, "the globe is nearly formed"), A("server", fServer + 5, "a rotating dotted globe; the first server icons light white"),
    A("sambhalne", fw(w("S1", "sambhalne")) + 5, "more server icons lit across the globe"), A("neend", fNeend + 3, "all server icons are lit white; tension before the hit"), A("udd", cue.hit + 2, "every server flashes red at once, a red ring leaves the globe, a micro-shake"),
    A("gayi", fGayi + 5, "red servers, the ring expanding (hold)"),
  ],
  pushes: [{ frame: cue.hit - 6, frames: 14, extra: 0.03 }],
  shakes: [cue.hit],
};
