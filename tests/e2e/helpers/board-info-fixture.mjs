import { openAdminFixture } from './admin-fixture.mjs';

export async function revealBoardSection(page, section) {
  const button = page.locator(`#board-${section} .board-section-toggle`);
  if (await button.isVisible() && await button.getAttribute('aria-expanded') === 'false') await button.click();
}

export async function openBoardInfoFixture(page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('board-info-fixture')) return;
    sessionStorage.setItem('board-info-fixture','1');
    for (const id of ['1397','9002']) sessionStorage.setItem(`pointy_test_trip_${id}`,JSON.stringify({
      tripName:'TEST ทริปใหม่', boardType:'split', participants:['Pointy'], characterIds:{Pointy:'4717'},
      heroClasses:{Pointy:'seraph'}, expenses:[], admin:{adminId:'',adminName:'',passwordHash:'TEST-preserve-secret'},
      futureField:{preserve:true}, updatedAt:1791921600000
    }));
  });
  await openAdminFixture(page,{tab:'boards',empty:true,edits:false});
  await page.getByRole('button',{name:'Detail 1397',exact:true}).click();
}
