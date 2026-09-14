import Sidebar from "./components/Sidebar";
import { cores } from "./theme";

export default function Home() {
  return (
    <div className="flex" style={{ backgroundColor: cores.fundo }}>
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-lg font-medium" style={{ color: cores.textoPrincipal }}>
          Área principal
        </h1>
      </main>
    </div>
  );
}