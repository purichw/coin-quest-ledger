(function () {
  const USERNAME_DOMAIN = 'coinquest.local';
  const BLOCKED_STATUSES = ['archived', 'deactivated', 'delete_requested', 'deleted'];

  function normalizeUsername(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32);
  }

  function usernameEmail(username) {
    const clean = normalizeUsername(username);
    return `${clean || 'user'}@${USERNAME_DOMAIN}`;
  }

  function accountLogin(account) {
    return normalizeUsername(account?.username || String(account?.email || '').split('@')[0] || account?.name || '');
  }

  function authEmailForUsername(username, suffix = '') {
    const clean = normalizeUsername(username);
    return suffix ? `${clean}.${suffix}@${USERNAME_DOMAIN}` : usernameEmail(clean);
  }

  function isBlockedAccountStatus(account) {
    return [account?.status, account?.lifecycleStatus].some(value => BLOCKED_STATUSES.includes(String(value || '').toLowerCase()));
  }

  async function persistAccount({ db, account, extra = {}, timestamp, deleteField }) {
    const problem = code => { throw Object.assign(new Error(code), { code }); };
    const reusable = value => value?.deleteReusable === true && value.lifecycleStatus === 'deleted';
    return db.runTransaction(async tx => {
      const ref = db.collection('users').doc(account.uid);
      const lookup = db.collection('usernames').doc(account.username);
      const idRef = db.collection('userIds').doc(String(account.userId));
      const user = await tx.get(ref), username = await tx.get(lookup), id = await tx.get(idRef);
      const old = user.data(), mapping = username.data(), reserved = id.data();
      if (old && (isBlockedAccountStatus(old) || old.recoveryReset?.expiresAt > Date.now())) problem('account/blocked');
      if (old && (old.userId !== account.userId || old.username !== account.username)) problem('account/identity-conflict');
      if (mapping && mapping.uid !== account.uid && !reusable(mapping)) problem('auth/email-already-in-use');
      if (reserved && reserved.uid !== account.uid && !reusable(reserved)) problem('account/id-unavailable');
      const character = await tx.get(db.collection('characters').doc(String(account.userId)));
      if (!old && character.exists && character.data().ownerUid !== account.uid) problem('account/id-unavailable');
      const next = old ? { ...old } : { uid: account.uid, username: account.username, userId: account.userId,
        email: account.email, name: account.name, status: 'active', character: null, characterId: '', provider: 'firebase', createdAt: timestamp };
      next.updatedAt = timestamp;
      if (extra.recoveryHash) Object.assign(next, { recoveryHash: extra.recoveryHash, recoveryIssuedAt: extra.recoveryIssuedAt });
      const characterId = next.characterId || next.character?.id || '';
      tx.set(ref, next);
      const identity = { uid: account.uid, userId: account.userId, characterId, updatedAt: timestamp };
      tx.set(lookup, { ...identity, username: account.username, authEmail: mapping?.authEmail || old?.email || account.email || usernameEmail(account.username), status: 'active', lifecycleStatus: 'active', deleteReusable: false,
        ...(deleteField !== undefined ? { recoveryHash: deleteField } : {}), ...(extra.recoveryHash ? { recoveryIssuedAt: extra.recoveryIssuedAt } : {}) }, { merge: true });
      tx.set(idRef, { ...identity, status: 'active', lifecycleStatus: 'active', deleteReusable: false }, { merge: true });
      return next;
    });
  }

  window.PointyAuthCore = {
    USERNAME_DOMAIN,
    normalizeUsername,
    usernameEmail,
    accountLogin,
    authEmailForUsername,
    isBlockedAccountStatus,
    persistAccount
  };
})();
