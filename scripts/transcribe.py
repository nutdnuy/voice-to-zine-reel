"""Transcribe a voice take (faster-whisper large-v3, local) and report what an editor needs.

usage: python transcribe.py <audio> <out dir> [--lang th]
writes <out>/voice-orig.json  {duration, lines: [{id, text, t0, t1, words: [{w, t0, t1}]}]}  (ids l01, l02, ...)
prints every line, silences >= 0.30 s, and voiced stretches with no recognised word (fillers, false starts,
breaths) -- the candidates to inspect with envelope.py before cutting.
Thai note: whisper's Thai "words" are character groups; use their times, not their spelling.
"""
import json
import os
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

src, out = sys.argv[1], sys.argv[2]
lang = sys.argv[sys.argv.index("--lang") + 1] if "--lang" in sys.argv else "th"
os.makedirs(out, exist_ok=True)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.float32)   # pass samples, not a path: some PyAV builds break faster-whisper's decoder
m = WhisperModel("large-v3", device="cpu", compute_type="int8")
segs, info = m.transcribe(a, language=lang, word_timestamps=True, vad_filter=True)
lines = []
for i, s in enumerate(segs):
    lines.append({"id": f"l{i + 1:02d}", "text": s.text.strip(), "t0": round(s.start, 3), "t1": round(s.end, 3),
                  "words": [{"w": w.word.strip(), "t0": round(w.start, 3), "t1": round(w.end, 3)} for w in s.words]})
dur = len(a) / 16000
json.dump({"duration": round(dur, 3), "lines": lines}, open(os.path.join(out, "voice-orig.json"), "w"), ensure_ascii=False)
print(f"duration {dur:.2f}s, {len(lines)} lines -> {out}/voice-orig.json")
for l in lines:
    print(f"  {l['id']} [{l['t0']:7.2f}-{l['t1']:7.2f}] {l['text']}")

hop = 160
db = 20 * np.log10(np.array([np.sqrt(np.mean(a[i:i + hop] ** 2)) + 1e-9 for i in range(0, len(a) - hop, hop)]))
voiced = db > np.percentile(db, 95) - 30
cov = np.zeros_like(voiced)
for l in lines:
    for w in l["words"]:
        cov[int(w["t0"] * 100):int(w["t1"] * 100) + 1] = True


def runs(mask):
    r, i = [], 0
    while i < len(mask):
        if mask[i]:
            j = i
            while j < len(mask) and mask[j]:
                j += 1
            r.append((i / 100, j / 100)); i = j
        else:
            i += 1
    return r


print("SILENCES >= 0.30 s (dead-air candidates):")
for s, e in runs(~voiced):
    if e - s >= 0.30:
        print(f"  {s:7.2f}-{e:7.2f}  {e - s:.2f}s")
print("VOICED BUT NO WORD >= 0.12 s (filler / false-start candidates — inspect, then transcribe the spot):")
for s, e in runs(voiced & ~cov):
    if e - s >= 0.12:
        print(f"  {s:7.2f}-{e:7.2f}  {e - s:.2f}s")
