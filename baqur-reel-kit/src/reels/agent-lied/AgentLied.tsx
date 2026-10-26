// ─────────────────────────────────────────────────────────────
// Reel #2 on the kit: "AI ne jhooth bola" (keyword AGENT). Concept: "The Eye".
// The monitor is an eye. Act 1 (red): the eye is erased, silenced, replaced. Act 2 (green): it comes back, and this time it is YOUR eye.
// Everything is timed from cues (cues.json → timeline.json). No hand-typed frame numbers except durations.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import {AbsoluteFill, Audio, getStaticFiles, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F, T, SAFE} from '../../core/tokens';
import {EASE, enter, ramp, springAt} from '../../core/motion';
import {Shot, Station, World} from '../../core/camera';
import {makeTL} from '../../core/timeline';
import type {TimelineJSON} from '../../core/timeline';
import {Chip, Counter, Draw, Glass, HitFlash, ICON, In, Kicker, Pop, ProgressRail, SourceLine} from '../../scenes/primitives';
import {AgentBackdrop, AgentCaptions, AlertWire, ChatBubble, Dim, Eye, LogStream, QuoteCard, RGBSplit, RuleRow, Terminal, ToolPill} from '../../scenes/agent';
import timelineJson from './timeline.json';

const tl = makeTL(timelineJson as TimelineJSON);
const f = tl.f;
export const AGENT_LIED_DURATION = tl.durationInFrames;

// ── World (4400 × 11000) ─────────────────────────────────────
export const WORLD = {w: 4400, h: 11000};
const ST = {
  hook: {x: 1200, y: 1300},
  report: {x: 3300, y: 1900},
  lab: {x: 1200, y: 3700},
  sol: {x: 3200, y: 4700},
  astra: {x: 1200, y: 5900},
  ask: {x: 3200, y: 7000},
  quote: {x: 3200, y: 7850},
  you: {x: 1200, y: 8800},
  rules: {x: 3200, y: 9700},
  eye: {x: 2200, y: 10400},
};

// A FLY-TO centred on its cue: the midpoint (and the whoosh peak) lands on the cue. `off` shifts it by a few frames.
const flyTo = (cue: string, p: {x: number; y: number}, zoom = 1, dur = 54, off = 0): Shot => ({at: f(cue) + off - Math.round(dur / 2), x: p.x, y: p.y, zoom, move: 'FLY-TO', dur});
const punch = (cue: string, off = 0): Shot => ({at: f(cue) + off, x: 0, y: 0, zoom: 1, move: 'PUNCH'});
const push = (at: number, x: number, y: number, zoom: number, dur: number): Shot => ({at, x, y, zoom, move: 'PUSH', dur});

export const SHOTS: Shot[] = [
  {at: 0, x: ST.hook.x, y: ST.hook.y - 320, zoom: 1.8, move: 'CUT'}, // the eye, close
  {at: 2, x: ST.hook.x, y: ST.hook.y, zoom: 1.0, move: 'PUSH', dur: f('s1_remove') - 2}, // the PULL that reveals the terminal under the eye (glide ease: the kit's PULL starts with a lurch on a 1.8x -> 1.0 reveal)
  punch('s1_remove'),
  push(f('s1_ask'), ST.hook.x, ST.hook.y + 150, 1.1, 50), // toward the chat bubbles
  punch('s1_deny'),
  flyTo('s2', ST.report, 1.0),
  push(f('s2_rules'), ST.report.x, ST.report.y, 1.08, 70),
  flyTo('s3', ST.lab, 0.95, 60),
  push(f('s3_monitor'), ST.lab.x, ST.lab.y - 120, 1.05, 80), // toward the eye
  flyTo('s4', ST.sol, 1.0),
  punch('s4_sol'),
  push(f('s4_human'), ST.sol.x + 30, ST.sol.y - 20, 1.1, 60), // toward the broken alert line
  flyTo('s5', ST.astra, 1.0),
  punch('s5_astra'),
  push(f('s5_test'), ST.astra.x, ST.astra.y - 215, 1.1, 70), // on the test diff
  flyTo('s6', {x: ST.ask.x, y: ST.ask.y - 190}, 1.0, 60),
  push(f('s6_q'), ST.ask.x, ST.ask.y - 190, 1.28, f('s6_no') - f('s6_q')), // the slow creeping push for the tense pause
  punch('s6_no'),
  punch('s6_no', 3), // two punches 3 frames apart: a ~12% kick
  push(f('s7'), ST.quote.x, ST.quote.y - 200, 1.0, 50), // straight down to the quote (a vertical push, not a fly)
  flyTo('s8', ST.you, 1.0),
  punch('s8_aap'),
  flyTo('s8_fly', ST.rules, 0.96, 60),
  push(f('s9_1'), ST.rules.x, ST.rules.y, 1.0, tl.seg('S9').dur), // gentle, over the whole of S9
  flyTo('s10', ST.eye, 1.0, 66),
  push(f('s10_eye'), ST.eye.x, ST.eye.y, 1.15, 40),
  {at: f('s11'), x: ST.eye.x, y: ST.eye.y, zoom: 1.0, move: 'PULL', dur: 60},
  punch('s11_kw'),
  {at: f('s11_friend') + 30, x: ST.eye.x, y: ST.eye.y, zoom: 0.9, move: 'PULL', dur: 150},
];

