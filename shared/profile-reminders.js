(function () {
  function h(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function render({ reminders, copy }) {
    const items = reminders.length ? reminders.map(r => `
      <${r.actions ? 'div' : 'button'} class="rem-item k-${h(r.kind)}" ${r.actions ? '' : 'type="button"'} ${r.href ? `data-href="${h(r.href)}"` : ''}>
        <span class="ri-ic">${h(r.icon)}</span>
        <span class="ri-body"><span class="ri-title">${h(r.title || '')}</span><span class="ri-sub${r.kind === 'overdue' ? ' urgent' : ''}">${h(r.sub || '')}</span>${r.actions ? `<span class="ri-actions">${r.actions.map(action => `<button class="ri-action ${action.primary ? 'primary' : ''} ${action.danger ? 'danger' : ''}" type="button" data-rem-action="${h(action.action)}" data-invite-id="${h(r.inviteId || '')}">${h(action.label)}</button>`).join('')}</span>` : ''}</span>
        ${r.actions ? '' : `<span class="ri-go">${h(copy.remJump)} →</span>`}
      </${r.actions ? 'div' : 'button'}>
    `).join('') : `<div class="rem-empty">${h(copy.noReminders)}</div>`;
    return `<div class="rem-overlay"><div class="rem-panel">
      <div class="rem-head"><span class="rem-title">🔔 ${h(copy.reminders)}</span><button class="picker-close sm" type="button" data-close>✕</button></div>
      <div class="rem-list">${items}</div>
    </div></div>`;
  }

  window.PointyProfileReminders = {
    render
  };
})();
