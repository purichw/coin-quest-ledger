import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = (process.env.PROD_SMOKE_URL || 'https://coin-quest-ledger.vercel.app').replace(/\/+$/, '');
const runId = (process.env.PROD_SMOKE_RUN_ID || Date.now().toString(36)).replace(/[^a-z0-9-]/gi, '-').toLowerCase();
const tripId = `prod-smoke-${runId}`;
const outDir = path.join(process.cwd(), 'test-results', 'prod-smoke', runId);

const viewports = [
  { name: 'desktop', viewport: { width: 1366, height: 900 }, isMobile: false, hasTouch: false },
  { name: 'tablet', viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true },
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];

const routes = [
  { name: 'home', path: '/?test=1', text: /Coin Quest Ledger/ },
  { name: 'compare', path: '/?view=compare&test=1', selector: '#cmp-grid' },
  { name: 'split-entry', path: '/trip/?test=1', selector: '#be-create-form' },
  { name: 'trip-classic-skin', path: `/trip/?id=${tripId}&test=1`, text: /Smoke Board|แบ่งค่าใช้จ่าย|Log Encounter/ },
  { name: 'debt', path: '/debt/?test=1', text: /มังกรหนี้|Debt Dragon/ },
  { name: 'treasury', path: '/treasury/?test=1', text: /คลังหลวง|Personal Treasury/ },
  { name: 'character-classic-skin', path: '/character/?id=7777&test=1', text: /Smoke Tiderunner/ },
  { name: 'admin-test-gate', path: '/admin/?test=1', adminGate: true, text: /Dashboard|Super Admin Portal|Users/ },
];

const httpPaths = [
  '/',
  '/trip/',
  '/debt/',
  '/treasury/',
  '/admin/',
  '/shared/asset-urls.js',
  '/shared/cloudinary-assets.js',
  '/shared/player-layout.js',
  '/shared/player-layout.css',
  '/shared/navigation.css',
];

function fullUrl(routePath) {
  return `${BASE_URL}${routePath}`;
}

function assertOk(condition, message) {
  if (!condition) throw new Error(message);
}

async function httpSmoke() {
  for (const routePath of httpPaths) {
    const res = await fetch(fullUrl(routePath), { redirect: 'follow' });
    assertOk(res.ok, `HTTP ${res.status} for ${routePath}`);
    const contentType = res.headers.get('content-type') || '';
    if (routePath.endsWith('/')) {
      assertOk(contentType.includes('text/html'), `Expected HTML for ${routePath}, got ${contentType || 'missing content-type'}`);
    }
  }
}

function smokeState() {
  const account = {
    uid: 'prod-smoke-uid',
    username: 'prod.smoke',
    email: 'prod.smoke@coinquest.local',
    userId: '7777',
    name: 'Smoke Tiderunner',
    character: {
      id: '7777',
      name: 'Smoke Tiderunner',
      class: 'tiderunner',
      cls: 'tiderunner',
      gender: 'female',
      skin: 'tiderunner-classic',
    },
  };
  const registry = {
    7777: {
      id: '7777',
      name: 'Smoke Tiderunner',
      class: 'tiderunner',
      cls: 'tiderunner',
      gender: 'female',
      skin: 'tiderunner-classic',
      xp: 0,
      createdAt: 100,
      updatedAt: 200,
    },
  };
  const board = {
    tripName: 'Smoke Board',
    participants: ['Smoke Tiderunner'],
    characterIds: { 'Smoke Tiderunner': '7777' },
    heroClasses: { 'Smoke Tiderunner': 'tiderunner' },
    heroGenders: { 'Smoke Tiderunner': 'female' },
    heroSkins: { 'Smoke Tiderunner': 'tiderunner-classic' },
    expenses: [],
    admin: {
      ownerHash: 'prod-smoke-owner',
      adminId: 'ADM-SMOKE',
      adminName: 'Smoke Tiderunner',
      characterId: '7777',
      passwordHash: 'hash',
      urlLocked: true,
    },
    updatedAt: 200,
  };
  return { account, registry, board };
}

async function seedContext(context) {
  await context.addInitScript(({ tripId: seededTripId, state }) => {
    localStorage.setItem('pointy_auth_v1', JSON.stringify(state.account));
    localStorage.setItem('pointy_character_registry_v1', JSON.stringify(state.registry));
    sessionStorage.setItem(`pointy_test_trip_${seededTripId}`, JSON.stringify(state.board));
  }, { tripId, state: smokeState() });
}

