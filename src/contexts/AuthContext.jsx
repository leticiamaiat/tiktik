import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile, updateProfile, createProfile, deleteProfile } from '../services/profiles'
import { getMunicipalityPlan } from '../services/plans'
import { DEFAULT_PLAN, planLimits } from '../constants/plans'
import { signIn, signOut, signUp, updatePassword, updateEmail } from '../services/auth'

const AuthContext = createContext(null)

// Anexa ao usuário o plano da prefeitura dele (municipalities) e os limites
// correspondentes. Resiliente: qualquer falha cai no plano padrão.
async function withPlan(base) {
  let plan = DEFAULT_PLAN
  try {
    plan = await getMunicipalityPlan(base.municipality, base.state)
  } catch (err) {
    console.error('getMunicipalityPlan falhou, usando plano padrão:', err)
  }
  return { ...base, plan, planLimits: planLimits(plan) }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user)
      else { setUser(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(authUser) {
    try {
      const profile = await getProfile(authUser.id)
      setUser(await withPlan({
        id: authUser.id,
        email: authUser.email,
        ...profile,
        firstName: (profile.name || authUser.email).split(' ')[0],
      }))
    } catch (err) {
      console.error('getProfile falhou, tentando criar/recuperar perfil:', err)
      // Sem confirmação de email o cadastro não pôde criar o perfil ainda
      // (RLS exige uma sessão autenticada). Agora que há sessão, cria aqui
      // usando os dados salvos no metadata do usuário durante o signUp.
      try {
        const { name, email, ...extra } = authUser.user_metadata || {}
        const profile = await createProfile(authUser.id, { name, ...extra })
        setUser(await withPlan({
          id: authUser.id,
          email: authUser.email,
          ...profile,
          firstName: (profile.name || authUser.email).split(' ')[0],
        }))
      } catch (err2) {
        console.error('createProfile também falhou, perfil ficará incompleto (sem municipality/state):', err2)
        setUser({ id: authUser.id, email: authUser.email, firstName: authUser.email.split('@')[0] })
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const data = await signIn(email, password)
    return data
  }

  const register = async (email, password, name, extra = {}) => {
    const data = await signUp(email, password, name, extra)
    if (data.session) {
      await createProfile(data.user.id, { name, ...extra })
      await loadProfile(data.user)
    }
    return data
  }

  const logout = async () => {
    await signOut()
    setUser(null)
  }

  const updateUser = async (updates) => {
    if (!user?.id) return
    const updated = await updateProfile(user.id, updates)
    const merged = { ...user, ...updated, firstName: (updated.name || user.name || '').split(' ')[0] }
    // Mudou de município/estado? O plano pode ter mudado junto.
    if ('municipality' in updates || 'state' in updates) {
      setUser(await withPlan(merged))
    } else {
      setUser(merged)
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    if (!user?.email) return
    await updatePassword(user.email, currentPassword, newPassword)
  }

  const changeEmail = async (currentPassword, newEmail) => {
    if (!user?.email) return
    await updateEmail(user.email, currentPassword, newEmail)
  }

  const deleteAccount = async () => {
    if (!user?.id) return
    await deleteProfile(user.id)
    await logout()
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser, changePassword, changeEmail, deleteAccount }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
