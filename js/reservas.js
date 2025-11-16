/**
 * reservas.js
 * Simula a lógica de reservas em memória.
 * Depois é só substituir os arrays por chamadas ao Firestore.
 */

const TIME_SLOTS = [
  { id: 1, label: "07:00 – 07:50" },
  { id: 2, label: "07:50 – 08:40" },
  { id: 3, label: "08:40 – 09:30" },
  { id: 4, label: "09:45 – 10:30" },
  { id: 5, label: "10:30 – 11:20" },
];

let reservas = [];

function getUsuarioAtual() {
  try {
    const raw = localStorage.getItem("usuarioAtual");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function renderGridHorarios(data, tipo, turma, disciplina, professor) {
  const grid = document.getElementById("gridHorarios");
  grid.innerHTML = "";

  TIME_SLOTS.forEach(slot => {
    const item = document.createElement("button");
    item.className = "slot";
    item.type = "button";
    item.dataset.slotId = slot.id;
    item.textContent = slot.label;

    const jaReservado = reservas.find(r =>
      r.data === data &&
      r.horarioId === slot.id &&
      r.tipo === tipo
    );

    if (jaReservado) {
      item.classList.add("ocupado");
      item.title = `Reservado por ${jaReservado.professor} (${jaReservado.turma})`;
    } else {
      item.classList.add("livre");
      item.addEventListener("click", () => {
        criarReserva(data, tipo, turma, disciplina, professor, slot.id);
      });
    }

    grid.appendChild(item);
  });
}

function criarReserva(data, tipo, turma, disciplina, professor, horarioId) {
  const user = getUsuarioAtual();
  if (!user) {
    alert("Faça login novamente.");
    window.location.href = "index.html";
    return;
  }

  const jaReservado = reservas.find(r =>
    r.data === data &&
    r.horarioId === horarioId &&
    r.tipo === tipo
  );
  if (jaReservado) {
    alert("Horário já reservado para este tipo de dispositivo.");
    return;
  }

  reservas.push({
    id: Date.now(),
    data,
    tipo,
    turma,
    disciplina,
    professor,
    horarioId,
    usuarioEmail: user.email
  });

  atualizarListaMinhasReservas();
  renderGridHorarios(data, tipo, turma, disciplina, professor);
}

function atualizarListaMinhasReservas() {
  const user = getUsuarioAtual();
  const ul = document.getElementById("listaMinhasReservas");
  ul.innerHTML = "";

  if (!user) return;

  const minhas = reservas.filter(r => r.usuarioEmail === user.email);
  if (!minhas.length) {
    ul.innerHTML = "<li class='muted'>Nenhuma reserva encontrada.</li>";
    return;
  }

  minhas.forEach(r => {
    const li = document.createElement("li");
    li.className = "reserva-item";
    const slot = TIME_SLOTS.find(s => s.id === r.horarioId);
    li.textContent = `${r.data} • ${slot ? slot.label : ""} • ${r.turma} • ${r.tipo}`;
    ul.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnAtualizarGrid");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const data = document.getElementById("data").value;
    const tipo = document.getElementById("tipoDispositivo").value;
    const turma = document.getElementById("turma").value;
    const disciplina = document.getElementById("disciplina").value;
    const professor = document.getElementById("professor").value;

    if (!data || !tipo || !turma || !disciplina || !professor) {
      alert("Preencha todos os campos antes de listar os horários.");
      return;
    }

    renderGridHorarios(data, tipo, turma, disciplina, professor);
  });

  atualizarListaMinhasReservas();
});
