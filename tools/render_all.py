"""Render the whole video in N parallel chunks, then mix audio and mux.
Usage: python tools/render_all.py --video compose-click --lang en-US --w 960 --jobs 8
"""
import argparse, json, subprocess, sys
from pathlib import Path

from project import ROOT, BUILD, selection_args
ap = argparse.ArgumentParser()
ap.add_argument("--w", type=int, default=960)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--jobs", type=int, default=8)
ap.add_argument("--out", default=str(BUILD / 'preview_960.mp4'))
a = ap.parse_args()

if a.jobs < 1 or a.fps < 1 or a.w < 2 or (a.w * 9 // 16) % 2:
    raise SystemExit('Use positive jobs/fps and a resolution with even height')
subprocess.check_call([sys.executable, 'tools/render.py', *selection_args(), '--sfx', '--w', str(a.w)], cwd=ROOT)
dur = json.loads((BUILD / "timing.json").read_text(encoding="utf-8"))["duration"]
n = int(round(dur * a.fps))
step = -(-n // a.jobs)
parts, procs = [], []
for j in range(a.jobs):
    f0, f1 = j * step, min(n, (j + 1) * step)
    if f0 >= f1:
        break
    out = str(BUILD / f'part_{j:02d}.mp4')
    parts.append(out)
    procs.append(subprocess.Popen([sys.executable, "tools/render.py", *selection_args(), "--w", str(a.w), "--fps", str(a.fps),
                                   "--start", str(f0 / a.fps), "--end", str(f1 / a.fps), "--out", out], cwd=ROOT))
codes = [p.wait() for p in procs]
if any(codes):
    raise SystemExit(f"chunk failed: {codes}")
(BUILD / "parts.txt").write_text("".join(f"file '{Path(p).name}'\n" for p in parts))
subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(BUILD / 'parts.txt'),
                       "-c", "copy", str(BUILD / 'video_silent.mp4')], cwd=ROOT)
subprocess.check_call([sys.executable, "tools/mix.py", *selection_args()], cwd=ROOT)
subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", str(BUILD / 'video_silent.mp4'), "-i", str(BUILD / 'mix.wav'),
                       "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", a.out], cwd=ROOT)
for p in parts:
    (ROOT / p).unlink()
print("done ->", a.out)
