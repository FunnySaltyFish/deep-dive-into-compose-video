"""Recording import/history and English subtitle editing without TTS requests."""
import shutil
import sys
import tempfile
import unittest
import wave
from pathlib import Path
from unittest.mock import patch

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import studio
import tts


class StudioTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        audio = root / 'audio'
        audio.mkdir()
        for module, name, value in [
            (studio, 'BUILD', root), (studio, 'AUDIO', audio),
            (studio, 'SCRIPT', root / 'script.json'), (studio, 'TAKES', audio / 'takes.json'),
            (tts, 'AUDIO', audio), (studio.timing, 'main', lambda _: None),
            (studio, 'client', lambda: object()),
            (studio, 'state', lambda: studio.read_script()),
            (studio, 'kw_problems', lambda *_: []),
        ]:
            p = patch.object(module, name, value)
            p.start()
            self.addCleanup(p.stop)
        self.sc = {'cues': [{'id': 'c01', 'text': 'Hello. Next.', 'segments': ['Hello. ', 'Next.']}]}
        studio.write_script(self.sc)
        self.old = tts.audio_path(self.sc, self.sc['cues'][0])
        with wave.open(str(self.old), 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(24000)
            w.writeframes((np.sin(np.arange(12000) * 0.1) * 8000).astype(np.int16).tobytes())

    def test_import_history_and_regenerate(self):
        imported = studio.do_upload('c01', self.old.read_bytes())['cues'][0]
        self.assertIn('_import_', imported['audio'])
        with wave.open(str(tts.audio_path(self.sc, imported)), 'rb') as w:
            self.assertEqual((w.getnchannels(), w.getframerate(), w.getsampwidth()), (1, 24000, 2))
        self.assertEqual(len(studio.read_takes()['c01']), 2)
        # A pause edit must preserve the imported recording.
        paused = studio.do_edit({'id': 'c01', 'gap': 1})['cues'][0]
        self.assertEqual(paused['audio'], imported['audio'])
        selected = studio.do_select({'id': 'c01', 'file': self.old.name})['cues'][0]
        self.assertNotIn('audio', selected)
        studio.do_select({'id': 'c01', 'file': imported['audio']})
        # Seed the next generated take to verify switching without a network request.
        new_cue = dict(imported, take=2)
        new_cue.pop('audio')
        shutil.copyfile(self.old, tts.audio_path(self.sc, new_cue))
        regenerated = studio.do_edit({'id': 'c01', 'newTake': True})['cues'][0]
        self.assertNotIn('audio', regenerated)
        self.assertEqual(regenerated['take'], 2)

    def test_invalid_import_preserves_script(self):
        before = studio.SCRIPT.read_bytes()
        with self.assertRaises(studio.ApiError):
            studio.do_upload('c01', b'not audio')
        self.assertEqual(studio.SCRIPT.read_bytes(), before)

    def test_segments_validate_before_saving(self):
        cue = dict(self.sc['cues'][0])
        for body in [
            {'text': 'Changed.'},
            {'text': 'Changed.', 'segments': ['Changed.']},
            {'text': 'Changed. Next.', 'segments': ['Wrong. ', 'Next.']},
        ]:
            with self.assertRaises(studio.ApiError):
                studio.apply_edits(dict(cue), body)
        studio.apply_edits(cue, {'text': 'Changed. Next.', 'segments': ['Changed. ', 'Next.']})
        self.assertEqual(''.join(cue['segments']), cue['text'])


if __name__ == '__main__':
    unittest.main()
