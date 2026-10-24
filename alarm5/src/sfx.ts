// The sound vocabulary. Scenes place events by NAME (src/cues/sNN.ts); scripts/make_sfx.py synthesises every name here into public/sfx/<name>.wav (procedural) and
// public/sfx/index.json; scripts/build_mix.py puts each event on the timeline.
// EVERY sound has three layers: T = TRANSIENT (click/tick/snap, 10-40 ms), B = BODY (whoosh/boom/swell, 150-600 ms), A = TAIL (reverb/air, 0.5-2 s, filtered).
// `hit` says where the TRANSIENT of the sound is: "start" = at the file's start; "peak" = at the middle of the swell; "end" = the climax at its end (risers). The engine aligns
// that instant to the event's frame, so the transient lands on the visual hit ("mark" = the biggest sudden onset in the file, e.g. the sub hit after a riser). Whooshes / risers start 6-12 frames BEFORE the camera move or reveal (their pre-roll is part of the file).
// An event's `pitch` shifts tonal sounds by semitones, `gainDb` trims it, `pan` is -1 (left) .. +1 (right) = the element's screen x, `panTo` sweeps the pan to that value over the
// sound (the doppler-style travel pan), `seed` varies noisy sounds.
export interface SfxSpec { hit: "start" | "peak" | "end" | "mark"; dur: string; what: string }
export const SFX_SPEC = {
  // ---- map / camera ----
  beacon_bip: { hit: "start", dur: "1.6 s", what: "T: a clean 1.8 kHz sine ping (12 ms). B: a soft sub swell (55 Hz) rising and falling over 0.5 s. A: a quiet airy tail. One per beacon; pitch varies" },
  pullback_whoosh: { hit: "peak", dur: "3.2 s", what: "a long airy pull-back whoosh: band-passed noise sweeping from high to low with a slow swell (peak at 1.2 s), a low body, a long filtered tail. Wide" },
  reverse_riser: { hit: "end", dur: "0.5 s", what: "a short reverse riser (the build is 0.3 s): T: nothing at the end (the hit is its own event). B: filtered noise swelling. A: a faint reversed shimmer" },
  punch_hit: { hit: "start", dur: "1.6 s", what: "T: a punchy click/snap (20 ms). B: a tight low thump (70 Hz, pitch falling) of 0.25 s. A: a short dark reverb tail" },
  heartbeat: { hit: "start", dur: "0.9 s", what: "T: two soft clicks. B: a lub-dub pair of low rounded thumps 0.22 s apart. A: a short room tail. hit = the first thump" },
  flyto_whoosh: { hit: "peak", dur: "2.0 s", what: "a doppler-style FLY-TO whoosh with its pre-roll: the rise starts 0.25 s before the camera moves, the peak (fast pass, pitch of the noise band falls slightly after it) is the move's middle, then a long air tail. Use pan + panTo for the direction of travel" },
  dolly_dive: { hit: "peak", dur: "1.5 s", what: "a DOLLY-THROUGH dive: a deep rising whoosh (noise + a sine gliding up an octave), peak at the moment of passing through, then a short suck-out of air" },
  dolly_out: { hit: "peak", dur: "1.6 s", what: "the reverse dolly out: a falling whoosh (the dive reversed in character), softer, ending with a settling air tail" },
  number_reveal: { hit: "mark", dur: "2.4 s", what: "NUMBER REVEAL: a short reverse riser (0.45 s) -> T: a bright metallic tick -> B: a deep sub hit (50 Hz with a short pitch drop) -> A: a glassy reverb tail. The hit is 0.45 s into the file" },
  number_reveal_big: { hit: "mark", dur: "3.4 s", what: "THE heaviest sub hit of the reel (number one): a 1 s dramatic reverse riser -> T: a hard metallic tick -> B: a very deep sub boom (40 Hz, long pitch drop, saturated) -> A: a long dark tail. The hit is 1.0 s into the file" },
  // ---- screen / ui ----
  piano_tick: { hit: "start", dur: "2.0 s", what: "T: a soft felt hammer tick. B: one soft piano note (pitch in semitones above C4). A: a long quiet room tail" },
  action_chime: { hit: "start", dur: "2.2 s", what: "the 'action' chime: T: a tiny tick. B: two rising soft bell notes (a fifth apart). A: a warm airy tail" },
  tink: { hit: "start", dur: "0.8 s", what: "T: a bright tiny tick. B: a glassy short bell. A: a faint tail. pitch varies" },
  lock_click: { hit: "start", dur: "0.7 s", what: "T: a crisp mechanical click. B: a short metallic clack. A: a tiny ring" },
  ui_click: { hit: "start", dur: "0.4 s", what: "soft UI click, like a trackpad tap, with a tiny tail" },
  card_slide: { hit: "peak", dur: "0.9 s", what: "a card slides up: a soft band-passed noise swipe (peak 0.2 s), a small landing tick, a quiet tail" },
  play_tap: { hit: "start", dur: "0.5 s", what: "T: a soft tap. B: a short rounded blip. A: a quiet tail" },
  type_click: { hit: "start", dur: "0.15 s", what: "keyboard typing click, soft; vary with pitch / seed" },
  checklist_tick: { hit: "start", dur: "0.5 s", what: "a checklist tick: T: a light click. B: a tiny rising two-note blip. A: a quiet shimmer. pitch varies" },
  // ---- S1 ----
  crowd_flat: { hit: "start", dur: "2.0 s", what: "the flat sound-wave icon over the crowd: almost nothing: a faint room tone with a muffled, dying murmur (shows that nobody hears)" },
  // ---- S3 bank ----
  robot_step: { hit: "start", dur: "0.25 s", what: "T: a tiny servo click. B: a soft plastic tap. pitch/pan vary. Used as a quick pattering" },
  brake_squeal: { hit: "start", dur: "0.8 s", what: "a small robot's brake: a short rising-falling squeak (filtered noise + a 2.4 kHz glide), a tiny thud" },
  glass_thunk: { hit: "start", dur: "1.4 s", what: "T: a heavy glass-gate impact click. B: a deep thunk (90 Hz, 0.2 s). A: a glassy ring and room tail" },
  buzzer_blip: { hit: "start", dur: "0.5 s", what: "T: a red 'denied' click. B: a short low buzz (two 80 ms stutters at 150 Hz, square-ish). A: nothing" },
  coin_bounce: { hit: "start", dur: "1.1 s", what: "T: a metallic coin clink. B: a dull thud of a bounce-back. A: two small decaying clinks" },
  quiz_pluck: { hit: "start", dur: "1.2 s", what: "a quizzical rising pluck: a soft pluck whose pitch bends up a minor third, a tiny question-mark shimmer" },
  // ---- S5 / S6 package ----
  conveyor_hum: { hit: "start", dur: "5.0 s", what: "T: none. B: a quiet conveyor: low rubber hum with a slow rhythmic rumble. A: fades out. Continuous texture" },
  creak: { hit: "start", dur: "1.0 s", what: "a sneaky creak: a short filtered-noise squeak that wobbles, a quiet low scrape under it" },
  glassy_pluck: { hit: "start", dur: "1.0 s", what: "a glassy pluck for one stolen key: T: a bright tick. B: a glassy pluck (pitch in semitones above C5). A: a short shimmer. Pan with the key" },
  key_ratchet: { hit: "start", dur: "0.7 s", what: "the keys rotating: a quick mechanical ratchet (6 clicks accelerating), then a small ring" },
  // ---- S7 city ----
  stamp_thud: { hit: "start", dur: "0.9 s", what: "T: a rubber-stamp slap. B: a low thud (80 Hz). A: a short dull tail" },
  counter_roll: { hit: "mark", dur: "1.3 s", what: "a counter rolling up: ticks accelerating over 1.0 s (bright metallic), ending in a deep sub hit (45 Hz) at the END (the hit)" },
  spark_crackle: { hit: "start", dur: "1.6 s", what: "T: first sparks. B: a crackle of tiny electric sparks, dense then thinning. A: a hiss that fades" },
  window_click: { hit: "start", dur: "0.2 s", what: "a window switching off: a dry soft click; pitch varies so a cascade of them sounds like a falling row" },
  sad_drop: { hit: "start", dur: "2.4 s", what: "a low sad tonal drop: a soft synth note gliding down a fifth, a slow tremolo, a long dark tail" },
  // ---- S8 ----
  lift_whoop: { hit: "start", dur: "0.7 s", what: "T: a soft pop. B: a quick rising 'whoop' (sine glide up, 0.2 s). A: a tiny tail" },
  arc_whoosh: { hit: "peak", dur: "1.1 s", what: "an app icon flying along an arc: a mid whoosh with a doppler pan (use pan + panTo), peak 0.4 s" },
  land_tap: { hit: "start", dur: "0.5 s", what: "T: a soft landing tap. B: a short low pat. A: a quiet tail" },
  // ---- S9 / S10 phone ----
  call_tone: { hit: "start", dur: "1.8 s", what: "a soft generic ringing/call tone: two sine tones (440 + 480 Hz) pulsing twice, filtered, with a tail" },
  hangup_blip: { hit: "start", dur: "0.5 s", what: "T: a small click. B: a short descending two-tone blip. A: a tiny tail" },
  room_tone: { hit: "start", dur: "7.0 s", what: "an eerie continuing room tone with a faint mic hiss and a barely audible low drone; fades in, fades out. Continuous" },
  relief_swell: { hit: "peak", dur: "3.0 s", what: "relief: a soft major chord swell (peak 1.0 s), airy, with a gentle tail" },
  ring_fill: { hit: "end", dur: "1.6 s", what: "a progress ring filling: a smooth rising sweep (sine + air) over 1.4 s ending at the END with a tiny lock tick" },
  ding_done: { hit: "start", dur: "2.0 s", what: "T: a tiny tick. B: a clean bright bell ding. A: a clean long tail" },
  // ---- S11 / S12 ----
  scuttle_s: { hit: "start", dur: "0.8 s", what: "T: a tiny click. B: 6-9 very quiet irregular scuttling ticks of a small bug (panned by pan). A: a faint skitter tail" },
  dust_swell: { hit: "peak", dur: "2.0 s", what: "a dusty reverse swell: filtered noise with a dry crackle rising, peak at 1.4 s, then a soft puff" },
  dig_drop: { hit: "peak", dur: "1.4 s", what: "an earthy dig/drop whoosh: a low noise swoosh with a gravelly texture and a soft falling thump at the peak" },
  up_whoosh: { hit: "peak", dur: "1.2 s", what: "a rising whoosh up out of the ground: noise sweeping low to high, a soft pop at the top" },
  // ---- S13 / S14 / S15 ----
  piano_low: { hit: "start", dur: "4.0 s", what: "T: a soft felt tick. B: one low warm piano note. A: a long quiet tail" },
  tone_soft: { hit: "start", dur: "2.4 s", what: "a soft round tone with a tiny tick: use pitch (low/mid/high) per station; pan to the station's x" },
  pad_bloom: { hit: "peak", dur: "4.5 s", what: "a warm pad blooming (a detuned major-add9 chord, slow attack, peak 1.8 s), a long tail" },
  green_tink: { hit: "start", dur: "0.9 s", what: "T: a tiny bright tick. B: a soft glassy 'tink' (pitch varies along the route). A: a short shimmer" },
  hit_firm: { hit: "start", dur: "1.0 s", what: "T: a firm soft click. B: a satisfying round thump (100 Hz) with a warm body. A: a short warm tail" },
  boop: { hit: "start", dur: "0.5 s", what: "a playful 'boop': a short sine blip with a pitch bend, two fast repeats" },
  pluck_resolve: { hit: "start", dur: "2.2 s", what: "an upbeat soft pluck resolve: a short major arpeggio (C-E-G-C) of warm plucks ending on a sustained note" },
  pop: { hit: "start", dur: "0.4 s", what: "T: a soft rounded bubble pop. B: a tiny low plop. A: nothing" },
  page_flip: { hit: "start", dur: "0.6 s", what: "a checklist icon flipping open: a soft paper/air flip with a small tick at the end" },
  final_chime: { hit: "start", dur: "4.0 s", what: "T: a tiny tick. B: a gentle soft bell. A: a long tail" },
  whoosh: { hit: "peak", dur: "1.0 s", what: "generic soft whoosh with a small tail, peak at ~0.4 s" },
  tick: { hit: "start", dur: "0.3 s", what: "generic soft tick with a tiny tail" },
} as const satisfies Record<string, SfxSpec>;
export type SfxName = keyof typeof SFX_SPEC;

/** seconds from the audible start of a move sound to its hit (its designed pre-roll): scenes place a whoosh so that it becomes audible 9 frames (6-12) BEFORE the camera moves */
export const PRE: Partial<Record<SfxName, number>> = { flyto_whoosh: 0.593, dolly_dive: 0.236, dolly_out: 0.589, up_whoosh: 0.513, dig_drop: 0.272, pullback_whoosh: 0.931, whoosh: 0.292, reverse_riser: 0.353 };
/** the event frame for a move sound so that it starts `lead` frames before the move at `moveStart` (60 fps) */
export const leadFrame = (name: SfxName, moveStart: number, lead = 9) => moveStart - lead + Math.round((PRE[name] ?? 0) * 60);

export interface SfxEvent {
  id: string;                 // unique, e.g. "s1.bip5"
  frame: number;              // the frame its HIT (the transient) lands on = the visual hit
  sfx: SfxName;
  note: string;               // what the picture does on this frame
  gainDb?: number; pan?: number; panTo?: number; pitch?: number; seed?: number;
  /** long sounds that must be cut short: length in frames */
  frames?: number;
}
