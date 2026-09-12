#!/usr/bin/env python3
"""Offline release gate for the proposed business/backend foundation."""
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


def run(*command):
    subprocess.run(command, cwd=ROOT, check=True)


# Only executable reference code and synthetic data are exercised here.
run(sys.executable, 'billing/calculate.py', '--check')
run(sys.executable, '-m', 'unittest', 'discover', '-s', 'billing', '-p', 'test_*.py')
run(sys.executable, '-m', 'unittest', 'discover', '-s', 'operations', '-p', 'test_*.py')
run('node', '--test', *[str(p.relative_to(ROOT)) for p in sorted((ROOT / 'backend/test').glob('*.test.mjs'))])

# Check the supplied snapshot with the same harness so the proposal cannot drift
# away from its reproducible one-lever evidence unnoticed.
observed = json.loads(subprocess.check_output([sys.executable, 'operations/deposit_experiment.py'], cwd=ROOT))
recorded = json.loads((ROOT / 'docs/reviews/2026-09-12-backend-business/deposit-experiment.json').read_text())
if observed != recorded:
    raise ValueError('Deposit experiment evidence drift; re-run and review the experiment')
catalog = json.loads((ROOT / 'billing/catalog.json').read_text())
website = next(p for p in catalog['products'] if p['id'] == 'website_launch')
if website['amount_cents'] != observed['fixture']['project_total_cents']:
    raise ValueError('Deposit fixture no longer matches the proposed website total')
if website['payment_schedule'][0]['amount_cents'] != observed['candidate_runs'][0]['opening_cents']:
    raise ValueError('Deposit candidate no longer matches the proposed catalog')

# Supplied originals include framework references intentionally not present here;
# check the authored index, not links inside those unchanged reference documents.
docs = [ROOT / 'README.md', ROOT / 'docs/references/loops/README.md']
for folder in ('docs/business', 'docs/reviews/2026-09-12-backend-business', 'backend', 'billing'):
    docs.extend((ROOT / folder).rglob('*.md'))
for path in docs:
    content = re.sub(r'```.*?```', '', path.read_text(), flags=re.S)
    for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', content):
        ref = urlsplit(target.split(' "')[0])
        if ref.scheme or ref.netloc or not ref.path:
            continue
        resolved = (path.parent / unquote(ref.path)).resolve()
        if not resolved.is_relative_to(ROOT) or not resolved.exists():
            raise ValueError(f'Broken local document link: {path.relative_to(ROOT)} -> {target}')

run(sys.executable, 'scripts/verify-site.py')
for source in ('shared.js', 'script.js', 'guide.js'):
    run('node', '--check', source)
print(f'PASS: business/backend checks, {len(docs)} document link sets, deposit evidence and public-site regression checks.')
