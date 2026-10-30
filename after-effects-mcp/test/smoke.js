// Smoke test without After Effects: AE_MCP_DRY_RUN=1 makes every tool return the ExtendScript it would run;
// each script is then syntax-checked as plain JavaScript (ExtendScript is an ES3 subset).
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import vm from 'node:vm';

const client = new Client({name: 'smoke', version: '1.0.0'});
await client.connect(new StdioClientTransport({command: 'node', args: ['src/server.js'], env: {...process.env, AE_MCP_DRY_RUN: '1'}}));
const {tools} = await client.listTools();
console.log(`${tools.length} tools: ${tools.map((t) => t.name).join(', ')}`);
const calls = {
  ae_status: {}, list_compositions: {}, get_composition: {comp: 'Main'},
  run_extendscript: {code: 'return app.project.numItems;'},
  create_composition: {name: 'Main', width: 1080, height: 1920, duration: 8, fps: 60, bgColor: '#0b0b0f'},
  add_text_layer: {comp: 'Main', text: 'Hello "AE"\nline 2', fontSize: 120, color: '#ff3b30', position: [540, 960]},
  add_solid_layer: {comp: 'Main', color: [0, 0, 0]},
  add_shape_layer: {comp: 'Main', shape: 'rectangle', size: [400, 200], fill: '#30d158', roundness: 24},
  set_property: {comp: 'Main', layer: 1, property: 'Opacity', value: 50},
  set_keyframes: {comp: 'Main', layer: 'Title', property: 'Position', keyframes: [{time: 0, value: [540, 2100]}, {time: 0.6, value: [540, 960]}]},
  set_expression: {layer: 1, property: 'Rotation', expression: 'wiggle(2, 5)'},
  apply_effect: {comp: 'Main', layer: 1, effect: 'Gaussian Blur', properties: {Blurriness: 20}},
  import_file: {path: '/Users/me/a.png', addToComp: 'Main'},
  delete_layer: {layer: 2},
  render_composition: {comp: 'Main', outputPath: '/Users/me/Desktop/out.mov'},
  save_project: {path: '/Users/me/p.aep'}, open_project: {path: '/Users/me/p.aep'},
};
let bad = 0;
for (const t of tools) {
  const args = calls[t.name];
  if (!args) { console.log('  ✗ no test call for', t.name); bad++; continue; }
  const r = await client.callTool({name: t.name, arguments: args});
  const text = r.content[0].text;
  if (r.isError) { console.log('  ✗', t.name, text); bad++; continue; }
  try { new vm.Script(JSON.parse(text).script); console.log('  ✓', t.name); }
  catch (e) { console.log('  ✗', t.name, 'syntax:', e.message); bad++; }
}
const invalid = await client.callTool({name: 'add_text_layer', arguments: {text: 'x', color: 'red'}});
console.log(invalid.isError ? '  ✓ bad colour rejected by the schema' : '  ✗ bad colour accepted'); if (!invalid.isError) bad++;
await client.close();
console.log(bad ? `FAIL (${bad})` : 'PASS');
process.exit(bad ? 1 : 0);
