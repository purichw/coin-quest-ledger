import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { expandBoardSection } from './helpers/coin-quest-helpers.mjs';

const heroes = ['A','B','C'].map((name,i) => ({ id:String(7101+i), name, class:'warrior', gender:'male', ownerUid:`split-audit-${name}`, trips:{} }));
async function fresh(page, realMembers = false, size = 3) {
  await page.addInitScript(heroes => {
    if (sessionStorage.getItem('split-audit-fixture')) return;
    sessionStorage.setItem('split-audit-fixture','1');
    const hero=heroes[0];
    localStorage.setItem('pointy_auth_v1',JSON.stringify({uid:hero.ownerUid,userId:hero.id,email:'audit.a@coinquest.local',username:'audit.a',name:hero.name,character:hero}));
    localStorage.setItem('pointy_character_registry_v1',JSON.stringify(Object.fromEntries(heroes.map(h=>[h.id,h]))));
    localStorage.setItem('lang','th'); localStorage.setItem('pointy_theme','tavern');
    localStorage.setItem('pointy_profile_v1',JSON.stringify({tourSeen:true,lastVisit:new Date().toISOString().slice(0,10)}));
  }, heroes);
  await page.goto('/trip/?test=1');
  await page.locator('#bc-board-name').fill('TEST Split financial audit');
  await page.locator('.be-create-button').click();
  await expect(page).toHaveURL(/id=\d{4}/);
  const url=page.url(), id=new URL(url).searchParams.get('id');
  if (realMembers) {
    for (const hero of heroes.slice(1)) {
      await page.locator('.add-hero').click();
      await page.locator('#new-hero-id').fill(hero.id);
      await page.locator('#confirm-hero-btn').click();
      await page.getByRole('button',{name:'ส่งคำเชิญ',exact:true}).click();
      await expect(page.locator('#toast')).toContainText('ส่งคำเชิญ');
      await expect.poll(()=>page.evaluate(target=>JSON.parse(localStorage.getItem('pointy_board_invites_v1')||'[]').some(invite=>invite.targetCharacterId===target),hero.id)).toBe(true);
    }
    for (const hero of heroes.slice(1)) {
      await page.evaluate(hero => localStorage.setItem('pointy_auth_v1',JSON.stringify({uid:hero.ownerUid,userId:hero.id,email:`audit.${hero.name}@coinquest.local`,username:`audit.${hero.name}`,name:hero.name,character:hero})),hero);
      await page.goto('/?test=1');
      expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pointy_auth_v1')).character.id)).toBe(hero.id);
      await page.locator('[data-profile-hub="reminders"]').click();
      await page.locator(`[data-invite-id="${id}_${hero.id}"][data-rem-action="acceptInvite"]`).click();
      await expect.poll(() => page.evaluate(id=>JSON.parse(sessionStorage.getItem('pointy_test_trip_'+id)).participants.length,id)).toBe(Number(hero.id)-7100);
    }
    await page.evaluate(hero => localStorage.setItem('pointy_auth_v1',JSON.stringify({uid:hero.ownerUid,userId:hero.id,email:'audit.a@coinquest.local',username:'audit.a',name:hero.name,character:hero})),heroes[0]);
    await page.goto(url);
  } else {
    for (const name of ['B','C','D','E'].slice(0,size-1)) {
      await page.locator('.add-hero').click();
      await page.getByRole('button',{name:'เพิ่ม Guest',exact:true}).click();
      await page.locator('#new-hero-name').fill(name);
      await page.locator('.choose-hero-btn').click();
      await page.locator('.picker-cell[data-class="warrior"][data-gender="male"]').click();
      await page.locator('#confirm-hero-btn').click();
      await page.getByRole('button',{name:'ยืนยันถาวร',exact:true}).click();
    }
  }
  await expect(page.locator('#party-count')).toHaveText(String(size));
  await page.locator('[data-entry-action="reset-draft"]').click();
  return id;
}
async function state(page,id) { return page.evaluate(id=>JSON.parse(sessionStorage.getItem('pointy_test_trip_'+id)),id); }
async function saved(page,id,n) { await expect.poll(async()=>(await state(page,id)).expenses.length).toBe(n); }
async function entry(page,{mode='equal',amount=300,payer='A',weights,payers,excluded=[]}={}) {
  await page.locator('#exp-desc').fill(`TEST ${mode}`);
  await page.locator('#exp-amount').fill(String(amount));
  await page.locator('#exp-payer').selectOption(payer);
  for (const name of excluded) await page.locator('#share-chip-row').getByRole('button',{name,exact:true}).click();
  await page.locator(`[data-split-mode="${mode}"]`).click();
  if (weights) for (const [name,value] of Object.entries(weights)) await page.locator(`.weight-value[data-name="${name}"]`).fill(String(value));
  if (payers) {
    await page.locator('[data-payer-mode="multi"]').click();
    for (const [name,value] of Object.entries(payers)) await page.locator(`.payer-value[data-name="${name}"]`).fill(String(value));
  }
}
async function expectTransfers(page,expected) {
  await expandBoardSection(page,'settle');
  const actual=await page.locator('.tribute').evaluateAll(rows=>rows.map(row=>({from:row.querySelectorAll('.tr-person')[0].querySelector(':scope > span:last-child').textContent,to:row.querySelectorAll('.tr-person')[1].querySelector(':scope > span:last-child').textContent,amount:Number(row.querySelector('.tr-amt').textContent.replace(/[^\d.]/g,''))})));
  const sort=rows=>rows.sort((a,b)=>`${a.from}:${a.to}`.localeCompare(`${b.from}:${b.to}`));
  expect(sort(actual)).toEqual(sort(expected.map(([from,to,amount])=>({from,to,amount}))));
}
async function payFirst(page) {
  await page.locator('.tribute .btn-primary').first().click();
  if (await page.locator('#promptpay-input').isVisible()) {
    await page.locator('#promptpay-input').fill('0812345678');
    await page.getByRole('button',{name:'บันทึกพร้อมเพย์',exact:true}).click();
  }
  await expect(page.locator('.qr-svg')).toBeVisible();
  await page.getByRole('button',{name:/ยืนยันชำระแล้ว/}).click();
}

