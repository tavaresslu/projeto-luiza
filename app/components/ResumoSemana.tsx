"use client";

import { cores, hexParaRgba } from "../theme";
import { useCalendario } from "../context/CalendarioContext";
import { usePasta } from "../context/PastaContext";
import { useHabitos, dataParaChave } from "../context/HabitosContext";
import { itemNoDia, statusDoPrazo } from "../utils";
import ProgressoCircular from "./ProgressoCircular";

// Cores de cada bloco do resumo
const COR_TAREFAS = "#C58AF2";
const COR_HABITOS = "#6FBF8E";
const COR_COMPROMISSOS = "#7FB8F2";
const COR_ATRASADA = "#E76F51";

const LETRAS_DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];

type Props = {
  hoje: Date;
};

export default function ResumoSemana({ hoje }: Props) {
  const { eventos } = useCalendario();
  const { pastas } = usePasta();
  const { habitos } = useHabitos();

  // A semana vai de domingo a sábado, igual ao calendário
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const diasDaSemana = Array.from(
    { length: 7 },
    (_, i) =>
      new Date(inicioHoje.getFullYear(), inicioHoje.getMonth(), inicioHoje.getDate() - inicioHoje.getDay() + i)
  );
  // Quantos dias da semana já passaram, contando hoje (domingo = 1, sábado = 7)
  const diasPassados = inicioHoje.getDay() + 1;

  const rotuloSemana = `${diasDaSemana[0].toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })} – ${diasDaSemana[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;

  // ---------- Tarefas ----------
  const todosItens = pastas.flatMap((p) => p.itensChecklist);
  const itensDaSemana = todosItens.filter((item) =>
    diasDaSemana.some((d) => itemNoDia(item, d.getDate(), d.getMonth(), d.getFullYear()))
  );
  const totalTarefas = itensDaSemana.length;
  const tarefasConcluidas = itensDaSemana.filter((i) => i.concluido).length;
  const atrasadas = todosItens.filter((i) => !i.concluido && statusDoPrazo(i, hoje) === "atrasada").length;

  // ---------- Compromissos ----------
  const eventosPorDia = diasDaSemana.map(
    (d) =>
      eventos.filter((e) => e.dia === d.getDate() && e.mes === d.getMonth() && e.ano === d.getFullYear()).length
  );
  const totalEventos = eventosPorDia.reduce((soma, n) => soma + n, 0);
  const maiorQuantidade = Math.max(...eventosPorDia);
  const diaMaisCheio = maiorQuantidade > 0 ? diasDaSemana[eventosPorDia.indexOf(maiorQuantidade)] : null;

  // ---------- Hábitos ----------
  const totalFeitos = habitos.reduce(
    (soma, h) => soma + diasDaSemana.filter((d) => h.diasFeitos.includes(dataParaChave(d))).length,
    0
  );
  const totalPossiveis = habitos.length * diasPassados;
  const porcentagemHabitos = totalPossiveis === 0 ? 0 : Math.round((totalFeitos / totalPossiveis) * 100);

  function estiloBloco(cor: string) {
    return {
      backgroundColor: hexParaRgba(cor, 0.1),
      border: `1px solid ${hexParaRgba(cor, 0.3)}`,
    };
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: cores.fundoCard, border: `1px solid ${cores.borda}` }}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-sm font-medium" style={{ color: cores.textoPrincipal }}>
          Resumo da semana
        </p>
        <p className="text-xs" style={{ color: cores.textoSecundario }}>
          {rotuloSemana}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {/* --- Tarefas com prazo na semana --- */}
        <div className="rounded-3xl p-4" style={estiloBloco(COR_TAREFAS)}>
          <p className="mb-2 text-sm font-semibold" style={{ color: cores.textoPrincipal }}>
            Tarefas
          </p>

          {totalTarefas === 0 ? (
            <p className="py-6 text-center text-xs" style={{ color: cores.textoSecundario }}>
              Nenhuma tarefa com prazo nesta semana.
            </p>
          ) : (
            <>
              <ProgressoCircular total={totalTarefas} concluidos={tarefasConcluidas} cor={COR_TAREFAS} tamanho={110} />
              <p className="mt-2 text-center text-xs" style={{ color: cores.textoSecundario }}>
                {tarefasConcluidas} de {totalTarefas} tarefas com prazo
              </p>
            </>
          )}

          {atrasadas > 0 && (
            <p className="mt-2 text-center text-xs font-medium" style={{ color: COR_ATRASADA }}>
              {atrasadas} {atrasadas === 1 ? "tarefa atrasada" : "tarefas atrasadas"}
            </p>
          )}
        </div>

        {/* --- Hábitos da semana --- */}
        <div className="rounded-3xl p-4" style={estiloBloco(COR_HABITOS)}>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-sm font-semibold" style={{ color: cores.textoPrincipal }}>
              Hábitos
            </p>
            {habitos.length > 0 && (
              <p className="text-xs" style={{ color: cores.textoSecundario }}>
                {porcentagemHabitos}% até hoje
              </p>
            )}
          </div>

          {habitos.length === 0 ? (
            <p className="py-6 text-center text-xs" style={{ color: cores.textoSecundario }}>
              Nenhum hábito criado ainda.
            </p>
          ) : (
            <>
              {/* Letras dos dias da semana */}
              <div className="mb-1.5 flex items-center gap-2">
                <span className="min-w-0 flex-1" />
                <div className="flex gap-1">
                  {LETRAS_DIAS.map((letra, i) => (
                    <span
                      key={i}
                      className="w-3.5 text-center text-[9px]"
                      style={{
                        color: cores.textoSecundario,
                        fontWeight: i === inicioHoje.getDay() ? 700 : 400,
                      }}
                    >
                      {letra}
                    </span>
                  ))}
                </div>
                <span className="w-8" />
              </div>

              <ul className="flex flex-col gap-2">
                {habitos.map((h) => {
                  const feitosNaSemana = diasDaSemana.filter((d) => h.diasFeitos.includes(dataParaChave(d))).length;

                  return (
                    <li key={h.id} className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs" style={{ color: cores.textoPrincipal }}>
                        {h.nome}
                      </span>

                      <div className="flex gap-1">
                        {diasDaSemana.map((d) => {
                          const feito = h.diasFeitos.includes(dataParaChave(d));
                          const futuro = d.getTime() > inicioHoje.getTime();
                          return (
                            <span
                              key={dataParaChave(d)}
                              className="h-3.5 w-3.5 rounded-full"
                              style={{
                                backgroundColor: feito ? h.cor : "transparent",
                                border: `1px solid ${feito ? h.cor : cores.borda}`,
                                opacity: futuro ? 0.4 : 1,
                              }}
                              title={d.toLocaleDateString("pt-BR", {
                                weekday: "long",
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            />
                          );
                        })}
                      </div>

                      <span className="w-8 text-right text-[11px]" style={{ color: cores.textoSecundario }}>
                        {feitosNaSemana}/{diasPassados}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* --- Compromissos da semana --- */}
        <div className="rounded-3xl p-4" style={estiloBloco(COR_COMPROMISSOS)}>
          <p className="mb-2 text-sm font-semibold" style={{ color: cores.textoPrincipal }}>
            Compromissos
          </p>

          <div className="flex flex-col items-center justify-center py-3">
            <span className="text-4xl font-medium leading-none" style={{ color: cores.textoPrincipal }}>
              {totalEventos}
            </span>
            <span className="mt-2 text-xs" style={{ color: cores.textoSecundario }}>
              {totalEventos === 1 ? "compromisso nesta semana" : "compromissos nesta semana"}
            </span>

            {diaMaisCheio && (
              <span className="mt-3 text-center text-xs" style={{ color: cores.textoSecundario }}>
                Dia mais cheio:{" "}
                <strong style={{ color: cores.textoPrincipal }}>
                  {diaMaisCheio.toLocaleDateString("pt-BR", { weekday: "long" })}
                </strong>{" "}
                ({maiorQuantidade})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}