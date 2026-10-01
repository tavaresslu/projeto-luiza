"use client";

import { useEffect, useState } from "react";
import { cores, hexParaRgba } from "../theme";
import { ordenarPorHorario } from "../utils";
import { useCalendario } from "../context/CalendarioContext";
import { usePasta } from "../context/PastaContext";
import PainelHabitos from "./PainelHabitos";

// O JavaScript conta janeiro como 0 (new Date().getMonth()).
// Se os seus eventos guardam o mês de 1 a 12, troque este valor para 1.
const AJUSTE_MES = 0;

function saudacao(hora: number) {
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function TelaHoje() {
  const { eventos, etiquetas } = useCalendario();
  const { pastas, selecionarPasta, alternarItemChecklist } = usePasta();

  // A data só é definida depois que a página abre no navegador.
  // Assim o servidor e o navegador não geram textos diferentes (erro de hidratação).
  const [hoje, setHoje] = useState<Date | null>(null);

  useEffect(() => {
    setHoje(new Date());
  }, []);

  if (!hoje) return null;

  const dataExtenso = hoje.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const dataFormatada = dataExtenso.charAt(0).toUpperCase() + dataExtenso.slice(1);

  // Compromissos de hoje, em ordem de horário (sem horário vão para o fim)
  const eventosHoje = eventos
    .filter(
      (e) =>
        e.dia === hoje.getDate() &&
        e.mes === hoje.getMonth() + AJUSTE_MES &&
        e.ano === hoje.getFullYear()
    )
    .sort(ordenarPorHorario);

  // Tarefas pendentes, agrupadas por pasta
  const gruposPendentes = pastas
    .map((pasta) => ({
      pasta,
      pendentes: pasta.itensChecklist.filter((item) => !item.concluido),
    }))
    .filter((grupo) => grupo.pendentes.length > 0);

  const cardEstilo = {
    backgroundColor: cores.fundoCard,
    border: `1px solid ${cores.borda}`,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium" style={{ color: cores.textoPrincipal }}>
          {saudacao(hoje.getHours())}, Luiza
        </h1>
        <p className="text-sm" style={{ color: cores.textoSecundario }}>
          {dataFormatada}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Compromissos de hoje */}
        <section className="rounded-2xl p-5" style={cardEstilo}>
          <h2 className="mb-3 text-sm font-medium" style={{ color: cores.textoPrincipal }}>
            Compromissos de hoje
          </h2>

          {eventosHoje.length === 0 ? (
            <p className="text-sm" style={{ color: cores.textoSecundario }}>
              Nenhum compromisso para hoje.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {eventosHoje.map((evento) => {
                const cor =
                  etiquetas.find((et) => et.id === evento.etiquetaId)?.cor ??
                  cores.textoSecundario;
                const horario = evento.horario
                  ? evento.horarioFim
                    ? `${evento.horario} – ${evento.horarioFim}`
                    : evento.horario
                  : "Dia todo";

                return (
                  <li
                    key={evento.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2"
                    style={{ backgroundColor: hexParaRgba(cor, 0.14) }}
                  >
                    <span
                      className="h-3 w-3 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: cor }}
                    />
                    <span className="flex-1 text-sm" style={{ color: cores.textoPrincipal }}>
                      {evento.titulo}
                    </span>
                    <span className="text-xs" style={{ color: cores.textoSecundario }}>
                      {horario}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Tarefas pendentes */}
        <section className="rounded-2xl p-5" style={cardEstilo}>
          <h2 className="mb-3 text-sm font-medium" style={{ color: cores.textoPrincipal }}>
            Tarefas pendentes
          </h2>

          {gruposPendentes.length === 0 ? (
            <p className="text-sm" style={{ color: cores.textoSecundario }}>
              Nenhuma tarefa pendente. Adicione itens nos checklists das suas pastas.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {gruposPendentes.map(({ pasta, pendentes }) => (
                <div key={pasta.id}>
                  <button
                    onClick={() => selecionarPasta(pasta.id)}
                    className="mb-1 flex items-center gap-2 text-xs font-medium hover:underline"
                    style={{ color: cores.textoSecundario }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: pasta.cor }}
                    />
                    {pasta.nome}
                  </button>

                  <ul className="flex flex-col gap-1">
                    {pendentes.map((item) => (
                      <li key={item.id} className="flex items-center gap-2">
                        <button
                          onClick={() => alternarItemChecklist(pasta.id, item.id)}
                          aria-label={`Concluir: ${item.texto}`}
                          className="h-4 w-4 flex-shrink-0 rounded-full"
                          style={{ border: `1.5px solid ${pasta.cor}` }}
                        />
                        <span className="text-sm" style={{ color: cores.textoPrincipal }}>
                          {item.texto}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Hábitos: ocupa a largura toda embaixo dos dois cards */}
        <div className="md:col-span-2">
          <PainelHabitos />
        </div>
      </div>

      {/* Atalhos para as pastas */}
      {pastas.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium" style={{ color: cores.textoSecundario }}>
            Ir para uma pasta
          </h2>
          <div className="flex flex-wrap gap-2">
            {pastas.map((pasta) => (
              <button
                key={pasta.id}
                onClick={() => selecionarPasta(pasta.id)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                style={{
                  backgroundColor: hexParaRgba(pasta.cor, 0.14),
                  color: cores.textoPrincipal,
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: pasta.cor }}
                />
                {pasta.nome}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}