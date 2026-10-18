# align.raw.json (forced alignment) + the display script -> src/timings.json.
# Refinement against the actual audio, 10 ms steps: a phrase boundary snaps to the real silence between the two words (the
# aligner smears it by up to ~100 ms); a boundary inside a phrase snaps to the energy valley within +-50 ms if there is a clear one.
# The raw aligner times stay in the file as alignStart / alignEnd.
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
al = json.load(open(os.path.join(ROOT, "scripts/align.raw.json")))
W = al["words"]
# display text, one entry per aligned word, in order; scene S1..S7 and the sentence each word is in
DISPLAY = [
 ("S1", "Ek hi prompt."), ("S1", "Claude ko laga ek ghanta tirpan minute."), ("S1", "Google ke naye Gemini Argon ko..."), ("S1", "sirf chaar minute."),
 ("S2", "Kharcha?"), ("S2", "Claude, teis dollar."), ("S2", "Gemini, sirf saadhe teen dollar."),
 ("S3", "Matlab Gemini chhabbees guna tez..."), ("S3", "aur lagbhag saat guna sasta."),
 ("S4", "Lekin twist yeh hai."), ("S4", "Test karne wale creator ne kaha..."), ("S4", "detail me Claude ab bhi aage hai."),
 ("S5", "Toh kaunsa use karein?"), ("S5", "Jaldi draft, kam budget?"), ("S5", "Gemini."), ("S5", "Har frame perfect chahiye?"), ("S5", "Claude."),
 ("S6", "Smart log dono use karte hain."), ("S6", "Gemini se draft."), ("S6", "Claude se final."),
 ("S7", "Par yeh sirf ek test hai."), ("S7", "Apna khud ka karo."), ("S7", "Same prompt, ek try, aur teen cheezein score karo: detail, time, cost."),
 ("S8", "Fair test ka poora prompt chahiye?"), ("S8", "Comment karo PROMPT."),
]
words, sent = [], []
for si, (scene, text) in enumerate(DISPLAY):
    for tok in text.split():
        words.append({"text": tok, "scene": scene, "sentence": si}); 
assert len(words) == len(W), (len(words), len(W))
for w, a in zip(words, W):
    bare = "".join(ch for ch in w["text"].lower() if ch.isalnum())
    assert bare == a["word"], (bare, a["word"])
    w["bare"] = bare; w["alignStart"] = a["start"]; w["alignEnd"] = a["end"]

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(ROOT, "public/vo.mp3"), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
db = np.array([10 * np.log10(np.mean(x[i:i + 160] ** 2) + 1e-12) for i in range(0, len(x) - 160, 160)])
SIL = -45.0
quiet = db < SIL
silences = []                                   # (start, end) in seconds, >= 50 ms
i = 0
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]: j += 1
        if j - i >= 9: silences.append((i / 100, j / 100))
        i = j
    else: i += 1

changed = []
starts = [w["alignStart"] for w in words]; ends = [w["alignEnd"] for w in words]
pinned = [False] * len(words)               # word k starts at the edge of a real pause
# each silence belongs to ONE boundary: the aligner boundary nearest its centre (a short word between two boundaries must not claim the same pause twice)
bounds = {k: (ends[k - 1] + starts[k]) / 2 for k in range(1, len(words))}
owner = {}
for si, sl in enumerate(silences):
    c = (sl[0] + sl[1]) / 2
    k = min(bounds, key=lambda k: abs(bounds[k] - c))
    if sl[0] - 0.12 <= bounds[k] <= sl[1] + 0.12: owner.setdefault(k, []).append(si)
for k in range(1, len(words)):
    b = bounds[k]
    if k in owner:                               # a real silence next to the boundary: the words end and start at its edges
        sl = silences[min(owner[k], key=lambda si: abs((silences[si][0] + silences[si][1]) / 2 - b))]
        ends[k - 1], starts[k] = sl[0], sl[1]; pinned[k] = True
    else:                                        # inside a phrase: the deepest valley within +-50 ms, if it is a real dip
        lo, hi = int((b - 0.05) * 100), int((b + 0.05) * 100) + 1
        seg = db[lo:hi]; v = lo + int(np.argmin(seg))
        side = max(db[max(0, v - 8):v - 2].max(initial=-99), db[v + 3:v + 9].max(initial=-99))
        if side - db[v] >= 4.0: ends[k - 1] = starts[k] = v / 100
        else: ends[k - 1] = starts[k] = b
