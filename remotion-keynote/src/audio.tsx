// The mix. The voiceover at full volume; the sound effects are synthesised (scripts/make_sfx.py) and normalised to -1 dBFS, then
// set so their peak sits 18 dB under the voice's peak (measured -7.2 dBFS -> effects peak -25.2 dBFS). A soft UI tick on every
// calculator key, an odometer ratchet while the counters roll, a low whoosh on the transitions. Nothing at all during scene 4.
import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { CUE, KEYS, SCENES, sceneEnd, sceneStart } from "./cues";
import { FPS } from "./theme";
import { frameOf } from "./anchors";

export const VOICE_PEAK_DB = -7.2, SFX_PEAK_DB = -1, UNDER_VOICE_DB = 18;
export const SFX_VOLUME = 10 ** ((VOICE_PEAK_DB - UNDER_VOICE_DB - SFX_PEAK_DB) / 20);

const ratchet = (a: number, b: number) => { const n = Math.max(3, Math.round((b - a) / 0.045)); return Array.from({ length: n }, (_, k) => a + (b - a) * (1 - (1 - k / n) ** 1.6)); };
export const keyTimes = KEYS.map((k) => k.t);
export const odometerTimes = [...ratchet(CUE.s1.total[0], CUE.s1.total[1]), ...ratchet(CUE.s2.price[0], CUE.s2.price[1])];
// whooshes on the transitions that are not scene 4: invoice slide, calculator in, grid morph, terminal in, back to light, CTA
export const whooshTimes = [CUE.s2.slide, CUE.s3.calculator, CUE.s3.grid, sceneStart(4), sceneStart(5), sceneStart(6)];
export const silentFrom = sceneStart(3), silentTo = sceneStart(4);   // scene 4: silence
const quiet = (t: number) => t >= silentFrom && t < silentTo;
void SCENES; void sceneEnd;

export const Mix: React.FC = () => (
  <>
    <Audio src={staticFile("vo.mp3")} />
    {whooshTimes.filter((t) => !quiet(t)).map((t, i) => <Sequence key={`w${i}`} from={frameOf(t)} durationInFrames={Math.ceil(0.7 * FPS)}><Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_VOLUME} /></Sequence>)}
    {keyTimes.map((t, i) => <Sequence key={`k${i}`} from={frameOf(t)} durationInFrames={4}><Audio src={staticFile("sfx/key.wav")} volume={SFX_VOLUME} /></Sequence>)}
    {odometerTimes.map((t, i) => <Sequence key={`o${i}`} from={frameOf(t)} durationInFrames={3}><Audio src={staticFile("sfx/tick.wav")} volume={SFX_VOLUME * 0.8} /></Sequence>)}
  </>
);
