"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Etiqueta, Evento } from "../types";

const etiquetasIniciais: Etiqueta[] = [
  { id: "pessoal", nome: "Pessoal", cor: "#7DB8D9" },
  { id: "trabalho", nome: "Trabalho", cor: "#E3A8B8" },
];

type Visualizacao = "semana" | "mes" | "semestre" | "ano";

type CalendarioContextType = {
  dataAtual: Date;
  mudarMes: (delta: number) => void;
  eventos: Evento[];
  adicionarEvento: (evento: Omit<Evento, "id">) => void;
  etiquetas: Etiqueta[];
  adicionarEtiqueta: (etiqueta: Omit<Etiqueta, "id">) => void;
  editarEtiqueta: (id: string, dados: Partial<Omit<Etiqueta, "id">>) => void;
  removerEtiqueta: (id: string) => void;
  expandido: boolean;
  setExpandido: (valor: boolean) => void;
  visualizacao: Visualizacao;
  setVisualizacao: (v: Visualizacao) => void;
};

const CalendarioContext = createContext<CalendarioContextType | null>(null);

export function CalendarioProvider({ children }: { children: ReactNode }) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>(etiquetasIniciais);
  const [expandido, setExpandido] = useState(false);
  const [visualizacao, setVisualizacao] = useState<Visualizacao>("mes");

  useEffect(() => {
    const eventosSalvos = localStorage.getItem("calendario-eventos");
    const etiquetasSalvas = localStorage.getItem("calendario-etiquetas");
    if (eventosSalvos) setEventos(JSON.parse(eventosSalvos));
    if (etiquetasSalvas) setEtiquetas(JSON.parse(etiquetasSalvas));
  }, []);

  useEffect(() => {
    localStorage.setItem("calendario-eventos", JSON.stringify(eventos));
  }, [eventos]);

  useEffect(() => {
    localStorage.setItem("calendario-etiquetas", JSON.stringify(etiquetas));
  }, [etiquetas]);

  function mudarMes(delta: number) {
    setDataAtual((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function adicionarEvento(evento: Omit<Evento, "id">) {
    setEventos((prev) => [...prev, { ...evento, id: crypto.randomUUID() }]);
  }

  function adicionarEtiqueta(etiqueta: Omit<Etiqueta, "id">) {
    setEtiquetas((prev) => [...prev, { ...etiqueta, id: crypto.randomUUID() }]);
  }

  function editarEtiqueta(id: string, dados: Partial<Omit<Etiqueta, "id">>) {
    setEtiquetas((prev) => prev.map((e) => (e.id === id ? { ...e, ...dados } : e)));
  }

  function removerEtiqueta(id: string) {
    setEtiquetas((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <CalendarioContext.Provider
      value={{
        dataAtual,
        mudarMes,
        eventos,
        adicionarEvento,
        etiquetas,
        adicionarEtiqueta,
        editarEtiqueta,
        removerEtiqueta,
        expandido,
        setExpandido,
        visualizacao,
        setVisualizacao,
      }}
    >
      {children}
    </CalendarioContext.Provider>
  );
}

export function useCalendario() {
  const ctx = useContext(CalendarioContext);
  if (!ctx) throw new Error("useCalendario precisa estar dentro de CalendarioProvider");
  return ctx;
}