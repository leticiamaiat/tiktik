import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { uploadAvatar } from '../services/profiles'

export default function EditarPerfil() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: user?.name || '',
    secretaria: user?.secretaria || '',
    prefeitura: user?.prefeitura || '',
    uf: user?.uf || '',
    phone: user?.phone || '',
    cpf: user?.cpf || '',
    birthdate: user?.birthdate || '',
    gender: user?.gender || '',
    cep: user?.cep || '',
    municipality: user?.municipality || '',
    state: user?.state || '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null)
  const [saving, setSaving] = useState(false)

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let avatar_url = user?.avatar_url
      if (avatarFile) {
        avatar_url = await uploadAvatar(user.id, avatarFile)
      }
      await updateUser({ ...form, avatar_url })
      navigate('/meus-tiks')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
          <button onClick={() => navigate(-1)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <ChevronLeft size={22} />
          </button>

          <h2 className="text-lg font-semibold text-gray-700 mb-6">Meu perfil</h2>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <label className="cursor-pointer">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-gray-200 shadow mb-2 bg-tik-orange flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-4xl font-bold">{(form.name || user?.email || '?')[0].toUpperCase()}</span>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
            <p className="text-xs text-gray-400">Clique na foto acima para alterá-la.</p>
          </div>

          {/* Nome */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Meu nome:</label>
            <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Onde trabalho */}
          <div className="mb-4 rounded-lg overflow-hidden" style={{ border: '1px solid #E07B22' }}>
            <div className="px-4 py-2" style={{ backgroundColor: '#E07B22' }}>
              <p className="text-white text-sm font-semibold">Onde trabalho</p>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Secretaria</label>
                <input type="text" value={form.secretaria} onChange={(e) => handleChange('secretaria', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Prefeitura do Município de:</label>
                  <input type="text" value={form.prefeitura} onChange={(e) => handleChange('prefeitura', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-600 mb-1">UF:</label>
                  <input type="text" value={form.uf} onChange={(e) => handleChange('uf', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" maxLength={2} />
                </div>
              </div>
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Email:</label>
            <input type="email" value={user?.email || ''} readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400" />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Telefone:</label>
            <input type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">CPF:</label>
            <input type="text" value={form.cpf} onChange={(e) => handleChange('cpf', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Data de Nascimento:</label>
              <input type="date" value={form.birthdate} onChange={(e) => handleChange('birthdate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Gênero:</label>
              <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Selecione o gênero</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>
          </div>

          {/* Endereço */}
          <p className="text-sm font-semibold text-tik-orange mb-3">Meu endereço</p>
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">CEP:</label>
            <input type="text" value={form.cep} onChange={(e) => handleChange('cep', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="00000-000" />
          </div>

          <div className="flex justify-center mt-6">
            <button onClick={handleSave} disabled={saving} className="btn-orange px-12 py-2.5 disabled:opacity-60">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
