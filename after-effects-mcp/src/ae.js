// Bridge to After Effects: wraps an ExtendScript body, runs it inside AE through osascript,
// and reads back the JSON result the script writes to a temp file.
import {execFile} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DRY = process.env.AE_MCP_DRY_RUN === '1';
const TIMEOUT_S = Number(process.env.AE_MCP_TIMEOUT || 3600);

// ExtendScript is ES3: no JSON object in older AE builds, so the prelude brings its own serializer and the shared helpers.
const PRELUDE = String.raw`
function __json(v, d) {
  d = d || 0;
  if (d > 8) return '"[depth]"';
  if (v === null || v === undefined) return 'null';
  var t = typeof v;
  if (t === 'number') return isFinite(v) ? String(v) : 'null';
  if (t === 'boolean') return v ? 'true' : 'false';
  if (t === 'string') return '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/[\x00-\x1f]/g, '') + '"';
  if (v instanceof Array) { var a = []; for (var i = 0; i < v.length; i++) a.push(__json(v[i], d + 1)); return '[' + a.join(',') + ']'; }
  if (t === 'object') {
    if (v.constructor !== Object) return __json(String(v), d);
    var o = []; for (var k in v) if (v.hasOwnProperty(k)) o.push(__json(k) + ':' + __json(v[k], d + 1)); return '{' + o.join(',') + '}';
  }
  return __json(String(v), d);
}
function hexColor(h) {
  h = String(h).replace('#', '');
  return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
}
function toColor(c) { return (typeof c === 'string') ? hexColor(c) : c; }
function findComp(ref) {
  if (ref === undefined || ref === null || ref === '') {
    if (app.project.activeItem instanceof CompItem) return app.project.activeItem;
    throw new Error('No composition given and no active composition');
  }
  for (var i = 1; i <= app.project.numItems; i++) {
    var it = app.project.item(i);
    if (it instanceof CompItem && (it.name === ref || it.id === ref)) return it;
  }
  throw new Error('Composition not found: ' + ref);
}
function findLayer(comp, ref) {
  if (typeof ref === 'number') { if (ref < 1 || ref > comp.numLayers) throw new Error('Layer index out of range: ' + ref); return comp.layer(ref); }
  var l = comp.layer(ref);
  if (!l) throw new Error('Layer not found: ' + ref + ' in ' + comp.name);
  return l;
}
// "Position", "Transform/Opacity", "Effects/Gaussian Blur/Blurriness", or match names like "ADBE Transform Group/ADBE Position".
function findProp(layer, p) {
  var parts = String(p).split('/'), cur = layer, i = 0;
  if (!cur.property(parts[0])) {
    var tr = layer.property('ADBE Transform Group');
    if (tr && tr.property(parts[0])) cur = tr;
    else if (parts[0] === 'Source Text' || parts[0] === 'Text') { cur = layer.property('ADBE Text Properties'); if (parts[0] === 'Source Text') { cur = cur.property('ADBE Text Document'); i = 1; } }
  }
  for (; i < parts.length; i++) {
    var n = cur.property(parts[i]);
    if (!n) throw new Error('Property not found: "' + parts[i] + '" in path "' + p + '" on layer ' + layer.name);
    cur = n;
  }
  return cur;
}
function toValue(prop, v) {
  if (prop.propertyValueType === PropertyValueType.TEXT_DOCUMENT) { var td = prop.value; td.text = String(v); return td; }
  if (prop.propertyValueType === PropertyValueType.COLOR) return toColor(v);
  return v;
}
function layerInfo(l) {
  var type = 'av';
  if (l instanceof TextLayer) type = 'text';
  else if (l instanceof ShapeLayer) type = 'shape';
  else if (l instanceof CameraLayer) type = 'camera';
  else if (l instanceof LightLayer) type = 'light';
  else if (l.source && l.source.mainSource instanceof SolidSource) type = 'solid';
  else if (l.source instanceof CompItem) type = 'precomp';
  else if (l.source && l.source.mainSource instanceof FileSource) type = 'footage';
  return {index: l.index, name: l.name, type: type, enabled: l.enabled, inPoint: l.inPoint, outPoint: l.outPoint, startTime: l.startTime, parent: l.parent ? l.parent.name : null};
}
`;

export function buildScript(body, args, outFile, undoName) {
  const undo = undoName ? `app.beginUndoGroup(${JSON.stringify('Claude: ' + undoName)});` : '';
  const undoEnd = undoName ? 'app.endUndoGroup();' : '';
  return `(function () {
${PRELUDE}
var __args = ${JSON.stringify(args ?? {})};
var __res;
${undo}
try { __res = {ok: true, result: (function (args) {
${body}
})(__args)}; }
catch (e) { __res = {ok: false, error: String(e), line: e.line}; }
${undoEnd}
var __f = new File(${JSON.stringify(outFile)});
__f.encoding = 'UTF-8'; __f.open('w'); __f.write(__json(__res)); __f.close();
})();
`;
}

let cachedApp = null;
export function findAppName() {
  if (process.env.AE_APP_NAME) return process.env.AE_APP_NAME;
  if (cachedApp) return cachedApp;
  const dirs = fs.existsSync('/Applications') ? fs.readdirSync('/Applications') : [];
  const found = dirs.map((d) => /^Adobe After Effects( (?:20\d\d|CC 20\d\d|\(Beta\)))?$/.exec(d)).filter(Boolean).map((m) => m[0]).sort().reverse();
  if (!found.length) throw new Error('Adobe After Effects was not found in /Applications. Set AE_APP_NAME to the app name, e.g. "Adobe After Effects 2025".');
  cachedApp = found[0];
  return cachedApp;
}

function osascript(lines) {
  return new Promise((resolve, reject) => {
    execFile('osascript', lines.flatMap((l) => ['-e', l]), {timeout: (TIMEOUT_S + 30) * 1000, maxBuffer: 16 << 20}, (err, stdout, stderr) => {
      if (err) reject(new Error((stderr || err.message).trim()));
      else resolve(stdout.trim());
    });
  });
}

/** Run an ExtendScript body inside After Effects. The body sees `args` and its return value comes back as JSON. */
export async function runInAE(body, args = {}, undoName) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ae-mcp-'));
  const jsx = path.join(dir, 'task.jsx');
  const out = path.join(dir, 'result.json');
  fs.writeFileSync(jsx, buildScript(body, args, out, undoName), 'utf8');
  try {
    if (DRY) return {dryRun: true, script: fs.readFileSync(jsx, 'utf8')};
    if (process.platform !== 'darwin') throw new Error('This server drives After Effects through AppleScript and only runs on macOS.');
    const appName = findAppName();
    await osascript([
      `with timeout of ${TIMEOUT_S} seconds`,
      `tell application ${JSON.stringify(appName)} to DoScript "$.evalFile(new File(\\"${jsx}\\"))"`,
      'end timeout',
    ]);
    if (!fs.existsSync(out)) {
      throw new Error('After Effects ran the script but wrote no result. Turn on Settings > Scripting & Expressions > "Allow Scripts to Write Files and Access Network" in After Effects, then try again.');
    }
    const res = JSON.parse(fs.readFileSync(out, 'utf8'));
    if (!res.ok) throw new Error(`ExtendScript error${res.line ? ` (line ${res.line})` : ''}: ${res.error}`);
    return res.result;
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
}
