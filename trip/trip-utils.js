(function () {
  const THEME_KEY = 'pointy_theme';
  const UI_KEY = 'coin_quest_ui_v1';

  function readJsonSetting(key, fallback = {}) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJsonSetting(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function normalizeThemeValue(theme) {
    return theme === 'dungeon' ? 'dungeon' : 'tavern';
  }

  function currentGlobalTheme(fallback = 'tavern') {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dungeon' || saved === 'tavern') return saved;
    } catch (_) {}
    const uiTheme = readJsonSetting(UI_KEY, {}).theme;
    if (uiTheme === 'dungeon' || uiTheme === 'tavern') return uiTheme;
    const domTheme = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme');
    if (domTheme === 'dungeon' || domTheme === 'tavern') return domTheme;
    return normalizeThemeValue(fallback);
  }

  function persistGlobalTheme(theme) {
    const next = normalizeThemeValue(theme);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (_) {}
    writeJsonSetting(UI_KEY, { ...readJsonSetting(UI_KEY, {}), theme: next });
    return next;
  }

  function applyGlobalTheme(theme) {
    const next = persistGlobalTheme(theme);
    document.documentElement.setAttribute('data-theme', next);
    document.body.dataset.theme = next;
    return next;
  }

  function makeId() {
    return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  }

  function makeTripCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  function makeAdminCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function makeOwnerToken() {
    return (window.crypto?.randomUUID?.() || `${makeId()}-${Date.now().toString(36)}`);
  }

  function makeAdminId() {
    return 'ADM-' + makeAdminCode();
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

  function locale() {
    return window.LANG === 'th' ? 'th-TH' : 'en-US';
  }

  function money(n) {
    return '฿' + Math.round(Number(n) || 0).toLocaleString(locale());
  }

  function money2(n) {
    return '฿' + (Number(n) || 0).toLocaleString(locale(), { maximumFractionDigits: 2 });
  }

  function hashOf(name) {
    return window.PointyLogic.hashOf(name);
  }

  function adminHash(pass) {
    return String(hashOf(`pointy:${pass || ''}:admin`));
  }

  function ownerHash(token) {
    return String(hashOf(`pointy:${token || ''}:owner`));
  }

  window.CoinQuestTripUtils = {
    readJsonSetting,
    writeJsonSetting,
    normalizeThemeValue,
    currentGlobalTheme,
    persistGlobalTheme,
    applyGlobalTheme,
    makeId,
    makeTripCode,
    makeAdminCode,
    makeOwnerToken,
    makeAdminId,
    h,
    q,
    money,
    money2,
    hashOf,
    adminHash,
    ownerHash
  };
})();
