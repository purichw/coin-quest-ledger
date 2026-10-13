/* Presentation and local controls for the live Party Ledger board. No data store. */
function boardText(key) {
  const labels = {
    share: ['แชร์บอร์ด', 'Share board'], settings: ['ตั้งค่า', 'Settings'], history: ['กระดานเควส', 'Quest board'],
    trip: ['บอร์ดทริป', 'Trip board'], tagline: ['เที่ยว กิน ใช้ชีวิตด้วยกัน แบ่งค่าใช้จ่ายให้ลงตัว', 'Shared adventures. Clear expenses. Better memories.'],
    total: ['ยอดรวมบอร์ด', 'Board total'], members: ['สมาชิกปาร์ตี้', 'Party members'], details: ['รายละเอียดสมาชิก', 'Member details'],
    log: ['รายการค่าใช้จ่ายล่าสุด', 'Recent expenses'], settlement: ['สรุปการคืนเงิน', 'Settlement'],
    add: ['จดค่าใช้จ่ายใหม่', 'Add expense'], search: ['ค้นหารายการ…', 'Search expenses…'], all: ['ผู้จ่ายทั้งหมด', 'All payers'],
    paid: ['จ่ายไป', 'Paid'], balance: ['ยอดค้างสุทธิ', 'Net balance'], date: ['วันที่', 'Date'], description: ['ชื่อรายการ', 'Expense'],
    amount: ['จำนวนเงิน (฿)', 'Amount (฿)'], payer: ['ผู้จ่าย', 'Paid by'], sharers: ['ผู้ร่วมแชร์', 'Shared with'], method: ['วิธีแบ่ง', 'Split'],
    actions: ['จัดการ', 'Actions'], save: ['บันทึกรายการ', 'Save expense'], reset: ['ล้างข้อมูล', 'Reset form'], quick: ['เพิ่มด่วน', 'Quick add'],
    receipt: ['แนบไฟล์สลิป (ถ้ามี)', 'Attach a receipt (optional)'], imageHelp: ['ไฟล์ภาพขนาดไม่เกิน 10 MB', 'Image files up to 10 MB'],
    noMatches: ['ไม่พบรายการที่ตรงกัน', 'No matching expenses'], repay: ['บันทึกการคืนเงิน', 'Record repayment'],
    created: ['สร้างเมื่อ', 'Created'], remove: ['ลบรายการ', 'Delete expense'], clearFilter: ['ล้างตัวกรอง', 'Clear filters'],
  };
  return labels[key]?.[LANG === 'en' ? 1 : 0] || key;
}
function boardIcon(name) {
  const paths = {
    write: '<path d="M12 4H4v16h16v-8M8 16l1-5L19 1l4 4L13 15Zm8-12 4 4M8 16l5-1"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
    share: '<circle cx="18" cy="4" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="20" r="3"/><path d="m9 10 6-4M9 14l6 4"/>',
    receipt: '<path d="M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8M8 16h8M8 19h5"/>',
  };
  return paths[name] ? `<svg class="cq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>` : window.CoinQuestIcons(name);
}
function refreshBoardPresentation() {
  const root = document.querySelector('.board-page');
  if (!root) return;
  root.querySelectorAll('[data-board-label]').forEach(el => { el.textContent = boardText(el.dataset.boardLabel); });
  root.querySelectorAll('[data-board-icon]').forEach(el => { el.innerHTML = boardIcon(el.dataset.boardIcon); });
  root.querySelectorAll('[data-board-placeholder]').forEach(el => { el.placeholder = boardText(el.dataset.boardPlaceholder); });
  root.querySelectorAll('[data-board-name]').forEach(el => { el.textContent = S.tripName || t('title_split'); });
  const guestCount = S.participants.filter(name => S.guestHeroes?.[name]).length;
  const created = Number(S.admin?.createdAt);
  document.getElementById('board-metadata').innerHTML = `<span>${boardIcon('scroll')} #${h(tripId)}</span>${created > 0 ? `<span>${boardIcon('compass')} ${boardText('created')} ${new Date(created).toLocaleDateString(LANG === 'en' ? 'en-GB' : 'th-TH')}</span>` : ''}<span>${boardIcon('split')} ${S.participants.length - guestCount} ${LANG === 'en' ? 'members' : 'คน'}${guestCount ? ` + ${guestCount} Guest` : ''}</span>`;
  document.getElementById('board-sticky-total').textContent = money2(S.expenses.reduce((sum, e) => sum + e.amount, 0));
  const filter = document.getElementById('board-log-filter');
  const selected = filter.value;
  filter.innerHTML = `<option value="">${boardText('all')}</option>${S.participants.map(name => `<option value="${h(name)}">${h(name)}</option>`).join('')}`;
  filter.value = S.participants.includes(selected) ? selected : '';
  document.querySelector('[data-board-entry-link]').href = TEST_MODE ? '/trip/?test=1' : '/trip/';
  for (const [selector, name] of [['#share-btn', 'share'], ['.board-banner-actions [data-action="settings"]', 'settings'], ['.board-banner-actions [data-action="quest-board"]', 'scroll']]) {
    const el = root.querySelector(selector); el.insertAdjacentHTML('afterbegin', boardIcon(name));
  }
  if (!root.dataset.boardReady) {
    root.dataset.boardReady = 'true';
    for (const id of ['board-log-content','board-settle-content']) setBoardDisclosure(id, !matchMedia('(max-width:600px)').matches);
  }
}
function setBoardDisclosure(id, open) {
  document.querySelectorAll(`[data-board-collapse="${id}"]`).forEach(button => { button.setAttribute('aria-expanded', String(open)); button.setAttribute('aria-controls', id); });
  document.getElementById(id).hidden = !open;
}
function refreshBoardPreviews() {
  const last = S.expenses.at(-1);
  document.getElementById('board-log-preview').innerHTML = last ? `<span>${h(last.desc)}</span><strong>${money2(last.amount)}</strong><span aria-hidden="true">›</span>` : `<span>${t('no_quests')}</span>`;
  const tx = PointyLogic.pendingSettlements(S)[0];
  document.getElementById('board-settle-preview').innerHTML = tx ? `<span class="board-preview-person">${heroAvatar(tx.from,24)}${h(tx.from)}</span><span>→</span><span class="board-preview-person">${heroAvatar(tx.to,24)}${h(tx.to)}</span><strong>${money2(tx.amount)}</strong><span aria-hidden="true">›</span>` : `<span>${S.expenses.length ? t('settled_msg') : t('no_quests')}</span>`;
}
document.addEventListener('click', event => {
  if (event.target.closest('[data-board-add]')) {
    if (!S.participants.length) { openAddHero(); document.querySelector('.board-members').scrollIntoView({ block: 'center' }); return; }
    document.getElementById('entry-section').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    document.getElementById('exp-desc')?.focus({ preventScroll: true });
  }
  if (event.target.closest('[data-board-top]')) window.scrollTo({ top: 0, behavior: 'smooth' });
  const details = event.target.closest('[data-board-details]');
  if (details) {
    const expanded = details.getAttribute('aria-expanded') !== 'true';
    details.setAttribute('aria-expanded', String(expanded));
    document.getElementById('party-grid').classList.toggle('show-details', expanded);
  }
  const disclosure = event.target.closest('[data-board-collapse]');
  if (disclosure) {
    const open = disclosure.getAttribute('aria-expanded') !== 'true';
    setBoardDisclosure(disclosure.dataset.boardCollapse, open);
  }
  if (event.target.closest('[data-board-clear-filter]')) {
    document.getElementById('board-log-search').value = '';
    document.getElementById('board-log-filter').value = '';
    renderLog(computeParty());
  }
});
document.addEventListener('input', event => { if (event.target.id === 'board-log-search') renderLog(computeParty()); });
document.addEventListener('change', event => { if (event.target.id === 'board-log-filter') renderLog(computeParty()); });
