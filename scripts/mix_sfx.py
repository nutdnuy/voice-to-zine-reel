"""Mix a cleaned voice with event-placed sound effects (no music).

usage: python mix_sfx.py <piece dir> [--music <bed.wav>] [--out <name.wav>]
reads  <piece>/voice/voice.wav, <piece>/sfx/events.json ([file, time, peak dB]), <piece>/sfx/<files>
writes <piece>/renders/mix.wav (master: voice peak -6 dBFS before mastering, each effect at its own peak,
       then a gentle compressor + loudnorm to -14 LUFS / -1.5 dBTP for Reels)
"""
import json
import os
import subprocess
import sys

import numpy as np

SR = 48000
root = sys.argv[1]
opt = lambda k: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else None
MUSIC, OUTNAME = opt("--music"), opt("--out") or "mix.wav"


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


ev = json.load(open(os.path.join(root, "sfx", "events.json")))
n = int(ev["duration"] * SR)
voice = load(os.path.join(root, "voice", "voice.wav"))[:n]
voice = np.pad(voice, ((0, n - len(voice)), (0, 0)))
voice *= 10 ** (-6 / 20) / (np.abs(voice).max() + 1e-9)

cache, bus, missing = {}, np.zeros((n, 2), np.float32), set()
for f, t, db in ev["events"]:
    if not os.path.exists(os.path.join(root, "sfx", f)):
        missing.add(f); continue   # an optional effect not installed: skip it, report below
    if f not in cache:
        x = load(os.path.join(root, "sfx", f))
        cache[f] = x / (np.abs(x).max() + 1e-9)
    x = cache[f] * 10 ** (db / 20)
    i = int(round(t * SR))
    if i >= n:
        continue
    m = min(len(x), n - i)
    bus[i:i + m] += x[:m]

mix = voice + bus
if MUSIC:   # Nuth's standard: music about -20 dB peak, a vocal pocket at 2.5 kHz, ducked under the voice
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", MUSIC, "-af", "equalizer=f=2500:t=q:w=1.2:g=-5", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    mu = np.frombuffer(raw, np.float32).reshape(-1, 2).copy()[:n]
    mu = np.pad(mu, ((0, n - len(mu)), (0, 0)))
    mu *= 10 ** (-20 / 20) / (np.abs(mu).max() + 1e-9)
    hop = SR // 100   # 10 ms voice envelope -> duck 6 dB with 40 ms attack / 400 ms release
    env = np.array([np.abs(voice[i:i + hop]).max() for i in range(0, n, hop)]) > 0.02
    g, out_g = 1.0, []
    for on in env:
        target = 10 ** (-6 / 20) if on else 1.0
        g += (target - g) * (0.25 if target < g else 0.025)
        out_g.append(g)
    gain = np.repeat(np.array(out_g, np.float32), hop)[:n]
    fade = int(1.5 * SR); gain[-fade:] *= np.linspace(1, 0, fade)
    mix = mix + mu * gain[:, None]
os.makedirs(os.path.join(root, "renders"), exist_ok=True)
tmp = os.path.join(root, "renders", "mix-pre.wav")
pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes()
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", tmp], input=pcm, check=True)
out = os.path.join(root, "renders", OUTNAME)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af",
                "highpass=f=60,acompressor=threshold=0.1:ratio=2.5:attack=10:release=200:makeup=2,loudnorm=I=-14:TP=-1.5:LRA=11",
                "-ar", str(SR), out], check=True)
print("events", len(ev["events"]), "->", out)
if missing:
    print("skipped (file not in sfx/):", ", ".join(sorted(missing)))
