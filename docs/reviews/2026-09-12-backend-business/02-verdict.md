# Round 2 — PASS for the proposed reference package

Date: 2026-09-12. Independent re-attack of [round 1](01-adversarial-review.md), using the unchanged [ten-check rubric](00-review-intake.md). **All ten checks are now satisfied for this proposed, offline reference scope. Zero HIGH/CRITICAL findings remain within that scope. Production activation is still blocked by the documented provider, database, operational and business gates.**

The result permits publishing the reviewed proposal and reference code. It does not certify a deployed portal, establish a company, validate customer demand, or authorize charging/sending/paying anyone.

## Revisions independently checked

| Finding | Builder change inspected | Re-attack result |
| --- | --- | --- |
| R1 — quote revision identity | [SQL](../../../backend/schema/001_proposed.sql) now keys quote rows by organization/project/ID/version; invoice-stage primary keys and invoice-mirror uniqueness/foreign keys carry the exact version. [Billing rules](../../../backend/src/billing.mjs) bind version into the immutable fingerprint and require version-specific stage approval. [API contract](../../../backend/docs/API-CONTRACT.md) explains lineage, supersession and preservation of old invoices. | Resolved for design/reference scope. The new R1 regression passed; v1/v2 retain different fingerprints and obligations; v1 stage approval does not authorize v2. SQL still needs an actual migration and concurrent transaction test before production. |
| R2 — cross-tenant idempotency collision | Provider key now hashes the full canonical organization/project/quote/version/stage tuple; the command retains the tuple for local uniqueness and review. | Resolved. Reviewer independently replayed equal quote IDs across two tenants, two projects and two versions: four distinct keys. An identical retry returned the identical command. The permanent R2 regression also passed. |
| R3 — acceptance expiry versus collection | [Stripe setup](../../../billing/STRIPE-SETUP.md) now distinguishes offer expiration before acceptance from an accepted agreement's authorized later milestones. | Resolved. Reviewer independently checked that new acceptance at exact expiry fails, while an already-accepted quote still plans its explicitly approved stage after that offer deadline. No cancelled/superseded scope is implicitly approved. |
| R4 — incomplete verification packaging | [Backend verification](../../../backend/docs/VERIFICATION.md) now exists and records observed tests, bounded mutation work and untested integration surfaces. | Resolved. The documented top-level command completed successfully, including document links and static-site regression checks. |

## Independent execution record

Command from repository root: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/verify-business.py`.

| Check | Reviewer-observed result |
| --- | --- |
| Catalog, aliases, exact schedules, baseline economics and generated report | 11 proposed products verified |
| Billing arithmetic/negative-input suite | 12 tests passed |
| Partner economics and ratchet fixtures | 7 tests passed |
| Backend domain and webhook boundary suite | 25 tests passed |
| Combined local test cases | 44 passed, zero failed |
| Deposit artifact | Recomputed output matched the checked-in evidence and catalog |
| Authored document links | 24 document sets checked at execution time |
| Public-site regression | Nine pages passed route/asset/fragment/ID/JSON-LD/sitemap checks; shared scripts parsed |
| Independent namespace/expiry counterexample | Four distinct authorized obligation keys, stable exact retry, expiration rejected only at new acceptance |

The builder additionally records selected mutation and coverage measurements in its [verification artifact](../../../backend/docs/VERIFICATION.md). The reviewer inspected that disclosure and permanent regressions but did not rerun mutation copies or independently measure production coverage. Those selected mutants are not a historical agent benchmark or a score for all possible faults.

## Score history and evidence bounds

| Round | Satisfied checks | Verdict | Reason |
| --- | ---: | --- | --- |
| 1 | 6 / 10 | REVISE | Quote-version schema inconsistency, idempotency namespace collision, expiry contradiction and incomplete packaging |
| 2 | 10 / 10 | PASS — proposed scope | All four findings resolved; independent counterexample and full local gate passed |

This is a completeness count, not a calibrated correctness probability. The review ends after two bounded rounds because the cited findings are resolved and the original proposed-scope bar is met. No criteria were weakened, no silent agreement was used, and no target files were changed by the reviewer. Review artifacts are the only reviewer-authored files.

## Unknowns retained as real launch gates

- **Commercial:** founder approval of prices/capacity, contracting/payee identity, agreements, tax/accounting, contractor classification, and real delivery hours/customer willingness to pay. Published alternatives and a cost model do not establish profitable demand.
- **Backend:** actual authentication and RLS/authorization, schema execution, immutable persistence, multi-worker transactions/leases, provider signature SDK behavior, invoice/subscription creation, pagination, compensating money entries, real sandbox payment/refund/dispute reconciliation, and private storage/scanning.
- **Operations:** verified sender/inbox, delivery confirmation, role revocation, backup restoration, incident handling, actual mobile/keyboard portal behavior and controlled authorized live validation.
- **Governance:** first-run descriptive architecture only; no defensible prior drift, fleet improvement, token-efficiency, historical benchmark, reliability trend or self-optimization result. LOOP-14 remains bootstrap/insufficient-data and LOOP-15 remains deferred. No persistent automation was installed.

These gaps were not relabeled passing. The [backend activation gates](../../../backend/README.md#activation-gates) and [implementation roadmap](../../business/IMPLEMENTATION-ROADMAP.md) remain the authority for moving from reference to a real client operation.
