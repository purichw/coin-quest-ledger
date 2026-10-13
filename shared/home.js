(function () {
  const COPY = {
    th: {
      pick: 'เลือกเควสเพื่อเริ่มการผจญภัย สร้างวินัยการเงินไปด้วยกัน',
      quote: '“ทุกการใช้จ่าย คืออีกก้าวของการผจญภัย”', sign: 'การเงินที่ดี\nก็เป็นการผจญภัยได้',
      ready: 'พร้อมออกผจญภัยแล้วหรือยัง?', readySub: 'จัดการการเงินในแบบที่เป็นคุณ เลือกกิจกรรมที่ต้องการได้เลย',
      resume: 'กลับไปด่านล่าสุด', resumeSub: 'เล่นต่อจากที่ค้างไว้', start: 'เริ่มผจญภัย', startSub: 'เลือกเควสแรกของคุณ',
      party: 'สร้างปาร์ตี้ใหม่', partySub: 'ชวนเพื่อนจัดการเงิน', reminders: 'ดูภารกิจค้าง', remindersSub: 'ภารกิจที่รออยู่',
      play: 'เข้าเกม', days: 'วันติด', reputation: 'ความน่าเชื่อถือ', quests: 'เควส', parties: 'ปาร์ตี้', dragons: 'มังกร', deals: 'รายการ', wards: 'ด่าน', debt: 'ยอดหนี้', left: 'ยอดคงเหลือ', saved: 'ดีลประหยัดสูงสุด',
      cards: [
        ['แบ่งค่าใช้จ่าย', 'แบ่งค่าใช้จ่ายกับปาร์ตี้ — ใครจ่ายเท่าไหร่ เคลียร์ให้จบในเควสเดียว', 'เพื่อนดี\nค่าใช้จ่ายก็เบา'],
        ['มังกรหนี้', 'ปราบมังกรหนี้ทีละตัว — จ่ายคือโจมตี ดอกเบี้ยคือไฟที่มันพ่น', 'จัดการหนี้\nก่อนที่มันจะพ่นไฟ!'],
        ['เปรียบเทียบราคา', 'ประลองราคาร้านค้าในสนามประลอง ของถูกที่สุดคือผู้ชนะ', 'ราคาดี\nคือชัยชนะอีกแบบ'],
        ['คลังหลวง', 'ตั้งงบรายเดือน ปกป้องคลังจากเหล่าสัตว์ร้ายที่มาปล้นทองทุกเดือน', 'เก็บวันนี้\nเพื่อเส้นทางที่ไกลกว่า']
      ]
    },
    en: {
      pick: 'Choose a quest. Build better money habits, together.', quote: '“Every expense is another step in your adventure.”', sign: 'Better money,\nbrighter adventures.',
      ready: 'Ready for your next adventure?', readySub: 'Your money, your journey. Choose a quest to begin.',
      resume: 'Continue quest', resumeSub: 'Pick up your adventure', start: 'Start a quest', startSub: 'Begin your adventure',
      party: 'New party', partySub: 'Invite your friends', reminders: 'Reminders', remindersSub: 'Quests to complete',
      play: 'Enter game', days: 'day streak', reputation: 'Reputation', quests: 'quests', parties: 'parties', dragons: 'dragons', deals: 'deals', wards: 'wards', debt: 'Debt', left: 'Remaining', saved: 'Best deal saving',
      cards: [
        ['Split Expenses', 'Split costs with your party — who paid what, settled in one quest.', 'Good friends,\nlighter expenses'],
        ['Debt Dragon', 'Slay debts one by one. Payments strike; interest burns.', 'Tame your debt\nbefore it breathes fire!'],
        ['Compare Prices', 'Pit merchants against each other. Find the best deal.', 'A better price,\na little victory'],
        ['Personal Treasury', 'Plan your monthly budget and guard your gold from everyday expenses.', 'Save today,\nadventure tomorrow']
      ]
    }
  };
  const modules = [
    { id: 'split', art: 'chest', href: '/trip/' }, { id: 'debt', art: 'dragon', href: '/debt/' },
    { id: 'compare', art: 'scales', href: '/?view=compare' }, { id: 'treasury', art: 'treasury', href: '/treasury/' }
  ];
  const icon = name => window.CoinQuestIcons(name);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  function read(key, fallback) { return window.PointyScope?.getJSON(key, fallback) ?? fallback; }
  function recentRoute() {
    const recent = read('coin_quest_recent_route_v1', {}).href;
    if (!recent) return null;
    try {
      const url = new URL(recent, location.origin);
      return url.origin === location.origin && (['/trip/', '/debt/', '/treasury/'].includes(url.pathname) || (url.pathname === '/' && url.searchParams.get('view') === 'compare')) ? url.pathname + url.search : null;
    } catch (_) { return null; }
  }
  function boardCount() {
    const ids = new Set(Object.keys(read('coin_quest_trip_snapshots_v1', {})));
    if (isTestMode()) {
      for (let n = 0; n < sessionStorage.length; n++) {
        const key = sessionStorage.key(n);
        if (key.startsWith('pointy_test_trip_')) ids.add(key.slice('pointy_test_trip_'.length));
      }
    }
    return ids.size;
  }
  window.renderHome = function () {
    const s = COPY[window.LANG === 'en' ? 'en' : 'th'];
    const profile = window.PointyProfileHub?.computeProfile?.() || {};
    const streak = read('pointy_profile_v1', {}).streak || profile.streak || 0;
    const reminders = window.PointyProfileHub?.computeReminders?.() || [];
    const dragons = (read('pointy_debt_v5', {}).dragons || []).filter(d => !d.archived && !d.slain);
    const balance = dragons.reduce((sum, d) => sum + Math.max(0, Number(d.balance) || 0), 0);
    const tr = read('pointy_treasury_v1', {});
    const left = (Number(tr.income) || 0) - (tr.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const recent = recentRoute();
    document.getElementById('home-sub').textContent = s.pick;
    document.getElementById('hero-sign').textContent = s.sign;
    window.CoinQuestLayout.refresh();
    document.getElementById('home-renown').innerHTML = [
      ['star', `LV ${profile.level?.lvl || 1}`], ['flame', `${streak} ${s.days}`], ['trophy', `${profile.reputation || 0} ${s.reputation}`]
    ].map(([glyph, value]) => `<span class="hr-pill">${icon(glyph)}${escape(value)}</span>`).join('');
    const action = (id, glyph, title, sub, href, extra = '') => `<${href ? 'a' : 'button type="button"'} class="ha-action ${id === 'resume' ? 'ha-resume' : ''}" data-home-action="${id}" ${href ? `href="${escape(withTestParam(href))}"` : ''}>${icon(glyph)}<span><strong>${escape(title)}</strong><small>${escape(sub)}</small></span>${extra}</${href ? 'a' : 'button'}>`;
    document.getElementById('home-actions').innerHTML = `<div class="ha-intro">${icon('compass')}<div><strong>${escape(s.ready)}</strong><p>${escape(s.readySub)}</p></div></div><div class="ha-links">
      ${action('resume', 'play', recent ? s.resume : s.start, recent ? s.resumeSub : s.startSub, recent || '/trip/')}
      ${action('party', 'split', s.party, s.partySub, '/trip/?action=new')}
      ${action('reminders', 'scroll', s.reminders, s.remindersSub, null, reminders.length ? `<span class="ha-badge">${reminders.length > 9 ? '9+' : reminders.length}</span>` : '')}
    </div>`;
    const stats = [
      [['scroll', `${profile.quests || 0} ${s.quests}`], ['split', `${boardCount()} ${s.parties}`]],
      [['debt', `${dragons.length} ${s.dragons}`], ['coin', `${s.debt} ${money(balance)}`]],
      [['scroll', `${comparisons.length} ${s.deals}`], ['shield', `${s.saved} ${profile.bestRescue || 0}%`]],
      [['shield', `${(tr.categories || []).length} ${s.wards}`], ['coin', `${s.left} ${money(left)}`]]
    ];
    document.getElementById('home-grid').innerHTML = modules.map((m, i) => `<a class="game-card" data-home-card="${m.id}" href="${escape(withTestParam(m.href))}">
      <div class="gc-crest"><img src="/assets/home-reference/${m.art}.webp" width="132" height="132" alt="" decoding="async"></div>
      <div class="gc-body"><h2 class="gc-title">${escape(s.cards[i][0])}</h2><p class="gc-desc">${escape(s.cards[i][1])}</p><div class="gc-meta">${stats[i].map(([glyph, value]) => `<span class="gc-chip">${icon(glyph)}${escape(value)}</span>`).join('')}</div></div>
      <span class="gc-note" aria-hidden="true">${escape(s.cards[i][2])}</span><span class="gc-scenery" aria-hidden="true">${icon(['compare','treasury'].includes(m.id) ? 'castle' : m.id)}</span>
      <span class="gc-play">${icon('play')}${escape(s.play)}${icon('arrow')}</span>
    </a>`).join('');
  };
  document.addEventListener('click', event => {
    if (event.target.closest('[data-home-action="reminders"]')) window.PointyProfileHub?.showReminders?.();
    if (event.target.closest('[data-home-card="compare"]') && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      event.preventDefault(); window.openCompare();
    }
  });
  window.addEventListener('pointy-profile-updated', () => window.renderHome());
})();
