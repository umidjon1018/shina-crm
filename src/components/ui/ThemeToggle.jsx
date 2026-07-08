import { Sun, Moon, Palette } from 'lucide-react'
import { motion } from 'framer-motion'
import { useThemeStore } from '../../store/themeStore'

const THEMES = [
  { key: 'dark',  icon: Moon,    label: 'Dark',  color: 'text-accent-blue' },
  { key: 'light', icon: Sun,     label: 'Light', color: 'text-accent-orange' },
  { key: 'brand', icon: Palette, label: 'Brand', color: 'text-accent-red' },
]

export const ThemeToggle = () => {
  const { theme, setTheme } = useThemeStore()

  const current = THEMES.find(t => t.key === theme) || THEMES[0]
  const Icon = current.icon

  const cycleTheme = () => {
    const idx = THEMES.findIndex(t => t.key === theme)
    const next = THEMES[(idx + 1) % THEMES.length]
    setTheme(next.key)
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={cycleTheme}
      title={`Tema: ${current.label}`}
      className="p-3 rounded-xl bg-bg-tertiary border border-border hover:border-accent-red transition-colors"
    >
      <Icon size={20} className={current.color} />
    </motion.button>
  )
}
