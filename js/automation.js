
import { createStore } from "./sre-core-v2.js";
const store = createStore();

/** Cache simples em memória por data+aulaId */
const _cache = new Map();

export function runAutoMaintenance() {
  // 1) Concluir reservas passadas para não poluir a UX
  const today = new Date().toISOString().slice(0,10);
  const s = store.snapshot();
  s.reservas
    .filter(r => r.status==="ativa" && r.data < today)
    .forEach(r => store.crud.update("reservas", r.id, { status: "concluida" }, "auto"));

  // 2) Normaliza dispositivos sem status
  s.dispositivos
    .filter(d => !d.status)
    .forEach(d => store.crud.update("dispositivos", d.id, { status: "disponível" }, "auto"));

  // 3) Limpa cache antigo
  _cache.clear();
}

/** Retorna contadores por tipo para o usuário, para sugerir tipo preferido */
export function suggestTypeForUser(userId) {
  const s = store.snapshot();
  const ultimas = [...s.reservas]
    .filter(r => r.professorId===userId)
    .sort((a,b)=> (b.criadoEm||"") < (a.criadoEm||"") ? -1 : 1)
    .slice(0,10);
  const counts = {};
  ultimas.forEach(r => {
    const d = s.dispositivos.find(x=>x.id===r.dispositivoId);
    if(!d) return;
    counts[d.tipo] = (counts[d.tipo]||0) + 1;
  });
  // retorna o tipo com maior frequência
  const best = Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0] || null;
  return { best, counts };
}

/** Pré-computa disponibilidade por tipo para uma data + aulaId */
export function availabilityByType(date, aulaId) {
  const key = `${date}#${aulaId}`;
  if(_cache.has(key)) return _cache.get(key);
  const s = store.snapshot();
  const disp = store.disponibilidadeDispositivos(date, aulaId);
  const map = {};
  disp.forEach(d => {
    if(!map[d.tipo]) map[d.tipo] = { livres:0, total:0 };
    map[d.tipo].total += 1;
    if(d.disponivelNoSlot && d.status==="disponível") map[d.tipo].livres += 1;
  });
  _cache.set(key, map);
  return map;
}

/** Escolhe automaticamente o "melhor" dispositivo livre:
 *  - preferência: dispositivo menos utilizado historicamente (balancear desgaste)
 *  - fallback: primeiro livre
 */
export function smartPickDevice(type, date, aulaId) {
  const s = store.snapshot();
  const livres = store.disponibilidadeDispositivos(date, aulaId)
    .filter(d => d.tipo===type && d.disponivelNoSlot && d.status==="disponível");

  if(livres.length <= 1) return livres[0] || null;

  const uso = {};
  s.reservas.forEach(r => {
    uso[r.dispositivoId] = (uso[r.dispositivoId]||0) + 1;
  });

  // escolhe o com menor uso
  let best = livres[0];
  let bestScore = uso[best.id] || 0;
  livres.forEach(d => {
    const score = uso[d.id] || 0;
    if(score < bestScore) { best = d; bestScore = score; }
  });
  return best;
}
