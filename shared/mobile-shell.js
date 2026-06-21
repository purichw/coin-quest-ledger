(function () {
  const SHELL_ROOT_ID = 'mobile-shell-root';
  const THEME_KEY = 'pointy_theme';
  const UI_KEY = 'coin_quest_ui_v1';
  const THEMES = new Set(['tavern', 'dungeon']);
  const TEST_MODE = new URLSearchParams(location.search || '').get('test') === '1' || (() => {
    try { return sessionStorage.getItem('pointy_test_mode_v1') === '1'; } catch (_) { return false; }
  })();

  const COPY = {
    th: {
      app: 'Coin Quest',
      account: 'นักผจญภัย',
      accountSub: 'เครื่องนี้',
      home: 'หน้าหลัก',
      compare: 'ราคา',
      split: 'แบ่งเงิน',
      debt: 'มังกร',
      treasury: 'คลัง',
      profile: 'โปรไฟล์',
      reminders: 'แจ้งเตือน',
      settings: 'ตั้งค่า',
      theme: 'ธีม',
      lang: 'ภาษา',
      light: 'สว่าง',
      dark: 'มืด',
      signOut: 'ออกจากระบบ'
    },
    en: {
      app: 'Coin Quest',
      account: 'Adventurer',
      accountSub: 'This device',
      home: 'Home',
      compare: 'Prices',
      split: 'Split',
      debt: 'Debt',
      treasury: 'Treasury',
      profile: 'Profile',
      reminders: 'Reminders',
      settings: 'Settings',
      theme: 'Theme',
      lang: 'Lang',
      light: 'Light',
      dark: 'Dark',
      signOut: 'Sign out'
    }
  };

  const TABS = [
    { id: 'home', href: '/', icon: '🏠' },
    { id: 'split', href: '/trip/', icon: '🧰' },
    { id: 'debt', href: '/debt/', icon: '🐉' },
    { id: 'compare', href: '/?view=compare', icon: '⚖️' },
    { id: 'treasury', href: '/treasury/', icon: '🏦' }
  ];

  const tabById = new Map(TABS.map(tab => [tab.id, tab]));

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

  function html(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function currentLang() {
    return window.LANG === 'en' || localStorage.getItem('lang') === 'en' ? 'en' : 'th';
  }

  function text() {
    return COPY[currentLang()] || COPY.th;
  }

  function normalizedTheme(value) {
    return THEMES.has(value) ? value : 'tavern';
  }

  function currentTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (THEMES.has(saved)) return saved;
    } catch (_) {}
    const uiTheme = readJson(UI_KEY, {}).theme;
    if (THEMES.has(uiTheme)) return uiTheme;
    return normalizedTheme(document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme'));
  }

  function persistTheme(theme) {
    const next = normalizedTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (_) {}
    writeJson(UI_KEY, { ...readJson(UI_KEY, {}), theme: next });
  }

  function applyTheme(theme) {
    const next = normalizedTheme(theme);
    if (typeof window.setTheme === 'function') window.setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    document.body.setAttribute('data-theme', next);
    persistTheme(next);
    renderDrawer();
  }

  function activeTabId() {
    const path = window.location.pathname || '/';
    const view = new URLSearchParams(window.location.search || '').get('view');
    if (path.startsWith('/trip')) return 'split';
    if (path.startsWith('/debt')) return 'debt';
    if (path.startsWith('/treasury')) return 'treasury';
    if (view === 'compare') return 'compare';
    return 'home';
  }

  function isHomeShell() {
    return Boolean(document.getElementById('home-view') && document.getElementById('compare-view'));
  }

  function openTab(tabId) {
    const tab = tabById.get(tabId);
    if (!tab) return;
    closeDrawer();
    if (tab.id === 'home' && isHomeShell() && typeof window.showHome === 'function') {
      window.showHome();
      refresh();
      return;
    }
    window.location.href = withTestParam(tab.href);
  }

  function withTestParam(href) {
    if (!TEST_MODE) return href;
    try {
      const url = new URL(href, location.origin);
      url.searchParams.set('test', '1');
      return url.pathname + url.search + url.hash;
    } catch (_) {
      return href;
    }
  }

  function ensureRoot() {
    let root = document.getElementById(SHELL_ROOT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = SHELL_ROOT_ID;
      document.body.appendChild(root);
    }
    return root;
  }

  function ensureHeader() {
    const left = document.querySelector('.tb-left');
    if (!left || left.querySelector('.tb-burger')) return;
    left.insertAdjacentHTML('afterbegin', '<button class="tb-burger" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>');
    const burger = left.querySelector('.tb-burger');
    burger.insertAdjacentHTML('afterend', `<span class="tb-wordmark mobile-only">${html(text().app)}</span>`);
  }

  function ensureTabs() {
    if (document.querySelector('.mtabbar')) return;
    const nav = document.createElement('nav');
    nav.className = 'mtabbar';
    nav.setAttribute('aria-label', 'Mobile navigation');
    document.body.appendChild(nav);
  }

  function tabMarkup(tab, active) {
    const label = text()[tab.id];
    return `<a class="mtab ${tab.id === active ? 'on' : ''}" href="${html(withTestParam(tab.href))}" data-mtab="${html(tab.id)}" aria-label="${html(label)}">
      <span class="mtab-ic"><span class="mt-emoji">${html(tab.icon)}</span></span>
      <span class="mtab-lab">${html(label)}</span>
    </a>`;
  }

  function renderTabs() {
    const nav = document.querySelector('.mtabbar');
    if (!nav) return;
    const active = activeTabId();
    nav.innerHTML = TABS.map(tab => tabMarkup(tab, active)).join('');
  }

  function tabDrawerMarkup(tab, active) {
    return `<a class="mm-item" href="${html(withTestParam(tab.href))}" data-mm-tab="${html(tab.id)}">
      <span class="mm-ic">${html(tab.icon)}</span><span class="mm-lab">${html(text()[tab.id])}</span><span class="mm-arr">${tab.id === active ? '•' : '›'}</span>
    </a>`;
  }

  function accountHandle(account) {
    const username = String(account?.username || '').trim();
    if (username) return `@${username}`;
    const email = String(account?.email || '').trim();
    const [local, domain] = email.split('@');
    if (domain === 'coinquest.local' && local) return `@${local}`;
    return local ? `@${local}` : text().accountSub;
  }

  function renderDrawer() {
    const root = ensureRoot();
    const active = activeTabId();
    const theme = currentTheme();
    const t = text();
    const account = window.PointyProfileHub?.loadAccount?.();
    root.innerHTML = `<div class="mm-overlay">
      <aside class="mm-panel">
        <div class="mm-head">
          <div class="mm-title">${html(t.app)}</div>
          <button class="mm-close" type="button" data-mm-close aria-label="Close">✕</button>
        </div>
        <div class="mm-scroll">
          <div class="mm-account"><span class="mm-avatar">🦸</span><div><div class="mm-name">${html(account?.name || t.account)}</div><div class="mm-sub">${html(accountHandle(account))}${account?.userId ? ` · ID ${html(account.userId)}` : ''}</div></div></div>
          ${TABS.map(tab => tabDrawerMarkup(tab, active)).join('')}
          <button class="mm-item" type="button" data-mm-action="profile"><span class="mm-ic">🏅</span><span class="mm-lab">${html(t.profile)}</span><span class="mm-arr">›</span></button>
          <button class="mm-item" type="button" data-mm-action="reminders"><span class="mm-ic">🔔</span><span class="mm-lab">${html(t.reminders)}</span><span class="mm-arr">›</span></button>
          ${typeof window.openSettings === 'function' ? `<button class="mm-item" type="button" data-mm-action="settings"><span class="mm-ic">⚙️</span><span class="mm-lab">${html(t.settings)}</span><span class="mm-arr">›</span></button>` : ''}
          <div class="mm-seg-row"><span class="mm-seg-k">${html(t.theme)}</span><span class="mm-seg"><button type="button" class="${theme !== 'dungeon' ? 'on' : ''}" data-mm-theme="tavern">${html(t.light)}</button><button type="button" class="${theme === 'dungeon' ? 'on' : ''}" data-mm-theme="dungeon">${html(t.dark)}</button></span></div>
          <div class="mm-seg-row"><span class="mm-seg-k">${html(t.lang)}</span><span class="mm-seg"><button type="button" class="${currentLang() === 'th' ? 'on' : ''}" data-mm-lang="th">TH</button><button type="button" class="${currentLang() === 'en' ? 'on' : ''}" data-mm-lang="en">EN</button></span></div>
          <button class="mm-item mm-logout" type="button" data-mm-action="logout"><span class="mm-ic">🚪</span><span class="mm-lab">${html(t.signOut)}</span></button>
        </div>
      </aside>
    </div>`;
  }

  function openDrawer() {
    const burger = document.querySelector('.tb-burger');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    renderDrawer();
  }

  function closeDrawer() {
    const root = document.getElementById(SHELL_ROOT_ID);
    if (root) root.innerHTML = '';
    const burger = document.querySelector('.tb-burger');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }

  function setLanguage(next) {
    if (typeof window.setLang === 'function') window.setLang(next);
    else localStorage.setItem('lang', next);
    refresh();
    renderDrawer();
  }

  function handleClick(event) {
    const burger = event.target.closest('.tb-burger');
    if (burger) {
      event.preventDefault();
      openDrawer();
      return;
    }

    const tab = event.target.closest('[data-mtab], [data-mm-tab]');
    if (tab) {
      event.preventDefault();
      openTab(tab.dataset.mtab || tab.dataset.mmTab);
      return;
    }

    if (event.target.classList.contains('mm-overlay') || event.target.closest('[data-mm-close]')) {
      closeDrawer();
      return;
    }

    const theme = event.target.closest('[data-mm-theme]');
    if (theme) {
      applyTheme(theme.dataset.mmTheme);
      return;
    }

    const lang = event.target.closest('[data-mm-lang]');
    if (lang) {
      setLanguage(lang.dataset.mmLang);
      return;
    }

    const action = event.target.closest('[data-mm-action]');
    if (!action) return;
    closeDrawer();
    if (action.dataset.mmAction === 'profile') window.PointyProfileHub?.showProfile?.();
    if (action.dataset.mmAction === 'reminders') window.PointyProfileHub?.showReminders?.();
    if (action.dataset.mmAction === 'settings') window.openSettings?.();
    if (action.dataset.mmAction === 'logout') window.PointyProfileHub?.signOut?.();
  }

  function refresh() {
    document.documentElement.classList.remove('cq-mobile-tab-home', 'cq-mobile-tab-split', 'cq-mobile-tab-debt', 'cq-mobile-tab-compare', 'cq-mobile-tab-treasury');
    document.documentElement.classList.add(`cq-mobile-tab-${activeTabId()}`);
    document.querySelectorAll('.tb-wordmark.mobile-only').forEach(el => { el.textContent = text().app; });
    renderTabs();
  }

  function init() {
    ensureRoot();
    ensureHeader();
    ensureTabs();
    refresh();
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDrawer(); });
    window.addEventListener('popstate', refresh);
  }

  window.CoinQuestMobileShell = { refresh, openDrawer, closeDrawer };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
