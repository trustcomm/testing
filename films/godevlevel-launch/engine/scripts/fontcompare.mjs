// Beat 4 hold frame rendered in each candidate display face → out/font-compare/*.png
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { openEngine, pngOf, ROOT } from "./engine.mjs";
const dir = path.join(ROOT, "out", "font-compare");
mkdirSync(dir, { recursive: true });
const { page, errors, close } = await openEngine();
for (const fam of ["Inter Tight", "Archivo"]) {
  const { png } = await page.evaluate((fam) => (window.GDL.setDisplay(fam), window.GDL.frame(237)), fam);
  writeFileSync(path.join(dir, `${fam.replace(" ", "")}.png`), pngOf(png));
  console.log("rendered", fam);
}
if (errors.length) console.log(errors);
await close();
