"""Generate narration wavs for every cue in a script JSON via MiMo TTS.

Usage: python tools/tts.py script/sample.json
Writes build/audio/<cue_id>.wav and build/audio/manifest.json (durations).
Results are cached by (text, voice, style) hash, so unchanged lines are not re-synthesized.
"""
import base64
import hashlib
import json
import os
import re
import sys
import time
import wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from openai import OpenAI

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "build" / "audio"


def load_env():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            m = re.match(r"\s*([A-Z_]+)\s*=\s*(.*)\s*$", line)
            if m:
                os.environ.setdefault(m.group(1), m.group(2).strip().strip('"'))


def speakable(s):
    """Make code-ish tokens readable for TTS: split CamelCase into words, read '.' as 点."""
    s = re.sub(r"(?<=\d)\.(?=\d)", "点", s)                        # 1.12 -> 1点12
    s = re.sub(r"(?<=[A-Za-z0-9_)\]])\.(?=[A-Za-z])", " 点 ", s)   # Modifier.Node
    s = re.sub(r"(?<![A-Za-z0-9])\.(?=[A-Za-z])", "点 ", s)        # .width
    s = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", s)                     # SlotTable -> Slot Table
    s = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", " ", s)                # GPUBuffer -> GPU Buffer
    return re.sub(r" {2,}", " ", s)


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / w.getframerate()


def main(script_path: str):
    if "--dry" in sys.argv:
        for c in json.loads(Path(script_path).read_text(encoding="utf-8"))["cues"]:
            if "text" in c and speakable(c.get("tts", c["text"])) != c.get("tts", c["text"]):
                print(c["id"], speakable(c.get("tts", c["text"])))
        return
    load_env()
    script = json.loads(Path(script_path).read_text(encoding="utf-8"))
    voice = script.get("voice", "白桦")
    style = script.get("style", "")
    AUDIO.mkdir(parents=True, exist_ok=True)
    client = OpenAI(api_key=os.environ["MIMO_API_KEY"], base_url="https://api.xiaomimimo.com/v1")

    def job(cue):
        spoken = speakable(cue.get("tts", cue["text"]))  # tts may spell numbers out; the words stay identical
        key = hashlib.sha1(f"{voice}|{style}|{cue.get('style','')}|{spoken}".encode()).hexdigest()[:12]
        out = AUDIO / f"{cue['id']}_{key}.wav"
        if not out.exists():
            messages = []
            s = (style + " " + cue.get("style", "")).strip()
            if s:
                messages.append({"role": "user", "content": s})
            messages.append({"role": "assistant", "content": spoken})
            for attempt in range(4):
                try:
                    resp = client.chat.completions.create(
                        model="mimo-v2.5-tts",
                        messages=messages,
                        audio={"format": "wav", "voice": voice},
                    )
                    out.write_bytes(base64.b64decode(resp.choices[0].message.audio.data))
                    break
                except Exception as e:  # transient API errors: retry a few times
                    print(f"[tts] {cue['id']} attempt {attempt + 1} failed: {e}")
                    time.sleep(2 + attempt * 3)
            else:
                raise SystemExit(f"tts failed for {cue['id']}")
            print(f"[tts] {cue['id']}: {cue['text'][:30]}")
        return cue["id"], {"file": out.name, "duration": round(wav_duration(out), 3), "text": cue["text"]}

    speech = [c for c in script["cues"] if "text" in c]
    with ThreadPoolExecutor(max_workers=6) as ex:
        manifest = dict(ex.map(job, speech))

    (AUDIO / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"[tts] {len(manifest)} cues, total {sum(v['duration'] for v in manifest.values()):.1f}s")


if __name__ == "__main__":
    main(sys.argv[1])
