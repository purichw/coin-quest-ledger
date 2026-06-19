(function () {
  const AUTH_KEY = 'pointy_auth_v1';
  const TEST_MODE = new URLSearchParams(location.search || '').get('test') === '1';

  function readAuth() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function clean(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 48);
  }

  function accountKey(account = readAuth()) {
    if (TEST_MODE || !account || account.signedOut) return '';
    if (account.uid) return `uid_${clean(account.uid)}`;
    if (account.userId) return `user_${clean(account.userId)}`;
    if (account.username) return `name_${clean(account.username)}`;
    const emailName = String(account.email || '').split('@')[0];
    return emailName ? `name_${clean(emailName)}` : '';
  }

  function key(base, account) {
    const scoped = accountKey(account);
    return scoped ? `${base}::${scoped}` : base;
  }

  function getJSON(base, fallback, opts = {}) {
    const scopedKey = key(base, opts.account);
    try {
      const raw = localStorage.getItem(scopedKey);
      if (raw) return JSON.parse(raw);
      if (opts.legacyFallback && scopedKey !== base) {
        const legacy = localStorage.getItem(base);
        if (legacy) return JSON.parse(legacy);
      }
    } catch (_) {}
    return fallback;
  }

  function setJSON(base, value, opts = {}) {
    try { localStorage.setItem(key(base, opts.account), JSON.stringify(value)); } catch (_) {}
  }

  function remove(base, opts = {}) {
    try { localStorage.removeItem(key(base, opts.account)); } catch (_) {}
  }

  window.PointyScope = { key, accountKey, getJSON, setJSON, remove, readAuth };
})();
