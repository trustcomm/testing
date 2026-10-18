import React from "react";
import { C, FONT, FPS } from "../theme";
import { CUE, DATA, SPEED_X } from "../cues";
import { At, Enter, clamp01, easeInOutCubic, easeOutCubic, lerp, rand, smooth, useSpring } from "../motion";
import { useT } from "../clock";
import { Glass } from "../components/glass";
import { Odometer } from "../components/bits";
import { Check } from "./icons";
import { HEAD } from "./text";

const ROW = { w: 880, h: 250 }, REC = { w: 440, h: 600 }, CHIP = { w: 400, h: 88 }, BIG = { w: 760, h: 230 };
const ROW_Y = { c: 760, g: 1060 }, REC_AT = { c: { x: 290, y: 900 }, g: { x: 790, y: 900 } }, APART_AT = { c: { x: 250, y: 1110 }, g: { x: 830, y: 1110 } }, APART_S = 0.52;
const PROMPT_Y = { big: 820, chip: 450 };

export const fmtTime = (s: number) => {
  s = Math.round(s);
  if (s >= 3600) return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};
const money = (cents: number) => cents;

const Barcode: React.FC<{ seed: number }> = ({ seed }) => (
  <div style={{ display: "flex", gap: 3, height: 44, alignItems: "stretch" }}>
    {Array.from({ length: 34 }, (_, i) => <div key={i} style={{ width: 2 + Math.floor(rand(i, seed) * 4), background: "rgba(0,0,0,0.78)" }} />)}
  </div>
);

/**
 * Scenes 1-3 are one stage. S1: the prompt card, then the two tracks (rows). S2: the rows morph into two receipts and their
 * odometers roll. S3: the receipts slide apart while "26×" and "~7×" build in.
 */
export const Stage123: React.FC = () => {
  const t = useT(), c1 = CUE.s1, c2 = CUE.s2, c3 = CUE.s3;
  const shrink = Math.min(1, useSpring(c1.promptOut)), morph = Math.min(1, useSpring(c2.morph)), apart = Math.min(1, useSpring(c3.apart));
  const mm = clamp01(morph), aa = clamp01(apart);

  // --- the two tracks ---
  const [t0, tSnap] = [c1.fill[0], c1.snap], tLand = c1.land;
  const gBase = 0.88 * Math.pow(clamp01((t - t0) / (tSnap - t0)), 0.85);
  const snapP = easeOutCubic(clamp01((t - tSnap) / (6 / FPS)));
  const gBar = t < tSnap ? gBase : lerp(0.88, 1, snapP);
  const gSec = DATA.gemini.seconds * Math.min(1, gBar);
  const cCrawl = 0.42 * clamp01((t - t0) / (tSnap - t0)) + 0.012 * Math.sin(t * 9) * (t > t0 && t < tSnap ? 1 : 0);
  const cBar = t < tSnap ? Math.max(0, cCrawl) : lerp(0.42, 1, easeInOutCubic(clamp01((t - tSnap) / (tLand - tSnap))));
  const cSec = DATA.claude.seconds * (1 - Math.pow(1 - clamp01((t - t0) / (tLand - t0)), 2.2));
  const cLanded = t >= tLand, gDone = t >= tSnap;
  const pop = (since: number) => 1 + 0.12 * Math.exp(-Math.max(0, t - since) * 14) * (t >= since ? 1 : 0);

  // --- the counters ---
  const cents = (who: "c" | "g") => { const w = who === "c" ? c2.claude : c2.gemini, tot = who === "c" ? DATA.claude.cents : DATA.gemini.cents; return Math.round(tot * (1 - Math.pow(1 - clamp01((t - w[0]) / (w[1] - w[0])), 3))); };

  const card = (who: "c" | "g", i: number) => {
    const name = who === "c" ? DATA.claude.name : DATA.gemini.name, accent = who === "g";
    const rowA = { x: 540, y: ROW_Y[who] }, rec = REC_AT[who], ap = APART_AT[who];
    const x = lerp(lerp(rowA.x, rec.x, mm), ap.x, aa), y = lerp(lerp(rowA.y, rec.y, mm), ap.y, aa), sc = lerp(1, APART_S, aa);
    const w = lerp(ROW.w, REC.w, mm), h = lerp(ROW.h, REC.h, mm);
    const rowOpacity = 1 - smooth(0, 0.35, mm), recOpacity = smooth(0.4, 0.9, mm);
    const sec = who === "c" ? cSec : gSec, bar = who === "c" ? cBar : gBar, done = who === "c" ? cLanded : gDone;
    const doneAt = who === "c" ? tLand : tSnap;
    const tint = accent ? C.accent : C.text;
    return (
      <At key={who} x={x} y={y} style={{ transform: `translate(-50%, -50%) scale(${sc})` }}>
        <Enter at={c1.tracks} i={i * 2} dy={40}>
          <Glass w={w} h={h}>
            {/* S1: the track */}
            <div style={{ position: "absolute", left: 0, top: 0, width: ROW.w, height: ROW.h, opacity: rowOpacity }}>
              <div style={{ position: "absolute", left: 44, top: 34, fontFamily: FONT.ui, fontWeight: 600, fontSize: 42, color: C.text }}>{name}</div>
              <div style={{ position: "absolute", right: 44, top: 22, display: "flex", alignItems: "center", gap: 14, transform: `scale(${pop(doneAt)})`, transformOrigin: "100% 50%" }}>
                <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 70, letterSpacing: "-0.03em", color: done ? tint : C.text, fontVariantNumeric: "tabular-nums", filter: !done && who === "c" ? "blur(0.6px)" : undefined }}>{fmtTime(sec)}</span>
                {done && <Check size={46} draw={clamp01((t - doneAt) / 0.2)} />}
              </div>
              <div style={{ position: "absolute", left: 44, top: 150, width: ROW.w - 88, height: 30, borderRadius: 15, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                <div style={{ width: `${bar * 100}%`, height: "100%", borderRadius: 15, background: accent ? `linear-gradient(90deg, ${C.accent}, #4DA3FF)` : `linear-gradient(90deg, #1D1D1F, #48484A)` }} />
              </div>
              <div style={{ position: "absolute", left: 44, top: 196, fontFamily: FONT.ui, fontWeight: 500, fontSize: 28, color: C.secondary }}>{done ? (accent ? "Done" : "Done · finally") : "Working…"}</div>
            </div>
            {/* S2: the receipt */}
            <div style={{ position: "absolute", left: 0, top: 0, width: REC.w, height: REC.h, opacity: recOpacity, padding: "40px 40px 0" }}>
              <div style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 22, letterSpacing: "0.22em", color: C.secondary }}>RECEIPT</div>
              <div style={{ marginTop: 10, fontFamily: FONT.display, fontWeight: 700, fontSize: 44, letterSpacing: "-0.02em", color: C.text, lineHeight: 1.05 }}>{name}</div>
              <div style={{ marginTop: 24, borderTop: "2px dashed rgba(0,0,0,0.14)" }} />
              <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: FONT.ui, fontWeight: 600 }}>
                <span style={{ fontSize: 28, color: C.secondary }}>Time</span><span style={{ fontSize: 40, color: tint }}>{fmtTime(accent ? DATA.gemini.seconds : DATA.claude.seconds)}</span>
              </div>
              <div style={{ marginTop: 24, borderTop: "2px dashed rgba(0,0,0,0.14)" }} />
              <div style={{ marginTop: 26, fontFamily: FONT.ui, fontWeight: 600, fontSize: 28, color: C.secondary }}>Cost</div>
              <div style={{ marginTop: 6 }}><Odometer value={money(cents(who))} digits={who === "c" ? 4 : 3} size={104} prefix="$" decimals={2} color={tint} collapse /></div>
              <div style={{ position: "absolute", left: 40, bottom: 40 }}><Barcode seed={i + 3} /></div>
            </div>
          </Glass>
        </Enter>
      </At>
    );
  };

  return (
    <>
      {/* the prompt card: big in the centre, then a chip at the top */}
      <At x={540} y={lerp(PROMPT_Y.big, PROMPT_Y.chip, shrink)}>
        <Enter at={c1.prompt} dy={30} until={c3.apart} exit={10}>
          <Glass w={lerp(BIG.w, CHIP.w, shrink)} h={lerp(BIG.h, CHIP.h, shrink)} r={lerp(40, 44, shrink)}>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ height: 30 * (1 - shrink), opacity: 1 - shrink, fontFamily: FONT.ui, fontWeight: 600, fontSize: 24, letterSpacing: "0.26em", color: C.secondary, overflow: "hidden" }}>PROMPT</div>
              <div style={{ ...HEAD, fontSize: lerp(92, 40, shrink), whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>Same prompt<span style={{ display: "inline-block", width: 5, height: lerp(76, 34, shrink), background: C.accent, opacity: Math.floor(t * 2.2) % 2 === 0 && shrink < 0.5 ? 1 : 0, marginLeft: 6 }} /></div>
            </div>
          </Glass>
        </Enter>
      </At>
      {card("c", 0)}
      {card("g", 1)}

      {/* S3: the ratios */}
      {t >= c3.x26[0] - 0.05 && <Ratios />}
    </>
  );
};

