#!/usr/bin/env python3
"""Stage C (TIMELINE): audio-first timeline on the music's measured beat grid.

Usage: python3 -I scripts/timeline.py
Inputs : music/track.mp3, vo/L01–L14.wav + vo/lines.json, sfx/placeholder/ (until real SFX land)
Outputs: music/edit/bed.wav        the music, edited at bar lines (see EDIT below), 52.55 s
         timeline.json             grid, music edit, VO placements, 27 shots, transitions, SFX events
         out/timeline/vo.wav, sfx-placeholder.wav, preview-mix.wav, preview.mp4 (slates + mix)
Grid   : 128.011 BPM (period 0.468710 s), downbeat phase 0.054 s, fitted on the kick attacks 15–56 s
         of the source and unchanged by the edit, because every edit is whole bars.
"""
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
os.makedirs("music/edit", exist_ok=True); os.makedirs("out/timeline", exist_ok=True)
SR = 44100
P, PH = 0.468710, 0.054
g = lambda n: PH + n * P                       # beat n (output timeline)
FPS = 60
q = lambda t: round(round(t * FPS) / FPS, 4)   # snap to a 60 fps frame

def load(path, ch):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).copy()
def write(path, x, ch):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", str(ch), "-i", "-",
                    "-c:a", "pcm_s24le", path], input=x.astype(np.float32).tobytes(), check=True)

# ---------------------------------------------------------------- music edit (whole bars, source beats)
# Chosen by spectral join scores (STATE.md): drop the intro's bars 2–3 so the drop lands on "EduLedger"
# (out beat 24), play groove bar 10 twice so the one-bar break ends on the logo line (out beat 92),
# then jump from groove beat 104 to the outro (source beat 120) as the CTA starts (out beat 100).
EDIT = [(0, 8), (16, 44), (40, 44), (44, 104), (120, 132)]
END_BEAT = sum(b - a for a, b in EDIT)        # 112 → 52.55 s
src = load("music/track.mp3", 2)
n_out = int(round(g(END_BEAT) * SR))
bed = np.zeros((n_out + SR, 2), np.float32)
PRE, XF = 0.012, 0.008                         # cut 12 ms before the downbeat so the kick attack stays whole
o_beat = 0
edit_rows = []
for i, (a, b) in enumerate(EDIT):
    s0 = 0.0 if a == 0 else g(a) - PRE - XF / 2
    s1 = g(b) - PRE + XF / 2
    o0 = 0.0 if o_beat == 0 else g(o_beat) - PRE - XF / 2
    seg = src[int(s0 * SR):int(s1 * SR)].copy()
    nx = int(XF * SR)
    if i > 0:
        seg[:nx] *= np.sin(np.linspace(0, np.pi / 2, nx))[:, None]
    if i < len(EDIT) - 1:
        seg[-nx:] *= np.cos(np.linspace(0, np.pi / 2, nx))[:, None]
    k = int(o0 * SR)
    bed[k:k + len(seg)] += seg
    edit_rows.append({"src_beats": [a, b], "src_s": [round(g(a) if a else 0, 3), round(g(b), 3)],
                      "out_beats": [o_beat, o_beat + b - a], "out_s": [round(g(o_beat) if o_beat else 0, 3), round(g(o_beat + b - a), 3)]})
    o_beat += b - a
bed = bed[:n_out]
fade = int(0.75 * SR)
bed[-fade:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, fade)))[:, None]
write("music/edit/bed.wav", bed, 2)

# ---------------------------------------------------------------- VO placement
lines = json.load(open("vo/lines.json"))["lines"]
L = {l["id"]: l for l in lines}
def onset(lid, word_idx):
    return L[lid]["word_times"][word_idx]["start"]
