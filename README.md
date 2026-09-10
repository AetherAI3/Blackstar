<div align="center">

# ★ Black Star Entertainment

**Where Talent Meets Empire**

Marketing, content creation, brand strategy, and digital experiences.

[View Website](https://aetherai3.github.io/Blackstar/) · [Explore the Code](https://github.com/AetherAI3/Blackstar) · [Report an Issue](https://github.com/AetherAI3/Blackstar/issues)

</div>

---

## The website

A responsive static landing page based on the supplied Black Star Entertainment HTML, with a black-and-gold theme, starfield hero, services, company introduction, team profiles, selected projects, and a contact form.

- Responsive navigation with a mobile menu.
- Filterable portfolio with external project links.
- Keyboard focus states and reduced-motion support.
- Email inquiries through the visitor's email application.
- Plain HTML, CSS, and JavaScript — no build step or package installation.

## Preview locally

```bash
git clone https://github.com/AetherAI3/Blackstar.git
cd Blackstar
python3 -m http.server 8080
```

Open http://localhost:8080. Opening `index.html` directly also works.

## GitHub Pages

In **Settings → Pages**, select **Deploy from a branch**, then **main** and **/ (root)**, and save. GitHub's built-in Pages deployment publishes updates from `main` automatically. `.nojekyll` keeps the site buildless.

Website address once Pages is enabled and deployment completes:

**https://aetherai3.github.io/Blackstar/**

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page content and structure |
| `styles.css` | Responsive layout and visual styling |
| `script.js` | Navigation, project filtering, starfield, and email draft |
| `.nojekyll` | Serve the static site without Jekyll processing |

## Content and contact setup

The contact form opens a draft addressed to `hello@blackstarentertainment.com`; it does not send or store submissions. Confirm this supplied address is monitored before directing customer inquiries here. For server-side delivery, connect an approved form service and update the submit handler.

The supplied company copy, metrics, project links, and imagery are retained. Review the `EST. 2018` label alongside the supplied `1 Year in Business` statistic, campaign totals, and LLC wording for accuracy. Google Fonts and portfolio imagery load from external hosts. Generic social-network homepage links were removed until real profile URLs are available.
