// The sound vocabulary. Scenes place events by NAME (src/cues/sNN.ts); scripts/make_sfx.py synthesises every name here into public/sfx/<name>.wav
// (procedural: filtered noise, sine / FM tones, envelopes) and public/sfx/index.json; scripts/build_mix.py puts each event on the timeline.
// `hit` = where in the sound its HIT lands (seconds from the start of the file); the engine aligns that instant to the event's frame. Continuous sounds have hit 0.
// An event's `pitch` shifts a tonal sound by semitones, `gainDb` trims it (default 0), `pan` is -1 (left) .. +1 (right), `seed` varies noisy sounds.
export interface SfxSpec { hit: "start" | "peak" | "end"; dur: string; what: string }
export const SFX_SPEC = {
  // S1
  sub_drone: { hit: "start", dur: "8 s", what: "low sub drone (~45 Hz + a few soft harmonics) that fades in from silence over its whole length; slow beating; no pitch rise" },
  clock_tick: { hit: "start", dur: "0.25 s", what: "one soft, dry clock tick (short filtered click with a tiny wooden body); intimate" },
  thoom: { hit: "start", dur: "1.6 s", what: "deep 'thoom': a sine falling 80 -> 32 Hz with a soft low noise thump on the front; long round tail" },
  alarm_swell: { hit: "end", dur: "1.5 s", what: "rising alarm-pad swell (detuned minor-second dyad + slow upward filter and pitch drift, tremolo accelerating); NOT a siren; peaks at its END" },
  server_ping: { hit: "start", dur: "0.2 s", what: "tiny soft ping / tick, one per server icon lighting up; bright but quiet; vary with `pitch`" },
  // S2
  whoosh_through: { hit: "peak", dur: "1.2 s", what: "large whoosh passing through the camera (band-passed noise sweeping low -> high, slight Doppler fall at the end); peaks at ~0.55 s" },
  ui_click: { hit: "start", dur: "0.15 s", what: "soft UI click, like a trackpad tap" },
  heartbeat: { hit: "start", dur: "0.7 s", what: "heartbeat thump pair 'lub-dub' (two low rounded thumps 0.22 s apart); hit = the first thump" },
  // S3
  layer_sweep: { hit: "peak", dur: "1.4 s", what: "low glassy 'layer reveal' sweep: filtered noise + shimmering high partials sliding up, like a pane lifting; peaks at ~0.7 s" },
  scuttle: { hit: "start", dur: "0.6 s", what: "tiny scuttling clicks of a small bug: 6-10 very quiet irregular ticks, panned by `pan`" },
  key_click: { hit: "start", dur: "0.1 s", what: "short mechanical keyboard-ish click for typing text; vary with `pitch` / `seed`" },
  reverse_riser: { hit: "end", dur: "2.4 s", what: "tape-like reverse riser (a reversed tape-stop / reversed soft cymbal with a dusty texture); the hit is its END" },
  // S4
  focus_swoosh: { hit: "end", dur: "0.55 s", what: "lens 'focus' swoosh: a short airy rising-pitch whoosh that ends in a tiny lock" },
  chip_tick: { hit: "start", dur: "0.3 s", what: "one bright tick with a tiny bell tail; use `pitch` 0 (low), 4 (mid), 9 (high) for the three name chips" },
  caught_click: { hit: "start", dur: "0.25 s", what: "soft 'caught' click: a two-part tiny click-clack" },
  // S5
  pluck: { hit: "start", dur: "1.2 s", what: "warm, light pluck (Karplus-Strong or soft FM), `pitch` in semitones above C4; the curious motif is made of these" },
  tok: { hit: "start", dur: "0.25 s", what: "soft wooden 'tok' (a tiffin landing); vary `pitch` (-3..+3) per event" },
  bike_bell: { hit: "start", dur: "1.4 s", what: "gentle bicycle-bell ding: two inharmonic bright partials, long soft tail" },
  // S6
  tiffin_rattle: { hit: "start", dur: "0.8 s", what: "metal tiffin carrier rattling: 6-9 small metallic ticks with a clattery tail" },
  lid_clink: { hit: "start", dur: "0.6 s", what: "metal lid clink: a bright metallic tap with a short ring" },
  key_jingle: { hit: "start", dur: "0.6 s", what: "tiny key jingle: 3-5 high metallic ticks tumbling over 0.4 s" },
  uhoh_note: { hit: "start", dur: "0.9 s", what: "low 'uh-oh' synth note: two soft descending notes (a minor third apart), slightly detuned" },
  // S7
  data_hum: { hit: "start", dur: "4 s", what: "data-flow hum: filtered saw + noise with a slow LFO; fades in and out; quiet bed texture" },
  swipe: { hit: "start", dur: "0.3 s", what: "soft swipe: a short band-passed noise sweep, like a thumb on glass" },
  glitch_tsk: { hit: "start", dur: "0.15 s", what: "sharp glitch 'tsk': a bit-crushed noise burst with a hard attack; vary with `pitch`" },
  // S8
  stealth_pulse: { hit: "start", dur: "0.7 s", what: "stealthy low pulse: a soft sub thump that swells and dies; used repeatedly" },
  denied_buzz: { hit: "start", dur: "0.6 s", what: "'denied': a click that fails into a soft low buzz (two quick buzz stutters)" },
  big_hit: { hit: "start", dur: "2.0 s", what: "big low hit: sub boom + body + noise transient, long dark tail; the loudest event of the film" },
  zap_sweep: { hit: "start", dur: "0.9 s", what: "red-wave 'zap' sweep: electric filtered noise rising fast bottom -> top (a rising sweep of 0.7 s)" },
  // S9
  ratchet_tick: { hit: "start", dur: "0.08 s", what: "mechanical gauge ratchet tick, dry and short; vary with `pitch`" },
  clunk: { hit: "start", dur: "0.9 s", what: "heavy 'clunk': a low metallic thud with a short ring" },
  chime_pos: { hit: "start", dur: "1.4 s", what: "soft positive chime: two rising bell notes (a fifth apart), warm" },
  ping_impact: { hit: "start", dur: "0.35 s", what: "small impact ping (an arrow deflected by a shield): a tight metallic ping; vary with `pitch`" },
  // S10
  piano_note: { hit: "start", dur: "3.5 s", what: "a single soft piano note (felt piano: sine + a few decaying partials, soft hammer); `pitch` in semitones above C4" },
  glass_tap: { hit: "start", dur: "0.5 s", what: "gentle glass tap: a short bright tick with a small glassy ring" },
  chord_resolved: { hit: "start", dur: "4.0 s", what: "a warm, resolved chord (C major add9, felt piano + soft pad), slow bloom and long tail" },
  // S11
  type_click: { hit: "start", dur: "0.08 s", what: "keyboard typing click, soft; vary with `pitch` / `seed`" },
  send_whoosh: { hit: "start", dur: "0.45 s", what: "soft 'message sent' whoosh: a short rising airy swoosh" },
  tick_asc: { hit: "start", dur: "0.25 s", what: "ascending tick: a bright tick; use `pitch` 0, 2, 4, 7 for the four version lines" },
  shutter: { hit: "start", dur: "0.25 s", what: "camera-shutter-like soft click (a cue to screenshot): two quick soft clicks" },
  // S12
  bonk_neg: { hit: "start", dur: "0.5 s", what: "soft negative 'bonk': a low hollow knock, slightly falling" },
  ding_pos: { hit: "start", dur: "1.6 s", what: "satisfying 'ding': a bright bell with a clean tail" },
  spin_whoosh: { hit: "start", dur: "0.8 s", what: "circular spin whoosh: a band-passed noise whoosh that sweeps the stereo field once" },
  // S13
  pluck_resolve: { hit: "start", dur: "1.8 s", what: "upbeat soft pluck resolving: a short major arpeggio (C-E-G-C) of warm plucks ending on a sustained note" },
  pop: { hit: "start", dur: "0.2 s", what: "soft pop: a rounded bubble" },
  plane_swish: { hit: "start", dur: "0.9 s", what: "paper-plane swish: an airy swoosh that sweeps left -> right" },
  final_chime: { hit: "start", dur: "3.5 s", what: "gentle final chime: a soft bell, long tail" },
  // generic
  whoosh: { hit: "peak", dur: "0.8 s", what: "generic soft whoosh, peak at ~0.35 s" },
  tick: { hit: "start", dur: "0.1 s", what: "generic soft tick" },
} as const satisfies Record<string, SfxSpec>;
export type SfxName = keyof typeof SFX_SPEC;

export interface SfxEvent {
  id: string;                 // unique, e.g. "s1.thoom"
  frame: number;              // the frame its HIT lands on (the visual hit's frame)
  sfx: SfxName;
  note: string;               // what the picture does on this frame
  gainDb?: number; pan?: number; pitch?: number; seed?: number;
  /** long sounds that must be cut short: length in frames */
  frames?: number;
}
