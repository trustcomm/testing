// The mix. Voice at full volume. The sound effects are synthesised (scripts/make_sfx.py) and normalised to -1 dBFS, then
// set so that their peak sits 18 dB under the voice's peak: voice peak measured -4.2 dBFS (ffmpeg volumedetect) ->
// effects peak at -22.2 dBFS. A whoosh on every wipe, a tick on every counter step (times: cues.ts).
import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { tickTimes, whooshTimes } from "./cues";
import { FPS } from "./theme";
import { frameOf } from "./timing";

export const VOICE_PEAK_DB = -4.2, SFX_PEAK_DB = -1, UNDER_VOICE_DB = 18;
export const SFX_VOLUME = 10 ** ((VOICE_PEAK_DB - UNDER_VOICE_DB - SFX_PEAK_DB) / 20);   // 0.087

export const Mix: React.FC = () => (
  <>
    <Audio src={staticFile("vo.mp3")} />
    {whooshTimes.map((t, i) => (
      <Sequence key={`w${i}`} from={Math.max(0, frameOf(t) - 3)} durationInFrames={Math.ceil(0.6 * FPS)}><Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_VOLUME} /></Sequence>
    ))}
    {tickTimes.map((t, i) => (
      <Sequence key={`t${i}`} from={frameOf(t)} durationInFrames={3}><Audio src={staticFile("sfx/tick.wav")} volume={SFX_VOLUME} /></Sequence>
    ))}
  </>
);
