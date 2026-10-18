// The anchor words of the brief and what should be on screen at each, as frames (word start + 5): npx tsx scripts/anchors.ts > build/anchors.json
import { CUE } from "../src/cues";
import { w } from "../src/anchors";

type A = [scene: string, label: string, t: number, expect: string];
const a: A[] = [
  ["S1", "Ek", w(0, "ek").start, "prompt card 'Same prompt' rises"], ["S1", "prompt", w(0, "prompt").start, "card, cursor"],
  ["S1", "Claude", w(1, "claude").start, "card to chip; both tracks appear"], ["S1", "laga", w(1, "laga").start, "bars start filling"], ["S1", "ghanta", w(1, "ghanta").start, "Claude timer climbing"], ["S1", "minute", w(1, "minute").start, "Claude still crawling"],
  ["S1", "Gemini", w(2, "gemini").start, "Gemini bar ~half"], ["S1", "ko", w(2, "ko").start, "Gemini bar near the end"],
  ["S1", "sirf", w(3, "sirf").start, "bars about to land"], ["S1", "chaar", w(3, "chaar").start, "Gemini snaps to 100 %, check, 4m 20s; Claude bar still crawling"], ["S1", "minute (2)", w(3, "minute").start, "Gemini done; Claude timer rolling fast"], ["S1", "land", CUE.s1.land + 0.05, "Claude timer landed on 1h 53m"],
  ["S2", "Kharcha", w(4, "kharcha").start, "bars morph into receipts"], ["S2", "Claude", w(5, "claude").start, "Claude receipt, odometer starts"], ["S2", "teis", w(5, "teis").start, "$23.. rolling"], ["S2", "dollar", w(5, "dollar").start, "$23.46"],
  ["S2", "Gemini", w(6, "gemini").start, "Gemini odometer starts"], ["S2", "saadhe", w(6, "saadhe").start, "$3.. rolling"], ["S2", "dollar (2)", w(6, "dollar").start, "$3.40"],
  ["S3", "Matlab", w(7, "matlab").start, "receipts slide apart"], ["S3", "Gemini", w(7, "gemini").start, "apart, shrinking"], ["S3", "chhabbees", w(7, "chhabbees").start, "26× builds"], ["S3", "guna", w(7, "guna").start, "26× rolling"], ["S3", "tez", w(7, "tez").start, "26× faster"],
  ["S3", "aur", w(8, "aur").start, "26× holds"], ["S3", "saat", w(8, "saat").start, "26× moves left; ~7× builds"], ["S3", "sasta", w(8, "sasta").start, "~7× cheaper"],
  ["S4", "Lekin", w(9, "lekin").start, "canvas dims; S3 dissolves"], ["S4", "twist", w(9, "twist").start, "THE TWIST"], ["S4", "creator", w(10, "creator").start, "creator's verdict"], ["S4", "detail", w(11, "detail").start, "headline 'Detail me'"], ["S4", "Claude", w(11, "claude").start, "'Claude'"], ["S4", "ab", w(11, "ab").start, "chips stagger in"], ["S4", "aage", w(11, "aage").start, "'aage'"],
  ["S5", "Toh", w(12, "toh").start, "decision card"], ["S5", "Jaldi", w(13, "jaldi").start, "Fast draft"], ["S5", "kam", w(13, "kam").start, "Low budget"], ["S5", "Gemini", w(14, "gemini").start, "ring on Gemini"], ["S5", "Har", w(15, "har").start, "Every frame perfect"], ["S5", "Claude", w(16, "claude").start, "ring on Claude"],
  ["S6", "Smart", w(17, "smart").start, "columns merge to a flow line"], ["S6", "dono", w(17, "dono").start, "'Use both.', arrow draws"], ["S6", "Gemini", w(18, "gemini").start, "Draft → Gemini highlights"], ["S6", "Claude", w(19, "claude").start, "Final → Claude highlights"],
  ["S7", "Par", w(20, "par").start, "S6 dissolves"], ["S7", "ek", w(20, "ek").start, "n = 1"], ["S7", "Apna", w(21, "apna").start, "n = 1 chip; headline 'Apna'"], ["S7", "karo", w(21, "karo").start, "'ka karo.'"],
  ["S7", "Same", w(22, "same").start, "chip Same prompt"], ["S7", "ek", w(22, "ek").start, "chip 1 try"], ["S7", "teen", w(22, "teen").start, "chip 3 scores"], ["S7", "detail", w(22, "detail").start, "Detail card"], ["S7", "time", w(22, "time").start, "Time card"], ["S7", "cost", w(22, "cost").start, "Cost card"],
  ["S8", "Fair", w(23, "fair").start, "headline 'Fair'"], ["S8", "poora", w(23, "poora").start, "'poora'"], ["S8", "prompt", w(23, "prompt").start, "'prompt?'"], ["S8", "Comment", w(24, "comment").start, "Comment karo"], ["S8", "PROMPT", w(24, "prompt").start, "PROMPT pill pulses in"],
];
console.log(JSON.stringify(a.map(([scene, label, t, expect]) => ({ scene, label, t: +t.toFixed(3), frame: Math.round(t * 30) + 5, expect }))));
