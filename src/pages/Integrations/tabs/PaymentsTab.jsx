import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CreditCard, Link2, List } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getPaymentsSettings, savePaymentsSettings, getPaymentProviders, getOnlinePayments, API_BASE } from '../../../api/integrationService'
import { useShopStore } from '../../../store/shopStore'
import OnlinePaymentModal from '../../../components/OnlinePaymentModal'
import { Card, CopyField, Label, Msg, Spinner, Toggle, errText, inputCls } from '../components/ui'

const NAMES = { payme: 'Payme', click: 'Click', uzum: 'Uzum Bank' }
const FIELDS = {
  payme: [['merchantId', 'Merchant ID'], ['key', 'Key (prod)', 'hasKey'], ['testKey', 'Test key', 'hasTestKey']],
  click: [['serviceId', 'Service ID'], ['merchantId', 'Merchant ID'], ['merchantUserId', 'Merchant user ID'], ['secretKey', 'Secret key', 'hasSecret']],
  uzum: [['serviceId', 'Service ID'], ['login', 'Login'], ['password', 'Password', 'hasPassword'], ['accountField', 'Params field'], ['linkTemplate', 'Link template']],
}
const HOOKS = {
  payme: [['Endpoint URL', '/api/payments/payme']],
  click: [['Prepare URL', '/api/payments/click/prepare'], ['Complete URL', '/api/payments/click/complete']],
  uzum: ['check', 'create', 'confirm', 'reverse', 'status'].map(a => [`/${a}`, `/api/payments/uzum/${a}`]),
}
const STATUS_CLS = { pending: 'text-accent-orange bg-accent-orange/10', paid: 'text-accent-green bg-accent-green/10', cancelled: 'text-red-500 bg-red-500/10', refunded: 'text-red-500 bg-red-500/10' }
const PS = 20

