# Synthesises the sound effects: a soft UI key tick, an odometer ratchet tick, a low whoosh. Deterministic (seeded noise).
import wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(11)

def save(name, x):
    x = x / np.max(np.abs(x)) * 10 ** (-1 / 20)
    with wave.open(f"public/sfx/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())

# key: a short, soft, round click (a damped 900 Hz body with a tiny high tick on the front), like an Apple keyboard tap
d = 0.09; n = int(SR * d); t = np.arange(n) / SR
key = np.sin(2 * np.pi * 900 * t) * np.exp(-t * 70) + 0.35 * np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 260)
key[:8] += np.linspace(0.6, 0, 8)
save("key", key)

# odometer tick: a dry, tiny ratchet click
d = 0.04; n = int(SR * d); t = np.arange(n) / SR
tick = np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 220) + 0.4 * rng.standard_normal(n) * np.exp(-t * 400)
save("tick", tick)

# whoosh: low-passed noise through a band-pass that sweeps 180 Hz -> 2.4 kHz, a soft bell envelope: a gentle transition, not a swish
d = 0.7; n = int(SR * d); t = np.arange(n) / SR
noise = rng.standard_normal(n); out = np.zeros(n)
blocks = 28; step = n // blocks
for b in range(blocks):
    u = b / (blocks - 1); fc = 180 * (2400 / 180) ** u
    sos = butter(2, [fc * 0.55, min(fc * 1.7, SR / 2 - 100)], btype="band", fs=SR, output="sos")
    seg = sosfilt(sos, noise[b * step:(b + 1) * step + 256])[:step]
    out[b * step:b * step + len(seg)] = seg
env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2.2
save("whoosh", out * env)
print("wrote public/sfx/key.wav, tick.wav, whoosh.wav")
