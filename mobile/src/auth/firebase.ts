import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Public client configuration, shared with ../../shared/firebase-client.js.
// Never use Admin SDK credentials in this app.
const config = {
  apiKey: 'AIzaSyBDDC1sJnITQOqyp1qiPGvB1KLuUH1B28o',
  authDomain: 'pointy-personal-toolkit.firebaseapp.com',
  projectId: 'pointy-personal-toolkit',
  storageBucket: 'pointy-personal-toolkit.firebasestorage.app',
  messagingSenderId: '901775387853',
  appId: '1:901775387853:web:030f47acc78c71a5548d84',
};

// Explicit Simulator-only QA. A separate Firebase app/API key also isolates the
// persisted credential; switching Metro modes never reuses a production session.
const qaRequested = process.env.EXPO_PUBLIC_NATIVE_QA_EMULATORS === '1';
if (qaRequested && !__DEV__) throw new Error('Native emulator QA is disabled in release builds. Remove EXPO_PUBLIC_NATIVE_QA_EMULATORS.');
export const nativeQaEmulators = __DEV__ && qaRequested;
const appName = nativeQaEmulators ? 'coinquest-native-qa' : '[DEFAULT]';
const existing = getApps().find(candidate => candidate.name === appName);
const initialized = !!existing;
const app = existing || initializeApp(nativeQaEmulators ? {
  apiKey: 'coinquest-native-qa-emulator-only',
  projectId: 'demo-coin-quest',
  authDomain: 'demo-coin-quest.firebaseapp.com',
  appId: 'coinquest-native-qa',
} : config, appName);
export const auth = initialized ? getAuth(app) : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
export const db = getFirestore(app);
if (nativeQaEmulators && !initialized) {
  connectAuthEmulator(auth, 'http://127.0.0.1:19098', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 18088);
  console.info('[Coin Quest local QA] demo-coin-quest · Auth 19098 · Firestore 18088');
}
