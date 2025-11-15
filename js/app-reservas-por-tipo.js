
import { createStore } from "./sre-core-v2.js";
import { runAutoMaintenance, suggestTypeForUser, availabilityByType, smartPickDevice } from "./automation.js";
import { currentUser } from "./auth.js";

const store=createStore();
const u=currentUser();

const $=s=>document.querySelector(s);
const grid=$("#grid");
const tbl=$("#tbl");
const tipoSel=$("#tipoSel");
const dia=$("#dia");
const qtdGlobal=document.getElementById("qtd");
const toasts=$("#toasts");

function toast(msg, ok=true){
  const t=document.createElement("div");
  t.className="toast"; t.textContent=msg;
  if(!ok) t.style.background="#7f1d1d";
  toasts.append(t);
  setTimeout(()=>{t.style.opacity=.0; setTimeout(()=>t.remove(),250)}, 1800);
}

function unique(arr){ return [...new Set(arr)]; }

function fillTipos(){
  const sug = suggestTypeForUser(currentUser?.()?.id || localStorage.getItem('SRE_UID') || 'u');
  const s=store.snapshot();
  const tipos = unique(s.dispositivos.map(d=>d.tipo));
  tipoSel.innerHTML = tipos.map(t=>`<option value="${t}">${t}${sug.best===t?' • sugerido':''}</option>`).join("");
}

function livresPorTipo(data, aulaId, tipo){
  const s=store.snapshot();
  const disponiveis = store.disponibilidadeDispositivos(data, aulaId)
    .filter(d=>d.tipo===tipo && d.status==="disponível" && d.disponivelNoSlot);
  return disponiveis;
}

function renderGrid(){
  const s=store.snapshot();
  const data = dia.value || new Date().toISOString().slice(0,10);
  const tipo = tipoSel.value;
  grid.innerHTML = "";

  s.aulas.forEach(a=>{
    const livres = livresPorTipo(data, a.id, tipo);
    // verifica se EU já tenho reserva nesse slot (de qualquer tipo)
    const minhaReserva = s.reservas.find(r=>r.professorId===u.id && r.data===data && r.aulaId===a.id && r.status==="ativa");

    const card=document.createElement("div");
    card.className="slot";
    const disponibilidade = `<div class="muted">${tipo} • ${livres.length} livre(s)</div>`;
    card.innerHTML = `
      <h4>${a.inicio}–${a.fim}</h4>
      ${disponibilidade}
      <div style="margin-top:8px">
        ${minhaReserva ? `<button class="btn ghost" data-cancel="${minhaReserva.id}">Cancelar minha reserva</button>` :
          (livres.length>0 ? `<button class="btn" data-reservar="${a.id}">Reservar</button>` :
          `<span class="badge err">Indisponível</span>`)}
      </div>
    `;
    grid.append(card);

    const btnR = card.querySelector("[data-reservar]");
    if(btnR){
      btnR.onclick=()=>{
        try{
          let qtd = parseInt((qtdGlobal && qtdGlobal.value) || "1",10);
          if(!Number.isFinite(qtd) || qtd<=0) qtd = 1;
          const lista = livresPorTipo(data, btnR.dataset.reservar, tipo);
          const smart = smartPickDevice(tipo, data, btnR.dataset.reservar);
          if(smart){ lista.sort((a,b)=> (a.id===smart.id?-1: b.id===smart.id?1:0)); }
          if(!lista.length) { toast("Nenhum dispositivo do tipo disponível.", false); return; }
          if(qtd > lista.length){
            toast(`Só há ${lista.length} ${tipo}(s) disponíveis neste horário.`, false);
            return;
          }
          const prof=s.professores.find(p=>p.id===u.id);
          const turmaId=(prof?.turmas?.[0]) || (s.turmas[0]?.id);
          const discId=(prof?.disciplinas?.[0]) || (s.disciplinas[0]?.id);
          for(let i=0;i<qtd;i++){
            const escolhido = lista[i];
            store.crud.create("reservas",{
              professorId:u.id,
              dispositivoId:escolhido.id,
              aulaId:btnR.dataset.reservar,
              turmaId,disciplinaId:discId,data,status:"ativa"
            },"ui");
          }
          toast("Reserva confirmada!");
          renderGrid(); renderTable();
        }catch(e){ toast(e.message,false); }
      };
    }
    const btnC = card.querySelector("[data-cancel]");
    if(btnC){
      btnC.onclick=()=>{
        try{ store.cancelarReserva(btnC.dataset.cancel,"ui"); toast("Reserva cancelada."); renderGrid(); renderTable(); }catch(e){ toast(e.message,false); }
      };
    }
  });
}

function renderTable(){
  const s=store.snapshot();
  const data = dia.value || new Date().toISOString().slice(0,10);
  const mine=s.reservas.filter(r=>r.data===data && r.professorId===u.id).sort((a,b)=>a.aulaId.localeCompare(b.aulaId));
  const rows = mine.map(r=>{
    const a=s.aulas.find(x=>x.id===r.aulaId);
    const d=s.dispositivos.find(x=>x.id===r.dispositivoId);
    return `<tr><td>${data}</td><td>${a?.inicio}–${a?.fim}</td><td>${d?.tipo} • ${d?.modelo}</td><td><span class="badge ok">${r.status}</span></td><td><button class="btn ghost" data-cancel="${r.id}">Cancelar</button></td></tr>`;
  }).join("");
  tbl.innerHTML = `<thead><tr><th>Data</th><th>Horário</th><th>Dispositivo</th><th>Status</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="5">Nenhuma reserva.</td></tr>'}</tbody>`;
  tbl.querySelectorAll("[data-cancel]").forEach(b=> b.onclick=()=>{ try{ store.cancelarReserva(b.dataset.cancel,"ui"); toast("Reserva cancelada."); renderGrid(); renderTable(); }catch(e){ toast(e.message,false);} });
}

function init(){
  runAutoMaintenance();
  const today = new Date().toISOString().slice(0,10);
  dia.value = today;
  fillTipos();
  renderGrid();
  renderTable();
}
init();

document.getElementById("btnAtualizar").onclick=()=>{ renderGrid(); renderTable(); };
tipoSel.onchange=()=>{ renderGrid(); };
dia.onchange=()=>{ renderGrid(); renderTable(); };
