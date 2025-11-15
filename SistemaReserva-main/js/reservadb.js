// ============================================
// 🏫 SISTEMA DE RESERVAS DE DISPOSITIVOS ESCOLARES — Core v2
// - CRUD genérico com políticas por tabela
// - Validações, integridade, conflitos, unicidade
// - Persistência plugável (memória | localStorage)
// ============================================

// ===== Util =====
const nowISO = () => new Date().toISOString();
const clone = (o) => JSON.parse(JSON.stringify(o));
const genId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const isISODate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTimeHHMM = (s) => /^\d{2}:\d{2}$/.test(s);

// ===== Enums simples =====
const StatusDispositivo = /** @type {const} */ ({
  DISPONIVEL: "disponível",
  MANUTENCAO: "em manutenção",
  INATIVO: "inativo",
});
const StatusReserva = /** @type {const} */ ({
  ATIVA: "ativa",
  CANCELADA: "cancelada",
});

// ===== Persistência =====
// Interface mínima: storage.get() | storage.set(db)
function createMemoryStorage(initial) {
  let state = clone(initial);
  return {
    get: () => clone(state),
    set: (db) => { state = clone(db); },
  };
}
function createLocalStorageAdapter(key = "SRE_DB") {
  return {
    get: () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    },
    set: (db) => {
      localStorage.setItem(key, JSON.stringify(db));
    },
  };
}

// ===== DB inicial (seed) =====
const seed = {
  professores: [
    { id: "p1", nome: "Maria Silva", email: "maria@escola.com", senha: "hashed_1234", telefone: "(11) 99876-1234", ativo: true, disciplinas: ["d1", "d3"] },
    { id: "p2", nome: "João Souza",  email: "joao@escola.com",  senha: "hashed_abcd", telefone: "(11) 98765-1111", ativo: true, disciplinas: ["d2", "d4"] },
    { id: "p3", nome: "Carla Mendes",email: "carla@escola.com", senha: "hashed_9999", telefone: "(11) 99123-2222", ativo: true, disciplinas: ["d1"] },
  ],
  administradores: [
    { id: "a1", nome: "Coordenador Geral", email: "adm@escola.com", senha: "hashed_admin123", telefone: "(11) 90000-0001", permissao: "total" },
  ],
  dispositivos: [
    { id: "dev1", tipo: "Tablet",     marca: "Samsung", modelo: "Galaxy Tab A8", numeroSerie: "TAB001", status: StatusDispositivo.DISPONIVEL,  ultimaManutencao: "2025-10-20", localizacao: "Laboratório 1" },
    { id: "dev2", tipo: "Tablet",     marca: "Lenovo",  modelo: "Tab M10",       numeroSerie: "TAB002", status: StatusDispositivo.DISPONIVEL,  ultimaManutencao: "2025-10-10", localizacao: "Laboratório 2" },
    { id: "dev3", tipo: "Chromebook", marca: "Acer",    modelo: "Spin 311",      numeroSerie: "CH001",  status: StatusDispositivo.MANUTENCAO, ultimaManutencao: "2025-11-01", localizacao: "Oficina" },
    { id: "dev4", tipo: "Notebook",   marca: "Dell",    modelo: "Inspiron 14",   numeroSerie: "NB001",  status: StatusDispositivo.DISPONIVEL,  ultimaManutencao: "2025-09-28", localizacao: "Laboratório 3" },
  ],
  turmas: [
    { id: "t1", nome: "1ºA", serie: "1º Ano", turno: "Manhã" },
    { id: "t2", nome: "2ºB", serie: "2º Ano", turno: "Tarde" },
    { id: "t3", nome: "3ºC", serie: "3º Ano", turno: "Manhã" },
  ],
  disciplinas: [
    { id: "d1", nome: "Matemática" },
    { id: "d2", nome: "Português" },
    { id: "d3", nome: "Ciências" },
    { id: "d4", nome: "História" },
  ],
  aulas: [
    { id: "h1", inicio: "07:00", fim: "07:50" },
    { id: "h2", inicio: "07:50", fim: "08:40" },
    { id: "h3", inicio: "08:40", fim: "09:30" },
    { id: "h4", inicio: "09:45", fim: "10:30" },
    { id: "h5", inicio: "10:30", fim: "11:20" },
    { id: "h6", inicio: "11:20", fim: "12:00" },
  ],
  reservas: [
    { id: "r1", professorId: "p1", dispositivoId: "dev1", aulaId: "h2", turmaId: "t1", disciplinaId: "d1", data: "2025-11-05", status: StatusReserva.ATIVA, criadoEm: "2025-11-04T10:00:00Z", atualizadoEm: "2025-11-04T10:00:00Z" },
    { id: "r2", professorId: "p2", dispositivoId: "dev4", aulaId: "h5", turmaId: "t2", disciplinaId: "d4", data: "2025-11-05", status: StatusReserva.ATIVA, criadoEm: "2025-11-04T11:30:00Z", atualizadoEm: "2025-11-04T11:30:00Z" },
  ],
  logs: [],
};

