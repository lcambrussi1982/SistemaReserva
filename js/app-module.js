// js/app-module.js

// IMPORTS DO FIREBASE VIA CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

// CONFIG DO SEU PROJETO
const firebaseConfig = {
  apiKey: "AIzaSyAAQ92Zl69CHdMyvu22nM36M6ESxJ6BDOM",
  authDomain: "reservacambrussi.firebaseapp.com",
  projectId: "reservacambrussi",
  storageBucket: "reservacambrussi.firebasestorage.app",
  messagingSenderId: "1079601388890",
  appId: "1:1079601388890:web:e2dc83f7740c8544536763",
  measurementId: "G-XGFJVQ67SM"
};

// INICIALIZA FIREBASE
const app = initializeApp(firebaseConfig);

// FIRESTORE (BANCO DE DADOS)
export const db = getFirestore(app);
window.db = db; // pra poder usar em outros scripts sem importar

// ANALYTICS (opcional)
const analytics = getAnalytics(app);

// Só pra testar no console do navegador
console.log("Firebase inicializado. db pronto:", db);

// Aqui depois você pode importar outros módulos:
// import "./reservas.js";
