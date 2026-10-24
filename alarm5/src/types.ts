import type { CamKey, Punch } from "./camera";
import type { SfxEvent } from "./sfx";

/** what every src/cues/sNN.ts exports. Every frame in it derives from a word (anchors.ts) plus offsets in frames. */
export interface SceneCues {
  cue: Record<string, number>;                                   // named frames (word start +- anticipation)
  sfx: SfxEvent[];                                               // every visual event has a sound
  anchors: { label: string; frame: number; note: string }[];     // a QA still per key word: what the picture should show
  hero: number;                                                  // the frame whose still represents the scene
  cam: CamKey[];                                                 // this scene's keys of the camera track
  punches?: Punch[];                                             // PUNCH moves (max one per scene)
  captionLift?: [number, number][];                              // frame ranges where the captions move up (a fact line / card occupies their place)
  blur?: [number, number][];                                     // extra frame ranges that need motion blur (fast element moves)
}
