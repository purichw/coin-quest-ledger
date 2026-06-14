// pixicons.jsx — pixel-art expense icons in the loot-chest visual language.
// Quest icons are 16×16 (bold, readable silhouettes); grocery icons are 12×12.
// QuestIcon renders a known id as pixel art; unknown values (legacy emoji in
// saved data) fall back to rendering the raw glyph, so nothing breaks.
const PIX_PAL = {
  K: "#2c1a0c",                                  // universal dark outline
  w: "#7a4a22", W: "#9a6230", d: "#5e3818",      // wood / leather
  o: "#b07d1c", g: "#d9a334", G: "#f2c544", y: "#ffe79c", // gold
  r: "#c05a3a", R: "#e07d5a", x: "#7a2e1c",      // red / meat / ribbon
  n: "#3e8b54", N: "#6fcf80", e: "#24613a",      // green / potion / canvas
  b: "#4a78b0", B: "#7fb0e0", u: "#2d4d77",      // blue / gem / water
  s: "#9aa3ad", S: "#d6dde4", a: "#5a626b",      // steel / silver
  p: "#7d57b0", P: "#b48fe0",                    // purple / magic
  c: "#e8d6a8", C: "#f4ead0", m: "#b89a5c", l: "#8a6d3a", // parchment
  f: "#fbf6ea", t: "#cfe6d2",                    // foam/sail / steam
};

