import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const Input = ({ 
  label, 
  icon: Icon, 
  type = 'text', 
  error, 
  className, 
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={twMerge('space-y-1.5 w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary px-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-red transition-colors">
            <Icon size={20} />
          </div>
        )}
        <input
          type={inputType}
          className={clsx(
            'w-full bg-bg-tertiary border border-border text-text-primary rounded-xl px-4 py-3 outline-none transition-all duration-200',
            'focus:border-accent-red focus:ring-4 focus:ring-accent-red/10',
            Icon && 'pl-12',
            isPassword && 'pr-12',
            error && 'border-accent-red shadow-[0_0_10px_var(--glow-red)]'
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-accent-red font-medium px-1 mt-1 animate-shake">
          {error}
        </p>
      )}
    </div>
  )
}
