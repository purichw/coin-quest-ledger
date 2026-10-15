(function () {
  function h(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const icon = name => window.CoinQuestIcons(name);
  const words = {
    th: { title: 'บัญชีของคุณ', close: 'ปิดแผงบัญชี', theme: 'โหมดสว่าง / มืด', language: 'ภาษา', all: 'ดูทั้งหมด', less: 'แสดงน้อยลง', awards: 'ถ้วยรางวัล', reveal: 'แสดงรหัสกู้คืน', conceal: 'ซ่อนรหัสกู้คืน', copy: 'คัดลอก', regenerate: 'สร้างใหม่', recovery: 'เก็บรหัสนี้ไว้ให้ปลอดภัย ใช้กู้คืนบัญชีเมื่อคุณลืมรหัสผ่าน', tour: 'ดูคำแนะนำการใช้งานอีกครั้ง', start: 'เริ่มคำแนะนำ', note: 'การผจญภัยทางการเงิน\nเริ่มได้เสมอ\nจากตัวตนของคุณ', members: 'คน', quests: 'รายการ' },
    en: { title: 'Your account', close: 'Close account panel', theme: 'Light / dark mode', language: 'Language', all: 'View all', less: 'Show less', awards: 'Trophies', reveal: 'Show recovery key', conceal: 'Hide recovery key', copy: 'Copy', regenerate: 'Create new key', recovery: 'Keep this code safe. Use it to recover your account if you forget your password.', tour: 'Replay the Welcome Tour', start: 'Start tour', note: 'Your next money adventure\nstarts with you.', members: 'members', quests: 'quests' }
  };
  function capture(root) {
    if (!root?.querySelector('.profile-drawer')) return null;
    return {
      sections: Object.fromEntries([...root.querySelectorAll('[data-drawer-section]')].map(el => [el.dataset.drawerSection, el.open])),
      scroll: root.querySelector('.pd-scroll').scrollTop,
      focus: root.contains(document.activeElement) ? document.activeElement.dataset.pdFocus : null,
      allBoards: root.querySelector('[data-all-boards]')?.getAttribute('aria-expanded') === 'true',
      revealed: root.querySelector('[data-reveal-recovery]')?.getAttribute('aria-pressed') === 'true'
    };
  }
  function render({ copy, language, theme, account, avatarHtml, name, rank, level, reputation, profileHref, streak, bestStreak, got, trophyCount, trophyHtml, boards, boardsLoading = false, boardsError = false, state }) {
    const w = words[language];
    const desktop = window.innerWidth >= 1024, mobile = window.innerWidth < 768;
    const open = (key, initial) => (state?.sections?.[key] ?? initial) ? ' open' : '';
    const chevron = `<span class="pd-chevron">${icon('chevron')}</span>`;
    const summary = (name, title) => `${icon(name)}<span>${h(title)}</span>${chevron}`;
    const boardRows = boards.map((board, index) => `<div class="pd-board ${board.archived ? 'arch' : ''}" ${index > 2 ? 'data-extra-board' : ''} ${index > 2 && !state?.allBoards ? 'hidden' : ''}>
      <a class="pd-board-main" href="${h(board.href)}" data-pd-focus="board-${h(board.id)}">
        <span class="pdb-crest" aria-hidden="true">${board.archived ? icon('scroll') : '🏕️'}</span>
        <span class="pdb-body"><b>${h(board.name)}</b><span>#${h(board.id)} · ${board.participants} ${w.members} · ${board.expenses} ${w.quests}</span></span>
        <span class="pdb-status">${h(copy.openBoard)} ${icon('arrow')}</span><span class="pdb-mobile-arrow">${icon('chevron')}</span>
      </a></div>`).join('');
    return `<div class="drawer-overlay">
      <div class="pd-owl-note" aria-hidden="true"><img src="/assets/auth-reference/owl-note.webp" alt=""><span>${h(w.note)}</span></div>
      <aside class="profile-drawer" role="dialog" aria-modal="true" aria-label="${h(w.title)}">
        <button class="pd-close" type="button" data-close data-pd-focus="close" aria-label="${h(w.close)}">${icon('close')}</button>
        <div class="pd-scroll">
          <section class="pd-hero" aria-label="${h(copy.profile)}">
            ${avatarHtml}
            <div class="pd-hero-info"><h2 class="pd-hero-name">${h(name)}</h2><div class="pd-rank">${h(rank)}</div>
              <div class="pd-identity">@${h(account.username)} · #${h(account.userId)}</div>
              <div class="pd-lvlrow"><span class="pd-lvl-k">Lv.</span><strong class="pd-lvl-n">${level.lvl}</strong><span class="pd-renown">${h(reputation)} ${h(copy.reputation || copy.renown)}</span></div>
              <div class="pd-bar" role="progressbar" aria-label="${h(copy.profileLvl)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(level.pct)}"><div style="width:${level.pct}%"></div></div>
              <a class="pd-fullprofile" href="${h(profileHref)}" data-pd-focus="profile">${h(copy.viewFullProfile)} ${icon('arrow')}</a>
            </div><span class="pd-pennant" aria-hidden="true">${icon('swords')}</span>
          </section>
          <details class="pd-achievements" data-drawer-section="trophies"${open('trophies', false)}>
            <summary data-pd-focus="trophies"><span class="pd-streak">${icon('flame')}<span><strong>${streak} <small>${h(copy.streakDays)}</small></strong><span>${h(copy.streakLab)} (${h(copy.bestStreak)} ${bestStreak})</span></span></span><span class="pd-awards">${icon('trophy')}<span><b>${w.awards}</b><span>${got} / ${trophyCount}</span></span>${chevron}</span></summary>
            <div class="trophy-grid">${trophyHtml}</div>
          </details>
          <details class="pd-section pd-board-section" data-drawer-section="boards"${open('boards', true)}>
            <summary data-pd-focus="boards">${icon('scroll')}<span>${h(copy.myBoards)}</span><span class="pd-count">${boards.length}</span>${chevron}</summary>
            <div class="pd-boards">${boardsLoading ? window.CoinQuestLoading.skeleton() : boardsError ? `<p role="alert">${language === 'en' ? 'Could not load your boards.' : 'โหลดบอร์ดไม่สำเร็จ'}</p><button type="button" class="pd-tool" data-retry-boards>${language === 'en' ? 'Try again' : 'ลองอีกครั้ง'}</button>` : boards.length ? boardRows : `<p class="pd-noboards">${h(copy.noBoards)}</p>`}</div>
            ${boards.length > 3 ? `<button type="button" class="pd-all-boards" data-all-boards data-pd-focus="all-boards" aria-expanded="${!!state?.allBoards}">${state?.allBoards ? w.less : w.all} ${icon('arrow')}</button>` : ''}
          </details>
          <details class="pd-section pd-settings" data-drawer-section="settings"${open('settings', !mobile)}>
            <summary data-pd-focus="settings">${summary('settings', copy.settings)}</summary>
            <div class="pd-setting"><span>${icon('sun')} ${w.theme}</span><div class="pd-segment" role="group" aria-label="${w.theme}">${['tavern', 'dungeon'].map(value => `<button type="button" data-theme-pick="${value}" data-pd-focus="theme-${value}" aria-label="${h(value === 'tavern' ? copy.themeLight : copy.themeDark)}" aria-pressed="${theme === value}">${icon(value === 'tavern' ? 'sun' : 'moon')}</button>`).join('')}</div></div>
            <div class="pd-setting"><span>${icon('globe')} ${w.language}</span><div class="pd-segment" role="group" aria-label="${w.language}">${['th', 'en'].map(value => `<button type="button" data-drawer-lang="${value}" data-pd-focus="lang-${value}" aria-label="${value === 'th' ? 'ไทย' : 'English'}" aria-pressed="${language === value}">${value.toUpperCase()}</button>`).join('')}</div></div>
          </details>
          <div class="pd-tour pd-setting"><span>${icon('compass')} ${w.tour}</span><button class="pd-tool" type="button" data-tour data-pd-focus="tour">${w.start} ${icon('arrow')}</button></div>
          <details class="pd-section pd-backup" data-drawer-section="backup"${open('backup', desktop)}>
            <summary data-pd-focus="backup">${summary('backup', copy.backup)}</summary>
            <div class="pdb-actions"><button class="pd-tool" type="button" data-export data-pd-focus="export">${icon('download')} Export</button><button class="pd-tool" type="button" data-import data-pd-focus="import">${icon('upload')} Restore</button><input type="file" accept="application/json,.json" hidden data-file></div><div class="pdb-msg" data-backup-msg role="status" hidden></div>
          </details>
          ${account.signedOut ? '' : `<details class="pd-section pd-recovery" data-drawer-section="recovery"${open('recovery', desktop)}>
            <summary data-pd-focus="recovery">${summary('lock', copy.recoveryPanelTitle)}</summary>
            <div class="pd-recovery-tools"><div class="pd-code-field"><span class="pd-recovery-code mono" data-recovery-code></span><button type="button" data-reveal-recovery data-pd-focus="reveal" aria-pressed="${!!state?.revealed}" aria-label="${state?.revealed ? w.conceal : w.reveal}">${icon(state?.revealed ? 'eye-off' : 'eye')}</button><button type="button" data-copy-recovery-side data-pd-focus="copy" aria-label="${w.copy}">${icon('copy')}</button></div><button class="pd-tool pd-regenerate" type="button" data-regenerate-recovery data-pd-focus="regenerate">${w.regenerate}</button></div>
            <p class="pd-recovery-help">${w.recovery}</p><div class="pdb-msg" data-recovery-msg role="status" hidden></div>
          </details><button class="pd-logout" type="button" data-sign-out data-pd-focus="logout">${icon('logout')} ${h(copy.signOut)}</button>`}
        </div>
      </aside></div>`;
  }
  function updateRecovery(root, code, language, missing, revealed = false) {
    const field = root.querySelector('[data-recovery-code]');
    if (!field) return;
    field.textContent = code ? (revealed ? code : `${code.slice(0, 4)}-••••-••••`) : missing;
    const button = root.querySelector('[data-reveal-recovery]');
    button.disabled = !code;
    button.setAttribute('aria-pressed', String(revealed));
    button.setAttribute('aria-label', words[language][revealed ? 'conceal' : 'reveal']);
    button.innerHTML = icon(revealed ? 'eye-off' : 'eye');
    root.querySelector('[data-copy-recovery-side]').disabled = !code;
  }
  function copyFeedback(root, language, success) {
    const message = root.querySelector('[data-recovery-msg]');
    if (!message) return;
    message.hidden = false;
    message.textContent = language === 'en'
      ? (success ? 'Recovery key copied.' : 'Could not copy. Reveal the code to select and copy it.')
      : (success ? 'คัดลอกรหัสกู้คืนแล้ว' : 'คัดลอกไม่สำเร็จ กรุณาแสดงรหัสและเลือกคัดลอกด้วยตนเอง');
  }
  function bind(root, { state, opener, language }) {
    root._drawerOpener = opener;
    const background = [...document.body.children].filter(el => el !== root).map(el => [el, el.inert]);
    background.forEach(([el]) => { el.inert = true; });
    document.body.classList.add('account-drawer-open');
    root.querySelector('[data-all-boards]')?.addEventListener('click', event => {
      const button = event.currentTarget, expanded = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(expanded));
      button.innerHTML = `${words[language][expanded ? 'less' : 'all']} ${icon('arrow')}`;
      root.querySelectorAll('[data-extra-board]').forEach(el => { el.hidden = !expanded; });
    });
    root.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...root.querySelectorAll('button:not(:disabled), a[href], summary, input:not([hidden])')].filter(el => el.checkVisibility() && !el.closest('details:not([open]) > :not(summary)'));
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    const focus = [...root.querySelectorAll('[data-pd-focus]')].find(el => el.dataset.pdFocus === state?.focus);
    (focus || root.querySelector('[data-close]')).focus({ preventScroll: true });
    root.querySelector('.pd-scroll').scrollTop = state?.scroll || 0;
    return () => {
      background.forEach(([el, inert]) => { el.inert = inert; });
      document.body.classList.remove('account-drawer-open');
      const target = opener?.isConnected && opener !== document.body ? opener : document.querySelector('[data-profile-hub="profile"]');
      target?.focus({ preventScroll: true });
    };
  }
  window.PointyProfileDrawer = { render, capture, bind, updateRecovery, copyFeedback };
})();
