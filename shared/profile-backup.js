(function () {
  const globals = ['lang', 'pointy_theme', 'coin_quest_ui_v1'];
  const bases = ['pointy_debt_v5', 'pointy_treasury_v1', 'pointy_compare_v2', 'pointy_profile_v1'];
  function allowedKeys() { return [...globals, ...bases.map(key => window.PointyScope?.key?.(key) || key)]; }
  function validateBackup(data) {
    if (![1, 2].includes(data?.__coin_quest_backup) || !data.keys || typeof data.keys !== 'object' || Array.isArray(data.keys)) throw new Error('Invalid backup file');
    const current = window.PointyScope?.readAuth?.();
    const legacyOwner = data.keys.pointy_auth_v1 ? JSON.parse(data.keys.pointy_auth_v1)?.uid : '';
    if ((data.uid || legacyOwner) && (data.uid || legacyOwner) !== current?.uid) throw new Error('ใช้ไฟล์ของบัญชีนี้เท่านั้น / Backup belongs to another account');
    const allowed = allowedKeys(); const out = {};
    for (const [key, text] of Object.entries(data.keys)) {
      if (typeof text !== 'string') throw new Error('Invalid backup value');
      // Older exports included identity/session keys. Never restore them or another account's data.
      if (!allowed.includes(key)) continue;
      if (!['lang', 'pointy_theme'].includes(key)) {
        const value = JSON.parse(text);
        if (key.startsWith('pointy_debt_v5')) PointyLogic.validateModuleBackupValue('debt', value);
        if (key.startsWith('pointy_treasury_v1')) PointyLogic.validateModuleBackupValue('treasury', value);
        if (key.startsWith('pointy_compare_v2')) PointyLogic.validateModuleBackupValue('comparisons', value);
      }
      out[key] = text;
    }
    if (!Object.keys(out).length) throw new Error('ไม่มีข้อมูลที่กู้คืนได้สำหรับบัญชีนี้ / No compatible account data');
    return out;
  }
  function ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function collect() {
    const out = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (allowedKeys().includes(key)) out[key] = localStorage.getItem(key);
    }
    return out;
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ __coin_quest_backup: 2, uid: window.PointyScope?.readAuth?.()?.uid || '', at: Date.now(), keys: collect() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'coin-quest-backup-' + ymd(new Date()) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function importData(file, options = {}) {
    const reader = new FileReader();
    const onMessage = typeof options.onMessage === 'function' ? options.onMessage : () => {};
    if (!file || file.size > 2 * 1024 * 1024 || !/\.json$/i.test(file.name)) { onMessage('ใช้ไฟล์ JSON ไม่เกิน 2 MB / Choose JSON up to 2 MB'); return; }
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const keys = validateBackup(data);
        if (!confirm(options.confirmMessage || 'Restore backup?')) return;
        Object.keys(keys).forEach(key => localStorage.setItem(key, keys[key]));
        onMessage(options.restoredMessage || 'Restored. Reloading');
        setTimeout(() => location.reload(), 700);
      } catch (error) {
        onMessage(error.message || options.badMessage || 'Invalid backup file');
      }
    };
    reader.readAsText(file);
  }

  window.PointyProfileBackup = {
    collect,
    exportData,
    importData,
    validateBackup
  };
})();
