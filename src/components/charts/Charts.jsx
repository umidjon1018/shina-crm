import { useId } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

// Diagrammalar uchun yagona ranglar (to'q va yorug' mavzuda ham ko'rinadi)
export const PALETTE = ['#2BD4F0', '#A86BFF', '#F062C0', '#4F8CFF', '#F5A524', '#2ED47A', '#EF4B5A', '#7A8BFF']

export const shortNum = (v) => {
  const n = Math.abs(Number(v) || 0)
  const s = n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(Math.round(n))
  return (Number(v) < 0 ? '−' : '') + s.replace('.0', '')
}
const fmt = (v) => Math.round(Number(v) || 0).toLocaleString('ru-RU')

// ── Gradient asosiy karta (rasmdagi "Avg First Reply Time") ──
export const HeroStat = ({ gradient = 'violet', label, value, unit, sub, icon: Icon, trend, onClick }) => (
  <div onClick={onClick}
    className={`g-${gradient} relative overflow-hidden rounded-3xl p-5 sm:p-6 text-white shadow-lg min-w-0 ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}>
    <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
    <div className="absolute right-6 -bottom-12 w-28 h-28 rounded-full bg-white/10" />
    <div className="relative flex items-start justify-between gap-3">
      <p className="text-[15px] sm:text-base font-semibold text-white/90">{label}</p>
      {Icon && <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><Icon size={20} /></div>}
    </div>
    <div className="relative mt-3 flex items-baseline gap-1.5 flex-wrap">
      <span className="text-3xl sm:text-4xl font-bold tracking-tight [overflow-wrap:anywhere]">{value}</span>
      {unit && <span className="text-base text-white/80">{unit}</span>}
    </div>
    {(sub || trend !== undefined) && (
      <div className="relative mt-2 flex items-center gap-2 text-sm text-white/85">
        {trend !== undefined && trend !== null && Number.isFinite(trend) && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 font-semibold">
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
        {sub && <span className="truncate">{sub}</span>}
      </div>
    )}
  </div>
)

const TONES = {
  pink: 'from-[#F062C0] to-[#A86BFF]', cyan: 'from-[#2BD4F0] to-[#4F8CFF]', violet: 'from-[#A86BFF] to-[#6A7CFF]',
  green: 'from-[#2ED47A] to-[#1E9BD7]', orange: 'from-[#F5A524] to-[#EF4B5A]', red: 'from-[#EF4B5A] to-[#C2378F]', blue: 'from-[#4F8CFF] to-[#7A5CFF]',
}

// ── Kichik ko'rsatkich (rasmdagi "Messages −20%") ──
export const MiniStat = ({ icon: Icon, label, value, delta, tone = 'cyan', onClick, active }) => (
  <div onClick={onClick}
    className={`panel flex items-center gap-3 px-4 py-3.5 min-w-0 ${onClick ? 'cursor-pointer hover:border-border-bright transition-colors' : ''} ${active ? 'ring-2 ring-accent-red/40 border-accent-red/60' : ''}`}>
    {Icon && (
      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${TONES[tone] || TONES.cyan} flex items-center justify-center text-white shrink-0 shadow-md`}>
        <Icon size={20} />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-sm text-text-secondary truncate">{label}</p>
      <p className="text-xl font-bold text-text-primary leading-tight [overflow-wrap:anywhere]">{value}</p>
    </div>
    {delta !== undefined && delta !== null && Number.isFinite(delta) && (
      <span className={`px-2.5 py-1 rounded-lg text-sm font-bold shrink-0 ${delta >= 0 ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-red/15 text-accent-red'}`}>
        {delta > 0 ? '+' : ''}{delta}%
      </span>
    )}
  </div>
)

// ── Diagramma paneli ──
export const ChartCard = ({ title, subtitle, right, children, className = '' }) => (
  <div className={`panel p-4 sm:p-5 min-w-0 ${className}`}>
    {(title || right) && (
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          {title && <h3 className="text-base sm:text-lg font-bold text-text-primary">{title}</h3>}
          {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
    )}
    {children}
  </div>
)

export const Legend = ({ items }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
    {items.map(it => (
      <span key={it.label} className="flex items-center gap-2 text-sm text-text-secondary">
        <span className="w-5 h-0 border-t-2" style={{ borderColor: it.color, borderStyle: it.dashed ? 'dashed' : 'solid' }} />{it.label}
      </span>
    ))}
  </div>
)

const TooltipBox = ({ active, payload, label, valueFormatter = fmt, labelFormatter }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-bg-secondary/95 backdrop-blur px-3 py-2 shadow-xl">
      <p className="text-xs text-text-muted mb-1">{labelFormatter ? labelFormatter(label) : label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color || p.stroke }} />
          {p.name}: {valueFormatter(p.value)}
        </p>
      ))}
    </div>
  )
}

