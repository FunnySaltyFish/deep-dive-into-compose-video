"""Local studio: preview the animation with narration, click any line, re-record it, and the timeline re-aligns.

Usage: python tools/studio.py [--port 8765]   ->  http://127.0.0.1:8765/studio/
Edits go straight into script/full.json (the single source of truth); every take is kept in
build/audio/takes.json so an older take can be restored. Binds to 127.0.0.1 only (no auth).
"""
import argparse
import json
import re
import subprocess
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

sys.path.insert(0, str(Path(__file__).resolve().parent))
import timing  # noqa: E402
import tts  # noqa: E402

ROOT, AUDIO = tts.ROOT, tts.AUDIO
SCRIPT = ROOT / "script" / "full.json"
TAKES = AUDIO / "takes.json"
SCENES = ROOT / "anim" / "scenes"
ALLOWED = ("/studio/", "/anim/", "/build/", "/node_modules/gsap/")
KW = re.compile(r"""kw\(\s*'(\w+)'\s*,\s*'([^']*)'\s*(?:,\s*(\d+)\s*)?\)""")

lock = threading.Lock()
_client = None
render = {"state": "idle", "log": "", "started": 0, "out": ""}


class ApiError(Exception):
    pass


def client():
    global _client
    if _client is None:
        _client = tts.make_client()
    return _client


# ---------- script / takes persistence ----------
def read_script():
    return json.loads(SCRIPT.read_text(encoding="utf-8"))


def write_script(sc):
    """Keep the one-cue-per-line layout so diffs stay readable."""
    lines = ["{"]
    lines += [f"  {json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)}," for k, v in sc.items() if k != "cues"]
    lines.append('  "cues": [')
    lines.append(",\n".join("    { " + json.dumps(c, ensure_ascii=False)[1:-1] + " }" for c in sc["cues"]))
    lines += ["  ]", "}"]
    tmp = SCRIPT.with_suffix(".tmp")
    tmp.write_text("\n".join(lines) + "\n", encoding="utf-8")
    tmp.replace(SCRIPT)


def read_takes():
    return json.loads(TAKES.read_text(encoding="utf-8")) if TAKES.exists() else {}


def write_takes(tk):
    TAKES.write_text(json.dumps(tk, ensure_ascii=False, indent=1), encoding="utf-8")


def speech(sc):
    return [c for c in sc["cues"] if "text" in c]


def find(sc, cid):
    for c in sc["cues"]:
        if c.get("id") == cid and "text" in c:
            return c
    raise ApiError(f"没有这一句：{cid}")


def record_take(sc, tk, cue):
    """Remember the take the cue currently points at (idempotent)."""
    f = tts.audio_path(sc, cue).name
    lst = tk.setdefault(cue["id"], [])
    if (AUDIO / f).exists() and not any(e["file"] == f for e in lst):
        lst.append({"take": cue.get("take", 0), "text": cue["text"], "tts": cue.get("tts"), "style": cue.get("style"),
                    "file": f, "duration": round(tts.wav_duration(AUDIO / f), 3), "at": time.strftime("%m-%d %H:%M:%S")})


