"use client";

import { useState } from "react";
import { cores } from "../theme";
import { useCalendario } from "../context/CalendarioContext";
import { ordenarPorHorario } from "../utils";
import MesGrid from "./MesGrid";
import PainelNovoEvento from "./PainelNovoEvento";

const opcoesVisualizacao = [
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "semestre", label: "Semestre" },
  { id: "ano", label: "Ano" },
] as const;

export default function CalendarioExpandido() {
  const { dataAtual, mudarMes, eventos, etiquetas, visualizacao, setVisualizacao, setExpandido } =
    useCalendario();

  const [diaSelecionado, setDiaSelecionado] = useState<{ dia: number; mes: number; ano: number } | null>(null);
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState<string | undefined>(undefined);

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  function corDaEtiqueta(id: string) {
    return etiquetas.find((e) => e.id === id)?.cor ?? cores.textoSecundario;
  }

  function abrirDia(dia: number, mesDia: number, anoDia: number) {
    setEventoSelecionadoId(undefined);
    setDiaSelecionado({ dia, mes: mesDia, ano: anoDia });
  }

  function abrirEvento(eventoId: string) {
    const evento = eventos.find((e) => e.id === eventoId);
    if (!evento) return;
    setDiaSelecionado({ dia: evento.dia, mes: evento.mes, ano: evento.ano });
    setEventoSelecionadoId(eventoId);
  }

  function fecharPainel() {
    setDiaSelecionado(null);
    setEventoSelecionadoId(undefined);
  }

  const inicioSemana = new Date(dataAtual);
  inicioSemana.setDate(dataAtual.getDate() - dataAtual.getDay());
  const diasDaSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setDate(inicioSemana.getDate() + i);
    return d;
  });

  const inicioSemestre = mes < 6 ? 0 : 6;
  const mesesDoSemestre = Array.from({ length: 6 }, (_, i) => inicioSemestre + i);
  const mesesDoAno = Array.from({ length: 12 }, (_, i) => i);

  const titulo =
    visualizacao === "semana"
      ? `Semana de ${inicioSemana.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
      : visualizacao === "mes"
      ? dataAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      : visualizacao === "semestre"
      ? `${inicioSemestre === 0 ? "1º" : "2º"} semestre de ${ano}`
      : `${ano}`;

  return (
    <div className="relative flex min-h-[calc(100vh-3rem)] flex-col rounded-2xl p-6 shadow-sm" style={{ backgroundColor: cores.fundoCard, border: `1px solid ${cores.borda}` }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => mudarMes(-1)} style={{ color: cores.textoSecundario }}>‹</button>
          <span className="text-lg font-medium capitalize" style={{ color: cores.textoPrincipal }}>{titulo}</span>
          <button onClick={() => mudarMes(1)} style={{ color: cores.textoSecundario }}>›</button>
        </div>
        <button onClick={() => setExpandido(false)} className="text-xs" style={{ color: cores.textoSecundario }}>
          Recolher
        </button>
      </div>

      <div className="mb-4 flex gap-1 rounded-full p-1" style={{ backgroundColor: cores.fundo, width: "fit-content" }}>
        {opcoesVisualizacao.map((op) => (
          <button
            key={op.id}
            onClick={() => setVisualizacao(op.id)}
            className="rounded-full px-3 py-1 text-xs"
            style={{
              backgroundColor: visualizacao === op.id ? cores.fundoCard : "transparent",
              color: cores.textoPrincipal,
              boxShadow: visualizacao === op.id ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
          >
            {op.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col min-h-0">
        {visualizacao === "mes" && (
          <MesGrid mes={mes} ano={ano} tamanho="grande" onClickDia={abrirDia} onClickEvento={abrirEvento} />
        )}

        {visualizacao === "semana" && (
          <div className="grid flex-1 grid-cols-7 gap-2">
            {diasDaSemana.map((d) => {
              const eventosDoDia = eventos
                .filter((e) => e.dia === d.getDate() && e.mes === d.getMonth() && e.ano === d.getFullYear())
                .sort(ordenarPorHorario);
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => abrirDia(d.getDate(), d.getMonth(), d.getFullYear())}
                  className="flex h-full flex-col items-start gap-1 rounded-xl p-2 text-left"
                  style={{ border: `1px solid ${cores.borda}` }}
                >
                  <span className="text-xs font-medium capitalize" style={{ color: cores.textoSecundario }}>
                    {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                  </span>
                  <span className="text-sm font-medium" style={{ color: cores.textoPrincipal }}>{d.getDate()}</span>
                  <div className="flex w-full flex-col gap-1">
                    {eventosDoDia.map((e) => (
                      <span
                        key={e.id}
                        role="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          abrirEvento(e.id);
                        }}
                        className="truncate rounded-md px-1.5 py-0.5 text-left text-[10px] text-white hover:opacity-80"
                        style={{ backgroundColor: corDaEtiqueta(e.etiquetaId) }}
                      >
                        {e.horario ? `${e.horario} ` : ""}{e.titulo}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {visualizacao === "semestre" && (
          <div className="grid grid-cols-3 gap-4">
            {mesesDoSemestre.map((m) => (
              <MesGrid key={m} mes={m} ano={ano} tamanho="pequeno" onClickDia={abrirDia} />
            ))}
          </div>
        )}

        {visualizacao === "ano" && (
          <div className="grid grid-cols-4 gap-4">
            {mesesDoAno.map((m) => (
              <MesGrid key={m} mes={m} ano={ano} tamanho="pequeno" onClickDia={abrirDia} />
            ))}
          </div>
        )}
      </div>

      {diaSelecionado && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          onClick={fecharPainel}
        >
          {/* stopPropagation: clicar dentro do painel não deve fechar o overlay */}
          <div className="w-80" onClick={(e) => e.stopPropagation()}>
            <PainelNovoEvento
              dia={diaSelecionado.dia}
              mes={diaSelecionado.mes}
              ano={diaSelecionado.ano}
              eventoInicialId={eventoSelecionadoId}
              onFechar={fecharPainel}
            />
          </div>
        </div>
      )}
    </div>
  );
}