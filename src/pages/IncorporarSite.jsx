import { useEffect, useMemo, useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { areas } from '../data/mockData'
import {
  WIDGET_LAYOUTS, WIDGET_DEFAULTS, WIDGET_LIMIT_MAX, buildWidgetUrl, buildMapUrl, widgetParamEntries,
} from '../constants/widget'

// Desenhos esquemáticos de cada layout, só para o seletor.
function LayoutSketch({ id, active }) {
  const c = active ? '#E07B22' : '#d1d5db'
  const box = (props) => <rect rx="2" fill={c} {...props} />
  return (
    <svg viewBox="0 0 60 40" className="w-full h-12">
      {id === 'grade' && [0, 1, 2].flatMap((col) => [0, 1].map((row) => box({ key: `${col}${row}`, x: 4 + col * 18, y: 3 + row * 18, width: 16, height: 16 })))}
      {id === 'carrossel' && (
        <>
          {box({ x: 6, y: 3, width: 48, height: 28 })}
          <circle cx="24" cy="36" r="2" fill={c} /><circle cx="30" cy="36" r="2" fill={c} opacity=".5" /><circle cx="36" cy="36" r="2" fill={c} opacity=".5" />
        </>
      )}
      {id === 'lista' && [0, 1, 2].map((r) => (
        <g key={r}>{box({ x: 4, y: 3 + r * 12, width: 10, height: 10 })}{box({ x: 17, y: 5 + r * 12, width: 38, height: 3 })}{box({ x: 17, y: 10 + r * 12, width: 24, height: 2, opacity: 0.6 })}</g>
      ))}
      {id === 'mural' && [0, 1].map((col) => (
        <g key={col}>{box({ x: 5 + col * 26, y: 3, width: 24, height: 22 })}{box({ x: 5 + col * 26, y: 28, width: 20, height: 3, opacity: 0.6 })}{box({ x: 5 + col * 26, y: 33, width: 14, height: 3, opacity: 0.6 })}</g>
      ))}
      {id === 'faixa' && [0, 1, 2, 3].map((i) => box({ key: i, x: 2 + i * 16, y: 10, width: 14, height: 20, opacity: i === 3 ? 0.5 : 1 }))}
    </svg>
  )
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Código copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
    }
  }
  return (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-4 pr-24 overflow-x-auto whitespace-pre-wrap break-all">{code}</pre>
      <button onClick={copy} className="absolute top-2 right-2 flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-md">
        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

const escapeAttr = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;')

export default function IncorporarSite() {
  const { user } = useAuth()
  const isSuperAdmin = !!user?.super_admin
  const origin = window.location.origin

  const [municipality, setMunicipality] = useState(user?.municipality || '')
  const [state, setState] = useState(user?.state || '')
  const [layout, setLayout] = useState(WIDGET_DEFAULTS.layout)
  const [limit, setLimit] = useState(WIDGET_DEFAULTS.limit)
  const [area, setArea] = useState(WIDGET_DEFAULTS.area)
  const [theme, setTheme] = useState(WIDGET_DEFAULTS.theme)
  const [color, setColor] = useState(`#${WIDGET_DEFAULTS.color}`)
  const [header, setHeader] = useState(WIDGET_DEFAULTS.header)
  const [tab, setTab] = useState('script')
  const [iframeHeight, setIframeHeight] = useState(480)

  const config = useMemo(() => ({
    municipality: municipality.trim(),
    state: state.trim().toUpperCase(),
    layout,
    limit,
    area,
    theme,
    color: color.replace('#', ''),
    header,
  }), [municipality, state, layout, limit, area, theme, color, header])

  const ready = !!(config.municipality && config.state)
  const widgetUrl = buildWidgetUrl(origin, config)

  const scriptCode = useMemo(() => {
    const attrs = widgetParamEntries(config).map(([k, v]) => `data-${k}="${escapeAttr(v)}"`).join(' ')
    return `<div data-tik-widget ${attrs}></div>\n<script src="${origin}/embed.js" async></script>`
  }, [config, origin])

  const iframeCode = `<iframe src="${escapeAttr(widgetUrl)}" title="Últimas entregas da prefeitura" style="width:100%;height:${iframeHeight}px;border:0;" loading="lazy"></iframe>`

  // Pré-visualização com altura automática, igual ao embed.js faz no site.
  const [previewHeight, setPreviewHeight] = useState(420)
  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== origin || e.data?.type !== 'tik-widget:height' || e.data.id !== 'preview') return
      setPreviewHeight(e.data.height)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [origin])

  const label = 'block text-xs font-semibold text-gray-600 mb-1'
  const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white'

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-800">Incorporar no site da prefeitura</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Mostre os últimos tiks da sua prefeitura no site oficial. Escolha o formato, copie o código e cole no HTML da página.
          Ao clicar num tik, o visitante abre o mapa de entregas da prefeitura (sem precisar de login) com aquele tik em destaque.
        </p>
        {user?.municipality && user?.state && (
          <a
            href={buildMapUrl(window.location.origin, { municipality: user.municipality, state: user.state })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-tik-orange -mt-4 mb-6"
          >
            Ver o mapa público da prefeitura <ExternalLink size={12} />
          </a>
        )}

        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          {/* Configuração */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4 h-fit">
            <div className="grid grid-cols-[1fr_80px] gap-2">
              <div>
                <label className={label}>Município</label>
                <input className={input} value={municipality} onChange={(e) => setMunicipality(e.target.value)} disabled={!isSuperAdmin} />
              </div>
              <div>
                <label className={label}>UF</label>
                <input className={input} value={state} maxLength={2} onChange={(e) => setState(e.target.value)} disabled={!isSuperAdmin} />
              </div>
            </div>

            <div>
              <span className={label}>Formato de exibição</span>
              <div className="grid grid-cols-3 gap-2">
                {WIDGET_LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayout(l.id)}
                    title={l.description}
                    className={`rounded-lg border-2 p-2 text-xs font-semibold transition-colors ${
                      layout === l.id ? 'border-tik-orange text-tik-orange bg-orange-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <LayoutSketch id={l.id} active={layout === l.id} />
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{WIDGET_LAYOUTS.find((l) => l.id === layout)?.description}</p>
            </div>

            <div>
              <label className={label}>Quantidade de tiks: {limit}</label>
              <input type="range" min={1} max={WIDGET_LIMIT_MAX} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-full accent-tik-orange" />
            </div>

            <div>
              <label className={label}>Área</label>
              <select className={input} value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Todas as áreas</option>
                {areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={label}>Tema</label>
                <select className={input} value={theme} onChange={(e) => setTheme(e.target.value)}>
                  <option value="claro">Claro</option>
                  <option value="escuro">Escuro</option>
                </select>
              </div>
              <div>
                <label className={label}>Cor de destaque</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-[38px] border border-gray-300 rounded-lg bg-white px-1" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} className="accent-tik-orange" />
              Mostrar título "Últimas entregas"
            </label>
          </div>

          {/* Pré-visualização + código */}
          <div className="flex flex-col gap-6 min-w-0">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-700">Pré-visualização</h2>
                {ready && (
                  <a href={widgetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-tik-orange flex items-center gap-1">
                    Abrir em nova aba <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3">
                {ready ? (
                  <iframe
                    key={widgetUrl}
                    src={`${widgetUrl}&wid=preview`}
                    title="Pré-visualização do widget"
                    className="w-full border-0 block rounded-lg"
                    style={{ height: previewHeight }}
                  />
                ) : (
                  <p className="text-sm text-gray-500 text-center py-10">
                    Seu perfil não tem município/UF. Atualize em "Editar meu perfil" para gerar o widget.
                  </p>
                )}
              </div>
            </div>

            {ready && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Código para o site</h2>
                <div className="flex gap-1 mb-2">
                  {[
                    { id: 'script', label: 'Script (recomendado)' },
                    { id: 'iframe', label: 'Iframe' },
                  ].map((tb) => (
                    <button
                      key={tb.id}
                      onClick={() => setTab(tb.id)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold ${tab === tb.id ? 'bg-tik-orange text-white' : 'bg-white border border-gray-300 text-gray-600'}`}
                    >
                      {tb.label}
                    </button>
                  ))}
                </div>

                {tab === 'script' ? (
                  <>
                    <CodeBlock code={scriptCode} />
                    <p className="text-xs text-gray-500 mt-2">
                      Cole onde o widget deve aparecer. A altura se ajusta sozinha ao conteúdo e os tiks se atualizam automaticamente.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-xs font-semibold text-gray-600">Altura (px)</label>
                      <input type="number" min={150} max={2000} value={iframeHeight} onChange={(e) => setIframeHeight(Number(e.target.value) || 480)} className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm" />
                    </div>
                    <CodeBlock code={iframeCode} />
                    <p className="text-xs text-gray-500 mt-2">
                      Use quando o site não permite scripts (alguns CMS de prefeitura). A altura é fixa.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
