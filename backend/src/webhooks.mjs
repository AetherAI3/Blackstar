import { requireThat } from './errors.mjs';
import { reconcileInvoice } from './ledger.mjs';
import { unconfiguredPorts } from './ports.mjs';

const supportedTypes = new Set(['invoice.finalized', 'invoice.paid', 'invoice.payment_failed', 'invoice.voided',
  'invoice.marked_uncollectible', 'refund.created', 'refund.updated', 'charge.refunded',
  'credit_note.created', 'credit_note.updated', 'credit_note.voided', 'charge.dispute.created', 'charge.dispute.closed']);

// Signature implementation belongs to the official Stripe SDK adapter, not homemade crypto.
export async function receiveStripeWebhook({ rawBody, signature, expectedLivemode = false, ports = unconfiguredPorts }) {
  requireThat(Buffer.isBuffer(rawBody) && rawBody.length > 0 && rawBody.length <= 262144, 'INVALID_WEBHOOK_BODY');
  requireThat(typeof signature === 'string' && signature.length > 0 && signature.length <= 4096, 'INVALID_SIGNATURE');
  const event = await ports.verifyStripeEvent(rawBody, signature);
  requireThat(event && typeof event.id === 'string' && event.id.length <= 200 && event.id.startsWith('evt_') &&
    typeof event.type === 'string' && event.livemode === expectedLivemode, 'INVALID_PROVIDER_EVENT');
  if (!supportedTypes.has(event.type)) return { accepted: true, ignored: true };
  // Adapter must perform durable INSERT with UNIQUE(provider, account, mode, event_id).
  // If insertion fails, this rejects: ingress must return 503, never acknowledge lost work.
  const inserted = await ports.insertEventOnce(event);
  return { accepted: true, duplicate: !inserted };
}

// Called only by a trusted durable-inbox worker. No browser route accepts `event` directly.
export async function processStripeEvent(event, ports = unconfiguredPorts) {
  const binding = await ports.resolveInvoiceBinding(event);
  requireThat(binding?.invoiceId, 'UNMAPPED_PROVIDER_OBJECT');
  return ports.withInvoiceTransaction(binding.invoiceId, async transaction => {
    if (await transaction.hasProcessed(event.id)) return { duplicate: true };
    const invoice = await transaction.readInvoice();
    // Ignore event.created and payload status; delivery ordering is not a version number.
    const snapshot = await ports.fetchInvoiceSnapshot(invoice);
    const reconciled = reconcileInvoice(invoice, snapshot);
    await transaction.saveInvoice(reconciled);
    await transaction.markProcessed(event.id);
    await transaction.enqueueNoticeOnce(`invoice/${invoice.id}/event/${event.id}`, { invoiceId: invoice.id });
    // Store, event acknowledgement and notice outbox commit/rollback together in the adapter.
    return { duplicate: false, invoiceId: invoice.id };
  });
}
