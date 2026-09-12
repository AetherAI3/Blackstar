# Proposed API contract

Status: design only. No routes in this document are deployed or implemented as HTTP handlers. Prefix `/v1` on the separate API origin; no private API under GitHub Pages.

## Shared rules

The API verifies identity and loads active organization/project permissions from storage on every request. An `organizationId`, role, approver, paid flag, provider customer ID, amount, or storage path supplied by a browser never grants authority. Return `404 NOT_FOUND` for inaccessible objects. Use opaque server-generated UUIDs in persistence. The domain tests use readable synthetic identifiers only.

JSON bodies use a 16 KiB cap, content-type check, explicit field allowlist, and safe error envelope `{ "code": "VALIDATION_ERROR", "requestId": "..." }`. Use `400` for validation, `401` for missing identity, `404` for inaccessible objects, `409` for stale scope/version or conflicting idempotency payload, `413` for oversized bodies, `429` with `Retry-After`, and `503` for unconfigured/unavailable dependencies. Never return stack traces or provider responses.

Initial operational limits are proposals: list page default 20/max 50 using opaque cursor; 60 reads/minute/user; 10 mutations/minute/user; 5 upload plans/minute/user; 100 MiB/upload plus a per-project storage cap; bounded external timeouts of 5 seconds. Enforce limits in durable shared storage. Client hints and an in-memory Worker counter are insufficient. Do not accept arbitrary outbound URLs. Where preview URLs are required, serve known storage objects or an explicit host allowlist.

| Method / route | Allowed caller and input | Result and atomic boundary |
| --- | --- | --- |
| `POST /contact` | Public; exact request from [contact spec](../../docs/CONTACT-AND-RESEND-SPEC.md), verified bot challenge and quota | Fixed agency inbox through Resend; separate idempotency payload hash; `202` means accepted, not delivered |
| `POST /invitations` | Staff admin; stored organization/project, intended role, recipient | Invite-only single-use hashed token, expiry and revoke state; outbox record in same transaction |
| `POST /invitations/accept` | Verified identity matched to invitation; token | Consume token once and add approved membership/project access atomically; no public organization creation |
| `GET /projects` | Active authenticated user; `cursor`, `limit` only | Membership-filtered project summary; no internal notes |
| `GET /projects/:id` | Explicit project access | Current stage, owner, next action, agreed scope version |
| `POST /projects/:id/quotes` | Staff admin; `productId` only for catalog quote; server creates ID and scope digest | Proposal snapshot from server catalog; custom scopes require a separate audited staff quote workflow |
| `POST /projects/:id/quotes/:quoteId/versions/:version/accept` | Current designated client approver; `fingerprint`, `scopeDigest` | Load the exact offered version and compare fingerprint; preserve exact acceptance identity/time |
| `POST /projects/:id/quotes/:quoteId/versions/:version/stage-invoices` | Staff admin; `stageKey`; `Idempotency-Key` header | Read the exact accepted version and staff-approved milestone; one invoice command per organization/project/quote/version/stage; browser never supplies amount |
| `GET /projects/:id/invoices` | Explicit project access; bounded pagination | Tenant-bound provider-hosted invoice URL and reconciled status, refund/credit detail; no card information |
| `POST /projects/:id/uploads` | Authorized contributor; `filename`, `contentType`, `sizeBytes` | Server creates object key and constrained upload target; quarantine until scan and actual size/type verification |
| `GET /projects/:id/assets/:assetId/download` | Explicit project access; clean asset only | Short-lived signed download; attachment disposition; never sign a browser-supplied path |
| `POST /projects/:id/deliverables/:id/feedback` | Designated approver; `expectedVersion`, `comments` | Lock deliverable, compare version/status, allocate one consolidated revision round and store feedback atomically |
| `POST /projects/:id/deliverables/:id/approve` | Designated approver; exact version/content hash | Immutable approval of this version only; new version never inherits approval |
| `POST /webhooks/stripe` | Official provider signature over raw request bytes; no browser identity | Cap at 256 KiB; verify before parsing business fields; durable inbox insert then `2xx`; failed durable insert returns `503` |

Do not expose refunds or freelancer payouts in the first API release. Brandon reviews them in the provider dashboard against signed project terms; reconciliation imports the resulting provider facts. A later staff-only refund command needs amount bounds, reason, approval history, idempotency, and credit-note linkage. A billing status alone never grants approval of a creative deliverable or releases a disputed project.

## State and retry contracts

`quoteId` is the stable lineage identifier within an organization/project. Each immutable revision has a positive integer `version`; the database primary key is `(organization_id, project_id, id, version)`. The exact version flows into invoice-stage keys, invoice-mirror foreign keys and the unique invoicing obligation. Staff creates v2 as a new row; v1 keeps its original scope, acceptance and invoice links. A controlled supersession action prevents future unissued v1 stages where agreed, without moving an already-issued invoice onto v2. Supersession and credits require explicit approval; a new version never automatically rebills already-paid work. The reference `createQuote` accepts a server-assigned `quoteVersion`, binds it into the snapshot fingerprint, and does not implement this persistence transaction.

Provider idempotency is `invoice/` plus a SHA-256 digest of the canonical `{ organizationId, projectId, quoteId, quoteVersion, stageKey }` tuple. The full tuple is retained on the command and enforced by SQL uniqueness. Hashing keeps the provider key fixed-length and avoids delimiter collisions; identical quote names in different tenants or projects do not collide. A changed payload for the same local obligation is a conflict, never a second charge.

An offered quote becomes accepted only through explicit approver action; a changed scope creates a new immutable version. The reference defaults to a 14-day offer window, permits at most 30 days, and rejects acceptance at or beyond expiry using the server clock. Once accepted, an offer's expiry does not invalidate its already-agreed later milestones; cancellation/supersession is a separate controlled state. Accepted terms precede the opening invoice. Remaining stages require documented milestone approval. Technical discovery and an approved backlog are checked for development sprint quotes and invoice plans.

The supplied stage planner explicitly rejects monthly products with `MONTHLY_EXECUTOR_NOT_IMPLEMENTED`. A future recurring planner must use an immutable authorized service-period ID and start/end dates in the scope, provider command, and unique invoice key. Do not reuse a first-period idempotency key for another month. A proposal quote for a monthly offer is not a subscription implementation.

A provider timeout leaves the command uncertain. Retry the exact same stored command and idempotency key; do not create a second invoice. Before retrying beyond a provider's idempotency-retention window, retrieve/reconcile the stored provider object or put the command in manual review. The local unique stage constraint remains the durable duplicate guard.

Feedback submission, round increment, version compare, and notice creation form one transaction. The pure `submitFeedback` module only plans that write. Two concurrent requests must not both consume the last permitted round. Payment event journal write, processed-event mark, and notification-outbox insertion likewise commit or roll back together.
