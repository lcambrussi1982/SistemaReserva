import { createStore } from "./sre-core-v2.js";
const store=createStore();
const painel=document.getElementById("painel");
const $=s=>document.querySelector(s);
$("#tab-prof").onclick=renderProf; $("#tab-dev").onclick=renderDev; $("#tab-outros").onclick=renderOutros;

function renderProf(){
  const s=store.snapshot();
  const rows=s.professores.map(p=>`<tr><td>${p.nome}</td><td>${p.email}</td><td>${p.ativo?"Ativo":"Inativo"}</td></tr>`).join("");
  painel.innerHTML=`<h3>Professores</h3>
    <div class="grid cols-2">
      <div>
        <label>Nome</label><input id="nome" class="input">
        <label>Email</label><input id="email" class="input">
        <label>Senha</label><input id="senha" class="input">
        <button id="save" class="btn">Salvar</button>
      </div>
      <div><table class="table"><thead><tr><th>Nome</th><th>Email</th><th>Status</th></tr></thead><tbody>${rows||"<tr><td colspan='3'>Sem professores</td></tr>"}</tbody></table></div>
    </div>`;
  painel.querySelector("#save").onclick=async()=>{
    const nome=painel.querySelector("#nome").value.trim();
    const email=painel.querySelector("#email").value.trim();
    const senha=painel.querySelector("#senha").value.trim();
    if(!nome||!email||!senha){ alert("Preencha nome, email e senha."); return; }
    // admin cria com senha em texto? ideal seria hashá-la; para manter consistência, use o endpoint de login/signup — aqui simplificamos:
    try{ const { sha256 } = await import("./crypto-utils.js"); const senhaHash = await sha256(senha);
      store.crud.create("professores",{nome,email,senhaHash,ativo:true,disciplinas:[],turmas:[]}); renderProf();
    }catch(e){ alert(e.message); }
  };
}

function renderDev(){
  const s = store.snapshot();
  const tablets = s.dispositivos.filter(d => d.tipo === "Tablet").length;
  const chromes = s.dispositivos.filter(d => d.tipo === "Chromebook").length;
  const rows = s.dispositivos.map(d =>
    `<tr><td>${d.tipo}</td><td>${d.marca||"—"}</td><td>${d.modelo||"—"}</td><td>${d.numeroSerie||"—"}</td><td>${d.localizacao||"—"}</td><td>${d.status}</td></tr>`
  ).join("");
  painel.innerHTML = `<h3>Dispositivos</h3>
    <p class="muted">Aqui você controla apenas a quantidade de Tablets e Chromebooks. O sistema gera e apaga os registros individuais automaticamente.</p>
    <div class="grid cols-2">
      <div>
        <label>Tablets disponíveis (inventário)</label>
        <input id="qTablet" class="input" type="number" min="0" value="${tablets}">
        <label>Chromebooks disponíveis (inventário)</label>
        <input id="qChrome" class="input" type="number" min="0" value="${chromes}">
        <button id="salvarQtd" class="btn">Salvar quantidades</button>
      </div>
      <div>
        <h4>Situação detalhada</h4>
        <table class="table">
          <thead><tr><th>Tipo</th><th>Marca</th><th>Modelo</th><th>Serial</th><th>Local</th><th>Status</th></tr></thead>
          <tbody>${rows || "<tr><td colspan='6'>Sem dispositivos</td></tr>"}</tbody>
        </table>
      </div>
    </div>`;

  function ajustarQuantidade(tipo, novaQtd){
    const snap = store.snapshot();
    const devs = snap.dispositivos.filter(d => d.tipo === tipo);
    const atual = devs.length;
    const alvo = Math.max(0, parseInt(novaQtd||"0", 10) || 0);
    if (alvo === atual) return;
    if (alvo > atual){
      const diff = alvo - atual;
      for(let i=0;i<diff;i++){
        const idSuffix = `${Date.now()}_${tipo}_${i}_${Math.random().toString(36).slice(2,6)}`;
        store.crud.create("dispositivos",{
          tipo,
          marca: tipo,
          modelo: tipo,
          numeroSerie: idSuffix,
          localizacao: "Carrinho",
          status: "disponível",
          ultimaManutencao: new Date().toISOString().slice(0,10)
        },"admin");
      }
    }else{
      let diff = atual - alvo;
      for(const d of devs){
        if(diff <= 0) break;
        const temReservaAtiva = snap.reservas.some(r => r.dispositivoId === d.id && r.status === "ativa");
        if(!temReservaAtiva){
          store.crud.delete("dispositivos", d.id, "admin");
          diff--;
        }
      }
      if(diff > 0){
        alert("Alguns dispositivos não puderam ser removidos porque têm reservas ativas.");
      }
    }
  }

  painel.querySelector("#salvarQtd").onclick = () => {
    const qt = painel.querySelector("#qTablet").value;
    const qc = painel.querySelector("#qChrome").value;
    ajustarQuantidade("Tablet", qt);
    ajustarQuantidade("Chromebook", qc);
    renderDev();
  };
}

function renderOutros(){
  const s=store.snapshot();
  painel.innerHTML=`<h3>Outros</h3>
    <div class="grid cols-3">
      <div><h4>Turmas</h4><ul>${s.turmas.map(t=>`<li>${t.nome}</li>`).join("")}</ul></div>
      <div><h4>Disciplinas</h4><ul>${s.disciplinas.map(d=>`<li>${d.nome}</li>`).join("")}</ul></div>
      <div><h4>Aulas</h4><ul>${s.aulas.map(a=>`<li>${a.inicio}–${a.fim}</li>`).join("")}</ul></div>
    </div>`;
}
renderProf();