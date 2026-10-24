# Forced alignment of the supplied narration against public/vo.mp3 (pocketsphinx's bundled acoustic model; no model download is possible from the build machine).
# The audio says exactly the script, so the task is "when is each word said". This voice-over has almost no pauses between sentences (the audio was cut tight),
# so the whole script is aligned in ONE utterance. Where the voice's reading of a word is not known in advance (spelled letters, English names, number words) the
# variants of script.VARIANTS are tried one word at a time (coordinate descent on the total acoustic log-likelihood of the whole alignment) and the best one wins.
import json, math, os, subprocess, sys, tempfile, time
import numpy as np
from pocketsphinx import Decoder, get_model_path
from script import PHRASES, VARIANTS, bare
from pron import PH

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(ROOT, "public/vo.mp3"), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
x = np.frombuffer(raw, dtype="<i2")
# the voice is quiet (-26 LUFS): bring it to a normal level for the recogniser (a gain only; timing is unchanged)
g = min(8.0, 0.25 * 32767 / max(1, np.abs(x).max()))
x = np.clip(x.astype(np.float32) * g, -32768, 32767).astype("<i2")
model = os.path.join(get_model_path(), "en-us")

DISP = [(pi, di, w) for pi, (_, text) in enumerate(PHRASES) for di, w in enumerate(text.split())]
def tokens_for(choice):
    out = []
    for k, (pi, di, w) in enumerate(DISP):
        vs = VARIANTS.get(bare(w), [[bare(w)]])
        for t in vs[choice.get(k, 0)]: out.append((t, k))
    return out
for pi, di, w in DISP:
    for v in VARIANTS.get(bare(w), [[bare(w)]]):
        for t in v: assert t in PH, ("no pronunciation for", t, "in", w)

def run1(toks, kw, pad_s=0.3, a=0.0, b=None):
    dpath = tempfile.mktemp(suffix=".dict")
    with open(dpath, "w") as f:
        for t in sorted(set(toks)): f.write(f"{t} {PH[t]}\n")
    d = Decoder(hmm=os.path.join(model, "en-us"), dict=dpath, loglevel="FATAL", **kw)
    d.set_align_text(" ".join(toks))
    npad = int(pad_s * 16000); pad = np.zeros(npad, dtype="<i2")
    xs = x if b is None else x[int(a * 16000):int(b * 16000)]
    pcm = np.concatenate([pad, xs, pad]).tobytes()
    d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
    sg = d.seg()
    os.remove(dpath)
    if sg is None: return [], -1e18
    segs = [(s.word, s.start_frame, s.end_frame + 1, s.ascore) for s in sg]
    words = [(w, st - int(pad_s * 100), en - int(pad_s * 100), a) for (w, st, en, a) in segs if w not in ("<sil>", "<s>", "</s>")]
    return words, sum(math.log(max(a, 1e-300)) for (_, _, _, a) in segs)

def align(tk, a=0.0, b=None):
    toks = [t for t, _ in tk]
    for kw in ({}, {"beam": 1e-60, "wbeam": 1e-40, "pbeam": 1e-40}, {"beam": 1e-30, "wbeam": 1e-20, "pbeam": 1e-20}, {"beam": 1e-20, "wbeam": 1e-12, "pbeam": 1e-12}):
        words, score = run1(toks, kw, 0.3, a, b)
        if len(words) == len(toks): return words, score
    return words, score

choice = {}
amb = [k for k, (pi, di, w) in enumerate(DISP) if len(VARIANTS.get(bare(w), [[bare(w)]])) > 1]
t0 = time.time()
toks = tokens_for(choice)
words, best = align(toks)
print(f"{len(toks)} tokens, {len(DISP)} words, first full alignment in {time.time() - t0:.1f} s, aligned {len(words)} tokens, score {best:.0f}", flush=True)
assert len(words) == len(toks), "the decoder dropped words: check the script / pronunciations"
for sweep in range(2):
    changed = False
    for k in amb:
        vs = VARIANTS[bare(DISP[k][2])]
        cur = choice.get(k, 0); scores = {cur: best}
        for vi in range(len(vs)):
            if vi == cur: continue
            c2 = dict(choice); c2[k] = vi
            w2, s2 = align(tokens_for(c2))
            if len(w2) == len(tokens_for(c2)): scores[vi] = s2
        bi = max(scores, key=scores.get)
        if bi != cur:
            choice[k] = bi; changed = True; best = scores[bi]
            words, _ = align(tokens_for(choice))
        print(f"  sweep {sweep} word {k:3} {DISP[k][2]:12} {' | '.join(' '.join(v) for v in vs)}  -> {' '.join(vs[choice.get(k, 0)])}   ({scores[bi] - scores.get(cur, scores[bi]):+.0f})", flush=True)
    if not changed: break
toks = tokens_for(choice)
words, best = align(toks)
out = []
for (t, k), (wt, st, en, a) in zip(toks, words):
    assert wt == t, (wt, t)
    pi, di, disp = DISP[k]
    out.append({"token": t, "display": disp, "di": di, "phrase": pi, "scene": PHRASES[pi][0], "start": round(st / 100, 3), "end": round(en / 100, 3), "logp": round(math.log(max(a, 1e-300)), 1)})
# Stretches where the global pass let a word run across a real pause (the 150 ms of silence at 74.95-75.10 sits between "isliye" and "AI"): split the audio at that
# pause and align each side on its own.  (a, b) = the audio window, tokens = those whose global start lies in [lo, hi).
WINDOWS = [(74.45, 74.98, 74.45, 74.98), (75.08, 77.15, 74.98, 77.1)]
for wa, wb, lo, hi in WINDOWS:
    idx = [i for i, o in enumerate(out) if lo <= o["start"] < hi]
    sub = [(out[i]["token"], 0) for i in idx]
    ww, sc = align(sub, wa, wb)
    if len(ww) == len(sub):
        for i, (wt, st, en, a_) in zip(idx, ww):
            out[i]["start"] = round(wa + st / 100, 3); out[i]["end"] = round(wa + en / 100, 3); out[i]["logp"] = round(math.log(max(a_, 1e-300)), 1)
        print("re-aligned window", wa, wb, [(out[i]["token"], out[i]["start"], out[i]["end"]) for i in idx])
    else: print("WINDOW FAILED", wa, wb, len(ww), len(sub))
json.dump({"duration": len(x) / 16000, "tokens": out}, open(os.path.join(ROOT, "scripts/align.raw.json"), "w"), indent=1)
bad = sorted(out, key=lambda o: o["logp"] / max(0.05, o["end"] - o["start"]))[:12]
print("lowest-scoring tokens (per second):", [(o["token"], o["start"], round(o["logp"] / max(0.05, o["end"] - o["start"]))) for o in bad])
print(f"done in {time.time() - t0:.0f} s")
