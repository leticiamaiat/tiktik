import { useState } from 'react'
import { X, Check, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import StoryPreview from './StoryPreview'
import { legendaStoryDe, sugerirLegendaStory } from '../lib/legenda'
import { dadosDoStory } from '../services/storyMedia'
import { updateLegendaStory } from '../services/tiks'

// Acima disso a fonte do story começa a encolher (ver lib/storyImage.js) —
// não é erro, só o aviso de que o texto está ficando grande para a tela.
const TAMANHO_CONFORTAVEL = 180

/**
 * Escreve a legenda exclusiva do story e mostra, do lado, exatamente a imagem
 * que vai ser publicada.
 */
export default function StoryModal({ tik, onClose, onSaved }) {
  const [texto, setTexto] = useState(() => legendaStoryDe(tik))
  const [salvando, setSalvando] = useState(false)

  const sugestao = sugerirLegendaStory(tik)
  const longo = texto.trim().length > TAMANHO_CONFORTAVEL

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      // Vazio volta a ser NULL: o story passa a usar a sugestão de novo, em
      // vez de ficar preso num texto em branco.
      const legenda = texto.trim() || null
      await updateLegendaStory(tik.id, legenda)
      onSaved({ ...tik, legenda_story: legenda })
      toast.success('Legenda do story salva')
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar a legenda do story')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Legenda e prévia do story</h2>
            <p className="text-xs text-gray-400">{tik.area || 'Sem secretaria'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 p-5">
          <div className="mx-auto sm:mx-0">
            {/* O rascunho entra no lugar do campo salvo: a prévia passa pelo
                mesmo dadosDoStory da publicação, sem caminho paralelo. */}
            <StoryPreview dados={dadosDoStory({ ...tik, legenda_story: texto })} />
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <label className="text-xs font-semibold text-gray-700 mb-1.5">
              Texto que aparece na imagem
            </label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={6}
              autoFocus
              className="w-full border border-gray-300 focus:border-tik-orange outline-none rounded-lg px-3 py-2 text-sm text-gray-700 resize-none"
            />

            <div className="flex items-center justify-between gap-2 mt-1.5">
              <p className={`text-[11px] ${longo ? 'text-amber-600' : 'text-gray-400'}`}>
                {longo
                  ? `${texto.trim().length} caracteres — a fonte diminui e o que passar de 6 linhas é cortado na imagem.`
                  : `${texto.trim().length} caracteres`}
              </p>
              {texto.trim() !== sugestao && sugestao && (
                <button
                  onClick={() => setTexto(sugestao)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-tik-orange hover:text-tik-dark whitespace-nowrap"
                >
                  <Sparkles size={12} /> Usar sugestão
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
              <strong>ATENÇÃO:</strong> Esta legenda vale só para o story, não altera a legenda da
              publicação no feed. Se quiser mudar a legenda da publicação, vá para a tela de edição
              do post.
            </p>

            <div className="flex items-center gap-3 mt-auto pt-5">
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="btn-orange text-xs flex items-center gap-1.5 disabled:opacity-60"
              >
                <Check size={14} /> {salvando ? 'Salvando...' : 'Salvar legenda do story'}
              </button>
              <button
                onClick={onClose}
                disabled={salvando}
                className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