# A word that starts with a plosive or affricate (p b t d k c j) in the middle of a phrase is *heard* at its burst, which follows
# a closure (a dip of 30-120 ms). The aligner puts the start at the end of the previous word, 50-160 ms early. Snap the start
# to the burst (the level rising 12 dB out of the dip) and the previous word's end to the start of the dip.
PLOSIVE = set("pbtdkcjg")
def closures(lo, hi):
    """local minima of the level in [lo, hi) (frames) that are real closures: 12 dB below the speech on both sides"""
    out = []
    for m in range(lo + 1, hi - 1):
        if db[m] <= db[m - 1] and db[m] <= db[m + 1]:
            left = db[max(0, m - 10):m - 1].max(initial=-99); right = db[m + 2:m + 11].max(initial=-99)
            if min(left, right) - db[m] >= 12: out.append(m)
    return out
for k in range(1, len(words)):
    if pinned[k] or words[k]["bare"][0] not in PLOSIVE: continue
    b = starts[k]
    cs = closures(int((b - 0.15) * 100), int((b + 0.15) * 100) + 1)
    if not cs: continue
    m = min(cs, key=lambda c: abs(c / 100 - b))             # the closure nearest the aligner's boundary, not the deepest
    peak = db[m + 1:m + 9].max()
    burst = m
    while burst < len(db) - 1 and db[burst] < (db[m] + peak) / 2: burst += 1
    dip = m
    while dip > 1 and db[dip - 1] < db[dip] + 0.5 and db[dip - 1] < peak - 8: dip -= 1
    nxt = starts[k + 1] if k + 1 < len(words) else burst / 100 + 1
    if burst / 100 - starts[k - 1] < 0.10 or nxt - burst / 100 < 0.10: continue    # the words would be too short: not this closure
    starts[k] = burst / 100; ends[k - 1] = min(dip / 100, starts[k])
# the very first and last word: the speech edges
first_loud = int(np.argmax(db > SIL)) / 100; last_loud = (len(db) - int(np.argmax(db[::-1] > SIL))) / 100
starts[0] = max(0.0, min(first_loud, starts[0] if starts[0] > 0 else first_loud)); ends[-1] = last_loud
# sanity: every word has a positive length and starts after the previous one; if a refinement broke that, fall back to the aligner's times for that word
for k in range(len(words)):
    if ends[k] < starts[k] + 0.04 or (k and starts[k] < starts[k - 1] + 0.04):
        starts[k], ends[k] = words[k]["alignStart"], words[k]["alignEnd"]
        if k: ends[k - 1] = min(ends[k - 1], starts[k])
for k in range(len(words)):
    assert ends[k] >= starts[k] + 0.04 and (k == 0 or starts[k] >= starts[k - 1] + 0.04), (k, words[k]["text"], starts[k], ends[k])
for k, w in enumerate(words):
    w["start"], w["end"] = round(starts[k], 3), round(ends[k], 3)
    if abs(w["start"] - w["alignStart"]) > 0.03 or abs(w["end"] - w["alignEnd"]) > 0.03:
        changed.append(f"{w['text']:12} {w['alignStart']:.2f}-{w['alignEnd']:.2f} -> {w['start']:.2f}-{w['end']:.2f}")
    w["i"] = k
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(ROOT, "public/vo.mp3")], capture_output=True, text=True).stdout)
out = {"audioDuration": dur, "method": "forced alignment of the supplied script (pocketsphinx), refined against the speech envelope; see scripts/timings.py", "words": words}
json.dump(out, open(os.path.join(ROOT, "src/timings.json"), "w"), indent=1, ensure_ascii=False)
print(f"{len(words)} words, audio {dur:.3f} s; refined {len(changed)} of {len(words)} words by more than 30 ms:")
print("\n".join(changed))
