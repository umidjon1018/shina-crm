// Kichik umumiy UI bo'laklari: sahifa sarlavhasi, KPI karta, tab ichidagi almashtirgich, ma'lumot qatori, belgi

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div className="min-w-0">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">{title}</h1>
      {subtitle && <p className="text-text-secondary text-[15px] mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">{actions}</div>}
  </div>
)

// Bosiladigan KPI karta (masalan, filtr sifatida)
export const KpiCard = ({ icon: Icon, label, value, sub, color = 'bg-accent-blue/10 text-accent-blue', active, onClick, className = '' }) => (
  <div onClick={onClick}
    className={`bg-bg-secondary border rounded-[1.25rem] p-3.5 sm:p-4 flex items-center gap-3 min-w-0 transition-all ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''} ${className}
      ${active ? 'border-accent-red ring-2 ring-accent-red/20' : 'border-border hover:border-text-muted'}`}>
    {Icon && <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}><Icon size={20} /></div>}
    <div className="min-w-0">
      <p className="text-xl sm:text-2xl font-syne font-extrabold text-text-primary leading-tight [overflow-wrap:anywhere]">{value}</p>
      <p className="text-sm text-text-muted leading-tight">{label}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  </div>
)

// KPI qatori: telefonda gorizontal suriladi (ekranni egallamaydi), kompyuterda to'r
export const KpiStrip = ({ children, cols = 4 }) => (
  <div className={`flex sm:grid ${cols === 5 ? 'sm:grid-cols-3 lg:grid-cols-5' : cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar snap-x -mx-3 px-3 sm:mx-0 sm:px-0`}>
    {children}
  </div>
)

// [A | B] — tab ichidagi ko'rinish almashtirgichi
export const Segmented = ({ value, onChange, options }) => (
  <div className="inline-flex items-center gap-1 panel !rounded-2xl p-1 max-w-full overflow-x-auto no-scrollbar">
    {options.map(o => {
      const Icon = o.icon
      return (
        <button key={o.id} type="button" onClick={() => onChange(o.id)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[15px] font-semibold whitespace-nowrap transition-all
            ${value === o.id ? 'g-brand text-white shadow-md' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
          {Icon && <Icon size={17} />} {o.label}
          {o.count !== undefined && <span className={`text-xs ${value === o.id ? 'opacity-80' : 'text-text-muted'}`}>{o.count}</span>}
        </button>
      )
    })}
  </div>
)

// Modal ichidagi "nomi: qiymati" qatorlari
export const DetailGrid = ({ items, cols = 2 }) => (
  <div className={`grid grid-cols-1 ${cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2`}>
    {items.filter(Boolean).map((it, i) => (
      <div key={i} className="bg-bg-secondary border border-border rounded-xl px-3.5 py-2.5 min-w-0">
        <p className="text-xs text-text-muted">{it.label}</p>
        <div className={`text-[15px] font-semibold text-text-primary [overflow-wrap:anywhere] ${it.className || ''}`}>{it.value ?? '—'}</div>
      </div>
    ))}
  </div>
)

export const Badge = ({ children, color = 'bg-bg-tertiary text-text-secondary' }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap ${color}`}>{children}</span>
)
