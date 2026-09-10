# Asset provenance

## Supplied identity

`black-star-original.svg` is the user-supplied `hf_20260910_011652_82a7bbc7-d296-4a42-b7bf-6b13e8b20c75.svg`, preserved byte-for-byte. `black-star-logo.svg` and `black-star-icon.svg` change only the viewport, explicit dimensions, and aspect-ratio handling to display the same artwork appropriately. The original metadata is retained.

## Existing project imagery

These images were already referenced by the supplied website HTML. The redesign retains the imagery and stores optimized WebP copies locally.

| Local file | Original source | Use |
| --- | --- | --- |
| `east-coast-chromes.webp` | https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80 | Representative automotive image from the original site; not asserted to be a photograph taken by Edwin |
| `aether-ai.webp` | https://aethersystems.net/og-image.png | Aether AI project preview |
| `food-trackers.webp` | https://foodtrackers.org/marketing/hero-salmon.webp | Food Trackers project preview |

All three source URLs returned HTTP 200 during the September 10, 2026 review. This records provenance and continuity; it does not grant new rights to third-party imagery.

The original inline skyline is preserved in `index.html`. The existing Cormorant Garamond and Inter font families continue to load from Google Fonts, with local system-font fallbacks.


## Supplied asset update — September 10, 2026

- `east-coast-chrome-logo.png`: user-supplied `0dfc4b1a-7a7a-4a4f-8277-3654086389f1.png`, copied unchanged (199 × 105). Used as the primary East Coast Chrome project-card artwork and in Edwin’s team card. The existing automotive image is retained as a subdued background.
- `black-star-aurora.webp`: web-optimized copy of user-supplied `hf_20260910_021254_0b0c7ac8-2bd7-4c9e-9f2f-0c0836382983.png`. Original 2048 × 1158; served at 1600 × 905. Used as decorative artwork in the hero, content callout, about panel, and inquiry section, with dark overlays for readability.
- Both assets remain local to the repository; existing project websites and Instagram destinations are unchanged.

- `brandon.webp`: Brandon’s supplied `me.PNG`, resized to 700 px wide and encoded as WebP without metadata. Display framing is handled with CSS; the original photograph is not retouched.

### Champagne asset pack

User-supplied `glow-floor.svg`, `aurora-band.svg`, `glow-mesh.svg`, `constellation.svg`, and `star-emblem.svg` are preserved unchanged. They supply the floor/mesh lighting, CTA horizon, automation network, and small gold ornaments. `hero-atmosphere.html` contains decorative SVG/glow/dust layers adapted from the supplied `hero-opener.html`; its SVG IDs are namespaced for the live document. Live styles reduce intensity, pause motion when hidden/offscreen, provide a pause control, and honor reduced motion.

The supplied `ui-components.html` informed the founder badge, source card, and footer ornament. Demo ratings, review counts, and placeholder organization links were not published. The original Black Star wordmark remains the primary identity; the spark is a secondary ornament.
