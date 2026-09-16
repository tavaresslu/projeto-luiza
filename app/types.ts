export type Etiqueta = {
  id: string;
  nome: string;
  cor: string;
};

export type Evento = {
  id: string;
  dia: number;
  mes: number;
  ano: number;
  titulo: string;
  etiquetaId: string;
  horario?: string;
  horarioFim?: string;
};