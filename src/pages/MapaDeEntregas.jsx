import { useState, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import Layout from '../components/Layout'
import TikDetailModal from '../components/TikDetailModal'
import { getTiks } from '../services/tiks'
import { areas } from '../data/mockData'

const mapContainerStyle = { width: '100%', height: 'calc(100vh - 100px)' }
const defaultCenter = { lat: -23.5015, lng: -47.4526 }

export default function MapaDeEntregas() {
  const [tiks, setTiks] = useState([])
  const [mapType, setMapType] = useState('roadmap')
  const [city, setCity] = useState('Sorocaba - SP, Brasil')
  const [selectedArea, setSelectedArea] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedTik, setSelectedTik] = useState(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  useEffect(() => {
    getTiks({ area: selectedArea || undefined, startDate: startDate || undefined, endDate: endDate || undefined })
      .then(setTiks)
      .catch(console.error)
  }, [selectedArea, startDate, endDate])

  return (
    <Layout>
      {/* Filter bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 flex-wrap shadow-sm">
        <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">Mapa de entregas</span>

        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          placeholder="Cidade"
        />

        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white min-w-40"
        >
          <option value="">Selecionar por área</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />
      </div>

      {/* Map */}
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
          <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultCenter} zoom={12} mapTypeId={mapType}>
            {tiks.map((tik) => (
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

      <TikDetailModal tik={selectedTik} onClose={() => setSelectedTik(null)} />
    </Layout>
  )
}
