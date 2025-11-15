import { createStore } from "./sre-core-v2.js";
import { sha256 } from "./crypto-utils.js";
import { db } from "./app-module.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const store = createStore();
const KEY_SESSION = "SRE_SESSION";

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(KEY_SESSION)) || null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(KEY_SESSION);
}

async function findUserInFirestoreByEmailAndHash(email, senhaHash) {
  if (!db) return null;
  try {
    const q = query(
      collection(db, "usuarios"),
      where("email", "==", email),
      where("senhaHash", "==", senhaHash),
      where("ativo", "==", true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    const data = docSnap.data() || {};
    return {
      id: docSnap.id,
      role: data.role || "PROF",
      name: data.nome || data.email || email,
      email: data.email || email
    };
  } catch (e) {
    console.warn("[Auth] Erro ao consultar usuarios no Firestore:", e);
    return null;
  }
}

export async function login(email, senha) {
  const hash = await sha256(senha || "");

  // 1) tenta autenticar na nuvem (Firestore)
  const cloudUser = await findUserInFirestoreByEmailAndHash(email, hash);
  if (cloudUser) {
    localStorage.setItem(KEY_SESSION, JSON.stringify(cloudUser));
    return cloudUser;
  }

  // 2) fallback: base local (seed de demo)
  const s = store.snapshot();
  const admin = (s.administradores || []).find(
    (a) => a.email === email && a.senhaHash === hash
  );
  if (admin) {
    const u = {
      id: admin.id,
      role: "ADMIN",
      name: admin.nome,
      email: admin.email
    };
    localStorage.setItem(KEY_SESSION, JSON.stringify(u));
    // flag opcional pra tela de manutenção/admin setup
    localStorage.setItem("SRE_REQUIRE_ADMIN_SETUP", "1");
    return u;
  }

  const prof = (s.professores || []).find(
    (p) => p.email === email && p.senhaHash === hash
  );
  if (prof) {
    const u = {
      id: prof.id,
      role: "PROF",
      name: prof.nome,
      email: prof.email
    };
    localStorage.setItem(KEY_SESSION, JSON.stringify(u));
    return u;
  }

  throw new Error("Credenciais inválidas.");
}

export async function signupProfessor({
  nome,
  email,
  senha,
  disciplinaIds,
  turmaIds
}) {
  const senhaHash = await sha256(senha || "");

  // 1) verifica duplicidade na nuvem
  if (db) {
    const q = query(collection(db, "usuarios"), where("email", "==", email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error("E-mail já cadastrado.");
    }
  }

  // 2) grava no Firestore
  let newId = null;
  if (db) {
    const docRef = await addDoc(collection(db, "usuarios"), {
      nome,
      email,
      senhaHash,
      role: "PROF",
      ativo: true,
      disciplinas: disciplinaIds || [],
      turmas: turmaIds || [],
      criadoEm: new Date()
    });
    newId = docRef.id;
  }

  // 3) também cria na base local pra compatibilidade com código existente
  const s = store.snapshot();
  const novoLocal = store.crud.create("professores", {
    nome,
    email,
    senhaHash,
    ativo: true,
    disciplinas: disciplinaIds || [],
    turmas: turmaIds || []
  });

  const u = {
    id: newId || novoLocal.id,
    role: "PROF",
    name: nome,
    email
  };
  localStorage.setItem(KEY_SESSION, JSON.stringify(u));
  return u;
}

export function requireAuth({ role = null, redirect = true } = {}) {
  const u = currentUser();
  if (!u) {
    if (redirect) location.href = "login.html";
    return null;
  }
  if (role && u.role !== role) {
    if (redirect) location.href = "index.html";
    return null;
  }
  return u;
}

export function renderUserbox(el) {
  const u = currentUser();
  if (!u) {
    el.innerHTML = '<a class="logout" href="login.html">Entrar</a>';
    return;
  }
  el.innerHTML = `<span>${u.name} • ${u.role}</span> <a class="logout" id="logoutBtn" href="#">Sair</a>`;
  el.querySelector("#logoutBtn").onclick = (e) => {
    e.preventDefault();
    logout();
    location.href = "login.html";
  };
}