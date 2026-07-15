import { useState, useEffect, useMemo, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import {
  X, Heart, Calendar, HeartPulse, HandHeart, GraduationCap,
  HardHat, Leaf, Shield, Palette, Briefcase,
} from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { getTiks } from '../services/tiks'
import { areas, areaColors } from '../data/mockData'

const mapContainerStyle = { width: '100%', height: 'calc(100vh - 56px)' }
const defaultCenter = { lat: -23.5015, lng: -47.4526 }

const areaIcons = {
  'Saúde': HeartPulse,
  'Assistência Social': HandHeart,
  'Educação': GraduationCap,
  'Obras, Infraestrutura e Mobilidade': HardHat,
  'Meio Ambiente': Leaf,
  'Segurança Pública': Shield,
  'Cultura': Palette,
  'Desenvolvimento Econômico': Briefcase,
}

// Área ocupada pelo painel de legenda (top-left) e pelos cards de resumo
// (bottom-left) — os cards de detalhe não devem nascer nessas zonas.
const CARD_W = 320
const CARD_H = 340
const MARGIN = 16
const LEFT_SAFE = 320
const BOTTOM_SAFE = 130
const MAX_CARDS = 4

function pinIcon(color) {
  return {
    path: 'M12 2C7.58 2 4 5.58 4 10c0 5.25 7.05 11.35 7.35 11.61a1 1 0 0 0 1.3 0C12.95 21.35 20 15.25 20 10c0-4.42-3.58-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z',
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: 1.7,
    anchor: new window.google.maps.Point(12, 22),
  }
}

function randomCardPosition(containerRect, existing) {
  const width = containerRect?.width || 1000
  const height = containerRect?.height || 600
  const maxLeft = Math.max(LEFT_SAFE, width - CARD_W - MARGIN)
  const maxTop = Math.max(MARGIN, height - CARD_H - MARGIN - BOTTOM_SAFE)

  let left = LEFT_SAFE + Math.random() * Math.max(0, maxLeft - LEFT_SAFE)
  let top = MARGIN + Math.random() * Math.max(0, maxTop - MARGIN)

  for (let attempt = 0; attempt < 8; attempt++) {
    const overlaps = existing.some(
      (c) => Math.abs(c.position.left - left) < CARD_W * 0.6 && Math.abs(c.position.top - top) < CARD_H * 0.6
    )
    if (!overlaps) break
    left = LEFT_SAFE + Math.random() * Math.max(0, maxLeft - LEFT_SAFE)
    top = MARGIN + Math.random() * Math.max(0, maxTop - MARGIN)
  }

  return { left, top }
}

function DeliveryCard({ tik, position, onClose }) {
  const Icon = areaIcons[tik.area]
  const likeCount = (tik.likes || []).length

  return (
    <div
      className="absolute z-20 w-80 max-w-[calc(100%-2rem)] bg-white rounded-xl shadow-2xl overflow-hidden"
      style={{ left: position.left, top: position.top }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: areaColors[tik.area] || '#E07B22' }}
          >
            {Icon && <Icon size={14} className="text-white" />}
          </span>
          <span className="font-semibold text-gray-700 text-sm truncate">{tik.area}</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 flex-shrink-0 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {tik.image_url ? (
        <img src={tik.image_url} alt={tik.area} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-300 text-4xl">📷</span>
        </div>
      )}

      <div className="px-4 py-3">
        {tik.description && (
          <p className="text-sm font-semibold text-gray-800 mb-1">{tik.description}</p>
        )}
        {tik.location && (
          <p className="text-xs text-gray-500 mb-1">{tik.location}</p>
        )}
        {tik.created_at && (
          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
            <Calendar size={12} />
            {new Date(tik.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-tik-orange flex items-center justify-center flex-shrink-0">
              {tik.profiles?.avatar_url ? (
                <img src={tik.profiles.avatar_url} alt={tik.profiles.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">{(tik.profiles?.name || '?')[0]}</span>
              )}
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-[10px] text-gray-400">Enviado por:</p>
              <p className="text-xs font-semibold text-gray-700 truncate">{tik.profiles?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs flex-shrink-0">
            <Heart size={14} />
            {likeCount} curtida{likeCount === 1 ? '' : 's'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MapaDeEntregas() {
  const { user } = useAuth()
  const mapWrapRef = useRef(null)
  const [tiks, setTiks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeAreas, setActiveAreas] = useState(() => new Set(areas))
  const [openCards, setOpenCards] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  useEffect(() => {
    setLoading(true)
    getTiks({ startDate: startDate || undefined, endDate: endDate || undefined })
      .then(setTiks)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [startDate, endDate])

  const visibleTiks = useMemo(
    () => tiks.filter((t) => t.lat && t.lng && activeAreas.has(t.area)),
    [tiks, activeAreas]
  )

  const countsByArea = useMemo(() => {
    const map = {}
    areas.forEach((a) => { map[a] = 0 })
    tiks.forEach((t) => { if (map[t.area] !== undefined) map[t.area] += 1 })
    return map
  }, [tiks])

  function toggleArea(area) {
    setActiveAreas((prev) => {
      const next = new Set(prev)
      if (next.has(area)) next.delete(area)
      else next.add(area)
      return next
    })
  }

  function handleMarkerClick(tik) {
    setOpenCards((prev) => {
      // clicar de novo no mesmo marcador fecha o card
      if (prev.some((c) => c.tik.id === tik.id)) {
        return prev.filter((c) => c.tik.id !== tik.id)
      }
      const rect = mapWrapRef.current?.getBoundingClientRect()
      const position = randomCardPosition(rect, prev)
      const next = [...prev, { tik, position }]
      // evita empilhar cards demais na tela: remove os mais antigos
      return next.length > MAX_CARDS ? next.slice(next.length - MAX_CARDS) : next
    })
  }

  function closeCard(id) {
    setOpenCards((prev) => prev.filter((c) => c.tik.id !== id))
  }

  return (
    <Layout>
      <div className="relative" ref={mapWrapRef}>
        {isLoaded ? (
          <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultCenter} zoom={13}>
            {visibleTiks.map((tik) => (
              <Marker
                key={tik.id}
                position={{ lat: tik.lat, lng: tik.lng }}
                title={tik.area}
                icon={pinIcon(areaColors[tik.area] || '#E07B22')}
                onClick={() => handleMarkerClick(tik)}
              />
            ))}
          </GoogleMap>
        ) : (
          <div style={mapContainerStyle} className="bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Carregando mapa...</span>
          </div>
        )}

        {/* Painel: título + filtros + legenda */}
        <div className="absolute top-4 left-4 z-10 w-72 max-w-[calc(100%-2rem)] bg-white rounded-xl shadow-lg p-4">
          <h1 className="text-lg font-bold text-gray-800 leading-tight">
            Ações que transformam<br />{user?.municipality || 'sua cidade'}
          </h1>
          <p className="text-xs text-gray-500 mt-1 mb-3">
            Obras, cultura e educação por toda a cidade.
          </p>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 min-w-0 border border-gray-200 rounded px-2 py-1 text-[11px] text-gray-500"
            />
            <span className="text-gray-300 text-xs">–</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 min-w-0 border border-gray-200 rounded px-2 py-1 text-[11px] text-gray-500"
            />
          </div>

          <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3">
            {areas.map((area) => (
              <button
                key={area}
                onClick={() => toggleArea(area)}
                className={`flex items-center gap-2 text-left text-sm px-1 py-0.5 rounded transition-opacity cursor-pointer ${activeAreas.has(area) ? 'opacity-100' : 'opacity-40'}`}
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: areaColors[area] }} />
                <span className="text-gray-700 truncate">{area}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cards de resumo por área */}
        <div className="absolute bottom-4 left-4 z-10 flex gap-2 flex-wrap max-w-[calc(100%-2rem)]">
          {areas.filter((a) => countsByArea[a] > 0).map((area) => {
            const Icon = areaIcons[area]
            return (
              <div key={area} className="bg-white rounded-xl shadow-lg px-4 py-2.5 flex flex-col items-center min-w-[84px]">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-1"
                  style={{ backgroundColor: areaColors[area] }}
                >
                  <Icon size={16} className="text-white" />
                </span>
                <span className="text-lg font-bold text-gray-800 leading-none">{countsByArea[area]}</span>
                <span className="text-[11px] text-gray-500 text-center leading-tight mt-0.5">{area.split(',')[0]}</span>
              </div>
            )
          })}
          {!loading && tiks.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg px-4 py-2.5 text-xs text-gray-400">
              Nenhuma entrega no período selecionado.
            </div>
          )}
        </div>

        {/* Cards de detalhe das entregas selecionadas */}
        {openCards.map(({ tik, position }) => (
          <DeliveryCard key={tik.id} tik={tik} position={position} onClose={() => closeCard(tik.id)} />
        ))}
      </div>
    </Layout>
  )
}