// ===== Validações por entidade =====
const Validators = {
  professor(p) {
    assert(p && p.nome && p.email && p.senha, "Professor: nome, email e senha são obrigatórios.");
    if (p.disciplinas) assert(Array.isArray(p.disciplinas), "Professor: disciplinas deve ser array.");
  },
  administrador(a) {
    assert(a && a.nome && a.email && a.senha, "Administrador: nome, email e senha são obrigatórios.");
  },
  dispositivo(d) {
    const ok = Object.values(StatusDispositivo);
    assert(d && d.tipo && d.marca && d.modelo && d.numeroSerie, "Dispositivo: tipo/marca/modelo/serial obrigatórios.");
    assert(ok.includes(d.status), `Dispositivo: status inválido. Use ${ok.join(", ")}.`);
    if (d.ultimaManutencao) assert(isISODate(d.ultimaManutencao), "Dispositivo: ultimaManutencao precisa ser YYYY-MM-DD.");
  },
  turma(t) {
    assert(t && t.nome, "Turma: nome é obrigatório.");
  },
  disciplina(d) {
    assert(d && d.nome, "Disciplina: nome é obrigatório.");
  },
  aula(h) {
    assert(h && isTimeHHMM(h.inicio) && isTimeHHMM(h.fim), "Aula: horários devem ser HH:MM.");
  },
  reserva(r, db) {
    assert(r && r.professorId && r.dispositivoId && r.aulaId && r.turmaId && r.disciplinaId && r.data,
      "Reserva: professorId, dispositivoId, aulaId, turmaId, disciplinaId e data são obrigatórios.");
    assert(isISODate(r.data), "Reserva: data precisa ser YYYY-MM-DD.");

    const prof = db.professores.find(x => x.id === r.professorId);
    assert(prof, "Reserva: professor inexistente.");
    assert(prof.ativo, "Reserva: professor inativo.");

    const dev = db.dispositivos.find(x => x.id === r.dispositivoId);
    assert(dev, "Reserva: dispositivo inexistente.");
    assert(dev.status === StatusDispositivo.DISPONIVEL, "Reserva: dispositivo não está disponível.");

    const aula = db.aulas.find(x => x.id === r.aulaId);
    assert(aula, "Reserva: aula inexistente.");

    const turma = db.turmas.find(x => x.id === r.turmaId);
    assert(turma, "Reserva: turma inexistente.");

    const disc = db.disciplinas.find(x => x.id === r.disciplinaId);
    assert(disc, "Reserva: disciplina inexistente.");
  },
};

// ===== Regras de conflito =====
function conflitoDispositivo(db, dispositivoId, data, aulaId, reservaIgnoradaId = null) {
  return db.reservas.some(r =>
    r.status === StatusReserva.ATIVA &&
    r.dispositivoId === dispositivoId &&
    r.data === data &&
    r.aulaId === aulaId &&
    r.id !== reservaIgnoradaId
  );
}
function conflitoProfessor(db, professorId, data, aulaId, reservaIgnoradaId = null) {
  return db.reservas.some(r =>
    r.status === StatusReserva.ATIVA &&
    r.professorId === professorId &&
    r.data === data &&
    r.aulaId === aulaId &&
    r.id !== reservaIgnoradaId
  );
}

