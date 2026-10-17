import React from "react";
import { C, FONT, FPS } from "../theme";
import { CUE, KEYS } from "../cues";
import { frameOf } from "../anchors";
import { At, Enter, clamp01, easeOutCubic, lerp, smooth, springAt, useSpring } from "../motion";
import { useFrame, useT } from "../clock";
import { Glass } from "../components/glass";
import { Sparkle } from "../components/bits";
import { HEAD, SERIF } from "./text";

const BODY = { w: 612, h: 936, y: 770 }, PANEL = { w: 804, h: 804, y: 864 };
const KEY = 124, GAP = 16, KX = 34, KY = 222;
const fmt = (s: string) => (s === "" ? "0" : Number(s).toLocaleString("en-US"));

// what the display shows at time t, from the presses in cues.ts (iOS behaviour: operand, operator, operand, equals)
function display(t: number) {
  const at = (i: number) => t >= KEYS[i].t;
  const first = KEYS.slice(0, 5).filter((_, i) => at(i)).map((k) => k.key).join("");
  const div = at(5);
  const second = KEYS.slice(6, 10).filter((_, i) => at(6 + i)).map((k) => k.key).join("");
  const eq = at(10);
  return { main: div && second ? second : first, expr: div ? `${fmt(first)} ÷${second ? " " + fmt(second) : ""}${eq ? " =" : ""}` : "", opActive: div && !second && !eq };
}
// 1 on the frame a key goes down, then it springs back
const pressed = (label: string, t: number) => Math.max(0, ...KEYS.filter((k) => k.key === label).map((k) => (t >= k.t ? Math.exp(-(t - k.t) * 13) : 0)));

type Key = { label: string; kind: "digit" | "fn" | "op"; col: number; row: number; span?: number };
const LAYOUT: Key[] = [
  { label: "AC", kind: "fn", col: 0, row: 0 }, { label: "±", kind: "fn", col: 1, row: 0 }, { label: "%", kind: "fn", col: 2, row: 0 }, { label: "÷", kind: "op", col: 3, row: 0 },
  { label: "7", kind: "digit", col: 0, row: 1 }, { label: "8", kind: "digit", col: 1, row: 1 }, { label: "9", kind: "digit", col: 2, row: 1 }, { label: "×", kind: "op", col: 3, row: 1 },
  { label: "4", kind: "digit", col: 0, row: 2 }, { label: "5", kind: "digit", col: 1, row: 2 }, { label: "6", kind: "digit", col: 2, row: 2 }, { label: "−", kind: "op", col: 3, row: 2 },
  { label: "1", kind: "digit", col: 0, row: 3 }, { label: "2", kind: "digit", col: 1, row: 3 }, { label: "3", kind: "digit", col: 2, row: 3 }, { label: "+", kind: "op", col: 3, row: 3 },
  { label: "0", kind: "digit", col: 0, row: 4, span: 2 }, { label: ".", kind: "digit", col: 2, row: 4 }, { label: "=", kind: "op", col: 3, row: 4 },
];

const CalcKey: React.FC<{ k: Key; t: number; opActive: boolean; x: number; y: number }> = ({ k, t, x, y }) => {
  const down = pressed(k.label, t);
  const w = k.span ? KEY * k.span + GAP * (k.span - 1) : KEY;
  const base = k.kind === "op" ? C.accent : k.kind === "fn" ? "#E3E3E8" : "#FFFFFF";
  const fg = k.kind === "op" ? "#fff" : C.text;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: KEY, borderRadius: KEY / 2, transform: `scale(${1 - 0.09 * down})`, background: base, color: fg, boxShadow: `0 ${3 - 2 * down}px ${8 - 5 * down}px rgba(0,0,0,${0.10 - 0.05 * down})`, display: "flex", alignItems: "center", justifyContent: k.span ? "flex-start" : "center", paddingLeft: k.span ? 48 : 0, fontFamily: FONT.display, fontWeight: 600, fontSize: k.kind === "digit" ? 56 : 52 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: KEY / 2, background: k.kind === "op" ? "#fff" : "#000", opacity: k.kind === "op" ? 0.35 * down : 0.14 * down }} />
      <span style={{ position: "relative" }}>{k.label}</span>
    </div>
  );
};

