#!/usr/bin/env python3
"""Word timestamps for a voiceover by FORCED ALIGNMENT of the reel's own script (no Whisper, no network, no model download).
The voice says exactly script.json, so the task is only "when is each word said". pocketsphinx (its bundled English acoustic model) aligns the
whole script in one utterance; Hinglish words get hand-written phones (HINDI below, a small regular rule set covers the rest), English words come from the
CMU dictionary that ships with pocketsphinx. Where the voice's reading of a word is not known in advance (spelled letters) several variants are tried one
word at a time and the one the whole alignment scores best wins. The result is refined against the speech envelope (boundaries snap to real silences,
a word that starts with a plosive is heard at its burst) and written as timings.json: [{"word","start","end"}] per SCRIPT word, which build-timeline.mjs reads.

usage: python3 scripts/align_forced.py paste-leak          (pip install pocketsphinx numpy; ffmpeg on the PATH)
"""
import json, math, os, re, subprocess, sys, tempfile, time
import numpy as np
from pocketsphinx import Decoder, get_model_path

REEL = sys.argv[1] if len(sys.argv) > 1 else "paste-leak"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "public/reels", REEL, "vo.mp3")
SCRIPT = json.load(open(os.path.join(ROOT, "src/reels", REEL, "script.json")))
OUT = os.path.join(ROOT, "src/reels", REEL, "timings.json")

# Hinglish (Latin script) in CMU phones. Regular spelling, so this list is short; add words here when a new reel brings new vocabulary.
HINDI = {
 "aadhaar": "AA D HH AA R", "aap": "AA P", "aapki": "AA P K IY", "ab": "AH B", "apne": "AH P N EH", "aur": "AO R", "baatein": "B AA T EY N", "bada": "B AH D AA",
 "bataun": "B AH T AA UW N", "bayaasi": "B AH Y AA S IY", "bhi": "B IY", "chala": "CH AH L AA", "cheezein": "CH IY Z EY N", "daal": "D AA L", "daalo": "D AA L OW",
 "dawaiyan": "D AH W AA IY Y AA N", "di": "D IY", "do": "D OW", "doosra": "D UW S R AA", "ek": "EH K", "hai": "HH EH", "hain": "HH EH N", "hata": "HH AH T AA",
 "hazaar": "HH AH Z AA R", "ho": "HH OW", "jaa": "JH AA", "jaake": "JH AA K EH", "jaante": "JH AA N T EH", "jaldi": "JH AH L D IY", "jo": "JH OW", "ka": "K AA",
 "kaam": "K AA M", "kabhi": "K AH B HH IY", "karne": "K AH R N EH", "karo": "K AH R OW", "ke": "K EH", "khatam": "K HH AH T AH M", "ki": "K IY", "kuch": "K UH CH",
 "kya": "K Y AA", "liye": "L IY Y EH", "log": "L OW G", "logon": "L OW G OW N", "mat": "M AH T", "mein": "M EH N", "naam": "N AA M", "nahi": "N AH HH IY", "ne": "N EH",
 "paanch": "P AA N CH", "pata": "P AH T AA", "pehla": "P EH HH L AA", "pehle": "P EH HH L EH", "poori": "P UW R IY", "rakho": "R AH K HH OW", "roz": "R OW Z",
 "sab": "S AH B", "sakti": "S AH K T IY", "sau": "S AO", "se": "S EH", "sudharne": "S UH D HH AA R N EH", "tareeka": "T AH R IY K AA", "teen": "T IY N",
 "teesra": "T IY S R AA", "toh": "T OW", "usse": "UH S S EH", "warna": "W AH R N AA", "woh": "W OW", "ya": "Y AA", "yaad": "Y AA D", "yahi": "Y AH HH IY", "yeh": "Y EH",
 "zaroor": "Z AH R UW R", "zyaadatar": "Z Y AA D AH T AH R", "karte": "K AH R T EH", "karna": "K AH R N AA", "raha": "R AH HH AA", "gaya": "G AH Y AA", "wala": "W AA L AA",
 "har": "HH AH R", "chahiye": "CH AA HH IH Y EH", "chaar": "CH AA R", "sach": "S AH CH", "seedha": "S IY D HH AA",
 # spelled letters / names the voice may say in more than one way
 "ay": "EY", "eye": "AY", "pee": "P IY", "en": "EH N", "pan": "P AE N",
}
VARIANTS = {   # script word (letters only) -> list of token sequences
 "ai": [["ay", "eye"]], "api": [["ay", "pee", "eye"]], "pan": [["pan"], ["pee", "ay", "en"]], "numbers": [["numbers"]],
}
CMU = {}
for line in open(os.path.join(get_model_path(), "en-us", "cmudict-en-us.dict")):
    p = line.split()
    if p: CMU.setdefault(re.sub(r"\(\d+\)$", "", p[0]), " ".join(p[1:]))
