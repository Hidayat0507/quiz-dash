"use client";

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDkhdt39uIV9Xlxb0NvXCEj1CZTv-1onA8",
  authDomain: "dashboard-1a6c6.firebaseapp.com", 
  projectId: "dashboard-1a6c6",
  storageBucket: "dashboard-1a6c6.firebasestorage.app",
  messagingSenderId: "148265952084",
  appId: "1:148265952084:web:afd8218afb797f52491ec1",
  measurementId: "G-K98RZLRWYZ"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };