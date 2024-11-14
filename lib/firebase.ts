"use client";

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDkhdt39uIV9Xlxb0NvXCEj1CZTv-1onA8",
  authDomain: "dashboard-1a6c6.firebaseapp.com",
  projectId: "dashboard-1a6c6",
  storageBucket: "dashboard-1a6c6.firebasestorage.app",
  messagingSenderId: "148265952084",
  appId: "1:148265952084:web:afd8218afb797f52491ec1",
  measurementId: "G-K98RZLRWYZ"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window !== "undefined") {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };