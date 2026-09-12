"""Regression contracts for the actual public Cloudflare build. Build it first."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import json
import re
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'_site'
BASE='https://blackstarentertainment.org/'
class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.meta={};self.canonical=[];self.title='';self.in_title=False;self.fields=[];self.disabled=False;self.form_methods=[];self.local_home=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='meta':self.meta[d.get('property',d.get('name',''))]=d.get('content','')
  if tag=='link' and d.get('rel')=='canonical':self.canonical.append(d.get('href'))
  if tag=='title':self.in_title=True
  if tag=='fieldset':self.disabled='disabled' in d
  if tag=='form':self.form_methods.append(d.get('method','get').lower())
  if tag in ('input','select','textarea'):self.fields.append(self.disabled or 'disabled' in d)
  if tag=='a':
   u=urlsplit(d.get('href',''))
   if not u.netloc and not u.scheme and 'index.html' in u.path:self.local_home.append(u.path)
 def handle_endtag(self,tag):
  if tag=='title':self.in_title=False
  if tag=='fieldset':self.disabled=False
 def handle_data(self,data):
  if self.in_title:self.title+=data

def verify():
 routes=['']+[p.parent.relative_to(OUT).as_posix()+'/' for p in OUT.glob('services/*/index.html')]+['how-we-work/','guides/']
 titles=[];descriptions=[];canon=[]
 for route in routes:
  html=(OUT/route/'index.html').read_text()
  p=Page();p.feed(html)
  assert 'analytics.js' in html,('missing-analytics-loader',route)
  expected=BASE+route
  assert p.canonical==[expected],('canonical',route,p.canonical)
  assert p.meta.get('og:url')==expected,('og-url',route)
  assert p.meta.get('og:image','').startswith(BASE+'assets/'),('og-image',route)
  assert 'noindex' not in p.meta.get('robots',''),('index-block',route)
  assert p.title.strip() and p.meta.get('description','').strip(),('metadata',route)
  assert not p.local_home,('unnecessary-home-redirect',route,p.local_home)
  assert all(p.fields) and all(m=='post' for m in p.form_methods),('unprotected-form',route)
  titles.append(p.title);descriptions.append(p.meta['description']);canon+=p.canonical
 assert len(routes)==len(set(titles))==len(set(descriptions))==9
 assert sorted(canon)==sorted(x.text for x in ET.parse(OUT/'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc'))
 robots=(OUT/'robots.txt').read_text();assert 'Allow: /' in robots and BASE+'sitemap.xml' in robots and 'Disallow: /\n' not in robots
 headers=(OUT/'_headers').read_text();global_headers=headers.split('\n\n')[0]
 assert 'noindex' not in global_headers.lower() and 'blackstarentertainment.org' not in headers
 for value in ['X-Content-Type-Options: nosniff',"form-action 'none'",'X-Frame-Options: DENY','https://blackstar-1fa.pages.dev/*','https://:deployment.blackstar-1fa.pages.dev/*']:
  assert value in headers,value
 assert 'noindex' in (OUT/'404.html').read_text()
 for name in ['backend','billing','docs','functions','scripts','src','tests','_loopstate','.env']:
  assert not (OUT/name).exists(),('nonpublic-output',name)
 code_files=['styles.css','shared.js','guide.js','carousel.js','script.js','analytics.js']
 total=sum((OUT/name).stat().st_size for name in code_files)
 assert total < 110_000,('first-party-code-budget',total)
 for name in code_files:
  body=(OUT/name).read_text()
  assert not re.search(r're_[A-Za-z0-9]{20,}',body),('resend-key-in-public',name)
  assert not any(secret in body for secret in ['RESEND_API_KEY','TURNSTILE_SECRET_KEY','CONTACT_RATE_SALT']),('runtime-secret-reference-in-public',name)
 return {'routes':9,'metadata':'unique and domain-correct','no_js_form':'disabled; POST fallback','public_only':True,'css_js_bytes':total}
if __name__=='__main__':print('PASS:',json.dumps(verify()))
