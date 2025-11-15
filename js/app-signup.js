import { createStore } from "./sre-core-v2.js";
import { signupProfessor, currentUser } from "./auth.js";

const store = createStore();
const u = currentUser();
if (u) {
  // Já logado? Poderia redirecionar, mas por enquanto apenas permite que ele veja a tela.
}

// popular selects
const s = store.snapshot();
const sDisc = document.getElementById("sDisc");
s.disciplinas.forEach(d => {
  const o = document.createElement("option");
  o.value = d.id;
  o.textContent = d.nome;
  sDisc.append(o);
});
const sTur = document.getElementById("sTurmas");
s.turmas.forEach(t => {
  const o = document.createElement("option");
  o.value = t.id;
  o.textContent = t.nome;
  sTur.append(o);
});

document.getElementById("btnSign").onclick = async () => {
  const nome = document.getElementById("sNome").value.trim();
  const email = document.getElementById("sEmail").value.trim();
  const senha = document.getElementById("sSenha").value.trim();
  const discSel = document.getElementById("sDisc").value;
  const turmSel = document.getElementById("sTurmas").value;
  const msg = document.getElementById("sMsg");
  msg.textContent = "";

  if (!nome || !email || !senha) {
    msg.textContent = "Preencha nome, e-mail e senha.";
    return;
  }
  if (!email.toLowerCase().endsWith("@escola.pr.gov.br")) {
    msg.textContent = "O e-mail deve ser @escola.pr.gov.br";
    return;
  }
  if (!discSel || !turmSel) {
    msg.textContent = "Selecione uma disciplina e uma turma.";
    return;
  }

  try {
    await signupProfessor({
      nome,
      email,
      senha,
      disciplinaIds: [discSel],
      turmaIds: [turmSel],
    });
    msg.style.color = "var(--ok)";
    msg.textContent = "Cadastro realizado! Agora você pode fechar esta aba e voltar ao login.";
  } catch (e) {
    msg.textContent = e.message;
  }
};
