import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { getPublicTiks } from '../services/widget'
import { parseWidgetParams, buildMapUrl } from '../constants/widget'

// Widget público dos últimos tiks de uma prefeitura. Feito para rodar dentro
// de um iframe no site da prefeitura (ver public/embed.js e /incorporar-site).
// Não exige login e não usa Layout/Header do app.

const REFRESH_MS = 5 * 60 * 1000
const CAROUSEL_MS = 6000

const THEMES = {
  claro: { bg: '#ffffff', card: '#ffffff', border: '#e5e7eb', text: '#1f2937', muted: '#6b7280', soft: '#f3f4f6' },
  escuro: { bg: '#111827', card: '#1f2937', border: '#374151', text: '#f9fafb', muted: '#9ca3af', soft: '#374151' },
}

const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

function timeAgo(iso) {
  if (!iso) return ''
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const steps = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.35, 'week'],
    [12, 'month'],
    [Infinity, 'year'],
  ]
  let value = diff
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) return rtf.format(Math.round(value), unit)
    value /= size
  }
  return ''
}

function Photo({ tik, accent, className = '', style }) {
  if (tik.image_url) {
    return <img src={tik.image_url} alt={tik.area || 'Tik'} loading="lazy" className={`object-cover ${className}`} style={style} />
  }
  return (
    <div className={`flex items-center justify-center text-white font-bold text-xs ${className}`} style={{ backgroundColor: accent, ...style }}>
      TIK
    </div>
  )
}

function AreaTag({ tik, accent }) {
  if (!tik.area) return null
  return (
    <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: accent }}>
      {tik.area}
    </span>
  )
}

function Meta({ tik, t }) {
  return (
    <p className="text-xs flex items-center gap-1 min-w-0" style={{ color: t.muted }}>
      {tik.location && (
        <>
          <MapPin size={12} className="flex-shrink-0" />
          <span className="truncate">{tik.location}</span>
          <span>·</span>
        </>
      )}
      <span className="flex-shrink-0">{timeAgo(tik.created_at)}</span>
    </p>
  )
}

// Cada tik do widget leva ao mapa público da prefeitura com ele aberto. Abre
// em nova aba: o widget está num iframe dentro do site da prefeitura.
function TikLink({ tik, href, children, ...rest }) {
  return (
    <a href={href(tik)} target="_blank" rel="noopener noreferrer" title="Ver no mapa de entregas" {...rest}>
      {children}
    </a>
  )
}

// --- Layouts ---------------------------------------------------------------

function Grade({ tiks, accent, hrefFor }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {tiks.map((tik) => (
        <TikLink tik={tik} href={hrefFor} key={tik.id} className="block relative aspect-square rounded-lg overflow-hidden group text-left">
          <Photo tik={tik} accent={accent} className="w-full h-full transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/75 to-transparent">
            <p className="text-white text-xs font-semibold truncate">{tik.area}</p>
            <p className="text-white/80 text-[11px] truncate">{tik.location || timeAgo(tik.created_at)}</p>
          </div>
        </TikLink>
      ))}
    </div>
  )
}

function Lista({ tiks, accent, t, hrefFor }) {
  return (
    <div className="flex flex-col gap-2">
      {tiks.map((tik) => (
        <TikLink tik={tik} href={hrefFor}
          key={tik.id}
          className="flex items-center gap-3 p-2 rounded-lg border text-left transition-colors"
          style={{ backgroundColor: t.card, borderColor: t.border }}
        >
          <Photo tik={tik} accent={accent} className="w-16 h-16 rounded-md flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: t.text }}>{tik.area}</p>
            {tik.description && <p className="text-xs truncate" style={{ color: t.muted }}>{tik.description}</p>}
            <Meta tik={tik} t={t} />
          </div>
        </TikLink>
      ))}
    </div>
  )
}

