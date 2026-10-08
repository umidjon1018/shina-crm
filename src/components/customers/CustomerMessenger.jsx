import React from 'react'

// Mijozga Instagram (DM) yoki Telegram orqali xabar: tayyor shablonlar (tabrik, aksiya, mavsum)
const CustomerMessenger = ({ instagram, phone, name = '' }) => {
  const igHandle = instagram ? instagram.replace(/^@/, '') : ''
  const rawPhone = phone ? phone.replace(/\D/g, '') : ''
  const tgPhone  = rawPhone.startsWith('998') ? rawPhone : rawPhone ? '998' + rawPhone : ''
  const tgLink   = tgPhone ? `https://t.me/+${tgPhone}` : null

  const defaultTexts = [
    `Hurmatli ${(name || '').split(' ')[0]}, tug'ilgan kuningiz bilan! 🎉 Do'konimizdan maxsus sovg'a kutmoqda.`,
    `Salom ${(name || '').split(' ')[0]}! Siz uchun maxsus chegirma: -10%. Bugun bizga tashrif buyuring! 🚗`,
    `${(name || '').split(' ')[0]}, mavsumiy shina almashish vaqti keldi! Hozir keling — tez xizmat kafolat. ✅`,
  ]
  const tplLabels = ['Tabrik', 'Aksiya', 'Mavsum']
  const [dmMsg,      setDmMsg]      = React.useState('')
  const [tplTexts,   setTplTexts]   = React.useState(defaultTexts)
  const [editingTpl, setEditingTpl] = React.useState(-1)

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
      {igHandle && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-[10px]">IG</span>
          </div>
          <p className="text-text-primary text-sm font-medium">@{igHandle}</p>
        </div>
      )}
      <div className="flex gap-2 mb-2 flex-wrap">
        {tplLabels.map((label, i) => (
          <div key={label} className="flex items-center">
            <button onClick={() => { setDmMsg(tplTexts[i]); setEditingTpl(-1) }}
              className="px-2.5 py-1 rounded-l-lg text-[10px] font-bold border border-r-0 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors">
              {label}
            </button>
            <button onClick={() => setEditingTpl(editingTpl === i ? -1 : i)}
              title="Shablon matnini tahrirlash"
              className={`px-1.5 py-1 rounded-r-lg text-[10px] border border-purple-500/30 transition-colors ${editingTpl === i ? 'bg-purple-500/20 text-purple-300' : 'text-purple-400 hover:bg-purple-500/10'}`}>
              ✏️
            </button>
          </div>
        ))}
      </div>
      {editingTpl >= 0 && (
        <textarea
          value={tplTexts[editingTpl]}
          onChange={e => { const t = [...tplTexts]; t[editingTpl] = e.target.value; setTplTexts(t) }}
          rows={2}
          className="w-full bg-bg-secondary border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-text-primary resize-none focus:outline-none focus:border-purple-500/70 mb-2"
          placeholder="Shablon matnini tahrirlang..."
        />
      )}
      <textarea
        value={dmMsg}
        onChange={e => setDmMsg(e.target.value)}
        placeholder="Xabar matni..."
        rows={3}
        className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:border-purple-500/50 mb-2"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-text-muted text-xs flex-1">
          {igHandle && tgLink ? 'Instagram yoki Telegram orqali yuborish' : igHandle ? 'Instagram direct' : 'Telegram orqali'}
        </p>
        <div className="flex items-center gap-2">
          {/* Kelajak: Telegram bot tokeni settingsStore da saqlangan holda avtomatik yuborish */}
          {tgLink && (
            <a href={`${tgLink}`}
              target="_blank" rel="noopener noreferrer"
              title={`Telegram: +${tgPhone}`}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition-colors">
              TM yuborish
            </a>
          )}
          {/* Kelajak: Instagram Graph API yoki uchinchi tomon xizmat (manychat.com va sh.k.) orqali avtomatlashtirish */}
          {igHandle && (
            <a href={`https://ig.me/m/${igHandle}?text=${encodeURIComponent(dmMsg)}`}
              target="_blank" rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity">
              DM yuborish
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerMessenger
