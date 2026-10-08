import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt, Activity, ListChecks, Search, RotateCcw, AlertTriangle } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import { toast, errorText } from '../../../components/ui/Toast'
import { getFiscalSettings, saveFiscalSettings, getFiscalStatus, getFiscalProducts, setFiscalProduct, retryFiscal } from '../../../api/fiscalService'
import { Card, Label, Msg, Spinner, Toggle, errText, inputCls } from './ui'

// Tovar qatori: IKPU (17 xona), qadoq kodi, QQS — maydondan chiqqanda saqlanadi
const ProductRow = ({ p, onSaved, t }) => {
  const [f, setF] = useState({ ikpu: p.ikpu, packageCode: p.packageCode, vatPercent: p.vatPercent ?? '' })
  const [state, setState] = useState(null)
  const save = async (next) => {
    if (next.ikpu === p.ikpu && next.packageCode === p.packageCode && String(next.vatPercent) === String(p.vatPercent ?? '')) return
    setState('saving')
    try { await setFiscalProduct(p.id, next); setState('ok'); onSaved(p.id, { ...next, vatPercent: next.vatPercent === '' ? null : Number(next.vatPercent) }) }
    catch (e) { setState(null); toast(errorText(e, t('exp_err_generic')), 'error'); setF({ ikpu: p.ikpu, packageCode: p.packageCode, vatPercent: p.vatPercent ?? '' }) }
  }
  const cell = 'bg-bg-tertiary border border-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-red'
  return (
    <div className="flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
      <input value={f.ikpu} maxLength={17} placeholder="IKPU (17)" onChange={e => setF(s => ({ ...s, ikpu: e.target.value.replace(/\D/g, '') }))}
        onBlur={() => save(f)} className={`${cell} w-44 font-mono ${f.ikpu && f.ikpu.length !== 17 ? '!border-accent-red' : ''}`} />
      <input value={f.packageCode} placeholder={t('fis_pkg')} onChange={e => setF(s => ({ ...s, packageCode: e.target.value.replace(/\D/g, '') }))}
        onBlur={() => save(f)} className={`${cell} w-28 font-mono`} />
      <select value={f.vatPercent} onChange={e => { const n = { ...f, vatPercent: e.target.value }; setF(n); save(n) }} className={`${cell} w-28`}>
        <option value="">{t('fis_vat_default')}</option>
        <option value="12">12%</option>
        <option value="0">0%</option>
      </select>
      {state === 'saving' && <span className="text-xs text-text-muted">...</span>}
      {state === 'ok' && <span className="text-xs text-accent-green">✓</span>}
    </div>
  )
}

