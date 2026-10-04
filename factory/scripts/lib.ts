import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Video, type VideoT } from "../src/engine/manifest";
import type { Word } from "../src/engine/types";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const filmDir = (slug: string) => path.join(ROOT, "films", slug);
export const buildDir = (slug: string) => path.join(filmDir(slug), "build");

export const loadVideo = (slug: string): VideoT => {
  const raw = JSON.parse(readFileSync(path.join(filmDir(slug), "video.json"), "utf8"));
  return Video.parse(raw) as unknown as VideoT;
};

export const probeDuration = (file: string) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }).trim());

/** Run ffmpeg; throw with its stderr tail on failure. */
export const ffmpeg = (args: string[]) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`ffmpeg failed (${r.status}):\n${String(r.stderr).split("\n").slice(-15).join("\n")}`);
  return String(r.stderr);
};

export const slugArg = () => {
  const s = process.argv.slice(2).find((a) => !a.startsWith("--"));
  if (!s) throw new Error("usage: <script> <slug> [flags]");
  if (!existsSync(filmDir(s))) throw new Error(`no film at films/${s}`);
  return s;
};

export type TimelineScene = {
  id: string;
  type: string;
  theme: "paper" | "ink";
  prevTheme: "paper" | "ink";
  start: number; // seconds in the film
  startFrame: number;
  frames: number;
  dur: number; // frames / fps
  lead: number;
  tail: number;
  tailExtended: boolean;
  voiceDur: number;
  audio: string; // relative to film dir
  words: Word[]; // scene-local seconds (lead included)
  alignMethod: string;
};
export type Timeline = { slug: string; fps: number; width: number; height: number; totalFrames: number; totalSec: number; scenes: TimelineScene[] };
