# Forced alignment of the supplied narration against public/vo.mp3, phrase by phrase (pocketsphinx's bundled acoustic model; no model
# download is possible from the build machine). The audio says exactly the script, so the task is "when is each word said".
# Where the voice's reading of a token is not known in advance (numbers, spelled letters, English names) the variants of
# script.VARIANTS are all tried on the phrase and the one with the best acoustic score wins; the choice is written to the output.
import itertools, json, math, os, subprocess, tempfile
import numpy as np
from pocketsphinx import Decoder, get_model_path
from script import PHRASES, VARIANTS, bare
from pron import PH

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(ROOT, "public/vo.mp3"), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
x = np.frombuffer(raw, dtype="<i2")
xf = x.astype(np.float32) / 32768
db = np.array([10 * np.log10(np.mean(xf[i:i + 160] ** 2) + 1e-12) for i in range(0, len(xf) - 160, 160)])

# 1. the stretches of speech between pauses of >= 0.2 s
chunks, i, n = [], 0, len(db)
speech = db > -48
while i < n:
    if speech[i]:
        j = i
        while j < n:
            if not speech[j]:
                k = j
                while k < n and not speech[k]: k += 1
                if k - j >= 20 or k >= n: break
                j = k
            else: j += 1
        chunks.append((i / 100, min(j, n) / 100)); i = j
    else: i += 1
assert len(chunks) == len(PHRASES), (len(chunks), len(PHRASES))

model = os.path.join(get_model_path(), "en-us")
GUESSED = []
def run(tokens, a, b):
    for pad in (0.3, 0.15, 0.5, 0.0):
        for kw in ({"beam": 1e-60, "wbeam": 1e-40, "pbeam": 1e-40}, {}, {"beam": 1e-30, "wbeam": 1e-20, "pbeam": 1e-20}, {"beam": 1e-20, "wbeam": 1e-12, "pbeam": 1e-12}):
            words, score = run1(tokens, a, b, kw, pad)
            if len(words) == len(tokens): return words, score
    # the decoder sometimes drops the last, reduced word of a phrase ("... karta hai"): give the missing tail words the rest of the phrase, shared by phone count
    if words and [w for w, _, _ in words] == tokens[:len(words)]:
        rest = tokens[len(words):]; t0 = words[-1][2]; t1 = int(round((b - a) * 100)); t1 = max(t1, t0 + 6 * len(rest)); ph = [len(PH[t].split()) for t in rest]; at = t0
        for t, p_ in zip(rest, ph):
            w_ = max(4, int(round((t1 - t0) * p_ / sum(ph)))); words.append((t, at, at + w_)); at += w_
        GUESSED.append(" ".join(tokens))
        return words, score
    return words, score
def run1(tokens, a, b, kw, pad_s):
    dpath = tempfile.mktemp(suffix=".dict")
    with open(dpath, "w") as f:
        for t in sorted(set(tokens)): f.write(f"{t} {PH[t]}\n")
    d = Decoder(hmm=os.path.join(model, "en-us"), dict=dpath, loglevel="FATAL", **kw)
    d.set_align_text(" ".join(tokens))
    npad = int(pad_s * 16000); pad = np.zeros(npad, dtype='<i2')      # 0.3 s of silence each side so the path can enter and leave cleanly
    pcm = np.concatenate([pad, x[int(a * 16000):int(b * 16000)], pad]).tobytes()
    d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
    sg = d.seg()
    os.remove(dpath)
    if sg is None: return [], -1e18
    segs = [(s.word, s.start_frame, s.end_frame + 1, s.ascore) for s in sg]
    words = [(w, st - int(pad_s * 100), en - int(pad_s * 100)) for (w, st, en, _) in segs if w not in ("<sil>", "<s>", "</s>")]
    return words, sum(math.log(max(s[3], 1e-300)) for s in segs)

out, choices = [], []
for ci, ((scene, text), (a, b)) in enumerate(zip(PHRASES, chunks)):
    a0, b0 = max(0, a - 0.12), min(len(db) / 100, b + 0.12)
    disp = text.split()
    groups = [VARIANTS.get(bare(w), [[bare(w)]]) for w in disp]
    best = None
    for combo in itertools.product(*groups):
        toks = [t for g in combo for t in g]
        words, score = run(toks, a0, b0)
        if len(words) != len(toks): continue
        if best is None or score > best[0]: best = (score, combo, words)
    assert best, (ci, text)
    score, combo, words = best
    k = 0
    for di, (w, g) in enumerate(zip(disp, combo)):
        for t in g:
            _, st, en = words[k]
            out.append({"token": t, "display": w, "di": di, "phrase": ci, "scene": scene, "start": round(a0 + st / 100, 3), "end": round(a0 + en / 100, 3)}); k += 1
    spoken = " ".join(t for g in combo for t in g)
    nvar = int(np.prod([len(g) for g in groups]))
    choices.append((ci, text, spoken, nvar))
    print(f"{ci:2} {a:6.2f}-{b:6.2f}  {spoken}" + (f"   [{nvar} variants tried]" if nvar > 1 else ""))
json.dump({"duration": len(x) / 16000, "chunks": chunks, "tokens": out}, open(os.path.join(ROOT, "scripts/align.raw.json"), "w"), indent=1)

print("tail words estimated (the decoder dropped them):", sorted(set(GUESSED)))
