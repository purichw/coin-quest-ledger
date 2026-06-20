(function () {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function normalizeUsername(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32);
  }

  function generateCode() {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => ALPHABET[b % ALPHABET.length])
      .join('')
      .replace(/(.{4})/g, '$1-')
      .replace(/-$/, '');
  }

  function cleanCode(code) {
    return String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  async function sha256(text) {
    const data = new TextEncoder().encode(String(text || ''));
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function hash(username, code) {
    return sha256(`${normalizeUsername(username)}:${cleanCode(code)}`);
  }

  window.PointyRecovery = {
    generateCode,
    cleanCode,
    hash,
    sha256
  };
})();
