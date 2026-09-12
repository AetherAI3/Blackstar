import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createQuote, acceptQuote, planStageInvoice } from '../src/billing.mjs';
import { assertProjectAccess } from '../src/access.mjs';
import { cents, shareCents, splitCents, sumCents } from '../src/money.mjs';
import { planAssetUpload, planAssetDownload, submitFeedback } from '../src/portal.mjs';
import { unconfiguredPorts } from '../src/ports.mjs';
import { safeError, DomainError } from '../src/errors.mjs';

const catalog = JSON.parse(await readFile(new URL('../../billing/catalog.json', import.meta.url), 'utf8'));
const project = { id: 'project_a', organizationId: 'org_a', approverUserId: 'client_a', approvedBillingStages: ['deposit', 'balance', 'monthly', 'prepayment'].map(stageKey => ({ quoteId: 'quote_a', quoteVersion: 1, stageKey })), completedPrerequisites: ['accepted_technical_discovery', 'approved_bounded_backlog'] };
const staff = { userId: 'brandon', memberships: [{ organizationId: 'org_a', role: 'staff_admin', status: 'active' }], projectIds: ['project_a'] };
const client = { userId: 'client_a', memberships: [{ organizationId: 'org_a', role: 'client_approver', status: 'active' }], projectIds: ['project_a'] };
const scopeDigest = 'a'.repeat(64);
const clock = Date.now();
const quoteFor = (product = catalog.products[0]) => createQuote({ context: staff, project, catalog, input: { productId: product.id }, quoteId: 'quote_a', scopeDigest, now: clock });
const accepted = () => { const quote = quoteFor(); return acceptQuote({ context: client, project, quote, input: { fingerprint: quote.fingerprint, scopeDigest } }); };

test('BOLA: another tenant, removed membership, and missing project assignment all deny access', () => {
  for (const context of [null, { ...client, memberships: [{ ...client.memberships[0], organizationId: 'org_b' }] },
    { ...client, memberships: [{ ...client.memberships[0], status: 'revoked' }] }, { ...client, projectIds: [] }]) {
    assert.throws(() => assertProjectAccess(context, project), /NOT_FOUND/);
  }
  assert.equal(assertProjectAccess(client, project).role, 'client_approver');
});

test('all proposed catalog schedules preserve the exact agreed total', () => {
  for (const product of catalog.products) {
    const quote = quoteFor(product);
    assert.equal(quote.mode, 'proposal');
    assert.equal(quote.snapshot.totalCents, product.amount_cents);
    assert.equal(sumCents(quote.snapshot.stages.map(x => x.amountCents)), product.amount_cents);
    assert.equal(quote.snapshot.catalogVersion, catalog.catalog_version);
  }
});

test('BOPLA: a browser-supplied amount, paid flag, or organization cannot become a quote', () => {
  for (const added of [{ amountCents: 1 }, { status: 'paid' }, { organizationId: 'org_b' }]) {
    assert.throws(() => createQuote({ context: staff, project, catalog, input: { productId: catalog.products[0].id, ...added }, quoteId: 'quote_a', scopeDigest }), /UNKNOWN_FIELD/);
  }
  assert.throws(() => createQuote({ context: client, project, catalog, input: { productId: catalog.products[0].id }, quoteId: 'quote_a', scopeDigest }), /NOT_FOUND/);
});

test('a missing product or inconsistent catalog schedule fails closed', () => {
  assert.throws(() => quoteFor({ id: 'missing' }), /UNKNOWN_PRODUCT/);
  const corrupt = structuredClone(catalog); corrupt.products[0].payment_schedule[0].amount_cents++;
  assert.throws(() => createQuote({ context: staff, project, catalog: corrupt, input: { productId: corrupt.products[0].id }, quoteId: 'q', scopeDigest }), /SCHEDULE_TOTAL_MISMATCH/);
});

test('only the current designated approver can accept an exact scope version', () => {
  const quote = quoteFor();
  assert.throws(() => acceptQuote({ context: staff, project, quote, input: { fingerprint: quote.fingerprint, scopeDigest } }), /NOT_FOUND/);
  assert.throws(() => acceptQuote({ context: { ...client, userId: 'other_client' }, project, quote, input: { fingerprint: quote.fingerprint, scopeDigest } }), /NOT_FOUND/);
  assert.throws(() => acceptQuote({ context: client, project, quote, input: { fingerprint: 'old', scopeDigest } }), /STALE_QUOTE/);
  assert.equal(accepted().status, 'accepted');
  assert.equal(quote.status, 'offered');
});

