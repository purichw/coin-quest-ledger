import { normalizeUsername, problem, recoveryHashInput } from './contracts.ts';

// A hash is only a verifier. Reveal an existing owner-held candidate only when
// it matches the current server hash; old codes and other accounts stay hidden.
export async function verifiedRecoveryCandidate(username: string, currentHash: string | undefined, candidate: unknown, digest: (input: string) => Promise<string>) {
  if (!currentHash || !candidate || typeof candidate !== 'object') return null;
  const value = candidate as { username?: unknown; code?: unknown };
  if (typeof value.username !== 'string' || normalizeUsername(value.username) !== normalizeUsername(username) || typeof value.code !== 'string') return null;
  const code = value.code.trim().toUpperCase().replace(/[\s-]/g, '');
  if (!/^[A-Z0-9]{12}$/.test(code)) return null;
  if (await digest(recoveryHashInput(username, code)) !== currentHash) return null;
  return code.match(/.{4}/g)!.join('-');
}

export async function acknowledgeDisplayedRecovery(username: string, currentHash: string | undefined, displayedCode: string, digest: (input: string) => Promise<string>, persist: (code: string) => Promise<void>) {
  const code = await verifiedRecoveryCandidate(username, currentHash, { username, code: displayedCode }, digest);
  if (!code) throw problem('account/profile-invalid');
  // The user has already confirmed an external copy. A device storage failure
  // must not turn a successful password reset into an impossible onboarding gate.
  try { await persist(code); return { stored: true }; }
  catch { return { stored: false }; }
}
