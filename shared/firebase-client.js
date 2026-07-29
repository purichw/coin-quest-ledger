(function () {
  const CONFIG = {
    apiKey: "AIzaSyBDDC1sJnITQOqyp1qiPGvB1KLuUH1B28o",
    authDomain: "pointy-personal-toolkit.firebaseapp.com",
    projectId: "pointy-personal-toolkit",
    storageBucket: "pointy-personal-toolkit.firebasestorage.app",
    messagingSenderId: "901775387853",
    appId: "1:901775387853:web:030f47acc78c71a5548d84"
  };

  function init() {
    if (!window.firebase) return null;
    if (!firebase.apps.length) firebase.initializeApp(CONFIG);
    return firebase;
  }

  function auth() {
    const app = init();
    return app && app.auth ? app.auth() : null;
  }

  function firestore() {
    const app = init();
    return app && app.firestore ? app.firestore() : null;
  }

  function serverTimestamp() {
    const app = init();
    return app?.firestore?.FieldValue?.serverTimestamp
      ? app.firestore.FieldValue.serverTimestamp()
      : Date.now();
  }

  async function freshGet(refOrQuery) {
    if (!refOrQuery || typeof refOrQuery.get !== 'function') {
      throw new Error('Firestore reference is not readable.');
    }
    return refOrQuery.get({ source: 'server' });
  }

  window.PointyFirebase = { config: CONFIG, init, auth, firestore, serverTimestamp, freshGet };
})();
