// Self-check: node lib/techniques/check.mjs  -> asserts every technique module loads with its exports and that the
// easing tokens in tokens.js match style.json exactly.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { EZ, ez } from './tokens.js';

const style = JSON.parse(fs.readFileSync(new URL('../../style.json', import.meta.url), 'utf8'));
for (const [k, v] of Object.entries(style.easing)) assert.deepEqual(EZ[k], v.bezier, 'easing token ' + k);
assert.throws(() => ez('nope'));
const expected = {
  'match-morph-chain': ['morphChain', 'morphState'], 'word-blur-in': ['wordBlurIn', 'wordBlurInCues'], 'type-on': ['typeOn', 'typeOnCues'],
  'prompt-macro-type': ['promptMacro', 'promptTimes'], 'giant-word-pan': ['giantWordPan'], 'hero-word-rise': ['heroWordRise'],
  'accent-flood': ['accentFlood'], 'iris-mask': ['iris', 'ringRipple'], 'pixel-dot-resolve': ['pixelDotResolve', 'dotTimes'],
  'pull-back-to-device': ['pullBack'], 'camera-ride': ['cameraAt', 'applyCamera'], 'pill-toggle': ['pillPop', 'toggle'],
  'logo-resolve': ['logoResolve'], 'counter-data': ['counterRing', 'bars'], 'living-background': ['livingBackground'],
};
assert.deepEqual(Object.keys(expected).sort(), [...style.techniques_planned_code].sort(), 'technique list vs style.json');
for (const [id, names] of Object.entries(expected)) {
  const m = await import(`./${id}.js`);
  for (const n of names) assert.equal(typeof m[n], 'function', `${id}.${n}`);
}
const { cameraAt } = await import('./camera-ride.js');
const c = cameraAt(0.45, [[0, [0, 0, 1, 0]], [0.9, [100, 0, 1, 0], 'camera_s']]);
assert.ok(c.x > 30 && c.x < 70, 'camera_s midpoint ' + c.x);
console.log('ok: 15 techniques, easing tokens match style.json');
