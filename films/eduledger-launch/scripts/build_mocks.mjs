#!/usr/bin/env node
// TEMPORARY MOCK app screens for INTERNAL drafts only (user, 2026-10-06).
//   - Styled from the site's own look (ui/ref/site-home-hero-from-chat.jpg): white cards, navy type, blue→violet accents.
//   - Data: ONLY the site's demo data — "Greenfield Public School", "AK", 2,486 / 2,357 / ₹8.4L / 94.8%, Monthly revenue
//     +18.4%, 86% Fees collected, "12 new admissions · Ready for review", "Rahul Sharma … Present". Everything else is a grey
//     skeleton bar, never an invented name or number. Labels come from the fact ledger (BRIEF §1 E3/E4/E8).
//   - Every mock carries a burned-in "MOCK — internal draft" watermark (bottom-left corner).
//   - A real ui/<key>.* always wins (scripts/build_web.py); final builds never use mocks, and scripts/final_gate.py
//     fails a final render if any MOCK or PLACEHOLDER remains.
// Usage: node scripts/build_mocks.mjs   → web/assets/ui/mock/<key>.png (+ out/mocks/<key>.html, the source page)
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(ROOT, ".kit/package.json"));
const puppeteer = require("puppeteer-core");
const OUT = join(ROOT, "web/assets/ui/mock"), SRC = join(ROOT, "out/mocks");
mkdirSync(OUT, { recursive: true }); mkdirSync(SRC, { recursive: true });

