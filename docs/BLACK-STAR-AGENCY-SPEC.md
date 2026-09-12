# Black Star Agency — website and positioning specification

**Revision:** 1.0 · September 10, 2026  
**Repository:** [AetherAI3/Blackstar](https://github.com/AetherAI3/Blackstar)  
**Site:** [Black Star Entertainment](https://aetherai3.github.io/Blackstar/)

**Contact update (September 12, 2026):** The inquiry-flow section below records the original email-draft release. The owner has since designated `inquiries.blackstarent@gmail.com` and requested direct Resend delivery with visitor acknowledgments. [Current setup and activation](RESEND-CONTACT-SETUP.md) supersedes the original contact-address and provider restrictions below.

## Purpose

Position Black Star Entertainment as an independent creative and digital agency: a direct relationship with two founders who combine media production, design, software engineering, and automation. The site should help a prospective client understand what they can hire the team to do, see real work, meet the people doing it, and start a project conversation.

The existing black-and-gold atmosphere and personal identity are the foundation. This overhaul sharpens that foundation rather than presenting an invented large agency, influencer network, or PR operation.

## Positioning and voice

**Primary line:** Your next move. Made real.

**Brand signature:** Where Talent Meets Empire.

**Short description:** Websites, brands, cinematic content, and AI automation. Built directly with the people doing the work.

Write for founders, creators, local businesses, and teams hiring a freelance partner. Use concrete deliverables and clear language. Keep confidence and creative ambition; remove generic claims about dominating industries, guaranteed virality, top-tier partnerships, or press access. Do not invent client results, awards, testimonials, or revenue promises.

Keep the original names, roles, initials, age context, East Coast roots, and named businesses. Describe the portfolio as work and ventures behind the team, not as an implied list of paying Black Star clients.

## Identity and assets

The supplied SVG is the canonical Black Star identity: a white globe, small star, stacked BLACK STAR lettering, and ENTERTAINMENT on near-black.

- Preserve `assets/black-star-original.svg` unchanged, including its original metadata.
- `assets/black-star-logo.svg` uses the same artwork with a tighter viewBox and correct aspect ratio. No redrawing, stretching, or recoloring.
- `assets/black-star-icon.svg` is a viewBox crop of the existing globe/star for the browser icon.
- Use the same logo in navigation, hero, about panel, footer, and README.
- Retain the supplied skyline and starfield atmosphere as secondary decoration.
- Preserve the three existing project images. Serve optimized local copies so third-party image responses do not control the project-card layout.
- Keep the square original as the archival source; the wordmark crop is the normal small-format asset.

Palette: near-black `#0a0a0b`, off-white `#f5f3ed`, restrained gold `#d6ba78`, muted gray, and very subtle plum surfaces. Serif headlines complement the supplied logo; body text remains simple and legible. Use actual image assets in project previews, not generated product screenshots.

## Page hierarchy

1. **Navigation:** logo, Services, Our work, About, The team, and a project inquiry link. Fixed header; mobile menu; skip link; clear keyboard focus.
2. **Hero:** one clear agency statement, practical description, inquiry CTA, work CTA, supplied logo, brand signature, and East Coast context.
3. **Six services:** concrete deliverables and a direct inquiry link on each card.
4. **Work and ventures:** three linked projects, filter controls, and a clearly labeled content-service callout.
5. **About:** the creative/engineering partnership, two founders in their 20s, Rhode Island-to-Florida context, and direct collaboration.
6. **Team:** Edwin and Brandon, their roles, existing Instagram handles, and their businesses.
7. **Contact:** service selection, optional budget, short brief, honest email-draft behavior, and direct Instagram alternatives.
8. **Footer:** logo, signature, navigation, both Instagram accounts, copyright, and back-to-top link.

## Six service cards

| Service | Client-facing promise | Example deliverables |
| --- | --- | --- |
| Websites & web apps | A better home for your business. | Business websites, landing pages, client portals |
| Brand identity & design | Look like you mean business. | Visual identity, brand messaging, digital design |
| Photography & video | Give people a reason to stop. | Brand films, photography, short-form edits |
| Social content & management | Show up with something to say. | Content calendars, reels/social posts, publishing support |
| AI agents & automation | Put the repetitive work on autopilot. | AI assistants, workflow automation, tool integrations |
| Marketing & launch support | Bring the whole launch together. | Launch planning, campaign creative, ongoing support |

Each card has a number, title, one-line benefit, short explanation, three example deliverables, and a project inquiry link. Clicking its link preselects the matching contact service. These examples describe project scope; they are not fixed packages or pricing promises.

### Scroll behavior

On desktop, arrange six cards as three paired rows. Rows stack gently below the fixed navigation as the user scrolls. Use normal document scrolling; do not intercept the wheel, lock the page, autoplay horizontal movement, or require dragging.

Entrance animation is progressive enhancement. If scroll-driven CSS is unsupported, all content remains visible. Under 681px, use a single column without sticky stacking. Under `prefers-reduced-motion: reduce`, remove sticky movement, transitions, and animations. Keep titles, copy, and inquiry links readable in every mode.

## Project-card presentation

- **Aether AI:** a featured, wider card. Present the existing platform image with a contained fit, a readable domain strip, and text describing AI tools, developer infrastructure, and software.
- **East Coast Chromes:** the supplied purple ECC logo leads a branded preview with Edwin’s media-brand description. The original automotive image remains as a subdued background; it is representative imagery, not asserted to be an original client photograph.
- **Food Trackers:** preserve the meal image and site link. Describe the meal-planning, macro, and calorie experience without inventing usage or customer results.
- Keep descriptions outside the image so they do not depend on hover or disappear on touchscreens. Give the whole project card a clear link and visible focus state.
- All external project links open a new tab with `noopener noreferrer` and accessible new-tab wording.
- Filters return meaningful results: All work = 3; Web & technology = 2; Content & media = 1. Announce the count without moving focus.
- Preserve the intent of the old content-growth card as a service callout. Do not label a generic capability as a measured, completed case study or promise virality.

## Protected personal links

| Identity / destination | Exact retained URL | Placement |
| --- | --- | --- |
| Edwin Instagram | https://instagram.com/5.0win | Team, contact, footer |
| Brandon Instagram | https://instagram.com/zo.trades2 | Team, contact, footer |
| East Coast Chromes | https://eastcoastchromes.com | Work card, Edwin profile |
| Aether AI | https://aethersystems.net | Work card, Brandon profile |
| Food Trackers | https://foodtrackers.org | Work card |

Remove every LinkedIn link. Do not add generic social-network homepage links, guess new handles, change account ownership, or scrape Instagram to infer personal details. Retaining a supplied Instagram destination does not establish account availability or ownership verification.

## Inquiry flow

The current website has no mail backend. Keep the existing `hello@blackstarentertainment.com` address and say explicitly that the form opens a draft in the visitor’s email application. Never report a message as sent or stored by the website.

Use native required-name, email, and message validation. Service and budget are optional. Offer “Let’s scope it together,” Under $1,000, $1,000–$3,000, $3,000–$10,000, and $10,000+ as inquiry ranges, not published prices. Preserve the brief on handoff, URL-encode the subject/body, and do not send test inquiries during QA.

Without JavaScript, direct email and Instagram links remain available. A future form provider is a separate integration and should replace the draft behavior only after delivery and failure handling are verified.

## Content accuracy decisions

Remove `EST. 2018` and `1 Year in Business`, which conflict. Remove the unsubstantiated `20+ Campaigns Run` claim from promotional copy. Keep the two-person team fact. Omit the legal suffix from the footer until confirmed; continue using the supplied trading name, Black Star Entertainment.

The existing email address remains supplied but unverified. It must be confirmed as monitored before paid campaigns rely on it. Do not claim uptime, sales, engagement, or client outcomes that the page does not substantiate.

## Technical implementation and release

Keep the existing static HTML/CSS/JavaScript architecture. No package installation, application framework, database, or third-party form processing is needed. Use relative paths so everything works under `/Blackstar/`. Include local `assets/` in the existing Pages artifact; publish only the site entrypoint, CSS, JavaScript, `.nojekyll`, and assets.

Preserve repository history and the deployment workflow. Commit the updated site, README, specification, and asset provenance together. Check JavaScript syntax, SVG XML, asset references, image dimensions, IDs, anchors, protected destinations, no LinkedIn links, and workflow asset inclusion before publishing.

## Acceptance and verification

- Supplied logo is clear, correctly proportioned, and consistent across navigation, hero, footer, and README.
- All six service cards are readable, have useful descriptions, and link to the matching service inquiry.
- Check the desktop layout and scroll sequence; verify mobile structure, menu semantics, reduced-motion fallback, and no horizontal overflow where the available browser supports those views.
- Check all three project filters and visible result counts.
- Every local asset resolves; three external project websites load; both Instagram URLs match the original exactly.
- No LinkedIn links or generic social-network placeholder links remain.
- Inquiry validation works without submitting a message; no false success state appears.
- Pages deployment completes successfully; live HTML, CSS, JS, logo, and all three project previews return HTTP 200.
- Record the checks actually performed in `docs/VERIFICATION.md`. Distinguish observed browser results from source checks and any unavailable viewport emulation.
