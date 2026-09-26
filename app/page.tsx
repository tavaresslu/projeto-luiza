"use client";

import { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import CalendarioExpandido from "./components/CalendarioExpandido";
import PainelPasta from "./components/PainelPasta";
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

        {!expandido && pastaSelecionada && <PainelPasta />}

        {!expandido && !pastaSelecionada && (
          <h1 className="text-lg font-medium" style={{ color: cores.textoPrincipal }}>
            Área principal
          </h1>
        )}
      </main>
    </div>
  );
}