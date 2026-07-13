(function () {
  const STATUS_WEIGHTS = {
    active: 0,
    archived: 1,
    deactivated: 2,
    delete_requested: 3,
    deleted: 4
  };

  function hashOf(value) {
    return window.PointyLogic.hashOf(value);
  }

  function adminHash(pass) {
    return String(hashOf(`pointy:${pass || ''}:admin`));
  }

  function h(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function q(value) {
    return JSON.stringify(String(value ?? '')).replace(/"/g, '&quot;');
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function characterLevelFromXp(xp) {
    return window.PointyLogic.levelFromXp(xp);
  }

  function profileLevelFromReputation(reputation) {
    return window.PointyLogic.levelFromReputation
      ? window.PointyLogic.levelFromReputation(reputation)
      : window.PointyLogic.levelFromRenown(reputation);
  }

  function normalizeUserStatus(value) {
    const key = String(value || 'active').toLowerCase();
    return Object.prototype.hasOwnProperty.call(STATUS_WEIGHTS, key) ? key : 'active';
  }

  function statusWeight(value) {
    return STATUS_WEIGHTS[normalizeUserStatus(value)] || 0;
  }

  function mergeUserStatus(a, b) {
    return statusWeight(b) > statusWeight(a) ? normalizeUserStatus(b) : normalizeUserStatus(a);
  }

  function userLifecycleLabel(status) {
    return {
      active: 'active',
      archived: 'archived',
      deactivated: 'deactivated',
      delete_requested: 'delete requested',
      deleted: 'deleted'
    }[normalizeUserStatus(status)] || 'active';
  }

  function normalizeUsername(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32);
  }

  function adminAuthEmail(username) {
    const clean = normalizeUsername(username);
    return `${clean}.admin-${Date.now().toString(36)}@coinquest.local`;
  }

  function tempPassword() {
    return 'CQ-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  async function sha256(text) {
    const data = new TextEncoder().encode(String(text || ''));
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function cleanRecoveryCode(code) {
    return String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  async function recoveryHash(username, code) {
    return sha256(`${normalizeUsername(username)}:${cleanRecoveryCode(code)}`);
  }

  function recoveryCodeValue() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => alphabet[b % alphabet.length]).join('').replace(/(.{4})/g, '$1-').replace(/-$/, '');
  }

  window.CoinQuestAdminUtils = {
    hashOf,
    adminHash,
    h,
    q,
    uid,
    clone,
    characterLevelFromXp,
    profileLevelFromReputation,
    normalizeUserStatus,
    statusWeight,
    mergeUserStatus,
    userLifecycleLabel,
    normalizeUsername,
    adminAuthEmail,
    tempPassword,
    sha256,
    cleanRecoveryCode,
    recoveryHash,
    recoveryCodeValue
  };
})();
