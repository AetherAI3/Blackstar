import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileInvoice } from '../src/ledger.mjs';
import { receiveStripeWebhook, processStripeEvent } from '../src/webhooks.mjs';

const invoice = () => ({ id: 'invoice_a', providerInvoiceId: 'in_a', providerCustomerId: 'cus_a', providerAccountId: 'acct_test', livemode: false,
  organizationId: 'org_a', projectId: 'project_a', currency: 'usd', totalCents: 10000, version: 0, journal: [] });
const snapshot = () => ({ complete: true, invoiceId: 'in_a', customerId: 'cus_a', accountId: 'acct_test', livemode: false, currency: 'usd',
  totalCents: 10000, amountRemainingCents: 0, status: 'paid', disputed: false,
  payments: [{ id: 'pay_a', amountCents: 10000 }], refunds: [], credits: [], fees: [{ id: 'txn_fee_a', amountCents: 320 }] });
const event = (id = 'evt_a', type = 'invoice.paid') => ({ id, type, livemode: false, created: 1 });

// Explicit in-memory TRANSACTION TEST DOUBLE, deliberately not exported as production code.
function harness() {
  let stored = invoice(); let processed = new Set(); let outbox = new Set(); let current = snapshot(); let chain = Promise.resolve();
  const ports = {
    resolveInvoiceBinding: async () => ({ invoiceId: 'invoice_a' }),
    fetchInvoiceSnapshot: async () => structuredClone(current),
    withInvoiceTransaction: async (_, body) => {
      const work = chain.then(async () => {
        let draft = structuredClone(stored); const done = new Set(processed); const notices = new Set(outbox);
        const result = await body({ hasProcessed: async id => done.has(id), readInvoice: async () => draft,
          saveInvoice: async next => { draft = next; }, markProcessed: async id => done.add(id), enqueueNoticeOnce: async key => notices.add(key) });
        stored = draft; processed = done; outbox = notices; return result;
      });
      chain = work.catch(() => {}); return work;
    }
  };
  return { ports, invoice: () => stored, processed: () => processed, outbox: () => outbox, setSnapshot: value => { current = value; } };
}

test('raw bytes go unchanged to signature adapter before durable storage; missing adapter rejects', async () => {
  const rawBody = Buffer.from('{  "id": "evt_a" }'); let received; let writes = 0;
  const ports = { verifyStripeEvent: async (body, signature) => { received = body; assert.equal(signature, 'fixture'); return event(); }, insertEventOnce: async () => { writes++; return true; } };
  assert.deepEqual(await receiveStripeWebhook({ rawBody, signature: 'fixture', ports }), { accepted: true, duplicate: false });
  assert.equal(received, rawBody); assert.equal(writes, 1);
  await assert.rejects(receiveStripeWebhook({ rawBody, signature: 'fixture' }), /ADAPTER_NOT_CONFIGURED/);
  await assert.rejects(receiveStripeWebhook({ rawBody: { id: 'evt_a' }, signature: 'fixture', ports }), /INVALID_WEBHOOK_BODY/);
  await assert.rejects(receiveStripeWebhook({ rawBody: rawBody.toString(), signature: 'fixture', ports }), /INVALID_WEBHOOK_BODY/);
  assert.equal(writes, 1);
});

test('forged signature, wrong mode, oversize body, or failed durable insert never acknowledges money', async () => {
  const rawBody = Buffer.from('{}'); let writes = 0;
  const insertEventOnce = async () => { writes++; return true; };
  await assert.rejects(receiveStripeWebhook({ rawBody, signature: 'forged', ports: { verifyStripeEvent: async () => { throw new Error('invalid signature'); }, insertEventOnce } }), /invalid signature/);
  await assert.rejects(receiveStripeWebhook({ rawBody, signature: 's', ports: { verifyStripeEvent: async () => ({ ...event(), livemode: true }), insertEventOnce } }), /INVALID_PROVIDER_EVENT/);
  await assert.rejects(receiveStripeWebhook({ rawBody: Buffer.alloc(262145), signature: 's', ports: { verifyStripeEvent: async () => event(), insertEventOnce } }), /INVALID_WEBHOOK_BODY/);
  assert.equal(writes, 0);
  await assert.rejects(receiveStripeWebhook({ rawBody, signature: 's', ports: { verifyStripeEvent: async () => event(), insertEventOnce: async () => { throw new Error('database unavailable'); } } }), /database unavailable/);
});

test('duplicate event retries are acknowledged once and unsupported events do no work', async () => {
  const seen = new Set(); let stored = 0;
  const ports = { verifyStripeEvent: async () => event(), insertEventOnce: async e => { if (seen.has(e.id)) return false; seen.add(e.id); stored++; return true; } };
  const args = { rawBody: Buffer.from('{}'), signature: 's', ports };
  assert.equal((await receiveStripeWebhook(args)).duplicate, false);
  assert.equal((await receiveStripeWebhook(args)).duplicate, true);
  ports.verifyStripeEvent = async () => event('evt_other', 'customer.updated');
  assert.equal((await receiveStripeWebhook(args)).ignored, true); assert.equal(stored, 1);
});

