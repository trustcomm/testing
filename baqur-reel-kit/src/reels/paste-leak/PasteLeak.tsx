// ─────────────────────────────────────────────────────────────
// Reel #1 built on the kit: "Ek paste, 3,182 log" (keyword SAFE)
// Everything is timed from cues (cues.json → timeline.json). No magic numbers for timing.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import {AbsoluteFill, Audio, getStaticFiles, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F, T, SAFE} from '../../core/tokens';
import {EASE, enter, ramp, springAt} from '../../core/motion';
import {Shot, Station, World} from '../../core/camera';
import {makeTL} from '../../core/timeline';
import {
  Backdrop,
  Captions,
  Chip,
  Counter,
  Draw,
  Glass,
  Headline,
  HitFlash,
  ICON,
  In,
  Kicker,
  ListRow,
  Mark,
  Pop,
  ProgressRail,
  SourceLine,
} from '../../scenes/primitives';
import timelineJson from './timeline.json';
import type {TimelineJSON} from '../../core/timeline';

const tl = makeTL(timelineJson as TimelineJSON);
export const PASTE_LEAK_DURATION = tl.durationInFrames;

// ── World layout (stations) ──────────────────────────────────
export const WORLD = {w: 4400, h: 10200};
const ST = {
  hook: {x: 1200, y: 1300},
  tease: {x: 3300, y: 1800},
  hospital: {x: 1200, y: 3500},
  chips: {x: 1200, y: 5000},
  letters: {x: 3250, y: 4700},
  you: {x: 1250, y: 6500},
  list: {x: 3100, y: 7400},
  safe: {x: 1250, y: 8700},
  settings: {x: 1250, y: 9150},
  cta: {x: 3150, y: 9450},
};

// Fly so the midpoint (and the whoosh peak) lands on the cue.
const flyTo = (cue: string, p: {x: number; y: number}, zoom = 1, dur = 54): Shot => ({
  at: tl.f(cue) - Math.round(dur / 2),
  x: p.x,
  y: p.y,
  zoom,
  move: 'FLY-TO',
  dur,
});
const punch = (cue: string): Shot => ({at: tl.f(cue), x: 0, y: 0, zoom: 1, move: 'PUNCH'});

const SHOTS: Shot[] = [
  {at: 0, x: ST.hook.x, y: ST.hook.y - 260, zoom: 1.7, move: 'CUT'},
  {at: 2, x: ST.hook.x, y: ST.hook.y, zoom: 1.0, move: 'PULL', dur: Math.max(40, tl.f('s1_counter') - 2)},
  punch('s1_leak'),
  flyTo('s2', ST.tease, 1.05),
  {at: tl.f('s2_miss'), x: ST.tease.x, y: ST.tease.y, zoom: 1.12, move: 'PUSH', dur: 60},
  flyTo('s3', ST.hospital, 1.0, 60),
  {at: tl.f('s3_sheet'), x: ST.hospital.x, y: ST.hospital.y + 80, zoom: 1.08, move: 'PUSH', dur: 70},
  punch('s3_ai'),
  {at: tl.f('s4') - 18, x: ST.chips.x, y: ST.chips.y, zoom: 1.0, move: 'PUSH', dur: 36},
  punch('s4_all'),
  flyTo('s5', ST.letters, 1.0),
  flyTo('s6', ST.you, 1.0),
  punch('s6_aap'),
  {at: tl.f('s6_ai') - 10, x: ST.you.x, y: ST.you.y + 120, zoom: 1.12, move: 'PUSH', dur: 40},
  flyTo('s7', ST.list, 0.96, 60),
  punch('s7_five'),
  {at: tl.f('s8_1'), x: ST.list.x, y: ST.list.y + 40, zoom: 1.0, move: 'PUSH', dur: tl.seg('S8').dur},
  flyTo('s9', ST.safe, 1.0, 60),
  {at: tl.f('s10_settings') - 20, x: ST.settings.x, y: ST.settings.y, zoom: 1.08, move: 'PUSH', dur: 40},
  punch('s10_off'),
  flyTo('s11', ST.cta, 1.0, 60),
  punch('s11_safe'),
  {at: tl.f('s11_group') + 30, x: ST.cta.x, y: ST.cta.y, zoom: 0.9, move: 'PULL', dur: 150},
];

