import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useLangStore } from '../store/langStore'
import { useSettingsStore } from '../store/settingsStore'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { SelfieCapture } from '../components/SelfieCapture'

const TireIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
    <path d="M12 2V6M12 18V22M2 12H6M18 12H22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
)

// step: 'credentials' | 'selfie' | 'success'
const LoginPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { checkCredentials, submitSelfie, submitFaceReview, user } = useAuthStore()
  const { lang, setLang } = useLangStore()
  const { companyName, companyLogo, loginIconMode, loginPageTitle, loadBranding } = useSettingsStore()
  // Yangi qurilmada ham kompaniya nomi/logotipi serverdan
  useEffect(() => { loadBranding() }, [])

  // loginPageTitle bo'sh bo'lsa companyName ishlatiladi
  const displayTitle = loginPageTitle?.trim() || companyName || 'CRM'

  // Oxirgi so'z qizil rangda: "Good Tires" oq + "CRM" qizil
  const nameParts = displayTitle.trim().split(' ')
  const nameRed  = nameParts.pop()
  const nameMain = nameParts.join(' ')

  const [step, setStep] = useState('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(() => {
    // Real vaqtda chiqarib yuborilganda sababi ko'rsatiladi (bir marta)
    try {
      const r = sessionStorage.getItem('shina_logout_reason')
      if (r) { sessionStorage.removeItem('shina_logout_reason'); return r }
    } catch {}
    return ''
  })
  const [selfieError, setSelfieError] = useState('')
  const [faceAttempts, setFaceAttempts] = useState(0)
  const MAX_FACE_ATTEMPTS = 5

  // Step 1: check login + password
  const handleCredentials = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError(t('fill_all_fields'))
      return
    }
    setError('')
    setIsLoading(true)
    const result = await checkCredentials({ username, password })
    setIsLoading(false)
    if (result.success) {
      setStep('selfie')
    } else {
      setError(result.message)
    }
  }

  // Step 2: selfie captured
  const handleSelfie = async (selfieBase64, descriptor) => {
    if (isLoading) return
    setIsLoading(true)
    setSelfieError('')
    const result = await submitSelfie(selfieBase64, descriptor)
    setIsLoading(false)
    if (result.status === 'approved') {
      setStep('success')
      setTimeout(() => navigate('/dashboard'), 1200)
    } else if (result.status === 'pending') {
      navigate('/pending-approval')
    } else if (result.status === 'face_mismatch') {
      const next = faceAttempts + 1
      setFaceAttempts(next)
      if (next >= MAX_FACE_ATTEMPTS) {
        // 5 marta urinib bo'ldi — yuqori darajaga vizual tasdiqlash so'rovi yuborilsin
        setIsLoading(true)
        await submitFaceReview(selfieBase64)
        setIsLoading(false)
        navigate('/pending-approval')
      } else {
        setSelfieError(`${t('face_mismatch_error')} (${next}/${MAX_FACE_ATTEMPTS})`)
      }
    } else if (result.status === 'multi_device_blocked') {
      setSelfieError(t('multi_device_blocked_error'))
    } else if (result.status === 'error') {
      setSelfieError(result.message || t('err_network'))
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Left Branding Panel */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative lg:w-[40%] bg-[#060A10] flex flex-col items-center justify-center p-8 lg:p-12 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #E63946 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-accent-red/20 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {loginIconMode === 'logo' && companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="w-24 h-24 lg:w-32 lg:h-32 object-contain drop-shadow-[0_0_15px_rgba(230,57,70,0.4)]"
            />
          ) : (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
              <TireIcon className="w-24 h-24 lg:w-32 lg:h-32 text-accent-red drop-shadow-[0_0_15px_rgba(230,57,70,0.5)]" />
            </motion.div>
          )}
          <h1 className="mt-5 sm:mt-8 text-4xl lg:text-6xl font-syne font-extrabold text-white tracking-tighter">
            {nameMain && <>{nameMain} </>}<span className="text-accent-red">{nameRed}</span>
          </h1>
          <p className="mt-4 text-text-muted text-lg font-dm max-w-[280px]">
            {t('login_tagline')}
          </p>
          <div className="mt-12">
            <span className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-medium backdrop-blur-sm">
              v1.0.0
            </span>
          </div>
        </div>
      </motion.div>

      {/* Right Panel */}
      <div className="lg:w-[60%] bg-bg-primary flex flex-col items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setLang(lang === 'uz' ? 'ru' : 'uz')}
            title={lang === 'uz' ? 'Русский' : "O'zbek"}
            className="p-3 rounded-xl bg-bg-tertiary border border-border hover:border-accent-red transition-colors text-sm font-bold text-text-primary w-[46px] h-[46px] flex items-center justify-center"
          >
            {lang === 'uz' ? 'UZ' : 'RU'}
          </motion.button>
          <ThemeToggle />
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 1: Credentials */}
          {step === 'credentials' && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <div className="bg-bg-secondary p-8 lg:p-10 rounded-[2rem] border border-border shadow-2xl">
                <div className="mb-10">
                  <h2 className="text-2xl sm:text-3xl font-syne font-bold text-text-primary">{t('welcome')} 👋</h2>
                  <p className="text-text-secondary mt-2">{t('login_subtitle')}</p>
                </div>

                <form onSubmit={handleCredentials} className="space-y-4 sm:space-y-6">
                  <Input
                    label={t('username')}
                    icon={User}
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                  <Input
                    label={t('password')}
                    type="password"
                    icon={Lock}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />

                  <div className="flex items-center justify-end px-1">
                    <button type="button" className="text-sm text-accent-blue hover:underline font-medium">
                      {t('forgot_password')}
                    </button>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-accent-red/10 border border-accent-red/20 rounded-xl p-4 flex items-center gap-3 text-accent-red"
                      >
                        <AlertCircle size={20} />
                        <span className="text-sm font-medium">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button type="submit" className="w-full h-14 text-lg" isLoading={isLoading}>
                    {t('login_btn')}
                  </Button>
                </form>
              </div>
              <p className="mt-5 sm:mt-8 text-center text-text-muted text-sm">
                {t('login_terms')}{' '}
                <span className="text-text-secondary hover:underline cursor-pointer">{t('terms_link')}</span>{' '}
                {t('terms_end')}
              </p>
            </motion.div>
          )}

          {/* STEP 2: Selfie */}
          {step === 'selfie' && (
            <motion.div
              key="selfie"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <div className="bg-bg-secondary p-5 sm:p-8 rounded-[2rem] border border-border shadow-2xl">
                {selfieError && (
                  <div className="mb-4 sm:mb-6 bg-accent-red/10 border border-accent-red/20 rounded-xl p-4 flex items-center gap-3 text-accent-red">
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">{selfieError}</span>
                  </div>
                )}
                <SelfieCapture
                  onCapture={handleSelfie}
                  onCancel={() => { setSelfieError(''); setStep('credentials') }}
                  allowUpload={user?.role === 'admin'}
                  disabled={isLoading}
                />
              </div>
            </motion.div>
          )}

          {/* STEP 3: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <CheckCircle2 size={64} className="text-accent-green" />
              <p className="text-2xl font-syne font-bold text-text-primary">{t('login_success')}</p>
              <p className="text-text-secondary">{t('login_redirecting')}</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default LoginPage
