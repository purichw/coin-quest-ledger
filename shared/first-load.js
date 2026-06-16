(function () {
  const params = new URLSearchParams(window.location.search || '');
  const overlay = document.querySelector('[data-first-load]');
  if (!overlay) return;

  if (params.get('test') === '1') {
    overlay.remove();
    return;
  }

  const started = Date.now();
  const minMs = 2200;
  const maxMs = 3100;
  let hidden = false;

  function hide() {
    if (hidden) return;
    hidden = true;
    overlay.classList.add('is-hidden');
    window.setTimeout(() => overlay.remove(), 420);
  }

  function hideAfterMinimum() {
    const wait = Math.max(0, minMs - (Date.now() - started));
    window.setTimeout(hide, wait);
  }

  function waitForImages() {
    const urls = Array.from(document.images)
      .map(img => img.currentSrc || img.src)
      .filter(src => src && !src.startsWith('data:'))
      .slice(0, 8);
    if (!urls.length) {
      hideAfterMinimum();
      return;
    }
    Promise.allSettled(urls.map(src => new Promise(resolve => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = src;
    }))).then(hideAfterMinimum);
  }

  if (document.readyState === 'complete') waitForImages();
  else window.addEventListener('load', waitForImages, { once: true });
  window.setTimeout(hide, maxMs);
})();