// Story arc: alarm red until the safe part, then trust green.
const arcAt = (frame: number) => interpolate(frame, [tl.f('s9') - 20, tl.f('s9') + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// ── Small pieces specific to this reel ──────────────────────
const ChatBox: React.FC<{at: number; glowAt?: number; label?: string; w?: number}> = ({at, glowAt, label = 'Ask anything…', w = 860}) => {
  const frame = useCurrentFrame();
  const g = glowAt !== undefined ? ramp(frame, glowAt, 10) * (1 - ramp(frame, glowAt + 14, 40)) : 0;
  const caret = Math.floor(frame / 30) % 2 === 0;
  return (
    <In at={at}>
      <Glass w={w} pad={36} radius={40} tint={g > 0.05 ? C.red : undefined} style={{boxShadow: `0 0 ${g * 90}px rgba(255,59,48,${g * 0.6})`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <div style={{width: 54, height: 54, borderRadius: 16, border: `2px solid ${C.ink3}`, display: 'grid', placeItems: 'center'}}>
            <Draw at={at + 4} size={32} paths={['M50 20 V80', 'M20 50 H80']} stroke={8} color={C.ink2} />
          </div>
          <div style={{fontFamily: F.display, ...T.body, color: C.ink3, flex: 1}}>
            {label}
            <span style={{opacity: caret ? 1 : 0, color: C.ink}}>|</span>
          </div>
          <div style={{width: 64, height: 64, borderRadius: 99, background: C.ink, display: 'grid', placeItems: 'center'}}>
            <Draw at={at + 8} size={34} paths={['M50 78 V24', 'M28 44 L50 22 L72 44']} stroke={10} color="#000" />
          </div>
        </div>
      </Glass>
    </In>
  );
};

/** A file card that flies along a path and gets "sucked" into a target at `absorbAt`. */
const FlyingCard: React.FC<{
  at: number;
  absorbAt: number;
  label: string;
  icon: keyof typeof ICON;
  from: {x: number; y: number};
  hold: {x: number; y: number};
  to: {x: number; y: number};
  color?: string;
}> = ({at, absorbAt, label, icon, from, hold, to, color = C.ink}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = springAt(frame, fps, at, 'soft');
  const a = ramp(frame, absorbAt, 22, EASE.launch);
  const x = from.x + (hold.x - from.x) * s + (to.x - hold.x) * a;
  const y = from.y + (hold.y - from.y) * s + (to.y - hold.y) * a;
  const sc = (0.8 + 0.2 * s) * (1 - 0.85 * a);
  const o = ramp(frame, at, 8, EASE.glide) * (1 - ramp(frame, absorbAt + 14, 8));
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${sc}) rotate(${(1 - s) * -8}deg)`, opacity: o}}>
      <Glass w={300} pad={28} radius={30}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
          <Draw at={at + 2} size={110} paths={ICON[icon]} color={color} stroke={3} />
          <div style={{fontFamily: F.display, ...T.label, fontSize: 30, color: C.ink, textAlign: 'center'}}>{label}</div>
        </div>
      </Glass>
    </div>
  );
};

const Center: React.FC<{children: React.ReactNode; gap?: number; top?: number}> = ({children, gap = 40, top}) => (
  <AbsoluteFill
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: top === undefined ? 'center' : 'flex-start',
      paddingTop: top,
      gap,
      paddingLeft: SAFE.side,
      paddingRight: SAFE.side,
      textAlign: 'center',
    }}
  >
    {children}
  </AbsoluteFill>
);

// ── Stations ─────────────────────────────────────────────────
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const leak = tl.f('s1_leak');
  const red = ramp(frame, leak, 12);
  return (
    <AbsoluteFill>
      {/* File drops into the chat box on "paste" */}
      <FlyingCard
        at={0}
        absorbAt={tl.f('s1_paste')}
        label="patients.xlsx"
        icon="sheet"
        from={{x: 540, y: 300}}
        hold={{x: 540, y: 420}}
        to={{x: 540, y: 700}}
      />
      <div style={{position: 'absolute', left: 110, top: 640}}>
        <ChatBox at={0} glowAt={tl.f('s1_paste') + 12} w={860} />
      </div>
      <Center top={830} gap={8}>
        <In at={tl.f('s1_counter') - 6}>
          <Kicker text="1 paste →" color={C.ink2} />
        </In>
        <div style={{opacity: ramp(frame, tl.f('s1_counter') - 4, 8)}}>
          <Counter from={0} to={3182} at={tl.f('s1_counter')} dur={Math.max(30, leak - tl.f('s1_counter'))} size={250} color={red > 0.5 ? C.red : C.amber} />
        </div>
        <In at={leak}>
          <div style={{fontFamily: F.display, ...T.h2, color: C.red, textShadow: `0 0 40px rgba(255,59,48,${0.5 * red})`}}>logon ka data leak</div>
        </In>
      </Center>
    </AbsoluteFill>
  );
};

const Tease: React.FC = () => {
  const frame = useCurrentFrame();
  const u = ramp(frame, tl.f('s2_miss'), 24);
  return (
    <Center>
      <In at={tl.f('s2') - 6} style={{opacity: 1 - 0.35 * ramp(frame, tl.f('s2_out'), 12)}}>
        <Glass w={900} pad={60}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28}}>
            <Draw at={tl.f('s2')} size={150} paths={ICON.lock} color={C.amber} stroke={3} />
            <Kicker text="Last mein" color={C.amber} />
            <Pop at={tl.f('s2_tip')}>
              <Headline pre="1 tip" accent="jo log" post="nahi jaante" size={84} accentColor={C.amber} />
            </Pop>
            <div style={{fontFamily: F.display, ...T.body, color: C.ink2, position: 'relative'}}>
              Miss mat karna
              <div style={{position: 'absolute', left: 0, bottom: -10, height: 4, width: `${u * 100}%`, background: C.amber, borderRadius: 4}} />
            </div>
          </div>
        </Glass>
      </In>
    </Center>
  );
};

const Hospital: React.FC = () => {
  const frame = useCurrentFrame();
  const ai = tl.f('s3_ai');
  return (
    <AbsoluteFill>
      <Center top={250} gap={20}>
        <In at={tl.f('s3') - 4}>
          <Kicker text="US hospital" />
        </In>
        <Draw at={tl.f('s3')} size={300} paths={ICON.hospital} stroke={2} />
      </Center>
      <div style={{position: 'absolute', left: 120, top: 660, ...enter(frame, tl.f('s3_staff'), 16)}}>
        <Draw at={tl.f('s3_staff')} size={150} paths={ICON.person} stroke={3} />
        <div style={{fontFamily: F.display, ...T.micro, color: C.ink2, textAlign: 'center'}}>1 staff member</div>
        <div style={{fontFamily: F.mono, fontSize: 24, color: C.amber, textAlign: 'center', marginTop: 8, ...enter(frame, tl.f('s3_rush'), 12, 16)}}>“kaam jaldi”</div>
      </div>
      <FlyingCard
        at={tl.f('s3_sheet')}
        absorbAt={tl.f('s3_daal')}
        label="Patients sheet"
        icon="sheet"
        from={{x: 300, y: 760}}
        hold={{x: 680, y: 770}}
        to={{x: 540, y: 1010}}
      />
      <div style={{position: 'absolute', left: 110, top: 960}}>
        <ChatBox at={tl.f('s3_sheet') - 10} glowAt={tl.f('s3_daal') + 10} label="Public AI tool" />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1130, display: 'flex', justifyContent: 'center'}}>
        <Pop at={ai}>
          <div
            style={{
              padding: '16px 30px',
              borderRadius: 999,
              border: `2px solid ${C.red}`,
              color: C.red,
              fontFamily: F.display,
              ...T.label,
              background: 'rgba(255,59,48,0.10)',
            }}
          >
            PUBLIC AI TOOL · NOT APPROVED
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

const Chips: React.FC = () => {
  const frame = useCurrentFrame();
  const all = ramp(frame, tl.f('s4_all'), 10);
  return (
    <Center top={360} gap={34}>
      <In at={tl.f('s4') - 10}>
        <Kicker text="Kya leak hua" color={C.ink2} />
      </In>
      <Chip label="Names" at={tl.f('s4_c1')} alarm={all} />
      <Chip label="Medical record no." at={tl.f('s4_c2')} alarm={all} />
      <Chip label="Medicines" at={tl.f('s4_c3')} alarm={all} />
      <Chip label="Doctors" at={tl.f('s4_c4')} alarm={all} />
      <In at={tl.f('s4_all')}>
        <Headline pre="Sab" accent="kuch." size={110} accentColor={C.red} />
      </In>
    </Center>
  );
};

const Letters: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const at = tl.f('s5_letter');
  return (
    <AbsoluteFill>
      {Array.from({length: 7}).map((_, i) => {
        const s = springAt(frame, fps, at + i * 4, 'soft');
        const ang = -60 + i * 20;
        const r = 360 * s;
        const x = 540 + Math.sin((ang * Math.PI) / 180) * r;
        const y = 720 - Math.cos((ang * Math.PI) / 180) * r * 0.75;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${ang * 0.3}deg) scale(${0.5 + 0.5 * s})`, opacity: ramp(frame, at + i * 4, 8)}}>
            <Draw at={at + i * 4} size={130} paths={ICON.envelope} stroke={3} color={i === 3 ? C.amber : C.ink} />
          </div>
        );
      })}
      <Center top={940} gap={20}>
        <In at={tl.f('s5_pata')}>
          <Kicker text="Hospital ko pata chala" color={C.ink2} />
        </In>
        <In at={at}>
          <div style={{fontFamily: F.display, ...T.h2, color: C.ink}}>Letters to patients</div>
        </In>
        <In at={tl.f('s5_raha')}>
          <div style={{fontFamily: F.mono, fontSize: 44, fontWeight: 600, color: C.amber}}>from 22 Oct 2026</div>
        </In>
      </Center>
    </AbsoluteFill>
  );
};

