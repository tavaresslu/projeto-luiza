export const cores = {
  fundo: "#f8f7f5",        // fundo geral, off-white suave
  fundoCard: "#FFFFFF",    // fundo de cards/calendário
  borda: "#EAEAE6",        // bordas discretas
  textoPrincipal: "#3F3F3C",
  textoSecundario: "#8A8A85",

  categoriaAzul: "#7DB8D9",
  categoriaRosa: "#E3A8B8",
  categoriaVerde: "#8FBFA0",
  categoriaAmarelo: "#E3C878",

  fundoFimDeSemana: "rgba(63, 63, 60, 0.05)", // leve escurecido pra destacar sáb/dom
};

// Transforma uma cor viva (#RRGGBB) na mesma cor clareada e semitransparente,
// pro efeito "bolinha forte, área pintada suave" do calendário
export function hexParaRgba(hex: string, alpha: number): string {
  const limpo = hex.replace("#", "");
  const r = parseInt(limpo.substring(0, 2), 16);
  const g = parseInt(limpo.substring(2, 4), 16);
  const b = parseInt(limpo.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Escurece uma cor viva mantendo o matiz — pra texto legível em cima de um
// fundo clareado da mesma cor (em vez de usar a cor pura, que tem pouco contraste)
export function hexEscurecer(hex: string, quantidade: number): string {
  const limpo = hex.replace("#", "");
  const r = parseInt(limpo.substring(0, 2), 16);
  const g = parseInt(limpo.substring(2, 4), 16);
  const b = parseInt(limpo.substring(4, 6), 16);
  const escurecer = (canal: number) => Math.round(canal * (1 - quantidade));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(escurecer(r))}${toHex(escurecer(g))}${toHex(escurecer(b))}`;
}