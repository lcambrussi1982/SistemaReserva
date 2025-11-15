import { createStore } from "./sre-core-v2.js";
import { sha256 } from "./crypto-utils.js";
import { currentUser } from "./auth.js";

const store=createStore();
const u=currentUser();
const msg=document.getElementById("msg");
if(!(u && u.role==="ADMIN" && u.email==="admin")){
  // Página só faz sentido no primeiro acesso do admin "admin"
  location.href="index.html";
}

document.getElementById("salvar").onclick=async()=>{
  const email=document.getElementById("email").value.trim().toLowerCase();
  const senha=document.getElementById("senha").value.trim();
  msg.style.color="var(--err)"; msg.textContent="";
  if(!email.endsWith("@escola.pr.gov.br")){ msg.textContent="O e-mail deve ser do domínio @escola.pr.gov.br"; return; }
  if((senha||'').length<8){ msg.textContent="Senha muito curta (mín. 8)."; return; }
  try{
    const s=store.snapshot();
    const adm = s.administradores.find(a=>a.id===u.id);
    if(!adm){ msg.textContent="Administrador não encontrado."; return; }
    const senhaHash = await sha256(senha);
    store.crud.update("administradores", adm.id, { email, senhaHash }, "admin-setup");
    // Atualiza sessão e libera flag
    const newU = { ...u, email };
    localStorage.setItem("SRE_SESSION", JSON.stringify(newU));
    localStorage.removeItem("SRE_REQUIRE_ADMIN_SETUP");
    msg.style.color="green"; msg.textContent="Dados atualizados!";
    setTimeout(()=>location.href="index.html", 800);
  }catch(e){
    msg.textContent = e.message;
  }
};