// ===== Políticas por tabela (hooks) =====
const Policies = {
  professores: {
    beforeCreate(db, rec) {
      Validators.professor(rec);
      assert(!db.professores.some(p => p.email === rec.email), "Professor: e-mail já cadastrado.");
    },
    beforeUpdate(db, oldRec, patch) {
      const novoEmail = patch.email ?? oldRec.email;
      if (novoEmail !== oldRec.email) {
        assert(!db.professores.some(p => p.email === novoEmail && p.id !== oldRec.id), "Professor: e-mail já cadastrado.");
      }
      if (patch.disciplinas) assert(Array.isArray(patch.disciplinas), "Professor: disciplinas deve ser array.");
    },
  },
  administradores: {
    beforeCreate(db, rec) {
      Validators.administrador(rec);
      assert(!db.administradores.some(a => a.email === rec.email), "Administrador: e-mail já cadastrado.");
    },
    beforeUpdate(db, oldRec, patch) {
      const novoEmail = patch.email ?? oldRec.email;
      if (novoEmail !== oldRec.email) {
        assert(!db.administradores.some(a => a.email === novoEmail && a.id !== oldRec.id), "Administrador: e-mail já cadastrado.");
      }
    },
  },
  dispositivos: {
    beforeCreate(db, rec) {
      Validators.dispositivo(rec);
      assert(!db.dispositivos.some(d => d.numeroSerie === rec.numeroSerie), "Dispositivo: número de série já cadastrado.");
    },
    beforeUpdate(db, oldRec, patch) {
      const novoSerie = patch.numeroSerie ?? oldRec.numeroSerie;
      if (novoSerie !== oldRec.numeroSerie) {
        assert(!db.dispositivos.some(d => d.numeroSerie === novoSerie && d.id !== oldRec.id), "Dispositivo: número de série já cadastrado.");
      }
      if (patch.status && !Object.values(StatusDispositivo).includes(patch.status)) {
        throw new Error("Dispositivo: status inválido.");
      }
    },
  },
  reservas: {
    beforeCreate(db, rec) {
      Validators.reserva(rec, db);
      assert(!conflitoDispositivo(db, rec.dispositivoId, rec.data, rec.aulaId), "Conflito: dispositivo já reservado neste horário/data.");
      assert(!conflitoProfessor(db, rec.professorId, rec.data, rec.aulaId), "Conflito: professor já possui reserva neste horário/data.");
      rec.status = rec.status ?? StatusReserva.ATIVA;
      rec.criadoEm = nowISO();
      rec.atualizadoEm = nowISO();
    },
    beforeUpdate(db, oldRec, patch) {
      const novo = { ...oldRec, ...patch };
      Validators.reserva(novo, db);
      assert(!conflitoDispositivo(db, novo.dispositivoId, novo.data, novo.aulaId, oldRec.id), "Conflito: dispositivo já reservado neste horário/data.");
      assert(!conflitoProfessor(db, novo.professorId, novo.data, novo.aulaId, oldRec.id), "Conflito: professor já possui reserva neste horário/data.");
      if (patch.status && !Object.values(StatusReserva).includes(patch.status)) {
        throw new Error("Reserva: status inválido.");
      }
      patch.atualizadoEm = nowISO();
    },
  },
};

// ===== Logger =====
function logarAcao(db, usuario, acao, tabela, referenciaId, meta = null) {
  db.logs.push({
    id: genId(),
    usuario,
    acao,      // create | update | delete
    tabela,    // nome da tabela
    referenciaId,
    meta,
    timestamp: nowISO(),
  });
}

