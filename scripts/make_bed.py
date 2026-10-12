"""Story-shaped music bed — a variant of Nuth's own Video OS make_bgm.py (quant101-bed; original work, no samples).

usage: python make_bed.py <sfx/events.json (has "music" cues from the page)> <out.wav>
Changes vs the original: length = the reel, drum breaks on the story (tension before "Brownian Motion",
quiet under "he never knew" until the closing button), its own cut whooshes/ticks removed (the reel has its own SFX).

Original docstring follows.
Original procedural BGM for the "Quant คืออะไร" Reel.

96 BPM, 4/4, 60 s. One shot = 6 beats = 3.75 s, so every cut lands on a beat.
Fully synthesized here (no samples) -> no third-party license needed.
"""
import json
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
BPM = 96
BEAT = 60 / BPM            # 0.625 s
CUES = json.load(open(sys.argv[1]))["music"]
DUR = float(CUES["duration"]) + 0.2
SHOT = 6 * BEAT            # 3.75 s
N = int(SR * DUR)
rng = np.random.default_rng(7)


def t_arr(sec):
    return np.arange(int(sec * SR)) / SR


def env_adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n); e[:na] = np.linspace(0, 1, na)
    nd = min(nd, n - na); e[na:na + nd] = np.linspace(1, s, nd)
    if nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lowpass(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), btype="low")
    return lfilter(b, a, x)


def highpass(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), btype="high")
    return lfilter(b, a, x)


def add(buf, sig, start):
    i = int(start * SR)
    j = min(len(buf), i + len(sig))
    if i < len(buf):
        buf[i:j] += sig[: j - i]


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


# ---- instruments -----------------------------------------------------------
def kick():
    t = t_arr(0.35)
    f = 110 * np.exp(-t * 28) + 42
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) * 0.9


def hat(open_=False):
    t = t_arr(0.18 if open_ else 0.05)
    n = highpass(rng.standard_normal(len(t)), 7000)
    return n * np.exp(-t * (18 if open_ else 70)) * 0.18


def clap():
    t = t_arr(0.22)
    n = highpass(rng.standard_normal(len(t)), 1200)
    e = np.exp(-t * 22)
    for k in (0.0, 0.012, 0.024):  # flam
        e += np.exp(-np.maximum(t - k, 0) * 60) * (t >= k) * 0.5
    return lowpass(n, 6000) * e * 0.22


def pad(notes, sec):
    t = t_arr(sec)
    s = np.zeros_like(t)
    for m in notes:
        f = midi(m)
        for det in (-0.12, 0.0, 0.12):  # detuned saws
            ph = (f * (1 + det / 100) * t) % 1.0
            s += 2 * ph - 1
    s = lowpass(s / (len(notes) * 3), 1400, order=2)
    return s * env_adsr(len(t), a=0.4, d=0.3, s=0.8, r=0.6) * 0.16


def bass(m, sec):
    t = t_arr(sec)
    f = midi(m)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)
    return s * env_adsr(len(t), a=0.005, d=0.15, s=0.6, r=0.08) * 0.28


def pluck(m, sec=0.35):
    t = t_arr(sec)
    f = midi(m)
    s = (2 * ((f * t) % 1.0) - 1) * 0.6 + np.sin(2 * np.pi * f * t)
    s = lowpass(s, 2600)
    return s * np.exp(-t * 11) * 0.10


def tick():
    t = t_arr(0.08)
    return np.sin(2 * np.pi * 1760 * t) * np.exp(-t * 60) * 0.12


def whoosh(sec=0.45):
    t = t_arr(sec)
    n = rng.standard_normal(len(t))
    sweep = np.linspace(400, 5000, len(t))
    out = np.zeros_like(n)
    # crude time-varying filter: blend of two bands
    lo, hi = lowpass(n, 900), highpass(n, 3000)
    mix = np.linspace(0, 1, len(t))
    out = lo * (1 - mix) + hi * mix
    return out * np.sin(np.pi * t / sec) ** 2 * 0.10 * (sweep / sweep.max())


# ---- arrangement -----------------------------------------------------------
# Am - F - C - G, one chord per bar (4 beats)
PROG = [
    ([57, 60, 64, 67], 45),  # Am7
    ([53, 57, 60, 64], 41),  # Fmaj7
    ([48, 52, 55, 59], 36),  # Cmaj7
    ([55, 59, 62, 65], 43),  # G7
]
ARP = [0, 1, 2, 3, 2, 1, 3, 2]  # 8th-note arp pattern index into chord

music = np.zeros(N)
drums = np.zeros(N)
bar_len = 4 * BEAT
n_bars = int(np.ceil(DUR / bar_len))

BREAKS = [(CUES["payoff"] - 2.6, CUES["payoff"]),               # drums out: tension into the payoff
          (CUES["quiet_from"], CUES["button"])]                    # drums out: the reflective close + silent end card
in_any = lambda t: any(a <= t < b for a, b in BREAKS)

for b in range(n_bars):
    t0 = b * bar_len
    chord, root = PROG[b % 4]
    add(music, pad(chord, bar_len + 0.6), t0)
    in_break = in_any(t0)
    if t0 >= SHOT:  # bass from shot 2
        for k in (0, 1.5, 2, 3.5):
            add(music, bass(root, BEAT * 0.9 if k in (0, 2) else BEAT * 0.45), t0 + k * BEAT)
    if t0 >= 6 * SHOT and not in_break:  # arp from step section
        for i in range(8):
            add(music, pluck(chord[ARP[i]] + 12), t0 + i * BEAT / 2)
    for beat in range(4):
        tb = t0 + beat * BEAT
        if tb >= DUR - 1.0:
            continue
        if in_any(tb):
            continue
        if tb >= SHOT * 0.999:
            if beat in (0, 2):
                add(drums, kick(), tb)
            if beat in (1, 3) and tb >= 2 * SHOT:
                add(drums, clap(), tb)
        add(drums, hat(), tb + BEAT / 2)
        if tb >= SHOT:
            add(drums, hat(), tb)

# Cut accents: whoosh into each cut, tick on the cut
sfx = np.zeros(N)   # the reel carries its own SFX: no cut accents here

mix = music + drums * 0.9 + sfx
# gentle master: fade in/out, soft clip, normalise to -1 dBFS peak
fade_in = int(0.3 * SR)
fade_out = int(1.8 * SR)
mix[:fade_in] *= np.linspace(0, 1, fade_in)
mix[-fade_out:] *= np.linspace(1, 0, fade_out)
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix = mix / np.max(np.abs(mix)) * 10 ** (-1 / 20)

stereo = np.stack([mix, np.roll(mix, int(0.004 * SR)) * 0.98], axis=1)
out = sys.argv[2] if len(sys.argv) > 2 else "bgm.wav"
wavfile.write(out, SR, (stereo * 32767).astype(np.int16))
print("wrote", out, f"{DUR}s @ {BPM} BPM")
