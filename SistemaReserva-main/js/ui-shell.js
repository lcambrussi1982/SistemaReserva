import { currentUser, renderUserbox } from "./auth.js";
export function setupShell(){
  const box=document.getElementById("userbox"); if(box) renderUserbox(box);
  const u=currentUser();
  document.querySelectorAll(".only-admin").forEach(el=>{ el.style.display = (u && u.role==="ADMIN") ? "" : "none"; });
}