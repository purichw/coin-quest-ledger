(function () {
  const params = new URLSearchParams(window.location.search || '');
  const overlay = document.querySelector('[data-first-load]');
  if (!overlay) return;

  if (params.get('test') === '1') {
    document.documentElement.classList.remove('first-load-boot');
    overlay.remove();
    return;
  }

  const sessionKey = 'coinQuestFirstLoadSeen';
  const firstInSession = (() => {
    try {
      return window.sessionStorage.getItem(sessionKey) !== '1';
    } catch (_) {
      return true;
    }
  })();

  try {
    if (firstInSession) window.sessionStorage.setItem(sessionKey, '1');
  } catch (_) {}

  const started = performance.now();
  const firstMinimumMs = 2000;
  const laterRevealDelayMs = 500;
  let active = false;
  let hidden = false;
  let percentFrame = null;
  let revealTimer = null;

  if (!overlay.querySelector('.first-load-emblem')) {
    overlay.innerHTML = [
      '<div class="first-load-box">',
      '  <div class="first-load-emblem" aria-hidden="true">',
      '    <span class="first-load-torch left"></span>',
      '    <span class="first-load-eye"><span class="first-load-pupil"></span></span>',
      '    <span class="first-load-torch right"></span>',
      '  </div>',
      '  <div class="first-load-title">COIN QUEST</div>',
      '  <div class="first-load-track"><div class="first-load-fill"></div></div>',
      '  <div class="first-load-meta"><span>Lighting the torches...</span><span class="first-load-percent" data-first-load-percent>0%</span></div>',
      '</div>'
    ].join('');
  }

  const pct = overlay.querySelector('[data-first-load-percent]');

  function updatePercent(final) {
    if (!pct) return;
    if (final) {
      pct.textContent = '100%';
      return;
    }
    const elapsed = performance.now() - started;
    const target = firstInSession ? firstMinimumMs : Math.max(laterRevealDelayMs, elapsed + 350);
    const raw = Math.min(99, Math.round((elapsed / target) * 100));
    pct.textContent = raw + '%';
    percentFrame = window.requestAnimationFrame(() => updatePercent(false));
  }

  function activate() {
    if (hidden || active) return;
    active = true;
    overlay.classList.add('is-active');
    updatePercent(false);
  }

  function removeQuietly() {
    hidden = true;
    if (revealTimer) window.clearTimeout(revealTimer);
    if (percentFrame) window.cancelAnimationFrame(percentFrame);
    document.documentElement.classList.remove('first-load-boot');
    overlay.remove();
  }

  function hide() {
    if (hidden) return;
    hidden = true;
    if (revealTimer) window.clearTimeout(revealTimer);
    if (percentFrame) window.cancelAnimationFrame(percentFrame);
    updatePercent(true);
    document.documentElement.classList.remove('first-load-boot');
    overlay.classList.add('is-hidden');
    window.setTimeout(() => overlay.remove(), 460);
  }

  function waitForPageAssets() {
    const pageLoaded = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise(resolve => window.addEventListener('load', resolve, { once: true }));

    return pageLoaded.then(() => {
      const images = Array.from(document.images)
        .filter(img => img && !img.complete && !String(img.currentSrc || img.src || '').startsWith('data:'))
        .slice(0, 24);
      if (!images.length) return;
      return Promise.allSettled(images.map(img => new Promise(resolve => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      })));
    });
  }

  if (firstInSession) {
    activate();
  } else {
    revealTimer = window.setTimeout(activate, laterRevealDelayMs);
  }

  waitForPageAssets().then(() => {
    const elapsed = performance.now() - started;
    if (!firstInSession && !active && elapsed < laterRevealDelayMs) {
      removeQuietly();
      return;
    }

    if (firstInSession) {
      const remaining = Math.max(0, firstMinimumMs - elapsed);
      window.setTimeout(hide, remaining);
      return;
    }

    if (!active) {
      removeQuietly();
      return;
    }
    hide();
  });
})();
