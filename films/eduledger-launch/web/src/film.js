/* EduLedger launch film: one GSAP timeline in FILM time (seconds from the film's first frame).
 * Times come from assets/timing.js (generated from timeline.json): shot windows, VO word onsets, grid, SFX anchors.
 * Layers per shot: section.clip (owned by HyperFrames) > .inner (transitions only) > .cam (camera only) > content.
 * Rules: deterministic (no Math.random / Date), finite repeats, overshooting eases never drive `filter`
 * (blur(<0) is invalid CSS), fromTo with immediateRender:false when an element is tweened again later.
 */
(function () {
  const E = window.EL;
  const P = E.P, PH = E.PH, END = E.END, S = E.shots, W = E.words;
  const beat = (n) => PH + n * P;
  const word = (line, i) => W[line][i].t;
  const LEAD = 0.06;                     // type leads its word (DESIGN.md, P7)
  const IR = { immediateRender: false };
  const sfx = (id, shot) => E.sfx.filter((e) => e.sfx === id && e.event.startsWith(shot + " ")).map((e) => e.t);
  const inner = (id) => `#${id} > .inner`;
  const cam = (id) => `#${id} .cam`;

  // ------------------------------------------------------------------ global stage: camera never sleeps
  function stage(tl) {
    const frames = Math.round(END * 60);
    tl.fromTo(".floor", { backgroundPosition: "0px 0px" }, { backgroundPosition: `0px ${96 * 28}px`, duration: END, ease: "none" }, 0);
    tl.fromTo("#grain", { backgroundPosition: "0px 0px" },
      { backgroundPosition: `${137 * frames}px ${61 * frames}px`, duration: END, ease: `steps(${frames})` }, 0);
    document.querySelectorAll(".cross").forEach((el, i) => {
      const per = 1.4 + (i % 5) * 0.37;
      tl.fromTo(el, { opacity: 0.12 }, { opacity: 0.62, duration: per / 2, ease: "sine.inOut", yoyo: true,
        repeat: Math.ceil(END / per) * 2 - 1 }, (i * 0.173) % per);
    });
    tl.fromTo("#vignette", { opacity: 0.86 }, { opacity: 1, duration: 2.1, ease: "sine.inOut", yoyo: true,
      repeat: Math.ceil(END / 2.1) - 1 }, 0);
  }

  // act lighting: red chaos (Act 1) → brand light from the drop on
  function lighting(tl, has) {
    if (has("S07")) tl.to("#glow-red", { opacity: 0, duration: 0.3, ease: "power2.out" }, S.S07.start - 0.05);
    else tl.set("#glow-red", { opacity: 0 }, 8.0);
    const drop = beat(24);
    tl.fromTo("#glow-brand", { opacity: 0 }, { opacity: 1, duration: 0.14, ease: "power2.out", ...IR }, drop);
    tl.to("#glow-brand", { opacity: 0.55, duration: 1.0, ease: "sine.out" }, drop + 0.2);
    tl.fromTo("#floor-brand", { opacity: 0 }, { opacity: 0.85, duration: 0.2, ease: "power2.out", ...IR }, drop);
    tl.to("#floor-neutral", { opacity: 0.35, duration: 0.2, ease: "power2.out" }, drop);
    tl.to("#glow-brand", { opacity: 0.38, duration: 0.6, ease: "sine.inOut" }, S.S13.start - 0.1);
    tl.to("#glow-brand", { opacity: 0.5, duration: 0.6, ease: "sine.inOut" }, S.S19.start - 0.1);
    tl.to("#glow-brand", { opacity: 0.32, duration: 0.6, ease: "sine.inOut" }, S.S22.start);
    ["S23", "S24", "S25"].forEach((id) => {                         // each stomp punches the brand light
      tl.to("#glow-brand", { opacity: 0.95, duration: 0.06, ease: "power2.out" }, S[id].start);
      tl.to("#glow-brand", { opacity: 0.45, duration: 0.5, ease: "power2.out" }, S[id].start + 0.08);
    });
    tl.to("#glow-brand", { opacity: 1, duration: 0.12, ease: "power2.out" }, S.S26.start);
    tl.to("#glow-brand", { opacity: 0.78, duration: 1.2, ease: "sine.out" }, S.S26.start + 0.2);
    tl.to("#glow-brand", { opacity: 0.6, duration: 1.0, ease: "sine.inOut" }, S.S27.start);
  }

  // ------------------------------------------------------------------ transitions (P1 menu), keyed by the incoming shot
  const TR = {
    S02: "glitch", S03: "glitch", S04: "glitch", S05: "glitch", S06: "glitch", S07: "collapse", S08: "flare",
    S09: "streak", S10: "push", S11: "vwhip", S12: "vwhip", S13: "streak", S13b: "pushout", S14: "streak",
    S15: "morph", S16: "morph", S17: "streak", S18: "morph", S19: "slideup", S20: "push", S21: "vwhip",
    S22: "pullout", S23: "stomp", S24: "stomp", S25: "stomp", S26: "linereturn", S27: "push",
  };
  function whip(tl, t) {                 // the streak is the ledger line (P2); its peak sits on the cut
    tl.fromTo("#streak", { xPercent: -130, opacity: 1, scaleY: 0.6 },
      { xPercent: 260, scaleY: 1.5, duration: 0.36, ease: "power3.in", ...IR }, t - 0.2);
    tl.set("#streak", { opacity: 0 }, t + 0.16);
  }
  function glitch(tl, t, into) {         // 2-frame RGB-split bars + a stepped jitter on the incoming shot
    const offs = [[70, -110, 40, -30], [-50, 80, -90, 20]];
    tl.set("#glitch", { opacity: 1 }, t);
    tl.set("#glitch i", { x: (i) => offs[0][i] }, t);
    tl.set("#glitch i", { x: (i) => offs[1][i] }, t + 1 / 60);
    tl.set("#glitch", { opacity: 0 }, t + 2 / 60);
    tl.fromTo(inner(into), { x: -34, skewX: 7 }, { x: 0, skewX: 0, duration: 0.1, ease: "steps(3)" }, t);
  }
  function transitions(tl, ids) {
    for (let k = 1; k < ids.length; k++) {
      const out = ids[k - 1], into = ids[k], t = S[into].start, type = TR[into];
      if (!type || Math.abs(S[out].end - t) > 1e-6) continue;
      const exit = (vars, d = 0.2, ease = "power2.in") => tl.to(inner(out), { ...vars, duration: d, ease }, t - d);
      if (type === "glitch") glitch(tl, t, into);
      if (type === "streak") {
        whip(tl, t);
        exit({ x: -240, filter: "blur(24px)" });
        tl.fromTo(inner(into), { x: 280, filter: "blur(24px)" }, { x: 0, filter: "blur(0px)", duration: 0.5, ease: "expo.out" }, t);
      }
      if (type === "vwhip") {           // cut-the-curve vertical whip: same direction both sides
        whip(tl, t);
        exit({ y: -150, filter: "blur(30px)" });
        tl.fromTo(inner(into), { y: 150, filter: "blur(30px)" }, { y: 0, filter: "blur(0px)", duration: 0.36, ease: "power2.out" }, t);
      }
      if (type === "push") {
        exit({ scale: 1.25, filter: "blur(16px)" });
        tl.fromTo(inner(into), { scale: 0.84, filter: "blur(12px)" }, { scale: 1, filter: "blur(0px)", duration: 0.45, ease: "expo.out" }, t);
      }
      if (type === "pushout") {         // the class grid shrinks away; the dashboard arrives
        exit({ scale: 0.55, filter: "blur(10px)" }, 0.25, "power3.in");
        tl.fromTo(inner(into), { scale: 1.18, filter: "blur(14px)" }, { scale: 1, filter: "blur(0px)", duration: 0.5, ease: "expo.out" }, t);
      }
      if (type === "morph") {           // the object carries across; a short blur hides the swap
        exit({ scale: 0.92, filter: "blur(14px)" }, 0.18);
        tl.fromTo(inner(into), { scale: 1.08, filter: "blur(14px)" }, { scale: 1, filter: "blur(0px)", duration: 0.35, ease: "power3.out" }, t);
      }
      if (type === "slideup") {
        whip(tl, t);
        exit({ y: -200, filter: "blur(20px)" });
        tl.fromTo(inner(into), { y: 1080 }, { y: 0, duration: 0.55, ease: "power3.out" }, t);
      }
      if (type === "pullout") {         // the dolly out across the full dashboard (camera in S22)
        exit({ scale: 1.2, filter: "blur(14px)" });
        tl.fromTo(inner(into), { filter: "blur(12px)" }, { filter: "blur(0px)", duration: 0.35, ease: "power2.out" }, t);
      }
      if (type === "stomp") {           // hard cut on the hit: a short shake, no blur
        tl.fromTo(inner(into), { x: 0 }, { keyframes: [{ x: 14, duration: 0.03 }, { x: -11, duration: 0.03 }, { x: 6, duration: 0.03 }, { x: 0, duration: 0.04 }] }, t);
      }
      if (type === "linereturn") exit({ scale: 0.94, filter: "blur(18px)" }, 0.22);
    }
  }

  // ------------------------------------------------------------------ text helpers
  function wordsIn(tl, ids, times, style = "up") {
    ids.forEach((id, k) => {
      const t = times[k] - LEAD;
      if (style === "up") tl.fromTo(id, { y: 56 }, { y: 0, duration: 0.32, ease: k % 2 ? "power3.out" : "expo.out" }, t);
      else if (style === "pop") tl.fromTo(id, { scale: 0.7 }, { scale: 1, duration: 0.3, ease: "back.out(1.8)" }, t);
      else if (style === "slide") tl.fromTo(id, { x: -80 }, { x: 0, duration: 0.3, ease: "expo.out" }, t);
      tl.fromTo(id, { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.26, ease: "power2.out" }, t);
    });
  }
  function slam(tl, id, t, from = 1.45) {   // Act 1 kinetic word
    tl.fromTo(id, { scale: from }, { scale: 1, duration: 0.16, ease: "expo.out" }, t);
    tl.fromTo(id, { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.14, ease: "power2.out" }, t);
  }
  function crystallise(tl, lock, t, end) {
    tl.fromTo(`${lock} .mark`, { scale: 0.8 }, { scale: 1, duration: 0.55, ease: "back.out(1.4)" }, t);
    tl.fromTo(`${lock} .mark`, { opacity: 0, filter: "blur(18px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power2.out" }, t);
    tl.fromTo(`${lock} .word`, { x: -40, opacity: 0, filter: "blur(10px)" },
      { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "expo.out" }, t + 0.1);
    tl.fromTo(`${lock} .glint`, { backgroundPosition: "100% 0%" },
      { backgroundPosition: "0% 0%", duration: 0.9, ease: "power2.inOut", stagger: 0.14 }, t + 0.22);
    tl.fromTo(lock, { scale: 1 }, { scale: 1.035, duration: end - t, ease: "none" }, t);
  }
  function drift(tl, id, from = 1, to = 1.05) {   // slow camera push over the whole shot
    tl.fromTo(cam(id), { scale: from }, { scale: to, duration: S[id].end - S[id].start, ease: "none" }, S[id].start);
  }

  // ------------------------------------------------------------------ Act 1: paperwork chaos (red)
  function S01(tl) {
    const s = S.S01, t0 = Math.max(0.05, word("L01", 0));
    tl.fromTo("#s01-book", { y: -780, filter: "blur(14px)" }, { y: 0, filter: "blur(0px)", duration: t0, ease: "power4.in" }, 0);
    tl.fromTo("#s01-book", { scaleY: 0.86, scaleX: 1.05 }, { scaleY: 1, scaleX: 1, duration: 0.32, ease: "back.out(2.2)" }, t0);
    tl.fromTo("#s01-ring", { scale: 0.55, opacity: 0.95 }, { scale: 1.55, opacity: 0, duration: 0.5, ease: "expo.out" }, t0);
    slam(tl, "#s01-word", t0);
    tl.to("#s01-word", { scale: 8, duration: 0.38, ease: "power2.in" }, s.end - 0.38);   // dolly through camera
    tl.to("#s01-word", { opacity: 0, duration: 0.2, ease: "power2.in" }, s.end - 0.2);
  }
  function S02(tl) {
    const s = S.S02, t0 = word("L01", 1) - LEAD;
    tl.fromTo("#s02-hero", { x: 900, rotation: 9 }, { x: 0, rotation: 0, duration: 0.24, ease: "power3.out" }, s.start);
    tl.fromTo("#s02-hero", { filter: "blur(22px)" }, { filter: "blur(0px)", duration: 0.24, ease: "power2.out" }, s.start);
    tl.fromTo("#s02-word", { x: -260 }, { x: 0, duration: 0.22, ease: "expo.out" }, t0);
    tl.fromTo("#s02-word", { opacity: 0, filter: "blur(12px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.18, ease: "power2.out" }, t0);
    drift(tl, "S02", 1, 1.06);
  }
  function S03(tl) {
    const s = S.S03, r = Array.from(document.querySelectorAll("#s03-rings .ring"));
    r.forEach((el, i) => {               // icons multiply on sixteenths, three per tick
      const t = s.start + 0.02 + Math.floor(i / 3) * (P / 4);
      tl.fromTo(el, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.14, ease: "back.out(3)" }, t);
      tl.fromTo(el.querySelector(".ic"), { rotation: -14 }, { rotation: 14, duration: P / 8, ease: "sine.inOut", yoyo: true, repeat: 7 }, t);
      tl.fromTo(el.querySelector(".halo-ring"), { scale: 0.8, opacity: 0.9 }, { scale: 1.7, opacity: 0, duration: 0.5, ease: "power2.out" }, t);
    });
    slam(tl, "#s03-word", word("L01", 2) - LEAD, 0.6);
    drift(tl, "S03", 1.04, 1);
  }
  function S04(tl) {
    const s = S.S04, cells = Array.from(document.querySelectorAll("#s04-sheet .cell"));
    tl.fromTo("#s04-sheet", { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "none" }, s.start);
    const ticks = [];                    // flicker: eighths, then sixteenths in the last beat (speed-up inside the shot)
    for (let t = s.start + 0.02; t < s.end - P; t += P / 2) ticks.push(t);
    for (let t = s.end - P; t < s.end - 0.03; t += P / 4) ticks.push(t);
    ticks.forEach((t, k) => {
      const pick = cells.filter((_, i) => (i * 7 + k * 13) % 9 === 0);
      tl.fromTo(pick, { backgroundColor: "rgba(240,56,75,0.55)" }, { backgroundColor: "rgba(255,255,255,0.05)", duration: P / 2, ease: "power2.out", ...IR }, t);
    });
    tl.set("#s04-sheet", { x: 18 }, s.end - P / 2); tl.set("#s04-sheet", { x: -12 }, s.end - P / 4); tl.set("#s04-sheet", { x: 0 }, s.end - P / 8);
    slam(tl, "#s04-word", word("L02", 0) - LEAD, 1.25);
    drift(tl, "S04", 1, 1.05);
  }
  function S05(tl) {
    const s = S.S05, ticks = Array.from(document.querySelectorAll("#s05-ticks .tick"));
    tl.fromTo("#s05-paper", { y: 260, rotation: -12 }, { y: 0, rotation: -5, duration: 0.3, ease: "power3.out" }, s.start);
    let t = s.start + 0.12;
    ticks.forEach((el, i) => {           // scribbled ticks: eighths, then sixteenths, then 64ths
      tl.fromTo(el, { strokeDashoffset: 80 }, { strokeDashoffset: 0, duration: 0.09, ease: "power1.in" }, t);
      t += i < 4 ? P / 2 : i < 14 ? P / 4 : P / 16;
    });
    slam(tl, "#s05-word", word("L02", 3) - LEAD, 0.65);
    drift(tl, "S05", 1, 1.05);
  }
  function S06(tl) {
    const s = S.S06, b = Array.from(document.querySelectorAll("#s06-layer .bubble"));
    const times = [];
    let t = s.start + 0.03;
    for (const [n, step, per] of [[4, P / 2, 1], [4, P / 4, 2], [99, P / 8, 2]]) {
      for (let k = 0; k < n && times.length < b.length && t < s.end - 0.26; k++, t += step)
        for (let j = 0; j < per && times.length < b.length; j++) times.push(t);
    }
    while (times.length < b.length) times.push(times[times.length - 1]);
    b.forEach((el, i) => {
      const sc = Number(el.dataset.s);
      tl.fromTo(el, { scale: sc * 0.35, opacity: 0, rotation: (i % 2 ? -1 : 1) * 6 },
        { scale: sc, opacity: 1, rotation: 0, duration: 0.12, ease: "back.out(2.4)" }, times[i]);
    });
    slam(tl, "#s06-word", word("L02", 6) - LEAD, 0.7);
    for (let k = 0; k < 4; k++) tl.set("#s06-layer", { x: [14, -22, 9, -6][k], skewX: [4, -6, 2, 0][k] }, s.end - 0.42 + k * P / 8);
    tl.set("#s06-layer", { x: 0, skewX: 0 }, s.end - 0.24);
    const c0 = s.end - 0.235;            // the collapse into the ledger line (y = 640)
    b.forEach((el) => {
      tl.to(el, { y: 640 - Number(el.dataset.cy), x: (960 - Number(el.dataset.cx)) * 0.55, scaleY: 0.03,
        scaleX: Number(el.dataset.s) * 0.7, opacity: 0.9, duration: 0.235, ease: "power3.in" }, c0);
    });
    tl.to("#s06-word", { scaleY: 0.02, y: 220, duration: 0.235, ease: "power3.in" }, c0);
    tl.to("#s06-word", { opacity: 0, duration: 0.2, ease: "power2.in" }, c0 + 0.035);
  }
  function S07(tl) {
    const s = S.S07;
    tl.fromTo("#s07-line", { scaleX: 0.55 }, { scaleX: 1, duration: 0.7, ease: "expo.out" }, s.start);
    tl.fromTo("#s07-line .bloom", { opacity: 1, scaleY: 2.2 }, { opacity: 0.55, scaleY: 1, duration: 0.8, ease: "power2.out" }, s.start);
    tl.to("#s07-line .bloom", { opacity: 0.85, duration: 1.0, ease: "sine.inOut", yoyo: true, repeat: 1 }, s.start + 0.8);
    tl.fromTo("#s07-line", { scaleX: 1 }, { scaleX: 1.08, duration: s.end - s.start - 0.8, ease: "sine.in", ...IR }, s.start + 0.8);
  }
  function S08(tl) {
    const s = S.S08, drop = beat(24);
    tl.fromTo("#s08-line-w", { scaleX: 1296 / 1920 }, { scaleX: 1, duration: drop - s.start, ease: "power2.in" }, s.start);
    tl.fromTo("#s08-line-w .bloom", { opacity: 0.7, scaleY: 1 }, { opacity: 1, scaleY: 3.2, duration: drop - s.start, ease: "power2.in" }, s.start);
    tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.9, duration: 0.07, ease: "power2.in" }, drop - 0.07);
    tl.to("#flash", { opacity: 0, duration: 0.4, ease: "power2.out" }, drop);
    tl.set("#s08-line-w", { opacity: 0 }, drop);
    tl.set("#s08-line-b", { opacity: 1 }, drop);
    tl.fromTo("#s08-line-b .bloom", { opacity: 1, scaleY: 3 }, { opacity: 0.75, scaleY: 1.2, duration: 0.8, ease: "power2.out" }, drop);
    crystallise(tl, "#s08-lock", drop, s.end);
  }

  // ------------------------------------------------------------------ Act 2: the product (brand light, real UI)
  function S09(tl) {
    const s = S.S09;
    wordsIn(tl, ["#s09-w1", "#s09-w2", "#s09-w3"], [word("L05", 0), word("L05", 1), word("L05", 2)]);
    tl.fromTo("#s09-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, word("L05", 3) - LEAD);
    tl.fromTo("#s09-line", { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "expo.out" }, word("L05", 2));
    tl.fromTo("#s09-persp .tilt", { y: 560 }, { y: 0, duration: 0.9, ease: "expo.out" }, s.start + 0.1);   // slides up on the grid
    drift(tl, "S09", 1, 1.04);
  }
  function side(tl, id) {                // S10–S12: the word + the card pops forward
    const s = S[id], n = id.toLowerCase();
    const t = sfx("X08", id)[0] ?? s.start;
    tl.fromTo(`#${n}-word`, { x: -60 }, { x: 0, duration: 0.3, ease: "expo.out" }, s.start);
    tl.fromTo(`#${n}-word`, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, s.start);
    tl.fromTo(`#${id} .sidecard`, { scale: 0.78 }, { scale: 1, duration: 0.32, ease: "back.out(1.7)" }, t);
    tl.fromTo(`#${id} .sidecard`, { opacity: 0 }, { opacity: 1, duration: 0.14, ease: "power2.out" }, t);
    drift(tl, id, 1, 1.03);
  }
  function S13(tl) {
    const s = S.S13;
    tl.fromTo("#s13-plane", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, s.start);
    tl.fromTo(".seat", { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out", stagger: { each: 0.01, from: "start" } }, s.start + 0.05);
    wordsIn(tl, ["#s13-w1"], [word("L07", 0)]);
    wordsIn(tl, ["#s13-w2"], [word("L07", 1)], "slide");
    wordsIn(tl, ["#s13-w3"], [word("L07", 2)], "pop");
    const r0 = s.start + P;              // the ripple starts on the X09 ticks and sweeps diagonally
    tl.fromTo("#s13-grid .tint", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out", stagger: { grid: [4, 8], from: 0, amount: 1.25 } }, r0);
    tl.fromTo("#s13-grid .ok", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.24, ease: "back.out(2.6)", stagger: { grid: [4, 8], from: 0, amount: 1.25 } }, r0);
    drift(tl, "S13", 1, 1.06);
  }
  function S13b(tl) {
    const s = S.S13b;
    wordsIn(tl, ["#s13b-w1", "#s13b-w2", "#s13b-w3"], [s.start + 0.06, s.start + 0.12, s.start + 0.18], "pop");
    drift(tl, "S13b", 1.02, 1);
  }
  function S14(tl) {
    const s = S.S14, land = sfx("X10", "S14")[0];
    wordsIn(tl, ["#s14-w1"], [word("L08", 0)]);
    wordsIn(tl, ["#s14-w2"], [word("L08", 1)], "pop");
    tl.fromTo("#s14-spin", { scaleX: 1 }, { scaleX: 0.06, duration: P / 8, ease: "sine.in", yoyo: true, repeat: 5 }, s.start + 0.05);
    tl.fromTo("#s14-spin", { y: -150 }, { y: 0, duration: land - s.start - 0.05, ease: "bounce.out" }, s.start + 0.05);
    tl.fromTo("#s14-spin", { filter: "blur(6px)" }, { filter: "blur(0px)", duration: land - s.start, ease: "power2.in" }, s.start);
    tl.fromTo("#s14-ok .okdot", { scale: 0.3 }, { scale: 1, duration: 0.3, ease: "back.out(2.6)" }, land);
    tl.fromTo("#s14-ok .okdot", { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "none" }, land);
    tl.fromTo("#s14-ok .okring", { scale: 0.8, opacity: 1 }, { scale: 2.1, opacity: 0, duration: 0.6, ease: "power2.out" }, land);
    drift(tl, "S14", 1, 1.04);
  }
  function S15(tl) {
    const s = S.S15, t = sfx("X02", "S15")[0] ?? s.start;
    wordsIn(tl, ["#s15-w1"], [word("L08", 2)], "slide");
    tl.fromTo("#s15-slot", { scaleX: 0.3 }, { scaleX: 1, duration: 0.25, ease: "expo.out" }, s.start);
    tl.fromTo("#s15-ui", { yPercent: -100 }, { yPercent: 0, duration: 0.6, ease: "power2.out" }, t);   // prints out of the slot
  }
  function S16(tl) {
    const s = S.S16, full = sfx("X09", "S16")[0];
    wordsIn(tl, ["#s16-w1", "#s16-w2", "#s16-w3", "#s16-w4"], [word("L08", 3), word("L08", 4), word("L08", 5), word("L08", 6)]);
    tl.fromTo("#s16-bar", { y: -620 }, { y: 0, duration: 0.35, ease: "power3.out" }, s.start);   // the slot line drops to become the fee bar
    tl.fromTo("#s16-fill", { scaleX: 0 }, { scaleX: 1, duration: full - s.start - 0.3, ease: "power1.inOut" }, s.start + 0.3);
    tl.fromTo("#s16-live", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, full);
    tl.fromTo("#s16-live i", { scale: 1 }, { scale: 1.6, duration: P / 2, ease: "sine.inOut", yoyo: true, repeat: 3 }, full);
    drift(tl, "S16", 1, 1.04);
  }
  function S17(tl) {
    const done = word("L09", 4);
    wordsIn(tl, ["#s17-w1", "#s17-w2", "#s17-w3", "#s17-w4"], [word("L09", 0), word("L09", 1), word("L09", 2), done]);
    tl.to("#s17-ui-a", { scaleX: 1.12, skewX: 9, duration: 0.3, ease: "power2.in" }, done - 0.3);    // cross-warp morph on "done"
    tl.to("#s17-ui-a", { opacity: 0, filter: "blur(20px)", duration: 0.3, ease: "power2.in" }, done - 0.3);
    tl.fromTo("#s17-ui-b", { scaleX: 1.12, skewX: -9 }, { scaleX: 1, skewX: 0, duration: 0.4, ease: "power3.out" }, done - 0.05);
    tl.fromTo("#s17-ui-b", { opacity: 0, filter: "blur(20px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.35, ease: "power2.out" }, done - 0.05);
    drift(tl, "S17", 1, 1.04);
  }
  function S18(tl) {                     // rest beat: the paper stack crumples into particles of light
    const s = S.S18, c = sfx("X14", "S18")[0];
    wordsIn(tl, ["#s18-w1", "#s18-w2"], [word("L09", 6), word("L09", 7)]);
    document.querySelectorAll("#s18-sheets .sheet").forEach((el, i) => {
      tl.fromTo(el, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, s.start + i * 0.04);
      tl.to(el, { scale: 0.16, rotation: (i % 2 ? 1 : -1) * (40 + i * 12), x: 380 - i * 14, y: 160 + i * 16, duration: 0.32, ease: "power3.in" }, c - 0.32);
      tl.to(el, { opacity: 0, duration: 0.1, ease: "none" }, c - 0.02);
    });
    document.querySelectorAll("#s18-pts .pt").forEach((el) => {
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: "none" }, c);
      tl.fromTo(el, { x: 0, y: 0 }, { x: Number(el.dataset.dx), y: Number(el.dataset.dy), duration: s.end - c, ease: "power2.out" }, c);
      tl.to(el, { opacity: 0, duration: 0.6, ease: "sine.in" }, s.end - 0.6);
    });
    drift(tl, "S18", 1, 1.03);
  }
  function S19(tl) {
    wordsIn(tl, ["#s19-w1", "#s19-w2"], [word("L10", 0), word("L10", 1)], "slide");
    drift(tl, "S19", 1, 1.04);
  }
  function S20(tl) {
    const s = S.S20;
    tl.fromTo("#s20-card", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, s.start + 0.1);
    tl.fromTo("#s20-cardnote", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, s.start + 0.3);
    const chars = document.querySelectorAll("#s20-card .ch");
    const t0 = word("L10", 2), tw = word("L10", 5) - 0.12;
    tl.fromTo(chars, { opacity: 0 }, { opacity: 1, duration: 0.01, ease: "none", stagger: (tw - t0) / chars.length }, t0);
    const tick = sfx("X11", "S20")[0];
    tl.fromTo("#s20-ticks", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)" }, tick);
    tl.fromTo("#s20-chip", { opacity: 0, scale: 0.6, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(2.4)" }, tick + P / 2);
    wordsIn(tl, ["#s20-w1", "#s20-w2", "#s20-w3", "#s20-w4"], [word("L10", 2), word("L10", 3), word("L10", 4), word("L10", 5)]);
    drift(tl, "S20", 1, 1.03);
  }
  function S21(tl) {
    const t = sfx("X08", "S21");
    [1, 2, 3].forEach((k) => {
      tl.fromTo(`#s21-c${k}`, { x: 220, scale: 0.8 }, { x: 0, scale: 1, duration: 0.3, ease: "back.out(1.6)" }, t[k - 1] - 0.03);
      tl.fromTo(`#s21-c${k}`, { opacity: 0 }, { opacity: 1, duration: 0.14, ease: "power2.out" }, t[k - 1] - 0.03);
    });
    drift(tl, "S21", 1, 1.04);
  }
  function S22(tl) {                     // rest/hero beat: dolly out; stats count up inside the demo card
    const s = S.S22;
    tl.fromTo("#s22-cam", { scale: 1.45 }, { scale: 1, duration: 2.6, ease: "power2.out" }, s.start);
    wordsIn(tl, ["#s22a-w1", "#s22a-w2", "#s22a-w3", "#s22a-w4"], [word("L11", 0), word("L11", 1), word("L11", 2), word("L11", 3)]);
    const one = word("L11", 4);
    tl.to("#s22-a", { y: -40, opacity: 0, duration: 0.25, ease: "power2.in" }, one - LEAD - 0.25);
    wordsIn(tl, ["#s22b-w1", "#s22b-w2", "#s22b-w3"], [one, word("L11", 5), word("L11", 6)], "pop");
    tl.fromTo("#s22-card", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, s.start + 0.3);
    const ticks = sfx("X09", "S22"), c0 = ticks[0], dur = ticks[ticks.length - 1] - c0;
    const fmtIN = (n) => Math.round(n).toLocaleString("en-IN");
    [["#s22-n1", 2486, fmtIN], ["#s22-n2", 2357, fmtIN], ["#s22-n3", 8.4, (v) => `₹${v.toFixed(1)}L`], ["#s22-n4", 94.8, (v) => `${v.toFixed(1)}%`]]
      .forEach(([sel, to, fmt]) => {
        const el = document.querySelector(sel), o = { v: 0 };
        if (!el) return;
        tl.fromTo(o, { v: 0 }, { v: to, duration: dur, ease: "power2.out", onUpdate: () => { el.textContent = fmt(o.v); } }, c0);
      });
  }

  // ------------------------------------------------------------------ Act 3: foundation, logo, CTA
  function stamp(tl, id, sel) {
    const t = S[id].start;
    tl.fromTo(sel, { scale: 2.4, rotation: -6 }, { scale: 1, rotation: -2, duration: 0.14, ease: "power4.in" }, t);
    tl.fromTo(sel, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: "none" }, t);
    drift(tl, id, 1, 1.04);
  }
  function S23(tl) { stamp(tl, "S23", "#s23-word"); }
  function S24(tl) {
    stamp(tl, "S24", "#s24-word");
    tl.fromTo("#s24-shield", { scale: 0.5 }, { scale: 1, duration: 0.4, ease: "back.out(1.8)" }, S.S24.start + 0.06);
    tl.fromTo("#s24-shield", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" }, S.S24.start + 0.06);
  }
  function S25(tl) {
    const s = S.S25;
    tl.fromTo("#s25-hero", { scale: 1.1 }, { scale: 1, duration: 1.4, ease: "power2.out" }, s.start);
    tl.fromTo("#s25-hero", { opacity: 0, filter: "blur(12px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.35, ease: "power2.out" }, s.start);
    stamp(tl, "S25", "#s25-word");
  }
  function S26(tl) {
    const s = S.S26;
    tl.fromTo("#s26-line", { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: "expo.out" }, s.start);
    tl.fromTo("#s26-line .bloom", { opacity: 1, scaleY: 3.2 }, { opacity: 0.7, scaleY: 1.1, duration: 0.9, ease: "power2.out" }, s.start);
    crystallise(tl, "#s26-lock", s.start + 0.04, s.end);
    wordsIn(tl, ["#s26-w1", "#s26-w2", "#s26-w3", "#s26-w4"], [word("L13", 1), word("L13", 2), word("L13", 3), word("L13", 4)]);
  }
  function S27(tl) {
    const s = S.S27;
    tl.fromTo("#s27-card", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, s.start);
    crystallise(tl, "#s27-lock", s.start + 0.1, s.end);
    tl.fromTo("#s27-btn", { scale: 0.7 }, { scale: 1, duration: 0.35, ease: "back.out(2)" }, word("L14", 0) - LEAD);
    tl.fromTo("#s27-btn", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, word("L14", 0) - LEAD);
    tl.fromTo("#s27-url", { y: 40 }, { y: 0, duration: 0.4, ease: "expo.out" }, word("L14", 3) - LEAD);
    tl.fromTo("#s27-url", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.35, ease: "power2.out" }, word("L14", 3) - LEAD);
    tl.fromTo("#s27-line", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "expo.out" }, word("L14", 3) + 0.2);
    tl.fromTo("#s27-btn", { boxShadow: "0 0 40px rgba(110,90,255,0.5)" }, { boxShadow: "0 0 80px rgba(130,110,255,0.95)",
      duration: P * 2, ease: "sine.inOut", yoyo: true, repeat: 3, ...IR }, word("L14", 3) + 0.6);
    tl.to("#fadeout", { opacity: 1, duration: 0.6, ease: "power1.in" }, END - 0.6);   // the final scene fades out with the music
  }

  const SHOTS = { S01, S02, S03, S04, S05, S06, S07, S08, S09, S10: (t) => side(t, "S10"), S11: (t) => side(t, "S11"),
    S12: (t) => side(t, "S12"), S13, S13b, S14, S15, S16, S17, S18, S19, S20, S21, S22, S23, S24, S25, S26, S27 };
  window.FILM = {
    build(tl, opts) {
      const has = (id) => opts.shots.includes(id);
      stage(tl);
      lighting(tl, has);
      opts.shots.forEach((id) => SHOTS[id] && SHOTS[id](tl));
      transitions(tl, opts.shots);
      tl.to({}, { duration: END }, 0);   // Law 11: the timeline fills the film
    },
  };
})();