const PaymentsTab = () => {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const [cfg, setCfg] = useState(null)
  const [secrets, setSecrets] = useState({})
  const [msg, setMsg] = useState(null)
  const [providers, setProviders] = useState([])
  const [list, setList] = useState([])
  const [page, setPage] = useState(1)
  const [linkAmount, setLinkAmount] = useState('')
  const [linkNote, setLinkNote] = useState('')
  const [showLink, setShowLink] = useState(false)

  const loadList = () => getOnlinePayments().then(setList).catch(() => {})
  useEffect(() => {
    getPaymentsSettings().then(setCfg).catch(e => setMsg({ err: true, text: errText(e, t) }))
    getPaymentProviders().then(setProviders).catch(() => {})
    loadList()
  }, [])

  const setP = (p, k, v) => setCfg(c => ({ ...c, [p]: { ...c[p], [k]: v } }))
  const save = async () => {
    setMsg(null)
    try {
      const body = {}
      Object.keys(NAMES).forEach(p => { body[p] = { ...cfg[p], ...(secrets[p] || {}) } })
      setCfg(await savePaymentsSettings(body)); setSecrets({})
      setProviders(await getPaymentProviders())
      setMsg({ text: t('mkt_set_saved') })
    } catch (e) { setMsg({ err: true, text: errText(e, t) }) }
  }

  if (!cfg) return msg ? <Msg msg={msg} /> : <Spinner />

  const secretKeys = ['key', 'testKey', 'secretKey', 'password']
  const pageList = list.slice((page - 1) * PS, page * PS)
  const pages = Math.max(1, Math.ceil(list.length / PS))

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-3 gap-4">
        {Object.keys(NAMES).map(p => (
          <Card key={p} title={NAMES[p]} icon={CreditCard} right={<Toggle checked={cfg[p].enabled} onChange={v => setP(p, 'enabled', v)} label="" />}>
            <Toggle checked={cfg[p].test} onChange={v => setP(p, 'test', v)} label={t('int_test_mode')} />
            {FIELDS[p].map(([k, label, has]) => {
              const secret = secretKeys.includes(k)
              return (
                <div key={k}>
                  <Label>{label}</Label>
                  {secret ? (
                    <input type="password" autoComplete="new-password" value={secrets[p]?.[k] || ''} placeholder={cfg[p][has] ? '••••••••' : ''}
                      onChange={e => setSecrets(s => ({ ...s, [p]: { ...s[p], [k]: e.target.value } }))} className={inputCls} />
                  ) : (
                    <input value={cfg[p][k] || ''} onChange={e => setP(p, k, e.target.value)} className={inputCls + (k === 'linkTemplate' ? ' font-mono text-xs' : '')} />
                  )}
                </div>
              )
            })}
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-semibold text-text-muted">{t('int_pay_hooks')}</p>
              {HOOKS[p].map(([label, path]) => (
                <div key={path}><Label>{label}</Label><CopyField value={API_BASE + path} /></div>
              ))}
              {p === 'uzum' && <p className="text-[11px] text-text-muted">{t('int_uzum_hint')}</p>}
              {p === 'payme' && <p className="text-[11px] text-text-muted">{t('int_payme_hint')}</p>}
              {p === 'click' && <p className="text-[11px] text-text-muted">{t('int_click_hint')}</p>}
            </div>
          </Card>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button onClick={save} className="px-4 sm:px-6 py-2.5 rounded-xl bg-accent-red text-white font-bold text-sm">{t('save')}</button>
        <div className="flex-1"><Msg msg={msg} /></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title={t('int_link_title')} icon={Link2}>
          <p className="text-xs text-text-secondary">{t('int_link_desc')}</p>
          {providers.length === 0 ? <p className="text-xs text-accent-orange">{t('int_link_no_providers')}</p> : (
            <>
              <div><Label>{t('int_link_amount')}</Label><input type="number" value={linkAmount} onChange={e => setLinkAmount(e.target.value)} className={inputCls} /></div>
              <div><Label>{t('int_link_note')}</Label><input value={linkNote} onChange={e => setLinkNote(e.target.value)} className={inputCls} /></div>
              <button onClick={() => setShowLink(true)} disabled={!(Number(linkAmount) >= 1000)} className="w-full py-2.5 rounded-xl bg-accent-red text-white font-bold text-sm disabled:opacity-40">{t('int_link_create')}</button>
            </>
          )}
        </Card>

        <div className="lg:col-span-2">
          <Card title={t('int_pay_list')} icon={List}>
            {list.length === 0 ? <p className="text-sm text-text-muted">{t('int_pay_empty')}</p> : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-[11px] text-text-muted uppercase">
                      <th className="py-2 pr-3">#</th><th className="py-2 pr-3">{t('int_pay_provider')}</th><th className="py-2 pr-3 text-right">{t('int_link_amount')}</th>
                      <th className="py-2 pr-3">{t('int_pay_status')}</th><th className="py-2 pr-3">{t('int_pay_purpose')}</th><th className="py-2">{t('int_date')}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {pageList.map(p => (
                        <tr key={p.id}>
                          <td className="py-2 pr-3 text-text-muted">{p.id}</td>
                          <td className="py-2 pr-3 font-semibold text-text-primary">{NAMES[p.provider]}{p.test ? <span className="ml-1 text-[10px] text-accent-orange">{t('int_test')}</span> : null}</td>
                          <td className="py-2 pr-3 text-right font-semibold text-text-primary whitespace-nowrap">{p.amount.toLocaleString('uz-UZ')}</td>
                          <td className="py-2 pr-3"><span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${STATUS_CLS[p.status] || ''}`}>{t('int_st_' + p.status)}</span></td>
                          <td className="py-2 pr-3 text-xs text-text-secondary">{p.saleId ? t('int_purpose_sale', { id: p.saleId }) : (p.note || (p.purpose === 'link' ? t('int_purpose_link') : '—'))}{p.customerName ? ` · ${p.customerName}` : ''}</td>
                          <td className="py-2 text-xs text-text-muted whitespace-nowrap">{new Date(p.paidAt || p.createdAt).toLocaleString('uz-UZ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{Math.min(page * PS, list.length)} / {list.length} {t('int_pcs')}</span>
                  {pages > 1 && (
                    <div className="flex gap-1">
                      <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-2.5 py-1 rounded-lg border border-border disabled:opacity-40">‹</button>
                      <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-2.5 py-1 rounded-lg border border-border disabled:opacity-40">›</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {showLink && (
          <OnlinePaymentModal amount={Number(linkAmount)} providers={providers} purpose="link" note={linkNote}
            shopId={selectedShopId !== 'all' ? selectedShopId : null}
            onPaid={() => { setShowLink(false); setLinkAmount(''); setLinkNote(''); loadList() }}
            onClose={() => { setShowLink(false); loadList() }} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default PaymentsTab
