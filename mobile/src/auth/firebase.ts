import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

const initialized = getApps().length > 0;
const app = initialized ? getApp() : initializeApp(config);
export const auth = initialized ? getAuth(app) : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
export const db = getFirestore(app);
