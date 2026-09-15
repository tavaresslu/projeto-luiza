import { Evento } from "./types";

export function ordenarPorHorario(a: Evento, b: Evento) {
  if (!a.horario && !b.horario) return 0;
  if (!a.horario) return 1;
  if (!b.horario) return -1;
  return a.horario.localeCompare(b.horario);
}