# Sistema de Reservas — Colégio Estadual Padre Ponciano

Pronto para **GitHub Pages** (estático).

## Como publicar
1. Crie um repositório (ex.: `colegio-reservas`).  
2. Suba todos os arquivos deste ZIP na raiz do repositório.  
3. Vá em **Settings › Pages** e selecione **Source: Deploy from a branch** e **Branch: main / root**.  
4. Acesse: `https://SEU_USUARIO.github.io/NOME_DO_REPO/`

> Observações:
> - Todos os imports usam caminhos relativos (`./js/...`), funcionam no caminho do repositório.
> - `crypto.subtle` funciona em HTTPS (GitHub Pages é HTTPS).
> - Armazena dados no `localStorage` do navegador (demo). Para produção, recomendo backend (API) + banco de dados.

## Páginas
- `login.html` — login simples (+ link para `signup.html` em nova aba)
- `signup.html` — cadastro de professor
- `reservas.html` — grid semanal com filtros, export CSV/ICS e cancelamento das suas reservas
- `consultas.html` — consulta por laboratório (disponíveis e ocupações por slot)
- `dispositivos.html`, `relatorios.html`, `cadastros.html`, `tutorial.html`

## Extras
- **Tema escuro**: botão 🌙 no topo (salva preferência no `localStorage`).
- **404.html** e **.nojekyll** já incluídos.
