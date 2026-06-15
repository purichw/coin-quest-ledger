import { expect, test } from '@playwright/test';

function uniqueTripId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function gotoFreshTrip(page, prefix = 'e2e') {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  const id = uniqueTripId(prefix);
  await page.goto(`/trip/?id=${id}&test=1`);
  await expect(page.getByText('รวมปาร์ตี้!')).toBeVisible();
  return id;
}

async function startAddHero(page) {
  const onboardingStart = page.getByRole('button', { name: /สร้างฮีโร่คนแรก/ });
  if (await onboardingStart.isVisible().catch(() => false)) {
    await onboardingStart.click();
  } else {
    await page.getByRole('button', { name: '＋ เพิ่มฮีโร่' }).click();
  }
}

async function chooseWarriorMale(page) {
  await page.getByRole('button', { name: '⚔️ เลือกฮีโร่ของคุณ' }).click();
  await page.locator('.picker-cell[data-class="warrior"][data-gender="male"]').click();
}

async function addWarrior(page, name) {
  await startAddHero(page);
  await page.getByPlaceholder('ตั้งชื่อฮีโร่ใหม่').fill(name);
  await chooseWarriorMale(page);
  await page.getByRole('button', { name: 'ยืนยันตัวละคร' }).click();
  await expect(page.getByRole('dialog', { name: /ยืนยันฮีโร่/ })).toBeVisible();
  await page.getByRole('button', { name: 'ยืนยันถาวร' }).click();
  await expect(page.locator('#party-grid')).toContainText(name);
}

test.beforeEach(async ({ page }) => {
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));
  page.consoleErrors = consoleErrors;
});

test.afterEach(async ({ page }) => {
  expect(page.consoleErrors).toEqual([]);
});

test('expense splitter requires explicit hero choice and locks the confirmed character', async ({ page }) => {
  await gotoFreshTrip(page, 'hero-lock');
  await startAddHero(page);

  const confirm = page.getByRole('button', { name: 'ยืนยันตัวละคร' });
  await expect(confirm).toBeDisabled();

  await page.getByPlaceholder('ตั้งชื่อฮีโร่ใหม่').fill('Shane');
  await expect(confirm).toBeDisabled();

  await chooseWarriorMale(page);
  await expect(page.getByText('อัปโหลดรูป')).toHaveCount(0);
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await expect(page.getByRole('dialog', { name: /ยืนยันฮีโร่/ })).toContainText('เปลี่ยนไม่ได้');
  await page.getByRole('button', { name: 'ยืนยันถาวร' }).click();

  await expect(page.locator('#party-count')).toHaveText('1');
  await expect(page.locator('#party-grid')).toContainText('Shane');
  await expect(page.locator('.char-id')).toHaveAttribute('href', /\/character\/\?id=\d{4}&test=1/);
  await expect(page.getByRole('button', { name: '⚔️ เลือกฮีโร่ของคุณ' })).toHaveCount(0);
});

