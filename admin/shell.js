/* One frame for every Admin page. Data and privileged actions remain in app.js. */
(function () {
  const icon = name => window.CoinQuestIcons(name);
  const escape = value => window.CoinQuestAdminUtils.h(value);
  const groups = [
    ['Overview', [['dashboard', 'Dashboard', 'home'], ['map', 'Relationship Map', 'compass']]],
    ['Manage', [['boards', 'Boards', 'scroll'], ['users', 'Users', 'profile'], ['admins', 'Board Admins', 'shield'], ['tombstones', 'Deleted IDs', 'document']]],
    ['Ops', [['audit', 'Audit Log', 'scroll'], ['revisions', 'Version Control', 'backup'], ['support', 'Support Tools', 'settings']]]
  ];
  const compact = matchMedia('(max-width: 1023px)');
  const compactActions = matchMedia('(max-width: 1199px)');
  let returnFocus = null;

  function header({ test, dirty, changes, email, unavailable }) {
    return `<header class="topbar">
      <button class="shell-icon nav-toggle" aria-label="Open navigation" aria-controls="admin-navigation" aria-expanded="false" data-admin-nav-toggle><span class="menu-lines" aria-hidden="true"></span></button>
      <a class="tb-brand" href="?${test ? 'test=1&' : ''}tab=dashboard" onclick="if(!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey){event.preventDefault();selectTab('dashboard')}" aria-label="Super Admin Portal — Dashboard">
        <span class="tb-crest">${icon('shield')}</span><span><span class="tb-title">Super Admin Portal</span><span class="tb-sub">Coin Quest Ledger</span></span>
      </a>
      <div class="tb-right">
        <div class="tb-actions" id="admin-actions">
          <span class="env-pill">${icon('lock')}${test ? 'Test mode' : 'Google Auth'}</span>
          <span id="draft-badge" class="env-pill draft-status" role="status">${dirty ? 'Unpublished changes' : 'Published version'}</span>
          <div class="tb-draft-actions"><button class="btn btn-ghost sm" onclick="saveDraft()" ${unavailable ? 'disabled' : ''}>Save</button>
          <button class="btn btn-ghost sm" onclick="restoreDraft()" ${unavailable ? 'disabled' : ''}>Restore</button>
          <button id="publish-btn" class="btn btn-primary sm" onclick="publishDraft()" ${unavailable ? 'disabled' : ''}>Publish${changes ? ` (${changes})` : ''}</button></div>
          <button class="btn btn-ghost sm sign-out" onclick="lockGate()">${icon('logout')}Sign out</button>
        </div>
        <button class="shell-icon actions-toggle" aria-label="Open admin actions" aria-controls="admin-actions" aria-expanded="false" data-admin-actions-toggle>${icon('settings')}<span class="action-dot" ${changes ? '' : 'hidden'}></span></button>
        <div class="tb-admin"><div class="who"><b>Super Admin</b><span>${escape(email)}</span></div><span class="tb-ava">${icon('shield')}</span></div>
      </div>
    </header>`;
  }
  function sidebar({ tab, changes, boards, admins, users, links }) {
    return `<div class="nav-backdrop" data-admin-nav-close aria-hidden="true"></div>
      <aside class="sidebar" id="admin-navigation" aria-label="Admin navigation">
        <div class="sidebar-mobile-head"><b>Admin navigation</b><button class="shell-icon" aria-label="Close navigation" data-admin-nav-close>${icon('close')}</button></div>
        <nav>${groups.map(([label, items]) => `<div class="nav-group-label">${label}</div>${items.map(([key, text, glyph]) => `<button type="button" aria-label="${text}" class="nav-item ${tab === key ? 'active on' : ''}" ${tab === key ? 'aria-current="page"' : ''} onclick="selectTab('${key}')"><span class="ni-ico">${icon(glyph)}</span><span>${text}</span>${key === 'revisions' && changes ? `<span class="ni-badge">${changes}</span>` : ''}</button>`).join('')}`).join('')}</nav>
        <div class="nav-spacer"></div>
        <div class="nav-motto" aria-hidden="true"><p>ทุกการเปลี่ยนแปลง<br>มีร่องรอยเสมอ<br>ตรวจสอบได้เสมอ</p></div>
        <div class="nav-foot"><b>${boards}</b> Boards · <b>${admins}</b> Admins<br><b>${users}</b> Global users · <b>${links}</b> Character links</div>
      </aside>`;
  }
  function footer() {
    return `<footer class="admin-footer"><p>“Small steps<br>build great adventures.”</p><span>Coin Quest Ledger · Super Admin Portal</span></footer>`;
  }
  function sync() {
    const side = document.getElementById('admin-navigation');
    const opened = document.body.classList.contains('admin-nav-open') && compact.matches;
    if (side) {
      side.inert = compact.matches && !opened;
      if (opened) { side.setAttribute('role', 'dialog'); side.setAttribute('aria-modal', 'true'); }
      else { side.removeAttribute('role'); side.removeAttribute('aria-modal'); }
    }
    document.querySelector('.topbar')?.toggleAttribute('inert', opened);
    document.querySelector('.main')?.toggleAttribute('inert', opened);
    document.querySelector('[data-admin-nav-toggle]')?.setAttribute('aria-expanded', String(opened));
    const toolsOpen = document.body.classList.contains('admin-actions-open') && compactActions.matches;
    document.querySelector('[data-admin-actions-toggle]')?.setAttribute('aria-expanded', String(toolsOpen));
    const actions = document.getElementById('admin-actions');
    if (actions) actions.inert = compactActions.matches && !toolsOpen;
  }
  function close({ restoreFocus = false } = {}) {
    document.body.classList.remove('admin-nav-open', 'admin-actions-open');
    sync();
    if (restoreFocus && returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  }
  function mount() { close(); }
  document.addEventListener('click', event => {
    const navToggle = event.target.closest('[data-admin-nav-toggle]');
    const actionsToggle = event.target.closest('[data-admin-actions-toggle]');
    if (navToggle) {
      close(); returnFocus = navToggle;
      document.body.classList.add('admin-nav-open'); sync();
      document.querySelector('.sidebar [data-admin-nav-close]')?.focus();
    } else if (event.target.closest('[data-admin-nav-close]')) close({ restoreFocus: true });
    else if (actionsToggle) {
      const opened = document.body.classList.contains('admin-actions-open');
      close();
      if (!opened) { returnFocus = actionsToggle; document.body.classList.add('admin-actions-open'); sync(); }
    } else if (!event.target.closest('#admin-actions') && !event.target.closest('#modal-root') && document.body.classList.contains('admin-actions-open')) close();
  });
  document.addEventListener('keydown', event => {
    if (document.querySelector('#modal-root.show')) return;
    if (event.key === 'Escape' && document.body.matches('.admin-nav-open, .admin-actions-open')) {
      event.preventDefault(); close({ restoreFocus: true });
    }
    if (event.key === 'Tab' && document.body.classList.contains('admin-nav-open')) {
      const buttons = [...document.querySelectorAll('.sidebar button, .sidebar a')].filter(el => el.getClientRects().length);
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  compact.addEventListener('change', () => close({ restoreFocus: true }));
  compactActions.addEventListener('change', () => close({ restoreFocus: true }));
  window.CoinQuestAdminShell = { header, sidebar, footer, mount, close };
})();
