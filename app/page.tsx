"use client";

import { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import CalendarioExpandido from "./components/CalendarioExpandido";
import { cores } from "./theme";
import { useCalendario } from "./context/CalendarioContext";
import { usePasta } from "./context/PastaContext";

export default function Home() {
  const { expandido, setExpandido } = useCalendario();
  const { pastaSelecionada, fecharPasta } = usePasta();

  // Sempre que a pasta é aberta, fecha o calendário
  useEffect(() => {
    if (pastaSelecionada) setExpandido(false);
  }, [pastaSelecionada, setExpandido]);

  // Sempre que o calendário é expandido, fecha a pasta
  useEffect(() => {
    if (expandido) fecharPasta();
  }, [expandido, fecharPasta]);

  return (
    <div className="flex" style={{ backgroundColor: cores.fundo }}>
      <Sidebar />
      <main className="relative flex-1 p-8">
        {expandido && <CalendarioExpandido />}

        {!expandido && pastaSelecionada && (
          <div
            className="absolute inset-0 flex flex-col rounded-2xl p-6 shadow-sm"
            style={{ backgroundColor: cores.fundoCard, border: `1px solid ${cores.borda}` }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: pastaSelecionada.cor }}
                />
                <h1 className="text-3xl font-semibold" style={{ color: cores.textoPrincipal }}>
                  {pastaSelecionada.nome}
                </h1>
              </div>
              <button
                onClick={fecharPasta}
                className="text-sm"
                style={{ color: cores.textoSecundario }}
              >
                Fechar
              </button>
            </div>
            <p className="text-sm" style={{ color: cores.textoSecundario }}>
              Conteúdo da pasta em breve...
            </p>
          </div>
        )}

        {!expandido && !pastaSelecionada && (
          <h1 className="text-lg font-medium" style={{ color: cores.textoPrincipal }}>
            Área principal
          </h1>
        )}
      </main>
    </div>
  );
}