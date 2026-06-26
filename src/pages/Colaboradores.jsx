import Layout from '../components/Layout'
import { collaborators } from '../data/mockData'
import { UserPlus } from 'lucide-react'

export default function Colaboradores() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-700">Colaboradores</h1>
          <button className="btn-orange flex items-center gap-2 px-4 py-2 text-sm">
            <UserPlus size={16} />
            Adicionar colaborador
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          {collaborators.map((c, i) => (
            <div
              key={c.id}
              className={`flex items-center gap-4 px-5 py-4 ${i < collaborators.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <img
                src={c.avatar}
                alt={c.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{c.name}</p>
                <p className="text-sm text-gray-500">{c.role} · Prefeitura de Sorocaba</p>
              </div>
              <button className="text-sm text-tik-orange font-medium hover:underline">
                Ver perfil
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
