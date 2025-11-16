/**
 * dispositivos.js
 * Lista de dispositivos em memória, para controle visual.
 * Depois é só trocar o array por dados vindos do Firestore.
 */

const dispositivos = [
  { id: "CARRINHO-01", tipo: "CHROMEBOOK", situacao: "DISPONÍVEL", obs: "" },
  { id: "CARRINHO-02", tipo: "CHROMEBOOK", situacao: "EM USO", obs: "2º B - Manhã" },
  { id: "LAB-INFO", tipo: "LABINFO", situacao: "DISPONÍVEL", obs: "" },
];

function renderDispositivos() {
  const tbody = document.getElementById("tabelaDispositivos");
  if (!tbody) return;
  tbody.innerHTML = "";

  dispositivos.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.id}</td>
      <td>${d.tipo}</td>
      <td>${d.situacao}</td>
      <td>${d.obs || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", renderDispositivos);