const Ratios: React.FC = () => {
  const t = useT(), c3 = CUE.s3;
  const move = Math.min(1, useSpring(c3.shift));
  const v26 = Math.round(SPEED_X * (1 - Math.pow(1 - clamp01((t - c3.x26[0]) / (c3.x26[1] - c3.x26[0])), 3)));
  const v7 = Math.round(7 * (1 - Math.pow(1 - clamp01((t - c3.x7[0]) / (c3.x7[1] - c3.x7[0])), 3)));
  const x26 = lerp(540, 300, move), s26 = lerp(1, 0.62, move);
  const stat: React.CSSProperties = { display: "flex", alignItems: "center", fontFamily: FONT.display, fontWeight: 700, color: C.accent, letterSpacing: "-0.04em", fontSize: 340, lineHeight: 1 };
  const label: React.CSSProperties = { marginTop: 14, textAlign: "center", fontFamily: FONT.ui, fontWeight: 600, fontSize: 64, letterSpacing: "0.04em", color: C.text };
  return (
    <>
      <At x={x26} y={640} style={{ transform: `translate(-50%, -50%) scale(${s26})` }}>
        <Enter at={c3.x26[0]} dy={40} blur={12}>
          <div style={stat}><Odometer value={v26} digits={2} size={340} color={C.accent} commas={false} /><span>×</span></div>
          <Enter at={c3.tez} dy={20}><div style={label}>faster</div></Enter>
        </Enter>
      </At>
      <At x={780} y={640} style={{ transform: "translate(-50%, -50%) scale(0.62)" }}>
        <Enter at={c3.x7[0]} dy={40} blur={12}>
          <div style={stat}><span style={{ marginRight: 14 }}>~</span><Odometer value={v7} digits={1} size={340} color={C.accent} commas={false} /><span>×</span></div>
          <Enter at={c3.sasta} dy={20}><div style={label}>cheaper</div></Enter>
        </Enter>
      </At>
    </>
  );
};
