document.addEventListener("DOMContentLoaded", () => {
  // Marcar item ativo no menu
  const path = window.location.pathname.split("/").pop() || "dashboard.html";
  const links = document.querySelectorAll("nav.menu a[data-page]");
  links.forEach(link => {
    const href = link.getAttribute("href");
    if (href === path) {
      link.classList.add("ativo");
    }
  });

  // Botão sair - limpa pseudo-auth
  const btnSair = document.getElementById("btn-sair");
  if (btnSair) {
    btnSair.addEventListener("click", () => {
      localStorage.removeItem("usuarioAtual");
      window.location.href = "index.html";
    });
  }

  // Proteção básica: se não há usuárioAtual, manda para login (exceto em páginas públicas)
  const publicPages = ["index.html", "signup.html"];
  if (!publicPages.includes(path)) {
    const user = localStorage.getItem("usuarioAtual");
    if (!user) {
      window.location.href = "index.html";
    }
  }
});