for (const scenario of [
  {mode:'equal',amount:300,expected:[['B','A',100],['C','A',100]]},
  {mode:'shares',amount:600,weights:{A:1,B:2,C:3},expected:[['B','A',200],['C','A',300]]},
  {mode:'exact',amount:600,payer:'B',weights:{A:50,B:150,C:400},expected:[['A','B',50],['C','B',400]]},
  {mode:'percent',amount:800,payer:'C',weights:{A:25,B:25,C:50},expected:[['A','C',200],['B','C',200]]},
]) test(`three-person ${scenario.mode}: enter, inspect, repay every pair, reload`,async({page})=>{
  const id=await fresh(page); await entry(page,scenario);
  await page.locator('[data-entry-action="add-expense"]').click(); await saved(page,id,1);
  await expectTransfers(page,scenario.expected);
  for (let i=0;i<scenario.expected.length;i++) await payFirst(page);
  await expect(page.locator('#settle-body')).toContainText('ปาร์ตี้สมดุลแล้ว');
  await expect.poll(async()=>(await state(page,id)).settlementRecords.length).toBe(scenario.expected.length);
  const before=await state(page,id); await page.reload();
  await expect(page.locator('#settle-body')).toContainText('ปาร์ตี้สมดุลแล้ว');
  expect((await state(page,id)).settleXp).toEqual(before.settleXp);
  expect(before.characterIds.B).toBeUndefined(); expect(before.guestHeroes.B).toBe(true);
});

