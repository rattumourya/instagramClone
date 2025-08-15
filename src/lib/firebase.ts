// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  "projectId": "focusgram",
  "appId": "1:289299533145:web:350b2c3b99c3dd4e6b5048",
  "storageBucket": "focusgram.appspot.com",
  "apiKey": "AIzaSyDJpGe0iRxYN1tDOHxUDPoX34BzhJcOXSM",
  "authDomain": "focusgram.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "289299533145"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
