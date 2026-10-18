# Mastering: the Remotion mixdown (voice + music + effects, 48 kHz WAV) is measured, lifted to -16 LUFS integrated with one static
# gain and a transparent peak limiter at -1.5 dBFS, and encoded once to AAC 320 kbit/s. The voiceover file itself is quiet (-27 LUFS),
# so without this the reel would play 10 dB under everything else in a feed.
# usage: python3 -I scripts/master.py <mix.wav> <out.m4a> [target_lufs=-16]
import re, subprocess, sys

src, out = sys.argv[1], sys.argv[2]
target = float(sys.argv[3]) if len(sys.argv) > 3 else -16.0
meas = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
m = re.search(r"Integrated loudness:\s+I:\s+(-?[\d.]+) LUFS", meas)
if not m: sys.exit("could not measure " + src)
loud = float(m.group(1)); gain = min(14.0, target - loud)
print(f"mix {loud:.1f} LUFS -> +{gain:.1f} dB (target {target} LUFS)")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-af", f"volume={gain}dB,alimiter=limit=0.841:attack=5:release=80:level=disabled", "-ar", "48000", "-c:a", "aac", "-b:a", "320k", "-aac_coder", "fast", "-cutoff", "20000", out], check=True)
chk = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", out, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
i = re.search(r"Integrated loudness:\s+I:\s+(-?[\d.]+) LUFS", chk); p = re.search(r"True peak:\s+Peak:\s+(-?[\d.]+) dBFS", chk)
print(f"{out}: {i.group(1) if i else '?'} LUFS, true peak {p.group(1) if p else '?'} dBFS")
