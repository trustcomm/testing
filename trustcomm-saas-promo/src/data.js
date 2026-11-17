// Design size and absolute scene timing (seconds); overlaps are the transitions. Beat times come from plan/beats.json.
export const W = 1080, H = 1920, FPS = 60;
export const scenes = [
  {id: 's1_hook', start: 0, end: 6.3},
  {id: 's2_pain', start: 5.6, end: 11.5},
  {id: 's3_brand', start: 10.9, end: 13.6},
  {id: 's4_qr', start: 12.9, end: 15.3},
  {id: 's5_rate', start: 14.5, end: 23.0},
  {id: 's6_paths', start: 22.3, end: 31.0},
  {id: 's7_trust', start: 30.5, end: 34.6},
  {id: 's8_cta', start: 34.0, end: 42.6},
];
export const DURATION = 42.6;
