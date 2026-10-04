#!/usr/bin/env python3
"""align <slug> [--model small] [--allow-fallback]

Word timings per scene WAV, written to films/<slug>/build/align/<id>.json (voice-local seconds).

Method (a): multilingual Whisper (faster-whisper, model "small" — NOT a ".en" model) with word
timestamps. We keep OUR script words and borrow only the timing: script word i takes the time of
the Whisper word at the same relative position (by cumulative character share).

Fallback (c) (--allow-fallback, drafts only): syllable-weighted even timings across the voice span.
The JSON records `method`, and the failure reason (including the blocked domain) when it falls back.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
slug = args[0]
MODEL = sys.argv[sys.argv.index("--model") + 1] if "--model" in sys.argv else "small"
ALLOW_FALLBACK = "--allow-fallback" in sys.argv
film = os.path.join(ROOT, "films", slug)
video = json.load(open(os.path.join(film, "video.json")))
out_dir = os.path.join(film, "build", "align")
os.makedirs(out_dir, exist_ok=True)


def wav_dur(p):
    # ffprobe: Python's wave module can't read 24-bit WAVE_FORMAT_EXTENSIBLE
    import subprocess

    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], text=True).strip())


def syllables(w):
    return max(1, len(re.findall(r"[aeiouy]+", w, re.I)))


def even(words, start, end):
    wt = [syllables(w) for w in words]
    tot = sum(wt)
    t, out = start, []
    for w, k in zip(words, wt):
        d = (end - start) * k / tot
        out.append({"text": w, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    return out


def borrow(script, whisper):
    """Map script words onto whisper word times by relative character position."""
    if not whisper:
        return None
    s_len = [len(w) + 1 for w in script]
    w_len = [max(1, len(w["word"].strip())) + 1 for w in whisper]
    S, W = sum(s_len), sum(w_len)
    w_cum, acc = [], 0
    for l in w_len:
        w_cum.append((acc / W, (acc + l) / W))
        acc += l

    def time_at(frac):
        for (a, b), w in zip(w_cum, whisper):
            if frac <= b or w is whisper[-1]:
                r = 0 if b == a else min(1, max(0, (frac - a) / (b - a)))
                return w["start"] + r * (w["end"] - w["start"])
        return whisper[-1]["end"]

    out, acc = [], 0
    for w, l in zip(script, s_len):
        a, b = acc / S, (acc + l - 1) / S
        out.append({"text": w, "start": round(time_at(a), 3), "end": round(time_at(b), 3)})
        acc += l
    return out


model, reason = None, None
try:
    from faster_whisper import WhisperModel

    model = WhisperModel(MODEL, device="cpu", compute_type="int8")
except Exception as e:  # report the exact blocked domain if it's a network failure
    msg = str(e)
    dom = re.findall(r"https?://([a-zA-Z0-9.-]+)", msg)
    if not dom and os.environ.get("HTTPS_PROXY"):
        # the agent proxy logs which host it refused; quote it verbatim
        try:
            import urllib.request

            st = json.load(urllib.request.urlopen(os.environ["HTTPS_PROXY"].rstrip("/") + "/__agentproxy/status", timeout=5))
            fails = st.get("recentRelayFailures") or st.get("proxy", {}).get("recentRelayFailures") or []
            if fails:
                dom = [fails[-1]["host"]]
        except Exception:
            pass
    reason = f"{type(e).__name__}: {msg.splitlines()[0][:300]}" + (f" | blocked host: {dom[0]}" if dom else "")
    if not ALLOW_FALLBACK:
        print(f"align {slug}: FAIL — Whisper model '{MODEL}' unavailable: {reason}")
        sys.exit(1)

methods = {}
for sc in video["scenes"]:
    wav = os.path.join(film, "audio", f"{sc['id']}.wav")
    dur = wav_dur(wav)
    script = (sc.get("captions") or sc["narration"]).split()
    rec = {"id": sc["id"], "voiceDur": round(dur, 4)}
    if model is not None:
        segs, info = model.transcribe(wav, word_timestamps=True, vad_filter=False, language=None)
        ww = [{"word": w.word, "start": w.start, "end": w.end} for s in segs for w in (s.words or [])]
        words = borrow(script, ww)
        rec.update(method=f"whisper-{MODEL}", language=info.language, whisperWords=len(ww), words=words)
    else:
        rec.update(method="fallback-syllable", reason=reason, words=even(script, 0.03, dur - 0.03))
    methods[rec["method"]] = methods.get(rec["method"], 0) + 1
    json.dump(rec, open(os.path.join(out_dir, f"{sc['id']}.json"), "w"), ensure_ascii=False, indent=1)

summary = ", ".join(f"{k}×{v}" for k, v in methods.items())
print(f"align {slug}: {len(video['scenes'])} scenes · method {summary}" + (f" · reason: {reason}" if reason else ""))
