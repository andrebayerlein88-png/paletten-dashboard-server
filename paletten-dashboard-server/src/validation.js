export function validateSnapshot(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'JSON object required';
  if (!Number.isSafeInteger(input.revision) || input.revision < 0) return 'revision must be a nonnegative integer';
  const state = input.state;
  if (!state || typeof state !== 'object' || Array.isArray(state)) return 'state must be an object';
  const required = ['employees','palettes','loads','errors','audits','closures','exportPlans','kanbanProducts','kanbanMovements','replenishmentRequests','tdsCustomers','tdsPreparations','inboundDeliveries'];
  for (const field of required) if (!Array.isArray(state[field])) return `${field} must be an array`;
  if (state.schemaVersion !== 14) return 'Only V3.9.3 schemaVersion 14 is accepted';
  return null;
}
export function bearerToken(header) {
  return /^Bearer (.+)$/.exec(header || '')?.[1] || '';
}
export function safeEqual(a,b) {
  if (!a || !b) return false;
  const aa = Buffer.from(a), bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  const { timingSafeEqual } = requireCrypto();
  return timingSafeEqual(aa,bb);
}
import { timingSafeEqual } from 'node:crypto';
function requireCrypto(){return {timingSafeEqual};}
