"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { paletaCores } from "../components/SeletorCor";

type ItemChecklist = {
  id: string;
  texto: string;
  concluido: boolean;
};

type Subpasta = {
  id: string;
  nome: string;
};

type Pasta = {
  id: string;
  nome: string;
  cor: string;
  tituloChecklist: string;
  itensChecklist: ItemChecklist[];
  subpastas: Subpasta[];
};

const pastasIniciais: Pasta[] = [
  { id: "materias", nome: "Matérias da faculdade", cor: paletaCores[0], tituloChecklist: "Checklist", itensChecklist: [], subpastas: [] },
  { id: "empresa-junior", nome: "Empresa júnior", cor: paletaCores[1], tituloChecklist: "Checklist", itensChecklist: [], subpastas: [] },
  { id: "projetos", nome: "Projetos", cor: paletaCores[2], tituloChecklist: "Checklist", itensChecklist: [], subpastas: [] },
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
  adicionarItemChecklist: (pastaId: string, texto: string) => void;
  alternarItemChecklist: (pastaId: string, itemId: string) => void;
  removerItemChecklist: (pastaId: string, itemId: string) => void;
  renomearTituloChecklist: (pastaId: string, novoTitulo: string) => void;
  criarSubpasta: (pastaId: string, nome: string) => void;
  renomearSubpasta: (pastaId: string, subpastaId: string, novoNome: string) => void;
  excluirSubpasta: (pastaId: string, subpastaId: string) => void;
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
        const dados = JSON.parse(salvas);
        // Garante que pastas salvas antes desses campos existirem ganhem os valores padrão
        setPastas(
          dados.map((p: Pasta) => ({
            ...p,
            itensChecklist: p.itensChecklist ?? [],
            tituloChecklist: p.tituloChecklist ?? "Checklist",
            subpastas: p.subpastas ?? [],
          }))
        );
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
      {
        id: `${Date.now()}`,
        nome,
        cor: cor ?? paletaCores[atual.length % paletaCores.length],
        tituloChecklist: "Checklist",
        itensChecklist: [],
        subpastas: [],
      },
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

  const adicionarItemChecklist = useCallback((pastaId: string, texto: string) => {
    setPastas((atual) =>
      atual.map((p) =>
        p.id === pastaId
          ? { ...p, itensChecklist: [...p.itensChecklist, { id: `${Date.now()}`, texto, concluido: false }] }
          : p
      )
    );
  }, []);

  const alternarItemChecklist = useCallback((pastaId: string, itemId: string) => {
    setPastas((atual) =>
      atual.map((p) =>
        p.id === pastaId
          ? {
              ...p,
              itensChecklist: p.itensChecklist.map((item) =>
                item.id === itemId ? { ...item, concluido: !item.concluido } : item
              ),
            }
          : p
      )
    );
  }, []);

  const removerItemChecklist = useCallback((pastaId: string, itemId: string) => {
    setPastas((atual) =>
      atual.map((p) =>
        p.id === pastaId
          ? { ...p, itensChecklist: p.itensChecklist.filter((item) => item.id !== itemId) }
          : p
      )
    );
  }, []);

  const renomearTituloChecklist = useCallback((pastaId: string, novoTitulo: string) => {
    setPastas((atual) => atual.map((p) => (p.id === pastaId ? { ...p, tituloChecklist: novoTitulo } : p)));
  }, []);

  const criarSubpasta = useCallback((pastaId: string, nome: string) => {
    setPastas((atual) =>
      atual.map((p) =>
        p.id === pastaId
          ? { ...p, subpastas: [...p.subpastas, { id: `${Date.now()}`, nome }] }
          : p
      )
    );
  }, []);

  const renomearSubpasta = useCallback((pastaId: string, subpastaId: string, novoNome: string) => {
    setPastas((atual) =>
      atual.map((p) =>
        p.id === pastaId
          ? { ...p, subpastas: p.subpastas.map((s) => (s.id === subpastaId ? { ...s, nome: novoNome } : s)) }
          : p
      )
    );
  }, []);

  const excluirSubpasta = useCallback((pastaId: string, subpastaId: string) => {
    setPastas((atual) =>
      atual.map((p) =>
        p.id === pastaId ? { ...p, subpastas: p.subpastas.filter((s) => s.id !== subpastaId) } : p
      )
    );
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
        adicionarItemChecklist,
        alternarItemChecklist,
        removerItemChecklist,
        renomearTituloChecklist,
        criarSubpasta,
        renomearSubpasta,
        excluirSubpasta,
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