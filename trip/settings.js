/* Board settings presentation. Data, permissions and mutations remain in app.js. */
let boardSettingsSession = null;

function settingsText(key) {
  const labels = {
    title: ['ตั้งค่าบอร์ด', 'Board settings'], subtitle: ['ปรับแต่งการเล่น และจัดการสมาชิกในปาร์ตี้ของคุณ', 'Make the board yours and manage your party.'],
    general: ['ทั่วไป', 'General'], members: ['สมาชิกปาร์ตี้', 'Members'], board: ['ข้อมูลบอร์ด', 'Board'], game: ['ระบบเกม', 'Game'], tools: ['เครื่องมือข้อมูล', 'Data tools'],
    appearance: ['ธีมและการแสดงผล', 'Theme & appearance'], statsHelp: ['HP / LVL / XP บนการ์ดสมาชิก', 'HP / LVL / XP on member cards'],
    green: ['เขียว', 'Green'], gold: ['ทอง', 'Gold'], red: ['แดง', 'Red'], purple: ['ม่วง', 'Purple'], blue: ['น้ำเงิน', 'Blue'],
    copy: ['คัดลอก', 'Copy'], copied: ['คัดลอกลิงก์แล้ว', 'Link copied'], copyFailed: ['คัดลอกไม่ได้ เลือกลิงก์แล้วคัดลอกด้วยตนเองได้', 'Could not copy. Select the link and copy it manually.'],
    share: ['แชร์ลิงก์', 'Share link'], close: ['ปิดการตั้งค่าบอร์ด', 'Close board settings'], manage: ['จัดการสมาชิก', 'Manage member'],
    profile: ['โปรไฟล์', 'Profile'], boardsHelp: ['บอร์ดอื่น ๆ ที่คุณดูแล', 'Other boards you manage'], create: ['สร้างบอร์ดใหม่', 'Create a board'],
    export: ['ส่งออกรายการ Excel', 'Export expenses to Excel'], import: ['นำเข้ารายการ', 'Import expenses'], toolsHelp: ['ดาวน์โหลดรายการค่าใช้จ่าย หรือเพิ่มรายการจากไฟล์', 'Download expenses or add entries from a file.'],
    guest: ['แขก', 'Guest'], memberCount: ['คน', 'members'], entryCount: ['รายการ', 'expenses'], viewBoard: ['เปิดบอร์ด', 'Open board'],
    lockHelp: ['ปลดล็อกแอดมินเพื่อจัดการสมาชิกและข้อมูลบอร์ด', 'Unlock admin controls to manage members and board information.'],
  };
  return labels[key]?.[LANG === 'en' ? 1 : 0] || key;
}
function settingsHeading(icon, title, sub = '') {
  return `<div class="bs-section-heading">${boardIcon(icon)}<div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div></div>`;
}
function settingsMemberRows() {
  return S.participants.map(name => {
    const id = S.guestHeroes?.[name] ? '' : ensureCharacterId(name);
    const key = hashOf(name), rec = _characterRegistry[id] || {};
    return `<div class="bs-member" data-settings-member="${key}" role="row">
      <div class="bs-member-name" role="cell">${heroAvatar(name, 32)}<strong>${h(name)}</strong></div>
      <div class="bs-member-id" role="cell">${id ? `<input id="char-id-${key}" class="admin-id-input" aria-label="${h(t('character_id') + ' · ' + name)}" maxlength="4" pattern="[0-9]{4}" inputmode="numeric" value="${h(id)}" data-character-id>` : `<span class="bs-muted">${settingsText('guest')}</span>`}</div>
      <div class="bs-member-xp" role="cell"><span class="bs-mobile-label">XP</span>${Math.round(Number(rec.xp) || characterBaseXp(name) || 0)}</div>
      <div class="bs-member-class" role="cell">${h(CLASSES[classOf(name)][LANG] || CLASSES[classOf(name)].th)}</div>
      <div class="bs-member-actions" id="bs-actions-${key}" role="cell">${id ? `<a class="bs-button" href="${h(characterProfileLink(id))}">${settingsText('profile')}</a><button class="bs-button" onclick="saveCharacterId(${q(name)})">${t('btn_save')}</button><button class="bs-button" onclick="resetCharacterId(${q(name)})">${t('char_id_new')}</button>` : ''}<button class="bs-button bs-danger" aria-label="${h(t('del_title') + ' ' + name)}" onclick="adminDeleteHero(${q(name)})">${boardIcon('trash')}</button></div>
      <button class="bs-member-toggle bs-icon-button" aria-label="${h(settingsText('manage') + ' ' + name)}" aria-expanded="false" aria-controls="bs-actions-${key}" data-settings-member-toggle="${key}">${boardIcon('chevron')}</button>
    </div>`;
  }).join('');
}
function settingsAdminMarkup() {
  const heading = settingsHeading('shield', t('admin_controls'), t('admin_controls_sub'));
  if (!isAdminConfigured()) {
    const profile = adminOwnerProfile();
    return `<section class="bs-section" id="bs-board">${settingsHeading('shield', t('admin_setup'), t('admin_setup_sub'))}
      <form class="bs-card bs-admin-form" data-settings-admin-form="setup">
        <div class="field"><label for="admin-url-id">${t('admin_url')}</label><input id="admin-url-id" class="field-input" value="${h(sanitizeTripSlug(tripId))}" maxlength="36" pattern="(?:[a-z0-9_]|-){1,36}" required ${canChangeTripUrl() ? '' : 'disabled'}></div>
        <div class="field"><label for="admin-owner-id">${t('admin_owner_id')}</label><input id="admin-owner-id" maxlength="80" class="field-input" value="${h(profile.adminId)}"></div>
        <div class="field"><label for="admin-owner-name">${t('admin_owner_name')}</label><input id="admin-owner-name" maxlength="80" class="field-input" value="${h(profile.adminName)}" placeholder="${h(t('admin_owner_name_placeholder'))}"></div>
        <div class="field"><label for="admin-pass-new">${t('admin_password')}</label><input id="admin-pass-new" class="field-input" type="password" minlength="4" required autocomplete="new-password" placeholder="${h(t('admin_password_placeholder'))}"></div>
        <button class="bs-button bs-primary" type="submit">${t('admin_create')}</button>
      </form></section>`;
  }
  if (!isAdminUnlocked()) return `<section class="bs-section" id="bs-board">${settingsHeading('lock', t('admin_controls'), t('admin_locked_sub'))}
    <form class="bs-card bs-unlock" data-settings-admin-form="unlock"><div class="field"><label for="admin-pass">${t('admin_password')}</label><input id="admin-pass" class="field-input" type="password" required autocomplete="current-password"></div><button class="bs-button bs-primary" type="submit">${t('admin_unlock')}</button></form></section>`;
  return `<section class="bs-section" id="bs-board">${heading}<div class="bs-card bs-admin-card">
    <div class="bs-link-row"><div class="field"><label for="bs-board-url">${t('admin_url')}</label><input id="bs-board-url" class="field-input" value="${h(tripLinkFor())}" readonly></div><button class="bs-button" data-settings-share>${boardIcon('link')}<span>${settingsText('share')}</span></button><button class="bs-button" data-settings-copy>${boardIcon('copy')}<span>${settingsText('copy')}</span></button></div>
    <p class="bs-feedback" role="status" id="bs-copy-status"></p>
    <div id="bs-members" class="admin-table" role="table" aria-label="${settingsText('members')}"><div class="bs-table-head" role="row"><span role="columnheader">${t('hero_name_short')}</span><span role="columnheader">${t('character_id')}</span><span role="columnheader">XP</span><span role="columnheader">${t('pick_class')}</span><span role="columnheader">${t('admin_actions')}</span></div><div role="rowgroup">${settingsMemberRows() || `<p class="bs-empty">${t('no_participants')}</p>`}</div></div>
    <div class="bs-lock-row"><button class="bs-text-button" onclick="lockAdmin()">${boardIcon('lock')}${t('admin_lock')}</button></div>
  </div></section>${settingsOwnedBoardsMarkup()}`;
}
function settingsOwnedBoardsMarkup() {
  const items = _ownedBoards.map(board => `<a class="bs-owned-board ${board.id === tripId ? 'is-current' : ''}" href="${h(tripLinkFor(board.id))}" ${board.id === tripId ? 'aria-current="page"' : ''}>
    <span class="bs-board-art">${questIconMarkup('🏕️', 36)}</span><span class="bs-board-info"><strong>${h(board.tripName || t('trip_fallback_name'))}</strong><small>#${h(board.id)} · ${board.participants} ${settingsText('memberCount')} · ${board.expenses} ${settingsText('entryCount')}</small></span><span class="bs-board-open">${board.id === tripId ? t('current_board') : settingsText('viewBoard')}${boardIcon('arrow')}</span></a>`).join('');
  return `<section class="bs-section" id="bs-owned">${settingsHeading('shield', t('admin_boards'), settingsText('boardsHelp'))}<div class="bs-owned-grid owned-board-list">${_ownedBoardsLoading ? `<p class="bs-muted" role="status">${t('admin_boards_loading')}</p>` : items || `<p class="bs-muted">${t('admin_boards_empty')}</p>`}<button class="bs-create-board" onclick="newTrip()">＋ ${settingsText('create')}</button></div></section>`;
}
function settingsMarkup() {
  const nav = [['general','settings'],['members','split'],['board','shield'],['game','swords'],['tools','treasury']];
  const colors = ['green','gold','red','purple','blue'];
  return `<div class="bs-backdrop"><div class="bs-dialog" role="dialog" aria-modal="true" aria-labelledby="bs-title" tabindex="-1">
    <header class="bs-header"><span class="bs-header-icon">${boardIcon('settings')}</span><div><h2 id="bs-title">${settingsText('title')}<span class="bs-desktop-name"> : ${h(S.tripName || t('trip_fallback_name'))}</span></h2><p class="bs-header-description">${settingsText('subtitle')}</p><p class="bs-compact-name">${h(S.tripName || t('trip_fallback_name'))}</p></div><button class="bs-icon-button picker-close" data-settings-close aria-label="${settingsText('close')}">${boardIcon('close')}</button></header>
    <div class="bs-layout"><nav class="bs-nav" aria-label="${settingsText('title')}">${nav.map(([key,icon]) => `<button data-settings-nav="${key}" ${key === 'general' ? 'aria-current="location"' : ''}>${boardIcon(icon)}<span>${settingsText(key)}</span></button>`).join('')}</nav>
    <div class="bs-content" tabindex="0" aria-label="${settingsText('title')}">
      <section class="bs-card bs-appearance" id="bs-general">${settingsHeading('compass', settingsText('appearance'))}<div class="bs-appearance-controls"><div class="bs-swatches" role="group" aria-label="${t('accent')}">${ACCENTS.map((color,i) => `<button class="bs-swatch" style="--swatch:${color}" aria-label="${settingsText(colors[i])}" aria-pressed="${S.settings.accent === color}" onclick="setAccent('${color}')" data-settings-focus="accent-${i}"><span>${S.settings.accent === color ? '✓' : ''}</span></button>`).join('')}</div><div class="bs-theme" role="group" aria-label="${t('theme')}">${['tavern','dungeon'].map(theme => `<button aria-pressed="${S.settings.theme === theme}" onclick="setTheme('${theme}')" data-settings-focus="theme-${theme}">${t('theme_' + theme)}</button>`).join('')}</div></div></section>
      <section class="bs-card bs-game" id="bs-game">${settingsHeading('swords', settingsText('game'))}${[['stats','game_stats','shield'],['sound','sound_effects','bell'],['animations','animations','scroll']].map(([key,label,icon]) => {
        const on = key === 'animations' ? S.settings[key] !== false : !!S.settings[key];
        return `<div class="bs-toggle-row">${boardIcon(icon)}<div><strong id="bs-label-${key}">${t(label)}</strong>${key === 'stats' ? `<p>${settingsText('statsHelp')}</p>` : ''}</div><button class="bs-switch" role="switch" aria-checked="${on}" aria-labelledby="bs-label-${key}" onclick="toggleSetting('${key}')" data-settings-focus="${key}"><span></span></button></div>`;
      }).join('')}</section>
      ${settingsAdminMarkup()}
      <section class="bs-section" id="bs-tools">${settingsHeading('treasury', settingsText('tools'), settingsText('toolsHelp'))}<div class="bs-tools"><button class="bs-button" onclick="exportExcel()">${boardIcon('download')}${settingsText('export')}</button><button class="bs-button" onclick="openImportModal()">${boardIcon('upload')}${settingsText('import')}</button></div></section>
    </div></div></div></div>`;
}

