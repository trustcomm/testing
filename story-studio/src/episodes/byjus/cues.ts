import type { CueSpec } from "../../brand/timing";

/**
 * Cue map for the BYJU'S demo. Each cue = "show this on the frame the narrator says <match>".
 *
 * With public/vo-timestamps.json the regexes are matched against real word timings (in narration
 * order). Without it, `fallback` frames are used. These fallbacks were measured from the supplied
 * vo.mp3 (32.8 s): speech-segment boundaries from silence detection, cross-checked with English
 * keywords the recogniser caught ("billion" 3.4 s, "acquisitions" 16.0 s, "growth" 18.8 s,
 * "insolvency" 26.4 s, "frame by frame" 31.4 s). Regexes must not use the /g flag.
 */
export const byjusCueSpecs = {
  /** "BYJU'S" — wordmark enters. */
  wordmark: { match: /byju/, fallback: 46 },
  /** "…sabse valuable startup" — label. */
  label: { match: /valuable|sabse|सबसे/, fallback: 66 },
  /** "$22 billion" — counter + bar LAND on "billion" (24-frame count). */
  counterUp: { match: /billion|बिलियन/, fallback: 80, offset: -24 },
  /** Bad-news sentence starts — bar + counter turn crimson. */
  crimson: { match: /investor|निवेशक/, fallback: 259 },
  /** Value collapses to ~zero. */
  collapse: { match: /zero|shunya|शून्य|valuation|value/, fallback: 288 },
  /** "Teen galtiyan…" — S3 begins (S1/S2 clear). */
  reasons: { match: /teen|three|तीन|reason|wajah|galti/, fallback: 415 },
  /** Reason 1 — "acquisitions". */
  card1: { match: /acquisition|अधिग्रहण/, fallback: 466 },
  /** Reason 2 — "growth (at any cost)". */
  card2: { match: /growth|ग्रोथ/, fallback: 546 },
  /** Reason 3 — "$1.2B loan". */
  card3: { match: /loan|karz|कर्ज|लोन|1\.2/, fallback: 603 },
  /** "Insolvency" — the verdict word lands here. */
  verdict: { match: /insolven|इन्सॉल्वेंसी|दिवालिया/, fallback: 788 },
  /** "Poori kahani — frame by frame" — end card. */
  endLine: { match: /poori|puri|पूरी|kahani|कहानी/, fallback: 914 },
} satisfies Record<string, CueSpec>;

export type ByjusCues = Record<keyof typeof byjusCueSpecs, number>;
