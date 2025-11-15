import { createStore } from "./sre-core-v2.js";
import { currentUser } from "./auth.js";
const store=createStore();
const grid=document.getElementById("grid");
const tbl=document.getElementById("tbl");
const baseInput=document.getElementById("diaBase");
const fTipo=document.getElementById("fTipo");
const fLoc=document.getElementById("fLoc");
const prev=document.getElementById("prev");
const next=document.getElementById("next");
const u=currentUser();

const oneDay=86400000;
function mondayOf(date){
  const d=new Date(date); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); return d;
}
function fmt(d){ return d.toISOString().slice(0,10); }

function renderGrid(){
  const s=store.snapshot();
  const base = baseInput.value ? new Date(baseInput.value) : new Date();
  const monday = mondayOf(base);


  grid.innerHTML="";
  for(let i=0;i<5;i++){ // segunda a sexta
    const day = new Date(monday.getTime()+i*oneDay);
    const data = fmt(day);
    const col = document.createElement("div"); col.className="slot";
    col.innerHTML = `<h4>${data}</h4>`;
    s.aulas.forEach(a=>{
      const todosDisp = store.disponibilidadeDispositivos(data, a.id).filter(d=>{
        const okTipo = !fTipo.value || d.tipo===fTipo.value;
        const okLoc = !fLoc.value || d.localizacao===fLoc.value;
        return okTipo && okLoc && d.disponivelNoSlot;
      });
      const tablets = todosDisp.filter(d => d.tipo === "Tablet");
      const chromes = todosDisp.filter(d => d.tipo === "Chromebook");
      const tipos = [...new Set(todosDisp.map(d => d.tipo))];

      const selId=`sel-${data}-${a.id}`;
      const qtdId=`qtd-${data}-${a.id}`;

      col.innerHTML += `${(()=>{
        const rs=s.reservas.filter(x=>x.data===data && x.aulaId===a.id);
        if(!rs.length) return "";
        const txt = rs.map(r=>{
          const p = s.professores.find(pp=>pp.id===r.professorId);
          const dev = s.dispositivos.find(dd=>dd.id===r.dispositivoId);
          return (p?.nome||"—")+" ("+(dev?.tipo||"?")+")";
        }).join("<br>");
        return `<div class=\"tip\" style=\"margin-top:6px\"><b>Ocupado por:</b><br>${txt}</div>`;
      })()}
        <div style="margin-top:8px;border-top:1px dashed var(--border);padding-top:8px">
          <div class="muted">${a.inicio}–${a.fim} • Tablets: ${tablets.length} • Chromebooks: ${chromes.length}</div>
          <div class="grid cols-2" style="align-items:end;gap:6px">
            <div>
              <label style="font-size:11px">Tipo</label>
              <select class="input" id="${selId}">
                ${tipos.map(t=>`<option value="${t}">${t}</option>`).join("")}
              </select>
            </div>
            <div>
              <label style="font-size:11px">Qtde</label>
              <input class="input" id="${qtdId}" type="number" min="1" value="1">
            </div>
          </div>
          <button class="btn" data-data="${data}" data-aula="${a.id}" data-sel="${selId}" data-qtd="${qtdId}" ${todosDisp.length? "":"disabled"}>Reservar</button>
        </div>
      `;
    });
    grid.append(col);
  }

  grid.querySelectorAll("button.btn").forEach(b=>{
    b.onclick=()=>{
      const data=b.dataset.data; const aulaId=b.dataset.aula;
      const sel = document.getElementById(b.dataset.sel);
      const qtdEl = document.getElementById(b.dataset.qtd);
      if(!sel) return;
      const tipoEscolhido = sel.value;
      let qtd = parseInt(qtdEl?.value||"1",10);
      if(!Number.isFinite(qtd) || qtd<=0) qtd=1;

      const s=store.snapshot();
      const prof=s.professores.find(p=>p.id===u.id);
      const turmaId=(prof?.turmas?.[0]) || (s.turmas[0]?.id);
      const discId=(prof?.disciplinas?.[0]) || (s.disciplinas[0]?.id);

      const disponiveisTipo = store.disponibilidadeDispositivos(data, aulaId)
        .filter(d=>d.tipo===tipoEscolhido && d.disponivelNoSlot);

      if(!disponiveisTipo.length){
        alert("Nenhum dispositivo desse tipo disponível neste horário.");
        return;
      }
      if(qtd > disponiveisTipo.length){
        alert(`Só há ${disponiveisTipo.length} ${tipoEscolhido}(s) disponíveis neste horário.`);
        return;
      }

      try{
        for(let i=0;i<qtd;i++){
          const dev = disponiveisTipo[i];
          store.crud.create("reservas",{
            professorId:u.id,
            dispositivoId:dev.id,
            aulaId,
            turmaId,
            disciplinaId:discId,
            data,
            status:"ativa"
          },"ui");
        }
        renderGrid(); renderTable();
      }catch(e){ alert(e.message); }
    };
  });
}

function renderTable(){
  const s=store.snapshot();
  const base = baseInput.value ? new Date(baseInput.value) : new Date();
  const monday = mondayOf(base);
  const start=fmt(monday); const end=fmt(new Date(monday.getTime()+4*oneDay));
  const mine=s.reservas.filter(r=>r.professorId===u.id && r.data>=start && r.data<=end).sort((a,b)=>a.data.localeCompare(b.data));
  const rows=mine.map(r=>{
    const a=s.aulas.find(x=>x.id===r.aulaId);
    const d=s.dispositivos.find(x=>x.id===r.dispositivoId);
    return `<tr><td>${r.data}</td><td>${a?.inicio}–${a?.fim}</td><td>${d?.modelo}</td><td><span class="badge ok">${r.status}</span></td><td><button class='btn ghost btn-cancelar' data-id='${r.id}'>Cancelar</button></td></tr>`;
  }).join("");
  tbl.innerHTML=`<thead><tr><th>Data</th><th>Horário</th><th>Dispositivo</th><th>Status</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="5">Nenhuma reserva.</td></tr>'}</tbody>`;
}