function endBoardSettings() {
  if (!boardSettingsSession) return;
  const session = boardSettingsSession;
  boardSettingsSession = null;
  for (const [el, inert] of session.inert) el.inert = inert;
  document.body.classList.remove('board-settings-open');
  const opener = session.opener?.isConnected ? session.opener : document.querySelector('.board-banner-actions [data-action="settings"]');
  opener?.focus({ preventScroll: true });
}
function renderBoardSettings(root) {
  const old = root.querySelector('.bs-dialog');
  const focused = old?.contains(document.activeElement) ? document.activeElement : null;
  const focusKey = focused?.id || focused?.dataset.settingsFocus;
  const navKey = focused?.dataset.settingsNav;
  const selection = focused?.tagName === 'INPUT' ? [focused.selectionStart, focused.selectionEnd] : null;
  const drafts = [...(old?.querySelectorAll('input[id]:not([readonly])') || [])].map(el => ({ id: el.id, value: el.value, initial: el.defaultValue }));
  const expanded = [...(old?.querySelectorAll('.bs-member.is-expanded') || [])].map(el => el.dataset.settingsMember);
  const scroll = old?.querySelector('.bs-content').scrollTop || 0;
  const active = old?.querySelector('[data-settings-nav][aria-current]')?.dataset.settingsNav || 'general';
  if (!boardSettingsSession) {
    boardSettingsSession = { opener: document.activeElement, inert: [] };
    // Inert each sibling on the overlay's ancestor path, preserving earlier modal state.
    for (let el = root; el && el !== document.body; el = el.parentElement) {
      for (const sibling of el.parentElement.children) {
        if (sibling === el || sibling.matches('script,style,link,#toast,[role="status"]')) continue;
        boardSettingsSession.inert.push([sibling, sibling.inert]); sibling.inert = true;
      }
    }
    document.body.classList.add('board-settings-open');
  }
  root.innerHTML = settingsMarkup();
  const dialog = root.querySelector('.bs-dialog'), content = dialog.querySelector('.bs-content');
  drafts.forEach(({ id, value, initial }) => {
    const el = document.getElementById(id);
    // A committed value (e.g. regenerated ID) takes precedence over an old draft.
    if (el && el.defaultValue === initial) {
      el.value = value;
      if (el.hasAttribute('data-character-id') && value !== initial) el.setAttribute('aria-invalid', String(!/^\d{4}$/.test(value)));
    }
  });
  expanded.forEach(key => setSettingsMemberExpanded(dialog, key, true));
  const activate = key => dialog.querySelectorAll('[data-settings-nav]').forEach(button => {
    if (button.dataset.settingsNav === key) button.setAttribute('aria-current', 'location'); else button.removeAttribute('aria-current');
  });
  activate(active);
  dialog.querySelector('[data-settings-close]').onclick = closeOverlay;
  root.querySelector('.bs-backdrop').onclick = event => { if (event.target === event.currentTarget) closeOverlay(); };
  dialog.querySelectorAll('[data-settings-nav]').forEach(button => button.onclick = () => {
    const key = button.dataset.settingsNav;
    const target = dialog.querySelector('#bs-' + key) || dialog.querySelector('#bs-board');
    activate(key);
    content.scrollTop += target.getBoundingClientRect().top - content.getBoundingClientRect().top - 8;
    target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
  });
  dialog.querySelectorAll('[data-settings-member-toggle]').forEach(button => button.onclick = () => setSettingsMemberExpanded(dialog, button.dataset.settingsMemberToggle, button.getAttribute('aria-expanded') !== 'true'));
  dialog.querySelectorAll('[data-character-id]').forEach(input => input.oninput = () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 4);
    input.setAttribute('aria-invalid', String(!/^\d{4}$/.test(input.value)));
  });
  dialog.querySelectorAll('[data-settings-admin-form]').forEach(form => form.onsubmit = event => { event.preventDefault(); if (form.dataset.settingsAdminForm === 'setup') setupAdmin(); else unlockAdmin(); });
  dialog.querySelector('[data-settings-copy]')?.addEventListener('click', () => settingsShareLink(false));
  dialog.querySelector('[data-settings-share]')?.addEventListener('click', () => settingsShareLink(true));
  dialog.onkeydown = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeOverlay(); return; }
    if (event.key !== 'Tab') return;
    const tabbable = [...dialog.querySelectorAll('a[href],button,input,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
    const first = tabbable[0], last = tabbable.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  const focusTarget = focusKey ? document.getElementById(focusKey) || dialog.querySelector(`[data-settings-focus="${CSS.escape(focusKey)}"]`) : navKey ? dialog.querySelector(`[data-settings-nav="${navKey}"]`) : null;
  if (focusTarget) {
    focusTarget.focus({ preventScroll: true });
    if (selection && selection[0] !== null) focusTarget.setSelectionRange?.(...selection);
  } else if (!old) dialog.querySelector('[data-settings-close]').focus({ preventScroll: true });
  else if (focused) dialog.focus({ preventScroll: true });
  content.scrollTop = scroll;
}
function setSettingsMemberExpanded(dialog, key, expanded) {
  dialog.querySelector(`[data-settings-member="${key}"]`)?.classList.toggle('is-expanded', expanded);
  dialog.querySelector(`[data-settings-member-toggle="${key}"]`)?.setAttribute('aria-expanded', String(expanded));
}
async function settingsShareLink(share) {
  try {
    if (share && navigator.share) await navigator.share({ title: S.tripName, url: tripLinkFor() });
    else {
      await navigator.clipboard.writeText(tripLinkFor());
      const status = document.getElementById('bs-copy-status');
      if (status) status.textContent = settingsText('copied');
    }
  } catch (error) {
    if (error.name === 'AbortError') return;
    const status = document.getElementById('bs-copy-status');
    if (status) status.textContent = settingsText('copyFailed');
    document.getElementById('bs-board-url')?.select();
  }
}
