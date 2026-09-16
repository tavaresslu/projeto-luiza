"use client";

import { cores, hexParaRgba, hexEscurecer } from "../theme";
import { useCalendario } from "../context/CalendarioContext";
import { ordenarPorHorario } from "../utils";

type Props = {
  mes: number;
  ano: number;
  tamanho: "grande" | "mini" | "pequeno";
  mostrarTitulo?: boolean;
  onClickDia: (dia: number, mes: number, ano: number) => void;
  onClickEvento?: (eventoId: string) => void;
};

export default function MesGrid({ mes, ano, tamanho, mostrarTitulo = true, onClickDia, onClickEvento }: Props) {
  const { eventos, etiquetas } = useCalendario();

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const nomeMes = new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long" });

  function corDaEtiqueta(id: string) {
    return etiquetas.find((e) => e.id === id)?.cor ?? cores.textoSecundario;
  }

  // Fundo claro/transparente da cor da etiqueta, pra fundos de bloco e bolinhas
  function fundoDaEtiqueta(id: string) {
    return hexParaRgba(corDaEtiqueta(id), 0.16);
  }

  // Versão escurecida da mesma cor, pro texto ficar legível em cima do fundo claro
  function textoDaEtiqueta(id: string) {
    return hexEscurecer(corDaEtiqueta(id), 0.35);
  }

  const celulas = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(<div key={`vazio-${i}`} />);

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const eventosDoDia = eventos
      .filter((e) => e.dia === dia && e.mes === mes && e.ano === ano)
      .sort(ordenarPorHorario);

    // Domingo = 0, sábado = 6 — mesma convenção do JS Date usada no resto do arquivo
    const diaSemana = new Date(ano, mes, dia).getDay();
    const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;

    if (tamanho === "grande") {
      const temMais = eventosDoDia.length > 2;
      celulas.push(
        <button
          key={dia}
          onClick={() => onClickDia(dia, mes, ano)}
          className="flex min-h-24 flex-col items-start gap-1 rounded-xl p-2 text-left"
          style={{
            border: `1px solid ${cores.borda}`,
            height: temMais ? "auto" : undefined,
            backgroundColor: ehFimDeSemana ? cores.fundoFimDeSemana : "transparent",
          }}
        >
          <span className="text-xs font-medium" style={{ color: cores.textoPrincipal }}>{dia}</span>
          <div className="flex w-full flex-col gap-1">
            {eventosDoDia.map((e) => (
              <span
                key={e.id}
                role="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onClickEvento?.(e.id);
                }}
                className="truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-bold hover:opacity-80"
                style={{
                  backgroundColor: fundoDaEtiqueta(e.etiquetaId),
                  color: textoDaEtiqueta(e.etiquetaId),
                  borderLeft: `2px solid ${corDaEtiqueta(e.etiquetaId)}`,
                }}
              >
                {e.horario ? `${e.horario} ` : ""}{e.titulo}
              </span>
            ))}
          </div>
        </button>
      );
    } else {
      const tamanhoCirculo = tamanho === "mini" ? "h-7 w-7 text-xs" : "h-7 w-7 text-[11px]";
      const temEvento = eventosDoDia.length > 0;
      celulas.push(
        <button
          key={dia}
          onClick={() => onClickDia(dia, mes, ano)}
          className={`relative flex ${tamanhoCirculo} items-center justify-center rounded-full ${temEvento ? "font-bold" : "font-medium"}`}
          style={{
            color: temEvento ? textoDaEtiqueta(eventosDoDia[0].etiquetaId) : cores.textoPrincipal,
            backgroundColor: temEvento
              ? fundoDaEtiqueta(eventosDoDia[0].etiquetaId)
              : ehFimDeSemana
              ? cores.fundoFimDeSemana
              : "transparent",
          }}
        >
          {dia}
        </button>
      );
    }
  }

  return (
    <div className={tamanho === "pequeno" ? "rounded-xl p-3" : ""} style={tamanho === "pequeno" ? { border: `1px solid ${cores.borda}` } : {}}>
      {mostrarTitulo && tamanho !== "grande" && (
        <p className="mb-2 text-xs font-medium capitalize" style={{ color: cores.textoPrincipal }}>{nomeMes}</p>
      )}
      <div className={`grid grid-cols-7 ${tamanho === "grande" ? "gap-2" : "gap-0.5"}`}>
        {tamanho === "grande" &&
          ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
            <span
              key={d}
              className="text-xs font-medium"
              style={{ color: i === 0 || i === 6 ? cores.textoPrincipal : cores.textoSecundario }}
            >
              {d}
            </span>
          ))}
        {tamanho === "mini" &&
          ["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <span key={i} className="flex h-4 items-center justify-center text-[10px] font-medium" style={{ color: cores.textoSecundario }}>{d}</span>
          ))}
        {celulas}
      </div>
    </div>
  );
}