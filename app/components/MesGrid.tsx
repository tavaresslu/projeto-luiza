"use client";

import { cores } from "../theme";
import { useCalendario } from "../context/CalendarioContext";
import { ordenarPorHorario } from "../utils";

type Props = {
  mes: number;
  ano: number;
  tamanho: "grande" | "mini" | "pequeno";
  mostrarTitulo?: boolean;
  onClickDia: (dia: number, mes: number, ano: number) => void;
};

export default function MesGrid({ mes, ano, tamanho, mostrarTitulo = true, onClickDia }: Props) {
  const { eventos, etiquetas } = useCalendario();

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const nomeMes = new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long" });

  function corDaEtiqueta(id: string) {
    return etiquetas.find((e) => e.id === id)?.cor ?? cores.textoSecundario;
  }

  const celulas = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(<div key={`vazio-${i}`} />);

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const eventosDoDia = eventos
      .filter((e) => e.dia === dia && e.mes === mes && e.ano === ano)
      .sort(ordenarPorHorario);

    if (tamanho === "grande") {
      celulas.push(
        <button
          key={dia}
          onClick={() => onClickDia(dia, mes, ano)}
          className="flex h-24 flex-col items-start gap-1 rounded-xl p-2 text-left"
          style={{ border: `1px solid ${cores.borda}` }}
        >
          <span className="text-xs font-medium" style={{ color: cores.textoPrincipal }}>{dia}</span>
          <div className="flex w-full flex-col gap-1">
            {eventosDoDia.slice(0, 2).map((e) => (
              <span key={e.id} className="truncate rounded-md px-1.5 py-0.5 text-[10px] text-white" style={{ backgroundColor: corDaEtiqueta(e.etiquetaId) }}>
                {e.horario ? `${e.horario} ` : ""}{e.titulo}
              </span>
            ))}
            {eventosDoDia.length > 2 && (
              <span className="text-[10px]" style={{ color: cores.textoSecundario }}>+{eventosDoDia.length - 2}</span>
            )}
          </div>
        </button>
      );
    } else {
      const tamanhoCirculo = tamanho === "mini" ? "h-7 w-7 text-xs" : "h-5 w-5 text-[9px]";
      celulas.push(
        <button
          key={dia}
          onClick={() => onClickDia(dia, mes, ano)}
          className={`relative flex ${tamanhoCirculo} items-center justify-center rounded-full hover:bg-black/5`}
          style={{ color: cores.textoPrincipal }}
        >
          {dia}
          {eventosDoDia.length > 0 && (
            <span className="absolute bottom-0 h-1 w-1 rounded-full" style={{ backgroundColor: corDaEtiqueta(eventosDoDia[0].etiquetaId) }} />
          )}
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
          ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <span key={d} className="text-xs font-medium" style={{ color: cores.textoSecundario }}>{d}</span>
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