const You: React.FC = () => {
  const ai = tl.f('s6_ai');
  return (
    <AbsoluteFill>
      <Center top={280} gap={10}>
        <In at={tl.f('s6') - 4}>
          <Kicker text="Ab sach bataun?" color={C.ink2} />
        </In>
        <Pop at={tl.f('s6_aap')}>
          <Headline pre="Aap bhi" accent="roz" post="yahi karte ho" size={74} accentColor={C.red} />
        </Pop>
      </Center>
      <FlyingCard at={tl.f('s6_f1')} absorbAt={ai} label="Office file" icon="file" from={{x: 120, y: 700}} hold={{x: 220, y: 680}} to={{x: 540, y: 1080}} />
      <FlyingCard at={tl.f('s6_f2')} absorbAt={ai + 4} label="Client data" icon="person" from={{x: 960, y: 700}} hold={{x: 860, y: 680}} to={{x: 540, y: 1080}} />
      <FlyingCard at={tl.f('s6_f3')} absorbAt={ai + 8} label="Salary sheet" icon="sheet" from={{x: 540, y: 560}} hold={{x: 540, y: 800}} to={{x: 540, y: 1080}} />
      <div style={{position: 'absolute', left: 110, top: 1020}}>
        <ChatBox at={tl.f('s6_f1') - 6} glowAt={ai + 16} label="seedha AI mein…" />
      </div>
    </AbsoluteFill>
  );
};

