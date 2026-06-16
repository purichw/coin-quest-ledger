(function(root) {
  const PointyLogic = {};

  PointyLogic.UNIT_GROUPS = [
    { name: 'volume', base: 'ml', units: { ml: 1, l: 1000, kl: 1000000 } },
    { name: 'weight', base: 'g', units: { mg: 0.001, g: 1, kg: 1000 } },
    { name: 'length', base: 'm', units: { mm: 0.001, cm: 0.01, m: 1, km: 1000 } },
    { name: 'count', base: 'ชิ้น', units: { 'ชิ้น': 1, 'แพ็ค/กล่อง': 1 } }
  ];

  PointyLogic.UNIT_ALIAS = {
    'มล.': 'ml', 'มล': 'ml', 'ml.': 'ml',
    'ลิตร': 'l', 'กรัม': 'g', 'ก.': 'g',
    'กก.': 'kg', 'กิโลกรัม': 'kg',
    'เมตร': 'm', 'ซม.': 'cm', 'มม.': 'mm',
    'หน่วย': 'ชิ้น', 'pcs': 'ชิ้น', 'piece': 'ชิ้น', 'pieces': 'ชิ้น'
  };

  PointyLogic.CLASS_ORDER = ["warrior","wizard","cleric","monk","bard","dragoon","summoner","thief","ranger","alchemist","necromancer","engineer","berserker","archfiend","corsair","reveler","seraph","tiderunner"];
  PointyLogic.CLASSES = {
    warrior:     { glyph:"⚔️", hue:26,  th:"นักรบ", en:"Warrior" },
    wizard:      { glyph:"🪄", hue:196, th:"พ่อมด", en:"Wizard" },
    cleric:      { glyph:"✨", hue:156, th:"นักบวช", en:"Cleric" },
    monk:        { glyph:"👊", hue:72,  th:"นักพรต", en:"Monk" },
    bard:        { glyph:"🎻", hue:348, th:"นักดนตรี", en:"Bard" },
    dragoon:     { glyph:"🔱", hue:256, th:"ทหารมังกร", en:"Dragoon" },
    summoner:    { glyph:"🐾", hue:238, th:"ผู้อัญเชิญ", en:"Summoner" },
    thief:       { glyph:"🗡️", hue:214, th:"นักโจร", en:"Thief" },
    ranger:      { glyph:"🏹", hue:142, th:"นักธนู", en:"Ranger" },
    alchemist:   { glyph:"⚗️", hue:178, th:"นักเล่นแร่", en:"Alchemist" },
    necromancer: { glyph:"💀", hue:290, th:"จอมเวทมรณะ", en:"Necromancer" },
    engineer:    { glyph:"🔧", hue:44,  th:"วิศวกร", en:"Engineer" },
    berserker:   { glyph:"🪓", hue:8,   th:"นักรบคลั่ง", en:"Berserker" },
    archfiend:   { glyph:"😈", hue:358, th:"จอมอสูร", en:"Archfiend" },
    corsair:     { glyph:"🐚", hue:186, th:"โจรสลัด", en:"Corsair" },
    reveler:     { glyph:"🎭", hue:322, th:"นักรื่นเริง", en:"Reveler" },
    seraph:      { glyph:"😇", hue:95,  th:"ทูตสวรรค์", en:"Seraph" },
    tiderunner:  { glyph:"🌊", hue:225, th:"นักแล่นคลื่น", en:"Tiderunner" }
  };
  PointyLogic.LEVEL_STEP = 600;
  PointyLogic.SETTLE_BONUS_PAYER = 400;
  PointyLogic.SETTLE_BONUS_PAYEE = 200;
  PointyLogic.LEVEL_REWARDS = [
    { lvl:1, frame:"novice", glyph:"", title:{ th:"มือใหม่", en:"Novice" } },
    { lvl:2, frame:"bronze", glyph:"🌿", title:{ th:"น่าเชื่อถือ", en:"Trusted" } },
    { lvl:4, frame:"silver", glyph:"🪙", title:{ th:"ใจบุญ", en:"Generous" } },
    { lvl:6, frame:"gold", glyph:"⚔️", title:{ th:"ผู้กล้า", en:"Champion" } },
    { lvl:9, frame:"legend", glyph:"👑", title:{ th:"ตำนาน", en:"Legend" } }
  ];
  PointyLogic.DD_XP_DIVISOR = 10;
  PointyLogic.DD_SLAY_BONUS = 500;
  PointyLogic.DRAGON_TYPE_ORDER = ['card', 'autoloan', 'student', 'mortgage', 'medical', 'tax', 'other'];
  PointyLogic.DRAGON_TYPES = {
    card: { th: 'บัตรเครดิต', en: 'Credit card', glyph: '💳', hue: 255, minPay: 3000 },
    autoloan: { th: 'สินเชื่อรถยนต์', en: 'Auto loan', glyph: '🚗', hue: 25, minPay: 9600 },
    student: { th: 'กยศ. เงินกู้เรียน', en: 'Student loan', glyph: '🎓', hue: 230, minPay: 2000 },
    mortgage: { th: 'สินเชื่อบ้าน', en: 'Mortgage', glyph: '🏠', hue: 150, minPay: 19300 },
    medical: { th: 'หนี้ค่ารักษา', en: 'Medical debt', glyph: '🏥', hue: 185, minPay: 2500 },
    tax: { th: 'หนี้ภาษี', en: 'Tax debt', glyph: '🧾', hue: 45, minPay: 3000 },
    other: { th: 'หนี้อื่น ๆ', en: 'Other debt', glyph: '⛓️', hue: 300, minPay: 0 }
  };
  PointyLogic.SEED_DEBT = {
    slayer: { name: 'Pointy', characterId: '', class: 'dragoon', gender: 'male', skin: '' },
    dragons: [
      { id: 'd1', name: { th: 'บัตรเครดิต', en: 'Credit card' }, type: 'card', original: 72000, balance: 58000, apr: 22, payment: 3000, interestMode: 'compound', payMode: 'monthly', log: [], slain: false, slainAt: null },
      { id: 'd2', name: { th: 'สินเชื่อรถยนต์', en: 'Auto loan' }, type: 'autoloan', original: 540000, balance: 312000, apr: 3.5, payment: 9600, interestMode: 'simple', payMode: 'monthly', log: [], slain: false, slainAt: null },
      { id: 'd3', name: { th: 'กยศ. เงินกู้เรียน', en: 'Student loan' }, type: 'student', original: 180000, balance: 124000, apr: 1, payment: 2000, interestMode: 'compound', payMode: 'monthly', log: [], slain: false, slainAt: null },
      { id: 'd4', name: { th: 'ยืมเพื่อน', en: 'Borrowed from a friend' }, type: 'other', original: 8000, balance: 8000, apr: 0, payment: 0, interestMode: 'compound', payMode: 'adhoc', log: [], slain: false, slainAt: null }
    ],
    art: {}
  };

  function hashOf(name) {
    let x = 0;
    for (const c of String(name || '?')) x = ((x * 31) + c.charCodeAt(0)) | 0;
    return Math.abs(x);
  }

  function approxEqual(a, b) {
    if (a === b) return true;
    const mag = Math.max(Math.abs(a), Math.abs(b));
    return mag > 0 && Math.abs(a - b) / mag < 1e-9;
  }

  function normalizeUnit(unit, unitAlias = PointyLogic.UNIT_ALIAS) {
    const raw = String(unit || '').trim();
    return unitAlias[raw] || raw || 'ชิ้น';
  }

  function groupOf(unit, unitGroups = PointyLogic.UNIT_GROUPS, unitAlias = PointyLogic.UNIT_ALIAS) {
    const u = normalizeUnit(unit, unitAlias);
    return unitGroups.find(g => Object.prototype.hasOwnProperty.call(g.units, u)) || null;
  }

  function groupForCmp(cmp, unitGroups = PointyLogic.UNIT_GROUPS, unitAlias = PointyLogic.UNIT_ALIAS) {
    return groupOf(cmp.baseUnit || cmp.unit, unitGroups, unitAlias) || unitGroups[3];
  }

  function normalizedOffer(offer, cmp, opts = {}) {
    const unitGroups = opts.unitGroups || PointyLogic.UNIT_GROUPS;
    const unitAlias = opts.unitAlias || PointyLogic.UNIT_ALIAS;
    const unit = normalizeUnit(offer.unit || cmp.baseUnit, unitAlias);
    const group = groupForCmp(cmp, unitGroups, unitAlias);
    const unitGroup = groupOf(unit, unitGroups, unitAlias);
    if (!unitGroup || unitGroup.name !== group.name) return { valid: false, unit, baseUnit: group.base, qty: 0, pu: Infinity };
    let factor = group.units[unit] || 1;
    if (unit === 'แพ็ค/กล่อง') {
      factor = Number(offer.perPack) || 0;
      if (factor <= 0) return { valid: false, unit, baseUnit: group.base, qty: 0, pu: Infinity };
    }
    const qty = Number(offer.qty) || 0;
    const price = Number(offer.price) || 0;
    const buy = Math.max(1, parseInt(offer.buy, 10) || 1);
    const free = Math.max(0, parseInt(offer.free, 10) || 0);
    const promoMult = (buy + free) / buy;
    const normalizedQty = qty * factor * promoMult;
    return { valid: normalizedQty > 0 && price > 0, unit, baseUnit: group.base, qty: normalizedQty, pu: normalizedQty > 0 ? price / normalizedQty : Infinity, promoMult, buy, free };
  }

  function normalizeComparison(cmp, opts = {}) {
    const unitGroups = opts.unitGroups || PointyLogic.UNIT_GROUPS;
    const unitAlias = opts.unitAlias || PointyLogic.UNIT_ALIAS;
    const idFactory = opts.idFactory || (() => '');
    const baseUnit = normalizeUnit(cmp.baseUnit || cmp.unit || 'ชิ้น', unitAlias);
    const group = groupOf(baseUnit, unitGroups, unitAlias) || unitGroups[3];
    return {
      id: cmp.id || idFactory(),
      name: String(cmp.name || '').trim() || opts.itemFallback || 'Item',
      icon: cmp.icon || '🛒',
      baseUnit: group.base,
      offers: Array.isArray(cmp.offers) ? cmp.offers.map(o => ({
        id: o.id || idFactory(),
        merchant: String(o.merchant || opts.merchantFallback || 'Merchant').trim(),
        price: Number(o.price) || 0,
        qty: Number(o.qty) || 0,
        unit: normalizeUnit(o.unit || cmp.unit || group.base, unitAlias),
        perPack: Number(o.perPack) || 0,
        buy: Math.max(1, parseInt(o.buy, 10) || 1),
        free: Math.max(0, parseInt(o.free, 10) || 0)
      })).filter(o => o.price > 0 && o.qty > 0) : []
    };
  }

  function rankOffers(offers, cmp, opts = {}) {
    if (!offers.length) return [];
    const perUnit = offer => normalizedOffer(offer, cmp, opts).pu;
    const sorted = offers.slice().sort((a, b) => perUnit(a) - perUnit(b));
    const best = perUnit(sorted[0]);
    const worst = perUnit(sorted[sorted.length - 1]);
    const allEqual = sorted.length > 1 && approxEqual(best, worst);
    return sorted.map(o => {
      const norm = normalizedOffer(o, cmp, opts);
      const pu = norm.pu;
      const r = best > 0 ? pu / best : 1;
      let tier = "common";
      if (!allEqual && approxEqual(pu, best)) tier = "legendary";
      else if (r <= 1.12) tier = "epic";
      else if (r <= 1.32) tier = "rare";
      return { ...o, norm, pu, tier, savePct: worst > 0 ? Math.round((1 - pu / worst) * 100) : 0, isBest: !allEqual && approxEqual(pu, best), isEqual: allEqual };
    });
  }

  function normalizeClass(cls) {
    const map = { mage: 'wizard', knight: 'warrior', rogue: 'thief', druid: 'summoner' };
    const id = map[cls] || cls;
    return PointyLogic.CLASSES[id] ? id : PointyLogic.CLASS_ORDER[hashOf(id) % PointyLogic.CLASS_ORDER.length];
  }

  function levelFromXp(xp) {
    const lvl = Math.floor(xp / PointyLogic.LEVEL_STEP) + 1;
    const into = xp - (lvl - 1) * PointyLogic.LEVEL_STEP;
    return { lvl, into, need: PointyLogic.LEVEL_STEP, pct: Math.round((into / PointyLogic.LEVEL_STEP) * 100) };
  }

  function rewardFor(lvl) {
    let r = PointyLogic.LEVEL_REWARDS[0];
    PointyLogic.LEVEL_REWARDS.forEach(x => { if (lvl >= x.lvl) r = x; });
    return r;
  }

  function dragonType(id) {
    return PointyLogic.DRAGON_TYPES[id] || PointyLogic.DRAGON_TYPES.card;
  }

  function monthlyDebtRate(apr) {
    return (Number(apr) || 0) / 100 / 12;
  }

  function monthlyInterest(d) {
    const rate = monthlyDebtRate(d?.apr);
    const base = d?.interestMode === 'simple' ? Math.max(0, Number(d?.original) || 0) : Math.max(0, Number(d?.balance) || 0);
    return base * rate;
  }

  function payoffMonths(d) {
    const rate = monthlyDebtRate(d?.apr);
    const payment = Number(d?.payment) || 0;
    const balance = Number(d?.balance) || 0;
    if (balance <= 0) return 0;
    if (payment <= 0) return Infinity;
    if (d?.interestMode === 'simple') {
      const interest = Math.max(0, Number(d?.original) || 0) * rate;
      if (payment <= interest + 0.0001) return Infinity;
      return Math.ceil(balance / (payment - interest));
    }
    if (rate <= 0) return Math.ceil(balance / payment);
    if (payment <= balance * rate + 0.0001) return Infinity;
    return Math.ceil(-Math.log(1 - (balance * rate) / payment) / Math.log(1 + rate));
  }

  function strategyTarget(dragons, strategy = 'avalanche') {
    const live = (dragons || []).filter(d => !d.slain && Number(d.balance) > 0.5);
    if (!live.length) return null;
    const sorted = live.slice().sort((a, b) => strategy === 'snowball'
      ? (Number(a.balance) || 0) - (Number(b.balance) || 0)
      : (Number(b.apr) || 0) - (Number(a.apr) || 0));
    return sorted[0].id;
  }

  function simulateLair(dragons, strategy = 'avalanche', extra = 0) {
    const ds = (dragons || [])
      .filter(d => !d.slain && Number(d.balance) > 0.5 && d.payMode !== 'adhoc')
      .map(d => ({
        balance: Number(d.balance) || 0,
        apr: Number(d.apr) || 0,
        payment: Number(d.payment) || 0,
        original: Number(d.original) || 0,
        mode: d.interestMode === 'simple' ? 'simple' : 'compound'
      }));
    if (!ds.length) return { months: 0, interest: 0, never: false };
    const cap = 1200;
    let months = 0;
    let interest = 0;
    while (ds.some(d => d.balance > 0.5) && months < cap) {
      months += 1;
      let pool = Number(extra) || 0;
      ds.forEach(d => { if (d.balance <= 0.5) pool += d.payment; });
      ds.forEach(d => {
        if (d.balance <= 0.5) return;
        const charge = (d.mode === 'simple' ? d.original : d.balance) * monthlyDebtRate(d.apr);
        d.balance += charge;
        interest += charge;
      });
      ds.forEach(d => {
        if (d.balance <= 0.5) return;
        d.balance -= Math.min(d.payment, d.balance);
      });
      const live = ds.filter(d => d.balance > 0.5);
      const order = live.sort((a, b) => strategy === 'snowball' ? a.balance - b.balance : b.apr - a.apr);
      let remainingPool = pool;
      for (const d of order) {
        if (remainingPool <= 0) break;
        const pay = Math.min(remainingPool, d.balance);
        d.balance -= pay;
        remainingPool -= pay;
      }
    }
    const never = ds.some(d => d.balance > 0.5);
    return { months: never ? Infinity : months, interest: Math.round(interest), never };
  }

  function slayerXpFrom(dragons) {
    let damage = 0;
    let slain = 0;
    (dragons || []).forEach(d => {
      (d.log || []).forEach(row => { damage += Number(row.amount) || 0; });
      if (d.slain) slain += 1;
    });
    return Math.round(damage / PointyLogic.DD_XP_DIVISOR + slain * PointyLogic.DD_SLAY_BONUS);
  }

  function normalizeDebtState(data = {}) {
    const seed = PointyLogic.SEED_DEBT;
    const slayer = {
      ...seed.slayer,
      ...(data.slayer || {})
    };
    const dragons = Array.isArray(data.dragons) ? data.dragons : seed.dragons;
    return {
      slayer,
      dragons: dragons.map((d, index) => {
        const type = PointyLogic.DRAGON_TYPES[d?.type] ? d.type : 'card';
        const balance = Math.max(0, Number(d?.balance) || 0);
        const original = Math.max(balance, Number(d?.original) || balance);
        const payMode = d?.payMode === 'adhoc' ? 'adhoc' : 'monthly';
        return {
          id: String(d?.id || `d${index + 1}`),
          name: typeof d?.name === 'object' ? { th: d.name.th || d.name.en || dragonType(type).th, en: d.name.en || d.name.th || dragonType(type).en } : { th: String(d?.name || dragonType(type).th), en: String(d?.name || dragonType(type).en) },
          type,
          original,
          balance,
          apr: Math.max(0, Number(d?.apr) || 0),
          payment: payMode === 'adhoc' ? 0 : Math.max(0, Number(d?.payment) || dragonType(type).minPay || 0),
          payMode,
          interestMode: d?.interestMode === 'simple' ? 'simple' : 'compound',
          log: Array.isArray(d?.log) ? d.log.map(row => ({
            id: String(row.id || ''),
            date: String(row.date || ''),
            amount: Math.max(0, Number(row.amount) || 0),
            ts: Number(row.ts) || 0,
            move: row.move || 'projectile'
          })) : [],
          slain: !!d?.slain || balance <= 0.5,
          slainAt: d?.slainAt || null
        };
      }),
      art: data.art && typeof data.art === 'object' ? data.art : {}
    };
  }

  function hpColor(pct) {
    if (pct >= 55) return { a: "oklch(0.72 0.16 150)", b: "oklch(0.58 0.16 150)" };
    if (pct >= 28) return { a: "oklch(0.78 0.15 78)", b: "oklch(0.66 0.15 70)" };
    return { a: "oklch(0.66 0.2 26)", b: "oklch(0.55 0.2 26)" };
  }

  function statusOf(hero, labels = {}) {
    if (hero.bal > 0.5) return { kind: 'guardian', icon: '🛡️', label: labels.guardian || 'Guardian', amt: hero.bal };
    if (hero.bal < -0.5) return { kind: 'debt', icon: '💸', label: labels.debt || 'Debt', amt: -hero.bal };
    return { kind: 'even', icon: '⚖️', label: labels.even || 'Even', amt: 0 };
  }

  function normalizeTripState(data, opts = {}) {
    const questIcons = opts.questIcons || [];
    const normalizeExpense = e => {
      const desc = e.desc || e.name || opts.questFallback || '';
      const split = e.split && typeof e.split === 'object' ? {
        ...e.split,
        items: Array.isArray(e.split.items) ? e.split.items.map(it => ({
          name: String(it.name || '').trim(),
          amount: Number(it.amount) || 0,
          claimedBy: Array.isArray(it.claimedBy) ? it.claimedBy : []
        })).filter(it => it.amount > 0) : undefined
      } : undefined;
      return {
        id: e.id || Date.now() + Math.random(),
        desc,
        icon: e.icon || (questIcons.length ? questIcons[hashOf(desc) % questIcons.length] : ''),
        amount: Number(e.amount) || 0,
        paidBy: e.paidBy || e.payer || '',
        sharedBy: Array.isArray(e.sharedBy) ? e.sharedBy : (Array.isArray(e.participants) ? e.participants : []),
        payers: e.payers && typeof e.payers === 'object' ? e.payers : undefined,
        split,
        receipt: typeof e.receipt === 'string' ? e.receipt : undefined,
        date: typeof e.date === 'string' ? e.date : undefined
      };
    };
    const normalizeCampaign = c => ({
      id: c?.id || `camp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      tripName: c?.tripName || data?.tripName || opts.defaultTripName || '',
      participants: Array.isArray(c?.participants) ? c.participants : [],
      expenses: Array.isArray(c?.expenses) ? c.expenses.map(normalizeExpense).filter(e => e.amount > 0 && (e.paidBy || Object.keys(e.payers || {}).length) && e.sharedBy.length) : [],
      budgets: c?.budgets || {},
      heroClasses: Object.fromEntries(Object.entries(c?.heroClasses || {}).map(([name, cls]) => [name, normalizeClass(cls)])),
      heroGenders: c?.heroGenders || {},
      heroSkins: c?.heroSkins && typeof c.heroSkins === 'object' ? c.heroSkins : {},
      characterIds: c?.characterIds || {},
      promptpay: c?.promptpay || {},
      settleXp: c?.settleXp || {},
      createdAt: c?.createdAt || Date.now(),
      completedAt: c?.completedAt || null
    });
    const out = {
      tripName: data?.tripName || opts.defaultTripName || '',
      participants: Array.isArray(data?.participants) ? data.participants : [],
      expenses: Array.isArray(data?.expenses) ? data.expenses : [],
      budgets: data?.budgets || {},
      heroClasses: Object.fromEntries(Object.entries(data?.heroClasses || {}).map(([name, cls]) => [name, normalizeClass(cls)])),
      heroGenders: data?.heroGenders || {},
      heroSkins: data?.heroSkins && typeof data.heroSkins === 'object' ? data.heroSkins : {},
      settleXp: data?.settleXp || {},
      characterIds: data?.characterIds || {},
      promptpay: data?.promptpay || {},
      activeCampaignId: data?.activeCampaignId || data?.activeId || '',
      campaigns: Array.isArray(data?.campaigns) ? data.campaigns.map(normalizeCampaign) : [],
      admin: {
        passwordHash: data?.admin?.passwordHash || '',
        ownerHash: data?.admin?.ownerHash || '',
        adminId: data?.admin?.adminId || '',
        adminName: data?.admin?.adminName || '',
        characterId: data?.admin?.characterId || '',
        createdAt: data?.admin?.createdAt || null,
        urlLocked: !!data?.admin?.urlLocked
      },
      settings: { entry: 'form', settleView: 'list', theme: 'tavern', accent: '#2f8f5b', stats: true, sound: true, animations: true, ...(data?.settings || {}) }
    };
    out.expenses = out.expenses.map(normalizeExpense).filter(e => e.amount > 0 && (e.paidBy || Object.keys(e.payers || {}).length) && e.sharedBy.length);
    return out;
  }

  function parseImportItems(text) {
    return (text || '').split('\n').map(line => {
      const parts = line.split(/[,\t;]/);
      const desc = (parts[0] || '').trim();
      const amount = Number(String(parts[parts.length - 1] || '').replace(/[^0-9.]/g, ''));
      return desc && amount > 0 ? { desc, amount } : null;
    }).filter(Boolean);
  }

  function payerMap(e) {
    if (e.payers && typeof e.payers === 'object') {
      const out = {};
      let sum = 0;
      Object.entries(e.payers).forEach(([name, value]) => {
        const n = Number(value) || 0;
        if (n > 0) { out[name] = n; sum += n; }
      });
      if (sum > 0) return out;
    }
    return e.paidBy ? { [e.paidBy]: Number(e.amount) || 0 } : {};
  }

  function splitShares(e, validNames = null) {
    const parts = (e.sharedBy || []).filter(name => !validNames || validNames.includes(name));
    const out = {};
    if (!parts.length) return out;
    const mode = e.split?.mode || 'equal';
    const weights = e.split?.weights || {};
    if (mode === 'items') {
      const items = Array.isArray(e.split?.items) ? e.split.items : [];
      items.forEach(it => {
        const amount = Math.max(0, Number(it.amount) || 0);
        if (!amount) return;
        let claim = (Array.isArray(it.claimedBy) ? it.claimedBy : []).filter(name => !validNames || validNames.includes(name));
        if (!claim.length) claim = parts;
        if (!claim.length) return;
        const per = amount / claim.length;
        claim.forEach(name => { out[name] = (out[name] || 0) + per; });
      });
      return out;
    }
    if (mode === 'exact') {
      let sum = 0;
      parts.forEach(name => {
        out[name] = Math.max(0, Number(weights[name]) || 0);
        sum += out[name];
      });
      const remainder = e.amount - sum;
      if (Math.abs(remainder) > .5) parts.forEach(name => { out[name] += remainder / parts.length; });
      return out;
    }
    if (mode === 'shares' || mode === 'percent') {
      const totalWeight = parts.reduce((sum, name) => sum + Math.max(0, Number(weights[name]) || 0), 0);
      if (totalWeight > 0) {
        parts.forEach(name => { out[name] = e.amount * (Math.max(0, Number(weights[name]) || 0) / totalWeight); });
        return out;
      }
    }
    parts.forEach(name => { out[name] = e.amount / parts.length; });
    return out;
  }

  function computeParty(state, opts = {}) {
    const participants = state.participants || [];
    const expenses = state.expenses || [];
    const budgets = state.budgets || {};
    const settleXp = state.settleXp || {};
    const classOf = opts.classOf || (() => PointyLogic.CLASS_ORDER[0]);
    const baseXp = opts.baseXp || (() => 0);
    const stat = {};
    participants.forEach(name => { stat[name] = { paid: 0, share: 0, gen: 0, quests: 0 }; });
    expenses.forEach(e => {
      const shares = splitShares(e, participants);
      const parts = Object.keys(shares);
      if (!parts.length) return;
      const payers = payerMap(e);
      Object.entries(payers).forEach(([name, amount]) => {
        if (!stat[name]) return;
        stat[name].paid += amount;
        stat[name].gen += Math.max(0, amount - (shares[name] || 0));
      });
      parts.forEach(name => {
        stat[name].share += shares[name];
        stat[name].quests += 1;
      });
    });
    return participants.map(name => {
      const s = stat[name] || { paid: 0, share: 0, gen: 0, quests: 0 };
      const budget = Number(budgets[name]) || 3000;
      const remaining = budget - s.share;
      const hp = Math.max(0, Math.min(100, Math.round((remaining / budget) * 100)));
      const xp = Math.round((Number(baseXp(name)) || 0) + s.gen + (Number(settleXp[name]) || 0));
      const level = levelFromXp(xp);
      return { name, cls: classOf(name), budget, paid: s.paid, share: s.share, gen: Math.round(s.gen), quests: s.quests, bal: s.paid - s.share, remaining, over: remaining < 0, hp, xp, level, reward: rewardFor(level.lvl) };
    });
  }

  function timestampValue(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Date.parse(value) || 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    return 0;
  }

  function characterNamesForId(state, characterId) {
    const id = String(characterId || '');
    if (!id) return [];
    return (state.participants || []).filter(name => String(state.characterIds?.[name] || '') === id);
  }

  function buildCharacterProfile(characterId, boards = [], record = {}, opts = {}) {
    const id = String(characterId || '').trim();
    const lang = opts.lang || 'th';
    const boardFallback = opts.boardFallback || 'Untitled board';
    const names = new Set(record?.name ? [record.name] : []);
    const totals = { paid: 0, share: 0, fronted: 0, balance: 0, quests: 0, boards: 0, settledBoards: 0, activeBoards: 0, settlementXp: 0 };
    const boardRows = [];
    const adminBoards = [];
    let latest = null;

    boards.forEach(entry => {
      const boardId = String(entry.id || entry.urlId || '');
      const state = normalizeTripState(entry.data || entry, { defaultTripName: boardFallback });
      const matchNames = characterNamesForId(state, id);
      if (!matchNames.length) return;
      const updatedAt = timestampValue(entry.updatedAt || entry.data?.updatedAt || state.updatedAt || state.admin?.createdAt);
      const party = computeParty(state, {
        classOf: name => normalizeClass(state.heroClasses?.[name] || record?.class || PointyLogic.CLASS_ORDER[hashOf(name) % PointyLogic.CLASS_ORDER.length]),
        baseXp: () => 0
      });
      matchNames.forEach(name => {
        names.add(name);
        const hero = party.find(p => p.name === name) || { paid: 0, share: 0, gen: 0, bal: 0, quests: 0, xp: 0, cls: state.heroClasses?.[name] || record?.class };
        const admin = state.admin || {};
        const isAdminLinked = String(admin.characterId || '') === id || (admin.adminName && admin.adminName === name);
        const boardTotal = state.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const settled = state.expenses.length > 0 && settleUp(party).length === 0;
        const row = {
          id: boardId,
          tripName: state.tripName || boardFallback,
          url: boardId ? `/trip/?id=${encodeURIComponent(boardId)}` : '',
          name,
          class: normalizeClass(state.heroClasses?.[name] || record?.class || hero.cls),
          gender: state.heroGenders?.[name] || record?.gender || 'male',
          skin: state.heroSkins?.[name] || record?.skin || '',
          paid: hero.paid || 0,
          share: hero.share || 0,
          fronted: hero.gen || 0,
          balance: hero.bal || 0,
          quests: hero.quests || 0,
          boardTotal,
          settled,
          adminId: admin.adminId || '',
          adminName: admin.adminName || '',
          isAdminLinked,
          updatedAt
        };
        boardRows.push(row);
        totals.paid += row.paid;
        totals.share += row.share;
        totals.fronted += row.fronted;
        totals.balance += row.balance;
        totals.quests += row.quests;
        totals.settlementXp += Number(state.settleXp?.[name]) || 0;
        if (isAdminLinked) adminBoards.push(row);
        if (!latest || row.updatedAt > latest.updatedAt) latest = row;
      });
    });

    totals.boards = new Set(boardRows.map(row => row.id)).size;
    totals.settledBoards = new Set(boardRows.filter(row => row.settled).map(row => row.id)).size;
    totals.activeBoards = Math.max(0, totals.boards - totals.settledBoards);
    boardRows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0) || a.id.localeCompare(b.id));
    adminBoards.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0) || a.id.localeCompare(b.id));

    const debtXp = Math.round(Number(record?.debtXp) || 0);
    const totalXp = Math.round(Number(record?.xp) || (Object.values(record?.trips || {}).reduce((sum, xp) => sum + (Number(xp) || 0), 0) + debtXp) || totals.fronted + totals.settlementXp + debtXp);
    const level = levelFromXp(totalXp);
    const cls = normalizeClass(record?.class || latest?.class || PointyLogic.CLASS_ORDER[hashOf(id) % PointyLogic.CLASS_ORDER.length]);
    const gender = record?.gender || latest?.gender || (hashOf(id) % 2 ? 'female' : 'male');
    const badges = [];
    if (totals.boards >= 1) badges.push({ id: 'party-member', label: lang === 'en' ? 'Party Member' : 'สมาชิกปาร์ตี้', detail: lang === 'en' ? 'Joined the first board' : 'เข้าร่วมบอร์ดแรกแล้ว' });
    if (totals.boards >= 5) badges.push({ id: 'veteran', label: lang === 'en' ? 'Veteran Traveler' : 'นักเดินทางรุ่นเก๋า', detail: `${totals.boards} boards` });
    if (totals.fronted >= 1000) badges.push({ id: 'treasurer', label: lang === 'en' ? 'Treasurer' : 'เหรัญญิก', detail: lang === 'en' ? 'Fronted plenty for the party' : 'ออกเงินแทนปาร์ตี้เยอะมาก' });
    if (totals.settledBoards >= 1) badges.push({ id: 'debt-slayer', label: lang === 'en' ? 'Debt Slayer' : 'ผู้ปราบหนี้', detail: lang === 'en' ? 'Reached a settled board' : 'เคลียร์บอร์ดสำเร็จแล้ว' });
    if (adminBoards.length) badges.push({ id: 'board-admin', label: lang === 'en' ? 'Board Admin' : 'แอดมินบอร์ด', detail: `${adminBoards.length} boards` });
    if (debtXp > 0) badges.push({ id: 'debt-dragon', label: lang === 'en' ? 'Dragon Slayer' : 'นักล่ามังกร', detail: `${debtXp} XP` });
    if (level.lvl >= 5) badges.push({ id: 'high-level', label: lang === 'en' ? 'Seasoned Hero' : 'ฮีโร่ชำนาญศึก', detail: `Level ${level.lvl}` });

    return {
      id,
      record: record || {},
      names: [...names],
      displayName: record?.name || latest?.name || (id ? `#${id}` : ''),
      class: cls,
      gender,
      skin: record?.skin || latest?.skin || '',
      xp: totalXp,
      level,
      reward: rewardFor(level.lvl),
      createdAt: timestampValue(record?.createdAt),
      updatedAt: Math.max(timestampValue(record?.updatedAt), latest?.updatedAt || 0),
      totals,
      boards: boardRows,
      adminBoards,
      badges
    };
  }

  function settleUp(party) {
    const cred = party.filter(p => p.bal > 0.5).map(p => ({ name: p.name, amt: p.bal })).sort((a,b) => b.amt - a.amt);
    const debt = party.filter(p => p.bal < -0.5).map(p => ({ name: p.name, amt: -p.bal })).sort((a,b) => b.amt - a.amt);
    const out = [];
    let i = 0, j = 0;
    while (i < debt.length && j < cred.length) {
      const amt = Math.min(debt[i].amt, cred[j].amt);
      if (amt > 0.5) out.push({ from: debt[i].name, to: cred[j].name, amount: amt });
      debt[i].amt -= amt;
      cred[j].amt -= amt;
      if (debt[i].amt < 0.5) i++;
      if (cred[j].amt < 0.5) j++;
    }
    return out;
  }

  Object.assign(PointyLogic, {
    hashOf,
    approxEqual,
    normalizeUnit,
    groupOf,
    groupForCmp,
    normalizeComparison,
    normalizedOffer,
    rankOffers,
    normalizeClass,
    levelFromXp,
    rewardFor,
    hpColor,
    statusOf,
    normalizeTripState,
    parseImportItems,
    payerMap,
    splitShares,
    computeParty,
    buildCharacterProfile,
    dragonType,
    monthlyDebtRate,
    monthlyInterest,
    payoffMonths,
    strategyTarget,
    simulateLair,
    slayerXpFrom,
    normalizeDebtState,
    settleUp
  });

  root.PointyLogic = PointyLogic;
})(typeof globalThis !== 'undefined' ? globalThis : window);
