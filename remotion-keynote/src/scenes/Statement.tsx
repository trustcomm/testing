import React from "react";
import { C, FONT } from "../theme";
import { CUE } from "../cues";
import { At, Enter } from "../motion";
import { Sparkle, Swoosh } from "../components/bits";
import { HEAD, SERIF } from "./text";

/** 6. Back on the light canvas: the statement, slower and quieter. One sparkle, one swoosh (under "zaroor"). */
export const Statement: React.FC = () => {
  const c = CUE.s6;
  const line = (words: [string, number][], style: React.CSSProperties, gap = "0.24em") => (
    <div style={{ display: "flex", justifyContent: "center", gap, whiteSpace: "nowrap", ...style }}>
      {words.map(([wd, at], i) => <Enter key={i} at={at} dy={28} blur={10}>{wd}</Enter>)}
    </div>
  );
  return (
    <>
      <At x={540} y={488} style={{ width: 960, textAlign: "center" }}>
        {line([["Designers", c.designers]], { ...HEAD, fontSize: 124 })}
        {line([["khatam", c.khatam], ["nahi", c.nahi]], { ...HEAD, fontSize: 124 })}
        {line([["honge.", c.honge]], { ...HEAD, fontSize: 124 })}
      </At>
      <At x={540} y={826} style={{ width: 960, textAlign: "center" }}>
        {line([["Jo", c.jo], ["AI", c.ai], ["nahi", c.nahiSeekh]], { ...SERIF, fontSize: 128 })}
        {line([["seekhenge…", c.seekhenge]], { ...SERIF, fontSize: 128 })}
      </At>
      <At x={540} y={1114} style={{ width: 960 }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: "0.3em", whiteSpace: "nowrap", fontFamily: FONT.ui, fontWeight: 600, fontSize: 60, color: C.secondary }}>
          <Enter at={c.woh} dy={20} blur={8}>woh</Enter>
          <div style={{ position: "relative" }}>
            <Enter at={c.zaroor} dy={20} blur={8}><span style={{ ...SERIF, fontSize: 84 }}>zaroor</span></Enter>
            <div style={{ position: "absolute", left: -4, top: 80 }}><Swoosh at={c.zaroor} w={250} h={30} width={8} seconds={0.45} variant={1} /></div>
          </div>
          <Enter at={c.ho} dy={20} blur={8}>ho</Enter><Enter at={c.jayenge} dy={20} blur={8}>jayenge.</Enter>
        </div>
      </At>
      <Sparkle x={860} y={640} size={52} at={c.zaroor} phase={0.6} />
    </>
  );
};
