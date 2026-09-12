import { DomainError } from './errors.mjs';
const unavailable = async () => { throw new DomainError('ADAPTER_NOT_CONFIGURED'); };

// Production must replace each explicit port and pass the acceptance gates in README.
// Passing production secrets to this module has no effect; it has no network implementation.
export const unconfiguredPorts = Object.freeze({
  verifyStripeEvent: unavailable,
  insertEventOnce: unavailable,
  resolveInvoiceBinding: unavailable,
  withInvoiceTransaction: unavailable,
  fetchInvoiceSnapshot: unavailable,
  issueInvoice: unavailable,
  issueRefund: unavailable,
  sendNotice: unavailable,
  signUpload: unavailable,
  signDownload: unavailable,
  verifyIdentity: unavailable
});
