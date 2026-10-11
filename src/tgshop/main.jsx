import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './tgshop.css'

const tg = window.Telegram?.WebApp
try {
  tg?.ready()
  tg?.expand()
  tg?.setHeaderColor?.('secondary_bg_color')
  tg?.setBackgroundColor?.('secondary_bg_color')
} catch {}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
