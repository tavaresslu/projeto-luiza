"use client";

import { cores } from "../theme";
import { useCalendario } from "../context/CalendarioContext";
import MesGrid from "./MesGrid";

const MAX_BOLINHAS = 5;

export default function MiniCalendar() {
  const { dataAtual, mudarMes, eventos, etiquetas, setExpandido, visualizacao, setVisualizacao } =
    useCalendario();

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();
  const nomeMes = dataAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  function corDaEtiqueta(id: string) {
    return etiquetas.find((e) => e.id === id)?.cor ?? cores.textoSecundario;
  }

  const inicioSemana = new Date(dataAtual);
  inicioSemana.setDate(dataAtual.getDate() - dataAtual.getDay());
  const diasDaSemanaMini = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setDate(inicioSemana.getDate() + i);
    return d;
  });

  const letrasDia = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className="relative rounded-2xl p-4 shadow-sm" style={{ backgroundColor: cores.fundoCard, border: `1px solid ${cores.borda}` }}>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={(e) => { e.stopPropagation(); mudarMes(-1); }}
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
          onClick={(e) => { e.stopPropagation(); mudarMes(1); }}
          style={{ color: cores.textoSecundario }}
        >
          ›
        </button>
      </div>

      <div className="mb-3 flex gap-1 rounded-full p-1" style={{ backgroundColor: cores.fundo, width: "fit-content" }}>
        {(["mes", "semana"] as const).map((v) => (
          <button
            key={v}
            onClick={(e) => {
              e.stopPropagation();
              setVisualizacao(v);
            }}
            className="rounded-full px-2.5 py-0.5 text-[11px]"
            style={{
              backgroundColor: visualizacao === v ? cores.fundoCard : "transparent",
              color: cores.textoPrincipal,
              boxShadow: visualizacao === v ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
          >
            {v === "mes" ? "Mês" : "Semana"}
          </button>
        ))}
      </div>

      {visualizacao === "mes" ? (
        <div onClick={() => setExpandido(true)} style={{ cursor: "pointer" }}>
          <MesGrid mes={mes} ano={ano} tamanho="mini" onClickDia={() => setExpandido(true)} />
        </div>
      ) : (
        // Cada dia é uma colunazinha mais alta: letra do dia, número do dia,
        // e embaixo até 5 bolinhas (uma por compromisso, colorida pela etiqueta)
        <div className="grid grid-cols-7 gap-1">
          {diasDaSemanaMini.map((d, i) => {
            const eventosDoDia = eventos.filter(
              (e) => e.dia === d.getDate() && e.mes === d.getMonth() && e.ano === d.getFullYear()
            );
            const hoje = d.toDateString() === new Date().toDateString();
            const bolinhasVisiveis = eventosDoDia.slice(0, MAX_BOLINHAS);
            const sobrando = eventosDoDia.length - bolinhasVisiveis.length;

            return (
              <button
                key={d.toISOString()}
                onClick={() => setExpandido(true)}
                className="flex flex-col items-center gap-1.5 rounded-xl pt-2 pb-2.5"
                style={{
                  border: `1px solid ${hoje ? cores.textoPrincipal : cores.borda}`,
                  backgroundColor: cores.fundo,
                  minHeight: 110,
                }}
              >
                <span className="text-[10px] font-medium" style={{ color: cores.textoSecundario }}>
                  {letrasDia[i]}
                </span>
                <span className="text-[11px] font-medium" style={{ color: cores.textoPrincipal }}>
                  {d.getDate()}
                </span>

                <div className="flex flex-1 flex-col items-center justify-start gap-1 pt-0.5">
                  {bolinhasVisiveis.map((e) => (
                    <span
                      key={e.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: corDaEtiqueta(e.etiquetaId) }}
                    />
                  ))}
                  {sobrando > 0 && (
                    <span className="text-[9px] leading-none" style={{ color: cores.textoSecundario }}>
                      +{sobrando}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}