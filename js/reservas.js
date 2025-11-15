import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const horarios = [
  "07:40",
  "08:30",
  "09:20",
  "10:10",
  "11:00",
  "13:30",
  "14:20",
  "15:10",
  "16:00"
];

const inputData = document.getElementById("data");
const selectTipo = document.getElementById("tipoDispositivo");
const btnAtualizar = document.getElementById("btnAtualizarGrid");
const divGrid = document.getElementById("gridHorarios");
const ulMinhas = document.getElementById("listaMinhasReservas");

function getUsuarioAtual() {
  try {
    const raw = localStorage.getItem("usuarioAtual");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function hojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

inputData.value = hojeISO();

btnAtualizar.addEventListener("click", carregarGrid);
window.addEventListener("load", () => {
  carregarGrid();
});

async function buscarTotaisDispositivos() {
  const snap = await getDocs(collection(db, "dispositivos"));
  const mapa = {};
  snap.forEach((doc) => {
    const data = doc.data();
    const tipo = data.tipo || doc.id;
    mapa[tipo] = Number(data.total || 0);
  });
  return mapa;
}

async function carregarGrid() {
  const data = inputData.value;
  const tipo = selectTipo.value;
  if (!data || !tipo) return;

  divGrid.innerHTML = "<p>Carregando...</p>";
  ulMinhas.innerHTML = "";

  try {
    const totais = await buscarTotaisDispositivos();
    const totalTipo = totais[tipo] || 0;

    const q = query(
      collection(db, "reservas"),
      where("data", "==", data),
      where("tipo", "==", tipo)
    );
    const snap = await getDocs(q);

    const ocupacaoPorHorario = {};
    const usuario = getUsuarioAtual();

    snap.forEach((doc) => {
      const r = doc.data();
      const h = r.horario;
      ocupacaoPorHorario[h] = (ocupacaoPorHorario[h] || 0) + 1;

      if (usuario && r.usuarioEmail === usuario.email) {
        const li = document.createElement("li");
        li.textContent = `${r.data} • ${r.horario} • ${r.tipo}`;
        ulMinhas.appendChild(li);
      }
    });

    divGrid.innerHTML = "";

    horarios.forEach((hora) => {
      const usados = ocupacaoPorHorario[hora] || 0;
      const disponiveis = Math.max(totalTipo - usados, 0);
      const div = document.createElement("button");
      div.className = "horario";

      if (disponiveis > 0) {
        div.classList.add("disponivel");
        div.textContent = hora;
        const small = document.createElement("small");
        small.textContent = `${disponiveis} disponíveis`;
        div.appendChild(small);

        div.addEventListener("click", () => reservarHorario(data, tipo, hora));
      } else {
        div.classList.add("lotado");
        div.textContent = hora;
        const small = document.createElement("small");
        small.textContent = "Lotado";
        div.appendChild(small);
      }

      divGrid.appendChild(div);
    });

    if (!ulMinhas.children.length) {
      const li = document.createElement("li");
      li.textContent = "Nenhuma reserva sua para este dia.";
      ulMinhas.appendChild(li);
    }
  } catch (e) {
    console.error(e);
    divGrid.innerHTML = "<p>Erro ao carregar grid. Veja o console.</p>";
  }
}

async function reservarHorario(data, tipo, horario) {
  const usuario = getUsuarioAtual();
  if (!usuario) {
    alert("Faça login antes de reservar.");
    window.location.href = "login.html";
    return;
  }

  try {
    await addDoc(collection(db, "reservas"), {
      data,
      tipo,
      horario,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email,
      criadoEm: new Date().toISOString()
    });

    await carregarGrid();
  } catch (e) {
    console.error(e);
    alert("Erro ao reservar. Veja o console.");
  }
}
