"use client";

import { useState } from "react";
import { cores, hexParaRgba } from "../theme";
import { useHabitos, dataParaChave, calcularSequencia } from "../context/HabitosContext";

export default function PainelHabitos() {
  const { habitos, criarHabito, removerHabito, alternarDiaHabito } = useHabitos();
  const [novoNome, setNovoNome] = useState("");

  const hoje = new Date();
  const chaveHoje = dataParaChave(hoje);
  const feitosHoje = habitos.filter((h) => h.diasFeitos.includes(chaveHoje)).length;

  // Os 6 dias anteriores a hoje (do mais antigo pro mais recente)
  const diasAnteriores = Array.from({ length: 6 }, (_, i) => {
    return new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (6 - i));
  });

  function adicionarHabito() {
    if (novoNome.trim() === "") return;
    criarHabito(novoNome.trim());
    setNovoNome("");
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: cores.fundoCard, border: `1px solid ${cores.borda}` }}
    >
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-sm font-medium" style={{ color: cores.textoPrincipal }}>
          Hábitos
        </p>
        <p className="text-xs" style={{ color: cores.textoSecundario }}>
          {habitos.length === 0 ? "Nenhum hábito ainda" : `${feitosHoje} de ${habitos.length} hoje`}
        </p>
      </div>

      <ul>
        {habitos.map((h, i) => {
          const feitoHoje = h.diasFeitos.includes(chaveHoje);
          const sequencia = calcularSequencia(h.diasFeitos, hoje);

          return (
            <li
              key={h.id}
              className="group flex items-center gap-3 py-3"
              style={{ borderBottom: i < habitos.length - 1 ? `1px solid ${cores.borda}` : "none" }}
            >
              {/* Bolinha de hoje */}
              <button
                onClick={() => alternarDiaHabito(h.id, chaveHoje)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors"
                style={{
                  border: `1.5px solid ${h.cor}`,
                  backgroundColor: feitoHoje ? h.cor : "transparent",
                }}
                title={feitoHoje ? "Desmarcar hoje" : "Marcar como feito hoje"}
              >
                {feitoHoje && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Nome + sequência */}
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium"
                  style={{ color: cores.textoPrincipal }}
                >
                  {h.nome}
                </p>
                <p className="text-xs" style={{ color: cores.textoSecundario }}>
                  {sequencia > 0
                    ? `🔥 ${sequencia} ${sequencia === 1 ? "dia seguido" : "dias seguidos"}`
                    : "Sem sequência ainda"}
                </p>
              </div>

              {/* Últimos 6 dias antes de hoje (dá pra clicar pra marcar um dia que esqueceu) */}
              <div className="flex items-center gap-1">
                {diasAnteriores.map((d) => {
                  const chave = dataParaChave(d);
                  const feito = h.diasFeitos.includes(chave);
                  return (
                    <button
                      key={chave}
                      onClick={() => alternarDiaHabito(h.id, chave)}
                      className="h-3.5 w-3.5 rounded-full transition-colors"
                      style={{
                        backgroundColor: feito ? hexParaRgba(h.cor, 0.85) : "transparent",
                        border: `1px solid ${feito ? h.cor : cores.borda}`,
                      }}
                      title={d.toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    />
                  );
                })}
              </div>

              <button
                onClick={() => removerHabito(h.id)}
                className="hidden text-sm opacity-40 transition-opacity hover:opacity-100 group-hover:block"
                style={{ color: cores.textoSecundario }}
                title="Remover hábito"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      {/* Adicionar novo hábito */}
      <div className="mt-3 flex items-center gap-3">
        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") adicionarHabito();
          }}
          placeholder="Novo hábito..."
          className="flex-1 bg-transparent pb-1.5 text-sm outline-none"
          style={{ borderBottom: `1px solid ${cores.borda}`, color: cores.textoPrincipal }}
        />
        <button
          onClick={adicionarHabito}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm transition-opacity hover:opacity-80"
          style={{ backgroundColor: cores.borda, color: cores.textoPrincipal }}
          title="Adicionar"
        >
          +
        </button>
      </div>
    </div>
  );
}