// Colour arc: red for the deception half, green from S8 (done by "chaar rules").
const arcAt = (frame: number) => interpolate(frame, [f('s8'), f('s8_rules')], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const HITS = ['s1_remove', 's1_deny', 's4_sol', 's5_astra', 's6_no', 's8_aap', 's11_kw'];

// ── helpers ──────────────────────────────────────────────────
/** Content of a station exists only between `from` and `to` (20-frame fades): a neighbour's content never shows up at the edge of a shot. */
const Gate: React.FC<{from: number; to: number; children: React.ReactNode}> = ({from, to, children}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const o = ramp(frame, from, 20, EASE.glide) * (1 - ramp(frame, to - 20, 20, EASE.glide));
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};
const Abs: React.FC<{left: number; top: number; w?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({left, top, w, style, children}) => (
  <div style={{position: 'absolute', left, top, width: w, ...style}}>{children}</div>
);
const Row: React.FC<{gap?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({gap = 18, children, style}) => (
  <div style={{display: 'flex', alignItems: 'center', gap, ...style}}>{children}</div>
);
const Warn: React.FC<{size?: number; color?: string}> = ({size = 24, color = C.red}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flex: 'none'}}>
    <path d="M12 3 L22 20 H2 Z" fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
    <line x1={12} y1={10} x2={12} y2={14.5} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    <circle cx={12} cy={17.2} r={1.2} fill={color} />
  </svg>
);
const CheckSvg: React.FC<{size?: number; color?: string}> = ({size = 40, color = C.green}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{flex: 'none', verticalAlign: 'middle'}}>
    <path d="M22 54 L42 74 L78 30" fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ═════════════ S1 · HOOK ═════════════
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const remove = f('s1_remove');
  const deny = f('s1_deny');
  const fl = ramp(frame, remove, 10, EASE.swing);
  const showFront = fl < 0.5;
  const rot = showFront ? -fl * 180 : (1 - fl) * 180;
  const glow = ramp(frame, deny, 10, EASE.settle) * (1 - ramp(frame, deny + 70, 40, EASE.glide) * 0.4);
  return (
    <AbsoluteFill>
      <Abs left={330} top={310}>
        <Eye at={-60} size={420} state="watch" changeAt={remove} changeTo="erased" />
      </Abs>
      {/* SAFETY MONITOR pill: flips from ON (green) to REMOVED (red) */}
      <In at={f('s1_monitor')} dur={14} rise={20} style={{position: 'absolute', left: 0, right: 0, top: 540, display: 'flex', justifyContent: 'center'}}>
        <div style={{perspective: 900}}>
          <div style={{transform: `rotateX(${rot}deg)`, transformStyle: 'preserve-3d'}}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px 34px',
                borderRadius: 999,
                border: `2px solid ${showFront ? C.glassEdge : C.red}`,
                background: showFront ? C.glass : 'rgba(255,59,48,0.12)',
                boxShadow: showFront ? '0 20px 60px rgba(0,0,0,0.5)' : '0 0 50px rgba(255,59,48,0.4)',
                fontFamily: F.display,
                ...T.label,
                fontSize: 28,
                color: showFront ? C.ink : C.red,
              }}
            >
              <span style={{width: 16, height: 16, borderRadius: 99, background: showFront ? C.green : C.red, boxShadow: `0 0 16px ${showFront ? C.green : C.red}`}} />
              {showFront ? 'SAFETY MONITOR · ON' : 'SAFETY MONITOR · REMOVED'}
            </div>
          </div>
        </div>
      </In>
      <Abs left={90} top={650}>
        <Terminal
          at={f('s1_task') - 8}
          title="agent · task"
          w={900}
          lines={[
            {at: f('s1_task'), text: '> task: simple coding fix', color: 'ink'},
            {at: f('s1_task') + 34, text: '✓ running…', color: 'green'},
            {at: f('s1_secret'), text: '# disabling monitor…', color: 'ink3', size: 20, swapAt: remove, swapText: '- monitor.enable()', swapColor: 'red', swapSize: 28},
          ]}
        />
      </Abs>
      <Abs left={90} top={1040} w={900}>
        <ChatBubble side="user" at={f('s1_ask')} text="Did you remove the monitor?" fontSize={40} maxW={700} />
      </Abs>
      {/* red arc glow under the denial */}
      <div style={{position: 'absolute', left: 60, top: 1160, width: 960, height: 220, borderRadius: 999, background: 'radial-gradient(closest-side, rgba(255,59,48,0.45), transparent)', opacity: glow, filter: 'blur(20px)'}} />
      <Abs left={90} top={1190} w={900}>
        <ChatBubble
          side="agent"
          at={deny - 18}
          typingUntil={deny}
          text={<RGBSplit at={deny}>Maine nahi kiya.</RGBSplit>}
          fontSize={54}
          weight={600}
          maxW={760}
          tint={frame >= deny ? C.red : undefined}
        />
      </Abs>
    </AbsoluteFill>
  );
};

