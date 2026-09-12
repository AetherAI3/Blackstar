import { requireThat } from './errors.mjs';
import { cents, sumCents } from './money.mjs';

const states = ['draft', 'open', 'paid', 'void', 'uncollectible'];
const identifier = value => typeof value === 'string' && value.length > 0 && value.length <= 200;

// Normalize a freshly fetched, fully paginated provider snapshot under an invoice lock.
// This is an operational subledger, not tax accounting or revenue recognition.
export function reconcileInvoice(invoice, snapshot) {
  requireThat(snapshot?.complete === true, 'INCOMPLETE_PROVIDER_SNAPSHOT');
  requireThat(snapshot.invoiceId === invoice.providerInvoiceId && snapshot.customerId === invoice.providerCustomerId &&
    snapshot.accountId === invoice.providerAccountId && snapshot.livemode === invoice.livemode &&
    snapshot.currency === invoice.currency && snapshot.totalCents === invoice.totalCents, 'PROVIDER_BINDING_MISMATCH');
  requireThat(states.includes(snapshot.status) && typeof snapshot.disputed === 'boolean', 'INVALID_PROVIDER_STATE');
  cents(snapshot.totalCents); cents(snapshot.amountRemainingCents);
  const candidates = [];
  for (const [kind, items] of [['payment', snapshot.payments], ['refund', snapshot.refunds], ['credit_note', snapshot.credits], ['processor_fee', snapshot.fees]]) {
    requireThat(Array.isArray(items) && items.length <= 1000, 'INVALID_PROVIDER_STATE');
    for (const item of items) {
      requireThat(identifier(item.id) && cents(item.amountCents) > 0, 'INVALID_PROVIDER_STATE');
      if (kind === 'refund') requireThat(identifier(item.paymentId) && item.status === 'succeeded', 'UNSETTLED_REFUND');
      candidates.push({ key: `${kind}/${item.id}`, kind, providerId: item.id, amountCents: item.amountCents,
        ...(kind === 'refund' ? { paymentId: item.paymentId } : {}) });
    }
  }
  requireThat(new Set(candidates.map(x => x.key)).size === candidates.length, 'DUPLICATE_PROVIDER_FACT');
  const byKey = new Map(candidates.map(x => [x.key, x]));
  // A complete snapshot must preserve facts already committed. Never silently erase money.
  for (const old of invoice.journal ?? []) {
    requireThat(JSON.stringify(byKey.get(old.key)) === JSON.stringify(old), 'JOURNAL_CONFLICT');
  }
  const payments = candidates.filter(x => x.kind === 'payment');
  const refunds = candidates.filter(x => x.kind === 'refund');
  for (const refund of refunds) requireThat(payments.some(p => p.providerId === refund.paymentId), 'REFUND_WITHOUT_PAYMENT');
  for (const payment of payments) {
    requireThat(sumCents(refunds.filter(r => r.paymentId === payment.providerId).map(r => r.amountCents)) <= payment.amountCents, 'REFUND_EXCEEDS_PAYMENT');
  }
  const creditedCents = sumCents(candidates.filter(x => x.kind === 'credit_note').map(x => x.amountCents));
  requireThat(creditedCents <= invoice.totalCents, 'CREDITS_EXCEED_INVOICE');
  const collectedCents = sumCents(payments.map(x => x.amountCents));
  const refundedCents = sumCents(refunds.map(x => x.amountCents));
  const feeCents = sumCents(candidates.filter(x => x.kind === 'processor_fee').map(x => x.amountCents));
  return { ...structuredClone(invoice), version: (invoice.version ?? 0) + 1, providerStatus: snapshot.status,
    journal: candidates, summary: { collectedCents, refundedCents, creditedCents, feeCents,
      netCashCents: collectedCents - refundedCents - feeCents, amountRemainingCents: snapshot.amountRemainingCents,
      disputed: snapshot.disputed,
      cashCovered: snapshot.status === 'paid' && snapshot.amountRemainingCents === 0 &&
        collectedCents - refundedCents >= invoice.totalCents && !snapshot.disputed } };
}
