import { useTheme } from '../contexts/ThemeContext'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import './ThemeToggle.css'

function ThemeToggle() {
  const { theme, toggleTheme, isDarkMode } = useTheme()

  return (
    <button
      className="theme-toggle-button"
      onClick={toggleTheme}
      aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-pressed={isDarkMode}
      title={isDarkMode ? 'Modo oscuro activo' : 'Modo claro activo'}
    >
      <div
        className={`theme-toggle-track ${isDarkMode ? 'theme-toggle-track-dark' : 'theme-toggle-track-light'}`}
      >
        <div
          className={`theme-toggle-thumb ${isDarkMode ? 'theme-toggle-thumb-dark' : 'theme-toggle-thumb-light'}`}
        >
          {isDarkMode ? (
            <DarkModeIcon className="theme-toggle-icon" />
          ) : (
            <LightModeIcon className="theme-toggle-icon" />
          )}
        </div>
      </div>
    </button>
  )
}

export default ThemeToggle
