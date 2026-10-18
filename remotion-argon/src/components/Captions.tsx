import React from "react";
import { C, CAPTION, FONT } from "../theme";
import { captionAt, groups } from "../captions";
import { Enter } from "../motion";
import { useT } from "../clock";

/** Inter 700, #1D1D1F on a frosted pill, the word being spoken in Apple blue.  */
export const Captions: React.FC = () => {
  const t = useT();
  const c = captionAt(t);
  if (!c) return null;
  const gi = groups.indexOf(c.group);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: CAPTION.centerY, display: "flex", justifyContent: "center", transform: "translateY(-50%)" }}>
      <Enter key={gi} at={c.group.show} dy={14} blur={4}>
        <div style={{ display: "flex", gap: "0 0.28em", padding: "20px 44px", borderRadius: 999, background: "rgba(255,255,255,0.78)", backdropFilter: "blur(30px) saturate(1.6)", WebkitBackdropFilter: "blur(30px) saturate(1.6)", border: "1px solid rgba(255,255,255,0.95)", boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 18px 44px rgba(0,0,0,0.12)", fontFamily: FONT.ui, fontWeight: 700, fontSize: 56, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          {c.group.words.map((wd, i) => <span key={i} style={{ color: i === c.current ? C.accent : C.text }}>{wd.text}</span>)}
        </div>
      </Enter>
    </div>
  );
};
