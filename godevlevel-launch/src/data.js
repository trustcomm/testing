// Design size and absolute scene timing (seconds). Timings of beats inside scenes come from plan/beats.json.
export const W = 1080, H = 1920, FPS = 60;
export const scenes = [
  {id: 'problem', start: 0, end: 10.1},
  {id: 'brand', start: 10.1, end: 21.0},
  {id: 'services', start: 21.0, end: 34.75},
  {id: 'close', start: 34.75, end: 48.5},
];
export const DURATION = scenes.at(-1).end;
