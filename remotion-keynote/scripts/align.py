# Forced alignment of the supplied script against public/vo.mp3 (no model download is possible here, so this uses the acoustic
# model bundled in the pocketsphinx wheel). The script is the user's own and the audio says exactly that, so the task is
# "when is each word said", not "what is said". Pronunciations are written by hand in the CMU phone set (Hinglish is
# phonetically regular). Output: scripts/align.raw.json with every word's start/end from the aligner.
import json, subprocess, sys, os, wave
import numpy as np
from pocketsphinx import Decoder, get_model_path

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PH = {
 "motion": "M OW SH AH N", "designer": "D IH Z AY N ER", "ka": "K AA", "ek": "EH K", "project": "P R AA JH EH K T",
 "pachaas": "P AH CH AA S", "hazaar": "HH AH Z AA R", "rupaye": "R UW P AH Y EH", "tak": "T AH K",
 "claude": "K L AO D", "pro": "P R OW", "do": "D OW", "poore": "P UW R EH", "mahine": "M AH HH IY N EH", "ke": "K EH",
 "calculator": "K AE L K Y AH L EY T ER", "nikaalo": "N IH K AA L OW", "divided": "D IH V AY D IH D", "by": "B AY",
 "pacchees": "P AH CH IY S", "saal": "S AA L", "se": "S EH", "zyada": "Z Y AA D AA", "aur": "AO R", "haan": "HH AA N",
 "one": "W AH N", "more": "M AO R", "thing": "TH IH NG", "yeh": "Y EH", "poora": "P UW R AA", "video": "V IH D IY OW",
 "kisi": "K IH S IY", "ne": "N EH", "nahi": "N AH HH IY", "banaya": "B AH N AA Y AA", "code": "K OW D", "sirf": "S IH R F",
 "prompt": "P R AA M P T", "designers": "D IH Z AY N ER Z", "khatam": "K AH T AH M", "honge": "HH OW N G EH",
 "lekin": "L EY K IH N", "jo": "JH OW", "ai": "EY AY", "seekhenge": "S IY K EH N G EH", "woh": "W OW", "zaroor": "Z AH R UW R",
 "ho": "HH OW", "jayenge": "JH AA Y EH N G EH", "chahiye": "CH AA HH IH Y EH", "comment": "K AA M EH N T", "karo": "K AH R OW",
}
SCRIPT = [  # (sentence, words)
 ("S1", "motion designer ka ek project"), ("S1", "pachaas hazaar rupaye tak"),
 ("S2", "claude pro"), ("S2", "do hazaar rupaye"), ("S2", "poore mahine ke"),
 ("S3", "calculator nikaalo"), ("S3", "pachaas hazaar divided by do hazaar"), ("S3", "pacchees"), ("S3", "pacchees mahine ka claude"), ("S3", "do saal se zyada"),
 ("S4", "aur haan"), ("S4", "one more thing"),
 ("S5", "yeh poora video"), ("S5", "kisi designer ne nahi banaya"), ("S5", "claude code ne banaya"), ("S5", "sirf ek prompt se"),
 ("S6", "designers khatam nahi honge"), ("S6", "lekin jo ai nahi seekhenge"), ("S6", "woh zaroor ho jayenge"),
 ("S7", "prompt chahiye"), ("S7", "comment karo motion"),
]
words = [w for _, s in SCRIPT for w in s.split()]
missing = sorted({w for w in words if w not in PH})
assert not missing, missing

mp3 = os.path.join(ROOT, "public/vo.mp3")
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", mp3, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
pcm = np.frombuffer(raw, dtype=np.int16)

dict_path = "/tmp/script.dict"
with open(dict_path, "w") as f:
    pass
    for w in sorted(set(words)): f.write(f"{w} {PH[w]}\n")

model = os.path.join(get_model_path(), "en-us")
d = Decoder(hmm=os.path.join(model, "en-us"), dict=dict_path)
d.set_align_text(" ".join(words))
d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt()
out, k = [], 0
for seg in d.seg():
    if seg.word in ("<sil>", "<s>", "</s>"): continue
    out.append({"i": k, "word": seg.word, "start": seg.start_frame / 100, "end": (seg.end_frame + 1) / 100}); k += 1
assert len(out) == len(words), (len(out), len(words))
json.dump({"duration": len(pcm) / 16000, "words": out}, open(os.path.join(ROOT, "scripts/align.raw.json"), "w"), indent=1)
for w in out: print(f"{w['i']:2} {w['word']:10} {w['start']:6.2f} {w['end']:6.2f}")
