"use client";

import { useState, useEffect } from "react";
import { cores, hexParaRgba } from "../theme";
import { usePasta } from "../context/PastaContext";
import { supabase } from "../lib/supabaseClient";

// Opacidades diferentes pra dar variedade visual aos "balões", mesmo todos usando a cor da pasta
const OPACIDADES_CARD = [0.55, 0.35, 0.7, 0.45, 0.6, 0.3];

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
    alternarItemChecklist,
    removerItemChecklist,
    renomearTituloChecklist,
    criarSubpasta,
    renomearSubpasta,
    excluirSubpasta,
  } = usePasta();

  const [novoItemTexto, setNovoItemTexto] = useState("");
  const [novaSubpastaNome, setNovaSubpastaNome] = useState("");
  const [criandoSubpasta, setCriandoSubpasta] = useState(false);
  const [subpastaEditandoId, setSubpastaEditandoId] = useState<string | null>(null);
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

  if (!pastaSelecionada) return null;

  const total = pastaSelecionada.itensChecklist.length;
  const concluidos = pastaSelecionada.itensChecklist.filter((i) => i.concluido).length;
  const progresso = total === 0 ? 0 : (concluidos / total) * 100;
  const subpastaAberta = pastaSelecionada.subpastas.find((s) => s.id === subpastaAbertaId) ?? null;

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
      {/* Cabeçalho: título centralizado */}
      <div
        className="relative flex items-center justify-center px-7 py-6"
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
        {/* --- CONTEÚDOS: balões coloridos --- */}
        <div className="flex-1">
          <p className="mb-3 text-sm font-medium" style={{ color: cores.textoPrincipal }}>
            Conteúdos
          </p>

          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {pastaSelecionada.subpastas.map((sub, i) => (
              <div
                key={sub.id}
                className="group relative flex h-24 flex-col justify-end overflow-hidden rounded-2xl p-3 transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: hexParaRgba(pastaSelecionada.cor, OPACIDADES_CARD[i % OPACIDADES_CARD.length]) }}
              >
                <button
                  onClick={() => excluirSubpasta(pastaSelecionada.id, sub.id)}
                  className="absolute right-2 top-2 hidden h-5 w-5 items-center justify-center rounded-full text-xs text-white transition-opacity group-hover:flex"
                  style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
                  title="Excluir"
                >
                  ×
                </button>

                {subpastaEditandoId === sub.id ? (
                  <input
                    autoFocus
                    value={sub.nome}
                    onChange={(e) => renomearSubpasta(pastaSelecionada.id, sub.id, e.target.value)}
                    onBlur={() => setSubpastaEditandoId(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSubpastaEditandoId(null);
                    }}
                    className="w-full bg-transparent text-base font-semibold outline-none"
                    style={{ color: cores.textoPrincipal }}
                  />
                ) : (
                  <button
                    onClick={() => setSubpastaAbertaId(sub.id)}
                    onDoubleClick={() => setSubpastaEditandoId(sub.id)}
                    className="text-left text-base font-semibold leading-tight"
                    style={{ color: cores.textoPrincipal }}
                    title="Clique para abrir, duplo clique para renomear"
                  >
                    {sub.nome}
                  </button>
                )}
              </div>
            ))}

            {/* Balão pontilhado pra criar um novo */}
            {criandoSubpasta ? (
              <div
                className="flex h-24 flex-col justify-end rounded-2xl p-3"
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
                className="flex h-24 items-center justify-center rounded-2xl text-2xl transition-colors hover:opacity-70"
                style={{ border: `1.5px dashed ${cores.borda}`, color: cores.textoSecundario }}
                title="Novo conteúdo"
              >
                +
              </button>
            )}
          </div>

          {/* Área que abre ao clicar num balão */}
          {subpastaAberta && (
            <div className="mb-8 rounded-xl p-5" style={{ border: `1px solid ${cores.borda}` }}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: cores.textoPrincipal }}>
                  {subpastaAberta.nome}
                </p>
                <button
                  onClick={() => setSubpastaAbertaId(null)}
                  className="text-sm"
                  style={{ color: cores.textoSecundario }}
                >
                  Fechar
                </button>
              </div>

              {carregandoConteudos ? (
                <p className="text-sm" style={{ color: cores.textoSecundario }}>
                  Carregando...
                </p>
              ) : (
                <>
                  {conteudos.length === 0 && (
                    <p className="mb-4 text-sm" style={{ color: cores.textoSecundario }}>
                      Nenhum conteúdo aqui ainda.
                    </p>
                  )}

                  {conteudos.length > 0 && (
                    <ul className="mb-4 space-y-2">
                      {conteudos.map((c) => (
                        <li
                          key={c.id}
                          className="group flex items-center gap-3 rounded-lg px-3 py-2"
                          style={{ border: `1px solid ${cores.borda}` }}
                        >
                          <span className="text-xs">
                            {c.tipo === "link" ? "🔗" : c.tipo === "arquivo" ? "📎" : "📝"}
                          </span>

                          {c.tipo === "nota" ? (
                            <span className="flex-1 text-sm" style={{ color: cores.textoPrincipal }}>
                              {c.valor}
                            </span>
                          ) : (
                            
                              href={c.valor}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 truncate text-sm underline"
                              style={{ color: cores.textoPrincipal }}
                            >
                              {c.titulo}
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
                <div className="space-y-2 rounded-lg p-3" style={{ border: `1px solid ${cores.borda}` }}>
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
                      className="rounded-full px-3 py-1 text-xs"
                      style={{ backgroundColor: hexParaRgba(pastaSelecionada.cor, 0.25), color: cores.textoPrincipal }}
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
                    className="rounded-full px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
                    style={{ border: `1.5px dashed ${cores.borda}`, color: cores.textoSecundario }}
                  >
                    + Link
                  </button>
                  <button
                    onClick={() => setTipoNovoConteudo("nota")}
                    className="rounded-full px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
                    style={{ border: `1.5px dashed ${cores.borda}`, color: cores.textoSecundario }}
                  >
                    + Nota
                  </button>
                  <label
                    className="cursor-pointer rounded-full px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
                    style={{ border: `1.5px dashed ${cores.borda}`, color: cores.textoSecundario }}
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
          )}
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

          <div className="mb-1 h-[3px] overflow-hidden rounded-full" style={{ backgroundColor: cores.borda }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progresso}%`, backgroundColor: pastaSelecionada.cor }}
            />
          </div>

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
            {pastaSelecionada.itensChecklist.map((item, i) => (
              <li
                key={item.id}
                className="group flex items-center gap-3 py-2.5"
                style={{
                  borderBottom:
                    i < pastaSelecionada.itensChecklist.length - 1 ? `1px solid ${cores.borda}` : "none",
                }}
              >
                <button
                  onClick={() => alternarItemChecklist(pastaSelecionada.id, item.id)}
                  className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[5px] transition-colors"
                  style={{
                    border: `1.3px solid ${cores.borda}`,
                    backgroundColor: item.concluido ? hexParaRgba(pastaSelecionada.cor, 0.35) : "transparent",
                  }}
                >
                  {item.concluido && (
                    <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke={cores.textoPrincipal} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <span
                  className="flex-1 text-sm transition-colors"
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
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}