(function () {
  function ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function collect() {
    const out = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (/pointy|coin_quest|lang/i.test(key)) out[key] = localStorage.getItem(key);
    }
    return out;
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ __coin_quest_backup: 1, at: Date.now(), keys: collect() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'coin-quest-backup-' + ymd(new Date()) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function importData(file, options = {}) {
    const reader = new FileReader();
    const onMessage = typeof options.onMessage === 'function' ? options.onMessage : () => {};
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const keys = data?.keys;
        if (!keys || typeof keys !== 'object' || !Object.keys(keys).some(k => /pointy|coin_quest/i.test(k))) throw new Error('bad backup');
        if (!confirm(options.confirmMessage || 'Restore backup?')) return;
        Object.keys(keys).forEach(key => localStorage.setItem(key, keys[key]));
        onMessage(options.restoredMessage || 'Restored. Reloading');
        setTimeout(() => location.reload(), 700);
      } catch (_) {
        onMessage(options.badMessage || 'Invalid backup file');
      }
    };
    reader.readAsText(file);
  }

  window.PointyProfileBackup = {
    collect,
    exportData,
    importData
  };
})();