test('invoice plan cannot bypass acceptance, approved stage, or immutable quote fingerprint', () => {
  assert.throws(() => planStageInvoice({ context: staff, project, quote: quoteFor(), input: { stageKey: 'deposit' } }), /SCOPE_NOT_ACCEPTED/);
  assert.throws(() => planStageInvoice({ context: staff, project: { ...project, approvedBillingStages: [] }, quote: accepted(), input: { stageKey: 'deposit' } }), /STAGE_NOT_APPROVED/);
  const tampered = accepted(); tampered.snapshot.stages[0].amountCents = 1;
  assert.throws(() => planStageInvoice({ context: staff, project, quote: tampered, input: { stageKey: 'deposit' } }), /QUOTE_TAMPERED/);
  const first = planStageInvoice({ context: staff, project, quote: accepted(), input: { stageKey: 'deposit' } });
  const retry = planStageInvoice({ context: staff, project, quote: accepted(), input: { stageKey: 'deposit' } });
  assert.deepEqual(first, retry);
  assert.equal(first.amountCents, catalog.products[0].payment_schedule[0].amount_cents);
  assert.equal(first.mode, 'proposal');
});

test('monthly billing cannot reuse the one-time invoice planner', () => {
  const monthly = quoteFor(catalog.products.find(p => p.billing_mode === 'monthly'));
  const quote = acceptQuote({ context: client, project, quote: monthly, input: { fingerprint: monthly.fingerprint, scopeDigest } });
  assert.throws(() => planStageInvoice({ context: staff, project, quote, input: { stageKey: quote.snapshot.stages[0].key } }), /MONTHLY_EXECUTOR_NOT_IMPLEMENTED/);
});

test('R1: quote versions retain distinct immutable snapshots and version-bound invoice obligations', () => {
  const v1 = quoteFor();
  const v2 = createQuote({ context: staff, project, catalog, input: { productId: catalog.products[0].id }, quoteId: v1.id, quoteVersion: 2, scopeDigest, now: clock });
  assert.equal(v1.version, 1); assert.equal(v2.version, 2);
  assert.equal(v1.id, v2.id); assert.notEqual(v1.fingerprint, v2.fingerprint);
  const acceptedV2 = acceptQuote({ context: client, project, quote: v2, input: { fingerprint: v2.fingerprint, scopeDigest } });
  const first = planStageInvoice({ context: staff, project, quote: accepted(), input: { stageKey: 'deposit' } });
  assert.throws(() => planStageInvoice({ context: staff, project, quote: acceptedV2, input: { stageKey: 'deposit' } }), /STAGE_NOT_APPROVED/);
  const approvedV2Project = { ...project, approvedBillingStages: [{ quoteId: v2.id, quoteVersion: 2, stageKey: 'deposit' }] };
  const second = planStageInvoice({ context: staff, project: approvedV2Project, quote: acceptedV2, input: { stageKey: 'deposit' } });
  assert.equal(second.quoteVersion, 2); assert.notEqual(first.idempotencyKey, second.idempotencyKey);
  assert.throws(() => acceptQuote({ context: client, project, quote: v2, input: { fingerprint: v1.fingerprint, scopeDigest } }), /STALE_QUOTE/);
  assert.throws(() => planStageInvoice({ context: staff, project, quote: { ...acceptedV2, version: 1 }, input: { stageKey: 'deposit' } }), /QUOTE_TAMPERED/);
});

test('R2: same quote/version/stage across tenants or projects gets a different provider key', () => {
  function keyFor(organizationId, projectId) {
    const scopedProject = { ...project, organizationId, id: projectId, approvedBillingStages: [{ quoteId: 'same_id', quoteVersion: 1, stageKey: 'deposit' }] };
    const scopedStaff = { ...staff, memberships: [{ ...staff.memberships[0], organizationId }], projectIds: [projectId] };
    const scopedClient = { ...client, memberships: [{ ...client.memberships[0], organizationId }], projectIds: [projectId] };
    const quote = createQuote({ context: scopedStaff, project: scopedProject, catalog, input: { productId: catalog.products[0].id }, quoteId: 'same_id', quoteVersion: 1, scopeDigest, now: clock });
    const ready = acceptQuote({ context: scopedClient, project: scopedProject, quote, input: { fingerprint: quote.fingerprint, scopeDigest } });
    return planStageInvoice({ context: scopedStaff, project: scopedProject, quote: ready, input: { stageKey: 'deposit' } }).idempotencyKey;
  }
  const first = keyFor('org_a', 'project_a');
  assert.equal(first, keyFor('org_a', 'project_a'));
  assert.notEqual(first, keyFor('org_b', 'project_a'));
  assert.notEqual(first, keyFor('org_a', 'project_b'));
  assert.ok(first.length < 255);
});

