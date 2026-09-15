"use client";

import { useState, useEffect } from "react";
import { cores } from "../theme";
import { useCalendario } from "../context/CalendarioContext";
import { Etiqueta } from "../types";

type Props = {
  dia: number;
  mes: number;
  ano: number;
  eventoInicialId?: string;
  onFechar: () => void;
};

export default function PainelNovoEvento({ dia, mes, ano, eventoInicialId, onFechar }: Props) {
  const { eventos, etiquetas, adicionarEvento, editarEvento, removerEvento, adicionarEtiqueta, editarEtiqueta, removerEtiqueta } =
    useCalendario();

  const [editandoEventoId, setEditandoEventoId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [horario, setHorario] = useState("");
  const [etiquetaSelecionada, setEtiquetaSelecionada] = useState(etiquetas[0]?.id ?? "");
  const [formEtiquetaAberto, setFormEtiquetaAberto] = useState(false);
  const [editandoEtiquetaId, setEditandoEtiquetaId] = useState<string | null>(null);
  const [nomeEtiquetaNova, setNomeEtiquetaNova] = useState("");
  const [corEtiquetaNova, setCorEtiquetaNova] = useState("#8FBFA0");

  function iniciarEdicaoEvento(id: string) {
    const evento = eventos.find((e) => e.id === id);
    if (!evento) return;
    setEditandoEventoId(id);
    setTitulo(evento.titulo);
    setHorario(evento.horario ?? "");
    setEtiquetaSelecionada(evento.etiquetaId);
  }

  // Se o painel foi aberto clicando direto num evento (na grade), já entra em modo edição
  useEffect(() => {
    if (eventoInicialId) {
      iniciarEdicaoEvento(eventoInicialId);
    }
  }, [eventoInicialId]);

  function cancelarEdicaoEvento() {
    setEditandoEventoId(null);
    setTitulo("");
    setHorario("");
    setEtiquetaSelecionada(etiquetas[0]?.id ?? "");
  }

  function excluirEvento(id: string) {
    removerEvento(id);
    cancelarEdicaoEvento();
  }

  function abrirNovaEtiqueta() {
    setEditandoEtiquetaId(null);
    setNomeEtiquetaNova("");
    setCorEtiquetaNova("#8FBFA0");
    setFormEtiquetaAberto(true);
  }

  function abrirEdicaoEtiqueta(et: Etiqueta) {
    setEditandoEtiquetaId(et.id);
    setNomeEtiquetaNova(et.nome);
    setCorEtiquetaNova(et.cor);
    setFormEtiquetaAberto(true);
  }

  function salvarEtiqueta() {
    if (nomeEtiquetaNova.trim() === "") return;
    if (editandoEtiquetaId) {
      editarEtiqueta(editandoEtiquetaId, { nome: nomeEtiquetaNova.trim(), cor: corEtiquetaNova });
    } else {
      adicionarEtiqueta({ nome: nomeEtiquetaNova.trim(), cor: corEtiquetaNova });
    }
    setFormEtiquetaAberto(false);
    setEditandoEtiquetaId(null);
  }

  function excluirEtiqueta(id: string) {
    removerEtiqueta(id);
    if (etiquetaSelecionada === id) setEtiquetaSelecionada("");
  }

  function salvar() {
    if (titulo.trim() === "") return;

    if (editandoEventoId) {
      editarEvento(editandoEventoId, {
        titulo: titulo.trim(),
        etiquetaId: etiquetaSelecionada,
        horario: horario || undefined,
      });
      cancelarEdicaoEvento();
    } else {
      adicionarEvento({
        dia,
        mes,
        ano,
        titulo: titulo.trim(),
        etiquetaId: etiquetaSelecionada,
        horario: horario || undefined,
      });
      setTitulo("");
      setHorario("");
    }
  }

  return (
    <div className="rounded-2xl p-4 shadow-md" style={{ backgroundColor: cores.fundoCard, border: `1px solid ${cores.borda}` }}>
      <p className="mb-2 text-sm font-medium" style={{ color: cores.textoPrincipal }}>
        {editandoEventoId ? `Editar compromisso — ${dia}/${mes + 1}` : `Novo compromisso — ${dia}/${mes + 1}`}
      </p>

      <div className="mb-2 flex gap-2">
        <input
          autoFocus
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título"
          className="flex-1 rounded-lg px-2 py-1 text-sm outline-none"
          style={{ border: `1px solid ${cores.borda}`, color: cores.textoPrincipal }}
        />
        <input
          type="time"
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          className="rounded-lg px-2 py-1 text-sm outline-none"
          style={{ border: `1px solid ${cores.borda}`, color: cores.textoPrincipal }}
        />
      </div>

      <p className="mb-1 text-xs" style={{ color: cores.textoSecundario }}>Etiqueta</p>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {etiquetas.map((et) => (
          <div
            key={et.id}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs"
            style={{ border: `1px solid ${et.id === etiquetaSelecionada ? cores.textoPrincipal : cores.borda}`, color: cores.textoPrincipal }}
          >
            <button onClick={() => setEtiquetaSelecionada(et.id)} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: et.cor }} />
              {et.nome}
            </button>
            <button onClick={() => abrirEdicaoEtiqueta(et)} title="Editar" style={{ color: cores.textoSecundario }}>
              ✎
            </button>
            <button onClick={() => excluirEtiqueta(et.id)} title="Excluir" style={{ color: cores.textoSecundario }}>
              ×
            </button>
          </div>
        ))}
        <button onClick={abrirNovaEtiqueta} className="text-xs" style={{ color: cores.textoSecundario }}>
          + nova
        </button>
      </div>

      {formEtiquetaAberto && (
        <div className="mb-3 flex items-center gap-2">
          <input
            value={nomeEtiquetaNova}
            onChange={(e) => setNomeEtiquetaNova(e.target.value)}
            placeholder="Nome da etiqueta"
            className="w-28 rounded-lg px-2 py-1 text-xs outline-none"
            style={{ border: `1px solid ${cores.borda}`, color: cores.textoPrincipal }}
          />
          <input type="color" value={corEtiquetaNova} onChange={(e) => setCorEtiquetaNova(e.target.value)} className="h-6 w-6 cursor-pointer rounded" />
          <button onClick={salvarEtiqueta} className="text-xs" style={{ color: cores.textoPrincipal }}>
            {editandoEtiquetaId ? "Salvar" : "Adicionar"}
          </button>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {editandoEventoId && (
          <button onClick={() => excluirEvento(editandoEventoId)} className="text-xs" style={{ color: "#C97B7B" }}>
            Excluir
          </button>
        )}
        {editandoEventoId && (
          <button onClick={cancelarEdicaoEvento} className="text-xs" style={{ color: cores.textoSecundario }}>
            Cancelar
          </button>
        )}
        <button onClick={onFechar} className="text-xs" style={{ color: cores.textoSecundario }}>Fechar</button>
        <button onClick={salvar} className="rounded-lg px-3 py-1 text-xs text-white" style={{ backgroundColor: cores.textoPrincipal }}>
          {editandoEventoId ? "Salvar edição" : "Salvar"}
        </button>
      </div>
    </div>
  );
}