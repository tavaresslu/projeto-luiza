"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cores } from "../theme";

// Cores fixas que sempre aparecem disponíveis (tiradas do Apple Calendar)
const CORES_FIXAS = [
  "#F1F5F0",
  "#FFCC68",
  "#80D2F9",
  "#FB74B9",
  "#D578F6",
  "#FD8206",
  "#90E696",
  "#F62B2D",
];

// Mantido pra compatibilidade com quem importa "paletaCores" (ex: Sidebar.tsx, PastaContext.tsx)
export const paletaCores = CORES_FIXAS;

const CHAVE_LOCALSTORAGE = "cores-customizadas-usuario";

// --- Funções de armazenamento isoladas aqui ---
// Quando migrar pra API/banco no futuro, só precisa trocar o conteúdo
// dessas funções (o resto do componente não muda nada).
function buscarCoresCustomizadas(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const salvo = window.localStorage.getItem(CHAVE_LOCALSTORAGE);
    return salvo ? JSON.parse(salvo) : [];
  } catch {
    return [];
  }
}

function salvarCoresCustomizadas(cores: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAVE_LOCALSTORAGE, JSON.stringify(cores));
  } catch {
    // se der erro (ex: localStorage cheio/bloqueado), só ignora
  }
}
// --- Fim das funções de armazenamento ---

type Props = {
  corSelecionada: string;
  onSelecionar: (cor: string) => void;
};