const NEVER = ['Client / customer data', 'Aadhaar · PAN · Bank', 'Passwords & API keys', 'Financials & salary', 'Contracts / unreleased work'];
const List: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = ['s8_1', 's8_2', 's8_3', 's8_4', 's8_5'].map((c) => tl.f(c));
  const activeIdx = rows.reduce((acc, f, i) => (frame >= f ? i : acc), -1);
  return (
    <Center>
      <In at={tl.f('s7') - 6}>
        <Glass w={960} pad={56} tint="rgba(255,59,48,0.35)">
          <div style={{display: 'flex', flexDirection: 'column', gap: 36, textAlign: 'left'}}>
            <div>
              <div style={{...enter(frame, tl.f('s7_never'), 14, 16)}}>
                <Kicker text="Kabhi public AI mein paste mat karo" color={C.red} />
              </div>
              <Pop at={tl.f('s7_five')} from={0.8}>
                <div style={{fontFamily: F.display, ...T.h1, fontSize: 104, color: C.ink, marginTop: 12}}>
                  <span style={{color: C.amber}}>5</span> cheezein
                </div>
              </Pop>
            </div>
            <div style={{height: 1.5, background: C.hair}} />
            {NEVER.map((t, i) => (
              <ListRow key={i} n={i + 1} text={t} at={rows[i]} kind="cross" active={i === activeIdx} />
            ))}
            <div style={{fontFamily: F.mono, fontSize: 24, color: C.ink3, opacity: ramp(frame, rows[4] + 20, 20)}}>
              Screenshot le lo · @baqur.ai
            </div>
          </div>
        </Glass>
      </In>
    </Center>
  );
};

