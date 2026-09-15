"use client";

import Sidebar from "./components/Sidebar";
import CalendarioExpandido from "./components/CalendarioExpandido";
import { cores } from "./theme";
import { useCalendario } from "./context/CalendarioContext";

export default function Home() {
  const { expandido } = useCalendario();

  return (
    <div className="flex" style={{ backgroundColor: cores.fundo }}>
      <Sidebar />
      <main className="flex-1 p-6">
        {expandido ? (
          <CalendarioExpandido />
        ) : (
          <h1 className="text-lg font-medium" style={{ color: cores.textoPrincipal }}>
            Área principal
          </h1>
        )}
      </main>
    </div>
  );
}