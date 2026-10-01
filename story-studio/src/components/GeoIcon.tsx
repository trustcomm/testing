import React from "react";

/** Flat geometric icons built only from rectangles, circles and arrows. */
export type IconName = "blocks" | "steepArrow" | "weight" | "coin" | "fallingArrow" | "people";

export type GeoIconProps = {
  name: IconName;
  /** Fill colour (pass the role colour; usually the theme foreground). */
  color: string;
  /** Size of the square icon box in px. */
  size?: number;
  /** Optional short text drawn on the icon (used by "weight", e.g. "$1.2B"). */
  text?: string;
  /** Colour for `text` (usually the theme background). */
  textColor?: string;
};

export const GeoIcon: React.FC<GeoIconProps> = ({ name, color, size = 120, text, textColor }) => {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 120 120" style={{ display: "block" }}>
      {name === "blocks" && (
        <g fill={color}>
          <rect x="10" y="78" width="46" height="32" />
          <rect x="64" y="78" width="46" height="32" />
          <rect x="37" y="42" width="46" height="32" />
          <rect x="37" y="6" width="46" height="32" />
        </g>
      )}
      {name === "steepArrow" && (
        <g fill={color}>
          <rect x="8" y="108" width="104" height="6" />
          <polygon points="22,100 74,24 84,31 32,107" />
          <polygon points="60,14 100,6 92,46" />
        </g>
      )}
      {name === "fallingArrow" && (
        <g fill={color}>
          <rect x="8" y="108" width="104" height="6" />
          <polygon points="22,14 74,78 64,85 12,21" />
          <polygon points="88,60 96,100 56,92" />
        </g>
      )}
      {name === "weight" && (
        <g>
          <rect x="44" y="8" width="32" height="10" fill={color} />
          <rect x="52" y="14" width="16" height="16" fill={color} />
          <polygon points="26,30 94,30 112,112 8,112" fill={color} />
          {text && (
            <text
              x="60"
              y="84"
              textAnchor="middle"
              fontFamily='"Inter", sans-serif'
              fontWeight={800}
              fontSize="24"
              fill={textColor}
            >
              {text}
            </text>
          )}
        </g>
      )}
      {name === "coin" && (
        <g fill={color}>
          <circle cx="60" cy="60" r="50" />
        </g>
      )}
      {name === "people" && (
        <g fill={color}>
          <circle cx="38" cy="38" r="16" />
          <rect x="18" y="60" width="40" height="50" />
          <circle cx="84" cy="38" r="16" />
          <rect x="64" y="60" width="40" height="50" />
        </g>
      )}
    </svg>
  );
};
