import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const tbody = document.querySelector("#tabelaDispositivos tbody");

function getUsuarioAtual() {
  try {
    const raw = localStorage.getItem("usuarioAtual");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function carregarDispositivos() {
  tbody.innerHTML = "<tr><td colspan='3'>Carregando...</td></tr>";

  try {
    const snap = await getDocs(collection(db, "dispositivos"));
    const usuario = getUsuarioAtual();
    const ehAdmin = usuario && usuario.role === "ADMIN";

    tbody.innerHTML = "";

    snap.forEach((d) => {
      const data = d.data();
      const tr = document.createElement("tr");

      const tdTipo = document.createElement("td");
      tdTipo.textContent = data.tipo || d.id;

      const tdTotal = document.createElement("td");
      tdTotal.textContent = data.total;

      const tdAcoes = document.createElement("td");
      if (ehAdmin) {
        const btn = document.createElement("button");
        btn.textContent = "Alterar total";
        btn.addEventListener("click", async () => {
          const novo = prompt("Novo total para " + (data.tipo || d.id), data.total);
          if (novo === null) return;
          const valor = Number(novo);
          if (Number.isNaN(valor) || valor < 0) {
            alert("Informe um número válido.");
            return;
          }
          try {
            await updateDoc(doc(db, "dispositivos", d.id), { total: valor });
            carregarDispositivos();
          } catch (e) {
            console.error(e);
            alert("Erro ao atualizar. Veja o console.");
          }
        });
        tdAcoes.appendChild(btn);
      } else {
        tdAcoes.textContent = "Somente admin pode editar.";
      }

      tr.appendChild(tdTipo);
      tr.appendChild(tdTotal);
      tr.appendChild(tdAcoes);
      tbody.appendChild(tr);
    });

    if (!tbody.children.length) {
      tbody.innerHTML = "<tr><td colspan='3'>Nenhum dispositivo cadastrado.</td></tr>";
    }
  } catch (e) {
    console.error(e);
    tbody.innerHTML = "<tr><td colspan='3'>Erro ao carregar dispositivos. Veja o console.</td></tr>";
  }
}

window.addEventListener("load", carregarDispositivos);
