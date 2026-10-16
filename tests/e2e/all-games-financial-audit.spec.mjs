import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const evidence='mobile/.artifacts/all-games-audit-2026-10-17';
const registryKey='pointy_character_registry_v1';
const debtKey='pointy_test_debt_v1';
const treasuryKey='pointy_treasury_v1';
async function boot(page,path,extra={}) {
  await page.clock.setFixedTime(new Date('2026-01-31T12:00:00+07:00'));
  await page.addInitScript(extra=>{
    if(sessionStorage.getItem('financial-audit')) return;
    sessionStorage.setItem('financial-audit','1');
    const hero={id:'7101',name:'Audit Hero',class:'warrior',gender:'male',xp:300,debtXp:0,trips:{audit:300}};
    const values={lang:'th',pointy_theme:'tavern',pointy_profile_v1:{tourSeen:true},
      pointy_character_registry_v1:{7101:hero},
      pointy_debt_settings_v1:{sound:false,animations:false,battlefx:'minimal'},
      pointy_test_debt_v1:{slayer:{...hero,characterId:'7101'},dragons:[],stats:{interest:0}},
      pointy_compare_v2:[],
      pointy_treasury_v1:{month:'2026-01',income:1000,keeper:{},categories:[{id:'food',name:{th:'อาหาร',en:'Food'},glyph:'🍜',budget:1000}],expenses:[],bills:[{id:'rent',name:{th:'ค่าห้อง',en:'Rent'},amount:500,catId:'food',dueDay:31}],history:[],stats:{monthsWon:0,logged:0,onTime:0}},...extra};
    for(const [key,value] of Object.entries(values))localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value));
  },extra);
  await page.goto(path);
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
}
const stored=(page,key)=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
async function expand(page,selector) {const el=page.locator(selector);if(await el.getAttribute('open')===null)await el.locator(':scope > summary').click();}
async function pay(page,card,amount) {
  if(await card.locator('.dc-detail').isHidden())await card.locator('.dc-summary').click();
  await card.getByRole('button',{name:'บันทึกการจ่าย',exact:true}).filter({visible:true}).click();
  await card.locator('[id^="strike-amt-"]').fill(String(amount));
  await card.locator('.dc-strike-form .btn-danger').click();
}
async function screenshot(page,name,testInfo) {
  await fs.mkdir(evidence,{recursive:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:`${evidence}/${name}-${testInfo.project.name}.png`,animations:'disabled'});
}

test.describe('Treasury calendar dates west of UTC',()=>{
  test.use({timezoneId:'America/Los_Angeles'});
  test('paid first-of-month bill never returns as an unpaid reminder',async({page})=>{
    await boot(page,'/treasury/?test=1',{pointy_auth_v1:{uid:'audit-calendar',userId:'7101',name:'Audit Hero',character:{id:'7101',name:'Audit Hero',class:'warrior',gender:'male'}},
      pointy_treasury_v1:{month:'2026-01',income:1000,categories:[],expenses:[{id:'paid',billId:'rent',amount:500,date:'2026-01-01'}],bills:[{id:'rent',name:'TEST January rent',amount:500,dueDay:31},{id:'electric',name:'TEST Unpaid electric',amount:100,dueDay:31}],history:[],stats:{}}});
    await page.locator('[data-profile-hub="reminders"]').click();
    await expect(page.locator('.rem-panel')).toBeVisible();
    await expect(page.locator('[data-rem-id="tbelectric"]')).toContainText('TEST Unpaid electric');
    await expect(page.locator('[data-rem-id="tbrent"]')).toHaveCount(0);
    await expect(page.locator('.rem-panel')).not.toContainText('TEST January rent');
  });
});

