"""Tile rendered stills into one contact sheet for quick review.
Usage: python tools/sheet.py 92 172   (time range, seconds) -> build/sheet.png
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
lo, hi = float(sys.argv[1]), float(sys.argv[2])
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
files = sorted(f for f in (ROOT / "build" / "stills").glob("t*.png") if lo <= float(f.stem[1:]) <= hi)
W, H = 960, 540
sheet = Image.new("RGB", (W * cols, H * ((len(files) + cols - 1) // cols)), "black")
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((W, H))
    ImageDraw.Draw(im).text((10, 8), f.stem, fill="yellow")
    sheet.paste(im, ((i % cols) * W, (i // cols) * H))
sheet.save(ROOT / "build" / "sheet.png")
print(len(files), "stills")
