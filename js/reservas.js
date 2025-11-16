// js/reservas.js - versão com quantidade por horário e lista de professores/turmas
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

// Horários fixos da manhã
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
let currentUserDoc = null;  // dados em "usuarios"

// coloca hoje como data padrão
const hoje = new Date();
dataInput.value = hoje.toISOString().substring(0, 10);

// garante login e carrega dados do professor
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  const snap = await getDoc(doc(db, "usuarios", user.uid));
  if (!snap.exists()) {
    alert("Usuário não encontrado em 'usuarios'. Fale com o administrador.");
    return;
  }
  currentUserDoc = snap.data();

  await atualizarTudo();
});

btnAtualizarGrid.addEventListener("click", atualizarTudo);
tipoDispositivoSelect.addEventListener("change", atualizarTudo);
dataInput.addEventListener("change", atualizarTudo);

// recarrega grade + lista "Minhas reservas"
async function atualizarTudo() {
  if (!currentUser) return;

  const dataStr = dataInput.value;
  const tipoDispositivo = tipoDispositivoSelect.value;
  if (!dataStr) return;

  // busca reservas do dia para o tipo selecionado
  const reservasDoDia = await buscarReservasDoDia(dataStr, tipoDispositivo);

  // busca o TOTAL de unidades desse dispositivo (chromebook/tablet)
  const dispSnap = await getDoc(doc(db, "dispositivos", tipoDispositivo));
  const totalUnidades = dispSnap.exists() ? (dispSnap.data().total || 0) : 0;

  desenharGrid(dataStr, tipoDispositivo, reservasDoDia, totalUnidades);
  desenharMinhasReservas(reservasDoDia);
}

// busca reservas do dia + tipo de dispositivo
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

// monta o grid na DIV gridHorarios
function desenharGrid(dataStr, tipoDispositivo, reservas, totalUnidades) {
  gridHorarios.innerHTML = "";

  // mapa: slotId -> array de reservas (pode ter várias no mesmo horário)
  const reservasPorSlot = {};
  for (const r of reservas) {
    if (!reservasPorSlot[r.slotId]) {
      reservasPorSlot[r.slotId] = [];
    }
    reservasPorSlot[r.slotId].push(r);
  }

  TIME_SLOTS.forEach((slot) => {
    const slotDiv = document.createElement("div");
    slotDiv.classList.add("slot-horario");

    const reservasSlot = reservasPorSlot[slot.id] || [];
    const usados = reservasSlot.length;

    const resumoProfessores = reservasSlot
      .map((r) => `${r.turmaNome} (${r.professorNome})`)
      .join("<br>");

    const cabecalho = `
      <div class="hora">${slot.label}</div>
      <div class="info">
        <strong>${usados} / ${totalUnidades || "-"} reservas</strong><br>
        ${usados > 0 ? resumoProfessores : "<em>Nenhuma reserva ainda</em>"}
      </div>
    `;

    slotDiv.innerHTML = cabecalho;

    if (totalUnidades > 0 && usados >= totalUnidades) {
      // lotado
      slotDiv.classList.add("ocupado");
    } else {
      // ainda tem unidade disponível
      slotDiv.classList.add("livre");
      slotDiv.addEventListener("click", () => {
        criarReserva(dataStr, tipoDispositivo, slot, totalUnidades);
      });
    }

    gridHorarios.appendChild(slotDiv);
  });
}

// lista "Minhas reservas do dia"
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

    const btn = document.createElement("button");
    btn.textContent = "Cancelar";
    btn.classList.add("btn-cancelar");
    btn.addEventListener("click", async () => {
      if (!confirm("Deseja cancelar esta reserva?")) return;
      await deleteDoc(doc(db, "reservas", r.id));
      await atualizarTudo();
    });

    li.appendChild(btn);
    listaMinhasReservas.appendChild(li);
  });
}

// cria uma reserva (por enquanto usando prompt, depois dá pra trocar por select)
async function criarReserva(dataStr, tipoDispositivo, slot, totalUnidades) {
  if (!currentUser || !currentUserDoc) {
    alert("Usuário não carregado. Tente novamente.");
    return;
  }

  // Confere se ainda há unidades disponíveis neste horário antes de perguntar turma/disciplina
  const q = query(
    collection(db, "reservas"),
    where("data", "==", dataStr),
    where("dispositivoId", "==", tipoDispositivo),
    where("slotId", "==", slot.id)
  );
  const snap = await getDocs(q);
  const usados = snap.size;

  if (totalUnidades > 0 && usados >= totalUnidades) {
    alert("Não há mais unidades disponíveis neste horário para este dispositivo.");
    await atualizarTudo();
    return;
  }

  const turmaId = prompt("Informe o ID da turma (ex: 1A, 2B, 3C):");
  if (!turmaId) return;

  const disciplinaId = prompt("Informe o ID da disciplina (ex: MAT, LP, BIO):");
  if (!disciplinaId) return;

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

// opcional: função exportada para uso futuro (se precisar cancelar por ID em outra tela)
export async function cancelarReserva(reservaId) {
  await deleteDoc(doc(db, "reservas", reservaId));
  await atualizarTudo();
}
