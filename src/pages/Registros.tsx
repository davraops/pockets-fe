import '../App.css'
import './AppPage.css'
import './Registros.css'
import { useNavigate } from 'react-router-dom'
import BookIcon from '@mui/icons-material/Book'
import LockIcon from '@mui/icons-material/Lock'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import CalculateIcon from '@mui/icons-material/Calculate'
import FolderIcon from '@mui/icons-material/Folder'
import PeopleIcon from '@mui/icons-material/People'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import InventoryIcon from '@mui/icons-material/Inventory'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { sectionColor } from '../constants/sectionColors'

const REGISTROS_HUB_ROWS = [
  {
    section: 'Cuadernos',
    rows: [
      {
        path: '/registros/cuadernos',
        label: 'Ir a Cuadernos',
        title: 'Cuadernos',
        subtitle: 'Gestiona tus cuadernos de notas',
        icon: BookIcon,
        color: sectionColor.blue,
      },
    ],
  },
  {
    section: 'Herramientas',
    rows: [
      {
        path: '/registros/calculadora',
        label: 'Ir a Calculadora',
        title: 'Calculadora',
        subtitle: 'Realiza cálculos rápidos',
        icon: CalculateIcon,
        color: sectionColor.success,
      },
      {
        path: '/registros/archivos',
        label: 'Ir a Archivos',
        title: 'Archivos',
        subtitle: 'Gestiona tus documentos',
        icon: FolderIcon,
        color: sectionColor.utilidades,
      },
      {
        path: '/registros/empleados',
        label: 'Ir a Empleados',
        title: 'Empleados',
        subtitle: 'Gestiona información de empleados',
        icon: PeopleIcon,
        color: sectionColor.lifestyle,
      },
      {
        path: '/registros/vehiculos',
        label: 'Ir a Vehículos',
        title: 'Vehículos',
        subtitle: 'Gestiona información de vehículos',
        icon: DirectionsCarIcon,
        color: sectionColor.indigo,
      },
      {
        path: '/registros/patrimonio',
        label: 'Ir a Patrimonio',
        title: 'Patrimonio',
        subtitle: 'Gestiona inventario de items valiosos',
        icon: InventoryIcon,
        color: sectionColor.lifestyle,
      },
    ],
  },
  {
    section: 'Secretos',
    rows: [
      {
        path: '/registros/generador-contrasenas',
        label: 'Ir a Generador de Contraseñas',
        title: 'Generador de Contraseñas',
        subtitle: 'Crea contraseñas seguras y únicas',
        icon: VpnKeyIcon,
        color: sectionColor.blue,
      },
      {
        path: '/registros/secretos',
        label: 'Ir a Secretos',
        title: 'Secretos',
        subtitle: 'Almacena información confidencial',
        icon: LockIcon,
        color: sectionColor.danger,
      },
    ],
  },
] as const

function Registros() {
  const navigate = useNavigate()

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content registros-content">
        <div className="app-toolbar">
          <button
            className="app-toolbar-button"
            onClick={() => navigate('/')}
            aria-label="Volver al inicio"
            type="button"
          >
            <ArrowBackIcon className="app-toolbar-icon" />
          </button>
        </div>

        <h1 className="app-page-title">Utilidades</h1>
        <p className="registros-page-subtitle">Herramientas útiles para tu día a día</p>

        <div className="crud-hub-list">
          {REGISTROS_HUB_ROWS.map(group => (
            <div key={group.section} className="crud-hub-section">
              <div className="crud-hub-section-header">{group.section}</div>
              <div className="glass-group">
                {group.rows.map(row => {
                  const Icon = row.icon
                  return (
                    <button
                      key={row.path}
                      className="crud-hub-row"
                      onClick={() => navigate(row.path)}
                      aria-label={row.label}
                      type="button"
                    >
                      <div
                        className="crud-hub-row-icon"
                        style={{ backgroundColor: row.color }}
                        aria-hidden="true"
                      >
                        <Icon />
                      </div>
                      <div className="crud-row-content">
                        <span className="crud-row-title">{row.title}</span>
                        <span className="crud-row-subtitle">{row.subtitle}</span>
                      </div>
                      <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Registros
