// The director: maps global time to a world, runs it into the HDR target, then post → canvas.
// Everything is a pure function of t (the fluid re-simulates deterministically when seeked backwards).
(function () {
  const { U } = window;
  const C = window.CUES;

  async function loadFonts() {
    const faces = [
      new FontFace("Archivo", "url(assets/fonts/archivo-latin-standard-normal.woff2)", { weight: "100 900", stretch: "62% 125%" }),
      new FontFace("Geist Mono", "url(assets/fonts/geist-mono-latin-wght-normal.woff2)", { weight: "100 900" }),
    ];
    await Promise.all(faces.map((f) => f.load()));
    faces.forEach((f) => document.fonts.add(f));
    await document.fonts.ready;
  }

  async function build() {
    const THREE = await window.__THREE;
    await loadFonts();
    const canvas = document.getElementById("stage");
    const E = window.createEngine(THREE, canvas);
    const sceneRT = E.rt(1920, 1080, { depth: false });

    const factories = {
      fluid: window.WorldFluid, forge: window.WorldForge, glass: window.WorldGlass, geometry: window.WorldGeometry,
      type: window.WorldType, flight: window.WorldFlight, lockup: window.WorldLockup,
    };
    // stills of each world for the lockup's letter windows (rendered from this reel by scripts/stills.mjs)
    const loadImg = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
    const stills = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map((i) => loadImg(`assets/stills/s${i}.jpg`)));
    const worlds = {};
    for (const w of C.worlds) if (factories[w.id]) worlds[w.id] = w.id === "lockup" ? factories[w.id](E, stills) : factories[w.id](E);
    const overlay = window.Overlay ? window.Overlay(E) : null;
    const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
    blank.needsUpdate = true;

    function worldAt(t) {
      for (const w of C.worlds) if (t >= w.t0 && t < w.t1) return w;
      return C.worlds[C.worlds.length - 1];
    }

    let lastT = -1;
    function renderAt(t) {
      t = U.clamp(t, 0, C.duration);
      lastT = t;
      const wdef = worldAt(t);
      const world = worlds[wdef.id];
      let info = {};
      if (world) info = world.render(t, sceneRT) || {};
      else E.clearTarget(sceneRT, 0.00182, 0.00212, 0.00335, 1);
      let src = sceneRT.texture;
      if (info.zoomBlur && info.zoomBlur > 0.004) {
        const zc = info.zoomCenter || [0.5, 0.5];
        src = E.zoomBlur(src, zc[0], zc[1], info.zoomBlur, Math.floor(t * 60));
      }
      const bloomTex = E.bloom(src, info.bloomThreshold != null ? info.bloomThreshold : 0.9, 0.55);
      const ov = overlay ? overlay.draw(t, info) : null;
      const speed = info.speed || 0;
      E.composite(src, bloomTex, ov || blank, {
        exposure: info.exposure != null ? info.exposure : 1,
        bloom: info.bloom != null ? info.bloom : 0.45,
        ca: (info.ca != null ? info.ca : 0.0012) + speed * 0.012,
        vignette: info.vignette != null ? info.vignette : 0.5,
        grain: info.grain != null ? info.grain : 0.032,
        frame: Math.round(t * C.fps),
        overlayAlpha: ov ? 1 : 0,
        flicker: info.flicker != null ? info.flicker : 1,
        contrast: info.contrast != null ? info.contrast : 1.04,
        sat: info.sat != null ? info.sat : 1,
        weaveX: info.weaveX || 0,
        weaveY: info.weaveY || 0,
      });
    }

    const tl = window.gsap.timeline({ paused: true });
    const clock = { t: 0 };
    tl.fromTo(clock, { t: 0 }, { t: C.duration, duration: C.duration, ease: "none", onUpdate: () => renderAt(clock.t) }, 0);
    renderAt(0);
    window.__reel = { renderAt, E, worlds, get lastT() { return lastT; } };
    return { tl };
  }

  window.__reelBuild = build;
})();
