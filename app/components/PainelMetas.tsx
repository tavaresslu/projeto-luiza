"use client";

import { useState } from "react";
import { cores, hexParaRgba } from "../theme";
import { useMetas } from "../context/MetasContext";
import { usePasta } from "../context/PastaContext";
import ProgressoCircular from "./ProgressoCircular";

export default function PainelMetas() {
  const { metas, criarMeta, removerMeta, alternarPastaDaMeta } = useMetas();
  const { pastas } = usePasta();

  const [criando, setCriando] = useState(false);
  const [novoNome, setNovoNome] = useState("");

  function confirmarNovaMeta() {
    if (novoNome.trim() !== "") {
      criarMeta(novoNome.trim());
    }
    setNovoNome("");
    setCriando(false);
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: cores.fundoCard, border: `1px solid ${cores.borda}` }}
    >
      <p className="mb-3 text-sm font-medium" style={{ color: cores.textoPrincipal }}>
        Metas
      </p>

      {metas.length === 0 && !criando && (
        <p className="mb-3 text-sm" style={{ color: cores.textoSecundario }}>
          Nenhuma meta ainda. Crie uma e escolha as pastas que contam para ela.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metas.map((meta) => {
          // Junta as tarefas de todas as pastas ligadas a esta meta
          const itens = pastas
            .filter((p) => meta.pastaIds.includes(p.id))
            .flatMap((p) => p.itensChecklist);
          const total = itens.length;
          const concluidos = itens.filter((i) => i.concluido).length;

          return (
            <div
              key={meta.id}
              className="group relative rounded-3xl p-4"
              style={{
                backgroundColor: hexParaRgba(meta.cor, 0.1),
                border: `1px solid ${hexParaRgba(meta.cor, 0.3)}`,
              }}
            >
              <button
                onClick={() => removerMeta(meta.id)}
                className="absolute right-3 top-3 hidden h-5 w-5 items-center justify-center rounded-full text-xs text-white group-hover:flex"
                style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
                title="Remover meta"
              >
                ×
              </button>

              <p
                className="mb-2 truncate pr-6 text-sm font-semibold"
                style={{ color: cores.textoPrincipal }}
              >
                {meta.nome}
              </p>

              <ProgressoCircular total={total} concluidos={concluidos} cor={meta.cor} tamanho={120} />

              <p className="mt-2 text-center text-xs" style={{ color: cores.textoSecundario }}>
                {total === 0 ? "Escolha pastas com tarefas" : `${concluidos} de ${total} tarefas`}
              </p>

              {/* Pastas: clique pra ligar ou desligar da meta */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {pastas.length === 0 && (
                  <span className="text-[11px]" style={{ color: cores.textoSecundario }}>
                    Crie uma pasta primeiro.
                  </span>
                )}
                {pastas.map((pasta) => {
                  const ligada = meta.pastaIds.includes(pasta.id);
                  return (
                    <button
                      key={pasta.id}
                      onClick={() => alternarPastaDaMeta(meta.id, pasta.id)}
                      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-colors"
                      style={{
                        backgroundColor: ligada ? hexParaRgba(pasta.cor, 0.3) : "transparent",
                        border: `1px solid ${ligada ? pasta.cor : cores.borda}`,
                        color: ligada ? cores.textoPrincipal : cores.textoSecundario,
                      }}
                      title={ligada ? "Tirar esta pasta da meta" : "Contar esta pasta na meta"}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: pasta.cor }}
                      />
                      {pasta.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Card pontilhado pra criar uma nova meta */}
        {criando ? (
          <div
            className="flex min-h-24 flex-col justify-center rounded-3xl p-4"
            style={{ border: `1.5px dashed ${cores.borda}` }}
          >
            <input
              autoFocus
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmarNovaMeta();
                if (e.key === "Escape") {
                  setNovoNome("");
                  setCriando(false);
                }
              }}
              placeholder="Nome da meta..."
              className="w-full bg-transparent pb-1.5 text-sm outline-none"
              style={{ borderBottom: `1px solid ${cores.borda}`, color: cores.textoPrincipal }}
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={confirmarNovaMeta}
                className="rounded-full px-3 py-1 text-xs"
                style={{ backgroundColor: cores.borda, color: cores.textoPrincipal }}
              >
                Criar
              </button>
              <button
                onClick={() => {
                  setNovoNome("");
                  setCriando(false);
                }}
                className="text-xs"
                style={{ color: cores.textoSecundario }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCriando(true)}
            className="flex min-h-24 items-center justify-center rounded-3xl text-2xl transition-opacity hover:opacity-70"
            style={{ border: `1.5px dashed ${cores.borda}`, color: cores.textoSecundario }}
            title="Nova meta"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}