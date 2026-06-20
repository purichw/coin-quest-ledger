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
    return BLOCKED_STATUSES.includes(String(account?.status || '').toLowerCase());
  }

  window.PointyAuthCore = {
    USERNAME_DOMAIN,
    normalizeUsername,
    usernameEmail,
    accountLogin,
    authEmailForUsername,
    isBlockedAccountStatus
  };
})();
