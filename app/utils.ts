import { Evento } from "./types";

export function ordenarPorHorario(a: Evento, b: Evento) {
  if (!a.horario && !b.horario) return 0;
  if (!a.horario) return 1;
  if (!b.horario) return -1;
  return a.horario.localeCompare(b.horario);
}

// ---------- Datas dos itens de checklist ----------
// Mesmo formato dos eventos: dia, mes (0 a 11, como o getMonth do JS) e ano.

export type DataItem = { dia: number; mes: number; ano: number };

type ComDataOpcional = { dia?: number; mes?: number; ano?: number };

export function temData(item: ComDataOpcional): boolean {
  return item.dia !== undefined && item.mes !== undefined && item.ano !== undefined;
}

export function itemNoDia(item: ComDataOpcional, dia: number, mes: number, ano: number): boolean {
  return item.dia === dia && item.mes === mes && item.ano === ano;
}

// Converte a data do item para o formato do <input type="date"> ("2026-10-05").
// O input conta o mês de 1 a 12, por isso o +1.
export function dataParaInput(item: ComDataOpcional): string {
  if (!temData(item)) return "";
  const mm = String(item.mes! + 1).padStart(2, "0");
  const dd = String(item.dia!).padStart(2, "0");
  return `${item.ano}-${mm}-${dd}`;
}

// Faz o caminho de volta: do <input type="date"> para o nosso formato (mês de 0 a 11).
// Se o input for limpo, devolve null (= tirar a data do item).
export function inputParaData(valor: string): DataItem | null {
  if (!valor) return null;
  const [ano, mes, dia] = valor.split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  return { dia, mes: mes - 1, ano };
}

export type StatusPrazo = "atrasada" | "hoje" | "futura";

export function statusDoPrazo(item: ComDataOpcional, hoje: Date): StatusPrazo | null {
  if (!temData(item)) return null;
  const prazo = new Date(item.ano!, item.mes!, item.dia!).getTime();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
  if (prazo < inicioHoje) return "atrasada";
  if (prazo === inicioHoje) return "hoje";
  return "futura";
}

// "05/10" para mostrar de forma curta
export function formatarDataCurta(item: ComDataOpcional): string {
  if (!temData(item)) return "";
  const dd = String(item.dia!).padStart(2, "0");
  const mm = String(item.mes! + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}