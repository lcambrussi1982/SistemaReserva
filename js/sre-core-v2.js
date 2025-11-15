import { db as cloudDb } from "./app-module.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";


// Core (client-side demo) com conflitos professor/turma e utilidades
const clone = (o) => JSON.parse(JSON.stringify(o));
const nowISO = () => new Date().toISOString();
const isISODate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const assert = (c, m) => { if(!c) throw new Error(m); };

const seed = {
  professores: [
    { id:"p1", nome:"Maria Silva", email:"maria@escola.com", senhaHash:"", ativo:true, disciplinas:["d1","d3"], turmas:["t1"] },
    { id:"p2", nome:"João Souza",  email:"joao@escola.com",  senhaHash:"", ativo:true, disciplinas:["d2","d4"], turmas:["t2"] },
  ],
  administradores: [
    { id:"a1", nome:"Administrador Padrão", email:"admin", senhaHash:"8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" },
    { id:"a2", nome:"Manutenção", email:"lcambrussi1982@gmail.com", senhaHash:"e1432bdd5a540d5b5cc4f9f224382f003bd615b782342f165c78475b78918354" }
  ],
  dispositivos: [
    { id:"dev1", tipo:"Tablet", marca:"Samsung", modelo:"Galaxy Tab A8", numeroSerie:"TAB001", status:"disponível", ultimaManutencao:"2025-10-20", localizacao:"Laboratório 1" },
    { id:"dev2", tipo:"Tablet", marca:"Lenovo",  modelo:"Tab M10",       numeroSerie:"TAB002", status:"disponível", ultimaManutencao:"2025-10-10", localizacao:"Laboratório 2" },
    { id:"dev3", tipo:"Notebook", marca:"Dell",   modelo:"Inspiron 14",   numeroSerie:"NB001", status:"disponível", ultimaManutencao:"2025-09-28", localizacao:"Laboratório 3" },
  ],
  turmas: [
    { id:"t1", nome:"1ºA", serie:"1º Ano", turno:"Manhã" },
    { id:"t2", nome:"2ºB", serie:"2º Ano", turno:"Tarde" },
  ],
  disciplinas: [
    { id:"d1", nome:"Matemática" },
    { id:"d2", nome:"Português" },
    { id:"d3", nome:"Ciências" },
    { id:"d4", nome:"História" },
  ],
  aulas: [
    { id:"h1", inicio:"07:00", fim:"07:50" },
    { id:"h2", inicio:"07:50", fim:"08:40" },
    { id:"h3", inicio:"08:40", fim:"09:30" },
    { id:"h4", inicio:"09:45", fim:"10:30" },
    { id:"h5", inicio:"10:30", fim:"11:20" },
    { id:"h6", inicio:"11:20", fim:"12:00" },
  ],
  reservas: [],
  logs: [],
  version: 4,
};

const KEY = "SRE_DB_V4";