test('expense splitter supports admin URL setup, character IDs, admin unlock, and quick toggles', async ({ page }) => {
  const originalId = await gotoFreshTrip(page, 'admin-setup');
  const takenSlug = `party-taken-${Math.random().toString(36).slice(2, 8)}`;
  const slug = `party-${Math.random().toString(36).slice(2, 10)}`;

  await page.evaluate(id => {
    sessionStorage.setItem(`pointy_test_trip_${id}`, JSON.stringify({ tripName: 'Taken trip' }));
  }, takenSlug);
  await page.getByRole('button', { name: /ตั้งค่าแอดมิน/ }).click();
  await page.locator('#admin-url-id').fill(takenSlug);
  await page.locator('#admin-pass-new').fill('hero-pass');
  await page.getByRole('button', { name: 'สร้างแอดมิน' }).click();
  await expect(page.getByText(`ID/URL ${takenSlug} ถูกใช้แล้ว`)).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/trip/\\?id=${originalId}&test=1$`));

  await page.locator('#admin-url-id').fill(slug);
  await page.locator('#admin-pass-new').fill('hero-pass');
  await page.getByRole('button', { name: 'สร้างแอดมิน' }).click();
  await expect(page).toHaveURL(new RegExp(`/trip/\\?id=${slug}&test=1$`));
  await page.locator('.picker-close').click();

  await addWarrior(page, 'Shane');
  await expect(page.locator('#party-grid')).toContainText(/#\d{4}/);

  await page.locator('#quick-toggles button').nth(1).click();
  await expect(page.locator('body')).toHaveClass(/no-animations/);
  await page.locator('#quick-toggles button').first().click();
  await expect(page.locator('#quick-toggles button').first()).toHaveAttribute('aria-pressed', 'false');
  await page.waitForTimeout(900);
  await expect(page.locator('#save-status')).toContainText('บันทึกแล้ว');

  await page.evaluate(() => {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith('pointy_admin_unlocked_'))
      .forEach(key => sessionStorage.removeItem(key));
    localStorage.removeItem('pointy_admin_owner_token_v1');
  });
  await expect(page.locator('#party-grid')).toContainText('Shane');
  await expect(page.locator('#party-grid')).toContainText(/#\d{4}/);

  await page.getByLabel('Settings').click();
  await expect(page.getByText('ปลดล็อกเพื่อดูและแก้ไขข้อมูลแอดมิน')).toBeVisible();
  await page.locator('#admin-pass').fill('hero-pass');
  await page.getByRole('button', { name: 'ปลดล็อก' }).click();
  await expect(page.locator('.admin-table')).toContainText('Shane');
});

test('expense splitter starts new trips with a 4 digit URL and creator admin', async ({ page }) => {
  await gotoFreshTrip(page, 'new-url');
  await addWarrior(page, 'Shane');

  await page.getByRole('button', { name: /ออกเดินทางใหม่/ }).click();
  await expect(page.getByText('กำหนด URL เกมเป็นเลข 4 หลัก')).toBeVisible();
  await expect(page.locator('#new-trip-code')).toHaveValue(/\d{4}/);
  await expect(page.locator('#new-trip-admin-pass')).toHaveValue(/\d{6}/);

  await page.evaluate(() => {
    sessionStorage.setItem('pointy_test_trip_2468', JSON.stringify({ tripName: 'Existing trip' }));
  });
  await page.locator('#new-trip-code').fill('2468');
  await page.locator('#new-trip-admin-pass').fill('captain-2468');
  await page.getByRole('button', { name: /เริ่มทริปใหม่/ }).click();
  await expect(page.getByText('ID/URL 2468 ถูกใช้แล้ว')).toBeVisible();
  await expect(page).not.toHaveURL(/\/trip\/\?id=2468&test=1$/);

  await page.locator('#new-trip-code').fill('2469');
  await page.getByRole('button', { name: /เริ่มทริปใหม่/ }).click();

  await expect(page).toHaveURL(/\/trip\/\?id=2469&test=1$/);
  await expect(page.getByText('รวมปาร์ตี้!')).toBeVisible();

  const admin = await page.evaluate(() => {
    const raw = sessionStorage.getItem('pointy_test_trip_2469');
    return raw ? JSON.parse(raw).admin : null;
  });
  expect(admin?.passwordHash).toBeTruthy();
  expect(admin?.ownerHash).toBeTruthy();
  expect(admin?.urlLocked).toBe(true);

  await page.getByRole('button', { name: /ตั้งค่าแอดมิน/ }).click();
  await expect(page.locator('.admin-table')).toBeVisible();
  await page.getByRole('button', { name: 'ล็อกแอดมิน' }).click();
  await expect(page.getByText('ปลดล็อกเพื่อดูและแก้ไขข้อมูลแอดมิน')).toBeVisible();
  await page.locator('#admin-pass').fill('captain-2468');
  await page.getByRole('button', { name: 'ปลดล็อก' }).click();
  await expect(page.locator('.admin-table')).toBeVisible();

  await page.locator('.picker-close').click();
  await page.getByRole('button', { name: /ออกเดินทางใหม่/ }).click();
  await page.locator('#new-trip-code').fill('2470');
  await page.locator('#new-trip-admin-pass').fill('captain-2470');
  await page.getByRole('button', { name: /เริ่มทริปใหม่/ }).click();
  await expect(page).toHaveURL(/\/trip\/\?id=2470&test=1$/);

  const secondAdmin = await page.evaluate(() => {
    const raw = sessionStorage.getItem('pointy_test_trip_2470');
    return raw ? JSON.parse(raw).admin : null;
  });
  expect(secondAdmin?.ownerHash).toBe(admin.ownerHash);

  await page.getByRole('button', { name: /ตั้งค่าแอดมิน/ }).click();
  await expect(page.locator('.admin-table')).toBeVisible();
  await expect(page.locator('.owned-board-list')).toContainText('2469');
  await expect(page.locator('.owned-board-list')).toContainText('2470');
  await expect(page.locator('.owned-board-list')).toContainText('บอร์ดปัจจุบัน');

  await page.evaluate(() => {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith('pointy_admin_'))
      .forEach(key => sessionStorage.removeItem(key));
    localStorage.removeItem('pointy_admin_owner_token_v1');
  });
  await page.getByRole('button', { name: 'ล็อกแอดมิน' }).click();
  await expect(page.getByText('ปลดล็อกเพื่อดูและแก้ไขข้อมูลแอดมิน')).toBeVisible();
  await page.locator('#admin-pass').fill('captain-2470');
  await page.getByRole('button', { name: 'ปลดล็อก' }).click();
  await expect(page.locator('.admin-table')).toBeVisible();
});

test('expense splitter exposes 18 avatar classes and persists archfiend skins', async ({ page }) => {
  const tripId = await gotoFreshTrip(page, 'avatar-skins');
  await startAddHero(page);
  await page.getByPlaceholder('ตั้งชื่อฮีโร่ใหม่').fill('Regent');
  await page.getByRole('button', { name: '⚔️ เลือกฮีโร่ของคุณ' }).click();

  await expect(page.locator('.picker-cell[data-class][data-gender="male"]')).toHaveCount(18);
  await expect(page.locator('.picker-cell[data-class][data-gender="female"]')).toHaveCount(18);
  await page.locator('.picker-cell[data-class="archfiend"][data-gender="male"]').click();
  await page.getByRole('button', { name: 'ยืนยันตัวละคร' }).click();
  await page.getByRole('button', { name: 'ยืนยันถาวร' }).click();

  await expect(page.locator('.hc-skin')).toHaveCount(1);
  await page.locator('.hc-skin').click();
  await expect(page.locator('.skin-pop')).toContainText('ดั้งเดิม');
  await expect(page.locator('.skin-pop')).toContainText('ราชันเลือด');
  await expect(page.locator('.skin-pop')).toContainText('อาร์คฟีนด์นักว่ายน้ำ');
  await expect(page.locator('.skin-pop')).toContainText('อาร์คฟีนด์นักว่ายน้ำดำแดง');
  await page.locator('.skin-opt', { hasText: 'ราชันเลือด' }).click();

  await expect(page.locator('.portrait-img').first()).toHaveAttribute('src', /crimson-regent-male\.png$/);
  await expect(page.locator('.chip-avatar img').first()).toHaveAttribute('src', /crimson-regent-male\.png$/);
  const fallback = await page.evaluate(() => window.resolveAvatarFile('archfiend-male', 'bogus'));
  expect(fallback).toMatch(/archfiend-male\.png$/);

  await page.waitForTimeout(900);
  const savedSkin = await page.evaluate(id => {
    const raw = sessionStorage.getItem(`pointy_test_trip_${id}`);
    return raw ? JSON.parse(raw).heroSkins?.Regent : null;
  }, tripId);
  expect(savedSkin).toBe('crimson-regent');

  await page.locator('.hc-skin').click();
  await page.getByRole('button', { name: 'อาร์คฟีนด์นักว่ายน้ำ', exact: true }).click();
  await expect(page.locator('.portrait-img').first()).toHaveAttribute('src', /archfiend-swimmer-male\.png$/);
  await expect(page.locator('.portrait-img').first()).toHaveClass(/portrait-img/);
  await page.locator('.hc-skin').click();
  await page.getByRole('button', { name: 'อาร์คฟีนด์นักว่ายน้ำดำแดง', exact: true }).click();
  await expect(page.locator('.portrait-img').first()).toHaveAttribute('src', /archfiend-swimmer-blackred-male\.png$/);
  await expect(page.locator('.portrait-img').first()).toHaveClass(/portrait-img/);
});

test('expense splitter supports duplicate avatars, multi-payer exact split, settlement XP, and victory', async ({ page }) => {
  await gotoFreshTrip(page, 'expense-math');
  await addWarrior(page, 'Shane');

  await startAddHero(page);
  await page.getByPlaceholder('ตั้งชื่อฮีโร่ใหม่').fill('Pointy');
  await page.getByRole('button', { name: '⚔️ เลือกฮีโร่ของคุณ' }).click();
  const duplicateWarrior = page.locator('.picker-cell[data-class="warrior"][data-gender="male"]');
  await expect(duplicateWarrior).toContainText('ถูกเลือกแล้ว');
  await duplicateWarrior.click();
  await page.getByRole('button', { name: 'ยืนยันตัวละคร' }).click();
  await page.getByRole('button', { name: 'ยืนยันถาวร' }).click();

  await expect(page.locator('#party-count')).toHaveText('2');

  await page.locator('#exp-desc').fill('Dinner');
  await page.locator('.qf-top .icon-btn').click();
  await expect(page.locator('.icon-pop.labeled')).toBeVisible();
  await expect(page.locator('.icon-opt .qi')).toHaveCount(18);
  await expect(page.locator('.io-lab', { hasText: 'อาหาร' })).toBeVisible();
  await page.locator('.icon-opt', { hasText: 'กาแฟ' }).click();
  await expect(page.locator('.qf-top .icon-btn .qi')).toBeVisible();
  await page.locator('#exp-amount').fill('1000');
  await page.getByRole('button', { name: '✓ ทั้งปาร์ตี้' }).click();
  await page.getByRole('button', { name: 'ระบุเอง' }).click();
  await page.locator('.weight-value[data-name="Shane"]').fill('300');
  await page.locator('.weight-value[data-name="Pointy"]').fill('700');
  await page.getByRole('button', { name: '＋ หลายคนจ่าย' }).click();
  await page.locator('.payer-value[data-name="Shane"]').fill('600');
  await page.locator('.payer-value[data-name="Pointy"]').fill('400');
  await page.getByRole('button', { name: '⚔️ บันทึกเควส' }).click();

  await expect(page.locator('#party-total')).toHaveText('฿1,000');
  await expect(page.locator('#quest-log')).toContainText('Shane ฿300');
  await expect(page.locator('#quest-log')).toContainText('Pointy ฿700');
  await expect(page.locator('#quest-log')).toContainText('+300 XP');
  await expect(page.locator('#party-grid')).toContainText('ผู้พิทักษ์');
  await expect(page.locator('#party-grid')).toContainText('+฿300');
  await expect(page.locator('#party-grid')).toContainText('ติดหนี้');
  await expect(page.locator('#party-grid')).toContainText('−฿300');
  await expect(page.locator('#settle-body')).toContainText('฿300');

  await page.getByRole('button', { name: /ส่งบรรณาการ/ }).click();
  await expect(page.getByText('ตั้งพร้อมเพย์ของผู้รับก่อนสร้าง QR')).toBeVisible();
  await page.locator('#promptpay-input').fill('0812345678');
  await page.getByRole('button', { name: 'บันทึกพร้อมเพย์' }).click();
  await expect(page.getByText('สแกนเพื่อจ่าย')).toBeVisible();
  await expect(page.locator('.qr-svg')).toBeVisible();
  await page.getByRole('button', { name: /ยืนยันชำระแล้ว/ }).click();
  await expect(page.locator('#settle-body')).toContainText('ปาร์ตี้สมดุลแล้ว');
  await expect(page.getByText('ผ่านเควสแล้ว!')).toBeVisible();
  await expect(page.locator('#party-grid')).toContainText('500/600');
  await expect(page.locator('#party-grid')).toContainText('400/600');
});

test('expense splitter supports itemized loot split, receipt date, and quest board campaigns', async ({ page }) => {
  await gotoFreshTrip(page, 'loot-board');
  await addWarrior(page, 'Shane');
  await addWarrior(page, 'Pointy');

  await page.locator('#exp-desc').fill('Market loot');
  await page.getByRole('button', { name: 'แยกของ' }).click();
  await page.locator('.loot-name').first().fill('Sushi');
  await page.locator('.loot-amount').first().fill('300');
  await page.locator('.loot-row').first().getByRole('button', { name: /Shane/ }).click();
  await page.getByRole('button', { name: /เพิ่มของ/ }).click();
  await page.locator('.loot-name').nth(1).fill('Snacks');
  await page.locator('.loot-amount').nth(1).fill('100');
  await expect(page.locator('#exp-amount')).toHaveValue('400');
  await page.locator('#exp-date').fill('2026-06-14T18:30');
  await page.getByRole('button', { name: '⚔️ บันทึกเควส' }).click();

  await expect(page.locator('#quest-log')).toContainText('แยกของ');
  await expect(page.locator('#quest-log')).toContainText('Shane ฿350');
  await expect(page.locator('#quest-log')).toContainText('Pointy ฿50');
  await expect(page.locator('#party-total')).toHaveText('฿400');

  await page.getByRole('button', { name: /กระดานเควส/ }).click();
  await expect(page.getByText('กระดานเควส').last()).toBeVisible();
  await expect(page.locator('.board-card')).toHaveCount(1);
  await page.getByRole('button', { name: /เริ่มทริปใหม่/ }).click();
  await expect(page.getByText('กำหนด URL เกมเป็นเลข 4 หลัก')).toBeVisible();
  await expect(page.locator('#new-trip-code')).toHaveValue(/\d{4}/);
  await page.locator('#new-trip-code').fill('1357');
  await page.getByRole('button', { name: /เริ่มทริปใหม่/ }).click();
  await expect(page).toHaveURL(/\/trip\/\?id=1357&test=1$/);
  await expect(page.getByText('รวมปาร์ตี้!')).toBeVisible();
});

test('expense splitter imports text, switches settings, and avoids mobile overflow', async ({ page }) => {
  await gotoFreshTrip(page, 'import-settings');
  await addWarrior(page, 'Shane');
  await addWarrior(page, 'Pointy');

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'ดันเจียน' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dungeon');
  await page.locator('.picker-close').click();

  await page.getByRole('button', { name: 'นำเข้ารายการ' }).click();
  await page.locator('#import-text').fill('Coffee, 120\nTaxi; 240\nBad line');
  await expect(page.locator('#import-count')).toHaveText('อ่านได้ 2 รายการ');
  await page.getByRole('button', { name: '📥 นำเข้าข้อความ' }).click();
  await expect(page.locator('#expense-count')).toHaveText('2');
  await expect(page.locator('#party-total')).toHaveText('฿360');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  const portraitFits = await page.evaluate(() => [...document.querySelectorAll('.portrait-img')].every(img => {
    const r = img.getBoundingClientRect();
    const p = img.parentElement.getBoundingClientRect();
    return r.left >= p.left - 3 && r.right <= p.right + 3 && r.bottom <= p.bottom + 14;
  }));
  expect(portraitFits).toBe(true);
});

test('super admin portal saves drafts, publishes board edits, and records revisions', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('pointy_test_trip_9001', JSON.stringify({
      tripName: 'Alpha Board',
      participants: ['Shane'],
      characterIds: { Shane: '1111' },
      expenses: [],
      admin: { ownerHash: 'owner-a', adminId: 'ADM-ALPHA', adminName: 'Alpha Admin', passwordHash: 'old-hash', urlLocked: true },
      updatedAt: 100
    }));
  });
  await page.goto('/admin/?test=1');
  await page.locator('#gate-pass').fill('portal-pass');
  await page.getByRole('button', { name: 'Set & Unlock' }).click();

  await expect(page.locator('input[value="Alpha Board"]')).toBeVisible();
  await page.locator('input[value="Alpha Board"]').fill('Beta Board');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'ปิด' }).click();
  await expect(page.evaluate(() => localStorage.getItem('pointy_super_admin_draft_v2'))).resolves.toContain('Beta Board');

  await page.getByRole('button', { name: 'Restore' }).click();
  await page.getByRole('button', { name: 'ยืนยัน' }).click();
  await expect(page.locator('input[value="Alpha Board"]')).toBeVisible();

  await page.locator('input[value="9001"]').fill('9002');
  await page.locator('input[value="Alpha Board"]').fill('Gamma Board');
  await page.getByRole('button', { name: /Publish/ }).click();
  await page.getByRole('button', { name: 'ยืนยัน' }).click();

  await expect(page.evaluate(() => sessionStorage.getItem('pointy_test_trip_9001'))).resolves.toBeNull();
  await expect(page.evaluate(() => JSON.parse(sessionStorage.getItem('pointy_test_trip_9002')).tripName)).resolves.toBe('Gamma Board');
  await page.getByRole('button', { name: 'Version Control' }).click();
  await expect(page.locator('.rev summary')).toContainText('changes');
  await page.locator('.rev summary').click();
  await expect(page.locator('.rev-list')).toContainText('URL 9001');
});

test('character profile aggregates boards, shows portrait, and supports privacy mode', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('pointy_character_registry_v1', JSON.stringify({
      '1111': { id: '1111', name: 'Shane', class: 'archfiend', gender: 'male', skin: 'archfiend-swimmer-blackred', xp: 900, createdAt: 100, updatedAt: 300 }
    }));
    sessionStorage.setItem('pointy_test_trip_9001', JSON.stringify({
      tripName: 'Alpha Board',
      participants: ['Shane', 'Pointy'],
      characterIds: { Shane: '1111', Pointy: '2222' },
      heroClasses: { Shane: 'archfiend', Pointy: 'warrior' },
      heroGenders: { Shane: 'male', Pointy: 'female' },
      heroSkins: { Shane: 'archfiend-swimmer-blackred' },
      expenses: [{ id: 1, amount: 1000, paidBy: 'Shane', sharedBy: ['Shane', 'Pointy'] }],
      settleXp: { Shane: 400 },
      admin: { adminId: 'ADM-ALPHA', adminName: 'Shane' },
      updatedAt: 200
    }));
  });
  await page.goto('/character/?id=1111&test=1');

  await expect(page.getByRole('heading', { name: 'Shane' })).toBeVisible();
  await expect(page.locator('.char-id')).toHaveText('#1111');
  await expect(page.locator('.portrait-stage img')).toHaveAttribute('src', /archfiend-swimmer-blackred-male\.png/);
  await expect(page.locator('.grid > .panel').filter({ hasText: 'ประวัติบอร์ด' }).getByRole('link', { name: 'Alpha Board' })).toBeVisible();
  await expect(page.locator('.badges')).toContainText('แอดมินบอร์ด');
  await expect(page.locator('.summary')).toContainText('฿1,000');

  await page.getByRole('button', { name: 'ซ่อนยอดเงิน' }).click();
  await expect(page.locator('body')).toHaveClass(/money-hidden/);
  await expect(page.getByRole('button', { name: 'แสดงยอดเงิน' })).toBeVisible();
  await expect(page).toHaveURL(/private=1/);
  await expect(page.locator('.summary')).toContainText('••••');

  await page.getByRole('button', { name: 'EN' }).click();
  await expect(page.locator('.brand')).toContainText('Character Profile');
  await expect(page.locator('.badges')).toContainText('Board Admin');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test('price comparison page loads and ranks normalized unit prices', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'เปรียบเทียบราคา' })).toBeVisible();
  await expect(page.locator('#cmp-grid')).toBeVisible();
  await expect(page.locator('.cmp-icon .qi').first()).toBeVisible();

  await page.locator('.add-cmp').scrollIntoViewIfNeeded();
  await page.locator('.add-cmp').click();
  await page.locator('.add-cmp-open .icon-btn').click();
  await expect(page.locator('.icon-pop.labeled')).toBeVisible();
  await expect(page.locator('.icon-opt .qi')).toHaveCount(12);
  await expect(page.locator('.io-lab').filter({ hasText: /^นม$/ })).toBeVisible();
  await page.locator('.icon-opt', { hasText: 'ผงซักฟอก' }).click();
  await expect(page.locator('.add-cmp-open .icon-btn .qi')).toBeVisible();

  const ranked = await page.evaluate(() => {
    const cmp = { baseUnit: 'มล.' };
    return rankOffers([
      { merchant: 'A', price: 200, qty: 850, unit: 'มล.' },
      { merchant: 'B', price: 100, qty: 300, unit: 'มล.' },
    ], cmp).map(offer => ({ merchant: offer.merchant, isBest: offer.isBest, pu: offer.pu }));
  });

  expect(ranked[0].merchant).toBe('A');
  expect(ranked[0].isBest).toBe(true);
  expect(ranked[0].pu).toBeLessThan(ranked[1].pu);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});
