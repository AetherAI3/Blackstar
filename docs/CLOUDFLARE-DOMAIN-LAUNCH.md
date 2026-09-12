# Black Star domain launch

**Target:** https://blackstarentertainment.org/  
**Repository:** AetherAI3/Blackstar, branch `main`  
**Status:** Repository build prepared and locally verified. Cloudflare account access, domain attachment, DNS, and HTTPS activation remain pending. The account/zone identifiers supplied by Brandon are not authentication credentials.

## Finish in the authenticated Cloudflare session

1. Open **Workers & Pages → Create application → Pages → Connect to Git**. Select `AetherAI3/Blackstar` and production branch `main`. Use an existing Black Star Pages project if one is already configured; do not create a duplicate.
2. Framework preset: **None**. Build command: `python3 scripts/build-cloudflare.py`. Build output directory: `_site`. Root directory: repository root. No package install is required. The build fixes the canonical URL to `https://blackstarentertainment.org/`.
3. Deploy and verify the generated `pages.dev` preview. Check the home page, all six service pages, `/how-we-work/`, `/guides/`, and an unknown route returning a proper 404.
4. In the Pages project, select **Custom domains → Set up a domain** and add `blackstarentertainment.org`. Confirm the account owns the correct active zone. Let the custom-domain flow propose its DNS record; review any existing records first. Do not replace MX, TXT, email, or unrelated subdomains.
5. Add `www.blackstarentertainment.org` through the same flow. Once both certificates are active, configure a permanent redirect from `www` to the apex domain, preserving the path and query string. Do not redirect the domain to itself.
6. Verify HTTPS on apex and www, redirects, asset loading, service links, hero cards, keyboard navigation, carousel, contact email-draft behavior, `/robots.txt`, and `/sitemap.xml`. Every production canonical/OG URL and sitemap entry must use the apex domain.
7. Submit the apex sitemap in Google Search Console and Bing Webmaster Tools using the owner's verified accounts. Decide whether to retire or redirect the previous GitHub Pages copy only after the new domain passes verification; avoid an untested cutover.

Do not manually point a CNAME at an unassociated `pages.dev` hostname: first attach the domain through the Pages custom-domain flow. A CNAME file in this Actions-based GitHub Pages repository does not configure Cloudflare hosting.

## Desktop agent handoff

> Deploy AetherAI3/Blackstar main to Cloudflare Pages using the existing authenticated account. Build with `python3 scripts/build-cloudflare.py`, publish `_site`, attach blackstarentertainment.org and www.blackstarentertainment.org, preserve unrelated DNS/email records, redirect www to the apex with paths/query strings intact, and verify HTTPS and all public routes. Read docs/CLOUDFLARE-DOMAIN-LAUNCH.md first. Report the actual deployment URL, custom-domain activation and certificate status. Do not claim launch until the custom domain serves the site. No backend, Stripe charges, or Resend sending is activated by this static deployment.

## Build and evidence

```bash
python3 scripts/build-cloudflare.py
```

The script builds and checks a temporary copy, then places only public files in `_site`. The source checkout and current GitHub Pages canonical URLs stay intact. The output includes domain-specific structured data, canonical/OG URLs, a nine-page sitemap, robots.txt, and a real 404 page. Backend, billing, tests, and operating documents are not published as site files.

No API token is committed or needed for the build. Deployment requires an authenticated Cloudflare account with access to the target zone/project and the repository.

Sources checked September 12, 2026:
- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Pages serving and 404 behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/)
