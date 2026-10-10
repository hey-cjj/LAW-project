#!/usr/bin/env python3
"""Check actual shipped resources, links, data, and accidental private metadata."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
import re

root = Path(__file__).resolve().parents[1] / 'dist'
errors = []
class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.ids, self.videos = [], set(), []
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if 'id' in values:
            if values['id'] in self.ids:
                errors.append(f'duplicate id: {values["id"]}')
            self.ids.add(values['id'])
        for attribute in ('src', 'href', 'poster', 'data-image'):
            if values.get(attribute):
                self.links.append(values[attribute])
        if tag == 'video':
            self.videos.append(values)

doc = Document()
doc.feed((root / 'index.html').read_text())
for link in doc.links:
    parsed = urlsplit(link)
    if parsed.scheme or parsed.netloc:
        continue
    if parsed.path and not (root / unquote(parsed.path)).is_file():
        errors.append(f'missing resource: {link}')
    if parsed.fragment and parsed.fragment not in doc.ids:
        errors.append(f'missing anchor: {link}')
for url in re.findall(r'url\([\'\"]?([^\)\'\"]+)', (root/'styles.css').read_text()):
    if not (root/url).is_file():
        errors.append(f'missing CSS resource: {url}')
for video in doc.videos:
    if 'controls' not in video or 'playsinline' not in video:
        errors.append(f'video missing accessible native controls: {video.get("id")}')

data = json.loads((root/'assets/data/results.json').read_text())
law = next(row for row in data['robotwin'] if row['method'] == 'LAW + Fast-WAM')
assert (law['clean'], law['randomized'], law['average_reported']) == (94.22, 94.2, 94.21)
assert data['realWorld']['meanSuccess'] == [65, 28.33, 25]
assert data['realWorld']['meanScore'] == [84.06, 55.5, 51.87]
manifest = json.loads((root/'assets/videos/manifest.json').read_text())
for path in root.rglob('*'):
    if not path.is_file():
        continue
    if path.stat().st_size > 25 * 1024 * 1024:
        errors.append(f'oversized static asset: {path.relative_to(root)}')
    if path.suffix in ('.html', '.css', '.js', '.json', '.txt', '.svg'):
        content = path.read_text()
        if re.search(r'/Users/hua|/bh/|root@|10\.40\.1\.|WANDB_API_KEY|github_pat_|ghp_', content):
            errors.append(f'private metadata in public file: {path.relative_to(root)}')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(doc.links)} resource/anchor links, 3 controlled demo videos, exact result contracts, static asset sizes, and private metadata scan.')
