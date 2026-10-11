import { createHash } from 'node:crypto';

// Shared by all serverless instances. Only a digest is retained, not the IP.
export async function takeRecoveryAttempt(db, ip, username, now = Date.now()) {
  const key = createHash('sha256').update(`${ip}:${username}`).digest('hex');
  const ref = db.collection('accountRecoveryLimits').doc(key);
  return db.runTransaction(async tx => {
    const data = (await tx.get(ref)).data();
    const current = data && data.firstAt + 900_000 > now ? data : { count: 0, firstAt: now };
    if (current.count >= 8) return false;
    tx.set(ref, { count: current.count + 1, firstAt: current.firstAt, expiresAt: new Date(current.firstAt + 900_000) });
    return true;
  });
}
