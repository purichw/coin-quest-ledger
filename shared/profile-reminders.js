(function () {
  const words = {
    th: { all: 'ทั้งหมด', invite: 'คำเชิญปาร์ตี้', finance: 'การเงิน', mark: 'ทำทั้งหมดว่าอ่านแล้ว', marked: 'ทำเครื่องหมายว่าอ่านแล้ว', close: 'ปิดการแจ้งเตือน', details: 'ดูรายละเอียด', more: 'ดูการแจ้งเตือนทั้งหมด', less: 'กลับไปรายการล่าสุด', loading: 'กำลังโหลดคำเชิญ…', failed: 'โหลดคำเชิญไม่สำเร็จ ลองอีกครั้งได้เลย', retry: 'ลองอีกครั้ง', empty: 'ยังไม่มีการแจ้งเตือน', emptyInvite: 'ยังไม่มีคำเชิญปาร์ตี้', emptyFinance: 'ยังไม่มีรายการการเงินที่ต้องจัดการ', unread: 'ยังไม่อ่าน', working: 'กำลังบันทึก…', count: 'จำนวนรายการที่ยังไม่อ่าน', unknown: 'ผู้ชวน', actionFailed: 'ทำรายการไม่สำเร็จ ลองอีกครั้งได้เลย' },
    en: { all: 'All', invite: 'Party invites', finance: 'Finance', mark: 'Mark all as read', marked: 'Marked all as read', close: 'Close reminders', details: 'View details', more: 'View all reminders', less: 'Back to recent reminders', loading: 'Loading invitations…', failed: 'Could not load invitations. Please try again.', retry: 'Try again', empty: 'No reminders yet', emptyInvite: 'No party invitations yet', emptyFinance: 'No financial reminders to take care of', unread: 'Unread', working: 'Saving…', count: 'Unread reminders', unknown: 'Inviter', actionFailed: 'Could not complete this action. Please try again.' }
  };
  const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = name => window.CoinQuestIcons(name);
  const category = item => item.kind === 'invite' ? 'invite' : 'finance';

  function row(item, state, w) {
    const busy = state.busy.has(item.inviteId), isInvite = category(item) === 'invite';
    const portrait = isInvite ? `<span class="ri-avatar">${item.avatar || h((item.from || w.unknown).slice(0, 1))}</span>` : '';
    return `<article class="rem-item k-${h(item.kind)}${item.read ? ' is-read' : ''}" data-rem-id="${h(item.id)}" ${busy ? 'aria-busy="true"' : ''}>
      <div class="ri-identity"><span class="ri-ic ri-${h(item.symbol)}">${icon(item.symbol)}</span>${portrait}</div>
      <div class="ri-body"><h3 class="ri-title">${h(item.title)}${item.read ? '' : `<span class="ri-unread"><span class="rem-sr">${w.unread}</span></span>`}</h3>
        ${item.detail ? `<p class="ri-detail">${h(item.detail)}</p>` : ''}
        <p class="ri-sub${item.kind === 'overdue' ? ' urgent' : ''}">${item.amount ? `<strong class="ri-amount ${h(item.amountTone || '')}">${h(item.amount)}</strong><span aria-hidden="true"> · </span>` : ''}${h(item.sub)}</p>
      </div>
      <div class="ri-actions">${isInvite ? item.actions.map(action => `<button class="ri-action ${action.primary ? 'primary' : 'danger'}" type="button" data-rem-action="${h(action.action)}" data-invite-id="${h(item.inviteId)}" data-rem-focus="${h(item.id + action.action)}" ${busy ? 'disabled' : ''}>${h(action.label)}</button>`).join('') : `<button class="ri-action ri-details" type="button" data-rem-open="${h(item.id)}" data-rem-focus="${h(item.id)}" aria-label="${w.details}: ${h(item.detail || item.title)}">${w.details}${icon('arrow')}</button>`}</div>
      ${busy ? `<span class="ri-busy" role="status">${w.working}</span>` : ''}
    </article>`;
  }
  function content(data, state) {
    const w = words[data.language] || words.th;
    const items = data.reminders.filter(item => state.filter === 'all' || category(item) === state.filter);
    const shown = state.expanded ? items : items.slice(0, 4);
    const count = filter => data.reminders.filter(item => !item.read && (filter === 'all' || category(item) === filter)).length;
    return `<header class="rem-head"><h2 class="rem-title" id="rem-title">${icon('bell')}Reminders</h2>
      <button class="rem-mark" type="button" data-rem-mark data-rem-focus="mark" ${!count('all') ? 'disabled' : ''}>${w.mark}</button>
      <button class="rem-close" type="button" data-close data-rem-focus="close" aria-label="${w.close}">${icon('close')}</button></header>
      <div class="rem-tabs" role="tablist" aria-label="${w.count}">${['all', 'invite', 'finance'].map(filter => `<button role="tab" type="button" id="rem-tab-${filter}" aria-controls="rem-results" aria-selected="${state.filter === filter}" tabindex="${state.filter === filter ? '0' : '-1'}" data-rem-filter="${filter}" data-rem-focus="${filter}">${w[filter]} <span>(${count(filter)})</span></button>`).join('')}</div>
      <div class="rem-feedback${state.message?.error ? ' is-error' : ''}" role="${state.message?.error ? 'alert' : 'status'}" ${state.message ? '' : 'hidden'}>${h(state.message?.text || '')}</div>
      <section class="rem-scroll" id="rem-results" role="tabpanel" aria-labelledby="rem-tab-${state.filter}" tabindex="0" data-rem-focus="results">
        ${data.loading ? `<div class="rem-load" role="status"><span class="rem-spinner" aria-hidden="true"></span>${w.loading}</div>` : ''}
        ${data.error ? `<div class="rem-error" role="alert">${icon('warning')}<span>${w.failed}</span><button type="button" data-rem-retry data-rem-focus="retry">${w.retry}</button></div>` : ''}
        <div class="rem-list">${shown.length ? shown.map(item => row(item, state, w)).join('') : !data.loading && (!data.error || state.filter === 'finance') ? `<div class="rem-empty">${icon(state.filter === 'invite' ? 'split' : 'bell')}<p>${w[state.filter === 'invite' ? 'emptyInvite' : state.filter === 'finance' ? 'emptyFinance' : 'empty']}</p></div>` : ''}</div>
      </section>
      <footer class="rem-foot" ${items.length ? '' : 'hidden'}><button type="button" data-rem-all data-rem-focus="more" aria-expanded="${state.expanded}">${w[state.expanded ? 'less' : 'more']}${icon('arrow')}</button></footer>`;
  }
  function render(data) {
    return `<div class="rem-overlay"><div class="rem-panel" role="dialog" aria-modal="true" aria-labelledby="rem-title">${content(data, { filter: 'all', expanded: false, busy: new Set() })}</div></div>`;
  }
  function update(root, data) {
    root._remData = data;
    const state = root._remState;
    const focus = root.contains(document.activeElement) ? document.activeElement.dataset.remFocus : null;
    const scroll = root.querySelector('.rem-scroll')?.scrollTop || 0;
    root.querySelector('.rem-panel').innerHTML = content(data, state);
    root.querySelector('.rem-scroll').scrollTop = scroll;
    if (focus) {
      const target = [...root.querySelectorAll('[data-rem-focus]')].find(el => el.dataset.remFocus === focus && !el.disabled);
      (target || root.querySelector('[aria-selected="true"]')).focus({ preventScroll: true });
    }
  }
  function bind(root, data, { opener, anchor = opener, onClose, onAction, onRead, onRetry, onOpen }) {
    root._remState = { filter: 'all', expanded: false, busy: new Set(), message: null };
    root._remData = data;
    const state = root._remState;
    const background = [...document.body.children].filter(el => el !== root).map(el => [el, el.inert]);
    background.forEach(([el]) => { el.inert = true; });
    document.body.classList.add('reminders-open');
    const redraw = () => { if (root.isConnected) update(root, root._remData); };
    const position = () => {
      const box = anchor?.getBoundingClientRect();
      if (!box) return;
      root.style.setProperty('--rem-left', `${Math.max(16, Math.min(innerWidth - 496, box.right - 400))}px`);
      root.style.setProperty('--rem-top', `${Math.max(12, Math.min(box.bottom + 12, innerHeight - 220))}px`);
    };
    position(); window.addEventListener('resize', position);
    root.addEventListener('click', async event => {
      const button = event.target.closest('button');
      if (event.target === root || button?.hasAttribute('data-close')) { onClose(); return; }
      if (!button || button.disabled) return;
      if (button.dataset.remFilter) {
        state.filter = button.dataset.remFilter; state.expanded = false; state.message = null;
        redraw(); root.querySelector('.rem-scroll').scrollTop = 0;
      } else if (button.hasAttribute('data-rem-all')) {
        state.expanded = !state.expanded; redraw(); root.querySelector('.rem-scroll').scrollTop = 0;
      } else if (button.hasAttribute('data-rem-mark')) {
        onRead(root._remData.reminders); state.message = { text: words[root._remData.language].marked }; redraw();
      } else if (button.hasAttribute('data-rem-retry')) {
        onRetry();
      } else if (button.dataset.remOpen) {
        const item = root._remData.reminders.find(r => r.id === button.dataset.remOpen);
        if (item) { onRead([item]); onOpen(item.href); }
      } else if (button.dataset.remAction) {
        const id = button.dataset.inviteId;
        if (state.busy.has(id)) return;
        state.busy.add(id); state.message = null; redraw();
        try {
          const result = await onAction(button.dataset.remAction, id);
          if (result) state.message = { text: result.error || result.message, error: !!result.error };
        } catch (_) { state.message = { text: words[root._remData.language].actionFailed, error: true }; }
        finally { state.busy.delete(id); redraw(); }
      }
    });
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); return; }
      if (event.target.matches('[role="tab"]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); const tabs = [...root.querySelectorAll('[role="tab"]')], current = tabs.indexOf(event.target);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (current + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
        tabs[next].focus(); tabs[next].click(); return;
      }
      if (event.key !== 'Tab') return;
      const controls = [...root.querySelectorAll('button:not(:disabled), [tabindex="0"]')].filter(el => el.tabIndex >= 0 && el.checkVisibility());
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    root.querySelector('[data-close]').focus({ preventScroll: true });
    return () => {
      window.removeEventListener('resize', position);
      background.forEach(([el, inert]) => { el.inert = inert; });
      document.body.classList.remove('reminders-open');
      (opener?.isConnected ? opener : anchor)?.focus({ preventScroll: true });
    };
  }
  window.PointyProfileReminders = { render, bind, update };
})();
