#!/usr/bin/env python3
"""Stage C timing preview: one slate per shot, cut on the timeline's real times, over the preview mix.

Usage: python3 -I scripts/preview_slates.py   (after scripts/timeline.py)
Writes out/timeline/preview.mp4 (1280×720, 30 fps, AAC). Slates only: no film graphics.
Each slate shows the shot, its times, the transition in, the picture, the spoken line, the beat counter
(a box flashes on every beat), the music landmarks and every SFX event as it fires (placeholder sounds).
"""
import json, os, subprocess, textwrap

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
tl = json.load(open("timeline.json"))
lines = {l["id"]: l for l in json.load(open("vo/lines.json"))["lines"]}
D = "out/timeline/slates"; os.makedirs(D, exist_ok=True)
REG, SEMI, BOLD = (f"/usr/share/fonts/opentype/inter/Inter-{w}.otf" for w in ("Regular", "SemiBold", "Bold"))
P, PH = tl["grid"]["period_s"], tl["grid"]["phase_s"]
f = []
def txt(name, s):
    p = f"{D}/{name}.txt"; open(p, "w").write(s); return p
def draw(textfile, font, size, x, y, color, a, b):
    f.append(f"drawtext=fontfile={font}:textfile={textfile}:fontsize={size}:x={x}:y={y}:fontcolor={color}:"
             f"enable='between(t,{a:.3f},{b - 0.001:.3f})'")
for s in tl["shots"]:
    a, b = s["start"], s["end"]
    head = f"{s['id']}{' ' + s['flag'] if s['flag'] else ''}"
    draw(txt(s["id"] + "_h", head), BOLD, 64, 60, 60, "white", a, b)
    draw(txt(s["id"] + "_t", f"{a:.3f}–{b:.3f} s   ({s['dur']:.2f} s)   cut on {s['grid'] or 'start'} {s['beat_no']}"), REG, 26, 60, 140, "0xA9B4CC", a, b)
    draw(txt(s["id"] + "_x", "IN: " + s["transition_in"]), SEMI, 28, 60, 190, "0x8C9CFF", a, b)
    draw(txt(s["id"] + "_p", "\n".join(textwrap.wrap(s["picture"], 62))), REG, 30, 60, 250, "white", a, b)
    vo = lines[s["line"]]["script"]
    draw(txt(s["id"] + "_v", "VO " + s["line"] + ":  " + "\n".join(textwrap.wrap(vo, 58))), SEMI, 30, 60, 470, "0x7FE0C0", a, b)
# landmarks
lm = tl["music"]["landmarks"]
for name, t0, t1 in (("DROP", lm["drop"], lm["drop"] + 1.0), ("BREAK", lm["break"], lm["return_hit"]),
                     ("RETURN HIT", lm["return_hit"], lm["return_hit"] + 1.0), ("OUTRO", lm["outro"], lm["outro"] + 1.0)):
    draw(txt("lm_" + name.replace(" ", "_"), name), BOLD, 40, "w-tw-60", 60, "0xFFB84D", t0, t1)
# SFX events
for i, e in enumerate(tl["sfx"]):
    draw(txt(f"sfx{i}", e["sfx"]), BOLD, 30, "w-tw-60", 640, "0xFF6B6B", e["t"], e["t"] + 0.25)
# beat counter + flash, timecode, label
f.append(f"drawbox=x=1180:y=130:w=40:h=40:color=0xFFFFFF@0.9:t=fill:enable='lt(mod(t-{PH},{P}),0.07)'")
f.append(f"drawtext=fontfile={REG}:text='beat %{{eif\\:floor((t-{PH})/{P})\\:d}}':fontsize=26:x=w-tw-120:y=137:fontcolor=0xA9B4CC")
f.append(f"drawtext=fontfile={REG}:text='%{{pts\\:hms}}':fontsize=26:x=60:y=660:fontcolor=0xA9B4CC")
f.append(f"drawtext=fontfile={REG}:textfile={txt('label', 'TIMING PREVIEW - placeholder slates and SFX, real VO and music')}:fontsize=20:x=(w-tw)/2:y=690:fontcolor=0x6B7690")
open(f"{D}/filters.txt", "w").write(",\n".join(f))
L = tl["length_s"]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=0x07111f:s=1280x720:r=30:d={L}",
                "-i", "out/timeline/preview-mix.wav", "-filter_complex_script", f"{D}/filters.txt",
                "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23",
                "-c:a", "aac", "-b:a", "192k", "-shortest", "out/timeline/preview.mp4"], check=True)
print("out/timeline/preview.mp4")
