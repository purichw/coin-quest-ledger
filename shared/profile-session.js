(function () {
  const AUTH_KEY = 'pointy_auth_v1';
  const ACCOUNTS_KEY = 'pointy_accounts_v1';
  const TEST_FLAG_KEY = 'pointy_test_mode_v1';
  const FIREBASE_AUTH_TRUST_KEY = 'pointy_firebase_auth_trusted_v1';

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function urlTestMode() {
    return new URLSearchParams(location.search || '').get('test') === '1';
  }

  function isTestMode() {
    if (urlTestMode()) {
      try { sessionStorage.setItem(TEST_FLAG_KEY, '1'); } catch (_) {}
      return true;
    }
    try {
      return sessionStorage.getItem(TEST_FLAG_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function readAccounts() {
    const accounts = readJson(ACCOUNTS_KEY, []);
    return Array.isArray(accounts) ? accounts : [];
  }

  function writeAccounts(accounts) {
    writeJson(ACCOUNTS_KEY, Array.isArray(accounts) ? accounts : []);
  }

  function readAuth() {
    const auth = readJson(AUTH_KEY, null);
    if (!isTestMode() && auth?.provider === 'firebase' && !isFirebaseAuthTrusted()) return null;
    return auth;
  }

  function writeAuth(account) {
    if (!isTestMode() && account?.provider === 'firebase') markFirebaseAuthTrusted();
    writeJson(AUTH_KEY, account || null);
  }

  function clearAuth() {
    try { localStorage.removeItem(AUTH_KEY); } catch (_) {}
    clearFirebaseAuthTrusted();
  }

  function isFirebaseAuthTrusted() {
    try { return sessionStorage.getItem(FIREBASE_AUTH_TRUST_KEY) === '1'; } catch (_) { return false; }
  }

  function markFirebaseAuthTrusted() {
    try { sessionStorage.setItem(FIREBASE_AUTH_TRUST_KEY, '1'); } catch (_) {}
  }

  function clearFirebaseAuthTrusted() {
    try { sessionStorage.removeItem(FIREBASE_AUTH_TRUST_KEY); } catch (_) {}
  }

  window.PointyProfileSession = {
    AUTH_KEY,
    ACCOUNTS_KEY,
    TEST_FLAG_KEY,
    FIREBASE_AUTH_TRUST_KEY,
    isTestMode,
    readAccounts,
    writeAccounts,
    readAuth,
    writeAuth,
    clearAuth,
    isFirebaseAuthTrusted,
    markFirebaseAuthTrusted,
    clearFirebaseAuthTrusted
  };
})();
