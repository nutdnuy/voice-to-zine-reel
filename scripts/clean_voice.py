"""Clean a voice take: explicit cuts (flubs, dropped lines), dead-air compression, an optional reused closing line.

usage: python clean_voice.py <audio> <voice-orig.json> <edit.json> <project dir>
edit.json (all keys optional except cuts):
  {
    "cuts": [[63.34, 63.90, "false start"], [44.40, 51.06, "drop l16-l19"]],   # ORIGINAL-take seconds, placed on dips (envelope.py)
    "drop_lines": ["l16", "l17"],        # lines removed by the cuts (also removed from captions)
    "reveal_line": "l11",                # the silence before this line is kept at reveal_pause (the payoff)
    "reveal_pause": 0.45,
    "pause_between": 0.28, "pause_inside": 0.16, "lead": 0.25, "tail": 0.9,
    "button": [33.00, 34.42],            # ORIGINAL-take span re-used after a silent end card (or null)
    "gap_before_button": 1.9, "tail_after_button": 2.0
  }
writes <project>/voice/voice.wav, <project>/voice.json (cleaned timings, the build injects it as VOICE) and
<project>/edl.json (kept spans [old start, old end, new start], speech_end, button placement).
Every join is a 20 ms equal-power crossfade. Re-transcribe the result to prove no word was clipped.
"""
import json
import os
import subprocess
import sys

import numpy as np

SR = 48000
src, vjson, ejson, out = sys.argv[1:5]
E = json.load(open(ejson))
V = json.load(open(vjson))
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.float32).copy()
dur = len(a) / SR
P_BETWEEN, P_INSIDE = E.get("pause_between", 0.28), E.get("pause_inside", 0.16)
LEAD, TAIL, REVEAL_PAUSE = E.get("lead", 0.25), E.get("tail", 0.9), E.get("reveal_pause", 0.45)
reveal_t0 = next((l["t0"] for l in V["lines"] if l["id"] == E.get("reveal_line")), None)
drop = set(E.get("drop_lines", []))

hop = SR // 100
db = np.array([20 * np.log10(np.sqrt(np.mean(a[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(a) - hop, hop)])
quiet = db < np.percentile(db, 95) - 30
sil, i = [], 0
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]:
            j += 1
        if j - i >= 25:
            sil.append((i / 100, j / 100))
        i = j
    else:
        i += 1
kept_lines = [l for l in V["lines"] if l["id"] not in drop]
bounds = [(l["t0"], l["t1"]) for l in V["lines"]]
first, last = kept_lines[0]["t0"], kept_lines[-1]["t1"]
inside = lambda s, e: any(t0 + 0.05 < (s + e) / 2 < t1 - 0.05 for t0, t1 in bounds)

remove = [(s, e, why) for s, e, why in E["cuts"]]
for s, e in sil:
    if e <= first + 0.3:
        remove.append((0.0, max(0.0, e - LEAD), "lead-in")); continue
    if s >= last - 0.3:
        if e - s > TAIL:
            remove.append((s + TAIL, dur, "tail"))
        continue
    keep = REVEAL_PAUSE if (reveal_t0 is not None and abs(e - reveal_t0) < 0.35) else (P_INSIDE if inside(s, e) else P_BETWEEN)
    if e - s > keep + 0.04:
        remove.append((s + keep / 2, e - keep / 2, "pause"))
remove.sort()
merged = []
for s, e, why in remove:
    if merged and s <= merged[-1][1]:
        merged[-1] = (merged[-1][0], max(merged[-1][1], e), merged[-1][2] + "+" + why)
    else:
        merged.append((s, e, why))
keep, t = [], 0.0
for s, e, _ in merged:
    if s > t:
        keep.append((t, s))
    t = max(t, e)
if t < dur:
    keep.append((t, dur))

xf = int(0.02 * SR)
buf = np.zeros(0, np.float32)
for s, e in keep:
    seg = a[int(s * SR):int(e * SR)].copy()
    if len(buf) >= xf and len(seg) >= xf:
        r = np.linspace(0, 1, xf, dtype=np.float32)
        buf = np.concatenate([buf[:-xf], buf[-xf:] * np.cos(r * np.pi / 2) + seg[:xf] * np.sin(r * np.pi / 2), seg[xf:]])
    else:
        buf = np.concatenate([buf, seg])
offsets, t_new = [], 0.0
for k, (s, e) in enumerate(keep):
    offsets.append((s, e, t_new))
    t_new += (e - s) - (0.02 if k < len(keep) - 1 else 0)
speech_end = t_new
button = None
if E.get("button"):
    b0, b1 = E["button"]
    seg = a[int(b0 * SR):int(b1 * SR)].copy()
    r = np.linspace(0, 1, int(0.01 * SR), dtype=np.float32); seg[:len(r)] *= r; seg[-len(r):] *= r[::-1]
    at = len(buf) / SR + E.get("gap_before_button", 1.9)
    buf = np.concatenate([buf, np.zeros(int(E.get("gap_before_button", 1.9) * SR), np.float32), seg, np.zeros(int(E.get("tail_after_button", 2.0) * SR), np.float32)])
    btext = next((l["text"] for l in V["lines"] if l["t0"] <= b0 + 0.3 and l["t1"] >= b1 - 0.6), "")
    button = {"old": [b0, b1], "at": round(at, 3), "end": round(at + b1 - b0, 3), "text": btext}
new_dur = len(buf) / SR


def remap(t):
    for s, e, n0 in offsets:
        if t < s:
            return n0
        if t <= e:
            return n0 + (t - s)
    return speech_end


lines = []
for l in V["lines"]:
    if l["id"] in drop:
        continue
    lines.append({**l, "t0": round(remap(l["t0"]), 3), "t1": round(remap(l["t1"]), 3),
                  "words": [{"w": w["w"], "t0": round(remap(w["t0"]), 3), "t1": round(remap(w["t1"]), 3)} for w in l["words"]]})
os.makedirs(os.path.join(out, "voice"), exist_ok=True)
pcm = (np.clip(buf, -1, 1) * 32767).astype("<i2").tobytes()
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", os.path.join(out, "voice", "voice.wav")], input=pcm, check=True)
json.dump({"duration": round(new_dur, 3), "lines": lines}, open(os.path.join(out, "voice.json"), "w"), ensure_ascii=False)
json.dump({"keep": [[round(s, 3), round(e, 3), round(n0, 3)] for s, e, n0 in offsets], "old_duration": round(dur, 3),
           "new_duration": round(new_dur, 3), "speech_end": round(speech_end, 3), "button": button,
           "removed": [[round(s, 3), round(e, 3), why] for s, e, why in merged]}, open(os.path.join(out, "edl.json"), "w"), ensure_ascii=False, indent=1)
print(f"old {dur:.2f}s -> new {new_dur:.2f}s; {len(merged)} cuts ({dur - new_dur:.2f}s removed); speech ends {speech_end:.2f}s" + (f"; button at {button['at']}s" if button else ""))
for s, e, why in merged:
    if set(why.split("+")) != {"pause"}:
        print(f"  cut {s:7.2f}-{e:7.2f} ({e - s:.2f}s) {why}")
