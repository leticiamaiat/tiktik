// Monta a imagem do story (1080x1920) com a foto do tik enquadrada e o texto
// desenhado por cima.
//
// Por que existe: story não tem legenda. Mandando a foto crua, a rede encaixa
// a imagem num fundo liso — foto deitada vira uma faixa no meio da tela — e o
// texto do tik não aparece em lugar nenhum, porque o `title` enviado na API só
// vale para o feed. Aqui a foto é recomposta no formato do story (sobre um
// fundo desfocado quando ela não preenche a tela) e a legenda é desenhada na
// própria imagem, dentro da faixa que a interface do Instagram/Facebook não
// cobre.

import logoTikUrl from '../assets/00_logo_1.png'
import { areaColors } from '../data/mockData'
import { decodeUpright, canvasToBlob } from './image'

const WIDTH = 1080
const HEIGHT = 1920
const MARGIN = 80
const JPEG_QUALITY = 0.92

// A interface do story cobre as pontas da tela (foto de perfil em cima, caixa
// de resposta embaixo). Logo e texto ficam sempre dentro desta faixa.
const SAFE_TOP = 250
const SAFE_BOTTOM = 330
const GAP_FOTO_TEXTO = 56
// Faixa reservada à logo, abaixo do topo seguro. Quando a foto não preenche a
// tela ela começa daqui pra baixo, para não ficar com a logo encostada na
// borda de cima dela.
const FAIXA_LOGO = 150

const NAVY = '#151A45'
const ORANGE = '#E07B22'
const SCRIM_RGB = '10, 13, 35'
const FONT = "'Segoe UI', system-ui, -apple-system, Roboto, sans-serif"

// Quanto da foto precisa sobreviver ao corte 9:16 para valer a pena preencher
// a tela inteira com ela. Foto de celular em pé passa; foto deitada não — dela
// sobraria só uma fatia do meio (a ambulância sem frente nem traseira).
const MIN_VISIVEL = 0.72

const LOGO_WIDTH = 210
const CHIP_FONT = 32
const CHIP_PAD = 28
const CHIP_H = 62
const CHIP_GAP = 30
const HEADLINE_MAX = 66
const HEADLINE_MIN = 42
const HEADLINE_LINHAS = 6
const ENTRELINHA = 1.2
const RODAPE_GAP = 40
const PREFEITURA_FONT = 38
const LOCAL_FONT = 30

// --- Carregamento ---

// A mesma foto já foi baixada por um <img> comum na tela (a miniatura da
// lista), e essa resposta fica no cache sem cabeçalho CORS — reaproveitada
// aqui, ela faria o canvas falhar. O parâmetro a mais garante uma entrada de
// cache própria, sempre pedida com CORS.
function urlComCors(url) {
  return `${url}${url.includes('?') ? '&' : '?'}cors=1`
}

async function carregarImagem(origem) {
  if (typeof origem !== 'string') return decodeUpright(origem)

  const img = new Image()
  // Sem crossOrigin o canvas fica "tainted" e o toBlob falha. Os arquivos
  // públicos do storage do Supabase respondem com CORS liberado.
  img.crossOrigin = 'anonymous'
  img.src = urlComCors(origem)
  await img.decode()
  return img
}

let logoPromise = null

function carregarLogo() {
  if (!logoPromise) {
    logoPromise = (async () => {
      const img = new Image()
      img.src = logoTikUrl
      await img.decode()
      return img
    })()
  }
  return logoPromise
}

// --- Texto ---

// Palavra que sozinha não cabe na linha (um link colado na descrição, por
// exemplo) é quebrada no meio em vez de vazar para fora da imagem.
function quebrarPalavra(ctx, palavra, largura) {
  const pedacos = []
  let atual = ''
  for (const letra of palavra) {
    if (atual && ctx.measureText(atual + letra).width > largura) {
      pedacos.push(atual)
      atual = letra
    } else {
      atual += letra
    }
  }
  if (atual) pedacos.push(atual)
  return pedacos
}

function quebrarLinhas(ctx, texto, largura) {
  const linhas = []
  for (const paragrafo of String(texto).split('\n')) {
    const palavras = paragrafo
      .split(/\s+/)
      .filter(Boolean)
      .flatMap((p) => (ctx.measureText(p).width > largura ? quebrarPalavra(ctx, p, largura) : [p]))
    if (!palavras.length) continue

    let linha = palavras[0]
    for (const palavra of palavras.slice(1)) {
      const tentativa = `${linha} ${palavra}`
      if (ctx.measureText(tentativa).width <= largura) linha = tentativa
      else {
        linhas.push(linha)
        linha = palavra
      }
    }
    linhas.push(linha)
  }
  return linhas
}

