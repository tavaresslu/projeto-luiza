import { useState, DragEvent } from "react";
import MiniCalendar from "./MiniCalendar";
import SeletorCor from "./SeletorCor";
import { cores } from "../theme";
import { paletaCores } from "./SeletorCor";
import { usePasta } from "../context/PastaContext";

export default function Sidebar() {
  const {
    pastas,
    pastaSelecionada,
    selecionarPasta,
    criarPasta,
    renomearPasta,
    mudarCorPasta,
    excluirPasta,
    reordenarPastas,
  } = usePasta();

  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState("");
  const [indiceArrastado, setIndiceArrastado] = useState<number | null>(null);

  // Controla o modal de criar pasta (substitui o window.prompt)
  const [modalNovaPastaAberto, setModalNovaPastaAberto] = useState(false);
  const [nomeNovaPasta, setNomeNovaPasta] = useState("");
  const [corNovaPasta, setCorNovaPasta] = useState(paletaCores[0]);

  function abrirModalNovaPasta() {
    setNomeNovaPasta("");
    setCorNovaPasta(paletaCores[pastas.length % paletaCores.length]);
    setModalNovaPastaAberto(true);
  }

  function fecharModalNovaPasta() {
    setModalNovaPastaAberto(false);
    setNomeNovaPasta("");
  }

  function confirmarNovaPasta() {
    const nome = nomeNovaPasta.trim();
    if (!nome) return;
    criarPasta(nome, corNovaPasta);
    fecharModalNovaPasta();
  }

  function iniciarEdicao(pasta: { id: string; nome: string }) {
    setEditandoId(pasta.id);
    setNomeEditado(pasta.nome);
    setMenuAbertoId(null);
  }

  function confirmarEdicao(id: string) {
    if (nomeEditado.trim()) {
      renomearPasta(id, nomeEditado.trim());
    }
    setEditandoId(null);
  }

  function handleDragStart(indice: number) {
    setIndiceArrastado(indice);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, indiceAlvo: number) {
    e.preventDefault();
    if (indiceArrastado === null || indiceArrastado === indiceAlvo) return;

    const novaLista = [...pastas];
    const [arrastada] = novaLista.splice(indiceArrastado, 1);
    novaLista.splice(indiceAlvo, 0, arrastada);

    reordenarPastas(novaLista);
    setIndiceArrastado(indiceAlvo);
  }

  function handleDragEnd() {
    setIndiceArrastado(null);
  }

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
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: cores.textoSecundario }}>
            Pastas
          </p>
          <button
            onClick={abrirModalNovaPasta}
            className="text-xs font-medium hover:underline"
            style={{ color: cores.textoSecundario }}
          >
            + Nova
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {pastas.map((pasta, indice) => {
            const ativa = pastaSelecionada?.id === pasta.id;
            const editando = editandoId === pasta.id;
            const menuAberto = menuAbertoId === pasta.id;

            return (
              <div
                key={pasta.id}
                draggable={!editando}
                onDragStart={() => handleDragStart(indice)}
                onDragOver={(e) => handleDragOver(e, indice)}
                onDragEnd={handleDragEnd}
                className="relative flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  backgroundColor: ativa ? cores.borda : "transparent",
                  cursor: "grab",
                  opacity: indiceArrastado === indice ? 0.5 : 1,
                }}
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: pasta.cor }}
                />

                {editando ? (
                  <input
                    autoFocus
                    value={nomeEditado}
                    onChange={(e) => setNomeEditado(e.target.value)}
                    onBlur={() => confirmarEdicao(pasta.id)}
                    onKeyDown={(e) => e.key === "Enter" && confirmarEdicao(pasta.id)}
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: cores.textoPrincipal }}
                  />
                ) : (
                  <button
                    onClick={() => selecionarPasta(pasta.id)}
                    className="flex-1 text-left text-sm"
                    style={{ color: cores.textoPrincipal }}
                  >
                    {pasta.nome}
                  </button>
                )}

                <button
                  onClick={() => setMenuAbertoId(menuAberto ? null : pasta.id)}
                  className="px-1 text-sm"
                  style={{ color: cores.textoSecundario }}
                >
                  ⋮
                </button>

                {menuAberto && (
                  <>
                    {/* Camada invisível atrás do menu: clicar fora dele fecha o menu */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuAbertoId(null)}
                    />

                    <div
                      className="absolute right-0 top-9 z-20 w-44 rounded-xl p-2 shadow-md"
                      style={{ backgroundColor: cores.fundo, border: `1px solid ${cores.borda}` }}
                    >
                      <button
                        onClick={() => iniciarEdicao(pasta)}
                        className="block w-full rounded-lg px-2 py-1 text-left text-xs hover:shadow-sm"
                        style={{ color: cores.textoPrincipal }}
                      >
                        Renomear
                      </button>

                      <div className="mt-1 px-2 py-1">
                        <SeletorCor
                          corSelecionada={pasta.cor}
                          onSelecionar={(cor) => mudarCorPasta(pasta.id, cor)}
                        />
                      </div>

                      <button
                        onClick={() => {
                          excluirPasta(pasta.id);
                          setMenuAbertoId(null);
                        }}
                        className="mt-1 block w-full rounded-lg px-2 py-1 text-left text-xs hover:shadow-sm"
                        style={{ color: "#E76F51" }}
                      >
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {modalNovaPastaAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
          onClick={fecharModalNovaPasta}
        >
          <div
            className="w-80 rounded-2xl p-6 shadow-lg"
            style={{ backgroundColor: cores.fundo, border: `1px solid ${cores.borda}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="mb-4 text-sm font-medium"
              style={{ color: cores.textoPrincipal }}
            >
              Nova pasta
            </h2>

            <input
              autoFocus
              value={nomeNovaPasta}
              onChange={(e) => setNomeNovaPasta(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmarNovaPasta()}
              placeholder="Nome da pasta"
              className="mb-3 w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "transparent",
                border: `1px solid ${cores.borda}`,
                color: cores.textoPrincipal,
              }}
            />

            <p className="mb-1 text-xs" style={{ color: cores.textoSecundario }}>
              Cor
            </p>
            <SeletorCor corSelecionada={corNovaPasta} onSelecionar={setCorNovaPasta} />

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={fecharModalNovaPasta}
                className="rounded-xl px-4 py-2 text-xs font-medium"
                style={{ color: cores.textoSecundario, border: `1px solid ${cores.borda}` }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarNovaPasta}
                className="rounded-xl px-4 py-2 text-xs font-medium text-white"
                style={{ backgroundColor: cores.textoPrincipal }}
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}