def bare(w): return re.sub(r"[^a-z0-9]", "", w.lower())
def phones(tok):
    if tok in HINDI: return HINDI[tok]
    if tok in CMU: return CMU[tok]
    raise SystemExit(f'no pronunciation for "{tok}": add it to HINDI in scripts/align_forced.py')

DISP = [(si, di, w) for si, seg in enumerate(SCRIPT["segments"]) for di, w in enumerate(seg["text"].split())]
def tokens_for(choice):
    out = []
    for k, (si, di, w) in enumerate(DISP):
        vs = VARIANTS.get(bare(w), [[bare(w)]])
        for t in vs[choice.get(k, 0)]: out.append((t, k))
    return out
for si, di, w in DISP:
    for v in VARIANTS.get(bare(w), [[bare(w)]]):
        for t in v: phones(t)

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", VO, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
x = np.frombuffer(raw, dtype="<i2")
g = min(8.0, 0.25 * 32767 / max(1, np.abs(x).max()))                 # a gain for the recogniser only; times are unchanged
x = np.clip(x.astype(np.float32) * g, -32768, 32767).astype("<i2")
model = os.path.join(get_model_path(), "en-us")

def run1(toks, kw, pad_s=0.3):
    dpath = tempfile.mktemp(suffix=".dict")
    with open(dpath, "w") as f:
        for t in sorted(set(toks)): f.write(f"{t} {phones(t)}\n")
    d = Decoder(hmm=os.path.join(model, "en-us"), dict=dpath, loglevel="FATAL", **kw)
    d.set_align_text(" ".join(toks))
    pad = np.zeros(int(pad_s * 16000), dtype="<i2")
    d.start_utt(); d.process_raw(np.concatenate([pad, x, pad]).tobytes(), full_utt=True); d.end_utt()
    sg = d.seg()
    os.remove(dpath)
    if sg is None: return [], -1e18
    segs = [(s.word, s.start_frame, s.end_frame + 1, s.ascore) for s in sg]
    words = [(w, st - int(pad_s * 100), en - int(pad_s * 100), a) for (w, st, en, a) in segs if w not in ("<sil>", "<s>", "</s>")]
    return words, sum(math.log(max(a, 1e-300)) for (_, _, _, a) in segs)
def align(tk):
    toks = [t for t, _ in tk]
    for kw in ({}, {"beam": 1e-60, "wbeam": 1e-40, "pbeam": 1e-40}, {"beam": 1e-30, "wbeam": 1e-20, "pbeam": 1e-20}, {"beam": 1e-20, "wbeam": 1e-12, "pbeam": 1e-12}):
        words, score = run1(toks, kw)
        if len(words) == len(toks): return words, score
    return words, score

t0 = time.time()
choice = {}
toks = tokens_for(choice); words, best = align(toks)
print(f"{len(toks)} tokens for {len(DISP)} script words, first alignment in {time.time() - t0:.1f} s, aligned {len(words)}", flush=True)
assert len(words) == len(toks), "the decoder dropped words: check script.json against the audio and the phones"
amb = [k for k, (si, di, w) in enumerate(DISP) if len(VARIANTS.get(bare(w), [[bare(w)]])) > 1]
for sweep in range(2):
    changed = False
    for k in amb:
        vs = VARIANTS[bare(DISP[k][2])]; cur = choice.get(k, 0); scores = {cur: best}
        for vi in range(len(vs)):
            if vi == cur: continue
            c2 = dict(choice); c2[k] = vi; w2, s2 = align(tokens_for(c2))
            if len(w2) == len(tokens_for(c2)): scores[vi] = s2
        bi = max(scores, key=scores.get)
        if bi != cur: choice[k] = bi; changed = True; best = scores[bi]
    if not changed: break
