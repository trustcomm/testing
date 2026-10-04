import type { ThemeMode } from "../brand/tokens";

/** A spoken word with times in SCENE-LOCAL seconds (0 = first frame of the scene, lead included). */
export type Word = { text: string; start: number; end: number };

/** Everything a scene component receives. Built by the engine from video.json + timeline. */
export type SceneProps<D> = {
  id: string;
  data: D;
  /** Narration text (script words) — used for captions and anchors. */
  narration: string;
  /** Caption text (Roman Hinglish). Defaults to narration. */
  captions: string;
  /** Word timings for `captions` words, scene-local seconds. Same length as caption words. */
  words: Word[];
  /** Resolved anchors: name → scene-local frame(s) on which that element must appear. */
  anchors: Record<string, number[]>;
  theme: ThemeMode;
  /** Theme of the previous scene (the wipe starts from its background). */
  prevTheme: ThemeMode;
  wipeIn: boolean;
  showCaptions: boolean;
  channelName: string;
  /** Voice span in scene-local seconds (first word start → last word end). */
  voiceStart: number;
  voiceEnd: number;
};