// ------------------------------------------------------------------ shared look (measured from the site screenshot)
const CSS = `
@font-face { font-family: "Inter"; src: url(/web/assets/fonts/Inter-Regular.otf); font-weight: 400; }
@font-face { font-family: "Inter"; src: url(/web/assets/fonts/Inter-Medium.otf); font-weight: 500; }
@font-face { font-family: "Inter"; src: url(/web/assets/fonts/Inter-SemiBold.otf); font-weight: 600; }
@font-face { font-family: "Inter"; src: url(/web/assets/fonts/Inter-Bold.otf); font-weight: 700; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: var(--w); height: var(--h); overflow: hidden; }
body { font-family: "Inter", sans-serif; color: #0f1732; background: #f7f8fc;
  background-image: linear-gradient(rgba(15,23,50,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,50,0.035) 1px, transparent 1px);
  background-size: 64px 64px; position: relative; }
.app { position: absolute; inset: 0; display: flex; }
.side { width: 300px; background: #fff; border-right: 1px solid #e8ebf3; padding: 34px 22px; display: flex; flex-direction: column; gap: 6px; }
.brand { display: flex; align-items: center; gap: 14px; margin: 0 8px 34px; }
.brand i { width: 46px; height: 58px; background: url(/web/assets/brand/logo-mark.png) center/contain no-repeat; display: block; }
.brand b { font: 700 28px/1 "Inter"; letter-spacing: -0.01em; }
.nav { font: 500 21px/1 "Inter"; color: #4a5467; padding: 16px 18px; border-radius: 14px; }
.nav.on { color: #fff; background: linear-gradient(90deg, #375cea, #7140ed); box-shadow: 0 10px 24px rgba(83, 73, 206, 0.28); }
.main { flex: 1; padding: 40px 48px; display: flex; flex-direction: column; gap: 30px; min-width: 0; }
.top { display: flex; align-items: center; justify-content: space-between; }
.eyebrow { font: 700 19px/1 "Inter"; letter-spacing: 0.08em; color: #2d60e5; text-transform: uppercase; }
.title { font: 700 36px/1.15 "Inter"; margin-top: 10px; letter-spacing: -0.01em; }
.av { width: 64px; height: 64px; border-radius: 50%; background: #ece8fd; color: #6a3fe0; font: 700 24px/64px "Inter"; text-align: center; }
.card { background: #fff; border-radius: 28px; box-shadow: 0 18px 50px rgba(15, 23, 50, 0.08); border: 1px solid #edf0f6; }
.tiles { display: grid; gap: 22px; }
.tile { background: #fff; border: 1px solid #edf0f6; border-radius: 22px; padding: 28px 30px; box-shadow: 0 8px 24px rgba(15,23,50,0.05); }
.tile b { display: block; font: 700 46px/1.1 "Inter"; letter-spacing: -0.01em; }
.tile span { display: block; margin-top: 10px; font: 400 23px/1.2 "Inter"; color: #4a5467; }
.sk { display: block; height: 18px; border-radius: 9px; background: #e6e9f2; }
.sk.v { height: 40px; width: 150px; border-radius: 12px; }
.chart { background: #101834; border-radius: 28px; padding: 30px 34px; display: flex; flex-direction: column; color: #fff; }
.chart .hd { display: flex; justify-content: space-between; font: 500 24px/1 "Inter"; }
.chart .hd em { font-style: normal; color: #3eae91; font-weight: 600; }
.bars { flex: 1; display: flex; align-items: flex-end; gap: 22px; margin-top: 26px; }
.bars i { flex: 1; border-radius: 10px 10px 4px 4px; background: linear-gradient(180deg, #9a7cf4, #5b7cfa); display: block; }
.lav { background: #f3f1fd; border-radius: 28px; padding: 34px; display: flex; flex-direction: column; justify-content: flex-end; }
.lav .ic { width: 44px; height: 32px; border: 4px solid #6a3fe0; border-radius: 7px; position: relative; margin-bottom: auto; }
.lav .ic::after { content: ""; position: absolute; left: 0; right: 0; top: 7px; height: 4px; background: #6a3fe0; }
.lav b { font: 700 58px/1 "Inter"; letter-spacing: -0.02em; }
.lav span { margin-top: 12px; font: 400 24px/1.2 "Inter"; color: #4a5467; }
.toast { display: flex; align-items: center; gap: 20px; background: #fff; border: 2px solid #0f1732; border-radius: 22px; padding: 22px 28px;
  box-shadow: 0 18px 40px rgba(15,23,50,0.12); }
.toast .bolt { width: 62px; height: 62px; border-radius: 16px; background: #dff5ec; display: flex; align-items: center; justify-content: center; }
.toast b { display: block; font: 600 26px/1.2 "Inter"; }
.toast span { display: block; margin-top: 6px; font: 400 22px/1.2 "Inter"; color: #4a5467; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font: 600 19px/1 "Inter"; color: #6b7487; letter-spacing: 0.04em; text-transform: uppercase; padding: 0 22px 18px; }
td { padding: 20px 22px; border-top: 1px solid #eef1f6; font: 500 24px/1.2 "Inter"; vertical-align: middle; }
.who { display: flex; align-items: center; gap: 16px; }
.ini { width: 50px; height: 50px; border-radius: 50%; background: #e8edfd; color: #375cea; font: 700 19px/50px "Inter"; text-align: center; flex: none; }
.ini.sk0 { background: #eceff5; }
.pill { display: inline-block; font: 600 19px/1 "Inter"; padding: 10px 16px; border-radius: 999px; }
.pill.ok { background: #dff5ec; color: #1f7a62; }
.chip { display: inline-block; width: 92px; height: 34px; border-radius: 999px; background: #eceff5; }
.chip.g { background: #dff5ec; } .chip.a { background: #fdf0d9; }
.bar { height: 16px; border-radius: 8px; background: #eceff5; overflow: hidden; }
.bar i { display: block; height: 100%; background: linear-gradient(90deg, #375cea, #7140ed); border-radius: 8px; }
/* the watermark: burned in, bottom-left, readable down to the smallest frame (S15, 600 px) */
.wm { position: absolute; left: 22px; bottom: 22px; z-index: 9; font: 700 var(--wm, 36px)/1 "Inter"; letter-spacing: 0.02em; color: #fff;
  background: rgba(15, 23, 50, 0.92); border: 3px dashed #f5b83d; border-radius: 14px; padding: 14px 20px; }
`;
const NAV = ["Dashboard", "Student records", "Admissions", "Attendance", "Staff & payroll", "Fees & invoices", "Cashbook", "Reports & analytics"];
const BOLT = '<svg width="34" height="34" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill="none" stroke="#2f9e7e" stroke-width="2" stroke-linejoin="round"/></svg>';
const BARS = [0.38, 0.55, 0.47, 0.68, 0.6, 0.84, 0.74, 1.0];   // the site's Monthly revenue bars, relative heights
const shell = (active, eyebrow, body) => `
<div class="app"><div class="side"><div class="brand"><i></i><b>EduLedger</b></div>
${NAV.map((n) => `<div class="nav${n === active ? " on" : ""}">${n}</div>`).join("")}</div>
<div class="main"><div class="top"><div><div class="eyebrow">${eyebrow}</div><div class="title">Greenfield Public School</div></div><div class="av">AK</div></div>
${body}</div></div>`;
const chart = (h) => `<div class="chart" style="height:${h}px"><div class="hd"><span>Monthly revenue</span><em>+18.4%</em></div>
<div class="bars">${BARS.map((b) => `<i style="height:${Math.round(b * 100)}%"></i>`).join("")}</div></div>`;
const toast = `<div class="toast"><div class="bolt">${BOLT}</div><div><b>12 new admissions</b><span>Ready for review</span></div></div>`;
const skRows = (n, cols) => Array.from({ length: n }, (_, i) => `<tr>${cols(i)}</tr>`).join("");
const W = (p) => `<i class="sk" style="width:${p}px"></i>`;

