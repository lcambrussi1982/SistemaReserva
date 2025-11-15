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

// Config do seu projeto
const firebaseConfig = {
  apiKey: "AIzaSyAAQ92Zl69CHdMyvu22nM36M6ESxJ6BDOM",
  authDomain: "reservacambrussi.firebaseapp.com",
  projectId: "reservacambrussi",
  storageBucket: "reservacambrussi.firebasestorage.app",
  messagingSenderId: "1079601388890",
  appId: "1:1079601388890:web:e2dc83f7740c8544536763",
  measurementId: "G-XGFJVQ67SM"
};

// inicializa app só uma vez
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// exporta TUDO que os outros arquivos precisam
export { app, db, doc, collection, getDoc, setDoc };
