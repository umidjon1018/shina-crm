import { Globe, Zap, CheckCircle, XCircle, ArrowRight, MessageCircle } from 'lucide-react'
import AgentActivityFeed from '../components/ActivityFeed'

export default function InstagramTab({ agentConfig }) {
  const integrations = agentConfig?.integrations || {}
  const igHandle  = integrations?.instagram?.handle || ''
  const igWebhook = integrations?.instagram?.webhookUrl || ''
  const igEnabled = integrations?.instagram?.enabled || false
  const shop      = integrations?.shop || {}

  const isConfigured = !!(igWebhook && igHandle)

  return (
    <div className="space-y-5">
      {/* Status kartalar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`p-4 rounded-2xl border ${igEnabled ? 'bg-pink-500/10 border-pink-500/20' : 'bg-bg-secondary border-border'}`}>
          <div className="flex items-center gap-2 mb-2">
            {igEnabled
              ? <CheckCircle size={14} className="text-pink-400" />
              : <XCircle size={14} className="text-text-muted" />}
            <span className="text-xs text-text-muted">Bot holati</span>
          </div>
          <p className={`text-lg font-bold ${igEnabled ? 'text-pink-400' : 'text-text-secondary'}`}>
            {igEnabled ? 'Yoqilgan' : "O'chirilgan"}
          </p>
          <p className="text-xs text-text-muted mt-0.5">Instagram komment boti</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-bg-secondary">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={14} className="text-pink-400" />
            <span className="text-xs text-text-muted">Instagram akkaunt</span>
          </div>
          <p className="text-lg font-bold text-text-primary truncate">{igHandle || '—'}</p>
          <p className="text-xs text-text-muted mt-0.5">{igHandle ? 'Ulangan' : 'Admin Paneldan kiriting'}</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-bg-secondary">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-amber-400" />
            <span className="text-xs text-text-muted">make.com webhook</span>
          </div>
          <p className={`text-lg font-bold ${igWebhook ? 'text-accent-green' : 'text-text-secondary'}`}>
            {igWebhook ? 'Sozlangan ✓' : 'Sozlanmagan'}
          </p>
          <p className="text-xs text-text-muted mt-0.5 truncate">{igWebhook || 'Admin Paneldan kiriting'}</p>
        </div>
      </div>

      {/* Sozlanmagan ogohlantirish */}
      {!isConfigured && (
        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <p className="text-sm font-medium text-amber-400 mb-2">Bot sozlanmagan</p>
          <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside">
            <li>Admin Panel → AI Agentlar → Instagram agenti ni oching</li>
            <li>Instagram akkaunt va make.com Webhook URL ni kiriting</li>
            <li>"Instagram komment bot yoqilgan" toggleni yoqing</li>
            <li>Saqlang</li>
          </ol>
        </div>
      )}

      {/* Do'kon ma'lumoti (agar kiritilgan bo'lsa) */}
      {shop.name && (
        <div className="p-4 rounded-2xl border border-border bg-bg-secondary">
          <p className="text-xs text-text-muted mb-2 font-medium">Do'kon ma'lumoti (bot foydalanadigan)</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
            {shop.name    && <span><span className="text-text-muted">Nomi:</span> {shop.name}</span>}
            {shop.address && <span><span className="text-text-muted">Manzil:</span> {shop.address}</span>}
            {shop.hours   && <span><span className="text-text-muted">Ish vaqti:</span> {shop.hours}</span>}
            {shop.phone   && <span><span className="text-text-muted">Telefon:</span> {shop.phone}</span>}
          </div>
        </div>
      )}

      {/* Qanday ishlaydi */}
      <div className="p-4 rounded-2xl border border-border bg-bg-secondary">
        <p className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
          <MessageCircle size={14} className="text-pink-400" />
          Qanday ishlaydi
        </p>
        <div className="flex flex-col gap-2">
          {[
            { step: '1', text: `${igHandle || 'Instagram akkaunt'}ga kimdir komment qoldiradi` },
            { step: '2', text: 'Meta webhook → make.com → Railway backend /api/ai/instagram' },
            { step: '3', text: 'AI agent kommentni tahlil qiladi, CRM bazasidan mijozni qidiradi, omborni tekshiradi' },
            { step: '4', text: 'make.com orqali kommentga avtomatik O\'zbek tilida 1–2 jumlali javob qo\'shiladi' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{step}</span>
              <span className="text-xs text-text-secondary">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Faoliyat lenti */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Globe size={14} className="text-pink-400" />
          So'nggi faoliyat
        </h3>
        <AgentActivityFeed />
      </div>
    </div>
  )
}
