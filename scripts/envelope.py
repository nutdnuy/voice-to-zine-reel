"""Print a 20 ms loudness envelope (dBFS) for chosen windows, to place cuts on natural dips.

usage: python envelope.py <audio> 63.1:64.3 96.0:97.0 ...
Values <= -50 are silence; a stop consonant (ต ก ป ค ...) shows as a short dip before its word.
"""
import subprocess
import sys

import numpy as np

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.float32)
for spec in sys.argv[2:]:
    s, e = map(float, spec.split(":"))
    row = []
    for t in np.arange(s, e, 0.02):
        seg = a[int(t * 16000):int((t + 0.02) * 16000)]
        d = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)
        row.append(f"{t:.2f}:{d:4.0f}" + ("*" if d <= -50 else ""))
    print(" ".join(row)); print()
