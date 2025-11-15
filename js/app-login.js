
import { login, currentUser } from "./auth.js";

const u=currentUser(); if(u) location.href="index.html";

document.getElementById("btnLogin").onclick=async()=>{
  const lEmail=document.getElementById("lEmail").value.trim();
  const lSenha=document.getElementById("lSenha").value.trim();
  const msg=document.getElementById("lMsg");
  msg.textContent="";
  try{ await login(lEmail,lSenha); try{ const u = JSON.parse(localStorage.getItem("SRE_SESSION")||"null"); if(u && u.email==="admin"){ location.href="admin-users.html"; } else { location.href="index.html"; } }catch{ location.href="index.html"; } }catch(e){ msg.textContent=e.message; }
};
