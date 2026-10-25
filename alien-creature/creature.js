// The creature: every dot's position and colour is a closed-form function of
// (dot index, loop phase P). No geometry, no textures, no state between frames.
// P = 2π·t/DURATION, and every motion term uses an integer multiple of P, so
// frame 0 and frame DURATION·FPS are identical and the video loops.

export const COUNTS = Object.freeze({
  RIB_LINES: 112, RIB_PTS: 480,      // bell meridians, drawn as dotted lines
  SCATTER: 36000,                    // bell skin + inner membrane
  EYES: 3, EYE_RINGS: 10, EYE_PTS: 160,
  CORE: 20000,                       // helix brain + ganglion
  TENT: 12, TUBE_LINES: 10, TUBE_PTS: 200, FRONDS: 40, FROND_PTS: 90,
  DUST: 16000,
});

export function totalPoints(c = COUNTS) {
  return c.RIB_LINES * c.RIB_PTS + c.SCATTER + c.EYES * c.EYE_RINGS * c.EYE_PTS + c.CORE +
    c.TENT * (c.TUBE_LINES * c.TUBE_PTS + c.FRONDS * c.FROND_PTS) + c.DUST;
}

export function vertexShader(c = COUNTS) {
  const defs = Object.entries(c).map(([k, v]) => `#define ${k} ${v}`).join('\n');
  return `#version 300 es
precision highp float;
precision highp int;
${defs}
#define PI 3.14159265
#define TAU 6.28318531

uniform float uP;          // loop phase, 0..2π
uniform mat4 uVP;
uniform vec3 uCam;
uniform float uPx;         // pixels per world unit at distance 1
uniform float uFocus, uAperture, uSS;
uniform vec3 uInk, uAccent, uGlow;
out vec3 vCol;
out float vBokeh;

// ---------- helpers ----------
float hsh(uint x) {
  x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16;
  return float(x) / 4294967295.0;
}
float h2(int i, int s) { return hsh(uint(i) * 0x9E3779B9u + uint(s) * 0x85EBCA6Bu + 0x165667B1u); }

// Bell contraction for a phase in radians: fast squeeze (28% of the cycle), slow release.
float contr(float ph) {
  float f = fract(ph / TAU);
  return f < 0.28 ? sin(f / 0.28 * PI * 0.5) : 1.0 - smoothstep(0.28, 1.0, f);
}

// Whole-body sway and bob. Rotation only, so normals use the same matrix.
mat3 bodyRot() {
  float yaw = 0.35 * sin(uP + 0.7), rz = 0.10 * sin(uP), rx = 0.08 * sin(2.0 * uP + 1.0);
  mat3 Y = mat3(cos(yaw), 0, -sin(yaw), 0, 1, 0, sin(yaw), 0, cos(yaw));
  mat3 Z = mat3(cos(rz), sin(rz), 0, -sin(rz), cos(rz), 0, 0, 0, 1);
  mat3 X = mat3(1, 0, 0, 0, cos(rx), sin(rx), 0, -sin(rx), cos(rx));
  return Y * Z * X;
}
float bodyLift() { return 0.14 * contr(5.0 * uP - 1.0); }

// ---------- bell ----------
// u: around (0..1), v: apex (0) to rim (1). The squeeze travels down the bell: phase delay 1.4·v.
vec3 bell(float u, float v, out vec3 n) {
  float c = contr(5.0 * uP - 1.4 * v);
  float a = v * 1.78;
  float R = sin(a) * (1.0 + 0.18 * v);
  float Y = 0.9 * cos(a);
  R *= 1.0 + 0.07 * v * cos(TAU * 8.0 * u + 0.6 * sin(2.0 * uP));
  R *= 1.0 - 0.24 * c * smoothstep(0.15, 1.0, v);
  R += 0.025 * v * sin(14.0 * v - 10.0 * uP);
  Y -= 0.08 * c * v * v;
  Y -= 0.06 * smoothstep(0.82, 1.0, v) * (0.5 + 0.5 * cos(TAU * 16.0 * u));
  n = normalize(vec3(cos(TAU * u) * sin(a), cos(a) * 0.9 + 0.1, sin(TAU * u) * sin(a)));
  return vec3(R * cos(TAU * u), Y, R * sin(TAU * u)) * 1.05;
}

// ---------- tentacles ----------
// Two cosine waves with a phase delay along the arm (s: root 0 .. tip 1).
vec3 spine(int j, float s) {
  float u = (float(j) + 0.5) / float(TENT) + 0.02 * sin(float(j) * 7.1);
  vec3 nn;
  vec3 root = bell(u, 0.96, nn);
  vec3 rad = vec3(cos(TAU * u), 0.0, sin(TAU * u));
  vec3 tng = vec3(-sin(TAU * u), 0.0, cos(TAU * u));
  float L = 2.3 + 0.8 * h2(j, 11);
  float ph = h2(j, 12) * TAU;
  float cd = contr(5.0 * uP - 1.4 - 2.2 * s);   // the squeeze reaches the tips later
  float w = pow(s, 1.5);
  vec3 p = root;
  p += rad * (0.30 * s * (1.0 - 0.6 * s) - 0.18 * cd * s);
  p.y -= L * s * (1.0 - 0.12 * cd);
  p += tng * 0.45 * w * cos(5.5 * s - 3.0 * uP + ph);
  p += rad * 0.30 * w * sin(4.0 * s - 2.0 * uP + ph * 1.3);
  return p;
}

void frame(int j, float s, out vec3 p, out vec3 T, out vec3 N, out vec3 B) {
  p = spine(j, s);
  T = normalize(spine(j, s + 0.01) - p);
  vec3 ref = abs(T.y) < 0.95 ? vec3(0, 1, 0) : vec3(1, 0, 0);
  N = normalize(cross(T, ref));
  B = cross(T, N);
}

void main() {
  int i = gl_VertexID;
  vec3 p = vec3(0), n = vec3(0);
  vec3 col = uInk;
  float bright = 0.5, size = 0.0075;  // world-space dot diameter
  bool body = true, fres = false;

  int nRib = RIB_LINES * RIB_PTS;
  int nEye = EYES * EYE_RINGS * EYE_PTS;
  int nTentEach = TUBE_LINES * TUBE_PTS + FRONDS * FROND_PTS;

  if (i < nRib) {
    // ---- bell ribs: dotted meridians with light pulses travelling down them
    int r = i / RIB_PTS, k = i % RIB_PTS;
    float v = (float(k) + 0.5) / float(RIB_PTS);
    float u = (float(r) + 0.5) / float(RIB_LINES) + 0.06 * v;
    p = bell(u, v, n);
    fres = true;
    bright = 0.55;
    float pulse = cos(24.0 * v - 10.0 * uP + float(r) * 0.7);
    if (pulse > 0.93) { col = uGlow; bright = 1.6; }
    if (v > 0.975 && r % 4 == 0) { col = uAccent; bright = 1.1; size = 0.010; }
  } else if ((i -= nRib) < SCATTER) {
    // ---- bell skin and a dimmer inner membrane
    float u = h2(i, 1), v = sqrt(h2(i, 2));
    p = bell(u, v, n);
    bool inner = h2(i, 3) < 0.4;
    if (inner) p *= 0.9;
    fres = true;
    bright = inner ? 0.22 : 0.38;
    size = 0.006;
  } else if ((i -= SCATTER) < nEye) {
    // ---- eyes: concentric dotted rings on the bell surface, two blinks per loop
    int e = i / (EYE_RINGS * EYE_PTS), rem = i % (EYE_RINGS * EYE_PTS);
    int ring = rem / EYE_PTS, m = rem % EYE_PTS;
    vec2 at = e == 0 ? vec2(0.25, 0.50) : (e == 1 ? vec2(0.205, 0.63) : vec2(0.295, 0.63));
    float er = e == 0 ? 0.13 : 0.07;
    vec3 c = bell(at.x, at.y, n);
    vec3 t1 = normalize(cross(n, vec3(0, 1, 0)));
    vec3 t2 = cross(t1, n);
    float rr = er * (0.25 + 0.75 * float(ring) / float(EYE_RINGS - 1));
    float ang = TAU * float(m) / float(EYE_PTS) + float(ring) * 0.3;
    float bl = fract(uP / TAU * 2.0 + 0.35 + 0.03 * float(e)) - 0.5;
    float lid = 1.0 - 0.94 * exp(-bl * bl * 1600.0);
    p = c + n * (0.02 + 0.035 * (1.0 - (rr / er) * (rr / er))) + (t1 * cos(ang) + t2 * sin(ang) * lid) * rr;
    if (ring < 2) { bright = 0.0; }
    else if (ring < 8) { col = uAccent; bright = 0.9 + 0.6 * cos(ang * 24.0) * 0.5 + 0.3 * float(ring == 2); size = 0.006; }
    else { bright = 0.8; size = 0.006; }
  } else if ((i -= nEye) < CORE) {
    // ---- brain: a double helix inside the bell, plus a dim ganglion cloud
    float s = h2(i, 4);
    float c = contr(5.0 * uP - 0.7);
    vec3 j3 = vec3(h2(i, 5), h2(i, 6), h2(i, 7)) - 0.5;
    if (i % 10 < 7) {
      float ang = 5.0 * PI * s + 2.0 * uP + PI * float(i % 2);
      float rad = 0.24 * (1.0 - 0.4 * s) * (1.0 - 0.15 * c);
      p = vec3(cos(ang) * rad, 0.66 - 0.72 * s, sin(ang) * rad) + j3 * 0.035;
      float hb = pow(0.5 + 0.5 * cos(10.0 * uP - 6.0 * s), 6.0);
      col = uGlow; bright = 0.35 + 1.4 * hb; size = 0.006;
    } else {
      p = vec3(0.0, 0.35, 0.0) + normalize(j3) * pow(h2(i, 8), 0.5) * 0.42 * (1.0 - 0.1 * c);
      col = mix(uGlow, uInk, 0.5); bright = 0.16; size = 0.006;
    }
  } else if ((i -= CORE) < TENT * nTentEach) {
    // ---- tentacles: a dotted tube plus feathery fronds with red tips
    int j = i / nTentEach, k = i % nTentEach;
    float ph = h2(j, 12) * TAU;
    if (k < TUBE_LINES * TUBE_PTS) {
      int l = k / TUBE_PTS, m = k % TUBE_PTS;
      float s = (float(m) + 0.5) / float(TUBE_PTS);
      vec3 T, N, B; frame(j, s, p, T, N, B);
      float rad = 0.055 * pow(1.0 - s, 0.8) + 0.006;
      float ang = TAU * float(l) / float(TUBE_LINES) + s * 3.0;
      p += (N * cos(ang) + B * sin(ang)) * rad;
      bright = 0.5;
      if (cos(30.0 * s - 10.0 * uP + ph) > 0.92) { col = uGlow; bright = 1.5; }
      if (s > 0.975) { col = uAccent; bright = 1.6; size = 0.012; }
    } else {
      k -= TUBE_LINES * TUBE_PTS;
      int f = k / FROND_PTS, m = k % FROND_PTS;
      float sf = 0.05 + 0.9 * (float(f) + 0.5) / float(FRONDS);
      float q = (float(m) + 0.5) / float(FROND_PTS);
      vec3 T, N, B, base; frame(j, sf, base, T, N, B);
      float ang = float(f) * 2.39996 + float(j);
      vec3 dir = N * cos(ang) + B * sin(ang);
      vec3 perp = cross(T, dir);
      float len = 0.24 * pow(1.0 - sf, 0.7) * (0.55 + 0.45 * h2(j * 64 + f, 13));
      float bend = 0.35 * q * cos(4.0 * q - 4.0 * uP + 9.0 * sf + float(j));
      p = base + len * (dir * q * (1.0 - 0.25 * q) - T * 0.5 * q * q + perp * bend * 0.6);
      bright = 0.32;
      size = 0.006;
      if (q >= 0.9) { col = uAccent; bright = 1.4; size = 0.010; }
    }
  } else {
    // ---- dust: a drifting field in front of and behind the creature (depth cue)
    i -= TENT * nTentEach;
    vec3 h = vec3(h2(i, 20), h2(i, 21), h2(i, 22));
    p = vec3(h.x * 11.0 - 5.5, h.y * 12.0 - 6.8, h.z * 14.0 - 6.0);
    p += 0.15 * vec3(sin(uP + h.x * TAU), sin(uP + h.y * TAU), cos(uP + h.z * TAU));
    bright = 0.18 + 0.25 * h2(i, 23);
    size = 0.006;
    body = false;
  }

  if (body) {
    mat3 R = bodyRot();
    p = R * p + vec3(0.0, bodyLift(), 0.0);
    n = R * n;
  }
  if (fres) {
    // X-ray silhouette: dots facing the camera fade, the outline glows
    float f = 1.0 - abs(dot(normalize(n), normalize(uCam - p)));
    bright *= 0.25 + 1.1 * f * f;
  }

  vec4 clip = uVP * vec4(p, 1.0);
  gl_Position = clip;
  float w = max(clip.w, 0.1);
  float core = max(uPx * size / w, 1.25 * uSS);
  float coc = uAperture * abs(1.0 / uFocus - 1.0 / w) * uPx;
  float sz = sqrt(core * core + coc * coc);
  gl_PointSize = sz;
  vBokeh = clamp(coc / sz, 0.0, 1.0);
  float energy = (core * core) / (sz * sz);            // a blurred dot spreads the same light
  float fog = mix(1.0, 0.45, smoothstep(0.0, 3.5, w - uFocus));
  vCol = col * bright * energy * fog;
}
`;
}

export const fragmentShader = `#version 300 es
precision highp float;
in vec3 vCol;
in float vBokeh;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float d = length(q);
  if (d > 1.0) discard;
  float soft = exp(-d * d * 3.0);
  float disc = smoothstep(1.0, 0.82, d) * (0.75 + 0.25 * d);
  o = vec4(vCol * mix(soft, disc * 0.6, vBokeh), 1.0);
}
`;
