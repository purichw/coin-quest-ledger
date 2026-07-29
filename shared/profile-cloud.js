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

  function freshGet(refOrQuery) {
    return window.PointyFirebase?.freshGet
      ? window.PointyFirebase.freshGet(refOrQuery)
      : refOrQuery.get({ source: 'server' });
  }

  function enabled({ testMode = false } = {}) {
    return !testMode && !!auth() && !!db();
  }

  window.PointyProfileCloud = {
    db,
    auth,
    now,
    freshGet,
    enabled
  };
})();
