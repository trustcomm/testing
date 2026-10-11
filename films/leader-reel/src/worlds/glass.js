// World "5 · Liquid glass": the imploded point blooms into a glass droplet that slams open into a thick, bevelled 5.
// It refracts a leader test-chart (Siemens star, tick ring, crosshair) with chromatic dispersion, Fresnel edge light and
// a jelly wobble; shock-waves ripple the chart on the downbeat and on the lens push; on beat 4 the glass freezes flat.
window.WorldGlass = function (E) {
  const { THREE } = E;
  const { U } = window;
  const T0 = 5.625, T_PUSH = 6.5625, T_FREEZE = 7.03125, T1 = 7.265625;
  const GH = 760, GCX = 960, GCY = 540;
  const sdf5 = window.GL_GLYPH.glyphSDFTexture(THREE, "5", { cx: GCX, cy: GCY, height: GH, res: 0.5 });

  // ---------------------------------------------------------------- the test chart (static canvas texture)
  const CS = 2048;
  const cv = document.createElement("canvas");
  cv.width = cv.height = CS;
  const g = cv.getContext("2d");
  const BONE = "#EDE6DA", SLATE = "#1B2230", INFRA = "#FF4A24", ICE = "#8FD8FF", VOID = "#06070B";
  g.fillStyle = VOID;
  g.fillRect(0, 0, CS, CS);
  g.translate(CS / 2, CS / 2);
  // Siemens star (radial wedges) between r = 430 and 800
  const WEDGES = 48;
  for (let i = 0; i < WEDGES; i++) {
    const a0 = (i / WEDGES) * Math.PI * 2, a1 = ((i + 0.5) / WEDGES) * Math.PI * 2;
    g.beginPath();
    g.moveTo(Math.cos(a0) * 430, Math.sin(a0) * 430);
    g.arc(0, 0, 800, a0, a1);
    g.arc(0, 0, 430, a1, a0, true);
    g.closePath();
    g.fillStyle = i % 8 === 0 ? INFRA : "rgba(237,230,218,0.86)";
    g.fill();
  }
  // rings
  const ring = (r, w, c) => { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.lineWidth = w; g.strokeStyle = c; g.stroke(); };
  ring(805, 6, BONE); ring(425, 6, BONE); ring(940, 10, BONE); ring(330, 18, INFRA); ring(250, 3, BONE); ring(140, 3, BONE);
  // tick ring
  for (let i = 0; i < 180; i++) {
    const a = (i / 180) * Math.PI * 2;
    const long = i % 15 === 0, mid = i % 5 === 0;
    const r0 = 880 - (long ? 40 : mid ? 22 : 10), r1 = 905;
    g.beginPath();
    g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    g.lineWidth = long ? 6 : 3;
    g.strokeStyle = long ? BONE : "rgba(237,230,218,0.7)";
    g.stroke();
  }
  // labels on the tick ring
  g.fillStyle = BONE;
  g.font = "500 30px 'Geist Mono'";
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    g.save();
    g.rotate(a + Math.PI / 2);
    g.fillText(String(i * 30).padStart(3, "0"), 0, -815 + 0);
    g.restore();
  }
  // crosshair + inner scale
  g.fillStyle = BONE;
  g.fillRect(-CS / 2, -3, CS, 6);
  g.fillRect(-3, -CS / 2, 6, CS);
  for (let i = -9; i <= 9; i++) {
    if (!i) continue;
    g.fillRect(i * 40 - 1.5, -18, 3, 36);
    g.fillRect(-18, i * 40 - 1.5, 36, 3);
  }
  // arc text
  g.font = "600 34px 'Geist Mono'";
  const txt = "LEADER · TEST CHART · SHOWREEL 2026 · 128 BPM · 60 FPS · ";
  let ang = -Math.PI * 0.95;
  for (const ch of txt) {
    g.save();
    g.rotate(ang);
    g.translate(0, -985);
    g.fillStyle = ch === "·" ? INFRA : BONE;
    g.fillText(ch, 0, 0);
    g.restore();
    ang += 0.045;
  }
  ring(60, 4, ICE);
  g.beginPath(); g.arc(0, 0, 14, 0, Math.PI * 2); g.fillStyle = ICE; g.fill();
  const chart = new THREE.CanvasTexture(cv);
  chart.colorSpace = THREE.NoColorSpace;
  chart.minFilter = THREE.LinearMipmapLinearFilter;
  chart.magFilter = THREE.LinearFilter;
  chart.generateMipmaps = true;
  chart.anisotropy = 4;
  chart.needsUpdate = true;

  const mat = E.material(`
    uniform sampler2D uSDF, uChart;
    uniform float uT, uRot, uChartScale, uDrop, uMorph, uScale, uWobble, uMag, uRefr, uDisp, uFreeze, uRipple1, uRipple2, uLightA, uShow;
    uniform vec2 uCenter;
    vec2 pxOf(vec2 uv){ return vec2(uv.x * 1920., (1. - uv.y) * 1080.); }
    vec2 uvOf(vec2 p){ return vec2(p.x / 1920., 1. - p.y / 1080.); }
    // the glass shape: circle droplet morphing into the 5 (screen px; negative inside)
    float shape(vec2 p){
      vec2 q = uCenter + (p - uCenter) / uScale;
      // jelly wobble: decaying waves across the shape
      q += vec2(sin(q.y * .011 + uT * 19.), cos(q.x * .009 + uT * 17.)) * uWobble;
      float s5 = texture(uSDF, uvOf(q)).x * uScale;
      float sc = (length(p - uCenter) - uDrop);
      return mix(sc, s5, uMorph);
    }
    uniform float uReveal;
    vec3 chartAt(vec2 p, float ripple){
      vec2 c = p - vec2(960., 540.);
      float rv = smoothstep(uReveal + 30., uReveal - 60., length(c));
      // shock-wave rings travelling out from the centre
      float r = length(c);
      vec2 dir = c / max(r, 1.);
      float w1 = sin((r - uRipple1 * 2200.) * .045) * exp(-pow((r - uRipple1 * 2200.) / 120., 2.)) * (1. - uRipple1);
      float w2 = sin((r - uRipple2 * 2200.) * .045) * exp(-pow((r - uRipple2 * 2200.) / 120., 2.)) * (1. - uRipple2);
      c += dir * (w1 * 26. * step(.0001, uRipple1) + w2 * 20. * step(.0001, uRipple2));
      c = rot(uRot) * c / uChartScale;
      vec2 uv = c / 2048. + .5;
      vec3 col = texture(uChart, uv).rgb;
      return srgbToLin(col) * .52 * rv * (1. - uFreeze * .999) + C_ICE * exp(-pow((length(p - vec2(960., 540.)) - uReveal) / 6., 2.)) * 2.5 * step(1., uReveal) * (1. - smoothstep(900., 1300., uReveal));
    }
    void main(){
      vec2 p = pxOf(vUv);
      float d = shape(p);
      float e = 1.6;
      float dx = shape(p + vec2(e, 0.)) - shape(p - vec2(e, 0.));
      float dy = shape(p + vec2(0., e)) - shape(p - vec2(0., e));
      vec2 grad = vec2(dx, dy) / (2. * e);
      float inside = -d;
      // rounded bevel profile → height + normal
      float B = 78. * uScale;
      float tIn = clamp(inside / B, 0., 1.);
      float h = sqrt(max(0., 1. - (1. - tIn) * (1. - tIn)));
      float slope = tIn < 1. ? (1. - tIn) / max(sqrt(max(1. - (1. - tIn) * (1. - tIn), 1e-4)), .02) : 0.;
      vec3 n = normalize(vec3(grad * slope * 1.25 * (1. - uFreeze), 1.));
      float cover = smoothstep(.8, -.8, d);
      // background with ambient occlusion (the glass floats above the chart)
      vec3 bg = chartAt(p, 0.);
      float ao = smoothstep(-40., 120., d);
      bg *= mix(.45, 1., ao);
      // refraction: bevel bends hard, the flat top magnifies (a lens)
      vec2 toC = p - uCenter;
      vec2 lens = toC * (1. / uMag - 1.) * smoothstep(0., B, inside);
      vec2 off = -n.xy * 150. * uRefr + lens * uRefr;
      vec3 refr;
      refr.r = chartAt(p + off * (1. + uDisp), 1.).r;
      refr.g = chartAt(p + off, 1.).g;
      refr.b = chartAt(p + off * (1. - uDisp), 1.).b;
      refr *= mix(vec3(.62, .74, .88), vec3(.86, .9, .96), h);  // glass body tint, cooler in the bevel
      // Fresnel + environment + specular
      float fres = .04 + .96 * pow(1. - n.z, 3.);
      vec2 L2 = vec2(cos(uLightA), sin(uLightA));
      vec3 L = normalize(vec3(L2 * .8, .6));
      float spec = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 60.);
      float spec2 = pow(max(dot(reflect(-normalize(vec3(-L2 * .7, .7)), n), vec3(0., 0., 1.)), 0.), 24.);
      vec3 env = mix(C_ICE * .9, C_EMBER * 1.1, smoothstep(-1., 1., dot(n.xy, vec2(.7, -.7))));
      vec3 glass = refr * (1. - fres * .6) + env * fres * .9 + C_BONE * spec * 3.2 + C_ICE * spec2 * .8;
      // thin bright rim right at the edge (thin-film catch-light)
      float rim = exp(-pow((d + 1.5) / 2.2, 2.)) * (1. - uFreeze);
      glass += mix(C_BONE, C_ICE, .3) * rim * 1.4;
      // freeze: the glass becomes flat bone
      glass = mix(glass, C_BONE * .9, uFreeze);
      bg = mix(bg, C_VOID, uFreeze);
      vec3 col = mix(bg, glass, cover * uShow);
      // the point of light it was born from
      float pt = exp(-dot(p - uCenter, p - uCenter) / (26. * 26.)) * (1. - uShow);
      col += C_BONE * pt * 9.;
      fragColor = vec4(col, 1.);
    }`, {
    uSDF: { value: sdf5.tex }, uChart: { value: chart }, uT: { value: 0 }, uRot: { value: 0 }, uChartScale: { value: 1 },
    uDrop: { value: 0 }, uMorph: { value: 0 }, uScale: { value: 1 }, uWobble: { value: 0 }, uMag: { value: 1.25 },
    uRefr: { value: 1 }, uDisp: { value: 0.06 }, uFreeze: { value: 0 }, uRipple1: { value: 0 }, uRipple2: { value: 0 },
    uLightA: { value: 0 }, uShow: { value: 1 }, uReveal: { value: 0 }, uCenter: { value: new THREE.Vector2(GCX, GCY) },
  });

  function render(t, target) {
    const lt = t - T0;
    const u = mat.uniforms;
    u.uT.value = t;
    u.uRot.value = -0.12 * lt - 0.25 * U.seg(t, T_PUSH, T_FREEZE, U.E.p2io);
    u.uChartScale.value = 0.5 * U.mix(0.86, 0.94, U.seg(t, T0, T1, U.E.sineIo)) * (1 + 0.08 * U.seg(t, T_PUSH, T_FREEZE, U.E.p2io));
    // droplet → 5 (with overshoot)
    u.uDrop.value = 230 * U.E.expoOut(U.seg(t, T0, T0 + 0.14));
    u.uMorph.value = U.E.p2io(U.seg(t, T0 + 0.07, T0 + 0.27));
    const pop = U.E.backOut(U.seg(t, T0 + 0.06, T0 + 0.42), 2.0);
    u.uScale.value = U.mix(0.55, 1.0, pop) * (1 + 0.16 * U.E.p2io(U.seg(t, T_PUSH, T_PUSH + 0.3)) - 0.16 * U.E.p2io(U.seg(t, T_FREEZE - 0.12, T_FREEZE + 0.1)));
    u.uWobble.value = 26 * Math.exp(-Math.max(0, t - T0 - 0.2) * 5) * U.seg(t, T0 + 0.05, T0 + 0.2) + 14 * Math.exp(-Math.max(0, t - T_PUSH) * 6) * (t > T_PUSH ? 1 : 0);
    u.uMag.value = U.mix(1.22, 1.6, U.seg(t, T_PUSH, T_PUSH + 0.3, U.E.p2io));
    u.uRefr.value = (1 - U.seg(t, T_FREEZE, T_FREEZE + 0.12, U.E.p2in));
    u.uDisp.value = U.mix(0.04, 0.085, U.seg(t, T_PUSH, T_PUSH + 0.25)) * (1 - U.seg(t, 6.85, T_FREEZE));
    u.uReveal.value = 1400 * U.E.p2out(U.seg(t, T0, T0 + 0.75));
    u.uFreeze.value = U.seg(t, T_FREEZE, T_FREEZE + 0.12, U.E.p2io);
    u.uRipple1.value = U.clamp(lt / 0.9);
    u.uRipple2.value = t > T_PUSH ? U.clamp((t - T_PUSH) / 0.9) : 0;
    u.uLightA.value = 2.4 - 1.6 * U.seg(t, T0, T1, U.E.sineIo);
    u.uShow.value = U.seg(t, T0, T0 + 0.05);
    E.pass(mat, target);
    const sp = U.seg(t, T_PUSH, T_PUSH + 0.25) * (1 - U.seg(t, T_PUSH + 0.25, T_PUSH + 0.6));
    return {
      exposure: 1 + Math.exp(-lt * 14) * 1.4,
      bloom: 0.38, bloomThreshold: 1.0,
      speed: sp * 0.25,
      ca: 0.0016 + sp * 0.004,
    };
  }

  return { id: "glass", render, sdf: sdf5 };
};
