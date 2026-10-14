const STORE_KEY = 'pointy_compare_v2';
const ITEM_ICONS = window.ITEM_ICON_IDS || window.ITEM_ICONS || ["🥛","🧴","🍚","🍫","☕","🧻","🥤","🍜","🔋","💊","🧃","🍞"];
const UNIT_GROUPS = PointyLogic.UNIT_GROUPS;
const BASE_UNITS = ['ml', 'g', 'm', 'ชิ้น'];
const UNIT_ALIAS = PointyLogic.UNIT_ALIAS;
const RARITY = {
  legendary: { th: "ในตำนาน", en: "Legendary", hue: 42, glyph: "👑" },
  epic: { th: "หายาก", en: "Epic", hue: 285, glyph: "💎" },
  rare: { th: "ดี", en: "Rare", hue: 235, glyph: "🔷" },
  common: { th: "ธรรมดา", en: "Common", hue: 30, glyph: "⚪" }
};
const MAX_DRAFT_OFFERS = 6;
let comparisons = loadState();
let draftSlots = {};
let iconOpenFor = null;
let draftIcon = ITEM_ICONS[0];
let toastTimer;
let arenaFilter = 'active';
let arenaQuery = '';
let arenaSort = 'latest';
let arenaModal = null;
let editOfferId = null;
let editProductId = null;
let draftName = '';
let draftUnit = 'ml';
const expandedProducts = new Set();
let arenaReturnFocus;
const words = (th, en) => LANG === 'th' ? th : en;
const arenaIcon = name => window.CoinQuestIcons?.(name) || '';
let activeView = new URLSearchParams(location.search || '').get('view') === 'compare' ? 'compare' : 'home';

