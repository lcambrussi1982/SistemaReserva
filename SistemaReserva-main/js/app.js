import { createStore } from "./sre-core-v2.js";

const store = createStore(); // memória
// opcional: persistir no navegador
// store.useLocalStorage("SRE_DB");

// listar reservas
console.log(store.crud.readAll("reservas"));

// criar uma reserva (com todas validações)
const nova = store.crud.create("reservas", {
  professorId: "p1",
  dispositivoId: "dev2",
  aulaId: "h1",
  turmaId: "t1",
  disciplinaId: "d1",
  data: "2025-11-05",
});

// checar disponibilidade por data/slot
const disp = store.disponibilidadeDispositivos("2025-11-05", "h1");
console.table(disp.map(d => ({ id: d.id, modelo: d.modelo, ok: d.disponivelNoSlot })));
