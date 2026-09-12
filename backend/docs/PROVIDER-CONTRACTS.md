# Provider adapter contracts

Status: proposed. Sources checked September 12, 2026. All actual provider ports are unconfigured and reject. Test doubles exist only in tests; no runtime falls back to them.

## Identity and database

`verifyIdentity` must validate issuer, audience, signature, expiry and revocation/session rules through the chosen provider. Load organization membership and project assignments server-side, including active state. The `context` objects accepted by the domain modules are trusted internal values, never request JSON. Supabase service credentials can bypass RLS and must remain server-only; exposed data requires RLS. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

`schema/001_proposed.sql` demonstrates composite tenant relationships and deny-by-default tables. It has not been applied. It intentionally contains no browser grants or policies. Add reviewed access policies and tenant tests at integration time; a missing policy must deny access. Elevated backend access still requires application authorization. Database enforcement must reject edits to accepted quote snapshots and already-posted journal facts, validate invoice stage totals, and atomically allocate revision rounds; these runtime procedures/triggers are not included.

Use transaction-scoped prepared queries, bounded pagination, indexes for membership/project keys, short timeouts and correlation IDs. Monitor failed authorizations without logging private payloads. The proposed inbox index supports bounded scheduled work. Persist outbox recipients as approved user references; resolve addresses server-side immediately before sending and recheck revocation.

## Stripe

| Port | Required implementation |
| --- | --- |
| `verifyStripeEvent(rawBody, signature)` | Official SDK verification with correct endpoint secret and timestamp tolerance; raw bytes unchanged; reject invalid signature before any work |
| `insertEventOnce(event)` | Persist unique account/mode/event ID plus minimum required verified payload; `true` for new, `false` for duplicate; throw on durability failure |
| `resolveInvoiceBinding(event)` | Map provider invoice/refund/charge/credit reference to the stored invoice, customer, account and mode; never trust tenant IDs in event metadata alone |
| `withInvoiceTransaction(invoiceId, callback)` | Serialize same-invoice work, use current committed version, and commit invoice journal + processed-event state + outbox together; rollback on any failure |
| `fetchInvoiceSnapshot(invoice)` | Retrieve current invoice and all related settled payment/refund/credit/balance-transaction facts, complete all pages, normalize integer USD cents and account/mode; throw if unavailable/incomplete |
| `issueInvoice(command)` | Require explicit approved runtime configuration, accepted immutable scope, fixed customer binding, payable stage, unique stored command and idempotency; proposal-mode commands always reject |
| `issueRefund(command)` | Reserved for future audited staff workflow; no implementation or automatic payouts supplied |

Stripe requires the original request body for signature checking, can deliver duplicates, and does not promise event order. Persist first, queue reconciliation, identify deliveries by event ID, and retrieve current state instead of treating an event timestamp as a version. [Stripe webhooks](https://docs.stripe.com/webhooks).

The transaction port in this reference runs the fetch inside the serialized callback. A production adapter must bound provider timeouts and avoid long transactions: one implementation can take a per-invoice worker lease, fetch current state, then use a short database transaction with version comparison and re-fetch on a conflict. The lease and compare-and-swap must be tested across concurrent workers; an in-process mutex is insufficient for distributed workers. A failed event remains retryable with bounded exponential backoff and an inspected dead-letter state.

Provider API idempotency does not replace a permanent local command record. Stripe may remove keys after at least 24 hours; retries need the same parameters. Retain organization/project/quote/version/stage uniqueness and provider invoice mapping independently. The complete tuple is hashed into the bounded provider key; every revision has its own immutable SQL quote row and versioned invoice-stage foreign key. [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests).

### Money facts and reconciliation

The snapshot contract contains `invoiceId`, `customerId`, `accountId`, `livemode`, `currency`, `totalCents`, `status`, `amountRemainingCents`, `disputed`, and fully collected arrays `payments`, `refunds`, `credits`, `fees`. Every fact has stable provider ID and integer `amountCents`; refunds additionally reference the corresponding payment ID and must be succeeded. Pending/failed refunds remain visible in the provider adapter's exception/read model and never count as completed refunds. A complete snapshot is an adapter assertion backed by pagination, not a client field.

- `collectedCents`: settled invoice payment facts. A zero-balance invoice after credit does not prove cash receipt.
- `refundedCents`: succeeded cash refunds tied to known payments, capped by their collected amount.
- `creditedCents`: invoice obligation adjustment. Do not subtract it again from cash if a linked refund already records the cash movement.
- `feeCents`: confirmed attributable processor fees. Estimates from pricing do not become actual ledger fees.
- `netCashCents = collectedCents − refundedCents − feeCents`. This is operating cash information, not profit or recognized revenue.
- `amountRemainingCents` remains the provider's reconciled figure. The system does not automatically reopen a paid invoice after a refund.

Credit notes adjust an invoice without replacing the original; they can bring an open balance to zero without recording payment. Preserve invoice, credit and refund relationships. [Stripe credit notes](https://docs.stripe.com/invoicing/dashboard/credit-notes).

The reference detects and blocks changed or missing previously posted facts. Credit-note voids, fee reversals, chargebacks/reversals, out-of-band payments, customer balance allocations, partial/unmatched payments, tax recalculations, currency conversion, and cross-invoice allocations need explicit compensating entries or manual reconciliation; they are **not implemented**. Retain failure visibility and do not mark the project cash-cleared on exceptions. Pending disputes remain a release hold. An accountant confirms general-ledger mapping and revenue/tax treatment.

Nightly reconciliation should compare provider invoice/credit/refund totals, local journal, and payout/balance transactions; output an exception report with event/invoice IDs and cent deltas. No auto-correcting charges or silent deletions. The supplied reference contains no scheduled job or live payout reconciliation.

## Storage and email

Only private storage buckets. `signUpload` applies actual upload constraints, server object key, content validation and quarantine; `signDownload` rechecks access, clean state, short TTL and safe disposition. Client-declared MIME is only a hint. No malware scanner or storage adapter is implemented. Supabase private buckets require authorized access or an expiring signed URL. [Storage access control](https://supabase.com/docs/guides/storage/buckets/fundamentals#private-buckets).

`sendNotice` reads a committed outbox row, resolves an approved recipient, uses a fixed template and verified sender domain, then persists the provider acceptance ID. Provider acceptance and inbox arrival remain separate states. Dedupe repeated provider facts before creating business notices; distinct event IDs about the same unchanged invoice should coalesce into a single meaningful status notification. The current worker demonstrates event-level outbox atomicity; semantic notification coalescing remains an adapter/service task.

Implement inquiry bot checks, durable quotas, idempotency payload hash and exact origin policy from the [Resend spec](../../docs/CONTACT-AND-RESEND-SPEC.md). Keep marketing consent separate; no unsolicited autoresponder or stored sensitive file attachments in notices. [Resend email API](https://resend.com/docs/api-reference/emails/send-email), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