const SCREENS = {
  dashboard: { w: 1920, h: 1080, html: shell("Dashboard", "Overview", `
    <div class="tiles" style="grid-template-columns:repeat(4,1fr)">
      <div class="tile"><b>2,486</b><span>Students</span></div><div class="tile"><b>2,357</b><span>Present</span></div>
      <div class="tile"><b>₹8.4L</b><span>Collected</span></div><div class="tile"><b>94.8%</b><span>Attendance</span></div></div>
    <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:26px;position:relative">
      ${chart(640)}<div class="lav"><div class="ic"></div><b>86%</b><span>Fees collected</span></div>
      <div style="position:absolute;left:-24px;bottom:-36px">${toast}</div></div>`) },

  students: { w: 1920, h: 1080, html: shell("Student records", "Student records", `
    <div class="tiles" style="grid-template-columns:repeat(3,1fr)">
      <div class="tile"><b>2,486</b><span>Students</span></div><div class="tile"><b>2,357</b><span>Present</span></div>
      <div class="tile"><b>94.8%</b><span>Attendance</span></div></div>
    <div style="display:grid;grid-template-columns:1fr 430px;gap:26px;align-items:start">
      <div class="card" style="padding:28px 12px 8px"><table><tr><th>Student</th><th>Class</th><th>Attendance</th><th>Fees</th></tr>
        <tr><td><div class="who"><div class="ini">RS</div>Rahul Sharma</div></td><td>${W(90)}</td><td><span class="pill ok">Present</span></td><td><span class="chip"></span></td></tr>
        ${skRows(7, (i) => `<td><div class="who"><div class="ini sk0"></div>${W(180 + (i * 37) % 70)}</div></td><td>${W(90)}</td><td><span class="chip"></span></td><td><span class="chip"></span></td>`)}
      </table></div>
      <div>${toast}</div></div>`) },

  payroll: { w: 1920, h: 1080, html: shell("Staff & payroll", "Staff & payroll", `
    <div class="tiles" style="grid-template-columns:repeat(3,1fr)">
      <div class="tile"><i class="sk v"></i><span>Staff</span></div><div class="tile"><i class="sk v"></i><span>Payroll</span></div>
      <div class="tile"><i class="sk v"></i><span>Payment status</span></div></div>
    <div class="card" style="padding:28px 12px 8px"><table><tr><th>Staff</th><th>Role</th><th>Payroll</th><th>Payment status</th></tr>
      ${skRows(6, (i) => `<td><div class="who"><div class="ini sk0"></div>${W(170 + (i * 41) % 80)}</div></td><td>${W(120 + (i * 23) % 50)}</td><td>${W(110)}</td><td><span class="chip ${i % 3 === 2 ? "a" : "g"}"></span></td>`)}
    </table></div>`) },

  fees: { w: 1920, h: 1080, html: shell("Fees & invoices", "Fees & invoices", `
    <div class="tiles" style="grid-template-columns:1fr 1fr 1fr">
      <div class="tile"><b>₹8.4L</b><span>Collected</span></div>
      <div class="tile"><b>86%</b><span>Fees collected</span><div class="bar" style="margin-top:16px"><i style="width:86%"></i></div></div>
      <div class="tile"><i class="sk v"></i><span>Pending fees</span></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px">
      ${chart(500)}
      <div class="card" style="padding:28px 12px 8px"><table><tr><th>Student</th><th>Invoice</th><th>Payment status</th></tr>
        ${skRows(6, (i) => `<td><div class="who"><div class="ini sk0"></div>${W(150 + (i * 29) % 60)}</div></td><td>${W(100)}</td><td><span class="chip ${i % 4 === 3 ? "a" : "g"}"></span></td>`)}
      </table></div></div>`) },

  cashbook: { w: 1920, h: 1080, html: shell("Cashbook", "Financial reporting & cashbook", `
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:26px">
      ${chart(420)}
      <div style="display:flex;flex-direction:column;gap:22px"><div class="tile"><b>₹8.4L</b><span>Collected</span></div>
        <div class="tile"><i class="sk v"></i><span>Monthly finances</span></div></div></div>
    <div class="card" style="padding:28px 12px 8px"><table><tr><th>Entry</th><th>In</th><th>Out</th><th>Balance</th></tr>
      ${skRows(4, (i) => `<td>${W(260 + (i * 53) % 90)}</td><td>${i % 2 ? W(90) : ""}</td><td>${i % 2 ? "" : W(90)}</td><td>${W(110)}</td>`)}
    </table></div>`) },

  receipt: { w: 1200, h: 1600, wm: "40px", html: `
    <div style="position:absolute;inset:60px 70px 120px;background:#fff;border-radius:34px;box-shadow:0 30px 80px rgba(15,23,50,0.12);padding:80px 76px;display:flex;flex-direction:column;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:24px"><i style="width:84px;height:106px;background:url(/web/assets/brand/logo-mark.png) center/contain no-repeat;display:block"></i>
        <div><div style="font:700 46px/1 Inter">EduLedger</div><div style="font:400 30px/1.3 Inter;color:#4a5467;margin-top:10px">Greenfield Public School</div></div></div>
      <div style="height:2px;background:#e8ebf3"></div>
      <div class="eyebrow" style="font-size:32px">Fee receipt</div>
      ${["Receipt no.", "Student", "Class", "Date", "Amount"].map((l, i) =>
        `<div style="display:flex;justify-content:space-between;align-items:center"><span style="font:500 38px/1 Inter;color:#4a5467">${l}</span><i class="sk" style="height:26px;border-radius:13px;width:${[260, 330, 150, 230, 270][i]}px"></i></div>`).join("")}
      <div style="height:2px;background:#e8ebf3"></div>
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="font:600 40px/1 Inter">Payment status</span>
        <span class="pill ok" style="font-size:36px;padding:16px 30px">Paid</span></div>
    </div>` },
};

// ------------------------------------------------------------------ render
const TYPES = { ".otf": "font/otf", ".png": "image/png", ".html": "text/html" };
const server = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
  res.end(readFileSync(p));
}).listen(0);
const browser = await puppeteer.launch({
  executablePath: process.env.PRODUCER_HEADLESS_SHELL_PATH || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
  args: ["--no-sandbox"] });
const page = await browser.newPage();
for (const [key, s] of Object.entries(SCREENS)) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
<body style="--w:${s.w}px;--h:${s.h}px;--wm:${s.wm || "36px"}">${s.html}<div class="wm">MOCK — internal draft</div></body></html>`;
  writeFileSync(join(SRC, `${key}.html`), html);
  await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${server.address().port}/out/mocks/${key}.html`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUT, `${key}.png`), clip: { x: 0, y: 0, width: s.w, height: s.h } });
  console.log(`web/assets/ui/mock/${key}.png  ${s.w}×${s.h}`);
}
await browser.close();
server.close();
