/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        sidebar: 'var(--sidebar-bg)',
        border: {
          DEFAULT: 'var(--border)',
          bright: 'var(--border-bright)',
        },
        accent: {
          red: 'var(--accent-red)',
          orange: 'var(--accent-orange)',
          blue: 'var(--accent-blue)',
          green: 'var(--accent-green)',
          violet: 'var(--accent-violet)',
          pink: 'var(--accent-pink)',
          cyan: 'var(--accent-cyan)',
        },
        sidebarText: 'var(--sidebar-text)',
        sidebarMuted: 'var(--sidebar-muted)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        glow: {
          red: 'var(--glow-red)',
          blue: 'var(--glow-blue)',
        }
      },
      // Sarlavhalar ham toza DM Sans (avval Syne edi) — font-syne sinfi o'zgarmadi
      fontFamily: {
        syne: ['DM Sans', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      // Yirik yozuv: xs 13px, sm 15px (avval 12/14)
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.15rem' }],
        sm: ['0.9375rem', { lineHeight: '1.375rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
      },
      backgroundImage: {
        'red-gradient': 'linear-gradient(to right, #E63946, #C1121F)',
      },
      boxShadow: {
        'glow-red': '0 0 20px var(--glow-red)',
        'glow-blue': '0 0 20px var(--glow-blue)',
      },
      animation: {
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        }
      }
    },
  },
  plugins: [],
}
