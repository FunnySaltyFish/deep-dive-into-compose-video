"""Check all scene timings and capture a chapter contact sheet."""
import json
import re
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright
from project import BUILD, LANG
from render import open_page

tm = json.loads((BUILD / 'timing.json').read_text(encoding='utf-8'))
out = BUILD / 'review'
out.mkdir(exist_ok=True)
report = {'language': LANG, 'samples': 0, 'nonEnglish': [], 'overflow': []}
with sync_playwright() as p:
    browser, page, _ = open_page(p, 1920)
    if LANG == 'en-US':
        text = page.locator('#stage').text_content()
        report['nonEnglish'] = sorted(set(re.findall(r'[\u4e00-\u9fff]+', text)))
    seen = set()
    for cue in tm['cues']:
        for fraction in (0.25, 0.5, 0.8):
            t = cue['voiceStart'] + fraction * (cue['voiceEnd'] - cue['voiceStart'])
            page.evaluate('(t) => window.seek(t)', t)
            report['samples'] += 1
            issues = page.evaluate('''() => {
              const visible = el => { for (let p=el;p && p.id!=='stage';p=p.parentElement) { const s=getComputedStyle(p); if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<0.1)return false; }return true; };
              return [...document.querySelectorAll('#stage *')].filter(el=>el.childNodes.length && [...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()) && visible(el)).flatMap(el=>{
                const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();
                return r.left < -5 || r.right > 1925 || r.top < -5 || r.bottom > 1085 ? [{text:el.textContent.slice(0,120),class:el.className,left:r.left,right:r.right,top:r.top,bottom:r.bottom}] : [];
              });
            }''')
            for issue in issues:
                key = (issue['text'], str(issue['class']))
                if key not in seen:
                    seen.add(key)
                    report['overflow'].append({'cue':cue['id'], 'time':round(t,2), **issue})
    # Three frames per chapter show different animation states.
    ranges = [('intro', 0, tm['chapters'][0]['t0'])] + [(c['id'],c['body'],c['end']) for c in tm['chapters']]
    sheet = Image.new('RGB', (1920, len(ranges)*360), '#111827')
    for row, (name,start,end) in enumerate(ranges):
        for col, frac in enumerate((0.25,0.5,0.8)):
            t=start+(end-start)*frac
            page.evaluate('(t) => window.seek(t)',t)
            path=out/f'{name}-{col}.png'
            page.screenshot(path=str(path))
            image=Image.open(path).convert('RGB').resize((640,360))
            ImageDraw.Draw(image).text((8,8), f'{name} {t:.1f}s',fill='yellow')
            sheet.paste(image,(col*640,row*360))
    sheet.save(out/'chapters.jpg', quality=90)
    browser.close()
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
if report['nonEnglish']:
    raise SystemExit('Untranslated text remains')
