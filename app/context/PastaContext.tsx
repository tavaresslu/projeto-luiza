"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { paletaCores } from "../components/SeletorCor";
import { DataItem } from "../utils";

// dia, mes e ano são opcionais: itens antigos (sem data) continuam funcionando normalmente.
// etapas e etapasFeitas também: sem etapas, a tarefa é simples (feita ou não feita).
type ItemChecklist = {
  id: string;
  texto: string;
  concluido: boolean;
  dia?: number;
  mes?: number;
  ano?: number;
  etapas?: number;
  etapasFeitas?: number;
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
  mudarEtapaItem: (pastaId: string, itemId: string, delta: 1 | -1) => void;
  definirEtapasItem: (pastaId: string, itemId: string, etapas: number | null) => void;
  removerItemChecklist: (pastaId: string, itemId: string) => void;
  definirDataItem: (pastaId: string, itemId: string, data: DataItem | null) => void;
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

  // Marca/desmarca a tarefa inteira (usado pelo calendário e pela tela inicial).
  // Se a tarefa tem etapas, marcar completa todas e desmarcar zera.
  const alternarItemChecklist = useCallback((pastaId: string, itemId: string) => {
    setPastas((atual) =>
      atual.map((p) =>
        p.id === pastaId
          ? {
              ...p,
              itensChecklist: p.itensChecklist.map((item) => {
                if (item.id !== itemId) return item;
                if (item.etapas) {
                  return {
                    ...item,
                    concluido: !item.concluido,
                    etapasFeitas: item.concluido ? 0 : item.etapas,
                  };
                }
                return { ...item, concluido: !item.concluido };
              }),
            }
          : p
      )
    );
  }, []);

  // Avança (delta = 1) ou volta (delta = -1) uma etapa da tarefa.
  // Tarefa sem etapas: o clique só marca/desmarca. Depois da última etapa, volta pra zero.
  const mudarEtapaItem = useCallback((pastaId: string, itemId: string, delta: 1 | -1) => {
    setPastas((atual) =>
      atual.map((p) =>
        p.id === pastaId
          ? {
              ...p,
              itensChecklist: p.itensChecklist.map((item) => {
                if (item.id !== itemId) return item;

                if (!item.etapas) {
                  return delta === 1 ? { ...item, concluido: !item.concluido } : item;
                }

                const feitas = item.etapasFeitas ?? 0;
                let proxima = feitas + delta;
                if (proxima > item.etapas) proxima = 0;
                if (proxima < 0) proxima = 0;

                return { ...item, etapasFeitas: proxima, concluido: proxima >= item.etapas };
              }),
            }
          : p
      )
    );
  }, []);

  // Define em quantas etapas a tarefa é dividida (2 a 20). Com null ou menos de 2, volta a ser tarefa simples.
  const definirEtapasItem = useCallback((pastaId: string, itemId: string, etapas: number | null) => {
    setPastas((atual) =>
      atual.map((p) =>
        p.id === pastaId
          ? {
              ...p,
              itensChecklist: p.itensChecklist.map((item) => {
                if (item.id !== itemId) return item;

                if (etapas === null || etapas < 2) {
                  return { ...item, etapas: undefined, etapasFeitas: undefined };
                }

                const total = Math.min(Math.floor(etapas), 20);
                const feitasAntes = item.etapasFeitas ?? (item.concluido ? total : 0);
                const feitas = Math.min(feitasAntes, total);

                return { ...item, etapas: total, etapasFeitas: feitas, concluido: feitas >= total };
              }),
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

  // Define (ou remove, se data for null) a data de um item do checklist
  const definirDataItem = useCallback((pastaId: string, itemId: string, data: DataItem | null) => {
    setPastas((atual) =>
      atual.map((p) =>
        p.id === pastaId
          ? {
              ...p,
              itensChecklist: p.itensChecklist.map((item) =>
                item.id === itemId
                  ? { ...item, dia: data?.dia, mes: data?.mes, ano: data?.ano }
                  : item
              ),
            }
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
        mudarEtapaItem,
        definirEtapasItem,
        removerItemChecklist,
        definirDataItem,
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