test('Debt: fresh debt, partial installment, payoff, reload and combined Character XP',async({page},testInfo)=>{
  await boot(page,'/debt/?test=1');
  await page.locator('.add-dragon').click();
  for(const [field,value] of Object.entries({name:'TEST ผ่อนครบ',balance:1000,original:1000,apr:0,payment:100,dueDay:30}))await page.locator('#new-'+field).fill(String(value));
  await page.locator('.df-actions .btn-primary').click();
  const card=page.locator('.dragon-card');
  await expect(card.locator('.dc-bal')).toHaveText('฿1,000');
  await pay(page,card,50);
  await expect(card.locator('.dc-bal')).toHaveText('฿950');
  await expect(card.locator('.dc-meta')).toContainText('เกินกำหนดชำระ');
  expect((await stored(page,registryKey))['7101'].xp).toBe(305);
  await pay(page,card,50);
  await expect(card.locator('.dc-meta')).not.toContainText('เกินกำหนดชำระ');
  expect((await stored(page,registryKey))['7101'].xp).toBe(310);
  await pay(page,card,900);
  await expect(card).toHaveClass(/slain/);
  expect((await stored(page,debtKey)).dragons[0].log).toHaveLength(3);
  expect((await stored(page,registryKey))['7101']).toMatchObject({xp:900,debtXp:600,trips:{audit:300}});
  await page.reload();
  await expect(page.locator('.dragon-card')).toHaveClass(/slain/);
  expect((await stored(page,registryKey))['7101'].xp).toBe(900);
  await expand(page,'#debt-slayer');
  await expect(page.locator('.slayer-lvl > span').last()).toHaveText('3');
  await expect(page.locator('.slayer-panel .bar-val')).toHaveText('100/700');
  await screenshot(page,'debt-paid',testInfo);
});

test('Debt: accrued interest is paid first; refresh interest never advances actual debt into the future',async({page},testInfo)=>{
  const at=new Date('2026-01-21T00:00:00+07:00').getTime();
  await boot(page,'/debt/?test=1',{[debtKey]:{slayer:{name:'Audit Hero',characterId:'7101'},dragons:[{id:'interest',name:'TEST ดอกเบี้ยสะสม',type:'card',original:1000,balance:1000,apr:36.5,payment:100,payMode:'monthly',interestMode:'simple',dueDay:30,createdAt:at,interestAccruedAt:at,log:[]}],stats:{interest:0}}});
  const card=page.locator('[data-dragon-id="interest"]');
  await expect(card.locator('.dc-bal')).toHaveText('฿1,010');
  await pay(page,card,5);
  let debt=(await stored(page,debtKey)).dragons[0];
  expect(debt.log[0]).toMatchObject({interest:5,principal:0,amount:5});expect(debt.unpaidInterest).toBeCloseTo(5,6);
  await expand(page,'#debt-manage');
  await page.getByRole('button',{name:'🔥 อัปเดตดอกเบี้ยถึงวันนี้',exact:true}).click();
  const before=await stored(page,debtKey);
  await page.getByRole('button',{name:'🔥 อัปเดตดอกเบี้ยถึงวันนี้',exact:true}).click();
  expect((await stored(page,debtKey)).dragons).toEqual(before.dragons);
  await pay(page,card,10);
  debt=(await stored(page,debtKey)).dragons[0];
  expect(debt.log[1]).toMatchObject({interest:5,principal:5,amount:10});expect(debt.balance).toBeCloseTo(995,6);
  await page.reload();await expect(card.locator('.dc-bal')).toHaveText('฿995');
  await expect(page.locator('.slayer-lvl > span').last()).toHaveText('2');
  await expand(page,'#debt-strategy');
  await page.locator('.forecast-assumptions').scrollIntoViewIfNeeded();
  await screenshot(page,'debt-forecast',testInfo);
});