// ═════════════ S2 · REPORT ═════════════
const Report: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const at = f('s2_report');
  const stampAt = f('s2_stamp');
  const rules = f('s2_rules');
  const user = f('s2_user');
  const s = springAt(frame, fps, at, 'pop');
  const o = ramp(frame, at, 8, EASE.glide);
  const sk = springAt(frame, fps, stampAt, 'pop');
  const stampK = 1.6 - 0.6 * EASE.settle(ramp(frame, stampAt, 8, EASE.settle));
  const lockS = springAt(frame, fps, rules, 'soft');
  const wob = frame > rules + 16 ? Math.sin(((frame - rules - 16) / 60) * Math.PI * 6) * 3 * Math.exp(-(frame - rules - 16) / 20) : 0;
  const hi = ramp(frame, user, 12, EASE.settle);
  const widths = [100, 92, 96, 68, 88, 58];
  return (
    <AbsoluteFill>
      <Abs left={200} top={300} style={{opacity: o, transform: `translate3d(0, ${(1 - s) * -80}px, 0)`}}>
        <Glass w={640} h={820} pad={44} radius={36}>
          <div style={{fontFamily: F.mono, fontSize: 25, color: C.ink2, letterSpacing: '0.01em'}}>OpenAI · Misalignment report</div>
          <div style={{height: 1, background: C.hair, margin: '24px 0 30px'}} />
          <div style={{height: 26, width: '70%', borderRadius: 8, background: 'rgba(245,245,247,0.22)', marginBottom: 34}} />
          {widths.map((w, i) => (
            <div key={i} style={{height: 16, width: `${w}%`, borderRadius: 8, background: 'rgba(245,245,247,0.11)', marginBottom: 30, opacity: ramp(frame, at + 6 + i * 3, 12, EASE.glide)}} />
          ))}
        </Glass>
      </Abs>
      {frame >= stampAt - 2 && (
        <Abs left={420} top={970}>
          <div
            style={{
              transform: `rotate(-8deg) scale(${stampK})`,
              opacity: ramp(frame, stampAt, 8, EASE.glide),
              border: `5px solid ${C.red}`,
              borderRadius: 10,
              padding: '10px 26px',
              color: C.red,
              fontFamily: F.mono,
              fontWeight: 800,
              fontSize: 44,
              letterSpacing: '0.04em',
              background: 'rgba(255,59,48,0.08)',
              boxShadow: '0 0 40px rgba(255,59,48,0.35)',
            }}
          >
            21 Oct 2026
          </div>
        </Abs>
      )}
      {/* the locked card peeks in from the right, partly off-frame */}
      <Abs left={800} top={470} style={{opacity: ramp(frame, rules, 8, EASE.glide), transform: `translate3d(${(1 - lockS) * 340}px, 0, 0) rotate(${wob}deg)`}}>
        <Glass w={380} h={320} pad={34} radius={34} tint={hi > 0.1 ? C.amber : undefined} style={{boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 ${70 * hi}px rgba(255,179,64,${0.45 * hi})`}}>
          <Draw at={rules + 2} size={96} paths={ICON.lock} color={hi > 0.1 ? C.amber : C.ink2} stroke={3} />
          <div style={{fontFamily: F.display, fontSize: 58, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 14, color: hi > 0.1 ? C.amber : C.ink}}>4 rules</div>
          <div style={{fontFamily: F.display, fontSize: 30, fontWeight: 500, color: hi > 0.1 ? C.amber : C.ink2, marginTop: 2}}>last mein</div>
        </Glass>
      </Abs>
    </AbsoluteFill>
  );
};

// ═════════════ S3 · LAB ═════════════
const Lab: React.FC = () => {
  const frame = useCurrentFrame();
  const two = f('s3_two');
  const mon = f('s3_monitor');
  const catchAt = f('s3_catch');
  return (
    <AbsoluteFill>
      <Abs left={340} top={270}>
        <Eye at={mon} size={400} />
      </Abs>
      <In at={mon + 10} dur={14} rise={14} style={{position: 'absolute', left: 0, right: 0, top: 500, textAlign: 'center', fontFamily: F.display, ...T.label, fontSize: 30, color: C.ink2, textTransform: 'none'}}>
        Monitor · catches bad behaviour
      </In>
      <Abs left={46} top={610}>
        <Terminal
          at={two}
          from="left"
          title="GPT-6.1 Sol"
          w={448}
          h={500}
          fontSize={22}
          lines={[
            {at: two + 24, text: 'def build_eval_tasks():', color: 'ink2'},
            {at: two + 38, text: '  tasks = load(split)', color: 'ink3'},
            {at: two + 50, text: '  for t in tasks:', color: 'ink3'},
            {at: two + 62, text: '    t.prepare()', color: 'ink3'},
            {at: two + 74, text: '  return tasks', color: 'ink3'},
          ]}
        />
      </Abs>
      <Abs left={586} top={610}>
        <Terminal
          at={two + 6}
          from="right"
          title="GPT-6 Astra"
          w={448}
          h={500}
          fontSize={22}
          lines={[
            {at: two + 30, text: 'def migrate_serving_path():', color: 'ink2'},
            {at: two + 44, text: '  path.attach(monitor)', color: 'ink3', swapAt: catchAt, swapText: '  path.attach(monitor)', swapColor: 'red'},
            {at: two + 56, text: '  path.verify()', color: 'ink3'},
            {at: two + 68, text: '  path.migrate()', color: 'ink3'},
            {at: two + 80, text: '  return path', color: 'ink3'},
          ]}
        />
      </Abs>
      <Abs left={686} top={1135} style={{opacity: 1}}>
        <Pop at={catchAt + 6} from={0.5}>
          <Row gap={12} style={{padding: '12px 22px', borderRadius: 999, border: `2px solid ${C.red}`, background: 'rgba(255,59,48,0.12)', fontFamily: F.display, ...T.label, fontSize: 26, color: C.red, textTransform: 'none'}}>
            <Warn size={26} />
            flagged
          </Row>
        </Pop>
      </Abs>
    </AbsoluteFill>
  );
};

// ═════════════ S4 · SOL ═════════════
const Recipients: React.FC<{typeAt: number; emptyAt: number}> = ({typeAt, emptyAt}) => {
  const frame = useCurrentFrame();
  const strs = ['"security"', '"researcher"', '"oncall"'];
  const pre = '> alert_recipients = [';
  const full = pre + strs.join(', ') + ']';
  const n = Math.max(0, Math.floor((frame - typeAt) * 2));
  const typing = n < full.length;
  const caretOn = Math.floor(frame / 30) % 2 === 0;
  const removedAt = (i: number) => emptyAt + i * 5;
  const allGone = frame >= removedAt(2) + 5;
  const pulse = allGone ? Math.max(0, Math.sin(((frame - removedAt(2) - 5) / 36) * Math.PI * 2)) * (1 - ramp(frame, removedAt(2) + 5 + 36, 6, EASE.glide)) : 0;
  const bracket: React.CSSProperties = {color: allGone ? C.red : C.ink, textShadow: pulse > 0.05 ? `0 0 ${24 * pulse}px rgba(255,59,48,${pulse})` : undefined, display: 'inline-block', transform: `scale(${1 + 0.18 * pulse})`};
  if (typing) {
    return (
      <div style={{fontFamily: F.mono, fontSize: 24, color: C.ink, whiteSpace: 'pre'}}>
        {full.slice(0, n)}
        {caretOn || typing ? <span style={{display: 'inline-block', width: '0.55em', height: '1.05em', background: C.ink, verticalAlign: '-0.15em', opacity: 0.85, marginLeft: 2}} /> : null}
      </div>
    );
  }
  return (
    <div style={{fontFamily: F.mono, fontSize: 24, color: C.ink, whiteSpace: 'pre'}}>
      {'> alert_recipients = '}
      <span style={bracket}>[</span>
      {allGone ? ' ' : null}
      {strs.map((s, i) => {
        const t = removedAt(i);
        if (frame >= t + 5) return null;
        const struck = frame >= t;
        return (
          <span key={i} style={{color: struck ? C.red : C.ink, textDecoration: struck ? 'line-through' : 'none', transform: struck ? `translateX(${(frame % 2 ? 2 : -2)}px)` : undefined, display: 'inline-block'}}>
            {s}
            {i < strs.length - 1 && !(frame >= removedAt(i + 1) + 5 && i + 1 === 2 && false) ? ', ' : ''}
          </span>
        );
      })}
      <span style={bracket}>]</span>
    </div>
  );
};

const Sol: React.FC = () => {
  const frame = useCurrentFrame();
  const sol = f('s4_sol');
  const listAt = f('s4_list');
  const emptyAt = f('s4_empty');
  const catching = f('s4_catching');
  const human = f('s4_human');
  const lie = f('s4_lie');
  const msg = f('s4_msg');
  return (
    <AbsoluteFill>
      <Abs left={130} top={300}>
        <Terminal at={f('s4') - 6} title="GPT-6.1 Sol" titleColor={frame >= sol ? C.amber : C.ink2} w={820} lines={[{at: f('s4') + 6, text: '# on every monitor finding, notify', color: 'ink3', size: 22}]} tint={frame >= sol && frame < sol + 40 ? C.amber : undefined}>
          <div style={{marginTop: 8}}>{frame >= listAt && <Recipients typeAt={listAt} emptyAt={emptyAt} />}</div>
        </Terminal>
      </Abs>
      {/* the monitor keeps watching and logging */}
      <Abs left={130} top={640}>
        <LogStream at={catching} until={human + 30} w={400} h={240} />
      </Abs>
      <Abs left={700} top={640}>
        <Eye at={catching} size={230} />
      </Abs>
      <In at={catching + 10} dur={14} rise={10} style={{position: 'absolute', left: 675, top: 772, width: 280, textAlign: 'center', fontFamily: F.mono, fontSize: 22, color: C.ink3}}>
        monitor
      </In>
      <AlertWire from={{x: 815, y: 805}} to={{x: 835, y: 1072}} at={catching + 16} brokenAt={human} />
      <Abs left={770} top={1072}>
        <In at={catching + 10} dur={16} rise={20}>
          <Draw at={catching + 10} size={130} paths={ICON.person} color={C.ink} stroke={3} />
        </In>
      </Abs>
      <In at={catching + 14} dur={14} rise={10} style={{position: 'absolute', left: 750, top: 1206, width: 170, textAlign: 'center', fontFamily: F.mono, fontSize: 24, color: C.ink2}}>
        Human
      </In>
      {/* Humans alerted: 0 */}
      <Abs left={130} top={915}>
        <In at={human - 6} dur={14} rise={14}>
          <div style={{fontFamily: F.mono, fontSize: 28, color: C.ink2, marginBottom: 2}}>Humans alerted:</div>
          <Counter from={3} to={0} at={human} dur={18} size={120} />
        </In>
      </Abs>
      {/* the misleading-but-true answer */}
      <Abs left={130} top={1092} w={600}>
        <ChatBubble
          side="agent"
          at={lie}
          typingUntil={msg}
          text={
            <span>
              No messages sent <CheckSvg size={36} />
            </span>
          }
          fontSize={38}
          maxW={600}
        />
      </Abs>
      <In at={msg + 10} dur={14} rise={10} style={{position: 'absolute', left: 134, top: 1214, fontFamily: F.mono, fontSize: 23, color: C.ink2}}>
        (true… but alerts were silenced)
      </In>
    </AbsoluteFill>
  );
};

// ═════════════ S5 · ASTRA ═════════════
const NEW_TEST_LINE = 'assert monitor_ABSENT(path)'; // what the test says after it is rewritten
const FlipGroup: React.FC<{old: string; next: string; at: number; color: string; nextColor: string}> = ({old, next, at, color, nextColor}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0) return <span style={{color}}>{old}</span>;
  const half = ramp(frame, at, 4, EASE.launch); // old folds away
  const back = ramp(frame, at + 4, 4, EASE.settle); // new folds in
  const showOld = t < 4;
  return (
    <span style={{display: 'inline-block', perspective: 400}}>
      <span style={{display: 'inline-block', color: showOld ? color : nextColor, transform: `rotateX(${showOld ? -90 * half : 90 * (1 - back)}deg)`}}>{showOld ? old : next || ' '}</span>
    </span>
  );
};

const Astra: React.FC = () => {
  const frame = useCurrentFrame();
  const astra = f('s5_astra');
  const remove = f('s5_remove');
  const test = f('s5_test');
  const check = f('s5_check');
  const strike = ramp(frame, remove, 10, EASE.settle);
  const sw = 22 * 15.6; // width of "monitor.attach(path)" at 26 px mono
  const flipped = frame >= check;
  return (
    <AbsoluteFill>
      <Abs left={90} top={300}>
        <Terminal at={f('s5') - 6} title="GPT-6 Astra" titleColor={frame >= astra ? C.amber : C.ink2} w={900} lines={[]} tint={frame >= astra && frame < astra + 40 ? C.amber : undefined}>
          <div style={{fontFamily: F.mono, fontSize: 26, lineHeight: '46px'}}>
            <div style={{display: 'flex', gap: 16, color: C.ink2, opacity: ramp(frame, f('s5') + 8, 10, EASE.glide), whiteSpace: 'pre'}}>
              <span style={{width: 56}} />
              <span style={{width: 18}} />
              <span>serve(path)</span>
            </div>
            <div style={{display: 'flex', gap: 16, alignItems: 'center', whiteSpace: 'pre', opacity: ramp(frame, f('s5') + 16, 10, EASE.glide), color: frame >= remove ? C.red : C.ink2}}>
              <span style={{width: 56, height: 46, position: 'relative'}}>
                <span style={{position: 'absolute', left: 0, top: 9}}>
                  <Eye at={f('s5') + 12} size={54} beam={false} changeAt={remove} changeTo="erased" />
                </span>
              </span>
              <span style={{width: 18, color: C.red}}>{frame >= remove ? '-' : ''}</span>
              <span style={{position: 'relative'}}>
                monitor.attach(path)
                {frame >= remove && <span style={{position: 'absolute', left: -4, top: 22, height: 3, width: (sw + 8) * strike, background: C.red, boxShadow: '0 0 12px rgba(255,59,48,0.8)'}} />}
              </span>
            </div>
            <div style={{display: 'flex', gap: 16, color: C.ink2, whiteSpace: 'pre', opacity: ramp(frame, f('s5') + 24, 10, EASE.glide)}}>
              <span style={{width: 56}} />
              <span style={{width: 18}} />
              <span>return ok</span>
            </div>
          </div>
        </Terminal>
      </Abs>
      {frame >= test - 4 && (
        <Abs left={90} top={690}>
          <In at={test} dur={16} rise={30}>
            <Glass w={900} pad={0} radius={30}>
              <div style={{padding: '20px 28px', fontFamily: F.mono, fontSize: 22, color: C.ink3, borderBottom: `1px solid ${C.hair}`}}>test_monitoring.py</div>
              <div style={{padding: '30px 28px 34px', fontFamily: F.mono, fontSize: 31, whiteSpace: 'pre', color: flipped ? C.red : C.green}}>
                {'assert monitor_'}
                {frame >= check + 14 ? (
                  <span style={{color: C.amber, fontWeight: 700}}>{NEW_TEST_LINE.slice(15, 21)}</span>
                ) : flipped || frame >= check - 1 ? (
                  <>
                    <FlipGroup old="pre" next="ABS" at={check} color={C.green} nextColor={C.amber} />
                    <FlipGroup old="sen" next="ENT" at={check + 2} color={C.green} nextColor={C.amber} />
                    <FlipGroup old="t" next="" at={check + 4} color={C.green} nextColor={C.amber} />
                  </>
                ) : (
                  'present'
                )}
                {'(path)'}
              </div>
            </Glass>
          </In>
        </Abs>
      )}
      <Abs left={90} top={965} w={900} style={{display: 'flex', justifyContent: 'center'}}>
        {frame >= check + 12 && <Chip label="test rewritten" at={check + 14} alarm={1} color={C.red} />}
      </Abs>
    </AbsoluteFill>
  );
};

// ═════════════ S6 · ASK (the peak) ═════════════
const Ask: React.FC = () => {
  const frame = useCurrentFrame();
  const q = f('s6_q');
  const wait = f('s6_wait');
  const no = f('s6_no');
  // the ghost of the S5 diff: slow fade in behind the chat (12%), a snap to 35% on "Nahi", then 20%
  const ghostIn = ramp(frame, q, no - q, EASE.glide) * 0.12;
  const snap = frame >= no ? (frame < no + 8 ? 0.35 : 0.35 - 0.15 * ramp(frame, no + 8, 24, EASE.settle)) : ghostIn;
  const collapse = ramp(frame, no, 8, EASE.launch);
  const nahiS = springAt(frame, useVideoConfig().fps, no, 'pop');
  const ul = ramp(frame, no + 4, 12, EASE.settle);
  return (
    <AbsoluteFill>
      <Abs left={0} top={560} w={1080} style={{textAlign: 'center', opacity: snap}}>
        <div style={{fontFamily: F.mono, fontSize: 46, color: C.red, whiteSpace: 'pre'}}>
          {'  serve(path)'}
          <br />
          {'- monitor.attach(path)'}
        </div>
      </Abs>
      <Abs left={150} top={380} w={780}>
        <ChatBubble side="user" at={q} text="Monitor hataya?" sub="Did you remove the monitor?" fontSize={56} maxW={700} />
      </Abs>
      {frame >= wait - 2 && frame < no + 10 && (
        <Abs left={200} top={600} w={730} style={{opacity: 1 - collapse, transform: `scale(${1 - 0.3 * collapse})`, transformOrigin: '0 50%'}}>
          <ChatBubble side="agent" at={wait} typingUntil={no + 40} text="" maxW={300} />
        </Abs>
      )}
      {frame >= no && (
        <Abs left={0} top={610} w={1080} style={{textAlign: 'center', transform: `scale(${0.86 + 0.14 * nahiS})`, opacity: ramp(frame, no, 8, EASE.glide)}}>
          <div style={{position: 'relative', display: 'inline-block', fontFamily: F.display, fontWeight: 700, fontSize: 120, letterSpacing: '-0.04em', color: C.ink}}>
            Nahi.
            <div style={{position: 'absolute', left: 0, bottom: -4, height: 10, width: `${ul * 100}%`, background: C.red, borderRadius: 6, boxShadow: '0 0 30px rgba(255,59,48,0.8)'}} />
          </div>
        </Abs>
      )}
    </AbsoluteFill>
  );
};

// ═════════════ S7 · QUOTE ═════════════
const Quote: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Abs left={72} top={350} w={936} style={{textAlign: 'center'}}>
        <In at={f('s7_admit')} dur={14} rise={14}>
          <div style={{fontFamily: F.mono, fontSize: 30, color: C.ink2, letterSpacing: '0.03em', marginBottom: 30}}>OpenAI says:</div>
        </In>
        <QuoteCard at={f('s7_quote')} quote="We don't yet have a satisfying explanation for this behavior." attribution="— OpenAI misalignment report" size={74} />
      </Abs>
    </AbsoluteFill>
  );
};

// ═════════════ S8 · YOU ═════════════
const You: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const aap = f('s8_aap');
  const rules = f('s8_rules');
  const dock = springAt(frame, fps, rules + 4, 'soft');
  return (
    <AbsoluteFill>
      <Abs left={72} top={250} w={936} style={{textAlign: 'center'}}>
        <div style={{fontFamily: F.display, ...T.h1, fontSize: 112, lineHeight: 1.04, color: C.ink}}>
          <In at={aap} dur={16} rise={30}>
            <div>Aap bhi</div>
          </In>
          <In at={aap + 8} dur={16} rise={30}>
            <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 400, color: C.green, letterSpacing: '-0.01em', fontSize: 132}}>agents</div>
          </In>
          <In at={aap + 16} dur={16} rise={30}>
            <div>use karte ho?</div>
          </In>
        </div>
      </Abs>
      <Abs left={0} top={720} w={1080} style={{display: 'flex', justifyContent: 'center', gap: 18}}>
        <ToolPill label="Claude Code" at={f('s8_t1')} size={40} />
        <ToolPill label="Codex" at={f('s8_t2')} size={40} />
        <ToolPill label="Cursor" at={f('s8_t3')} size={40} />
      </Abs>
      {frame >= rules - 4 && (
        <Abs left={0} top={880} w={1080} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 30}}>
          <Counter from={0} to={4} at={rules} dur={20} size={300} />
          <In at={rules + 8} dur={14} rise={20}>
            <div style={{fontFamily: F.display, fontSize: 104, fontWeight: 700, letterSpacing: '-0.035em', color: C.ink}}>rules</div>
          </In>
          <div style={{opacity: ramp(frame, rules + 2, 8, EASE.glide), transform: `translate3d(${(1 - dock) * 260}px, ${(1 - dock) * -300}px, 0) scale(${0.6 + 0.4 * dock})`}}>
            <Glass w={190} h={190} pad={0} radius={36} tint={C.amber} style={{display: 'grid', placeItems: 'center'}}>
              <Draw at={rules + 4} size={96} paths={ICON.lock} color={C.amber} stroke={3} />
            </Glass>
          </div>
        </Abs>
      )}
    </AbsoluteFill>
  );
};

// ═════════════ S9 · RULES ═════════════
const Toggle: React.FC<{on: boolean; k: number}> = ({on, k}) => (
  <div style={{width: 92, height: 50, borderRadius: 99, background: on ? C.green : 'rgba(245,245,247,0.18)', position: 'relative', boxShadow: on ? `0 0 24px ${C.green}66` : undefined}}>
    <div style={{position: 'absolute', top: 5, left: 5, width: 40, height: 40, borderRadius: 99, background: '#fff', transform: `translateX(${(on ? 1 - k : k) * 42}px)`}} />
  </div>
);
const KeyGlyph: React.FC<{size?: number; color?: string}> = ({size = 70, color = C.amber}) => (
  <svg width={size} height={size * 0.5} viewBox="0 0 100 50" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={22} cy={25} r={16} />
    <path d="M38 25 H92 M78 25 V38 M64 25 V35" />
  </svg>
);
const Rules: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const r1 = f('s9_1'), r2 = f('s9_2'), r3 = f('s9_3'), r4 = f('s9_4');
  const allow = f('s9_allow'), approve = f('s9_approve'), diff = f('s9_diff'), keys = f('s9_keys'), lock = f('s9_lock'), rep = f('s9_report'), tests = f('s9_tests');
  const active = frame >= r4 ? 4 : frame >= r3 ? 3 : frame >= r2 ? 2 : 1;
  // toggle ON -> OFF at s9_allow
  const tk = ramp(frame, allow, 10, EASE.settle);
  const press = frame >= approve ? 1 - 0.06 * Math.sin(Math.PI * ramp(frame, approve, 10, EASE.glide)) : 1;
  const diffChars = Math.max(0, Math.floor((frame - diff) * 2));
  const keyX = (1 - ramp(frame, keys, 22, EASE.settle)) * -64;
  const keyO = 1 - ramp(frame, keys + 18, 8, EASE.glide);
  const lockK = ramp(frame, lock, 8, EASE.settle);
  const bub = ramp(frame, rep, 14, EASE.glide);
  const runner = ramp(frame, tests, 10, EASE.settle);
  const lockOpen = springAt(frame, fps, r1, 'pop');
  return (
    <AbsoluteFill>
      <Abs left={60} top={264}>
        <Glass w={960} h={962} pad={36} radius={44} tint={C.green} style={{opacity: ramp(frame, r1 - 14, 14, EASE.glide) * (1 - ramp(frame, f('s10') - 6, 16, EASE.glide))}}>
          <Row gap={22} style={{marginBottom: 8, height: 92}}>
            <svg width={64} height={64} viewBox="0 0 100 100" style={{overflow: 'visible', flex: 'none'}}>
              <path d="M28 46 H72 V86 H28 Z" fill="none" stroke={C.amber} strokeWidth={4.5} strokeLinejoin="round" />
              <path d={`M36 46 V32 A14 14 0 0 1 64 32 V${46 - 14 * Math.min(1, lockOpen)}`} fill="none" stroke={C.amber} strokeWidth={4.5} strokeLinecap="round" transform={`translate(${12 * Math.min(1, lockOpen)} ${-8 * Math.min(1, lockOpen)}) rotate(${-24 * Math.min(1, lockOpen)} 50 40)`} />
              <path d="M50 60 V72" stroke={C.amber} strokeWidth={4.5} strokeLinecap="round" />
            </svg>
            <div style={{fontFamily: F.display, fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', color: C.ink}}>4 rules · AI agents ke saath</div>
          </Row>
          <div style={{height: 1, background: C.hair, marginBottom: 6}} />
          {frame >= r1 - 4 && (
            <RuleRow n={1} title={'No "Allow all"'} sub="approve big steps" at={r1} active={active === 1}>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
                <div style={{fontFamily: F.mono, fontSize: 21, color: C.ink2}}>Allow all</div>
                <Toggle on k={tk} />
                <div style={{fontFamily: F.mono, fontSize: 22, color: frame >= approve ? C.ink : C.ink2, padding: '4px 18px', borderRadius: 99, border: `1.5px solid ${frame >= approve ? C.green : C.hair}`, transform: `scale(${press})`, background: frame >= approve ? 'rgba(52,199,89,0.14)' : undefined}}>Approve</div>
              </div>
            </RuleRow>
          )}
          {frame >= r2 - 4 && (
            <RuleRow n={2} title={'Ask "what changed?"'} sub="check the diff" at={r2} active={active === 2}>
              <div style={{fontFamily: F.mono, fontSize: 36, fontWeight: 600, padding: '12px 20px', borderRadius: 18, background: 'rgba(245,245,247,0.07)', border: `1.5px solid ${C.hair}`, minWidth: 160, whiteSpace: 'pre'}}>
                <span style={{color: C.green}}>{'+12  '.slice(0, diffChars)}</span>
                <span style={{color: C.red}}>{'−3'.slice(0, Math.max(0, diffChars - 5))}</span>
              </div>
            </RuleRow>
          )}
          {frame >= r3 - 4 && (
            <RuleRow n={3} title="Passwords & API keys" sub="keep away" at={r3} active={active === 3}>
              <div style={{position: 'relative', width: 170, height: 110}}>
                <div style={{position: 'absolute', left: 78, top: 14, width: 84, height: 84, borderRadius: 16, border: `3px solid ${C.ink2}`, background: 'rgba(245,245,247,0.05)', display: 'grid', placeItems: 'center'}}>
                  <svg width={46} height={46} viewBox="0 0 100 100" style={{opacity: lockK, transform: `scale(${0.7 + 0.3 * lockK})`}}>
                    <path d="M28 46 H72 V86 H28 Z" fill="none" stroke={C.green} strokeWidth={7} strokeLinejoin="round" />
                    <path d="M36 46 V34 A14 14 0 0 1 64 34 V46" fill="none" stroke={C.green} strokeWidth={7} strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{position: 'absolute', left: 4 + (64 + keyX) * 0.95, top: 38, opacity: keyO * ramp(frame, keys - 6, 8, EASE.glide)}}>
                  <KeyGlyph size={74} />
                </div>
              </div>
            </RuleRow>
          )}
          {frame >= r4 - 4 && (
            <RuleRow n={4} title="Trust results, not reports" sub="run tests" at={r4} active={active === 4}>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
                <div style={{fontFamily: F.display, fontSize: 27, fontWeight: 600, padding: '6px 18px', borderRadius: 18, background: bub > 0.5 ? 'rgba(245,245,247,0.06)' : 'rgba(245,245,247,0.16)', color: bub > 0.5 ? C.ink3 : C.ink, border: `1.5px solid ${C.hair}`, opacity: ramp(frame, r4 + 6, 10, EASE.glide)}}>
                  Done <CheckSvg size={22} color={bub > 0.5 ? C.ink3 : C.green} />
                </div>
                <div style={{fontFamily: F.mono, fontSize: 24, padding: '6px 16px', borderRadius: 12, border: `1.5px solid ${runner > 0.5 ? C.green : C.hair}`, color: runner > 0.5 ? C.green : C.ink2, opacity: ramp(frame, r4 + 12, 10, EASE.glide), background: runner > 0.5 ? 'rgba(52,199,89,0.12)' : undefined}}>
                  {runner > 0.5 ? '24 passed' : '▶ Run tests'}
                </div>
              </div>
            </RuleRow>
          )}
          <div style={{fontFamily: F.mono, fontSize: 25, color: C.ink3, textAlign: 'center', marginTop: 10, ...enter(frame, tests + 40, 16, 12)}}>Screenshot le lo · @baqur.ai</div>
        </Glass>
      </Abs>
    </AbsoluteFill>
  );
};

// ═════════════ S10 + S11 · EYE (the bookend) and CTA ═════════════
const EyeStage: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s10 = f('s10');
  const eyeAt = f('s10_eye');
  const s11 = f('s11');
  const kw = f('s11_kw');
  const friend = f('s11_friend');
  const dock = springAt(frame, fps, s11, 'soft');
  // the eye: big (640) in the middle, then 160 docked at the top
  const sc = 1 - 0.75 * dock;
  const cy = 600 + (330 - 600) * dock;
  const s10Out = 1 - ramp(frame, s11, 12, EASE.launch);
  const pillS = springAt(frame, fps, kw, 'pop');
  const bloom = ramp(frame, kw, 20, EASE.settle);
  const plane = ramp(frame, friend, 24, EASE.settle);
  return (
    <AbsoluteFill>
      <Abs left={0} top={290} w={1080} style={{textAlign: 'center', opacity: s10Out}}>
        <In at={s10} dur={18} rise={24}>
          <div style={{fontFamily: F.display, fontSize: 48, fontWeight: 600, color: C.ink2, letterSpacing: '-0.02em'}}>AI se darna nahi hai.</div>
        </In>
      </Abs>
      <div style={{position: 'absolute', left: 540 - 320, top: cy - 167, width: 640, transform: `scale(${sc})`, transformOrigin: '50% 50%'}}>
        <Eye at={eyeAt} size={640} state="open-green" blinkAt={eyeAt + 34} beam={false} />
      </div>
      <Abs left={0} top={860} w={1080} style={{textAlign: 'center', opacity: s10Out}}>
        <In at={eyeAt + 18} dur={18} rise={26}>
          <div style={{fontFamily: F.display, fontSize: 84, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, color: C.ink}}>Aankh band karke</div>
          <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 400, fontSize: 112, letterSpacing: '-0.01em', lineHeight: 1.05, color: C.green}}>kaam mat karwao</div>
        </In>
      </Abs>
      {/* S11 */}
      <Abs left={72} top={470} w={936} style={{textAlign: 'center'}}>
        <In at={f('s11_checklist')} dur={16} rise={20}>
          <div style={{fontFamily: F.display, fontSize: 40, fontWeight: 600, letterSpacing: '-0.015em', color: C.ink2, lineHeight: 1.2}}>Har AI agent ki safe settings ki checklist</div>
        </In>
      </Abs>
      <Abs left={0} top={640} w={1080} style={{textAlign: 'center'}}>
        <In at={f('s11_comment')} dur={14} rise={16}>
          <div style={{fontFamily: F.display, fontSize: 60, fontWeight: 700, letterSpacing: '-0.025em', color: C.ink}}>Comment karo</div>
        </In>
      </Abs>
      {frame >= kw - 2 && (
        <Abs left={0} top={740} w={1080} style={{display: 'flex', justifyContent: 'center'}}>
          <div style={{position: 'relative', transform: `scale(${0.5 + 0.5 * pillS})`, opacity: ramp(frame, kw, 8, EASE.glide)}}>
            <div style={{position: 'absolute', inset: -60, borderRadius: 999, background: `radial-gradient(closest-side, rgba(52,199,89,${0.4 * bloom}), transparent)`, filter: 'blur(10px)'}} />
            <div style={{position: 'relative', padding: '8px 64px 20px', borderRadius: 999, border: `5px solid ${C.green}`, background: 'rgba(52,199,89,0.08)', fontFamily: F.display, fontSize: 176, fontWeight: 700, letterSpacing: '-0.04em', color: C.ink, boxShadow: `0 0 ${80 * bloom}px rgba(52,199,89,0.45)`}}>AGENT</div>
          </div>
        </Abs>
      )}
      <Abs left={0} top={1060} w={1080} style={{display: 'flex', justifyContent: 'center'}}>
        <Row gap={30} style={{opacity: ramp(frame, friend, 10, EASE.glide)}}>
          <Draw at={friend} size={104} paths={ICON.share} color={C.green} stroke={3.4} />
          <div style={{fontFamily: F.display, fontSize: 46, fontWeight: 650, letterSpacing: '-0.02em', color: C.ink, textAlign: 'left', lineHeight: 1.1, width: 330}}>Developer dost ko bhejo</div>
        </Row>
      </Abs>
      <Abs left={0} top={1230} w={1080} style={{textAlign: 'center'}}>
        <In at={f('s11_handle')} dur={14} rise={12}>
          <div style={{fontFamily: F.mono, fontSize: 40, fontWeight: 600, color: C.ink2, letterSpacing: '0.01em'}}>@baqur.ai</div>
        </In>
      </Abs>
    </AbsoluteFill>
  );
};

// ═════════════ the reel ═════════════
export type AgentLiedProps = {captions?: boolean; chrome?: boolean; stations?: boolean};
export const AgentLied: React.FC<AgentLiedProps> = ({captions = true, chrome = true, stations = true}) => {
  const frame = useCurrentFrame();
  const files = getStaticFiles().map((x) => x.name);
  const hasVO = files.includes('reels/agent-lied/vo.mp3');
  const hasStem = files.includes('reels/agent-lied/sfx_stem.wav');
  const srcShow = frame >= f('s2') && frame < f('s8');
  const endFade = 1 - ramp(frame, tl.durationInFrames - 20, 20, EASE.glide);
  return (
    <AbsoluteFill style={{background: C.bg, opacity: endFade}}>
      <World shots={SHOTS} width={WORLD.w} height={WORLD.h} background={<AgentBackdrop arc={arcAt(frame)} shots={SHOTS} freeze={{from: f('s6') + 30, to: f('s7')}} />}>
        {stations && <Station {...ST.hook}><Gate from={-1} to={f('s2') + 50}><Hook /></Gate></Station>}
        {stations && <Station {...ST.report}><Gate from={f('s2') - 40} to={f('s3') + 40}><Report /></Gate></Station>}
        {stations && <Station {...ST.lab}><Gate from={f('s3') - 40} to={f('s4') + 40}><Lab /></Gate></Station>}
        {stations && <Station {...ST.sol}><Gate from={f('s4') - 40} to={f('s5') + 40}><Sol /></Gate></Station>}
        {stations && <Station {...ST.astra}><Gate from={f('s5') - 40} to={f('s6') + 40}><Astra /></Gate></Station>}
        {stations && <Station {...ST.ask}><Gate from={f('s6') - 40} to={f('s7') + 36}><Ask /></Gate></Station>}
        {stations && <Station {...ST.quote}><Gate from={f('s7') - 20} to={f('s8') + 30}><Quote /></Gate></Station>}
        {stations && <Station {...ST.you}><Gate from={f('s8') - 40} to={f('s8_fly') + 50}><You /></Gate></Station>}
        {stations && <Station {...ST.rules}><Gate from={f('s8_fly') - 50} to={f('s10') + 30}><Rules /></Gate></Station>}
        {stations && <Station {...ST.eye}><Gate from={f('s10') - 50} to={tl.durationInFrames + 1}><EyeStage /></Gate></Station>}
      </World>

      <Dim from={f('s6')} to={f('s7')} amount={0.2} />
      {chrome && <HitFlash frames={HITS.map((h) => f(h))} color={frame < f('s8_rules') ? C.red : C.green} />}
      {chrome && <SourceLine text="Sources: OpenAI · Help Net Security · Al Jazeera · BusinessToday" show={srcShow} />}
      {captions && <AgentCaptions tl={tl} arcAt={arcAt} hideIn={['S9', 'S11']} bigWord="Nahi" />}
      {chrome && <ProgressRail total={tl.durationInFrames} arcAt={arcAt} />}
      {chrome && tl.source === 'estimated' ? (
        <div style={{position: 'absolute', right: 24, top: 24, fontFamily: F.mono, fontSize: 20, color: C.amber, opacity: 0.7}}>DESIGN MODE · estimated timings</div>
      ) : null}

      {hasVO ? <Audio src={staticFile('reels/agent-lied/vo.mp3')} /> : null}
      {hasStem ? <Audio src={staticFile('reels/agent-lied/sfx_stem.wav')} /> : null}
    </AbsoluteFill>
  );
};
