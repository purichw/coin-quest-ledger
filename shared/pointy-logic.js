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
  PointyLogic.CHARACTER_LEVEL_STEP = 600;
  PointyLogic.RENOWN_LEVEL_STEP = 1200; // Deprecated compatibility alias; use Reputation naming in UI/docs.
  PointyLogic.LEVEL_STEP = PointyLogic.CHARACTER_LEVEL_STEP;
  PointyLogic.CHARACTER_LEVEL_THRESHOLDS = [0, 300, 800, 1500, 2500, 4000, 6000, 8500, 12000, 16000];
  PointyLogic.REPUTATION_LEVEL_THRESHOLDS = [0, 900, 2200, 4200, 7500, 12000, 18000, 26000, 37000, 50000];
  PointyLogic.RENOWN_LEVEL_THRESHOLDS = PointyLogic.REPUTATION_LEVEL_THRESHOLDS;
  PointyLogic.CHARACTER_LEVEL_TAIL_STEP = 5000;
  PointyLogic.REPUTATION_LEVEL_TAIL_STEP = 20000;
  PointyLogic.SETTLE_BONUS_PAYER = 180;
  PointyLogic.SETTLE_BONUS_PAYEE = 120;
  PointyLogic.SPLIT_FRONTED_XP_DIVISOR = 20;
  PointyLogic.SPLIT_FRONTED_XP_CAP = 250;
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
    slayer: { name: 'Hero', characterId: '', class: 'dragoon', gender: 'male', skin: '' },
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

  // Firestore rejects nested undefined values; preserve Timestamp/Date instances.
  function cleanFirestoreData(value) {
    if (Array.isArray(value)) return value.map(item => item === undefined ? null : cleanFirestoreData(item));
    if (value && typeof value === 'object' && (!Object.getPrototypeOf(value) || Object.getPrototypeOf(value).constructor?.name === 'Object')) {
      return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, cleanFirestoreData(item)]));
    }
    return value;
  }

  // Compare actual content, independent of Firestore field order and save timestamps.
  function tripContentKey(data) {
    function ordered(value) {
      if (Array.isArray(value)) return value.map(ordered);
      if (value && typeof value.toMillis === 'function') return { timestampMillis: value.toMillis() };
      if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => [key, ordered(value[key])]));
      return value;
    }
    const { updatedAt, ...content } = data || {};
    return JSON.stringify(ordered(content));
  }

  function parseNumberInput(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return 0;
    if (!/^-?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?|\.\d+)$/.test(raw)) return NaN;
    const number = Number(raw.replace(/,/g, ''));
    return Number.isFinite(number) ? number : NaN;
  }

  function formatNumberInput(value) {
    const source = String(value ?? '');
    // Formatting must never turn -1 into 1, 1e3 into 13, or 1.2.3 into 1.23.
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d*)?$/.test(source)) return source;
    const raw = source.replace(/,/g, '');
    if (!raw) return '';
    const dot = raw.indexOf('.');
    const intRaw = dot >= 0 ? raw.slice(0, dot) : raw;
    const decRaw = dot >= 0 ? raw.slice(dot + 1).replace(/\./g, '') : '';
    const intPart = (intRaw.replace(/^0+(?=\d)/, '') || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return dot >= 0 ? `${intPart}.${decRaw}` : intPart;
  }

  function formatNumberInputElement(input) {
    if (!input) return '';
    const previous = input._pointyNumericValue;
    if (previous && /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?$/.test(previous)) {
      // Re-group a single keystroke in an already formatted value. A paste is
      // still validated as a whole; never strip signs, letters or extra dots.
      let start = 0, end = 0;
      while (start < previous.length && start < input.value.length && previous[start] === input.value[start]) start++;
      while (end < previous.length - start && end < input.value.length - start && previous[previous.length - 1 - end] === input.value[input.value.length - 1 - end]) end++;
      const removed = previous.slice(start, previous.length - end), added = input.value.slice(start, input.value.length - end);
      if (removed.length + added.length <= 1 && /^[\d.]*$/.test(added)) input.value = input.value.replace(/,/g, '');
    }
    input.value = formatNumberInput(input.value);
    input._pointyNumericValue = input.value;
    const valid = !input.value || /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?$/.test(input.value);
    input.setCustomValidity?.(valid ? '' : 'ใช้ตัวเลขตั้งแต่ 0 และจุดทศนิยมเท่านั้น / Enter a non-negative number');
    input.setAttribute?.('aria-invalid', String(!valid));
    return input.value;
  }

  function validateNumber(value, { label = 'จำนวน', min = 0, max = Number.MAX_SAFE_INTEGER / 100, decimals = 2, optional = false } = {}) {
    const raw = String(value ?? '').trim();
    if (!raw) { if (optional) return 0; throw new Error(`${label}: กรุณากรอกค่า / Required`); }
    const number = parseNumberInput(raw);
    if (!Number.isFinite(number)) throw new Error(`${label}: ใช้ตัวเลขและจุดทศนิยมเท่านั้น / Invalid number`);
    if (number < min) throw new Error(`${label}: ต้องตั้งแต่ ${min} ขึ้นไป / Minimum ${min}`);
    if (number > max) throw new Error(`${label}: ต้องไม่เกิน ${max} / Maximum ${max}`);
    const excessPrecision = typeof value === 'number' ? Math.abs(number - Math.round(number * 10 ** decimals) / 10 ** decimals) > 1e-9 : (raw.split('.')[1] || '').length > decimals;
    if (excessPrecision || (decimals === 0 && !Number.isInteger(number))) throw new Error(`${label}: ${decimals === 0 ? 'ต้องเป็นจำนวนเต็ม / Whole number required' : `ทศนิยมไม่เกิน ${decimals} ตำแหน่ง / Too many decimals`}`);
    return number;
  }

  function validateText(value, { label = 'ชื่อ', max = 80, optional = false } = {}) {
    const text = String(value ?? '').trim();
    if ((!optional && !text) || text.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) throw new Error(`${label}: ${optional ? 'ไม่เกิน' : 'กรอก 1–'}${max} ตัวอักษร / Check text length`);
    return text;
  }

  function validateDate(value, { optional = false, month = '', min = '', max = '' } = {}) {
    if (!value && optional) return '';
    const day = String(value || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?)?$/.test(String(value)) || !Number.isFinite(Date.parse(value)) || new Date(day).toISOString().slice(0, 10) !== day) throw new Error('วันที่ไม่ถูกต้อง / Invalid date');
    if ((month && day.slice(0, 7) !== month) || (min && day < min) || (max && day > max)) throw new Error('วันที่อยู่นอกช่วงที่บันทึกได้ / Date is out of range');
    return value;
  }

  function validateOfferInput(draft, comparison) {
    const unit = normalizeUnit(draft.unit);
    const pack = unit === 'แพ็ค/กล่อง';
    const offer = { ...draft, unit,
      merchant: validateText(draft.merchant, { label: 'ร้านหรือตัวเลือก', max: 100, optional: true }),
      price: validateNumber(draft.price, { label: 'ราคา', min: .01 }),
      qty: validateNumber(draft.qty, { label: 'ปริมาณ', min: .000001, decimals: unit === 'ชิ้น' || pack ? 0 : 6 }),
      perPack: pack ? validateNumber(draft.perPack, { label: 'จำนวนชิ้นต่อแพ็ค', min: 1, decimals: 0 }) : 0,
      buy: validateNumber(draft.buy, { label: 'ซื้อ', min: 1, decimals: 0 }),
      free: validateNumber(draft.free, { label: 'แถม', decimals: 0 }) };
    const normalized = normalizedOffer(offer, comparison);
    if (!normalized.valid || !Number.isFinite(normalized.pu) || !Number.isFinite(normalized.qty)) throw new Error('ตรวจหน่วยและจำนวนชิ้นต่อแพ็ค / Invalid units');
    return offer;
  }
  function validateModuleBackupValue(key, value) {
    const rows = list => {
      if (!Array.isArray(list) || list.length > 3000 || list.some(r => !r || typeof r.id !== 'string' || !r.id) || new Set(list.map(r => r.id)).size !== list.length) throw new Error('รายการในไฟล์ไม่ครบหรือมีรหัสซ้ำ / Invalid backup rows');
      return list;
    };
    const amount = n => { if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > Number.MAX_SAFE_INTEGER / 100) throw new Error('จำนวนเงินในไฟล์ไม่ถูกต้อง / Invalid backup amount'); };
    if (key === 'debt') {
      rows(value?.dragons).forEach(d => {
        [d.balance, d.original, d.apr, d.payment].forEach(amount);
        if (d.payMode === 'monthly') validateNumber(d.dueDay, { label: 'วันครบกำหนด', min: 1, max: 31, decimals: 0 });
        // A final payment is capped at the precise accrued balance; imported
        // stored results can legitimately contain fractions of a satang.
        rows(d.log || []).forEach(l => { amount(l.amount); if (l.amount <= 0) throw new Error('ยอดชำระในไฟล์ต้องมากกว่า 0 / Invalid payment'); });
      });
    } else if (key === 'comparisons') {
      rows(value).forEach(c => { validateText(c.name, { label: 'ชื่อสินค้า', max: 80 }); rows(c.offers).forEach(o => validateOfferInput(o, c)); });
    } else if (key === 'treasury') {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value?.month || '')) throw new Error('เดือนในไฟล์ไม่ถูกต้อง / Invalid backup month');
      amount(value.income); const categories = rows(value.categories); categories.forEach(c => amount(c.budget));
      const category = id => { if (!categories.some(c => c.id === id)) throw new Error('รายการไม่มีหมวดอ้างอิง / Missing category'); };
      rows(value.bills).forEach(b => { category(b.catId); validateNumber(b.amount, { min: .01 }); validateNumber(b.dueDay, { min: 1, max: 31, decimals: 0 }); });
      const paidBills = new Set();
      rows(value.expenses).forEach(e => {
        category(e.catId || e.category); validateNumber(e.amount, { min: .01 }); validateDate(e.date, { month: value.month });
        if (e.billId && paidBills.has(e.billId)) throw new Error('บิลจ่ายซ้ำในไฟล์ / Duplicate bill payment');
        if (e.billId) paidBills.add(e.billId);
      });
    }
    return value;
  }
  function readField(id, rule = {}) {
    const input = typeof id === 'string' ? document.getElementById(id) : id;
    if (!input) throw new Error('ไม่พบช่องกรอก กรุณาเปิดฟอร์มใหม่ / Reopen the form');
    try {
      const value = rule.type === 'text' ? validateText(input.value, rule) : rule.type === 'date' ? validateDate(input.value, rule) : validateNumber(input.value, rule);
      input.setCustomValidity?.(''); input.setAttribute('aria-invalid', 'false');
      return value;
    } catch (error) {
      input.setCustomValidity?.(error.message); input.setAttribute('aria-invalid', 'true'); input.reportValidity?.(); input.focus();
      input.addEventListener?.('input', () => { input.setCustomValidity?.(''); input.setAttribute('aria-invalid', 'false'); }, { once: true });
      throw error;
    }
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
      if (!Number.isInteger(factor) || factor <= 0) return { valid: false, unit, baseUnit: group.base, qty: 0, pu: Infinity };
    }
    const qty = Number(offer.qty) || 0;
    const price = Number(offer.price) || 0;
    const buy = offer.buy == null ? 1 : Number(offer.buy);
    const free = offer.free == null ? 0 : Number(offer.free);
    const promoMult = (buy + free) / buy;
    const normalizedQty = qty * factor * promoMult;
    const valid = Number.isFinite(normalizedQty) && Number.isFinite(price) && normalizedQty > 0 && price > 0
      && Number.isInteger(buy) && buy >= 1 && Number.isInteger(free) && free >= 0;
    return { valid, unit, baseUnit: group.base, qty: normalizedQty, pu: valid ? price / normalizedQty : Infinity, promoMult, buy, free };
  }

  function normalizeComparison(cmp, opts = {}) {
    const unitGroups = opts.unitGroups || PointyLogic.UNIT_GROUPS;
    const unitAlias = opts.unitAlias || PointyLogic.UNIT_ALIAS;
    const idFactory = opts.idFactory || (() => '');
    const baseUnit = normalizeUnit(cmp.baseUnit || cmp.unit || 'ชิ้น', unitAlias);
    const group = groupOf(baseUnit, unitGroups, unitAlias) || unitGroups[3];
    return {
      ...cmp,
      id: cmp.id || idFactory(),
      name: String(cmp.name || '').trim() || opts.itemFallback || 'Item',
      icon: cmp.icon || '🛒',
      baseUnit: group.base,
      offers: Array.isArray(cmp.offers) ? cmp.offers.map(o => ({
        ...o,
        id: o.id || idFactory(),
        merchant: String(o.merchant || opts.merchantFallback || 'Merchant').trim(),
        price: Number(o.price) || 0,
        qty: Number(o.qty) || 0,
        unit: normalizeUnit(o.unit || cmp.unit || group.base, unitAlias),
        perPack: Number(o.perPack) || 0,
        buy: o.buy == null ? 1 : Number(o.buy),
        free: o.free == null ? 0 : Number(o.free)
      })).filter(o => o.price > 0 && o.qty > 0) : []
    };
  }

  function rankOffers(offers, cmp, opts = {}) {
    if (!offers.length) return [];
    const perUnit = offer => normalizedOffer(offer, cmp, opts).pu;
    const sorted = offers.slice().sort((a, b) => perUnit(a) - perUnit(b));
    const valid = sorted.filter(o => normalizedOffer(o, cmp, opts).valid);
    const best = valid.length ? perUnit(valid[0]) : Infinity;
    const worst = valid.length ? perUnit(valid[valid.length - 1]) : Infinity;
    const comparable = valid.length >= 2;
    const allEqual = comparable && approxEqual(best, worst);
    return sorted.map(o => {
      const norm = normalizedOffer(o, cmp, opts);
      const pu = norm.pu;
      const r = best > 0 ? pu / best : 1;
      let tier = "common";
      if (norm.valid && comparable && !allEqual && approxEqual(pu, best)) tier = "legendary";
      else if (norm.valid && comparable && r <= 1.12) tier = "epic";
      else if (norm.valid && comparable && r <= 1.32) tier = "rare";
      return { ...o, norm, pu, tier, savePct: norm.valid && comparable ? Math.round((1 - pu / worst) * 100) : 0, isBest: norm.valid && comparable && !allEqual && approxEqual(pu, best), isEqual: norm.valid && allEqual };
    });
  }

  function normalizeClass(cls) {
    const map = { mage: 'wizard', knight: 'warrior', rogue: 'thief', druid: 'summoner' };
    const id = map[cls] || cls;
    return PointyLogic.CLASSES[id] ? id : PointyLogic.CLASS_ORDER[hashOf(id) % PointyLogic.CLASS_ORDER.length];
  }

  function levelFrom(value, step) {
    const clean = Math.max(0, Math.round(Number(value) || 0));
    const size = Math.max(1, Math.round(Number(step) || PointyLogic.CHARACTER_LEVEL_STEP));
    const lvl = Math.floor(clean / size) + 1;
    const into = clean - (lvl - 1) * size;
    return { lvl, into, need: size, pct: Math.round((into / size) * 100) };
  }

  function levelFromThresholds(value, thresholds, tailStep) {
    const clean = Math.max(0, Math.round(Number(value) || 0));
    const marks = Array.isArray(thresholds) && thresholds.length > 1 ? thresholds.map(x => Math.max(0, Math.round(Number(x) || 0))) : [0, Math.max(1, Number(tailStep) || 1)];
    const step = Math.max(1, Math.round(Number(tailStep) || marks[marks.length - 1] - marks[marks.length - 2] || 1));
    let lvl = 1;
    while (lvl < marks.length && clean >= marks[lvl]) lvl += 1;
    let prev;
    let next;
    if (lvl < marks.length) {
      prev = marks[lvl - 1];
      next = marks[lvl];
    } else {
      prev = marks[marks.length - 1];
      while (clean >= prev + step) {
        prev += step;
        lvl += 1;
      }
      next = prev + step;
    }
    const need = Math.max(1, next - prev);
    const into = clean - prev;
    return { lvl, into, need, pct: Math.round((into / need) * 100) };
  }

  function levelFromXp(xp) {
    return levelFromThresholds(xp, PointyLogic.CHARACTER_LEVEL_THRESHOLDS, PointyLogic.CHARACTER_LEVEL_TAIL_STEP);
  }

  function levelFromReputation(reputation) {
    return levelFromThresholds(reputation, PointyLogic.REPUTATION_LEVEL_THRESHOLDS, PointyLogic.REPUTATION_LEVEL_TAIL_STEP);
  }

  function levelFromRenown(renown) {
    return levelFromReputation(renown);
  }

  function rewardFor(lvl) {
    let r = PointyLogic.LEVEL_REWARDS[0];
    PointyLogic.LEVEL_REWARDS.forEach(x => { if (lvl >= x.lvl) r = x; });
    return r;
  }

  function splitFrontedXp(amount) {
    return Math.round(Math.min(PointyLogic.SPLIT_FRONTED_XP_CAP, Math.max(0, Number(amount) || 0) / PointyLogic.SPLIT_FRONTED_XP_DIVISOR));
  }

  function dragonType(id) {
    return PointyLogic.DRAGON_TYPES[id] || PointyLogic.DRAGON_TYPES.card;
  }

  function monthlyDebtRate(apr) {
    return (Number(apr) || 0) / 100 / 12;
  }

  function dateOnlyMs(value) {
    const parts = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const d = parts ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])) : value instanceof Date ? new Date(value) : new Date(value || Date.now());
    if (Number.isNaN(d.getTime())) {
      const fallback = new Date();
      fallback.setHours(0, 0, 0, 0);
      return fallback.getTime();
    }
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function daysBetween(start, end) {
    const from = dateOnlyMs(start);
    const to = dateOnlyMs(end);
    return Math.max(0, Math.round((to - from) / 86400000));
  }

  function lastDayOfMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function clampedDueDay(year, monthIndex, dueDay) {
    const configured = Math.max(1, Math.min(31, parseInt(dueDay, 10) || 1));
    return Math.min(configured, lastDayOfMonth(year, monthIndex));
  }

  function dueDateForMonth(year, monthIndex, dueDay) {
    return new Date(year, monthIndex, clampedDueDay(year, monthIndex, dueDay));
  }

  function debtDueStatus(d, today = new Date()) {
    if (d.archived || d.payMode === 'adhoc' || !d.dueDay || d.slain) return null;
    const y = today.getFullYear(), m = today.getMonth();
    const paid = (d.log || []).reduce((sum, row) => {
      const timestamp = Number(row.ts);
      const hasTimestamp = Number.isFinite(timestamp) && timestamp > 0;
      const parsed = /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? Date.parse(row.date) : NaN;
      const hasDate = Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === row.date;
      if (!hasTimestamp && !hasDate) return sum;
      const date = new Date(dateOnlyMs(hasTimestamp ? timestamp : row.date));
      return date.getFullYear() === y && date.getMonth() === m ? sum + (Number(row.amount) || 0) : sum;
    }, 0);
    const required = Math.min(Number(d.payment) || 0, Math.max(0, Number(d.balance) || 0) + paid);
    const paidThisMonth = required > 0 && paid + .005 >= required;
    const dueThis = clampedDueDay(y, m, d.dueDay);
    if (!paidThisMonth && today.getDate() > dueThis) return { overdue: true };
    const due = dueDateForMonth(y, m + (paidThisMonth ? 1 : 0), d.dueDay);
    return { overdue: false, days: daysBetween(today, due) };
  }

  function dailyDebtRate(apr) {
    return (Number(apr) || 0) / 100 / 365;
  }

  function dailyInterest(d, from, to) {
    const days = daysBetween(from, to);
    const rate = dailyDebtRate(d?.apr);
    if (days <= 0 || rate <= 0) return 0;
    const balance = Math.max(0, Number(d?.balance) || 0);
    const base = d?.interestMode === 'simple' ? Math.max(0, Number(d?.original) || 0)
      : d?.interestMode === 'reducing' ? Math.max(0, balance - debtUnpaidInterest(d)) : balance;
    return d?.interestMode === 'simple' || d?.interestMode === 'reducing'
      ? base * rate * days : base * (Math.pow(1 + rate, days) - 1);
  }

  function debtUnpaidInterest(d) {
    const balance = Math.max(0, Number(d?.balance) || 0);
    if (Number.isFinite(d?.unpaidInterest)) return Math.min(balance, Math.max(0, d.unpaidInterest));
    // Older records did not separate principal from unpaid interest. Recover
    // only the portion supported by the most recent payment or original base.
    const last = (d?.log || []).slice().sort((a,b) => (Number(a.ts) || 0) - (Number(b.ts) || 0)).at(-1);
    const base = last?.balanceBefore > 0 && Number.isFinite(last.balanceAfter) ? last.balanceAfter : Number(d?.original) || balance;
    const carried = last ? Math.max(0, (Number(last.accruedInterest) || 0) - (Number(last.interest) || 0)) : 0;
    return Math.min(balance, Math.max(0, balance - base) + carried);
  }

  function accrueDebtToDate(d, to) {
    const toMs = dateOnlyMs(to);
    if (!d || d.slain || Number(d.balance) <= 0.005) {
      return { debt: d, interest: 0, days: 0 };
    }
    const fromMs = Number(d.interestAccruedAt) || Number(d.createdAt) || toMs;
    const days = daysBetween(fromMs, toMs);
    if (days <= 0) return { debt: { ...d, unpaidInterest: debtUnpaidInterest(d), interestAccruedAt: Math.max(fromMs, toMs) }, interest: 0, days: 0 };
    const interest = dailyInterest(d, fromMs, toMs);
    return {
      debt: {
        ...d,
        balance: Math.max(0, Number(d.balance) || 0) + interest,
        unpaidInterest: debtUnpaidInterest(d) + interest,
        interestAccruedAt: toMs
      },
      interest,
      days
    };
  }

  function applyDebtPayment(d, amount, date) {
    const accrued = accrueDebtToDate(d, date);
    const before = Math.max(0, Number(accrued.debt?.balance) || 0);
    const payment = Math.max(0, Number(amount) || 0);
    const applied = Math.min(payment, before);
    const interestPaid = Math.min(applied, debtUnpaidInterest(accrued.debt));
    const principalPaid = Math.max(0, applied - interestPaid);
    const after = Math.max(0, before - applied);
    const debt = {
      ...accrued.debt,
      ...(!(d.log || []).length && !d.historyBase ? { historyBase: { balance: Number(d.balance), unpaidInterest: debtUnpaidInterest(d), at: dateOnlyMs(Number(d.interestAccruedAt) || Number(d.createdAt) || date), apr: Number(d.apr), original: Number(d.original), interestMode: d.interestMode } } : {}),
      balance: after,
      unpaidInterest: Math.max(0, debtUnpaidInterest(accrued.debt) - interestPaid),
      slain: after <= 0.005,
      slainAt: after <= 0.005 ? (accrued.debt?.slainAt || Date.now()) : null
    };
    return {
      debt,
      applied,
      interest: accrued.interest,
      interestPaid,
      principalPaid,
      balanceBefore: before,
      balanceAfter: after,
      days: accrued.days
    };
  }

  function reviseDebtLog(d, { id, amount, date, remove = false, restore = false }, now = Date.now()) {
    const source = restore ? d.logTrash || [] : d.log || [];
    const old = source.find(row => row.id === id);
    if (!old) throw new Error('ไม่พบประวัติชำระรายการนี้');
    if (restore && (d.log || []).some(row => row.id === id)) return d;
    const at = restore || remove ? dateOnlyMs(old.ts || old.date) : dateOnlyMs(date);
    const validDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
    if ((!remove && !restore && !validDate) || !Number.isFinite(at) || at > dateOnlyMs(now)) throw new Error('ตรวจวันที่ชำระหนี้');
    const value = restore ? Number(old.amount) : Number(amount);
    if (!remove && (!Number.isFinite(value) || value <= 0)) throw new Error('ยอดชำระต้องมากกว่า 0');
    const ordered = rows => [...rows].sort((a, b) => dateOnlyMs(a.ts || a.date) - dateOnlyMs(b.ts || b.date));
    const original = ordered(d.log || []);
    let base = d.historyBase;
    if (!base && !(Number(d.apr) > 0)) base = { balance: Number(d.balance) + original.reduce((n, row) => n + Number(row.amount), 0), at: dateOnlyMs(d.createdAt), apr: 0, original: Number(d.original), interestMode: d.interestMode };
    if (!base && original[0]?.balanceBefore > 0) {
      const first = original[0];
      base = { balance: first.balanceBefore - (Number(first.accruedInterest) || 0), at: dateOnlyMs(first.ts || first.date) - (Number(first.days) || 0) * 86400000, apr: Number(d.apr), original: Number(d.original), interestMode: d.interestMode };
    }
    if (!base || base.apr !== Number(d.apr) || base.original !== Number(d.original) || base.interestMode !== d.interestMode) throw new Error('ประวัติก่อนเปลี่ยนเงื่อนไขหนี้ไม่ครบ จึงยังคำนวณย้อนกลับอย่างถูกต้องไม่ได้');
    if (at < base.at) throw new Error('วันที่ต้องไม่ก่อนจุดเริ่มต้นของประวัติหนี้');
    const cutoff = Math.max(Number(d.interestAccruedAt) || base.at, ...original.map(row => dateOnlyMs(row.ts || row.date)));
    const replay = (rows, until = cutoff) => {
      let current = { ...d, balance: base.balance, unpaidInterest: base.unpaidInterest ?? Math.max(0, base.balance - base.original), interestAccruedAt: base.at, slain: false, slainAt: null, historyBase: base, log: [] };
      const log = [];
      for (const row of ordered(rows)) {
        const result = applyDebtPayment(current, row.amount, row.ts || row.date);
        if (row.amount > result.balanceBefore + .005) throw new Error('ยอดชำระเกินยอดหนี้หลังแก้ประวัติ กรุณาตรวจรายการภายหลัง');
        log.push({ ...row, amount: result.applied, interest: result.interestPaid, principal: result.principalPaid, accruedInterest: result.interest, balanceBefore: result.balanceBefore, balanceAfter: result.balanceAfter, days: result.days });
        current = result.debt;
      }
      return { ...accrueDebtToDate(current, until).debt, log };
    };
    if (Math.abs(replay(original).balance - Number(d.balance)) > .01) throw new Error('ยอดหนี้มีการปรับนอกประวัติ จึงยังคำนวณย้อนกลับอย่างถูกต้องไม่ได้');
    const nextRow = { ...old, amount: value, ts: at, date: restore ? old.date : date };
    const rows = restore ? [...original, nextRow] : remove ? original.filter(row => row.id !== id) : original.map(row => row.id === id ? nextRow : row);
    return { ...replay(rows, Math.max(cutoff, at)), logTrash: restore ? source.filter(row => row.id !== id) : remove ? [...(d.logTrash || []), old] : d.logTrash || [] };
  }

  function monthlyInterest(d) {
    const rate = monthlyDebtRate(d?.apr);
    const balance = Math.max(0, Number(d?.balance) || 0);
    const base = d?.interestMode === 'simple' ? Math.max(0, Number(d?.original) || 0)
      : d?.interestMode === 'reducing' ? Math.max(0, balance - debtUnpaidInterest(d)) : balance;
    return base * rate;
  }

  function payoffMonths(d) {
    const rate = monthlyDebtRate(d?.apr);
    const payment = Number(d?.payment) || 0;
    const balance = Number(d?.balance) || 0;
    if (balance <= 0) return 0;
    if (payment <= 0) return Infinity;
    // An outstanding interest bucket delays principal repayment. Use the same
    // monthly interest-first model as the plan instead of an annuity shortcut.
    if (d?.interestMode === 'reducing') return simulateLair([{ ...d, payMode: 'monthly' }]).months;
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
    const live = (dragons || []).filter(d => !d.archived && !d.slain && Number(d.balance) > 0.005);
    if (!live.length) return null;
    const sorted = live.slice().sort((a, b) => strategy === 'snowball'
      ? (Number(a.balance) || 0) - (Number(b.balance) || 0)
      : (Number(b.apr) || 0) - (Number(a.apr) || 0));
    return sorted[0].id;
  }

  function simulateLair(dragons, strategy = 'avalanche', extra = 0) {
    const excluded = (dragons || []).filter(d => !d.archived && !d.slain && Number(d.balance) > .005 && d.payMode === 'adhoc').length;
    const ds = (dragons || [])
      .filter(d => !d.archived && !d.slain && Number(d.balance) > 0.005 && d.payMode !== 'adhoc')
      .map(d => ({
        balance: Number(d.balance) || 0,
        apr: Number(d.apr) || 0,
        payment: Number(d.payment) || 0,
        original: Number(d.original) || 0,
        unpaidInterest: debtUnpaidInterest(d),
        interestMode: ['simple', 'reducing'].includes(d.interestMode) ? d.interestMode : 'compound'
      }));
    if (!ds.length) return { months: 0, interest: 0, never: false, excluded };
    const cap = 1200;
    let months = 0;
    let interest = 0;
    while (ds.some(d => d.balance > 0.005) && months < cap) {
      months += 1;
      let pool = Math.max(0, Number(extra) || 0);
      ds.forEach(d => { if (d.balance <= 0.005) pool += d.payment; });
      ds.forEach(d => {
        if (d.balance <= 0.005) return;
        const charge = monthlyInterest(d);
        d.balance += charge;
        d.unpaidInterest += charge;
        interest += charge;
      });
      ds.forEach(d => {
        if (d.balance <= 0.005) return;
        const paid = Math.min(d.payment, d.balance);
        pool += d.payment - paid;
        d.unpaidInterest = Math.max(0, d.unpaidInterest - paid);
        d.balance -= paid;
      });
      const live = ds.filter(d => d.balance > 0.005);
      const order = live.sort((a, b) => strategy === 'snowball' ? a.balance - b.balance : b.apr - a.apr);
      let remainingPool = pool;
      for (const d of order) {
        if (remainingPool <= 0) break;
        const pay = Math.min(remainingPool, d.balance);
        d.unpaidInterest = Math.max(0, d.unpaidInterest - pay);
        d.balance -= pay;
        remainingPool -= pay;
      }
    }
    const never = ds.some(d => d.balance > 0.005);
    return { months: never ? Infinity : months, interest: Math.round(interest * 100) / 100, never, excluded };
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
    const legacyAccruedAt = Number(data.lastAccrued) || Date.now();
    return {
      ...data,
      slayer,
      dragons: dragons.map((d, index) => {
        const type = PointyLogic.DRAGON_TYPES[d?.type] ? d.type : 'card';
        const balance = Math.max(0, Number(d?.balance) || 0);
        // Accrued interest can make the balance exceed the initial principal.
        // Raising principal on reload would inflate subsequent simple interest.
        const original = d?.original != null && Number.isFinite(Number(d.original)) ? Math.max(0, Number(d.original)) : balance;
        const payMode = d?.payMode === 'adhoc' ? 'adhoc' : 'monthly';
        return {
          ...d,
          id: String(d?.id || `d${index + 1}`),
          name: typeof d?.name === 'object' ? { th: d.name.th || d.name.en || dragonType(type).th, en: d.name.en || d.name.th || dragonType(type).en } : { th: String(d?.name || dragonType(type).th), en: String(d?.name || dragonType(type).en) },
          type,
          original,
          balance,
          apr: Math.max(0, Number(d?.apr) || 0),
          payment: payMode === 'adhoc' ? 0 : Math.max(0, d?.payment != null && d.payment !== '' && Number.isFinite(Number(d.payment)) ? Number(d.payment) : dragonType(type).minPay || 0),
          payMode,
          // Existing records without a mode retain their original compound
          // behavior; creation surfaces explicitly choose reducing for new debt.
          interestMode: ['simple', 'reducing'].includes(d?.interestMode) ? d.interestMode : 'compound',
          dueDay: payMode === 'adhoc' ? 0 : Math.max(0, Math.min(31, parseInt(d?.dueDay, 10) || 0)),
          log: Array.isArray(d?.log) ? d.log.map(row => ({
            ...row,
            id: String(row.id || ''),
            date: String(row.date || ''),
            amount: Math.max(0, Number(row.amount) || 0),
            interest: Math.max(0, Number(row.interest) || 0),
            principal: Math.max(0, Number(row.principal) || 0),
            accruedInterest: Math.max(0, Number(row.accruedInterest) || 0),
            balanceBefore: Math.max(0, Number(row.balanceBefore) || 0),
            balanceAfter: Math.max(0, Number(row.balanceAfter) || 0),
            days: Math.max(0, Number(row.days) || 0),
            ts: Number(row.ts) || 0,
            move: row.move || 'projectile'
          })) : [],
          createdAt: Number(d?.createdAt) || legacyAccruedAt,
          interestAccruedAt: Number(d?.interestAccruedAt) || Number(d?.createdAt) || legacyAccruedAt,
          slain: balance <= 0.005,
          slainAt: d?.slainAt || null
        };
      }),
      art: data.art && typeof data.art === 'object' ? data.art : {},
      lastAccrued: Number(data.lastAccrued) || Date.now(),
      stats: data.stats && typeof data.stats === 'object'
        ? { interest: Math.max(0, Number(data.stats.interest) || 0) }
        : { interest: 0 }
    };
  }

  function hpColor(pct) {
    if (pct >= 55) return { a: "oklch(0.72 0.16 150)", b: "oklch(0.58 0.16 150)" };
    if (pct >= 28) return { a: "oklch(0.78 0.15 78)", b: "oklch(0.66 0.15 70)" };
    return { a: "oklch(0.66 0.2 26)", b: "oklch(0.55 0.2 26)" };
  }

  function statusOf(hero, labels = {}) {
    if (hero.bal > 0.005) return { kind: 'guardian', icon: '🛡️', label: labels.guardian || 'Guardian', amt: hero.bal };
    if (hero.bal < -0.005) return { kind: 'debt', icon: '💸', label: labels.debt || 'Debt', amt: -hero.bal };
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
        ...e,
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
      ...c,
      id: c?.id || `camp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      tripName: c?.tripName || data?.tripName || opts.defaultTripName || '',
      participants: Array.isArray(c?.participants) ? c.participants : [],
      expenses: Array.isArray(c?.expenses) ? c.expenses.map(normalizeExpense).filter(e => e.amount > 0 && (e.paidBy || Object.keys(e.payers || {}).length) && e.sharedBy.length) : [],
      budgets: c?.budgets || {},
      heroClasses: Object.fromEntries(Object.entries(c?.heroClasses || {}).map(([name, cls]) => [name, normalizeClass(cls)])),
      heroGenders: c?.heroGenders || {},
      heroSkins: c?.heroSkins && typeof c.heroSkins === 'object' ? c.heroSkins : {},
      characterIds: c?.characterIds || {},
      guestHeroes: c?.guestHeroes && typeof c.guestHeroes === 'object' ? c.guestHeroes : {},
      promptpay: c?.promptpay || {},
      settleXp: c?.settleXp || {},
      createdAt: c?.createdAt || Date.now(),
      completedAt: c?.completedAt || null
    });
    const out = {
      ...(data || {}),
      tripName: data?.tripName || opts.defaultTripName || '',
      participants: Array.isArray(data?.participants) ? data.participants : [],
      expenses: Array.isArray(data?.expenses) ? data.expenses : [],
      budgets: data?.budgets || {},
      heroClasses: Object.fromEntries(Object.entries(data?.heroClasses || {}).map(([name, cls]) => [name, normalizeClass(cls)])),
      heroGenders: data?.heroGenders || {},
      heroSkins: data?.heroSkins && typeof data.heroSkins === 'object' ? data.heroSkins : {},
      settleXp: data?.settleXp || {},
      characterIds: data?.characterIds || {},
      guestHeroes: data?.guestHeroes && typeof data.guestHeroes === 'object' ? data.guestHeroes : {},
      promptpay: data?.promptpay || {},
      activeCampaignId: data?.activeCampaignId || data?.activeId || '',
      campaigns: Array.isArray(data?.campaigns) ? data.campaigns.map(normalizeCampaign) : [],
      admin: {
        ...(data?.admin || {}),
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
    out.settlementRecords = upgradeSettlementRecords(out);
    out.campaigns = out.campaigns.map(c => ({ ...c, settlementRecords: upgradeSettlementRecords({ ...c, activeCampaignId: c.id }) }));
    return out;
  }

  function parseImportItems(text) {
    return (text || '').split('\n').filter(line => line.trim()).map((line, i) => {
      const match = line.match(/^(.+?)[,\t;]\s*(?:฿\s*)?(-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?)\s*$/);
      if (!match) throw new Error(`แถว ${i + 1}: ใช้ ชื่อรายการ,จำนวนเงิน / Invalid import row`);
      return { desc: validateText(match[1], { label: `แถว ${i + 1}`, max: 120 }), amount: validateNumber(match[2], { label: `แถว ${i + 1}`, min: .01 }) };
    });
  }

  function spreadsheetExpense(desc, amountText, payerText, sharedText) {
    if (/^(total|รวม)$/i.test(desc.trim()) && !payerText.trim() && !sharedText.trim()) return null;
    const amount = validateNumber(amountText, { label: 'จำนวนเงิน', min: .01 });
    const parse = text => {
      const entries = text.split(/;|,\s*(?=[^,]+:)/).map(part => {
        const match = part.trim().match(/^(.+?):\s*(\d+(?:\.\d+)?)\s*$/);
        if (!match) throw new Error('อ่านยอดรายคนจาก Excel ไม่ได้');
        return [match[1].trim(), Number(match[2])];
      });
      if (new Set(entries.map(([name]) => name)).size !== entries.length) throw new Error('มีชื่อซ้ำในยอดรายคน');
      return Object.fromEntries(entries);
    };
    const payers = payerText.includes(':') ? parse(payerText) : { [payerText.trim()]: amount };
    const weights = sharedText.includes(':') ? parse(sharedText) : null;
    const sharedBy = weights ? Object.keys(weights) : sharedText.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    return { desc, amount, paidBy: Object.keys(payers)[0], payers, sharedBy: sharedBy.length ? sharedBy : Object.keys(payers), ...(weights ? { split: { mode: 'exact', weights } } : {}) };
  }

  function validateLedgerExpense(e, participants) {
    if (typeof e?.desc !== 'string' || !e.desc.trim()) throw new Error('ใส่ชื่อรายการ');
    if (!Number.isFinite(e.amount) || e.amount <= 0) throw new Error('จำนวนเงินต้องมากกว่า 0');
    validateText(e.desc, { label: 'ชื่อรายการ', max: 120 });
    validateNumber(e.amount, { label: 'จำนวนเงิน', min: .01 });
    if (!Array.isArray(e.sharedBy) || !e.sharedBy.length || e.sharedBy.some(n => !participants.includes(n))) throw new Error('เลือกผู้ร่วมจ่ายจากสมาชิกในบอร์ด');
    if (new Set(e.sharedBy).size !== e.sharedBy.length) throw new Error('ผู้ร่วมจ่ายซ้ำกัน');
    if (e.payers && Object.values(e.payers).some(n => !Number.isFinite(n) || n < 0)) throw new Error('ยอดผู้จ่ายต้องไม่ติดลบ');
    Object.values(e.payers || {}).forEach(n => validateNumber(n, { label: 'ยอดผู้จ่าย' }));
    const payers = payerMap(e);
    if (!Object.keys(payers).length || Object.keys(payers).some(n => !participants.includes(n))) throw new Error('เลือกผู้สำรองจ่าย');
    if (Math.abs(Object.values(payers).reduce((s, n) => s + n, 0) - e.amount) > 0.005) throw new Error('ยอดผู้สำรองจ่ายรวมต้องเท่ากับยอดรายการ');
    const mode = e.split?.mode || 'equal';
    if (!['equal', 'exact', 'percent', 'shares', 'items'].includes(mode)) throw new Error('รูปแบบการหารไม่ถูกต้อง');
    const weights = e.sharedBy.map(n => e.split?.weights?.[n] ?? 0);
    if (weights.some(n => !Number.isFinite(n) || n < 0)) throw new Error('สัดส่วนต้องเป็นตัวเลขไม่ติดลบ');
    if (['exact', 'percent', 'shares'].includes(mode)) weights.forEach(n => validateNumber(n, { label: 'สัดส่วน', decimals: mode === 'exact' ? 2 : 4, ...(mode === 'percent' ? { max: 100 } : {}) }));
    const total = weights.reduce((s, n) => s + n, 0);
    if (mode === 'exact' && Math.abs(total - e.amount) > 0.005) throw new Error('ยอดหารรวมต้องเท่ากับยอดรายการ');
    if (mode === 'percent' && Math.abs(total - 100) > 0.005) throw new Error('เปอร์เซ็นต์รวมต้องเท่ากับ 100');
    if (mode === 'shares' && total <= 0) throw new Error('ใส่สัดส่วนอย่างน้อยหนึ่งคน');
    if (mode === 'items') {
      const items = e.split?.items || [];
      if (!Array.isArray(items) || !items.length || items.some(i => !Number.isFinite(i.amount) || i.amount <= 0 || !Array.isArray(i.claimedBy) || new Set(i.claimedBy).size !== i.claimedBy.length || i.claimedBy.some(n => !e.sharedBy.includes(n)))) throw new Error('ตรวจจำนวนเงินและผู้รับของแต่ละรายการ');
      items.forEach(i => { validateText(i.name, { label: 'ชื่อของ', max: 120 }); validateNumber(i.amount, { label: 'ราคาของ', min: .01 }); });
      if (Math.abs(items.reduce((s, i) => s + i.amount, 0) - e.amount) > 0.005) throw new Error('ยอดของแต่ละชิ้นต้องรวมเท่ากับยอดรายการ');
    }
    if (e.date) validateDate(e.date);
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

  // Round actual shares to spendable satang. Correct the smallest rounding error
  // first; on a tie the payer absorbs the residual, then participant order wins.
  function roundShares(raw, preferred = []) {
    const names = Object.keys(raw);
    const units = names.map(name => Math.max(0, raw[name] * 100));
    const rounded = units.map(value => Math.round(value));
    let residual = Math.round(units.reduce((sum, value) => sum + value, 0)) - rounded.reduce((sum, value) => sum + value, 0);
    while (residual) {
      const step = residual > 0 ? 1 : -1;
      const ranked = names.map((name, i) => ({ i, error: step * (units[i] - rounded[i]), preferred: preferred.includes(name) ? preferred.indexOf(name) : preferred.length + i }))
        .filter(row => step > 0 || rounded[row.i] > 0)
        .sort((a, b) => Math.abs(a.error - b.error) > 1e-7 ? b.error - a.error : a.preferred - b.preferred);
      if (!ranked.length) break;
      rounded[ranked[0].i] += step; residual -= step;
    }
    return Object.fromEntries(names.map((name, i) => [name, rounded[i] / 100]));
  }

  function splitShares(e, validNames = null) {
    const parts = [...new Set(e.sharedBy || [])].filter(name => !validNames || validNames.includes(name));
    const out = {};
    if (!parts.length) return out;
    const mode = e.split?.mode || 'equal';
    const weights = e.split?.weights || {};
    const preferred = parts.filter(name => Number(payerMap(e)[name]) > 0);
    if (mode === 'items') {
      const items = Array.isArray(e.split?.items) ? e.split.items : [];
      items.forEach(it => {
        const amount = Math.max(0, Number(it.amount) || 0);
        if (!amount) return;
        let claim = [...new Set(Array.isArray(it.claimedBy) ? it.claimedBy : [])].filter(name => parts.includes(name));
        if (!claim.length) claim = parts;
        if (!claim.length) return;
        const shares = roundShares(Object.fromEntries(claim.map(name => [name, amount / claim.length])), preferred);
        claim.forEach(name => { out[name] = (out[name] || 0) + shares[name]; });
      });
      return roundShares(out, preferred);
    }
    if (mode === 'exact') {
      let sum = 0;
      parts.forEach(name => {
        out[name] = Math.max(0, Number(weights[name]) || 0);
        sum += out[name];
      });
      const remainder = e.amount - sum;
      if (Math.abs(remainder) > .005) parts.forEach(name => { out[name] += remainder / parts.length; });
      return roundShares(out, preferred);
    }
    if (mode === 'shares' || mode === 'percent') {
      const totalWeight = parts.reduce((sum, name) => sum + Math.max(0, Number(weights[name]) || 0), 0);
      if (totalWeight > 0) {
        parts.forEach(name => { out[name] = e.amount * (Math.max(0, Number(weights[name]) || 0) / totalWeight); });
        return roundShares(out, preferred);
      }
    }
    parts.forEach(name => { out[name] = e.amount / parts.length; });
    return roundShares(out, preferred);
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
      const xp = Math.round((Number(baseXp(name)) || 0) + splitFrontedXp(s.gen) + (Number(settleXp[name]) || 0));
      const level = levelFromXp(xp);
      return { name, cls: classOf(name), budget, paid: s.paid, share: s.share, gen: Math.round(s.gen * 100) / 100, quests: s.quests, bal: s.paid - s.share, remaining, over: remaining < 0, hp, xp, level, reward: rewardFor(level.lvl) };
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
    const totals = { paid: 0, share: 0, fronted: 0, frontedXp: 0, balance: 0, quests: 0, boards: 0, settledBoards: 0, activeBoards: 0, settlementXp: 0 };
    const boardRows = [];
    const adminBoards = [];
    let latest = null;

    boards.forEach(entry => {
      const boardId = String(entry.id || entry.urlId || '');
      const state = normalizeTripState(entry.data || entry, { defaultTripName: boardFallback });
      const matchNames = characterNamesForId(state, id);
      const admin = state.admin || {};
      if (!matchNames.length && String(admin.characterId || '') === id) {
        matchNames.push(admin.adminName || record?.name || id);
      }
      if (!matchNames.length) return;
      const updatedAt = timestampValue(entry.updatedAt || entry.data?.updatedAt || state.updatedAt || state.admin?.createdAt);
      const createdAt = timestampValue(entry.createdAt || entry.data?.createdAt || state.createdAt || state.admin?.createdAt);
      const party = computeParty(state, {
        classOf: name => normalizeClass(state.heroClasses?.[name] || record?.class || PointyLogic.CLASS_ORDER[hashOf(name) % PointyLogic.CLASS_ORDER.length]),
        baseXp: () => 0
      });
      matchNames.forEach(name => {
        names.add(name);
        const hero = party.find(p => p.name === name) || { paid: 0, share: 0, gen: 0, bal: 0, quests: 0, xp: 0, cls: state.heroClasses?.[name] || record?.class };
        const isAdminLinked = String(admin.characterId || '') === id || (admin.adminName && admin.adminName === name);
        const boardTotal = state.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const settled = state.expenses.length > 0 && pendingSettlements(state).length === 0;
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
          balance: pendingSettlements(state).reduce((sum, tx) => sum + (tx.to === name ? tx.amount : 0) - (tx.from === name ? tx.amount : 0), 0),
          quests: hero.quests || 0,
          boardTotal,
          settled,
          adminId: admin.adminId || '',
          adminName: admin.adminName || '',
          isAdminLinked,
          archived: !!(state.archived || entry.data?.archived || entry.archived),
          members: (state.participants || []).length,
          createdAt,
          updatedAt
        };
        boardRows.push(row);
        totals.paid += row.paid;
        totals.share += row.share;
        totals.fronted += row.fronted;
        totals.frontedXp += splitFrontedXp(row.fronted);
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
    const totalXp = Math.round(Number(record?.xp) || (Object.values(record?.trips || {}).reduce((sum, xp) => sum + (Number(xp) || 0), 0) + debtXp) || totals.frontedXp + totals.settlementXp + debtXp);
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

  function globalSettleUp(party) {
    const cred = party.filter(p => p.bal > 0.005).map(p => ({ name: p.name, amt: p.bal })).sort((a,b) => b.amt - a.amt);
    const debt = party.filter(p => p.bal < -0.005).map(p => ({ name: p.name, amt: -p.bal })).sort((a,b) => b.amt - a.amt);
    const out = [];
    let i = 0, j = 0;
    while (i < debt.length && j < cred.length) {
      const amt = Math.min(debt[i].amt, cred[j].amt);
      if (amt > 0.005) out.push({ from: debt[i].name, to: cred[j].name, amount: amt });
      debt[i].amt -= amt;
      cred[j].amt -= amt;
      if (debt[i].amt < 0.005) i++;
      if (cred[j].amt < 0.005) j++;
    }
    return out;
  }

  function settleUp(party, state = null) {
    if (!state?.expenses?.length || !state?.participants?.length) return globalSettleUp(party);
    const participants = state.participants || [];
    const valid = new Set(participants);
    const pair = {};
    state.expenses.forEach(expense => {
      const shares = splitShares(expense, participants);
      const payers = Object.entries(payerMap(expense)).filter(([name, amount]) => valid.has(name) && Number(amount) > 0)
        .sort(([a], [b]) => participants.indexOf(a) - participants.indexOf(b));
      const totalPaid = payers.reduce((sum, [, amount]) => sum + (Number(amount) || 0), 0);
      if (totalPaid <= 0) return;
      // Include self-funded cells while rounding so every user's share and every
      // payer's contribution are conserved. Only then omit self-transfers.
      const rows = Object.entries(shares).filter(([name]) => valid.has(name));
      const remainingShares = rows.map(([, share]) => Math.round(share * 100));
      const remainingPaid = payers.map(([, paid]) => Math.round(paid * 100));
      const cells = rows.flatMap(([from, share], i) => payers.map(([to, paid], j) => {
        const exact = share * 100 * paid / totalPaid;
        const amount = Math.floor(exact + 1e-9);
        remainingShares[i] -= amount; remainingPaid[j] -= amount;
        return { from, to, i, j, amount, fraction: exact - amount };
      }));
      cells.sort((a,b) => b.fraction - a.fraction || a.i - b.i || a.j - b.j);
      while (remainingShares.some(value => value > 0)) {
        const cell = cells.find(c => remainingShares[c.i] > 0 && remainingPaid[c.j] > 0);
        if (!cell) break; // Malformed legacy contributions must not loop forever.
        cell.amount++; remainingShares[cell.i]--; remainingPaid[cell.j]--;
        cell.fraction -= 1;
        cells.sort((a,b) => b.fraction - a.fraction || a.i - b.i || a.j - b.j);
      }
      cells.forEach(({from, to, amount}) => {
        if (from === to || !amount) return;
        const key = `${from}\u0000${to}`;
        pair[key] = (pair[key] || 0) + amount;
      });
    });
    const out = [];
    const seen = new Set();
    Object.keys(pair).forEach(key => {
      if (seen.has(key)) return;
      const [from, to] = key.split('\u0000');
      const reverse = `${to}\u0000${from}`;
      seen.add(key);
      seen.add(reverse);
      const net = (pair[key] || 0) - (pair[reverse] || 0);
      const amount = Math.abs(net) / 100;
      if (amount <= 0.005) return;
      out.push(net > 0 ? { from, to, amount } : { from: to, to: from, amount });
    });
    if (!out.length) return [];
    const totalOut = out.reduce((acc, tx) => {
      acc[tx.from] = (acc[tx.from] || 0) + tx.amount;
      return acc;
    }, {});
    return out.sort((a, b) =>
      (totalOut[b.from] || 0) - (totalOut[a.from] || 0) ||
      b.amount - a.amount ||
      participants.indexOf(a.from) - participants.indexOf(b.from) ||
      participants.indexOf(a.to) - participants.indexOf(b.to)
    );
  }

  // Revision is audit provenance; recorded repayments survive later expense edits.
  function settlementRevision(state) {
    return tripContentKey({ campaign: state.activeCampaignId || '', participants: state.participants,
      expenses: (state.expenses || []).map(e => ({ id: e.id, amount: e.amount, paidBy: e.paidBy,
        payers: e.payers || null, sharedBy: e.sharedBy, split: e.split || { mode: 'equal' } })) });
  }
  function promptPayPayload(target, amount) {
    const digits = String(target || '').replace(/\D/g, '');
    if (!/^(?:\d{10}|\d{13}|\d{15})$/.test(digits) || !Number.isFinite(amount) || amount < 0) throw new Error('Invalid PromptPay input');
    const tlv = (tag, value) => tag + String(String(value).length).padStart(2, '0') + value;
    const account = digits.length === 13 ? tlv('02', digits) : digits.length === 15 ? tlv('03', digits) : tlv('01', '0066' + (digits[0] === '0' ? digits.slice(1) : digits));
    const payload = tlv('00', '01') + tlv('01', amount > 0 ? '12' : '11') + tlv('29', tlv('00', 'A000000677010111') + account) + tlv('58', 'TH') + tlv('53', '764') + (amount > 0 ? tlv('54', amount.toFixed(2)) : '') + '6304';
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) { crc ^= payload.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) crc = ((crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff; }
    return payload + crc.toString(16).toUpperCase().padStart(4, '0');
  }
  function pendingSettlements(state) {
    const obligations = settleUp(computeParty(state), state);
    const participants = state.participants || [];
    const pairs = new Map();
    const add = (from, to, cents) => {
      const names = [from, to].sort();
      const key = JSON.stringify(names);
      const pair = pairs.get(key) || { names, cents: 0 };
      pair.cents += from === names[0] ? cents : -cents;
      pairs.set(key, pair);
    };
    obligations.forEach(t => add(t.from, t.to, Math.round(t.amount * 100)));
    const seen = new Set();
    validRepayments({ ...state, settlementRecords: upgradeSettlementRecords(state) }).filter(r => r.kind === 'repayment').forEach(r => {
      if (r.id && seen.has(r.id)) return;
      if (r.id) seen.add(r.id);
      add(r.from, r.to, -Math.round(r.amount * 100));
    });
    const transfers = [...pairs.values()].filter(p => p.cents !== 0).map(p => ({
      from: p.names[p.cents > 0 ? 0 : 1], to: p.names[p.cents > 0 ? 1 : 0], amount: Math.abs(p.cents) / 100
    }));
    const totalOut = Object.fromEntries(participants.map(name => [name, transfers.filter(t => t.from === name).reduce((sum,t) => sum + t.amount, 0)]));
    return transfers.sort((a,b) => totalOut[b.from] - totalOut[a.from] || b.amount - a.amount || participants.indexOf(a.from) - participants.indexOf(b.from) || participants.indexOf(a.to) - participants.indexOf(b.to));
  }
  function validRepayments(state) {
    const participants = new Set(state.participants || []);
    return (Array.isArray(state.settlementRecords) ? state.settlementRecords : []).filter(r => r && r.from !== r.to && participants.has(r.from) && participants.has(r.to) && Number.isFinite(Number(r.amount)) && Number(r.amount) >= .005);
  }
  function upgradeSettlementRecords(state) {
    const records = (Array.isArray(state.settlementRecords) ? state.settlementRecords : []).filter(r => r && typeof r === 'object' && !Array.isArray(r));
    if (records.every(r => r?.kind)) return records;
    const eligible = new Set(validRepayments(state));
    const revision = settlementRevision(state);
    const obligations = settleUp(computeParty(state), state);
    const converted = new Set();
    // Old records were revision-scoped checkmarks. Preserve the currently
    // settled pairs once, rather than inventing refunds by summing old rounds.
    return records.map((r, i) => {
      if (!r || typeof r !== 'object' || r.kind) return r;
      const pair = JSON.stringify([r.from, r.to]);
      const obligation = eligible.has(r) && r.revision === revision && !converted.has(pair) && obligations.find(t => t.from === r.from && t.to === r.to);
      if (obligation) converted.add(pair);
      return { ...r, id: r.id || `legacy-${r.at || 0}-${i}`, kind: obligation ? 'repayment' : 'legacy_confirmation', ...(obligation ? { amount: obligation.amount } : {}) };
    });
  }
  function confirmSettlement(state, from, to, now = Date.now()) {
    const transfer = pendingSettlements(state).find(t => t.from === from && t.to === to);
    if (!transfer) return state;
    // One reward per pair per campaign. Corrections, top-ups and refunds must
    // not create an edit/pay/refund loop that farms Character XP.
    const rewarded = validRepayments(state).some(r => (r.from === from && r.to === to) || (r.from === to && r.to === from));
    return { ...state, settlementRecords: [...upgradeSettlementRecords(state), { ...transfer, id: `repayment-${now.toString(36)}-${Math.random().toString(36).slice(2, 9)}`, kind: 'repayment', revision: settlementRevision(state), at: now }],
      settleXp: { ...(state.settleXp || {}), [from]: (Number(state.settleXp?.[from]) || 0) + (rewarded ? 0 : PointyLogic.SETTLE_BONUS_PAYER),
        [to]: (Number(state.settleXp?.[to]) || 0) + (rewarded ? 0 : PointyLogic.SETTLE_BONUS_PAYEE) } };
  }

  function moneySum(rows) { return rows.reduce((sum, row) => sum + Math.round((Number(row.amount) || 0) * 100), 0) / 100; }
  function treasurySpent(state) { return moneySum(state.expenses || []); }
  function treasuryBillPaid(state, billId) { return (state.expenses || []).some(e => e.billId === billId && String(e.date).slice(0, 7) === state.month); }
  function treasuryProjection(state, today = new Date()) {
    const date = new Date(today); const dim = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); const dom = Math.max(1, date.getDate()); const daysLeft = Math.max(0, dim - dom);
    const spent = treasurySpent(state); const unpaidBills = moneySum((state.bills || []).filter(b => !b.archived && !treasuryBillPaid(state, b.id)));
    const variable = moneySum((state.expenses || []).filter(e => !e.billId));
    const projected = Math.round((spent + unpaidBills + variable / dom * daysLeft) * 100) / 100; const surplus = Math.round(((Number(state.income) || 0) - projected) * 100) / 100;
    const availableCents = Math.round((Number(state.income) || 0) * 100) - Math.round(spent * 100) - Math.round(unpaidBills * 100);
    const dailyLeft = Math.max(0, Math.floor(availableCents / (daysLeft + 1)) / 100);
    return { dim, dom, daysLeft, spent, unpaidBills, projected, surplus, onTrack: surplus >= 0, dailyLeft };
  }
  function treasuryRewardLedger(state) {
    const stats = state.stats || {};
    const wonMonths = new Set([...(stats.wonMonths || []), ...(state.history || []).filter(h => h.won).map(h => h.month)].filter(Boolean));
    const legacyMonthsWon = stats.legacyMonthsWon ?? Math.max(0, (Number(stats.monthsWon) || 0) - wonMonths.size);
    // Detailed history is capped at 12 months; compact date keys retain earned
    // days without counting repeated entries or guessing dates of legacy rows.
    const loggedDays = new Set([...(stats.loggedDays || []).filter(d => d.slice(0, 7) !== state.month),
      ...(state.history || []).filter(h => h.month !== state.month).flatMap(h => (h.expenses || []).map(e => e.date)),
      ...(state.expenses || []).map(e => e.date)].filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)));
    return { wonMonths, legacyMonthsWon, loggedDays };
  }
  function treasuryClose(state, nextMonth = state.month) {
    const spent = treasurySpent(state); const income = Number(state.income) || 0;
    const previous = (state.history || []).find(row => row.month === state.month) || {};
    const row = { ...previous, month: state.month, income, spent, surplus: Math.round((income - spent) * 100) / 100, won: spent <= income, expenses: (state.expenses || []).map(e => ({ ...e })) };
    const history = [row, ...(state.history || []).filter(h => h.month !== state.month)].sort((a, b) => String(b.month).localeCompare(String(a.month))).slice(0, 12);
    const rewards = treasuryRewardLedger(state);
    if (row.won) rewards.wonMonths.add(state.month); else rewards.wonMonths.delete(state.month);
    return { ...state, history, month: nextMonth, expenses: nextMonth === state.month ? state.expenses : [], stats: { ...state.stats,
      wonMonths: [...rewards.wonMonths].sort(), legacyMonthsWon: rewards.legacyMonthsWon,
      monthsWon: rewards.legacyMonthsWon + rewards.wonMonths.size, loggedDays: [...rewards.loggedDays].sort() } };
  }
  // Compatibility name: Treasury earns profile Reputation, never Character XP.
  function treasuryXp(state) {
    const rewards = treasuryRewardLedger(state);
    return Math.round((rewards.legacyMonthsWon + rewards.wonMonths.size) * 500 + (Number(state.stats?.onTime) || 0) * 80 + rewards.loggedDays.size * 10);
  }

  const PLAYER_ACHIEVEMENTS = [
    { id: 'first_quest', icon: '📜', th: ['ก้าวแรก', 'บันทึกเควสแรกของคุณ'], en: ['First Steps', 'Log your first quest'], test: c => c.quests >= 1 },
    { id: 'party5', icon: '🛡️', th: ['รวมพล', 'ปาร์ตี้ที่มีฮีโร่ 5 คนขึ้นไป'], en: ['Full Party', 'A party of 5+ heroes'], test: c => c.maxPartySize >= 5, prog: c => [Math.min(c.maxPartySize, 5), 5] },
    { id: 'balanced', icon: '⚖️', th: ['สมดุล', 'ปรับสมดุลปาร์ตี้จนจบเควส'], en: ['Even Steven', 'Fully settle a quest'], test: c => c.completed >= 1 },
    { id: 'quest_master', icon: '🗺️', th: ['เจ้าแห่งเควส', 'จบเควสครบ 3 ทริป'], en: ['Quest Master', 'Complete 3 quests'], test: c => c.completed >= 3, prog: c => [Math.min(c.completed, 3), 3] },
    { id: 'treasurer', icon: '💰', th: ['ขุนคลัง', 'บันทึกค่าใช้จ่ายรวม ฿50,000 ใน 5 รายการ'], en: ['Treasurer', 'Log ฿50,000 across 5 expenses'], test: c => c.totalLogged >= 50000 && c.quests >= 5, prog: c => [Math.min(c.totalLogged, 50000), 50000] },
    { id: 'generous', icon: '🤝', th: ['ใจบุญ', 'ออกทองให้คนอื่นรวม ฿20,000 และจบเควส'], en: ['Generous Soul', 'Front ฿20,000 and complete a quest'], test: c => c.fronted >= 20000 && c.completed >= 1, prog: c => [Math.min(c.fronted, 20000), 20000] },
    { id: 'first_strike', icon: '⚔️', th: ['ดาบแรก', 'ฟันมังกรครั้งแรก'], en: ['First Strike', 'Land your first dragon strike'], test: c => c.strikes >= 1 },
    { id: 'slayer', icon: '🐉', th: ['นักล่ามังกร', 'ปราบมังกรตัวแรก'], en: ['Dragonslayer', 'Slay your first dragon'], test: c => c.slain >= 1 },
    { id: 'lair_cleared', icon: '🏆', th: ['ปลอดหนี้', 'ปราบมังกรจริงทุกตัวในถ้ำ'], en: ['Lair Cleared', 'Slay every real dragon'], test: c => c.realDragonsSlain >= 1 && c.liveDragons === 0 },
    { id: 'heavy_hit', icon: '💥', th: ['หมัดหนัก', 'จ่ายหนี้รวม ฿50,000 ใน 3 ครั้งขึ้นไป'], en: ['Heavy Hitter', 'Pay ฿50,000 across 3+ strikes'], test: c => c.reclaimed >= 50000 && c.strikes >= 3, prog: c => [Math.min(c.reclaimed, 50000), 50000] },
    { id: 'deal_hunter', icon: '🔍', th: ['นักล่าดีล', 'ประลองราคา 3 รายการ'], en: ['Deal Hunter', 'Run 3 price showdowns'], test: c => c.showdowns >= 3, prog: c => [Math.min(c.showdowns, 3), 3] },
    { id: 'bargain', icon: '👑', th: ['ดีลในตำนาน', 'เทียบ 3 ร้านแล้วเจอดีลประหยัด 40%+'], en: ['Bargain Legend', 'Compare 3 merchants and save 40%+'], test: c => c.qualifiedBargainRescue >= 40 },
    { id: 'vault_keeper', icon: '🏦', th: ['ผู้พิทักษ์คลัง', 'บันทึกรายจ่ายในคลังหลวงครั้งแรก'], en: ['Vault Keeper', 'Log your first treasury expense'], test: c => (c.trLogged || 0) >= 1 },
    { id: 'under_budget', icon: '🛡️', th: ['คุมงบสำเร็จ', 'ปิดเดือนแบบไม่เกินงบ'], en: ['Under Budget', 'Finish a month under budget'], test: c => (c.monthsWon || 0) >= 1 },
    { id: 'frugal_legend', icon: '💎', th: ['ตำนานประหยัด', 'คุมงบได้ 3 เดือน'], en: ['Frugal Legend', 'Win 3 budget months'], test: c => (c.monthsWon || 0) >= 3, prog: c => [Math.min(c.monthsWon || 0, 3), 3] },
    { id: 'streak3', icon: '🔥', th: ['มาแรง', 'เข้าเล่นต่อเนื่อง 3 วัน'], en: ['On a Roll', 'A 3-day streak'], test: c => (c.streak || 0) >= 3, prog: c => [Math.min(c.streak || 0, 3), 3] },
    { id: 'streak7', icon: '📅', th: ['ขาประจำ', 'เข้าเล่นต่อเนื่อง 7 วัน'], en: ['Devoted', 'A 7-day streak'], test: c => (c.streak || 0) >= 7, prog: c => [Math.min(c.streak || 0, 7), 7] },
    { id: 'level5', icon: '⭐', th: ['ผู้กล้า', 'ถึงเลเวลรวม 5'], en: ['Rising Hero', 'Reach overall level 5'], test: c => c.level.lvl >= 5, prog: c => [Math.min(c.level.lvl, 5), 5] },
    { id: 'level10', icon: '🌟', th: ['ตำนาน', 'ถึงเลเวลรวม 10'], en: ['Legend', 'Reach overall level 10'], test: c => c.level.lvl >= 10, prog: c => [Math.min(c.level.lvl, 10), 10] }
  ];

  function campaignsFromTrip(data) {
    const state = data || {};
    const campaigns = Array.isArray(state.campaigns) && state.campaigns.length ? state.campaigns : [state];
    return campaigns.map(c => ({
      activeCampaignId: c.id || state.activeCampaignId || '',
      tripName: c.tripName || state.tripName || '',
      participants: Array.isArray(c.participants) ? c.participants : (state.participants || []),
      expenses: Array.isArray(c.expenses) ? c.expenses : [],
      budgets: c.budgets || state.budgets || {},
      heroClasses: c.heroClasses || state.heroClasses || {},
      characterIds: c.characterIds || state.characterIds || {},
      settleXp: c.settleXp || state.settleXp || {},
      settlementRecords: c.settlementRecords || [],
      completedAt: c.completedAt || null
    }));
  }
  function computePartyForCampaign(c) {
    if (!PointyLogic?.computeParty) return [];
    return PointyLogic.computeParty(c, { classOf: name => c.heroClasses?.[name] || 'warrior' });
  }
  function playerProgress(boards = [], character = {}, modules = {}, opts = {}) {
    const scoped = opts.scoped !== false;
    const characterId = String(character?.id || opts.userId || '');
    let fronted = 0, settleR = 0, quests = 0, completed = 0, maxPartySize = 0, totalLogged = 0;
    let splitActivityRep = 0, splitFrontedRep = 0, splitSettledRep = 0, splitMultiRep = 0;
    boards.forEach(entry => {
      campaignsFromTrip(entry.data).forEach(c => {
        const participantName = Object.keys(c.characterIds || {}).find(name => String(c.characterIds?.[name]) === characterId)
          || (c.participants || []).find(name => name === character?.name || name === opts.accountName);
        if (scoped && !participantName) return;
        const party = computePartyForCampaign(c);
        const heroes = scoped ? party.filter(hero => hero.name === participantName) : party;
        const visibleExpenses = scoped
          ? (c.expenses || []).filter(e => (e.sharedBy || []).includes(participantName) || e.paidBy === participantName || e.payers?.[participantName])
          : (c.expenses || []);
        const isSettled = visibleExpenses.length > 0 && PointyLogic?.settleUp && pendingSettlements(c).length === 0;
        heroes.forEach(hero => {
          fronted += Number(hero.gen) || 0;
          settleR += Number(c.settleXp?.[hero.name]) || 0;
          splitFrontedRep += Math.min(100, Math.max(0, Number(hero.gen) || 0) / 50);
        });
        quests += visibleExpenses.length;
        totalLogged += visibleExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        splitActivityRep += Math.min(50, visibleExpenses.length * 10);
        if (isSettled) {
          splitSettledRep += 250;
          if ((c.participants || []).length >= 3) splitMultiRep += 100;
        }
        if (c.completedAt) completed += 1;
        maxPartySize = Math.max(maxPartySize, participantName ? (c.participants || []).length : scoped ? 0 : (c.participants || []).length);
      });
    });

    const debt = modules.debt || { dragons: [] };
    const dragons = debt.dragons || [];
    let reclaimed = 0, biggestHit = 0, strikes = 0, slain = 0, realDragonsSlain = 0, debtPaymentRep = 0;
    dragons.forEach(d => {
      (d.log || []).forEach(row => {
        const amount = Number(row.amount) || 0;
        reclaimed += amount;
        debtPaymentRep += Math.min(300, amount / 10);
        strikes += 1;
        biggestHit = Math.max(biggestHit, amount);
      });
      if (d.slain) slain += 1;
      if (d.slain && Math.max(Number(d.original) || 0, Number(d.balance) || 0) >= 5000) realDragonsSlain += 1;
    });
    const liveDragons = dragons.filter(d => !d.archived && !d.slain && Number(d.balance) > .005).length;
    const interestFed = Number(debt.stats?.interest) || 0;

    let showdowns = 0, merchants = 0, bestRescue = 0, qualifiedBargainRescue = 0, compareReputation = 0;
    (modules.comparisons || []).forEach(cmp => {
      const meaningfulOffers = (cmp.offers || []).filter(o => normalizedOffer(o, cmp).valid);
      merchants += meaningfulOffers.length;
      if (meaningfulOffers.length >= 2) {
        showdowns += 1;
        compareReputation += 80 + Math.min(40, meaningfulOffers.length * 10);
        const ranked = PointyLogic?.rankOffers ? PointyLogic.rankOffers(cmp.offers, cmp) : [];
        const best = ranked.find(o => o.isBest);
        if (best) bestRescue = Math.max(bestRescue, best.savePct || 0);
        const hasMeaningfulSpend = meaningfulOffers.some(o => Number(o.price) >= 100);
        if (best && meaningfulOffers.length >= 3 && hasMeaningfulSpend) {
          qualifiedBargainRescue = Math.max(qualifiedBargainRescue, best.savePct || 0);
        }
      }
    });

    const treasury = modules.treasury || {};
    const trStats = treasury.stats || {};
    const treasuryRewards = treasuryRewardLedger(treasury);
    const monthsWon = treasuryRewards.legacyMonthsWon + treasuryRewards.wonMonths.size;
    const trLogged = Number(trStats.logged) || 0;
    const trOnTime = Number(trStats.onTime) || 0;
    const treasuryReputation = treasuryXp(treasury);
    const debtReputation = Math.round(debtPaymentRep + slain * 600);
    const splitReputation = Math.round(splitActivityRep + splitFrontedRep + splitSettledRep + splitMultiRep);
    const reputation = Math.round(splitReputation + debtReputation + treasuryReputation + compareReputation);
    return {
      reputation,
      renown: reputation,
      level: levelFromReputation(reputation),
      fronted: Math.round(fronted),
      splitReputation,
      splitFrontedRep: Math.round(splitFrontedRep),
      splitSettledRep,
      settleR: Math.round(settleR),
      quests,
      completed,
      maxPartySize,
      totalLogged: Math.round(totalLogged),
      reclaimed: Math.round(reclaimed),
      biggestHit: Math.round(biggestHit),
      strikes,
      slain,
      realDragonsSlain,
      liveDragons,
      interestFed: Math.round(interestFed),
      debtReputation,
      showdowns,
      merchants,
      bestRescue,
      qualifiedBargainRescue,
      dragonsTotal: dragons.length,
      monthsWon,
      trLogged,
      trOnTime,
      treasuryXp: treasuryReputation,
      treasuryReputation,
      compareReputation,
      streak: opts.streak || 0
    };
  }

  function nextActivity(previous = {}, date = new Date()) {
    const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = ymd(date); const yesterday = new Date(date); yesterday.setDate(yesterday.getDate() - 1);
    const streak = previous.lastVisit === today ? Number(previous.streak) || 1 : previous.lastVisit === ymd(yesterday) ? (Number(previous.streak) || 0) + 1 : 1;
    return { ...previous, lastVisit: today, streak, bestStreak: Math.max(Number(previous.bestStreak) || 0, streak) };
  }
  Object.assign(PointyLogic, {
    nextActivity,
    PLAYER_ACHIEVEMENTS, playerProgress,
    treasurySpent, treasuryBillPaid, treasuryProjection, treasuryClose, treasuryXp,
    debtDueStatus,
    settlementRevision,
    promptPayPayload,
    pendingSettlements,
    confirmSettlement,
    hashOf,
    cleanFirestoreData,
    tripContentKey,
    approxEqual,
    parseNumberInput,
    formatNumberInput,
    formatNumberInputElement,
    validateNumber,
    validateOfferInput,
    validateModuleBackupValue,
    validateText,
    validateDate,
    readField,
    normalizeUnit,
    groupOf,
    groupForCmp,
    normalizeComparison,
    normalizedOffer,
    rankOffers,
    normalizeClass,
    levelFrom,
    levelFromThresholds,
    levelFromXp,
    levelFromReputation,
    levelFromRenown,
    rewardFor,
    splitFrontedXp,
    hpColor,
    statusOf,
    normalizeTripState,
    parseImportItems,
    spreadsheetExpense,
    validateLedgerExpense,
    payerMap,
    splitShares,
    computeParty,
    buildCharacterProfile,
    dragonType,
    monthlyDebtRate,
    dailyDebtRate,
    dateOnlyMs,
    daysBetween,
    clampedDueDay,
    dueDateForMonth,
    dailyInterest,
    accrueDebtToDate,
    applyDebtPayment,
    reviseDebtLog,
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
