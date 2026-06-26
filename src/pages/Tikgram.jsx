import { useState, useEffect } from 'react'
import { ThumbsUp, Search, Plus } from 'lucide-react'
import Layout from '../components/Layout'
import { getTiks } from '../services/tiks'
import { toggleLike } from '../services/likes'
import { useAuth } from '../contexts/AuthContext'
import { areas } from '../data/mockData'

export default function Tikgram() {
  const { user } = useAuth()
  const [tiks, setTiks] = useState([])
  const [selectedArea, setSelectedArea] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTiks({ area: selectedArea || undefined })
      .then(setTiks)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedArea])

  const handleLike = async (tik) => {
    try {
      const liked = await toggleLike(tik.id, user.id)
      setTiks((prev) =>
        prev.map((t) =>
          t.id === tik.id
            ? {
                ...t,
                likes: liked
                  ? [...(t.likes || []), { user_id: user.id }]
                  : (t.likes || []).filter((l) => l.user_id !== user.id),
              }
            : t
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Selecione a área</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">Municípios</option>
            <option>Sorocaba</option>
          </select>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400">
            <Search size={18} />
          </button>
        </div>

        {/* Stories row — mostra avatares dos autores únicos */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-4">
          <button className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full border-4 border-tik-orange flex items-center justify-center bg-white">
              <Plus size={20} className="text-tik-orange" />
            </div>
            <span className="text-xs text-gray-500 text-center w-14 truncate">Novo</span>
          </button>
          {[...new Map(tiks.map((t) => [t.user_id, t.profiles])).values()]
            .filter(Boolean)
            .slice(0, 6)
            .map((profile, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full border-4 border-tik-orange overflow-hidden bg-tik-orange flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-lg">{(profile.name || '?')[0]}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500 text-center w-14 truncate">{profile.name?.split(' ')[0]}</span>
              </div>
            ))}
        </div>

        {loading && <p className="text-center text-gray-400 text-sm">Carregando...</p>}

        {/* Feed */}
        <div className="flex flex-col gap-6">
          {tiks.map((tik) => {
            const profile = tik.profiles || {}
            const isLiked = (tik.likes || []).some((l) => l.user_id === user?.id)
            const likeCount = (tik.likes || []).length

            return (
              <div key={tik.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full border-2 border-tik-orange overflow-hidden bg-tik-orange flex items-center justify-center flex-shrink-0">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">{(profile.name || '?')[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{profile.name}</p>
                    <p className="text-xs text-gray-400">
                      {profile.secretaria}{profile.municipality ? ` · Prefeitura de ${profile.municipality}` : ''}
                    </p>
                  </div>
                </div>

                {/* Image */}
                {tik.image_url ? (
                  <div className="relative">
                    <img src={tik.image_url} alt={tik.area} className="w-full object-cover max-h-80" />
                    <button className="absolute top-2 right-2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                      <Search size={14} className="text-tik-orange" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-300 text-4xl">📷</span>
                  </div>
                )}

                {/* Body */}
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    {tik.area}{' '}
                    {tik.location && <span className="text-gray-400 font-normal">📍 {tik.location}</span>}
                  </p>

                  <button onClick={() => handleLike(tik)} className="flex items-center gap-1 mb-2">
                    <ThumbsUp
                      size={18}
                      className="text-tik-orange"
                      fill={isLiked ? '#E07B22' : 'none'}
                    />
                    <span className="text-sm text-tik-orange font-medium">Curtir</span>
                    {likeCount > 0 && <span className="text-xs text-gray-400 ml-1">({likeCount})</span>}
                  </button>

                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{profile.name}</span>{' '}
                    {tik.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Criado em {new Date(tik.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
