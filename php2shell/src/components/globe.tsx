// The dotted globe of S1 and S2: ~2600 white dots on a sphere (fibonacci lattice; "land" is a noise field, so it reads as continents without being geography)
// with 36 small server icons on the land. Canvas 2D, fully seeded. It can be built from any set of source points (the calendar's dust): `from` + `morph` 0..1.
// Shared by S1 (it forms and the servers light, then flash red) and S2 (it zooms past the camera: `scale` grows around (cx, cy)).
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { noise3D } from "@remotion/noise";
import { C, H, W } from "../theme";
import { clamp01, easeInOutCubic, rand } from "../motion";
import type { Pt } from "./dust";

export const GLOBE = { cx: 540, cy: 800, R: 330, tilt: 16 };
/** the globe's rotation (degrees) at a frame: continuous across S1 and S2 so the match is exact */
export const globeRot = (frame: number) => 24 + (frame / 30) * 13;

const N = 2600;
interface GDot { lat: number; lon: number; land: boolean }
export const GLOBE_DOTS: GDot[] = Array.from({ length: N }, (_, i) => {
  const y = 1 - (2 * (i + 0.5)) / N, lat = Math.asin(y), lon = ((i * 2.399963229728653) % (2 * Math.PI)) - Math.PI;
  const c = Math.cos(lat);
  return { lat, lon, land: noise3D("globe", c * Math.sin(lon) * 1.7, y * 1.7, c * Math.cos(lon) * 1.7) + 0.35 * noise3D("globe2", c * Math.sin(lon) * 4.1, y * 4.1, c * Math.cos(lon) * 4.1) > 0.02 };
});
/** 36 servers on land, spread out (seeded) */
export const SERVERS: { lat: number; lon: number }[] = (() => {
  const out: { lat: number; lon: number }[] = [];
  const cand = GLOBE_DOTS.filter((d) => d.land && Math.abs(d.lat) < 1.0);
  for (let k = 0, tries = 0; out.length < 36 && tries < 4000; tries++) {
    const d = cand[Math.floor(rand(tries, 5) * cand.length)];
    const ok = out.every((o) => Math.acos(Math.min(1, Math.sin(o.lat) * Math.sin(d.lat) + Math.cos(o.lat) * Math.cos(d.lat) * Math.cos(o.lon - d.lon))) > 0.3);
    if (ok) { out.push({ lat: d.lat, lon: d.lon }); k++; }
  }
  return out;
})();

/** orthographic projection: (lat, lon) in radians -> x, y (unit disc, y up), z (towards the camera) */
export const project = (lat: number, lon: number, rotDeg: number, tiltDeg: number) => {
  const l = lon + (rotDeg * Math.PI) / 180, c = Math.cos(lat);
  const x = c * Math.sin(l), y0 = Math.sin(lat), z0 = c * Math.cos(l), t = (tiltDeg * Math.PI) / 180;
  return { x, y: y0 * Math.cos(t) - z0 * Math.sin(t), z: y0 * Math.sin(t) + z0 * Math.cos(t) };
};

