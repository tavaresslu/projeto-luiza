"use client";

import { cores, hexParaRgba } from "../theme";

type Props = {
  etapas?: number;
  etapasFeitas?: number;
  concluido: boolean;
  cor: string;
  onAvancar: () => void;
  onVoltar: () => void;
  tamanho?: number;
};

// O anel é desenhado num quadrado imaginário de 40 x 40 e depois ajustado ao tamanho pedido
const VISAO = 40;
const ESPESSURA = 5;
const RAIO = (VISAO - ESPESSURA) / 2 - 1;
const CENTRO = VISAO / 2;
// Acima disso os pedaços ficariam pequenos demais, então vira um anel contínuo
const MAX_SEGMENTOS = 8;

// Dado um ângulo (0° = topo, andando no sentido horário), devolve o ponto no círculo
function pontoNoCirculo(angulo: number) {
  const rad = ((angulo - 90) * Math.PI) / 180;
  return { x: CENTRO + RAIO * Math.cos(rad), y: CENTRO + RAIO * Math.sin(rad) };
}

// Desenha um arco (pedaço de círculo) entre dois ângulos
function descreverArco(inicio: number, fim: number) {
  const a = pontoNoCirculo(inicio);
  const b = pontoNoCirculo(fim);
  const arcoGrande = fim - inicio > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${RAIO} ${RAIO} 0 ${arcoGrande} 1 ${b.x} ${b.y}`;
}

export default function AnelTarefa({
  etapas,
  etapasFeitas,
  concluido,
  cor,
  onAvancar,
  onVoltar,
  tamanho = 34,
}: Props) {
  const corVazia = hexParaRgba(cor, 0.22);
  const temEtapas = !!etapas && etapas >= 2;
  const total = temEtapas ? etapas! : 1;
  const feitas = temEtapas ? Math.min(etapasFeitas ?? 0, total) : concluido ? 1 : 0;
  const segmentado = temEtapas && total <= MAX_SEGMENTOS;

  // As pontas arredondadas "sobram" um pouquinho pra fora do arco, então
  // calculo essa sobra em graus pra manter um espaço bonito entre os pedaços
  const sobraDaPonta = (ESPESSURA / 2 / RAIO) * (180 / Math.PI);
  const folga = sobraDaPonta * 2 + 10;
  const passo = 360 / total;

  const titulo = temEtapas
    ? `${feitas} de ${total} etapas. Clique para avançar, botão direito para voltar`
    : concluido
    ? "Concluída. Clique para desmarcar"
    : "Clique para concluir";

  return (
    <button
      type="button"
      onClick={onAvancar}
      onContextMenu={(e) => {
        e.preventDefault();
        onVoltar();
      }}
      className="relative shrink-0 transition-transform hover:scale-105"
      style={{ width: tamanho, height: tamanho }}
      title={titulo}
      aria-label={titulo}
    >
      <svg viewBox={`0 0 ${VISAO} ${VISAO}`} width={tamanho} height={tamanho}>
        {segmentado ? (
          // Um pedaço por etapa
          Array.from({ length: total }, (_, i) => (
            <path
              key={i}
              d={descreverArco(i * passo + folga / 2, (i + 1) * passo - folga / 2)}
              fill="none"
              stroke={i < feitas ? cor : corVazia}
              strokeWidth={ESPESSURA}
              strokeLinecap="round"
              style={{ transition: "stroke 0.3s" }}
            />
          ))
        ) : (
          <>
            {/* Anel de fundo */}
            <circle cx={CENTRO} cy={CENTRO} r={RAIO} fill="none" stroke={corVazia} strokeWidth={ESPESSURA} />
            {/* Parte preenchida */}
            {feitas >= total && (
              <circle cx={CENTRO} cy={CENTRO} r={RAIO} fill="none" stroke={cor} strokeWidth={ESPESSURA} />
            )}
            {feitas > 0 && feitas < total && (
              <path
                d={descreverArco(0, (feitas / total) * 360)}
                fill="none"
                stroke={cor}
                strokeWidth={ESPESSURA}
                strokeLinecap="round"
              />
            )}
          </>
        )}
      </svg>

      {/* Meio do anel: ✓ quando concluída, ou o contador "2/4" */}
      <span className="absolute inset-0 flex items-center justify-center">
        {concluido ? (
          <svg width="12" height="10" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke={cores.textoPrincipal} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : temEtapas ? (
          <span className="text-[8px] font-medium leading-none" style={{ color: cores.textoSecundario }}>
            {feitas}/{total}
          </span>
        ) : null}
      </span>
    </button>
  );
}