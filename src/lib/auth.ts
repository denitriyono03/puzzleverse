// LOCAL-ONLY demo auth. Accounts live in localStorage, passwords are
// SHA-256 hashed with a random salt via WebCrypto (or a deterministic
// fallback hash when SubtleCrypto is unavailable, e.g. in tests).
// This is NOT server authentication and must never be presented as such.
// Server auth is documented as NOT CONFIGURED in docs/INCOMPLETE.md.
export interface LocalAccount { id: string; name: string; email: string; salt: string; hash: string }
export const ACCOUNTS_KEY = 'puzzleverse-accounts-v1';
async function sha256Hex(text: string): Promise<string> {
  try {
    const subtle = (globalThis as unknown as { crypto?: { subtle?: SubtleCrypto } }).crypto?.subtle;
    if (subtle) {
      const buf = await subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch { /* fall through to fallback */ }
  let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `fallback-${(h >>> 0).toString(16)}`;
}
export function loadAccounts(get: (k: string) => string | null): LocalAccount[] {
  try { return JSON.parse(get(ACCOUNTS_KEY) || '[]'); } catch { return []; }
}
export async function registerAccount(
  get: (k: string) => string | null, set: (k: string, v: string) => void,
  name: string, email: string, password: string,
): Promise<LocalAccount> {
  if (!name.trim() || !email.includes('@') || password.length < 6) throw new Error('Name, a valid email, and a password of at least 6 characters are required.');
  const accounts = loadAccounts(get);
  if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) throw new Error('An account with that email already exists locally.');
  const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const hash = await sha256Hex(salt + password);
  const acc: LocalAccount = { id: `acc-${Date.now()}`, name: name.trim(), email: email.trim(), salt, hash };
  set(ACCOUNTS_KEY, JSON.stringify([...accounts, acc])); return acc;
}
export async function loginAccount(get: (k: string) => string | null, email: string, password: string): Promise<LocalAccount> {
  const acc = loadAccounts(get).find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (!acc) throw new Error('No local account with that email.');
  if ((await sha256Hex(acc.salt + password)) !== acc.hash) throw new Error('Incorrect password.');
  return acc;
}