test('Debt: storage failure keeps saved balance and XP, then retry records exactly once',async({page})=>{
  const at=new Date('2026-01-31T00:00:00+07:00').getTime();
  await boot(page,'/debt/?test=1',{[registryKey]:{7101:{id:'7101',name:'Audit Hero',xp:300,debtXp:0}},[debtKey]:{slayer:{name:'Audit Hero',characterId:'7101'},dragons:[{id:'retry',name:'TEST Retry',type:'other',original:100,balance:100,apr:0,payment:10,payMode:'monthly',interestMode:'compound',dueDay:31,createdAt:at,interestAccruedAt:at,log:[]}],stats:{interest:0}}});
  await page.evaluate(()=>{window.auditOriginalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='pointy_test_debt_v1')throw new DOMException('Quota','QuotaExceededError');return window.auditOriginalSet.call(this,key,value);};});
  const card=page.locator('.dragon-card');
  await pay(page,card,10);await expect(page.locator('#toast')).toContainText('ยังบันทึกไม่ได้');
  expect((await stored(page,debtKey)).dragons[0]).toMatchObject({balance:100,log:[]});
  expect((await stored(page,registryKey))['7101'].xp).toBe(300);
  await page.evaluate(()=>{Storage.prototype.setItem=window.auditOriginalSet;});
  await pay(page,card,10);
  expect((await stored(page,debtKey)).dragons[0].log).toHaveLength(1);
  expect((await stored(page,registryKey))['7101'].xp).toBe(301);
});

test('Debt: unscheduled and unpayable debts do not show a misleading debt-free date',async({page})=>{
  const at=new Date('2026-01-31T00:00:00+07:00').getTime();
  await boot(page,'/debt/?test=1',{[debtKey]:{dragons:[{id:'adhoc',name:'TEST ตามสะดวก',type:'other',original:1000,balance:1000,apr:0,payment:0,payMode:'adhoc',interestMode:'compound',createdAt:at,interestAccruedAt:at,log:[]},{id:'unpayable',name:'TEST ดอกเกินงวด',type:'card',original:1000,balance:1000,apr:24,payment:10,payMode:'monthly',interestMode:'simple',createdAt:at,interestAccruedAt:at,log:[]}],stats:{interest:0}}});
  await expand(page,'#debt-strategy');
  await expect(page.locator('.forecast-assumptions')).toContainText('ยังไม่รวมหนี้ที่ไม่ได้กำหนดงวด 1 รายการ');
  await expect(page.locator('.fc-v').first()).toHaveText('—');
  await expect(page.locator('.fc-v.gold')).toHaveText('—');
});

test('Debt: character linking never publishes XP before the debt link is saved',async({page})=>{
  const at=new Date('2026-01-31T00:00:00+07:00').getTime();
  await boot(page,'/debt/?test=1',{[debtKey]:{slayer:{name:'Unlinked',characterId:''},dragons:[{id:'paid',name:'TEST Paid',original:100,balance:0,apr:0,createdAt:at,interestAccruedAt:at,slain:true,log:[{id:'p',amount:100,ts:at}]}],stats:{interest:0}}});
  await expand(page,'#debt-slayer');
  await page.locator('.slayer-edit-controls > summary').click();
  await page.locator('#slayer-character-id').fill('7101');
  await page.evaluate(()=>{window.auditOriginalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='pointy_test_debt_v1')throw new DOMException('Quota','QuotaExceededError');return window.auditOriginalSet.call(this,key,value);};});
  await page.locator('.slayer-editor .btn-primary').click();
  await expect(page.locator('#toast')).toContainText('ยังบันทึกไม่ได้');
  expect((await stored(page,registryKey))['7101'].xp).toBe(300);
  expect((await stored(page,debtKey)).slayer.characterId).toBe('');
  await page.evaluate(()=>{Storage.prototype.setItem=window.auditOriginalSet;});
  await expand(page,'#debt-slayer');await page.locator('.slayer-edit-controls > summary').click();
  await page.locator('#slayer-character-id').fill('7101');await page.locator('.slayer-editor .btn-primary').click();
  expect((await stored(page,registryKey))['7101'].xp).toBe(810);
});

