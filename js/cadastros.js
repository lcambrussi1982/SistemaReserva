/**
 * cadastros.js
 * Mantém cadastros básicos em memória (turmas, disciplinas, etc.).
 * Posteriormente você pode persistir no Firestore reaproveitando a estrutura.
 */

const state = {
  turmas: [],
  disciplinas: [],
  professores: [],
  salas: [],
  tipos: [],
};

function handleTabs() {
  const tabLinks = document.querySelectorAll(".tab-link");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabLinks.forEach(btn => {
    btn.addEventListener("click", () => {
      const alvo = btn.dataset.tab;
      tabLinks.forEach(b => b.classList.remove("ativo"));
      tabPanes.forEach(p => p.classList.remove("ativo"));
      btn.classList.add("ativo");
      document.getElementById(alvo).classList.add("ativo");
    });
  });
}

function renderTabela(idTabela, dados, campos) {
  const tbody = document.getElementById(idTabela);
  if (!tbody) return;
  tbody.innerHTML = "";

  dados.forEach((item, idx) => {
    const tr = document.createElement("tr");
    campos.forEach(c => {
      const td = document.createElement("td");
      td.textContent = item[c] ?? "";
      tr.appendChild(td);
    });
    const tdAcoes = document.createElement("td");
    const btnDel = document.createElement("button");
    btnDel.textContent = "Excluir";
    btnDel.className = "btn perigo btn-sm";
    btnDel.addEventListener("click", () => {
      dados.splice(idx, 1);
      renderTudo();
    });
    tdAcoes.appendChild(btnDel);
    tr.appendChild(tdAcoes);
    tbody.appendChild(tr);
  });
}

function renderTudo() {
  renderTabela("lista-turmas", state.turmas, ["codigo", "nome", "turno"]);
  renderTabela("lista-disciplinas", state.disciplinas, ["codigo", "nome"]);
  renderTabela("lista-professores", state.professores, ["nome", "email", "disciplinas"]);
  renderTabela("lista-salas", state.salas, ["codigo", "nome", "capacidade"]);
  renderTabela("lista-tipos", state.tipos, ["codigo", "descricao"]);
}

document.addEventListener("DOMContentLoaded", () => {
  handleTabs();

  const formTurma = document.getElementById("form-turma");
  const formDisciplina = document.getElementById("form-disciplina");
  const formProfessor = document.getElementById("form-professor");
  const formSala = document.getElementById("form-sala");
  const formTipo = document.getElementById("form-tipo");

  if (formTurma) {
    formTurma.addEventListener("submit", (ev) => {
      ev.preventDefault();
      state.turmas.push({
        codigo: document.getElementById("turma-codigo").value,
        nome: document.getElementById("turma-nome").value,
        turno: document.getElementById("turma-turno").value,
      });
      formTurma.reset();
      renderTudo();
    });
  }

  if (formDisciplina) {
    formDisciplina.addEventListener("submit", (ev) => {
      ev.preventDefault();
      state.disciplinas.push({
        codigo: document.getElementById("disciplina-codigo").value,
        nome: document.getElementById("disciplina-nome").value,
      });
      formDisciplina.reset();
      renderTudo();
    });
  }

  if (formProfessor) {
    formProfessor.addEventListener("submit", (ev) => {
      ev.preventDefault();
      state.professores.push({
        nome: document.getElementById("prof-nome").value,
        email: document.getElementById("prof-email").value,
        disciplinas: document.getElementById("prof-disciplinas").value,
      });
      formProfessor.reset();
      renderTudo();
    });
  }

  if (formSala) {
    formSala.addEventListener("submit", (ev) => {
      ev.preventDefault();
      state.salas.push({
        codigo: document.getElementById("sala-codigo").value,
        nome: document.getElementById("sala-nome").value,
        capacidade: document.getElementById("sala-capacidade").value,
      });
      formSala.reset();
      renderTudo();
    });
  }

  if (formTipo) {
    formTipo.addEventListener("submit", (ev) => {
      ev.preventDefault();
      state.tipos.push({
        codigo: document.getElementById("tipo-codigo").value,
        descricao: document.getElementById("tipo-descricao").value,
      });
      formTipo.reset();
      renderTudo();
    });
  }

  renderTudo();
});
