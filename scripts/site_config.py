"""Canonical URL shared by the static generator and its route checks."""
import os

BASE = os.environ.get('SITE_URL', 'https://aetherai3.github.io/Blackstar/').rstrip('/') + '/'
if BASE not in ('https://aetherai3.github.io/Blackstar/', 'https://blackstarentertainment.org/'):
    raise ValueError('SITE_URL must be an approved Black Star production URL')