const axisProps = { tick: { fill: 'var(--text-muted)', fontSize: 12 }, axisLine: false, tickLine: false }

// ── Maydon-diagramma (rasmdagi "Tickets Created vs Solved"): 1–2 qator, birinchisi to'ldirilgan ──
export const TrendArea = ({ data, xKey = 'label', series, height = 260, valueFormatter = fmt, labelFormatter, yFormatter = shortNum }) => {
  const id = useId().replace(/:/g, '')
  return (
    <div style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`${id}g${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={s.dashed ? 0.05 : 0.45} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} minTickGap={16} />
          <YAxis {...axisProps} tickFormatter={yFormatter} width={56} />
          <Tooltip content={<TooltipBox valueFormatter={valueFormatter} labelFormatter={labelFormatter} />} />
          {series.map((s, i) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={s.dashed ? 2 : 3}
              strokeDasharray={s.dashed ? '4 5' : undefined} fill={`url(#${id}g${i})`} dot={false}
              activeDot={{ r: 6, strokeWidth: 3, stroke: 'var(--bg-secondary)', fill: s.color }} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Gradient ustunlar (rasmdagi "Number of Tickets / Week Day") ──
export const GradientBars = ({ data, xKey = 'label', yKey = 'value', height = 240, valueFormatter = fmt, name, colors = ['#2BD4F0', '#A86BFF'], horizontal = false }) => {
  const id = useId().replace(/:/g, '')
  return (
    <div style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, left: horizontal ? 8 : -12, bottom: 0 }}>
          <defs>
            <linearGradient id={`${id}b`} x1={horizontal ? '0' : '0'} y1={horizontal ? '0' : '0'} x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '1'}>
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="100%" stopColor={colors[1]} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" {...axisProps} tickFormatter={shortNum} />
              <YAxis type="category" dataKey={xKey} {...axisProps} width={110} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...axisProps} />
              <YAxis {...axisProps} tickFormatter={shortNum} width={48} />
            </>
          )}
          <Tooltip cursor={{ fill: 'var(--bg-tertiary)', opacity: 0.4 }} content={<TooltipBox valueFormatter={valueFormatter} />} />
          <Bar dataKey={yKey} name={name} fill={`url(#${id}b)`} radius={horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0]} maxBarSize={42} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Donut (rasmdagi "Tickets By Type"): o'rtada jami, yonida ro'yxat va foizlar ──
export const DonutChart = ({ data, height = 220, centerLabel, centerValue, valueFormatter = fmt, legend = true }) => {
  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0)
  const rows = data.map((d, i) => ({ ...d, color: d.color || PALETTE[i % PALETTE.length], pct: total ? Math.round((d.value / total) * 1000) / 10 : 0 }))
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 min-w-0">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows.length ? rows : [{ name: '—', value: 1, color: 'var(--bg-tertiary)' }]} dataKey="value" nameKey="name"
              innerRadius="68%" outerRadius="96%" paddingAngle={rows.length > 1 ? 2 : 0} stroke="none" startAngle={90} endAngle={-270}>
              {(rows.length ? rows : [{ color: 'var(--bg-tertiary)' }]).map((r, i) => <Cell key={i} fill={r.color} />)}
            </Pie>
            {rows.length > 0 && <Tooltip content={<TooltipBox valueFormatter={valueFormatter} />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
          {centerLabel && <p className="text-sm text-text-muted leading-tight">{centerLabel}</p>}
          <p className="text-xl font-bold text-text-primary leading-tight">{centerValue ?? shortNum(total)}</p>
        </div>
      </div>
      {legend && (
        <div className="flex-1 w-full min-w-0 space-y-2">
          {rows.map(r => (
            <div key={r.name} className="flex items-center gap-2.5 min-w-0">
              <span className="w-3.5 h-3.5 rounded-full border-[3px] shrink-0" style={{ borderColor: r.color }} />
              <span className="flex-1 text-sm text-text-secondary truncate">{r.name}</span>
              <span className="text-sm font-bold text-text-primary">{r.pct}%</span>
            </div>
          ))}
          {!rows.length && <p className="text-sm text-text-muted">—</p>}
        </div>
      )}
    </div>
  )
}