function createStore(){
  let db = null;
  try{ db = JSON.parse(localStorage.getItem(KEY)); }catch{}
  if(!db) db = clone(seed);
  async function syncToCloud(){
    try{
      if(!cloudDb) return;
      await setDoc(
        doc(cloudDb, "sre_snapshots", "default"),
        { db, updatedAt: serverTimestamp() },
        { merge: true }
      );
    }catch(e){
      console.warn("[Cambrussi] Falha ao sincronizar com Firestore:", e);
    }
  }

  const save = ()=> {
    localStorage.setItem(KEY, JSON.stringify(db));
    // sincroniza snapshot com Firestore (best-effort, não bloqueante)
    syncToCloud();
  };
  const ensure = (t) => { if(!db[t]) throw new Error(`Tabela '${t}' não existe.`); };

  function log(usuario, acao, tabela, referenciaId, meta=null){
    db.logs.push({ id: `lg_${Date.now()}_${Math.random()}`, usuario, acao, tabela, referenciaId, meta, timestamp: nowISO() });
  }

  const crud = {
    create(t, rec, usuario="sistema"){
      ensure(t); const r = clone(rec); if(!r.id) r.id = `${t.slice(0,2)}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
      // regras básicas
      if(t==="professores"){ assert(r.nome && r.email && r.senhaHash, "Professor: nome/email/senha são obrigatórios."); }
      if(t==="dispositivos"){ assert(r.numeroSerie, "Dispositivo: serial é obrigatório."); }
      if(t==="reservas"){
        assert(isISODate(r.data), "Reserva: data inválida (YYYY-MM-DD).");
        assert(r.professorId && r.dispositivoId && r.aulaId, "Reserva: campos obrigatórios faltando.");
        assert(!conflitoDispositivo(db, r.dispositivoId, r.data, r.aulaId), "Dispositivo já reservado neste horário.");
        assert(!conflitoProfessor(db, r.professorId, r.data, r.aulaId), "Professor já tem reserva neste horário.");
        r.status = r.status || "ativa"; r.criadoEm = nowISO(); r.atualizadoEm = nowISO();
      }
      db[t].push(r); log(usuario,"create",t,r.id); save(); return clone(r);
    },
    readAll(t, pred=null){ ensure(t); const rows=clone(db[t]); return pred? rows.filter(pred) : rows; },
    readById(t, id){ ensure(t); const f=db[t].find(x=>x.id===id); return f? clone(f): null; },
    update(t, id, patch, usuario="sistema"){
      ensure(t); const i=db[t].findIndex(x=>x.id===id); if(i<0) throw new Error(`Registro ${id} não encontrado em '${t}'.`);
      const old = db[t][i]; const novo = { ...old, ...clone(patch) };
      if(t==="reservas"){
        assert(isISODate(novo.data), "Reserva: data inválida.");
        assert(!conflitoDispositivo(db, novo.dispositivoId, novo.data, novo.aulaId, old.id), "Dispositivo já reservado neste horário.");
        assert(!conflitoProfessor(db, novo.professorId, novo.data, novo.aulaId, old.id), "Professor já tem reserva neste horário.");
        novo.atualizadoEm = nowISO();
      }
      db[t][i] = novo; log(usuario,"update",t,id,{changed:Object.keys(patch)}); save(); return clone(novo);
    },
    delete(t, id, usuario="sistema"){
      ensure(t); const i=db[t].findIndex(x=>x.id===id); if(i<0) throw new Error(`Registro ${id} não encontrado em '${t}'.`);
      const [rem] = db[t].splice(i,1); log(usuario,"delete",t,id); save(); return clone(rem);
    },
  };

  function conflitoDispositivo(db, dispositivoId, data, aulaId, ignoreId=null){
    return db.reservas.some(r=>r.status==="ativa" && r.dispositivoId===dispositivoId && r.data===data && r.aulaId===aulaId && r.id!==ignoreId);
  }
  function conflitoProfessor(dbRef, professorId, data, aulaId, ignoreId=null){
    return dbRef.reservas.some(r=>r.status==="ativa" && r.professorId===professorId && r.data===data && r.aulaId===aulaId && r.id!==ignoreId);
  }
  function conflitoTurma(dbRef, turmaId, data, aulaId, ignoreId=null){
    return dbRef.reservas.some(r=>r.status==="ativa" && r.turmaId===turmaId && r.data===data && r.aulaId===aulaId && r.id!==ignoreId);
  }

  function disponibilidadeDispositivos(data, aulaId){
    assert(isISODate(data), "data deve ser YYYY-MM-DD.");
    const usados = new Set(db.reservas.filter(r=>r.data===data && r.aulaId===aulaId && r.status==="ativa").map(r=>r.dispositivoId));
    return db.dispositivos.map(d => ({ ...clone(d), disponivelNoSlot: d.status==="disponível" && !usados.has(d.id) }));
  }

  function cancelarReserva(id, usuario="sistema"){
    const r = crud.readById("reservas", id); assert(r, "Reserva não encontrada.");
    if(r.status==="cancelada") return r;
    return crud.update("reservas", id, { status:"cancelada" }, usuario);
  }

  // backup/restore
  function exportJSON(){ return JSON.stringify(db, null, 2); }
  function importJSON(text){ const obj = JSON.parse(text); assert(obj && obj.professores && obj.reservas, "Backup inválido."); db = obj; save(); }

  return { snapshot:()=>clone(db), crud, disponibilidadeDispositivos, cancelarReserva, exportJSON, importJSON };
}

export { createStore };
