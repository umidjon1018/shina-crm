import { useState } from 'react'
import { ChevronLeft, ChevronRight, Image as ImageIcon, X } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

const SIZE = {
  xs: { box: 'w-7 h-7', icon: 11, rounded: 'rounded-lg' },
  sm: { box: 'w-9 h-9', icon: 13, rounded: 'rounded-lg' },
  md: { box: 'w-14 h-14', icon: 18, rounded: 'rounded-xl' },
  lg: { box: 'w-24 h-24', icon: 24, rounded: 'rounded-xl' },
}

const ProductImageViewer = ({ productId, size = 'sm', className = '', onFullscreenChange }) => {
  const { productImages } = useSettingsStore()
  const images = productImages[String(productId)] || []
  const [fsOpen, setFsOpen] = useState(false)
  const [fsIdx, setFsIdx] = useState(0)

  const { box, icon, rounded } = SIZE[size] || SIZE.sm

  const openFs = (e, idx = 0) => {
    e.stopPropagation()
    if (!images.length) return
    setFsIdx(idx)
    setFsOpen(true)
    onFullscreenChange?.(true)
  }
  const closeFs = () => {
    setFsOpen(false)
    onFullscreenChange?.(false)
  }
  const prev = (e) => { e.stopPropagation(); setFsIdx(i => (i - 1 + images.length) % images.length) }
  const next = (e) => { e.stopPropagation(); setFsIdx(i => (i + 1) % images.length) }

  return (
    <>
      <div
        className={`${box} ${rounded} flex-shrink-0 border border-border overflow-hidden flex items-center justify-center ${images[0] ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'bg-bg-tertiary'} ${className}`}
        onClick={images[0] ? openFs : undefined}
      >
        {images[0]
          ? <img src={images[0]} alt="" className="w-full h-full object-cover" />
          : <ImageIcon size={icon} className="text-text-muted opacity-30" />
        }
      </div>

      {fsOpen && (
        <div
          className="fixed inset-0 bg-black/92 z-[500] flex items-center justify-center"
          onClick={closeFs}
        >
          <button
            onClick={closeFs}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>

          {images.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
                <ChevronLeft size={22} />
              </button>
              <button onClick={next} className="absolute right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <img
            src={images[fsIdx]}
            alt=""
            className="max-w-[90vw] max-h-[88vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute bottom-5 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setFsIdx(i) }}
                  className={`w-2 h-2 rounded-full transition-all ${i === fsIdx ? 'bg-white scale-125' : 'bg-white/35 hover:bg-white/60'}`}
                />
              ))}
            </div>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-10 flex gap-1.5 px-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setFsIdx(i) }}
                  className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === fsIdx ? 'border-white' : 'border-white/20 opacity-60 hover:opacity-90'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default ProductImageViewer
