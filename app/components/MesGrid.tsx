"use client";

import { cores, hexParaRgba, hexEscurecer } from "../theme";
import { useCalendario } from "../context/CalendarioContext";
import { usePasta } from "../context/PastaContext";
import { useHabitos, dataParaChave } from "../context/HabitosContext";
import { ordenarPorHorario, itemNoDia } from "../utils";

// Cor das marcações de hábitos no calendário
const COR_HABITOS = "#6FBF8E";

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
  // Pastas e itens de checklist (pra mostrar no calendário os itens que têm data)
  const { pastas, alternarItemChecklist } = usePasta();
  // Hábitos (pra marcar os dias em que foram cumpridos)
  const { habitos } = useHabitos();

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

    // Itens de checklist de TODAS as pastas que têm a data deste dia
    const itensDoDia = pastas.flatMap((pasta) =>
      pasta.itensChecklist
        .filter((item) => itemNoDia(item, dia, mes, ano))
        .map((item) => ({ item, pasta }))
    );

    // Quantos hábitos foram cumpridos neste dia
    const chaveDia = dataParaChave(new Date(ano, mes, dia));
    const habitosFeitos = habitos.filter((h) => h.diasFeitos.includes(chaveDia)).length;
    const todosHabitos = habitos.length > 0 && habitosFeitos === habitos.length;

    // Domingo = 0, sábado = 6 — mesma convenção do JS Date usada no resto do arquivo
    const diaSemana = new Date(ano, mes, dia).getDay();
    const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;

    if (tamanho === "grande") {
      const temMais = eventosDoDia.length + itensDoDia.length + (habitosFeitos > 0 ? 1 : 0) > 2;
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

            {/* Tarefas do checklist com prazo neste dia (cor da pasta) */}
            {itensDoDia.map(({ item, pasta }) => (
              <span
                key={`${pasta.id}-${item.id}`}
                role="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  alternarItemChecklist(pasta.id, item.id);
                }}
                className="truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-bold hover:opacity-80"
                style={{
                  backgroundColor: hexParaRgba(pasta.cor, 0.16),
                  color: hexEscurecer(pasta.cor, 0.35),
                  border: `1px dashed ${pasta.cor}`,
                  textDecoration: item.concluido ? "line-through" : "none",
                  opacity: item.concluido ? 0.6 : 1,
                }}
                title={`${pasta.nome}: clique para marcar como concluído`}
              >
                {item.concluido ? "☑" : "☐"} {item.texto}
              </span>
            ))}

            {/* Hábitos cumpridos neste dia */}
            {habitosFeitos > 0 && (
              <span
                className="truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-bold"
                style={{
                  backgroundColor: hexParaRgba(COR_HABITOS, todosHabitos ? 0.28 : 0.1),
                  color: hexEscurecer(COR_HABITOS, 0.35),
                }}
                title="Hábitos cumpridos neste dia"
              >
                {todosHabitos ? "✓ hábitos" : `${habitosFeitos}/${habitos.length} hábitos`}
              </span>
            )}
          </div>
        </button>
      );
    } else {
      const tamanhoCirculo = tamanho === "mini" ? "h-7 w-7 text-xs" : "h-7 w-7 text-[11px]";
      const temEvento = eventosDoDia.length > 0;
      const temItem = itensDoDia.length > 0;
      const temMarcacao = temEvento || temItem;

      // Evento tem prioridade na cor; se só tiver tarefa, usa a cor da pasta
      const corFundo = temEvento
        ? fundoDaEtiqueta(eventosDoDia[0].etiquetaId)
        : temItem
        ? hexParaRgba(itensDoDia[0].pasta.cor, 0.16)
        : ehFimDeSemana
        ? cores.fundoFimDeSemana
        : "transparent";

      const corTexto = temEvento
        ? textoDaEtiqueta(eventosDoDia[0].etiquetaId)
        : temItem
        ? hexEscurecer(itensDoDia[0].pasta.cor, 0.35)
        : cores.textoPrincipal;

      // Ao passar o mouse, mostra o nome das tarefas do dia e se os hábitos foram cumpridos
      const dica = [
        itensDoDia.map(({ item }) => item.texto).join(", "),
        todosHabitos ? "Todos os hábitos cumpridos" : "",
      ]
        .filter(Boolean)
        .join(" · ");

      celulas.push(
        <button
          key={dia}
          onClick={() => onClickDia(dia, mes, ano)}
          title={dica || undefined}
          className={`relative flex ${tamanhoCirculo} items-center justify-center rounded-full ${temMarcacao ? "font-bold" : "font-medium"}`}
          style={{
            color: corTexto,
            backgroundColor: corFundo,
          }}
        >
          {dia}

          {/* Pontinho verde: todos os hábitos cumpridos neste dia */}
          {todosHabitos && (
            <span
              className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
              style={{ backgroundColor: COR_HABITOS }}
            />
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