# shots: (id, line, word index that opens the shot, grid preference, rest/hero flag)
SHOTS = [
    ("S01", "L01", 0, "half", ""), ("S02", "L01", 1, "half", ""), ("S03", "L01", 2, "half", ""),
    ("S04", "L02", 0, "half", ""), ("S05", "L02", 3, "half", ""), ("S06", "L02", 6, "half", ""),
    ("S07", "L03", 0, "half", "★"), ("S08", "L04", 0, "beat", "★"), ("S09", "L05", 0, "half", ""),
    ("S10", "L06", 0, "half", ""), ("S11", "L06", 1, "half", ""), ("S12", "L06", 2, "half", ""),
    ("S13", "L07", 0, "half", ""), ("S14", "L08", 0, "half", ""), ("S15", "L08", 2, "half", ""),
    ("S16", "L08", 3, "half", ""), ("S17", "L09", 0, "half", ""), ("S18", "L09", 5, "half", "★"),
    ("S19", "L10", 0, "half", ""), ("S20", "L10", 2, "half", ""), ("S21", "L10", 6, "half", ""),
    ("S22", "L11", 0, "half", "★"), ("S23", "L12", 0, "beat", ""), ("S24", "L12", 3, "half", ""),
    ("S25", "L12", 6, "beat", ""), ("S26", "L13", 0, "beat", "★"), ("S27", "L14", 0, "beat", "★"),
]
# fixed anchors: the word that must sit just after a given out beat
ANCHOR = {"L04": (0, 23), "L13": (0, 92), "L14": (0, 100)}   # "Meet" on beat 23, drop on "EduLedger" (24); logo; CTA
LEAD = 0.06                                                   # ideal cut-before-word lead (s); allowed −1 frame … 0.20
def grid_pts(kind):
    step = P if kind == "beat" else P / 2
    return PH + np.arange(0, int(60 / step)) * step
GB, GH = grid_pts("beat"), grid_pts("half")
def best_cut(t_word, kind):
    G = GB if kind == "beat" else GH
    lead = t_word - G
    ok = (lead >= -1 / FPS) & (lead <= 0.20)
    if ok.any():
        j = np.where(ok)[0][np.argmin(np.abs(lead[ok] - LEAD))]
        return G[j], (lead[j] - LEAD) ** 2
    j = np.argmin(np.abs(lead))
    return G[j], 1 + lead[j] ** 2
shots_by_line = {}
for s in SHOTS:
    shots_by_line.setdefault(s[1], []).append(s)
SHIFTS = np.round(np.arange(-0.30, 0.3001, 0.005), 3)
ids = [f"L{i:02d}" for i in range(1, 15)]
def options(lid):
    raw = L[lid]["master_in"]
    if lid in ANCHOR:
        w, beat = ANCHOR[lid]
        target = g(beat) + 0.02                                  # word starts 20 ms after its beat
        return [round(target - L[lid]["word_times"][w]["start"] - raw, 3)]
    if lid == "L01":
        return [s for s in SHIFTS if s >= -0.10]                 # "Registers" no earlier than 0.02 s
    return list(SHIFTS)
def line_cost(lid, sh):
    T0 = L[lid]["master_in"] + sh
    c = 0.2 * sh ** 2
    for (_, _, w, kind, _) in shots_by_line.get(lid, []):
        if lid == "L01" and w == 0:
            continue                                             # S01 opens the film at 0
        c += best_cut(T0 + onset(lid, w), kind)[1]
    return c
def gap_ok(prev, sh_prev, cur, sh_cur):
    end_prev = L[prev]["master_in"] + sh_prev + L[prev]["speech_off"]
    start_cur = L[cur]["master_in"] + sh_cur + L[cur]["speech_on"]
    raw_gap = (L[cur]["master_in"] + L[cur]["speech_on"]) - (L[prev]["master_in"] + L[prev]["speech_off"])
    gap = start_cur - end_prev
    return max(0.15, 0.6 * raw_gap) <= gap <= raw_gap + 0.6
