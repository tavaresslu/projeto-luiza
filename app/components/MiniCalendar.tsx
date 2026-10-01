"use client";

import { cores } from "../theme";
import { useCalendario } from "../context/CalendarioContext";
import MesGrid from "./MesGrid";

export default function MiniCalendar() {
  const { dataAtual, mudarMes, setExpandido } = useCalendario();

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  const nomeMes = dataAtual.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="relative rounded-2xl p-4 shadow-sm"
      style={{
        backgroundColor: cores.fundoCard,
        border: `1px solid ${cores.borda}`,
      }}
    >
      {/* Cabeçalho do calendário */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            mudarMes(-1);
          }}
          style={{ color: cores.textoSecundario }}
        >
          ‹
        </button>

        <button
          onClick={() => setExpandido(true)}
          className="text-sm font-medium capitalize hover:underline"
          style={{ color: cores.textoPrincipal }}
          title="Expandir calendário"
        >
          {nomeMes}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            mudarMes(1);
          }}
          style={{ color: cores.textoSecundario }}
        >
          ›
        </button>
      </div>

      {/* Calendário mensal */}
      <div
        onClick={() => setExpandido(true)}
        style={{ cursor: "pointer" }}
      >
        <MesGrid
          mes={mes}
          ano={ano}
          tamanho="mini"
          onClickDia={() => setExpandido(true)}
        />
      </div>
    </div>
  );
}