/** 3. The calculator: both cards blur out, the calculator springs in, the keys go down on the numbers, the display morphs to 25, the body becomes 25 calendar tiles. */
export const Calculator: React.FC = () => {
  const frame = useFrame(), t = useT(), c = CUE.s3;
  const d = display(t);
  const result = useSpring(c.result), mg = Math.min(1, useSpring(c.grid, 0));
  const g = easeOutCubic(clamp01(mg)), res = Math.min(1, result);
  const w = lerp(BODY.w, PANEL.w, g), h = lerp(BODY.h, PANEL.h, g), cy = lerp(BODY.y, PANEL.y, g);
  const opActive = d.opActive;
  const ui = 1 - smooth(0, 0.55, g);                      // the calculator's own content leaves as the tiles arrive
  const TILE = 136, TGAP = 14, tx = (w - (5 * TILE + 4 * TGAP)) / 2, ty = (h - (5 * TILE + 4 * TGAP)) / 2;
  return (
    <>
      <At x={540} y={cy}>
        <Enter at={c.calculator} dy={60} blur={10}>
          <Glass w={w} h={h} r={g > 0 ? lerp(48, 44, g) : 48}>
            {/* the display */}
            <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 200, opacity: ui, filter: ui < 0.99 ? `blur(${(1 - ui) * 10}px)` : undefined }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 72% 70%, ${C.accent}${Math.round(res * 64).toString(16).padStart(2, "0")}, transparent 66%)` }} />
              <div style={{ position: "absolute", right: 44, top: 22, fontFamily: FONT.ui, fontWeight: 500, fontSize: 30, color: C.secondary, whiteSpace: "nowrap" }}>{d.expr}</div>
              <div style={{ position: "absolute", right: 44, bottom: 10, height: 112, display: "flex", alignItems: "flex-end", fontFamily: FONT.display, fontWeight: 600, fontSize: 100, letterSpacing: "-0.03em", color: C.text, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {res < 1 && <div style={{ opacity: 1 - res, transform: `translateY(${-24 * res}px)`, filter: `blur(${8 * res}px)` }}>{fmt(d.main)}</div>}
                {res > 0 && <div style={{ position: res < 1 ? "absolute" : "relative", right: 0, color: C.accent, opacity: res, transform: `translateY(${24 * (1 - res)}px) scale(${1.06 - 0.06 * res})`, filter: `blur(${8 * (1 - res)}px)`, textShadow: `0 0 ${50 * res}px ${C.accent}88` }}>25</div>}
              </div>
            </div>
            {/* the keys */}
            <div style={{ position: "absolute", left: (w - BODY.w) / 2, top: 0, width: BODY.w, height: h, opacity: ui, filter: ui < 0.99 ? `blur(${(1 - ui) * 10}px)` : undefined }}>
              {LAYOUT.map((k) => <CalcKey key={k.label} k={k} t={t} opActive={opActive} x={KX + k.col * (KEY + GAP)} y={KY + k.row * (KEY + GAP)} />)}
              {opActive && <div style={{ position: "absolute", left: KX + 3 * (KEY + GAP), top: KY, width: KEY, height: KEY, borderRadius: KEY / 2, background: "#fff", boxShadow: `0 0 0 3px ${C.accent} inset`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.display, fontWeight: 600, fontSize: 52, color: C.accent }}>÷</div>}
            </div>
            {/* 25 calendar tiles, flipping in on a diagonal wave */}
            <div style={{ position: "absolute", inset: 0, perspective: 1100 }}>
              {Array.from({ length: 25 }, (_, i) => {
                const r = Math.floor(i / 5), col = i % 5;
                const p = Math.min(1, springAt(frame, frameOf(c.grid) + 6 + (r + col) * 3));
                if (p <= 0) return null;
                const last = i === 24;
                return (
                  <div key={i} style={{ position: "absolute", left: tx + col * (TILE + TGAP), top: ty + r * (TILE + TGAP), width: TILE, height: TILE, borderRadius: 32, overflow: "hidden", transform: `rotateX(${(1 - p) * -90}deg)`, transformOrigin: "50% 100%", opacity: clamp01(p * 1.6), background: last ? C.accent : "#fff", boxShadow: last ? `0 14px 36px ${C.accent}66` : "0 2px 6px rgba(0,0,0,0.06), 0 10px 24px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" }}>
                    <div style={{ height: 36, background: last ? "rgba(255,255,255,0.22)" : C.accent, color: "#fff", fontFamily: FONT.ui, fontWeight: 700, fontSize: 15, letterSpacing: "0.14em", display: "flex", alignItems: "center", justifyContent: "center" }}>MONTH</div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.display, fontWeight: 700, fontSize: 62, letterSpacing: "-0.03em", color: last ? "#fff" : C.text }}>{i + 1}</div>
                  </div>
                );
              })}
            </div>
          </Glass>
        </Enter>
      </At>
      {/* "2+ saal" */}
      <At x={540} y={372}>
        <div style={{ display: "flex", gap: "0.2em", ...SERIF, fontSize: 196, whiteSpace: "nowrap" }}>
          <Enter at={c.saal[0]} dy={30} blur={10}>2+</Enter>
          <Enter at={c.saal[1]} dy={30} blur={10}>saal</Enter>
        </div>
      </At>
      <Sparkle x={196} y={318} size={54} at={c.saal[2]} phase={0} />
      <Sparkle x={880} y={452} size={36} at={c.saal[2]} phase={2} />
    </>
  );
};
