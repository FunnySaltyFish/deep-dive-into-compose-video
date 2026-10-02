"""Shared video/language selection for the command-line tools."""
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def option(name, default):
    if name in sys.argv:
        i = sys.argv.index(name)
        value = sys.argv[i + 1]
        del sys.argv[i:i + 2]
        return value
    return default


VIDEO = option('--video', os.environ.get('VIDEO_ID', 'compose-click'))
LANG = option('--lang', os.environ.get('VIDEO_LANG', 'zh-CN'))
if not re.fullmatch(r'[a-zA-Z0-9_-]+', VIDEO) or LANG not in ('zh-CN', 'en-US'):
    raise ValueError('Invalid video or language')
os.environ.update(VIDEO_ID=VIDEO, VIDEO_LANG=LANG)
CONTENT = ROOT / 'videos' / VIDEO
LOCALE = CONTENT / 'locales' / LANG
SCRIPT = LOCALE / 'script.json'
BUILD = ROOT / 'build' / VIDEO / LANG
AUDIO = BUILD / 'audio'
BUILD.mkdir(parents=True, exist_ok=True)


def selection_args():
    return ['--video', VIDEO, '--lang', LANG]
