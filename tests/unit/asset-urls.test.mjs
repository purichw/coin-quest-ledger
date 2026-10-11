import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync(new URL('../../shared/asset-urls.js', import.meta.url), 'utf8');
function resolver(search = '') {
  const context = { URLSearchParams, window: {
    location: { search, hostname: 'coin-quest-ledger.vercel.app', protocol: 'https:' },
    POINTY_CLOUDINARY_ASSETS: { 'assets/debt-dragons/card.png': 'https://cdn.example/card.png' },
  }, document: { readyState: 'loading', addEventListener() {} } };
  vm.runInNewContext(source, context);
  return context.window.PointyAssets;
}

test('production and production smoke resolve deployed artwork without the unavailable CDN', () => {
  for (const query of ['', '?test=1', '?assets=local']) {
    assert.equal(resolver(query).url('assets/debt-dragons/card.png'), '/assets/debt-dragons/card.png');
    assert.equal(resolver(query).url('/assets/rpg-portraits/tiderunner-classic-female.png'), '/assets/rpg-portraits/tiderunner-classic-female.png');
  }
});

test('explicit CDN diagnostics retain the manifest and legacy fallback routes', () => {
  const assets = resolver('?assets=cloud');
  assert.equal(assets.url('assets/debt-dragons/card.png'), 'https://cdn.example/card.png');
  assert.equal(assets.url('assets/rpg-portraits/tiderunner-classic-female.png'), '/fallback-assets/tiderunner-classic-female.png');
});
