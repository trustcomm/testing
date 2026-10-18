// B-roll slots: drop public/broll/clouds.(jpg|png|mp4), locomotive.*, camera.* and run `node scripts/scan-broll.mjs`; the twist scene
// (scene 4) then shows each as a thumbnail on its chip. With no files the chips use their icons and the scene is complete as is.
import { readdirSync, writeFileSync } from "node:fs";
const files = readdirSync("public/broll");
const out = {};
for (const slug of ["clouds", "locomotive", "camera"]) { const f = files.find((x) => new RegExp(`^${slug}\\.(jpg|jpeg|png|webp|mp4|webm)$`, "i").test(x)); if (f) out[slug] = `broll/${f}`; }
writeFileSync("src/broll.json", JSON.stringify(out, null, 1));
console.log("b-roll found:", Object.keys(out).join(", ") || "none");
