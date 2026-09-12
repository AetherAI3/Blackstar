# PostHog: Black Star measurement plan

Status: proposed setup, not installed or verified in project 605964. Prepared September 12, 2026. Brandon owns analytics and engineering; Edwin uses the content and service-interest results. Coordinate implementation with the agent building Resend.

## Start here

PostHog measures how people use the website. Resend sends inquiry emails. Neither replaces the project/inquiry database, search-engine reporting, or billing records.

1. Open the existing US PostHog project and select the JavaScript/HTML installation option for the static website.
2. Use `https://blackstarentertainment.org` as the production website. Copy the project's **public browser token** from its installation snippet. Project ID `605964` is not the token. Never put a personal API key or Resend secret in website code.
3. Start with Web Analytics and a small Product Analytics funnel. Leave Session Replay, automatic click capture, heatmaps, surveys, and exception capture off for the first release.
4. Review the privacy notice and implement the chosen analytics consent behavior before loading tracking. Analytics refusal, script blocking, or network failure must never prevent contact submissions.
5. Verify events in PostHog's live events view with a consenting test visit, then build the dashboard below. Do not label the integration live until these checks pass.

US ingestion endpoint: `https://us.i.posthog.com`. The dashboard hostname `us.posthog.com` is not the ingestion endpoint. Load the SDK once, only on the exact production hostname; do not count localhost, Cloudflare preview URLs, or the GitHub Pages copy as production traffic.

## Deliberately small event contract

| Event | Exact trigger | Allowed custom properties |
| --- | --- | --- |
| `$pageview` | One event on each real page load; section/hash navigation is not a new page | `route`, `environment` |
| `service_selected` | Visitor follows a service link or chooses a service in the guide | `service`, `source`, `route` |
| `contact_started` | First meaningful interaction with the form during this page visit | `service`, `source`, `route` |
| `inquiry_accepted` | Contact API confirms successful provider acceptance for a submission | `service`, `route` |
| `inquiry_failed` | Contact API explicitly rejects/fails a submission | `error_category`, `route` |
| `inquiry_status_unknown` | Timeout/network interruption leaves acceptance unknown | `route` |

Service values: `web`, `brand`, `video`, `social`, `automation`, `marketing`, `multiple`, `unspecified`. Sources: `hero`, `services`, `navigation`, `guide`, `footer`, `direct`. Error categories: `validation`, `verification`, `rate_limit`, `provider_unavailable`, `unexpected`. These are analytics enums, not promises about the eventual API's response schema.

Never send names, email addresses, message text, free-form budgets, form field values, challenge tokens, email content, provider responses, or raw errors. Do not call `identify()` with an email. Start with anonymous person profiles disabled (`person_profiles: 'never'`).

Strip query strings and fragments from captured URLs and referrers, including automatically enriched SDK properties and initial/referring URLs. Use an explicit `before_send` sanitizer and inspect actual outgoing payloads. Avoid saving full URLs in custom properties. Any future campaign attribution needs its own bounded, allowlisted UTM policy; this minimal setup sacrifices some campaign detail for cleaner data.

Explicit initial SDK settings: `autocapture: false`, `capture_pageview: true`, `capture_pageleave: false`, `disable_session_recording: true`, `disable_surveys: true`, `capture_exceptions: false`, `capture_heatmaps: false`, `capture_dead_clicks: false`, `person_profiles: 'never'`, `respect_dnt: true`. Confirm the current JavaScript SDK supports these options when implementing. Consent must gate initialization or capturing; configuration flags alone are not a working consent interface.

## Handoff to the Resend agent

- Keep all Resend credentials and sending on the server. Analytics is an optional observer of the existing form state, not a prerequisite for sending.
- Emit the browser's `inquiry_accepted` only after the API confirms provider acceptance. A submit click, opening an email draft, or a `mailto:` navigation is not acceptance. The current draft-only form must not emit this event.
- Use the form's stable submission ID to deduplicate success locally; do not include it in analytics unless there is a documented need. A retry of the same accepted submission must not generate another conversion. A genuinely new inquiry receives a new ID.
- Provider acceptance is not delivery. Only a verified delivery webhook can establish delivery; do not display or track it as delivered from the browser response.
- Map typed API failures to the safe categories above. Never forward response bodies or user input to PostHog. A timeout is an unknown outcome, not proof of failure; reconcile retries through the backend's idempotency contract.
- Keep authoritative counts in backend records. Browser analytics undercounts blocked/declined tracking. Do not also emit the same canonical conversion from the server and double-count it. A future server-owned event requires an explicit migration and consent/identity plan.
- Make analytics calls no-throw and non-blocking. Test the form with the SDK missing and its network requests blocked.

## One dashboard: Website → inquiry

Create these views after test events arrive:

1. **Traffic:** visitors/pageviews by landing page, referrer domain, and device category. Referrer stripping limits attribution; do not confuse direct/unknown traffic with a proven direct visit.
2. **Interest:** `service_selected` by service and source. This counts selections, not purchases or necessarily unique people.
3. **Contact funnel:** `$pageview` → `contact_started` → `inquiry_accepted`, initially within one day. Do not require a service click: people can contact directly from the hero.
4. **Mobile comparison:** break that funnel down by device category to find friction.
5. **Submission health:** failures by safe category, with unknown outcomes shown separately. Compare acceptance totals with backend records rather than treating browser totals as the ledger.

Check weekly: which pages attract useful visits, which services get interest, and where mobile visitors stop. Fix one clear problem at a time; low traffic is not enough evidence to declare a design winner. PostHog does not prove SEO rankings or AI-search visibility; use Search Console and Bing Webmaster Tools alongside it.

## Verification before activation is called complete

- Production loads one SDK; preview/staging/local hosts load none.
- One page load produces one pageview; hash navigation does not inflate it.
- Consent decline produces no analytics requests; changing preference works.
- Payload inspection confirms no personal form data or raw URL query strings, including SDK-added properties.
- Service selections use only the agreed enums.
- Draft-only mail flow never reports an accepted inquiry.
- Confirmed acceptance counts once; retry and double-click do not duplicate it.
- Timeout stays unknown; provider rejection is not success.
- Analytics blocked or throwing does not break form submission, guide, navigation, or mobile controls.
- Verify on desktop and a real mobile device; mark anything untested explicitly.

## Cost and scope

The published free allowance currently includes 1 million product analytics events per month and 5,000 session recordings. Replay is intentionally off here. No upgrade is needed for the proposed starting scope. Check the project's Billing & usage screen for its actual billing mode and any product spending limits; this plan has not inspected those account settings.

## Official references

- [JavaScript installation](https://posthog.com/docs/libraries/js)
- [JavaScript configuration](https://posthog.com/docs/libraries/js/config)
- [Data collection and privacy](https://posthog.com/docs/privacy/data-collection)
- [Web Analytics](https://posthog.com/docs/web-analytics)
- [Funnels](https://posthog.com/docs/product-analytics/funnels)
- [Current pricing and free allowances](https://posthog.com/pricing)
