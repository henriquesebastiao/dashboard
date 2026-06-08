/* schedule.js — cronograma pessoal (EDITE AQUI).
   ───────────────────────────────────────────────────────────────
   Tudo que muda o conteúdo da agenda fica neste arquivo:
   CATEGORIES (cores/rótulos), WEEK (blocos por dia) e HABITS (hábitos).
   A lógica (bloco atual, próximo, progresso) está no fim do arquivo —
   normalmente não precisa mexer lá.
   ─────────────────────────────────────────────────────────────── */

/* ── categorias ─────────────────────────────────────────────────
   key → { label, color }. Use cores que combinem com o tema. */
export const CATEGORIES = {
  rotina: { label: "Rotina", color: "#a3a3a3" },
  saude: { label: "Saúde", color: "#34d399" },
  trabalho: { label: "Trabalho", color: "#60a5fa" },
  estudo: { label: "Estudo", color: "#c084fc" },
  refeicao: { label: "Refeição", color: "#fbbf24" },
  lazer: { label: "Lazer", color: "#f472b6" },
  sono: { label: "Sono", color: "#818cf8" },
};

/* ── blocos reutilizáveis ────────────────────────────────────────
   Cada bloco: { start: "HH:MM", end: "HH:MM", title, cat, note? }.
   Um bloco cujo `end` é menor que o `start` cruza a meia-noite (sono). */
const WEEKDAY = [
  { start: "06:30", end: "07:00", title: "Rotina matinal", cat: "rotina", note: "Água · alongamento" },
  { start: "07:00", end: "07:45", title: "Exercício", cat: "saude" },
  { start: "07:45", end: "08:30", title: "Café & banho", cat: "refeicao" },
  { start: "08:30", end: "12:00", title: "Trabalho — foco", cat: "trabalho" },
  { start: "12:00", end: "13:00", title: "Almoço", cat: "refeicao" },
  { start: "13:00", end: "17:30", title: "Trabalho", cat: "trabalho" },
  { start: "17:30", end: "18:30", title: "Caminhada / pausa", cat: "saude" },
  { start: "18:30", end: "19:30", title: "Estudo", cat: "estudo" },
  { start: "19:30", end: "20:30", title: "Jantar", cat: "refeicao" },
  { start: "20:30", end: "22:00", title: "Lazer", cat: "lazer" },
  { start: "22:00", end: "22:30", title: "Leitura & planejar amanhã", cat: "rotina" },
  { start: "22:30", end: "06:30", title: "Sono", cat: "sono" },
];

const SATURDAY = [
  { start: "08:00", end: "08:45", title: "Acordar & rotina", cat: "rotina" },
  { start: "08:45", end: "10:00", title: "Exercício longo", cat: "saude" },
  { start: "10:00", end: "11:00", title: "Café da manhã", cat: "refeicao" },
  { start: "11:00", end: "13:00", title: "Projetos pessoais", cat: "estudo" },
  { start: "13:00", end: "14:00", title: "Almoço", cat: "refeicao" },
  { start: "14:00", end: "18:00", title: "Lazer / social", cat: "lazer" },
  { start: "18:00", end: "19:00", title: "Tarefas de casa", cat: "rotina" },
  { start: "19:00", end: "20:00", title: "Jantar", cat: "refeicao" },
  { start: "20:00", end: "23:00", title: "Lazer", cat: "lazer" },
  { start: "23:00", end: "08:00", title: "Sono", cat: "sono" },
];

const SUNDAY = [
  { start: "08:30", end: "09:30", title: "Acordar devagar", cat: "rotina" },
  { start: "09:30", end: "10:30", title: "Exercício leve", cat: "saude" },
  { start: "10:30", end: "11:30", title: "Café da manhã", cat: "refeicao" },
  { start: "11:30", end: "13:00", title: "Revisão & planejar semana", cat: "estudo" },
  { start: "13:00", end: "14:00", title: "Almoço", cat: "refeicao" },
  { start: "14:00", end: "17:00", title: "Descanso / lazer", cat: "lazer" },
  { start: "17:00", end: "18:30", title: "Preparar a semana", cat: "rotina" },
  { start: "18:30", end: "19:30", title: "Jantar", cat: "refeicao" },
  { start: "19:30", end: "22:00", title: "Lazer", cat: "lazer" },
  { start: "22:00", end: "06:30", title: "Sono", cat: "sono" },
];

/* ── semana ──────────────────────────────────────────────────────
   Índice = dia da semana do JS: 0=Domingo … 6=Sábado.
   Troque um dia por um array próprio se quiser fugir do template. */
export const WEEK = {
  0: SUNDAY,
  1: WEEKDAY,
  2: WEEKDAY,
  3: WEEKDAY,
  4: WEEKDAY,
  5: WEEKDAY,
  6: SATURDAY,
};

/* ── hábitos diários ─────────────────────────────────────────────
   Marcação salva em localStorage por data. */
export const HABITS = [
  { id: "agua", label: "Beber 2L de água" },
  { id: "exercicio", label: "Exercitar-se" },
  { id: "leitura", label: "Ler 20 min" },
  { id: "meditar", label: "Meditar" },
  { id: "estudo", label: "Estudar" },
  { id: "planejar", label: "Planejar o dia" },
];

export const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* ═══════════════════════════════════════════════════════════════
   LÓGICA — bloco atual, próximo e progresso. Geralmente não mexer.
   ═══════════════════════════════════════════════════════════════ */
export function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function blocksFor(day) {
  return WEEK[day] || [];
}

/* duração do bloco em minutos (trata blocos que cruzam a meia-noite) */
export function blockSpan(b) {
  let span = timeToMin(b.end) - timeToMin(b.start);
  if (span <= 0) span += 1440;
  return span;
}

/* { current, next, progress } para um dado Date */
export function scheduleStatus(date = new Date()) {
  const day = date.getDay();
  const nowMin = date.getHours() * 60 + date.getMinutes();
  const blocks = blocksFor(day);

  let current = null;
  for (const b of blocks) {
    const s = timeToMin(b.start);
    const e = timeToMin(b.end);
    const wraps = e <= s;
    const inside = wraps ? nowMin >= s || nowMin < e : nowMin >= s && nowMin < e;
    if (inside) {
      current = b;
      break;
    }
  }

  let next = null;
  const upcoming = blocks
    .filter((b) => timeToMin(b.start) > nowMin)
    .sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
  if (upcoming.length) {
    next = upcoming[0];
  } else {
    for (let i = 1; i <= 7; i++) {
      const nb = blocksFor((day + i) % 7);
      if (nb.length) {
        next = nb[0];
        break;
      }
    }
  }

  let progress = 0;
  if (current) {
    let done = nowMin - timeToMin(current.start);
    if (done < 0) done += 1440;
    progress = Math.min(1, Math.max(0, done / blockSpan(current)));
  }

  return { current, next, progress };
}
