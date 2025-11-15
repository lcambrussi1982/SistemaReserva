import { createStore } from "./sre-core-v2.js";
const store=createStore();
const s=store.snapshot();
const hoje=new Date().toISOString().slice(0,10);
document.getElementById("cards").innerHTML=`
  <div class="card"><div class="muted">Professores</div><h3>${s.professores.length}</h3></div>
  <div class="card"><div class="muted">Dispositivos</div><h3>${s.dispositivos.length}</h3></div>
  <div class="card"><div class="muted">Reservas (hoje)</div><h3>${s.reservas.filter(r=>r.data===hoje).length}</h3></div>
`;