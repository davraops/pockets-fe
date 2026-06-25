import GavelIcon from '@mui/icons-material/Gavel'
import SettingsIcon from '@mui/icons-material/Settings'

interface ProcesoConsultaBannerProps {
  nombre: string
  onOpenAjustes: () => void
}

function ProcesoConsultaBanner({ nombre, onOpenAjustes }: ProcesoConsultaBannerProps) {
  return (
    <div className="procesos-consulta-banner" role="status">
      <div className="procesos-consulta-banner-icon" aria-hidden="true">
        <GavelIcon />
      </div>
      <div className="procesos-consulta-banner-copy">
        <p className="procesos-consulta-banner-label">Consulta en Rama Judicial</p>
        <p className="procesos-consulta-banner-name">{nombre}</p>
      </div>
      <button
        type="button"
        className="btn-base btn-secondary procesos-consulta-banner-action"
        onClick={onOpenAjustes}
        aria-label="Editar nombre completo en Ajustes"
      >
        <SettingsIcon aria-hidden="true" />
        <span>Ajustes</span>
      </button>
    </div>
  )
}

export default ProcesoConsultaBanner
