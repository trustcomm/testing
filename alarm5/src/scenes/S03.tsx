import React from "react";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { clamp01, lerp, Rise, smooth, springAt } from "../motion";
import { glide, launch, settle, swing } from "../easing";
import { Local, Stroke, arc, circle, line, poly, quad, rrect } from "../components/draw";
import { Abs, Arrowhead, Person, T, WPill } from "../components/art";
import { Obj } from "../world";
import { stationAt } from "../components/map";
import { ART } from "../timeline";
import { cue } from "../cues/s03";

const GROUND = 210;
/** the bank: pediment, six columns, a door, two steps */
const Bank: React.FC<{ at: number }> = ({ at }) => {
  const cols = [-250, -170, -90, 90, 170, 250];
  return (
    <>
      <Stroke d={poly([[-300, -90], [0, -280], [300, -90]], true)} at={at} frames={42} />
      <Stroke d={line(-310, -90, 310, -90)} at={at + 3} frames={34} />
      <Stroke d={line(-290, -50, 290, -50)} at={at + 6} frames={34} />
      {cols.map((x, i) => <Stroke key={x} d={line(x, -50, x, 150)} at={at + 8 + i * 3} frames={32} />)}
      <Stroke d={rrect(-60, 30, 120, 120, 8)} at={at + 22} frames={30} />
      <Stroke d={rrect(-310, 150, 620, 26, 6)} at={at + 14} frames={34} />
      <Stroke d={rrect(-350, 176, 700, 26, 6)} at={at + 17} frames={34} />
      <Stroke d={line(-470, GROUND - 6, 470, GROUND - 6)} at={at + 10} frames={44} color={C.secondary} />
      <Stroke d={circle(0, -150, 34)} at={at + 30} frames={30} />
    </>
  );
};
/** the friendly robot (feet at the origin, facing right); `ph` is the walk phase in radians, `lean` tips it forward */
const Robot: React.FC<{ x: number; at: number; ph: number; lean: number; alarm: number }> = ({ x, at, ph, lean, alarm }) => {
  const sw = Math.sin(ph) * 22, sw2 = Math.sin(ph + Math.PI) * 22;
  return (
    <g transform={`translate(${x} ${GROUND - 6}) rotate(${lean} 0 0)`}>
      <Stroke d={rrect(-30, -178, 60, 50, 14)} at={at} frames={24} />
      <Stroke d={line(0, -178, 0, -200)} at={at + 8} frames={10} />
      <Stroke d={circle(0, -208, 7)} at={at + 10} frames={12} color={alarm > 0.5 ? C.alarm : C.text} />
      <circle cx={-11} cy={-153} r={4.5} fill={C.text} /><circle cx={11} cy={-153} r={4.5} fill={C.text} />
      <Stroke d={rrect(-34, -122, 68, 72, 12)} at={at + 6} frames={26} />
      <Stroke d={line(-34, -106, -56 + sw2 * 0.5, -66)} at={at + 12} frames={14} />
      <Stroke d={line(34, -106, 56 + sw * 0.5, -66)} at={at + 12} frames={14} />
      <Stroke d={line(-14, -50, -14 + sw, 0)} at={at + 14} frames={12} />
      <Stroke d={line(14, -50, 14 + sw2, 0)} at={at + 14} frames={12} />
    </g>
  );
};

