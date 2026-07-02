import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import TikCard from '../components/TikCard'
import TikDetailModal from '../components/TikDetailModal'
import { useAuth } from '../contexts/AuthContext'
import { getTiks } from '../services/tiks'

export default function MeusTiks() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tiks, setTiks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTik, setSelectedTik] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    getTiks({ userId: user.id })
      .then(setTiks)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.id])

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
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
          <p className="text-center text-sm text-gray-500 mb-2">
            Trabalha na Secretaria de {user.secretaria} da Prefeitura de {user.prefeitura || user.municipality}
          </p>
        )}
        <p className="text-center text-sm text-gray-600 font-semibold mb-6">
          {user?.firstName} enviou {tiks.length} tiks:
        </p>

        {loading && <p className="text-center text-gray-400 text-sm">Carregando tiks...</p>}

        <div className="flex flex-col gap-3">
          {tiks.map((tik) => (
            <TikCard key={tik.id} tik={tik} onView={setSelectedTik} />
          ))}
        </div>
      </div>

      <TikDetailModal tik={selectedTik} onClose={() => setSelectedTik(null)} />
    </Layout>
  )
}
