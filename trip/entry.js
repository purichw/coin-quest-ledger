/* Split entry composition. Board persistence stays in app.js. */
(function () {
  const state = { mode: 'new', name: '', code: '', error: '', errorKind: '', busy: '', all: false };
  const text = (th, en) => LANG === 'en' ? en : th;
  const icon = name => window.CoinQuestIcons(name);
  const art = name => `<img class="be-art" src="/assets/split-entry/${name}.svg" alt="" aria-hidden="true">`;
  function remember() {
    const name = document.getElementById('bc-board-name'), code = document.getElementById('bc-code');
    if (name) state.name = name.value;
    if (code) state.code = code.value;
  }
  function rows() {
    let entries = window.PointyProfileHub?.boardEntries?.().entries || [];
    if (TEST_MODE) entries = Object.keys(sessionStorage).filter(k => k.startsWith('pointy_test_trip_')).flatMap(k => {
      try { return [{ id: k.replace('pointy_test_trip_', ''), data: JSON.parse(sessionStorage.getItem(k)) }]; } catch (_) { return []; }
    });
    return entries.filter(({ data }) => data && !data.archived).sort((a, b) => {
      const time = v => Number(v?.toMillis?.() || (v?.seconds ? v.seconds * 1000 : v) || 0);
      return time(b.data.updatedAt) - time(a.data.updatedAt);
    });
  }
  function recent() {
    const boards = rows(), status = window.PointyProfileHub?.boardEntries?.();
    const previewCount = window.matchMedia('(max-width:600px)').matches ? 1 : 2;
    const visible = state.all ? boards : boards.slice(0, previewCount);
    const list = visible.map(({ id, data }) => `<a class="be-board" href="${h(tripLinkFor(id))}">
      <span class="be-thumb">${art('camp')}</span><span class="be-board-body"><strong>${h(typeof data.tripName === 'object' ? data.tripName[LANG] || data.tripName.th : data.tripName || text('บอร์ดของฉัน', 'My board'))}</strong>
      <span class="be-board-meta"><span>${icon('split')} ${Array.isArray(data.participants) ? data.participants.length : 0} ${text('คน', 'members')}</span><span>${icon('scroll')} ${Array.isArray(data.expenses) ? data.expenses.length : 0} ${text('รายการ', 'expenses')}</span><span>${art('key')} ${h(id)}</span></span></span>${icon('arrow')}</a>`).join('');
    return `<div class="be-section-head"><div>${art('clock')}<div><h2>${text('บอร์ดล่าสุด', 'Recent boards')}</h2><p>${text('กลับไปจัดการบอร์ดที่เคยสร้างหรือเข้าร่วม', 'Continue with a board you created or joined')}</p></div></div>${boards.length > previewCount ? `<button class="be-text-button" type="button" data-entry-all aria-expanded="${state.all}">${state.all ? text('ย่อรายการ', 'Show less') : text('ดูทั้งหมด', 'View all')}${icon('arrow')}</button>` : ''}</div>
      <div class="be-board-list">${status?.loading && !TEST_MODE ? window.CoinQuestLoading.skeleton(2) : list || `<div class="be-empty"><span>${art('camp')}</span><strong>${status?.error && !TEST_MODE ? text('ยังโหลดบอร์ดไม่ได้', 'Could not load your boards') : text('การผจญภัยครั้งใหม่เริ่มตรงนี้', 'Your next adventure starts here')}</strong><p>${status?.error && !TEST_MODE ? text('ลองโหลดอีกครั้ง หรือเข้าร่วมด้วยรหัสบอร์ด', 'Try again, or enter a board code below.') : text('สร้างบอร์ดแรก หรือใช้รหัสจากเพื่อนเพื่อเข้าร่วม', 'Create your first board or join a friend with a code.')}</p>${status?.error && !TEST_MODE ? `<button class="be-text-button" type="button" data-entry-retry>${text('ลองอีกครั้ง', 'Try again')}</button>` : ''}</div>`}</div>`;
  }
  function joinForm(prominent = false) {
    return `<section class="be-card be-join ${prominent ? 'be-join-primary' : ''}" aria-labelledby="be-join-title"><div class="be-section-head"><div>${art('key')}<div><h2 id="be-join-title">${text('มีรหัสบอร์ดอยู่แล้ว?', 'Have a board code?')}</h2><p id="be-code-help">${text('กรอกรหัส 4 หลักเพื่อเข้าร่วมบอร์ดที่มีอยู่', 'Enter 4 digits to join an existing board')}</p></div></div></div>
      <form id="be-join-form" novalidate><label class="be-sr" for="bc-code">${text('รหัสบอร์ด 4 หลัก', '4-digit board code')}</label><div class="be-code-wrap"><input id="bc-code" type="text" inputmode="numeric" autocomplete="off" pattern="[0-9]{4}" maxlength="4" required value="${h(state.code)}" aria-describedby="be-code-help be-join-error" ${state.busy ? 'disabled' : ''}><span class="be-code-boxes" aria-hidden="true">${[0, 1, 2, 3].map(i => `<span>${h(state.code[i] || '')}</span>`).join('')}</span></div>
      <p id="be-join-error" class="be-error" role="alert">${state.errorKind === 'join' ? h(state.error) : ''}</p><button class="be-join-button" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy === 'join' ? text('กำลังเปิดบอร์ด…', 'Opening board…') : text('เข้าร่วมบอร์ด', 'Join board')}${icon('arrow')}</button></form>
      <aside class="be-code-note" aria-hidden="true">${text('รหัส 4 หลัก<br>จากเพื่อนของคุณ<br>เช่น <b>4821</b>', '4 digits<br>from your friend<br>e.g. <b>4821</b>')}</aside>
      ${TEST_MODE ? `<details class="be-demo"><summary>${text('ลองด้วยรหัสตัวอย่าง', 'Try a sample code')}</summary>${boardChooseSamples().map(sample => `<button type="button" data-entry-sample="${sample.code}">${sample.code} · ${h(sample.name)}</button>`).join('')}</details>` : ''}</section>`;
  }
  function render() {
    const main = document.querySelector('main.page');
    if (!main) return;
    remember();
    document.getElementById('quick-toggles').innerHTML = '';
    document.querySelector('.settings-fab')?.classList.add('hidden');
    document.getElementById('app-overlays').innerHTML = '';
    main.className = 'page be-page';
    const home = TEST_MODE ? '/?test=1' : '/';
    main.innerHTML = `<section class="be-hero"><div class="be-hero-content"><div class="be-crest"><img src="/assets/home-reference/crest.webp" alt=""></div><h1>${text('แบ่งค่าใช้จ่าย', 'Split Expenses')}</h1><p>${text('สร้างบอร์ดใหม่หรือเข้าร่วมบอร์ดที่มีอยู่', 'Create a board or join your friends')}<br><span>${text('จัดการค่าใช้จ่ายกับเพื่อน ร่วมเดินทางไปด้วยกัน', 'Share expenses. Enjoy the journey together.')}</span></p></div></section>
      <div class="be-content"><nav class="be-breadcrumb" aria-label="${text('เส้นทางนำทาง', 'Breadcrumb')}"><a href="${home}">${icon('home')}${text('หน้าหลัก', 'Home')}</a>${icon('arrow')}<span aria-current="page">${text('แบ่งค่าใช้จ่าย', 'Split Expenses')}</span></nav>
      <div class="be-grid"><div class="be-primary"><div class="be-tabs" role="tablist" aria-label="${text('สร้างหรือเข้าร่วมบอร์ด', 'Create or join a board')}">${['new', 'join'].map(mode => `<button type="button" id="be-tab-${mode}" role="tab" aria-selected="${state.mode === mode}" aria-controls="be-panel" tabindex="${state.mode === mode ? 0 : -1}" data-board-mode="${mode}" ${state.busy ? 'disabled' : ''}>${art(mode === 'new' ? 'camp' : 'key')}<span><strong>${mode === 'new' ? text('สร้างบอร์ดใหม่', 'Create a board') : text('เข้าร่วมบอร์ด', 'Join a board')}</strong><small>${mode === 'new' ? text('เริ่มต้นทริปใหม่กับเพื่อน', 'Start a new trip with friends') : text('ใช้รหัส 4 หลักเพื่อเข้าร่วม', 'Enter a 4-digit code')}</small></span></button>`).join('')}</div>
      <div id="be-panel" role="tabpanel" aria-labelledby="be-tab-${state.mode}">${state.mode === 'new' ? `<section class="be-card be-create"><h2>${art('camp')}${text('ตั้งชื่อบอร์ดของคุณ', 'Name your board')}</h2><form id="be-create-form" novalidate><label for="bc-board-name">${text('ชื่อบอร์ด / ชื่อทริป', 'Board / trip name')} <span class="be-required">*</span></label><input id="bc-board-name" type="text" maxlength="80" required value="${h(state.name)}" placeholder="${h(t('bd_new_name_ph'))}" aria-describedby="be-owner-help be-create-error" ${state.busy ? 'disabled' : ''}>
      <p id="be-create-error" class="be-error" role="alert">${state.errorKind === 'new' ? h(state.error) : ''}</p><p class="be-owner-help" id="be-owner-help">${art('crown')}<span>${text('คุณจะเป็นแอดมินของบอร์ดนี้ และสามารถเชิญเพื่อนเข้าร่วมได้ในภายหลัง', 'You will be the board admin. You can invite your friends later.')}</span></p><button class="be-create-button" type="submit" ${state.busy ? 'disabled' : ''}><span class="be-plus" aria-hidden="true">+</span>${state.busy === 'new' ? text('กำลังสร้างบอร์ด…', 'Creating your board…') : text('สร้างบอร์ดและเริ่มใช้งาน', 'Create board & start')}</button></form></section>` : joinForm(true)}</div>
      <div class="be-quote" aria-hidden="true">${art('mountains')}<p>${text('“การเดินทางที่ดีขึ้น<br>เริ่มจากการแบ่งค่าใช้จ่ายที่ยุติธรรม”', '“Better adventures start<br>with a fair share.”')}</p></div></div>
      <div class="be-secondary"><section class="be-card be-recent" id="be-recent">${recent()}</section>${state.mode === 'new' ? joinForm() : `<div class="be-join-tip">${icon('compass')}<p>${text('หนึ่งบอร์ด หนึ่งการเดินทาง<br>แบ่งค่าใช้จ่าย แล้วไปสนุกด้วยกัน', 'One board. One shared adventure.<br>Split the costs and enjoy the trip.')}</p></div>`}</div></div>
      <cq-footer></cq-footer></div>`;
    bind(main);
  }
  function bind(main) {
    main.querySelectorAll('[data-board-mode]').forEach(button => {
      button.addEventListener('click', () => mode(button.dataset.boardMode));
      button.addEventListener('keydown', event => {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          event.preventDefault(); mode(event.key === 'Home' ? 'new' : event.key === 'End' ? 'join' : state.mode === 'new' ? 'join' : 'new');
          document.getElementById(`be-tab-${state.mode}`).focus();
        }
      });
    });
    main.querySelector('#be-create-form')?.addEventListener('submit', event => { event.preventDefault(); createBoardFromChoose(); });
    main.querySelector('#be-join-form')?.addEventListener('submit', event => { event.preventDefault(); joinBoardFromChoose(); });
    main.querySelector('#bc-board-name')?.addEventListener('input', event => { state.name = event.target.value; clearError('new'); });
    main.querySelector('#bc-code')?.addEventListener('input', event => {
      // Reject non-digits rather than turning a signed/decimal value into another board code.
      state.code = /^\d{0,4}$/.test(event.target.value) ? event.target.value : state.code;
      event.target.value = state.code;
      main.querySelectorAll('.be-code-boxes span').forEach((box, i) => { box.textContent = state.code[i] || ''; });
      clearError('join');
    });
    main.querySelectorAll('[data-entry-sample]').forEach(button => button.addEventListener('click', () => {
      state.code = button.dataset.entrySample; const input = main.querySelector('#bc-code'); input.value = state.code; input.dispatchEvent(new Event('input')); input.focus();
    }));
    bindRecent();
  }
  function bindRecent() {
    document.querySelector('[data-entry-all]')?.addEventListener('click', () => { state.all = !state.all; updateRecent(); document.querySelector('[data-entry-all]')?.focus(); });
    document.querySelector('[data-entry-retry]')?.addEventListener('click', () => window.PointyProfileHub?.refresh({ forceLiveTripRefresh: true }));
  }
  function updateRecent() {
    const panel = document.getElementById('be-recent');
    if (panel) { panel.innerHTML = recent(); bindRecent(); }
  }
  function clearError(kind) {
    if (state.errorKind !== kind) return;
    state.error = ''; state.errorKind = '';
    document.getElementById(kind === 'new' ? 'be-create-error' : 'be-join-error').textContent = '';
    document.getElementById(kind === 'new' ? 'bc-board-name' : 'bc-code').removeAttribute('aria-invalid');
  }
  function mode(value) { if (state.busy) return; remember(); state.mode = value === 'join' ? 'join' : 'new'; state.error = ''; state.errorKind = ''; render(); }
  function error(kind, message) {
    state.error = message; state.errorKind = kind; state.busy = ''; render();
    const input = document.getElementById(kind === 'new' ? 'bc-board-name' : 'bc-code');
    input?.setAttribute('aria-invalid', 'true'); input?.focus();
  }
  function busy(kind) { remember(); state.busy = kind; state.error = ''; state.errorKind = ''; render(); }
  window.CoinQuestEntry = { render, mode, error, busy, isBusy: () => !!state.busy };
  window.addEventListener('pointy-profile-updated', updateRecent);
  window.addEventListener('pointy-boards-updated', updateRecent);
  window.matchMedia('(max-width:600px)').addEventListener('change', updateRecent);
})();
