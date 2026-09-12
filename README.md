<p align="center">
  <a href="https://aetherai3.github.io/Blackstar/">
    <img src="./assets/black-star-logo.svg" alt="Black Star Entertainment" width="420">
  </a>
</p>

<p align="center"><strong>Your next move. Made real.</strong><br>Websites, software, media and brand growth.</p>

<p align="center">
  <a href="https://aetherai3.github.io/Blackstar/">Visit Black Star</a> ·
  <a href="docs/business/BUSINESS-PLAN.md">Business blueprint</a> ·
  <a href="docs/business/PRICING-AND-PACKAGES.md">Packages & pricing</a> ·
  <a href="backend/README.md">Backend skeleton</a>
</p>

## What we build

Black Star is a creative and digital agency working directly with founders, brands and small businesses. We turn a clear brief into a working website, useful software, a strong visual identity or a consistent content operation—with defined scope, visible progress and a complete handoff.

| Lead | Responsibility | Find us |
| --- | --- | --- |
| **Brandon B. — Development & Systems** | Aether AI developer; rapid website/software delivery, backend, automation, technical scaling and billing | [@zo.trades2](https://instagram.com/zo.trades2) · [Aether AI](https://aethersystems.net) |
| **Edwin D. — Media & Brand** | Media management, photography/video, social content, creative direction and brand scaling | [@5.0win](https://instagram.com/5.0win) · [East Coast Chromes](https://eastcoastchromes.com) |

Our work and ventures: [Aether AI](https://aethersystems.net) · [East Coast Chromes](https://eastcoastchromes.com) · [Food Trackers](https://foodtrackers.org). These are founder projects and ventures; we do not present them as invented client engagements.

## Start with the business system

**September 12, 2026 baseline: proposed prices and operations, with executable reference code.** Pricing is researched and costed, but still requires founder approval before it becomes a live offer. This repository contains no live Stripe prices, payment collection, Resend connection, provisioned client portal or executed company agreements.

| Read | Answers |
| --- | --- |
| [Business blueprint](docs/business/BUSINESS-PLAN.md) | Who we serve, what we sell, what we do not do, acquisition and the first 90 days |
| [Packages & deposits](docs/business/PRICING-AND-PACKAGES.md) | Exact proposed deliverables, prices, opening payments and recurring scope |
| [Competitor & pricing evidence](docs/business/PRICING-EVIDENCE.md) | Published freelancer/agency comparisons, scope differences and fee sources |
| [Team & agency economics](docs/business/TEAM-AND-ECONOMICS.md) | Founder roles, collaborator pay, referral fees, agency premiums and worked math |
| [Operating specification](docs/business/OPERATING-SPEC.md) | Decision rights, business setup, lead-to-delivery process and commercial controls |
| [Scope & delivery templates](docs/business/SCOPE-AND-DELIVERY.md) | Revision limits, change orders, acceptance and handoff |
| [Implementation roadmap](docs/business/IMPLEMENTATION-ROADMAP.md) | The smallest useful path from manual operations to a private portal |
| [Review & ratchet record](docs/reviews/2026-09-12-backend-business/README.md) | Independent idea arena, adversarial findings, fixes, checks and remaining limits |

The machine-readable [billing catalog](billing/catalog.json) is the proposed price source of truth. [Stripe setup](billing/STRIPE-SETUP.md) explains how to turn approved offers into project-bound invoices and recurring plans. A deposit is part of the agreed total; monthly prepayment is a service-period charge. Neither is a generic unrestricted checkout.

## Proposed backend structure

The public site stays simple. Private client operations get a separate API and authenticated data store. The reference code exercises domain rules locally; provider adapters fail closed until implemented and configured.

| Location | Purpose |
| --- | --- |
| [backend/](backend/README.md) | Proposed API/data contracts, tenant/role checks, quote and invoice rules, webhook/reconciliation boundaries and local tests |
| [billing/](billing/README.md) | Versioned USD catalog, deposit schedules, pricing calculator and Stripe setup plan |
| [operations/](operations/partner_economics.py) | Synthetic collaborator economics and one-lever deposit experiment |
| [docs/business/](docs/business/BUSINESS-PLAN.md) | Business model, ownership, delivery and development integration plans |
| [docs/references/loops/](docs/references/loops/README.md) | Supplied loop documents and the bounded adaptation used here |

Brandon owns backend and billing implementation. Edwin owns media workflow and creative acceptance. The [portal contract](docs/business/PORTAL-AND-INTEGRATIONS.md) covers asset collection, versioned feedback, approvals and invoice visibility. The [Resend specification](docs/CONTACT-AND-RESEND-SPEC.md) covers reliable intake and notifications. No client data or credentials belong in this public repository.

## Website

The live site has six service pages, founder profiles and links, project previews, a deterministic service guide, rounded dropdown navigation, dark gold atmosphere and accessible reduced-motion behavior. The inquiry form prepares an email draft or copies a brief; it does not send or store an inquiry. The supplied recipient is `hello@blackstarentertainment.com`; verify the mailbox is monitored before relying on it.

[How we work](https://aetherai3.github.io/Blackstar/how-we-work/) · [Service guides](https://aetherai3.github.io/Blackstar/guides/) · [Agency & website specification](docs/BLACK-STAR-AGENCY-SPEC.md) · [Search and page architecture](docs/SERVICE-PAGES-AND-SEARCH.md) · [Visual proof & SEO/GEO](docs/business/VISIBILITY-AND-PROOF.md) · [Website verification](docs/VERIFICATION.md) · [Asset provenance](assets/README.md)

Run the public site locally:

```bash
git clone https://github.com/AetherAI3/Blackstar.git
cd Blackstar
python3 -m http.server 8080
```

Open `http://localhost:8080`. No package installation or build step is needed for the static site. This local server is for development only; the deployed Pages workflow publishes a selected set of public files.

Run the proposal/reference checks:

```bash
python3 scripts/verify-business.py
```

To edit generated service pages/navigation/footer:

```bash
python3 scripts/build-pages.py
python3 scripts/verify-site.py
```

Edit the generator and commit the generated HTML/sitemap together. `shared.js` handles common navigation and atmosphere, `script.js` handles home interactions, and `guide.js` handles the service guide. Pushes to `main` run verification and deploy only the selected static site directories to GitHub Pages. Backend modules, catalogs, tests and operational records are not a deployed backend.

### Custom domain: blackstarentertainment.org

Cloudflare Pages build preparation is ready. Run `python3 scripts/build-cloudflare.py` and publish `_site`. It generates the new domain's metadata and sitemap without changing the current GitHub Pages source. Domain/DNS/HTTPS activation still requires the authenticated Cloudflare session. Follow the [domain launch checklist and desktop handoff](docs/CLOUDFLARE-DOMAIN-LAUNCH.md).
