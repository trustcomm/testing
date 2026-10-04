/** Negative tests: each mutation must make validate fail with the expected message. */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lib";

const base = JSON.parse(readFileSync(path.join(ROOT, "films/byjus-demo/video.json"), "utf8"));
const dir = path.join(ROOT, "films/_vtest");
const cases: [string, (v: any) => void, RegExp, boolean][] = [
  ["digit in narration", (v) => (v.scenes[0].narration = "Saal 2022 mein Byju's ki value bahut zyada thi yaar."), /contains digits/, true],
  ["verdict 13 words", (v) => (v.scenes[3].narration = "Aur phir aakhir mein twenty twenty-four mein company ka haal ho gaya insolvency."), /words \(allowed 3–12\)/, true],
  ["ambiguous anchor", (v) => (v.scenes[0].anchor.counter = "twenty-two"), /occurs 2× — use a phrase/, true],
  ["occurrence index ok", (v) => (v.scenes[0].anchor.counter = "twenty-two#2"), /OK/, false],
  ["anchor not found", (v) => (v.scenes[1].anchor.counter = "crore"), /not found/, true],
  ["3 same type in a row", (v) => { v.scenes[2] = { ...v.scenes[1], id: "s030", chapter: undefined }; }, /3 'stat' scenes in a row/, true],
  ["duplicate id", (v) => (v.scenes[1].id = "s010"), /duplicate id/, true],
  ["unknown type", (v) => (v.scenes[4].type = "pie"), /schema/, true],
  ["bars ratio > 40", (v) => { v.scenes[2] = { id: "s030", type: "bars", narration: "Demo bars ke liye ek chhota sa test sentence yahan.", data: { format: "count", items: [{ label: "A", value: 1 }, { label: "B", value: 50 }] } }; }, /max\/min = 50.0 > 40/, true],
  ["sfx gain > 0.6", (v) => (v.scenes[3].sfx[1].gain = 0.9), /schema/, true],
];
mkdirSync(dir, { recursive: true });
let fail = 0;
for (const [name, mutate, expect, shouldFail] of cases) {
  const v = structuredClone(base);
  mutate(v);
  writeFileSync(path.join(dir, "video.json"), JSON.stringify(v));
  const r = spawnSync("npx", ["tsx", "scripts/validate.ts", "_vtest"], { cwd: ROOT, encoding: "utf8" });
  const out = r.stdout + r.stderr;
  const ok = (r.status !== 0) === shouldFail && expect.test(out);
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  (exit ${r.status})${ok ? "" : "\n" + out}`);
}
rmSync(dir, { recursive: true, force: true });
console.log(`${cases.length - fail}/${cases.length} validator tests passed`);
process.exit(fail ? 1 : 0);
