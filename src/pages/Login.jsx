import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UFS, SECRETARIAS } from '../constants/locations'
import { getMunicipios } from '../services/ibge'
import logo from '../assets/logo.jpeg'

const EMPTY_SIGNUP = {
  secretaria: '',
  state: '',
  municipality: '',
  phone: '',
  cpf: '',
  birthdate: '',
  gender: '',
  cep: '',
}

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signup, setSignup] = useState(EMPTY_SIGNUP)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [municipios, setMunicipios] = useState([])
  const [loadingMunicipios, setLoadingMunicipios] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const isSignup = mode === 'signup'

  const handleSignupChange = (field, value) => setSignup((s) => ({ ...s, [field]: value }))

  const handleStateChange = (uf) => setSignup((s) => ({ ...s, state: uf, municipality: '' }))

  useEffect(() => {
    if (!signup.state) {
      setMunicipios([])
      return
    }
    setLoadingMunicipios(true)
    getMunicipios(signup.state)
      .then(setMunicipios)
      .catch(() => setError('Não foi possível carregar os municípios. Tente novamente.'))
      .finally(() => setLoadingMunicipios(false))
  }, [signup.state])

  const toggleMode = () => {
    setMode(isSignup ? 'login' : 'signup')
    setError('')
    setInfo('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (isSignup) {
        const data = await register(email, password, name, {
          ...signup,
          birthdate: signup.birthdate || null,
        })
        if (data.session) {
          navigate('/')
        } else {
          setInfo('Conta criada! Verifique seu email para confirmar o cadastro antes de entrar.')
          setMode('login')
          setPassword('')
          setSignup(EMPTY_SIGNUP)
        }
      } else {
        await login(email, password)
        navigate('/')
      }
    } catch (err) {
      setError(isSignup ? (err.message || 'Não foi possível criar a conta.') : 'Email ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className={`bg-white rounded-2xl shadow-lg w-full p-8 ${isSignup ? 'max-w-xl' : 'max-w-sm'}`}>
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <TikLogo size="lg" />
        </div>

        <h1 className="text-center text-lg font-semibold text-gray-600 mb-6">
          {isSignup ? 'Criar conta' : 'Entrar na plataforma'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-tik-orange"
                placeholder="Seu nome completo"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-tik-orange"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-tik-orange"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {isSignup && (
            <>
              {/* Onde trabalho */}
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #E07B22' }}>
                <div className="px-4 py-2" style={{ backgroundColor: '#E07B22' }}>
                  <p className="text-white text-sm font-semibold">Onde trabalho</p>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Secretaria</label>
                    <select
                      value={signup.secretaria}
                      onChange={(e) => handleSignupChange('secretaria', e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="">Selecione a secretaria</option>
                      {SECRETARIAS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-28">
                      <label className="block text-xs font-medium text-gray-600 mb-1">UF:</label>
                      <select
                        value={signup.state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        required
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                      >
                        <option value="">UF</option>
                        {UFS.map((uf) => (
                          <option key={uf.sigla} value={uf.sigla}>{uf.sigla}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Prefeitura do Município de:</label>
                      <select
                        value={signup.municipality}
                        onChange={(e) => handleSignupChange('municipality', e.target.value)}
                        disabled={!signup.state || loadingMunicipios}
                        required
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">
                          {!signup.state ? 'Selecione a UF primeiro' : loadingMunicipios ? 'Carregando...' : 'Selecione o município'}
                        </option>
                        {municipios.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Telefone</label>
                <input
                  type="text"
                  value={signup.phone}
                  onChange={(e) => handleSignupChange('phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-tik-orange"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">CPF</label>
                <input
                  type="text"
                  value={signup.cpf}
                  onChange={(e) => handleSignupChange('cpf', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-tik-orange"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={signup.birthdate}
                    onChange={(e) => handleSignupChange('birthdate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-tik-orange"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Gênero</label>
                  <select
                    value={signup.gender}
                    onChange={(e) => handleSignupChange('gender', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-tik-orange"
                  >
                    <option value="">Selecione o gênero</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="O">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-tik-orange mb-1">Meu endereço</p>
                <label className="block text-sm text-gray-600 mb-1">CEP</label>
                <input
                  type="text"
                  value={signup.cep}
                  onChange={(e) => handleSignupChange('cep', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-tik-orange"
                  placeholder="00000-000"
                />
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          {info && <p className="text-green-600 text-xs text-center">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-orange w-full py-3 text-sm disabled:opacity-60"
          >
            {loading ? (isSignup ? 'Criando conta...' : 'Entrando...') : (isSignup ? 'Criar conta' : 'Entrar')}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          {isSignup ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
          <button type="button" onClick={toggleMode} className="text-tik-orange font-medium hover:underline">
            {isSignup ? 'Entrar' : 'Criar conta'}
          </button>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          Plataforma de gestão pública municipal
        </p>
      </div>
    </div>
  )
}

function TikLogo({ size = 'md' }) {
  const cls = size === 'lg' ? 'h-12' : 'h-8'
  return <img src={logo} alt="Tik" className={`${cls} w-auto select-none`} />
}
