(function () {
  const params = new URLSearchParams(window.location.search || '');
  // Deploy the same versioned art used by native. The legacy CDN currently has
  // missing objects; keep it an explicit QA option rather than a runtime dependency.
  const forceLocal = params.get('assets') !== 'cloud';
  const manifest = window.POINTY_CLOUDINARY_ASSETS || {};
  const productionFallbacks = {
    'assets/rpg-portraits/tiderunner-classic-female.png': '/fallback-assets/tiderunner-classic-female.png',
    'assets/rpg-portraits/tiderunner-classic-male.png': '/fallback-assets/tiderunner-classic-male.png',
  };

  function normalize(path) {
    return String(path || '').replace(/^\/+/, '');
  }

  function local(path) {
    return '/' + normalize(path);
  }

  function url(path) {
    const key = normalize(path);
    if (!key) return '';
    return forceLocal ? local(key) : (manifest[key] || productionFallbacks[key] || local(key));
  }

  function apply(root) {
    (root || document).querySelectorAll('[data-asset-src]').forEach(el => {
      const next = url(el.getAttribute('data-asset-src'));
      if (next && el.getAttribute('src') !== next) el.setAttribute('src', next);
    });
  }

  window.PointyAssets = { url, local, apply };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => apply(document), { once: true });
  } else {
    apply(document);
  }
})();
