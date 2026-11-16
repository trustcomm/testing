import { W, H, scenes } from './data.js';
const q = new URLSearchParams(location.search);
const scale = Number(q.get('scale')) || 1, alpha = q.get('alpha') === '1';
// --layers: scene ids and/or layer names (a scene's layer defaults to its id). Empty = every scene.
const only = new Set((q.get('layers') || '').split(',').map(x => x.trim()).filter(Boolean));
const shown = s => !only.size || only.has(s.id) || only.has(s.layer ?? s.id);
const canvas = document.getElementById('c');
canvas.width = Math.max(2, 2 * Math.round(W * scale / 2));
canvas.height = Math.max(2, 2 * Math.round(H * scale / 2));
const ctx = canvas.getContext('2d');
const mods = await Promise.all(scenes.map(s => import(`./scenes/${s.id}.js`)));
await Promise.all(mods.map(m => m.init?.({ W, H, scale })));
await document.fonts.ready;
window.renderFrame = async t => {
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!alpha){ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);}
  for (let i=0;i<scenes.length;i++) {
    const s=scenes[i];if(t<s.start || t>=s.end || !shown(s))continue;
    ctx.save();ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    await mods[i].draw(ctx,t-s.start,{W,H,scale,dur:s.end-s.start,t});ctx.restore();
  }
};
window.grab=(type,quality=.95)=>canvas.toDataURL(type,quality);
window.__ready=true;
