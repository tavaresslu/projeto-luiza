"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { paletaCores } from "../components/SeletorCor";

// pastaIds guarda os ids das pastas cujas tarefas contam para o progresso da meta
export type Meta = {
  id: string;
  nome: string;
  cor: string;
  pastaIds: string[];
};

const CHAVE_STORAGE = "projeto-luiza:metas";

type MetasContextType = {
  metas: Meta[];
  criarMeta: (nome: string) => void;
  removerMeta: (id: string) => void;
  alternarPastaDaMeta: (metaId: string, pastaId: string) => void;
};

const MetasContext = createContext<MetasContextType | undefined>(undefined);

export function MetasProvider({ children }: { children: ReactNode }) {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [carregado, setCarregado] = useState(false);

  // Carrega as metas salvas no navegador
  useEffect(() => {
    const salvas = localStorage.getItem(CHAVE_STORAGE);
    if (salvas) {
      try {
        const dados = JSON.parse(salvas);
        setMetas(
          dados.map((m: Meta) => ({
            ...m,
            pastaIds: m.pastaIds ?? [],
          }))
        );
      } catch {
        // se o dado salvo estiver corrompido, ignora e começa vazio
      }
    }
    setCarregado(true);
  }, []);

  // Salva sempre que algo mudar
  useEffect(() => {
    if (carregado) {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(metas));
    }
  }, [metas, carregado]);

  const criarMeta = useCallback((nome: string) => {
    setMetas((atual) => [
      ...atual,
      {
        id: `${Date.now()}`,
        nome,
        cor: paletaCores[atual.length % paletaCores.length],
        pastaIds: [],
      },
    ]);
  }, []);

  const removerMeta = useCallback((id: string) => {
    setMetas((atual) => atual.filter((m) => m.id !== id));
  }, []);

  // Liga a pasta à meta; se já estava ligada, desliga
  const alternarPastaDaMeta = useCallback((metaId: string, pastaId: string) => {
    setMetas((atual) =>
      atual.map((m) =>
        m.id === metaId
          ? {
              ...m,
              pastaIds: m.pastaIds.includes(pastaId)
                ? m.pastaIds.filter((id) => id !== pastaId)
                : [...m.pastaIds, pastaId],
            }
          : m
      )
    );
  }, []);

  return (
    <MetasContext.Provider value={{ metas, criarMeta, removerMeta, alternarPastaDaMeta }}>
      {children}
    </MetasContext.Provider>
  );
}

export function useMetas() {
  const context = useContext(MetasContext);
  if (!context) {
    throw new Error("useMetas precisa ser usado dentro de um MetasProvider");
  }
  return context;
}