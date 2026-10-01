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
import wave
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


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / w.getframerate()


def main(script_path: str):
    load_env()
    script = json.loads(Path(script_path).read_text(encoding="utf-8"))
    voice = script.get("voice", "白桦")
    style = script.get("style", "")
    AUDIO.mkdir(parents=True, exist_ok=True)
    client = OpenAI(api_key=os.environ["MIMO_API_KEY"], base_url="https://api.xiaomimimo.com/v1")

    manifest = {}
    for cue in script["cues"]:
        spoken = cue.get("tts", cue["text"])  # tts may add a leading style tag, spoken words stay identical
        key = hashlib.sha1(f"{voice}|{style}|{cue.get('style','')}|{spoken}".encode()).hexdigest()[:12]
        out = AUDIO / f"{cue['id']}_{key}.wav"
        if not out.exists():
            print(f"[tts] {cue['id']}: {cue['text'][:30]}...")
            messages = []
            s = (style + " " + cue.get("style", "")).strip()
            if s:
                messages.append({"role": "user", "content": s})
            messages.append({"role": "assistant", "content": spoken})
            resp = client.chat.completions.create(
                model="mimo-v2.5-tts",
                messages=messages,
                audio={"format": "wav", "voice": voice},
            )
            out.write_bytes(base64.b64decode(resp.choices[0].message.audio.data))
        manifest[cue["id"]] = {"file": out.name, "duration": round(wav_duration(out), 3), "text": cue["text"]}

    (AUDIO / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"[tts] {len(manifest)} cues, total {sum(v['duration'] for v in manifest.values()):.1f}s")


if __name__ == "__main__":
    main(sys.argv[1])
