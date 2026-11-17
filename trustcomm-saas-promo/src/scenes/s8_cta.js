// 34.0–42.6 s · "Pehle dekho, aapka Google profile kitna strong hai. Free score check karo — trustcomm dot app slash score."
// The blue line sweeps into a score gauge (no number), three "fix first" chips, then the CTA card: Free Google Score,
// trustcomm.app/score typed in, the button, Link in bio, the wordmark.
import {W, H, C, F, B, P, env, initKit, stage, card, rr, words, text, pill, tick, wordmark, dot, finish, clamp, lerp, rgba, font} from '../kit.js';
export const init = initKit;
export function draw(ctx, _t, {t: T}) {
  const enter = P(T, 34.05, 0.5, 'camera'), cta = P(T, B.free - 0.15, 0.6, 'camera');
  ctx.save(); ctx.translate(0, (1 - enter) * 1920);
  stage(ctx, T);
  words(ctx, T, ['Pehle dekho, aapka', 'Google profile', 'kitna strong hai?'], {y: 350, size: 76, times: [B.pehle, 34.56, 35.12, 35.5, B.profile, 36.28, B.strong, 37.26], accent: {3: C.blue, 4: C.blue}, out: B.free - 0.2});
  // gauge
  const gx = 540, gy = lerp(1060, 820, cta), gr = lerp(300, 220, cta), ga = P(T, 34.6, 0.5, 'out');
  if (ga > 0) {
    ctx.save(); ctx.globalAlpha *= ga; ctx.lineCap = 'round'; ctx.lineWidth = gr * 0.15;
    ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, 0); ctx.strokeStyle = '#e7e7e3'; ctx.stroke();
    const sweep = P(T, 34.7, 1.0, 'out'), wig = T > 35.7 ? 0.5 + 0.18 * Math.sin((T - 35.7) * 2.6) : 0.5 * sweep;
    ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, Math.PI + Math.PI * wig); ctx.strokeStyle = C.blue; ctx.stroke();
    const na = Math.PI + Math.PI * wig; ctx.strokeStyle = C.ink; ctx.lineWidth = gr * 0.035; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(na) * gr * 0.78, gy + Math.sin(na) * gr * 0.78); ctx.stroke();
    dot(ctx, gx, gy, gr * 0.06, 1, C.ink, 0);
    text(ctx, '?', gx, gy - gr * 0.25, gr * 0.5, {weight: 800, fam: F.head, align: 'center', color: C.blue});
    text(ctx, 'Your Google score', gx, gy + gr * 0.3, gr * 0.13, {weight: 600, color: C.muted, align: 'center'});
    ctx.restore();
  }
  // three things to fix first (the real quiz topics)
  const fa = 1 - cta;
  if (fa > 0) { text(ctx, '3 things to fix first', 540, 1300, 32, {weight: 600, color: C.muted, align: 'center', a: P(T, 36.1, 0.3, 'out') * fa});
    [['Reviews ka reply', 250, 36.3], ['Opening hours', 590, 36.55], ['Photos', 860, 36.8]].forEach(([s, x, t0]) => pill(ctx, s, x, 1380, {size: 32, a: P(T, t0, 0.25, 'out') * fa, s: 0.7 + 0.3 * P(T, t0, 0.5, 'pop'), weight: 600})); }
  // CTA card
  const ca = P(T, B.free - 0.1, 0.6, 'pop');
  if (ca > 0) {
    ctx.save(); ctx.translate(540, 1240); ctx.scale(0.8 + 0.2 * ca, 0.8 + 0.2 * ca); ctx.globalAlpha *= clamp(ca * 1.5); ctx.translate(-540, -1240 + (1 - ca) * 200);
    card(ctx, 80, 1010, 920, 470, 48, {shadow: 0.14});
    text(ctx, 'Free Google Score', 540, 1110, 70, {weight: 800, fam: F.head, align: 'center'});
    text(ctx, '7 sawaal  ·  no sign-in  ·  free', 540, 1166, 32, {weight: 500, color: C.muted, align: 'center'});
    rr(ctx, 140, 1205, 800, 96, 48); ctx.fillStyle = '#f3f3f0'; ctx.fill(); ctx.strokeStyle = '#e2e2dd'; ctx.lineWidth = 2; ctx.stroke();
    const url = 'trustcomm.app/score', n = Math.floor(clamp((T - B.url) * 13.5, 0, url.length));
    ctx.font = font(44, 700); const full = ctx.measureText(url).width, x0 = 540 - full / 2;
    text(ctx, url.slice(0, n), x0, 1268, 44, {weight: 700, color: C.ink}); if (n > 9) text(ctx, url.slice(0, Math.min(n, 13)).slice(9), x0 + ctx.measureText('trustcomm').width, 1268, 44, {weight: 700, color: C.blue});
    ctx.font = font(44, 700); if (n < url.length || Math.floor(T * 2.5) % 2 === 0) { ctx.fillStyle = C.blue; ctx.fillRect(x0 + ctx.measureText(url.slice(0, n)).width + 4, 1226, 4, 52); }
    const pulse = env(T, B.score, B.score + 0.4, 0.08, 0.3);
    ctx.save(); ctx.translate(540, 1390); ctx.scale(1 + 0.06 * pulse, 1 + 0.06 * pulse); rr(ctx, -330, -50, 660, 100, 50); ctx.fillStyle = C.blue; ctx.fill(); text(ctx, 'Check your score  →', 0, 14, 40, {weight: 700, color: '#fff', align: 'center'}); ctx.restore();
    ctx.restore();
    const rg = P(T, B.score, 0.6, 'out'); if (rg > 0 && rg < 1) { ctx.save(); ctx.globalAlpha = 1 - rg; ctx.strokeStyle = C.blue; ctx.lineWidth = 6; rr(ctx, 210 - rg * 40, 1340 - rg * 40, 660 + rg * 80, 100 + rg * 80, 50 + rg * 40); ctx.stroke(); ctx.restore(); }
  }
  // logo + link in bio
  const lg = P(T, B.free + 0.2, 0.6, 'out'); if (lg > 0) wordmark(ctx, 540, 400, 120, {reveal: lg});
  pill(ctx, 'Link in bio', 540, 520, {size: 34, a: P(T, 40.55, 0.3, 'out'), s: 0.7 + 0.3 * P(T, 40.55, 0.5, 'pop'), fill: C.ink, color: '#fff', stroke: null, weight: 700, fam: F.head});
  finish(ctx, T);
  ctx.restore();
}
