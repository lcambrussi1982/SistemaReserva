
import { createStore } from "./sre-core-v2.js";
const store=createStore();
const $=s=>document.querySelector(s);
const out=$("#saida");

document.getElementById("btn").onclick=()=>{
  const dia=$("#dia").value || new Date().toISOString().slice(0,10);
  const lab=$("#lab").value;
  const s=store.snapshot();
  // mostra por aula a contagem de dispositivos disponíveis naquele lab
  const rows = s.aulas.map(a=>{
    const disp = store.disponibilidadeDispositivos(dia, a.id).filter(d=>d.localizacao===lab && d.disponivelNoSlot);
    const ocup = s.reservas.filter(r=>r.data===dia && r.aulaId===a.id).map(r=>{ const p=s.professores.find(x=>x.id===r.professorId)?.nome||'—'; const t=s.turmas.find(x=>x.id===r.turmaId)?.nome||'—'; const d=s.dispositivos.find(x=>x.id===r.dispositivoId)?.modelo||'—'; return `${p} (${t}) • ${d}`; }).join('<br>'); return `<tr><td>${a.inicio}–${a.fim}</td><td>${disp.length}</td><td>${ocup||'—'}</td></tr>`;
  }).join("");
  out.innerHTML = `<h3>${lab} em ${dia}</h3><table class="table"><thead><tr><th>Horário</th><th>Disponíveis</th><th>Ocupações</th></tr></thead><tbody>${rows}</tbody></table>`;
};
