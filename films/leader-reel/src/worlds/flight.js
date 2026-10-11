// World "2 · Camera": the straightened line becomes the leader's sweep hand and reveals the classic 2-pop frame (one beat
// of film: grain, flicker, gate weave, dust). Then the camera drops into the open top of the extruded 2 — a dolly zoom
// from 10° to 80° — pitches 90° and flies the numeral's spine through glowing arches (16th-note chase), sprocket-lit
// walls and fog, out of the end of the base into white light.
window.WorldFlight = function (E) {
  const { THREE, renderer } = E;
  const { U } = window;
  const GG = window.GL_GLYPH;
  const T0 = 11.015625, T_POP = 11.25, T_DIVE = 11.71875, T_FLY = 11.95, T_EXIT = 12.65625, T1 = 13.125;
  const B = 0.46875, E16 = B / 4;
  const W = 1920, H = 1080;
  const rtMain = E.rt(W, H, { depth: true, samples: 4 });

  // ---------------------------------------------------------------- geometry: the 2, extruded into a corridor
  const D = 300;
  const b2 = GG.glyph("2").bbox;
  const cxF = (b2[0] + b2[2]) / 2, cyF = (b2[1] + b2[3]) / 2;
  const toScene = (x, y) => new THREE.Vector3(x - cxF, -(y - cyF), 0);
  const shapes2 = GG.shapes(THREE, "2");
  const wallGeo = new THREE.ExtrudeGeometry(shapes2, { depth: D, bevelEnabled: false, curveSegments: 18 });
  wallGeo.translate(-cxF, cyF, 0);
  const floorGeo = new THREE.ShapeGeometry(shapes2, 18);
  floorGeo.translate(-cxF, cyF, 0);

  const FOG = `
    float fogK(float d, float density){ return 1. - exp(-pow(d * density, 1.6)); }`;
  const wallMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uT: { value: 0 }, uFog: { value: 0.0011 }, uExitX: { value: 1e9 }, uGlow: { value: 1 } },
    vertexShader: `varying vec2 vUv; varying vec3 vW; varying float vD;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec2 vUv; varying vec3 vW; varying float vD; uniform float uT, uFog, uExitX, uGlow;` + FOG + `
      void main(){
        if (vW.x > uExitX) discard;
        float z = vW.z;
        vec3 slate = vec3(.011, .016, .030);
        vec3 col = slate * (.6 + .8 * smoothstep(0., ${D}., z));
        // glowing strips at floor and rim
        col += vec3(.27, .68, 1.) * exp(-pow((z - 6.) / 4., 2.)) * 1.6 * uGlow;
        col += vec3(.85, .79, .70) * exp(-pow((z - ${D - 8}.) / 3., 2.)) * 1.3 * uGlow;
        // film sprocket holes: two rows of rounded rectangles along the wall
        float u = vUv.x;
        vec2 cell = vec2(fract(u / 46.) - .5, 0.);
        float row1 = step(abs(z - 70.), 13.), row2 = step(abs(z - ${D - 70}.), 13.);
        float hole = step(abs(cell.x), .22) * (row1 + row2);
        col = mix(col, vec3(.85, .79, .70) * .62, hole);
        col = mix(col, vec3(.00182, .00212, .00335), fogK(vD, uFog));
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const capHidden = new THREE.MeshBasicMaterial({ visible: false });
  const walls = new THREE.Mesh(wallGeo, [capHidden, wallMat]);
  const floorMat = new THREE.ShaderMaterial({
    uniforms: { uFog: { value: 0.0011 }, uBright: { value: 1 }, uGrid: { value: 0 } },
    vertexShader: `varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vW; varying float vD; uniform float uFog, uBright, uGrid;` + FOG + `
      void main(){
        vec3 bone = vec3(.8469, .7912, .7011) * .9;
        vec2 gq = abs(fract(vW.xy / 60.) - .5);
        float line = smoothstep(.47, .5, max(gq.x, gq.y));
        vec3 col = bone * uBright * (1. - line * .5 * uGrid);
        col = mix(col, vec3(.00182, .00212, .00335), fogK(vD, uFog));
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  const scene = new THREE.Scene();
  scene.add(walls, floor);

  // ---------------------------------------------------------------- the spine path (font units, y-down → scene)
  const SPINE = [[162, -380], [162, -455], [170, -525], [231, -593], [346, -628], [481, -624], [583, -585], [634, -525], [634, -452],
    [580, -389], [494, -331], [395, -274], [300, -218], [215, -160], [175, -112], [220, -90], [330, -88], [500, -88], [650, -88], [761, -88], [1000, -88]];
  const curve = new THREE.CatmullRomCurve3(SPINE.map(([x, y]) => toScene(x, y)), false, "centripetal", 0.5);
  const LEN = curve.getLength();
  const sFrom = (fx, fy) => {
    // arc length of the closest spine sample to a font-unit point (used to place the exit)
    let best = 0, bd = 1e9;
    const p = toScene(fx, fy);
    for (let i = 0; i <= 400; i++) { const q = curve.getPointAt(i / 400); const d = q.distanceTo(p); if (d < bd) { bd = d; best = i / 400; } }
    return best * LEN;
  };
  const S_START = sFrom(162, -455), S_END = sFrom(761, -88);
  wallMat.uniforms.uExitX.value = toScene(742, 0).x;

  // arches every 64 units, standing across the corridor
  const archMats = [];
  const ARCH_STEP = 64;
  const archGeo = new THREE.TorusGeometry(92, 2.6, 10, 64, Math.PI);
  const nArch = Math.floor((S_END - S_START) / ARCH_STEP);
  const archCols = [0xede6da, 0xede6da, 0xede6da, 0xff4a24];
  for (let i = 0; i <= nArch; i++) {
    const s = S_START + 40 + i * ARCH_STEP;
    if (s > S_END - 30) break;
    const u = s / LEN;
    const p = curve.getPointAt(u), tg = curve.getTangentAt(u);
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(archCols[i % 4]), fog: false });
    const a = new THREE.Mesh(archGeo, m);
    a.position.copy(p);
    // torus lies in its XY plane; stand it up (+z) and face it along the tangent
    const side = new THREE.Vector3(-tg.y, tg.x, 0).normalize();
    const basis = new THREE.Matrix4().makeBasis(side, new THREE.Vector3(0, 0, 1), tg.clone());
    a.quaternion.setFromRotationMatrix(basis);
    a.userData.i = i;
    archMats.push(m);
    scene.add(a);
  }
  // the exit: a wall of white light beyond the end of the base
  const exitMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1) });
  const exitPlane = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), exitMat);
  const pEnd = curve.getPointAt(Math.min(1, (S_END + 160) / LEN));
  exitPlane.position.copy(pEnd);
  exitPlane.lookAt(curve.getPointAt(S_END / LEN));
  scene.add(exitPlane);

  // ---------------------------------------------------------------- camera rig
  const cam = new THREE.PerspectiveCamera(10, W / H, 2, 40000);
  const FAR_FOV = 10;
  const farDist = (994.7 * 0.5) / Math.tan(((FAR_FOV / 2) * Math.PI) / 180); // the 2 at the numeral standard size (760 px)
  const Q_FRONT = new THREE.Quaternion(); // looking down -z, up +y (identity)
  const zc = 150;
  function poseOnPath(s) {
    const u = U.clamp(s / LEN, 0, 1);
    const p = curve.getPointAt(u), tg = curve.getTangentAt(u);
    const u2 = U.clamp((s + 30) / LEN, 0, 1);
    const tg2 = curve.getTangentAt(u2);
    const turn = tg.x * tg2.y - tg.y * tg2.x;          // signed curvature → bank
    const pos = new THREE.Vector3(p.x, p.y, zc);
    const fwd = tg.clone().normalize();
    const up = new THREE.Vector3(0, 0, 1).applyAxisAngle(fwd, -turn * 9);
    const m = new THREE.Matrix4().lookAt(pos, pos.clone().add(fwd), up);
    return { pos, q: new THREE.Quaternion().setFromRotationMatrix(m) };
  }
  const startPose = poseOnPath(S_START);

  function cameraAt(t) {
    if (t < T_DIVE) {
      cam.fov = FAR_FOV;
      cam.position.set(0, 0, farDist * (1 - 0.01 * U.seg(t, T_POP, T_DIVE)));
      cam.quaternion.copy(Q_FRONT);
    } else if (t < T_FLY) {
      // dolly zoom dive: height falls exponentially while the fov opens and the camera pitches onto the path
      const k = U.seg(t, T_DIVE, T_FLY);
      const kp = U.E.p3io(k);
      const zLog = Math.exp(U.mix(Math.log(farDist), Math.log(zc), U.E.p2io(k)));
      const sp = startPose.pos;
      cam.position.set(U.mix(0, sp.x, kp), U.mix(0, sp.y, kp), zLog);
      cam.fov = U.mix(FAR_FOV, 80, U.E.p2in(k));
      cam.quaternion.copy(Q_FRONT).slerp(startPose.q, U.E.sineIo(U.seg(k, 0.35, 1)));
    } else {
      const k = U.seg(t, T_FLY, T1);
      const s = U.mix(S_START, S_END + 150, U.E.p2in(k) * 0.55 + k * 0.45);
      const P = poseOnPath(s);
      cam.position.copy(P.pos);
      cam.quaternion.copy(P.q);
      cam.fov = 80 + 12 * U.seg(t, T_EXIT, T1, U.E.p2in);
    }
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }

  // ---------------------------------------------------------------- 2D overlay: sweep hand, leader ring, crosshair, dust
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d", { willReadFrequently: true });
  const ovTex = new THREE.CanvasTexture(cv);
  ovTex.colorSpace = THREE.NoColorSpace;
  ovTex.generateMipmaps = false;
  ovTex.minFilter = THREE.LinearFilter;
  const BONE = "#EDE6DA", ICE = "#8FD8FF", SLATE = "rgba(27,34,48,0.9)";
  function drawOverlay(t) {
    // reset every piece of canvas state each frame: nothing may carry over from the previously rendered frame
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.lineCap = "butt";
    g.lineJoin = "miter";
    g.lineWidth = 1;
    g.clearRect(0, 0, W, H);
    const fade = 1 - U.seg(t, T_DIVE, T_DIVE + 0.14);
    if (fade <= 0) return false;
    g.globalAlpha = fade;
    const sweep = U.E.expoIo(U.seg(t, T0, T_POP)) * Math.PI * 2;
    const a0 = 0;
    // the classic leader: rings + crosshair
    const ringA = U.seg(t, T0 + 0.05, T_POP);
    g.strokeStyle = BONE;
    g.lineWidth = 5;
    g.beginPath();
    g.arc(960, 540, 430, a0, a0 + Math.max(sweep, 0.0001));
    g.stroke();
    g.lineWidth = 2;
    g.globalAlpha = fade * ringA;
    g.beginPath(); g.arc(960, 540, 470, 0, Math.PI * 2); g.stroke();
    g.fillStyle = BONE;
    g.fillRect(0, 539, 1920, 2);
    g.fillRect(959, 0, 2, 1080);
    // during the pop beat the wedge keeps sweeping behind (one turn per beat), like a real leader

    // the sweep hand
    g.globalAlpha = fade * (1 - U.seg(t, T_POP, T_POP + 0.06));
    g.strokeStyle = BONE;
    g.lineCap = "round";
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(960, 540);
    g.lineTo(960 + Math.cos(a0 + sweep) * 430, 540 + Math.sin(a0 + sweep) * 430);
    g.stroke();
    // film dust + scratches on the pop beat (seeded per frame)
    if (t >= T_POP && t < T_DIVE) {
      const r = U.rng(1000 + Math.round(t * 60));
      g.globalAlpha = 0.85 * fade;
      for (let i = 0; i < 7; i++) {
        const x = r() * 1920, y = r() * 1080, s = 1 + r() * 4;
        g.fillStyle = r() < 0.5 ? "rgba(237,230,218,0.8)" : "rgba(6,7,11,0.9)";
        g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r()), r() * 3, 0, Math.PI * 2); g.fill();
      }
      if (r() < 0.6) { g.fillStyle = "rgba(237,230,218,0.35)"; g.fillRect(r() * 1920, 0, 1.5, 1080); }
    }
    g.globalAlpha = 1;
    return true;
  }

  const matOut = E.material(`
    uniform sampler2D uMain, uOv; uniform float uSweep, uOvOn, uWhite, uWedge;
    void main(){
      vec4 m = texture(uMain, vUv);
      vec3 col = m.rgb;
      // reveal mask: only the swept wedge shows the frame (angle measured clockwise from 3 o'clock, y-down)
      vec2 d = vec2(vUv.x - .5, .5 - vUv.y) * vec2(1920., 1080.);
      float ang = atan(d.y, d.x); if (ang < 0.) ang += 6.2831853;
      float vis = step(ang, uSweep) + step(6.28, uSweep);
      col = mix(C_VOID, col, clamp(vis, 0., 1.));
      // the leader's wedge keeps sweeping BEHIND the numeral on the pop beat (one turn per beat)
      float a12 = mod(ang + 1.5707963, 6.2831853);
      float wedge = step(a12, uWedge) * step(length(d), 428.) * step(.0001, uWedge);
      col += C_SLATE * 1.6 * wedge * (1. - smoothstep(.02, .2, luma(col)));
      vec4 o = texture(uOv, vUv);
      col = mix(col, srgbToLin(o.rgb) * .95, o.a * uOvOn);
      col = mix(col, C_BONE * 1.6, uWhite);
      fragColor = vec4(col, 1.);
    }`, { uMain: { value: null }, uOv: { value: ovTex }, uSweep: { value: 7 }, uOvOn: { value: 1 }, uWhite: { value: 0 }, uWedge: { value: 0 } });

  function render(t, target) {
    cameraAt(t);
    const n16 = Math.floor((t - T_FLY) / E16);
    const archOn = t > T_DIVE + 0.08;
    archMats.forEach((m, i) => {
      const hit = ((i + 64 - (n16 % 4)) % 4) === 0 && t > T_FLY;
      const base = new THREE.Color(hit && i % 4 !== 3 ? 0x8fd8ff : archCols[i % 4]);
      m.color.copy(base).multiplyScalar(t < T_FLY ? 0.35 : hit ? 2.8 : 0.5);
      m.visible = archOn;
    });
    exitPlane.visible = t > T_EXIT - 0.35;
    // fog thins as we drop in; grid appears on the floor near the camera
    const flying = U.seg(t, T_DIVE, T_FLY);
    wallMat.uniforms.uFog.value = flying > 0 ? U.mix(0.00002, 0.00105, flying) : 0.00002;
    floorMat.uniforms.uFog.value = wallMat.uniforms.uFog.value;
    floorMat.uniforms.uGrid.value = flying;
    floorMat.uniforms.uBright.value = U.mix(1.0, 0.2, U.E.p2in(flying));
    wallMat.uniforms.uGlow.value = U.mix(0.0, 1.0, U.seg(t, T_DIVE, T_DIVE + 0.2));
    exitMat.color.setRGB(1, 1, 1).multiplyScalar(2 + 6 * U.seg(t, T_EXIT, T1, U.E.p2in));
    renderer.setRenderTarget(rtMain);
    renderer.setClearColor(new THREE.Color(0.00182, 0.00212, 0.00335), 1);
    renderer.clear(true, true, false);
    renderer.render(scene, cam);
    const ovOn = drawOverlay(t);
    if (ovOn) ovTex.needsUpdate = true;
    matOut.uniforms.uMain.value = rtMain.texture;
    matOut.uniforms.uSweep.value = t < T_POP ? U.E.expoIo(U.seg(t, T0, T_POP)) * Math.PI * 2 : 7;
    matOut.uniforms.uOvOn.value = ovOn ? 1 : 0;
    matOut.uniforms.uWhite.value = U.seg(t, 12.98, T1, U.E.p2in);
    matOut.uniforms.uWedge.value = t >= T_POP && t < T_DIVE ? (((t - T_POP) / B) % 1) * Math.PI * 2 : 0;
    E.pass(matOut, target);
    // the pop beat is film: grain, flicker and gate weave
    const film = t >= T_POP && t < T_DIVE ? 1 : 0;
    const fr = Math.round(t * 60);
    const speed = U.seg(t, T_DIVE, T_FLY) * 0.6 + U.seg(t, T_FLY, T1) * 0.5;
    return {
      grain: film ? 0.07 : 0.034,
      flicker: film ? 1 + (U.hash1(fr) - 0.5) * 0.12 : 1,
      weaveX: film ? (U.hash1(fr * 1.7) - 0.5) * 0.0016 : 0,
      weaveY: film ? (U.hash1(fr * 2.3) - 0.5) * 0.0022 : 0,
      vignette: film ? 0.8 : 0.55,
      bloom: 0.5, bloomThreshold: 0.95,
      speed,
      zoomBlur: U.seg(t, T_DIVE + 0.08, T_FLY) * (1 - U.seg(t, T_FLY, T_FLY + 0.1)) * 0.22 + U.seg(t, T_FLY, T1) * 0.12,
      zoomCenter: [0.5, 0.5],
      exposure: 1 + U.seg(t, T_EXIT, T1, U.E.p2in) * 1.5,
    };
  }

  return { id: "flight", render };
};