// ── Quest / expense icons — 16×16 ──
const PIX_ICONS = {
  meal: [
    "                ",
    "      t   t     ",
    "     t   t      ",
    "      t   t     ",
    "                ",
    "  KKKKKKKKKKKK  ",
    "  KRRRRRRRRRRK  ",
    " KKKKKKKKKKKKKK ",
    " KSffffffffffSK ",
    " KSffffffffffSK ",
    "  KSSSSSSSSSSK  ",
    "  KaSSSSSSSSaK  ",
    "   KaSSSSSSaK   ",
    "    KKKKKKKK    ",
    "                ",
    "                ",
  ],
  ale: [
    "                ",
    "   ffffffff     ",
    "  fKKKKKKKKf    ",
    "  fKGGGGGGKf    ",
    "  KGGGGGGGGK KK ",
    "  KGGGGGGGGKK K ",
    "  KGyyGGGGGK  K ",
    "  KGGGGGGGGK  K ",
    "  KGGGGGGGGKK K ",
    "  KGGGGGGGGK KK ",
    "  KGGGGGGGGK    ",
    "  KGGGGGGGGK    ",
    "  KKKKKKKKKK    ",
    "                ",
    "                ",
    "                ",
  ],
  coffee: [
    "                ",
    "     t   t      ",
    "    t   t       ",
    "     t   t      ",
    "                ",
    "   KKKKKKKK     ",
    "   KCCCCCCK KK  ",
    "   KCCCCCCKK K  ",
    "   KwwwwwwK  K  ",
    "   KwwwwwwKKK   ",
    "   KwwwwwwK     ",
    "   KKwwwwKK     ",
    "  KKKKKKKKKK    ",
    "  KSSSSSSSSK    ",
    "   KKKKKKKK     ",
    "                ",
  ],
  sack: [
    "                ",
    "      KKKK      ",
    "     KwWWwK     ",
    "     dKKKKd     ",
    "    KWWWWWWK    ",
    "   KWWWWWWWWK   ",
    "  KWWWWWWWWWWK  ",
    "  KWWWGGGGWWWK  ",
    "  KWWGGyyGGWWK  ",
    "  KWWGGyyGGWWK  ",
    "  KWWWGGGGWWWK  ",
    "  KWWWWWWWWWWK  ",
    "  KWWWWWWWWWWK  ",
    "   KKKKKKKKKK   ",
    "                ",
    "                ",
  ],
  gift: [
    "                ",
    "    K K  K K    ",
    "   KRKK  KKRK   ",
    "    KRK  KRK    ",
    "     KRKKRK     ",
    "  KKKKKKKKKKKK  ",
    "  KGGGGRRGGGGK  ",
    "  KKKKKKKKKKKK  ",
    "  KGGGGRRGGGGK  ",
    "  KGGGGRRGGGGK  ",
    "  KGGGGRRGGGGK  ",
    "  KGGGGRRGGGGK  ",
    "  KKKKKKKKKKKK  ",
    "                ",
    "                ",
    "                ",
  ],
  gem: [
    "                ",
    "    KKKKKKKK    ",
    "   KPPpPPpPPK   ",
    "  KKKKKKKKKKKK  ",
    "  KBBBBBBBBBBK  ",
    "  KBBffBBBBBBK  ",
    "   KBBBBBBBBK   ",
    "   KBfBBBBBBK   ",
    "    KBBBBBBK    ",
    "    KBBBBBBK    ",
    "     KBBBBK     ",
    "     KBBBBK     ",
    "      KBBK      ",
    "      KBBK      ",
    "       KK       ",
    "                ",
  ],
  cart: [
    "                ",
    "                ",
    "     KKKKKKK    ",
    "    KBBBBBBBK   ",
    "  KKKBBBBBBBKKK ",
    " KRRRRRRRRRRRRRK",
    " KRRRRRRRRRRRRRK",
    " KKKKKKKKKKKKKKK",
    "  KKK     KKK   ",
    " KaaaK   KaaaK  ",
    " KaSaK   KaSaK  ",
    " KaaaK   KaaaK  ",
    "  KKK     KKK   ",
    "                ",
    "                ",
    "                ",
  ],
  ship: [
    "       K        ",
    "       KG       ",
    "       KfK      ",
    "      KfffK     ",
    "      KffffK    ",
    "     KfffffK    ",
    "     KffffffK   ",
    "       KwK      ",
    "       KwK      ",
    "       KwK      ",
    " KKKKKKKKKKKKKK ",
    " KWWWWWWWWWWWWK ",
    "  KWWWWWWWWWWK  ",
    "   KKKKKKKKKK   ",
    "  BBBBBBBBBBBB  ",
    "                ",
  ],
  tent: [
    "                ",
    "       K        ",
    "      KNK       ",
    "      KNNK      ",
    "     KNNNNK     ",
    "     KNNKNK     ",
    "    KNNNKNNK    ",
    "    KNNNKNNK    ",
    "   KNNNNKNNNK   ",
    "   KNNNNKNNNK   ",
    "  KNNNNNKNNNNK  ",
    "  KNNNNNKNNNNK  ",
    " KKKKKKKKKKKKKK ",
    "                ",
    "                ",
    "                ",
  ],
  key: [
    "                ",
    "      KKKK      ",
    "     KGGGGK     ",
    "    KGGGGGGK    ",
    "    KGGKKGGK    ",
    "    KGGKKGGK    ",
    "    KGGGGGGK    ",
    "     KGGGGK     ",
    "      KGGK      ",
    "      KGGK      ",
    "      KGGKK     ",
    "      KGGK      ",
    "      KGGKK     ",
    "      KGGGK     ",
    "      KKKKK     ",
    "                ",
  ],
  barrel: [
    "                ",
    "    KKKKKKKK    ",
    "   KwwwwwwwwK   ",
    "   KwWWWWWWwK   ",
    "  oKWWWWWWWWKo  ",
    "  KwWWWWWWWWwK  ",
    "  KwWWWWWWWWwK  ",
    "  oKWWWWWWWWKo  ",
    "  KwWWWWWWWWwK  ",
    "  KwWWWWWWWWwK  ",
    "  oKWWWWWWWWKo  ",
    "   KwWWWWWWwK   ",
    "   KwwwwwwwwK   ",
    "    KKKKKKKK    ",
    "                ",
    "                ",
  ],
  scroll: [
    "                ",
    "   KKKKKKKKKK   ",
    "  KmCCCCCCCCmK  ",
    "  KCllllllllCK  ",
    "  KCCCCCCCCCCK  ",
    "  KCllllllllCK  ",
    "  KCCCCCCCCCCK  ",
    "  KCllllllllCK  ",
    "  KCCCCCCCCCCK  ",
    "  KCllllllllCK  ",
    "  KmCCCCCCCCmK  ",
    "   KKKKKKKKKK   ",
    "                ",
    "                ",
    "                ",
    "                ",
  ],
  book: [
    "                ",
    "   KKKKKKKKKK   ",
    "  KRRRRRRRRRRK  ",
    "  KRCCCCCCCCRK  ",
    "  KRCllllllCRK  ",
    "  KRCCCCCCCCRK  ",
    "  KRCllllllCRK  ",
    "  KRCCCCCCCCRK  ",
    "  KRCllllllCRK  ",
    "  KRCCCCCCCCRK  ",
    "  KRRRRRRRRRRK  ",
    "   KKKKKKKKKK   ",
    "                ",
    "                ",
    "                ",
    "                ",
  ],
  dice: [
    "                ",
    "  KKKKKKKKKKKK  ",
    "  KffffffffffK  ",
    "  KfKKffffKKfK  ",
    "  KfKKffffKKfK  ",
    "  KffffKKffffK  ",
    "  KffffKKffffK  ",
    "  KfKKffffKKfK  ",
    "  KfKKffffKKfK  ",
    "  KffffffffffK  ",
    "  KKKKKKKKKKKK  ",
    "                ",
    "                ",
    "                ",
    "                ",
    "                ",
  ],
  candle: [
    "       x        ",
    "      xRx       ",
    "      RyR       ",
    "       y        ",
    "       K        ",
    "     KKKKK      ",
    "     KCCCK      ",
    "     KCCCK      ",
    "     KCCCK      ",
    "     KCCCK      ",
    "     KCCCK      ",
    "     KCCCK      ",
    "    KKKKKKK     ",
    "    KCCCCCK     ",
    "     KKKKK      ",
    "                ",
  ],
  sword: [
    "       KK       ",
    "      KSSK      ",
    "      KSSK      ",
    "      KSSK      ",
    "      KSSK      ",
    "      KSSK      ",
    "      KSSK      ",
    "      KSSK      ",
    "   KKKKKKKKKK   ",
    "   KGGGGGGGGK   ",
    "      KwwK      ",
    "      KwwK      ",
    "      KwwK      ",
    "      KGGK      ",
    "       KK       ",
    "                ",
  ],
  potion: [
    "       KK       ",
    "       KK       ",
    "      KSSK      ",
    "      KSSK      ",
    "     KSSSSK     ",
    "    KSffffSK    ",
    "   KSffRRffSK   ",
    "   KSRRRRRRSK   ",
    "   KRRRRRRRRK   ",
    "   KRRRRRRRRK   ",
    "   KRRRRRRRRK   ",
    "   KSRRRRRRSK   ",
    "    KSRRRRSK    ",
    "    KKKKKKKK    ",
    "                ",
    "                ",
  ],
  coin: [
    "                ",
    "     KKKKKK     ",
    "   KKGGGGGGKK   ",
    "  KGGGGGGGGGGK  ",
    "  KGyyyyyyyyGK  ",
    "  KGyGGGGGGyGK  ",
    "  KGyGyyyyGyGK  ",
    "  KGyGyyyyGyGK  ",
    "  KGyGGGGGGyGK  ",
    "  KGyyyyyyyyGK  ",
    "  KGGGGGGGGGGK  ",
    "   KKGGGGGGKK   ",
    "     KKKKKK     ",
    "                ",
    "                ",
    "                ",
  ],

  // ── Merchant Showdown groceries — 12×12 ──
  milk: [
    "    KKKK    ",
    "   KK  KK   ",
    "   KffffK   ",
    "   KffffK   ",
    "  KKffffKK  ",
    "  KfBBBBfK  ",
    "  KfBBBBfK  ",
    "  KffffffK  ",
    "  KffffffK  ",
    "  KffffffK  ",
    "  KKKKKKKK  ",
    "            ",
  ],
  detergent: [
    "     KK     ",
    "    KSSK    ",
    "    KSSK    ",
    "   KbbbbK   ",
    "  KbBBBBbK  ",
    "  KbBBBBbK  ",
    "  KbBffBbK  ",
    "  KbBffBbK  ",
    "  KbBBBBbK  ",
    "  KbBBBBbK  ",
    "   KKKKKK   ",
    "            ",
  ],
  rice: [
    "            ",
    "   KKKKKK   ",
    "  KWWWWWWK  ",
    "  KWffffWK  ",
    "  KWffffWK  ",
    "  KWffffWK  ",
    "  KWWWWWWK  ",
    "  KWWWWWWK  ",
    "  KWWWWWWK  ",
    "  KKKKKKKK  ",
    "            ",
    "            ",
  ],
  choco: [
    "            ",
    "  KKKKKKKK  ",
    " KWWWWWWWWK ",
    " KWdwdwdwWK ",
    " KWwdwdwdWK ",
    " KWdwdwdwWK ",
    " KWwdwdwdWK ",
    " KWWWWWWWWK ",
    "  KKKKKKKK  ",
    "            ",
    "            ",
    "            ",
  ],
  tissue: [
    "            ",
    "     ff     ",
    "    ffff    ",
    "  KKKKKKKK  ",
    " KbBBBBBBbK ",
    " KbBffffBbK ",
    " KbBBBBBBbK ",
    " KbBBBBBBbK ",
    " KbBBBBBBbK ",
    " KKKKKKKKKK ",
    "            ",
    "            ",
  ],
  soda: [
    "            ",
    "   K KK K   ",
    "   KKKKKK   ",
    "  KrrrrrrK  ",
    "  KrRRRRrK  ",
    "  KrRffRrK  ",
    "  KrRffRrK  ",
    "  KrRRRRrK  ",
    "  KrrrrrrK  ",
    "  KrrrrrrK  ",
    "   KKKKKK   ",
    "            ",
  ],
  noodles: [
    "     t  t   ",
    "    t  t    ",
    "            ",
    "   KKKKKK   ",
    "  KffffffK  ",
    "  KWWWWWWK  ",
    "  KWyyyyWK  ",
    "  KWWWWWWK  ",
    "   KWWWWK   ",
    "   KWWWWK   ",
    "    KKKK    ",
    "            ",
  ],
  battery: [
    "     KK     ",
    "    KGGK    ",
    "   KKKKKK   ",
    "   KnNNnK   ",
    "   KnNNnK   ",
    "   KnyynK   ",
    "   KnyynK   ",
    "   KnNNnK   ",
    "   KnNNnK   ",
    "   KnNNnK   ",
    "   KKKKKK   ",
    "            ",
  ],
  meds: [
    "            ",
    "   KKKKKK   ",
    "   KaaaaK   ",
    "  KKKKKKKK  ",
    "  KSSSSSSK  ",
    "  KSSrrSSK  ",
    "  KSrrrrSK  ",
    "  KSSrrSSK  ",
    "  KSSSSSSK  ",
    "  KSSSSSSK  ",
    "  KKKKKKKK  ",
    "            ",
  ],
  juice: [
    "        K   ",
    "        K   ",
    "   KKKKKK   ",
    "  KGGGGGGK  ",
    "  KGyyyyGK  ",
    "  KGyrryGK  ",
    "  KGyyyyGK  ",
    "  KGGGGGGK  ",
    "  KGGGGGGK  ",
    "  KGGGGGGK  ",
    "   KKKKKK   ",
    "            ",
  ],
  bread: [
    "            ",
    "    KKKK    ",
    "  KKWWWWKK  ",
    " KWyyyyyyWK ",
    " KWyyyyyyWK ",
    " KwWWWWWWwK ",
    " KwWWWWWWwK ",
    " KwWWWWWWwK ",
    "  KKKKKKKK  ",
    "            ",
    "            ",
    "            ",
  ],
};

