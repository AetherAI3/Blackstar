import { createHash } from 'node:crypto';
import { assertProjectAccess, assertResourceProject } from './access.mjs';
import { exactKeys, requireThat } from './errors.mjs';
import { cents, sumCents } from './money.mjs';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const scopePattern = /^[a-f0-9]{64}$/;

// Server-generated identifiers and immutable scope version are separate trusted arguments.
export function createQuote({ context, project, catalog, input, quoteId, quoteVersion = 1, scopeDigest, now = Date.now(), expiresAt = now + 14 * 86400000 }) {
  assertProjectAccess(context, project, ['staff_admin']);
  exactKeys(input, ['productId']);
  requireThat(typeof quoteId === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(quoteId), 'INVALID_QUOTE_ID');
  requireThat(Number.isSafeInteger(quoteVersion) && quoteVersion > 0 && quoteVersion <= 2147483647, 'INVALID_QUOTE_VERSION');
  requireThat(scopePattern.test(scopeDigest), 'INVALID_SCOPE');
  requireThat(Number.isSafeInteger(now) && Number.isSafeInteger(expiresAt) && expiresAt > now && expiresAt - now <= 30 * 86400000, 'INVALID_QUOTE_EXPIRY');
  requireThat(catalog?.schema_version === 1 && catalog.currency === 'usd' && typeof catalog.catalog_version === 'string', 'INVALID_CATALOG');
  const product = catalog.products?.find(p => p.id === input.productId);
  requireThat(product && ['proposed', 'approved'].includes(product.status) && product.requires_approved_scope === true, 'UNKNOWN_PRODUCT');
  requireThat(['one_time', 'monthly'].includes(product.billing_mode), 'INVALID_CATALOG');
  const prerequisites = product.prerequisites ?? [];
  requireThat(Array.isArray(prerequisites) && prerequisites.every(key => typeof key === 'string'), 'INVALID_CATALOG');
  requireThat(prerequisites.every(key => project.completedPrerequisites?.includes(key)), 'PREREQUISITES_NOT_MET');
  const stages = product.payment_schedule?.map(s => ({ key: s.key, label: s.label, amountCents: cents(s.amount_cents), due: s.due }));
  requireThat(stages?.length > 0 && stages.length <= 6 && new Set(stages.map(s => s.key)).size === stages.length, 'INVALID_SCHEDULE');
  requireThat(stages.every(s => typeof s.key === 'string' && /^[a-z_]{1,30}$/.test(s.key) && s.amountCents > 0), 'INVALID_SCHEDULE');
  requireThat(sumCents(stages.map(s => s.amountCents)) === cents(product.amount_cents), 'SCHEDULE_TOTAL_MISMATCH');
  const snapshot = { productId: product.id, catalogVersion: catalog.catalog_version, currency: catalog.currency,
    totalCents: product.amount_cents, billingMode: product.billing_mode, stages, prerequisites: [...prerequisites], scopeDigest, expiresAt, quoteVersion };
  return { id: quoteId, organizationId: project.organizationId, projectId: project.id, version: quoteVersion,
    status: 'offered', mode: 'proposal', snapshot, fingerprint: digest(snapshot), acceptedBy: null };
}

export function acceptQuote({ context, project, quote, input, now = Date.now() }) {
  assertProjectAccess(context, project, ['client_approver']);
  assertResourceProject(quote, project);
  exactKeys(input, ['fingerprint', 'scopeDigest']);
  requireThat(project.approverUserId === context.userId, 'NOT_FOUND');
  requireThat(quote.status === 'offered' && input.fingerprint === quote.fingerprint && input.scopeDigest === quote.snapshot.scopeDigest, 'STALE_QUOTE');
  requireThat(digest(quote.snapshot) === quote.fingerprint, 'QUOTE_TAMPERED');
  requireThat(quote.snapshot.quoteVersion === quote.version, 'QUOTE_TAMPERED');
  requireThat(Number.isSafeInteger(now) && quote.snapshot.expiresAt > now, 'QUOTE_EXPIRED');
  return { ...structuredClone(quote), status: 'accepted', acceptedBy: context.userId };
}

// This produces a reviewable command. It never calls Stripe or charges a client.
export function planStageInvoice({ context, project, quote, input }) {
  assertProjectAccess(context, project, ['staff_admin']);
  assertResourceProject(quote, project);
  exactKeys(input, ['stageKey']);
  requireThat(quote.status === 'accepted' && quote.acceptedBy === project.approverUserId, 'SCOPE_NOT_ACCEPTED');
  requireThat(digest(quote.snapshot) === quote.fingerprint, 'QUOTE_TAMPERED');
  requireThat(quote.snapshot.quoteVersion === quote.version, 'QUOTE_TAMPERED');
  requireThat(quote.snapshot.billingMode === 'one_time', 'MONTHLY_EXECUTOR_NOT_IMPLEMENTED');
  requireThat(quote.snapshot.prerequisites.every(key => project.completedPrerequisites?.includes(key)), 'PREREQUISITES_NOT_MET');
  const stage = quote.snapshot.stages.find(s => s.key === input.stageKey);
  requireThat(stage && project.approvedBillingStages?.some(approved => approved.quoteId === quote.id &&
    approved.quoteVersion === quote.version && approved.stageKey === stage.key), 'STAGE_NOT_APPROVED');
  const obligation = { organizationId: project.organizationId, projectId: project.id, quoteId: quote.id, quoteVersion: quote.version, stageKey: stage.key };
  return { mode: 'proposal', ...obligation,
    stageKey: stage.key, currency: quote.snapshot.currency, amountCents: stage.amountCents,
    scopeDigest: quote.snapshot.scopeDigest, catalogVersion: quote.snapshot.catalogVersion,
    // Hash the complete canonical tuple for fixed length and delimiter-safe namespacing.
    idempotencyKey: `invoice/${digest(obligation)}` };
}
