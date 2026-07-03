import { useState, useCallback, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { X, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import TikCard from '../components/TikCard'
import TikDetailModal from '../components/TikDetailModal'
import { useAuth } from '../contexts/AuthContext'
import { getTiks, createTik } from '../services/tiks'
import { getMunicipalityConnection, publishToInstagram } from '../services/uploadPost'
import { areas } from '../data/mockData'

const mapContainerStyle = { width: '100%', height: '410px' }
const modalMapStyle = { width: '100%', height: '100%' }
const defaultCenter = { lat: -23.5015, lng: -47.4526 }

export default function Home() {
  const { user } = useAuth()
  const [tiks, setTiks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [mapType, setMapType] = useState('roadmap')
  const [form, setForm] = useState({ area: '', description: '', photo: null, shareToInstagram: false })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [userLocation, setUserLocation] = useState(defaultCenter)
  const [locationName, setLocationName] = useState('Sorocaba, SP')
  const [submitting, setSubmitting] = useState(false)
  const [igConn, setIgConn] = useState(null)
  const [selectedTik, setSelectedTik] = useState(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  useEffect(() => {
    getTiks().then(setTiks).catch(console.error)
    if (user?.municipality && user?.state) {
      getMunicipalityConnection(user.municipality, user.state)
        .then(setIgConn)
        .catch(() => setIgConn(null))
    }
  }, [])

  const handleOpenModal = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(defaultCenter)
      )
    }
    setShowModal(true)
  }, [])

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (file) {
      setForm((f) => ({ ...f, photo: file }))
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async () => {
    if (!form.area || submitting) return
    if (user?.autorizado === false) {
      toast.error('Você não está autorizado a publicar tiks. Fale com o administrador da sua prefeitura.')
      return
    }
    setSubmitting(true)
    try {
      const newTik = await createTik({
        userId: user.id,
        area: form.area,
        description: form.description,
        lat: userLocation.lat,
        lng: userLocation.lng,
        location: locationName,
        imageFile: form.photo,
      })
      setTiks((prev) => [newTik, ...prev])
      setShowModal(false)
      setForm({ area: '', description: '', photo: null, shareToInstagram: false })
      setPhotoPreview(null)

      if (form.shareToInstagram && newTik.image_url) {
        const caption =
          `${form.description ? form.description + '\n\n' : ''}` +
          `📍 ${locationName}\n🏛️ Prefeitura de Sorocaba`
        const igToast = toast.loading('Publicando no Instagram...')
        try {
          await publishToInstagram(user.municipality, user.state, newTik.image_url, caption)
          toast.success('Publicado no Instagram!', { id: igToast })
        } catch (igErr) {
          toast.error(`Instagram: ${igErr.message}`, { id: igToast })
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao criar tik')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1)

  const userTikCount = tiks.filter((t) => t.user_id === user?.id).length
  const isBlocked = user?.autorizado === false

  return (
    <Layout>
      <div className="relative">
        {/* Map type toggle */}
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

        {/* Main map */}
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={11}
            mapTypeId={mapType}
          >
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

        {/* Fazer um TIK */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <button
            onClick={handleOpenModal}
            disabled={isBlocked}
            title={isBlocked ? 'Você não está autorizado a publicar tiks. Fale com o administrador da sua prefeitura.' : undefined}
            className="btn-orange px-8 py-3 text-sm font-bold tracking-widest uppercase shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Fazer um TIK
          </button>
        </div>

        {/* Counters */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <div className="w-12 h-12 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-md bg-gray-600">
            <span className="text-lg font-black">{userTikCount}</span>
            <span className="text-[9px]">Tiks</span>
          </div>
          <button
            onClick={handleOpenModal}
            disabled={isBlocked}
            title={isBlocked ? 'Você não está autorizado a publicar tiks. Fale com o administrador da sua prefeitura.' : undefined}
            className="w-12 h-12 rounded-full flex flex-col items-center justify-center text-white text-xs font-bold shadow-md bg-tik-orange disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-[9px] text-center leading-tight">Fazer<br/>Tik</span>
          </button>
        </div>
      </div>

      {/* Tiks list */}
      {tiks.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col gap-3">
          {tiks.map((tik) => (
            <TikCard key={tik.id} tik={tik} onView={setSelectedTik} />
          ))}
        </div>
      )}

      <TikDetailModal tik={selectedTik} onClose={() => setSelectedTik(null)} />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white bg-tik-orange"
            >
              <X size={16} />
            </button>

            <h2 className="text-xl font-semibold text-gray-700 mb-1">Faz um tik</h2>
            <p className="text-xs text-tik-orange mb-4">{locationName}</p>

            {/* Photo + mini map */}
            <div className="flex gap-3 mb-4">
              <label className="flex-1 h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-tik-orange transition-colors overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera size={24} className="text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400 text-center px-2">Clique aqui para tirar a foto</span>
                  </>
                )}
                <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
              </label>

              <div className="flex-1 h-28 rounded-lg overflow-hidden border border-gray-200">
                {isLoaded ? (
                  <GoogleMap mapContainerStyle={modalMapStyle} center={userLocation} zoom={14} options={{ disableDefaultUI: true }}>
                    <Marker position={userLocation} />
                  </GoogleMap>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-400">Mapa</span>
                  </div>
                )}
              </div>
            </div>

            <input
              type="text"
              value={todayFormatted}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50 mb-3 text-center"
            />

            <select
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 mb-3 bg-white"
            >
              <option value="">Selecione a área</option>
              {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>

            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descrição breve sobre o que foi feito..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 mb-4 resize-none"
            />

            {igConn && form.photo && (
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={form.shareToInstagram}
                  onChange={(e) => setForm((f) => ({ ...f, shareToInstagram: e.target.checked }))}
                  className="w-4 h-4 accent-pink-500"
                />
                <span className="text-sm text-gray-600">
                  Publicar também no{' '}
                  <span className="font-semibold text-pink-600">Instagram</span>
                  <span className="text-gray-400 text-xs"> (@{igConn.ig_username})</span>
                </span>
              </label>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={!form.area || submitting}
                className="btn-orange px-10 py-2.5 disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Tikar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
