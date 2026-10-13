(function () {
  const overlay = document.querySelector('[data-first-load]');
  if (!overlay) return;
  const root = document.documentElement;
  if (new URLSearchParams(window.location.search || '').get('test') === '1') {
    root.classList.remove('first-load-boot');
    overlay.remove();
    return;
  }

  // This is page preparation, not Firebase/account or upload progress.
  const sessionKey = 'coinQuestFirstLoadSeen';
  let firstInSession = true;
  let english = root.lang === 'en';
  try {
    firstInSession = sessionStorage.getItem(sessionKey) !== '1';
    sessionStorage.setItem(sessionKey, '1');
    english = (localStorage.getItem('lang') || root.lang) === 'en';
  } catch (_) {}
  const copy = english ? {
    label: 'Preparing your adventure',
    stages: ['Beginning the quest…', 'Lighting the torches…', 'Preparing your adventure…', 'Almost there…', 'Welcome, Adventurer'],
    slow: 'Taking a little longer…',
    continue: 'Continue to the page',
    tip: 'A little wisdom for the journey',
    prev: 'Previous tip', next: 'Next tip',
    tips: ['Small expenses tell a bigger story. Give each one a place in your ledger.', 'Settle a shared expense while the memory is fresh.', 'Before buying, compare the price for the same quantity.']
  } : {
    label: 'เตรียมพร้อมออกผจญภัย',
    stages: ['เริ่มต้นการเดินทาง…', 'จุดคบเพลิง…', 'เตรียมพร้อมออกผจญภัย…', 'ใกล้พร้อมแล้ว…', 'ยินดีต้อนรับ นักผจญภัย'],
    slow: 'ใช้เวลาอีกสักครู่…',
    continue: 'เข้าสู่หน้าเว็บ',
    tip: 'เกร็ดการเงินวันนี้',
    prev: 'เกร็ดก่อนหน้า', next: 'เกร็ดถัดไป',
    tips: ['บันทึกรายจ่ายเล็ก ๆ ก็ช่วยให้เห็นภาพใหญ่ได้ชัดขึ้น', 'แบ่งค่าใช้จ่ายหลังจบทริป จะได้ไม่ลืมว่าใครจ่ายอะไร', 'เทียบราคาในปริมาณเท่ากัน ก่อนเลือกของที่คุ้มค่า']
  };
  const feather = '<svg viewBox="0 0 32 40" fill="none" aria-hidden="true"><path d="M27 2C10 3 4 13 7 26c8 3 17-6 20-24Z" fill="currentColor" opacity=".75"/><path d="M3 38 23 8M8 29l11-4M12 21l-2-8M16 16l7-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  const chevron = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', copy.label);
  overlay.setAttribute('lang', english ? 'en' : 'th');
  overlay.tabIndex = -1;
  // One shared owner for all five entry points. No duplicated page-specific markup.
  overlay.innerHTML = [
    '<img class="first-load-scene" src="/assets/loading-reference/night-quest.webp" alt="" fetchpriority="low">',
    '<div class="first-load-box">',
    ' <div class="first-load-emblem" aria-hidden="true"><span class="first-load-torch left"></span><span class="first-load-eye"><span class="first-load-pupil"></span></span><span class="first-load-torch right"></span></div>',
    ' <div class="first-load-title">COIN QUEST</div>',
    ' <div class="first-load-progress" role="progressbar" aria-label="' + copy.label + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">',
    '  <div class="first-load-track"><div class="first-load-fill"></div></div>',
    '  <div class="first-load-meta"><span data-first-load-status>' + copy.stages[0] + '</span><span class="first-load-percent" data-first-load-percent>0%</span></div>',
    ' </div>',
    ' <span class="first-load-announcement" role="status" aria-live="polite" aria-atomic="true">' + copy.stages[0] + '</span>',
    ' <button class="first-load-continue" type="button" hidden>' + copy.continue + '</button>',
    '</div>',
    '<div class="first-load-quote">' + feather + '<p><span class="first-load-quote-desktop">Small steps today,<br>greater adventures tomorrow.</span><span class="first-load-quote-tablet">Same money.<br>A more epic journey.</span><span class="first-load-quote-mobile">Good habits<br>level up your future.</span></p></div>',
    '<aside class="first-load-tip" aria-label="' + copy.tip + '"><button type="button" data-tip-direction="-1" aria-label="' + copy.prev + '">' + chevron + '</button><div><strong>' + copy.tip + '</strong><p data-first-load-tip aria-live="polite">' + copy.tips[0] + '</p></div><button type="button" data-tip-direction="1" aria-label="' + copy.next + '">' + chevron + '</button></aside>'
  ].join('');

  const started = performance.now();
  const firstMinimumMs = 2000;
  const laterRevealDelayMs = 500;
  const status = overlay.querySelector('[data-first-load-status]');
  const percent = overlay.querySelector('[data-first-load-percent]');
  const progress = overlay.querySelector('[role="progressbar"]');
  const announcement = overlay.querySelector('[role="status"]');
  const continueButton = overlay.querySelector('.first-load-continue');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const listeners = new AbortController();
  let active = false;
  let hidden = false;
  let completed = false;
  let value = 0;
  let stage = -1;
  let tip = 0;
  let revealTimer;
  let slowTimer;
  let finishTimer;
  let previousFocus;

  function setProgress(next) {
    if (hidden) return;
    value = Math.max(value, next);
    progress.setAttribute('aria-valuenow', String(value));
    overlay.style.setProperty('--first-load-progress', value + '%');
    percent.textContent = value + '%';
    const nextStage = value === 100 ? 4 : value >= 90 ? 3 : value >= 50 ? 2 : value >= 25 ? 1 : 0;
    if (stage !== nextStage) {
      stage = nextStage;
      status.textContent = copy.stages[stage];
      announcement.textContent = copy.stages[stage];
    }
  }

  function visibleButtons() {
    return Array.from(overlay.querySelectorAll('button')).filter(button => !button.hidden && button.getClientRects().length);
  }

  function keepFocus(event) {
    if (active && !hidden && !overlay.contains(event.target)) overlay.focus({ preventScroll: true });
  }

  function activate() {
    if (hidden || active) return;
    active = true;
    previousFocus = document.activeElement;
    overlay.classList.add('is-active');
    root.classList.add('first-load-open');
    overlay.focus({ preventScroll: true });
    document.addEventListener('focusin', keepFocus, { signal: listeners.signal });
    overlay.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const buttons = visibleButtons();
      const current = buttons.indexOf(document.activeElement);
      event.preventDefault();
      if (!buttons.length) overlay.focus({ preventScroll: true });
      else {
        const next = current < 0 ? (event.shiftKey ? buttons.length - 1 : 0) : (current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
        buttons[next].focus({ preventScroll: true });
      }
    }, { signal: listeners.signal });
  }

  function hide(quietly) {
    if (hidden) return;
    hidden = true;
    window.clearTimeout(revealTimer);
    window.clearTimeout(slowTimer);
    window.clearTimeout(finishTimer);
    listeners.abort();
    root.classList.remove('first-load-boot', 'first-load-open');
    const focusWasInside = overlay.contains(document.activeElement);
    overlay.classList.add('is-hidden');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.inert = true;
    if (focusWasInside) {
      // A login/tour dialog may have appeared while page assets were loading.
      const dialog = Array.from(document.querySelectorAll('[role="dialog"]')).find(el => el !== overlay && !el.inert && el.getClientRects().length);
      const headingId = dialog?.getAttribute('aria-labelledby')?.split(/\s+/)[0];
      const heading = headingId ? document.getElementById(headingId) : dialog?.querySelector('h1[tabindex], h2[tabindex], [role="heading"][tabindex]');
      const target = dialog?.querySelector('[autofocus]') || heading || dialog?.querySelector('input:not(:disabled), button:not(:disabled), [tabindex]') ||
        (previousFocus?.isConnected && previousFocus !== document.body ? previousFocus : null);
      if (target && !target.closest('[inert]')) target.focus({ preventScroll: true });
      else document.activeElement?.blur();
    }
    if (quietly || reducedMotion) overlay.remove();
    else window.setTimeout(() => overlay.remove(), 350);
  }

  function pageReady() {
    if (hidden || completed) return;
    completed = true;
    window.clearTimeout(slowTimer);
    setProgress(100);
    continueButton.hidden = true;
    const elapsed = performance.now() - started;
    if (!firstInSession && !active) return hide(true);
    finishTimer = window.setTimeout(() => hide(false), firstInSession ? Math.max(0, firstMinimumMs - elapsed) : 0);
  }

  function trackImages() {
    if (hidden || completed) return;
    // Lazy off-screen images must never hold the entry gate open.
    const images = Array.from(document.images).filter(img => img.loading !== 'lazy' && !String(img.currentSrc || img.src).startsWith('data:'));
    let settled = images.filter(img => img.complete).length;
    const update = () => setProgress(25 + Math.round(65 * settled / Math.max(1, images.length)));
    update();
    images.filter(img => !img.complete).forEach(img => {
      const settle = () => {
        img.removeEventListener('load', settle);
        img.removeEventListener('error', settle);
        settled += 1;
        update();
      };
      img.addEventListener('load', settle, { once: true, signal: listeners.signal });
      img.addEventListener('error', settle, { once: true, signal: listeners.signal });
    });
  }

  overlay.querySelectorAll('[data-tip-direction]').forEach(button => {
    button.addEventListener('click', () => {
      tip = (tip + Number(button.dataset.tipDirection) + copy.tips.length) % copy.tips.length;
      overlay.querySelector('[data-first-load-tip]').textContent = copy.tips[tip];
    }, { signal: listeners.signal });
  });
  continueButton.addEventListener('click', () => hide(false), { signal: listeners.signal });

  setProgress(0);
  if (firstInSession) activate();
  else revealTimer = window.setTimeout(activate, laterRevealDelayMs);

  // A stalled asset cannot trap the player. Dismissal does not claim 100% readiness.
  slowTimer = window.setTimeout(() => {
    if (hidden || completed) return;
    status.textContent = copy.slow;
    announcement.textContent = copy.slow;
    continueButton.hidden = false;
  }, 8000);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', trackImages, { once: true, signal: listeners.signal });
  else trackImages();
  if (document.readyState === 'complete') pageReady();
  else window.addEventListener('load', pageReady, { once: true, signal: listeners.signal });
})();
