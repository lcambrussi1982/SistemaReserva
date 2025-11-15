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
  const s=store.snapshot();
  const rows=s.dispositivos.map(d=>`<tr><td>${d.tipo}</td><td>${d.marca}</td><td>${d.modelo}</td><td>${d.numeroSerie}</td><td>${d.localizacao||"—"}</td><td>${d.status}</td></tr>`).join("");
  painel.innerHTML=`<h3>Dispositivos</h3>
    <div class="grid cols-2">
      <div>
        <label>Tipo</label><input id="tipo" class="input">
        <label>Marca</label><input id="marca" class="input">
        <label>Modelo</label><input id="modelo" class="input">
        <label>Serial</label><input id="serial" class="input">
        <label>Local</label><input id="loc" class="input">
        <button id="add" class="btn">Adicionar</button>
      </div>
      <div><table class="table"><thead><tr><th>Tipo</th><th>Marca</th><th>Modelo</th><th>Serial</th><th>Local</th><th>Status</th></tr></thead><tbody>${rows||"<tr><td colspan='6'>Sem dispositivos</td></tr>"}</tbody></table></div>
    </div>`;
  painel.querySelector("#add").onclick=()=>{
    try{ store.crud.create("dispositivos",{tipo:painel.querySelector("#tipo").value.trim(),marca:painel.querySelector("#marca").value.trim(),modelo:painel.querySelector("#modelo").value.trim(),numeroSerie:painel.querySelector("#serial").value.trim(),status:"disponível",localizacao:painel.querySelector("#loc").value.trim(),ultimaManutencao:new Date().toISOString().slice(0,10)}); renderDev(); }catch(e){ alert(e.message); }
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