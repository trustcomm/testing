// Renders a 3D-style (extruded) GoDevLevel profile image from the site's own logo file.
// usage: node brand/logo3d.mjs   → brand/godevlevel-profile-3d.png (1080×1080, safe inside Instagram's circle crop)
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const {chromium} = createRequire('/opt/node-tools/package.json')('playwright');
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(here, 'logo-source.png')).toString('base64');
const b = await chromium.launch(), p = await b.newPage({viewport: {width: 1080, height: 1080}});
await p.setContent('<canvas id=c width=1080 height=1080></canvas>');
const png = await p.evaluate(async (src) => {
  const img = new Image(); img.src = src; await img.decode();
  const S = 1080, c = document.getElementById('c'), x = c.getContext('2d');
  // split the wordmark into Go / Dev / Level: "Dev" is the orange run of columns
  const t = new OffscreenCanvas(img.width, img.height), tx = t.getContext('2d'); tx.drawImage(img, 0, 0);
  const d = tx.getImageData(0, 0, img.width, img.height).data, col = [];
  for (let i = 0; i < img.width; i++) { let a = 0, o = 0; for (let j = 0; j < img.height; j += 3) { const k = (j * img.width + i) * 4; if (d[k + 3] > 80) { a++; if (d[k] > 200 && d[k + 2] < 110) o++; } } col.push(a ? (o > a / 2 ? 2 : 1) : 0); }
  const o0 = col.indexOf(2), o1 = col.lastIndexOf(2), first = col.findIndex(v => v), last = col.length - 1 - [...col].reverse().findIndex(v => v);
  const trim = (a, bb) => { while (!col[a]) a++; while (!col[bb]) bb--; return [a, bb + 1]; };
  const words = [trim(first, o0 - 1), [o0, o1 + 1], trim(o1 + 1, last)], k = 640 / (words[2][1] - words[2][0]), lh = img.height * k * 1.02;
  // one flat layer with the three words stacked and centred
  const flat = new OffscreenCanvas(S, S), f = flat.getContext('2d'), top = S / 2 - lh * 1.5 - 6;
  words.forEach(([a, bb], i) => f.drawImage(img, a, 0, bb - a, img.height, S / 2 - (bb - a) * k / 2, top + i * lh, (bb - a) * k, img.height * k));
  const tint = (color) => { const o = new OffscreenCanvas(S, S), g = o.getContext('2d'); g.drawImage(flat, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, S, S); return o; };
  const rowMask = (o) => { const g = o.getContext('2d'); return o; };
  // background
  x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
  let g = x.createRadialGradient(S / 2, S * 0.42, 0, S / 2, S * 0.42, 760); g.addColorStop(0, 'rgba(250,70,30,0.34)'); g.addColorStop(0.55, 'rgba(250,70,30,0.07)'); g.addColorStop(1, 'rgba(250,70,30,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  x.fillStyle = 'rgba(255,255,255,0.06)'; for (let yy = 30; yy < S; yy += 54) for (let xx = 30; xx < S; xx += 54) x.fillRect(xx - 1.5, yy - 1.5, 3, 3);
  g = x.createRadialGradient(S / 2, S / 2, 300, S / 2, S / 2, 780); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  // the block is drawn in a tilted frame: slight rotation + shear reads as a 3D object seen from the upper left
  const DEPTH = 64, dx = 0.62, dy = 0.82;
  const scene = new OffscreenCanvas(S, S), s = scene.getContext('2d');
  // soft contact shadow
  s.save(); s.filter = 'blur(26px)'; s.globalAlpha = 0.9; s.drawImage(tint('#000'), DEPTH * dx + 26, DEPTH * dy + 40); s.restore();
  // extrusion: back to front; white letters get a cool grey side, "Dev" a deep orange side
  const isOrange = new OffscreenCanvas(S, S), io = isOrange.getContext('2d'); io.fillStyle = '#fff'; io.fillRect(0, top + lh, S, lh);
  const sideLayer = (shade) => { const o = new OffscreenCanvas(S, S), q = o.getContext('2d'); q.drawImage(flat, 0, 0); q.globalCompositeOperation = 'source-in';
    const gg = q.createLinearGradient(0, top, 0, top + lh * 3); const w = (v) => `rgb(${Math.round(150 * v + 14)},${Math.round(158 * v + 16)},${Math.round(176 * v + 20)})`, or = (v) => `rgb(${Math.round(190 * v + 30)},${Math.round(44 * v + 6)},${Math.round(14 * v + 2)})`;
    const e = 0.004; gg.addColorStop(0, w(shade)); gg.addColorStop(1 / 3 - e, w(shade)); gg.addColorStop(1 / 3 + e, or(shade)); gg.addColorStop(2 / 3 - e, or(shade)); gg.addColorStop(2 / 3 + e, w(shade)); gg.addColorStop(1, w(shade));
    q.fillStyle = gg; q.fillRect(0, 0, S, S); return o; };
  for (let i = DEPTH; i >= 1; i--) { const v = 0.22 + 0.55 * (1 - i / DEPTH); if (i % 2 && i > 2) continue; s.drawImage(sideLayer(v), i * dx, i * dy); }
  for (let i = DEPTH; i >= 1; i -= 1) if (i % 2 || i <= 2) s.drawImage(sideLayer(0.22 + 0.55 * (1 - i / DEPTH)), i * dx, i * dy);
  // front face with a light falling from the upper left, a thin bright bevel on the lit edges
  const face = new OffscreenCanvas(S, S), fc = face.getContext('2d'); fc.drawImage(flat, 0, 0); fc.globalCompositeOperation = 'source-atop';
  g = fc.createLinearGradient(200, top, 880, top + lh * 3); g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.26)'); fc.fillStyle = g; fc.fillRect(0, 0, S, S);
  const bevel = new OffscreenCanvas(S, S), bv = bevel.getContext('2d'); bv.drawImage(tint('#ffffff'), 0, 0); bv.globalCompositeOperation = 'destination-out'; bv.drawImage(flat, 2.5, 2.5); 
  s.drawImage(face, 0, 0); s.globalAlpha = 0.75; s.drawImage(bevel, 0, 0); s.globalAlpha = 1;
  // place the scene with the tilt, centred on the block including its depth
  x.save(); x.translate(S / 2 - DEPTH * dx / 2, S / 2 - DEPTH * dy / 2 + 4); x.transform(1, -0.085, -0.06, 1, 0, 0); x.rotate(-0.035); x.scale(0.96, 0.96); x.translate(-S / 2, -S / 2); x.drawImage(scene, 0, 0); x.restore();
  // the accent dot from the reel, as a small live mark
  x.shadowColor = 'rgba(250,70,30,0.9)'; x.shadowBlur = 30; x.fillStyle = '#fa461e'; x.beginPath(); x.arc(S / 2, 912, 13, 0, 7); x.fill(); x.shadowBlur = 0;
  // guide check: everything important must sit inside the circle Instagram crops to
  return c.toDataURL('image/png');
}, logo);
fs.writeFileSync(path.join(here, 'godevlevel-profile-3d.png'), Buffer.from(png.split(',')[1], 'base64'));
await b.close(); console.log('written');