// CSV + ICS
function exportCSV(){
  const s=store.snapshot();
  const base = baseInput.value ? new Date(baseInput.value) : new Date();
  const monday = mondayOf(base); const start=fmt(monday); const end=fmt(new Date(monday.getTime()+4*oneDay));
  const mine=s.reservas.filter(r=>r.professorId===u.id && r.data>=start && r.data<=end);
  if(!mine.length) return alert("Sem reservas para exportar.");
  const head=["data","inicio","fim","dispositivo"];
  const rows=mine.map(r=>{
    const a=s.aulas.find(x=>x.id===r.aulaId); const d=s.dispositivos.find(x=>x.id===r.dispositivoId);
    return {data:r.data,inicio:a?.inicio,fim:a?.fim,dispositivo:d?.modelo};
  });
  const csv=[head.join(","),...rows.map(r=>head.map(k=>JSON.stringify(r[k]??"")).join(","))].join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}); const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download="reservas-semana.csv"; a.click();
}

function exportICS(){
  const s=store.snapshot();
  const mine=s.reservas.filter(r=>r.professorId===u.id);
  if(!mine.length) return alert("Sem reservas para exportar.");
  const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Cambrussi//SRE//PT-BR"];
  mine.forEach(r=>{
    const a=s.aulas.find(x=>x.id===r.aulaId); const d=s.dispositivos.find(x=>x.id===r.dispositivoId);
    const dt = r.data.replace(/-/g,""); // YYYYMMDD
    // horário local sem TZ para demo
    const start=dt+"T"+a.inicio.replace(":","")+"00"; const end=dt+"T"+a.fim.replace(":","")+"00";
    lines.push("BEGIN:VEVENT");
    lines.push("UID:"+r.id+"@sre");
    lines.push("DTSTAMP:"+dt+"T000000");
    lines.push("DTSTART:"+start);
    lines.push("DTEND:"+end);
    lines.push("SUMMARY:Reserva • "+(d?.modelo||"Dispositivo"));
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const blob=new Blob([lines.join("\r\n")],{type:"text/calendar"}); const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download="reservas.ics"; a.click();
}

function init(){
  const today=new Date(); const yyyy=today.toISOString().slice(0,10);
  baseInput.value=yyyy;
  renderGrid(); renderTable();
}
init();
fTipo.onchange=renderGrid; fLoc.onchange=renderGrid;
prev.onclick=()=>{ const d=new Date(baseInput.value); d.setDate(d.getDate()-7); baseInput.value=d.toISOString().slice(0,10); renderGrid(); renderTable(); };
next.onclick=()=>{ const d=new Date(baseInput.value); d.setDate(d.getDate()+7); baseInput.value=d.toISOString().slice(0,10); renderGrid(); renderTable(); };
document.getElementById("csv").onclick=exportCSV;
document.getElementById("ics").onclick=exportICS;
// cancelamento (tabela)
tbl.querySelectorAll(".btn-cancelar").forEach(b=>{
  b.onclick=()=>{ if(confirm("Cancelar esta reserva?")) { store.cancelarReserva(b.dataset.id, "ui"); renderGrid(); renderTable(); } };
});