toks = tokens_for(choice); words, best = align(toks)
T = [{"token": t, "k": k, "start": st / 100, "end": en / 100} for (t, k), (_, st, en, _a) in zip(toks, words)]

# ---- refinement against the speech envelope (10 ms steps) ----
db = np.array([10 * np.log10(np.mean((x[i:i + 160] / g / 32768.0) ** 2) + 1e-12) for i in range(0, len(x) - 160, 160)])
SIL = db.max() - 36.0
quiet = db < SIL
silences, i = [], 0
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]: j += 1
        if j - i >= 9: silences.append((i / 100, j / 100))
        i = j
    else: i += 1
starts = [t["start"] for t in T]; ends = [t["end"] for t in T]; n = len(T); pinned = [False] * n
bounds = {k: (ends[k - 1] + starts[k]) / 2 for k in range(1, n)}; owner = {}
for si_, sl in enumerate(silences):
    c = (sl[0] + sl[1]) / 2; k = min(bounds, key=lambda k: abs(bounds[k] - c))
    if sl[0] - 0.12 <= bounds[k] <= sl[1] + 0.12: owner.setdefault(k, []).append(si_)
for k in range(1, n):
    b = bounds[k]
    if k in owner:
        sl = silences[min(owner[k], key=lambda s_: abs((silences[s_][0] + silences[s_][1]) / 2 - b))]
        ends[k - 1], starts[k] = sl[0], sl[1]; pinned[k] = True
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
    b = starts[k]; cs = closures(int((b - 0.15) * 100), int((b + 0.15) * 100) + 1)
    if not cs: continue
    m = min(cs, key=lambda c: abs(c / 100 - b)); peak = db[m + 1:m + 9].max(); burst = m
    while burst < len(db) - 1 and db[burst] < (db[m] + peak) / 2: burst += 1
    dip = m
    while dip > 1 and db[dip - 1] < db[dip] + 0.5 and db[dip - 1] < peak - 8: dip -= 1
    nxt = starts[k + 1] if k + 1 < n else burst / 100 + 1
    if burst / 100 - starts[k - 1] < 0.10 or nxt - burst / 100 < 0.10: continue
    starts[k] = burst / 100; ends[k - 1] = min(dip / 100, starts[k])
first_loud = int(np.argmax(db > SIL)) / 100; last_loud = (len(db) - int(np.argmax(db[::-1] > SIL))) / 100
starts[0] = max(0.0, min(first_loud, starts[0] if starts[0] > 0 else first_loud)); ends[-1] = last_loud
for k in range(n):
    if ends[k] < starts[k] + 0.04 or (k and starts[k] < starts[k - 1] + 0.04):
        starts[k], ends[k] = T[k]["start"], T[k]["end"]
        if k: ends[k - 1] = min(ends[k - 1], starts[k])
for k in range(1, n):
    if starts[k] < ends[k - 1]: ends[k - 1] = starts[k] = round((starts[k] + ends[k - 1]) / 2, 3)

# ---- tokens -> script words ----
out = []
for k, (si, di, disp) in enumerate(DISP):
    ts = [t for t in range(n) if T[t]["k"] == k]
    out.append({"word": disp, "start": round(starts[ts[0]], 3), "end": round(ends[ts[-1]], 3)})
for a, b in zip(out, out[1:]):
    if b["start"] < a["start"] + 0.02: b["start"] = round(a["start"] + 0.02, 3)
    if a["end"] > b["start"]: a["end"] = b["start"]
json.dump(out, open(OUT, "w"), indent=1, ensure_ascii=False)
dur = len(x) / 16000
bad = [o for o in out if o["end"] - o["start"] < 0.05]
print(f"{len(out)} words written to {os.path.relpath(OUT, ROOT)} (audio {dur:.2f} s, aligned in {time.time() - t0:.0f} s); {len(bad)} words shorter than 50 ms: {[b['word'] for b in bad][:12]}")
print("first words:", [(o['word'], o['start']) for o in out[:6]], " last:", [(o['word'], o['start'], o['end']) for o in out[-3:]])
