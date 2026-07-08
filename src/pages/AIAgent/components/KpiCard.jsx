import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

function KpiCard({ label, value, sub, trend, color = 'text-text-primary' }) {
  return (
    <div className="bg-bg-secondary rounded-xl p-4 border border-border">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className={`text-xl font-bold font-syne ${color}`}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${trend >= 0 ? 'text-[#22c55e]' : 'text-[#E63946]'}`}>
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  )
}

export default KpiCard
