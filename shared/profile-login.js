(function () {
  function h(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderRecoveryReset({ copy }) {
    return `<div class="login-wrap">
      <form class="login-card" data-recovery-form>
        <div class="login-crest" aria-hidden="true"><span>🔐</span></div>
        <h1 class="login-title">${h(copy.resetTitle)}</h1>
        <p class="login-sub">${h(copy.resetSub)}</p>
        <label class="login-field"><span>${h(copy.loginEmail)}</span><input type="text" autocomplete="username" data-recovery-username placeholder="${h(copy.loginEmailPlaceholder)}"></label>
        <label class="login-field"><span>${h(copy.recoveryCode)}</span><input type="text" autocomplete="one-time-code" data-recovery-code placeholder="XXXX-XXXX-XXXX"></label>
        <label class="login-field"><span>${h(copy.newPassword)}</span><input type="password" autocomplete="new-password" data-recovery-password placeholder="${h(copy.loginPasswordPlaceholder)}"></label>
        <div class="login-err" data-recovery-error hidden></div>
        <button type="submit" class="login-btn">🔑 ${h(copy.resetConfirm)}</button>
        <button type="button" class="btn-ghost sm" data-back-login style="width:100%;margin-top:10px">${h(copy.loginSignIn)}</button>
      </form>
    </div>`;
  }

  function renderLoginGate({ copy, langKey, theme, isSignup, real, local, demoAccounts }) {
    return `<div class="login-wrap">
      <div class="login-langs">
        <button class="login-theme" type="button" data-login-theme title="${theme === 'dungeon' ? 'Light' : 'Dark'}">${theme === 'dungeon' ? '☀️' : '🌙'}</button>
        <button type="button" class="${langKey === 'th' ? 'on' : ''}" data-login-lang="th">TH</button>
        <button type="button" class="${langKey === 'en' ? 'on' : ''}" data-login-lang="en">EN</button>
      </div>
      <form class="login-card" data-login-form>
        <div class="login-crest" aria-hidden="true"><span>🧰</span></div>
        <div class="login-tabs" role="tablist">
          <button type="button" class="${!isSignup ? 'on' : ''}" data-login-tab="in">${h(copy.loginSignIn)}</button>
          <button type="button" class="${isSignup ? 'on' : ''}" data-login-tab="up">${h(copy.loginSignUp)}</button>
        </div>
        <h1 class="login-title">${h(isSignup ? copy.signupWelcome : copy.loginWelcome)}</h1>
        <p class="login-sub">${h(isSignup ? copy.signupSub : copy.loginSub)}</p>
        ${isSignup ? `<label class="login-field">
          <span>${h(copy.signupName)}</span>
          <input type="text" autocomplete="name" data-login-name placeholder="${h(copy.signupNamePlaceholder)}">
        </label>` : ''}
        <label class="login-field">
          <span>${h(copy.loginEmail)}</span>
          <input type="text" autocomplete="username" data-login-email placeholder="${h(copy.loginEmailPlaceholder)}">
        </label>
        <label class="login-field">
          <span>${h(copy.loginPassword)}</span>
          <input type="password" autocomplete="${isSignup ? 'new-password' : 'current-password'}" data-login-password placeholder="${h(copy.loginPasswordPlaceholder)}">
        </label>
        ${isSignup ? `<label class="login-field">
          <span>${h(copy.signupConfirm)}</span>
          <input type="password" autocomplete="new-password" data-login-password2 placeholder="${h(copy.loginPasswordPlaceholder)}">
        </label>` : ''}
        <div class="login-err" data-login-error hidden></div>
        <button type="submit" class="login-btn">${isSignup ? '✨ ' + h(copy.signupCreate) : '⚔️ ' + h(copy.loginEnter)}</button>
        ${!isSignup && local ? `<div class="login-demo">
          <div class="login-demo-h">${h(copy.loginDemo)}</div>
          <div class="login-demo-list">
            ${demoAccounts.map(account => `<button type="button" class="login-demo-acct" data-demo-email="${h(account.login)}" data-demo-password="${h(account.password)}">
              <b>${h(account.name)}</b><span>@${h(account.login)}</span><i>${h(account.classText)} · ID ${h(account.userId)}</i>
            </button>`).join('')}
          </div>
        </div>` : ''}
        ${!isSignup && real ? `<button type="button" class="btn-ghost sm" data-forgot-password style="width:100%;margin-top:10px">${h(copy.forgotPassword)}</button>` : ''}
        <div class="login-note">🔒 ${h(local ? copy.loginNote : copy.loginNoteReal)}</div>
      </form>
    </div>`;
  }

  window.PointyProfileLogin = {
    renderRecoveryReset,
    renderLoginGate
  };
})();
