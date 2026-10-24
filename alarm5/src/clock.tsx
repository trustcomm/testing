// One clock for everything: the composition's frame. Elements read their time from here (never useCurrentFrame) so a scene can be shown on its own clock if needed.
import React, { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";
import { FPS } from "./theme";

const ClockContext = createContext<number | null>(null);
export const ClockProvider: React.FC<{ frame: number; children: React.ReactNode }> = ({ frame, children }) => <ClockContext.Provider value={frame}>{children}</ClockContext.Provider>;
export const useFrame = () => { const o = useContext(ClockContext); const f = useCurrentFrame(); return o ?? f; };
export const useT = () => useFrame() / FPS;
