// Configuração central do Firebase.
// IMPORTANTE: Preencha com os dados reais do seu projeto Firebase.
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "COLOQUE_SUA_API_KEY_AQUI",
  authDomain: "COLOQUE_SEU_AUTH_DOMAIN_AQUI",
  projectId: "reservacambrussi",
  storageBucket: "COLOQUE_SEU_BUCKET_SE_PRECISAR",
  messagingSenderId: "COLOQUE_SEU_SENDER_ID",
  appId: "COLOQUE_SEU_APP_ID"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