const Safe: React.FC = () => {
  const frame = useCurrentFrame();
  const erase = ramp(frame, tl.f('s9_erase'), 30, EASE.glide);
  const Redact: React.FC<{text: string; k: number}> = ({text, k}) => (
    <span style={{position: 'relative', display: 'inline-block'}}>
      <span style={{opacity: 1 - k * 0.9}}>{text}</span>
      <span style={{position: 'absolute', left: 0, top: '12%', height: '76%', width: `${k * 100}%`, background: C.ink, borderRadius: 6}} />
    </span>
  );
  return (
    <AbsoluteFill>
      <Center top={300} gap={18}>
        <Draw at={tl.f('s9_kya')} size={130} paths={ICON.shield} color={C.green} stroke={3} />
        <In at={tl.f('s9')}>
          <Headline pre="Safe" accent="tareeka" size={96} accentColor={C.green} />
        </In>
      </Center>
      <div style={{position: 'absolute', left: SAFE.side + 20, right: SAFE.side, top: 720, display: 'flex', flexDirection: 'column', gap: 30}}>
        <ListRow n={1} text="Company ka approved AI tool" at={tl.f('s9_1')} kind="check" active={frame >= tl.f('s9_approved') && frame < tl.f('s9_2')} />
        <ListRow n={2} text="Naam & numbers hata do" at={tl.f('s9_2')} kind="check" active={frame >= tl.f('s9_2') && frame < tl.f('s10_3')} />
        <div style={{marginLeft: 150, fontFamily: F.mono, fontSize: 32, color: C.ink2, ...enter(frame, tl.f('s9_2') + 8, 16)}}>
          Patient: <Redact text="Ravi Kumar" k={erase} /> · MRN <Redact text="448812" k={ramp(frame, tl.f('s9_erase') + 8, 30, EASE.glide)} />
        </div>
        <ListRow n={3} text="History / training OFF" at={tl.f('s10_3')} kind="check" active={frame >= tl.f('s10_3')} />
        <div style={{marginLeft: 150, ...enter(frame, tl.f('s10_tip'), 14, 16)}}>
          <span style={{fontFamily: F.display, ...T.label, fontSize: 26, color: '#000', background: C.amber, padding: '8px 18px', borderRadius: 99}}>WOH TIP · zyaadatar log nahi jaante</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Settings: React.FC = () => {
  const frame = useCurrentFrame();
  const off = ramp(frame, tl.f('s10_off'), 14, EASE.settle);
  const knobX = 8 + (1 - off) * 64;
  return (
    <Center top={760} gap={24}>
      <In at={tl.f('s10_settings') - 8}>
        <Glass w={880} pad={44} tint={off > 0.5 ? 'rgba(52,199,89,0.4)' : undefined}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 26, textAlign: 'left'}}>
            <Kicker text="AI app → Settings → Data controls" color={C.ink2} />
            <div style={{height: 0}} />
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{fontFamily: F.display, ...T.body, fontWeight: 600, color: frame >= tl.f('s10_history') ? C.ink : C.ink2, textShadow: frame >= tl.f('s10_history') && frame < tl.f('s10_off') ? `0 0 24px ${C.amber}66` : undefined}}>Chat history / training</div>
              <div style={{width: 140, height: 76, borderRadius: 99, background: off > 0.5 ? 'rgba(120,120,128,0.36)' : C.amber, position: 'relative', flex: 'none'}}>
                <div style={{position: 'absolute', top: 8, left: knobX, width: 60, height: 60, borderRadius: 99, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.4)'}} />
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: off}}>
              <Mark kind="check" at={tl.f('s10_off') + 6} size={46} />
              <div style={{fontFamily: F.display, ...T.body, fontSize: 36, color: C.green}}>OFF</div>
            </div>
          </div>
        </Glass>
      </In>
      <In at={tl.f('s10_warn')}>
        <div style={{fontFamily: F.display, ...T.micro, fontSize: 28, color: C.ink2, maxWidth: 820}}>
          Warna chats <span style={{color: frame >= tl.f('s10_model') ? C.ink : C.ink2}}>model sudharne</span> mein <span style={{color: C.amber, display: 'inline-block', transform: `scale(${1 + 0.08 * ramp(frame, tl.f('s10_use'), 8) * (1 - ramp(frame, tl.f('s10_use') + 10, 20))})`}}>use ho sakti hain</span>*
          <br />
          <span style={{color: C.ink3, fontSize: 22}}>*App, plan aur settings par depend karta hai</span>
        </div>
      </In>
    </Center>
  );
};

