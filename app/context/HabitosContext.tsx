"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { paletaCores } from "../components/SeletorCor";

// diasFeitos guarda as datas em que o hábito foi cumprido, no formato "2026-10-05"
export type Habito = {
  id: string;
  nome: string;
  cor: string;
  diasFeitos: string[];
};

// Transforma uma data do JS no texto "2026-10-05" (usado pra guardar os dias feitos)
export function dataParaChave(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Conta quantos dias seguidos o hábito foi cumprido (a "sequência" ou "streak").
// Se hoje ainda não foi marcado, a sequência não zera: ela conta a partir de ontem.
export function calcularSequencia(diasFeitos: string[], hoje: Date = new Date()): number {
  const feitos = new Set(diasFeitos);
  const cursor = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  if (!feitos.has(dataParaChave(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let total = 0;
  while (feitos.has(dataParaChave(cursor))) {
    total++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return total;
}

const habitosIniciais: Habito[] = ["Treino", "Estudo", "Água"].map((nome, i) => ({
  id: nome.toLowerCase(),
  nome,
  cor: paletaCores[(i + 3) % paletaCores.length],
  diasFeitos: [],
}));

const CHAVE_STORAGE = "projeto-luiza:habitos";

type HabitosContextType = {
  habitos: Habito[];
  criarHabito: (nome: string) => void;
  removerHabito: (id: string) => void;
  alternarDiaHabito: (id: string, chaveDia: string) => void;
};

const HabitosContext = createContext<HabitosContextType | undefined>(undefined);

export function HabitosProvider({ children }: { children: ReactNode }) {
  const [habitos, setHabitos] = useState<Habito[]>(habitosIniciais);
  const [carregado, setCarregado] = useState(false);

  // Carrega os hábitos salvos no navegador
  useEffect(() => {
    const salvos = localStorage.getItem(CHAVE_STORAGE);
    if (salvos) {
      try {
        const dados = JSON.parse(salvos);
        setHabitos(
          dados.map((h: Habito) => ({
            ...h,
            diasFeitos: h.diasFeitos ?? [],
          }))
        );
      } catch {
        // se o dado salvo estiver corrompido, ignora e mantém os iniciais
      }
    }
    setCarregado(true);
  }, []);

  // Salva sempre que algo mudar
  useEffect(() => {
    if (carregado) {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(habitos));
    }
  }, [habitos, carregado]);

  const criarHabito = useCallback((nome: string) => {
    setHabitos((atual) => [
      ...atual,
      {
        id: `${Date.now()}`,
        nome,
        cor: paletaCores[atual.length % paletaCores.length],
        diasFeitos: [],
      },
    ]);
  }, []);

  const removerHabito = useCallback((id: string) => {
    setHabitos((atual) => atual.filter((h) => h.id !== id));
  }, []);

  // Marca o dia como feito; se já estava marcado, desmarca
  const alternarDiaHabito = useCallback((id: string, chaveDia: string) => {
    setHabitos((atual) =>
      atual.map((h) =>
        h.id === id
          ? {
              ...h,
              diasFeitos: h.diasFeitos.includes(chaveDia)
                ? h.diasFeitos.filter((d) => d !== chaveDia)
                : [...h.diasFeitos, chaveDia],
            }
          : h
      )
    );
  }, []);

  return (
    <HabitosContext.Provider value={{ habitos, criarHabito, removerHabito, alternarDiaHabito }}>
      {children}
    </HabitosContext.Provider>
  );
}

export function useHabitos() {
  const context = useContext(HabitosContext);
  if (!context) {
    throw new Error("useHabitos precisa ser usado dentro de um HabitosProvider");
  }
  return context;
}