import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import "../../brand/fonts";
import { progress, tween, tweenColor } from "../../brand/motion";
import { resolveCues, type Word } from "../../brand/timing";
import { colors, colX, durations, span, KEY_NUMBER_MIN_HOLD } from "../../brand/tokens";
import {
  BigBar,
  EndCard,
  Label,
  NumberCounter,
  ReasonCard,
  SafeAudio,
  SaffronWipe,
  ThemeFlip,
  TimelineRuler,
  VerdictWord,
  WIPE_COVERED,
  WIPE_FRAMES,
  Wordmark,
} from "../../components";
import { byjusCueSpecs } from "./cues";

export type ByjusDemoProps = {
  /** Files present in public/ (filled by calculateMetadata). */
  available: string[];
  /** Word timestamps from public/vo-timestamps.json, or null. */
  words: Word[] | null;
  channelName: string;
};

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];
const VALUATION_B = 22;

export const ByjusDemo: React.FC<ByjusDemoProps> = ({ available, words, channelName }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const c = useMemo(() => resolveCues(byjusCueSpecs, words, fps), [words, fps]);

  // derived act boundaries
  const wipe1 = c.verdict - WIPE_COVERED - 44; // wipe finishes revealing the ink act before the word
  const inkStart = wipe1 + WIPE_COVERED;
  const wipe2 = c.endLine - WIPE_COVERED; // covered exactly as "Poori kahani" starts
  const paperEnd = wipe2 + WIPE_COVERED;
  const s12Out = c.reasons - durations.fast; // S1/S2 clear just before S3

  // S1 → S2 values
  const countEnd = c.counterUp + durations.slow;
  const barValue =
    frame < c.collapse
      ? tween(frame, c.counterUp, 0, VALUATION_B, "slow")
      : tween(frame, c.collapse, VALUATION_B, 0, "slow");
  const dataColor = tweenColor(frame, c.crimson, colors.ink, colors.crimson, "fast");
  const s12Opacity = 1 - progress(frame, s12Out, "fast");

  // ReasonCard dimming as the next reason is spoken
  const dim1 = progress(frame, c.card2, "fast");
  const dim2 = progress(frame, c.card3, "fast");

  // counter tick SFX: one tick every 3 frames while a counter runs
  const ticks = (start: number) => Array.from({ length: durations.slow / 3 }, (_, i) => start + i * 3);

  return (
    <AbsoluteFill>
      {/* ---------------- ACT 1–2 (paper): S1 rise, S2 collapse, S3 reasons ---------------- */}
      <Sequence durationInFrames={inkStart} name="Paper act">
        <ThemeFlip mode="paper">
          <AbsoluteFill style={{ opacity: s12Opacity }}>
            {/* S1 timeline */}
            <Sequence from={0} durationInFrames={c.reasons} name="S1 ruler">
              <div style={{ position: "absolute", left: colX(0), top: 110 }}>
                <TimelineRuler years={YEARS} activeYear={2022} />
              </div>
            </Sequence>
            <Sequence from={c.wordmark} durationInFrames={c.reasons - c.wordmark} name="S1 wordmark">
              <div style={{ position: "absolute", left: colX(0), top: 330 }}>
                <Wordmark text="BYJU'S" tense="past" />
              </div>
            </Sequence>
            <Sequence from={c.label} durationInFrames={c.reasons - c.label} name="S1 label">
              <div style={{ position: "absolute", left: colX(0), top: 480 }}>
                <Label text="India's most valuable startup" color={frame >= c.crimson ? colors.stone : undefined} />
              </div>
            </Sequence>
            {/* counter: rise (S1) then fall (S2) */}
            <Sequence from={c.counterUp} durationInFrames={c.collapse - c.counterUp} name="S1 counter">
              <div style={{ position: "absolute", left: colX(0), top: 580 }}>
                <NumberCounter from={0} to={VALUATION_B} prefix="$" suffix="B" color={dataColor} />
              </div>
            </Sequence>
            <Sequence from={c.collapse} durationInFrames={c.reasons - c.collapse} name="S2 counter">
              <div style={{ position: "absolute", left: colX(0), top: 580 }}>
                <NumberCounter from={VALUATION_B} to={0} prefix="$" suffix="B" value="~$0" color={colors.crimson} />
              </div>
            </Sequence>
            <Sequence from={c.counterUp} durationInFrames={c.reasons - c.counterUp} name="S1–S2 bar">
              <div style={{ position: "absolute", left: colX(8) + (span(4) - 300) / 2, top: 330 }}>
                <BigBar value={barValue} maxValue={VALUATION_B} color={dataColor} />
              </div>
            </Sequence>
          </AbsoluteFill>

          {/* S3 reasons */}
          {[
            { at: c.card1, index: 1, title: "Costly acquisitions", icon: "blocks" as const, dim: dim1 },
            { at: c.card2, index: 2, title: "Growth at any cost", icon: "steepArrow" as const, dim: dim2 },
            { at: c.card3, index: 3, title: "$1.2B loan", icon: "weight" as const, dim: 0, drop: true, iconText: "$1.2B" },
          ].map((r, i) => (
            <Sequence key={r.index} from={r.at} durationInFrames={inkStart - r.at} name={`S3 reason ${r.index}`}>
              <div style={{ position: "absolute", left: colX(i * 4), top: 320 }}>
                <ReasonCard
                  index={r.index}
                  title={r.title}
                  icon={r.icon}
                  iconText={r.iconText}
                  iconEntrance={r.drop ? "drop" : "fade"}
                  dim={r.dim}
                />
              </div>
            </Sequence>
          ))}
        </ThemeFlip>
      </Sequence>

      {/* ---------------- ACT 3 (ink): S4 verdict ---------------- */}
      <Sequence from={inkStart} durationInFrames={paperEnd - inkStart} name="Ink act">
        <ThemeFlip mode="ink">
          <div style={{ position: "absolute", left: colX(0), top: 110 }}>
            <TimelineRuler years={YEARS} activeYear={2024} />
          </div>
          <Sequence from={c.verdict - inkStart} name="S4 verdict">
            <VerdictWord text="INSOLVENCY" />
          </Sequence>
        </ThemeFlip>
      </Sequence>

      {/* ---------------- ACT 4 (paper): S5 end card ---------------- */}
      <Sequence from={paperEnd} name="End act">
        <ThemeFlip mode="paper">
          <EndCard line="Poori kahani — frame by frame" channelName={channelName} />
        </ThemeFlip>
      </Sequence>

      {/* signature transitions */}
      <Sequence from={wipe1} durationInFrames={WIPE_FRAMES} name="Wipe → ink">
        <SaffronWipe />
      </Sequence>
      <Sequence from={wipe2} durationInFrames={WIPE_FRAMES} name="Wipe → paper">
        <SaffronWipe />
      </Sequence>

      {/* ---------------- audio slots (missing files are skipped) ---------------- */}
      <SafeAudio src="vo.mp3" available={available} />
      <SafeAudio src="music.mp3" available={available} volume={0.08} durationInFrames={durationInFrames} />
      {[...ticks(c.counterUp), ...ticks(c.collapse)].map((t) => (
        <SafeAudio key={`tick-${t}`} src="sfx/tick.mp3" available={available} from={t} durationInFrames={9} volume={0.35} />
      ))}
      <SafeAudio src="sfx/swipe.mp3" available={available} from={wipe1} volume={0.6} />
      <SafeAudio src="sfx/swipe.mp3" available={available} from={wipe2} volume={0.6} />
      <SafeAudio src="sfx/hit.mp3" available={available} from={c.verdict} volume={0.7} />
      <SafeAudio src="sfx/logo.mp3" available={available} from={paperEnd} volume={0.6} />

      {/* dev guard: key numbers must hold ≥ 60 frames */}
      {process.env.NODE_ENV === "development" &&
      (c.collapse - countEnd < KEY_NUMBER_MIN_HOLD || c.reasons - (c.collapse + durations.slow) < KEY_NUMBER_MIN_HOLD) ? (
        <div style={{ position: "absolute", left: 20, bottom: 20, color: colors.crimson, fontSize: 24 }}>
          ⚠ key number held &lt; {KEY_NUMBER_MIN_HOLD}f
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
