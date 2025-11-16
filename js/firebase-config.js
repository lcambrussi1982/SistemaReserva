// js/firebase-config.js
// Config central do Firebase.

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  setDoc,
  getDocs,
  addDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAAQ92Zl69CHdMyvu22nM36M6ESxJ6BDOM",
  authDomain: "reservacambrussi.firebaseapp.com",
  projectId: "reservacambrussi",
  storageBucket: "reservacambrussi.firebasestorage.app",
  messagingSenderId: "1079601388890",
  appId: "1:1079601388890:web:e2dc83f7740c8544536763",
  measurementId: "G-XGFJVQ67SM"
};

// garante que só inicializa 1 vez
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// exporta tudo o que os outros arquivos vão usar
export {
  app,
  db,
  auth,
  doc,
  collection,
  getDoc,
  setDoc,
  getDocs,
  addDoc,
  query,
  where,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
};
