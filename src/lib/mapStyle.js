// Estilo inspirado no mapa básico "Corredeira" do Google My Maps:
// fundo bege rosado, ruas claras e textos/ícones em tom terra.
export const corredeiraStyle = [
  { elementType: 'geometry', stylers: [{ color: '#ecdccd' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a9836a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f6ece3' }, { weight: 2 }] },
  { elementType: 'labels.icon', stylers: [{ saturation: -30 }, { lightness: 15 }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d6bba5' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#e7d3c2' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e4cdb9' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#c49b7e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e2d6c0' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f6ebe2' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e3cdbb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f9efe6' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#dcc2ad' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9c7a64' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#e3cebd' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfdde3' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#8fa7b1' }] },
]

export const mapOptions = { styles: corredeiraStyle }

// Escurece uma cor hex (usado no contorno e na bolinha central do pino)
function darken(hex, amount = 0.3) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.round(((n >> 16) & 255) * (1 - amount))
  const g = Math.round(((n >> 8) & 255) * (1 - amount))
  const b = Math.round((n & 255) * (1 - amount))
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

// Pino no formato clássico do Google My Maps: gota com bolinha escura no centro
const pinCache = {}
export function pinIcon(color = '#E07B22') {
  if (!pinCache[color]) {
    const dark = darken(color)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="27" height="43" viewBox="0 0 27 43">
      <path d="M13.5 1.5C6.9 1.5 1.5 6.8 1.5 13.4c0 9 12 28.1 12 28.1s12-19.1 12-28.1C25.5 6.8 20.1 1.5 13.5 1.5z" fill="${color}" stroke="${dark}" stroke-width="1.5"/>
      <circle cx="13.5" cy="13.5" r="4.8" fill="${dark}"/>
    </svg>`
    pinCache[color] = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new window.google.maps.Size(27, 43),
      anchor: new window.google.maps.Point(13.5, 42),
    }
  }
  return pinCache[color]
}

// Enquadra o mapa no município (ex.: "Sorocaba", "SP") usando o Geocoder do
// Google. Resolve true se conseguiu; false para o chamador usar outro
// enquadramento (ex.: caber os pinos). Resultados ficam em cache na sessão.
const geocodeCache = {}
export function fitMunicipality(map, municipality, state) {
  if (!map || !municipality || !window.google?.maps?.Geocoder) return Promise.resolve(false)
  const address = [municipality, state, 'Brasil'].filter(Boolean).join(', ')

  if (!geocodeCache[address]) {
    geocodeCache[address] = new Promise((resolve) => {
      new window.google.maps.Geocoder().geocode(
        { address, componentRestrictions: { country: 'BR' } },
        (results, status) => {
          const geo = status === 'OK' && results?.[0]?.geometry
          resolve(geo ? { viewport: geo.viewport, location: geo.location } : null)
        }
      )
    }).then((r) => {
      if (!r) delete geocodeCache[address] // tenta de novo numa próxima vez
      return r
    })
  }

  return geocodeCache[address].then((r) => {
    if (!r) return false
    if (r.viewport) map.fitBounds(r.viewport, 0)
    else {
      map.panTo(r.location)
      map.setZoom(12)
    }
    return true
  })
}
