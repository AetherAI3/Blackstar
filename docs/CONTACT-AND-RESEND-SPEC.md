# Black Star — project guide and email delivery

Status: guide and email-draft improvements implemented; Resend delivery is planned, not connected.

## Visitor experience

Keep the black, understated gold visual language. A small bottom-right “Let’s talk” launcher opens a nonmodal service guide. It identifies itself as automated, offers the six agency services and “Help me choose,” explains the selected service, then offers a single handoff to the contact form. This is deterministic JavaScript, not a live agent or AI conversation. No chat network requests, transcripts, tracking, or persistent storage are added.

The handoff selects the corresponding service and changes the message prompt, while preserving all entered form values. Visitors can switch paths, close the panel, press Escape, or click outside. Focus returns to the launcher when closed explicitly; handoff focuses the name field. The panel fits narrow screens and scrolls within short viewports. It does not open automatically or trap visitors in a conversation. Without JavaScript the launcher stays hidden and the page’s direct contact links remain available.

The form requires name, email, and a brief. Service, budget, and timing are optional. Keep native browser validation, reject whitespace-only required text, show message length, and preserve input after errors. Today “Open your project email” launches an email draft; the visitor must send it. “Copy project brief” is a fallback and also works with partial details. Never show a sent confirmation for either action.

## Target architecture

GitHub Pages continues serving HTML, CSS, JavaScript, and assets. Deploy a separate HTTPS server endpoint, proposed as a Cloudflare Worker at an owner-approved API hostname. Pages cannot host this server handler. The frontend calls `POST /contact` on that API; the server validates the request and sends a notification to a fixed agency inbox through Resend. No database or marketing subscription is required.

Configuration owned by the backend:

| Setting | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Server secret; restricted sending key where available |
| `CONTACT_FROM` | Sender on an agency-owned, verified domain |
| `CONTACT_TO` | Confirmed, monitored agency inbox; never taken from visitor input |
| `ALLOWED_ORIGINS` | Exact permitted browser origins |
| `TURNSTILE_SECRET_KEY` | Server secret for bot-challenge verification |

The public frontend receives only the endpoint URL and bot-challenge site key. The current site origin is `https://aetherai3.github.io`; `/Blackstar/` is a path, not part of the Origin header. Allow any future custom origin only after ownership is confirmed. CORS is not authentication and does not stop direct scripted requests.

Resend requires a verified sending domain. Have the domain owner complete the provider’s DNS verification before enabling delivery. The owner-designated inquiry inbox is `inquiries.blackstarent@gmail.com`; confirm it receives mail. Do not use that Gmail address as the Resend From address. [Resend domain setup](https://resend.com/docs/dashboard/domains/introduction).

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

Use a server-side POST to `https://api.resend.com/emails`, authenticated with a Bearer API key. Construct a fixed subject such as “Black Star project inquiry — Websites & web apps” from an allowlisted service label. Set `from` and `to` from server configuration, `reply_to` to the validated visitor email, and `text` to the formatted brief. Plain text avoids injecting visitor HTML. Resend’s send response returns an email ID; that acknowledges acceptance, not arrival in the recipient’s inbox. [Send email API](https://resend.com/docs/api-reference/emails/send-email).

Use `Idempotency-Key: blackstar-contact/<submissionId>` for provider requests. Keep the same ID and payload on a retry after an uncertain network result; generate a new ID if the visitor edits the payload. Resend retains idempotency keys for 24 hours. [Idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys).

Apply bot verification and a persistent rate limiter before contacting Resend. Initial policy: five attempts per ten minutes per privacy-preserving IP key, plus a configurable global daily cap. Tune with real traffic; in-memory counters in a distributed Worker are insufficient. Use a short-lived salted hash for rate-limit keys, never log briefs, challenge tokens, email addresses, or authorization headers. Return `Retry-After` on throttling. Invalid bot checks and honeypot values must never send email. Treat retry duplicates consistently without unnecessarily consuming quota.

| Response | Frontend behavior |
| --- | --- |
| 202 `{ "ok": true }` | “Your inquiry was accepted for delivery.” Clear only after this confirmed response |
| 400 `{ "code": "VALIDATION_ERROR", "fields": [...] }` | Display safe field errors and focus the first invalid field |
| 403 `{ "code": "VERIFICATION_FAILED" }` | Refresh the challenge and invite another attempt |
| 429 `{ "code": "RATE_LIMITED" }` | Keep the brief; explain when to retry |
| 502/503 `{ "code": "DELIVERY_UNAVAILABLE" }` | Keep input and offer copy/direct email fallback |
| Network timeout | Keep input; explain that the result is uncertain and retry using the same submission ID |

Once configured, change the main button to “Send project inquiry,” disable it while pending, expose pending/result text through the live status region, and prevent double clicks. Retain the copy option and direct email link. Announce errors clearly without exposing internal provider errors. Add a short privacy note explaining that inquiry details are processed for project correspondence through the agency’s email provider; no automatic newsletter opt-in.

Do not send automatic acknowledgements to arbitrary visitor addresses in the initial release. If later requested, specify a separate abuse-controlled acknowledgement flow. No live message, inbox access, or Resend account configuration is part of this static-site change.

## Delivery sequence and acceptance gates

1. Owner confirms recipient inbox, sender domain, DNS access, backend hosting account, and retention policy.
2. Verify the domain, store secrets on the backend, implement validation/challenge/rate limiting/idempotency, and configure the endpoint origin allowlist.
3. Add the public endpoint configuration and challenge widget to the form. Keep draft mode until backend readiness is confirmed.
4. Test with a mocked provider: all valid service paths, invalid fields, whitespace, oversized body, spam challenges, origin handling, throttling, timeout, provider failure, duplicate retry, and edited-payload retries. Confirm failure never clears the brief.
5. With an approved test recipient, send one real test, confirm inbox arrival and Reply-To, and inspect the provider event record. Remove test data according to the agreed retention policy.
6. Enable direct-send mode only after that check. If service health fails, restore draft mode without losing contact links.

## Static release checks

Verify the supplied Brandon portrait loads, all seven guide choices reach the correct service option, closing/back/reopening work, typed form details survive handoff, whitespace-only required text fails, and copy feedback is accurate. Check keyboard focus, Escape, reduced motion, narrow/short viewport styles, and absence of new external chat requests. The backend acceptance gates above remain pending until implemented.
