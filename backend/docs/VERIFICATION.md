# Backend reference verification

Date: September 12, 2026. Runtime: Node v24.19.0. Scope: `backend/src` and the local test doubles only. All data are synthetic; no provider calls, real sends, charges, accounts, database mutations, or infrastructure chaos were performed.

## What actually ran

| Check | Observed result |
| --- | --- |
| `node --test` | 25 tests pass, including independent-review regressions R1/R2; final suite repeated three times without a failure |
| `node --test --experimental-test-coverage` | Source line coverage 100%, branch coverage 98.53%, function coverage 97.96% |
| `node scripts/mutation.mjs` | 10 of 10 selected mutations killed after one test improvement and review-specific expansion |
| Catalog integration | All 11 current proposed product schedules conserve their integer-cent totals |
| Primary-source review | Stripe webhook/idempotency/credit-note docs; Supabase RLS/private buckets; Resend email/idempotency docs |
| Proposed SQL | Read and checked structurally; not parsed/applied against Postgres and not certified deployable |

Coverage measures these small reference modules. It does not measure HTTP adapters, database authorization, real SDK behavior, mobile UI, or deployment because those implementations do not exist here.

## Tests that protect business boundaries

| Risk or review finding | Permanent protection |
| --- | --- |
| Tenant guessing or revoked access | Active membership and explicit project assignment tests, including cross-tenant resource/download rejection |
| Client discounts itself or sets paid status | Unknown-field rejection for `amountCents`, `status`, and `organizationId`; staff-only quote creation |
| Catalog drift changes a signed price | Quote snapshot fingerprint, immutable stage amounts, catalog version, exact-scope acceptance |
| R1: schema loses immutable quote revisions | Quote/version composite primary and foreign keys through stages and invoice mirrors; version is fingerprinted; prior-version stage approval cannot authorize v2 |
| R2: provider keys collide between tenants | Full organization/project/quote/version/stage tuple hashed into a fixed-length key; tenant/project/version isolation regressions |
| Expired offer or missing technical discovery | Server-clock expiry and required discovery/backlog rejection tests |
| Monthly invoices reuse a first-period key | One-time planner rejects monthly mode; recurring period implementation stays deferred |
| Incorrect premium/deposit arithmetic | 2,807 deterministic amount/basis-point combinations; half-cent regression; safe-integer/overflow rejection |
| Unsafe upload path or asset release | Filename never used as path; type/size limits; quarantine gate; tenant-bound signed-download plan |
| Unlimited or stale creative revisions | Version comparison and revision-limit rejection; atomic persistence still required |
| Forged or altered webhook | Unchanged Buffer passed to adapter; invalid signature/mode/size and parsed/string body rejection |
| Duplicate, concurrent, or old events | Serialized transaction test double; payment facts remain unique; old payload state is ignored in favor of provider fetch |
| Provider/storage outage | Failed durable insert never acknowledges; provider timeout and outbox failure preserve state and permit retry |
| Refund creates false revenue | Separate payment/refund/credit/fee facts; refund cap; original invoice preserved |
| Credit makes invoice paid without cash | `cashCovered` remains false for credit-only paid invoices and active disputes |
| Provider record disappears or changes | Journal conflict fails closed; no silent money deletion |

## Mutation sample and remediation

This is an intentionally bounded sample of ten manually specified source substitutions in temporary copies. Each mutant is syntax-checked, then the full suite runs. It is not an exhaustive AST mutation campaign; the proportion of all theoretically possible mutants is unknown. No equivalent mutants were excluded.

| ID | Deliberate break | First run | After remediation |
| --- | --- | --- | --- |
| M01 | Accept revoked membership | Killed | Killed |
| M02 | Remove quote-integrity check | Killed | Killed |
| M03 | Truncate a half cent instead of round | Killed | Killed |
| M04 | Remove Buffer type requirement at signature boundary | Survived | Killed |
| M05 | Permit refund greater than collected payment | Killed | Killed |
| M06 | Allow duplicate provider money facts | Killed | Killed |
| M07 | Allow monthly product in one-time planner | Killed | Killed |
| M08 | Permit acceptance after expiry | Killed | Killed |
| M09 | Drop tenant/project namespace from provider key | Added after review | Killed |
| M10 | Reuse prior-version milestone approval | Added after review | Killed |

Initial score: 7 / 8 = 87.5%. The original invalid-body test used an object without `length`; the separate length check still rejected it, so it did not independently exercise the Buffer check. Added a string-body regression with a valid length and asserted that no extra durable write occurred. That sample then reached 8 / 8. Independent review found SQL revision-key inconsistency (R1) and missing tenant/project namespacing (R2); fixed both, added permanent regression tests, and expanded the selected mutation sample. Final score: 10 / 10 = 100%. The script reports survivors and returns nonzero when any survives. SQL fixes received structural inspection only; no database execution is claimed.

## How the supplied loops were used

Read `LOOP-01-backend-api.md` and `LOOP-12-test-mutation-chaos.md` in full. Applied their intent: explicit authorization/data-flow boundaries, money/input bounds, safe error envelopes, permanent regression cases, property-style arithmetic tests, selected deliberate mutations, and failure-injection tests using local test doubles. Architecture contracts map the proposed route → permission → domain → provider/persistence boundaries.

A formal end-to-end LOOP-01/12 run is **not claimed**. The shared `PROTOCOL.md` was not supplied; `ast-grep`/Semgrep were not available; this workspace was a source copy rather than the loops' required clean origin-based worktree; no deployed router, ORM or existing backend baseline was present. Those limitations preclude the specified AST audit, origin/branch compliance, full previous-bug sweep, and production security verdict. No code pruning was attempted.

`chaos_env` was not specified, so real chaos nodes were skipped: database unavailable, cache offline, API timeout, network latency, disk full, memory pressure, token limit, LLM unavailable, malformed LLM output, and MCP unavailable. The local timeout/outbox/durability fixtures above are deterministic unit-boundary simulations; they are not infrastructure chaos grades or recovery-time evidence. There is no LLM dependency in this backend design.

## Remaining gates and unknowns

1. Real identity/session verification, durable authorization, RLS/grants, membership revocation and CSRF/CORS/rate-limit middleware remain unimplemented.
2. SQL migration, row-lock/lease/CAS behavior, unique stage issuance, immutable accepted records, atomic revision allocation, backup/restore and multi-worker tests remain unverified.
3. Official SDK signature tolerance, endpoint account binding, sandbox checkout, pagination, complete balance/refund reconciliation, retries/dead letters and semantic notice deduplication need implemented adapters.
4. Monthly service periods/subscriptions are deliberately rejected by the one-time planner. Tax treatment, refund terms, legal business form, contractor classification and accounting mappings are owner/adviser decisions.
5. Credit voids, fee reversals, out-of-band allocations and chargeback reversals require compensating-entry work. Conflicts go to manual review; nothing automatically charges or releases work.
6. Storage scanning, private upload/download enforcement, delivery/receipt confirmation and real portal UX need implementation and proof.

The supported conclusion is that the proposed local rules are executable and their main business failure paths have tests. Production readiness remains blocked until the [activation gates](../README.md#activation-gates) have concrete evidence.