// Converte matiz/saturação/brilho (HSV) pra hex, formato que o resto do app usa
function hsvToHex(h: number, s: number, v: number): string {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function SeletorCor({ corSelecionada, onSelecionar }: Props) {
  const [hue, setHue] = useState(140);
  const [saturation, setSaturation] = useState(25);
  const [brightness, setBrightness] = useState(75);
  const [mostrarCustom, setMostrarCustom] = useState(false);
  const [coresCustomizadas, setCoresCustomizadas] = useState<string[]>([]);

  // Carrega as cores customizadas salvas assim que o componente monta
  useEffect(() => {
    setCoresCustomizadas(buscarCoresCustomizadas());
  }, []);

  const squareRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const draggingSquare = useRef(false);
  const draggingHue = useRef(false);

  useEffect(() => {
    if (mostrarCustom) {
      onSelecionar(hsvToHex(hue, saturation, brightness));
    }
  }, [hue, saturation, brightness]);

  const updateFromSquare = useCallback((clientX: number, clientY: number) => {
    const rect = squareRef.current!.getBoundingClientRect();
    let x = (clientX - rect.left) / rect.width;
    let y = (clientY - rect.top) / rect.height;
    x = Math.min(1, Math.max(0, x));
    y = Math.min(1, Math.max(0, y));
    setSaturation(x * 100);
    setBrightness(100 - y * 100);
  }, []);

  const updateFromHue = useCallback((clientX: number) => {
    const rect = hueRef.current!.getBoundingClientRect();
    let x = (clientX - rect.left) / rect.width;
    x = Math.min(1, Math.max(0, x));
    setHue(x * 360);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      if (draggingSquare.current) updateFromSquare(x, y);
      if (draggingHue.current) updateFromHue(x);
    };
    const onUp = () => {
      // Ao soltar o arraste dentro do seletor customizado, salva a cor
      // escolhida na lista de cores customizadas do usuário (se ainda não existir)
      if (draggingSquare.current || draggingHue.current) {
        const corFinal = hsvToHex(hue, saturation, brightness);
        adicionarCorCustomizada(corFinal);
      }
      draggingSquare.current = false;
      draggingHue.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [updateFromSquare, updateFromHue, hue, saturation, brightness]);

  function adicionarCorCustomizada(cor: string) {
    setCoresCustomizadas((atual) => {
      if (atual.includes(cor) || CORES_FIXAS.includes(cor)) return atual;
      const nova = [...atual, cor];
      salvarCoresCustomizadas(nova);
      return nova;
    });
  }

  function removerCorCustomizada(cor: string) {
    setCoresCustomizadas((atual) => {
      const nova = atual.filter((c) => c !== cor);
      salvarCoresCustomizadas(nova);
      return nova;
    });
    // se a cor removida era a que estava selecionada, volta pra primeira cor fixa
    if (corSelecionada === cor) {
      onSelecionar(CORES_FIXAS[0]);
    }
  }

  const pureHueHex = hsvToHex(hue, 100, 100);

  return (
    <div style={{ width: "100%" }}>
      <div className="flex flex-wrap gap-2 items-center">
        {/* Cores criadas pelo usuário — com "x" pra excluir ao passar o mouse */}
        {coresCustomizadas.map((cor) => (
          <div key={cor} className="group relative h-5 w-5">
            <button
              type="button"
              onClick={() => {
                setMostrarCustom(false);
                onSelecionar(cor);
              }}
              className="h-5 w-5 rounded-full"
              style={{
                backgroundColor: cor,
                outline:
                  !mostrarCustom && cor === corSelecionada
                    ? `2px solid ${cores.textoPrincipal}`
                    : "none",
                outlineOffset: "2px",
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removerCorCustomizada(cor);
              }}
              title="Excluir cor"
              className="absolute -right-1 -top-1 hidden h-3 w-3 items-center justify-center rounded-full text-[8px] leading-none text-white group-hover:flex"
              style={{ backgroundColor: "#C97B7B" }}
            >
              ×
            </button>
          </div>
        ))}

        {/* Cores fixas do Apple Calendar — sempre disponíveis, sem opção de excluir */}
        {CORES_FIXAS.map((cor) => (
          <button
            key={cor}
            type="button"
            onClick={() => {
              setMostrarCustom(false);
              onSelecionar(cor);
            }}
            className="h-5 w-5 rounded-full"
            style={{
              backgroundColor: cor,
              outline:
                !mostrarCustom && cor === corSelecionada
                  ? `2px solid ${cores.textoPrincipal}`
                  : "none",
              outlineOffset: "2px",
            }}
          />
        ))}

        <button
          type="button"
          onClick={() => setMostrarCustom((v) => !v)}
          className="h-5 w-5 rounded-full flex items-center justify-center text-xs"
          style={{
            border: `1px dashed ${cores.textoPrincipal}`,
            outline: mostrarCustom ? `2px solid ${cores.textoPrincipal}` : "none",
            outlineOffset: "2px",
          }}
          title="Escolher outra cor"
        >
          +
        </button>
      </div>

      {/* Quadradão ocupa 100% da largura do espaço disponível */}
      {mostrarCustom && (
        <div style={{ width: "100%", maxWidth: 220, marginTop: 10 }}>
          <div
            ref={squareRef}
            onMouseDown={(e) => {
              draggingSquare.current = true;
              updateFromSquare(e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              draggingSquare.current = true;
              updateFromSquare(e.touches[0].clientX, e.touches[0].clientY);
            }}
            style={{
              position: "relative",
              width: "100%",
              height: 150,
              borderRadius: 8,
              cursor: "crosshair",
              touchAction: "none",
              backgroundColor: pureHueHex,
              backgroundImage: `linear-gradient(to top, #000, rgba(0,0,0,0)),
                                 linear-gradient(to right, #fff, rgba(255,255,255,0))`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: `${saturation}%`,
                top: `${100 - brightness}%`,
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2px solid #fff",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.4)",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />
          </div>

          <div
            ref={hueRef}
            onMouseDown={(e) => {
              draggingHue.current = true;
              updateFromHue(e.clientX);
            }}
            onTouchStart={(e) => {
              draggingHue.current = true;
              updateFromHue(e.touches[0].clientX);
            }}
            style={{
              position: "relative",
              width: "100%",
              height: 12,
              borderRadius: 6,
              cursor: "pointer",
              touchAction: "none",
              marginTop: 8,
              background:
                "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: `${(hue / 360) * 100}%`,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#fff",
                border: "2px solid #fff",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.4)",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}