test('duplicate, concurrent, and old events cannot double-book payment or regress provider status', async () => {
  const h = harness();
  await Promise.all([processStripeEvent(event(), h.ports), processStripeEvent(event(), h.ports)]);
  assert.equal(h.invoice().journal.filter(x => x.kind === 'payment').length, 1);
  assert.equal(h.invoice().version, 1); assert.equal(h.outbox().size, 1);
  await processStripeEvent({ ...event('evt_older', 'invoice.finalized'), created: 0, status: 'open' }, h.ports);
  assert.equal(h.invoice().providerStatus, 'paid');
  assert.equal(h.invoice().journal.filter(x => x.kind === 'payment').length, 1);
  assert.equal(h.invoice().summary.netCashCents, 9680);
});

test('retry after provider timeout preserves invoice, inbox and outbox state', async () => {
  const h = harness(); const fetch = h.ports.fetchInvoiceSnapshot;
  h.ports.fetchInvoiceSnapshot = async () => { throw new Error('provider timeout'); };
  await assert.rejects(processStripeEvent(event(), h.ports), /provider timeout/);
  assert.equal(h.invoice().version, 0); assert.equal(h.processed().size, 0); assert.equal(h.outbox().size, 0);
  h.ports.fetchInvoiceSnapshot = fetch; await processStripeEvent(event(), h.ports);
  assert.equal(h.invoice().summary.collectedCents, 10000);
});

test('failed outbox commit rolls back payment state and leaves replay possible', async () => {
  const h = harness(); const tx = h.ports.withInvoiceTransaction;
  h.ports.withInvoiceTransaction = (id, body) => tx(id, inner => body({ ...inner, enqueueNoticeOnce: async () => { throw new Error('outbox unavailable'); } }));
  await assert.rejects(processStripeEvent(event(), h.ports), /outbox unavailable/);
  assert.equal(h.invoice().version, 0); assert.equal(h.processed().size, 0);
});

test('partial refund keeps original invoice and credits distinct; refund cannot become extra revenue', () => {
  const current = snapshot(); current.refunds = [{ id: 're_a', paymentId: 'pay_a', amountCents: 2000, status: 'succeeded' }];
  current.credits = [{ id: 'cn_a', amountCents: 2000 }];
  const next = reconcileInvoice(invoice(), current);
  assert.equal(next.totalCents, 10000); assert.equal(next.providerStatus, 'paid');
  assert.equal(next.summary.refundedCents, 2000); assert.equal(next.summary.creditedCents, 2000);
  assert.equal(next.summary.netCashCents, 7680); assert.equal(next.summary.cashCovered, false);
  assert.deepEqual(reconcileInvoice(next, current).journal, next.journal);
});

test('paid status caused by credit, or an active dispute, cannot claim full cash coverage', () => {
  const credit = snapshot(); credit.payments = []; credit.fees = []; credit.credits = [{ id: 'cn_a', amountCents: 10000 }];
  assert.equal(reconcileInvoice(invoice(), credit).summary.cashCovered, false);
  assert.equal(reconcileInvoice(invoice(), { ...snapshot(), disputed: true }).summary.cashCovered, false);
});

test('cross-customer, cross-account, wrong currency, missing pages, and invalid refund totals reject', () => {
  for (const changed of [{ customerId: 'cus_b' }, { accountId: 'acct_b' }, { currency: 'eur' }, { livemode: true }, { totalCents: 1 }]) {
    assert.throws(() => reconcileInvoice(invoice(), { ...snapshot(), ...changed }), /PROVIDER_BINDING_MISMATCH/);
  }
  assert.throws(() => reconcileInvoice(invoice(), { ...snapshot(), complete: false }), /INCOMPLETE_PROVIDER_SNAPSHOT/);
  assert.throws(() => reconcileInvoice(invoice(), { ...snapshot(), refunds: [{ id: 're_a', paymentId: 'pay_a', amountCents: 10001, status: 'succeeded' }] }), /REFUND_EXCEEDS_PAYMENT/);
  assert.throws(() => reconcileInvoice(invoice(), { ...snapshot(), refunds: [{ id: 're_a', paymentId: 'missing', amountCents: 1, status: 'succeeded' }] }), /REFUND_WITHOUT_PAYMENT/);
  assert.throws(() => reconcileInvoice(invoice(), { ...snapshot(), credits: [{ id: 'cn_a', amountCents: 10001 }] }), /CREDITS_EXCEED_INVOICE/);
});

test('existing journal facts cannot vanish or change amount during reconciliation', () => {
  const posted = reconcileInvoice(invoice(), snapshot());
  assert.throws(() => reconcileInvoice(posted, { ...snapshot(), payments: [] }), /JOURNAL_CONFLICT/);
  assert.throws(() => reconcileInvoice(posted, { ...snapshot(), payments: [{ id: 'pay_a', amountCents: 9999 }] }), /JOURNAL_CONFLICT/);
  assert.throws(() => reconcileInvoice(invoice(), { ...snapshot(), payments: [...snapshot().payments, ...snapshot().payments] }), /DUPLICATE_PROVIDER_FACT/);
});
