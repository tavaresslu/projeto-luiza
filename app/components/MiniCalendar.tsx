"use client";

import { useState } from "react";
import { cores } from "../theme";
import { useCalendario } from "../context/CalendarioContext";
import MesGrid from "./MesGrid";
import PainelNovoEvento from "./PainelNovoEvento";

export default function MiniCalendar() {
  const { dataAtual, mudarMes, setExpandido } = useCalendario();
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();
  const nomeMes = dataAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="relative rounded-2xl p-4 shadow-sm" style={{ backgroundColor: cores.fundoCard, border: `1px solid ${cores.borda}` }}>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => mudarMes(-1)} style={{ color: cores.textoSecundario }}>‹</button>
        <button onClick={() => setExpandido(true)} className="text-sm font-medium capitalize hover:underline" style={{ color: cores.textoPrincipal }} title="Expandir calendário">
          {nomeMes}
        </button>
        <button onClick={() => mudarMes(1)} style={{ color: cores.textoSecundario }}>›</button>
      </div>

      <MesGrid mes={mes} ano={ano} tamanho="mini" onClickDia={(dia) => setDiaSelecionado(dia)} />

      {diaSelecionado && (
        <div className="absolute left-0 top-0 z-10 w-full">
          <PainelNovoEvento dia={diaSelecionado} mes={mes} ano={ano} onFechar={() => setDiaSelecionado(null)} />
        </div>
      )}
    </div>
  );
}