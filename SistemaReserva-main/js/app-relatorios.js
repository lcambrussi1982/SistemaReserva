import { createStore } from "./sre-core-v2.js";
const store=createStore();
const $=s=>document.querySelector(s); const out=$("#saida");

function exportCSV(rows){
  if(!rows.length) return alert("Sem dados.");
  const head=Object.keys(rows[0]); const csv=[head.join(","),...rows.map(r=>head.map(k=>JSON.stringify(r[k]??"")).join(","))].join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="relatorio.csv"; a.click();
}

document.getElementById("btn").onclick=()=>{
  const de=$("#de").value||"0000-00-00"; const ate=$("#ate").value||"9999-12-31";
  const s=store.snapshot(); const inRange=r=>r.data>=de && r.data<=ate;
  const reservas=s.reservas.filter(inRange).map(r=>{
    const a=s.aulas.find(x=>x.id===r.aulaId); const d=s.dispositivos.find(x=>x.id===r.dispositivoId); const p=s.professores.find(x=>x.id===r.professorId);
    return {data:r.data, inicio:a?.inicio, fim:a?.fim, dispositivo:d?.modelo, professor:p?.nome, status:r.status};
  });
  const rows=reservas.map(r=>`<tr><td>${r.data}</td><td>${r.inicio}–${r.fim}</td><td>${r.dispositivo}</td><td>${r.professor}</td><td>${r.status}</td></tr>`).join("");
  out.innerHTML=`<h3>Reservas</h3><table class="table"><thead><tr><th>Data</th><th>Horário</th><th>Dispositivo</th><th>Professor</th><th>Status</th></tr></thead><tbody>${rows||'<tr><td colspan="5">Sem dados.</td></tr>'}</tbody></table>`;
  document.getElementById("csv").onclick=()=>exportCSV(reservas);
};

document.getElementById("backup").onclick=()=>{
  try{
    const data = store.exportJSON();
    const blob=new Blob([data],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="backup-sre.json"; a.click();
  }catch(e){ alert(e.message); }
};

document.getElementById("restore").onchange=(ev)=>{
  const f=ev.target.files[0]; if(!f) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{ store.importJSON(reader.result); alert("Backup restaurado."); location.reload(); }catch(e){ alert("Falha ao restaurar: "+e.message); }
  };
  reader.readAsText(f);
};