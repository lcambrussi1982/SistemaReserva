import { createStore } from "./sre-core-v2.js";
import { runAutoMaintenance, smartPickDevice } from "./automation.js";
import { requireAuth, renderUserbox } from "./auth.js";

const usuario = requireAuth({ role: "ADMIN" });

const store = createStore();
const $ = s => document.querySelector(s);
const grid = $("#grid");
const tbl = $("#tbl");
const tipoSel = $("#tipoSel");
const profSel = $("#profSel");
const dia = $("#dia");
const toasts = $("#toasts");

const userboxEl = document.getElementById("userbox");
if (userboxEl) renderUserbox(userboxEl);

function toast(msg, ok = true) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  if (!ok) t.style.background = "#7f1d1d";
  toasts.append(t);
  setTimeout(() => {
    t.style.opacity = 0.0;
    setTimeout(() => t.remove(), 250);
  }, 1800);
}
const unique = a => [...new Set(a)];

function fillProfessores() {
  const s = store.snapshot();
  profSel.innerHTML = s.professores.map(p => `<option value="${p.id}">${p.nome}</option>`).join("");
}
function fillTipos() {
  const s = store.snapshot();
  const tipos = unique(s.dispositivos.map(d => d.tipo));
  tipoSel.innerHTML = `<option value="">Todos</option>` + tipos.map(t => `<option value="${t}">${t}</option>`).join("");
}

function reservasDoDia() {
  const s = store.snapshot();
  const d = dia.value || new Date().toISOString().slice(0, 10);
  const aulas = s.aulas;
  const reservas = s.reservas.filter(r => r.data === d);
  return { s, d, aulas, reservas };
}

function renderGrid() {
  const { s, d, aulas, reservas } = reservasDoDia();
  const tipo = tipoSel.value || "";
  const dispositivos = s.dispositivos.filter(dev => !tipo || dev.tipo === tipo);

  const header = `
    <thead>
      <tr>
        <th>Dispositivo</th>
        ${aulas.map(a => `<th>${a.inicio}<br/>${a.fim}</th>`).join("")}
      </tr>
    </thead>
  `;
  const body = dispositivos.map(dev => {
    const cells = aulas.map(a => {
      const r = reservas.find(r => r.dispositivoId === dev.id && r.aulaId === a.id);
      if (!r) return `<td data-dev="${dev.id}" data-aula="${a.id}"></td>`;
      const prof = s.professores.find(p => p.id === r.professorId);
      return `<td class="ocupado" data-dev="${dev.id}" data-aula="${a.id}">
        <span>${prof?.nome || "—"}</span><br/>
        <small>${r.status}</small>
      </td>`;
    }).join("");
    return `<tr><th>${dev.modelo}</th>${cells}</tr>`;
  }).join("");

  grid.innerHTML = `<table class="table compact">${header}<tbody>${body}</tbody></table>`;
}

function renderTable() {
  const { s, d, aulas, reservas } = reservasDoDia();
  const rows = reservas.map(r => {
    const a = aulas.find(x => x.id === r.aulaId);
    const dev = s.dispositivos.find(x => x.id === r.dispositivoId);
    const prof = s.professores.find(x => x.id === r.professorId);
    return {
      data: d,
      inicio: a?.inicio,
      fim: a?.fim,
      dispositivo: dev?.modelo,
      professor: prof?.nome,
      status: r.status,
    };
  });

  if (!rows.length) {
    tbl.innerHTML = "<p>Nenhuma reserva neste dia.</p>";
    return;
  }

  const head = Object.keys(rows[0]);
  const thead = head.map(k => `<th>${k}</th>`).join("");
  const tbody = rows.map(r =>
    `<tr>${head.map(k => `<td>${r[k] ?? ""}</td>`).join("")}</tr>`
  ).join("");

  tbl.innerHTML = `<table class="table compact"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

function exportCSV() {
  const { s, d, aulas, reservas } = reservasDoDia();
  if (!reservas.length) {
    alert("Sem reservas neste dia.");
    return;
  }
  const rows = reservas.map(r => {
    const a = aulas.find(x => x.id === r.aulaId);
    const dev = s.dispositivos.find(x => x.id === r.dispositivoId);
    const prof = s.professores.find(x => x.id === r.professorId);
    return {
      data: d,
      inicio: a?.inicio,
      fim: a?.fim,
      dispositivo: dev?.modelo,
      professor: prof?.nome,
      status: r.status,
    };
  });

  const head = Object.keys(rows[0]);
  const csv = [head.join(","), ...rows.map(r => head.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reservas-dia.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function init() {
  runAutoMaintenance();
  dia.value = new Date().toISOString().slice(0, 10);
  fillProfessores();
  fillTipos();
  renderGrid();
  renderTable();
  const btnCSV = document.getElementById("btnCSV");
  if (btnCSV) btnCSV.onclick = exportCSV;
}
init();

dia.onchange = () => { renderGrid(); renderTable(); };
tipoSel.onchange = () => { renderGrid(); };
profSel.onchange = () => { /* nada, só usa ao reservar */ };
