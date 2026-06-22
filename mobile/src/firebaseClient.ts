import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBDDC1sJnITQOqyp1qiPGvB1KLuUH1B28o',
  authDomain: 'pointy-personal-toolkit.firebaseapp.com',
  projectId: 'pointy-personal-toolkit',
  storageBucket: 'pointy-personal-toolkit.firebasestorage.app',
  messagingSenderId: '901775387853',
  appId: '1:901775387853:web:030f47acc78c71a5548d84',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
