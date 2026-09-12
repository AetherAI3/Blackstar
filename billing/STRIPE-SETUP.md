# Stripe implementation proposal

**Owner: Brandon. Status: design and offline catalog only.** Keep checkout disabled until the approved business/payee identity, reviewed commercial terms, active Stripe account, tax handling and signed scopes are ready. Do not publish payment buttons just because an alias exists.

## One understandable client bill

Each approved quote shows the agreed total, what is due now, what remains, the service period for recurring work, taxes/approved pass-through costs, and acceptance or due-date rules. The client can see invoices and receipts in one billing view. Quote value, invoiced amount, collected cash, refunded amount and outstanding balance are separate values.

| Engagement | Proposed collection method | Client-facing action |
| --- | --- | --- |
| Fixed project | Two customer-specific milestone invoices, normally 50% / 50% | `Pay opening payment · $1,750` with `$3,500 project total · $1,750 remaining` for the standard website |
| Discovery | One scoped invoice, fully prepaid | `Pay for project discovery · $500`; does not imply a build purchase |
| Monthly service | Explicitly consented monthly subscription or separately approved monthly invoice | `$1,500 / month · next period [dates]`; first month's payment is service prepayment |
| Custom/mixed engagement | Approved quote with its own immutable line items and schedule | Amount and scope from the quote, never a catch-all “custom payment” card |

A deposit is credited toward the agreed full project price. It is not a second fee on top. Do not label every opening payment “non-refundable”; cancellation/refund terms depend on the executed agreement, work performed and applicable requirements. Payment is not acceptance of unfinished work. Do not debit a saved payment method for an unapproved scope change.

## Products and prices

`catalog.json` is the mapping source. For each product, `stripe.product_key` is our alias for a Product; `stripe.prices[].lookup_key` is a proposed Stripe lookup key for a Price. Neither is a provider object ID. `unit_amount_cents` and interval must exactly match its linked payment schedule. Store actual test/live object mappings in a private, environment-specific database/configuration after provisioning; no invented `price_...` identifiers in Git.

Example: `website_launch` → Product alias `bs_website_launch_v1`; two one-time Price aliases `bs_website_launch_deposit_usd_v1` and `bs_website_launch_balance_usd_v1`, each `175000` USD cents. They total `350000`, not `700000`. Even where both amounts match, purposes stay distinct. `social_content_month` → `bs_social_content_month_monthly_usd_v1`, `150000` cents with recurring interval `month`.

If approved custom scope changes a standard amount, create a distinct approved quote line/price mapping. Never reuse an old lookup alias for a different commercial promise. Archive superseded prices for new sales while preserving historical invoices and accepted quote snapshots. Coupons, adjustable quantities, customer-selected prices, automatic upsells and trial periods are disabled in the first implementation.

## Quote authorization before collection

1. Authenticate the client and check their project/organization membership. Load the accepted quote and its approved version. Offer expiry blocks a new acceptance; it does not cancel later milestones on an already accepted agreement. Check that the agreement remains active and the milestone is currently authorized. The server must derive the payable amount, currency, status and Stripe customer identity.
2. Authorize only that quote's currently due, unpaid milestone. A development sprint also needs an accepted technical discovery record and bounded backlog before quoting. Proposed catalog status alone never authorizes payment.
3. Prefer a customer-specific Hosted Invoice or a server-created Checkout Session tied to the approved invoice/milestone. Send/display its URL only in the authorized client flow. A provider-hosted URL may still be forwarded; do not expose private project assets or rely on URL secrecy to authorize portal data.
4. Record `quote_id`, version, milestone, organization and internal payment reference as non-sensitive metadata. Use a stable server idempotency key for creation and a database uniqueness constraint per milestone. Do not send source briefs or personal details as metadata.
5. Treat a successful return URL as navigation only. Confirm payment through signature-verified provider events, retrieve current provider state, reconcile amount/currency/customer/reference, and deduplicate events. Handle async methods, failure, refund, partial refund and dispute independently.
6. Reconcile provider payment records against invoices weekly, and before final handoff. Collect a balance only when its contract milestone is reached. Access expiry, refund review, retry and cancellation are explicit operational actions, not silent website lockouts.

[Stripe Checkout creates a session for a payment flow](https://docs.stripe.com/api/checkout/sessions/create). [Stripe's webhook guidance](https://docs.stripe.com/webhooks) covers endpoint signature verification and duplicate event handling. The backend skeleton is a domain model, not verification that a production webhook adapter or membership controls exist.

## “Stripe cards” design specification

Use the existing dark rounded visual theme. Four entry cards: Website launch, Development sprint, Content session, Social content cycle. Before a quote exists, the only action is `Choose this direction` / `Request a scope`, and prices are hidden until founders approve publishing. Do not render card data directly from internal economics fields.

An authorized billing card should display product name, quote reference, signed scope link, total, current amount due, remaining balance or monthly dates, and a single payment action. Show `Awaiting payment`, `Processing`, `Paid`, `Refunded` or `Payment needs attention` from verified state, never optimistic checkout redirects. A short status sentence is more useful than a decorative badge. Native links/buttons, visible focus, readable amounts, mobile stacking and reduced-motion behavior match the site.

Avoid public reusable Payment Links for scoped projects. If the founders later choose an admin-assisted Payment Link flow, create one for a single approved obligation, constrain its use, reconcile identity/reference server-side and deactivate it after collection. Its shareability remains a limit; it is not a replacement for authentication or per-client invoices. [Payment Links documentation](https://docs.stripe.com/payment-links).

## Test-mode acceptance before live enablement

Use provider test mode and synthetic identities. Prove that the correct signed quote can pay, another organization's quote is denied, altered browser amounts are ignored/rejected, expired quotes fail, double clicks create one obligation, repeated/out-of-order events cannot double-credit it, partial refunds keep correct balances, and subscription renewals/cancellation use the agreed period. Show actual tax/fee treatment for the chosen account. Compare the observed provider event to the ledger and client display. No real client outreach or charge is part of these tests.

The first release can use manually created customer-specific invoices and a private ledger while portal automation is being verified. Automated contractor payouts/Stripe Connect are a separate later decision; the agency does not need a freelancer marketplace to bill its own clients.
