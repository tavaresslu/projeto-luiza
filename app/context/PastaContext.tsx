"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { paletaCores } from "../components/SeletorCor";

type Pasta = {
  id: string;
  nome: string;
  cor: string;
};

const pastasIniciais: Pasta[] = [
  { id: "materias", nome: "Matérias da faculdade", cor: paletaCores[0] },
  { id: "empresa-junior", nome: "Empresa júnior", cor: paletaCores[1] },
  { id: "projetos", nome: "Projetos", cor: paletaCores[2] },
];

type PastaContextType = {
  pastas: Pasta[];
  pastaSelecionada: Pasta | null;
  selecionarPasta: (id: string) => void;
  fecharPasta: () => void;
  criarPasta: (nome: string) => void;
  renomearPasta: (id: string, novoNome: string) => void;
  mudarCorPasta: (id: string, novaCor: string) => void;
  excluirPasta: (id: string) => void;
  reordenarPastas: (novaOrdem: Pasta[]) => void;
};

const PastaContext = createContext<PastaContextType | undefined>(undefined);

export function PastaProvider({ children }: { children: ReactNode }) {
  const [pastas, setPastas] = useState<Pasta[]>(pastasIniciais);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);

  const pastaSelecionada = pastas.find((p) => p.id === selecionadaId) ?? null;

  function selecionarPasta(id: string) {
    setSelecionadaId(id);
  }

  function fecharPasta() {
    setSelecionadaId(null);
  }

  function criarPasta(nome: string) {
    const novaPasta: Pasta = {
      id: `${Date.now()}`,
      nome,
      cor: paletaCores[pastas.length % paletaCores.length],
    };
    setPastas([...pastas, novaPasta]);
  }

  function renomearPasta(id: string, novoNome: string) {
    setPastas(pastas.map((p) => (p.id === id ? { ...p, nome: novoNome } : p)));
  }

  function mudarCorPasta(id: string, novaCor: string) {
    setPastas(pastas.map((p) => (p.id === id ? { ...p, cor: novaCor } : p)));
  }

  function excluirPasta(id: string) {
    setPastas(pastas.filter((p) => p.id !== id));
    if (selecionadaId === id) {
      setSelecionadaId(null);
    }
  }

  function reordenarPastas(novaOrdem: Pasta[]) {
    setPastas(novaOrdem);
  }

  return (
    <PastaContext.Provider
      value={{
        pastas,
        pastaSelecionada,
        selecionarPasta,
        fecharPasta,
        criarPasta,
        renomearPasta,
        mudarCorPasta,
        excluirPasta,
        reordenarPastas,
      }}
    >
      {children}
    </PastaContext.Provider>
  );
}

export function usePasta() {
  const context = useContext(PastaContext);
  if (!context) {
    throw new Error("usePasta precisa ser usado dentro de um PastaProvider");
  }
  return context;
}