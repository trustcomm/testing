// Assert every deliverable is h264 / yuv420p at the right size, fps and frame count.
import { execFileSync } from 'node:child_process';
import { T } from './tokens.js';

const want = [
  ['out/final_1080_ss.mp4', T.W, T.H],
  ['out/final_2160.mp4', T.W * 2, T.H * 2],
  ['out/final_1080_ss_silent_track.mp4', T.W, T.H],
];
const frames = Math.round(T.DURATION * T.FPS);
let ok = true;
for (const [file, w, h] of want) {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames',
    '-show_entries', 'stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_read_frames', '-of', 'json', file]));
  const s = j.streams[0];
  const checks = {
    codec: s.codec_name === 'h264', pix_fmt: s.pix_fmt === 'yuv420p',
    size: s.width === w && s.height === h, fps: s.r_frame_rate === `${T.FPS}/1`,
    frames: Number(s.nb_read_frames) === frames,
  };
  const bad = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  console.log(`${bad.length ? 'FAIL' : 'ok  '} ${file}  ${s.width}x${s.height} ${s.codec_name} ${s.pix_fmt} ${s.r_frame_rate} ${s.nb_read_frames}f${bad.length ? '  bad: ' + bad.join(',') : ''}`);
  ok &&= !bad.length;
}
process.exit(ok ? 0 : 1);
