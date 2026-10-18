import React from "react";
import { Img, OffthreadVideo, staticFile } from "remotion";
import { C, FONT, FPS } from "../theme";
import { CUE } from "../cues";
import { At, Enter } from "../motion";
import { Glass } from "../components/glass";
import { Cloud, Train, Camera } from "./icons";
import { SERIF } from "./text";
import broll from "../broll.json";

const CHIPS = [
  { slug: "clouds", label: "Volumetric clouds", Icon: Cloud },
  { slug: "locomotive", label: "Locomotive mechanics", Icon: Train },
  { slug: "camera", label: "Camera work", Icon: Camera },
] as const;

/** 4. The twist: the canvas dims slightly (see Argon.tsx), a short hold, then "Detail me Claude aage" and three detail chips. */
export const Twist: React.FC = () => {
  const c = CUE.s4;
  const word = (text: string, at: number, color: string) => <Enter at={at} dy={30} blur={10}><span style={{ color }}>{text}</span></Enter>;
  return (
    <>
      <At x={540} y={336}><Enter at={c.kicker}><div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 34, letterSpacing: "0.34em", color: C.accent, paddingLeft: "0.34em" }}>THE TWIST</div></Enter></At>
      <At x={540} y={426}><Enter at={c.creator}><div style={{ fontFamily: FONT.ui, fontWeight: 500, fontSize: 44, color: C.secondary, whiteSpace: "nowrap" }}>The creator’s verdict</div></Enter></At>
      <At x={540} y={650} style={{ width: 980, textAlign: "center", ...SERIF, color: C.text, fontSize: 158 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.2em" }}>{word("Detail", c.detail, C.text)}{word("me", c.me, C.text)}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.2em", marginTop: 6 }}>{word("Claude", c.claude, C.accent)}{word("aage", c.aage, C.accent)}</div>
      </At>
      {CHIPS.map(({ slug, label, Icon }, i) => {
        const media = (broll as Record<string, string>)[slug];
        return (
          <At key={slug} x={540} y={960 + i * 124}>
            <Enter at={c.chips + (i * 6) / FPS} dy={28}>
              <Glass w={640} h={104} r={52}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 22, padding: "0 30px 0 14px" }}>
                  {media ? (
                    <div style={{ width: 76, height: 76, borderRadius: 38, overflow: "hidden", flexShrink: 0 }}>
                      {/\.(mp4|webm)$/i.test(media) ? <OffthreadVideo src={staticFile(media)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Img src={staticFile(media)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                  ) : (
                    <div style={{ width: 76, height: 76, borderRadius: 38, background: "rgba(0,113,227,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={40} /></div>
                  )}
                  <div style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 44, color: C.text, whiteSpace: "nowrap" }}>{label}</div>
                </div>
              </Glass>
            </Enter>
          </At>
        );
      })}
    </>
  );
};