// Pre-compute run-length-merged rects + grid dimensions for each icon.
function pixRects(grid) {
  const rects = [];
  const h = grid.length;
  let w = 0;
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    if (row.length > w) w = row.length;
    let c = 0;
    while (c < row.length) {
      const ch = row[c];
      if (ch === " ") { c++; continue; }
      let len = 1;
      while (c + len < row.length && row[c + len] === ch) len++;
      rects.push([c, r, len, PIX_PAL[ch] || "#000"]);
      c += len;
    }
  }
  return { rects, w, h };
}
const PIX_RECTS = {};
Object.keys(PIX_ICONS).forEach(id => { PIX_RECTS[id] = pixRects(PIX_ICONS[id]); });

// Ordered list for the picker (grouped by category).
const QUEST_ICON_IDS = [
  "meal", "ale", "coffee",            // food & drink
  "sack", "gift", "gem",              // shopping / valuables
  "cart", "ship",                     // transport / travel
  "tent", "key", "barrel",            // stay / home / provisions
  "scroll", "book", "dice", "candle", // services / fun / utilities
  "sword", "potion", "coin",          // gear / health / money
];

// Ordered list for the Merchant Showdown item picker (groceries).
const ITEM_ICON_IDS = [
  "milk", "detergent", "rice", "choco", "coffee", "tissue",
  "soda", "noodles", "battery", "meds", "juice", "bread",
];

