import React from "react";
import { C, FONT } from "../theme";
import { clamp01, useT } from "./motion";

export const PHONE_W = 330, PHONE_H = 650;

/** A phone: dark bezel, notch, a screen that clips its children. */
export const Phone: React.FC<{ w?: number; h?: number; radius?: number; children?: React.ReactNode; glow?: boolean }> = ({ w = PHONE_W, h = PHONE_H, radius = 54, children, glow = true }) => (
  <div style={{ position: "relative", width: w, height: h, borderRadius: radius, background: "#05050A", border: "8px solid #272734", boxShadow: glow ? `0 0 90px ${C.accent}55, 0 30px 80px rgba(0,0,0,0.6)` : "0 30px 80px rgba(0,0,0,0.6)", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: radius - 8, overflow: "hidden" }}>{children}</div>
    <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", width: 92, height: 26, borderRadius: 14, background: "#000", zIndex: 5 }} />
  </div>
);

/** The reel playing inside the phone: an animated gradient placeholder with a progress bar and reel UI. */
export const ReelScreen: React.FC<{ seed?: number }> = ({ seed = 0 }) => {
  const t = useT();
  const a = 130 + 40 * Math.sin(t * 0.9 + seed), b = 20 * t + seed * 40;
  return (
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${a}deg, #2B1A8F 0%, ${C.accent} 45%, #C06BFF 80%, #FF6FA8 100%)` }}>
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", filter: "blur(36px)", opacity: 0.55, background: k === 1 ? "#FF6FA8" : "#6FD0FF", left: 40 + 120 * Math.sin(t * (0.7 + k * 0.3) + k * 2 + seed) + b * 0, top: 160 + 190 * Math.cos(t * (0.6 + k * 0.25) + k * 1.7) }} />
      ))}
      <div style={{ position: "absolute", left: 18, bottom: 54, right: 90, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ width: 150, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.85)" }} />
        <div style={{ width: 210, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.5)" }} />
      </div>
      <div style={{ position: "absolute", right: 14, bottom: 70, display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
        {[0, 1, 2].map((k) => <div key={k} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.8)" }} />)}
      </div>
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 22, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.3)" }}>
        <div style={{ width: `${((t * 14) % 100)}%`, height: "100%", borderRadius: 3, background: "#fff" }} />
      </div>
    </div>
  );
};

/** An Instagram-style profile with a bio line that types out (`typed` of `bio.length` characters shown). */
export const ProfileScreen: React.FC<{ bio: string; typed: number; caret: boolean }> = ({ bio, typed, caret }) => (
  <div style={{ position: "absolute", inset: 0, background: "#0E0E14", padding: "58px 20px 0", fontFamily: FONT, color: C.text }}>
    <div style={{ textAlign: "center", fontWeight: 800, fontSize: 24, marginBottom: 18 }}>baqur.ai</div>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ width: 92, height: 92, borderRadius: "50%", padding: 4, background: `conic-gradient(${C.accent}, #FF6FA8, ${C.accent})`, flexShrink: 0 }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#1B1B27", border: "4px solid #0E0E14", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 36, color: C.accent }}>B</div>
      </div>
      <div style={{ display: "flex", gap: 14, flex: 1, justifyContent: "space-around" }}>
        {["Posts", "Followers", "Following"].map((l) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div style={{ width: 38, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.35)", margin: "0 auto 8px" }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: C.dim }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ marginTop: 22, fontWeight: 800, fontSize: 18 }}>Baqur · AI motion</div>
    <div style={{ marginTop: 6, fontWeight: 600, fontSize: 25, lineHeight: 1.28, minHeight: 66 }}>
      {bio.slice(0, typed)}<span style={{ display: "inline-block", width: 3, height: 26, marginLeft: 2, verticalAlign: "-4px", background: C.accent, opacity: caret ? 1 : 0 }} />
    </div>
    <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
      <div style={{ flex: 1, height: 40, borderRadius: 10, background: C.accent }} />
      <div style={{ flex: 1, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.14)" }} />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginTop: 22 }}>
      {Array.from({ length: 6 }, (_, k) => <div key={k} style={{ aspectRatio: "1", background: `hsl(${255 + k * 14} 60% ${22 + k * 3}%)` }} />)}
    </div>
  </div>
);