def rebuild(sc):
    """manifest -> timing.json / timing.js. Missing audio (shouldn't happen) is synthesized."""
    manifest = {c["id"]: tts.synth(client(), sc, c) for c in speech(sc)}
    (AUDIO / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    timing.main(str(SCRIPT))


def kw_problems(cid, text):
    """Animation keywords (kw(id, word, n)) that the new subtitle text would no longer contain."""
    miss = []
    for f in sorted(SCENES.glob("*.js")):
        for m in KW.finditer(f.read_text(encoding="utf-8")):
            if m.group(1) == cid and text.count(m.group(2)) < int(m.group(3) or 0) + 1:
                miss.append(f"{f.name}: {m.group(2)}")
    return sorted(set(miss))


def state():
    sc = read_script()
    tk = read_takes()
    cues = []
    for c in sc["cues"]:
        d = dict(c)
        if "text" in c:
            d["spoken"] = tts.spoken_for(c)
            d["file"] = tts.audio_path(sc, c).name
        cues.append(d)
    tm = json.loads((ROOT / "build" / "timing.json").read_text(encoding="utf-8"))
    return {"cues": cues, "timing": tm, "takes": tk, "render": render}


# ---------- actions ----------
FIELDS = ("text", "tts", "style", "gap", "take")


def apply_edits(cue, body):
    for k in ("text", "tts", "style"):
        if k in body:
            v = (body[k] or "").strip()
            if k == "text" and not v:
                raise ApiError("字幕不能为空")
            if v:
                cue[k] = v
            else:
                cue.pop(k, None)
    if "gap" in body:
        cue["gap"] = round(min(5.0, max(0.0, float(body["gap"]))), 2)


def copy_fields(src, dst):
    for k in FIELDS:
        if k in src:
            dst[k] = src[k]
        else:
            dst.pop(k, None)


def guard():
    if render["state"] == "running":
        raise ApiError("正在导出视频，导出结束后再改")


def do_edit(body):
    guard()
    cid = body["id"]
    sc = read_script()
    cue = find(sc, cid)
    old_text = cue["text"]
    apply_edits(cue, body)
    if cue["text"] != old_text and not body.get("force"):
        miss = kw_problems(cid, cue["text"])
        if miss:
            raise ApiError("动画里引用了这些关键词，新字幕里找不到：\n" + "\n".join(miss) + "\n（改字幕时请保留它们，或者只改『朗读文本』）")
    if body.get("newTake"):
        prev = [e["take"] for e in read_takes().get(cid, [])] + [cue.get("take", 0)]
        cue["take"] = max(prev) + 1
    if not cue.get("take"):
        cue.pop("take", None)
    tts.synth(client(), sc, cue)  # slow network call, outside the lock
    with lock:
        sc2 = read_script()
        copy_fields(cue, find(sc2, cid))
        tk = read_takes()
        record_take(sc2, tk, find(sc2, cid))
        write_script(sc2)
        write_takes(tk)
        rebuild(sc2)
    return state()


def do_select(body):
    guard()
    cid, file = body["id"], body["file"]
    with lock:
        sc = read_script()
        cue = find(sc, cid)
        e = next((e for e in read_takes().get(cid, []) if e["file"] == file), None)
        if not e or not (AUDIO / file).exists():
            raise ApiError("找不到这一版录音")
        cue["text"] = e["text"]
        for k in ("tts", "style"):
            if e.get(k):
                cue[k] = e[k]
            else:
                cue.pop(k, None)
        if e["take"]:
            cue["take"] = e["take"]
        else:
            cue.pop("take", None)
        if tts.audio_path(sc, cue).name != file:
            raise ApiError("这一版录音的参数已对不上（全局风格可能改过）")
        write_script(sc)
        rebuild(sc)
    return state()


def do_render(body):
    if render["state"] == "running":
        raise ApiError("已经在导出了")
    w = int(body.get("w", 960))
    out = f"build/preview_full_{w}.mp4" if w != 1920 else "build/final_1080.mp4"
    cmd = [sys.executable, "tools/render_all.py", "--w", str(w), "--jobs", str(int(body.get("jobs", 8))), "--out", out]
    render.update(state="running", log="", started=time.time(), out=out)

    def run():
        p = subprocess.Popen(cmd, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
        for line in p.stdout:
            render["log"] = (render["log"] + line)[-4000:]
        render["state"] = "done" if p.wait() == 0 else "failed"

    threading.Thread(target=run, daemon=True).start()
    return {"render": render}


# ---------- http ----------
class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "application/javascript", ".wav": "audio/wav",
                      ".css": "text/css", ".html": "text/html; charset=utf-8", ".json": "application/json"}

    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(ROOT), **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, obj, code=200):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        path = unquote(self.path.split("?")[0])
        if path in ("/", "/studio"):
            self.send_response(302)
            self.send_header("Location", "/studio/")
            return self.end_headers()
        if path == "/favicon.ico":
            self.send_response(204)
            return self.end_headers()
        if path == "/api/state":
            return self.send_json(state())
        if path == "/api/render":
            return self.send_json({"render": render})
        # only serve what the page needs (never .env or the rest of the repo)
        if ".." in path or not path.startswith(ALLOWED):
            return self.send_error(404)
        super().do_GET()

    def do_POST(self):
        path = self.path.split("?")[0]
        acts = {"/api/edit": do_edit, "/api/select": do_select, "/api/render": do_render}
        if path not in acts:
            return self.send_error(404)
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
            self.send_json(acts[path](body))
        except ApiError as e:
            self.send_json({"error": str(e)}, 400)
        except Exception as e:  # surface TTS / timing failures to the page
            self.send_json({"error": f"{type(e).__name__}: {e}"}, 500)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8765)
    a = ap.parse_args()
    sc = read_script()
    tk = read_takes()
    for c in speech(sc):  # seed the take history with what is currently in use
        record_take(sc, tk, c)
    write_takes(tk)
    rebuild(sc)
    srv = ThreadingHTTPServer(("127.0.0.1", a.port), Handler)
    print(f"[studio] http://127.0.0.1:{a.port}/studio/")
    srv.serve_forever()


if __name__ == "__main__":
    main()
