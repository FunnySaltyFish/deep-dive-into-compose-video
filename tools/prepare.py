"""Compile shared animation sources with the selected language's display labels."""
import json
import re
from project import ROOT, CONTENT, LOCALE, LANG, BUILD


def prepare():
    labels = json.loads((LOCALE / 'labels.json').read_text(encoding='utf-8'))
    strings_file = LOCALE / 'strings.json'
    strings = json.loads(strings_file.read_text(encoding='utf-8')) if strings_file.exists() else {}
    source = CONTENT / 'anim'
    target = BUILD / 'anim'
    target.mkdir(parents=True, exist_ok=True)
    for path in source.rglob('*'):
        if not path.is_file():
            continue
        out = target / path.relative_to(source)
        out.parent.mkdir(parents=True, exist_ok=True)
        text = path.read_text(encoding='utf-8')
        if LANG == 'en-US' and path.suffix == '.js':
            def translate(match):
                word = match.group()
                if word not in labels:
                    raise ValueError(f'Missing English label: {word} in {path.name}')
                return labels[word]
            def literal(match):
                token = match.group()
                if token.startswith('//') or token.startswith('/*'):
                    return token
                for original, english in strings.items():
                    token = token.replace(original, english)
                token = re.sub(r'[\u4e00-\u9fff]+', translate, token)
                return token.replace('：', ': ').replace('，', ', ').replace('。', '.').replace('（', '(').replace('）', ')')
            text = re.sub(r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"|`(?:\\.|[^`\\])*`|//[^\n]*|/\*[\s\S]*?\*/", literal, text)
        if path.name == 'index.html':
            text = text.replace('lang="zh-CN"', f'lang="{LANG}"')
            gsap = ROOT / 'node_modules/gsap/dist/gsap.min.js'
            # Relative URLs work both from file previews and the local studio.
            import os
            text = text.replace('../node_modules/gsap/dist/gsap.min.js', os.path.relpath(gsap, target).replace('\\', '/'))
            text = text.replace('../build/timing.js', '../timing.js')
        out.write_text(text, encoding='utf-8')
    if LANG == 'en-US':
        with (target / 'style.css').open('a', encoding='utf-8') as css:
            css.write('\n:root { --sans: "Segoe UI", Arial, sans-serif; }\n#subtitle span { max-width: 1740px; font-size: 36px; letter-spacing: 0; line-height: 1.3; }\n.ccard .t { max-width: 1660px; font-size: 52px; letter-spacing: 0; }\n')
    print(f'[prepare] {LANG} animation -> {target}')


if __name__ == '__main__':
    prepare()