# dynamic programme over lines
dp = [{sh: (line_cost(ids[0], sh), None) for sh in options(ids[0])}]
for i in range(1, 14):
    cur = {}
    for sh in options(ids[i]):
        best = None
        for psh, (pc, _) in dp[-1].items():
            if gap_ok(ids[i - 1], psh, ids[i], sh):
                if best is None or pc < best[0]:
                    best = (pc, psh)
        if best:
            cur[sh] = (best[0] + line_cost(ids[i], sh), best[1])
    assert cur, f"no feasible placement for {ids[i]}"
    dp.append(cur)
sh = min(dp[-1], key=lambda k: dp[-1][k][0]); shift = {}
for i in range(13, -1, -1):
    shift[ids[i]] = sh; sh = dp[i][sh][1]
place = {lid: round(L[lid]["master_in"] + shift[lid], 4) for lid in ids}   # file start on the output timeline

# ---------------------------------------------------------------- shots, transitions
PIC = {
 "S01": "3D ledger book (H1) slams onto the grid floor; REGISTERS scales 8× through camera",
 "S02": "Receipt stack (H2) whips in; red", "S03": "Ringing-phone icons multiply across frame; red",
 "S04": "Spreadsheet cells flicker and glitch red", "S05": "Attendance sheet with frantic scribbled ticks",
 "S06": "Call bubbles stack until they overflow the frame",
 "S07": "All chaos collapses to one thin glowing line (the ledger line). Rest beat",
 "S08": "On \"Meet\" the line flares; on the drop (\"EduLedger\") the logo crystallises above it; brand light floods",
 "S09": "Real dashboard screenshot slides up in perspective on the grid", "S10": "Student records UI card pops forward",
 "S11": "Staff & payroll UI card", "S12": "Fee UI card", "S13": "Class grid: present ticks ripple green across it",
 "S14": "3D rupee coin (H3) spins and lands", "S15": "Receipt prints out of a card (real receipt UI)",
 "S16": "Fee-collection bar fills inside the demo dashboard frame (the ledger line becomes the bar)",
 "S17": "Payroll list → cashbook chart morph (cross-warp)", "S18": "Paper stack crumples into particles; breathing beat",
 "S19": "Phone (H4) slides up from below", "S20": "EduLedger chat card types the parent message ✓✓, \"Add-on\" chip",
 "S21": "Three message chips stack on three beats", "S22": "Camera dollies out across the full demo dashboard; stats count up inside the frame",
 "S23": "Kinetic stamp: NO SETUP FEE", "S24": "Shield/lock glyph + stamp: SECURE BY DESIGN",
 "S25": "3D school building (H5), brand light on the façade (no map)",
 "S26": "The ledger line returns; logo crystallises on the return hit; tagline word by word; hold",
 "S27": "CTA card: eduledger.co.in, \"Get started\"; ledger-line underline; hold to the end",
}
# transition INTO each shot (P1 menu by act)
TRANS = {
 "S02": "hard glitch cut", "S03": "hard glitch cut", "S04": "hard glitch cut", "S05": "hard glitch cut", "S06": "hard glitch cut",
 "S07": "morph: chaos collapses into the ledger line", "S08": "line flare → flash through white (drop on next beat)",
 "S09": "light-streak whip (the ledger line)", "S10": "push-in to a card", "S11": "cut-the-curve vertical whip",
 "S12": "cut-the-curve vertical whip", "S13": "light-streak whip", "S14": "light-streak whip",
 "S15": "morph: coin → receipt", "S16": "morph: receipt edge → the ledger line → fee bar", "S17": "light-streak whip",
 "S18": "morph: cashbook pages → paper stack", "S19": "slide-up (phone)", "S20": "push-in to the phone screen",
 "S21": "cut-the-curve vertical whip", "S22": "pull-out (dolly) to the full dashboard", "S23": "hard cut on the stomp",
 "S24": "hard cut on the stomp", "S25": "hard cut on the stomp", "S26": "morph: the ledger line returns (return hit)",
 "S27": "push-in to the CTA card",
}
WHOOSH = {"light-streak whip (the ledger line)", "light-streak whip", "cut-the-curve vertical whip", "slide-up (phone)"}
shots = []
for sid, lid, w, kind, flag in SHOTS:
    t_word = place[lid] + onset(lid, w)
    if sid == "S01":
        cut = 0.0
    else:
        cut, _ = best_cut(t_word, kind)
    word = L[lid]["word_times"][w]["text"]
    shots.append({"id": sid, "flag": flag, "line": lid, "word": word, "word_onset": round(t_word, 3),
                  "start": q(cut), "grid": None if sid == "S01" else ("beat" if abs(((cut - PH) / P) - round((cut - PH) / P)) < 1e-6 else "half"),
                  "beat_no": round((cut - PH) / P, 1), "lead_ms": None if sid == "S01" else round((t_word - cut) * 1000),
                  "picture": PIC[sid], "transition_in": TRANS.get(sid, "film start")})
