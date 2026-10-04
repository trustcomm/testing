import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/**
 * Bundled fonts only (all SIL OFL); nothing is fetched from Google at render time.
 * Variable files cover every weight; Remotion waits for them before rendering a frame.
 */
export const FONT_FILES = [
  "fonts/AnekLatin.woff2",
  "fonts/AnekDevanagari-latin.woff2",
  "fonts/AnekDevanagari-devanagari.woff2",
  "fonts/Inter.woff2",
] as const;

const DEVANAGARI_RANGE = "U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FF";
const W = "100 900";

export const fontsReady = Promise.all([
  loadFont({ family: "Anek Latin", url: staticFile(FONT_FILES[0]), weight: W }),
  loadFont({ family: "Anek Devanagari", url: staticFile(FONT_FILES[1]), weight: W }),
  loadFont({ family: "Anek Devanagari", url: staticFile(FONT_FILES[2]), weight: W, unicodeRange: DEVANAGARI_RANGE }),
  loadFont({ family: "Inter", url: staticFile(FONT_FILES[3]), weight: W }),
]);
