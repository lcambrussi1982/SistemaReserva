/**
 * seed-completo.js
 * Aqui apenas simulamos o seed escrevendo mensagens no log.
 * No seu projeto real você pode colar a versão com Firestore.
 */

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-seed");
  const logEl = document.getElementById("log");
  if (!btn || !logEl) return;

  function log(msg) {
    logEl.textContent += msg + "\n";
  }

  btn.addEventListener("click", () => {
    logEl.textContent = "";
    log("Iniciando seed de exemplo...");
    setTimeout(() => {
      log("Criando turmas padrão (1º, 2º, 3º A–E)...");
    }, 300);
    setTimeout(() => {
      log("Criando disciplinas base (Português, Matemática, Inglês...)");
    }, 600);
    setTimeout(() => {
      log("Criando horários padrão da manhã...");
    }, 900);
    setTimeout(() => {
      log("Seed concluído com sucesso ✅");
    }, 1200);
  });
});
