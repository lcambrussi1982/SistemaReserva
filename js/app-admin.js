
import { createStore } from "./sre-core-v2.js";
import { runAutoMaintenance, smartPickDevice } from "./automation.js";
const store=createStore();
const $=s=>document.querySelector(s);
const grid=$("#grid"); const tbl=$("#tbl");
const tipoSel=$("#tipoSel"); const profSel=$("#profSel"); const dia=$("#dia"); const toasts=$("#toasts");

function toast(msg, ok=true){
  const t=document.createElement("div"); t.className="toast"; t.textContent=msg; if(!ok) t.style.background="#7f1d1d";
  toasts.append(t); setTimeout(()=>{t.style.opacity=.0; setTimeout(()=>t.remove(),250)}, 1800);
}
const unique = a => [...new Set(a)];

function fillProfessores(){
  const s=store.snapshot();
  profSel.innerHTML = s.professores.map(p=>`<option value="${p.id}">${p.nome}</option>`).join("");
}
function fillTipos(){
  const s=store.snapshot();
  const tipos = unique(s.dispositivos.map(d=>d.tipo));
  tipoSel.innerHTML = tipos.map(t=>`<option value="${t}">${t}</option>`).join("");
}

function livresPorTipo(data, aulaId, tipo){
  const s=store.snapshot();
  const disp = store.disponibilidadeDispositivos(data, aulaId);
  return disp.filter(d=>d.tipo===tipo && d.disponivelNoSlot && d.status==="disponível");
}

function renderGrid(){
  const s=store.snapshot();
  const data = dia.value || new Date().toISOString().slice(0,10);
  const tipo = tipoSel.value;
  grid.innerHTML = "";
  s.aulas.forEach(a=>{
    const livres = livresPorTipo(data, a.id, tipo);
    const card=document.createElement("div"); card.className="slot";
    const qtd = livres.length;
    card.innerHTML = `
      <h4>${a.inicio}–${a.fim}</h4>
      <div class="muted">${tipo} • ${qtd} livre(s)</div>
      <div style="margin-top:8px">
        ${qtd>0 ? `<button class="btn" data-reservar="${a.id}">Reservar para o professor</button>` : `<span class="badge err">Indisponível</span>`}
      </div>`;
    grid.append(card);
    const btnR = card.querySelector("[data-reservar]");
    if(btnR){
      btnR.onclick=()=>{
        try{
          const lista = livresPorTipo(data, btnR.dataset.reservar, tipo);
          if(!lista.length){ toast("Sem unidades livres deste tipo.", false); return; }
          const escolhido = smartPickDevice(tipo, data, btnR.dataset.reservar) || lista[0];
          const profId = profSel.value;
          store.crud.create("reservas", { professorId: profId, dispositivoId: escolhido.id, aulaId: btnR.dataset.reservar, data, status:"ativa" }, "admin-ui");
          toast("Reserva criada para o professor.");
          renderGrid(); renderTable();
        }catch(e){ toast(e.message,false); }
      };
    }
  });
}

function renderTable(){
  const s=store.snapshot();
  const data = dia.value || new Date().toISOString().slice(0,10);
  const todos = s.reservas.filter(r=>r.data===data).sort((a,b)=>a.aulaId.localeCompare(b.aulaId));
  const rows = todos.map(r=>{
    const a=s.aulas.find(x=>x.id===r.aulaId);
    const d=s.dispositivos.find(x=>x.id===r.dispositivoId);
    const p=s.professores.find(x=>x.id===r.professorId);
    return `<tr><td>${data}</td><td>${a?.inicio}–${a?.fim}</td><td>${d?.tipo} • ${d?.modelo}</td><td>${p?.nome||'—'}</td><td><span class="badge ok">${r.status}</span></td><td><button class="btn ghost" data-cancel="${r.id}">Cancelar</button></td></tr>`;
  }).join("");
  tbl.innerHTML = `<thead><tr><th>Data</th><th>Horário</th><th>Dispositivo</th><th>Professor</th><th>Status</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="6">Nenhuma reserva.</td></tr>'}</tbody>`;
  tbl.querySelectorAll("[data-cancel]").forEach(b=> b.onclick=()=>{ try{ store.cancelarReserva(b.dataset.cancel,"admin-ui"); toast("Reserva cancelada."); renderGrid(); renderTable(); }catch(e){ toast(e.message,false);} });
}



function renderResumo(){
  const s = store.snapshot();
  const data = dia.value || new Date().toISOString().slice(0,10);
  const todos = s.reservas.filter(r=>r.data===data && r.status==="ativa");
  if(!todos.length){
    const el = document.getElementById("resumoDia");
    if(el) el.textContent = "Nenhuma reserva para hoje.";
    return;
  }
  let tablets = 0, chromes = 0;
  todos.forEach(r=>{
    const d = s.dispositivos.find(x=>x.id===r.dispositivoId);
    if(!d) return;
    if(d.tipo==="Tablet") tablets++;
    else if(d.tipo==="Notebook" || d.tipo==="Chromebook") chromes++;
  });
  const el = document.getElementById("resumoDia");
  if(el){
    el.textContent = `Tablets reservados: ${tablets} • Chromebooks reservados: ${chromes} • Total: ${todos.length}`;
  }
}

function exportCSV(){
  const s=store.snapshot();
  const data = dia.value || new Date().toISOString().slice(0,10);
  const todos = s.reservas.filter(r=>r.data===data);
  const head = ["data","inicio","fim","tipo","modelo","professor","status"];
  const lines = [head.join(",")];
  todos.forEach(r=>{
    const a=s.aulas.find(x=>x.id===r.aulaId);
    const d=s.dispositivos.find(x=>x.id===r.dispositivoId);
    const p=s.professores.find(x=>x.id===r.professorId);
    lines.push([data, a?.inicio||"", a?.fim||"", d?.tipo||"", d?.modelo||"", (p?.nome||"").replaceAll(","," "), r.status].join(","));
  });
  const blob = new Blob([lines.join("\n")], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=`reservas_${data}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function init(){
  runAutoMaintenance();
  dia.value = new Date().toISOString().slice(0,10);
  fillProfessores(); fillTipos();
  renderGrid(); renderTable(); renderResumo();
  document.getElementById("btnCSV").onclick=exportCSV;
}
init();
dia.onchange=()=>{ renderGrid(); renderTable(); renderResumo(); };
tipoSel.onchange=()=>{ renderGrid(); };
profSel.onchange=()=>{ /* nada, só usa ao reservar */ };
