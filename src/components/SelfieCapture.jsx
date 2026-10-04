import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Upload, RotateCcw, Check, AlertCircle } from 'lucide-react'
import { loadFaceModels, getFaceDescriptor } from '../utils/faceRecognition'

export const SelfieCapture = ({ onCapture, onCancel, allowUpload = false, disabled = false }) => {
  const { t } = useTranslation()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const streamRef = useRef(null)

  const [mode, setMode] = useState('idle') // idle | camera | preview | upload_preview
  const [capturedImage, setCapturedImage] = useState(null)
  const [fromCamera, setFromCamera] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [noFaceError, setNoFaceError] = useState(false)

  useEffect(() => {
    loadFaceModels()
  }, [])

  const startCamera = async () => {
    setLoading(true)
    setCameraError(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setMode('camera')
    } catch (err) {
      setCameraError(true)
      setMode('idle')
    } finally {
      setLoading(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const takeSnapshot = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(dataUrl)
    setFromCamera(true)
    stopCamera()
    setMode('preview')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCapturedImage(ev.target.result)
      setFromCamera(false)
      setMode('preview')
    }
    reader.readAsDataURL(file)
  }

  const retake = () => {
    setCapturedImage(null)
    setMode('idle')
    setNoFaceError(false)
    stopCamera()
  }

  const confirm = async () => {
    if (!capturedImage) return
    setProcessing(true)
    setNoFaceError(false)
    const descriptor = await getFaceDescriptor(capturedImage)
    setProcessing(false)
    if (!descriptor) {
      setNoFaceError(true)
      return
    }
    onCapture(capturedImage, descriptor)
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-6 w-full max-w-sm mx-auto">
      <canvas ref={canvasRef} className="hidden" />

      {/* Title */}
      <div className="text-center">
        <h3 className="text-text-primary font-syne font-bold text-xl">
          {t('selfie_title')}
        </h3>
        <p className="text-text-secondary text-sm mt-1">
          {t('selfie_subtitle')}
        </p>
      </div>

      {/* Camera / Preview Area */}
      <div className="relative w-64 h-64 rounded-2xl overflow-hidden bg-bg-tertiary border-2 border-border flex items-center justify-center">
        
        {/* Camera stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${mode === 'camera' ? 'block' : 'hidden'}`}
        />

        {/* Captured image preview */}
        {mode === 'preview' && capturedImage && (
          <img
            src={capturedImage}
            alt="selfie"
            className={`absolute inset-0 w-full h-full object-cover ${fromCamera ? '-scale-x-100' : ''}`}
          />
        )}

        {/* Idle state */}
        {mode === 'idle' && (
          <div className="flex flex-col items-center gap-3 p-4 sm:p-6 text-center">
            {cameraError ? (
              <>
                <AlertCircle size={40} className="text-accent-orange" />
                <p className="text-text-secondary text-sm">{t('selfie_camera_error')}</p>
                <p className="text-text-muted text-xs">{t('selfie_camera_hint')}</p>
              </>
            ) : (
              <>
                <Camera size={40} className="text-text-muted" />
                <p className="text-text-secondary text-sm">{t('selfie_tip')}</p>
              </>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-primary bg-opacity-80">
            <div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Camera frame overlay */}
        {mode === 'camera' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-accent-red rounded-tl-lg" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-accent-red rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-accent-red rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-accent-red rounded-br-lg" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full">

        {/* IDLE mode buttons */}
        {mode === 'idle' && (
          <>
            {!cameraError && (
              <button
                onClick={startCamera}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-accent-red text-white font-dm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Camera size={18} />
                {t('selfie_capture')}
              </button>
            )}
            {allowUpload && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-bg-tertiary border border-border text-text-primary font-dm hover:border-accent-blue transition-colors"
                >
                  <Upload size={18} />
                  {t('selfie_upload')}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </>
            )}
          </>
        )}

        {/* CAMERA mode buttons */}
        {mode === 'camera' && (
          <button
            onClick={takeSnapshot}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-accent-red text-white font-dm font-medium hover:opacity-90 transition-opacity"
          >
            <Camera size={18} />
            {t('selfie_capture')}
          </button>
        )}

        {/* PREVIEW mode buttons */}
        {mode === 'preview' && (
          <>
            {noFaceError && (
              <p className="text-accent-orange text-sm text-center">{t('selfie_no_face')}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={retake}
                className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl bg-bg-tertiary border border-border text-text-primary font-dm hover:border-accent-orange transition-colors"
              >
                <RotateCcw size={18} />
                {t('selfie_retake')}
              </button>
              <button
                onClick={confirm}
                disabled={processing || disabled}
                className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl bg-accent-green text-white font-dm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                {processing ? t('selfie_processing') : t('confirm')}
              </button>
            </div>
          </>
        )}

        {/* Cancel */}
        {onCancel && (
          <button
            onClick={() => { stopCamera(); onCancel(); }}
            className="text-text-muted text-sm hover:text-text-secondary transition-colors text-center"
          >
            {t('cancel')}
          </button>
        )}
      </div>
    </div>
  )
}
