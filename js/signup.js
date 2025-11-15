import {
  app,
  db,
  collection,
  getDocs,
  setDoc,
  doc,
} from "./firebase-config.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

const auth = getAuth(app);

const form = document.getElementById("signup-form");
const msgEl = document.getElementById("signup-msg");
const turmasSelect = document.getElementById("turmas-select");
const disciplinasSelect = document.getElementById("disciplinas-select");

function getSelectedValues(selectEl) {
  return Array.from(selectEl.selectedOptions).map(o => o.value);
}

// Carregar turmas e disciplinas do Firestore
async function carregarTurmasEDisciplinas() {
  const turmasSnap = await getDocs(collection(db, "turmas"));
  turmasSnap.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.data().nome;
    turmasSelect.appendChild(opt);
  });

  const discSnap = await getDocs(collection(db, "disciplinas"));
  discSnap.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.data().nome;
    disciplinasSelect.appendChild(opt);
  });
}

carregarTurmasEDisciplinas().catch(console.error);

// Cadastro do professor
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgEl.textContent = "Criando usuário...";

  const nome  = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;
  const turmas = getSelectedValues(turmasSelect);
  const disciplinas = getSelectedValues(disciplinasSelect);

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const uid = cred.user.uid;

    await setDoc(doc(db, "usuarios", uid), {
      nome,
      email,
      role: "PROFESSOR",
      turmas,
      disciplinas,
      ativo: true,
      criadoEm: new Date().toISOString(),
    });

    msgEl.textContent = "Professor cadastrado com sucesso!";
    form.reset();
  } catch (err) {
    console.error(err);
    msgEl.textContent = "Erro ao cadastrar: " + err.message;
  }
});
