import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { listProfiles } from '../services/profiles'
import { listMunicipalities, setMunicipalityAdmin, setMunicipalityPlan } from '../services/plans'
import { PLAN_NAMES, planLimits } from '../constants/plans'

export default function Municipios() {
  const { user } = useAuth()
  const isSuperAdmin = !!user?.super_admin

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Município (chave "municipality|state") cujo seletor de admin está aberto.
  const [pickerFor, setPickerFor] = useState(null)
  const [pickerProfiles, setPickerProfiles] = useState([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [savingAdminFor, setSavingAdminFor] = useState(null)

  const load = useCallback(() => {
    if (!isSuperAdmin) {
      setLoading(false)
      return
    }
    setLoading(true)
    listMunicipalities()
      .then(setRows)
      .catch((err) => {
        console.error(err)
        toast.error('Erro ao carregar municípios')
      })
      .finally(() => setLoading(false))
  }, [isSuperAdmin])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.municipality?.toLowerCase().includes(q) ||
        r.state?.toLowerCase().includes(q)
    )
  }, [rows, search])

  const rowKey = (r) => `${r.municipality}|${r.state}`

  const handlePlanChange = async (r, plan) => {
    const prev = r.plan
    setRows((list) => list.map((x) => (rowKey(x) === rowKey(r) ? { ...x, plan } : x)))
    try {
      await setMunicipalityPlan(r.municipality, r.state, plan, user.id)
      toast.success(`Plano de ${r.municipality} atualizado para ${plan}`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar plano')
      setRows((list) => list.map((x) => (rowKey(x) === rowKey(r) ? { ...x, plan: prev } : x)))
    }
  }

  const openPicker = async (r) => {
    const key = rowKey(r)
    if (pickerFor === key) {
      setPickerFor(null)
      return
    }
    setPickerFor(key)
    setPickerProfiles([])
    setPickerLoading(true)
    try {
      const list = await listProfiles({ municipality: r.municipality })
      setPickerProfiles(list.filter((p) => p.state === r.state))
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar colaboradores')
    } finally {
      setPickerLoading(false)
    }
  }

  const handlePickAdmin = async (r, profileId) => {
    if (!profileId) return
    setSavingAdminFor(rowKey(r))
    try {
      await setMunicipalityAdmin(profileId)
      toast.success('Admin do município definido')
      setPickerFor(null)
      load()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao definir admin')
    } finally {
      setSavingAdminFor(null)
    }
  }

  if (!isSuperAdmin) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-sm text-gray-500">
            Apenas o super admin pode gerenciar os municípios.
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-sm text-gray-500 mb-1">
          <span className="font-bold text-gray-700">{filtered.length}</span> Municípios cadastrados
        </h1>
        <p className="text-xs text-gray-400 mb-4">
          Defina o plano e o administrador de cada prefeitura.
        </p>

        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquise por município ou UF..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => setSearch('')}
            className="w-9 h-9 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-300 transition-colors flex-shrink-0"
            title="Limpar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="flex items-center bg-tik-orange text-white text-sm font-semibold px-5 py-2">
            <div className="flex-1">Município</div>
            <div className="w-44 flex-shrink-0">Plano</div>
            <div className="w-28 flex-shrink-0 text-center">Usuários</div>
            <div className="w-72 flex-shrink-0">Administrador</div>
          </div>

          {loading && <p className="text-center text-gray-400 text-sm py-8">Carregando municípios...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Nenhum município encontrado.</p>
          )}

          {filtered.map((r, i) => {
            const key = rowKey(r)
            const max = planLimits(r.plan).maxUsers
            const overLimit = r.user_count > max
            const isPickerOpen = pickerFor === key
            const savingAdmin = savingAdminFor === key

            return (
              <div
                key={key}
                className={`px-5 py-3 ${i < filtered.length - 1 ? 'border-b border-gray-100' : ''} ${i % 2 === 1 ? 'bg-gray-50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {r.municipality}
                      <span className="text-gray-400 font-normal"> · {r.state}</span>
                    </p>
                  </div>

                  <div className="w-44 flex-shrink-0">
                    <select
                      value={r.plan}
                      onChange={(e) => handlePlanChange(r, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
                    >
                      {PLAN_NAMES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28 flex-shrink-0 text-center text-sm">
                    <span className={overLimit ? 'text-red-500 font-bold' : 'text-gray-600'}>
                      {r.user_count} / {max}
                    </span>
                  </div>

                  <div className="w-72 flex-shrink-0 flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      {r.admin_name ? (
                        <p className="text-sm text-gray-700 truncate flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-tik-orange flex-shrink-0" />
                          {r.admin_name}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">sem admin</p>
                      )}
                    </div>
                    <button
                      onClick={() => openPicker(r)}
                      className="text-xs font-semibold text-tik-orange hover:text-tik-dark whitespace-nowrap flex-shrink-0"
                    >
                      {isPickerOpen ? 'Fechar' : r.admin_name ? 'Trocar' : 'Definir'}
                    </button>
                  </div>
                </div>

                {isPickerOpen && (
                  <div className="mt-3 pl-1 pt-3 border-t border-gray-100">
                    {pickerLoading && <p className="text-xs text-gray-400">Carregando colaboradores...</p>}
                    {!pickerLoading && pickerProfiles.length === 0 && (
                      <p className="text-xs text-gray-400">Nenhum colaborador neste município.</p>
                    )}
                    {!pickerLoading && pickerProfiles.length > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue=""
                          disabled={savingAdmin}
                          onChange={(e) => handlePickAdmin(r, e.target.value)}
                          className="flex-1 max-w-md border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
                        >
                          <option value="" disabled>Selecione o novo administrador...</option>
                          {pickerProfiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name || 'Sem nome'}{p.is_admin ? ' (admin atual)' : ''} — {p.secretaria || p.empresa_parceira || '—'}
                            </option>
                          ))}
                        </select>
                        {savingAdmin && <span className="text-xs text-gray-400">Salvando...</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
