import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'shina_content_zoom'
const MIN = 1
const MAX = 2.5

const readZoom = () => {
  try {
    const v = parseFloat(localStorage.getItem(STORAGE_KEY))
    return v >= MIN && v <= MAX ? v : 1
  } catch {
    return 1
  }
}

const saveZoom = (v) => {
  try { localStorage.setItem(STORAGE_KEY, String(v)) } catch { /* private mode */ }
}

const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

// O'rnatilgan PWA (iOS/Android) native pinch-zoom ni ishonchsiz qo'llaydi —
// shuning uchun kontentni CSS zoom bilan o'zimiz kattalashtiramiz (matn qayta joylashadi).
export const usePinchZoom = () => {
  const areaRef = useRef(null)
  const contentRef = useRef(null)
  const [zoom, setZoom] = useState(readZoom)
  const live = useRef({ start: 0, startZoom: 1, current: zoom })

  useEffect(() => {
    live.current.current = zoom
    if (contentRef.current) contentRef.current.style.zoom = zoom
  }, [zoom])

  useEffect(() => {
    const area = areaRef.current
    if (!area) return

    const onStart = (e) => {
      if (e.touches.length === 2) {
        live.current.start = dist(e.touches)
        live.current.startZoom = live.current.current
      }
    }
    const onMove = (e) => {
      if (e.touches.length !== 2 || !live.current.start) return
      e.preventDefault()
      const z = Math.min(MAX, Math.max(MIN, live.current.startZoom * dist(e.touches) / live.current.start))
      live.current.current = z
      if (contentRef.current) contentRef.current.style.zoom = z
    }
    const onEnd = (e) => {
      if (!live.current.start || e.touches.length >= 2) return
      live.current.start = 0
      const z = Math.round(live.current.current * 10) / 10
      setZoom(z)
      saveZoom(z)
    }

    area.addEventListener('touchstart', onStart, { passive: true })
    area.addEventListener('touchmove', onMove, { passive: false })
    area.addEventListener('touchend', onEnd)
    area.addEventListener('touchcancel', onEnd)
    return () => {
      area.removeEventListener('touchstart', onStart)
      area.removeEventListener('touchmove', onMove)
      area.removeEventListener('touchend', onEnd)
      area.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  const resetZoom = () => { setZoom(1); saveZoom(1) }

  return { areaRef, contentRef, zoom, resetZoom }
}
