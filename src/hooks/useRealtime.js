import { useEffect, useRef } from 'react'

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

// Serverdan real vaqt hodisalari (SSE). EventSource sarlavha yubora olmagani uchun fetch oqimi ishlatiladi —
// token URL da emas, Authorization sarlavhasida. Uzilsa avtomatik qayta ulanadi.
// handlers: { [event]: (data) => void }; onAuthFail: 401/403 da (token yaroqsiz yoki qurilma bloklangan)
export function useRealtime(handlers, { enabled = true, onAuthFail } = {}) {
  const ref = useRef({ handlers, onAuthFail })
  ref.current = { handlers, onAuthFail }

  useEffect(() => {
    if (!enabled) return
    let stopped = false
    let ctrl = null
    let retry = 2000
    let timer = null

    const dispatch = (event, raw) => {
      const fn = ref.current.handlers?.[event]
      if (!fn) return
      let data = {}
      try { data = raw ? JSON.parse(raw) : {} } catch {}
      try { fn(data) } catch (e) { console.error('realtime handler:', e) }
    }

    const connect = async () => {
      if (stopped) return
      const token = localStorage.getItem('shina_token')
      if (!token) return
      ctrl = new AbortController()
      try {
        const res = await fetch(`${BASE_URL}/api/realtime/stream`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          signal: ctrl.signal,
          cache: 'no-store',
        })
        if (res.status === 401 || res.status === 403) {
          let body = null
          try { body = await res.json() } catch {}
          ref.current.onAuthFail?.(res.status, body)
          return
        }
        if (!res.ok || !res.body) throw new Error('stream ' + res.status)
        retry = 2000
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let buf = ''
        while (!stopped) {
          const { value, done } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          let i
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const chunk = buf.slice(0, i)
            buf = buf.slice(i + 2)
            let event = 'message'
            const data = []
            for (const line of chunk.split('\n')) {
              if (line.startsWith('event:')) event = line.slice(6).trim()
              else if (line.startsWith('data:')) data.push(line.slice(5).trim())
            }
            if (data.length) dispatch(event, data.join('\n'))
          }
        }
      } catch (e) {
        if (stopped || e?.name === 'AbortError') return
      }
      if (stopped) return
      timer = setTimeout(connect, retry)
      retry = Math.min(retry * 2, 30000)
    }

    const reconnectNow = () => {
      if (stopped) return
      clearTimeout(timer)
      try { ctrl?.abort() } catch {}
      retry = 2000
      timer = setTimeout(connect, 300)
    }
    const onVisible = () => { if (document.visibilityState === 'visible') reconnectNow() }

    connect()
    window.addEventListener('online', reconnectNow)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      clearTimeout(timer)
      try { ctrl?.abort() } catch {}
      window.removeEventListener('online', reconnectNow)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled])
}

export default useRealtime
