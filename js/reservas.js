// js/reservas.js
import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  deleteDoc,
} from "./firebase-config.js";

const dataInput = document.getElementById("data");
const tipoDispositivoSelect = document.getElementById("tipoDispositivo");
const btnAtualizarGrid = document.getElementById("btnAtualizarGrid");
const gridHorarios = document.getElementById("gridHorarios");
const listaMinhasReservas = document.getElementById("listaMinhasReservas");

// HORÁRIOS FIXOS (Ensino Médio manhã)
const TIME_SLOTS = [
  { id: 1, label: "07:00 – 07:50", inicio: "07:00", fim: "07:50" },
  { id: 2, label: "07:50 – 08:40", inicio: "07:50", fim: "08:40" },
  { id: 3, label: "08:40 – 09:30", inicio: "08:40", fim: "09:30" },
  // Intervalo 09:30 – 09:45
  { id: 4, label: "09:45 – 10:30", inicio: "09:45", fim: "10:30" },
  { id: 5, label: "10:30 – 11:20", inicio: "10:30", fim: "11:20" },
  { id: 6, label: "11:20 – 12:00", inicio: "11:20", fim: "12:00" },
];

let currentUser = null;     // usuário do Auth
let currentUserDoc = null;  // dados de "usuarios"

// 1) Coloca hoje como data padrão
const hoje = new Date();
dataInput.value = hoje.toISOString().substring(0, 10);

// 2) Garante que está logado e puxa dados do professor
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  // pega dados extras do Firestore (nome, etc.)
  const snap = await getDoc(doc(db, "usuarios", user.uid));
  if (!snap.exists()) {
    alert("Usuário não encontrado na coleção 'usuarios'. Fale com o administrador.");
    return;
  }
  currentUserDoc = snap.data();

  // assim que logar, carrega a grade do dia atual
  await atualizarTudo();
});

btnAtualizarGrid.addEventListener("click", atualizarTudo);
tipoDispositivoSelect.addEventListener("change", atualizarTudo);
dataInput.addEventListener("change", atualizarTudo);

// 3) Função principal: recarrega grade + lista "Minhas reservas"
async function atualizarTudo() {
  if (!currentUser) return;

  const dataStr = dataInput.value;
  const tipoDispositivo = tipoDispositivoSelect.value;

  if (!dataStr) return;

  const reservasDoDia = await buscarReservasDoDia(dataStr, tipoDispositivo);

  desenharGrid(dataStr, tipoDispositivo, reservasDoDia);
  desenharMinhasReservas(reservasDoDia);
}

// 4) Busca reservas do dia no Firestore
async function buscarReservasDoDia(dataStr, tipoDispositivo) {
  const q = query(
    collection(db, "reservas"),
    where("data", "==", dataStr),
    where("dispositivoId", "==", tipoDispositivo)
  );

  const snap = await getDocs(q);

  const reservas = [];
  snap.forEach((docSnap) => {
    reservas.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  return reservas;
}

// 5) Monta a grade de horários no DIV #gridHorarios
function desenharGrid(dataStr, tipoDispositivo, reservas) {
  gridHorarios.innerHTML = "";

  // cria um mapa: chave = slotId -> reserva
  const reservasMap = {};
  for (const r of reservas) {
    // se no futuro tiver mais de uma reserva por slot (quantidade), dá pra virar array
    reservasMap[r.slotId] = r;
  }

  TIME_SLOTS.forEach((slot) => {
    const slotDiv = document.createElement("div");
    slotDiv.classList.add("slot-horario");

    const reserva = reservasMap[slot.id];

    // 🔴 AQUI ENTRA A LÓGICA QUE VOCÊ PERGUNTOU:
    if (reserva) {
      // ocupado
      slotDiv.classList.add("ocupado");
      slotDiv.innerHTML = `
        <div class="hora">${slot.label}</div>
        <div class="info">
          <strong>${reserva.turmaNome} - ${reserva.disciplinaNome}</strong><br>
          Prof.: ${reserva.professorNome}
        </div>
      `;

      // se a reserva é deste professor, permite cancelar
      if (reserva.professorId === currentUser.uid) {
        const btn = document.createElement("button");
        btn.textContent = "Cancelar";
        btn.classList.add("btn-cancelar");
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const confirma = confirm("Cancelar esta reserva?");
          if (!confirma) return;

          await deleteDoc(doc(db, "reservas", reserva.id));
          await atualizarTudo();
        });
        slotDiv.appendChild(btn);
      }
    } else {
      // livre
      slotDiv.classList.add("livre");
      slotDiv.innerHTML = `
        <div class="hora">${slot.label}</div>
        <div class="info">
          <em>Disponível</em>
        </div>
      `;

      // clique para reservar
      slotDiv.addEventListener("click", () => {
        criarReserva(dataStr, tipoDispositivo, slot);
      });
    }

    gridHorarios.appendChild(slotDiv);
  });
}

// 6) Lista "Minhas reservas do dia"
function desenharMinhasReservas(reservas) {
  listaMinhasReservas.innerHTML = "";

  const minhas = reservas.filter((r) => r.professorId === currentUser.uid);

  if (minhas.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Você não possui reservas neste dia.";
    listaMinhasReservas.appendChild(li);
    return;
  }

  minhas.sort((a, b) => a.slotId - b.slotId);

  minhas.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = `${r.slotLabel} - ${r.turmaNome} (${r.disciplinaNome}) - ${r.dispositivoId}`;
    listaMinhasReservas.appendChild(li);
  });
}

// 7) Criação da reserva (pede turma e disciplina por prompt simples)
// Depois você pode trocar por selects bonitos.
async function criarReserva(dataStr, tipoDispositivo, slot) {
  if (!currentUser || !currentUserDoc) {
    alert("Usuário não carregado. Tente novamente.");
    return;
  }

  // Aqui, para simplificar, vamos pedir os códigos por prompt:
  // Exemplo: 1A, 2B, 3C... / MAT, LP, BIO...
  const turmaId = prompt("Informe o ID da turma (ex: 1A, 2B, 3C):");
  if (!turmaId) return;

  const disciplinaId = prompt("Informe o ID da disciplina (ex: MAT, LP, BIO):");
  if (!disciplinaId) return;

  // Buscar nomes no Firestore
  const turmaSnap = await getDoc(doc(db, "turmas", turmaId));
  const discSnap = await getDoc(doc(db, "disciplinas", disciplinaId));

  if (!turmaSnap.exists()) {
    alert(`Turma ${turmaId} não encontrada.`);
    return;
  }
  if (!discSnap.exists()) {
    alert(`Disciplina ${disciplinaId} não encontrada.`);
    return;
  }

  const turmaNome = turmaSnap.data().nome;
  const disciplinaNome = discSnap.data().nome;

  await addDoc(collection(db, "reservas"), {
    data: dataStr,
    diaSemana: new Date(dataStr).getDay(),
    slotId: slot.id,
    slotLabel: slot.label,
    dispositivoId: tipoDispositivo,

    turmaId,
    turmaNome,
    disciplinaId,
    disciplinaNome,

    professorId: currentUser.uid,
    professorNome: currentUserDoc.nome || currentUser.email,

    createdAt: new Date().toISOString(),
  });

  await atualizarTudo();
}
