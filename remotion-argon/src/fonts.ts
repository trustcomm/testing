// Inter / Inter Display (SIL OFL, bundled in public/fonts; Inter stands in for SF Pro, whose files are not used),
// Playfair Display Italic 800 for the serif accent, JetBrains Mono for the terminal. The render waits for all of them.
import { continueRender, delayRender, staticFile } from "remotion";

const FACES: [string, string, string, FontFaceDescriptors][] = [
  ["Inter Display", "InterDisplay-Bold.otf", "otf", { weight: "700" }],
  ["Inter Display", "InterDisplay-SemiBold.otf", "otf", { weight: "600" }],
  ["Inter", "Inter-Medium.otf", "otf", { weight: "500" }],
  ["Inter", "Inter-SemiBold.otf", "otf", { weight: "600" }],
  ["Inter", "Inter-Bold.otf", "otf", { weight: "700" }],
  ["Playfair Display", "playfair-display-latin-800-italic.woff2", "woff2", { weight: "800", style: "italic" }],
  ["JetBrains Mono", "jetbrains-mono-latin-500-normal.woff2", "woff2", { weight: "500" }],
  ["JetBrains Mono", "jetbrains-mono-latin-700-normal.woff2", "woff2", { weight: "700" }],
];
if (typeof document !== "undefined") {
  const handle = delayRender("fonts");
  Promise.all(FACES.map(([family, file, , d]) => new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, d).load().then((f) => (document.fonts as unknown as { add(f: FontFace): void }).add(f))))
    .then(() => continueRender(handle));
}