// Category names (TH / EN) so pickers can label each icon — kills any ambiguity.
const QUEST_ICON_NAMES = {
  meal: { th: "อาหาร", en: "Food" },
  ale: { th: "เครื่องดื่ม", en: "Drinks" },
  coffee: { th: "กาแฟ", en: "Coffee" },
  sack: { th: "ช้อปปิ้ง", en: "Shopping" },
  gift: { th: "ของขวัญ", en: "Gift" },
  gem: { th: "ของมีค่า", en: "Valuables" },
  cart: { th: "เดินทาง", en: "Transport" },
  ship: { th: "ท่องเที่ยว", en: "Travel" },
  tent: { th: "แคมป์", en: "Camping" },
  key: { th: "ที่พัก", en: "Lodging" },
  barrel: { th: "เชื้อเพลิง", en: "Fuel" },
  scroll: { th: "บิล/เอกสาร", en: "Bills" },
  book: { th: "หนังสือ", en: "Books" },
  dice: { th: "บันเทิง", en: "Fun" },
  candle: { th: "ของใช้บ้าน", en: "Home" },
  sword: { th: "อุปกรณ์", en: "Gear" },
  potion: { th: "สุขภาพ", en: "Health" },
  coin: { th: "อื่นๆ", en: "Other" },
};
const ITEM_ICON_NAMES = {
  milk: { th: "นม", en: "Milk" },
  detergent: { th: "ผงซักฟอก", en: "Detergent" },
  rice: { th: "ข้าวสาร", en: "Rice" },
  choco: { th: "ช็อกโกแลต", en: "Chocolate" },
  coffee: { th: "กาแฟ", en: "Coffee" },
  tissue: { th: "ทิชชู่", en: "Tissue" },
  soda: { th: "น้ำอัดลม", en: "Soda" },
  noodles: { th: "บะหมี่", en: "Noodles" },
  battery: { th: "ถ่าน", en: "Battery" },
  meds: { th: "ยา", en: "Medicine" },
  juice: { th: "น้ำผลไม้", en: "Juice" },
  bread: { th: "ขนมปัง", en: "Bread" },
};
function iconLabel(id, lang) {
  const n = QUEST_ICON_NAMES[id] || ITEM_ICON_NAMES[id];
  return n ? (n[lang] || n.en) : "";
}

