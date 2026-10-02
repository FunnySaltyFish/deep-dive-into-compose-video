from pathlib import Path
from playwright.sync_api import sync_playwright
d = Path(__file__).parent
with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge"); pg = b.new_page(viewport={"width": 1920, "height": 2200})
    pg.goto((d / "cover.html").as_uri()); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(300)
    pg.locator("#c169").screenshot(path=str(d / "cover_16x9.png"))
    pg.locator("#c43").screenshot(path=str(d / "cover_4x3.png"))
    b.close()
