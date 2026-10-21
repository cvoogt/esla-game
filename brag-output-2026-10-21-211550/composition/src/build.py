"""Generates the caption, backdrop and phone scenes.

Caption scenes share one style; the phone scene inlines the Esla app's own
styles.css scoped to the phone screen; the backdrop embeds per-frame music RMS.
Run: python3 src/build.py (from the composition directory).
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
OUT = ROOT / 'compositions'

ICON = ('<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="112" fill="#0b0d12"/>'
        '<path d="M96 168c48-30 104-44 160-44s112 14 160 44l-14 24c-40-20-90-32-146-32s-106 12-146 32z" fill="#e31937"/>'
        '<text x="256" y="372" text-anchor="middle" font-family="Inter, sans-serif" font-weight="900" font-size="200" fill="#f1f3f7">E</text></svg>')

CAP_STYLE = '''
    #root { position: absolute; inset: 0; font-family: Inter, sans-serif; }
    .cap { position: absolute; left: 170px; top: 50%; width: 860px; transform: translateY(-50%); }
    .cap .ln { opacity: 0; }
    .cap .eyebrow { font: 800 30px/1 Inter, sans-serif; letter-spacing: 0.22em; color: #ff3b54; margin-bottom: 28px; }
    .cap .l { font: 800 84px/1.06 Inter, sans-serif; letter-spacing: -0.03em; color: #f1f3f7; }
    .cap .sub { font: 600 46px/1.25 Inter, sans-serif; color: #a3abbd; margin-top: 20px; }
    .cap .pill { display: inline-block; margin-top: 34px; padding: 10px 30px; border-radius: 999px; font: 900 72px/1.1 Inter, sans-serif; }
    .cap .logo { font: 800 170px/1 Inter, sans-serif; letter-spacing: 0.12em; color: #ff3b54; }
    .cap .icon { width: 132px; height: 132px; margin-bottom: 34px; border-radius: 30px; overflow: hidden; box-shadow: 0 20px 50px #0009; }
    .cap .icon svg { width: 100%; height: 100%; display: block; }
    .cap .url { margin-top: 40px; font: 600 34px/1 'JetBrains Mono', monospace; color: #a3abbd; }
'''

CAPS = {
    'cap-reveal': (3.0, ['<div class="l"><span class="logo">ESLA</span></div>',
                         '<div class="sub">The score counter for<br>spotting Teslas.</div>']),
    'cap-call': (4.0, ['<div class="eyebrow">CALL IT</div>', '<div class="l">White Cybertruck?</div>',
                       '<div class="l">That’s a Whuck.</div>',
                       '<div class="pill" style="background:#14532d;color:#4ade80">+3</div>']),
    'cap-miss': (3.0, ['<div class="eyebrow">MISS IT</div>', '<div class="l">Missed the call?</div>',
                       '<div class="l">It costs you.</div>',
                       '<div class="pill" style="background:#5a1a1a;color:#fca5a5">−3</div>']),
    'cap-jackpot': (3.0, ['<div class="eyebrow">JACKPOT</div>', '<div class="l">Passed a</div>',
                          '<div class="l">dealership?</div>',
                          '<div class="pill" style="background:linear-gradient(135deg,#3b2a05,#5a3e00);color:#fbbf24">+50</div>']),
    'cap-outro': (4.25, [f'<div class="icon">{ICON}</div>', '<div class="l">Every phone</div>',
                         '<div class="l">in the car.</div>', '<div class="l" style="color:#ff3b54">Scored live.</div>',
                         '<div class="url">cvoogt.github.io/esla-game</div>']),
}

def caption(cid, dur, lines):
    body = ''.join(f'\n      <div class="ln" id="{cid}-l{i}">{l}</div>' for i, l in enumerate(lines))
    # The outro holds to the end; the others clear before the next caption.
    out = '' if cid == 'cap-outro' else f'''
    tl.fromTo("#{cid}-box", {{ opacity: 1, y: 0 }}, {{ opacity: 0, y: -30, duration: 0.25, ease: "power2.in" }}, {dur - 0.3:.2f});'''
    return f'''<template>
  <style>{CAP_STYLE}  </style>
  <div id="root" data-composition-id="{cid}" data-width="1920" data-height="1080">
    <div class="cap" id="{cid}-box">{body}
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    [{', '.join(f'"#{cid}-l{i}"' for i in range(len(lines)))}].forEach((sel, i) => {{
      tl.fromTo(sel, {{ opacity: 0, y: 34 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }}, 0.08 + i * 0.13);
    }});{out}
    window.__timelines["{cid}"] = tl;
  </script>
</template>
'''

def scope_css(css, scope):
    """Prefix every top-level rule of the app stylesheet with the phone-screen scope."""
    out, i = [], 0
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    while i < len(css):
        j = css.find('{', i)
        if j < 0: break
        sel = css[i:j].strip()
        depth, k = 1, j + 1
        while depth:
            depth += {'{': 1, '}': -1}.get(css[k], 0); k += 1
        block = css[j:k]
        if sel.startswith('@'):
            out.append(sel + block)
        else:
            parts = []
            for s in sel.split(','):
                s = s.strip()
                if s in (':root', 'html', 'body'): parts.append(scope)
                else: parts.append(f'{scope} {s}')
            out.append(', '.join(parts) + ' ' + block)
        i = k
    return '\n'.join(out)

for cid, (dur, lines) in CAPS.items():
    (OUT / f'{cid}.html').write_text(caption(cid, dur, lines))

app_css = scope_css((SRC / 'app-styles.css').read_text(), '#phone-screen')
phone = (SRC / 'phone.src.html').read_text().replace('/*APP_CSS*/', app_css)
(OUT / 'phone.html').write_text(phone)
rms = json.loads((SRC / 'music-rms.json').read_text())
(OUT / 'backdrop.html').write_text((SRC / 'backdrop.src.html').read_text().replace('/*RMS*/[]', json.dumps(rms)))
print('built', len(CAPS) + 2, 'scenes')
