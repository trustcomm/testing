import video from "../../films/byjus-demo/video.json";
import type { SceneT } from "../engine/manifest";

/**
 * Demo fixtures for the Stage-3 contact sheet ONLY. Byju's scenes come straight from video.json;
 * types the film doesn't use get obviously-placeholder content ("DEMO", "Company A") — not data.
 */
const byjus = Object.fromEntries((video.scenes as unknown as SceneT[]).map((s) => [s.id, s]));
const demo = (s: Partial<SceneT> & Pick<SceneT, "id" | "type" | "narration" | "data">): SceneT =>
  ({ theme: "paper", wipeIn: false, anchor: {}, sfx: [], ...s }) as SceneT;

export const DEMOS: { name: string; scene: SceneT; seconds: number }[] = [
  { name: "title", seconds: 5, scene: demo({ id: "s900", type: "title", narration: "Yeh ek demo title scene hai, sirf layout dikhane ke liye.", data: { kicker: "Demo episode", title: "How a company A story is told", subtitle: "Placeholder subtitle for layout testing", wordmark: "COMPANY A" } }) },
  { name: "stat (s010, up)", seconds: 6, scene: byjus.s010 },
  { name: "stat (s020, down)", seconds: 6, scene: byjus.s020 },
  { name: "bars", seconds: 6, scene: demo({ id: "s901", type: "bars", narration: "Demo bars: pehla, doosra, teesra aur chautha placeholder value.", data: { title: "DEMO — placeholder values", format: "inrCrore", items: [{ label: "Item A", value: 120 }, { label: "Item B", value: 340, semantic: "growth" }, { label: "Item C", value: 90, semantic: "loss" }, { label: "Item D", value: 210, semantic: "muted" }] } }) },
  { name: "timeline", seconds: 6, scene: demo({ id: "s902", type: "timeline", narration: "Demo timeline: pehla event, phir doosra event, aur aakhri event.", data: { years: [2018, 2019, 2020, 2021, 2022, 2023, 2024], events: [{ year: 2019, text: "DEMO event one" }, { year: 2021, text: "DEMO event two" }, { year: 2023, text: "DEMO event three" }] } }) },
  { name: "moneyMap", seconds: 6, scene: demo({ id: "s903", type: "moneyMap", narration: "Demo money map: paisa investor se company tak, phir company se bank tak.", data: { nodes: [{ id: "a", label: "Investor A" }, { id: "b", label: "Company A" }, { id: "c", label: "Bank A" }], flows: [{ from: "a", to: "b", amount: 100, format: "usdMillion" }, { from: "b", to: "c", label: "DEMO loan", semantic: "loss" }] } }) },
  { name: "versus", seconds: 6, scene: demo({ id: "s904", type: "versus", narration: "Demo versus: ek taraf company A, doosri taraf company B.", data: { metric: "DEMO metric", left: { name: "COMPANY A", value: 50, format: "inrCrore", caption: "Placeholder caption" }, right: { name: "COMPANY B", value: 80, format: "inrCrore", caption: "Placeholder caption" } } }) },
  { name: "xray", seconds: 6, scene: demo({ id: "s905", type: "xray", narration: "Demo x-ray: revenue, cost, loss aur profit ke placeholder hisse.", data: { entity: "COMPANY A", format: "inrCrore", segments: [{ label: "Revenue part", value: 50, kind: "revenue" }, { label: "Cost part", value: 30, kind: "cost" }, { label: "Loss part", value: 15, kind: "loss" }, { label: "Profit part", value: 5, kind: "profit" }], total: { label: "DEMO total", value: 100 } } }) },
  { name: "reasons (s030)", seconds: 9, scene: byjus.s030 },
  { name: "founder", seconds: 6, scene: demo({ id: "s906", type: "founder", narration: "Demo founder card: naam, role aur saal, sab placeholder.", data: { name: "Founder Name", role: "Founder & CEO (DEMO)", years: "2011 – 2024" } }) },
  { name: "verdict (s040)", seconds: 4, scene: byjus.s040 },
  { name: "outro (s050)", seconds: 5, scene: byjus.s050 },
];