test('expired quote cannot be accepted and discovery prerequisites cannot be bypassed', () => {
  const quote = quoteFor();
  assert.throws(() => acceptQuote({ context: client, project, quote, input: { fingerprint: quote.fingerprint, scopeDigest }, now: quote.snapshot.expiresAt }), /QUOTE_EXPIRED/);
  const product = catalog.products.find(p => p.id === 'development_sprint');
  assert.throws(() => createQuote({ context: staff, project: { ...project, completedPrerequisites: [] }, catalog, input: { productId: product.id }, quoteId: 'q', scopeDigest }), /PREREQUISITES_NOT_MET/);
});

test('property sweep: splits conserve every cent, including large safe integers and half cents', () => {
  for (const amount of [0, 1, 3, 101, 999, 175000, Number.MAX_SAFE_INTEGER]) {
    for (let bps = 0; bps <= 10000; bps += 25) {
      const result = splitCents(amount, bps);
      assert.equal(result.shareCents + result.remainderCents, amount);
      assert.ok(result.shareCents >= 0 && result.shareCents <= amount);
    }
  }
  assert.equal(shareCents(1, 5000), 1);
  assert.equal(shareCents(175000, 6500), 113750);
  for (const invalid of [-1, 0.01, NaN, Infinity, '100', Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => cents(invalid), /INVALID_MONEY/);
  assert.throws(() => sumCents([Number.MAX_SAFE_INTEGER, 1]), /INVALID_MONEY/);
});

test('uploads do not turn filenames into paths; quarantined and cross-tenant assets cannot download', () => {
  const asset = planAssetUpload({ context: client, project, input: { filename: '../../invoice.html', contentType: 'application/pdf', sizeBytes: 123 }, assetId: 'asset_a' });
  assert.equal(asset.objectKey, 'org_a/project_a/asset_a');
  assert.equal(asset.status, 'quarantine');
  assert.throws(() => planAssetDownload({ context: client, project, asset }), /ASSET_NOT_READY/);
  assert.throws(() => planAssetDownload({ context: client, project, asset: { ...asset, status: 'clean', organizationId: 'org_b' } }), /NOT_FOUND/);
  assert.equal(planAssetDownload({ context: client, project, asset: { ...asset, status: 'clean' } }).expiresInSeconds, 300);
  assert.throws(() => planAssetUpload({ context: client, project, input: { filename: 'a.svg', contentType: 'image/svg+xml', sizeBytes: 1 }, assetId: 'a' }), /UNSUPPORTED_ASSET/);
  assert.throws(() => planAssetUpload({ context: client, project, input: { filename: 'a.png', contentType: 'image/png', sizeBytes: 104857601 }, assetId: 'a' }), /ASSET_TOO_LARGE/);
});

test('feedback pins a version and converts excess revisions to a change request', () => {
  const deliverable = { id: 'delivery_a', organizationId: 'org_a', projectId: 'project_a', version: 2, status: 'in_review', roundsUsed: 1, revisionLimit: 2 };
  const input = { expectedVersion: 2, comments: ' Consolidated requested change ' };
  const feedback = submitFeedback({ context: client, project, deliverable, input, feedbackId: 'feedback_a' });
  assert.equal(feedback.round, 2); assert.equal(feedback.version, 2);
  assert.throws(() => submitFeedback({ context: client, project, deliverable, input: { ...input, expectedVersion: 1 }, feedbackId: 'f' }), /STALE_VERSION/);
  assert.throws(() => submitFeedback({ context: client, project, deliverable: { ...deliverable, roundsUsed: 2 }, input, feedbackId: 'f' }), /CHANGE_REQUEST_REQUIRED/);
});

test('unconfigured providers never simulate a successful send, payment, or authenticated session', async () => {
  for (const port of Object.values(unconfiguredPorts)) await assert.rejects(port(), /ADAPTER_NOT_CONFIGURED/);
});

test('error envelopes omit stacks, secrets, and provider error contents', () => {
  assert.deepEqual(safeError(new Error('secret provider response'), 'req_test'), { code: 'INTERNAL_ERROR', requestId: 'req_test' });
  assert.deepEqual(safeError(new DomainError('NOT_FOUND'), 'req_test'), { code: 'NOT_FOUND', requestId: 'req_test' });
});