function seed() {
  return [
    { id: uid(), name: "นมจืด UHT", icon: "🥛", baseUnit: "ml", offers: [
      { id: uid(), merchant: "ร้านสะดวกซื้อ", price: 18, qty: 180, unit: "ml", buy: 1, free: 0 },
      { id: uid(), merchant: "โลตัส", price: 42, qty: 1, unit: "l", buy: 1, free: 0 },
      { id: uid(), merchant: "บิ๊กซี", price: 59, qty: 1.5, unit: "l", buy: 1, free: 0 }
    ] },
    { id: uid(), name: "ผงซักฟอก", icon: "🧴", baseUnit: "g", offers: [
      { id: uid(), merchant: "ร้านใกล้บ้าน", price: 35, qty: 400, unit: "g", buy: 1, free: 0 },
      { id: uid(), merchant: "แม็คโคร", price: 175, qty: 3, unit: "kg", buy: 1, free: 0 }
    ] }
  ];
}
function uid() { return "x" + Math.random().toString(36).slice(2, 9); }
function h(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function q(s) { return JSON.stringify(String(s ?? '')).replace(/"/g, '&quot;'); }
function itemIconId(value) { return window.migrateItemIcon ? window.migrateItemIcon(value) : (value || ITEM_ICONS[0]); }
function itemIconMarkup(value, size = 30, className = '') {
  const icon = itemIconId(value);
  return window.questIconSvg ? window.questIconSvg(icon, size, className) : h(icon);
}
function itemIconLabel(value) {
  const icon = itemIconId(value);
  return window.iconLabel ? window.iconLabel(icon, LANG || 'th') : '';
}
function isTestMode() {
  try {
    return new URLSearchParams(location.search || '').get('test') === '1' || sessionStorage.getItem('pointy_test_mode_v1') === '1';
  } catch (_) {
    return false;
  }
}
function withTestParam(href) {
  if (!isTestMode()) return href;
  try {
    const url = new URL(href, location.origin);
    url.searchParams.set('test', '1');
    return url.pathname + url.search + url.hash;
  } catch (_) {
    return href;
  }
}
function updateView(push) {
  const compare = activeView === 'compare';
  document.getElementById('home-view').hidden = compare;
  document.getElementById('compare-view').hidden = !compare;
  document.title = compare ? 'Coin Quest Ledger — ' + t('cmp_title') : 'Coin Quest Ledger';
  if (compare) render();
  else renderHome();
  if (push) history.pushState({ view: activeView }, '', withTestParam(compare ? '/?view=compare' : '/'));
  window.CoinQuestMobileShell?.refresh();
}
function navigateView(view, push) {
  const renderView = () => { activeView = view; updateView(push); };
  if (view === activeView) renderView();
  else window.CoinQuestLoading.navigate(renderView);
}
function showHome() { navigateView('home', true); }
function openCompare() { navigateView('compare', true); }
function money(n) { return '฿' + (Number(n) || 0).toLocaleString(LANG === 'th' ? 'th-TH' : 'en-US'); }
function approxEqual(a, b) { return PointyLogic.approxEqual(a, b); }
function fmtInput(value) { return PointyLogic.formatNumberInput(value); }
function numInput(value) { return PointyLogic.parseNumberInput(value); }
function locale() { return LANG === 'th' ? 'th-TH' : 'en-US'; }
function fmtQty(n) {
  return (Number(n) || 0).toLocaleString(locale(), { maximumFractionDigits: 4 });
}
function normalizeUnit(unit) { return PointyLogic.normalizeUnit(unit, UNIT_ALIAS); }
function groupOf(unit) { return PointyLogic.groupOf(unit, UNIT_GROUPS, UNIT_ALIAS); }
function groupForCmp(cmp) { return PointyLogic.groupForCmp(cmp, UNIT_GROUPS, UNIT_ALIAS); }
function displayUnit(unit) {
  const u = normalizeUnit(unit);
  const th = { ml: 'มล.', l: 'ลิตร', kl: 'kl', mg: 'มก.', g: 'กรัม', kg: 'กก.', mm: 'มม.', cm: 'ซม.', m: 'เมตร', km: 'กม.', 'ชิ้น': 'ชิ้น', 'แพ็ค/กล่อง': 'แพ็ค/กล่อง' };
  const en = { ml: 'ml', l: 'l', kl: 'kl', mg: 'mg', g: 'g', kg: 'kg', mm: 'mm', cm: 'cm', m: 'm', km: 'km', 'ชิ้น': 'pcs', 'แพ็ค/กล่อง': 'pack/box' };
  return (LANG === 'th' ? th[u] : en[u]) || u;
}
function unitOptionsFor(cmp, selected) {
  const group = groupForCmp(cmp);
  return Object.keys(group.units).map(u => `<option value="${h(u)}" ${normalizeUnit(selected) === u ? 'selected' : ''}>${h(displayUnit(u))}</option>`).join('');
}
function optionLabel(offer) {
  const manual = String(offer.merchant || '').trim();
  if (manual) return manual;
  return `${fmtQty(offer.qty)} ${displayUnit(offer.unit)}`;
}
function baseUnitOptions(selected) {
  const key = u => u === 'ชิ้น' ? 'pcs' : u;
  return BASE_UNITS.map(u => `<option value="${h(u)}" ${normalizeUnit(selected) === u ? 'selected' : ''}>${h(t('base_unit_' + key(u)))}</option>`).join('');
}
function toggleItemIconPicker() {
  iconOpenFor = iconOpenFor !== 'new' ? 'new' : null;
  render();
}
function normalizeComparison(cmp) {
  const normalized = PointyLogic.normalizeComparison(cmp, {
    idFactory: uid,
    itemFallback: t('item'),
    merchantFallback: t('merchant'),
    unitGroups: UNIT_GROUPS,
    unitAlias: UNIT_ALIAS
  });
  return { ...normalized, icon: itemIconId(normalized.icon) };
}
function loadState() {
  try {
    const raw = window.PointyScope
      ? JSON.stringify(window.PointyScope.getJSON(STORE_KEY, null))
      : localStorage.getItem(STORE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data.map(normalizeComparison);
    }
  } catch (e) {}
  return seed().map(normalizeComparison);
}
function saveState() {
  try {
    if (window.PointyScope) window.PointyScope.setJSON(STORE_KEY, comparisons);
    else localStorage.setItem(STORE_KEY, JSON.stringify(comparisons));
  } catch (e) {}
  window.dispatchEvent(new CustomEvent('coin-quest-state-changed'));
}
function normalizedOffer(offer, cmp) { return PointyLogic.normalizedOffer(offer, cmp, { unitGroups: UNIT_GROUPS, unitAlias: UNIT_ALIAS }); }
function perUnit(o, cmp) { return normalizedOffer(o, cmp).pu; }
function rankOffers(offers, cmp) { return PointyLogic.rankOffers(offers, cmp, { unitGroups: UNIT_GROUPS, unitAlias: UNIT_ALIAS }); }
function fmtUnit(pu) {
  if (!isFinite(pu)) return "—";
  if (pu > 0 && pu < 0.001) return '฿' + pu.toLocaleString(locale(), { maximumSignificantDigits: 3 });
  if (pu < 0.1) return "฿" + pu.toFixed(3);
  if (pu < 10) return "฿" + pu.toFixed(2);
  return "฿" + pu.toLocaleString(locale(), { maximumFractionDigits: 2 });
}
function render() {
  const focused = document.activeElement;
  const focusId = focused?.id;
  const selection = focused?.selectionStart;
  document.getElementById('arena-hero').innerHTML = `
    <button class="btn-ghost arena-help" onclick="openArenaHelp()">${arenaIcon('shield')}${words('วิธีใช้งาน', 'How to play')}</button>
    <div class="arena-crest" aria-hidden="true">${arenaIcon('compare')}</div>
    <h1>${t('cmp_title')}</h1><p>${words('ตามหาดีลในตำนาน — ของชิ้นเดียวกัน ตัวเลือกไหนคุ้มสุด?', 'Find a legendary deal. Same item, which offer wins?')}</p>
    <button class="btn-primary arena-new" onclick="openProduct()"><span aria-hidden="true">＋</span>${words('เพิ่มสินค้า', 'Add product')}</button>`;
  const activeCount = comparisons.filter(c => !c.archived).length;
  document.getElementById('arena-toolbar').innerHTML = `
    <div class="arena-filters" role="group" aria-label="${words('สถานะสินค้า', 'Product status')}">
      ${[['all', words('ทั้งหมด','All'), comparisons.length], ['active',words('กำลังเทียบ','Active'),activeCount],['archived',words('เก็บแล้ว','Archived'),comparisons.length-activeCount]].map(([id,label,count]) => `<button id="arena-filter-${id}" type="button" aria-pressed="${arenaFilter === id}" onclick="arenaFilter=${q(id)};render()">${label}<span>${count}</span></button>`).join('')}
    </div>
    <label class="arena-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg><input id="arena-query" type="search" value="${h(arenaQuery)}" placeholder="${words('ค้นหาสินค้า...', 'Search products...')}" aria-label="${words('ค้นหาสินค้า', 'Search products')}" oninput="arenaQuery=this.value;render()"></label>
    <select id="arena-sort" class="select" aria-label="${words('เรียงสินค้า', 'Sort products')}" onchange="arenaSort=this.value;render()">${[['latest',words('ล่าสุด','Latest')],['name',words('ชื่อสินค้า','Product name')],['saving',words('ประหยัดสูงสุด','Best saving')]].map(([value,label]) => `<option value="${value}" ${arenaSort === value ? 'selected' : ''}>${words('เรียงตาม: ','Sort: ')}${label}</option>`).join('')}</select>`;
  const visible = comparisons.filter(c => (arenaFilter === 'all' || (arenaFilter === 'archived' ? c.archived : !c.archived)) && c.name.toLocaleLowerCase().includes(arenaQuery.trim().toLocaleLowerCase()));
  if (arenaSort === 'name') visible.sort((a,b) => a.name.localeCompare(b.name, locale()));
  if (arenaSort === 'saving') visible.sort((a,b) => (rankOffers(b.offers,b)[0]?.savePct || 0) - (rankOffers(a.offers,a)[0]?.savePct || 0));
  document.getElementById('cmp-grid').innerHTML = visible.map(renderCard).join('');
  document.getElementById('cmp-empty').innerHTML = visible.length ? '' : `<div class="empty">${arenaIcon('compare')}<strong>${arenaQuery ? words('ไม่พบสินค้าที่ค้นหา', 'No matching products') : words('ยังไม่มีสินค้าในรายการนี้', 'No products in this list yet')}</strong><span>${words('เพิ่มสินค้าเพื่อเริ่มหาดีลที่คุ้มที่สุด', 'Add a product to find your best deal.')}</span>${arenaQuery ? `<button class="btn-ghost" onclick="arenaQuery='';render()">${words('ล้างคำค้น', 'Clear search')}</button>` : ''}</div>`;
  document.getElementById('arena-add').innerHTML = renderAddCard();
  renderArenaDialog();
  translatePage();
  if (focusId && document.getElementById(focusId)) {
    const el = document.getElementById(focusId); el.focus({ preventScroll: true });
    if (typeof selection === 'number' && el.type !== 'number') try { el.setSelectionRange(selection, selection); } catch (_) {}
  }
}
function renderAll() { activeView === 'compare' ? render() : renderHome(); }
function renderCard(cmp) {
  const ranked = rankOffers(cmp.offers || [], cmp);
  const best = ranked.find(o => o.isBest);
  const enough = ranked.length >= 2;
  const bestPu = best && isFinite(best.pu) ? best.pu : Math.min(...ranked.map(o => o.pu).filter(Number.isFinite));
  return `<article class="cmp-card ${expandedProducts.has(cmp.id) ? 'expanded' : ''} ${cmp.archived ? 'archived' : ''}" data-product-id="${h(cmp.id)}">
    <div class="cmp-head">
      <span class="cmp-icon">${itemIconMarkup(cmp.icon || ITEM_ICONS[0], 32)}</span>
      <div class="cmp-id"><h2 class="cmp-name">${h(cmp.name)}</h2><div class="cmp-unit">${t('per_unit')} ${h(displayUnit(cmp.baseUnit))}${cmp.archived ? ` · ${words('เก็บแล้ว', 'Archived')}` : ''}</div></div>
      ${enough && best && best.savePct > 0 ? `<div class="cmp-save"><span class="cs-pct">−${best.savePct}%</span><span class="cs-lab">${t('cheaper_by')}</span></div>` : ''}
      ${!cmp.archived ? `<button class="btn-ghost card-add-offer" onclick="openOffers(${q(cmp.id)})">＋ ${words('เพิ่มตัวเลือก', 'Add offer')}</button>` : `<button class="btn-ghost" onclick="restoreComparison(${q(cmp.id)})">${words('นำกลับมา', 'Restore')}</button>`}
      <details class="card-menu"><summary aria-label="${words('จัดการสินค้า', 'Manage product')} ${h(cmp.name)}">${arenaIcon('more')}</summary><div>${!cmp.archived ? `<button onclick="openOffers(${q(cmp.id)})">${words('เพิ่มตัวเลือก', 'Add offer')}</button>` : ''}<button onclick="openProduct(${q(cmp.id)})">${words('แก้ไขสินค้า', 'Edit product')}</button>${!cmp.archived ? `<button onclick="deleteComparison(${q(cmp.id)})">${words('เก็บสินค้า', 'Archive product')}</button>` : ''}</div></details>
    </div>
    ${ranked.length ? `<div class="offer-list" id="offers-${h(cmp.id)}">${ranked.map((o, idx) => renderOffer(cmp, o, enough, bestPu, idx)).join('')}</div>` : `<div class="empty empty-offers">${t('no_offers')}</div>`}
    ${ranked.length > 1 ? `<button class="offer-disclosure" aria-expanded="${expandedProducts.has(cmp.id)}" aria-controls="offers-${h(cmp.id)}" onclick="toggleProductOffers(${q(cmp.id)},this)"><span>${expandedProducts.has(cmp.id) ? words('แสดงดีลแรก', 'Show top offer') : words('ดูตัวเลือกทั้งหมด', 'View all offers')} (${ranked.length})</span>${arenaIcon('chevron')}</button>` : ''}
    ${!cmp.archived ? `<button class="btn-ghost card-add-bottom" onclick="openOffers(${q(cmp.id)})">＋ ${words('เพิ่มตัวเลือก', 'Add offer')}</button>` : ''}
  </article>`;
}
function renderOffer(cmp, offer, enough, bestPu, idx) {
  const r = RARITY[offer.tier];
  const norm = offer.norm || normalizedOffer(offer, cmp);
  const pack = normalizeUnit(offer.unit) === 'แพ็ค/กล่อง' && offer.perPack ? ` · ${t('pack_short', { n: fmtQty(offer.perPack) })}` : '';
  const promo = offer.free > 0 ? ` · ${t('promo_label', { buy: offer.buy || 1, free: offer.free })}` : '';
  const tag = offer.isEqual ? `<div class="of-tag equal">${t('badge_equal')}</div>`
    : enough && offer.isBest && offer.savePct > 0 ? `<div class="of-save">✦ ${words('ประหยัด', 'Save')} ${offer.savePct}%</div>`
    : enough && !offer.isBest && Number.isFinite(bestPu) && bestPu > 0 ? `<div class="of-tag">${words('แพงกว่า', 'Costs more')} ${Math.round((offer.pu / bestPu - 1) * 100)}%</div>` : '';
  return `<button type="button" class="offer-row ${offer.isBest && enough ? 'best' : ''}" onclick="openOffers(${q(cmp.id)},${q(offer.id)})" aria-label="${words('รายละเอียดและแก้ไข', 'View and edit')} ${h(offer.merchant)}">
    <span class="offer-rank ${offer.isBest && enough ? 'champion-ribbon' : ''}">${offer.isBest && enough ? `♛ ${words('คุ้มที่สุด', 'Best deal')}` : idx + 1}</span>
    <span class="of-rarity" aria-hidden="true">${r.glyph}</span>
    <span class="of-main"><span class="of-merchant">${h(offer.merchant || t('merchant'))}</span><span class="of-detail">${money(offer.price)} · ${fmtQty(offer.qty)} ${h(displayUnit(offer.unit))}</span><span class="offer-meta">${pack}${promo}</span></span>
    <div class="of-right"><div class="of-pu">${fmtUnit(offer.pu)}<span class="of-unit">/${h(displayUnit(norm.baseUnit))}</span></div>${tag}</div>
    ${offer.isBest && enough ? '<span class="value-bar"><span class="value-fill"></span></span>' : ''}<span class="offer-arrow" aria-hidden="true">${arenaIcon('chevron')}</span>
  </button>`;
}
function toggleProductOffers(id) {
  expandedProducts.has(id) ? expandedProducts.delete(id) : expandedProducts.add(id);
  render(); document.querySelector(`[data-product-id="${CSS.escape(id)}"] .offer-disclosure`)?.focus({ preventScroll: true });
}
function defaultDraft(cmp) {
  return { id: uid(), merchant: '', price: '', qty: '', unit: groupForCmp(cmp).base, perPack: '', buy: '1', free: '0' };
}
function ensureDrafts(cid) {
  const cmp = comparisons.find(c => c.id === cid);
  if (!cmp) return [];
  if (!draftSlots[cid]) draftSlots[cid] = [defaultDraft(cmp), defaultDraft(cmp)];
  if (!editOfferId) while (draftSlots[cid].length < 2) draftSlots[cid].push(defaultDraft(cmp));
  return draftSlots[cid];
}
function draftComplete(draft, cmp) {
  try { checkedDraft(draft, cmp); return true; } catch (_) { return false; }
}
function draftTouched(draft) {
  return ['merchant', 'price', 'qty', 'perPack'].some(k => String(draft[k] || '').trim()) || String(draft.buy) !== '1' || String(draft.free) !== '0';
}
function checkedDraft(draft, cmp) {
  return PointyLogic.validateOfferInput(draft, cmp);
}
function renderOfferBuilder(cmp) {
  const slots = ensureDrafts(cmp.id);
  let unlocked = true;
  const rows = slots.map((slot, i) => {
    const locked = !unlocked;
    unlocked = unlocked && draftComplete(slot, cmp);
    return renderDraftSlot(cmp, slot, i, locked);
  }).join('');
  const completeCount = slots.filter(s => draftComplete(s, cmp)).length;
  const canAdd = slots.length < MAX_DRAFT_OFFERS && draftComplete(slots[slots.length - 1], cmp);
  return `<div class="offer-builder" id="builder-${cmp.id}">
    ${rows}
    <div class="offer-actions">
      <span class="offer-hint">${t('offer_count', { n: (cmp.offers || []).length })}</span>
      <span>
        ${slots.length > 2 ? `<button class="btn-ghost" onclick="deleteDraftSlot(${q(cmp.id)})">${t('remove_offer_slot')}</button>` : ''}
          ${!editOfferId ? `<button class="btn-ghost" onclick="addDraftSlot(${q(cmp.id)})" ${canAdd ? '' : 'disabled'}>${t('add_offer_slot')}</button>` : ''}
          <button class="btn-primary" onclick="saveDraftOffers(${q(cmp.id)})" ${completeCount && !slots.some(s => draftTouched(s) && !draftComplete(s, cmp)) ? '' : 'disabled'}>${t('save_offers')}</button>
      </span>
    </div>
  </div>`;
}
function renderDraftSlot(cmp, slot, i, locked) {
  const packOpen = normalizeUnit(slot.unit) === 'แพ็ค/กล่อง';
  const advancedOpen = !!slot.advanced || packOpen;
  return `<div class="draft-slot ${locked ? 'locked' : ''}" id="slot-${cmp.id}-${i}">
    <div class="draft-head"><span class="slot-num">${t('offer_slot', { n: i + 1 })}</span>${locked ? `<span class="slot-lock">${t('lock_prev_offer')}</span>` : ''}</div>
      <fieldset class="draft-body" ${locked ? 'disabled' : ''}>
        <label class="draft-note"><span>${words('ร้าน / ชื่อตัวเลือก (ไม่บังคับ)', 'Shop / offer name (optional)')}</span>
          <input class="input" id="draft-${cmp.id}-${i}-merchant" maxlength="100" value="${h(slot.merchant)}" placeholder="${h(t('option_note_ph'))}" oninput="updateDraft(${q(cmp.id)},${i},'merchant',this.value)">
        </label>
      <div class="calc-row">
          <label><span>${words('ราคา (บาท)', 'Price (฿)')}</span><input class="input" id="draft-${cmp.id}-${i}-price" value="${h(fmtInput(slot.price))}" type="text" inputmode="decimal" placeholder="0.00" oninput="updateDraft(${q(cmp.id)},${i},'price',PointyLogic.formatNumberInputElement(this))"></label>
          <label><span>${t('qty')}</span><input class="input" id="draft-${cmp.id}-${i}-qty" value="${h(fmtInput(slot.qty))}" type="text" inputmode="decimal" placeholder="0" oninput="updateDraft(${q(cmp.id)},${i},'qty',PointyLogic.formatNumberInputElement(this))"></label>
          <label><span>${words('หน่วย', 'Unit')}</span><select class="select" id="draft-${cmp.id}-${i}-unit" onchange="updateDraft(${q(cmp.id)},${i},'unit',this.value)">${unitOptionsFor(cmp, slot.unit)}</select></label>
      </div>
      <div class="draft-tools">
        <span class="required-hint">${t('required_price_qty')}</span>
        <button class="btn-chip ${advancedOpen ? 'on' : ''}" onclick="toggleAdvanced(${q(cmp.id)},${i})">${advancedOpen ? t('hide_advanced') : t('show_advanced')}</button>
      </div>
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''} class="draft-extra ${advancedOpen ? 'show' : ''}" id="extra-${cmp.id}-${i}">
      <div class="mini-field ${packOpen ? 'show' : ''}" id="pack-${cmp.id}-${i}">
        <span class="mini-label">${t('field_per_pack')}</span>
          <span class="num"><input id="draft-${cmp.id}-${i}-pack" aria-label="${h(t('field_per_pack'))}" value="${h(fmtInput(slot.perPack))}" type="text" inputmode="numeric" placeholder="${h(t('placeholder_per_pack'))}" oninput="updateDraft(${q(cmp.id)},${i},'perPack',PointyLogic.formatNumberInputElement(this))"></span>
      </div>
      <div class="promo-mini ${slot.advanced ? 'show' : ''}">
        <span class="mini-label">${t('field_promo')}</span>
          <span class="num"><input aria-label="${words('ซื้อ', 'Buy')}" id="draft-${cmp.id}-${i}-buy" value="${h(slot.buy || 1)}" type="number" inputmode="numeric" min="1" step="1" oninput="updateDraft(${q(cmp.id)},${i},'buy',this.value)"></span>
        <span class="mini-label">${t('promo_sep')}</span>
          <span class="num"><input aria-label="${words('แถม', 'Free')}" id="draft-${cmp.id}-${i}-free" value="${h(slot.free || 0)}" type="number" inputmode="numeric" min="0" step="1" oninput="updateDraft(${q(cmp.id)},${i},'free',this.value)"></span>
      </div>
    </fieldset>
  </div>`;
}
function renderAddCard() {
  return `<button class="add-cmp" onclick="openProduct()"><span aria-hidden="true">＋</span>${words('เพิ่มสินค้าใหม่', 'Add a new product')}</button>`;
}
function renderProductForm() {
  return `<form class="add-cmp-open" onsubmit="event.preventDefault();addComparison()">
    <div class="add-item-row">
      <div class="icon-picker"><button class="icon-btn" onclick="toggleItemIconPicker(event)" aria-label="${h(itemIconLabel(draftIcon) || t('item'))}">${itemIconMarkup(draftIcon, 34)}</button>${iconOpenFor === 'new' ? `<div class="icon-pop labeled">${ITEM_ICONS.map(ic => `<button class="icon-opt ${itemIconId(draftIcon) === itemIconId(ic) ? 'on' : ''}" onclick="draftIcon=${q(itemIconId(ic))};iconOpenFor=null;render()" title="${h(itemIconLabel(ic))}">${itemIconMarkup(ic, 36)}<span class="io-lab">${h(itemIconLabel(ic))}</span></button>`).join('')}</div>` : ''}</div>
        <label class="product-name-field"><span>${words('ชื่อสินค้า', 'Product name')}</span><input class="input" id="new-name" maxlength="80" value="${h(draftName)}" placeholder="${h(t('item_name_ph'))}" oninput="draftName=this.value"></label>
    </div>
    <div class="add-item-row">
        <label class="product-unit-field"><span>${words('เทียบราคาต่อ', 'Compare price per')}</span><select class="select" id="new-unit" onchange="draftUnit=this.value" ${editProductId && comparisons.find(c => c.id === editProductId)?.offers.length ? 'disabled' : ''}>${baseUnitOptions(draftUnit)}</select></label>
    </div>
      ${editProductId && comparisons.find(c => c.id === editProductId)?.offers.length ? `<p class="form-note">${words('หน่วยฐานคงเดิมเพื่อให้ตัวเลือกที่บันทึกไว้เปรียบเทียบกันได้', 'The base unit stays the same so your saved offers remain comparable.')}</p>` : ''}
      <div class="form-actions"><button type="button" class="btn-ghost" onclick="closeArenaDialog()">${words('ยกเลิก', 'Cancel')}</button><button class="btn-primary" type="submit">${editProductId ? words('บันทึกสินค้า', 'Save product') : words('เพิ่มสินค้า', 'Add product')}</button></div>
    </form>`;
}
function addComparison() {
  let name;
  try { name = PointyLogic.readField('new-name', { type: 'text', label: 'ชื่อสินค้า', max: 80 }); }
  catch (error) { toast(error.message); return; }
  const unit = normalizeUnit(draftUnit);
  if (!name) { toast(t('err_desc')); return; }
  const group = groupOf(unit) || UNIT_GROUPS[0];
  const id = editProductId || uid();
  const editing = !!editProductId;
  if (editing) comparisons = comparisons.map(c => c.id === id ? { ...c, name, baseUnit: c.offers.length ? c.baseUnit : group.base, icon: itemIconId(draftIcon) } : c);
  else comparisons.unshift({ id, name, baseUnit: group.base, icon: itemIconId(draftIcon), offers: [] });
  arenaFilter = 'active'; arenaQuery = ''; saveState(); closeArenaDialog(); render();
  if (!editing) openOffers(id);
}
function deleteComparison(id) {
  comparisons = comparisons.map(c => c.id === id ? { ...c, archived: true } : c);
  saveState(); render(); toast(words('เก็บสินค้าแล้ว · นำกลับมาได้ในแท็บเก็บแล้ว', 'Product archived. Restore it from Archived.'));
}
function restoreComparison(id) { comparisons = comparisons.map(c => c.id === id ? { ...c, archived: false } : c); saveState(); render(); }
function deleteOffer(cid, oid) {
  comparisons = comparisons.map(c => c.id === cid ? { ...c, offers: c.offers.filter(o => o.id !== oid) } : c);
  saveState(); closeArenaDialog(); render(); focusProduct(cid); toast(words('ลบตัวเลือกแล้ว', 'Offer removed'));
}
function updateDraft(cid, idx, field, value) {
  const cmp = comparisons.find(c => c.id === cid);
  if (!cmp) return;
  const slots = ensureDrafts(cid);
  slots[idx][field] = value;
  if (field === 'unit') {
    const pack = document.getElementById(`pack-${cid}-${idx}`);
    if (pack) pack.classList.toggle('show', normalizeUnit(value) === 'แพ็ค/กล่อง');
    const extra = document.getElementById(`extra-${cid}-${idx}`);
    if (extra) extra.classList.toggle('show', normalizeUnit(value) === 'แพ็ค/กล่อง' || !!slots[idx].advanced);
  }
  updateDraftState(cid);
}
function toggleAdvanced(cid, idx) {
  const slots = ensureDrafts(cid);
  if (!slots[idx]) return;
  slots[idx].advanced = !slots[idx].advanced;
  render();
}
function updateDraftState(cid) {
  const cmp = comparisons.find(c => c.id === cid);
  if (!cmp) return;
  const slots = ensureDrafts(cid);
  let unlocked = true;
  slots.forEach((slot, i) => {
    const el = document.getElementById(`slot-${cid}-${i}`);
    if (el) { el.classList.toggle('locked', !unlocked); el.querySelectorAll('fieldset').forEach(f => f.disabled = !unlocked); }
    const hint = el?.querySelector('.required-hint');
    if (hint) {
      try { if (draftTouched(slot)) checkedDraft(slot, cmp); hint.textContent = t('required_price_qty'); }
      catch (error) { hint.textContent = error.message; }
    }
    unlocked = unlocked && draftComplete(slot, cmp);
  });
  const builder = document.getElementById(`builder-${cid}`);
  if (!builder) return;
  const buttons = builder.querySelectorAll('.offer-actions button');
  const completeCount = slots.filter(s => draftComplete(s, cmp)).length;
  if (buttons.length) {
    const addBtn = Array.from(buttons).find(btn => btn.textContent === t('add_offer_slot'));
    const saveBtn = Array.from(buttons).find(btn => btn.textContent === t('save_offers'));
    if (addBtn) addBtn.disabled = !(slots.length < MAX_DRAFT_OFFERS && draftComplete(slots[slots.length - 1], cmp));
    if (saveBtn) saveBtn.disabled = completeCount < 1 || slots.some(s => draftTouched(s) && !draftComplete(s, cmp));
  }
}
function addDraftSlot(cid) {
  const cmp = comparisons.find(c => c.id === cid);
  const slots = ensureDrafts(cid);
  if (!cmp || slots.length >= MAX_DRAFT_OFFERS) { toast(t('max_offers')); return; }
  if (!draftComplete(slots[slots.length - 1], cmp)) { toast(t('err_offer_incomplete')); return; }
  slots.push(defaultDraft(cmp));
  render();
}
function deleteDraftSlot(cid) {
  const slots = ensureDrafts(cid);
  if (slots.length <= 2) return;
  slots.pop();
  render();
}
function saveDraftOffers(cid) {
  const cmp = comparisons.find(c => c.id === cid);
  const slots = ensureDrafts(cid);
  if (!cmp) return;
  let offers;
  try { offers = slots.filter(draftTouched).map(s => ({ ...checkedDraft(s, cmp), id: editOfferId || uid() })).map(o => ({ ...o, merchant: optionLabel(o) })); }
  catch (error) { toast(error.message); updateDraftState(cid); return; }
  if (!offers.length) { toast(t('err_no_complete_offer')); return; }
  comparisons = comparisons.map(c => c.id === cid ? { ...c, offers: editOfferId ? c.offers.map(o => o.id === editOfferId ? { ...o, ...offers[0] } : o) : [...(c.offers || []), ...offers] } : c);
  draftSlots[cid] = [defaultDraft(cmp), defaultDraft(cmp)];
  saveState(); closeArenaDialog(); render(); focusProduct(cid); toast(t('offers_saved', { n: offers.length }));
}
function focusProduct(id) { document.querySelector(`[data-product-id="${CSS.escape(id)}"] .card-menu summary`)?.focus({ preventScroll: true }); }
function openProduct(id = null) {
  const product = comparisons.find(c => c.id === id);
  arenaReturnFocus = document.activeElement;
  editProductId = product?.id || null;
  draftName = product?.name || ''; draftUnit = product?.baseUnit || 'ml'; draftIcon = product?.icon || ITEM_ICONS[0]; iconOpenFor = null;
  arenaModal = 'product'; renderArenaDialog(); document.getElementById('new-name')?.focus();
}
function openOffers(id, offerId = null) {
  const product = comparisons.find(c => c.id === id); if (!product) return;
  arenaReturnFocus = document.activeElement;
  editOfferId = offerId;
  if (offerId) {
    const offer = product.offers.find(o => o.id === offerId); if (!offer) return;
    draftSlots[id] = [{ ...offer, price: String(offer.price), qty: String(offer.qty), buy: String(offer.buy || 1), free: String(offer.free || 0), perPack: offer.perPack ? String(offer.perPack) : '', advanced: offer.free > 0 }];
  } else draftSlots[id] = [defaultDraft(product),defaultDraft(product)];
  arenaModal = id; renderArenaDialog(); document.getElementById(`draft-${id}-0-merchant`)?.focus();
}
function openArenaHelp() { arenaReturnFocus = document.activeElement; arenaModal = 'help'; renderArenaDialog(); }
function renderArenaDialog() {
  const dialog = document.getElementById('arena-dialog');
  if (!arenaModal) return;
  const product = comparisons.find(c => c.id === arenaModal);
  const title = arenaModal === 'product' ? (editProductId ? words('แก้ไขสินค้า','Edit product') : words('เพิ่มสินค้าใหม่','Add a product')) : arenaModal === 'help' ? words('หาดีลที่คุ้มกว่าใน 3 ขั้นตอน','Find a better deal in 3 steps') : `${editOfferId ? words('แก้ไขตัวเลือก','Edit offer') : words('เพิ่มตัวเลือก','Add offers')} · ${product?.name || ''}`;
  dialog.innerHTML = `<div class="arena-dialog-head"><h2 id="arena-dialog-title">${h(title)}</h2><button class="btn-ghost dialog-close" type="button" onclick="closeArenaDialog()" aria-label="${words('ปิด','Close')}">${arenaIcon('close')}</button></div>${arenaModal === 'product' ? renderProductForm() : arenaModal === 'help' ? `<ol class="arena-help-steps"><li><strong>${words('เพิ่มสินค้าที่ต้องการเทียบ','Choose a product')}</strong><p>${words('เลือกหน่วยฐานเดียวกัน เช่น มล. กรัม เมตร หรือชิ้น','Choose a base unit: ml, grams, metres or pieces.')}</p></li><li><strong>${words('ใส่ราคาและปริมาณของแต่ละตัวเลือก','Enter each offer’s price and quantity')}</strong><p>${words('ใส่ราคาต่อหนึ่งแพ็กหรือหนึ่งชิ้น พร้อมขนาด ระบบรองรับหน่วยลิตร กิโลกรัม และโปรซื้อแถม','Enter the price and size of one pack or item. Litres, kilograms and buy-one-get-one offers are supported.')}</p></li><li><strong>${words('เลือกดีลที่คุ้มที่สุด','Compare the same unit')}</strong><p>${words('ราคาต่อหน่วยยิ่งน้อยยิ่งคุ้ม ส่วนลดเทียบกับตัวเลือกแพงที่สุดในสินค้านั้น ราคาซื้อแถมจะคิดปริมาณของแถมด้วย','A lower unit price is better. Savings compare against the most expensive offer for that product, including any free quantity.')}</p></li></ol><button class="btn-primary" onclick="closeArenaDialog()">${words('เข้าใจแล้ว','Got it')}</button>` : product ? `${renderOfferBuilder(product)}${editOfferId ? `<details class="remove-offer"><summary>${words('ลบตัวเลือกนี้','Remove this offer')}</summary><p>${words('ลบแล้วจะกู้คืนตัวเลือกนี้ไม่ได้','This offer cannot be restored after removal.')}</p><button class="btn-danger" onclick="deleteOffer(${q(product.id)},${q(editOfferId)})">${words('ยืนยันลบตัวเลือก','Confirm removal')}</button></details>` : ''}` : ''}`;
  dialog.querySelectorAll('.icon-picker button').forEach(button => button.type = 'button');
  if (!dialog.open) dialog.showModal();
}
function closeArenaDialog() {
  arenaModal = null; editOfferId = null; editProductId = null; iconOpenFor = null;
  document.getElementById('arena-dialog').close();
  if (arenaReturnFocus?.isConnected) arenaReturnFocus.focus({ preventScroll: true });
  else document.querySelector('.arena-new')?.focus({ preventScroll: true });
}
document.getElementById('arena-dialog').addEventListener('cancel', event => { event.preventDefault(); closeArenaDialog(); });
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

window.addEventListener('popstate', () => {
  navigateView(new URLSearchParams(location.search || '').get('view') === 'compare' ? 'compare' : 'home', false);
});
translatePage();
updateView(false);
