(function () {
  function h(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function render({ reminders, copy }) {
    const items = reminders.length ? reminders.map(r => `
      <button class="rem-item k-${h(r.kind)}" type="button" data-href="${h(r.href)}">
        <span class="ri-ic">${h(r.icon)}</span>
        <span class="ri-body"><span class="ri-title">${h(r.title || '')}</span><span class="ri-sub${r.kind === 'overdue' ? ' urgent' : ''}">${h(r.sub || '')}</span></span>
        <span class="ri-go">${h(copy.remJump)} →</span>
      </button>
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
