import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useTranslation } from 'react-i18next'

export const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  ...props
}) => {
  const { t } = useTranslation()
  const variants = {
    primary: 'bg-red-gradient text-white shadow-glow-red hover:shadow-[0_0_25px_var(--glow-red)]',
    secondary: 'bg-bg-tertiary text-text-primary border border-border hover:border-border-bright',
    outline: 'bg-transparent border border-accent-red text-accent-red hover:bg-accent-red hover:text-white',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={twMerge(
        'relative inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none overflow-hidden',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{t('btn_loading')}</span>
        </div>
      ) : children}
    </motion.button>
  )
}
