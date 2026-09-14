import MiniCalendar from "./MiniCalendar";
import { cores } from "../theme";

const pastasExemplo = ["Matérias da faculdade", "Empresa júnior", "Projetos"];

export default function Sidebar() {
  return (
    <aside
      className="flex h-screen w-72 flex-col gap-6 p-5"
      style={{ backgroundColor: cores.fundo, borderRight: `1px solid ${cores.borda}` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: cores.textoPrincipal }}
        >
          L
        </div>
        <span className="text-sm font-medium" style={{ color: cores.textoPrincipal }}>
          Luiza
        </span>
      </div>

      <MiniCalendar />

      <div className="flex-1 overflow-y-auto">
        <p className="mb-2 text-xs font-medium" style={{ color: cores.textoSecundario }}>
          Pastas
        </p>
        <div className="flex flex-col gap-1">
          {pastasExemplo.map((pasta) => (
            <button
              key={pasta}
              className="rounded-xl px-3 py-2 text-left text-sm hover:shadow-sm"
              style={{ color: cores.textoPrincipal }}
            >
              {pasta}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}