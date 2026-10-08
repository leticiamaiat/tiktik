// O navegador respeita a tag EXIF Orientation ao exibir a foto, mas o
// Instagram (via upload-post) lê os pixels crus e ignora a tag — por isso uma
// foto tirada no celular aparece certa no TIK e virada/espelhada na publicação.
// Aqui a rotação é aplicada aos pixels e o arquivo é regravado sem EXIF, então
// o que fica no storage já está na orientação final para todo mundo.

const JPEG_QUALITY = 0.95

// Desenha o arquivo já com a orientação EXIF aplicada.
// createImageBitmap é o caminho explícito; o <img> é o fallback (navegadores
// atuais também aplicam EXIF ao desenhar um <img> no canvas). Nenhum dos dois
// faz rotação manual, então não há risco de girar duas vezes.
async function decodeUpright(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Safari antigo rejeita o options bag — cai no <img>.
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob falhou'))),
      'image/jpeg',
      JPEG_QUALITY
    )
  })
}

/**
 * Devolve um File JPEG com a orientação já aplicada aos pixels.
 * Só mexe em JPEG (único formato que carrega EXIF Orientation); qualquer outro
 * tipo, ou qualquer falha na conversão, devolve o arquivo original intacto —
 * a publicação nunca deve quebrar por causa dessa normalização.
 */
export async function normalizeImageOrientation(file) {
  if (!file || !/^image\/jpe?g$/i.test(file.type)) return file

  try {
    const source = await decodeUpright(file)
    const width = source.width || source.naturalWidth
    const height = source.height || source.naturalHeight
    if (!width || !height) return file

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(source, 0, 0)
    if (typeof source.close === 'function') source.close()

    const blob = await canvasToBlob(canvas)
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch (err) {
    console.error('Falha ao normalizar a orientação da imagem:', err)
    return file
  }
}
