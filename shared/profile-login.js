(function () {
  function h(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const icon = name => window.CoinQuestIcons(name);
  function field({ label, attr, placeholder, autocomplete, password = false, max, copy }) {
    const id = `auth-${attr}`;
    return `<div class="login-field">
      <label for="${id}">${h(label)}</label>
      <div class="auth-input">
        ${icon(password ? 'lock' : attr.includes('code') ? 'shield' : 'profile')}
        <input id="${id}" type="${password ? 'password' : 'text'}" ${max ? `maxlength="${max}"` : ''} autocomplete="${autocomplete}" ${!password ? 'autocapitalize="none" spellcheck="false"' : ''} data-${attr} placeholder="${h(placeholder)}">
        ${password ? `<button type="button" class="auth-reveal" data-auth-reveal="${id}" aria-controls="${id}" aria-label="${h(copy.showPassword)}" aria-pressed="false">${icon('eye-off')}</button>` : ''}
      </div>
    </div>`;
  }
  function renderFrame({ copy, langKey, theme, content, mode }) {
    return `<div class="login-wrap auth-entry auth-${mode}" lang="${langKey}" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <picture class="auth-scene"><source media="(max-width: 600px)" srcset="/assets/auth-reference/tavern-mobile.webp"><img src="/assets/auth-reference/tavern.webp" alt="" fetchpriority="high"></picture>
      <div class="auth-brand"><img class="auth-banner" src="/assets/auth-reference/guild-banner.webp" alt="Coin Quest Ledger"><div class="auth-compact-brand">${icon('compass')}<span>Coin Quest<br> Ledger</span></div><p>Every Quest Counts</p></div>
      <div class="login-langs" role="group" aria-label="${h(copy.authPreferences)}">
        <button class="login-theme" type="button" data-login-theme aria-label="${h(theme === 'dungeon' ? copy.authLight : copy.authDark)}">${icon(theme === 'dungeon' ? 'moon' : 'sun')}</button>
        <button type="button" class="${langKey === 'th' ? 'on' : ''}" data-login-lang="th" aria-pressed="${langKey === 'th'}">TH</button>
        <button type="button" class="${langKey === 'en' ? 'on' : ''}" data-login-lang="en" aria-pressed="${langKey === 'en'}">EN</button>
      </div>
      ${content}
    </div>`;
  }
  function shell({ copy, langKey, theme, content, mode }) {
    return renderFrame({ copy, langKey, theme, mode, content: `<div class="auth-main">${content}
        <footer class="auth-reassurance"><div class="auth-divider">${icon('shield')}</div><p>${h(copy.authReassurance)}</p><small>Coin Quest Ledger · ${h(copy.authModules)}</small></footer>
      </div>
      <aside class="auth-owl"><img src="/assets/auth-reference/owl-note.webp" alt=""><p>${h(copy.authEncouragement)}</p></aside>
    ` });
  }
  let focusObserver;
  function bindControls(root, copy) {
    const entry = root.querySelector('.auth-entry');
    const title = entry.querySelector('#auth-title');
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
    // Fonts and artwork can finish after focus, changing the short-screen layout.
    // Observe that layout as well as focus so a field cannot slip below the gate.
    focusObserver?.disconnect();
    const keepControlVisible = () => {
      if (!entry.isConnected) { focusObserver?.disconnect(); return; }
      const control = document.activeElement;
      if (!entry.contains(control) || !control.matches('input, button')) return;
      requestAnimationFrame(() => {
        if (control.isConnected && document.activeElement === control) {
          control.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      });
    };
    entry.addEventListener('focusin', keepControlVisible);
    focusObserver = new ResizeObserver(keepControlVisible);
    focusObserver.observe(entry);
    focusObserver.observe(entry.querySelector('.login-card'));
    entry.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...entry.querySelectorAll('button:not(:disabled), input:not(:disabled)')].filter(el => el.tabIndex >= 0 && el.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === title)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === title)) { event.preventDefault(); first.focus(); }
    });
    root.querySelectorAll('[data-auth-reveal]').forEach(button => button.addEventListener('click', () => {
      const input = root.querySelector(`#${button.dataset.authReveal}`);
      const reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(reveal));
      button.setAttribute('aria-label', reveal ? copy.hidePassword : copy.showPassword);
      button.innerHTML = icon(reveal ? 'eye' : 'eye-off');
    }));
  }

  function renderRecoveryReset({ copy, langKey, theme }) {
    return shell({ copy, langKey, theme, mode: 'recovery', content: `
      <form class="login-card" data-recovery-form aria-labelledby="auth-title" novalidate>
        <div class="login-crest" aria-hidden="true"><span>🔐</span></div>
        <h1 class="login-title" id="auth-title">${h(copy.resetTitle)}</h1>
        <p class="login-sub">${h(copy.resetSub)}</p>
        ${field({ label: copy.loginEmail, attr: 'recovery-username', max: 32, autocomplete: 'username', placeholder: copy.loginEmailPlaceholder, copy })}
        ${field({ label: copy.recoveryCode, attr: 'recovery-code', autocomplete: 'one-time-code', placeholder: 'XXXX-XXXX-XXXX', copy })}
        ${field({ label: copy.newPassword, attr: 'recovery-password', password: true, autocomplete: 'new-password', placeholder: copy.newPasswordPlaceholder, copy })}
        ${field({ label: copy.signupConfirm, attr: 'recovery-confirm', password: true, autocomplete: 'new-password', placeholder: copy.signupConfirmPasswordPlaceholder, copy })}
        <div class="login-err" data-recovery-error role="alert" tabindex="-1" hidden></div>
        <button type="submit" class="login-btn">🔑 ${h(copy.resetConfirm)}</button>
        <button type="button" class="auth-secondary" data-back-login>${h(copy.loginSignIn)}</button>
      </form>
    ` });
  }

  function renderLoginGate({ copy, langKey, theme, isSignup, real, local, demoAccounts }) {
    return shell({ copy, langKey, theme, mode: isSignup ? 'signup' : 'signin', content: `
      <form class="login-card" data-login-form aria-labelledby="auth-title" novalidate>
        <div class="login-crest" aria-hidden="true">${icon('toolbox')}</div>
        <div class="login-tabs" role="tablist" aria-label="${h(copy.authTabs)}">
          <button id="auth-tab-in" role="tab" aria-selected="${!isSignup}" aria-controls="auth-fields" tabindex="${isSignup ? '-1' : '0'}" type="button" class="${!isSignup ? 'on' : ''}" data-login-tab="in">${h(copy.loginSignIn)}</button>
          <button id="auth-tab-up" role="tab" aria-selected="${isSignup}" aria-controls="auth-fields" tabindex="${isSignup ? '0' : '-1'}" type="button" class="${isSignup ? 'on' : ''}" data-login-tab="up">${h(copy.loginSignUp)}</button>
        </div>
        <div role="tabpanel" id="auth-fields" aria-labelledby="auth-tab-${isSignup ? 'up' : 'in'}">
        <h1 class="login-title" id="auth-title">${h(isSignup ? copy.signupWelcome : copy.loginWelcome)}</h1>
        <p class="login-sub">${h(isSignup ? copy.signupSub : copy.loginSub)}</p>
        ${isSignup ? field({ label: copy.signupName, attr: 'login-name', max: 60, autocomplete: 'nickname', placeholder: copy.signupNamePlaceholder, copy }) : ''}
        ${field({ label: copy.loginEmail, attr: 'login-email', max: 32, autocomplete: 'username', placeholder: copy.loginEmailPlaceholder, copy })}
        ${field({ label: copy.loginPassword, attr: 'login-password', password: true, autocomplete: isSignup ? 'new-password' : 'current-password', placeholder: isSignup ? copy.signupPasswordPlaceholder : copy.loginPasswordPlaceholder, copy })}
        ${isSignup ? field({ label: copy.signupConfirm, attr: 'login-password2', password: true, autocomplete: 'new-password', placeholder: copy.signupConfirmPasswordPlaceholder, copy }) : ''}
        ${isSignup ? `<p class="auth-password-hint">${h(copy.signupPasswordShort)}</p>` : ''}
        <div class="login-err" data-login-error role="alert" tabindex="-1" hidden></div>
        <button type="submit" class="login-btn">${isSignup ? '✨ ' + h(copy.signupCreate) : '⚔️ ' + h(copy.loginEnter)}</button>
        ${!isSignup && real ? `<button type="button" class="auth-secondary" data-forgot-password>${h(copy.forgotPassword)}</button>` : ''}
        </div>
        ${!isSignup && local ? `<div class="login-demo">
          <div class="login-demo-h">${h(copy.loginDemo)}</div>
          <div class="login-demo-list">
            ${demoAccounts.map(account => `<button type="button" class="login-demo-acct" data-demo-email="${h(account.login)}" data-demo-password="${h(account.password)}">
              <b>${h(account.name)}</b><span>@${h(account.login)}</span><i>${h(account.classText)} · ID ${h(account.userId)}</i>
            </button>`).join('')}
          </div>
        </div>` : ''}
        ${local ? `<div class="login-note">${h(copy.loginNote)}</div>` : ''}
      </form>
    ` });
  }

  window.PointyProfileLogin = {
    renderFrame,
    bindControls,
    renderRecoveryReset,
    renderLoginGate
  };
})();
