import '../App.css'
import './AppPage.css'
import './Registros.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BookIcon from '@mui/icons-material/Book'
import LockIcon from '@mui/icons-material/Lock'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import CalculateIcon from '@mui/icons-material/Calculate'
import FolderIcon from '@mui/icons-material/Folder'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

function Registros() {
  const navigate = useNavigate()

  return (
    <div className="app-page-container">
      <div className="app-page-content registros-content">
        {/* Toolbar - HIG: Navigation */}
        <div className="registros-toolbar">
          <button
            className="registros-toolbar-button"
            onClick={() => navigate('/')}
            aria-label="Volver al inicio"
            type="button"
          >
            <ArrowBackIcon className="registros-toolbar-icon" />
          </button>
        </div>

        <h1 className="registros-page-title">Utilidades</h1>
        <p className="registros-page-subtitle">Herramientas útiles para tu día a día</p>

        {/* Lista de Secciones */}
        <div className="settings-list">
          {/* Sección: Cuadernos */}
          <div className="settings-section">
            <div className="settings-section-header">Cuadernos</div>
            <div className="settings-group">
              <button
                className="settings-row"
                onClick={() => navigate('/registros/cuadernos')}
                aria-label="Ir a Cuadernos"
                type="button"
              >
                <div
                  className="settings-row-icon"
                  style={{ backgroundColor: '#007AFF' }}
                  aria-hidden="true"
                >
                  <BookIcon />
                </div>
                <div className="settings-row-content">
                  <span className="settings-row-title">Cuadernos</span>
                  <span className="settings-row-subtitle">Gestiona tus cuadernos de notas</span>
                </div>
                <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Sección: Herramientas */}
          <div className="settings-section">
            <div className="settings-section-header">Herramientas</div>
            <div className="settings-group">
              <button
                className="settings-row"
                onClick={() => navigate('/registros/calculadora')}
                aria-label="Ir a Calculadora"
                type="button"
              >
                <div
                  className="settings-row-icon"
                  style={{ backgroundColor: '#34C759' }}
                  aria-hidden="true"
                >
                  <CalculateIcon />
                </div>
                <div className="settings-row-content">
                  <span className="settings-row-title">Calculadora</span>
                  <span className="settings-row-subtitle">Realiza cálculos rápidos</span>
                </div>
                <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
              </button>
              <button
                className="settings-row"
                onClick={() => navigate('/registros/archivos')}
                aria-label="Ir a Archivos"
                type="button"
              >
                <div
                  className="settings-row-icon"
                  style={{ backgroundColor: '#007AFF' }}
                  aria-hidden="true"
                >
                  <FolderIcon />
                </div>
                <div className="settings-row-content">
                  <span className="settings-row-title">Archivos</span>
                  <span className="settings-row-subtitle">Gestiona tus documentos</span>
                </div>
                <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Sección: Secretos */}
          <div className="settings-section">
            <div className="settings-section-header">Secretos</div>
            <div className="settings-group">
              <button
                className="settings-row"
                onClick={() => navigate('/registros/generador-contrasenas')}
                aria-label="Ir a Generador de Contraseñas"
                type="button"
              >
                <div
                  className="settings-row-icon"
                  style={{ backgroundColor: '#007AFF' }}
                  aria-hidden="true"
                >
                  <VpnKeyIcon />
                </div>
                <div className="settings-row-content">
                  <span className="settings-row-title">Generador de Contraseñas</span>
                  <span className="settings-row-subtitle">Crea contraseñas seguras y únicas</span>
                </div>
                <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
              </button>
              <button
                className="settings-row"
                onClick={() => navigate('/registros/secretos')}
                aria-label="Ir a Secretos"
                type="button"
              >
                <div
                  className="settings-row-icon"
                  style={{ backgroundColor: '#FF3B30' }}
                  aria-hidden="true"
                >
                  <LockIcon />
                </div>
                <div className="settings-row-content">
                  <span className="settings-row-title">Secretos</span>
                  <span className="settings-row-subtitle">Almacena información confidencial</span>
                </div>
                <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Registros

