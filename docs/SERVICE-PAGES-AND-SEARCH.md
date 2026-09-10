# Service pages, credibility, and search foundations

September 10, 2026. This release implements public content pages and navigation. It does not provision the planned portal, billing, or Resend backend.

## Visitor goal

A new visitor should understand the agency in one visit: two named founders, six concrete services, a clear project process, visible boundaries, and a direct inquiry action. Keep the established dark artwork, subtle gold dot/glow treatment, original identity, project assets, founder photo, Instagram accounts, and venture links.

## Published page map

| URL relative to the site | Purpose |
| --- | --- |
| `services/websites-and-apps/` | Pages, apps, technical scope, account ownership, and handoff |
| `services/brand-and-design/` | Identity, digital materials, concepts, revisions, and source files |
| `services/photography-and-video/` | Shoots, edits, formats, travel, rights, and production boundaries |
| `services/social-content/` | Channels, content batches, approval, posting, and recurring scope |
| `services/ai-and-automation/` | Named workflows, integrations, exceptions, review, and usage costs |
| `services/marketing-and-launches/` | Launch planning, coordinated assets, responsibilities, and exclusions |
| `how-we-work/` | Founder ownership, process, revisions, changes, handoff, and buying questions |
| `guides/` | Friendly service directory and complete open-documentation index |

Every service has its own useful content: fit, deliverables, lead, exclusions, process, handoff, relevant founder-work link, questions, related services, and inquiry CTA. The CTA carries only an allowlisted service key into the existing homepage form. No personal information is placed in that URL. New pages do not introduce a second inquiry implementation.

## Credibility rules

Use a confident, plain freelance-agency voice. Show actual founder responsibility and working expectations. Existing ventures remain founder work; do not invent paying clients, testimonials, performance metrics, or project outcomes. Publishing real case studies with permission and evidence remains a separate backlog item.

The proposed two-round creative allowance is identified as a starting point; the signed scope controls. Defect corrections and new feature requests are explained separately. The site states what is outside default scope, including unlisted production, ongoing maintenance, advertising spend, round-the-clock support, and guaranteed business/search/AI results.

The planned client portal is described as planned. The contact form is described as preparing an email draft. Operating documents are clearly planning material and do not imply a registered entity or a live integration.

## Footer and documentation

Every page uses the same ambient footer: a project CTA, process link, founder identity/socials, all six service routes, and beginner-friendly agency resources. An expandable “All documentation” area links to every current specification/record, the asset notes, and the repository. The guides page repeats the full document index with summaries and status context so visitors do not need to read engineering plans to understand the offer.

Keep internal implementation details in the open technical documents, not in the primary CTA. Completed private client records never belong in the public repo or footer. Existing verification notes are labeled as dated historical evidence rather than current proof of every new feature.

## Search implementation

Canonical URLs, unique titles/descriptions, Open Graph fields, a social preview image, WebPage/BreadcrumbList data on content pages, and Organization data on the home page are included. All essential copy and links render as static HTML without JavaScript. `sitemap.xml` lists the nine canonical public pages. No speculative address, company registration, review rating, or client relationship is encoded in structured data.

The current canonical origin/path remains `https://aetherai3.github.io/Blackstar/`. Search Console verification, sitemap submission in the owner's property, custom-domain decisions, actual index coverage, and field traffic measurement remain pending. No ranking or AI-answer visibility claim is made.

These choices follow ordinary search fundamentals; Google does not require special AI files or schema for its AI search features. [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features). A project-subdirectory robots file would not control this origin, so none is added; the site owner must manage crawler rules at the host root if needed. [Google robots.txt location rules](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt).

## Maintenance and release

`scripts/build-pages.py` owns the eight content pages, page metadata, sitemap, service detail links, and shared footer. Edit its service/document data and rerun it when those change. Home-only interactive features stay in `script.js`; navigation and ambient effects are shared through `shared.js`. The Pages workflow includes every new public directory and asset without publishing private records or operational scripts.

Run `python3 scripts/build-pages.py`, `python3 scripts/verify-site.py`, and JavaScript syntax checks before release. Static checks cover local routes and fragments, unique IDs, image/script/style references, canonical uniqueness, JSON-LD parsing, sitemap coverage, and current document destinations. Visual/interaction checks must separately inspect the deployed footer, service page, mobile or available viewport, and inquiry preselection. Source checks are not evidence of a completed browser test or search indexing.

## Navigation and guided assistance update

All nine pages now share four native disclosure dropdowns: Services, Our work, About us, and Guides. Desktop pointer hover reveals grouped links; clicking or using the keyboard toggles the same disclosures. Arrow Down enters the first link, Escape closes and returns focus, outside clicks close the panels, and only one dropdown stays open. On narrow screens the disclosures become stacked sections inside the existing mobile navigation. The service, venture, process, documentation, and founder-social destinations mirror the footer.

The deterministic assistant is shared across all pages through `guide.js`. A service-page handoff reaches the home inquiry form with an allowlisted service query. On the home page, handoff preserves typed input. The assistant adds a process explanation path. It never opens automatically. After six seconds, a small gold exclamation badge and dismissible hint invite attention; the hint expires after twelve seconds. Session storage holds only a seen flag to prevent repeating the invitation in the same tab session. If storage is blocked, the experience remains usable, but suppression cannot persist between pages. Reduced-motion visitors receive a static cue. No chat transcript is stored.

The shared markup lives in `scripts/project-guide.html`; generated navigation remains in `scripts/build-pages.py`. The workflow includes `guide.js` and checks its syntax.

## Surface and motion refinement

Numbered section labels, service counters, and project/team indices have been removed from public pages. Existing identity, project art, founder photographs, and social destinations remain intact. Service, project, team, about, and contact surfaces now use rounded corners and subdued gradient borders. The original about artwork feathers into its container.

The about frame uses a CSS view-timeline where supported. Other cards and headings receive one brief entrance animation as they enter view; content is never hidden while waiting for JavaScript. Reduced-motion disables the movement, including when the preference changes during a visit.

The contact section includes a code-native SVG sequence: website/computer, paper plane on a dotted route, rising building, and completion check. It plays once on entering view, lasts eight seconds, and settles into a static illustration. Reduced-motion visitors get the static sequence. Its accessible description identifies it as an illustrative project journey, not form submission status. It is independent of email-draft behavior and never claims an inquiry has been delivered.

## Supplied artwork integration

The opener incorporates the supplied hero prototype’s gold ribbons, restrained dust, warm/violet glows, and static grain behind the established copy and logo. The founder badge links to the actual team; the source card links to this repository. Mesh and floor SVGs sit behind services, work, and about content. The constellation supports automation and the process page; the horizon band and gold spark carry the palette through the footer CTA. All five supplied SVGs remain local and unmodified.

Decorative layers ignore pointer input and stay out of the accessibility tree. The opener offers a pause/resume button; animation pauses outside the viewport and when the tab is hidden. Reduced-motion displays static artwork. Mobile uses fewer dust particles and dimmer ribbons. Existing personal links, portrait, work assets, navigation, contact behavior, and search URLs remain in place. The sample UI’s ratings/review numbers were demonstration content, not verified business evidence, and were replaced by a factual founder badge.
