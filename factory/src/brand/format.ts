/**
 * The ONE number formatter. Indian digit grouping (1,80,000) everywhere a number is shown.
 */

/** Indian grouping: last 3 digits, then groups of 2. Handles negatives and decimals. */
export const groupIndian = (n: number, decimals = 0): string => {
  const neg = n < 0;
  const [int, frac] = Math.abs(n).toFixed(decimals).split(".");
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return (neg ? "-" : "") + grouped + (frac ? "." + frac : "");
};

/** Trim trailing ".0" so 22.0 → "22" but 1.2 stays "1.2". */
const trimDec = (s: string) => s.replace(/\.0+$/, "");

export type NumberFormat =
  | "count" // 1,80,000
  | "pct" // 42%
  | "inr" // ₹1,80,000
  | "inrLakh" // ₹4.5 lakh
  | "inrCrore" // ₹1,200 crore
  | "inrLakhCrore" // ₹1.8 lakh crore
  | "usd" // $1,80,000 (grouped Indian style)
  | "usdMillion" // $250M
  | "usdBillion"; // $22B

export type FormatOptions = {
  /** Decimal places (default: 0, or 1 for lakh/crore/billion when the value isn't whole). */
  decimals?: number;
  /** Prefix "~" (e.g. "~$0" for an approximate write-down). */
  approx?: boolean;
  /** "short" ($22B) or "long" ($22 billion). Default "short" for $ units; ₹ units always use words. */
  style?: "short" | "long";
};

const autoDecimals = (v: number, fmt: NumberFormat) =>
  ["inrLakh", "inrCrore", "inrLakhCrore", "usdMillion", "usdBillion"].includes(fmt) && !Number.isInteger(v) ? 1 : 0;

/** Format a value (already in the unit's scale, e.g. 22 for $22 billion). */
export const formatValue = (value: number, fmt: NumberFormat, opts: FormatOptions = {}): string => {
  const d = opts.decimals ?? autoDecimals(value, fmt);
  const n = trimDec(groupIndian(value, d));
  const long = opts.style === "long";
  const out = (() => {
    switch (fmt) {
      case "count":
        return n;
      case "pct":
        return `${n}%`;
      case "inr":
        return `₹${n}`;
      case "inrLakh":
        return `₹${n} lakh`;
      case "inrCrore":
        return `₹${n} crore`;
      case "inrLakhCrore":
        return `₹${n} lakh crore`;
      case "usd":
        return `$${n}`;
      case "usdMillion":
        return long ? `$${n} million` : value === 0 ? "$0" : `$${n}M`;
      case "usdBillion":
        // a zero has no scale: "$0", not "$0B"
        return long ? `$${n} billion` : value === 0 ? "$0" : `$${n}B`;
    }
  })();
  return (opts.approx ? "~" : "") + out;
};

/** Helpers named in the brief. */
export const inrCrore = (v: number, o?: FormatOptions) => formatValue(v, "inrCrore", o);
export const inrLakhCrore = (v: number, o?: FormatOptions) => formatValue(v, "inrLakhCrore", o);
export const usdBillion = (v: number, o?: FormatOptions) => formatValue(v, "usdBillion", o);
