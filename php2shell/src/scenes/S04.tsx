import React, { useMemo } from "react";
import { C, FONT } from "../theme";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { Pop, Rise, clamp01, easeInOutCubic } from "../motion";
import { Canvas, circle, pointsOnPath, rrect, line } from "../components/draw";
import { Dust, textPoints, type Pt } from "../components/dust";
import { CNT, COUNTER_Y, LABELS, LABEL_PAD, PANEL, PHP_Y, Stack, WEB, bugDefs } from "../components/a-stack";
import { bugPaths, bugState } from "../components/a-bug";
import { LENS, LensArt, bracketPath, lensGeo } from "../components/a-lens";
import { CVE_TEXT } from "../cues/s03";

// ---- the three names: glass chips (plain text, exact spelling), spring in ON each name ----
const CHIP = { h: 104, font: `700 54px "Inter Display"`, pad: 50, gap: 28, y: 552 };
const NAMES = ["Wiz", "Calif", "OpenAI"] as const;
const LABEL = { y: 440, font: `500 36px Inter`, text: "Found by researchers" };
const chipGeo = () => {
  const g = document.createElement("canvas").getContext("2d")!; g.font = CHIP.font;
  const ws = NAMES.map((n) => Math.ceil(g.measureText(n).width) + 2 * CHIP.pad), total = ws.reduce((a, b) => a + b, 0) + CHIP.gap * (NAMES.length - 1);
  let x = 540 - total / 2;
  return NAMES.map((n, i) => { const o = { name: n, x, w: ws[i], cx: x + ws[i] / 2 }; x += ws[i] + CHIP.gap; return o; });
};

/** the whole picture as dust: sampled along every outline and every letter, in the end state (everything is dissolved to dust over the last 18 frames) */
const buildPoints = (): Pt[] => {
  const c = CUES.S4.cue, pts: Pt[] = [];
  const lx = LENS.x1, ly = LENS.y1, k = LENS.k, inLens = (p: Pt) => Math.hypot(p.x - lx, p.y - ly) < LENS.r - 4;
  const mag = (p: Pt): Pt => ({ x: lx + (p.x - lx) * k, y: ly + (p.y - ly) * k });
  const add = (a: Pt[]) => pts.push(...a.filter((p) => !inLens(p)));
  // the panel, PHP, the counter, the CVE capsules, the cobweb
  add(pointsOnPath(rrect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r), 420));
  add(textPoints("PHP", { font: `700 150px "JetBrains Mono"`, x: 540, y: PHP_Y, step: 5 }));
  add(textPoints("2016", { font: `500 54px "JetBrains Mono"`, x: CNT.xL, y: COUNTER_Y, align: "left", step: 3 }));
  add(pointsOnPath(line(CNT.xA0, COUNTER_Y, CNT.xA1, COUNTER_Y), 22));
  add(textPoints("2026", { font: `500 54px "JetBrains Mono"`, x: CNT.xR, y: COUNTER_Y, align: "left", step: 3 }));
  LABELS.forEach((L, i) => { add(pointsOnPath(rrect(L.x, L.y, L.w, 52, 26), 170)); add(textPoints(CVE_TEXT[i], { font: `500 26px "JetBrains Mono"`, x: L.x + LABEL_PAD, y: L.y + 27, align: "left", step: 2 })); });
  [...WEB.radials, ...WEB.arcs.flat()].forEach((d) => add(pointsOnPath(d, 26)));
  // the bugs, frozen in the lens (magnified)
  bugDefs().forEach((d) => {
    const s = bugState(d, c.caught, c.caught), a = (s.angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const place = (q: Pt): Pt => mag({ x: s.x + (q.x * ca - q.y * sa) * s.scale, y: s.y + (q.x * sa + q.y * ca) * s.scale });
    bugPaths(s.phase, s.amp, s.sway).forEach((p) => pts.push(...pointsOnPath(p.d, p.fill ? 46 : 14).map(place)));
  });
  // the lens: ring + handle + the viewfinder brackets
  pts.push(...pointsOnPath(bracketPath(), 30).map((q) => ({ x: lx + q.x, y: ly + q.y })));
  pts.push(...pointsOnPath(circle(lx, ly, LENS.r), 230));
  { const hx = lx + LENS.r * 0.7071, hy = ly + LENS.r * 0.7071, a = (-45 * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    pts.push(...pointsOnPath(rrect(-13, -3, 26, 72, 13), 110).map((q) => ({ x: hx + q.x * ca - q.y * sa, y: hy + q.x * sa + q.y * ca }))); }
  // the label and the three chips
  pts.push(...textPoints(LABEL.text, { font: LABEL.font, x: 540, y: LABEL.y, step: 3 }));
  chipGeo().forEach((g) => { pts.push(...pointsOnPath(rrect(g.x, CHIP.y - CHIP.h / 2, g.w, CHIP.h, CHIP.h / 2), 150)); pts.push(...textPoints(g.name, { font: CHIP.font, x: g.cx, y: CHIP.y, step: 3 })); });
  return pts;
};

/**
 * S4: starts from S3's picture exactly (the Stack: window tier, WordPress, PHP panel, two bugs with CVEs, counter, cobweb), then a magnifying glass sweeps across the
 * panel and stops on "pakda": the bugs freeze inside the lens (magnified, in brackets), a sparkle on the glass. The top tier leaves; "Found by researchers" rises and three
 * chips spring in, ON "Wiz", "Calif", "OpenAI". In the last 18 frames everything dissolves to dust (up and out): S5 starts from dust.
 */
export const S4: React.FC = () => {
  const f = useFrame(), c = CUES.S4.cue;
  const chips = useMemo(chipGeo, []), pts = useMemo(buildPoints, []);
  const lens = lensGeo(f), tierOut = easeInOutCubic((f - c.tierOut) / 12);
  const out = clamp01((f - c.dissolve) / 7), dp = clamp01((f - c.dissolve) / 20);
  const ats = [c.chip1, c.chip2, c.chip3];
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: 1 - out }}>
        <Stack lens={lens} tierOut={tierOut} />
        <LensArt />
        <div style={{ position: "absolute", left: 0, right: 0, top: LABEL.y, transform: "translateY(-50%)", textAlign: "center", fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: C.secondary }}>
          <Rise at={c.label} frames={12}>Found by researchers</Rise>
        </div>
        {chips.map((g, i) => (
          <div key={g.name} style={{ position: "absolute", left: g.x, top: CHIP.y - CHIP.h / 2, width: g.w, height: CHIP.h }}>
            <Pop at={ats[i] - 4} style={{ width: g.w, height: CHIP.h, boxSizing: "border-box", borderRadius: 999, border: `1px solid ${C.text}`, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.display, fontWeight: 700, fontSize: 54, letterSpacing: "-0.02em", color: C.text, lineHeight: 1 }}>{g.name}</Pop>
          </div>
        ))}
      </div>
      {f >= c.dissolve && <Dust points={pts} p={dp} seed={7} alpha={clamp01((f - c.dissolve) / 2)} drift={380} spread={1.1} stagger={0.45} />}
    </>
  );
};
