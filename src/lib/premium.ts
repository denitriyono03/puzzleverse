// Entitlement logic. A client-side click is NEVER proof of payment.
// In production, buying shows "store purchase not configured" and grants
// nothing. Only a DEV build may use the clearly-labelled mock toggle, and
// that code path is guarded by import.meta.env.DEV so it cannot run in a
// production build (Vite replaces import.meta.env.DEV with false there).
export type PremiumStatus = 'free' | 'premium';
export function canUseMockPremium(): boolean { return import.meta.env.DEV === true; }
export function buyPremiumProduction(): { ok: false; message: string } {
  return { ok: false, message: 'Store purchase is not configured. Real in-app purchase requires a store account and entitlement verification (see docs/INCOMPLETE.md). No premium entitlement was granted.' };
}
