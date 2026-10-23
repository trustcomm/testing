# align.raw.json (forced alignment, phrase by phrase) + the script -> src/timings.json.
# Refinement against the actual audio, 10 ms steps: a boundary between two tokens that sits next to a real silence snaps to that silence's edges
# (the aligner smears it by up to ~100 ms); a boundary inside a phrase snaps to the energy valley within +-50 ms if there is a clear one; a token
# that starts with a plosive is heard at its burst, so its start snaps there. Tokens (spoken words) are then merged into the display words of the
# script ("9.2" = nau point do). The raw aligner times stay in the file as alignStart / alignEnd.
import json, os, subprocess
import numpy as np
from script import PHRASES, bare

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
al = json.load(open(os.path.join(ROOT, "scripts/align.raw.json")))
T = al["tokens"]
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(ROOT, "public/vo.mp3"), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
db = np.array([10 * np.log10(np.mean(x[i:i + 160] ** 2) + 1e-12) for i in range(0, len(x) - 160, 160)])
SIL = -45.0
quiet = db < SIL
silences, i = [], 0                              # (start, end) in seconds, >= 90 ms
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]: j += 1
        if j - i >= 9: silences.append((i / 100, j / 100))
        i = j
    else: i += 1

starts = [t["start"] for t in T]; ends = [t["end"] for t in T]
n = len(T)
pinned = [False] * n
bounds = {k: (ends[k - 1] + starts[k]) / 2 for k in range(1, n)}
owner = {}
for si, sl in enumerate(silences):                # each silence belongs to ONE boundary: the aligner boundary nearest its centre
    c = (sl[0] + sl[1]) / 2
    k = min(bounds, key=lambda k: abs(bounds[k] - c))
    if sl[0] - 0.12 <= bounds[k] <= sl[1] + 0.12: owner.setdefault(k, []).append(si)
for k in range(1, n):
    b = bounds[k]
    if k in owner:
        sl = silences[min(owner[k], key=lambda si: abs((silences[si][0] + silences[si][1]) / 2 - b))]
        ends[k - 1], starts[k] = sl[0], sl[1]; pinned[k] = True
    elif T[k]["phrase"] != T[k - 1]["phrase"]:    # a phrase boundary the silence detector did not see as a gap: keep the aligner's
        ends[k - 1] = starts[k] = b
    else:
        lo, hi = int((b - 0.05) * 100), int((b + 0.05) * 100) + 1
        seg = db[lo:hi]; v = lo + int(np.argmin(seg))
        side = max(db[max(0, v - 8):v - 2].max(initial=-99), db[v + 3:v + 9].max(initial=-99))
        ends[k - 1] = starts[k] = (v / 100) if side - db[v] >= 4.0 else b
PLOSIVE = set("pbtdkcjg")
def closures(lo, hi):
    out = []
    for m in range(lo + 1, hi - 1):
        if db[m] <= db[m - 1] and db[m] <= db[m + 1]:
            left = db[max(0, m - 10):m - 1].max(initial=-99); right = db[m + 2:m + 11].max(initial=-99)
            if min(left, right) - db[m] >= 12: out.append(m)
    return out
for k in range(1, n):
    if pinned[k] or T[k]["token"][0] not in PLOSIVE: continue
    b = starts[k]
    cs = closures(int((b - 0.15) * 100), int((b + 0.15) * 100) + 1)
    if not cs: continue
    m = min(cs, key=lambda c: abs(c / 100 - b))
    peak = db[m + 1:m + 9].max(); burst = m
    while burst < len(db) - 1 and db[burst] < (db[m] + peak) / 2: burst += 1
    dip = m
    while dip > 1 and db[dip - 1] < db[dip] + 0.5 and db[dip - 1] < peak - 8: dip -= 1
    nxt = starts[k + 1] if k + 1 < n else burst / 100 + 1
    if burst / 100 - starts[k - 1] < 0.10 or nxt - burst / 100 < 0.10: continue
    starts[k] = burst / 100; ends[k - 1] = min(dip / 100, starts[k])
first_loud = int(np.argmax(db > SIL)) / 100; last_loud = (len(db) - int(np.argmax(db[::-1] > SIL))) / 100
starts[0] = max(0.0, min(first_loud, starts[0] if starts[0] > 0 else first_loud)); ends[-1] = last_loud
for k in range(n):                                # sanity: positive lengths, in order; else fall back to the aligner for that token
    if ends[k] < starts[k] + 0.04 or (k and starts[k] < starts[k - 1] + 0.04):
        starts[k], ends[k] = T[k]["start"], T[k]["end"]
        if k: ends[k - 1] = min(ends[k - 1], starts[k])
for k in range(1, n):                              # overlaps left by the fallbacks: meet in the middle
    if starts[k] < ends[k - 1]: ends[k - 1] = starts[k] = round((starts[k] + ends[k - 1]) / 2, 3)
for k in range(n):
    assert ends[k] >= starts[k] + 0.03 and (k == 0 or starts[k] >= starts[k - 1] + 0.03), (k, T[k]["token"], starts[k], ends[k])

# tokens -> display words, in script order
words, k, sentence = [], 0, 0
for pi, (scene, text) in enumerate(PHRASES):
    for di, disp in enumerate(text.split()):
        toks = [t for t in range(n) if T[t]["phrase"] == pi and T[t]["di"] == di]
        assert toks, (pi, di, disp)
        a, b = toks[0], toks[-1]
        words.append({"i": k, "text": disp, "bare": bare(disp), "scene": scene, "phrase": pi, "sentence": sentence, "tokens": [T[t]["token"] for t in toks],
                      "start": round(starts[a], 3), "end": round(ends[b], 3), "alignStart": T[a]["start"], "alignEnd": T[b]["end"]})
        if disp[-1] in ".?!:" or disp.endswith("..."): sentence += 1
        k += 1
for a, b in zip(words, words[1:]): assert b["start"] >= a["start"] + 0.03 and a["end"] <= b["start"] + 0.001, (a["text"], a["start"], a["end"], b["text"], b["start"])
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(ROOT, "public/vo.mp3")], capture_output=True, text=True).stdout)
out = {"audioDuration": dur, "method": "forced alignment of the supplied script (pocketsphinx), phrase by phrase, refined against the speech envelope; see scripts/align.py and scripts/timings.py", "words": words}
os.makedirs(os.path.join(ROOT, "src"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "src/timings.json"), "w"), indent=1, ensure_ascii=False)
ch = [w for w in words if abs(w["start"] - w["alignStart"]) > 0.03 or abs(w["end"] - w["alignEnd"]) > 0.03]
print(f"{len(words)} words ({n} spoken tokens), audio {dur:.3f} s; refined {len(ch)} words by more than 30 ms")
