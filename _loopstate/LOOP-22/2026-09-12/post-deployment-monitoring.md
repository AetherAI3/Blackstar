# Acceptance and monitoring

Before merging: inspect branch preview on iOS Safari and Android Chrome at 320/375/390/768 CSS-pixel widths, portrait/landscape and 200% text size. MOBILE-01: open hero, read/click all three links without overlap; enlarge text and repeat. MOBILE-02: focus every contact field, ensure readable 16px controls and no forced zoom. MOBILE-03: open menu + service dropdown at short height, scroll to last link; open/close guide, Escape and keyboard access, safe areas, soft keyboard. Test reduced motion, JS disabled and script.js blocked: no editable inquiry fields/native PII submission; direct contact links remain. Confirm success path enables form and copies a brief without sending. Test all nine page links and unknown route.

After approval/deploy: verify global response headers on apex and service pages; confirm CSP permits draft navigation/copy and does not block fonts, scripts, artwork. Confirm production has no noindex and pages.dev does. Confirm www preserves path/query. Headers are not applied by GitHub Pages: Cloudflare build only.

Owner tasks: verify Search Console/Bing domain property through authentic DNS tokens, submit https://blackstarentertainment.org/sitemap.xml and inspect home + service URL. Review Cloudflare GitHub app repository access against all existing Cloudflare projects. Verify the .com inbox before changing it to .org.

Rollback: revert the hardening commit on main and allow the previously verified Pages build to deploy if a priority route, contact path, asset or indexability fails. Do not change DNS for a code regression. Review weekly over 28 days; no automatic scheduled monitoring was created.
