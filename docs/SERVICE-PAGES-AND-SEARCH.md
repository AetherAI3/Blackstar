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
