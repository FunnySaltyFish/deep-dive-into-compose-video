"""Synthesize SFX + background music and mix them with the narration.

Usage: python tools/mix.py  -> build/mix.wav
Inputs: build/timing.json (narration placement), build/sfx.json (cue list dumped by render.py).
All sounds are generated procedurally here, so there are no licensing questions.
"""
import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a, r):
    """attack/exponential release envelope"""
    x = np.arange(n) / SR
    e = np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / r)
    return e


def lowpass(x, cut):
    # one-pole lowpass, good enough for soft textures
    a = np.exp(-2 * np.pi * cut / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def sweep_noise(d, f0, f1, gain):
    n = int(d * SR)
    noise = rng.standard_normal(n)
    # band emphasis by mixing two lowpasses with a moving cutoff (cheap)
    out = np.zeros(n)
    acc_l, acc_h = 0.0, 0.0
    for i in range(n):
        f = f0 + (f1 - f0) * i / n
        a = np.exp(-2 * np.pi * f / SR)
        acc_l = (1 - a) * noise[i] + a * acc_l
        a2 = np.exp(-2 * np.pi * f * 0.35 / SR)
        acc_h = (1 - a2) * noise[i] + a2 * acc_h
        out[i] = acc_l - acc_h
    shape = np.sin(np.pi * np.arange(n) / n) ** 1.6
    return out * shape * gain


def make_sfx():
    s = {}
    t = t_(0.09)
    s["tap"] = (np.sin(2 * np.pi * 180 * t * (1 - t * 3)) * env(len(t), 0.002, 0.025) * 0.9
                + lowpass(rng.standard_normal(len(t)), 3000) * env(len(t), 0.001, 0.01) * 0.5)
    t = t_(0.12)
    s["tick"] = np.sin(2 * np.pi * 1850 * t) * env(len(t), 0.001, 0.018) * 0.35
    t = t_(0.25)
    f = 520 * (1 + 0.9 * np.exp(-t * 40))
    s["pop"] = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 0.06) * 0.5
    s["whoosh"] = sweep_noise(0.55, 300, 2400, 0.9)
    s["swoosh"] = sweep_noise(0.8, 600, 3600, 0.6)
    t = t_(0.9)
    s["burst"] = (sweep_noise(0.9, 4000, 500, 0.8)
                  + np.sin(2 * np.pi * 70 * t) * env(len(t), 0.005, 0.18) * 0.6)
    t = t_(1.6)
    s["ding"] = sum(np.sin(2 * np.pi * fr * t) * w for fr, w in [(1318.5, 0.5), (1975.5, 0.25), (2637, 0.12)]) * env(len(t), 0.003, 0.45) * 0.35
    t = t_(2.2)
    sub = np.sin(2 * np.pi * 55 * t) * env(len(t), 0.01, 0.5) * 0.7
    bell = sum(np.sin(2 * np.pi * fr * t) * w for fr, w in [(659.3, 0.4), (987.8, 0.25), (1318.5, 0.12)]) * env(len(t), 0.004, 0.7) * 0.4
    sw = np.zeros(len(t)); sw[: int(0.9 * SR)] = sweep_noise(0.9, 400, 4000, 0.5)
    s["chapter"] = sub + bell + sw
    t = t_(0.35)
    f = 420 * np.exp(-t * 4)
    s["remove"] = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.003, 0.1) * 0.45
    return s


