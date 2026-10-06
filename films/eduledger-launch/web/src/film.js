/* EduLedger launch film: one GSAP timeline in FILM time (seconds from the film's first frame).
 * Times come from assets/timing.js (generated from timeline.json): shot windows, VO word onsets, grid.
 * Rules: deterministic (no Math.random / Date), finite repeats, fromTo with immediateRender:false when an
 * element is tweened more than once, transforms only on elements without a CSS transform.
 */
(function () {
  const E = window.EL;
  const P = E.P, PH = E.PH, END = E.END, S = E.shots, W = E.words;
  const beat = (n) => PH + n * P;
  const word = (line, i) => W[line][i].t;
  const LEAD = 0.06;                     // type leads its word (DESIGN.md, P7)
  const IR = { immediateRender: false };

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

  // light-streak whip: the streak is the ledger line (P2); its peak sits on the cut
  function whip(tl, t) {
    tl.fromTo("#streak", { xPercent: -130, opacity: 1, scaleY: 0.6 },
      { xPercent: 260, scaleY: 1.5, duration: 0.36, ease: "power3.in", ...IR }, t - 0.2);
    tl.set("#streak", { opacity: 0 }, t + 0.16);
  }

  // act lighting: red chaos (Act 1) → brand light from the drop on
  function lighting(tl, has) {
    if (has("S07")) tl.to("#glow-red", { opacity: 0, duration: 0.3, ease: "power2.out" }, S.S07.start - 0.05);
    else if (has("S08") || has("S13")) tl.set("#glow-red", { opacity: 0 }, 8.0);
    const drop = beat(24);
    tl.fromTo("#glow-brand", { opacity: 0 }, { opacity: 1, duration: 0.14, ease: "power2.out", ...IR }, drop);
    tl.to("#glow-brand", { opacity: 0.55, duration: 1.0, ease: "sine.out" }, drop + 0.2);
    tl.fromTo("#floor-brand", { opacity: 0 }, { opacity: 0.85, duration: 0.2, ease: "power2.out", ...IR }, drop);
    tl.to("#floor-neutral", { opacity: 0.35, duration: 0.2, ease: "power2.out" }, drop);
    tl.to("#glow-brand", { opacity: 0.38, duration: 0.6, ease: "sine.inOut" }, S.S13.start - 0.1);
    tl.to("#glow-brand", { opacity: 0.5, duration: 0.6, ease: "sine.inOut" }, S.S20.start - 0.1);
    tl.to("#glow-brand", { opacity: 1, duration: 0.12, ease: "power2.out" }, S.S26.start);
    tl.to("#glow-brand", { opacity: 0.78, duration: 1.2, ease: "sine.out" }, S.S26.start + 0.2);
  }

  // ------------------------------------------------------------------ S01: the ledger book slams; REGISTERS dollies through camera
  function S01(tl) {
    const s = S.S01, t0 = Math.max(0.05, word("L01", 0));
    tl.fromTo("#s01-book", { y: -780, filter: "blur(14px)" }, { y: 0, filter: "blur(0px)", duration: t0, ease: "power4.in" }, 0);
    tl.fromTo("#s01-book", { scaleY: 0.86, scaleX: 1.05 }, { scaleY: 1, scaleX: 1, duration: 0.32, ease: "back.out(2.2)" }, t0);
    tl.fromTo("#s01-ring", { scale: 0.55, opacity: 0.95 }, { scale: 1.55, opacity: 0, duration: 0.5, ease: "expo.out" }, t0);
    tl.fromTo("#s01-word", { scale: 1.45, opacity: 0, filter: "blur(10px)" },
      { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.16, ease: "expo.out" }, t0);
    tl.to("#s01-word", { scale: 8, opacity: 0, duration: 0.38, ease: "power2.in" }, s.end - 0.38);
  }

  // ------------------------------------------------------------------ S06: call bubbles stack faster and faster, then collapse
  function S06(tl) {
    const s = S.S06, b = Array.from(document.querySelectorAll("#s06-layer .bubble"));
    // Act 1 speed-up inside the shot (user, Stage C review): eighths → sixteenths → 32nds
    // ticks on the grid: 4 eighths (1 bubble each), 4 sixteenths (2 each), then 32nds (2 each) until the collapse
    const times = [];
    let t = s.start + 0.03;
    const plan = [[4, P / 2, 1], [4, P / 4, 2], [99, P / 8, 2]];
    for (const [n, step, per] of plan) {
      for (let k = 0; k < n && times.length < b.length && t < s.end - 0.26; k++, t += step)
        for (let j = 0; j < per && times.length < b.length; j++) times.push(t);
    }
    while (times.length < b.length) times.push(times[times.length - 1]);
    b.forEach((el, i) => {
      const sc = Number(el.dataset.s);
      tl.fromTo(el, { scale: sc * 0.35, opacity: 0, rotation: (i % 2 ? -1 : 1) * 6 },
        { scale: sc, opacity: 1, rotation: 0, duration: 0.12, ease: "back.out(2.4)" }, times[i]);
    });
    // glitch jitter on 32nds before the collapse
    for (let k = 0; k < 4; k++) tl.set("#s06-layer", { x: [14, -22, 9, -6][k], skewX: [4, -6, 2, 0][k] }, s.end - 0.42 + k * P / 8);
    tl.set("#s06-layer", { x: 0, skewX: 0 }, s.end - 0.24);
    // the collapse: everything squeezes into one horizontal line at y = 640 (the ledger line)
    const c0 = s.end - 0.235;
    b.forEach((el) => {
      tl.to(el, { y: 640 - Number(el.dataset.cy), x: (960 - Number(el.dataset.cx)) * 0.55, scaleY: 0.03,
        scaleX: Number(el.dataset.s) * 0.7, opacity: 0.9, duration: 0.235, ease: "power3.in" }, c0);
    });
  }

  // ------------------------------------------------------------------ S07: the rest beat: one line
  function S07(tl) {
    const s = S.S07;
    tl.fromTo("#s07-line", { scaleX: 0.55 }, { scaleX: 1, duration: 0.7, ease: "expo.out" }, s.start);
    tl.fromTo("#s07-line .bloom", { opacity: 1, scaleY: 2.2 }, { opacity: 0.55, scaleY: 1, duration: 0.8, ease: "power2.out" }, s.start);
    // the line breathes with the riser and grows toward the flare
    tl.to("#s07-line .bloom", { opacity: 0.85, duration: 1.0, ease: "sine.inOut", yoyo: true, repeat: 1 }, s.start + 0.8);
    tl.fromTo("#s07-line", { scaleX: 1 }, { scaleX: 1.08, duration: s.end - s.start - 0.8, ease: "sine.in", ...IR }, s.start + 0.8);
  }

  // ------------------------------------------------------------------ S08: "Meet" → line flares; drop on "EduLedger" → logo crystallises
  function S08(tl) {
    const s = S.S08, drop = beat(24);
    tl.fromTo("#s08-line-w", { scaleX: 1296 / 1920 }, { scaleX: 1, duration: drop - s.start, ease: "power2.in" }, s.start);
    tl.fromTo("#s08-line-w .bloom", { opacity: 0.7, scaleY: 1 }, { opacity: 1, scaleY: 3.2, duration: drop - s.start, ease: "power2.in" }, s.start);
    // flash through white on the drop (P4); the flash hides the swap to the brand line
    tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.9, duration: 0.07, ease: "power2.in" }, drop - 0.07);
    tl.to("#flash", { opacity: 0, duration: 0.4, ease: "power2.out" }, drop);
    tl.set("#s08-line-w", { opacity: 0 }, drop);
    tl.set("#s08-line-b", { opacity: 1 }, drop);
    tl.fromTo("#s08-line-b .bloom", { opacity: 1, scaleY: 3 }, { opacity: 0.75, scaleY: 1.2, duration: 0.8, ease: "power2.out" }, drop);
    crystallise(tl, "#s08-lock", drop, s.end);
  }

  function crystallise(tl, lock, t, end) {
    // overshooting eases never drive filter: blur(<0) is invalid CSS and the browser keeps the last blur
    tl.fromTo(`${lock} .mark`, { scale: 0.8 }, { scale: 1, duration: 0.55, ease: "back.out(1.4)" }, t);
    tl.fromTo(`${lock} .mark`, { opacity: 0, filter: "blur(18px)" },
      { opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power2.out" }, t);
    tl.fromTo(`${lock} .word`, { x: -40, opacity: 0, filter: "blur(10px)" },
      { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "expo.out" }, t + 0.1);
    tl.fromTo(`${lock} .glint`, { backgroundPosition: "100% 0%" },
      { backgroundPosition: "0% 0%", duration: 0.9, ease: "power2.inOut", stagger: 0.14 }, t + 0.22);
    tl.fromTo(lock, { scale: 1 }, { scale: 1.035, duration: end - t, ease: "none" }, t);
  }

  // ------------------------------------------------------------------ S13: class grid, present ticks ripple green
  function S13(tl) {
    const s = S.S13;
    whip(tl, s.start);
    tl.fromTo("#s13-plane", { x: 280, opacity: 0, filter: "blur(22px)" },
      { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, s.start);
    tl.fromTo("#s13-plane", { scale: 1 }, { scale: 1.06, duration: s.end - s.start, ease: "none" }, s.start);
    tl.fromTo(".seat", { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out",
      stagger: { each: 0.01, from: "start" } }, s.start + 0.05);
    tl.fromTo("#s13-w1", { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "expo.out" }, word("L07", 0) - LEAD);
    tl.fromTo("#s13-w2", { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, ease: "power2.out" }, word("L07", 1) - LEAD);
    tl.fromTo("#s13-w3", { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "back.out(1.4)" }, word("L07", 2) - LEAD);
    // the ripple starts on the beat after the cut (the X09 ticks) and sweeps diagonally
    const r0 = s.start + P;
    tl.fromTo("#s13-grid .tint", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out",
      stagger: { grid: [4, 8], from: 0, amount: 1.25 } }, r0);
    tl.fromTo("#s13-grid .ok", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.24, ease: "back.out(2.6)",
      stagger: { grid: [4, 8], from: 0, amount: 1.25 } }, r0);
  }

  // ------------------------------------------------------------------ S20: the parent message (EduLedger's own card; WhatsApp as plain text)
  function S20(tl) {
    const s = S.S20;
    tl.fromTo("#s20-phone", { scale: 0.88, y: 60, opacity: 0, filter: "blur(16px)" },
      { scale: 1, y: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "expo.out" }, s.start);
    tl.fromTo("#s20-card", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, s.start + 0.1);
    tl.fromTo("#s20-cardnote", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, s.start + 0.3);
    const chars = document.querySelectorAll("#s20-card .ch");
    const t0 = word("L10", 2), tw = word("L10", 5) - 0.12;          // types from "updated" to just before "WhatsApp"
    tl.fromTo(chars, { opacity: 0 }, { opacity: 1, duration: 0.01, ease: "none", stagger: (tw - t0) / chars.length }, t0);
    const tick = E.sfx.find((e) => e.sfx === "X11").t;              // message sent ✓✓ on the X11 anchor
    tl.fromTo("#s20-ticks", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)" }, tick);
    tl.fromTo("#s20-chip", { opacity: 0, scale: 0.6, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(2.4)" }, tick + P / 2);
    [[1, 2], [2, 3], [3, 4], [4, 5]].forEach(([k, w]) => {
      tl.fromTo(`#s20-w${k}`, { y: 70 }, { y: 0, duration: 0.32, ease: k === 4 ? "back.out(1.6)" : "expo.out" }, word("L10", w) - LEAD);
      tl.fromTo(`#s20-w${k}`, { opacity: 0, filter: "blur(8px)" },
        { opacity: 1, filter: "blur(0px)", duration: 0.28, ease: "power2.out" }, word("L10", w) - LEAD);
    });
  }

  // ------------------------------------------------------------------ S26: the ledger line returns; logo; tagline word by word
  function S26(tl) {
    const s = S.S26;
    tl.fromTo("#s26-line", { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: "expo.out" }, s.start);
    tl.fromTo("#s26-line .bloom", { opacity: 1, scaleY: 3.2 }, { opacity: 0.7, scaleY: 1.1, duration: 0.9, ease: "power2.out" }, s.start);
    crystallise(tl, "#s26-lock", s.start + 0.04, s.end);
    [[1, 1], [2, 2], [3, 3], [4, 4]].forEach(([k, w]) => {
      tl.fromTo(`#s26-w${k}`, { y: 50, opacity: 0, filter: "blur(8px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.34, ease: k % 2 ? "expo.out" : "power3.out" }, word("L13", w) - LEAD);
    });
  }

  const SHOTS = { S01, S06, S07, S08, S13, S20, S26 };
  window.FILM = {
    build(tl, opts) {
      const has = (id) => opts.shots.includes(id);
      stage(tl);
      lighting(tl, has);
      opts.shots.forEach((id) => SHOTS[id] && SHOTS[id](tl));
      tl.to({}, { duration: END }, 0);   // Law 11: the timeline fills the film
    },
  };
})();
