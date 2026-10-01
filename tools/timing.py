"""Build the master timeline from the script and the synthesized narration.

Usage: python tools/timing.py script/full.json
Writes build/timing.json (for the mixer) and build/timing.js (for the animation page).
Each cue gets: start, voiceStart, voiceEnd and subtitle segments split at punctuation,
snapped to real pauses in the audio so captions change when the voice actually pauses.
Entries with a "chapter" field are silent title-card blocks of `hold` seconds.
"""
import json
import re
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "build" / "audio"
SR = 24000
MAX_SEG = 20  # max chars per subtitle segment before splitting


def load(path):
    with wave.open(str(path), "rb") as w:
        return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768


def voiced_bounds(a):
    idx = np.where(np.abs(a) > 0.02)[0]
    return idx[0] / SR, idx[-1] / SR


def pauses(a, min_len=0.09):
    """Return midpoints (s) of low-energy stretches inside the clip."""
    hop = 240  # 10ms
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1))
    quiet = rms < 0.012
    out, run = [], 0
    for i, q in enumerate(quiet):
        if q:
            run += 1
        else:
            if run * hop / SR >= min_len:
                out.append(((i - run / 2) * hop) / SR)
            run = 0
    return out


def split_text(text):
    """Split at sentence/clause punctuation into display segments, keep words intact."""
    parts = re.findall(r"[^，。？！：；]+[，。？！：；]*", text)
    segs, cur = [], ""
    for p in parts:
        # always break after a full sentence; otherwise break when the line gets long
        if cur and (cur[-1] in "。？！" or len(cur) + len(p) > MAX_SEG):
            segs.append(cur)
            cur = p
        else:
            cur += p
    if cur:
        segs.append(cur)
    assert "".join(segs) == text, f"split lost characters: {text}"
    return segs


def display(seg):
    # Drop trailing clause punctuation like a normal subtitle; keep ？ and ！
    return re.sub(r"[，。：；]+$", "", seg.strip())


def main(script_path):
    script = json.loads(Path(script_path).read_text(encoding="utf-8"))
    manifest = json.loads((AUDIO / "manifest.json").read_text(encoding="utf-8"))
    t = script.get("lead", 0.6)
    cues, chapters = [], []
    for cue in script["cues"]:
        if "chapter" in cue:
            if chapters:
                chapters[-1]["end"] = round(t, 3)
            chapters.append({"id": cue["id"], "num": cue["chapter"], "name": cue["name"],
                             "rail": cue.get("rail", ""), "t0": round(t, 3), "body": round(t + cue.get("hold", 2.4), 3)})
            t += cue.get("hold", 2.4)
            continue
        m = manifest[cue["id"]]
        assert m["text"] == cue["text"], f"audio for {cue['id']} is stale, rerun tts.py"
        a = load(AUDIO / m["file"])
        v0, v1 = voiced_bounds(a)
        start = t
        voice_start, voice_end = start + v0, start + v1
        segs = split_text(cue["text"])
        # character-proportional estimate, snapped to the nearest real pause
        ps = pauses(a[int(v0 * SR): int(v1 * SR)])
        total = sum(len(s) for s in segs)
        bounds, acc = [voice_start], 0
        for s in segs[:-1]:
            acc += len(s)
            est = (v1 - v0) * acc / total
            snap = min(ps, key=lambda p: abs(p - est)) if ps else est
            if abs(snap - est) > 0.8:
                snap = est
            bounds.append(voice_start + snap)
        bounds.append(voice_end + 0.25)
        subs, c0 = [], 0
        for i, s in enumerate(segs):
            subs.append({"t0": round(bounds[i], 3), "t1": round(bounds[i + 1], 3), "text": display(s),
                         "c0": c0, "c1": c0 + len(s)})
            c0 += len(s)
        cues.append({
            "id": cue["id"], "text": cue["text"], "file": m["file"],
            "start": round(start, 3), "voiceStart": round(voice_start, 3), "voiceEnd": round(voice_end, 3),
            "subs": subs,
        })
        t = voice_end + 0.12 + cue.get("gap", 0.4)
    duration = round(t + script.get("tail", 2.0), 3)
    if chapters:
        chapters[-1]["end"] = duration
    out = {"duration": duration, "cues": cues, "chapters": chapters}
    (ROOT / "build" / "timing.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    (ROOT / "build" / "timing.js").write_text("window.TIMING = " + json.dumps(out, ensure_ascii=False) + ";", encoding="utf-8")
    print(f"[timing] {len(cues)} cues, {len(chapters)} chapters, duration {duration}s ({duration/60:.1f} min)")
    if "-v" in sys.argv:
        for c in cues:
            print(f"  {c['id']} {c['start']:7.2f}-{c['voiceEnd']:7.2f} | " + " / ".join(s["text"] for s in c["subs"]))


if __name__ == "__main__":
    main(sys.argv[1])
