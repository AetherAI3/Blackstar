export class DomainError extends Error {
  constructor(code) { super(code); this.name = 'DomainError'; this.code = code; }
}
export function requireThat(condition, code) {
  if (!condition) throw new DomainError(code);
}
export function exactKeys(value, allowed) {
  requireThat(value && typeof value === 'object' && !Array.isArray(value), 'INVALID_INPUT');
  requireThat(Object.keys(value).every(key => allowed.includes(key)), 'UNKNOWN_FIELD');
}
export function safeError(error, requestId) {
  return { code: error instanceof DomainError ? error.code : 'INTERNAL_ERROR', requestId };
}
