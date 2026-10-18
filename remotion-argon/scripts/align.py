# Forced alignment of the supplied voiceover script against public/vo.mp3 (the bundled pocketsphinx acoustic model; no model
# download is possible from the build machine). The script is the creator's own and the audio says exactly that, so the task is
# "when is each word said". Pronunciations are written by hand in the CMU phone set (Hinglish is phonetically regular).
import json, subprocess, os
import numpy as np
from pocketsphinx import Decoder, get_model_path

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PH = {
 "ek": "EH K", "hi": "HH IY", "prompt": "P R AA M P T", "claude": "K L AO D", "ko": "K OW", "laga": "L AH G AA", "ghanta": "G AH N T AA",
 "tirpan": "T IH R P AH N", "minute": "M IH N AH T", "google": "G UW G AH L", "ke": "K EH", "naye": "N AH Y EH", "gemini": "JH EH M IH N IY",
 "argon": "AA R G AA N", "sirf": "S IH R F", "chaar": "CH AA R", "kharcha": "K AH R CH AA", "teis": "T EY S", "dollar": "D AA L ER",
 "saadhe": "S AA D EH", "teen": "T IY N", "matlab": "M AH T L AH B", "chhabbees": "CH AH B IY S", "guna": "G UH N AA", "tez": "T EY Z",
 "aur": "AO R", "lagbhag": "L AH G B AH G", "saat": "S AA T", "sasta": "S AH S T AA", "lekin": "L EY K IH N", "twist": "T W IH S T",
 "yeh": "Y EH", "hai": "HH EH", "test": "T EH S T", "karne": "K AH R N EH", "wale": "W AA L EH", "creator": "K R IY EY T ER",
 "ne": "N EH", "kaha": "K AH HH AA", "detail": "D IY T EY L", "me": "M EH", "ab": "AH B", "bhi": "B IY", "aage": "AA G EH",
 "toh": "T OW", "kaunsa": "K AO N S AA", "use": "Y UW Z", "karein": "K AH R EY N", "jaldi": "JH AA L D IY", "draft": "D R AE F T",
 "kam": "K AH M", "budget": "B AH JH AH T", "har": "HH AH R", "frame": "F R EY M", "perfect": "P ER F EH K T", "chahiye": "CH AA HH IH Y EH",
 "smart": "S M AA R T", "log": "L OW G", "dono": "D OW N OW", "karte": "K AH R T EH", "hain": "HH EH N", "se": "S EH", "final": "F AY N AH L",
 "par": "P AH R", "apna": "AH P N AA", "khud": "K UH D", "ka": "K AA", "karo": "K AH R OW", "same": "S EY M", "try": "T R AY",
 "cheezein": "CH IY Z EH N", "score": "S K AO R", "time": "T AY M", "cost": "K AO S T", "fair": "F EH R", "poora": "P UW R AA",
 "comment": "K AA M EH N T",
}
SCRIPT = [
 "ek hi prompt", "claude ko laga ek ghanta tirpan minute", "google ke naye gemini argon ko", "sirf chaar minute",
 "kharcha", "claude teis dollar", "gemini sirf saadhe teen dollar",
 "matlab gemini chhabbees guna tez", "aur lagbhag saat guna sasta",
 "lekin twist yeh hai", "test karne wale creator ne kaha", "detail me claude ab bhi aage hai",
 "toh kaunsa use karein", "jaldi draft kam budget", "gemini", "har frame perfect chahiye", "claude",
 "smart log dono use karte hain", "gemini se draft", "claude se final",
 "par yeh sirf ek test hai", "apna khud ka karo", "same prompt ek try aur teen cheezein score karo detail time cost",
 "fair test ka poora prompt chahiye", "comment karo prompt",
]
words = [w for s in SCRIPT for w in s.split()]
missing = sorted({w for w in words if w not in PH}); assert not missing, missing
mp3 = os.path.join(ROOT, "public/vo.mp3")
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", mp3, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
dict_path = "/tmp/argon.dict"
with open(dict_path, "w") as f:
    for w in sorted(set(words)): f.write(f"{w} {PH[w]}\n")
model = os.path.join(get_model_path(), "en-us")
d = Decoder(hmm=os.path.join(model, "en-us"), dict=dict_path, loglevel="FATAL")
d.set_align_text(" ".join(words))
d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt()
out, k = [], 0
for seg in d.seg():
    if seg.word in ("<sil>", "<s>", "</s>"): continue
    out.append({"i": k, "word": seg.word, "start": seg.start_frame / 100, "end": (seg.end_frame + 1) / 100}); k += 1
assert len(out) == len(words), (len(out), len(words))
json.dump({"duration": len(raw) / 2 / 16000, "words": out}, open(os.path.join(ROOT, "scripts/align.raw.json"), "w"), indent=1)
for w in out: print(f"{w['i']:2} {w['word']:10} {w['start']:6.2f} {w['end']:6.2f}")