END = q(g(END_BEAT))
for i, s in enumerate(shots):
    s["end"] = shots[i + 1]["start"] if i + 1 < len(shots) else END
    s["dur"] = round(s["end"] - s["start"], 3)

# ---------------------------------------------------------------- SFX events, anchored to visual events
def word_t(lid, w):
    return place[lid] + onset(lid, w)
def grid_le(t, kind="half"):
    G = GB if kind == "beat" else GH
    return float(G[G <= t + 1 / FPS].max())
S = {s["id"]: s for s in shots}
ev = []
def add(x, t, event):
    ev.append({"sfx": x, "t": q(t), "event": event})
add("X01", grid_le(word_t("L01", 0)), "S01 ledger book lands on the grid (on \"Registers\")")
add("X02", S["S02"]["start"], "S02 receipt stack whips in"); add("X03", S["S03"]["start"], "S03 phone icons burst")
add("X05", S["S04"]["start"], "S04 spreadsheet glitch"); add("X04", S["S05"]["start"], "S05 scribbles start")
add("X04", S["S05"]["start"] + P, "S05 second scribble"); add("X03", S["S06"]["start"], "S06 call bubbles burst")
add("X06", g(24), "S08 impact = drop: logo crystallises on \"EduLedger\" (riser leads in)")
for s in shots:
    if s["transition_in"] in WHOOSH:
        add("X07", s["start"], f"{s['id']} {s['transition_in']}")
for sid in ("S10", "S11", "S12"):
    add("X08", S[sid]["start"] + 0.0, f"{sid} card pops forward")
for k in range(6):
    add("X09", S["S13"]["start"] + P + k * P / 4, f"S13 present tick {k + 1} ripples green")
add("X10", grid_le(word_t("L08", 1)), "S14 coin lands (on \"collected\")")
add("X02", S["S15"]["start"], "S15 receipt prints")
add("X09", grid_le(word_t("L08", 5)), "S16 fee bar completes (on \"real time\")")
add("X14", grid_le(word_t("L09", 7)), "S18 paper crumples into particles (on \"paperwork\")")
add("X11", grid_le(word_t("L10", 5)), "S20 message sent ✓✓ (on \"WhatsApp\")")
for w, name in ((6, "Attendance"), (7, "fee receipts"), (9, "results")):
    add("X08", grid_le(word_t("L10", w)), f"S21 chip \"{name}\" lands")
for k in range(8):
    add("X09", S["S22"]["start"] + P / 2 + k * P / 2, f"S22 stat count-up tick {k + 1}")
for sid in ("S23", "S24", "S25"):
    add("X12", S[sid]["start"], f"{sid} stamp hits")
add("X13", g(92), "S26 logo crystallises on the return hit")
ev.sort(key=lambda e: e["t"])

