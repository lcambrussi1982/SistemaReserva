import { createStore } from "./sre-core-v2.js";
import { sha256 } from "./crypto-utils.js";
const store = createStore();
const KEY_SESSION="SRE_SESSION";

export function currentUser(){ try{return JSON.parse(localStorage.getItem(KEY_SESSION))||null;}catch{return null;} }
export function logout(){ localStorage.removeItem(KEY_SESSION); }

export async function login(email, senha){
  const s = store.snapshot();
  const hash = await sha256(senha||"");
  const admin = s.administradores.find(a=>a.email===email && a.senhaHash===hash);
  if(admin){ const u={id:admin.id,role:"ADMIN",name:admin.nome,email:admin.email}; localStorage.setItem(KEY_SESSION,JSON.stringify(u)); if(u.email==='admin'){ localStorage.setItem('SRE_REQUIRE_ADMIN_SETUP','1'); } return u; }
  const prof = s.professores.find(p=>p.email===email && p.senhaHash===hash);
  if(prof){ const u={id:prof.id,role:"PROF",name:prof.nome,email:prof.email}; localStorage.setItem(KEY_SESSION,JSON.stringify(u)); return u; }
  throw new Error("Credenciais inválidas.");
}

export async function signupProfessor({nome,email,senha,disciplinaIds,turmaIds}){
  const s=store.snapshot();
  if(s.professores.some(p=>p.email===email)) throw new Error("E-mail já cadastrado.");
  const senhaHash = await sha256(senha);
  const novo = store.crud.create("professores",{nome,email,senhaHash,ativo:true,disciplinas:disciplinaIds||[],turmas:turmaIds||[]});
  const u={id:novo.id,role:"PROF",name:novo.nome,email:novo.email};
  localStorage.setItem(KEY_SESSION,JSON.stringify(u));
  return u;
}

export function requireAuth({role=null,redirect=true}={}){
  const u=currentUser();
  if(!u){ if(redirect) location.href="login.html"; return null; }
  if(role && u.role!==role){ if(redirect) location.href="index.html"; return null; }
  return u;
}

export function renderUserbox(el){
  const u=currentUser();
  if(!u){ el.innerHTML='<a class="logout" href="login.html">Entrar</a>'; return; }
  el.innerHTML=`<span>${u.name} • ${u.role}</span> <a class="logout" id="logoutBtn" href="#">Sair</a>`;
  el.querySelector("#logoutBtn").onclick=(e)=>{e.preventDefault(); logout(); location.href="login.html";};
}