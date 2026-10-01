import { getStaticFiles, staticFile } from "remotion";
import { loadFont as loadLocal } from "@remotion/fonts";
import { loadFont as loadAnekLatin } from "@remotion/google-fonts/AnekLatin";
import { loadFont as loadAnekDevanagari } from "@remotion/google-fonts/AnekDevanagari";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

/**
 * Brand fonts: Anek Latin + Anek Devanagari (headlines/body) and Inter (numbers).
 *
 * If the vendored copies exist in public/fonts/ they are used (offline-safe, identical files
 * from Google Fonts). Otherwise fonts load from Google Fonts via @remotion/google-fonts.
 * Remotion waits for every font before rendering a frame.
 */
const DEVANAGARI_RANGE = "U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FF";

const vendored = getStaticFiles().some((f) => f.name === "fonts/AnekLatin.woff2");

if (vendored) {
  const w = "100 900"; // variable fonts cover every weight
  loadLocal({ family: "Anek Latin", url: staticFile("fonts/AnekLatin.woff2"), weight: w });
  loadLocal({ family: "Anek Devanagari", url: staticFile("fonts/AnekDevanagari-latin.woff2"), weight: w });
  loadLocal({
    family: "Anek Devanagari",
    url: staticFile("fonts/AnekDevanagari-devanagari.woff2"),
    weight: w,
    unicodeRange: DEVANAGARI_RANGE,
  });
  loadLocal({ family: "Inter", url: staticFile("fonts/Inter.woff2"), weight: w });
} else {
  loadAnekLatin("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });
  loadAnekDevanagari("normal", { weights: ["500", "700", "800"], subsets: ["devanagari", "latin"] });
  loadInter("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });
}