test('three real characters: invitations, multiple payers, partial-party settlement and linked XP',async({page},testInfo)=>{
  test.setTimeout(90000);
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const id=await fresh(page,true);
  await entry(page,{amount:900,payers:{A:600,B:300}});
  await page.locator('[data-entry-action="add-expense"]').click(); await saved(page,id,1);
  await expectTransfers(page,[['B','A',100],['C','A',200],['C','B',100]]);
  await expect(page.locator('.hero-card').filter({has:page.locator('.char-id',{hasText:'#7102'})}).locator('.status-chip')).toContainText('จ่าย / รับ');
  await payFirst(page); // C -> A 200; C still owes B 100, B still owes A 100.
  await page.locator('#settle-map-btn').click();
  await expect(page.locator('.debt-row').filter({hasText:'A'}).locator('.debt-val')).toHaveText('+฿100');
  await page.locator('#settle-list-btn').click();
  await expectTransfers(page,[['B','A',100],['C','B',100]]);
  await expect.poll(async()=>(await state(page,id)).settlementRecords.length).toBe(1);
  await page.evaluate(hero=>localStorage.setItem('pointy_auth_v1',JSON.stringify({uid:hero.ownerUid,userId:hero.id,email:'audit.b@coinquest.local',username:'audit.b',name:hero.name,character:hero})),heroes[1]);
  await page.reload();
  await expect(page.locator('.hero-card').first().locator('.hero-name')).toHaveText('B#7102');
  expect((await state(page,id)).participants).toEqual(['A','B','C']);
  await expectTransfers(page,[['B','A',100],['C','B',100]]);
  await fs.mkdir('mobile/.artifacts/split-audit-2026-10-17',{recursive:true});
  await page.evaluate(()=>{window.scrollTo(0,0); return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  await page.screenshot({path:`mobile/.artifacts/split-audit-2026-10-17/partial-${testInfo.project.name}.png`,fullPage:true});
  await payFirst(page); await payFirst(page);
  await expect.poll(async()=>(await state(page,id)).settlementRecords.length).toBe(3);
  // Simulate this account's stale profile after another client saved the board.
  // A fresh confirmed read must restore its earned XP without a new expense.
  await page.evaluate(id=>{
    const registry=JSON.parse(localStorage.getItem('pointy_character_registry_v1'));
    registry['7102'].trips[id]=0; registry['7102'].xp=0;
    localStorage.setItem('pointy_character_registry_v1',JSON.stringify(registry));
  },id);
  await page.reload();
  const xp=await page.evaluate(()=>Object.fromEntries(Object.entries(JSON.parse(localStorage.getItem('pointy_character_registry_v1'))).map(([id,h])=>[id,h.xp])));
  expect(xp).toMatchObject({'7101':255,'7102':300,'7103':360});
  await expect(page.locator('#settle-body')).toContainText('ปาร์ตี้สมดุลแล้ว');
  // Two real accounts can share a display name. Renaming B to A must retain
  // separate identities, every financial reference and the existing payments.
  await page.evaluate(()=>{
    const account=JSON.parse(localStorage.getItem('pointy_auth_v1'));
    account.character.name='A'; localStorage.setItem('pointy_auth_v1',JSON.stringify(account));
  });
  await page.reload();
  await expect(page.locator('#party-count')).toHaveText('3');
  await expect(page.locator('#settle-body')).toContainText('ปาร์ตี้สมดุลแล้ว');
  await expect.poll(async()=>Object.values((await state(page,id)).characterIds).sort()).toEqual(['7101','7102','7103']);
  expect(new Set((await state(page,id)).participants).size).toBe(3);
  expect((await state(page,id)).admin.characterId).toBe('7101');
  expect(errors).toEqual([]);
});

test('five-person item claims and unclaimed item settle all four other people',async({page})=>{
  const id=await fresh(page,false,5);
  await page.locator('#exp-desc').fill('TEST item dinner');
  await page.locator('[data-split-mode="items"]').click();
  await page.locator('.loot-name').first().fill('B/C meal'); await page.locator('.loot-amount').first().fill('300');
  for(const name of ['B','C']) await page.locator('.loot-row').first().getByRole('button',{name,exact:true}).click();
  await page.locator('[data-entry-action="add-loot"]').click();
  await page.locator('.loot-name').nth(1).fill('Everyone water'); await page.locator('.loot-amount').nth(1).fill('100');
  await page.locator('[data-entry-action="add-expense"]').click(); await saved(page,id,1);
  await expectTransfers(page,[['B','A',170],['C','A',170],['D','A',20],['E','A',20]]);
  for(let i=0;i<4;i++) await payFirst(page);
  await expect.poll(async()=>(await state(page,id)).settlementRecords.length).toBe(4);
});

test('excluded payer, one-satang debt, map, export and member history protection',async({page})=>{
  const id=await fresh(page,false,4);
  await entry(page,{amount:.01,excluded:['A']});
  await page.locator('[data-entry-action="add-expense"]').click(); await saved(page,id,1);
  await expectTransfers(page,[['B','A',.01]]);
  await expect(page.locator('.hero-card').filter({has:page.locator('.hero-name',{hasText:'B'})}).locator('.status-chip')).toContainText('−฿0.01');
  await page.locator('#settle-map-btn').click();
  await expect(page.locator('.debt-row').filter({hasText:'B'}).locator('.debt-val')).toHaveText('−฿0.01');
  // Invoke the same member action exposed by unlocked board settings. Financial
  // history protection must hold independently of which control calls it.
  await page.evaluate(()=>removeParticipant('B'));
  await expect(page.locator('#toast')).toContainText('ประวัติการเงิน');
  expect((await state(page,id)).participants).toEqual(['A','B','C','D']);
  await page.locator('#settle-list-btn').click(); await payFirst(page);
  await expect.poll(async()=>(await state(page,id)).settlementRecords.length).toBe(1);
  await page.getByRole('button',{name:/ดูปาร์ตี้/}).click();
  await expandBoardSection(page,'log');
  await page.evaluate(()=>{window.auditWorkbook=null; saveWorkbook=async wb=>{window.auditWorkbook=wb.getWorksheet('Balance the Party').getSheetValues();};});
  await page.locator('[data-action="export-excel"]').click();
  await expect.poll(()=>page.evaluate(()=>window.auditWorkbook)).not.toBeNull();
  const rows=await page.evaluate(()=>window.auditWorkbook);
  expect(rows.filter(row=>row?.[1]==='A' || row?.[1]==='B').map(row=>row.slice(1))).toEqual([ ['A',0,'Even'],['B',0,'Even'] ]);
});

test('failed board save awards no persistent XP; retry preserves other-board and dragon XP',async({page})=>{
  const id=await fresh(page);
  await expect(page.locator('#save-status')).toHaveClass('saved');
  await page.evaluate(()=>{
    const registry=JSON.parse(localStorage.getItem('pointy_character_registry_v1'));
    registry['7101']={...registry['7101'],trips:{previous:200},debtXp:100,xp:300};
    localStorage.setItem('pointy_character_registry_v1',JSON.stringify(registry));
  });
  await page.reload();
  await page.evaluate(()=>{window.originalAuditWrite=TripStore.write; TripStore.write=async()=>{throw Error('intentional audit save failure');};});
  await entry(page,{amount:600});
  await page.locator('[data-entry-action="add-expense"]').click();
  await expect(page.locator('#save-status')).toHaveClass('error');
  expect((await state(page,id)).expenses).toEqual([]);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pointy_character_registry_v1'))['7101'].xp)).toBe(300);
  await page.evaluate(()=>{TripStore.write=window.originalAuditWrite;});
  await expandBoardSection(page,'settle');
  await page.locator('#settle-map-btn').click(); await saved(page,id,1);
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pointy_character_registry_v1'))['7101'].xp)).toBe(320);
  await page.reload();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pointy_character_registry_v1'))['7101'].xp)).toBe(320);
});

test('form never claims unequal shares are equal and never silently reselects excluded people',async({page})=>{
  const id=await fresh(page);
  await entry(page,{mode:'exact',amount:100,weights:{A:10,B:20,C:70}});
  await expect(page.locator('#split-info')).not.toContainText('33.33');
  await page.locator('[data-entry-action="select-all-shares"]').click();
  await expect(page.locator('.share-cb:checked')).toHaveCount(0);
  await page.locator('[data-entry-action="add-expense"]').click();
  expect((await state(page,id)).expenses).toEqual([]);
  await page.locator('[data-entry-action="select-all-shares"]').click();
  await page.locator('[data-split-mode="equal"]').click();
  await page.locator('[data-payer-mode="multi"]').click();
  await page.locator('.payer-value[data-name="A"]').fill('99.50');
  await expect(page.locator('#pay-total')).toHaveClass(/off/);
  await page.locator('[data-entry-action="add-expense"]').click();
  expect((await state(page,id)).expenses).toEqual([]);
});

test('real repayments survive deleting and replacing a three-person bill; refunds never repeat XP',async({page},testInfo)=>{
  const id=await fresh(page);
  await entry(page,{amount:300});
  await page.locator('[data-entry-action="add-expense"]').click(); await saved(page,id,1);
  await expectTransfers(page,[['B','A',100],['C','A',100]]);
  await payFirst(page); await payFirst(page);
  await expect.poll(async()=>(await state(page,id)).settlementRecords.length).toBe(2);
  const xp=(await state(page,id)).settleXp;
  await page.reload();
  await expandBoardSection(page,'log');
  await page.locator('.qr-del').click(); await saved(page,id,0);
  await expectTransfers(page,[['A','B',100],['A','C',100]]);
  await page.locator('[data-entry-action="reset-draft"]').click();
  await entry(page,{amount:150});
  await page.locator('[data-entry-action="add-expense"]').click(); await saved(page,id,1);
  await expectTransfers(page,[['A','B',50],['A','C',50]]);
  await expect(page.locator('.board-repayment-note')).toContainText('หักเงินที่คืนแล้ว');
  await page.locator('.board-repayment-history summary').click();
  await expect(page.locator('.board-repayment-row')).toHaveCount(2);
  await fs.mkdir('mobile/.artifacts/financial-release-2026-10-17',{recursive:true});
  await page.locator('#settle-body').scrollIntoViewIfNeeded();
  await page.screenshot({path:`mobile/.artifacts/financial-release-2026-10-17/refunds-${testInfo.project.name}.png`,animations:'disabled'});
  await payFirst(page); await payFirst(page);
  await expect.poll(async()=>(await state(page,id)).settlementRecords.length).toBe(4);
  expect((await state(page,id)).settleXp).toEqual(xp);
  await page.reload();
  await expect(page.locator('#settle-body')).toContainText('ปาร์ตี้สมดุลแล้ว');
  expect((await state(page,id)).settleXp).toEqual(xp);
});

test('cash repayment needs no PromptPay account and clearing the log retains refund obligations',async({page})=>{
  const id=await fresh(page);
  await entry(page,{amount:300});
  await page.locator('[data-entry-action="add-expense"]').click(); await saved(page,id,1);
  await expectTransfers(page,[['B','A',100],['C','A',100]]);
  await page.locator('.tribute .btn-primary').first().click();
  await expect(page.locator('#promptpay-input')).toBeVisible();
  await page.getByRole('button',{name:/ยืนยันชำระแล้ว/}).click();
  await expect.poll(async()=>(await state(page,id)).settlementRecords.length).toBe(1);
  const xp=(await state(page,id)).settleXp;
  page.once('dialog',dialog=>dialog.accept());
  await page.evaluate(()=>confirmClearExpenses());
  await saved(page,id,0);
  await expectTransfers(page,[['A','B',100]]);
  expect((await state(page,id)).settleXp).toEqual(xp);
  await page.reload();
  await expectTransfers(page,[['A','B',100]]);
});
