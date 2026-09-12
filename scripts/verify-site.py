"""Check static page routing and search artifacts before GitHub Pages deployment."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
from site_config import BASE
class Page(HTMLParser):
 def __init__(self):
  super().__init__(); self.ids=[];self.refs=[];self.canonical=[];self.json=[];self.capture=False;self.buffer='';self.h1=0
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if 'id' in d:self.ids.append(d['id'])
  if tag=='h1':self.h1+=1
  if tag=='a' and 'href' in d:self.refs.append(d['href'])
  if tag in ('img','script') and 'src' in d:self.refs.append(d['src'])
  if tag=='link' and d.get('rel') in ('stylesheet','icon','preload'):self.refs.append(d['href'])
  if tag=='link' and d.get('rel')=='canonical':self.canonical.append(d['href'])
  if tag=='script' and d.get('type')=='application/ld+json':self.capture=True;self.buffer=''
 def handle_data(self,data):
  if self.capture:self.buffer+=data
 def handle_endtag(self,tag):
  if tag=='script' and self.capture:self.json.append(json.loads(self.buffer));self.capture=False
pages={}
for path in [ROOT/'index.html',*ROOT.glob('services/*/index.html'),ROOT/'how-we-work/index.html',ROOT/'guides/index.html']:
 p=Page();p.feed(path.read_text());pages[path.resolve()]=p
 assert len(p.ids)==len(set(p.ids)),f'Duplicate IDs: {path}'
 assert p.h1==1,f'H1 count: {path}'
 assert len(p.canonical)==1 and p.canonical[0].startswith(BASE),f'Canonical: {path}'
 assert p.json,f'Missing structured data: {path}'
for path,p in pages.items():
 for ref in p.refs:
  if ref.startswith('https://github.com/AetherAI3/Blackstar/blob/main/'):
   assert (ROOT/ref.split('/blob/main/')[1]).is_file(),f'Missing document: {ref}'
  u=urlsplit(ref)
  if u.scheme or u.netloc:continue
  target=(path.parent/unquote(u.path)).resolve() if u.path else path
  if target.is_dir():target=target/'index.html'
  assert target.exists(),f'Broken reference: {path} -> {ref}'
  if u.fragment and target in pages:assert u.fragment in pages[target].ids,f'Broken fragment: {path} -> {ref}'
urls=[x.text for x in ET.parse(ROOT/'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
canon=[p.canonical[0] for p in pages.values()]
assert len(canon)==len(set(canon))==9
assert sorted(urls)==sorted(canon),'Sitemap/canonical mismatch'
print(f'PASS: {len(pages)} pages, local routes/assets/fragments, documentation links, unique IDs, JSON-LD and sitemap.')
