// Legenda padrão das publicações em redes sociais. Usada na Home (quando o
// colaborador publica no story ao criar o tik) e na tela Publicação nas Redes
// (onde o admin ainda pode editar antes de publicar).
//
// Formato:
//
//   <descrição do tik>
//
//   Enviado por <nome>
//   Área: <secretaria do perfil>
//   Prefeitura de <município>, <UF>
//
// O nome da conta não entra no texto: Instagram e Facebook já o mostram antes
// da legenda, e escrevê-lo aqui sairia duplicado na publicação.
//
// Cada linha do rodapé só aparece se o dado existir — perfil incompleto gera
// uma legenda menor, nunca uma linha com "undefined".
export function montarLegenda(tik) {
  if (!tik) return ''
  const perfil = tik.profiles || {}

  const rodape = []
  if (perfil.name) rodape.push(`Enviado por ${perfil.name}`)
  if (perfil.secretaria) rodape.push(`Área: ${perfil.secretaria}`)
  if (perfil.municipality) {
    rodape.push(`Prefeitura de ${perfil.municipality}${perfil.state ? `, ${perfil.state}` : ''}`)
  }

  const descricao = (tik.description || '').trim()
  return [descricao, rodape.join('\n')].filter(Boolean).join('\n\n')
}

// --- Legenda do story -------------------------------------------------------

// O texto do story é desenhado dentro da imagem, então o espaço é o da tela do
// celular, não o de uma legenda. Acima disso a fonte encolhe e passa a caber
// menos gente lendo de longe — ver HEADLINE_MAX em lib/storyImage.js.
const STORY_LIMITE = 180

// Sugestão de legenda do story a partir do que já existe no tik: usa a legenda
// de redes (se o admin editou) ou a descrição, joga fora o rodapé — que o
// story já desenha sozinho — e corta no fim da última frase que couber.
export function sugerirLegendaStory(tik) {
  if (!tik) return ''

  const base = (tik.legenda_redes || montarLegenda(tik))
    .split('\n\n')[0]
    .replace(/\s+/g, ' ')
    .trim()
  if (base.length <= STORY_LIMITE) return base

  const frases = base.match(/[^.!?]+[.!?]*/g) || [base]
  const escolhidas = []
  for (const frase of frases) {
    const tentativa = [...escolhidas, frase].join('').trim()
    if (escolhidas.length && tentativa.length > STORY_LIMITE) break
    escolhidas.push(frase)
    if (tentativa.length >= STORY_LIMITE) break
  }

  const texto = escolhidas.join('').trim()
  if (texto && texto.length <= STORY_LIMITE) return texto

  // A primeira frase sozinha já estoura: corta na última palavra inteira.
  return `${base.slice(0, STORY_LIMITE).replace(/\s+\S*$/, '').trim()}…`
}

// O texto que vai no story: o que o admin escreveu ou, enquanto ele não
// escreveu nada, a sugestão. É a mesma função usada pela prévia e pela
// publicação, pra prévia nunca mostrar uma coisa e publicar outra.
export function legendaStoryDe(tik) {
  return (tik?.legenda_story || '').trim() || sugerirLegendaStory(tik)
}
