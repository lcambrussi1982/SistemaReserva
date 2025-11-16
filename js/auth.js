/**
 * auth.js
 * Versão simplificada de autenticação apenas em localStorage.
 * Depois você pode trocar por Firebase Auth mantendo a mesma interface.
 */

function fakeLogin(email, senha) {
  // Aqui poderia chamar Firebase Auth. Por enquanto, qualquer senha é aceita.
  return {
    nome: email.split("@")[0],
    email,
    turmas: [],
    disciplinas: []
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const loginMsg = document.getElementById("login-msg");

  if (loginForm) {
    loginForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const senha = document.getElementById("login-senha").value.trim();

      if (!email || !senha) {
        loginMsg.textContent = "Preencha e-mail e senha.";
        return;
      }

      const user = fakeLogin(email, senha);
      localStorage.setItem("usuarioAtual", JSON.stringify(user));
      window.location.href = "dashboard.html";
    });
  }

  // Preencher perfil do usuário em usuario.html
  const userRaw = localStorage.getItem("usuarioAtual");
  if (userRaw) {
    try {
      const u = JSON.parse(userRaw);
      const nomeEl = document.getElementById("usuario-nome");
      const emailEl = document.getElementById("usuario-email");
      const extraEl = document.getElementById("usuario-info-extra");
      if (nomeEl) nomeEl.textContent = u.nome || "—";
      if (emailEl) emailEl.textContent = u.email || "—";
      if (extraEl) {
        const turmas = (u.turmas || []).join(", ");
        const discs = (u.disciplinas || []).join(", ");
        extraEl.textContent = [turmas, discs].filter(Boolean).join(" • ") || "—";
      }
    } catch {}
  }
});
