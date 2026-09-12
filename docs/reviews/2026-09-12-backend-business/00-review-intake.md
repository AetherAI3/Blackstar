# Backend and business review — intake

Date: 2026-09-12. Review surface: proposed Black Star business documentation, package economics, and a reference backend skeleton. Reviewer role: independent skeptical business/security reviewer. The reviewer may write only this review directory; builders apply changes to target files. No payment, email, infrastructure, or production client-data action belongs to this review.

## Method and limits

Use the supplied LOOP-11 adversarial method: unknowns first, evidence for each finding, builder revision, then independent re-attack. Budget: two review rounds, extend to four only for concrete unresolved findings. Agreement without cited evidence does not pass. A ten-check count below is a completeness rubric, **not a calibrated probability of correctness, a market validation score, or production certification**. PASS requires all ten checks satisfied for the proposed scope and zero unresolved HIGH/CRITICAL issues in that scope. Explicitly disabled production capabilities may have unresolved activation gates.

The supplied LOOP-11/13/14/15 files were read in full. The shared `PROTOCOL.md`, prior governance ledger, historical benchmark corpus, and a code-graph baseline were not present in the inspected repository/upload file lists. Consequently this is a scoped adaptation of the review method, not a claim to have executed the entire loop collection. No missing protocol is invented, no procedure is installed, and no loop instructions are modified.

## Unknowns to attack first

| Unknown | Existing evidence | Required treatment |
| --- | --- | --- |
| Real client willingness to pay, delivery hours, acquisition cost, utilization and refund rate | [Operating specification](../../business/OPERATING-SPEC.md), “Offer structure,” says choose prices after estimating labor/cost/capacity | Separate proposed prices and modeled costs from market observations; name validation experiments and repricing triggers |
| Contracting entity, partner ownership, professional classification, tax treatment and insurance | [Operating specification](../../business/OPERATING-SPEC.md), “Business structure decision register” | Preserve decision register and owner gates; a revenue-share illustration cannot establish equity or a contractor's legal classification |
| Payment accounts, sender domain and monitored inbox | [Operating specification](../../business/OPERATING-SPEC.md) and [contact specification](../../CONTACT-AND-RESEND-SPEC.md) | No live purchases/sends or claim of connected providers; expose no secrets; current site remains email-draft mode |
| Private storage, tenant authorization and workflow runtime | [Portal specification](../../business/PORTAL-AND-INTEGRATIONS.md), “Release and operational gates” | Make runnable reference behavior fail closed; mark stubbed adapters; separate schema/static tests from provider or database integration tests |
| Real historical agent-performance trend | No `PROTOCOL.md`, `_loopstate` ledger or prior run corpus in inspected files | Use bootstrap/deferred status; do not publish invented confidence, token efficiency, success rates or benchmark detection scores |

## Proposed-scope completion rubric

Each row is worth one point only when all conditions in that row have cited evidence. Record round scores as satisfied checks / 10, accompanied by findings; do not average away a HIGH issue.

| ID | Required evidence |
| --- | --- |
| C1 | README clearly separates live website, executable reference behavior, proposed services, and production activation gates; paths and run instructions are accurate |
| C2 | Every product has an ID, bounded deliverables/exclusions, price/currency, opening payment and remaining balance or recurring schedule; math is reproducible |
| C3 | Price research has dated attributable sources; recommendations visibly separate assumptions, marketplace ranges, employee wages and agency prices; no unsupported demand or outcome claim |
| C4 | Economics distinguish markup, gross/contribution margin and profit; include founder labor, contractor cost, processor/product fees, rework/reserves and capacity; examples reconcile |
| C5 | Partner participation defines the compensation base, eligibility, approval, refunds/chargebacks, timing and exit; no implied equity, perpetual referral entitlement or unsupported legal classification |
| C6 | Booking/billing ties payments to accepted scope and capacity, permits no client-selected amount or paid state, avoids duplicate deposits/balances, and defines refund/credit reconciliation |
| C7 | Backend separates public site/private data, validates and authorizes at boundaries, fails closed for missing adapters, and documents tenant isolation, webhook verification/idempotency and production tests |
| C8 | Safety-relevant executable behavior has meaningful negative/failure tests with recorded commands/results; untested live-provider/SQL/deployment claims are explicitly excluded |
| C9 | Existing scope, portal, contact and operating docs agree with the proposed catalog/architecture or point to a clear authoritative replacement; no ambiguous competing defaults |
| C10 | Adversarial findings and builder responses are traceable; idea selection and ratchet reject unsupported/unsafe ideas; governance and drift notes acknowledge missing inputs and no ongoing automation |

## Initial risk register for builders

These are risk conditions to prevent, not confirmed vulnerabilities in a backend that has not yet been supplied.

| Risk | Consequence if introduced | Required guard |
| --- | --- | --- |
| Open payment links sold as immediate fixed-scope production booking | Client pays for work the two founders cannot deliver or has not scoped | Staff-approved scope/capacity before releasing project-specific invoice or checkout; product cards explain estimate/starting scope |
| Deposit deducted manually and again in a provider balance invoice | Underpayment, overbilling or duplicate collection | Integer minor-unit milestone schedule, unique agreement/milestone payment identity, explicit amount reconciliation |
| Percentage split presented without defining the denominator | Founder/contractor conflict and margin loss | Define net service revenue, pass-through/tax exclusions, refunds, payment fees, labor and overhead separately |
| Founder time considered free, or reserve called profit | Attractive but fictitious unit economics | Cost both founders' delivery time; distinguish contribution from company operating profit and cash availability |
| Blanket “nonrefundable” label on a proposed deposit | Unsupported commercial/legal assumption and dispute exposure | Proposed booking/earned-work/refund schedule subject to executed terms and applicable review; payment status distinct from revenue earned |
| Reference endpoint returns success when storage/provider is missing | False payment or delivery state | 501/503 or typed unavailable error; tests prove no fabricated success |
| SQL policies hide mismatch between organization/project identifiers | Cross-client data leakage | Foreign-key consistency plus request/database tenant tests; no broad unscoped service-role access |
| Repeat invoice/event arrives after a newer paid/refunded event | Stale state or duplicate notices/work release | Durable dedupe; canonical provider reconciliation; outbox uniqueness; explicit event replay and out-of-order tests |

## Drift and governance bootstrap

This is the first observed architecture baseline; no temporal drift can be measured. The existing portal doc is a target design, not a record of deployed modules. A line count inspection found no current public-site source file over the supplied LOOP-13 800-line watch threshold (`shared.js` 166, `script.js` 71, `guide.js` 90, `styles.css` 134, `index.html` 241, generator 115). These compact/minified line counts are not evidence of low complexity. Cyclomatic/cognitive complexity, fan-in/out, call-graph size, coverage, mutation score, performance and accessibility scores are unmeasured; the six LOOP-13 debt axes are therefore **N/A**, with no composite or trend claim.

LOOP-14 status: **INSUFFICIENT-DATA / bootstrap**. Fewer than three historical governance rows are available. All ten specified metric families—success rate, retries, debate rounds, tool success, overrides, tokens/tier mix, hallucinations caught, false-positive rate, MTTR and rollbacks—lack a comparable run series. Improving, looping, degrading, wasting and less-reliable detectors are not inferable. A local test regression is not a historical agent benchmark. Do not manufacture historical cases from known fixes in the current review.

LOOP-15 status: **DEFERRED**. No fresh complete governance report or repeated independently evidenced procedure defect justifies loop self-modification. Recommendations can be recorded as weak signals; no procedural-memory diff, hidden schedule, account setup or autonomous self-update is authorized by this artifact.
