# Black Star contact email activation

The contact form is implemented as a Cloudflare Pages Function at `/api/contact`. A valid submission asks Resend to send the project brief to `inquiries.blackstarent@gmail.com` and an immediate professional acknowledgment to the visitor. Until activation, the form opens an email draft addressed to that Gmail inbox. GitHub Pages and preview deployments always remain in draft mode.

## Configure Resend

1. In the owner’s Resend account, add and verify `blackstarentertainment.org` as a sending domain. Add only the DNS records Resend requests; preserve the website, MX, and unrelated TXT records. Wait for Resend to show the domain as verified.
2. The Function sends from `Black Star Entertainment <contact@blackstarentertainment.org>`. Replies to the visitor acknowledgment go to the Gmail inbox. Confirm that `inquiries.blackstarent@gmail.com` is monitored.
3. Use a Resend API key with permission to send from that domain. The GitHub repository secret `RESEND_API_KEY` is visible to GitHub Actions, **not** to Cloudflare Pages Functions. Add the same key directly as an encrypted Cloudflare Pages production secret. Never place it in browser JavaScript, a build variable committed to Git, or a support message. If the original key is no longer available to the owner, create a new sending key in Resend and store it in Cloudflare; optionally rotate the GitHub secret.

## Configure Cloudflare Pages

In **Workers & Pages → blackstar → Settings → Variables and Secrets**, add these production bindings before redeploying:

| Name | Type | Value |
| --- | --- | --- |
| `RESEND_API_KEY` | Encrypted secret | Resend sending key |
| `TURNSTILE_SECRET_KEY` | Encrypted secret | Secret of the Black Star contact widget |
| `TURNSTILE_SITE_KEY` | Plaintext variable | Public site key of that widget |
| `CONTACT_RATE_SALT` | Encrypted secret | Fresh random value, at least 32 characters |
| `CONTACT_ENABLED` | Plaintext variable | `false` until the controlled test passes; then `true` |

Create a dedicated Workers KV namespace and bind it to the Pages project as `CONTACT_RATE_KV` under **Settings → Bindings**. Redeploy after adding or changing bindings. The Function fails closed if any required binding is absent. The Turnstile widget must allow `blackstarentertainment.org` and use the `contact` action; the Function verifies the token with Cloudflare before calling Resend. Preview and `pages.dev` hosts cannot send inquiries.

## Verify and activate

1. Run `python3 scripts/build-cloudflare.py`, `python3 scripts/verify-cloudflare.py`, and `node --test tests/site/contact-function.test.mjs`. These use mocked provider responses and send no real mail.
2. Deploy the feature branch, then check that `GET https://blackstarentertainment.org/api/contact` reports `{"enabled":false}` while the site still opens email drafts. A branch preview will also report disabled by design.
3. Perform one controlled real inquiry using an approved visitor address and the confirmed Gmail inbox, with `CONTACT_ENABLED=true` for that test. Confirm both emails actually arrive, the owner notice’s Reply-To is the visitor, and the acknowledgment’s Reply-To is Gmail. Inspect Resend’s event record. If anything fails, restore `CONTACT_ENABLED=false` immediately.
4. Confirm the public form displays “Send project inquiry,” challenges appropriately, and reports acceptance only after a 202 response. Verify an error preserves the brief and the direct email/copy options remain available.

The Resend batch response means both messages were accepted for delivery; it is not proof of inbox arrival. The KV limiter allows five attempts per ten minutes per hashed IP and 100 per day, but KV counter updates are not atomic. Turnstile is the primary abuse check. Monitor Resend delivery and suppression events, especially for bounced acknowledgments. Direct delivery can be stopped quickly by setting `CONTACT_ENABLED=false` and redeploying; the visitor returns to draft mode.
