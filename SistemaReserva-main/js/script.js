
import { createStore } from './sre-core-v2.js';
const store = createStore();
store.useLocalStorage("SRE_DB");

const loginContainer = document.getElementById('loginContainer');
const cadastroContainer = document.getElementById('cadastroContainer');

const msg = document.getElementById('msg');
const msgCadastro = document.getElementById('msgCadastro');

const showLogin = () => {
  cadastroContainer.style.display = 'none';
  loginContainer.style.display = 'block';
  msg.textContent = '';
};
const showCadastro = () => {
  loginContainer.style.display = 'none';
  cadastroContainer.style.display = 'block';
  msgCadastro.textContent = '';
};

document.getElementById('linkCadastro').onclick = showCadastro;
document.getElementById('linkLogin').onclick = showLogin;

// LOGIN
document.getElementById('btnLogin').onclick = () => {
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();
  msg.textContent = '';

  if (!email || !senha) {
    msg.textContent = "Preencha e-mail e senha.";
    msg.className = "msg error";
    return;
  }

  const db = store.snapshot();
  const usuario = [...db.professores, ...db.administradores]
    .find(u => u.email === email && u.senha === senha);

  if (usuario) {
    msg.textContent = "Login bem-sucedido! Redirecionando...";
    msg.className = "msg success";
    setTimeout(() => {
      // Aqui você pode redirecionar para dashboard.html
      alert("Bem-vindo, " + usuario.nome + "!");
    }, 1000);
  } else {
    msg.textContent = "E-mail ou senha incorretos.";
    msg.className = "msg error";
  }
};

// CADASTRO
document.getElementById('btnCadastrar').onclick = () => {
  const nome = document.getElementById('nomeCadastro').value.trim();
  const email = document.getElementById('emailCadastro').value.trim();
  const senha = document.getElementById('senhaCadastro').value.trim();
  msgCadastro.textContent = '';

  if (!nome || !email || !senha) {
    msgCadastro.textContent = "Preencha todos os campos.";
    msgCadastro.className = "msg error";
    return;
  }

  try {
    const novo = store.crud.create("professores", {
      nome,
      email,
      senha,
      telefone: "",
      ativo: true,
      disciplinas: [],
    });
    msgCadastro.textContent = "Cadastro realizado! Agora você pode entrar.";
    msgCadastro.className = "msg success";
    setTimeout(showLogin, 1500);
  } catch (err) {
    msgCadastro.textContent = err.message;
    msgCadastro.className = "msg error";
  }
};
