const cache = new Map()

export async function getMunicipios(uf) {
  if (!uf) return []
  if (cache.has(uf)) return cache.get(uf)

  const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
  if (!res.ok) throw new Error('Falha ao buscar municípios do IBGE')
  const data = await res.json()
  const municipios = data.map((m) => m.nome).sort((a, b) => a.localeCompare(b, 'pt-BR'))

  cache.set(uf, municipios)
  return municipios
}
