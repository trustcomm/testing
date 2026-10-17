// One clock for everything. By default it is the composition's frame; the picture-in-picture copy of scene 1 inside the
// terminal (scene 5) runs on its own, starting at 0, so every element reads its time from here and never from useCurrentFrame.
import React, { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";
import { FPS } from "./theme";

const ClockContext = createContext<number | null>(null);
export const ClockProvider: React.FC<{ frame: number; children: React.ReactNode }> = ({ frame, children }) => <ClockContext.Provider value={frame}>{children}</ClockContext.Provider>;
export const useFrame = () => { const o = useContext(ClockContext); const f = useCurrentFrame(); return o ?? f; };
export const useT = () => useFrame() / FPS;
