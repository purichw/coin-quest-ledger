import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const evidence = 'mobile/.artifacts/all-games-audit-2026-10-17';
const debtKey = 'pointy_test_debt_v1';
async function fixture(page, dragons = [], day = 1) {
  await page.clock.setFixedTime(new Date(Date.UTC(2026, 0, day, 12)));
  await page.addInitScript(({ dragons, debtKey }) => {
    if (sessionStorage.getItem('reducing-debt-fixture')) return;
    sessionStorage.setItem('reducing-debt-fixture', '1');
    localStorage.setItem('lang', 'th'); localStorage.setItem('pointy_theme', 'tavern');
    localStorage.setItem('pointy_profile_v1', JSON.stringify({ tourSeen: true }));
    localStorage.setItem('pointy_debt_settings_v1', JSON.stringify({ sound: false, animations: false, battlefx: 'minimal' }));
    localStorage.setItem('pointy_character_registry_v1', JSON.stringify({ 7101: { id: '7101', name: 'Audit Hero', xp: 300, debtXp: 0, trips: { audit: 300 } } }));
    localStorage.setItem(debtKey, JSON.stringify({ slayer: { name: 'Audit Hero', characterId: '7101' }, dragons, stats: { interest: 0 } }));
  }, { dragons, debtKey });
  await page.goto('/debt/?test=1');
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
}
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), debtKey);
async function pay(page, card, amount) {
  if (await card.locator('.dc-detail').isHidden()) await card.locator('.dc-summary').click();
  await card.getByRole('button', { name: 'บันทึกการจ่าย', exact: true }).filter({ visible: true }).click();
  await card.locator('[id^="strike-amt-"]').fill(String(amount));
  await card.locator('.dc-strike-form .btn-danger').click();
}

test('New debt defaults to reducing interest; creation, reload, repayment and combined XP stay coherent', async ({ page }, info) => {
  await fixture(page);
  await page.locator('.add-dragon').click();
  await expect(page.locator('#new-interestMode')).toHaveValue('reducing');
  await expect(page.locator('.df-interest [data-interest-mode="reducing"]')).toHaveAttribute('aria-pressed', 'true');
  for (const [field, value] of Object.entries({ name: 'TEST ลดต้นลดดอก', balance: 1000, original: 1000, apr: 36.5, payment: 100, dueDay: 15 })) await page.locator('#new-' + field).fill(String(value));
  for (const mode of ['compound', 'simple', 'reducing']) {
    await page.locator(`[data-interest-mode="${mode}"]`).click();
    await expect(page.locator('#new-interestMode')).toHaveValue(mode);
    await expect(page.locator('.df-interest [aria-pressed="true"]')).toHaveCount(1);
  }
  const switchLanguage = info.project.name === 'mobile' ? '.cq-lang-compact' : '.lang-btn[data-lang="en"]';
  await page.locator(switchLanguage).click();
  await expect(page.locator('#new-interestMode')).toHaveValue('reducing');
  await expect(page.locator('.df-interest')).toContainText('Reducing balance');
  await page.locator('.df-interest').scrollIntoViewIfNeeded();
  await fs.mkdir(evidence, { recursive: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `${evidence}/debt-reducing-form-${info.project.name}.png`, animations: 'disabled' });
  await page.locator(info.project.name === 'mobile' ? '.cq-lang-compact' : '.lang-btn[data-lang="th"]').click();
  await page.locator('.df-actions .btn-primary').click();
  expect((await saved(page)).dragons[0]).toMatchObject({ interestMode: 'reducing', unpaidInterest: 0, balance: 1000 });
  await page.reload();
  const card = page.locator('.dragon-card');
  await card.locator('.dc-summary').click(); await card.locator('.dc-edit').click();
  await expect(card.locator('[id$="-interestMode"]')).toHaveValue('reducing');
  await card.locator('[id$="-name"]').fill('TEST ลดต้นลดดอก saved');
  await card.locator('.df-actions .btn-primary').click();
  await page.clock.setFixedTime(new Date('2026-01-11T12:00:00Z')); await page.reload();
  await expect(card.locator('.dc-bal')).toHaveText('฿1,010');
  await pay(page, card, 110);
  expect((await saved(page)).dragons[0]).toMatchObject({ balance: 900, unpaidInterest: 0 });
  expect((await saved(page)).dragons[0].log[0]).toMatchObject({ amount: 110, interest: 10, principal: 100 });
  await page.clock.setFixedTime(new Date('2026-01-21T12:00:00Z')); await page.reload();
  await expect(card.locator('.dc-bal')).toHaveText('฿909'); await pay(page, card, 909);
  await expect(card).toHaveClass(/slain/);
  expect((await saved(page)).dragons[0].log[1]).toMatchObject({ interest: 9, principal: 900 });
  const hero = await page.evaluate(() => JSON.parse(localStorage.getItem('pointy_character_registry_v1'))['7101']);
  expect(hero).toMatchObject({ debtXp: 602, xp: 902, trips: { audit: 300 } });
  await page.reload(); await expect(card).toHaveClass(/slain/);
  expect((await saved(page)).dragons[0]).toMatchObject({ interestMode: 'reducing', unpaidInterest: 0, balance: 0 });
});

test('Existing flat, compound and missing-mode records keep their original formulas on reload and edit', async ({ page }) => {
  const start = Date.UTC(2026, 0, 1);
  const base = { type: 'card', balance: 1000, original: 1000, apr: 36.5, payment: 100, payMode: 'monthly', dueDay: 15, createdAt: start, interestAccruedAt: start, log: [] };
  await fixture(page, [{ ...base, id: 'flat', name: 'TEST Flat', interestMode: 'simple' }, { ...base, id: 'compound', name: 'TEST Compound', interestMode: 'compound' }, { ...base, id: 'legacy', name: 'TEST Legacy' }], 11);
  await expect(page.locator('[data-dragon-id="flat"] .dc-bal')).toHaveText('฿1,010');
  // Opening shows accrued balances; the explicit update persists that state.
  await page.locator('#debt-manage > summary').click();
  await page.locator('.end-month').click();
  const state = await saved(page);
  expect(state.dragons.find(d => d.id === 'flat')).toMatchObject({ interestMode: 'simple', balance: 1010 });
  for (const id of ['compound', 'legacy']) {
    expect(state.dragons.find(d => d.id === id).interestMode).toBe('compound');
    expect(state.dragons.find(d => d.id === id).balance).toBeCloseTo(1000 * 1.001 ** 10, 7);
  }
  const card = page.locator('[data-dragon-id="legacy"]');
  await card.locator('.dc-summary').click(); await card.locator('.dc-edit').click();
  await expect(card.locator('[id$="-interestMode"]')).toHaveValue('compound');
  await card.locator('[id$="-name"]').fill('TEST Legacy renamed');
  await card.locator('.df-actions .btn-primary').click(); await page.reload();
  const after = (await saved(page)).dragons.find(d => d.id === 'legacy');
  expect(after.interestMode).toBe('compound'); expect(after.balance).toBeCloseTo(1000 * 1.001 ** 10, 7);
});