const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = ramp(frame, tl.f('s11_safe'), 16);
  return (
    <Center gap={36}>
      <In at={tl.f('s11_checklist')}>
        <Kicker text="Har AI app ki poori checklist" color={C.ink2} />
      </In>
      <In at={tl.f('s11_comment')}>
        <div style={{fontFamily: F.display, ...T.h2, color: C.ink}}>Comment karo</div>
      </In>
      <Pop at={tl.f('s11_safe')} from={0.5}>
        <div
          style={{
            padding: '40px 90px',
            borderRadius: 60,
            background: `rgba(52,199,89,${0.1 + 0.08 * glow})`,
            border: `3px solid ${C.green}`,
            boxShadow: `0 0 ${60 + 80 * glow}px rgba(52,199,89,${0.45 * glow})`,
            fontFamily: F.display,
            ...T.hero,
            fontSize: 200,
            color: C.ink,
          }}
        >
          SAFE
        </div>
      </Pop>
      <In at={tl.f('s11_group')}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <Draw at={tl.f('s11_group')} size={64} paths={ICON.share} color={C.green} stroke={4} />
          <div style={{fontFamily: F.display, ...T.body, color: C.ink}}>Office group mein bhejo</div>
        </div>
      </In>
      <In at={tl.f('s11_group') + 30}>
        <div style={{fontFamily: F.mono, fontSize: 26, color: C.ink3}}>@baqur.ai</div>
      </In>
    </Center>
  );
};

// ── Composition ──────────────────────────────────────────────
const HITS = ['s1_leak', 's3_ai', 's4_all', 's6_aap', 's7_five', 's10_3', 's11_safe'];

export const PasteLeak: React.FC = () => {
  const frame = useCurrentFrame();
  const files = getStaticFiles().map((f) => f.name);
  const hasVO = files.includes('reels/paste-leak/vo.mp3');
  const hasStem = files.includes('reels/paste-leak/sfx_stem.wav');
  const srcShow = frame >= tl.f('s3') && frame < tl.f('s6') - 10;
  const endFade = 1 - ramp(frame, tl.durationInFrames - 20, 20, EASE.glide);

  return (
    <AbsoluteFill style={{background: C.bg, opacity: endFade}}>
      <World shots={SHOTS} width={WORLD.w} height={WORLD.h} background={<Backdrop arc={arcAt(frame)} />}>
        <Station {...ST.hook}><Hook /></Station>
        <Station {...ST.tease}><Tease /></Station>
        <Station {...ST.hospital}><Hospital /></Station>
        <Station {...ST.chips}><Chips /></Station>
        <Station {...ST.letters}><Letters /></Station>
        <Station {...ST.you}><You /></Station>
        <Station {...ST.list}><List /></Station>
        <Station {...ST.safe}><Safe /></Station>
        <Station {...ST.settings}><Settings /></Station>
        <Station {...ST.cta}><CTA /></Station>
      </World>

      <HitFlash frames={HITS.map((h) => tl.f(h))} color={frame < tl.f('s9') ? C.red : C.green} />
      <SourceLine text="Source: WMAR 2 News · Baltimore Sun (Johns Hopkins Bayview)" show={srcShow} />
      <Captions tl={tl} arcAt={arcAt} hideIn={['S8', 'S11']} />
      <ProgressRail total={tl.durationInFrames} arcAt={arcAt} />
      {tl.source === 'estimated' ? (
        <div style={{position: 'absolute', right: 24, top: 24, fontFamily: F.mono, fontSize: 20, color: C.amber, opacity: 0.7}}>DESIGN MODE · estimated timings</div>
      ) : null}

      {hasVO ? <Audio src={staticFile('reels/paste-leak/vo.mp3')} /> : null}
      {hasStem ? <Audio src={staticFile('reels/paste-leak/sfx_stem.wav')} /> : null}
    </AbsoluteFill>
  );
};
