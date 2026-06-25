import { useNavigate } from 'react-router-dom'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { TIEMPO_MODULE_GROUPS } from '../../constants/tiempoModules'
import { formatTiempoHubSubtitle, type TiempoHubStats } from './tiempoHubUtils'

interface TiempoHubModulesProps {
  stats: TiempoHubStats
  statsLoading: boolean
}

function TiempoHubModules({ stats, statsLoading }: TiempoHubModulesProps) {
  const navigate = useNavigate()

  return (
    <div className="tiempo-modules">
      {TIEMPO_MODULE_GROUPS.map(group => (
        <section key={group.header} aria-labelledby={`tiempo-module-${group.header}`}>
          <h3 id={`tiempo-module-${group.header}`} className="tiempo-modules-group-title">
            {group.header}
          </h3>
          <div className="glass-group">
            {group.modules.map(module => (
              <button
                key={module.id}
                type="button"
                className="tiempo-module-row"
                onClick={() => navigate(module.path)}
                aria-label={`Ir a ${module.title}`}
              >
                <div
                  className="tiempo-module-icon"
                  style={{ '--section-color': module.color } as React.CSSProperties}
                  aria-hidden="true"
                >
                  <module.Icon />
                </div>
                <div className="tiempo-module-body">
                  <span className="tiempo-module-title">{module.title}</span>
                  <span className="tiempo-module-sub">
                    {statsLoading ? 'Cargando…' : formatTiempoHubSubtitle(module.section, stats)}
                  </span>
                </div>
                <ChevronRightIcon className="tiempo-feed-chevron" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default TiempoHubModules
