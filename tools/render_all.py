"""Render the whole video in N parallel chunks, then mix audio and mux.
Usage: python tools/render_all.py --w 960 --jobs 8 --out build/preview_full_960.mp4
"""
import argparse, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("--w", type=int, default=960)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--jobs", type=int, default=8)
ap.add_argument("--out", default="build/preview_full_960.mp4")
a = ap.parse_args()

dur = json.loads((ROOT / "build" / "timing.json").read_text(encoding="utf-8"))["duration"]
n = int(round(dur * a.fps))
step = -(-n // a.jobs)
parts, procs = [], []
for j in range(a.jobs):
    f0, f1 = j * step, min(n, (j + 1) * step)
    if f0 >= f1:
        break
    out = f"build/part_{j:02d}.mp4"
    parts.append(out)
    procs.append(subprocess.Popen([sys.executable, "tools/render.py", "--w", str(a.w), "--fps", str(a.fps),
                                   "--start", str(f0 / a.fps), "--end", str(f1 / a.fps), "--out", out], cwd=ROOT))
codes = [p.wait() for p in procs]
if any(codes):
    raise SystemExit(f"chunk failed: {codes}")
(ROOT / "build" / "parts.txt").write_text("".join(f"file '{Path(p).name}'\n" for p in parts))
subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "build/parts.txt",
                       "-c", "copy", "build/video_silent.mp4"], cwd=ROOT)
subprocess.check_call([sys.executable, "tools/mix.py"], cwd=ROOT)
subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", "build/video_silent.mp4", "-i", "build/mix.wav",
                       "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", a.out], cwd=ROOT)
for p in parts:
    (ROOT / p).unlink()
print("done ->", a.out)
