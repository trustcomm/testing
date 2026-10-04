import { formatValue, groupIndian, inrCrore, inrLakhCrore, usdBillion } from "../src/brand/format";

const cases: [string, string][] = [
  [groupIndian(180000), "1,80,000"],
  [groupIndian(1234567), "12,34,567"],
  [groupIndian(999), "999"],
  [groupIndian(-1234567.5, 1), "-12,34,567.5"],
  [inrCrore(1200), "₹1,200 crore"],
  [inrLakhCrore(1.8), "₹1.8 lakh crore"],
  [usdBillion(22), "$22B"],
  [usdBillion(22, { style: "long" }), "$22 billion"],
  [usdBillion(1.2), "$1.2B"],
  [usdBillion(0, { approx: true }), "~$0"],
  [formatValue(42, "pct"), "42%"],
  [formatValue(180000, "inr"), "₹1,80,000"],
];
let fail = 0;
for (const [got, want] of cases) {
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${JSON.stringify(got)}${ok ? "" : `  (want ${JSON.stringify(want)})`}`);
}
console.log(`${cases.length - fail}/${cases.length} passed`);
process.exit(fail ? 1 : 0);
