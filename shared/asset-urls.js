(function () {
  const params = new URLSearchParams(window.location.search || '');
  const host = window.location.hostname || '';
  const isPrivateHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)$/.test(host)
    || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)
    || host.endsWith('.local');
  const forceLocal = params.get('assets') === 'local'
    || (params.get('test') === '1' && (window.location.protocol === 'file:' || isPrivateHost));
  const manifest = window.POINTY_CLOUDINARY_ASSETS || {};

  function normalize(path) {
    return String(path || '').replace(/^\/+/, '');
  }

  function local(path) {
    return '/' + normalize(path);
  }

  function url(path) {
    const key = normalize(path);
    if (!key) return '';
    return forceLocal ? local(key) : (manifest[key] || local(key));
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
