(function () {
  function h(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function recoveryBlock({ signedOut, recoveryCode, copy }) {
    if (signedOut) return '';
    return `<div class="pd-recovery">
      <div class="pdb-h">🔐 ${h(copy.recoveryPanelTitle)}</div>
      <div class="pdb-sub">${h(copy.recoveryPanelSub)}</div>
      <div class="pd-recovery-code mono" data-recovery-code>${h(recoveryCode || copy.recoveryMissing)}</div>
      <div class="pdb-actions">
        <button class="btn-ghost sm" type="button" data-copy-recovery-side ${recoveryCode ? '' : 'disabled'}>📋 ${h(copy.copyRecovery)}</button>
        <button class="btn-ghost sm" type="button" data-regenerate-recovery>↻ ${h(copy.regenerateRecovery)}</button>
      </div>
      <div class="pdb-msg" data-recovery-msg hidden></div>
    </div>`;
  }

  function accountBlock({ signedOut, avatarHtml, name, username, userId, copy }) {
    return `<div class="pd-account">
      <div class="pda-row">
        ${avatarHtml}
        <span class="pda-info">
          <b>${h(name || 'Hero')}</b>
          <span class="pda-email">@${h(username || 'username')}</span>
          <span class="pda-uid">${h(copy.userId)} · ${h(userId || '0000')}</span>
        </span>
      </div>
      ${signedOut ? '' : `<button class="btn-ghost sm pda-logout" type="button" data-sign-out>🚪 ${h(copy.signOut)}</button>`}
    </div>`;
  }

  window.PointyProfileDrawer = {
    recoveryBlock,
    accountBlock
  };
})();
