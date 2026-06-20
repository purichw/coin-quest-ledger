(function () {
  const PROFILE_KEY = 'pointy_profile_v1';
  const UI_KEY = 'coin_quest_ui_v1';
  const THEME_KEY = 'pointy_theme';
  const AUTH_KEY = 'pointy_auth_v1';
  const ACCOUNTS_KEY = 'pointy_accounts_v1';
  const CHARACTER_REGISTRY_KEY = 'pointy_character_registry_v1';
  const TRIP_CACHE_KEY = 'coin_quest_trip_snapshots_v1';
  const ADMIN_OWNER_TOKEN_KEY = 'pointy_admin_owner_token_v1';
  const TEST_FLAG_KEY = 'pointy_test_mode_v1';
  const PENDING_RECOVERY_KEY = 'pointy_pending_recovery_code_v1';
  const USERNAME_DOMAIN = 'coinquest.local';
  const URL_TEST_MODE = new URLSearchParams(location.search || '').get('test') === '1';
  if (URL_TEST_MODE) {
    try { sessionStorage.setItem(TEST_FLAG_KEY, '1'); } catch (_) {}
  }
  const TEST_MODE = URL_TEST_MODE || (() => {
    try { return sessionStorage.getItem(TEST_FLAG_KEY) === '1'; } catch (_) { return false; }
  })();
  const AUTOMATED = navigator.webdriver === true;
  const DUMMY_ACCOUNTS = [
    { username: 'pointy', email: 'pointy@line.me', password: 'quest123', userId: '3720', name: 'Pointy', character: { id: '3720', name: 'Pointy', class: 'archfiend', cls: 'archfiend', gender: 'male', skin: 'archfiend-swimmer-blackred' } },
    { username: 'nok', email: 'nok.k@line.me', password: 'quest123', userId: '9637', name: 'Nok', character: { id: '9637', name: 'Nok', class: 'ranger', cls: 'ranger', gender: 'female', skin: '' } },
    { username: 'bank', email: 'bank@line.me', password: 'quest123', userId: '5521', name: 'Bank', character: { id: '5521', name: 'Bank', class: 'thief', cls: 'thief', gender: 'male', skin: '' } }
  ];

  const STR = {
    th: {
      loginWelcome: 'ยินดีต้อนรับกลับฮีโร่',
      loginSub: 'ลงชื่อเข้าสู่บัญชีของคุณ',
      loginEmail: 'Username',
      loginPassword: 'รหัสผ่าน',
      loginEnter: 'ผจญภัยต่อ!',
      loginEmailPlaceholder: 'pointy',
      loginPasswordPlaceholder: '••••••••',
      loginError: 'username หรือรหัสผ่านไม่ถูกต้อง',
      loginEmpty: 'กรอก username และรหัสผ่าน',
      loginDemo: 'บัญชีทดลอง - แตะเพื่อกรอกให้อัตโนมัติ',
      loginNote: 'สาธิตจำลอง - ยังไม่ได้เชื่อมต่อระบบจริง',
      loginNoteReal: 'บัญชีจริงผ่าน Firebase Auth - ใช้ username/password ไม่ต้องใช้อีเมลจริง',
      authUserExists: 'username นี้ถูกใช้แล้ว',
      authUserMissing: 'ไม่พบ username นี้',
      authWeakPassword: 'รหัสผ่านอย่างน้อย 6 ตัว',
      authGeneric: 'เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง',
      authBlocked: 'บัญชีนี้ถูกระงับหรือรอลบ กรุณาติดต่อผู้ดูแล',
      forgotPassword: 'ลืมรหัสผ่าน?',
      resetTitle: 'กู้รหัสผ่าน',
      resetSub: 'ใช้ recovery code เพื่อตั้งรหัสใหม่ โดยไม่ต้องใช้อีเมล',
      recoveryCode: 'Recovery code',
      newPassword: 'รหัสผ่านใหม่',
      resetConfirm: 'ตั้งรหัสใหม่',
      resetBadCode: 'Recovery code ไม่ถูกต้อง',
      recoveryTitle: 'เก็บ recovery code นี้ไว้',
      recoverySub: 'ใช้ code นี้กู้บัญชีถ้าลืมรหัสผ่าน ระบบจะแสดงให้ดูครั้งนี้เท่านั้น',
      recoverySaved: 'ฉันเก็บไว้แล้ว',
      copyRecovery: 'คัดลอก code',
      loginSignIn: 'เข้าสู่ระบบ',
      loginSignUp: 'สมัครใหม่',
      signupWelcome: 'ร่วมกิลด์นักผจญภัย',
      signupSub: 'สร้างบัญชีและรับ User ID 4 หลัก',
      signupName: 'ชื่อที่แสดง',
      signupNamePlaceholder: 'ชื่อของคุณ',
      signupConfirm: 'ยืนยันรหัสผ่าน',
      signupCreate: 'สร้างบัญชี',
      signupTaken: 'อีเมลนี้ถูกใช้แล้ว',
      signupNameMissing: 'กรอกชื่อที่แสดง',
      signupPasswordShort: 'รหัสผ่านอย่างน้อย 6 ตัว',
      signupPasswordMismatch: 'รหัสผ่านไม่ตรงกัน',
      charTitle: 'สร้างตัวละครของคุณ',
      charSub: 'หนึ่งบัญชี = หนึ่งตัวละคร — เลือกฮีโร่ที่เป็นตัวคุณ',
      charName: 'ชื่อตัวละคร',
      charCreate: 'เริ่มผจญภัย!',
      charNamePlaceholder: 'ตั้งชื่อฮีโร่',
      tapToChoose: 'แตะเลือกฮีโร่',
      chooseHero: 'เลือกฮีโร่ของคุณ',
      chooseHeroSub: 'แตะเพื่อเลือกตัวละคร',
      allHeroes: 'ทั้งหมด',
      female: 'หญิง',
      male: 'ชาย',
      yourUserId: 'User ID ของคุณ',
      myBoards: 'บอร์ดของฉัน',
      myBoardsSub: 'บอร์ดที่คุณเป็นแอดมินหรือผูกกับตัวละครนี้',
      noBoards: 'ยังไม่มีบอร์ดที่คุณดูแล',
      openBoard: 'เปิดบอร์ด',
      viewFullProfile: 'ดูโปรไฟล์เต็ม',
      profile: 'โปรไฟล์นักผจญภัย',
      profileSub: 'Renown รวมจาก Compare Prices, Party Ledger, Debt Dragon และคลังหลวง',
      profileLvl: 'เลเวลรวม',
      renown: 'Renown',
      trophies: 'Trophy Hall',
      streakDays: 'วัน',
      streakLab: 'สตรีคเข้าใช้งาน',
      bestStreak: 'สูงสุด',
      streakToday: 'วันนี้นับแล้ว',
      settings: 'ตั้งค่า',
      themeLight: 'โหมดสว่าง',
      themeDark: 'โหมดดันเจียน',
      takeTour: 'ดู Welcome Tour อีกครั้ง',
      backup: 'สำรองข้อมูล',
      backupSub: 'Export / Restore ข้อมูล localStorage ของ Coin Quest Ledger',
      exportData: 'Export',
      importData: 'Restore',
      backupBad: 'ไฟล์ backup ไม่ถูกต้อง',
      backupRestored: 'กู้ข้อมูลแล้ว กำลังโหลดใหม่',
      restoreConfirm: 'Restore backup นี้? ข้อมูล localStorage ปัจจุบันจะถูกเขียนทับ',
      reminders: 'Reminders',
      noReminders: 'ยังไม่มีอะไรต้องรีบจัดการ',
      remOverdue: 'เลยกำหนดแล้ว',
      remToday: 'ครบกำหนดวันนี้',
      remDueIn: 'ครบกำหนดใน {n} วัน',
      remSettleUp: 'มีบรรณาการที่ยังไม่เคลียร์',
      remJump: 'ไป',
      tributes: 'รายการ',
      newTrophy: 'ปลดล็อก Trophy',
      tourSkip: 'ข้าม',
      tourBack: 'กลับ',
      tourNext: 'ถัดไป',
      tourDone: 'เริ่มลุย',
      tourT0: 'ยินดีต้อนรับสู่ Coin Quest',
      tourB0: 'ทุกโมดูลแชร์ความคืบหน้ากลางผ่าน Renown, Trophy และ Hero Profile',
      tourT1: 'Compare Prices',
      tourB1: 'เทียบดีลต่อหน่วย เก็บสถิตินักล่าดีล แล้วส่งรายการที่ชนะเข้า Party Ledger ได้',
      tourT2: 'Debt Dragon',
      tourB2: 'เปลี่ยนหนี้เป็นมังกร ตั้งวันครบกำหนด และฟันทีละงวดจนถ้ำโล่ง',
      tourT3: 'Party Ledger',
      tourB3: 'บันทึกเควส แบ่งค่าใช้จ่าย แนบใบเสร็จ และเคลียร์บรรณาการหลังทริป',
      tourT4: 'คลังหลวง',
      tourB4: 'ตั้งงบรายเดือน ปกป้องคลังจากรายจ่ายและบิลที่บุกมาทุกเดือน',
      hero: 'Hero',
      lvl: 'LVL',
      signOut: 'ออกจากระบบ',
      signOutDone: 'ออกจากระบบแล้ว',
      userId: 'User ID'
    },
    en: {
      loginWelcome: 'Welcome back, hero',
      loginSub: 'Sign in to your guild account',
      loginEmail: 'Username',
      loginPassword: 'Password',
      loginEnter: 'Enter the realm!',
      loginEmailPlaceholder: 'pointy',
      loginPasswordPlaceholder: '••••••••',
      loginError: 'Wrong username or password',
      loginEmpty: 'Enter a username and password',
      loginDemo: 'Demo accounts - tap one to autofill',
      loginNote: 'Mock sign-in - not connected to a real backend yet',
      loginNoteReal: 'Real Firebase Auth account - username/password only, no real email required',
      authUserExists: 'That username is already taken',
      authUserMissing: 'Username not found',
      authWeakPassword: 'Password must be 6+ characters',
      authGeneric: 'Could not sign in. Try again',
      authBlocked: 'This account is archived, deactivated, or pending deletion. Contact an admin.',
      forgotPassword: 'Forgot password?',
      resetTitle: 'Recover password',
      resetSub: 'Use your recovery code to set a new password without email',
      recoveryCode: 'Recovery code',
      newPassword: 'New password',
      resetConfirm: 'Set new password',
      resetBadCode: 'Wrong recovery code',
      recoveryTitle: 'Save this recovery code',
      recoverySub: 'Use this code to recover your account if you forget your password. It is shown only once.',
      recoverySaved: 'I saved it',
      copyRecovery: 'Copy code',
      loginSignIn: 'Sign In',
      loginSignUp: 'Sign Up',
      signupWelcome: 'Join the adventure',
      signupSub: 'Create an account and receive a 4-digit User ID',
      signupName: 'Display name',
      signupNamePlaceholder: 'Your name',
      signupConfirm: 'Confirm password',
      signupCreate: 'Create account',
      signupTaken: 'That email is already registered',
      signupNameMissing: 'Enter a display name',
      signupPasswordShort: 'Password must be 6+ characters',
      signupPasswordMismatch: 'Passwords do not match',
      charTitle: 'Create your character',
      charSub: "One account = one character - pick the hero that's you",
      charName: 'Character name',
      charCreate: 'Begin the adventure!',
      charNamePlaceholder: 'Name your hero',
      tapToChoose: 'Tap to choose your hero',
      chooseHero: 'Choose your hero',
      chooseHeroSub: 'Pick the character that represents you',
      allHeroes: 'All',
      female: 'Female',
      male: 'Male',
      yourUserId: 'Your User ID',
      myBoards: 'My Boards',
      myBoardsSub: 'Boards you administer or own with this character',
      noBoards: 'No boards you admin yet',
      openBoard: 'Open board',
      viewFullProfile: 'View full profile',
      profile: 'Hero Profile',
      profileSub: 'Renown from Compare Prices, Party Ledger, Debt Dragon, and Personal Treasury',
      profileLvl: 'Overall level',
      renown: 'Renown',
      trophies: 'Trophy Hall',
      streakDays: 'days',
      streakLab: 'Daily streak',
      bestStreak: 'Best',
      streakToday: 'Counted today',
      settings: 'Settings',
      themeLight: 'Light mode',
      themeDark: 'Dungeon mode',
      takeTour: 'Replay Welcome Tour',
      backup: 'Data backup',
      backupSub: 'Export / Restore Coin Quest Ledger localStorage data',
      exportData: 'Export',
      importData: 'Restore',
      backupBad: 'Invalid backup file',
      backupRestored: 'Restored. Reloading',
      restoreConfirm: 'Restore this backup? Current localStorage data will be overwritten.',
      reminders: 'Reminders',
      noReminders: 'Nothing urgent yet',
      remOverdue: 'Overdue',
      remToday: 'Due today',
      remDueIn: 'Due in {n} days',
      remSettleUp: 'Pending settle-ups',
      remJump: 'Go',
      tributes: 'items',
      newTrophy: 'Trophy Unlocked',
      tourSkip: 'Skip',
      tourBack: 'Back',
      tourNext: 'Next',
      tourDone: 'Begin',
      tourT0: 'Welcome to Coin Quest',
      tourB0: 'Every module feeds one shared profile through Renown, trophies, and reminders.',
      tourT1: 'Compare Prices',
      tourB1: 'Compare unit prices, track deal-hunting wins, and send winners into Party Ledger.',
      tourT2: 'Debt Dragon',
      tourB2: 'Turn debts into dragons, track due dates, and strike them down payment by payment.',
      tourT3: 'Party Ledger',
      tourB3: 'Log quests, split expenses, attach receipts, and settle tribute after the trip.',
      tourT4: 'Personal Treasury',
      tourB4: 'Set a monthly budget, defend the vault from spending, and tame recurring bills.',
      hero: 'Hero',
      lvl: 'LVL',
      signOut: 'Sign out',
      signOutDone: 'Signed out',
      userId: 'User ID'
    }
  };

  const ACHIEVEMENTS = [
    { id: 'first_quest', icon: '📜', th: ['ก้าวแรก', 'บันทึกเควสแรกของคุณ'], en: ['First Steps', 'Log your first quest'], test: c => c.quests >= 1 },
    { id: 'party5', icon: '🛡️', th: ['รวมพล', 'ปาร์ตี้ที่มีฮีโร่ 5 คนขึ้นไป'], en: ['Full Party', 'A party of 5+ heroes'], test: c => c.maxPartySize >= 5, prog: c => [Math.min(c.maxPartySize, 5), 5] },
    { id: 'balanced', icon: '⚖️', th: ['สมดุล', 'ปรับสมดุลปาร์ตี้จนจบเควส'], en: ['Even Steven', 'Fully settle a quest'], test: c => c.completed >= 1 },
    { id: 'quest_master', icon: '🗺️', th: ['เจ้าแห่งเควส', 'จบเควสครบ 3 ทริป'], en: ['Quest Master', 'Complete 3 quests'], test: c => c.completed >= 3, prog: c => [Math.min(c.completed, 3), 3] },
    { id: 'treasurer', icon: '💰', th: ['ขุนคลัง', 'บันทึกค่าใช้จ่ายรวม ฿50,000'], en: ['Treasurer', 'Log ฿50,000 in expenses'], test: c => c.totalLogged >= 50000, prog: c => [Math.min(c.totalLogged, 50000), 50000] },
    { id: 'generous', icon: '🤝', th: ['ใจบุญ', 'ออกทองให้คนอื่นรวม ฿20,000'], en: ['Generous Soul', 'Front ฿20,000 for others'], test: c => c.fronted >= 20000, prog: c => [Math.min(c.fronted, 20000), 20000] },
    { id: 'first_strike', icon: '⚔️', th: ['ดาบแรก', 'ฟันมังกรครั้งแรก'], en: ['First Strike', 'Land your first dragon strike'], test: c => c.strikes >= 1 },
    { id: 'slayer', icon: '🐉', th: ['นักล่ามังกร', 'ปราบมังกรตัวแรก'], en: ['Dragonslayer', 'Slay your first dragon'], test: c => c.slain >= 1 },
    { id: 'lair_cleared', icon: '🏆', th: ['ปลอดหนี้', 'ปราบมังกรทุกตัวในถ้ำ'], en: ['Lair Cleared', 'Slay every dragon'], test: c => c.slain >= 1 && c.liveDragons === 0 },
    { id: 'heavy_hit', icon: '💥', th: ['หมัดหนัก', 'ฟันครั้งเดียว ฿20,000+'], en: ['Heavy Hitter', 'A single strike of ฿20,000+'], test: c => c.biggestHit >= 20000 },
    { id: 'deal_hunter', icon: '🔍', th: ['นักล่าดีล', 'ประลองราคา 3 รายการ'], en: ['Deal Hunter', 'Run 3 price showdowns'], test: c => c.showdowns >= 3, prog: c => [Math.min(c.showdowns, 3), 3] },
    { id: 'bargain', icon: '👑', th: ['ดีลในตำนาน', 'เจอดีลที่ประหยัด 40%+'], en: ['Bargain Legend', 'Find a deal saving 40%+'], test: c => c.bestRescue >= 40 },
    { id: 'vault_keeper', icon: '🏦', th: ['ผู้พิทักษ์คลัง', 'บันทึกรายจ่ายในคลังหลวงครั้งแรก'], en: ['Vault Keeper', 'Log your first treasury expense'], test: c => (c.trLogged || 0) >= 1 },
    { id: 'under_budget', icon: '🛡️', th: ['คุมงบสำเร็จ', 'ปิดเดือนแบบไม่เกินงบ'], en: ['Under Budget', 'Finish a month under budget'], test: c => (c.monthsWon || 0) >= 1 },
    { id: 'frugal_legend', icon: '💎', th: ['ตำนานประหยัด', 'คุมงบได้ 3 เดือน'], en: ['Frugal Legend', 'Win 3 budget months'], test: c => (c.monthsWon || 0) >= 3, prog: c => [Math.min(c.monthsWon || 0, 3), 3] },
    { id: 'streak3', icon: '🔥', th: ['มาแรง', 'เข้าเล่นต่อเนื่อง 3 วัน'], en: ['On a Roll', 'A 3-day streak'], test: c => (c.streak || 0) >= 3, prog: c => [Math.min(c.streak || 0, 3), 3] },
    { id: 'streak7', icon: '📅', th: ['ขาประจำ', 'เข้าเล่นต่อเนื่อง 7 วัน'], en: ['Devoted', 'A 7-day streak'], test: c => (c.streak || 0) >= 7, prog: c => [Math.min(c.streak || 0, 7), 7] },
    { id: 'level5', icon: '⭐', th: ['ผู้กล้า', 'ถึงเลเวลรวม 5'], en: ['Rising Hero', 'Reach overall level 5'], test: c => c.level.lvl >= 5, prog: c => [Math.min(c.level.lvl, 5), 5] },
    { id: 'level10', icon: '🌟', th: ['ตำนาน', 'ถึงเลเวลรวม 10'], en: ['Legend', 'Reach overall level 10'], test: c => c.level.lvl >= 10, prog: c => [Math.min(c.level.lvl, 10), 10] }
  ];

  let profile = null;
  let context = null;
  let reminders = [];
  let overlay = null;
  let loginGate = null;
  let loginMode = 'in';
  let toastTimer = null;
  let baselineDone = false;

  function lang() { return window.LANG === 'en' ? 'en' : 'th'; }
  function s() { return STR[lang()]; }
  function h(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function readJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; } }
  function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function readScopedJson(key, fallback) {
    return window.PointyScope?.getJSON ? window.PointyScope.getJSON(key, fallback) : readJson(key, fallback);
  }
  function writeScopedJson(key, value) {
    if (window.PointyScope?.setJSON) window.PointyScope.setJSON(key, value);
    else writeJson(key, value);
  }
  function hasScopedAccount() {
    return !!window.PointyScope?.accountKey?.();
  }
  function genId4() { return String(Math.floor(1000 + Math.random() * 9000)); }
  function normalizeUsername(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32);
  }
  function usernameEmail(username) {
    const clean = normalizeUsername(username);
    return `${clean || 'user'}@${USERNAME_DOMAIN}`;
  }
  function accountLogin(account) {
    return normalizeUsername(account?.username || String(account?.email || '').split('@')[0] || account?.name || '');
  }
  function realAuthEnabled() {
    return !TEST_MODE && !AUTOMATED && !!window.PointyFirebase?.auth?.() && !!window.PointyFirebase?.firestore?.();
  }
  function cloudDb() { return window.PointyFirebase?.firestore?.() || null; }
  function cloudAuth() { return window.PointyFirebase?.auth?.() || null; }
  function cloudNow() { return window.PointyFirebase?.serverTimestamp?.() || Date.now(); }
  function recoveryCodeValue() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => alphabet[b % alphabet.length]).join('').replace(/(.{4})/g, '$1-').replace(/-$/, '');
  }
  function cleanRecoveryCode(code) {
    return String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  async function sha256(text) {
    const data = new TextEncoder().encode(String(text || ''));
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  async function recoveryHash(username, code) {
    return sha256(`${normalizeUsername(username)}:${cleanRecoveryCode(code)}`);
  }
  function storePendingRecovery(code) {
    try { sessionStorage.setItem(PENDING_RECOVERY_KEY, code || ''); } catch (_) {}
  }
  function consumePendingRecovery() {
    try {
      const code = sessionStorage.getItem(PENDING_RECOVERY_KEY) || '';
      sessionStorage.removeItem(PENDING_RECOVERY_KEY);
      return code;
    } catch (_) {
      return '';
    }
  }
  function authEmailForUsername(username, suffix = '') {
    const clean = normalizeUsername(username);
    return suffix ? `${clean}.${suffix}@${USERNAME_DOMAIN}` : usernameEmail(clean);
  }
  async function usernameRecord(username) {
    const db = cloudDb();
    const clean = normalizeUsername(username);
    if (!db || !clean) return null;
    const snap = await db.collection('usernames').doc(clean).get();
    return snap.exists ? { id: clean, ...(snap.data() || {}) } : null;
  }
  async function saveUsernameRecord(account, extra = {}) {
    const db = cloudDb();
    const username = normalizeUsername(account?.username);
    if (!db || !username) return;
    await db.collection('usernames').doc(username).set({
      username,
      uid: account.uid || '',
      authEmail: account.email || usernameEmail(username),
      userId: account.userId || '',
      characterId: account.character?.id || extra.characterId || '',
      updatedAt: cloudNow(),
      ...(extra.recoveryHash ? { recoveryHash: extra.recoveryHash, recoveryIssuedAt: extra.recoveryIssuedAt || Date.now() } : {}),
      ...(extra.create ? { createdAt: cloudNow() } : {})
    }, { merge: true });
  }
  async function resolveAuthEmail(username) {
    const rec = await usernameRecord(username);
    return rec?.authEmail || usernameEmail(username);
  }
  function loadAccounts() {
    const accounts = readJson(ACCOUNTS_KEY, []);
    return Array.isArray(accounts) ? accounts : [];
  }
  function saveAccounts(accounts) {
    writeJson(ACCOUNTS_KEY, Array.isArray(accounts) ? accounts : []);
  }
  function allAccounts() {
    return [...DUMMY_ACCOUNTS, ...loadAccounts()];
  }
  function normalizeAccount(account) {
    if (!account) return null;
    const character = account.character ? normalizeCharacter(account.character, account) : null;
    const username = accountLogin(account);
    const status = String(account.status || account.lifecycleStatus || 'active').toLowerCase();
    return {
      uid: account.uid || account.authUid || '',
      provider: account.provider || account.authProvider || '',
      username,
      email: account.email || usernameEmail(username),
      userId: String(account.userId || genId4()).replace(/\D/g, '').slice(0, 4) || genId4(),
      name: account.name || username || 'Hero',
      status,
      character
    };
  }
  function isBlockedAccountStatus(account) {
    return ['archived', 'deactivated', 'delete_requested', 'deleted'].includes(String(account?.status || '').toLowerCase());
  }
  function normalizeCharacter(character, account = {}) {
    if (!character) return null;
    const cls = window.PointyLogic?.normalizeClass ? window.PointyLogic.normalizeClass(character.class || character.cls || 'warrior') : (character.class || character.cls || 'warrior');
    const gender = character.gender === 'female' ? 'female' : 'male';
    const id = String(character.id || account.userId || genId4()).replace(/\D/g, '').slice(0, 4) || genId4();
    return { id, name: character.name || account.name || 'Hero', class: cls, cls, gender, skin: character.skin || '' };
  }
  function persistCharacter(character, account = null) {
    const rec = normalizeCharacter(character);
    if (!rec?.id) return rec;
    const registry = window.PointyScope?.getJSON
      ? window.PointyScope.getJSON(CHARACTER_REGISTRY_KEY, {}, { account })
      : readJson(CHARACTER_REGISTRY_KEY, {}) || {};
    registry[rec.id] = { ...(registry[rec.id] || {}), id: rec.id, name: rec.name, class: rec.class, gender: rec.gender, skin: rec.skin, updatedAt: Date.now(), createdAt: registry[rec.id]?.createdAt || Date.now() };
    if (window.PointyScope?.setJSON) window.PointyScope.setJSON(CHARACTER_REGISTRY_KEY, registry, { account });
    else writeJson(CHARACTER_REGISTRY_KEY, registry);
    return rec;
  }
  function ownerHash(token) {
    const hash = window.PointyLogic?.hashOf ? window.PointyLogic.hashOf(`pointy:${token || ''}:owner`) : 0;
    return String(hash);
  }
  function currentOwnerHash() {
    try {
      const token = localStorage.getItem(ADMIN_OWNER_TOKEN_KEY);
      return token ? ownerHash(token) : '';
    } catch (_) {
      return '';
    }
  }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function defaultProfile() { return { lastVisit: null, streak: 0, bestStreak: 0, seen: [], tourSeen: false }; }
  function loadProfile() { return { ...defaultProfile(), ...readScopedJson(PROFILE_KEY, {}) }; }
  function saveProfile(next) { profile = { ...defaultProfile(), ...next }; writeScopedJson(PROFILE_KEY, profile); return profile; }
  function patchProfile(patch) { return saveProfile({ ...loadProfile(), ...patch }); }
  function loadAuth() {
    const auth = readJson(AUTH_KEY, null);
    if (auth && auth.email && auth.userId && !auth.signedOut) {
      const normalized = normalizeAccount(auth);
      if (isBlockedAccountStatus(normalized)) {
        clearAuth();
        return null;
      }
      return normalized;
    }
    return (TEST_MODE || AUTOMATED) ? normalizeAccount(DUMMY_ACCOUNTS[0]) : null;
  }
  function saveAuth(account) {
    const next = normalizeAccount(account);
    if (next?.character) next.character = persistCharacter({ ...next.character, id: next.character.id || next.userId }, next);
    writeJson(AUTH_KEY, next);
    return next;
  }
  function publicUserIdFromUid(uid) {
    const hash = window.PointyLogic?.hashOf ? window.PointyLogic.hashOf(String(uid || 'user')) : [...String(uid || 'user')].reduce((sum, c) => ((sum * 31 + c.charCodeAt(0)) | 0), 7);
    return String(Math.abs(hash) % 9000 + 1000).slice(0, 4);
  }
  async function allocateCloudUserId(uid) {
    const db = cloudDb();
    if (!db) return publicUserIdFromUid(uid);
    const stable = publicUserIdFromUid(uid);
    try {
      const snap = await db.collection('users').where('userId', '==', stable).limit(1).get();
      if (snap.empty || snap.docs.some(doc => doc.id === uid)) return stable;
    } catch (_) {
      return stable;
    }
    for (let i = 0; i < 16; i += 1) {
      const id = genId4();
      try {
        const snap = await db.collection('users').where('userId', '==', id).limit(1).get();
        if (snap.empty) return id;
      } catch (_) {
        return publicUserIdFromUid(uid);
      }
    }
    return publicUserIdFromUid(uid);
  }
  function accountFromFirebaseUser(user, data = {}) {
    const username = normalizeUsername(data.username || user?.displayName || String(user?.email || '').split('@')[0]);
    return normalizeAccount({
      uid: user?.uid || data.uid || '',
      provider: 'firebase',
      username,
      email: user?.email || data.email || usernameEmail(username),
      userId: data.userId || publicUserIdFromUid(user?.uid || username),
      name: data.name || username || 'Hero',
      status: data.status || data.lifecycleStatus || 'active',
      character: data.character || null
    });
  }
  async function saveCloudUser(account, extra = {}) {
    const db = cloudDb();
    if (!db || !account?.uid) return;
    await db.collection('users').doc(account.uid).set({
      uid: account.uid,
      username: account.username,
      email: account.email,
      userId: account.userId,
      name: account.name,
      status: account.status || 'active',
      character: account.character || null,
      characterId: account.character?.id || extra.characterId || '',
      provider: 'firebase',
      updatedAt: cloudNow(),
      ...(extra.recoveryHash ? { recoveryHash: extra.recoveryHash, recoveryIssuedAt: extra.recoveryIssuedAt || Date.now() } : {}),
      ...(extra.create ? { createdAt: cloudNow() } : {})
    }, { merge: true });
    await saveUsernameRecord(account, extra);
  }
  async function loadCloudAccount(user) {
    const db = cloudDb();
    if (!db || !user) return null;
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
    if (snap.exists) return accountFromFirebaseUser(user, snap.data() || {});
    const username = normalizeUsername(user.displayName || String(user.email || '').split('@')[0]);
    const account = normalizeAccount({
      uid: user.uid,
      provider: 'firebase',
      username,
      email: user.email || usernameEmail(username),
      userId: await allocateCloudUserId(user.uid),
      name: username || 'Hero',
      character: null
    });
    await saveCloudUser(account, { create: true });
    return account;
  }
  async function saveCloudCharacter(account, character) {
    const db = cloudDb();
    if (!db || !account?.uid || !character?.id) return;
    const rec = normalizeCharacter(character, account);
    await db.collection('characters').doc(rec.id).set({
      ...rec,
      ownerUid: account.uid,
      userId: account.userId,
      username: account.username,
      accountName: account.name,
      updatedAt: Date.now(),
      createdAt: Date.now()
    }, { merge: true });
    await saveCloudUser({ ...account, character: rec }, { characterId: rec.id });
  }
  function authErrorMessage(err) {
    const code = String(err?.code || '');
    if (code.includes('email-already-in-use')) return s().authUserExists;
    if (code.includes('user-not-found') || code.includes('invalid-credential') || code.includes('wrong-password')) return s().authUserMissing;
    if (code.includes('weak-password')) return s().authWeakPassword;
    if (code.includes('operation-not-allowed') || code.includes('configuration-not-found')) return 'Firebase Authentication ยังไม่ได้เปิดใน Firebase Console';
    return s().authGeneric;
  }
  async function recoverWithCode(username, code, password) {
    const clean = normalizeUsername(username);
    if (!clean || !password) throw new Error('missing');
    const rec = await usernameRecord(clean);
    if (!rec?.recoveryHash) throw new Error('bad-recovery-code');
    const hash = await recoveryHash(clean, code);
    if (hash !== rec.recoveryHash) throw new Error('bad-recovery-code');
    const db = cloudDb();
    const oldUser = rec.uid ? await db.collection('users').doc(rec.uid).get().then(snap => snap.exists ? snap.data() : {}) : {};
    const authEmail = authEmailForUsername(clean, `r${Date.now().toString(36)}`);
    const cred = await cloudAuth().createUserWithEmailAndPassword(authEmail, password);
    await cred.user.updateProfile({ displayName: clean });
    const newRecoveryCode = recoveryCodeValue();
    const next = normalizeAccount({
      ...(oldUser || {}),
      uid: cred.user.uid,
      provider: 'firebase',
      username: clean,
      email: authEmail,
      userId: oldUser?.userId || rec.userId || await allocateCloudUserId(cred.user.uid),
      name: oldUser?.name || clean,
      character: oldUser?.character || null
    });
    const newRecoveryHash = await recoveryHash(clean, newRecoveryCode);
    await saveCloudUser(next, { create: true, recoveryHash: newRecoveryHash, recoveryIssuedAt: Date.now(), characterId: next.character?.id || rec.characterId || '' });
    if (next.character?.id) {
      await db.collection('characters').doc(next.character.id).set({
        ownerUid: next.uid,
        userId: next.userId,
        username: next.username,
        accountName: next.name,
        updatedAt: Date.now()
      }, { merge: true });
    }
    storePendingRecovery(newRecoveryCode);
    return saveAuth(next);
  }
  function clearAuth() {
    try { localStorage.removeItem(AUTH_KEY); } catch (_) {}
  }
  function loadAccount() {
    return loadAuth() || { name: 'Guest', email: s().loginSub, userId: '----' };
  }
  function accountCharacter(account = loadAccount()) {
    return normalizeCharacter(account?.character, account) || { id: account?.userId || '3720', name: account?.name || 'Hero', class: 'dragoon', cls: 'dragoon', gender: 'male', skin: '' };
  }
  async function signOut() {
    if (realAuthEnabled()) {
      try { await cloudAuth()?.signOut?.(); } catch (_) {}
    }
    clearAuth();
    closeOverlay();
    loginMode = 'in';
    profile = null;
    baselineDone = false;
    refresh({ toast: false });
    showLoginGate();
  }
  function tickStreak() {
    const p = loadProfile();
    const today = ymd(new Date());
    if (p.lastVisit === today) return saveProfile(p);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const streak = p.lastVisit === ymd(yesterday) ? (Number(p.streak) || 0) + 1 : 1;
    return patchProfile({ lastVisit: today, streak, bestStreak: Math.max(Number(p.bestStreak) || 0, streak) });
  }
  function profileLevelFromRenown(renown) {
    return window.PointyLogic?.levelFromRenown
      ? window.PointyLogic.levelFromRenown(renown)
      : { lvl: 1, into: 0, need: 0, pct: 0 };
  }
  function rewardFor(lvl) {
    return (window.PointyLogic?.rewardFor ? window.PointyLogic.rewardFor(lvl) : { frame: 'novice', glyph: '', title: { th: 'มือใหม่', en: 'Novice' } });
  }
  function money(n) {
    return '฿' + Math.round(Number(n) || 0).toLocaleString(lang() === 'th' ? 'th-TH' : 'en-US');
  }
  function classMeta(id) {
    const cls = window.PointyLogic?.normalizeClass ? window.PointyLogic.normalizeClass(id || 'dragoon') : (id || 'dragoon');
    return { id: cls, ...(window.PointyLogic?.CLASSES?.[cls] || { glyph: '⚔️', hue: 256, th: 'ฮีโร่', en: 'Hero' }) };
  }
  function avatarBg(cls) {
    const hue = classMeta(cls).hue || 256;
    return `radial-gradient(125% 92% at 50% 16%, oklch(0.52 0.08 ${hue}), oklch(0.20 0.045 ${hue}) 78%)`;
  }
  function assetUrl(path) {
    if (TEST_MODE) return '/' + path;
    return window.PointyAssets?.url ? window.PointyAssets.url(path) : '/' + path;
  }
  function avatarFile(cls, gender, skin) {
    const c = classMeta(cls).id;
    const g = gender === 'female' ? 'female' : 'male';
    const skinMap = {
      'crimson-regent': 'crimson-regent-male',
      'archfiend-swimmer': 'archfiend-swimmer-male',
      'archfiend-swimmer-blackred': 'archfiend-swimmer-blackred-male'
    };
    const res = skin && skinMap[skin] ? skinMap[skin] : `${c}-${g}`;
    const path = `assets/rpg-portraits/${res}.png`;
    return assetUrl(path);
  }
  function avatarMarkup(slayer, sizeClass) {
    const cls = classMeta(slayer?.class || slayer?.cls || 'dragoon');
    const gender = slayer?.gender === 'female' ? 'female' : 'male';
    const src = avatarFile(cls.id, gender, slayer?.skin || '');
    return `<span class="${sizeClass}" style="--avatar-bg:${avatarBg(cls.id)}"><img src="${h(src)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="pd-q" style="display:none">${h(cls.glyph)}</span></span>`;
  }
  function heroOptions() {
    const order = window.PointyLogic?.CLASS_ORDER || ['warrior', 'wizard', 'cleric', 'monk', 'bard', 'dragoon', 'summoner', 'thief', 'ranger', 'alchemist', 'necromancer', 'engineer', 'berserker', 'archfiend', 'corsair', 'reveler', 'seraph', 'tiderunner'];
    const sorted = order.slice().sort((a, b) => String(classMeta(a).en || a).localeCompare(String(classMeta(b).en || b)));
    return sorted.flatMap(cls => ['female', 'male'].map(gender => ({ cls, gender })));
  }
  function heroPickerArt(cls, gender) {
    const meta = classMeta(cls);
    const src = avatarFile(meta.id, gender, '');
    return `<div class="pc-art" style="--avatar-bg:${avatarBg(meta.id)}">
      <img src="${h(src)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
      <span class="pd-q pc-fallback" style="display:none">${h(meta.glyph || '⚔️')}</span>
    </div>`;
  }

  function currentTripState() {
    if (typeof window.PointyTripSnapshot === 'function') {
      try { return window.PointyTripSnapshot(); } catch (_) {}
    }
    return null;
  }
  function updateTripSnapshot(id, data) {
    if (!id || !data) return;
    const cache = readScopedJson(TRIP_CACHE_KEY, {});
    cache[id] = { id, data, updatedAt: Date.now() };
    const ids = Object.keys(cache).sort((a, b) => (cache[b].updatedAt || 0) - (cache[a].updatedAt || 0));
    ids.slice(12).forEach(key => delete cache[key]);
    writeScopedJson(TRIP_CACHE_KEY, cache);
  }
  function tripEntries() {
    const out = [];
    const current = currentTripState();
    if (current?.id && current?.data) out.push(current);
    const cache = readScopedJson(TRIP_CACHE_KEY, {});
    Object.keys(cache || {}).forEach(id => {
      if (!out.some(x => x.id === id)) out.push({ id, data: cache[id].data || cache[id] });
    });
    return out;
  }
  function timestampValue(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Date.parse(value) || 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    return 0;
  }
  function boardName(data) {
    const name = data?.tripName || '';
    if (typeof name === 'object') return name[lang()] || name.th || name.en || s().profile;
    return name || (lang() === 'en' ? 'Untitled board' : 'บอร์ดไม่มีชื่อ');
  }
  function profileBoardRows(account = loadAccount()) {
    const character = accountCharacter(account);
    const ownerHashValue = currentOwnerHash();
    return tripEntries().map(entry => {
      const data = entry.data || {};
      const admin = data.admin || {};
      const participantName = Object.keys(data.characterIds || {}).find(name => String(data.characterIds?.[name]) === String(character.id || account.userId));
      const isAdmin = String(admin.characterId || '') === String(character.id || account.userId)
        || (admin.adminName && (admin.adminName === account.name || admin.adminName === character.name))
        || (ownerHashValue && admin.ownerHash === ownerHashValue);
      if (!isAdmin) return null;
      const id = String(entry.id || data.id || '');
      const participants = Array.isArray(data.participants) ? data.participants.length : 0;
      const expenses = Array.isArray(data.expenses) ? data.expenses.length : 0;
      return {
        id,
        name: boardName(data),
        participants,
        expenses,
        participantName,
        adminId: admin.adminId || '',
        archived: !!data.archived,
        updatedAt: timestampValue(entry.updatedAt || data.updatedAt || admin.createdAt),
        href: id ? `/trip/?id=${encodeURIComponent(id)}${TEST_MODE ? '&test=1' : ''}` : '/trip/'
      };
    }).filter(Boolean).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0) || a.id.localeCompare(b.id));
  }
  function campaignsFromTrip(data) {
    const state = data || {};
    const campaigns = Array.isArray(state.campaigns) && state.campaigns.length ? state.campaigns : [state];
    return campaigns.map(c => ({
      tripName: c.tripName || state.tripName || '',
      participants: Array.isArray(c.participants) ? c.participants : (state.participants || []),
      expenses: Array.isArray(c.expenses) ? c.expenses : [],
      budgets: c.budgets || state.budgets || {},
      heroClasses: c.heroClasses || state.heroClasses || {},
      characterIds: c.characterIds || state.characterIds || {},
      settleXp: c.settleXp || state.settleXp || {},
      completedAt: c.completedAt || null
    }));
  }
  function computePartyForCampaign(c) {
    if (!window.PointyLogic?.computeParty) return [];
    return window.PointyLogic.computeParty(c, { classOf: name => c.heroClasses?.[name] || 'warrior' });
  }
  function loadDebt() {
    const raw = readScopedJson('pointy_debt_v5', null);
    const fallback = hasScopedAccount() ? { dragons: [], settings: {}, profile: {}, history: [], stats: {} } : window.PointyLogic.SEED_DEBT;
    return window.PointyLogic?.normalizeDebtState ? window.PointyLogic.normalizeDebtState(raw || fallback) : (raw || fallback || {});
  }
  function loadCompare() {
    const raw = readScopedJson('pointy_compare_v2', readScopedJson('pointy_compare_v1', []));
    return Array.isArray(raw) ? raw : [];
  }
  function loadTreasury() {
    const raw = readScopedJson('pointy_treasury_v1', null);
    if (raw && typeof raw === 'object') return raw;
    return {};
  }
  function monthKey(d) {
    const x = new Date(d);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0');
  }
  function daysInMonth(d) {
    const x = new Date(d);
    return new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  }
  function billPaidThisMonth(treasury, billId, mk) {
    return (treasury.expenses || []).some(e => e.billId === billId && monthKey(e.date) === mk);
  }
  function billDueStatus(bill, treasury, today = new Date()) {
    const mk = treasury.month || monthKey(today);
    if (monthKey(today) !== mk) return null;
    const paid = billPaidThisMonth(treasury, bill.id, mk);
    const dueThis = Math.min(Number(bill.dueDay) || 1, daysInMonth(today));
    if (paid) return { paid: true, overdue: false, days: dueThis - today.getDate() };
    if (today.getDate() > dueThis) return { paid: false, overdue: true, days: today.getDate() - dueThis };
    return { paid: false, overdue: false, days: dueThis - today.getDate() };
  }
  function computeProfile() {
    const account = loadAccount();
    const character = accountCharacter(account);
    const scoped = hasScopedAccount();
    const characterId = String(character?.id || account?.userId || '');
    let fronted = 0, settleR = 0, quests = 0, completed = 0, maxPartySize = 0, totalLogged = 0;
    tripEntries().forEach(entry => {
      campaignsFromTrip(entry.data).forEach(c => {
        const participantName = Object.keys(c.characterIds || {}).find(name => String(c.characterIds?.[name]) === characterId)
          || (c.participants || []).find(name => name === character?.name || name === account?.name);
        if (scoped && !participantName) return;
        const party = computePartyForCampaign(c);
        const heroes = scoped ? party.filter(hero => hero.name === participantName) : party;
        heroes.forEach(hero => {
          fronted += Number(hero.gen) || 0;
          settleR += Number(c.settleXp?.[hero.name]) || 0;
        });
        const visibleExpenses = scoped
          ? (c.expenses || []).filter(e => (e.sharedBy || []).includes(participantName) || e.paidBy === participantName || e.payers?.[participantName])
          : (c.expenses || []);
        quests += visibleExpenses.length;
        totalLogged += visibleExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        if (c.completedAt) completed += 1;
        maxPartySize = Math.max(maxPartySize, participantName ? (c.participants || []).length : scoped ? 0 : (c.participants || []).length);
      });
    });

    const debt = loadDebt();
    const dragons = debt.dragons || [];
    let reclaimed = 0, biggestHit = 0, strikes = 0, slain = 0;
    dragons.forEach(d => {
      (d.log || []).forEach(row => {
        const amount = Number(row.amount) || 0;
        reclaimed += amount;
        strikes += 1;
        biggestHit = Math.max(biggestHit, amount);
      });
      if (d.slain) slain += 1;
    });
    const liveDragons = dragons.filter(d => !d.slain && Number(d.balance) > .5).length;
    const interestFed = Number(debt.stats?.interest) || 0;

    let showdowns = 0, merchants = 0, bestRescue = 0;
    loadCompare().forEach(cmp => {
      merchants += (cmp.offers || []).length;
      if ((cmp.offers || []).length >= 2) {
        showdowns += 1;
        const ranked = window.PointyLogic?.rankOffers ? window.PointyLogic.rankOffers(cmp.offers, cmp) : [];
        const best = ranked.find(o => o.isBest);
        if (best) bestRescue = Math.max(bestRescue, best.savePct || 0);
      }
    });

    const treasury = loadTreasury();
    const trStats = treasury.stats || {};
    const monthsWon = Number(trStats.monthsWon) || 0;
    const trLogged = Number(trStats.logged) || 0;
    const trOnTime = Number(trStats.onTime) || 0;
    const treasuryXp = Math.round(monthsWon * 800 + trOnTime * 60 + trLogged * 8);

    const renown = Math.round(fronted + settleR + reclaimed / 10 + slain * 500 + quests * 60 + completed * 400 + showdowns * 120 + treasuryXp);
    return {
      renown,
      level: profileLevelFromRenown(renown),
      fronted: Math.round(fronted),
      settleR: Math.round(settleR),
      quests,
      completed,
      maxPartySize,
      totalLogged: Math.round(totalLogged),
      reclaimed: Math.round(reclaimed),
      biggestHit: Math.round(biggestHit),
      strikes,
      slain,
      liveDragons,
      interestFed: Math.round(interestFed),
      showdowns,
      merchants,
      bestRescue,
      dragonsTotal: dragons.length,
      monthsWon,
      trLogged,
      trOnTime,
      treasuryXp,
      streak: profile?.streak || 0
    };
  }
  function evalAchievements(ctx) {
    return ACHIEVEMENTS.map(item => ({ ...item, unlocked: !!item.test(ctx), progress: item.prog ? item.prog(ctx) : null }));
  }

  function dayStart(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function dueStatus(d, today = new Date()) {
    if (d.payMode === 'adhoc' || !d.dueDay || d.slain) return null;
    const y = today.getFullYear();
    const m = today.getMonth();
    const paidThisMonth = (d.log || []).some(row => {
      const t = new Date(row.ts || row.date || 0);
      return t.getFullYear() === y && t.getMonth() === m;
    });
    const dimThis = new Date(y, m + 1, 0).getDate();
    const dueThis = Math.min(Number(d.dueDay) || 0, dimThis);
    if (!paidThisMonth && today.getDate() > dueThis) return { overdue: true };
    const dueDate = paidThisMonth
      ? new Date(y, m + 1, Math.min(Number(d.dueDay) || 1, new Date(y, m + 2, 0).getDate()))
      : new Date(y, m, dueThis);
    return { overdue: false, days: Math.round((dayStart(dueDate) - dayStart(today)) / 86400000) };
  }
  function activeParty() {
    const current = currentTripState();
    const source = current?.data || tripEntries()[0]?.data;
    if (!source) return [];
    const active = (source.campaigns || []).find(c => c.id === source.activeCampaignId) || (source.campaigns || [source])[0];
    if (!active) return [];
    if (hasScopedAccount()) {
      const account = loadAccount();
      const character = accountCharacter(account);
      const characterId = String(character?.id || account?.userId || '');
      const ids = active.characterIds || source.characterIds || {};
      const participantName = Object.keys(ids).find(name => String(ids?.[name]) === characterId)
        || (active.participants || source.participants || []).find(name => name === character?.name || name === account?.name);
      if (!participantName) return [];
    }
    return computePartyForCampaign({
      participants: active.participants || source.participants || [],
      expenses: active.expenses || [],
      budgets: active.budgets || source.budgets || {},
      heroClasses: active.heroClasses || source.heroClasses || {},
      settleXp: active.settleXp || source.settleXp || {}
    });
  }
  function computeReminders() {
    const copy = [];
    const debt = loadDebt();
    (debt.dragons || []).forEach(d => {
      const due = dueStatus(d);
      if (!due) return;
      const name = typeof d.name === 'object' ? (d.name[lang()] || d.name.en || d.name.th) : d.name;
      if (due.overdue) copy.push({ id: 'd' + d.id, kind: 'overdue', icon: '🐉', title: name, sub: s().remOverdue, href: '/debt/' });
      else if (due.days <= 5) copy.push({ id: 'd' + d.id, kind: 'due', icon: '🐉', title: name, sub: due.days === 0 ? s().remToday : s().remDueIn.replace('{n}', due.days), href: '/debt/', days: due.days });
    });
    const treasury = loadTreasury();
    (treasury.bills || []).forEach(bill => {
      const due = billDueStatus(bill, treasury);
      if (!due || due.paid) return;
      const name = typeof bill.name === 'object' ? (bill.name[lang()] || bill.name.en || bill.name.th) : bill.name;
      if (due.overdue) copy.push({ id: 'tb' + bill.id, kind: 'overdue', icon: bill.glyph || '🏦', title: name, sub: s().remOverdue, href: '/treasury/' });
      else if (due.days <= 5) copy.push({ id: 'tb' + bill.id, kind: 'due', icon: bill.glyph || '🏦', title: name, sub: due.days === 0 ? s().remToday : s().remDueIn.replace('{n}', due.days), href: '/treasury/', days: due.days });
    });
    const party = activeParty();
    const txns = window.PointyLogic?.settleUp ? window.PointyLogic.settleUp(party) : [];
    if (txns.length) copy.push({ id: 'settle', kind: 'settle', icon: '⚖️', title: s().remSettleUp, sub: txns.length + ' ' + s().tributes, href: '/trip/' });
    return copy.sort((a, b) => {
      const rank = r => r.kind === 'overdue' ? 0 : r.kind === 'due' ? 1 + (r.days || 0) / 100 : 50;
      return rank(a) - rank(b);
    });
  }

  function collectBackup() {
    const out = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (/pointy|coin_quest|lang/i.test(key)) out[key] = localStorage.getItem(key);
    }
    return out;
  }
  function exportBackup() {
    const blob = new Blob([JSON.stringify({ __coin_quest_backup: 1, at: Date.now(), keys: collectBackup() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'coin-quest-backup-' + ymd(new Date()) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function importBackup(file, cb) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const keys = data?.keys;
        if (!keys || typeof keys !== 'object' || !Object.keys(keys).some(k => /pointy|coin_quest/i.test(k))) throw new Error('bad backup');
        if (!confirm(s().restoreConfirm)) return;
        Object.keys(keys).forEach(key => localStorage.setItem(key, keys[key]));
        cb(s().backupRestored);
        setTimeout(() => location.reload(), 700);
      } catch (_) {
        cb(s().backupBad);
      }
    };
    reader.readAsText(file);
  }

  function ensureTopbar() {
    const inner = document.querySelector('.tb-inner');
    const langToggle = inner?.querySelector('.lang-toggle');
    if (!inner || !langToggle) return;
    let right = inner.querySelector('.tb-right');
    if (!right) {
      right = document.createElement('div');
      right.className = 'tb-right';
      inner.appendChild(right);
      right.appendChild(langToggle);
    }
    if (right.querySelector('[data-profile-hub]')) return;
    right.insertAdjacentHTML('afterbegin', `
      <button class="theme-toggle" type="button" data-profile-hub="theme" aria-label="Theme" title="Theme">🌙</button>
      <button class="rem-bell" type="button" data-profile-hub="reminders" aria-label="Reminders" title="Reminders"><span class="rb-ico">🔔</span></button>
      <button class="profile-badge" type="button" data-profile-hub="profile" aria-label="${h(s().profile)}" title="${h(s().profile)}"></button>
    `);
    right.querySelector('[data-profile-hub="theme"]').addEventListener('click', toggleTheme);
    right.querySelector('[data-profile-hub="reminders"]').addEventListener('click', showReminders);
    right.querySelector('[data-profile-hub="profile"]').addEventListener('click', showProfile);
  }
  function currentTheme() {
    try {
      const cached = localStorage.getItem(THEME_KEY);
      if (cached === 'dungeon' || cached === 'tavern') return cached;
    } catch (_) {}
    const uiTheme = readJson(UI_KEY, {}).theme;
    if (uiTheme === 'dungeon' || uiTheme === 'tavern') return uiTheme;
    return document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme') || 'tavern';
  }
  function applyTheme(theme) {
    const next = theme === 'dungeon' ? 'dungeon' : 'tavern';
    document.documentElement.setAttribute('data-theme', next);
    document.body.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    writeJson(UI_KEY, { ...readJson(UI_KEY, {}), theme: next });
    const btn = document.querySelector('[data-profile-hub="theme"]');
    if (btn) {
      btn.textContent = next === 'dungeon' ? '☀️' : '🌙';
      btn.title = next === 'dungeon' ? s().themeLight : s().themeDark;
    }
  }
  function setTheme(theme) {
    if (typeof window.setTheme === 'function') window.setTheme(theme);
    applyTheme(theme);
    refresh({ toast: false });
  }
  function toggleTheme() {
    setTheme(currentTheme() === 'dungeon' ? 'tavern' : 'dungeon');
  }
  function setupTheme() {
    const pageTheme = currentTheme();
    applyTheme(pageTheme);
  }
  function setPageLang(next) {
    const clean = next === 'en' ? 'en' : 'th';
    if (typeof window.setLang === 'function') window.setLang(clean);
    else {
      window.LANG = clean;
      try { localStorage.setItem('lang', clean); } catch (_) {}
      document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('lang-active', btn.dataset.lang === clean));
    }
  }
  function loginLanguage() {
    return window.LANG === 'en' ? 'en' : 'th';
  }
  function mockUserId(email) {
    const value = String(email || '');
    const hash = [...value].reduce((sum, c) => ((sum * 31 + c.charCodeAt(0)) | 0), 7);
    return String(Math.abs(hash) % 9000 + 1000);
  }
  function removeLoginGate() {
    if (loginGate) loginGate.remove();
    loginGate = null;
    document.body.classList.remove('login-locked');
  }
  function showRecoveryCode(code) {
    if (!code) return;
    mountOverlay(`<div class="rem-overlay"><div class="rem-panel recovery-panel">
      <div class="rem-head"><span class="rem-title">🔐 ${h(s().recoveryTitle)}</span><button class="picker-close sm" type="button" data-close>✕</button></div>
      <div class="recovery-body">
        <p>${h(s().recoverySub)}</p>
        <div class="recovery-code mono">${h(code)}</div>
        <div class="pdb-actions"><button class="btn-ghost sm" type="button" data-copy-recovery>📋 ${h(s().copyRecovery)}</button><button class="btn-primary sm" type="button" data-close>${h(s().recoverySaved)}</button></div>
      </div>
    </div></div>`);
    overlay.addEventListener('click', e => { if (e.target === overlay || e.target.closest('[data-close]')) closeOverlay(); });
    overlay.querySelector('[data-copy-recovery]')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(code); showMiniToast(s().copyRecovery); } catch (_) {}
    });
  }
  function showRecoveryReset() {
    if (!realAuthEnabled()) return;
    const copy = STR[loginLanguage()];
    if (!loginGate) {
      loginGate = document.createElement('div');
      loginGate.className = 'login-gate';
      document.body.appendChild(loginGate);
    }
    document.body.classList.add('login-locked');
    loginGate.innerHTML = `<div class="login-wrap">
      <form class="login-card" data-recovery-form>
        <div class="login-crest" aria-hidden="true"><span>🔐</span></div>
        <h1 class="login-title">${h(copy.resetTitle)}</h1>
        <p class="login-sub">${h(copy.resetSub)}</p>
        <label class="login-field"><span>${h(copy.loginEmail)}</span><input type="text" autocomplete="username" data-recovery-username placeholder="${h(copy.loginEmailPlaceholder)}"></label>
        <label class="login-field"><span>${h(copy.recoveryCode)}</span><input type="text" autocomplete="one-time-code" data-recovery-code placeholder="XXXX-XXXX-XXXX"></label>
        <label class="login-field"><span>${h(copy.newPassword)}</span><input type="password" autocomplete="new-password" data-recovery-password placeholder="${h(copy.loginPasswordPlaceholder)}"></label>
        <div class="login-err" data-recovery-error hidden></div>
        <button type="submit" class="login-btn">🔑 ${h(copy.resetConfirm)}</button>
        <button type="button" class="btn-ghost sm" data-back-login style="width:100%;margin-top:10px">${h(copy.loginSignIn)}</button>
      </form>
    </div>`;
    const form = loginGate.querySelector('[data-recovery-form]');
    const error = loginGate.querySelector('[data-recovery-error]');
    const setError = text => {
      error.hidden = !text;
      error.textContent = text ? `⚠️ ${text}` : '';
    };
    loginGate.querySelector('[data-back-login]').addEventListener('click', () => { loginMode = 'in'; showLoginGate(); });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const submit = form.querySelector('.login-btn');
      try {
        submit.disabled = true;
        const account = await recoverWithCode(
          form.querySelector('[data-recovery-username]')?.value,
          form.querySelector('[data-recovery-code]')?.value,
          form.querySelector('[data-recovery-password]')?.value
        );
        removeLoginGate();
        profile = tickStreak();
        refresh({ toast: false });
        showRecoveryCode(consumePendingRecovery());
        if (!account.character) showCharacterCreation(account);
      } catch (err) {
        submit.disabled = false;
        setError(String(err?.message || '').includes('bad-recovery-code') ? copy.resetBadCode : authErrorMessage(err));
      }
    });
  }
  function showLoginGate() {
    const existingAuth = loadAuth();
    if (existingAuth?.character) {
      removeLoginGate();
      return;
    }
    if (existingAuth && !existingAuth.character) {
      showCharacterCreation(existingAuth);
      return;
    }
    const langKey = loginLanguage();
    const copy = STR[langKey];
    const theme = currentTheme();
    const isSignup = loginMode === 'up';
    const real = realAuthEnabled();
    if (!loginGate) {
      loginGate = document.createElement('div');
      loginGate.className = 'login-gate';
      document.body.appendChild(loginGate);
    }
    document.body.classList.add('login-locked');
    loginGate.innerHTML = `<div class="login-wrap">
      <div class="login-langs">
        <button class="login-theme" type="button" data-login-theme title="${theme === 'dungeon' ? 'Light' : 'Dark'}">${theme === 'dungeon' ? '☀️' : '🌙'}</button>
        <button type="button" class="${langKey === 'th' ? 'on' : ''}" data-login-lang="th">TH</button>
        <button type="button" class="${langKey === 'en' ? 'on' : ''}" data-login-lang="en">EN</button>
      </div>
      <form class="login-card" data-login-form>
        <div class="login-crest" aria-hidden="true"><span>🧰</span></div>
        <div class="login-tabs" role="tablist">
          <button type="button" class="${!isSignup ? 'on' : ''}" data-login-tab="in">${h(copy.loginSignIn)}</button>
          <button type="button" class="${isSignup ? 'on' : ''}" data-login-tab="up">${h(copy.loginSignUp)}</button>
        </div>
        <h1 class="login-title">${h(isSignup ? copy.signupWelcome : copy.loginWelcome)}</h1>
        <p class="login-sub">${h(isSignup ? copy.signupSub : copy.loginSub)}</p>
        ${isSignup ? `<label class="login-field">
          <span>${h(copy.signupName)}</span>
          <input type="text" autocomplete="name" data-login-name placeholder="${h(copy.signupNamePlaceholder)}">
        </label>` : ''}
        <label class="login-field">
          <span>${h(copy.loginEmail)}</span>
          <input type="text" autocomplete="username" data-login-email placeholder="${h(copy.loginEmailPlaceholder)}">
        </label>
        <label class="login-field">
          <span>${h(copy.loginPassword)}</span>
          <input type="password" autocomplete="${isSignup ? 'new-password' : 'current-password'}" data-login-password placeholder="${h(copy.loginPasswordPlaceholder)}">
        </label>
        ${isSignup ? `<label class="login-field">
          <span>${h(copy.signupConfirm)}</span>
          <input type="password" autocomplete="new-password" data-login-password2 placeholder="${h(copy.loginPasswordPlaceholder)}">
        </label>` : ''}
        <div class="login-err" data-login-error hidden></div>
        <button type="submit" class="login-btn">${isSignup ? '✨ ' + h(copy.signupCreate) : '⚔️ ' + h(copy.loginEnter)}</button>
        ${!isSignup && !real ? `<div class="login-demo">
          <div class="login-demo-h">${h(copy.loginDemo)}</div>
          <div class="login-demo-list">
            ${DUMMY_ACCOUNTS.map(account => `<button type="button" class="login-demo-acct" data-demo-email="${h(account.username || accountLogin(account))}" data-demo-password="${h(account.password)}">
              <b>${h(account.name)}</b><span>@${h(account.username || accountLogin(account))}</span><i>${h(classLabel(account.character?.class || account.character?.cls))} · ID ${h(account.userId)}</i>
            </button>`).join('')}
          </div>
        </div>` : ''}
        ${!isSignup && real ? `<button type="button" class="btn-ghost sm" data-forgot-password style="width:100%;margin-top:10px">${h(copy.forgotPassword)}</button>` : ''}
        <div class="login-note">🔒 ${h(real ? copy.loginNoteReal : copy.loginNote)}</div>
      </form>
    </div>`;
    const name = loginGate.querySelector('[data-login-name]');
    const email = loginGate.querySelector('[data-login-email]');
    const password = loginGate.querySelector('[data-login-password]');
    const password2 = loginGate.querySelector('[data-login-password2]');
    const error = loginGate.querySelector('[data-login-error]');
    const setError = text => {
      error.hidden = !text;
      error.textContent = text ? `⚠️ ${text}` : '';
    };
    loginGate.querySelector('[data-login-form]').addEventListener('submit', async event => {
      event.preventDefault();
      const loginName = normalizeUsername(email.value || '');
      const em = real ? usernameEmail(loginName) : String(email.value || '').trim();
      const pw = String(password.value || '');
      const submit = loginGate.querySelector('.login-btn');
      const setBusy = on => {
        if (submit) submit.disabled = !!on;
        if (email) email.disabled = !!on;
        if (password) password.disabled = !!on;
        if (name) name.disabled = !!on;
        if (password2) password2.disabled = !!on;
      };
      if (isSignup) {
        const display = String(name?.value || '').trim();
        const pw2 = String(password2?.value || '');
        if (!display) { setError(copy.signupNameMissing); return; }
        if (!loginName || !pw) { setError(copy.loginEmpty); return; }
        if (pw.length < 6) { setError(copy.signupPasswordShort); return; }
        if (pw !== pw2) { setError(copy.signupPasswordMismatch); return; }
        if (real) {
          try {
            setBusy(true);
            const existing = await usernameRecord(loginName);
            if (existing) throw Object.assign(new Error('username exists'), { code: 'auth/email-already-in-use' });
            const recoveryCode = recoveryCodeValue();
            const recovery = await recoveryHash(loginName, recoveryCode);
            const cred = await cloudAuth().createUserWithEmailAndPassword(em, pw);
            await cred.user.updateProfile({ displayName: loginName });
            const account = normalizeAccount({ uid: cred.user.uid, provider: 'firebase', username: loginName, email: em, userId: await allocateCloudUserId(cred.user.uid), name: display, character: null });
            await saveCloudUser(account, { create: true, recoveryHash: recovery, recoveryIssuedAt: Date.now() });
            storePendingRecovery(recoveryCode);
            saveAuth(account);
            showCharacterCreation(account);
          } catch (err) {
            setError(authErrorMessage(err));
            setBusy(false);
          }
          return;
        }
        if (allAccounts().some(account => accountLogin(account) === loginName || String(account.email || '').toLowerCase() === em.toLowerCase())) { setError(copy.signupTaken); return; }
        const account = { username: loginName, email: em || usernameEmail(loginName), password: pw, userId: genId4(), name: display, character: null };
        saveAccounts([...loadAccounts(), account]);
        saveAuth(account);
        showCharacterCreation(account);
        return;
      }
      if (!loginName || !pw) {
        setError(copy.loginEmpty);
        return;
      }
      if (real) {
        try {
          setBusy(true);
          const authEmail = await resolveAuthEmail(loginName);
          const cred = await cloudAuth().signInWithEmailAndPassword(authEmail, pw);
          const cloudAccount = await loadCloudAccount(cred.user);
          if (isBlockedAccountStatus(cloudAccount)) {
            await cloudAuth().signOut().catch(() => {});
            clearAuth();
            setError(copy.authBlocked);
            setBusy(false);
            return;
          }
          const next = saveAuth(cloudAccount);
          if (!next.character) {
            showCharacterCreation(next);
            return;
          }
        } catch (err) {
          setError(authErrorMessage(err));
          setBusy(false);
          return;
        }
        removeLoginGate();
        profile = tickStreak();
        refresh({ toast: false });
        if (!TEST_MODE && !AUTOMATED && !profile.tourSeen) setTimeout(showTour, 300);
        return;
      }
      const account = allAccounts().find(item => accountLogin(item) === loginName || String(item.email || '').toLowerCase() === em.toLowerCase());
      if (account) {
        if (account.password !== pw) {
          setError(copy.loginError);
          return;
        }
        const next = saveAuth(account);
        if (!next.character) {
          showCharacterCreation(next);
          return;
        }
      } else {
        const next = saveAuth({ username: loginName, email: usernameEmail(loginName), userId: mockUserId(loginName), name: loginName || 'Hero', character: null });
        showCharacterCreation(next);
        return;
      }
      removeLoginGate();
      profile = tickStreak();
      refresh({ toast: false });
      if (!TEST_MODE && !AUTOMATED && !profile.tourSeen) setTimeout(showTour, 300);
    });
    loginGate.querySelectorAll('[data-demo-email]').forEach(btn => btn.addEventListener('click', () => {
      email.value = btn.dataset.demoEmail || '';
      password.value = btn.dataset.demoPassword || '';
      setError('');
      email.focus();
    }));
    loginGate.querySelector('[data-forgot-password]')?.addEventListener('click', showRecoveryReset);
    loginGate.querySelectorAll('[data-login-tab]').forEach(btn => btn.addEventListener('click', () => {
      loginMode = btn.dataset.loginTab === 'up' ? 'up' : 'in';
      showLoginGate();
    }));
    loginGate.querySelector('[data-login-theme]').addEventListener('click', () => {
      setTheme(currentTheme() === 'dungeon' ? 'tavern' : 'dungeon');
      showLoginGate();
    });
    loginGate.querySelectorAll('[data-login-lang]').forEach(btn => btn.addEventListener('click', () => {
      setPageLang(btn.dataset.loginLang);
      showLoginGate();
    }));
  }

  function classLabel(id) {
    const meta = classMeta(id || 'warrior');
    return meta[loginLanguage()] || meta.th || meta.en || id;
  }

  function showCharacterCreation(account) {
    const base = normalizeAccount(account) || loadAccount();
    let langKey = loginLanguage();
    let copy = STR[langKey];
    let pickedClass = '';
    let pickedGender = '';
    let pickerOpen = false;
    let pickerGender = 'all';
    if (!loginGate) {
      loginGate = document.createElement('div');
      loginGate.className = 'login-gate';
      document.body.appendChild(loginGate);
    }
    document.body.classList.add('login-locked');
    const render = () => {
      langKey = loginLanguage();
      copy = STR[langKey];
      const nameInputValue = loginGate.querySelector('[data-char-name]')?.value;
      if (nameInputValue !== undefined) base.name = nameInputValue;
      loginGate.innerHTML = `<div class="login-wrap">
        <div class="login-langs">
          <button type="button" class="${langKey === 'th' ? 'on' : ''}" data-login-lang="th">TH</button>
          <button type="button" class="${langKey === 'en' ? 'on' : ''}" data-login-lang="en">EN</button>
        </div>
          <form class="login-card cc-card" data-char-form>
          <div class="login-crest" aria-hidden="true"><img src="${h(assetUrl('assets/icons/loot-chest.svg'))}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span style="display:none">🎁</span></div>
          <h1 class="login-title">${h(copy.charTitle)}</h1>
          <p class="login-sub">${h(copy.charSub)}</p>
          <div class="cc-uid">${h(copy.yourUserId)} · <b>${h(base.userId)}</b></div>

          <div class="cc-hero">
            <button type="button" class="cc-portrait ${pickedClass ? 'has' : ''}" data-char-open-picker aria-label="${h(copy.tapToChoose)}">
              ${pickedClass
                ? `<span class="cc-picked" style="--avatar-bg:${avatarBg(pickedClass)}"><img src="${h(avatarFile(pickedClass, pickedGender, ''))}" alt=""><span class="pd-q" style="display:none">${h(classMeta(pickedClass).glyph)}</span></span>`
                : `<span class="cc-q"><span class="cc-q-mark">?</span><span class="cc-q-lab">${h(copy.tapToChoose)}</span></span>`}
            </button>
            ${pickedClass ? `<div class="cc-cls">${h(classMeta(pickedClass).glyph || '')} ${h(classLabel(pickedClass))}</div>` : ''}
          </div>

          <label class="login-field">
            <span>${h(copy.charName)}</span>
            <input type="text" autocomplete="nickname" data-char-name value="${h(base.name || '')}" placeholder="${h(copy.charNamePlaceholder)}">
          </label>
          <div class="login-err" data-char-error hidden></div>
          <button type="submit" class="login-btn" ${pickedClass ? '' : 'disabled'}>⚔️ ${h(copy.charCreate)}</button>
        </form>
        ${pickerOpen ? renderPicker() : ''}
      </div>`;
      function renderPicker() {
        const options = heroOptions().filter(opt => pickerGender === 'all' || opt.gender === pickerGender);
        return `<div class="picker-overlay" data-picker-close>
          <div class="picker" role="dialog" aria-modal="true" aria-label="${h(copy.chooseHero)}" data-picker-dialog>
            <div class="picker-head">
              <div>
                <div class="picker-title">⚔️ ${h(copy.chooseHero)}</div>
                <div class="picker-sub">${h(copy.chooseHeroSub)}</div>
              </div>
              <button type="button" class="picker-close" data-picker-close aria-label="Close">×</button>
            </div>
            <div class="picker-filter" role="group" aria-label="Hero filter">
              <button type="button" class="${pickerGender === 'all' ? 'on' : ''}" data-picker-gender="all">${h(copy.allHeroes)}</button>
              <button type="button" class="${pickerGender === 'female' ? 'on' : ''}" data-picker-gender="female">♀ ${h(copy.female)}</button>
              <button type="button" class="${pickerGender === 'male' ? 'on' : ''}" data-picker-gender="male">♂ ${h(copy.male)}</button>
            </div>
            <div class="picker-grid">
              ${options.map(opt => {
                const meta = classMeta(opt.cls);
                const on = pickedClass === opt.cls && pickedGender === opt.gender;
                return `<button type="button" class="picker-cell ${on ? 'on' : ''}" data-char-class="${h(opt.cls)}" data-char-gender="${h(opt.gender)}">
                  ${heroPickerArt(opt.cls, opt.gender)}
                  <div class="pc-name"><span class="pc-gender">${opt.gender === 'female' ? '♀' : '♂'}</span>${h(meta[langKey] || meta.th || meta.en || opt.cls)}</div>
                  ${on ? '<div class="pc-check">✓</div>' : ''}
                </button>`;
              }).join('')}
            </div>
          </div>
        </div>`;
      }
      loginGate.querySelector('[data-char-form]').addEventListener('submit', async event => {
        event.preventDefault();
        if (!pickedClass || !pickedGender) {
          pickerOpen = true;
          render();
          return;
        }
        const error = loginGate.querySelector('[data-char-error]');
        const submit = loginGate.querySelector('.login-btn');
        const setError = text => {
          if (!error) return;
          error.hidden = !text;
          error.textContent = text ? `⚠️ ${text}` : '';
        };
        const charName = String(loginGate.querySelector('[data-char-name]')?.value || '').trim() || base.name || 'Hero';
        const character = persistCharacter({ id: base.userId, name: charName, class: pickedClass, cls: pickedClass, gender: pickedGender, skin: '' }, base);
        const next = saveAuth({ ...base, character });
        if (realAuthEnabled() && next.uid) {
          try {
            if (submit) submit.disabled = true;
            await saveCloudCharacter(next, character);
          } catch (err) {
            if (submit) submit.disabled = false;
            setError(authErrorMessage(err));
            return;
          }
        }
        const accounts = loadAccounts();
        const idx = accounts.findIndex(item => item.email.toLowerCase() === String(base.email || '').toLowerCase());
        if (idx >= 0) {
          accounts[idx] = { ...accounts[idx], name: next.name, userId: next.userId, character };
          saveAccounts(accounts);
        }
        removeLoginGate();
        profile = tickStreak();
        refresh({ toast: false });
        showRecoveryCode(consumePendingRecovery());
        if (!TEST_MODE && !AUTOMATED && !profile.tourSeen) setTimeout(showTour, 300);
      });
      loginGate.querySelector('[data-char-open-picker]')?.addEventListener('click', () => {
        pickerOpen = true;
        render();
      });
      loginGate.querySelectorAll('[data-char-class][data-char-gender]').forEach(btn => btn.addEventListener('click', () => {
        pickedClass = btn.dataset.charClass || pickedClass;
        pickedGender = btn.dataset.charGender === 'female' ? 'female' : 'male';
        pickerOpen = false;
        render();
      }));
      loginGate.querySelectorAll('[data-picker-gender]').forEach(btn => btn.addEventListener('click', () => {
        pickerGender = ['all', 'female', 'male'].includes(btn.dataset.pickerGender) ? btn.dataset.pickerGender : 'all';
        render();
      }));
      loginGate.querySelectorAll('[data-picker-close]').forEach(el => el.addEventListener('click', event => {
        if (event.target.closest('[data-picker-dialog]') && !event.target.matches('.picker-close')) return;
        pickerOpen = false;
        render();
      }));
      loginGate.querySelectorAll('[data-login-lang]').forEach(btn => btn.addEventListener('click', () => {
        setPageLang(btn.dataset.loginLang);
        render();
      }));
    };
    render();
  }

  function renderTopbar() {
    ensureTopbar();
    const btn = document.querySelector('[data-profile-hub="profile"]');
    const rem = document.querySelector('[data-profile-hub="reminders"]');
    const theme = document.querySelector('[data-profile-hub="theme"]');
    if (theme) {
      const ct = currentTheme();
      theme.textContent = ct === 'dungeon' ? '☀️' : '🌙';
      theme.title = ct === 'dungeon' ? s().themeLight : s().themeDark;
    }
    if (btn && context) {
      const slayer = accountCharacter(loadAccount()) || loadDebt().slayer || {};
      btn.setAttribute('aria-label', s().profile);
      btn.title = s().profile;
      btn.innerHTML = `${avatarMarkup(slayer, 'pb-ava')}<span class="pb-meta"><span class="pb-lvl"><i>${h(s().lvl)}</i>${context.level.lvl}</span>${profile.streak > 0 ? `<span class="pb-streak">🔥 ${profile.streak}</span>` : ''}</span>`;
    }
    if (rem) {
      rem.innerHTML = `<span class="rb-ico">🔔</span>${reminders.length ? `<span class="rb-badge">${reminders.length > 9 ? '9+' : reminders.length}</span>` : ''}`;
      rem.title = s().reminders;
    }
  }
  function closeOverlay() {
    if (overlay) overlay.remove();
    overlay = null;
  }
  function mountOverlay(html) {
    closeOverlay();
    overlay = document.createElement('div');
    overlay.innerHTML = html;
    document.body.appendChild(overlay.firstElementChild);
    overlay = document.body.lastElementChild;
  }
  function showMiniToast(text) {
    const existing = document.querySelector('.profile-mini-toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'profile-mini-toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
  function showReminders() {
    const items = reminders.length ? reminders.map(r => `
      <button class="rem-item k-${h(r.kind)}" type="button" data-href="${h(r.href)}">
        <span class="ri-ic">${h(r.icon)}</span>
        <span class="ri-body"><span class="ri-title">${h(r.title || '')}</span><span class="ri-sub${r.kind === 'overdue' ? ' urgent' : ''}">${h(r.sub || '')}</span></span>
        <span class="ri-go">${h(s().remJump)} →</span>
      </button>
    `).join('') : `<div class="rem-empty">${h(s().noReminders)}</div>`;
    mountOverlay(`<div class="rem-overlay"><div class="rem-panel">
      <div class="rem-head"><span class="rem-title">🔔 ${h(s().reminders)}</span><button class="picker-close sm" type="button" data-close>✕</button></div>
      <div class="rem-list">${items}</div>
    </div></div>`);
    overlay.addEventListener('click', e => { if (e.target === overlay || e.target.closest('[data-close]')) closeOverlay(); });
    overlay.querySelectorAll('[data-href]').forEach(btn => btn.addEventListener('click', () => { location.href = btn.dataset.href; }));
  }
  function trophyMarkup() {
    const trophies = evalAchievements(context);
    return trophies.map(item => {
      const txt = item[lang()] || item.en;
      const pr = item.progress;
      const pct = pr && pr[1] ? Math.round((pr[0] / pr[1]) * 100) : 0;
      const val = pr ? `${pr[0] >= 1000 ? Math.round(pr[0] / 1000) + 'k' : Math.round(pr[0])}/${pr[1] >= 1000 ? Math.round(pr[1] / 1000) + 'k' : pr[1]}` : '';
      return `<div class="trophy ${item.unlocked ? 'got' : 'locked'}" title="${h(txt[1])}">
        <div class="tr-ic">${item.unlocked ? h(item.icon) : '🔒'}</div>
        <div class="tr-body"><div class="tr-t">${h(txt[0])}</div><div class="tr-d">${h(txt[1])}</div>${!item.unlocked && pr && pr[1] > 1 ? `<div class="tr-prog"><div class="tr-prog-fill" style="width:${pct}%"></div><span>${h(val)}</span></div>` : ''}</div>
        ${item.unlocked ? '<span class="tr-check">✓</span>' : ''}
      </div>`;
    }).join('');
  }
  function showProfile() {
    const account = loadAccount();
    const slayer = accountCharacter(account) || loadDebt().slayer || {};
    const cls = classMeta(slayer.class || 'dragoon');
    const reward = rewardFor(context.level.lvl);
    const trophies = evalAchievements(context);
    const got = trophies.filter(t => t.unlocked).length;
    const boards = profileBoardRows(account);
    const profileHref = `/character/?id=${encodeURIComponent(slayer.id || account.userId || '3720')}${(TEST_MODE || AUTOMATED) ? '&test=1' : ''}`;
    const boardCards = boards.length ? boards.map(board => `<div class="pd-board ${board.archived ? 'arch' : ''}">
      <a class="pd-board-main" href="${h(board.href)}">
        <span class="pdb-crest">${board.archived ? '🗄️' : '🏕️'}</span>
        <span class="pdb-body"><b>${h(board.name)}</b><i>#${h(board.id)} · ${board.participants} ${lang() === 'en' ? 'members' : 'คน'} · ${board.expenses} ${lang() === 'en' ? 'quests' : 'เควส'}</i></span>
        <span class="pdb-status">${h(s().openBoard)} →</span>
      </a>
    </div>`).join('') : `<div class="pd-noboards">${h(s().noBoards)}</div>`;
    mountOverlay(`<div class="drawer-overlay"><aside class="profile-drawer">
      <div class="pd-head"><div class="pd-title">🏅 ${h(s().profile)}</div><button class="picker-close" type="button" data-close>✕</button></div>
      <div class="pd-scroll">
        <div class="pd-hero frame-${h(reward.frame)}">
          ${avatarMarkup(slayer, 'pd-hero-ava').replace(/<\/span>$/, `<span class="pd-classbadge">${h(cls.glyph)}</span></span>`)}
          <div class="pd-hero-info">
            <div class="pd-hero-name">${h(slayer.name || s().hero)}</div>
            <div class="pd-rank rank-${h(reward.frame)}">${h(reward.glyph || '')} ${h(reward.title?.[lang()] || reward.title?.en || '')} · ${h(cls[lang()] || cls.en)}</div>
            <div class="pd-lvlrow"><span class="pd-lvl-k">${h(s().profileLvl)}</span><span class="pd-lvl-n">${context.level.lvl}</span><span class="pd-renown">${money(context.renown).replace('฿', '')} ${h(s().renown)}</span></div>
            <div class="pd-bar"><div style="width:${context.level.pct}%"></div></div>
            <a class="pd-fullprofile" href="${h(profileHref)}">${h(s().viewFullProfile)} →</a>
          </div>
        </div>
        <div class="pd-sub">${h(s().profileSub)}</div>
        <div class="pd-streak"><div class="pds-flame">🔥</div><div class="pds-main"><div class="pds-n">${profile.streak} <span>${h(s().streakDays)}</span></div><div class="pds-lab">${h(s().streakLab)} · ${h(s().bestStreak)} ${profile.bestStreak || 0}</div></div><div class="pds-note">${h(s().streakToday)}</div></div>
        <div class="pd-section-h">🏆 ${h(s().trophies)} <span class="pd-count">${got} / ${trophies.length}</span></div>
        <div class="trophy-grid">${trophyMarkup()}</div>
        <div class="pd-section-h">🗺️ ${h(s().myBoards)} <span class="pd-count">${boards.length}</span></div>
        <div class="pd-boardhint">${h(s().myBoardsSub)}</div>
        <div class="pd-boards">${boardCards}</div>
        <div class="pd-section-h">⚙️ ${h(s().settings)}</div>
        <div class="pd-setting"><span class="pds-k">${currentTheme() === 'dungeon' ? '🌙 ' + h(s().themeDark) : '☀️ ' + h(s().themeLight)}</span><div class="pd-theme-seg"><button class="${currentTheme() === 'tavern' ? 'on' : ''}" data-theme-pick="tavern">☀️</button><button class="${currentTheme() === 'dungeon' ? 'on' : ''}" data-theme-pick="dungeon">🌙</button></div></div>
        <div class="pd-setting"><span class="pds-k">🧭 ${h(s().takeTour)}</span><button class="btn-ghost xs" type="button" data-tour>${h(s().tourNext)} →</button></div>
        <div class="pd-backup"><div class="pdb-h">💾 ${h(s().backup)}</div><div class="pdb-sub">${h(s().backupSub)}</div><div class="pdb-actions"><button class="btn-ghost sm" type="button" data-export>⬇️ ${h(s().exportData)}</button><button class="btn-ghost sm" type="button" data-import>⬆️ ${h(s().importData)}</button><input type="file" accept="application/json,.json" hidden data-file></div><div class="pdb-msg" hidden></div></div>
        <div class="pd-account">
          <div class="pda-row">
            ${avatarMarkup(slayer, 'pda-ava')}
            <span class="pda-info">
              <b>${h(account.name || 'Pointy')}</b>
              <span class="pda-email">@${h(account.username || accountLogin(account) || 'pointy')}</span>
              <span class="pda-uid">${h(s().userId)} · ${h(account.userId || '3720')}</span>
            </span>
          </div>
          ${account.signedOut ? '' : `<button class="btn-ghost sm pda-logout" type="button" data-sign-out>🚪 ${h(s().signOut)}</button>`}
        </div>
      </div>
    </aside></div>`);
    overlay.addEventListener('click', e => { if (e.target === overlay || e.target.closest('[data-close]')) closeOverlay(); });
    overlay.querySelectorAll('[data-theme-pick]').forEach(btn => btn.addEventListener('click', () => { setTheme(btn.dataset.themePick); showProfile(); }));
    overlay.querySelector('[data-tour]').addEventListener('click', () => { closeOverlay(); showTour(); });
    overlay.querySelector('[data-export]').addEventListener('click', exportBackup);
    overlay.querySelector('[data-sign-out]')?.addEventListener('click', signOut);
    const file = overlay.querySelector('[data-file]');
    const msg = overlay.querySelector('.pdb-msg');
    overlay.querySelector('[data-import]').addEventListener('click', () => file.click());
    file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      file.value = '';
      if (f) importBackup(f, text => { msg.hidden = false; msg.textContent = text; });
    });
  }
  function showTour() {
    let idx = 0;
    const steps = [
      { ic: '⚔️', bg: 255, t: s().tourT0, b: s().tourB0 },
      { ic: '💸', bg: 150, t: s().tourT1, b: s().tourB1 },
      { ic: '🐉', bg: 25, t: s().tourT2, b: s().tourB2 },
      { ic: '⚖️', bg: 42, t: s().tourT3, b: s().tourB3 },
      { ic: '🏦', bg: 78, t: s().tourT4, b: s().tourB4 }
    ];
    function render() {
      const st = steps[idx];
      mountOverlay(`<div class="tour-overlay"><div class="tour-card">
        <button class="tour-skip" type="button" data-done>${h(s().tourSkip)}</button>
        <div class="tour-art" style="background:radial-gradient(120% 90% at 50% 18%, oklch(0.6 0.13 ${st.bg}), oklch(0.22 0.06 ${st.bg}) 82%)"><span class="tour-emoji">${h(st.ic)}</span></div>
        <div class="tour-t">${h(st.t)}</div><div class="tour-b">${h(st.b)}</div>
        <div class="tour-dots">${steps.map((_, i) => `<button type="button" class="tour-dot ${i === idx ? 'on' : ''}" data-step="${i}" aria-label="step ${i + 1}"></button>`).join('')}</div>
        <div class="tour-nav">${idx > 0 ? `<button class="btn-ghost" type="button" data-back>← ${h(s().tourBack)}</button>` : '<span></span>'}<button class="btn-gold" type="button" data-next>${idx === steps.length - 1 ? h(s().tourDone) : h(s().tourNext) + ' →'}</button></div>
      </div></div>`);
      overlay.querySelector('[data-done]').addEventListener('click', finish);
      overlay.querySelector('[data-next]').addEventListener('click', () => { if (idx === steps.length - 1) finish(); else { idx += 1; render(); } });
      const back = overlay.querySelector('[data-back]');
      if (back) back.addEventListener('click', () => { idx -= 1; render(); });
      overlay.querySelectorAll('[data-step]').forEach(btn => btn.addEventListener('click', () => { idx = Number(btn.dataset.step) || 0; render(); }));
    }
    function finish() { patchProfile({ tourSeen: true }); closeOverlay(); }
    render();
  }
  function showAchievementToast(item) {
    const txt = item[lang()] || item.en;
    const el = document.createElement('div');
    el.className = 'ach-toast';
    el.innerHTML = `<span class="at-ic">${h(item.icon)}</span><span class="at-body"><span class="at-lab">${h(s().newTrophy)}</span><span class="at-name">${h(txt[0])}</span></span>`;
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 3200);
  }
  function refresh(opts = {}) {
    profile = profile || loadProfile();
    context = computeProfile();
    context.streak = profile.streak || 0;
    reminders = computeReminders();
    const unlocked = evalAchievements(context).filter(a => a.unlocked).map(a => a.id);
    const seen = Array.isArray(profile.seen) ? profile.seen : [];
    const fresh = unlocked.filter(id => !seen.includes(id));
    if (!baselineDone) {
      baselineDone = true;
      if (fresh.length) profile = patchProfile({ seen: unlocked });
    } else if (opts.toast && fresh.length) {
      profile = patchProfile({ seen: unlocked });
      const item = ACHIEVEMENTS.find(a => a.id === fresh[0]);
      if (item) showAchievementToast(item);
    }
    renderTopbar();
  }
  let authWatcherStarted = false;
  function watchFirebaseAuth() {
    if (authWatcherStarted || !realAuthEnabled()) return;
    const auth = cloudAuth();
    if (!auth?.onAuthStateChanged) return;
    authWatcherStarted = true;
    auth.onAuthStateChanged(async user => {
      if (!user) {
        const current = readJson(AUTH_KEY, null);
        if (current?.provider === 'firebase') {
          clearAuth();
          profile = null;
          baselineDone = false;
          refresh({ toast: false });
          showLoginGate();
        }
        return;
      }
      try {
        const account = await loadCloudAccount(user);
        if (!account) return;
        if (isBlockedAccountStatus(account)) {
          await auth.signOut().catch(() => {});
          clearAuth();
          profile = null;
          baselineDone = false;
          refresh({ toast: false });
          showLoginGate();
          return;
        }
        saveAuth(account);
        profile = null;
        baselineDone = false;
        if (account.character) {
          removeLoginGate();
          profile = tickStreak();
          refresh({ toast: false });
        } else {
          showCharacterCreation(account);
        }
      } catch (err) {
        console.warn('Firebase account sync failed', err);
      }
    });
  }
  function init() {
    ensureTopbar();
    setupTheme();
    watchFirebaseAuth();
    if (loadAuth()) profile = tickStreak();
    else profile = loadProfile();
    refresh({ toast: false });
    showLoginGate();
    window.addEventListener('storage', () => refresh({ toast: false }));
    window.addEventListener('coin-quest-state-changed', () => refresh({ toast: true }));
    window.addEventListener('pointy-treasury-changed', () => refresh({ toast: true }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlay(); });
    if (loadAuth() && !TEST_MODE && !AUTOMATED && !profile.tourSeen) setTimeout(showTour, 650);
  }

  window.PointyProfileHub = {
    refresh,
    updateTripSnapshot,
    computeProfile,
    computeReminders,
    evalAchievements,
    showProfile,
    showReminders,
    showTour,
    signOut,
    loadAccount
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
