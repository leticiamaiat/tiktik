import { useEffect, useRef, useState } from 'react'
import { renderStoryImage } from '../lib/storyImage'

// Tempo parado antes de redesenhar: montar 1080x1920 a cada tecla deixaria o
// campo de texto travado, ainda mais no celular.
const ESPERA = 450

// Identidade do que muda o desenho. O objeto `dados` é novo a cada render do
// pai, então sem isso a prévia se redesenharia à toa o tempo todo.
function chaveDe(dados) {
  if (!dados) return ''
  const foto =
    typeof dados.photo === 'string'
      ? dados.photo
      : `${dados.photo?.name}|${dados.photo?.size}|${dados.photo?.lastModified}`
  return [foto, dados.area, dados.headline, dados.prefeitura, dados.local].join('|')
}

/**
 * Mostra a imagem do story exatamente como vai ser publicada: roda o mesmo
 * renderStoryImage da publicação, sobre os dados montados por dadosDoStory.
 *
 * @param {object} props
 * @param {object} props.dados       o que vai para renderStoryImage; sem
 *                                   `photo` a prévia vira um aviso
 * @param {string} [props.className] tamanho da caixa (mantém 9:16)
 * @param {string} [props.nota]      linha abaixo da imagem; null esconde
 */
export default function StoryPreview({
  dados,
  className = 'w-[216px] h-[384px]',
  nota = '1080 × 1920 · como vai sair',
}) {
  const [previa, setPrevia] = useState(null)
  const [montando, setMontando] = useState(true)
  const [erro, setErro] = useState(null)
  const urlRef = useRef(null)
  const dadosRef = useRef(dados)
  dadosRef.current = dados

  const chave = chaveDe(dados)
  const semFoto = !dados?.photo

  useEffect(() => {
    if (!dadosRef.current?.photo) {
      setPrevia(null)
      setMontando(false)
      return
    }

    let cancelado = false
    setMontando(true)

    const timer = setTimeout(async () => {
      try {
        const blob = await renderStoryImage(dadosRef.current)
        if (cancelado) return
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        urlRef.current = URL.createObjectURL(blob)
        setPrevia(urlRef.current)
        setErro(null)
      } catch (err) {
        console.error('Falha ao montar a prévia do story:', err)
        if (!cancelado) setErro('Não foi possível montar a prévia desta foto.')
      } finally {
        if (!cancelado) setMontando(false)
      }
    }, ESPERA)

    return () => {
      cancelado = true
      clearTimeout(timer)
    }
  }, [chave])

  // Só na saída: enquanto o componente vive, a URL atual ainda está na tela.
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current) }, [])

  return (
    <div className="flex-shrink-0">
      <div className={`${className} rounded-xl overflow-hidden bg-tik-navy relative`}>
        {previa && <img src={previa} alt="Prévia do story" className="w-full h-full object-cover" />}

        {semFoto && (
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <p className="text-[11px] text-white/70 text-center">Escolha uma foto para ver a prévia</p>
          </div>
        )}

        {!semFoto && montando && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!semFoto && erro && !montando && (
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <p className="text-[11px] text-white text-center">{erro}</p>
          </div>
        )}
      </div>

      {nota && <p className="text-[11px] text-gray-400 text-center mt-2">{nota}</p>}
    </div>
  )
}
