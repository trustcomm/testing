"""Render the project's sound effects to assets/sfx/*.wav. The sounds are synthesised by the Baqur reel kit's own synth
(baqur-reel-kit/scripts/make_sfx.py, same repo), so no downloads and no third-party licences.
usage: python scripts/render_sfx.py <path to make_sfx.py>"""
import sys, os, numpy as np, soundfile as sf
src = open(sys.argv[1]).read(); src = src[:src.index("\nGAIN = ")]
# keep the imports, the constants and the sound functions; drop the kit's command line and file loading
a, b = src.index("\nap = argparse"), src.index("\nrng = ")
src = src[:a] + "\nDUR = 60; N = 61 * SR" + src[b:]
ns = {"__name__": "kit_synth"}; exec(compile(src, "make_sfx", "exec"), ns)
out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "sfx"); os.makedirs(out, exist_ok=True)
for name in ["hit", "sub", "whoosh", "swish", "riser", "pop", "tick", "type", "chime", "check", "toggle", "glitch", "deny", "lock", "scan", "flip"]:
    r = ns["s_" + name](); x = np.asarray(r[0] if isinstance(r, tuple) else r); x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    sf.write(os.path.join(out, name + ".wav"), x.astype("float32"), ns["SR"], subtype="PCM_24"); print(name, round(len(x) / ns["SR"], 2), x.ndim)