function truncar(ctx, texto, largura) {
  let corte = texto
  while (corte && ctx.measureText(`${corte}…`).width > largura) corte = corte.slice(0, -1)
  return `${corte.trimEnd()}…`
}

// Diminui a fonte até a descrição caber nas linhas disponíveis: descrição
// curta sai grande, descrição longa sai menor, e o bloco nunca estoura.
function ajustarHeadline(ctx, texto, largura) {
  const limpo = (texto || '').trim()
  if (!limpo) return { tamanho: HEADLINE_MAX, linhas: [] }

  for (let tamanho = HEADLINE_MAX; tamanho >= HEADLINE_MIN; tamanho -= 4) {
    ctx.font = `700 ${tamanho}px ${FONT}`
    const linhas = quebrarLinhas(ctx, limpo, largura)
    if (linhas.length <= HEADLINE_LINHAS) return { tamanho, linhas }
  }

  ctx.font = `700 ${HEADLINE_MIN}px ${FONT}`
  const linhas = quebrarLinhas(ctx, limpo, largura).slice(0, HEADLINE_LINHAS)
  linhas[linhas.length - 1] = truncar(ctx, linhas[linhas.length - 1], largura)
  return { tamanho: HEADLINE_MIN, linhas }
}

// Mede o bloco de texto antes de desenhar qualquer coisa: é a altura dele que
// decide até onde a foto pode ir.
function medirBloco(ctx, dados) {
  const largura = WIDTH - MARGIN * 2
  const { tamanho, linhas } = ajustarHeadline(ctx, dados.headline, largura)

  let altura = linhas.length * tamanho * ENTRELINHA
  if (dados.area) altura += CHIP_H + CHIP_GAP
  if (dados.prefeitura || dados.local) altura += RODAPE_GAP
  if (dados.prefeitura) altura += PREFEITURA_FONT * 1.3
  if (dados.local) altura += LOCAL_FONT * 1.4

  return { altura, tamanho, linhas, largura }
}

// --- Desenho ---

function caminhoArredondado(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r)
    return
  }
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function desenharCover(ctx, img, x, y, w, h) {
  const origemW = img.width || img.naturalWidth
  const origemH = img.height || img.naturalHeight
  const escala = Math.max(w / origemW, h / origemH)
  const destW = origemW * escala
  const destH = origemH * escala
  ctx.drawImage(img, x + (w - destW) / 2, y + (h - destH) / 2, destW, destH)
}

// Desfoque que funciona em qualquer navegador (ctx.filter não existe em
// todos): reduz a foto a um thumbnail e devolve esticado — quem borra é o
// próprio redimensionamento.
const FUNDO_ESCALA = 1 / 28

function desenharFundo(ctx, foto) {
  const mini = document.createElement('canvas')
  mini.width = Math.max(8, Math.round(WIDTH * FUNDO_ESCALA))
  mini.height = Math.max(8, Math.round(HEIGHT * FUNDO_ESCALA))
  desenharCover(mini.getContext('2d'), foto, 0, 0, mini.width, mini.height)

  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(mini, 0, 0, WIDTH, HEIGHT)
  // Escurece o fundo: o texto é branco e a foto não pode competir com ele.
  ctx.fillStyle = `rgba(${SCRIM_RGB}, 0.62)`
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.restore()
}

function desenharFoto(ctx, foto, limiteInferior) {
  const w = foto.width || foto.naturalWidth
  const h = foto.height || foto.naturalHeight
  const escalaCover = Math.max(WIDTH / w, HEIGHT / h)
  const visivel = Math.min(WIDTH / (w * escalaCover), HEIGHT / (h * escalaCover))

  // Foto já quase no formato do story: preenche a tela inteira, que é o
  // enquadramento que a rede social espera.
  if (visivel >= MIN_VISIVEL) {
    desenharCover(ctx, foto, 0, 0, WIDTH, HEIGHT)
    return
  }

  // Foto deitada ou quadrada: aparece inteira, de ponta a ponta na largura,
  // centralizada no espaço que sobra acima do texto.
  const areaTopo = SAFE_TOP + FAIXA_LOGO
  const areaAltura = Math.max(360, limiteInferior - areaTopo)
  let destW = WIDTH
  let destH = (h / w) * WIDTH
  if (destH > areaAltura) {
    destH = areaAltura
    destW = (w / h) * destH
  }

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 60
  ctx.shadowOffsetY = 16
  ctx.drawImage(foto, (WIDTH - destW) / 2, areaTopo + (areaAltura - destH) / 2, destW, destH)
  ctx.restore()
}

