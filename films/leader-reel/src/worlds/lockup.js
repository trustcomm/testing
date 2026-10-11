// World "Lockup": out of the white, the camera pulls back from inside the L — every letter of SHOW / REEL is a window
// into one of the worlds (stills rendered from the reel itself, in countdown order). On beat 2 the letters fill bone in a
// cascade, an ice light-sweep crosses them, the discipline line types on, and a final glint lands on the last beat.
window.WorldLockup = function (E, stills) {
  const { THREE } = E;
  const { U } = window;
  const GG = window.GL_GLYPH;
  const T0 = 13.125, T_FILL = 13.59375, T_TYPE = 14.0625, T_GLINT = 14.53125, T1 = 15.0;
  const W = 1920, H = 1080;
  const KEY = "900x125";
  const I = GG.inst(KEY);
  // layout: two lines, kerning from the browser (measure with canvas text)
  const LINES = ["SHOW", "REEL"];
  const FS = 330, GAP = 44;
  const capH = (I.capHeight / I.upm) * FS;
  const mcv = document.createElement("canvas");
  mcv.width = W; mcv.height = H;
  const mg = mcv.getContext("2d", { willReadFrequently: true });
  mg.font = `900 ${FS}px Archivo`;
  mg.fontStretch = "expanded";
  mg.letterSpacing = `${(-0.02 * FS).toFixed(1)}px`;
  const blockH = capH * 2 + GAP;
  const letters = [];
  LINES.forEach((line, li) => {
    const wLine = mg.measureText(line).width;
    let x = W / 2 - wLine / 2;
    const base = H / 2 - blockH / 2 + capH + li * (capH + GAP) - 30;
    for (const ch of line) {
      const w = mg.measureText(ch).width + -0.02 * FS;
      const g = GG.glyph(ch, KEY);
      const s = FS / I.upm;
      letters.push({ ch, x, base, w, box: [x + g.bbox[0] * s, base + g.bbox[1] * s, x + g.bbox[2] * s, base + g.bbox[3] * s] });
      x += w;
    }
  });
  // window content per letter: S ink, H chrome, O sparks, W glass, R geometry, E type, E flight, L leader (2-pop)

  // atlas of the 8 stills (each 960×540) → 4×2 grid
  const acv = document.createElement("canvas");
  acv.width = 3840; acv.height = 1080;
  const ag = acv.getContext("2d", { willReadFrequently: true });
  stills.forEach((img, i) => { if (img) ag.drawImage(img, (i % 4) * 960, Math.floor(i / 4) * 540, 960, 540); });
  const atlas = new THREE.CanvasTexture(acv);
  atlas.colorSpace = THREE.NoColorSpace;
  atlas.minFilter = THREE.LinearFilter;
  atlas.generateMipmaps = false;
  atlas.needsUpdate = true;

  const maskTex = new THREE.CanvasTexture(mcv);
  maskTex.colorSpace = THREE.NoColorSpace;
  maskTex.generateMipmaps = false;
  maskTex.minFilter = THREE.LinearFilter;
  const dcv = document.createElement("canvas");
  dcv.width = W; dcv.height = H;
  const dg = dcv.getContext("2d", { willReadFrequently: true });
  const decoTex = new THREE.CanvasTexture(dcv);
  decoTex.colorSpace = THREE.NoColorSpace;
  decoTex.generateMipmaps = false;
  decoTex.minFilter = THREE.LinearFilter;

  const mat = E.material(`
    uniform sampler2D uMask, uDeco, uAtlas;
    uniform vec4 uBox[8];      // screen-space letter boxes (px, y-down), after the camera transform
    uniform float uFill[8];
    uniform float uZoom, uFlash, uSweep, uT, uGlint;
    uniform vec2 uGlintP;
    vec2 pxOf(vec2 uv){ return vec2(uv.x * 1920., (1. - uv.y) * 1080.); }
    vec3 still(int i, vec2 p){
      vec4 b = uBox[i];
      vec2 c = (b.xy + b.zw) * .5;
      float h = (b.w - b.y);
      // the still's numeral fills the letter: map letter height to ~60% of the still's height, slow drift
      vec2 q = (p - c) / (h * 1.55) ;
      q *= 1. - .06 * uT;
      q += vec2(sin(uT * .7 + float(i)) , cos(uT * .6 + float(i) * 1.7)) * .015;
      vec2 uv = clamp(q * vec2(540. / 960., 1.) + .5, .003, .997);
      vec2 tile = vec2(float(i % 4), float(i / 4));
      vec2 auv = (tile + uv) / vec2(4., 2.);                 // canvas space (y-down)
      return srgbToLin(texture(uAtlas, vec2(auv.x, 1. - auv.y)).rgb);
    }
    void main(){
      vec2 p = pxOf(vUv);
      float m = texture(uMask, vUv).a;
      vec3 col = C_VOID;
      // soft glow behind the word
      vec2 q = (p - vec2(960., 520.)) / vec2(1300., 700.);
      col += C_DEEP * .7 * exp(-dot(q, q) * 3.);
      // which letter? (boxes do not overlap)
      int idx = -1;
      for (int i = 0; i < 8; i++){ vec4 b = uBox[i]; if (p.x >= b.x - 3. && p.x <= b.z + 3. && p.y >= b.y - 3. && p.y <= b.w + 3.) idx = i; }
      if (idx >= 0 && m > 0.) {
        vec4 b = uBox[idx];
        vec3 win = still(idx, p) * 1.7;
        // fill rises from the baseline; a hot edge rides on top of it
        float f = uFill[idx];
        float yy = 1. - (p.y - b.y) / (b.w - b.y);
        float solid = step(yy, f * 1.02);
        float edge = exp(-pow((yy - f) * 40., 2.)) * step(.001, f) * step(f, .999);
        vec3 bone = C_BONE * .92;
        vec3 lc = mix(win, bone, solid) + mix(C_ICE, C_BONE, .5) * edge * 2.2;
        // light sweep: a diagonal band of ice light across the solid letters
        float band = exp(-pow(((p.x + (p.y - 540.) * .45) - uSweep) / 70., 2.));
        lc += mix(C_ICE, C_BONE, .4) * band * solid * .9;
        col = mix(col, lc, m);
      }
      // decorations (rules, ticks, subline) in display space
      vec4 d = texture(uDeco, vUv);
      col = mix(col, srgbToLin(d.rgb) * .95, d.a);
      // glint: a four-point star
      vec2 g = p - uGlintP;
      float star = (exp(-abs(g.y) / 2.2) * exp(-abs(g.x) / 90.) + exp(-abs(g.x) / 2.2) * exp(-abs(g.y) / 90.)) * uGlint;
      star += exp(-dot(g, g) / 60.) * uGlint * 2.;
      col += C_BONE * star * 3.;
      col = mix(col, C_BONE * 1.4, uFlash);
      fragColor = vec4(col, 1.);
    }`, {
    uMask: { value: maskTex }, uDeco: { value: decoTex }, uAtlas: { value: atlas },
    uBox: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) },
    uFill: { value: new Array(8).fill(0) },
    uZoom: { value: 1 }, uFlash: { value: 0 }, uSweep: { value: -1000 }, uT: { value: 0 }, uGlint: { value: 0 },
    uGlintP: { value: new THREE.Vector2() },
  });

  // camera: pull back from inside the L (last letter), decelerating
  const L = letters[7];
  const focus0 = [L.box[0] + (L.box[2] - L.box[0]) * 0.22, L.box[1] + (L.box[3] - L.box[1]) * 0.45];
  function camAt(t) {
    const k = U.seg(t, T0, T0 + 0.62);
    const z = Math.exp(U.mix(Math.log(16), Math.log(1), U.E.expoOut(k))) * (1 + 0.016 * U.seg(t, 14.4, T1, U.E.sineIo));
    const fx = U.mix(focus0[0], 960, U.E.expoOut(k)), fy = U.mix(focus0[1], 540, U.E.expoOut(k));
    return { z, fx, fy };
  }

  const SUB = "MOTION DESIGN  ·  3D  ·  ART DIRECTION  ·  2026";
  function render(t, target) {
    const lt = t - T0;
    const c = camAt(t);
    const tf = (x, y) => [960 + (x - c.fx) * c.z, 540 + (y - c.fy) * c.z];
    // mask: the letters under the camera transform (vector-crisp at any zoom)
    mg.setTransform(1, 0, 0, 1, 0, 0);
    mg.clearRect(0, 0, W, H);
    mg.setTransform(c.z, 0, 0, c.z, 960 - c.fx * c.z, 540 - c.fy * c.z);
    mg.fillStyle = "#fff";
    mg.font = `900 ${FS}px Archivo`;
    mg.fontStretch = "expanded";
    mg.letterSpacing = "0px";
    for (const l of letters) mg.fillText(l.ch, l.x, l.base);
    maskTex.needsUpdate = true;
    const u = mat.uniforms;
    letters.forEach((l, i) => {
      const a = tf(l.box[0], l.box[1]), b = tf(l.box[2], l.box[3]);
      u.uBox.value[i].set(a[0], a[1], b[0], b[1]);
      const st = T_FILL + i * 0.042;
      u.uFill.value[i] = U.E.expoOut(U.seg(t, st, st + 0.2));
    });
    // decorations
    dg.setTransform(1, 0, 0, 1, 0, 0);
    dg.clearRect(0, 0, W, H);
    const deco = U.seg(t, T0 + 0.35, T0 + 0.6);
    if (deco > 0) {
      dg.globalAlpha = deco;
      const top = tf(0, letters[0].box[1] - 52)[1], bot = tf(0, letters[7].box[3] + 52)[1];
      const x0 = tf(letters[0].box[0] - 60, 0)[0], x1 = tf(letters[3].box[2] + 60, 0)[0];
      dg.strokeStyle = "rgba(237,230,218,0.55)";
      dg.lineWidth = 2;
      // frame-line ticks at the four corners of the word block (leader registration)
      const tick = (x, y, sx, sy) => { dg.beginPath(); dg.moveTo(x + sx * 34, y); dg.lineTo(x, y); dg.lineTo(x, y + sy * 34); dg.stroke(); };
      const grow = U.E.p3out(U.seg(t, T0 + 0.35, T0 + 0.7));
      tick(x0, top, 1, 1); tick(x1, top, -1, 1); tick(x0, bot, 1, -1); tick(x1, bot, -1, -1);
      // leader arcs bracketing the word (the ring, reduced to two parentheses)
      const arcA = U.E.p3out(U.seg(t, T_FILL - 0.1, T_FILL + 0.35));
      if (arcA > 0) {
        const cc = tf(960, 505), rr = 700 * c.z;
        dg.strokeStyle = "rgba(143,216,255,0.42)";
        dg.lineWidth = 2;
        const sw = 0.62 * arcA, rot = (t - T_FILL) * 0.05;
        dg.beginPath(); dg.arc(cc[0], cc[1], rr, -sw + rot, sw + rot); dg.stroke();
        dg.beginPath(); dg.arc(cc[0], cc[1], rr, Math.PI - sw + rot, Math.PI + sw + rot); dg.stroke();
      }
      // a thin rule under the word, drawing out from the centre
      dg.fillStyle = "rgba(237,230,218,0.35)";
      const rw = (x1 - x0) * grow;
      dg.fillRect(960 - rw / 2, bot + 30, rw, 1.5);
      // the discipline line types on (32nd notes) with a block cursor
      const shown = SUB.slice(0, Math.max(0, Math.min(SUB.length, Math.floor((t - T_TYPE) / 0.0146))));
      dg.font = "500 30px 'Geist Mono'";
      dg.letterSpacing = "4px";
      dg.textBaseline = "middle";
      dg.fillStyle = "#EDE6DA";
      const full = dg.measureText(SUB).width;
      const sx = 960 - full / 2, sy = bot + 82;
      if (t >= T_TYPE) {
        dg.fillText(shown, sx, sy);
        const wS = dg.measureText(shown).width;
        const blink = shown.length < SUB.length || (Math.floor((t - T_TYPE) / 0.117) % 2 === 0);
        if (blink) { dg.fillStyle = "#FF4A24"; dg.fillRect(sx + wS + 6, sy - 15, 16, 30); }
      }
      dg.letterSpacing = "0px";
      dg.globalAlpha = 1;
    }
    decoTex.needsUpdate = true;
    u.uZoom.value = c.z;
    u.uT.value = lt;
    u.uFlash.value = Math.exp(-lt * 16) * (lt >= 0 ? 1 : 0);
    u.uSweep.value = U.mix(-500, 2600, U.E.p2io(U.seg(t, 13.95, 14.42)));
    const gk = U.seg(t, T_GLINT, T_GLINT + 0.3);
    u.uGlint.value = Math.sin(gk * Math.PI) * (gk > 0 ? 1 : 0);
    const W0 = letters[3]; // the W's top-right corner catches the glint
    const gp = tf(W0.box[2] - 18, W0.box[1] + 10);
    u.uGlintP.value.set(gp[0], gp[1]);
    E.pass(mat, target);
    const pull = U.seg(t, T0, T0 + 0.62);
    const solid = U.seg(t, T_FILL, T_FILL + 0.5);
    return {
      exposure: 1 + Math.exp(-lt * 10) * 1.2,
      bloom: U.mix(0.42, 0.16, solid), bloomThreshold: U.mix(0.95, 1.4, solid),
      speed: (1 - U.E.expoOut(pull)) * 0.8 * (pull < 1 ? 1 : 0),
      zoomBlur: (1 - U.E.expoOut(pull)) * 0.3 * (pull < 1 ? 1 : 0),
      zoomCenter: [0.5, 0.5],
    };
  }

  return { id: "lockup", render, letters };
};