function escapeIconText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function questIconSvg(value, size = 24, className = "") {
  const g = PIX_RECTS[value];
  const cls = className ? " " + className : "";
  if (!g) {
    return `<span class="qi-emoji${cls}" style="font-size:${Math.round(size * 0.84)}px;line-height:1">${escapeIconText(value)}</span>`;
  }
  const rects = g.rects.map((R) => `<rect x="${R[0]}" y="${R[1]}" width="${R[2]}" height="1" fill="${R[3]}"></rect>`).join("");
  return `<svg class="qi${cls}" width="${size}" height="${size}" viewBox="0 0 ${g.w} ${g.h}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

function QuestIcon({ value, size = 24, className } = {}) {
  return questIconSvg(value, size, className);
}

Object.assign(window, { PIX_PAL, PIX_ICONS, PIX_RECTS, pixRects, QUEST_ICON_IDS, ITEM_ICON_IDS,
  QUEST_ICON_NAMES, ITEM_ICON_NAMES, iconLabel, QuestIcon, questIconSvg,
  QUEST_ICONS: QUEST_ICON_IDS, ITEM_ICONS: ITEM_ICON_IDS });

// Legacy emoji → pixel-id map so previously-saved expenses upgrade to pixel art.
const ICON_MIGRATE = {
  "🍜": "meal", "🍚": "meal", "🍔": "meal", "🍕": "meal", "🍰": "meal", "🦞": "meal", "🥩": "meal", "🍦": "meal", "🍱": "meal",
  "☕": "coffee", "🍺": "ale", "🍷": "ale",
  "🛒": "sack", "👕": "sack", "👟": "sack", "🎒": "sack",
  "🎁": "gift", "💄": "gem", "💎": "gem", "👑": "gem",
  "🚕": "cart", "🚌": "cart", "🚆": "cart", "🚲": "cart", "🅿️": "cart",
  "✈️": "ship", "🧳": "ship", "⚓": "ship", "⛵": "ship", "🏖️": "ship",
  "🏕️": "tent", "⛺": "tent",
  "🏨": "key", "🏠": "key", "🏙️": "coin",
  "⛽": "barrel", "🧊": "barrel", "💧": "barrel",
  "🎟️": "dice", "🎬": "dice", "🎮": "dice", "🎵": "dice", "⚽": "dice", "🎉": "gift",
  "📚": "book", "🧾": "scroll", "📜": "scroll",
  "💡": "candle", "📶": "candle", "🪵": "candle",
  "🔧": "sword", "💪": "sword", "🏄": "sword",
  "💊": "potion", "🏥": "potion",
  "📱": "coin", "💻": "coin", "🐾": "coin", "💰": "coin",
};
function migrateIcon(v) {
  if (v && PIX_RECTS[v]) return v;        // already a pixel id
  return (v && ICON_MIGRATE[v]) || v || "coin";
}
// Merchant Showdown grocery emoji → pixel id.
const ITEM_MIGRATE = {
  "🥛": "milk", "🧴": "detergent", "🍚": "rice", "🍫": "choco", "☕": "coffee", "🧻": "tissue",
  "🥤": "soda", "🍜": "noodles", "🔋": "battery", "💊": "meds", "🧃": "juice", "🍞": "bread",
};
function migrateItemIcon(v) {
  if (v && PIX_RECTS[v]) return v;
  return (v && ITEM_MIGRATE[v]) || v || "milk";
}
Object.assign(window, { ICON_MIGRATE, migrateIcon, ITEM_MIGRATE, migrateItemIcon });