export interface GlobeProps {
  frame: number;
  cx?: number; cy?: number; R?: number; scale?: number; tilt?: number;
  alpha?: number;
  /** build the globe from these points: each dot flies from a source point to its place; `morph` 0 = all at the sources, 1 = a finished globe */
  from?: Pt[]; morph?: number;
  /** 0..1 per server: how lit it is (0 = dim outline, 1 = white); `alarm` 0..1 turns every lit server red (the flash) */
  lit?: number[]; alarm?: number; alarmGlow?: number;
  serverAlpha?: number;
}
export const Globe: React.FC<GlobeProps> = ({ frame, cx = GLOBE.cx, cy = GLOBE.cy, R = GLOBE.R, scale = 1, tilt = GLOBE.tilt, alpha = 1, from, morph = 1, lit, alarm = 0, alarmGlow = 0, serverAlpha = 1 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const assign = useMemo(() => from && from.length ? GLOBE_DOTS.map((_, i) => Math.floor(rand(i, 41) * from.length)) : null, [from]);
  useLayoutEffect(() => {
    const c = ref.current; if (!c) return;
    const g = c.getContext("2d")!; g.clearRect(0, 0, W, H);
    const rot = globeRot(frame), Rs = R * scale;
    if (!assign || morph >= 1) { g.strokeStyle = `rgba(245,245,247,${0.22 * alpha})`; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, Rs, 0, Math.PI * 2); g.stroke(); }   // the limb
    g.fillStyle = C.text;
    for (let i = 0; i < GLOBE_DOTS.length; i++) {
      const d = GLOBE_DOTS[i], q = project(d.lat, d.lon, rot, tilt);
      const face = clamp01((q.z + 0.15) / 0.35);
      const a = (d.land ? 1 : 0.34) * (0.25 + 0.75 * clamp01(q.z + 0.12)) * (q.z > -0.12 ? 1 : 0.4) * alpha;
      let x = cx + q.x * Rs, y = cy - q.y * Rs, al = a, sz = (d.land ? 3.1 : 2.3) * (0.85 + 0.3 * Math.max(q.z, 0)) * Math.min(1.6, 0.6 + 0.4 * scale);
      if (assign && morph < 1) {
        const s = from![assign[i]], delay = rand(i, 42) * 0.42, e = easeInOutCubic((morph - delay) / 0.58);
        const dx = x - s.x, dy = y - s.y, len = Math.hypot(dx, dy) || 1, amp = (rand(i, 43) - 0.5) * 0.5 * len * Math.sin(Math.PI * e);
        x = s.x + dx * e - (dy / len) * amp; y = s.y + dy * e + (dx / len) * amp; al = (0.85 + (a - 0.85) * e) * (e > 0 || morph > 0 ? 1 : 0); sz = 2.4 + (sz - 2.4) * e;
        if (face < 0 && e >= 1) al *= 0.5;
      } else if (assign && morph <= 0) continue;
      if (al <= 0.01) continue;
      g.globalAlpha = Math.min(1, al); g.beginPath(); g.arc(x, y, sz * 0.5, 0, Math.PI * 2); g.fill();
    }
    // the servers: tiny rack outlines, dim until lit, white when lit, red when the alarm flashes
    if (lit && serverAlpha > 0 && (!assign || morph >= 1)) {
      for (let i = 0; i < SERVERS.length; i++) {
        const s = SERVERS[i], q = project(s.lat, s.lon, rot, tilt);
        if (q.z < 0.05) continue;
        const x = cx + q.x * Rs, y = cy - q.y * Rs, k = (0.7 + 0.45 * q.z) * Math.min(1.5, scale), w = 28 * k, h = 20 * k, l = lit[i] ?? 0;
        const red = alarm * (l > 0.5 ? 1 : 0.6), base = l * 0.8 + 0.2;
        const col = red > 0 ? `rgb(255,${Math.round(245 - 186 * red)},${Math.round(247 - 199 * red)})` : C.text;
        g.globalAlpha = serverAlpha * Math.min(1, (0.45 + 0.55 * clamp01(q.z * 1.4)) * (red > 0 ? 1 : base)); g.fillStyle = "#000"; g.fillRect(x - w / 2, y - h / 2, w, h);
        g.strokeStyle = col; g.lineWidth = 2.2; g.lineCap = "round";
        if (l > 0.5 || red > 0) { g.shadowColor = red > 0 ? C.alarm : "#fff"; g.shadowBlur = (red > 0 ? 14 + 16 * alarmGlow : 12) * k; }
        g.strokeRect(x - w / 2, y - h / 2, w, h);
        g.beginPath(); g.moveTo(x - w / 2 + 4 * k, y - h / 6); g.lineTo(x + w / 2 - 4 * k, y - h / 6); g.moveTo(x - w / 2 + 4 * k, y + h / 6); g.lineTo(x + w / 2 - 4 * k, y + h / 6); g.stroke();
        g.shadowBlur = 0; g.fillStyle = C.text;
      }
    }
    g.globalAlpha = 1;
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} />;
};
