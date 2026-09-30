#!/usr/bin/env python3
"""Build caption/beat timing for the Dots reel from the ElevenLabs VO.

No speech-recognition model is reachable in this environment, so alignment works like this:
  * Phrase boundaries come from measured silences in assets/audio/vo.mp3 (ffmpeg silencedetect),
    cross-checked with English keyword hits ("normal", "cloud computer", "tabs", "pro",
    "eligible markets", "password change", "DM") from pocketsphinx.
  * Inside each phrase, word times are spread by syllable weight (±~120 ms).
Outputs assets/timing.js (window.TIMING) and assets/vo_env.js (mouth-flap envelope, 30 fps).
"""
import json
import os
import re
import subprocess

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "assets", "audio", "vo.mp3")

# (start, end, beat, text) — measured speech segments, in VO order
PHRASES = [
    (0.10, 1.70, 1, "Laptop band kar diya…"),
    (2.35, 3.70, 1, "phir bhi kaam chal raha hai."),
    (4.13, 6.52, 1, "Ye hai ChatGPT ka naya Dots."),
    (6.76, 7.86, 2, "Normal ChatGPT?"),
    (8.19, 9.70, 2, "Tab band, kahani khatam."),
    (9.96, 13.74, 2, "Par Dot ko milta hai apna khud ka cloud computer aur browser."),
    (14.03, 14.66, 2, "Tum so jao —"),
    (14.92, 16.79, 2, "ye tumhare goal pe kaam karta rahega."),
    (17.07, 17.96, 3, "Slack mein bug aaya?"),
    (18.19, 19.34, 3, "Khud investigate karega."),
    (19.58, 21.77, 3, "Invoice bhejna bhool gaye? Bana ke rakhega —"),
    (21.99, 23.99, 3, "aur tumhare OK ke baad bhejega."),
    (24.25, 26.90, 3, "Aur woh 'baad mein padhunga' wale 47 tabs?"),
    (27.16, 27.64, 3, "Haha."),
    (27.92, 29.10, 3, "Ye sach mein padh lega."),
    (29.34, 31.50, 3, "4000 se zyada apps ke saath."),
    (32.49, 33.46, 4, "Ab bura news."),
    (33.82, 35.83, 4, "Free walon — aap club ke bahar ho."),
    (36.10, 39.14, 4, "Sirf Pro aur Business Premium ke liye, eligible markets mein."),
    (39.52, 39.84, 4, "India?"),
    (40.16, 41.06, 4, "Apna account check karo."),
    (41.44, 42.79, 4, "Aur rules tum banaoge —"),
    (43.07, 43.90, 4, "kya khud karega,"),
    (44.11, 45.38, 4, "kis pe permission maangega."),
    (46.12, 46.96, 4, "Password change?"),
    (47.24, 48.68, 4, "Woh aaj bhi tumhara kaam hai."),
    (49.04, 50.16, 5, "Meta ka Muse…"),
    (50.85, 52.28, 5, "ab OpenAI ka Dots."),
    (52.51, 53.80, 5, "Agent wars shuru."),
    (54.03, 55.14, 5, "Comment mein DOTS likho —"),
    (55.35, 56.87, 5, "setup notes DM mein bhejta hoon."),
    (57.15, 58.05, 5, "Aur follow karo…"),
    (58.37, 60.85, 5, "warna tum bhi tab band karke bhool jaoge."),
]

# Words the caption engine highlights in yellow (punch words)
PUNCH = {"band", "kaam", "dots.", "dots", "khatam.", "cloud", "computer", "browser.", "so", "bug", "investigate",
         "invoice", "ok", "47", "tabs?", "sach", "4000", "apps", "bura", "free", "bahar", "pro", "business",
         "premium", "india?", "check", "rules", "khud", "permission", "password", "change?", "tumhara", "muse…",
         "wars", "shuru.", "dots", "dm", "follow", "bhool"}


def syllables(w):
    w = w.lower()
    if re.fullmatch(r"[\d]+", w):
        return {"47": 4, "4000": 4}.get(w, 3)
    n = len(re.findall(r"[aeiouy]+", w))
    return max(1, n)


def words_for(start, end, text):
    ws = text.split()
    wt = np.array([syllables(re.sub(r"[^\w]", "", w) or w) for w in ws], float)
    span = end - start
    edges = start + np.concatenate([[0], np.cumsum(wt)]) / wt.sum() * span
    return [{"w": w, "t": round(float(edges[i]), 3), "e": round(float(edges[i + 1]), 3),
             "hi": re.sub(r"[\"'“”‘’,]", "", w.lower()) in PUNCH} for i, w in enumerate(ws)]


def chunks(words, max_words=4):
    """Group words into caption cards (≤4 words, break on punctuation)."""
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= max_words or re.search(r"[.?,—…]$", w["w"]):
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def envelope():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", VO, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(float) / 32768
    hop = 16000 // 30
    n = len(x) // hop
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    db = 20 * np.log10(rms + 1e-9)
    v = np.clip((db + 42) / 26, 0, 1)
    return [round(float(a), 2) for a in v]


def main():
    all_words, caps = [], []
    for s, e, beat, text in PHRASES:
        ws = words_for(s, e, text)
        all_words += ws
        for c in chunks(ws):
            caps.append({"t": c[0]["t"], "e": c[-1]["e"], "beat": beat, "words": c})
    # hold each caption until just before the next one (max +0.6 s)
    for i, c in enumerate(caps):
        nxt = caps[i + 1]["t"] if i + 1 < len(caps) else c["e"] + 0.6
        c["e"] = round(min(nxt - 0.02, c["e"] + 0.6), 3)
    timing = {"phrases": [{"t": s, "e": e, "beat": b, "text": t} for s, e, b, t in PHRASES], "captions": caps}
    with open(os.path.join(ROOT, "assets", "timing.js"), "w") as f:
        f.write("window.TIMING = " + json.dumps(timing, ensure_ascii=False) + ";\n")
    with open(os.path.join(ROOT, "assets", "vo_env.js"), "w") as f:
        f.write("window.VO_ENV = " + json.dumps(envelope()) + ";\n")
    print(len(caps), "caption cards,", len(all_words), "words")


if __name__ == "__main__":
    main()
