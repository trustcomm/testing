import type React from "react";
import { C, FONT } from "../theme";

/** Headline: Inter Display 700, tracking -0.03em, tight leading 0.95. */
export const HEAD: React.CSSProperties = { fontFamily: FONT.display, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 0.95, color: C.text };
/** The accent: an elegant bold serif italic in Apple blue. */
export const SERIF: React.CSSProperties = { fontFamily: FONT.serif, fontStyle: "italic", fontWeight: 800, color: C.accent, letterSpacing: "-0.01em", lineHeight: 0.95 };
export const UI: React.CSSProperties = { fontFamily: FONT.ui, color: C.text };
