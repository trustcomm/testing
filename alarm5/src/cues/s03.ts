// S3 "Number paanch": arrive at the bank with a spring settle, the 5 assembles from particles and shrinks into the HUD, the bank writes on, the AI agent robot walks to the door,
// the glass gate slides shut on "login? Mana.", the coin bounces off the second barrier on "Bilkul mana" (PUNCH), the big ? with three figures pointing at each other.
import { fw, w } from "../anchors";
import type { SceneCues } from "../types";
import type { SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S3", b, n));
export const cue = {
  numeral: S("paanch"),                                       // the 5 is whole on "paanch"
  bank: S("america") - 4, banksPill: S("banks"), agentsPill: S("agents"),
  walkStart: S("customers") + 4, walkEnd: S("brake"), brake: S("brake"),
  fact: S("laga"),
  login: S("login") - 24, gateShut: S("mana", 0), loginX: S("mana", 0) + 4,
  coin: S("bhejna") - 6, coinHit: S("mana", 1) - 22, bilkul: S("bilkul"), transferX: S("mana", 1) - 8,
  dimStart: S("toh") - 6, quest: S("zimmedaar") - 10, kaun: S("kaun"),
  figs: S("zimmedaar"), questOut: fw(w("S4", "seekh")) - 6,
};
const steps: SfxEvent[] = Array.from({ length: 9 }, (_, i) => ({ id: `s3.step${i}`, frame: cue.walkStart + 6 + i * 11, sfx: "robot_step" as const, gainDb: -13, pan: -0.55 + i * 0.05, pitch: (i % 3) - 1, seed: i, note: "the robot's tiny footstep, panned with its x" }));
export const sfx: SfxEvent[] = [
  { id: "s3.number", frame: cue.numeral, sfx: "number_reveal", gainDb: 0, note: "the 5 assembles: reverse riser, sub hit, metallic tick" },
  { id: "s3.bank", frame: cue.bank + 10, sfx: "card_slide", gainDb: -10, pan: 0, note: "the bank outline writes on" },
  { id: "s3.banks", frame: cue.banksPill, sfx: "tink", gainDb: -7, pitch: 2, pan: -0.1, note: "US BANKS label pops" },
  ...steps,
  { id: "s3.agents", frame: cue.agentsPill, sfx: "tink", gainDb: -7, pitch: 6, pan: -0.45, note: "AI AGENT label pops" },
  { id: "s3.brake", frame: cue.brake, sfx: "brake_squeal", gainDb: -9, pan: -0.15, note: "brake laga diya: the robot brakes in front of the door" },
  { id: "s3.slide", frame: cue.gateShut - 14, sfx: "card_slide", gainDb: -9, pan: 0.3, note: "the glass gate slides in" },
  { id: "s3.thunk", frame: cue.gateShut, sfx: "glass_thunk", gainDb: -2, pan: 0.05, note: "Mana.: the heavy glass gate shuts" },
  { id: "s3.denied1", frame: cue.loginX, sfx: "buzzer_blip", gainDb: -6, pan: 0.05, note: "red x LOGIN" },
  { id: "s3.coinroll", frame: cue.coin, sfx: "robot_step", gainDb: -12, pan: 0.2, pitch: 6, note: "the coin starts to roll out" },
  { id: "s3.coin", frame: cue.coinHit, sfx: "coin_bounce", gainDb: -8, pan: 0.55, note: "the coin bounces off the second barrier" },
  { id: "s3.punch", frame: cue.coinHit, sfx: "punch_hit", gainDb: -10, pan: 0.3, note: "Bilkul mana: PUNCH" },
  { id: "s3.denied2", frame: cue.transferX, sfx: "buzzer_blip", gainDb: -6, pan: 0.4, pitch: -2, note: "red x TRANSFER" },
  { id: "s3.quest", frame: cue.kaun, sfx: "quiz_pluck", gainDb: -4, pan: 0, note: "kaun?: the quizzical rising pluck, the big ? lands" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.kaun + 20,
  anchors: [
    { label: "paanch", frame: cue.numeral + 6, note: "the big 5 whole at screen centre (it shrinks into the HUD next)" },
    { label: "banks", frame: cue.banksPill + 8, note: "the bank outline with the US BANKS label" },
    { label: "agents", frame: cue.agentsPill + 8, note: "the robot walking toward the door, AI AGENT label" },
    { label: "login mana", frame: cue.gateShut + 10, note: "glass gate shut with the red x LOGIN" },
    { label: "bilkul mana", frame: cue.coinHit + 14, note: "the coin bounced off the barrier, red x TRANSFER (PUNCH)" },
    { label: "kaun", frame: cue.kaun + 8, note: "the big ? and three figures pointing at each other" },
  ],
  cam: [],
  punches: [{ f: cue.coinHit, amount: 0.22, id: "s3.bilkul" }],
};
