"""Audit the original static site; writes evidence, never changes source files."""
import collections
import json
import re
import subprocess
import tempfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'auditoria'

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tags = []
        self.scripts = []
        self.script = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append({'tag': tag, 'attrs': attrs, 'line': self.getpos()[0]})
        if tag == 'script' and not attrs.get('src'):
            self.script = {'line': self.getpos()[0], 'code': ''}

    def handle_data(self, data):
        if self.script is not None:
            self.script['code'] += data

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.scripts.append(self.script)
            self.script = None

pages = {}
for file in [ROOT / 'index.html', *sorted((ROOT / 'html').glob('*.html'))]:
    parser = Page()
    parser.feed(file.read_text(encoding='utf-8'))
    pages[file] = parser

missing = []
fragments = []
page_summaries = []
syntax = []
for file, parser in pages.items():
    rel = file.relative_to(ROOT).as_posix()
    ids = collections.Counter(t['attrs']['id'] for t in parser.tags if t['attrs'].get('id'))
    for t in parser.tags:
        for attr in ('src', 'href', 'action'):
            val = t['attrs'].get(attr)
            if not val:
                continue
            url = urlsplit(val)
            if url.scheme or url.netloc or val.startswith(('data:', 'javascript:')):
                continue
            dest = (file.parent / unquote(url.path)).resolve() if url.path else file
            item = {'source': rel, 'line': t['line'], 'tag': t['tag'], 'attribute': attr, 'value': val}
            if not dest.exists():
                missing.append(item)
            elif url.fragment and url.fragment != '!' and dest in pages:
                target_ids = {x['attrs'].get('id') for x in pages[dest].tags}
                if url.fragment not in target_ids:
                    fragments.append(item)
    page_summaries.append({
        'file': rel,
        'duplicate_ids': {k:v for k,v in ids.items() if v > 1},
        'forms': [t for t in parser.tags if t['tag'] == 'form'],
        'placeholder_links': sum(t['tag'] == 'a' and t['attrs'].get('href') in ('#', '#!', '') for t in parser.tags),
        'images': sum(t['tag'] == 'img' for t in parser.tags),
        'lazy_images': sum(t['tag'] == 'img' and t['attrs'].get('loading') == 'lazy' for t in parser.tags),
        'external_scripts': [t for t in parser.tags if t['tag'] == 'script' and (t['attrs'].get('src') or '').startswith('http')],
    })
    for i, script in enumerate(parser.scripts):
        with tempfile.TemporaryDirectory(prefix='novaplaza-syntax-') as tmp:
            tmp_file = Path(tmp) / 'inline.js'
            tmp_file.write_text(script['code'], encoding='utf-8')
            result = subprocess.run(['node', '--check', str(tmp_file)], capture_output=True, text=True)
            syntax.append({'file': rel, 'line': script['line'], 'inline_index': i, 'ok': result.returncode == 0, 'error': result.stderr})
for file in sorted((ROOT / 'js').glob('*.js')):
    result = subprocess.run(['node', '--check', str(file)], capture_output=True, text=True)
    syntax.append({'file': file.relative_to(ROOT).as_posix(), 'ok': result.returncode == 0, 'error': result.stderr})

css_missing = []
for file in sorted((ROOT / 'css').glob('*.css')):
    content = file.read_text(encoding='utf-8')
    for match in re.finditer(r'url\(\s*[\x22\x27]?([^\x22\x27\)]+)[\x22\x27]?\s*\)', content):
        val = match.group(1).strip()
        url = urlsplit(val)
        if url.scheme or url.netloc or not url.path:
            continue
        if not (file.parent / unquote(url.path)).exists():
            css_missing.append({'source': file.relative_to(ROOT).as_posix(), 'line': content[:match.start()].count('\n') + 1, 'value': val})

assets = [p for d in ('js','css','img','fonts') for p in (ROOT / d).rglob('*') if p.is_file()]
result = {
    'date': '2026-10-13', 'root': str(ROOT), 'pages': page_summaries,
    'missing_html_targets': missing, 'missing_fragment_targets': fragments,
    'missing_css_targets': css_missing, 'javascript_syntax': syntax,
    'asset_bytes': {d: sum(p.stat().st_size for p in assets if p.relative_to(ROOT).parts[0] == d) for d in ('js','css','img','fonts')},
    'largest_assets': [{'file': p.relative_to(ROOT).as_posix(), 'bytes': p.stat().st_size} for p in sorted(assets, key=lambda p:p.stat().st_size, reverse=True)[:12]],
}
(OUT / 'static-results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'pages':len(pages), 'syntax_checks': len(syntax), 'syntax_failures': sum(not x['ok'] for x in syntax), 'missing_html_targets': missing, 'missing_fragments': fragments, 'missing_css_targets': css_missing, 'asset_bytes': result['asset_bytes']}, ensure_ascii=False, indent=2))
