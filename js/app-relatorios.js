import { createStore } from "./sre-core-v2.js";
import { requireAuth, renderUserbox } from "./auth.js";

requireAuth({ role: "ADMIN" });

const store = createStore();
const $ = s => document.querySelector(s);
const out = $("#saida");

const userboxEl = document.getElementById("userbox");
if (userboxEl) renderUserbox(userboxEl);

let lastRows = [];

function renderTable(rows) {
  if (!rows.length) {
    out.innerHTML = "<p>Nenhuma reserva no período.</p>";
    return;
  }

  const head = Object.keys(rows[0]);
  const thead = head.map(k => `<th>${k}</th>`).join("");
  const tbody = rows
    .map(r => `<tr>${head.map(k => `<td>${r[k] ?? ""}</td>`).join("")}</tr>`)
    .join("");

  out.innerHTML = `
    <table class="table">
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody}</tbody>
    </table>
  `;
}

function exportPDF() {
  if (!lastRows.length) {
    alert("Sem dados para exportar.");
    return;
  }

  const head = Object.keys(lastRows[0]);
  const hoje = new Date().toLocaleDateString("pt-BR");
  const logo = "./assets/logo-colegio.svg";

  const w = window.open("", "_blank");
  w.document.write(`
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Relatório de reservas</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        header { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
        header img { height: 60px; }
        header h1 { margin:0; font-size:18px; }
        header .sub { font-size:12px; color:#555; }
        table { border-collapse: collapse; width:100%; font-size:11px; }
        th, td { border:1px solid #ccc; padding:4px 6px; }
        th { background:#eee; }
      </style>
    </head>
    <body>
      <header>
        <img src="${logo}" alt="Logo do colégio">
        <div>
          <h1>Colégio Estadual Padre Ponciano</h1>
          <div class="sub">Relatório de reservas — gerado em ${hoje}</div>
        </div>
      </header>
      <table>
        <thead>
          <tr>${head.map(k => `<th>${k}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${lastRows.map(r =>
            `<tr>${head.map(k => `<td>${r[k] ?? ""}</td>`).join("")}</tr>`
          ).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `);
  w.document.close();
  w.focus();
  w.print();
}

document.getElementById("btn").onclick = () => {
  const de = $("#de").value || "0000-00-00";
  const ate = $("#ate").value || "9999-12-31";

  const s = store.snapshot();
  const inRange = r => r.data >= de && r.data <= ate;

  lastRows = s.reservas.filter(inRange).map(r => {
    const a = s.aulas.find(x => x.id === r.aulaId);
    const d = s.dispositivos.find(x => x.id === r.dispositivoId);
    const p = s.professores.find(x => x.id === r.professorId);
    return {
      data: r.data,
      inicio: a?.inicio,
      fim: a?.fim,
      dispositivo: d?.modelo,
      professor: p?.nome,
      status: r.status,
    };
  });

  renderTable(lastRows);
};

document.getElementById("csv").onclick = exportPDF;

document.getElementById("backup").onclick = () => {
  try {
    const data = store.exportJSON();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-sre.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert(e.message);
  }
};

document.getElementById("restore").onchange = ev => {
  const f = ev.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      store.importJSON(reader.result);
      alert("Backup restaurado com sucesso.");
      location.reload();
    } catch (e) {
      alert("Falha ao restaurar: " + e.message);
    }
  };
  reader.readAsText(f);
};
