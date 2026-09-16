"use client";

import { useState } from "react";
import { cores, hexParaRgba, hexEscurecer } from "../theme";
import { useCalendario } from "../context/CalendarioContext";
import { ordenarPorHorario } from "../utils";
import { Evento } from "../types";
import MesGrid from "./MesGrid";
import PainelNovoEvento from "./PainelNovoEvento";

const opcoesVisualizacao = [
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "semestre", label: "Semestre" },
  { id: "ano", label: "Ano" },
] as const;

const HORA_INICIO = 5;
const HORA_FIM = 23;
const ALTURA_HORA = 48;
const HORAS_EXIBIDAS = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i);

function minutosDesdeInicioDoDia(horario: string) {
  const [h, m] = horario.split(":").map(Number);
  return (h - HORA_INICIO) * 60 + m;
}

function posicaoDoEvento(evento: Evento) {
  if (!evento.horario) return null;
  const inicioMin = minutosDesdeInicioDoDia(evento.horario);
  const fimMin = evento.horarioFim ? minutosDesdeInicioDoDia(evento.horarioFim) : inicioMin + 60;
  const top = Math.max(0, (inicioMin / 60) * ALTURA_HORA);
  const altura = Math.max(22, ((fimMin - inicioMin) / 60) * ALTURA_HORA);
  return { top, altura };
}

// Descobre quais compromissos se sobrepõem no horário e reparte a largura da
// coluna entre eles, em vez de deixar um em cima do outro escondendo o de baixo
type EventoComLayout = { evento: Evento; coluna: number; totalColunas: number };

function calcularLayoutSemanal(eventosOrdenados: Evento[]): EventoComLayout[] {
  type Item = { evento: Evento; inicio: number; fim: number };
  const itens: Item[] = eventosOrdenados.map((e) => {
    const inicio = minutosDesdeInicioDoDia(e.horario!);
    const fimBruto = e.horarioFim ? minutosDesdeInicioDoDia(e.horarioFim) : inicio + 60;
    return { evento: e, inicio, fim: Math.max(fimBruto, inicio + 1) };
  });

  const resultado: EventoComLayout[] = [];
  let clusterAtual: Item[] = [];
  let fimClusterAtual = -Infinity;

  function processarCluster(cluster: Item[]) {
    const fimDasColunas: number[] = [];
    const colunaPorItem = new Map<Item, number>();

    for (const item of cluster) {
      let colunaEncontrada = -1;
      for (let c = 0; c < fimDasColunas.length; c++) {
        if (fimDasColunas[c] <= item.inicio) {
          colunaEncontrada = c;
          break;
        }
      }
      if (colunaEncontrada === -1) {
        colunaEncontrada = fimDasColunas.length;
        fimDasColunas.push(item.fim);
      } else {
        fimDasColunas[colunaEncontrada] = item.fim;
      }
      colunaPorItem.set(item, colunaEncontrada);
    }

    const totalColunas = fimDasColunas.length;
    for (const item of cluster) {
      resultado.push({ evento: item.evento, coluna: colunaPorItem.get(item)!, totalColunas });
    }
  }

  for (const item of itens) {
    if (clusterAtual.length === 0 || item.inicio < fimClusterAtual) {
      clusterAtual.push(item);
      fimClusterAtual = Math.max(fimClusterAtual, item.fim);
    } else {
      processarCluster(clusterAtual);
      clusterAtual = [item];
      fimClusterAtual = item.fim;
    }
  }
  if (clusterAtual.length > 0) processarCluster(clusterAtual);

  return resultado;
}

