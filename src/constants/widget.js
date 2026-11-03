// Configuração do widget incorporável de "últimos tiks" (página /widget).
// A mesma lista de parâmetros é lida pelo widget e montada pela tela
// /incorporar-site, e também é o que o /embed.js repassa via data-attributes.

export const WIDGET_LAYOUTS = [
  { id: 'grade', label: 'Grade', description: 'Fotos em mosaico, ideal para a página inicial.' },
  { id: 'carrossel', label: 'Carrossel', description: 'Um tik por vez em destaque, troca sozinho.' },
  { id: 'lista', label: 'Lista', description: 'Linhas compactas com foto, área e local.' },
  { id: 'mural', label: 'Mural', description: 'Cartões estilo feed, com descrição completa.' },
  { id: 'faixa', label: 'Faixa', description: 'Tira horizontal rolável, boa para rodapés.' },
]

export const WIDGET_DEFAULTS = {
  layout: 'grade',
  limit: 6,
  area: '',
  theme: 'claro',
  color: 'E07B22',
  header: true,
}

export const WIDGET_LIMIT_MAX = 30

const HEX = /^[0-9a-fA-F]{6}$/

function clampLimit(n) {
  const v = parseInt(n, 10)
  if (Number.isNaN(v)) return WIDGET_DEFAULTS.limit
  return Math.min(Math.max(v, 1), WIDGET_LIMIT_MAX)
}

// URLSearchParams -> config normalizada (valores inválidos caem no padrão).
export function parseWidgetParams(params) {
  const layout = params.get('layout')
  const color = (params.get('cor') || '').replace('#', '')
  return {
    municipality: params.get('municipio') || '',
    state: (params.get('uf') || '').toUpperCase(),
    layout: WIDGET_LAYOUTS.some((l) => l.id === layout) ? layout : WIDGET_DEFAULTS.layout,
    limit: clampLimit(params.get('limite') ?? WIDGET_DEFAULTS.limit),
    area: params.get('area') || '',
    theme: params.get('tema') === 'escuro' ? 'escuro' : 'claro',
    color: HEX.test(color) ? color : WIDGET_DEFAULTS.color,
    header: params.get('titulo') !== '0',
    widgetId: params.get('wid') || '',
  }
}

// Config -> pares chave/valor usados tanto na URL do iframe quanto nos
// data-attributes do snippet de script.
export function widgetParamEntries(config) {
  const entries = [
    ['municipio', config.municipality],
    ['uf', config.state],
    ['layout', config.layout],
    ['limite', String(config.limit)],
  ]
  if (config.area) entries.push(['area', config.area])
  if (config.theme !== WIDGET_DEFAULTS.theme) entries.push(['tema', config.theme])
  if (config.color.toUpperCase() !== WIDGET_DEFAULTS.color) entries.push(['cor', config.color])
  if (!config.header) entries.push(['titulo', '0'])
  return entries
}

export function buildWidgetUrl(origin, config) {
  const qs = new URLSearchParams(widgetParamEntries(config))
  return `${origin}/widget?${qs.toString()}`
}

// Link para o mapa público da prefeitura, já com um tik aberto (opcional).
export function buildMapUrl(origin, { municipality, state, tikId }) {
  const qs = new URLSearchParams({ municipio: municipality, uf: state })
  if (tikId) qs.set('tik', tikId)
  return `${origin}/mapa-de-entregas?${qs.toString()}`
}
