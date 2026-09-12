"""Build only public files for Cloudflare Pages, without editing the checkout.
Run: python3 scripts/build-cloudflare.py
Output: _site/; canonical domain: https://blackstarentertainment.org/
This is a local build only. It does not authenticate, deploy, or change DNS.
"""
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / '_site'
PUBLIC_FILES = ('index.html', 'styles.css', 'shared.js', 'script.js', 'guide.js',
                'carousel.js', 'sitemap.xml', '.nojekyll')
PUBLIC_DIRS = ('assets', 'services', 'how-we-work', 'guides')
env = dict(os.environ, SITE_URL='https://blackstarentertainment.org/')
with tempfile.TemporaryDirectory(prefix='blackstar-domain-') as work:
    source = Path(work) / 'source'
    shutil.copytree(ROOT, source, ignore=shutil.ignore_patterns(
        '.git', '_site', 'node_modules', '__pycache__', '.venv', '.env', '.env.*'))
    for script in ('build-pages.py', 'verify-site.py'):
        subprocess.run([sys.executable, str(source / 'scripts' / script)],
                       cwd=source, env=env, check=True)
    staged = Path(work) / 'public'
    staged.mkdir()
    for name in PUBLIC_FILES:
        shutil.copy2(source / name, staged / name)
    for name in PUBLIC_DIRS:
        shutil.copytree(source / name, staged / name)
    (staged / 'robots.txt').write_text(
        'User-agent: *\nAllow: /\nSitemap: https://blackstarentertainment.org/sitemap.xml\n')
    # Cloudflare Pages otherwise treats a site without 404.html as an SPA.
    (staged / '404.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Page not found — Black Star</title><link rel="stylesheet" href="/styles.css">
<main class="container section"><a href="/" aria-label="Black Star home"><img src="/assets/black-star-logo.svg" alt="Black Star" width="180"></a>
<p class="eyebrow" style="margin-top:64px">PAGE NOT FOUND</p><h1>Let’s get you back.</h1>
<p>This page may have moved. Explore our work or tell us what you’re building.</p>
<a class="btn btn-gold" href="/">Back to Black Star ↗</a></main></html>''')
    if OUTPUT.is_symlink():
        raise RuntimeError('Refusing to replace a symlink at _site')
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    shutil.copytree(staged, OUTPUT)
print('READY: _site contains public website files for blackstarentertainment.org; not deployed.')
