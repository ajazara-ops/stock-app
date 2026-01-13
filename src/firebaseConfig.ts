import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ [중요] Firebase 콘솔 설정
export const firebaseConfig = {
  apiKey: "AIzaSyAyifTI0XGNRl4H1HhSlqOATQe71u_dsdk",
  authDomain: "dailypick10.firebaseapp.com",
  projectId: "dailypick10-94209",
  storageBucket: "dailypick10-94209.firebasestorage.app",
  messagingSenderId: "1097267841352",
  appId: "1:1097267841352:web:74de2e9a0472340015cb7d",
  measurementId: "G-6J97GZGK7S"
};

let app, auth, db;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    app = getApp();
    auth = getAuth(app);
  }
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase 초기화 에러:", e);
}

export { app, auth, db };