"use client";

import { useState } from "react";
import { cores } from "../theme";

type Evento = {
  dia: number;
  categoria: "azul" | "rosa" | "verde" | "amarelo";
};

const eventosExemplo: Evento[] = [
  { dia: 5, categoria: "azul" },
  { dia: 12, categoria: "rosa" },
  { dia: 20, categoria: "verde" },
];

const corCategoria: Record<Evento["categoria"], string> = {
  azul: cores.categoriaAzul,
  rosa: cores.categoriaRosa,
  verde: cores.categoriaVerde,
  amarelo: cores.categoriaAmarelo,
};

export default function MiniCalendar() {
  const [dataAtual, setDataAtual] = useState(new Date());

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  const nomeMes = dataAtual.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  function mudarMes(delta: number) {
    setDataAtual(new Date(ano, mes + delta, 1));
  }

  const celulas = [];
  for (let i = 0; i < primeiroDiaSemana; i++) {
    celulas.push(<div key={`vazio-${i}`} />);
  }
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const evento = eventosExemplo.find((e) => e.dia === dia);
    celulas.push(
      <button
        key={dia}
        className="relative flex h-7 w-7 items-center justify-center rounded-full text-xs hover:bg-black/5"
        style={{ color: cores.textoPrincipal }}
      >
        {dia}
        {evento && (
          <span
            className="absolute bottom-0.5 h-1 w-1 rounded-full"
            style={{ backgroundColor: corCategoria[evento.categoria] }}
          />
        )}
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 shadow-sm"
      style={{ backgroundColor: cores.fundoCard, border: `1px solid ${cores.borda}` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => mudarMes(-1)} style={{ color: cores.textoSecundario }}>
          ‹
        </button>
        <span className="text-sm font-medium capitalize" style={{ color: cores.textoPrincipal }}>
          {nomeMes}
        </span>
        <button onClick={() => mudarMes(1)} style={{ color: cores.textoSecundario }}>
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <span key={i} className="text-[10px] font-medium" style={{ color: cores.textoSecundario }}>
            {d}
          </span>
        ))}
        {celulas}
      </div>
    </div>
  );
}