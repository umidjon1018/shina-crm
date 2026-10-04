import { useState, useEffect } from 'react'
import { Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getBotStock, saveBotStock } from '../../../api/integrationService'
import { getTgSettings } from '../../../api/marketingService'
import { Card, Msg, Spinner, Toggle, errText } from '../components/ui'

const BotTab = () => {
  const { t } = useTranslation()
  const [cfg, setCfg] = useState(null)
  const [tg, setTg] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    getBotStock().then(setCfg).catch(e => setMsg({ err: true, text: errText(e, t) }))
    getTgSettings().then(setTg).catch(() => {})
  }, [])

  const save = async (next) => {
    setCfg(next); setMsg(null)
    try { setCfg(await saveBotStock(next)); setMsg({ text: t('mkt_set_saved') }) } catch (e) { setMsg({ err: true, text: errText(e, t) }) }
  }

  if (!cfg) return msg ? <Msg msg={msg} /> : <Spinner />
  const botReady = tg && tg.mode !== 'off' && tg.botUsername

  return (
    <div className="max-w-2xl space-y-4">
      <Card title={t('int_bot_title')} icon={Bot}>
        <p className="text-xs text-text-secondary">{t('int_bot_desc')}</p>
        {!botReady && (
          <div className="text-xs text-accent-orange bg-accent-orange/10 rounded-lg px-3 py-2">{t('int_bot_not_connected')}</div>
        )}
        {botReady && <p className="text-xs text-text-muted">{t('int_bot_connected', { bot: tg.botUsername })}</p>}
        <div className="space-y-3">
          <Toggle checked={cfg.enabled} onChange={v => save({ ...cfg, enabled: v })} label={t('int_bot_enable')} />
          <Toggle checked={cfg.showPrices} onChange={v => save({ ...cfg, showPrices: v })} label={t('int_bot_prices')} />
          <Toggle checked={cfg.showShops} onChange={v => save({ ...cfg, showShops: v })} label={t('int_bot_shops')} />
        </div>
        <Msg msg={msg} />
      </Card>
      <Card title={t('int_bot_example')}>
        <div className="space-y-2 text-sm">
          <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-accent-blue text-white px-3 py-2">205/55R16</div>
          <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-bg-tertiary text-text-primary px-3 py-2 whitespace-pre-line text-xs">{t('int_bot_example_reply')}</div>
        </div>
      </Card>
    </div>
  )
}

export default BotTab
