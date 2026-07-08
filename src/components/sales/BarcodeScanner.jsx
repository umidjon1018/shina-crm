import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Barcode, Camera, X, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BrowserMultiFormatReader } from '@zxing/library'
import { findItemByBarcode } from '../../api/itemService'

const BarcodeScanner = ({ onScan, allowSold = false, user, addNotification, notificationSettings }) => {
  const { t } = useTranslation()
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [error, setError] = useState(null)
  const videoRef = useRef(null)
  const codeReaderRef = useRef(new BrowserMultiFormatReader())

  const processScan = async (barcode) => {
    if (!barcode?.trim()) return
    setError(null)

    const result = await findItemByBarcode(barcode.trim())

    if (!result) {
      setError({ type: 'not_found', message: t('sl_bc_err_not_found') })
      setTimeout(() => setError(null), 4000)
      return
    }

    const { item: anyItem, product } = result

    if (!allowSold) {
      if (anyItem.status === 'sold') {
        if (notificationSettings?.BARCODE_SOLD_RESCAN !== false) {
          addNotification && addNotification({
            type: 'BARCODE_SOLD_RESCAN',
            severity: 'warning',
            title: 'Sotilgan tovar barkodi kiritildi',
            message: `"${product?.name || anyItem.barcode}" allaqachon sotilgan tovar barkodi kiritildi`,
            titleKey: 'notif_title_barcode_sold_rescan',
            messageKey: 'notif_msg_barcode_sold_rescan',
            messageParams: { name: product?.name || anyItem.barcode },
            barcode: anyItem.barcode,
            itemId: anyItem.id,
            sellerId: user?.id,
            sellerName: user?.name,
          })
        }
        setError({ type: 'sold', message: t('sl_bc_err_sold') })
        setTimeout(() => setError(null), 4000)
        return
      }

      if (anyItem.status !== 'in_stock') {
        setError({ type: 'unavailable', message: t('sl_bc_err_unavailable', { status: anyItem.status }) })
        setTimeout(() => setError(null), 4000)
        return
      }
    } else {
      if (anyItem.status !== 'sold') {
        setError({ type: 'not_sold', message: t('sl_bc_err_not_sold') })
        setTimeout(() => setError(null), 4000)
        return
      }
    }

    if (!product) {
      setError({ type: 'not_found', message: t('sl_bc_err_no_product') })
      setTimeout(() => setError(null), 4000)
      return
    }

    if (!allowSold && anyItem.barcodeStatus === 'active') {
      onScan({ item: anyItem, product, warning: 'not_printed' })
      setManualCode('')
      return
    }

    onScan({ item: anyItem, product, warning: null })
    setManualCode('')
  }

  const handleManualScan = () => processScan(manualCode)

  const toggleCamera = () => {
    setIsCameraActive(prev => !prev)
    if (isCameraActive) codeReaderRef.current.reset()
  }

  useEffect(() => {
    if (isCameraActive && videoRef.current) {
      codeReaderRef.current.decodeFromVideoDevice(null, videoRef.current, (result) => {
        if (result) {
          processScan(result.getText())
          setIsCameraActive(false)
          codeReaderRef.current.reset()
        }
      })
    }
    return () => codeReaderRef.current.reset()
  }, [isCameraActive])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Barcode size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
            placeholder={t('sl_bc_placeholder')}
            className="w-full pl-10 pr-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-red transition-colors"
          />
        </div>
        <button
          onClick={handleManualScan}
          className="px-4 py-3 bg-accent-red text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          {t('sl_bc_submit')}
        </button>
        <button
          onClick={toggleCamera}
          className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 font-bold text-sm ${
            isCameraActive
              ? 'bg-accent-red text-white border-accent-red'
              : 'bg-bg-tertiary border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          <Camera size={18} /> {t('sl_bc_scan')}
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-accent-red/10 border border-accent-red/30 rounded-xl text-accent-red text-sm"
          >
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isCameraActive && (
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border">
          <video ref={videoRef} className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-2 border-accent-red/30 m-8 rounded-xl pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent-red" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent-red" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent-red" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent-red" />
          </div>
          <button onClick={toggleCamera} className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-lg">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default BarcodeScanner
