
import { createStore } from "./sre-core-v2.js";
import { sha256 } from "./crypto-utils.js";

const store=createStore();
const $=s=>document.querySelector(s);
const tbl=$("#tbl"); const toasts=$("#toasts"); const msg=$("#msg");

function toast(txt, ok=true){ const t=document.createElement("div"); t.className="toast"; t.textContent=txt; if(!ok) t.style.background="#7f1d1d"; toasts.append(t); setTimeout(()=>{t.style.opacity=.0; setTimeout(()=>t.remove(),250)}, 1800); }

function ensureAdminAccess(){
  try{
    const u = JSON.parse(localStorage.getItem("SRE_SESSION")||"null");
    if(!(u && u.role==="ADMIN")){ location.href="login.html"; return; }
    // Permissão especial: se for o admin/admin inicial (email==='admin'), também pode gerenciar
    // (esta página não aplica a obrigatoriedade de admin-setup)
  }catch{ location.href="login.html"; }
}

function renderTable(){
  const s=store.snapshot();
  const rows = s.administradores.map(a=>`
    <tr>
      <td>${a.nome||"—"}</td>
      <td>${a.email}</td>
      <td><button class="btn ghost" data-reset="${a.id}">Resetar senha</button> <button class="btn ghost" data-rem="${a.id}">Remover</button></td>
    </tr>`).join("");
  tbl.innerHTML = `<thead><tr><th>Nome</th><th>E-mail</th><th>Ações</th></tr></thead><tbody>${rows||'<tr><td colspan="3">Nenhum administrador cadastrado.</td></tr>'}</tbody>`;
  tbl.querySelectorAll("[data-reset]").forEach(b=> b.onclick=async()=>{
    const nova = prompt("Nova senha para este administrador (mín. 8 caracteres):");
    if(!nova || nova.length<8){ toast("Senha inválida.", false); return; }
    try{
      const s=store.snapshot();
      const adm = s.administradores.find(x=>x.id===b.dataset.reset);
      if(!adm){ toast("Admin não encontrado.", false); return; }
      const hash = await sha256(nova);
      store.crud.update("administradores", adm.id, { senhaHash: hash }, "admin-users");
      toast("Senha atualizada.");
      renderTable();
    }catch(e){ toast(e.message, false); }
  });
  tbl.querySelectorAll("[data-rem]").forEach(b=> b.onclick=()=>{
    const s=store.snapshot();
    const adm = s.administradores.find(x=>x.id===b.dataset.rem);
    if(!adm){ toast("Admin não encontrado.", false); return; }
    if(adm.email==="admin"){ toast("Não é possível remover o administrador padrão.", false); return; }
    if(!confirm("Tem certeza que deseja remover este administrador?")) return;
    store.crud.delete("administradores", adm.id, "admin-users");
    toast("Administrador removido.");
    renderTable();
  });
}

async function addAdmin(){
  const nome = (document.getElementById("aNome").value||"").trim();
  const email = (document.getElementById("aEmail").value||"").trim().toLowerCase();
  const senha = (document.getElementById("aSenha").value||"").trim();
  msg.textContent="";
  if(!email || !senha || senha.length<8){ msg.textContent="Preencha e-mail e uma senha de pelo menos 8 caracteres."; return; }
  // Opcional: restringir domínio. Para permitir qualquer domínio, não validar.
  // if(!email.endsWith("@escola.pr.gov.br")){ msg.textContent="O e-mail deve ser @escola.pr.gov.br"; return; }

  const s=store.snapshot();
  if(s.administradores.some(a=>a.email===email)){ msg.textContent="Já existe um administrador com este e-mail."; return; }

  const senhaHash = await sha256(senha);
  store.crud.create("administradores", { id:`a_${Date.now()}`, nome, email, senhaHash }, "admin-users");
  toast("Administrador cadastrado!");
  document.getElementById("aNome").value="";
  document.getElementById("aEmail").value="";
  document.getElementById("aSenha").value="";
  renderTable();
}

function init(){
  ensureAdminAccess();
  document.getElementById("btnAdd").onclick=addAdmin;
  renderTable();
}
init();
