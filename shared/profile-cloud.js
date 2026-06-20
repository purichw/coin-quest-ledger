(function () {
  function db() {
    return window.PointyFirebase?.firestore?.() || null;
  }

  function auth() {
    return window.PointyFirebase?.auth?.() || null;
  }

  function now() {
    return window.PointyFirebase?.serverTimestamp?.() || Date.now();
  }

  function enabled({ testMode = false } = {}) {
    return !testMode && !!auth() && !!db();
  }

  window.PointyProfileCloud = {
    db,
    auth,
    now,
    enabled
  };
})();
