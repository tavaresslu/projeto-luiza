"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cores } from "../theme";

export const paletaCores = [
  "#F4A261",
  "#2A9D8F",
  "#E76F51",
  "#8D99AE",
  "#9C89B8",
  "#8FBFA0",
  "#E9C46A",
  "#6B9AC4",
];

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
  // hue/saturation/brightness só existem pra desenhar o quadradão de cor customizada
  const [hue, setHue] = useState(140);
  const [saturation, setSaturation] = useState(25);
  const [brightness, setBrightness] = useState(75);
  const [mostrarCustom, setMostrarCustom] = useState(false);

  const squareRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const draggingSquare = useRef(false);
  const draggingHue = useRef(false);

  // toda vez que hue/saturation/brightness mudam, calcula o hex e avisa o formulário
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
  }, [updateFromSquare, updateFromHue]);

  const pureHueHex = hsvToHex(hue, 100, 100);

  return (
    <div>
      {/* Paleta de cores prontas — igual já era */}
      <div className="flex flex-wrap gap-1 items-center">
        {paletaCores.map((cor) => (
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

        {/* Botão extra: abre o seletor de cor customizada */}
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

      {/* Quadradão só aparece quando clica no "+" */}
      {mostrarCustom && (
        <div style={{ width: 220, marginTop: 10 }}>
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