export const S3World: React.FC = () => {
  const f = useFrame();
  const [w0, w1] = ART.window[5];
  if (f < cue.bank - 10 || f > w1 + 40) return null;
  const dim = smooth(cue.dimStart, cue.dimStart + 24, f) * (1 - 0.5 * smooth(cue.questOut, cue.questOut + 24, f)), gone = 1 - 0.88 * dim, qo = 1 - smooth(cue.questOut, cue.questOut + 22, f);
  // the robot: walks left to right, brakes at the door
  const t = clamp01((f - cue.walkStart) / (cue.walkEnd - cue.walkStart));
  const walk = t < 1 ? t * 0.96 + 0.04 * settle(t) : 1;
  const rx = lerp(-440, -170, walk), moving = f > cue.walkStart && f < cue.brake + 6;
  const ph = (rx + 440) * 0.075, lean = f >= cue.brake - 4 && f < cue.brake + 26 ? 5 * Math.exp(-(f - cue.brake + 4) / 8) * Math.sin(Math.min(1, (f - cue.brake + 4) / 6) * Math.PI / 1.0) : 0;
  const alarm = clamp01((f - cue.brake) / 3);
  // the gate
  const gp = launch(clamp01((f - (cue.gateShut - 22)) / 22)), gx = (1 - gp) * 300;
  const shake = f >= cue.gateShut && f < cue.gateShut + 14 ? Math.sin((f - cue.gateShut) * 2.2) * 5 * Math.exp(-(f - cue.gateShut) / 4) : 0;
  // the coin
  const cp = clamp01((f - cue.coin) / (cue.coinHit - cue.coin)), back = glide(clamp01((f - cue.coinHit) / 34));
  const coinX = f < cue.coinHit ? lerp(150, 306, cp ** 1.15) : lerp(306, 214, back), roll = ((coinX - 150) / 30) * (180 / Math.PI);
  const coinY = GROUND - 6 - 32 - (f >= cue.coinHit ? Math.sin(back * Math.PI) * 34 : 0);
  return (
    <Obj at={stationAt(5)} r={760} art z={2}>
      <Local style={{ opacity: gone }}>
        <Bank at={cue.bank} />
        <Robot x={rx} at={cue.walkStart - 14} ph={moving ? ph : ph} lean={lean} alarm={alarm} />
        {/* the glass gate */}
        {f >= cue.gateShut - 24 && (
          <g transform={`translate(${gx + shake} 0)`}>
            <rect x={-104} y={6} width={208} height={192} rx={14} fill="rgba(255,255,255,0.09)" stroke={C.text} strokeWidth={3} />
            {[-52, 0, 52].map((x) => <line key={x} x1={x} y1={16} x2={x} y2={188} stroke={C.text} strokeOpacity={0.35} strokeWidth={2} />)}
          </g>
        )}
        {/* the second barrier and the coin */}
        <Stroke d={rrect(346, 96, 24, 108, 6)} at={cue.coin - 14} frames={26} color={C.alarm} />
        <Stroke d={poly([[346, 126], [370, 108]])} at={cue.coin - 6} frames={14} color={C.alarm} /><Stroke d={poly([[346, 160], [370, 142]])} at={cue.coin - 4} frames={14} color={C.alarm} />
        {f >= cue.coin - 6 && (
          <g transform={`translate(${coinX} ${coinY})`} style={{ opacity: clamp01((f - cue.coin + 6) / 10) }}>
            <g transform={`rotate(${roll})`}><circle r={32} fill="#0B0C0F" stroke={C.text} strokeWidth={3} /><text textAnchor="middle" y={13} fontFamily={FONT.mono} fontWeight={700} fontSize={38} fill={C.text}>$</text></g>
          </g>
        )}
      </Local>
      <Abs x={0} y={-340} style={{ opacity: 1 - dim }}><WPill x={0} y={0} at={cue.banksPill} size={30}>US BANKS</WPill></Abs>
      <div style={{ opacity: gone }}><WPill x={rx} y={GROUND - 270} at={cue.agentsPill} size={26}>AI AGENT</WPill></div>
      <div style={{ opacity: gone }}><WPill x={gx * 0 + 0} y={-24} at={cue.loginX} size={28} tone="danger">{"✕ LOGIN"}</WPill></div>
      <div style={{ opacity: gone }}><WPill x={358} y={64} at={cue.transferX} size={26} tone="danger">{"✕ TRANSFER"}</WPill></div>
      {/* the fact line */}
      <Abs x={0} y={262} style={{ opacity: gone }}>
        <Rise at={cue.fact} frames={26} out={cue.dimStart}>
          <div style={{ textAlign: "center", fontFamily: FONT.body, fontWeight: 500, fontSize: 27, lineHeight: 1.45, color: C.secondary, whiteSpace: "nowrap" }}>
            <div>JPMorgan · Citi · Schwab block</div><div>Bank of America limits (Oct 13–16)</div>
          </div>
        </Rise>
      </Abs>
      {/* who is responsible? */}
      <Local style={{ opacity: qo }}>
        {f >= cue.quest - 8 && f < cue.questOut + 30 && (
          <>
            {[{ x: -270, y: 90, label: "CUSTOMER" }, { x: 270, y: 90, label: "BANK" }, { x: 0, y: -200, label: "AI COMPANY" }].map((p, i) => <Person key={i} x={p.x} y={p.y} s={1.25} at={cue.quest + i * 5} />)}
            <Stroke d={quad(-230, 20, -200, -150, -66, -200)} at={cue.figs + 6} frames={30} dotted={11} />
            <Stroke d={quad(66, -200, 200, -150, 230, 20)} at={cue.figs + 14} frames={30} dotted={11} />
            <Stroke d={quad(214, 150, 0, 250, -214, 150)} at={cue.figs + 22} frames={34} dotted={11} />
            <Arrowhead x={-62} y={-198} deg={-18} at={cue.figs + 34} /><Arrowhead x={226} y={26} deg={78} at={cue.figs + 42} /><Arrowhead x={-218} y={146} deg={150} at={cue.figs + 56} />
          </>
        )}
      </Local>
      {f >= cue.quest - 8 && f < cue.questOut + 30 && (
        <div style={{ opacity: qo }}>
          <Abs x={0} y={-6} style={{ opacity: settle(clamp01((f - cue.kaun + 10) / 22)), transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * springAt(f, cue.kaun - 8)})` }}><T size={330} display color={C.text} style={{ textShadow: "0 0 60px rgba(255,255,255,0.15)" }}>?</T></Abs>
          {["CUSTOMER", "BANK", "AI COMPANY"].map((l, i) => <WPill key={l} x={[-270, 270, 0][i]} y={[168, 168, -270][i]} at={cue.quest + 12 + i * 5} size={24}>{l}</WPill>)}
        </div>
      )}
    </Obj>
  );
};