// Domingo = 0, sábado = 6 — mesma convenção do JS Date
function ehFimDeSemana(d: Date) {
  const dia = d.getDay();
  return dia === 0 || dia === 6;
}

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

  // Fundo claro/transparente da cor da etiqueta, pra pintar a área do bloco
  function fundoDaEtiqueta(id: string) {
    return hexParaRgba(corDaEtiqueta(id), 0.16);
  }

  // Versão escurecida da mesma cor, pro texto ficar legível em cima do fundo claro
  function textoDaEtiqueta(id: string) {
    return hexEscurecer(corDaEtiqueta(id), 0.35);
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
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="grid grid-cols-[56px_repeat(7,1fr)] gap-1">
              <div />
              {diasDaSemana.map((d) => (
                <div
                  key={`cab-${d.toISOString()}`}
                  className="rounded-t-lg pb-1 text-center"
                  style={{ backgroundColor: ehFimDeSemana(d) ? cores.fundoFimDeSemana : "transparent" }}
                >
                  <span className="text-xs font-medium capitalize" style={{ color: cores.textoSecundario }}>
                    {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                  </span>
                  <div className="text-sm font-medium" style={{ color: cores.textoPrincipal }}>{d.getDate()}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[56px_repeat(7,1fr)] gap-1">
              <div />
              {diasDaSemana.map((d) => {
                const semHorario = eventos.filter(
                  (e) => e.dia === d.getDate() && e.mes === d.getMonth() && e.ano === d.getFullYear() && !e.horario
                );
                return (
                  <div
                    key={`semhora-${d.toISOString()}`}
                    className="flex flex-col gap-1 px-0.5 pb-1"
                    style={{ backgroundColor: ehFimDeSemana(d) ? cores.fundoFimDeSemana : "transparent" }}
                  >
                    {semHorario.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => abrirEvento(e.id)}
                        className="truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-bold hover:opacity-80"
                        style={{ backgroundColor: fundoDaEtiqueta(e.etiquetaId), color: textoDaEtiqueta(e.etiquetaId) }}
                      >
                        {e.titulo}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-[56px_repeat(7,1fr)] gap-1">
              <div>
                {HORAS_EXIBIDAS.map((h) => (
                  <div key={h} style={{ height: ALTURA_HORA }} className="relative -translate-y-2 text-right pr-2">
                    <span className="text-[10px]" style={{ color: cores.textoSecundario }}>
                      {String(h).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {diasDaSemana.map((d) => {
                const eventosDoDia = eventos
                  .filter((e) => e.dia === d.getDate() && e.mes === d.getMonth() && e.ano === d.getFullYear() && e.horario)
                  .sort(ordenarPorHorario);

                const layout = calcularLayoutSemanal(eventosDoDia);

                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => abrirDia(d.getDate(), d.getMonth(), d.getFullYear())}
                    className="relative"
                    style={{
                      height: HORAS_EXIBIDAS.length * ALTURA_HORA,
                      border: `1px solid ${cores.borda}`,
                      borderRadius: 8,
                      backgroundColor: ehFimDeSemana(d) ? cores.fundoFimDeSemana : "transparent",
                    }}
                  >
                    {HORAS_EXIBIDAS.map((h, i) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0"
                        style={{ top: i * ALTURA_HORA, borderTop: `1px solid ${cores.borda}`, opacity: 0.5 }}
                      />
                    ))}

                    {layout.map(({ evento: e, coluna, totalColunas }) => {
                      const pos = posicaoDoEvento(e);
                      if (!pos) return null;
                      const largura = 100 / totalColunas;
                      const esquerda = coluna * largura;
                      return (
                        <span
                          key={e.id}
                          role="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            abrirEvento(e.id);
                          }}
                          className="absolute overflow-hidden truncate rounded-md px-1 py-0.5 text-left text-[10px] font-bold hover:opacity-80"
                          style={{
                            top: pos.top,
                            height: pos.altura,
                            left: `calc(${esquerda}% + 1px)`,
                            width: `calc(${largura}% - 2px)`,
                            backgroundColor: fundoDaEtiqueta(e.etiquetaId),
                            color: textoDaEtiqueta(e.etiquetaId),
                            borderLeft: `2px solid ${corDaEtiqueta(e.etiquetaId)}`,
                          }}
                        >
                          {e.horario} {e.titulo}
                        </span>
                      );
                    })}
                  </button>
                );
              })}
            </div>
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