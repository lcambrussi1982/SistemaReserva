import { createStore } from "./sre-core-v2.js";
const store=createStore();
const s=store.snapshot();
const tbl=document.getElementById("tdevs");
function badge(status){ if(status==='disponível') return '<span class="badge ok">disponível</span>'; if(status==='em manutenção') return '<span class="badge warn">manutenção</span>'; return '<span class="badge err">'+status+'</span>'; }
tbl.innerHTML=`
  <thead><tr><th>Tipo</th><th>Marca</th><th>Modelo</th><th>Serial</th><th>Local</th><th>Status</th></tr></thead>
  <tbody>${s.dispositivos.map(d=>`<tr><td>${d.tipo}</td><td>${d.marca}</td><td>${d.modelo}</td><td>${d.numeroSerie}</td><td>${d.localizacao||"—"}</td><td>${badge(d.status)}</td></tr>`).join("")}</tbody>
`;