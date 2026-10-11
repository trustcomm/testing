#!/usr/bin/env node
// Renders one representative frame of each world and saves 960×540 stills for the lockup's letter windows.
// Order = countdown order of the letters S H O W R E E L.
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TIMES = [1.25, 2.12, 5.05, 6.3, 8.6, 10.1, 12.2, 11.5];
const out = join(ROOT, "build/frames/stills");
mkdirSync(join(ROOT, "assets/stills"), { recursive: true });
execFileSync("node", [join(ROOT, "scripts/frames.mjs"), "--at", TIMES.join(","), "--out", "build/frames/stills", "--cols", "4", "--scale", "0.25"], { stdio: "inherit" });
execFileSync("python3", ["-I", "-c", `
import sys
from PIL import Image
times = ${JSON.stringify(TIMES)}
for i, t in enumerate(times, 1):
    im = Image.open("${out}/t%.3f.png" % t).convert("RGB").resize((960, 540), Image.LANCZOS)
    im.save("${ROOT}/assets/stills/s%d.jpg" % i, quality=90)
print("stills written")
`], { stdio: "inherit" });
