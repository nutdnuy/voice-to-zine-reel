"""Re-transcribe short spots without VAD and with a filler-friendly prompt, to hear what a gap contains.

usage: python transcribe_spots.py <audio> 33.0:34.8 62.6:64.4 ...   (prints recognised tokens@time)
"""
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

m = WhisperModel("large-v3", device="cpu", compute_type="int8")
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.float32)
for spec in sys.argv[2:]:
    s, e = map(float, spec.split(":"))
    segs, _ = m.transcribe(a[int(s * 16000):int(e * 16000)], language="th", word_timestamps=True, vad_filter=False,
                           condition_on_previous_text=False, initial_prompt="เอ่อ อืม อ่า เอ่อ... คือ แบบว่า")
    print(f"[{s}-{e}]", " ".join(f"{w.word}@{s + w.start:.2f}" for g in segs for w in g.words))