test('Treasury: satang expenses, bill payment, close and reload keep real totals and Reputation',async({page},testInfo)=>{
  await boot(page,'/treasury/?test=1');
  for(const amount of ['0.10','0.20']) {
    await page.locator('[data-action="expense"]').filter({visible:true}).first().click();
    await page.locator('#expense-amount').fill(amount);
    await page.locator('.modal .btn-primary').click();
  }
  expect((await stored(page,treasuryKey)).expenses).toHaveLength(2);
  await expand(page,'#section-bills');
  await page.locator('[data-action="pay"][data-id="rent"]').click();
  await expect(page.locator('[data-action="pay"][data-id="rent"]')).toHaveCount(0);
  const state=await stored(page,treasuryKey);
  expect(state.expenses).toHaveLength(3);expect(state.stats.onTime).toBe(1);
  await expand(page,'#section-history');
  page.once('dialog',d=>d.accept());await page.locator('[data-action="close-month"]').click();
  const closed=await stored(page,treasuryKey);
  expect(closed.history[0]).toMatchObject({spent:500.3,surplus:499.7,won:true});
  await expect(page.locator('.history-xp')).toContainText('ชื่อเสียง 590');
  page.once('dialog',d=>d.accept());await page.locator('[data-action="close-month"]').click();
  await expect(page.locator('.history-xp')).toContainText('ชื่อเสียง 590');
  expect((await stored(page,registryKey))['7101'].xp).toBe(300);
  await page.reload();await expand(page,'#section-history');
  await expect(page.locator('.history-xp')).toContainText('ชื่อเสียง 590');
  await page.locator('.history-xp').scrollIntoViewIfNeeded();await screenshot(page,'treasury-rewards',testInfo);
});

test('Compare: create a pack promotion through the form, verify price and reload',async({page},testInfo)=>{
  await boot(page,'/?view=compare&test=1');
  await page.locator('.arena-new').click();await page.locator('#new-name').fill('TEST โปรโมชั่นแพ็ค');
  await page.locator('#new-unit').selectOption('ชิ้น');await page.locator('.form-actions .btn-primary').click();
  const card=page.locator('.cmp-card');const id=await card.getAttribute('data-product-id');
  const input=(slot,field)=>page.locator(`#draft-${id}-${slot}-${field}`);
  await input(0,'merchant').fill('แพ็คซื้อ 2 แถม 1');await input(0,'price').fill('60');await input(0,'qty').fill('1');
  await input(0,'unit').selectOption('แพ็ค/กล่อง');await input(0,'pack').fill('6');
  await page.locator('.btn-chip').first().click();await input(0,'buy').fill('2');await input(0,'free').fill('1');
  await input(1,'merchant').fill('ซื้อแยก');await input(1,'price').fill('10');await input(1,'qty').fill('1');
  await page.locator('.offer-actions .btn-primary').click();
  await expect(card.locator('.offer-row').first().locator('.of-pu')).toContainText('฿6.67');
  await expect(card.locator('.cmp-save')).toContainText('33%');
  expect((await stored(page,registryKey))['7101'].xp).toBe(300);
  await page.reload();await expect(page.locator('.of-pu').first()).toContainText('฿6.67');
  await screenshot(page,'price-promotion',testInfo);
});

test('Compare: incompatible legacy units remain editable without fictitious 100 percent savings',async({page})=>{
  await boot(page,'/?view=compare&test=1',{pointy_compare_v2:[{id:'units',name:'TEST หน่วย',baseUnit:'g',offers:[{id:'a',merchant:'A',price:10,qty:1,unit:'kg'},{id:'b',merchant:'B',price:20,qty:1,unit:'kg'},{id:'bad',merchant:'C',price:100,qty:1,unit:'l'}]}]});
  const card=page.locator('.cmp-card');
  await expect(card.locator('.cmp-save')).toContainText('50%');
  await expect(card).not.toContainText('Infinity');
  await expect(card.locator('.offer-row')).toHaveCount(3);
});
