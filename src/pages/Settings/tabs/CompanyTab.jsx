import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building, Settings, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useAuditStore } from '../../../store/auditStore'
import { useAuthStore } from '../../../store/authStore'

function CompanyTab() {
  const { t, i18n } = useTranslation()
  const {
    companyName, companyLogo, companyLogoOriginal, loginIconMode, loginPageTitle, sidebarLogoSize,
    setCompanyName, setCompanyLogo, setCompanyLogoOriginal, setLoginIconMode, setLoginPageTitle, setSidebarLogoSize,
    sidebarLabels, hiddenPages, setSidebarLabel, toggleHiddenPage,
  } = useSettingsStore()
  const { addLog } = useAuditStore()
  const { user: me } = useAuthStore()

  const getSidebarLabel = (labels, key, lang) => {
    const val = labels?.[key]
    if (!val) return ''
    if (typeof val === 'string') return val
    return val[lang] || val['uz'] || ''
  }

  const [companyNameForm, setCompanyNameForm] = useState(companyName)
  const [companySaved, setCompanySaved] = useState(false)
  const [loginTitleForm, setLoginTitleForm] = useState(loginPageTitle ?? '')
  const [loginTitleSaved, setLoginTitleSaved] = useState(false)
  const [showCrop, setShowCrop]   = useState(false)
  const [cropPad, setCropPad]     = useState({ top: 0, right: 0, bottom: 0, left: 0 })

  const srcLogo = companyLogoOriginal || companyLogo

  const autoTrimLogo = () => {
    if (!srcLogo) return
    const img = new Image()
    img.onload = () => {
      const W = img.width, H = img.height
      const c = document.createElement('canvas')
      c.width = W; c.height = H
      c.getContext('2d').drawImage(img, 0, 0)
      const d = c.getContext('2d').getImageData(0, 0, W, H).data
      const blank = (x, y) => { const i=(y*W+x)*4; return d[i+3]<20||(d[i]>240&&d[i+1]>240&&d[i+2]>240) }
      let t=0, b=H-1, l=0, r=W-1
      while (t<H && Array.from({length:W},(_,x)=>x).every(x=>blank(x,t))) t++
      while (b>t && Array.from({length:W},(_,x)=>x).every(x=>blank(x,b))) b--
      while (l<W && Array.from({length:H},(_,y)=>y).every(y=>blank(l,y))) l++
      while (r>l && Array.from({length:H},(_,y)=>y).every(y=>blank(r,y))) r--
      const p=6
      t=Math.max(0,t-p); b=Math.min(H-1,b+p); l=Math.max(0,l-p); r=Math.min(W-1,r+p)
      const out = document.createElement('canvas')
      out.width=r-l+1; out.height=b-t+1
      out.getContext('2d').drawImage(c, l, t, out.width, out.height, 0, 0, out.width, out.height)
      setCompanyLogo(out.toDataURL('image/png'))
    }
    img.src = srcLogo
  }

  const applyCropPad = () => {
    if (!srcLogo) return
    const img = new Image()
    img.onload = () => {
      const W = img.width, H = img.height
      const tPx=Math.round(H*cropPad.top/100), bPx=Math.round(H*cropPad.bottom/100)
      const lPx=Math.round(W*cropPad.left/100), rPx=Math.round(W*cropPad.right/100)
      const w=W-lPx-rPx, h=H-tPx-bPx
      if (w<=0||h<=0) return
      const canvas = document.createElement('canvas')
      canvas.width=w; canvas.height=h
      canvas.getContext('2d').drawImage(img, lPx, tPx, w, h, 0, 0, w, h)
      setCompanyLogo(canvas.toDataURL('image/png'))
      setShowCrop(false)
      setCropPad({ top:0, right:0, bottom:0, left:0 })
    }
    img.src = srcLogo
  }

  const restoreOriginalLogo = () => {
    if (companyLogoOriginal) {
      setCompanyLogo(companyLogoOriginal)
      setCropPad({ top: 0, right: 0, bottom: 0, left: 0 })
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl">

      {/* Kompaniya */}
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-red/10 text-accent-red rounded-xl flex items-center justify-center"><Building size={20}/></div>
          <div>
            <h3 className="font-syne font-bold text-text-primary text-base">🏢 {t('adm_set_company_title')}</h3>
            <p className="text-xs text-text-muted">{t('adm_set_company_subtitle')}</p>
          </div>
        </div>
        <div>
          <label className="text-text-secondary text-xs font-medium block mb-2">{t('adm_set_logo_label')}</label>
          <div className="flex items-center gap-3">
            {companyLogo
              ? <img src={companyLogo} alt="logo" className="w-12 h-12 rounded-xl object-contain border border-border bg-bg-tertiary"/>
              : <div className="w-12 h-12 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center text-text-muted text-xs">{t('adm_set_logo_none')}</div>
            }
            <div className="flex gap-2 flex-wrap">
              <label className="cursor-pointer px-3 py-2 rounded-xl bg-bg-tertiary border border-border text-text-secondary text-xs hover:text-text-primary transition-colors">
                {t('adm_set_logo_upload')}
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files[0]; if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => {
                    setCompanyLogo(ev.target.result)
                    setCompanyLogoOriginal(ev.target.result)
                    setShowCrop(false)
                    setCropPad({ top:0, right:0, bottom:0, left:0 })
                  }
                  reader.readAsDataURL(file)
                }} />
              </label>
              {companyLogo && (
                <button onClick={() => setShowCrop(v => !v)} className={`px-3 py-2 rounded-xl border text-xs transition-colors ${showCrop ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}>
                  Crop
                </button>
              )}
              {companyLogo && <button onClick={() => { setCompanyLogo(null); setCompanyLogoOriginal(null); setShowCrop(false) }} className="px-3 py-2 rounded-xl bg-accent-red/10 text-accent-red text-xs hover:bg-accent-red/20 transition-colors">{t('adm_set_logo_delete')}</button>}
            </div>
          </div>

          {/* Crop panel */}
          {showCrop && companyLogo && (
            <div className="mt-3 p-4 rounded-xl border border-border bg-bg-tertiary space-y-3">
              {/* Preview */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ background: 'repeating-conic-gradient(#aaa 0% 25%, #fff 0% 50%) 0 0 / 10px 10px' }}>
                  {srcLogo && (
                    <img src={srcLogo} alt="preview" className="w-full h-full object-contain" style={{
                      clipPath: `inset(${cropPad.top}% ${cropPad.right}% ${cropPad.bottom}% ${cropPad.left}%)`
                    }} />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  {[
                    { k:'top',    label:'Yuqori' },
                    { k:'bottom', label:'Pastki' },
                    { k:'left',   label:'Chap' },
                    { k:'right',  label:'O\'ng' },
                  ].map(({ k, label }) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted w-12">{label}</span>
                      <input type="range" min={0} max={49} value={cropPad[k]}
                        onChange={e => setCropPad(p => ({ ...p, [k]: +e.target.value }))}
                        className="flex-1 accent-accent-red h-1" />
                      <span className="text-[10px] text-text-muted w-6 text-right">{cropPad[k]}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={autoTrimLogo} className="px-3 py-1.5 rounded-lg bg-bg-primary border border-border text-xs text-text-secondary hover:text-text-primary transition-colors">
                  Avtomatik kesish
                </button>
                <button onClick={applyCropPad} className="px-3 py-1.5 rounded-lg bg-accent-red text-white text-xs font-bold hover:opacity-90 transition-colors">
                  Qo'llash
                </button>
                {companyLogo !== companyLogoOriginal && (
                  <button onClick={restoreOriginalLogo} className="px-3 py-1.5 rounded-lg bg-accent-blue/10 text-accent-blue text-xs hover:bg-accent-blue/20 transition-colors">
                    Aslini tiklash
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sidebar logo o'lchami */}
          {companyLogo && (
            <div className="mt-3">
              <label className="text-text-secondary text-xs font-medium block mb-2">Sidebar logo o'lchami</label>
              <div className="flex gap-2">
                {[
                  { id: 'small',  label: 'Kichik',  size: '32px', cls: 'w-8 h-8' },
                  { id: 'medium', label: "O'rta",   size: '48px', cls: 'w-12 h-12' },
                  { id: 'large',  label: 'Katta',   size: '64px', cls: 'w-16 h-16' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSidebarLogoSize(opt.id)}
                    className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                      sidebarLogoSize === opt.id
                        ? 'border-accent-red bg-accent-red/10'
                        : 'border-border bg-bg-primary hover:border-text-muted'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      <img src={companyLogo} alt="" className={`${opt.cls} object-contain rounded`} />
                    </div>
                    <p className={`text-xs font-bold ${sidebarLogoSize === opt.id ? 'text-accent-red' : 'text-text-primary'}`}>{opt.label}</p>
                    <p className="text-[10px] text-text-muted">{opt.size}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="text-text-secondary text-xs font-medium block mb-2">Login sahifasidagi belgi</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'animation', label: "Aylanadigan g'ildirak", desc: 'Animatsiyali, brend logosiz' },
              { id: 'logo',      label: 'Kompaniya logosi',     desc: 'Yuklangan logo ko\'rinadi' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setLoginIconMode(opt.id)}
                disabled={opt.id === 'logo' && !companyLogo}
                className={`p-3 rounded-xl border text-left transition-all ${
                  loginIconMode === opt.id
                    ? 'border-accent-red bg-accent-red/10'
                    : 'border-border bg-bg-tertiary hover:border-text-muted'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <p className={`text-sm font-bold ${loginIconMode === opt.id ? 'text-accent-red' : 'text-text-primary'}`}>{opt.label}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{opt.id === 'logo' && !companyLogo ? 'Logo yuklanmagan' : opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-text-secondary text-xs font-medium block mb-2">{t('adm_set_company_name')}</label>
          <p className="text-[10px] text-text-muted mb-1.5">Ilova ichida (sidebar, sarlavha) ko'rinadigan nom</p>
          <div className="flex items-center gap-3">
            <input type="text" value={companyNameForm} onChange={e=>setCompanyNameForm(e.target.value)} placeholder={t('adm_set_company_placeholder')}
              className="flex-1 bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-text-primary focus:outline-none focus:border-accent-red text-sm" />
            <button onClick={()=>{ if(!companyNameForm.trim()) return; setCompanyName(companyNameForm.trim()); setCompanySaved(true); setTimeout(()=>setCompanySaved(false),2000) }}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1 flex-shrink-0 transition-all ${companySaved ? 'bg-accent-green text-white' : 'bg-accent-red text-white hover:opacity-90 shadow-glow-red'}`}>
              {companySaved ? <CheckCircle size={16}/> : t('save')}
            </button>
          </div>
        </div>
        <div>
          <label className="text-text-secondary text-xs font-medium block mb-2">Login sahifasi nomi</label>
          <p className="text-[10px] text-text-muted mb-1.5">Bo'sh qolsa — yuqoridagi kompaniya nomi ishlatiladi</p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={loginTitleForm}
              onChange={e => setLoginTitleForm(e.target.value)}
              placeholder={companyName || 'Misol: Good Tires CRM'}
              className="flex-1 bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-text-primary focus:outline-none focus:border-accent-red text-sm"
            />
            <button
              onClick={() => {
                setLoginPageTitle(loginTitleForm.trim())
                setLoginTitleSaved(true)
                setTimeout(() => setLoginTitleSaved(false), 2000)
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1 flex-shrink-0 transition-all ${loginTitleSaved ? 'bg-accent-green text-white' : 'bg-accent-red text-white hover:opacity-90 shadow-glow-red'}`}
            >
              {loginTitleSaved ? <CheckCircle size={16}/> : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>

      {/* Konfiguratsiya */}
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-red/10 text-accent-red rounded-xl flex items-center justify-center"><Settings size={20}/></div>
          <div>
            <h3 className="font-syne font-bold text-text-primary text-base">⚙️ {t('adm_set_config_title')}</h3>
            <p className="text-xs text-text-muted">{t('adm_set_config_subtitle')}</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { key:'dashboard', icon:'🏠', defaultLabel: t('dashboard') }, { key:'warehouse', icon:'📦', defaultLabel: t('warehouse') },
            { key:'sales', icon:'🛒', defaultLabel: t('sales') }, { key:'wholesale', icon:'🚚', defaultLabel: t('wh_page_title') },
            { key:'customers', icon:'👥', defaultLabel: t('customers') },
            { key:'marketing', icon:'📣', defaultLabel: t('mkt_page_title') },
            { key:'income', icon:'📈', defaultLabel: t('income') }, { key:'expenses', icon:'💳', defaultLabel: t('fin_page_title') },
            { key:'reports', icon:'📊', defaultLabel: t('reports') }, { key:'aiAgent', icon:'🤖', defaultLabel: t('ai_agent') },
            { key:'integrations', icon:'🔌', defaultLabel: t('int_page_title') },
            { key:'management', icon:'⚡', defaultLabel: t('management') },
          ].map(({ key, icon, defaultLabel }) => {
            const isHidden = (hiddenPages||[]).includes(key)
            const currentLabel = getSidebarLabel(sidebarLabels, key, i18n.language) || defaultLabel
            return (
              <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isHidden ? 'opacity-40 bg-bg-tertiary border-border/50' : 'bg-bg-tertiary border-border'}`}>
                <span className="text-base w-6 text-center flex-shrink-0">{icon}</span>
                <input type="text" value={currentLabel} disabled={isHidden} onChange={e=>setSidebarLabel(key, e.target.value, i18n.language)}
                  className="flex-1 bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-red disabled:cursor-not-allowed" />
                <button onClick={()=>toggleHiddenPage(key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isHidden ? 'bg-accent-green/10 text-accent-green hover:bg-accent-green/20' : 'bg-bg-primary text-text-muted hover:text-accent-red hover:bg-accent-red/10 border border-border'}`}>
                  {isHidden ? t('adm_set_page_show') : t('adm_set_page_hide')}
                </button>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}


export default CompanyTab
