import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const isSignup = mode === 'signup'

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
        const data = await register(email, password, name)
        if (data.session) {
          navigate('/')
        } else {
          setInfo('Conta criada! Verifique seu email para confirmar o cadastro antes de entrar.')
          setMode('login')
          setPassword('')
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
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
  const cls = size === 'lg' ? 'text-4xl' : 'text-2xl'
  return (
    <span className={`${cls} font-black tracking-tight select-none`}>
      <span className="text-gray-800">ti</span>
      <span className="relative inline-block text-gray-800">
        k
        <span
          className="absolute -top-1 left-0 text-tik-orange font-black"
          style={{ transform: 'rotate(-15deg)', fontSize: '1.1em' }}
        >✕</span>
      </span>
    </span>
  )
}
