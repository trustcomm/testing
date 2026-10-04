import type React from "react";
import type { z } from "zod";
import type { SceneProps } from "../engine/types";
import * as bars from "./bars";
import * as founder from "./founder";
import * as moneyMap from "./moneyMap";
import * as outro from "./outro";
import * as reasons from "./reasons";
import * as stat from "./stat";
import * as timeline from "./timeline";
import * as title from "./title";
import * as verdict from "./verdict";
import * as versus from "./versus";
import * as xray from "./xray";

type SceneModule = {
  schema: z.ZodTypeAny;
  anchorNames: readonly string[];
  Component: React.FC<SceneProps<any>>;
};

/** Scene registry: type name → module. The type name is also the file name (used by the fingerprint). */
export const SCENES = { title, stat, bars, timeline, moneyMap, versus, xray, reasons, founder, verdict, outro } satisfies Record<string, SceneModule>;
export type SceneType = keyof typeof SCENES;
export const SCENE_TYPES = Object.keys(SCENES) as SceneType[];
