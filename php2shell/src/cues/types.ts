import type { SfxEvent } from "../sfx";
/** what every scene's cue module (src/cues/sNN.ts) exports */
export interface SceneCues<C extends object = Record<string, number>> {
  /** every named frame the scene's picture and sound hang on (all derived from words: fw(w("S3","das")) ...) */
  cue: C;
  /** the sound events of the scene, on the frames of their visual hits */
  sfx: SfxEvent[];
  /** stills for the QA: one per anchor word (label, frame, what the picture should show) */
  anchors: { label: string; frame: number; expect: string }[];
  /** the frame whose still represents the scene (everything formed) */
  hero: number;
  /** deliberate camera push-ins on emotional beats: { frame, frames (length of the push), extra (added scale, e.g. 0.03) } */
  pushes?: { frame: number; frames: number; extra: number }[];
  /** 2-frame micro-shakes (ONLY the 3 alarm hits) */
  shakes?: number[];
}
