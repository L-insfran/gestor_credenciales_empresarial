import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

;(function initTheme() {
  const stored = localStorage.getItem('gc_theme')
  const root = document.documentElement
  if (stored === 'light') root.classList.remove('dark')
  else if (stored === 'dark') root.classList.add('dark')
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
