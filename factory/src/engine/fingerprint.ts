import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Scene fingerprint (sha256, first 12 hex chars). Node-only (used by scripts/render.ts).
 *
 * HASHED:
 *   - scene: type, theme, wipeIn, data, anchor, captions override   (pixels)
 *   - frames, word timings (text + start/end, rounded to 1 ms)      (duration + captions + anchors)
 *   - prevTheme (the wipe starts on the previous scene's bg)
 *   - meta that affects pixels: width, height, fps, captions, channelName
 *   - render variant: draft | final (size + encoder settings)
 *   - files: src/scenes/<type>.tsx (ONLY this scene type)
 *            + shared pixel files: every file in src/engine/ and src/brand/ (scene frame/fades/wipe,
 *              captions, ui, fit, pace, icons, tokens.ts, format.ts, motion.ts, fonts.ts)
 *            + every bundled font in public/fonts/
 *   - remotion version
 * NOT HASHED: start position in the film, sfx, narration text (it reaches pixels only via the word
 * timings), other scene type files, scripts.
 */
export const SHARED_DIRS = ["src/engine", "src/brand", "public/fonts"];

const fileHash = (root: string, rel: string) => createHash("sha256").update(readFileSync(path.join(root, rel))).digest("hex");

export const sharedFiles = (root: string) =>
  SHARED_DIRS.flatMap((d) =>
    readdirSync(path.join(root, d))
      .filter((f) => !f.startsWith("."))
      .sort()
      .map((f) => `${d}/${f}`),
  );

export const fingerprint = (
  root: string,
  input: {
    scene: { type: string; theme: string; wipeIn: boolean; data: unknown; anchor: unknown; captions?: string };
    frames: number;
    words: { text: string; start: number; end: number }[];
    prevTheme: string;
    meta: { width: number; height: number; fps: number; captions: boolean; channelName: string };
    variant: "draft" | "final";
    remotionVersion: string;
  },
) => {
  const files = [`src/scenes/${input.scene.type}.tsx`, ...sharedFiles(root)];
  const payload = {
    scene: { type: input.scene.type, theme: input.scene.theme, wipeIn: input.scene.wipeIn, data: input.scene.data, anchor: input.scene.anchor, captions: input.scene.captions ?? null },
    frames: input.frames,
    words: input.words.map((w) => [w.text, Math.round(w.start * 1000), Math.round(w.end * 1000)]),
    prevTheme: input.prevTheme,
    meta: input.meta,
    variant: input.variant,
    remotion: input.remotionVersion,
    files: Object.fromEntries(files.map((f) => [f, fileHash(root, f)])),
  };
  return { hash: createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 12), files };
};
