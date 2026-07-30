import { useState, useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { uploadAvatar } from '../services/profiles'
import { UFS, SECRETARIAS } from '../constants/locations'
import { getMunicipios } from '../services/ibge'

export default function EditarPerfil() {
  const { user, updateUser, changePassword, changeEmail, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: user?.name || '',
    secretaria: user?.secretaria || '',
    municipality: user?.municipality || '',
    state: user?.state || '',
    phone: user?.phone || '',
    cpf: user?.cpf || '',
    birthdate: user?.birthdate || '',
    gender: user?.gender || '',
    cep: user?.cep || '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null)
  const [saving, setSaving] = useState(false)
  const [municipios, setMunicipios] = useState([])
  const [loadingMunicipios, setLoadingMunicipios] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(true)

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [changingPassword, setChangingPassword] = useState(false)

  const [emailForm, setEmailForm] = useState({ currentPassword: '', newEmail: '' })
  const [changingEmail, setChangingEmail] = useState(false)

  const [deleting, setDeleting] = useState(false)

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleStateChange = (uf) => setForm((f) => ({ ...f, state: uf, municipality: '' }))

  useEffect(() => {
    if (!form.state) {
      setMunicipios([])
      return
    }
    setLoadingMunicipios(true)
    getMunicipios(form.state)
      .then(setMunicipios)
      .catch(() => toast.error('Não foi possível carregar os municípios. Tente novamente.'))
      .finally(() => setLoadingMunicipios(false))
  }, [form.state])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!agreedToTerms) {
      toast.error('Você precisa concordar com os Termos de Uso e Política de Privacidade.')
      return
    }
    setSaving(true)
    try {
      let avatar_url = user?.avatar_url
      if (avatarFile) {
        avatar_url = await uploadAvatar(user.id, avatarFile)
      }
      await updateUser({ ...form, birthdate: form.birthdate || null, avatar_url })
      toast.success('Perfil atualizado!')
      navigate('/meus-tiks')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Erro ao salvar o perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos de senha.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('A confirmação de senha não confere.')
      return
    }
    setChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      toast.success('Senha redefinida com sucesso!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Erro ao redefinir a senha')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleChangeEmail = async () => {
    const { currentPassword, newEmail } = emailForm
    if (!currentPassword || !newEmail) {
      toast.error('Preencha a senha atual e o novo email.')
      return
    }
    setChangingEmail(true)
    try {
      await changeEmail(currentPassword, newEmail)
      toast.success('Email atualizado! Confirme o novo endereço para concluir a alteração.')
      setEmailForm({ currentPassword: '', newEmail: '' })
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Erro ao alterar o email')
    } finally {
      setChangingEmail(false)
    }
  }

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm('Tem certeza que deseja apagar seu perfil? Esta ação não pode ser desfeita.')
    if (!confirmed) return
    setDeleting(true)
    try {
      await deleteAccount()
      toast.success('Perfil apagado.')
      navigate('/login')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Erro ao apagar o perfil')
      setDeleting(false)
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
                <select value={form.secretaria} onChange={(e) => handleChange('secretaria', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Selecione a secretaria</option>
                  {SECRETARIAS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="w-28">
                  <label className="block text-xs font-medium text-gray-600 mb-1">UF:</label>
                  <select value={form.state} onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">UF</option>
                    {UFS.map((uf) => (
                      <option key={uf.sigla} value={uf.sigla}>{uf.sigla}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Prefeitura do Município de:</label>
                  <select value={form.municipality} onChange={(e) => handleChange('municipality', e.target.value)}
                    disabled={!form.state || loadingMunicipios}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400">
                    <option value="">
                      {!form.state ? 'Selecione a UF primeiro' : loadingMunicipios ? 'Carregando...' : 'Selecione o município'}
                    </option>
                    {form.municipality && !municipios.includes(form.municipality) && (
                      <option value={form.municipality}>{form.municipality}</option>
                    )}
                    {municipios.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
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

          <label className="flex items-center gap-2 mb-6 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-4 h-4 accent-tik-orange"
            />
            Eu concordo com os{' '}
            <Link to="/documentos-legais" className="text-tik-orange hover:underline">
              Termos de Uso e Política de Privacidade
            </Link>
            .
          </label>

          <div className="flex justify-center mb-8">
            <button onClick={handleSave} disabled={saving} className="btn-orange px-12 py-2.5 disabled:opacity-60">
              {saving ? 'ATUALIZANDO...' : 'ATUALIZAR PERFIL'}
            </button>
          </div>

          {/* ---------------- Configuração ---------------- */}
          <h2 className="text-base font-bold text-tik-orange mb-4">Configuração</h2>

          <p className="text-sm text-gray-500 mb-2">Redefinir senha:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Senha atual:</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nova senha:</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Confirmar nova senha:</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-center mb-8">
            <button onClick={handleChangePassword} disabled={changingPassword} className="btn-outline-danger">
              {changingPassword ? 'REDEFININDO...' : 'REDEFINIR SENHA'}
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-2">Redefinir email:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email atual:</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Senha atual:</label>
              <input
                type="password"
                value={emailForm.currentPassword}
                onChange={(e) => setEmailForm((f) => ({ ...f, currentPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Novo email:</label>
              <input
                type="email"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm((f) => ({ ...f, newEmail: e.target.value }))}
                placeholder="Digite o novo email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-center mb-8">
            <button onClick={handleChangeEmail} disabled={changingEmail} className="btn-outline-danger">
              {changingEmail ? 'ALTERANDO...' : 'ALTERAR EMAIL'}
            </button>
          </div>

          <div className="flex justify-center">
            <button onClick={handleDeleteProfile} disabled={deleting} className="btn-outline-danger">
              {deleting ? 'APAGANDO...' : 'APAGAR PERFIL'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
