import { test, expect } from '@playwright/test';
import { gotoFreshTrip, addWarrior } from './helpers/coin-quest-helpers.mjs';

test('ledger rejects negative money and incomplete percentages, preserves draft, then accepts corrected values', async ({ page }) => {
  await gotoFreshTrip(page, 'validation');
  await addWarrior(page, 'TEST A'); await addWarrior(page, 'TEST B');
  await page.locator('#exp-desc').fill('TEST invalid amount');
  await page.locator('#exp-amount').fill('-1');
  await page.locator('[data-entry-action="add-expense"]').click();
  await expect(page.locator('#expense-count')).toHaveText('0');
  await expect(page.locator('#exp-amount')).toHaveValue('-1');
  await page.locator('#exp-amount').fill('100'); await page.locator('[data-entry-action="select-all-shares"]').click();
  await page.getByRole('button', { name: 'เปอร์เซ็นต์', exact: true }).click();
  await page.locator('.weight-value').nth(0).fill('30'); await page.locator('.weight-value').nth(1).fill('30');
  await page.locator('[data-entry-action="add-expense"]').click();
  await expect(page.locator('#toast')).toContainText('100'); await expect(page.locator('#expense-count')).toHaveText('0');
  await page.locator('.weight-value').nth(1).fill('70'); await page.locator('[data-entry-action="add-expense"]').click();
  await expect(page.locator('#expense-count')).toHaveText('1');
});

test('treasury rejects zero expense, wrong month and impossible bill day without closing the form', async ({ page }) => {
  await page.goto('/treasury/?test=1');
  await page.evaluate(() => openCategoryForm());
  await page.locator('#cat-name').fill('TEST category'); await page.locator('#cat-budget').fill('100'); await page.locator('.modal-cover .btn-primary').click();
  await page.evaluate(() => openExpenseForm());
  await page.locator('#expense-amount').fill('0'); await page.locator('.modal-cover .btn-primary').click();
  await expect(page.locator('#expense-amount')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#expense-amount').fill('10.01'); await page.locator('#expense-date').fill('2020-01-01');
  await page.locator('.modal-cover .btn-primary').click(); await expect(page.locator('#expense-date')).toHaveAttribute('aria-invalid', 'true');
  await page.evaluate(() => { closeModal(); openBillForm(); });
  await page.locator('#bill-name').fill('TEST bill'); await page.locator('#bill-amount').fill('10.01'); await page.locator('#bill-due').fill('32');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.locator('#bill-due')).toHaveValue('32'); await expect(page.locator('#bill-due')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#bill-due').fill('31'); await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.locator('#bill-due')).toHaveCount(0); await expect(page.locator('.bill-row').filter({ hasText: 'TEST bill' })).toBeVisible();
  await expect(page.locator('.bill-row').filter({ hasText: 'TEST bill' })).toContainText('฿10.01');
});

test('debt create and edit reject invalid terms instead of clamping or dropping them', async ({ page }) => {
  await page.goto('/debt/?test=1'); await page.evaluate(() => openAddDragon());
  await page.locator('#new-name').fill('TEST validation dragon');
  await page.locator('#new-balance').fill('-1'); await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.locator('#new-balance')).toHaveValue('-1'); await expect(page.locator('#new-balance')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#new-balance').fill('100'); await page.locator('#new-original').fill('100'); await page.locator('#new-payment').fill('10'); await page.locator('#new-dueDay').fill('32');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click(); await expect(page.locator('#new-dueDay')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#new-dueDay').fill('31'); await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.locator('#new-name')).toHaveCount(0);
  const card = page.locator('[data-dragon-id]').filter({ hasText: 'TEST validation dragon' });
  const id = await card.getAttribute('data-dragon-id'); await page.evaluate(id => openEdit(id), id);
  await page.locator(`#edit-${id}-apr`).fill('-1'); await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.locator(`#edit-${id}-apr`)).toHaveAttribute('aria-invalid', 'true');
});

test('renaming accrued debt preserves principal, precise balance and the interest calculation date after reload', async ({ page }) => {
  await page.goto('/debt/?test=1');
  const original = await page.evaluate(() => {
    const time = PointyLogic.dateOnlyMs(new Date()) - 86400000;
    const dragon = { id: 'qa-accrued', name: 'TEST accrued', type: 'card', balance: 1100.1234567, original: 1000, apr: 12, payment: 100, dueDay: 15, payMode: 'monthly', interestMode: 'simple', log: [], createdAt: time, interestAccruedAt: time };
    S.dragons = [dragon]; renderAll(); openEdit(dragon.id); return dragon;
  });
  await page.locator('#edit-qa-accrued-name').fill('TEST renamed accrued');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.locator('#edit-qa-accrued-name')).toHaveCount(0);
  const saved = await page.evaluate(() => S.dragons.find(d => d.id === 'qa-accrued'));
  expect(saved.balance).toBe(original.balance); expect(saved.interestAccruedAt).toBe(original.interestAccruedAt);
  await page.reload();
  const actual = await page.evaluate(() => S.dragons.find(d => d.id === 'qa-accrued'));
  // Loading legitimately accrues the one elapsed day, using the initial principal.
  expect(actual.original).toBe(original.original); expect(actual.balance).toBeCloseTo(original.balance + original.original * original.apr / 100 / 365, 9); expect(actual.interestAccruedAt).toBe(original.interestAccruedAt + 86400000);
  await page.reload(); expect(await page.evaluate(() => S.dragons.find(d => d.id === 'qa-accrued').balance)).toBe(actual.balance);
  await expect(page.locator('[data-dragon-id="qa-accrued"]')).toContainText('TEST renamed accrued');
});

test('price builder refuses fractional promotion and partially completed rows without dropping user input', async ({ page }) => {
  await page.goto('/?test=1&view=compare');
  await page.locator('.arena-new').click(); await page.locator('#new-name').fill('TEST price validation'); await page.locator('.form-actions .btn-primary').click();
  const card = page.locator('.cmp-card').filter({ hasText: 'TEST price validation' });
  const dialog = page.locator('#arena-dialog');
  const first = dialog.locator('.draft-slot').nth(0), second = dialog.locator('.draft-slot').nth(1);
  await first.locator('.calc-row input').nth(0).fill('10.01'); await first.locator('.calc-row input').nth(1).fill('500');
  await second.locator('.draft-note input').fill('TEST incomplete');
  await expect(dialog.locator('.offer-actions .btn-primary')).toBeDisabled(); await expect(card.locator('.offer-row')).toHaveCount(0); await expect(second.locator('.draft-note input')).toHaveValue('TEST incomplete');
  await second.locator('.draft-note input').fill(''); await first.locator('.draft-tools button').click(); await first.locator('.promo-mini input').nth(0).fill('1.5');
  await expect(dialog.locator('.offer-actions .btn-primary')).toBeDisabled();
  await first.locator('.promo-mini input').nth(0).fill('2'); await first.locator('.promo-mini input').nth(1).fill('1'); await dialog.locator('.offer-actions .btn-primary').click();
  await expect(dialog).not.toBeVisible(); await expect(card.locator('.offer-row')).toHaveCount(1);
  await expect(card.locator('.of-pu')).toContainText('฿0.013');
});
