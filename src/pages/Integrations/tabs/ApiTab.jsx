import { useState, useEffect } from 'react'
import { KeyRound, Plus, Store, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getApiKeys, createApiKey, updateApiKey, deleteApiKey, API_BASE } from '../../../api/integrationService'
import { useShopStore } from '../../../store/shopStore'
import { Card, CopyField, Label, Msg, Spinner, Toggle, errText, inputCls } from '../components/ui'

const ApiTab = () => {
  const { t } = useTranslation()
  const { shops } = useShopStore()
  const [keys, setKeys] = useState(null)
  const [name, setName] = useState('')
  const [shopIds, setShopIds] = useState([])
  const [newKey, setNewKey] = useState(null)
  const [msg, setMsg] = useState(null)

  const load = () => getApiKeys().then(setKeys).catch(e => { setKeys([]); setMsg({ err: true, text: errText(e, t) }) })
  useEffect(() => { load() }, [])

  const create = async () => {
    setMsg(null)
    try {
      const k = await createApiKey({ name, shop_ids: shopIds })
      setNewKey(k); setName(''); setShopIds([]); load()
    } catch (e) { setMsg({ err: true, text: errText(e, t) }) }
  }
  const toggle = async (k) => { await updateApiKey(k.id, { is_active: !k.isActive }).catch(() => {}); load() }
  const remove = async (k) => {
    if (!window.confirm(t('int_api_delete_confirm', { name: k.name }))) return
    await deleteApiKey(k.id).catch(() => {}); load()
  }
  const shopName = (id) => shops.find(s => String(s.id) === String(id))?.name || id
  const sample = newKey?.key || 'KALIT'

  if (!keys) return <Spinner />

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <Card title={t('int_api_new')} icon={Plus}>
          <p className="text-xs text-text-secondary">{t('int_api_desc')}</p>
          <div>
            <Label>{t('int_api_name')}</Label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t('int_api_name_ph')} className={inputCls} />
          </div>
          {shops.length > 1 && (
            <div>
              <Label>{t('int_api_shops')}</Label>
              <div className="flex flex-wrap gap-2">
                {shops.map(s => {
                  const on = shopIds.includes(String(s.id))
                  return (
                    <button key={s.id} type="button" onClick={() => setShopIds(on ? shopIds.filter(x => x !== String(s.id)) : [...shopIds, String(s.id)])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${on ? 'bg-accent-red text-white border-accent-red' : 'border-border text-text-secondary'}`}>{s.name}</button>
                  )
                })}
              </div>
              <p className="text-[11px] text-text-muted mt-1">{t('int_api_shops_hint')}</p>
            </div>
          )}
          <button onClick={create} disabled={!name.trim()} className="w-full py-2.5 rounded-xl bg-accent-red text-white font-bold text-sm disabled:opacity-40">{t('int_api_create')}</button>
          <Msg msg={msg} />
          {newKey && (
            <div className="rounded-xl border border-accent-orange/40 bg-accent-orange/5 p-3 space-y-2">
              <p className="text-xs font-bold text-accent-orange">{t('int_api_once')}</p>
              <CopyField value={newKey.key} />
            </div>
          )}
        </Card>

        <Card title={t('int_api_keys')} icon={KeyRound}>
          {keys.length === 0 ? <p className="text-sm text-text-muted">{t('int_api_empty')}</p> : (
            <div className="divide-y divide-border">
              {keys.map(k => (
                <div key={k.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{k.name}</p>
                    <p className="text-[11px] text-text-muted font-mono">{k.prefix}… · {k.shopIds.length ? k.shopIds.map(shopName).join(', ') : t('int_api_all_shops')}</p>
                    <p className="text-[11px] text-text-muted">{t('int_api_last_used')}: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('uz-UZ') : '—'}</p>
                  </div>
                  <Toggle checked={k.isActive} onChange={() => toggle(k)} label="" />
                  <button onClick={() => remove(k)} className="p-2 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-500"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title={t('int_api_docs')} icon={Store}>
        <p className="text-xs text-text-secondary">{t('int_api_docs_desc')}</p>
        <div className="space-y-3">
          <div><Label>{t('int_api_ep_products')}</Label><CopyField value={`${API_BASE}/api/public/v1/products?api_key=${sample}`} /></div>
          <div><Label>{t('int_api_ep_instock')}</Label><CopyField value={`${API_BASE}/api/public/v1/products?in_stock=1&api_key=${sample}`} /></div>
          <div><Label>{t('int_api_ep_csv')}</Label><CopyField value={`${API_BASE}/api/public/v1/products?format=csv&api_key=${sample}`} /></div>
          <div><Label>{t('int_api_ep_stock')}</Label><CopyField value={`${API_BASE}/api/public/v1/stock?api_key=${sample}`} /></div>
          <div><Label>{t('int_api_ep_shops')}</Label><CopyField value={`${API_BASE}/api/public/v1/shops?api_key=${sample}`} /></div>
        </div>
        <div className="text-xs text-text-secondary space-y-1.5 bg-bg-tertiary rounded-xl p-3">
          <p>{t('int_api_hint_header')}</p>
          <p>{t('int_api_hint_shop')}</p>
          <p>{t('int_api_hint_fields')}</p>
        </div>
      </Card>
    </div>
  )
}

export default ApiTab
