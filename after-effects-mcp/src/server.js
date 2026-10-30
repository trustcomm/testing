#!/usr/bin/env node
// MCP server for Adobe After Effects (macOS). Each tool is a small ExtendScript body run by ./ae.js.
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {runInAE} from './ae.js';

const server = new McpServer({name: 'after-effects', version: '1.0.0'});

const compRef = z.string().optional().describe('Composition name. Omit to use the active composition.');
const layerRef = z.union([z.string(), z.number().int()]).describe('Layer name, or 1-based layer index');
const color = z.union([z.string().regex(/^#?[0-9a-fA-F]{6}$/), z.array(z.number()).length(3)]).describe('Hex like "#ff3b30" or [r,g,b] in 0..1');
const vec = z.array(z.number()).min(1).max(3);
const value = z.union([z.number(), z.string(), z.boolean(), z.array(z.number())]);

function tool(name, description, shape, body, undo) {
  server.registerTool(name, {description, inputSchema: shape}, async (args) => {
    try {
      const result = await runInAE(body, args, undo ? name : undefined);
      return {content: [{type: 'text', text: JSON.stringify(result ?? null, null, 2)}]};
    } catch (e) {
      return {isError: true, content: [{type: 'text', text: String(e.message || e)}]};
    }
  });
}

tool('ae_status', 'Check the connection: After Effects version, open project, active item and every composition.', {}, `
  var comps = [];
  for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem) comps.push(it.name); }
  return {version: app.version, project: app.project.file ? app.project.file.fsName : '(unsaved)', activeItem: app.project.activeItem ? app.project.activeItem.name : null, compositions: comps};
`);

tool('run_extendscript', 'Run arbitrary ExtendScript (ES3 JavaScript) inside After Effects for anything the other tools do not cover. The code is a function body: `return` a JSON-able value. Helpers in scope: findComp(name), findLayer(comp, nameOrIndex), findProp(layer, "Transform/Position"), toColor("#hex"), layerInfo(layer). Changes are one undo step.', {
  code: z.string().describe('Function body, e.g. "var c = findComp(\\"Main\\"); return c.numLayers;"'),
}, `return eval('(function(){' + args.code + '\\n})()');`, true);

tool('list_compositions', 'List every composition in the project with its size, duration, frame rate and layer count.', {}, `
  var out = [];
  for (var i = 1; i <= app.project.numItems; i++) {
    var c = app.project.item(i);
    if (c instanceof CompItem) out.push({name: c.name, id: c.id, width: c.width, height: c.height, duration: c.duration, fps: c.frameRate, layers: c.numLayers});
  }
  return out;
`);

tool('get_composition', 'Describe one composition and all of its layers.', {comp: compRef}, `
  var c = findComp(args.comp), layers = [];
  for (var i = 1; i <= c.numLayers; i++) layers.push(layerInfo(c.layer(i)));
  return {name: c.name, width: c.width, height: c.height, duration: c.duration, fps: c.frameRate, bgColor: c.bgColor, workArea: [c.workAreaStart, c.workAreaDuration], layers: layers};
`);

tool('create_composition', 'Create a new composition and open it in the viewer.', {
  name: z.string(),
  width: z.number().int().default(1920),
  height: z.number().int().default(1080),
  duration: z.number().positive().default(10).describe('Seconds'),
  fps: z.number().positive().default(30),
  bgColor: color.optional(),
}, `
  var c = app.project.items.addComp(args.name, args.width, args.height, 1, args.duration, args.fps);
  if (args.bgColor) c.bgColor = toColor(args.bgColor);
  c.openInViewer();
  return {name: c.name, id: c.id};
`, true);

tool('add_text_layer', 'Add a text layer.', {
  comp: compRef,
  text: z.string(),
  fontSize: z.number().positive().default(80),
  font: z.string().optional().describe('PostScript font name, e.g. "Inter-Bold"'),
  color: color.default('#ffffff'),
  position: vec.optional().describe('[x, y] in comp pixels; default is the centre'),
  justify: z.enum(['left', 'center', 'right']).default('center'),
  start: z.number().optional().describe('In-point in seconds'),
  duration: z.number().positive().optional().describe('Seconds'),
  name: z.string().optional(),
}, `
  var c = findComp(args.comp), l = c.layers.addText(args.text);
  var p = l.property('ADBE Text Properties').property('ADBE Text Document'), td = p.value;
  td.resetCharStyle(); td.fontSize = args.fontSize; td.fillColor = toColor(args.color); td.applyFill = true;
  if (args.font) td.font = args.font;
  td.justification = {left: ParagraphJustification.LEFT_JUSTIFY, center: ParagraphJustification.CENTER_JUSTIFY, right: ParagraphJustification.RIGHT_JUSTIFY}[args.justify];
  p.setValue(td);
  if (args.position) l.property('ADBE Transform Group').property('ADBE Position').setValue(args.position);
  if (args.start !== undefined) l.startTime = args.start;
  if (args.duration) l.outPoint = l.inPoint + args.duration;
  if (args.name) l.name = args.name;
  return layerInfo(l);
`, true);

tool('add_solid_layer', 'Add a solid colour layer (full comp size unless width/height are given).', {
  comp: compRef,
  name: z.string().default('Solid'),
  color: color.default('#000000'),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
}, `
  var c = findComp(args.comp);
  var l = c.layers.addSolid(toColor(args.color), args.name, args.width || c.width, args.height || c.height, 1, c.duration);
  return layerInfo(l);
`, true);

tool('add_shape_layer', 'Add a shape layer with one rectangle or ellipse, filled and/or stroked.', {
  comp: compRef,
  shape: z.enum(['rectangle', 'ellipse']),
  size: z.array(z.number()).length(2).describe('[width, height]'),
  position: vec.optional(),
  fill: color.optional(),
  stroke: color.optional(),
  strokeWidth: z.number().default(4),
  roundness: z.number().default(0).describe('Rectangle corner radius'),
  name: z.string().optional(),
}, `
  var c = findComp(args.comp), l = c.layers.addShape();
  if (args.name) l.name = args.name;
  var g = l.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group'), v = g.property('ADBE Vectors Group');
  var s = v.addProperty(args.shape === 'rectangle' ? 'ADBE Vector Shape - Rect' : 'ADBE Vector Shape - Ellipse');
  s.property(args.shape === 'rectangle' ? 'ADBE Vector Rect Size' : 'ADBE Vector Ellipse Size').setValue(args.size);
  if (args.shape === 'rectangle' && args.roundness) s.property('ADBE Vector Rect Roundness').setValue(args.roundness);
  if (args.stroke) { var st = v.addProperty('ADBE Vector Graphic - Stroke'); st.property('ADBE Vector Stroke Color').setValue(toColor(args.stroke)); st.property('ADBE Vector Stroke Width').setValue(args.strokeWidth); }
  if (args.fill || !args.stroke) v.addProperty('ADBE Vector Graphic - Fill').property('ADBE Vector Fill Color').setValue(toColor(args.fill || '#ffffff'));
  if (args.position) l.property('ADBE Transform Group').property('ADBE Position').setValue(args.position);
  return layerInfo(l);
`, true);

tool('set_property', 'Set a static value on a layer property, e.g. "Position" [960,540], "Opacity" 50, "Scale" [120,120], "Rotation" 15, "Source Text" "Hello", "Effects/Gaussian Blur/Blurriness" 20. Removes existing keyframes on that property.', {
  comp: compRef, layer: layerRef,
  property: z.string().describe('Property name or path separated by "/"'),
  value,
}, `
  var l = findLayer(findComp(args.comp), args.layer), p = findProp(l, args.property);
  while (p.numKeys > 0) p.removeKey(1);
  p.setValue(toValue(p, args.value));
  return {layer: l.name, property: p.name, value: String(p.value)};
`, true);

tool('set_keyframes', 'Animate a layer property with keyframes. Times are seconds from the comp start.', {
  comp: compRef, layer: layerRef,
  property: z.string(),
  keyframes: z.array(z.object({time: z.number(), value})).min(1),
  easing: z.enum(['linear', 'ease', 'easeIn', 'easeOut', 'hold']).default('ease'),
  influence: z.number().min(0.1).max(100).default(75).describe('Ease influence %'),
  replace: z.boolean().default(true).describe('Remove existing keyframes first'),
}, `
  var l = findLayer(findComp(args.comp), args.layer), p = findProp(l, args.property);
  if (args.replace) while (p.numKeys > 0) p.removeKey(1);
  var keys = [];
  for (var i = 0; i < args.keyframes.length; i++) keys.push(p.addKey(args.keyframes[i].time));
  for (i = 0; i < keys.length; i++) p.setValueAtKey(keys[i], toValue(p, args.keyframes[i].value));
  var vt = p.propertyValueType, dims = (vt === PropertyValueType.TwoD) ? 2 : (vt === PropertyValueType.ThreeD) ? 3 : 1;
  for (i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (args.easing === 'hold') { p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD); continue; }
    if (args.easing === 'linear') { p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR); continue; }
    var easeIn = (args.easing === 'ease' || args.easing === 'easeIn'), easeOut = (args.easing === 'ease' || args.easing === 'easeOut');
    var inArr = [], outArr = [];
    for (var d = 0; d < dims; d++) { inArr.push(new KeyframeEase(0, easeIn ? args.influence : 0.1)); outArr.push(new KeyframeEase(0, easeOut ? args.influence : 0.1)); }
    try { p.setTemporalEaseAtKey(k, inArr, outArr); } catch (e) {}
  }
  return {layer: l.name, property: p.name, keys: p.numKeys};
`, true);

tool('set_expression', 'Set (or clear with an empty string) an expression on a layer property, e.g. "wiggle(2, 30)".', {
  comp: compRef, layer: layerRef, property: z.string(), expression: z.string(),
}, `
  var l = findLayer(findComp(args.comp), args.layer), p = findProp(l, args.property);
  p.expression = args.expression;
  return {layer: l.name, property: p.name, enabled: p.expressionEnabled, error: p.expressionError || null};
`, true);

tool('apply_effect', 'Apply an effect to a layer by display name ("Gaussian Blur") or match name ("ADBE Gaussian Blur 2"), optionally setting its parameters by name.', {
  comp: compRef, layer: layerRef,
  effect: z.string(),
  properties: z.record(z.string(), value).optional().describe('e.g. {"Blurriness": 20, "Repeat Edge Pixels": true}'),
}, `
  var l = findLayer(findComp(args.comp), args.layer), fx = l.property('ADBE Effect Parade');
  if (!fx.canAddProperty(args.effect)) throw new Error('Unknown effect or cannot be applied to this layer: ' + args.effect);
  var e = fx.addProperty(args.effect), set = [];
  if (args.properties) for (var k in args.properties) {
    var p = e.property(k); if (!p) throw new Error('Effect "' + e.name + '" has no parameter "' + k + '"');
    var v = args.properties[k]; if (typeof v === 'boolean') v = v ? 1 : 0;
    p.setValue(toValue(p, v)); set.push(k);
  }
  return {layer: l.name, effect: e.name, matchName: e.matchName, index: e.propertyIndex, set: set};
`, true);

tool('import_file', 'Import footage, an image, audio or an .aep/.psd/.ai file into the project, optionally adding it to a composition.', {
  path: z.string().describe('Absolute path on this Mac'),
  addToComp: z.string().optional().describe('Composition name to add it to as a new layer'),
}, `
  var f = new File(args.path); if (!f.exists) throw new Error('File not found: ' + args.path);
  var item = app.project.importFile(new ImportOptions(f)), layer = null;
  if (args.addToComp) layer = layerInfo(findComp(args.addToComp).layers.add(item));
  return {item: item.name, id: item.id, layer: layer};
`, true);

tool('delete_layer', 'Delete a layer from a composition.', {comp: compRef, layer: layerRef}, `
  var l = findLayer(findComp(args.comp), args.layer), n = l.name; l.remove(); return {deleted: n};
`, true);

tool('render_composition', 'Render a composition through the Render Queue and wait for it to finish. Uses the default output module unless a template name is given (e.g. "H.264 - Match Render Settings - 15 Mbps" in AE 2023+).', {
  comp: compRef,
  outputPath: z.string().describe('Absolute output file path, e.g. /Users/me/Desktop/out.mov'),
  outputTemplate: z.string().optional(),
  renderTemplate: z.string().optional().describe('Render settings template, e.g. "Best Settings"'),
}, `
  var c = findComp(args.comp), rq = app.project.renderQueue, item = rq.items.add(c);
  if (args.renderTemplate) item.applyTemplate(args.renderTemplate);
  var om = item.outputModule(1);
  if (args.outputTemplate) om.applyTemplate(args.outputTemplate);
  om.file = new File(args.outputPath);
  for (var i = 1; i <= rq.numItems; i++) if (rq.item(i) !== item && rq.item(i).status === RQItemStatus.QUEUED) rq.item(i).render = false;
  rq.render();
  return {comp: c.name, output: om.file.fsName, status: String(item.status)};
`);

tool('save_project', 'Save the project, or save it to a new path (.aep).', {path: z.string().optional()}, `
  if (args.path) app.project.save(new File(args.path));
  else if (app.project.file) app.project.save();
  else throw new Error('Project has never been saved: give a path');
  return {saved: app.project.file.fsName};
`);

tool('open_project', 'Open an .aep project (the current project is closed without saving prompts only if it has no unsaved changes; otherwise AE asks).', {path: z.string()}, `
  var f = new File(args.path); if (!f.exists) throw new Error('File not found: ' + args.path);
  app.open(f); return {opened: app.project.file.fsName};
`);

await server.connect(new StdioServerTransport());
