import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TikDetailModal({ tik, onClose }) {
  const navigate = useNavigate()
  if (!tik) return null

  const profile = tik.profiles || {}
  const likeCount = (tik.likes || []).length
  const createdAt = tik.created_at ? new Date(tik.created_at) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white bg-tik-orange z-10"
        >
          <X size={16} />
        </button>

        {tik.image_url ? (
          <img src={tik.image_url} alt={tik.area} className="w-full max-h-72 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
            <span className="text-gray-300 text-4xl">📷</span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
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

          <p className="text-sm font-semibold text-tik-orange mb-1">{tik.area}</p>
          {tik.location && (
            <p className="text-xs text-gray-400 mb-2">📍 {tik.location}</p>
          )}
          {tik.description && (
            <p className="text-sm text-gray-700 mb-3">{tik.description}</p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
            <span>{likeCount} curtida{likeCount === 1 ? '' : 's'}</span>
            {createdAt && (
              <span>
                {createdAt.toLocaleDateString('pt-BR')}, {createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <button
            onClick={() => navigate(`/tik/${tik.id}`)}
            className="w-full btn-orange text-sm py-2"
          >
            Ver página do tik
          </button>
        </div>
      </div>
    </div>
  )
}
