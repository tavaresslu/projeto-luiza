"use client";

import { cores, hexParaRgba } from "../theme";

type Props = {
  total: number;
  concluidos: number;
  cor: string;
  tamanho?: number;
};

// O anel é desenhado num quadrado imaginário de 140 x 140 e depois ajustado ao tamanho pedido
const VISAO = 140;
const ESPESSURA = 12;
const RAIO = (VISAO - ESPESSURA) / 2 - 2;
const CENTRO = VISAO / 2;
// Acima disso, os pedaços ficariam pequenos demais, então vira um anel contínuo
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

export default function ProgressoCircular({ total, concluidos, cor, tamanho = 150 }: Props) {
  const porcentagem = total === 0 ? 0 : Math.round((concluidos / total) * 100);
  const corVazia = hexParaRgba(cor, 0.2);
  const segmentado = total >= 2 && total <= MAX_SEGMENTOS;

  // As pontas arredondadas "sobram" um pouquinho pra fora do arco, então
  // calculo essa sobra em graus pra manter um espaço bonito entre os pedaços
  const sobraDaPonta = (ESPESSURA / 2 / RAIO) * (180 / Math.PI);
  const folga = sobraDaPonta * 2 + 8;
  const passo = total > 0 ? 360 / total : 360;

  const textoCentro =
    total === 0 ? "sem itens" : porcentagem === 100 ? "tudo feito 🎉" : "concluído";

  return (
    <div
      className="relative mx-auto"
      style={{ width: tamanho, height: tamanho }}
      role="img"
      aria-label={`${porcentagem}% concluído`}
    >
      <svg viewBox={`0 0 ${VISAO} ${VISAO}`} width={tamanho} height={tamanho}>
        {segmentado ? (
          // Um pedaço por item
          Array.from({ length: total }, (_, i) => (
            <path
              key={i}
              d={descreverArco(i * passo + folga / 2, (i + 1) * passo - folga / 2)}
              fill="none"
              stroke={i < concluidos ? cor : corVazia}
              strokeWidth={ESPESSURA}
              strokeLinecap="round"
              style={{ transition: "stroke 0.3s" }}
            />
          ))
        ) : (
          <>
            {/* Anel de fundo */}
            <circle
              cx={CENTRO}
              cy={CENTRO}
              r={RAIO}
              fill="none"
              stroke={corVazia}
              strokeWidth={ESPESSURA}
            />
            {/* Parte preenchida */}
            {total > 0 && concluidos > 0 && concluidos >= total && (
              <circle
                cx={CENTRO}
                cy={CENTRO}
                r={RAIO}
                fill="none"
                stroke={cor}
                strokeWidth={ESPESSURA}
              />
            )}
            {total > 0 && concluidos > 0 && concluidos < total && (
              <path
                d={descreverArco(0, (concluidos / total) * 360)}
                fill="none"
                stroke={cor}
                strokeWidth={ESPESSURA}
                strokeLinecap="round"
                style={{ transition: "stroke 0.3s" }}
              />
            )}
          </>
        )}
      </svg>

      {/* Número no centro */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-medium leading-none" style={{ color: cores.textoPrincipal }}>
          {total === 0 ? "–" : `${porcentagem}%`}
        </span>
        <span className="mt-1 text-[11px]" style={{ color: cores.textoSecundario }}>
          {textoCentro}
        </span>
      </div>
    </div>
  );
}