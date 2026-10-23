// Inter / Inter Display / JetBrains Mono / Instrument Serif Italic (all SIL OFL), bundled in public/fonts. The render waits for all of them.
import { continueRender, delayRender, staticFile } from "remotion";

const FACES: [string, string, FontFaceDescriptors][] = [
  ["Inter Display", "InterDisplay-Bold.otf", { weight: "700" }],
  ["Inter", "Inter-Medium.otf", { weight: "500" }],
  ["Inter", "Inter-SemiBold.otf", { weight: "600" }],
  ["Inter", "Inter-Bold.otf", { weight: "700" }],
  ["JetBrains Mono", "jetbrains-mono-latin-500-normal.woff2", { weight: "500" }],
  ["JetBrains Mono", "jetbrains-mono-latin-700-normal.woff2", { weight: "700" }],
  ["Instrument Serif", "instrument-serif-latin-400-italic.woff2", { weight: "400", style: "italic" }],
];
if (typeof document !== "undefined") {
  const handle = delayRender("fonts");
  Promise.all(FACES.map(([family, file, d]) => new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, d).load().then((f) => (document.fonts as unknown as { add(f: FontFace): void }).add(f))))
    .then(() => continueRender(handle));
}
