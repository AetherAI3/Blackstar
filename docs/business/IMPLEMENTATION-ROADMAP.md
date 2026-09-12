# From proposal to working operations

**Owner: Brandon · proposed implementation sequence.** Reference [backend](../../backend/README.md), [billing](../../billing/README.md), [portal contract](PORTAL-AND-INTEGRATIONS.md), and [Resend intake](../CONTACT-AND-RESEND-SPEC.md). Edwin owns media/brand workflow requirements and creative acceptance.

## Keep the first operating system small

Use a private project ledger, asset folder, scope template and provider-hosted invoices first. The portal earns its build cost when asset collection, approvals and invoice questions consume measurable founder time. The public marketing site remains on GitHub Pages. The proposed API runs separately; no secret or webhook belongs in a Pages script.

| Stage | Build or configure | Completion evidence | Dependency |
| --- | --- | --- | --- |
| 1. Commercial setup | Approved catalog version, payee identity, scope/cancellation/privacy templates, provider test account | Synthetic quote totals and milestones match; both founders approve offer capacity | Business decisions, no production charge |
| 2. Reliable inquiry | Server-side validation, spam/rate controls, durable acceptance/outbox, Resend adapter | Approved sandbox/controlled delivery check plus timeout/duplicate/failure tests | Verified sending domain and monitored recipient |
| 3. Manual billing | Customer-bound test invoices from approved milestones; one reminder owner | Deposit, balance, failed payment, void, refund and reconciliation evidence | Stripe test configuration and approved scope |
| 4. Portal core | Invite-only project overview, asset requests, versioned feedback and explicit approval | Two-tenant role/isolation tests, upload quarantine, stale-approval checks | Auth, database and private object storage |
| 5. Billing read model | Verified raw webhooks, durable inbox, serialized reconciliation, invoice links | Replay/duplicate/reordered events, restore/retry and cross-tenant fixtures | Tested persistence and provider adapters |
| 6. Safe launch | Private staging, mobile/keyboard review, monitoring, backups/restore, recovery and spend controls | Written release checklist with owners and a controlled authorized live transaction | No unresolved HIGH/CRITICAL release finding |
| 7. Partner operations | Scoped supplier orders, accepted milestone payables and access revocation | One paid assignment reconciled; no automatic split needed | Valid agreements and classification review |

The reference modules are a starting point for domain behavior and tests. Provider ports deliberately fail closed. The proposed SQL requires migration review and an actual database execution test. The API contract is not a deployed API, and in-memory fixtures are not durable storage. Build the production portal privately; keep only generic reference material here.

## Provider ownership

| Provider / system | Account owner | Responsibility |
| --- | --- | --- |
| GitHub Pages | Agency authorized owners | Public site and docs, no client data |
| API / Worker | Brandon administering agency account | Auth enforcement, secrets, API boundaries, monitoring |
| Supabase | Agency organization | Invite-only Auth, database policies, private assets, backup/restore |
| Stripe | Confirmed agency contracting/payee entity | Hosted invoices, recurring billing after authorization, refunds and reconciliation |
| Resend | Agency verified domain | Transactional notices, bounded retries and delivery monitoring |
| Client hosting/tools | Client wherever practical | Client owns subscriptions and access; agency receives role-limited invitations |

Do not hardwire Aether services without a real supported interface, a client-approved data path and clear costs. Reuse Brandon's development experience and tools while keeping agency/client accounts and intellectual property boundaries explicit.

## Ready-to-build backlog

| ID | Owner | Acceptance |
| --- | --- | --- |
| OPS-01 | Both | Finalize identity, roles, price/version approval and agreements privately |
| BILL-01 | Brandon | Create test Products/Prices per mapping, no reusable public amount entry |
| BILL-02 | Brandon | Quote snapshot → project/customer-bound invoice; exact opening amount and balance |
| INTAKE-01 | Brandon | Implement durable inquiry service and honest accepted/error UI states |
| AUTH-01 | Brandon | Verify identity server-side; active project grants enforced for every operation |
| DATA-01 | Brandon | Apply migration in disposable database; role tests and restore rehearsal |
| MEDIA-01 | Edwin + Brandon | Asset request → quarantine → safe preview → exact-version approval |
| EVENT-01 | Brandon | Raw signature, durable inbox/outbox, deduplication, per-invoice lock and retry telemetry |
| QA-01 | Both | One synthetic end-to-end project and mobile/browser review, including inaccessible other tenant |
| LIVE-01 | Both | Reviewed operational gates, provider configuration and authorized live validation |

Ship one stage at a time with evidence in a private release record. Don't build a CRM, native app, marketplace, autonomous sales agent or custom payment UI before the core flow works.
