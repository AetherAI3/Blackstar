"""Check that corruption of canonical/indexing/privacy contracts is rejected."""
from pathlib import Path
import importlib.util
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('deploycheck',ROOT/'scripts/verify-cloudflare.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
module.verify()
cases=[
 ('index.html','<link rel="canonical" href="https://blackstarentertainment.org/"','<link rel="canonical" href="https://wrong.example/"'),
 ('index.html','property="og:url" content="https://blackstarentertainment.org/"','property="og:url" content="https://wrong.example/"'),
 ('index.html','id="contact-fields" disabled','id="contact-fields"'),
 ('index.html','method="post"','method="get"'),
 ('robots.txt','Allow: /','Disallow: /'),
 ('_headers','/*\n','/*\n  X-Robots-Tag: noindex\n'),
]
for name,old,new in cases:
 p=ROOT/'_site'/name;before=p.read_text();assert old in before,(name,old)
 try:
  p.write_text(before.replace(old,new,1))
  try:module.verify()
  except AssertionError:pass
  else:raise RuntimeError('Contract mutant survived: '+name+' '+old)
 finally:p.write_text(before)
print('PASS: six canonical, indexing, and privacy contract mutants rejected; build restored.')
