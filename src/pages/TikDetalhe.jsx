import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { ThumbsUp, ChevronLeft, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { getTik, deleteTik } from '../services/tiks'
import { toggleLike } from '../services/likes'

export default function TikDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tik, setTik] = useState(null)
  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState('')

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  useEffect(() => {
    getTik(id)
      .then(setTik)
      .catch((err) => {
        console.error(err)
        toast.error('Tik não encontrado')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!isLoaded || !tik) return
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ location: { lat: tik.lat, lng: tik.lng } }, (results, status) => {
      if (status === 'OK' && results[0]) setAddress(results[0].formatted_address)
    })
  }, [isLoaded, tik])

  const handleLike = async () => {
    if (!tik || !user) return
    try {
      const liked = await toggleLike(tik.id, user.id)
      setTik((t) => ({
        ...t,
        likes: liked
          ? [...(t.likes || []), { user_id: user.id }]
          : (t.likes || []).filter((l) => l.user_id !== user.id),
      }))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!tik || !window.confirm('Tem certeza que deseja apagar este tik?')) return
    try {
      await deleteTik(tik.id)
      toast.success('Tik apagado')
      navigate('/meus-tiks')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao apagar tik')
    }
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-center text-gray-400 py-16">Carregando tik...</p>
      </Layout>
    )
  }

  if (!tik) {
    return (
      <Layout>
        <p className="text-center text-gray-400 py-16">Tik não encontrado.</p>
      </Layout>
    )
  }

  const profile = tik.profiles || {}
  const isOwner = tik.user_id === user?.id
  const isLiked = (tik.likes || []).some((l) => l.user_id === user?.id)
  const likeCount = (tik.likes || []).length
  const createdAt = new Date(tik.created_at)
  const protocolo = `${tik.id.toString().replace(/-/g, '').slice(0, 6)}-${createdAt
    .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    .replace('.', '')}`

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Like bar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleLike}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white transition-colors"
            style={{ backgroundColor: '#F0B37E' }}
          >
            {isLiked ? `Curtido (${likeCount})` : 'Clique aqui para curtir'}
            <ThumbsUp size={18} fill={isLiked ? '#fff' : 'none'} />
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-gray-400 flex-shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Imagem do tik:</p>
            {tik.image_url && (
              <a
                href={tik.image_url}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-tik-orange text-sm font-medium mb-2"
              >
                <Download size={14} /> Clique aqui p/ download da imagem
              </a>
            )}
            {tik.image_url ? (
              <img src={tik.image_url} alt={tik.area} className="w-full rounded-lg object-cover" />
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-4xl">
                📷
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">O que foi feito:</p>
              <p className="font-semibold text-gray-800">{tik.description || '—'}</p>
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Setor competente:</span> {tik.area}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Município:</span> {profile.municipality || '—'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">UF:</span> {profile.state || '—'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Protocolo nº</span> {protocolo}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Data de criação:</span> {createdAt.toLocaleDateString('pt-BR')}
            </p>
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Onde:</p>
              <p className="text-sm text-gray-600">{address || tik.location}</p>
            </div>
          </div>

          {/* Map + author */}
          <div>
            <div className="rounded-lg overflow-hidden border border-gray-200 mb-4" style={{ height: 220 }}>
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: tik.lat, lng: tik.lng }}
                  zoom={15}
                >
                  <Marker position={{ lat: tik.lat, lng: tik.lng }} />
                </GoogleMap>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  Carregando mapa...
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-2">Enviado por:</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-tik-orange flex items-center justify-center flex-shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">{(profile.name || '?')[0]}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{profile.name}</p>
                {profile.phone && <p className="text-xs text-gray-500">{profile.phone}</p>}
                {isOwner && user?.email && <p className="text-xs text-gray-500">{user.email}</p>}
              </div>
            </div>

            {isOwner && (
              <button
                onClick={handleDelete}
                className="w-full border border-red-400 text-red-500 rounded-lg text-sm py-2 hover:bg-red-50 transition-colors"
              >
                Apagar tik
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
