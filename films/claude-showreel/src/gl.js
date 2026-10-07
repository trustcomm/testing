// WebGL layer: one renderer, two scenes, both pure functions of time.
//   goo(state)  — chapter 02: signed-distance metaballs (smooth-min union) in a full-screen shader; crisp at any size.
//   depth(t)    — chapter 04: a clay sphere bouncing on a rippling floor of 390 instanced cubes, camera dolly + orbit.
window.GLReel = function (THREE, canvas, P) {
  const W = 1920, H = 1080;
  const { seg, lerp, ease, clamp } = window.L;
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance",
  });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const srgb = (h) => { const c = window.L.hex(h); return new THREE.Vector3(c[0] / 255, c[1] / 255, c[2] / 255); };

  // ------------------------------------------------------------------ goo
  const gooScene = new THREE.Scene();
  const gooCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const gooU = {
    uCore: { value: new THREE.Vector4(960, 600, 240, 0) },
    uCoreScale: { value: new THREE.Vector2(1, 1) },
    uKid: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
    uBox: { value: new THREE.Vector4(0, 0, 0, 0) },
    uBoxMix: { value: 0 },
    uK: { value: 80 },
    uRings: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
    uCenter: { value: new THREE.Vector2(960, 600) },
    uColor: { value: srgb(P.clay) },
  };
  const gooMat = new THREE.ShaderMaterial({
    uniforms: gooU,
    transparent: true, depthTest: false, depthWrite: false, premultipliedAlpha: true,
    vertexShader: "void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `
      uniform vec4 uCore; uniform vec2 uCoreScale; uniform vec3 uKid[3]; uniform vec4 uBox; uniform float uBoxMix;
      uniform float uK; uniform vec4 uRings[4]; uniform vec2 uCenter; uniform vec3 uColor;
      float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
      float sdBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      void main(){
        vec2 p = vec2(gl_FragCoord.x, ${H}.0 - gl_FragCoord.y);
        vec2 q = (p - uCore.xy) / uCoreScale;
        float d = (length(q) - uCore.z) * min(uCoreScale.x, uCoreScale.y);
        if (uBoxMix > 0.5) d = sdBox(p - uBox.xy, uBox.zw, min(uBox.z, uBox.w));
        for (int i = 0; i < 3; i++) { if (uKid[i].z > 0.5) d = smin(d, length(p - uKid[i].xy) - uKid[i].z, uK); }
        float a = clamp(0.5 - d, 0.0, 1.0);
        for (int i = 0; i < 4; i++) {
          if (uRings[i].z > 0.0) {
            float dr = abs(length(p - uCenter) - uRings[i].x) - uRings[i].y * 0.5;
            a = max(a, clamp(0.5 - dr, 0.0, 1.0) * uRings[i].z);
          }
        }
        gl_FragColor = vec4(uColor * a, a);
      }`,
  });
  gooScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), gooMat));

  function goo(s) {
    gooU.uCore.value.set(s.core.x, s.core.y, s.core.r, 0);
    gooU.uCoreScale.value.set(s.core.sx, s.core.sy);
    s.kids.forEach((k, i) => gooU.uKid.value[i].set(k.x, k.y, k.r));
    gooU.uBoxMix.value = s.box ? 1 : 0;
    if (s.box) gooU.uBox.value.set(s.box.cx, s.box.cy, s.box.hx, s.box.hy);
    for (let i = 0; i < 4; i++) {
      const r = s.rings[i];
      if (r) gooU.uRings.value[i].set(r.radius, r.width, r.alpha, 0);
      else gooU.uRings.value[i].set(0, 0, 0, 0);
    }
    gooU.uCenter.value.set(s.center[0], s.center[1]);
    renderer.setClearColor(0x000000, 0);
    renderer.render(gooScene, gooCam);
  }

  // ------------------------------------------------------------------ depth
  const scene = new THREE.Scene();
  const INK = new THREE.Color(P.ink);
  scene.background = INK.clone();
  scene.fog = new THREE.Fog(INK.clone(), 9, 26);
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.04, 80);

  // Studio environment for the clearcoat reflections: warm dome, dark floor, one big softbox. Built once, deterministic.
  const envScene = new THREE.Scene();
  const domeGeo = new THREE.SphereGeometry(20, 48, 24);
  const domeCol = [];
  const top = new THREE.Color(P.paper), mid = new THREE.Color(P.clayDeep), bot = new THREE.Color(P.ink);
  for (let i = 0; i < domeGeo.attributes.position.count; i++) {
    const y = domeGeo.attributes.position.getY(i) / 20;
    const c = y > 0 ? mid.clone().lerp(top, Math.pow(y, 0.7)).multiplyScalar(0.55) : mid.clone().lerp(bot, Math.min(1, -y * 3)).multiplyScalar(0.35);
    domeCol.push(c.r, c.g, c.b);
  }
  domeGeo.setAttribute("color", new THREE.Float32BufferAttribute(domeCol, 3));
  envScene.add(new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const softbox = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.paper).multiplyScalar(5), side: THREE.DoubleSide }));
  softbox.position.set(-8, 10, 9);
  softbox.lookAt(0, 0, 0);
  envScene.add(softbox);
  const rimbox = new THREE.Mesh(new THREE.PlaneGeometry(4, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.clay).multiplyScalar(3), side: THREE.DoubleSide }));
  rimbox.position.set(10, 4, -10);
  rimbox.lookAt(0, 0, 0);
  envScene.add(rimbox);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, 0.03).texture;
  scene.environmentIntensity = 0.85;

  const key = new THREE.DirectionalLight(new THREE.Color(P.paper), 2.6);
  key.position.set(-5, 8, 6);
  const rim = new THREE.DirectionalLight(new THREE.Color(P.clay), 2.4);
  rim.position.set(5, 3, -7);
  const hemi = new THREE.HemisphereLight(new THREE.Color(P.paper), new THREE.Color(P.ink), 0.25);
  scene.add(key, rim, hemi);

  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(P.clay), roughness: 0.4, metalness: 0, clearcoat: 0.75, clearcoatRoughness: 0.16,
    sheen: 0.3, sheenColor: new THREE.Color(P.clayLight), sheenRoughness: 0.45,
    emissive: new THREE.Color(P.clayLight), emissiveIntensity: 0,
  });
  sphereMat.fog = false;
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), sphereMat);
  scene.add(sphere);

  // Contact shadow: a soft radial blob on the floor plane.
  const sc = document.createElement("canvas");
  sc.width = sc.height = 256;
  const sg = sc.getContext("2d");
  const grad = sg.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(27,23,20,0.85)");
  grad.addColorStop(0.45, "rgba(27,23,20,0.42)");
  grad.addColorStop(1, "rgba(27,23,20,0)");
  sg.fillStyle = grad;
  sg.fillRect(0, 0, 256, 256);
  const shadowTex = new THREE.CanvasTexture(sc);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  scene.add(shadow);

  // Glow halo for the implosion.
  const gc = document.createElement("canvas");
  gc.width = gc.height = 256;
  const gg = gc.getContext("2d");
  const g2 = gg.createRadialGradient(128, 128, 0, 128, 128, 128);
  g2.addColorStop(0, "rgba(242,237,227,1)");
  g2.addColorStop(0.18, "rgba(239,162,127,0.8)");
  g2.addColorStop(0.5, "rgba(210,100,58,0.22)");
  g2.addColorStop(1, "rgba(210,100,58,0)");
  gg.fillStyle = g2;
  gg.fillRect(0, 0, 256, 256);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false }));
  halo.material.fog = false;
  scene.add(halo);

  // Cube floor.
  const NX = 26, NZ = 15, N = NX * NZ;
  const cubeGeo = new THREE.BoxGeometry(0.9, 0.7, 0.9);
  cubeGeo.translate(0, -0.35, 0); // top face at y = 0
  const cubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0.0, envMapIntensity: 0.22 });
  const cubes = new THREE.InstancedMesh(cubeGeo, cubeMat, N);
  const cubeXZ = [];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) cubeXZ.push([(i - (NX - 1) / 2) * 1.0 + 0.5, (j - (NZ - 1) / 2) * 1.0]);
  scene.add(cubes);
  const dummy = new THREE.Object3D();
  const cInk2 = new THREE.Color(P.ink), cClay = new THREE.Color(P.clay), cTmp = new THREE.Color();
  for (let k = 0; k < N; k++) cubes.setColorAt(k, cInk2);

  const D = P.depth; // timing from the cue sheet
  const HOLD = 2 / 60;

  // Sphere centre height (floor top at y = 0, radius 1) and squash, as a pure function of t.
  function spherePose(t) {
    const C = D.contacts; // [7.5, 8.0, 8.5]
    const apex = 2.2;
    const f = window.L.frameOf(t);
    for (const c of C) {
      const k = f - Math.round(c * 60);
      if (k > -1e-3 && k < 2 - 1e-3) {
        const w = k < 1 - 1e-3 ? 1 : 0.45;
        const sy = 1 - 0.3 * w, sxz = 1 + 0.2 * w;
        return { y: sy, sy, sxz, vy: 0 };
      }
    }
    let y, vy;
    if (t < C[0]) {
      const u = seg(t, D.start, C[0]);
      y = 1 + apex - apex * u * u;
      vy = (-2 * apex * u) / (C[0] - D.start);
    } else {
      let i = C.length - 1;
      for (let j = 0; j < C.length - 1; j++) if (t < C[j + 1]) { i = j; break; }
      const t0 = C[i] + HOLD, t1 = (i < C.length - 1 ? C[i + 1] : C[i] + 0.5);
      const u = (t - t0) / (t1 - t0);
      y = 1 + apex * 4 * u * (1 - u);
      vy = (apex * 4 * (1 - 2 * u)) / (t1 - t0);
    }
    const s = Math.min(1, Math.abs(vy) / 8.8);
    const sy = 1 + 0.16 * s * s;
    return { y, sy, sxz: 1 / Math.sqrt(sy), vy };
  }

  function depth(t) {
    const e = (n, u) => ease(n)(u);
    const pose = spherePose(t);
    // Implosion: lift, contract to a point, glow.
    const ui = seg(t, D.implode, D.end);
    const lift = 0.5 * e("power2.inOut", ui);
    const shrink = 1 - 0.985 * e("power4.in", ui);
    const sy = pose.sy * shrink, sxz = pose.sxz * shrink;
    sphere.position.set(0, pose.y + lift, 0); // pose.y is the centre height (bottom on the floor during contact frames)
    sphere.scale.set(sxz, sy, sxz);
    sphereMat.emissiveIntensity = 3.2 * e("power2.in", ui);
    halo.position.copy(sphere.position);
    const hs = 2.8 * e("power2.in", ui) * (1 - 0.35 * e("power3.in", seg(t, D.end - 0.06, D.end)));
    halo.scale.set(hs, hs, 1);
    halo.material.opacity = e("power2.in", ui);
    halo.visible = ui > 0;

    // Shadow under the sphere: tighter and darker as it nears the floor.
    const hgt = Math.max(0, sphere.position.y - 1);
    shadow.scale.setScalar((0.75 + 0.18 * hgt) * (1 - 0.9 * ui));
    shadow.material.opacity = 0.75 / (1 + 0.55 * hgt) * (1 - ui);

    // Floor ripples: each contact punches a brief dip under the sphere and sends one raised ring outward, damped.
    for (let k = 0; k < N; k++) {
      const [x, z] = cubeXZ[k];
      const r = Math.hypot(x, z);
      let dy = 0, glow = 0;
      D.contacts.forEach((c, n) => {
        const tau = t - c;
        if (tau < 0) return;
        const A = (n === 0 ? 0.4 : 0.32) * Math.exp(-tau / 0.6);
        const q = (r - 7.5 * tau) / 0.8;
        const crest = A * Math.exp(-q * q);
        dy += crest - 0.3 * Math.exp(-tau / 0.1) * Math.exp(-(r * r) / 1.6);
        glow += crest / 0.3;
      });
      dummy.position.set(x, dy, z);
      dummy.updateMatrix();
      cubes.setMatrixAt(k, dummy.matrix);
      const g = clamp(glow, 0, 1);
      cTmp.copy(cInk2).lerp(cClay, 0.95 * g);
      cubes.setColorAt(k, cTmp);
    }
    cubes.instanceMatrix.needsUpdate = true;
    cubes.instanceColor.needsUpdate = true;

    // Camera: out of the sphere (log-space dolly, expo.out), then a 38° orbit; target re-centres the sphere to implode.
    const ud = e("expo.out", seg(t, D.start, D.dollyEnd));
    const sphereC = new THREE.Vector3(0, sphere.position.y, 0);
    const wideT = new THREE.Vector3(0, 1.35, 0);
    const tgt = sphereC.clone().lerp(wideT, ud);
    const back = e("power2.inOut", seg(t, D.implode - 0.2, D.end));
    tgt.lerp(sphereC, back);
    let dist = 1.075 * Math.pow(11.5 / 1.075, ud);
    dist = lerp(dist, 8.2, e("power2.in", seg(t, D.implode - 0.15, D.end)));
    const el = (21 * ud) * Math.PI / 180;
    const az = (-10 * ud + 38 * e("sine.inOut", seg(t, D.dollyEnd, D.orbitEnd))) * Math.PI / 180;
    cam.position.set(tgt.x + dist * Math.cos(el) * Math.sin(az), tgt.y + dist * Math.sin(el), tgt.z + dist * Math.cos(el) * Math.cos(az));
    cam.lookAt(tgt);

    // The world folds into the point: fog closes in on everything but the sphere.
    const uf = e("power2.in", seg(t, D.implode - 0.05, D.end));
    scene.fog.near = lerp(9, 0.2, uf);
    scene.fog.far = lerp(26, 2.2, uf);

    renderer.setClearColor(INK, 1);
    renderer.render(scene, cam);
  }

  // Warm both programs once so the first sampled frame is not a shader compile.
  goo({ core: { x: 960, y: 600, r: 240, sx: 1, sy: 1 }, kids: [{ x: 0, y: 0, r: 0 }, { x: 0, y: 0, r: 0 }, { x: 0, y: 0, r: 0 }], rings: [], center: [960, 600] });
  depth(D.start + 0.5);
  return { goo, depth, renderer };
};