function trackPage(page) {
  const failures = [];
  const consoleErrors = [];
  page.on('response', response => {
    const status = response.status();
    if (status < 400) return;
    const request = response.request();
    const type = request.resourceType();
    if (!['document', 'script', 'stylesheet', 'image', 'font', 'xhr', 'fetch'].includes(type)) return;
    if (response.url().endsWith('/favicon.ico')) return;
    failures.push(`${status} ${type} ${response.url()}`);
  });
  page.on('requestfailed', request => {
    const failure = request.failure()?.errorText || 'request failed';
    if (failure.includes('net::ERR_ABORTED')) return;
    failures.push(`failed ${request.resourceType()} ${request.url()} ${failure}`);
  });
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });
  return { failures, consoleErrors };
}

async function assertRoute(page, route) {
  await page.goto(fullUrl(route.path), { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  if (route.adminGate) {
    const pass = page.locator('#gate-pass');
    if (await pass.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await pass.fill('portal-pass');
      await page.getByRole('button', { name: /Set & Unlock|Unlock/i }).click();
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    }
  }
  if (route.selector) {
    await page.locator(route.selector).first().waitFor({ state: 'visible', timeout: 7_000 });
  }
  const text = `${await page.title()}\n${await page.locator('body').innerText({ timeout: 7_000 })}`;
  if (route.text) assertOk(route.text.test(text), `${route.name} did not render expected marker`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  assertOk(!overflow, `${route.name} has horizontal document overflow`);
  await assertRenderedAssets(page, route.name);
}

async function assertRenderedAssets(page, label) {
  await page.evaluate(() => document.fonts.ready);
  const broken = await page.evaluate(async () => {
    const failures = [];
    const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    await Promise.all([...document.images].filter(visible).map(async img => {
      try { await img.decode(); if (!img.naturalWidth) throw new Error('empty'); }
      catch { failures.push(img.currentSrc || img.src); }
    }));
    const backgrounds = new Set();
    document.querySelectorAll('.home-hero,.be-hero,.board-banner,.debt-hero,.arena-hero,.treasury-hero,.banner').forEach(el => {
      for (const match of getComputedStyle(el).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)) backgrounds.add(match[1]);
    });
    await Promise.all([...backgrounds].map(async src => {
      const img = new Image(); img.src = src;
      try { await img.decode(); if (!img.naturalWidth) throw new Error('empty'); } catch { failures.push(src); }
    }));
    return failures;
  });
  assertOk(!broken.length, `${label} has undecodable rendered assets: ${broken.join(', ')}`);
}

async function browserSmoke() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const allFailures = [];
  try {
    for (const device of viewports) {
      const context = await browser.newContext({
        viewport: device.viewport,
        isMobile: device.isMobile,
        hasTouch: device.hasTouch,
      });
      await seedContext(context);
      try {
        for (const route of routes) {
          const page = await context.newPage();
          const tracked = trackPage(page);
          try {
            await assertRoute(page, route);
            await page.waitForTimeout(750);
            await page.screenshot({
              path: path.join(outDir, `${device.name}-${route.name}.png`),
              fullPage: true,
            });
          } catch (error) {
            allFailures.push(`${device.name}/${route.name}: ${error.message}`);
          } finally {
            tracked.failures.forEach(failure => allFailures.push(`${device.name}/${route.name}: ${failure}`));
            tracked.consoleErrors.forEach(error => allFailures.push(`${device.name}/${route.name}: console ${error}`));
            await page.close().catch(() => {});
          }
        }
        // Exercise the actual signed-out gate separately from isolated game fixtures.
        const authContext = await browser.newContext({ viewport: device.viewport, isMobile: device.isMobile, hasTouch: device.hasTouch });
        const authPage = await authContext.newPage();
        const authTracked = trackPage(authPage);
        try {
          await authPage.goto(fullUrl('/'), { waitUntil: 'networkidle' });
          await authPage.locator('[data-first-load]').waitFor({ state: 'detached' });
          await authPage.locator('[data-login-form]').waitFor({ state: 'visible' });
          for (const mode of ['in', 'up']) {
            await authPage.locator(`[data-login-tab="${mode}"]`).click();
            await assertRenderedAssets(authPage, `auth-${mode}`);
            assertOk(await authPage.locator('.auth-entry').evaluate(el => el.scrollWidth <= el.clientWidth), `auth-${mode} overflows`);
            await authPage.screenshot({ path: path.join(outDir, `${device.name}-auth-${mode}.png`) });
          }
        } catch (error) {
          allFailures.push(`${device.name}/auth: ${error.message}`);
        } finally {
          authTracked.failures.concat(authTracked.consoleErrors).forEach(error => allFailures.push(`${device.name}/auth: ${error}`));
          await authContext.close();
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  if (allFailures.length) {
    throw new Error(`Production smoke failed:\n${allFailures.map(item => `- ${item}`).join('\n')}`);
  }
}

await httpSmoke();
await browserSmoke();
console.log(`Production smoke passed for ${BASE_URL}`);
console.log(`Screenshots: ${outDir}`);
