import { supabase } from '../lib/supabase'
import { legendaStoryDe } from '../lib/legenda'
import { renderStoryImage } from '../lib/storyImage'

// A imagem do story é montada no navegador (storyImage.js) e precisa virar uma
// URL pública antes de publicar: tanto o upload-post quanto o Instagram só
// aceitam a foto por link, nunca o arquivo em si.

function linhaPrefeitura(perfil) {
  if (!perfil.municipality) return ''
  return `Prefeitura de ${perfil.municipality}${perfil.state ? `, ${perfil.state}` : ''}`
}

function linhaLocal(tik) {
  const data = tik.created_at ? new Date(tik.created_at).toLocaleDateString('pt-BR') : ''
  return [tik.location, data].filter(Boolean).join(' · ')
}

/**
 * Tudo que o desenho do story precisa saber sobre o tik, num lugar só: a
 * prévia na tela e a imagem publicada saem iguais porque as duas passam por
 * aqui. Para ver um texto ainda não salvo, basta passar o tik com o campo
 * trocado: `dadosDoStory({ ...tik, legenda_story: rascunho })`.
 */
export function dadosDoStory(tik, photoFile) {
  return {
    photo: photoFile || tik.image_url,
    area: tik.area,
    headline: legendaStoryDe(tik),
    prefeitura: linhaPrefeitura(tik.profiles || {}),
    local: linhaLocal(tik),
  }
}

/**
 * Monta a imagem do story do tik, sobe para o storage e devolve a URL pública.
 *
 * Nunca lança: se a montagem ou o upload falhar, devolve a foto original —
 * o story sai como saía antes, mas a publicação não é perdida por causa disso.
 *
 * @param {object} args
 * @param {object} args.tik          tik com profiles carregado
 * @param {string} args.userId       quem está publicando (dono do arquivo)
 * @param {File}   [args.photoFile]  arquivo original, quando a tela já o tem
 *                                   em mãos — evita baixar a foto de volta
 */
export async function buildStoryImage({ tik, userId, photoFile }) {
  if (!tik?.image_url) return tik?.image_url || null

  try {
    const blob = await renderStoryImage(dadosDoStory(tik, photoFile))

    // Mesmo prefixo do upload do tik (tiks/<usuário>/), para cair na mesma
    // política de storage. Nome novo a cada publicação: assim nenhum upload
    // depende de permissão de sobrescrita nem esbarra em cache do CDN.
    const path = `tiks/${userId}/story-${tik.id}-${Date.now()}.jpg`
    const { error } = await supabase.storage
      .from('tik-media')
      .upload(path, blob, { contentType: 'image/jpeg' })
    if (error) throw error

    const { data } = supabase.storage.from('tik-media').getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    console.error('Falha ao montar a imagem do story:', err)
    return tik.image_url
  }
}
