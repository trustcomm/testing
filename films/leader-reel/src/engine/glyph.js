// Glyph utilities: Archivo outlines (src/data/glyphs.js) → Path2D, THREE shapes, signed-distance fields.
(function () {
  const G = window.GLYPHS;

  function inst(key) {
    return G.instances[key || "900x125"];
  }
  function glyph(ch, key) {
    const g = inst(key).glyphs[ch];
    if (!g) throw new Error("glyph missing: " + ch);
    return g;
  }
  function pathString(cmds) {
    return cmds
      .map((c) => (c[0] === "Z" ? "Z" : c[0] + c.slice(1).join(" ")))
      .join("");
  }
  const p2dCache = new Map();
  // Path2D in font units, y-down, origin at the glyph's pen position on the baseline.
  function path2d(ch, key) {
    const k = (key || "900x125") + ":" + ch;
    if (!p2dCache.has(k)) p2dCache.set(k, new Path2D(pathString(glyph(ch, key).cmds)));
    return p2dCache.get(k);
  }

  // Placement helper: fit a glyph's bbox (font units) into a target box centred at (cx, cy) with height h (px).
  // Returns { s, ox, oy } so that screen = font * s + (ox, oy).
  function placeByHeight(ch, cx, cy, h, key) {
    const b = glyph(ch, key).bbox;
    const s = h / (b[3] - b[1]);
    return { s, ox: cx - ((b[0] + b[2]) / 2) * s, oy: cy - ((b[1] + b[3]) / 2) * s, bbox: b };
  }

  // THREE shapes for extrusion (font units, y flipped back to y-up for 3D).
  function shapes(THREE, ch, key) {
    const sp = new THREE.ShapePath();
    for (const c of glyph(ch, key).cmds) {
      switch (c[0]) {
        case "M": sp.moveTo(c[1], -c[2]); break;
        case "L": sp.lineTo(c[1], -c[2]); break;
        case "Q": sp.quadraticCurveTo(c[1], -c[2], c[3], -c[4]); break;
        case "C": sp.bezierCurveTo(c[1], -c[2], c[3], -c[4], c[5], -c[6]); break;
        case "Z": break;
      }
    }
    return sp.toShapes(true);
  }

  // ---------------------------------------------------------------- SDF (TinySDF-style anti-aliased EDT)
  const INF = 1e20;
  function edt1d(grid, offset, stride, length, f, v, z) {
    v[0] = 0;
    z[0] = -INF;
    z[1] = INF;
    f[0] = grid[offset];
    for (let q = 1, k = 0, s = 0; q < length; q++) {
      f[q] = grid[offset + q * stride];
      const q2 = q * q;
      do {
        const r = v[k];
        s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2;
      } while (s <= z[k] && --k > -1);
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = INF;
    }
    for (let q = 0, k = 0; q < length; q++) {
      while (z[k + 1] < q) k++;
      const r = v[k];
      const qr = q - r;
      grid[offset + q * stride] = f[r] + qr * qr;
    }
  }
  function edt2d(data, w, h) {
    const n = Math.max(w, h);
    const f = new Float64Array(n), z = new Float64Array(n + 1), v = new Uint16Array(n);
    for (let x = 0; x < w; x++) edt1d(data, x, w, h, f, v, z);
    for (let y = 0; y < h; y++) edt1d(data, y * w, 1, w, f, v, z);
  }

  // Rasterize `draw(ctx)` into a w×h alpha mask and return a signed distance field in pixels (negative inside).
  function sdfFromDraw(w, h, draw) {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    draw(ctx);
    const img = ctx.getImageData(0, 0, w, h).data;
    const N = w * h;
    const outer = new Float64Array(N), inner = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const a = img[i * 4 + 3] / 255;
      if (a >= 1) {
        outer[i] = 0;
        inner[i] = INF;
      } else if (a <= 0) {
        outer[i] = INF;
        inner[i] = 0;
      } else {
        const d = 0.5 - a;
        outer[i] = d > 0 ? d * d : 0;
        inner[i] = d < 0 ? d * d : 0;
      }
    }
    edt2d(outer, w, h);
    edt2d(inner, w, h);
    const sdf = new Float32Array(N);
    for (let i = 0; i < N; i++) sdf[i] = Math.sqrt(outer[i]) - Math.sqrt(inner[i]);
    return sdf;
  }

  // Glyph SDF texture covering a frame-shaped region. `frame` = { w, h } in px of the target screen space;
  // the glyph is placed with placeByHeight(ch, cx, cy, height). The SDF is computed at `res` scale (e.g. 0.5 =
  // half the screen resolution) and returned as a THREE.DataTexture (R = signed distance in SCREEN px).
  function glyphSDFTexture(THREE, ch, opts) {
    const o = Object.assign({ w: 1920, h: 1080, cx: 960, cy: 540, height: 760, res: 0.5, key: "900x125" }, opts || {});
    const W = Math.round(o.w * o.res), H = Math.round(o.h * o.res);
    const pl = placeByHeight(ch, o.cx, o.cy, o.height, o.key);
    const p = path2d(ch, o.key);
    const sdf = sdfFromDraw(W, H, (ctx) => {
      ctx.setTransform(pl.s * o.res, 0, 0, pl.s * o.res, pl.ox * o.res, pl.oy * o.res);
      ctx.fill(p);
    });
    const inv = 1 / o.res;
    for (let i = 0; i < sdf.length; i++) sdf[i] *= inv; // back to screen px
    // flip rows so texture v=0 is the bottom of the screen (GL convention)
    const flipped = new Float32Array(W * H);
    for (let y = 0; y < H; y++) flipped.set(sdf.subarray((H - 1 - y) * W, (H - y) * W), y * W);
    const tex = new THREE.DataTexture(flipped, W, H, THREE.RedFormat, THREE.FloatType);
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return { tex, place: pl, w: W, h: H, data: sdf, res: o.res };
  }

  // Sample interior points of a glyph (deterministic): returns Float32Array [x,y,...] in screen px.
  function sampleInterior(ch, count, place, seed, key) {
    const r = window.U.rng(seed);
    const b = glyph(ch, key).bbox;
    const cv = document.createElement("canvas");
    const W = 512, H = Math.round((512 * (b[3] - b[1])) / (b[2] - b[0]));
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    const s = W / (b[2] - b[0]);
    ctx.setTransform(s, 0, 0, s, -b[0] * s, -b[1] * s);
    ctx.fillStyle = "#fff";
    ctx.fill(path2d(ch, key));
    const img = ctx.getImageData(0, 0, W, H).data;
    const out = new Float32Array(count * 2);
    let n = 0, guard = 0;
    while (n < count && guard++ < count * 400) {
      const u = r(), v = r();
      const px = Math.floor(u * W), py = Math.floor(v * H);
      if (img[(py * W + px) * 4 + 3] > 200) {
        const fx = b[0] + u * (b[2] - b[0]), fy = b[1] + v * (b[3] - b[1]);
        out[n * 2] = fx * place.s + place.ox;
        out[n * 2 + 1] = fy * place.s + place.oy;
        n++;
      }
    }
    return out;
  }

  window.GL_GLYPH = { inst, glyph, path2d, placeByHeight, shapes, sdfFromDraw, glyphSDFTexture, sampleInterior };
})();
