import { requireThat } from './errors.mjs';

export function cents(value) {
  requireThat(Number.isSafeInteger(value) && value >= 0, 'INVALID_MONEY');
  return value;
}
export function sumCents(values) {
  return values.reduce((sum, value) => cents(sum + cents(value)), 0);
}
// Integer basis points, rounded half up. BigInt avoids multiplication overflow.
export function shareCents(amount, basisPoints) {
  cents(amount);
  requireThat(Number.isInteger(basisPoints) && basisPoints >= 0 && basisPoints <= 10000, 'INVALID_SHARE');
  return Number((BigInt(amount) * BigInt(basisPoints) + 5000n) / 10000n);
}
export function splitCents(amount, basisPoints) {
  const share = shareCents(amount, basisPoints);
  return { shareCents: share, remainderCents: amount - share };
}
