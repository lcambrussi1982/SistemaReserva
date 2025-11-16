import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
} from "./firebase-config.js";

const btn = document.getElementById("btn-seed");
const logEl = document.getElementById("log");

function log(msg) {
  logEl.textContent += msg + "\n";
}

/* ==========================
   1) TURMAS 1º, 2º, 3º A–E
   ========================== */

const turmas = [
  // 1º ano
  { id: "1A", nome: "1º A", turno: "MANHA" },
  { id: "1B", nome: "1º B", turno: "MANHA" },
  { id: "1C", nome: "1º C", turno: "MANHA" },
  { id: "1D", nome: "1º D", turno: "MANHA" },
  { id: "1E", nome: "1º E", turno: "MANHA" },

  // 2º ano
  { id: "2A", nome: "2º A", turno: "MANHA" },
  { id: "2B", nome: "2º B", turno: "MANHA" },
  { id: "2C", nome: "2º C", turno: "MANHA" },
  { id: "2D", nome: "2º D", turno: "MANHA" },
  { id: "2E", nome: "2º E", turno: "MANHA" },

  // 3º ano
  { id: "3A", nome: "3º A", turno: "MANHA" },
  { id: "3B", nome: "3º B", turno: "MANHA" },
  { id: "3C", nome: "3º C", turno: "MANHA" },
  { id: "3D", nome: "3º D", turno: "MANHA" },
  { id: "3E", nome: "3º E", turno: "MANHA" },
];

/* ==========================
   2) DISCIPLINAS EM
   ========================== */

const disciplinas = [
  // LINGUAGENS
  { id: "LP",   nome: "Língua Portuguesa", area: "Linguagens" },
  { id: "LING", nome: "Língua Inglesa",    area: "Linguagens" },
  { id: "ART",  nome: "Arte",              area: "Linguagens" },
  { id: "EF",   nome: "Educação Física",   area: "Linguagens" },

  // MATEMÁTICA
  { id: "MAT",  nome: "Matemática",        area: "Matemática" },

  // NATUREZA
  { id: "BIO",  nome: "Biologia",          area: "Ciências da Natureza" },
  { id: "FIS",  nome: "Física",            area: "Ciências da Natureza" },
  { id: "QUI",  nome: "Química",           area: "Ciências da Natureza" },

  // HUMANAS
  { id: "HIS",  nome: "História",          area: "Ciências Humanas" },
  { id: "GEO",  nome: "Geografia",         area: "Ciências Humanas" },
  { id: "SOC",  nome: "Sociologia",        area: "Ciências Humanas" },
  { id: "FIL",  nome: "Filosofia",         area: "Ciências Humanas" },

  // TRANSVERSAL
  { id: "PV",   nome: "Projeto de Vida",   area: "Projeto de Vida" },
];

/* ==========================
   3) DISPOSITIVOS
   ========================== */

const dispositivos = [
  { id: "chromebook", tipo: "chromebook", total: 20, ativo: true },
  { id: "tablet",     tipo: "tablet",     total: 20, ativo: true },
];

/* ==========================
   4) HORÁRIOS
   ========================== */

const horarios = [
  { id: "1", label: "07:00 – 07:50", inicio: "07:00", fim: "07:50", ordem: 1 },
  { id: "2", label: "07:50 – 08:40", inicio: "07:50", fim: "08:40", ordem: 2 },
  { id: "3", label: "08:40 – 09:30", inicio: "08:40", fim: "09:30", ordem: 3 },
  // intervalo 09:30 – 09:45 (não vira aula)
  { id: "4", label: "09:45 – 10:30", inicio: "09:45", fim: "10:30", ordem: 4 },
  { id: "5", label: "10:30 – 11:20", inicio: "10:30", fim: "11:20", ordem: 5 },
  { id: "6", label: "11:20 – 12:00", inicio: "11:20", fim: "12:00", ordem: 6 },
];

/* ==========================
   Helper (não sobrescrever)
   ========================== */

async function setIfNotExists(col, id, data, label) {
  const ref = doc(db, col, id);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    log(`${label} ${id} já existe, pulando.`);
  } else {
    await setDoc(ref, data);
    log(`${label} criado: ${id}`);
  }
}

/* ==========================
   Execução do seed
   ========================== */

btn.addEventListener("click", async () => {
  log("Iniciando seed completo...");
  btn.disabled = true;

  try {
    // TURMAS
    log("\n--- Turmas ---");
    for (const t of turmas) {
      await setIfNotExists("turmas", t.id, {
        nome: t.nome,
        turno: t.turno,
      }, "Turma");
    }

    // DISCIPLINAS
    log("\n--- Disciplinas ---");
    for (const d of disciplinas) {
      await setIfNotExists("disciplinas", d.id, {
        nome: d.nome,
        area: d.area,
      }, "Disciplina");
    }

    // DISPOSITIVOS
    log("\n--- Dispositivos ---");
    for (const disp of dispositivos) {
      await setIfNotExists("dispositivos", disp.id, {
        tipo: disp.tipo,
        total: disp.total,
        ativo: disp.ativo,
      }, "Dispositivo");
    }

    // HORÁRIOS
    log("\n--- Horários ---");
    for (const h of horarios) {
      await setIfNotExists("horarios", h.id, {
        label: h.label,
        inicio: h.inicio,
        fim: h.fim,
        ordem: h.ordem,
      }, "Horário");
    }

    log("\nSeed concluído com sucesso ✅");
  } catch (err) {
    console.error(err);
    log("\n❌ Erro ao rodar seed: " + err.message);
  } finally {
    btn.disabled = false;
  }
});