def make_music(dur):
    """Soft, slow electronic pad + sparse plucked arpeggio. Am - F - C - G at 84 bpm."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    beat = 60 / 84
    bar = beat * 4
    chords = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    # pad: detuned saws through lowpass, crossfaded per bar
    for b in range(int(dur / bar) + 2):
        t0 = b * bar
        i0, i1 = int(max(0, t0 - 0.6) * SR), int(min(dur, t0 + bar + 0.6) * SR)
        if i0 >= n:
            break
        tt = t[i0:i1] - t0
        seg = np.zeros(i1 - i0)
        for m in chords[b % 4]:
            for det in (-0.08, 0.08):
                ph = 2 * np.pi * hz(m - 12) * (1 + det / 100) * tt
                seg += (np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph))
        fade = np.clip(np.minimum((tt + 0.6) / 1.2, (bar + 0.6 - tt) / 1.2), 0, 1)
        out[i0:i1] += seg * fade * 0.018
    # pluck arpeggio, 8th notes, every other bar busier
    pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    step = beat / 2
    for k in range(int(dur / step)):
        b = int(k * step / bar)
        if (k % 8) in (5,) and b % 2 == 0:
            continue
        m = chords[b % 4][pattern[k % 8]] + 12
        i0 = int(k * step * SR)
        d = min(int(1.2 * SR), n - i0)
        if d <= 0:
            break
        tt = np.arange(d) / SR
        note = (np.sin(2 * np.pi * hz(m) * tt) + 0.3 * np.sin(2 * np.pi * 2 * hz(m) * tt)) * env(d, 0.004, 0.28)
        out[i0:i0 + d] += note * 0.03 * (0.8 + 0.2 * np.sin(k))
    # sub pulse on the downbeat
    for b in range(int(dur / bar) + 1):
        i0 = int(b * bar * SR)
        d = min(int(0.8 * SR), n - i0)
        if d <= 0:
            break
        tt = np.arange(d) / SR
        out[i0:i0 + d] += np.sin(2 * np.pi * hz(chords[b % 4][0] - 24) * tt) * env(d, 0.01, 0.35) * 0.05
    return out


def movavg(x, k):
    """O(N) centered moving average (np.convolve with a long kernel is far too slow for 17 min of audio)."""
    c = np.cumsum(np.concatenate([np.zeros(1), x]))
    h = k // 2
    i = np.arange(len(x))
    lo, hi = np.clip(i - h, 0, len(x)), np.clip(i + h + 1, 0, len(x))
    return (c[hi] - c[lo]) / (hi - lo)


def read_wav(p):
    with wave.open(str(p), "rb") as w:
        sr = w.getframerate()
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    if sr != SR:  # linear resample 24k -> 48k
        x = np.arange(len(a)) / sr
        a = np.interp(np.arange(int(len(a) * SR / sr)) / SR, x, a)
    return a


def main():
    timing = json.loads((ROOT / "build" / "timing.json").read_text(encoding="utf-8"))
    sfx_list = json.loads((ROOT / "build" / "sfx.json").read_text(encoding="utf-8"))
    dur = timing["duration"]
    n = int(dur * SR) + SR
    voice = np.zeros(n)
    for c in timing["cues"]:
        a = read_wav(ROOT / "build" / "audio" / c["file"])
        i = int(c["start"] * SR)
        voice[i:i + len(a)] += a[: n - i]
    voice *= 0.95

    music = np.zeros(n)
    music[: int(dur * SR)] = make_music(dur)
    # ducking: music dips under the voice
    vb = movavg(np.abs(voice), 2400) > 0.01
    duck = np.where(vb, 0.45, 1.0)
    duck = movavg(duck, SR // 4)
    fade = np.clip(np.minimum(np.arange(n) / (1.5 * SR), (dur * SR - np.arange(n)) / (2.0 * SR)), 0, 1)
    music *= duck * fade * 0.9

    fx = np.zeros(n)
    bank = make_sfx()
    for s in sfx_list:
        a = bank[s["name"]] * s["gain"]
        i = int(s["t"] * SR)
        if 0 <= i < n:
            fx[i:i + len(a)] += a[: n - i]
    fx *= 0.55

    mix = voice + music + fx
    peak = np.abs(mix).max()
    mix = np.tanh(mix / max(peak, 1e-6) * 1.15) * 0.89
    mix = mix[: int(dur * SR)]
    st = np.stack([mix, mix], 1)
    with wave.open(str(ROOT / "build" / "mix.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    print(f"[mix] build/mix.wav {dur:.1f}s, {len(sfx_list)} sfx")


if __name__ == "__main__":
    main()
