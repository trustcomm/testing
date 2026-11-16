// Design size and absolute scene timing (seconds); overlaps are the transitions. Beat times come from plan/beats.json.
export const W = 1080, H = 1920, FPS = 60;
export const scenes = [
  {id: 's1_hook', start: 0, end: 4.3},
  {id: 's2_walk', start: 3.6, end: 8.6},
  {id: 's3_brand', start: 7.9, end: 14.9},
  {id: 's4_promise', start: 14.1, end: 19.8},
  {id: 's5_values', start: 19.0, end: 29.2},
  {id: 's6_programs', start: 28.45, end: 35.9},
  {id: 's7_cta', start: 35.28, end: 39.95},
  {id: 's8_end', start: 39.3, end: 46.5},
  {id: 'overlay', start: 2.9, end: 8.4},
];
export const DURATION = 46.5;
