import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile, updateProfile, createProfile } from '../services/profiles'
import { signIn, signOut, signUp } from '../services/auth'

const AuthContext = createContext(null)

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
      setUser({
        id: authUser.id,
        email: authUser.email,
        ...profile,
        firstName: (profile.name || authUser.email).split(' ')[0],
      })
    } catch {
      setUser({ id: authUser.id, email: authUser.email, firstName: authUser.email.split('@')[0] })
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const data = await signIn(email, password)
    return data
  }

  const register = async (email, password, name) => {
    const data = await signUp(email, password, name)
    if (data.user) {
      await createProfile(data.user.id, { name, email })
    }
    if (data.session) {
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
    setUser((prev) => ({ ...prev, ...updated, firstName: (updated.name || prev.name || '').split(' ')[0] }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