function Mural({ tiks, accent, t, hrefFor }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {tiks.map((tik) => (
        <article
          key={tik.id}
          className="rounded-xl border overflow-hidden flex flex-col"
          style={{ backgroundColor: t.card, borderColor: t.border }}
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: accent }}>
              {tik.author_avatar ? (
                <img src={tik.author_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-bold">{(tik.secretaria || tik.author_name || '?')[0]}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: t.text }}>{tik.secretaria || tik.author_name}</p>
              <p className="text-[11px]" style={{ color: t.muted }}>{timeAgo(tik.created_at)}</p>
            </div>
          </div>
          <TikLink tik={tik} href={hrefFor} className="block">
            <Photo tik={tik} accent={accent} className="w-full aspect-[4/3]" />
          </TikLink>
          <div className="px-3 py-2 flex flex-col gap-1">
            <AreaTag tik={tik} accent={accent} />
            {tik.description && <p className="text-sm line-clamp-3" style={{ color: t.text }}>{tik.description}</p>}
            {tik.location && (
              <p className="text-xs flex items-center gap-1" style={{ color: t.muted }}>
                <MapPin size={12} /> <span className="truncate">{tik.location}</span>
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

function Faixa({ tiks, accent, t, hrefFor }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
      {tiks.map((tik) => (
        <TikLink tik={tik} href={hrefFor}
          key={tik.id}
          className="block flex-shrink-0 w-40 rounded-lg border overflow-hidden text-left snap-start"
          style={{ backgroundColor: t.card, borderColor: t.border }}
        >
          <Photo tik={tik} accent={accent} className="w-full h-28" />
          <div className="p-2">
            <p className="text-xs font-semibold truncate" style={{ color: t.text }}>{tik.area}</p>
            <p className="text-[11px] truncate" style={{ color: t.muted }}>{timeAgo(tik.created_at)}</p>
          </div>
        </TikLink>
      ))}
    </div>
  )
}

function Carrossel({ tiks, accent, t, hrefFor }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = tiks.length

  useEffect(() => {
    if (count < 2 || paused) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), CAROUSEL_MS)
    return () => clearInterval(id)
  }, [count, paused])

  useEffect(() => {
    if (index >= count) setIndex(0)
  }, [count, index])

  const tik = tiks[index] || tiks[0]
  if (!tik) return null
  const go = (d) => setIndex((i) => (i + d + count) % count)

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative rounded-xl overflow-hidden">
        <TikLink tik={tik} href={hrefFor} className="block w-full">
          <Photo tik={tik} accent={accent} className="w-full aspect-[16/9]" />
        </TikLink>
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
          <AreaTag tik={tik} accent={accent} />
          {tik.description && <p className="text-white text-sm mt-1 line-clamp-2">{tik.description}</p>}
          <p className="text-white/80 text-xs mt-1 flex items-center gap-1">
            {tik.location && <><MapPin size={12} /> <span className="truncate">{tik.location}</span> · </>}
            {timeAgo(tik.created_at)}
          </p>
        </div>
        {count > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Anterior" className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 flex items-center justify-center">
              <ChevronLeft size={18} style={{ color: accent }} />
            </button>
            <button onClick={() => go(1)} aria-label="Próximo" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 flex items-center justify-center">
              <ChevronRight size={18} style={{ color: accent }} />
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {tiks.map((x, i) => (
            <button
              key={x.id}
              onClick={() => setIndex(i)}
              aria-label={`Ir para o tik ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{ width: i === index ? 18 : 8, backgroundColor: i === index ? accent : t.soft }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const LAYOUT_COMPONENTS = { grade: Grade, lista: Lista, mural: Mural, faixa: Faixa, carrossel: Carrossel }

// --- Página ----------------------------------------------------------------

export default function Widget() {
  const [searchParams] = useSearchParams()
  const config = useMemo(() => parseWidgetParams(searchParams), [searchParams])
  const { municipality, state, area, limit, layout, theme, color, header, widgetId } = config
  const accent = `#${color}`
  const t = THEMES[theme]

  const [tiks, setTiks] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const rootRef = useRef(null)

  const load = useCallback(() => {
    if (!municipality || !state) {
      setStatus('error')
      return
    }
    getPublicTiks({ municipality, state, area, limit })
      .then((data) => {
        setTiks(data)
        setStatus('ready')
      })
      .catch((err) => {
        console.error('Widget: falha ao carregar tiks', err)
        setStatus((s) => (s === 'ready' ? s : 'error'))
      })
  }, [municipality, state, area, limit])

  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  // Fundo da página do iframe acompanha o tema do widget.
  useEffect(() => {
    const prev = document.body.style.backgroundColor
    document.body.style.backgroundColor = t.bg
    return () => { document.body.style.backgroundColor = prev }
  }, [t.bg])

  // Avisa a página que incorporou (embed.js) a altura do conteúdo, para o
  // iframe crescer junto e não aparecer barra de rolagem dupla.
  useEffect(() => {
    const el = rootRef.current
    if (!el || window.parent === window) return
    const send = () => {
      window.parent.postMessage({ type: 'tik-widget:height', id: widgetId, height: Math.ceil(el.scrollHeight) }, '*')
    }
    send()
    const ro = new ResizeObserver(send)
    ro.observe(el)
    return () => ro.disconnect()
  }, [widgetId])

  const Layout = LAYOUT_COMPONENTS[layout]
  const origin = window.location.origin
  const hrefFor = (tik) => buildMapUrl(origin, { municipality, state, tikId: tik.id })

  return (
    <div ref={rootRef} className="p-3" style={{ backgroundColor: t.bg, color: t.text, minHeight: 0 }}>
      {header && (
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="min-w-0">
            <p className="text-base font-bold truncate" style={{ color: t.text }}>Últimas entregas</p>
            {municipality && (
              <p className="text-xs truncate" style={{ color: t.muted }}>
                Prefeitura de {municipality}{area ? ` · ${area}` : ''}
              </p>
            )}
          </div>
          <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-md text-white" style={{ backgroundColor: accent }}>
            TIK
          </span>
        </div>
      )}

      {status === 'loading' && (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg animate-pulse" style={{ backgroundColor: t.soft }} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <p className="text-sm text-center py-6" style={{ color: t.muted }}>
          {municipality && state ? 'Não foi possível carregar os tiks agora.' : 'Widget sem município configurado.'}
        </p>
      )}

      {status === 'ready' && tiks.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: t.muted }}>Nenhum tik publicado ainda.</p>
      )}

      {status === 'ready' && tiks.length > 0 && <Layout tiks={tiks} accent={accent} t={t} hrefFor={hrefFor} />}

      <p className="text-[10px] text-right mt-2" style={{ color: t.muted }}>
        Feito com{' '}
        <a href={buildMapUrl(origin, { municipality, state })} target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ color: accent }}>
          TIK
        </a>
      </p>

    </div>
  )
}
