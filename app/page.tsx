"use client";

import Sidebar from "./components/Sidebar";
import CalendarioExpandido from "./components/CalendarioExpandido";
import { cores } from "./theme";
import { useCalendario } from "./context/CalendarioContext";
import { usePasta } from "./context/PastaContext";

export default function Home() {
  const { expandido } = useCalendario();
  const { pastaSelecionada, fecharPasta } = usePasta();

  return (
    <div className="flex" style={{ backgroundColor: cores.fundo }}>
      <Sidebar />
      <main className="flex-1 p-8">
        {expandido ? (
          <CalendarioExpandido />
        ) : pastaSelecionada ? (
          <div>
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
        ) : (
          <h1 className="text-lg font-medium" style={{ color: cores.textoPrincipal }}>
            Área principal
          </h1>
        )}
      </main>
    </div>
  );
}