// Sozlamalar → Integratsiyalar → Fiskal chek (tayyorlov): yoqish, provayder, kalitlar, navbat holati, tovarlar IKPU kodlari
const FiscalTab = () => {
  const { t } = useTranslation()
  const [cfg, setCfg] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [msg, setMsg] = useState(null)
  const [st, setSt] = useState(null)
  const [products, setProducts] = useState(null)
  const [q, setQ] = useState('')
  const [onlyMissing, setOnlyMissing] = useState(true)

  const loadStatus = () => getFiscalStatus().then(setSt).catch(() => {})
  useEffect(() => {
    getFiscalSettings().then(setCfg).catch(e => setMsg({ err: true, text: errText(e, t) }))
    loadStatus()
    getFiscalProducts().then(setProducts).catch(() => setProducts([]))
  }, [])

  const save = async () => {
    setMsg(null)
    try { setCfg(await saveFiscalSettings({ ...cfg, apiKey: apiKey || undefined })); setApiKey(''); setMsg({ text: t('mkt_set_saved') }); loadStatus() }
    catch (e) { setMsg({ err: true, text: errText(e, t) }) }
  }
  const retry = async () => {
    try { const r = await retryFiscal(); toast(t('fis_retried', { n: r.count })); loadStatus() } catch (e) { toast(errorText(e, t('exp_err_generic')), 'error') }
  }
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (products || []).filter(p => (!onlyMissing || !p.ikpu) && (!s || `${p.name} ${p.size} ${p.ikpu}`.toLowerCase().includes(s)))
  }, [products, q, onlyMissing])
  const onSaved = (id, d) => { setProducts(list => list.map(p => (p.id === id ? { ...p, ...d } : p))); loadStatus() }

  if (!cfg) return msg ? <Msg msg={msg} /> : <Spinner />

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title={t('fis_title')} icon={Receipt}>
          <p className="text-xs text-text-secondary">{t('fis_desc')}</p>
          <Toggle checked={cfg.enabled} onChange={v => setCfg({ ...cfg, enabled: v })} label={t('fis_enable')} />
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>{t('fis_provider')}</Label>
              <select value={cfg.provider} onChange={e => setCfg({ ...cfg, provider: e.target.value })} className={inputCls}>
                <option value="">{t('fis_choose')}</option>
                {cfg.providers.map(p => <option key={p} value={p}>{t('fis_pr_' + p)}</option>)}
              </select>
            </div>
            <div>
              <Label>{t('int_mode')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {['test', 'live'].map(m => (
                  <button key={m} onClick={() => setCfg({ ...cfg, mode: m })}
                    className={`py-2 rounded-xl text-sm font-semibold border ${cfg.mode === m ? 'bg-accent-red text-white border-accent-red' : 'border-border text-text-secondary'}`}>{t('int_mode_' + m)}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>{t('fis_tin')}</Label>
              <input value={cfg.tin} onChange={e => setCfg({ ...cfg, tin: e.target.value.replace(/\D/g, '') })} maxLength={14} className={inputCls + ' font-mono'} />
            </div>
            <div>
              <Label>{t('fis_kassa')}</Label>
              <input value={cfg.kassaId} onChange={e => setCfg({ ...cfg, kassaId: e.target.value })} className={inputCls + ' font-mono'} />
            </div>
            <div className="sm:col-span-2">
              <Label>{t('fis_api_url')}</Label>
              <input value={cfg.apiUrl} onChange={e => setCfg({ ...cfg, apiUrl: e.target.value })} placeholder="https://" className={inputCls} />
            </div>
            <div>
              <Label>{t('fis_login')}</Label>
              <input value={cfg.login} onChange={e => setCfg({ ...cfg, login: e.target.value })} className={inputCls} autoComplete="off" />
            </div>
            <div>
              <Label>{t('fis_key')}</Label>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={cfg.hasKey ? cfg.keyMask : ''} className={inputCls} autoComplete="new-password" />
            </div>
          </div>
          <Toggle checked={cfg.vatPayer} onChange={v => setCfg({ ...cfg, vatPayer: v })} label={t('fis_vat_payer')} />
          <div>
            <Label>{t('fis_default_vat')}</Label>
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              {[12, 0].map(v => (
                <button key={v} onClick={() => setCfg({ ...cfg, defaultVat: v })}
                  className={`py-2 rounded-xl text-sm font-semibold border ${cfg.defaultVat === v ? 'bg-accent-red text-white border-accent-red' : 'border-border text-text-secondary'}`}>{v}%</button>
              ))}
            </div>
          </div>
          <button onClick={save} className="w-full py-2.5 rounded-xl bg-accent-red text-white font-bold text-sm">{t('save')}</button>
          <Msg msg={msg} />
        </Card>

        <Card title={t('fis_status')} icon={Activity}
          right={st?.error > 0 && <button onClick={retry} className="flex items-center gap-1.5 text-xs font-bold text-accent-blue hover:underline"><RotateCcw size={13} />{t('fis_retry')}</button>}>
          {!cfg.adapterReady && (
            <div className="flex items-start gap-2 text-sm text-accent-orange bg-accent-orange/10 rounded-xl px-3 py-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /><span>{t('fis_adapter_missing')}</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[['pending', 'text-accent-orange'], ['done', 'text-accent-green'], ['error', 'text-accent-red']].map(([k, c]) => (
              <div key={k} className="bg-bg-tertiary rounded-xl py-3">
                <p className={`text-xl font-bold ${c}`}>{st?.[k] ?? '—'}</p>
                <p className="text-xs text-text-muted">{t('fis_st_' + k)}</p>
              </div>
            ))}
          </div>
          {st?.productsMissingIkpu > 0 && (
            <p className="text-sm text-accent-orange">{t('fis_missing_ikpu', { n: st.productsMissingIkpu, total: st.productsTotal })}</p>
          )}
          {st?.lastError && st.lastError !== 'adapter_missing' && <p className="text-xs text-accent-red break-words">{st.lastError}</p>}
          <ul className="text-xs text-text-secondary space-y-1 list-disc pl-4">
            <li>{t('fis_note_queue')}</li>
            <li>{t('fis_note_off')}</li>
            <li>{t('fis_note_needed')}</li>
          </ul>
        </Card>
      </div>

      <Card title={t('fis_products')} icon={ListChecks}>
        <p className="text-xs text-text-secondary">{t('fis_products_hint')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('fis_search')} className={inputCls + ' pl-9'} />
          </div>
          <Toggle checked={onlyMissing} onChange={setOnlyMissing} label={t('fis_only_missing')} />
        </div>
        {!products ? <Spinner /> : (
          <DataTable tableId="fis_products" rows={rows} empty={t('fis_no_products')} resetKey={q + onlyMissing} pageSize={25}
            columns={[
              { key: 'name', label: t('col_product'), sortValue: p => p.name, render: p => <><p className="font-semibold">{p.name}</p>{p.size && !p.name.includes(p.size) && <p className="text-xs text-text-muted">{p.size}</p>}</> },
              { key: 'codes', label: t('fis_codes'), render: p => <ProductRow key={p.id} p={p} onSaved={onSaved} t={t} /> },
            ]} />
        )}
      </Card>
    </div>
  )
}

export default FiscalTab
