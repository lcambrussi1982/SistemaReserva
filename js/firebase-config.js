// js/firebase-config.js
// Configuração central do Firebase.

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAAQ92Zl69CHdMyvu22nM36M6ESxJ6BDOM",
  authDomain: "reservacambrussi.firebaseapp.com",
  projectId: "reservacambrussi",
  storageBucket: "reservacambrussi.firebasestorage.app",
  messagingSenderId: "1079601388890",
  appId: "1:1079601388890:web:e2dc83f7740c8544536763",
  measurementId: "G-XGFJVQ67SM"
};

// inicializa app só uma vez (se já existir, reaproveita)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// exporta o que os outros arquivos vão usar
export { app, db, doc, collection, getDoc, setDoc };
