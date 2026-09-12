# Black Star — project guide and email delivery

Status: Cloudflare Pages contact Function and browser flow implemented on a feature branch. Direct delivery stays disabled until Cloudflare runtime bindings, Resend domain verification, and a controlled delivery check are complete.

## Visitor experience

Keep the black, understated gold visual language. A small bottom-right “Let’s talk” launcher opens a nonmodal service guide. It identifies itself as automated, offers the six agency services and “Help me choose,” explains the selected service, then offers a single handoff to the contact form. This is deterministic JavaScript, not a live agent or AI conversation. No chat network requests, transcripts, tracking, or persistent storage are added.

The handoff selects the corresponding service and changes the message prompt, while preserving all entered form values. Visitors can switch paths, close the panel, press Escape, or click outside. Focus returns to the launcher when closed explicitly; handoff focuses the name field. The panel fits narrow screens and scrolls within short viewports. It does not open automatically or trap visitors in a conversation. Without JavaScript the launcher stays hidden and the page’s direct contact links remain available.

The form requires name, email, and a brief. Service, budget, and timing are optional. Keep native browser validation, reject whitespace-only required text, show message length, and preserve input after errors. Today “Open your project email” launches an email draft; the visitor must send it. “Copy project brief” is a fallback and also works with partial details. Never show a sent confirmation for either action.

## Target architecture

Cloudflare Pages serves the custom-domain site and a Pages Function at `/api/contact`. GitHub Pages remains a static email-draft copy. The Function validates a direct inquiry and asks Resend to send two transactional emails in one batch: the inquiry to `inquiries.blackstarent@gmail.com` and a professional acknowledgment to the visitor. No marketing list is created. See [activation and operations](RESEND-CONTACT-SETUP.md).

Configuration owned by the backend:

| Setting | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Cloudflare Pages runtime secret; restricted sending key where available |
| `TURNSTILE_SECRET_KEY` | Cloudflare Pages runtime secret for bot verification |
| `TURNSTILE_SITE_KEY` | Public site key, returned by the Function only when enabled |
| `CONTACT_RATE_KV` | KV binding for persistent best-effort per-IP and daily counters |
| `CONTACT_RATE_SALT` | Secret used to hash IPs before KV storage |
| `CONTACT_ENABLED` | Plaintext switch set to `true` only after the delivery check |

The public frontend receives only the site key. The Function accepts sends only on `https://blackstarentertainment.org` with that exact Origin, and verifies Turnstile server-side. CORS and Origin alone are not authentication; Turnstile and rate controls prevent casual abuse.

Resend requires a verified sending domain. Verify `blackstarentertainment.org` before enabling delivery. The owner-designated inquiry inbox is `inquiries.blackstarent@gmail.com`; confirm it receives mail. Use a verified sender on the `.org` domain as From, with the Gmail inbox as Reply-To on acknowledgments. [Resend domain setup](https://resend.com/docs/dashboard/domains/introduction).

## Request contract

Accept `application/json`, with a maximum 16 KiB request body. Reject other methods and unsupported media types. Handle OPTIONS without attempting a send.

| Field | Validation |
| --- | --- |
| `submissionId` | UUID generated once for a particular submitted payload |
| `name` | Trimmed, 1–120 characters |
| `email` | Valid email, at most 254 characters; reject CR/LF |
| `service` | Empty or `web`, `brand`, `video`, `social`, `automation`, `marketing`, `multiple` |
| `budget` | Empty or one of the four options rendered in the form |
| `timeline` | Empty or one of the three timing options rendered in the form |
| `message` | Trimmed, 1–1,800 characters |
| `website` | Optional honeypot; must be empty (to be added with the backend integration) |
| `challengeToken` | Bot-challenge token verified on the server before sending |

Use UTF-16 length consistently with browser maxlength. Ignore no unexpected fields silently: reject malformed objects and unknown field names. Server validation remains mandatory even if the browser already validated. Do not accept sender addresses, recipients, HTML, subjects, or redirect URLs from the client.

## Sending and response behavior

Use a server-side POST to `https://api.resend.com/emails/batch`, authenticated with a Bearer API key. Construct fixed subjects from an allowlisted service label. The owner notice goes to the fixed Gmail inbox with Reply-To set to the validated visitor email and a plain-text brief. The visitor receives a separate acknowledgment with a fixed text/HTML template and Reply-To set to Gmail; visitor input is escaped in HTML. A successful batch response acknowledges provider acceptance, not inbox arrival. [Batch API](https://resend.com/docs/api-reference/emails/send-batch-emails).

Use `Idempotency-Key: blackstar-contact/<submissionId>` for the batch request. Keep the same ID and payload on a retry after an uncertain network result; generate a new ID if the visitor edits the payload. A new Turnstile token is needed for the retry. Resend retains idempotency keys for 24 hours. [Idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys).

Apply server-side Turnstile verification and persistent KV counters before contacting Resend. Initial policy: five attempts per ten minutes per HMAC-hashed IP and 100 accepted attempts per day. KV updates are not atomic, so this is a best-effort limit; Turnstile is the primary abuse gate. Do not log briefs, challenge tokens, addresses, or authorization headers. Return `Retry-After` on throttling. Invalid bot checks and honeypot values never send email.

| Response | Frontend behavior |
| --- | --- |
| 202 `{ "ok": true }` | Confirm inquiry and acknowledgment were accepted for delivery. Clear only after this response |
| 400 `{ "code": "VALIDATION_ERROR", "fields": [...] }` | Display safe field errors and focus the first invalid field |
| 403 `{ "code": "VERIFICATION_FAILED" }` | Refresh the challenge and invite another attempt |
| 429 `{ "code": "RATE_LIMITED" }` | Keep the brief; explain when to retry |
| 502/503 `{ "code": "DELIVERY_UNAVAILABLE" }` | Keep input and offer copy/direct email fallback |
| Network timeout | Keep input; explain that the result is uncertain and retry using the same submission ID |

When the Function reports ready, the form loads Turnstile and changes the main button to “Send project inquiry.” It disables the button while pending and exposes pending/result text through the live status region. It retains the copy option and direct email link, preserves the brief on failure, and never exposes provider errors. The note explains the direct inquiry and acknowledgment; there is no newsletter opt-in.

The owner explicitly requested automatic visitor acknowledgments for direct inquiries. They are sent only after the server validates the form, Turnstile token, origin, and rate limits. The live recipient inbox and Resend account still require owner verification.

## Delivery sequence and acceptance gates

1. Owner confirms the Gmail inbox and Resend account, then verifies the sending domain in Resend.
2. Configure Cloudflare Pages runtime secrets, Turnstile site key, and KV binding as listed in the [setup guide](RESEND-CONTACT-SETUP.md).
3. Run the mocked Function tests, including validation, origin, challenge, rate, provider failure, and both email recipients.
4. With an approved test recipient, send one controlled real inquiry, confirm both inboxes and Reply-To, and inspect the Resend event record.
5. Set `CONTACT_ENABLED=true` only after that check. If provider health fails, set it back to `false`; the browser reverts to email-draft mode.

## Static release checks

Verify the supplied Brandon portrait loads, all seven guide choices reach the correct service option, closing/back/reopening work, typed form details survive handoff, whitespace-only required text fails, and copy feedback is accurate. Check keyboard focus, Escape, reduced motion, narrow/short viewport styles, and absence of new external chat requests. The backend acceptance gates above remain pending until implemented.
