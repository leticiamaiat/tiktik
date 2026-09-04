import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import Layout from '../components/Layout'
import TikCard from '../components/TikCard'
import TikDetailModal from '../components/TikDetailModal'
import { useAuth } from '../contexts/AuthContext'
import { getTiks } from '../services/tiks'

// Mapa ocupa 60% da altura da tela (pedido: "mapa estático em 60%").
const mapContainerStyle = { width: '100%', height: '60vh' }
const defaultCenter = { lat: -23.5015, lng: -47.4526 }

export default function MeusTiks() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tiks, setTiks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTik, setSelectedTik] = useState(null)
  const [mapType, setMapType] = useState('roadmap')

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  useEffect(() => {
    if (!user?.id) return
    getTiks({ userId: user.id })
      .then(setTiks)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.id])

  const tiksWithCoords = useMemo(() => tiks.filter((t) => t.lat && t.lng), [tiks])
  const center = tiksWithCoords[0]
    ? { lat: tiksWithCoords[0].lat, lng: tiksWithCoords[0].lng }
    : defaultCenter

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-36 h-36 rounded-full object-cover border-4 border-gray-200 shadow" />
          ) : (
            <div className="w-36 h-36 rounded-full bg-tik-orange flex items-center justify-center text-white text-4xl font-bold border-4 border-gray-200 shadow">
              {(user?.name || user?.email || '?')[0].toUpperCase()}
            </div>
          )}

          <div className="flex flex-col items-center sm:items-start gap-1">
            <h2 className="text-xl font-bold text-gray-800">{user?.name || user?.email}</h2>
            {user?.email && <p className="text-sm text-gray-500">Email: {user.email}</p>}
            {user?.phone && <p className="text-sm text-gray-500">Telefone: {user.phone}</p>}
            {user?.municipality && (
              <p className="text-sm text-gray-500">
                Município: {user.municipality}{user.state ? `, ${user.state}` : ''}
                {user.cep ? ` - CEP: ${user.cep}` : ''}
              </p>
            )}
            <button onClick={() => navigate('/editar-perfil')} className="mt-3 btn-orange px-8 py-2 text-sm">
              Editar perfil
            </button>
          </div>
        </div>

        {user?.secretaria && (
          <p className="text-center text-sm text-gray-500 mb-4">
            Trabalha na Secretaria de {user.secretaria} da Prefeitura de {user.prefeitura || user.municipality}
          </p>
        )}
      </div>

      {/* Mapa dos meus tiks — 60% da tela */}
      <div className="relative">
        <div className="absolute top-3 left-3 z-10 flex bg-white border border-gray-300 rounded-md overflow-hidden shadow-sm">
          {['roadmap', 'satellite'].map((type) => (
            <button
              key={type}
              onClick={() => setMapType(type)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${mapType === type ? 'bg-white text-gray-800' : 'bg-gray-50 text-gray-500'}`}
            >
              {type === 'roadmap' ? 'Mapa' : 'Satélite'}
            </button>
          ))}
        </div>

        {isLoaded ? (
          <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={12} mapTypeId={mapType}>
            {tiksWithCoords.map((tik) => (
              <Marker
                key={tik.id}
                position={{ lat: tik.lat, lng: tik.lng }}
                title={tik.area}
                onClick={() => setSelectedTik(tik)}
              />
            ))}
          </GoogleMap>
        ) : (
          <div style={mapContainerStyle} className="bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Carregando mapa...</span>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4 pb-8">
        <p className="text-center text-sm text-gray-600 font-semibold mb-4">
          {user?.firstName} enviou {tiks.length} tiks:
        </p>

        {loading && <p className="text-center text-gray-400 text-sm">Carregando tiks...</p>}

        {!loading && tiks.length === 0 && (
          <p className="text-center text-gray-400 text-sm">Você ainda não enviou nenhum tik.</p>
        )}

        <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {tiks.map((tik) => (
            <TikCard key={tik.id} tik={tik} onView={setSelectedTik} />
          ))}
        </div>
      </div>

      <TikDetailModal tik={selectedTik} onClose={() => setSelectedTik(null)} />
    </Layout>
  )
}
