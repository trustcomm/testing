// The anchor words of the brief and what should be on screen at each, as frames (word start + 5): npx tsx scripts/anchors.ts > build/anchors.json
import { CUE, KEYS, SCENES, sceneStart } from "../src/cues";
import { w } from "../src/anchors";

type A = [scene: string, label: string, t: number, expect: string];
const a: A[] = [
  ["S1", "Motion", w(0, "motion").start, "headline 'Motion' rises"], ["S1", "designer", w(0, "designer").start, "'designer'"], ["S1", "ek", w(0, "ek").start, "'ek project' serif italic blue"],
  ["S1", "Pachaas", w(1, "pachaas").start, "invoice rises, counter starts"], ["S1", "hazaar", w(1, "hazaar").start, "counter rolling"], ["S1", "rupaye", w(1, "rupaye").start, "total 50,000, swoosh draws"], ["S1", "tak", w(1, "tak").start, "*up to"],
  ["S2", "Claude", w(2, "claude").start, "invoice slides left, shrinks; card rises"], ["S2", "Pro", w(2, "pro").start, "'Claude Pro'"], ["S2", "Do", w(3, "do").start, "price counter starts"], ["S2", "rupaye", w(3, "rupaye").start, "₹2,000 / month, Claude Code included"],
  ["S2", "poore", w(4, "poore").start, "ring starts"], ["S2", "mahine", w(4, "mahine").start, "ring mid-circle"], ["S2", "ke", w(4, "ke").start, "ring closing"],
  ["S3", "Calculator", w(5, "calculator").start, "cards blur out, calculator springs in"], ["S3", "Pachaas (5)", KEYS[0].t, "key 5 down"], ["S3", "hazaar", KEYS[3].t, "key 0 down (50,00..)"],
  ["S3", "divided", KEYS[5].t, "key ÷ down"], ["S3", "do", KEYS[6].t, "key 2 down"], ["S3", "hazaar (2)", KEYS[8].t, "key 0 down (2,0..)"], ["S3", "= (pause)", KEYS[10].t, "key = down"],
  ["S3", "pacchees", CUE.s3.result, "display morphs to 25, blue glow"], ["S3", "Pacchees mahine", CUE.s3.grid, "calculator morphs to tiles, wave flip"], ["S3", "mahine", w(8, "mahine").start, "tiles flipping"], ["S3", "Do saal", CUE.s3.saal[0], "'2+ saal'"], ["S3", "zyada", CUE.s3.saal[2], "two sparkles"],
  ["S4", "Aur", w(10, "aur").start, "canvas easing to black"], ["S4", "haan", w(10, "haan").start, "black, silent"], ["S4", "one", w(11, "one").start, "'One' fading in"], ["S4", "more", w(11, "more").start, "'One more'"], ["S4", "thing", w(11, "thing").start, "'One more thing.'"],
  ["S5", "Yeh", w(12, "yeh").start, "terminal scales up from black"], ["S5", "poora", w(12, "poora").start, "typing"], ["S5", "video", w(12, "video").start, "typing"], ["S5", "Kisi", w(13, "kisi").start, "prompt typed, composing"], ["S5", "designer", w(13, "designer").start, "chip 'Designer'"], ["S5", "nahi", w(13, "nahi").start, "strikethrough draws"], ["S5", "banaya", w(13, "banaya").start, "struck"],
  ["S5", "Claude", w(14, "claude").start, "render bar starts"], ["S5", "Code", w(14, "code").start, "bar filling"], ["S5", "banaya (2)", w(14, "banaya").start, "bar nearly 100 %"], ["S5", "sirf", w(15, "sirf").start, "✓ Rendered reel.mp4"], ["S5", "ek", w(15, "ek").start, "pull-back begins"], ["S5", "prompt", w(15, "prompt").start, "PiP plays scene 1"], ["S5", "se", w(15, "se").start, "PiP, pulled back"],
  ["S6", "Designers", w(16, "designers").start, "light canvas, 'Designers'"], ["S6", "khatam", w(16, "khatam").start, "'khatam nahi'"], ["S6", "honge", w(16, "honge").start, "'honge.'"], ["S6", "Jo", w(17, "jo").start, "serif 'Jo AI nahi'"], ["S6", "seekhenge", w(17, "seekhenge").start, "'seekhenge…'"], ["S6", "woh", w(18, "woh").start, "'woh'"], ["S6", "zaroor", w(18, "zaroor").start, "swoosh under zaroor"], ["S6", "jayenge", w(18, "jayenge").start, "full statement"],
  ["S7", "Prompt", w(19, "prompt").start, "MOTION pill rises"], ["S7", "chahiye", w(19, "chahiye").start, "pill pulsing"], ["S7", "Comment", w(20, "comment").start, "'Comment karo' above"], ["S7", "karo", w(20, "karo").start, "'karo'"], ["S7", "MOTION", w(20, "motion").start, "pill pulse + DMs line + handle"],
];
void SCENES; void sceneStart;
console.log(JSON.stringify(a.map(([scene, label, t, expect]) => ({ scene, label, t: +t.toFixed(3), frame: Math.round(t * 30) + 5, expect }))));
