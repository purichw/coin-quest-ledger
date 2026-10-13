import { expect } from '@playwright/test';

export async function treasuryFixture(page) {
  await page.clock.setFixedTime(new Date('2026-10-13T05:00:00Z'));
  await page.addInitScript(() => {
    if (sessionStorage.getItem('treasury-design-fixture')) return;
    sessionStorage.setItem('treasury-design-fixture','1');
    localStorage.setItem('lang','th');
    localStorage.setItem('pointy_theme','tavern');
    localStorage.setItem('pointy_profile_v1',JSON.stringify({tourSeen:true}));
    localStorage.setItem('pointy_treasury_v1',JSON.stringify({
      month:'2026-10',income:45000,keeper:{},
      categories:[['home','บ้าน & ที่พัก','Home & bills','🏠',16000],['food','อาหาร & เครื่องดื่ม','Food & drink','🍜',9000],['transport','การเดินทาง','Transport','🛵',3000],['fun','บันเทิง','Entertainment','🎮',4000],['shop','ช้อปปิ้ง','Shopping','🛍️',3500],['health','สุขภาพ','Health','💊',2500]].map(([id,th,en,glyph,budget])=>({id,name:{th,en},glyph,budget,monster:{th:'สัตว์ร้าย',en:'Monster'}})),
      expenses:[{id:'e1',catId:'home',billId:'rent',amount:12000,note:'ค่าห้อง',date:'2026-10-10'}, {id:'e2',catId:'food',amount:1540,note:'ซื้อของเข้าบ้าน',date:'2026-10-10'}, {id:'e3',catId:'food',amount:320,note:'อาหารกลางวัน',date:'2026-10-12'}, {id:'e4',catId:'transport',amount:500,note:'ค่าเดินทาง',date:'2026-10-10'}],
      bills:[{id:'rent',name:{th:'ค่าห้อง',en:'Rent'},amount:12000,catId:'home',dueDay:10,glyph:'🏠'},{id:'internet',name:{th:'อินเทอร์เน็ต',en:'Internet'},amount:899,catId:'home',dueDay:22,glyph:'📶'}],
      history:[{month:'2026-09',income:45000,spent:41000,surplus:4000,won:true,expenses:[{id:'old',catId:'food',note:'เดือนกันยายน',amount:41000,date:'2026-09-30'}]},{month:'2026-08',income:45000,spent:46000,surplus:-1000,won:false}],
      stats:{monthsWon:1,logged:4,onTime:1}
    }));
  });
  await page.goto('/treasury/?test=1');
  await expect(page.locator('[data-first-load]')).toHaveCount(0);
  await expect(page.locator('h1')).toContainText('คลังหลวง');
  await page.evaluate(()=>document.fonts.ready);
}
