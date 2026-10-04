import { z } from "zod";
import { SCENES, SCENE_TYPES, type SceneType } from "../scenes";

/** films/<slug>/video.json → meta */
export const Meta = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  width: z.literal(1920).default(1920),
  height: z.literal(1080).default(1080),
  fps: z.literal(30).default(30),
  /** Seconds of picture before the voice starts in each scene. */
  lead: z.number().min(0).max(1.5).default(0.5),
  /** Seconds of picture after the voice ends in each scene. */
  tail: z.number().min(0).max(2).default(0.55),
  captions: z.boolean().default(true),
  captionScript: z.literal("roman").default("roman"),
  channelName: z.string().min(1),
  voice: z.object({
    /** manual = supplied audio (voice/master.* split, or audio/<id>.wav); elevenlabs = tts step */
    engine: z.enum(["manual", "elevenlabs"]),
    source: z.string().optional(),
    voiceId: z.string().optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  }),
  /** Voice-only respellings (tts step), e.g. { "Byju's": "Baijooz" }. */
  pronounce: z.record(z.string(), z.string()).default({}),
  music: z.object({ file: z.string(), gainDb: z.number().max(0).default(-24) }).optional(),
});
export type MetaT = z.infer<typeof Meta>;

export const SFX_NAMES = ["tick", "swipe", "hit", "logo"] as const;

const Sfx = z
  .object({
    name: z.enum(SFX_NAMES),
    /** Fire on this spoken word/phrase (first match in narration order)… */
    onWord: z.string().optional(),
    /** …or at this many seconds after the scene starts (frame 0). */
    at: z.number().min(0).optional(),
    /** Linear gain, capped at 0.6. */
    gain: z.number().min(0).max(0.6).default(0.5),
  })
  .refine((s) => (s.onWord === undefined) !== (s.at === undefined), { message: "sfx needs exactly one of onWord / at" });

const Base = z.object({
  id: z.string().regex(/^s\d{3}$/, "ids are s + 3 digits, in tens: s010, s020 (s015 to insert)"),
  narration: z.string().min(1),
  /** Caption text override (Roman). Default: narration. */
  captions: z.string().optional(),
  theme: z.enum(["paper", "ink"]).default("paper"),
  /** Per-scene tail override (seconds after the voice). plan may still extend it for the hold rule. */
  tail: z.number().min(0).max(4).optional(),
  /** Saffron wipe at the start (act change). */
  wipeIn: z.boolean().default(false),
  chapter: z.string().max(60).optional(),
  /** Anchor name → spoken word/phrase (or list, for multi-part scenes). Names are per scene type. */
  anchor: z.record(z.string(), z.union([z.string(), z.array(z.string())])).default({}),
  sfx: z.array(Sfx).default([]),
});

const variants = SCENE_TYPES.map((t) => Base.extend({ type: z.literal(t), data: SCENES[t].schema }));
export const Scene = z.discriminatedUnion("type", variants as unknown as [typeof variants[0], ...typeof variants]);
export type SceneT = z.infer<typeof Base> & { type: SceneType; data: any };

export const Video = z.object({ meta: Meta, scenes: z.array(Scene).min(1) });
export type VideoT = { meta: MetaT; scenes: SceneT[] };
