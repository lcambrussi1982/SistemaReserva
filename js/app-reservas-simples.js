
import { createStore } from "./sre-core-v2.js";
import { currentUser } from "./auth.js";

const store=createStore();
const u=currentUser();

const $=s=>document.querySelector(s);
const grid=$("#grid");
const tbl=$("#tbl");
const devSel=$("#devSel");
const dia=$("#dia");
const toasts=$("#toasts");

function toast(msg, ok=true){
  const t=document.createElement("div");
  t.className="toast"; t.textContent=msg;
  if(!ok) t.style.background="#7f1d1d";
  toasts.append(t);
  setTimeout(()=>{t.style.opacity=.0; setTimeout(()=>t.remove(),250)}, 1800);
}

function fillDevices(){
  const s=store.snapshot();
  const opts = s.dispositivos.map(d=>`<option value="${d.id}">${d.tipo} • ${d.marca} ${d.modelo} (${d.localizacao})</option>`).join("");
  devSel.innerHTML = opts;
}

function renderGrid(){
  const s=store.snapshot();
  const data = dia.value || new Date().toISOString().slice(0,10);
  const devId = devSel.value;
  grid.innerHTML = "";
  s.aulas.forEach(a=>{
    const disp = store.disponibilidadeDispositivos(data, a.id);
    const dev = s.dispositivos.find(d=>d.id===devId);
    const estaLivre = disp.find(d=>d.id===devId)?.disponivelNoSlot && dev?.status==="disponível";

    const minhaReserva = s.reservas.find(r=>r.professorId===u.id && r.data===data && r.aulaId===a.id && r.status==="ativa");
    const ocupadoPorOutroMesmoDev = s.reservas.some(r=>r.data===data && r.aulaId===a.id && r.dispositivoId===devId && r.status==="ativa" && r.professorId!==u.id);

    const card=document.createElement("div");
    card.className="slot";
    card.innerHTML = `
      <h4>${a.inicio}–${a.fim}</h4>
      <div class="muted">${dev?.tipo||""} ${dev?.modelo||""}</div>
      <div style="margin-top:8px">
        ${minhaReserva ? `<button class="btn ghost" data-cancel="${minhaReserva.id}">Cancelar minha reserva</button>` :
          (estaLivre && !ocupadoPorOutroMesmoDev ? `<button class="btn" data-reservar="${a.id}">Reservar</button>` :
          `<span class="badge err">Indisponível</span>`)}
      </div>
    `;
    grid.append(card);

    const btnR = card.querySelector("[data-reservar]");
    if(btnR){
      btnR.onclick=()=>{
        try{
          // pega turma/disciplina padrão do professor
          const prof=s.professores.find(p=>p.id===u.id);
          const turmaId=(prof?.turmas?.[0]) || (s.turmas[0]?.id);
          const discId=(prof?.disciplinas?.[0]) || (s.disciplinas[0]?.id);
          store.crud.create("reservas",{professorId:u.id,dispositivoId:devId,aulaId:btnR.dataset.reservar,turmaId,disciplinaId:discId,data, status:"ativa"},"ui");
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
    return `<tr><td>${data}</td><td>${a?.inicio}–${a?.fim}</td><td>${d?.modelo}</td><td><span class="badge ok">${r.status}</span></td><td><button class="btn ghost" data-cancel="${r.id}">Cancelar</button></td></tr>`;
  }).join("");
  tbl.innerHTML = `<thead><tr><th>Data</th><th>Horário</th><th>Dispositivo</th><th>Status</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="5">Nenhuma reserva.</td></tr>'}</tbody>`;
  tbl.querySelectorAll("[data-cancel]").forEach(b=> b.onclick=()=>{ try{ store.cancelarReserva(b.dataset.cancel,"ui"); toast("Reserva cancelada."); renderGrid(); renderTable(); }catch(e){ toast(e.message,false);} });
}

function init(){
  const today = new Date().toISOString().slice(0,10);
  dia.value = today;
  fillDevices();
  renderGrid();
  renderTable();
}
init();

document.getElementById("btnAtualizar").onclick=()=>{ renderGrid(); renderTable(); };
devSel.onchange=()=>{ renderGrid(); };
dia.onchange=()=>{ renderGrid(); renderTable(); };
