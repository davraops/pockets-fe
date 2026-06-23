import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { applyTheme, getStoredTheme } from './utils/userTheme'
import './index.css'

// Apply stored theme before first paint (avoids flash; ThemeProvider syncs after mount)
applyTheme(getStoredTheme())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