// ===== Core Store =====
function createStore({ storage = createMemoryStorage(seed) } = {}) {
  // carrega
  let db = storage.get() ?? clone(seed);

  function save() { storage.set(db); }

  const ensureTable = (t) => { if (!db[t]) throw new Error(`Tabela '${t}' não existe.`); };

  // CRUD genérico com hooks
  const crud = {
    create(tabela, registro, usuario = "sistema") {
      ensureTable(tabela);
      const hooks = Policies[tabela];
      const rec = clone(registro);
      if (!rec.id) rec.id = genId();
      hooks?.beforeCreate?.(db, rec);
      db[tabela].push(rec);
      logarAcao(db, usuario, "create", tabela, rec.id);
      save();
      return clone(rec);
    },

    readAll(tabela, predicate = null) {
      ensureTable(tabela);
      const rows = clone(db[tabela]);
      return predicate ? rows.filter(predicate) : rows;
    },

    readById(tabela, id) {
      ensureTable(tabela);
      const found = db[tabela].find((r) => r.id === id);
      return found ? clone(found) : null;
    },

    update(tabela, id, patch, usuario = "sistema") {
      ensureTable(tabela);
      const idx = db[tabela].findIndex(r => r.id === id);
      if (idx === -1) throw new Error(`Registro ${id} não encontrado em '${tabela}'.`);
      const oldRec = db[tabela][idx];
      const hooks = Policies[tabela];
      const p = clone(patch);
      hooks?.beforeUpdate?.(db, oldRec, p);
      const novo = { ...oldRec, ...p };
      db[tabela][idx] = novo;
      logarAcao(db, usuario, "update", tabela, id, { changed: Object.keys(p) });
      save();
      return clone(novo);
    },

    delete(tabela, id, usuario = "sistema") {
      ensureTable(tabela);
      const idx = db[tabela].findIndex(r => r.id === id);
      if (idx === -1) throw new Error(`Registro ${id} não encontrado em '${tabela}'.`);
      const removed = db[tabela].splice(idx, 1)[0];
      logarAcao(db, usuario, "delete", tabela, id);
      save();
      return clone(removed);
    },
  };

  // ===== Helpers de domínio =====
  function existeConflitoReserva(dispositivoId, data, aulaId, opts = {}) {
    const { ignorarReservaId = null } = opts;
    return conflitoDispositivo(db, dispositivoId, data, aulaId, ignorarReservaId);
  }

  function disponibilidadeDispositivos(data, aulaId) {
    assert(isISODate(data), "data deve ser YYYY-MM-DD.");
    const usados = new Set(
      db.reservas
        .filter(r => r.data === data && r.aulaId === aulaId && r.status === StatusReserva.ATIVA)
        .map(r => r.dispositivoId)
    );
    return db.dispositivos.map(d => ({
      ...clone(d),
      disponivelNoSlot: d.status === StatusDispositivo.DISPONIVEL && !usados.has(d.id),
    }));
  }

  function reservasDoProfessor(professorId, { data = null } = {}) {
    return db.reservas.filter(r =>
      r.professorId === professorId && (!data || r.data === data)
    ).map(clone);
  }

  function cancelarReserva(reservaId, usuario = "sistema") {
    const r = crud.readById("reservas", reservaId);
    assert(r, "Reserva não encontrada.");
    if (r.status === StatusReserva.CANCELADA) return r;
    return crud.update("reservas", reservaId, { status: StatusReserva.CANCELADA }, usuario);
  }

  // ===== API pública =====
  return {
    // dados “vivos” somente via métodos; use snapshots para debug
    snapshot: () => clone(db),

    crud,
    existeConflitoReserva,
    disponibilidadeDispositivos,
    reservasDoProfessor,
    cancelarReserva,

    // troca/inspeciona storage
    useLocalStorage(key = "SRE_DB") {
      const ls = createLocalStorageAdapter(key);
      const fromLS = ls.get();
      if (fromLS) db = fromLS;
      else ls.set(db);
      // rebind persist
      storage = ls;
    },
  };
}

// ===== Export =====
export {
  createStore,
  StatusDispositivo,
  StatusReserva,
};
