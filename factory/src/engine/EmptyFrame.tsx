import React from "react";
import { AbsoluteFill } from "remotion";
import "../brand/fonts";
import { captionsBand, colors, safe, themes, type ThemeMode } from "../brand/tokens";

/** Stage-2 check frame: theme background only, optional safe-area guides (debug, never in films). */
export const EmptyFrame: React.FC<{ theme: ThemeMode; guides?: boolean }> = ({ theme, guides }) => (
  <AbsoluteFill style={{ backgroundColor: themes[theme].bg }}>
    {guides ? (
      <>
        <div
          style={{
            position: "absolute",
            left: safe.left,
            top: safe.top,
            width: safe.right - safe.left,
            height: safe.bottom - safe.top,
            border: `2px dashed ${themes[theme].muted}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: safe.left,
            top: captionsBand.top,
            width: safe.right - safe.left,
            height: captionsBand.bottom - captionsBand.top,
            border: `2px dashed ${colors.saffron}`,
          }}
        />
      </>
    ) : null}
  </AbsoluteFill>
);