# ---------------------------------------------------------------- audio renders (preview only)
anch = json.load(open("sfx/placeholder/anchors.json"))
n = len(bed)
vo = np.zeros(n, np.float32)
for lid in ids:
    x = load(L[lid]["file"], 1)[:, 0]
    k = int(round(place[lid] * SR))
    if k < 0:                                                    # leading silence before the film starts
        x = x[-k:]; k = 0
    vo[k:k + len(x)] += x[:max(0, n - k)]
write("out/timeline/vo.wav", vo, 1)
fx = np.zeros(n, np.float32)
for e in ev:
    a = anch[e["sfx"]]; x = load(a["file"], 1)[:, 0]
    k = int((e["t"] - a["anchor"]) * SR)
    if k < 0:
        x = x[-k:]; k = 0
    fx[k:k + len(x)] += x[:max(0, n - k)] * 0.35
write("out/timeline/sfx-placeholder.wav", fx, 1)
# duck the music under the voice (MOTION_PHILOSOPHY §2.6: VO 1.0, SFX ~0.3, music ducked), master −14 LUFS / −1 dBTP
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "out/timeline/vo.wav", "-i", "music/edit/bed.wav", "-i", "out/timeline/sfx-placeholder.wav",
                "-filter_complex",
                "[0:a]loudnorm=I=-16:TP=-3:LRA=11,asplit=2[v][sc];"
                "[1:a]volume=-6dB[m];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=250[md];"
                "[v]aformat=channel_layouts=stereo[vs];[2:a]aformat=channel_layouts=stereo[f];"
                "[vs][md][f]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[out]",
                "-map", "[out]", "-ar", "48000", "out/timeline/preview-mix.wav"], check=True)

# ---------------------------------------------------------------- timeline.json + summary
tl = {"fps": FPS, "length_s": END, "grid": {"bpm": round(60 / P, 3), "period_s": P, "phase_s": PH,
       "measured": "kick attacks in source 15–56 s; music-grid.mjs 127.95 BPM / kick phase 0.032 s; per-section fits agree within 8 ms"},
      "music": {"source": "music/track.mp3", "bed": "music/edit/bed.wav", "edit": edit_rows, "fade_out_s": 0.75,
                "landmarks": {"drop": g(24), "lift": g(56), "break": g(88), "return_hit": g(92), "outro": g(100), "end": END}},
      "vo": [{"id": lid, "file": L[lid]["file"], "start": place[lid], "shift_vs_master_s": shift[lid],
              "speech": [round(place[lid] + L[lid]["speech_on"], 3), round(place[lid] + L[lid]["speech_off"], 3)]} for lid in ids],
      "shots": shots, "sfx": ev, "sfx_source": "PLACEHOLDER synth (sfx/placeholder/) until X01–X14 land"}
json.dump(tl, open("timeline.json", "w"), indent=1, ensure_ascii=False)
cuts = shots[1:]
durs = [s["dur"] for s in shots]
print(f"length {END} s · {len(shots)} shots / {len(cuts)} cuts · avg {np.mean(durs):.2f} s · min {min(durs):.2f} · max {max(durs):.2f} · spread {max(durs)/min(durs):.1f}×")
print(f"cuts on full beats {sum(s['grid']=='beat' for s in cuts)}, half beats {sum(s['grid']=='half' for s in cuts)}; "
      f"lead (cut before word) ms: min {min(s['lead_ms'] for s in cuts)}, max {max(s['lead_ms'] for s in cuts)}, median {np.median([s['lead_ms'] for s in cuts]):.0f}")
print("VO shifts (s):", {k: v for k, v in shift.items()})
for s in shots:
    print(f"{s['id']}{s['flag']:1} {s['start']:6.3f}-{s['end']:6.3f} ({s['dur']:4.2f}) beat {s['beat_no']:5.1f} {str(s['grid']):4} "
          f"lead {str(s['lead_ms']):>4} ms  \"{s['word']}\"  ← {s['transition_in']}")
print(len(ev), "SFX events")
