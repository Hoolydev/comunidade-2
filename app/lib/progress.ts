"use client";

// Progresso do aluno persistido no navegador (localStorage). Simples e sem
// backend — cada dispositivo mantém o próprio progresso. Quando houver banco,
// basta trocar estas funções por chamadas à API mantendo a mesma assinatura.

import { modules, lessonKey, totalLessons } from "../content";

const COMPLETED_KEY = "hagios:completed"; // string[] de "modulo/aula"
const LAST_KEY = "hagios:last"; // "modulo/aula"
const DAYS_KEY = "hagios:days"; // string[] de datas ISO (yyyy-mm-dd)

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage indisponível (modo privado etc.) — ignora silenciosamente.
  }
}

export function getCompleted(): Set<string> {
  return new Set(read<string[]>(COMPLETED_KEY, []));
}

export function isCompleted(moduleSlug: string, lessonId: string): boolean {
  return getCompleted().has(lessonKey(moduleSlug, lessonId));
}

export function setCompleted(
  moduleSlug: string,
  lessonId: string,
  done: boolean,
): void {
  const set = getCompleted();
  const key = lessonKey(moduleSlug, lessonId);
  if (done) set.add(key);
  else set.delete(key);
  write(COMPLETED_KEY, [...set]);
}

export function getLast(): { moduleSlug: string; lessonId: string } | null {
  const value = read<string>(LAST_KEY, "");
  if (!value.includes("/")) return null;
  const [moduleSlug, lessonId] = value.split("/");
  return { moduleSlug, lessonId };
}

export function setLast(moduleSlug: string, lessonId: string): void {
  write(LAST_KEY, lessonKey(moduleSlug, lessonId));
}

export function moduleProgress(moduleSlug: string): number {
  const module = modules.find((m) => m.slug === moduleSlug);
  if (!module || module.lessons.length === 0) return 0;
  const completed = getCompleted();
  const done = module.lessons.filter((l) =>
    completed.has(lessonKey(moduleSlug, l.id)),
  ).length;
  return Math.round((done / module.lessons.length) * 100);
}

export function overallProgress(): number {
  const total = totalLessons();
  if (total === 0) return 0;
  return Math.round((getCompleted().size / total) * 100);
}

// Marca o dia de hoje como "ativo" e devolve a sequência (streak) de dias
// consecutivos até hoje.
export function touchStreak(): number {
  const today = new Date().toISOString().slice(0, 10);
  const days = new Set(read<string[]>(DAYS_KEY, []));
  days.add(today);
  write(DAYS_KEY, [...days]);
  return currentStreak();
}

export function currentStreak(): number {
  const days = new Set(read<string[]>(DAYS_KEY, []));
  if (days.size === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  // Conta dias consecutivos terminando hoje (ou ontem, se ainda não acessou hoje).
  const todayIso = cursor.toISOString().slice(0, 10);
  if (!days.has(todayIso)) cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!days.has(iso)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
