"""Generate narration wavs for every cue in a script JSON via MiMo TTS.

Usage: python tools/tts.py --video compose-click --lang en-US [--dry]
Writes build/<video>/<language>/audio/ and its manifest.json.
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

from project import ROOT, AUDIO, SCRIPT, LANG


def load_env():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            m = re.match(r"\s*([A-Z_]+)\s*=\s*(.*)\s*$", line)
            if m:
                os.environ.setdefault(m.group(1), m.group(2).strip().strip('"'))


def speakable(s, lang=None):
    """Make code-ish tokens readable for TTS: split CamelCase into words, read '.' as 点."""
    english = (lang or LANG) == 'en-US'
    s = re.sub(r"(?<=\d)\.(?=\d)", " point " if english else "点", s)
    s = re.sub(r"(?<=[A-Za-z0-9_)\]])\.(?=[A-Za-z])", " dot " if english else " 点 ", s)
    s = re.sub(r"(?<![A-Za-z0-9])\.(?=[A-Za-z])", "dot " if english else "点 ", s)
    s = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", s)                     # SlotTable -> Slot Table
    s = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", " ", s)                # GPUBuffer -> GPU Buffer
    return re.sub(r" {2,}", " ", s)


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / w.getframerate()


def spoken_for(cue):
    """Text actually sent to TTS (subtitles keep cue['text'])."""
    return speakable(cue.get("tts") or cue["text"])


def audio_path(script, cue, take=None):
    """Cache file for a cue. Different takes of the same line get different files (take 0 keeps the old key)."""
    if cue.get('audio') and take is None:
        name = cue['audio']
        if Path(name).name != name or not name.endswith('.wav'):
            raise ValueError('Invalid imported audio filename')
        return AUDIO / name
    take = cue.get("take", 0) if take is None else take
    voice, style = script.get("voice", "白桦"), script.get("style", "")
    raw = f"{voice}|{style}|{cue.get('style','')}|{spoken_for(cue)}" + (f"|take{take}" if take else "")
    if script.get('model', 'mimo-v2.5-tts') != 'mimo-v2.5-tts':
        raw += '|' + script['model']
    return AUDIO / f"{cue['id']}_{hashlib.sha1(raw.encode()).hexdigest()[:12]}.wav"


def make_client():
    load_env()
    return OpenAI(api_key=os.environ["MIMO_API_KEY"], base_url="https://api.xiaomimimo.com/v1")


def synth(client, script, cue, take=None):
    """Synthesize one cue (unless cached) and return its manifest entry."""
    out = audio_path(script, cue, take)
    if cue.get('audio') and take is None and not out.exists():
        raise FileNotFoundError(f'Imported recording missing: {out.name}')
    if not out.exists():
        AUDIO.mkdir(parents=True, exist_ok=True)
        messages = []
        s = (script.get("style", "") + " " + cue.get("style", "")).strip()
        if s:
            messages.append({"role": "user", "content": s})
        messages.append({"role": "assistant", "content": spoken_for(cue)})
        for attempt in range(4):
            try:
                resp = client.chat.completions.create(
                    model=script.get('model', 'mimo-v2.5-tts'),
                    messages=messages,
                    audio={"format": "wav", "voice": script.get("voice", "白桦")},
                )
                tmp = out.with_suffix(".part")
                tmp.write_bytes(base64.b64decode(resp.choices[0].message.audio.data))
                tmp.replace(out)
                break
            except Exception as e:  # transient API errors: retry a few times
                print(f"[tts] {cue['id']} attempt {attempt + 1} failed: {e}")
                time.sleep(2 + attempt * 3)
        else:
            raise RuntimeError(f"tts failed for {cue['id']}")
        print(f"[tts] {cue['id']}: {cue['text'][:30]}")
    return {"file": out.name, "duration": round(wav_duration(out), 3), "text": cue["text"]}


def main(script_path: str):
    if "--dry" in sys.argv:
        for c in json.loads(Path(script_path).read_text(encoding="utf-8"))["cues"]:
            if "text" in c and spoken_for(c) != (c.get("tts") or c["text"]):
                print(c["id"], spoken_for(c))
        return
    script = json.loads(Path(script_path).read_text(encoding="utf-8"))
    client = make_client()

    def job(cue):
        return cue["id"], synth(client, script, cue)

    speech = [c for c in script["cues"] if "text" in c]
    with ThreadPoolExecutor(max_workers=6) as ex:
        manifest = dict(ex.map(job, speech))

    (AUDIO / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"[tts] {len(manifest)} cues, total {sum(v['duration'] for v in manifest.values()):.1f}s")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else str(SCRIPT))
