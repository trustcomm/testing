# Synthesises the sound effects (deterministic, seeded noise): tick (odometer / stopwatch ratchet), whoosh (scene change), ding
# (a soft glass "ting" for a result landing), thud (a low hit for the big numbers), pop (an element appearing).
import os
import wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(11)
os.makedirs("public/sfx", exist_ok=True)

def save(name, x):
    x = x / np.max(np.abs(x)) * 10 ** (-1 / 20)
    with wave.open(f"public/sfx/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())

def tt(d): return np.arange(int(SR * d)) / SR

# tick: a dry, tiny ratchet click
t = tt(0.04); n = len(t)
save("tick", np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 220) + 0.4 * rng.standard_normal(n) * np.exp(-t * 400))

# whoosh: band-passed noise whose centre sweeps 180 Hz -> 2.4 kHz under a soft bell envelope
d = 0.7; t = tt(d); n = len(t)
noise = rng.standard_normal(n); out = np.zeros(n); blocks = 28; step = n // blocks
for b in range(blocks):
    fc = 180 * (2400 / 180) ** (b / (blocks - 1))
    sos = butter(2, [fc * 0.55, min(fc * 1.7, SR / 2 - 100)], btype="band", fs=SR, output="sos")
    seg = sosfilt(sos, noise[b * step:(b + 1) * step + 256])[:step]
    out[b * step:b * step + len(seg)] = seg
save("whoosh", out * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2.2)

# ding: two inharmonic sine partials (E6 + a stretched 2nd) with a quick attack and a 0.7 s decay
t = tt(0.9)
ding = (np.sin(2 * np.pi * 1318.5 * t) * np.exp(-t * 6.5) + 0.45 * np.sin(2 * np.pi * 1318.5 * 2.76 * t) * np.exp(-t * 11) + 0.18 * np.sin(2 * np.pi * 1318.5 * 5.4 * t) * np.exp(-t * 20))
ding[:int(SR * 0.002)] *= np.linspace(0, 1, int(SR * 0.002))
save("ding", ding)

# thud: a short sub hit (90 Hz gliding to 48 Hz) with a soft noise transient
t = tt(0.45); n = len(t)
f = 48 + 42 * np.exp(-t * 28)
thud = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) + 0.25 * sosfilt(butter(2, 900, btype="low", fs=SR, output="sos"), rng.standard_normal(n)) * np.exp(-t * 90)
save("thud", thud)

# pop: a soft bubble, 640 Hz gliding down to 380 Hz in 80 ms
t = tt(0.14)
f = 380 + 260 * np.exp(-t * 38)
pop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 34)
pop[:int(SR * 0.002)] *= np.linspace(0, 1, int(SR * 0.002))
save("pop", pop)
print("wrote public/sfx/{tick,whoosh,ding,thud,pop}.wav")
