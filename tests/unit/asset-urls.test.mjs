import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync(new URL('../../shared/asset-urls.js', import.meta.url), 'utf8');
function resolver(search = '') {
  const context = { URLSearchParams, window: {
    location: { search, hostname: 'coinquestledger.vercel.app', protocol: 'https:' },
    POINTY_CLOUDINARY_ASSETS: { 'assets/icons/loot-chest.svg': 'https://cdn.example/loot-chest.svg' },
  }, document: { readyState: 'loading', addEventListener() {} } };
  vm.runInNewContext(source, context);
  return context.window.PointyAssets;
}

test('production and production smoke resolve deployed artwork without the unavailable CDN', () => {
  for (const query of ['', '?test=1', '?assets=local']) {
    assert.equal(resolver(query).url('assets/debt-dragons/card.webp'), '/assets/debt-dragons/card.webp');
    assert.equal(resolver(query).url('/assets/rpg-portraits/tiderunner-classic-female.png'), '/assets/rpg-portraits/tiderunner-classic-female.png');
  }
});

test('explicit CDN diagnostics retain the manifest and legacy fallback routes', () => {
  const assets = resolver('?assets=cloud');
  assert.equal(assets.url('assets/icons/loot-chest.svg'), 'https://cdn.example/loot-chest.svg');
  assert.equal(assets.url('assets/debt-dragons/card.webp'), '/assets/debt-dragons/card.webp');
  assert.equal(assets.url('assets/rpg-portraits/tiderunner-classic-female.png'), '/fallback-assets/tiderunner-classic-female.png');
});

test('the retired dragon set cannot be selected through the CDN manifest', () => {
  const manifestSource = fs.readFileSync(new URL('../../shared/cloudinary-assets.js', import.meta.url), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(manifestSource, context);
  assert.deepEqual(Object.keys(context.window.POINTY_CLOUDINARY_ASSETS).filter(key => key.startsWith('assets/debt-dragons/')), []);
});