// Escurecimento nas duas pontas: garante contraste da logo e do texto mesmo
// quando a parte da foto atrás deles é clara.
function desenharScrims(ctx, blocoTop) {
  const alturaTopo = SAFE_TOP + 260
  const topo = ctx.createLinearGradient(0, 0, 0, alturaTopo)
  topo.addColorStop(0, `rgba(${SCRIM_RGB}, 0.75)`)
  topo.addColorStop(1, `rgba(${SCRIM_RGB}, 0)`)
  ctx.fillStyle = topo
  ctx.fillRect(0, 0, WIDTH, alturaTopo)

  // Começa bem antes do texto e escurece rápido: numa foto clara (parede
  // branca, céu) o branco do texto precisa ter fundo escuro atrás desde a
  // primeira linha.
  const inicio = Math.max(0, blocoTop - 340)
  const base = ctx.createLinearGradient(0, inicio, 0, HEIGHT)
  base.addColorStop(0, `rgba(${SCRIM_RGB}, 0)`)
  base.addColorStop(0.35, `rgba(${SCRIM_RGB}, 0.62)`)
  base.addColorStop(0.65, `rgba(${SCRIM_RGB}, 0.88)`)
  base.addColorStop(1, `rgba(${SCRIM_RGB}, 0.96)`)
  ctx.fillStyle = base
  ctx.fillRect(0, inicio, WIDTH, HEIGHT - inicio)
}

async function desenharLogo(ctx) {
  try {
    const logo = await carregarLogo()
    const altura = (logo.naturalHeight / logo.naturalWidth) * LOGO_WIDTH
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    ctx.shadowBlur = 20
    ctx.drawImage(logo, MARGIN, SAFE_TOP, LOGO_WIDTH, altura)
    ctx.restore()
  } catch (err) {
    // A logo é enfeite: se não carregar, o story sai sem ela.
    console.error('Falha ao carregar a logo do story:', err)
    logoPromise = null
  }
}

function desenharChip(ctx, texto, x, y, cor) {
  ctx.save()
  ctx.font = `700 ${CHIP_FONT}px ${FONT}`
  const largura = ctx.measureText(texto).width + CHIP_PAD * 2
  ctx.fillStyle = cor
  caminhoArredondado(ctx, x, y, largura, CHIP_H, CHIP_H / 2)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  ctx.fillText(texto, x + CHIP_PAD, y + CHIP_H / 2 + 2)
  ctx.restore()
}

function desenharBloco(ctx, topo, dados, medidas) {
  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 4

  let y = topo
  if (dados.area) {
    desenharChip(ctx, dados.area, MARGIN, y, areaColors[dados.area] || ORANGE)
    y += CHIP_H + CHIP_GAP
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = `700 ${medidas.tamanho}px ${FONT}`
  for (const linha of medidas.linhas) {
    ctx.fillText(linha, MARGIN, y)
    y += medidas.tamanho * ENTRELINHA
  }

  if (dados.prefeitura || dados.local) {
    ctx.fillStyle = ORANGE
    ctx.fillRect(MARGIN, y + 14, 64, 5)
    y += RODAPE_GAP
  }
  if (dados.prefeitura) {
    ctx.fillStyle = '#ffffff'
    ctx.font = `600 ${PREFEITURA_FONT}px ${FONT}`
    ctx.fillText(dados.prefeitura, MARGIN, y)
    y += PREFEITURA_FONT * 1.3
  }
  if (dados.local) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)'
    ctx.font = `400 ${LOCAL_FONT}px ${FONT}`
    ctx.fillText(dados.local, MARGIN, y)
  }
  ctx.restore()
}

/**
 * Devolve um Blob JPEG 1080x1920 pronto para publicar no story.
 *
 * @param {object} dados
 * @param {File|string} dados.photo    arquivo da foto ou URL pública dela
 * @param {string} [dados.area]        área do tik, vira a tarja colorida
 * @param {string} [dados.headline]    texto principal (descrição do tik)
 * @param {string} [dados.prefeitura]  ex.: "Prefeitura de Sorocaba, SP"
 * @param {string} [dados.local]       ex.: "Centro, Sorocaba · 15/10/2026"
 */
export async function renderStoryImage(dados) {
  const foto = await carregarImagem(dados.photo)

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = NAVY
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const medidas = medirBloco(ctx, dados)
  const blocoTop = HEIGHT - SAFE_BOTTOM - medidas.altura

  desenharFundo(ctx, foto)
  desenharFoto(ctx, foto, blocoTop - GAP_FOTO_TEXTO)
  desenharScrims(ctx, blocoTop)
  await desenharLogo(ctx)
  desenharBloco(ctx, blocoTop, dados, medidas)

  if (typeof foto.close === 'function') foto.close()
  return canvasToBlob(canvas, JPEG_QUALITY)
}
