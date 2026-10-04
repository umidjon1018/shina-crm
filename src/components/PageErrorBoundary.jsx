import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import i18n from 'i18next'

// Sahifa ichidagi render xatosi butun ilovani oq ekranga aylantirmasligi uchun
class PageErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Sahifa xatosi:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    const t = (k, d) => i18n.t(k, { defaultValue: d })
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-accent-red/10 flex items-center justify-center">
          <AlertTriangle size={26} className="text-accent-red" />
        </div>
        <h2 className="font-syne font-bold text-lg text-text-primary">{t('page_error_title', "Bu bo'limda xatolik yuz berdi")}</h2>
        <p className="text-sm text-text-secondary max-w-sm">{t('page_error_desc', "Boshqa bo'limlar ishlayapti. Sahifani yangilab ko'ring; takrorlansa — administratorga xabar bering.")}</p>
        <p className="text-[11px] text-text-muted font-mono max-w-sm break-all">{String(this.state.error?.message || this.state.error).slice(0, 200)}</p>
        <button onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-red text-white text-sm font-bold">
          <RotateCcw size={15} /> {t('page_error_reload', 'Yangilash')}
        </button>
      </div>
    )
  }
}

export default PageErrorBoundary
