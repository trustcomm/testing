// Inter, bundled in public/fonts (Inter is under the SIL OFL). The render waits until every weight has loaded.
import { continueRender, delayRender, staticFile } from "remotion";

const FACES: [string, string][] = [["500", "Medium"], ["600", "SemiBold"], ["700", "Bold"], ["800", "ExtraBold"], ["900", "Black"]];
if (typeof document !== "undefined") {
  const handle = delayRender("fonts");
  Promise.all(FACES.map(([weight, file]) => new FontFace("Inter", `url(${staticFile(`fonts/Inter-${file}.otf`)})`, { weight }).load().then((f) => (document.fonts as unknown as { add(f: FontFace): void }).add(f))))
    .then(() => continueRender(handle))
    .catch((e) => { throw e; });
}
