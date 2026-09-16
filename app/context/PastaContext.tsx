"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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

const CHAVE_STORAGE = "projeto-luiza:pastas";

type PastaContextType = {
  pastas: Pasta[];
  pastaSelecionada: Pasta | null;
  selecionarPasta: (id: string) => void;
  fecharPasta: () => void;
  criarPasta: (nome: string, cor?: string) => void;
  renomearPasta: (id: string, novoNome: string) => void;
  mudarCorPasta: (id: string, novaCor: string) => void;
  excluirPasta: (id: string) => void;
  reordenarPastas: (novaOrdem: Pasta[]) => void;
};

const PastaContext = createContext<PastaContextType | undefined>(undefined);

export function PastaProvider({ children }: { children: ReactNode }) {
  const [pastas, setPastas] = useState<Pasta[]>(pastasIniciais);
  const [carregado, setCarregado] = useState(false);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);

  useEffect(() => {
    const salvas = localStorage.getItem(CHAVE_STORAGE);
    if (salvas) {
      try {
        setPastas(JSON.parse(salvas));
      } catch {
        // se o dado salvo estiver corrompido, ignora e mantém as iniciais
      }
    }
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (carregado) {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(pastas));
    }
  }, [pastas, carregado]);

  const pastaSelecionada = pastas.find((p) => p.id === selecionadaId) ?? null;

  const selecionarPasta = useCallback((id: string) => {
    setSelecionadaId(id);
  }, []);

  const fecharPasta = useCallback(() => {
    setSelecionadaId(null);
  }, []);

  const criarPasta = useCallback((nome: string, cor?: string) => {
    setPastas((atual) => [
      ...atual,
      { id: `${Date.now()}`, nome, cor: cor ?? paletaCores[atual.length % paletaCores.length] },
    ]);
  }, []);

  const renomearPasta = useCallback((id: string, novoNome: string) => {
    setPastas((atual) => atual.map((p) => (p.id === id ? { ...p, nome: novoNome } : p)));
  }, []);

  const mudarCorPasta = useCallback((id: string, novaCor: string) => {
    setPastas((atual) => atual.map((p) => (p.id === id ? { ...p, cor: novaCor } : p)));
  }, []);

  const excluirPasta = useCallback((id: string) => {
    setPastas((atual) => atual.filter((p) => p.id !== id));
    setSelecionadaId((atualId) => (atualId === id ? null : atualId));
  }, []);

  const reordenarPastas = useCallback((novaOrdem: Pasta[]) => {
    setPastas(novaOrdem);
  }, []);

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