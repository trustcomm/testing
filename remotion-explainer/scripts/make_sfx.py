# Synthesises the two sound effects the edit uses: a whoosh (transition) and a tick (counter). Deterministic: seeded noise.
# Both are normalised to -1 dBFS peak; the video mixes them so their peak sits 18 dB under the voice's peak (see src/audio.ts).
import wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(7)

def save(name, x):
    x = x / np.max(np.abs(x)) * 10 ** (-1 / 20)
    with wave.open(f"public/sfx/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())

# whoosh: pink-ish noise through a band-pass whose centre sweeps up (300 Hz -> 5 kHz), a bell envelope peaking at 60 %
d = 0.55; n = int(SR * d); t = np.arange(n) / SR
noise = rng.standard_normal(n)
out = np.zeros(n)
blocks = 24; step = n // blocks
for b in range(blocks):
    u = b / (blocks - 1)
    fc = 300 * (5000 / 300) ** u
    sos = butter(2, [fc * 0.6, min(fc * 1.6, SR / 2 - 100)], btype="band", fs=SR, output="sos")
    seg = sosfilt(sos, noise[b * step:(b + 1) * step + 256])[:step]
    out[b * step:b * step + len(seg)] = seg
env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * (0.4 + 0.6 * np.clip(t / (0.6 * d), 0, 1))
save("whoosh", out * env)

# tick: a 1.8 kHz sine burst with a fast exponential decay and a click on the front
d = 0.06; n = int(SR * d); t = np.arange(n) / SR
tick = np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 110) + 0.5 * np.sin(2 * np.pi * 3600 * t) * np.exp(-t * 200)
tick[:12] += np.linspace(0.8, 0, 12)
save("tick", tick)
print("wrote public/sfx/whoosh.wav, tick.wav")
