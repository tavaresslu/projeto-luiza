"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cores, hexParaRgba } from "../theme";
import { usePasta } from "../context/PastaContext";
import { supabase } from "../lib/superbaseClient";
import { dataParaInput, inputParaData, statusDoPrazo, temData } from "../utils";
import AnelTarefa from "./AnelTarefa";

// Opacidades bem suaves do fundo dos cards, pra dar um pouco de variedade
const OPACIDADES_CARD = [0.2, 0.12, 0.28, 0.16, 0.24, 0.1];

type Conteudo = {
  id: string;
  tipo: "link" | "nota" | "arquivo";
  titulo: string;
  valor: string;
  criado_em: string;
};

export default function PainelPasta() {
  const {
    pastaSelecionada,
    fecharPasta,
    adicionarItemChecklist,
    mudarEtapaItem,
    definirEtapasItem,
    removerItemChecklist,
    definirDataItem,
    renomearTituloChecklist,
    criarSubpasta,
    renomearSubpasta,
    excluirSubpasta,
  } = usePasta();

  const [novoItemTexto, setNovoItemTexto] = useState("");
  const [novaSubpastaNome, setNovaSubpastaNome] = useState("");
  const [criandoSubpasta, setCriandoSubpasta] = useState(false);
  const [subpastaAbertaId, setSubpastaAbertaId] = useState<string | null>(null);

  // --- Estados dos conteúdos (link, nota, arquivo) da subpasta aberta ---
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [carregandoConteudos, setCarregandoConteudos] = useState(false);
  const [tipoNovoConteudo, setTipoNovoConteudo] = useState<"link" | "nota" | null>(null);
  const [novoConteudoTitulo, setNovoConteudoTitulo] = useState("");
  const [novoConteudoValor, setNovoConteudoValor] = useState("");
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);

  // Busca os conteúdos no Supabase toda vez que uma subpasta diferente é aberta
  useEffect(() => {
    setTipoNovoConteudo(null);
    setNovoConteudoTitulo("");
    setNovoConteudoValor("");

    if (!subpastaAbertaId) {
      setConteudos([]);
      return;
    }

    setCarregandoConteudos(true);
    supabase
      .from("conteudos")
      .select("*")
      .eq("subpasta_id", subpastaAbertaId)
      .order("criado_em", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setConteudos(data as Conteudo[]);
        setCarregandoConteudos(false);
      });
  }, [subpastaAbertaId]);

  // Fecha a janela ao apertar Esc
  useEffect(() => {
    if (!subpastaAbertaId) return;
    function aoApertarTecla(e: KeyboardEvent) {
      if (e.key === "Escape") setSubpastaAbertaId(null);
    }
    window.addEventListener("keydown", aoApertarTecla);
    return () => window.removeEventListener("keydown", aoApertarTecla);
  }, [subpastaAbertaId]);

  if (!pastaSelecionada) return null;

  const total = pastaSelecionada.itensChecklist.length;
  const concluidos = pastaSelecionada.itensChecklist.filter((i) => i.concluido).length;
  const subpastaAberta = pastaSelecionada.subpastas.find((s) => s.id === subpastaAbertaId) ?? null;
  const hoje = new Date();

  function adicionarItem() {
    if (novoItemTexto.trim() === "" || !pastaSelecionada) return;
    adicionarItemChecklist(pastaSelecionada.id, novoItemTexto.trim());
    setNovoItemTexto("");
  }

  function confirmarNovaSubpasta() {
    if (novaSubpastaNome.trim() === "" || !pastaSelecionada) {
      setCriandoSubpasta(false);
      return;
    }
    criarSubpasta(pastaSelecionada.id, novaSubpastaNome.trim());
    setNovaSubpastaNome("");
    setCriandoSubpasta(false);
  }

  async function adicionarLinkOuNota() {
    if (!subpastaAbertaId || !tipoNovoConteudo || novoConteudoValor.trim() === "") return;
    const titulo =
      novoConteudoTitulo.trim() || (tipoNovoConteudo === "link" ? novoConteudoValor.trim() : "Nota");

    const { data, error } = await supabase
      .from("conteudos")
      .insert({ subpasta_id: subpastaAbertaId, tipo: tipoNovoConteudo, titulo, valor: novoConteudoValor.trim() })
      .select()
      .single();

    if (!error && data) {
      setConteudos((atual) => [...atual, data as Conteudo]);
    }
    setTipoNovoConteudo(null);
    setNovoConteudoTitulo("");
    setNovoConteudoValor("");
  }

  async function enviarArquivo(arquivo: File) {
    if (!subpastaAbertaId) return;
    setEnviandoArquivo(true);

    const caminho = `${subpastaAbertaId}/${Date.now()}-${arquivo.name}`;
    const { error: erroUpload } = await supabase.storage.from("conteudos-arquivos").upload(caminho, arquivo);

    if (!erroUpload) {
      const { data: urlData } = supabase.storage.from("conteudos-arquivos").getPublicUrl(caminho);
      const { data, error } = await supabase
        .from("conteudos")
        .insert({ subpasta_id: subpastaAbertaId, tipo: "arquivo", titulo: arquivo.name, valor: urlData.publicUrl })
        .select()
        .single();

      if (!error && data) {
        setConteudos((atual) => [...atual, data as Conteudo]);
      }
    }
    setEnviandoArquivo(false);
  }

  async function removerConteudo(id: string) {
    await supabase.from("conteudos").delete().eq("id", id);
    setConteudos((atual) => atual.filter((c) => c.id !== id));
  }

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl"
      style={{ backgroundColor: cores.fundoCard, border: `1px solid ${cores.borda}` }}
    >
      {/* Animações da janela (abrir com um leve "sobe e aparece") */}
      <style>{`
        @keyframes fundoAparece {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes janelaSobe {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Cabeçalho: título no canto esquerdo */}
      <div
        className="relative flex items-center px-7 py-6 pr-16"
        style={{ backgroundColor: hexParaRgba(pastaSelecionada.cor, 0.14) }}
      >
        <h1 className="text-2xl font-medium" style={{ color: cores.textoPrincipal }}>
          {pastaSelecionada.nome}
        </h1>

        <button
          onClick={fecharPasta}
          className="absolute right-6 flex h-7 w-7 items-center justify-center rounded-full text-sm transition-opacity hover:opacity-60"
          style={{ backgroundColor: cores.fundoCard, color: cores.textoSecundario }}
          title="Fechar"
        >
          ×
        </button>
      </div>

      {/* Corpo: Conteúdos à esquerda, Checklist à direita */}
      <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-7 pb-7 pt-5 lg:flex-row lg:items-start">
        {/* --- CONTEÚDOS: cards --- */}
        <div className="flex-1">
          <p className="mb-3 text-sm font-medium" style={{ color: cores.textoPrincipal }}>
            Conteúdos
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {pastaSelecionada.subpastas.map((sub, i) => (
              <div
                key={sub.id}
                onClick={() => setSubpastaAbertaId(sub.id)}
                className="group relative flex h-28 cursor-pointer flex-col justify-between rounded-3xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  backgroundColor: hexParaRgba(pastaSelecionada.cor, OPACIDADES_CARD[i % OPACIDADES_CARD.length]),
                  border: `1px solid ${hexParaRgba(pastaSelecionada.cor, 0.3)}`,
                }}
                title="Clique para abrir"
              >
                <div className="flex items-start justify-between">
                  {/* Bolinha com a inicial do nome */}
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: pastaSelecionada.cor }}
                  >
                    {sub.nome.charAt(0).toUpperCase()}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      excluirSubpasta(pastaSelecionada.id, sub.id);
                    }}
                    className="hidden h-5 w-5 items-center justify-center rounded-full text-xs text-white group-hover:flex"
                    style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
                    title="Excluir"
                  >
                    ×
                  </button>
                </div>

                <p
                  className="truncate text-base font-semibold leading-tight"
                  style={{ color: cores.textoPrincipal }}
                >
                  {sub.nome}
                </p>
              </div>
            ))}

            {/* Card pontilhado pra criar um novo */}
            {criandoSubpasta ? (
              <div
                className="flex h-28 flex-col justify-end rounded-3xl p-4"
                style={{ border: `1.5px dashed ${cores.borda}` }}
              >
                <input
                  autoFocus
                  value={novaSubpastaNome}
                  onChange={(e) => setNovaSubpastaNome(e.target.value)}
                  onBlur={confirmarNovaSubpasta}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmarNovaSubpasta();
                  }}
                  placeholder="Nome..."
                  className="w-full bg-transparent text-base font-semibold outline-none"
                  style={{ color: cores.textoPrincipal }}
                />
              </div>
            ) : (
              <button
                onClick={() => setCriandoSubpasta(true)}
                className="flex h-28 items-center justify-center rounded-3xl text-2xl transition-colors hover:opacity-70"
                style={{ border: `1.5px dashed ${cores.borda}`, color: cores.textoSecundario }}
                title="Novo conteúdo"
              >
                +
              </button>
            )}
          </div>
        </div>

        {/* --- CHECKLIST: à direita, com fundo mais escuro e linhas de caderno --- */}
        <div
          className="w-full shrink-0 rounded-2xl p-5 lg:w-80"
          style={{
            backgroundColor: "rgba(0,0,0,0.035)",
            backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 30px, ${hexParaRgba(
              cores.borda,
              0.6
            )} 31px)`,
            backgroundPosition: "0 4px",
          }}
        >
          <input
            value={pastaSelecionada.tituloChecklist}
            onChange={(e) => renomearTituloChecklist(pastaSelecionada.id, e.target.value)}
            className="mb-1 w-full bg-transparent text-sm font-medium outline-none"
            style={{ color: cores.textoPrincipal }}
          />
          <p className="mb-3 text-xs" style={{ color: cores.textoSecundario }}>
            {total === 0 ? "Nenhum item ainda" : `${concluidos} de ${total} concluídos`}
          </p>

          <div className="my-4 flex items-center gap-3">
            <input
              value={novoItemTexto}
              onChange={(e) => setNovoItemTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") adicionarItem();
              }}
              placeholder="Adicionar à lista..."
              className="flex-1 bg-transparent pb-1.5 text-sm outline-none"
              style={{ borderBottom: `1px solid ${cores.borda}`, color: cores.textoPrincipal }}
            />
            <button
              onClick={adicionarItem}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm transition-opacity hover:opacity-80"
              style={{ backgroundColor: hexParaRgba(pastaSelecionada.cor, 0.25), color: cores.textoPrincipal }}
              title="Adicionar"
            >
              +
            </button>
          </div>

          <ul>
            {pastaSelecionada.itensChecklist.map((item, i) => {
              const atrasado = !item.concluido && statusDoPrazo(item, hoje) === "atrasada";
              // A linha da data e das etapas fica sempre visível se o item já tem algum dos dois;
              // senão, só aparece ao passar o mouse
              const mostrarLinhaExtra = temData(item) || !!item.etapas;

              return (
                <li
                  key={item.id}
                  className="group py-2.5"
                  style={{
                    borderBottom:
                      i < pastaSelecionada.itensChecklist.length - 1 ? `1px solid ${cores.borda}` : "none",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {/* Anel de progresso da tarefa */}
                    <AnelTarefa
                      etapas={item.etapas}
                      etapasFeitas={item.etapasFeitas}
                      concluido={item.concluido}
                      cor={pastaSelecionada.cor}
                      onAvancar={() => mudarEtapaItem(pastaSelecionada.id, item.id, 1)}
                      onVoltar={() => mudarEtapaItem(pastaSelecionada.id, item.id, -1)}
                    />

                    <span
                      className="min-w-0 flex-1 text-sm transition-colors"
                      style={{
                        color: item.concluido ? cores.textoSecundario : cores.textoPrincipal,
                        textDecoration: item.concluido ? "line-through" : "none",
                      }}
                    >
                      {item.texto}
                    </span>

                    <button
                      onClick={() => removerItemChecklist(pastaSelecionada.id, item.id)}
                      className="hidden text-sm opacity-40 transition-opacity hover:opacity-100 group-hover:block"
                      style={{ color: cores.textoSecundario }}
                      title="Remover item"
                    >
                      ×
                    </button>
                  </div>

                  {/* Linha com a data e o número de etapas da tarefa */}
                  <div
                    className={`mt-1 items-center gap-3 pl-[42px] ${
                      mostrarLinhaExtra ? "flex" : "hidden group-hover:flex focus-within:flex"
                    }`}
                  >
                    <input
                      type="date"
                      value={dataParaInput(item)}
                      onChange={(e) =>
                        definirDataItem(pastaSelecionada.id, item.id, inputParaData(e.target.value))
                      }
                      title="Definir data"
                      className="w-[104px] shrink-0 bg-transparent text-[10px] outline-none"
                      style={{ color: atrasado ? "#E76F51" : cores.textoSecundario }}
                    />

                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={item.etapas ?? ""}
                      onChange={(e) =>
                        definirEtapasItem(
                          pastaSelecionada.id,
                          item.id,
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      placeholder="etapas"
                      title="Em quantas etapas esta tarefa é dividida (2 a 20)"
                      className="w-14 bg-transparent text-[10px] outline-none"
                      style={{ color: cores.textoSecundario }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* --- JANELA que abre por cima de tudo ao clicar num card --- */}
      {subpastaAberta &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{
              backgroundColor: "rgba(20,20,20,0.35)",
              backdropFilter: "blur(4px)",
              animation: "fundoAparece 0.2s ease-out",
            }}
            onClick={() => setSubpastaAbertaId(null)}
          >
            <div
              className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl shadow-2xl"
              style={{
                backgroundColor: cores.fundoCard,
                border: `1px solid ${cores.borda}`,
                animation: "janelaSobe 0.25s ease-out",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabeçalho da janela: bolinha + título editável + fechar */}
              <div
                className="flex items-center gap-3 px-6 py-5"
                style={{ backgroundColor: hexParaRgba(pastaSelecionada.cor, 0.14) }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white"
                  style={{ backgroundColor: pastaSelecionada.cor }}
                >
                  {subpastaAberta.nome.charAt(0).toUpperCase()}
                </span>

                <input
                  value={subpastaAberta.nome}
                  onChange={(e) => renomearSubpasta(pastaSelecionada.id, subpastaAberta.id, e.target.value)}
                  className="flex-1 bg-transparent text-xl font-medium outline-none"
                  style={{ color: cores.textoPrincipal }}
                  title="Clique para renomear"
                />

                <button
                  onClick={() => setSubpastaAbertaId(null)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm transition-opacity hover:opacity-60"
                  style={{ backgroundColor: cores.fundoCard, color: cores.textoSecundario }}
                  title="Fechar"
                >
                  ×
                </button>
              </div>

              {/* Corpo da janela */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {carregandoConteudos ? (
                  <p className="text-sm" style={{ color: cores.textoSecundario }}>
                    Carregando...
                  </p>
                ) : (
                  <>
                    {conteudos.length === 0 && (
                      <p className="mb-5 text-sm" style={{ color: cores.textoSecundario }}>
                        Nenhum conteúdo aqui ainda.
                      </p>
                    )}

                    {conteudos.length > 0 && (
                      <ul className="mb-5 space-y-2.5">
                        {conteudos.map((c) => (
                          <li
                            key={c.id}
                            className="group flex items-start gap-3 rounded-2xl px-4 py-3"
                            style={{
                              backgroundColor: hexParaRgba(pastaSelecionada.cor, 0.07),
                              border: `1px solid ${hexParaRgba(pastaSelecionada.cor, 0.2)}`,
                            }}
                          >
                            <span
                              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
                              style={{ backgroundColor: hexParaRgba(pastaSelecionada.cor, 0.25) }}
                            >
                              {c.tipo === "link" ? "🔗" : c.tipo === "arquivo" ? "📎" : "📝"}
                            </span>

                            {c.tipo === "nota" ? (
                              <span
                                className="flex-1 whitespace-pre-wrap break-words text-sm"
                                style={{ color: cores.textoPrincipal }}
                              >
                                {c.valor}
                              </span>
                            ) : (
                              <a
                                href={c.valor}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-w-0 flex-1"
                              >
                                <p className="truncate text-sm font-medium" style={{ color: cores.textoPrincipal }}>
                                  {c.titulo}
                                </p>
                                <p className="truncate text-xs" style={{ color: cores.textoSecundario }}>
                                  {c.valor}
                                </p>
                              </a>
                            )}

                            <button
                              onClick={() => removerConteudo(c.id)}
                              className="hidden text-sm opacity-40 transition-opacity hover:opacity-100 group-hover:block"
                              style={{ color: cores.textoSecundario }}
                              title="Remover"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {/* Formulário pra adicionar novo conteúdo */}
                {tipoNovoConteudo ? (
                  <div className="space-y-2 rounded-2xl p-4" style={{ border: `1px solid ${cores.borda}` }}>
                    {tipoNovoConteudo === "link" && (
                      <input
                        autoFocus
                        value={novoConteudoValor}
                        onChange={(e) => setNovoConteudoValor(e.target.value)}
                        placeholder="Cole o link aqui (https://...)"
                        className="w-full bg-transparent text-sm outline-none"
                        style={{ borderBottom: `1px solid ${cores.borda}`, color: cores.textoPrincipal, paddingBottom: 4 }}
                      />
                    )}
                    {tipoNovoConteudo === "nota" && (
                      <textarea
                        autoFocus
                        value={novoConteudoValor}
                        onChange={(e) => setNovoConteudoValor(e.target.value)}
                        placeholder="Escreva sua nota..."
                        rows={3}
                        className="w-full resize-none bg-transparent text-sm outline-none"
                        style={{ borderBottom: `1px solid ${cores.borda}`, color: cores.textoPrincipal, paddingBottom: 4 }}
                      />
                    )}
                    {tipoNovoConteudo === "link" && (
                      <input
                        value={novoConteudoTitulo}
                        onChange={(e) => setNovoConteudoTitulo(e.target.value)}
                        placeholder="Título (opcional)"
                        className="w-full bg-transparent text-xs outline-none"
                        style={{ color: cores.textoSecundario }}
                      />
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={adicionarLinkOuNota}
                        className="rounded-full px-4 py-1.5 text-xs"
                        style={{ backgroundColor: hexParaRgba(pastaSelecionada.cor, 0.3), color: cores.textoPrincipal }}
                      >
                        Adicionar
                      </button>
                      <button
                        onClick={() => {
                          setTipoNovoConteudo(null);
                          setNovoConteudoValor("");
                          setNovoConteudoTitulo("");
                        }}
                        className="text-xs"
                        style={{ color: cores.textoSecundario }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTipoNovoConteudo("link")}
                      className="rounded-full px-4 py-2 text-xs transition-opacity hover:opacity-70"
                      style={{ backgroundColor: hexParaRgba(pastaSelecionada.cor, 0.18), color: cores.textoPrincipal }}
                    >
                      + Link
                    </button>
                    <button
                      onClick={() => setTipoNovoConteudo("nota")}
                      className="rounded-full px-4 py-2 text-xs transition-opacity hover:opacity-70"
                      style={{ backgroundColor: hexParaRgba(pastaSelecionada.cor, 0.18), color: cores.textoPrincipal }}
                    >
                      + Nota
                    </button>
                    <label
                      className="cursor-pointer rounded-full px-4 py-2 text-xs transition-opacity hover:opacity-70"
                      style={{ backgroundColor: hexParaRgba(pastaSelecionada.cor, 0.18), color: cores.textoPrincipal }}
                    >
                      {enviandoArquivo ? "Enviando..." : "+ Arquivo"}
                      <input
                        type="file"
                        className="hidden"
                        disabled={enviandoArquivo}
                        onChange={(e) => {
                          const arquivo = e.target.files?.[0];
                          if (arquivo) enviarArquivo(arquivo);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}