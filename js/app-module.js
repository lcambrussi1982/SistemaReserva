
  // IMPORTS DO FIREBASE VIA CDN
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-analytics.js";

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

  // BANCO DE DADOS (FIRESTORE)
  const db = getFirestore(app);
  window.db = db; // <-- outros scripts vão usar isso

  // ANALYTICS (opcional, mas tá aí se quiser usar)
  const analytics = getAnalytics(app);

  console.log("Firebase inicializado, db:", db);

