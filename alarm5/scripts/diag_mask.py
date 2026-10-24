#!/usr/bin/env python3
"""which SFX / music contribute most under a given word? usage: python3 scripts/diag_mask.py <word-start-seconds> [...]"""
import json, sys
import numpy as np
from scipy import signal
sys.path.insert(0, "scripts")
import build_mix as bm
from audiolib import PUBLIC, SR, SFX_DIR, lin2db, peak_db
import soundfile as sf
tl = json.load(open(PUBLIC / "timeline.json")); index = json.load(open(SFX_DIR / "index.json"))
v = sf.read("build/stems/voice.wav", always_2d=True)[0].mean(axis=1); vpk = peak_db(sf.read("build/stems/voice.wav", always_2d=True)[0])
mus = sf.read("build/stems/music.wav", always_2d=True)[0].mean(axis=1)
sos = signal.butter(2, (200, 5000), btype="bandpass", fs=SR, output="sos")
for t0 in map(float, sys.argv[1:]):
    w = min(tl["words"], key=lambda w: abs(w["start"] - t0))
    a, b = int(w["start"] * SR), int(w["end"] * SR)
    vb = signal.sosfilt(sos, v)[a:b]; pv = np.mean(vb ** 2)
    print(f"== '{w['text']}' {w['scene']} {w['start']:.2f}-{w['end']:.2f}s voice band {10*np.log10(pv):.1f} dB")
    mb = signal.sosfilt(sos, mus)[a:b]; print(f"   music           {10*np.log10(np.mean(mb**2)/pv):+.1f} dB rel voice")
    rows = []
    for e in tl["sfx"]:
        out, st, hs, info = bm.render_event(e, index, vpk)
        s0, s1 = max(a, st), min(b, st + len(out))
        if s1 <= s0: continue
        x = signal.sosfilt(sos, out.mean(axis=1))[s0 - st:s1 - st]
        rows.append((10 * np.log10(np.sum(x ** 2) / (b - a) / pv + 1e-12), e["id"], e["sfx"], e.get("gainDb", 0)))
    for r in sorted(rows, reverse=True)[:5]: print("   %+.1f dB rel voice  %s %s gain %s" % r)
