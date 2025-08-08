// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "focusgram",
  "appId": "1:289299533145:web:350b2c3b99c3dd4e6b5048",
  "storageBucket": "focusgram.firebasestorage.app",
  "apiKey": "AIzaSyDJpGe0iRxYN1tDOHxUDPoX34BzhJcOXSM",
  "authDomain": "focusgram.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "289299533145"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
