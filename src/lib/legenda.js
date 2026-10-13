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
