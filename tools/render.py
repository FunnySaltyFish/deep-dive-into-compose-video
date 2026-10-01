"""Render anim/index.html frame by frame with Playwright and pipe into ffmpeg.

Usage:
  python tools/render.py --w 960 --fps 30 --out build/video.mp4      # full render (silent)
  python tools/render.py --stills 3,20,48 --w 1920                   # PNG stills for checking
Also dumps build/sfx.json (sound cue list defined by the scene) for the mixer.
"""
import argparse
import json
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PAGE = (ROOT / "anim" / "index.html").as_uri()


def open_page(p, w):
    h = w * 9 // 16
    browser = p.chromium.launch(args=["--font-render-hinting=none"])
    page = browser.new_page(viewport={"width": w, "height": h})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: m.type == "error" and errors.append(m.text))
    page.goto(PAGE)
    try:
        page.wait_for_function("window.DURATION !== undefined", timeout=20000)
    except Exception:
        raise SystemExit("page failed to init: " + " | ".join(errors))
    page.evaluate("document.fonts.ready")
    if errors:
        raise SystemExit("page errors:\n" + "\n".join(errors))
    return browser, page, h


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--w", type=int, default=960)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--out", default="build/video_silent.mp4")
    ap.add_argument("--stills", default="")
    ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--end", type=float, default=None)
    a = ap.parse_args()

    with sync_playwright() as p:
        browser, page, h = open_page(p, a.w)
        dur = page.evaluate("window.DURATION")
        (ROOT / "build" / "sfx.json").write_text(json.dumps(page.evaluate("window.SFX_LIST")), encoding="utf-8")

        if a.stills:
            out = ROOT / "build" / "stills"
            out.mkdir(parents=True, exist_ok=True)
            times = []
            for x in a.stills.split(","):
                if ":" in x:  # range a:b:step
                    s, e, st = (float(v) for v in x.split(":"))
                    while s <= e:
                        times.append(round(s, 2)); s += st
                else:
                    times.append(float(x))
            for t in times:
                page.evaluate(f"window.seek({t})")
                page.screenshot(path=str(out / f"t{t:06.2f}.png"))
            print("stills ->", out)
            browser.close()
            return

        end = a.end if a.end is not None else dur
        n = int(round((end - a.start) * a.fps))
        ff = subprocess.Popen(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(a.fps), "-c:v", "mjpeg",
             "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
             str(ROOT / a.out)],
            stdin=subprocess.PIPE,
        )
        for i in range(n):
            page.evaluate(f"window.seek({a.start + i / a.fps})")
            ff.stdin.write(page.screenshot(type="jpeg", quality=92))
            if i % (a.fps * 10) == 0:
                print(f"  frame {i}/{n}", flush=True)
        ff.stdin.close()
        ff.wait()
        browser.close()
        print(f"video -> {a.out} ({n} frames, {dur:.1f}s)")


if __name__ == "__main__":
    main()
