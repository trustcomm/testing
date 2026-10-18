import React from "react";

/** A continuous-corner (squircle) path: a superellipse corner, exponent n = 5. */
export function squircle(w: number, h: number, r: number, n = 5): string {
  r = Math.min(r, w / 2, h / 2);
  const pts: [number, number][] = [], N = 16;
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= N; i++) { const th = a0 + (i / N) * (Math.PI / 2), c = Math.cos(th), s = Math.sin(th); pts.push([cx + r * Math.sign(c) * Math.abs(c) ** (2 / n), cy + r * Math.sign(s) * Math.abs(s) ** (2 / n)]); }
  };
  corner(w - r, r, -Math.PI / 2); corner(w - r, h - r, 0); corner(r, h - r, Math.PI / 2); corner(r, r, Math.PI);
  return "M" + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L") + "Z";
}

export const SHADOW = "0 2px 6px rgba(0,0,0,0.04), 0 24px 60px rgba(0,0,0,0.08)";

/**
 * A frosted-glass surface: white 72 % with a 30 px backdrop blur, a 1 px white inner border, a 36 px squircle and the layered
 * soft shadow. The shadow is its own sibling (box-shadow is not drawn under a transparent box), so the glass keeps its backdrop.
 */
export const Glass: React.FC<{ w: number; h: number; r?: number; dark?: boolean; shadow?: boolean; tint?: string; style?: React.CSSProperties; children?: React.ReactNode }> = ({ w, h, r = 36, dark = false, shadow = true, tint, style, children }) => {
  const p = squircle(w, h, r), pin = squircle(w - 1, h - 1, r - 0.5);
  return (
    <div style={{ position: "relative", width: w, height: h, ...style }}>
      {shadow && <div style={{ position: "absolute", inset: 0, borderRadius: r * 0.78, boxShadow: SHADOW }} />}
      <div style={{ position: "absolute", inset: 0, clipPath: `path('${p}')`, background: tint ?? (dark ? "rgba(44,44,46,0.72)" : "rgba(255,255,255,0.72)"), backdropFilter: "blur(30px) saturate(1.5)", WebkitBackdropFilter: "blur(30px) saturate(1.5)" }}>{children}</div>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}><path d={pin} transform="translate(0.5 0.5)" fill="none" stroke={dark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.95)"} strokeWidth={1} /></svg>
    </div>
  );
};
