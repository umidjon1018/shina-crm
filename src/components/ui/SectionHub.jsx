import { useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import Modal from './Modal'

const TONES = {
  pink: 'from-[#F062C0] to-[#A86BFF]', cyan: 'from-[#2BD4F0] to-[#4F8CFF]', violet: 'from-[#A86BFF] to-[#6A7CFF]',
  green: 'from-[#2ED47A] to-[#1E9BD7]', orange: 'from-[#F5A524] to-[#EF4B5A]', red: 'from-[#EF4B5A] to-[#C2378F]', blue: 'from-[#4F8CFF] to-[#7A5CFF]',
}
export const toneClass = (tone) => TONES[tone] || TONES.cyan

const setSectionParam = (id) => {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('section', id)
  else url.searchParams.delete('section')
  window.history.replaceState(window.history.state, '', url)
}

// Sahifaning bo'limlari: kartochka bosilsa bo'lim katta modalda ochiladi (telefonda to'liq ekran).
// sections: [{ id, label, desc, icon, tone, render: () => JSX, size }]
// variant: 'tiles' (kartochkalar) | 'bar' (gorizontal tugmalar — Kassa kabi asosiy ish oynasi bor sahifalar uchun)
const SectionHub = ({ sections, title, variant = 'tiles', openId: controlledId, onOpenChange }) => {
  const [openId, setOpenId] = useState(() => new URLSearchParams(window.location.search).get('section'))
  const current = controlledId !== undefined ? controlledId : openId
  const open = (id) => { setOpenId(id); onOpenChange?.(id) }
  const close = () => { setOpenId(null); onOpenChange?.(null) }
  useEffect(() => { setSectionParam(current || null) }, [current])
  useEffect(() => { if (current && !sections.some(s => s.id === current)) close() }, [sections.length])
  const sec = sections.find(s => s.id === current)

  return (
    <>
      {variant === 'bar' ? (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {sections.map(s => {
            const Icon = s.icon
            return (
              <button key={s.id} onClick={() => open(s.id)}
                className="flex items-center gap-2 pl-2 pr-4 py-2 rounded-2xl panel hover:border-border-bright text-[15px] font-semibold text-text-primary whitespace-nowrap shrink-0 active:scale-[0.98] transition-transform">
                {Icon && <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${toneClass(s.tone)} text-white flex items-center justify-center`}><Icon size={17} /></span>}
                {s.label}
                {s.badge ? <span className="ml-0.5 px-2 py-0.5 rounded-full bg-accent-red text-white text-xs font-bold">{s.badge}</span> : null}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {title && <h2 className="text-lg sm:text-xl font-bold text-text-primary">{title}</h2>}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sections.map(s => {
              const Icon = s.icon
              return (
                <button key={s.id} onClick={() => open(s.id)}
                  className="panel text-left flex items-center gap-3.5 p-4 hover:border-border-bright transition-colors active:scale-[0.99] group min-w-0">
                  {Icon && (
                    <span className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${toneClass(s.tone)} text-white flex items-center justify-center shrink-0 shadow-md`}>
                      <Icon size={22} />
                    </span>
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-base font-bold text-text-primary truncate">{s.label}</span>
                      {s.badge ? <span className="px-2 py-0.5 rounded-full bg-accent-red text-white text-xs font-bold">{s.badge}</span> : null}
                    </span>
                    {s.desc && <span className="block text-sm text-text-muted leading-snug line-clamp-2">{s.desc}</span>}
                  </span>
                  <ChevronRight size={20} className="text-text-muted group-hover:text-text-primary shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      )}
      <Modal open={!!sec} onClose={close} size={sec?.size || 'xl'} title={sec?.label} icon={sec?.icon}
        bodyClass="p-3 sm:p-6 bg-bg-primary">
        {sec && sec.render()}
      </Modal>
    </>
  )
}

export default SectionHub
